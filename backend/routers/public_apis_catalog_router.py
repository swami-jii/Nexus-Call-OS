"""
Public APIs Catalog Router - Nexus Call OS.
Exposes the complete 1,722+ curated Public APIs Dataset across 50 Categories
for UI display, user integrations, API Key configuration links, and live background testing.
"""

import json
import logging
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.models.models import ProviderCredential
from backend.services.live_knowledge_service import LiveKnowledgeService
from backend.utils.crypto import encrypt_secret

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/public-apis", tags=["Public APIs Catalog"])


class CatalogItemResponse(BaseModel):
    s_no: int
    category_s_no: int
    api: str
    description: str
    category: str
    auth: str
    is_free: bool
    https: bool
    cors: str
    url: str
    get_api_link: str


class CatalogListResponse(BaseModel):
    total_apis: int
    total_categories: int
    total_free_apis: int
    total_keyed_apis: int
    page: int
    limit: int
    apis: List[CatalogItemResponse]


class CategoryStat(BaseModel):
    name: str
    total: int
    free: int
    keyed: int


class CategorySummaryResponse(BaseModel):
    total_categories: int
    categories: List[CategoryStat]


class TestQueryRequest(BaseModel):
    query: str


class TestQueryResponse(BaseModel):
    query: str
    ground_truth_answer: Optional[str]


class ActivateApiPayload(BaseModel):
    s_no: int
    api: str
    category: str
    description: Optional[str] = ""
    url: Optional[str] = ""
    auth: Optional[str] = "None"
    is_free: Optional[bool] = True
    https: Optional[bool] = True
    cors: Optional[str] = "Yes"
    apiKey: Optional[str] = ""
    target_modules: Optional[List[str]] = ["agents", "studio", "campaigns", "rag", "webhooks"]


class BulkActivateRequest(BaseModel):
    category: Optional[str] = "all"
    modules: Optional[List[str]] = ["agents", "studio", "campaigns", "rag", "webhooks"]


@router.get("/catalog", response_model=CatalogListResponse)
def get_public_apis_catalog(
    category: Optional[str] = Query(None, description="Filter by category (e.g. Animals, Music, Weather, Finance)"),
    auth_type: Optional[str] = Query(None, description="Filter by auth type: 'free' (no key needed) or 'keyed' (key required)"),
    search: Optional[str] = Query(None, description="Search query by name, description, or keyword"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=3000),
):
    """
    Returns the paginated and filtered list of 1,722+ Public APIs with Serial Number,
    category, description, auth requirements, and official documentation/API key links.
    """
    cat_filter = str(category).strip() if category is not None and not hasattr(category, 'default') else None
    auth_filter = str(auth_type).strip() if auth_type is not None and not hasattr(auth_type, 'default') else None
    search_filter = str(search).strip() if search is not None and not hasattr(search, 'default') else None
    page_num = max(1, int(page))
    limit_num = max(1, int(limit))

    catalog = LiveKnowledgeService.load_public_apis_catalog()
    all_categories = catalog.get("categories", {})

    all_items: List[Dict[str, Any]] = []
    free_total = 0
    keyed_total = 0

    for cat_name, items in all_categories.items():
        if cat_filter and cat_filter.lower() != "all" and cat_filter.lower() != cat_name.lower():
            continue

        for item in items:
            auth_val = str(item.get("auth", "None") or "None")
            is_free = auth_val.lower() in ["none", "no", ""] or "none" in auth_val.lower()
            if is_free:
                free_total += 1
            else:
                keyed_total += 1

            if auth_filter == "free" and not is_free:
                continue
            if auth_filter == "keyed" and is_free:
                continue

            if search_filter:
                sf = search_filter.lower()
                name_match = sf in str(item.get("api", "")).lower()
                desc_match = sf in str(item.get("description", "")).lower()
                cat_match = sf in cat_name.lower()
                sno_match = sf.replace("#", "").isdigit() and int(sf.replace("#", "")) == int(item.get("s_no", -1))
                if not (name_match or desc_match or cat_match or sno_match):
                    continue

            all_items.append({
                "s_no": int(item.get("s_no", len(all_items) + 1)),
                "category_s_no": int(item.get("category_s_no", 1)),
                "api": item.get("api", "Unknown API"),
                "description": item.get("description", ""),
                "category": cat_name,
                "auth": auth_val,
                "is_free": is_free,
                "https": bool(item.get("https", True)),
                "cors": str(item.get("cors", "Unknown")),
                "url": item.get("url", ""),
                "get_api_link": item.get("url", ""),
            })

    # Sort by s_no
    all_items.sort(key=lambda x: x["s_no"])

    total_matched = len(all_items)
    start_idx = (page_num - 1) * limit_num
    paged_items = all_items[start_idx : start_idx + limit_num]

    return {
        "total_apis": total_matched,
        "total_categories": len(all_categories),
        "total_free_apis": free_total,
        "total_keyed_apis": keyed_total,
        "page": page_num,
        "limit": limit_num,
        "apis": paged_items,
    }


