import re
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
        language: str = "Auto-Detect",
    ) -> str:
        if not cls._skills:
            from backend.skills.skill_loader import load_all_skills_from_disk
            load_all_skills_from_disk()

        # If a specific skill is requested, execute it directly
        if skill_name and skill_name != "none" and skill_name in cls._skills:
            return cls._skills[skill_name].execute(input_text, agent_name=agent_name, context=context, language=language)

        clean_words = set(re.findall(r'\b[\w\u0900-\u097F]+\b', input_text.lower()))

        # Match triggers strictly as whole words when skill is specified or strong intent match
        # Match triggers from loaded skills
        for skill in cls._skills.values():
            for trigger in skill.triggers:
                t_words = trigger.lower().split()
                if len(t_words) == 1 and t_words[0] in clean_words:
                    if t_words[0] in ["hi", "hey", "hello"] and len(clean_words) > 3:
                        continue
                    return skill.execute(input_text, agent_name=agent_name, context=context, language=language)
                elif len(t_words) > 1 and trigger.lower() in input_text.lower():
                    return skill.execute(input_text, agent_name=agent_name, context=context, language=language)

        return ""
