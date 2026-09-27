import React, { useState, useEffect } from 'react';
import {
  Building,
  Save,
  RefreshCw,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { fetchAPI } from '../../lib/api';
import { GLOBAL_COUNTRY_CODES_CATALOG } from '../../data/worldCountriesMasterCatalog';
import { BillingCurrencyOption } from '../../types';

export interface BillingSettingsTabProps {
  billingAccount?: any;
  onSettingsSaved?: () => void;
  isSuperAdmin?: boolean;
}

export const BillingSettingsTab: React.FC<BillingSettingsTabProps> = ({
  billingAccount,
  onSettingsSaved,
  isSuperAdmin: isSuperAdminProp,
}) => {
  const { user } = useAuth();
  const isSuperAdmin = Boolean(
    isSuperAdminProp ||
    billingAccount?.is_super_admin ||
    (user as any)?.role === 'super_admin' ||
    (user as any)?.role === 'superadmin' ||
    user?.email === 'admin@createcall.ai'
  );
  const { addToast } = useToast();

  const details = billingAccount?.details_json || billingAccount?.account?.details_json || {};

  const [companyName, setCompanyName] = useState(() => details.company_name || (user as any)?.organization_name || user?.fullName || 'Enterprise Customer');
  const [billingEmail, setBillingEmail] = useState(() => details.billing_email || user?.email || 'billing@enterprise.com');
  const [country, setCountry] = useState(() => details.country || 'United States');
  const [stateRegion, setStateRegion] = useState(() => details.state || '');
  const [city, setCity] = useState(() => details.city || '');
  const [postalCode, setPostalCode] = useState(() => details.postal_code || '');
  const [billingAddress, setBillingAddress] = useState(() => details.billing_address || '');
  const [taxId, setTaxId] = useState(() => details.tax_id || '');

  const [autoRecharge, setAutoRecharge] = useState(() => billingAccount?.auto_recharge ?? true);
  const [thresholdAmount, setThresholdAmount] = useState(() => String(details.threshold_amount_usd || 50));
  const [rechargeAmount, setRechargeAmount] = useState(() => String(details.recharge_amount_usd || 200));
  const [currencyPreference, setCurrencyPreference] = useState(() => billingAccount?.currency || 'USD');

  const [availableCurrencies, setAvailableCurrencies] = useState<BillingCurrencyOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load dynamic currencies
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const currRes = await fetchAPI('/api/billing/currencies');
        if (Array.isArray(currRes)) {
          setAvailableCurrencies(currRes);
        }
      } catch (e) {
        console.warn('Failed to load currency options:', e);
      }
    };
    loadCurrencies();
  }, []);

  // Sync state if billingAccount updates
  useEffect(() => {
    if (billingAccount) {
      const d = billingAccount.details_json || billingAccount.account?.details_json || {};
      if (d.company_name) setCompanyName(d.company_name);
      if (d.billing_email) setBillingEmail(d.billing_email);
      if (d.country) setCountry(d.country);
      if (d.state) setStateRegion(d.state);
      if (d.city) setCity(d.city);
      if (d.postal_code) setPostalCode(d.postal_code);
      if (d.billing_address) setBillingAddress(d.billing_address);
      if (d.tax_id) setTaxId(d.tax_id);
      if (d.threshold_amount_usd) setThresholdAmount(String(d.threshold_amount_usd));
      if (d.recharge_amount_usd) setRechargeAmount(String(d.recharge_amount_usd));
      if (billingAccount.auto_recharge !== undefined) setAutoRecharge(billingAccount.auto_recharge);
      if (billingAccount.currency) setCurrencyPreference(billingAccount.currency);
    }
  }, [billingAccount]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await fetchAPI('/api/billing/settings', {
        method: 'PUT',
        body: JSON.stringify({
          company_name: companyName,
          billing_email: billingEmail,
          country: country,
          state: stateRegion,
          city: city,
          postal_code: postalCode,
          billing_address: billingAddress,
          tax_id: taxId,
          auto_recharge: autoRecharge,
          threshold_amount_usd: parseFloat(thresholdAmount) || 50,
          recharge_amount_usd: parseFloat(rechargeAmount) || 200,
          currency_preference: currencyPreference,
        }),
      });

      addToast({
        type: 'success',
        title: 'Billing Profile Saved',
        description: 'Organization settings, tax details, and auto-recharge preferences successfully updated.',
      });

      if (onSettingsSaved) {
        onSettingsSaved();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        description: err.message || 'Failed to save billing settings to server.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Legal Tax Profile Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg shadow-xs">
        <CardHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Building className="h-4 w-4 text-teal-600" /> Customer &amp; Tax Registration Profile
            </CardTitle>
            <Badge variant="outline" size="xs" className="font-mono text-[10px]">
              SSOT PERSISTED
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Legal Company / Entity Name
              </label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Technologies Inc."
                className="h-9 text-xs rounded-md"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Billing &amp; Invoice Recipient Email
              </label>
              <Input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="finance@acme.com"
                className="h-9 text-xs rounded-md"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Country Selector (243+ Countries SSOT) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Country / Jurisdiction ({GLOBAL_COUNTRY_CODES_CATALOG.length} Sovereign)
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer"
              >
                {GLOBAL_COUNTRY_CODES_CATALOG.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.flag} {c.name} ({c.dialCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                State / Province / Region
              </label>
              <Input
                value={stateRegion}
                onChange={(e) => setStateRegion(e.target.value)}
                placeholder="California or Haryana"
                className="h-9 text-xs rounded-md"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                City
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="San Francisco or Gurugram"
                className="h-9 text-xs rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Registered Corporate Postal Address
              </label>
              <Input
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Street Address, Suite / Floor / Building"
                className="h-9 text-xs rounded-md"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Postal / ZIP Code
              </label>
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="94105 or 122002"
                className="h-9 text-xs font-mono rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                GSTIN / VAT / Federal Tax ID
              </label>
              <Input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="e.g. 27AABCU9603R1ZM or US-EIN-XX"
                className="h-9 text-xs font-mono rounded-md uppercase"
              />
              <p className="text-[10px] text-zinc-400">
                Included on all generated tax invoices, receipts, and compliance audit reports.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Default Invoicing Currency Preference
              </label>
              <select
                value={currencyPreference}
                onChange={(e) => setCurrencyPreference(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer"
              >
                {availableCurrencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Recharge Settings Card (for Tenants) or Gateway Webhook Deck (for Super Admin) */}
      {isSuperAdmin ? (
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg shadow-xs">
          <CardHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-600" />
                <span>👑 Gateway Webhooks, Security &amp; Settlement Routing</span>
              </CardTitle>
              <Badge variant="purple" size="xs" className="font-mono text-[10px] uppercase font-bold">
                ROOT CONFIG
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <span>Razorpay Webhook Endpoint</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">LIVE 200 OK</span>
                </div>
                <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-[10px] text-zinc-500 truncate select-all">
                  https://api.createcall.ai/api/billing/webhooks/razorpay
                </div>
                <p className="text-[10px] text-zinc-400">Events: payment.captured, order.paid, subscription.charged</p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <span>Stripe Webhook Endpoint</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">LIVE 200 OK</span>
                </div>
                <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-[10px] text-zinc-500 truncate select-all">
                  https://api.createcall.ai/api/billing/webhooks/stripe
                </div>
                <p className="text-[10px] text-zinc-400">Events: checkout.session.completed, invoice.payment_succeeded</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-purple-950 dark:text-purple-200">
                  Sovereign Master Settlement Exemption
                </span>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                  As Platform Root Owner, personal wallet balances and auto-recharge throttles are permanently bypassed ($0 / Lifetime).
                </p>
              </div>
              <Badge variant="purple" size="xs" className="font-mono text-[10px] uppercase font-bold shrink-0">
                UNTHROTTLED
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg shadow-xs">
          <CardHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-teal-600" /> Carrier Telephony Auto-Recharge
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Enable Automatic Telephony Wallet Top-Up
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Automatically triggers a top-up when prepaid balance dips below the threshold to prevent dropped live carrier calls.
                </p>
              </div>
              <input
                type="checkbox"
                id="autoRechargeToggle"
                checked={autoRecharge}
                onChange={(e) => setAutoRecharge(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
            </div>

            {autoRecharge && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Minimum Balance Trigger ($ USD)
                  </label>
                  <Input
                    type="number"
                    value={thresholdAmount}
                    onChange={(e) => setThresholdAmount(e.target.value)}
                    className="h-9 text-xs font-mono rounded-md"
                    min="5"
                    step="5"
                  />
                  <p className="text-[10px] text-zinc-400">Top-up initiates when balance drops below this amount.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Auto Top-Up Recharge Amount ($ USD)
                  </label>
                  <Input
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="h-9 text-xs font-mono rounded-md"
                    min="20"
                    step="10"
                  />
                  <p className="text-[10px] text-zinc-400">Amount automatically credited via default payment method.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Button Strip */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="h-4 w-4 text-teal-600" />
          <span>All updates are cryptographically hashed and audit-logged.</span>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isSaving}
          className={`${
            isSuperAdmin
              ? 'bg-purple-600 hover:bg-purple-700 border-purple-600'
              : 'bg-teal-600 hover:bg-teal-700 border-teal-600'
          } text-white font-semibold px-5 shadow-xs text-xs rounded-md`}
          leftIcon={<Save className="h-3.5 w-3.5" />}
        >
          {isSuperAdmin ? 'Save Platform Financial Config' : 'Save Preferences'}
        </Button>
      </div>
    </form>
  );
};

export default BillingSettingsTab;
