export type ThemeMode = 'light' | 'dark';

export type ScreenId =
  | 'dashboard'
  | 'agents'
  | 'campaigns'
  | 'contacts'
  | 'phone-numbers'
  | 'knowledge-base'
  | 'storage'
  | 'file-storage'
  | 'recycle-bin'
  | 'trash'
  | 'call-history'
  | 'analytics'
  | 'workflows'
  | 'automation'
  | 'integrations'
  | 'billing'
  | 'api-keys'
  | 'settings'
  | 'profile'
  | 'notifications'
  | 'security'
  | 'activity'
  | 'logs'
  | 'help'
  | 'help-center'
  | 'auth'
  | '404'
  | '500'
  | 'empty'
  | 'empty-state-demo'
  | 'loading'
  | 'loading-state-demo'
  | 'maintenance'
  | 'offline'
  | 'unauthorized'
  | 'conversation-engine'
  | 'demo-studio'
  | 'android-gateway'
  | 'mobile-gateway'
  | 'memory'
  | 'agent-memory'
  | 'super-admin'
  | 'admin-hub'
  | 'session-expired';

export type AuthSubScreen =
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'recovery-otp'
  | 'otp'
  | 'verify-email'
  | 'reset-password';

export interface Agent {
  id: string;
  name: string;
  role: string;
  voice: string;
  llmModel: string;
  language: string;
  status: 'active' | 'idle' | 'paused' | 'draft';
  totalCalls: number;
  avgDuration: string;
  successRate: number;
  systemPrompt: string;
  temperature: number;
  maxDurationSeconds: number;
  updatedAt: string;
}

