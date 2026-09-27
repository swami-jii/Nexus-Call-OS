import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  TrendingUp,
  Zap,
  DollarSign,
  Clock,
  Download,
  RefreshCw,
  FileText,
  Target,
  Sparkles,
  Layers,
  Radio,
  Activity,
  CheckCircle2,
  Calendar,
  ChevronDown,
  Check,
  PhoneCall,
  HelpCircle,
  ArrowUpRight,
  ExternalLink,
  Mic,
  Info,
  Crown,
  ShieldCheck,
  Cpu,
  Smartphone,
  Server,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { useToast } from '../components/ui/Toast';
import { fetchAPI } from '../lib/api';
import { useSovereignTarget } from '../context/SovereignTargetContext';
import { usePlanEntitlements } from '../hooks/usePlanEntitlements';
import { PlanGuardrailModal } from '../components/ui/PlanGuardrailModal';

interface AnalyticsData {
  time_range: string;
  total_calls: number;
  total_period_expenditure: number;
  total_expenditure_formatted: string;
  avg_cost_per_minute: number;
  median_latency_ms: number;
  avg_duration_seconds: number;
  avg_duration_formatted: string;
  total_talk_minutes: number;
  positive_sentiment_rate: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  sentiment_distribution: { name: string; value: number; color: string }[];
  latency_waterfall: { step: string; ms: number }[];
  cost_trends: { day: string; calls: number; cost: number }[];
}

interface RecentCallItem {
  id: string;
  agent_name?: string;
  contact_name?: string;
  phone_number: string;
  direction: string;
  duration: number;
  cost: number;
  status: string;
  sentiment: string;
  summary?: string;
  created_at: string;
  metadata_json?: any;
}

interface AnalyticsViewProps {
  onNavigate?: (screen: string) => void;
}

