"""
Dynamic LLM Invoker.
Resolves models and API credentials dynamically from Tab 1 SSOT and provides sync/async calling interfaces.
"""

import asyncio
import logging
from typing import Any, Optional
from sqlalchemy.orm import Session

from backend.rag.core.ssot_resolver import SSOTResolver

logger = logging.getLogger(__name__)


class DynamicLLMInvoker:
    """Invoker for dynamically resolving and calling LLMs from Tab 1 SSOT."""

    @classmethod
    def resolve_selected_llm_config(
        cls,
        selected_provider: Optional[str] = None,
        selected_model: Optional[str] = None,
        db: Optional[Session] = None,
        org_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Optional[dict[str, Any]]:
        return SSOTResolver.resolve_llm_or_vision_config(
            selected_provider=selected_provider,
            selected_model=selected_model,
            db=db,
            org_id=org_id,
            user_id=user_id
        )

    @classmethod
    def call_llm(cls, system_prompt: str, user_prompt: str, config: dict[str, Any]) -> Any:
        provider = config.get("provider", "").lower()
        api_key = config.get("api_key", "")
        model = config.get("model", "")
        base_url = config.get("base_url")

        if not api_key:
            return None

        # 1. Google Gemini
        if "gemini" in provider or "google" in provider:
            try:
                from google import genai
                from google.genai import types
                client = genai.Client(api_key=api_key)
                models_to_try = [model] if (model and model.lower() not in ["dynamic", "default", "none"]) else []
                for gm in ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash-8b"]:
                    if gm not in models_to_try:
                        models_to_try.append(gm)

                last_err = None
                for m in models_to_try:
                    if not m:
                        continue
                    try:
                        gen_kwargs = {
                            "system_instruction": system_prompt,
                            "temperature": 0.2,
                            "max_output_tokens": 2048,
                        }
                        if "json" in system_prompt.lower():
                            gen_kwargs["response_mime_type"] = "application/json"
                        response = client.models.generate_content(
                            model=m,
                            contents=user_prompt,
                            config=types.GenerateContentConfig(**gen_kwargs)
                        )
                        if response and response.text:
                            return response.text
                    except Exception as me:
                        last_err = me
                        err_str = str(me).lower()
                        if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
                            logger.info(f"Gemini quota exhausted ({m}), failing over to alternate SSOT provider immediately...")
                            break
                        continue
                if last_err:
                    raise last_err
            except Exception as e:
                logger.warning(f"Gemini calling error: {e}")
                return {"error": str(e)}


        # 2. OpenAI / Groq / DeepSeek / OpenRouter / NVIDIA via OpenAI client
        elif any(p in provider for p in ["openai", "groq", "deepseek", "openrouter", "nvidia"]):
            try:
                import openai
                client_kwargs: dict[str, Any] = {"api_key": api_key}
                if base_url:
                    client_kwargs["base_url"] = base_url
                elif "nvidia" in provider:
                    client_kwargs["base_url"] = "https://integrate.api.nvidia.com/v1"
                elif "groq" in provider:
                    client_kwargs["base_url"] = "https://api.groq.com/openai/v1"
                elif "deepseek" in provider:
                    client_kwargs["base_url"] = "https://api.deepseek.com/v1"
                elif "openrouter" in provider:
                    client_kwargs["base_url"] = "https://openrouter.ai/api/v1"

                client = openai.OpenAI(**client_kwargs)

                models_to_try = [model] if (model and model.lower() not in ["dynamic", "default", "none"]) else []
                if "nvidia" in provider:
                    for fallback_m in ["meta/llama-3.2-11b-vision-instruct", "meta/llama-3.2-90b-vision-instruct", "mistralai/mistral-large-2-instruct", "deepseek-ai/deepseek-v4-flash-0731"]:
                        if fallback_m not in models_to_try:
                            models_to_try.append(fallback_m)
                elif "groq" in provider:
                    for fallback_m in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]:
                        if fallback_m not in models_to_try:
                            models_to_try.append(fallback_m)
                elif "openrouter" in provider:
                    for fallback_m in ["meta-llama/llama-3.3-70b-instruct", "google/gemini-2.0-flash-exp:free", "deepseek/deepseek-chat"]:
                        if fallback_m not in models_to_try:
                            models_to_try.append(fallback_m)
                elif "openai" in provider:
                    for fallback_m in ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]:
                        if fallback_m not in models_to_try:
                            models_to_try.append(fallback_m)
                elif not models_to_try:
                    models_to_try = ["gpt-4o-mini"]

                last_err = None
                for m in models_to_try:
                    try:
                        response = client.chat.completions.create(
                            model=m,
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ],
                            temperature=0.2,
                            max_tokens=1500
                        )
                        if response.choices and response.choices[0].message and response.choices[0].message.content:
                            return response.choices[0].message.content
                    except Exception as me:
                        last_err = me
                        continue
                if last_err:
                    raise last_err
            except Exception as e:
                logger.warning(f"OpenAI/Groq/NVIDIA calling error: {e}")
                return {"error": str(e)}


        # 3. Anthropic Claude
        elif "anthropic" in provider or "claude" in provider:
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=api_key)
                response = client.messages.create(
                    model=model or "claude-3-5-sonnet-20241022",
                    max_tokens=1000,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_prompt}],
                    temperature=0.2
                )
                if response.content and len(response.content) > 0:
                    return response.content[0].text
            except Exception as e:
                logger.warning(f"Anthropic calling error: {e}")
                return {"error": str(e)}

    @classmethod
    def call_conversation_llm(
        cls,
        system_prompt: str,
        conversation_history: list[dict[str, Any]],
        config: dict[str, Any],
        temperature: float = 0.35,
        max_tokens: int = 600,
    ) -> Any:
        provider = config.get("provider", "").lower()
        api_key = config.get("api_key", "")
        model = config.get("model", "")
        base_url = config.get("base_url")

        if not api_key and provider != "ollama":
            return None

        # Format conversation history
        dialogue_turns = []
        for t in conversation_history:
            role = str(t.get("role") or t.get("speaker") or "user").strip().lower()
            text = str(t.get("text") or t.get("content") or "").strip()
            if text:
                dialogue_turns.append({"role": "user" if role in ["user", "caller", "human"] else "assistant", "content": text})

        if not dialogue_turns:
            return None

        formatted_dialogue = ""
        for dt in dialogue_turns:
            speaker_label = "Caller" if dt["role"] == "user" else "Assistant"
            formatted_dialogue += f"{speaker_label}: {dt['content']}\n"
        formatted_dialogue += "Assistant: "

        # 1. Google Gemini
        if "gemini" in provider or "google" in provider:
            try:
                from google import genai
                from google.genai import types
                client = genai.Client(api_key=api_key)
                models_to_try = [model] if (model and model.lower() not in ["dynamic", "default", "none"]) else []
                for gm in ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash-8b"]:
                    if gm not in models_to_try:
                        models_to_try.append(gm)

                last_err = None
                for m in models_to_try:
                    if not m:
                        continue
                    try:
                        gen_kwargs = {
                            "system_instruction": system_prompt,
                            "temperature": temperature,
                            "max_output_tokens": max_tokens,
                        }
                        response = client.models.generate_content(
                            model=m,
                            contents=formatted_dialogue,
                            config=types.GenerateContentConfig(**gen_kwargs)
                        )
                        if response and response.text:
                            return response.text
                    except Exception as me:
                        last_err = me
                        err_str = str(me).lower()
                        if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
                            logger.info(f"Gemini quota exhausted ({m}), failing over to alternate SSOT provider...")
                            break
                        continue
                if last_err:
                    raise last_err
            except Exception as e:
                logger.warning(f"Gemini calling error: {e}")
                return {"error": str(e)}

        # 2. OpenAI / Groq / DeepSeek / OpenRouter / NVIDIA / Ollama via OpenAI client
        elif any(p in provider for p in ["openai", "groq", "deepseek", "openrouter", "nvidia", "ollama"]):
            try:
                import openai
                client_kwargs: dict[str, Any] = {"api_key": api_key or "ollama"}
                if base_url:
                    client_kwargs["base_url"] = base_url
                elif "nvidia" in provider:
                    client_kwargs["base_url"] = "https://integrate.api.nvidia.com/v1"
                elif "groq" in provider:
                    client_kwargs["base_url"] = "https://api.groq.com/openai/v1"
                elif "deepseek" in provider:
                    client_kwargs["base_url"] = "https://api.deepseek.com/v1"
                elif "openrouter" in provider:
                    client_kwargs["base_url"] = "https://openrouter.ai/api/v1"
                elif "ollama" in provider:
                    client_kwargs["base_url"] = "http://localhost:11434/v1"

                client = openai.OpenAI(**client_kwargs)

                models_to_try = [model] if (model and model.lower() not in ["dynamic", "default", "none"]) else []
                if "nvidia" in provider:
                    for fallback_m in ["meta/llama-3.2-11b-vision-instruct", "meta/llama-3.2-90b-vision-instruct", "mistralai/mistral-large-2-instruct", "deepseek-ai/deepseek-v4-flash-0731"]:
                        if fallback_m not in models_to_try:
                            models_to_try.append(fallback_m)
                elif "groq" in provider:
                    for fallback_m in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]:
                        if fallback_m not in models_to_try:
                            models_to_try.append(fallback_m)
                elif "openrouter" in provider:
                    for fallback_m in ["meta-llama/llama-3.3-70b-instruct", "google/gemini-2.0-flash-exp:free", "deepseek/deepseek-chat"]:
                        if fallback_m not in models_to_try:
                            models_to_try.append(fallback_m)
                elif "openai" in provider:
                    for fallback_m in ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]:
                        if fallback_m not in models_to_try:
                            models_to_try.append(fallback_m)
                elif not models_to_try:
                    models_to_try = ["gpt-4o-mini"]

                messages = [{"role": "system", "content": system_prompt}] + dialogue_turns

                last_err = None
                for m in models_to_try:
                    try:
                        response = client.chat.completions.create(
                            model=m,
                            messages=messages,
                            temperature=temperature,
                            max_tokens=max_tokens
                        )
                        if response.choices and response.choices[0].message and response.choices[0].message.content:
                            return response.choices[0].message.content
                    except Exception as me:
                        last_err = me
                        continue
                if last_err:
                    raise last_err
            except Exception as e:
                logger.warning(f"OpenAI/Groq/NVIDIA calling error: {e}")
                return {"error": str(e)}

        # 3. Anthropic Claude
        elif "anthropic" in provider or "claude" in provider:
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=api_key)
                response = client.messages.create(
                    model=model or "claude-3-5-sonnet-20241022",
                    max_tokens=max_tokens,
                    system=system_prompt,
                    messages=dialogue_turns,
                    temperature=temperature
                )
                if response.content and len(response.content) > 0:
                    return response.content[0].text
            except Exception as e:
                logger.warning(f"Anthropic calling error: {e}")
                return {"error": str(e)}

        return None

    @classmethod
    async def call_conversation_llm_async(
        cls,
        system_prompt: str = "",
        conversation_history: Optional[list[dict[str, Any]]] = None,
        messages: Optional[list[dict[str, Any]]] = None,
        config: Optional[dict[str, Any]] = None,
        temperature: float = 0.35,
        max_tokens: int = 600,
        db: Optional[Session] = None,
        user_input: Optional[str] = None,
        preferred_language: Optional[str] = None,
        **kwargs: Any
    ) -> dict[str, Any]:
        """Asynchronous multi-turn conversation calling for real-time telephony agents."""
        loop = asyncio.get_event_loop()

        # Consolidate history
        history: list[dict[str, Any]] = []
        raw_list = conversation_history if conversation_history is not None else (messages or [])
        for item in raw_list:
            r = item.get("role") or item.get("speaker") or "user"
            t = item.get("text") or item.get("content") or ""
            if t:
                history.append({"role": r, "text": t})

        if user_input and (not history or history[-1].get("text") != user_input):
            history.append({"role": "user", "text": user_input})

        # Resolve config if missing
        cfg = config
        if not cfg and db:
            cfg = cls.resolve_selected_llm_config(db=db)

        if not cfg or not cfg.get("api_key"):
            return {"text": "", "error": "No active LLM API credentials configured"}

        res = await loop.run_in_executor(
            None,
            cls.call_conversation_llm,
            system_prompt,
            history,
            cfg,
            temperature,
            max_tokens
        )
        if isinstance(res, str):
            return {"text": res, "error": None}
        elif isinstance(res, dict) and res.get("text"):
            return res
        elif isinstance(res, dict) and res.get("error"):
            return {"text": "", "error": res["error"]}
        return {"text": "", "error": "No response from LLM"}
