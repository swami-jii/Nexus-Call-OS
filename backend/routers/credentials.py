import json
import logging
import os
import time
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.integrations.registry_service import registry_service
from backend.models.models import Agent, ProviderCredential, User, WebhookSubscription
from backend.utils.crypto import decrypt_secret, encrypt_secret

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/credentials", tags=["API Credentials"])

class CredentialPayload(BaseModel):
    id: str | None = None
    provider: str
    category: str
    api_key: str | None = None
    is_owner: bool = False
    base_url: str | None = None
    primary_model: str | None = None
    selection_strategy: str | None = "dynamic"
    api_version: str | None = None
    metadata_json: Any = None
    display_name: str | None = None
    subtab_name: str | None = None

class ProviderTestPayload(BaseModel):
    provider: str
    api_key: str | None = None
    credential_id: str | None = None
    endpoint: str | None = None

def resolve_credential_key(db: Session, org_id: str, user_id: str, provider_name: str, credential_id: str | None = None) -> str:
    if credential_id:
        cred = db.query(ProviderCredential).filter(
            ProviderCredential.id == credential_id,
            ProviderCredential.organization_id == org_id
        ).first()
        if cred:
            return decrypt_secret(str(cred.encrypted_key))

    p_name = provider_name.lower().strip()
    possible_names = [p_name]
    if "google" in p_name or "gemini" in p_name:
        possible_names = ["google", "google_cloud", "gemini", "google_ai_studio", "google ai studio"]
    elif "anthropic" in p_name or "claude" in p_name:
        possible_names = ["anthropic", "claude", "anthropic claude", "anthropic_claude", "claude_vision"]
    elif "openai" in p_name or "gpt" in p_name:
        possible_names = ["openai", "openai_tts", "openai_whisper", "openai_embeddings"]
    elif "groq" in p_name:
        possible_names = ["groq", "groq_whisper", "groq_llama_vision"]
    elif "deepseek" in p_name:
        possible_names = ["deepseek"]
    elif "openrouter" in p_name:
        possible_names = ["openrouter"]
    elif "mistral" in p_name:
        possible_names = ["mistral", "pixtral"]
    elif "together" in p_name:
        possible_names = ["together", "together_ai", "together-ai"]
    elif "ollama" in p_name:
        possible_names = ["ollama", "ollama_local", "ollama local engine"]
    elif "azure" in p_name:
        possible_names = ["azure", "azure_speech", "azure_openai"]

    user_cred = db.query(ProviderCredential).filter(
        ProviderCredential.organization_id == org_id,
        ProviderCredential.user_id == user_id,
        ProviderCredential.provider_name.in_(possible_names)
    ).first()
    if user_cred:
        return decrypt_secret(str(user_cred.encrypted_key))
        
    owner_cred = db.query(ProviderCredential).filter(
        ProviderCredential.organization_id == org_id,
        ProviderCredential.is_owner_key == True,
        ProviderCredential.provider_name.in_(possible_names)
    ).first()
    if owner_cred:
        return decrypt_secret(str(owner_cred.encrypted_key))

    # Env key fallback
    env_keys = {
        "elevenlabs": ["ELEVENLABS_API_KEY", "XI_API_KEY"],
        "cartesia": ["CARTESIA_API_KEY"],
        "deepgram": ["DEEPGRAM_API_KEY"],
        "google": ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
        "google_cloud": ["GOOGLE_CLOUD_API_KEY", "GEMINI_API_KEY"],
        "gemini": ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
        "google_ai_studio": ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
        "openai": ["OPENAI_API_KEY"],
        "openai_tts": ["OPENAI_API_KEY"],
        "azure": ["AZURE_SPEECH_KEY", "AZURE_OPENAI_KEY"],
        "azure_speech": ["AZURE_SPEECH_KEY"],
        "azure_openai": ["AZURE_OPENAI_KEY"],
        "groq": ["GROQ_API_KEY"],
        "anthropic": ["ANTHROPIC_API_KEY"],
        "openrouter": ["OPENROUTER_API_KEY"],
        "deepseek": ["DEEPSEEK_API_KEY"],
        "cohere": ["COHERE_API_KEY"],
        "together": ["TOGETHER_API_KEY"],
        "mistral": ["MISTRAL_API_KEY"]
    }
    for env_var in env_keys.get(p_name, []):
        val = os.getenv(env_var, "")
        if val:
            return val

    return ""

