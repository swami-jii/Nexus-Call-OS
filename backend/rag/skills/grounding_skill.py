"""
Create Call OS — Universal Telephony Grounding & Voice Synthesis Skill.
Pure, zero-hardcode, zero-example, language-agnostic cognitive grounding engine.
Operates dynamically across 104+ languages and any domain.
"""

from typing import Any, Optional
from backend.rag.skills.multimodal_skill import MultimodalSkill
from backend.rag.skills.domain_intelligence_skill import DomainIntelligenceSkill


class GroundingSkill:
    """Universal Telephony AI Voice & Live Grounding Reasoning Skill."""

    @classmethod
    def build_system_prompt(
        cls,
        modality: str = "document",
        domain: Optional[str] = None,
        context_text: Optional[str] = None,
        memory_context: Optional[str] = None
    ) -> str:
        """Constructs a pure, zero-example grounded reasoning system prompt."""
        base_prompt = (
            "You are the Create Call OS Knowledge Grounding & Real-Time Synthesis Engine.\n"
            "Your sole objective is to synthesize, refine, and present the exact facts extracted from the provided context chunks.\n\n"
            "CORE GROUNDING RULES:\n"
            "1. PURE CONTEXT GROUNDING (ZERO HALLUCINATION & ZERO ASSUMPTION):\n"
            "   - Derive your answer EXCLUSIVELY and DIRECTLY from the provided context chunks.\n"
            "   - NEVER invent, assume, extrapolate, or introduce facts, names, figures, policies, or items not explicitly stated in the context.\n"
            "   - If the context does not contain the answer to a question or part of a question, clearly and politely state that this information is not available in the provided document.\n\n"
            "2. COMPLETE & UNBIASED EXTRACTION:\n"
            "   - Extract and synthesize all relevant items, categories, tiers, attributes, timelines, and details found in the context chunks without arbitrary omission.\n"
            "   - Preserve all exact numerical figures, currencies, contact credentials, and names verbatim from the text.\n\n"
            "3. NATIVE DIALECT & CONVERSATIONAL MIRRORING:\n"
            "   - Seamlessly identify the user's language, dialect, and conversational phrasing.\n"
            "   - ALWAYS respond in the exact same language and dialect as the user's inquiry.\n"
            "   - Format the response with clean, readable structure, bold titles, and bullet points."
        )

        # Modality guidance
        guidance = MultimodalSkill.get_modality_guidance(modality)
        if guidance:
            base_prompt += f"\n\nSOURCE MODALITY CONTEXT ({guidance['modality_type']}):\n- {guidance['guidance']}"

        # Domain guidance (if detected or provided)
        if not domain and context_text:
            domain_info = DomainIntelligenceSkill.detect_domain_context(context_text)
            if domain_info.get("domain") and domain_info["domain"] != "Universal Enterprise Knowledge":
                domain = domain_info["domain"]

        if domain:
            base_prompt += f"\n\nDOMAIN ADAPTATION:\n- Active Domain: {domain}. Use domain-accurate terminology."

        if memory_context and memory_context.strip():
            base_prompt += f"\n\n{memory_context.strip()}"

        return base_prompt

    @staticmethod
    def format_user_prompt(
        query: str,
        combined_context: str,
        filename: str = "Source Asset",
        modality: str = "document",
        max_words: Optional[int] = None
    ) -> str:
        """Formats the contextual user prompt for the synthesis model with zero hardcoded examples."""
        target_w = max_words if (max_words and max_words > 0) else 90

        if target_w <= 30:
            depth_guideline = f"3. Concise Voice Answer (~{target_w} words): State the direct answer, primary names, counts, and key numbers immediately in 1-3 crisp lines."
        elif target_w <= 60:
            depth_guideline = f"3. Compact Overview (~{target_w} words): Summarize the essential options, names, prices, and attributes clearly with bullet points."
        elif target_w <= 120:
            depth_guideline = f"3. Standard Balanced Answer (~{target_w} words): Break down all relevant options, tiers, figures, and features using clean structured bullet points."
        elif target_w <= 200:
            depth_guideline = f"3. Detailed Technical Answer (~{target_w} words): Provide a thorough explanation detailing every tier, specification, timeline, and terms."
        else:
            depth_guideline = f"3. Exhaustive Full Depth (~{target_w} words): Provide a complete, in-depth breakdown covering all nuances, categories, and source details."

        return (
            f"Asset Name: {filename}\n"
            f"Modality: {modality.upper()}\n\n"
            f"Retrieved Document Context Chunks:\n"
            f"{combined_context}\n\n"
            f"User Question:\n"
            f"{query}\n\n"
            f"Instructions:\n"
            f"1. Understand the user's question and native language/dialect.\n"
            f"2. Answer strictly and accurately using ONLY the retrieved context chunks above (zero outside assumptions).\n"
            f"{depth_guideline}\n"
            f"4. Respond naturally in the user's exact language and conversational phrasing.\n\n"
            f"Answer:"
        )