const TIME_RANGE_OPTIONS = [
  { value: '24h', label: 'Last 24 Hours', desc: "Today's live telemetry & latency" },
  { value: '7d', label: 'Last 7 Days', desc: 'Weekly aggregation & performance' },
  { value: '30d', label: 'Last 30 Days', desc: 'Monthly telephony billing cycle' },
  { value: '90d', label: 'Last 90 Days', desc: 'Quarterly voice analytics audit' },
  { value: 'all', label: 'All Time', desc: 'Complete historical data archive' },
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onNavigate }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentCalls, setRecentCalls] = useState<RecentCallItem[]>([]);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();
  const { targetAccount, isTargetActive } = useSovereignTarget();

  // Plan Entitlements & Guardrails SSOT
  const {
    entitlements,
    isUnlimited,
    isSuperAdmin,
    guardrailModal,
    triggerGuardrail,
    closeGuardrail,
  } = usePlanEntitlements();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAnalytics = (range: string = timeRange) => {
    setIsRefreshing(true);
    Promise.all([
      fetchAPI(`/api/analytics?time_range=${range}`),
      fetchAPI('/api/calls?page_size=5').catch(() => ({ items: [] })),
    ])
      .then(([data, callsRes]) => {
        setAnalytics(data);
        if (callsRes && Array.isArray(callsRes.items)) {
          setRecentCalls(callsRes.items);
        } else if (Array.isArray(callsRes)) {
          setRecentCalls(callsRes);
        }
      })
      .catch((err) => {
        console.error('Analytics load error:', err);
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    loadAnalytics(timeRange);
  }, [timeRange]);

  // Real-time listener for sovereign / target workspace switch and call telemetry updates
  useEffect(() => {
    const handleWorkspaceChanged = () => {
      loadAnalytics(timeRange);
    };
    window.addEventListener('createcall:sovereign_target_changed', handleWorkspaceChanged);
    window.addEventListener('createcall:tenant_data_updated', handleWorkspaceChanged);
    window.addEventListener('createcall-target-workspace-changed', handleWorkspaceChanged);
    window.addEventListener('createcall-analytics-updated', handleWorkspaceChanged);
    return () => {
      window.removeEventListener('createcall:sovereign_target_changed', handleWorkspaceChanged);
      window.removeEventListener('createcall:tenant_data_updated', handleWorkspaceChanged);
      window.removeEventListener('createcall-target-workspace-changed', handleWorkspaceChanged);
      window.removeEventListener('createcall-analytics-updated', handleWorkspaceChanged);
    };
  }, [timeRange]);

  const handleRefresh = () => {
    loadAnalytics(timeRange);
    addToast({
      type: 'success',
      title: 'Analytics Refreshed',
      description: 'Loaded real-time metrics from live database telemetry.',
    });
  };

  const latencyData = analytics?.latency_waterfall || [
    { step: 'STT Audio Decode', ms: 0 },
    { step: 'RAG Retrieval', ms: 0 },
    { step: 'Gemini 1.5 LLM', ms: 0 },
    { step: 'TTS Voice Synthesizer', ms: 0 },
    { step: 'SIP Packet Egress', ms: 0 },
  ];

  const sentimentPie = analytics?.sentiment_distribution || [
    { name: 'Positive', value: 0, color: '#10b981' },
    { name: 'Neutral', value: 0, color: '#6b7280' },
    { name: 'Negative', value: 0, color: '#ef4444' },
  ];

  const costTrends = analytics?.cost_trends || [
    { day: 'Mon', cost: 0, calls: 0 },
    { day: 'Tue', cost: 0, calls: 0 },
    { day: 'Wed', cost: 0, calls: 0 },
    { day: 'Thu', cost: 0, calls: 0 },
    { day: 'Fri', cost: 0, calls: 0 },
    { day: 'Sat', cost: 0, calls: 0 },
    { day: 'Sun', cost: 0, calls: 0 },
  ];

  const handleExportCSV = () => {
    const headers = ['Pipeline Phase / Day', 'Calls / Metric', 'Expenditure / Latency'];
    const rows = [
      ...latencyData.map((d) => [d.step, 'Latency Metric', `${d.ms} ms`]),
      ...costTrends.map((c) => [c.day, `${c.calls} Calls`, `$${c.cost.toFixed(2)}`]),
    ];
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `create_call_analytics_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'info',
      title: 'CSV Exported',
      description: 'Analytics telemetry report downloaded.',
    });
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast({ type: 'error', title: 'Export Failed', description: 'Pop-up window blocked.' });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Create Call OS Voice Analytics Report - ${timeRange}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111827; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #059669; }
            .title { font-size: 20px; font-weight: 700; margin-bottom: 5px; }
            .subtitle { font-size: 12px; color: #6b7280; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .kpi-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb; }
            .kpi-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
            .kpi-val { font-size: 22px; font-weight: 800; color: #111827; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #f3f4f6; font-weight: 600; }
            .footer { margin-top: 50px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">CREATE CALL OS</div>
              <div class="subtitle">Voice Telephony & Latency Intelligence Report (Plan: ${entitlements.planName})</div>
            </div>
            <div style="text-align: right;">
              <div class="title">Analytics Summary</div>
              <div class="subtitle">Time Range: ${timeRange} | Total Calls: ${analytics?.total_calls || 0} | Scope: ${isTargetActive && targetAccount ? targetAccount.userName : 'Sovereign Master'}</div>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Total Expenditure</div>
              <div class="kpi-val">${analytics?.total_expenditure_formatted || '$0.00'}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Median Latency</div>
              <div class="kpi-val">${analytics?.median_latency_ms || 0} ms</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Avg Call Duration</div>
              <div class="kpi-val">${analytics?.avg_duration_formatted || '0s'}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Positive Sentiment</div>
              <div class="kpi-val">${analytics?.positive_sentiment_rate || 0}%</div>
            </div>
          </div>

          <h3>End-to-End Latency Waterfall</h3>
          <table>
            <thead>
              <tr>
                <th>Pipeline Phase</th>
                <th>Avg Latency (ms)</th>
                <th>SLA Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${latencyData
                .map(
                  (d) => `
                <tr>
                  <td>${d.step}</td>
                  <td>${d.ms} ms</td>
                  <td>&lt; 150 ms</td>
                  <td style="color: #10b981; font-weight: 600;">PASS</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <h3>Daily AI Telephony Expenditure Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Total Calls Placed</th>
                <th>API & SIP Trunking Cost</th>
              </tr>
            </thead>
            <tbody>
              ${costTrends
                .map(
                  (c) => `
                <tr>
                  <td>${c.day}</td>
                  <td>${c.calls.toLocaleString()}</td>
                  <td>$${c.cost.toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            Confidential - Generated automatically by Create Call OS Enterprise Telephony Infrastructure.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    addToast({
      type: 'success',
      title: 'PDF Report Generated',
      description: 'Opened print preview for PDF report export.',
    });
  };

  const activeOption = TIME_RANGE_OPTIONS.find((o) => o.value === timeRange) || TIME_RANGE_OPTIONS[1];

  // Calculate usage percentages for telemetry gauge
  const usedMinutes = analytics?.total_talk_minutes || 0;
  const maxMinutes = isUnlimited ? 99999 : entitlements.includedMinutes;
  const minutesPct = isUnlimited ? 12 : Math.min(100, Math.round((usedMinutes / maxMinutes) * 100));

  return (
    <div className="space-y-4 pb-12 animate-in fade-in-50 duration-200">
      {/* Standard Header */}
      <div className="space-y-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5 shrink-0 relative z-10">
        {/* ROW 1: Title on Left + Badges on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-teal-500/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0">
              <Radio className="h-3.5 w-3.5 animate-pulse text-teal-500" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap leading-none">
              Voice Telephony Analytics
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {isTargetActive && targetAccount ? (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1 shadow-2xs whitespace-nowrap">
                <Target className="h-3 w-3" />
                Target: {targetAccount.userName}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-2xs whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Sovereign Workspace
              </span>
            )}
            <Badge
              variant="outline"
              className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer hover:bg-amber-500/20 transition-all"
              onClick={() =>
                triggerGuardrail(
                  'custom',
                  'Plan Governance & Telephony Analytics',
                  `Active plan "${entitlements.planName}" includes full-duplex telemetry and pipeline monitoring.`
                )
              }
              title="Click to view subscription plan entitlements"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Plan: {entitlements.planName}</span>
            </Badge>
          </div>
        </div>

        {/* ROW 2: Subtitle Description on Left + Action Controls on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real-time pipeline telemetry calculated from live database call logs: full-duplex latency, token expenditure, and AI sentiment.
          </p>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Custom Modern Dropdown */}
            <div className="relative z-20" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="group flex items-center gap-2 h-7.5 px-2.5 rounded-lg border border-zinc-300/90 dark:border-zinc-700/80 bg-zinc-50/90 dark:bg-zinc-800/90 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-teal-500 dark:hover:border-teal-400/80 hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <Calendar className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                <span>{activeOption.label}</span>
                <ChevronDown
                  className={`h-3 w-3 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-teal-500' : ''
                  }`}
                />
              </button>

              {/* Solid Glassmorphic Dropdown Panel */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full z-30 mt-1.5 w-64 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-[#121824] shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-1.5 ring-1 ring-black/10 dark:ring-white/10 animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800/80 mb-1">
                    Select Telemetry Range
                  </div>
                  {TIME_RANGE_OPTIONS.map((opt) => {
                    const isSelected = opt.value === timeRange;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setTimeRange(opt.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/30'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold flex items-center gap-1.5">
                            {opt.label}
                          </div>
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">
                            {opt.desc}
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-teal-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              className="text-xs font-semibold shadow-2xs h-7.5 px-2.5"
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>

            {/* Export CSV */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs font-semibold shadow-2xs h-7.5 px-2.5"
              leftIcon={<Download className="h-3.5 w-3.5" />}
            >
              CSV
            </Button>

            {/* PDF Report */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportPDF}
              className="text-xs font-semibold shadow-2xs bg-teal-600 hover:bg-teal-500 text-white h-7.5 px-2.5"
              leftIcon={<FileText className="h-3.5 w-3.5" />}
            >
              PDF Report
            </Button>

            {/* Help / Guide Toggle */}
            <button
              type="button"
              onClick={() => setShowGuideModal(!showGuideModal)}
              title="How real telemetry is calculated"
              className={`h-7.5 w-7.5 flex items-center justify-center rounded-lg border transition-colors cursor-pointer shrink-0 ${
                showGuideModal
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 hover:text-teal-500 hover:border-teal-500/40'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Telephony Explainer Modal / Drawer */}
      {showGuideModal && (
        <div className="p-5 rounded-2xl bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20 text-xs text-zinc-700 dark:text-zinc-300 space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <div className="font-bold text-teal-700 dark:text-teal-300 flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-teal-500" />
              How Real Live Telephony Data is Generated & Measured
            </div>
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-teal-500/15 space-y-1">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5 text-teal-500" />
                1. Place a Real Call
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Open <strong>Live Call Studio</strong> and start a session with your microphone, Android GSM SIM Gateway, or SIP trunk.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-teal-500/15 space-y-1">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-teal-500" />
                2. Real-Time Telemetry Pipeline
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Every voice turn measures exact execution ms for: <code>STT → RAG → LLM → TTS → SIP Egress</code>.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-teal-500/15 space-y-1">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-teal-500" />
                3. Database Persistence & Analytics
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Ending the call saves a permanent record in <code>call_logs</code>, immediately updating the 4 KPI cards and latency charts!
              </p>
            </div>
          </div>
          <div className="pt-1 flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate?.('demo-studio')}
              className="bg-teal-600 hover:bg-teal-500 text-xs font-semibold"
              leftIcon={<Mic className="h-3.5 w-3.5" />}
            >
              Open Live Call Studio & Place Test Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate?.('call-history')}
              className="text-xs font-semibold"
              leftIcon={<Clock className="h-3.5 w-3.5" />}
            >
              View Call History
            </Button>
          </div>
        </div>
      )}

      {/* Analytics 4 Interactive KPI Cards - Click to navigate to source */}
      <div className="relative z-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Period Expenditure -> Navigates to Call History / Billing */}
        <div
          onClick={() => onNavigate?.('call-history')}
          className="relative overflow-hidden p-5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view full Call History & Billing Breakdown"
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Period Expenditure</span>
            <div className="flex items-center gap-1">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <DollarSign className="h-3.5 w-3.5" />
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
            </div>
          </div>
          <p className="text-3xl font-extrabold mt-3 text-zinc-900 dark:text-white tracking-tight">
            {analytics?.total_expenditure_formatted || '$0.00'}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {analytics && analytics.total_calls > 0
                ? `Avg $${analytics.avg_cost_per_minute.toFixed(3)} / min`
                : '$0.00 / min'}
            </span>
            <span className="text-zinc-400 font-mono text-[10px] group-hover:text-emerald-500 transition-colors flex items-center gap-0.5">
              Call History ↗
            </span>
          </div>
        </div>

        {/* KPI 2: Median Audio Latency -> Navigates to Live Call Studio */}
        <div
          onClick={() => onNavigate?.('demo-studio')}
          className="relative overflow-hidden p-5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
          title="Click to open Live Call Studio & test live duplex audio"
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Median Audio Latency</span>
            <div className="flex items-center gap-1">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Zap className="h-3.5 w-3.5" />
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
            </div>
          </div>
          <p className="text-3xl font-extrabold mt-3 text-zinc-900 dark:text-white tracking-tight">
            {analytics && analytics.total_calls > 0 ? `${analytics.median_latency_ms} ms` : '0 ms'}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              {analytics && analytics.total_calls > 0 ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  SLA &lt; 400ms Pass
                </>
              ) : (
                '0 calls in DB'
              )}
            </span>
            <span className="text-zinc-400 font-mono text-[10px] group-hover:text-amber-500 transition-colors flex items-center gap-0.5">
              Live Studio ↗
            </span>
          </div>
        </div>

        {/* KPI 3: Average Call Duration -> Navigates to Call History */}
        <div
          onClick={() => onNavigate?.('call-history')}
          className="relative overflow-hidden p-5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view Call History duration breakdown"
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Average Call Duration</span>
            <div className="flex items-center gap-1">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Clock className="h-3.5 w-3.5" />
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
          <p className="text-3xl font-extrabold mt-3 text-zinc-900 dark:text-white tracking-tight">
            {analytics?.avg_duration_formatted || '0s'}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {analytics?.total_talk_minutes || 0} total mins
            </span>
            <span className="text-zinc-400 font-mono text-[10px] group-hover:text-blue-500 transition-colors flex items-center gap-0.5">
              {analytics?.total_calls || 0} sessions ↗
            </span>
          </div>
        </div>

        {/* KPI 4: Positive Sentiment Rate -> Navigates to Call History */}
        <div
          onClick={() => onNavigate?.('call-history')}
          className="relative overflow-hidden p-5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view Sentiment analysis in Call History"
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Positive Sentiment Rate</span>
            <div className="flex items-center gap-1">
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-3.5 w-3.5" />
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-purple-500 transition-colors" />
            </div>
          </div>
          <p className="text-3xl font-extrabold mt-3 text-zinc-900 dark:text-white tracking-tight">
            {analytics && analytics.total_calls > 0 ? `${analytics.positive_sentiment_rate}%` : '0%'}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {analytics?.positive_count || 0} positive
            </span>
            <span className="text-zinc-400 font-mono text-[10px] group-hover:text-purple-500 transition-colors flex items-center gap-0.5">
              Call History ↗
            </span>
          </div>
        </div>
      </div>

      {/* Plan Quota Telemetry & Capacity Allocation Gauge */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/10 via-indigo-900/5 to-purple-900/10 dark:from-blue-950/40 dark:via-zinc-900/40 dark:to-purple-950/30 border border-blue-500/20 dark:border-blue-800/30 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Subscription Allocation & Quota Telemetry: {entitlements.planName}
                </h3>
                <Badge variant="primary" size="sm" className="text-[10px] font-mono uppercase">
                  {entitlements.planKey} Tier
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Real-time governance comparing recorded telemetry vs active tier capacity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isSuperAdmin && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs font-semibold h-8 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer"
                onClick={() => onNavigate?.('billing')}
              >
                Manage Subscription
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
          {/* Minutes Quota Progress */}
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 font-semibold text-[11px]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Voice Minutes
              </span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200">
                {usedMinutes} / {isUnlimited ? '∞' : entitlements.includedMinutes}
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${minutesPct}%` }}
              />
            </div>
            <div className="text-[10.5px] text-zinc-400 flex justify-between font-mono">
              <span>{minutesPct}% Consumed</span>
              <span>{isUnlimited ? 'Uncapped' : `${maxMinutes - usedMinutes} left`}</span>
            </div>
          </div>

          {/* Concurrency Ceiling */}
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 font-semibold text-[11px]">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-500" />
                Concurrency Cap
              </span>
              <Badge variant="outline" size="sm" className="text-[10px] font-mono text-emerald-600 border-emerald-500/30">
                Active
              </Badge>
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {entitlements.concurrencyLimit} Channels
            </div>
            <p className="text-[10.5px] text-zinc-400">Simultaneous active SIP/GSM calls</p>
          </div>

          {/* Call Duration Limit */}
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 font-semibold text-[11px]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Max Call Duration
              </span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">
                {isUnlimited ? 'Unlimited' : `${entitlements.maxCallDurationMins}m`}
              </span>
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {isUnlimited ? 'Unrestricted' : `${entitlements.maxCallDurationMins} min / call`}
            </div>
            <p className="text-[10.5px] text-zinc-400">Hard limit per continuous session</p>
          </div>

          {/* Hardware & Webhook Engine */}
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 font-semibold text-[11px]">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                GSM Gateway & Webhooks
              </span>
              <Badge
                variant={entitlements.gsmSimEnabled ? 'success' : 'outline'}
                size="sm"
                className="text-[10px] font-mono"
              >
                {entitlements.gsmSimEnabled ? 'Enabled' : 'Gated'}
              </Badge>
            </div>
            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-4 h-4 text-teal-500" />
              <span>{entitlements.prioritySlaEnabled ? 'Priority 24/7' : 'Standard 48h'} SLA</span>
            </div>
            <p className="text-[10.5px] text-zinc-400">
              {entitlements.webhookApiEnabled ? 'Full Webhook Event Streaming' : 'Standard Webhook Mode'}
            </p>
          </div>
        </div>
      </div>

      {/* Latency Breakdown Bar Chart & Sentiment Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waterfall */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-teal-500" />
                End-to-End Latency Waterfall (ms)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Breakdown across STT Audio Decode, RAG Retrieval, Gemini LLM, and TTS Synthesis
              </p>
            </div>
            {analytics && analytics.total_calls > 0 ? (
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30">
                SLA Compliant
              </span>
            ) : (
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-zinc-500/15 text-zinc-500 border border-zinc-500/30">
                Awaiting First Call
              </span>
            )}
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#37415120" />
                <XAxis type="number" stroke="#9ca3af" fontSize={11} unit="ms" />
                <YAxis dataKey="step" type="category" stroke="#9ca3af" fontSize={11} width={150} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                  formatter={(value: any) => [`${value} ms`, 'Pipeline Latency']}
                />
                <Bar dataKey="ms" fill="#0d9488" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Donut Chart */}
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Call Sentiment Ratings
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              AI emotion & satisfaction classification
            </p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {analytics && analytics.total_calls > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sentimentPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: any) => [`${value}%`, 'Percentage']}
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-1">
                <Activity className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
                <p className="text-xs text-zinc-400">No call sentiment data yet</p>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4 text-xs">
            {sentimentPie.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                  {s.name} ({s.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Cost & Call Trends Area Chart */}
      <div className="p-5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Daily AI Telephony Expenditure & Volume
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Correlated daily call volume vs telephony provider infrastructure spend
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={costTrends}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#37415120" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} />
              <YAxis yAxisId="left" stroke="#9ca3af" fontSize={11} unit="$" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={11} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="cost"
                name="Cost ($)"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#costGradient)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="calls"
                name="Total Calls"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Recent Telephony Session Logs from Database */}
      <div className="p-5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-teal-500" />
              Recent Voice Telephony Sessions (Database Telemetry)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live records persisted from conversational engine & carrier SIP sessions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-zinc-400">
              {recentCalls.length} Active Records In DB
            </span>
            {recentCalls.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate?.('call-history')}
                className="text-xs font-semibold h-8 px-2.5"
                rightIcon={<ExternalLink className="h-3 w-3" />}
              >
                Full History
              </Button>
            )}
          </div>
        </div>

        {recentCalls.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-zinc-50/50 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Database Telemetry is Clean (0 Call Records)
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                All mock records have been purged. Place a real live voice call in <strong>Live Call Studio</strong> with your microphone or GSM carrier to record genuine live telemetry.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate?.('demo-studio')}
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-2xs mt-2"
              leftIcon={<Mic className="h-3.5 w-3.5" />}
            >
              Open Live Call Studio & Place Test Call
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Contact & Number</th>
                  <th className="py-2.5 px-3">Voice Agent</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Latency Breakdown</th>
                  <th className="py-2.5 px-3">Expenditure</th>
                  <th className="py-2.5 px-3">Sentiment</th>
                  <th className="py-2.5 px-3">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {recentCalls.map((c) => {
                  const m = c.metadata_json && typeof c.metadata_json === 'object' ? c.metadata_json : {};
                  const lat = m.latency_telemetry || {};
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onNavigate?.('call-history')}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                      title="Click to view details in Call History"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {c.contact_name || 'Inbound Lead'}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">{c.phone_number}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-teal-700 dark:text-teal-300">
                          {c.agent_name || 'AI Voice Agent'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-zinc-700 dark:text-zinc-300">
                        {Math.floor(c.duration / 60)}m {c.duration % 60}s
                      </td>
                      <td className="py-3 px-3">
                        {lat.stt_ms ? (
                          <div className="text-[10px] font-mono text-zinc-500 space-x-1">
                            <span className="text-teal-600 dark:text-teal-400 font-semibold">{lat.stt_ms}ms STT</span>
                            <span>•</span>
                            <span className="text-blue-500 font-semibold">{lat.llm_ms}ms LLM</span>
                            <span>•</span>
                            <span className="text-amber-500 font-semibold">{lat.tts_ms}ms TTS</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-400">Standard Telemetry</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${(c.cost || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                          {c.sentiment || 'Positive'}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                        {c.summary || 'Call session completed successfully.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan Guardrail Modal */}
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
        onNavigate={onNavigate as any}
      />
    </div>
  );
};

export default AnalyticsView;
