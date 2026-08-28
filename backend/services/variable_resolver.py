"""
Variable Resolver Service
Nexus Call OS v2.4 Enterprise SSOT

Centralized runtime engine for variable scoping, precedence resolution,
data-type formatting, secret masking, and deterministic template interpolation.

Precedence Hierarchy (Highest to Lowest):
    1. Session / Call Overrides
    2. Contact (Contact.custom_variables + Contact fields)
    3. Agent (Agent persona & voice properties)
    4. Campaign (Campaign parameters)
    5. Workspace (Global DB Registered Variables & Defaults + Org settings)
"""

import json
import logging
import re
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple

from sqlalchemy.orm import Session

from backend.database.session import SessionLocal
from backend.models.models import (
    Agent,
    Campaign,
    Contact,
    Organization,
    ProviderCredential,
    WorkspaceSettings,
)
from backend.utils.crypto import decrypt_secret

logger = logging.getLogger("nexus.variable_resolver")


class VariableScope(str, Enum):
    WORKSPACE = "Workspace Level"
    CAMPAIGN = "Campaign Level"
    AGENT = "Agent Level"
    CONTACT = "Contact Level"
    SESSION = "Session/Call Level"


class VariableDataType(str, Enum):
    STRING = "String"
    NUMBER = "Number"
    BOOLEAN = "Boolean"
    DATE = "Date"
    DATETIME = "DateTime"
    SECRET = "Secret"
    JSON = "JSON"
    CUSTOM = "Custom"


class MissingVariableStrategy(str, Enum):
    HUMANIZE = "humanize"  # e.g. {{account_id}} -> "Account Id"
    BLANK = "blank"        # e.g. {{account_id}} -> ""
    DEFAULT = "default"    # Use registered default_value if available else humanize
    KEEP = "keep"          # Leaves {{account_id}} as-is
    RAISE = "raise"        # Raises KeyError


@dataclass
class VariableDefinition:
    """Represents a canonical registered variable from the workspace database."""
    id: str
    name: str
    display_name: str
    data_type: str = "String"
    scope: str = VariableScope.WORKSPACE.value
    default_value: Any = ""
    is_secret: bool = False
    organization_id: Optional[str] = None
    validation_rule: Optional[str] = None
    allowed_values: Optional[str] = None
    example_value: Optional[str] = None
    status: str = "Active"
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ResolutionContext:
    """Encapsulates all runtime entities and overrides for hierarchical variable resolution."""
    organization_id: Optional[str] = None
    
    # Hierarchical scope overrides (Lowest to Highest)
    workspace_overrides: Dict[str, Any] = field(default_factory=dict)
    
    campaign_id: Optional[str] = None
    campaign_overrides: Dict[str, Any] = field(default_factory=dict)
    
    agent_id: Optional[str] = None
    agent_overrides: Dict[str, Any] = field(default_factory=dict)
    
    contact_id: Optional[str] = None
    contact_overrides: Dict[str, Any] = field(default_factory=dict)
    
    session_id: Optional[str] = None
    session_overrides: Dict[str, Any] = field(default_factory=dict)
    
    # Dynamic contact custom variables dictionary
    custom_variables: Dict[str, Any] = field(default_factory=dict)
    
    # Missing variable replacement strategy
    missing_strategy: MissingVariableStrategy = MissingVariableStrategy.DEFAULT


@dataclass
class ResolutionResult:
    """Detailed output of variable resolution with audit telemetry."""
    resolved_text: str
    resolved_variables: Dict[str, Any]
    all_effective_variables: Dict[str, Any] = field(default_factory=dict)
    masked_variables: Dict[str, Any] = field(default_factory=dict)
    detected_tags: List[str] = field(default_factory=list)
    missing_variables: List[str] = field(default_factory=list)
    precedence_trace: Dict[str, str] = field(default_factory=dict)  # var_name -> scope_name


def normalize_var_key(key: str) -> str:
    """Normalizes variable keys to lowercase alphanumeric slugs."""
    if not key:
        return ""
    clean = str(key).strip().lower()
    return re.sub(r"[^a-z0-9_]", "_", clean).strip("_")


