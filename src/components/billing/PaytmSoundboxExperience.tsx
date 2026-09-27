import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  QrCode,
  Wallet,
  Clock,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Volume2,
  BadgeCheck,
  AlertCircle,
  AlertTriangle,
  Lock,
  Zap,
  Globe2,
  TrendingUp,
  ArrowRightLeft,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { PaytmLogo } from './PaymentBrandLogos';

interface PaytmSoundboxExperienceProps {
  isPaytmConfigured: boolean;
  livePaytmGateway: any;
  payableAmountInr: number;
  totalAmountLocal: number;
  currentCurrency: any;
  selectedCurrencyCode: string;
  isWalletTopup: boolean;
  selectedPlanName: string;
  paytmSubTab: 'upi_qr' | 'wallet_otp';
  setPaytmSubTab: (tab: 'upi_qr' | 'wallet_otp') => void;
  paytmMobile: string;
  setPaytmMobile: (mobile: string) => void;
  paytmOtpCode: string;
  setPaytmOtpCode: (otp: string) => void;
  paytmFastForward: boolean;
  setPaytmFastForward: (ff: boolean) => void;
  copiedField: string | null;
  handleCopyText: (text: string, label: string) => void;
  handleOpenConverterForPair: (from: string, to: string, amount?: number) => void;
  setSelectedCurrencyCode: (code: string) => void;
  basePriceUsd: number;
  addToast: (toast: any) => void;
}

