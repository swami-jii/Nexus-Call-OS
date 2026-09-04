import time
from typing import Any, Dict, List, Optional
from backend.skills.skill_registry import SkillRegistry


class ConversationTurn:
    def __init__(
        self,
        speaker: str,
        text: str,
        tokens_used: int = 0,
        latency_ms: float = 0.0,
        provider: str = "Gemini",
    ):
        self.speaker = speaker
        self.text = text
        self.timestamp = time.strftime("%H:%M:%S")
        self.tokens_used = tokens_used
        self.latency_ms = latency_ms
        self.provider = provider

    def to_dict(self) -> dict[str, Any]:
        return {
            "speaker": self.speaker,
            "text": self.text,
            "timestamp": self.timestamp,
            "tokens_used": self.tokens_used,
            "latency_ms": self.latency_ms,
            "provider": self.provider,
        }


class AgentToolExecutor:
    @staticmethod
    def execute_tool(tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        if tool_name == "calculator":
            expression = str(arguments.get("expression", "0"))
            try:
                # Safe evaluation of basic math
                allowed = set("0123456789+-*/.() ")
                if not set(expression).issubset(allowed):
                    return {"error": "Invalid characters in math expression"}
                result = float(eval(expression))
                return {"result": result}
            except Exception as e:
                return {"error": str(e)}

        if tool_name == "date_time":
            return {"current_datetime": time.strftime("%Y-%m-%d %H:%M:%S %Z")}

        if tool_name == "knowledge_base":
            query = arguments.get("query", "")
            return {
                "query": query,
                "matches": [
                    {
                        "snippet": f"Retrieved enterprise context for '{query}'",
                        "score": 0.98,
                    }
                ],
            }

        if tool_name == "crm_lookup":
            phone = arguments.get("phone", "")
            return {
                "phone": phone,
                "customer_name": "Sarah Connor",
                "tier": "Enterprise VIP",
                "open_tickets": 0,
            }

        if tool_name == "http_webhook":
            url = arguments.get("url", "https://api.nexus.ai/webhook")
            return {"url": url, "status": "200 OK", "response": {"delivered": True}}

        return {"status": "executed", "tool": tool_name, "arguments": arguments}


class AgentSkillManager:
    @staticmethod
    def evaluate_skill(skill_name: str | None, input_text: str, agent_name: str = "AI Assistant", context: Optional[Dict[str, Any]] = None) -> str:
        return SkillRegistry.evaluate_skill(skill_name, input_text, agent_name=agent_name, context=context)


class EnterpriseAgentEngine:
    def __init__(
        self,
        agent_id: str,
        system_prompt: str = "You are a professional AI Voice assistant.",
        max_context_tokens: int = 4096,
    ):
        self.agent_id = agent_id
        self.system_prompt = system_prompt
        self.max_context_tokens = max_context_tokens
        self.turns: List[ConversationTurn] = []
        self.short_term_memory: Dict[str, Any] = {}
        self.long_term_memory: List[str] = []
        self.prompt_version = 1

    def add_turn(
        self,
        speaker: str,
        text: str,
        tokens: int = 15,
        latency_ms: float = 85.0,
        provider: str = "Gemini",
    ) -> ConversationTurn:
        turn = ConversationTurn(
            speaker=speaker,
            text=text,
            tokens_used=tokens,
            latency_ms=latency_ms,
            provider=provider,
        )
        self.turns.append(turn)
        return turn

    def get_token_count(self) -> int:
        return sum(turn.tokens_used for turn in self.turns)

    def get_summary(self) -> str:
        if not self.turns:
            return "No conversation turns recorded."
        user_msgs = [t.text for t in self.turns if t.speaker == "user"]
        queries = "; ".join(user_msgs[:3])
        return f"Conversation with {len(self.turns)} turns. User queries: {queries}"

    def process_turn(
        self,
        user_input: str,
        active_skill: Optional[str] = None,
        tool_call: Optional[str] = None,
        tool_args: Optional[Dict[str, Any]] = None,
        agent_name: str = "AI Assistant",
    ) -> Dict[str, Any]:
        start_time = time.time()
        self.add_turn(speaker="user", text=user_input, tokens=len(user_input.split()))

        tool_result = None
        if tool_call:
            tool_result = AgentToolExecutor.execute_tool(tool_call, tool_args or {})

        if tool_result and "result" in tool_result:
            ai_text = f"Calculated result: {tool_result['result']}"
        elif tool_result and "customer_name" in tool_result:
            c_name = tool_result["customer_name"]
            tier = tool_result["tier"]
            ai_text = f"Customer identified: {c_name} ({tier})."
        else:
            ai_text = AgentSkillManager.evaluate_skill(active_skill, user_input, agent_name=agent_name)

        latency = round((time.time() - start_time) * 1000, 2)
        ai_turn = self.add_turn(
            speaker="assistant",
            text=ai_text,
            tokens=len(ai_text.split()),
            latency_ms=latency,
        )

        return {
            "ai_response": ai_text,
            "latency_ms": latency,
            "tool_result": tool_result,
            "turn": ai_turn.to_dict(),
            "total_tokens": self.get_token_count(),
        }
