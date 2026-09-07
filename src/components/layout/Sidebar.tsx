import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Bot,
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
  Sparkles,
  ShieldCheck,
  Building2,
  Lock,
  Cpu,
  PlayCircle,
  Smartphone,
  HardDrive,
  Trash2,
} from 'lucide-react';
import { ScreenId } from '../../types';
import { Badge } from '../ui/Badge';
import { fetchAPI } from '../../lib/api';

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
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 4000);
    return () => clearInterval(interval);
  }, [activeScreen]);

  const navGroups: NavGroup[] = [
    {
      title: 'OPERATING SYSTEM',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { id: 'demo-studio', label: 'Live Call Studio', icon: <PlayCircle className="h-4 w-4" />, badge: 'Studio' },
        { 
          id: 'agents', 
          label: 'AI Voice Agents', 
          icon: <Bot className="h-4 w-4" />, 
          badge: activeAgentCount !== null ? `${activeAgentCount} Active` : undefined 
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
        { id: 'knowledge-base', label: 'Knowledge Base (RAG)', icon: <BookOpen className="h-4 w-4" /> },
        { id: 'storage', label: 'File Storage Hub', icon: <HardDrive className="h-4 w-4" />, badge: 'Uploads' },
        { id: 'integrations', label: 'API & Integrations', icon: <Blocks className="h-4 w-4" /> },
        { id: 'conversation-engine', label: 'Conversation Engine', icon: <Cpu className="h-4 w-4" />, badge: 'Brain' },
        { id: 'logs', label: 'Realtime Terminal Logs', icon: <Terminal className="h-4 w-4" /> },
      ],
    },
    {
      title: 'ACCOUNT & SYSTEM',
      items: [
        { id: 'billing', label: 'Billing & Usage', icon: <CreditCard className="h-4 w-4" /> },
        { id: 'api-keys', label: 'API Keys', icon: <Key className="h-4 w-4" /> },
        { id: 'settings', label: 'OS Settings', icon: <Settings className="h-4 w-4" /> },
        { id: 'profile', label: 'User Profile', icon: <User className="h-4 w-4" /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" />, badge: '3' },
        { id: 'activity', label: 'Audit Activity', icon: <Activity className="h-4 w-4" /> },
        { id: 'recycle-bin', label: 'Recycle Bin', icon: <Trash2 className="h-4 w-4" />, badge: 'Trash' },
      ],
    },
    {
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
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 flex flex-col select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className={`h-20 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center shrink-0 ${
        isCollapsed ? 'justify-center px-1.5' : 'justify-between px-3'
      }`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
              <img
                src="/app-icon.png"
                alt="Create Call Icon"
                className="h-10 w-10 rounded-xl object-cover shadow-xs shrink-0 ring-1 ring-zinc-200/80 dark:ring-zinc-800/80"
              />
              <div className="flex flex-col justify-center min-w-0 flex-1">
                <img
                  src="/create-call-banner-dark.png"
                  alt="Create Call OS"
                  className="h-[30px] w-auto max-w-[155px] object-contain hidden dark:block"
                />
                <img
                  src="/create-call-banner-light.png"
                  alt="Create Call OS"
                  className="h-[30px] w-auto max-w-[155px] object-contain block dark:hidden"
                />
                <div className="flex items-center gap-1 mt-0.5 select-none overflow-hidden">
                  <span className="h-[1px] w-2 bg-teal-600/50 dark:bg-teal-400/50 shrink-0"></span>
                  <span className="text-[8px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase truncate">
                    Crafting Digital Possibilities
                  </span>
                  <span className="h-[1px] w-2 bg-teal-600/50 dark:bg-teal-400/50 shrink-0"></span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse Sidebar"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 hidden lg:flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            className="group relative flex items-center justify-center p-1 rounded-xl transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
          >
            <img
              src="/app-icon.png"
              alt="Create Call OS"
              className="h-11 w-11 rounded-xl object-cover shadow-xs ring-1 ring-zinc-200/80 dark:ring-zinc-800/80 group-hover:scale-105 transition-transform"
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
                  onClick={() => onNavigate(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200/60 dark:border-blue-900/50 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <span className={`shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

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
