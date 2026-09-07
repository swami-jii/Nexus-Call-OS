import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ScreenId } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onNavigate: (screen: ScreenId) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, onNavigate }) => {
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      onNavigate('auth');
    }
  }, [isLoading, isAuthenticated, onNavigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="text-xs font-semibold text-zinc-400">Loading Nexus Voice OS...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};
