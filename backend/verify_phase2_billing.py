import sys
import json
import urllib.request
import urllib.error
import time

BASE_URL = "http://127.0.0.1:8000"

def request_json(path, method="GET", body=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        res_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(res_body)
        except Exception:
            parsed = {"error": res_body}
        return e.code, parsed

def run_tests():
    print("==========================================================")
    print("NEXUS / CREATE CALL OS — PHASE 2 BILLING END-TO-END SUITE")
    print("==========================================================")
    
    passed = 0
    total = 0

    def assert_test(name, condition, extra=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  [PASS] {name} {extra}")
        else:
            print(f"  [FAIL] {name} {extra}")

    # 1. Billing Dashboard
    status, res = request_json("/api/billing")
    assert_test("1. GET /api/billing", status == 200 and "balance_usd" in res, f"Balance: ${res.get('balance_usd', 0)}")
    initial_balance = res.get("balance_usd", 0.0)

    # 2. Public Plans
    status, res = request_json("/api/plans")
    assert_test("2. GET /api/plans", status == 200 and isinstance(res, list) and len(res) >= 3, f"Plans loaded: {len(res)}")

    # 3. Currencies
    status, res = request_json("/api/billing/currencies")
    assert_test("3. GET /api/billing/currencies", status == 200 and len(res) >= 5, f"Currencies: {[c['code'] for c in res[:4]]}")

    # 4. Gateways
    status, res = request_json("/api/billing/gateways")
    assert_test("4. GET /api/billing/gateways (Zero Secrets)", status == 200 and all("secret_key" not in g for g in res), f"Gateways: {len(res)}")

    # 5. Coupon validation
    status, res = request_json("/api/billing/coupons/validate", method="POST", body={"code": "VIP20", "plan_id": "pro"})
    # VIP20 may or may not exist in default DB yet, so let's check response code or create if needed
    if status == 404:
        # Create coupon via admin
        status_c, res_c = request_json("/api/admin/billing/coupons", method="POST", body={"code": "VIP20", "discount_percent": 20.0, "max_uses": 100})
        status, res = request_json("/api/billing/coupons/validate", method="POST", body={"code": "VIP20", "plan_id": "pro"})
    assert_test("5. POST /api/billing/coupons/validate (Valid coupon)", status == 200 and res.get("valid") is True, f"Discount: {res.get('discount_percent')}%")

    # 6. Invalid coupon validation
    status_inv, res_inv = request_json("/api/billing/coupons/validate", method="POST", body={"code": "INVALID_CODE_999"})
    assert_test("6. POST /api/billing/coupons/validate (Invalid coupon)", status_inv == 404, "Correctly rejected")

    # 7. Subscription Purchase Initiate
    status, init_sub = request_json("/api/billing/checkout/initiate", method="POST", body={
        "mode": "subscription_purchase",
        "plan_id": "pro",
        "billing_cycle": "monthly",
        "currency": "USD",
        "billing_name": "Mukesh Enterprise",
        "billing_email": "mukesh@enterprise.com",
        "country": "United States",
        "gateway": "stripe"
    })
    assert_test("7. POST /api/billing/checkout/initiate (Subscription)", status == 201 and "security_hash" in init_sub, f"Tx ID: {init_sub.get('transaction_id')}")

    # 8. Subscription Verify & Provision
    status, ver_sub = request_json("/api/billing/checkout/verify", method="POST", body={
        "transaction_id": init_sub["transaction_id"],
        "security_hash": init_sub["security_hash"],
        "gateway": "stripe",
        "gateway_payment_id": "ch_stripe_test_123"
    })
    assert_test("8. POST /api/billing/checkout/verify (Subscription)", status == 200 and ver_sub.get("success") is True, f"Invoice: {ver_sub.get('invoice_number')}")

    # 9. Dedicated Wallet Top-Up Initiate ($150 USD)
    status, init_topup = request_json("/api/billing/checkout/initiate", method="POST", body={
        "mode": "wallet_topup",
        "topup_amount_usd": 150.0,
        "currency": "USD",
        "billing_name": "Mukesh Enterprise",
        "billing_email": "mukesh@enterprise.com",
        "country": "United States",
        "gateway": "razorpay"
    })
    assert_test("9. POST /api/billing/checkout/initiate (Dedicated Wallet Top-Up)", status == 201 and init_topup.get("mode") == "wallet_topup", f"Top-Up Amount: ${init_topup.get('amount_usd')}")

    # 10. Wallet Top-Up Verify & Server-Side Credit
    status, ver_topup = request_json("/api/billing/checkout/verify", method="POST", body={
        "transaction_id": init_topup["transaction_id"],
        "security_hash": init_topup["security_hash"],
        "gateway": "razorpay",
        "gateway_payment_id": "pay_rzp_topup_123"
    })
    assert_test("10. POST /api/billing/checkout/verify (Wallet Top-Up Credit)", status == 200 and ver_topup.get("mode") == "wallet_topup", f"New Balance: ${ver_topup.get('new_balance_usd')}")

    # 11. Verify Balance Increment in /api/billing
    status, res_bal = request_json("/api/billing")
    assert_test("11. GET /api/billing (Authoritative Balance Updated)", status == 200 and res_bal.get("balance_usd", 0) >= initial_balance + 150.0, f"Updated Balance: ${res_bal.get('balance_usd')}")

    # 12. Tampered Security Hash Rejection (Anti-Tamper Security)
    status_tamper, res_tamper = request_json("/api/billing/checkout/verify", method="POST", body={
        "transaction_id": init_sub["transaction_id"],
        "security_hash": "TAMPERED_FAKE_HASH_123456",
        "gateway": "stripe"
    })
    # Since init_sub was already completed, initiate a new one for tamper test
    status_t_init, t_init = request_json("/api/billing/checkout/initiate", method="POST", body={
        "mode": "wallet_topup",
        "topup_amount_usd": 50.0,
        "currency": "USD",
        "billing_name": "Attacker",
        "billing_email": "attacker@evil.com",
        "gateway": "stripe"
    })
    status_tamper, res_tamper = request_json("/api/billing/checkout/verify", method="POST", body={
        "transaction_id": t_init["transaction_id"],
        "security_hash": "TAMPERED_FAKE_HASH_0000000000000000000000",
        "gateway": "stripe"
    })
    assert_test("12. Anti-Tamper Security Check (Tampered Hash Rejected)", status_tamper == 400, f"Status: {status_tamper}")

    # 13. Offline Bank Wire Top-Up Submission
    status, off_sub = request_json("/api/billing/offline/submit", method="POST", body={
        "mode": "wallet_topup",
        "topup_amount_usd": 300.0,
        "currency": "USD",
        "bank_reference_utr": f"UTR-WIRE-{int(time.time())}",
        "billing_name": "Enterprise Wire Corp",
        "billing_email": "wire@enterprise.com"
    })
    assert_test("13. POST /api/billing/offline/submit (Wallet Top-Up)", status == 201 and "transaction_id" in off_sub, f"Status: {off_sub.get('status')}")

    # 14. Super Admin Approves Offline Bank Wire Top-Up
    status, app_off = request_json(f"/api/admin/billing/approve-offline/{off_sub['transaction_id']}", method="POST")
    assert_test("14. POST /api/admin/billing/approve-offline (Super Admin Approval)", status == 200 and app_off.get("mode") == "wallet_topup", f"New Balance: ${app_off.get('new_balance_usd')}")

    # 15. Invoices List
    status, inv_list = request_json("/api/billing/invoices")
    assert_test("15. GET /api/billing/invoices", status == 200 and isinstance(inv_list, list) and len(inv_list) >= 2, f"Total Invoices: {len(inv_list)}")

    # 16. Single Invoice Voucher
    if inv_list and len(inv_list) > 0:
        inv_id = inv_list[0]["id"]
        status, inv_single = request_json(f"/api/billing/invoices/{inv_id}")
        assert_test("16. GET /api/billing/invoices/{id}", status == 200 and inv_single.get("id") == inv_id, f"Invoice #: {inv_single.get('invoice_number')}")

    # 17. Transactions Stream
    status, tx_res = request_json("/api/billing/transactions?limit=20")
    assert_test("17. GET /api/billing/transactions", status == 200 and "transactions" in tx_res and len(tx_res["transactions"]) >= 2, f"Ledger Records: {tx_res.get('total')}")

    # 18. Billing Settings Persistence
    status, set_res = request_json("/api/billing/settings", method="PUT", body={
        "company_name": "Nexus Enterprise LLC",
        "billing_email": "finance@nexus.ai",
        "auto_recharge": True,
        "currency_preference": "USD"
    })
    assert_test("18. PUT /api/billing/settings", status == 200 and set_res.get("success") is True, f"Saved Settings: {set_res.get('message')}")

    print("==========================================================")
    print(f"RESULTS: {passed}/{total} Test Cases Passed Successfully")
    print("==========================================================")
    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
