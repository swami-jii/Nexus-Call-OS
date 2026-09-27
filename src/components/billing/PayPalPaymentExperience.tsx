import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  TrendingUp,
  Globe2,
  Lock,
  ExternalLink,
  CreditCard,
  Zap,
  Calendar,
  Sparkles,
  BadgeCheck,
  AlertCircle,
  AlertTriangle,
  Mail,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { PayPalLogo } from './PaymentBrandLogos';

interface PayPalPaymentExperienceProps {
  isPaypalConfigured: boolean;
  livePaypalGateway: any;
  payableAmountUsd: number;
  totalAmountLocal: number;
  currentCurrency: any;
  selectedCurrencyCode: string;
  isWalletTopup: boolean;
  selectedPlanName: string;
  paypalSubTab: 'balance' | 'pay_in_4';
  setPaypalSubTab: (tab: 'balance' | 'pay_in_4') => void;
  paypalPayerEmail: string;
  setPaypalPayerEmail: (email: string) => void;
  billingEmail: string;
  handleOpenConverterForPair: (from: string, to: string, amount?: number) => void;
  setSelectedCurrencyCode: (code: string) => void;
  basePriceUsd: number;
  addToast: (toast: any) => void;
}

export const PayPalPaymentExperience: React.FC<PayPalPaymentExperienceProps> = ({
  isPaypalConfigured,
  livePaypalGateway,
  payableAmountUsd,
  totalAmountLocal,
  currentCurrency,
  selectedCurrencyCode,
  isWalletTopup,
  selectedPlanName,
  paypalSubTab,
  setPaypalSubTab,
  paypalPayerEmail,
  setPaypalPayerEmail,
  billingEmail,
  handleOpenConverterForPair,
  setSelectedCurrencyCode,
  basePriceUsd,
  addToast,
}) => {
  const [payIn4Agreed, setPayIn4Agreed] = useState(true);
  const effectiveEmail = paypalPayerEmail || billingEmail || 'buyer@example.com';
  const installmentAmount = (payableAmountUsd / 4).toFixed(2);
  const localInstallmentAmount = (totalAmountLocal / 4).toFixed(2);

  const handleLaunchPayPalExpress = () => {
    if (!isPaypalConfigured) {
      addToast({
        type: 'warning',
        title: 'PayPal Gateway Setup Required',
        description: 'PayPal credentials must be configured by Super Admin before launching PayPal express.',
      });
      return;
    }
    addToast({
      type: 'info',
      title: 'Connecting to PayPal Express...',
      description: 'Redirecting to PayPal secure checkout portal for authorization.',
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Header with official logo and single clean status badge */}
      <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <PayPalLogo size="lg" />
          <div className="flex items-center gap-2">
            {isPaypalConfigured ? (
              <span className="text-[10.5px] text-sky-700 dark:text-sky-300 font-bold font-mono flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-md border border-sky-200 dark:border-sky-800 whitespace-nowrap">
                <BadgeCheck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" /> Buyer Protection Active
              </span>
            ) : (
              <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-bold font-mono flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" /> Super Admin Setup Required
              </span>
            )}
          </div>
        </div>
        <div className="space-y-0.5 pt-1">
          <h3 className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>PayPal Express &amp; Global Buyer Protection Rail</span>
            <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-800/40 font-mono whitespace-nowrap">
              180-Day Guarantee
            </span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Instant one-click checkout with PayPal balance, linked bank accounts, or Pay in 4 credit
          </p>
        </div>
      </div>

      {/* 2. Subtab Switcher: Strict Single-Line Whitespace-Nowrap */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setPaypalSubTab('balance')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            paypalSubTab === 'balance'
              ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Zap className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="whitespace-nowrap">PayPal Express Balance</span>
        </button>
        <button
          type="button"
          onClick={() => setPaypalSubTab('pay_in_4')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            paypalSubTab === 'pay_in_4'
              ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <CreditCard className="h-4 w-4 text-sky-600 shrink-0" />
          <span className="whitespace-nowrap">PayPal Pay in 4</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      {paypalSubTab === 'balance' ? (
        /* TAB 1: ⚡ PAYPAL EXPRESS BALANCE */
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
          {/* Warning banner if unconfigured */}
          {!isPaypalConfigured && (
            <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <strong className="block text-amber-900 dark:text-amber-100 font-bold">
                  PayPal Gateway Setup Required in Super Admin
                </strong>
                <p className="text-[11.5px] text-amber-800 dark:text-amber-300">
                  PayPal Express gateway is in <strong>Pending Configuration</strong> state. Super Admin must configure live Client ID &amp; Secret Key in <em>Super Admin Settings &gt; Payment Gateways</em> before PayPal checkouts can be processed.
                </p>
              </div>
            </div>
          )}

          {/* 2-Column Details: Payer Account & Settlement Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1 whitespace-nowrap">
                PayPal Account Email *
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="email"
                  value={effectiveEmail}
                  onChange={(e) => setPaypalPayerEmail(e.target.value)}
                  placeholder="e.g. your-email@paypal.com"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1 whitespace-nowrap">
                Total Settlement Amount
              </label>
              <div className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                <span className="font-extrabold text-sky-700 dark:text-sky-300 text-sm">
                  ${payableAmountUsd.toFixed(2)} USD
                </span>
                {selectedCurrencyCode !== 'USD' && (
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">
                    ({currentCurrency.symbol}{totalAmountLocal.toLocaleString()} {selectedCurrencyCode})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive PayPal Express Checkout Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleLaunchPayPalExpress}
              className="w-full py-3 px-4 rounded-xl font-black text-sm text-[#003087] bg-[#FFC439] hover:bg-[#f4b827] active:bg-[#e2a81c] shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#e5a800]"
            >
              <span className="italic font-sans font-black text-lg text-[#003087] tracking-tight">
                Pay<span className="text-[#0079C1]">Pal</span>
              </span>
              <span className="text-xs font-black text-[#003087] uppercase tracking-wider ml-1">
                Checkout
              </span>
            </button>
          </div>

          {/* Buyer Protection Guarantee & Funding Sources */}
          <div className="p-3 rounded-lg bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-950 dark:text-sky-100">
              <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>PayPal 180-Day Global Buyer Protection</span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Your transaction is covered by PayPal's comprehensive buyer protection. Zero fraud liability, instant cancellation rights, and end-to-end 256-bit SSL encrypted tokenization.
            </p>
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Supported Sources:</span>
              {['PayPal Balance', 'Visa', 'Mastercard', 'Amex', 'Discover', 'Bank Account'].map((source) => (
                <span
                  key={source}
                  className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: 💳 PAYPAL PAY IN 4 (BUY NOW PAY LATER) */
        <div className="p-4 rounded-xl bg-sky-50/40 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                <span>Split your payment into 4 interest-free bi-weekly installments</span>
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                0% APR • No sign-up fees • Automatic bi-weekly debit
              </p>
            </div>
            <Badge variant="teal" size="xs" className="font-mono font-bold">
              0% Interest
            </Badge>
          </div>

          {/* 4 Bi-weekly Installments Timeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { title: 'Due Today', num: '1/4', amt: `$${installmentAmount}`, date: 'Immediate' },
              { title: 'In 2 Weeks', num: '2/4', amt: `$${installmentAmount}`, date: '+14 Days' },
              { title: 'In 4 Weeks', num: '3/4', amt: `$${installmentAmount}`, date: '+28 Days' },
              { title: 'In 6 Weeks', num: '4/4', amt: `$${installmentAmount}`, date: '+42 Days' },
            ].map((inst, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-sky-100 dark:border-sky-900/50 space-y-1 text-center"
              >
                <div className="text-[10px] font-bold text-sky-700 dark:text-sky-300 font-mono">
                  Payment {inst.num}
                </div>
                <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                  {inst.amt}
                </div>
                <div className="text-[9.5px] text-zinc-500 dark:text-zinc-400 font-semibold">
                  {inst.title}
                </div>
              </div>
            ))}
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={payIn4Agreed}
              onChange={(e) => setPayIn4Agreed(e.target.checked)}
              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <span>
              I authorize PayPal to deduct 4 interest-free installments of <strong>${installmentAmount} USD</strong> from my selected funding source every 2 weeks.
            </span>
          </label>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleLaunchPayPalExpress}
            disabled={!payIn4Agreed}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              payIn4Agreed
                ? 'bg-sky-600 hover:bg-sky-700 text-white'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Apply &amp; Pay in 4 with PayPal</span>
          </button>
        </div>
      )}

      {/* 4. FULL-WIDTH BOTTOM SETTLEMENT & LIVE MONEY CONVERTER BAR */}
      <div className="p-3.5 rounded-lg bg-gradient-to-r from-sky-50/90 via-blue-50/50 to-sky-50/80 dark:from-sky-950/40 dark:via-blue-950/20 dark:to-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-sky-200/60 dark:border-sky-800/60 pb-2">
          <span className="text-xs font-bold text-sky-950 dark:text-sky-100 flex items-center gap-1.5 whitespace-nowrap">
            <Globe2 className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
            Gateway Settlement Currency: <strong>USD ($) • PayPal Global Settlement</strong>
          </span>
          <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-300 bg-white/90 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-sky-200 dark:border-sky-800 whitespace-nowrap">
            1 USD = {currentCurrency.rate} {selectedCurrencyCode}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11.5px] text-zinc-600 dark:text-zinc-400 flex-wrap gap-2">
          <span className="whitespace-nowrap">
            Live exchange rate applied:{' '}
            <strong>
              ${basePriceUsd.toFixed(2)} USD = {currentCurrency.symbol}
              {totalAmountLocal.toLocaleString()} {selectedCurrencyCode}
            </strong>
          </span>
          <span className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
            ● Real-Time Market Rate
          </span>
        </div>

        {/* Action Buttons Underneath */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          {selectedCurrencyCode !== 'USD' && (
            <button
              type="button"
              onClick={() => setSelectedCurrencyCode('USD')}
              className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-sky-800 dark:text-sky-200 bg-white dark:bg-zinc-800 hover:bg-sky-50 dark:hover:bg-sky-950/60 border border-sky-300 dark:border-sky-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
              <span className="whitespace-nowrap">Switch Order to USD ($)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleOpenConverterForPair('USD', selectedCurrencyCode, basePriceUsd)}
            className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            title="Open Live Money Converter for this Currency Pair"
          >
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">Open Live Money Converter (USD ⇄ {selectedCurrencyCode})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