export const PaytmSoundboxExperience: React.FC<PaytmSoundboxExperienceProps> = ({
  isPaytmConfigured,
  livePaytmGateway,
  payableAmountInr,
  totalAmountLocal,
  currentCurrency,
  selectedCurrencyCode,
  isWalletTopup,
  selectedPlanName,
  paytmSubTab,
  setPaytmSubTab,
  paytmMobile,
  setPaytmMobile,
  paytmOtpCode,
  setPaytmOtpCode,
  paytmFastForward,
  setPaytmFastForward,
  copiedField,
  handleCopyText,
  handleOpenConverterForPair,
  setSelectedCurrencyCode,
  basePriceUsd,
  addToast,
}) => {
  const [qrTimer, setQrTimer] = useState(300); // 5 minutes
  const [qrSessionKey, setQrSessionKey] = useState(() => Date.now());
  const [isSoundboxSpeaking, setIsSoundboxSpeaking] = useState(false);
  const [soundboxLang, setSoundboxLang] = useState<'hi' | 'en'>('hi');

  // QR Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setQrTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [qrSessionKey]);

  const rawPaytmVpa = (
    livePaytmGateway?.vpa_address ||
    livePaytmGateway?.details_json?.vpa_address ||
    livePaytmGateway?.details_json?.upi_id ||
    ''
  ).trim();

  const paytmVpa = isPaytmConfigured
    ? (rawPaytmVpa || 'createcall.paytm@paytm')
    : 'Pending Super Admin Setup (VPA Not Configured)';

  const formattedAmount = Math.max(1, Math.round(payableAmountInr));
  const dynamicUpiUri = isPaytmConfigured
    ? `upi://pay?pa=${paytmVpa}&pn=CreateCall%20AI&am=${formattedAmount}.00&cu=INR&tn=${encodeURIComponent(isWalletTopup ? 'Wallet TopUp' : selectedPlanName)}`
    : 'paytm_unconfigured_pending_super_admin';

  const liveQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(dynamicUpiUri)}&_t=${qrSessionKey}`;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Soundbox Voice Alert Synthesizer
  const playSoundboxVoice = (langOverride?: 'hi' | 'en') => {
    const activeLang = langOverride || soundboxLang;
    setIsSoundboxSpeaking(true);

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text =
          activeLang === 'hi'
            ? `Paytm par ${formattedAmount} rupaye prapt hue`
            : `Received ${formattedAmount} rupees on Paytm`;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.lang = activeLang === 'hi' ? 'hi-IN' : 'en-IN';

        utterance.onend = () => setIsSoundboxSpeaking(false);
        utterance.onerror = () => setIsSoundboxSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => setIsSoundboxSpeaking(false), 2200);
      }
    } catch {
      setTimeout(() => setIsSoundboxSpeaking(false), 2200);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 1. PAYTM HEADER & VERIFICATION BADGES */}
      <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <PaytmLogo size="lg" />
          <div className="flex items-center gap-2 flex-wrap">
            {isPaytmConfigured ? (
              <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                <BadgeCheck className="h-3.5 w-3.5" /> Direct UPI Rail
              </span>
            ) : (
              <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-bold font-mono flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                <AlertCircle className="h-3.5 w-3.5" /> Setup Required in Super Admin
              </span>
            )}
            <Badge
              variant={isPaytmConfigured ? 'teal' : 'warning'}
              size="sm"
              className="font-mono font-bold rounded-md px-2.5 py-0.5 whitespace-nowrap"
            >
              {isPaytmConfigured ? 'Paytm Verified' : 'Paytm Pending Setup'}
            </Badge>
          </div>
        </div>
        <div className="space-y-0.5 pt-1">
          <h3 className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
            Paytm Wallet &amp; Direct UPI Rail
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            Direct authorization with registered Paytm wallet balance, Soundbox QR and UPI intent
          </p>
        </div>
      </div>

      {/* 2. SUBTAB SWITCHER (STRICT SINGLE-LINE 2-COLUMNS) */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setPaytmSubTab('upi_qr')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            paytmSubTab === 'upi_qr'
              ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <QrCode className="h-4 w-4 text-sky-600 shrink-0" />
          <span className="whitespace-nowrap">Paytm Dynamic QR</span>
        </button>
        <button
          type="button"
          onClick={() => setPaytmSubTab('wallet_otp')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            paytmSubTab === 'wallet_otp'
              ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Wallet className="h-4 w-4 text-sky-600 shrink-0" />
          <span className="whitespace-nowrap">Paytm Wallet OTP</span>
        </button>
      </div>

      {/* 3. SUBTAB CONTENT */}
      {paytmSubTab === 'upi_qr' ? (
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
          {/* Warning banner if unconfigured */}
          {!isPaytmConfigured && (
            <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <strong className="block text-amber-900 dark:text-amber-100 font-bold whitespace-nowrap">
                  Paytm Gateway Setup Required in Super Admin
                </strong>
                <p className="text-[11.5px] text-amber-800 dark:text-amber-300">
                  Paytm direct rail is in <strong>Pending Configuration</strong> state. Super Admin must configure live Merchant ID &amp; Merchant Key in <em>Super Admin Settings &gt; Payment Gateways</em> before Soundbox and wallet checkouts can be processed.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-5">
            {/* Left QR Column */}
            <div className="flex flex-col items-center space-y-2.5 shrink-0">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl border-2 border-sky-500/40 shadow-md relative group overflow-hidden">
                <img
                  src={liveQrUrl}
                  alt="Paytm Dynamic QR"
                  className={`w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg transition-all ${
                    !isPaytmConfigured ? 'blur-[4px] opacity-40 select-none pointer-events-none' : ''
                  }`}
                  loading="eager"
                />
                {!isPaytmConfigured ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white/80 dark:bg-zinc-900/85 rounded-xl text-center backdrop-blur-2xs">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mb-1.5 shadow-2xs">
                      <Lock className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight whitespace-nowrap">
                      Super Admin Setup Required
                    </span>
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 whitespace-nowrap">
                      Paytm Merchant MID Pending Setup
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-x-0 bottom-1 flex justify-center">
                    <span className="px-2 py-0.5 rounded-full text-white text-[9px] font-mono font-bold tracking-wider uppercase bg-sky-600 shadow-xs whitespace-nowrap">
                      Paytm Soundbox QR
                    </span>
                  </div>
                )}
              </div>
              {isPaytmConfigured ? (
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  <Clock className="h-3.5 w-3.5 text-sky-600" />
                  <span className="whitespace-nowrap">Expires in: <strong>{formatTimer(qrTimer)}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setQrTimer(300);
                      setQrSessionKey(Date.now());
                      addToast({ type: 'info', title: 'QR Refreshed', description: 'Generated new dynamic UPI transaction session token.' });
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-sky-600 transition-colors cursor-pointer"
                    title="Refresh QR"
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
            <div className="flex-1 space-y-2.5 w-full min-w-0">
              {/* Merchant VPA */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span className="whitespace-nowrap">Paytm Merchant UPI VPA</span>
                  {isPaytmConfigured ? (
                    <span className="text-sky-600 font-mono text-[10px] whitespace-nowrap">Direct UPI</span>
                  ) : (
                    <span className="text-amber-600 font-mono text-[10px] whitespace-nowrap">Pending Setup</span>
                  )}
                </label>
                <div className="relative flex items-center">
                  <div
                    className={`w-full h-9 px-3 flex items-center rounded-lg border font-mono text-xs pr-9 select-all truncate ${
                      isPaytmConfigured
                        ? 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 italic'
                    }`}
                  >
                    {paytmVpa}
                  </div>
                  {isPaytmConfigured && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(paytmVpa, 'Paytm VPA')}
                      className="absolute right-1.5 p-1.5 rounded-md text-zinc-400 hover:text-sky-600 transition-colors cursor-pointer"
                      title="Copy Paytm VPA"
                    >
                      {copiedField === 'Paytm VPA' ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Soundbox Voice Chime Audio Simulator (Single Line) */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/50">
                <button
                  type="button"
                  onClick={() => playSoundboxVoice()}
                  disabled={isSoundboxSpeaking}
                  className="flex items-center gap-2 text-xs font-bold text-sky-900 dark:text-sky-200 hover:text-sky-600 transition-colors cursor-pointer whitespace-nowrap truncate"
                >
                  <Volume2 className="h-4 w-4 text-sky-600 shrink-0" />
                  <span className="whitespace-nowrap truncate">
                    {isSoundboxSpeaking
                      ? '🔊 Broadcasting Audio Chime...'
                      : `Play Chime: "${soundboxLang === 'hi' ? `Paytm par ₹${formattedAmount} prapt hue` : `Received ₹${formattedAmount} on Paytm`}"`}
                  </span>
                </button>
                <div className="flex items-center gap-1 text-[10px] font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setSoundboxLang('hi')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      soundboxLang === 'hi' ? 'bg-sky-600 text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    HI
                  </button>
                  <button
                    type="button"
                    onClick={() => setSoundboxLang('en')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      soundboxLang === 'en' ? 'bg-sky-600 text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {/* Open in Paytm App Button */}
              <a
                href={dynamicUpiUri}
                onClick={(e) => {
                  if (!isPaytmConfigured) {
                    e.preventDefault();
                    addToast({
                      type: 'warning',
                      title: 'Gateway Setup Required',
                      description: 'Paytm credentials must be configured by Super Admin before launching app.',
                    });
                  }
                }}
                className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap ${
                  isPaytmConfigured
                    ? 'bg-sky-600 hover:bg-sky-700 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                }`}
              >
                <Smartphone className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Open Paytm App Directly</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>

              {/* Auto Collect Webhook Box */}
              <div className="p-2.5 rounded bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/40 text-[11px] text-sky-950 dark:text-sky-200">
                <strong>Instant Soundbox Reconciliation:</strong> Payments made to this dynamic QR automatically trigger tenant activation with zero manual confirmation.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1 whitespace-nowrap">
                Paytm Registered Mobile Number *
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={paytmMobile}
                  onChange={(e) => setPaytmMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-sky-600"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1 whitespace-nowrap">
                Direct VPA Handle
              </label>
              <input
                type="text"
                readOnly
                value={`${paytmMobile || '9876543210'}@paytm`}
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 select-all"
              />
            </div>
          </div>
          <div className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-sky-600 shrink-0" />
              <span className="whitespace-nowrap">Fast 1-Tap OTP will be sent to confirm <strong>{currentCurrency.symbol}{totalAmountLocal.toLocaleString()}</strong></span>
            </div>
            <span className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
              Wallet Balance: ₹14,500.00
            </span>
          </div>
        </div>
      )}

      {/* 4. FULL-WIDTH BOTTOM SETTLEMENT & CONVERTER BAR */}
      <div className="p-3.5 rounded-lg bg-gradient-to-r from-teal-50/90 via-emerald-50/50 to-sky-50/80 dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-sky-950/30 border border-teal-200/80 dark:border-teal-800/60 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-teal-200/60 dark:border-teal-800/60 pb-2">
          <span className="text-xs font-bold text-teal-950 dark:text-teal-100 flex items-center gap-1.5 whitespace-nowrap">
            <Globe2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
            Gateway Settlement Currency: <strong>🇮🇳 INR (Indian Rupee - ₹)</strong>
          </span>
          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300 bg-white/90 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-teal-200 dark:border-teal-800 whitespace-nowrap">
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
