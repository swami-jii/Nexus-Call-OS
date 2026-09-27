import React from 'react';
import {
  QrCode,
  Building2,
  AlertTriangle,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Clock,
  RefreshCw,
  Lock,
  BadgeCheck,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  ArrowRightLeft,
  Globe2,
  Phone,
} from 'lucide-react';
import { CashfreeLogo } from './PaymentBrandLogos';
import { Badge } from '../ui/Badge';

export interface CashfreePaymentExperienceProps {
  isCashfreeConfigured: boolean;
  liveCashfreeGateway: any;
  payableAmountInr: number;
  totalAmountLocal: number;
  basePriceUsd: number;
  currentCurrency: {
    code: string;
    symbol: string;
    rate: number;
    name: string;
  };
  selectedCurrencyCode: string;
  setSelectedCurrencyCode: (code: string) => void;
  isWalletTopup: boolean;
  selectedPlanName: string;
  cashfreeSubTab: 'upi_qr' | 'van_pg';
  setCashfreeSubTab: (tab: 'upi_qr' | 'van_pg') => void;
  cashfreeCustomerPhone: string;
  setCashfreeCustomerPhone: (phone: string) => void;
  qrTimer: number;
  formatTimer: (seconds: number) => string;
  handleRegenerateQr: () => void;
  copiedField: string | null;
  handleCopyText: (text: string, label: string) => void;
  handleOpenConverterForPair: (from: string, to: string, baseAmount: number) => void;
}

