import { ScreenId } from '../types';

export interface NavigationHandoffSession {
  active: boolean;
  sourceScreen: ScreenId | string;
  sourceLabel?: string;
  contextTitle?: string;
  contextBadge?: string;
  targetScreen: ScreenId | string;
  targetLabel?: string;
  timestamp: number;
  customData?: Record<string, any>;
}

export const getActiveHandoff = (): NavigationHandoffSession | null => {
  try {
    const raw = localStorage.getItem('nexus_global_handoff_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.active) return parsed;
    }
    // Fallback to campaign handoff if present
    const campRaw = localStorage.getItem('nexus_campaign_handoff_active');
    if (campRaw) {
      const parsed = JSON.parse(campRaw);
      if (parsed && parsed.active) {
        return {
          active: true,
          sourceScreen: 'campaigns',
          sourceLabel: 'Campaign Wizard',
          contextTitle: parsed.campaignName || 'Untitled Campaign',
          contextBadge: `Step ${parsed.wizardStep || 1} of 4`,
          targetScreen: parsed.targetScreen || 'integrations',
          timestamp: parsed.timestamp || Date.now(),
          customData: { wizardStep: parsed.wizardStep || 1 },
        };
      }
    }
  } catch {}
  return null;
};

export const setNavigationHandoff = (session: NavigationHandoffSession) => {
  try {
    localStorage.setItem('nexus_global_handoff_session', JSON.stringify(session));
    if (session.sourceScreen === 'campaigns') {
      localStorage.setItem(
        'nexus_campaign_handoff_active',
        JSON.stringify({
          active: true,
          campaignName: session.contextTitle || 'Untitled Campaign',
          wizardStep: session.customData?.wizardStep || 1,
          source: 'campaign_wizard',
          targetScreen: session.targetScreen,
          timestamp: session.timestamp,
        })
      );
    }
    window.dispatchEvent(new CustomEvent('nexus-handoff-changed'));
  } catch {}
};

export const clearNavigationHandoff = () => {
  try {
    localStorage.removeItem('nexus_global_handoff_session');
    localStorage.removeItem('nexus_campaign_handoff_active');
    window.dispatchEvent(new CustomEvent('nexus-handoff-changed'));
  } catch {}
};

export const triggerNavigationHandoff = (
  onNavigate: ((screen: ScreenId | string) => void) | undefined,
  session: Omit<NavigationHandoffSession, 'active' | 'timestamp'>
) => {
  const fullSession: NavigationHandoffSession = {
    sourceLabel: session.sourceLabel || (typeof session.sourceScreen === 'string' ? session.sourceScreen : 'Navigation'),
    ...session,
    active: true,
    timestamp: Date.now(),
  };
  setNavigationHandoff(fullSession);
  if (onNavigate) {
    onNavigate(session.targetScreen);
  }
};
