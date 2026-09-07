import re
import time
from typing import Any

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.engine.agent_engine import AgentToolExecutor, EnterpriseAgentEngine
from backend.models.models import Agent as AgentModel, ProviderCredential, User
from backend.routers.knowledge_base import DynamicLLMInvoker
from backend.routers.providers import resolve_provider_credential
from backend.services.live_knowledge_service import LiveKnowledgeService
from backend.services.session_memory_service import SessionMemoryManager
from backend.services.telephony_engine import TelephonyCallingEngine
from backend.skills.skill_registry import SkillRegistry

router = APIRouter(prefix="/api/agent-engine", tags=["Enterprise AI Agent Engine"])

# Active in-memory session engine store
_engine_cache: dict[str, EnterpriseAgentEngine] = {}


def get_or_create_engine(agent_id: str, system_prompt: str = "") -> EnterpriseAgentEngine:
    if agent_id not in _engine_cache:
        _engine_cache[agent_id] = EnterpriseAgentEngine(
            agent_id=agent_id,
            system_prompt=system_prompt or "You are a professional AI Voice assistant.",
        )
    return _engine_cache[agent_id]


class InteractRequest(BaseModel):
    agent_id: str
    user_input: str | None = None
    user_message: str | None = None
    active_skill: str | None = None
    selected_skill: str | None = None
    tool_call: str | None = None
    tool_args: dict[str, Any] | None = None


class ToolExecuteRequest(BaseModel):
    tool_name: str
    arguments: dict[str, Any] = {}


class PromptTestRequest(BaseModel):
    system_prompt: str | None = None
    template: str | None = None
    user_input: str | None = ""
    variables: dict[str, Any] = {}


