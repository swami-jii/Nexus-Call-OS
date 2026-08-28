import React from 'react';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ScreenId } from '../types';

export const Error404View: React.FC<{ onNavigate: (screen: ScreenId) => void }> = ({
  onNavigate,
}) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <span className="font-mono text-4xl font-extrabold text-zinc-900 dark:text-zinc-100">404</span>
      <h2 className="text-xl font-bold tracking-tight">Telephony Route Not Found</h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
        The requested call log, agent ID, or system route does not exist or has been reallocated to a different SIP trunk.
      </p>
      <div className="flex items-center gap-3 pt-2">
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
