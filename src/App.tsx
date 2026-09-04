import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { ScreenId } from './types';
import { AuthProvider } from './context/AuthContext';
import { BusinessRulesProvider } from './context/BusinessRulesContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { fetchAPI } from './lib/api';
import { DEFAULT_BUSINESS_RULES_ITEMS } from './views/IntegrationsView';

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

export default function App() {
  const [currentScreen, setCurrentScreenState] = useState<ScreenId>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash.includes('mobile-gateway') || window.location.search.includes('mobile=true')) {
        return 'mobile-gateway';
      }
    }
    const saved = localStorage.getItem('nexus_current_screen');
    return (saved as ScreenId) || 'dashboard';
  });

  const setCurrentScreen = (screen: ScreenId) => {
    setCurrentScreenState(screen);
    try {
      localStorage.setItem('nexus_current_screen', screen);
    } catch {
      // ignore
    }
  };

  // Global Workspace Canonical SSOT Bootstrap on Application Startup
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('nexus_custom_items');
      if (!saved) {
        localStorage.setItem('nexus_custom_items', JSON.stringify(DEFAULT_BUSINESS_RULES_ITEMS));
      }
    } catch {}

    fetchAPI('/api/credentials')
      .then((data) => {
        if (data && typeof data === 'object') {
          try {
            const saved = localStorage.getItem('nexus_custom_items');
            const parsed = saved ? JSON.parse(saved) : {};
            const merged = { ...DEFAULT_BUSINESS_RULES_ITEMS, ...parsed, ...data };
            localStorage.setItem('nexus_custom_items', JSON.stringify(merged));
            window.dispatchEvent(new Event('nexus_business_rules_updated'));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // If Mobile Gateway is requested, render clean full-screen mobile app shell without desktop sidebar
  if (currentScreen === 'mobile-gateway') {
    return (
      <ThemeProvider>
        <ToastProvider>
          <MobileGatewayView onNavigate={setCurrentScreen} />
        </ToastProvider>
      </ThemeProvider>
    );
  }

  // If Auth screen is selected, render standard full-screen Auth layout
  if (currentScreen === 'auth') {
    return (
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AuthView onNavigate={setCurrentScreen} />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    );
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
        return <KnowledgeBaseView />;
      case 'storage':
      case 'file-storage':
        return <FileStorageView onNavigate={setCurrentScreen} />;
      case 'call-history':
        return <CallHistoryView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'workflows':
      case 'automation':
        return <WorkflowsView />;
      case 'integrations':
        return <IntegrationsView />;
      case 'billing':
        return <BillingView />;
      case 'api-keys':
        return <ApiKeysView />;
      case 'settings':
      case 'security':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      case 'notifications':
        return <NotificationsView />;
      case 'activity':
        return <ActivityView />;
      case 'recycle-bin':
      case 'trash':
        return <RecycleBinView />;
      case 'logs':
        return <LogsView />;
      case 'help':
      case 'help-center':
        return <HelpCenterView />;
      case '404':
        return <Error404View onNavigate={setCurrentScreen} />;
      case '500':
        return <Error500View onNavigate={setCurrentScreen} />;
      case 'empty':
      case 'empty-state-demo':
        return <EmptyStateView />;
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
      default:
        return <DashboardView onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Nexus Application Shield" fallbackDescription="An unexpected error occurred in the application shell. You can reload or return to dashboard.">
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BusinessRulesProvider>
              <ProtectedRoute onNavigate={setCurrentScreen}>
                <AppLayout activeScreen={currentScreen} onNavigate={setCurrentScreen}>
                  <ErrorBoundary fallbackTitle="View Rendering Shield" fallbackDescription="This view encountered an issue while loading components or data. Click below to retry or return to dashboard.">
                    {renderCurrentView()}
                  </ErrorBoundary>
                </AppLayout>
              </ProtectedRoute>
            </BusinessRulesProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