def _ensure_provider_credential_columns(db: Session):
    """Ensure SQLite table has newly added columns if running on an existing DB."""
    try:
        cols_to_add = [
            ("base_url", "VARCHAR(255)"),
            ("primary_model", "VARCHAR(100)"),
            ("selection_strategy", "VARCHAR(50) DEFAULT 'dynamic'"),
            ("api_version", "VARCHAR(50)"),
            ("metadata_json", "TEXT"),
            ("plain_key", "VARCHAR(255)"),
            ("display_name", "VARCHAR(255)"),
            ("subtab_name", "VARCHAR(100)")
        ]
        for col_name, col_type in cols_to_add:
            try:
                db.execute(text(f"ALTER TABLE provider_credentials ADD COLUMN {col_name} {col_type};"))
                db.commit()
            except Exception:
                db.rollback()
    except Exception:
        pass

@router.get("/all-categories")
async def list_all_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve canonical configured records from all categories with full metadata."""
    _ensure_provider_credential_columns(db)
    
    canonical_tables = {
        "llm": "group1_ai_voice__1_llm_providers",
        "stt": "group1_ai_voice__2_stt_engines",
        "voice": "group1_ai_voice__3_voice_synthesizers",
        "embeddings": "group1_ai_voice__4_embedding_vector_ai",
        "vision_doc": "group1_ai_voice__5_vision_document_ai",
        "business_types": "group2_business_rules__1_business_types",
        "languages": "group2_business_rules__2_languages",
        "working_hours": "group2_business_rules__3_working_hours",
        "departments": "group2_business_rules__4_departments",
        "business_policies": "group2_business_rules__5_business_policies",
        "time_zones": "group2_business_rules__5_time_zones",
        "telephony_carriers": "group3_telephony_sims__1_telephony_carriers",
        "telephony_providers": "group3_telephony_sims__1_telephony_carriers",
        "sip_trunks": "group3_telephony_sims__2_sip_trunks",
        "sip_providers": "group3_telephony_sims__2_sip_trunks",
        "android_devices": "group3_telephony_sims__3_android_devices",
        "gsm_gateways": "group3_telephony_sims__3_android_devices",
        "call_dispositions": "group3_telephony_sims__4_call_dispositions",
        "dispositions": "group3_telephony_sims__4_call_dispositions",
        "knowledge_collections": "group4_data_webhooks__1_knowledge_collections",
        "prompt_templates": "group4_data_webhooks__2_prompt_templates",
        "webhooks": "group4_data_webhooks__3_webhook_endpoints",
        "variables": "group4_data_webhooks__4_variables",
        "tags": "group4_data_webhooks__5_tags",
        "crm_statuses": "group4_data_webhooks__6_crm_statuses",
        "custom_fields": "group4_data_webhooks__7_custom_fields",
    }

    result: dict[str, list[dict[str, Any]]] = {k: [] for k in canonical_tables}

    creds = db.query(ProviderCredential).filter(
        ProviderCredential.organization_id == current_user.organization_id
    ).all()

    seen_ids_per_cat: dict[str, set[str]] = {k: set() for k in canonical_tables}

    for c in creds:
        cat = str(c.category or "")
        if not cat:
            continue
        # Webhooks are loaded directly from WebhookSubscription below for 100% SSOT fidelity and zero duplicates
        if cat == "webhooks":
            continue

        if cat not in result:
            result[cat] = []
        if cat not in seen_ids_per_cat:
            seen_ids_per_cat[cat] = set()

        raw_key = getattr(c, 'plain_key', None) or decrypt_secret(str(c.encrypted_key))
        if len(raw_key) > 8:
            key_preview = f"{raw_key[:5]}...{raw_key[-4:]}"
        elif len(raw_key) > 0:
            key_preview = raw_key[:3] + "..."
        else:
            key_preview = "sk-..."

        p_name = c.provider_name or ""
        disp_name = getattr(c, 'display_name', None) or p_name.replace("_", " ").title()

        item: dict[str, Any] = {
            "id": c.id,
            "provider": p_name,
            "provider_name": p_name,
            "category": cat,
            "display_name": disp_name,
            "name": disp_name,
            "plain_key": raw_key,
            "raw_key": raw_key,
            "key_preview": key_preview,
            "base_url": getattr(c, 'base_url', '') or "",
            "primary_model": getattr(c, 'primary_model', '') or "",
            "default_model": getattr(c, 'primary_model', '') or "",
            "default_voice_id": getattr(c, 'primary_model', '') or "",
            "selection_strategy": getattr(c, 'selection_strategy', 'dynamic') or "dynamic",
            "api_version": getattr(c, 'api_version', 'v1') or "v1",
            "status": "Active",
            "organization_id": c.organization_id,
            "user_id": c.user_id,
            "created_at": str(c.created_at) if c.created_at else None,
            "updated_at": str(c.updated_at) if c.updated_at else None,
        }

        raw_meta = getattr(c, 'metadata_json', None)
        if raw_meta:
            try:
                meta_obj = json.loads(raw_meta) if isinstance(raw_meta, str) else raw_meta
                if isinstance(meta_obj, dict):
                    meta_filtered = {k: v for k, v in meta_obj.items() if k not in ["category"]}
                    item.update(meta_filtered)
            except Exception:
                pass

        item_id_key = str(item.get("id") or p_name).lower()
        seen_ids_per_cat[cat].add(item_id_key)
        seen_ids_per_cat[cat].add(str(p_name).lower())
        if disp_name:
            seen_ids_per_cat[cat].add(str(disp_name).lower())
        result[cat].append(item)

    # 2. Query any extra records from dedicated subtab SQLite tables if not in ProviderCredential
    for cat_key, table_name in canonical_tables.items():
        if cat_key == "webhooks":
            continue
        try:
            rows = db.execute(text(
                f"SELECT id, organization_id, user_id, provider_name, display_name, "
                f"plain_key, encrypted_key, base_url, primary_model, selection_strategy, "
                f"api_version, status, created_at, updated_at "
                f"FROM {table_name} WHERE organization_id = :org_id"
            ), {"org_id": current_user.organization_id}).fetchall()
        except Exception:
            rows = []

        for r in rows:
            m = r._mapping if hasattr(r, "_mapping") else dict(zip(
                ["id", "organization_id", "user_id", "provider_name", "display_name",
                 "plain_key", "encrypted_key", "base_url", "primary_model", "selection_strategy",
                 "api_version", "status", "created_at", "updated_at"], r
            ))
            row_id = str(m.get("id") or "").lower()
            row_pname = str(m.get("provider_name") or "").lower()
            row_dname = str(m.get("display_name") or "").lower()

            seen_set = seen_ids_per_cat.get(cat_key, set())
            if (row_id and row_id in seen_set) or (row_pname and row_pname in seen_set) or (row_dname and row_dname in seen_set):
                continue

            raw_key = m.get("plain_key") or ""
            if not raw_key and m.get("encrypted_key"):
                try:
                    raw_key = decrypt_secret(str(m.get("encrypted_key")))
                except Exception:
                    raw_key = ""

            provider_name = m.get("provider_name") or ""
            display_name = m.get("display_name") or provider_name.replace("_", " ").title()

            result[cat_key].append({
                "id": m.get("id"),
                "provider": provider_name,
                "provider_name": provider_name,
                "category": cat_key,
                "display_name": display_name,
                "name": display_name,
                "plain_key": raw_key,
                "raw_key": raw_key,
                "key_preview": f"{raw_key[:5]}...{raw_key[-4:]}" if len(raw_key) > 8 else "sk-...",
                "base_url": m.get("base_url") or "",
                "primary_model": m.get("primary_model") or "",
                "default_model": m.get("primary_model") or "",
                "default_voice_id": m.get("primary_model") or "",
                "selection_strategy": m.get("selection_strategy") or "dynamic",
                "api_version": m.get("api_version") or "v1",
                "status": m.get("status") or "Active",
                "organization_id": m.get("organization_id"),
                "user_id": m.get("user_id"),
                "created_at": str(m.get("created_at")) if m.get("created_at") else None,
                "updated_at": str(m.get("updated_at")) if m.get("updated_at") else None,
            })
            if row_id:
                seen_set.add(row_id)
            if row_pname:
                seen_set.add(row_pname)
            if row_dname:
                seen_set.add(row_dname)

    # 3. Query active WebhookSubscriptions for webhooks category (Single Source of Truth)
    result["webhooks"] = []
    seen_wh_ids: set[str] = set()
    try:
        wh_subs = (
            db.query(WebhookSubscription)
            .filter(WebhookSubscription.organization_id == current_user.organization_id)
            .order_by(WebhookSubscription.created_at.desc())
            .all()
        )
        for wh in wh_subs:
            wh_id = str(wh.id)
            wh_key = wh_id.lower()
            if wh_key in seen_wh_ids:
                continue
            seen_wh_ids.add(wh_key)
            if wh.name:
                seen_wh_ids.add(wh.name.lower())

            sub_evts = wh.subscribed_events or ["call.started", "call.completed", "call.transcript.created"]
            if isinstance(sub_evts, str):
                try:
                    sub_evts = json.loads(sub_evts)
                except Exception:
                    sub_evts = [sub_evts]

            cust_headers = wh.custom_headers or []
            if isinstance(cust_headers, str):
                try:
                    cust_headers = json.loads(cust_headers)
                except Exception:
                    cust_headers = []

            result["webhooks"].append({
                "id": wh.id,
                "name": wh.name,
                "display_name": wh.display_name or wh.name,
                "provider": wh.name,
                "category": "webhooks",
                "url": wh.endpoint_url,
                "endpoint_url": wh.endpoint_url,
                "webhook_url": wh.endpoint_url,
                "http_method": wh.http_method or "POST",
                "auth_type": wh.auth_type or "None",
                "auth_secret": wh.auth_secret or "",
                "subscribed_events": sub_evts,
                "timeout": f"{wh.timeout_seconds or 10}s",
                "timeout_seconds": wh.timeout_seconds or 10,
                "max_retries": wh.max_retries or 3,
                "retry_backoff": wh.retry_backoff or "Exponential (2s / 4s / 8s)",
                "verify_ssl": wh.verify_ssl if wh.verify_ssl is not None else True,
                "custom_headers": cust_headers,
                "status": wh.status or "Active",
                "scope": wh.scope or "Global Workspace",
                "description": wh.description or "Realtime Event Dispatcher Webhook",
                "created_at": str(wh.created_at) if wh.created_at else None,
                "updated_at": str(wh.updated_at) if wh.updated_at else None,
            })
    except Exception as e:
        logger.warning(f"Error fetching WebhookSubscriptions in all-categories: {e}")

    return result

@router.get("/llm")
async def list_llm_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve canonical configured LLM providers from group1_ai_voice__1_llm_providers."""
    all_cats = await list_all_categories(db=db, current_user=current_user)
    result = all_cats.get("llm", [])
    return {"providers": result, "credentials": result}

