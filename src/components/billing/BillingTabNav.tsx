import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Layers,
  CreditCard,
  FileText,
  History,
  SlidersHorizontal,
} from 'lucide-react';

export type BillingTabKey =
  | 'overview'
  | 'usage'
  | 'plans'
  | 'payment_methods'
  | 'invoices'
  | 'transactions'
  | 'settings';

export interface BillingTabItem {
  key: BillingTabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const BILLING_TABS: BillingTabItem[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'usage', label: 'Usage Center', icon: Activity },
  { key: 'plans', label: 'Subscription Plans', icon: Layers },
  { key: 'payment_methods', label: 'Payment Methods', icon: CreditCard },
  { key: 'invoices', label: 'Invoices & Receipts', icon: FileText },
  { key: 'transactions', label: 'Transactions', icon: History },
  { key: 'settings', label: 'Billing Settings', icon: SlidersHorizontal },
];

export interface BillingTabNavProps {
  activeTab: BillingTabKey;
  onTabChange: (tab: BillingTabKey) => void;
  invoiceCount?: number;
  isSuperAdmin?: boolean;
}

export const BillingTabNav: React.FC<BillingTabNavProps> = ({
  activeTab,
  onTabChange,
  invoiceCount,
  isSuperAdmin = false,
}) => {
  const getTabLabel = (tab: BillingTabItem) => {
    if (!isSuperAdmin) return tab.label;
    switch (tab.key) {
      case 'overview':
        return 'Platform Executive Overview';
      case 'usage':
        return 'Voice Telemetry & Quotas';
      case 'plans':
        return 'Tenant Plan Matrix';
      case 'payment_methods':
        return 'Payment Gateways & Rails';
      case 'invoices':
        return 'Tenant Invoices & Receipts';
      case 'transactions':
        return 'Global Financial Ledger';
      case 'settings':
        return 'Financial & Tax Config';
      default:
        return tab.label;
    }
  };

  return (
    <div className="w-full p-2 sm:p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
      <div
        className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {BILLING_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === 'invoices' && invoiceCount !== undefined && invoiceCount > 0;
          const label = getTabLabel(tab);

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                isActive
                  ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-xs'
                  : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 shrink-0 ${
                  isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              />
              <span>{label}</span>
              {showBadge && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold leading-none ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {invoiceCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BillingTabNav;