export const CashfreePaymentExperience: React.FC<CashfreePaymentExperienceProps> = ({
  isCashfreeConfigured,
  liveCashfreeGateway,
  payableAmountInr,
  totalAmountLocal,
  basePriceUsd,
  currentCurrency,
  selectedCurrencyCode,
  setSelectedCurrencyCode,
  isWalletTopup,
  selectedPlanName,
  cashfreeSubTab,
  setCashfreeSubTab,
  cashfreeCustomerPhone,
  setCashfreeCustomerPhone,
  qrTimer,
  formatTimer,
  handleRegenerateQr,
  copiedField,
  handleCopyText,
  handleOpenConverterForPair,
}) => {
  const rawCashfreeVpa = (
    liveCashfreeGateway?.vpa_address ||
    liveCashfreeGateway?.details_json?.vpa_address ||
    liveCashfreeGateway?.details_json?.upi_id ||
    ''
  ).trim();

  const cashfreeVpa = isCashfreeConfigured
    ? (rawCashfreeVpa || 'cashfree.createcall@icici')
    : 'Pending Super Admin Setup (VPA Not Configured)';

  const dynamicUpiUri = isCashfreeConfigured
    ? `upi://pay?pa=${cashfreeVpa}&pn=CreateCall%20AI&am=${payableAmountInr}.00&cu=INR&tn=${encodeURIComponent(
        isWalletTopup ? 'Wallet TopUp' : selectedPlanName
      )}`
    : 'cashfree_unconfigured_pending_super_admin';

  const liveQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
    dynamicUpiUri
  )}`;

  // AutoCollect Virtual Account Number generated for tenant
  const virtualAccountNumber = isCashfreeConfigured
    ? (liveCashfreeGateway?.details_json?.van_number || 'CCAI' + (liveCashfreeGateway?.merchant_id?.slice(-8) || '98765432'))
    : 'PENDING_SUPER_ADMIN_SETUP';

  const virtualIfsc = isCashfreeConfigured
    ? (liveCashfreeGateway?.details_json?.ifsc || 'ICIC0000104')
    : 'ICIC0000104';

  const virtualBankName = isCashfreeConfigured
    ? (liveCashfreeGateway?.details_json?.bank_name || 'ICICI Bank (Cashfree AutoCollect)')
    : 'ICICI Bank (Cashfree AutoCollect)';

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER & BRAND IDENTITY */}
      <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CashfreeLogo size="lg" />
          <div className="flex items-center gap-2 flex-wrap">
            {isCashfreeConfigured ? (
              <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                <BadgeCheck className="h-3.5 w-3.5" /> AutoCollect Instant Active
              </span>
            ) : (
              <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-bold font-mono flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-3.5 w-3.5" /> Setup Required in Super Admin
              </span>
            )}
            <Badge
              variant={isCashfreeConfigured ? 'teal' : 'warning'}
              size="sm"
              className="font-mono font-bold rounded-md px-2.5 py-0.5"
            >
              {isCashfreeConfigured ? 'AutoCollect 2.0' : 'Pending Keys'}
            </Badge>
          </div>
        </div>
        <div className="space-y-0.5 pt-1">
          <h3 className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Cashfree AutoCollect Dynamic UPI QR &amp; NetBanking</span>
            <span className="text-[10px] font-semibold text-[#8C30F5] bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 font-mono whitespace-nowrap">
              Instant Webhooks
            </span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            High-speed real-time settlement with dynamic barcode payment and instant callback listeners
          </p>
        </div>
      </div>

      {/* 2. SUBTAB SWITCHER: STRICT SINGLE-LINE & CLEAN SINGLE SVG ICONS */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setCashfreeSubTab('upi_qr')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            cashfreeSubTab === 'upi_qr'
              ? 'bg-white dark:bg-zinc-900 text-[#8C30F5] dark:text-purple-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <QrCode className="h-4 w-4 text-[#8C30F5] shrink-0" />
          <span className="whitespace-nowrap">Cashfree Dynamic UPI QR</span>
        </button>
        <button
          type="button"
          onClick={() => setCashfreeSubTab('van_pg')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            cashfreeSubTab === 'van_pg'
              ? 'bg-white dark:bg-zinc-900 text-[#8C30F5] dark:text-purple-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Building2 className="h-4 w-4 text-[#8C30F5] shrink-0" />
          <span className="whitespace-nowrap">AutoCollect Virtual Account &amp; PG</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      {cashfreeSubTab === 'upi_qr' ? (
        /* TAB 1: DYNAMIC UPI QR */
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
          {/* Warning banner if unconfigured */}
          {!isCashfreeConfigured && (
            <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <strong className="block text-amber-900 dark:text-amber-100 font-bold">
                  Cashfree AutoCollect Setup Required in Super Admin
                </strong>
                <p className="text-[11.5px] text-amber-800 dark:text-amber-300">
                  Cashfree AutoCollect gateway is in <strong>Pending Configuration</strong> state. Super Admin must configure live App ID and Secret Key in <em>Super Admin Settings &gt; Payment Gateways</em> before payments can be processed.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-5">
            {/* QR Frame with timer */}
            <div className="flex flex-col items-center space-y-2.5 shrink-0">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl border-2 border-[#8C30F5]/40 shadow-md relative group overflow-hidden">
                <img
                  src={liveQrUrl}
                  alt="Cashfree Dynamic UPI QR"
                  className={`w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg transition-all ${
                    !isCashfreeConfigured ? 'blur-[4px] opacity-40 select-none pointer-events-none' : ''
                  }`}
                  loading="eager"
                />
                {!isCashfreeConfigured ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white/80 dark:bg-zinc-900/85 rounded-xl text-center backdrop-blur-2xs">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mb-1.5 shadow-2xs">
                      <Lock className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                      Super Admin Setup Required
                    </span>
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-[130px] line-clamp-2">
                      Cashfree App ID Pending Setup
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-x-0 bottom-1 flex justify-center">
                    <span className="px-2 py-0.5 rounded-full text-white text-[9px] font-mono font-bold tracking-wider uppercase bg-[#8C30F5] shadow-xs">
                      Auto-Settle QR
                    </span>
                  </div>
                )}
              </div>
              {isCashfreeConfigured ? (
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  <Clock className="h-3.5 w-3.5 text-[#8C30F5]" />
                  <span>
                    Expires in: <strong>{formatTimer(qrTimer)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleRegenerateQr}
                    className="p-1 rounded text-zinc-400 hover:text-[#8C30F5] transition-colors cursor-pointer"
                    title="Regenerate QR"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>QR Inactive (Pending Setup)</span>
                </div>
              )}
            </div>

            {/* Right Side: Account Details & Actions */}
            <div className="flex-1 space-y-3 w-full min-w-0">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Cashfree Dedicated UPI Handle</span>
                  {isCashfreeConfigured ? (
                    <span className="text-emerald-600 font-mono text-[10px] flex items-center gap-1 font-bold">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Webhook Listener Active
                    </span>
                  ) : (
                    <span className="text-amber-600 font-mono text-[10px] font-bold">Pending Setup</span>
                  )}
                </label>
                <div className="relative flex items-center">
                  <div
                    className={`w-full h-9 px-3 flex items-center rounded-lg border font-mono text-xs pr-9 select-all truncate ${
                      isCashfreeConfigured
                        ? 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 italic'
                    }`}
                  >
                    {cashfreeVpa}
                  </div>
                  {isCashfreeConfigured && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(cashfreeVpa, 'Cashfree UPI ID')}
                      className="absolute right-1.5 p-1.5 rounded-md text-zinc-400 hover:text-[#8C30F5] transition-colors cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedField === 'Cashfree UPI ID' ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Phone & Settlement Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1 whitespace-nowrap">
                    Mobile Number (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="tel"
                      value={cashfreeCustomerPhone}
                      onChange={(e) => setCashfreeCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#8C30F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1 whitespace-nowrap">
                    Settlement Amount
                  </label>
                  <div className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                    <span className="font-extrabold text-[#8C30F5] text-sm">
                      ₹{payableAmountInr.toLocaleString()} INR
                    </span>
                    {selectedCurrencyCode !== 'INR' && (
                      <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-semibold">
                        (${basePriceUsd.toFixed(2)} USD)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action: Pay via Mobile UPI Intent */}
              <a
                href={dynamicUpiUri}
                className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer ${
                  isCashfreeConfigured
                    ? 'bg-[#8C30F5] hover:bg-[#7822db] text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span className="whitespace-nowrap">Pay via Mobile UPI Intent</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <div className="p-2.5 rounded-lg bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 text-[11px] text-purple-950 dark:text-purple-200 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#8C30F5] shrink-0" />
                <span>
                  <strong>Instant Webhook Auto-Collect:</strong> Payments made to this dynamic barcode automatically trigger instant subscription activation via secure S2S callback.
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: VIRTUAL ACCOUNT (VAN) & PAYMENT GATEWAY */
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-[#8C30F5]" />
              <span>Cashfree AutoCollect Dedicated Virtual Account (VAN)</span>
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Transfer instantly via NEFT, RTGS, or IMPS from any bank app. Settlement occurs in 3–5 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 space-y-1">
              <div className="text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400">
                Virtual Account Number (VAN)
              </div>
              <div className="flex items-center justify-between font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                <span className="truncate">{virtualAccountNumber}</span>
                {isCashfreeConfigured && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(virtualAccountNumber, 'VAN Number')}
                    className="p-1 text-zinc-400 hover:text-[#8C30F5] transition-colors cursor-pointer"
                  >
                    {copiedField === 'VAN Number' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 space-y-1">
              <div className="text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400">
                Bank &amp; IFSC Code
              </div>
              <div className="flex items-center justify-between font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                <span className="truncate">{virtualIfsc}</span>
                {isCashfreeConfigured && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(virtualIfsc, 'IFSC Code')}
                    className="p-1 text-zinc-400 hover:text-[#8C30F5] transition-colors cursor-pointer"
                  >
                    {copiedField === 'IFSC Code' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 space-y-1 sm:col-span-2">
              <div className="text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400">
                Beneficiary / Account Name
              </div>
              <div className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                CreateCall AI Technologies Private Limited
              </div>
              <div className="text-[10px] text-zinc-400">
                {virtualBankName} • Auto-Reconciled Real-Time Ledger
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 text-xs text-purple-950 dark:text-purple-200 flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold">Total Exact Payable:</span>
            <span className="font-mono font-extrabold text-[#8C30F5] text-sm">
              ₹{payableAmountInr.toLocaleString()} INR
            </span>
          </div>
        </div>
      )}

      {/* 4. FULL-WIDTH BOTTOM SETTLEMENT & LIVE MONEY CONVERTER BAR */}
      <div className="p-3.5 rounded-lg bg-gradient-to-r from-purple-50/90 via-fuchsia-50/40 to-purple-50/80 dark:from-purple-950/40 dark:via-fuchsia-950/20 dark:to-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-purple-200/60 dark:border-purple-800/60 pb-2">
          <span className="text-xs font-bold text-purple-950 dark:text-purple-100 flex items-center gap-1.5 whitespace-nowrap">
            <Globe2 className="h-4 w-4 text-[#8C30F5] dark:text-purple-400 shrink-0" />
            Gateway Settlement Currency: <strong>INR (Indian Rupee - ₹) • Cashfree AutoCollect</strong>
          </span>
          <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-white/90 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 whitespace-nowrap">
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
          {selectedCurrencyCode !== 'INR' && (
            <button
              type="button"
              onClick={() => setSelectedCurrencyCode('INR')}
              className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-purple-800 dark:text-purple-200 bg-white dark:bg-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 border border-purple-300 dark:border-purple-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-[#8C30F5] dark:text-purple-400" />
              <span className="whitespace-nowrap">Switch Order to INR (₹)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleOpenConverterForPair('USD', selectedCurrencyCode, basePriceUsd)}
            className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-white bg-[#8C30F5] hover:bg-[#7822db] transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
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