def format_typed_value(val: Any, data_type: str = "String") -> str:
    """Converts a typed python/JSON value into a canonical string format."""
    if val is None:
        return ""
    
    if isinstance(val, bool):
        return "true" if val else "false"
    
    clean_type = (data_type or "String").strip().title()
    
    if clean_type == "Boolean":
        s = str(val).strip().lower()
        return "true" if s in ["true", "1", "yes", "t", "y"] else "false"
    
    elif clean_type == "Number":
        if isinstance(val, (int, float)):
            return str(val)
        try:
            if "." in str(val):
                return str(float(val))
            return str(int(val))
        except (ValueError, TypeError):
            return str(val)
            
    elif clean_type in ["Date", "Datetime"]:
        if isinstance(val, (datetime, date)):
            return val.isoformat()
        return str(val)
        
    elif clean_type == "Json":
        if isinstance(val, (dict, list)):
            return json.dumps(val, ensure_ascii=False)
        return str(val)
        
    return str(val)


def mask_secret_value(val: Any) -> str:
    """Masks secret values for safe public display or logging."""
    if not val:
        return ""
    s = str(val)
    if len(s) <= 6:
        return "••••••••"
    return f"{s[:2]}••••••••{s[-2:]}"


class VariableResolverService:
    """
    Centralized Variable Resolver Engine.
    Provides SSOT variable registry loading, multi-tier precedence resolution,
    and prompt/text template interpolation.
    """

    VARIABLE_TAG_REGEX = re.compile(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}")

    def __init__(self):
        pass

    @classmethod
    def scan_variables(cls, text: str) -> List[str]:
        """Extracts unique variable tag names from a template string."""
        if not text:
            return []
        matches = cls.VARIABLE_TAG_REGEX.findall(text)
        seen: Set[str] = set()
        res: List[str] = []
        for m in matches:
            norm = normalize_var_key(m)
            if norm and norm not in seen:
                seen.add(norm)
                res.append(norm)
        return res

    def load_registered_definitions(
        self,
        organization_id: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> Dict[str, VariableDefinition]:
        """
        Loads all registered Variable records from ProviderCredential (category='variables')
        for the given organization into canonical VariableDefinition objects.
        """
        definitions: Dict[str, VariableDefinition] = {}
        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True

        try:
            query = db.query(ProviderCredential).filter(
                ProviderCredential.category == "variables"
            )
            if organization_id and organization_id not in ["global", "demo_org"]:
                query = query.filter(
                    (ProviderCredential.organization_id == organization_id)
                    | (ProviderCredential.organization_id == None)
                )
            
            records = query.all()
            for rec in records:
                meta: Dict[str, Any] = {}
                if rec.metadata_json:
                    try:
                        meta = (
                            json.loads(rec.metadata_json)
                            if isinstance(rec.metadata_json, str)
                            else rec.metadata_json
                        )
                    except Exception:
                        meta = {}

                # Variable name from provider_name or metadata
                raw_name = rec.provider_name or meta.get("name") or meta.get("variable_name") or ""
                norm_name = normalize_var_key(raw_name)
                if not norm_name:
                    continue

                display_name = rec.display_name or meta.get("display_name") or norm_name.replace("_", " ").title()
                data_type = rec.primary_model or meta.get("variable_type") or meta.get("data_type") or "String"
                scope = meta.get("scope") or getattr(rec, "subtab_name", None) or VariableScope.WORKSPACE.value
                default_val = meta.get("default_value", "")
                is_sec = bool(meta.get("is_secret") or data_type == "Secret")

                # If variable is secret and has encrypted plain_key, decrypt it for internal default
                if is_sec and rec.encrypted_key and rec.encrypted_key != "config_rule":
                    try:
                        decrypted = decrypt_secret(rec.encrypted_key)
                        if decrypted and not default_val:
                            default_val = decrypted
                    except Exception:
                        pass

                definitions[norm_name] = VariableDefinition(
                    id=rec.id,
                    name=norm_name,
                    display_name=display_name,
                    data_type=data_type,
                    scope=scope,
                    default_value=default_val,
                    is_secret=is_sec,
                    organization_id=rec.organization_id,
                    validation_rule=meta.get("validation_rule"),
                    allowed_values=meta.get("allowed_values"),
                    example_value=meta.get("example_value"),
                    status=meta.get("status", "Active"),
                    metadata=meta,
                )

        except Exception as e:
            logger.warning(f"Failed to load registered variable definitions from database: {e}")
        finally:
            if should_close:
                db.close()

        return definitions

    def build_hierarchical_store(
        self,
        context: Optional[ResolutionContext] = None,
        db: Optional[Session] = None,
    ) -> Tuple[Dict[str, Any], Dict[str, str], Dict[str, VariableDefinition]]:
        """
        Builds the unified variable key-value store strictly following the Precedence Hierarchy:
            Tier 5 (Lowest): Workspace Definitions & Defaults + DB Organization
            Tier 4: Campaign parameters & overrides
            Tier 3: Agent persona & overrides
            Tier 2: Contact attributes & Contact.custom_variables
            Tier 1 (Highest): Session / Call Overrides

        Returns:
            (effective_store, precedence_trace, registered_definitions)
        """
        ctx = context or ResolutionContext()
        effective_store: Dict[str, Any] = {}
        precedence_trace: Dict[str, str] = {}

        # 1. Load Registered DB Definitions
        reg_defs = self.load_registered_definitions(
            organization_id=ctx.organization_id,
            db=db,
        )

        # Tier 5a: Registered Variable Default Values (Workspace Level)
        for var_name, def_obj in reg_defs.items():
            if def_obj.default_value not in [None, ""]:
                effective_store[var_name] = def_obj.default_value
                precedence_trace[var_name] = VariableScope.WORKSPACE.value

        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True

        try:
            # Tier 5b: Organization DB Entity + Workspace Settings + Workspace Overrides
            ws_name = None
            try:
                ws_settings = db.query(WorkspaceSettings).first()
                if ws_settings and ws_settings.features:
                    features_dict = json.loads(ws_settings.features) if isinstance(ws_settings.features, str) else ws_settings.features
                    if isinstance(features_dict, dict) and features_dict.get("workspaceName"):
                        ws_name = features_dict.get("workspaceName")
            except Exception:
                pass

            real_org = None
            if ctx.organization_id and ctx.organization_id not in ["global", "demo_org"]:
                real_org = db.query(Organization).filter(Organization.id == ctx.organization_id).first()
            if not real_org:
                real_org = db.query(Organization).first()

            effective_org_name = ws_name or (real_org.name if real_org else "Nexus Europe Ltd.")
            billing_email = (real_org.billing_email if real_org else None) or "billing@nexuscall.os"
            plan_name = (real_org.plan if real_org else None) or "Enterprise"

            org_vars = {
                "company_name": effective_org_name,
                "organization_name": effective_org_name,
                "business_name": effective_org_name,
                "workspace_name": effective_org_name,
                "billing_email": billing_email,
                "plan": plan_name,
            }
            for k, v in org_vars.items():
                if v:
                    norm_k = normalize_var_key(k)
                    effective_store[norm_k] = v
                    precedence_trace[norm_k] = VariableScope.WORKSPACE.value

            for k, v in ctx.workspace_overrides.items():
                if v is not None:
                    norm_k = normalize_var_key(k)
                    effective_store[norm_k] = v
                    precedence_trace[norm_k] = VariableScope.WORKSPACE.value

            # Tier 4: Campaign Level
            real_campaign = None
            if ctx.campaign_id and ctx.campaign_id != "all":
                real_campaign = db.query(Campaign).filter(
                    (Campaign.id == ctx.campaign_id) | (Campaign.name == ctx.campaign_id)
                ).first()

            if real_campaign:
                camp_vars = {
                    "campaign_name": real_campaign.name,
                    "campaign_id": str(real_campaign.id),
                    "campaign_type": real_campaign.type,
                    "schedule_type": real_campaign.schedule_type,
                }
                for k, v in camp_vars.items():
                    if v:
                        norm_k = normalize_var_key(k)
                        effective_store[norm_k] = v
                        precedence_trace[norm_k] = VariableScope.CAMPAIGN.value

            for k, v in ctx.campaign_overrides.items():
                if v is not None:
                    norm_k = normalize_var_key(k)
                    effective_store[norm_k] = v
                    precedence_trace[norm_k] = VariableScope.CAMPAIGN.value

            # Tier 3: Agent Level
            real_agent = None
            if ctx.agent_id and ctx.agent_id != "all":
                real_agent = db.query(Agent).filter(
                    (Agent.id == ctx.agent_id) | (Agent.name == ctx.agent_id)
                ).first()

            if real_agent:
                agent_vars = {
                    "agent_name": real_agent.name,
                    "assistant_name": real_agent.name,
                    "persona_name": real_agent.name,
                    "voice_id": getattr(real_agent, "voice_id", None) or "ElevenLabs Turbo",
                    "llm_model": getattr(real_agent, "llm_model", None) or "Gemini 2.5 Flash",
                    "model_name": getattr(real_agent, "llm_model", None) or "Gemini 2.5 Flash",
                    "language": getattr(real_agent, "language", None) or "en-US",
                }
                for k, v in agent_vars.items():
                    if v:
                        norm_k = normalize_var_key(k)
                        effective_store[norm_k] = v
                        precedence_trace[norm_k] = VariableScope.AGENT.value

            for k, v in ctx.agent_overrides.items():
                if v is not None:
                    norm_k = normalize_var_key(k)
                    effective_store[norm_k] = v
                    precedence_trace[norm_k] = VariableScope.AGENT.value

            # Tier 2: Contact Level
            real_contact = None
            if ctx.contact_id and ctx.contact_id != "all":
                real_contact = db.query(Contact).filter(
                    (Contact.id == ctx.contact_id) | (Contact.name == ctx.contact_id)
                ).first()

            if real_contact:
                tags_str = ""
                if getattr(real_contact, "tags", None):
                    if isinstance(real_contact.tags, list):
                        tags_str = ", ".join(str(t) for t in real_contact.tags if t)
                    else:
                        tags_str = str(real_contact.tags)

                contact_vars = {
                    "name": real_contact.name,
                    "full_name": real_contact.name,
                    "customer_name": real_contact.name,
                    "client_name": real_contact.name,
                    "lead_name": real_contact.name,
                    "contact_name": real_contact.name,
                    "phone": getattr(real_contact, "phone", None) or getattr(real_contact, "phone_number", None),
                    "phone_number": getattr(real_contact, "phone", None) or getattr(real_contact, "phone_number", None),
                    "mobile": getattr(real_contact, "phone", None) or getattr(real_contact, "phone_number", None),
                    "email": getattr(real_contact, "email", None),
                    "customer_email": getattr(real_contact, "email", None),
                    "status": getattr(real_contact, "status", None),
                    "tags": tags_str,
                    "tag": tags_str,
                }
                for k, v in contact_vars.items():
                    if v:
                        norm_k = normalize_var_key(k)
                        effective_store[norm_k] = v
                        precedence_trace[norm_k] = VariableScope.CONTACT.value

                # Merge Contact.custom_variables JSON column from DB
                if getattr(real_contact, "custom_variables", None) and isinstance(real_contact.custom_variables, dict):
                    for k, v in real_contact.custom_variables.items():
                        if v is not None:
                            norm_k = normalize_var_key(k)
                            effective_store[norm_k] = v
                            precedence_trace[norm_k] = VariableScope.CONTACT.value

            # Explicit contact custom variables from context
            for k, v in ctx.custom_variables.items():
                if v is not None:
                    norm_k = normalize_var_key(k)
                    effective_store[norm_k] = v
                    precedence_trace[norm_k] = VariableScope.CONTACT.value

            for k, v in ctx.contact_overrides.items():
                if v is not None:
                    norm_k = normalize_var_key(k)
                    effective_store[norm_k] = v
                    precedence_trace[norm_k] = VariableScope.CONTACT.value

            # Tier 1 (Highest): Session / Call Level Overrides
            if ctx.session_id:
                effective_store["session_id"] = ctx.session_id
                effective_store["call_id"] = ctx.session_id
                precedence_trace["session_id"] = VariableScope.SESSION.value
                precedence_trace["call_id"] = VariableScope.SESSION.value

            for k, v in ctx.session_overrides.items():
                if v is not None:
                    norm_k = normalize_var_key(k)
                    effective_store[norm_k] = v
                    precedence_trace[norm_k] = VariableScope.SESSION.value

        finally:
            if should_close:
                db.close()

        return effective_store, precedence_trace, reg_defs

    def resolve_text(
        self,
        template_text: str,
        context: Optional[ResolutionContext] = None,
        mask_secrets: bool = False,
        db: Optional[Session] = None,
    ) -> ResolutionResult:
        """
        Interpolates template text replacing all {{var}} tokens based on hierarchical resolution.
        Applies data-type formatting and secret masking policies.
        Deterministic fallback ensures unconfigured variables never leak raw unparsed brackets to LLM.
        """
        if not template_text:
            return ResolutionResult(
                resolved_text="",
                resolved_variables={},
                masked_variables={},
                detected_tags=[],
                missing_variables=[],
                precedence_trace={},
            )

        ctx = context or ResolutionContext()
        effective_store, precedence_trace, reg_defs = self.build_hierarchical_store(
            context=ctx,
            db=db,
        )

        detected_tags = self.scan_variables(template_text)
        resolved_vars: Dict[str, Any] = {}
        masked_vars: Dict[str, Any] = {}
        missing_vars: List[str] = []

        def replace_token(match: re.Match) -> str:
            raw_token = match.group(1)
            norm_key = normalize_var_key(raw_token)

            if norm_key in effective_store:
                raw_val = effective_store[norm_key]
                def_obj = reg_defs.get(norm_key)
                d_type = def_obj.data_type if def_obj else "String"
                is_sec = def_obj.is_secret if def_obj else False

                formatted_val = format_typed_value(raw_val, data_type=d_type)
                resolved_vars[norm_key] = formatted_val

                if is_sec:
                    masked_vars[norm_key] = mask_secret_value(formatted_val)
                    return mask_secret_value(formatted_val) if mask_secrets else formatted_val
                else:
                    masked_vars[norm_key] = formatted_val
                    return formatted_val

            # Variable missing from store -> apply deterministic strategy
            missing_vars.append(raw_token)

            # Check if registered definition has default value
            if norm_key in reg_defs and reg_defs[norm_key].default_value not in [None, ""]:
                def_obj = reg_defs[norm_key]
                val = format_typed_value(def_obj.default_value, data_type=def_obj.data_type)
                resolved_vars[norm_key] = val
                masked_vars[norm_key] = mask_secret_value(val) if def_obj.is_secret else val
                return mask_secret_value(val) if (def_obj.is_secret and mask_secrets) else val

            if ctx.missing_strategy == MissingVariableStrategy.BLANK:
                return ""
            elif ctx.missing_strategy == MissingVariableStrategy.KEEP:
                return match.group(0)
            elif ctx.missing_strategy == MissingVariableStrategy.RAISE:
                raise KeyError(f"Variable '{raw_token}' could not be resolved.")
            else:
                # Default: Humanize e.g. {{account_number}} -> "Account Number"
                humanized = raw_token.replace("_", " ").title()
                return humanized

        # Perform replacement
        resolved_str = self.VARIABLE_TAG_REGEX.sub(replace_token, template_text)

        return ResolutionResult(
            resolved_text=resolved_str,
            resolved_variables=resolved_vars,
            all_effective_variables=effective_store,
            masked_variables=masked_vars,
            detected_tags=detected_tags,
            missing_variables=list(set(missing_vars)),
            precedence_trace=precedence_trace,
        )

    def get_effective_variables(
        self,
        context: Optional[ResolutionContext] = None,
        mask_secrets: bool = True,
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """Returns the full dictionary of all effective variables formatted with optional secret masking."""
        effective_store, _, reg_defs = self.build_hierarchical_store(
            context=context,
            db=db,
        )
        result: Dict[str, Any] = {}
        for k, v in effective_store.items():
            def_obj = reg_defs.get(k)
            d_type = def_obj.data_type if def_obj else "String"
            is_sec = def_obj.is_secret if def_obj else False
            formatted = format_typed_value(v, data_type=d_type)
            if is_sec and mask_secrets:
                result[k] = mask_secret_value(formatted)
            else:
                result[k] = formatted
        return result


# Global singleton instance for clean cross-module importing
variable_resolver = VariableResolverService()