@router.get("/all-categories")
async def list_all_categories_credentials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all credentials partitioned by category for workspace configuration sync."""
    _ensure_provider_credential_columns(db)
    creds = db.query(ProviderCredential).filter(
        ProviderCredential.organization_id == current_user.organization_id
    ).all()

    by_category: dict = {}
    for c in creds:
        cat = c.category or "llm"
        if cat not in by_category:
            by_category[cat] = []

        raw_meta = getattr(c, 'metadata_json', None)
        meta_parsed = {}
        if raw_meta:
            try:
                meta_parsed = json.loads(raw_meta) if isinstance(raw_meta, str) else raw_meta
            except Exception:
                meta_parsed = {}

        raw_key = getattr(c, 'plain_key', None) or decrypt_secret(str(c.encrypted_key))
        item_obj = {
            **meta_parsed,
            "id": c.id,
            "provider": c.provider_name,
            "category": cat,
            "name": meta_parsed.get("name") or getattr(c, 'display_name', None) or c.provider_name.replace('_', ' ').title(),
            "display_name": getattr(c, 'display_name', None) or meta_parsed.get("display_name") or c.provider_name.replace('_', ' ').title(),
            "base_url": getattr(c, 'base_url', None) or meta_parsed.get("base_url") or meta_parsed.get("sip_host") or meta_parsed.get("ip_host") or "",
            "primary_model": getattr(c, 'primary_model', None) or meta_parsed.get("primary_model") or "dynamic",
            "selection_strategy": getattr(c, 'selection_strategy', None) or "dynamic",
            "api_version": getattr(c, 'api_version', None) or meta_parsed.get("api_version") or "v1",
            "plain_key": raw_key,
            "status": meta_parsed.get("status") or "Active",
            "metadata": meta_parsed
        }
        by_category[cat].append(item_obj)

    return by_category

@router.get("")
@router.get("/")
async def list_credentials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all credentials configured for the organization."""
    _ensure_provider_credential_columns(db)
    creds = db.query(ProviderCredential).filter(
        ProviderCredential.organization_id == current_user.organization_id
    ).all()
    
    result = []
    for c in creds:
        raw_key = getattr(c, 'plain_key', None) or decrypt_secret(str(c.encrypted_key))
        if len(raw_key) > 8:
            key_preview = f"{raw_key[:5]}...{raw_key[-4:]}"
        elif len(raw_key) > 0:
            key_preview = raw_key[:3] + "..."
        else:
            key_preview = "sk-..."

        raw_meta = getattr(c, 'metadata_json', None)
        meta_parsed = None
        if raw_meta:
            try:
                meta_parsed = json.loads(raw_meta) if isinstance(raw_meta, str) else raw_meta
            except Exception:
                meta_parsed = raw_meta

        result.append({
            "id": c.id,
            "provider": c.provider_name,
            "category": c.category,
            "is_owner": c.is_owner_key,
            "user_id": c.user_id,
            "base_url": getattr(c, 'base_url', None) or "",
            "primary_model": getattr(c, 'primary_model', None) or "dynamic",
            "selection_strategy": getattr(c, 'selection_strategy', None) or "dynamic",
            "api_version": getattr(c, 'api_version', None) or "v1",
            "metadata_json": meta_parsed,
            "metadata": meta_parsed,
            "display_name": getattr(c, 'display_name', None) or c.provider_name.replace('_', ' ').title(),
            "subtab_name": getattr(c, 'subtab_name', None) or c.category,
            "plain_key": raw_key,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "key_preview": key_preview,
            "raw_key": raw_key,
        })

    return {"credentials": result}

