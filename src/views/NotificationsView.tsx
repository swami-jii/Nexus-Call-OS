import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bell,
  Check,
  Trash2,
  Search,
  PhoneCall,
  Zap,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  Send,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Building,
  Filter,
  X,
  Globe,
  Lock,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  Users,
  User,
  Mail,
  Sparkles,
  Megaphone,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useNotifications, FeedScope } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { NotificationItem, ScreenId } from '../types';

export interface NotificationsViewProps {
  onNavigate?: (screen: ScreenId) => void;
}

export interface CustomOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  dotColor?: string;
  badge?: string;
}

/**
 * High-end Custom Popover Dropdown (Crisp, Light-Theme Compatible, Zero OS Native Artifacts)
 */
export const CustomSelectMenu: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: CustomOption[];
  minWidth?: string;
  labelPrefix?: string;
  align?: 'left' | 'right';
}> = ({ value, onChange, options, minWidth = 'min-w-36', labelPrefix, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
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
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-9 px-3 flex items-center justify-between gap-2 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-1 focus:ring-teal-600 ${minWidth}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selected?.dotColor && (
            <span className={`h-2 w-2 rounded-full shrink-0 ${selected.dotColor}`} />
          )}
          {selected?.icon && (
            <span className="shrink-0 text-zinc-500 dark:text-zinc-400">{selected.icon}</span>
          )}
          <span className="truncate">
            {labelPrefix ? `${labelPrefix}: ` : ''}
            {selected?.label}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-150 shrink-0 ${
            isOpen ? 'rotate-180 text-teal-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 min-w-48 max-h-64 overflow-y-auto rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-1 focus:outline-none ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-100 ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
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
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.dotColor && (
                    <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dotColor}`} />
                  )}
                  {opt.icon && (
                    <span className={`shrink-0 ${isSelected ? 'text-teal-600' : 'text-zinc-400'}`}>
                      {opt.icon}
                    </span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {opt.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'super_admin' | 'system'>('all');
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const pageSize = 8;

  const {
    notifications,
    unreadCount,
    categoryCounts,
    feedScope,
    setFeedScope,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    clearAll,
    fetchNotifications,
    broadcastNotification,
  } = useNotifications();

  const { user } = useAuth();
  const { addToast } = useToast();

  const isSuperAdmin = Boolean(user?.role === 'super_admin');

  // Broadcast Modal form state
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    category: 'system' as 'system' | 'calls' | 'telephony' | 'billing' | 'security',
    target_type: 'all' as 'all' | 'user' | 'role',
    target_id: '',
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Preset Template loader
  const applyBroadcastPreset = (presetKey: 'maintenance' | 'model' | 'security' | 'billing') => {
    if (presetKey === 'maintenance') {
      setBroadcastForm({
        title: 'Scheduled Gateway & Upstream Trunk Maintenance at 02:00 UTC',
        message: 'Platform telephony bridges and vector pipelines will undergo scheduled performance maintenance. In-flight calls will retain carrier fallback.',
        type: 'warning',
        category: 'telephony',
        target_type: 'all',
        target_id: '',
      });
    } else if (presetKey === 'model') {
      setBroadcastForm({
        title: 'New Ultra-Realistic AI Voice Model "Nikita v2" Now Live',
        message: 'Nikita v2 is now available across all campaign workflows with sub-180ms streaming latency, natural inflection, and multilingual Hindi/English dialect support.',
        type: 'success',
        category: 'calls',
        target_type: 'all',
        target_id: '',
      });
    } else if (presetKey === 'security') {
      setBroadcastForm({
        title: 'Security Advisory: Token Rotation & Session Hardening Active',
        message: 'Sovereign multi-tenant partition locks have been reinforced. Please verify that your telephony webhook endpoints and API keys are up to date.',
        type: 'error',
        category: 'security',
        target_type: 'all',
        target_id: '',
      });
    } else if (presetKey === 'billing') {
      setBroadcastForm({
        title: 'Enterprise Concurrency Credits Credited to Your Workspace',
        message: 'Your workspace account has been topped up with complimentary telephony pipeline credits for automated concurrency testing.',
        type: 'info',
        category: 'billing',
        target_type: 'all',
        target_id: '',
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
    addToast({
      type: 'success',
      title: 'Alerts Synchronized',
      description: 'Fetched latest real telemetry and account notifications.',
    });
  };

  const handleScopeChange = (scope: FeedScope) => {
    setFeedScope(scope);
    setPage(1);
    fetchNotifications(scope);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    addToast({
      type: 'info',
      title: 'Notifications Cleared',
      description: 'All pending alerts marked as read.',
    });
  };

  const handleDelete = async (id: string, title: string) => {
    await deleteNotification(id);
    addToast({
      type: 'info',
      title: 'Notification Dismissed',
      description: `Removed "${title}".`,
    });
  };

  const handleClearAll = async () => {
    await clearAll();
    addToast({
      type: 'info',
      title: 'All Notifications Cleared',
      description: 'Notification history has been cleared for this account.',
    });
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Please provide both title and announcement message.',
      });
      return;
    }

    if (broadcastForm.target_type === 'user' && !broadcastForm.target_id.trim()) {
      addToast({
        type: 'error',
        title: 'Target Account Required',
        description: 'Please specify the recipient account email address (e.g. mukesh@gmail.com).',
      });
      return;
    }

    setIsBroadcasting(true);
    try {
      const res = await broadcastNotification({
        title: broadcastForm.title.trim(),
        message: broadcastForm.message.trim(),
        type: broadcastForm.type,
        category: broadcastForm.category,
        target_type: broadcastForm.target_type,
        target_id: broadcastForm.target_id.trim() || undefined,
      });

      addToast({
        type: 'success',
        title: 'Broadcast Dispatched',
        description: res.message || 'Notification broadcasted successfully.',
      });

      setIsBroadcastModalOpen(false);
      setBroadcastForm({
        title: '',
        message: '',
        type: 'info',
        category: 'system',
        target_type: 'all',
        target_id: '',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Broadcast Failed',
        description: err.message || 'Failed to dispatch broadcast.',
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    severityFilter !== 'all' ||
    sourceFilter !== 'all' ||
    searchQuery.trim() !== '' ||
    activeCategoryTab !== 'all';

  const resetAllFilters = () => {
    setStatusFilter('all');
    setSeverityFilter('all');
    setSourceFilter('all');
    setSearchQuery('');
    setActiveCategoryTab('all');
    setPage(1);
  };

  const filtered = notifications.filter((n) => {
    // Category match
    const matchesTab = activeCategoryTab === 'all' || n.category === activeCategoryTab;

    // Search query match
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      n.title.toLowerCase().includes(q) ||
      (n.desc || n.message || '').toLowerCase().includes(q) ||
      (n.organization_name && n.organization_name.toLowerCase().includes(q)) ||
      (n.user_email && n.user_email.toLowerCase().includes(q));

    // Read status match
    const isUnread = !n.read && !n.is_read;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unread' && isUnread) ||
      (statusFilter === 'read' && !isUnread);

    // Severity match
    const matchesSeverity =
      severityFilter === 'all' || n.type === severityFilter;

    // Source match
    const isSuperAdminAlert = Boolean(n.is_super_admin || n.sender_role === 'super_admin' || n.is_broadcast);
    const matchesSource =
      sourceFilter === 'all' ||
      (sourceFilter === 'super_admin' && isSuperAdminAlert) ||
      (sourceFilter === 'system' && !isSuperAdminAlert);

    return matchesTab && matchesQuery && matchesStatus && matchesSeverity && matchesSource;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getCategoryIcon = (category: string, type: string) => {
    if (type === 'error') {
      return <ShieldAlert className="h-4 w-4 text-rose-500" />;
    }
    if (type === 'warning') {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
    switch (category) {
      case 'telephony':
        return <Zap className="h-4 w-4 text-amber-500" />;
      case 'calls':
        return <PhoneCall className="h-4 w-4 text-teal-600" />;
      case 'billing':
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      case 'security':
        return <ShieldCheck className="h-4 w-4 text-rose-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    }
  };

  const resolveActionLink = (n: NotificationItem): { label: string; screen: ScreenId } | null => {
    if (n.category === 'calls') {
      return { label: 'View Call Logs', screen: 'call-history' };
    }
    if (n.category === 'telephony') {
      return { label: 'View GSM Gateway', screen: 'android-gateway' };
    }
    if (n.category === 'billing') {
      return { label: 'View Billing', screen: 'billing' };
    }
    if (n.category === 'security') {
      return { label: 'Security & API Keys', screen: 'api-keys' };
    }
    if (n.title.toLowerCase().includes('knowledge') || n.title.toLowerCase().includes('vector')) {
      return { label: 'Open Knowledge Base', screen: 'knowledge-base' };
    }
    return null;
  };

  // Scoped notifications for current Category and Search query
  const categoryScopedNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesTab = activeCategoryTab === 'all' || n.category === activeCategoryTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        n.title.toLowerCase().includes(q) ||
        (n.desc || n.message || '').toLowerCase().includes(q) ||
        (n.organization_name && n.organization_name.toLowerCase().includes(q)) ||
        (n.user_email && n.user_email.toLowerCase().includes(q));
      return matchesTab && matchesQuery;
    });
  }, [notifications, activeCategoryTab, searchQuery]);

  // Status counts scoped to active Category Tab
  const scopedStatusCounts = useMemo(() => {
    const unread = categoryScopedNotifications.filter((n) => !n.read && !n.is_read).length;
    const read = categoryScopedNotifications.filter((n) => n.read || n.is_read).length;
    return {
      all: categoryScopedNotifications.length,
      unread,
      read,
    };
  }, [categoryScopedNotifications]);

  // Master Category Options
  const categoryOptions = [
    { id: 'all', label: 'All Alerts', count: categoryCounts.all, icon: Bell },
    { id: 'calls', label: 'AI Calls', count: categoryCounts.calls, icon: PhoneCall },
    { id: 'telephony', label: 'GSM & Telephony', count: categoryCounts.telephony, icon: Zap },
    { id: 'system', label: 'System', count: categoryCounts.system, icon: CheckCircle2 },
    { id: 'billing', label: 'Billing', count: categoryCounts.billing, icon: CreditCard },
    { id: 'security', label: 'Security', count: categoryCounts.security, icon: ShieldCheck },
  ];

  // Dynamic Severity Dropdown Option Lists (Contextual to selected Category Tab)
  const severityOptions: CustomOption[] = useMemo(() => {
    const total = categoryScopedNotifications.length;
    const infoCount = categoryScopedNotifications.filter((n) => n.type === 'info').length;
    const successCount = categoryScopedNotifications.filter((n) => n.type === 'success').length;
    const warningCount = categoryScopedNotifications.filter((n) => n.type === 'warning').length;
    const errorCount = categoryScopedNotifications.filter((n) => n.type === 'error').length;

    return [
      { value: 'all', label: `All Severities (${total})`, dotColor: 'bg-zinc-400' },
      { value: 'info', label: `Info (${infoCount})`, dotColor: 'bg-blue-500' },
      { value: 'success', label: `Success (${successCount})`, dotColor: 'bg-emerald-500' },
      { value: 'warning', label: `Warning (${warningCount})`, dotColor: 'bg-amber-500' },
      { value: 'error', label: `Critical / Error (${errorCount})`, dotColor: 'bg-rose-500' },
    ];
  }, [categoryScopedNotifications]);

  // Dynamic Source Dropdown Option Lists (Contextual to selected Category Tab)
  const sourceOptions: CustomOption[] = useMemo(() => {
    const total = categoryScopedNotifications.length;
    const superAdminCount = categoryScopedNotifications.filter(
      (n) => Boolean(n.is_super_admin || n.sender_role === 'super_admin' || n.is_broadcast)
    ).length;
    const systemCount = total - superAdminCount;

    return [
      { value: 'all', label: `All Sources (${total})`, icon: <Globe className="h-3.5 w-3.5" /> },
      { value: 'super_admin', label: `From Super Admin (${superAdminCount})`, icon: <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> },
      { value: 'system', label: `Automated System (${systemCount})`, icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> },
    ];
  }, [categoryScopedNotifications]);

  // Category Tab switcher with graceful auto-reset
  const handleCategoryTabChange = (tabId: string) => {
    setActiveCategoryTab(tabId);
    setPage(1);

    const nextScoped = notifications.filter((n) => tabId === 'all' || n.category === tabId);

    if (statusFilter !== 'all') {
      const matchStatus = nextScoped.filter((n) => {
        const isUnread = !n.read && !n.is_read;
        return (statusFilter === 'unread' && isUnread) || (statusFilter === 'read' && !isUnread);
      }).length;
      if (matchStatus === 0) setStatusFilter('all');
    }

    if (severityFilter !== 'all') {
      const matchSev = nextScoped.filter((n) => n.type === severityFilter).length;
      if (matchSev === 0) setSeverityFilter('all');
    }

    if (sourceFilter !== 'all') {
      const matchSrc = nextScoped.filter((n) => {
        const isSuperAdminAlert = Boolean(n.is_super_admin || n.sender_role === 'super_admin' || n.is_broadcast);
        return (sourceFilter === 'super_admin' && isSuperAdminAlert) || (sourceFilter === 'system' && !isSuperAdminAlert);
      }).length;
      if (matchSrc === 0) setSourceFilter('all');
    }
  };

  return (
    <div className="space-y-4 w-full max-w-7xl mx-auto">
      {/* Super Admin Sovereign Scope Switcher */}
      {isSuperAdmin && (
        <div className="w-full p-2.5 rounded-lg bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50/30 border border-emerald-300 dark:bg-zinc-900 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleScopeChange('workspace')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border ${
                feedScope === 'workspace'
                  ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs'
                  : 'bg-white/95 dark:bg-zinc-800 border-emerald-300 dark:border-zinc-700 text-emerald-900 dark:text-emerald-300 hover:bg-white hover:border-emerald-400'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              My Sovereign Alerts
            </button>

            <button
              type="button"
              onClick={() => handleScopeChange('global_admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border ${
                feedScope === 'global_admin'
                  ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs'
                  : 'bg-white/95 dark:bg-zinc-800 border-emerald-300 dark:border-zinc-700 text-emerald-900 dark:text-emerald-300 hover:bg-white hover:border-emerald-400'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              Global Platform Feed
            </button>

            <button
              type="button"
              onClick={() => handleScopeChange('broadcasts')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border ${
                feedScope === 'broadcasts'
                  ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs'
                  : 'bg-white/95 dark:bg-zinc-800 border-emerald-300 dark:border-zinc-700 text-emerald-900 dark:text-emerald-300 hover:bg-white hover:border-emerald-400'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              Broadcasts Sent
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1 text-[11px] text-emerald-900 dark:text-emerald-300 font-semibold flex items-center gap-1.5 bg-emerald-100/90 dark:bg-emerald-950/60 border border-emerald-400/80 dark:border-emerald-800 rounded-md shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              Super Admin Telemetry Active
            </div>
          </div>
        </div>
      )}

      {/* 1. Standard Header */}
      <div className="space-y-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5 shrink-0">
        {/* ROW 1: Heading on Left + Badges on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap leading-none">
              {feedScope === 'global_admin'
                ? 'Global Platform Telemetry'
                : feedScope === 'broadcasts'
                ? 'Platform Broadcasts'
                : 'Notification Center'}
            </h1>

            {unreadCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
                {unreadCount} Unread
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                <Check className="h-3 w-3 text-emerald-600" />
                All Caught Up
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-7.5 text-xs font-semibold px-2.5 rounded-lg border border-zinc-300 hover:border-teal-400 text-teal-700 bg-white shadow-2xs"
                leftIcon={<Check className="h-3.5 w-3.5 text-teal-600" />}
              >
                Mark All Read
              </Button>
            )}

            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-7.5 text-xs font-semibold px-2.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200"
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* ROW 2: Description on Left + Action Buttons on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {feedScope === 'global_admin'
              ? 'Realtime multi-tenant monitoring across all platform organizations.'
              : feedScope === 'broadcasts'
              ? 'System announcements dispatched from Super Admin to workspace tenants.'
              : 'Realtime events covering call logs, GSM gateway status, and system triggers.'}
          </p>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-7.5 text-xs font-semibold px-2.5 rounded-lg border-zinc-300 hover:border-zinc-400 shadow-2xs"
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 text-zinc-600 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Sync
            </Button>

            {isSuperAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsBroadcastModalOpen(true)}
                className="h-7.5 text-xs font-semibold px-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
                leftIcon={<Megaphone className="h-3.5 w-3.5" />}
              >
                Broadcast Alert
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Controls Card */}
      <div className="w-full p-4 sm:p-5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-2xs space-y-4">
        {/* Row 2: Symmetrical Full-Width Equal Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
          {categoryOptions.map((tab) => {
            const isActive = activeCategoryTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleCategoryTabChange(tab.id)}
                className={`w-full py-2 px-3 rounded-md text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border select-none ${
                  isActive
                    ? 'bg-teal-600 text-white border-teal-700 font-bold shadow-xs'
                    : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-400 font-medium dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    isActive ? 'text-white' : 'text-zinc-500'
                  }`}
                />
                <span className="truncate">{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                      isActive
                        ? 'bg-white/25 text-white font-bold'
                        : 'bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Row 3: Full-Width Responsive Search & Custom Sleek Dropdown Filters */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full">
          {/* Left: Responsive Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, description, or keyword..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8.5 pr-8 h-9 text-xs rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right: Custom Clean Filter Suite (Zero Native HTML Artifacts) */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Status Segmented Buttons (All / Unread / Read) */}
            <div className="inline-flex h-9 rounded-md border border-zinc-300 dark:border-zinc-600 p-0.5 bg-zinc-100 dark:bg-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setPage(1);
                }}
                className={`px-3 flex items-center justify-center rounded text-[11px] transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-teal-600 text-white font-bold shadow-2xs'
                    : 'text-zinc-700 dark:text-zinc-300 font-medium hover:text-zinc-950'
                }`}
              >
                All Status ({scopedStatusCounts.all})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('unread');
                  setPage(1);
                }}
                className={`px-3 flex items-center justify-center rounded text-[11px] transition-all cursor-pointer ${
                  statusFilter === 'unread'
                    ? 'bg-teal-600 text-white font-bold shadow-2xs'
                    : 'text-zinc-700 dark:text-zinc-300 font-medium hover:text-zinc-950'
                }`}
              >
                Unread ({scopedStatusCounts.unread})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('read');
                  setPage(1);
                }}
                className={`px-3 flex items-center justify-center rounded text-[11px] transition-all cursor-pointer ${
                  statusFilter === 'read'
                    ? 'bg-teal-600 text-white font-bold shadow-2xs'
                    : 'text-zinc-700 dark:text-zinc-300 font-medium hover:text-zinc-950'
                }`}
              >
                Read ({scopedStatusCounts.read})
              </button>
            </div>

            {/* Custom Severity Dropdown Menu */}
            <CustomSelectMenu
              value={severityFilter}
              onChange={(val) => {
                setSeverityFilter(val);
                setPage(1);
              }}
              options={severityOptions}
              minWidth="w-38"
            />

            {/* Custom Source Dropdown Menu */}
            <CustomSelectMenu
              value={sourceFilter}
              onChange={(val) => {
                setSourceFilter(val as any);
                setPage(1);
              }}
              options={sourceOptions}
              minWidth="w-40"
            />

            {/* Reset Filter Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="h-9 flex items-center gap-1.5 text-xs text-teal-800 dark:text-teal-300 font-bold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 px-3 rounded-md border border-teal-300 dark:border-teal-700 shrink-0 cursor-pointer transition-colors shadow-2xs"
                title="Reset all filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification Cards List */}
      <Card className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 shadow-2xs">
        <CardContent className="p-0 divide-y divide-zinc-200 dark:divide-zinc-800">
          {paginated.length === 0 ? (
            <div className="p-10 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2.5">
              <div className="mx-auto h-10 w-10 rounded-md bg-teal-50 dark:bg-zinc-800 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-zinc-700">
                <Bell className="h-5 w-5 opacity-80" />
              </div>
              <div>
                <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                  No notifications match your current filters
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Realtime calls, GSM alerts, and system triggers will automatically appear here.
                </p>
              </div>
              {hasActiveFilters && (
                <div className="pt-2">
                  <Button size="sm" variant="outline" onClick={resetAllFilters} className="rounded-md border-zinc-300" leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>
                    Clear Active Filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
            paginated.map((n) => {
              const isUnread = !n.read && !n.is_read;
              const action = resolveActionLink(n);
              const isSuperAdminAlert = Boolean(n.is_super_admin || n.sender_role === 'super_admin' || n.is_broadcast);

              return (
                <div
                  key={n.id}
                  className={`p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all relative overflow-hidden ${
                    isUnread
                      ? 'bg-teal-50/40 dark:bg-teal-950/25 hover:bg-teal-50/60'
                      : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-850/50'
                  }`}
                >
                  {/* Left indicator stripe */}
                  {isUnread && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-600" />
                  )}
                  {n.type === 'error' && !isUnread && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />
                  )}

                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Category / Status Icon Pill */}
                    <div
                      className={`mt-0.5 p-2 rounded-md shrink-0 border ${
                        n.type === 'error'
                          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/50'
                          : n.type === 'warning'
                          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/50'
                          : isUnread
                          ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800/50'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      {getCategoryIcon(n.category, n.type)}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Title & Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3
                          className={`text-xs sm:text-sm font-semibold tracking-tight ${
                            isUnread
                              ? 'text-zinc-950 dark:text-zinc-50'
                              : 'text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          {n.title}
                        </h3>

                        {isUnread && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-300">
                            New
                          </span>
                        )}

                        {isSuperAdminAlert && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 shadow-2xs">
                            <ShieldAlert className="h-3 w-3 text-amber-600" />
                            From Super Admin
                          </span>
                        )}

                        {/* Tenant badge in Global Admin view */}
                        {feedScope === 'global_admin' && (n.organization_name || n.user_email) && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                            <Building className="h-2.5 w-2.5 text-zinc-400" />
                            {n.organization_name || n.user_email}
                          </span>
                        )}

                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                          {n.category}
                        </span>
                      </div>

                      {/* Message Content */}
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {n.desc || n.message}
                      </p>

                      {/* Metadata / Time */}
                      <div className="flex items-center gap-3 pt-0.5 text-[11px] text-zinc-500 font-mono">
                        <span className="font-medium text-zinc-600 dark:text-zinc-400">{n.time || 'Recently'}</span>
                        {n.created_at && (
                          <span className="text-[10px] opacity-75 hidden sm:inline">
                            • {new Date(n.created_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {action && onNavigate && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onNavigate(action.screen)}
                        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                        className="text-xs font-semibold rounded-md border border-zinc-300 hover:border-zinc-400"
                      >
                        {action.label}
                      </Button>
                    )}

                    {isUnread && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(n.id)}
                        leftIcon={<Check className="h-3.5 w-3.5 text-teal-600" />}
                        className="text-xs text-teal-800 hover:bg-teal-100/60 rounded-md border border-teal-200"
                      >
                        Mark Read
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => handleDelete(n.id, n.title)}
                      title="Dismiss alert"
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span>
              Showing page <strong className="text-zinc-800 dark:text-zinc-200">{page}</strong> of{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">{totalPages}</strong> ({filtered.length} alerts)
            </span>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" className="rounded-md border-zinc-300" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="outline" className="rounded-md border-zinc-300" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Super Admin Standard-Width Broadcast Console Modal */}
      {isSuperAdmin && (
        <Modal
          isOpen={isBroadcastModalOpen}
          onClose={() => setIsBroadcastModalOpen(false)}
          size="2xl"
        >
          <div className="space-y-4 w-full">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 shadow-2xs">
                  <Megaphone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      Super Admin Broadcast Console
                    </h2>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 shadow-2xs">
                      Official Broadcast
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Publish real-time system alerts and bulletins across platform accounts.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                title="Close console"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick 1-Click Preset Template Chips */}
            <div className="space-y-1.5 p-2.5 rounded-lg bg-zinc-50/90 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                <Sparkles className="h-3 w-3 text-teal-600" />
                <span>Quick Preset Templates (1-Click Fill)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                <button
                  type="button"
                  onClick={() => applyBroadcastPreset('maintenance')}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="font-semibold truncate">Maintenance</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyBroadcastPreset('model')}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold truncate">Voice Model</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyBroadcastPreset('security')}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-950 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <span className="font-semibold truncate">Security Advisory</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyBroadcastPreset('billing')}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-950 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <CreditCard className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                  <span className="font-semibold truncate">Wallet Top-up</span>
                </button>
              </div>
            </div>

            {/* Broadcast Configuration Form */}
            <form onSubmit={handleSendBroadcast} className="space-y-3.5 w-full">
              {/* Section 1: Target Audience Selection */}
              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  1. Target Recipient
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setBroadcastForm((p) => ({ ...p, target_type: 'all', target_id: '' }))}
                    className={`py-2 px-2.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                      broadcastForm.target_type === 'all'
                        ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                        : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span>All Accounts (Global)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBroadcastForm((p) => ({ ...p, target_type: 'user' }))}
                    className={`py-2 px-2.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                      broadcastForm.target_type === 'user'
                        ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                        : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span>Specific Account Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBroadcastForm((p) => ({ ...p, target_type: 'role' }))}
                    className={`py-2 px-2.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                      broadcastForm.target_type === 'role'
                        ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                        : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>Target By Role</span>
                  </button>
                </div>

                {/* Email Address Input if 'user' is selected */}
                {broadcastForm.target_type === 'user' && (
                  <div className="pt-1 animate-in fade-in-0 duration-150 w-full">
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Recipient Account Email Address *
                    </label>
                    <div className="relative w-full">
                      <Mail className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="e.g. mukesh@gmail.com or admin@createcall.ai"
                        value={broadcastForm.target_id}
                        onChange={(e) => setBroadcastForm((prev) => ({ ...prev, target_id: e.target.value }))}
                        className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Role Identifier Input if 'role' is selected */}
                {broadcastForm.target_type === 'role' && (
                  <div className="pt-1 animate-in fade-in-0 duration-150 w-full">
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Target Role Identifier *
                    </label>
                    <div className="relative w-full">
                      <Users className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="e.g. operator, admin, agent"
                        value={broadcastForm.target_id}
                        onChange={(e) => setBroadcastForm((prev) => ({ ...prev, target_id: e.target.value }))}
                        className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Full-Width Severity Level Row */}
              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  2. Severity Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                  {[
                    { id: 'info', label: 'Info', dot: 'bg-blue-500' },
                    { id: 'success', label: 'Success', dot: 'bg-emerald-500' },
                    { id: 'warning', label: 'Warning', dot: 'bg-amber-500' },
                    { id: 'error', label: 'Critical', dot: 'bg-rose-500' },
                  ].map((sev) => {
                    const isSelected = broadcastForm.type === sev.id;
                    return (
                      <button
                        key={sev.id}
                        type="button"
                        onClick={() => setBroadcastForm((p) => ({ ...p, type: sev.id as any }))}
                        className={`py-2 px-2.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                            : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full shrink-0 ${sev.dot}`} />
                        <span className="font-semibold">{sev.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Alert Category Row (Zero Truncation, 3-Column Balanced Grid) */}
              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  3. Alert Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
                  {[
                    { id: 'system', label: 'System Platform', icon: CheckCircle2 },
                    { id: 'calls', label: 'AI Voice Calls', icon: PhoneCall },
                    { id: 'telephony', label: 'GSM & Telephony', icon: Zap },
                    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
                    { id: 'security', label: 'Security & Access', icon: ShieldCheck },
                  ].map((cat) => {
                    const isSelected = broadcastForm.category === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setBroadcastForm((p) => ({ ...p, category: cat.id as any }))}
                        className={`py-2 px-2.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                            : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-zinc-500'}`} />
                        <span className="font-semibold whitespace-nowrap">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Title Input */}
              <div className="space-y-1 w-full">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  4. Announcement Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled Network Gateway Maintenance Tonight"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 shadow-2xs"
                  required
                />
              </div>

              {/* Section 5: Message Input */}
              <div className="space-y-1 w-full">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  5. Announcement Message Content *
                </label>
                <textarea
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 min-h-[70px] leading-relaxed shadow-2xs"
                  placeholder="Write detailed notification message that will appear in tenant notification feeds and drawers..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, message: e.target.value }))}
                  required
                />
              </div>

              {/* Section 6: Live Interactive Tenant Feed Preview Card */}
              <div className="rounded-lg border border-zinc-300 dark:border-zinc-700 p-2.5 bg-zinc-50/80 dark:bg-zinc-850 space-y-1.5 w-full">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-teal-600" />
                    Live Tenant Feed Preview
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Target: {broadcastForm.target_type === 'all' ? 'All Accounts' : broadcastForm.target_type === 'user' ? (broadcastForm.target_id || 'Account Email') : `Role (${broadcastForm.target_id || 'All'})`}
                  </span>
                </div>

                <div className="p-3 rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 relative overflow-hidden flex items-start gap-3 shadow-2xs">
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      broadcastForm.type === 'error'
                        ? 'bg-rose-500'
                        : broadcastForm.type === 'warning'
                        ? 'bg-amber-500'
                        : broadcastForm.type === 'success'
                        ? 'bg-emerald-500'
                        : 'bg-teal-600'
                    }`}
                  />
                  <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 shrink-0">
                    {getCategoryIcon(broadcastForm.category, broadcastForm.type)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-zinc-950 dark:text-zinc-50">
                        {broadcastForm.title || 'Untitled System Announcement'}
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                        New
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                        <ShieldAlert className="h-3 w-3 text-amber-600" />
                        From Super Admin
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-300">
                        {broadcastForm.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {broadcastForm.message || 'Announcement message content preview will appear here...'}
                    </p>
                    <div className="text-[10px] text-zinc-400 font-mono pt-0.5">
                      Just now • Official Super Admin Broadcast
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Action Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800 w-full">
                <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate max-w-[280px]">
                    Dispatching to:{' '}
                    <strong className="text-zinc-900 dark:text-zinc-100 font-bold">
                      {broadcastForm.target_type === 'all'
                        ? 'All Platform Tenants'
                        : broadcastForm.target_type === 'user'
                        ? (broadcastForm.target_id || 'Account Email')
                        : `Role (${broadcastForm.target_id || 'All'})`}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-md border-zinc-300"
                    onClick={() => setIsBroadcastModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="rounded-md bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs px-4"
                    disabled={isBroadcasting}
                    leftIcon={<Send className={`h-3.5 w-3.5 ${isBroadcasting ? 'animate-spin' : ''}`} />}
                  >
                    {isBroadcasting ? 'Dispatching...' : 'Dispatch Broadcast'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
