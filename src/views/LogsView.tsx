import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Terminal,
  Play,
  Trash2,
  Copy,
  Download,
  Search,
  Check,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Zap,
  Filter,
  ArrowDown,
  ShieldCheck,
  Cpu,
  Smartphone,
  Brain,
  PhoneCall,
  ChevronDown,
  ChevronRight,
  Hash,
  RotateCcw,
  RefreshCw,
  Activity,
  Layers,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { fetchAPI } from '../lib/api';
import { usePlanEntitlements } from '../hooks/usePlanEntitlements';
import { PlanGuardrailModal } from '../components/ui/PlanGuardrailModal';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | string;
  component: string;
  message: string;
  metadata?: Record<string, any>;
}

interface DropdownOption {
  value: string;
  label: string;
  dotColor?: string;
  badge?: string;
  icon?: React.ReactNode;
}

// Sleek Custom Dark Popover Dropdown (High-end obsidian dark menu)
const CustomTerminalDropdown: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: DropdownOption[];
  minWidth?: string;
}> = ({ value, onChange, options, minWidth = 'w-44' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value) || options[0],
    [options, value]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-8 px-2.5 flex items-center justify-between gap-2 rounded-lg bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 text-[11px] font-mono text-zinc-200 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500/40 ${minWidth}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {selectedOption.dotColor && (
            <span className={`h-2 w-2 rounded-full shrink-0 ${selectedOption.dotColor}`} />
          )}
          {selectedOption.icon && (
            <span className="shrink-0 text-zinc-400">{selectedOption.icon}</span>
          )}
          <span className="truncate font-semibold">{selectedOption.label}</span>
        </div>
        <ChevronDown
          className={`h-3 w-3 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-teal-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-52 max-h-72 overflow-y-auto rounded-xl border border-zinc-700/90 bg-[#0e1424] backdrop-blur-xl shadow-2xl p-1.5 focus:outline-none ring-1 ring-white/10 animate-in fade-in-0 zoom-in-95 duration-100 scrollbar-thin">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] font-mono rounded-lg transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-teal-950/70 text-teal-300 font-bold border border-teal-800/60'
                    : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.dotColor && (
                    <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dotColor}`} />
                  )}
                  {opt.icon && <span className="shrink-0 text-zinc-400">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="h-3 w-3 text-teal-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const LogsView: React.FC = () => {
  const { addToast } = useToast();
  const {
    entitlements,
    canExportLogs,
    guardrailModal,
    triggerGuardrail,
    closeGuardrail,
    refreshEntitlements,
  } = usePlanEntitlements();

  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterComponent, setFilterComponent] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [copiedLineId, setCopiedLineId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Monitor user scroll position to toggle floating "Scroll to bottom" button
  const handleScroll = () => {
    if (!terminalContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setShowScrollBottomBtn(!isAtBottom);
  };

  // 1. Initial REST Fetch on arrival
  const loadInitialLogs = useCallback(async () => {
    try {
      const bufferLimit = entitlements.logBufferSize || 50;
      const data = await fetchAPI(`/api/logs?limit=${Math.min(bufferLimit, 500)}`);
      if (data && Array.isArray(data.logs) && data.logs.length > 0) {
        setLogs(data.logs.slice(-bufferLimit));
      }
    } catch {
      // Fallback silently
    }
  }, [entitlements.logBufferSize]);

  // Manual Refresh Handler on user click
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshEntitlements();
      const bufferLimit = entitlements.logBufferSize || 50;
      const data = await fetchAPI(`/api/logs?limit=${Math.min(bufferLimit, 500)}`);
      if (data && Array.isArray(data.logs)) {
        setLogs(data.logs.slice(-bufferLimit));
        addToast('Logs refreshed successfully', 'info');
      }
    } catch {
      addToast('Failed to refresh logs', 'error');
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // 2. Real-Time WebSocket Connection to /ws/logs with Multi-Tenant Auth
  useEffect(() => {
    loadInitialLogs();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const port = '8000';
    const token = localStorage.getItem('nexus_access_token') || sessionStorage.getItem('nexus_access_token') || '';
    const targetOrgId = localStorage.getItem('createcall_target_org_id') || sessionStorage.getItem('createcall_target_org_id') || '';
    const params = new URLSearchParams();
    if (token) params.append('token', token);
    if (targetOrgId) params.append('org_id', targetOrgId);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const wsUrl = `${protocol}//${host}:${port}/ws/logs${queryStr}`;

    let activeWs: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        setWsStatus('connecting');
        activeWs = new WebSocket(wsUrl);
        wsRef.current = activeWs;

        activeWs.onopen = () => {
          setWsStatus('connected');
        };

        activeWs.onmessage = (event) => {
          if (!isStreaming) return;
          try {
            const data = JSON.parse(event.data);
            const limit = entitlements.logBufferSize || 50;
            if (data.type === 'LOG_EVENT' && data.log) {
              setLogs((prev) => {
                const next = [...prev, data.log];
                if (next.length > limit) return next.slice(next.length - limit);
                return next;
              });
            } else if (data.type === 'INITIAL_HISTORY' && Array.isArray(data.logs)) {
              setLogs((prev) => {
                const map = new Map<string, SystemLogEntry>();
                data.logs.forEach((l: SystemLogEntry) => map.set(l.id, l));
                prev.forEach((l) => map.set(l.id, l));
                return Array.from(map.values()).slice(-limit);
              });
            }
          } catch {
            // Ignore malformed packet
          }
        };

        activeWs.onerror = () => {
          setWsStatus('disconnected');
        };

        activeWs.onclose = () => {
          setWsStatus('disconnected');
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        };
      } catch {
        setWsStatus('disconnected');
      }
    };

    connectWebSocket();

    const handleTargetChange = () => {
      loadInitialLogs();
      if (activeWs) {
        activeWs.close();
      }
    };

    const handlePlanUpdated = () => {
      refreshEntitlements();
      loadInitialLogs();
    };

    window.addEventListener('createcall:sovereign_target_changed', handleTargetChange);
    window.addEventListener('createcall:tenant_data_updated', handleTargetChange);
    window.addEventListener('plan-entitlements-updated', handlePlanUpdated);
    window.addEventListener('app-plan-updated', handlePlanUpdated);

    return () => {
      window.removeEventListener('createcall:sovereign_target_changed', handleTargetChange);
      window.removeEventListener('createcall:tenant_data_updated', handleTargetChange);
      window.removeEventListener('plan-entitlements-updated', handlePlanUpdated);
      window.removeEventListener('app-plan-updated', handlePlanUpdated);
      if (activeWs) {
        activeWs.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [loadInitialLogs, isStreaming, entitlements.logBufferSize, refreshEntitlements]);

  // Auto-scroll when new logs arrive and autoScroll is active
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [logs, autoScroll, scrollToBottom]);

  // Statistics calculation
  const stats = useMemo(() => {
    let errors = 0;
    let warnings = 0;
    let telephony = 0;
    let conversation = 0;
    let rag = 0;
    let gsm = 0;

    logs.forEach((l) => {
      if (l.level === 'ERROR') errors++;
      if (l.level === 'WARN') warnings++;
      if (l.component?.includes('TELEPHONY') || l.component?.includes('SIP') || l.component?.includes('VOICE')) telephony++;
      if (l.component?.includes('CONVERSATION') || l.component?.includes('HUMANIZER')) conversation++;
      if (l.component?.includes('RAG') || l.component?.includes('CHUNK') || l.component?.includes('VECTOR')) rag++;
      if (l.component?.includes('GSM')) gsm++;
    });

    return {
      total: logs.length,
      errors,
      warnings,
      telephony,
      conversation,
      rag,
      gsm,
    };
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (filterLevel !== 'ALL' && l.level !== filterLevel) return false;
      if (filterComponent !== 'ALL' && !l.component?.toUpperCase().includes(filterComponent.toUpperCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMsg = l.message?.toLowerCase().includes(q);
        const matchComp = l.component?.toLowerCase().includes(q);
        const matchLvl = l.level?.toLowerCase().includes(q);
        if (!matchMsg && !matchComp && !matchLvl) return false;
      }
      return true;
    });
  }, [logs, filterLevel, filterComponent, searchQuery]);

  // Toggle individual log metadata inspection
  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Copy single log line
  const handleCopyLine = (log: SystemLogEntry) => {
    const text = `[${log.timestamp}] [${log.level}] [${log.component}] ${log.message}${
      log.metadata ? ' ' + JSON.stringify(log.metadata) : ''
    }`;
    navigator.clipboard.writeText(text);
    setCopiedLineId(log.id);
    addToast('Log line copied to clipboard', 'info');
    setTimeout(() => setCopiedLineId(null), 1800);
  };

  // Copy All Filtered Logs
  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.component}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    addToast(`${filteredLogs.length} logs copied to clipboard`, 'success');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Export .log File (Plan-Protected)
  const handleExportLogs = () => {
    if (!canExportLogs()) {
      triggerGuardrail(
        'Log File Export & Telemetry Dumps',
        `Exporting raw execution logs (.log / CSV) is available on Pro, Business, and Enterprise plans. Your current plan (${entitlements.planName}) provides real-time live streaming logs.`,
        'Growth Pro'
      );
      return;
    }

    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.component}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `createcall-telephony-execution-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported system execution log file', 'success');
  };

  // Clear Logs
  const handleClearLogs = async () => {
    try {
      const res = await fetchAPI('/api/logs', { method: 'DELETE' });
      if (res && res.log) {
        setLogs([res.log]);
      } else {
        setLogs([]);
      }
      addToast('Terminal logs buffer cleared', 'info');
    } catch {
      setLogs([]);
    }
  };

  // Simulate Telemetry Event
  const handleSimulateEvent = async () => {
    setIsSimulating(true);
    try {
      const res = await fetchAPI('/api/logs/simulate', { method: 'POST' });
      if (res && res.log) {
        setLogs((prev) => [...prev, res.log]);
        addToast(`Simulated event: ${res.log.component}`, 'success');
      }
    } catch {
      addToast('Failed to simulate telemetry event', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  // Quick Preset Filters
  const setQuickFilter = (comp: string, lvl: string) => {
    setFilterComponent(comp);
    setFilterLevel(lvl);
    setSearchQuery('');
  };

  // Dynamic Master Component Options
  const componentOptions: DropdownOption[] = useMemo(() => {
    return [
      { value: 'ALL', label: `ALL COMPONENTS (${logs.length})`, dotColor: 'bg-zinc-400', icon: <Layers className="h-3 w-3" /> },
      { value: 'TELEPHONY', label: `TELEPHONY & SIP (${stats.telephony})`, dotColor: 'bg-sky-400', icon: <Cpu className="h-3 w-3 text-sky-400" /> },
      { value: 'VOICE', label: `VOICE PIPELINE (${logs.filter((l) => l.component?.toUpperCase().includes('VOICE')).length})`, dotColor: 'bg-cyan-400', icon: <Activity className="h-3 w-3 text-cyan-400" /> },
      { value: 'CONVERSATION', label: `CONVERSATION ENGINE (${stats.conversation})`, dotColor: 'bg-emerald-400', icon: <Brain className="h-3 w-3 text-emerald-400" /> },
      { value: 'RAG', label: `RAG & VECTORS (${stats.rag})`, dotColor: 'bg-purple-400', icon: <Sparkles className="h-3 w-3 text-purple-400" /> },
      { value: 'GSM', label: `GSM GATEWAY (${stats.gsm})`, dotColor: 'bg-amber-400', icon: <Smartphone className="h-3 w-3 text-amber-400" /> },
      { value: 'AUDIO', label: `AUDIO BRIDGE (${logs.filter((l) => l.component?.toUpperCase().includes('AUDIO')).length})`, dotColor: 'bg-indigo-400', icon: <PhoneCall className="h-3 w-3 text-indigo-400" /> },
      { value: 'SECURITY', label: `SECURITY & POLICY (${logs.filter((l) => l.component?.toUpperCase().includes('SECURITY') || l.component?.toUpperCase().includes('AUTH')).length})`, dotColor: 'bg-rose-400', icon: <ShieldCheck className="h-3 w-3 text-rose-400" /> },
      { value: 'SYSTEM', label: `SYSTEM CORE (${logs.filter((l) => l.component?.toUpperCase().includes('SYSTEM')).length})`, dotColor: 'bg-zinc-400', icon: <Terminal className="h-3 w-3 text-zinc-400" /> },
    ];
  }, [logs, stats]);

  // Contextual Level Options scoped to selected component
  const levelOptions: DropdownOption[] = useMemo(() => {
    const scoped = logs.filter((l) => {
      if (filterComponent === 'ALL') return true;
      return l.component?.toUpperCase().includes(filterComponent.toUpperCase());
    });

    const infoCount = scoped.filter((l) => l.level === 'INFO').length;
    const warnCount = scoped.filter((l) => l.level === 'WARN').length;
    const errorCount = scoped.filter((l) => l.level === 'ERROR').length;
    const debugCount = scoped.filter((l) => l.level === 'DEBUG').length;

    return [
      { value: 'ALL', label: `ALL LEVELS (${scoped.length})`, dotColor: 'bg-zinc-400' },
      { value: 'INFO', label: `INFO ONLY (${infoCount})`, dotColor: 'bg-teal-400' },
      { value: 'WARN', label: `WARN ONLY (${warnCount})`, dotColor: 'bg-amber-400' },
      { value: 'ERROR', label: `ERROR ONLY (${errorCount})`, dotColor: 'bg-rose-500' },
      { value: 'DEBUG', label: `DEBUG ONLY (${debugCount})`, dotColor: 'bg-zinc-500' },
    ];
  }, [logs, filterComponent]);

  // Hierarchical Component Filter Handler with Auto-Reset
  const handleComponentChange = (newComp: string) => {
    setFilterComponent(newComp);
    if (filterLevel !== 'ALL') {
      const matchCount = logs.filter((l) => {
        const matchComp = newComp === 'ALL' || l.component?.toUpperCase().includes(newComp.toUpperCase());
        const matchLvl = l.level === filterLevel;
        return matchComp && matchLvl;
      }).length;
      if (matchCount === 0) {
        setFilterLevel('ALL');
      }
    }
  };

  return (
    <div className="space-y-4 pb-12 max-w-full">
      {/* 1. Header Banner with Standard 2-Row Layout */}
      <div className="space-y-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5 shrink-0">
        {/* ROW 1: Heading on Left + Badges on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/25 shrink-0">
              <Terminal className="h-3.5 w-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap leading-none">
              Realtime Terminal Execution Logs
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Badge
              variant={
                wsStatus === 'connected'
                  ? 'emerald'
                  : wsStatus === 'connecting'
                  ? 'amber'
                  : 'neutral'
              }
              className="text-[10px] font-mono flex items-center gap-1.5 px-2 py-0.5 shadow-2xs"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  wsStatus === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : wsStatus === 'connecting'
                    ? 'bg-amber-500'
                    : 'bg-zinc-400'
                }`}
              />
              {wsStatus === 'connected'
                ? 'WebSocket Live'
                : wsStatus === 'connecting'
                ? 'Connecting...'
                : 'Disconnected'}
            </Badge>

            {/* Stream Status Toggle Button */}
            <button
              type="button"
              onClick={() => setIsStreaming(!isStreaming)}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
                isStreaming
                  ? 'bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {isStreaming ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Streaming</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>Resume Stream</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ROW 2: Description on Left + Action Buttons on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Realtime WebRTC stream decoding, 104+ language conversational intelligence, and telephony telemetry.
          </p>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Simulate Event Button */}
            <button
              type="button"
              onClick={handleSimulateEvent}
              disabled={isSimulating}
              className="h-7.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/35 hover:bg-amber-500/20 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/30" />
              <span>{isSimulating ? 'Simulating...' : 'Simulate Event'}</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-7.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs disabled:opacity-60"
            >
              <RefreshCw className={`h-3 w-3 text-zinc-400 ${isRefreshing ? 'animate-spin text-teal-500' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {/* Copy Logs Button */}
            <button
              type="button"
              onClick={handleCopyLogs}
              className="h-7.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
            >
              {copiedAll ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-zinc-400" />}
              <span>{copiedAll ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Export Log Button */}
            <button
              type="button"
              onClick={handleExportLogs}
              className="h-7.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
              title={!canExportLogs() ? 'Log Export (Upgrade to Pro/Enterprise Plan)' : 'Download execution log file'}
            >
              <Download className={`h-3 w-3 ${!canExportLogs() ? 'text-amber-500' : 'text-zinc-400'}`} />
              <span>Export</span>
              {!canExportLogs() && (
                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  PRO
                </span>
              )}
            </button>

            {/* Clear Buffer Button */}
            <button
              type="button"
              onClick={handleClearLogs}
              className="h-7.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all cursor-pointer shadow-2xs"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive High-Tech Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Buffered Logs */}
        <div
          onClick={() => setQuickFilter('ALL', 'ALL')}
          className={`cursor-pointer p-3 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
            filterComponent === 'ALL' && filterLevel === 'ALL'
              ? 'bg-cyan-500/10 dark:bg-cyan-950/40 border-cyan-500/50 ring-1 ring-cyan-500/30 shadow-sm'
              : 'bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Buffered Logs</span>
            <Activity className="h-3.5 w-3.5 text-cyan-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
              {stats.total}
            </span>
            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded font-medium">
              active
            </span>
          </div>
        </div>

        {/* Errors */}
        <div
          onClick={() => setQuickFilter('ALL', 'ERROR')}
          className={`cursor-pointer p-3 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
            filterLevel === 'ERROR'
              ? 'bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/50 ring-1 ring-rose-500/30 shadow-sm'
              : 'bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-900/60'
          }`}
        >
          <div className="flex items-center justify-between text-rose-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Errors</span>
            <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 tracking-tight">
              {stats.errors}
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium ${
                stats.errors > 0
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold animate-pulse'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
              }`}
            >
              {stats.errors > 0 ? 'Critical' : 'Clean'}
            </span>
          </div>
        </div>

        {/* Warnings */}
        <div
          onClick={() => setQuickFilter('ALL', 'WARN')}
          className={`cursor-pointer p-3 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
            filterLevel === 'WARN'
              ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/50 ring-1 ring-amber-500/30 shadow-sm'
              : 'bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-900/60'
          }`}
        >
          <div className="flex items-center justify-between text-amber-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Warnings</span>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 tracking-tight">
              {stats.warnings}
            </span>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-medium">
              audit
            </span>
          </div>
        </div>

        {/* Telephony Events */}
        <div
          onClick={() => setQuickFilter('TELEPHONY', 'ALL')}
          className={`cursor-pointer p-3 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
            filterComponent === 'TELEPHONY'
              ? 'bg-teal-500/10 dark:bg-teal-950/40 border-teal-500/50 ring-1 ring-teal-500/30 shadow-sm'
              : 'bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 hover:border-teal-300 dark:hover:border-teal-900/60'
          }`}
        >
          <div className="flex items-center justify-between text-teal-600 dark:text-teal-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Telephony / SIP</span>
            <Cpu className="h-3.5 w-3.5 text-teal-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-teal-700 dark:text-teal-300 tracking-tight">
              {stats.telephony}
            </span>
            <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.2 rounded font-medium">
              telecom
            </span>
          </div>
        </div>

        {/* RAG & AI Events */}
        <div
          onClick={() => setQuickFilter('RAG', 'ALL')}
          className={`cursor-pointer p-3 rounded-xl border transition-all duration-200 relative overflow-hidden group col-span-2 sm:col-span-1 ${
            filterComponent === 'RAG'
              ? 'bg-purple-500/10 dark:bg-purple-950/40 border-purple-500/50 ring-1 ring-purple-500/30 shadow-sm'
              : 'bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-900/60'
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">RAG & AI Core</span>
            <Brain className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-purple-700 dark:text-purple-300 tracking-tight">
              {stats.rag}
            </span>
            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded font-medium">
              v2.4
            </span>
          </div>
        </div>
      </div>

      {/* 3. Quick Filter Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] font-semibold text-zinc-400 shrink-0 flex items-center gap-1 mr-1">
          <Filter className="h-3 w-3" /> Quick Filter:
        </span>

        <button
          type="button"
          onClick={() => setQuickFilter('ALL', 'ALL')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
            filterComponent === 'ALL' && filterLevel === 'ALL'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
          }`}
        >
          All Logs ({stats.total})
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter('ALL', 'ERROR')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
            filterLevel === 'ERROR'
              ? 'bg-rose-600 text-white font-semibold shadow-xs'
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50'
          }`}
        >
          🔴 Errors ({stats.errors})
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter('ALL', 'WARN')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
            filterLevel === 'WARN'
              ? 'bg-amber-600 text-white font-semibold shadow-xs'
              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50'
          }`}
        >
          ⚠️ Warnings ({stats.warnings})
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter('TELEPHONY', 'ALL')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
            filterComponent === 'TELEPHONY'
              ? 'bg-teal-600 text-white font-semibold shadow-xs'
              : 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50'
          }`}
        >
          📞 SIP & Telephony ({stats.telephony})
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter('CONVERSATION', 'ALL')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
            filterComponent === 'CONVERSATION'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
          }`}
        >
          🗣️ Conversation Engine
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter('RAG', 'ALL')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
            filterComponent === 'RAG'
              ? 'bg-purple-600 text-white font-semibold shadow-xs'
              : 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50'
          }`}
        >
          📚 RAG Vectors ({stats.rag})
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter('GSM', 'ALL')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
            filterComponent === 'GSM'
              ? 'bg-amber-600 text-white font-semibold shadow-xs'
              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50'
          }`}
        >
          📱 GSM Node
        </button>
      </div>

      {/* 4. Terminal Main Frame */}
      <Card className="bg-[#090d16] text-zinc-100 border-zinc-800 shadow-2xl rounded-2xl overflow-visible ring-1 ring-zinc-800/80">
        {/* Tier 1: Terminal Chrome Header */}
        <div className="bg-[#0f1422] border-b border-zinc-800/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3 select-none rounded-t-2xl">
          {/* Left: Window Controls + Shell Path Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56] hover:opacity-80 transition-opacity cursor-pointer inline-block shadow-xs" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e] hover:opacity-80 transition-opacity cursor-pointer inline-block shadow-xs" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f] hover:opacity-80 transition-opacity cursor-pointer inline-block shadow-xs" />
            </div>

            <div className="h-4 w-px bg-zinc-700/60 hidden sm:block" />

            <div className="flex items-center gap-2 font-mono text-xs text-zinc-300 font-semibold truncate">
              <Terminal className="h-3.5 w-3.5 text-teal-400 shrink-0" />
              <span className="truncate">root@createcall-os:~$ tail -f /var/log/telephony.log</span>
            </div>
          </div>

          {/* Right: Meta Badges */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-700/80 text-[10px] text-zinc-300 shadow-inner">
              <span className={`h-1.5 w-1.5 rounded-full ${entitlements.isSuperAdmin ? 'bg-amber-400' : 'bg-teal-400'} animate-pulse`} />
              <span className="font-semibold text-zinc-200">{entitlements.planName}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-teal-400 font-bold">{entitlements.liveTerminalLabel}</span>
            </div>
            <span className="text-[11px] text-zinc-400 hidden sm:inline-block">
              Buffer: <span className="text-zinc-200 font-semibold">{filteredLogs.length}</span> / {entitlements.logBufferSize >= 99999 ? '∞' : entitlements.logBufferSize}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-950/70 border border-teal-600/40 text-[10px] text-teal-300 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              PORT 8000 LIVE
            </span>
          </div>
        </div>

        {/* Tier 2: Search & Custom Styled Dropdowns Bar */}
        <div className="bg-[#0b0f19] border-b border-zinc-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
          {/* Left: Search input + Results Counter */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs (e.g. SIP, 200 OK, latency)..."
                className="h-8 pl-8 pr-7 w-full text-xs font-mono rounded-lg bg-zinc-950/90 border border-zinc-700/80 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <span className="text-[10px] text-teal-400 shrink-0 whitespace-nowrap font-medium">
                {filteredLogs.length} matches
              </span>
            )}
          </div>

          {/* Right: Custom Dark Popover Dropdowns & Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Custom Component Dropdown (No ugly browser native menu) */}
            <CustomTerminalDropdown
              value={filterComponent}
              onChange={handleComponentChange}
              options={componentOptions}
              minWidth="w-48"
            />

            {/* Custom Level Dropdown */}
            <CustomTerminalDropdown
              value={filterLevel}
              onChange={setFilterLevel}
              options={levelOptions}
              minWidth="w-34"
            />

            {/* Line Number Toggle */}
            <button
              type="button"
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              title={showLineNumbers ? 'Line numbers ON' : 'Line numbers OFF'}
              className={`h-8 px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                showLineNumbers
                  ? 'bg-zinc-800/90 border-zinc-600 text-zinc-200'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Hash className="h-3 w-3" />
              <span className="hidden sm:inline">Lines</span>
            </button>

            {/* Auto-Scroll Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !autoScroll;
                setAutoScroll(next);
                if (next) scrollToBottom();
              }}
              title={autoScroll ? 'Auto-scroll is Active' : 'Auto-scroll is Paused'}
              className={`h-8 px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                autoScroll
                  ? 'bg-teal-950/80 border-teal-600 text-teal-300 shadow-xs'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowDown className={`h-3 w-3 ${autoScroll ? 'animate-bounce' : ''}`} />
              <span>Auto-Scroll</span>
            </button>
          </div>
        </div>

        {/* Terminal Stream Canvas */}
        <div className="relative rounded-b-2xl overflow-hidden">
          <div
            ref={terminalContainerRef}
            onScroll={handleScroll}
            className="p-3 sm:p-4 font-mono text-xs h-[520px] overflow-y-auto space-y-1 scrollbar-thin bg-[#090d16] select-text"
          >
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center space-y-3 py-16">
                <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800">
                  <Terminal className="h-8 w-8 text-zinc-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-300">No matching log entries found</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Try adjusting your search query, component, or level filters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterLevel('ALL');
                    setFilterComponent('ALL');
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              filteredLogs.map((l, index) => {
                const levelConfig: Record<
                  string,
                  { badge: string; text: string; bg: string }
                > = {
                  INFO: {
                    badge: 'bg-teal-950/70 text-teal-300 border-teal-800/60',
                    text: 'text-teal-400',
                    bg: 'hover:bg-zinc-900/80',
                  },
                  WARN: {
                    badge: 'bg-amber-950/70 text-amber-300 border-amber-800/60 font-semibold',
                    text: 'text-amber-400',
                    bg: 'hover:bg-amber-950/20 bg-amber-950/10',
                  },
                  ERROR: {
                    badge: 'bg-rose-950/80 text-rose-300 border-rose-700 font-bold',
                    text: 'text-rose-400',
                    bg: 'hover:bg-rose-950/30 bg-rose-950/15',
                  },
                  DEBUG: {
                    badge: 'bg-zinc-900 text-zinc-400 border-zinc-800',
                    text: 'text-zinc-500',
                    bg: 'hover:bg-zinc-900/60',
                  },
                };

                const componentColors: Record<string, string> = {
                  SIP_TELEPHONY: 'text-sky-400 bg-sky-950/50 border-sky-800/60',
                  TELEPHONY_GATEWAY: 'text-sky-400 bg-sky-950/50 border-sky-800/60',
                  VOICE_PIPELINE: 'text-cyan-400 bg-cyan-950/50 border-cyan-800/60',
                  CONVERSATION_ENGINE: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/60',
                  RAG_ENGINE: 'text-purple-400 bg-purple-950/50 border-purple-800/60',
                  GSM_GATEWAY: 'text-amber-300 bg-amber-950/50 border-amber-800/60',
                  AUDIO_BRIDGE: 'text-indigo-400 bg-indigo-950/50 border-indigo-800/60',
                  SECURITY_POLICY: 'text-rose-400 bg-rose-950/50 border-rose-800/60',
                  SYSTEM_BOOT: 'text-zinc-300 bg-zinc-850 border-zinc-700',
                  SYSTEM_CORE: 'text-zinc-300 bg-zinc-850 border-zinc-700',
                };

                const lvl = levelConfig[l.level] || levelConfig.INFO;
                const compBadgeStyle = componentColors[l.component] || 'text-zinc-400 bg-zinc-900 border-zinc-800';
                const isExpanded = expandedLogIds.has(l.id);
                const isCopied = copiedLineId === l.id;

                return (
                  <div
                    key={l.id}
                    className={`group py-1 px-2 rounded-lg border border-transparent hover:border-zinc-800 transition-all font-mono text-[11.5px] leading-relaxed ${lvl.bg}`}
                  >
                    <div className="flex items-start gap-2 sm:gap-2.5">
                      {/* Line Number */}
                      {showLineNumbers && (
                        <span className="text-zinc-600 select-none shrink-0 w-8 text-right font-mono text-[10.5px]">
                          {String(index + 1).padStart(3, '0')}
                        </span>
                      )}

                      {/* Timestamp */}
                      <span className="text-zinc-500 shrink-0 select-none text-[11px] font-mono">
                        {l.timestamp}
                      </span>

                      {/* Level Pill */}
                      <span
                        className={`shrink-0 px-1.5 py-0.2 rounded border text-[10px] font-mono uppercase tracking-wider ${lvl.badge}`}
                      >
                        {l.level}
                      </span>

                      {/* Component Tag */}
                      <span
                        className={`shrink-0 px-1.5 py-0.2 rounded border text-[10.5px] font-semibold font-mono ${compBadgeStyle}`}
                      >
                        [{l.component}]
                      </span>

                      {/* Log Message */}
                      <span className="text-zinc-200 break-words flex-1 font-mono text-[11.5px]">
                        {l.message}
                      </span>

                      {/* Actions: Metadata Toggle + Copy Line Button */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 select-none">
                        {l.metadata && Object.keys(l.metadata).length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(l.id)}
                            title="Inspect metadata JSON"
                            className="p-1 rounded bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyLine(l)}
                          title="Copy this log line"
                          className="p-1 rounded bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable JSON Metadata Inspector */}
                    {isExpanded && l.metadata && (
                      <div className="mt-2 ml-10 p-2.5 rounded-lg bg-[#050811] border border-zinc-800 text-xs font-mono text-teal-300 overflow-x-auto shadow-inner">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Layers className="h-3 w-3 text-teal-400" /> Attached Event Metadata:
                        </div>
                        <pre className="text-[11px] text-zinc-300 leading-normal">
                          {JSON.stringify(l.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Floating "Scroll to Bottom" button when user scrolls up */}
          {showScrollBottomBtn && (
            <button
              type="button"
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg shadow-teal-950/60 border border-teal-400/40 transition-all cursor-pointer animate-fade-in"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              <span>Scroll to Bottom</span>
            </button>
          )}
        </div>
      </Card>

      {/* Plan Guardrail Upgrade Modal */}
      <PlanGuardrailModal
        isOpen={guardrailModal.isOpen}
        onClose={closeGuardrail}
        featureTitle={guardrailModal.featureTitle}
        featureDescription={guardrailModal.featureDescription}
        requiredTier={guardrailModal.requiredTier}
        currentPlanName={guardrailModal.currentPlanName || entitlements.planName}
      />
    </div>
  );
};
