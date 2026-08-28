import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoadingStateView } from '../../views/LoadingStateView';
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
    return <LoadingStateView />;
  }

  return isAuthenticated ? <>{children}</> : null;
};
