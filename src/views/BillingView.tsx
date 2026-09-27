import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Check,
  Building2,
  Plus,
  Search,
  Crown,
  Landmark,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { fetchAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { SubscriptionPlan, BillingCurrencyOption, BillingInvoiceItem } from '../types';

import { BillingTabNav, BillingTabKey } from '../components/billing/BillingTabNav';
import { BillingOverviewTab } from '../components/billing/BillingOverviewTab';
import { UsageCenterTab } from '../components/billing/UsageCenterTab';
import { SubscriptionPlansTab } from '../components/billing/SubscriptionPlansTab';
import { PaymentMethodsTab } from '../components/billing/PaymentMethodsTab';
import { InvoicesTab } from '../components/billing/InvoicesTab';
import { TransactionsTab } from '../components/billing/TransactionsTab';
import { BillingSettingsTab } from '../components/billing/BillingSettingsTab';
import { FullPageCheckout, detectUserGeoAndCurrency } from '../components/billing/FullPageCheckout';

export const BillingView: React.FC = () => {
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<BillingTabKey>('overview');

  // Full Screen Checkout Overlay State
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'subscription_purchase' | 'wallet_topup'>('subscription_purchase');
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);
  const [checkoutCycle, setCheckoutCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');

  // Authoritative Backend Data States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [billingData, setBillingData] = useState<any>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [gateways, setGateways] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoiceItem[]>([]);
  const [currencies, setCurrencies] = useState<BillingCurrencyOption[]>([
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 1.0, country: 'United States' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rate: 83.25, country: 'India' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.92, country: 'European Union' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.79, country: 'United Kingdom' },
    { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', flag: '🇦🇪', rate: 3.67, country: 'United Arab Emirates' },
    { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', rate: 1.36, country: 'Canada' },
    { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', flag: '🇦🇺', rate: 1.52, country: 'Australia' },
    { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', flag: '🇸🇬', rate: 1.35, country: 'Singapore' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', rate: 156.0, country: 'Japan' },
  ]);

  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('nexus_selected_currency') : null;
      if (saved) return saved;
      const geo = detectUserGeoAndCurrency();
      return geo.currencyCode || 'INR';
    } catch {
      return 'INR';
    }
  });
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  // Sync currency changes across window events and storage
  useEffect(() => {
    const handleCurrencyEvent = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        setSelectedCurrencyCode(e.detail);
      }
    };
    window.addEventListener('currency-changed', handleCurrencyEvent);
    return () => window.removeEventListener('currency-changed', handleCurrencyEvent);
  }, []);

  // Close currency dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active Currency Object
  const currentCurrency =
    currencies.find((c) => c.code === selectedCurrencyCode) || currencies[0];

  // Dynamic search filtering over central registry currencies
  const filteredCurrencies = useMemo(() => {
    if (!currencySearch.trim()) return currencies;
    const q = currencySearch.toLowerCase().trim();
    return currencies.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.country && c.country.toLowerCase().includes(q)) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [currencies, currencySearch]);

  // Fetch Live Billing Data with Resilient Promise.allSettled
  const loadBillingData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setLoadError(null);

    try {
      const [billingRes, plansRes, curRes, gwRes, invRes] = await Promise.allSettled([
        fetchAPI('/api/billing'),
        fetchAPI('/api/plans'),
        fetchAPI('/api/billing/currencies'),
        fetchAPI('/api/billing/gateways'),
        fetchAPI('/api/billing/invoices'),
      ]);

      let hasFatalError = false;

      // 1. Process Billing Dashboard Overview
      if (billingRes.status === 'fulfilled' && billingRes.value) {
        setBillingData(billingRes.value);
      } else {
        hasFatalError = true;
      }

      // 2. Process Plans
      if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value)) {
        setPlans(plansRes.value);
      }

      // 3. Process Currencies
      if (curRes.status === 'fulfilled' && Array.isArray(curRes.value) && curRes.value.length > 0) {
        setCurrencies(curRes.value);
      }

      // 4. Process Gateways
      if (gwRes.status === 'fulfilled' && Array.isArray(gwRes.value)) {
        setGateways(gwRes.value);
      }

      // 5. Process Invoices
      if (invRes.status === 'fulfilled' && Array.isArray(invRes.value)) {
        setInvoices(invRes.value);
      }

      if (hasFatalError && !silent) {
        setLoadError('Unable to connect to billing server. Please check network connection and retry.');
      }
    } catch (err: any) {
      setLoadError(err.message || 'Failed to sync with billing server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData, user?.id, (user as any)?.organization_id]);

  // Live Broadcast Listeners for Super Admin updates & Multi-tab sync
  useEffect(() => {
    const handleLiveSync = () => {
      loadBillingData(true);
    };

    window.addEventListener('billing-data-updated', handleLiveSync);
    window.addEventListener('plan-entitlements-updated', handleLiveSync);
    window.addEventListener('app-plan-updated', handleLiveSync);
    window.addEventListener('gateways-updated', handleLiveSync);
    window.addEventListener('storage', (e) => {
      if (
        e.key === 'plan_entitlements_version' ||
        e.key === 'gateways_version' ||
        e.key === 'createcall_target_org_id'
      ) {
        handleLiveSync();
      }
    });

    return () => {
      window.removeEventListener('billing-data-updated', handleLiveSync);
      window.removeEventListener('plan-entitlements-updated', handleLiveSync);
      window.removeEventListener('app-plan-updated', handleLiveSync);
      window.removeEventListener('gateways-updated', handleLiveSync);
    };
  }, [loadBillingData]);

  const [checkoutTopupAmount, setCheckoutTopupAmount] = useState<number>(100);

  // Open Dedicated Wallet Top-Up Flow with optional preset amount
  const handleOpenAddFunds = (amountUsd?: number | any) => {
    const validAmount = typeof amountUsd === 'number' && !isNaN(amountUsd) && amountUsd > 0 ? amountUsd : 100;
    setCheckoutMode('wallet_topup');
    setCheckoutPlan(null);
    setCheckoutTopupAmount(validAmount);
    setShowCheckout(true);
  };

  // Open Dedicated Subscription Purchase / Upgrade Flow
  const handleSelectPlan = (
    plan: SubscriptionPlan,
    cycle: 'monthly' | 'yearly' | 'lifetime'
  ) => {
    setCheckoutMode('subscription_purchase');
    setCheckoutPlan(plan);
    setCheckoutCycle(cycle);
    setShowCheckout(true);
  };

  const handleOpenUpgradePlan = () => {
    setActiveTab('plans');
  };

  // Callback on successful payment in FullPageCheckout
  const handleCheckoutSuccess = (invoiceData: any) => {
    // Keep user on the checkout Step 5 receipt view so they can review and print it.
    // Do NOT automatically close checkout or redirect here!
    loadBillingData(true);
    if (invoiceData) {
      setInvoices((prev) => [invoiceData, ...prev]);
    }
  };

  // Full Page Checkout Overlay
  if (showCheckout) {
    const currentWalletBal =
      billingData?.account?.balance_usd !== undefined
        ? billingData.account.balance_usd
        : billingData?.balance_usd !== undefined
        ? billingData.balance_usd
        : 0;

    return (
      <FullPageCheckout
        mode={checkoutMode}
        initialPlan={checkoutPlan}
        allPlans={plans}
        initialBillingCycle={checkoutCycle}
        initialCurrency={selectedCurrencyCode}
        initialTopupAmountUsd={checkoutTopupAmount}
        currentWalletBalanceUsd={currentWalletBal}
        availableCurrencies={currencies}
        availableGateways={gateways}
        onBack={() => {
          setShowCheckout(false);
          loadBillingData(true);
          setActiveTab('overview');
        }}
        onSuccess={handleCheckoutSuccess}
      />
    );
  }

  const isSuperAdmin = Boolean(
    billingData?.is_super_admin ||
    billingData?.plan?.is_super_admin ||
    (user as any)?.role === 'super_admin' ||
    (user as any)?.role === 'superadmin' ||
    user?.email === 'admin@createcall.ai'
  );

  const subscriptionStatus =
    billingData?.subscription_status ||
    billingData?.plan?.status ||
    'active';

  const workspaceName =
    (user as any)?.organization_name ||
    user?.fullName ||
    'Workspace';

  return (
    <div className="w-full max-w-full space-y-4 pb-12">
      {/* Standard Header */}
      <div className="space-y-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5 shrink-0 relative z-10">
        {/* ROW 1: Heading on Left + Badges on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1.5 rounded-lg shrink-0 ${
              isSuperAdmin
                ? 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
                : 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400'
            }`}>
              {isSuperAdmin ? <Crown className="h-4 w-4" /> : <Building2 className="h-3.5 w-3.5" />}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap leading-none">
              {isSuperAdmin ? 'Platform Revenue & Financial Command Center' : 'Billing & Usage Command Center'}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Badge
              variant={isSuperAdmin ? 'purple' : subscriptionStatus === 'active' ? 'emerald' : 'warning'}
              size="xs"
              className="font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 shadow-2xs"
            >
              {isSuperAdmin ? (
                <>
                  <Crown className="h-3 w-3 text-amber-300" />
                  <span>SOVEREIGN ROOT OWNER</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{subscriptionStatus}</span>
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* ROW 2: Description on Left + Action Buttons on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {isSuperAdmin
              ? 'Global multi-tenant platform revenue, payment gateway matrix, carrier voice telemetry, and unmetered root access.'
              : 'Server-authoritative balance, carrier telephony quotas, subscription tiers, and tax-compliant receipts.'}
          </p>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Dynamic SSOT Currency Dropdown */}
            <div className="relative z-20" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsCurrencyDropdownOpen((prev) => !prev);
                  setCurrencySearch('');
                }}
                className="h-7.5 px-2.5 flex items-center gap-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer shadow-2xs"
                aria-expanded={isCurrencyDropdownOpen}
                aria-label="Select currency"
              >
                <span className="text-xs leading-none">{currentCurrency.flag}</span>
                <span className="font-mono font-bold">{currentCurrency.code}</span>
                <span className="text-zinc-400 font-normal">({currentCurrency.symbol})</span>
                <ChevronDown className="h-3 w-3 text-zinc-400 ml-0.5" />
              </button>

              {isCurrencyDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-72 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 z-30 divide-y divide-zinc-100 dark:divide-zinc-800">
                  <div className="p-2 space-y-1.5">
                    <div className="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      <span>Dynamic Currency SSOT</span>
                      <span className="font-mono text-teal-600 dark:text-teal-400">{currencies.length} Available</span>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="text"
                        value={currencySearch}
                        onChange={(e) => setCurrencySearch(e.target.value)}
                        placeholder="Search currency, code, or country..."
                        className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
                    {filteredCurrencies.length > 0 ? (
                      filteredCurrencies.map((curr) => {
                        const isSelected = selectedCurrencyCode === curr.code;
                        return (
                          <button
                            key={curr.code}
                            type="button"
                            onClick={() => {
                              setSelectedCurrencyCode(curr.code);
                              try {
                                localStorage.setItem('nexus_selected_currency', curr.code);
                                window.dispatchEvent(new CustomEvent('currency-changed', { detail: curr.code }));
                              } catch {}
                              setIsCurrencyDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left ${
                              isSelected
                                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold'
                                : 'text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">{curr.flag}</span>
                              <div className="min-w-0">
                                <div className="truncate font-medium">{curr.name}</div>
                                {curr.country && (
                                   <div className="text-[10px] font-normal text-zinc-400 truncate">{curr.country}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-400 shrink-0 ml-2">
                              <span className="font-bold text-zinc-700 dark:text-zinc-300">{curr.code}</span>
                              <span className="text-[11px]">({curr.symbol})</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-zinc-400">
                        No currencies matching "{currencySearch}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sync Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadBillingData(true)}
              disabled={isRefreshing}
              className="h-7.5 text-xs font-semibold px-2.5 rounded-lg border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 shadow-2xs"
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Sync
            </Button>

            {/* Header Action Button */}
            {isSuperAdmin ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('settings')}
                className="h-7.5 text-xs font-semibold px-2.5 bg-purple-600 hover:bg-purple-700 border-purple-600 text-white rounded-lg shadow-2xs cursor-pointer"
                leftIcon={<Landmark className="h-3.5 w-3.5" />}
              >
                Gateway Config
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddFunds}
                className="h-7.5 text-xs font-semibold px-2.5 bg-teal-600 hover:bg-teal-700 border-teal-600 text-white rounded-lg shadow-2xs cursor-pointer"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                Add Funds
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation Row */}
      <BillingTabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        invoiceCount={invoices.length}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="h-56 bg-zinc-200 dark:bg-zinc-800 rounded-lg lg:col-span-8" />
            <div className="h-56 bg-zinc-200 dark:bg-zinc-800 rounded-lg lg:col-span-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>
        </div>
      ) : (
        <>
          {/* Error Banner with Retry */}
          {loadError && (
            <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 flex items-center justify-between text-xs text-red-700 dark:text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loadError}</span>
              </div>
              <button
                type="button"
                onClick={() => loadBillingData()}
                className="underline font-bold hover:text-red-900 dark:hover:text-red-100 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Active Tab View */}
          <div className="w-full">
            {activeTab === 'overview' && (
              <BillingOverviewTab
                billingData={billingData}
                currency={currentCurrency}
                onUpgradePlan={handleOpenUpgradePlan}
                onAddBalance={handleOpenAddFunds}
                onNavigateTab={(tabKey) => setActiveTab(tabKey)}
                recentInvoices={invoices}
                onRefresh={() => loadBillingData(true)}
                isRefreshing={isRefreshing}
              />
            )}

            {activeTab === 'usage' && (
              <UsageCenterTab
                billingData={billingData}
                onUpgradePlan={() => setActiveTab('plans')}
                onRefresh={() => loadBillingData(true)}
                onNavigateTab={(tabKey) => setActiveTab(tabKey)}
                isRefreshing={isRefreshing}
              />
            )}

            {activeTab === 'plans' && (
              <SubscriptionPlansTab
                plans={plans}
                currency={currentCurrency}
                currentPlanId={billingData?.plan?.plan_key || billingData?.plan?.name || billingData?.active_plan || 'starter'}
                isSuperAdmin={isSuperAdmin}
                onSelectPlan={handleSelectPlan}
              />
            )}

            {activeTab === 'payment_methods' && (
              <PaymentMethodsTab
                gateways={gateways}
                billingAccount={billingData}
                onAddFunds={handleOpenAddFunds}
                onUpgradePlan={handleOpenUpgradePlan}
                onNavigateTab={(tabKey) => setActiveTab(tabKey as any)}
                isSuperAdmin={isSuperAdmin}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoicesTab
                invoices={invoices}
                isSuperAdmin={isSuperAdmin}
                onRefresh={() => loadBillingData(true)}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsTab
                isSuperAdmin={isSuperAdmin}
                onRefresh={() => loadBillingData(true)}
              />
            )}

            {activeTab === 'settings' && (
              <BillingSettingsTab
                billingAccount={billingData}
                isSuperAdmin={isSuperAdmin}
                onSettingsSaved={() => loadBillingData(true)}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BillingView;
