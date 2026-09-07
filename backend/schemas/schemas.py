from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# Generic Paginated Response
class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    page: int
    page_size: int
    pages: int


# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    phone_number: str | None = None
    role: str | None = "operator"


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool | None = False


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict[str, Any]


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str = Field(..., min_length=6)


class OTPRequest(BaseModel):
    email_or_phone: str


class OTPVerifyRequest(BaseModel):
    email_or_phone: str
    otp_code: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str | None = None
    phone_number: str | None = None
    role: str = "operator"
    organization_id: str | None = None
    is_active: bool = True
    is_verified: bool = True
    profile_data: str | None = None
    created_at: datetime | None = None


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    phone_number: str | None = None
    profile_data: str | None = None
    password: str | None = Field(None, min_length=6)


# Agent Schemas
class AgentBase(BaseModel):
    name: str
    description: str | None = None
    system_prompt: str | None = None
    voice_id: str | None = "ElevenLabs Turbo v2.5"
    llm_model: str | None = None
    language: str | None = "en-US"
    temperature: float | None = 0.7
    status: str | None = "active"


class AgentCreate(AgentBase):
    pass


class AgentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    system_prompt: str | None = None
    voice_id: str | None = None
    llm_model: str | None = None
    language: str | None = None
    temperature: float | None = None
    status: str | None = None


