import React from 'react';
import { Clock, LogIn, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ScreenId } from '../types';

export const SessionExpiredView: React.FC<{ onNavigate: (screen: ScreenId) => void }> = ({ onNavigate }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 flex items-center justify-center">
        <Clock className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Session Security Token Expired</h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
        Your active session token reached its 24-hour expiration threshold. Please authenticate again to resume campaign and call OS management.
      </p>
      <div className="flex items-center gap-3 pt-2">
        <Button variant="primary" size="sm" onClick={() => onNavigate('auth')} leftIcon={<LogIn className="h-4 w-4" />}>
          Log In Again
        </Button>
      </div>
    </div>
  );
};
