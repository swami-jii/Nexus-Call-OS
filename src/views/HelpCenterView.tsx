import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  BookOpen,
  MessageSquare,
  Code,
  Terminal,
  Send,
  Search,
  Zap,
  Radio,
  Globe,
  PhoneCall,
  Brain,
  Shield,
  CreditCard,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Server,
  Layers,
  Sparkles,
  Smartphone,
  Headphones,
  Sliders,
  FileCode,
  ArrowUpRight,
  AlertCircle,
  Activity,
  Workflow,
  RotateCcw,
  Compass,
  FileText,
  Key,
  Flame,
  ArrowRight,
  Play,
  Bot,
  Upload,
  RefreshCw,
  BarChart2,
  Phone,
  Cpu,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Accordion } from '../components/ui/Accordion';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { ScreenId } from '../types';
import { triggerNavigationHandoff } from '../lib/handoffNavigation';

export interface HelpCenterViewProps {
  onNavigate?: (screen: ScreenId) => void;
}

type DocSection =
  | 'quickstart'
  | 'rest_api'
  | 'telephony_sip'
  | 'android_gsm'
  | 'voice_latency'
  | 'rag_memory'
  | 'billing_limits'
  | 'faqs'
  | 'support';

interface DocTopic {
  id: DocSection;
  title: string;
  badge: string;
  badgeVariant?: 'emerald' | 'blue' | 'purple' | 'amber' | 'zinc';
  icon: any;
  summary: string;
}

