import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenId } from '../../types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SovereignTargetBanner } from './SovereignTargetBanner';
import { CommandPalette } from './CommandPalette';
import { NotificationDrawer } from './NotificationDrawer';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { useTheme } from '../../context/ThemeContext';
import { GlobalHandoffReturnBanner } from '../campaigns/CampaignReturnBanner';

export interface AppLayoutProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeScreen,
  onNavigate,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const { toggleTheme } = useTheme();

  const handleNavigate = (screen: ScreenId) => {
    onNavigate(screen);
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd + K -> Command Palette
      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Cmd + B -> Toggle Sidebar
      if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
        return;
      }

      // Cmd + Shift + T -> Toggle Theme
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleTheme();
        return;
      }

      // ? -> Keyboard Shortcuts Modal
      if (e.key === '?' || (isCmdOrCtrl && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  const [isStudioShellHidden, setIsStudioShellHidden] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('nexus_studio_shell_hidden') === 'true';
  });

  useEffect(() => {
    const handleToggle = () => {
      setIsStudioShellHidden((prev) => {
        const next = !prev;
        localStorage.setItem('nexus_studio_shell_hidden', String(next));
        if (!next) {
          // When turning Show Header ON, default sidebar to closed (collapsed)
          setIsSidebarCollapsed(true);
        }
        return next;
      });
    };
    window.addEventListener('nexus-toggle-studio-shell', handleToggle);
    return () => window.removeEventListener('nexus-toggle-studio-shell', handleToggle);
  }, []);

  useEffect(() => {
    if (activeScreen === 'workflows' || activeScreen === 'automation') {
      setIsSidebarCollapsed(true);
    }
  }, [activeScreen]);

  const isFullScreenPage = activeScreen === 'auth';

  if (isFullScreenPage) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">{children}</div>;
  }

  const isWorkflowsStudio = activeScreen === 'workflows' || activeScreen === 'automation';

  return (
    <div className={`min-h-screen ${isWorkflowsStudio ? 'h-screen overflow-hidden' : ''} bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex antialiased w-full max-w-full overflow-x-hidden`} style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      {/* Desktop Sidebar */}
      {!(isWorkflowsStudio && isStudioShellHidden) && (
        <div className="hidden lg:block shrink-0 transition-all duration-300 ease-in-out">
          <Sidebar
            activeScreen={activeScreen}
            onNavigate={(s) => {
              handleNavigate(s);
            }}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => {
              setIsSidebarCollapsed((prev) => !prev);
            }}
          />
        </div>
      )}

      {/* Mobile Sidebar Overlay Drawer */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 w-64 bg-white dark:bg-zinc-950 h-full shadow-2xl"
            >
              <Sidebar
                activeScreen={activeScreen}
                onNavigate={(s) => {
                  handleNavigate(s);
                  setIsMobileSidebarOpen(false);
                }}
                isCollapsed={false}
                onToggleCollapse={() => setIsMobileSidebarOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main OS Content Shell */}
      <div
        className={`flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden transition-all duration-300 ease-in-out ${
          isWorkflowsStudio ? 'h-full overflow-hidden' : ''
        } ${
          isWorkflowsStudio && isStudioShellHidden
            ? 'lg:pl-0'
            : isSidebarCollapsed
            ? 'lg:pl-16'
            : 'lg:pl-64'
        }`}
      >
        {!(isWorkflowsStudio && isStudioShellHidden) && (
          <div className="shrink-0 sticky top-0 z-40">
            <SovereignTargetBanner />
            <Header
              activeScreen={activeScreen}
              onNavigate={(s) => {
                handleNavigate(s);
              }}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
            />
          </div>
        )}

        <main
          className={`flex-1 min-h-0 min-w-0 max-w-full flex flex-col overflow-x-hidden transition-all duration-300 relative z-0 ${
            isWorkflowsStudio
              ? 'p-0.5 sm:p-1 max-w-none w-full h-full overflow-hidden'
              : 'px-3 sm:px-4 lg:px-4.5 py-4 max-w-[1600px] w-full mx-auto space-y-5'
          }`}
        >
          <GlobalHandoffReturnBanner onNavigate={onNavigate} activeScreen={activeScreen} />
          <div
            key={activeScreen}
            className={isWorkflowsStudio ? 'flex-1 min-h-0 flex flex-col w-full h-full overflow-hidden' : 'flex-1 min-h-0 min-w-0 max-w-full flex flex-col w-full overflow-x-hidden'}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Command Palette Modal (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};
