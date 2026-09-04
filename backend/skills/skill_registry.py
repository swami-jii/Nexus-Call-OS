from typing import Any, Dict, List, Optional
from backend.skills.base_skill import BaseSkill


class SkillRegistry:
    """
    Central Registry for all Enterprise Voice Skills.
    Skills are dynamically loaded from `agent_skills/*/SKILL.md` markdown files.
    """

    _skills: Dict[str, BaseSkill] = {}

    @classmethod
    def register(cls, skill: BaseSkill):
        cls._skills[skill.id] = skill

    @classmethod
    def get_skill(cls, skill_id: str) -> Optional[BaseSkill]:
        if not cls._skills:
            from backend.skills.skill_loader import load_all_skills_from_disk
            load_all_skills_from_disk()
        return cls._skills.get(skill_id)

    @classmethod
    def get_all_skills(cls) -> List[Dict[str, Any]]:
        if not cls._skills:
            from backend.skills.skill_loader import load_all_skills_from_disk
            load_all_skills_from_disk()
        return [s.to_dict() for s in cls._skills.values()]

    @classmethod
    def evaluate_skill(
        cls,
        skill_name: Optional[str],
        input_text: str,
        agent_name: str = "AI Assistant",
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        if not cls._skills:
            from backend.skills.skill_loader import load_all_skills_from_disk
            load_all_skills_from_disk()

        if skill_name and skill_name in cls._skills:
            return cls._skills[skill_name].execute(input_text, agent_name=agent_name, context=context)

        # Fallback keyword matching against trigger phrases
        clean_lower = input_text.lower().strip()
        for skill in cls._skills.values():
            for trigger in skill.triggers:
                if trigger in clean_lower:
                    return skill.execute(input_text, agent_name=agent_name, context=context)

        return f"Hello, I am {agent_name}. Regarding '{input_text}', Nexus AI Voice OS is processing this request for you."
