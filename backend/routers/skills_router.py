from typing import Any, Dict, List
from fastapi import APIRouter
from backend.skills.skill_registry import SkillRegistry

router = APIRouter(prefix="/api/skills", tags=["Skills & Conversational Flows"])


@router.get("", response_model=List[Dict[str, Any]])
def list_skills():
    """
    Get all registered dynamic voice skills across all categories.
    """
    return SkillRegistry.get_all_skills()


@router.get("/{skill_id}", response_model=Dict[str, Any])
def get_skill_details(skill_id: str):
    """
    Get specific skill details and prompt schema.
    """
    skill = SkillRegistry.get_skill(skill_id)
    if not skill:
        return {"error": "Skill not found", "id": skill_id}
    return skill.to_dict()
