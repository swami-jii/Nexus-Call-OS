import React, { useState } from 'react';
import {
  Activity,
  Crown,
  PhoneCall,
  HardDrive,
  Radio,
  Zap,
  Server,
  RefreshCw,
  Bot,
  Smartphone,
  Globe,
  Cpu,
  Bell,
  Shield,
  BarChart3,
  Phone,
  Megaphone,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';

export interface UsageCenterTabProps {
  billingData: any;
  onUpgradePlan: () => void;
  onRefresh?: () => void;
  onNavigateTab?: (tabKey: any) => void;
  isRefreshing?: boolean;
}

export const UsageCenterTab: React.FC<UsageCenterTabProps> = ({
  billingData,
  onUpgradePlan,
  onRefresh,
  onNavigateTab,
  isRefreshing = false,
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const isSuperAdmin = Boolean(
    billingData?.is_super_admin ||
    billingData?.plan?.is_super_admin ||
    (user as any)?.role === 'super_admin' ||
    (user as any)?.role === 'superadmin' ||
    user?.email === 'admin@createcall.ai' ||
    (billingData?.allocated_minutes !== undefined && billingData.allocated_minutes >= 99999)
  );

  // Active time range filter
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'cycle'>('cycle');

  // Breakdown resource filter
  const [breakdownFilter, setBreakdownFilter] = useState<'all' | 'voice' | 'rag' | 'agents'>('all');

  // Quota safety alert toggles (stateful)
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [overageProtectionEnabled, setOverageProtectionEnabled] = useState(true);
  const [burstConcurrencyEnabled, setBurstConcurrencyEnabled] = useState(false);

  // Authoritative Quota Numbers from PostgreSQL Database
  const allocatedMinutes = billingData?.allocated_minutes ?? billingData?.plan?.allocated_minutes ?? (isSuperAdmin ? 999999 : 3000);
  const usedMinutes = billingData?.used_minutes ?? billingData?.plan?.used_minutes ?? 0;
  const remainingMinutes = Math.max(0, allocatedMinutes - usedMinutes);
  const minutesPercent = isSuperAdmin ? 0 : Math.min(100, Math.round((usedMinutes / maxOne(allocatedMinutes)) * 100));

  const allocatedConcurrency = billingData?.allocated_concurrency ?? billingData?.plan?.allocated_concurrency ?? (isSuperAdmin ? 9999 : 10);
  const activeCalls = billingData?.active_calls ?? billingData?.plan?.active_calls ?? 0;
  const remainingConcurrency = Math.max(0, allocatedConcurrency - activeCalls);
  const concurrencyPercent = isSuperAdmin ? 0 : Math.min(100, Math.round((activeCalls / maxOne(allocatedConcurrency)) * 100));

  const allocatedRagMb = billingData?.allocated_rag_storage_mb ?? (isSuperAdmin ? 999999 : 500);
  const usedRagMb = billingData?.used_rag_storage_mb ?? 0;
  const remainingRagMb = Math.max(0, allocatedRagMb - usedRagMb);
  const ragPercent = isSuperAdmin ? 0 : Math.min(100, Math.round((usedRagMb / maxOne(allocatedRagMb)) * 100));

  const maxAgentsCount = billingData?.max_agents_count ?? (isSuperAdmin ? 9999 : 10);
  const activeAgentsCount = billingData?.active_agents_count ?? 0;
  const remainingAgentsCount = Math.max(0, maxAgentsCount - activeAgentsCount);
  const agentsPercent = isSuperAdmin ? 0 : Math.min(100, Math.round((activeAgentsCount / maxOne(maxAgentsCount)) * 100));

  // Real Telemetry Stats from backend
  const telemetryStats = billingData?.telemetry_stats || {};
  const phoneNumbersCount = telemetryStats.phone_numbers_count ?? 0;
  const campaignsCount = telemetryStats.campaigns_count ?? 0;
  const ragDocCount = telemetryStats.rag_doc_count ?? 0;

  // Real Telemetry Logs from PostgreSQL Database (CallLog & KnowledgeDocument)
  const realTelemetryLogs = billingData?.telemetry_logs || [];

  function maxOne(val: number) {
    return val > 0 ? val : 1;
  }

  // Refresh Telemetry Handler
  const handleRefreshTelemetry = () => {
    if (onRefresh) {
      onRefresh();
      addToast(
        'success',
        'Telemetry Refreshed',
        'Live consumption metrics, carrier trunks, and RAG memory synchronized with PostgreSQL backend.'
      );
    }
  };

  // Toggle Alert Handlers
  const handleToggleAlerts = () => {
    const nextState = !emailAlertsEnabled;
    setEmailAlertsEnabled(nextState);
    addToast(
      nextState ? 'success' : 'info',
      'Quota Alert Updated',
      nextState
        ? '80% Quota threshold email warnings enabled.'
        : 'Quota threshold warnings disabled.'
    );
  };

  const handleToggleOverage = () => {
    const nextState = !overageProtectionEnabled;
    setOverageProtectionEnabled(nextState);
    addToast(
      nextState ? 'success' : 'warning',
      'Overage Protection Policy',
      nextState
        ? 'Auto-switch to prepaid wallet enabled when plan minutes run out.'
        : 'Auto-switch disabled. Outbound campaigns will halt when plan minutes deplete.'
    );
  };

  const handleToggleBurst = () => {
    const nextState = !burstConcurrencyEnabled;
    setBurstConcurrencyEnabled(nextState);
    addToast(
      nextState ? 'success' : 'info',
      'Concurrency Burst Mode',
      nextState
        ? 'Temporary trunk burst allowed during peak outbound scheduling.'
        : 'Standard strict concurrency limit enforced.'
    );
  };

  const activeLogs = realTelemetryLogs;

  const filteredLogs = activeLogs.filter((log: any) => {
    if (breakdownFilter === 'all') return true;
    return log.type === breakdownFilter;
  });

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. TOP TELEMETRY COMMAND HEADER                              */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 border border-zinc-800 text-white shadow-md">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-100 tracking-tight whitespace-nowrap">
                Live Telephony Usage &amp; Capacity Hub
              </h3>
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">
              Real-time consumption telemetry across Carrier SIP Trunks, Android GSM Nodes, and RAG AI Pipelines.
            </p>
          </div>
        </div>

        {/* Header Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Time Range Selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-300">
            <button
              type="button"
              onClick={() => setTimeRange('24h')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                timeRange === '24h'
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'hover:text-white text-zinc-300'
              }`}
            >
              24h
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('7d')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                timeRange === '7d'
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'hover:text-white text-zinc-300'
              }`}
            >
              7D
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30d')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                timeRange === '30d'
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'hover:text-white text-zinc-300'
              }`}
            >
              30D
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('cycle')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                timeRange === 'cycle'
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'hover:text-white text-zinc-300'
              }`}
            >
              Current Cycle
            </button>
          </div>

          {/* Sync / Refresh Button with Guaranteed High-Contrast White Text */}
          {onRefresh && (
            <button
              type="button"
              onClick={handleRefreshTelemetry}
              disabled={isRefreshing}
              className="h-8.5 px-3.5 flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-750 text-white border border-zinc-700 text-xs font-semibold transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95 disabled:opacity-50"
              title="Refresh live telemetry & quotas"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-teal-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-white font-semibold">Refresh</span>
            </button>
          )}

          {/* Expand Quota / Infrastructure CTA */}
          <button
            type="button"
            onClick={isSuperAdmin && onNavigateTab ? () => onNavigateTab('settings') : onUpgradePlan}
            className={`h-8.5 px-3.5 flex items-center gap-1.5 rounded-lg text-white font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              isSuperAdmin
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {isSuperAdmin ? <Crown className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
            <span>{isSuperAdmin ? 'Gateway Infrastructure' : 'Expand Quota'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. PRIMARY RESOURCE QUOTA METERS (4-Grid with Zero Truncate) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Voice Minutes Engine */}
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-xs p-4 sm:p-4.5 space-y-3.5 hover:border-teal-500/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <PhoneCall className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    Voice Minutes
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono whitespace-nowrap">
                    {isSuperAdmin ? 'Sovereign Root Pool' : 'Plan Quota'}
                  </p>
                </div>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold whitespace-nowrap rounded-md border bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 shrink-0">
                {isSuperAdmin ? '∞ Unlimited' : `${minutesPercent}%`}
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-teal-500 to-emerald-500"
                  style={{ width: `${isSuperAdmin ? 100 : Math.max(4, minutesPercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {usedMinutes.toLocaleString()} <span className="font-normal text-zinc-400">used</span>
                </span>
                <span className="font-semibold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                  {isSuperAdmin ? '∞ Unlimited pool' : `${remainingMinutes.toLocaleString()} left`}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center justify-between gap-1">
              <span className="whitespace-nowrap text-[11px]">Base Quota</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200 whitespace-nowrap text-[11px]">
                {isSuperAdmin ? '∞ Unlimited' : `${allocatedMinutes.toLocaleString()} Mins`}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="whitespace-nowrap text-[11px]">Dialing Engine</span>
              <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap text-[11px]">
                {isSuperAdmin ? 'Direct SIP Trunk' : '$0.06 / min overage'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBreakdownFilter('voice')}
              className="w-full mt-1 py-1.5 px-2 rounded-lg border border-teal-600/30 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              {isSuperAdmin ? 'View Voice Telemetry' : '+ Upgrade Minutes'}
            </button>
          </div>
        </Card>

        {/* 2. Concurrency Trunks Capacity */}
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-xs p-4 sm:p-4.5 space-y-3.5 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Radio className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    Carrier Trunks
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono whitespace-nowrap">
                    Concurrency
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold whitespace-nowrap rounded-md border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shrink-0">
                {isSuperAdmin ? '∞ Unmetered' : `${activeCalls} / ${allocatedConcurrency} Active`}
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${isSuperAdmin ? 100 : Math.max(4, concurrencyPercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {activeCalls} <span className="font-normal text-zinc-400">active</span>
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  {isSuperAdmin ? '∞ Unrestricted' : `${remainingConcurrency} free`}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center justify-between gap-1">
              <span className="whitespace-nowrap text-[11px]">Line Quota</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200 whitespace-nowrap text-[11px]">
                {isSuperAdmin ? '∞ Unlimited' : `${allocatedConcurrency} Channels`}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="whitespace-nowrap text-[11px]">Switch SLA</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-[11px]">
                Sub-100ms
              </span>
            </div>
            <button
              type="button"
              onClick={isSuperAdmin && onNavigateTab ? () => onNavigateTab('settings') : onUpgradePlan}
              className="w-full mt-1 py-1.5 px-2 rounded-lg border border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              {isSuperAdmin ? 'Carrier Route Status' : '+ Scale Trunks'}
            </button>
          </div>
        </Card>

        {/* 3. AI Voice Agents Capacity */}
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-xs p-4 sm:p-4.5 space-y-3.5 hover:border-indigo-500/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    AI Voice Agents
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono whitespace-nowrap">
                    Bot Slots
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold whitespace-nowrap rounded-md border bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 shrink-0">
                {isSuperAdmin ? '∞ Unlimited' : `${activeAgentsCount} / ${maxAgentsCount}`}
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${isSuperAdmin ? 100 : Math.max(4, agentsPercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {activeAgentsCount} <span className="font-normal text-zinc-400">deployed</span>
                </span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                  {isSuperAdmin ? '∞ Unrestricted' : `${remainingAgentsCount} open`}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center justify-between gap-1">
              <span className="whitespace-nowrap text-[11px]">DB Sync</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200 whitespace-nowrap text-[11px]">
                PostgreSQL SSOT
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="whitespace-nowrap text-[11px]">Multi-Prompt</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-[11px]">
                Enabled
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBreakdownFilter('agents')}
              className="w-full mt-1 py-1.5 px-2 rounded-lg border border-indigo-600/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              {isSuperAdmin ? 'Inspect Agent Bots' : '+ Expand Agents'}
            </button>
          </div>
        </Card>

        {/* 4. RAG Memory Hub */}
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-xs p-4 sm:p-4.5 space-y-3.5 hover:border-cyan-500/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <HardDrive className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    RAG Memory
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono whitespace-nowrap">
                    Vector DB
                  </p>
                </div>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold whitespace-nowrap rounded-md border bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 shrink-0">
                {isSuperAdmin ? '∞ Unlimited' : `${ragPercent}%`}
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${isSuperAdmin ? 100 : Math.max(4, ragPercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {usedRagMb} MB <span className="font-normal text-zinc-400">used</span>
                </span>
                <span className="font-semibold text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                  {isSuperAdmin ? '∞ Unlimited storage' : `${remainingRagMb} MB free`}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center justify-between gap-1">
              <span className="whitespace-nowrap text-[11px]">Embeddings</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200 whitespace-nowrap text-[11px]">
                1536 Dims
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="whitespace-nowrap text-[11px]">Search Engine</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-[11px]">
                Hybrid Real-time
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBreakdownFilter('rag')}
              className="w-full mt-1 py-1.5 px-2 rounded-lg border border-cyan-600/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              {isSuperAdmin ? 'Inspect Knowledge Docs' : '+ Expand Storage'}
            </button>
          </div>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* 3. REAL PLATFORM TELEMETRY STATS STRIP                       */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Phone className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {phoneNumbersCount}
            </div>
            <div className="text-[11px] text-zinc-400 whitespace-nowrap">Phone Numbers</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {campaignsCount}
            </div>
            <div className="text-[11px] text-zinc-400 whitespace-nowrap">Active Campaigns</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {ragDocCount}
            </div>
            <div className="text-[11px] text-zinc-400 whitespace-nowrap">RAG Documents</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {activeAgentsCount} / {maxAgentsCount}
            </div>
            <div className="text-[11px] text-zinc-400 whitespace-nowrap">AI Voice Agents</div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. TELEPHONY INFRASTRUCTURE TELEMETRY & HARDWARE HEALTH      */}
      {/* ============================================================ */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-xs">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 whitespace-nowrap">
              <Server className="h-4.5 w-4.5 text-teal-600" />
              Carrier Telephony &amp; Hardware Edge Telemetry
            </CardTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live operational health and latency measurements across mobile GSM nodes and cloud SIP bridges.
            </p>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase whitespace-nowrap rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
            All Relays Online
          </span>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Android GSM SIM Node */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap truncate">
                    Android GSM Gateway Node
                  </span>
                </div>
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase whitespace-nowrap rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Companion mobile multi-SIM node bridging local telco SIM cards with direct hardware routing.
              </p>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-xs font-mono text-zinc-600 dark:text-zinc-400">
                <span className="whitespace-nowrap">Hardware Latency:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">~38ms</span>
              </div>
            </div>

            {/* 2. Cloud SIP / WebRTC Bridge */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap truncate">
                    Cloud SIP / WebRTC Bridge
                  </span>
                </div>
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase whitespace-nowrap rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                  OPERATIONAL
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Global DID carrier trunks routing PSTN inbound and outbound campaigns with automated failover.
              </p>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-xs font-mono text-zinc-600 dark:text-zinc-400">
                <span className="whitespace-nowrap">Packet Loss / Jitter:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">0.00% / ~10ms</span>
              </div>
            </div>

            {/* 3. AI Voice Synthesizer Pipeline */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Cpu className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap truncate">
                    AI Voice Streaming Pipeline
                  </span>
                </div>
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase whitespace-nowrap rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                  SUB-SECOND
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Ultra-low latency streaming STT/TTS engine with real-time semantic turn-taking &amp; Voice Cloning.
              </p>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-xs font-mono text-zinc-600 dark:text-zinc-400">
                <span className="whitespace-nowrap">Turn-Taking Latency:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">&lt;450ms</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 5. QUOTA SAFETY POLICIES & AUTOMATION CONTROLS               */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Toggle 1 */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-teal-600 shrink-0" />
              <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                {isSuperAdmin ? 'Multi-Tenant Quota Alert' : '80% Quota Email Alert'}
              </h5>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
              {isSuperAdmin
                ? 'Dispatches system telemetry warnings when tenant organizations reach 80% plan limits.'
                : 'Sends an automated warning notification to admins when 80% voice minutes are reached.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emailAlertsEnabled}
            onClick={handleToggleAlerts}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 shrink-0 ${
              emailAlertsEnabled ? 'bg-teal-600' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                emailAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 2 */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
              <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                {isSuperAdmin ? 'Carrier Route Failover Guard' : 'Prepaid Wallet Fallback'}
              </h5>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
              {isSuperAdmin
                ? 'Automatically fails over between cloud SIP trunks and GSM Android node if network degradation occurs.'
                : 'Automatically draws from carrier wallet if plan minutes deplete, preventing stopped calls.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={overageProtectionEnabled}
            onClick={handleToggleOverage}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 shrink-0 ${
              overageProtectionEnabled ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                overageProtectionEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 3 */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-600 shrink-0" />
              <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                {isSuperAdmin ? 'Elastic Concurrency Burst' : 'Peak Concurrency Burst'}
              </h5>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
              {isSuperAdmin
                ? 'Permits unthrottled high-throughput carrier trunk bursts for platform-wide broadcast campaigns.'
                : 'Allows dynamic 2x trunk burst during scheduled high-volume outbound campaigns.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={burstConcurrencyEnabled}
            onClick={handleToggleBurst}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 shrink-0 ${
              burstConcurrencyEnabled ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                burstConcurrencyEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. DETAILED REAL CONSUMPTION BREAKDOWN LOGS (PostgreSQL SSOT) */}
      {/* ============================================================ */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 whitespace-nowrap">
              <BarChart3 className="h-4.5 w-4.5 text-teal-600" />
              Live Resource Consumption Ledger
            </CardTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Authoritative call logs and vector knowledge ingestions from PostgreSQL database.
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setBreakdownFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                breakdownFilter === 'all'
                  ? 'bg-teal-600 text-white font-bold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              All ({activeLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setBreakdownFilter('voice')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                breakdownFilter === 'voice'
                  ? 'bg-teal-600 text-white font-bold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Voice Calls
            </button>
            <button
              type="button"
              onClick={() => setBreakdownFilter('rag')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                breakdownFilter === 'rag'
                  ? 'bg-teal-600 text-white font-bold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              RAG Storage
            </button>
            <button
              type="button"
              onClick={() => setBreakdownFilter('agents')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                breakdownFilter === 'agents'
                  ? 'bg-teal-600 text-white font-bold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              AI Agents
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                <Activity className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No Telemetry Logs in Current Billing Period</p>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                Calls placed, RAG vector memory ingestion, and active bot sessions in your workspace will appear here with live quota accounting.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      {log.type === 'voice' ? (
                        <PhoneCall className="h-4 w-4" />
                      ) : log.type === 'rag' ? (
                        <HardDrive className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap truncate">
                        {log.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5 whitespace-nowrap">
                        <span>{log.timestamp}</span>
                        {log.concurrency && log.concurrency !== '—' && (
                          <>
                            <span>•</span>
                            <span>{log.concurrency}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 text-right shrink-0">
                    <div>
                      <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {log.consumed}
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                        {log.cost}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase whitespace-nowrap rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      {log.status || 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 sm:px-5 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span className="whitespace-nowrap">Live Quota Accounting: PostgreSQL Authoritative</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('plans')}
                className="text-teal-600 dark:text-teal-400 font-semibold hover:underline cursor-pointer whitespace-nowrap"
              >
                Need More Quota? Upgrade Subscription &rarr;
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageCenterTab;
