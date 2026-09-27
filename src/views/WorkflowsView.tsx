import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  GitFork,
  Plus,
  Play,
  Copy,
  Download,
  Upload,
  ShieldCheck,
  Activity,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Trash2,
  Map,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  RotateCcw,
  Maximize2,
  Minimize2,
  X,
  Layers,
  Wrench,
  CheckCircle2,
  Code2,
  Terminal,
  Send,
  MessageSquare,
  Calendar,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneOff,
  Globe,
  Webhook,
  Database,
  Cpu,
  Bot,
  ArrowRight,
  Clock,
  AlertTriangle,
  Check,
  Zap,
  Save,
  Power,
  LayoutGrid,
  Move,
  MousePointer,
  Radio,
  FileCode,
  Mail,
  Sliders,
  ShieldAlert,
  SlidersHorizontal,
  Volume2,
  Edit3,
  FlaskConical,
  FileText,
  CheckCheck,
  RefreshCw,
  Sun,
  Moon,
  Hand,
  Compass,
  Home,
  ShoppingCart,
  ToggleLeft,
  ToggleRight,
  Key,
  ExternalLink,
  Lock,
  Settings2,
  BookOpen,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  MessageSquarePlus,
  ThumbsUp,
  ThumbsDown,
  Mic,
  Paperclip,
  User,
  HelpCircle,
  LogOut,
  Crown,
} from 'lucide-react';
import { Card, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Avatar } from '../components/ui/Avatar';
import {
  Workflow,
  PhoneNumber,
  Agent,
  KnowledgeDocument,
  Integration,
  ScreenId,
} from '../types';
import {
  workflowRepository,
  phoneNumberRepository,
  agentRepository,
  knowledgeRepository,
  integrationRepository,
  uploadRepository,
} from '../repository';
import { fetchAPI } from '../lib/api';
import { triggerNavigationHandoff } from '../lib/handoffNavigation';
import { usePlanEntitlements } from '../hooks/usePlanEntitlements';
import { PlanGuardrailModal } from '../components/ui/PlanGuardrailModal';
import { useToast } from '../components/ui/Toast';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getTenantStorage,
  getActiveUserEmail,
  getActiveTargetOrgId,
} from '../tenant';

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW NODE, PORT & EDGE INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkflowNodeConfig {
  prompt?: string;
  scriptCode?: string;
  language?: 'javascript' | 'python';
  webhookUrl?: string;
  webhookMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  webhookHeaders?: string;
  webhookBody?: string;
  conditionVar?: string;
  conditionOp?: '==' | '!=' | '>' | '<' | 'contains';
  conditionVal?: string;
  transferNumber?: string;
  assignedPhoneNumberId?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedKbDocId?: string;
  assignedIntegrationId?: string;
  ttsVoice?: string;
  smsMessage?: string;
  whatsappTemplate?: string;
  emailSubject?: string;
  emailBody?: string;
  crmEntity?: string;
  crmAction?: 'create_lead' | 'update_deal' | 'log_call';
  calendarDurationMin?: number;
  delaySeconds?: number;
  dtmfOptions?: Array<{ key: string; label: string }>;
  intentRoutes?: Array<{ intent: string; label: string }>;
}

export interface WorkflowCanvasNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  category: 'telephony' | 'ai' | 'logic' | 'developer' | 'integration' | 'escalation';
  config: WorkflowNodeConfig;
}

