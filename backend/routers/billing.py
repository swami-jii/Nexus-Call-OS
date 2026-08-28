from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.models.models import BillingAccount, Coupon, Subscription, User
from backend.repositories.repositories import billing_repo
from backend.schemas.schemas import (
    BillingAccountOut,
    CouponCreate,
    CouponUpdate,
    CouponValidateRequest,
    SubscriptionOut,
)

router = APIRouter(tags=["Billing & Subscriptions"])


@router.get("/api/billing", response_model=BillingAccountOut)
def get_billing_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = (
        db.query(BillingAccount)
        .filter(BillingAccount.organization_id == current_user.organization_id)
        .first()
    )
    if not account:
        account = billing_repo.create(
            db,
            {
                "organization_id": current_user.organization_id,
                "balance_usd": 500.00,
                "currency": "USD",
                "payment_method_last4": "4242",
                "auto_recharge": True,
            },
        )
    return account


@router.post("/api/billing/recharge")
def recharge_balance(
    amount_usd: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = (
        db.query(BillingAccount)
        .filter(BillingAccount.organization_id == current_user.organization_id)
        .first()
    )
    if not account:
        account = billing_repo.create(
            db,
            {
                "organization_id": current_user.organization_id,
                "balance_usd": amount_usd,
            },
        )
    else:
        account.balance_usd += amount_usd
        db.commit()
        db.refresh(account)
    return {
        "message": f"Successfully recharged ${amount_usd:.2f}",
        "new_balance": account.balance_usd,
    }


@router.get("/api/coupons")
def list_coupons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Coupon).all()


@router.post("/api/coupons")
def create_coupon(
    req: CouponCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coupon = Coupon(
        code=req.code,
        discount_percent=req.discount_percent,
        max_uses=req.max_uses,
        details_json=req.details_json,
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


@router.patch("/api/coupons/{coupon_id}")
def update_coupon(
    coupon_id: str,
    req: CouponUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    if req.details_json is not None:
        coupon.details_json = {**coupon.details_json, **req.details_json}
    db.commit()
    db.refresh(coupon)
    return coupon


@router.delete("/api/coupons/{coupon_id}")
def delete_coupon(
    coupon_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    db.delete(coupon)
    db.commit()
    return {"message": "Coupon deleted"}


@router.post("/api/coupons/validate")
def validate_coupon(
    req: CouponValidateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coupon = db.query(Coupon).filter(Coupon.code == req.code).first()
    if not coupon or (coupon.expires_at and coupon.expires_at < datetime.utcnow()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired promo code",
        )
    return {
        "valid": True,
        "code": coupon.code,
        "discount_percent": coupon.discount_percent,
    }


@router.get("/api/plans")
def list_plans():
    return [
        {
            "id": "starter",
            "name": "Starter",
            "description": "Perfect for individuals and small teams.",
            "monthlyPrice": 49,
            "yearlyPrice": 470,
            "features": [
                "1 AI Agent",
                "1,000 Voice Minutes",
                "Basic Analytics",
                "Community Support",
            ],
            "popular": False,
        },
        {
            "id": "pro",
            "name": "Pro",
            "description": "Ideal for growing businesses with AI agents.",
            "monthlyPrice": 199,
            "yearlyPrice": 1990,
            "features": [
                "5 AI Agents",
                "10,000 Voice Minutes",
                "Advanced Analytics",
                "Priority Support",
                "Custom Voices",
            ],
            "popular": True,
        },
        {
            "id": "business",
            "name": "Business",
            "description": "For large organizations with complex voice requirements.",
            "monthlyPrice": 499,
            "yearlyPrice": 4990,
            "features": [
                "Unlimited Agents",
                "50,000 Voice Minutes",
                "Dedicated Account Manager",
                "SLA Guarantee",
                "Custom Integrations",
            ],
            "popular": False,
        },
        {
            "id": "enterprise",
            "name": "Enterprise",
            "description": "Custom solutions for massive enterprise scale.",
            "monthlyPrice": 999,
            "yearlyPrice": 9990,
            "lifetimePrice": 25000,
            "features": [
                "Volume Discounts",
                "On-Premise Deployment Option",
                "Custom Model Fine-tuning",
                "White-glove Onboarding",
            ],
            "popular": False,
        },
    ]


@router.get("/api/payment-methods")
def list_payment_methods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = (
        db.query(BillingAccount)
        .filter(BillingAccount.organization_id == current_user.organization_id)
        .first()
    )
    if (
        not account
        or not account.details_json
        or "payment_methods" not in account.details_json
    ):
        return []
    return account.details_json["payment_methods"]


@router.post("/api/payment-methods")
def create_payment_method(
    req: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import uuid

    account = (
        db.query(BillingAccount)
        .filter(BillingAccount.organization_id == current_user.organization_id)
        .first()
    )
    if not account:
        account = billing_repo.create(
            db, {"organization_id": current_user.organization_id, "balance_usd": 0.0}
        )

    pms = (
        account.details_json.get("payment_methods", []) if account.details_json else []
    )
    pm_id = f"pm_{uuid.uuid4().hex[:8]}"
    req["id"] = pm_id
    pms.append(req)

    account.details_json = {**(account.details_json or {}), "payment_methods": pms}
    db.commit()
    db.refresh(account)
    return req


@router.delete("/api/payment-methods/{pm_id}")
def delete_payment_method(
    pm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = (
        db.query(BillingAccount)
        .filter(BillingAccount.organization_id == current_user.organization_id)
        .first()
    )
    if account and account.details_json and "payment_methods" in account.details_json:
        pms = account.details_json["payment_methods"]
        pms = [p for p in pms if p.get("id") != pm_id]
        account.details_json = {**account.details_json, "payment_methods": pms}
        db.commit()
    return {"message": "Payment method deleted"}


@router.get("/api/subscriptions", response_model=list[SubscriptionOut])
def list_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subs = (
        db.query(Subscription)
        .filter(Subscription.organization_id == current_user.organization_id)
        .all()
    )
    if not subs:
        sub = Subscription(
            organization_id=current_user.organization_id,
            plan_id="Enterprise Scale Plan",
            status="active",
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
        subs = [sub]
    return subs
