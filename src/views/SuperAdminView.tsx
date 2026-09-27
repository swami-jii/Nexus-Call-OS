import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Users,
  Building,
  Headphones,
  PhoneCall,
  Activity,
  Plus,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  Key,
  Trash2,
  CheckSquare,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  Server,
  Zap,
  Globe,
  Radio,
  Sliders,
  ChevronDown,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  UserX,
  Target,
  Eye,
  Check,
  Bell,
  Send,
  Sparkles,
  CreditCard,
  DollarSign,
  Tag,
  Percent,
  TrendingUp,
  SlidersHorizontal,
  ExternalLink,
  Copy,
  FileText,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Package,
} from 'lucide-react';
import { fetchAPI } from '../repository';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useSovereignTarget } from '../context/SovereignTargetContext';
import { ScreenId, SubscriptionPlan } from '../types';
import { WordPressPaymentPluginsHub } from '../components/superadmin/WordPressPaymentPluginsHub';
import { PlanMasterStudio } from '../components/superadmin/PlanMasterStudio';

export interface SuperAdminViewProps {
  onNavigate?: (screen: ScreenId) => void;
}

interface PlatformUser {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'user' | string;
  auth_provider?: string;
  phone_number?: string | null;
  organization_id?: string | null;
  organization_name?: string;
  is_active: boolean;
  is_verified: boolean;
  plain_password?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
}

interface PlatformMetrics {
  total_users: number;
  active_users: number;
  total_organizations: number;
  total_agents: number;
  total_campaigns: number;
  total_phone_numbers: number;
  total_calls: number;
  total_knowledge_docs: number;
  telephony_health: string;
  llm_latency_ms: number;
  active_sip_channels: number;
  server_status: string;
}

interface GlobalActivity {
  id: string;
  organization_id?: string;
  user_id?: string;
  user_email: string;
  action: string;
  resource: string;
  ip_address?: string;
  details_json?: any;
  created_at?: string;
}

interface TenantOrg {
  id: string;
  name: string;
  slug: string;
  plan: string;
  billing_email?: string;
  members_count: number;
  agents_count: number;
  phone_numbers_count: number;
  created_at?: string;
}

interface AdminGatewayConfig {
  id: string;
  gateway_key: string;
  display_name: string;
  is_enabled: boolean;
  environment: string;
  public_key?: string;
  secret_key?: string;
  webhook_secret?: string;
  merchant_id?: string;
  vpa_address?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc_swift?: string;
  bank_beneficiary?: string;
  details_json?: any;
}

interface AdminPlanConfig {
  id: string;
  plan_key: string;
  name: string;
  tagline: string;
  monthly_price_usd: number;
  yearly_price_usd: number;
  lifetime_price_usd: number;
  included_minutes: number;
  concurrency_limit: number;
  rag_storage_mb: number;
  max_agents_count: number;
  gsm_sim_enabled: boolean;
  voice_cloning_enabled: boolean;
  webhook_api_enabled: boolean;
  priority_sla_enabled: boolean;
  features_list: string[];
  popular: boolean;
  is_active: boolean;
  sort_order: number;
}

interface AdminCouponItem {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number;
  current_uses: number;
  details_json?: any;
}

interface AdminApiKeyRecord {
  id: string;
  name: string;
  token_prefix?: string;
  key_prefix?: string;
  environment?: string;
  status?: string;
  permissions?: any;
  scopes?: string[];
  owner_user_id?: string;
  owner_user_email?: string;
  owner_user_name?: string;
  owner_user_avatar?: string | null;
  user_id?: string;
  user_email?: string;
  user_full_name?: string;
  organization_id?: string;
  organization_name?: string;
  tenant_plan_id?: string;
  tenant_plan_name?: string;
  is_active?: boolean;
  rate_limit_per_min?: number;
  daily_quota?: number;
  created_at?: string;
  last_used_at?: string | null;
  expires_at?: string | null;
}

interface AdminTransactionItem {
  id: string;
  user_id?: string;
  organization_id?: string;
  user_email: string;
  billing_email?: string;
  billing_name: string;
  avatar_url?: string | null;
  plan_id: string;
  billing_cycle: string;
  amount_usd: number;
  currency: string;
  amount_local: number;
  gateway: string;
  status: string;
  gateway_order_id?: string;
  gateway_payment_id?: string;
  invoice_number?: string;
  bank_reference_utr?: string;
  details_json?: any;
  notes?: string;
  created_at: string;
  completed_at?: string;
}

export const normalizeGatewayKey = (gw?: string): string => {
  if (!gw) return 'other';
  const g = gw.toLowerCase().replace(/[-_\s]+/g, '_').trim();
  if (g === 'bank_transfer' || g === 'bank_wire' || g === 'wire' || g === 'bank' || g === 'offline_wire') {
    return 'bank_wire';
  }
  if (g === 'authorizenet' || g === 'authorize_net') return 'authorize_net';
  if (g === 'coinbase' || g === 'crypto' || g === 'coinbase_crypto') return 'coinbase';
  return g;
};

export const getGatewayDisplayName = (gw?: string): string => {
  const norm = normalizeGatewayKey(gw);
  switch (norm) {
    case 'stripe': return 'Stripe';
    case 'razorpay': return 'Razorpay';
    case 'bank_wire': return 'Bank Wire';
    case 'cashfree': return 'Cashfree';
    case 'phonepe': return 'PhonePe';
    case 'paypal': return 'PayPal';
    case 'upi': return 'UPI';
    case 'paytm': return 'Paytm';
    case 'authorize_net': return 'Authorize.Net';
    case 'square': return 'Square';
    case 'paddle': return 'Paddle';
    case 'coinbase': return 'Coinbase Crypto';
    case 'flutterwave': return 'Flutterwave';
    case 'adyen': return 'Adyen';
    case 'mercadopago': return 'Mercado Pago';
    case 'klarna': return 'Klarna';
    case 'mollie': return 'Mollie';
    case 'skrill': return 'Skrill';
    case 'alipay': return 'Alipay';
    default: return gw ? gw.toUpperCase() : 'Standard';
  }
};

export const normalizeTransactionStatus = (status?: string): 'completed' | 'pending' | 'failed' | 'refunded' => {
  if (!status) return 'pending';
  const s = status.toLowerCase().trim();
  if (['completed', 'complete', 'succeeded', 'success', 'paid', 'approved'].includes(s)) {
    return 'completed';
  }
  if (['failed', 'cancelled', 'canceled', 'declined', 'error'].includes(s)) {
    return 'failed';
  }
  if (['refunded', 'reversed'].includes(s)) {
    return 'refunded';
  }
  return s as any;
};

export const normalizeStatusKey = (st?: string): string => {
  if (!st) return 'pending';
  const s = st.toLowerCase().trim();
  if (['succeeded', 'paid', 'completed', 'active', 'success'].includes(s)) {
    return 'completed';
  }
  if (['offline_pending', 'pending_approval', 'awaiting_approval', 'wire_pending'].includes(s)) {
    return 'offline_pending';
  }
  if (['pending', 'created', 'initiated', 'in_progress', 'processing'].includes(s)) {
    return 'pending';
  }
  if (['failed', 'cancelled', 'canceled', 'declined', 'error'].includes(s)) {
    return 'failed';
  }
  if (['refunded', 'reversed'].includes(s)) {
    return 'refunded';
  }
  return s;
};

