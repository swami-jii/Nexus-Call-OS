import React from 'react';
import {
  Search,
  Sun,
  Moon,
  Bell,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Menu,
  ShieldAlert,
} from 'lucide-react';
import { ScreenId } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { Dropdown } from '../ui/Dropdown';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { clearNavigationHandoff } from '../../lib/handoffNavigation';
import { BrandSocialIcon } from '../ui/BrandSocialIcon';
import { detectSocialPlatform, getPlatformMeta, formatSocialUrl } from '../../data/globalSocialPlatformsCatalog';

export interface HeaderProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onOpenShortcuts: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeScreen,
  onNavigate,
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenShortcuts,
  onToggleMobileSidebar,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const getBreadcrumbTitle = (screen: ScreenId) => {
    const titles: Record<ScreenId, string> = {
      dashboard: 'Executive Dashboard',
      agents: 'AI Voice Agents',
      'call-history': 'Call Logs & Audio Recordings',
      analytics: 'Voice Analytics & Metrics',
      campaigns: 'Outbound & Inbound Campaigns',
      contacts: 'Contact Directory & Leads',
      'phone-numbers': 'Phone Numbers & Routing',
      workflows: 'Voice Workflows & Automation',
      automation: 'Voice Workflows & Automation',
      'knowledge-base': 'Knowledge Base & RAG Docs',
      storage: 'File Storage & Uploads Hub',
      'file-storage': 'File Storage & Uploads Hub',
      integrations: 'Integrations & Webhooks',
      logs: 'Realtime Terminal Execution Logs',
      billing: 'Billing, Plans & Usage',
      'api-keys': 'API Key Governance',
      settings: 'OS System Settings',
      security: 'OS Security & Access Control',
      profile: 'User Profile & Preferences',
      notifications: 'Notification Center',
      activity: 'Audit Activity Trail',
      'recycle-bin': 'Recycle Bin & Trash Hub',
      trash: 'Recycle Bin & Trash Hub',
      help: 'Help Center & Documentation',
      'help-center': 'Help Center & Documentation',
      auth: 'Authentication System',
      '404': '404 Not Found Preview',
      '500': '500 Server Error Preview',
      empty: 'Empty State Design Preview',
      'empty-state-demo': 'Empty State Design Preview',
      loading: 'Loading State Skeleton Preview',
      'loading-state-demo': 'Loading State Skeleton Preview',
      maintenance: 'Maintenance Screen Preview',
      offline: 'Offline Connection Status',
      unauthorized: 'Unauthorized Access',
      'conversation-engine': 'Conversation Engine Observability',
      'demo-studio': 'Live Call Studio & Control Center',
      'android-gateway': 'Pair & Apps GSM Gateway & Device Manager',
      'mobile-gateway': 'Create Call Mobile SIM Gateway App',
      memory: 'Agent Memory Brain & Session Hub',
      'agent-memory': 'Agent Memory Brain & Session Hub',
      'super-admin': 'Super Admin Governance Hub & User Management',
      'admin-hub': 'Super Admin Governance Hub & User Management',
      'session-expired': 'Session Expired Preview',
    };
    return titles[screen] || 'Overview';
  };

  const isSuperAdmin = Boolean(
    user?.role === 'super_admin' || user?.email === 'admin@createcall.ai'
  );

  const handleDirectNavigate = (screen: ScreenId) => {
    clearNavigationHandoff();
    onNavigate(screen);
  };

  const activeHeaderChannels = React.useMemo(() => {
    if (!user || user.showSocialInUI === false) return [];
    if (user.socialPlacement !== 'header' && user.socialPlacement !== 'all') return [];

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

  const profileMenuItems = [
    {
      id: 'prof',
      label: 'View Profile',
      icon: <User className="h-4 w-4" />,
      onClick: () => handleDirectNavigate('profile'),
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'super_hub',
            label: 'Admin Control Center',
            icon: <ShieldAlert className="h-4 w-4 text-emerald-500" />,
            onClick: () => handleDirectNavigate('super-admin'),
          },
          {
            id: 'sets',
            label: 'OS Settings',
            icon: <Settings className="h-4 w-4" />,
            onClick: () => handleDirectNavigate('settings'),
          },
        ]
      : []),
    {
      id: 'docs',
      label: 'Help & API Docs',
      icon: <HelpCircle className="h-4 w-4" />,
      onClick: () => handleDirectNavigate('help-center'),
    },
    { id: 'div1', label: '', divider: true },
    {
      id: 'auth_screen',
      label: 'Switch to Auth UI',
      icon: <ShieldAlert className="h-4 w-4" />,
      onClick: () => handleDirectNavigate('auth'),
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: <LogOut className="h-4 w-4" />,
      danger: true,
      onClick: () => {
        logout();
        handleDirectNavigate('auth');
      },
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 transition-all">
      {/* =========================================================================
          MOBILE HEADER (Below lg breakpoint) - CLEAN 1-ROW DESIGN
         ========================================================================= */}
      <div className="flex lg:hidden h-14 px-3 items-center justify-between gap-2 w-full">
        {/* Left: Mobile Drawer Button + Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div
            onClick={() => handleDirectNavigate('dashboard')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <img
              src="/app-icon.png"
              alt="Create Call"
              className="h-7 w-7 rounded-lg object-contain shadow-xs"
            />
            <span className="font-extrabold text-xs tracking-tight text-zinc-900 dark:text-zinc-100 hidden sm:inline">
              CREATE CALL<span className="text-teal-600 dark:text-teal-400">.OS</span>
            </span>
          </div>
        </div>

        {/* Center: Search Button */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-500 dark:text-zinc-400 hover:border-teal-500/40 truncate max-w-[180px] sm:max-w-xs"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <span className="truncate text-[11px]">Search commands...</span>
        </button>

        {/* Right: Theme, Notifications, Profile Avatar */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-teal-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-zinc-950">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-zinc-600" />}
          </button>

          <Dropdown
            trigger={
              <button type="button" className="p-0.5 rounded-full ring-2 ring-teal-500/20">
                <Avatar name={user?.fullName || 'User'} src={user?.avatarUrl || undefined} size="xs" status="online" />
              </button>
            }
            items={profileMenuItems}
            align="right"
          />
        </div>
      </div>

      {/* =========================================================================
          DESKTOP HEADER (lg breakpoint and above) - CLEAN SINGLE ROW DESIGN
         ========================================================================= */}
      <div className="hidden lg:flex h-14 px-4 items-center justify-between gap-4 w-full">
        {/* Left: Single-Line Breadcrumb */}
        <div className="flex items-center min-w-0 shrink-0 whitespace-nowrap">
          <Breadcrumbs
            onHomeClick={() => handleDirectNavigate('dashboard')}
            items={[
              { label: 'System', onClick: () => handleDirectNavigate('dashboard') },
              { label: getBreadcrumbTitle(activeScreen), active: true },
            ]}
          />
        </div>

        {/* Center: Auto-Adjusting Command Search Bar */}
        <div className="flex-1 min-w-0 px-4">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all select-none shadow-2xs min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span className="text-xs truncate">Search OS commands or AI agents...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 bg-zinc-200 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: System Controls & User Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Header Social Icons Strip (when header or all placement selected) */}
          {activeHeaderChannels.length > 0 && (
            <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-zinc-200 dark:border-zinc-800">
              {activeHeaderChannels.map((ch) => (
                <a
                  key={ch.id}
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${ch.name} - ${ch.url}`}
                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all hover:scale-110 flex items-center justify-center shrink-0 cursor-pointer"
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

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-zinc-600" />}
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
          >
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500">
              ?
            </kbd>
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
            className="relative p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-teal-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-zinc-950">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <Dropdown
              trigger={
                <div className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                  <Avatar name={user?.fullName || 'User'} src={user?.avatarUrl || undefined} size="xs" status="online" />
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {user?.fullName || 'User'}
                  </span>
                </div>
              }
              items={profileMenuItems}
              align="right"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
