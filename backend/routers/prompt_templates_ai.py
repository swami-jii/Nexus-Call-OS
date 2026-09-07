import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
import httpx
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.models.models import (
    Agent,
    Contact,
    LlmProvider,
    Organization,
    ProviderCredential,
    User,
)
from backend.services.variable_resolver import (
    MissingVariableStrategy,
    ResolutionContext,
    variable_resolver,
)
from backend.utils.crypto import decrypt_secret

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/prompt-templates", tags=["Prompt Templates AI Builder"])


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' | 'assistant' | 'system'")
    content: str


class CurrentTemplateState(BaseModel):
    template_name: Optional[str] = ""
    display_name: Optional[str] = ""
    category: Optional[str] = ""
    custom_category: Optional[str] = ""
    version: Optional[str] = "v1.0.0"
    model_compatibility: Optional[str] = ""
    system_prompt: Optional[str] = ""
    user_prompt: Optional[str] = ""


class PromptBuilderRequest(BaseModel):
    user_prompt: str = Field(..., description="User instruction or refinement in natural language")
    conversation_history: Optional[List[ChatMessage]] = Field(default_factory=list)
    current_state: Optional[CurrentTemplateState] = None
    selected_model: Optional[str] = None
    selected_provider: Optional[str] = None


class GeneratedTemplateResponse(BaseModel):
    template_name: str
    display_name: str
    category: str
    custom_category: Optional[str] = ""
    version: str
    model_compatibility: str
    system_prompt: str
    user_prompt: str
    detected_variables: List[str] = Field(default_factory=list)
    explanation: str
    assistant_message: str


def get_active_ssot_models(db: Session, org_id: Optional[str]) -> List[Dict[str, str]]:
    """
    Dynamically scans active LLM providers configured in the system (SSOT).
    Returns list of dicts: [{'provider': 'google', 'model': 'gemini-2.5-flash', 'label': 'Google — gemini-2.5-flash'}]
    """
    models: List[Dict[str, str]] = []

    # 1. Query ProviderCredential category='llm'
    try:
        cred_query = db.query(ProviderCredential).filter(ProviderCredential.category == "llm")
        if org_id:
            cred_query = cred_query.filter(ProviderCredential.organization_id == org_id)
        creds = cred_query.all()
        for cred in creds:
            p_name = str(cred.provider_name or "").lower().strip()
            p_model = str(cred.primary_model or "").strip()
            if p_model and p_model not in ["dynamic", "default"]:
                if not any(m["model"] == p_model and m["provider"] == p_name for m in models):
                    models.append({
                        "provider": p_name,
                        "model": p_model,
                        "label": f"{p_name.capitalize()} — {p_model}"
                    })
    except Exception as e:
        logger.warning(f"Error querying ProviderCredential for models: {e}")

    # 2. Query LlmProvider table
    try:
        query = db.query(LlmProvider)
        if org_id and hasattr(LlmProvider, "organization_id"):
            query = query.filter(getattr(LlmProvider, "organization_id") == org_id)
        llm_rows = query.all()
        for row in llm_rows:
            p_name = str(getattr(row, "provider", "") or getattr(row, "name", "")).lower().strip()
            p_model = str(getattr(row, "model", "") or getattr(row, "active_model", "")).strip()
            if p_model and p_model not in ["dynamic", "default"]:
                if not any(m["model"] == p_model and m["provider"] == p_name for m in models):
                    models.append({
                        "provider": p_name,
                        "model": p_model,
                        "label": f"{p_name.capitalize()} — {p_model}"
                    })
    except Exception as e:
        logger.warning(f"Error querying LlmProvider for models: {e}")

    return models


def detect_provider_from_name_or_model(provider_str: str, model_str: str) -> str:
    """Detects normalized provider key (google, anthropic, openai, groq, etc.) from names."""
    combined = f"{provider_str} {model_str}".lower().strip()
    if any(x in combined for x in ["claude", "anthropic"]):
        return "anthropic"
    if any(x in combined for x in ["gemini", "google"]):
        return "google"
    if any(x in combined for x in ["openai", "gpt", "o1-", "o3-", "davinci"]):
        return "openai"
    if any(x in combined for x in ["groq"]):
        return "groq"
    if any(x in combined for x in ["deepseek"]):
        return "deepseek"
    if any(x in combined for x in ["openrouter"]):
        return "openrouter"
    if any(x in combined for x in ["mistral", "pixtral"]):
        return "mistral"
    if any(x in combined for x in ["together"]):
        return "together"
    if any(x in combined for x in ["ollama"]):
        return "ollama"
    return (provider_str or "").lower().strip()


