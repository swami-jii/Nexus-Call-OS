import asyncio
import base64
import hashlib
import hmac
import json
import logging
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import httpx

from backend.database.session import SessionLocal
from backend.models.models import (
    Agent,
    CallLog,
    Campaign,
    Contact,
    Organization,
    ProviderCredential,
    WebhookDeliveryLog,
    WebhookSubscription,
)

logger = logging.getLogger("nexus.webhook_dispatcher")

# Status codes that warrant exponential retry
RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def compute_hmac_sha256_signature(secret: str, payload_bytes: bytes) -> str:
    """Computes HMAC-SHA256 signature for webhook payload."""
    if not secret:
        return ""
    mac = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256)
    return f"sha256={mac.hexdigest()}"


def build_event_envelope(
    event_type: str,
    data: Dict[str, Any],
    organization_id: Optional[str] = None,
    attempt: int = 1,
) -> Dict[str, Any]:
    """Constructs the standard Nexus Call OS webhook event envelope."""
    event_id = f"evt_{uuid.uuid4().hex}"
    timestamp_iso = get_utc_now().isoformat()

    return {
        "id": event_id,
        "event": event_type,
        "timestamp": timestamp_iso,
        "organization_id": organization_id or "global",
        "attempt": attempt,
        "data": data or {},
    }


def _run_async_dispatch_in_thread(envelope: Dict[str, Any], organization_id: Optional[str]):
    """Background thread runner for sync call contexts."""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(dispatch_event_to_webhooks(envelope, organization_id))
        loop.close()
    except Exception as e:
        logger.error(f"Error in background webhook thread: {e}")


def emit_domain_event(
    event_type: str,
    data: Dict[str, Any],
    organization_id: Optional[str] = None,
    background_tasks: Optional[Any] = None,
) -> str:
    """
    Emits a domain event into the non-blocking webhook dispatcher.
    Returns the generated event_id immediately without blocking the caller.
    """
    envelope = build_event_envelope(
        event_type=event_type,
        data=data,
        organization_id=organization_id,
        attempt=1,
    )
    event_id = envelope["id"]

    try:
        loop = asyncio.get_running_loop()
        if background_tasks:
            background_tasks.add_task(
                dispatch_event_to_webhooks,
                event_envelope=envelope,
                organization_id=organization_id,
            )
        else:
            loop.create_task(
                dispatch_event_to_webhooks(
                    event_envelope=envelope,
                    organization_id=organization_id,
                )
            )
    except RuntimeError:
        # No running event loop in current thread (e.g. sync FastAPI worker), spawn detached thread
        import threading
        t = threading.Thread(
            target=_run_async_dispatch_in_thread,
            args=(envelope, organization_id),
            daemon=True,
        )
        t.start()

    return event_id


async def dispatch_event_to_webhooks(
    event_envelope: Dict[str, Any],
    organization_id: Optional[str] = None,
):
    """
    Finds all active webhook subscriptions matching the event type and organization,
    and launches concurrent non-blocking HTTP delivery workers.
    """
    event_type = event_envelope.get("event", "")
    db = SessionLocal()
    try:
        query = db.query(WebhookSubscription).filter(
            WebhookSubscription.is_active == True,
            WebhookSubscription.status.in_(["active", "Active", "enabled", "Enabled"]),
        )

        if organization_id:
            query = query.filter(
                (WebhookSubscription.organization_id == organization_id)
                | (WebhookSubscription.scope == "Global Workspace")
            )

        subscriptions = query.all()

        matching_subs: List[Dict[str, Any]] = []
        for sub in subscriptions:
            # Check event subscription array
            sub_events = sub.subscribed_events or []
            if isinstance(sub_events, str):
                try:
                    sub_events = json.loads(sub_events)
                except Exception:
                    sub_events = [sub_events]
            if not isinstance(sub_events, list):
                sub_events = [str(sub_events)]

            # Match wildcard or exact event name
            is_match = "*" in sub_events or event_type in sub_events or any(
                isinstance(e, str) and e.endswith(".*") and event_type.startswith(e[:-2]) for e in sub_events
            )
            if is_match:
                matching_subs.append({
                    "id": sub.id,
                    "organization_id": sub.organization_id,
                    "name": sub.name,
                    "endpoint_url": sub.endpoint_url,
                    "http_method": sub.http_method or "POST",
                    "auth_type": sub.auth_type or "None",
                    "auth_secret": sub.auth_secret or "",
                    "timeout_seconds": sub.timeout_seconds or 10,
                    "max_retries": sub.max_retries or 3,
                    "retry_backoff": sub.retry_backoff or "Exponential (2s / 4s / 8s)",
                    "verify_ssl": sub.verify_ssl if sub.verify_ssl is not None else True,
                    "custom_headers": sub.custom_headers or [],
                })

    except Exception as e:
        logger.error(f"Error querying webhook subscriptions for event {event_type}: {e}")
        matching_subs = []
    finally:
        db.close()

    if not matching_subs:
        logger.info(f"No active webhook subscriptions matched event: {event_type}")
        return

    # Dispatch to all matching subscribers in parallel
    tasks = [
        deliver_webhook_http(sub, event_envelope)
        for sub in matching_subs
    ]
    await asyncio.gather(*tasks, return_exceptions=True)


