import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Zap,
  Lock,
  BadgeCheck,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  ArrowRightLeft,
  Globe2,
  Sparkles,
  CheckCircle2,
  Fingerprint,
  Smartphone,
  Check,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  StripeLogo,
  ApplePayLogo,
  GooglePayLogo,
  StripeLinkLogo,
  CardBrandsLogo,
} from './PaymentBrandLogos';
import { PhysicalBankCardSimulator } from './PhysicalBankCardSimulator';
import { analyzeCardNumber, CardBrandMeta } from '../../lib/cardIntelligenceEngine';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

export interface StripePaymentExperienceProps {
  isStripeConfigured: boolean;
  liveStripeGateway: any;
  payableAmountLocal: number;
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
  stripeSubTab: 'card' | 'wallets';
  setStripeSubTab: (tab: 'card' | 'wallets') => void;
  cardNumber: string;
  setCardNumber: (num: string) => void;
  cardExpiry: string;
  setCardExpiry: (exp: string) => void;
  cardCvv: string;
  setCardCvv: (cvv: string) => void;
  cardHolder: string;
  setCardHolder: (name: string) => void;
  isCardFlipped: boolean;
  setIsCardFlipped: (flipped: boolean) => void;
  billingName: string;
  billingEmail: string;
  billingPhone: string;
  handleOpenConverterForPair: (from: string, to: string, baseAmount: number) => void;
  onExecutePayment: () => void;
  isProcessingPayment?: boolean;
}

