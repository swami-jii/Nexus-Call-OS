"""
Telephony AI Voice Synthesizer.
Dynamically resolves active LLM from Tab 1 SSOT (Gemini, OpenAI, Anthropic, Groq, DeepSeek, OpenRouter)
and synthesizes structured, conversational voice answers matching caller dialect across 104+ languages.
Powered by GroundingSkill for universal cross-domain intelligence.
"""

import logging
import re
from typing import Any, Optional
from sqlalchemy.orm import Session

from backend.rag.core.ssot_resolver import SSOTResolver
from backend.rag.skills.grounding_skill import GroundingSkill
from backend.rag.synthesis_engine.dynamic_llm import DynamicLLMInvoker
from backend.rag.document_engine.hierarchy_chunker import sanitize_text
from backend.rag.nlp_engine.multilingual_tokenizer import MultilingualTokenizer

logger = logging.getLogger(__name__)


class VoiceSynthesizerEngine:
    """Stage 5: Telephony AI Voice Grounded Answer Synthesizer."""

    @classmethod
    def synthesize_answer(
        cls,
        query: str,
        context_chunks: list[dict[str, Any]],
        filename: str,
        max_words: Optional[int] = None,
        selected_provider: Optional[str] = None,
        selected_model: Optional[str] = None,
        db: Optional[Session] = None,
        org_id: Optional[str] = None,
        user_id: Optional[str] = None,
        session_memory_context: Optional[str] = None
    ) -> dict[str, Any]:
        if not context_chunks:
            # Dynamically ask LLM to state lack of information in the caller's exact language/dialect
            llm_config = SSOTResolver.resolve_llm_or_vision_config(
                selected_provider=selected_provider,
                selected_model=selected_model,
                db=db,
                org_id=org_id,
                user_id=user_id
            )
            if llm_config:
                sys_p = "You are a polite telephony voice assistant. In the exact language, dialect, and tone used by the caller, state politely in 1 concise sentence that the provided document does not contain information about their question."
                usr_p = f"Caller Question: {query}\nDocument Name: {filename}"
                try:
                    llm_ans = DynamicLLMInvoker.invoke(sys_p, usr_p, llm_config)
                    if llm_ans and len(llm_ans.strip()) > 5:
                        return {
                            "answer": llm_ans.strip(),
                            "provider_used": f"{llm_config.get('provider')}:{llm_config.get('model')}",
                            "is_grounded": True
                        }
                except Exception as e:
                    logger.debug(f"Dynamic zero-match response notice: {e}")

            return {
                "answer": f"The provided document ({filename}) does not contain information regarding '{query}'.",
                "provider_used": "SYSTEM GUARDRAIL (Zero False Matches)",
                "is_grounded": True
            }

        context_blocks = []
        for idx, c in enumerate(context_chunks):
            p_num = c.get("page_number", 1)
            title = c.get("title", f"Section #{idx + 1}")
            c_text = sanitize_text(c.get("fullChunk") or c.get("text", "") or c.get("snippet", ""))
            context_blocks.append(f"--- Context Source {idx + 1} (Page {p_num}: {title}) ---\n{c_text}")

        combined_context = "\n\n".join(context_blocks)

        system_prompt = GroundingSkill.build_system_prompt(
            modality="document",
            context_text=combined_context,
            memory_context=session_memory_context
        )
        user_prompt = GroundingSkill.format_user_prompt(
            query=query,
            combined_context=combined_context,
            filename=filename,
            modality="document",
            max_words=max_words
        )


        llm_config = SSOTResolver.resolve_llm_or_vision_config(
            selected_provider=selected_provider,
            selected_model=selected_model,
            db=db,
            org_id=org_id,
            user_id=user_id
        )

        if llm_config:
            call_res = DynamicLLMInvoker.call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                config=llm_config
            )
            eff_prov = str(llm_config.get("provider", "llm")).upper()
            eff_model = str(llm_config.get("model", "default"))

            if isinstance(call_res, dict) and call_res.get("text") and not call_res.get("error"):
                return {
                    "answer": call_res["text"].strip(),
                    "provider_used": f"{eff_prov} ({eff_model})",
                    "is_grounded": True
                }
            elif isinstance(call_res, str) and call_res and not call_res.startswith("{\"error\""):
                return {
                    "answer": call_res.strip(),
                    "provider_used": f"{eff_prov} ({eff_model})",
                    "is_grounded": True
                }

        # Multi-Provider Failover: If primary LLM failed/rate-limited, try other active providers in DB
        available_cfgs = SSOTResolver.get_all_available_llm_configs(db=db, org_id=org_id)
        for fb_cfg in available_cfgs:
            if llm_config and fb_cfg.get("provider") == llm_config.get("provider"):
                continue
            call_res = DynamicLLMInvoker.call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                config=fb_cfg
            )
            eff_prov = str(fb_cfg.get("provider", "llm")).upper()
            eff_model = str(fb_cfg.get("model", "default"))
            if isinstance(call_res, str) and call_res and not call_res.startswith("{\"error\""):
                return {
                    "answer": call_res.strip(),
                    "provider_used": f"{eff_prov} ({eff_model})",
                    "is_grounded": True
                }
            elif isinstance(call_res, dict) and call_res.get("text") and not call_res.get("error"):
                return {
                    "answer": call_res["text"].strip(),
                    "provider_used": f"{eff_prov} ({eff_model})",
                    "is_grounded": True
                }

        # High-precision Extractive synthesis (crisp, zero filler)
        extractive_ans = cls._extractive_synthesize(query, context_chunks, filename, max_words=max_words)
        return {
            "answer": extractive_ans,
            "provider_used": "EXTRACTIVE SYNTHESIZER",
            "is_grounded": True
        }

    @classmethod
    def _extractive_synthesize(
        cls,
        query: str,
        context_chunks: list[dict[str, Any]],
        filename: str,
        max_words: Optional[int] = None
    ) -> str:
        """Pure algorithmic extractive synthesizer with zero hardcoded vocabulary lists."""
        if not context_chunks:
            return f"Information for this query is not available in {filename}."

        q_tokens = set(MultilingualTokenizer.tokenize(query))
        all_raw_text = []
        for c in context_chunks:
            t = c.get("fullChunk") or c.get("text") or c.get("snippet", "")
            if t:
                all_raw_text.append(sanitize_text(t))

        full_text = "\n".join(all_raw_text)
        if not full_text.strip():
            return f"Information for this query is not available in {filename}."

        raw_lines = [l.strip() for l in full_text.split("\n") if l.strip() and not l.startswith("---") and not l.startswith("## Page")]
        scored_lines: list[tuple[float, str]] = []
        seen: set[str] = set()

        for line in raw_lines:
            clean_l = re.sub(r"^[-*•\d\.\)]+\s*", "", line).strip()
            if len(clean_l) < 5:
                continue

            l_tokens = set(MultilingualTokenizer.tokenize(clean_l))
            overlap = len(q_tokens.intersection(l_tokens))
            
            # Structural bonus for key-value lines with colons or formatted items
            has_structure = ":" in clean_l and 2 < clean_l.find(":") < 40
            score = (overlap * 1.0) + (0.5 if has_structure else 0.0)

            norm_key = clean_l.lower()
            if score > 0 and norm_key not in seen:
                seen.add(norm_key)
                scored_lines.append((score, clean_l))

        target_w = max_words if (max_words and max_words > 0) else 20
        if scored_lines:
            scored_lines.sort(key=lambda x: x[0], reverse=True)
            accumulated: list[str] = []
            curr_words = 0
            for _, item in scored_lines:
                w_count = len(item.split())
                if not accumulated or (curr_words + w_count <= target_w + 10):
                    accumulated.append(f"• {item}")
                    curr_words += w_count
                    if curr_words >= target_w:
                        break
                else:
                    break
            return "\n".join(accumulated) if accumulated else f"• {scored_lines[0][1]}"

        return f"Information for this query is not available in {filename}."

