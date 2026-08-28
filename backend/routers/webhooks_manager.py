import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.models.models import ProviderCredential, User, WebhookDeliveryLog, WebhookSubscription
from backend.services.webhook_dispatcher import test_single_webhook_dispatch

logger = logging.getLogger("nexus.webhooks_router")

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks & Realtime Event Dispatcher"])


class WebhookSubscriptionCreate(BaseModel):
    name: str
    display_name: Optional[str] = None
    description: Optional[str] = None
    endpoint_url: str
    http_method: str = "POST"
    auth_type: str = "HMAC Signature"
    auth_secret: Optional[str] = None
    subscribed_events: List[str] = Field(default_factory=lambda: ["call.completed"])
    timeout_seconds: int = 10
    max_retries: int = 3
    retry_backoff: str = "Exponential (2s / 4s / 8s)"
    verify_ssl: bool = True
    custom_headers: List[Dict[str, str]] = Field(default_factory=list)
    status: str = "Active"
    scope: str = "Global Workspace"


class WebhookSubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    endpoint_url: Optional[str] = None
    http_method: Optional[str] = None
    auth_type: Optional[str] = None
    auth_secret: Optional[str] = None
    subscribed_events: Optional[List[str]] = None
    timeout_seconds: Optional[int] = None
    max_retries: Optional[int] = None
    retry_backoff: Optional[str] = None
    verify_ssl: Optional[bool] = None
    custom_headers: Optional[List[Dict[str, str]]] = None
    status: Optional[str] = None
    scope: Optional[str] = None
    is_active: Optional[bool] = None


class TestWebhookRequest(BaseModel):
    endpoint_url: str
    http_method: str = "POST"
    auth_type: str = "HMAC Signature"
    auth_secret: Optional[str] = None
    test_event_type: str = "call.completed"
    test_event_types: Optional[List[str]] = None
    verify_ssl: bool = True
    timeout_seconds: float = 10.0
    custom_headers: List[Dict[str, str]] = Field(default_factory=list)
    contact_id: Optional[str] = None
    contact_ids: Optional[List[str]] = None
    agent_id: Optional[str] = None
    agent_ids: Optional[List[str]] = None
    campaign_id: Optional[str] = None
    call_id: Optional[str] = None


def mask_secret(secret: Optional[str]) -> Optional[str]:
    """Masks secret string for secure client display."""
    if not secret:
        return secret
    if len(secret) <= 8:
        return "••••••••"
    return f"{secret[:4]}••••••••{secret[-4:]}"