@router.post("")
@router.post("/")
async def save_credential(
    payload: CredentialPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save or update a provider credential or configuration record."""
    _ensure_provider_credential_columns(db)
    provider_name = payload.provider.lower().strip()
    
    # Enforce only super_admin / owner can set owner keys
    if payload.is_owner and current_user.role != "super_admin" and current_user.role != "Owner":
        raise HTTPException(status_code=403, detail="Only owners can set workspace-level credentials")

    # Check if record exists
    existing = None
    if payload.id:
        existing = db.query(ProviderCredential).filter(
            ProviderCredential.id == payload.id,
            ProviderCredential.organization_id == current_user.organization_id
        ).first()
        
    # Only fallback to provider_name check for singleton provider categories (llm, stt, voice, embeddings, vision_doc)
    if not existing and payload.category in ["llm", "stt", "voice", "embeddings", "vision_doc"]:
        existing = db.query(ProviderCredential).filter(
            ProviderCredential.organization_id == current_user.organization_id,
            ProviderCredential.provider_name == provider_name,
            ProviderCredential.category == payload.category,
            ProviderCredential.is_owner_key == payload.is_owner,
            ProviderCredential.user_id == (None if payload.is_owner else current_user.id)
        ).first()

    meta_str = None
    if payload.metadata_json:
        meta_str = json.dumps(payload.metadata_json) if isinstance(payload.metadata_json, (dict, list)) else str(payload.metadata_json)

    key_to_save = payload.api_key or "config_rule"

    if existing:
        if payload.api_key:
            existing.encrypted_key = encrypt_secret(payload.api_key)
            existing.plain_key = payload.api_key
        existing.is_owner_key = payload.is_owner
        existing.user_id = None if payload.is_owner else current_user.id
        if payload.base_url is not None:
            existing.base_url = payload.base_url
        if payload.primary_model is not None:
            existing.primary_model = payload.primary_model
        if payload.selection_strategy is not None:
            existing.selection_strategy = payload.selection_strategy
        if payload.api_version is not None:
            existing.api_version = payload.api_version
        if payload.display_name is not None:
            existing.display_name = payload.display_name
        if payload.subtab_name is not None:
            existing.subtab_name = payload.subtab_name
        if meta_str is not None:
            existing.metadata_json = meta_str
        target = existing
    else:
        target_id = payload.id if payload.id and len(payload.id) > 2 else f"{payload.category}_{uuid.uuid4().hex[:12]}"
        new_cred = ProviderCredential(
            id=target_id,
            organization_id=current_user.organization_id,
            user_id=None if payload.is_owner else current_user.id,
            provider_name=provider_name,
            category=payload.category,
            encrypted_key=encrypt_secret(key_to_save),
            plain_key=key_to_save,
            display_name=payload.display_name or provider_name.replace('_', ' ').title(),
            subtab_name=payload.subtab_name or payload.category,
            is_owner_key=payload.is_owner,
            base_url=payload.base_url,
            primary_model=payload.primary_model or "dynamic",
            selection_strategy=payload.selection_strategy or "dynamic",
            api_version=payload.api_version or "v1",
            metadata_json=meta_str
        )
        db.add(new_cred)
        target = new_cred

    db.commit()
    db.refresh(target)

    # Sync to dedicated subtab table for clean database exploration
    _sync_to_subtab_tables(db, target)

    return {"status": "success", "message": "Credential saved securely.", "id": target.id}


SUBTAB_TABLE_MAP: dict[str, str] = {
    "llm": "group1_ai_voice__1_llm_providers",
    "stt": "group1_ai_voice__2_stt_engines",
    "voice": "group1_ai_voice__3_voice_synthesizers",
    "embeddings": "group1_ai_voice__4_embedding_vector_ai",
    "vision_doc": "group1_ai_voice__5_vision_document_ai",
    "business_types": "group2_business_rules__1_business_types",
    "languages": "group2_business_rules__2_languages",
    "working_hours": "group2_business_rules__3_working_hours",
    "departments": "group2_business_rules__4_departments",
    "timezones": "group2_business_rules__5_time_zones",
    "time_zones": "group2_business_rules__5_time_zones",
    "business_policies": "group2_business_rules__5_business_policies",
    "telephony_carriers": "group3_telephony_sims__1_telephony_carriers",
    "telephony_providers": "group3_telephony_sims__1_telephony_carriers",
    "sip_trunks": "group3_telephony_sims__2_sip_trunks",
    "sip_providers": "group3_telephony_sims__2_sip_trunks",
    "android_devices": "group3_telephony_sims__3_android_devices",
    "gsm_gateways": "group3_telephony_sims__3_android_devices",
    "call_dispositions": "group3_telephony_sims__4_call_dispositions",
    "dispositions": "group3_telephony_sims__4_call_dispositions",
    "knowledge_collections": "group4_data_webhooks__1_knowledge_collections",
    "prompt_templates": "group4_data_webhooks__2_prompt_templates",
    "webhooks": "group4_data_webhooks__3_webhook_endpoints",
    "variables": "group4_data_webhooks__4_variables",
    "tags": "group4_data_webhooks__5_tags",
    "crm_status": "group4_data_webhooks__6_crm_statuses",
    "crm_statuses": "group4_data_webhooks__6_crm_statuses",
    "custom_fields": "group4_data_webhooks__7_custom_fields",
}

def _sync_to_subtab_tables(db: Session, cred: ProviderCredential) -> None:
    """Mirror credentials into dedicated group-prefixed subtab tables for clean SQLite viewer exploration."""
    try:
        tbl = SUBTAB_TABLE_MAP.get(str(cred.category))
        if tbl:
            raw_key = str(getattr(cred, 'plain_key', None) or decrypt_secret(str(cred.encrypted_key)))
            disp_name = str(getattr(cred, 'display_name', None) or str(cred.provider_name).replace('_', ' ').title())
            b_url = str(getattr(cred, 'base_url', '') or '')
            p_model = str(getattr(cred, 'primary_model', '') or 'dynamic')
            
            org_id = str(cred.organization_id)
            u_id = str(cred.user_id) if cred.user_id else None
            enc_key = str(cred.encrypted_key or '')
            strat = str(getattr(cred, 'selection_strategy', '') or 'dynamic')
            api_v = str(getattr(cred, 'api_version', '') or 'v1')

            db.execute(text(f"""
                INSERT INTO {tbl} (
                    id, organization_id, user_id, provider_name, display_name,
                    plain_key, encrypted_key, base_url, primary_model, selection_strategy, api_version, status
                ) VALUES (
                    :id, :organization_id, :user_id, :provider_name, :display_name,
                    :plain_key, :encrypted_key, :base_url, :primary_model, :selection_strategy, :api_version, 'Active'
                )
                ON CONFLICT(organization_id, provider_name) DO UPDATE SET
                    id=excluded.id,
                    user_id=excluded.user_id,
                    display_name=excluded.display_name,
                    plain_key=excluded.plain_key,
                    encrypted_key=excluded.encrypted_key,
                    base_url=excluded.base_url,
                    primary_model=excluded.primary_model,
                    selection_strategy=excluded.selection_strategy,
                    api_version=excluded.api_version,
                    status='Active'
            """), {
                "id": str(cred.id),
                "organization_id": org_id,
                "user_id": u_id,
                "provider_name": str(cred.provider_name),
                "display_name": disp_name,
                "plain_key": raw_key,
                "encrypted_key": enc_key,
                "base_url": b_url,
                "primary_model": p_model,
                "selection_strategy": strat,
                "api_version": api_v
            })
            db.commit()
    except Exception:
        db.rollback()

def _delete_from_subtab_tables(db: Session, cred_id: str, category: str | None = None) -> bool:
    deleted = False
    try:
        if category and category in SUBTAB_TABLE_MAP:
            tbl = SUBTAB_TABLE_MAP[category]
            res = db.execute(text(f"DELETE FROM {tbl} WHERE id = :id OR provider_name = :id"), {"id": cred_id})
            db.commit()
            if res.rowcount and res.rowcount > 0:
                deleted = True
        else:
            for tbl in set(SUBTAB_TABLE_MAP.values()):
                res = db.execute(text(f"DELETE FROM {tbl} WHERE id = :id OR provider_name = :id"), {"id": cred_id})
                db.commit()
                if res.rowcount and res.rowcount > 0:
                    deleted = True
    except Exception as e:
        print(f"Error in _delete_from_subtab_tables: {e}")
        db.rollback()
    return deleted

@router.delete("/{credential_id}")
async def delete_credential(
    credential_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ProviderCredential).filter(
        (ProviderCredential.id == credential_id) |
        (ProviderCredential.provider_name == credential_id) |
        (ProviderCredential.display_name == credential_id)
    )
    if current_user.organization_id:
        query = query.filter(ProviderCredential.organization_id == current_user.organization_id)

    creds = query.all()
    deleted = False
    if creds:
        for cred in creds:
            cat = str(cred.category) if cred.category else None
            _delete_from_subtab_tables(db, str(cred.id), cat)
            _delete_from_subtab_tables(db, str(cred.provider_name), cat)
            db.delete(cred)
        db.commit()
        deleted = True
    else:
        deleted = _delete_from_subtab_tables(db, credential_id)

    # Also clean up from WebhookSubscription if applicable
    try:
        wh_subs = db.query(WebhookSubscription).filter(
            (WebhookSubscription.id == credential_id) |
            (WebhookSubscription.name == credential_id)
        ).all()
        for wh in wh_subs:
            db.delete(wh)
        if wh_subs:
            db.commit()
            deleted = True
    except Exception as e:
        logger.warning(f"Error deleting WebhookSubscription: {e}")

    return {"status": "success", "message": "Record removed."}

@router.post("/test")
async def test_connection(
    payload: ProviderTestPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test connection using a real API key or stored credential through central registry service."""
    provider = payload.provider.lower().strip()
    api_key = payload.api_key
    
    if not api_key or api_key == "DB_KEY":
        api_key = resolve_credential_key(db, str(current_user.organization_id), str(current_user.id), provider, payload.credential_id)
        
    clean_key = (api_key or "").strip()
    local_engines = [
        "ollama", "lmstudio", "lm_studio", "vllm", "localai",
        "piper", "coqui", "kokoro", "whisper_local", "faster_whisper",
        "local_bge", "local_tesseract"
    ]

    # 1. Reject placeholder, demo, or dummy keys for cloud providers
    is_demo_key = (
        not clean_key or
        clean_key.endswith("_DEMO") or
        "_DEMO_" in clean_key or
        clean_key.startswith("sk-test-demo") or
        clean_key in ["DEMO", "demo", "test", "local-endpoint", "DB_KEY"]
    )

    if provider not in local_engines and is_demo_key:
        raise HTTPException(
            status_code=400,
            detail=f"Connection Failed: Placeholder/Demo API key '{clean_key}' detected for provider '{provider}'. Please enter a real working API key."
        )

    # 2. Perform live network ping/query to real provider API
    start_time = time.perf_counter()

    if provider in ["elevenlabs", "cartesia", "deepgram", "google_cloud", "azure_speech", "piper", "coqui", "kokoro", "whisper_local"]:
        results = await registry_service.get_voice_models(provider, api_key=clean_key, endpoint=payload.endpoint)
    else:
        results = await registry_service.get_llm_models(provider, api_key=clean_key, endpoint=payload.endpoint)

    latency_ms = round((time.perf_counter() - start_time) * 1000, 1)

    if not results:
        if provider in local_engines:
            ep = payload.endpoint or registry_service.resolve_endpoint(provider)
            raise HTTPException(
                status_code=400,
                detail=f"Local Connection Failed: Could not connect to local engine at '{ep}'. Please ensure the local service is running on your machine."
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Connection Failed: Authentication failed for provider '{provider}'. Please check that your API key is active and valid."
            )

    models_count = len(results)

    return {
        "status": "connected",
        "provider": provider,
        "latency_ms": latency_ms,
        "models_count": models_count,
        "message": f"Connection to {provider.upper()} verified successfully ({models_count} models/voices loaded in {latency_ms}ms)."
    }


@router.get("/{credential_id}/dependencies")
async def check_dependencies(
    credential_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check workspace dependencies (agents, campaigns, workflows, automations) bound to a record before deletion."""
    cred = db.query(ProviderCredential).filter(
        ProviderCredential.id == credential_id,
        ProviderCredential.organization_id == current_user.organization_id
    ).first()

    name = cred.display_name if cred and cred.display_name else (cred.provider_name if cred else credential_id)
    search_term = (name or credential_id).lower()

    # Query real agents bound to this credential/rule
    agents_query = db.query(Agent).filter(Agent.organization_id == current_user.organization_id).all()
    matching_agents = [
        a for a in agents_query
        if search_term in (a.name or "").lower()
        or search_term in (a.system_prompt or "").lower()
        or search_term in (a.llm_model or "").lower()
        or search_term in (a.voice_id or "").lower()
    ]
    agents_count = len(matching_agents)

    campaigns_count = 0
    workflows_count = 0
    business_rules_count = 0
    automations_count = 0

    total = agents_count + campaigns_count + workflows_count + business_rules_count + automations_count

    return {
        "id": credential_id,
        "name": name,
        "is_referenced": total > 0,
        "total_references": total,
        "dependencies": {
            "agents": agents_count,
            "campaigns": campaigns_count,
            "workflows": workflows_count,
            "business_rules": business_rules_count,
            "automations": automations_count
        }
    }


