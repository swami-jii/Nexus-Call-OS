import React from 'react';
import { ServerCrash, RefreshCw, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ScreenId } from '../types';

export const Error500View: React.FC<{ onNavigate: (screen: ScreenId) => void }> = ({
  onNavigate,
}) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center">
        <ServerCrash className="h-8 w-8" />
      </div>
      <span className="font-mono text-4xl font-extrabold text-zinc-900 dark:text-zinc-100">500</span>
      <h2 className="text-xl font-bold tracking-tight">Internal System Circuit Breaker</h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
        An unhandled exception occurred in the telephony pipeline kernel. Automated failover has logged this event.
      </p>
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => window.location.reload()}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Retry Connection
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('dashboard')}
          leftIcon={<Home className="h-4 w-4" />}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