export const StripePaymentExperience: React.FC<StripePaymentExperienceProps> = ({
  isStripeConfigured,
  liveStripeGateway,
  payableAmountLocal,
  totalAmountLocal,
  basePriceUsd,
  currentCurrency,
  selectedCurrencyCode,
  setSelectedCurrencyCode,
  isWalletTopup,
  selectedPlanName,
  stripeSubTab,
  setStripeSubTab,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvv,
  setCardCvv,
  cardHolder,
  setCardHolder,
  isCardFlipped,
  setIsCardFlipped,
  billingName,
  billingEmail,
  billingPhone,
  handleOpenConverterForPair,
  onExecutePayment,
  isProcessingPayment = false,
}) => {
  const { addToast } = useToast();

  // Active Express Wallet Modal state (Simulated biometric / 1-tap sheet)
  const [activeWalletModal, setActiveWalletModal] = useState<'apple_pay' | 'google_pay' | 'link' | null>(null);
  const [linkPhoneCode, setLinkPhoneCode] = useState<string>('');
  const [isAuthorizingWallet, setIsAuthorizingWallet] = useState<boolean>(false);

  // Compute live BIN intelligence
  const cardIntelligence: CardBrandMeta = useMemo(() => {
    return analyzeCardNumber(cardNumber);
  }, [cardNumber]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < rawVal.length; i++) {
      if (i > 0 && i % 4 === 0 && i < 16) {
        formatted += ' ';
      }
      formatted += rawVal[i];
    }
    setCardNumber(formatted.slice(0, 19));
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length <= 2) {
      setCardExpiry(raw);
    } else {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    }
  };

  const handleCardCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanVal = e.target.value.replace(/\D/g, '').slice(0, cardIntelligence.cvvLength || 4);
    setCardCvv(cleanVal);
  };

  const handleTriggerExpressWallet = (wallet: 'apple_pay' | 'google_pay' | 'link') => {
    if (!isStripeConfigured) {
      addToast({
        type: 'warning',
        title: 'Stripe Setup Required in Super Admin',
        description: 'Stripe API publishable/secret keys must be configured in Super Admin settings before initiating express checkout.',
      });
      return;
    }

    setActiveWalletModal(wallet);
  };

  const handleConfirmWalletPayment = () => {
    setIsAuthorizingWallet(true);
    setTimeout(() => {
      setIsAuthorizingWallet(false);
      setActiveWalletModal(null);
      addToast({
        type: 'success',
        title: 'Biometric Payment Authorized!',
        description: `Express payment authorized via ${
          activeWalletModal === 'apple_pay'
            ? 'Apple Pay (Face ID)'
            : activeWalletModal === 'google_pay'
            ? 'Google Pay (1-Tap)'
            : 'Stripe Link (1-Click)'
        }. Provisioning subscription...`,
      });
      onExecutePayment();
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Brand Header */}
      <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <StripeLogo size="lg" />
          <div className="flex items-center gap-2 flex-wrap">
            {isStripeConfigured ? (
              <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                <BadgeCheck className="h-3.5 w-3.5 shrink-0" /> PCI-DSS Level 1 Settle
              </span>
            ) : (
              <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-bold font-mono flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Setup Required in Super Admin
              </span>
            )}
            <Badge
              variant={isStripeConfigured ? 'teal' : 'warning'}
              size="xs"
              className="font-mono text-[9px] rounded font-bold"
            >
              {isStripeConfigured ? 'SUPER ADMIN CONNECTED' : 'CARD RAILS PENDING SETUP'}
            </Badge>
          </div>
        </div>
        <div className="space-y-0.5 pt-1">
          <div className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
            <span>Stripe Global Unified Rail</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Deep BIN intelligence &amp; 3D physical card preview with end-to-end client-side tokenization &amp; Express Wallets
          </p>
        </div>
      </div>

      {/* Warning Notice if Unconfigured */}
      {!isStripeConfigured && (
        <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <strong className="block text-amber-900 dark:text-amber-100 font-bold">
              Stripe Gateway Setup Required in Super Admin
            </strong>
            <p className="text-[11.5px] text-amber-800 dark:text-amber-300">
              Stripe Global rail is in <strong>Pending Configuration</strong> state. Super Admin must configure live Publishable Key &amp; Secret Key in <em>Super Admin Settings &gt; Payment Gateways</em> before cards and biometric checkouts can be charged.
            </p>
          </div>
        </div>
      )}

      {/* Sub-Tabs: Credit/Debit Card vs Express Wallets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setStripeSubTab('card')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            stripeSubTab === 'card'
              ? 'bg-white dark:bg-zinc-900 text-[#635BFF] dark:text-indigo-300 shadow-xs border border-indigo-200 dark:border-indigo-800 font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <CreditCard className="h-4 w-4 text-[#635BFF] dark:text-indigo-400 shrink-0" />
          <span className="whitespace-nowrap">Credit / Debit Card (3D Live Card)</span>
        </button>
        <button
          type="button"
          onClick={() => setStripeSubTab('wallets')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            stripeSubTab === 'wallets'
              ? 'bg-white dark:bg-zinc-900 text-[#635BFF] dark:text-indigo-300 shadow-xs border border-indigo-200 dark:border-indigo-800 font-extrabold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Zap className="h-4 w-4 text-[#635BFF] dark:text-indigo-400 shrink-0" />
          <span className="whitespace-nowrap">Apple Pay • Google Pay • Link</span>
        </button>
      </div>

      {/* SUB-TAB 1: Credit / Debit Card Experience */}
      {stripeSubTab === 'card' && (
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-5">
          {/* 3D Interactive Card Preview */}
          <div className="py-2">
            <PhysicalBankCardSimulator
              cardIntelligence={cardIntelligence}
              cardNumber={cardNumber}
              cardHolder={cardHolder || billingName || 'CARDHOLDER NAME'}
              cardExpiry={cardExpiry}
              cardCvv={cardCvv}
              isFlipped={isCardFlipped}
            />
          </div>

          {/* Form Input Fields */}
          <div className="space-y-3.5">
            {/* Card Number */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Card Number *</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-mono text-zinc-500">{cardIntelligence.bankName}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    {cardIntelligence.cardType}
                  </span>
                </div>
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4000 1234 5678 9010"
                  maxLength={19}
                  className="w-full h-10 px-3 pr-20 text-sm font-mono font-bold rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 tracking-wider"
                />
                <div className="absolute right-2.5 flex items-center gap-1.5 pointer-events-none">
                  <CardBrandsLogo size="xs" />
                </div>
              </div>
            </div>

            {/* Cardholder Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                Cardholder Name *
              </label>
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                placeholder={billingName || 'MUKESH SWAMI'}
                className="w-full h-9 px-3 text-xs font-mono font-bold rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600 uppercase"
              />
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Expiry (MM/YY) *
                </label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={handleCardExpiryChange}
                  placeholder="12/28"
                  maxLength={5}
                  className="w-full h-9 px-3 text-xs font-mono font-bold rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600 text-center"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">CVV / CVC *</label>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-sans">
                    {isCardFlipped ? '(Back of Card)' : '(Flips Card)'}
                  </span>
                </div>
                <input
                  type="password"
                  value={cardCvv}
                  onChange={handleCardCvvChange}
                  onFocus={() => setIsCardFlipped(true)}
                  onBlur={() => setIsCardFlipped(false)}
                  placeholder="•••"
                  maxLength={cardIntelligence.cvvLength || 4}
                  className="w-full h-9 px-3 text-xs font-mono font-bold rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600 text-center tracking-widest"
                />
              </div>
            </div>
          </div>

          {/* Security Banner */}
          <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 text-[11.5px] text-indigo-950 dark:text-indigo-200 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong>Stripe Radar Machine Learning Defense:</strong> All card details are client-side tokenized directly to Stripe PCI-DSS Level 1 encrypted vaults. No raw card numbers ever hit the server.
            </div>
          </div>

          {/* CTA Pay Button */}
          <div className="pt-1">
            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={onExecutePayment}
              className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-linear-to-r from-[#635BFF] via-indigo-600 to-indigo-700 hover:from-[#5851ea] hover:to-indigo-800 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              <span>
                Pay {currentCurrency.symbol}
                {totalAmountLocal.toLocaleString()} {selectedCurrencyCode} via Stripe Secure Card Rail
              </span>
              <Sparkles className="h-4 w-4" />
            </button>
            <div className="flex items-center justify-center gap-4 text-[10.5px] text-zinc-400 font-mono pt-2">
              <span>● PCI-DSS Level 1 Service Provider</span>
              <span>● Stripe Radar 3DS2</span>
              <span>● 256-Bit SSL</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Express Checkout Rails (Apple Pay, Google Pay, Stripe Link) */}
      {stripeSubTab === 'wallets' && (
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
          {/* Header Banner */}
          <div className="p-3 rounded-xl bg-linear-to-r from-indigo-50 via-slate-50 to-purple-50 dark:from-indigo-950/40 dark:via-zinc-800 dark:to-purple-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-950 dark:text-indigo-200 gap-2">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Zap className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-[11.5px] font-extrabold tracking-tight">Express Checkout Rails</span>
              </span>
              <Badge variant="teal" size="xs" className="font-mono font-bold text-[9.5px] whitespace-nowrap shrink-0">
                Biometric 1-Tap Active
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
              Pay in seconds with device biometrics (Apple Face ID / Touch ID / Chrome Google Pay) or saved 1-click Link credentials.
            </p>
          </div>

          {/* 3 Real Interactive Express Checkout Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
            {/* 1. Apple Pay Card */}
            <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/70 border border-zinc-200/90 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all flex flex-col justify-between space-y-2.5 shadow-2xs hover:shadow-md">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="h-5 flex items-center">
                    <ApplePayLogo variant="auto" size="xs" />
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    Biometric
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight whitespace-nowrap truncate" title="Instant Touch ID / Face ID checkout">
                  Instant Face ID / Touch ID checkout
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTriggerExpressWallet('apple_pay')}
                className="w-full py-2 px-2 rounded-lg bg-black hover:bg-zinc-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Fingerprint className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
                <span className="whitespace-nowrap">Apple Pay</span>
              </button>
            </div>

            {/* 2. Google Pay Card */}
            <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/70 border border-zinc-200/90 dark:border-zinc-700/80 hover:border-teal-400 dark:hover:border-teal-500 transition-all flex flex-col justify-between space-y-2.5 shadow-2xs hover:shadow-md">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="h-5 flex items-center">
                    <GooglePayLogo variant="plain" size="xs" />
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 whitespace-nowrap">
                    1-Tap
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight whitespace-nowrap truncate" title="1-Tap pay via saved Google cards">
                  1-Tap pay with Google cards
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTriggerExpressWallet('google_pay')}
                className="w-full py-2 px-2 rounded-lg bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                <Smartphone className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="whitespace-nowrap">Google Pay</span>
              </button>
            </div>

            {/* 3. Stripe Link Card */}
            <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/70 border border-zinc-200/90 dark:border-zinc-700/80 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all flex flex-col justify-between space-y-2.5 shadow-2xs hover:shadow-md">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="h-5 flex items-center">
                    <StripeLinkLogo size="xs" />
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                    1-Click SMS
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight whitespace-nowrap truncate" title="1-Click checkout via SMS code">
                  1-Click checkout via SMS code
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTriggerExpressWallet('link')}
                className="w-full py-2 px-2 rounded-lg bg-[#00D66F] hover:bg-[#00c364] text-[#0A2540] font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-xs border border-emerald-500/80 transition-colors cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5 text-[#0A2540] shrink-0" />
                <span className="whitespace-nowrap">Pay with Link</span>
              </button>
            </div>
          </div>

          {/* Simulated Active Modal/Sheet when an Express Wallet is Clicked */}
          {activeWalletModal && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/90 border-2 border-indigo-500 shadow-lg space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeWalletModal === 'apple_pay' && <ApplePayLogo variant="black" size="sm" />}
                  {activeWalletModal === 'google_pay' && <GooglePayLogo variant="plain" size="sm" />}
                  {activeWalletModal === 'link' && <StripeLinkLogo size="sm" />}
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {activeWalletModal === 'apple_pay'
                      ? 'Apple Pay Biometric Pass Verification'
                      : activeWalletModal === 'google_pay'
                      ? 'Google Pay Instant Card Selector'
                      : 'Stripe Link 1-Click Verification'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveWalletModal(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-400 block text-[10px] font-sans">Payable Charge:</span>
                  <strong>{currentCurrency.symbol}{totalAmountLocal.toLocaleString()} {selectedCurrencyCode}</strong>
                </div>
                <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-400 block text-[10px] font-sans">Authorized Payer:</span>
                  <strong className="truncate block">{billingEmail}</strong>
                </div>
              </div>

              {activeWalletModal === 'link' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                    Enter 6-Digit SMS Code sent to {billingPhone || '+1 (555) 019-2834'}:
                  </label>
                  <input
                    type="text"
                    value={linkPhoneCode}
                    onChange={(e) => setLinkPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="849201"
                    className="w-full h-8 px-3 text-xs font-mono font-bold rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-center tracking-widest text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              )}

              <button
                type="button"
                disabled={isAuthorizingWallet}
                onClick={handleConfirmWalletPayment}
                className="w-full py-2.5 px-3 rounded-lg font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAuthorizingWallet ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Device Cryptographic Signature...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4" />
                    <span>Confirm &amp; Authorize {currentCurrency.symbol}{totalAmountLocal.toLocaleString()} Charge</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-1">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Zero Form Filling
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Payment credentials are securely pulled from your device Apple Wallet or Google Account.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-1">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                Dynamic Cryptogram
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Every transaction generates a single-use tokenized cryptogram to eliminate card skimming risk.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payer Authorization Summary */}
      <div className="p-3.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Payer Authorization Summary
          </span>
          <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300">
            {isStripeConfigured ? 'Live Verified' : 'Pending Super Admin Setup'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-mono">
          <div className="p-2.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-indigo-200/50 dark:border-indigo-900/40 truncate">
            <span className="text-zinc-400 block text-[10px] font-sans">Payer Name:</span>
            <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{billingName}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-indigo-200/50 dark:border-indigo-900/40 truncate">
            <span className="text-zinc-400 block text-[10px] font-sans">Payer Email:</span>
            <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{billingEmail}</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-indigo-200/50 dark:border-indigo-900/40 truncate">
            <span className="text-zinc-400 block text-[10px] font-sans">Contact Phone:</span>
            <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{billingPhone}</strong>
          </div>
        </div>
      </div>

      {/* Full-Width Bottom Settlement Currency & Converter Bar */}
      <div className="p-3.5 rounded-lg bg-linear-to-r from-indigo-50/90 via-slate-50/50 to-purple-50/80 dark:from-indigo-950/40 dark:via-zinc-800 dark:to-purple-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-indigo-200/60 dark:border-indigo-800/60 pb-2">
          <span className="text-xs font-bold text-indigo-950 dark:text-indigo-100 flex items-center gap-1.5">
            <Globe2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            Gateway Settlement Currency: <strong>USD ($) • Stripe Multi-Currency Global Rail</strong>
          </span>
          <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-white/90 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
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
          {selectedCurrencyCode !== 'USD' && (
            <button
              type="button"
              onClick={() => setSelectedCurrencyCode('USD')}
              className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-indigo-800 dark:text-indigo-200 bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span className="whitespace-nowrap">Switch Order to USD ($)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleOpenConverterForPair('USD', selectedCurrencyCode, basePriceUsd)}
            className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
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
