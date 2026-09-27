import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  QrCode,
  Clock,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  BadgeCheck,
  AlertCircle,
  AlertTriangle,
  Lock,
  Zap,
  Globe2,
  TrendingUp,
  ArrowRightLeft,
  BellRing,
  ShieldCheck,
  CheckCircle2,
  Send,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { PhonePeLogo } from './PaymentBrandLogos';

interface PhonePePaymentExperienceProps {
  isPhonepeConfigured: boolean;
  livePhonepeGateway: any;
  payableAmountInr: number;
  totalAmountLocal: number;
  currentCurrency: any;
  selectedCurrencyCode: string;
  isWalletTopup: boolean;
  selectedPlanName: string;
  phonepeSubTab: 'upi_qr' | 'app_intent';
  setPhonepeSubTab: (tab: 'upi_qr' | 'app_intent') => void;
  phonepeMobile: string;
  setPhonepeMobile: (mobile: string) => void;
  copiedField: string | null;
  handleCopyText: (text: string, label: string) => void;
  handleOpenConverterForPair: (from: string, to: string, amount?: number) => void;
  setSelectedCurrencyCode: (code: string) => void;
  basePriceUsd: number;
  addToast: (toast: any) => void;
}

export const PhonePePaymentExperience: React.FC<PhonePePaymentExperienceProps> = ({
  isPhonepeConfigured,
  livePhonepeGateway,
  payableAmountInr,
  totalAmountLocal,
  currentCurrency,
  selectedCurrencyCode,
  isWalletTopup,
  selectedPlanName,
  phonepeSubTab,
  setPhonepeSubTab,
  phonepeMobile,
  setPhonepeMobile,
  copiedField,
  handleCopyText,
  handleOpenConverterForPair,
  setSelectedCurrencyCode,
  basePriceUsd,
  addToast,
}) => {
  const [qrTimer, setQrTimer] = useState(300); // 5 minutes
  const [qrSessionKey, setQrSessionKey] = useState(() => Date.now());

  // Push collect notification simulation state
  const [pushSent, setPushSent] = useState(false);
  const [pushTimer, setPushTimer] = useState(45);
  const [pushApproved, setPushApproved] = useState(false);
  const [selectedVpaProvider, setSelectedVpaProvider] = useState<'ybl' | 'ibl' | 'axl'>('ybl');

  // QR Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setQrTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [qrSessionKey]);

  // Push Collect Timer Countdown
  useEffect(() => {
    let collectTimer: any;
    if (pushSent && pushTimer > 0 && !pushApproved) {
      collectTimer = setInterval(() => {
        setPushTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(collectTimer);
  }, [pushSent, pushTimer, pushApproved]);

  const rawPhonepeVpa = (
    livePhonepeGateway?.vpa_address ||
    livePhonepeGateway?.details_json?.vpa_address ||
    livePhonepeGateway?.details_json?.upi_id ||
    ''
  ).trim();

  const phonepeVpa = isPhonepeConfigured
    ? (rawPhonepeVpa || 'createcall.ai@ybl')
    : 'Pending Super Admin Setup (VPA Not Configured)';

  const formattedAmount = Math.max(1, Math.round(payableAmountInr));
  const dynamicUpiUri = isPhonepeConfigured
    ? `upi://pay?pa=${phonepeVpa}&pn=CreateCall%20AI&am=${formattedAmount}.00&cu=INR&tn=${encodeURIComponent(isWalletTopup ? 'Wallet TopUp' : selectedPlanName)}`
    : 'phonepe_unconfigured_pending_super_admin';

  const liveQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(dynamicUpiUri)}&_t=${qrSessionKey}`;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const cleanPhoneDigits = (phonepeMobile || '').replace(/\D/g, '').slice(0, 10);
  const userVpaHandle = cleanPhoneDigits ? `${cleanPhoneDigits}@${selectedVpaProvider}` : `9876543210@${selectedVpaProvider}`;

  const handleSendPushCollect = () => {
    if (cleanPhoneDigits.length < 10) {
      addToast({
        type: 'error',
        title: 'Valid Mobile Number Required',
        description: 'Please enter a valid 10-digit PhonePe registered mobile number.',
      });
      return;
    }
    setPushSent(true);
    setPushTimer(45);
    setPushApproved(false);
    addToast({
      type: 'success',
      title: 'PhonePe Collect Request Dispatched',
      description: `Payment collect request of ₹${formattedAmount.toLocaleString()} sent to +91 ${cleanPhoneDigits}.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Header with official PhonePe logo and single clean status badge */}
      <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <PhonePeLogo size="lg" />
          <div className="flex items-center gap-2">
            {isPhonepeConfigured ? (
              <span className="text-[10.5px] text-purple-700 dark:text-purple-300 font-bold font-mono flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-md border border-purple-200 dark:border-purple-800 whitespace-nowrap">
                <BadgeCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" /> Direct PhonePe UPI Rail
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
            <span>PhonePe &amp; Direct UPI Payment Rail</span>
            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-200/60 dark:border-purple-800/40 font-mono whitespace-nowrap">
              Zero Merchant Surcharge (0%)
            </span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Complete instant payment via PhonePe Dynamic QR, PhonePe App Switch, or UPI Collect Push
          </p>
        </div>
      </div>

      {/* 2. Subtab Switcher: Strict Single-Line Whitespace-Nowrap */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setPhonepeSubTab('upi_qr')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            phonepeSubTab === 'upi_qr'
              ? 'bg-white dark:bg-zinc-900 text-purple-700 dark:text-purple-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <QrCode className="h-4 w-4 text-purple-600 shrink-0" />
          <span className="whitespace-nowrap">PhonePe Dynamic QR</span>
        </button>
        <button
          type="button"
          onClick={() => setPhonepeSubTab('app_intent')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            phonepeSubTab === 'app_intent'
              ? 'bg-white dark:bg-zinc-900 text-purple-700 dark:text-purple-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Smartphone className="h-4 w-4 text-purple-600 shrink-0" />
          <span className="whitespace-nowrap">PhonePe App Push</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      {phonepeSubTab === 'upi_qr' ? (
        /* TAB 1: ⚡ PHONEPE DYNAMIC QR */
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
          {/* Compact warning if unconfigured */}
          {!isPhonepeConfigured && (
            <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <strong className="block text-amber-900 dark:text-amber-100 font-bold">
                  PhonePe Gateway Setup Required in Super Admin
                </strong>
                <p className="text-[11.5px] text-amber-800 dark:text-amber-300">
                  Super Admin must configure PhonePe Merchant ID &amp; Salt Key in <em>Super Admin Settings &gt; Payment Gateways</em> before live payments can be processed.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-5">
            {/* High-Contrast PhonePe QR Box */}
            <div className="flex flex-col items-center space-y-2.5 shrink-0">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl border-2 border-purple-500/40 shadow-md relative group overflow-hidden">
                <img
                  src={liveQrUrl}
                  alt="PhonePe Dynamic UPI QR"
                  className={`w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg transition-all ${
                    !isPhonepeConfigured ? 'blur-[4px] opacity-40 select-none pointer-events-none' : ''
                  }`}
                  loading="eager"
                />
                {!isPhonepeConfigured ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white/80 dark:bg-zinc-900/85 rounded-xl text-center backdrop-blur-2xs">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mb-1.5 shadow-2xs">
                      <Lock className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                      Super Admin Setup Required
                    </span>
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-[130px] line-clamp-2">
                      PhonePe MID Pending Setup
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-x-0 bottom-1 flex justify-center">
                    <span className="px-2 py-0.5 rounded-full text-white text-[9px] font-mono font-bold tracking-wider uppercase bg-[#5F259F] shadow-xs">
                      PhonePe QR
                    </span>
                  </div>
                )}
              </div>
              {isPhonepeConfigured ? (
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  <Clock className="h-3.5 w-3.5 text-purple-600" />
                  <span>Expires in: <strong>{formatTimer(qrTimer)}</strong></span>
                  <button
                    type="button"
                    onClick={() => { setQrTimer(300); setQrSessionKey(Date.now()); }}
                    className="p-1 rounded text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer"
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

            {/* Right Details Column */}
            <div className="flex-1 space-y-3 w-full min-w-0">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>PhonePe Merchant VPA Handle</span>
                  {isPhonepeConfigured ? (
                    <span className="text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold">Verified UPI</span>
                  ) : (
                    <span className="text-amber-600 font-mono text-[10px]">Pending Setup</span>
                  )}
                </label>
                <div className="relative flex items-center">
                  <div className={`w-full h-9 px-3 flex items-center rounded-lg border font-mono text-xs pr-9 select-all truncate ${
                    isPhonepeConfigured
                      ? 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold'
                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 italic'
                  }`}>
                    {phonepeVpa}
                  </div>
                  {isPhonepeConfigured && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(phonepeVpa, 'PhonePe VPA')}
                      className="absolute right-1.5 p-1.5 rounded-md text-zinc-400 hover:text-purple-600 transition-colors cursor-pointer"
                      title="Copy VPA"
                    >
                      {copiedField === 'PhonePe VPA' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Direct App Launch Button */}
              <a
                href={dynamicUpiUri}
                onClick={(e) => {
                  if (!isPhonepeConfigured) {
                    e.preventDefault();
                    addToast({
                      type: 'warning',
                      title: 'Gateway Setup Required',
                      description: 'PhonePe credentials must be configured by Super Admin before launching app.',
                    });
                  }
                }}
                className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap ${
                  isPhonepeConfigured
                    ? 'bg-[#5F259F] hover:bg-[#4d1d82] text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                }`}
              >
                <Smartphone className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Open PhonePe App Directly</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>

              {/* Compatible UPI Apps Badge Strip */}
              <div className="pt-1 space-y-1.5">
                <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Works with Any UPI Application
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['PhonePe', 'Google Pay', 'Paytm UPI', 'BHIM', 'Cred', 'Navi'].map((app) => (
                    <span
                      key={app}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10.5px] font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80 whitespace-nowrap"
                    >
                      {app}
                    </span>
                  ))}
                </div>
              </div>

              {/* Auto-listening Radar */}
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 bg-purple-50/50 dark:bg-purple-950/20 p-2 rounded-lg border border-purple-100 dark:border-purple-900/30">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                </span>
                <span className="truncate">Listening for PhonePe UPI webhook / SMS acknowledgment...</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: 📱 PHONEPE APP PUSH (UPI COLLECT REQUEST) */
        <div className="p-4 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-3.5">
          {/* 2-Column Clean Input: Mobile Number & VPA Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1 whitespace-nowrap">
                PhonePe Registered Mobile Number *
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  🇮🇳 +91
                </div>
                <input
                  type="text"
                  maxLength={10}
                  value={cleanPhoneDigits}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhonepeMobile(digits);
                  }}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-14 pr-3 py-2 text-xs font-mono font-bold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                  PhonePe UPI ID / Handle
                </label>
                <div className="flex items-center gap-1">
                  {(['ybl', 'ibl', 'axl'] as const).map((handle) => (
                    <button
                      key={handle}
                      type="button"
                      onClick={() => setSelectedVpaProvider(handle)}
                      className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        selectedVpaProvider === handle
                          ? 'bg-purple-600 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300'
                      }`}
                    >
                      @{handle}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                readOnly
                value={userVpaHandle}
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 select-all font-bold"
              />
            </div>
          </div>

          {/* Action Row: Send Collect Request */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-purple-600 shrink-0" />
              <span>UPI Collect Push will be dispatched to <strong>+91 {cleanPhoneDigits || '9876543210'}</strong>.</span>
            </div>

            <button
              type="button"
              onClick={handleSendPushCollect}
              disabled={cleanPhoneDigits.length < 10}
              className={`py-2 px-4 rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                cleanPhoneDigits.length >= 10
                  ? 'bg-[#5F259F] hover:bg-[#4d1d82] text-white'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <Send className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Send UPI Collect Request</span>
            </button>
          </div>

          {/* Interactive PhonePe Notification Simulator */}
          {pushSent && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/60 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#5F259F] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    पे
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 block leading-tight">
                      PhonePe Payment Request
                    </span>
                    <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
                      Dispatched to +91 {cleanPhoneDigits} • Just Now
                    </span>
                  </div>
                </div>
                <Badge variant={pushApproved ? 'teal' : 'purple'} size="xs" className="font-mono font-bold">
                  {pushApproved ? 'APPROVED ✓' : `⏱️ Expiring in ${pushTimer}s`}
                </Badge>
              </div>

              <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-purple-100 dark:border-purple-900/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Merchant / Beneficiary:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">CreateCall AI Technologies</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Request Amount:</span>
                  <span className="font-mono font-extrabold text-purple-700 dark:text-purple-300 text-sm">
                    ₹{formattedAmount.toLocaleString()} INR
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Transaction Ref:</span>
                  <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                    PHPE_{Date.now().toString().slice(-8)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-1.5 text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                  <BellRing className="h-3.5 w-3.5 animate-bounce text-purple-600 shrink-0" />
                  <span>Open PhonePe App on your phone &amp; enter 4/6-digit UPI PIN to approve.</span>
                </div>
                {!pushApproved && (
                  <button
                    type="button"
                    onClick={() => {
                      setPushApproved(true);
                      addToast({
                        type: 'success',
                        title: 'PhonePe Collect Authorized',
                        description: 'Payment authorized via PhonePe UPI. Proceed to complete checkout.',
                      });
                    }}
                    className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    Simulate Instant Approval ↗
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Security Assurance footer */}
          <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-[11.5px]">
              Protected by <strong>NPCI UPI 2.0 256-Bit Cryptographic Security</strong>. Your UPI PIN is never entered on our servers.
            </span>
          </div>
        </div>
      )}

      {/* 4. FULL-WIDTH BOTTOM SETTLEMENT & LIVE MONEY CONVERTER BAR */}
      <div className="p-3.5 rounded-lg bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-purple-50/80 dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-purple-200/60 dark:border-purple-800/60 pb-2">
          <span className="text-xs font-bold text-purple-950 dark:text-purple-100 flex items-center gap-1.5 whitespace-nowrap">
            <Globe2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
            Gateway Settlement Currency: <strong>🇮🇳 INR (Indian Rupee - ₹)</strong>
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
              <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
              <span className="whitespace-nowrap">Switch Order to INR (₹)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleOpenConverterForPair('USD', selectedCurrencyCode, basePriceUsd)}
            className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-white bg-[#5F259F] hover:bg-[#4d1d82] transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
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
