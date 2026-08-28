import React from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ScreenId } from '../types';

export const OfflineView: React.FC<{ onNavigate: (screen: ScreenId) => void }> = ({ onNavigate }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center">
        <WifiOff className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        You are Currently Offline
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
        Internet connectivity was interrupted. Local repository changes are cached and will synchronize once WebSockets re-establish connection.
      </p>
      <div className="flex items-center gap-3 pt-2">
        <Button variant="primary" size="sm" onClick={() => window.location.reload()} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Retry Connection
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')} leftIcon={<Home className="h-4 w-4" />}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};