@router.get("/categories", response_model=CategorySummaryResponse)
def get_categories_summary():
    """
    Returns summary statistics for all 50 categories.
    """
    catalog = LiveKnowledgeService.load_public_apis_catalog()
    all_categories = catalog.get("categories", {})

    stats: List[CategoryStat] = []
    for cat_name, apis in sorted(all_categories.items()):
        free_c = sum(1 for a in apis if str(a.get("auth", "")).lower() in ["none", "no", ""] or "none" in str(a.get("auth", "")).lower())
        stats.append(
            CategoryStat(
                name=cat_name,
                total=len(apis),
                free=free_c,
                keyed=len(apis) - free_c,
            )
        )

    return CategorySummaryResponse(
        total_categories=len(stats),
        categories=stats,
    )


@router.get("/active")
def get_active_public_apis(db: Session = Depends(get_db)):
    """
    Fetches all Public APIs that have been explicitly activated or configured in SQLite database.
    """
    try:
        records = db.query(ProviderCredential).filter(
            ProviderCredential.category == "public_apis"
        ).all()

        active_list = []
        for r in records:
            meta = {}
            if r.metadata_json:
                try:
                    meta = json.loads(r.metadata_json) if isinstance(r.metadata_json, str) else r.metadata_json
                except Exception:
                    pass
            active_list.append({
                "id": r.id,
                "provider": r.provider_name,
                "display_name": r.display_name or r.provider_name,
                "api": meta.get("api", r.display_name or r.provider_name),
                "s_no": meta.get("s_no", 0),
                "category": r.primary_model or meta.get("category", "General"),
                "url": r.base_url or meta.get("url", ""),
                "auth": meta.get("auth", "None"),
                "is_free": meta.get("is_free", True),
                "created_at": str(r.created_at) if r.created_at else None,
                "target_modules": meta.get("target_modules", ["agents", "studio", "campaigns", "rag", "webhooks"])
            })

        return {"success": True, "active_apis": active_list, "total_active": len(active_list)}
    except Exception as e:
        logger.error(f"Error fetching active public apis from DB: {e}")
        return {"success": False, "active_apis": [], "total_active": 0}


@router.post("/activate")
def activate_single_api(payload: ActivateApiPayload, db: Session = Depends(get_db)):
    """
    Saves and activates a single Public API in the database.
    """
    provider_key = f"public_api_{payload.s_no}_{payload.api.lower().replace(' ', '_')}"
    existing = db.query(ProviderCredential).filter(
        ProviderCredential.category == "public_apis",
        ProviderCredential.provider_name == provider_key
    ).first()

    meta_dict = {
        "s_no": payload.s_no,
        "api": payload.api,
        "category": payload.category,
        "description": payload.description,
        "url": payload.url,
        "auth": payload.auth,
        "is_free": payload.is_free,
        "https": payload.https,
        "cors": payload.cors,
        "target_modules": payload.target_modules or ["agents", "studio", "campaigns", "rag", "webhooks"]
    }

    if existing:
        existing.display_name = payload.api
        existing.base_url = payload.url
        existing.primary_model = payload.category
        existing.metadata_json = json.dumps(meta_dict)
        if payload.apiKey:
            existing.encrypted_key = encrypt_secret(payload.apiKey)
            existing.plain_key = payload.apiKey
        db.commit()
        return {"success": True, "id": existing.id, "message": f"Updated {payload.api} in workspace database."}

    new_cred = ProviderCredential(
        id=str(uuid.uuid4()),
        organization_id="default",
        user_id="default",
        provider_name=provider_key,
        display_name=payload.api,
        category="public_apis",
        base_url=payload.url,
        primary_model=payload.category,
        plain_key=payload.apiKey or "active_public_api",
        encrypted_key=encrypt_secret(payload.apiKey or "active_public_api"),
        metadata_json=json.dumps(meta_dict)
    )
    db.add(new_cred)
    db.commit()
    return {"success": True, "id": new_cred.id, "message": f"Successfully activated {payload.api} in workspace database."}


@router.delete("/deactivate/{api_identifier}")
def deactivate_api(api_identifier: str, db: Session = Depends(get_db)):
    """
    Deactivates and deletes a Public API from the SQLite database.
    """
    # Find by ID or by provider_name or by s_no
    records = db.query(ProviderCredential).filter(
        ProviderCredential.category == "public_apis"
    ).all()

    deleted_count = 0
    for r in records:
        meta = {}
        if r.metadata_json:
            try:
                meta = json.loads(r.metadata_json) if isinstance(r.metadata_json, str) else r.metadata_json
            except Exception:
                pass

        if (
            r.id == api_identifier
            or r.provider_name == api_identifier
            or str(meta.get("s_no")) == str(api_identifier)
            or str(meta.get("api", "")).lower() == api_identifier.lower()
            or str(r.display_name or "").lower() == api_identifier.lower()
        ):
            db.delete(r)
            deleted_count += 1

    db.commit()
    if deleted_count > 0:
        return {"success": True, "deleted_count": deleted_count, "message": "API removed from workspace database."}
    return {"success": False, "deleted_count": 0, "message": "API was not active in database."}


