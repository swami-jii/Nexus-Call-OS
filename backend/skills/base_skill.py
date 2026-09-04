from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BaseSkill(ABC):
    """
    Abstract Base Class for all Enterprise AI Voice Agent Skills.
    Each skill encapsulates a specific conversational capability, intent triggers,
    and system prompt augmentations.
    """

    id: str
    name: str
    description: str
    category: str
    system_prompt_addon: str
    triggers: List[str]

    def __init__(
        self,
        skill_id: str,
        name: str,
        description: str,
        category: str = "general",
        system_prompt_addon: str = "",
        triggers: Optional[List[str]] = None,
    ):
        self.id = skill_id
        self.name = name
        self.description = description
        self.category = category
        self.system_prompt_addon = system_prompt_addon
        self.triggers = triggers or []

    @abstractmethod
    def execute(
        self,
        input_text: str,
        agent_name: str = "AI Assistant",
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Execute skill logic when active turn matches or is explicitly selected.
        """
        pass

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "system_prompt_addon": self.system_prompt_addon,
            "triggers": self.triggers,
        }