export interface CallLog {
  id: string;
  agentName: string;
  contactName: string;
  contactPhone: string;
  direction: 'inbound' | 'outbound';
  durationSeconds: number;
  status: 'completed' | 'failed' | 'busy' | 'no-answer' | 'voicemail';
  sentiment: 'positive' | 'neutral' | 'negative';
  cost: number;
  timestamp: string;
  summary: string;
  transcript: { speaker: 'AI' | 'User'; time: string; text: string }[];
  recordingUrl?: string;
  latencyMs: number;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'outbound' | 'inbound';
  status: 'running' | 'paused' | 'completed' | 'scheduled';
  agentName: string;
  agentId?: string;
  totalLeads: number;
  completedCalls: number;
  convertedLeads: number;
  startDate: string;
  scheduleWindow: string;
  description?: string;
  goal?: string;
  callerId?: string;
  telephonyProvider?: string;
  concurrencyLimit?: number;
  maxRetries?: number;
  retryIntervalMinutes?: number;
  audienceTag?: string;
  firstGreeting?: string;
  promptVariables?: string[];
  costPerLead?: number;
  successRate?: number;
  avgCallDurationSeconds?: number;
  failedCalls?: number;
  priority?: 'high' | 'normal' | 'low';
  industry?: string;
  knowledgeDocIds?: string[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  leadScore: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'unreachable';
  tags: string[];
  lastCalled?: string;
  custom_variables?: Record<string, any>;
}

export interface PhoneNumber {
  id: string;
  number: string;
  country: string;
  type: 'Toll-Free' | 'Local' | 'Mobile';
  assignedAgent?: string;
  status: 'active' | 'unassigned' | 'pending';
  monthlyFee: number;
  friendlyName?: string;
  connectivityType?: 'gsm_sim' | 'cloud_did' | 'sip_trunk' | 'whatsapp' | 'manual';
  carrier?: string;
  simSlot?: 'SIM 1' | 'SIM 2';
  deviceName?: string;
  deviceId?: string;
  batteryLevel?: number;
  signalStrength?: string;
  llmEngine?: string;
  voiceEngine?: string;
  kbDocId?: string;
  autoAnswer?: boolean;
  workingHours?: string;
  forwardNumber?: string;
  ivrEnabled?: boolean;
  recordingEnabled?: boolean;
  concurrencyLimit?: number;
  sipUri?: string;
  pingLatencyMs?: number;
  lastActive?: string;
  inboundCallsCount?: number;
  outboundCallsCount?: number;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  type: 'PDF' | 'TXT' | 'Web Page' | 'API Docs';
  size: string;
  chunks: number;
  status: 'indexed' | 'processing' | 'failed';
  lastSynced: string;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: 'enabled' | 'disabled';
  lastRun: string;
  executionsCount: number;
}

export interface Integration {
  id: string;
  name: string;
  category: 'CRM' | 'Telephony' | 'Voice' | 'Automation' | 'Analytics';
  icon: string;
  description: string;
  connected: boolean;
  statusText: string;
}

export interface AuditActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  ip: string;
  timestamp: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  component: string;
  message: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface CustomSocialChannel {
  id: string;
  platform: string;
  url: string;
  label?: string;
  icon?: string;
  customIconUrl?: string;
  color?: string;
  enabled: boolean;
  createdAt?: string;
}

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  timezone: string;
  language: string;
  address: string;
  bio: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  showSocialInUI?: boolean;
  socialPlacement?: string;
  socialDockSize?: 'compact' | 'regular' | 'large';
  socialDockTheme?: 'glass' | 'neon' | 'minimal' | 'gradient' | 'island';
  socialDockPosition?: 'bottom-right' | 'bottom-center' | 'bottom-left' | 'right-vertical';
  socialAnimation?: 'smooth-pop' | 'macos-magnify' | 'glow-pulse' | 'bounce';
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    youtube?: string;
    instagram?: string;
    discord?: string;
    whatsapp?: string;
    facebook?: string;
    tiktok?: string;
    telegram?: string;
    reddit?: string;
    threads?: string;
    pinterest?: string;
    twitch?: string;
    snapchat?: string;
    wechat?: string;
    line?: string;
    vk?: string;
    kakaotalk?: string;
    medium?: string;
    substack?: string;
    bluesky?: string;
    mastodon?: string;
    dribbble?: string;
    behance?: string;
    calendly?: string;
    spotify?: string;
    patreon?: string;
    gitlab?: string;
    stackoverflow?: string;
    viber?: string;
    [key: string]: string | undefined;
  };
  customSocialChannels?: CustomSocialChannel[];
  twoFactorEnabled: boolean;
  sessions: {
    id: string;
    device: string;
    location: string;
    ip: string;
    lastActive: string;
    current: boolean;
  }[];
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  applicablePlans: string[];
  maxUsage: number;
  perUserLimit: number;
  usageCount: number;
  expiryDate: string;
  active: boolean;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  fullSecret?: string;
  environment: 'production' | 'development' | 'testing';
  permissions: 'full' | 'read-only' | 'restricted';
  createdDate: string;
  lastUsed: string;
  expiration: string;
  status: 'active' | 'disabled';
  usageCalls: number;
}

export interface PaymentMethodItem {
  id: string;
  type: 'card' | 'upi' | 'netbanking' | 'paypal' | 'wallet' | 'apple_pay' | 'google_pay';
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
  holderName?: string;
  details?: string;
}

