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
      'android-gateway': 'Android GSM Gateway & Device Manager',
      'mobile-gateway': 'Nexus Mobile SIM Gateway App',
      'session-expired': 'Session Expired Preview',
    };
    return titles[screen] || 'Overview';
  };

  const profileMenuItems = [
    {
      id: 'prof',
      label: 'View Profile',
      icon: <User className="h-4 w-4" />,
      onClick: () => onNavigate('profile'),
    },
    {
      id: 'sets',
      label: 'OS Settings',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => onNavigate('settings'),
    },
    {
      id: 'docs',
      label: 'Help & API Docs',
      icon: <HelpCircle className="h-4 w-4" />,
      onClick: () => onNavigate('help-center'),
    },
    { id: 'div1', label: '', divider: true },
    {
      id: 'auth_screen',
      label: 'Switch to Auth UI',
      icon: <ShieldAlert className="h-4 w-4" />,
      onClick: () => onNavigate('auth'),
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: <LogOut className="h-4 w-4" />,
      danger: true,
      onClick: () => {
        logout();
        onNavigate('auth');
      },
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 transition-all">
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
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
              N
            </div>
            <span className="font-extrabold text-xs tracking-tight text-zinc-900 dark:text-zinc-100 hidden sm:inline">
              NEXUS<span className="text-blue-600 dark:text-blue-400">.OS</span>
            </span>
          </div>
        </div>

        {/* Center: Search Button */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[180px] sm:max-w-xs"
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
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-zinc-950" />
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
              <button type="button" className="p-0.5 rounded-full ring-2 ring-blue-500/20">
                <Avatar name={user?.fullName || 'User'} size="xs" status="online" />
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
            onHomeClick={() => onNavigate('dashboard')}
            items={[
              { label: 'System', onClick: () => onNavigate('dashboard') },
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
            title="Notifications"
            className="relative p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-zinc-950" />
          </button>

          {/* Profile Dropdown */}
          <div className="pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <Dropdown
              trigger={
                <div className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                  <Avatar name={user?.fullName || 'User'} size="xs" status="online" />
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
