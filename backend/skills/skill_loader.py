import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
from backend.skills.base_skill import BaseSkill
from backend.skills.skill_registry import SkillRegistry


class MarkdownSkill(BaseSkill):
    """
    Dynamically instantiated skill loaded directly from a SKILL.md file.
    """

    def __init__(
        self,
        skill_id: str,
        name: str,
        description: str,
        category: str = "general",
        icon: str = "Sparkles",
        system_prompt_addon: str = "",
        triggers: Optional[List[str]] = None,
        sample_phrase: str = "",
        markdown_body: str = "",
        file_path: str = "",
    ):
        super().__init__(
            skill_id=skill_id,
            name=name,
            description=description,
            category=category,
            system_prompt_addon=system_prompt_addon,
            triggers=triggers or [],
        )
        self.icon = icon
        self.sample_phrase = sample_phrase
        self.markdown_body = markdown_body
        self.file_path = file_path

    def execute(
        self,
        input_text: str,
        agent_name: str = "AI Assistant",
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        if self.sample_phrase:
            return self.sample_phrase.replace("AI Assistant", agent_name)
        return f"Hello, I am {agent_name}. Regarding '{input_text}', the {self.name} skill is actively processing this request."

    def to_dict(self) -> Dict[str, Any]:
        data = super().to_dict()
        data["icon"] = self.icon
        data["sample_phrase"] = self.sample_phrase
        data["markdown_body"] = self.markdown_body
        data["file_path"] = self.file_path
        return data


def parse_skill_md_file(file_path: Path) -> Optional[MarkdownSkill]:
    """
    Parse YAML frontmatter and Markdown content from a SKILL.md file.
    """
    try:
        text = file_path.read_text(encoding="utf-8")
        frontmatter_match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", text, re.DOTALL)
        if not frontmatter_match:
            return None

        raw_yaml, markdown_body = frontmatter_match.groups()
        meta: Dict[str, Any] = {}

        # Safe line-by-line YAML parser (works without external pyyaml dependency)
        current_list_key = None
        for line in raw_yaml.split("\n"):
            line_str = line.strip()
            if not line_str or line_str.startswith("#"):
                continue

            if line_str.startswith("- ") and current_list_key:
                val = line_str[2:].strip().strip("\"'")
                if current_list_key not in meta:
                    meta[current_list_key] = []
                meta[current_list_key].append(val)
                continue

            if ":" in line:
                key, val = line.split(":", 1)
                key = key.strip()
                val = val.strip().strip("\"'")
                if val:
                    meta[key] = val
                    current_list_key = None
                else:
                    meta[key] = []
                    current_list_key = key

        skill_id = meta.get("name") or file_path.parent.name
        name = meta.get("title") or meta.get("name") or skill_id.replace("-", " ").title()
        description = meta.get("description", "")
        category = meta.get("category", "general")
        icon = meta.get("icon", "Sparkles")
        triggers = meta.get("triggers", [])
        sample_phrase = meta.get("sample_phrase", "")

        # Extract system prompt directive from markdown body if not in frontmatter
        prompt_addon = ""
        prompt_match = re.search(r"## System Prompt Directive\s*\n(.*?)(?=\n##|\Z)", markdown_body, re.DOTALL)
        if prompt_match:
            prompt_addon = prompt_match.group(1).strip()

        return MarkdownSkill(
            skill_id=skill_id,
            name=name,
            description=description,
            category=category,
            icon=icon,
            system_prompt_addon=prompt_addon,
            triggers=triggers,
            sample_phrase=sample_phrase,
            markdown_body=markdown_body.strip(),
            file_path=str(file_path),
        )
    except Exception as e:
        print(f"[SkillLoader] Error parsing {file_path}: {e}")
        return None


def load_all_skills_from_disk(base_dir: Optional[Path] = None) -> List[MarkdownSkill]:
    """
    Search unified `.agents/skills/` directory for all `*/SKILL.md` files and register them.
    """
    if not base_dir:
        # Resolve workspace root from backend location
        current_file = Path(__file__).resolve()
        base_dir = current_file.parent.parent.parent

    # Primary SSOT location: agent_skills
    skills_dir = base_dir / "agent_skills"
    if not skills_dir.exists():
        skills_dir = base_dir / ".agents" / "skills"
    if not skills_dir.exists():
        skills_dir = base_dir / "skills"

    loaded: List[MarkdownSkill] = []

    if skills_dir.exists() and skills_dir.is_dir():
        for skill_file in skills_dir.glob("*/SKILL.md"):
            skill = parse_skill_md_file(skill_file)
            if skill:
                SkillRegistry.register(skill)
                loaded.append(skill)

    return loaded


# Automatically load all disk-based SKILL.md files into the registry
load_all_skills_from_disk()