export interface SubscriptionPlan {
  id: string;
  plan_key?: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  lifetimePrice?: number;
  concurrencyLimit: number;
  includedMinutes: number;
  ragStorageMb?: number;
  maxAgentsCount?: number;
  gsmSimEnabled?: boolean;
  voiceCloningEnabled?: boolean;
  webhookApiEnabled?: boolean;
  prioritySlaEnabled?: boolean;
  features: string[];
  popular?: boolean;
  is_active?: boolean;
  sort_order?: number;
  // Visual Theme, Badge & Custom Code properties
  badge_text?: string;
  badge_color?: string;
  badge_icon?: string;
  accent_color?: string;
  cta_text?: string;
  cta_link?: string;
  cta_bg_color?: string;
  cta_text_color?: string;
  cta_icon?: string;
  custom_css?: string;
  custom_html?: string;
  gsm_label?: string;
  voice_cloning_label?: string;
  webhook_label?: string;
  sla_label?: string;
  voice_minutes_label?: string;
  concurrency_label?: string;
  rag_label?: string;
  bots_label?: string;
  sub_billing_text?: string;
  // Runtime Terminal & Telemetry Entitlements
  log_buffer_limit?: number;
  allow_log_export?: boolean;
  raw_telemetry_enabled?: boolean;
  log_retention_days?: number;
  live_terminal_label?: string;
  details_json?: Record<string, any>;
  // Snake_case aliases from backend
  monthly_price_usd?: number;
  yearly_price_usd?: number;
  lifetime_price_usd?: number;
  included_minutes?: number;
  concurrency_limit?: number;
  rag_storage_mb?: number;
  max_agents_count?: number;
  gsm_sim_enabled?: boolean;
  voice_cloning_enabled?: boolean;
  webhook_api_enabled?: boolean;
  priority_sla_enabled?: boolean;
  features_list?: string[];
  price?: {
    monthly: number;
    yearly: number;
    lifetime?: number;
  };
  limits?: {
    minutes: number;
    concurrency: number;
    agents?: number;
    ragStorageMb?: number;
  };
}

export interface CurrencyDataProvider {
  id: string;
  name: string;
  short_name: string;
  badge: string;
  is_default?: boolean;
  description: string;
  icon: string;
  endpoints?: string[];
}

export interface BillingCurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rate: number;
  country?: string;
  country_code?: string;
  is_live?: boolean;
  last_updated?: string;
  provider?: string;
  provider_name?: string;
}

export interface BillingInvoiceItem {
  id: string;
  invoice_number: string;
  date: string;
  customer_name?: string;
  customer_email?: string;
  customer_address?: string;
  tax_id?: string;
  plan_name: string;
  billing_cycle: string;
  currency: string;
  currency_symbol?: string;
  subtotal?: number;
  discount_amount?: number;
  tax_amount?: number;
  amount: string;
  total_amount: number;
  status: string;
  gateway?: string;
  billing_name?: string;
  billing_email?: string;
  created_at: string;
  notes?: string;
  details_json?: any;
}

export interface InvoiceTemplateSettings {
  company_name: string;
  company_tagline?: string;
  head_office_address: string;
  support_email: string;
  billing_email: string;
  support_phone?: string;
  company_website?: string;
  gstin: string;
  cin: string;
  sac_code: string;
  dot_license: string;
  tax_rate_percent: number;
  tax_name: string;
  place_of_supply?: string;
  jurisdiction?: string;
  authorized_signatory_name: string;
  authorized_signatory_title: string;
  terms_notes: string;
  footer_note?: string;
  logo_url?: string;
  icon_logo_url?: string;
  banner_logo_url?: string;
  logo_mode?: 'dual' | 'banner_only' | 'icon_only' | 'icon_with_text';
  icon_size?: number;
  logo_size?: number;
  logo_width?: number;
  logo_fit?: 'contain' | 'cover' | 'scale-down';
  logo_layout?: 'compact_lockup' | 'wide_banner' | 'centered';
  logo_position?: 'left' | 'center' | 'right' | 'split';
  signature_position?: 'right' | 'left' | 'center' | 'split';
  seal_position?: 'center' | 'right' | 'left' | 'signature_stamp';
  seal_url?: string;
  seal_size?: number;
  seal_rotation?: number;
  signature_url?: string;
  signature_font?: string;
  signature_size?: number;
  signature_rotation?: number;
  seal_text?: string;
  seal_badge_text?: string;
  primary_color?: string;
  accent_color?: string;
  font_family?: string;
  container_padding?: 'compact' | 'normal' | 'spacious' | string;
  container_padding_px?: number;
  padding_top_px?: number;
  padding_right_px?: number;
  padding_bottom_px?: number;
  padding_left_px?: number;
  padding_linked?: boolean;
  box_border_radius?: number;
  radius_top_left_px?: number;
  radius_top_right_px?: number;
  radius_bottom_right_px?: number;
  radius_bottom_left_px?: number;
  radius_linked?: boolean;
  table_density?: 'compact' | 'normal' | 'spacious' | string;
  table_padding_px?: number;
  table_border_style?: 'grid' | 'clean' | 'minimal';
  table_border_width_px?: number;
  table_border_color?: string;
  table_layout_mode?: 'grid' | 'striped' | 'minimal' | 'cards';
  header_theme_style?: 'standard' | 'colored_bar' | 'full_accent' | 'minimal';
  title_font_size?: number;
  company_font_size?: number;
  show_watermark?: boolean;
  watermark_text?: string;
  watermark_angle?: number;
  watermark_opacity?: number;
  show_qr_code?: boolean;
  show_hsn_sac?: boolean;
  show_tax_breakup_table?: boolean;
  invoice_title?: string;
  invoice_prefix?: string;
  bank_name?: string;
  bank_beneficiary?: string;
  bank_account_no?: string;
  bank_ifsc_swift?: string;
  vpa_address?: string;
}


