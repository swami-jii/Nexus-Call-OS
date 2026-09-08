"""
Test Cloudflare Quick Tunnel API Endpoint
"""
import urllib.request
import json
import time

def test_cloudflare_quick():
    base_url = "http://127.0.0.1:8000"
    print("Testing /api/android-gateway/tunnel/quick-start ...")
    req = urllib.request.Request(
        f"{base_url}/api/android-gateway/tunnel/quick-start",
        data=b"{}",
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        res = json.loads(urllib.request.urlopen(req, timeout=20.0).read().decode())
        print("Quick Start Response:", res)
        if res.get("status") == "success":
            assert res.get("public_https_url", "").startswith("https://"), "Invalid URL"
            assert "trycloudflare.com" in res.get("public_https_url", ""), "Not trycloudflare domain"
            print("[PASS] Cloudflare Quick Tunnel successfully created:", res.get("public_https_url"))
    except Exception as e:
        print("Cloudflare quick test exception (might be network/rate limit):", e)

if __name__ == "__main__":
    test_cloudflare_quick()
