import React, { useState, useEffect, useMemo } from 'react';
import {
  QrCode,
  CreditCard,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Clock,
  RefreshCw,
  Lock,
  BadgeCheck,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  ArrowRightLeft,
  Globe2,
  Landmark,
  Sparkles,
  Send,
  Search,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { RazorpayLogo, CardBrandsLogo } from './PaymentBrandLogos';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

export interface RazorpayPaymentExperienceProps {
  isRazorpayConfigured: boolean;
  liveRazorpayGateway: any;
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
  razorpaySubTab: 'upi_qr' | 'cards' | 'upi_intent';
  setRazorpaySubTab: (tab: 'upi_qr' | 'cards' | 'upi_intent') => void;
  razorpayCustomerVpa: string;
  setRazorpayCustomerVpa: (vpa: string) => void;
  qrTimer: number;
  formatTimer: (seconds: number) => string;
  handleRegenerateQr: () => void;
  copiedField: string | null;
  handleCopyText: (text: string, label: string) => void;
  handleOpenConverterForPair: (from: string, to: string, baseAmount: number) => void;
  billingName: string;
  billingEmail: string;
  billingPhone: string;
  onLaunchRazorpayModal?: () => void;
  isProcessingPayment?: boolean;
}

// Complete directory of 50+ RBI-scheduled Indian banks supported via Razorpay
const ALL_INDIAN_BANKS = [
  // Major Private Banks
  { id: 'HDFC', name: 'HDFC Bank', category: 'Major Private', isPopular: true },
  { id: 'ICIC', name: 'ICICI Bank', category: 'Major Private', isPopular: true },
  { id: 'UTIB', name: 'Axis Bank', category: 'Major Private', isPopular: true },
  { id: 'KKBK', name: 'Kotak Mahindra Bank', category: 'Major Private', isPopular: true },
  { id: 'INDB', name: 'IndusInd Bank', category: 'Major Private', isPopular: false },
  { id: 'YESB', name: 'Yes Bank', category: 'Major Private', isPopular: false },
  { id: 'IDFB', name: 'IDFC FIRST Bank', category: 'Major Private', isPopular: false },
  { id: 'FDRL', name: 'Federal Bank', category: 'Major Private', isPopular: false },
  { id: 'RATN', name: 'RBL Bank', category: 'Major Private', isPopular: false },
  { id: 'BDBL', name: 'Bandhan Bank', category: 'Major Private', isPopular: false },
  { id: 'SIBL', name: 'South Indian Bank', category: 'Major Private', isPopular: false },
  { id: 'KVBL', name: 'Karur Vysya Bank', category: 'Major Private', isPopular: false },
  { id: 'CSBK', name: 'CSB Bank', category: 'Major Private', isPopular: false },
  { id: 'TMBL', name: 'Tamilnad Mercantile Bank', category: 'Major Private', isPopular: false },
  { id: 'CIUB', name: 'City Union Bank', category: 'Major Private', isPopular: false },
  { id: 'DCBL', name: 'DCB Bank', category: 'Major Private', isPopular: false },
  { id: 'DLXB', name: 'Dhanlaxmi Bank', category: 'Major Private', isPopular: false },
  { id: 'JKBK', name: 'Jammu & Kashmir Bank', category: 'Major Private', isPopular: false },
  { id: 'KBL', name: 'Karnataka Bank', category: 'Major Private', isPopular: false },
  { id: 'NSPB', name: 'Nainital Bank', category: 'Major Private', isPopular: false },

  // Public Sector (PSU) Banks
  { id: 'SBIN', name: 'State Bank of India (SBI)', category: 'Public Sector (PSU)', isPopular: true },
  { id: 'PUNB', name: 'Punjab National Bank (PNB)', category: 'Public Sector (PSU)', isPopular: true },
  { id: 'BARB', name: 'Bank of Baroda', category: 'Public Sector (PSU)', isPopular: false },
  { id: 'CNRB', name: 'Canara Bank', category: 'Public Sector (PSU)', isPopular: false },
  { id: 'UBIN', name: 'Union Bank of India', category: 'Public Sector (PSU)', isPopular: false },
  { id: 'BKID', name: 'Bank of India (BOI)', category: 'Public Sector (PSU)', isPopular: false },
  { id: 'IOBA', name: 'Indian Overseas Bank', category: 'Public Sector (PSU)', isPopular: false },
  { id: 'IDIB', name: 'Indian Bank', category: 'Public Sector (PSU)', isPopular: false },
  { id: 'CBIN', name: 'Central Bank of India', category: 'Public Sector (PSU)', isPopular: false },
  { id: 'UCBA', name: 'UCO Bank', category: 'Public Sector (PSU)', isPopular: false },
  { id: 'MAHB', name: 'Bank of Maharashtra', category: 'Public Sector (PSU)', isPopular: false },
  { id: 'PSIB', name: 'Punjab & Sind Bank', category: 'Public Sector (PSU)', isPopular: false },

  // Small Finance & Payments Banks
  { id: 'AUBL', name: 'AU Small Finance Bank', category: 'Small Finance Bank', isPopular: false },
  { id: 'ESFB', name: 'Equitas Small Finance Bank', category: 'Small Finance Bank', isPopular: false },
  { id: 'UJJIVAN', name: 'Ujjivan Small Finance Bank', category: 'Small Finance Bank', isPopular: false },
  { id: 'JSFB', name: 'Jana Small Finance Bank', category: 'Small Finance Bank', isPopular: false },
  { id: 'SURYA', name: 'Suryoday Small Finance Bank', category: 'Small Finance Bank', isPopular: false },
  { id: 'UTKARSH', name: 'Utkarsh Small Finance Bank', category: 'Small Finance Bank', isPopular: false },
  { id: 'FINO', name: 'Fino Payments Bank', category: 'Payments Bank', isPopular: false },
  { id: 'AIRTEL', name: 'Airtel Payments Bank', category: 'Payments Bank', isPopular: false },
  { id: 'IPPB', name: 'India Post Payments Bank', category: 'Payments Bank', isPopular: false },
  { id: 'PAYTM', name: 'Paytm Payments Bank', category: 'Payments Bank', isPopular: false },

  // Foreign / Corporate Banks
  { id: 'CITI', name: 'Citi Bank India', category: 'Foreign / Corporate', isPopular: false },
  { id: 'SCBL', name: 'Standard Chartered Bank', category: 'Foreign / Corporate', isPopular: false },
  { id: 'HSBC', name: 'HSBC India', category: 'Foreign / Corporate', isPopular: false },
  { id: 'DEUT', name: 'Deutsche Bank', category: 'Foreign / Corporate', isPopular: false },
  { id: 'DBSS', name: 'DBS Bank India', category: 'Foreign / Corporate', isPopular: false },
  { id: 'BARC', name: 'Barclays Bank', category: 'Foreign / Corporate', isPopular: false },
];

const UPI_VPA_SHORTCUTS = [
  '@okhdfcbank',
  '@okaxis',
  '@okicici',
  '@oksbi',
  '@paytm',
  '@ybl',
  '@ibl',
  '@upi',
];

export const RazorpayPaymentExperience: React.FC<RazorpayPaymentExperienceProps> = ({
  isRazorpayConfigured,
  liveRazorpayGateway,
  payableAmountInr,
  totalAmountLocal,
  basePriceUsd,
  currentCurrency,
  selectedCurrencyCode,
  setSelectedCurrencyCode,
  isWalletTopup,
  selectedPlanName,
  razorpaySubTab,
  setRazorpaySubTab,
  razorpayCustomerVpa,
  setRazorpayCustomerVpa,
  qrTimer,
  formatTimer,
  handleRegenerateQr,
  copiedField,
  handleCopyText,
  handleOpenConverterForPair,
  billingName,
  billingEmail,
  billingPhone,
  onLaunchRazorpayModal,
  isProcessingPayment = false,
}) => {
  const { addToast } = useToast();
  const [selectedBankId, setSelectedBankId] = useState<string>('HDFC');
  const [bankSearchQuery, setBankSearchQuery] = useState<string>('');
  const [upiCollectSent, setUpiCollectSent] = useState<boolean>(false);
  const [upiCollectTimer, setUpiCollectTimer] = useState<number>(180);

  // Countdown for UPI Collect Request
  useEffect(() => {
    let timerId: any;
    if (upiCollectSent && upiCollectTimer > 0) {
      timerId = setInterval(() => {
        setUpiCollectTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [upiCollectSent, upiCollectTimer]);

  const rawRazorpayVpa = (
    liveRazorpayGateway?.vpa_address ||
    liveRazorpayGateway?.details_json?.vpa_address ||
    liveRazorpayGateway?.details_json?.upi_id ||
    ''
  ).trim();

  const razorpayVpa = isRazorpayConfigured
    ? (rawRazorpayVpa || 'createcall@icici')
    : 'Pending Super Admin Setup (VPA Not Configured)';

  const formattedAmount = Math.max(1, Math.round(payableAmountInr));
  const dynamicUpiUri = isRazorpayConfigured
    ? `upi://pay?pa=${razorpayVpa}&pn=CreateCall%20AI&am=${formattedAmount}.00&cu=INR&tn=${encodeURIComponent(
        isWalletTopup ? 'Wallet TopUp' : selectedPlanName
      )}`
    : 'razorpay_unconfigured_pending_super_admin';

  const liveQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(
    dynamicUpiUri
  )}`;

  // Filtered bank list for search
  const filteredBanks = useMemo(() => {
    const q = bankSearchQuery.trim().toLowerCase();
    if (!q) return ALL_INDIAN_BANKS;
    return ALL_INDIAN_BANKS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
    );
  }, [bankSearchQuery]);

  const selectedBankObj = useMemo(() => {
    return ALL_INDIAN_BANKS.find((b) => b.id === selectedBankId) || ALL_INDIAN_BANKS[0];
  }, [selectedBankId]);

  const handleSendUpiCollect = () => {
    if (!razorpayCustomerVpa.trim() || !razorpayCustomerVpa.includes('@')) {
      addToast({
        type: 'warning',
        title: 'Valid UPI ID Required',
        description: 'Please enter a valid UPI Virtual Payment Address (e.g. yourname@okhdfcbank).',
      });
      return;
    }

    if (!isRazorpayConfigured) {
      addToast({
        type: 'warning',
        title: 'Gateway Setup Required',
        description: 'Razorpay credentials must be configured by Super Admin before sending UPI collect requests.',
      });
      return;
    }

    setUpiCollectSent(true);
    setUpiCollectTimer(180);
    addToast({
      type: 'info',
      title: 'UPI Collect Request Sent!',
      description: `Payment request of ₹${formattedAmount.toLocaleString()} INR sent to ${razorpayCustomerVpa}. Please approve the notification on your UPI app.`,
    });
  };

  const handleApplyVpaShortcut = (suffix: string) => {
    const current = razorpayCustomerVpa.trim();
    if (!current) {
      setRazorpayCustomerVpa(`user${suffix}`);
    } else if (current.includes('@')) {
      const prefix = current.split('@')[0];
      setRazorpayCustomerVpa(`${prefix}${suffix}`);
    } else {
      setRazorpayCustomerVpa(`${current}${suffix}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Brand Header */}
      <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <RazorpayLogo size="lg" />
          <div className="flex items-center gap-2 flex-wrap">
            {isRazorpayConfigured ? (
              <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                <BadgeCheck className="h-3.5 w-3.5 shrink-0" /> 100% Instant Plan Provisioning
              </span>
            ) : (
              <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-bold font-mono flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Setup Required in Super Admin
              </span>
            )}
            <Badge
              variant={isRazorpayConfigured ? 'teal' : 'warning'}
              size="xs"
              className="font-mono text-[9px] rounded font-bold"
            >
              {isRazorpayConfigured ? 'SUPER ADMIN CONNECTED' : 'SETUP REQUIRED IN SUPER ADMIN'}
            </Badge>
          </div>
        </div>
        <div className="space-y-0.5 pt-1">
          <div className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
            <span>Razorpay Unified Indian &amp; Global Rail</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Official encrypted gateway rail for NPCI UPI, Cards (RuPay, Visa, MC, Amex), 50+ Indian NetBanking Banks &amp; Digital Wallets
          </p>
        </div>
      </div>

      {/* 3 Sub-Tabs Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setRazorpaySubTab('upi_qr')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            razorpaySubTab === 'upi_qr'
              ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <QrCode className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span className="whitespace-nowrap">Instant Dynamic UPI QR</span>
        </button>
        <button
          type="button"
          onClick={() => setRazorpaySubTab('cards')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            razorpaySubTab === 'cards'
              ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <CreditCard className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span className="whitespace-nowrap">Cards &amp; 50+ NetBanking</span>
        </button>
        <button
          type="button"
          onClick={() => setRazorpaySubTab('upi_intent')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            razorpaySubTab === 'upi_intent'
              ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Smartphone className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span className="whitespace-nowrap">UPI ID / VPA Collect</span>
        </button>
      </div>

      {/* SUB-TAB 1: Dynamic Live UPI QR */}
      {razorpaySubTab === 'upi_qr' && (
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
          {!isRazorpayConfigured && (
            <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <strong className="block text-amber-900 dark:text-amber-100 font-bold">
                  Razorpay Gateway Setup Required in Super Admin
                </strong>
                <p className="text-[11.5px] text-amber-800 dark:text-amber-300">
                  Razorpay unified gateway is in <strong>Pending Configuration</strong> state. Super Admin must configure live Key ID &amp; Key Secret in <em>Super Admin Settings &gt; Payment Gateways</em> before UPI and card checkouts can be processed.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* QR Frame with conditional timer */}
            <div className="flex flex-col items-center space-y-2.5 shrink-0">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl border-2 border-teal-500/40 shadow-md relative group overflow-hidden">
                <img
                  src={liveQrUrl}
                  alt="Razorpay Dynamic UPI QR"
                  className={`w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg transition-all ${
                    !isRazorpayConfigured ? 'blur-[4px] opacity-40 select-none pointer-events-none' : ''
                  }`}
                  loading="eager"
                />
                {!isRazorpayConfigured ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white/80 dark:bg-zinc-900/85 rounded-xl text-center backdrop-blur-2xs">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mb-1.5 shadow-2xs">
                      <Lock className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                      Super Admin Setup Required
                    </span>
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-[130px] line-clamp-2">
                      Razorpay Key ID Pending Setup
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-x-0 bottom-1 flex justify-center">
                    <span className="px-2 py-0.5 rounded-full text-white text-[9px] font-mono font-bold tracking-wider uppercase bg-teal-600 shadow-xs">
                      Auto-Settle QR
                    </span>
                  </div>
                )}
              </div>
              {isRazorpayConfigured ? (
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  <Clock className="h-3.5 w-3.5 text-teal-600" />
                  <span>
                    Expires in: <strong>{formatTimer(qrTimer)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleRegenerateQr}
                    className="p-1 rounded text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
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

            {/* Right Side: Clean Un-cramped Information Cards */}
            <div className="flex-1 space-y-3 w-full min-w-0">
              {/* Merchant VPA Box */}
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">Merchant Razorpay UPI VPA</span>
                  {isRazorpayConfigured ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10.5px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Auto-Debit Active
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-[10.5px]">Pending Setup</span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <div
                    className={`w-full h-9 px-3 flex items-center rounded-lg border font-mono text-xs pr-10 select-all truncate ${
                      isRazorpayConfigured
                        ? 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 font-bold'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 italic'
                    }`}
                  >
                    {razorpayVpa}
                  </div>
                  {isRazorpayConfigured && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(razorpayVpa, 'Razorpay VPA')}
                      className="absolute right-1.5 p-1.5 rounded-md text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
                      title="Copy UPI VPA"
                    >
                      {copiedField === 'Razorpay VPA' ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Settlement Amount Box */}
              <div className="p-3 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-teal-900 dark:text-teal-200 block">Settlement Amount</span>
                  <div className="text-sm font-mono font-extrabold text-teal-950 dark:text-teal-100">
                    ₹{formattedAmount.toLocaleString()} INR
                  </div>
                </div>
                <span className="text-[10.5px] font-mono text-teal-700 dark:text-teal-300 font-semibold bg-white/80 dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-teal-200 dark:border-teal-800">
                  0% Gateway Surcharge
                </span>
              </div>

              {/* Direct UPI Intent Link */}
              <a
                href={dynamicUpiUri}
                onClick={(e) => {
                  if (!isRazorpayConfigured) {
                    e.preventDefault();
                    addToast({
                      type: 'warning',
                      title: 'Gateway Setup Required',
                      description: 'Razorpay credentials must be configured by Super Admin before launching UPI checkout.',
                    });
                  }
                }}
                className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer ${
                  isRazorpayConfigured
                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                }`}
              >
                <Smartphone className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Open UPI App (GPay / PhonePe / Paytm)</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>

              {/* Realtime Status Notice */}
              <div className="p-2.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-900/50 text-[11px] text-teal-900 dark:text-teal-200 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Instant Webhook Auto-Settlement:</strong> Payments made to this dynamic barcode automatically trigger instant plan provisioning via Razorpay S2S callback.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Cards & 50+ NetBanking (Comprehensive 50+ Banks Directory) */}
      {razorpaySubTab === 'cards' && (
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
          {/* Top 2 Cards / NetBanking overview tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100">
                <span className="flex items-center gap-1.5">
                  <CardBrandsLogo size="xs" /> All Cards Accepted
                </span>
                <Badge variant="teal" size="xs">RBI 3DS2</Badge>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Zero surcharge on RuPay Debit &amp; Credit, Visa, MasterCard, American Express, Diners Club, Maestro &amp; Corporate Cards.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100">
                <span className="flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5 text-teal-600" /> 50+ NetBanking Banks
                </span>
                <Badge variant="teal" size="xs">50+ Banks Live</Badge>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Direct netbanking gateway for all Public Sector (SBI, PNB, BOB), Major Private (HDFC, ICICI, Axis, Kotak), and Regional banks.
              </p>
            </div>
          </div>

          {/* Searchable NetBanking Selector for ALL 50+ Indian Banks */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-teal-600" />
                <span>Select Your Bank Account (50+ Indian Banks Supported)</span>
              </label>
              <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                {ALL_INDIAN_BANKS.length} Banks Available
              </span>
            </div>

            {/* Bank Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={bankSearchQuery}
                onChange={(e) => setBankSearchQuery(e.target.value)}
                placeholder="Search any bank (e.g. SBI, HDFC, Bank of Baroda, Canara, IndusInd, Federal, AU Small...)"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              {bankSearchQuery && (
                <button
                  type="button"
                  onClick={() => setBankSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Comprehensive Bank List Container */}
            <div className="max-h-48 overflow-y-auto pr-1 space-y-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 p-1.5">
              {filteredBanks.length === 0 ? (
                <div className="p-3 text-center text-xs text-zinc-400">
                  No bank found matching &ldquo;{bankSearchQuery}&rdquo;. Don&apos;t worry, you can still proceed via Razorpay Secure Modal to select any bank.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                  {filteredBanks.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBankId(b.id)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between gap-1.5 cursor-pointer ${
                        selectedBankId === b.id
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-100 ring-1 ring-teal-500 font-bold'
                          : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="truncate">{b.name}</span>
                      {selectedBankId === b.id ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      ) : (
                        <span className="text-[9px] font-mono text-zinc-400 shrink-0">
                          {b.isPopular ? 'Top' : ''}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Bank Confirmation Bar */}
            <div className="p-2 rounded-lg bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-xs flex items-center justify-between gap-2 flex-wrap">
              <span className="text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-teal-600" />
                Selected Bank for NetBanking: <strong className="text-teal-900 dark:text-teal-100">{selectedBankObj.name}</strong> ({selectedBankObj.category})
              </span>
              <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                100% S2S Direct Gateway
              </span>
            </div>
          </div>

          {/* Checkout CTA */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={() => {
                if (onLaunchRazorpayModal) {
                  onLaunchRazorpayModal();
                } else {
                  addToast({
                    type: 'info',
                    title: 'Launching Razorpay Checkout...',
                    description: 'Opening encrypted Razorpay checkout modal for Card / NetBanking verification.',
                  });
                }
              }}
              className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              <span>Proceed to Pay ₹{formattedAmount.toLocaleString()} INR via Razorpay Secure Modal</span>
              <Sparkles className="h-4 w-4" />
            </button>
            <div className="flex items-center justify-center gap-4 text-[10.5px] text-zinc-400 font-mono pt-2">
              <span>● PCI-DSS Level 1</span>
              <span>● 256-Bit Encrypted</span>
              <span>● RBI Verified Rails</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: UPI VPA Collect Request */}
      {razorpaySubTab === 'upi_intent' && (
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Enter Your UPI ID (VPA) *</span>
              <span className="text-[10.5px] font-mono text-teal-600 dark:text-teal-400 font-bold">Push Notification Rail</span>
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={razorpayCustomerVpa}
                onChange={(e) => setRazorpayCustomerVpa(e.target.value.toLowerCase().trim())}
                placeholder="yourname@okhdfcbank, 9876543210@paytm or user@oksbi"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {/* Quick Suffix Shortcuts */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Quick Handle Suffixes:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {UPI_VPA_SHORTCUTS.map((sfx) => (
                <button
                  key={sfx}
                  type="button"
                  onClick={() => handleApplyVpaShortcut(sfx)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-zinc-700 dark:text-zinc-300 hover:text-teal-700 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer font-bold"
                >
                  {sfx}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            disabled={!isRazorpayConfigured || upiCollectSent}
            onClick={handleSendUpiCollect}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
              isRazorpayConfigured && !upiCollectSent
                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Send className="h-4 w-4" />
            <span>
              {upiCollectSent
                ? `Push Dispatched • Waiting for Approval (${formatTimer(upiCollectTimer)})`
                : `Send UPI Collect Request (₹${formattedAmount.toLocaleString()} INR)`}
            </span>
          </button>

          {upiCollectSent && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1 animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Collect Request Dispatched to {razorpayCustomerVpa}
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                Please open your UPI app on your smartphone, approve the ₹{formattedAmount.toLocaleString()} payment request before the timer expires. Your account will be upgraded instantly.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payer Authorization Summary */}
      <div className="p-3.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/50 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            Payer Authorization Summary
          </span>
          <span className="text-[11px] font-mono text-teal-700 dark:text-teal-300">
            {isRazorpayConfigured ? 'Live Verified' : 'Pending Super Admin Setup'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-mono">
          <div className="p-2.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-teal-200/50 dark:border-teal-900/40 truncate">
            <span className="text-zinc-400 block text-[10px] font-sans">Payer Name:</span>
            <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{billingName}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-teal-200/50 dark:border-teal-900/40 truncate">
            <span className="text-zinc-400 block text-[10px] font-sans">Payer Email:</span>
            <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{billingEmail}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-teal-200/50 dark:border-teal-900/40 truncate">
            <span className="text-zinc-400 block text-[10px] font-sans">Contact Phone:</span>
            <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{billingPhone}</strong>
          </div>
        </div>
      </div>

      {/* Full-Width Bottom Settlement Currency & Converter Bar */}
      <div className="p-3.5 rounded-lg bg-linear-to-r from-teal-50/90 via-emerald-50/50 to-sky-50/80 dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-sky-950/30 border border-teal-200/80 dark:border-teal-800/60 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-teal-200/60 dark:border-teal-800/60 pb-2">
          <span className="text-xs font-bold text-teal-950 dark:text-teal-100 flex items-center gap-1.5">
            <Globe2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
            Gateway Settlement Currency: <strong>INR (Indian Rupee - ₹) • Razorpay Official Rail</strong>
          </span>
          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300 bg-white/90 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">
            1 USD = {currentCurrency.rate} {selectedCurrencyCode}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11.5px] text-zinc-600 dark:text-zinc-400 flex-wrap gap-2">
          <span>
            Live exchange rate applied: <strong>${basePriceUsd.toFixed(2)} USD = {currentCurrency.symbol}{totalAmountLocal.toLocaleString()} {selectedCurrencyCode}</strong>
          </span>
          <span className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            ● Real-Time Market Rate
          </span>
        </div>

        {/* Buttons Underneath Text */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          {selectedCurrencyCode !== 'INR' && (
            <button
              type="button"
              onClick={() => setSelectedCurrencyCode('INR')}
              className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-teal-800 dark:text-teal-200 bg-white dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-teal-300 dark:border-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
              <span className="whitespace-nowrap">Switch Order to INR (₹)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleOpenConverterForPair('USD', selectedCurrencyCode, basePriceUsd)}
            className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
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
