import sys
from pathlib import Path

# Add project root directory to sys.path to support running directly from any directory
PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import settings
from backend.database.base import Base
from backend.database.session import engine
from backend.middleware.audit_middleware import AuditMiddleware
from backend.middleware.rate_limit import RateLimitMiddleware
from backend.routers.agent_engine_router import router as agent_engine_router
from backend.routers.agents import router as agents_router
from backend.routers.api_keys import router as api_key_router
from backend.routers.audit_logs import router as audit_router
from backend.routers.auth import router as auth_router
from backend.routers.billing import router as billing_router
from backend.routers.calls import router as call_router
from backend.routers.campaigns import router as campaigns_router
from backend.routers.contacts import router as contacts_router
from backend.routers.health import router as health_router
from backend.routers.integrations import router as integration_router
from backend.routers.knowledge_base import router as knowledge_router
from backend.routers.live_sessions import router as live_sessions_router
from backend.routers.notifications import router as notification_router
from backend.routers.phone_numbers import router as phone_router
from backend.routers.providers import router as providers_router
from backend.routers.credentials import router as credentials_router
from backend.routers.settings import router as settings_router
from backend.routers.users import router as users_router
from backend.routers.voice_runtime_router import (
    router as voice_runtime_router,
)
from backend.routers.voice_webhooks import router as voice_webhooks_router
from backend.routers.workflows import router as workflow_router
from backend.routers.uploads import router as uploads_router
from backend.services.upload_storage import UploadStorageService
from backend.routers.conversation_engine_router import (
    router as conversation_engine_router,
)
from backend.routers.telephony_router import (
    router as telephony_router,
)
from backend.routers.media_bridge_router import (
    router as media_bridge_router,
)
from backend.routers.runtime_orchestrator_router import (
    router as runtime_orchestrator_router,
)
from backend.routers.behavior_engine_router import (
    router as behavior_engine_router,
)
from backend.routers.demo_router import (
    router as demo_router,
)
from backend.routers.android_gateway_router import (
    router as android_gateway_router,
)
from backend.routers.prompt_templates_ai import (
    router as prompt_templates_ai_router,
)
from backend.routers.webhooks_manager import (
    router as webhooks_manager_router,
)
from backend.routers.public_apis_catalog_router import (
    router as public_apis_catalog_router,
)
from backend.routers.skills_router import (
    router as skills_router,
)
from backend.websocket.router import ws_router
from backend.websocket.twilio_stream_router import router as twilio_ws_router

from sqlalchemy import text
Base.metadata.create_all(bind=engine)

# Auto migration helper to add missing columns to SQLite tables safely
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE agents ADD COLUMN llm_model VARCHAR(100) DEFAULT 'Gemini 1.5 Pro'"))
        conn.commit()
    except Exception:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-ready FastAPI backend architecture for Nexus AI Voice OS.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-initialize organized storage categories under uploads/
UploadStorageService.initialize_storage()

app.include_router(auth_router)
app.include_router(health_router)
app.include_router(users_router)
app.include_router(agents_router)
app.include_router(campaigns_router)
app.include_router(phone_router)
app.include_router(contacts_router)
app.include_router(knowledge_router)
app.include_router(uploads_router)
app.include_router(call_router)
app.include_router(integration_router)
app.include_router(api_key_router)
app.include_router(credentials_router)
app.include_router(billing_router)
app.include_router(notification_router)
app.include_router(audit_router)
app.include_router(settings_router)
app.include_router(workflow_router)
app.include_router(providers_router)
app.include_router(voice_webhooks_router)
app.include_router(live_sessions_router)
app.include_router(agent_engine_router)
app.include_router(conversation_engine_router)
app.include_router(telephony_router)
app.include_router(media_bridge_router)
app.include_router(runtime_orchestrator_router)
app.include_router(behavior_engine_router)
app.include_router(demo_router)
app.include_router(android_gateway_router)
app.include_router(voice_runtime_router)
app.include_router(prompt_templates_ai_router)
app.include_router(webhooks_manager_router)
app.include_router(public_apis_catalog_router)
app.include_router(skills_router)
app.include_router(ws_router)
app.include_router(twilio_ws_router)


@app.get("/docs/integrations/{filename}")
def serve_integration_docs(filename: str):
    import os
    from fastapi.responses import FileResponse, Response
    base_dir = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(base_dir, "docs", "integrations", filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="text/plain; charset=utf-8")
    return Response(content=f"# Documentation for {filename}\n\nFile not found on server.", media_type="text/markdown; charset=utf-8")


@app.get("/download")
@app.get("/download/apk")
@app.get("/downloads/Nexus-GSM-Gateway.apk")
@app.get("/downloads/Nexus-GSM-Gateway-v2.4.apk")
@app.get("/downloads/{filename}")
def direct_apk_download(filename: str = "Nexus-GSM-Gateway.apk"):
    """Direct APK download endpoint for mobile browsers over Wi-Fi."""
    import os
    import glob
    import json
    from fastapi.responses import FileResponse
    downloads_dir = os.path.join(PROJECT_ROOT, "public", "downloads")
    
    # Try exact requested filename first
    req_path = os.path.join(downloads_dir, filename)
    if os.path.exists(req_path) and filename.endswith(".apk"):
        apk_path = req_path
    else:
        # Check metadata
        metadata_file = os.path.join(downloads_dir, "release_metadata.json")
        canonical_name = "Nexus-GSM-Gateway.apk"
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    canonical_name = meta.get("canonicalApkFileName") or meta.get("apkFileName") or canonical_name
            except Exception:
                pass
        apk_path = os.path.join(downloads_dir, canonical_name)
        if not os.path.exists(apk_path):
            candidates = sorted(glob.glob(os.path.join(downloads_dir, "*.apk")), key=os.path.getmtime, reverse=True)
            if candidates:
                apk_path = candidates[0]

    if os.path.exists(apk_path):
        stat_res = os.stat(apk_path)
        out_name = os.path.basename(apk_path)
        return FileResponse(
            apk_path,
            filename=out_name,
            media_type="application/vnd.android.package-archive",
            headers={
                "Content-Length": str(stat_res.st_size),
                "Accept-Ranges": "bytes",
                "Cache-Control": "no-cache",
                "Content-Disposition": f'attachment; filename="{out_name}"'
            }
        )
    return {"error": "APK not found on server"}


@app.get("/")
def root():
    return {
        "title": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "download_apk": "/download",
        "documentation": "/docs",
        "redoc": "/redoc",
        "health": "/api/health",
    }



if __name__ == "__main__":
    import os
    import uvicorn
    from pathlib import Path

    backend_dir = str(Path(__file__).resolve().parent)
    project_root = str(Path(__file__).resolve().parent.parent)

    # Ensure project root is in sys.path and PYTHONPATH so multiprocessing uvicorn reloader workers never fail
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    existing_pp = os.environ.get("PYTHONPATH", "")
    if project_root not in existing_pp:
        os.environ["PYTHONPATH"] = project_root + (os.pathsep + existing_pp if existing_pp else "")

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        app_dir=project_root,
        reload_dirs=[backend_dir],
        reload_excludes=[
            "uploads/*",
            "uploads/**",
            "*.db",
            "*.sqlite",
            "*.log",
            "*.txt",
            "*.json",
            "public/*",
            "public/**",
            "apps/*",
            "apps/**",
            "dist/*",
            ".cache/*",
            ".cache/**",
            ".ruff_cache/**",
            "__pycache__/**",
        ]
    )


