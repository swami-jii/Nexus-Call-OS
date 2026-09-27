import json
import logging
import re
from typing import Any, Dict, List, Optional
import httpx
from sqlalchemy.orm import Session

from backend.routers.prompt_templates_ai import resolve_active_ai_service

logger = logging.getLogger(__name__)


class WorkflowSkill:
    """
    Encapsulates a specialized Workflow Architectural Skill with prompt directives,
    graph topology templates, and execution constraints.
    """

    def __init__(
        self,
        skill_id: str,
        name: str,
        category: str,
        description: str,
        icon: str,
        system_prompt_directive: str,
        triggers: Optional[List[str]] = None,
        recommended_model: str = "gpt-4o",
    ):
        self.id = skill_id
        self.name = name
        self.category = category
        self.description = description
        self.icon = icon
        self.system_prompt_directive = system_prompt_directive
        self.triggers = triggers or []
        self.recommended_model = recommended_model

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "icon": self.icon,
            "system_prompt_directive": self.system_prompt_directive,
            "triggers": self.triggers,
            "recommended_model": self.recommended_model,
        }


class WorkflowSkillRegistry:
    """
    Central Registry for all Visual Canvas Workflow Skills.
    """

    _skills: Dict[str, WorkflowSkill] = {}

    @classmethod
    def register(cls, skill: WorkflowSkill) -> None:
        cls._skills[skill.id] = skill

    @classmethod
    def get_skill(cls, skill_id: str) -> Optional[WorkflowSkill]:
        cls._ensure_initialized()
        return cls._skills.get(skill_id)

    @classmethod
    def get_all_skills(cls) -> List[Dict[str, Any]]:
        cls._ensure_initialized()
        return [s.to_dict() for s in cls._skills.values()]

    @classmethod
    def build_augmented_prompt(cls, active_skill_ids: List[str], user_prompt: str) -> str:
        cls._ensure_initialized()
        directives = []
        for sid in active_skill_ids:
            skill = cls._skills.get(sid)
            if skill:
                directives.append(f"### SKILL [{skill.name.upper()}]:\n{skill.system_prompt_directive}")

        skills_block = "\n\n".join(directives) if directives else "Standard Enterprise Voice Routing Protocol"

        return (
            f"You are the Enterprise Voice Workflow Architect Engine.\n"
            f"Active Workflow Skills & Rules for this specific graph:\n\n"
            f"{skills_block}\n\n"
            f"User Requirement:\n{user_prompt}\n\n"
            f"Instructions:\n"
            f"1. Generate production-ready nodes with precise categories ('telephony', 'ai', 'logic', 'developer', 'integration', 'escalation').\n"
            f"2. Wire exact sourceHandle to targetHandle connections without loops.\n"
            f"3. Strictly enforce the active workflow skill rules above."
        )

    @classmethod
    def _ensure_initialized(cls) -> None:
        if cls._skills:
            return

        # 1. Autonomous Workflow Architect
        cls.register(
            WorkflowSkill(
                skill_id="wf_skill_autonomous_architect",
                name="Autonomous Workflow Architect",
                category="Architecture",
                description="Generates end-to-end zero-defect telephony topologies with smart fallback branches and balanced node coordinates.",
                icon="Layers",
                system_prompt_directive=(
                    "Enforce strict graph integrity: Every graph must have 1 'start_call' root node, "
                    "followed by a 'working_hours' check, speech greeting, multi-route intent classification, "
                    "business action integration, and graceful terminal hangup ('end_call' or 'human_escalate'). "
                    "Ensure all node coordinates flow left-to-right with 400px horizontal spacing."
                ),
                triggers=["architect", "workflow", "ivr", "flow", "graph", "build", "create"],
                recommended_model="gpt-4o",
            )
        )

        # 2. Sub-200ms Telephony & IVR Routing Specialist
        cls.register(
            WorkflowSkill(
                skill_id="wf_skill_telephony_routing",
                name="Sub-200ms Telephony & IVR Routing",
                category="Telephony",
                description="Optimizes voice prompts, neural TTS speech generation, and DTMF keypress menus for ultra-low latency.",
                icon="Phone",
                system_prompt_directive=(
                    "Keep all spoken prompts concise (< 20 words per turn) for voice streaming. "
                    "Configure neural TTS voices (ElevenLabs Turbo / Cartesia Sonic). "
                    "Include DTMF keypad option fallbacks ('dtmf_menu') for noisy audio environments."
                ),
                triggers=["telephony", "ivr", "voice", "speech", "tts", "stt", "latency", "phone", "did"],
                recommended_model="claude-3-5-sonnet",
            )
        )

        # 3. FinTech Loan EMI & Security Compliance
        cls.register(
            WorkflowSkill(
                skill_id="wf_skill_fintech_compliance",
                name="FinTech Loan EMI & Compliance",
                category="Finance",
                description="Executes custom JavaScript EMI calculation sandboxes, scores credit eligibility, and enforces PCI-DSS PII masking.",
                icon="ShieldCheck",
                system_prompt_directive=(
                    "Integrate 'code_runner' node with mathematical EMI calculation formula P*r*((1+r)^n)/(((1+r)^n)-1). "
                    "Ensure customer credit card & SSN data is redacted before CRM synchronization. "
                    "Route high-value loan requests (> $50,000) directly to 'human_escalate' supervisor bridge."
                ),
                triggers=["loan", "emi", "finance", "bank", "credit", "fintech", "payment", "interest"],
                recommended_model="gpt-4o",
            )
        )

        # 4. Healthcare Clinic Patient Triage & HIPAA
        cls.register(
            WorkflowSkill(
                skill_id="wf_skill_healthcare_triage",
                name="Healthcare Clinic Patient Triage",
                category="Healthcare",
                description="Patient symptom intake, doctor schedule RAG search, Google Calendar slot booking, and HIPAA compliance.",
                icon="Activity",
                system_prompt_directive=(
                    "Query clinic doctor roster vectors using 'rag_search'. "
                    "Lock 20-30 minute patient consultation appointments via 'google_calendar' node. "
                    "Send SMS booking token via 'send_sms'. If patient reports severe chest pain or emergency, "
                    "immediately bridge to emergency ER triage ('human_escalate')."
                ),
                triggers=["clinic", "doctor", "patient", "hospital", "healthcare", "appointment", "booking", "symptom"],
                recommended_model="claude-3-5-sonnet",
            )
        )

        # 5. Real Estate WhatsApp & Hot Lead Bridge
        cls.register(
            WorkflowSkill(
                skill_id="wf_skill_realestate_dispatch",
                name="Real Estate WhatsApp & Hot Lead Bridge",
                category="Real Estate",
                description="Qualifies property buyers, captures 2BHK/3BHK budget range, dispatches PDF brochures via WhatsApp, and bridges hot leads.",
                icon="Home",
                system_prompt_directive=(
                    "Capture caller BHK requirement and budget. "
                    "Instantly dispatch brochure PDF and pricing sheet using 'send_whatsapp' node. "
                    "If caller budget > $250k, trigger 'human_escalate' to sales manager phone number (+91 96508 55975)."
                ),
                triggers=["property", "real estate", "flat", "bhk", "villa", "brochure", "whatsapp", "builder"],
                recommended_model="llama-3.3-70b-versatile",
            )
        )

        # 6. E-Commerce Courier REST API & Sentiment Guardrail
        cls.register(
            WorkflowSkill(
                skill_id="wf_skill_ecommerce_support",
                name="E-Commerce Courier & Sentiment Guardrail",
                category="E-Commerce",
                description="Checks live package delivery via REST webhook, evaluates caller frustration sentiment, and auto-escalates disputes.",
                icon="ShoppingCart",
                system_prompt_directive=(
                    "Query live courier delivery status via 'webhook_request' REST API. "
                    "Feed caller speech into 'sentiment_analyzer' node. "
                    "If sentiment is 'positive' or 'neutral', deliver WhatsApp tracking link. "
                    "If sentiment is 'frustrated', immediately route to supervisor bridge ('human_escalate')."
                ),
                triggers=["ecommerce", "order", "tracking", "courier", "delivery", "refund", "return", "shipping"],
                recommended_model="gemini-1.5-pro",
            )
        )

        # 7. Developer Custom Code Sandbox & Webhooks
        cls.register(
            WorkflowSkill(
                skill_id="wf_skill_developer_sandbox",
                name="Developer Code Sandbox & Webhooks",
                category="Developer",
                description="Embeds sandboxed JavaScript/Python execution logic, dynamic JSON parameter transformations, and REST API dispatch.",
                icon="Code2",
                system_prompt_directive=(
                    "Construct custom 'code_runner' scripts returning clean JSON output objects. "
                    "Configure 'webhook_request' nodes with parameterized headers and JSON payload interpolation. "
                    "Add 'time_delay' retry loops for resilience against external API rate limits."
                ),
                triggers=["code", "javascript", "python", "webhook", "api", "json", "rest", "sandbox", "developer"],
                recommended_model="deepseek-chat",
            )
        )