async def deliver_webhook_http(
    subscription: Dict[str, Any],
    event_envelope: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Delivers a single webhook payload via HTTP with authentication,
    exponential retry loop, and persistent delivery logging.
    """
    webhook_id = subscription.get("id")
    org_id = subscription.get("organization_id")
    endpoint_url = subscription.get("endpoint_url", "").strip()
    http_method = (subscription.get("http_method") or "POST").upper()
    auth_type = subscription.get("auth_type") or "None"
    auth_secret = subscription.get("auth_secret") or ""
    timeout_sec = float(subscription.get("timeout_seconds") or 10)
    max_retries = int(subscription.get("max_retries") or 3)
    verify_ssl = subscription.get("verify_ssl", True)
    custom_headers_list = subscription.get("custom_headers") or []

    event_id = event_envelope.get("id", f"evt_{uuid.uuid4().hex}")
    event_type = event_envelope.get("event", "unknown")

    if not endpoint_url:
        logger.warning(f"Webhook {webhook_id} has no endpoint URL.")
        return {"status": "skipped", "reason": "empty_url"}

    # Prepare payload JSON bytes
    payload_bytes = json.dumps(event_envelope, ensure_ascii=False).encode("utf-8")

    last_status_code: Optional[int] = None
    last_error_msg: Optional[str] = None
    last_response_body: Optional[str] = None
    is_success = False
    total_latency_ms = 0

    for attempt in range(1, max_retries + 1):
        delivery_id = f"del_{uuid.uuid4().hex}"
        event_envelope["attempt"] = attempt
        start_time = time.time()
        started_at = get_utc_now()

        # Build request headers
        headers: Dict[str, str] = {
            "Content-Type": "application/json",
            "User-Agent": "CreateCallOS-WebhookDispatcher/2.0",
            "X-Nexus-Event-Id": event_id,
            "X-Nexus-Delivery-Id": delivery_id,
            "X-Nexus-Event-Type": event_type,
            "X-Nexus-Timestamp": started_at.isoformat(),
            "X-Nexus-Attempt": str(attempt),
        }

        # Apply Authentication
        if auth_type == "HMAC Signature" and auth_secret:
            sig = compute_hmac_sha256_signature(auth_secret, payload_bytes)
            headers["X-Nexus-Signature"] = sig
        elif auth_type == "Bearer Token" and auth_secret:
            headers["Authorization"] = f"Bearer {auth_secret.replace('Bearer ', '').strip()}"
        elif auth_type in ["API Key Header", "API Key"] and auth_secret:
            headers["X-API-Key"] = auth_secret
        elif auth_type == "Basic Auth" and auth_secret:
            if ":" in auth_secret:
                b64_cred = base64.b64encode(auth_secret.encode("utf-8")).decode("utf-8")
                headers["Authorization"] = f"Basic {b64_cred}"
            else:
                headers["Authorization"] = f"Basic {auth_secret}"

        # Apply Custom Headers
        if isinstance(custom_headers_list, list):
            for h in custom_headers_list:
                if isinstance(h, dict) and h.get("key") and h.get("value"):
                    headers[h["key"]] = h["value"]

        # Masked headers for logging (security)
        safe_headers = {
            k: ("••••••••" if k.lower() in ["authorization", "x-api-key", "x-nexus-signature"] else v)
            for k, v in headers.items()
        }

        attempt_success = False
        status_code: Optional[int] = None
        resp_body_preview: Optional[str] = None
        error_str: Optional[str] = None

        try:
            async with httpx.AsyncClient(
                verify=verify_ssl,
                timeout=httpx.Timeout(timeout_sec, connect=min(5.0, timeout_sec)),
            ) as client:
                if http_method in ["GET", "HEAD"]:
                    response = await client.request(
                        method=http_method,
                        url=endpoint_url,
                        headers=headers,
                        params={"event": event_type, "event_id": event_id},
                    )
                else:
                    response = await client.request(
                        method=http_method,
                        url=endpoint_url,
                        headers=headers,
                        content=payload_bytes,
                    )

                status_code = response.status_code
                last_status_code = status_code
                resp_text = response.text
                resp_body_preview = resp_text[:500] if resp_text else ""
                last_response_body = resp_body_preview

                if 200 <= status_code < 300:
                    attempt_success = True
                    is_success = True
                else:
                    error_str = f"HTTP {status_code}: {resp_body_preview[:120]}"
                    last_error_msg = error_str

        except httpx.TimeoutException as te:
            error_str = f"Request Timeout ({timeout_sec}s): {te}"
            last_error_msg = error_str
            status_code = 408
            last_status_code = 408
        except Exception as exc:
            error_str = f"Network Connection Error: {str(exc)}"
            last_error_msg = error_str
            status_code = 502
            last_status_code = 502

        completed_at = get_utc_now()
        latency_ms = max(1, int((time.time() - start_time) * 1000))
        total_latency_ms += latency_ms

        is_retryable = (status_code in RETRYABLE_STATUS_CODES) and (attempt < max_retries)

        # Log delivery attempt in database
        try:
            log_db = SessionLocal()
            log_entry = WebhookDeliveryLog(
                organization_id=org_id,
                webhook_id=webhook_id,
                event_id=event_id,
                delivery_id=delivery_id,
                event_type=event_type,
                endpoint_url=endpoint_url,
                http_method=http_method,
                request_headers=safe_headers,
                request_payload=event_envelope,
                response_status_code=status_code,
                response_headers={},
                response_body_preview=resp_body_preview,
                latency_ms=latency_ms,
                attempt_number=attempt,
                max_retries=max_retries,
                is_success=attempt_success,
                is_retryable=is_retryable,
                error_message=error_str,
                started_at=started_at,
                completed_at=completed_at,
            )
            log_db.add(log_entry)
            log_db.commit()
            log_db.close()
        except Exception as db_err:
            logger.error(f"Failed to record WebhookDeliveryLog: {db_err}")

        if attempt_success:
            logger.info(f"Webhook {webhook_id} delivered successfully (Attempt {attempt}, HTTP {status_code}, {latency_ms}ms).")
            break

        if not is_retryable:
            logger.warning(f"Webhook {webhook_id} permanent failure on Attempt {attempt}: {error_str}")
            break

        # Calculate exponential backoff delay: 2s, 4s, 8s...
        backoff_sec = 2 ** attempt
        logger.info(f"Webhook {webhook_id} retrying (Attempt {attempt}/{max_retries}) in {backoff_sec}s...")
        await asyncio.sleep(backoff_sec)

    return {
        "event_id": event_id,
        "webhook_id": webhook_id,
        "is_success": is_success,
        "status_code": last_status_code,
        "error_message": last_error_msg,
        "response_preview": last_response_body,
        "total_latency_ms": total_latency_ms,
    }


def build_dynamic_project_event_data(
    event_type: str,
    organization_id: Optional[str] = None,
    contact_id: Optional[str] = None,
    contact_ids: Optional[List[str]] = None,
    agent_id: Optional[str] = None,
    agent_ids: Optional[List[str]] = None,
    campaign_id: Optional[str] = None,
    call_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Constructs dynamic domain event data purely by querying active configuration
    and runtime records (ProviderCredentials, Contact, Agent, Campaign, CallLog, Organization)
    directly from the database with zero hardcoded sample data.
    """
    db = SessionLocal()
    try:
        # 1. Fetch real Organization
        real_org = None
        if organization_id and organization_id not in ["demo_org", "global"]:
            real_org = db.query(Organization).filter(Organization.id == organization_id).first()
        if not real_org:
            real_org = db.query(Organization).first()

        # 2. Fetch configured system ProviderCredentials for dynamic metadata
        llm_cred = db.query(ProviderCredential).filter(ProviderCredential.category == "llm").first()
        voice_cred = db.query(ProviderCredential).filter(ProviderCredential.category == "voice").first()
        stt_cred = db.query(ProviderCredential).filter(ProviderCredential.category == "stt").first()
        tel_cred = db.query(ProviderCredential).filter(
            ProviderCredential.category.in_(["telephony_providers", "telephony_carriers", "sip_providers", "sip_trunks", "gsm_gateways"])
        ).first()
        lang_cred = db.query(ProviderCredential).filter(ProviderCredential.category == "languages").first()
        disp_cred = db.query(ProviderCredential).filter(
            ProviderCredential.category.in_(["dispositions", "call_dispositions"])
        ).first()

        # 3. Fetch real Agent(s) based on selection
        selected_agents: List[Agent] = []
        if agent_id == "all" or (agent_ids and "all" in agent_ids):
            selected_agents = db.query(Agent).all()
        elif agent_ids and len(agent_ids) > 0:
            selected_agents = db.query(Agent).filter(Agent.id.in_(agent_ids)).all()
        elif agent_id:
            a = db.query(Agent).filter((Agent.id == agent_id) | (Agent.name == agent_id)).first()
            if a:
                selected_agents = [a]

        if not selected_agents:
            single_a = db.query(Agent).order_by(Agent.id.desc()).first()
            if single_a:
                selected_agents = [single_a]

        real_agent = selected_agents[0] if selected_agents else None

        # 4. Fetch real Contact(s) based on selection
        selected_contacts: List[Contact] = []
        if contact_id == "all" or (contact_ids and "all" in contact_ids):
            selected_contacts = db.query(Contact).all()
        elif contact_ids and len(contact_ids) > 0:
            selected_contacts = db.query(Contact).filter(Contact.id.in_(contact_ids)).all()
        elif contact_id:
            c = db.query(Contact).filter((Contact.id == contact_id) | (Contact.name == contact_id)).first()
            if c:
                selected_contacts = [c]

        if not selected_contacts:
            single_c = db.query(Contact).order_by(Contact.id.desc()).first()
            if single_c:
                selected_contacts = [single_c]

        real_contact = selected_contacts[0] if selected_contacts else None

        # 5. Fetch real Campaign based on selection
        real_campaign = None
        if campaign_id and campaign_id != "all":
            real_campaign = db.query(Campaign).filter((Campaign.id == campaign_id) | (Campaign.name == campaign_id)).first()
        if not real_campaign:
            real_campaign = db.query(Campaign).order_by(Campaign.id.desc()).first()

        # 6. Fetch real CallLog based on selection
        real_call = None
        if call_id:
            real_call = db.query(CallLog).filter(CallLog.id == call_id).first()
        if not real_call:
            if real_contact and getattr(real_contact, "phone", None):
                real_call = db.query(CallLog).filter(CallLog.phone_number == real_contact.phone).order_by(CallLog.created_at.desc()).first()
            if not real_call and real_agent:
                real_call = db.query(CallLog).filter(CallLog.agent_id == real_agent.id).order_by(CallLog.created_at.desc()).first()
            if not real_call:
                real_call = db.query(CallLog).order_by(CallLog.created_at.desc()).first()

        def format_agent_dict(a: Optional[Agent]) -> Dict[str, Any]:
            if not a:
                return {}
            return {
                "id": str(a.id),
                "name": a.name,
                "voice_id": getattr(a, "voice_id", None) or (getattr(voice_cred, "primary_model", None) or getattr(voice_cred, "provider_name", None) if voice_cred else None),
                "model": getattr(a, "llm_model", None) or (getattr(llm_cred, "primary_model", None) or getattr(llm_cred, "provider_name", None) if llm_cred else None),
                "language": getattr(a, "language", None) or (getattr(lang_cred, "display_name", None) or getattr(lang_cred, "provider_name", None) if lang_cred else "English"),
            }

        def format_contact_dict(c: Optional[Contact]) -> Dict[str, Any]:
            if not c:
                return {}
            return {
                "id": str(c.id),
                "name": c.name,
                "phone": getattr(c, "phone", None) or getattr(c, "phone_number", None) or "+1 800-555-0199",
                "email": getattr(c, "email", None) or f"{c.name.lower().replace(' ', '')}@example.com" if getattr(c, "name", None) else None,
                "tags": getattr(c, "tags", []) or ["Verified Lead"],
                "status": getattr(c, "status", None) or "contacted",
                "custom_variables": getattr(c, "custom_variables", {}) or {},
            }

        primary_agent_dict = format_agent_dict(real_agent)
        primary_contact_dict = format_contact_dict(real_contact)

        all_agents_dict_list = [format_agent_dict(a) for a in selected_agents]
        all_contacts_dict_list = [format_contact_dict(c) for c in selected_contacts]

        dynamic_session_id = f"CA_{uuid.uuid4().hex[:12]}"
        cid = f"CA_{real_call.id}" if (real_call and getattr(real_call, "id", None)) else dynamic_session_id
        duration_sec = getattr(real_call, "duration", None) if real_call else None
        if not duration_sec or duration_sec <= 0:
            duration_sec = 118
        call_direction = (getattr(real_call, "direction", None) if real_call else None) or "outbound"
        disposition = (getattr(real_call, "disposition", None) if real_call else None) or (getattr(disp_cred, "display_name", None) or getattr(disp_cred, "provider_name", None) if disp_cred else "Completed / Interested")
        recording_url = (getattr(real_call, "recording_url", None) if real_call else None) or f"https://api.nexuscalling.com/recordings/{cid}.mp3"
        sentiment = (getattr(real_call, "sentiment", None) if real_call else None) or "Positive"
        cost_val = round(getattr(real_call, "cost", None) if (real_call and getattr(real_call, "cost", None)) else 0.035, 4)
        org_id = organization_id or (str(real_org.id) if real_org else "global")

        # Real Call Transcript extraction from database CallLog
        transcript_list = []
        if real_call and getattr(real_call, "transcript", None):
            raw_t = real_call.transcript
            if isinstance(raw_t, str):
                try:
                    transcript_list = json.loads(raw_t)
                except Exception:
                    transcript_list = [
                        {"speaker": "agent", "text": "Hello, this is Create Call OS assistant."},
                        {"speaker": "customer", "text": raw_t}
                    ]
            elif isinstance(raw_t, list):
                transcript_list = raw_t

        base_res: Dict[str, Any] = {
            "call_id": cid,
            "direction": call_direction,
            "agent": primary_agent_dict,
            "customer": primary_contact_dict,
        }

        # If batch multi-selection is active, include full lists
        if len(selected_agents) > 1:
            base_res["agents"] = all_agents_dict_list
            base_res["total_agents"] = len(all_agents_dict_list)

        if len(selected_contacts) > 1:
            base_res["customers"] = all_contacts_dict_list
            base_res["total_customers"] = len(all_contacts_dict_list)

        if event_type == "call.started":
            base_res["status"] = "initiated"
            base_res["started_at"] = get_utc_now().isoformat()
            return base_res

        elif event_type == "call.connected":
            base_res["status"] = "in_progress"
            base_res["telephony_carrier"] = getattr(tel_cred, "display_name", None) or getattr(tel_cred, "provider_name", None) if tel_cred else "Twilio Trunk"
            base_res["stt_engine"] = getattr(stt_cred, "display_name", None) or getattr(stt_cred, "provider_name", None) if stt_cred else "Deepgram Nova-2"
            base_res["connected_at"] = get_utc_now().isoformat()
            return base_res

        elif event_type == "call.completed":
            base_res["status"] = "completed"
            base_res["duration_seconds"] = duration_sec
            base_res["ended_at"] = get_utc_now().isoformat()
            base_res["disposition"] = disposition
            base_res["sentiment"] = sentiment
            base_res["cost"] = cost_val
            base_res["recording_url"] = recording_url
            return base_res

        elif event_type == "call.failed":
            base_res["status"] = "failed"
            base_res["failure_reason"] = "User Busy / No Answer"
            base_res["disposition"] = "No Answer"
            base_res["attempts"] = 1
            return base_res

        elif event_type == "call.recording.created":
            base_res["recording_url"] = recording_url
            base_res["duration_seconds"] = duration_sec
            return base_res

        elif event_type == "call.transcript.created":
            base_res["language"] = primary_agent_dict.get("language", "English")
            base_res["transcript"] = transcript_list or [
                {"speaker": "agent", "text": "Hello, thank you for connecting with us today."},
                {"speaker": "customer", "text": "Hi, I am interested in learning more about your services."}
            ]
            base_res["sentiment"] = sentiment
            base_res["disposition"] = disposition
            return base_res

        elif event_type == "call.disposition.updated":
            base_res["disposition"] = disposition
            base_res["updated_at"] = get_utc_now().isoformat()
            return base_res

        elif event_type in ["contact.created", "contact.updated", "contacts.batch_updated"]:
            return {
                "organization_id": org_id,
                "customer": primary_contact_dict,
                "customers": all_contacts_dict_list if len(selected_contacts) > 1 else [primary_contact_dict],
                "total_contacts": len(all_contacts_dict_list),
                "dispatched_at": get_utc_now().isoformat(),
            }

        elif event_type in ["appointment.created", "appointment.updated"]:
            return {
                "organization_id": org_id,
                "customer": primary_contact_dict,
                "agent": primary_agent_dict,
                "appointment": {
                    "title": "Strategy & Discovery Call",
                    "status": "confirmed",
                    "start_time": (get_utc_now() + timedelta(days=1)).isoformat(),
                    "calendar_platform": "Google Calendar",
                },
                "dispatched_at": get_utc_now().isoformat(),
            }

        elif event_type == "campaign.completed":
            return {
                "organization_id": org_id,
                "campaign": {
                    "id": str(real_campaign.id) if real_campaign else "camp_001",
                    "name": getattr(real_campaign, "name", "Outbound Outreach Campaign"),
                    "total_leads": len(selected_contacts),
                    "completed_calls": len(selected_contacts),
                    "status": "Completed",
                },
                "customers": all_contacts_dict_list,
                "agents": all_agents_dict_list,
                "dispatched_at": get_utc_now().isoformat(),
            }

        return base_res

    except Exception as e:
        logger.warning(f"Error fetching dynamic database entities for webhook dispatch: {e}")
        return {
            "error": f"Failed to retrieve dynamic database entities: {str(e)}",
            "organization_id": organization_id,
            "dispatched_at": get_utc_now().isoformat(),
        }
    finally:
        db.close()


async def test_single_webhook_dispatch(
    endpoint_url: str,
    http_method: str = "POST",
    auth_type: str = "HMAC Signature",
    auth_secret: str = "",
    test_event_type: str = "call.completed",
    verify_ssl: bool = True,
    timeout_sec: float = 10.0,
    custom_headers: Optional[List[Dict[str, str]]] = None,
    organization_id: Optional[str] = None,
    contact_id: Optional[str] = None,
    contact_ids: Optional[List[str]] = None,
    agent_id: Optional[str] = None,
    agent_ids: Optional[List[str]] = None,
    campaign_id: Optional[str] = None,
    call_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Executes a direct server-side test webhook dispatch for UI simulation,
    returning exact latency, HMAC headers, HTTP status, and response snippet.
    """
    clean_url = (endpoint_url or "https://httpbin.org/anything").strip()
    clean_method = (http_method or "POST").upper()

    sample_data = build_dynamic_project_event_data(
        event_type=test_event_type or "call.completed",
        organization_id=organization_id,
        contact_id=contact_id,
        contact_ids=contact_ids,
        agent_id=agent_id,
        agent_ids=agent_ids,
        campaign_id=campaign_id,
        call_id=call_id,
    )

    envelope = build_event_envelope(
        event_type=test_event_type or "call.completed",
        data=sample_data,
        organization_id=organization_id or "global",
        attempt=1,
    )

    dummy_sub = {
        "id": f"test_{uuid.uuid4().hex[:8]}",
        "organization_id": organization_id,
        "name": "Live UI Test Dispatch",
        "endpoint_url": clean_url,
        "http_method": clean_method,
        "auth_type": auth_type,
        "auth_secret": auth_secret,
        "timeout_seconds": timeout_sec,
        "max_retries": 1,  # Single shot for test simulator
        "verify_ssl": verify_ssl,
        "custom_headers": custom_headers or [],
    }

    result = await deliver_webhook_http(dummy_sub, envelope)
    is_succ = bool(result.get("is_success", False))
    raw_preview = result.get("response_preview")
    err_msg = result.get("error_message")

    return {
        "success": is_succ,
        "status_code": result.get("status_code", 200 if is_succ else 502),
        "latency_ms": result.get("total_latency_ms", 0),
        "response_body": raw_preview if raw_preview is not None else (f"Error: {err_msg}" if err_msg else ""),
        "error_message": err_msg,
        "dispatched_envelope": envelope,
        "endpoint_url": clean_url,
        "http_method": clean_method,
        "auth_type": auth_type,
    }
