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
  | 'session-expired';

export type AuthSubScreen =
  | 'login'
  | 'signup'
  | 'forgot-password'
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
  totalLeads: number;
  completedCalls: number;
  convertedLeads: number;
  startDate: string;
  scheduleWindow: string;
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
  socialLinks: {
    twitter: string;
    linkedin: string;
    github: string;
    website: string;
  };
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
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  lifetimePrice?: number;
  concurrencyLimit: number;
  includedMinutes: number;
  features: string[];
  popular?: boolean;
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
  read: boolean;
  is_read?: boolean;
  actionLabel?: string;
  actionUrl?: string;
  user_id?: string | null;
  organization_id?: string | null;
}

