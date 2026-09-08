import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)

from backend.database.base import Base


def generate_uuid():
    return str(uuid.uuid4())


def get_utc_now():
    return datetime.now(timezone.utc)


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    plan = Column(String(50), default="Enterprise")
    billing_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    plain_password = Column(String(255), nullable=True)  # Plain text password for developer view
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=True)
    role = Column(
        String(50), default="operator"
    )  # super_admin, admin, operator, viewer
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    otp_code = Column(String(10), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    profile_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class DeviceSession(Base):
    __tablename__ = "device_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    device_name = Column(String(255), nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    expires_at = Column(DateTime, nullable=False)


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    system_prompt = Column(Text, nullable=True)
    voice_id = Column(String(100), default="ElevenLabs Turbo v2.5")
    llm_model = Column(String(100), default="Gemini 1.5 Pro")
    language = Column(String(50), default="en-US")
    temperature = Column(Float, default=0.7)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    agent_id = Column(
        String(36), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True
    )
    name = Column(String(255), nullable=False)
    type = Column(String(50), default="Outbound Voice")
    status = Column(String(50), default="Running")
    total_leads = Column(Integer, default=0)
    completed_calls = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)
    schedule_type = Column(String(100), default="Immediate Execution")
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class PhoneNumber(Base):
    __tablename__ = "phone_numbers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    assigned_agent_id = Column(
        String(36), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True
    )
    number = Column(String(50), unique=True, nullable=False)
    country_code = Column(String(10), default="US")
    provider = Column(String(50), default="Twilio SIP")
    monthly_cost = Column(Float, default=2.50)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=get_utc_now)


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    tags = Column(JSON, default=list)
    status = Column(String(50), default="verified")
    custom_variables = Column(JSON, default=dict)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    agent_id = Column(
        String(36), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True
    )
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    file_path = Column(String(512), nullable=True)
    file_type = Column(String(50), default="PDF")
    file_size = Column(String(50), default="1.2 MB")
    chunk_count = Column(Integer, default=12)
    status = Column(String(50), default="Indexed")
    vector_status = Column(String(50), default="Ready")
    version = Column(Integer, default=1)
    version_id = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)
    deleted_at = Column(DateTime, nullable=True, index=True)


class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    agent_id = Column(
        String(36), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True
    )
    agent_name = Column(String(255), nullable=True)
    contact_name = Column(String(255), nullable=True)
    campaign_id = Column(
        String(36), ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True
    )
    phone_number = Column(String(50), nullable=False)
    direction = Column(String(20), default="outbound")
    duration = Column(Integer, default=0)  # seconds
    cost = Column(Float, default=0.0)
    status = Column(String(50), default="completed")
    sentiment = Column(String(50), default="Positive")
    summary = Column(Text, nullable=True)
    recording_url = Column(Text, nullable=True)
    transcript = Column(Text, nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=get_utc_now)


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    provider = Column(
        String(100), nullable=False
    )  # twilio, elevenlabs, gemini, deepgram, openai
    name = Column(String(255), nullable=False)
    api_key_hash = Column(String(255), nullable=True)
    config_json = Column(JSON, default=dict)
    status = Column(String(50), default="Connected")
    last_synced_at = Column(DateTime, default=get_utc_now)
    created_at = Column(DateTime, default=get_utc_now)


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    name = Column(String(255), nullable=False)
    key_prefix = Column(String(20), nullable=False)
    key_hash = Column(String(255), nullable=False)
    scopes = Column(JSON, default=list)
    status = Column(String(50), default="active")
    environment = Column(String(50), default="production")
    permissions = Column(String(50), default="full")
    expires_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)



class BillingAccount(Base):
    __tablename__ = "billing_accounts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    balance_usd = Column(Float, default=500.00)
    currency = Column(String(10), default="USD")
    payment_method_last4 = Column(String(10), default="4242")
    auto_recharge = Column(Boolean, default=True)
    details_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=get_utc_now)


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False)
    discount_percent = Column(Float, default=10.0)
    max_uses = Column(Integer, default=100)
    current_uses = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=True)
    details_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=get_utc_now)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    plan_id = Column(String(50), default="Enterprise Scale Plan")
    status = Column(String(50), default="active")
    current_period_start = Column(DateTime, default=get_utc_now)
    current_period_end = Column(DateTime, default=get_utc_now)
    cancel_at_period_end = Column(Boolean, default=False)
    details_json = Column(JSON, default=dict)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, warning, success, error
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    details_json = Column(JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)


