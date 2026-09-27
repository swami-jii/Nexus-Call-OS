/**
 * Create Call OS — Centralized Tenant Storage Utility
 * Guarantees strict namespace isolation for local cached items per organization/user.
 * Prevents cross-tenant data mashing and fallback mock contamination.
 */

export function getActiveTargetOrgId(): string | null {
  try {
    return (
      localStorage.getItem('createcall_target_org_id') ||
      sessionStorage.getItem('createcall_target_org_id') ||
      null
    );
  } catch {
    return null;
  }
}

export function getActiveUserEmail(): string {
  try {
    return (
      localStorage.getItem('nexus_user_email') ||
      sessionStorage.getItem('nexus_user_email') ||
      'default_user'
    ).toLowerCase().trim();
  } catch {
    return 'default_user';
  }
}

export function getEffectiveOrgNamespace(customOrgId?: string): string {
  if (customOrgId && customOrgId.trim()) {
    return customOrgId.trim();
  }
  const targetOrg = getActiveTargetOrgId();
  if (targetOrg && targetOrg.trim()) {
    return `target_${targetOrg.trim()}`;
  }
  const email = getActiveUserEmail();
  return `user_${email.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

export function getTenantStorage<T>(key: string, customOrgId?: string): T | null {
  try {
    const ns = getEffectiveOrgNamespace(customOrgId);
    const namespacedKey = `cc_tenant_${ns}_${key}`;
    const raw = localStorage.getItem(namespacedKey);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`[TenantStorage] Failed to read ${key}:`, e);
    return null;
  }
}

export function setTenantStorage<T>(key: string, value: T, customOrgId?: string): void {
  try {
    const ns = getEffectiveOrgNamespace(customOrgId);
    const namespacedKey = `cc_tenant_${ns}_${key}`;
    localStorage.setItem(namespacedKey, JSON.stringify(value));
    window.dispatchEvent(
      new CustomEvent('createcall:tenant_data_updated', {
        detail: { key, namespace: ns },
      })
    );
  } catch (e) {
    console.warn(`[TenantStorage] Failed to save ${key}:`, e);
  }
}

export function removeTenantStorage(key: string, customOrgId?: string): void {
  try {
    const ns = getEffectiveOrgNamespace(customOrgId);
    const namespacedKey = `cc_tenant_${ns}_${key}`;
    localStorage.removeItem(namespacedKey);
    window.dispatchEvent(
      new CustomEvent('createcall:tenant_data_updated', {
        detail: { key, namespace: ns },
      })
    );
  } catch (e) {
    console.warn(`[TenantStorage] Failed to remove ${key}:`, e);
  }
}

export function purgeAllTenantNamespace(namespace?: string): void {
  try {
    const ns = namespace || getEffectiveOrgNamespace();
    const prefix = `cc_tenant_${ns}_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(
      new CustomEvent('createcall:tenant_data_updated', {
        detail: { namespace: ns, purged: true },
      })
    );
  } catch (e) {
    console.warn('[TenantStorage] Failed to purge namespace:', e);
  }
}
