import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface TargetAccount {
  orgId: string;
  userEmail: string;
  userName: string;
  orgName?: string;
}

interface SovereignTargetContextType {
  targetAccount: TargetAccount | null;
  isTargetActive: boolean;
  targetWorkspace: (account: TargetAccount) => void;
  resetToSovereignWorkspace: () => void;
}

const SovereignTargetContext = createContext<SovereignTargetContextType | null>(null);

export const useSovereignTarget = () => {
  const context = useContext(SovereignTargetContext);
  if (!context) {
    throw new Error('useSovereignTarget must be used within a SovereignTargetProvider');
  }
  return context;
};

export const SovereignTargetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isSuperAdmin = Boolean(
    user?.role === 'super_admin' || user?.email === 'admin@createcall.ai'
  );

  const [targetAccount, setTargetAccountState] = useState<TargetAccount | null>(() => {
    try {
      const orgId = localStorage.getItem('createcall_target_org_id') || sessionStorage.getItem('createcall_target_org_id');
      const userEmail = localStorage.getItem('createcall_target_user_email') || sessionStorage.getItem('createcall_target_user_email');
      const userName = localStorage.getItem('createcall_target_user_name') || sessionStorage.getItem('createcall_target_user_name');
      const orgName = localStorage.getItem('createcall_target_org_name') || sessionStorage.getItem('createcall_target_org_name');

      if (orgId && userEmail) {
        return {
          orgId,
          userEmail,
          userName: userName || userEmail.split('@')[0],
          orgName: orgName || 'Target Workspace',
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  // Automatically clear target if user is not super admin
  useEffect(() => {
    if (!isSuperAdmin && targetAccount) {
      resetToSovereignWorkspace();
    }
  }, [isSuperAdmin]);

  const targetWorkspace = useCallback((account: TargetAccount) => {
    if (!isSuperAdmin) return;
    try {
      localStorage.setItem('createcall_target_org_id', account.orgId);
      localStorage.setItem('createcall_target_user_email', account.userEmail);
      localStorage.setItem('createcall_target_user_name', account.userName);
      if (account.orgName) {
        localStorage.setItem('createcall_target_org_name', account.orgName);
      }
      setTargetAccountState(account);
      window.dispatchEvent(new CustomEvent('createcall-target-workspace-changed', { detail: account }));
      window.dispatchEvent(new CustomEvent('createcall:sovereign_target_changed', { detail: account }));
      window.dispatchEvent(new CustomEvent('createcall:tenant_data_updated', { detail: { account } }));
    } catch (e) {
      console.error('Error setting target workspace:', e);
    }
  }, [isSuperAdmin]);

  const resetToSovereignWorkspace = useCallback(() => {
    try {
      localStorage.removeItem('createcall_target_org_id');
      localStorage.removeItem('createcall_target_user_email');
      localStorage.removeItem('createcall_target_user_name');
      localStorage.removeItem('createcall_target_org_name');
      sessionStorage.removeItem('createcall_target_org_id');
      sessionStorage.removeItem('createcall_target_user_email');
      sessionStorage.removeItem('createcall_target_user_name');
      sessionStorage.removeItem('createcall_target_org_name');
      setTargetAccountState(null);
      window.dispatchEvent(new CustomEvent('createcall-target-workspace-changed', { detail: null }));
      window.dispatchEvent(new CustomEvent('createcall:sovereign_target_changed', { detail: null }));
      window.dispatchEvent(new CustomEvent('createcall:tenant_data_updated', { detail: { account: null, reset: true } }));
    } catch (e) {
      console.error('Error clearing target workspace:', e);
    }
  }, []);

  return (
    <SovereignTargetContext.Provider
      value={{
        targetAccount: isSuperAdmin ? targetAccount : null,
        isTargetActive: isSuperAdmin && !!targetAccount,
        targetWorkspace,
        resetToSovereignWorkspace,
      }}
    >
      {children}
    </SovereignTargetContext.Provider>
  );
};