@router.post("/interact")
async def process_agent_turn(
    req: InteractRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_time = time.time()
    input_text = (req.user_message or req.user_input or "").strip()
    skill = req.selected_skill or req.active_skill
    if skill in ["none", "default", "dynamic"]:
        skill = None

    # Look up agent from DB for dynamic name, system_prompt, llm_model
    agent_row = None
    if req.agent_id:
        agent_row = db.query(AgentModel).filter(AgentModel.id == req.agent_id).first()
        if not agent_row:
            agent_row = db.query(AgentModel).filter(AgentModel.name == req.agent_id).first()

    agent_name = str(agent_row.name) if agent_row and agent_row.name else "Nikita"
    agent_lang = str(agent_row.language) if agent_row and agent_row.language else "Auto-Detect"
    agent_system_prompt = (
        str(agent_row.system_prompt)
        if agent_row and agent_row.system_prompt
        else "You are an empathetic, professional AI voice assistant."
    )

    org_id_val = str(current_user.organization_id) if current_user.organization_id else ""
    user_id_val = str(current_user.id) if current_user.id else ""

    agent_llm_model = str(getattr(agent_row, "llm_model", None) or "").strip() if agent_row else None
    agent_llm_provider = str(getattr(agent_row, "llm_provider", None) or "").strip() if agent_row else None

    # Dynamically resolve active LLM credentials and config directly from API & Integrations SSOT
    llm_cfg = DynamicLLMInvoker.resolve_selected_llm_config(
        selected_provider=agent_llm_provider if agent_llm_provider else None,
        selected_model=agent_llm_model if agent_llm_model else None,
        db=db,
        org_id=org_id_val,
        user_id=user_id_val,
    )
    if not llm_cfg:
        llm_cfg = DynamicLLMInvoker.resolve_selected_llm_config(db=db, org_id=org_id_val, user_id=user_id_val)

    provider = (llm_cfg.get("provider") or "dynamic").lower() if llm_cfg else "dynamic"
    effective_model = str(llm_cfg.get("model") or agent_llm_model or "").strip() if llm_cfg else (agent_llm_model or "")

    # Build specialized skill directive if a skill preset flow is selected
    skill_directive = ""
    if skill:
        sk_obj = SkillRegistry.get_skill(skill)
        if sk_obj:
            skill_directive = f"ACTIVE SPECIALIZED VOICE SKILL: {sk_obj.name}\nObjective: {sk_obj.description}\n{sk_obj.system_prompt_addon}\n{sk_obj.markdown_body}"

    custom_instructions = f"{agent_system_prompt}\n\n{skill_directive}".strip() if skill_directive else agent_system_prompt

    # Initialize active session memory engine
    session_engine_id = req.agent_id or "default_playground"
    engine = get_or_create_engine(session_engine_id, custom_instructions)
    engine.add_turn(speaker="user", text=input_text, tokens=len(input_text.split()))

    memory_mgr = SessionMemoryManager(session_id=session_engine_id, phone_number="")
    memory_mgr.extract_and_update(user_text=input_text, ai_text="")
    session_memory_prompt = memory_mgr.get_memory_prompt_block()

    full_system_prompt = TelephonyCallingEngine.build_telephony_system_prompt(
        agent_name=agent_name,
        business_type="Customer Support & Inbound Services",
        configured_language=agent_lang,
        custom_instructions=custom_instructions,
        session_memory_context=session_memory_prompt,
        active_model=effective_model,
    )

    # Real-Time Live Knowledge Grounding (1,722+ Public APIs Dataset & Live Resolvers)
    live_ground_truth = await LiveKnowledgeService.resolve_realtime_knowledge_query(input_text)
    if live_ground_truth:
        full_system_prompt += f"\n\nREAL-TIME GROUND TRUTH FOR CALLER'S LIVE QUESTION:\n{live_ground_truth}"

    # Build conversation history from engine turns
    conversation_history = [
        {"role": "user" if t.speaker == "user" else "assistant", "text": t.text}
        for t in engine.turns
    ]

    # Execute resilient multi-model LLM API call directly using DynamicLLMInvoker SSOT
    raw_ai_text = None
    if llm_cfg and (llm_cfg.get("api_key") or provider == "ollama"):
        try:
            call_res = await DynamicLLMInvoker.call_conversation_llm_async(
                system_prompt=full_system_prompt,
                conversation_history=conversation_history,
                config=llm_cfg,
            )
            raw_ai_text = call_res.get("text")
        except Exception as e:
            print(f"[AgentEngineRouter] Primary LLM call error: {e}")

    # If primary provider was unavailable/rate-limited, dynamically iterate all other connected LLM providers from database SSOT
    if not raw_ai_text:
        try:
            all_llm_creds = db.query(ProviderCredential).filter(
                ProviderCredential.category == "llm"
            ).all()
            for alt_cred in all_llm_creds:
                alt_pname = str(alt_cred.provider_name or "").lower().strip()
                if alt_pname == provider or alt_pname == "ollama":
                    continue
                alt_cfg = DynamicLLMInvoker.resolve_selected_llm_config(
                    selected_provider=alt_pname,
                    db=db,
                    org_id=org_id_val,
                    user_id=user_id_val,
                )
                if alt_cfg and alt_cfg.get("api_key"):
                    call_res = await DynamicLLMInvoker.call_conversation_llm_async(
                        system_prompt=full_system_prompt,
                        conversation_history=conversation_history,
                        config=alt_cfg,
                    )
                    if call_res.get("text"):
                        raw_ai_text = call_res["text"]
                        provider = alt_pname
                        effective_model = alt_cfg.get("model") or effective_model
                        break
        except Exception as fb_err:
            print(f"[AgentEngineRouter] Dynamic provider failover error: {fb_err}")

    # Extract clean speech and LLM-native autonomous hangup signal
    ai_text = None
    if raw_ai_text:
        ai_text, _ = TelephonyCallingEngine.extract_hangup_signal(raw_ai_text)

    # Intelligent natural fallback if offline or LLM provider unavailable
    if not ai_text or not ai_text.strip():
        if skill:
            ai_text = SkillRegistry.evaluate_skill(
                skill_name=skill,
                input_text=input_text,
                agent_name=agent_name,
                language=agent_lang,
            )
        if not ai_text or not ai_text.strip():
            if live_ground_truth:
                ai_text = f"Hello! {live_ground_truth}"
            else:
                ai_text = f"Hello! I am {agent_name}. I have noted: '{input_text}'. How may I assist you further?"

    # Clean any leaked formatting, symbols, or identifiers
    if ai_text:
        ai_text = re.sub(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', '', ai_text)
        ai_text = re.sub(r'[*#_`]', '', ai_text)
        ai_text = " ".join(ai_text.split()).strip()

    # Update session memory
    memory_mgr.extract_and_update(user_text="", ai_text=ai_text)

    # Record AI turn in engine memory
    latency = round((time.time() - start_time) * 1000, 2)
    turn_tokens = max(1, len(ai_text.split()))
    engine.add_turn(
        speaker="assistant",
        text=ai_text,
        tokens=turn_tokens,
        latency_ms=latency,
        provider=provider.capitalize(),
    )

    total_tokens = engine.get_token_count()

    return {
        "status": "success",
        "agent_id": req.agent_id,
        "ai_response": ai_text,
        "latency_ms": latency,
        "tokens_used": total_tokens,
        "estimated_cost": round(total_tokens * 0.000003, 6),
        "selected_provider": f"{provider.capitalize()} ({effective_model})" if effective_model else provider.capitalize(),
    }


@router.post("/tools/execute")
def execute_agent_tool(
    req: ToolExecuteRequest,
    current_user: User = Depends(get_current_user),
):
    res = AgentToolExecutor.execute_tool(req.tool_name, req.arguments)
    return {"status": "success", "tool_name": req.tool_name, "output": res}


@router.post("/prompts/test")
def test_prompt_template(
    req: PromptTestRequest,
    current_user: User = Depends(get_current_user),
):
    template_text = req.template or req.system_prompt or ""
    compiled_prompt = template_text
    for k, v in req.variables.items():
        compiled_prompt = compiled_prompt.replace(f"{{{{{k}}}}}", str(v))

    name_val = req.variables.get("name", "Valued Customer")
    preview_response = (
        f"[Prompt Test Simulation] Applied variables. Output: 'Hello {name_val}, "
        "how can I assist your organization today?'"
    )
    user_inp = req.user_input or ""
    return {
        "status": "success",
        "compiled_prompt": compiled_prompt,
        "preview_response": preview_response,
        "token_estimate": len(compiled_prompt.split()) + len(user_inp.split()),
    }


@router.get("/memory")
@router.get("/memory/{agent_id}")
def get_agent_memory(
    agent_id: str | None = None,
    current_user: User = Depends(get_current_user),
):
    a_id = agent_id or "default_agent"
    engine = get_or_create_engine(a_id)
    return {
        "agent_id": a_id,
        "short_term_memory": engine.short_term_memory,
        "long_term_memory": engine.long_term_memory,
        "turns_count": len(engine.turns),
        "total_tokens_consumed": engine.get_token_count(),
        "summary": engine.get_summary(),
    }

