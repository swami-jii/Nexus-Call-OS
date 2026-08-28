import React from 'react';
import { ShieldAlert, Lock, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ScreenId } from '../types';

export const UnauthorizedView: React.FC<{ onNavigate: (screen: ScreenId) => void }> = ({ onNavigate }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center">
        <Lock className="h-8 w-8" />
      </div>
      <span className="font-mono text-4xl font-extrabold text-zinc-900 dark:text-zinc-100">403</span>
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Access Denied (Unauthorized)</h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
        Your role credentials do not permit access to this administrative workspace setting. Please request elevated permissions from your Super Admin.
      </p>
      <div className="flex items-center gap-3 pt-2">
        <Button variant="primary" size="sm" onClick={() => onNavigate('dashboard')} leftIcon={<Home className="h-4 w-4" />}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
