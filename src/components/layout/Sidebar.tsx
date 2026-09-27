import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Headphones,
  PhoneCall,
  BarChart3,
  Megaphone,
  Users,
  Phone,
  GitFork,
  BookOpen,
  Blocks,
  Terminal,
  CreditCard,
  Landmark,
  Settings,
  User,
  Bell,
  Activity,
  Key,
  HelpCircle,
  AlertTriangle,
  ServerCrash,
  Layers,
  Loader2,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Lock,
  Cpu,
  PlayCircle,
  Smartphone,
  HardDrive,
  Trash2,
  Brain,
  ShieldAlert,
} from 'lucide-react';
import { ScreenId } from '../../types';
import { fetchAPI } from '../../lib/api';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { clearNavigationHandoff } from '../../lib/handoffNavigation';
import { BrandSocialIcon } from '../ui/BrandSocialIcon';
import { detectSocialPlatform, getPlatformMeta, formatSocialUrl } from '../../data/globalSocialPlatformsCatalog';

export interface SidebarProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavGroup {
  title: string;
  items: {
    id: ScreenId;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [activeAgentCount, setActiveAgentCount] = useState<number | null>(null);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const fetchCount = () => {
      fetchAPI('/api/agents?page_size=100')
        .then((data) => {
          if (data && Array.isArray(data.items)) {
            setActiveAgentCount(data.items.filter((a: any) => a.status === 'active').length);
          } else if (Array.isArray(data)) {
            setActiveAgentCount(data.filter((a: any) => a.status === 'active').length);
          }
        })
        .catch(() => { });
    };
    fetchCount();
    const interval = setInterval(fetchCount, 4000);
    return () => clearInterval(interval);
  }, [activeScreen]);

  const { user } = useAuth();
  const isSuperAdmin = Boolean(
    user?.role === 'super_admin' || user?.email === 'admin@createcall.ai'
  );

  const activeSidebarChannels = useMemo(() => {
    if (!user || user.showSocialInUI === false) return [];
    if (user.socialPlacement !== 'sidebar' && user.socialPlacement !== 'all') return [];

    const list: { id: string; name: string; url: string; iconId: string; customIconUrl?: string }[] = [];

    if (user.socialLinks && typeof user.socialLinks === 'object') {
      Object.entries(user.socialLinks).forEach(([key, val]) => {
        const rawVal = typeof val === 'string' ? val.trim() : '';
        if (rawVal) {
          const detected = detectSocialPlatform(rawVal);
          const meta = getPlatformMeta(key);
          list.push({
            id: key,
            name: detected.id !== 'website' ? detected.name : (meta?.name || key),
            url: formatSocialUrl(rawVal, meta?.prefixUrl),
            iconId: detected.id !== 'website' ? detected.id : (meta?.id || key),
          });
        }
      });
    }

    if (Array.isArray((user as any).customSocialChannels)) {
      (user as any).customSocialChannels.forEach((custom: any) => {
        if (custom && custom.enabled !== false && custom.url && typeof custom.url === 'string' && custom.url.trim()) {
          const detected = detectSocialPlatform(custom.url);
          list.push({
            id: custom.id,
            name: custom.platform || detected.name,
            url: formatSocialUrl(custom.url),
            iconId: custom.icon ? custom.icon.toLowerCase() : detected.id,
            customIconUrl: custom.customIconUrl,
          });
        }
      });
    }

    return list;
  }, [user]);

  const navGroups: NavGroup[] = useMemo(() => {
    const accountItems: { id: ScreenId; label: string; icon: React.ReactNode; badge?: string }[] = [
      {
        id: 'billing' as ScreenId,
        label: isSuperAdmin ? 'Platform Finance' : 'Billing & Usage',
        icon: isSuperAdmin ? <Landmark className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />,
      },
      { id: 'api-keys' as ScreenId, label: 'API Keys', icon: <Key className="h-4 w-4" /> },
    ];

    if (isSuperAdmin) {
      accountItems.push({
        id: 'settings' as ScreenId,
        label: 'OS Settings',
        icon: <Settings className="h-4 w-4" />,
      });
    }

    accountItems.push(
      { id: 'profile' as ScreenId, label: 'User Profile', icon: <User className="h-4 w-4" /> },
      {
        id: 'notifications' as ScreenId,
        label: 'Notifications',
        icon: <Bell className="h-4 w-4" />,
        badge: unreadCount > 0 ? String(unreadCount) : undefined,
      }
    );

    if (isSuperAdmin) {
      accountItems.push({
        id: 'activity' as ScreenId,
        label: 'Audit Activity',
        icon: <Activity className="h-4 w-4" />,
      });
    }

    accountItems.push({
      id: 'recycle-bin' as ScreenId,
      label: 'Recycle Bin',
      icon: <Trash2 className="h-4 w-4" />,
      badge: 'Trash',
    });

    if (!isSuperAdmin) {
      accountItems.push({
        id: 'help-center' as ScreenId,
        label: 'Help & Docs',
        icon: <HelpCircle className="h-4 w-4" />,
      });
    }

    const groups: NavGroup[] = [];

    if (isSuperAdmin) {
      groups.push({
        title: 'SUPER ADMIN SUITE',
        items: [
          {
            id: 'super-admin' as ScreenId,
            label: 'Admin Control Center',
            icon: <ShieldAlert className="h-4 w-4 text-emerald-500" />,
            badge: 'Sovereign',
          },
        ],
      });
    }

    groups.push(
      {
        title: 'OPERATING SYSTEM',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { id: 'demo-studio', label: 'Live Call Studio', icon: <PlayCircle className="h-4 w-4" />, badge: 'Studio' },
          {
            id: 'agents',
            label: 'AI Voice Agents',
            icon: <Headphones className="h-4 w-4" />,
            badge: activeAgentCount !== null ? `${activeAgentCount} Active` : undefined,
          },
          { id: 'call-history', label: 'Call History', icon: <PhoneCall className="h-4 w-4" /> },
          { id: 'analytics', label: 'Voice Analytics', icon: <BarChart3 className="h-4 w-4" /> },
        ],
      },
      {
        title: 'CAMPAIGN & TELEPHONY',
        items: [
          { id: 'campaigns', label: 'AI Campaigns', icon: <Megaphone className="h-4 w-4" /> },
          { id: 'contacts', label: 'Contacts', icon: <Users className="h-4 w-4" /> },
          { id: 'phone-numbers', label: 'Phone Numbers', icon: <Phone className="h-4 w-4" /> },
          { id: 'android-gateway', label: 'Pair & Apps GSM Gateway', icon: <Smartphone className="h-4 w-4" />, badge: 'Free' },
          { id: 'workflows', label: 'Voice Workflows', icon: <GitFork className="h-4 w-4" /> },
        ],
      },
      {
        title: 'KNOWLEDGE & REALTIME',
        items: [
          { id: 'memory', label: 'Agent Memory Brain', icon: <Brain className="h-4 w-4" />, badge: 'Memory' },
          { id: 'knowledge-base', label: 'Knowledge Base (RAG)', icon: <BookOpen className="h-4 w-4" /> },
          { id: 'storage', label: 'File Storage Hub', icon: <HardDrive className="h-4 w-4" />, badge: 'Uploads' },
          { id: 'integrations', label: 'API & Integrations', icon: <Blocks className="h-4 w-4" /> },
          { id: 'logs', label: 'Realtime Terminal Logs', icon: <Terminal className="h-4 w-4" /> },
        ],
      },
      {
        title: 'ACCOUNT & SYSTEM',
        items: accountItems,
      }
    );

    if (isSuperAdmin) {
      groups.push({
        title: 'UTILITIES & SYSTEM STATES',
        items: [
          { id: 'auth', label: 'Auth Flow Screens', icon: <Lock className="h-4 w-4" /> },
          { id: 'help-center', label: 'Help Center & Docs', icon: <HelpCircle className="h-4 w-4" /> },
          { id: 'empty-state-demo', label: 'Empty State Demo', icon: <Layers className="h-4 w-4" /> },
          { id: 'loading-state-demo', label: 'Loading State Demo', icon: <Loader2 className="h-4 w-4" /> },
          { id: 'maintenance', label: 'Maintenance Mode', icon: <Wrench className="h-4 w-4" /> },
          { id: '404', label: '404 Page Preview', icon: <AlertTriangle className="h-4 w-4" /> },
          { id: '500', label: '500 Page Preview', icon: <ServerCrash className="h-4 w-4" /> },
        ],
      });
    }

    return groups;
  }, [isSuperAdmin, activeAgentCount, unreadCount]);

  const handleNavClick = (screenId: ScreenId) => {
    try {
      clearNavigationHandoff();
      localStorage.removeItem('nexus_campaign_handoff_active');
      localStorage.removeItem('nexus_campaign_resume_wizard');
      sessionStorage.removeItem('nexus_wizard_is_open_in_session');
    } catch {}
    onNavigate(screenId);
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 flex flex-col select-none ${isCollapsed ? 'w-16' : 'w-64'
        }`}
    >
      {/* Brand Header */}
      <div className={`h-20 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center shrink-0 ${isCollapsed ? 'justify-center px-1.5' : 'justify-between px-3'
        }`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-visible">
              <img
                src="/app-icon.png"
                alt="Create Call Icon"
                className="h-[50px] w-[50px] object-contain drop-shadow-sm shrink-0"
              />
              <div className="flex flex-col justify-center min-w-0 flex-1 pl-0.5">
                <img
                  src="/create-call-banner-dark.png"
                  alt="Create Call OS"
                  className="h-[54px] w-auto max-w-[176px] object-contain object-left hidden dark:block"
                />
                <img
                  src="/create-call-banner-light.png"
                  alt="Create Call OS"
                  className="h-[54px] w-auto max-w-[176px] object-contain object-left block dark:hidden"
                />
                <div className="flex items-center select-none w-full -mt-1 pl-1">
                  <span className="text-[8px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase whitespace-nowrap leading-tight">
                    AI Voice Operating System
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse Sidebar"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 hidden lg:flex items-center justify-center cursor-pointer ml-0.5"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            className="group relative flex items-center justify-center p-0.5 bg-transparent border-0 outline-none focus:outline-none cursor-pointer"
          >
            <img
              src="/app-icon.png"
              alt="Create Call OS"
              className="h-[54px] w-[54px] object-contain group-hover:scale-105 transition-transform"
            />
            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-zinc-950 group-hover:bg-teal-500 transition-colors">
              <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
            </span>
          </button>
        )}
      </div>


      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5 scrollbar-thin">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <h2 className="px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase">
                {group.title}
              </h2>
            )}
            {group.items.map((item) => {
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200/70 dark:border-teal-800/60 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <span className={`shrink-0 ${isActive ? 'text-teal-600 dark:text-teal-400' : ''}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive
                        ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Social Presence Strip */}
      {activeSidebarChannels.length > 0 && (
        <div className={`p-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 flex items-center ${isCollapsed ? 'justify-center flex-col gap-1.5' : 'justify-start gap-1.5 overflow-x-auto scrollbar-none'}`}>
          {activeSidebarChannels.map((ch) => (
            <a
              key={ch.id}
              href={ch.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${ch.name} - ${ch.url}`}
              className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all hover:scale-115 shrink-0 cursor-pointer"
            >
              {ch.customIconUrl ? (
                <img src={ch.customIconUrl} alt={ch.name} className="h-4 w-4 rounded object-cover" />
              ) : (
                <BrandSocialIcon platformId={ch.iconId} className="h-4 w-4 shrink-0 rounded" />
              )}
            </a>
          ))}
        </div>
      )}

      {/* Footer Health Indicator */}
      {!isCollapsed && (
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
              SIP Trunk Health: <strong className="text-emerald-600 dark:text-emerald-400">99.98%</strong>
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