class WorkflowGraphSynthesizer:
    """
    Intelligent Synthesizer that architects visual workflow topologies
    using real live LLM inference and active workspace credentials.
    """

    @classmethod
    async def generate_custom_workflow(
        cls,
        prompt: str,
        messages: Optional[List[Dict[str, str]]] = None,
        provider: str = "google",
        model: str = "",
        directives_enabled: bool = True,
        db: Optional[Session] = None,
        org_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes real conversational LLM inference using decrypted workspace API keys.
        Generates natural conversational replies and synthesizes live canvas topologies.
        """
        clean_prompt = (prompt or "").strip()
        selected_model_name = model or ("Gemini 2.5 Flash" if provider == "google" else "Claude 3.5 Sonnet" if provider == "anthropic" else "LLM Engine")

        # 1. Resolve real active LLM service from DB credentials
        ai_service = None
        if db is not None:
            try:
                ai_service = resolve_active_ai_service(
                    db=db,
                    org_id=org_id,
                    preferred_model=model,
                    preferred_provider=provider,
                )
            except Exception as e:
                logger.warning(f"Error resolving AI service for Workflow Architect: {e}")

        # 2. Build rich Enterprise Voice Workflow Architect System Prompt
        system_instruction = cls._build_architect_system_prompt(directives_enabled)

        # 3. Prepare conversation history messages
        history_msgs = []
        if messages and isinstance(messages, list):
            for m in messages[-8:]:
                r = m.get("role", "user")
                c = m.get("content", "")
                if c:
                    history_msgs.append({"role": "user" if r == "user" else "assistant", "content": c})

        # Ensure latest prompt is included if not in history
        if not history_msgs or history_msgs[-1]["content"] != clean_prompt:
            history_msgs.append({"role": "user", "content": clean_prompt})

        # 4. If AI service with valid key is available, call the real LLM
        if ai_service and ai_service.get("api_key"):
            try:
                resolved_prov = ai_service.get("provider", provider)
                resolved_model = ai_service.get("model", model) or model
                api_key = ai_service.get("api_key", "")
                base_url = ai_service.get("base_url")

                raw_llm_response = await cls._call_conversational_llm(
                    provider=resolved_prov,
                    model=resolved_model,
                    api_key=api_key,
                    base_url=base_url,
                    system_instruction=system_instruction,
                    messages=history_msgs,
                )

                if raw_llm_response and raw_llm_response.strip():
                    return cls._parse_architect_response(
                        raw_text=raw_llm_response,
                        model_name=resolved_model or selected_model_name,
                        provider_name=resolved_prov,
                    )
            except Exception as ex:
                logger.error(f"Live LLM call failed in Workflow Architect ({provider}/{model}): {ex}")
                # Fall back to smart local response below

        # 5. Smart Dynamic Local Fallback if no LLM key or network failed
        return cls._generate_smart_local_fallback(
            prompt=clean_prompt,
            provider=provider,
            model_name=selected_model_name,
            ai_service_available=bool(ai_service and ai_service.get("api_key")),
        )

    @classmethod
    def _build_architect_system_prompt(cls, directives_enabled: bool) -> str:
        base_prompt = (
            "You are the Enterprise Voice Workflow Architect for Create Call OS.\n"
            "You are a friendly, highly skilled, and conversational AI architect.\n"
            "Speak naturally, politely, and helpfully in the exact language the user talks in (Hindi, Hinglish, English, etc.).\n"
            "Never reply with rigid or robotic boilerplate.\n\n"
            "### Core Instructions:\n"
            "1. Conversational Queries & Discussions:\n"
            "   - If the user greets you ('hello', 'hi', 'kaise ho', 'namaste', 'kya haal hai'), asks general questions, or discusses telephony concepts, answer naturally and warmly in their language.\n"
            "   - Do NOT output a ```workflow_topology``` block when simply chatting or answering general questions.\n\n"
            "2. Designing & Architecting Workflows:\n"
            "   - When the user asks to create, build, generate, or modify a workflow (e.g. clinic appointment booking, real estate lead qualification, loan EMI, order tracking, restaurant POS, after-hours IVR), do two things:\n"
            "     a) Conversationally explain the flow steps in clear, user-friendly markdown.\n"
            "     b) Embed a complete, production-ready canvas topology enclosed strictly in a code block labeled ```workflow_topology:\n"
            "```workflow_topology\n"
            "{\n"
            '  "name": "Human-Readable Workflow Name",\n'
            '  "category": "Healthcare | Real Estate | Finance | E-Commerce | Hospitality | GSM Gateway | Custom",\n'
            '  "description": "Short 1-sentence description of the flow.",\n'
            '  "nodes": [\n'
            "    {\n"
            '      "id": "node_1",\n'
            '      "type": "start_call",\n'
            '      "label": "Inbound DID Trunk",\n'
            '      "x": 80,\n'
            '      "y": 160,\n'
            '      "category": "telephony",\n'
            '      "config": { "prompt": "Incoming caller on DID" }\n'
            "    },\n"
            "    ...\n"
            "  ],\n"
            '  "edges": [\n'
            "    {\n"
            '      "id": "e1",\n'
            '      "source": "node_1",\n'
            '      "target": "node_2",\n'
            '      "sourceHandle": "out",\n'
            '      "targetHandle": "in"\n'
            "    },\n"
            "    ...\n"
            "  ]\n"
            "}\n"
            "```\n\n"
            "### Studio Node Types & Capabilities:\n"
            "- telephony: 'start_call', 'play_speech', 'gather_speech', 'dtmf_menu', 'end_call'\n"
            "- ai: 'ai_intent_router', 'rag_search', 'sentiment_analyzer'\n"
            "- logic: 'working_hours' (handles: 'open', 'closed'), 'condition_branch', 'time_delay'\n"
            "- developer: 'code_runner', 'webhook_request'\n"
            "- integration: 'google_calendar', 'crm_sync', 'send_sms', 'send_whatsapp'\n"
            "- escalation: 'human_escalate'\n\n"
            "### Layout Rules:\n"
            "- Position nodes left-to-right (x increments of ~380-420px, e.g. 80, 480, 880, 1280, 1680, 2080...).\n"
            "- For branching nodes (e.g. working_hours open vs closed), place open branch at y:80 and closed at y:380.\n"
            "- Ensure all sourceHandle and targetHandle connections are strictly valid ('out' -> 'in', 'open'/'closed' -> 'in', 'positive'/'frustrated' -> 'in').\n"
            "- We support 1,722+ Public APIs and custom webhooks. Remind users that private keys can be configured in **API & Integrations**."
        )

        if directives_enabled:
            base_prompt += (
                "\n\n### Active Studio Directives (Enabled):\n"
                "- Enforce sub-200ms telephony latency guidelines.\n"
                "- Always provide graceful fallback branches for error/out-of-hours.\n"
                "- Ensure every path reaches a clean terminal node ('end_call' or 'human_escalate')."
            )

        return base_prompt

    @classmethod
    async def _call_conversational_llm(
        cls,
        provider: str,
        model: str,
        api_key: str,
        base_url: Optional[str],
        system_instruction: str,
        messages: List[Dict[str, str]],
    ) -> str:
        clean_prov = provider.lower().strip()
        timeout = httpx.Timeout(25.0, connect=6.0)

        # 1. Google Gemini (Google AI Studio)
        if clean_prov in ["google", "gemini", "google_ai_studio"]:
            clean_key = api_key.replace("Bearer ", "").strip()
            raw_m = (model or "gemini-2.5-flash").strip()
            target_model = raw_m.replace("models/", "").strip() or "gemini-2.5-flash"

            url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={clean_key}"

            contents = []
            for m in messages:
                role = "user" if m.get("role") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

            payload = {
                "contents": contents,
                "systemInstruction": {"parts": [{"text": system_instruction}]},
                "generationConfig": {
                    "temperature": 0.6,
                },
            }
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                resp.raise_for_status()
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    return "".join(p.get("text", "") for p in parts)
                raise ValueError("Empty response from Google Gemini")

        # 2. Anthropic Claude
        elif clean_prov in ["anthropic", "claude"]:
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            }
            raw_m = (model or "claude-3-5-sonnet-20241022").strip()
            if not raw_m.startswith("claude-") or any(x in raw_m.lower() for x in ["fixed", "model"]):
                if "haiku" in raw_m.lower():
                    target_model = "claude-3-5-haiku-20241022"
                elif "opus" in raw_m.lower():
                    target_model = "claude-3-opus-20240229"
                else:
                    target_model = "claude-3-5-sonnet-20241022"
            else:
                target_model = raw_m

            claude_msgs = []
            for m in messages:
                r = "user" if m.get("role") == "user" else "assistant"
                claude_msgs.append({"role": r, "content": m.get("content", "")})

            payload = {
                "model": target_model,
                "system": system_instruction,
                "messages": claude_msgs,
                "max_tokens": 4000,
                "temperature": 0.5,
            }
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                content = data.get("content", [])
                return "".join(c.get("text", "") for c in content if c.get("type") == "text")

        # 3. OpenAI / OpenRouter / Groq / DeepSeek (OpenAI-compatible)
        else:
            url = f"{base_url.rstrip('/')}/chat/completions" if base_url else "https://api.openai.com/v1/chat/completions"
            if clean_prov == "groq" and not base_url:
                url = "https://api.groq.com/openai/v1/chat/completions"
            elif clean_prov == "openrouter" and not base_url:
                url = "https://openrouter.ai/api/v1/chat/completions"

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            formatted_msgs = [{"role": "system", "content": system_instruction}] + messages
            payload = {
                "model": model or ("llama-3.3-70b-versatile" if clean_prov == "groq" else "gpt-4o"),
                "messages": formatted_msgs,
                "temperature": 0.5,
            }
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "")
                raise ValueError(f"Empty choices from {clean_prov}")

    @classmethod
    def _parse_architect_response(
        cls,
        raw_text: str,
        model_name: str,
        provider_name: str,
    ) -> Dict[str, Any]:
        """
        Extracts topology JSON and returns clean conversational text + parsed topology object.
        """
        clean_text = raw_text.strip()
        topology_obj = None

        # Regex search for ```workflow_topology ... ``` or ```json ... ``` containing nodes
        match = re.search(r"```(?:workflow_topology|json)\s*([\s\S]*?)\s*```", clean_text)
        if match:
            json_str = match.group(1).strip()
            try:
                parsed = json.loads(json_str)
                if isinstance(parsed, dict) and "nodes" in parsed and isinstance(parsed["nodes"], list) and len(parsed["nodes"]) > 0:
                    nodes = parsed["nodes"]
                    edges = parsed.get("edges", [])
                    topology_obj = {
                        "name": parsed.get("name") or "Generated Workflow Graph",
                        "category": parsed.get("category") or "Custom",
                        "description": parsed.get("description") or "Synthesized telephony flow topology",
                        "nodeCount": len(nodes),
                        "edgeCount": len(edges),
                        "nodes": nodes,
                        "edges": edges,
                    }
                    # Remove raw code block from user-facing markdown text
                    clean_text = clean_text[:match.start()].strip() + "\n\n" + clean_text[match.end():].strip()
                    clean_text = clean_text.strip()
            except Exception as e:
                logger.warning(f"Could not parse topology JSON from LLM: {e}")

        return {
            "status": "success",
            "model_used": model_name,
            "provider": provider_name,
            "response_text": clean_text or "Here is your architected workflow graph.",
            "topology": topology_obj,
        }

    @classmethod
    def _generate_smart_local_fallback(
        cls,
        prompt: str,
        provider: str,
        model_name: str,
        ai_service_available: bool,
    ) -> Dict[str, Any]:
        prompt_lower = prompt.lower().strip()
        prompt_clean = prompt_lower.strip("!.,? ")

        # If user is just saying hello or greeting
        is_greeting = (
            prompt_clean in ["hi", "hello", "hey", "hola", "namaste", "kaise ho", "kya haal hai", "good morning", "good evening", "who are you", "help", "kya kar sakte ho", "start", "menu"]
            or (len(prompt_clean.split()) <= 2 and any(w in prompt_clean for w in ["hi", "hello", "hey", "namaste"]))
        )
        if is_greeting:
            greeting_msg = (
                "नमस्ते! मैं आपका **AI Workflow Architect** हूँ। 😊\n\n"
                "मैं आपके लिए Telephony, IVR, Doctor Booking, Real Estate, Loan EMI, और Customer Support के live workflows डिज़ाइन कर सकता हूँ।\n\n"
                "आप मुझे बताइए कि आपको किस तरह का calling flow बनाना है?"
            )
            if not ai_service_available:
                greeting_msg += "\n\n*(Tip: Live AI model se connect karne ke liye **API & Integrations** me apni Google Gemini, Claude, ya OpenAI API key jodein)*"
            return {
                "status": "success",
                "model_used": model_name,
                "provider": provider,
                "response_text": greeting_msg,
                "topology": None,
            }

        # Check for specific flow themes for fallback
        if any(w in prompt_lower for w in ["clinic", "doctor", "dentist", "hospital", "patient", "appointment", "health", "symptom"]):
            flow_name = "Healthcare & Clinic Patient Triage Graph"
            flow_category = "Healthcare"
            description = "Patient symptom intake, doctor schedule RAG search, Google Calendar slot booking, and SMS confirmation."
            nodes = [
                {"id": "node_1", "type": "start_call", "label": "Clinic Inbound DID", "x": 80, "y": 160, "category": "telephony", "config": {"prompt": "Patient call on DID (+91 96508 55975)"}},
                {"id": "node_2", "type": "working_hours", "label": "Clinic Hours Check", "x": 480, "y": 160, "category": "logic", "config": {"prompt": "Mon-Sat 08:00-20:00 IST"}},
                {"id": "node_3", "type": "play_speech", "label": "Symptom & Doctor Intake", "x": 880, "y": 80, "category": "telephony", "config": {"prompt": "Hello! Thank you for calling MediCare Clinic. Which specialist or doctor would you like to consult?"}},
                {"id": "node_4", "type": "rag_search", "label": "Doctor Schedule Search", "x": 1280, "y": 80, "category": "ai", "config": {"prompt": "Query doctor availability vector database and open slots"}},
                {"id": "node_5", "type": "google_calendar", "label": "Book 20-Min Slot", "x": 1680, "y": 80, "category": "integration", "config": {"calendarDurationMin": 20}},
                {"id": "node_6", "type": "send_sms", "label": "SMS Confirmation & Map", "x": 2080, "y": 80, "category": "integration", "config": {"smsMessage": "Your appointment is confirmed for tomorrow. Location: MediCare City Center."}},
                {"id": "node_7", "type": "end_call", "label": "Graceful Hangup", "x": 2480, "y": 80, "category": "telephony", "config": {"prompt": "Thank you! See you tomorrow at the clinic. Take care."}},
                {"id": "node_8", "type": "human_escalate", "label": "Emergency Triage Bridge", "x": 880, "y": 380, "category": "escalation", "config": {"transferNumber": "+91 96508 55975"}},
            ]
            edges = [
                {"id": "e1", "source": "node_1", "target": "node_2", "sourceHandle": "out", "targetHandle": "in"},
                {"id": "e2", "source": "node_2", "target": "node_3", "sourceHandle": "open", "targetHandle": "in"},
                {"id": "e3", "source": "node_2", "target": "node_8", "sourceHandle": "closed", "targetHandle": "in"},
                {"id": "e4", "source": "node_3", "target": "node_4", "sourceHandle": "out", "targetHandle": "in"},
                {"id": "e5", "source": "node_4", "target": "node_5", "sourceHandle": "out", "targetHandle": "in"},
                {"id": "e6", "source": "node_5", "target": "node_6", "sourceHandle": "out", "targetHandle": "in"},
                {"id": "e7", "source": "node_6", "target": "node_7", "sourceHandle": "out", "targetHandle": "in"},
            ]
            explanation = (
                f"Maine aapke clinic ke liye **{flow_name}** tayyar kar diya hai.\n\n"
                f"### 📋 Flow Highlights:\n"
                f"1. **Inbound Line**: Patient call capture karta hai.\n"
                f"2. **Working Hours Check**: Mon-Sat clinic timing verify karta hai.\n"
                f"3. **Doctor Intake**: Patient se problem aur specialist poochta hai.\n"
                f"4. **RAG Vector Search**: Doctor ki availability check karta hai.\n"
                f"5. **Google Calendar Booking**: Slot automatically schedule karta hai.\n"
                f"6. **SMS Confirmation**: Patient ko token aur clinic location bhejta hai."
            )
        else:
            flow_name = "Custom Dynamic Telephony Routing Flow"
            flow_category = "Telephony"
            description = f"Custom voice routing topology for: '{prompt[:45]}'"
            nodes = [
                {"id": "node_1", "type": "start_call", "label": "Inbound Trunk Line", "x": 80, "y": 160, "category": "telephony", "config": {"prompt": "Inbound call on primary DID"}},
                {"id": "node_2", "type": "working_hours", "label": "Business Hours Check", "x": 480, "y": 160, "category": "logic", "config": {"prompt": "Check Mon-Fri 09:00-18:00"}},
                {"id": "node_3", "type": "play_speech", "label": "Speech Greeting", "x": 880, "y": 80, "category": "telephony", "config": {"prompt": f"Hello! Welcome to our automated assistance regarding {prompt[:35]}."}},
                {"id": "node_4", "type": "ai_intent_router", "label": "AI Intent Classifier", "x": 1280, "y": 80, "category": "ai", "config": {"intentRoutes": [{"intent": "Primary Request", "label": "Action"}, {"intent": "General Inquiry", "label": "Inquiry"}]}},
                {"id": "node_5", "type": "send_whatsapp", "label": "Send Confirmation", "x": 1680, "y": 80, "category": "integration", "config": {"prompt": "Send details to customer WhatsApp"}},
                {"id": "node_6", "type": "end_call", "label": "Graceful Hangup", "x": 2080, "y": 80, "category": "telephony", "config": {"prompt": "Thank you for calling. Have a great day!"}},
                {"id": "node_7", "type": "human_escalate", "label": "Live Agent Bridge", "x": 880, "y": 380, "category": "escalation", "config": {"transferNumber": "+91 96508 55975"}},
            ]
            edges = [
                {"id": "e1", "source": "node_1", "target": "node_2", "sourceHandle": "out", "targetHandle": "in"},
                {"id": "e2", "source": "node_2", "target": "node_3", "sourceHandle": "open", "targetHandle": "in"},
                {"id": "e3", "source": "node_2", "target": "node_7", "sourceHandle": "closed", "targetHandle": "in"},
                {"id": "e4", "source": "node_3", "target": "node_4", "sourceHandle": "out", "targetHandle": "in"},
                {"id": "e5", "source": "node_4", "target": "node_5", "sourceHandle": "intent_0", "targetHandle": "in"},
                {"id": "e6", "source": "node_5", "target": "node_6", "sourceHandle": "out", "targetHandle": "in"},
            ]
            explanation = (
                f"Maine aapki requirement ke anusaar **{flow_name}** tayyar kar diya hai.\n\n"
                f"Neeche diye gaye card par click karke aap ise seedhe canvas me load kar sakte hain."
            )

        return {
            "status": "success",
            "model_used": model_name,
            "provider": provider,
            "response_text": explanation,
            "topology": {
                "name": flow_name,
                "category": flow_category,
                "description": description,
                "nodeCount": len(nodes),
                "edgeCount": len(edges),
                "nodes": nodes,
                "edges": edges,
            },
        }
