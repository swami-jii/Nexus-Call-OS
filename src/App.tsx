import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { ScreenId } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SovereignTargetProvider } from './context/SovereignTargetContext';
import { NotificationProvider } from './context/NotificationContext';
import { BusinessRulesProvider } from './context/BusinessRulesContext';
import { fetchAPI } from './lib/api';

import { DashboardView } from './views/DashboardView';
import { AgentsView } from './views/AgentsView';
import { CampaignsView } from './views/CampaignsView';
import { ContactsView } from './views/ContactsView';
import { PhoneNumbersView } from './views/PhoneNumbersView';
import { KnowledgeBaseView } from './views/KnowledgeBaseView';
import { CallHistoryView } from './views/CallHistoryView';
import { AnalyticsView } from './views/AnalyticsView';
import { WorkflowsView } from './views/WorkflowsView';
import { IntegrationsView } from './views/IntegrationsView';
import { BillingView } from './views/BillingView';
import { SettingsView } from './views/SettingsView';
import { ProfileView } from './views/ProfileView';
import { NotificationsView } from './views/NotificationsView';
import { ActivityView } from './views/ActivityView';
import { LogsView } from './views/LogsView';
import { HelpCenterView } from './views/HelpCenterView';
import { ApiKeysView } from './views/ApiKeysView';
import { AuthView } from './views/AuthView';
import { Error404View } from './views/Error404View';
import { Error500View } from './views/Error500View';
import { EmptyStateView } from './views/EmptyStateView';
import { LoadingStateView } from './views/LoadingStateView';
import { MaintenanceView } from './views/MaintenanceView';
import { OfflineView } from './views/OfflineView';
import { UnauthorizedView } from './views/UnauthorizedView';
import { SessionExpiredView } from './views/SessionExpiredView';
import { ConversationEngineView } from './views/ConversationEngineView';
import { DemoCallStudioView } from './views/DemoCallStudioView';
import { AndroidGatewayView } from './views/AndroidGatewayView';
import { MobileGatewayView } from './views/MobileGatewayView';
import { FileStorageView } from './views/FileStorageView';
import { RecycleBinView } from './views/RecycleBinView';
import { MemoryBrainView } from './views/MemoryBrainView';
import { SuperAdminView } from './views/SuperAdminView';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isSuperAdmin = Boolean(
    user?.role === 'super_admin' || user?.email === 'admin@createcall.ai'
  );

  const isCompanionRoute = () => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    return (
      hash.includes('mobile-gateway') ||
      hash.includes('android-companion') ||
      hash.includes('ios-companion') ||
      hash.includes('iphone-companion') ||
      hash.includes('mac-companion') ||
      hash.includes('macos-companion') ||
      hash.includes('windows-companion') ||
      hash.includes('win-companion') ||
      hash.includes('web-companion') ||
      pathname.includes('mobile-gateway') ||
      pathname.includes('android-companion') ||
      pathname.includes('ios-companion') ||
      pathname.includes('mobile') ||
      pathname.includes('companion') ||
      pathname.includes('download') ||
      search.includes('mobile=true') ||
      search.includes('companion=true')
    );
  };

  const [currentScreen, setCurrentScreenState] = useState<ScreenId>(() => {
    if (isCompanionRoute()) {
      return 'mobile-gateway';
    }
    const saved = localStorage.getItem('create_call_current_screen') || localStorage.getItem('nexus_current_screen');
    if (saved === 'loading' || saved === 'loading-state-demo' || saved === 'empty' || saved === 'empty-state-demo' || saved === 'auth') {
      return 'dashboard';
    }
    return (saved as ScreenId) || 'dashboard';
  });

  const setCurrentScreen = (screen: ScreenId) => {
    setCurrentScreenState(screen);
    try {
      localStorage.setItem('create_call_current_screen', screen);
      localStorage.setItem('nexus_current_screen', screen);
    } catch {
      // ignore
    }
  };

  // Real-time hash routing listener for standalone companion app routes
  React.useEffect(() => {
    const handleHash = () => {
      if (isCompanionRoute()) {
        setCurrentScreenState('mobile-gateway');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Clear legacy un-scoped items once on load if needed
  React.useEffect(() => {
    try {
      localStorage.removeItem('create_call_custom_items');
      localStorage.removeItem('nexus_custom_items');
      const email = (localStorage.getItem('nexus_user_email') || '').toLowerCase().trim();
      if (email && email !== 'admin@createcall.ai') {
        const userKey = `nexus_custom_items_${email}`;
        const raw = localStorage.getItem(userKey);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (
              parsed.business_types?.some((x: any) => x.id === 'bt_dental_01') ||
              parsed.dispositions?.some((x: any) => x.id === 'disp_booked_01' || x.id === 'disp-appt') ||
              parsed.departments?.some((x: any) => x.id === 'dept_sales_01')
            ) {
              localStorage.removeItem(userKey);
            }
          } catch {}
        }
      }
    } catch {}
  }, []);

  const [authGraceReady, setAuthGraceReady] = React.useState(false);

  React.useEffect(() => {
    try {
      (window as any).__dismissInitialLoader?.();
      const loader = document.getElementById('initial-loader');
      if (loader) {
        loader.style.opacity = '0';
        loader.style.pointerEvents = 'none';
        setTimeout(() => {
          if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
        }, 100);
      }
    } catch {}

    const timer = setTimeout(() => {
      setAuthGraceReady(true);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // 1. Standalone Companion routes (Never require auth or desktop shell)
  if (currentScreen === 'mobile-gateway' || isCompanionRoute()) {
    return <MobileGatewayView onNavigate={setCurrentScreen} />;
  }

  // 2. Initial Auth Verification Loading State (With 700ms maximum safety grace)
  if (isLoading && !authGraceReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="text-xs font-semibold text-zinc-400">Loading Create Call OS...</span>
        </div>
      </div>
    );
  }

  // 3. Unauthenticated State -> Show Auth Screen
  if (!isAuthenticated || currentScreen === 'auth') {
    return <AuthView onNavigate={setCurrentScreen} />;
  }

  const renderCurrentView = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentScreen} />;
      case 'agents':
        return <AgentsView onNavigate={setCurrentScreen} />;
      case 'campaigns':
        return <CampaignsView onNavigate={setCurrentScreen} />;
      case 'contacts':
        return <ContactsView onNavigate={setCurrentScreen} />;
      case 'phone-numbers':
        return <PhoneNumbersView onNavigate={setCurrentScreen} />;
      case 'knowledge-base':
        return <KnowledgeBaseView onNavigate={setCurrentScreen} />;
      case 'storage':
      case 'file-storage':
        return <FileStorageView onNavigate={setCurrentScreen} />;
      case 'call-history':
        return <CallHistoryView onNavigate={setCurrentScreen} />;
      case 'analytics':
        return <AnalyticsView onNavigate={setCurrentScreen} />;
      case 'workflows':
      case 'automation':
        return <WorkflowsView onNavigate={setCurrentScreen} />;
      case 'integrations':
        return <IntegrationsView onNavigate={setCurrentScreen} />;
      case 'billing':
        return <BillingView onNavigate={setCurrentScreen} />;
      case 'api-keys':
        return <ApiKeysView onNavigate={setCurrentScreen} />;
      case 'settings':
      case 'security':
        return isSuperAdmin ? <SettingsView /> : <UnauthorizedView onNavigate={setCurrentScreen} />;
      case 'profile':
        return <ProfileView onNavigate={setCurrentScreen} />;
      case 'notifications':
        return <NotificationsView onNavigate={setCurrentScreen} />;
      case 'activity':
        return isSuperAdmin ? <ActivityView /> : <UnauthorizedView onNavigate={setCurrentScreen} />;
      case 'recycle-bin':
      case 'trash':
        return <RecycleBinView onNavigate={setCurrentScreen} />;
      case 'logs':
        return <LogsView />;
      case 'help':
      case 'help-center':
        return <HelpCenterView onNavigate={setCurrentScreen} />;
      case '404':
        return <Error404View onNavigate={setCurrentScreen} />;
      case '500':
        return <Error500View onNavigate={setCurrentScreen} />;
      case 'empty':
      case 'empty-state-demo':
        return <EmptyStateView onNavigate={setCurrentScreen} />;
      case 'loading':
      case 'loading-state-demo':
        return <LoadingStateView />;
      case 'maintenance':
        return <MaintenanceView />;
      case 'offline':
        return <OfflineView onNavigate={setCurrentScreen} />;
      case 'unauthorized':
        return <UnauthorizedView onNavigate={setCurrentScreen} />;
      case 'session-expired':
        return <SessionExpiredView onNavigate={setCurrentScreen} />;
      case 'conversation-engine':
        return <ConversationEngineView />;
      case 'demo-studio':
        return <DemoCallStudioView onNavigate={setCurrentScreen} />;
      case 'android-gateway':
        return <AndroidGatewayView onNavigate={setCurrentScreen} />;
      case 'mobile-gateway':
        return <MobileGatewayView onNavigate={setCurrentScreen} />;
      case 'memory':
      case 'agent-memory':
        return <MemoryBrainView onNavigate={setCurrentScreen} />;
      case 'super-admin':
      case 'admin-hub':
        return isSuperAdmin ? <SuperAdminView onNavigate={setCurrentScreen} /> : <UnauthorizedView onNavigate={setCurrentScreen} />;
      default:
        return <DashboardView onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <AppLayout activeScreen={currentScreen} onNavigate={setCurrentScreen}>
      <ErrorBoundary fallbackTitle="View Rendering Shield" fallbackDescription="This view encountered an issue while loading components or data. Click below to retry or return to dashboard.">
        {renderCurrentView()}
      </ErrorBoundary>
    </AppLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Create Call Application Shield" fallbackDescription="An unexpected error occurred in the application shell. You can reload or return to dashboard.">
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <SovereignTargetProvider>
              <NotificationProvider>
                <BusinessRulesProvider>
                  <AppContent />
                </BusinessRulesProvider>
              </NotificationProvider>
            </SovereignTargetProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}