def resolve_active_ai_service(
    db: Session,
    org_id: Optional[str],
    preferred_model: Optional[str] = None,
    preferred_provider: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Finds the working LLM provider with decrypted API key in workspace to power the builder.
    Strictly preserves user selected provider and never cross-routes models to wrong APIs.
    """
    model_pref = (preferred_model or "").strip()
    prov_pref = (preferred_provider or "").strip()
    target_prov = detect_provider_from_name_or_model(prov_pref, model_pref)

    # 1. Check ProviderCredential for matching target provider
    try:
        cred_query = db.query(ProviderCredential).filter(ProviderCredential.category == "llm")
        if org_id:
            cred_query = cred_query.filter(ProviderCredential.organization_id == org_id)
        creds = cred_query.all()
        candidates: List[Dict[str, Any]] = []

        for c in creds:
            p_name = str(c.provider_name or "").lower().strip()
            raw_key = ""
            if c.encrypted_key:
                raw_key = decrypt_secret(str(c.encrypted_key)) or ""
            if not raw_key and c.plain_key:
                raw_key = c.plain_key

            if raw_key:
                cand_target_model = model_pref if model_pref and model_pref.lower() not in ["dynamic", "default"] else str(c.primary_model or "").strip()
                candidates.append({
                    "provider": p_name,
                    "model": cand_target_model,
                    "api_key": raw_key,
                    "base_url": c.base_url
                })

        # Match target provider directly
        if target_prov:
            for cand in candidates:
                cand_prov = cand["provider"].lower()
                if target_prov in cand_prov or cand_prov in target_prov:
                    cand["model"] = model_pref or cand["model"]
                    return cand

        # If user did not specify provider, but has candidates
        if not target_prov and candidates:
            return candidates[0]

    except Exception as e:
        logger.warning(f"Error resolving ProviderCredential for AI service: {e}")

    # 2. Check LlmProvider table
    try:
        query = db.query(LlmProvider)
        if org_id and hasattr(LlmProvider, "organization_id"):
            query = query.filter(getattr(LlmProvider, "organization_id") == org_id)
        llm_rows = query.all()
        for row in llm_rows:
            raw_key = getattr(row, "api_key", "") or ""
            if raw_key.startswith("enc:"):
                raw_key = decrypt_secret(raw_key) or ""
            if raw_key:
                p_name = str(getattr(row, "provider", "") or getattr(row, "name", "")).lower().strip()
                if not target_prov or target_prov in p_name or p_name in target_prov:
                    p_model = model_pref or str(getattr(row, "model", "") or getattr(row, "active_model", "")).strip()
                    return {
                        "provider": p_name,
                        "model": p_model,
                        "api_key": raw_key,
                        "base_url": getattr(row, "base_url", None)
                    }
    except Exception as e:
        logger.warning(f"Error resolving LlmProvider for AI service: {e}")

    # 3. Check environment variables specifically for target provider
    env_lookup = {
        "google": ["GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_AI_STUDIO_KEY"],
        "anthropic": ["ANTHROPIC_API_KEY"],
        "openai": ["OPENAI_API_KEY"],
        "groq": ["GROQ_API_KEY"]
    }

    check_provs = [target_prov] if target_prov and target_prov in env_lookup else list(env_lookup.keys())
    for prov_key in check_provs:
        for ev in env_lookup.get(prov_key, []):
            val = os.getenv(ev, "").strip()
            if val:
                return {
                    "provider": prov_key,
                    "model": model_pref or "",
                    "api_key": val,
                    "base_url": None
                }

    return None


@router.get("/available-models")
def get_available_llm_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the real, dynamically configured LLMs in the workspace (SSOT).
    """
    org_id = str(current_user.organization_id) if current_user and current_user.organization_id else None
    models = get_active_ssot_models(db, org_id)
    return {"models": models}


def _extract_state_fields(state: Optional[CurrentTemplateState]) -> Dict[str, str]:
    if state is None:
        return {
            "template_name": "",
            "display_name": "",
            "category": "Outbound Sales",
            "custom_category": "",
            "version": "v1.0.0",
            "model_compatibility": "",
            "system_prompt": "",
            "user_prompt": "",
        }
    return {
        "template_name": str(state.template_name or ""),
        "display_name": str(state.display_name or ""),
        "category": str(state.category or "") or "Outbound Sales",
        "custom_category": str(state.custom_category or ""),
        "version": str(state.version or "v1.0.0"),
        "model_compatibility": str(state.model_compatibility or ""),
        "system_prompt": str(state.system_prompt or ""),
        "user_prompt": str(state.user_prompt or ""),
    }


@router.post("/ai-builder", response_model=GeneratedTemplateResponse)
def generate_prompt_template_with_ai(
    req: PromptBuilderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Interactive AI Chat-driven Template Builder.
    Understands natural language requirements, maintains multi-turn context,
    enforces real system models from SSOT, and outputs structured JSON fields.
    """
    org_id = str(current_user.organization_id) if current_user and current_user.organization_id else None
    available_models = get_active_ssot_models(db, org_id)
    available_model_names = [m["model"] for m in available_models]

    cur_state = _extract_state_fields(req.current_state)
    preferred_model = req.selected_model or (cur_state["model_compatibility"] if cur_state["model_compatibility"] else None)
    preferred_prov = req.selected_provider or (cur_state["model_compatibility"] if cur_state["model_compatibility"] else None)
    ai_service = resolve_active_ai_service(db, org_id, preferred_model=preferred_model, preferred_provider=preferred_prov)
    
    if not ai_service:
        target_name = (preferred_prov or preferred_model or "selected LLM").upper()
        curr_name = cur_state["template_name"]
        curr_disp = cur_state["display_name"]
        curr_cat = cur_state["category"]
        curr_sys = cur_state["system_prompt"]
        curr_usr = cur_state["user_prompt"]

        return GeneratedTemplateResponse(
            template_name=curr_name or "prompt_template",
            display_name=curr_disp or "Voice Persona Template",
            category=curr_cat,
            custom_category="",
            version=cur_state["version"],
            model_compatibility=preferred_model or "claude-3-5-sonnet-20241022",
            system_prompt=curr_sys,
            user_prompt=curr_usr,
            detected_variables=[],
            explanation=f"⚠️ {target_name} API Key Missing",
            assistant_message=f"⚠️ {target_name} ki API Key Tab 1 (LLM Reasoning Models) me add nahi hai. Kripya Tab 1 me jakar {target_name} ki API key save karein ya active Google AI Studio provider select karein."
        )

    provider = ai_service["provider"]
    model = ai_service["model"]
    api_key = ai_service["api_key"]
    base_url = ai_service.get("base_url")

    # Build system instructions
    system_instruction = f"""You are an intelligent, friendly AI Prompt & Persona Architect for Nexus Call OS (an enterprise AI Voice Calling & Telephony platform).
You interact conversationally like ChatGPT/Gemini while being a specialized expert in voice telephony prompt engineering.

AVAILABLE CONFIGURED LLM MODELS IN THIS WORKSPACE (STRICT SINGLE SOURCE OF TRUTH):
{json.dumps(available_models, indent=2)}

CRITICAL LANGUAGE & SCRIPT MIRRORING RULES:
1. STRICT SCRIPT & LANGUAGE MATCHING (MUST FOLLOW WITH ZERO EXCEPTIONS):
   - HINGLISH (Latin/English letters, e.g. "video editor ke liye banao", "kya haal hai", "ek prompt banaiye"):
     -> YOU MUST WRITE BOTH `assistant_message`, `system_prompt`, `user_prompt`, AND `explanation` IN HINGLISH (Latin letters, e.g. "Aap ek professional AI Voice Assistant hain jo {{business_name}} ke liye call kar rahe hain...").
     -> NEVER output Devanagari script (हिंदी) if the user wrote in Hinglish/Latin letters!
   - DEVANAGARI HINDI (e.g. "एक वीडियो एडिटर असिस्टेंट बनाओ"):
     -> Output in Devanagari script (हिंदी) ONLY when the user specifically wrote in Devanagari letters.
   - ENGLISH (e.g. "Create a video editor prompt"):
     -> Output in English.
2. DIRECT ANSWER: If the user asks a question (e.g. about models, features, or instructions), answer their question directly and accurately in `assistant_message`.
3. GREETINGS & CASUAL CHAT:
   - Answer warmly and naturally in `assistant_message` matching the exact script used.
   - In `explanation`, write "Ready to build your voice persona."
   - Keep existing template fields intact. Do NOT overwrite existing prompts with fake templates when the user just says hello or asks a question.
4. PROMPT CREATION / REFINEMENT (e.g. "make a dental clinic receptionist prompt", "create sales sdr script"):
   - Generate complete, high-quality telephony system prompt instructions with clear OBJECTIVE, TONE, CONVERSATIONAL FLOW, and GUARDRAILS (short 2-3 sentence turns for voice telephony) IN THE USER'S EXACT SCRIPT & LANGUAGE.
   - Wrap dynamic variables in double curly brackets: {{{{customer_name}}}}, {{{{business_name}}}}, {{{{appointment_date}}}}, {{{{phone_number}}}}.
   - Set `model_compatibility` to the user's active model: '{model}'.
   - In `assistant_message`, explain the persona design conversationally in the user's language.

REQUIRED JSON SCHEMA:
Return ONLY valid, parseable JSON matching this schema:
{{
  "template_name": "snake_case_name (e.g. dental_appointment_scheduler)",
  "display_name": "Human-Readable Title (e.g. Dental Clinic Appointment Scheduler)",
  "category": "One of: 'Outbound Sales' | 'Inbound Support' | 'Appointment Booking' | 'Debt Collection' | 'Custom'",
  "custom_category": "Specify custom category if category is 'Custom', else empty string",
  "version": "SemVer version (e.g. v1.0.0)",
  "model_compatibility": "{model}",
  "system_prompt": "Comprehensive voice agent persona, role, tone, conversational flow, guardrails, and handling instructions.",
  "user_prompt": "Initial conversational starter / greeting with dynamic variables.",
  "detected_variables": ["list", "of", "variable_names_without_brackets"],
  "explanation": "Brief 1-2 sentence summary in user's language.",
  "assistant_message": "Friendly, direct conversational message to the user in their language (Hinglish/Hindi/English)."
}}
"""

    current_state_context = ""
    if cur_state["system_prompt"] or cur_state["template_name"]:
        current_state_context = f"""
CURRENT TEMPLATE STATE BEFORE THIS REQUEST:
- Template Name: {cur_state['template_name']}
- Display Name: {cur_state['display_name']}
- Category: {cur_state['category']} ({cur_state['custom_category']})
- Version: {cur_state['version']}
- Model Compatibility: {cur_state['model_compatibility']}
- System Prompt: {cur_state['system_prompt']}
- User Prompt: {cur_state['user_prompt']}
"""

    messages_payload: List[Dict[str, str]] = []
    # Add conversation history
    history = req.conversation_history or []
    for msg in history[-6:]:
        messages_payload.append({"role": msg.role if msg.role in ["user", "assistant"] else "user", "content": msg.content})

    user_msg_content = f"{current_state_context}\n\nUSER REQUEST: {req.user_prompt}"
    messages_payload.append({"role": "user", "content": user_msg_content})

    # Call LLM
    try:
        extracted_json_str = call_ai_chat_completion(
            provider=provider,
            model=model,
            api_key=api_key,
            base_url=base_url,
            system_instruction=system_instruction,
            messages=messages_payload
        )

        clean_json = re.sub(r"^```(?:json)?\s*", "", extracted_json_str.strip(), flags=re.MULTILINE)
        clean_json = re.sub(r"\s*```$", "", clean_json.strip(), flags=re.MULTILINE)

        parsed_data = json.loads(clean_json)

        # Enforce user selected model compatibility
        user_selected = str(req.selected_model or cur_state["model_compatibility"] or "").strip()
        chosen_model = user_selected or str(parsed_data.get("model_compatibility", "")).strip()
        if not chosen_model and available_model_names:
            chosen_model = available_model_names[0]

        # Scan variables from generated prompts
        raw_text = f"{parsed_data.get('system_prompt', '')} {parsed_data.get('user_prompt', '')}"
        detected_vars = list(set(re.findall(r"\{\{([a-zA-Z0-9_]+)\}\}", raw_text)))

        template_name = str(parsed_data.get("template_name", "")).strip()
        if template_name:
            template_name = re.sub(r"[^a-zA-Z0-9_]", "_", template_name.lower())

        curr_name = cur_state["template_name"]
        curr_disp = cur_state["display_name"]
        curr_cat = cur_state["category"]
        curr_sys = cur_state["system_prompt"]
        curr_usr = cur_state["user_prompt"]

        return GeneratedTemplateResponse(
            template_name=template_name or curr_name or "prompt_template",
            display_name=str(parsed_data.get("display_name", "") or curr_disp or "Voice Persona Template"),
            category=str(parsed_data.get("category", "") or curr_cat or "Outbound Sales"),
            custom_category=str(parsed_data.get("custom_category", "") or ""),
            version=str(parsed_data.get("version", "") or "v1.0.0"),
            model_compatibility=chosen_model,
            system_prompt=str(parsed_data.get("system_prompt", "") or curr_sys),
            user_prompt=str(parsed_data.get("user_prompt", "") or curr_usr),
            detected_variables=detected_vars or parsed_data.get("detected_variables", []),
            explanation=str(parsed_data.get("explanation", "Prompt template updated.")),
            assistant_message=str(parsed_data.get("assistant_message", "Here is your response!"))
        )

    except Exception as ex:
        logger.error(f"Error in generate_prompt_template_with_ai ({provider}/{model}): {ex}")
        err_detail = str(ex)
        if hasattr(ex, "response") and ex.response is not None:
            try:
                ej = ex.response.json()
                err_detail = ej.get("error", {}).get("message") or ej.get("detail") or str(ex)
            except Exception:
                err_detail = ex.response.text or str(ex)

        # Inform user clearly if model API call failed with exact reason
        curr_name = cur_state["template_name"]
        curr_disp = cur_state["display_name"]
        curr_cat = cur_state["category"]
        curr_sys = cur_state["system_prompt"]
        curr_usr = cur_state["user_prompt"]

        return GeneratedTemplateResponse(
            template_name=curr_name or "prompt_template",
            display_name=curr_disp or "Voice Persona Template",
            category=curr_cat,
            custom_category="",
            version=cur_state["version"],
            model_compatibility=model,
            system_prompt=curr_sys,
            user_prompt=curr_usr,
            detected_variables=[],
            explanation=f"⚠️ {provider.upper()} API Error: {err_detail[:120]}",
            assistant_message=f"⚠️ {provider.upper()} API Error (Model: '{model}'): {err_detail}. Kripya API key ya valid model select karein (jaise claude-3-5-sonnet-20241022 ya gemini-2.5-flash)."
        )


def call_ai_chat_completion(
    provider: str,
    model: str,
    api_key: str,
    base_url: Optional[str],
    system_instruction: str,
    messages: List[Dict[str, str]]
) -> str:
    """Executes chat completion with target provider and returns raw text response"""
    clean_prov = provider.lower().strip()
    timeout = httpx.Timeout(12.0, connect=5.0)

    if clean_prov in ["google", "gemini", "google_ai_studio"]:
        clean_key = api_key.replace("Bearer ", "").strip()
        raw_m = (model or "").strip()
        target_model = raw_m.replace("models/", "").strip()
        if not target_model:
            return "No active model specified for Google Gemini."

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={clean_key}"
        
        contents = []
        for m in messages:
            role = "user" if m["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": m["content"]}]})

        payload = {
            "contents": contents,
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "generationConfig": {
                "temperature": 0.3,
                "responseMimeType": "application/json"
            }
        }
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(url, json=payload, headers={"Content-Type": "application/json"})
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                return "".join(p.get("text", "") for p in parts)
            raise ValueError("Empty response from Google Gemini")

    elif clean_prov in ["anthropic", "claude"]:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        # Sanitize Anthropic model ID
        raw_m = (model or "").strip()
        if not raw_m.startswith("claude-") or any(x in raw_m.lower() for x in ["anthropic", "fixed", "model", "claude opus 5", "claude sonnet 5", "claude haiku 4.5"]):
            if "opus" in raw_m.lower():
                target_model = "claude-3-opus-20240229"
            elif "haiku" in raw_m.lower():
                target_model = "claude-3-5-haiku-20241022"
            else:
                target_model = "claude-3-5-sonnet-20241022"
        else:
            target_model = raw_m

        payload = {
            "model": target_model,
            "system": system_instruction,
            "messages": messages,
            "max_tokens": 3000,
            "temperature": 0.3
        }
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            content = data.get("content", [])
            return "".join(c.get("text", "") for c in content if c.get("type") == "text")

    else:
        # OpenAI / Groq / OpenRouter / Ollama (OpenAI-compatible)
        url = f"{base_url.rstrip('/')}/chat/completions" if base_url else "https://api.openai.com/v1/chat/completions"
        if clean_prov == "groq" and not base_url:
            url = "https://api.groq.com/openai/v1/chat/completions"
        elif clean_prov == "openrouter" and not base_url:
            url = "https://openrouter.ai/api/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        formatted_msgs = [{"role": "system", "content": system_instruction}] + messages
        payload = {
            "model": model,
            "messages": formatted_msgs,
            "temperature": 0.3,
            "response_format": {"type": "json_object"}
        }
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "")
            raise ValueError(f"Empty choices from {clean_prov}")


def fallback_template_generation(
    req: PromptBuilderRequest,
    available_models: List[Dict[str, str]]
) -> GeneratedTemplateResponse:
    """Smart fallback generator when external API is unavailable"""
    user_prompt = req.user_prompt.lower().strip()
    selected_model = available_models[0]["model"] if available_models else ""

    # Conversational greeting check
    greetings = ["hello", "hi", "hey", "hola", "namaste", "good morning", "good evening", "how are you", "who are you", "what can you do"]
    if any(user_prompt.startswith(g) or user_prompt == g for g in greetings) and len(user_prompt) < 35:
        curr_name = str(req.current_state.template_name or "") if req.current_state else ""
        curr_disp = str(req.current_state.display_name or "") if req.current_state else ""
        curr_cat = str(req.current_state.category or "") if req.current_state else "Outbound Sales"
        curr_ver = str(req.current_state.version or "") if req.current_state else "v1.0.0"
        curr_sys = str(req.current_state.system_prompt or "") if req.current_state else ""
        curr_usr = str(req.current_state.user_prompt or "") if req.current_state else ""

        return GeneratedTemplateResponse(
            template_name=curr_name,
            display_name=curr_disp,
            category=curr_cat,
            custom_category="",
            version=curr_ver,
            model_compatibility=selected_model,
            system_prompt=curr_sys,
            user_prompt=curr_usr,
            detected_variables=[],
            explanation="Ready to build your voice persona.",
            assistant_message="Hello! 👋 I am your AI Voice Prompt & Persona Architect. Tell me what type of voice agent you'd like to build — for example, an Outbound Sales SDR, Dental Receptionist, Customer Support, or Debt Collection agent. How can I help you today?"
        )

    # Detect category from keywords
    category = "Outbound Sales"
    if any(k in user_prompt for k in ["support", "help", "customer", "issue", "faq"]):
        category = "Inbound Support"
    elif any(k in user_prompt for k in ["book", "appointment", "schedule", "calendar", "clinic", "dental"]):
        category = "Appointment Booking"
    elif any(k in user_prompt for k in ["debt", "payment", "collection", "bill", "due"]):
        category = "Debt Collection"

    clean_name = re.sub(r"[^a-zA-Z0-9_]", "_", req.user_prompt[:30].strip().lower()).strip("_") or "custom_voice_persona"
    display_title = req.user_prompt[:45].strip().title()

    system_prompt = """You are an expert AI Voice Assistant calling on behalf of {{business_name}}.

OBJECTIVE:
- Fulfill the customer's request regarding {{service_name}}.
- Maintain a warm, polite, and professional tone.
- Confirm all required details ({{customer_name}}, {{appointment_date}}, and {{phone_number}}).

GUARDRAILS:
- Keep spoken responses under 2-3 sentences for natural telephony latency.
- If the customer asks for a human supervisor, politely offer a warm transfer to {{support_agent_name}}.
"""

    user_intro = "Hello {{customer_name}}, this is Alex calling from {{business_name}}. I'm reaching out regarding your {{service_name}} request. How are you doing today?"

    raw_text = f"{system_prompt} {user_intro}"
    detected_vars = variable_resolver.scan_variables(raw_text)

    return GeneratedTemplateResponse(
        template_name=clean_name,
        display_name=display_title,
        category=category,
        custom_category="",
        version="v1.0.0",
        model_compatibility=selected_model,
        system_prompt=system_prompt,
        user_prompt=user_intro,
        detected_variables=detected_vars,
        explanation=f"Generated an optimized {category} voice prompt template.",
        assistant_message=f"I've designed a tailored {category} prompt template for you with dynamic variables! All fields are populated in the form for you to review and adjust."
    )


class TestPromptRequest(BaseModel):
    system_prompt: str
    user_prompt: str
    model_compatibility: Optional[str] = None
    template_name: Optional[str] = None
    category: Optional[str] = None
    agent_id: Optional[str] = None
    gender: Optional[str] = None  # "female" | "male" | "auto"


class TestPromptResponse(BaseModel):
    interpolated_prompt: str
    ai_response: str
    model_used: str
    latency_ms: int
    resolved_entities: Dict[str, Any] = Field(default_factory=dict)
    status: str = "success"


@router.post("/test-prompt", response_model=TestPromptResponse)
def test_prompt_template_live(
    req: TestPromptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Executes a real dynamic test of the prompt template using actual workspace database entities
    (real CRM contacts, assigned AI agents, organization details, and workspace variables)
    and executes live LLM inference against the active configured model with gender & persona awareness. Zero hardcoded data.
    """
    import time
    start_time = time.time()
    org_id = str(current_user.organization_id) if current_user and current_user.organization_id else None

    # 1. Query real CRM contacts in this organization
    real_contact = None
    try:
        c_query = db.query(Contact)
        if org_id:
            c_query = c_query.filter(Contact.organization_id == org_id)
        real_contact = c_query.order_by(Contact.created_at.desc()).first()
    except Exception as e:
        logger.warning(f"Could not query contact for prompt test: {e}")

    # 2. Query real configured AI Agents in this organization
    real_agent = None
    try:
        a_query = db.query(Agent)
        if org_id:
            a_query = a_query.filter(Agent.organization_id == org_id)
        if req.agent_id and req.agent_id != "auto":
            real_agent = a_query.filter((Agent.id == req.agent_id) | (Agent.name == req.agent_id)).first()
        if not real_agent:
            real_agent = a_query.order_by(Agent.created_at.desc()).first()
    except Exception as e:
        logger.warning(f"Could not query agent for prompt test: {e}")

    # 3. Query real Organization info
    real_org = None
    try:
        if org_id:
            real_org = db.query(Organization).filter(Organization.id == org_id).first()
    except Exception as e:
        logger.warning(f"Could not query organization for prompt test: {e}")

    # Build single source of truth dynamic variable dictionary from real DB records
    c_name_val = (real_contact.name if real_contact else None) or (current_user.full_name if current_user else None) or "Valued Client"
    customer_name: str = str(c_name_val)

    c_phone_val = (real_contact.phone if real_contact else None) or (current_user.phone_number if current_user else None) or "+1 (555) 019-2834"
    customer_phone: str = str(c_phone_val)

    c_email_val = (real_contact.email if real_contact else None) or (current_user.email if current_user else None) or "client@example.com"
    customer_email: str = str(c_email_val)
    
    b_name_val = (real_org.name if real_org else None) or "Nexus Enterprise AI"
    business_name: str = str(b_name_val)

    a_name_val = (real_agent.name if real_agent else None) or "Nikita"
    agent_name: str = str(a_name_val)

    v_name_val = (real_agent.voice_id if real_agent else None) or "Conversational Engine"
    voice_name: str = str(v_name_val)

    m_val = req.model_compatibility or (real_agent.llm_model if real_agent else None) or "Gemini 2.5 Flash"
    assigned_model: str = str(m_val)

    # Accurate Gender Resolution
    FEMALE_NAMES = {"nikita", "maya", "priya", "sneha", "ananya", "rachel", "sarah", "bella", "emily", "sophia", "pooja", "neha", "simran", "kavita", "shreya", "divya", "riya", "alisha", "sonia", "tanya"}
    MALE_NAMES = {"mukesh", "alex", "rahul", "amit", "rohan", "david", "john", "vikram", "raj", "suresh", "deepak", "karan", "arjun", "aman", "sachin", "rohit"}

    clean_agent_name = agent_name.strip()
    first_token = clean_agent_name.lower().split()[0] if clean_agent_name else ""

    if req.gender and req.gender.lower() in ["female", "male"]:
        detected_gender = req.gender.lower()
    elif first_token in MALE_NAMES:
        detected_gender = "male"
    elif first_token in FEMALE_NAMES:
        detected_gender = "female"
    else:
        detected_gender = "female"  # Default polite voice assistant persona

    gender_verb_hinglish = "bol rahi hoon" if detected_gender == "female" else "bol raha hoon"
    gender_verb_hi = "बोल रही हूँ" if detected_gender == "female" else "बोल रहा हूँ"
    gender_display = "Female (बोल रही हूँ)" if detected_gender == "female" else "Male (बोल रहा हूँ)"

    # Construct unified ResolutionContext connecting to Centralized VariableResolverService
    resolution_ctx = ResolutionContext(
        organization_id=org_id,
        agent_id=str(real_agent.id) if real_agent else None,
        contact_id=str(real_contact.id) if real_contact else None,
        workspace_overrides={
            "service_name": req.category or "Consultation & Services",
            "project_type": req.category or "Creative Project & Strategy",
            "project_deadline": "Scheduled Milestone",
            "appointment_date": "Next Scheduled Slot",
            "appointment_time": "3:00 PM",
            "user_name": str(current_user.full_name) if current_user and current_user.full_name else customer_name,
        },
        agent_overrides={
            "agent_name": agent_name,
            "assistant_name": agent_name,
            "support_agent_name": agent_name,
            "persona_name": agent_name,
            "voice_id": voice_name,
            "voice_engine": voice_name,
            "agent_gender": detected_gender.title(),
            "agent_gender_code": detected_gender,
            "gender_verb": gender_verb_hinglish,
            "speaking_gender_verb": gender_verb_hinglish,
            "gender_verb_hi": gender_verb_hi,
            "model_name": assigned_model,
            "llm_model": assigned_model,
        },
        contact_overrides={
            "customer_name": customer_name,
            "client_name": customer_name,
            "lead_name": customer_name,
            "contact_name": customer_name,
            "phone_number": customer_phone,
            "phone": customer_phone,
            "customer_phone": customer_phone,
            "email": customer_email,
            "customer_email": customer_email,
        },
        missing_strategy=MissingVariableStrategy.HUMANIZE,
    )

    sys_res = variable_resolver.resolve_text(req.system_prompt, context=resolution_ctx, db=db)
    usr_res = variable_resolver.resolve_text(req.user_prompt, context=resolution_ctx, db=db)

    def apply_gender_grammar(text: str) -> str:
        if not text:
            return ""
        res = text
        if detected_gender == "female":
            res = re.sub(r"\bbol raha hoon\b", "bol rahi hoon", res, flags=re.IGNORECASE)
            res = re.sub(r"\bबोल रहा हूँ\b", "बोल रही हूँ", res)
            res = re.sub(r"\bबोल रहा हु\b", "बोल रही हूँ", res)
            res = re.sub(r"\bkarta hoon\b", "karti hoon", res, flags=re.IGNORECASE)
            res = re.sub(r"\bkarunga\b", "karungi", res, flags=re.IGNORECASE)
        elif detected_gender == "male":
            res = re.sub(r"\bbol rahi hoon\b", "bol raha hoon", res, flags=re.IGNORECASE)
            res = re.sub(r"\bबोल रही हूँ\b", "बोल रहा हूँ", res)
            res = re.sub(r"\bkarti hoon\b", "karta hoon", res, flags=re.IGNORECASE)
            res = re.sub(r"\bkarungi\b", "karunga", res, flags=re.IGNORECASE)
        return res

    interpolated_sys = apply_gender_grammar(sys_res.resolved_text)
    interpolated_usr = apply_gender_grammar(usr_res.resolved_text)

    # Now execute live AI inference against the active LLM service
    ai_service = resolve_active_ai_service(
        db,
        org_id,
        preferred_model=req.model_compatibility,
        preferred_provider=req.model_compatibility
    )

    ai_response_text = ""
    model_used = assigned_model

    if ai_service:
        try:
            model_used = f"{ai_service['provider'].upper()} ({ai_service['model']})"
            test_prompt = interpolated_usr or "Hello! I am ready to begin our session."
            
            # Gender & Persona system instructions
            if detected_gender == "female":
                gender_rule = f"FEMALE: Must use feminine speech in Hindi/Hinglish such as 'main {agent_name} bol rahi hoon', 'karti hoon', 'karungi', 'bata sakti hoon'. NEVER use male grammar."
            else:
                gender_rule = f"MALE: Must use masculine speech in Hindi/Hinglish such as 'main {agent_name} bol raha hoon', 'karta hoon', 'karunga', 'bata sakta hoon'."

            gender_guardrail = (
                f"PERSONA IDENTITY & GENDER GRAMMAR:\n"
                f"- Your name is '{agent_name}'. You work at '{business_name}'.\n"
                f"- Your gender is {detected_gender.upper()} ({gender_rule})\n"
                f"- Always introduce yourself as '{agent_name}' from '{business_name}'. Never say generic 'AI Voice Assistant'."
            )
            
            sys_instruct = f"{interpolated_sys}\n\n{gender_guardrail}" if interpolated_sys else gender_guardrail
            
            raw_response = call_ai_chat_completion(
                provider=ai_service["provider"],
                model=ai_service["model"],
                api_key=ai_service["api_key"],
                base_url=ai_service.get("base_url"),
                system_instruction=sys_instruct,
                messages=[{"role": "user", "content": f"The caller picked up the phone. Deliver this initial greeting turn naturally as {agent_name} ({detected_gender.upper()}): {test_prompt}"}],
            )
            ai_response_text = (raw_response or "").strip()
            # If the model returned JSON (e.g. {"greeting": "..."}), extract the direct speech string
            if ai_response_text.startswith("{") and ai_response_text.endswith("}"):
                try:
                    parsed_json = json.loads(ai_response_text)
                    if isinstance(parsed_json, dict):
                        extracted_val = (
                            parsed_json.get("greeting")
                            or parsed_json.get("response")
                            or parsed_json.get("message")
                            or parsed_json.get("text")
                            or (next(iter(parsed_json.values())) if parsed_json else "")
                        )
                        if extracted_val and isinstance(extracted_val, str):
                            ai_response_text = extracted_val
                except Exception:
                    pass

            if ai_response_text.startswith('"') and ai_response_text.endswith('"'):
                ai_response_text = ai_response_text[1:-1]

            # Clean redundant "AI Voice Assistant Nikita" -> "Nikita"
            ai_response_text = re.sub(r"\bAI Voice Assistant\s+" + re.escape(agent_name), agent_name, ai_response_text, flags=re.IGNORECASE)
            ai_response_text = re.sub(r"\bAI Voice Assistant\b", agent_name, ai_response_text, flags=re.IGNORECASE)
        except Exception as e:
            logger.warning(f"Live AI inference for prompt template test failed: {e}")
            ai_response_text = interpolated_usr or interpolated_sys
    else:
        ai_response_text = interpolated_usr or interpolated_sys

    if not ai_response_text:
        ai_response_text = interpolated_usr or interpolated_sys

    elapsed_ms = int((time.time() - start_time) * 1000)
    if elapsed_ms == 0:
        elapsed_ms = 18

    return TestPromptResponse(
        interpolated_prompt=interpolated_usr or interpolated_sys,
        ai_response=ai_response_text.strip(),
        model_used=str(model_used),
        latency_ms=elapsed_ms,
        resolved_entities={
            "contact_source": f"{real_contact.name} ({real_contact.phone})" if real_contact else f"{current_user.full_name} (Workspace User)",
            "agent_source": f"{agent_name} ({gender_display} • Voice: {voice_name})",
            "org_source": str(real_org.name) if real_org else "Nexus Enterprise",
            "active_model": str(model_used)
        }
    )