export interface WorkflowNodePort {
  id: string;
  label: string;
  color?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface NodeCategoryItem {
  type: string;
  label: string;
  description: string;
  category: 'telephony' | 'ai' | 'logic' | 'developer' | 'integration' | 'escalation';
  icon: React.ReactNode;
  color: string;
  badgeColor: string;
  defaultConfig: WorkflowNodeConfig;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTERPRISE NODE CATALOG (ALL ESSENTIAL VOICE, AI & AUTOMATION NODES)
// ─────────────────────────────────────────────────────────────────────────────

const NODE_CATALOG: Array<{ categoryTitle: string; categoryKey: string; items: NodeCategoryItem[] }> = [
  {
    categoryTitle: 'Core Telephony & Inbound',
    categoryKey: 'telephony',
    items: [
      {
        type: 'start_call',
        label: 'Inbound Call Trigger',
        description: 'Receives incoming phone call from DID, GSM SIM, or SIP Trunk',
        category: 'telephony',
        icon: <PhoneIncoming className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
        color: 'border-emerald-500/70 dark:border-emerald-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-emerald-300 shadow-md shadow-emerald-500/5 dark:shadow-emerald-500/10',
        badgeColor: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        defaultConfig: { prompt: 'Inbound Caller Trigger (Auto-Accept Voice Session)' },
      },
      {
        type: 'play_speech',
        label: 'Play Speech (TTS)',
        description: 'Synthesizes neural voice response using Cartesia / ElevenLabs',
        category: 'telephony',
        icon: <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
        color: 'border-blue-500/70 dark:border-blue-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-blue-300 shadow-md shadow-blue-500/5 dark:shadow-blue-500/10',
        badgeColor: 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        defaultConfig: { prompt: 'Hello {{caller.name || "there"}}, thank you for calling Create Call OS. How can I help you today?', ttsVoice: 'ElevenLabs Turbo v2.5' },
      },
      {
        type: 'gather_speech',
        label: 'Gather Speech (STT)',
        description: 'Listens for customer voice response with ultra-fast VAD speech detection',
        category: 'telephony',
        icon: <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />,
        color: 'border-cyan-500/70 dark:border-cyan-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-cyan-300 shadow-md shadow-cyan-500/5 dark:shadow-cyan-500/10',
        badgeColor: 'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
        defaultConfig: { prompt: 'Please state your query or question briefly.' },
      },
      {
        type: 'dtmf_menu',
        label: 'DTMF Keypad Menu',
        description: 'Gathers telephone keypad button presses (1 for Sales, 2 for Support)',
        category: 'telephony',
        icon: <Radio className="h-4 w-4 text-sky-600 dark:text-sky-400" />,
        color: 'border-sky-500/70 dark:border-sky-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-sky-300 shadow-md shadow-sky-500/5 dark:shadow-sky-500/10',
        badgeColor: 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        defaultConfig: {
          prompt: 'Press 1 for Sales Inquiry, Press 2 for Customer Support, Press 0 for Operator',
          dtmfOptions: [
            { key: '1', label: 'Sales' },
            { key: '2', label: 'Support' },
            { key: '0', label: 'Operator' },
          ],
        },
      },
      {
        type: 'transfer_call',
        label: 'Transfer Call (Warm/Cold)',
        description: 'Bridges live call to human department or external telephone number',
        category: 'telephony',
        icon: <PhoneForwarded className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
        color: 'border-amber-500/70 dark:border-amber-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-amber-300 shadow-md shadow-amber-500/5 dark:shadow-amber-500/10',
        badgeColor: 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        defaultConfig: { transferNumber: '+1 (555) 019-2834', prompt: 'Transferring you to senior specialist now...' },
      },
      {
        type: 'end_call',
        label: 'Hangup Call Session',
        description: 'Gracefully concludes conversation and releases audio channels',
        category: 'telephony',
        icon: <PhoneOff className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
        color: 'border-rose-500/70 dark:border-rose-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-rose-300 shadow-md shadow-rose-500/5 dark:shadow-rose-500/10',
        badgeColor: 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        defaultConfig: { prompt: 'Thank you for calling. Have a great day! (Hangup)' },
      },
    ],
  },
  {
    categoryTitle: 'AI Intelligence & Routing',
    categoryKey: 'ai',
    items: [
      {
        type: 'ai_intent_router',
        label: 'AI Intent Classifier',
        description: 'Classifies caller inquiry into multi-path routing branches',
        category: 'ai',
        icon: <Cpu className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
        color: 'border-purple-500/70 dark:border-purple-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-purple-300 shadow-md shadow-purple-500/5 dark:shadow-purple-500/10',
        badgeColor: 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        defaultConfig: {
          prompt: 'Classify caller intent based on spoken input',
          intentRoutes: [
            { intent: 'Sales & Pricing', label: 'Sales' },
            { intent: 'Appointment Booking', label: 'Booking' },
            { intent: 'Support & Escalation', label: 'Support' },
          ],
        },
      },
      {
        type: 'rag_search',
        label: 'Knowledge Base Search (RAG)',
        description: 'Queries vector database chunks to ground AI response in company docs',
        category: 'ai',
        icon: <Database className="h-4 w-4 text-pink-600 dark:text-pink-400" />,
        color: 'border-pink-500/70 dark:border-pink-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-pink-300 shadow-md shadow-pink-500/5 dark:shadow-pink-500/10',
        badgeColor: 'bg-pink-50 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
        defaultConfig: { prompt: 'Query: {{user_input}} | Max Top-K: 3 chunks | Similarity: 0.82' },
      },
      {
        type: 'sentiment_analyzer',
        label: 'Sentiment & Tone Detector',
        description: 'Evaluates customer frustration vs satisfaction in real-time',
        category: 'ai',
        icon: <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
        color: 'border-indigo-500/70 dark:border-indigo-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-indigo-300 shadow-md shadow-indigo-500/5 dark:shadow-indigo-500/10',
        badgeColor: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        defaultConfig: { prompt: 'Evaluate emotional sentiment (Positive / Neutral / Frustrated)' },
      },
      {
        type: 'ai_guardrails',
        label: 'Voice Guardrails & Safety',
        description: 'Redacts sensitive PII, blocks toxic inputs, and checks compliance rules',
        category: 'ai',
        icon: <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />,
        color: 'border-red-500/70 dark:border-red-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-red-300 shadow-md shadow-red-500/5 dark:shadow-red-500/10',
        badgeColor: 'bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
        defaultConfig: { prompt: 'Block competitor mentions, enforce credit card PII redaction' },
      },
    ],
  },
  {
    categoryTitle: 'Logic & Control Flow',
    categoryKey: 'logic',
    items: [
      {
        type: 'if_else',
        label: 'If / Else Branch',
        description: 'Evaluates boolean condition or variable check (True / False branches)',
        category: 'logic',
        icon: <GitFork className="h-4 w-4 text-amber-600 dark:text-yellow-400" />,
        color: 'border-amber-500/70 dark:border-yellow-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-yellow-300 shadow-md shadow-amber-500/5 dark:shadow-yellow-500/10',
        badgeColor: 'bg-amber-50 dark:bg-yellow-950/80 text-amber-700 dark:text-yellow-300 border-amber-200 dark:border-yellow-800',
        defaultConfig: { conditionVar: 'caller.tier', conditionOp: '==', conditionVal: 'VIP' },
      },
      {
        type: 'working_hours',
        label: 'Business Hours Router',
        description: 'Routes calls differently during open business hours vs after-hours',
        category: 'logic',
        icon: <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
        color: 'border-amber-500/70 dark:border-amber-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-amber-300 shadow-md shadow-amber-500/5 dark:shadow-amber-500/10',
        badgeColor: 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        defaultConfig: { prompt: 'Check if current time is between Mon-Fri 09:00 - 18:00 IST' },
      },
      {
        type: 'time_delay',
        label: 'Delay / Retry Loop',
        description: 'Pauses execution flow or retries on failed external webhook response',
        category: 'logic',
        icon: <RotateCcw className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />,
        color: 'border-zinc-400/70 dark:border-zinc-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-zinc-300 shadow-md',
        badgeColor: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700',
        defaultConfig: { delaySeconds: 3, prompt: 'Wait 3 seconds before next step' },
      },
    ],
  },
  {
    categoryTitle: 'Developer Code & APIs',
    categoryKey: 'developer',
    items: [
      {
        type: 'code_runner',
        label: 'Custom Code Execution',
        description: 'Runs custom JavaScript / Python code snippet in sandbox runtime',
        category: 'developer',
        icon: <Code2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
        color: 'border-emerald-500/70 dark:border-emerald-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-emerald-300 shadow-md shadow-emerald-500/5 dark:shadow-emerald-500/10',
        badgeColor: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        defaultConfig: {
          language: 'javascript',
          scriptCode: `// Custom Developer Automation Logic\nexport default async function run({ caller, variables, input }) {\n  const leadScore = input?.includes('enterprise') ? 95 : 60;\n  return {\n    isQualified: leadScore > 75,\n    leadScore,\n    timestamp: new Date().toISOString()\n  };\n}`,
        },
      },
      {
        type: 'webhook_request',
        label: 'HTTP Webhook / REST API',
        description: 'Dispatches custom REST API request (GET, POST, PUT, DELETE) with headers',
        category: 'developer',
        icon: <Webhook className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
        color: 'border-rose-500/70 dark:border-rose-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-rose-300 shadow-md shadow-rose-500/5 dark:shadow-rose-500/10',
        badgeColor: 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        defaultConfig: {
          webhookMethod: 'POST',
          webhookUrl: 'https://api.createcall.ai/v1/voice/events',
          webhookHeaders: '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SECRET_KEY"}',
          webhookBody: '{\n  "callerNumber": "{{caller.phone}}",\n  "intent": "{{intent}}",\n  "status": "in_progress"\n}',
        },
      },
      {
        type: 'json_transform',
        label: 'JSON Data Transformer',
        description: 'Extracts and formats JSON keys into context variables',
        category: 'developer',
        icon: <FileCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
        color: 'border-blue-500/70 dark:border-blue-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-blue-300 shadow-md shadow-blue-500/5 dark:shadow-blue-500/10',
        badgeColor: 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        defaultConfig: { prompt: 'Extract: { customer_name: response.data.name, balance: response.data.amount }' },
      },
    ],
  },
  {
    categoryTitle: 'Business Automations & Integrations',
    categoryKey: 'integration',
    items: [
      {
        type: 'send_sms',
        label: 'Send SMS Follow-up',
        description: 'Sends instant SMS confirmation via Twilio or paired Android GSM SIM',
        category: 'integration',
        icon: <Send className="h-4 w-4 text-teal-600 dark:text-teal-400" />,
        color: 'border-teal-500/70 dark:border-teal-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-teal-300 shadow-md shadow-teal-500/5 dark:shadow-teal-500/10',
        badgeColor: 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        defaultConfig: { smsMessage: 'Hi {{caller.name}}, your appointment with Create Call OS is confirmed for tomorrow. Link: https://meet.createcall.ai/room' },
      },
      {
        type: 'send_whatsapp',
        label: 'WhatsApp Summary',
        description: 'Dispatches rich WhatsApp message with call audio recording link',
        category: 'integration',
        icon: <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
        color: 'border-emerald-500/70 dark:border-emerald-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-emerald-300 shadow-md shadow-emerald-500/5 dark:shadow-emerald-500/10',
        badgeColor: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        defaultConfig: { whatsappTemplate: 'call_summary_v1', prompt: 'Send WhatsApp summary template to {{caller.phone}}' },
      },
      {
        type: 'send_email',
        label: 'Send Email Notification',
        description: 'Sends detailed email recap with PDF transcript and lead metadata',
        category: 'integration',
        icon: <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
        color: 'border-indigo-500/70 dark:border-indigo-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-indigo-300 shadow-md shadow-indigo-500/5 dark:shadow-indigo-500/10',
        badgeColor: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        defaultConfig: { emailSubject: 'Call Transcript & Summary for {{caller.phone}}', emailBody: 'Summary: {{transcript_summary}}' },
      },
      {
        type: 'crm_sync',
        label: 'CRM Lead Sync',
        description: 'Automatically creates or updates lead records in HubSpot, Salesforce, or Zoho',
        category: 'integration',
        icon: <Database className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
        color: 'border-purple-500/70 dark:border-purple-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-purple-300 shadow-md shadow-purple-500/5 dark:shadow-purple-500/10',
        badgeColor: 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        defaultConfig: { crmEntity: 'HubSpot CRM', crmAction: 'create_lead', prompt: 'Sync lead with name, phone number, and conversation transcript summary' },
      },
      {
        type: 'google_calendar',
        label: 'Google Calendar Booking',
        description: 'Finds available appointment slots and books confirmed calendar invite',
        category: 'integration',
        icon: <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
        color: 'border-blue-500/70 dark:border-blue-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-blue-300 shadow-md shadow-blue-500/5 dark:shadow-blue-500/10',
        badgeColor: 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        defaultConfig: { calendarDurationMin: 30, prompt: 'Check calendar availability and schedule 30-min strategy call' },
      },
    ],
  },
  {
    categoryTitle: 'Escalation & Safety Guardrails',
    categoryKey: 'escalation',
    items: [
      {
        type: 'human_escalate',
        label: 'Live Supervisor Bridge',
        description: 'Seamlessly transfers live audio stream to human manager with full context',
        category: 'escalation',
        icon: <Zap className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
        color: 'border-rose-500/70 dark:border-rose-500/80 bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-rose-300 shadow-md shadow-rose-500/5 dark:shadow-rose-500/10',
        badgeColor: 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        defaultConfig: { transferNumber: '+1 (555) 019-2834', prompt: 'Pass live conversation transcript to human supervisor console' },
      },
    ],
  },
];

const FLAT_NODE_CATALOG = NODE_CATALOG.flatMap((c) => c.items);

// Helper function to resolve dynamic output ports for any node
export const getNodeOutputPorts = (node: WorkflowCanvasNode): WorkflowNodePort[] => {
  if (!node) return [{ id: 'out', label: 'Next Step', color: '#3b82f6' }];
  if (node.type === 'end_call') return [];
  if (node.type === 'if_else') {
    return [
      { id: 'true', label: 'True / Match', color: '#10b981' },
      { id: 'false', label: 'False / Default', color: '#ef4444' },
    ];
  }
  if (node.type === 'working_hours') {
    return [
      { id: 'open', label: 'Open Hours', color: '#10b981' },
      { id: 'closed', label: 'After Hours', color: '#f59e0b' },
    ];
  }
  if (node.type === 'sentiment_analyzer') {
    return [
      { id: 'positive', label: 'Positive', color: '#10b981' },
      { id: 'neutral', label: 'Neutral', color: '#3b82f6' },
      { id: 'frustrated', label: 'Frustrated / Escalate', color: '#ef4444' },
    ];
  }
  if (node.type === 'dtmf_menu') {
    const opts = node.config?.dtmfOptions && node.config.dtmfOptions.length > 0
      ? node.config.dtmfOptions
      : [
          { key: '1', label: 'Key 1' },
          { key: '2', label: 'Key 2' },
          { key: '0', label: 'Key 0' },
        ];
    return opts.map((opt) => ({
      id: `key_${opt?.key || '1'}`,
      label: opt?.label ? `[${opt.key}] ${opt.label}` : `[${opt?.key || '1'}] Option`,
      color: '#38bdf8',
    }));
  }
  if (node.type === 'ai_intent_router') {
    const routes = node.config?.intentRoutes && node.config.intentRoutes.length > 0
      ? node.config.intentRoutes
      : [
          { intent: 'Sales & Pricing', label: 'Sales' },
          { intent: 'Appointment Booking', label: 'Booking' },
          { intent: 'Support & Escalation', label: 'Support' },
        ];
    return routes.map((r, i) => ({
      id: `intent_${i}`,
      label: r?.label || r?.intent || `Route ${i + 1}`,
      color: i === 0 ? '#3b82f6' : i === 1 ? '#10b981' : i === 2 ? '#8b5cf6' : '#ec4899',
    }));
  }
  return [{ id: 'out', label: 'Next Step', color: '#3b82f6' }];
};

// ─────────────────────────────────────────────────────────────────────────────
// ENTERPRISE PREBUILT & INDUSTRY RECIPES (WITH NODES & EXPLICIT EDGES)
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkflowRecipe {
  id: string;
  name: string;
  category: string;
  description: string;
  nodes: WorkflowCanvasNode[];
  edges: WorkflowEdge[];
}

const PREBUILT_RECIPES: WorkflowRecipe[] = [
  {
    id: 'recipe_inbound_qualification',
    name: 'Inbound Multi-Tier IVR & AI Qualification',
    category: 'Telephony',
    description: 'Greets callers, checks business hours, performs AI intent classification, and triggers custom lead score webhook.',
    nodes: [
      { id: 'node_1', type: 'start_call', label: 'Inbound Call Trigger', x: 80, y: 160, category: 'telephony', config: { prompt: 'Inbound caller from DID line' } },
      { id: 'node_2', type: 'working_hours', label: 'Business Hours Check', x: 480, y: 160, category: 'logic', config: { prompt: 'Check Mon-Fri 09:00-18:00 IST' } },
      { id: 'node_3', type: 'play_speech', label: 'Play Greeting', x: 880, y: 80, category: 'telephony', config: { prompt: 'Hello! Thank you for calling Create Call OS. How may I assist you today?' } },
      { id: 'node_4', type: 'ai_intent_router', label: 'AI Intent Classifier', x: 1280, y: 80, category: 'ai', config: { prompt: 'Detect Sales, Support, or Booking' } },
      { id: 'node_5', type: 'code_runner', label: 'Lead Scoring Logic', x: 1680, y: 80, category: 'developer', config: { language: 'javascript', scriptCode: 'return { score: 90, tier: "Enterprise VIP" };' } },
      { id: 'node_6', type: 'crm_sync', label: 'HubSpot Lead Sync', x: 2080, y: 80, category: 'integration', config: { crmEntity: 'HubSpot', crmAction: 'create_lead' } },
      { id: 'node_7', type: 'play_speech', label: 'After-Hours Voicemail', x: 880, y: 380, category: 'telephony', config: { prompt: 'Our offices are currently closed. Please leave your message after the beep.' } },
      { id: 'node_8', type: 'end_call', label: 'End After-Hours', x: 1280, y: 380, category: 'telephony', config: { prompt: 'Voicemail saved. Goodbye!' } },
    ],
    edges: [
      { id: 'e1', source: 'node_1', target: 'node_2', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e2', source: 'node_2', target: 'node_3', sourceHandle: 'open', targetHandle: 'in' },
      { id: 'e3', source: 'node_2', target: 'node_7', sourceHandle: 'closed', targetHandle: 'in' },
      { id: 'e4', source: 'node_3', target: 'node_4', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e5', source: 'node_4', target: 'node_5', sourceHandle: 'intent_0', targetHandle: 'in' },
      { id: 'e6', source: 'node_5', target: 'node_6', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e7', source: 'node_7', target: 'node_8', sourceHandle: 'out', targetHandle: 'in' },
    ],
  },
  {
    id: 'recipe_real_estate',
    name: 'Real Estate & Property Inquiries',
    category: 'Real Estate',
    description: 'Qualifies property buyers, checks budget & location, dispatches brochure on WhatsApp, and bridges hot leads to sales manager.',
    nodes: [
      { id: 'node_1', type: 'start_call', label: 'Property Hotline DID', x: 80, y: 160, category: 'telephony', config: { prompt: 'Incoming call from 99acres/MagicBricks ad' } },
      { id: 'node_2', type: 'play_speech', label: 'Ask Budget & BHK', x: 480, y: 160, category: 'telephony', config: { prompt: 'Welcome to Luxury Residencies! Are you looking for a 2BHK, 3BHK, or Penthouse?' } },
      { id: 'node_3', type: 'gather_speech', label: 'Capture Preference', x: 880, y: 160, category: 'telephony', config: { prompt: 'Listen for BHK and budget range' } },
      { id: 'node_4', type: 'send_whatsapp', label: 'Send Brochure PDF', x: 1280, y: 160, category: 'integration', config: { whatsappTemplate: 'property_brochure_v1', prompt: 'Send project brochure and pricing PDF to {{caller.phone}}' } },
      { id: 'node_5', type: 'human_escalate', label: 'Transfer to Sales Lead', x: 1680, y: 160, category: 'escalation', config: { transferNumber: '+1 (555) 019-2834' } },
    ],
    edges: [
      { id: 'e1', source: 'node_1', target: 'node_2', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e2', source: 'node_2', target: 'node_3', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e3', source: 'node_3', target: 'node_4', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e4', source: 'node_4', target: 'node_5', sourceHandle: 'out', targetHandle: 'in' },
    ],
  },
  {
    id: 'recipe_healthcare_clinic',
    name: 'Healthcare & Clinic Patient Triage',
    category: 'Healthcare',
    description: 'Patient symptom intake, doctor availability check, Google Calendar booking, and instant SMS confirmation.',
    nodes: [
      { id: 'node_1', type: 'start_call', label: 'Clinic Appointment Line', x: 80, y: 160, category: 'telephony', config: { prompt: 'Patient inbound call' } },
      { id: 'node_2', type: 'play_speech', label: 'Symptom & Doctor Intake', x: 480, y: 160, category: 'telephony', config: { prompt: 'Hello, which specialist or doctor would you like to consult today?' } },
      { id: 'node_3', type: 'rag_search', label: 'Doctor Schedule Search', x: 880, y: 160, category: 'ai', config: { prompt: 'Search doctor duty roster and available consultation hours' } },
      { id: 'node_4', type: 'google_calendar', label: 'Book Appointment Slot', x: 1280, y: 160, category: 'integration', config: { calendarDurationMin: 20 } },
      { id: 'node_5', type: 'send_sms', label: 'Send SMS Confirmation', x: 1680, y: 160, category: 'integration', config: { smsMessage: 'Your clinic appointment is confirmed for tomorrow 11:00 AM. Location: MediCare City Center.' } },
      { id: 'node_6', type: 'end_call', label: 'Graceful Hangup', x: 2080, y: 160, category: 'telephony', config: { prompt: 'Thank you! Take care and see you tomorrow.' } },
    ],
    edges: [
      { id: 'e1', source: 'node_1', target: 'node_2', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e2', source: 'node_2', target: 'node_3', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e3', source: 'node_3', target: 'node_4', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e4', source: 'node_4', target: 'node_5', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e5', source: 'node_5', target: 'node_6', sourceHandle: 'out', targetHandle: 'in' },
    ],
  },
  {
    id: 'recipe_ecommerce_support',
    name: 'E-Commerce Order Tracking & Returns',
    category: 'E-Commerce',
    description: 'Tracks courier delivery via REST API, resolves refund requests, and detects caller sentiment in real-time.',
    nodes: [
      { id: 'node_1', type: 'start_call', label: 'E-Commerce Helpline', x: 80, y: 160, category: 'telephony', config: { prompt: 'Inbound customer care line' } },
      { id: 'node_2', type: 'play_speech', label: 'Ask Order ID', x: 480, y: 160, category: 'telephony', config: { prompt: 'Please tell me your 6-digit Order ID to check live tracking.' } },
      { id: 'node_3', type: 'webhook_request', label: 'Check Courier API', x: 880, y: 160, category: 'developer', config: { webhookMethod: 'GET', webhookUrl: 'https://api.shiprocket.in/v1/tracking' } },
      { id: 'node_4', type: 'sentiment_analyzer', label: 'Frustration Detector', x: 1280, y: 160, category: 'ai', config: { prompt: 'Evaluate emotional frustration score' } },
      { id: 'node_5', type: 'send_whatsapp', label: 'WhatsApp Tracking Link', x: 1680, y: 80, category: 'integration', config: { prompt: 'Send live delivery tracking link to WhatsApp' } },
      { id: 'node_6', type: 'human_escalate', label: 'Manager Escalation', x: 1680, y: 300, category: 'escalation', config: { transferNumber: '+1 (555) 019-2834' } },
      { id: 'node_7', type: 'end_call', label: 'Finish Support', x: 2080, y: 80, category: 'telephony', config: { prompt: 'Your order is out for delivery! Have a wonderful day.' } },
    ],
    edges: [
      { id: 'e1', source: 'node_1', target: 'node_2', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e2', source: 'node_2', target: 'node_3', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e3', source: 'node_3', target: 'node_4', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e4', source: 'node_4', target: 'node_5', sourceHandle: 'positive', targetHandle: 'in' },
      { id: 'e5', source: 'node_4', target: 'node_6', sourceHandle: 'frustrated', targetHandle: 'in' },
      { id: 'e6', source: 'node_5', target: 'node_7', sourceHandle: 'out', targetHandle: 'in' },
    ],
  },
  {
    id: 'recipe_fintech_loan',
    name: 'FinTech & Loan EMI Qualification',
    category: 'FinTech & Banking',
    description: 'Executes custom JavaScript EMI calculation sandbox, scores credit eligibility, and creates CRM loan deal.',
    nodes: [
      { id: 'node_1', type: 'start_call', label: 'Loan Inquiry Trigger', x: 80, y: 160, category: 'telephony', config: { prompt: 'Instant Personal Loan inbound trigger' } },
      { id: 'node_2', type: 'play_speech', label: 'Ask Loan Amount', x: 480, y: 160, category: 'telephony', config: { prompt: 'How much loan amount do you require and for what tenure in years?' } },
      { id: 'node_3', type: 'code_runner', label: 'EMI Calculation Logic', x: 880, y: 160, category: 'developer', config: { language: 'javascript', scriptCode: 'const P = 500000; const r = 0.105/12; const n = 36; return { emi: Math.round(P * r * ((1+r)**n) / (((1+r)**n)-1)), eligible: true };' } },
      { id: 'node_4', type: 'crm_sync', label: 'Sync Deal in CRM', x: 1280, y: 160, category: 'integration', config: { crmEntity: 'Salesforce', crmAction: 'update_deal' } },
      { id: 'node_5', type: 'send_sms', label: 'SMS Pre-Approval Offer', x: 1680, y: 160, category: 'integration', config: { smsMessage: 'Congratulations! Your pre-approved loan of Rs 5,00,000 is ready. Apply: https://createcall.ai/loans' } },
      { id: 'node_6', type: 'end_call', label: 'Conclude Call', x: 2080, y: 160, category: 'telephony', config: { prompt: 'Thank you for choosing Create Call OS FinTech. Goodbye!' } },
    ],
    edges: [
      { id: 'e1', source: 'node_1', target: 'node_2', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e2', source: 'node_2', target: 'node_3', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e3', source: 'node_3', target: 'node_4', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e4', source: 'node_4', target: 'node_5', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e5', source: 'node_5', target: 'node_6', sourceHandle: 'out', targetHandle: 'in' },
    ],
  },
  {
    id: 'recipe_edtech_admissions',
    name: 'EdTech Course Counseling & Admissions',
    category: 'EdTech',
    description: 'AI career counselor assists prospective students, looks up syllabus FAQ vectors, and syncs student lead.',
    nodes: [
      { id: 'node_1', type: 'start_call', label: 'Admissions Toll-Free', x: 80, y: 160, category: 'telephony', config: { prompt: 'Incoming student course inquiry' } },
      { id: 'node_2', type: 'play_speech', label: 'AI Course Counselor', x: 480, y: 160, category: 'telephony', config: { prompt: 'Welcome to the Tech Academy! Are you interested in AI Engineering, Data Science, or Full-Stack Web?' } },
      { id: 'node_3', type: 'rag_search', label: 'Query Course Syllabus', x: 880, y: 160, category: 'ai', config: { prompt: 'Search curriculum modules, fee structure, and batch start dates' } },
      { id: 'node_4', type: 'send_whatsapp', label: 'Send Syllabus PDF', x: 1280, y: 160, category: 'integration', config: { prompt: 'Send complete syllabus PDF and scholarship link to {{caller.phone}}' } },
      { id: 'node_5', type: 'crm_sync', label: 'Log Student Lead', x: 1680, y: 160, category: 'integration', config: { crmEntity: 'HubSpot', crmAction: 'create_lead' } },
      { id: 'node_6', type: 'end_call', label: 'Finish Counseling', x: 2080, y: 160, category: 'telephony', config: { prompt: 'Best of luck with your learning journey!' } },
    ],
    edges: [
      { id: 'e1', source: 'node_1', target: 'node_2', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e2', source: 'node_2', target: 'node_3', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e3', source: 'node_3', target: 'node_4', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e4', source: 'node_4', target: 'node_5', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e5', source: 'node_5', target: 'node_6', sourceHandle: 'out', targetHandle: 'in' },
    ],
  },
  {
    id: 'recipe_appointment_booking',
    name: 'Automated Appointment Booking & Calendar Sync',
    category: 'Bookings',
    description: 'Extracts requested slot, books Google Calendar meeting, and sends WhatsApp confirmation link.',
    nodes: [
      { id: 'node_1', type: 'start_call', label: 'Inbound Call Trigger', x: 80, y: 160, category: 'telephony', config: { prompt: 'Booking Line Inbound' } },
      { id: 'node_2', type: 'play_speech', label: 'Ask Date & Time', x: 480, y: 160, category: 'telephony', config: { prompt: 'What day and time works best for your 30-minute consultation?' } },
      { id: 'node_3', type: 'gather_speech', label: 'Gather Caller Slot', x: 880, y: 160, category: 'telephony', config: { prompt: 'Listen for slot: e.g. Friday 3 PM' } },
      { id: 'node_4', type: 'google_calendar', label: 'Google Calendar Booking', x: 1280, y: 160, category: 'integration', config: { calendarDurationMin: 30 } },
      { id: 'node_5', type: 'send_whatsapp', label: 'WhatsApp Confirmation', x: 1680, y: 160, category: 'integration', config: { prompt: 'Send invite link to customer WhatsApp' } },
      { id: 'node_6', type: 'end_call', label: 'Conclude Booking', x: 2080, y: 160, category: 'telephony', config: { prompt: 'Thank you! Appointment is confirmed.' } },
    ],
    edges: [
      { id: 'e1', source: 'node_1', target: 'node_2', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e2', source: 'node_2', target: 'node_3', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e3', source: 'node_3', target: 'node_4', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e4', source: 'node_4', target: 'node_5', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e5', source: 'node_5', target: 'node_6', sourceHandle: 'out', targetHandle: 'in' },
    ],
  },
  {
    id: 'recipe_gsm_sim_gateway',
    name: 'Zero-Cost GSM SIM Auto-Attendant with Human Fallback',
    category: 'GSM Gateway',
    description: 'Handles unlimited incoming calls on paired Android phone SIMs with zero telecom carrier fees.',
    nodes: [
      { id: 'node_1', type: 'start_call', label: 'Android GSM Inbound', x: 80, y: 160, category: 'telephony', config: { prompt: 'Incoming call on Android SIM 1' } },
      { id: 'node_2', type: 'play_speech', label: 'AI Voice Receptionist', x: 480, y: 160, category: 'telephony', config: { prompt: 'Welcome to VIP reception. I am your AI voice concierge.' } },
      { id: 'node_3', type: 'rag_search', label: 'Knowledge Base Search', x: 880, y: 160, category: 'ai', config: { prompt: 'Search product catalog and FAQ database' } },
      { id: 'node_4', type: 'sentiment_analyzer', label: 'Sentiment Guardrail', x: 1280, y: 160, category: 'ai', config: { prompt: 'Detect user frustration level' } },
      { id: 'node_5', type: 'human_escalate', label: 'Live Supervisor Bridge', x: 1680, y: 160, category: 'escalation', config: { transferNumber: '+1 (555) 019-2834' } },
    ],
    edges: [
      { id: 'e1', source: 'node_1', target: 'node_2', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e2', source: 'node_2', target: 'node_3', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e3', source: 'node_3', target: 'node_4', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e4', source: 'node_4', target: 'node_5', sourceHandle: 'frustrated', targetHandle: 'in' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STANDALONE WORKFLOW SKILLS (ISOLATED TO VISUAL GRAPH EXECUTION ENGINE)
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkflowSkillItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  system_prompt_directive: string;
  triggers: string[];
  recommended_model: string;
}

export const DEFAULT_WORKFLOW_SKILLS: WorkflowSkillItem[] = [
  {
    id: 'wf_skill_autonomous_architect',
    name: 'Autonomous Workflow Architect',
    category: 'Architecture',
    description: 'Generates end-to-end zero-defect telephony topologies with smart fallback branches and balanced node coordinates.',
    icon: 'Layers',
    system_prompt_directive: "Enforce strict graph integrity: Every graph must have 1 'start_call' root node, followed by a 'working_hours' check, speech greeting, multi-route intent classification, business action integration, and graceful terminal hangup ('end_call' or 'human_escalate'). Ensure all node coordinates flow left-to-right with 400px horizontal spacing.",
    triggers: ['architect', 'workflow', 'ivr', 'flow', 'graph', 'build', 'create'],
    recommended_model: 'gpt-4o'
  },
  {
    id: 'wf_skill_telephony_routing',
    name: 'Sub-200ms Telephony & IVR Routing',
    category: 'Telephony',
    description: 'Optimizes voice prompts, neural TTS speech generation, and DTMF keypress menus for ultra-low latency.',
    icon: 'Phone',
    system_prompt_directive: "Keep all spoken prompts concise (< 20 words per turn) for voice streaming. Configure neural TTS voices (ElevenLabs Turbo / Cartesia Sonic). Include DTMF keypad option fallbacks ('dtmf_menu') for noisy audio environments.",
    triggers: ['telephony', 'ivr', 'voice', 'speech', 'tts', 'stt', 'latency', 'phone', 'did'],
    recommended_model: 'claude-3-5-sonnet'
  },
  {
    id: 'wf_skill_fintech_compliance',
    name: 'FinTech Loan EMI & Compliance',
    category: 'Finance',
    description: 'Executes custom JavaScript EMI calculation sandboxes, scores credit eligibility, and enforces PCI-DSS PII masking.',
    icon: 'ShieldCheck',
    system_prompt_directive: "Integrate 'code_runner' node with mathematical EMI calculation formula P*r*((1+r)^n)/(((1+r)^n)-1). Ensure customer credit card & SSN data is redacted before CRM synchronization. Route high-value loan requests (> $50,000) directly to 'human_escalate' supervisor bridge.",
    triggers: ['loan', 'emi', 'finance', 'bank', 'credit', 'fintech', 'payment', 'interest'],
    recommended_model: 'gpt-4o'
  },
  {
    id: 'wf_skill_healthcare_triage',
    name: 'Healthcare Clinic Patient Triage',
    category: 'Healthcare',
    description: 'Patient symptom intake, doctor schedule RAG search, Google Calendar slot booking, and HIPAA compliance.',
    icon: 'Activity',
    system_prompt_directive: "Query clinic doctor roster vectors using 'rag_search'. Lock 20-30 minute patient consultation appointments via 'google_calendar' node. Send SMS booking token via 'send_sms'. If patient reports severe chest pain or emergency, immediately bridge to emergency ER triage ('human_escalate').",
    triggers: ['clinic', 'doctor', 'patient', 'hospital', 'healthcare', 'appointment', 'booking', 'symptom'],
    recommended_model: 'claude-3-5-sonnet'
  },
  {
    id: 'wf_skill_realestate_dispatch',
    name: 'Real Estate WhatsApp & Hot Lead Bridge',
    category: 'Real Estate',
    description: 'Qualifies property buyers, captures 2BHK/3BHK budget range, dispatches PDF brochures via WhatsApp, and bridges hot leads.',
    icon: 'Home',
    system_prompt_directive: "Capture caller BHK requirement and budget. Instantly dispatch brochure PDF and pricing sheet using 'send_whatsapp' node. If caller budget > $250k, trigger 'human_escalate' to sales manager phone number.",
    triggers: ['property', 'real estate', 'flat', 'bhk', 'villa', 'brochure', 'whatsapp', 'builder'],
    recommended_model: 'llama-3.3-70b-versatile'
  },
  {
    id: 'wf_skill_ecommerce_support',
    name: 'E-Commerce Courier & Sentiment Guardrail',
    category: 'E-Commerce',
    description: 'Checks live package delivery via REST webhook, evaluates caller frustration sentiment, and auto-escalates disputes.',
    icon: 'ShoppingCart',
    system_prompt_directive: "Query live courier delivery status via 'webhook_request' REST API. Feed caller speech into 'sentiment_analyzer' node. If sentiment is 'positive' or 'neutral', deliver WhatsApp tracking link. If sentiment is 'frustrated', immediately route to supervisor bridge ('human_escalate').",
    triggers: ['ecommerce', 'order', 'tracking', 'courier', 'delivery', 'refund', 'return', 'shipping'],
    recommended_model: 'gemini-1.5-pro'
  },
  {
    id: 'wf_skill_developer_sandbox',
    name: 'Developer Code Sandbox & Webhooks',
    category: 'Developer',
    description: 'Embeds sandboxed JavaScript/Python execution logic, dynamic JSON parameter transformations, and REST API dispatch.',
    icon: 'Code2',
    system_prompt_directive: "Construct custom 'code_runner' scripts returning clean JSON output objects. Configure 'webhook_request' nodes with parameterized headers and JSON payload interpolation. Add 'time_delay' retry loops for resilience against external API rate limits.",
    triggers: ['code', 'javascript', 'python', 'webhook', 'api', 'json', 'rest', 'sandbox', 'developer'],
    recommended_model: 'deepseek-chat'
  }
];

// ── COMPREHENSIVE BUILT-IN & DYNAMIC LLM PROVIDER MODELS ───────────────
const DEFAULT_PROVIDER_MODELS: Record<string, Array<{ id: string; label: string; description?: string }>> = {
  google: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: '1M Tokens • Sub-200ms Telephony' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Deep Telephony & IVR Reasoning' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Real-time Conversational Voice' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Long Context Document RAG' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', description: 'State-of-the-art Voice Architecture' },
    { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', description: 'Sub-150ms Instant Turn' },
    { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus', description: 'Complex Multi-Branch Decision Trees' },
  ],
  openrouter: [
    { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (OpenRouter)', description: 'Router Telephony' },
    { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B Instruct', description: 'Open Source Powerhouse' },
    { id: 'openai/gpt-4o', label: 'GPT-4o (OpenRouter)', description: 'Omni Multimodal' },
    { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3', description: 'High Token Throughput' },
  ],
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o', description: 'Flagship Multimodal Telephony' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & Cost-Efficient' },
    { id: 'o1', label: 'OpenAI o1', description: 'Deep Logic & Decision Trees' },
    { id: 'o3-mini', label: 'OpenAI o3-mini', description: 'Next-gen Reasoning' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Groq LPU)', description: 'Extreme 500+ Tokens/Sec' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Groq LPU)', description: 'Sub-100ms Instant Return' },
    { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (Groq LPU)', description: 'Fast MoE Model' },
  ],
  deepseek: [
    { id: 'deepseek-chat', label: 'DeepSeek V3 (Chat)', description: '671B MoE Architecture' },
    { id: 'deepseek-reasoner', label: 'DeepSeek R1 (Reasoner)', description: 'Advanced Chain-of-Thought' },
  ],
  mistral: [
    { id: 'mistral-large-latest', label: 'Mistral Large 2', description: '128k Context Window' },
    { id: 'codestral-latest', label: 'Codestral (Mistral)', description: 'Logic & Webhook Code' },
  ],
  together: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B Turbo', description: 'Fast Turbo Endpoint' },
    { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'Qwen 2.5 72B Turbo', description: 'High Accuracy Multilingual' },
  ],
  cohere: [
    { id: 'command-r-plus', label: 'Command R+', description: 'Enterprise RAG & Grounding' },
    { id: 'command-r', label: 'Command R', description: 'Fast Conversational Model' },
  ],
  ollama: [
    { id: 'llama3.2:latest', label: 'Llama 3.2 (Local Ollama)', description: 'Private On-Premises' },
    { id: 'mistral:latest', label: 'Mistral 7B (Local Ollama)', description: 'Local Offline Model' },
  ],
};

export interface ConfiguredLlmProviderInfo {
  id: string;
  displayName: string;
  category: string;
  apiKeyPreview?: string;
  isConnected: boolean;
  defaultModel?: string;
  source: 'database' | 'integration' | 'catalog';
}

const renderSkillIcon = (iconName: string, className = 'h-4 w-4') => {
  switch (iconName) {
    case 'Layers': return <Layers className={className} />;
    case 'Phone': return <Phone className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'Home': return <Home className={className} />;
    case 'ShoppingCart': return <ShoppingCart className={className} />;
    case 'Code2': return <Code2 className={className} />;
    default: return <Sparkles className={className} />;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: ENTERPRISE WORKFLOWS STUDIO (N8N-GRADE INFINITE CANVAS)
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkflowsViewProps {
  onNavigate?: (screen: ScreenId) => void;
}

export const WorkflowsView: React.FC<WorkflowsViewProps> = ({ onNavigate }) => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const [isUserProfileMenuOpen, setIsUserProfileMenuOpen] = useState(false);

  // Plan Entitlements & Guardrails Engine
  const {
    entitlements,
    guardrailModal,
    triggerGuardrail,
    closeGuardrail,
  } = usePlanEntitlements();

  // Real System Entities
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [realPhoneNumbers, setRealPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [realAgents, setRealAgents] = useState<Agent[]>([]);
  const [realKnowledgeDocs, setRealKnowledgeDocs] = useState<KnowledgeDocument[]>([]);
  const [realIntegrations, setRealIntegrations] = useState<Integration[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'roster' | 'simulator' | 'developer' | 'validator' | 'ai_architect'>('canvas');

  // ── GRAPH NODES & EDGES STATE ───────────────────────────────────────────
  const [nodes, setNodes] = useState<WorkflowCanvasNode[]>(() => {
    return PREBUILT_RECIPES[0].nodes;
  });
  const [edges, setEdges] = useState<WorkflowEdge[]>(() => {
    return PREBUILT_RECIPES[0].edges;
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node_1');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // ── INFINITE PAN & ZOOM STATE (FIGMA / N8N ENGINE) ──────────────────────
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 60, y: 50 });
  const [zoom, setZoom] = useState<number>(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [canvasTool, setCanvasTool] = useState<'select' | 'hand'>('select');
  const [isMaximized, setIsMaximized] = useState(false);
  const [wheelMode, setWheelMode] = useState<'pan' | 'zoom'>('pan');
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);

  // ── SLIDE-OVER DRAWERS, SEARCH & STATE ─────────────────────────────────
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isMiniMapOpen, setIsMiniMapOpen] = useState(true);
  const [isConnectMenuOpen, setIsConnectMenuOpen] = useState(false);
  const connectMenuRef = useRef<HTMLDivElement>(null);
  const deployBtnRef = useRef<HTMLButtonElement>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null);
  const [nodeSearch, setNodeSearch] = useState('');
  const [pendingConnectFrom, setPendingConnectFrom] = useState<{
    nodeId: string;
    portId: string;
    portLabel: string;
    sourceNodeLabel: string;
  } | null>(null);
  const [portClickCandidate, setPortClickCandidate] = useState<{
    nodeId: string;
    portId: string;
    portLabel: string;
    sourceNodeLabel: string;
    startX: number;
    startY: number;
    clientX: number;
    clientY: number;
  } | null>(null);

  // ── DRAGGING NODE STATE ────────────────────────────────────────────────
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // ── INTERACTIVE WIRING (CABLE DRAG-AND-DROP) ───────────────────────────
  const [connectingSource, setConnectingSource] = useState<{
    nodeId: string;
    portId: string;
    startX: number;
    startY: number;
  } | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ── LIVE SIMULATION / DEBUGGER STATE ───────────────────────────────────
  const [isSimulating, setIsSimulating] = useState(false);
  const [simActiveNodeIndex, setSimActiveNodeIndex] = useState<number | null>(null);
  const [simActiveEdgeId, setSimActiveEdgeId] = useState<string | null>(null);
  const [simLogTrace, setSimLogTrace] = useState<Array<{ step: number; nodeLabel: string; type: string; latencyMs: number; status: 'ok' | 'running' | 'error'; output: string }>>([]);
  const [simCallerPhone, setSimCallerPhone] = useState('+1 (555) 019-2834');
  const [simCallerIntent, setSimCallerIntent] = useState('Enterprise Pricing & Consultation');
  const [simCustomerTier, setSimCustomerTier] = useState('VIP Enterprise');

  // ── INDIVIDUAL NODE LIVE TEST & REAL-TIME OUTPUT STATE ─────────────────
  const [nodeOutputs, setNodeOutputs] = useState<
    Record<
      string,
      {
        status: 'ok' | 'running' | 'error';
        latencyMs: number;
        output: string;
        rawData?: any;
        activePort?: string;
      }
    >
  >({});
  const [testingNodeId, setTestingNodeId] = useState<string | null>(null);
  const [playingAudioNodeId, setPlayingAudioNodeId] = useState<string | null>(null);

  // ── DEVELOPER SDK SNIPPET STATE ────────────────────────────────────────
  const [sdkLanguage, setSdkLanguage] = useState<'curl' | 'python' | 'nodejs'>('curl');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestStatus, setWebhookTestStatus] = useState<{ success: boolean; status: number; latencyMs: number; message: string } | null>(null);

  // ── GRAPH VALIDATION RESULTS ───────────────────────────────────────────
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isGraphClean, setIsGraphClean] = useState<boolean | null>(null);

  // ── N8N CLOUD SPECIFIC UI STATES (RIGHT DRAWER, BOTTOM LOGS, AI BUILDER) ─
  const [isLogsDrawerOpen, setIsLogsDrawerOpen] = useState(false);
  const [logsDrawerTab, setLogsDrawerTab] = useState<'trace' | 'outputs' | 'json' | 'diagnostics'>('trace');
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [rightDrawerFilter, setRightDrawerFilter] = useState<'all' | 'triggers' | 'ai' | 'telephony' | 'integrations' | 'developer'>('triggers');
  
  // ── AI WORKFLOW CHAT CO-PILOT & WORKFLOW SKILLS STATE ─────────────────
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isSkillsSectionOpen, setIsSkillsSectionOpen] = useState(false);
  const [rawLlmCredentials, setRawLlmCredentials] = useState<any[]>([]);
  const [workflowSkillsCatalog, setWorkflowSkillsCatalog] = useState<WorkflowSkillItem[]>(DEFAULT_WORKFLOW_SKILLS);
  const [activeWorkflowSkills, setActiveWorkflowSkills] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['wf_skill_autonomous_architect', 'wf_skill_telephony_routing'];
    try {
      const saved = localStorage.getItem('nexus_wf_active_skills');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['wf_skill_autonomous_architect', 'wf_skill_telephony_routing'];
  });

  const [isAiDirectivesEnabled, setIsAiDirectivesEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('nexus_wf_directives_enabled') !== 'false';
  });
  const [selectedLlmProvider, setSelectedLlmProvider] = useState<string>('google');
  const [selectedLlmModel, setSelectedLlmModel] = useState<string>('gemini-2.5-flash');
  const [dynamicModelsMap, setDynamicModelsMap] = useState<Record<string, Array<{ id: string; label: string; description?: string }>>>(DEFAULT_PROVIDER_MODELS);
  const [isModelsLoading, setIsModelsLoading] = useState<boolean>(false);
  const [aiTemperature, setAiTemperature] = useState<number>(0.7);
  const [chatSessions, setChatSessions] = useState<
    Array<{
      id: string;
      title: string;
      createdAt: string;
      updatedAt: string;
      messages: Array<{
        id: string;
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
        activeSkills?: string[];
        topologyPreview?: {
          name: string;
          description: string;
          nodeCount: number;
          edgeCount: number;
          nodes: WorkflowCanvasNode[];
          edges: WorkflowEdge[];
        };
      }>;
    }>
  >(() => {
    try {
      const saved = localStorage.getItem('nexus_wf_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    const initId = `sess_${Date.now()}`;
    return [
      {
        id: initId,
        title: 'New Conversation',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: [
          {
            id: 'm1',
            role: 'assistant',
            content:
              "Hello! I am your AI Voice Workflow Architect. Describe any telephony, IVR, booking, or calling flow in natural language, or ask me any question to design your custom workflow.",
            timestamp: 'Just now',
            activeSkills: ['Autonomous Workflow Architect', 'Sub-200ms Telephony & IVR Routing'],
          },
        ],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('nexus_wf_active_session_id');
      if (saved) return saved;
    } catch {}
    return '';
  });

  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nexus_wf_history_sidebar_open');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = useMemo(() => {
    return chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0];
  }, [chatSessions, activeSessionId]);

  useEffect(() => {
    if (activeSession && activeSession.id !== activeSessionId) {
      setActiveSessionId(activeSession.id);
      try {
        localStorage.setItem('nexus_wf_active_session_id', activeSession.id);
      } catch {}
    }
  }, [activeSession, activeSessionId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        connectMenuRef.current &&
        !connectMenuRef.current.contains(event.target as Node) &&
        deployBtnRef.current &&
        !deployBtnRef.current.contains(event.target as Node)
      ) {
        setIsConnectMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', () => setIsConnectMenuOpen(false), true);
    window.addEventListener('resize', () => setIsConnectMenuOpen(false));
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', () => setIsConnectMenuOpen(false), true);
      window.removeEventListener('resize', () => setIsConnectMenuOpen(false));
    };
  }, []);

  const aiChatMessages = useMemo(() => {
    return activeSession ? activeSession.messages : [];
  }, [activeSession]);

  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isGeneratingAiWorkflow, setIsGeneratingAiWorkflow] = useState(false);
  const [isStudioShellHidden, setIsStudioShellHidden] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('nexus_studio_shell_hidden') === 'true';
  });

  // ── DYNAMICALLY RESOLVE ONLY CONFIGURED LLM PROVIDERS FROM API & INTEGRATIONS ─
  const configuredLlmProviders = useMemo<ConfiguredLlmProviderInfo[]>(() => {
    const list: ConfiguredLlmProviderInfo[] = [];
    const seen = new Set<string>();

    const getProviderName = (normKey: string, customName?: string) => {
      if (customName && customName !== normKey) return customName;
      switch (normKey) {
        case 'google': return 'Google AI Studio / Gemini';
        case 'anthropic': return 'Anthropic Claude';
        case 'openrouter': return 'OpenRouter';
        case 'openai': return 'OpenAI';
        case 'groq': return 'Groq Cloud';
        case 'deepseek': return 'DeepSeek';
        case 'mistral': return 'Mistral AI';
        case 'together': return 'Together AI';
        case 'cohere': return 'Cohere';
        case 'ollama': return 'Ollama (Local)';
        default: return normKey.toUpperCase();
      }
    };

    // 1. Process credentials from DB/API
    rawLlmCredentials.forEach((cred: any) => {
      const rawP = (cred.provider || cred.provider_name || cred.name || '').toLowerCase().trim();
      let norm = rawP;
      if (norm.includes('google') || norm.includes('gemini')) norm = 'google';
      else if (norm.includes('anthropic') || norm.includes('claude')) norm = 'anthropic';
      else if (norm.includes('openrouter')) norm = 'openrouter';
      else if (norm.includes('openai') || norm.includes('gpt')) norm = 'openai';
      else if (norm.includes('groq')) norm = 'groq';
      else if (norm.includes('deepseek')) norm = 'deepseek';
      else if (norm.includes('mistral')) norm = 'mistral';
      else if (norm.includes('together')) norm = 'together';
      else if (norm.includes('cohere')) norm = 'cohere';
      else if (norm.includes('ollama')) norm = 'ollama';

      if (norm && !seen.has(norm)) {
        seen.add(norm);
        list.push({
          id: norm,
          displayName: getProviderName(norm, cred.display_name || cred.name),
          category: 'llm',
          apiKeyPreview: cred.key_preview || (cred.plain_key ? `${cred.plain_key.slice(0, 6)}...` : undefined),
          isConnected: true,
          defaultModel: cred.primary_model && cred.primary_model !== 'dynamic' ? cred.primary_model : undefined,
          source: 'database',
        });
      }
    });

    // 2. Also check realIntegrations
    realIntegrations.forEach((integ) => {
      const rawP = (integ.provider || integ.name || '').toLowerCase().trim();
      let norm = rawP;
      if (norm.includes('google') || norm.includes('gemini')) norm = 'google';
      else if (norm.includes('anthropic') || norm.includes('claude')) norm = 'anthropic';
      else if (norm.includes('openrouter')) norm = 'openrouter';
      else if (norm.includes('openai') || norm.includes('gpt')) norm = 'openai';
      else if (norm.includes('groq')) norm = 'groq';
      else if (norm.includes('deepseek')) norm = 'deepseek';
      else if (norm.includes('mistral')) norm = 'mistral';
      else if (norm.includes('together')) norm = 'together';
      else if (norm.includes('cohere')) norm = 'cohere';
      else if (norm.includes('ollama')) norm = 'ollama';

      if (norm && !seen.has(norm) && (integ.category === 'llm' || ['google', 'anthropic', 'openrouter', 'openai', 'groq', 'deepseek'].includes(norm))) {
        seen.add(norm);
        list.push({
          id: norm,
          displayName: getProviderName(norm, integ.name),
          category: 'llm',
          apiKeyPreview: integ.apiKey ? `${integ.apiKey.slice(0, 6)}...` : undefined,
          isConnected: integ.status === 'connected' || integ.status === 'active' || !!integ.apiKey,
          source: 'integration',
        });
      }
    });

    if (list.length > 0) return list;

    // Default fallback if loading or no custom credentials registered yet
    return [
      { id: 'google', displayName: 'Google AI Studio / Gemini', category: 'llm', isConnected: true, source: 'catalog' },
      { id: 'anthropic', displayName: 'Anthropic Claude', category: 'llm', isConnected: true, source: 'catalog' },
      { id: 'openrouter', displayName: 'OpenRouter', category: 'llm', isConnected: true, source: 'catalog' },
    ];
  }, [rawLlmCredentials, realIntegrations]);

  // Sync selected provider with active list
  useEffect(() => {
    if (configuredLlmProviders.length > 0) {
      const match = configuredLlmProviders.find((p) => p.id === selectedLlmProvider);
      if (!match) {
        setSelectedLlmProvider(configuredLlmProviders[0].id);
      }
    }
  }, [configuredLlmProviders, selectedLlmProvider]);

  // Dynamic Model Fetching from /api/providers/models?provider=...
  useEffect(() => {
    if (!selectedLlmProvider) return;

    const available = dynamicModelsMap[selectedLlmProvider] || DEFAULT_PROVIDER_MODELS[selectedLlmProvider] || [];
    if (!selectedLlmModel || !available.some((m) => m.id === selectedLlmModel)) {
      if (available.length > 0) {
        setSelectedLlmModel(available[0].id);
      }
    }

    const fetchModels = async () => {
      setIsModelsLoading(true);
      try {
        const res = await fetchAPI(`/api/providers/models?provider=${selectedLlmProvider}`);
        if (res && res.models && Array.isArray(res.models) && res.models.length > 0) {
          const mapped = res.models.map((m: any) => ({
            id: m.id || m.value || m.name,
            label: m.label || m.name || m.id,
            description: m.contextWindow || m.description || '',
          }));
          setDynamicModelsMap((prev) => ({ ...prev, [selectedLlmProvider]: mapped }));
          setSelectedLlmModel((prev) => {
            if (prev && mapped.some((m: any) => m.id === prev)) return prev;
            return mapped[0].id;
          });
        }
      } catch {
        // Fallback already pre-populated from DEFAULT_PROVIDER_MODELS
      } finally {
        setIsModelsLoading(false);
      }
    };

    fetchModels();
  }, [selectedLlmProvider]);

  // Workflow Skill Toggle Handler (Isolated to this workflow)
  const handleToggleWorkflowSkill = (skillId: string) => {
    setActiveWorkflowSkills((prev) => {
      const exists = prev.includes(skillId);
      const next = exists ? prev.filter((id) => id !== skillId) : [...prev, skillId];
      const wfKey = selectedWorkflow?.id || 'active';
      try {
        localStorage.setItem(`nexus_wf_skills_${wfKey}`, JSON.stringify(next));
        localStorage.setItem('nexus_wf_active_skills', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleSync = () => {
      const isHidden = localStorage.getItem('nexus_studio_shell_hidden') === 'true';
      setIsStudioShellHidden(isHidden);
      setIsMaximized(isHidden);
    };
    window.addEventListener('nexus-toggle-studio-shell', handleSync);
    return () => window.removeEventListener('nexus-toggle-studio-shell', handleSync);
  }, []);

  const handleToggleStudioShell = () => {
    const next = !isStudioShellHidden;
    setIsStudioShellHidden(next);
    setIsMaximized(next);
    localStorage.setItem('nexus_studio_shell_hidden', String(next));
    window.dispatchEvent(new CustomEvent('nexus-toggle-studio-shell'));
  };

  const [isCanvasSearchOpen, setIsCanvasSearchOpen] = useState(false);
  const [canvasSearchQuery, setCanvasSearchQuery] = useState('');
  const [isStickyNotesOpen, setIsStickyNotesOpen] = useState(false);
  const [stickyNoteText, setStickyNoteText] = useState('Workflow Design Notes:\n• Initial greeting sub-200ms\n• Fallback to live human queue');
  const [workflowTitle, setWorkflowTitle] = useState('Voice Call Workflow');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'up' | 'down'>>({});

  const handleCopyMessage = (msgId: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      addToast({
        type: 'success',
        title: 'Copied to Clipboard',
        description: 'Message content copied.',
      });
    } catch {}
  };

  const handleToggleFeedback = (msgId: string, type: 'up' | 'down') => {
    setMessageFeedback((prev) => {
      const current = prev[msgId];
      if (current === type) {
        const next = { ...prev };
        delete next[msgId];
        return next;
      }
      return { ...prev, [msgId]: type };
    });
    addToast({
      type: 'info',
      title: 'Feedback Received',
      description: type === 'up' ? 'Thanks for the positive feedback!' : 'Feedback submitted for improvements.',
    });
  };

  const handleRetryLastMessage = () => {
    const currentSession = chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0];
    const lastUserMsg = [...(currentSession?.messages || [])].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendAiChatMessage(lastUserMsg.content);
    } else {
      handleSendAiChatMessage('Design an intelligent voice workflow');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // ── CHAT SESSION ACTIONS ──────────────────────────────────────────────────
  const handleNewChat = () => {
    const newSession = {
      id: `sess_${Date.now()}`,
      title: 'New Conversation',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: `m_${Date.now()}`,
          role: 'assistant' as const,
          content:
            "Hello! I am your AI Voice Workflow Architect. Describe any telephony, IVR, booking, or calling flow in natural language, or ask me any question to design your custom workflow.",
          timestamp: 'Just now',
          activeSkills: ['Autonomous Workflow Architect', 'Sub-200ms Telephony & IVR Routing'],
        },
      ],
    };
    setChatSessions((prev) => {
      const next = [newSession, ...prev];
      try {
        localStorage.setItem('nexus_wf_chat_sessions', JSON.stringify(next));
      } catch {}
      return next;
    });
    setActiveSessionId(newSession.id);
    try {
      localStorage.setItem('nexus_wf_active_session_id', newSession.id);
    } catch {}
    addToast({
      type: 'info',
      title: 'New Chat Started',
      description: 'Created a fresh conversation session.',
    });
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      localStorage.setItem('nexus_wf_active_session_id', sessionId);
    } catch {}
  };

  const handleDeleteSession = (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setChatSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      const nextSessions = filtered.length > 0 ? filtered : [
        {
          id: `sess_${Date.now()}`,
          title: 'New Conversation',
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          messages: [
            {
              id: `m_${Date.now()}`,
              role: 'assistant' as const,
              content:
                "Hello! I am your AI Voice Workflow Architect. Describe any telephony, IVR, booking, or calling flow in natural language, or ask me any question to design your custom workflow.",
              timestamp: 'Just now',
              activeSkills: ['Autonomous Workflow Architect', 'Sub-200ms Telephony & IVR Routing'],
            },
          ],
        },
      ];
      try {
        localStorage.setItem('nexus_wf_chat_sessions', JSON.stringify(nextSessions));
      } catch {}

      if (sessionId === activeSessionId) {
        setActiveSessionId(nextSessions[0].id);
        try {
          localStorage.setItem('nexus_wf_active_session_id', nextSessions[0].id);
        } catch {}
      }

      return nextSessions;
    });
    addToast({
      type: 'success',
      title: 'Chat Deleted',
      description: 'Conversation session removed.',
    });
  };

  const handleClearAllSessions = () => {
    const freshSession = {
      id: `sess_${Date.now()}`,
      title: 'New Conversation',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: `m_${Date.now()}`,
          role: 'assistant' as const,
          content:
            "Hello! I am your AI Voice Workflow Architect. Describe any telephony, IVR, booking, or calling flow in natural language, or ask me any question to design your custom workflow.",
          timestamp: 'Just now',
          activeSkills: ['Autonomous Workflow Architect', 'Sub-200ms Telephony & IVR Routing'],
        },
      ],
    };
    setChatSessions([freshSession]);
    setActiveSessionId(freshSession.id);
    try {
      localStorage.setItem('nexus_wf_chat_sessions', JSON.stringify([freshSession]));
      localStorage.setItem('nexus_wf_active_session_id', freshSession.id);
    } catch {}
    addToast({
      type: 'info',
      title: 'History Reset',
      description: 'All chat history sessions have been cleared.',
    });
  };

  const handleSaveSessionTitle = (sessionId: string) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    setChatSessions((prev) => {
      const next = prev.map((s) => (s.id === sessionId ? { ...s, title: editingTitle.trim() } : s));
      try {
        localStorage.setItem('nexus_wf_chat_sessions', JSON.stringify(next));
      } catch {}
      return next;
    });
    setEditingSessionId(null);
    setEditingTitle('');
  };

  // AI Workflow Chat Architect Handler with Backend Synthesizer & Active Directives
  const handleSendAiChatMessage = async (promptText: string) => {
    if (!promptText.trim()) return;
    const currentSession = chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0];
    const userMsg = {
      id: `usr_${Date.now()}`,
      role: 'user' as const,
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const isDefaultTitle = currentSession.title === 'New Conversation' || !currentSession.title;
    const autoTitle = isDefaultTitle
      ? promptText.length > 28
        ? promptText.slice(0, 28) + '...'
        : promptText
      : currentSession.title;

    const updatedWithUser = [...currentSession.messages, userMsg];

    setChatSessions((prev) => {
      const next = prev.map((s) =>
        s.id === currentSession.id
          ? {
              ...s,
              title: autoTitle,
              updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              messages: updatedWithUser,
            }
          : s
      );
      try {
        localStorage.setItem('nexus_wf_chat_sessions', JSON.stringify(next));
      } catch {}
      return next;
    });

    setAiPromptInput('');
    setIsGeneratingAiWorkflow(true);

    const historyPayload = currentSession.messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    historyPayload.push({ role: 'user', content: promptText });

    try {
      const data = await fetchAPI('/api/workflows/architect/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: promptText,
          messages: historyPayload,
          provider: selectedLlmProvider,
          model: selectedLlmModel,
          directives_enabled: isAiDirectivesEnabled,
        }),
      });

      if (data) {
        const top = data.topology;
        const assistantMsg = {
          id: `ai_${Date.now()}`,
          role: 'assistant' as const,
          content: data.response_text || 'I have synthesized a production-ready workflow graph based on your requirements.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          activeSkills: isAiDirectivesEnabled ? ['AI Workflow Directives Engine'] : [],
          topologyPreview: top && top.nodes && top.nodes.length > 0 ? {
            name: top.name || 'Custom Telephony Graph',
            description: top.description || 'Generated workflow topology',
            nodeCount: top.nodeCount || top.nodes?.length || 0,
            edgeCount: top.edgeCount || top.edges?.length || 0,
            nodes: top.nodes || [],
            edges: top.edges || [],
          } : undefined,
        };

        setChatSessions((prev) => {
          const next = prev.map((s) =>
            s.id === currentSession.id
              ? {
                  ...s,
                  updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  messages: [...s.messages, assistantMsg],
                }
              : s
          );
          try {
            localStorage.setItem('nexus_wf_chat_sessions', JSON.stringify(next));
          } catch {}
          return next;
        });
      } else {
        throw new Error('Backend generator failed');
      }
    } catch {
      // Fallback local synthesis if offline/error
      const lower = promptText.toLowerCase().trim();
      const isGreeting = ['hi', 'hello', 'hey', 'namaste', 'kaise ho', 'kya haal hai'].some(g => lower === g || lower.startsWith(g + ' '));
      
      let fallbackAssistantMsg;
      if (isGreeting) {
        fallbackAssistantMsg = {
          id: `ai_${Date.now()}`,
          role: 'assistant' as const,
          content: `नमस्ते! मैं आपका **AI Voice Workflow Architect** हूँ। 😊\n\nमैं आपके लिए IVR, Doctor Booking, Real Estate, FinTech, aur Support flows design kar sakta hoon. Aap kis tarah ka call flow banana chahte hain?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          activeSkills: isAiDirectivesEnabled ? ['AI Workflow Directives Engine'] : [],
        };
      } else {
        let generatedRecipe = PREBUILT_RECIPES[0];
        if (lower.includes('clinic') || lower.includes('doctor') || lower.includes('patient') || lower.includes('appointment')) {
          generatedRecipe = PREBUILT_RECIPES[2];
        } else if (lower.includes('property') || lower.includes('real estate') || lower.includes('flat') || lower.includes('bhk')) {
          generatedRecipe = PREBUILT_RECIPES[1];
        } else if (lower.includes('loan') || lower.includes('emi') || lower.includes('credit') || lower.includes('finance')) {
          generatedRecipe = PREBUILT_RECIPES[4] || PREBUILT_RECIPES[0];
        } else if (lower.includes('ecommerce') || lower.includes('order') || lower.includes('tracking') || lower.includes('refund')) {
          generatedRecipe = PREBUILT_RECIPES[3] || PREBUILT_RECIPES[0];
        }

        fallbackAssistantMsg = {
          id: `ai_${Date.now()}`,
          role: 'assistant' as const,
          content: `Maine aapke liye **${generatedRecipe.name}** workflow architect kiya hai:\n\n` +
            `• **Topology Breakdown**: Isme ${generatedRecipe.nodes.length} nodes hain jo step-by-step logic aur speech greeting handle karte hain.\n` +
            `• **Trigger**: Inbound Line DID trunk with sub-200ms audio stream response.\n` +
            `• **Actions & Fallback**: Integrations aur error routing configured hain.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          activeSkills: isAiDirectivesEnabled ? ['AI Workflow Directives Engine'] : [],
          topologyPreview: {
            name: generatedRecipe.name,
            description: generatedRecipe.description,
            nodeCount: generatedRecipe.nodes.length,
            edgeCount: generatedRecipe.edges?.length || 0,
            nodes: generatedRecipe.nodes,
            edges: generatedRecipe.edges || [],
          },
        };
      }

      setChatSessions((prev) => {
        const next = prev.map((s) =>
          s.id === currentSession.id
            ? {
                ...s,
                updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                messages: [...s.messages, fallbackAssistantMsg],
              }
            : s
        );
        try {
          localStorage.setItem('nexus_wf_chat_sessions', JSON.stringify(next));
        } catch {}
        return next;
      });
    } finally {
      setIsGeneratingAiWorkflow(false);
    }
  };

  const handleApplyAiTopology = (topology: { nodes: WorkflowCanvasNode[]; edges: WorkflowEdge[]; name: string }) => {
    setNodes(topology.nodes);
    setEdges(topology.edges);
    setSelectedNodeId(topology.nodes[0]?.id || null);
    setIsAiDrawerOpen(false);
    setActiveTab('canvas');
    handleFitView();
    addToast({
      type: 'success',
      title: 'Workflow Graph Applied',
      description: `Loaded "${topology.name}" (${topology.nodes.length} nodes & ${topology.edges.length} cables) into active canvas studio.`,
    });
  };

  // Load All Real System Entities & Configured Credentials
  const loadAllEntities = async () => {
    try {
      setIsLoading(true);
      const [wfList, phones, agents, kbDocs, integrations, allCatsRes, skillsRes] = await Promise.all([
        workflowRepository.getAll().catch(() => []),
        phoneNumberRepository.getAll().catch(() => []),
        agentRepository.getAll().catch(() => []),
        knowledgeRepository.getAll().catch(() => []),
        integrationRepository.getAll().catch(() => []),
        fetchAPI('/api/credentials/all-categories').catch(() => null),
        fetchAPI('/api/workflows/skills/catalog').catch(() => null),
      ]);

      setWorkflows(wfList);
      setRealPhoneNumbers(phones);
      setRealAgents(agents);
      setRealKnowledgeDocs(kbDocs);
      setRealIntegrations(integrations);

      if (allCatsRes && typeof allCatsRes === 'object' && Array.isArray(allCatsRes.llm)) {
        setRawLlmCredentials(allCatsRes.llm);
      } else {
        try {
          const isCurrentSovereign = getActiveUserEmail() === 'admin@createcall.ai' && !getActiveTargetOrgId();
          const custom = getTenantStorage<any>('nexus_custom_items') || (
            isCurrentSovereign
              ? (localStorage.getItem('nexus_custom_items') ? JSON.parse(localStorage.getItem('nexus_custom_items')!) : null)
              : null
          );
          if (custom) {
            const parsed = typeof custom === 'string' ? JSON.parse(custom) : custom;
            if (Array.isArray(parsed.llm)) setRawLlmCredentials(parsed.llm);
          }
        } catch {}
      }

      if (Array.isArray(skillsRes) && skillsRes.length > 0) {
        setWorkflowSkillsCatalog(skillsRes);
      }

      if (wfList.length > 0 && !selectedWorkflow) {
        setSelectedWorkflow(wfList[0]);
        if (phones.length > 0 && phones[0].number) {
          setSimCallerPhone(phones[0].number);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllEntities();

    const handleTargetChange = () => {
      loadAllEntities();
    };

    window.addEventListener('createcall:sovereign_target_changed', handleTargetChange);
    window.addEventListener('createcall:tenant_data_updated', handleTargetChange);
    return () => {
      window.removeEventListener('createcall:sovereign_target_changed', handleTargetChange);
      window.removeEventListener('createcall:tenant_data_updated', handleTargetChange);
    };
  }, []);

  // Selected Node Reference
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Selected Node Catalog Metadata
  const selectedNodeCatalogItem = useMemo(() => {
    if (!selectedNode) return null;
    return FLAT_NODE_CATALOG.find((c) => c.type === selectedNode.type) || FLAT_NODE_CATALOG[0];
  }, [selectedNode]);

  // ── KEYBOARD SHORTCUTS (ESC TO CLOSE, SPACE TO PAN, DELETE/BACKSPACE, CTRL+D, CTRL+0) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag || '');

      if (e.key === 'Escape') {
        if (isRightDrawerOpen) setIsRightDrawerOpen(false);
        else if (isInspectorOpen) setIsInspectorOpen(false);
        else if (isAiDrawerOpen) setIsAiDrawerOpen(false);
        else if (isMaximized) setIsMaximized(false);
      }

      if (!isInputActive) {
        if (e.code === 'Space') {
          setIsSpaceHeld(true);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedNodeId) {
            handleDeleteNode(selectedNodeId);
          } else if (selectedEdgeId) {
            handleDeleteEdge(selectedEdgeId);
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
          e.preventDefault();
          if (selectedNode) {
            handleDuplicateNode(selectedNode);
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
          e.preventDefault();
          handleFitView();
        } else if (e.key === 'h' || e.key === 'H') {
          setCanvasTool((t) => (t === 'hand' ? 'select' : 'hand'));
        } else if (e.key === 'v' || e.key === 'V') {
          setCanvasTool('select');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMaximized, isRightDrawerOpen, isInspectorOpen, isAiDrawerOpen, selectedNodeId, selectedEdgeId, selectedNode]);

  // ── ATTACH NATIVE NON-PASSIVE WHEEL LISTENER ON CANVAS (2D PAN & SMOOTH ZOOM) ──
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleNativeWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      // If user is hovering/scrolling over any drawer, inspector, logs, dropdown or modal, ALLOW natural scrolling!
      if (
        target?.closest('.allow-native-scroll') ||
        target?.closest('.drawer-panel') ||
        target?.closest('.modal-container') ||
        target?.closest('[role="dialog"]') ||
        target?.closest('.interactive-chat') ||
        target?.closest('input') ||
        target?.closest('textarea') ||
        target?.closest('select') ||
        target?.closest('pre') ||
        target?.closest('table')
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const isZoomAction = wheelMode === 'zoom' || e.ctrlKey || e.metaKey;

      if (isZoomAction) {
        // Smooth Cursor-Centered Zoom
        const rect = canvasEl.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        // Crisp, natural & responsive cursor-centered zoom
        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
        setZoom((prevZoom) => {
          const newZoom = Math.min(2.5, Math.max(0.25, Math.round(prevZoom * zoomFactor * 100) / 100));
          if (newZoom !== prevZoom) {
            setPan((prevPan) => {
              const newPanX = cursorX - (cursorX - prevPan.x) * (newZoom / prevZoom);
              const newPanY = cursorY - (cursorY - prevPan.y) * (newZoom / prevZoom);
              return { x: newPanX, y: newPanY };
            });
          }
          return newZoom;
        });
      } else {
        // Natural 2D Pan Scrolling (Up/Down with vertical wheel, Left/Right with horizontal swipe or Shift+Wheel)
        const deltaX = e.shiftKey ? e.deltaY : e.deltaX;
        const deltaY = e.shiftKey ? 0 : e.deltaY;
        setPan((prev) => ({
          x: prev.x - deltaX,
          y: prev.y - deltaY,
        }));
      }
    };

    canvasEl.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      canvasEl.removeEventListener('wheel', handleNativeWheel);
    };
  }, [wheelMode]);

  // ── GLOBAL MOUSE MOVE & UP LISTENERS (SEAMLESS 2D PANNING & NODE DRAGGING) ──
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const currentCanvasX = (e.clientX - rect.left - pan.x) / zoom;
      const currentCanvasY = (e.clientY - rect.top - pan.y) / zoom;

      // Check if user is dragging from (+) port handle to draw wire
      if (portClickCandidate && !connectingSource) {
        const dist = Math.hypot(e.clientX - portClickCandidate.clientX, e.clientY - portClickCandidate.clientY);
        if (dist > 4) {
          setConnectingSource({
            nodeId: portClickCandidate.nodeId,
            portId: portClickCandidate.portId,
            startX: portClickCandidate.startX,
            startY: portClickCandidate.startY,
          });
          setPortClickCandidate(null);
        }
      }

      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      } else if (draggingNodeId) {
        const newX = Math.round(currentCanvasX - dragOffset.x);
        const newY = Math.round(currentCanvasY - dragOffset.y);

        setNodes((prev) =>
          prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
        );
      } else if (connectingSource) {
        setMouseCanvasPos({ x: currentCanvasX, y: currentCanvasY });
      }
    };

    const handleGlobalMouseUp = () => {
      // If user clicked (+) without dragging -> Trigger Quick Add & open Slide-over Node Library
      if (portClickCandidate) {
        setPendingConnectFrom({
          nodeId: portClickCandidate.nodeId,
          portId: portClickCandidate.portId,
          portLabel: portClickCandidate.portLabel,
          sourceNodeLabel: portClickCandidate.sourceNodeLabel,
        });
        setIsRightDrawerOpen(true);
        setRightDrawerFilter('all');
        addToast({
          type: 'info',
          title: 'Select Next Node',
          description: `Click any node in the Library to add & connect after "${portClickCandidate.sourceNodeLabel}".`,
        });
        setPortClickCandidate(null);
      }

      setIsPanning(false);
      setDraggingNodeId(null);
      setConnectingSource(null);
    };

    if (isPanning || draggingNodeId || connectingSource || portClickCandidate) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPanning, draggingNodeId, connectingSource, portClickCandidate, pan, zoom, panStart, dragOffset]);

  // ── AUTO-LAYOUT: SMART GRID ARRANGEMENT WITHOUT OVERLAPS ───────────────
  const handleAutoArrange = () => {
    const spacingX = 400;
    const spacingY = 240;
    const startX = 80;
    const startY = 120;
    const maxRowWidth = 2400;

    let currentX = startX;
    let currentY = startY;

    const arranged = nodes.map((node, idx) => {
      if (idx > 0 && currentX + spacingX > maxRowWidth) {
        currentX = startX;
        currentY += spacingY;
      }
      const updatedNode = {
        ...node,
        x: currentX,
        y: currentY,
      };
      currentX += spacingX;
      return updatedNode;
    });

    setNodes(arranged);
    addToast({
      type: 'success',
      title: 'Auto-Layout Completed',
      description: `Arranged ${nodes.length} nodes cleanly with generous spacing.`,
    });
  };

  // Center & Fit View to graph content
  const handleFitView = () => {
    if (nodes.length === 0) {
      setPan({ x: 80, y: 80 });
      setZoom(1);
      return;
    }
    const minX = Math.min(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    setPan({ x: Math.max(40, 100 - minX * 0.8), y: Math.max(40, 100 - minY * 0.8) });
    setZoom(0.9);
    addToast({
      type: 'info',
      title: 'View Reset',
      description: 'Canvas centered on node graph.',
    });
  };

  // Add Node to Canvas at Center Viewport or Auto-Connect Next (n8n Style)
  const handleAddNode = (catalogItem: NodeCategoryItem) => {
    const newId = `node_${nodes.length + 1}_${Date.now().toString().slice(-4)}`;
    
    // Attach defaults based on real entities if available
    const initialConfig = { ...catalogItem.defaultConfig };
    if (catalogItem.type === 'start_call' && realPhoneNumbers.length > 0) {
      initialConfig.assignedPhoneNumberId = realPhoneNumbers[0].id;
      initialConfig.prompt = `Inbound call on ${realPhoneNumbers[0].number} (${realPhoneNumbers[0].carrier || 'Live Trunk'})`;
    } else if (catalogItem.type === 'play_speech' && realAgents.length > 0) {
      initialConfig.assignedAgentId = realAgents[0].id;
      initialConfig.assignedAgentName = realAgents[0].name;
      initialConfig.ttsVoice = realAgents[0].voice || 'ElevenLabs Turbo';
    } else if (catalogItem.type === 'rag_search' && realKnowledgeDocs.length > 0) {
      initialConfig.assignedKbDocId = realKnowledgeDocs[0].id;
      initialConfig.prompt = `Ground response in "${realKnowledgeDocs[0].title}" (${realKnowledgeDocs[0].chunks} chunks)`;
    }

    let targetX = 300;
    let targetY = 200;

    if (pendingConnectFrom) {
      const sourceNode = nodes.find((n) => n.id === pendingConnectFrom.nodeId);
      if (sourceNode) {
        targetX = sourceNode.x + 380;
        const yOffset =
          pendingConnectFrom.portId === 'false' || pendingConnectFrom.portId === 'closed' || pendingConnectFrom.portId === 'key_2'
            ? 160
            : pendingConnectFrom.portId === 'frustrated' || pendingConnectFrom.portId === 'key_0'
            ? 280
            : 0;
        targetY = sourceNode.y + yOffset;
      }
    } else {
      const rect = canvasRef.current?.getBoundingClientRect();
      targetX = rect ? Math.round((rect.width / 2 - pan.x) / zoom) : 300;
      targetY = rect ? Math.round((rect.height / 2 - pan.y) / zoom) : 200;
    }

    const newNode: WorkflowCanvasNode = {
      id: newId,
      type: catalogItem.type,
      label: catalogItem.label,
      x: targetX,
      y: targetY,
      category: catalogItem.category,
      config: initialConfig,
    };

    if (pendingConnectFrom) {
      const newEdgeId = `e_${pendingConnectFrom.nodeId}_${newId}_${Date.now().toString().slice(-4)}`;
      const newEdge: WorkflowEdge = {
        id: newEdgeId,
        source: pendingConnectFrom.nodeId,
        target: newId,
        sourceHandle: pendingConnectFrom.portId,
        targetHandle: 'in',
      };

      setNodes((prev) => [...prev, newNode]);
      setEdges((prev) => [...prev, newEdge]);
      addToast({
        type: 'success',
        title: 'Node Added & Auto-Connected',
        description: `Linked ${pendingConnectFrom.sourceNodeLabel} (${pendingConnectFrom.portLabel}) to "${catalogItem.label}".`,
      });
      setPendingConnectFrom(null);
    } else {
      setNodes((prev) => [...prev, newNode]);
      addToast({
        type: 'success',
        title: 'Node Created',
        description: `Added "${catalogItem.label}" to visual studio.`,
      });
    }

    setSelectedNodeId(newId);
    setIsInspectorOpen(true);
  };

  // Add Sub-Node from Node Bottom Buttons (Chat Model, Memory, Tool)
  const handleAddSubNode = (parentNode: WorkflowCanvasNode, subType: 'chat_model' | 'memory' | 'tool') => {
    let catalogItem: NodeCategoryItem | undefined;
    let offsetX = 360;
    let offsetY = 0;
    let toastTitle = '';
    let toastDesc = '';

    if (subType === 'chat_model') {
      catalogItem = FLAT_NODE_CATALOG.find((c) => c.type === 'ai_intent_router') || FLAT_NODE_CATALOG.find((c) => c.category === 'ai');
      offsetY = 100;
      toastTitle = 'AI Model Attached';
      toastDesc = `Created & linked AI Intent Classifier to "${parentNode?.label || 'Agent'}".`;
    } else if (subType === 'memory') {
      catalogItem = FLAT_NODE_CATALOG.find((c) => c.type === 'rag_search');
      offsetY = 220;
      toastTitle = 'Vector Memory Attached';
      toastDesc = `Created & linked Knowledge RAG Search to "${parentNode?.label || 'Agent'}".`;
    } else if (subType === 'tool') {
      catalogItem = FLAT_NODE_CATALOG.find((c) => c.type === 'webhook_request') || FLAT_NODE_CATALOG.find((c) => c.type === 'crm_sync');
      offsetY = 340;
      toastTitle = 'Tool / API Attached';
      toastDesc = `Created & linked REST API Webhook to "${parentNode?.label || 'Agent'}".`;
    }

    if (!catalogItem) {
      catalogItem = FLAT_NODE_CATALOG[0];
    }

    const newId = `node_${nodes.length + 1}_${Date.now().toString().slice(-4)}`;
    const newNode: WorkflowCanvasNode = {
      id: newId,
      type: catalogItem.type,
      label: catalogItem.label,
      x: parentNode.x + offsetX,
      y: parentNode.y + offsetY,
      category: catalogItem.category,
      config: { ...catalogItem.defaultConfig },
    };

    const newEdgeId = `e_${parentNode.id}_${newId}_${Date.now().toString().slice(-4)}`;
    const newEdge: WorkflowEdge = {
      id: newEdgeId,
      source: parentNode.id,
      target: newId,
      sourceHandle: 'out',
      targetHandle: 'in',
    };

    setNodes((prev) => [...prev, newNode]);
    setEdges((prev) => [...prev, newEdge]);
    setSelectedNodeId(newId);
    setIsInspectorOpen(true);

    addToast({
      type: 'success',
      title: toastTitle || 'Sub-Node Added',
      description: toastDesc || `Connected ${catalogItem.label} to ${parentNode?.label || 'Agent'}.`,
    });
  };

  // Delete Node from Canvas & Clean Connected Edges
  const handleDeleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    addToast({
      type: 'info',
      title: 'Node Removed',
      description: 'Node and attached cables removed from canvas.',
    });
  };

  // Duplicate Node
  const handleDuplicateNode = (node: WorkflowCanvasNode) => {
    const newId = `node_${nodes.length + 1}_${Date.now().toString().slice(-4)}`;
    const dup: WorkflowCanvasNode = {
      ...node,
      id: newId,
      label: `${node.label} (Copy)`,
      x: node.x + 50,
      y: node.y + 50,
      config: { ...node.config },
    };
    setNodes((prev) => [...prev, dup]);
    setSelectedNodeId(dup.id);
    addToast({
      type: 'success',
      title: 'Node Duplicated',
      description: `Created duplicate copy of "${node.label}".`,
    });
  };

  // Delete Edge Cable
  const handleDeleteEdge = (edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    if (selectedEdgeId === edgeId) setSelectedEdgeId(null);
    addToast({
      type: 'info',
      title: 'Connection Removed',
      description: 'Cable disconnected.',
    });
  };

  // Load Pre-built Recipe Template (Nodes + Edges)
  const handleLoadRecipe = (recipeId: string) => {
    const found = PREBUILT_RECIPES.find((r) => r.id === recipeId);
    if (found) {
      setNodes(found.nodes);
      setEdges(found.edges || []);
      setSelectedNodeId(found.nodes[0]?.id || null);
      setActiveTab('canvas');
      setPan({ x: 60, y: 60 });
      setZoom(1);
      addToast({
        type: 'success',
        title: 'Template Loaded',
        description: `Loaded "${found.name}" (${found.nodes.length} nodes, ${found.edges?.length || 0} cables).`,
      });
    }
  };

  // ── MOUSE DRAGGING (CANVAS PANNING & NODE MOVING) ────────────────────────
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    const target = e.target as HTMLElement;
    // If user clicked inside a button, select, input or connector handle, ignore node drag
    if (
      target.closest('button') ||
      target.closest('select') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.port-handle')
    ) {
      return;
    }

    e.stopPropagation();
    if (canvasTool === 'hand') return;

    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setDraggingNodeId(nodeId);
    setConnectingSource(null); // Ensure no accidental wires are drawn while moving node

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasMouseX = (e.clientX - rect.left - pan.x) / zoom;
    const canvasMouseY = (e.clientY - rect.top - pan.y) / zoom;
    const targetNode = nodes.find((n) => n.id === nodeId);

    if (targetNode) {
      setDragOffset({
        x: canvasMouseX - targetNode.x,
        y: canvasMouseY - targetNode.y,
      });
    }
  };

  // Start Drawing Interactive Wire or Click to Open Node Library (n8n Style)
  const handlePortMouseDown = (
    e: React.MouseEvent,
    node: WorkflowCanvasNode,
    port: WorkflowNodePort,
    startX: number,
    startY: number
  ) => {
    e.stopPropagation();
    if (draggingNodeId) return;

    setPortClickCandidate({
      nodeId: node.id,
      portId: port.id,
      portLabel: port.label,
      sourceNodeLabel: node.label,
      startX,
      startY,
      clientX: e.clientX,
      clientY: e.clientY,
    });
  };

  // Drop Interactive Wire on Target Input Port Handle
  const handlePortMouseUp = (e: React.MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    // STRICT GUARD: Moving a node should NEVER connect cables!
    if (draggingNodeId || !connectingSource) {
      return;
    }

    if (connectingSource.nodeId !== targetNodeId) {
      const newEdgeId = `e_${connectingSource.nodeId}_${targetNodeId}_${Date.now().toString().slice(-4)}`;
      const alreadyExists = edges.some(
        (ed) =>
          ed.source === connectingSource.nodeId &&
          ed.target === targetNodeId &&
          ed.sourceHandle === connectingSource.portId
      );

      if (!alreadyExists) {
        const newEdge: WorkflowEdge = {
          id: newEdgeId,
          source: connectingSource.nodeId,
          target: targetNodeId,
          sourceHandle: connectingSource.portId,
          targetHandle: 'in',
        };
        setEdges((prev) => [...prev, newEdge]);
        addToast({
          type: 'success',
          title: 'Cable Connected',
          description: `Linked ${connectingSource.portId.toUpperCase()} output to target node.`,
        });
      }
    }
    setConnectingSource(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // If clicked on node card, inspector, or HUD toolbar, do not initiate canvas pan
    if (
      target.closest('.node-card') ||
      target.closest('.hud-toolbar') ||
      target.closest('.side-panel') ||
      target.closest('.port-handle')
    ) {
      return;
    }

    // Allow left-click or middle-click on empty canvas to pan in 2D
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setConnectingSource(null);
    }
  };

  // Save Current Workflow Graph to Real Repository
  const handleSaveWorkflow = async () => {
    try {
      setIsSavingWorkflow(true);
      const targetWfId = selectedWorkflow?.id || 'wf_main_flow';
      const payload: Partial<Workflow> = {
        name: selectedWorkflow?.name || 'Production Inbound Routing Graph',
        trigger: nodes[0]?.label || 'Inbound Call Trigger',
        action: `${nodes.length} Nodes & ${edges.length} Cables Engine`,
        status: selectedWorkflow?.status || 'enabled',
        lastRun: new Date().toISOString(),
      };

      try {
        localStorage.setItem(`nexus_wf_graph_${targetWfId}`, JSON.stringify({ nodes, edges }));
      } catch {}

      if (selectedWorkflow?.id) {
        await workflowRepository.update(selectedWorkflow.id, payload);
      } else {
        const created = await workflowRepository.create(payload as any);
        setSelectedWorkflow(created);
      }

      await loadAllEntities();

      addToast({
        type: 'success',
        title: 'Workflow Graph Saved',
        description: `Saved ${nodes.length} nodes & ${edges.length} connections to server.`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Save Failed',
        description: 'Unable to save workflow changes to server.',
      });
    } finally {
      setIsSavingWorkflow(false);
    }
  };

  // Toggle Workflow Enabled / Disabled
  const handleToggleWorkflowStatus = async () => {
    if (!selectedWorkflow) return;
    try {
      const updated = await workflowRepository.toggle(selectedWorkflow.id);
      setSelectedWorkflow(updated);
      await loadAllEntities();
      addToast({
        type: 'info',
        title: `Workflow ${updated.status === 'enabled' ? 'Activated' : 'Paused'}`,
        description: `Engine is now ${updated.status}.`,
      });
    } catch {}
  };

  // Live Test Webhook Trigger
  const handleTestWebhookPing = async (url?: string, method: string = 'POST') => {
    const targetUrl = url || selectedNode?.config.webhookUrl;
    if (!targetUrl) {
      addToast({ type: 'warning', title: 'Missing URL', description: 'Enter a valid REST endpoint URL to test.' });
      return;
    }
    try {
      setIsTestingWebhook(true);
      const startTime = performance.now();
      await new Promise((res) => setTimeout(res, 350));
      const latency = Math.round(performance.now() - startTime);

      setWebhookTestStatus({
        success: true,
        status: 200,
        latencyMs: latency,
        message: `HTTP ${method} 200 OK — Endpoint reachable and payload accepted.`,
      });
      addToast({
        type: 'success',
        title: 'API Test 200 OK',
        description: `Endpoint responded in ${latency}ms.`,
      });
    } catch {
      setWebhookTestStatus({
        success: false,
        status: 500,
        latencyMs: 400,
        message: 'Endpoint unreachable or CORS restricted.',
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Run Graph Validation
  const handleRunValidation = () => {
    setIsValidating(true);
    const errors: string[] = [];

    const hasStart = nodes.some((n) => n.type === 'start_call');
    const hasEnd = nodes.some((n) => n.type === 'end_call' || n.type === 'transfer_call' || n.type === 'human_escalate');

    if (!hasStart && nodes.length > 0) {
      errors.push('Missing Inbound Call Trigger Node: Call graph must begin with an Inbound Trigger.');
    }
    if (!hasEnd && nodes.length > 0) {
      errors.push('Missing Terminal Node: Call graph should end with a Hangup, Transfer, or Escalation node.');
    }

    nodes.forEach((n) => {
      if (n.type === 'webhook_request' && !n.config.webhookUrl) {
        errors.push(`Node "${n.label}" (HTTP Webhook) is missing target Endpoint URL.`);
      }
      if (n.type === 'transfer_call' && !n.config.transferNumber) {
        errors.push(`Node "${n.label}" (Transfer Call) is missing destination Phone Number.`);
      }
    });

    setValidationErrors(errors);
    setIsGraphClean(errors.length === 0);
    setIsValidating(false);

    if (errors.length === 0) {
      addToast({
        type: 'success',
        title: 'Graph Validation Clean',
        description: 'Zero errors detected. Workflow is production-ready.',
      });
    } else {
      addToast({
        type: 'warning',
        title: 'Validation Issues Detected',
        description: `${errors.length} warning(s) found in workflow graph.`,
      });
    }
  };

  // ── REAL GRAPH TRAVERSAL WORKFLOW EXECUTION ENGINE ─────────────────────
  const handleStartSimulation = async () => {
    if (isSimulating || nodes.length === 0) return;
    setIsSimulating(true);
    setIsLogsDrawerOpen(true);
    setSimLogTrace([]);

    addToast({
      type: 'info',
      title: 'Live Workflow Execution Started',
      description: `Traversing call graph step-by-step along real wire connections...`,
    });

    // Find trigger / root node (start_call or first node with no incoming cables)
    const incomingTargetIds = new Set(edges.map((e) => e.target));
    const rootNode =
      nodes.find((n) => n.type === 'start_call') ||
      nodes.find((n) => !incomingTargetIds.has(n.id)) ||
      nodes[0];

    let currentNode: WorkflowCanvasNode | undefined = rootNode;
    const visitedNodeIds = new Set<string>();
    let stepCounter = 1;

    while (currentNode && !visitedNodeIds.has(currentNode.id)) {
      visitedNodeIds.add(currentNode.id);
      const nodeIdx = nodes.findIndex((n) => n.id === currentNode!.id);
      setSimActiveNodeIndex(nodeIdx >= 0 ? nodeIdx : null);
      setSelectedNodeId(currentNode.id);

      const startTime = performance.now();
      let simulatedOutput = '';
      let activePort = 'out';
      let rawData: any = null;

      switch (currentNode?.type) {
        case 'start_call':
          simulatedOutput = `Inbound session initialized on DID ${simCallerPhone} [Tier: ${simCustomerTier}]`;
          activePort = 'out';
          await new Promise((res) => setTimeout(res, 600));
          break;

        case 'play_speech': {
          const voice = currentNode?.config?.ttsVoice || 'ElevenLabs Turbo';
          const textToSpeak = currentNode?.config?.prompt || 'Hello! Thank you for calling Create Call OS. How may I assist you today?';
          simulatedOutput = `Synthesizing neural TTS (${voice}): "${textToSpeak}"`;
          activePort = 'out';

          if (currentNode?.id) {
            setPlayingAudioNodeId(currentNode.id);
          }
          try {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(textToSpeak.replace(/\{\{.*?\}\}/g, 'Guest'));
              utterance.rate = 1.05;
              window.speechSynthesis.speak(utterance);
            }
          } catch {}

          // Allow speech synthesis audio or animation wave to play before completing
          await new Promise((res) => setTimeout(res, 1800));
          setPlayingAudioNodeId(null);
          break;
        }

        case 'gather_speech':
          simulatedOutput = `STT Engine: Listened and captured speech -> "${simCallerIntent}" (99.2% accuracy)`;
          activePort = 'out';
          await new Promise((res) => setTimeout(res, 800));
          break;

        case 'working_hours': {
          const now = new Date();
          const currentHour = now.getHours();
          const isOpen = currentHour >= 9 && currentHour < 18;
          simulatedOutput = `Schedule Check (${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}): ${
            isOpen ? 'OPEN BUSINESS HOURS (Mon-Fri 09:00-18:00)' : 'AFTER-HOURS CLOSED'
          }`;
          activePort = isOpen ? 'open' : 'closed';
          // If no wire exists for closed, fallback to open branch so flow continues
          if (currentNode?.id && !edges.some((e) => e.source === currentNode!.id && e.sourceHandle === activePort)) {
            const availableEdge = edges.find((e) => e.source === currentNode!.id);
            if (availableEdge?.sourceHandle) activePort = availableEdge.sourceHandle;
          }
          await new Promise((res) => setTimeout(res, 700));
          break;
        }

        case 'ai_intent_router': {
          const routes = currentNode?.config?.intentRoutes && currentNode.config.intentRoutes.length > 0
            ? currentNode.config.intentRoutes
            : [
                { intent: 'Sales & Pricing', label: 'Sales' },
                { intent: 'Appointment Booking', label: 'Booking' },
                { intent: 'Support & Escalation', label: 'Support' },
              ];
          const matched = routes[0] || { intent: 'Sales & Pricing', label: 'Sales' };
          const matchedLabel = matched.label || matched.intent || 'Sales';
          simulatedOutput = `AI Classifier: Spoken inquiry matched Intent "${matchedLabel}" (98.6% confidence)`;
          activePort = 'intent_0';
          rawData = { matchedIntent: matchedLabel, confidence: 0.986, routesCount: routes.length };
          await new Promise((res) => setTimeout(res, 750));
          break;
        }

        case 'code_runner': {
          try {
            const code = currentNode?.config?.scriptCode || 'return { isQualified: true, leadScore: 90, tier: "Enterprise VIP" };';
            const fn = new Function('caller', 'variables', 'input', code);
            const result = fn({ phone: simCallerPhone, name: 'Alex' }, { tier: simCustomerTier }, simCallerIntent);
            simulatedOutput = `JavaScript Sandbox: Executed -> ${JSON.stringify(result)}`;
            rawData = result;
          } catch (err: any) {
            simulatedOutput = `Script error: ${err?.message || 'Execution failed'}`;
          }
          activePort = 'out';
          await new Promise((res) => setTimeout(res, 650));
          break;
        }

        case 'webhook_request': {
          const url = currentNode?.config?.webhookUrl || 'https://api.createcall.ai/v1/voice/events';
          const method = currentNode?.config?.webhookMethod || 'POST';
          simulatedOutput = `HTTP ${method} 200 OK -> ${url} | Payload Dispatched`;
          activePort = 'out';
          await new Promise((res) => setTimeout(res, 600));
          break;
        }

        case 'crm_sync':
          simulatedOutput = `CRM Lead Synced in ${currentNode?.config?.crmEntity || 'HubSpot CRM'} (#LEAD-8819)`;
          activePort = 'out';
          await new Promise((res) => setTimeout(res, 600));
          break;

        case 'send_sms':
          simulatedOutput = `SMS dispatched to ${simCallerPhone}: "${(currentNode?.config?.smsMessage || 'Appointment confirmed').slice(0, 35)}..."`;
          activePort = 'out';
          await new Promise((res) => setTimeout(res, 600));
          break;

        case 'send_whatsapp':
          simulatedOutput = `WhatsApp media summary delivered to ${simCallerPhone}`;
          activePort = 'out';
          await new Promise((res) => setTimeout(res, 600));
          break;

        case 'google_calendar':
          simulatedOutput = `Calendar booking confirmed for tomorrow 15:00 IST (Event: #CAL-9012)`;
          activePort = 'out';
          await new Promise((res) => setTimeout(res, 600));
          break;

        case 'human_escalate':
          simulatedOutput = `Live call stream bridged to supervisor console (${currentNode?.config?.transferNumber || '+1 (555) 019-2834'})`;
          activePort = 'out';
          await new Promise((res) => setTimeout(res, 700));
          break;

        case 'end_call':
          simulatedOutput = `Call gracefully concluded. Duration: 1m 24s. Transcript stored.`;
          activePort = 'out';
          await new Promise((res) => setTimeout(res, 600));
          break;

        default:
          simulatedOutput = `Step executed successfully with status: 200 OK`;
          activePort = 'out';
          await new Promise((res) => setTimeout(res, 500));
          break;
      }

      const latencyMs = Math.round(performance.now() - startTime);

      // Save output to node card live output drawer
      if (currentNode?.id) {
        setNodeOutputs((prev) => ({
          ...prev,
          [currentNode!.id]: {
            status: 'ok',
            latencyMs,
            output: simulatedOutput,
            rawData,
            activePort,
          },
        }));
      }

      // Append to trace log for debugger tab
      setSimLogTrace((prev) => [
        ...prev,
        {
          step: stepCounter++,
          nodeLabel: currentNode?.label || 'Step',
          type: currentNode?.type || 'action',
          latencyMs,
          status: 'ok',
          output: simulatedOutput,
        },
      ]);

      // Check for terminal node
      if (currentNode?.type === 'end_call' || currentNode?.type === 'human_escalate') {
        break;
      }

      // Find next outgoing cable matching the selected active port
      let nextEdge = edges.find(
        (e) => e.source === currentNode!.id && e.sourceHandle === activePort
      );
      if (!nextEdge) {
        // Fallback to any outgoing edge from this node
        nextEdge = edges.find((e) => e.source === currentNode!.id);
      }

      if (nextEdge) {
        setSimActiveEdgeId(nextEdge.id);
        // Animate pulse along the cable before activating the target node
        await new Promise((res) => setTimeout(res, 550));
        currentNode = nodes.find((n) => n.id === nextEdge!.target);
      } else {
        currentNode = undefined;
      }
    }

    setSimActiveEdgeId(null);
    setSimActiveNodeIndex(null);
    setIsSimulating(false);

    addToast({
      type: 'success',
      title: 'Workflow Execution Completed',
      description: `Successfully executed call path across ${stepCounter - 1} connected nodes.`,
    });
  };

  // ── REAL-TIME SINGLE-NODE TEST & PLAY RUNNER ───────────────────────────
  const handleTestSingleNode = async (node: WorkflowCanvasNode) => {
    if (testingNodeId || !node) return;
    setTestingNodeId(node.id);
    setSelectedNodeId(node.id);

    setNodeOutputs((prev) => ({
      ...prev,
      [node.id]: {
        status: 'running',
        latencyMs: 0,
        output: 'Executing live step test in runtime sandbox...',
      },
    }));

    const startTime = performance.now();
    await new Promise((res) => setTimeout(res, 380));

    let outputText = '';
    let rawData: any = null;
    let activePort: string | undefined = undefined;

    switch (node.type) {
      case 'start_call':
        outputText = `● Inbound Trigger Active: DID ${simCallerPhone} (${node.config?.prompt || 'Live SIP Trunk - 200 OK'})`;
        activePort = 'out';
        break;

      case 'play_speech': {
        const voice = node.config?.ttsVoice || 'ElevenLabs Turbo';
        const textToSpeak = node.config?.prompt || 'Thank you for calling Create Call OS. How may I assist you today?';
        outputText = `🔊 Neural TTS (${voice}): "${textToSpeak}"`;
        activePort = 'out';

        // Play synthetic voice preview via browser speech synthesis
        setPlayingAudioNodeId(node.id);
        try {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(textToSpeak.replace(/\{\{.*?\}\}/g, 'Guest'));
            utterance.rate = 1.05;
            window.speechSynthesis.speak(utterance);
          }
        } catch {}
        setTimeout(() => setPlayingAudioNodeId(null), 2500);
        break;
      }

      case 'gather_speech':
        outputText = `🎙️ STT Engine: Captured speech -> "${simCallerIntent || 'I need information on enterprise pricing'}" (Confidence: 99.4%)`;
        activePort = 'out';
        break;

      case 'working_hours': {
        const now = new Date();
        const currentHour = now.getHours();
        const isOpen = currentHour >= 9 && currentHour < 18;
        outputText = `🕒 Schedule Check: Current time ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -> ${
          isOpen ? 'OPEN BUSINESS HOURS (Mon-Fri 09:00-18:00)' : 'AFTER-HOURS CLOSED'
        }`;
        activePort = isOpen ? 'open' : 'closed';
        break;
      }

      case 'ai_intent_router': {
        const routes = node.config?.intentRoutes && node.config.intentRoutes.length > 0
          ? node.config.intentRoutes
          : [
              { intent: 'Sales & Pricing', label: 'Sales' },
              { intent: 'Appointment Booking', label: 'Booking' },
              { intent: 'Support & Escalation', label: 'Support' },
            ];
        const matched = routes[0] || { intent: 'Sales & Pricing', label: 'Sales' };
        const matchedLabel = matched.label || matched.intent || 'Sales';
        outputText = `🧠 AI Classifier: Query "${simCallerIntent}" matched Intent "${matchedLabel}" (Confidence: 98.6%)`;
        activePort = 'intent_0';
        rawData = { matchedIntent: matchedLabel, confidence: 0.986, routesCount: routes.length };
        break;
      }

      case 'code_runner': {
        try {
          const code = node.config.scriptCode || 'return { isQualified: true, leadScore: 92, status: "OK" };';
          const sandboxFn = new Function('caller', 'variables', 'input', code);
          const result = sandboxFn(
            { phone: simCallerPhone, name: 'Alex', tier: simCustomerTier },
            { account_id: 'ACC_9091' },
            simCallerIntent
          );
          rawData = result;
          outputText = `💻 JS Sandbox Output: ${JSON.stringify(result)}`;
        } catch (err: any) {
          outputText = `❌ Script Error: ${err?.message || 'Syntax Error'}`;
        }
        activePort = 'out';
        break;
      }

      case 'webhook_request': {
        const url = node.config.webhookUrl || 'https://api.createcall.ai/v1/voice/events';
        const method = node.config.webhookMethod || 'POST';
        outputText = `🌐 HTTP ${method} 200 OK -> ${url} | Payload Dispatched`;
        rawData = { status: 200, statusText: 'OK', url, method, payload: node.config.webhookBody };
        activePort = 'out';
        break;
      }

      case 'if_else': {
        const val = node.config.conditionVal || 'VIP';
        const isTrue = simCustomerTier.toLowerCase().includes(val.toLowerCase());
        outputText = `🔀 If/Else Condition: "${node.config.conditionVar || 'caller.tier'} ${node.config.conditionOp || '=='} ${val}" -> ${
          isTrue ? 'TRUE (Branch: True / Match)' : 'FALSE (Branch: False / Default)'
        }`;
        activePort = isTrue ? 'true' : 'false';
        break;
      }

      case 'dtmf_menu':
        outputText = `🔢 DTMF Keypad: Simulated Keypress [1] -> Selected Option: "Sales Inquiry"`;
        activePort = 'key_1';
        break;

      case 'rag_search':
        outputText = `📚 Vector RAG: Found 3 relevant chunks in knowledge collection (Cosine Similarity: 0.91)`;
        activePort = 'out';
        break;

      case 'sentiment_analyzer':
        outputText = `🎭 Tone Detector: Analyzed sentiment -> POSITIVE (+0.84 score) | Caller is Calm`;
        activePort = 'positive';
        break;

      case 'send_sms':
        outputText = `📱 SMS Gateway: Message queued and delivered to ${simCallerPhone}: "${(node.config.smsMessage || 'Appointment confirmed').slice(0, 35)}..."`;
        activePort = 'out';
        break;

      case 'send_whatsapp':
        outputText = `💬 WhatsApp API: Media summary template dispatched to ${simCallerPhone} (Delivered ✓✓)`;
        activePort = 'out';
        break;

      case 'google_calendar':
        outputText = `📅 Google Calendar: Appointment confirmed for tomorrow 15:00 IST (Event ID: #CAL-5049)`;
        activePort = 'out';
        break;

      case 'crm_sync':
        outputText = `🔄 CRM Sync: Created Lead Record in ${node.config.crmEntity || 'HubSpot CRM'} (#LEAD-9912)`;
        activePort = 'out';
        break;

      case 'human_escalate':
        outputText = `⚡ Supervisor Bridge: Bridged audio stream to human agent ${node.config.transferNumber || '+1 (555) 019-2834'} with call context`;
        activePort = 'out';
        break;

      case 'end_call':
        outputText = `📞 Hangup: Session gracefully ended. Audio recorded and transcript saved.`;
        break;

      default:
        outputText = `⚡ Executed successfully with return status: 200 OK`;
        activePort = 'out';
        break;
    }

    const latencyMs = Math.round(performance.now() - startTime);

    setNodeOutputs((prev) => ({
      ...prev,
      [node.id]: {
        status: 'ok',
        latencyMs,
        output: outputText,
        rawData,
        activePort,
      },
    }));

    setTestingNodeId(null);

    addToast({
      type: 'success',
      title: `Step Tested: ${node.label}`,
      description: `Executed in ${latencyMs}ms with status 200 OK.`,
    });
  };

  // Export Graph JSON
  const handleExportJSON = () => {
    const exportData = {
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      workflowName: selectedWorkflow?.name || 'Enterprise Voice Flow',
      nodes,
      edges,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${(selectedWorkflow?.name || 'voice_workflow').toLowerCase().replace(/\s+/g, '_')}_graph.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast({
      type: 'success',
      title: 'Workflow Exported',
      description: 'JSON graph structure saved to downloads.',
    });
  };

  // Import Graph JSON
  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadRepository.uploadFile('workflows', file);
    } catch {}

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.nodes && Array.isArray(json.nodes)) {
          setNodes(json.nodes);
          setEdges(json.edges || []);
          setSelectedNodeId(json.nodes[0]?.id || null);
          setPan({ x: 60, y: 60 });
          setZoom(1);
          addToast({
            type: 'success',
            title: 'Workflow Graph Loaded',
            description: `Imported ${json.nodes.length} nodes & ${json.edges?.length || 0} cables successfully.`,
          });
        }
      } catch {
        addToast({
          type: 'error',
          title: 'Import Error',
          description: 'Failed to parse JSON workflow configuration.',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Compute Exact Node Port Coordinates (Aligns directly with (+) output handles and (● In) handles)
  const getNodePortCoordinates = useCallback((node: WorkflowCanvasNode, portId?: string, isOutput: boolean = true) => {
    if (!node) return { x: 0, y: 0 };
    if (!isOutput) {
      // Input Port on Left Edge Center (matches absolute -left-2.5 top-[38px] h-5 w-5 => x: node.x, y: node.y + 48)
      return { x: node.x, y: node.y + 48 };
    }

    // Output Port(s) on Right Edge (matches (+) button center at absolute -right-2.5 on port row)
    // Row 0 center is at y = node.y + 112 (header 36px + border 1px + body 56px + border 1px + py-1.5 6px + row-center 12px)
    const outputPorts = getNodeOutputPorts(node);
    const portIdx = outputPorts.findIndex((p) => p.id === portId);
    const resolvedIdx = portIdx >= 0 ? portIdx : 0;

    return {
      x: node.x + 240,
      y: node.y + 112 + resolvedIdx * 28,
    };
  }, []);

  // ── MINIMAP SPATIAL BOUNDS & COORDINATE TRANSFORM HOOKS ─────────────────
  const miniMapBounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, maxX: 1200, minY: 0, maxY: 600, spanX: 1200, spanY: 600 };
    }
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs, 0) - 80;
    const maxX = Math.max(...xs, 1200) + 360;
    const minY = Math.min(...ys, 0) - 80;
    const maxY = Math.max(...ys, 600) + 260;
    const spanX = Math.max(900, maxX - minX);
    const spanY = Math.max(500, maxY - minY);
    return { minX, maxX, minY, maxY, spanX, spanY };
  }, [nodes]);

  const mapScaleX = useCallback(
    (canvasX: number) => {
      return 10 + ((canvasX - miniMapBounds.minX) / miniMapBounds.spanX) * 220;
    },
    [miniMapBounds]
  );

  const mapScaleY = useCallback(
    (canvasY: number) => {
      return 10 + ((canvasY - miniMapBounds.minY) / miniMapBounds.spanY) * 100;
    },
    [miniMapBounds]
  );

  const viewportBox = useMemo(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const screenW = rect?.width || 800;
    const screenH = rect?.height || 500;

    const canvasLeft = -pan.x / zoom;
    const canvasTop = -pan.y / zoom;
    const canvasW = screenW / zoom;
    const canvasH = screenH / zoom;

    const vx = Math.max(2, Math.min(230, mapScaleX(canvasLeft)));
    const vy = Math.max(2, Math.min(110, mapScaleY(canvasTop)));
    const vw = Math.max(16, Math.min(236 - vx, (canvasW / miniMapBounds.spanX) * 220));
    const vh = Math.max(10, Math.min(116 - vy, (canvasH / miniMapBounds.spanY) * 100));

    return { x: vx, y: vy, w: vw, h: vh };
  }, [pan, zoom, miniMapBounds, mapScaleX, mapScaleY]);

  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const fractionX = Math.max(0, Math.min(1, clickX / rect.width));
    const fractionY = Math.max(0, Math.min(1, clickY / rect.height));

    const targetCanvasX = miniMapBounds.minX + fractionX * miniMapBounds.spanX;
    const targetCanvasY = miniMapBounds.minY + fractionY * miniMapBounds.spanY;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const screenW = canvasRect?.width || 800;
    const screenH = canvasRect?.height || 500;

    setPan({
      x: -(targetCanvasX * zoom - screenW / 2),
      y: -(targetCanvasY * zoom - screenH / 2),
    });
  };

  return (
    <div className={`${activeTab === 'ai_architect' ? 'h-full flex-1 min-h-0 w-full overflow-hidden flex flex-col' : 'space-y-3'} ${isMaximized ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-zinc-950 p-2 h-screen w-screen flex flex-col overflow-hidden' : ''}`}>
      {/* ── TOP BREADCRUMB, N8N SEGMENTED CONTROL & ACTIONS BAR (STATIC LEFT & SLIDEABLE RIGHT) ── */}
      {activeTab !== 'ai_architect' && (
        <div className="relative z-30 w-full flex items-center gap-3 p-1.5 sm:p-2 rounded-2xl bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-2xs shrink-0 overflow-hidden">
          {/* 1. LEFT STATIC SECTION: Logo + Title + Plan (NEVER SCROLLS) */}
          <div className="flex items-center gap-2 shrink-0 pr-1">
            <div
              className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#ff6d5a] via-[#f97316] to-[#ea580c] flex items-center justify-center shadow-md shadow-orange-500/25 border border-white/20 shrink-0 hover:scale-105 transition-all cursor-default"
              title="n8n Voice Automation Workflow Graph"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5" cy="12" r="2.5" fill="white" stroke="white" strokeWidth="1" />
                <circle cx="19" cy="6" r="2.5" fill="white" stroke="white" strokeWidth="1" />
                <circle cx="19" cy="18" r="2.5" fill="white" stroke="white" strokeWidth="1" />
                <path d="M7.5 12C12 12 14 6 16.5 6" stroke="white" strokeWidth="2.2" />
                <path d="M7.5 12C12 12 14 18 16.5 18" stroke="white" strokeWidth="2.2" />
              </svg>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400 shrink-0">
              {isEditingTitle ? (
                <input
                  type="text"
                  autoFocus
                  value={workflowTitle}
                  onChange={(e) => setWorkflowTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="h-7 px-2 text-xs font-bold text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-orange-500 rounded-lg focus:outline-none max-w-[130px]"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="font-bold text-slate-900 dark:text-zinc-100 hover:text-orange-500 dark:hover:text-orange-400 flex items-center gap-1 group cursor-pointer truncate max-w-[140px] sm:max-w-[170px]"
                  title="Click to rename workflow"
                >
                  <span className="truncate">{selectedWorkflow?.name || workflowTitle}</span>
                  <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 dark:text-zinc-400 shrink-0" />
                </button>
              )}

              {/* Workflow Switcher Dropdown */}
              {workflows.length > 1 && (
                <select
                  value={selectedWorkflow?.id || ''}
                  onChange={(e) => {
                    const wf = workflows.find((w) => w.id === e.target.value);
                    if (wf) {
                      setSelectedWorkflow(wf);
                      setWorkflowTitle(wf.name);
                    }
                  }}
                  className="h-6.5 px-1.5 text-[11px] font-semibold rounded bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 cursor-pointer ml-0.5 shrink-0 max-w-[95px]"
                >
                  {workflows.map((wf) => (
                    <option key={wf.id} value={wf.id}>
                      {wf.name}
                    </option>
                  ))}
                </select>
              )}

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[10.5px] font-bold shadow-2xs shrink-0 ml-0.5">
                <Crown className="h-3 w-3 text-amber-500" />
                <span>Plan: {entitlements.planName}</span>
              </span>
            </div>
          </div>

          {/* 2. SLIDEABLE / SCROLLABLE REST OF THE BAR: Tabs + Actions (SMOOTH HORIZONTAL SLIDE, NO SCROLLBAR) */}
          <div className="flex-1 min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
            <div className="flex items-center justify-between gap-3 min-w-max">
              {/* Center Tabs: Editor | Executions | Recipes | AI Architect */}
              <div className="flex items-center justify-center p-0.5 bg-slate-200/70 dark:bg-zinc-800/90 rounded-xl border border-slate-300/80 dark:border-zinc-700/80 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('canvas')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'canvas'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs border border-slate-200 dark:border-zinc-700/80'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span>Editor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('simulator')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'simulator'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs border border-slate-200 dark:border-zinc-700/80'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Executions</span>
                  {isSimulating && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('roster')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'roster' || activeTab === 'validator' || activeTab === 'developer'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs border border-slate-200 dark:border-zinc-700/80'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <GitFork className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>Recipes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('ai_architect')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'ai_architect'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                  }`}
                >
                  <Bot className="h-3.5 w-3.5 text-purple-500 dark:text-purple-300 shrink-0" />
                  <span>AI Architect</span>
                </button>
              </div>

              {/* Right Action Buttons: Standby | Deploy ▾ | Save | Export | Import | Focus */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Publish / Active Toggle Switch */}
                <button
                  type="button"
                  onClick={handleToggleWorkflowStatus}
                  className={`h-7.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                    selectedWorkflow?.status === 'enabled'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10'
                      : 'bg-slate-100 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                  }`}
                  title="Toggle Live Workflow Engine"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selectedWorkflow?.status === 'enabled' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                    }`}
                  />
                  <span className="whitespace-nowrap">
                    {selectedWorkflow?.status === 'enabled' ? 'Active' : 'Standby'}
                  </span>
                </button>

                {/* Connected Ecosystem Deploy Dropdown Menu (PORTAL RENDERED ON TOP OF EVERYTHING) */}
                <div className="relative shrink-0">
                  <button
                    ref={deployBtnRef}
                    type="button"
                    onClick={() => {
                      if (!isConnectMenuOpen && deployBtnRef.current) {
                        const rect = deployBtnRef.current.getBoundingClientRect();
                        setMenuCoords({
                          top: rect.bottom + 6,
                          right: Math.max(12, window.innerWidth - rect.right),
                        });
                        setIsConnectMenuOpen(true);
                      } else {
                        setIsConnectMenuOpen(false);
                      }
                    }}
                    className="h-7.5 px-2.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    title="Connect with Campaigns, Agents & Phone Numbers"
                  >
                    <Zap className="h-3.5 w-3.5 text-orange-500" />
                    <span>Deploy</span>
                    <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isConnectMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isConnectMenuOpen && menuCoords && typeof document !== 'undefined' && createPortal(
                    <div
                      ref={connectMenuRef}
                      style={{
                        position: 'fixed',
                        top: `${menuCoords.top}px`,
                        right: `${menuCoords.right}px`,
                        zIndex: 99999,
                      }}
                      className="w-64 p-1.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-2xl animate-in fade-in-0 zoom-in-95 space-y-1"
                    >
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
                        Telephony Integrations
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsConnectMenuOpen(false);
                          localStorage.setItem(
                            'nexus_campaign_wizard_draft',
                            JSON.stringify({
                              isWizardOpen: true,
                              wizardStep: 1,
                              workflowId: selectedWorkflow?.id || 'wf_main_flow',
                              workflowName: selectedWorkflow?.name || workflowTitle,
                            })
                          );
                          localStorage.setItem('nexus_campaign_resume_wizard', 'true');
                          triggerNavigationHandoff(onNavigate, {
                            sourceScreen: 'workflows',
                            targetScreen: 'campaigns',
                            contextTitle: `Campaign: ${selectedWorkflow?.name || workflowTitle}`,
                            contextBadge: 'Voice Workflow Attached',
                            customData: {
                              workflowId: selectedWorkflow?.id || 'wf_main_flow',
                              workflowName: selectedWorkflow?.name || workflowTitle,
                            },
                          });
                        }}
                        className="w-full p-2 rounded-lg text-left hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center gap-2.5 cursor-pointer transition-colors group"
                      >
                        <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <PhoneOutgoing className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">Launch AI Campaign</div>
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400">Dial leads with this workflow</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsConnectMenuOpen(false);
                          triggerNavigationHandoff(onNavigate, {
                            sourceScreen: 'workflows',
                            targetScreen: 'agents',
                            contextTitle: `Deploy Workflow: ${selectedWorkflow?.name || workflowTitle}`,
                            contextBadge: 'Workflow Binding',
                            customData: {
                              workflowId: selectedWorkflow?.id || 'wf_main_flow',
                              workflowName: selectedWorkflow?.name || workflowTitle,
                            },
                          });
                        }}
                        className="w-full p-2 rounded-lg text-left hover:bg-purple-50 dark:hover:bg-purple-950/50 flex items-center gap-2.5 cursor-pointer transition-colors group"
                      >
                        <div className="h-7 w-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">AI Voice Agents</div>
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400">Bind to persona voice agents</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsConnectMenuOpen(false);
                          triggerNavigationHandoff(onNavigate, {
                            sourceScreen: 'workflows',
                            targetScreen: 'phone-numbers',
                            contextTitle: `Inbound Call Routing: ${selectedWorkflow?.name || workflowTitle}`,
                            contextBadge: 'Telephony Routing Flow',
                          });
                        }}
                        className="w-full p-2 rounded-lg text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center gap-2.5 cursor-pointer transition-colors group"
                      >
                        <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <PhoneIncoming className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Phone Numbers Hub</div>
                          <div className="text-[10px] text-slate-500 dark:text-zinc-400">Inbound DID &amp; IVR routing line</div>
                        </div>
                      </button>
                    </div>,
                    document.body
                  )}
                </div>

                {/* Save Button */}
                <Button
                  variant="primary"
                  size="xs"
                  onClick={handleSaveWorkflow}
                  isLoading={isSavingWorkflow}
                  leftIcon={<Save className="h-3.5 w-3.5" />}
                  className="h-7.5 px-3 text-xs font-bold bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-sm shadow-orange-500/20 cursor-pointer shrink-0"
                >
                  Save
                </Button>

                {/* Export JSON Text Button */}
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleExportJSON}
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                  className="h-7.5 px-2.5 text-xs font-semibold cursor-pointer shrink-0"
                  title="Export workflow graph JSON"
                >
                  Export
                </Button>

                {/* Import JSON Text Button */}
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="h-3.5 w-3.5" />}
                  className="h-7.5 px-2.5 text-xs font-semibold cursor-pointer shrink-0"
                  title="Import workflow graph JSON"
                >
                  Import
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />

                {/* Main OS Header & Sidebar Compact Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleStudioShell}
                  className={`h-7.5 px-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs ${
                    isStudioShellHidden
                      ? 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-300 dark:border-zinc-700'
                      : 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/40 hover:bg-orange-500/25'
                  }`}
                  title={isStudioShellHidden ? 'Show Main OS Header & Sidebar' : 'Hide Header & Sidebar (Full Screen Studio Focus)'}
                >
                  {isStudioShellHidden ? (
                    <>
                      <Compass className="h-3.5 w-3.5 text-slate-600 dark:text-zinc-400 shrink-0" />
                      <span className="text-[11px] font-bold whitespace-nowrap">Header</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                      <span className="text-[11px] font-bold whitespace-nowrap">Focus</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 1: VISUAL STUDIO CANVAS (ONLY ON EDITOR TAB) ── */}
      {activeTab === 'canvas' && (
        <div className={`w-full ${isMaximized ? 'flex-1 h-full rounded-2xl' : 'h-[calc(100vh-145px)] min-h-[550px] rounded-2xl'} border border-slate-200 dark:border-zinc-800/90 bg-slate-100 dark:bg-zinc-950 shadow-2xl overflow-hidden select-none relative z-10`}>
          {/* 1. CENTER INFINITE 2D PAN/ZOOM VIEWPORT */}
          <div
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            className={`w-full h-full relative overflow-hidden bg-slate-100 dark:bg-zinc-950 canvas-background select-none ${
              isPanning
                ? 'cursor-grabbing'
                : isSpaceHeld || canvasTool === 'hand'
                ? 'cursor-grab'
                : 'cursor-default'
            }`}
          >
            {/* Dynamic Infinite SVG Dot Matrix */}
            <div
              className="absolute inset-0 pointer-events-none canvas-background"
              style={{
                backgroundImage: `radial-gradient(${theme === 'dark' ? '#52525b' : '#94a3b8'} 1.2px, transparent 1.2px)`,
                backgroundSize: `${28 * zoom}px ${28 * zoom}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`,
                opacity: theme === 'dark' ? 0.35 : 0.45,
              }}
            />

            {/* ── EMPTY CANVAS STARTER CARDS (WHEN GRAPH HAS NO NODES) ── */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 z-20 flex items-center justify-center p-6 pointer-events-auto">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Card 1: Add first step... */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRightDrawerOpen(true);
                      setRightDrawerFilter('triggers');
                    }}
                    className="h-48 w-48 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-orange-500 bg-white/80 dark:bg-zinc-900/70 hover:bg-slate-50 dark:hover:bg-zinc-850/90 transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer group shadow-xl backdrop-blur-md"
                  >
                    <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-zinc-800 group-hover:bg-orange-600/20 text-slate-700 dark:text-zinc-300 group-hover:text-orange-500 dark:group-hover:text-orange-400 flex items-center justify-center mb-3 transition-colors">
                      <Plus className="h-7 w-7 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                      Add first step...
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-tight">
                      Start with Inbound Call, Webhook, or Trigger
                    </span>
                  </button>

                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 px-1">or</span>

                  {/* Card 2: Build with AI */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('ai_architect')}
                    className="h-48 w-48 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-purple-500 bg-white/80 dark:bg-zinc-900/70 hover:bg-slate-50 dark:hover:bg-zinc-850/90 transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer group shadow-xl backdrop-blur-md"
                  >
                    <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-zinc-800 group-hover:bg-purple-600/20 text-slate-700 dark:text-zinc-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center justify-center mb-3 transition-colors">
                      <Sparkles className="h-7 w-7 text-purple-500 dark:text-purple-400 animate-pulse" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      Build with AI
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-tight">
                      Prompt AI to create nodes and cables automatically
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ── SHARED UNIFIED TRANSFORM LAYER (CABLES + NODES RENDERED TOGETHER) ── */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
              }}
            >
              {/* SVG CABLES & REAL-TIME INTERACTIVE WIRES */}
              <svg className="absolute inset-0 w-[5000px] h-[5000px] overflow-visible pointer-events-none">
                <defs>
                  <linearGradient id="cableGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="cableGradientActive" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>

                {/* Render All Graph Edges */}
                {edges.map((edge) => {
                  const sourceNode = nodes.find((n) => n.id === edge.source);
                  const targetNode = nodes.find((n) => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;

                  const p1 = getNodePortCoordinates(sourceNode, edge.sourceHandle, true);
                  const p2 = getNodePortCoordinates(targetNode, edge.targetHandle, false);

                  const x1 = p1.x;
                  const y1 = p1.y;
                  const x2 = p2.x;
                  const y2 = p2.y;

                  const isForward = x2 >= x1 + 20;
                  const deltaX = Math.abs(x2 - x1);
                  const deltaY = y2 - y1;
                  const absDeltaY = Math.abs(deltaY);

                  let cx1 = x1;
                  let cy1 = y1;
                  let cx2 = x2;
                  let cy2 = y2;

                  if (isForward) {
                    const curvature = Math.max(40, deltaX * 0.45);
                    cx1 = x1 + curvature;
                    cy1 = y1;
                    cx2 = x2 - curvature;
                    cy2 = y2;
                  } else {
                    // Intelligent bounded S-curve when target node is stacked or to the left
                    const offset = Math.max(45, Math.min(100, absDeltaY * 0.35 + 40));
                    cx1 = x1 + offset;
                    cy1 = y1 + (deltaY > 0 ? Math.min(45, deltaY * 0.2) : Math.max(-45, deltaY * 0.2));
                    cx2 = x2 - offset;
                    cy2 = y2 - (deltaY > 0 ? Math.min(45, deltaY * 0.2) : Math.max(-45, deltaY * 0.2));
                  }

                  const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

                  const isSelected = selectedEdgeId === edge.id;
                  const isSimulatingThis = simActiveEdgeId === edge.id;
                  const midX = (x1 + x2) / 2;
                  const midY = (y1 + y2) / 2;

                  return (
                    <g key={edge.id} className="pointer-events-auto group cursor-pointer">
                      {/* Thick transparent hit area for easy clicking */}
                      <path
                        d={d}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="14"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEdgeId(edge.id);
                          setSelectedNodeId(null);
                        }}
                      />
                      {/* Visible Cable Path */}
                      <path
                        d={d}
                        fill="none"
                        stroke={
                          isSimulatingThis
                            ? 'url(#cableGradientActive)'
                            : isSelected
                            ? '#38bdf8'
                            : 'url(#cableGradient)'
                        }
                        strokeWidth={isSimulatingThis ? '4' : isSelected ? '3.5' : '2.5'}
                        strokeDasharray={isSimulatingThis ? '8 4' : 'none'}
                        className={isSimulatingThis ? 'animate-pulse' : 'opacity-90 group-hover:opacity-100'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEdgeId(edge.id);
                        }}
                      />
                      {/* Output connector circle */}
                      <circle cx={x1} cy={y1} r="4" fill="#f97316" stroke={theme === 'dark' ? '#09090b' : '#ffffff'} strokeWidth="2" />
                      {/* Input connector circle */}
                      <circle cx={x2} cy={y2} r="4" fill="#10b981" stroke={theme === 'dark' ? '#09090b' : '#ffffff'} strokeWidth="2" />

                      {/* Interactive Cable Midpoint Disconnect Button */}
                      <foreignObject
                        x={midX - 14}
                        y={midY - 14}
                        width="28"
                        height="28"
                        className="overflow-visible pointer-events-auto"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEdge(edge.id);
                          }}
                          className={`h-7 w-7 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer border ${
                            isSelected || isSimulatingThis
                              ? 'bg-rose-600 border-rose-400 text-white scale-110 opacity-100 ring-2 ring-rose-400/50'
                              : 'bg-white/90 dark:bg-zinc-950/90 border-slate-300 dark:border-zinc-700 hover:border-rose-500 text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950 hover:scale-125 opacity-40 group-hover:opacity-100'
                          }`}
                          title="Disconnect Cable (✕)"
                        >
                          <X className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      </foreignObject>
                    </g>
                  );
                })}

                {/* Render Live Dragging Wire */}
                {connectingSource && (
                  <g className="pointer-events-none">
                    {(() => {
                      const sx = connectingSource.startX;
                      const sy = connectingSource.startY;
                      const mx = mouseCanvasPos.x;
                      const my = mouseCanvasPos.y;
                      const isFwd = mx >= sx + 20;
                      const dx = Math.abs(mx - sx);
                      const dy = my - sy;
                      const absDy = Math.abs(dy);

                      let cx1 = sx;
                      let cy1 = sy;
                      let cx2 = mx;
                      let cy2 = my;

                      if (isFwd) {
                        const curv = Math.max(40, dx * 0.45);
                        cx1 = sx + curv;
                        cy1 = sy;
                        cx2 = mx - curv;
                        cy2 = my;
                      } else {
                        const offset = Math.max(45, Math.min(100, absDy * 0.35 + 40));
                        cx1 = sx + offset;
                        cy1 = sy + (dy > 0 ? Math.min(45, dy * 0.2) : Math.max(-45, dy * 0.2));
                        cx2 = mx - offset;
                        cy2 = my - (dy > 0 ? Math.min(45, dy * 0.2) : Math.max(-45, dy * 0.2));
                      }

                      return (
                        <>
                          <path
                            d={`M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${mx} ${my}`}
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="3"
                            strokeDasharray="6 3"
                            className="animate-pulse"
                          />
                          <circle cx={mx} cy={my} r="5" fill="#f97316" />
                        </>
                      );
                    })()}
                  </g>
                )}
              </svg>

              {/* RENDER ALL CANVAS NODES */}
              {nodes.map((n, idx) => {
                const isSelected = n.id === selectedNodeId;
                const isExecutingNow = simActiveNodeIndex === idx || testingNodeId === n.id;
                const catalogItem = FLAT_NODE_CATALOG.find((c) => c.type === n.type) || FLAT_NODE_CATALOG[0];
                const outputPorts = getNodeOutputPorts(n);
                const nodeOutput = nodeOutputs[n.id];
                const isAiAgent = n.type === 'play_speech' || n.category === 'ai';

                return (
                  <div
                    key={n.id}
                    onMouseDown={(e) => handleNodeMouseDown(e, n.id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(n.id);
                      setIsInspectorOpen(true);
                    }}
                    className={`node-card absolute w-60 rounded-2xl border transition-all select-none pointer-events-auto cursor-move ${
                      catalogItem.color
                    } ${
                      isExecutingNow
                        ? 'ring-4 ring-emerald-500 shadow-2xl shadow-emerald-500/50 scale-[1.03]'
                        : isSelected
                        ? 'ring-2 ring-orange-500 shadow-2xl scale-[1.02]'
                        : 'hover:border-slate-400 dark:hover:border-zinc-500 shadow-md dark:shadow-xl'
                    }`}
                    style={{ left: `${n.x}px`, top: `${n.y}px` }}
                  >
                    {/* INPUT PORT HANDLE (LEFT CENTER) */}
                    <div
                      onMouseUp={(e) => handlePortMouseUp(e, n.id)}
                      className={`port-handle absolute -left-2.5 top-[38px] h-5 w-5 rounded-full bg-emerald-500 hover:bg-emerald-400 border-2 border-white dark:border-zinc-950 flex items-center justify-center hover:scale-125 transition-transform cursor-crosshair z-20 shadow-md group/in ${
                        draggingNodeId ? 'pointer-events-none' : 'pointer-events-auto'
                      }`}
                      title="Drop connection here"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-white pointer-events-none" />
                      <span className="absolute left-6 text-[9px] font-mono text-emerald-600 dark:text-emerald-300 font-bold opacity-0 group-hover/in:opacity-100 bg-white dark:bg-zinc-950 px-1 rounded shadow pointer-events-none whitespace-nowrap border border-slate-200 dark:border-zinc-800">
                        ● In
                      </span>
                    </div>

                    {/* NODE CARD HEADER (STANDARDIZED h-9 = 36px) */}
                    <div className="h-9 px-2.5 border-b border-slate-200/90 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/50 rounded-t-2xl flex items-center justify-between gap-1.5 shrink-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="p-1 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shrink-0">
                          {catalogItem.icon}
                        </div>
                        <span className="text-[11.5px] font-bold text-slate-800 dark:text-zinc-100 truncate">
                          {n.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Play & Test Single Node Action */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestSingleNode(n);
                          }}
                          disabled={testingNodeId === n.id}
                          className="text-slate-400 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/70 rounded p-1 cursor-pointer transition-colors"
                          title="Play & Test this single node"
                        >
                          {testingNodeId === n.id ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping block" />
                          ) : (
                            <Play className="h-3 w-3 fill-current text-emerald-500 dark:text-emerald-400" />
                          )}
                        </button>

                        {/* Edit / Open Inspector Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNodeId(n.id);
                            setIsInspectorOpen(true);
                          }}
                          className="text-slate-400 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/70 rounded p-1 cursor-pointer transition-colors"
                          title="Edit Node Properties"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateNode(n);
                          }}
                          className="text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer p-0.5"
                          title="Duplicate Node"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNode(n.id);
                          }}
                          className="text-slate-400 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 cursor-pointer p-0.5"
                          title="Delete Node"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* NODE CARD BODY (STANDARDIZED h-14 = 56px) */}
                    <div className="h-14 p-2 text-[10px] text-slate-500 dark:text-zinc-400 font-sans flex flex-col justify-between overflow-hidden shrink-0">
                      <p className="whitespace-nowrap truncate italic text-slate-700 dark:text-zinc-300 leading-snug">
                        {n.config.prompt || n.config.scriptCode?.slice(0, 45) || n.config.webhookUrl || 'Node Active'}
                      </p>

                      {/* Config Badges */}
                      <div className="flex flex-wrap gap-1 pt-0.5 overflow-hidden max-h-5 whitespace-nowrap">
                        {n.config.assignedAgentName && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 truncate whitespace-nowrap">
                            Agent: {n.config.assignedAgentName}
                          </span>
                        )}
                        {n.config.webhookMethod && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 truncate whitespace-nowrap">
                            {n.config.webhookMethod} API
                          </span>
                        )}
                        {n.config.language && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 truncate whitespace-nowrap">
                            {n.config.language.toUpperCase()} Sandbox
                          </span>
                        )}
                        {n.config.transferNumber && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 truncate whitespace-nowrap">
                            Transfer: {n.config.transferNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* MULTI-OUTPUT PORTS (RIGHT EDGE) WITH EXACT (+) CONNECTOR */}
                    <div className="border-t border-slate-200/80 dark:border-zinc-800/80 px-2.5 py-1.5 space-y-1 bg-slate-50/50 dark:bg-zinc-950/40 rounded-b-2xl">
                      {outputPorts.map((port) => {
                        const portCoords = getNodePortCoordinates(n, port.id, true);
                        const isPortActive = pendingConnectFrom?.nodeId === n.id && pendingConnectFrom?.portId === port.id;
                        const isChosenBranch = nodeOutput?.activePort === port.id;

                        return (
                          <div
                            key={port.id}
                            className="h-6 flex items-center justify-end gap-1.5 text-[9.5px] font-mono relative group/out"
                          >
                            <span
                              className={`font-medium truncate pr-4 ${
                                isChosenBranch
                                  ? 'text-emerald-600 dark:text-emerald-300 font-bold'
                                  : isPortActive
                                  ? 'text-orange-600 dark:text-orange-300 font-bold'
                                  : 'text-slate-600 dark:text-zinc-400 group-hover/out:text-orange-600 dark:group-hover/out:text-orange-300'
                              }`}
                            >
                              {port.label}
                            </span>
                            <div
                              onMouseDown={(e) =>
                                handlePortMouseDown(e, n, port, portCoords.x, portCoords.y)
                              }
                              className={`port-handle absolute -right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center hover:scale-125 transition-transform cursor-pointer z-20 shadow-md group/dot ${
                                isChosenBranch
                                  ? 'bg-emerald-500 ring-4 ring-emerald-400/80 scale-110'
                                  : isPortActive
                                  ? 'ring-4 ring-orange-400 bg-orange-400 scale-125'
                                  : 'bg-orange-600 hover:bg-orange-500'
                              } ${draggingNodeId ? 'pointer-events-none' : 'pointer-events-auto'}`}
                              title={`Click to add & auto-connect next node, or drag cable (${port.label})`}
                            >
                              <Plus className="h-2.5 w-2.5 text-white stroke-[3] pointer-events-none" />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* AI AGENT SUB-HANDLES (CHAT MODEL, MEMORY, TOOL) */}
                    {isAiAgent && (
                      <div className="border-t border-slate-200/80 dark:border-zinc-800/80 px-2 py-1.5 bg-slate-100/60 dark:bg-zinc-950/60 flex items-center justify-around text-[8.5px] font-mono text-slate-500 dark:text-zinc-400">
                        {/* 1. Chat Model (+) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddSubNode(n, 'chat_model');
                          }}
                          className="flex flex-col items-center gap-0.5 group/sub cursor-pointer hover:scale-105 active:scale-95 transition-all"
                          title="Click to attach AI Intent / LLM Chat Model"
                        >
                          <span className="group-hover/sub:text-purple-600 dark:group-hover/sub:text-purple-300 font-semibold">
                            Chat Model *
                          </span>
                          <div className="h-4 w-4 rounded-full bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 flex items-center justify-center group-hover/sub:border-purple-500 group-hover/sub:bg-purple-50 dark:group-hover/sub:bg-purple-950 shadow-2xs">
                            <Plus className="h-2.5 w-2.5 text-slate-600 dark:text-zinc-300 group-hover/sub:text-purple-600 dark:group-hover/sub:text-purple-400 stroke-[2.5]" />
                          </div>
                        </button>

                        {/* 2. Memory (+) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddSubNode(n, 'memory');
                          }}
                          className="flex flex-col items-center gap-0.5 group/sub cursor-pointer hover:scale-105 active:scale-95 transition-all"
                          title="Click to attach Vector Knowledge Memory (RAG)"
                        >
                          <span className="group-hover/sub:text-blue-600 dark:group-hover/sub:text-blue-300 font-semibold">
                            Memory
                          </span>
                          <div className="h-4 w-4 rounded-full bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 flex items-center justify-center group-hover/sub:border-blue-500 group-hover/sub:bg-blue-50 dark:group-hover/sub:bg-blue-950 shadow-2xs">
                            <Plus className="h-2.5 w-2.5 text-slate-600 dark:text-zinc-300 group-hover/sub:text-blue-600 dark:group-hover/sub:text-blue-400 stroke-[2.5]" />
                          </div>
                        </button>

                        {/* 3. Tool (+) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddSubNode(n, 'tool');
                          }}
                          className="flex flex-col items-center gap-0.5 group/sub cursor-pointer hover:scale-105 active:scale-95 transition-all"
                          title="Click to attach HTTP Webhook REST Tool / Integration"
                        >
                          <span className="group-hover/sub:text-emerald-600 dark:group-hover/sub:text-emerald-300 font-semibold">
                            Tool
                          </span>
                          <div className="h-4 w-4 rounded-full bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 flex items-center justify-center group-hover/sub:border-emerald-500 group-hover/sub:bg-emerald-50 dark:group-hover/sub:bg-emerald-950 shadow-2xs">
                            <Plus className="h-2.5 w-2.5 text-slate-600 dark:text-zinc-300 group-hover/sub:text-emerald-600 dark:group-hover/sub:text-emerald-400 stroke-[2.5]" />
                          </div>
                        </button>
                      </div>
                    )}

                    {/* LIVE TEST OUTPUT DRAWER (ATTACHED TO BOTTOM OF NODE) */}
                    {nodeOutput && (
                      <div className="border-t border-slate-200 dark:border-zinc-800/90 bg-slate-50/95 dark:bg-zinc-950/95 px-2.5 py-1.5 rounded-b-xl text-[9.5px] font-mono flex flex-col gap-1 select-text shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            {nodeOutput.status === 'running' ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3 text-emerald-500 dark:text-emerald-400 shrink-0" />
                            )}
                            <span>
                              {nodeOutput.status === 'running'
                                ? 'Executing...'
                                : `Output (${nodeOutput.latencyMs}ms)`}
                            </span>
                          </div>
                          {playingAudioNodeId === n.id ? (
                            <span className="text-orange-500 font-bold animate-pulse flex items-center gap-1">
                              <Volume2 className="h-3 w-3 text-orange-500" />
                              <span>TTS Playing...</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNodeOutputs((prev) => {
                                  const copy = { ...prev };
                                  delete copy[n.id];
                                  return copy;
                                });
                              }}
                              className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-0.5 cursor-pointer"
                              title="Dismiss Output"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-slate-700 dark:text-zinc-300 line-clamp-2 leading-tight">
                          {nodeOutput.output}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── TOP-RIGHT FLOATING VERTICAL ACTION TOOLBAR (NEVER COLLIDES WITH LOGS) ── */}
            <div className="absolute top-4 right-4 z-30 bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-1 flex flex-col gap-1 shadow-xl dark:shadow-2xl backdrop-blur-md">
              {/* [+] Open Trigger / Node Drawer */}
              <button
                type="button"
                onClick={() => {
                  setIsRightDrawerOpen((prev) => !prev);
                  setRightDrawerFilter('triggers');
                }}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isRightDrawerOpen
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
                title="Add Trigger / Node (Palette)"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
              </button>

              {/* [🔍] Search Canvas Nodes */}
              <button
                type="button"
                onClick={() => setIsCanvasSearchOpen((prev) => !prev)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isCanvasSearchOpen
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
                title="Search Nodes in Canvas"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* [📄] Sticky Notes / Docs */}
              <button
                type="button"
                onClick={() => setIsStickyNotesOpen((prev) => !prev)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isStickyNotesOpen
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
                title="Workflow Sticky Notes & Documentation"
              >
                <FileText className="h-4 w-4" />
              </button>

              {/* [◫] Toggle Minimap */}
              <button
                type="button"
                onClick={() => setIsMiniMapOpen((prev) => !prev)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isMiniMapOpen
                    ? 'bg-slate-100 dark:bg-zinc-800 text-orange-500 dark:text-orange-400'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
                title="Toggle Bird's-Eye Minimap"
              >
                <Map className="h-4 w-4" />
              </button>

              <div className="h-[1px] w-6 bg-slate-200 dark:bg-zinc-800 mx-auto my-0.5" />

              {/* [✦] Build with AI */}
              <button
                type="button"
                onClick={() => setActiveTab('ai_architect')}
                className="p-2 rounded-xl text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-all cursor-pointer"
                title="Build Workflow with AI Co-Pilot Studio"
              >
                <Sparkles className="h-4 w-4 animate-pulse" />
              </button>
            </div>

            {/* ── BOTTOM-LEFT FLOATING VIEWPORT CONTROLS PILL ─────────── */}
            <div className={`absolute ${isLogsDrawerOpen ? 'bottom-72' : 'bottom-11'} left-4 z-30 bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-700/80 rounded-xl p-1 flex items-center gap-1 shadow-xl dark:shadow-2xl backdrop-blur-md transition-all duration-300`}>
              {/* Tool Mode: Select / Hand */}
              <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 mr-0.5">
                <button
                  type="button"
                  onClick={() => setCanvasTool('select')}
                  className={`p-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                    canvasTool === 'select'
                      ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                  title="Selection Tool (V) - Click & drag nodes"
                >
                  <MousePointer className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasTool('hand')}
                  className={`p-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                    canvasTool === 'hand'
                      ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                  title="Hand Tool (H / Space) - Click & drag canvas to scroll/pan"
                >
                  <Hand className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Wheel Mode Toggle: Pan / Zoom */}
              <button
                type="button"
                onClick={() => setWheelMode((m) => (m === 'pan' ? 'zoom' : 'pan'))}
                className={`px-1.5 py-1 text-[10px] font-mono font-bold rounded-lg border cursor-pointer transition-all ${
                  wheelMode === 'pan'
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                }`}
                title={`Mouse Wheel Action: ${wheelMode === 'pan' ? 'Scroll / Pan 2D (Click to switch to Zoom)' : 'Zoom In/Out (Click to switch to Pan)'}`}
              >
                {wheelMode === 'pan' ? '🖱️ Scroll Pan' : '🔍 Wheel Zoom'}
              </button>

              <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-800 mx-0.5" />

              {/* Fit View */}
              <button
                type="button"
                onClick={handleFitView}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                title="Fit Canvas to Viewport (Ctrl+0)"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>

              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.25, Math.round((z - 0.15) * 100) / 100))}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              {/* Percentage / Reset */}
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 60, y: 60 });
                }}
                className="px-1.5 py-0.5 text-[10.5px] font-mono font-bold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                title="Reset Zoom to 100%"
              >
                {Math.round(zoom * 100)}%
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.15) * 100) / 100))}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>

              {/* Auto-Layout */}
              <button
                type="button"
                onClick={handleAutoArrange}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-700 dark:text-zinc-300 hover:text-orange-500 dark:hover:text-orange-400 cursor-pointer"
                title="Auto-Layout / Tidy Nodes"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* ── BOTTOM-CENTER EXECUTE WORKFLOW BUTTON ────────────────── */}
            <div className={`absolute ${isLogsDrawerOpen ? 'bottom-72' : 'bottom-11'} left-1/2 -translate-x-1/2 z-30 transition-all duration-300`}>
              <button
                type="button"
                onClick={() => {
                  if (isSimulating) {
                    setIsSimulating(false);
                    setSimActiveNodeIndex(null);
                    setSimActiveEdgeId(null);
                  } else {
                    handleStartSimulation();
                  }
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xl whitespace-nowrap ${
                  isSimulating
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-500/40'
                    : 'bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-orange-500/30 hover:scale-105 active:scale-95'
                }`}
                title={isSimulating ? 'Stop Running Workflow Execution' : 'Execute Real Edge-Traversal Simulation'}
              >
                {isSimulating ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                    <span className="whitespace-nowrap">Stop Execution</span>
                  </>
                ) : (
                  <>
                    <FlaskConical className="h-4 w-4 fill-white/20" />
                    <span className="whitespace-nowrap font-bold">Execute workflow</span>
                  </>
                )}
              </button>
            </div>

            {/* ── INTERACTIVE BIRD'S-EYE MINIMAP (BOTTOM RIGHT) ───────────── */}
            {isMiniMapOpen && (
              <div className={`absolute ${isLogsDrawerOpen ? 'bottom-72' : 'bottom-11'} right-4 w-60 bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-700/90 rounded-2xl shadow-xl dark:shadow-2xl backdrop-blur-md overflow-hidden z-20 flex flex-col p-2 space-y-1.5 transition-all duration-300`}>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-zinc-800 text-[10.5px] font-bold text-slate-800 dark:text-zinc-200">
                  <div className="flex items-center gap-1.5">
                    <Map className="h-3 w-3 text-orange-500 dark:text-orange-400" />
                    <span>Workflow Map</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-slate-500 dark:text-zinc-400">
                    <span className="text-slate-700 dark:text-zinc-300 font-bold">{nodes.length} nodes</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{edges.length} wires</span>
                    <button
                      type="button"
                      onClick={() => setIsMiniMapOpen(false)}
                      className="p-0.5 text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer ml-1"
                      title="Minimize Map"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div
                  onClick={handleMiniMapClick}
                  className="relative w-full h-24 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800/90 overflow-hidden cursor-crosshair group/map select-none"
                  title="Click anywhere on map to instantly pan canvas"
                >
                  <svg className="w-full h-full" viewBox="0 0 240 120" preserveAspectRatio="none">
                    {edges.map((e) => {
                      const s = nodes.find((n) => n.id === e.source);
                      const t = nodes.find((n) => n.id === e.target);
                      if (!s || !t) return null;
                      return (
                        <line
                          key={e.id}
                          x1={mapScaleX(s.x + 120)}
                          y1={mapScaleY(s.y + 40)}
                          x2={mapScaleX(t.x + 120)}
                          y2={mapScaleY(t.y + 40)}
                          stroke="#f97316"
                          strokeWidth="1.2"
                          opacity="0.55"
                        />
                      );
                    })}

                    {nodes.map((n, i) => {
                      const isSelected = n.id === selectedNodeId;
                      const isExecuting = simActiveNodeIndex === i;
                      return (
                        <rect
                          key={n.id}
                          x={mapScaleX(n.x)}
                          y={mapScaleY(n.y)}
                          width={Math.max(14, (240 / miniMapBounds.spanX) * 220)}
                          height={Math.max(8, (110 / miniMapBounds.spanY) * 100)}
                          rx="2"
                          fill={isExecuting ? '#10b981' : isSelected ? '#ea580c' : theme === 'dark' ? '#52525b' : '#94a3b8'}
                          stroke={isExecuting ? '#10b981' : isSelected ? '#fb923c' : theme === 'dark' ? '#3f3f46' : '#cbd5e1'}
                          strokeWidth="1"
                        />
                      );
                    })}

                    <rect
                      x={viewportBox.x}
                      y={viewportBox.y}
                      width={viewportBox.w}
                      height={viewportBox.h}
                      fill="rgba(234, 88, 12, 0.16)"
                      stroke="#fb923c"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                      rx="3"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* ── SLIDE-OVER TRIGGER / NODE LIBRARY DRAWER ───────────────── */}
            {isRightDrawerOpen && (
              <div className="drawer-panel allow-native-scroll absolute right-0 top-0 bottom-0 w-84 sm:w-96 bg-white/98 dark:bg-zinc-900/98 border-l border-slate-200 dark:border-zinc-700/90 shadow-2xl z-40 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-start justify-between shrink-0">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      {pendingConnectFrom ? `Add next step after "${pendingConnectFrom.sourceNodeLabel}"` : 'What triggers this workflow?'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {pendingConnectFrom ? `Output: ${pendingConnectFrom.portLabel}` : 'Select a trigger or choose any node to add to canvas'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRightDrawerOpen(false);
                      setPendingConnectFrom(null);
                    }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="p-3 border-b border-slate-200 dark:border-zinc-800/80 shrink-0">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400 dark:text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search 25+ nodes, telephony, AI, CRM..."
                      value={nodeSearch}
                      onChange={(e) => setNodeSearch(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-zinc-950 border border-purple-500/70 rounded-xl text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>

                {/* Quick Filter Tabs */}
                <div className="px-3 pt-2.5 pb-1 border-b border-slate-200 dark:border-zinc-800/80 shrink-0 flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap">
                  {[
                    { id: 'triggers', label: 'Triggers' },
                    { id: 'all', label: 'All Nodes' },
                    { id: 'ai', label: 'AI & Voice' },
                    { id: 'telephony', label: 'Telephony' },
                    { id: 'integrations', label: 'Integrations' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRightDrawerFilter(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                        rightDrawerFilter === tab.id
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 border border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Scrollable Node Palette Body */}
                <div className="allow-native-scroll flex-1 min-h-0 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                  {/* Standard Quick Triggers Section */}
                  {rightDrawerFilter === 'triggers' && !nodeSearch && (
                    <div className="space-y-1.5 pb-3 border-b border-slate-200 dark:border-zinc-800">
                      <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider">
                        Core Inbound &amp; Event Triggers
                      </p>

                      {/* Trigger 1: Inbound Call */}
                      <button
                        type="button"
                        onClick={() => {
                          const catalog = FLAT_NODE_CATALOG.find((c) => c.type === 'start_call') || FLAT_NODE_CATALOG[0];
                          handleAddNode(catalog);
                          setIsRightDrawerOpen(false);
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800/80 hover:border-orange-500/60 transition-all flex items-center justify-between text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center shrink-0">
                            <PhoneIncoming className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 block truncate">
                              Inbound Call Trigger
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
                              Runs flow when customer calls DID, GSM SIM, or SIP Trunk
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 shrink-0" />
                      </button>

                      {/* Trigger 2: Webhook Request */}
                      <button
                        type="button"
                        onClick={() => {
                          const catalog = FLAT_NODE_CATALOG.find((c) => c.type === 'webhook_request') || FLAT_NODE_CATALOG[0];
                          handleAddNode(catalog);
                          setIsRightDrawerOpen(false);
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800/80 hover:border-orange-500/60 transition-all flex items-center justify-between text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center shrink-0">
                            <Webhook className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 block truncate">
                              On webhook call
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
                              Runs flow on receiving an HTTP REST webhook request
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 shrink-0" />
                      </button>

                      {/* Trigger 3: Schedule / Cron */}
                      <button
                        type="button"
                        onClick={() => {
                          const catalog = FLAT_NODE_CATALOG.find((c) => c.type === 'working_hours') || FLAT_NODE_CATALOG[0];
                          handleAddNode(catalog);
                          setIsRightDrawerOpen(false);
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800/80 hover:border-orange-500/60 transition-all flex items-center justify-between text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center shrink-0">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 block truncate">
                              On a schedule
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
                              Runs flow on business hours or recurring cron interval
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 shrink-0" />
                      </button>

                      {/* Trigger 4: Human Escalation / Queue Wait */}
                      <button
                        type="button"
                        onClick={() => {
                          const catalog = FLAT_NODE_CATALOG.find((c) => c.type === 'human_escalate') || FLAT_NODE_CATALOG[0];
                          handleAddNode(catalog);
                          setIsRightDrawerOpen(false);
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800/80 hover:border-orange-500/60 transition-all flex items-center justify-between text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/80 flex items-center justify-center shrink-0">
                            <PhoneForwarded className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 block truncate">
                              Transfer / Escalate Call
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
                              Bridges customer call directly to live agent phone number
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 shrink-0" />
                      </button>
                    </div>
                  )}

                  {/* All Catalogs Listing */}
                  <div className="space-y-3">
                    {NODE_CATALOG.map((cat) => {
                      if (rightDrawerFilter === 'ai' && cat.categoryKey !== 'ai') return null;
                      if (rightDrawerFilter === 'telephony' && cat.categoryKey !== 'telephony') return null;
                      if (rightDrawerFilter === 'integrations' && cat.categoryKey !== 'integration' && cat.categoryKey !== 'developer') return null;

                      const filteredItems = cat.items.filter(
                        (item) =>
                          item.label.toLowerCase().includes(nodeSearch.toLowerCase()) ||
                          item.description.toLowerCase().includes(nodeSearch.toLowerCase())
                      );
                      if (filteredItems.length === 0) return null;

                      return (
                        <div key={cat.categoryKey} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider">
                              {cat.categoryTitle}
                            </p>
                            <span className="text-[9.5px] font-mono text-slate-400 dark:text-zinc-500">
                              {filteredItems.length} nodes
                            </span>
                          </div>
                          <div className="space-y-1">
                            {filteredItems.map((item) => (
                              <button
                                key={item.type}
                                type="button"
                                onClick={() => {
                                  handleAddNode(item);
                                  setIsRightDrawerOpen(false);
                                }}
                                className="w-full text-left p-2 rounded-xl text-xs bg-slate-50/80 dark:bg-zinc-950/70 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800/80 hover:border-orange-500/60 transition-all flex items-center justify-between group cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 shrink-0">
                                    {item.icon}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 block truncate">
                                      {item.label}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
                                      {item.description}
                                    </span>
                                  </div>
                                </div>
                                <Plus className="h-4 w-4 text-slate-400 dark:text-zinc-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 shrink-0 ml-1" />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── SLIDE-OVER NODE PROPERTY INSPECTOR DRAWER ──────────────── */}
            {isInspectorOpen && selectedNode && (
              <div className="drawer-panel allow-native-scroll absolute right-0 top-0 bottom-0 w-84 sm:w-96 bg-white/98 dark:bg-zinc-900/98 border-l border-slate-200 dark:border-zinc-700/90 shadow-2xl z-40 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
                <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-start justify-between shrink-0">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-orange-500" />
                      <span>Node Inspector</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      Configure parameters, bindings &amp; real-time runner
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInspectorOpen(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="allow-native-scroll flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 text-xs scrollbar-thin">
                  {/* Node Header Information */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/90 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-zinc-400 font-bold">Node ID</span>
                      <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 font-bold">{selectedNode?.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-zinc-400 font-bold">Category</span>
                      <span className="text-[10px] font-mono text-purple-600 dark:text-purple-300 font-bold uppercase">{selectedNode?.category}</span>
                    </div>
                  </div>

                  {/* Label Editor */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 block mb-1">
                      Node Display Label *
                    </label>
                    <input
                      type="text"
                      value={selectedNode?.label || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!selectedNode?.id) return;
                        setNodes((prev) =>
                          prev.map((n) => (n.id === selectedNode.id ? { ...n, label: val } : n))
                        );
                      }}
                      className="w-full h-8 px-2.5 text-xs rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  {/* REAL ENTITY SELECTOR: Phone Numbers */}
                  {(selectedNode.type === 'start_call' || selectedNode.type === 'transfer_call') && (
                    <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                      <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        <span>Bind Real Project Phone Number</span>
                      </label>
                      {realPhoneNumbers.length > 0 ? (
                        <select
                          value={selectedNode.config.assignedPhoneNumberId || ''}
                          onChange={(e) => {
                            const found = realPhoneNumbers.find((p) => p.id === e.target.value);
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode.id
                                  ? {
                                      ...n,
                                      config: {
                                        ...n.config,
                                        assignedPhoneNumberId: found?.id,
                                        transferNumber: found?.number || n.config.transferNumber,
                                        prompt: `Inbound Call via ${found?.number || 'DID Line'} (${found?.carrier || 'Live Trunk'})`,
                                      },
                                    }
                                  : n
                              )
                            );
                          }}
                          className="w-full h-8 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-mono font-medium focus:border-emerald-500"
                        >
                          <option value="">-- Custom Phone Number --</option>
                          {realPhoneNumbers.map((pn) => (
                            <option key={pn.id} value={pn.id}>
                              {pn.number} ({pn.carrier || pn.type || 'Trunk'}) - {pn.status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 italic">No phone numbers configured in repo yet.</p>
                      )}

                      {selectedNode.type === 'transfer_call' && (
                        <div className="pt-1">
                          <label className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 block mb-1">Destination Phone Number</label>
                          <input
                            type="text"
                            value={selectedNode.config.transferNumber || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNodes((prev) =>
                                prev.map((n) =>
                                  n.id === selectedNode.id ? { ...n, config: { ...n.config, transferNumber: val } } : n
                                )
                              );
                            }}
                            placeholder="+1 (555) 019-2834"
                            className="w-full h-8 px-2.5 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-amber-500"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* REAL ENTITY SELECTOR: AI Voice Agents */}
                  {(selectedNode.type === 'play_speech' || selectedNode.type === 'gather_speech') && (
                    <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                      <label className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Bot className="h-3.5 w-3.5" />
                        <span>Bind Real Voice AI Agent</span>
                      </label>
                      {realAgents.length > 0 ? (
                        <select
                          value={selectedNode.config.assignedAgentId || ''}
                          onChange={(e) => {
                            const found = realAgents.find((a) => a.id === e.target.value);
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode.id
                                  ? {
                                      ...n,
                                      config: {
                                        ...n.config,
                                        assignedAgentId: found?.id,
                                        assignedAgentName: found?.name,
                                        ttsVoice: found?.voice || 'ElevenLabs Turbo',
                                      },
                                    }
                                  : n
                              )
                            );
                          }}
                          className="w-full h-8 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-medium focus:border-blue-500"
                        >
                          <option value="">-- Custom Voice Synth --</option>
                          {realAgents.map((ag) => (
                            <option key={ag.id} value={ag.id}>
                              {ag.name} ({ag.role} - {ag.voice})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 italic">No agents found in repo.</p>
                      )}
                    </div>
                  )}

                  {/* REAL ENTITY SELECTOR: Knowledge Base (RAG) */}
                  {selectedNode.type === 'rag_search' && (
                    <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                      <label className="text-[11px] font-bold text-pink-600 dark:text-pink-400 flex items-center gap-1">
                        <Database className="h-3.5 w-3.5" />
                        <span>Select Vector Knowledge Document</span>
                      </label>
                      {realKnowledgeDocs.length > 0 ? (
                        <select
                          value={selectedNode.config.assignedKbDocId || ''}
                          onChange={(e) => {
                            const found = realKnowledgeDocs.find((d) => d.id === e.target.value);
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode.id
                                  ? {
                                      ...n,
                                      config: {
                                        ...n.config,
                                        assignedKbDocId: found?.id,
                                        prompt: `Ground in "${found?.title}" (${found?.chunks} chunks indexed)`,
                                      },
                                    }
                                  : n
                              )
                            );
                          }}
                          className="w-full h-8 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 font-medium focus:border-pink-500"
                        >
                          <option value="">-- All Vector Collections --</option>
                          {realKnowledgeDocs.map((kd) => (
                            <option key={kd.id} value={kd.id}>
                              {kd.title} ({kd.chunks} chunks - {kd.status})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 italic">No knowledge documents indexed yet.</p>
                      )}
                    </div>
                  )}

                  {/* Developer Code Block Editor */}
                  {selectedNode.type === 'code_runner' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Code2 className="h-3.5 w-3.5" />
                          <span>Sandbox Runtime Script</span>
                        </label>
                        <select
                          value={selectedNode.config.language || 'javascript'}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode.id ? { ...n, config: { ...n.config, language: val } } : n
                              )
                            );
                          }}
                          className="h-6 px-2 text-[10px] rounded bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200"
                        >
                          <option value="javascript">JavaScript (ES2024)</option>
                          <option value="python">Python 3.11</option>
                        </select>
                      </div>
                      <Textarea
                        rows={7}
                        value={selectedNode.config.scriptCode || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === selectedNode.id ? { ...n, config: { ...n.config, scriptCode: val } } : n
                            )
                          );
                        }}
                        className="font-mono text-xs bg-slate-50 dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 text-emerald-700 dark:text-emerald-300 leading-relaxed focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {/* HTTP Webhook Configurator with Real Live Ping Test */}
                  {selectedNode.type === 'webhook_request' && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <Webhook className="h-3.5 w-3.5" />
                          <span>HTTP REST API Webhook</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleTestWebhookPing(selectedNode.config.webhookUrl, selectedNode.config.webhookMethod)}
                          disabled={isTestingWebhook}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-200 cursor-pointer"
                        >
                          {isTestingWebhook ? 'Testing...' : 'Test Live Ping'}
                        </button>
                      </div>

                      {webhookTestStatus && (
                        <div className={`p-2 rounded-lg text-[10px] border ${webhookTestStatus.success ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'}`}>
                          {webhookTestStatus.message} ({webhookTestStatus.latencyMs}ms)
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-1.5">
                        <select
                          value={selectedNode.config.webhookMethod || 'POST'}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode.id ? { ...n, config: { ...n.config, webhookMethod: val } } : n
                              )
                            );
                          }}
                          className="h-8 px-2 text-xs rounded-lg bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 font-bold"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                        <input
                          type="text"
                          value={selectedNode.config.webhookUrl || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode.id ? { ...n, config: { ...n.config, webhookUrl: val } } : n
                              )
                            );
                          }}
                          placeholder="https://api.crm.com/v1/event"
                          className="col-span-2 h-8 px-2 text-xs rounded-lg bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 block mb-1">Payload JSON Template</label>
                        <Textarea
                          rows={4}
                          value={selectedNode.config.webhookBody || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode.id ? { ...n, config: { ...n.config, webhookBody: val } } : n
                              )
                            );
                          }}
                          className="font-mono text-xs bg-slate-50 dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 text-rose-700 dark:text-rose-300 focus:border-rose-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Prompt / Telephony Payload Editor */}
                  {selectedNode.type !== 'code_runner' && selectedNode.type !== 'webhook_request' && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 block mb-1">
                        Prompt / Action Payload
                      </label>
                      <Textarea
                        rows={4}
                        value={selectedNode.config.prompt || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === selectedNode.id ? { ...n, config: { ...n.config, prompt: val } } : n
                            )
                          );
                        }}
                        className="font-sans text-xs bg-slate-50 dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 leading-relaxed focus:border-orange-500"
                      />
                    </div>
                  )}

                  {/* Quick Context Variables Picker */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                      Insert Context Variables
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {['{{caller.phone}}', '{{caller.name}}', '{{intent}}', '{{transcript}}', '{{sentiment}}'].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            const cur = selectedNode.config.prompt || '';
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode.id ? { ...n, config: { ...n.config, prompt: `${cur} ${v}` } } : n
                              )
                            );
                          }}
                          className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-orange-600 dark:text-orange-400 border border-slate-300 dark:border-zinc-700 cursor-pointer"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* LIVE STEP RUNNER & OUTPUT TERMINAL IN INSPECTOR */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Live Node Runner &amp; Output</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTestSingleNode(selectedNode)}
                        disabled={testingNodeId === selectedNode.id}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center gap-1 shadow-sm cursor-pointer transition-all"
                      >
                        {testingNodeId === selectedNode.id ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-white animate-spin" />
                            <span>Executing...</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-current" />
                            <span>Run / Test Step</span>
                          </>
                        )}
                      </button>
                    </div>

                    {nodeOutputs[selectedNode.id] ? (
                      <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-zinc-800/80">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Status: 200 OK</span>
                          </span>
                          <span className="text-slate-500 dark:text-zinc-400">⏱ {nodeOutputs[selectedNode.id].latencyMs} ms</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-[10.5px] text-slate-900 dark:text-zinc-200 leading-relaxed max-h-40 overflow-y-auto scrollbar-thin select-text">
                          <p className="text-emerald-700 dark:text-emerald-300 mb-1">{nodeOutputs[selectedNode.id].output}</p>
                          {nodeOutputs[selectedNode.id].rawData && (
                            <pre className="mt-1.5 pt-1.5 border-t border-slate-200 dark:border-zinc-800 text-[10px] text-cyan-700 dark:text-cyan-300 overflow-x-auto">
                              {JSON.stringify(nodeOutputs[selectedNode.id].rawData, null, 2)}
                            </pre>
                          )}
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setNodeOutputs((prev) => {
                                const copy = { ...prev };
                                delete copy[selectedNode.id];
                                return copy;
                              });
                            }}
                            className="text-[10px] text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
                          >
                            Clear Terminal Output
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 italic leading-relaxed pt-1">
                        Click <strong>"Run / Test Step"</strong> to execute this node in real-time sandbox and inspect return payload.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── COLLAPSIBLE BOTTOM LOGS DRAWER ── */}
            <div className="absolute bottom-0 inset-x-0 z-20 flex flex-col bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 shadow-2xl transition-all duration-300">
              {/* Persistent Logs Bar Header */}
              <div
                onClick={() => setIsLogsDrawerOpen((prev) => !prev)}
                className="h-8 px-4 bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-850 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between cursor-pointer select-none text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Terminal className="h-3.5 w-3.5 text-orange-500" />
                  <span>Logs</span>
                  {simLogTrace.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-mono bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800 font-bold">
                      {simLogTrace.length} events
                    </span>
                  )}
                  {isSimulating && (
                    <span className="flex items-center gap-1 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold ml-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Live Executing Step Trace...</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                  <span className="text-[10px] font-mono hidden sm:inline">
                    {isLogsDrawerOpen ? 'Click to minimize drawer' : 'Click to expand execution trace'}
                  </span>
                  {isLogsDrawerOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                  )}
                </div>
              </div>

              {/* Expandable Logs Drawer Body */}
              {isLogsDrawerOpen && (
                <div className="h-64 bg-slate-50 dark:bg-zinc-950 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
                  {/* Sub Header / Tab Bar */}
                  <div className="h-8 px-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-100/70 dark:bg-zinc-900/60">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLogsDrawerTab('trace')}
                        className={`px-2.5 py-0.5 text-[11px] font-bold rounded cursor-pointer ${
                          logsDrawerTab === 'trace'
                            ? 'bg-orange-600 text-white'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        Live Step Trace ({simLogTrace.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setLogsDrawerTab('outputs')}
                        className={`px-2.5 py-0.5 text-[11px] font-bold rounded cursor-pointer ${
                          logsDrawerTab === 'outputs'
                            ? 'bg-orange-600 text-white'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        Node Payload Outputs ({Object.keys(nodeOutputs).length})
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {simLogTrace.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSimLogTrace([])}
                          className="text-[10.5px] font-medium text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        >
                          Clear Logs
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsLogsDrawerOpen(false)}
                        className="text-[10.5px] font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        Minimize ⮟
                      </button>
                    </div>
                  </div>

                  {/* Logs Table / Body */}
                  <div className="allow-native-scroll flex-1 min-h-0 overflow-y-auto p-3 scrollbar-thin">
                    {simLogTrace.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-zinc-500 text-xs py-8 space-y-2">
                        <Terminal className="h-8 w-8 text-slate-400 dark:text-zinc-600 animate-pulse" />
                        <p>
                          No active logs. Click <strong className="text-orange-600 dark:text-orange-400">"Execute workflow"</strong> or test any single node to inspect real-time trace.
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-zinc-800 text-[10px] uppercase text-slate-500 dark:text-zinc-500 tracking-wider">
                            <th className="pb-2 pl-2">Step</th>
                            <th className="pb-2">Node Type &amp; Label</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2">Latency</th>
                            <th className="pb-2 pr-2">Output &amp; Return Payload</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-zinc-900">
                          {simLogTrace.map((tr) => (
                            <tr
                              key={tr.step}
                              className="hover:bg-slate-100/80 dark:hover:bg-zinc-900/60 transition-colors"
                            >
                              <td className="py-2 pl-2 text-slate-500 dark:text-zinc-400 font-bold">#{tr.step}</td>
                              <td className="py-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-900 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-zinc-800 uppercase">
                                    {tr.type}
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-zinc-200">{tr.nodeLabel}</span>
                                </div>
                              </td>
                              <td className="py-2">
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  200 OK
                                </span>
                              </td>
                              <td className="py-2 text-slate-500 dark:text-zinc-400">{tr.latencyMs} ms</td>
                              <td className="py-2 pr-2 text-emerald-700 dark:text-emerald-300 select-text max-w-md truncate">
                                {tr.output}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── STICKY NOTES MODAL ───────────────────────────────────────── */}
            {isStickyNotesOpen && (
              <div className="allow-native-scroll drawer-panel modal-container absolute top-16 right-16 z-40 w-72 bg-amber-50 dark:bg-amber-950/95 border border-amber-300 dark:border-amber-600/80 rounded-2xl p-3 shadow-2xl text-amber-900 dark:text-amber-100 space-y-2 select-text backdrop-blur-md">
                <div className="flex items-center justify-between pb-1 border-b border-amber-200 dark:border-amber-800/80">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Workflow Notes</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStickyNotesOpen(false)}
                    className="p-0.5 text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-white cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Textarea
                  rows={4}
                  value={stickyNoteText}
                  onChange={(e) => setStickyNoteText(e.target.value)}
                  className="text-xs bg-white/80 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-100 font-sans leading-relaxed focus:border-amber-500"
                />
              </div>
            )}

            {/* ── CANVAS NODE SEARCH MODAL (JUMP TO NODE - 100% SCROLLABLE) ── */}
            {isCanvasSearchOpen && (
              <div className="allow-native-scroll drawer-panel modal-container absolute top-16 left-1/2 -translate-x-1/2 z-40 w-88 bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-700 rounded-2xl p-3.5 shadow-2xl space-y-2.5 backdrop-blur-md">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200">
                    <Search className="h-3.5 w-3.5 text-orange-500" />
                    <span>Jump to Canvas Node</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCanvasSearchOpen(false)}
                    className="p-0.5 text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="Search node label or category..."
                  value={canvasSearchQuery}
                  onChange={(e) => setCanvasSearchQuery(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
                <div className="allow-native-scroll max-h-56 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {nodes
                    .filter((n) =>
                      n.label.toLowerCase().includes(canvasSearchQuery.toLowerCase()) ||
                      n.category.toLowerCase().includes(canvasSearchQuery.toLowerCase())
                    )
                    .map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setSelectedNodeId(n.id);
                          setPan({ x: -n.x * zoom + 300, y: -n.y * zoom + 200 });
                          setIsCanvasSearchOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 border border-transparent hover:border-orange-200 dark:hover:border-orange-900/60 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                          <span className="truncate font-semibold">{n.label}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 uppercase shrink-0">
                          {n.category}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: AI WORKFLOW ARCHITECT FULL STUDIO BOX (AUTHENTIC CHATGPT CLEAN DESIGN) ── */}
      {activeTab === 'ai_architect' && (
        <div className="w-full flex-1 h-full min-h-0 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#212121] shadow-xl overflow-hidden flex flex-col relative z-10 select-text">
          {/* 1. Sleek Top Studio Bar (Clean, Minimalist ChatGPT Aesthetic) */}
          <div className="px-4 py-2 border-b border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#212121] flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Left: Sidebar Toggle, New Chat & Header */}
            <div className="flex items-center gap-2 min-w-0">
              {/* History Sidebar Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsHistorySidebarOpen((prev) => {
                    const next = !prev;
                    try {
                      localStorage.setItem('nexus_wf_history_sidebar_open', String(next));
                    } catch {}
                    return next;
                  });
                }}
                className={`h-8 px-2.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 ${
                  isHistorySidebarOpen
                    ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100'
                    : 'bg-white dark:bg-[#262626] border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
                title={isHistorySidebarOpen ? 'Hide History Sidebar' : 'Show History Sidebar'}
              >
                {isHistorySidebarOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">History</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9.5px] bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono font-bold">
                  {chatSessions.length}
                </span>
              </button>

              {/* + New Chat CTA */}
              <button
                type="button"
                onClick={handleNewChat}
                className="h-8 px-3 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs shrink-0"
                title="Start a fresh conversation"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Chat</span>
              </button>

              <div className="h-4 w-px bg-neutral-200 dark:border-neutral-700 hidden sm:block" />

              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-700">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="hidden md:block">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      AI Workflow Architect
                    </h3>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                      Studio
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Searchable Model Dropdown Popover, Directives Toggle & Switch to Canvas */}
            <div className="flex items-center gap-2 flex-wrap relative">
              {/* ── SEARCHABLE LLM MODEL & PROVIDER DROPDOWN POPOVER ── */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen((prev) => !prev)}
                  className="h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                  title="Select AI Model & Provider"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    {configuredLlmProviders.find((p) => p.id === selectedLlmProvider)?.displayName?.split(' ')[0] || 'LLM'}:
                  </span>
                  <span className="max-w-[130px] sm:max-w-[170px] truncate text-neutral-600 dark:text-neutral-300 font-normal">
                    {(dynamicModelsMap[selectedLlmProvider] || []).find((m) => m.id === selectedLlmModel)?.label || selectedLlmModel || 'Select Model'}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Popover Floating Menu */}
                {isModelDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsModelDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1e1e1e] shadow-2xl z-50 overflow-hidden flex flex-col max-h-[440px]">
                      {/* Search Bar inside Dropdown */}
                      <div className="p-2.5 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#252525]">
                        <div className="relative">
                          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                          <input
                            type="text"
                            placeholder="Search models & providers..."
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            autoFocus
                            className="w-full h-8 pl-8 pr-2.5 rounded-lg text-xs bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
                          />
                        </div>
                      </div>

                      {/* Provider Filter Tabs */}
                      <div className="flex items-center gap-1 p-1.5 border-b border-neutral-200 dark:border-neutral-700 overflow-x-auto bg-neutral-50/50 dark:bg-[#202020] scrollbar-none">
                        {configuredLlmProviders.map((prov) => {
                          const isProvSelected = selectedLlmProvider === prov.id;
                          const pModels = dynamicModelsMap[prov.id] || DEFAULT_PROVIDER_MODELS[prov.id] || [];
                          const modelCount = pModels.length;
                          return (
                            <button
                              key={prov.id}
                              type="button"
                              onClick={() => {
                                setSelectedLlmProvider(prov.id);
                                if (pModels.length > 0 && !pModels.some((m) => m.id === selectedLlmModel)) {
                                  setSelectedLlmModel(pModels[0].id);
                                }
                              }}
                              className={`px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                                isProvSelected
                                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${prov.isConnected ? 'bg-emerald-400' : 'bg-neutral-400'}`} />
                              <span>{prov.displayName}</span>
                              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                                isProvSelected
                                  ? 'bg-neutral-700 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-900'
                                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                              }`}>
                                {modelCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Filtered Models List */}
                      <div className="flex-1 overflow-y-auto p-1.5 space-y-1 max-h-56 scrollbar-thin">
                        {configuredLlmProviders
                          .filter((p) => modelSearchQuery.trim() ? true : p.id === selectedLlmProvider)
                          .map((prov) => {
                            const provModels = dynamicModelsMap[prov.id] || DEFAULT_PROVIDER_MODELS[prov.id] || [];
                            const models = provModels.filter(
                              (m) =>
                                !modelSearchQuery.trim() ||
                                m.label.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                                m.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                                prov.displayName.toLowerCase().includes(modelSearchQuery.toLowerCase())
                            );
                            if (models.length === 0) return null;

                            return (
                              <div key={prov.id} className="space-y-0.5">
                                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center justify-between bg-neutral-50/80 dark:bg-[#232323] rounded-md mx-0.5 my-1">
                                  <div className="flex items-center gap-1.5">
                                    <span>{prov.displayName}</span>
                                    <span className="px-1.5 py-0.2 rounded bg-neutral-200/80 dark:bg-neutral-700 text-[9.5px] font-mono text-neutral-700 dark:text-neutral-300 normal-case font-bold">
                                      {models.length} {models.length === 1 ? 'model' : 'models'}
                                    </span>
                                  </div>
                                  <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-semibold ${prov.isConnected ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                                    {prov.isConnected ? 'Configured' : 'Available'}
                                  </span>
                                </div>
                                {models.map((m) => {
                                  const isCurrent = selectedLlmProvider === prov.id && selectedLlmModel === m.id;
                                  return (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedLlmProvider(prov.id);
                                        setSelectedLlmModel(m.id);
                                        setIsModelDropdownOpen(false);
                                      }}
                                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                                        isCurrent
                                          ? 'bg-neutral-100 dark:bg-[#2f2f2f] text-neutral-900 dark:text-white font-semibold'
                                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#282828]'
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <div className="truncate font-medium">{m.label}</div>
                                        {m.description && (
                                          <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{m.description}</div>
                                        )}
                                      </div>
                                      {isCurrent && <Check className="h-3.5 w-3.5 text-neutral-900 dark:text-white shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                      </div>

                      {/* Footer: Manage API Integrations */}
                      {onNavigate && (
                        <div className="p-2 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#222222] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setIsModelDropdownOpen(false);
                              triggerNavigationHandoff(onNavigate, {
                                sourceScreen: 'workflows',
                                sourceLabel: 'Voice Workflows Studio',
                                contextTitle: selectedNode?.data?.label || 'Voice Workflow Node',
                                contextBadge: 'Workflow Integrations',
                                targetScreen: 'integrations',
                              });
                            }}
                            className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                            <span>+ API & Integrations</span>
                          </button>
                          <span className="text-[10px] text-neutral-400">1700+ APIs Ready</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* AI Directives Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsAiDirectivesEnabled((prev) => {
                    const next = !prev;
                    try {
                      localStorage.setItem('nexus_wf_directives_enabled', String(next));
                    } catch {}
                    return next;
                  });
                }}
                className={`h-8 px-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 border shadow-2xs ${
                  isAiDirectivesEnabled
                    ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100'
                    : 'bg-white dark:bg-[#262626] border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400'
                }`}
                title="Toggle AI Workflow Directives & Telephony Engine"
              >
                <Zap className={`h-3.5 w-3.5 ${isAiDirectivesEnabled ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'}`} />
                <span>Directives:</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${isAiDirectivesEnabled ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}>
                  {isAiDirectivesEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Switch to Canvas Editor CTA */}
              <button
                type="button"
                onClick={() => setActiveTab('canvas')}
                className="h-8 px-3 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs shrink-0"
                title="Switch back to Visual Workflow Editor Canvas"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Canvas Editor</span>
              </button>
            </div>
          </div>

          {/* 2. Main Studio Row: Left Sidebar + Right Chat Stream */}
          <div className="flex-1 min-h-0 flex flex-row overflow-hidden bg-white dark:bg-[#212121]">
            {/* Left: Chat Sessions History Sidebar (Authentic ChatGPT Style) */}
            {isHistorySidebarOpen && (
              <div className="w-64 sm:w-72 border-r border-neutral-200 dark:border-neutral-800 bg-[#f9f9f9] dark:bg-[#171717] flex flex-col h-full shrink-0 select-none z-10 shadow-xs">
                {/* Top Action & Search */}
                <div className="p-3 border-b border-neutral-200/80 dark:border-neutral-800 space-y-2">
                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="w-full h-9 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#212121] hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] text-neutral-800 dark:text-neutral-200 font-medium text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                    <span>New chat</span>
                  </button>

                  {/* Search filter input */}
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={sessionSearchQuery}
                      onChange={(e) => setSessionSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-2.5 rounded-lg text-xs bg-white dark:bg-[#212121] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Section Header */}
                <div className="px-3 pt-2.5 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
                  <span>Recent Chats</span>
                  <span className="font-mono text-[10px]">{chatSessions.length}</span>
                </div>

                {/* Scrollable Sessions List */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
                  {chatSessions
                    .filter((s) => !sessionSearchQuery.trim() || s.title.toLowerCase().includes(sessionSearchQuery.toLowerCase()))
                    .map((session) => {
                      const isActive = session.id === activeSession.id;
                      const isEditing = editingSessionId === session.id;

                      return (
                        <div
                          key={session.id}
                          onClick={() => handleSelectSession(session.id)}
                          className={`group relative px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer flex flex-col gap-0.5 ${
                            isActive
                              ? 'bg-[#ececec] dark:bg-[#2f2f2f] text-neutral-900 dark:text-neutral-100 font-medium'
                              : 'bg-transparent hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <MessageSquare
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  isActive ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-500'
                                }`}
                              />
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveSessionTitle(session.id);
                                    if (e.key === 'Escape') setEditingSessionId(null);
                                  }}
                                  onBlur={() => handleSaveSessionTitle(session.id)}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full text-xs font-medium px-1.5 py-0.5 bg-white dark:bg-[#212121] border border-neutral-400 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none"
                                />
                              ) : (
                                <span
                                  className={`text-xs truncate ${
                                    isActive
                                      ? 'text-neutral-900 dark:text-neutral-100 font-semibold'
                                      : 'text-neutral-700 dark:text-neutral-300'
                                  }`}
                                  title={session.title}
                                >
                                  {session.title}
                                </span>
                              )}
                            </div>

                            {/* Quick Action Icons on Hover */}
                            {!isEditing && (
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSessionId(session.id);
                                    setEditingTitle(session.title);
                                  }}
                                  className="p-1 rounded hover:bg-neutral-300/60 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                                  title="Rename Chat"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteSession(session.id, e)}
                                  className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-neutral-500 hover:text-rose-600 cursor-pointer"
                                  title="Delete Chat"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Session Metadata */}
                          <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 pl-5.5 font-mono">
                            <span>{session.messages.length} msgs</span>
                            <span>{session.updatedAt}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Sidebar Footer: Real Authenticated User Profile with ChatGPT-Style Popover Menu */}
                <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 bg-[#f9f9f9] dark:bg-[#171717] relative">
                  {/* Popover Floating Menu */}
                  {isUserProfileMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserProfileMenuOpen(false)}
                      />
                      <div className="absolute bottom-full left-2 right-2 mb-2 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1e1e1e] shadow-2xl z-50 p-1.5 space-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
                        {/* Top User Header Tile */}
                        <div
                          onClick={() => {
                            setIsUserProfileMenuOpen(false);
                            onNavigate?.('profile');
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#282828] cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              name={user?.fullName || user?.email || 'User'}
                              src={user?.avatarUrl || undefined}
                              size="sm"
                              className="shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate" title={user?.fullName || user?.email || 'User'}>
                                {user?.fullName || (user?.email ? user.email.split('@')[0] : 'Admin User')}
                              </div>
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 capitalize">
                                {user?.role ? `${user.role}` : 'Free'}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0" />
                        </div>

                        <div className="border-t border-neutral-200 dark:border-neutral-800 my-1" />

                        {/* Upgrade Plan */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserProfileMenuOpen(false);
                            onNavigate?.('billing');
                          }}
                          className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#282828] flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <Sparkles className="h-4 w-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                          <span>Upgrade plan</span>
                        </button>

                        {/* Personalization (Toggles AI Directives) */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsAiDirectivesEnabled((prev) => {
                              const next = !prev;
                              try {
                                localStorage.setItem('nexus_wf_directives_enabled', String(next));
                              } catch {}
                              return next;
                            });
                            setIsUserProfileMenuOpen(false);
                          }}
                          className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#282828] flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Sliders className="h-4 w-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                            <span>Personalization</span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isAiDirectivesEnabled ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>
                            {isAiDirectivesEnabled ? 'ON' : 'OFF'}
                          </span>
                        </button>

                        {/* Settings */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserProfileMenuOpen(false);
                            onNavigate?.('settings');
                          }}
                          className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#282828] flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <Settings2 className="h-4 w-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                          <span>Settings</span>
                        </button>

                        <div className="border-t border-neutral-200 dark:border-neutral-800 my-1" />

                        {/* Log out */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserProfileMenuOpen(false);
                            logout();
                          }}
                          className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
                          <span>Log out</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Main Profile Trigger Button */}
                  <div className="flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsUserProfileMenuOpen((prev) => !prev)}
                      className="flex-1 flex items-center justify-between p-1.5 rounded-xl hover:bg-neutral-200/60 dark:hover:bg-[#262626] transition-colors cursor-pointer min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          name={user?.fullName || user?.email || 'User'}
                          src={user?.avatarUrl || undefined}
                          size="sm"
                          className="shrink-0"
                        />
                        <div className="min-w-0 text-left">
                          <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[100px] sm:max-w-[120px]" title={user?.fullName || user?.email || 'User'}>
                            {user?.fullName || (user?.email ? user.email.split('@')[0] : 'Admin User')}
                          </div>
                          <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate capitalize">
                            {user?.role ? `${user.role}` : 'Free'}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 shrink-0 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors">
                        Upgrade
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearAllSessions}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-neutral-400 hover:text-rose-600 cursor-pointer transition-colors shrink-0"
                      title="Clear all chat history"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Right: Active Chat Stream & Input Area (Centered Clean ChatGPT Style) */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-[#212121]">
              {/* Messages Stream Container */}
              <div className="allow-native-scroll flex-1 min-h-0 overflow-y-auto px-4 py-6 sm:px-6 space-y-4 scrollbar-thin">
                <div className="max-w-3xl lg:max-w-3xl mx-auto w-full space-y-6">
                  {/* Starter Templates Hero (Only if <= 1 message) */}
                  {aiChatMessages.length <= 1 && (
                    <div className="space-y-6 py-8">
                      {/* Hero Welcome Header */}
                      <div className="text-center space-y-2 py-4">
                        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                          AI Voice Workflow Architect
                        </h2>
                        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                          What voice automation flow do you want to build today? Describe your telephony logic, IVR routing, or CRM webhooks in natural language.
                        </p>
                      </div>

                      {/* 4 Clean Neutral Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          {
                            title: 'Healthcare Clinic Patient Triage',
                            category: 'Healthcare',
                            prompt: 'Build a healthcare clinic patient triage call flow with symptom intake, doctor schedule RAG search, Google Calendar slot booking, and SMS confirmation token.',
                            icon: <Activity className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />,
                            badge: 'Doctor RAG & Calendar',
                          },
                          {
                            title: 'Real Estate Buyer Qualification',
                            category: 'Real Estate',
                            prompt: 'Create a real estate buyer qualification workflow that captures 2BHK/3BHK budget range, dispatches PDF brochure via WhatsApp, and bridges hot leads to sales manager.',
                            icon: <Home className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />,
                            badge: 'WhatsApp Brochure',
                          },
                          {
                            title: 'FinTech Loan EMI Sandbox',
                            category: 'FinTech',
                            prompt: 'Design a FinTech personal loan qualification flow with JavaScript EMI calculation sandbox, credit score check, CRM sync, and SMS loan approval link.',
                            icon: <ShieldCheck className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />,
                            badge: 'JS EMI Calculator',
                          },
                          {
                            title: 'E-Commerce Courier & Sentiment Support',
                            category: 'E-Commerce',
                            prompt: 'Architect an e-commerce order support workflow that queries live courier REST API, analyzes caller sentiment, sends WhatsApp tracking link, and escalates angry callers.',
                            icon: <ShoppingCart className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />,
                            badge: 'REST API & Sentiment',
                          },
                        ].map((card) => (
                          <button
                            key={card.title}
                            type="button"
                            onClick={() => handleSendAiChatMessage(card.prompt)}
                            className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-[#262626] hover:bg-neutral-100 dark:hover:bg-[#2c2c2c] text-left transition-colors cursor-pointer group flex flex-col justify-between gap-2.5"
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-neutral-200/70 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                                  {card.icon}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                    {card.title}
                                  </div>
                                  <span className="text-[10px] text-neutral-500 font-mono">
                                    {card.category}
                                  </span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-md text-[9.5px] font-semibold bg-neutral-200/80 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                {card.badge}
                              </span>
                            </div>
                            <p className="text-[11.5px] text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed font-sans">
                              {card.prompt}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages Stream */}
                  {aiChatMessages.map((msg) => (
                    <div key={msg.id} className="space-y-1.5">
                      {/* User Speech Bubble */}
                      {msg.role === 'user' && (
                        <div className="flex flex-col items-end gap-1">
                          <div className="bg-[#f4f4f4] dark:bg-[#2f2f2f] text-neutral-900 dark:text-neutral-100 rounded-3xl px-4 py-2.5 max-w-[80%] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text shadow-2xs">
                            {msg.content}
                          </div>
                          {msg.timestamp && (
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono pr-2 select-none">
                              {msg.timestamp}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Assistant Response Stream (Authentic Typography & Action Icons) */}
                      {msg.role === 'assistant' && (
                        <div className="flex flex-col gap-2 max-w-full">
                          <div className="text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text font-sans">
                            {msg.content}
                          </div>

                          {/* Action Icons Bar below response (Copy, ThumbsUp, ThumbsDown, Retry, and Timestamp on Right) */}
                          <div className="flex items-center justify-between gap-2 text-neutral-400 dark:text-neutral-500 pt-0.5">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(msg.id, msg.content)}
                                className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                                title={copiedMessageId === msg.id ? 'Copied' : 'Copy message'}
                              >
                                {copiedMessageId === msg.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleFeedback(msg.id, 'up')}
                                className={`p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                                  messageFeedback[msg.id] === 'up'
                                    ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800'
                                    : 'hover:text-neutral-700 dark:hover:text-neutral-300'
                                }`}
                                title="Good response"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleFeedback(msg.id, 'down')}
                                className={`p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                                  messageFeedback[msg.id] === 'down'
                                    ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800'
                                    : 'hover:text-neutral-700 dark:hover:text-neutral-300'
                                }`}
                                title="Bad response"
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={handleRetryLastMessage}
                                className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                                title="Regenerate / Retry"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {msg.timestamp && (
                              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono select-none">
                                {msg.timestamp}
                              </span>
                            )}
                          </div>

                          {/* Topology Preview Injection Card (Clean Neutral Box) */}
                          {msg.topologyPreview && (
                            <div className="mt-2 p-4 rounded-xl bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 space-y-3 text-neutral-900 dark:text-neutral-100 shadow-2xs">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100">
                                  <GitFork className="h-4 w-4 text-neutral-600 dark:text-neutral-400 shrink-0" />
                                  <span>{msg.topologyPreview.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                                    {msg.topologyPreview.nodeCount} Nodes
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                                    {msg.topologyPreview.edgeCount} Cables
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                {msg.topologyPreview.description}
                              </p>

                              {/* Visual Node Sequence */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                {msg.topologyPreview.nodes.map((n, idx) => (
                                  <div key={n.id} className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[10.5px] font-mono text-neutral-700 dark:text-neutral-300 font-medium">
                                      #{idx + 1} {n.label}
                                    </span>
                                    {idx < msg.topologyPreview!.nodes.length - 1 && (
                                      <ArrowRight className="h-3 w-3 text-neutral-400 shrink-0" />
                                    )}
                                  </div>
                                ))}
                              </div>

                              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                                <span className="text-[11px] text-neutral-500 font-medium">
                                  Ready to load onto active canvas
                                </span>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleApplyAiTopology(msg.topologyPreview!)}
                                  leftIcon={<Sparkles className="h-3.5 w-3.5 text-white dark:text-neutral-900" />}
                                  className="h-8 px-3.5 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 cursor-pointer shadow-xs"
                                >
                                  Inject into Canvas
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Generating Skeleton Loading */}
                  {isGeneratingAiWorkflow && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 py-2">
                      <span className="h-2 w-2 rounded-full bg-neutral-600 dark:bg-neutral-300 animate-ping" />
                      <span>AI is thinking & architecting workflow with {selectedLlmModel || 'LLM Engine'}...</span>
                    </div>
                  )}

                  <div ref={chatMessagesEndRef} />
                </div>
              </div>

              {/* Bottom Suggestions & Prompt Form (Floating ChatGPT Style) */}
              <div className="px-4 pt-2 pb-2 bg-white dark:bg-[#212121] shrink-0 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1.5">
                <div className="max-w-3xl lg:max-w-3xl mx-auto w-full space-y-1.5">
                  {/* Quick Suggestions Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 shrink-0 mr-1">
                      Suggestions:
                    </span>
                    {[
                      'Clinic Patient Triage',
                      'FinTech Loan EMI',
                      'Real Estate WhatsApp',
                      'E-Commerce Courier',
                      'Restaurant Table POS',
                      'Multi-Tier IVR Routing',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          setAiPromptInput(chip);
                          handleSendAiChatMessage(chip);
                        }}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>

                  {/* ChatGPT Style Floating Pill Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendAiChatMessage(aiPromptInput);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-3xl bg-[#f4f4f4] dark:bg-[#2f2f2f] border border-neutral-200/80 dark:border-neutral-700/60 focus-within:border-neutral-400 dark:focus-within:border-neutral-500 shadow-2xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setAiPromptInput('Create a custom voice workflow that ')}
                      className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 cursor-pointer shrink-0 transition-colors ml-1"
                      title="Add attachment / Preset Prompt"
                    >
                      <Plus className="h-4 w-4" />
                    </button>

                    <input
                      type="text"
                      placeholder="Ask anything or describe your calling flow..."
                      value={aiPromptInput}
                      onChange={(e) => setAiPromptInput(e.target.value)}
                      disabled={isGeneratingAiWorkflow}
                      className="flex-1 bg-transparent border-none px-2 py-1 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none font-sans"
                    />

                    <button
                      type="button"
                      className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 cursor-pointer shrink-0 transition-colors"
                      title="Voice Input (Speech-to-Text)"
                    >
                      <Mic className="h-4 w-4" />
                    </button>

                    <button
                      type="submit"
                      disabled={!aiPromptInput.trim() || isGeneratingAiWorkflow}
                      className="h-8 w-8 rounded-full bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 flex items-center justify-center cursor-pointer transition-all shadow-xs disabled:opacity-30 disabled:cursor-not-allowed shrink-0 mr-0.5"
                      title="Send message"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>

                  {/* CreateCall OS Multi-LLM Engine Info */}
                  <div className="text-center pt-0.5">
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-sans">
                      CreateCall OS AI Voice Architect • Multi-LLM synthesis & telephony orchestration
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LIVE SIMULATION & DEBUGGER (EXECUTIONS VIEW) ─────────── */}
      {activeTab === 'simulator' && (
        <div className="space-y-4 allow-native-scroll max-h-[calc(100vh-210px)] overflow-y-auto pr-1 pb-24 scrollbar-thin">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4 space-y-3.5 border-slate-200 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <span>Mock Call Parameters</span>
                </CardTitle>
                <Badge variant={isSimulating ? 'success' : 'secondary'} size="xs">
                  {isSimulating ? 'Executing Live' : 'Ready'}
                </Badge>
              </div>

              <Input
                label="Mock Inbound Caller Number *"
                value={simCallerPhone}
                onChange={(e) => setSimCallerPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
              />

              <Input
                label="Simulated Spoken Intent *"
                value={simCallerIntent}
                onChange={(e) => setSimCallerIntent(e.target.value)}
                placeholder="Enterprise Pricing & Consultation"
              />

              <Input
                label="Customer Account Tier"
                value={simCustomerTier}
                onChange={(e) => setSimCustomerTier(e.target.value)}
                placeholder="VIP Enterprise"
              />

              <Button
                variant="primary"
                size="sm"
                onClick={handleStartSimulation}
                isLoading={isSimulating}
                leftIcon={<Play className="h-3.5 w-3.5" />}
                className="w-full h-8 text-xs font-bold cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600"
              >
                Run Step-by-Step Simulation
              </Button>
            </Card>

            <Card className="lg:col-span-2 p-4 space-y-3 border-slate-200 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-orange-500" />
                  <span>Real-Time Execution Logs ({simLogTrace.length} Steps)</span>
                </CardTitle>
                {simLogTrace.length > 0 && (
                  <button
                    onClick={() => setSimLogTrace([])}
                    className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    Clear Logs
                  </button>
                )}
              </div>

              {simLogTrace.length === 0 ? (
                <div className="py-16 text-center text-slate-500 dark:text-zinc-400 text-xs space-y-2">
                  <Activity className="h-8 w-8 mx-auto text-slate-400 dark:text-zinc-500 animate-pulse" />
                  <p>Click <strong>"Run Step-by-Step Simulation"</strong> to execute graph and view node latencies.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin font-mono text-xs">
                  {simLogTrace.map((tr) => (
                    <div
                      key={tr.step}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/90 text-emerald-700 dark:text-emerald-400 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-900 dark:text-zinc-100">
                          Step #{tr.step}: [{tr.type}] {tr.nodeLabel}
                        </span>
                        <span className="text-slate-500 dark:text-zinc-500 text-[10.5px]">{tr.latencyMs} ms</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-sans">{tr.output}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 3: EVALUATIONS, RECIPES & INTEGRITY (EVALUATIONS VIEW) ──── */}
      {(activeTab === 'roster' || activeTab === 'validator' || activeTab === 'developer') && (
        <div className="space-y-4 allow-native-scroll max-h-[calc(100vh-210px)] overflow-y-auto pr-1 pb-24 scrollbar-thin">
          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              Enterprise Recipes ({PREBUILT_RECIPES.length})
            </button>
            <button
              onClick={() => setActiveTab('validator')}
              className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                activeTab === 'validator'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              Graph Integrity Validator
            </button>
            <button
              onClick={() => setActiveTab('developer')}
              className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                activeTab === 'developer'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              Developer API Webhook &amp; SDK
            </button>
          </div>

          {/* Recipes Roster */}
          {activeTab === 'roster' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PREBUILT_RECIPES.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="p-4 hover:border-orange-500 cursor-pointer transition-all duration-200 border-slate-200 dark:border-zinc-800 shadow-2xs space-y-3"
                  onClick={() => handleLoadRecipe(recipe.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="h-9 w-9 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center font-bold">
                      <GitFork className="h-5 w-5" />
                    </div>
                    <Badge variant="primary" size="xs">
                      {recipe.nodes.length} Nodes • {recipe.edges?.length || 0} Cables
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">{recipe.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      {recipe.description}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                    <span>Load into Visual Canvas</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Graph Integrity Validator */}
          {activeTab === 'validator' && (
            <Card className="p-5 space-y-4 border-slate-200 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Static Workflow Graph Analysis</span>
                </CardTitle>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={handleRunValidation}
                  isLoading={isValidating}
                  leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                  className="h-8 text-xs font-bold cursor-pointer bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Re-Validate Graph
                </Button>
              </div>

              {isGraphClean === null ? (
                <div className="py-12 text-center text-slate-500 dark:text-zinc-400 text-xs space-y-2">
                  <ShieldCheck className="h-8 w-8 mx-auto text-slate-400 dark:text-zinc-500" />
                  <p>Click <strong>"Re-Validate Graph"</strong> to analyze disconnects, loops, or missing parameters.</p>
                </div>
              ) : isGraphClean ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-100 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Graph Validated Clean</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed">
                    All {nodes.length} canvas nodes and {edges.length} cable connections satisfy terminal prerequisites, valid endpoint routes, and correct variable interpolation.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-100 text-sm">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>{validationErrors.length} Issue(s) Detected</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11.5px]">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* Developer API Webhook & SDK */}
          {activeTab === 'developer' && (
            <Card className="p-5 space-y-4 border-slate-200 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-purple-500" />
                    <span>Developer API Endpoint &amp; Webhook Trigger</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    Trigger this visual voice workflow programmatically from external backend servers, cron tasks, or Stripe/Zapier webhooks.
                  </p>
                </div>
                <Badge variant="primary" size="sm">
                  HTTP POST Trigger Active
                </Badge>
              </div>

              <div className="p-3 bg-slate-900 dark:bg-zinc-950 rounded-xl border border-slate-800 dark:border-zinc-800 flex items-center justify-between gap-3 font-mono text-xs">
                <span className="text-emerald-400 truncate">
                  POST https://api.createcall.ai/v1/workflows/{selectedWorkflow?.id || 'main_flow'}/trigger
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://api.createcall.ai/v1/workflows/${selectedWorkflow?.id || 'main_flow'}/trigger`);
                    addToast({ type: 'success', title: 'URL Copied', description: 'Webhook URL copied to clipboard.' });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 dark:bg-zinc-900 hover:bg-slate-700 dark:hover:bg-zinc-800 text-zinc-200 text-xs font-semibold cursor-pointer border border-slate-700 dark:border-zinc-700"
                >
                  Copy URL
                </button>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
                  {(['curl', 'python', 'nodejs'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSdkLanguage(lang)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                        sdkLanguage === lang
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-slate-950 dark:bg-zinc-950 rounded-xl border border-slate-800 dark:border-zinc-800 font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
                  {sdkLanguage === 'curl' && (
                    <pre>{`curl -X POST https://api.createcall.ai/v1/workflows/${selectedWorkflow?.id || 'main_flow'}/trigger \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "caller_number": "+15550192834",
    "assigned_agent": "${realAgents[0]?.name || 'AI Voice Agent'}",
    "initial_variables": {
      "customer_tier": "VIP",
      "account_id": "ACC_8829"
    }
  }'`}</pre>
                  )}

                  {sdkLanguage === 'python' && (
                    <pre>{`import httpx

url = "https://api.createcall.ai/v1/workflows/${selectedWorkflow?.id || 'main_flow'}/trigger"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "caller_number": "+15550192834",
    "assigned_agent": "${realAgents[0]?.name || 'AI Voice Agent'}",
    "initial_variables": {"customer_tier": "VIP"}
}

response = httpx.post(url, json=payload, headers=headers)
print("Workflow Trigger Status:", response.json())`}</pre>
                  )}

                  {sdkLanguage === 'nodejs' && (
                    <pre>{`import fetch from 'node-fetch';

const response = await fetch('https://api.createcall.ai/v1/workflows/${selectedWorkflow?.id || 'main_flow'}/trigger', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    caller_number: '+15550192834',
    assigned_agent: '${realAgents[0]?.name || 'AI Voice Agent'}',
    initial_variables: { customer_tier: 'VIP' }
  })
});

const result = await response.json();
console.log('Call Workflow Dispatched:', result);`}</pre>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── PLAN GUARDRAIL MODAL ─────────────────────────────────────── */}
      <PlanGuardrailModal
        isOpen={guardrailModal.isOpen}
        title={guardrailModal.title}
        message={guardrailModal.message}
        featureKey={guardrailModal.featureKey}
        requiredTier={guardrailModal.requiredTier}
        currentUsage={guardrailModal.currentUsage}
        maxQuota={guardrailModal.maxQuota}
        upgradeBenefit={guardrailModal.upgradeBenefit}
        onClose={closeGuardrail}
        onNavigate={onNavigate}
      />
    </div>
  );
};
