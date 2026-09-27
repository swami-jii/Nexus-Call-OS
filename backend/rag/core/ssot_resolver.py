"""
Central Single Source of Truth (SSOT) Dynamic Resolver for RAG Architecture.
Resolves models and API credentials dynamically from Tab 1 (LLM/Vision), Tab 2 (STT),
Tab 3 (Voice Synthesizers), and Tab 4 (Vector Embeddings) with zero hardcoded values.
"""

import logging
import os
from typing import Any, Optional
from sqlalchemy.orm import Session

from backend.models.models import (
    EmbeddingVectorAi,
    Integration,
    LlmProvider,
    ProviderCredential,
    SttEngine,
    VoiceSynthesizer,
)

logger = logging.getLogger(__name__)


class SSOTResolver:
    """Dynamically resolves active credentials and models from Tab 1-4 Database SSOT."""

    @classmethod
    def resolve_llm_or_vision_config(
        cls,
        selected_provider: Optional[str] = None,
        selected_model: Optional[str] = None,
        db: Optional[Session] = None,
        org_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Optional[dict[str, Any]]:
        """Resolves active LLM / Vision model from Tab 1 (tab1_llm_providers) and ProviderCredential SSOT."""
        # Auto-infer provider from model name if provider not explicitly passed
        if not selected_provider and selected_model and selected_model.lower() not in ["dynamic", "default", "none", "auto-optimized"]:
            sm_lower = selected_model.lower()
            if "gemini" in sm_lower:
                selected_provider = "google"
            elif any(k in sm_lower for k in ["qwen", "gpt-oss"]):
                selected_provider = "groq"
            elif "claude" in sm_lower:
                selected_provider = "anthropic"
            elif any(k in sm_lower for k in ["gpt-4", "gpt-3.5", "o1", "o3", "text-embedding"]):
                selected_provider = "openai"
            elif any(k in sm_lower for k in ["nvidia", "mistral", "nvapi"]):
                selected_provider = "nvidia"
            elif "openrouter" in sm_lower:
                selected_provider = "openrouter"

        if db is not None:
            # 1. Check Tab 1 LlmProvider table
            try:
                query = db.query(LlmProvider)
                if org_id and hasattr(LlmProvider, "organization_id"):
                    query = query.filter(getattr(LlmProvider, "organization_id") == org_id)
                tab1_records = query.order_by(LlmProvider.updated_at.desc(), LlmProvider.created_at.desc()).all()

                if selected_provider:
                    target_prov = selected_provider.strip().lower()
                    for r in tab1_records:
                        prov_name = (r.provider_name or "").strip().lower()
                        disp_name = (r.display_name or "").strip().lower()
                        if target_prov in prov_name or target_prov in disp_name or prov_name in target_prov:
                            key = r.plain_key or ""
                            model = selected_model or r.primary_model or cls._default_model_for_provider(r.provider_name)
                            if key:
                                return {
                                    "provider": r.provider_name.lower(),
                                    "model": model,
                                    "api_key": key,
                                    "base_url": r.base_url or None,
                                    "source": "Tab 1 SSOT (Explicit Match)"
                                }

                for r in tab1_records:
                    if r.status and r.status.lower() in ["connected", "active"]:
                        key = r.plain_key or ""
                        if key:
                            model = selected_model or r.primary_model or cls._default_model_for_provider(r.provider_name)
                            return {
                                "provider": r.provider_name.lower(),
                                "model": model,
                                "api_key": key,
                                "base_url": r.base_url or None,
                                "source": "Tab 1 SSOT (Active First)"
                            }
            except Exception as e:
                logger.warning(f"Error querying Tab 1 LlmProvider: {e}")

            # 2. Check ProviderCredential table
            try:
                cred_query = db.query(ProviderCredential)
                if org_id and hasattr(ProviderCredential, "organization_id"):
                    cred_query = cred_query.filter(getattr(ProviderCredential, "organization_id") == org_id)
                creds = cred_query.all()
                llm_creds = [c for c in creds if c.category in ["llm", "ai"] and (c.plain_key or c.encrypted_key)]

                if selected_provider and llm_creds:
                    target_p = selected_provider.strip().lower()
                    for c in llm_creds:
                        p_name = c.provider_name.lower()
                        if (
                            target_p in p_name
                            or p_name in target_p
                            or ("gemini" in target_p and "google" in p_name)
                            or ("google" in target_p and "gemini" in p_name)
                            or ("claude" in target_p and "anthropic" in p_name)
                        ):
                            key_val = c.plain_key or c.encrypted_key or ""
                            actual_m = selected_model or (c.primary_model if c.primary_model and c.primary_model.lower() not in ["dynamic", "default", "none"] else None) or cls._default_model_for_provider(p_name)
                            return {
                                "provider": p_name,
                                "model": actual_m,
                                "api_key": key_val,
                                "base_url": c.base_url or None,
                                "source": "ProviderCredential SSOT (Explicit Match)"
                            }

                if llm_creds:
                    top_c = llm_creds[0]
                    key_val = top_c.plain_key or top_c.encrypted_key or ""
                    p_name = top_c.provider_name.lower()
                    actual_m = selected_model or (top_c.primary_model if top_c.primary_model and top_c.primary_model.lower() not in ["dynamic", "default", "none"] else None) or cls._default_model_for_provider(p_name)
                    return {
                        "provider": p_name,
                        "model": actual_m,
                        "api_key": key_val,
                        "base_url": top_c.base_url or None,
                        "source": "ProviderCredential SSOT (Active First)"
                    }
            except Exception as e:
                logger.warning(f"Error querying ProviderCredential: {e}")

        # Environment fallback if DB not available
        return cls._resolve_env_llm(selected_provider, selected_model)

    @classmethod
    def get_all_available_llm_configs(
        cls,
        db: Optional[Session] = None,
        org_id: Optional[str] = None
    ) -> list[dict[str, Any]]:
        """Returns all configured, functional LLM providers in DB for graceful cascade failover."""
        configs: list[dict[str, Any]] = []
        seen_providers: set[str] = set()

        if db is not None:
            try:
                creds = db.query(ProviderCredential).filter(ProviderCredential.category.in_(["llm", "ai"])).all()
                for c in creds:
                    key = c.plain_key or c.encrypted_key
                    p_name = c.provider_name.lower()
                    if key and p_name not in seen_providers:
                        seen_providers.add(p_name)
                        configs.append({
                            "provider": p_name,
                            "model": c.primary_model or cls._default_model_for_provider(p_name),
                            "api_key": key,
                            "base_url": c.base_url or None,
                            "source": f"DB Credential ({p_name})"
                        })
            except Exception as e:
                logger.warning(f"Error fetching all LLM configs: {e}")

        return configs

    @classmethod
    def resolve_stt_config(
        cls,
        selected_provider: Optional[str] = None,
        db: Optional[Session] = None,
        org_id: Optional[str] = None
    ) -> Optional[dict[str, Any]]:
        """Resolves active Speech-to-Text engine from Tab 2 (tab2_stt_engines)."""
        if db is not None:
            try:
                query = db.query(SttEngine)
                if org_id and hasattr(SttEngine, "organization_id"):
                    query = query.filter(getattr(SttEngine, "organization_id") == org_id)
                records = query.order_by(SttEngine.updated_at.desc(), SttEngine.created_at.desc()).all()

                for r in records:
                    if r.status and r.status.lower() in ["connected", "active"]:
                        key = r.plain_key or ""
                        if key:
                            return {
                                "provider": r.provider_name.lower(),
                                "model": r.primary_model or "nova-2",
                                "api_key": key,
                                "base_url": r.base_url or None,
                                "source": "Tab 2 STT SSOT"
                            }
            except Exception as e:
                logger.warning(f"Error querying Tab 2 SttEngine: {e}")

        # Deepgram / Whisper env check
        dg_key = os.environ.get("DEEPGRAM_API_KEY")
        if dg_key:
            return {"provider": "deepgram", "model": "nova-2", "api_key": dg_key, "source": "ENV"}
        oai_key = os.environ.get("OPENAI_API_KEY")
        if oai_key:
            return {"provider": "openai", "model": "whisper-1", "api_key": oai_key, "source": "ENV"}
        return None

    @classmethod
    def resolve_embedding_config(
        cls,
        selected_provider: Optional[str] = None,
        db: Optional[Session] = None,
        org_id: Optional[str] = None
    ) -> Optional[dict[str, Any]]:
        """Resolves active Vector Embedding model from Tab 4 (tab4_embedding_vector_ai)."""
        if db is not None:
            try:
                query = db.query(EmbeddingVectorAi)
                if org_id and hasattr(EmbeddingVectorAi, "organization_id"):
                    query = query.filter(getattr(EmbeddingVectorAi, "organization_id") == org_id)
                records = query.order_by(EmbeddingVectorAi.updated_at.desc(), EmbeddingVectorAi.created_at.desc()).all()

                for r in records:
                    if r.status and r.status.lower() in ["connected", "active"]:
                        key = r.plain_key or ""
                        if key:
                            return {
                                "provider": r.provider_name.lower(),
                                "model": r.primary_model or "text-embedding-3-small",
                                "api_key": key,
                                "base_url": r.base_url or None,
                                "source": "Tab 4 Embedding SSOT"
                            }
            except Exception as e:
                logger.warning(f"Error querying Tab 4 EmbeddingVectorAi: {e}")

        # Fallback to Tab 1 LLM key for embedding (OpenAI or Gemini)
        tab1_cfg = cls.resolve_llm_or_vision_config(db=db, org_id=org_id)
        if tab1_cfg and tab1_cfg.get("api_key"):
            prov = tab1_cfg["provider"]
            if "openai" in prov:
                return {"provider": "openai", "model": "text-embedding-3-small", "api_key": tab1_cfg["api_key"], "source": "Tab 1 Derived"}
            elif "gemini" in prov or "google" in prov:
                return {"provider": "gemini", "model": "text-embedding-004", "api_key": tab1_cfg["api_key"], "source": "Tab 1 Derived"}

        return None

    @classmethod
    def _default_model_for_provider(cls, provider_name: Optional[str]) -> str:
        p = (provider_name or "").lower()
        if "nvidia" in p:
            return "meta/llama-3.2-11b-vision-instruct"
        elif "groq" in p:
            return "qwen/qwen3.8-27b"
        elif "gemini" in p or "google" in p:
            return "gemini-flash-latest"
        elif "openai" in p:
            return "gpt-4o-mini"
        elif "anthropic" in p or "claude" in p:
            return "claude-3-5-sonnet-20241022"
        elif "deepseek" in p:
            return "deepseek-chat"
        elif "openrouter" in p:
            return "meta-llama/llama-3.3-70b-instruct"
        return "meta/llama-3.2-11b-vision-instruct"

    @classmethod
    def _resolve_env_llm(cls, provider: Optional[str], model: Optional[str]) -> Optional[dict[str, Any]]:
        gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        openai_key = os.environ.get("OPENAI_API_KEY")
        anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
        groq_key = os.environ.get("GROQ_API_KEY")

        clean_model = model if model and model.lower() not in ["dynamic", "default", "none"] else None

        if provider:
            p_low = provider.lower()
            if ("gemini" in p_low or "google" in p_low) and gemini_key:
                return {"provider": "gemini", "model": clean_model or "gemini-2.0-flash", "api_key": gemini_key, "source": "ENV"}
            if "openai" in p_low and openai_key:
                return {"provider": "openai", "model": clean_model or "gpt-4o-mini", "api_key": openai_key, "source": "ENV"}
            if ("anthropic" in p_low or "claude" in p_low) and anthropic_key:
                return {"provider": "anthropic", "model": clean_model or "claude-3-5-sonnet-20241022", "api_key": anthropic_key, "source": "ENV"}
            if "groq" in p_low and groq_key:
                return {"provider": "groq", "model": clean_model or "llama-3.3-70b-versatile", "api_key": groq_key, "source": "ENV"}

        if gemini_key:
            return {"provider": "gemini", "model": clean_model or "gemini-2.0-flash", "api_key": gemini_key, "source": "ENV"}
        if openai_key:
            return {"provider": "openai", "model": clean_model or "gpt-4o-mini", "api_key": openai_key, "source": "ENV"}
        if anthropic_key:
            return {"provider": "anthropic", "model": clean_model or "claude-3-5-sonnet-20241022", "api_key": anthropic_key, "source": "ENV"}
        if groq_key:
            return {"provider": "groq", "model": clean_model or "llama-3.3-70b-versatile", "api_key": groq_key, "source": "ENV"}

        return None