@router.get("", response_model=List[Dict[str, Any]])
def list_webhooks(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Lists all active and configured webhooks for current workspace."""
    query = db.query(WebhookSubscription)
    if current_user and current_user.organization_id:
        query = query.filter(
            (WebhookSubscription.organization_id == current_user.organization_id)
            | (WebhookSubscription.scope == "Global Workspace")
        )

    webhooks = query.order_by(WebhookSubscription.created_at.desc()).all()
    return [
        {
            "id": wh.id,
            "name": wh.name,
            "display_name": wh.display_name or wh.name,
            "description": wh.description,
            "endpoint_url": wh.endpoint_url,
            "http_method": wh.http_method,
            "auth_type": wh.auth_type,
            "auth_secret": mask_secret(wh.auth_secret),
            "subscribed_events": wh.subscribed_events or [],
            "timeout_seconds": wh.timeout_seconds,
            "max_retries": wh.max_retries,
            "retry_backoff": wh.retry_backoff,
            "verify_ssl": wh.verify_ssl,
            "custom_headers": wh.custom_headers or [],
            "status": wh.status,
            "scope": wh.scope,
            "is_active": wh.is_active,
            "created_at": wh.created_at.isoformat() if wh.created_at else None,
            "updated_at": wh.updated_at.isoformat() if wh.updated_at else None,
        }
        for wh in webhooks
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_webhook(
    sub_in: WebhookSubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Creates a new Webhook Subscription or updates if matching name already exists (Upsert)."""
    org_id = current_user.organization_id if current_user and current_user.organization_id is not None else 1
    user_id = current_user.id if current_user else None

    # Check if existing webhook exists by name or display_name
    existing = db.query(WebhookSubscription).filter(
        (WebhookSubscription.name == sub_in.name.strip()) |
        (WebhookSubscription.display_name == sub_in.name.strip())
    ).first()

    if existing:
        existing.display_name = sub_in.display_name.strip() if sub_in.display_name else sub_in.name.strip()
        existing.description = sub_in.description
        existing.endpoint_url = sub_in.endpoint_url.strip()
        existing.http_method = sub_in.http_method.upper()
        existing.auth_type = sub_in.auth_type
        if sub_in.auth_secret is not None:
            existing.auth_secret = sub_in.auth_secret.strip() if sub_in.auth_secret else None
        existing.subscribed_events = sub_in.subscribed_events
        existing.timeout_seconds = sub_in.timeout_seconds
        existing.max_retries = sub_in.max_retries
        existing.retry_backoff = sub_in.retry_backoff
        existing.verify_ssl = sub_in.verify_ssl
        existing.custom_headers = sub_in.custom_headers
        existing.status = sub_in.status
        existing.scope = sub_in.scope
        existing.is_active = (sub_in.status != "Disabled")
        
        # Sync ProviderCredential
        try:
            cred = db.query(ProviderCredential).filter(
                (ProviderCredential.id == existing.id) |
                (ProviderCredential.provider_name == existing.name)
            ).first()
            if cred:
                cred.display_name = existing.display_name
                cred.base_url = existing.endpoint_url
                cred.primary_model = existing.http_method
                cred.selection_strategy = existing.auth_type
                cred.metadata_json = json.dumps({
                    "id": existing.id,
                    "name": existing.name,
                    "display_name": existing.display_name,
                    "endpoint_url": existing.endpoint_url,
                    "http_method": existing.http_method,
                    "auth_type": existing.auth_type,
                    "auth_secret": existing.auth_secret,
                    "subscribed_events": existing.subscribed_events,
                    "timeout": str(existing.timeout_seconds),
                    "max_retries": str(existing.max_retries),
                    "retry_backoff": existing.retry_backoff,
                    "verify_ssl": existing.verify_ssl,
                    "status": existing.status,
                    "scope": existing.scope,
                })
        except Exception as e:
            logger.warning(f"ProviderCredential sync warning: {e}")

        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "name": existing.name,
            "display_name": existing.display_name,
            "endpoint_url": existing.endpoint_url,
            "status": existing.status,
            "message": "Webhook updated successfully",
        }

    new_sub = WebhookSubscription(
        organization_id=org_id,
        user_id=current_user.id if current_user else None,
        name=sub_in.name.strip(),
        display_name=sub_in.display_name.strip() if sub_in.display_name else sub_in.name.strip(),
        description=sub_in.description,
        endpoint_url=sub_in.endpoint_url.strip(),
        http_method=sub_in.http_method.upper(),
        auth_type=sub_in.auth_type,
        auth_secret=sub_in.auth_secret.strip() if sub_in.auth_secret else None,
        subscribed_events=sub_in.subscribed_events,
        timeout_seconds=sub_in.timeout_seconds,
        max_retries=sub_in.max_retries,
        retry_backoff=sub_in.retry_backoff,
        verify_ssl=sub_in.verify_ssl,
        custom_headers=sub_in.custom_headers,
        status=sub_in.status,
        scope=sub_in.scope,
        is_active=(sub_in.status != "Disabled"),
    )

    db.add(new_sub)

    # Backward compatibility sync with ProviderCredential (category='webhooks')
    try:
        cred = ProviderCredential(
            id=new_sub.id,
            organization_id=org_id,
            user_id=current_user.id if current_user else None,
            provider_name=new_sub.name,
            display_name=new_sub.display_name,
            category="webhooks",
            encrypted_key="webhook_active",
            base_url=new_sub.endpoint_url,
            primary_model=new_sub.http_method,
            selection_strategy=new_sub.auth_type,
            metadata_json=json.dumps({
                "id": new_sub.id,
                "name": new_sub.name,
                "display_name": new_sub.display_name,
                "endpoint_url": new_sub.endpoint_url,
                "http_method": new_sub.http_method,
                "auth_type": new_sub.auth_type,
                "auth_secret": new_sub.auth_secret,
                "subscribed_events": new_sub.subscribed_events,
                "timeout": str(new_sub.timeout_seconds),
                "max_retries": str(new_sub.max_retries),
                "retry_backoff": new_sub.retry_backoff,
                "verify_ssl": new_sub.verify_ssl,
                "status": new_sub.status,
                "scope": new_sub.scope,
            }),
        )
        db.add(cred)
    except Exception as e:
        logger.warning(f"ProviderCredential sync warning: {e}")

    db.commit()
    db.refresh(new_sub)

    return {
        "id": new_sub.id,
        "name": new_sub.name,
        "display_name": new_sub.display_name,
        "endpoint_url": new_sub.endpoint_url,
        "status": new_sub.status,
        "message": "Webhook created successfully",
    }


