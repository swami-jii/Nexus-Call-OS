import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAPI } from '../lib/api';
import {
  getActiveTargetOrgId,
  getActiveUserEmail,
  getEffectiveOrgNamespace,
  getTenantStorage,
  setTenantStorage,
} from './TenantStorage';
import { Agent, KnowledgeDocument, CallLog, PhoneNumber, Campaign } from '../types';

export interface TargetAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  status: string;
}

export function useTenantScope() {
  const [targetAccount, setTargetAccountState] = useState<TargetAccount | null>(() => {
    try {
      const saved =
        localStorage.getItem('createcall_target_account') ||
        sessionStorage.getItem('createcall_target_account');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const targetOrgId = targetAccount?.organizationId || getActiveTargetOrgId() || null;
  const isTargeted = Boolean(targetOrgId);
  const activeUserEmail = getActiveUserEmail();
  const isSuperAdmin = activeUserEmail === 'admin@createcall.ai';

  const setTargetAccount = useCallback((account: TargetAccount | null) => {
    if (account) {
      localStorage.setItem('createcall_target_account', JSON.stringify(account));
      localStorage.setItem('createcall_target_org_id', account.organizationId);
      sessionStorage.setItem('createcall_target_org_id', account.organizationId);
    } else {
      localStorage.removeItem('createcall_target_account');
      localStorage.removeItem('createcall_target_org_id');
      sessionStorage.removeItem('createcall_target_account');
      sessionStorage.removeItem('createcall_target_org_id');
    }
    setTargetAccountState(account);
    window.dispatchEvent(
      new CustomEvent('createcall:sovereign_target_changed', { detail: account })
    );
  }, []);

  const clearTarget = useCallback(() => {
    setTargetAccount(null);
  }, [setTargetAccount]);

  useEffect(() => {
    const handleTargetChange = (e: any) => {
      setTargetAccountState(e.detail ?? null);
    };
    window.addEventListener('createcall:sovereign_target_changed', handleTargetChange);
    return () => {
      window.removeEventListener('createcall:sovereign_target_changed', handleTargetChange);
    };
  }, []);

  return {
    targetAccount,
    targetOrgId,
    isTargeted,
    activeUserEmail,
    isSuperAdmin,
    effectiveNamespace: getEffectiveOrgNamespace(),
    setTargetAccount,
    clearTarget,
  };
}

export function useTenantAgents() {
  const { targetOrgId } = useTenantScope();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAPI('/api/agents?page_size=100');
      const items: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : [];

      const mapped: Agent[] = items.map((a) => ({
        id: a.id,
        name: a.name || 'Agent',
        role: a.description || a.role || 'Voice Specialist',
        voice: a.voice_id || a.voice || '',
        llmModel: a.llm_model || a.llmModel || '',
        language: a.language || '',
        status: (a.status as any) || 'active',
        totalCalls: a.total_calls || 0,
        avgDuration: a.avg_duration || '0m 0s',
        successRate: a.success_rate || 0,
        systemPrompt: a.system_prompt || a.systemPrompt || '',
        temperature: a.temperature ?? 0.3,
        maxDurationSeconds: a.max_duration_seconds || 600,
        updatedAt: a.updated_at || new Date().toISOString(),
      }));

      setAgents(mapped);
      setTenantStorage('agents', mapped);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch agents');
    } finally {
      setIsLoading(false);
    }
  }, [targetOrgId]);

  useEffect(() => {
    refreshAgents();
  }, [refreshAgents]);

  return { agents, isLoading, error, refreshAgents };
}

export function useTenantKnowledge() {
  const { targetOrgId } = useTenantScope();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshKnowledge = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAPI('/api/knowledge-base?page_size=100');
      const items: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.documents)
        ? data.documents
        : Array.isArray(data?.items)
        ? data.items
        : [];

      setDocuments(items);
      setTenantStorage('knowledge_documents', items);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch knowledge base');
    } finally {
      setIsLoading(false);
    }
  }, [targetOrgId]);

  useEffect(() => {
    refreshKnowledge();
  }, [refreshKnowledge]);

  return { documents, isLoading, error, refreshKnowledge };
}

export function useTenantCredentials() {
  const { targetOrgId, isTargeted, isSuperAdmin } = useTenantScope();
  const [categories, setCategories] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCredentials = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAPI('/api/credentials/all-categories');
      if (data && typeof data === 'object') {
        setCategories(data);
        setTenantStorage('credentials_categories', data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch credentials registry');
    } finally {
      setIsLoading(false);
    }
  }, [targetOrgId]);

  useEffect(() => {
    refreshCredentials();
  }, [refreshCredentials]);

  return { categories, isLoading, error, refreshCredentials };
}

export function useTenantCalls() {
  const { targetOrgId } = useTenantScope();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCalls = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAPI('/api/calls?page_size=100');
      const items: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : [];
      setCalls(items);
      setTenantStorage('calls', items);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch call logs');
    } finally {
      setIsLoading(false);
    }
  }, [targetOrgId]);

  useEffect(() => {
    refreshCalls();
  }, [refreshCalls]);

  return { calls, isLoading, error, refreshCalls };
}

export function useTenantPhoneNumbers() {
  const { targetOrgId } = useTenantScope();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPhoneNumbers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAPI('/api/phone-numbers?page_size=100');
      const items: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : [];
      setPhoneNumbers(items);
      setTenantStorage('phone_numbers', items);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch phone numbers');
    } finally {
      setIsLoading(false);
    }
  }, [targetOrgId]);

  useEffect(() => {
    refreshPhoneNumbers();
  }, [refreshPhoneNumbers]);

  return { phoneNumbers, isLoading, error, refreshPhoneNumbers };
}

export function useTenantGateways() {
  const { targetOrgId } = useTenantScope();
  const [gateways, setGateways] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshGateways = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAPI('/api/android-gateway/devices');
      const items: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.devices)
        ? data.devices
        : [];
      setGateways(items);
      setTenantStorage('android_gateways', items);
    } catch {
      setGateways([]);
    } finally {
      setIsLoading(false);
    }
  }, [targetOrgId]);

  useEffect(() => {
    refreshGateways();
  }, [refreshGateways]);

  return { gateways, isLoading, refreshGateways };
}
