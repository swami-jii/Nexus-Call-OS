import React, { useState, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  Cpu,
  Zap,
  CheckCircle2,
  Plus,
  Activity,
  Radio,
  Clock,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Server,
  Layers,
  Sparkles,
  Smartphone,
  Headphones,
  BookOpen,
  Users,
  Megaphone,
  PlayCircle,
  RefreshCw,
  Sliders,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Volume2,
  Lock,
  GitFork,
  Check,
  Flame,
  Crown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MetricSkeleton } from '../components/ui/Skeleton';
import { ScreenId } from '../types';
import { fetchAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { triggerNavigationHandoff } from '../lib/handoffNavigation';
import { usePlanEntitlements } from '../hooks/usePlanEntitlements';
import { PlanGuardrailModal } from '../components/ui/PlanGuardrailModal';

interface DashboardMetrics {
  total_agents: number;
  active_agents: number;
  total_calls: number;
  total_talk_minutes: number;
  total_talk_seconds: number;
  total_cost_usd: number;
  avg_latency_ms: number;
  total_phone_numbers: number;
  total_gsm_devices: number;
  total_campaigns: number;
  active_campaigns: number;
  total_contacts: number;
  total_knowledge_docs: number;
  total_workflows: number;
  wallet_balance_usd: number;
}

interface ProviderCategoryStatus {
  configured: boolean;
  count: number;
  items?: any[];
  sip_lines?: number;
  gsm_nodes?: number;
}

interface DashboardData {
  organization_id?: string;
  user_email?: string;
  user_name?: string;
  user_role?: string;
  metrics: DashboardMetrics;
  providers_status: {
    llm: ProviderCategoryStatus;
    stt: ProviderCategoryStatus;
    voice: ProviderCategoryStatus;
    telephony: ProviderCategoryStatus;
  };
  recent_agents: any[];
  recent_calls: any[];
  onboarding: {
    has_keys: boolean;
    has_agents: boolean;
    has_telephony: boolean;
    has_calls: boolean;
    progress_percent: number;
    is_complete: boolean;
  };
}

export const DashboardView: React.FC<{ onNavigate: (screen: ScreenId) => void }> = ({
  onNavigate,
}) => {
  const { user } = useAuth();

  // Plan Entitlements & Live Dynamic Governance Engine
  const {
    isSuperAdmin,
    isUnlimited,
    entitlements,
    canAccessLlm,
    canAccessStt,
    canAccessTts,
    canAccessCodec,
    canAccessGsm,
    canAccessWebhooks,
    canAccessVoiceCloning,
    checkResourceQuota,
    guardrailModal,
    triggerGuardrail,
    closeGuardrail,
    refreshEntitlements,
  } = usePlanEntitlements();

  const [data, setData] = useState<DashboardData | null>(null);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activePipelineStage, setActivePipelineStage] = useState<number>(2);

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [overviewRes, sessRes] = await Promise.all([
        fetchAPI('/api/analytics/dashboard-overview').catch(() => null),
        fetchAPI('/api/live-sessions').catch(() => null),
      ]);

      if (overviewRes && overviewRes.metrics) {
        setData(overviewRes);
      }
      if (sessRes && Array.isArray(sessRes.sessions)) {
        setLiveSessions(sessRes.sessions);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load & periodic background sync
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Animated pipeline stage cycle
  useEffect(() => {
    const stageTimer = setInterval(() => {
      setActivePipelineStage((prev) => (prev % 5) + 1);
    }, 1800);
    return () => clearInterval(stageTimer);
  }, []);

  const metrics = data?.metrics || {
    total_agents: 0,
    active_agents: 0,
    total_calls: 0,
    total_talk_minutes: 0,
    total_talk_seconds: 0,
    total_cost_usd: 0,
    avg_latency_ms: 295,
    total_phone_numbers: 0,
    total_gsm_devices: 0,
    total_campaigns: 0,
    active_campaigns: 0,
    total_contacts: 0,
    total_knowledge_docs: 0,
    total_workflows: 0,
    wallet_balance_usd: 500,
  };

  const providers = data?.providers_status;
  const onboarding = data?.onboarding || {
    has_keys: false,
    has_agents: false,
    has_telephony: false,
    has_calls: false,
    progress_percent: 0,
    is_complete: false,
  };

  const recentCalls = data?.recent_calls || [];
  const recentAgents = data?.recent_agents || [];
  const activeSession = liveSessions[0];

  // Resolve dynamic provider names for pipeline display
  const activeLlmName = providers?.llm?.items?.[0]?.name || (providers?.llm?.configured ? 'OpenAI / Gemini' : 'LLM Engine');
  const activeVoiceName = providers?.voice?.items?.[0]?.name || (providers?.voice?.configured ? 'ElevenLabs' : 'Voice Synthesizer');
  const activeSttName = providers?.stt?.items?.[0]?.name || (providers?.stt?.configured ? 'Deepgram' : 'STT Engine');

  return (
    <div className="space-y-4 pb-12 max-w-7xl mx-auto select-none">
      {/* Top Welcome & Live Header */}
      <div className="bg-gradient-to-r from-teal-900/10 via-emerald-900/5 to-transparent dark:from-teal-950/40 dark:via-zinc-900/40 p-4 rounded-2xl border border-teal-500/20 dark:border-teal-800/30 backdrop-blur-sm shadow-xs space-y-1.5 shrink-0">
        {/* ROW 1: Title on Left + Badges on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
              AI Voice OS Command Center
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Badge
              variant="success"
              size="sm"
              leftIcon={<Radio className="h-3 w-3 animate-pulse text-emerald-500" />}
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold shadow-2xs whitespace-nowrap"
            >
              {liveSessions.length > 0 ? `${liveSessions.length} Active Call Stream` : 'Live Telephony Ready'}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs font-semibold border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer hover:bg-amber-500/20 transition-all"
              onClick={() => (onNavigate ? onNavigate('billing') : undefined)}
              title="Click to view subscription plan entitlements"
            >
              <Crown className="h-3 w-3 text-amber-500" />
              <span>Plan: {entitlements.planName}</span>
            </Badge>
          </div>
        </div>

        {/* ROW 2: Workspace Info on Left + Action Buttons on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
            <span>Workspace:</span>
            <strong className="text-teal-700 dark:text-teal-400">
              {user?.full_name || 'My Workspace'} ({user?.email})
            </strong>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span>Realtime Carrier & AI Synthesis Telemetry</span>
          </p>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="xs"
              onClick={() => loadDashboardData(true)}
              disabled={isRefreshing}
              leftIcon={<RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />}
              className="h-7.5 text-xs font-semibold cursor-pointer shadow-2xs px-2.5"
            >
              {isRefreshing ? 'Syncing...' : 'Sync'}
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={() =>
                triggerNavigationHandoff(onNavigate, {
                  sourceScreen: 'dashboard',
                  sourceLabel: 'Executive Dashboard',
                  contextTitle: 'Live Studio Testing',
                  contextBadge: 'Live Studio',
                  targetScreen: 'demo-studio',
                })
              }
              leftIcon={<PlayCircle className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />}
              className="h-7.5 text-xs font-semibold border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer shadow-2xs px-2.5"
            >
              Live Studio
            </Button>

            <Button
              variant="primary"
              size="xs"
              onClick={() =>
                triggerNavigationHandoff(onNavigate, {
                  sourceScreen: 'dashboard',
                  sourceLabel: 'Executive Dashboard',
                  contextTitle: 'Deploy Voice Agent',
                  contextBadge: 'New Agent',
                  targetScreen: 'agents',
                })
              }
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              className="h-7.5 text-xs font-semibold shadow-xs bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer px-3"
            >
              Deploy Agent
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Subscription Plan Entitlements & Live Allocation Matrix */}
      <div className="p-4 bg-gradient-to-r from-blue-900/10 via-indigo-900/5 to-purple-900/10 dark:from-blue-950/40 dark:via-zinc-900/40 dark:to-purple-950/30 rounded-2xl border border-blue-500/20 dark:border-blue-800/30 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-900/40 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Subscription Allocation: {entitlements.planName}
                </h3>
                {isSuperAdmin ? (
                  <Badge variant="primary" size="sm" className="text-[10px] font-mono">
                    Sovereign Master
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm" className="text-[10px] font-mono">
                    Active License
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Real-time quota governance, concurrent line allocation, and model access limits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {!isSuperAdmin && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onNavigate('billing')}
                leftIcon={<Zap className="h-3.5 w-3.5" />}
                className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xs cursor-pointer"
              >
                Manage / Upgrade Plan
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mt-4 pt-3 border-t border-blue-200/50 dark:border-blue-900/30 text-xs">
          <div className="p-2 bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 block">Voice Minutes</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {metrics.total_talk_minutes} / {isSuperAdmin ? '∞' : entitlements.includedMinutes}m
            </span>
          </div>

          <div className="p-2 bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 block">Concurrency</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {liveSessions.length} / {isSuperAdmin ? '∞' : entitlements.concurrencyLimit} Lines
            </span>
          </div>

          <div className="p-2 bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 block">Agent Slots</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {metrics.total_agents} / {isSuperAdmin ? '∞' : entitlements.maxAgentsCount}
            </span>
          </div>

          <div className="p-2 bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 block">Duration Cap</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {entitlements.maxCallDurationMins === 'unlimited' ? 'Unlimited' : `${entitlements.maxCallDurationMins}m / call`}
            </span>
          </div>

          <div className="p-2 bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 block">RAG Vault</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {isSuperAdmin ? '100 GB' : `${entitlements.ragStorageMb} MB`}
            </span>
          </div>

          <div className="p-2 bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 block">GSM Gateways</span>
            <span className={`font-bold font-mono ${entitlements.gsmSimEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
              {entitlements.gsmSimEnabled ? 'Enabled' : '🔒 Locked'}
            </span>
          </div>

          <div className="p-2 bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 block">Voice Tuning</span>
            <span className={`font-bold font-mono ${entitlements.voiceCloningEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
              {entitlements.voiceCloningEnabled ? 'Enabled' : '🔒 Locked'}
            </span>
          </div>

          <div className="p-2 bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 block">Support SLA</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
              {entitlements.prioritySlaEnabled ? 'Priority 24/7' : 'Standard'}
            </span>
          </div>
        </div>
      </div>

      {/* Onboarding / Quick Start Progress Hub (Shown when workspace has pending steps) */}
      {!onboarding.is_complete && (
        <Card className="p-5 border-teal-500/30 dark:border-teal-800/40 bg-gradient-to-br from-teal-50/50 via-white to-emerald-50/30 dark:from-teal-950/30 dark:via-zinc-900/60 dark:to-zinc-900 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400 animate-bounce" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Workspace Setup & Launch Guide ({onboarding.progress_percent}% Ready)
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Complete these 4 simple steps to start streaming autonomous AI voice calls on your account.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 dark:bg-teal-400 h-full transition-all duration-500"
                  style={{ width: `${onboarding.progress_percent}%` }}
                />
              </div>
              <span className="text-xs font-extrabold text-teal-700 dark:text-teal-300">
                {onboarding.progress_percent}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Step 1: LLM & Voice Keys */}
            <div
              onClick={() =>
                triggerNavigationHandoff(onNavigate, {
                  sourceScreen: 'dashboard',
                  sourceLabel: 'Executive Dashboard',
                  contextTitle: 'Connect AI & Voice Keys',
                  contextBadge: 'Step 1: AI Keys',
                  targetScreen: 'integrations',
                })
              }
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                onboarding.has_keys
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-300'
                  : 'bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 hover:border-teal-500 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Step 1</span>
                {onboarding.has_keys ? (
                  <Badge variant="success" size="sm" leftIcon={<Check className="h-3 w-3" />}>
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" size="sm">
                    Action Needed
                  </Badge>
                )}
              </div>
              <div>
                <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-teal-600" />
                  Connect AI & Voice Keys
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Configure OpenAI, Gemini, Groq, or ElevenLabs.
                </p>
              </div>
              <div className="mt-3 text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                {onboarding.has_keys ? 'Manage Keys →' : 'Connect Now →'}
              </div>
            </div>

            {/* Step 2: Create Agent */}
            <div
              onClick={() =>
                triggerNavigationHandoff(onNavigate, {
                  sourceScreen: 'dashboard',
                  sourceLabel: 'Executive Dashboard',
                  contextTitle: 'Configure AI Voice Agent',
                  contextBadge: 'Step 2: AI Agents',
                  targetScreen: 'agents',
                })
              }
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                onboarding.has_agents
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-300'
                  : 'bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 hover:border-teal-500 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Step 2</span>
                {onboarding.has_agents ? (
                  <Badge variant="success" size="sm" leftIcon={<Check className="h-3 w-3" />}>
                    Ready ({metrics.total_agents})
                  </Badge>
                ) : (
                  <Badge variant="outline" size="sm">
                    Action Needed
                  </Badge>
                )}
              </div>
              <div>
                <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Headphones className="h-3.5 w-3.5 text-teal-600" />
                  Create AI Agent
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Define agent persona, language, voice & prompt.
                </p>
              </div>
              <div className="mt-3 text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                {onboarding.has_agents ? 'View Agents →' : 'Create Agent →'}
              </div>
            </div>

            {/* Step 3: Connect Line / Pair GSM */}
            <div
              onClick={() =>
                triggerNavigationHandoff(onNavigate, {
                  sourceScreen: 'dashboard',
                  sourceLabel: 'Executive Dashboard',
                  contextTitle: 'Pair GSM SIM or SIP Line',
                  contextBadge: 'Step 3: GSM Gateway',
                  targetScreen: 'android-gateway',
                })
              }
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                onboarding.has_telephony
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-300'
                  : 'bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 hover:border-teal-500 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Step 3</span>
                {onboarding.has_telephony ? (
                  <Badge variant="success" size="sm" leftIcon={<Check className="h-3 w-3" />}>
                    Paired ({metrics.total_phone_numbers + metrics.total_gsm_devices})
                  </Badge>
                ) : (
                  <Badge variant="outline" size="sm">
                    Action Needed
                  </Badge>
                )}
              </div>
              <div>
                <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-teal-600" />
                  Pair Android / SIP Trunk
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Connect mobile SIM GSM gateway or SIP pool.
                </p>
              </div>
              <div className="mt-3 text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                {onboarding.has_telephony ? 'Manage Gateways →' : 'Pair Free GSM SIM →'}
              </div>
            </div>

            {/* Step 4: Test in Live Studio */}
            <div
              onClick={() =>
                triggerNavigationHandoff(onNavigate, {
                  sourceScreen: 'dashboard',
                  sourceLabel: 'Executive Dashboard',
                  contextTitle: 'Test Agent in Live Studio',
                  contextBadge: 'Step 4: Live Studio',
                  targetScreen: 'demo-studio',
                })
              }
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                onboarding.has_calls
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-300'
                  : 'bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 hover:border-teal-500 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Step 4</span>
                {onboarding.has_calls ? (
                  <Badge variant="success" size="sm" leftIcon={<Check className="h-3 w-3" />}>
                    Verified ({metrics.total_calls} calls)
                  </Badge>
                ) : (
                  <Badge variant="outline" size="sm">
                    Ready to Test
                  </Badge>
                )}
              </div>
              <div>
                <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <PlayCircle className="h-3.5 w-3.5 text-teal-600" />
                  Live Call Studio
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Simulate voice call or trigger real audio.
                </p>
              </div>
              <div className="mt-3 text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                {onboarding.has_calls ? 'Open Studio →' : 'Start First Call →'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            {/* KPI 1: Active Voice Agents */}
            <Card
              className="hover:border-teal-500/60 hover:shadow-sm transition-all cursor-pointer"
              onClick={() =>
                triggerNavigationHandoff(onNavigate, {
                  sourceScreen: 'dashboard',
                  sourceLabel: 'Executive Dashboard',
                  contextTitle: 'Voice Agents Roster',
                  contextBadge: 'Agents',
                  targetScreen: 'agents',
                })
              }
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Voice Agents Roster
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                      {metrics.active_agents}
                    </h3>
                    <span className="text-xs font-semibold text-zinc-400">
                      / {metrics.total_agents} Total
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {metrics.active_agents > 0 ? '● Active & ready for calls' : 'No active agents yet'}
                  </p>
                </div>
                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/50">
                  <Headphones className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            {/* KPI 2: Telephony Calls & Minutes */}
            <Card
              className="hover:border-teal-500/60 hover:shadow-sm transition-all cursor-pointer"
              onClick={() =>
                triggerNavigationHandoff(onNavigate, {
                  sourceScreen: 'dashboard',
                  sourceLabel: 'Executive Dashboard',
                  contextTitle: 'Call History Database',
                  contextBadge: 'Call History',
                  targetScreen: 'call-history',
                })
              }
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Total Telephony Calls
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                      {metrics.total_calls}
                    </h3>
                    <span className="text-xs font-semibold text-zinc-400">
                      ({metrics.total_talk_minutes} min)
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    {metrics.total_talk_seconds > 0 ? `${metrics.total_talk_seconds}s voice dialogue time` : 'Ready to place 1st call'}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50">
                  <PhoneCall className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            {/* KPI 3: Telephony Lines & Gateways */}
            <Card
              className="hover:border-teal-500/60 hover:shadow-sm transition-all cursor-pointer"
              onClick={() =>
                triggerNavigationHandoff(onNavigate, {
                  sourceScreen: 'dashboard',
                  sourceLabel: 'Executive Dashboard',
                  contextTitle: 'Phone & GSM Gateway Hub',
                  contextBadge: 'GSM Gateway',
                  targetScreen: 'android-gateway',
                })
              }
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Phone & GSM Lines
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                      {metrics.total_phone_numbers + metrics.total_gsm_devices}
                    </h3>
                    <span className="text-xs font-semibold text-zinc-400">Lines</span>
                  </div>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                    {metrics.total_gsm_devices} GSM Mobile • {metrics.total_phone_numbers} SIP Trunks
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/50">
                  <Smartphone className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            {/* KPI 4: Spend & Wallet Balance */}
            <Card
              className="hover:border-teal-500/60 hover:shadow-sm transition-all cursor-pointer"
              onClick={() =>
                triggerNavigationHandoff(onNavigate, {
                  sourceScreen: 'dashboard',
                  sourceLabel: 'Executive Dashboard',
                  contextTitle: 'Billing & Wallet Credits',
                  contextBadge: 'Billing',
                  targetScreen: 'billing',
                })
              }
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Total Spend / Balance
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                      ${metrics.total_cost_usd.toFixed(4)}
                    </h3>
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Wallet Credit: <strong>${metrics.wallet_balance_usd.toFixed(2)}</strong>
                  </p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50">
                  <DollarSign className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Voice Telephony Pipeline Execution Flow Visualizer */}
      <Card className="p-5 bg-zinc-950 border-zinc-800 text-zinc-100 relative overflow-hidden shadow-xl">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#14b8a6 1px, transparent 1px)`,
            backgroundSize: `20px 20px`,
          }}
        />
        <CardHeader className="p-0 pb-4 border-b border-zinc-800 flex flex-row items-center justify-between relative z-10">
          <div>
            <CardTitle className="text-sm text-zinc-100 font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-teal-400" />
              <span>Realtime Voice Telephony Pipeline Flow</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-0.5">
              Caller & WebSockets ↔ {activeSttName} ↔ {activeLlmName} ↔ {activeVoiceName}
            </CardDescription>
          </div>
          <Badge variant="emerald" size="sm" className="hidden sm:inline-flex">
            Ultra-Low Latency Pipeline
          </Badge>
        </CardHeader>

        <CardContent className="p-0 pt-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* STT */}
            <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-teal-950/60 border border-teal-800/60 flex items-center justify-center text-teal-400">
                <Volume2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">STT Transcriber</span>
                <p className="text-xs font-bold text-zinc-100 truncate">{activeSttName}</p>
                <p className="text-[10px] text-zinc-400">Deepgram / Live</p>
              </div>
            </div>

            {/* LLM */}
            <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <Cpu className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">AI Reasoning</span>
                <p className="text-xs font-bold text-zinc-100 truncate">{activeLlmName}</p>
                <p className="text-[10px] text-zinc-400">SSOT Configured</p>
              </div>
            </div>

            {/* TTS */}
            <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
                <Zap className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Voice Synthesizer</span>
                <p className="text-xs font-bold text-zinc-100 truncate">{activeVoiceName}</p>
                <p className="text-[10px] text-zinc-400">Neural Voice</p>
              </div>
            </div>

            {/* Gateway */}
            <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400">
                <Radio className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Telephony Carrier</span>
                <p className="text-xs font-bold text-zinc-100 truncate">
                  {metrics.total_gsm_devices > 0 ? 'GSM Gateway Active' : 'SIP Trunk Pool'}
                </p>
                <p className="text-[10px] text-zinc-400">0.00ms Jitter</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Configured Providers Status Matrix (Reflecting current user's actual configuration) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>Workspace Active Engines & Integrations</span>
          </h3>
          <button
            onClick={() =>
              triggerNavigationHandoff(onNavigate, {
                sourceScreen: 'dashboard',
                sourceLabel: 'Executive Dashboard',
                contextTitle: 'Configure Engines & Integrations',
                contextBadge: 'Integrations',
                targetScreen: 'integrations',
              })
            }
            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Configure Providers <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Tile 1: LLM Engine */}
          <Card
            onClick={() =>
              triggerNavigationHandoff(onNavigate, {
                sourceScreen: 'dashboard',
                sourceLabel: 'Executive Dashboard',
                contextTitle: 'LLM Reasoning Providers',
                contextBadge: 'LLM Provider',
                targetScreen: 'integrations',
              })
            }
            className="p-3.5 border hover:border-teal-500/50 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3"
          >
            <div
              className={`h-3 w-3 rounded-full shrink-0 ${
                providers?.llm?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {providers?.llm?.configured ? activeLlmName : 'LLM Provider'}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {providers?.llm?.configured ? 'Active Reasoning' : 'Click to Configure'}
              </p>
            </div>
          </Card>

          {/* Tile 2: STT Recognition */}
          <Card
            onClick={() =>
              triggerNavigationHandoff(onNavigate, {
                sourceScreen: 'dashboard',
                sourceLabel: 'Executive Dashboard',
                contextTitle: 'STT Transcription Engine',
                contextBadge: 'STT Engine',
                targetScreen: 'integrations',
              })
            }
            className="p-3.5 border hover:border-teal-500/50 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3"
          >
            <div
              className={`h-3 w-3 rounded-full shrink-0 ${
                providers?.stt?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {providers?.stt?.configured ? activeSttName : 'STT Engine'}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {providers?.stt?.configured ? 'Real-Time Transcriber' : 'Click to Configure'}
              </p>
            </div>
          </Card>

          {/* Tile 3: Voice Synthesizer */}
          <Card
            onClick={() =>
              triggerNavigationHandoff(onNavigate, {
                sourceScreen: 'dashboard',
                sourceLabel: 'Executive Dashboard',
                contextTitle: 'Voice Synthesizer Tuning',
                contextBadge: 'Voice Synthesizer',
                targetScreen: 'integrations',
              })
            }
            className="p-3.5 border hover:border-teal-500/50 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3"
          >
            <div
              className={`h-3 w-3 rounded-full shrink-0 ${
                providers?.voice?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {providers?.voice?.configured ? activeVoiceName : 'Voice Synthesizer'}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {providers?.voice?.configured ? 'Audio Synthesis Ready' : 'Click to Configure'}
              </p>
            </div>
          </Card>

          {/* Tile 4: Telephony Carrier & GSM */}
          <Card
            onClick={() =>
              triggerNavigationHandoff(onNavigate, {
                sourceScreen: 'dashboard',
                sourceLabel: 'Executive Dashboard',
                contextTitle: 'GSM Gateway Hardware Control',
                contextBadge: 'GSM Gateway',
                targetScreen: 'android-gateway',
              })
            }
            className="p-3.5 border hover:border-teal-500/50 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3"
          >
            <div
              className={`h-3 w-3 rounded-full shrink-0 ${
                metrics.total_phone_numbers > 0 || metrics.total_gsm_devices > 0
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {metrics.total_gsm_devices > 0 ? 'GSM Gateway Active' : metrics.total_phone_numbers > 0 ? 'SIP Trunk Pool' : 'Carrier Telephony'}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {metrics.total_gsm_devices + metrics.total_phone_numbers > 0 ? `${metrics.total_gsm_devices + metrics.total_phone_numbers} Connected Lines` : 'Pair GSM Phone'}
              </p>
            </div>
          </Card>

          {/* Tile 5: Knowledge Base RAG */}
          <Card
            onClick={() =>
              triggerNavigationHandoff(onNavigate, {
                sourceScreen: 'dashboard',
                sourceLabel: 'Executive Dashboard',
                contextTitle: 'Knowledge Base Documents',
                contextBadge: 'Knowledge Base',
                targetScreen: 'knowledge-base',
              })
            }
            className="p-3.5 border hover:border-teal-500/50 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3"
          >
            <div
              className={`h-3 w-3 rounded-full shrink-0 ${
                metrics.total_knowledge_docs > 0 ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                Knowledge Base (RAG)
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {metrics.total_knowledge_docs > 0 ? `${metrics.total_knowledge_docs} Indexed Docs` : 'Upload Documents'}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Two-Column Grid: Left (Recent Calls Stream) | Right (Agents & Campaigns Roster) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Calls & Live Dialogues (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <CardTitle className="text-sm font-bold">Recent Calls & Dialogue Telemetry</CardTitle>
              </div>
              <button
                onClick={() =>
                  triggerNavigationHandoff(onNavigate, {
                    sourceScreen: 'dashboard',
                    sourceLabel: 'Executive Dashboard',
                    contextTitle: 'Call History Database',
                    contextBadge: 'Call History',
                    targetScreen: 'call-history',
                  })
                }
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Call History →
              </button>
            </CardHeader>

            <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
              {recentCalls.length > 0 ? (
                <div className="space-y-2.5 overflow-y-auto max-h-96 pr-1">
                  {recentCalls.map((call) => (
                    <div
                      key={call.id}
                      onClick={() =>
                        triggerNavigationHandoff(onNavigate, {
                          sourceScreen: 'dashboard',
                          sourceLabel: 'Executive Dashboard',
                          contextTitle: `Call Log: ${call.contact_name || call.phone_number || 'Direct Call'}`,
                          contextBadge: 'Call History',
                          targetScreen: 'call-history',
                        })
                      }
                      className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-teal-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 shrink-0">
                          <PhoneCall className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {call.contact_name || call.phone_number || 'Direct Call'}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate">
                            Agent: <strong>{call.agent_name}</strong> • {call.duration_formatted}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={call.sentiment === 'Negative' ? 'danger' : 'success'}
                          size="sm"
                          className="text-[10px]"
                        >
                          {call.sentiment || 'Positive'}
                        </Badge>
                        <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                          ${(call.cost || 0.002).toFixed(4)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-2xl text-teal-600 dark:text-teal-400">
                    <PhoneCall className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No calls recorded yet</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">
                      Launch your first live test call in the Live Call Studio or create an automated outbound AI campaign.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<PlayCircle className="h-4 w-4" />}
                    onClick={() =>
                      triggerNavigationHandoff(onNavigate, {
                        sourceScreen: 'dashboard',
                        sourceLabel: 'Executive Dashboard',
                        contextTitle: 'First Live Call Test',
                        contextBadge: 'Live Studio',
                        targetScreen: 'demo-studio',
                      })
                    }
                    className="mt-2 bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                  >
                    Open Live Call Studio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Agents & Quick Launch Center (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <CardTitle className="text-sm font-bold">Voice Agents in Workspace</CardTitle>
              </div>
              <button
                onClick={() =>
                  triggerNavigationHandoff(onNavigate, {
                    sourceScreen: 'dashboard',
                    sourceLabel: 'Executive Dashboard',
                    contextTitle: 'AI Voice Agents Roster',
                    contextBadge: 'Agents',
                    targetScreen: 'agents',
                  })
                }
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                All Agents →
              </button>
            </CardHeader>

            <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              {recentAgents.length > 0 ? (
                <div className="space-y-2">
                  {recentAgents.map((ag) => (
                    <div
                      key={ag.id}
                      onClick={() =>
                        triggerNavigationHandoff(onNavigate, {
                          sourceScreen: 'dashboard',
                          sourceLabel: 'Executive Dashboard',
                          contextTitle: `Agent: ${ag.name}`,
                          contextBadge: 'Agents',
                          targetScreen: 'agents',
                        })
                      }
                      className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-teal-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{ag.name}</p>
                        <p className="text-[11px] text-zinc-500">
                          {ag.llm_model} • {ag.voice_id}
                        </p>
                      </div>
                      <Badge
                        variant={ag.status === 'active' ? 'success' : 'outline'}
                        size="sm"
                        className="text-[10px]"
                      >
                        {ag.status === 'active' ? 'Active' : 'Draft'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">No Voice Agents Created</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Deploy your first conversational agent with customizable voice and system prompt.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() =>
                      triggerNavigationHandoff(onNavigate, {
                        sourceScreen: 'dashboard',
                        sourceLabel: 'Executive Dashboard',
                        contextTitle: 'Create Voice Agent',
                        contextBadge: 'Agents',
                        targetScreen: 'agents',
                      })
                    }
                    className="mt-2 text-xs font-bold border-teal-500/40 text-teal-700 dark:text-teal-300 cursor-pointer"
                  >
                    Create Voice Agent
                  </Button>
                </div>
              )}

              {/* Workspace Quick Jump Shortcuts */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Quick Navigation Hub
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      triggerNavigationHandoff(onNavigate, {
                        sourceScreen: 'dashboard',
                        sourceLabel: 'Executive Dashboard',
                        contextTitle: 'Campaigns Overview',
                        contextBadge: 'AI Campaigns',
                        targetScreen: 'campaigns',
                      })
                    }
                    className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-left hover:bg-teal-50/50 dark:hover:bg-teal-950/20 hover:border-teal-500/40 transition-all flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    <Megaphone className="h-3.5 w-3.5 text-teal-600" />
                    <span>AI Campaigns ({metrics.total_campaigns})</span>
                  </button>

                  <button
                    onClick={() =>
                      triggerNavigationHandoff(onNavigate, {
                        sourceScreen: 'dashboard',
                        sourceLabel: 'Executive Dashboard',
                        contextTitle: 'Contacts Directory',
                        contextBadge: 'Contacts',
                        targetScreen: 'contacts',
                      })
                    }
                    className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-left hover:bg-teal-50/50 dark:hover:bg-teal-950/20 hover:border-teal-500/40 transition-all flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    <Users className="h-3.5 w-3.5 text-teal-600" />
                    <span>Contacts ({metrics.total_contacts})</span>
                  </button>

                  <button
                    onClick={() =>
                      triggerNavigationHandoff(onNavigate, {
                        sourceScreen: 'dashboard',
                        sourceLabel: 'Executive Dashboard',
                        contextTitle: 'Voice Workflows Studio',
                        contextBadge: 'Workflows',
                        targetScreen: 'workflows',
                      })
                    }
                    className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-left hover:bg-teal-50/50 dark:hover:bg-teal-950/20 hover:border-teal-500/40 transition-all flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    <GitFork className="h-3.5 w-3.5 text-teal-600" />
                    <span>Workflows ({metrics.total_workflows})</span>
                  </button>

                  <button
                    onClick={() =>
                      triggerNavigationHandoff(onNavigate, {
                        sourceScreen: 'dashboard',
                        sourceLabel: 'Executive Dashboard',
                        contextTitle: 'API & Integrations Hub',
                        contextBadge: 'Integrations',
                        targetScreen: 'integrations',
                      })
                    }
                    className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-left hover:bg-teal-50/50 dark:hover:bg-teal-950/20 hover:border-teal-500/40 transition-all flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    <Sliders className="h-3.5 w-3.5 text-teal-600" />
                    <span>API Integrations</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Plan Guardrail Luxury Modal */}
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