class AgentOut(AgentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str | None
    created_at: datetime
    updated_at: datetime


# Campaign Schemas
class CampaignBase(BaseModel):
    name: str
    agent_id: str | None = None
    type: str | None = "Outbound Voice"
    status: str | None = "Running"
    total_leads: int | None = 0
    completed_calls: int | None = 0
    success_rate: float | None = 0.0
    schedule_type: str | None = "Immediate Execution"


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    name: str | None = None
    agent_id: str | None = None
    type: str | None = None
    status: str | None = None
    total_leads: int | None = None
    completed_calls: int | None = None
    success_rate: float | None = None
    schedule_type: str | None = None


class CampaignOut(CampaignBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str | None
    created_at: datetime
    updated_at: datetime


# Phone Number Schemas
class PhoneNumberBase(BaseModel):
    number: str
    country_code: str | None = "US"
    provider: str | None = "Twilio SIP"
    monthly_cost: float | None = 2.50
    status: str | None = "active"
    assigned_agent_id: str | None = None


class PhoneNumberCreate(PhoneNumberBase):
    pass


class PhoneNumberUpdate(BaseModel):
    number: str | None = None
    country_code: str | None = None
    provider: str | None = None
    monthly_cost: float | None = None
    status: str | None = None
    assigned_agent_id: str | None = None


class PhoneNumberOut(PhoneNumberBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str | None
    created_at: datetime


# Contact Schemas
class ContactBase(BaseModel):
    name: str
    phone: str
    email: str | None = None
    tags: list[str] | None = []
    status: str | None = "verified"
    custom_variables: dict[str, Any] | None = {}


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    phone_number: str | None = None
    email: str | None = None
    company: str | None = None
    tags: list[str] | None = None
    tags_json: list[str] | None = None
    custom_variables: dict[str, Any] | None = None
    custom_fields: dict[str, Any] | None = None
    status: str | None = None
    lead_score: int | None = None
    leadScore: int | None = None


class ContactOut(ContactBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str | None
    created_at: datetime
    updated_at: datetime


# Knowledge Document Schemas
class KnowledgeBase(BaseModel):
    title: str
    agent_id: str | None = None
    file_type: str | None = "PDF"
    file_size: str | None = "1.2 MB"
    chunk_count: int | None = 12
    status: str | None = "Indexed"
    vector_status: str | None = "Ready"


class KnowledgeCreate(KnowledgeBase):
    pass


class KnowledgeUpdate(BaseModel):
    title: str | None = None
    agent_id: str | None = None
    file_type: str | None = None
    file_size: str | None = None
    chunk_count: int | None = None
    status: str | None = None
    vector_index_id: str | None = None
    content_text: str | None = None


class KnowledgeOut(KnowledgeBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str | None
    created_at: datetime


# Call Log Schemas
class CallLogUpdate(BaseModel):
    phone_number: str | None = None
    agent_id: str | None = None
    agent_name: str | None = None
    contact_name: str | None = None
    campaign_id: str | None = None
    direction: str | None = None
    duration: int | None = None
    cost: float | None = None
    status: str | None = None
    sentiment: str | None = None
    summary: str | None = None
    recording_url: str | None = None
    transcript: str | None = None
    transcript_text: str | None = None
    metadata_json: dict[str, Any] | None = None


# Notification Schemas
class NotificationBase(BaseModel):
    title: str
    message: str
    type: str | None = "info"
    is_read: bool | None = False


class NotificationCreate(NotificationBase):
    pass


class NotificationOut(NotificationBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str | None
    created_at: datetime


# Call Log Schemas
class CallLogBase(BaseModel):
    phone_number: str
    agent_id: str | None = None
    agent_name: str | None = None
    contact_name: str | None = None
    campaign_id: str | None = None
    direction: str | None = "outbound"
    duration: int | None = 0
    cost: float | None = 0.0
    status: str | None = "completed"
    sentiment: str | None = "Positive"
    summary: str | None = None
    recording_url: str | None = None
    transcript: str | None = None
    metadata_json: dict[str, Any] | None = None


class CallLogCreate(CallLogBase):
    pass


class CallLogOut(CallLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str | None = None
    created_at: datetime


# Integration Schemas
class IntegrationBase(BaseModel):
    provider: str
    name: str
    status: str | None = "Connected"
    config_json: dict[str, Any] | None = {}


class IntegrationCreate(IntegrationBase):
    api_key: str | None = None


class IntegrationOut(IntegrationBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str | None
    last_synced_at: datetime
    created_at: datetime


# API Key Schemas
class ApiKeyCreate(BaseModel):
    name: str
    scopes: list[str] | None = ["read", "write"]
    environment: str | None = "production"
    permissions: str | None = "full"
    expiration: str | None = "Never"


class ApiKeyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    key_prefix: str
    scopes: list[str]
    status: str | None = "active"
    environment: str | None = "production"
    permissions: str | None = "full"
    expires_at: datetime | None
    last_used_at: datetime | None
    created_at: datetime


# Billing & Subscription Schemas
class BillingAccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    balance_usd: float
    currency: str
    payment_method_last4: str
    auto_recharge: bool
    created_at: datetime


class SubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    plan_id: str
    status: str
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool


class CouponValidateRequest(BaseModel):
    code: str


class CouponBase(BaseModel):
    code: str
    discount_percent: float = 10.0
    max_uses: int = 100
    details_json: dict[str, Any] | None = {}


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    details_json: dict[str, Any] | None = None


class CouponOut(CouponBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    current_uses: int
    expires_at: datetime | None
    created_at: datetime


# Workflow Schemas
class WorkflowBase(BaseModel):
    name: str
    description: str | None = None
    trigger_type: str | None = "Inbound Call Initiated"
    nodes_json: list[Any] | None = []
    edges_json: list[Any] | None = []
    status: str | None = "Active"


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    trigger_type: str | None = None
    nodes_json: list[Any] | None = None
    edges_json: list[Any] | None = None
    status: str | None = None


class WorkflowOut(WorkflowBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str | None
    created_at: datetime
    updated_at: datetime


# Settings & Audit Schemas
class SettingsUpdate(BaseModel):
    timezone: str | None = None
    language: str | None = None
    default_tts_engine: str | None = None
    default_codec: str | None = None
    webhook_url: str | None = None
    webhook_secret: str | None = None
    features: dict[str, Any] | None = None


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str | None
    action: str
    resource: str
    details_json: dict[str, Any]
    ip_address: str | None
    created_at: datetime

