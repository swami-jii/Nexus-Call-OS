import time
from typing import Any

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.engine.agent_engine import AgentToolExecutor, EnterpriseAgentEngine
from backend.models.models import Agent as AgentModel, User
from backend.routers.knowledge_base import DynamicLLMInvoker
from backend.routers.providers import resolve_provider_credential

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


def _detect_llm_provider(llm_model: str) -> str:
    """Detect which provider to use based on the model name."""
    m = llm_model.lower()
    if "gemini" in m or "google" in m:
        return "google"
    if "gpt" in m or "o1" in m or "o3" in m or "openai" in m:
        return "openai"
    if "claude" in m or "anthropic" in m:
        return "anthropic"
    if "llama" in m or "groq" in m or "mixtral" in m:
        return "groq"
    if "deepseek" in m:
        return "deepseek"
    return "google"


async def _call_real_llm(
    provider: str,
    api_key: str,
    model_id: str,
    system_prompt: str,
    conversation_history: list[dict[str, str]],
) -> str | None:
    """Make a real LLM API call and return the AI response text."""
    if not api_key:
        return None

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            if provider == "google":
                # Gemini API
                contents = []
                # Add system instruction as first user turn context
                for msg in conversation_history:
                    role = "user" if msg["role"] == "user" else "model"
                    contents.append({"role": role, "parts": [{"text": msg["text"]}]})

                res = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={api_key}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "systemInstruction": {"parts": [{"text": system_prompt}]},
                        "contents": contents,
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")

            elif provider == "openai":
                messages = [{"role": "system", "content": system_prompt}]
                for msg in conversation_history:
                    role = "user" if msg["role"] == "user" else "assistant"
                    messages.append({"role": role, "content": msg["text"]})

                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={"model": model_id, "messages": messages, "max_tokens": 300},
                )
                if res.status_code == 200:
                    choices = res.json().get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "")

            elif provider == "anthropic":
                messages = []
                for msg in conversation_history:
                    role = "user" if msg["role"] == "user" else "assistant"
                    messages.append({"role": role, "content": msg["text"]})

                res = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "Content-Type": "application/json",
                    },
                    json={"model": model_id, "system": system_prompt, "messages": messages, "max_tokens": 300},
                )
                if res.status_code == 200:
                    content = res.json().get("content", [])
                    if content:
                        return content[0].get("text", "")

            elif provider == "groq":
                messages = [{"role": "system", "content": system_prompt}]
                for msg in conversation_history:
                    role = "user" if msg["role"] == "user" else "assistant"
                    messages.append({"role": role, "content": msg["text"]})

                res = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={"model": model_id, "messages": messages, "max_tokens": 300},
                )
                if res.status_code == 200:
                    choices = res.json().get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "")

            elif provider == "deepseek":
                messages = [{"role": "system", "content": system_prompt}]
                for msg in conversation_history:
                    role = "user" if msg["role"] == "user" else "assistant"
                    messages.append({"role": role, "content": msg["text"]})

                res = await client.post(
                    "https://api.deepseek.com/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={"model": model_id, "messages": messages, "max_tokens": 300},
                )
                if res.status_code == 200:
                    choices = res.json().get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "")

        except Exception as e:
            print(f"LLM API call error ({provider}/{model_id}): {e}")

    return None


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
    input_text = req.user_message or req.user_input or ""
    skill = req.selected_skill or req.active_skill
    if skill == "none":
        skill = None

    # Look up agent from DB for dynamic name, system_prompt, llm_model
    agent_row = db.query(AgentModel).filter(AgentModel.id == req.agent_id).first()
    agent_name = str(agent_row.name) if agent_row and agent_row.name else "AI Assistant"
    agent_system_prompt = (str(agent_row.system_prompt) if agent_row and agent_row.system_prompt
                           else "You are an empathetic, professional AI voice assistant.")
    active_llm_cfg = DynamicLLMInvoker.resolve_selected_llm_config(db=db)
    agent_llm_model: str = (str(agent_row.llm_model) if agent_row and agent_row.llm_model
                            else (str(active_llm_cfg.get("model")) if active_llm_cfg and active_llm_cfg.get("model") else "Gemini 1.5 Pro"))

    # Build system prompt with agent identity
    full_system_prompt = (
        f"Your name is {agent_name}. {agent_system_prompt} "
        f"Always respond as {agent_name}. Keep responses concise and helpful."
    )

    engine = get_or_create_engine(req.agent_id, full_system_prompt)
    engine.add_turn(speaker="user", text=input_text, tokens=len(input_text.split()))

    # Determine LLM provider from model name and resolve API key
    provider = _detect_llm_provider(agent_llm_model)
    api_key = resolve_provider_credential(
        db, str(current_user.organization_id), str(current_user.id), provider
    )

    # Build conversation history from engine turns
    conversation_history = [
        {"role": "user" if t.speaker == "user" else "assistant", "text": t.text}
        for t in engine.turns
    ]

    # Try real LLM API call
    ai_text = await _call_real_llm(
        provider=provider,
        api_key=api_key,
        model_id=agent_llm_model,
        system_prompt=full_system_prompt,
        conversation_history=conversation_history,
    )

    # Fallback to engine skill-based response if LLM call failed
    if not ai_text:
        result = engine.process_turn(
            user_input=input_text,
            active_skill=skill,
            tool_call=req.tool_call,
            tool_args=req.tool_args,
            agent_name=agent_name,
        )
        ai_text = result.get("ai_response", f"Hello, I'm {agent_name}. How can I help you?")
        # Remove the duplicate user turn that process_turn added
        if len(engine.turns) >= 2 and engine.turns[-2].speaker == "user":
            engine.turns.pop(-2)
    else:
        # Record AI turn in engine memory
        engine.add_turn(
            speaker="assistant",
            text=ai_text,
            tokens=len(ai_text.split()),
            latency_ms=round((time.time() - start_time) * 1000, 2),
            provider=provider.capitalize(),
        )

    latency = round((time.time() - start_time) * 1000, 2)
    total_tokens = engine.get_token_count()

    return {
        "status": "success",
        "agent_id": req.agent_id,
        "ai_response": ai_text,
        "latency_ms": latency,
        "tokens_used": total_tokens,
        "estimated_cost": round(total_tokens * 0.000003, 6),
        "selected_provider": f"{provider.capitalize()} ({agent_llm_model})",
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