export const HelpCenterView: React.FC<HelpCenterViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeSection, setActiveSection] = useState<DocSection>('quickstart');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Selected Code Snippet Tab
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'javascript' | 'python'>('curl');

  // Support Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('telephony');
  const [ticketPriority, setTicketPriority] = useState('P2');
  const [ticketCallId, setTicketCallId] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSentSuccess, setTicketSentSuccess] = useState(false);

  // Smart Return Handoff Navigation Trigger
  const handleHandoffNavigate = (
    targetScreen: ScreenId,
    contextTitle: string,
    contextBadge: string = 'Help & Docs Guide'
  ) => {
    triggerNavigationHandoff(onNavigate, {
      sourceScreen: 'help',
      sourceLabel: 'Help & Documentation Hub',
      targetScreen,
      contextTitle,
      contextBadge,
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    addToast({
      type: 'success',
      title: 'Code Copied',
      description: 'Snippet copied to your clipboard.',
    });
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) {
      addToast({
        type: 'warning',
        title: 'Missing Details',
        description: 'Please describe the technical inquiry or reproduction steps.',
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setTicketSentSuccess(true);
      addToast({
        type: 'success',
        title: 'Priority Ticket Created',
        description: `Voice engineering dispatched ticket confirmation to ${user?.email || 'mukeshswami7827@gmail.com'}.`,
      });
    }, 500);
  };

  const docTopics: DocTopic[] = [
    {
      id: 'quickstart',
      title: 'Quickstart & 2-Minute Setup',
      badge: 'Step-by-Step',
      badgeVariant: 'emerald',
      icon: Sparkles,
      summary: 'Launch your first autonomous AI voice call in under 2 minutes.',
    },
    {
      id: 'rest_api',
      title: 'REST API & Webhooks Reference',
      badge: 'SDK v2.4',
      badgeVariant: 'blue',
      icon: Code,
      summary: 'Outbound dispatch, WebSocket audio streams, and real-time webhook events.',
    },
    {
      id: 'telephony_sip',
      title: 'Cloud SIP & Carrier Trunks',
      badge: 'Telephony',
      badgeVariant: 'purple',
      icon: PhoneCall,
      summary: 'Twilio, Telnyx, Asterisk, and custom SIP proxy authentication.',
    },
    {
      id: 'android_gsm',
      title: 'Android GSM Hardware Gateway',
      badge: 'Multi-SIM',
      badgeVariant: 'amber',
      icon: Smartphone,
      summary: 'Route automated AI calls through real physical SIM cards with zero carrier markup.',
    },
    {
      id: 'voice_latency',
      title: 'Voice Engines & Sub-350ms Latency',
      badge: 'Performance',
      badgeVariant: 'emerald',
      icon: Headphones,
      summary: 'STT, Gemini 1.5 Flash LLM, Cartesia/ElevenLabs TTS, and barge-in tuning.',
    },
    {
      id: 'rag_memory',
      title: 'RAG Knowledge & Memory Brain',
      badge: 'AI Memory',
      badgeVariant: 'purple',
      icon: Brain,
      summary: 'Document chunking, vector embeddings, and persistent lifetime fact retention.',
    },
    {
      id: 'billing_limits',
      title: 'Subscription Plans & Quotas',
      badge: 'Billing',
      badgeVariant: 'zinc',
      icon: CreditCard,
      summary: 'Minutes deduction, concurrency lines, Bank Wire / UPI payments, and invoices.',
    },
    {
      id: 'faqs',
      title: 'Frequently Asked Questions',
      badge: '8 Questions',
      badgeVariant: 'blue',
      icon: HelpCircle,
      summary: 'Answers to common technical, architecture, and deployment questions.',
    },
    {
      id: 'support',
      title: 'Priority Engineering Support',
      badge: 'Direct Desk',
      badgeVariant: 'emerald',
      icon: MessageSquare,
      summary: 'Direct line to senior telephony architects and voice engine engineers.',
    },
  ];

  const filteredTopics = useMemo(() => {
    if (!docSearchQuery.trim()) return docTopics;
    const q = docSearchQuery.toLowerCase().trim();
    return docTopics.filter(
      (t) => t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q)
    );
  }, [docSearchQuery, docTopics]);

  const faqsList = [
    {
      id: 'faq1',
      title: 'How does Create Call OS achieve sub-350ms voice latency?',
      content: (
        <div className="space-y-2.5">
          <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
            Create Call OS utilizes an ultra-low-jitter edge C++ &amp; Rust WebRTC proxy. Inbound audio is streamed in real-time to Deepgram Nova-2 STT (80ms), piped immediately to Gemini 1.5 Flash (82ms first token), and synthesized phoneme-by-phoneme via Cartesia Sonic and ElevenLabs Turbo 2.5 (110ms) before the client microphone even stops oscillating.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                handleHandoffNavigate(
                  'demo-studio',
                  'Sub-350ms Voice Latency Verification',
                  'FAQ #1: Latency'
                )
              }
              leftIcon={<Play className="h-3 w-3 text-emerald-500" />}
              className="text-[11px] font-semibold h-7 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
            >
              Test Latency in Live Call Studio
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: 'faq2',
      title: 'Can I connect my own custom Twilio or Telnyx SIP trunk?',
      content: (
        <div className="space-y-2.5">
          <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
            Yes! In the Phone Numbers module, you can register RFC 3261 compliant SIP credentials, specify TLS encryption, IP whitelists, and enforce G.711u / Opus codec negotiation with zero provider lock-in.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                handleHandoffNavigate(
                  'phone-numbers',
                  'RFC 3261 Cloud SIP Trunk Configuration',
                  'FAQ #2: SIP Setup'
                )
              }
              leftIcon={<PhoneCall className="h-3 w-3 text-purple-500" />}
              className="text-[11px] font-semibold h-7 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 cursor-pointer"
            >
              Configure SIP Trunks &amp; Numbers
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: 'faq3',
      title: 'How does Android GSM Hardware Multi-SIM dispatch work?',
      content: (
        <div className="space-y-2.5">
          <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
            Download our lightweight companion APK onto any Android smartphone. Scan the QR code in Android Gateway to create a secure mTLS WebSocket tunnel. Once paired, outbound dialer campaigns can automatically dispatch calls through physical SIM cards (Airtel, Jio, Vodafone, AT&amp;T, T-Mobile) with zero carrier per-minute markup.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                handleHandoffNavigate(
                  'android-gateway',
                  'Pair Android Smartphone & GSM SIM Slots',
                  'FAQ #3: Multi-SIM'
                )
              }
              leftIcon={<Smartphone className="h-3 w-3 text-amber-500" />}
              className="text-[11px] font-semibold h-7 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
            >
              Pair Android GSM Gateway
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: 'faq4',
      title: 'How do I upload custom PDF manuals to the RAG Knowledge Base?',
      content: (
        <div className="space-y-2.5">
          <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
            Go to Knowledge Base (RAG) and click Add Knowledge Source. Upload PDF, DOCX, CSV, or enter a website URL. Our vector embedding pipeline automatically parses, chunks (400-token blocks), and indexes the content for instantaneous cosine-similarity search during live phone calls.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                handleHandoffNavigate(
                  'knowledge-base',
                  'Upload PDF/CSV to RAG Vector Index',
                  'FAQ #4: RAG'
                )
              }
              leftIcon={<BookOpen className="h-3 w-3 text-teal-500" />}
              className="text-[11px] font-semibold h-7 border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 cursor-pointer"
            >
              Open Knowledge Base (RAG)
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: 'faq5',
      title: 'How do I authenticate API calls and WebSocket audio streams?',
      content: (
        <div className="space-y-2.5">
          <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
            Create an API token in API Keys &amp; Developer Authentication. Pass it in your HTTP requests as: <code className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">Authorization: Bearer create_call_os_live_...</code>. For WebSocket streams, pass the token as a query parameter <code className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">?token=...</code> or in initial handshake headers.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                handleHandoffNavigate(
                  'api-keys',
                  'Developer API Token & Secret Authentication',
                  'FAQ #5: API Key'
                )
              }
              leftIcon={<Key className="h-3 w-3 text-blue-500" />}
              className="text-[11px] font-semibold h-7 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
            >
              Manage Developer API Keys
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: 'faq6',
      title: 'What happens if a customer interrupts the AI agent while speaking?',
      content: (
        <div className="space-y-2.5">
          <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
            Our Full-Duplex Neural Interruption Detection (Barge-in) module analyzes incoming microphone audio with Voice Activity Detection (VAD). When user speech is detected, the agent output audio buffer is instantly flushed within 20ms and the LLM context is updated.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                handleHandoffNavigate(
                  'demo-studio',
                  'Full-Duplex Interruption & Barge-In Demo',
                  'FAQ #6: Barge-In'
                )
              }
              leftIcon={<Headphones className="h-3 w-3 text-emerald-500" />}
              className="text-[11px] font-semibold h-7 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
            >
              Test Live Barge-in in Studio
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: 'faq7',
      title: 'How are voice minutes, concurrency channels, and quotas deducted?',
      content: (
        <div className="space-y-2.5">
          <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
            Included minutes deduct in real-time per exact second of connected call duration (no minute rounding penalty). Concurrency limits control simultaneous active phone calls. Overrides and additional limits can be configured in Plan Master Studio by Super Admin.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                handleHandoffNavigate(
                  'billing',
                  'Voice Minutes & Concurrency Quota Limits',
                  'FAQ #7: Quotas'
                )
              }
              leftIcon={<CreditCard className="h-3 w-3 text-purple-500" />}
              className="text-[11px] font-semibold h-7 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 cursor-pointer"
            >
              View Billing &amp; Quota Limits
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: 'faq8',
      title: 'Can I pay for subscriptions via Bank Wire (NEFT/RTGS/SWIFT) or UPI?',
      content: (
        <div className="space-y-2.5">
          <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
            Yes! In the Billing tab or Checkout overlay, choose Bank Wire / SWIFT / UPI. Follow the generated bank account and reference number instructions. Once you enter your UTR/Reference ID, our team confirms the payment and activates your plan with an official GST invoice.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                handleHandoffNavigate(
                  'billing',
                  'Bank Wire & UPI Official Tax Invoicing',
                  'FAQ #8: Invoicing'
                )
              }
              leftIcon={<CreditCard className="h-3 w-3 text-emerald-500" />}
              className="text-[11px] font-semibold h-7 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
            >
              Open Billing &amp; Invoices
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 pb-12 max-w-full">
      {/* 1. Clean Top Header */}
      <div className="space-y-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/25 shrink-0">
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap leading-none">
              Help Center &amp; Documentation Hub
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Badge variant="emerald" className="text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Official SDK v2.4</span>
            </Badge>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs">
              <Activity className="h-3 w-3 text-emerald-500" />
              <span>Edge SLA: 99.98%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Comprehensive architectural manuals, REST &amp; WebSockets API specs, telephony setups, and priority technical support.
          </p>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleHandoffNavigate(
                  'api-keys',
                  'Developer API Keys & Secret Tokens',
                  'Docs Header'
                )
              }
              leftIcon={<Key className="h-3.5 w-3.5 text-teal-500" />}
              className="h-7.5 text-xs font-semibold px-2.5 shadow-2xs cursor-pointer"
            >
              Developer API Keys
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleHandoffNavigate(
                  'demo-studio',
                  'Real-Time WebRTC Voice Testing Studio',
                  'Docs Header'
                )
              }
              leftIcon={<Play className="h-3.5 w-3.5 text-emerald-500" />}
              className="h-7.5 text-xs font-semibold px-2.5 shadow-2xs cursor-pointer"
            >
              Live Call Studio
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
              onClick={() => setActiveSection('support')}
              className="h-7.5 text-xs font-semibold px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs cursor-pointer"
            >
              Contact Engineering
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Documentation Hub (Sidebar Nav + Main Content Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: Topic Navigation Menu (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search documentation topics..."
              value={docSearchQuery}
              onChange={(e) => setDocSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 shadow-2xs"
            />
          </div>

          {/* Topics List */}
          <div className="space-y-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 shadow-2xs">
            {filteredTopics.map((topic) => {
              const Icon = topic.icon;
              const isActive = activeSection === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(topic.id);
                    setTicketSentSuccess(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 group ${
                    isActive
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 shadow-2xs'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{topic.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">{topic.summary}</p>
                    </div>
                  </div>

                  <Badge variant={topic.badgeVariant || 'zinc'} className="text-[9px] font-mono shrink-0 px-1.5 py-0.2">
                    {topic.badge}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Need Live Support Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-cyan-500/10 border border-teal-500/20 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Enterprise Voice SLA</p>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Sub-1 hour response time for telephony routing, custom voice cloning, and SIP carrier connectivity.
            </p>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setActiveSection('support')}
              className="w-full text-xs font-semibold h-7 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 cursor-pointer"
            >
              Open Technical Ticket
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Topic Content Details (8 cols on lg) */}
        <div className="lg:col-span-8">
          {/* SECTION 1: QUICKSTART */}
          {activeSection === 'quickstart' && (
            <div className="space-y-4">
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardHeader className="p-5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">2-Minute Quickstart Guide</CardTitle>
                      <CardDescription className="text-xs">
                        From zero to launching your first production AI voice agent call. Click direct launcher buttons to execute each step with return resume support.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4 text-xs">
                  {/* Step 1 */}
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                            Configure Your AI Voice Agent
                          </p>
                          <Badge variant="emerald" className="text-[10px]">
                            Step 1 of 3
                          </Badge>
                        </div>
                        <p className="text-zinc-500 text-xs leading-relaxed">
                          Choose an AI persona template (e.g. Sales Executive SDR, Inbound Support, or Lead Qualifier), set custom system prompts, select primary language from 104 supported locales, and pick ultra-low latency neural voices (Cartesia Sonic or ElevenLabs).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-9 pt-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          handleHandoffNavigate(
                            'agents',
                            'Step 1: Configure AI Voice Persona & Prompts',
                            'Quickstart Step 1'
                          )
                        }
                        leftIcon={<Bot className="h-3.5 w-3.5" />}
                        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 cursor-pointer shadow-xs"
                      >
                        Open AI Agents Studio
                      </Button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                            Connect Telephony (Cloud SIP or Android SIM Gateway)
                          </p>
                          <Badge variant="purple" className="text-[10px]">
                            Step 2 of 3
                          </Badge>
                        </div>
                        <p className="text-zinc-500 text-xs leading-relaxed">
                          Either register enterprise cloud SIP trunks (Twilio, Telnyx, Plivo, Asterisk) with custom DID numbers, OR pair a physical Android smartphone to dial directly through real local SIM cards (Airtel, Jio, Vodafone, AT&amp;T) with zero carrier markup.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-9 pt-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleHandoffNavigate(
                            'phone-numbers',
                            'Step 2: Connect Cloud SIP Trunks & DIDs',
                            'Quickstart Step 2'
                          )
                        }
                        leftIcon={<PhoneCall className="h-3.5 w-3.5 text-purple-500" />}
                        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                        className="font-semibold text-xs h-8 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 cursor-pointer shadow-xs"
                      >
                        Configure SIP Trunks &amp; Numbers
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleHandoffNavigate(
                            'android-gateway',
                            'Step 2: Pair Android Smartphone Multi-SIM Gateway',
                            'Quickstart Step 2'
                          )
                        }
                        leftIcon={<Smartphone className="h-3.5 w-3.5 text-amber-500" />}
                        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                        className="font-semibold text-xs h-8 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer shadow-xs"
                      >
                        Pair Android SIM Gateway
                      </Button>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                            Dispatch Outbound Calls via Studio or REST API
                          </p>
                          <Badge variant="blue" className="text-[10px]">
                            Step 3 of 3
                          </Badge>
                        </div>
                        <p className="text-zinc-500 text-xs leading-relaxed">
                          Test live voice conversations instantly in your browser via Live Call Studio with low-latency WebRTC, or trigger automated outbound calls programmatically with our developer API key.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-9 pt-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          handleHandoffNavigate(
                            'demo-studio',
                            'Step 3: Test Real-Time Duplex Voice Call',
                            'Quickstart Step 3'
                          )
                        }
                        leftIcon={<Play className="h-3.5 w-3.5" />}
                        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 cursor-pointer shadow-xs"
                      >
                        Launch Live Call Studio
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleHandoffNavigate(
                            'api-keys',
                            'Step 3: Outbound REST API Key Authentication',
                            'Quickstart Step 3'
                          )
                        }
                        leftIcon={<Key className="h-3.5 w-3.5 text-blue-500" />}
                        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                        className="font-semibold text-xs h-8 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10 cursor-pointer shadow-xs"
                      >
                        Generate API Token
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sample Code Card */}
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-emerald-500" />
                    <CardTitle className="text-xs font-bold">Launch Outbound Call Snippet</CardTitle>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(['curl', 'javascript', 'python'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setActiveCodeTab(lang)}
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                          activeCodeTab === lang
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(
                          activeCodeTab === 'curl'
                            ? `curl -X POST "https://api.createcall.ai/api/calls/outbound" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"phone_number": "+1 (555) 234-5678", "agent_name": "Sales_Executive"}'`
                            : activeCodeTab === 'javascript'
                            ? `import axios from 'axios';\n\nconst res = await axios.post('https://api.createcall.ai/api/calls/outbound', {\n  phone_number: '+1 (555) 234-5678',\n  agent_name: 'Sales_Executive'\n}, {\n  headers: { Authorization: 'Bearer YOUR_API_KEY' }\n});\nconsole.log(res.data);`
                            : `import requests\n\nres = requests.post('https://api.createcall.ai/api/calls/outbound', json={\n  'phone_number': '+1 (555) 234-5678',\n  'agent_name': 'Sales_Executive'\n}, headers={'Authorization': 'Bearer YOUR_API_KEY'})\nprint(res.json())`,
                          'quickstart-code'
                        )
                      }
                      className="h-6 text-[10px] px-2 font-semibold cursor-pointer"
                    >
                      {copiedCodeId === 'quickstart-code' ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="p-4 bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto">
                    <code>
                      {activeCodeTab === 'curl'
                        ? `curl -X POST "https://api.createcall.ai/api/calls/outbound" \\
  -H "Authorization: Bearer create_call_os_live_YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone_number": "+91 98765 43210",
    "agent_name": "Sales_Executive",
    "language": "hi-IN"
  }'`
                        : activeCodeTab === 'javascript'
                        ? `import axios from 'axios';

const res = await axios.post('https://api.createcall.ai/api/calls/outbound', {
  phone_number: '+91 98765 43210',
  agent_name: 'Sales_Executive',
  language: 'hi-IN'
}, {
  headers: { 'Authorization': 'Bearer create_call_os_live_YOUR_SECRET_KEY' }
});

console.log('Call Queued:', res.data.call_id);`
                        : `import requests

res = requests.post(
    'https://api.createcall.ai/api/calls/outbound',
    json={
        'phone_number': '+91 98765 43210',
        'agent_name': 'Sales_Executive',
        'language': 'hi-IN'
    },
    headers={'Authorization': 'Bearer create_call_os_live_YOUR_SECRET_KEY'}
)
print("Queued:", res.json())`}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECTION 2: REST API & WEBHOOKS */}
          {activeSection === 'rest_api' && (
            <div className="space-y-4">
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardHeader className="p-5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Code className="h-5 w-5 text-blue-500" />
                        REST Endpoints &amp; Webhook Schema Reference
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Full JSON specification for dispatching calls, streaming WebSockets, and subscribing to real-time events.
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          handleHandoffNavigate(
                            'api-keys',
                            'REST API Secret Keys & Authentication',
                            'API Reference'
                          )
                        }
                        leftIcon={<Key className="h-3.5 w-3.5" />}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Manage API Keys
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleHandoffNavigate(
                            'integrations',
                            'Real-Time Webhook Lifecycle Events & Subscriptions',
                            'Integrations Hub'
                          )
                        }
                        leftIcon={<Workflow className="h-3.5 w-3.5" />}
                        className="text-xs font-semibold cursor-pointer"
                      >
                        Webhooks Hub
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-5 text-xs">
                  {/* Endpoint 1 */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                          POST
                        </span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          /api/calls/outbound
                        </span>
                      </div>
                      <Badge variant="blue" className="text-[10px]">
                        Call Dispatch
                      </Badge>
                    </div>
                    <p className="text-zinc-500 text-xs">
                      Initiates an autonomous outbound telephone call to any international phone number using selected voice agent.
                    </p>

                    <div className="p-3 bg-zinc-950 text-zinc-200 rounded-xl font-mono text-[11px] border border-zinc-800">
                      <p className="text-zinc-400">// Request Payload Body</p>
                      <p>{`{`}</p>
                      <p className="pl-4 text-emerald-400">"phone_number": "+91 98765 43210",</p>
                      <p className="pl-4 text-emerald-400">"agent_name": "Sales_Executive",</p>
                      <p className="pl-4 text-emerald-400">"language": "hi-IN",</p>
                      <p className="pl-4 text-emerald-400">"variables": {`{ "customer_name": "Rahul Sharma", "lead_source": "AdWords" }`}</p>
                      <p>{`}`}</p>
                    </div>
                  </div>

                  {/* Webhook Events */}
                  <div className="space-y-2.5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Supported Real-Time Webhook Lifecycle Events
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">call.started</span>: Dialing picked up by receiver
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">call.transcription</span>: Real-time STT word stream
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">call.barge_in</span>: Caller interrupted agent
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">call.analysis_ready</span>: Sentiment &amp; summary extracted
                      </div>
                    </div>

                    <div className="pt-1 flex items-center gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          handleHandoffNavigate(
                            'logs',
                            'Live API Request & Webhook Telemetry Logs',
                            'Terminal Logs'
                          )
                        }
                        leftIcon={<Terminal className="h-3 w-3 text-zinc-400" />}
                        className="text-[11px] font-semibold cursor-pointer"
                      >
                        Inspect Live Webhook Delivery Logs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECTION 3: CLOUD SIP & CARRIER */}
          {activeSection === 'telephony_sip' && (
            <div className="space-y-4">
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardHeader className="p-5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <PhoneCall className="h-5 w-5 text-purple-500" />
                        Cloud SIP Trunking &amp; Carrier Interconnect
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Connecting Twilio, Telnyx, Plivo, FreePBX, and Asterisk to Create Call OS.
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          handleHandoffNavigate(
                            'phone-numbers',
                            'Cloud SIP Carrier Trunks & DIDs',
                            'Telephony Setup'
                          )
                        }
                        leftIcon={<Phone className="h-3.5 w-3.5" />}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Configure SIP Trunks
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleHandoffNavigate(
                            'logs',
                            'SIP Signalling & WebRTC Diagnostics',
                            'Terminal Logs'
                          )
                        }
                        leftIcon={<Terminal className="h-3.5 w-3.5 text-zinc-500" />}
                        className="text-xs font-semibold cursor-pointer"
                      >
                        Inspect SIP Logs
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Server className="h-4 w-4 text-purple-500" />
                        SIP Ingress Endpoint
                      </p>
                      <p className="font-mono text-xs text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                        sip:ingress.createcall.ai:5060
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Supports RFC 3261 INVITE with TLS encryption and SRTP media security.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Headphones className="h-4 w-4 text-emerald-500" />
                        Supported Codecs
                      </p>
                      <p className="font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                        Opus 48kHz, PCMU (G.711u), PCMA (G.711a)
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Automatic codec negotiation with adaptive jitter buffer.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                    <p className="font-bold text-purple-900 dark:text-purple-200 text-xs">
                      Carrier Setup Instructions (Twilio / Telnyx / Asterisk)
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                      <li>In your carrier console, create a SIP Trunk targeting <code className="font-mono bg-purple-100 dark:bg-purple-900/40 px-1 py-0.5 rounded">ingress.createcall.ai</code>.</li>
                      <li>In Create Call OS &gt; <strong className="text-zinc-900 dark:text-white">Phone Numbers</strong>, add your inbound DID and map it to an AI Agent.</li>
                      <li>Inbound calls immediately trigger real-time AI conversation pipeline within 180ms.</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECTION 4: ANDROID GSM GATEWAY */}
          {activeSection === 'android_gsm' && (
            <div className="space-y-4">
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardHeader className="p-5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-amber-500" />
                        Android GSM Hardware Gateway Manual
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Pair physical smartphones to dial through real SIM cards with zero carrier per-minute markup.
                      </CardDescription>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        handleHandoffNavigate(
                          'android-gateway',
                          'Android GSM Hardware Pairing & SIM Management',
                          'GSM Gateway'
                        )
                      }
                      leftIcon={<Smartphone className="h-3.5 w-3.5" />}
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer shadow-xs"
                    >
                      Open Android Gateway Hub
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                      <p className="font-bold text-amber-900 dark:text-amber-200 text-xs">1. Download APK</p>
                      <p className="text-[11px] text-zinc-500">Install Create Call OS Companion APK onto your Android phone.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                      <p className="font-bold text-amber-900 dark:text-amber-200 text-xs">2. Scan QR Tunnel</p>
                      <p className="text-[11px] text-zinc-500">Scan pairing QR to initiate encrypted WebRTC audio stream.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                      <p className="font-bold text-amber-900 dark:text-amber-200 text-xs">3. Dispatch SIM Calls</p>
                      <p className="text-[11px] text-zinc-500">Automated campaigns route through SIM 1 or SIM 2 slots.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleHandoffNavigate(
                          'campaigns',
                          'Dispatch Autonomous Campaigns via Android SIM Slots',
                          'Dialer Campaigns'
                        )
                      }
                      leftIcon={<Send className="h-3.5 w-3.5 text-amber-500" />}
                      className="text-xs font-semibold border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                    >
                      Start Outbound Campaign with SIMs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECTION 5: VOICE ENGINES & LATENCY */}
          {activeSection === 'voice_latency' && (
            <div className="space-y-4">
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardHeader className="p-5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Headphones className="h-5 w-5 text-emerald-500" />
                        Sub-350ms Voice Pipeline Architecture
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Optimizing speech recognition, streaming token inference, neural voice synthesis, and barge-in.
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          handleHandoffNavigate(
                            'demo-studio',
                            'Sub-350ms Voice Engine Real-Time Testing',
                            'Voice Engine'
                          )
                        }
                        leftIcon={<Play className="h-3.5 w-3.5" />}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Test Live in Studio
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleHandoffNavigate(
                            'agents',
                            'Configure Voice Personas & TTS Engines',
                            'Agent Voice'
                          )
                        }
                        leftIcon={<Bot className="h-3.5 w-3.5 text-teal-500" />}
                        className="text-xs font-semibold cursor-pointer"
                      >
                        Agent Voice Config
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">Deepgram Nova-2</p>
                        <Badge variant="emerald" className="text-[9px]">~80ms</Badge>
                      </div>
                      <p className="text-[11px] text-zinc-500">Zero-buffer websocket streaming speech-to-text with dual-channel audio.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">Gemini 1.5 Flash</p>
                        <Badge variant="blue" className="text-[9px]">~82ms TTFT</Badge>
                      </div>
                      <p className="text-[11px] text-zinc-500">Sub-second reasoning with instant streaming token output pipeline.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">Cartesia Sonic</p>
                        <Badge variant="purple" className="text-[9px]">~110ms</Badge>
                      </div>
                      <p className="text-[11px] text-zinc-500">Phoneme-level ultra-fast neural synthesis with natural emotive inflection.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Full-Duplex Barge-in (Interruption Detection)
                    </p>
                    <p className="text-[11.5px] text-zinc-500">
                      When a human caller interrupts while the AI is speaking, our edge Voice Activity Detector (VAD) instantly flushes agent audio buffers within 20ms and smoothly pivots to the new conversation thread.
                    </p>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        handleHandoffNavigate(
                          'analytics',
                          'Speech & LLM Turn-Around Latency Analytics',
                          'Analytics'
                        )
                      }
                      leftIcon={<BarChart2 className="h-3 w-3 text-emerald-500" />}
                      className="text-[11px] font-semibold cursor-pointer"
                    >
                      View Live Voice Analytics &amp; Latency Histograms
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECTION 6: RAG & MEMORY BRAIN */}
          {activeSection === 'rag_memory' && (
            <div className="space-y-4">
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardHeader className="p-5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-500" />
                        RAG Knowledge Base &amp; Lifetime Fact Memory
                      </CardTitle>
                      <CardDescription className="text-xs">
                        How Create Call OS autonomously references documents and remembers user facts across calls.
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          handleHandoffNavigate(
                            'knowledge-base',
                            'Upload RAG Knowledge Documents & Vector Vectors',
                            'RAG Setup'
                          )
                        }
                        leftIcon={<BookOpen className="h-3.5 w-3.5" />}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Open Knowledge Base
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleHandoffNavigate(
                            'memory',
                            'Customer Lifetime Fact Memory Vault',
                            'Memory Brain'
                          )
                        }
                        leftIcon={<Brain className="h-3.5 w-3.5 text-purple-500" />}
                        className="text-xs font-semibold cursor-pointer"
                      >
                        Memory Brain Vault
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-1.5">
                      <p className="font-bold text-purple-900 dark:text-purple-100 text-xs flex items-center gap-1.5">
                        <Upload className="h-4 w-4 text-purple-500" />
                        Vector RAG Pipeline
                      </p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Upload PDF documents, CSV sheets, product catalogs, or API schemas. Content is auto-chunked into 400-token vectors for sub-25ms cosine similarity lookup during live calls.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
                      <p className="font-bold text-emerald-900 dark:text-emerald-100 text-xs flex items-center gap-1.5">
                        <Brain className="h-4 w-4 text-emerald-500" />
                        Lifetime Fact Memory Vault
                      </p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Extracts key customer facts (budget, past objections, promised callbacks, preferred names) after every call and injects them automatically into subsequent conversations.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        handleHandoffNavigate(
                          'workflows',
                          'Build Automated Voice Workflows with Memory',
                          'Voice Workflows'
                        )
                      }
                      leftIcon={<Workflow className="h-3 w-3 text-purple-500" />}
                      className="text-[11px] font-semibold cursor-pointer"
                    >
                      Connect Memory to Automated Voice Workflows
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECTION 7: BILLING & LIMITS */}
          {activeSection === 'billing_limits' && (
            <div className="space-y-4">
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardHeader className="p-5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-emerald-500" />
                        Plan Quotas, Minutes &amp; Bank Wire Invoicing
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Overview of voice minutes, concurrency channels, and GST-compliant invoices.
                      </CardDescription>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        handleHandoffNavigate(
                          'billing',
                          'Manage Subscriptions, Quotas & Invoices',
                          'Billing & Plans'
                        )
                      }
                      leftIcon={<CreditCard className="h-3.5 w-3.5" />}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Manage Billing &amp; Invoices
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">Starter Trial</p>
                      <p className="text-[11px] text-zinc-500">500 voice minutes, 2 concurrent lines, 2 AI voice agents.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">Pro Scale</p>
                      <p className="text-[11px] text-zinc-500">3,000 voice minutes, 10 concurrent lines, RAG knowledge base &amp; SIM gateway.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">Enterprise Scale</p>
                      <p className="text-[11px] text-zinc-500">10,000+ minutes, 25 concurrent lines, custom voice cloning &amp; direct SLA.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
                    <p className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                      Bank Wire (NEFT / RTGS) &amp; UPI Invoicing
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Pay directly via Indian or International bank transfer and UPI. Official GST Tax invoices are automatically generated with full HSN code breakdowns for easy tax reconciliation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECTION 8: FAQS ACCORDION */}
          {activeSection === 'faqs' && (
            <div className="space-y-4">
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardHeader className="p-5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-teal-500" />
                        Frequently Asked Technical Questions
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Comprehensive answers to telephony, latency, billing, and security queries with direct feature launcher buttons.
                      </CardDescription>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveSection('support')}
                      leftIcon={<MessageSquare className="h-3.5 w-3.5 text-teal-500" />}
                      className="text-xs font-semibold cursor-pointer"
                    >
                      Ask Engineering
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <Accordion items={faqsList} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECTION 9: PRIORITY ENGINEERING SUPPORT FORM */}
          {activeSection === 'support' && (
            <div className="space-y-4">
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <CardHeader className="p-5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-emerald-500" />
                    Direct Priority Support Desk
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Submit a technical ticket directly to our senior telephony architects and voice engine engineers.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5">
                  {ticketSentSuccess ? (
                    <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                        <Check className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Ticket Transmitted to Engineering Queue
                      </h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                        Your priority ticket has been assigned. Our senior team will respond directly to{' '}
                        <strong className="text-zinc-900 dark:text-white">{user?.email || 'mukeshswami7827@gmail.com'}</strong> within 1 hour.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTicketSentSuccess(false);
                          setSupportMessage('');
                        }}
                        className="text-xs font-semibold mt-2 cursor-pointer"
                      >
                        Submit Another Inquiry
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSendSupport} className="space-y-3.5 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                            Your Full Name
                          </label>
                          <Input
                            value={user?.fullName || 'Mukesh Swami'}
                            disabled
                            className="bg-zinc-50 dark:bg-zinc-800 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                            Authenticated Contact Email
                          </label>
                          <Input
                            value={user?.email || 'mukeshswami7827@gmail.com'}
                            disabled
                            className="bg-zinc-50 dark:bg-zinc-800 font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                            Technical Inquiry Category
                          </label>
                          <CustomSelect
                            value={ticketCategory}
                            onChange={(val) => setTicketCategory(val)}
                            options={[
                              { value: 'telephony', label: 'SIP Carrier & Telephony Routing' },
                              { value: 'voice_latency', label: 'AI Voice Engine & Latency Tuning' },
                              { value: 'api_webhooks', label: 'REST API & Webhooks Integration' },
                              { value: 'android_gsm', label: 'Android GSM Hardware Pairing' },
                              { value: 'billing', label: 'Billing, Invoicing & Quota Limits' },
                              { value: 'feature_request', label: 'Feature Request & Custom Architecture' },
                            ]}
                            size="sm"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                            Priority Level
                          </label>
                          <CustomSelect
                            value={ticketPriority}
                            onChange={(val) => setTicketPriority(val)}
                            options={[
                              { value: 'P1', label: 'P1 - Critical (Production Outage)', badge: 'Urgent' },
                              { value: 'P2', label: 'P2 - High (Latency or Webhook Failure)', badge: 'High' },
                              { value: 'P3', label: 'P3 - Standard (Technical Inquiry)', badge: 'Normal' },
                            ]}
                            size="sm"
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Call ID / Error Code (Optional)
                        </label>
                        <Input
                          placeholder="e.g. call_cc_82a17b... or SIP 488 Not Acceptable"
                          value={ticketCallId}
                          onChange={(e) => setTicketCallId(e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Describe Technical Inquiry or Issue *
                        </label>
                        <Textarea
                          rows={4}
                          placeholder="Provide reproduction steps, error logs, or specific SIP trunk configuration requirements..."
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          loading={isSubmitting}
                          leftIcon={<Send className="h-4 w-4" />}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                        >
                          Dispatch Priority Support Ticket
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpCenterView;