export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  message?: string;
  time?: string;
  created_at?: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: 'telephony' | 'calls' | 'system' | 'billing' | 'security';
  sender_role?: string;
  is_super_admin?: boolean;
  is_broadcast?: boolean;
  read: boolean;
  is_read?: boolean;
  actionLabel?: string;
  actionUrl?: string;
  user_id?: string | null;
  user_email?: string | null;
  organization_id?: string | null;
  organization_name?: string | null;
}

export interface ExtractedFact {
  id: string;
  agent_id: string;
  category: 'caller_profile' | 'preference' | 'commitment' | 'objection' | 'business_rule' | 'general';
  fact: string;
  source_session_id?: string;
  confidence: number;
  created_at?: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
}

export interface SessionMemoryItem {
  id?: string;
  session_id: string;
  agent_id: string;
  agent_name: string;
  device_id: string;
  device_name: string;
  channel_type?: 'voice_call' | 'knowledge_base' | 'workflow' | 'demo_studio' | 'gsm_gateway' | 'multimodal_api';
  channel_label?: string;
  channel_badge?: string;
  channel_icon?: string;
  channel_color?: string;
  phone_number: string;
  caller_name: string;
  status: 'active' | 'completed' | 'paused';
  started_at: string;
  ended_at?: string | null;
  duration_sec: number;
  turn_count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
  recording_url?: string | null;
  entities: Array<{ key: string; value: any; confidence: number }>;
  key_points: string[];
  turns: Array<{ speaker: 'user' | 'assistant' | 'system'; text: string; turn: number; timestamp?: string; latency_ms?: number }>;
  is_deleted?: boolean;
  deleted_at?: string | null;
}

export interface AgentMemoryTabItem {
  id: string;
  name: string;
  role: string;
  voice_id?: string;
  icon?: string;
  category?: 'agent' | 'universal' | 'rag' | 'workflow' | 'studio' | 'gateway';
  total_sessions: number;
  active_sessions: number;
  total_facts: number;
  trashed_count: number;
}

export interface DateGroupedSessions {
  date_key: string;
  date_label: string;
  date_iso: string;
  sessions_count: number;
  sessions: SessionMemoryItem[];
}

export interface RecycleBinItem {
  id: string;
  item_type: 'session_memory' | 'agent_fact';
  session_id?: string;
  fact_id?: string;
  agent_id: string;
  agent_name: string;
  title: string;
  description: string;
  started_at?: string | null;
  deleted_at: string;
  details: any;
}

export interface AgentLifetimeMemory {
  agent_id: string;
  total_calls_attended: number;
  total_active_calls: number;
  total_facts_stored: number;
  unique_callers_count: number;
  unique_callers: Array<{
    phone_number: string;
    caller_name: string;
    last_call_at: string;
    total_calls: number;
    last_summary?: string;
  }>;
  facts: ExtractedFact[];
  recent_sessions: SessionMemoryItem[];
}

export interface MemoryRuleConfig {
  max_tokens: number;
  lru_depth: number;
  anti_repetition_strictness: number;
  auto_extract_entities: boolean;
  sync_cross_device: boolean;
  retention_days: number;
}