interface PlatformUserBilling {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
  custom_plan_name: string;
  allocated_minutes: number;
  used_minutes: number;
  allocated_concurrency: number;
  active_calls: number;
  allocated_rag_storage_mb: number;
  discount_percent: number;
  is_custom_override: boolean;
  notes: string;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ onNavigate }) => {
  const { addToast } = useToast();
  const { user: currentAuthUser } = useAuth();
  const { broadcastNotification } = useNotifications();
  const { targetAccount, targetWorkspace, resetToSovereignWorkspace } = useSovereignTarget();

  const [activeTab, setActiveTab] = useState<
    'users' | 'gateways' | 'plans' | 'transactions' | 'coupons' | 'tenant_overrides' | 'organizations' | 'activities' | 'infrastructure' | 'notifications' | 'api_keys'
  >('users');

  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [activities, setActivities] = useState<GlobalActivity[]>([]);
  const [organizations, setOrganizations] = useState<TenantOrg[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);

  // In-App Executive Action Confirmation Modal State (Replaces native browser window.confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    details?: { label: string; value: React.ReactNode; isDanger?: boolean }[];
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'primary' | 'warning';
    isLoading?: boolean;
    onConfirm?: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
  });

  // User form states
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'operator',
    phoneNumber: '',
    organizationId: '',
  });
  const [editUserForm, setEditUserForm] = useState({
    fullName: '',
    role: 'operator',
    phoneNumber: '',
    organizationId: '',
    isActive: true,
  });
  const [newPassword, setNewPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Broadcast Notification Form State
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    category: 'system' as 'system' | 'calls' | 'telephony' | 'billing' | 'security',
    target_type: 'all' as 'all' | 'user' | 'role',
    target_id: '',
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // --- Super Admin Billing Master State ---
  const [adminPlans, setAdminPlans] = useState<AdminPlanConfig[]>([]);
  const [adminGateways, setAdminGateways] = useState<AdminGatewayConfig[]>([]);
  const [adminUsersBilling, setAdminUsersBilling] = useState<PlatformUserBilling[]>([]);
  const [adminTransactions, setAdminTransactions] = useState<AdminTransactionItem[]>([]);
  const [adminCoupons, setAdminCoupons] = useState<AdminCouponItem[]>([]);
  const [selectedTenantForOverride, setSelectedTenantForOverride] = useState<PlatformUserBilling | null>(null);
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');

  // Tab 4 Filters & Multi-Select
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txGatewayFilter, setTxGatewayFilter] = useState('all');
  const [txStatusFilter, setTxStatusFilter] = useState('all');
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);

  // Tab 7 & 8 Filters
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');

  // Tab 12: Super Admin API Keys Platform Registry State
  const [adminApiKeys, setAdminApiKeys] = useState<AdminApiKeyRecord[]>([]);
  const [apiKeySearchQuery, setApiKeySearchQuery] = useState('');
  const [apiKeyEnvFilter, setApiKeyEnvFilter] = useState('all');
  const [apiKeyStatusFilter, setApiKeyStatusFilter] = useState('all');

  // Tenant Override Form Fields
  const [overridePlanName, setOverridePlanName] = useState('Pro Scale Plan');
  const [overrideMinutes, setOverrideMinutes] = useState(3000);
  const [overrideConcurrency, setOverrideConcurrency] = useState(10);
  const [overrideRagStorage, setOverrideRagStorage] = useState(500);
  const [overrideDiscount, setOverrideDiscount] = useState(0);
  const [overrideWalletTopup, setOverrideWalletTopup] = useState<number>(0);
  const [overrideNotes, setOverrideNotes] = useState('');
  const [isApplyingOverride, setIsApplyingOverride] = useState(false);

  // Super Admin Inline Plan Editor State (Zero Modal)
  const [editingPlanInline, setEditingPlanInline] = useState<Partial<AdminPlanConfig> | null>(null);

  // Super Admin Inline Gateway Editor State (Zero Modal)
  const [editingGatewayId, setEditingGatewayId] = useState<string | null>(null);
  const [editingGatewayConfig, setEditingGatewayConfig] = useState<AdminGatewayConfig | null>(null);
  const [testingGatewayId, setTestingGatewayId] = useState<string | null>(null);
  const [testedGatewayResults, setTestedGatewayResults] = useState<{ [key: string]: any }>({});

  // Super Admin Inline Coupon Creator State (Zero Modal)
  const [isCreateCouponInlineOpen, setIsCreateCouponInlineOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState<number>(20);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState<number>(100);
  const [newCouponScope, setNewCouponScope] = useState<'all' | 'wallet_topup' | 'subscription'>('all');
  const [couponScopeFilter, setCouponScopeFilter] = useState<'all' | 'wallet_topup' | 'subscription' | 'universal'>('all');

  const handleAdminBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      addToast({ type: 'warning', title: 'Missing Information', description: 'Please fill in title and message.' });
      return;
    }
    setIsBroadcasting(true);
    try {
      const res = await broadcastNotification({
        title: broadcastForm.title.trim(),
        message: broadcastForm.message.trim(),
        type: broadcastForm.type,
        category: broadcastForm.category,
        target_type: broadcastForm.target_type,
        target_id: broadcastForm.target_id.trim() || undefined,
      });
      addToast({
        type: 'success',
        title: 'Platform Alert Broadcasted',
        description: res.message || 'Notification broadcasted to all users successfully.',
      });
      setBroadcastForm({
        title: '',
        message: '',
        type: 'info',
        category: 'system',
        target_type: 'all',
        target_id: '',
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Broadcast Failed', description: err.message });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      const [mRes, uRes, aRes, oRes, plansData, gatewaysData, usersBillData, txData, couponsData, apiKeysData] = await Promise.all([
        fetchAPI('/api/admin/metrics').catch(() => null),
        fetchAPI('/api/admin/users?page_size=100').catch(() => ({ items: [] })),
        fetchAPI('/api/admin/activities?limit=50').catch(() => ({ items: [] })),
        fetchAPI('/api/admin/organizations').catch(() => ({ items: [] })),
        fetchAPI('/api/admin/billing/plans').catch(() => []),
        fetchAPI('/api/admin/billing/gateways').catch(() => []),
        fetchAPI('/api/admin/billing/users').catch(() => []),
        fetchAPI('/api/admin/billing/transactions').catch(() => []),
        fetchAPI('/api/admin/billing/coupons').catch(() => []),
        fetchAPI('/api/admin/api-keys/all').catch(() => fetchAPI('/api/api-keys/admin/all').catch(() => ({ keys: [] }))),
      ]);

      if (mRes) setMetrics(mRes);
      if (uRes && Array.isArray(uRes.items)) setUsers(uRes.items);
      if (aRes && Array.isArray(aRes.items)) setActivities(aRes.items);
      if (oRes && Array.isArray(oRes.items)) setOrganizations(oRes.items);
      if (Array.isArray(plansData)) setAdminPlans(plansData);
      if (Array.isArray(gatewaysData)) {
        const cleanGateways = gatewaysData.filter((gw: AdminGatewayConfig) => gw.gateway_key !== 'global_invoice_template');
        setAdminGateways(cleanGateways);
        const initialTests: { [key: string]: any } = {};
        cleanGateways.forEach((gw: AdminGatewayConfig) => {
          if (gw.details_json && gw.details_json.last_test) {
            initialTests[gw.id] = gw.details_json.last_test;
            initialTests[gw.gateway_key] = gw.details_json.last_test;
          }
        });
        setTestedGatewayResults((prev) => ({ ...initialTests, ...prev }));
      }
      if (Array.isArray(usersBillData)) setAdminUsersBilling(usersBillData);
      if (Array.isArray(txData)) setAdminTransactions(txData);
      if (Array.isArray(couponsData)) setAdminCoupons(couponsData);
      if (apiKeysData) {
        if (Array.isArray(apiKeysData)) {
          setAdminApiKeys(apiKeysData);
        } else if (Array.isArray(apiKeysData.keys)) {
          setAdminApiKeys(apiKeysData.keys);
        } else if (Array.isArray(apiKeysData.items)) {
          setAdminApiKeys(apiKeysData.items);
        }
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error Loading Governance Data',
        description: err.message || 'Failed to fetch Super Admin telemetry.',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 15000);
    return () => clearInterval(timer);
  }, []);

  // Real User Avatar Lookup Map
  const userAvatarByEmailOrId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const u of users) {
      if (u.avatar_url) {
        if (u.email) map[u.email.toLowerCase()] = u.avatar_url;
        if (u.id) map[u.id] = u.avatar_url;
      }
    }
    return map;
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !searchQuery ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.organization_name && u.organization_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRole = roleFilter === 'all' || (roleFilter === 'user' ? u.role !== 'super_admin' : u.role === roleFilter);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.is_active) ||
        (statusFilter === 'inactive' && !u.is_active);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Tab 4: Filtered transactions
  const filteredTransactions = useMemo(() => {
    return adminTransactions.filter((tx) => {
      const q = txSearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        tx.id?.toLowerCase().includes(q) ||
        tx.user_email?.toLowerCase().includes(q) ||
        tx.billing_email?.toLowerCase().includes(q) ||
        tx.billing_name?.toLowerCase().includes(q) ||
        tx.bank_reference_utr?.toLowerCase().includes(q) ||
        tx.gateway_payment_id?.toLowerCase().includes(q) ||
        tx.gateway_order_id?.toLowerCase().includes(q) ||
        tx.invoice_number?.toLowerCase().includes(q) ||
        tx.plan_id?.toLowerCase().includes(q);

      const txNormGateway = normalizeGatewayKey(tx.gateway);
      const matchGateway = txGatewayFilter === 'all' || txNormGateway === txGatewayFilter;

      const txNormStatus = normalizeStatusKey(tx.status);
      const matchStatus = txStatusFilter === 'all' || txNormStatus === txStatusFilter;

      return matchSearch && matchGateway && matchStatus;
    });
  }, [adminTransactions, txSearchQuery, txGatewayFilter, txStatusFilter]);

  // Tab 4: Multi-Select Transaction State & Helpers
  const isAllTxSelected = useMemo(() => {
    return filteredTransactions.length > 0 && filteredTransactions.every((tx) => selectedTxIds.includes(tx.id));
  }, [filteredTransactions, selectedTxIds]);

  const handleToggleSelectAllTx = () => {
    if (isAllTxSelected) {
      setSelectedTxIds([]);
    } else {
      setSelectedTxIds(filteredTransactions.map((tx) => tx.id));
    }
  };

  const handleToggleSelectTx = (id: string) => {
    setSelectedTxIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Tab 6: Filtered tenant billing
  const filteredTenantBilling = useMemo(() => {
    return adminUsersBilling.filter((u) => {
      if (!tenantSearchQuery) return true;
      const q = tenantSearchQuery.toLowerCase();
      return (
        u.email?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.custom_plan_name?.toLowerCase().includes(q)
      );
    });
  }, [adminUsersBilling, tenantSearchQuery]);

  // Tab 7: Filtered organizations
  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) => {
      if (!orgSearchQuery) return true;
      const q = orgSearchQuery.toLowerCase();
      return (
        org.name?.toLowerCase().includes(q) ||
        org.slug?.toLowerCase().includes(q) ||
        org.id?.toLowerCase().includes(q) ||
        (org.billing_email && org.billing_email.toLowerCase().includes(q))
      );
    });
  }, [organizations, orgSearchQuery]);

  // Tab 8: Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (!activitySearchQuery) return true;
      const q = activitySearchQuery.toLowerCase();
      return (
        a.action?.toLowerCase().includes(q) ||
        a.resource?.toLowerCase().includes(q) ||
        a.user_email?.toLowerCase().includes(q) ||
        (a.ip_address && a.ip_address.toLowerCase().includes(q))
      );
    });
  }, [activities, activitySearchQuery]);

  // Tab 12: Filtered API Keys Platform Registry
  const filteredApiKeys = useMemo(() => {
    return adminApiKeys.filter((k) => {
      const q = apiKeySearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        k.name?.toLowerCase().includes(q) ||
        k.token_prefix?.toLowerCase().includes(q) ||
        k.key_prefix?.toLowerCase().includes(q) ||
        k.owner_user_email?.toLowerCase().includes(q) ||
        k.user_email?.toLowerCase().includes(q) ||
        k.owner_user_name?.toLowerCase().includes(q) ||
        k.user_full_name?.toLowerCase().includes(q) ||
        k.organization_name?.toLowerCase().includes(q);

      const matchEnv =
        apiKeyEnvFilter === 'all' ||
        (k.environment || 'production').toLowerCase() === apiKeyEnvFilter;

      const isActive = k.status === 'active' || (k.is_active && k.status !== 'disabled');
      const matchStatus =
        apiKeyStatusFilter === 'all' ||
        (apiKeyStatusFilter === 'active' && isActive) ||
        (apiKeyStatusFilter === 'disabled' && !isActive);

      return matchSearch && matchEnv && matchStatus;
    });
  }, [adminApiKeys, apiKeySearchQuery, apiKeyEnvFilter, apiKeyStatusFilter]);

  // Tab 5: Filtered Coupons & Live Scope Counts
  const couponScopeCounts = useMemo(() => {
    const counts = { all: adminCoupons.length, wallet_topup: 0, subscription: 0, universal: 0 };
    for (const c of adminCoupons) {
      const scope = c.details_json?.applicable_to;
      if (scope === 'wallet_topup') counts.wallet_topup++;
      else if (scope === 'subscription') counts.subscription++;
      else counts.universal++;
    }
    return counts;
  }, [adminCoupons]);

  const filteredCoupons = useMemo(() => {
    return adminCoupons.filter((c) => {
      const scope = c.details_json?.applicable_to || 'all';
      if (couponScopeFilter === 'wallet_topup') return scope === 'wallet_topup';
      if (couponScopeFilter === 'subscription') return scope === 'subscription';
      if (couponScopeFilter === 'universal') return scope === 'all' || !c.details_json?.applicable_to;
      return true;
    });
  }, [adminCoupons, couponScopeFilter]);

  // Stable Master Breakdown counts for User Role Filter (Dropdown 1 - Primary)
  const userRoleCounts = useMemo(() => {
    const baseUsers = users.filter((u) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.email.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        (u.organization_name && u.organization_name.toLowerCase().includes(q))
      );
    });

    return {
      all: baseUsers.length,
      super_admin: baseUsers.filter((u) => u.role === 'super_admin').length,
      user: baseUsers.filter((u) => u.role !== 'super_admin').length,
    };
  }, [users, searchQuery]);

  // Contextual Breakdown counts for User Status Filter (Dropdown 2 - Scoped strictly to selected Role)
  const userStatusCounts = useMemo(() => {
    const baseUsers = users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.email.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        (u.organization_name && u.organization_name.toLowerCase().includes(q));

      const matchRole = roleFilter === 'all' || (roleFilter === 'user' ? u.role !== 'super_admin' : u.role === roleFilter);
      return matchSearch && matchRole;
    });

    return {
      all: baseUsers.length,
      active: baseUsers.filter((u) => u.is_active).length,
      inactive: baseUsers.filter((u) => !u.is_active).length,
    };
  }, [users, searchQuery, roleFilter]);

  // Global pending wires requiring sovereign approval
  const globalOfflinePendingWireCount = useMemo(
    () => adminTransactions.filter((t) => normalizeStatusKey(t.status) === 'offline_pending').length,
    [adminTransactions]
  );

  // Dynamic stable master counts for Gateway Filter (Dropdown 1 - Primary)
  const txGatewayCounts = useMemo(() => {
    const baseTxs = adminTransactions.filter((tx) => {
      const q = txSearchQuery.toLowerCase().trim();
      return (
        !q ||
        tx.id?.toLowerCase().includes(q) ||
        tx.user_email?.toLowerCase().includes(q) ||
        tx.billing_email?.toLowerCase().includes(q) ||
        tx.billing_name?.toLowerCase().includes(q) ||
        tx.bank_reference_utr?.toLowerCase().includes(q) ||
        tx.gateway_payment_id?.toLowerCase().includes(q) ||
        tx.gateway_order_id?.toLowerCase().includes(q) ||
        tx.invoice_number?.toLowerCase().includes(q) ||
        tx.plan_id?.toLowerCase().includes(q)
      );
    });

    const counts: Record<string, number> = {};
    baseTxs.forEach((tx) => {
      const key = normalizeGatewayKey(tx.gateway);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [adminTransactions, txSearchQuery]);

  // Dynamic 18 Payment Gateway Filter Options (Correct 18 total count + per-gateway Tx breakdown)
  const gatewayFilterOptions = useMemo(() => {
    const totalGatewaysCount = adminGateways.length > 0 ? adminGateways.length : 18;
    const options: { value: string; label: string }[] = [
      { value: 'all', label: `All Gateways (${totalGatewaysCount})` },
    ];

    const standardGateways = [
      { key: 'stripe', label: 'Stripe' },
      { key: 'razorpay', label: 'Razorpay' },
      { key: 'bank_wire', label: 'Bank Wire' },
      { key: 'coinbase', label: 'Coinbase Crypto' },
      { key: 'adyen', label: 'Adyen' },
      { key: 'paypal', label: 'PayPal' },
      { key: 'cashfree', label: 'Cashfree' },
      { key: 'phonepe', label: 'PhonePe' },
      { key: 'paddle', label: 'Paddle' },
      { key: 'square', label: 'Square' },
      { key: 'authorize_net', label: 'Authorize.Net' },
      { key: 'mollie', label: 'Mollie' },
      { key: 'skrill', label: 'Skrill' },
      { key: 'klarna', label: 'Klarna' },
      { key: 'flutterwave', label: 'Flutterwave' },
      { key: 'mercadopago', label: 'Mercado Pago' },
      { key: 'alipay', label: 'Alipay' },
      { key: 'paytm', label: 'Paytm' },
      { key: 'promo_100_free', label: '100% Promo Voucher' },
    ];

    const addedKeys = new Set<string>();

    standardGateways.forEach((gw) => {
      addedKeys.add(gw.key);
      const count = txGatewayCounts[gw.key] || 0;
      options.push({
        value: gw.key,
        label: `${gw.label} (${count})`,
      });
    });

    Object.keys(txGatewayCounts).forEach((key) => {
      if (!addedKeys.has(key) && key !== 'all') {
        options.push({
          value: key,
          label: `${getGatewayDisplayName(key)} (${txGatewayCounts[key] || 0})`,
        });
      }
    });

    return options;
  }, [txGatewayCounts, adminGateways.length]);

  // Dynamic contextual breakdown counts for Status Filter (Dropdown 2 - Scoped strictly to selected Gateway)
  const txStatusCounts = useMemo(() => {
    const baseTxs = adminTransactions.filter((tx) => {
      const q = txSearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        tx.id?.toLowerCase().includes(q) ||
        tx.user_email?.toLowerCase().includes(q) ||
        tx.billing_email?.toLowerCase().includes(q) ||
        tx.billing_name?.toLowerCase().includes(q) ||
        tx.bank_reference_utr?.toLowerCase().includes(q) ||
        tx.gateway_payment_id?.toLowerCase().includes(q) ||
        tx.gateway_order_id?.toLowerCase().includes(q) ||
        tx.invoice_number?.toLowerCase().includes(q) ||
        tx.plan_id?.toLowerCase().includes(q);

      const txNormGateway = normalizeGatewayKey(tx.gateway);
      const matchGateway = txGatewayFilter === 'all' || txNormGateway === txGatewayFilter;

      return matchSearch && matchGateway;
    });

    const counts: Record<string, number> = {
      all: baseTxs.length,
      offline_pending: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      refunded: 0,
    };
    baseTxs.forEach((tx) => {
      const key = normalizeStatusKey(tx.status);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [adminTransactions, txSearchQuery, txGatewayFilter]);

  // Stale draft / failed transaction count for clean-up & purge
  const staleTransactionsCount = useMemo(() => {
    return adminTransactions.filter((tx) => {
      const st = normalizeStatusKey(tx.status);
      return st === 'pending' || st === 'failed';
    }).length;
  }, [adminTransactions]);

  // Hierarchical Filter Handlers for Users
  const handleRoleFilterChange = (newRole: string) => {
    setRoleFilter(newRole);
    if (statusFilter !== 'all') {
      const matchingCount = users.filter((u) => {
        const matchRole = newRole === 'all' || (newRole === 'user' ? u.role !== 'super_admin' : u.role === newRole);
        const matchStatus =
          (statusFilter === 'active' && u.is_active) ||
          (statusFilter === 'inactive' && !u.is_active);
        return matchRole && matchStatus;
      }).length;

      if (matchingCount === 0) {
        setStatusFilter('all');
      }
    }
  };

  const handleUserStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
  };

  // Hierarchical Filter Handlers for Transactions
  const handleGatewayFilterChange = (newGateway: string) => {
    setTxGatewayFilter(newGateway);
    if (txStatusFilter !== 'all') {
      const matchingCount = adminTransactions.filter((tx) => {
        const txNormGateway = normalizeGatewayKey(tx.gateway);
        const matchGateway = newGateway === 'all' || txNormGateway === newGateway;
        const txNormStatus = normalizeStatusKey(tx.status);
        const matchStatus = txNormStatus === txStatusFilter;
        return matchGateway && matchStatus;
      }).length;

      if (matchingCount === 0) {
        setTxStatusFilter('all');
      }
    }
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setTxStatusFilter(newStatus);
  };

  // Handlers for User Governance
  const handleToggleStatus = async (user: PlatformUser) => {
    if (user.id === currentAuthUser?.id || user.email === 'admin@createcall.ai') {
      addToast({
        type: 'warning',
        title: 'Protected Account',
        description: 'Cannot suspend the primary Super Admin account.',
      });
      return;
    }

    try {
      const res = await fetchAPI(`/api/admin/users/${user.id}/toggle-status`, { method: 'POST' });
      addToast({
        type: 'success',
        title: 'Status Updated',
        description: res.message || `User ${user.email} is now ${res.is_active ? 'Active' : 'Suspended'}.`,
      });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action Failed', description: err.message });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    setIsSubmitting(true);
    try {
      await fetchAPI(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword }),
      });
      addToast({
        type: 'success',
        title: 'Password Overridden',
        description: `New password assigned for ${selectedUser.email}.`,
      });
      setIsResetPasswordModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      addToast({ type: 'error', title: 'Reset Failed', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditUser = (user: PlatformUser) => {
    setSelectedUser(user);
    setEditUserForm({
      fullName: user.full_name || '',
      role: user.role || 'operator',
      phoneNumber: user.phone_number || '',
      organizationId: user.organization_id || '',
      isActive: user.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetchAPI(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: editUserForm.fullName.trim(),
          role: editUserForm.role,
          phone_number: editUserForm.phoneNumber.trim() || null,
          organization_id: editUserForm.organizationId || null,
          is_active: editUserForm.isActive,
        }),
      });
      addToast({
        type: 'success',
        title: 'User Profile Updated',
        description: res.message || `Account for ${selectedUser.email} updated successfully.`,
      });
      setIsEditModalOpen(false);
      setSelectedUser(null);
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update Failed', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await fetchAPI(`/api/admin/users/${selectedUser.id}`, { method: 'DELETE' });
      addToast({
        type: 'info',
        title: 'User Purged',
        description: `Account for ${selectedUser.email} permanently removed.`,
      });
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Deletion Failed', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchAPI('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: newUserForm.email,
          full_name: newUserForm.fullName,
          password: newUserForm.password,
          role: newUserForm.role,
          phone_number: newUserForm.phoneNumber || null,
          organization_id: newUserForm.organizationId || null,
        }),
      });
      addToast({
        type: 'success',
        title: 'User Provisioned',
        description: `Created account for ${newUserForm.email}.`,
      });
      setIsCreateModalOpen(false);
      setNewUserForm({
        email: '',
        fullName: '',
        password: '',
        role: 'operator',
        phoneNumber: '',
        organizationId: '',
      });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Provisioning Failed', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handlers for Super Admin Billing Master ---
  const handleSavePlanAdmin = async (planData: Partial<SubscriptionPlan>) => {
    try {
      if (planData.id) {
        await fetchAPI(`/api/admin/billing/plans/${planData.id}`, {
          method: 'PUT',
          body: JSON.stringify(planData),
        });
        addToast({ type: 'success', title: 'Plan Updated', description: `Plan '${planData.name}' updated in database.` });
      } else {
        await fetchAPI('/api/admin/billing/plans', {
          method: 'POST',
          body: JSON.stringify(planData),
        });
        addToast({ type: 'success', title: 'Plan Created', description: `New plan '${planData.name}' created.` });
      }
      setEditingPlanInline(null);

      // Broadcast live event across all open views and client instances
      window.dispatchEvent(new CustomEvent('plan-entitlements-updated'));
      window.dispatchEvent(new CustomEvent('app-plan-updated'));
      localStorage.setItem('plan_entitlements_version', Date.now().toString());

      await loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Plan Save Error', description: err.message || 'Could not save plan.' });
      throw err;
    }
  };

  const handleDeletePlanAdmin = async (planId: string) => {
    try {
      await fetchAPI(`/api/admin/billing/plans/${planId}`, { method: 'DELETE' });
      addToast({ type: 'info', title: 'Plan Deleted', description: 'Subscription plan deleted from database.' });
      
      // Broadcast live event
      window.dispatchEvent(new CustomEvent('plan-entitlements-updated'));
      window.dispatchEvent(new CustomEvent('app-plan-updated'));
      localStorage.setItem('plan_entitlements_version', Date.now().toString());

      await loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Error', description: err.message || 'Could not delete plan.' });
      throw err;
    }
  };

  const handleToggleGatewayStatus = async (gw: AdminGatewayConfig) => {
    try {
      const updated = { ...gw, is_enabled: !gw.is_enabled };
      await fetchAPI(`/api/admin/billing/gateways/${gw.gateway_key}`, {
        method: 'PUT',
        body: JSON.stringify({ is_enabled: updated.is_enabled }),
      });
      addToast({
        type: updated.is_enabled ? 'success' : 'info',
        title: updated.is_enabled ? 'Gateway Plugin Activated' : 'Gateway Plugin Deactivated',
        description: `${gw.display_name} is now ${updated.is_enabled ? 'Active on Checkout' : 'Disabled'}.`,
      });
      window.dispatchEvent(new CustomEvent('billing-data-updated'));
      window.dispatchEvent(new CustomEvent('gateways-updated'));
      localStorage.setItem('gateways_version', Date.now().toString());
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Toggle Error', description: err.message });
    }
  };

  const handleTestGatewayConnection = async (gw: AdminGatewayConfig) => {
    setTestingGatewayId(gw.id);
    try {
      const res = await fetchAPI(`/api/admin/billing/gateways/${gw.gateway_key}/test`, {
        method: 'POST',
        body: JSON.stringify({
          public_key: gw.public_key,
          secret_key: gw.secret_key,
          merchant_id: gw.merchant_id,
          environment: gw.environment,
          details_json: gw.details_json,
        }),
      });
      setTestedGatewayResults((prev) => ({
        ...prev,
        [gw.id]: res,
        [gw.gateway_key]: res,
      }));
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Connection Verified',
          description: `Handshake active with ${gw.display_name} (${res.latency_ms}ms latency).`,
        });
      } else {
        addToast({
          type: res.status === 'unconfigured' ? 'warning' : 'error',
          title: res.status === 'unconfigured' ? 'Credentials Required' : 'Handshake Failed',
          description: res.message || 'Connection test could not verify credentials.',
        });
      }
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Test Failed', description: err.message || 'Connection test failed.' });
    } finally {
      setTestingGatewayId(null);
    }
  };

  const handleSaveGatewayCredentials = async (gw: AdminGatewayConfig) => {
    try {
      await fetchAPI(`/api/admin/billing/gateways/${gw.gateway_key}`, {
        method: 'PUT',
        body: JSON.stringify(gw),
      });
      addToast({
        type: 'success',
        title: 'Gateway Credentials Saved',
        description: `Updated configuration for ${gw.display_name}.`,
      });
      window.dispatchEvent(new CustomEvent('billing-data-updated'));
      window.dispatchEvent(new CustomEvent('gateways-updated'));
      localStorage.setItem('gateways_version', Date.now().toString());
      setEditingGatewayId(null);
      setEditingGatewayConfig(null);
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', description: err.message || 'Could not update gateway.' });
    }
  };

  const handleApproveOfflineTransaction = async (txId: string) => {
    try {
      await fetchAPI(`/api/admin/billing/approve-offline/${txId}`, { method: 'POST' });
      addToast({
        type: 'success',
        title: 'Wire Transfer Approved',
        description: 'Tenant subscription activated and wallet balance credited immediately.',
      });

      // Broadcast live sync across all tabs & sessions
      window.dispatchEvent(new CustomEvent('billing-data-updated'));
      window.dispatchEvent(new CustomEvent('plan-entitlements-updated'));
      window.dispatchEvent(new CustomEvent('app-plan-updated'));
      localStorage.setItem('plan_entitlements_version', Date.now().toString());

      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Approval Failed', description: err.message });
    }
  };

  const promptRejectOfflineTransaction = (txId: string, clientName?: string, amountStr?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Bank Wire Submission',
      description: 'Are you sure you want to reject this offline remittance reference? The transaction will be marked as REJECTED and no credits will be granted.',
      confirmLabel: 'Reject Bank Wire',
      confirmVariant: 'danger',
      details: [
        { label: 'Transaction Reference', value: txId },
        ...(clientName ? [{ label: 'Customer', value: clientName }] : []),
        ...(amountStr ? [{ label: 'Remittance Amount', value: amountStr }] : []),
        { label: 'Status Change', value: 'OFFLINE_PENDING ➔ REJECTED', isDanger: true },
      ],
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          await fetchAPI(`/api/admin/billing/reject-offline/${txId}`, { method: 'POST' });
          addToast({
            type: 'info',
            title: 'Bank Wire Rejected',
            description: `Transaction ${txId.slice(0, 8)} marked as rejected.`,
          });
          window.dispatchEvent(new CustomEvent('billing-data-updated'));
          loadData();
        } catch (err: any) {
          addToast({ type: 'error', title: 'Rejection Failed', description: err.message || 'Could not reject transaction.' });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const promptCancelSubscription = (targetId: string, clientName: string, clientEmail?: string, currentPlan?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel & Revoke Subscription Plan',
      description: `Are you sure you want to revoke the active subscription plan for "${clientName}"? This will immediately downgrade their capacity limits to Starter Pilot.`,
      confirmLabel: 'Revoke Plan & Downgrade',
      confirmVariant: 'danger',
      details: [
        { label: 'Tenant / Client', value: `${clientName} ${clientEmail ? `(${clientEmail})` : ''}` },
        { label: 'Current Plan', value: currentPlan || 'Active Subscription' },
        { label: 'Downgrade Target', value: 'Starter Pilot (Free Tier)', isDanger: true },
        { label: 'Carrier Impact', value: 'Live carrier SIP quota reset, overage limits restored' },
      ],
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          const res = await fetchAPI(`/api/admin/billing/cancel-subscription/${targetId}`, { method: 'POST' });
          addToast({
            type: 'warning',
            title: 'Subscription Plan Revoked',
            description: res.message || `Plan for ${clientName} canceled and downgraded to Starter Pilot.`,
          });
          window.dispatchEvent(new CustomEvent('billing-data-updated'));
          window.dispatchEvent(new CustomEvent('plan-entitlements-updated'));
          window.dispatchEvent(new CustomEvent('app-plan-updated'));
          localStorage.setItem('plan_entitlements_version', Date.now().toString());
          loadData();
        } catch (err: any) {
          addToast({ type: 'error', title: 'Plan Cancellation Failed', description: err.message || 'Could not cancel plan.' });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const promptCancelTopup = (tx: any) => {
    const dt = tx.details_json || {};
    const creditedUsd = dt.credited_amount_usd ?? dt.topup_amount_usd ?? tx.amount_usd ?? 0;
    const isFree = Boolean(tx.is_free_promo || dt.is_free_checkout || tx.amount_local === 0);
    const paidStr = isFree
      ? `${tx.currency || 'INR'} 0.00 • 100% Free Promo (Coupon: ${dt.coupon_code || 'PROMO'})`
      : `${tx.currency || 'USD'} ${Number(tx.amount_local || tx.amount_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    setConfirmModal({
      isOpen: true,
      title: 'Revert Add Funds Top-Up',
      description: `Are you sure you want to cancel and revert this Add Funds transaction? This will deduct the credited $${Number(creditedUsd).toFixed(2)} USD from the tenant carrier wallet.`,
      confirmLabel: 'Revert Top-Up & Deduct Balance',
      confirmVariant: 'danger',
      details: [
        { label: 'Customer / Tenant', value: `${tx.billing_name || 'Customer'} (${tx.user_email || tx.billing_email || 'N/A'})` },
        { label: 'Transaction ID', value: tx.id },
        { label: 'Invoice Number', value: tx.invoice_number || 'N/A' },
        { label: 'Credited USD Balance', value: `$${Number(creditedUsd).toFixed(2)} USD (Will be deducted)`, isDanger: true },
        { label: 'Amount Paid at Checkout', value: paidStr },
        { label: 'Payment Method / Rail', value: tx.gateway === 'promo_100_free' ? '🎁 100% Free Promo Voucher' : getGatewayDisplayName(tx.gateway) },
      ],
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          const res = await fetchAPI(`/api/admin/billing/cancel-topup/${tx.id}`, { method: 'POST' });
          addToast({
            type: 'warning',
            title: 'Top-Up Canceled & Reverted',
            description: res.message || `Top-up transaction ${tx.id.slice(0, 8)} canceled and balance deducted.`,
          });
          window.dispatchEvent(new CustomEvent('billing-data-updated'));
          window.dispatchEvent(new CustomEvent('plan-entitlements-updated'));
          window.dispatchEvent(new CustomEvent('app-plan-updated'));
          localStorage.setItem('plan_entitlements_version', Date.now().toString());
          loadData();
        } catch (err: any) {
          addToast({ type: 'error', title: 'Top-Up Reversal Failed', description: err.message || 'Could not cancel top-up.' });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const promptDeleteTransaction = (tx: AdminTransactionItem) => {
    const isCompleted = normalizeStatusKey(tx.status) === 'completed';
    setConfirmModal({
      isOpen: true,
      title: isCompleted ? 'Delete Settled Transaction' : 'Delete Stale Transaction Record',
      description: isCompleted
        ? 'CAUTION: This transaction is marked as Settled/Completed. Deleting it will remove the financial record from the database. Are you sure?'
        : 'Permanently delete this abandoned checkout draft or failed transaction from the database to keep your ledger clean.',
      confirmLabel: 'Delete Record',
      confirmVariant: 'danger',
      details: [
        { label: 'Customer', value: tx.billing_name || tx.user_email || 'Unknown' },
        { label: 'Transaction ID', value: tx.id },
        { label: 'Gateway', value: getGatewayDisplayName(tx.gateway) },
        { label: 'Amount', value: `${tx.currency === 'INR' ? '₹' : '$'}${Number(tx.amount_local || tx.amount_usd || 0).toFixed(2)}` },
        { label: 'Status', value: normalizeStatusKey(tx.status).toUpperCase(), isDanger: normalizeStatusKey(tx.status) === 'failed' },
      ],
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          const res = await fetchAPI(`/api/admin/billing/transactions/${tx.id}`, {
            method: 'DELETE',
          });
          addToast({
            type: 'info',
            title: 'Transaction Deleted',
            description: res.message || `Transaction ${tx.id.slice(0, 8)} removed from database.`,
          });
          loadData();
        } catch (err: any) {
          addToast({ type: 'error', title: 'Delete Failed', description: err.message || 'Could not delete transaction.' });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const promptPurgeStaleTransactions = () => {
    const pendingCount = adminTransactions.filter((tx) => normalizeStatusKey(tx.status) === 'pending').length;
    const failedCount = adminTransactions.filter((tx) => normalizeStatusKey(tx.status) === 'failed').length;

    setConfirmModal({
      isOpen: true,
      title: 'Purge Stale Checkout Drafts & Failed Sessions',
      description: `This will permanently delete all abandoned checkout drafts (${pendingCount}) and failed checkouts (${failedCount}) from the database. All settled / completed paid invoices are safely protected and will NOT be touched.`,
      confirmLabel: `Purge ${staleTransactionsCount} Stale Records`,
      confirmVariant: 'danger',
      details: [
        { label: 'Pending Checkouts', value: `${pendingCount} sessions` },
        { label: 'Failed Checkouts', value: `${failedCount} sessions` },
        { label: 'Total Records to Purge', value: `${staleTransactionsCount} records`, isDanger: true },
        { label: 'Settled Invoices', value: 'Protected (Untouched)', isSuccess: true },
      ],
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          const res = await fetchAPI('/api/admin/billing/transactions/purge-stale', {
            method: 'POST',
          });
          addToast({
            type: 'success',
            title: 'Database Cleaned',
            description: res.message || `Purged ${res.purged_count || staleTransactionsCount} stale records.`,
          });
          loadData();
        } catch (err: any) {
          addToast({ type: 'error', title: 'Purge Failed', description: err.message || 'Could not purge stale transactions.' });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const promptBulkDeleteTransactions = () => {
    if (selectedTxIds.length === 0) return;
    const selectedTxs = adminTransactions.filter((t) => selectedTxIds.includes(t.id));
    const totalAmount = selectedTxs.reduce(
      (sum, t) => sum + Number(t.amount_local || t.amount_usd || 0),
      0
    );

    setConfirmModal({
      isOpen: true,
      title: `Delete ${selectedTxIds.length} Selected Transaction${selectedTxIds.length > 1 ? 's' : ''}`,
      description: `Are you sure you want to permanently delete these ${selectedTxIds.length} selected transaction records from the database? This manual admin action cannot be undone.`,
      confirmLabel: `Delete ${selectedTxIds.length} Selected Records`,
      confirmVariant: 'danger',
      details: [
        { label: 'Selected Records', value: `${selectedTxIds.length} transactions`, isDanger: true },
        { label: 'Combined Value', value: `$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` },
        { label: 'Database Impact', value: 'Permanent removal with invoice cascade clean', isDanger: true },
      ],
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          const res = await fetchAPI('/api/admin/billing/transactions/bulk-delete', {
            method: 'POST',
            body: JSON.stringify({ transaction_ids: selectedTxIds }),
          });
          addToast({
            type: 'success',
            title: 'Transactions Deleted',
            description: res.message || `Deleted ${res.deleted_count || selectedTxIds.length} transactions.`,
          });
          setSelectedTxIds([]);
          loadData();
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Bulk Delete Failed',
            description: err.message || 'Could not delete selected transactions.',
          });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleApplyTenantOverride = async () => {
    if (!selectedTenantForOverride) return;
    setIsApplyingOverride(true);
    try {
      await fetchAPI('/api/admin/billing/tenant-overrides', {
        method: 'POST',
        body: JSON.stringify({
          target_user_id_or_email: selectedTenantForOverride.id || selectedTenantForOverride.email,
          user_id: selectedTenantForOverride.id,
          custom_plan_name: overridePlanName,
          allocated_minutes: Number(overrideMinutes),
          allocated_concurrency: Number(overrideConcurrency),
          allocated_rag_storage_mb: Number(overrideRagStorage || 500),
          discount_percent: Number(overrideDiscount),
          wallet_balance_topup: Number(overrideWalletTopup || 0),
          notes: overrideNotes,
        }),
      });
      addToast({
        type: 'success',
        title: 'Tenant Override Applied',
        description: `Allocated custom quota, limits & wallet for ${selectedTenantForOverride.full_name}.`,
      });
      setSelectedTenantForOverride(null);
      setOverrideWalletTopup(0);

      // Broadcast live sync across all tabs & sessions
      window.dispatchEvent(new CustomEvent('billing-data-updated'));
      window.dispatchEvent(new CustomEvent('plan-entitlements-updated'));
      window.dispatchEvent(new CustomEvent('app-plan-updated'));
      localStorage.setItem('plan_entitlements_version', Date.now().toString());

      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Override Failed', description: err.message });
    } finally {
      setIsApplyingOverride(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    try {
      await fetchAPI('/api/admin/billing/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: newCouponCode.trim().toUpperCase(),
          discount_percent: Number(newDiscountPercent),
          max_uses: Number(newCouponMaxUses),
          applicable_to: newCouponScope,
        }),
      });
      addToast({
        type: 'success',
        title: 'Promo Coupon Activated',
        description: `Coupon ${newCouponCode.toUpperCase()} created (${newDiscountPercent}% off • ${newCouponScope === 'wallet_topup' ? 'Add Funds Only' : newCouponScope === 'subscription' ? 'Subscriptions Only' : 'Universal'}).`,
      });
      setNewCouponCode('');
      setNewCouponScope('all');
      setIsCreateCouponInlineOpen(false);
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Coupon Creation Failed', description: err.message });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      await fetchAPI(`/api/admin/billing/coupons/${couponId}`, { method: 'DELETE' });
      addToast({ type: 'info', title: 'Coupon Removed', description: 'Deleted promotional coupon.' });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Error', description: err.message || 'Could not delete coupon.' });
    }
  };

  // Super Admin API Key Actions
  const handleAdminToggleKeyStatus = async (keyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await fetchAPI(`/api/admin/api-keys/${keyId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      addToast({
        type: 'success',
        title: 'Key Status Updated',
        description: `API Key status set to ${newStatus}.`,
      });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update Failed', description: err.message || 'Could not update status.' });
    }
  };

  const promptAdminRevokeKey = (keyId: string, keyName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Revoke Platform API Key',
      description: `Are you sure you want to permanently revoke API key "${keyName}"? All external applications, CRM syncs, and webhooks using this key will immediately fail with 401 Unauthorized.`,
      confirmLabel: 'Permanently Revoke Key',
      confirmVariant: 'danger',
      details: [
        { label: 'API Key Name', value: keyName },
        { label: 'Key Identifier', value: keyId },
        { label: 'Immediate Impact', value: 'Instant authentication invalidation', isDanger: true },
      ],
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          await fetchAPI(`/api/admin/api-keys/${keyId}`, { method: 'DELETE' });
          addToast({
            type: 'info',
            title: 'API Key Revoked',
            description: `API Key "${keyName}" has been permanently purged.`,
          });
          loadData();
        } catch (err: any) {
          addToast({ type: 'error', title: 'Revoke Failed', description: err.message || 'Could not revoke API key.' });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="space-y-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5 shrink-0">
        {/* ROW 1: Heading on Left + Badges on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-2xs shrink-0">
              <ShieldAlert className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap leading-none">
              Super Admin Sovereign Control Portal
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Badge variant="emerald" className="text-xs shadow-2xs whitespace-nowrap">
              Sovereign Root Controller
            </Badge>
          </div>
        </div>

        {/* ROW 2: Description on Left + Action Buttons on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Global governance of platform users, multi-gateway plugins, subscription plans, bank wire approvals, and telephony clusters.
          </p>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isRefreshing}
              className="h-7.5 text-xs font-semibold px-2.5 shadow-2xs"
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Sync Platform
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-7.5 text-xs font-semibold px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Provision User
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold">
            <span>Total Users</span>
            <Users className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-zinc-900 dark:text-white">
              {metrics?.total_users ?? users.length}
            </span>
            <span className="text-[11px] text-emerald-500 font-semibold">
              {metrics?.active_users ?? users.filter((u) => u.is_active).length} Active
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold">
            <span>Organizations</span>
            <Building className="h-3.5 w-3.5 text-teal-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-zinc-900 dark:text-white">
              {metrics?.total_organizations ?? organizations.length}
            </span>
            <span className="text-[11px] text-teal-500 font-semibold">Isolated</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold">
            <span>AI Voice Agents</span>
            <Headphones className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-zinc-900 dark:text-white">
              {metrics?.total_agents ?? 0}
            </span>
            <span className="text-[11px] text-blue-500 font-semibold">Provisioned</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold">
            <span>Active Gateways</span>
            <Globe className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-zinc-900 dark:text-white">
              {adminGateways.filter((g) => g.is_enabled).length} / {adminGateways.length || 6}
            </span>
            <span className="text-[11px] text-purple-500 font-semibold">Online</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold">
            <span>SIP Trunk Health</span>
            <Radio className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-500">
              {metrics?.telephony_health ?? '99.98%'}
            </span>
            <span className="text-[11px] text-zinc-400 font-semibold">Live</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold">
            <span>Pending Wires</span>
            <DollarSign className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-amber-500">
              {globalOfflinePendingWireCount}
            </span>
            <span className="text-[11px] text-zinc-400 font-semibold">Review</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar - Single Sleek Compact Row with Zero Visible Scrollbar */}
      <div className="w-full p-1 rounded-lg bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div
          className="no-scrollbar flex items-center gap-1 overflow-x-auto w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>User Management</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${activeTab === 'users' ? 'bg-white/25 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gateways')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'gateways'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span>Payment Plugins Hub</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${activeTab === 'gateways' ? 'bg-white/25 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
              {adminGateways.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'plans'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span>Plan Master</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${activeTab === 'plans' ? 'bg-white/25 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
              {adminPlans.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer relative shrink-0 whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5 shrink-0" />
            <span>Revenue & Wires</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${activeTab === 'transactions' ? 'bg-white/25 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
              {adminTransactions.length}
            </span>
            {globalOfflinePendingWireCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-zinc-950 rounded text-[10px] font-black">
                {globalOfflinePendingWireCount} Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'coupons'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <Tag className="h-3.5 w-3.5 shrink-0" />
            <span>Promo Coupons</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${activeTab === 'coupons' ? 'bg-white/25 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
              {adminCoupons.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tenant_overrides')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'tenant_overrides'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
            <span>Tenant Overrides</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${activeTab === 'tenant_overrides' ? 'bg-white/25 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
              {adminUsersBilling.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('organizations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'organizations'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <Building className="h-3.5 w-3.5 shrink-0" />
            <span>Tenants</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${activeTab === 'organizations' ? 'bg-white/25 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
              {organizations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'activities'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <Activity className="h-3.5 w-3.5 shrink-0" />
            <span>Audit Ledger</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${activeTab === 'activities' ? 'bg-white/25 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
              {activities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('infrastructure')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'infrastructure'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <Server className="h-3.5 w-3.5 shrink-0" />
            <span>Infrastructure</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${activeTab === 'infrastructure' ? 'bg-white/25 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
              6
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <Radio className="h-3.5 w-3.5 shrink-0" />
            <span>Broadcast Alerts</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${activeTab === 'notifications' ? 'bg-white/25 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
              Live
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api_keys')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'api_keys'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <Key className="h-3.5 w-3.5 shrink-0" />
            <span>API Keys Registry</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${activeTab === 'api_keys' ? 'bg-white/25 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
              {adminApiKeys.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS LIST & MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <div className="relative w-full sm:w-72">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search user, email or workspace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8.5 pl-8.5 pr-3 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <CustomSelect
                value={roleFilter}
                onChange={handleRoleFilterChange}
                options={[
                  { value: 'all', label: `All Roles (${userRoleCounts.all})` },
                  { value: 'super_admin', label: `Super Admin (${userRoleCounts.super_admin})` },
                  { value: 'user', label: `User / Tenant (${userRoleCounts.user})` },
                ]}
                className="w-44"
                size="sm"
              />

              <CustomSelect
                value={statusFilter}
                onChange={handleUserStatusFilterChange}
                options={[
                  { value: 'all', label: `All Status (${userStatusCounts.all})` },
                  { value: 'active', label: `Active (${userStatusCounts.active})` },
                  { value: 'inactive', label: `Suspended (${userStatusCounts.inactive})` },
                ]}
                className="w-40"
                size="sm"
              />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th className="px-3.5 py-2.5">User & Identity</th>
                    <th className="px-3.5 py-2.5">Assigned Workspace</th>
                    <th className="px-3.5 py-2.5">Role</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5">Credentials</th>
                    <th className="px-3.5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No platform users found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.id === currentAuthUser?.id || u.email === currentAuthUser?.email;
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={u.full_name || u.email} src={u.avatar_url} size="sm" />
                              <div className="min-w-0">
                                <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 text-xs">
                                  <span className="truncate">{u.full_name || 'User'}</span>
                                  {isSelf && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold shrink-0">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-3.5 py-2.5">
                            <div className="min-w-0">
                              <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate" title={u.organization_name || 'Personal Workspace'}>
                                {u.organization_name || 'Personal Workspace'}
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono truncate">
                                {u.organization_id ? `ID: ${u.organization_id.slice(0, 8)}...` : 'Single-Tenant'}
                              </div>
                            </div>
                          </td>

                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase whitespace-nowrap inline-flex items-center gap-1 ${
                                u.role === 'super_admin'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              {u.role === 'super_admin' ? 'Super Admin' : u.role}
                            </span>
                          </td>

                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              disabled={isSelf}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap disabled:cursor-not-allowed ${
                                u.is_active
                                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <span>{u.is_active ? 'Active' : 'Suspended'}</span>
                            </button>
                          </td>

                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                              <Lock className="h-3 w-3 shrink-0 text-zinc-400" />
                              {u.plain_password ? (
                                <span className="font-semibold text-amber-500 whitespace-nowrap">{u.plain_password}</span>
                              ) : (
                                <span className="text-zinc-400 font-mono text-[11px] whitespace-nowrap">[SSO Federated]</span>
                              )}
                            </div>
                          </td>

                          <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (targetAccount?.userEmail === u.email) {
                                      resetToSovereignWorkspace();
                                      addToast({
                                        type: 'info',
                                        title: 'Exited Inspection',
                                        description: 'Returned to Super Admin sovereign workspace.',
                                      });
                                    } else {
                                      targetWorkspace({
                                        orgId: u.organization_id || '',
                                        userEmail: u.email,
                                        userName: u.full_name,
                                        orgName: u.organization_name,
                                      });
                                      addToast({
                                        type: 'success',
                                        title: 'Workspace Target Activated',
                                        description: `Now inspecting ${u.full_name} (${u.email}) across all platform tabs.`,
                                      });
                                    }
                                  }}
                                  title={
                                    targetAccount?.userEmail === u.email
                                      ? 'Active Target (Click to Exit)'
                                      : 'Inspect this account across all tabs'
                                  }
                                  className={`px-2 py-1 rounded-lg text-xs font-bold shrink-0 whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                                    targetAccount?.userEmail === u.email
                                      ? 'bg-amber-500 text-zinc-950 shadow-xs'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  }`}
                                >
                                  <Target className="h-3.5 w-3.5 shrink-0" />
                                  <span>{targetAccount?.userEmail === u.email ? 'Target Active' : 'Inspect'}</span>
                                </button>
                              )}

                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const existingBill = adminUsersBilling.find(
                                      (b) => b.id === u.id || b.email.toLowerCase() === u.email.toLowerCase()
                                    );
                                    const billingObj: PlatformUserBilling = existingBill || {
                                      id: u.id,
                                      email: u.email,
                                      full_name: u.full_name || u.email,
                                      role: u.role,
                                      avatar_url: u.avatar_url,
                                      custom_plan_name: 'Starter Trial',
                                      allocated_minutes: 500,
                                      used_minutes: 0,
                                      allocated_concurrency: 2,
                                      active_calls: 0,
                                      allocated_rag_storage_mb: 200,
                                      discount_percent: 0,
                                      is_custom_override: false,
                                      notes: '',
                                    };
                                    setSelectedTenantForOverride(billingObj);
                                    setOverridePlanName(billingObj.custom_plan_name || 'Starter Trial');
                                    setOverrideMinutes(billingObj.allocated_minutes || 500);
                                    setOverrideConcurrency(billingObj.allocated_concurrency || 2);
                                    setOverrideRagStorage(billingObj.allocated_rag_storage_mb || 200);
                                    setOverrideDiscount(billingObj.discount_percent || 0);
                                    setOverrideWalletTopup(0);
                                    setOverrideNotes(billingObj.notes || '');
                                    setActiveTab('tenant_overrides');
                                  }}
                                  title="Adjust Quota, Plan & Wallet"
                                  className="p-1 rounded-lg text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer shrink-0"
                                >
                                  <SlidersHorizontal className="h-3.5 w-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(u)}
                                title="Edit User Profile & Role"
                                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setIsResetPasswordModalOpen(true);
                                }}
                                title="Override User Password"
                                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                              >
                                <Key className="h-3.5 w-3.5" />
                              </button>

                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  title="Permanently Delete User"
                                  className="p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT PLUGINS HUB */}
      {activeTab === 'gateways' && (
        <WordPressPaymentPluginsHub
          gateways={adminGateways}
          onToggleStatus={handleToggleGatewayStatus}
          onTestConnection={handleTestGatewayConnection}
          onSaveCredentials={handleSaveGatewayCredentials}
          testingGatewayId={testingGatewayId}
          testedGatewayResults={testedGatewayResults}
        />
      )}

      {/* TAB 3: PLAN MASTER SOVEREIGN STUDIO & HTML/CSS DESIGNER */}
      {activeTab === 'plans' && (
        <PlanMasterStudio
          plans={adminPlans as any}
          onSavePlan={handleSavePlanAdmin}
          onDeletePlan={handleDeletePlanAdmin}
          onRefresh={loadData}
          isLoading={isRefreshing}
        />
      )}

      {/* TAB 4: PLATFORM REVENUE & BANK WIRES */}
      {activeTab === 'transactions' && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <div className="relative w-full sm:w-72">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search transaction ID, email or UTR..."
                value={txSearchQuery}
                onChange={(e) => setTxSearchQuery(e.target.value)}
                className="w-full h-8.5 pl-8.5 pr-3 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <CustomSelect
                value={txGatewayFilter}
                onChange={handleGatewayFilterChange}
                options={gatewayFilterOptions}
                className="w-56"
                size="sm"
              />

              <CustomSelect
                value={txStatusFilter}
                onChange={handleStatusFilterChange}
                options={[
                  { value: 'all', label: `All Status (${txStatusCounts.all} Txs)` },
                  { value: 'offline_pending', label: `Pending Wire Review (${txStatusCounts.offline_pending || 0})` },
                  { value: 'completed', label: `Completed / Paid (${txStatusCounts.completed || 0})` },
                  { value: 'pending', label: `Pending Checkout (${txStatusCounts.pending || 0})` },
                  { value: 'failed', label: `Failed (${txStatusCounts.failed || 0})` },
                  ...(txStatusCounts.refunded > 0
                    ? [{ value: 'refunded', label: `Refunded (${txStatusCounts.refunded})` }]
                    : []),
                ]}
                className="w-56"
                size="sm"
              />

              {staleTransactionsCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={promptPurgeStaleTransactions}
                  leftIcon={<Trash2 className="h-3.5 w-3.5 text-rose-500" />}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 py-1 px-2.5 h-8.5 cursor-pointer shrink-0 whitespace-nowrap"
                  title="Purge all abandoned checkout drafts and failed transactions from database"
                >
                  Purge Stale Drafts ({staleTransactionsCount})
                </Button>
              )}
            </div>
          </div>

          {/* BULK MULTI-SELECT ACTION TOOLBAR */}
          {selectedTxIds.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl shadow-2xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-200 dark:bg-rose-900 text-rose-700 dark:text-rose-200 font-mono text-[11px] font-black">
                  {selectedTxIds.length}
                </span>
                <span>
                  {selectedTxIds.length} transaction{selectedTxIds.length > 1 ? 's' : ''} selected manually
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedTxIds([])}
                  className="text-xs h-7.5 py-1 px-3 cursor-pointer text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={promptBulkDeleteTransactions}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  className="text-xs font-bold h-7.5 py-1 px-3.5 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
                >
                  Delete Selected ({selectedTxIds.length})
                </Button>
              </div>
            </div>
          )}

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
            <div className="overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[11px] border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-3.5 py-2.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllTxSelected}
                        onChange={handleToggleSelectAllTx}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4 align-middle"
                        title={isAllTxSelected ? 'Deselect All' : 'Select All Visible Transactions'}
                      />
                    </th>
                    <th className="px-3.5 py-2.5">Customer & Transaction</th>
                    <th className="px-3.5 py-2.5">Plan Tier</th>
                    <th className="px-3.5 py-2.5">Gateway</th>
                    <th className="px-3.5 py-2.5">Amount</th>
                    <th className="px-3.5 py-2.5">UTR / Reference</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5 text-right">Approval Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        No transactions recorded matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const avatarSrc =
                        tx.avatar_url ||
                        (tx.user_email && userAvatarByEmailOrId[tx.user_email.toLowerCase()]) ||
                        (tx.billing_email && userAvatarByEmailOrId[tx.billing_email.toLowerCase()]) ||
                        (tx.user_id && userAvatarByEmailOrId[tx.user_id]);

                      const isSelected = selectedTxIds.includes(tx.id);

                      return (
                        <tr
                          key={tx.id}
                          className={`transition-colors ${
                            isSelected
                              ? 'bg-rose-50/60 dark:bg-rose-950/20'
                              : 'hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40'
                          }`}
                        >
                          <td className="px-3.5 py-2.5 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectTx(tx.id)}
                              className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4 align-middle"
                            />
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={tx.billing_name || tx.user_email} src={avatarSrc} size="sm" />
                              <div>
                                <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{tx.billing_name || 'Customer'}</div>
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-1.5">
                                  <span>{tx.user_email || tx.billing_email || 'billing@tenant.com'}</span>
                                  <span>•</span>
                                  <span className="text-zinc-400">ID: {tx.id.slice(0, 8)}...</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        <td className="px-3.5 py-2.5">
                          {tx.plan_id === 'wallet_topup' || tx.plan_id === 't_topup' || tx.details_json?.mode === 'wallet_topup' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80">
                              💳 Add Funds Top-Up
                            </span>
                          ) : (
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                              {tx.details_json?.plan_name || tx.plan_id || 'Subscription'}
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 uppercase">
                            {tx.gateway === 'promo_100_free' ? '🎁 100% PROMO' : getGatewayDisplayName(tx.gateway)}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          {Boolean(tx.is_free_promo || tx.details_json?.is_free_checkout || tx.amount_local === 0) ? (
                            <div className="space-y-0.5 font-mono">
                              <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                {tx.currency === 'INR' ? '₹0.00' : '$0.00'} (100% Free)
                              </div>
                              <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                                +${Number(tx.details_json?.credited_amount_usd || tx.details_json?.topup_amount_usd || tx.amount_usd || 0).toFixed(2)} USD Credit
                              </div>
                            </div>
                          ) : (
                            <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                              {tx.currency === 'INR' ? '₹' : tx.currency === 'EUR' ? '€' : tx.currency === 'GBP' ? '£' : '$'}
                              {Number(tx.amount_local || tx.amount_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5">
                          {tx.bank_reference_utr ? (
                            <span className="font-mono text-xs font-bold text-amber-500">{tx.bank_reference_utr}</span>
                          ) : tx.gateway_payment_id ? (
                            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{tx.gateway_payment_id}</span>
                          ) : tx.details_json?.coupon_code ? (
                            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">Coupon: {tx.details_json.coupon_code}</span>
                          ) : normalizeGatewayKey(tx.gateway) === 'bank_wire' ? (
                            <span className="font-mono text-xs font-bold text-amber-500">PENDING_UTR</span>
                          ) : (
                            <span className="font-mono text-xs text-zinc-400">AUTO_PROCESSED</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase inline-flex items-center gap-1 ${
                              normalizeStatusKey(tx.status) === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : normalizeStatusKey(tx.status) === 'offline_pending'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                                : normalizeStatusKey(tx.status) === 'pending'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {normalizeStatusKey(tx.status) === 'offline_pending'
                              ? 'OFFLINE_PENDING'
                              : normalizeStatusKey(tx.status) === 'completed'
                              ? 'COMPLETED'
                              : normalizeStatusKey(tx.status) === 'pending'
                              ? 'PENDING_CHECKOUT'
                              : 'FAILED'}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          {normalizeStatusKey(tx.status) === 'offline_pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleApproveOfflineTransaction(tx.id)}
                                leftIcon={<Check className="h-3.5 w-3.5" />}
                                className="text-xs font-bold py-1 px-2.5 cursor-pointer"
                              >
                                Approve Wire
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => promptRejectOfflineTransaction(tx.id, tx.billing_name || tx.user_email, `${tx.currency || 'USD'} ${tx.amount_local || tx.amount_usd}`)}
                                leftIcon={<XCircle className="h-3.5 w-3.5 text-rose-500" />}
                                className="text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 py-1 px-2 cursor-pointer"
                                title="Reject Wire Submission"
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => promptDeleteTransaction(tx)}
                                className="p-1 h-7 w-7 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                                title="Delete wire submission record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : normalizeStatusKey(tx.status) === 'completed' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                                <Check className="h-3.5 w-3.5 text-emerald-500" /> Settled
                              </span>
                              {(tx.plan_id === 'wallet_topup' || tx.plan_id?.includes('Top-Up') || tx.details_json?.mode === 'wallet_topup') ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => promptCancelTopup(tx)}
                                  leftIcon={<RotateCcw className="h-3 w-3 text-rose-500" />}
                                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 py-0.5 px-2 h-7 cursor-pointer"
                                  title="Cancel Top-Up & Deduct Balance"
                                >
                                  Revert Top-Up
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => promptCancelSubscription(tx.user_id || tx.organization_id || tx.user_email, tx.billing_name || tx.user_email, tx.user_email || tx.billing_email, tx.plan_id)}
                                  leftIcon={<XCircle className="h-3 w-3 text-rose-500" />}
                                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 py-0.5 px-2 h-7 cursor-pointer"
                                  title="Cancel Subscription Plan"
                                >
                                  Cancel Plan
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => promptDeleteTransaction(tx)}
                                className="p-1 h-7 w-7 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                                title="Delete transaction record from database"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : normalizeStatusKey(tx.status) === 'refunded' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                Reverted / Canceled
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => promptDeleteTransaction(tx)}
                                className="p-1 h-7 w-7 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                                title="Delete canceled record from database"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[11px] text-zinc-400 font-mono">
                                {normalizeStatusKey(tx.status) === 'failed' ? 'Failed' : 'Pending Payment'}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => promptDeleteTransaction(tx)}
                                className="p-1 h-7 w-7 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                                title="Delete stale checkout record from database"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PROMO COUPONS ENGINE */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Tag className="h-4.5 w-4.5 text-emerald-500" />
                Promo Coupons & Discount Codes Engine
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Create promotional discount coupons for user checkouts with usage quotas.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateCouponInlineOpen(!isCreateCouponInlineOpen)}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              className="text-xs font-bold"
            >
              {isCreateCouponInlineOpen ? 'Close Form' : 'Create Promo Code'}
            </Button>
          </div>

          {/* INLINE CREATE COUPON FORM */}
          {isCreateCouponInlineOpen && (
            <Card className="border-emerald-500/50 bg-emerald-50/10 shadow-md rounded-xl">
              <CardContent className="p-4 sm:p-5">
                <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-3.5 text-xs items-end">
                  <div className="lg:col-span-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Coupon Code</label>
                    <Input
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. TOPUP100"
                      required
                      className="h-8.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Discount (%)</label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={newDiscountPercent}
                      onChange={(e) => setNewDiscountPercent(Number(e.target.value))}
                      required
                      className="h-8.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Max Uses</label>
                    <Input
                      type="number"
                      min={1}
                      value={newCouponMaxUses}
                      onChange={(e) => setNewCouponMaxUses(Number(e.target.value))}
                      required
                      className="h-8.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Applies To / Scope</label>
                    <CustomSelect
                      value={newCouponScope}
                      onChange={(val) => setNewCouponScope(val as any)}
                      options={[
                        {
                          value: 'all',
                          label: 'Universal (All Checkouts)',
                          icon: <Globe className="h-3.5 w-3.5 text-blue-500" />,
                          badge: 'All Orders',
                        },
                        {
                          value: 'wallet_topup',
                          label: 'Add Funds / Top-Up Only',
                          icon: <Tag className="h-3.5 w-3.5 text-teal-500" />,
                          badge: 'Top-Up Only',
                        },
                        {
                          value: 'subscription',
                          label: 'Subscriptions Only',
                          icon: <Package className="h-3.5 w-3.5 text-indigo-500" />,
                          badge: 'Plans Only',
                        },
                      ]}
                      className="w-full"
                      size="sm"
                    />
                  </div>
                  <div className="lg:col-span-2 sm:col-span-2 md:col-span-1">
                    <Button type="submit" variant="primary" size="sm" className="w-full font-bold h-8.5 text-xs">
                      Publish Promo Code
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Scope Filter Sub-Tabs with Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCouponScopeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                couponScopeFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700/80'
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <span>All Coupons</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                couponScopeFilter === 'all' ? 'bg-emerald-800 text-emerald-100' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}>
                {couponScopeCounts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCouponScopeFilter('wallet_topup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                couponScopeFilter === 'wallet_topup'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 hover:bg-teal-100 dark:hover:bg-teal-900/60'
              }`}
            >
              <span>💳 Add Funds Only</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                couponScopeFilter === 'wallet_topup' ? 'bg-teal-800 text-teal-100' : 'bg-teal-200/70 dark:bg-teal-800/70 text-teal-800 dark:text-teal-200'
              }`}>
                {couponScopeCounts.wallet_topup}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCouponScopeFilter('subscription')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                couponScopeFilter === 'subscription'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
              }`}
            >
              <span>📦 Subscriptions Only</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                couponScopeFilter === 'subscription' ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-200/70 dark:bg-indigo-800/70 text-indigo-800 dark:text-indigo-200'
              }`}>
                {couponScopeCounts.subscription}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCouponScopeFilter('universal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                couponScopeFilter === 'universal'
                  ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700/80'
              }`}
            >
              <span>🌐 Universal</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                couponScopeFilter === 'universal' ? 'bg-zinc-600 dark:bg-zinc-400 text-zinc-100 dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}>
                {couponScopeCounts.universal}
              </span>
            </button>
          </div>

          {/* Coupons Table */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
            <div className="overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[11px] border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-3.5 py-2.5">Coupon Code</th>
                    <th className="px-3.5 py-2.5">Discount</th>
                    <th className="px-3.5 py-2.5">Applies To / Scope</th>
                    <th className="px-3.5 py-2.5">Redemption Uses</th>
                    <th className="px-3.5 py-2.5">State</th>
                    <th className="px-3.5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 text-xs">
                        {adminCoupons.length === 0
                          ? 'No promotional coupons created yet.'
                          : 'No promotional coupons match the selected scope filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                          {c.code}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-zinc-900 dark:text-zinc-100">{c.discount_percent}% OFF</td>
                        <td className="px-3.5 py-2.5">
                          {c.details_json?.applicable_to === 'wallet_topup' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                              💳 Add Funds / Top-Up Only
                            </span>
                          ) : c.details_json?.applicable_to === 'subscription' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              📦 Subscriptions Only
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                              🌐 Universal (All Checkouts)
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-zinc-500 dark:text-zinc-400 font-mono">
                          {c.current_uses} / {c.max_uses} used
                        </td>
                        <td className="px-3.5 py-2.5">
                          <Badge variant="success" size="sm" className="font-semibold text-[11px]">Active</Badge>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-rose-500 font-bold transition-colors cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: TENANT OVERRIDES */}
      {activeTab === 'tenant_overrides' && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <div className="relative w-full sm:w-72">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tenant by email, name or plan..."
                value={tenantSearchQuery}
                onChange={(e) => setTenantSearchQuery(e.target.value)}
                className="w-full h-8.5 pl-8.5 pr-3 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* INLINE TENANT OVERRIDE FORM */}
          {selectedTenantForOverride && (
            <Card className="border-emerald-500/60 bg-emerald-50/10 shadow-md rounded-xl">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>
                    Grant Capacity Override: {selectedTenantForOverride.full_name} ({selectedTenantForOverride.email})
                  </span>
                  <button onClick={() => setSelectedTenantForOverride(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Custom Plan Name</label>
                    <Input value={overridePlanName} onChange={(e) => setOverridePlanName(e.target.value)} className="h-8.5 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Voice Minutes</label>
                    <Input type="number" value={overrideMinutes} onChange={(e) => setOverrideMinutes(Number(e.target.value))} className="h-8.5 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Concurrency (Trunks)</label>
                    <Input type="number" value={overrideConcurrency} onChange={(e) => setOverrideConcurrency(Number(e.target.value))} className="h-8.5 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">RAG Storage (MB)</label>
                    <Input type="number" value={overrideRagStorage} onChange={(e) => setOverrideRagStorage(Number(e.target.value))} className="h-8.5 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">VIP Discount (%)</label>
                    <Input type="number" min={0} max={100} value={overrideDiscount} onChange={(e) => setOverrideDiscount(Number(e.target.value))} className="h-8.5 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Wallet Top-Up ($)</label>
                    <Input type="number" min={0} step="5" value={overrideWalletTopup} onChange={(e) => setOverrideWalletTopup(Number(e.target.value))} placeholder="0.00" className="h-8.5 text-xs font-bold text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="sm:col-span-3 lg:col-span-6">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Administrative Notes</label>
                    <Input value={overrideNotes} onChange={(e) => setOverrideNotes(e.target.value)} placeholder="Reason for custom allocation, VIP quota grant, or manual wallet credit..." className="h-8.5 text-xs" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <Button variant="outline" size="sm" onClick={() => setSelectedTenantForOverride(null)} className="text-xs">
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleApplyTenantOverride} disabled={isApplyingOverride} className="text-xs">
                    {isApplyingOverride ? 'Applying...' : 'Apply Override & Credit'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tenants Overrides Table */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
            <div className="overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[11px] border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-3.5 py-2.5">Client User</th>
                    <th className="px-3.5 py-2.5">Current Plan</th>
                    <th className="px-3.5 py-2.5">Minutes Allocated</th>
                    <th className="px-3.5 py-2.5">Concurrency</th>
                    <th className="px-3.5 py-2.5">RAG Storage</th>
                    <th className="px-3.5 py-2.5">Override State</th>
                    <th className="px-3.5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredTenantBilling.map((u) => {
                    const avatarSrc =
                      u.avatar_url ||
                      (u.email && userAvatarByEmailOrId[u.email.toLowerCase()]) ||
                      (u.id && userAvatarByEmailOrId[u.id]);

                    return (
                      <tr key={u.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={u.full_name || u.email} src={avatarSrc} size="sm" />
                            <div>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{u.full_name}</span>
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono block">({u.email})</span>
                            </div>
                          </div>
                        </td>
                      <td className="px-3.5 py-2.5 font-semibold text-zinc-800 dark:text-zinc-200">{u.custom_plan_name}</td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {u.used_minutes.toLocaleString()} / {u.allocated_minutes.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">{u.allocated_concurrency} Trunks</td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {u.allocated_rag_storage_mb || 200} MB
                      </td>
                      <td className="px-3.5 py-2.5">
                        {u.is_custom_override ? (
                          <Badge variant="warning" size="sm" className="bg-amber-400 text-zinc-950 font-bold text-[11px]">
                            Custom Limit
                          </Badge>
                        ) : (
                          <Badge variant="outline" size="sm" className="text-[11px]">Standard</Badge>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedTenantForOverride(u);
                              setOverridePlanName(u.custom_plan_name);
                              setOverrideMinutes(u.allocated_minutes);
                              setOverrideConcurrency(u.allocated_concurrency);
                              setOverrideRagStorage(u.allocated_rag_storage_mb || 200);
                              setOverrideDiscount(u.discount_percent);
                              setOverrideWalletTopup(0);
                              setOverrideNotes(u.notes);
                            }}
                            leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                            className="text-xs font-bold whitespace-nowrap py-1 px-2.5"
                          >
                            Adjust Limit
                          </Button>
                          {u.custom_plan_name !== 'Starter Pilot' && u.custom_plan_name !== 'Starter Trial' && !u.custom_plan_name.includes('(Canceled)') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => promptCancelSubscription(u.id, u.full_name || u.email, u.email, u.custom_plan_name)}
                              leftIcon={<XCircle className="h-3.5 w-3.5 text-rose-500" />}
                              className="text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 whitespace-nowrap py-1 px-2 cursor-pointer"
                              title="Cancel & Revoke Plan"
                            >
                              Revoke Plan
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: TENANTS & WORKSPACES */}
      {activeTab === 'organizations' && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <div className="relative w-full sm:w-72">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search workspace name, slug or ID..."
                value={orgSearchQuery}
                onChange={(e) => setOrgSearchQuery(e.target.value)}
                className="w-full h-8.5 pl-8.5 pr-3 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
            {filteredOrganizations.map((org) => (
              <div
                key={org.id}
                className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{org.name}</h3>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">Slug: {org.slug}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase bg-teal-500/10 text-teal-400 border border-teal-500/30">
                    {org.plan}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/40 text-center">
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white">{org.members_count}</div>
                    <div className="text-[10px] text-zinc-500">Members</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white">{org.agents_count}</div>
                    <div className="text-[10px] text-zinc-500">AI Agents</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white">{org.phone_numbers_count}</div>
                    <div className="text-[10px] text-zinc-500">Numbers</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <div className="text-[11px] text-zinc-400 font-mono truncate max-w-[130px]">
                    {org.id.slice(0, 13)}...
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (targetAccount?.orgId === org.id) {
                        resetToSovereignWorkspace();
                        addToast({
                          type: 'info',
                          title: 'Exited Inspection',
                          description: 'Returned to Super Admin sovereign workspace.',
                        });
                      } else {
                        targetWorkspace({
                          orgId: org.id,
                          userEmail: org.billing_email || `${org.slug}@workspace.local`,
                          userName: org.name,
                          orgName: org.name,
                        });
                        addToast({
                          type: 'success',
                          title: 'Tenant Workspace Targeted',
                          description: `Now inspecting tenant ${org.name} across all platform tabs.`,
                        });
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      targetAccount?.orgId === org.id
                        ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-bold'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    <Target className="h-3.5 w-3.5" />
                    {targetAccount?.orgId === org.id ? 'Targeting' : 'Inspect Tenant'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: AUDIT & PLATFORM ACTIVITY */}
      {activeTab === 'activities' && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <div className="relative w-full sm:w-72">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search audit action, resource, email or IP..."
                value={activitySearchQuery}
                onChange={(e) => setActivitySearchQuery(e.target.value)}
                className="w-full h-8.5 pl-8.5 pr-3 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-emerald-500" />
              Global Platform Security & Execution Ledger
            </h3>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredActivities.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">No activity logs recorded matching filters.</div>
              ) : (
                filteredActivities.map((a) => (
                  <div key={a.id} className="py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-1.5 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{a.action}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {a.resource}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Initiated by <span className="text-emerald-500 font-medium">{a.user_email}</span> • IP: {a.ip_address || '127.0.0.1'}
                      </div>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono shrink-0">
                      {a.created_at ? new Date(a.created_at).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: INFRASTRUCTURE & TELEPHONY */}
      {activeTab === 'infrastructure' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <Radio className="h-3.5 w-3.5 text-emerald-500" />
              Telephony & Gateway Status
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Twilio High-Throughput SIP Trunk</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">CONNECTED</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Android GSM Voice Companion Bridge</span>
                <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-400 font-bold text-[11px]">OPERATIONAL</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Opus 48kHz Audio Streaming Buffer</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">0 PACKET LOSS</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              AI Voice Pipeline Latencies
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Deepgram Nova-2 Streaming STT</span>
                <span className="text-emerald-400 font-mono font-bold text-[11px]">120 ms</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Gemini 2.5 Flash / GPT-4o Mini LLM</span>
                <span className="text-emerald-400 font-mono font-bold text-[11px]">84 ms</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">ElevenLabs Turbo v2.5 TTS Synthesis</span>
                <span className="text-emerald-400 font-mono font-bold text-[11px]">180 ms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: BROADCAST & PLATFORM ALERTS */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Radio className="h-4.5 w-4.5 text-emerald-500" />
                  Broadcast Dispatch Console
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Deliver urgent system announcements, security updates, and notices instantly to all connected users.
                </p>
              </div>

              <form onSubmit={handleAdminBroadcast} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Target Audience
                    </label>
                    <CustomSelect
                      value={broadcastForm.target_type}
                      onChange={(val) =>
                        setBroadcastForm((prev) => ({
                          ...prev,
                          target_type: val as any,
                        }))
                      }
                      options={[
                        { value: 'all', label: 'All Platform Users (Global Broadcast)' },
                        { value: 'role', label: 'Target Role (Operators / Admins)' },
                        { value: 'user', label: 'Specific User ID' },
                      ]}
                      size="sm"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Alert Category
                    </label>
                    <CustomSelect
                      value={broadcastForm.category}
                      onChange={(val) =>
                        setBroadcastForm((prev) => ({
                          ...prev,
                          category: val as any,
                        }))
                      }
                      options={[
                        { value: 'system', label: 'System Core' },
                        { value: 'calls', label: 'AI Calls & Voice Pipeline' },
                        { value: 'telephony', label: 'Telephony & GSM Gateway' },
                        { value: 'billing', label: 'Billing & Subscriptions' },
                        { value: 'security', label: 'Security & Access Control' },
                      ]}
                      size="sm"
                      className="w-full"
                    />
                  </div>
                </div>

                {broadcastForm.target_type !== 'all' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      {broadcastForm.target_type === 'role' ? 'Role Name (e.g. operator, admin)' : 'Target User ID'}
                    </label>
                    <input
                      type="text"
                      className="w-full h-8.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                      placeholder={broadcastForm.target_type === 'role' ? 'operator' : 'usr_9812903'}
                      value={broadcastForm.target_id}
                      onChange={(e) =>
                        setBroadcastForm((prev) => ({
                          ...prev,
                          target_id: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Severity Level
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['info', 'success', 'warning', 'error'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setBroadcastForm((prev) => ({ ...prev, type: t }))}
                          className={`py-1 rounded-lg text-xs font-semibold capitalize transition-all border cursor-pointer ${
                            broadcastForm.type === t
                              ? t === 'info'
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500'
                                : t === 'success'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                                : t === 'warning'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                                : 'bg-red-500/20 text-red-400 border-red-500'
                              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Announcement Title
                    </label>
                    <input
                      type="text"
                      className="w-full h-8.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                      placeholder="e.g. Scheduled SIP Maintenance at 02:00 UTC"
                      value={broadcastForm.title}
                      onChange={(e) =>
                        setBroadcastForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Announcement Message
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                    placeholder="Provide detailed instructions or notice..."
                    value={broadcastForm.message}
                    onChange={(e) =>
                      setBroadcastForm((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isBroadcasting}
                    leftIcon={<Radio className="h-3.5 w-3.5" />}
                    className="h-8.5 text-xs font-bold"
                  >
                    {isBroadcasting ? 'Broadcasting...' : 'Transmit Alert'}
                  </Button>
                </div>
              </form>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Notification Preview
              </h4>
              <p className="text-xs text-zinc-500">
                This is how the alert will appear to target users.
              </p>

              <div
                className={`p-3 rounded-lg border space-y-1.5 text-xs ${
                  broadcastForm.type === 'error'
                    ? 'bg-red-500/10 border-red-500/30'
                    : broadcastForm.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : broadcastForm.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white">
                    {broadcastForm.title || 'Notification Headline'}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 uppercase">
                    {broadcastForm.category}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {broadcastForm.message || 'Notification description text will appear here.'}
                </p>
                <div className="text-[11px] text-zinc-400 font-mono pt-0.5">
                  Target: {broadcastForm.target_type.toUpperCase()} • Super Admin Broadcast
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 12: API KEYS & DEVELOPER GOVERNANCE REGISTRY */}
      {activeTab === 'api_keys' && (
        <div className="space-y-3.5">
          {/* Top Banner Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center justify-between text-zinc-500 text-[11px] font-semibold">
                <span>Total Keys</span>
                <Key className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-zinc-900 dark:text-white">{adminApiKeys.length}</span>
                <span className="text-[11px] text-zinc-400 font-semibold">Platform Total</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center justify-between text-zinc-500 text-[11px] font-semibold">
                <span>Active Keys</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-emerald-500">
                  {adminApiKeys.filter((k) => k.status === 'active' || (k.is_active && k.status !== 'disabled')).length}
                </span>
                <span className="text-[11px] text-zinc-400 font-semibold">Authorized</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center justify-between text-zinc-500 text-[11px] font-semibold">
                <span>Live Production</span>
                <Radio className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-blue-500">
                  {adminApiKeys.filter((k) => (k.environment || 'production') === 'production').length}
                </span>
                <span className="text-[11px] text-zinc-400 font-semibold">sk_live_</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center justify-between text-zinc-500 text-[11px] font-semibold">
                <span>Disabled / Suspended</span>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-amber-500">
                  {adminApiKeys.filter((k) => k.status === 'disabled' || k.status === 'suspended' || (!k.is_active && k.status !== 'revoked')).length}
                </span>
                <span className="text-[11px] text-zinc-400 font-semibold">Grounded</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <div className="relative w-full sm:w-72">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search key name, prefix, owner email or org..."
                value={apiKeySearchQuery}
                onChange={(e) => setApiKeySearchQuery(e.target.value)}
                className="w-full h-8.5 pl-8.5 pr-3 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <CustomSelect
                value={apiKeyEnvFilter}
                onChange={(val) => setApiKeyEnvFilter(val)}
                options={[
                  { value: 'all', label: 'All Environments' },
                  { value: 'production', label: 'Production (Live)' },
                  { value: 'development', label: 'Development (Test)' },
                ]}
                className="w-40"
                size="sm"
              />

              <CustomSelect
                value={apiKeyStatusFilter}
                onChange={(val) => setApiKeyStatusFilter(val)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'active', label: 'Active Only' },
                  { value: 'disabled', label: 'Disabled Only' },
                ]}
                className="w-36"
                size="sm"
              />

              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isRefreshing}
                className="h-8 text-xs font-semibold px-2.5 shadow-2xs"
                leftIcon={<RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-2.5 px-3">Key Name & Token</th>
                  <th className="py-2.5 px-3">Owner / Organization</th>
                  <th className="py-2.5 px-3">Plan Entitlements</th>
                  <th className="py-2.5 px-3">Environment</th>
                  <th className="py-2.5 px-3">Permissions</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last Used</th>
                  <th className="py-2.5 px-3 text-right">Sovereign Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {filteredApiKeys.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Key className="h-6 w-6 text-zinc-400" />
                        <span className="font-semibold">No API keys found</span>
                        <span className="text-[11px] text-zinc-400">Keys generated by tenants across the platform will appear here.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApiKeys.map((key) => {
                    const isActive = key.status === 'active' || (key.is_active && key.status !== 'disabled');
                    return (
                      <tr key={key.id} className="hover:bg-zinc-50/75 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              {key.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                                {key.token_prefix || key.key_prefix || 'sk_live_...'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(key.token_prefix || key.key_prefix || '');
                                  addToast({ type: 'success', title: 'Copied', description: 'Key prefix copied to clipboard.' });
                                }}
                                className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                title="Copy token prefix"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={key.owner_user_avatar || userAvatarByEmailOrId[key.owner_user_email?.toLowerCase() || ''] || userAvatarByEmailOrId[key.user_email?.toLowerCase() || ''] || userAvatarByEmailOrId[key.owner_user_id || ''] || userAvatarByEmailOrId[key.user_id || '']}
                              name={key.owner_user_name || key.user_full_name || key.owner_user_email || key.user_email || 'User'}
                              size="sm"
                              className="h-6 w-6 text-[10px] shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                                {key.owner_user_name || key.user_full_name || 'Autonomous Agent'}
                              </span>
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[140px]">
                                {key.owner_user_email || key.user_email || 'System Token'}
                              </span>
                              {key.organization_name && (
                                <span className="text-[9px] text-teal-600 dark:text-teal-400 font-medium truncate max-w-[140px]">
                                  🏢 {key.organization_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <Badge variant="zinc" className="text-[10px] px-1.5 py-0.2 w-fit">
                              {key.tenant_plan_name || 'Standard Tier'}
                            </Badge>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              ⚡ {key.rate_limit_per_min || 300} req/m • 📊 {((key.daily_quota || 25000) / 1000).toFixed(0)}k/d
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <Badge
                            variant={key.environment === 'production' ? 'emerald' : 'blue'}
                            className="text-[10px] capitalize px-1.5 py-0.2"
                          >
                            {key.environment === 'production' ? '● Live' : '○ Test'}
                          </Badge>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1 flex-wrap max-w-[130px]">
                            {Array.isArray(key.permissions) && key.permissions.length > 0 ? (
                              key.permissions.map((p, idx) => (
                                <span key={idx} className="font-mono text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1 rounded">
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="font-mono text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1 rounded">
                                {key.permissions || 'full'}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <Badge
                            variant={isActive ? 'emerald' : 'amber'}
                            className="text-[10px] capitalize px-1.5 py-0.2"
                          >
                            {isActive ? 'Active' : 'Disabled'}
                          </Badge>
                        </td>

                        <td className="py-2.5 px-3 font-mono text-[10px] text-zinc-500 whitespace-nowrap">
                          {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleAdminToggleKeyStatus(key.id, isActive ? 'active' : 'disabled')}
                              className={`h-6.5 text-[10px] px-2 font-bold cursor-pointer ${
                                isActive
                                  ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-amber-500/30'
                                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30'
                              }`}
                            >
                              {isActive ? 'Disable' : 'Enable'}
                            </Button>

                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => promptAdminRevokeKey(key.id, key.name)}
                              className="h-6.5 text-[10px] px-2 font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 border-red-500/30 cursor-pointer"
                              title="Permanently revoke key"
                            >
                              Revoke
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Provision New Platform User" maxWidth="md">
        <form onSubmit={handleCreateUser} className="space-y-4 text-sm">
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1.5">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={newUserForm.fullName}
              onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
              className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                placeholder="user@example.com"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1.5">Phone Number</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={newUserForm.phoneNumber}
                onChange={(e) => setNewUserForm({ ...newUserForm, phoneNumber: e.target.value })}
                className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1.5">Password *</label>
            <input
              type="text"
              required
              placeholder="Min 6 characters"
              value={newUserForm.password}
              onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1.5 text-xs">Role Authority</label>
              <CustomSelect
                value={newUserForm.role}
                onChange={(val) => setNewUserForm({ ...newUserForm, role: val })}
                options={[
                  { value: 'operator', label: 'Operator (Standard)' },
                  { value: 'admin', label: 'Administrator' },
                  { value: 'viewer', label: 'Viewer (Read-only)' },
                  { value: 'super_admin', label: 'Super Admin' },
                ]}
                size="md"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1.5 text-xs">Assign Organization</label>
              <CustomSelect
                value={newUserForm.organizationId}
                onChange={(val) => setNewUserForm({ ...newUserForm, organizationId: val })}
                options={[
                  { value: '', label: '+ Create New Isolated Org' },
                  ...organizations.map((o) => ({
                    value: o.id,
                    label: o.name,
                  })),
                ]}
                size="md"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/15"
            >
              {isSubmitting ? 'Provisioning...' : 'Provision User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Account: ${selectedUser?.email || ''}`} maxWidth="md">
        <form onSubmit={handleUpdateUser} className="space-y-4 text-sm">
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1.5 text-xs">Full Name *</label>
            <input
              type="text"
              required
              value={editUserForm.fullName}
              onChange={(e) => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
              className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1.5 text-xs">Phone Number</label>
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={editUserForm.phoneNumber}
              onChange={(e) => setEditUserForm({ ...editUserForm, phoneNumber: e.target.value })}
              className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1.5 text-xs">Role Authority</label>
              <CustomSelect
                value={editUserForm.role}
                onChange={(val) => setEditUserForm({ ...editUserForm, role: val })}
                options={[
                  { value: 'operator', label: 'Operator (Standard)' },
                  { value: 'admin', label: 'Administrator' },
                  { value: 'viewer', label: 'Viewer (Read-only)' },
                  { value: 'super_admin', label: 'Super Admin' },
                ]}
                size="md"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1.5 text-xs">Assign Organization</label>
              <CustomSelect
                value={editUserForm.organizationId}
                onChange={(val) => setEditUserForm({ ...editUserForm, organizationId: val })}
                options={[
                  { value: '', label: 'Personal Workspace (Single-Tenant)' },
                  ...organizations.map((o) => ({
                    value: o.id,
                    label: o.name,
                  })),
                ]}
                size="md"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
            <div>
              <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Account Access State</p>
              <p className="text-[11px] text-zinc-500">Allow or restrict user login to the platform.</p>
            </div>
            <button
              type="button"
              onClick={() => setEditUserForm({ ...editUserForm, isActive: !editUserForm.isActive })}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                editUserForm.isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
              }`}
            >
              {editUserForm.isActive ? 'Active' : 'Suspended'}
            </button>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/15"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal isOpen={isResetPasswordModalOpen} onClose={() => setIsResetPasswordModalOpen(false)} title="Override Password" maxWidth="sm">
        <form onSubmit={handleResetPassword} className="space-y-4 text-sm">
          <p className="text-zinc-500 text-sm">
            Enter a new password for <span className="font-bold text-zinc-900 dark:text-white">{selectedUser?.email}</span>.
          </p>
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1.5">New Password</label>
            <input
              type="text"
              required
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={() => setIsResetPasswordModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-sm hover:bg-emerald-400 cursor-pointer shadow-md shadow-emerald-500/15"
            >
              Save Password
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE USER CONFIRM MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Platform Account" maxWidth="sm">
        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <span className="text-sm">
              Are you sure you want to permanently delete <strong className="text-white">{selectedUser?.email}</strong>? All associated credentials will be purged.
            </span>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDeleteUser}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-sm cursor-pointer"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* UNIVERSAL IN-APP ACTION CONFIRMATION MODAL */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => {
          if (!confirmModal.isLoading) {
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        title={confirmModal.title}
        description={confirmModal.description}
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
              disabled={confirmModal.isLoading}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant={confirmModal.confirmVariant === 'danger' ? 'danger' : 'primary'}
              size="sm"
              onClick={() => {
                if (confirmModal.onConfirm) {
                  confirmModal.onConfirm();
                }
              }}
              disabled={confirmModal.isLoading}
              className={`text-xs font-bold shadow-xs cursor-pointer px-4 ${
                confirmModal.confirmVariant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : ''
              }`}
            >
              {confirmModal.isLoading ? 'Processing...' : confirmModal.confirmLabel || 'Confirm Action'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1">
          {confirmModal.details && confirmModal.details.length > 0 && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/50 divide-y divide-zinc-200/70 dark:divide-zinc-800/70 text-xs overflow-hidden">
              {confirmModal.details.map((d, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between px-4.5 py-3 gap-2 sm:gap-6 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/80 transition-colors">
                  <span className="text-zinc-500 dark:text-zinc-400 font-semibold shrink-0 sm:min-w-[180px]">
                    {d.label}
                  </span>
                  <span className={`font-mono text-left sm:text-right ${d.isDanger ? 'font-bold text-rose-600 dark:text-rose-400' : 'font-semibold text-zinc-900 dark:text-zinc-100'} break-all sm:break-normal`}>
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <span>This administrative action is authoritative and takes effect immediately across all live sessions.</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default SuperAdminView;