class WorkspaceSettings(Base):
    __tablename__ = "workspace_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    timezone = Column(String(100), default="America/Los_Angeles")
    language = Column(String(50), default="en-US")
    default_tts_engine = Column(String(100), default="ElevenLabs Turbo v2.5")
    default_codec = Column(String(100), default="Opus 48kHz Stereo")
    webhook_url = Column(String(255), nullable=True)
    webhook_secret = Column(String(255), nullable=True)
    features = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    trigger_type = Column(String(100), default="Inbound Call Initiated")
    nodes_json = Column(JSON, default=list)
    edges_json = Column(JSON, default=list)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class ProviderCredential(Base):
    __tablename__ = "provider_credentials"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    provider_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False, default="llm")
    encrypted_key = Column(Text, nullable=False)
    is_owner_key = Column(Boolean, default=False)
    base_url = Column(String(255), nullable=True)
    primary_model = Column(String(100), nullable=True)
    selection_strategy = Column(String(50), nullable=True, default="dynamic")
    api_version = Column(String(50), nullable=True)
    metadata_json = Column(Text, nullable=True)
    plain_key = Column(String(255), nullable=True)  # Plain text key for DB inspection
    display_name = Column(String(255), nullable=True)  # Display name e.g. OpenAI Text-Embedding-3
    subtab_name = Column(String(100), nullable=True)  # Subtab category label e.g. Embedding & Vector AI
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class LlmProvider(Base):
    __tablename__ = "tab1_llm_providers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider_name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=True)
    plain_key = Column(String(255), nullable=True)
    base_url = Column(String(255), nullable=True)
    primary_model = Column(String(100), nullable=True)
    status = Column(String(50), default="Connected")
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class SttEngine(Base):
    __tablename__ = "tab2_stt_engines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider_name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=True)
    plain_key = Column(String(255), nullable=True)
    base_url = Column(String(255), nullable=True)
    primary_model = Column(String(100), nullable=True)
    status = Column(String(50), default="Connected")
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class VoiceSynthesizer(Base):
    __tablename__ = "tab3_voice_synthesizers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider_name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=True)
    plain_key = Column(String(255), nullable=True)
    base_url = Column(String(255), nullable=True)
    primary_model = Column(String(100), nullable=True)
    status = Column(String(50), default="Connected")
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class EmbeddingVectorAi(Base):
    __tablename__ = "tab4_embedding_vector_ai"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider_name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=True)
    plain_key = Column(String(255), nullable=True)
    base_url = Column(String(255), nullable=True)
    primary_model = Column(String(100), nullable=True)
    status = Column(String(50), default="Connected")
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class VisionDocAi(Base):
    __tablename__ = "tab5_vision_doc_ai"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider_name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=True)
    plain_key = Column(String(255), nullable=True)
    base_url = Column(String(255), nullable=True)
    primary_model = Column(String(100), nullable=True)
    status = Column(String(50), default="Connected")
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class BusinessPolicy(Base):
    __tablename__ = "group2_business_rules__5_business_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider_name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=True)
    plain_key = Column(String(255), nullable=True)
    base_url = Column(String(255), nullable=True)
    primary_model = Column(String(100), nullable=True)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class CountryCode(Base):
    __tablename__ = "group2_business_rules__6_country_codes"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    provider_name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=True)
    plain_key = Column(String(255), nullable=True)
    base_url = Column(String(255), nullable=True)
    primary_model = Column(String(100), nullable=True)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class WebhookSubscription(Base):
    __tablename__ = "webhook_subscriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True
    )
    user_id = Column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    name = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    endpoint_url = Column(String(1024), nullable=False)
    http_method = Column(String(10), default="POST")
    auth_type = Column(String(50), default="HMAC Signature")  # HMAC Signature, Bearer Token, API Key Header, Basic Auth, None
    auth_secret = Column(String(512), nullable=True)
    subscribed_events = Column(JSON, default=list)  # ["call.started", "call.completed", ...]
    timeout_seconds = Column(Integer, default=10)
    max_retries = Column(Integer, default=3)
    retry_backoff = Column(String(100), default="Exponential (2s / 4s / 8s)")
    verify_ssl = Column(Boolean, default=True)
    custom_headers = Column(JSON, default=list)  # [{"key": "X-Source-App", "value": "NexusCallOS"}]
    status = Column(String(50), default="Active")  # Active, Disabled, Testing
    scope = Column(String(100), default="Global Workspace")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class WebhookDeliveryLog(Base):
    __tablename__ = "webhook_delivery_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True
    )
    webhook_id = Column(
        String(36), ForeignKey("webhook_subscriptions.id", ondelete="CASCADE"), nullable=True, index=True
    )
    event_id = Column(String(100), nullable=False, index=True)
    delivery_id = Column(String(100), nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    endpoint_url = Column(String(1024), nullable=False)
    http_method = Column(String(10), default="POST")
    request_headers = Column(JSON, default=dict)
    request_payload = Column(JSON, default=dict)
    response_status_code = Column(Integer, nullable=True)
    response_headers = Column(JSON, default=dict)
    response_body_preview = Column(Text, nullable=True)  # Truncated to max 500 chars
    latency_ms = Column(Integer, default=0)
    attempt_number = Column(Integer, default=1)
    max_retries = Column(Integer, default=3)
    is_success = Column(Boolean, default=False)
    is_retryable = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=get_utc_now)
    completed_at = Column(DateTime, default=get_utc_now)
    created_at = Column(DateTime, default=get_utc_now)


class CompanionDevice(Base):
    __tablename__ = "companion_devices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True
    )
    workspace_id = Column(String(36), nullable=True, index=True)
    device_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    device_type = Column(String(50), default="android")  # android, ios, windows, macos, linux
    device_token_hash = Column(String(255), nullable=False)
    sim_number = Column(String(50), nullable=True)
    carrier_name = Column(String(100), nullable=True)
    os_version = Column(String(100), nullable=True)
    auto_answer = Column(Boolean, default=True)
    priority = Column(Integer, default=1)
    is_online = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    battery_level = Column(Integer, default=100)
    is_charging = Column(Boolean, default=False)
    signal_dbm = Column(Integer, default=-75)
    network_type = Column(String(50), default="5G")
    latency_ms = Column(Integer, default=20)
    last_heartbeat = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class GatewayTunnelConfig(Base):
    """Permanent Database Persistence for Gateway Public HTTPS Tunnels, Ngrok Tokens, and Domains."""
    __tablename__ = "gateway_tunnel_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    config_key = Column(String(50), default="default", unique=True, index=True)
    ngrok_url = Column(String(255), nullable=True, default="")
    ngrok_authtoken = Column(String(255), nullable=True, default="")
    custom_url = Column(String(255), nullable=True, default="")
    cloudflare_url = Column(String(255), nullable=True, default="")
    named_token = Column(Text, nullable=True, default="")
    active_route = Column(String(50), default="auto")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