@router.post("/bulk-activate")
async def bulk_activate_public_apis(req: BulkActivateRequest, db: Session = Depends(get_db)):
    """
    Bulk activates and saves all public APIs in a category (or all 1,722 APIs) to SQLite database.
    Optimized for high-throughput single-batch execution.
    """
    catalog = LiveKnowledgeService.load_public_apis_catalog()
    all_categories = catalog.get("categories", {})

    target_apis = []
    if not req.category or req.category.lower() == "all":
        for cat_name, items in all_categories.items():
            for item in items:
                target_apis.append({**item, "category": cat_name})
        display_cat = "All 50 Categories (1,722 APIs)"
    else:
        for cat_name, items in all_categories.items():
            if cat_name.lower() == req.category.lower():
                for item in items:
                    target_apis.append({**item, "category": cat_name})
                display_cat = cat_name
                break
        else:
            display_cat = req.category

    # Pre-fetch existing public_apis records in a single query
    existing_records = db.query(ProviderCredential).filter(
        ProviderCredential.category == "public_apis"
    ).all()
    existing_map = {r.provider_name: r for r in existing_records}
    enc_secret = encrypt_secret("active_public_api")
    target_modules = req.modules or ["agents", "studio", "campaigns", "rag", "webhooks"]

    new_objects = []
    for item in target_apis:
        p_name = f"public_api_{item.get('s_no')}_{str(item.get('api')).lower().replace(' ', '_')}"
        existing = existing_map.get(p_name)

        meta_dict = {
            "s_no": item.get("s_no"),
            "api": item.get("api"),
            "category": item.get("category"),
            "description": item.get("description", ""),
            "url": item.get("url", ""),
            "auth": item.get("auth", "None"),
            "is_free": str(item.get("auth", "")).lower() in ["none", "no", ""],
            "https": bool(item.get("https", True)),
            "cors": str(item.get("cors", "Yes")),
            "target_modules": target_modules
        }

        if existing:
            existing.metadata_json = json.dumps(meta_dict)
        else:
            new_cred = ProviderCredential(
                id=str(uuid.uuid4()),
                organization_id="default",
                user_id="default",
                provider_name=p_name,
                display_name=item.get("api"),
                category="public_apis",
                base_url=item.get("url", ""),
                primary_model=item.get("category"),
                plain_key="active_public_api",
                encrypted_key=enc_secret,
                metadata_json=json.dumps(meta_dict)
            )
            new_objects.append(new_cred)

    if new_objects:
        db.add_all(new_objects)

    db.commit()
    return {
        "success": True,
        "activated_count": len(target_apis),
        "category": display_cat,
        "message": f"Successfully activated and saved {len(target_apis)} Public APIs in '{display_cat}' to workspace database.",
    }


class BulkDeactivateRequest(BaseModel):
    category: Optional[str] = "all"


@router.post("/bulk-deactivate")
async def bulk_deactivate_public_apis(req: BulkDeactivateRequest, db: Session = Depends(get_db)):
    """
    Deactivates and deletes all public APIs belonging to a specific category (or all) from SQLite database.
    """
    cat_target = str(req.category or "all").lower().strip()
    if cat_target == "all":
        deleted_count = db.query(ProviderCredential).filter(
            ProviderCredential.category == "public_apis"
        ).delete(synchronize_session=False)
        db.commit()
        return {
            "success": True,
            "deleted_count": deleted_count,
            "message": "Removed all Public APIs from workspace database.",
        }

    records = db.query(ProviderCredential).filter(
        ProviderCredential.category == "public_apis"
    ).all()

    deleted_count = 0
    for r in records:
        meta = {}
        if r.metadata_json:
            try:
                meta = json.loads(r.metadata_json) if isinstance(r.metadata_json, str) else r.metadata_json
            except Exception:
                pass
        item_cat = str(r.primary_model or meta.get("category", "")).lower()
        if item_cat == cat_target:
            db.delete(r)
            deleted_count += 1

    db.commit()
    return {
        "success": True,
        "deleted_count": deleted_count,
        "message": f"Removed {deleted_count} Public APIs in category '{req.category}' from workspace database.",
    }


@router.post("/bulk-reset")
async def bulk_reset_public_apis(db: Session = Depends(get_db)):
    """
    Resets workspace Public APIs by deleting all custom registrations from SQLite database.
    """
    deleted_count = db.query(ProviderCredential).filter(
        ProviderCredential.category == "public_apis"
    ).delete(synchronize_session=False)

    db.commit()
    return {
        "success": True,
        "deleted_count": deleted_count,
        "message": f"Database Reset Complete: {deleted_count} Public API custom bindings removed from workspace database.",
    }


@router.post("/test-query", response_model=TestQueryResponse)
async def test_live_background_query(req: TestQueryRequest):
    """
    Simulates a live caller question to demonstrate background resolution of real-time answers.
    """
    ground_truth = await LiveKnowledgeService.resolve_realtime_knowledge_query(req.query)
    return TestQueryResponse(
        query=req.query,
        ground_truth_answer=ground_truth,
    )