@router.patch("/{webhook_id}")
def update_webhook(
    webhook_id: str,
    sub_in: WebhookSubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Updates an existing Webhook Subscription."""
    sub = db.query(WebhookSubscription).filter(WebhookSubscription.id == webhook_id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Webhook not found"
        )

    update_dict = sub_in.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(sub, field, val)

    if "status" in update_dict:
        sub.is_active = (update_dict["status"] != "Disabled")

    # Sync ProviderCredential
    try:
        cred = db.query(ProviderCredential).filter(ProviderCredential.id == webhook_id).first()
        if cred:
            if sub.endpoint_url:
                cred.base_url = sub.endpoint_url
            if sub.http_method:
                cred.primary_model = sub.http_method
            cred.display_name = sub.display_name or sub.name
            cred.metadata_json = json.dumps({
                "id": sub.id,
                "name": sub.name,
                "display_name": sub.display_name,
                "endpoint_url": sub.endpoint_url,
                "http_method": sub.http_method,
                "auth_type": sub.auth_type,
                "auth_secret": sub.auth_secret,
                "subscribed_events": sub.subscribed_events,
                "timeout": str(sub.timeout_seconds),
                "max_retries": str(sub.max_retries),
                "retry_backoff": sub.retry_backoff,
                "verify_ssl": sub.verify_ssl,
                "status": sub.status,
                "scope": sub.scope,
            })
    except Exception:
        pass

    db.commit()
    db.refresh(sub)
    return {"message": "Webhook updated successfully", "id": sub.id}


@router.delete("/{webhook_id}")
def delete_webhook(
    webhook_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Deletes a Webhook Subscription and its associated credentials."""
    subs = db.query(WebhookSubscription).filter(
        (WebhookSubscription.id == webhook_id) |
        (WebhookSubscription.name == webhook_id) |
        (WebhookSubscription.display_name == webhook_id)
    ).all()

    for sub in subs:
        db.delete(sub)

    # Also clean ProviderCredential and subtab table
    try:
        creds = db.query(ProviderCredential).filter(
            (ProviderCredential.id == webhook_id) |
            (ProviderCredential.provider_name == webhook_id) |
            (ProviderCredential.display_name == webhook_id) |
            (ProviderCredential.category == "webhooks")
        ).all()
        for cred in creds:
            if cred.id == webhook_id or cred.provider_name == webhook_id or cred.display_name == webhook_id or (subs and any(s.name == cred.provider_name or s.id == cred.id for s in subs)):
                db.delete(cred)
        
        from sqlalchemy import text
        db.execute(text("DELETE FROM group4_data_webhooks__3_webhook_endpoints WHERE id = :id OR provider_name = :id OR display_name = :id"), {"id": webhook_id})
    except Exception:
        pass

    db.commit()
    return {"message": "Webhook deleted successfully", "id": webhook_id}


@router.post("/test-dispatch")
async def execute_test_dispatch(
    req: TestWebhookRequest,
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Executes a direct server-side simulated webhook dispatch.
    Dispatches every selected event so all real events appear on the endpoint.
    Returns HTTP status, response body preview, HMAC header details, and real latency.
    """
    org_id = str(current_user.organization_id) if current_user and current_user.organization_id is not None else "demo_org"

    events_to_dispatch = req.test_event_types if (req.test_event_types and len(req.test_event_types) > 0) else [req.test_event_type or "call.completed"]

    dispatched_results = []
    last_res = None

    for evt in events_to_dispatch:
        res = await test_single_webhook_dispatch(
            endpoint_url=req.endpoint_url,
            http_method=req.http_method,
            auth_type=req.auth_type,
            auth_secret=req.auth_secret or "",
            test_event_type=evt,
            verify_ssl=req.verify_ssl,
            timeout_sec=req.timeout_seconds,
            custom_headers=req.custom_headers,
            organization_id=org_id,
            contact_id=req.contact_id,
            contact_ids=req.contact_ids,
            agent_id=req.agent_id,
            agent_ids=req.agent_ids,
            campaign_id=req.campaign_id,
            call_id=req.call_id,
        )
        dispatched_results.append(res)
        last_res = res

    all_success = all(r.get("success", False) for r in dispatched_results) if dispatched_results else False
    total_latency = sum(r.get("latency_ms", 0) for r in dispatched_results)

    return {
        "success": all_success,
        "status_code": last_res.get("status_code", 200) if last_res else 200,
        "latency_ms": round(total_latency / max(1, len(dispatched_results)), 1),
        "response_body": last_res.get("response_body", "") if last_res else "",
        "dispatched_count": len(dispatched_results),
        "events": events_to_dispatch,
        "results": dispatched_results,
    }


@router.get("/{webhook_id}/logs")
def get_webhook_delivery_logs(
    webhook_id: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Returns recent delivery logs for a specific webhook."""
    query = db.query(WebhookDeliveryLog).filter(
        WebhookDeliveryLog.webhook_id == webhook_id
    )
    if current_user and current_user.organization_id:
        query = query.filter(WebhookDeliveryLog.organization_id == current_user.organization_id)

    logs = query.order_by(desc(WebhookDeliveryLog.created_at)).limit(limit).all()

    return [
        {
            "id": log.id,
            "event_id": log.event_id,
            "delivery_id": log.delivery_id,
            "event_type": log.event_type,
            "endpoint_url": log.endpoint_url,
            "http_method": log.http_method,
            "status_code": log.response_status_code,
            "latency_ms": log.latency_ms,
            "attempt_number": log.attempt_number,
            "max_retries": log.max_retries,
            "is_success": log.is_success,
            "is_retryable": log.is_retryable,
            "error_message": log.error_message,
            "response_preview": log.response_body_preview,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


@router.get("/logs/all")
def get_all_delivery_logs(
    limit: int = Query(50, ge=1, le=200),
    event_type: Optional[str] = None,
    success_only: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Returns recent workspace-wide webhook delivery logs."""
    query = db.query(WebhookDeliveryLog)
    if current_user and current_user.organization_id:
        query = query.filter(WebhookDeliveryLog.organization_id == current_user.organization_id)
    if event_type:
        query = query.filter(WebhookDeliveryLog.event_type == event_type)
    if success_only is not None:
        query = query.filter(WebhookDeliveryLog.is_success == success_only)

    logs = query.order_by(desc(WebhookDeliveryLog.created_at)).limit(limit).all()

    return [
        {
            "id": log.id,
            "webhook_id": log.webhook_id,
            "event_id": log.event_id,
            "delivery_id": log.delivery_id,
            "event_type": log.event_type,
            "endpoint_url": log.endpoint_url,
            "http_method": log.http_method,
            "status_code": log.response_status_code,
            "latency_ms": log.latency_ms,
            "attempt_number": log.attempt_number,
            "is_success": log.is_success,
            "error_message": log.error_message,
            "response_preview": log.response_body_preview,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]
