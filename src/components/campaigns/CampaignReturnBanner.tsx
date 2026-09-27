import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Sparkles, X } from 'lucide-react';
import { ScreenId } from '../../types';
import {
  NavigationHandoffSession,
  getActiveHandoff,
  clearNavigationHandoff,
} from '../../lib/handoffNavigation';

export interface CampaignReturnBannerProps {
  onNavigate?: (screen: ScreenId | string) => void;
  currentScreenName?: string;
  activeScreen?: ScreenId | string;
}

const SCREEN_DISPLAY_NAMES: Record<string, string> = {
  dashboard: 'Executive Dashboard',
  agents: 'AI Voice Agents',
  'call-history': 'Call History & Logs',
  analytics: 'Voice Analytics',
  campaigns: 'AI Campaigns',
  contacts: 'Contacts & Leads Directory',
  'phone-numbers': 'Phone Numbers & DIDs',
  'android-gateway': 'Pair & Apps GSM Gateway',
  'mobile-gateway': 'Mobile SIM Gateway App',
  workflows: 'Voice Workflows Studio',
  automation: 'Voice Workflows Studio',
  memory: 'Agent Memory Brain',
  'agent-memory': 'Agent Memory Brain',
  'knowledge-base': 'Knowledge Base & RAG Docs',
  storage: 'File Storage Hub',
  'file-storage': 'File Storage Hub',
  integrations: 'API & Integrations Hub',
  logs: 'Realtime Terminal Logs',
  billing: 'Billing & Plans',
  'api-keys': 'API Key Governance',
  settings: 'System Settings',
  profile: 'User Profile',
  notifications: 'Notifications',
  activity: 'Audit Activity',
  'recycle-bin': 'Recycle Bin',
  trash: 'Recycle Bin',
  help: 'Help Center & Documentation Hub',
  'help-center': 'Help Center & Documentation Hub',
  'demo-studio': 'Live Call Studio',
  'super-admin': 'Super Admin Governance',
  'admin-hub': 'Super Admin Governance',
};

const SCREEN_ALIASES: Record<string, string> = {
  help: 'help',
  'help-center': 'help',
  storage: 'storage',
  'file-storage': 'storage',
  workflows: 'workflows',
  automation: 'workflows',
  'recycle-bin': 'recycle-bin',
  trash: 'recycle-bin',
  memory: 'memory',
  'agent-memory': 'memory',
  'android-gateway': 'android-gateway',
  'mobile-gateway': 'android-gateway',
  'super-admin': 'super-admin',
  'admin-hub': 'super-admin',
};

export const GlobalHandoffReturnBanner: React.FC<CampaignReturnBannerProps> = ({
  onNavigate,
  currentScreenName,
  activeScreen,
}) => {
  const [handoff, setHandoff] = useState<NavigationHandoffSession | null>(getActiveHandoff);

  const checkHandoff = useCallback(() => {
    const current = getActiveHandoff();
    setHandoff(current);
  }, []);

  useEffect(() => {
    checkHandoff();
    window.addEventListener('storage', checkHandoff);
    window.addEventListener('nexus-handoff-changed', checkHandoff);
    return () => {
      window.removeEventListener('storage', checkHandoff);
      window.removeEventListener('nexus-handoff-changed', checkHandoff);
    };
  }, [checkHandoff]);

  const normalizedSource = handoff?.sourceScreen ? (SCREEN_ALIASES[handoff.sourceScreen] || handoff.sourceScreen) : '';
  const normalizedActive = activeScreen ? (SCREEN_ALIASES[activeScreen] || activeScreen) : '';

  // Don't render if inactive, or if user is currently already on the source screen
  if (!handoff || !handoff.active || (normalizedActive && normalizedSource === normalizedActive)) {
    return null;
  }

  const effectiveCurrentName =
    currentScreenName ||
    (activeScreen && SCREEN_DISPLAY_NAMES[activeScreen]) ||
    'this resource';

  const handleReturn = () => {
    const targetSource = handoff.sourceScreen;
    if (targetSource === 'campaigns') {
      try {
        localStorage.setItem('nexus_campaign_resume_wizard', 'true');
        sessionStorage.setItem('nexus_wizard_is_open_in_session', 'true');
      } catch {}
    }

    clearNavigationHandoff();
    setHandoff(null);

    if (onNavigate) {
      onNavigate(targetSource);
    }
  };

  const handleDismiss = () => {
    clearNavigationHandoff();
    setHandoff(null);
  };

  return (
    <div className="rounded-xl bg-teal-50/95 dark:bg-teal-950/40 border border-teal-200/90 dark:border-teal-800/70 p-3 sm:p-3.5 shadow-2xs transition-colors duration-200 mb-4 animate-in fade-in slide-in-from-top-2 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8.5 w-8.5 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                Setup In Progress from {handoff.sourceLabel || 'Help & Documentation'}
              </span>
              {handoff.contextBadge && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-teal-100 dark:bg-teal-900/80 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-700/60">
                  {handoff.contextBadge}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate mt-0.5">
              Context: <strong className="text-zinc-900 dark:text-zinc-100 font-semibold underline decoration-teal-400 decoration-1">"{handoff.contextTitle || 'Active Configuration'}"</strong>
              <span className="hidden md:inline text-zinc-500 dark:text-zinc-400 ml-1.5 text-[11px]">
                • Configure {effectiveCurrentName} here, then click return to resume seamlessly.
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleReturn}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to {handoff.sourceLabel || 'Help & Docs'}</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-teal-100/60 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
            title="Dismiss Return Banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Backwards-compatible alias
export const CampaignReturnBanner = GlobalHandoffReturnBanner;
