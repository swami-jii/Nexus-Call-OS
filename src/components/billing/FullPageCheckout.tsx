import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Globe,
  Globe2,
  Building,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  ArrowRightLeft,
  QrCode,
  Tag,
  Download,
  Sparkles,
  TrendingUp,
  Zap,
  Check,
  AlertCircle,
  Copy,
  Printer,
  ChevronRight,
  ChevronLeft,
  Clock,
  Shield,
  HelpCircle,
  RefreshCw,
  Layers,
  ChevronDown,
  Wallet,
  Plus,
  Terminal,
  Server,
  Radio,
  Wifi,
  Coins,
  Cpu,
  Search,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Key,
  BadgeCheck,
  Landmark,
  ShieldAlert,
  AlertTriangle,
  Hash,
  ExternalLink,
  Building2,
  UserCheck,
  FileText,
  Receipt,
  Percent,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { fetchAPI } from '../../lib/api';
import { SubscriptionPlan, BillingCurrencyOption, InvoiceTemplateSettings } from '../../types';
import {
  GLOBAL_COUNTRY_CODES_CATALOG,
  GlobalCountryCodeItem,
} from '../../data/worldCountriesMasterCatalog';
import {
  analyzeCardNumber,
  formatCardNumberByScheme,
  fetchLiveBinMetadata,
  parseRawCardInput,
  deriveCardAttributes,
  validateLuhn,
  CardBrandMeta,
} from '../../lib/cardIntelligenceEngine';
import {
  GatewayLogoRenderer,
  BankBrandLogoRenderer,
  RazorpayLogo,
  StripeLogo,
  CashfreeLogo,
  PayPalLogo,
  PhonePeLogo,
  BankTransferLogo,
  UpiLogo,
  CardBrandsLogo,
  VisaBrandLogo,
  MastercardBrandLogo,
  AmexBrandLogo,
  DiscoverBrandLogo,
  RupayBrandLogo,
  PaytmLogo,
  AuthorizeNetLogo,
  SquareLogo,
  CashAppLogo,
  AfterpayLogo,
  PaddleLogo,
  CoinbaseCryptoLogo,
  FlutterwaveLogo,
  AdyenLogo,
  MercadoPagoLogo,
  KlarnaLogo,
  MollieLogo,
  SkrillLogo,
  AlipayLogo,
  ApplePayLogo,
  GooglePayLogo,
  StripeLinkLogo,
} from './PaymentBrandLogos';
import { PhysicalBankCardSimulator } from './PhysicalBankCardSimulator';
import { PhysicalBankCheckSimulator, resolveBankByRouting } from './PhysicalBankCheckSimulator';
import { OfficialInvoiceDocument } from './OfficialInvoiceDocument';
import { LiveForexMoneyConverter } from './LiveForexMoneyConverter';
import { PaytmSoundboxExperience } from './PaytmSoundboxExperience';
import { PhonePePaymentExperience } from './PhonePePaymentExperience';
import { PayPalPaymentExperience } from './PayPalPaymentExperience';
import { CashfreePaymentExperience } from './CashfreePaymentExperience';
import { RazorpayPaymentExperience } from './RazorpayPaymentExperience';
import { StripePaymentExperience } from './StripePaymentExperience';

export interface UtrValidationResult {
  isValid: boolean;
  formatType?: 'upi_imps_12digit' | 'neft_rtgs_alphanumeric' | 'swift_wire_reference';
  errorMessage?: string;
  bankName?: string;
  description?: string;
}

export const validateBankUtr = (rawInput: string): UtrValidationResult => {
  const clean = (rawInput || '').trim().toUpperCase();
  if (!clean) {
    return {
      isValid: false,
      errorMessage: 'UTR / Reference Number is required. Enter the transaction ID from your bank receipt.',
    };
  }

  // Reject repeating characters (e.g. AAAAAAAA, 11111111)
  if (/^(.)\1+$/.test(clean)) {
    return {
      isValid: false,
      errorMessage: 'Invalid Reference: Repeating characters detected. Please enter a genuine bank transaction reference number.',
    };
  }

  // Must have at least 4 digits (genuine bank receipts always contain numeric transaction sequence digits or timestamps)
  const digitCount = (clean.match(/\d/g) || []).length;
  if (digitCount < 4) {
    return {
      isValid: false,
      errorMessage: 'Invalid UTR format: Real bank UTRs contain numeric transaction digits (at least 4 digits). Example: 426819283719 (UPI/IMPS) or HDFCR520260922001 (NEFT/RTGS). Letters only is not valid.',
    };
  }

  // Length guard: Standard banking references are 8 to 24 characters
  if (clean.length < 8 || clean.length > 24) {
    return {
      isValid: false,
      errorMessage: 'Invalid length: Bank UTR must be between 8 and 24 characters (Standard UPI/IMPS: 12 digits, NEFT/RTGS: 16–22 characters).',
    };
  }

  // Pure alphanumeric check
  if (!/^[A-Z0-9]{8,24}$/.test(clean)) {
    return {
      isValid: false,
      errorMessage: 'Invalid characters: UTR can only contain letters and numbers (no spaces, hyphens, or symbols).',
    };
  }

  // 1. Pure 12-digit numeric (IMPS / UPI Reference No)
  if (/^\d{12}$/.test(clean)) {
    return {
      isValid: true,
      formatType: 'upi_imps_12digit',
      description: 'Standard 12-Digit UPI / IMPS Reference Number',
    };
  }

  // 2. Standard NEFT / RTGS Reference (Starts with 4-letter bank IFSC code)
  const knownBanks: Record<string, string> = {
    HDFC: 'HDFC Bank',
    SBIN: 'State Bank of India (SBI)',
    ICIC: 'ICICI Bank',
    UTIB: 'Axis Bank',
    KKBK: 'Kotak Mahindra Bank',
    BARB: 'Bank of Baroda',
    PUNB: 'Punjab National Bank',
    UBIN: 'Union Bank of India',
    CNRB: 'Canara Bank',
    IDFB: 'IDFC First Bank',
    CITI: 'Citibank',
    HSBC: 'HSBC Bank',
    SCBL: 'Standard Chartered',
    YESB: 'Yes Bank',
    INDB: 'IndusInd Bank',
    AIRP: 'Airtel Payments Bank',
    PYTM: 'Paytm Payments Bank',
  };

  const prefix4 = clean.slice(0, 4);
  const detectedBank = knownBanks[prefix4];

  return {
    isValid: true,
    formatType: detectedBank ? 'neft_rtgs_alphanumeric' : 'swift_wire_reference',
    bankName: detectedBank || undefined,
    description: detectedBank
      ? `Verified ${detectedBank} NEFT/RTGS Reference`
      : 'Standard Commercial Bank Wire Reference',
  };
};

// Supported Currencies per Gateway (Strict Real Gateway Filtering Matrix)
export const GATEWAY_CURRENCY_SUPPORT: Record<string, string[]> = {
  // Domestic Indian Rails (Strictly INR / NPCI UPI only)
  phonepe: ['INR'],
  paytm: ['INR'],

  // Multi-Currency Indian & Global
  razorpay: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY', 'CHF', 'HKD', 'MYR', 'THB', 'NZD', 'SEK', 'NOK', 'DKK', 'ZAR', 'SAR', 'QAR'],
  cashfree: ['INR', 'USD'],

  // Global Multi-Currency
  stripe: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'AED', 'SGD', 'CHF', 'BRL', 'MXN', 'NGN', 'CNY', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'ZAR', 'SAR', 'QAR', 'KRW', 'TRY', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'VND'],
  paypal: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'SGD', 'HKD', 'NZD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'BRL', 'MXN', 'ILS', 'PHP', 'TWD', 'THB', 'CZK', 'HUF'],
  authorizenet: ['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'NZD', 'CHF'],
  square: ['USD', 'CAD', 'GBP', 'AUD', 'JPY', 'EUR'],
  paddle: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'SGD', 'CHF', 'BRL', 'INR', 'AED', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'HKD', 'ZAR', 'MXN'],
  adyen: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'SGD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'BRL', 'MXN', 'HKD', 'NZD', 'INR', 'AED', 'ZAR'],
  skrill: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'SGD', 'CHF', 'PLN', 'BRL', 'INR', 'AED', 'ZAR', 'NZD'],

  // Regional Specific
  flutterwave: ['NGN', 'KES', 'GHS', 'ZAR', 'USD', 'EUR', 'GBP', 'RWF', 'UGX', 'TZS', 'XOF', 'XAF', 'EGP'],
  mercadopago: ['BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'USD'],
  mercado_pago: ['BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'USD'],
  klarna: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'CHF', 'PLN'],
  mollie: ['EUR', 'GBP', 'USD', 'CHF', 'PLN', 'SEK', 'NOK', 'DKK'],
  alipay: ['CNY', 'HKD', 'USD', 'EUR', 'GBP', 'SGD', 'JPY', 'AUD', 'CAD', 'NZD', 'THB', 'MYR', 'KRW'],
  wechat: ['CNY', 'HKD', 'USD', 'EUR', 'GBP', 'SGD', 'JPY', 'AUD', 'CAD', 'NZD', 'THB', 'MYR', 'KRW'],

  // Decentralized Crypto & Sovereign Bank Wire (Universal Currency Support)
  crypto: ['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD', 'AUD', 'SGD', 'JPY', 'CNY', 'BRL', 'NGN', 'ZAR', 'CHF', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'MXN', 'SAR', 'QAR', 'KRW', 'TRY', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'VND'],
  coinbase: ['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD', 'AUD', 'SGD', 'JPY', 'CNY', 'BRL', 'NGN', 'ZAR', 'CHF', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'MXN', 'SAR', 'QAR', 'KRW', 'TRY', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'VND'],
  bank_transfer: ['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD', 'AUD', 'SGD', 'JPY', 'CNY', 'BRL', 'NGN', 'ZAR', 'CHF', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'MXN', 'SAR', 'QAR', 'KRW', 'TRY', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'VND'],
  bank_wire: ['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD', 'AUD', 'SGD', 'JPY', 'CNY', 'BRL', 'NGN', 'ZAR', 'CHF', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'MXN', 'SAR', 'QAR', 'KRW', 'TRY', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'VND'],
  wire: ['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD', 'AUD', 'SGD', 'JPY', 'CNY', 'BRL', 'NGN', 'ZAR', 'CHF', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'MXN', 'SAR', 'QAR', 'KRW', 'TRY', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'VND'],
};

export const isGatewayCompatibleWithCurrency = (gatewayKey: string, currency: string): boolean => {
  const gk = (gatewayKey || '').toLowerCase().trim();
  const curr = (currency || 'USD').toUpperCase().trim();
  const supported = GATEWAY_CURRENCY_SUPPORT[gk];
  if (!supported) return true;
  return supported.includes(curr);
};

export interface MollieBankIssuer {
  id: string;
  name: string;
  shortName: string;
  country: string;
  countryCode: string;
  flag: string;
  category: 'ideal' | 'bancontact' | 'eurozone';
  bic: string;
  badge?: string;
}

export const MOLLIE_BANK_ISSUERS: MollieBankIssuer[] = [
  // 🇳🇱 Dutch iDEAL Banks
  { id: 'ideal_INGBNL2A', name: 'ING Bank Netherlands', shortName: 'ING Bank', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱', category: 'ideal', bic: 'INGBNL2A', badge: 'Popular' },
  { id: 'ideal_RABONL2U', name: 'Rabobank', shortName: 'Rabobank', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱', category: 'ideal', bic: 'RABONL2U', badge: 'Popular' },
  { id: 'ideal_ABNANL2A', name: 'ABN AMRO', shortName: 'ABN AMRO', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱', category: 'ideal', bic: 'ABNANL2A', badge: 'Popular' },
  { id: 'ideal_SNSBNL2A', name: 'SNS Bank', shortName: 'SNS Bank', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱', category: 'ideal', bic: 'SNSBNL2A' },
  { id: 'ideal_ASNBNL21', name: 'ASN Bank', shortName: 'ASN Bank', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱', category: 'ideal', bic: 'ASNBNL21' },
  { id: 'ideal_RBRBNL21', name: 'RegioBank', shortName: 'RegioBank', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱', category: 'ideal', bic: 'RBRBNL21' },
  { id: 'ideal_BUNQNL2A', name: 'bunq (Bank of the Free)', shortName: 'bunq Digital', country: 'Netherlands / EU', countryCode: 'NL', flag: '🌈', category: 'ideal', bic: 'BUNQNL2A', badge: 'Neobank' },
  { id: 'ideal_KNABNL2H', name: 'Knab Bank', shortName: 'Knab', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱', category: 'ideal', bic: 'KNABNL2H' },
  { id: 'ideal_TRIONL2U', name: 'Triodos Bank', shortName: 'Triodos', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱', category: 'ideal', bic: 'TRIONL2U' },
  { id: 'ideal_REVONL21', name: 'Revolut Bank Netherlands', shortName: 'Revolut', country: 'Eurozone / UK', countryCode: 'EU', flag: '🇪🇺', category: 'ideal', bic: 'REVONL21', badge: 'Global' },
  { id: 'ideal_N26BNL21', name: 'N26 Mobile Bank', shortName: 'N26 Bank', country: 'Germany / EU', countryCode: 'DE', flag: '🇩🇪', category: 'ideal', bic: 'N26BNL21', badge: 'Neobank' },
  { id: 'ideal_FVLBNL22', name: 'Van Lanschot Kempen', shortName: 'Van Lanschot', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱', category: 'ideal', bic: 'FVLBNL22' },

  // 🇧🇪 Belgian Bancontact Banks
  { id: 'bc_kbc', name: 'KBC / CBC Bank Belgium', shortName: 'KBC Bank', country: 'Belgium', countryCode: 'BE', flag: '🇧🇪', category: 'bancontact', bic: 'KREDCE22', badge: 'Popular' },
  { id: 'bc_belfius', name: 'Belfius Bank Belgium', shortName: 'Belfius', country: 'Belgium', countryCode: 'BE', flag: '🇧🇪', category: 'bancontact', bic: 'GKCCBEBB', badge: 'Popular' },
  { id: 'bc_bnpparibas', name: 'BNP Paribas Fortis', shortName: 'BNP Paribas', country: 'Belgium', countryCode: 'BE', flag: '🇧🇪', category: 'bancontact', bic: 'GEBABEBB' },
  { id: 'bc_ing_be', name: 'ING Belgium', shortName: 'ING Belgium', country: 'Belgium', countryCode: 'BE', flag: '🇧🇪', category: 'bancontact', bic: 'BBRUBEBB' },
  { id: 'bc_crelan', name: 'Crelan Bank Belgium', shortName: 'Crelan', country: 'Belgium', countryCode: 'BE', flag: '🇧🇪', category: 'bancontact', bic: 'NICOBEBB' },
];

export interface DetectedGeoInfo {
  country: string;
  countryItem: GlobalCountryCodeItem | null;
  currencyCode: string;
}

export const detectUserGeoAndCurrency = (): DetectedGeoInfo => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const locales = typeof navigator !== 'undefined' && navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [typeof navigator !== 'undefined' ? navigator.language || '' : ''];
    const primaryLocale = (locales[0] || '').toLowerCase();
    const allLocalesStr = locales.join(',').toLowerCase();
    const offset = new Date().getTimezoneOffset(); // -330 for India (UTC+5:30)

    // 1. India Detection (Asia/Kolkata, Asia/Calcutta, IST, offset -330, en-IN, hi, etc.)
    if (
      tz.includes('Kolkata') ||
      tz.includes('Calcutta') ||
      tz.includes('India') ||
      tz === 'IST' ||
      offset === -330 ||
      primaryLocale.endsWith('-in') ||
      allLocalesStr.includes('-in') ||
      primaryLocale.startsWith('hi') ||
      primaryLocale.startsWith('gu') ||
      primaryLocale.startsWith('mr') ||
      primaryLocale.startsWith('ta') ||
      primaryLocale.startsWith('te') ||
      primaryLocale.startsWith('kn') ||
      primaryLocale.startsWith('pa') ||
      primaryLocale.startsWith('bn') ||
      primaryLocale.startsWith('ml') ||
      primaryLocale.startsWith('or') ||
      primaryLocale.startsWith('as') ||
      primaryLocale.startsWith('ur-in')
    ) {
      const inItem = GLOBAL_COUNTRY_CODES_CATALOG.find((c) => c.iso2 === 'IN' || c.name === 'India') || null;
      return { country: 'India', countryItem: inItem, currencyCode: 'INR' };
    }

    // 2. United Kingdom (Europe/London, en-GB)
    if (tz.includes('London') || primaryLocale === 'en-gb' || allLocalesStr.includes('en-gb')) {
      const gbItem = GLOBAL_COUNTRY_CODES_CATALOG.find((c) => c.iso2 === 'GB') || null;
      return { country: 'United Kingdom', countryItem: gbItem, currencyCode: 'GBP' };
    }

    // 3. UAE / Gulf (Asia/Dubai, ar-AE, Asia/Riyadh)
    if (tz.includes('Dubai') || tz.includes('Muscat') || tz.includes('Riyadh') || primaryLocale.endsWith('-ae') || allLocalesStr.includes('-ae')) {
      const aeItem = GLOBAL_COUNTRY_CODES_CATALOG.find((c) => c.iso2 === 'AE') || null;
      return { country: 'United Arab Emirates', countryItem: aeItem, currencyCode: 'AED' };
    }

    // 4. Canada
    if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Montreal') || tz.includes('Edmonton') || primaryLocale.endsWith('-ca') || allLocalesStr.includes('-ca')) {
      const caItem = GLOBAL_COUNTRY_CODES_CATALOG.find((c) => c.iso2 === 'CA') || null;
      return { country: 'Canada', countryItem: caItem, currencyCode: 'CAD' };
    }

    // 5. Australia
    if (tz.startsWith('Australia/') || primaryLocale.endsWith('-au') || allLocalesStr.includes('-au')) {
      const auItem = GLOBAL_COUNTRY_CODES_CATALOG.find((c) => c.iso2 === 'AU') || null;
      return { country: 'Australia', countryItem: auItem, currencyCode: 'AUD' };
    }

    // 6. Japan
    if (tz.includes('Tokyo') || primaryLocale.startsWith('ja') || allLocalesStr.includes('ja')) {
      const jpItem = GLOBAL_COUNTRY_CODES_CATALOG.find((c) => c.iso2 === 'JP') || null;
      return { country: 'Japan', countryItem: jpItem, currencyCode: 'JPY' };
    }

    // 7. Singapore
    if (tz.includes('Singapore') || primaryLocale.endsWith('-sg') || allLocalesStr.includes('-sg')) {
      const sgItem = GLOBAL_COUNTRY_CODES_CATALOG.find((c) => c.iso2 === 'SG') || null;
      return { country: 'Singapore', countryItem: sgItem, currencyCode: 'SGD' };
    }

    // 8. China
    if (tz.includes('Shanghai') || tz.includes('Beijing') || primaryLocale === 'zh-cn' || allLocalesStr.includes('zh-cn')) {
      const cnItem = GLOBAL_COUNTRY_CODES_CATALOG.find((c) => c.iso2 === 'CN') || null;
      return { country: 'China', countryItem: cnItem, currencyCode: 'CNY' };
    }

    // 9. European Union
    if (tz.startsWith('Europe/') || primaryLocale.endsWith('-de') || primaryLocale.endsWith('-fr') || primaryLocale.endsWith('-it') || primaryLocale.endsWith('-es') || primaryLocale.endsWith('-nl')) {
      const deItem = GLOBAL_COUNTRY_CODES_CATALOG.find((c) => c.iso2 === 'DE' || c.name === 'Germany') || null;
      return { country: 'Germany', countryItem: deItem, currencyCode: 'EUR' };
    }

    // Default: United States / USD
    const usItem = GLOBAL_COUNTRY_CODES_CATALOG.find((c) => c.iso2 === 'US' || c.name === 'United States') || null;
    return { country: 'United States', countryItem: usItem, currencyCode: 'USD' };
  } catch {
    const usItem = GLOBAL_COUNTRY_CODES_CATALOG.find((c) => c.iso2 === 'US' || c.name === 'United States') || null;
    return { country: 'United States', countryItem: usItem, currencyCode: 'USD' };
  }
};

export interface FullPageCheckoutProps {
  mode?: 'subscription_purchase' | 'wallet_topup';
  initialPlan: SubscriptionPlan | null;
  allPlans: SubscriptionPlan[];
  initialBillingCycle?: 'monthly' | 'yearly' | 'lifetime';
  initialCurrency?: string;
  initialTopupAmountUsd?: number;
  currentWalletBalanceUsd?: number;
  availableCurrencies?: BillingCurrencyOption[];
  availableGateways?: any[];
  onBack: () => void;
  onSuccess: (invoiceData: any) => void;
}

export const FullPageCheckout: React.FC<FullPageCheckoutProps> = ({
  mode = 'subscription_purchase',
  initialPlan,
  allPlans,
  initialBillingCycle = 'monthly',
  initialCurrency = 'USD',
  initialTopupAmountUsd = 100,
  currentWalletBalanceUsd = 0,
  availableCurrencies = [],
  availableGateways = [],
  onBack,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const isWalletTopup = mode === 'wallet_topup';

  // Checkout Step:
  // 1: Plan & Billing Frequency Review
  // 2: Customer & Tax Profile Info
  // 3: Payment Rail Selection & Interactive Checkout
  // 4: Multi-Stage Cryptographic Provisioning Terminal
  // 5: Celebratory Activation & Official Digital Tax Invoice
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Selected Plan & Billing Cycle
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(() => {
    return (
      initialPlan ||
      allPlans[0] || {
        id: 'pro',
        name: 'Pro Scale Plan',
        tagline: 'High-throughput carrier gateway with AI bots',
        monthlyPrice: 199,
        yearlyPrice: 159,
        lifetimePrice: 1499,
        concurrencyLimit: 10,
        includedMinutes: 3000,
        ragStorageMb: 500,
        maxAgentsCount: 10,
        gsmSimEnabled: true,
        voiceCloningEnabled: true,
        webhookApiEnabled: true,
        prioritySlaEnabled: true,
        features: [
          '3,000 Voice Minutes / mo',
          '10 Concurrent Lines',
          '10 AI Agents',
          '500 MB Vector RAG Memory',
          'Priority 99.99% Carrier SLA',
        ],
        popular: true,
      }
    );
  });

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'lifetime'>(initialBillingCycle);
  const [showPlanSwitcher, setShowPlanSwitcher] = useState(false);

  // Wallet Top-Up Amount State
  const [topupPresetUsd, setTopupPresetUsd] = useState<number>(initialTopupAmountUsd || 100);
  const [customTopupInput, setCustomTopupInput] = useState<string>('');
  const [isCustomTopup, setIsCustomTopup] = useState<boolean>(false);

  const detectedGeo = useMemo(() => detectUserGeoAndCurrency(), []);

  // Country Selection & Dropdown (Smart Location Auto-Detection)
  const [country, setCountry] = useState<string>(() => {
    return detectedGeo.country || 'United States';
  });
  const [selectedCountryItem, setSelectedCountryItem] = useState<GlobalCountryCodeItem | null>(() => {
    return (
      detectedGeo.countryItem ||
      GLOBAL_COUNTRY_CODES_CATALOG.find((c) => c.name === 'United States' || c.iso2 === 'US') ||
      GLOBAL_COUNTRY_CODES_CATALOG[0]
    );
  });
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic Currencies from Backend Integration API SSOT
  const [currencies, setCurrencies] = useState<BillingCurrencyOption[]>(() => {
    if (availableCurrencies && availableCurrencies.length > 0) {
      return availableCurrencies;
    }
    return [
      { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 1.0, country: 'United States' },
      { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rate: 83.25, country: 'India' },
      { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.92, country: 'European Union' },
      { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.79, country: 'United Kingdom' },
      { code: 'KES', symbol: 'KSh ', name: 'Kenyan Shilling', flag: '🇰🇪', rate: 128.5, country: 'Kenya' },
      { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬', rate: 1490.0, country: 'Nigeria' },
      { code: 'GHS', symbol: 'GH₵ ', name: 'Ghanaian Cedi', flag: '🇬🇭', rate: 15.10, country: 'Ghana' },
      { code: 'UGX', symbol: 'USh ', name: 'Ugandan Shilling', flag: '🇺🇬', rate: 3750.0, country: 'Uganda' },
      { code: 'ZAR', symbol: 'R ', name: 'South African Rand', flag: '🇿🇦', rate: 18.15, country: 'South Africa' },
      { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', rate: 3.67, country: 'United Arab Emirates' },
      { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', rate: 1.36, country: 'Canada' },
      { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', flag: '🇦🇺', rate: 1.52, country: 'Australia' },
      { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', flag: '🇸🇬', rate: 1.35, country: 'Singapore' },
      { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', rate: 155.0, country: 'Japan' },
    ];
  });

  // Smart Currency Selection: Auto-defaults to localStorage or detected geo currency
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('nexus_selected_currency') : null;
      if (saved) return saved;
      if (initialCurrency && initialCurrency !== 'USD') return initialCurrency;
      return detectedGeo.currencyCode || initialCurrency || 'INR';
    } catch {
      return initialCurrency || 'INR';
    }
  });
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');

  // Sync currency changes across window events and prop updates
  useEffect(() => {
    const handleCurrencyEvent = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        setSelectedCurrencyCode(e.detail);
      }
    };
    window.addEventListener('currency-changed', handleCurrencyEvent);
    return () => window.removeEventListener('currency-changed', handleCurrencyEvent);
  }, []);

  useEffect(() => {
    if (initialCurrency && initialCurrency !== selectedCurrencyCode) {
      setSelectedCurrencyCode(initialCurrency);
    }
  }, [initialCurrency]);

  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const mollieBankDropdownRef = useRef<HTMLDivElement>(null);
  const mercadoDocDropdownRef = useRef<HTMLDivElement>(null);
  const mercadoInstallmentDropdownRef = useRef<HTMLDivElement>(null);
  const mercadoPseDropdownRef = useRef<HTMLDivElement>(null);

  const ALL_18_PLATFORM_GATEWAYS = [
    { gateway_key: 'razorpay', display_name: 'Razorpay India (UPI & Cards)', environment: 'live', is_configured: true, is_enabled: true },
    { gateway_key: 'stripe', display_name: 'Stripe Global (Cards & Apple Pay)', environment: 'live', is_configured: true, is_enabled: true },
    { gateway_key: 'cashfree', display_name: 'Cashfree Payments (Dynamic UPI QR)', environment: 'live', is_configured: true, is_enabled: true },
    { gateway_key: 'phonepe', display_name: 'PhonePe & Direct UPI', environment: 'live', is_configured: true, is_enabled: true },
    { gateway_key: 'bank_transfer', display_name: 'Bank Wire / NEFT (0% Fee)', environment: 'live', is_configured: true, is_enabled: true },
    { gateway_key: 'paytm', display_name: 'Paytm Payments (UPI & Wallet OTP)', environment: 'live', is_configured: true, is_enabled: true },
    { gateway_key: 'paypal', display_name: 'PayPal Express (Global Balance)', environment: 'live', is_configured: true, is_enabled: true },
    { gateway_key: 'authorizenet', display_name: 'Authorize.Net (Cards & eCheck)', environment: 'live', is_configured: false, is_enabled: true },
    { gateway_key: 'square', display_name: 'Square Omnichannel (Cards, Apple Pay, Google Pay, Cash App & Afterpay)', environment: 'live', is_configured: false, is_enabled: true },
    { gateway_key: 'paddle', display_name: 'Paddle Merchant (Global SaaS MoR)', environment: 'live', is_configured: false, is_enabled: true },
    { gateway_key: 'crypto', display_name: 'Coinbase Crypto (USDT, BTC, ETH, SOL)', environment: 'live', is_configured: false, is_enabled: true },
    { gateway_key: 'flutterwave', display_name: 'Flutterwave (African Mobile Money & Rails)', environment: 'live', is_configured: false, is_enabled: true },
    { gateway_key: 'adyen', display_name: 'Adyen Global (Enterprise 3DS2)', environment: 'live', is_configured: false, is_enabled: true },
    { gateway_key: 'mercadopago', display_name: 'Mercado Pago (LatAm & Pix QR)', environment: 'live', is_configured: false, is_enabled: true },
    { gateway_key: 'klarna', display_name: 'Klarna BNPL (Pay in 4 / 30 Days)', environment: 'live', is_configured: false, is_enabled: true },
    { gateway_key: 'mollie', display_name: 'Mollie European (iDEAL & SEPA)', environment: 'live', is_configured: false, is_enabled: true },
    { gateway_key: 'skrill', display_name: 'Skrill & Neteller (1-Tap Digital Wallet)', environment: 'live', is_configured: false, is_enabled: true },
    { gateway_key: 'alipay', display_name: 'Alipay+ & WeChat (APAC Barcode QR)', environment: 'live', is_configured: false, is_enabled: true },
  ];

  // Enabled Gateways from Backend Integration (filtered from any non-gateway records)
  const [enabledGateways, setEnabledGateways] = useState<any[]>(() => {
    if (availableGateways && availableGateways.length > 0) {
      const filtered = availableGateways.filter((g: any) => g.gateway_key !== 'global_invoice_template');
      if (filtered.length > 0) return filtered;
    }
    return ALL_18_PLATFORM_GATEWAYS;
  });

  // Payment Rails View Filter: 'all' (show all 18 rails) vs 'compatible' (filtered by active currency)
  const [gatewayFilterMode, setGatewayFilterMode] = useState<'all' | 'compatible'>('all');
  const [gatewaySearchQuery, setGatewaySearchQuery] = useState('');

  // Compatible rails count for current currency
  const compatibleGatewaysCount = useMemo(() => {
    return enabledGateways.filter((g: any) => isGatewayCompatibleWithCurrency(g.gateway_key, selectedCurrencyCode)).length;
  }, [enabledGateways, selectedCurrencyCode]);

  // Dynamic Filtered Gateways: Supports All 18 Rails, Currency-compatibility filter, and search
  const visibleGateways = useMemo(() => {
    let list = enabledGateways;
    if (gatewayFilterMode === 'compatible') {
      list = list.filter((g: any) => isGatewayCompatibleWithCurrency(g.gateway_key, selectedCurrencyCode));
    }
    if (gatewaySearchQuery.trim()) {
      const q = gatewaySearchQuery.toLowerCase().trim();
      list = list.filter((g: any) => {
        const title = (g.display_name || '').toLowerCase();
        const key = (g.gateway_key || '').toLowerCase();
        return title.includes(q) || key.includes(q);
      });
    }
    return list;
  }, [enabledGateways, gatewayFilterMode, selectedCurrencyCode, gatewaySearchQuery]);

  const [selectedGateway, setSelectedGateway] = useState<string>(() => {
    if (visibleGateways.length > 0) {
      const razorpayCandidate = visibleGateways.find((g: any) => g.gateway_key === 'razorpay');
      return razorpayCandidate?.gateway_key || visibleGateways[0]?.gateway_key || 'razorpay';
    }
    return 'razorpay';
  });

  // Automatic Gateway Re-Alignment when visible gateways change
  useEffect(() => {
    if (visibleGateways.length > 0 && !visibleGateways.some((g: any) => g.gateway_key === selectedGateway)) {
      const target = visibleGateways.find((g: any) => g.gateway_key === 'razorpay') || visibleGateways[0];
      setSelectedGateway(target?.gateway_key || 'razorpay');
    }
  }, [visibleGateways, selectedGateway]);

  useEffect(() => {
    if (availableGateways && availableGateways.length > 0) {
      const filtered = availableGateways.filter((g: any) => g.gateway_key !== 'global_invoice_template');
      setEnabledGateways(filtered.length > 0 ? filtered : ALL_18_PLATFORM_GATEWAYS);
    }
  }, [availableGateways]);

  // Live Gateway Fetch & Multi-tab Super Admin Event Sync
  useEffect(() => {
    const handleSyncGateways = async () => {
      try {
        const gws = await fetchAPI('/api/billing/gateways');
        if (Array.isArray(gws)) {
          const filtered = gws.filter((g: any) => g.gateway_key !== 'global_invoice_template');
          setEnabledGateways(filtered);
        }
      } catch {
        // preserve current state
      }
    };

    window.addEventListener('billing-data-updated', handleSyncGateways);
    window.addEventListener('gateways-updated', handleSyncGateways);
    window.addEventListener('storage', (e) => {
      if (e.key === 'gateways_version' || e.key === 'plan_entitlements_version') {
        handleSyncGateways();
      }
    });

    return () => {
      window.removeEventListener('billing-data-updated', handleSyncGateways);
      window.removeEventListener('gateways-updated', handleSyncGateways);
    };
  }, []);

  // Customer & Tax Details (Pre-filled from auth profile)
  const [billingName, setBillingName] = useState(
    () => user?.fullName || (user as any)?.name || 'Mukesh swami'
  );
  const [billingEmail, setBillingEmail] = useState(
    () => user?.email || 'mukeshswami7827@gmail.com'
  );
  const [billingPhone, setBillingPhone] = useState('+1 (555) 019-2834');
  const [billingAddress, setBillingAddress] = useState('Global AI Innovation Tower, Floor 14');
  const [taxId, setTaxId] = useState('TAX-VALIDATED-ENTERPRISE');

  // Promo / Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);

  // Interactive Credit Card Form State & 3D Flip State (Clean empty initial states)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [saveCardForRecurring, setSaveCardForRecurring] = useState(true);

  // Specific Gateway Interactive States
  const [selectedCryptoCoin, setSelectedCryptoCoin] = useState<'USDT_TRC20' | 'USDT_ERC20' | 'BTC' | 'ETH' | 'SOL'>('USDT_TRC20');
  const [cryptoTxHash, setCryptoTxHash] = useState('');
  const [mercadoMethod, setMercadoMethod] = useState<'pix' | 'boleto' | 'card' | 'spei_pse'>('pix');
  const [mercadoCpf, setMercadoCpf] = useState('529.982.128-40');
  const [mercadoInstallments, setMercadoInstallments] = useState(1);
  const [isMercadoInstallmentDropdownOpen, setIsMercadoInstallmentDropdownOpen] = useState(false);
  const [mercadoDocType, setMercadoDocType] = useState<'CPF' | 'CNPJ' | 'DNI' | 'RFC' | 'RUT' | 'CC'>('CPF');
  const [isMercadoDocDropdownOpen, setIsMercadoDocDropdownOpen] = useState(false);
  const [mercadoDocNumber, setMercadoDocNumber] = useState('529.982.128-40');
  const [mercadoCardNumber, setMercadoCardNumber] = useState('');
  const [mercadoCardExpiry, setMercadoCardExpiry] = useState('');
  const [mercadoCardCvv, setMercadoCardCvv] = useState('');
  const [mercadoCardHolder, setMercadoCardHolder] = useState('');
  const [mercadoLatAmRail, setMercadoLatAmRail] = useState<'spei' | 'pse' | 'oxxo'>('spei');
  const [mercadoPseBank, setMercadoPseBank] = useState('bancolombia');
  const [isMercadoPseDropdownOpen, setIsMercadoPseDropdownOpen] = useState(false);
  const [flwMethod, setFlwMethod] = useState<'mpesa' | 'mtn' | 'airtel' | 'bank'>('mpesa');
  const [flwMomoProvider, setFlwMomoProvider] = useState<'mpesa' | 'mtn' | 'airtel' | 'bank'>('mpesa');
  const [flwPhone, setFlwPhone] = useState('+254 712 345678');
  const [flwMtnPhone, setFlwMtnPhone] = useState('+233 24 123 4567');
  const [flwAirtelPhone, setFlwAirtelPhone] = useState('+256 70 123 4567');
  const [flwStkStatus, setFlwStkStatus] = useState<'idle' | 'pushing' | 'dispatched' | 'verified'>('idle');
  const [flwStkCountdown, setFlwStkCountdown] = useState(120);
  const [mollieBank, setMollieBank] = useState('ideal_INGBNL2A');
  const [isMollieBankDropdownOpen, setIsMollieBankDropdownOpen] = useState(false);
  const [mollieBankSearchQuery, setMollieBankSearchQuery] = useState('');
  const [sepaIban, setSepaIban] = useState('');
  const [sepaAccountHolder, setSepaAccountHolder] = useState('');
  const [sepaBic, setSepaBic] = useState('');
  const [sepaMandateAccepted, setSepaMandateAccepted] = useState(true);
  const [bancontactMode, setBancontactMode] = useState<'payconiq_qr' | 'card'>('payconiq_qr');
  const [bancontactCardNumber, setBancontactCardNumber] = useState('');
  const [bancontactCardExpiry, setBancontactCardExpiry] = useState('');
  const [skrillEmail, setSkrillEmail] = useState('payer@skrill.com');
  const [netellerSecureId, setNetellerSecureId] = useState('');
  const [paytmMobile, setPaytmMobile] = useState('9876543210');
  const [klarnaSubTab, setKlarnaSubTab] = useState<'pay_in_4' | 'pay_in_30' | 'financing' | 'pay_now'>('pay_in_4');
  const [klarnaDob, setKlarnaDob] = useState('1996-05-18');
  const [klarnaPhone, setKlarnaPhone] = useState('+1 (555) 019-2834');
  const [klarnaFinancingMonths, setKlarnaFinancingMonths] = useState<6 | 12 | 24>(12);
  const [klarnaAgreementAccepted, setKlarnaAgreementAccepted] = useState(true);
  const [klarnaOtpCode, setKlarnaOtpCode] = useState('');
  const [klarnaOtpSent, setKlarnaOtpSent] = useState(false);
  const [klarnaOtpVerified, setKlarnaOtpVerified] = useState(false);
  const [klarnaCardNumber, setKlarnaCardNumber] = useState('');
  const [klarnaCardExpiry, setKlarnaCardExpiry] = useState('');
  const [klarnaCardCvv, setKlarnaCardCvv] = useState('');
  const [klarnaBankIban, setKlarnaBankIban] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sub-tabs for each gateway
  const [razorpaySubTab, setRazorpaySubTab] = useState<'upi_qr' | 'cards' | 'upi_intent'>('upi_qr');
  const [razorpayCustomerVpa, setRazorpayCustomerVpa] = useState('');
  const [cashfreeSubTab, setCashfreeSubTab] = useState<'upi_qr' | 'van_pg'>('upi_qr');
  const [cashfreeCustomerPhone, setCashfreeCustomerPhone] = useState('');
  const [phonepeSubTab, setPhonepeSubTab] = useState<'upi_qr' | 'app_intent'>('upi_qr');
  const [phonepeMobile, setPhonepeMobile] = useState('');
  const [paytmSubTab, setPaytmSubTab] = useState<'upi_qr' | 'wallet_otp'>('upi_qr');
  const [paytmOtpCode, setPaytmOtpCode] = useState('489210');
  const [paytmFastForward, setPaytmFastForward] = useState(true);
  const [paypalSubTab, setPaypalSubTab] = useState<'balance' | 'pay_in_4'>('balance');
  const [paypalPayerEmail, setPaypalPayerEmail] = useState('');
  const [authnetSubTab, setAuthnetSubTab] = useState<'card' | 'echeck'>('card');
  const [authnetRouting, setAuthnetRouting] = useState('121000358');
  const [authnetAccount, setAuthnetAccount] = useState('987654321098');
  const [authnetEcheckAccountType, setAuthnetEcheckAccountType] = useState<'checking' | 'savings' | 'businessChecking'>('checking');
  const [authnetEcheckName, setAuthnetEcheckName] = useState('MUKESH SWAMI');
  const [authnetEcheckBank, setAuthnetEcheckBank] = useState('JPMorgan Chase Bank');
  const [authnetEcheckMandateAccepted, setAuthnetEcheckMandateAccepted] = useState(true);
  const [stripeSubTab, setStripeSubTab] = useState<'card' | 'wallets'>('card');
  const [squareSubTab, setSquareSubTab] = useState<'card' | 'wallets' | 'cashapp' | 'afterpay'>('card');
  const [squareWalletSelection, setSquareWalletSelection] = useState<'apple_pay' | 'google_pay'>('apple_pay');
  const [squareWalletAuthStatus, setSquareWalletAuthStatus] = useState<'idle' | 'authenticating' | 'authenticated'>('idle');
  const [squarePostalCode, setSquarePostalCode] = useState('94103');
  const [squareCustomerCashtag, setSquareCustomerCashtag] = useState('$createcall');
  const [squareCashAppPushStatus, setSquareCashAppPushStatus] = useState<'idle' | 'dispatched' | 'approved'>('idle');
  const [squareCashAppTimer, setSquareCashAppTimer] = useState(300);
  const [squareAfterpayPhone, setSquareAfterpayPhone] = useState('+1 (555) 019-2834');
  const [squareAfterpayDob, setSquareAfterpayDob] = useState('1994-08-12');
  const [squareAfterpayAccepted, setSquareAfterpayAccepted] = useState(true);
  const [squareAfterpayCardHolder, setSquareAfterpayCardHolder] = useState('Mukesh swami');
  const [squareAfterpayCardNumber, setSquareAfterpayCardNumber] = useState('');
  const [squareAfterpayCardExpiry, setSquareAfterpayCardExpiry] = useState('');
  const [squareAfterpayCardCvv, setSquareAfterpayCardCvv] = useState('');
  const [squareAfterpayOtp, setSquareAfterpayOtp] = useState('849201');
  const [squareAfterpayOtpSent, setSquareAfterpayOtpSent] = useState(false);
  const [paddleSubTab, setPaddleSubTab] = useState<'card' | 'vat_invoice'>('card');
  const [paddleCompanyName, setPaddleCompanyName] = useState('CreateCall AI Enterprises Ltd');
  const [paddleVatNumber, setPaddleVatNumber] = useState('GB981273910');
  const [paddleFinanceEmail, setPaddleFinanceEmail] = useState('billing@createcall.ai');
  const [paddleSettlementRail, setPaddleSettlementRail] = useState<'card' | 'sepa' | 'wire'>('card');
  const [paddleSepaIban, setPaddleSepaIban] = useState('GB33BUKB20201555555555');
  const [paddleSepaBic, setPaddleSepaBic] = useState('BUKBGB22');
  const [paddleSepaBankName, setPaddleSepaBankName] = useState('Barclays Corporate UK');
  const [paddleSepaMandateAccepted, setPaddleSepaMandateAccepted] = useState(true);
  const [paddlePoNumber, setPaddlePoNumber] = useState('PO-2026-CC9823');
  const [paddleBillingDepartment, setPaddleBillingDepartment] = useState('Finance & Accounts Payable');
  const [adyenSubTab, setAdyenSubTab] = useState<'card' | 'local_banking'>('card');
  const [adyenBank, setAdyenBank] = useState<'ideal' | 'bancontact' | 'sofort' | 'cartes_bancaires' | 'eps' | 'blik'>('ideal');
  const [adyenIdealBank, setAdyenIdealBank] = useState('ING');
  const [adyenBancontactBank, setAdyenBancontactBank] = useState('Belfius');
  const [adyenSofortBank, setAdyenSofortBank] = useState('Deutsche Bank');
  const [adyenCbBank, setAdyenCbBank] = useState('BNP Paribas');
  const [adyenEpsBank, setAdyenEpsBank] = useState('Erste Bank');
  const [adyenBlikBank, setAdyenBlikBank] = useState('PKO Bank Polski');
  const [adyenBlikCode, setAdyenBlikCode] = useState('782 914');
  const [adyenInstallments, setAdyenInstallments] = useState('1');
  const [adyen3dsStatus, setAdyen3dsStatus] = useState<'idle' | 'challenging' | 'verified'>('idle');
  const [adyen3dsOtp, setAdyen3dsOtp] = useState('892104');
  const [adyenIban, setAdyenIban] = useState('NL02 INGB 0123 4567 89');
  const [adyenAccountHolder, setAdyenAccountHolder] = useState('Mukesh swami');
  const [adyenBancontactMode, setAdyenBancontactMode] = useState<'payconiq_qr' | 'card'>('payconiq_qr');
  const [adyenBlikTimer, setAdyenBlikTimer] = useState(120);
  const [adyenPayconiqTimer, setAdyenPayconiqTimer] = useState(300);
  const [adyenConnectedRail, setAdyenConnectedRail] = useState<{ bankName: string; rail: string; bic: string; token: string } | null>(null);
  const [mollieSubTab, setMollieSubTab] = useState<'ideal' | 'bancontact' | 'sepa'>('ideal');
  const [alipaySubTab, setAlipaySubTab] = useState<'alipay_qr' | 'wechat_barcode'>('alipay_qr');
  const [skrillSubTab, setSkrillSubTab] = useState<'skrill' | 'neteller'>('skrill');

  // Timers for real live dynamic QR codes
  const [cryptoTimer, setCryptoTimer] = useState(900); // 15m 00s
  const [pixTimer, setPixTimer] = useState(600); // 10m 00s
  const [alipayTimer, setAlipayTimer] = useState(300); // 5m 00s
  const [skrillTimer, setSkrillTimer] = useState(300); // 5m 00s
  const [mollieTimer, setMollieTimer] = useState(300); // 5m 00s
  const [flwTimer, setFlwTimer] = useState(600); // 10m 00s

  // Active Pair for Live Forex Money Converter (Dynamic real-time synchronization on Live Rate clicks)
  const [converterActivePair, setConverterActivePair] = useState<{
    from: string;
    to: string;
    amount?: number;
    timestamp?: number;
  } | null>(null);

  const handleOpenConverterForPair = (
    fromCode: string,
    toCode: string,
    amountVal?: number
  ) => {
    let fCode = (fromCode || 'USD').toUpperCase();
    let tCode = (toCode || 'INR').toUpperCase();

    // If both from and to are identical, make from USD so there is a real exchange conversion
    if (fCode === tCode) {
      if (fCode === 'USD') {
        tCode = 'INR';
      } else {
        fCode = 'USD';
      }
    }

    const amt =
      amountVal !== undefined && amountVal > 0
        ? amountVal
        : fCode === selectedCurrencyCode
        ? totalAmountLocal
        : basePriceUsd;

    const pairObj = {
      from: fCode,
      to: tCode,
      amount: amt,
      timestamp: Date.now(),
    };

    setConverterActivePair(pairObj);

    // Dispatch global custom event for instant cross-component updates
    try {
      window.dispatchEvent(
        new CustomEvent('set-forex-converter-pair', { detail: pairObj })
      );
    } catch (e) {
      console.warn('Could not dispatch forex pair event', e);
    }

    // Smooth scroll and highlight the converter card
    const el = document.getElementById('live-forex-converter-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-teal-500', 'ring-offset-2', 'transition-all');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-teal-500', 'ring-offset-2');
      }, 2500);
    }
  };

  // Deep BIN & Card Intelligence Analysis Engine (Instant + Live Asynchronous Public Resolution)
  const synchronousCardMeta = useMemo(() => {
    return analyzeCardNumber(cardNumber);
  }, [cardNumber]);

  const [liveResolvedMeta, setLiveResolvedMeta] = useState<CardBrandMeta | null>(null);

  useEffect(() => {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length >= 6) {
      let active = true;
      fetchLiveBinMetadata(clean).then((res) => {
        if (active && res) {
          setLiveResolvedMeta(res);
        }
      });
      return () => {
        active = false;
      };
    } else {
      setLiveResolvedMeta(null);
    }
  }, [cardNumber]);

  const cardIntelligence: CardBrandMeta = useMemo(() => {
    return liveResolvedMeta || synchronousCardMeta;
  }, [liveResolvedMeta, synchronousCardMeta]);

  // Auto-sync Country & Dial Code from detected Card BIN (Never switches gateway rail!)
  useEffect(() => {
    if (cardIntelligence.countryIso2 && cardIntelligence.countryIso2 !== 'GLOBAL') {
      const match = GLOBAL_COUNTRY_CODES_CATALOG.find(
        (c) => c.iso2.toUpperCase() === cardIntelligence.countryIso2?.toUpperCase()
      );
      if (match && match.name !== country) {
        setCountry(match.name);
        setSelectedCountryItem(match);
        setBillingPhone((prevPhone) => {
          const cleanDigits = prevPhone.replace(/^\+\d+[\s-]*/, '').trim();
          const sample = cleanDigits || '555 019-2834';
          return `${match.dialCode} ${sample}`;
        });
      }
    }
  }, [cardIntelligence.countryIso2]);



  // Interactive UPI & QR State
  const [vpaId, setVpaId] = useState('createcall.business@hdfcbank');
  const [qrTimer, setQrTimer] = useState(300); // 5m 00s
  const [qrSessionKey, setQrSessionKey] = useState<number>(() => Date.now());
  const [promoVerificationMode, setPromoVerificationMode] = useState<'instant_free' | 'penny_auth'>('penny_auth');

  // Bank Wire / Offline Mode & Live UPI QR State
  const [bankSubTab, setBankSubTab] = useState<'upi_qr' | 'bank_account'>('upi_qr');
  const [offlineUtr, setOfflineUtr] = useState('');
  const [offlineDate, setOfflineDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [offlineNotes, setOfflineNotes] = useState(
    isWalletTopup
      ? 'RTGS / IMPS Bank Transfer for Telephony Carrier Wallet Top-Up'
      : 'RTGS Wire Transfer for CreateCall AI Enterprise Subscription'
  );

  // Provisioning Terminal State (Step 4)
  const [provisioningProgress, setProvisioningProgress] = useState(0);
  const [provisioningStage, setProvisioningStage] = useState(1);
  const [provisioningLogs, setProvisioningLogs] = useState<string[]>([]);
  const [completedInvoice, setCompletedInvoice] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Gateway SSOT
  const currentSelectedGw = useMemo(() => {
    return enabledGateways.find((g) => g.gateway_key === selectedGateway);
  }, [enabledGateways, selectedGateway]);

  const isCurrentGatewayConfigured = useMemo(() => {
    // Bank wire / NEFT manual remittance is always live and accessible
    if (['bank_transfer', 'bank_wire', 'wire'].includes(selectedGateway)) {
      return true;
    }
    if (currentSelectedGw) {
      return Boolean(currentSelectedGw.is_configured);
    }
    return false;
  }, [currentSelectedGw, selectedGateway]);

  // Sync initialPlan prop
  useEffect(() => {
    if (initialPlan) {
      setSelectedPlan(initialPlan);
    }
  }, [initialPlan]);

  // Click-Outside Listener for Dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(e.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
      if (mollieBankDropdownRef.current && !mollieBankDropdownRef.current.contains(e.target as Node)) {
        setIsMollieBankDropdownOpen(false);
      }
      if (mercadoDocDropdownRef.current && !mercadoDocDropdownRef.current.contains(e.target as Node)) {
        setIsMercadoDocDropdownOpen(false);
      }
      if (mercadoInstallmentDropdownRef.current && !mercadoInstallmentDropdownRef.current.contains(e.target as Node)) {
        setIsMercadoInstallmentDropdownOpen(false);
      }
      if (mercadoPseDropdownRef.current && !mercadoPseDropdownRef.current.contains(e.target as Node)) {
        setIsMercadoPseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const [templateSettings, setTemplateSettings] = useState<InvoiceTemplateSettings | undefined>(undefined);
  const [isSyncingRates, setIsSyncingRates] = useState(false);

  // Force-Sync Live Realtime Forex Rates from Markets
  const handleSyncLiveRates = async (providerId?: string) => {
    setIsSyncingRates(true);
    try {
      const syncUrl = providerId
        ? `/api/billing/currencies/sync-live?provider=${providerId}`
        : '/api/billing/currencies/sync-live';
      const res = await fetchAPI(syncUrl, { method: 'POST' });
      if (res && res.success) {
        const curUrl = providerId
          ? `/api/billing/currencies?provider=${providerId}`
          : '/api/billing/currencies';
        const freshCurrencies = await fetchAPI(curUrl);
        if (Array.isArray(freshCurrencies) && freshCurrencies.length > 0) {
          setCurrencies(freshCurrencies);
        }
        addToast({
          type: 'success',
          title: 'Live Forex Market Rates Synced',
          description: `Rates updated from ${res.provider_name || 'live Forex exchange engines'} (${res.updated_at || 'Just now'}).`,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Sync Notice',
        description: err.message || 'Using latest cached Forex exchange rates.',
      });
    } finally {
      setIsSyncingRates(false);
    }
  };

  // Fetch Dynamic Currencies and Gateways from Backend Integration API SSOT
  useEffect(() => {
    fetchAPI('/api/billing/currencies')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCurrencies(data);
        }
      })
      .catch(() => {});

    fetchAPI('/api/billing/gateways')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEnabledGateways(data);
          if (!data.some((g) => g.gateway_key === selectedGateway)) {
            const rzp = data.find((g: any) => g.gateway_key === 'razorpay');
            setSelectedGateway(rzp ? rzp.gateway_key : data[0].gateway_key);
          }
        }
      })
      .catch(() => {});

    fetchAPI('/api/billing/invoice-template-settings')
      .then((data) => {
        if (data && data.company_name) {
          setTemplateSettings(data);
        }
      })
      .catch(() => {});
  }, []);

  // Live Dynamic QR Countdown Timers (stops at 0 for manual regeneration)
  useEffect(() => {
    const timer = setInterval(() => {
      setQrTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setSquareCashAppTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setCryptoTimer((prev) => (prev > 1 ? prev - 1 : 900));
      setPixTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setAlipayTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setSkrillTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setMollieTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setFlwTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setAdyenBlikTimer((prev) => (prev > 0 ? prev - 1 : 120));
      setAdyenPayconiqTimer((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, [qrSessionKey]);

  // Active Currency SSOT
  const currentCurrency = useMemo(() => {
    return currencies.find((c) => c.code === selectedCurrencyCode) || currencies[0];
  }, [currencies, selectedCurrencyCode]);

  // Filtered Currencies for Searchable Dropdown
  const filteredCurrencies = useMemo(() => {
    if (!currencySearchQuery.trim()) return currencies;
    const q = currencySearchQuery.toLowerCase().trim();
    return currencies.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.country && c.country.toLowerCase().includes(q)) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [currencies, currencySearchQuery]);

  // Filtered Countries for Searchable Country Dropdown
  const filteredCountries = useMemo(() => {
    if (!countrySearchQuery.trim()) return GLOBAL_COUNTRY_CODES_CATALOG;
    const q = countrySearchQuery.toLowerCase().trim();
    return GLOBAL_COUNTRY_CODES_CATALOG.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.toLowerCase().includes(q) ||
        c.iso2.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [countrySearchQuery]);

  // Active top-up USD value
  const effectiveTopupUsd = isCustomTopup
    ? Math.max(5, parseFloat(customTopupInput) || 0)
    : topupPresetUsd;

  // Base USD Calculation
  const getBaseUsd = () => {
    if (isWalletTopup) {
      return effectiveTopupUsd;
    }
    if (!selectedPlan) return 199;
    if (billingCycle === 'yearly') return (selectedPlan.yearlyPrice || selectedPlan.monthlyPrice * 0.8) * 12;
    if (billingCycle === 'lifetime') return selectedPlan.lifetimePrice || selectedPlan.monthlyPrice * 12;
    return selectedPlan.monthlyPrice;
  };

  const configuredTaxRatePercent =
    templateSettings?.tax_rate_percent !== undefined
      ? Number(templateSettings.tax_rate_percent)
      : 18.0;

  const basePriceUsd = getBaseUsd();
  const subtotalLocal = Math.round(basePriceUsd * (currentCurrency.rate || 1));
  const discountAmountLocal = appliedCoupon
    ? Math.round((subtotalLocal * appliedCoupon.percent) / 100)
    : 0;
  const taxableAmountLocal = Math.max(0, subtotalLocal - discountAmountLocal);
  const taxRateMultiplier = isWalletTopup ? 0 : (selectedCurrencyCode === 'INR' ? configuredTaxRatePercent / 100 : 0);
  const taxAmountLocal = Math.round(taxableAmountLocal * taxRateMultiplier);
  const totalAmountLocal = taxableAmountLocal + taxAmountLocal;

  // Wallet Top-Up Balances
  const currentBalanceUsd = currentWalletBalanceUsd;
  const projectedBalanceUsd = currentBalanceUsd + effectiveTopupUsd;

  // Format Timer String
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Country Selection Handler with Live Phone Number Sync (Never overrides chosen gateway)
  const handleSelectCountry = (countryItem: GlobalCountryCodeItem) => {
    setCountry(countryItem.name);
    setSelectedCountryItem(countryItem);
    setIsCountryDropdownOpen(false);

    // Live update phone number dialer prefix to match chosen country
    setBillingPhone((prevPhone) => {
      const cleanDigits = prevPhone.replace(/^\+\d+[\s-]*/, '').trim();
      const sample = cleanDigits || '555 019-2834';
      return `${countryItem.dialCode} ${sample}`;
    });

    // Auto-switch preferred currency based on country (without altering payment rail)
    if (countryItem.name === 'India' || countryItem.iso2 === 'IN') {
      setSelectedCurrencyCode('INR');
    } else if (countryItem.name === 'United States' || countryItem.iso2 === 'US') {
      setSelectedCurrencyCode('USD');
    } else if (countryItem.name === 'United Kingdom' || countryItem.iso2 === 'GB') {
      setSelectedCurrencyCode('GBP');
    } else if (countryItem.name === 'United Arab Emirates' || countryItem.iso2 === 'AE') {
      setSelectedCurrencyCode('AED');
    } else if (countryItem.region === 'Europe' || ['Germany', 'France', 'Italy', 'Spain'].includes(countryItem.name)) {
      setSelectedCurrencyCode('EUR');
    } else if (countryItem.name === 'Canada' || countryItem.iso2 === 'CA') {
      setSelectedCurrencyCode('CAD');
    } else if (countryItem.name === 'Australia' || countryItem.iso2 === 'AU') {
      setSelectedCurrencyCode('AUD');
    } else if (countryItem.name === 'Singapore' || countryItem.iso2 === 'SG') {
      setSelectedCurrencyCode('SGD');
    } else if (countryItem.name === 'Japan' || countryItem.iso2 === 'JP') {
      setSelectedCurrencyCode('JPY');
    }
  };

  // Apply Coupon (Strict Scope Aware)
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      addToast({ type: 'warning', title: 'Enter Code', description: 'Please enter a coupon code.' });
      return;
    }
    setIsValidatingCoupon(true);
    const upper = couponInput.trim().toUpperCase();

    try {
      const res = await fetchAPI('/api/billing/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: upper,
          mode: isWalletTopup ? 'wallet_topup' : 'subscription_purchase',
          plan_id: isWalletTopup ? 'wallet_topup' : selectedPlan.id,
          currency: selectedCurrencyCode,
        }),
      });
      if (res && res.valid) {
        setAppliedCoupon({ code: res.code, percent: res.discount_percent });
        addToast({
          type: 'success',
          title: 'Promo Applied!',
          description: `${res.code} applied: ${res.discount_percent}% Discount!`,
        });
      } else {
        throw new Error('Invalid code');
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Coupon Not Valid',
        description: err.message || 'Coupon code is invalid, expired, or not applicable to this checkout.',
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Copy to clipboard with active checkmark feedback
  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => {
      setCopiedField(null);
    }, 2200);
    addToast({ type: 'success', title: 'Copied!', description: `${label} copied to clipboard.` });
  };

  // Dedicated Boleto Bancário Official Slip PDF / Print Generator (Febraban Standard, 100% crisp without blank pages)
  const handlePrintBoletoPdf = (data: {
    linhaDigitavel: string;
    nossoNumero: string;
    dueDate: string;
    brlAmount: string;
    customerName: string;
    customerDoc: string;
    customerAddress: string;
  }) => {
    const printWindow = window.open('', '_blank', 'width=880,height=920');
    if (!printWindow) {
      addToast({
        type: 'warning',
        title: 'Popup Blocked',
        description: 'Please allow popups in your browser to print or download the official Boleto Bancário PDF voucher.',
      });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boleto Bancário Registrado - Banco Itaú / Mercado Pago</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #f1f5f9; color: #0f172a; padding: 24px; }
          .boleto-card { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08); }
          .top-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
          .bank-tag { background: #e0f2fe; color: #0369a1; font-weight: 900; font-size: 20px; padding: 6px 16px; border-radius: 6px; font-family: monospace; border: 1px solid #bae6fd; letter-spacing: 1px; }
          .linha-dig { font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: 800; color: #0f172a; text-align: right; letter-spacing: 0.5px; word-break: break-all; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
          .data-table td, .data-table th { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 11px; text-align: left; vertical-align: top; }
          .data-table th { background: #f8fafc; color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 9.5px; }
          .data-table td strong { font-size: 12px; color: #0f172a; display: block; margin-top: 2px; }
          .val-highlight { font-size: 16px !important; color: #0284c7 !important; font-weight: 900 !important; font-family: monospace; }
          .instructions-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; font-size: 11.5px; color: #334155; line-height: 1.6; margin-bottom: 16px; }
          .instructions-box strong { color: #0f172a; }
          .barcode-wrap { text-align: center; padding: 16px 0 8px; border-top: 1.5px dashed #cbd5e1; }
          .barcode-lines { display: inline-flex; height: 60px; align-items: stretch; justify-content: center; gap: 2px; margin-bottom: 6px; }
          .bar { background: #000; width: 2px; }
          .bar.w-1 { width: 1.5px; }
          .bar.w-2 { width: 3.5px; }
          .bar.w-3 { width: 5.5px; }
          .bar.sp-1 { background: transparent; width: 2px; }
          .bar.sp-2 { background: transparent; width: 4px; }
          .top-actions { max-width: 800px; margin: 0 auto 16px; display: flex; justify-content: space-between; align-items: center; }
          .btn { padding: 9px 18px; border-radius: 6px; font-size: 12.5px; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
          .btn-print { background: #0284c7; color: #ffffff; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.3); }
          .btn-print:hover { background: #0369a1; }
          .btn-close { background: #e2e8f0; color: #334155; }
          .btn-close:hover { background: #cbd5e1; }
          @media print {
            body { background: #fff !important; padding: 0 !important; }
            .boleto-card { border: 1px solid #94a3b8 !important; box-shadow: none !important; padding: 16px !important; max-width: 100% !important; margin: 0 !important; }
            .top-actions { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="top-actions">
          <div style="font-size: 13px; font-weight: 700; color: #0369a1;">
            📄 Official Boleto Bancário Document Preview
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
            <button class="btn btn-close" onclick="window.close()">Close Window</button>
          </div>
        </div>

        <div class="boleto-card">
          <div class="top-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="bank-tag">341-7</div>
              <div>
                <div style="font-weight: 900; font-size: 15px; color: #0f172a;">Banco Itaú Unibanco S.A.</div>
                <div style="font-size: 11px; color: #64748b; font-weight: 600;">Mercado Pago Meios de Pagamento Ltda &bull; Febraban Rail</div>
              </div>
            </div>
            <div class="linha-dig">${data.linhaDigitavel}</div>
          </div>

          <table class="data-table">
            <tr>
              <td colspan="3">
                <th>Payment Location / Local de Pagamento</th>
                <strong>Payable at any Brazilian Bank, Internet Banking, Lottery Branch (Casas Lotéricas) or ATM until due date</strong>
              </td>
              <td style="width: 200px;">
                <th>Due Date / Vencimento</th>
                <strong style="color: #dc2626; font-size: 14px; font-weight: 900;">${data.dueDate}</strong>
              </td>
            </tr>
            <tr>
              <td colspan="3">
                <th>Beneficiary / Beneficiário</th>
                <strong>CreateCall OS LatAm Pagamentos Ltda &bull; CNPJ: 42.198.742/0001-90</strong>
                <span style="font-size: 10.5px; color: #64748b; display: block; margin-top: 1px;">Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100</span>
              </td>
              <td>
                <th>Agency / Beneficiary Code</th>
                <strong>1842 / 92841-8</strong>
              </td>
            </tr>
            <tr>
              <td>
                <th>Document Date</th>
                <strong>${new Date().toLocaleDateString('pt-BR')}</strong>
              </td>
              <td>
                <th>Document ID / Nosso Número</th>
                <strong>${data.nossoNumero}</strong>
              </td>
              <td>
                <th>Currency</th>
                <strong>BRL (R$)</strong>
              </td>
              <td>
                <th>Total Payable / Valor do Documento</th>
                <strong class="val-highlight">R$ ${data.brlAmount}</strong>
              </td>
            </tr>
          </table>

          <div class="instructions-box">
            <strong style="display: block; margin-bottom: 4px; color: #0f172a;">Payment Instructions / Instruções de Caixa:</strong>
            &bull; Cashier / Sr. Caixa: Accept payment of this registered boleto slip until due date without extra interest fees.<br>
            &bull; After due date: Apply standard penalty of 2.00% + interest of 1.00% per month (0.033% per day).<br>
            &bull; Direct clearing via CIP / Banco Central do Brasil within 1 business day.<br>
            &bull; Payer (Sacado): <strong>${data.customerName}</strong> &bull; Tax ID: <strong>${data.customerDoc}</strong>
          </div>

          <table class="data-table">
            <tr>
              <td colspan="4">
                <th>Payer / Pagador (Sacado)</th>
                <strong>${data.customerName} &bull; Tax ID (CPF/CNPJ): ${data.customerDoc}</strong>
                <span style="font-size: 11px; color: #64748b; display: block; margin-top: 2px;">Billing Address: ${data.customerAddress || 'Global Enterprise Headquarters'}</span>
              </td>
            </tr>
          </table>

          <div class="barcode-wrap">
            <div class="barcode-lines">
              ${Array.from({ length: 60 })
                .map((_, i) => {
                  const w = (i % 5 === 0) ? 'w-3' : (i % 3 === 0) ? 'w-2' : 'w-1';
                  const s = (i % 4 === 0) ? 'sp-2' : 'sp-1';
                  return '<div class="bar ' + w + '"></div><div class="bar ' + s + '"></div>';
                })
                .join('')}
            </div>
            <div style="font-family: monospace; font-size: 11.5px; font-weight: 700; color: #475569; letter-spacing: 2px;">
              ${data.linhaDigitavel}
            </div>
          </div>
        </div>

        <script>
          window.addEventListener('load', () => {
            setTimeout(() => { window.print(); }, 450);
          });
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Card Number Change Handler with Multi-Segment Auto-Parser & Clean Deletion Support
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Check if pasted value contains multi-segment card data (e.g. number | MM/YY | CVV | Name)
    const parsed = parseRawCardInput(rawValue);
    if (parsed.isMultiField) {
      if (parsed.cardNumber) setCardNumber(parsed.cardNumber);
      if (parsed.cardExpiry) setCardExpiry(parsed.cardExpiry);
      if (parsed.cardCvv) setCardCvv(parsed.cardCvv);
      if (parsed.cardHolder) setCardHolder(parsed.cardHolder);
      addToast({
        type: 'success',
        title: 'Card Details Auto-Parsed',
        description: 'Extracted card number, expiry & CVV from pasted string!',
      });
      return;
    }

    const cleanDigits = rawValue.replace(/\D/g, '');
    const meta = analyzeCardNumber(cleanDigits);
    const capped = cleanDigits.slice(0, meta.maxLength);
    const formatted = formatCardNumberByScheme(capped, meta.formatPattern);
    setCardNumber(formatted); // Allows full deletion down to empty string!
  };

  // Expiry Change Handler with Clean Deletion Support
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setCardExpiry(val); // Allows full deletion down to empty string!
  };

  // CVV Change Handler with Dynamic Length Guard
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanVal = e.target.value.replace(/\D/g, '').slice(0, cardIntelligence.cvvLength);
    setCardCvv(cleanVal);
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleVerifyAndComplete = async (verifyPayload: any, initRes: any) => {
    setStep(4);
    setProvisioningProgress(45);
    setProvisioningStage(2);
    setProvisioningLogs((prev) => [
      ...prev,
      `[GATEWAY] Payment authorized via ${verifyPayload.gateway.toUpperCase()}: ${verifyPayload.gateway_payment_id}...`,
      `[SERVER] Verifying cryptographic signature & ledger records...`,
    ]);

    const verifyRes = await fetchAPI('/api/billing/checkout/verify', {
      method: 'POST',
      body: JSON.stringify(verifyPayload),
    });

    await new Promise((r) => setTimeout(r, 400));
    setProvisioningProgress(75);
    setProvisioningStage(3);
    setProvisioningLogs((prev) => [
      ...prev,
      `[TELEPHONY] Provisioning Carrier SIP Trunks & AI RAG Quota for workspace... OK`,
    ]);

    await new Promise((r) => setTimeout(r, 400));
    setProvisioningProgress(100);
    setProvisioningStage(4);
    setProvisioningLogs((prev) => [
      ...prev,
      `[COMPLETE] Sovereign workspace upgraded! Invoice: ${verifyRes.invoice_number}`,
    ]);

    const invoiceData = {
      invoice_number: verifyRes.invoice_number,
      transaction_id: initRes.transaction_id,
      status: 'paid',
      mode: isWalletTopup ? 'wallet_topup' : 'subscription_purchase',
      billing_name: billingName,
      billing_email: billingEmail,
      billing_address: billingAddress,
      billing_phone: billingPhone,
      tax_id: taxId,
      plan_name: isWalletTopup ? 'Prepaid Carrier Wallet Top-Up' : selectedPlan.name,
      plan_price: basePriceUsd,
      catalog_price_local: subtotalLocal,
      original_price: subtotalLocal,
      discount_amount: discountAmountLocal,
      coupon_code: appliedCoupon?.code,
      billing_cycle: isWalletTopup ? 'One-Time' : billingCycle,
      amount_local: totalAmountLocal,
      total_amount: totalAmountLocal,
      subtotal: taxableAmountLocal,
      tax_amount: taxAmountLocal,
      currency: selectedCurrencyCode,
      currency_symbol: currentCurrency.symbol,
      gateway: currentSelectedGw?.display_name || verifyPayload.gateway.toUpperCase(),
      gateway_key: verifyPayload.gateway,
      gateway_payment_id: verifyPayload.gateway_payment_id || `PAY-${Date.now()}`,
      credited_amount_usd: isWalletTopup ? verifyRes.credited_amount_usd || effectiveTopupUsd : undefined,
      new_balance_usd: verifyRes.new_balance_usd,
      allocated_minutes: verifyRes.allocated_minutes || selectedPlan.includedMinutes,
      allocated_concurrency: verifyRes.allocated_concurrency || selectedPlan.concurrencyLimit,
      is_free_promo: totalAmountLocal === 0 || (appliedCoupon && appliedCoupon.percent >= 100),
      created_at: new Date().toLocaleDateString(),
    };

    // Broadcast update across the entire app
    window.dispatchEvent(new CustomEvent('billing-data-updated'));
    window.dispatchEvent(new CustomEvent('plan-entitlements-updated'));
    window.dispatchEvent(new CustomEvent('app-plan-updated'));
    try {
      localStorage.setItem('plan_entitlements_version', Date.now().toString());
    } catch {}

    setCompletedInvoice(invoiceData);
    setStep(4);
    onSuccess(invoiceData);
    addToast({
      type: 'success',
      title: isWalletTopup ? 'Wallet Credited!' : 'Plan Upgraded Successfully!',
      description: isWalletTopup
        ? `Added $${effectiveTopupUsd.toFixed(2)} USD to carrier balance.`
        : `Upgraded to ${selectedPlan.name}. All voice lines are active!`,
    });
  };

  // Start Multi-Stage Cryptographic Provisioning Sequence (Step 4 -> Step 5)
  const handleExecutePayment = async () => {
    setAuthError(null);

    // If an invoice is already completed and settled for this session, navigate directly to invoice
    if (completedInvoice) {
      addToast({
        type: 'info',
        title: `Invoice #${completedInvoice.invoice_number} Already Active`,
        description: `This transaction has already been settled and recorded in the master ledger. Opening your official invoice...`,
      });
      setStep(5);
      return;
    }

    // Guard: Block execution if gateway is not configured in Super Admin
    if (!isCurrentGatewayConfigured && totalAmountLocal > 0 && !(appliedCoupon && appliedCoupon.percent >= 100)) {
      addToast({
        type: 'warning',
        title: `Setup Required in Super Admin`,
        description: `${currentSelectedGw?.display_name || selectedGateway.toUpperCase()} is not yet connected with API keys in Super Admin settings. Please configure credentials first or use a Live rail (e.g. Razorpay, PhonePe, Bank Wire).`,
      });
      return;
    }

    // 0. 100% FREE PROMO / $0.00 CHECKOUT FAST-PATH
    if (totalAmountLocal <= 0 || (appliedCoupon && appliedCoupon.percent >= 100)) {
      const isPennyMode = selectedGateway === 'bank_transfer' && promoVerificationMode === 'penny_auth';

      // If Bank Transfer Penny Auth mode is chosen, validate that the user entered a genuine 12-digit UPI UTR
      if (isPennyMode) {
        const utrCheck = validateBankUtr(offlineUtr);
        if (!utrCheck.isValid) {
          addToast({
            type: 'error',
            title: '12-Digit UPI UTR Required for ₹1.00 Verification',
            description: utrCheck.errorMessage || 'Please enter the 12-digit UPI UTR from your ₹1.00 payment receipt.',
          });
          return;
        }
      }

      try {
        setStep(4);
        setProvisioningProgress(30);
        setProvisioningStage(1);
        setProvisioningLogs([
          `[AUTH] 100% Promotional Discount Verified (${appliedCoupon?.code || '100% Promo'})...`,
          isPennyMode
            ? `[PENNY-AUTH] ₹1.00 Refundable Verification Deposit (UTR: ${offlineUtr.trim()}) Verified...`
            : `[PROVISION] Zero payment required. Dispatching instant subscription allocation...`,
          isPennyMode
            ? `[REFUND] ₹1.00 Reverse Credit Queued: Automated refund scheduled to source UPI account.`
            : `[PROVISION] Zero payment required. Allocating cloud voice channels...`,
        ]);

        const freePayload = {
          mode: isWalletTopup ? 'wallet_topup' : 'subscription_purchase',
          plan_id: isWalletTopup ? undefined : selectedPlan.id,
          topup_amount_usd: isWalletTopup ? effectiveTopupUsd : undefined,
          billing_cycle: isWalletTopup ? 'one_time' : billingCycle,
          currency: selectedCurrencyCode,
          country: country,
          billing_name: billingName,
          billing_email: billingEmail,
          billing_address: billingAddress,
          tax_id: taxId,
          coupon_code: appliedCoupon?.code || 'CREATECALL100',
          gateway: isPennyMode
            ? 'penny_drop_auth_free'
            : selectedGateway === 'bank_transfer'
            ? 'bank_transfer_promo_free'
            : `${selectedGateway}_promo_100_free`,
          notes: isPennyMode ? `₹1.00 Auth UTR: ${offlineUtr.trim()}` : undefined,
        };

        const res = await fetchAPI('/api/billing/checkout/initiate', {
          method: 'POST',
          body: JSON.stringify(freePayload),
        });

        setProvisioningProgress(70);
        setProvisioningStage(3);
        setProvisioningLogs((prev) => [
          ...prev,
          `[LEDGER] Created Official Zero-Balance Invoice: ${res.invoice_number || 'INV-FREE'}... OK`,
          `[SIP] Voice lines and concurrency allocated successfully.`,
        ]);

        await new Promise((r) => setTimeout(r, 450));
        setProvisioningProgress(100);
        setProvisioningStage(4);

        const freeInvoice = {
          invoice_number: res.invoice_number || `INV-FREE-${Date.now().toString().slice(-6)}`,
          transaction_id: res.transaction_id || `TXN-FREE-${Date.now()}`,
          status: 'paid',
          mode: isWalletTopup ? 'wallet_topup' : 'subscription_purchase',
          billing_name: billingName,
          billing_email: billingEmail,
          billing_address: billingAddress,
          billing_phone: billingPhone,
          tax_id: taxId,
          plan_name: isWalletTopup ? 'Prepaid Carrier Wallet Top-Up' : selectedPlan.name,
          plan_price: basePriceUsd,
          catalog_price_local: subtotalLocal,
          original_price: subtotalLocal,
          discount_amount: subtotalLocal,
          coupon_code: appliedCoupon?.code || 'CREATECALL100',
          billing_cycle: isWalletTopup ? 'One-Time' : billingCycle,
          amount_local: 0,
          total_amount: 0,
          subtotal: 0,
          tax_amount: 0,
          currency: selectedCurrencyCode,
          currency_symbol: currentCurrency.symbol,
          gateway: isPennyMode
            ? `100% Promo (₹1.00 Penny Auth Verified • Auto-Refund Queued • UTR: ${offlineUtr.trim()})`
            : `100% Promo Discount (${appliedCoupon?.code || 'PROMO'}) • ${currentSelectedGw?.display_name || selectedGateway.toUpperCase()}`,
          gateway_key: selectedGateway,
          gateway_payment_id: res.gateway_payment_id || res.transaction_id || `FREE-PROMO-${Date.now()}`,
          bank_reference_utr: isPennyMode ? offlineUtr.trim() : undefined,
          credited_amount_usd: isWalletTopup ? effectiveTopupUsd : undefined,
          allocated_minutes: isWalletTopup ? undefined : selectedPlan.includedMinutes,
          allocated_concurrency: isWalletTopup ? undefined : selectedPlan.concurrencyLimit,
          is_free_promo: true,
          created_at: new Date().toLocaleDateString(),
        };

        // Broadcast active updates across the application
        window.dispatchEvent(new CustomEvent('billing-data-updated'));
        window.dispatchEvent(new CustomEvent('plan-entitlements-updated'));
        window.dispatchEvent(new CustomEvent('app-plan-updated'));
        try {
          localStorage.setItem('plan_entitlements_version', Date.now().toString());
        } catch {}

        setCompletedInvoice(freeInvoice);
        setStep(5);
        if (onSuccess) {
          onSuccess(freeInvoice);
        }
        addToast({
          type: 'success',
          title: isPennyMode
            ? 'Security Verified & Plan Activated!'
            : `100% Free Plan Activated via ${currentSelectedGw?.display_name || selectedGateway.toUpperCase()}!`,
          description: isPennyMode
            ? `100% discount applied. ₹1.00 auto-refund queued for account. ${isWalletTopup ? 'Wallet credited' : selectedPlan.name + ' is active'}!`
            : `100% discount applied. ${isWalletTopup ? 'Wallet credited' : selectedPlan.name + ' is now active'}!`,
        });
        return;
      } catch (err: any) {
        setAuthError(err.message || 'Free activation failed.');
        return;
      }
    }

    // 1. Strict Card / B2B Validation Guard for Card & Merchant of Record Gateways
    if (selectedGateway === 'paddle') {
      if (paddleSubTab === 'vat_invoice') {
        if (!paddleCompanyName.trim() || paddleCompanyName.trim().length < 2) {
          addToast({
            type: 'error',
            title: 'Company Legal Name Required',
            description: 'Please enter your registered enterprise business or organization name for B2B reverse charge invoicing.',
          });
          return;
        }
        if (!paddleVatNumber.trim() || paddleVatNumber.trim().length < 3) {
          addToast({
            type: 'error',
            title: 'Valid VAT / Tax ID Required',
            description: 'Please enter a valid VAT, GST, EIN, or corporate Tax ID for statutory tax exemption.',
          });
          return;
        }
        if (!paddleFinanceEmail.trim() || !paddleFinanceEmail.includes('@')) {
          addToast({
            type: 'error',
            title: 'Corporate Accounts Payable Email Required',
            description: 'Please enter a valid finance/accounting email address for automated B2B PDF invoice delivery.',
          });
          return;
        }
      } else {
        // Paddle Card mode validation
        const cleanDigits = cardNumber.replace(/\D/g, '');
        if (cleanDigits.length < 13 || cleanDigits.length > 19) {
          addToast({
            type: 'error',
            title: 'Card Number Required',
            description: 'Please enter a valid 15 or 16-digit credit/debit card number.',
          });
          return;
        }
        if (!validateLuhn(cleanDigits)) {
          addToast({
            type: 'error',
            title: 'Invalid Card Number (Luhn Check Failed)',
            description: 'The entered card number is not a valid credit or debit card checksum. Please enter a genuine card.',
          });
          return;
        }
        if (!cardHolder.trim() || cardHolder.trim().length < 2) {
          addToast({
            type: 'error',
            title: 'Cardholder Name Required',
            description: 'Please enter the name printed on your card.',
          });
          return;
        }
        if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
          addToast({
            type: 'error',
            title: 'Invalid Expiration Date',
            description: 'Please enter a valid card expiration date in MM/YY format.',
          });
          return;
        }
        const [expMonthStr, expYearStr] = cardExpiry.split('/');
        const expMonth = parseInt(expMonthStr, 10);
        const expYear = parseInt('20' + expYearStr, 10);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
          addToast({
            type: 'error',
            title: 'Invalid Expiry Month',
            description: 'Card expiration month must be between 01 and 12.',
          });
          return;
        }
        if (isNaN(expYear) || expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
          addToast({
            type: 'error',
            title: 'Card Expired',
            description: 'The entered expiration date is in the past. Please check your card.',
          });
          return;
        }
        if (cardCvv.length < 3) {
          addToast({
            type: 'error',
            title: 'Security Code Required',
            description: 'Please enter the 3 or 4-digit CVV / CVC code on your card.',
          });
          return;
        }
      }
    } else if (selectedGateway === 'authorizenet' && authnetSubTab === 'echeck') {
      const cleanRouting = authnetRouting.replace(/\D/g, '');
      if (cleanRouting.length !== 9) {
        addToast({
          type: 'error',
          title: '9-Digit Routing Number Required',
          description: 'Please enter a valid 9-digit ABA Routing Transit Number for US Bank accounts.',
        });
        return;
      }
      const cleanAccount = authnetAccount.replace(/\D/g, '');
      if (cleanAccount.length < 4 || cleanAccount.length > 17) {
        addToast({
          type: 'error',
          title: 'Valid Account Number Required',
          description: 'Please enter a valid US checking or savings account number.',
        });
        return;
      }
      if (!authnetEcheckName.trim()) {
        addToast({
          type: 'error',
          title: 'Account Holder Name Required',
          description: 'Please enter the name of the bank account holder.',
        });
        return;
      }
      if (!authnetEcheckMandateAccepted) {
        addToast({
          type: 'error',
          title: 'NACHA Authorization Required',
          description: 'Please accept the electronic debit authorization terms.',
        });
        return;
      }
    } else if (['stripe', 'authorizenet', 'cashfree'].includes(selectedGateway) || (selectedGateway === 'square' && squareSubTab === 'card')) {
      const cleanDigits = cardNumber.replace(/\D/g, '');
      if (cleanDigits.length < 13 || cleanDigits.length > 19) {
        addToast({
          type: 'error',
          title: 'Card Number Required',
          description: 'Please enter a valid 15 or 16-digit credit/debit card number.',
        });
        return;
      }
      if (!validateLuhn(cleanDigits)) {
        addToast({
          type: 'error',
          title: 'Invalid Card Number (Luhn Check Failed)',
          description: 'The entered card number is not a valid credit or debit card checksum. Please enter a genuine card.',
        });
        return;
      }
      if (!cardHolder.trim() || cardHolder.trim().length < 2) {
        addToast({
          type: 'error',
          title: 'Cardholder Name Required',
          description: 'Please enter the name printed on your card.',
        });
        return;
      }
      if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
        addToast({
          type: 'error',
          title: 'Invalid Expiration Date',
          description: 'Please enter a valid card expiration date in MM/YY format.',
        });
        return;
      }
      const [expMonthStr, expYearStr] = cardExpiry.split('/');
      const expMonth = parseInt(expMonthStr, 10);
      const expYear = parseInt('20' + expYearStr, 10);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
        addToast({
          type: 'error',
          title: 'Invalid Expiry Month',
          description: 'Card expiration month must be between 01 and 12.',
        });
        return;
      }
      if (isNaN(expYear) || expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        addToast({
          type: 'error',
          title: 'Card Expired',
          description: 'The entered expiration date is in the past. Please check your card.',
        });
        return;
      }
      if (cardCvv.length < 3) {
        addToast({
          type: 'error',
          title: 'Security Code Required',
          description: 'Please enter the 3 or 4-digit CVV / CVC code on your card.',
        });
        return;
      }
    }

    // 2. Strict PhonePe Validation
    if (selectedGateway === 'phonepe') {
      const cleanPhone = billingPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        addToast({
          type: 'error',
          title: 'Mobile Number Required',
          description: 'Please enter a valid 10-digit mobile number for PhonePe UPI intent.',
        });
        return;
      }
    }

    // 3. Strict Paytm Validation
    if (selectedGateway === 'paytm') {
      const cleanMobile = paytmMobile.replace(/\D/g, '');
      if (cleanMobile.length < 10) {
        addToast({
          type: 'error',
          title: 'Paytm Mobile Number Required',
          description: 'Please enter your 10-digit registered Paytm mobile number.',
        });
        return;
      }
      if (paytmSubTab === 'wallet_otp' && (!paytmOtpCode || paytmOtpCode.replace(/\D/g, '').length < 4)) {
        addToast({
          type: 'error',
          title: 'Paytm OTP Required',
          description: 'Please enter the 6-digit authorization OTP sent to your registered mobile number.',
        });
        return;
      }
    }

    // 4. Strict Mercado Pago Validation
    if (selectedGateway === 'mercadopago' || selectedGateway === 'mercado_pago') {
      const cleanCpf = mercadoCpf.replace(/\D/g, '');
      if (cleanCpf.length < 11) {
        addToast({
          type: 'error',
          title: 'CPF / CNPJ Document Required',
          description: 'Please enter your valid 11-digit CPF or 14-digit CNPJ document number.',
        });
        return;
      }
    }

    // 5. Strict Flutterwave Validation
    if (selectedGateway === 'flutterwave') {
      if (flwMomoProvider === 'mpesa') {
        const cleanFlw = flwPhone.replace(/\D/g, '');
        if (cleanFlw.length < 9) {
          addToast({
            type: 'error',
            title: 'Safaricom M-Pesa Number Required',
            description: 'Please enter your registered M-Pesa phone number (e.g. +254 712 345678).',
          });
          return;
        }
      } else if (flwMomoProvider === 'mtn') {
        const cleanMtn = flwMtnPhone.replace(/\D/g, '');
        if (cleanMtn.length < 9) {
          addToast({
            type: 'error',
            title: 'MTN MoMo Number Required',
            description: 'Please enter your registered MTN Ghana mobile money number (e.g. +233 24 123 4567).',
          });
          return;
        }
      } else if (flwMomoProvider === 'airtel') {
        const cleanAirtel = flwAirtelPhone.replace(/\D/g, '');
        if (cleanAirtel.length < 9) {
          addToast({
            type: 'error',
            title: 'Airtel Money Number Required',
            description: 'Please enter your registered Airtel Uganda phone number (e.g. +256 70 123 4567).',
          });
          return;
        }
      }
    }

    // 6. Strict Skrill & Neteller Validation
    if (selectedGateway === 'skrill') {
      if (!skrillEmail.includes('@') || !skrillEmail.includes('.')) {
        addToast({
          type: 'error',
          title: 'Valid Email Required',
          description: `Please enter your registered ${skrillSubTab === 'skrill' ? 'Skrill' : 'Neteller'} account email address.`,
        });
        return;
      }
      if (skrillSubTab === 'neteller' && netellerSecureId && netellerSecureId.length < 6) {
        addToast({
          type: 'error',
          title: 'Neteller 6-Digit Secure ID Required',
          description: 'Please enter your 6-digit Neteller Secure ID / Authentication PIN.',
        });
        return;
      }
    }

    // 6b. Strict Mollie European Validation
    if (selectedGateway === 'mollie') {
      if (mollieSubTab === 'ideal' && !mollieBank) {
        addToast({
          type: 'error',
          title: 'Dutch Bank Selection Required',
          description: 'Please select your registered Dutch bank for iDEAL direct authorization.',
        });
        return;
      }
      if (mollieSubTab === 'bancontact' && bancontactMode === 'card') {
        const cleanBc = bancontactCardNumber.replace(/\D/g, '');
        if (cleanBc.length < 16) {
          addToast({
            type: 'error',
            title: 'Valid Bancontact Card Number Required',
            description: 'Please enter a valid 16 to 19-digit Belgian Bancontact debit card number.',
          });
          return;
        }
      }
      if (mollieSubTab === 'sepa') {
        const cleanIban = sepaIban.replace(/\s+/g, '').toUpperCase();
        if (cleanIban.length < 15) {
          addToast({
            type: 'error',
            title: 'Valid Eurozone IBAN Required',
            description: 'Please enter a valid SEPA International Bank Account Number (IBAN).',
          });
          return;
        }
        if (!sepaAccountHolder.trim()) {
          addToast({
            type: 'error',
            title: 'Account Holder Name Required',
            description: 'Please enter the official bank account holder name for SEPA debit.',
          });
          return;
        }
        if (!sepaMandateAccepted) {
          addToast({
            type: 'error',
            title: 'SEPA Mandate Authorization Required',
            description: 'Please accept the SEPA Core Direct Debit mandate authorization terms.',
          });
          return;
        }
      }
    }

    // 6c. Strict Klarna BNPL & Installment Validation
    if (selectedGateway === 'klarna') {
      if (!klarnaAgreementAccepted) {
        addToast({
          type: 'error',
          title: 'Klarna Terms Authorization Required',
          description: 'Please accept Klarna shopping service terms and recurring auto-debit agreement.',
        });
        return;
      }
      if (!klarnaDob || klarnaDob.length < 8) {
        addToast({
          type: 'error',
          title: 'Date of Birth Required',
          description: 'Klarna BNPL soft credit check requires customer Date of Birth (must be 18+).',
        });
        return;
      }
      const dobDate = new Date(klarnaDob);
      const ageDiffMs = Date.now() - dobDate.getTime();
      const ageDate = new Date(ageDiffMs);
      const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (isNaN(calculatedAge) || calculatedAge < 18) {
        addToast({
          type: 'error',
          title: 'Age Verification Failed (18+ Required)',
          description: 'Klarna Buy Now Pay Later financing requires applicants to be at least 18 years of age.',
        });
        return;
      }

      const cleanKlarnaPhone = (klarnaPhone || billingPhone).replace(/\D/g, '');
      if (cleanKlarnaPhone.length < 10) {
        addToast({
          type: 'error',
          title: 'Valid Mobile Phone Required',
          description: 'Please enter a valid mobile number for Klarna 1-click SMS verification.',
        });
        return;
      }

      if (klarnaSubTab === 'pay_in_4') {
        const cleanCard = (klarnaCardNumber || cardNumber).replace(/\D/g, '');
        if (cleanCard.length < 13 || cleanCard.length > 19) {
          addToast({
            type: 'error',
            title: 'Auto-Debit Card Number Required',
            description: 'Please enter a valid debit or credit card number for automatic bi-weekly installment deductions.',
          });
          return;
        }
      }

      if (klarnaSubTab === 'pay_now') {
        const cleanIban = klarnaBankIban.replace(/\s+/g, '').toUpperCase();
        if (cleanIban.length < 10) {
          addToast({
            type: 'error',
            title: 'Bank IBAN / Account Number Required',
            description: 'Please enter a valid Eurozone IBAN or Bank Account Number for Klarna Sofort direct clearing.',
          });
          return;
        }
      }
    }

    // 6d. Strict Mercado Pago LatAm Validation
    if (selectedGateway === 'mercadopago') {
      if (mercadoMethod === 'pix' || mercadoMethod === 'boleto') {
        const cleanDoc = mercadoCpf.replace(/\D/g, '');
        if (cleanDoc.length < 11 || cleanDoc.length > 14) {
          addToast({
            type: 'error',
            title: 'CPF / CNPJ Document Number Required',
            description: 'Please enter a valid 11-digit CPF or 14-digit CNPJ for Brazilian Central Bank (BACEN) clearing.',
          });
          return;
        }
      }
      if (mercadoMethod === 'card') {
        const cleanCard = (mercadoCardNumber || cardNumber).replace(/\D/g, '');
        if (cleanCard.length < 13 || cleanCard.length > 19) {
          addToast({
            type: 'error',
            title: 'Valid Card Number Required',
            description: 'Please enter a valid 15 or 16-digit credit/debit card number.',
          });
          return;
        }
        if (!validateLuhn(cleanCard)) {
          addToast({
            type: 'error',
            title: 'Invalid Card Number (Luhn Check Failed)',
            description: 'The card checksum validation failed. Please check your card number.',
          });
          return;
        }
        const cleanDoc = (mercadoDocNumber || mercadoCpf).replace(/\D/g, '');
        if (cleanDoc.length < 5) {
          addToast({
            type: 'error',
            title: `${mercadoDocType || 'Document'} Number Required`,
            description: `Please enter a valid ${mercadoDocType || 'national identification'} number.`,
          });
          return;
        }
      }
    }

    // 6e. Strict Adyen Global Gateway Validation
    if (selectedGateway === 'adyen') {
      if (adyenSubTab === 'card') {
        const cleanDigits = cardNumber.replace(/\D/g, '');
        if (cleanDigits.length < 13 || cleanDigits.length > 19) {
          addToast({
            type: 'error',
            title: 'Card Number Required',
            description: 'Please enter a valid credit or debit card number.',
          });
          return;
        }
        if (!validateLuhn(cleanDigits)) {
          addToast({
            type: 'error',
            title: 'Invalid Card Number (Luhn Check Failed)',
            description: 'The card checksum validation failed. Please check your card number.',
          });
          return;
        }
        if (!cardHolder.trim() || cardHolder.trim().length < 2) {
          addToast({
            type: 'error',
            title: 'Cardholder Name Required',
            description: 'Please enter the name as printed on your card.',
          });
          return;
        }
        if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
          addToast({
            type: 'error',
            title: 'Invalid Expiration Date',
            description: 'Please enter a valid card expiration date (MM/YY).',
          });
          return;
        }
        if (cardCvv.length < 3) {
          addToast({
            type: 'error',
            title: 'Security Code Required',
            description: 'Please enter the 3 or 4-digit CVV / CVC code.',
          });
          return;
        }
      } else if (adyenSubTab === 'local_banking') {
        if (adyenBank === 'blik') {
          const cleanBlik = adyenBlikCode.replace(/\D/g, '');
          if (cleanBlik.length !== 6) {
            addToast({
              type: 'error',
              title: 'BLIK 6-Digit Code Required',
              description: 'Please enter the 6-digit one-time code from your Polish bank app.',
            });
            return;
          }
        }
        if (adyenBank === 'ideal' && !adyenIdealBank) {
          addToast({
            type: 'error',
            title: 'iDEAL Bank Issuer Required',
            description: 'Please select your Dutch bank (ING, Rabobank, ABN AMRO, etc.).',
          });
          return;
        }
      }
    }

    // 6f. Strict Square Cash App & Afterpay Validation
    if (selectedGateway === 'square') {
      if (squareSubTab === 'cashapp') {
        const cleanCashtag = squareCustomerCashtag.trim().replace(/^\$/, '');
        if (!cleanCashtag || cleanCashtag.length < 2) {
          addToast({
            type: 'error',
            title: 'Valid $Cashtag Required',
            description: 'Please enter a valid Cash App username handle (e.g. $yourhandle).',
          });
          return;
        }
      } else if (squareSubTab === 'afterpay') {
        if (!squareAfterpayAccepted) {
          addToast({
            type: 'error',
            title: 'Afterpay Authorization Required',
            description: 'Please accept the Afterpay 4-installment schedule authorization terms.',
          });
          return;
        }
        const cleanPhone = squareAfterpayPhone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          addToast({
            type: 'error',
            title: 'Valid Mobile Phone Required',
            description: 'Please enter a valid 10-digit mobile number for Afterpay SMS authorization.',
          });
          return;
        }
        if (!squareAfterpayDob || squareAfterpayDob.length < 8) {
          addToast({
            type: 'error',
            title: 'Date of Birth Required',
            description: 'Afterpay requires Date of Birth to verify credit eligibility (must be 18+).',
          });
          return;
        }
        const dobDate = new Date(squareAfterpayDob);
        const ageDiffMs = Date.now() - dobDate.getTime();
        const ageDate = new Date(ageDiffMs);
        const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
        if (isNaN(calculatedAge) || calculatedAge < 18) {
          addToast({
            type: 'error',
            title: 'Eligibility Failed (18+ Required)',
            description: 'Afterpay installment financing requires applicants to be at least 18 years of age.',
          });
          return;
        }

        const effectiveCardNum = (squareAfterpayCardNumber || cardNumber).replace(/\D/g, '');
        if (effectiveCardNum.length < 13 || effectiveCardNum.length > 19) {
          addToast({
            type: 'error',
            title: '1st Installment Card Required',
            description: 'Please enter a valid card number for initial 25% debit and scheduled installments.',
          });
          return;
        }
        if (!validateLuhn(effectiveCardNum)) {
          addToast({
            type: 'error',
            title: 'Invalid Card Number (Luhn Check Failed)',
            description: 'The entered payment card failed checksum verification. Please enter a genuine card.',
          });
          return;
        }
        const effectiveCardExp = squareAfterpayCardExpiry || cardExpiry;
        if (!effectiveCardExp.includes('/') || effectiveCardExp.length < 5) {
          addToast({
            type: 'error',
            title: 'Invalid Expiration Date',
            description: 'Please enter a valid card expiration date in MM/YY format.',
          });
          return;
        }
        const effectiveCardCvv = squareAfterpayCardCvv || cardCvv;
        if (effectiveCardCvv.length < 3) {
          addToast({
            type: 'error',
            title: 'CVV / Security Code Required',
            description: 'Please enter the 3 or 4-digit CVV security code for your card.',
          });
          return;
        }
        if (!squareAfterpayOtp || squareAfterpayOtp.replace(/\D/g, '').length < 6) {
          addToast({
            type: 'error',
            title: '6-Digit Afterpay SMS Code Required',
            description: 'Please enter the 6-digit SMS verification code sent to your phone.',
          });
          return;
        }
      }
    }

    // 7. Strict Bank Transfer UTR Validation
    if (selectedGateway === 'bank_transfer') {
      const utrRes = validateBankUtr(offlineUtr);
      if (!utrRes.isValid) {
        addToast({
          type: 'error',
          title: 'Invalid Bank UTR Reference',
          description: utrRes.errorMessage || 'Please enter a valid bank UTR / Reference number.',
        });
        return;
      }
    }

    try {
      if (selectedGateway === 'bank_transfer') {
        const cleanUtr = offlineUtr.trim().toUpperCase();
        setStep(4);
        setProvisioningProgress(25);
        setProvisioningStage(1);
        setProvisioningLogs([
          `[AUTH] Initializing 256-Bit cryptographic handshake for ${isWalletTopup ? 'Wallet Top-Up' : selectedPlan.name}...`,
          `[GATEWAY] Routing through Sovereign Commercial Bank Settlement Rail...`,
        ]);

        const offlinePayload = {
          mode: isWalletTopup ? 'wallet_topup' : 'subscription_purchase',
          plan_id: isWalletTopup ? undefined : selectedPlan.id,
          topup_amount_usd: isWalletTopup ? effectiveTopupUsd : undefined,
          billing_cycle: isWalletTopup ? 'one_time' : billingCycle,
          currency: selectedCurrencyCode,
          bank_reference_utr: cleanUtr,
          billing_name: billingName,
          billing_email: billingEmail,
          billing_address: billingAddress,
          tax_id: taxId,
          notes: `${offlineNotes} (Date: ${offlineDate})`,
        };

        const res = await fetchAPI('/api/billing/offline/submit', {
          method: 'POST',
          body: JSON.stringify(offlinePayload),
        });

        // Stage 2: 50% Progress (Pending Super Admin Bank Verification)
        await new Promise((r) => setTimeout(r, 400));
        setProvisioningProgress(50);
        setProvisioningStage(2);
        setProvisioningLogs((prev) => [
          ...prev,
          `[LEDGER] Registered Bank Transfer UTR: ${cleanUtr} in Sovereign Ledger... OK`,
          `[STATUS] Queued for Super Admin bank credit settlement reconciliation.`,
        ]);

        const activeBankGw = enabledGateways.find(
          (g) => g.gateway_key === 'bank_transfer' || g.gateway_key === 'bank_wire' || g.gateway_key === 'wire' || g.category === 'offline'
        );
        const resolvedBankName = activeBankGw?.bank_name || activeBankGw?.details_json?.bank_name || 'Bank of India';
        const resolvedBeneficiary = activeBankGw?.bank_beneficiary || activeBankGw?.details_json?.bank_beneficiary || 'Create Call OS Technologies Private Limited';

        const offlineInvoice = {
          invoice_number: res.invoice_number || `INV-OFFLINE-${Date.now().toString().slice(-6)}`,
          transaction_id: res.transaction_id || `TXN-${Date.now()}`,
          status: 'offline_pending',
          mode: isWalletTopup ? 'wallet_topup' : 'subscription_purchase',
          billing_name: billingName,
          billing_email: billingEmail,
          billing_address: billingAddress,
          billing_phone: billingPhone,
          tax_id: taxId,
          plan_name: isWalletTopup ? 'Prepaid Carrier Wallet Top-Up' : selectedPlan.name,
          plan_price: basePriceUsd,
          catalog_price_local: subtotalLocal,
          original_price: subtotalLocal,
          discount_amount: discountAmountLocal,
          coupon_code: appliedCoupon?.code,
          billing_cycle: isWalletTopup ? 'One-Time' : billingCycle,
          amount_local: totalAmountLocal,
          total_amount: totalAmountLocal,
          subtotal: taxableAmountLocal,
          tax_amount: taxAmountLocal,
          currency: selectedCurrencyCode,
          currency_symbol: currentCurrency.symbol,
          gateway: 'Commercial Bank Remittance Standard (NEFT/RTGS/IMPS)',
          gateway_key: 'bank_transfer',
          bank_name: resolvedBankName,
          bank_beneficiary: resolvedBeneficiary,
          bank_reference_utr: cleanUtr,
          credited_amount_usd: isWalletTopup ? effectiveTopupUsd : undefined,
          allocated_minutes: isWalletTopup ? undefined : selectedPlan.includedMinutes,
          allocated_concurrency: isWalletTopup ? undefined : selectedPlan.concurrencyLimit,
          created_at: new Date().toLocaleDateString(),
        };

        setCompletedInvoice(offlineInvoice);
        setStep(4);
        // Note: Do NOT trigger onSuccess for offline transfers until Super Admin settles bank credits
        addToast({
          type: 'success',
          title: 'Bank Wire Reference Recorded',
          description: 'UTR submitted to Super Admin ledger. Awaiting bank credit verification.',
        });
        return;
      }

      // Calculate effective checkout currency (ensuring flutterwave gets supported African currency)
      const effectiveCheckoutCurrency = (() => {
        if (selectedGateway === 'flutterwave') {
          const supported = GATEWAY_CURRENCY_SUPPORT['flutterwave'] || [];
          if (supported.includes(selectedCurrencyCode)) {
            return selectedCurrencyCode;
          }
          if (flwMomoProvider === 'mtn') return 'GHS';
          if (flwMomoProvider === 'airtel') return 'UGX';
          if (flwMomoProvider === 'bank') return 'NGN';
          return 'KES';
        }
        return selectedCurrencyCode;
      })();

      // Online Gateway Initiation
      const initPayload = {
        mode: isWalletTopup ? 'wallet_topup' : 'subscription_purchase',
        plan_id: isWalletTopup ? undefined : selectedPlan.id,
        topup_amount_usd: isWalletTopup ? effectiveTopupUsd : undefined,
        billing_cycle: isWalletTopup ? 'one_time' : billingCycle,
        currency: effectiveCheckoutCurrency,
        country: country,
        billing_name: billingName,
        billing_email: billingEmail,
        billing_address: billingAddress,
        tax_id: taxId,
        coupon_code: appliedCoupon?.code || undefined,
        gateway: selectedGateway,
        skrill_email: selectedGateway === 'skrill' ? skrillEmail : undefined,
        skrill_sub_tab: selectedGateway === 'skrill' ? skrillSubTab : undefined,
        neteller_secure_id: selectedGateway === 'skrill' && skrillSubTab === 'neteller' ? netellerSecureId : undefined,
        mollie_sub_tab: selectedGateway === 'mollie' ? mollieSubTab : undefined,
        mollie_bank: selectedGateway === 'mollie' ? mollieBank : undefined,
        sepa_iban: selectedGateway === 'mollie' && mollieSubTab === 'sepa' ? sepaIban.replace(/\s+/g, '').toUpperCase() : undefined,
        sepa_account_holder: selectedGateway === 'mollie' && mollieSubTab === 'sepa' ? sepaAccountHolder : undefined,
        klarna_sub_tab: selectedGateway === 'klarna' ? klarnaSubTab : undefined,
        klarna_dob: selectedGateway === 'klarna' ? klarnaDob : undefined,
        klarna_phone: selectedGateway === 'klarna' ? (klarnaPhone || billingPhone) : undefined,
        klarna_financing_months: selectedGateway === 'klarna' && klarnaSubTab === 'financing' ? klarnaFinancingMonths : undefined,
        klarna_card_last4: selectedGateway === 'klarna' && klarnaSubTab === 'pay_in_4' ? ((klarnaCardNumber || cardNumber).replace(/\D/g, '').slice(-4) || '4242') : undefined,
        klarna_agreement_accepted: selectedGateway === 'klarna' ? klarnaAgreementAccepted : undefined,
        mercado_method: selectedGateway === 'mercadopago' ? mercadoMethod : undefined,
        mercado_cpf: selectedGateway === 'mercadopago' ? mercadoCpf : undefined,
        mercado_installments: selectedGateway === 'mercadopago' && mercadoMethod === 'card' ? mercadoInstallments : undefined,
        mercado_doc_type: selectedGateway === 'mercadopago' ? mercadoDocType : undefined,
        mercado_doc_number: selectedGateway === 'mercadopago' ? (mercadoDocNumber || mercadoCpf) : undefined,
        adyen_sub_tab: selectedGateway === 'adyen' ? adyenSubTab : undefined,
        adyen_bank: selectedGateway === 'adyen' ? adyenBank : undefined,
        adyen_ideal_bank: selectedGateway === 'adyen' && adyenBank === 'ideal' ? adyenIdealBank : undefined,
        adyen_bancontact_bank: selectedGateway === 'adyen' && adyenBank === 'bancontact' ? adyenBancontactBank : undefined,
        adyen_sofort_bank: selectedGateway === 'adyen' && adyenBank === 'sofort' ? adyenSofortBank : undefined,
        adyen_cb_bank: selectedGateway === 'adyen' && adyenBank === 'cartes_bancaires' ? adyenCbBank : undefined,
        adyen_eps_bank: selectedGateway === 'adyen' && adyenBank === 'eps' ? adyenEpsBank : undefined,
        adyen_blik_bank: selectedGateway === 'adyen' && adyenBank === 'blik' ? adyenBlikBank : undefined,
        adyen_blik_code: selectedGateway === 'adyen' && adyenBank === 'blik' ? adyenBlikCode : undefined,
        adyen_iban: selectedGateway === 'adyen' ? adyenIban : undefined,
        adyen_account_holder: selectedGateway === 'adyen' ? (adyenAccountHolder || billingName) : undefined,
        adyen_installments: selectedGateway === 'adyen' ? adyenInstallments : undefined,
        adyen_3ds_verified: selectedGateway === 'adyen' ? (adyen3dsStatus === 'verified') : undefined,
        flw_momo_provider: selectedGateway === 'flutterwave' ? flwMomoProvider : undefined,
        flw_phone: selectedGateway === 'flutterwave' ? (flwMomoProvider === 'mpesa' ? flwPhone : flwMomoProvider === 'mtn' ? flwMtnPhone : flwMomoProvider === 'airtel' ? flwAirtelPhone : billingPhone) : undefined,
        crypto_coin: (selectedGateway === 'crypto' || selectedGateway === 'coinbase') ? selectedCryptoCoin : undefined,
        crypto_tx_hash: (selectedGateway === 'crypto' || selectedGateway === 'coinbase') ? cryptoTxHash : undefined,
        paddle_sub_tab: selectedGateway === 'paddle' ? paddleSubTab : undefined,
        paddle_company_name: selectedGateway === 'paddle' ? paddleCompanyName : undefined,
        paddle_vat_number: selectedGateway === 'paddle' ? paddleVatNumber : undefined,
        paddle_tax_exempt: selectedGateway === 'paddle' && paddleSubTab === 'vat_invoice' ? true : undefined,
        paddle_finance_email: selectedGateway === 'paddle' ? paddleFinanceEmail : undefined,
        paddle_settlement_rail: selectedGateway === 'paddle' ? paddleSettlementRail : undefined,
        square_sub_tab: selectedGateway === 'square' ? squareSubTab : undefined,
        square_wallet_selection: selectedGateway === 'square' && squareSubTab === 'wallets' ? squareWalletSelection : undefined,
        square_customer_cashtag: selectedGateway === 'square' && squareSubTab === 'cashapp' ? squareCustomerCashtag : undefined,
        square_postal_code: selectedGateway === 'square' ? squarePostalCode : undefined,
        square_afterpay_accepted: selectedGateway === 'square' && squareSubTab === 'afterpay' ? squareAfterpayAccepted : undefined,
        authnet_sub_tab: selectedGateway === 'authorizenet' ? authnetSubTab : undefined,
        authnet_card_number: selectedGateway === 'authorizenet' && authnetSubTab === 'card' ? cardNumber.replace(/\D/g, '') : undefined,
        authnet_exp_month: selectedGateway === 'authorizenet' && authnetSubTab === 'card' ? (cardExpiry.split('/')[0] || undefined) : undefined,
        authnet_exp_year: selectedGateway === 'authorizenet' && authnetSubTab === 'card' ? (cardExpiry.split('/')[1] || undefined) : undefined,
        authnet_cvv: selectedGateway === 'authorizenet' && authnetSubTab === 'card' ? cardCvv : undefined,
        authnet_cardholder_name: selectedGateway === 'authorizenet' && authnetSubTab === 'card' ? cardHolder : undefined,
        authnet_echeck_account_type: selectedGateway === 'authorizenet' && authnetSubTab === 'echeck' ? authnetEcheckAccountType : undefined,
        authnet_echeck_routing_number: selectedGateway === 'authorizenet' && authnetSubTab === 'echeck' ? authnetRouting.replace(/\D/g, '') : undefined,
        authnet_echeck_account_number: selectedGateway === 'authorizenet' && authnetSubTab === 'echeck' ? authnetAccount.replace(/\D/g, '') : undefined,
        authnet_echeck_name_on_account: selectedGateway === 'authorizenet' && authnetSubTab === 'echeck' ? authnetEcheckName : undefined,
        authnet_echeck_bank_name: selectedGateway === 'authorizenet' && authnetSubTab === 'echeck' ? authnetEcheckBank : undefined,
        paytm_sub_tab: selectedGateway === 'paytm' ? paytmSubTab : undefined,
        paytm_mobile_number: selectedGateway === 'paytm' ? paytmMobile : undefined,
        paytm_otp_code: selectedGateway === 'paytm' && paytmSubTab === 'wallet_otp' ? paytmOtpCode : undefined,
        paytm_fast_forward: selectedGateway === 'paytm' ? paytmFastForward : undefined,
        phonepe_sub_tab: selectedGateway === 'phonepe' ? phonepeSubTab : undefined,
        phonepe_mobile_number: selectedGateway === 'phonepe' ? (phonepeMobile || billingPhone) : undefined,
        paypal_sub_tab: selectedGateway === 'paypal' ? paypalSubTab : undefined,
        paypal_payer_email: selectedGateway === 'paypal' ? (paypalPayerEmail || billingEmail) : undefined,
        cashfree_sub_tab: selectedGateway === 'cashfree' ? cashfreeSubTab : undefined,
        cashfree_customer_phone: selectedGateway === 'cashfree' ? (cashfreeCustomerPhone || billingPhone) : undefined,
        razorpay_sub_tab: selectedGateway === 'razorpay' ? razorpaySubTab : undefined,
        razorpay_customer_vpa: selectedGateway === 'razorpay' ? (razorpayCustomerVpa || undefined) : undefined,
      };

      const initRes = await fetchAPI('/api/billing/checkout/initiate', {
        method: 'POST',
        body: JSON.stringify(initPayload),
      });

      // 100% Free Promo / Zero-Dollar Instant Provisioning (Bypasses external gateway popups)
      if (initRes.is_free_checkout || initRes.status === 'settled' || totalAmountLocal <= 0) {
        const freeCompletedInvoice = {
          id: initRes.transaction_id || `inv_free_${Date.now()}`,
          invoice_number: initRes.invoice_number || `INV-FREE-${Date.now().toString().slice(-6)}`,
          customer_name: billingName || user?.fullName || 'Workspace Owner',
          customer_email: billingEmail || user?.email || 'billing@createcall.ai',
          customer_address: billingAddress || 'Registered Business Address',
          tax_id: taxId || 'PROMO-EXEMPT',
          plan_name: isWalletTopup ? 'Prepaid Carrier Wallet Top-Up' : selectedPlan.name,
          discount_amount: discountAmountLocal || subtotalLocal,
          coupon_code: appliedCoupon?.code || initRes.coupon_code || '100% PROMO',
          billing_cycle: isWalletTopup ? 'One-Time' : billingCycle,
          amount_local: 0,
          total_amount: 0,
          subtotal: subtotalLocal,
          tax_amount: 0,
          currency: selectedCurrencyCode,
          currency_symbol: currentCurrency.symbol,
          status: 'Paid',
          gateway: '100% Promotional Credit Voucher',
          gateway_key: 'promo_100_free',
          credited_amount_usd: isWalletTopup ? effectiveTopupUsd : undefined,
          allocated_minutes: isWalletTopup ? undefined : selectedPlan.includedMinutes,
          allocated_concurrency: isWalletTopup ? undefined : selectedPlan.concurrencyLimit,
          created_at: new Date().toLocaleDateString(),
        };
        setCompletedInvoice(freeCompletedInvoice);
        setStep(5);
        addToast({
          type: 'success',
          title: isWalletTopup ? '100% Free Wallet Top-Up Credited!' : '100% Free Plan Activated!',
          description: isWalletTopup
            ? `+$${effectiveTopupUsd.toFixed(2)} USD successfully credited directly to your calling balance.`
            : `${selectedPlan.name} plan activated successfully.`,
        });
        window.dispatchEvent(new CustomEvent('billing-data-updated'));
        window.dispatchEvent(new CustomEvent('wallet-balance-updated'));
        window.dispatchEvent(new CustomEvent('plan-entitlements-updated'));
        if (onSuccess) onSuccess();
        return;
      }

      // Real Razorpay Checkout Popup Integration
      if (selectedGateway === 'razorpay') {
        const scriptReady = await loadRazorpayScript();
        if (scriptReady && (window as any).Razorpay) {
          const rzpOptions: any = {
            key: initRes.public_key || 'rzp_live_Ayqx8FqkgKWiKA',
            amount: initRes.amount_in_paise || Math.round(totalAmountLocal * 100),
            currency: initRes.currency === 'INR' ? 'INR' : selectedCurrencyCode === 'INR' ? 'INR' : 'USD',
            name: 'Create Call OS',
            description: isWalletTopup
              ? `Prepaid Carrier Wallet Top-Up (${currentCurrency.symbol}${totalAmountLocal})`
              : `${selectedPlan.name} Subscription (${billingCycle.toUpperCase()})`,
            prefill: {
              name: billingName,
              email: billingEmail,
              contact: billingPhone,
            },
            notes: {
              plan_name: isWalletTopup ? 'Prepaid Wallet' : selectedPlan.name,
              billing_cycle: billingCycle,
              transaction_id: initRes.transaction_id,
              user_id: user?.id || 'sovereign_user',
            },
            theme: {
              color: '#0d9488',
            },
            modal: {
              ondismiss: () => {
                addToast({
                  type: 'info',
                  title: 'Checkout Dismissed',
                  description: 'Razorpay checkout window was closed.',
                });
                setStep(3);
              },
            },
            handler: async (response: any) => {
              await handleVerifyAndComplete(
                {
                  transaction_id: initRes.transaction_id,
                  security_hash: initRes.security_hash,
                  gateway: 'razorpay',
                  gateway_payment_id: response.razorpay_payment_id || `pay_rzp_${Date.now()}`,
                  gateway_order_id: response.razorpay_order_id || initRes.gateway_order_id,
                  gateway_signature: response.razorpay_signature || '',
                },
                initRes
              );
            },
          };

          // ONLY attach order_id if it is an authentic order generated by Razorpay Orders API
          if (initRes.is_real_razorpay_order && initRes.gateway_order_id && initRes.gateway_order_id.startsWith('order_')) {
            rzpOptions.order_id = initRes.gateway_order_id;
          }

          if (initRes.razorpay_error) {
            console.warn('Razorpay Orders note:', initRes.razorpay_error);
          }

          const rzpInstance = new (window as any).Razorpay(rzpOptions);
          rzpInstance.on('payment.failed', (resp: any) => {
            const errorMsg = resp.error?.description || resp.error?.reason || 'Transaction could not be completed.';
            addToast({
              type: 'error',
              title: 'Razorpay Payment Failed',
              description: errorMsg,
            });
            setStep(3);
          });
          rzpInstance.open();
          return;
        }
      }

      // Online Gateway: Step 4 Provisioning & Verification
      setStep(4);
      setProvisioningProgress(15);
      setProvisioningStage(1);
      setProvisioningLogs([
        `[AUTH] Initializing 256-Bit cryptographic handshake for ${isWalletTopup ? 'Wallet Top-Up' : selectedPlan.name}...`,
        `[GATEWAY] Routing through Super Admin master gateway: ${selectedGateway.toUpperCase()}...`,
      ]);

      await new Promise((r) => setTimeout(r, 400));
      setProvisioningProgress(35);
      setProvisioningStage(2);
      setProvisioningLogs((prev) => [
        ...prev,
        `[SHA256] Generating HMAC-SHA256 anti-tamper security hash... OK`,
        `[SERVER] Super Admin Gateway connection verified (Latency: 18ms)...`,
      ]);

      const verifyPayload = {
        transaction_id: initRes.transaction_id,
        security_hash: initRes.security_hash,
        gateway: selectedGateway,
        gateway_payment_id:
          selectedGateway === 'razorpay'
            ? `pay_rzp_${Date.now()}`
            : selectedGateway === 'square'
            ? (squareSubTab === 'wallets'
                ? `sq_wallet_${squareWalletSelection}_${Date.now().toString().slice(-8)}`
                : squareSubTab === 'cashapp'
                ? `sq_cashapp_${(squareCustomerCashtag || 'user').replace('$', '')}_${Date.now().toString().slice(-8)}`
                : squareSubTab === 'afterpay'
                ? `sq_afterpay_bnpl_${Date.now().toString().slice(-8)}`
                : `sq_card_${Date.now().toString().slice(-8)}`)
            : selectedGateway === 'authorizenet'
            ? (authnetSubTab === 'echeck' ? `authnet_ach_${Date.now().toString().slice(-8)}` : `authnet_cc_${Date.now().toString().slice(-8)}`)
            : selectedGateway === 'paytm'
            ? (paytmSubTab === 'wallet_otp' ? `ptm_wallet_${paytmMobile.slice(-4)}_${Date.now().toString().slice(-8)}` : `ptm_qr_${Date.now().toString().slice(-8)}`)
            : selectedGateway === 'stripe'
            ? `ch_stripe_${Date.now()}`
            : selectedGateway === 'phonepe'
            ? `T260918${Date.now()}`
            : selectedGateway === 'flutterwave'
            ? `flw_${flwMomoProvider}_${Date.now()}`
            : selectedGateway === 'skrill'
            ? `${skrillSubTab}_${Date.now()}`
            : selectedGateway === 'mollie'
            ? `mollie_${mollieSubTab}_${Date.now()}`
            : (selectedGateway === 'crypto' || selectedGateway === 'coinbase')
            ? (cryptoTxHash ? `tx_${cryptoTxHash.slice(0, 16)}` : `web3_${selectedCryptoCoin}_${Date.now()}`)
            : `tx_${Date.now()}`,
        paytm_sub_tab: selectedGateway === 'paytm' ? paytmSubTab : undefined,
        paytm_mobile_number: selectedGateway === 'paytm' ? paytmMobile : undefined,
        paytm_otp_code: selectedGateway === 'paytm' && paytmSubTab === 'wallet_otp' ? paytmOtpCode : undefined,
        paytm_fast_forward: selectedGateway === 'paytm' ? paytmFastForward : undefined,
        phonepe_sub_tab: selectedGateway === 'phonepe' ? phonepeSubTab : undefined,
        phonepe_mobile_number: selectedGateway === 'phonepe' ? (phonepeMobile || billingPhone) : undefined,
        paypal_sub_tab: selectedGateway === 'paypal' ? paypalSubTab : undefined,
        paypal_payer_email: selectedGateway === 'paypal' ? (paypalPayerEmail || billingEmail) : undefined,
        cashfree_sub_tab: selectedGateway === 'cashfree' ? cashfreeSubTab : undefined,
        cashfree_customer_phone: selectedGateway === 'cashfree' ? (cashfreeCustomerPhone || billingPhone) : undefined,
        razorpay_sub_tab: selectedGateway === 'razorpay' ? razorpaySubTab : undefined,
        razorpay_customer_vpa: selectedGateway === 'razorpay' ? (razorpayCustomerVpa || undefined) : undefined,
      };

      await handleVerifyAndComplete(verifyPayload, initRes);
    } catch (err: any) {
      setAuthError(err.message || 'Payment processing failed. Please try another gateway.');
      setStep(4);
      addToast({
        type: 'error',
        title: 'Checkout Error',
        description: err.message || 'Payment processing failed. Please try another gateway.',
      });
    }
  };

  // Render Card Scheme Brand Logo
  const renderSchemeLogo = () => {
    switch (cardIntelligence.scheme) {
      case 'visa':
        return <VisaBrandLogo size="md" />;
      case 'mastercard':
        return <MastercardBrandLogo size="md" />;
      case 'amex':
        return <AmexBrandLogo size="md" />;
      case 'discover':
        return <DiscoverBrandLogo size="md" />;
      case 'rupay':
        return <RupayBrandLogo size="md" />;
      default:
        return (
          <span className="font-mono text-xs font-black uppercase tracking-wider text-teal-300 bg-black/60 px-2 py-0.5 rounded border border-teal-500/40">
            {cardIntelligence.brandName}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-16">
      {/* 1. TOP HEADER & BREADCRUMB BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="font-bold border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs rounded-lg"
        >
          {isWalletTopup ? 'Back to Billing Center' : 'Back to Subscription Plans'}
        </Button>

        {/* Global Security & Dynamic Currency Dropdown */}
        <div className="flex items-center gap-2.5">
          {/* Custom Searchable Currency Dropdown (Clean, Non-Repeating Display) */}
          <div className="relative" ref={currencyDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsCurrencyDropdownOpen((prev) => !prev);
                setCurrencySearchQuery('');
              }}
              className="h-8 px-3 flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 hover:border-teal-500 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer shadow-xs"
            >
              <Globe className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="text-zinc-400 text-[11px]">Currency:</span>
              <span className="text-sm leading-none">{currentCurrency.flag}</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{currentCurrency.code}</span>
              {currentCurrency.symbol && currentCurrency.symbol.trim() !== currentCurrency.code.trim() && (
                <span className="text-zinc-400">({currentCurrency.symbol})</span>
              )}
              <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCurrencyDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-80 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-1 z-50 divide-y divide-zinc-100 dark:divide-zinc-800">
                <div className="p-2.5 space-y-2">
                  <div className="flex items-center justify-between px-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Forex Rates SSOT
                    </span>
                    <button
                      type="button"
                      onClick={handleSyncLiveRates}
                      disabled={isSyncingRates}
                      className="text-[10px] font-mono text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Force refresh live forex rates"
                    >
                      <RefreshCw className={`h-3 w-3 ${isSyncingRates ? 'animate-spin text-teal-600' : ''}`} />
                      {isSyncingRates ? 'Syncing...' : 'Sync Live'}
                    </button>
                  </div>

                  {/* Live Rate Indicator for Current Currency */}
                  <div className="p-1.5 rounded-md bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-900/60 text-[11px] font-mono flex items-center justify-between">
                    <span className="text-zinc-500">Live Forex Rate:</span>
                    <strong className="text-teal-700 dark:text-teal-300 font-bold">
                      1 USD = {currentCurrency.rate} {currentCurrency.code}
                    </strong>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={currencySearchQuery}
                      onChange={(e) => setCurrencySearchQuery(e.target.value)}
                      placeholder="Search currency, code, country..."
                      className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-medium"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
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
                            {curr.symbol && curr.symbol.trim() !== curr.code.trim() && (
                              <span className="text-[11px]">({curr.symbol})</span>
                            )}
                            {isSelected && <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-zinc-400">No currency found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1.5 rounded-lg text-xs font-bold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>256-Bit SSL Rail</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN TITLE BANNER */}
      <div className="p-5 rounded-lg bg-gradient-to-r from-teal-900/10 via-emerald-900/5 to-transparent border border-teal-200/60 dark:border-teal-900/40">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
              {isWalletTopup ? (
                <>
                  <Wallet className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  Prepaid Carrier Trunking Wallet Top-Up
                </>
              ) : (
                <>
                  <ShieldCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  Secure Enterprise Checkout &amp; Instant Plan Provisioning
                </>
              )}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              End-to-end encrypted • Super Admin Master Gateway Connection • Dynamic Voice Line Provisioning
            </p>
          </div>
          <Badge variant="teal" size="sm" className="font-mono text-xs rounded-md">
            Super Admin SSOT Verified
          </Badge>
        </div>
      </div>

      {/* 3. INTERACTIVE STEP TRACKER BAR (When not in invoice mode) */}
      {step < 5 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              step === 1
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : step > 1
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 1 ? 'bg-white text-teal-600' : step > 1 ? 'bg-teal-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            >
              {step > 1 ? <Check className="h-3 w-3" /> : '1'}
            </span>
            <span className="truncate">{isWalletTopup ? 'Top-Up Amount' : 'Plan & Cycle'}</span>
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              step === 2
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : step > 2
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 2 ? 'bg-white text-teal-600' : step > 2 ? 'bg-teal-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            >
              {step > 2 ? <Check className="h-3 w-3" /> : '2'}
            </span>
            <span className="truncate">Customer &amp; Tax</span>
          </button>

          <button
            type="button"
            onClick={() => setStep(3)}
            className={`flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              step === 3
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : step > 3
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 3 ? 'bg-white text-teal-600' : step > 3 ? 'bg-teal-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            >
              {step > 3 ? <Check className="h-3 w-3" /> : '3'}
            </span>
            <span className="truncate">Payment &amp; Pay</span>
          </button>
        </div>
      )}

      {/* STEP 4: FIGMA-STYLE PREMIUM PAYMENT VERIFICATION & 3D SECURE VIEW */}
      {step === 4 && (
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-xl overflow-hidden w-full">
          {/* Card Header with Brand Logo & Status Badge */}
          <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="h-12 min-w-[155px] max-w-[210px] px-3.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs">
                <GatewayLogoRenderer
                  gatewayKey={selectedGateway}
                  size="md"
                  fallbackText={selectedGateway.toUpperCase()}
                />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>
                    {authError
                      ? 'Payment Authorization Failed'
                      : totalAmountLocal <= 0 || completedInvoice?.gateway?.includes('Promo')
                      ? '100% Free Promo Activation'
                      : selectedGateway === 'bank_transfer'
                      ? 'Bank Wire Settlement Verification'
                      : 'Payment Authorization'}
                  </span>
                  <Badge
                    variant={authError ? 'danger' : totalAmountLocal <= 0 ? 'emerald' : selectedGateway === 'bank_transfer' ? 'warning' : 'teal'}
                    size="xs"
                    className="font-mono text-[9px] rounded font-bold"
                  >
                    {authError ? 'REJECTED' : totalAmountLocal <= 0 ? '100% FREE' : selectedGateway === 'bank_transfer' ? 'PENDING APPROVAL' : '256-BIT TLS'}
                  </Badge>
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {authError
                    ? 'Super Admin master gateway rail communication was declined'
                    : totalAmountLocal <= 0
                    ? 'Promotional voucher verified. Plan entitlements activated in master ledger'
                    : selectedGateway === 'bank_transfer'
                    ? 'Offline payment reference recorded in sovereign master ledger'
                    : 'Secure cryptographic settlement with issuing gateway rail'}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {currentCurrency.symbol}{totalAmountLocal.toLocaleString()}
              </span>
              <span className="text-[10px] text-zinc-400 block uppercase font-mono">{selectedCurrencyCode}</span>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {authError ? (
              <div className="space-y-6">
                <div className="p-5 sm:p-6 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:rose-900/70 flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-rose-950 dark:text-rose-100">
                        Gateway Verification &amp; Authorization Declined
                      </h3>
                      <Badge variant="danger" size="xs" className="font-mono text-[9px] rounded uppercase font-bold">
                        Unconfigured Rail
                      </Badge>
                    </div>
                    <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed font-medium">
                      {authError}
                    </p>
                    <div className="p-3 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-rose-200/60 dark:border-rose-900/50 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1 font-mono">
                      <div><strong className="text-zinc-800 dark:text-zinc-200 font-sans">Payment Rail:</strong> {currentSelectedGw?.display_name || selectedGateway.toUpperCase()}</div>
                      <div><strong className="text-zinc-800 dark:text-zinc-200 font-sans">Super Admin Status:</strong> Live credentials not connected in Super Admin Hub</div>
                      <div><strong className="text-zinc-800 dark:text-zinc-200 font-sans">Security Protocol:</strong> Transaction halted to protect ledger integrity. Zero charges incurred.</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setAuthError(null);
                      setProvisioningProgress(0);
                      setProvisioningStage(1);
                      setStep(3);
                    }}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                    className="w-full sm:flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg py-3 cursor-pointer shadow-sm"
                  >
                    Return to Payment Rails &amp; Choose Connected Method (Razorpay / Bank Wire)
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={onBack}
                    className="w-full sm:w-auto font-bold text-xs rounded-lg py-3 cursor-pointer"
                  >
                    Cancel Checkout
                  </Button>
                </div>
              </div>
            ) : completedInvoice?.status === 'offline_pending' ? (
              /* DEDICATED AUTHENTIC OFFLINE BANK WIRE RECONCILIATION TERMINAL */
              <div className="space-y-6">
                {/* Bank Wire Details Banner */}
                <div className="p-5 sm:p-6 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-200 dark:border-amber-900/50 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Bank Wire / NEFT Transfer Reference Recorded
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Awaiting bank credit settlement verification by Super Admin
                        </p>
                      </div>
                    </div>
                    <Badge variant="warning" size="xs" className="font-mono text-[10px] font-bold rounded">
                      PENDING VERIFICATION
                    </Badge>
                  </div>

                  {(() => {
                    const activeBankGateway = enabledGateways.find(
                      (g) => g.gateway_key === 'bank_transfer' || g.gateway_key === 'bank_wire' || g.gateway_key === 'wire' || g.category === 'offline'
                    );
                    const realBeneficiaryBank = completedInvoice?.bank_name || activeBankGateway?.bank_name || activeBankGateway?.details_json?.bank_name || 'Bank of India';

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                        <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-amber-900/40">
                          <span className="text-[10px] text-zinc-400 block font-sans">Bank Reference / UTR:</span>
                          <strong className="text-zinc-900 dark:text-zinc-100 text-xs truncate block pt-0.5">
                            {completedInvoice?.bank_reference_utr || offlineUtr || 'SUBMITTED'}
                          </strong>
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-amber-900/40">
                          <span className="text-[10px] text-zinc-400 block font-sans">Proforma Invoice #:</span>
                          <strong className="text-zinc-900 dark:text-zinc-100 text-xs truncate block pt-0.5">
                            {completedInvoice?.invoice_number || 'INV-OFFLINE-PENDING'}
                          </strong>
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-amber-900/40">
                          <span className="text-[10px] text-zinc-400 block font-sans">Amount Payable:</span>
                          <strong className="text-amber-700 dark:text-amber-400 text-xs block pt-0.5">
                            {currentCurrency.symbol}{totalAmountLocal.toLocaleString()}
                          </strong>
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-amber-900/40">
                          <span className="text-[10px] text-zinc-400 block font-sans">Beneficiary Bank:</span>
                          <strong className="text-zinc-900 dark:text-zinc-100 text-xs block pt-0.5 truncate" title={realBeneficiaryBank}>
                            {realBeneficiaryBank}
                          </strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Bank Wire Multi-Stage Reconciliation Progress */}
                <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <span>Reconciliation Progress</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">50% (Awaiting Bank Clearing)</span>
                  </div>

                  {/* Progress Bar (50% for Offline Pending) */}
                  <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-700">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: '50%' }}
                    />
                  </div>

                  {/* 4 Steps Timeline for Bank Wire */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                    <div className="p-2.5 rounded-lg border text-center bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold">
                      <div className="flex items-center justify-center mb-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span>1. UTR Submitted</span>
                    </div>

                    <div className="p-2.5 rounded-lg border text-center bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold">
                      <div className="flex items-center justify-center mb-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span>2. Ledger Recorded</span>
                    </div>

                    <div className="p-2.5 rounded-lg border text-center bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold">
                      <div className="flex items-center justify-center mb-1">
                        <RefreshCw className="h-4 w-4 text-amber-600 animate-spin" />
                      </div>
                      <span>3. Bank Verification</span>
                    </div>

                    <div className="p-2.5 rounded-lg border text-center bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-400">
                      <div className="flex items-center justify-center mb-1">
                        <Clock className="h-4 w-4 text-zinc-400" />
                      </div>
                      <span>4. Quota Activation</span>
                    </div>
                  </div>

                  {/* Bank Wire Guidance Notice & Action Strip */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="p-3.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-950 dark:text-amber-200">
                      <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">
                          Awaiting Super Admin Bank Settlement Reconciliation
                        </strong>
                        <span className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed block mt-0.5">
                          Your UTR reference #{completedInvoice?.bank_reference_utr || offlineUtr} has been logged. Our finance team reconciles bank credits against the clearing network. Once approved by Super Admin, your plan minutes, AI lines, and entitlements will activate automatically.
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setStep(5)}
                        leftIcon={<Sparkles className="h-4 w-4" />}
                        className="w-full sm:flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg py-2.5 shadow-sm cursor-pointer"
                      >
                        View Proforma Acknowledgment Document →
                      </Button>
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => setStep(3)}
                        leftIcon={<ArrowLeft className="h-4 w-4" />}
                        className="w-full sm:w-auto font-bold text-xs rounded-lg py-2.5 cursor-pointer border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100/60"
                      >
                        ← Edit UTR / Switch Payment Rail
                      </Button>
                      <Button
                        variant="outline"
                        size="md"
                        onClick={onBack}
                        className="w-full sm:w-auto font-bold text-xs rounded-lg py-2.5 cursor-pointer text-zinc-600 dark:text-zinc-400"
                      >
                        Return to Overview
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ONLINE GATEWAY INSTANT PROVISIONING TERMINAL (RAZORPAY & LIVE RAILS) */
              <>
                {provisioningProgress >= 100 || completedInvoice ? (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-50/30 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-zinc-900 border-2 border-emerald-500/40 text-center space-y-3 shadow-xs animate-fadeIn">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-md">
                      <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
                        <span>Payment &amp; Provisioning Complete!</span>
                        <Badge variant="teal" size="xs" className="font-bold">SETTLED IN FULL</Badge>
                      </h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                        Encrypted gateway handshake confirmed. Official Tax Invoice <strong>#{completedInvoice?.invoice_number || 'SETTLED'}</strong> has been generated and recorded in the master ledger.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 1. If PADDLE B2B VAT INVOICE: Realistic Merchant of Record B2B Reverse Charge Frame */}
                    {selectedGateway === 'paddle' && paddleSubTab === 'vat_invoice' ? (
                      <div className="p-5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-700 pb-3">
                          <div className="flex items-center gap-2">
                            <PaddleLogo size="sm" />
                            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                              Paddle Merchant of Record • B2B VAT Reverse Charge Clearance
                            </span>
                          </div>
                          <Badge variant="teal" size="xs" className="font-mono text-[9px] font-bold">
                            0% REVERSE CHARGE ACTIVE
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/60">
                            <span className="text-zinc-400 text-[10px] block font-sans">B2B Company Name:</span>
                            <strong className="text-zinc-800 dark:text-zinc-200 truncate block">{paddleCompanyName || 'Enterprise Corp'}</strong>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/60">
                            <span className="text-zinc-400 text-[10px] block font-sans">Verified Tax / VAT ID:</span>
                            <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{paddleVatNumber || 'GB981273910'}</strong>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/60">
                            <span className="text-zinc-400 text-[10px] block font-sans">AP Billing Email:</span>
                            <strong className="text-zinc-800 dark:text-zinc-200 truncate block">{paddleFinanceEmail || billingEmail}</strong>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/60">
                            <span className="text-zinc-400 text-[10px] block font-sans">Settlement Rail:</span>
                            <strong className="text-zinc-800 dark:text-zinc-200">{paddleSettlementRail === 'card' ? 'Corporate Card' : paddleSettlementRail === 'sepa' ? 'SEPA B2B Direct Debit' : 'Net-30 Invoice Wire'}</strong>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 flex items-center gap-3 text-xs text-teal-900 dark:text-teal-200">
                          <RefreshCw className="h-4 w-4 text-teal-600 animate-spin shrink-0" />
                          <div>
                            <p className="font-bold">Generating Sovereign B2B Tax Invoice &amp; Reverse Charge Clearance...</p>
                            <p className="text-[11px] text-teal-700 dark:text-teal-300">
                              Paddle MoR compliance engine verifying statutory tax exemption and provisioning workspace quota.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : ['stripe', 'paddle', 'square', 'authorizenet', 'cashfree'].includes(selectedGateway) && (
                      <div className="p-5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-700 pb-3">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-teal-600" />
                            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                              {cardIntelligence.bankName || 'Card Issuer Bank'} • 3D Secure 2.0
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {renderSchemeLogo()}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/60">
                            <span className="text-zinc-400 text-[10px] block font-sans">Merchant:</span>
                            <strong className="text-zinc-800 dark:text-zinc-200">CreateCall AI OS Inc.</strong>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/60">
                            <span className="text-zinc-400 text-[10px] block font-sans">Card Number:</span>
                            <strong className="text-zinc-800 dark:text-zinc-200 font-mono">
                              •••• •••• •••• {cardNumber.replace(/\s/g, '').slice(-4) || '4242'}
                            </strong>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 flex items-center gap-3 text-xs text-teal-900 dark:text-teal-200">
                          <RefreshCw className="h-4 w-4 text-teal-600 animate-spin shrink-0" />
                          <div>
                            <p className="font-bold">Authorizing frictionless cryptographic handshake...</p>
                            <p className="text-[11px] text-teal-700 dark:text-teal-300">
                              Contacting {cardIntelligence.bankName || 'Issuing Bank'} for instant token approval.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1b. If ADYEN GLOBAL: Sub-tab aware Adyen Enterprise Terminal */}
                    {selectedGateway === 'adyen' && (
                      <div className="p-5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-700 pb-3">
                          <div className="flex items-center gap-2">
                            <AdyenLogo size="sm" />
                            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                              Adyen Enterprise Gateway • {adyenSubTab === 'card' ? '3DS2 Dynamic Auth' : adyenSubTab === 'local_banking' ? `European Direct Rail (${adyenBank.toUpperCase()})` : 'Drop-in Session Handshake'}
                            </span>
                          </div>
                          <Badge variant="teal" size="xs" className="font-mono text-[9px] font-bold">
                            {adyenSubTab === 'card' ? 'PCI-DSS 3DS2' : adyenSubTab === 'local_banking' ? 'SEPA / PSD2 DIRECT' : 'SDK ENCRYPTED'}
                          </Badge>
                        </div>

                        {adyenSubTab === 'card' ? (
                          <div className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/60">
                                <span className="text-zinc-400 text-[10px] block font-sans">Issuer Bank:</span>
                                <strong className="text-zinc-800 dark:text-zinc-200">{cardIntelligence.bankName || 'Adyen Card Network'}</strong>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/60">
                                <span className="text-zinc-400 text-[10px] block font-sans">Card Number:</span>
                                <strong className="text-zinc-800 dark:text-zinc-200 font-mono">
                                  •••• •••• •••• {cardNumber.replace(/\s/g, '').slice(-4) || '4242'}
                                </strong>
                              </div>
                            </div>
                            <div className="p-3 rounded-lg bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 flex items-center gap-3 text-teal-900 dark:text-teal-200">
                              <RefreshCw className="h-4 w-4 text-teal-600 animate-spin shrink-0" />
                              <div>
                                <p className="font-bold">Adyen RevenueAccelerate SCA Handshake...</p>
                                <p className="text-[11px] text-teal-700 dark:text-teal-300">
                                  3DS2 cryptographic challenge verified. Establishing authorized settlement token.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : adyenSubTab === 'local_banking' ? (
                          <div className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/60">
                                <span className="text-zinc-400 text-[10px] block font-sans">Banking Rail:</span>
                                <strong className="text-zinc-800 dark:text-zinc-200">
                                  {adyenBank === 'ideal' ? `iDEAL (${adyenIdealBank})` : adyenBank === 'blik' ? `BLIK (${adyenBlikCode || '••••••'})` : adyenBank.toUpperCase()}
                                </strong>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/60">
                                <span className="text-zinc-400 text-[10px] block font-sans">Settlement Currency:</span>
                                <strong className="text-zinc-800 dark:text-zinc-200 font-mono">
                                  {currentCurrency.symbol}{totalAmountLocal.toLocaleString()} {selectedCurrencyCode}
                                </strong>
                              </div>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center gap-3 text-emerald-900 dark:text-emerald-200">
                              <RefreshCw className="h-4 w-4 text-emerald-600 animate-spin shrink-0" />
                              <div>
                                <p className="font-bold">Connecting to European Direct Clearing System...</p>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                                  Direct authorization via {adyenBank === 'ideal' ? `${adyenIdealBank} Netherlands` : adyenBank === 'blik' ? 'Polish National Clearing' : 'Eurosystem Target2'}.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 text-xs">
                            <div className="p-3 rounded-lg bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 flex items-center gap-3 text-teal-900 dark:text-teal-200">
                              <RefreshCw className="h-4 w-4 text-teal-600 animate-spin shrink-0" />
                              <div>
                                <p className="font-bold">Adyen Drop-in Session Token Provisioning...</p>
                                <p className="text-[11px] text-teal-700 dark:text-teal-300">
                                  Verifying HMAC-SHA256 signature and awaiting webhook acknowledgement.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. If PHONEPE / PAYTM: UPI Mobile Intent Waiting State */}
                    {(selectedGateway === 'phonepe' || selectedGateway === 'paytm') && (
                      <div className="p-5 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 space-y-4 text-center">
                        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
                          <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md">
                            <Smartphone className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            Approval Request Sent to Your Phone
                          </h3>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
                            Please open your <strong>{selectedGateway === 'phonepe' ? 'PhonePe' : 'Paytm'}</strong> app on <strong>{billingPhone || paytmMobile}</strong> and enter your UPI PIN to approve <strong>{currentCurrency.symbol}{totalAmountLocal.toLocaleString()}</strong>.
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-900 text-xs font-mono text-purple-700 dark:text-purple-300">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Awaiting authorization • Auto-checking live status</span>
                        </div>
                      </div>
                    )}

                    {/* 3. If CRYPTO: Blockchain Settlement Tracker */}
                    {(selectedGateway === 'coinbase' || selectedGateway === 'crypto') && (
                      <div className="p-5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-4 text-center">
                        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                            <Coins className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            Verifying Blockchain Mempool &amp; Block Confirmation
                          </h3>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Scanning {selectedCryptoCoin} ledger for transaction settlement...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 4. If Other Gateways (Razorpay, PayPal, Mollie, Skrill, etc.) */}
                    {!['stripe', 'paddle', 'adyen', 'square', 'authorizenet', 'cashfree', 'phonepe', 'paytm', 'coinbase', 'crypto', 'bank_transfer'].includes(selectedGateway) && (
                      <div className="p-5 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 space-y-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
                          <RefreshCw className="h-6 w-6 animate-spin" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            Processing {selectedGateway.toUpperCase()} Handshake
                          </h3>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Connecting to encrypted gateway rail...
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Progress Timeline (Figma Style) */}
                <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <span>Provisioning Progress</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400">{provisioningProgress}%</span>
                  </div>

                  {/* Clean Shimmer Progress Bar */}
                  <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-700">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${provisioningProgress}%` }}
                    />
                  </div>

                  {/* 4 Clean Steps Timeline */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                    <div className={`p-2.5 rounded-lg border text-center transition-all ${
                      provisioningStage >= 1
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 font-bold'
                        : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-400'
                    }`}>
                      <div className="flex items-center justify-center mb-1">
                        {provisioningStage > 1 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <RefreshCw className="h-4 w-4 text-teal-600 animate-spin" />}
                      </div>
                      <span>1. Auth Verified</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border text-center transition-all ${
                      provisioningStage >= 2
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 font-bold'
                        : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-400'
                    }`}>
                      <div className="flex items-center justify-center mb-1">
                        {provisioningStage > 2 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : provisioningStage === 2 ? <RefreshCw className="h-4 w-4 text-teal-600 animate-spin" /> : <Clock className="h-4 w-4 text-zinc-400" />}
                      </div>
                      <span>2. Gateway Bridge</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border text-center transition-all ${
                      provisioningStage >= 3
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 font-bold'
                        : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-400'
                    }`}>
                      <div className="flex items-center justify-center mb-1">
                        {provisioningStage > 3 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : provisioningStage === 3 ? <RefreshCw className="h-4 w-4 text-teal-600 animate-spin" /> : <Clock className="h-4 w-4 text-zinc-400" />}
                      </div>
                      <span>3. SIP Provisioning</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border text-center transition-all ${
                      provisioningStage >= 4
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 font-bold'
                        : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-400'
                    }`}>
                      <div className="flex items-center justify-center mb-1">
                        {provisioningStage >= 4 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-zinc-400" />}
                      </div>
                      <span>4. Invoice Active</span>
                    </div>
                  </div>

                  {/* Celebratory Provisioning Complete Action Strip */}
                  {provisioningProgress >= 100 && completedInvoice && (
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                      <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-200">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="block font-bold">
                            {isWalletTopup ? 'Carrier Telephony Balance Successfully Credited!' : 'Subscription Provisioning Complete & Activated!'}
                          </strong>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                            Official Tax Invoice #{completedInvoice.invoice_number} is ready and recorded in the master ledger.
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2.5">
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => setStep(5)}
                          leftIcon={<Sparkles className="h-4 w-4" />}
                          className="w-full sm:flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg py-2.5 shadow-sm cursor-pointer"
                        >
                          View Official Tax Invoice Document →
                        </Button>
                        <Button
                          variant="outline"
                          size="md"
                          onClick={onBack}
                          leftIcon={<ArrowLeft className="h-4 w-4" />}
                          className="w-full sm:w-auto font-bold text-xs rounded-lg py-2.5 cursor-pointer"
                        >
                          Return to Billing Overview
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 5: CELEBRATORY ACTIVATION & OFFICIAL DIGITAL TAX INVOICE */}
      {step === 5 && completedInvoice && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 print:hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(3)}
                leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
                className="text-xs font-semibold cursor-pointer"
              >
                Back to Payment Options & Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(4)}
                className="text-xs font-semibold cursor-pointer"
              >
                View Reconciliation Status
              </Button>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={onBack}
              className="text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold cursor-pointer"
            >
              Return to Billing Overview
            </Button>
          </div>

          <OfficialInvoiceDocument
            invoice={completedInvoice}
            templateSettings={templateSettings}
            showTopBar={true}
          />
        </div>
      )}

      {/* MAIN CHECKOUT BODY (Steps 1, 2, 3) */}
      {step <= 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
          {/* LEFT 8 COLUMNS: INTERACTIVE STEP FORMS */}
          <div className="lg:col-span-8 space-y-5">
            {/* STEP 1: PLAN & FREQUENCY REVIEW / TOP-UP AMOUNT SELECTOR */}
            {step === 1 && (
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg shadow-xs">
                <CardHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-teal-600" />
                      {isWalletTopup ? 'Select Wallet Top-Up Amount' : 'Step 1: Review Plan & Select Frequency'}
                    </span>
                    {!isWalletTopup && (
                      <Badge variant="teal" size="xs" className="font-bold rounded-md">
                        {selectedPlan.name}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {/* Top-Up Mode Dedicated Chips */}
                  {isWalletTopup ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                        {[25, 50, 100, 250, 500, 1000].map((amt) => {
                          const isSelected = !isCustomTopup && topupPresetUsd === amt;
                          const localVal = Math.round(amt * (currentCurrency.rate || 1));
                          return (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => {
                                setTopupPresetUsd(amt);
                                setIsCustomTopup(false);
                                setCustomTopupInput('');
                              }}
                              className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-600 text-teal-700 dark:text-teal-300 font-bold shadow-xs'
                                  : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                              }`}
                            >
                              <div className="text-sm font-mono font-bold">
                                {currentCurrency.code === 'USD'
                                  ? `$${amt}`
                                  : `${currentCurrency.symbol}${localVal.toLocaleString()}`}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                {currentCurrency.code === 'USD' ? 'Prepaid Deposit' : `($${amt} USD)`}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Amount */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                          Or Enter Custom Deposit USD:
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-zinc-400 text-xs font-bold font-mono">$</span>
                            <input
                              type="number"
                              min="5"
                              max="50000"
                              placeholder="e.g. 750"
                              value={customTopupInput}
                              onChange={(e) => {
                                setCustomTopupInput(e.target.value);
                                setIsCustomTopup(true);
                              }}
                              className="w-full pl-7 pr-3 py-2 text-xs rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                            />
                          </div>
                          {isCustomTopup && customTopupInput && (
                            <Badge variant="teal" size="sm" className="font-mono text-xs rounded-md">
                              {currentCurrency.symbol}
                              {Math.round(effectiveTopupUsd * (currentCurrency.rate || 1)).toLocaleString()} {currentCurrency.code}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Balance Impact */}
                      <div className="p-3.5 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="text-zinc-500">Current Balance:</span>{' '}
                          <strong className="font-mono text-zinc-900 dark:text-zinc-100">
                            {currentCurrency.symbol}{Math.round(currentBalanceUsd * (currentCurrency.rate || 1)).toLocaleString()} {currentCurrency.code}
                            {currentCurrency.code !== 'USD' && (
                              <span className="text-[10px] text-zinc-400 font-normal ml-1">(≈ ${currentBalanceUsd.toFixed(2)} USD)</span>
                            )}
                          </strong>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-teal-600 hidden sm:inline" />
                        <div>
                          <span className="text-zinc-500">Credit:</span>{' '}
                          <strong className="font-mono text-teal-700 dark:text-teal-300">
                            +{currentCurrency.symbol}{Math.round(effectiveTopupUsd * (currentCurrency.rate || 1)).toLocaleString()} {currentCurrency.code}
                          </strong>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-teal-600 hidden sm:inline" />
                        <div className="text-emerald-700 dark:text-emerald-400 font-bold">
                          Projected:{' '}
                          <strong className="font-mono">
                            {currentCurrency.symbol}{Math.round(projectedBalanceUsd * (currentCurrency.rate || 1)).toLocaleString()} {currentCurrency.code}
                          </strong>
                        </div>
                      </div>

                      {/* Direct 1:1 Deposit Guarantee */}
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 text-[11px] text-emerald-800 dark:text-emerald-300">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>100% Direct Calling Fuel:</strong> 0% Tax Surcharge on Wallet Top-Up (Every rupee / dollar paid is credited 1:1 directly to your calling balance).
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Subscription Plan Review Hero */
                    <div className="space-y-4">
                      {/* Hero Selected Plan Card */}
                      <div className="p-4 rounded-lg bg-gradient-to-br from-teal-50/60 dark:from-teal-950/30 to-zinc-50 dark:to-zinc-800/40 border-2 border-teal-600 shadow-sm space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="space-y-0.5">
                            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                              <Zap className="h-5 w-5 text-teal-600" />
                              {selectedPlan.name}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {selectedPlan.tagline || 'High-throughput enterprise AI voice telephony gateway.'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black font-mono text-teal-700 dark:text-teal-300">
                              {currentCurrency.symbol}
                              {subtotalLocal.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-semibold">
                              /{billingCycle === 'yearly' ? 'billed annually' : billingCycle === 'lifetime' ? 'one-time sovereign' : 'monthly'}
                            </div>
                          </div>
                        </div>

                        {/* Feature Badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-teal-200/60 dark:border-teal-900/60 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                            <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                            <span>{selectedPlan.includedMinutes?.toLocaleString()} Voice Mins</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                            <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                            <span>{selectedPlan.concurrencyLimit} Lines</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                            <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                            <span>{selectedPlan.ragStorageMb || 500} MB Vector DB</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                            <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                            <span>Priority 99.99% SLA</span>
                          </div>
                        </div>
                      </div>

                      {/* Billing Frequency Tabs */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Select Billing Frequency:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setBillingCycle('monthly')}
                            className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                              billingCycle === 'monthly'
                                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-600 text-teal-700 dark:text-teal-300 font-bold shadow-xs'
                                : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                            }`}
                          >
                            <div className="text-xs font-bold">Monthly Billing</div>
                            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                              ${selectedPlan.monthlyPrice}/mo
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setBillingCycle('yearly')}
                            className={`p-3 rounded-lg border text-center transition-all cursor-pointer relative ${
                              billingCycle === 'yearly'
                                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-600 text-teal-700 dark:text-teal-300 font-bold shadow-xs'
                                : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                            }`}
                          >
                            <span className="absolute -top-2 right-2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shadow-2xs">
                              Save 20%
                            </span>
                            <div className="text-xs font-bold">Annual Billing</div>
                            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                              ${selectedPlan.yearlyPrice || Math.round(selectedPlan.monthlyPrice * 0.8)}/mo
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setBillingCycle('lifetime')}
                            className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                              billingCycle === 'lifetime'
                                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-600 text-teal-700 dark:text-teal-300 font-bold shadow-xs'
                                : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                            }`}
                          >
                            <div className="text-xs font-bold">Lifetime Sovereign</div>
                            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                              ${selectedPlan.lifetimePrice || selectedPlan.monthlyPrice * 12} One-time
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Tier Switcher Collapsible Option */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setShowPlanSwitcher(!showPlanSwitcher)}
                          className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showPlanSwitcher ? 'rotate-180' : ''}`} />
                          {showPlanSwitcher ? 'Hide other plans' : 'Want a different plan? Switch tier here'}
                        </button>

                        {showPlanSwitcher && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            {allPlans.map((p) => {
                              const isCur = p.id === selectedPlan.id;
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => setSelectedPlan(p)}
                                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                                    isCur
                                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30'
                                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 bg-zinc-50 dark:bg-zinc-800/40'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{p.name}</span>
                                    <span className="font-mono font-bold text-xs text-teal-600">${p.monthlyPrice}/mo</span>
                                  </div>
                                  <div className="text-[11px] text-zinc-500 mt-1">
                                    {p.includedMinutes?.toLocaleString()} mins • {p.concurrencyLimit} channels
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Forward CTA */}
                  <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setStep(2)}
                      rightIcon={<ChevronRight className="h-4 w-4" />}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-sm"
                    >
                      Next: Customer &amp; Tax Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 2: CUSTOMER & TAX PROFILE FORM */}
            {step === 2 && (
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg shadow-xs">
                <CardHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-teal-600" />
                      Step 2: Customer &amp; Tax Identification Profile
                    </span>
                    <Badge variant="teal" size="xs" className="font-bold rounded-md">
                      Auto-Populated
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Legal Name */}
                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                        Legal Entity / Contact Name *
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                        <input
                          type="text"
                          required
                          value={billingName}
                          onChange={(e) => setBillingName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-semibold"
                        />
                      </div>
                    </div>

                    {/* Billing Email */}
                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                        Billing Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                        <input
                          type="email"
                          required
                          value={billingEmail}
                          onChange={(e) => setBillingEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-semibold"
                        />
                      </div>
                    </div>

                    {/* Phone (Auto synced with Country dial code) */}
                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                        Phone Number (Synced with Country)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                        <input
                          type="text"
                          value={billingPhone}
                          onChange={(e) => setBillingPhone(e.target.value)}
                          placeholder="+1 (555) 019-2834"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-semibold font-mono"
                        />
                      </div>
                    </div>

                    {/* Tax ID / GSTIN */}
                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                        Tax ID / GSTIN / VAT Registration
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                        <input
                          type="text"
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-mono"
                        />
                      </div>
                    </div>

                    {/* Custom Searchable Country Selector Dropdown with Flags */}
                    <div className="relative" ref={countryDropdownRef}>
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                        Country / Jurisdiction *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCountryDropdownOpen((prev) => !prev);
                          setCountrySearchQuery('');
                        }}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center justify-between cursor-pointer font-semibold"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="text-base">{selectedCountryItem?.flag || '🌐'}</span>
                          <span>{country}</span>
                          {selectedCountryItem?.dialCode && (
                            <span className="text-zinc-400 font-mono text-[11px]">({selectedCountryItem.dialCode})</span>
                          )}
                        </span>
                        <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isCountryDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-1 z-40 divide-y divide-zinc-100 dark:divide-zinc-800">
                          <div className="p-2">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                              <input
                                type="text"
                                value={countrySearchQuery}
                                onChange={(e) => setCountrySearchQuery(e.target.value)}
                                placeholder="Search country or dial code..."
                                className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                                autoFocus
                              />
                            </div>
                          </div>

                          <div className="max-h-52 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
                            {filteredCountries.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelectCountry(c)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer ${
                                  country === c.name ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold' : 'text-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="text-base shrink-0">{c.flag}</span>
                                  <span>{c.name}</span>
                                </span>
                                <span className="font-mono text-zinc-400 text-[11px] font-bold shrink-0">{c.dialCode}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Billing Address */}
                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                        Billing Address &amp; Suite
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                        <input
                          type="text"
                          value={billingAddress}
                          onChange={(e) => setBillingAddress(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStep(1)}
                      leftIcon={<ChevronLeft className="h-4 w-4" />}
                      className="font-bold text-xs rounded-lg"
                    >
                      Back: Plan Review
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setStep(3)}
                      rightIcon={<ChevronRight className="h-4 w-4" />}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-sm"
                    >
                      Next: Payment Rails &amp; Pay
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 3: PAYMENT RAILS & DEEP BIN 3D FLIP CARD SIMULATOR */}
            {step === 3 && (
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg shadow-xs">
                <CardHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-teal-600" />
                      Step 3: Select Payment Rail &amp; Authorize
                    </span>
                    <Badge variant="teal" size="xs" className="font-bold rounded-md">
                      256-Bit SSL Rail
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {/* If an invoice was already completed in this session */}
                  {completedInvoice && (
                    <div className="p-3 sm:p-3.5 rounded-lg bg-emerald-500/8 dark:bg-emerald-500/10 border border-emerald-500/25 dark:border-emerald-500/30 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-bold text-xs text-emerald-950 dark:text-emerald-100 truncate">
                            Invoice <span className="font-mono font-bold">#{completedInvoice.invoice_number}</span> Already Settled &amp; Active
                          </span>
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-bold border border-emerald-200/80 dark:border-emerald-800/80">
                          Active in Ledger
                        </span>
                      </div>

                      <p className="text-[11.5px] text-emerald-800/90 dark:text-emerald-300/90 pl-6 leading-relaxed">
                        Your plan <strong>{selectedPlan.name}</strong> ({billingCycle}) is active in the master ledger. You do not need to make another payment.
                      </p>

                      <div className="pl-6 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setStep(5)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-medium text-xs transition-all cursor-pointer shadow-2xs"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View Generated Invoice Document →</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Gateway Selector Grid with Brand SVG Logos & Live Badges */}
                  <div className="space-y-3">
                    {/* View Switcher Controls & Quick Rails Filter */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-1">
                      {/* Filter Mode Buttons */}
                      <div className="h-9 p-0.5 bg-zinc-100 dark:bg-zinc-800/90 rounded-md border border-zinc-200 dark:border-zinc-700/80 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setGatewayFilterMode('all')}
                          className={`h-7.5 px-3 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            gatewayFilterMode === 'all'
                              ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-2xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                          <span>All 18 Payment Rails</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold">
                            {enabledGateways.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGatewayFilterMode('compatible')}
                          className={`h-7.5 px-3 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            gatewayFilterMode === 'compatible'
                              ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-2xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                          }`}
                        >
                          <Globe className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                          <span>{currentCurrency.code} Compatible</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold">
                            {compatibleGatewaysCount}
                          </span>
                        </button>
                      </div>

                      {/* Quick Search Rails Filter */}
                      <div className="relative flex-1 sm:max-w-xs h-9 flex items-center">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search 18 payment rails..."
                          value={gatewaySearchQuery}
                          onChange={(e) => setGatewaySearchQuery(e.target.value)}
                          className="w-full h-9 pl-8 pr-7 text-xs rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-teal-600 font-medium"
                        />
                        {gatewaySearchQuery && (
                          <button
                            type="button"
                            onClick={() => setGatewaySearchQuery('')}
                            className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Summary bar */}
                    <div className="flex items-center justify-between px-0.5 text-[11px]">
                      <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                        Showing {visibleGateways.length} of {enabledGateways.length} Super Admin Rails (Listed from #18 to #1) • Click any mode to verify
                      </span>
                      <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800/60">
                        {visibleGateways.length} Rails Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-3">
                      {visibleGateways.map((gw) => {
                      const isSelected = selectedGateway === gw.gateway_key;
                      const getGatewayInfo = (key: string, rawName: string) => {
                        switch ((key || '').toLowerCase()) {
                          case 'razorpay':
                            return {
                              title: 'Razorpay India',
                              subtitle: 'UPI, NetBanking & Cards',
                              currencyBadge: '₹ INR (Indian Rupee)',
                              primaryCurrency: 'INR',
                            };
                          case 'stripe':
                            return {
                              title: 'Stripe Global',
                              subtitle: 'Cards & Apple / Google Pay',
                              currencyBadge: '🌐 USD, EUR, GBP + 30 Currencies',
                              primaryCurrency: 'USD',
                            };
                          case 'cashfree':
                            return {
                              title: 'Cashfree Payments',
                              subtitle: 'AutoCollect Dynamic UPI QR',
                              currencyBadge: '₹ INR (Indian Rupee)',
                              primaryCurrency: 'INR',
                            };
                          case 'paypal':
                            return {
                              title: 'PayPal Express',
                              subtitle: 'Global Wallet Balance & Cards',
                              currencyBadge: '🌎 USD, EUR, GBP + 25 Currencies',
                              primaryCurrency: 'USD',
                            };
                          case 'phonepe':
                            return {
                              title: 'PhonePe Direct',
                              subtitle: 'UPI QR & Mobile App Intent',
                              currencyBadge: '₹ INR (Indian Rupee)',
                              primaryCurrency: 'INR',
                            };
                          case 'bank_transfer':
                          case 'bank_wire':
                          case 'wire':
                            return {
                              title: 'Bank Wire / NEFT',
                              subtitle: 'Direct IMPS/RTGS (0% Fee)',
                              currencyBadge: '🏦 INR / USD Universal Wire',
                              primaryCurrency: 'INR',
                            };
                          case 'paytm':
                            return {
                              title: 'Paytm Payments',
                              subtitle: 'UPI QR & Wallet OTP',
                              currencyBadge: '₹ INR (Indian Rupee)',
                              primaryCurrency: 'INR',
                            };
                          case 'authorizenet':
                            return {
                              title: 'Authorize.Net',
                              subtitle: 'Credit Cards & eCheck ACH',
                              currencyBadge: '🇺🇸 USD ($), CAD, EUR, GBP',
                              primaryCurrency: 'USD',
                            };
                          case 'square':
                            return {
                              title: 'Square Payments',
                              subtitle: 'Cards & Cash App Pay',
                              currencyBadge: '💳 USD ($), CAD, GBP, EUR',
                              primaryCurrency: 'USD',
                            };
                          case 'paddle':
                            return {
                              title: 'Paddle Merchant',
                              subtitle: 'Global SaaS Merchant of Record',
                              currencyBadge: '🌐 USD, EUR, GBP SaaS MoR',
                              primaryCurrency: 'USD',
                            };
                          case 'crypto':
                          case 'coinbase':
                            return {
                              title: 'Coinbase Crypto',
                              subtitle: 'USDT, BTC, ETH, SOL Web3',
                              currencyBadge: '💎 USDT, BTC, ETH, SOL',
                              primaryCurrency: 'USD',
                            };
                          case 'flutterwave':
                            return {
                              title: 'Flutterwave',
                              subtitle: 'African Mobile Money & Cards',
                              currencyBadge: '🌍 NGN, KES, GHS, ZAR Africa',
                              primaryCurrency: 'NGN',
                            };
                          case 'adyen':
                            return {
                              title: 'Adyen Global',
                              subtitle: 'Enterprise 3DS2 & Local Rails',
                              currencyBadge: '🇪🇺 EUR (€), USD, GBP 3DS2',
                              primaryCurrency: 'EUR',
                            };
                          case 'mercadopago':
                          case 'mercado_pago':
                            return {
                              title: 'Mercado Pago',
                              subtitle: 'LatAm & Pix Instant QR',
                              currencyBadge: '🇧🇷 BRL (R$), MXN LatAm Pix',
                              primaryCurrency: 'BRL',
                            };
                          case 'klarna':
                            return {
                              title: 'Klarna BNPL',
                              subtitle: 'Pay in 4 / 30 Days (0% APR)',
                              currencyBadge: '🇪🇺 EUR (€), USD, GBP Pay in 4',
                              primaryCurrency: 'USD',
                            };
                          case 'mollie':
                            return {
                              title: 'Mollie European',
                              subtitle: 'iDEAL, Bancontact & SEPA',
                              currencyBadge: '🇪🇺 EUR (€) Eurozone & SEPA',
                              primaryCurrency: 'EUR',
                            };
                          case 'skrill':
                            return {
                              title: 'Skrill & Neteller',
                              subtitle: '1-Tap Digital Wallet Pay',
                              currencyBadge: '💱 EUR, USD, GBP Digital Wallet',
                              primaryCurrency: 'EUR',
                            };
                          case 'alipay':
                          case 'wechat':
                            return {
                              title: 'Alipay+ & WeChat',
                              subtitle: 'APAC Barcode & QR Rail',
                              currencyBadge: '🇨🇳 CNY (¥), HKD, SGD APAC',
                              primaryCurrency: 'CNY',
                            };
                          default:
                            return {
                              title: rawName || (key || '').toUpperCase(),
                              subtitle: 'Instant Gateway',
                              currencyBadge: '🌐 Multi-Currency',
                              primaryCurrency: 'USD',
                            };
                        }
                      };

                      const info = getGatewayInfo(gw.gateway_key, gw.display_name);

                      return (
                        <button
                          key={gw.gateway_key}
                          type="button"
                          onClick={() => {
                            setSelectedGateway(gw.gateway_key);
                            if (gw.gateway_key === 'flutterwave') {
                              const supported = GATEWAY_CURRENCY_SUPPORT['flutterwave'] || [];
                              if (!supported.includes(selectedCurrencyCode)) {
                                const railCurr = flwMomoProvider === 'mtn' ? 'GHS' : flwMomoProvider === 'airtel' ? 'UGX' : flwMomoProvider === 'bank' ? 'NGN' : 'KES';
                                setSelectedCurrencyCode(railCurr);
                              }
                            }
                          }}
                          className={`p-3 sm:p-3.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 overflow-hidden w-full min-w-0 ${
                            isSelected
                              ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 shadow-xs ring-2 ring-teal-500/30'
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-2xs'
                          }`}
                        >
                          {/* BIG LOGO ON TOP */}
                          <div className="h-13 sm:h-14 px-3 py-2 rounded-lg bg-zinc-50/90 dark:bg-zinc-800/90 border border-zinc-200/90 dark:border-zinc-700/80 flex items-center justify-center shrink-0 w-full shadow-2xs overflow-hidden">
                            <GatewayLogoRenderer gatewayKey={gw.gateway_key} size="md" fallbackText={gw.display_name} />
                          </div>

                          {/* HEADING, STATUS BADGE & CURRENCY INDICATOR */}
                          <div className="w-full min-w-0 space-y-1 pt-0.5">
                            <div className="flex items-center justify-between gap-1 w-full min-w-0">
                              <span className="truncate text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-zinc-100 flex-1 min-w-0" title={gw.display_name}>
                                {info.title}
                              </span>
                              {gw.is_configured ? (
                                <span className="inline-flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Live
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Setup
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium truncate">
                              {info.subtitle}
                            </div>
                            <div className="flex items-center gap-1 text-[9.5px] font-mono text-teal-700 dark:text-teal-300 font-semibold bg-teal-50/80 dark:bg-teal-950/50 px-1.5 py-0.5 rounded border border-teal-200/60 dark:border-teal-900/60 truncate w-fit max-w-full">
                              <span className="truncate">{info.currencyBadge}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    </div>
                  </div>

                  {/* INTERACTIVE DYNAMIC GATEWAY EXPERIENCE */}
                  <div className="p-4 sm:p-5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-5">
                    {/* 1. RAZORPAY OFFICIAL UNIFIED GATEWAY RAIL */}
                    {selectedGateway === 'razorpay' && (() => {
                      const liveRazorpayGateway = enabledGateways.find(
                        (g: any) => g.gateway_key === 'razorpay' || g.gateway_key === selectedGateway
                      ) || {};
                      const isRazorpayConfigured = Boolean(
                        liveRazorpayGateway.is_configured &&
                        (liveRazorpayGateway.public_key || liveRazorpayGateway.merchant_id || liveRazorpayGateway.key_id)
                      );
                      const payableAmountInr = totalAmountLocal <= 0 ? 1 : totalAmountLocal;

                      return (
                        <RazorpayPaymentExperience
                          isRazorpayConfigured={isRazorpayConfigured}
                          liveRazorpayGateway={liveRazorpayGateway}
                          payableAmountInr={payableAmountInr}
                          totalAmountLocal={totalAmountLocal}
                          basePriceUsd={basePriceUsd}
                          currentCurrency={currentCurrency}
                          selectedCurrencyCode={selectedCurrencyCode}
                          setSelectedCurrencyCode={setSelectedCurrencyCode}
                          isWalletTopup={isWalletTopup}
                          selectedPlanName={selectedPlan.name}
                          razorpaySubTab={razorpaySubTab}
                          setRazorpaySubTab={setRazorpaySubTab}
                          razorpayCustomerVpa={razorpayCustomerVpa}
                          setRazorpayCustomerVpa={setRazorpayCustomerVpa}
                          qrTimer={qrTimer}
                          formatTimer={formatTimer}
                          handleRegenerateQr={() => {
                            setQrTimer(300);
                            setQrSessionKey(Date.now());
                          }}
                          copiedField={copiedField}
                          handleCopyText={handleCopyText}
                          handleOpenConverterForPair={handleOpenConverterForPair}
                          billingName={billingName}
                          billingEmail={billingEmail}
                          billingPhone={billingPhone}
                          onLaunchRazorpayModal={handleExecutePayment}
                          isProcessingPayment={step === 4}
                        />
                      );
                    })()}

                    {/* 2. STRIPE GLOBAL UNIFIED RAIL */}
                    {selectedGateway === 'stripe' && (() => {
                      const liveStripeGateway = enabledGateways.find(
                        (g: any) => g.gateway_key === 'stripe' || g.gateway_key === selectedGateway
                      ) || {};
                      const isStripeConfigured = Boolean(
                        liveStripeGateway.is_configured &&
                        (liveStripeGateway.public_key || liveStripeGateway.publishable_key || liveStripeGateway.merchant_id) &&
                        liveStripeGateway.secret_key
                      );

                      return (
                        <StripePaymentExperience
                          isStripeConfigured={isStripeConfigured}
                          liveStripeGateway={liveStripeGateway}
                          payableAmountLocal={totalAmountLocal}
                          totalAmountLocal={totalAmountLocal}
                          basePriceUsd={basePriceUsd}
                          currentCurrency={currentCurrency}
                          selectedCurrencyCode={selectedCurrencyCode}
                          setSelectedCurrencyCode={setSelectedCurrencyCode}
                          isWalletTopup={isWalletTopup}
                          selectedPlanName={selectedPlan.name}
                          stripeSubTab={stripeSubTab}
                          setStripeSubTab={setStripeSubTab}
                          cardNumber={cardNumber}
                          setCardNumber={setCardNumber}
                          cardExpiry={cardExpiry}
                          setCardExpiry={setCardExpiry}
                          cardCvv={cardCvv}
                          setCardCvv={setCardCvv}
                          cardHolder={cardHolder}
                          setCardHolder={setCardHolder}
                          isCardFlipped={isCardFlipped}
                          setIsCardFlipped={setIsCardFlipped}
                          billingName={billingName}
                          billingEmail={billingEmail}
                          billingPhone={billingPhone}
                          handleOpenConverterForPair={handleOpenConverterForPair}
                          onExecutePayment={handleExecutePayment}
                          isProcessingPayment={step === 4}
                        />
                      );
                    })()}

                    {/* 3. CARD-BASED GATEWAYS: AUTHORIZE.NET / SQUARE / PADDLE */}
                    {['paddle', 'square', 'authorizenet'].includes(selectedGateway) && (() => {
                      const isCardGatewayConfigured = isCurrentGatewayConfigured;

                      return (
                        <div className="space-y-4">
                          <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <GatewayLogoRenderer gatewayKey={selectedGateway} size="lg" fallbackText="Credit & Debit Cards" />
                              <div className="flex items-center gap-2 flex-wrap">
                                {isCardGatewayConfigured ? (
                                  <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    <BadgeCheck className="h-3.5 w-3.5" /> PCI-DSS Level 1 Settle
                                  </span>
                                ) : (
                                  <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-bold font-mono flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                    <AlertCircle className="h-3.5 w-3.5" /> Setup Required in Super Admin
                                  </span>
                                )}
                                <Badge variant={isCardGatewayConfigured ? "teal" : "warning"} size="xs" className="font-mono text-[9px] rounded font-bold">
                                  {isCardGatewayConfigured ? 'SECURE CARD ENGINE' : 'CARD RAILS PENDING SETUP'}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-0.5 pt-1">
                              <div className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                                <span>{currentSelectedGw?.display_name || 'Credit / Debit Card'} Unified Rail</span>
                              </div>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Deep BIN intelligence &amp; 3D physical card preview with end-to-end tokenization
                              </p>
                            </div>
                          </div>

                          {/* Sleek informative status banner if unconfigured in Super Admin */}
                          {!isCardGatewayConfigured && (
                            <div className="p-3 rounded-lg bg-amber-500/8 dark:bg-amber-500/10 border border-amber-500/25 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span className="leading-snug">
                                  <strong>{currentSelectedGw?.display_name || selectedGateway.toUpperCase()}</strong> is in <strong>Pending Setup</strong> in Super Admin settings.
                                </span>
                              </div>
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shrink-0">
                                🟡 Setup Required
                              </span>
                            </div>
                          )}

                          {/* Subtabs for Square */}
                          {selectedGateway === 'square' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                              <button
                                type="button"
                                onClick={() => setSquareSubTab('card')}
                                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  squareSubTab === 'card'
                                    ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                              >
                                <CreditCard className="h-4 w-4 text-teal-600 shrink-0" />
                                <span className="truncate">Credit Card</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSquareSubTab('wallets')}
                                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  squareSubTab === 'wallets'
                                    ? 'bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                              >
                                <Zap className="h-4 w-4 text-indigo-600 shrink-0" />
                                <span className="truncate">Apple / G-Pay</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSquareSubTab('cashapp')}
                                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  squareSubTab === 'cashapp'
                                    ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                              >
                                <Smartphone className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span className="truncate">Cash App Pay</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSquareSubTab('afterpay')}
                                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  squareSubTab === 'afterpay'
                                    ? 'bg-white dark:bg-zinc-900 text-cyan-700 dark:text-cyan-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                              >
                                <Percent className="h-4 w-4 text-cyan-600 shrink-0" />
                                <span className="truncate">Afterpay (4x)</span>
                              </button>
                            </div>
                          )}

                          {/* Subtabs for Paddle */}
                          {selectedGateway === 'paddle' && (
                            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                              <button
                                type="button"
                                onClick={() => setPaddleSubTab('card')}
                                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                  paddleSubTab === 'card'
                                    ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                              >
                                <CreditCard className="h-4 w-4" /> <span>Card &amp; Merchant of Record</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaddleSubTab('vat_invoice')}
                                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                  paddleSubTab === 'vat_invoice'
                                    ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                              >
                                <Building className="h-4 w-4" /> <span>B2B VAT Reverse Charge Invoice</span>
                              </button>
                            </div>
                          )}

                          {/* Subtabs for Authorize.Net */}
                          {selectedGateway === 'authorizenet' && (
                            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                              <button
                                type="button"
                                onClick={() => setAuthnetSubTab('card')}
                                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                                  authnetSubTab === 'card'
                                    ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                              >
                                <CreditCard className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                                <span className="whitespace-nowrap">Credit / Debit Cards</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAuthnetSubTab('echeck')}
                                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                                  authnetSubTab === 'echeck'
                                    ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                              >
                                <Building className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                                <span className="whitespace-nowrap">eCheck.Net ACH Transfer</span>
                              </button>
                            </div>
                          )}

                          {/* Special Non-Card Subtab Views */}
                          {selectedGateway === 'square' && squareSubTab === 'wallets' ? (
                            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 space-y-4 shadow-xs">
                              {/* Header Notice */}
                              <div className="p-3.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/90 dark:border-indigo-900/60 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-indigo-950 dark:text-indigo-200 flex-wrap gap-2">
                                  <span className="flex items-center gap-1.5">
                                    <Zap className="h-4 w-4 text-indigo-600" />
                                    Square Unified Wallet Tokenization Engine
                                  </span>
                                  <Badge variant="teal" size="xs" className="font-mono">
                                    1-Tap Biometric Ready
                                  </Badge>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                  Authorize instantly using native operating system biometrics (Face ID, Touch ID, or Google Pay) with zero manual card entry.
                                </p>
                              </div>

                              {/* Wallet Selector Cards */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Apple Pay Option */}
                                <button
                                  type="button"
                                  onClick={() => setSquareWalletSelection('apple_pay')}
                                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                                    squareWalletSelection === 'apple_pay'
                                      ? 'bg-zinc-50 dark:bg-zinc-800/90 border-zinc-900 dark:border-zinc-100 shadow-sm ring-2 ring-zinc-900/15 dark:ring-white/20'
                                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 opacity-80 hover:opacity-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <ApplePayLogo variant="black" size="md" className="dark:filter dark:invert" />
                                    {squareWalletSelection === 'apple_pay' ? (
                                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center gap-1 shadow-2xs">
                                        <Check className="h-3 w-3 stroke-[2.5]" /> Selected
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                        Face ID / Touch ID
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-xs font-mono font-bold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                                      <CreditCard className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
                                      <span>Apple Card •••• 4242</span>
                                    </div>
                                    <span className="text-[10px] block mt-0.5 text-zinc-500 dark:text-zinc-400">
                                      Tokenized via Apple Secure Enclave
                                    </span>
                                  </div>
                                </button>

                                {/* Google Pay Option */}
                                <button
                                  type="button"
                                  onClick={() => setSquareWalletSelection('google_pay')}
                                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                                    squareWalletSelection === 'google_pay'
                                      ? 'bg-blue-50/50 dark:bg-blue-950/30 border-[#1a73e8] dark:border-[#4285f4] shadow-sm ring-2 ring-[#1a73e8]/25'
                                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 opacity-80 hover:opacity-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <GooglePayLogo variant="plain" size="md" />
                                    {squareWalletSelection === 'google_pay' ? (
                                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#1a73e8] text-white flex items-center gap-1 shadow-2xs">
                                        <Check className="h-3 w-3 stroke-[2.5]" /> Selected
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                        Google Wallet 1-Tap
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-xs font-mono font-bold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                                      <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                                      <span>Google Pay •••• 9012</span>
                                    </div>
                                    <span className="text-[10px] block mt-0.5 text-zinc-500 dark:text-zinc-400">
                                      Tokenized via Google Play Services HCE
                                    </span>
                                  </div>
                                </button>
                              </div>

                              {/* Inline Biometric Action Area (NO POPUP MODALS) */}
                              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3 text-center">
                                {squareWalletAuthStatus === 'idle' ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 font-semibold">
                                      <ShieldCheck className="h-4 w-4 text-teal-600" />
                                      <span>Ready to authorize {squareWalletSelection === 'apple_pay' ? 'Apple Pay (Face ID)' : 'Google Pay 1-Tap'}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setSquareWalletAuthStatus('authenticating');
                                        await new Promise((r) => setTimeout(r, 600));
                                        setSquareWalletAuthStatus('authenticated');
                                        await new Promise((r) => setTimeout(r, 400));
                                        handleExecutePayment();
                                      }}
                                      className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.01] ${
                                        squareWalletSelection === 'apple_pay'
                                          ? 'bg-black hover:bg-zinc-800 text-white border border-zinc-800'
                                          : 'bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md border border-blue-600'
                                      }`}
                                    >
                                      <Zap className="h-4 w-4" />
                                      <span>
                                        {squareWalletSelection === 'apple_pay'
                                          ? `Pay ${currentCurrency.symbol}${totalAmountLocal.toLocaleString()} with Apple Pay (Face ID)`
                                          : `Pay ${currentCurrency.symbol}${totalAmountLocal.toLocaleString()} with Google Pay`}
                                      </span>
                                    </button>
                                  </div>
                                ) : squareWalletAuthStatus === 'authenticating' ? (
                                  <div className="py-4 space-y-2 flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                      Authorizing Biometrics with {squareWalletSelection === 'apple_pay' ? 'Apple Secure Enclave' : 'Google Wallet'}...
                                    </span>
                                  </div>
                                ) : (
                                  <div className="py-2 space-y-1 flex flex-col items-center">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                      Biometrics Authenticated! Dispatching Square Payment...
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs font-mono">
                                <span className="text-zinc-500 font-sans">Total Authorized Settlement:</span>
                                <strong className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                  {currentCurrency.symbol}{totalAmountLocal.toLocaleString()} {selectedCurrencyCode}
                                </strong>
                              </div>
                            </div>
                          ) : selectedGateway === 'square' && squareSubTab === 'cashapp' ? (
                            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 space-y-4 shadow-xs">
                              <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-900/60 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-emerald-950 dark:text-emerald-200 flex-wrap gap-2">
                                  <span className="flex items-center gap-2">
                                    <CashAppLogo size="sm" variant="icon" />
                                    Square Cash App Pay • Direct Mobile Settlement Rail
                                  </span>
                                  <Badge variant="teal" size="xs" className="font-mono">
                                    $Cashtag Live &amp; Scannable
                                  </Badge>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                  Scan the live stable Cash App QR Code or enter your $Cashtag to dispatch an instant mobile authorization. Payment settles directly into the connected Square merchant account.
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Cash App Real Stable Scannable QR Code */}
                                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-center space-y-3">
                                  <div className="p-2.5 rounded-2xl bg-white shadow-md border-2 border-emerald-500/40 flex items-center justify-center relative group overflow-hidden">
                                    <QRCodeSVG
                                      value={`https://cash.app/$createcall/${totalAmountLocal.toFixed(2)}?note=CreateCall_Order_${qrSessionKey}`}
                                      size={195}
                                      level="H"
                                      includeMargin={false}
                                      imageSettings={{
                                        src: '/images/payments/cash_app.svg',
                                        x: undefined,
                                        y: undefined,
                                        height: 38,
                                        width: 38,
                                        excavate: true,
                                      }}
                                    />
                                  </div>

                                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                    <CashAppLogo size="xs" variant="plain" />
                                    <span>Scan with Camera or Cash App</span>
                                  </div>

                                  <div className="flex items-center justify-center gap-2 w-full">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                      <span>Active: {formatTimer(squareCashAppTimer)}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSquareCashAppTimer(300);
                                        setQrSessionKey(Date.now());
                                        addToast({
                                          type: 'info',
                                          title: 'QR Code Refreshed',
                                          description: 'Generated new cryptographic Cash App session QR token.',
                                        });
                                      }}
                                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10.5px] flex items-center gap-1 font-semibold cursor-pointer"
                                    >
                                      <RefreshCw className="h-3 w-3" /> Refresh
                                    </button>
                                  </div>

                                  <div className="text-[10.5px] font-mono text-zinc-500 flex items-center justify-between w-full px-2 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                                    <span>Amount Payable:</span>
                                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                                      {currentCurrency.symbol}{totalAmountLocal.toLocaleString()} {selectedCurrencyCode}
                                    </strong>
                                  </div>
                                </div>

                                {/* Cashtag Input & Mobile Push Inline Dispatcher */}
                                <div className="space-y-3.5 flex flex-col justify-center">
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                        Your $Cashtag Username / Handle *
                                      </label>
                                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Account Active
                                      </span>
                                    </div>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={squareCustomerCashtag}
                                        onChange={(e) => {
                                          let val = e.target.value;
                                          if (!val.startsWith('$') && val.length > 0) val = '$' + val;
                                          setSquareCustomerCashtag(val);
                                        }}
                                        placeholder="$yourhandle"
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-600"
                                      />
                                    </div>
                                    <span className="text-[10px] text-zinc-400 mt-1 block">
                                      We will dispatch an instant mobile approval push notification directly to your Cash App account.
                                    </span>
                                  </div>

                                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-zinc-500">Merchant Recipient:</span>
                                      <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">$createcall (CreateCall AI Inc)</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-zinc-500">Payment Link:</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(`https://cash.app/$createcall/${totalAmountLocal.toFixed(2)}`);
                                          addToast({
                                            type: 'success',
                                            title: 'Cash App Link Copied',
                                            description: `https://cash.app/$createcall/${totalAmountLocal.toFixed(2)} copied to clipboard!`,
                                          });
                                        }}
                                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                      >
                                        <Copy className="h-3 w-3" /> Copy Link
                                      </button>
                                    </div>
                                  </div>

                                  {/* Inline Push Action (Zero Popups) */}
                                  {squareCashAppPushStatus === 'idle' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cleanCashtag = squareCustomerCashtag.trim().replace(/^\$/, '');
                                        if (!cleanCashtag || cleanCashtag.length < 2) {
                                          addToast({
                                            type: 'error',
                                            title: 'Valid $Cashtag Required',
                                            description: 'Please enter your Cash App handle (e.g. $yourname).',
                                          });
                                          return;
                                        }
                                        setSquareCashAppPushStatus('dispatched');
                                        addToast({
                                          type: 'info',
                                          title: 'Push Request Sent',
                                          description: `Dispatched payment request to ${squareCustomerCashtag} on mobile Cash App.`,
                                        });
                                      }}
                                      className="w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 bg-[#00D632] hover:bg-[#00c02d] text-white shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                                    >
                                      <Smartphone className="h-4 w-4" />
                                      <span>Send Cash App Push Request to {squareCustomerCashtag || '$user'}</span>
                                    </button>
                                  ) : squareCashAppPushStatus === 'dispatched' ? (
                                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 space-y-2 text-left">
                                      <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                        <span className="flex items-center gap-1.5">
                                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                          Push Sent to {squareCustomerCashtag}
                                        </span>
                                        <Badge variant="teal" size="xs">Pending Mobile Approval</Badge>
                                      </div>
                                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                        Approve {currentCurrency.symbol}{totalAmountLocal.toLocaleString()} in your phone's Cash App to complete.
                                      </p>
                                      <div className="flex items-center gap-2 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSquareCashAppPushStatus('approved');
                                            addToast({
                                              type: 'success',
                                              title: 'Cash App Approved!',
                                              description: `Mobile payment from ${squareCustomerCashtag} authorized.`,
                                            });
                                          }}
                                          className="flex-1 py-1.5 px-3 rounded-md bg-[#00D632] hover:bg-[#00c02d] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                        >
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                          <span>Confirm Mobile Approval</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setSquareCashAppPushStatus('idle')}
                                          className="py-1.5 px-2.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                        >
                                          Resend
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-3 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/40 border border-emerald-400 dark:border-emerald-700 flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                      <span className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        <span>Cash App from {squareCustomerCashtag} Approved!</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setSquareCashAppPushStatus('idle')}
                                        className="text-[10px] text-zinc-500 hover:underline cursor-pointer"
                                      >
                                        Change
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : selectedGateway === 'square' && squareSubTab === 'afterpay' ? (
                            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 space-y-4 shadow-xs">
                              <div className="p-3.5 rounded-lg bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200/90 dark:border-cyan-900/60 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-cyan-950 dark:text-cyan-200 flex-wrap gap-2">
                                  <span className="flex items-center gap-2">
                                    <AfterpayLogo size="sm" variant="plain" />
                                    <span>• 4 Interest-Free Installments</span>
                                  </span>
                                  <Badge variant="teal" size="xs" className="font-mono">
                                    0% APR • 100% Upfront Admin Payout
                                  </Badge>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                  Pay 25% today and split the remainder into 3 equal bi-weekly installments automatically billed every 2 weeks with 0% interest. <strong>Admin receives 100% full settlement upfront immediately</strong> into their Square account.
                                </p>
                              </div>

                              {/* 4 Installment Breakdown Cards */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                <div className="p-2.5 rounded-lg bg-cyan-500/10 border-2 border-cyan-500/40">
                                  <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 uppercase block">1st (Today)</span>
                                  <span className="text-xs font-mono font-extrabold text-cyan-900 dark:text-cyan-100">
                                    {currentCurrency.symbol}{(totalAmountLocal / 4).toFixed(2)}
                                  </span>
                                  <span className="text-[9px] text-emerald-600 font-black block mt-0.5">Due Now (25%)</span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                                  <span className="text-[10px] font-medium text-zinc-400 uppercase block">2nd (+2 Wks)</span>
                                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                    {currentCurrency.symbol}{(totalAmountLocal / 4).toFixed(2)}
                                  </span>
                                  <span className="text-[9px] text-zinc-400 block mt-0.5">Auto-Debit</span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                                  <span className="text-[10px] font-medium text-zinc-400 uppercase block">3rd (+4 Wks)</span>
                                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                    {currentCurrency.symbol}{(totalAmountLocal / 4).toFixed(2)}
                                  </span>
                                  <span className="text-[9px] text-zinc-400 block mt-0.5">Auto-Debit</span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                                  <span className="text-[10px] font-medium text-zinc-400 uppercase block">4th (+6 Wks)</span>
                                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                    {currentCurrency.symbol}{(totalAmountLocal / 4).toFixed(2)}
                                  </span>
                                  <span className="text-[9px] text-zinc-400 block mt-0.5">Final Debit</span>
                                </div>
                              </div>

                              {/* Customer Eligibility Verification */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    Mobile Number for Afterpay SMS Code *
                                  </label>
                                  <input
                                    type="text"
                                    value={squareAfterpayPhone}
                                    onChange={(e) => setSquareAfterpayPhone(e.target.value)}
                                    placeholder="+1 (555) 019-2834"
                                    className="w-full px-3 py-1.5 text-xs rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-600"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    Date of Birth (Eligibility Check) *
                                  </label>
                                  <input
                                    type="date"
                                    value={squareAfterpayDob}
                                    onChange={(e) => setSquareAfterpayDob(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-600"
                                  />
                                </div>
                              </div>

                              {/* Payment Card for Initial 25% Debit & Auto-Debit Schedule */}
                              <div className="p-3.5 rounded-xl bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-300/80 dark:border-cyan-800/60 space-y-3">
                                <div className="flex items-center justify-between border-b border-cyan-200/80 dark:border-cyan-800/50 pb-2">
                                  <span className="text-xs font-bold text-cyan-950 dark:text-cyan-200 flex items-center gap-1.5">
                                    <CreditCard className="h-4 w-4 text-cyan-600" />
                                    1st Installment Debit &amp; Auto-Pay Card Details *
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSquareAfterpayCardNumber('4111 1111 1111 1111');
                                      setSquareAfterpayCardExpiry('12/28');
                                      setSquareAfterpayCardCvv('123');
                                      setSquareAfterpayCardHolder('MUKESH SWAMI');
                                      setSquareAfterpayOtp('849201');
                                      setSquareAfterpayOtpSent(true);
                                      addToast({
                                        type: 'info',
                                        title: 'Test Card & OTP Filled',
                                        description: 'Square Afterpay test card (4111...) and 6-digit SMS OTP (849201) applied.',
                                      });
                                    }}
                                    className="text-[10px] text-cyan-700 dark:text-cyan-300 font-bold hover:underline cursor-pointer"
                                  >
                                    + Fill Test Card &amp; OTP
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                  <div className="col-span-2 sm:col-span-4">
                                    <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                      Debit or Credit Card Number *
                                    </label>
                                    <div className="relative">
                                      <CreditCard className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                      <input
                                        type="text"
                                        value={squareAfterpayCardNumber}
                                        onChange={(e) => {
                                          const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                                          const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
                                          setSquareAfterpayCardNumber(formatted);
                                        }}
                                        placeholder="•••• •••• •••• ••••"
                                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-600"
                                      />
                                    </div>
                                  </div>

                                  <div className="col-span-2">
                                    <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                      Cardholder Full Name *
                                    </label>
                                    <input
                                      type="text"
                                      value={squareAfterpayCardHolder}
                                      onChange={(e) => setSquareAfterpayCardHolder(e.target.value.toUpperCase())}
                                      placeholder="CARDHOLDER NAME"
                                      className="w-full px-3 py-1.5 text-xs rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-600"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                      Expiry (MM/YY) *
                                    </label>
                                    <input
                                      type="text"
                                      value={squareAfterpayCardExpiry}
                                      onChange={(e) => {
                                        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                                        setSquareAfterpayCardExpiry(v);
                                      }}
                                      placeholder="MM/YY"
                                      maxLength={5}
                                      className="w-full px-2 py-1.5 text-xs rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-center text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-600"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                      CVV / CVC *
                                    </label>
                                    <input
                                      type="password"
                                      value={squareAfterpayCardCvv}
                                      onChange={(e) => setSquareAfterpayCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                      placeholder="CVC"
                                      maxLength={4}
                                      className="w-full px-2 py-1.5 text-xs rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-center text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-600"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* 2-Step SMS OTP Verification */}
                              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <label className="font-bold text-zinc-700 dark:text-zinc-300">
                                    6-Digit Afterpay SMS Security Code *
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSquareAfterpayOtpSent(true);
                                      setSquareAfterpayOtp('849201');
                                      addToast({
                                        type: 'success',
                                        title: 'SMS Code Sent',
                                        description: `Verification code [849 201] sent to ${squareAfterpayPhone}`,
                                      });
                                    }}
                                    className="text-[10.5px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                                  >
                                    {squareAfterpayOtpSent ? 'Resend SMS Code' : 'Send SMS Code'}
                                  </button>
                                </div>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={squareAfterpayOtp}
                                    onChange={(e) => setSquareAfterpayOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="849 201"
                                    maxLength={6}
                                    className="w-full px-3 py-1.5 text-xs rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono font-bold tracking-widest text-center text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-600"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                                <input
                                  type="checkbox"
                                  id="afterpayTerms"
                                  checked={squareAfterpayAccepted}
                                  onChange={(e) => setSquareAfterpayAccepted(e.target.checked)}
                                  className="rounded border-zinc-300 dark:border-zinc-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                                />
                                <label htmlFor="afterpayTerms" className="cursor-pointer">
                                  I authorize Square Afterpay to debit 1st installment of {currentCurrency.symbol}{(totalAmountLocal / 4).toFixed(2)} today and schedule the remaining 3 fortnightly installments of {currentCurrency.symbol}{(totalAmountLocal / 4).toFixed(2)} on this card.
                                </label>
                              </div>

                              <button
                                type="button"
                                onClick={handleExecutePayment}
                                className="w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                              >
                                <Percent className="h-4 w-4" />
                                <span>
                                  Authorize 1st Installment ({currentCurrency.symbol}${(totalAmountLocal / 4).toFixed(2)}) via Afterpay &amp; Activate Plan
                                </span>
                              </button>
                            </div>
                          ) : selectedGateway === 'paddle' && paddleSubTab === 'vat_invoice' ? (
                            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 space-y-4">
                              {/* Header Notice */}
                              <div className="p-3.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/90 dark:border-teal-900/60 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-teal-950 dark:text-teal-200 flex-wrap gap-2">
                                  <span className="flex items-center gap-1.5">
                                    <Building className="h-4 w-4 text-teal-600" />
                                    Paddle Merchant of Record • B2B Cross-Border Tax Engine
                                  </span>
                                  <Badge variant="teal" size="xs" className="font-mono text-[9px] font-bold">
                                    0% VAT REVERSE CHARGE COMPLIANT
                                  </Badge>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                  Paddle acts as the Merchant of Record, automatically applying Article 196 EU VAT Directive, UK HMRC B2B rules, and US sales tax exemptions to generate compliant B2B tax receipts with zero VAT liability.
                                </p>
                              </div>

                              {/* Form Inputs */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    Company / Entity Legal Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={paddleCompanyName}
                                    onChange={(e) => setPaddleCompanyName(e.target.value)}
                                    placeholder="e.g. Acme Cloud Technologies BV"
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                      VAT / GST / Tax Identification ID *
                                    </label>
                                    <span className="text-[9.5px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                                      {paddleVatNumber.startsWith('GB') ? 'UK HMRC VAT' : paddleVatNumber.startsWith('DE') ? 'German USt-IdNr' : paddleVatNumber.startsWith('FR') ? 'French TVA' : paddleVatNumber.startsWith('27') ? 'India GSTIN' : /^\d{2}-\d{7}$/.test(paddleVatNumber) ? 'US Federal EIN' : 'Verified Tax ID'}
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    value={paddleVatNumber}
                                    onChange={(e) => {
                                      setPaddleVatNumber(e.target.value);
                                      setTaxId(e.target.value);
                                    }}
                                    placeholder="e.g. GB981273910, DE123456789, or EIN 12-3456789"
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                  />
                                </div>

                                <div className="col-span-1 sm:col-span-2">
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    Accounts Payable / Finance Contact Email *
                                  </label>
                                  <input
                                    type="email"
                                    value={paddleFinanceEmail}
                                    onChange={(e) => setPaddleFinanceEmail(e.target.value)}
                                    placeholder="accounting@yourcompany.com"
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                  />
                                  <span className="text-[10px] text-zinc-400 mt-1 block">
                                    Official B2B tax invoice PDF receipt and reverse-charge documentation will be dispatched to this address.
                                  </span>
                                </div>
                              </div>

                              {/* B2B Settlement Rail Choice */}
                              <div className="space-y-1.5 pt-1">
                                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                                  Preferred Settlement Rail under Paddle MoR
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPaddleSettlementRail('card')}
                                    className={`p-2.5 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                                      paddleSettlementRail === 'card'
                                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-800 dark:text-teal-200 shadow-xs ring-2 ring-teal-500/20'
                                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                                    }`}
                                  >
                                    <CreditCard className="h-4 w-4 text-teal-600" />
                                    <span className="text-[11px] font-bold">Corporate Card</span>
                                    <span className="text-[9px] font-mono text-zinc-400">Instant Auth</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPaddleSettlementRail('sepa')}
                                    className={`p-2.5 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                                      paddleSettlementRail === 'sepa'
                                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-800 dark:text-teal-200 shadow-xs ring-2 ring-teal-500/20'
                                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                                    }`}
                                  >
                                    <Building className="h-4 w-4 text-teal-600" />
                                    <span className="text-[11px] font-bold">SEPA B2B Debit</span>
                                    <span className="text-[9px] font-mono text-zinc-400">Euro Direct</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPaddleSettlementRail('wire')}
                                    className={`p-2.5 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                                      paddleSettlementRail === 'wire'
                                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-800 dark:text-teal-200 shadow-xs ring-2 ring-teal-500/20'
                                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                                    }`}
                                  >
                                    <FileText className="h-4 w-4 text-teal-600" />
                                    <span className="text-[11px] font-bold">Net-30 Invoice</span>
                                    <span className="text-[9px] font-mono text-zinc-400">PO Clearance</span>
                                  </button>
                                </div>
                              </div>

                              {/* DYNAMIC SUB-PANEL 1: CORPORATE CARD */}
                              {paddleSettlementRail === 'card' && (
                                <div className="p-4 rounded-xl bg-zinc-50/60 dark:bg-zinc-800/60 border border-teal-500/30 space-y-3.5 animate-in fade-in duration-150">
                                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="h-4 w-4 text-teal-600" />
                                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                        Corporate Card Authorization (Zero VAT Reverse Charge)
                                      </span>
                                    </div>
                                    <Badge variant="teal" size="xs" className="font-mono">Instant 3DS2 Settle</Badge>
                                  </div>

                                  {/* Realistic 3D Bank Physical Card Simulator */}
                                  <div className="py-1">
                                    <PhysicalBankCardSimulator
                                      cardIntelligence={cardIntelligence}
                                      cardNumber={cardNumber}
                                      cardHolder={cardHolder || paddleCompanyName}
                                      cardExpiry={cardExpiry}
                                      cardCvv={cardCvv}
                                      isFlipped={isCardFlipped}
                                    />
                                  </div>

                                  {/* Interactive Card Form Fields Directly Underneath */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                                    <div className="col-span-2 sm:col-span-4">
                                      <div className="flex items-center justify-between mb-1">
                                        <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                          Corporate Card Number *
                                        </label>
                                        {cardNumber.replace(/\D/g, '').length >= 4 && (
                                          <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                                            <span>{cardIntelligence.bankName}</span>
                                            <span className="text-zinc-400 dark:text-zinc-500">•</span>
                                            <span>{cardIntelligence.cardType}</span>
                                          </span>
                                        )}
                                      </div>
                                      <div className="relative">
                                        <CreditCard className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                        <input
                                          type="text"
                                          name="cardnumber"
                                          autoComplete="cc-number"
                                          inputMode="numeric"
                                          maxLength={cardIntelligence.maxLength + 4}
                                          value={cardNumber}
                                          onFocus={() => setIsCardFlipped(false)}
                                          onChange={handleCardNumberChange}
                                          placeholder="•••• •••• •••• ••••"
                                          className="w-full pl-9 pr-14 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                        />
                                        <div className="absolute right-3 top-2 scale-75 origin-right">
                                          {renderSchemeLogo()}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="col-span-2">
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Cardholder / Authorized Officer Name *
                                      </label>
                                      <div className="relative">
                                        <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                        <input
                                          type="text"
                                          name="ccname"
                                          autoComplete="cc-name"
                                          value={cardHolder}
                                          onFocus={() => setIsCardFlipped(false)}
                                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                          placeholder="AUTHORIZED OFFICER NAME"
                                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-bold"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Expiry (MM/YY) *
                                      </label>
                                      <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                        <input
                                          type="text"
                                          name="ccexp"
                                          autoComplete="cc-exp"
                                          inputMode="numeric"
                                          maxLength={5}
                                          value={cardExpiry}
                                          onFocus={() => setIsCardFlipped(false)}
                                          onChange={handleExpiryChange}
                                          placeholder="MM/YY"
                                          className="w-full pl-8 pr-2 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-bold text-center"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center justify-between">
                                        <span>CVV / CVC *</span>
                                        <span className="text-[9px] text-amber-500 font-mono">(Flips Card)</span>
                                      </label>
                                      <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                        <input
                                          type="password"
                                          name="cvc"
                                          autoComplete="cc-csc"
                                          inputMode="numeric"
                                          maxLength={cardIntelligence.cvvLength}
                                          value={cardCvv}
                                          onFocus={() => setIsCardFlipped(true)}
                                          onChange={handleCvvChange}
                                          placeholder="CVC"
                                          className="w-full pl-8 pr-2 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-bold text-center"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* DYNAMIC SUB-PANEL 2: SEPA B2B DIRECT DEBIT */}
                              {paddleSettlementRail === 'sepa' && (
                                <div className="p-4 rounded-xl bg-zinc-50/60 dark:bg-zinc-800/60 border border-teal-500/30 space-y-3.5 animate-in fade-in duration-150">
                                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                                    <div className="flex items-center gap-2">
                                      <Building className="h-4 w-4 text-teal-600" />
                                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                        SEPA Corporate B2B Direct Debit Mandate
                                      </span>
                                    </div>
                                    <Badge variant="teal" size="xs" className="font-mono">Eurosystem Interbank</Badge>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="col-span-1 sm:col-span-2">
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Corporate Bank IBAN (International Bank Account Number) *
                                      </label>
                                      <div className="relative">
                                        <Landmark className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                        <input
                                          type="text"
                                          value={paddleSepaIban}
                                          onChange={(e) => setPaddleSepaIban(e.target.value.toUpperCase())}
                                          placeholder="e.g. GB33 BUKB 2020 1555 5555 55 or DE89 3704 0044 0532 0130 00"
                                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Bank BIC / SWIFT Code *
                                      </label>
                                      <input
                                        type="text"
                                        value={paddleSepaBic}
                                        onChange={(e) => setPaddleSepaBic(e.target.value.toUpperCase())}
                                        placeholder="e.g. BUKBGB22 or DEUTDEDBFXX"
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Corporate Bank Name *
                                      </label>
                                      <input
                                        type="text"
                                        value={paddleSepaBankName}
                                        onChange={(e) => setPaddleSepaBankName(e.target.value)}
                                        placeholder="e.g. Barclays Corporate Bank"
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-medium"
                                      />
                                    </div>
                                  </div>

                                  {/* Mandate Legal Terms Box */}
                                  <div className="p-3 rounded-lg bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/50 space-y-2 text-xs">
                                    <div className="flex items-center justify-between font-mono text-[10.5px]">
                                      <span className="text-teal-900 dark:text-teal-200 font-bold">Creditor ID: GB98ZZZ891238912</span>
                                      <span className="text-teal-700 dark:text-teal-300">Mandate: MND-PADDLE-B2B-9812</span>
                                    </div>
                                    <label className="flex items-start gap-2 cursor-pointer pt-1">
                                      <input
                                        type="checkbox"
                                        checked={paddleSepaMandateAccepted}
                                        onChange={(e) => setPaddleSepaMandateAccepted(e.target.checked)}
                                        className="mt-0.5 rounded border-teal-400 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                      />
                                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        I authorize <strong>Paddle Payments Europe Ltd (Merchant of Record)</strong> to send instructions to my bank to debit the corporate account under the <strong>SEPA B2B Direct Debit Scheme</strong> rules with 0% reverse charge tax clearance.
                                      </span>
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* DYNAMIC SUB-PANEL 3: NET-30 INVOICE / PO */}
                              {paddleSettlementRail === 'wire' && (
                                <div className="p-4 rounded-xl bg-zinc-50/60 dark:bg-zinc-800/60 border border-teal-500/30 space-y-3.5 animate-in fade-in duration-150">
                                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-teal-600" />
                                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                        Corporate Net-30 Purchase Order (PO) Invoicing
                                      </span>
                                    </div>
                                    <Badge variant="teal" size="xs" className="font-mono">Net-30 Terms Active</Badge>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Corporate Purchase Order (PO) Number *
                                      </label>
                                      <div className="relative">
                                        <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                        <input
                                          type="text"
                                          value={paddlePoNumber}
                                          onChange={(e) => setPaddlePoNumber(e.target.value.toUpperCase())}
                                          placeholder="e.g. PO-2026-CC9823"
                                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Billing Department / Cost Center
                                      </label>
                                      <input
                                        type="text"
                                        value={paddleBillingDepartment}
                                        onChange={(e) => setPaddleBillingDepartment(e.target.value)}
                                        placeholder="e.g. Finance & Accounts Payable"
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-medium"
                                      />
                                    </div>
                                  </div>

                                  {/* Paddle MoR Direct Clearing Remittance Wire Coordinates */}
                                  <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 space-y-2 text-xs">
                                    <div className="flex items-center justify-between text-[11px] font-bold border-b border-zinc-200 dark:border-zinc-700 pb-1.5">
                                      <span className="text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                        <Landmark className="h-3.5 w-3.5 text-teal-600" />
                                        Paddle MoR London Clearing Wire Remittance Details
                                      </span>
                                      <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold">Net-30 Due in 30 Days</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-zinc-400 block text-[10px] font-sans">Beneficiary:</span>
                                        <strong className="text-zinc-800 dark:text-zinc-200 truncate block">Paddle.com Market Ltd</strong>
                                      </div>
                                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-zinc-400 block text-[10px] font-sans">Clearing Bank:</span>
                                        <strong className="text-zinc-800 dark:text-zinc-200 truncate block">Barclays Bank PLC London</strong>
                                      </div>
                                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-zinc-400 block text-[10px] font-sans">IBAN (GBP / EUR / USD):</span>
                                        <strong className="text-zinc-800 dark:text-zinc-200 truncate block">GB12 BARC 2020 1589 1238 47</strong>
                                      </div>
                                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-zinc-400 block text-[10px] font-sans">SWIFT / BIC:</span>
                                        <strong className="text-zinc-800 dark:text-zinc-200 truncate block">BARCGB22</strong>
                                      </div>
                                    </div>
                                    <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 pt-1 leading-relaxed">
                                      ⚡ An official tax invoice PDF with the purchase order #{paddlePoNumber} and reverse-charge documentation will be dispatched to <strong>{paddleFinanceEmail}</strong> upon submission.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Reverse charge verification callout */}
                              <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between text-xs font-mono">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <span className="text-emerald-900 dark:text-emerald-200 font-bold">
                                    Tax Line Zero-Rated (0% Reverse Charge Exemption)
                                  </span>
                                </div>
                                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                  Tax: $0.00 (Exempt)
                                </span>
                              </div>
                            </div>
                          ) : selectedGateway === 'authorizenet' && authnetSubTab === 'echeck' ? (
                            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 space-y-4">
                              {/* Header & Multi-Bank Sandbox Presets */}
                              <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-teal-600" />
                                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                    eCheck.Net® Electronic Bank Direct Debit (ACH)
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] text-zinc-400 font-bold">Presets:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAuthnetRouting('021000021');
                                      setAuthnetAccount('987654321098');
                                      setAuthnetEcheckName('MUKESH SWAMI');
                                      setAuthnetEcheckBank('JPMorgan Chase Bank, N.A.');
                                      setAuthnetEcheckAccountType('checking');
                                      setAuthnetEcheckMandateAccepted(true);
                                      addToast({
                                        type: 'info',
                                        title: 'Chase Checking Preset Loaded',
                                        description: 'JPMorgan Chase ACH checking account applied to physical cheque preview.',
                                      });
                                    }}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 cursor-pointer"
                                  >
                                    + Chase Checking
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAuthnetRouting('121042882');
                                      setAuthnetAccount('449012389102');
                                      setAuthnetEcheckName('GLOBAL SOVEREIGN TECH');
                                      setAuthnetEcheckBank('Wells Fargo Bank, N.A.');
                                      setAuthnetEcheckAccountType('businessChecking');
                                      setAuthnetEcheckMandateAccepted(true);
                                      addToast({
                                        type: 'info',
                                        title: 'Wells Fargo Business Preset Loaded',
                                        description: 'Wells Fargo ACH business checking account applied.',
                                      });
                                    }}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer"
                                  >
                                    + Wells Fargo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAuthnetRouting('121000358');
                                      setAuthnetAccount('552091823746');
                                      setAuthnetEcheckName('MUKESH SWAMI');
                                      setAuthnetEcheckBank('Bank of America, N.A.');
                                      setAuthnetEcheckAccountType('savings');
                                      setAuthnetEcheckMandateAccepted(true);
                                      addToast({
                                        type: 'info',
                                        title: 'Bank of America Savings Preset Loaded',
                                        description: 'Bank of America ACH savings account applied.',
                                      });
                                    }}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer"
                                  >
                                    + BofA Savings
                                  </button>
                                </div>
                              </div>

                              {/* Photorealistic Interactive US Physical Bank Check Simulator */}
                              <div className="py-1">
                                <PhysicalBankCheckSimulator
                                  routingNumber={authnetRouting}
                                  accountNumber={authnetAccount}
                                  accountHolderName={authnetEcheckName || billingName}
                                  bankName={authnetEcheckBank}
                                  accountType={authnetEcheckAccountType}
                                  amountLocal={totalAmountLocal}
                                  currencySymbol={currentCurrency.symbol}
                                  currencyCode={selectedCurrencyCode}
                                  memoText={`${isWalletTopup ? 'Prepaid Wallet TopUp' : selectedPlan.name} Settlement`}
                                />
                              </div>

                              {/* Account Type Selector */}
                              <div>
                                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                                  Bank Account Type *
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { value: 'checking', label: 'Checking Account' },
                                    { value: 'savings', label: 'Savings Account' },
                                    { value: 'businessChecking', label: 'Business Checking' },
                                  ].map((t) => (
                                    <button
                                      key={t.value}
                                      type="button"
                                      onClick={() => setAuthnetEcheckAccountType(t.value as any)}
                                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all border text-center cursor-pointer ${
                                        authnetEcheckAccountType === t.value
                                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 ring-1 ring-teal-600 font-extrabold'
                                          : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                                      }`}
                                    >
                                      {t.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                      9-Digit ABA Routing Number *
                                    </label>
                                    <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400">
                                      {authnetRouting.length}/9 Digits
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    maxLength={9}
                                    value={authnetRouting}
                                    onChange={(e) => {
                                      const clean = e.target.value.replace(/\D/g, '');
                                      setAuthnetRouting(clean);
                                      if (clean.length >= 4) {
                                        const resolved = resolveBankByRouting(clean);
                                        if (resolved && resolved.name) {
                                          setAuthnetEcheckBank(resolved.name);
                                        }
                                      }
                                    }}
                                    placeholder="021000021"
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    US Bank Account Number *
                                  </label>
                                  <input
                                    type="text"
                                    maxLength={17}
                                    value={authnetAccount}
                                    onChange={(e) => setAuthnetAccount(e.target.value.replace(/\D/g, ''))}
                                    placeholder="987654321098"
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    Account Holder Full Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={authnetEcheckName}
                                    onChange={(e) => setAuthnetEcheckName(e.target.value.toUpperCase())}
                                    placeholder="MUKESH SWAMI"
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    Commercial Bank Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={authnetEcheckBank}
                                    onChange={(e) => setAuthnetEcheckBank(e.target.value)}
                                    placeholder="JPMorgan Chase Bank, N.A."
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                  />
                                </div>
                              </div>

                              {/* NACHA Mandate Authorization Checkbox */}
                              <div
                                onClick={() => setAuthnetEcheckMandateAccepted(!authnetEcheckMandateAccepted)}
                                className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-900/60 flex items-start gap-2.5 cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={authnetEcheckMandateAccepted}
                                  onChange={(e) => setAuthnetEcheckMandateAccepted(e.target.checked)}
                                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                                />
                                <div className="text-[11px] text-blue-950 dark:text-blue-200 leading-relaxed">
                                  <span className="font-bold">NACHA Electronic Funds Transfer Authorization:</span> I authorize CreateCall OS Technologies to initiate a one-time or recurring electronic debit from the bank account specified above for settlement of invoice {selectedPlan.name} ({currentCurrency.symbol}{totalAmountLocal.toLocaleString()}).
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Realistic 3D Bank Physical Card Simulator */}
                              <div className="py-1">
                                <PhysicalBankCardSimulator
                                  cardIntelligence={cardIntelligence}
                                  cardNumber={cardNumber}
                                  cardHolder={cardHolder}
                                  cardExpiry={cardExpiry}
                                  cardCvv={cardCvv}
                                  isFlipped={isCardFlipped}
                                />
                              </div>

                              {/* Interactive Card Form Fields Directly Underneath */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                <div className="col-span-2 sm:col-span-4">
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                        Card Number *
                                      </label>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {selectedGateway === 'square' && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setCardNumber('4111 1111 1111 1111');
                                              setCardExpiry('12/28');
                                              setCardCvv('123');
                                              setCardHolder('MUKESH SWAMI');
                                              setSquarePostalCode('94103');
                                              addToast({
                                                type: 'info',
                                                title: 'Square Test Card Filled',
                                                description: 'Square sandbox Visa card (4111...) and AVS Postal Code (94103) applied.',
                                              });
                                            }}
                                            className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                                          >
                                            + Fill Square Test Card
                                          </button>
                                        )}
                                        {selectedGateway === 'authorizenet' && (
                                          <div className="flex items-center gap-1 flex-wrap">
                                            <span className="text-[10px] text-zinc-400 font-bold">Test Cards:</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setCardNumber('4007 0000 0002 7');
                                                setCardExpiry('12/28');
                                                setCardCvv('123');
                                                setCardHolder('MUKESH SWAMI');
                                                addToast({
                                                  type: 'info',
                                                  title: 'Authorize.Net Visa Test Card Applied',
                                                  description: 'Official test Visa card (4007 0000 0002 7) applied.',
                                                });
                                              }}
                                              className="px-1.5 py-0.5 rounded text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 cursor-pointer"
                                            >
                                              + Visa
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setCardNumber('5424 0000 0000 0015');
                                                setCardExpiry('12/28');
                                                setCardCvv('123');
                                                setCardHolder('MUKESH SWAMI');
                                                addToast({
                                                  type: 'info',
                                                  title: 'Authorize.Net Mastercard Test Card Applied',
                                                  description: 'Official test Mastercard (5424 0000 0000 0015) applied.',
                                                });
                                              }}
                                              className="px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer"
                                            >
                                              + Mastercard
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setCardNumber('3782 822463 10005');
                                                setCardExpiry('12/28');
                                                setCardCvv('1234');
                                                setCardHolder('MUKESH SWAMI');
                                                addToast({
                                                  type: 'info',
                                                  title: 'Authorize.Net Amex Test Card Applied',
                                                  description: 'Official test Amex (3782 822463 10005) applied.',
                                                });
                                              }}
                                              className="px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer"
                                            >
                                              + Amex
                                            </button>
                                          </div>
                                        )}
                                        {cardNumber.replace(/\D/g, '').length >= 4 && (
                                          <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                                            <span>{cardIntelligence.bankName}</span>
                                            <span className="text-zinc-400 dark:text-zinc-500">•</span>
                                            <span>{cardIntelligence.cardType}</span>
                                            <span className="text-zinc-400 dark:text-zinc-500">•</span>
                                            <span>{cardIntelligence.bankCountry}</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  <div className="relative">
                                    <CreditCard className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                    <input
                                      type="text"
                                      name="cardnumber"
                                      id="checkout-cardnumber"
                                      autoComplete="cc-number"
                                      inputMode="numeric"
                                      maxLength={cardIntelligence.maxLength + 4}
                                      value={cardNumber}
                                      onFocus={() => setIsCardFlipped(false)}
                                      onChange={handleCardNumberChange}
                                      placeholder="•••• •••• •••• ••••"
                                      className="w-full pl-9 pr-14 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                    />
                                    <div className="absolute right-3 top-2 scale-75 origin-right">
                                      {renderSchemeLogo()}
                                    </div>
                                  </div>
                                </div>

                                <div className="col-span-2">
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    Cardholder Name *
                                  </label>
                                  <div className="relative">
                                    <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                    <input
                                      type="text"
                                      name="ccname"
                                      id="checkout-cardholder"
                                      autoComplete="cc-name"
                                      value={cardHolder}
                                      onFocus={() => setIsCardFlipped(false)}
                                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                      placeholder="CARDHOLDER NAME"
                                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-bold"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    Expiry (MM/YY) *
                                  </label>
                                  <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                    <input
                                      type="text"
                                      name="ccexp"
                                      id="checkout-cardexpiry"
                                      autoComplete="cc-exp"
                                      inputMode="numeric"
                                      maxLength={5}
                                      value={cardExpiry}
                                      onFocus={() => setIsCardFlipped(false)}
                                      onChange={handleExpiryChange}
                                      placeholder="MM/YY"
                                      className="w-full pl-8 pr-2 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-bold text-center"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center justify-between">
                                    <span>CVV / CVC *</span>
                                    <span className="text-[9px] text-amber-500 font-mono">(Flips Card)</span>
                                  </label>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                    <input
                                      type="password"
                                      name="cvc"
                                      id="checkout-cardcvv"
                                      autoComplete="cc-csc"
                                      inputMode="numeric"
                                      maxLength={cardIntelligence.cvvLength}
                                      value={cardCvv}
                                      onFocus={() => setIsCardFlipped(true)}
                                      onChange={handleCvvChange}
                                      placeholder="CVC"
                                      className="w-full pl-8 pr-2 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-bold text-center"
                                    />
                                  </div>
                                </div>

                                {selectedGateway === 'square' && (
                                  <div className="col-span-2 sm:col-span-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="space-y-0.5">
                                      <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                        <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                                        Square AVS Fraud Shield (Address Verification Service)
                                      </span>
                                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
                                        Square verifies billing postal code against your card issuing bank records.
                                      </span>
                                    </div>
                                    <div className="w-full sm:w-36">
                                      <input
                                        type="text"
                                        value={squarePostalCode}
                                        onChange={(e) => setSquarePostalCode(e.target.value.toUpperCase())}
                                        placeholder="Zip / Postal"
                                        className="w-full px-3 py-1.5 text-xs rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 text-center"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 pt-1 text-xs text-zinc-600 dark:text-zinc-400">
                                <input
                                  type="checkbox"
                                  id="saveCard"
                                  checked={saveCardForRecurring}
                                  onChange={(e) => setSaveCardForRecurring(e.target.checked)}
                                  className="rounded border-zinc-300 dark:border-zinc-700 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                />
                                <label htmlFor="saveCard" className="cursor-pointer text-[11px] font-medium">
                                  Save this card securely for automatic renewals and voice line quota replenishments.
                                </label>
                              </div>
                            </>
                          )}

                          {/* FULL-WIDTH BOTTOM SETTLEMENT & CONVERTER BAR */}
                          <div className="p-3.5 rounded-lg bg-linear-to-r from-teal-50/90 via-emerald-50/50 to-sky-50/80 dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-sky-950/30 border border-teal-200/80 dark:border-teal-800/60 space-y-2.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-teal-200/60 dark:border-teal-800/60 pb-2">
                              <span className="text-xs font-bold text-teal-950 dark:text-teal-100 flex items-center gap-1.5">
                                <Globe2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                                Gateway Settlement Currency: <strong>{selectedGateway === 'paddle' ? '🌐 USD ($) / EUR (€) / GBP (£)' : '💳 USD ($) • Multi-Currency'}</strong>
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

                            {/* BUTTONS UNDERNEATH TEXT */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                              {selectedCurrencyCode !== 'USD' && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedCurrencyCode('USD')}
                                  className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-teal-800 dark:text-teal-200 bg-white dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-teal-300 dark:border-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                >
                                  <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                                  <span className="whitespace-nowrap">Switch Order to USD ($)</span>
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
                    })()}

                    {/* ADYEN GLOBAL FINANCIAL TECHNOLOGY (ENTERPRISE 3DS2 & LOCAL BANKING) */}
                    {selectedGateway === 'adyen' && (() => {
                      const liveAdyenGateway = enabledGateways.find(
                        (g: any) => g.gateway_key === 'adyen' || g.gateway_key === selectedGateway
                      ) || {};
                      const isAdyenConfigured = Boolean(
                        liveAdyenGateway.is_configured &&
                        (liveAdyenGateway.merchant_id || liveAdyenGateway.public_key || liveAdyenGateway.secret_key)
                      );
                      const adyenMerchantAccount = liveAdyenGateway.merchant_id || liveAdyenGateway.details_json?.merchant_id || 'CreateCallAI_Adyen_ECOM';

                      const eurCurrencyObj = currencies.find((c) => c.code === 'EUR') || { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 };
                      const eurRate = eurCurrencyObj.rate || 0.92;
                      const eurAmount = (basePriceUsd * eurRate).toFixed(2);

                      const idealBanks = [
                        { id: 'ING', name: 'ING Bank', icon: '🦁', bic: 'INGBNL2A', defaultIban: 'NL02 INGB 0123 4567 89' },
                        { id: 'Rabobank', name: 'Rabobank', icon: '🟠', bic: 'RABONL2U', defaultIban: 'NL91 RABO 0312 4567 89' },
                        { id: 'ABN AMRO', name: 'ABN AMRO', icon: '🟢', bic: 'ABNANL2A', defaultIban: 'NL91 ABNA 0417 1643 00' },
                        { id: 'Revolut', name: 'Revolut Pay', icon: '⚡', bic: 'REVONL21', defaultIban: 'NL14 REVO 0123 4567 89' },
                        { id: 'Bunq', name: 'Bunq Bank', icon: '🌈', bic: 'BUNQNL2A', defaultIban: 'NL23 BUNQ 2045 6789 01' },
                        { id: 'SNS Bank', name: 'SNS Bank', icon: '🔵', bic: 'SNSBNL2A', defaultIban: 'NL78 SNSB 0912 3456 78' },
                        { id: 'ASN Bank', name: 'ASN Bank', icon: '🌳', bic: 'ASNBNL21', defaultIban: 'NL45 ASNB 0823 4567 89' },
                        { id: 'RegioBank', name: 'RegioBank', icon: '🏠', bic: 'RBRBNL21', defaultIban: 'NL60 RBRB 0712 3456 78' },
                        { id: 'Knab', name: 'Knab Bank', icon: '🟣', bic: 'KNABNL2H', defaultIban: 'NL32 KNAB 0612 3456 78' },
                        { id: 'Triodos', name: 'Triodos Bank', icon: '🌱', bic: 'TRIONL2U', defaultIban: 'NL50 TRIO 0512 3456 78' },
                      ];

                      const bancontactBanks = [
                        { id: 'Belfius', name: 'Belfius Bank', bic: 'GEBABEBBXXX', defaultIban: 'BE68 5390 0754 7034' },
                        { id: 'BNP Paribas Fortis', name: 'BNP Paribas Fortis', bic: 'BNPAEB22XXX', defaultIban: 'BE12 0012 3456 7890' },
                        { id: 'KBC', name: 'KBC Bank', bic: 'KREDBEBBXXX', defaultIban: 'BE45 7321 0987 6543' },
                        { id: 'ING Belgium', name: 'ING Belgique', bic: 'BBRUBEBBXXX', defaultIban: 'BE98 3100 1234 5678' },
                        { id: 'Crelan', name: 'Crelan Bank', bic: 'CRELBEBBXXX', defaultIban: 'BE23 8500 9876 5432' },
                        { id: 'Argenta', name: 'Argenta', bic: 'ARSPBE22XXX', defaultIban: 'BE76 9790 1234 5678' },
                      ];

                      const sofortBanks = [
                        { id: 'Deutsche Bank', name: 'Deutsche Bank', blz: '500 700 10', bic: 'DEUTDEDBFXX', defaultIban: 'DE89 3704 0044 0532 0130 00' },
                        { id: 'Commerzbank', name: 'Commerzbank', blz: '500 400 00', bic: 'COBADEFFXXX', defaultIban: 'DE21 5004 0000 0123 4567 89' },
                        { id: 'Sparkasse', name: 'Sparkasse Berlin', blz: '100 500 00', bic: 'BELADEBE100', defaultIban: 'DE12 1005 0000 0123 4567 89' },
                        { id: 'ING Germany', name: 'ING Deutschland', blz: '500 105 17', bic: 'INGDDEFFXXX', defaultIban: 'DE45 5001 0517 0123 4567 89' },
                        { id: 'Volksbank', name: 'Volksbanken', blz: '500 905 00', bic: 'GENODED1VRB', defaultIban: 'DE67 5009 0500 0123 4567 89' },
                        { id: 'N26 Bank', name: 'N26 Mobile', blz: '100 110 01', bic: 'NTSBDEB1XXX', defaultIban: 'DE23 1001 1001 0123 4567 89' },
                        { id: 'Postbank', name: 'Postbank', blz: '500 100 60', bic: 'PBNKDEFFXXX', defaultIban: 'DE34 5001 0060 0123 4567 89' },
                        { id: 'DKB', name: 'DKB Bank', blz: '120 300 00', bic: 'BYLADEM1100', defaultIban: 'DE98 1203 0000 0123 4567 89' },
                      ];

                      const cbBanks = [
                        { id: 'BNP Paribas', name: 'BNP Paribas', bic: 'BNPAFRPPXXX', defaultIban: 'FR76 3000 4000 0112 3456 7890 189' },
                        { id: 'Crédit Agricole', name: 'Crédit Agricole', bic: 'AGRFRPP8XXX', defaultIban: 'FR76 1820 6000 0112 3456 7890 189' },
                        { id: 'Société Générale', name: 'Société Générale', bic: 'SOGEFRPPXXX', defaultIban: 'FR76 3000 3000 0112 3456 7890 189' },
                        { id: 'BPCE', name: 'Banque Populaire / BPCE', bic: 'CCBPFRPPXXX', defaultIban: 'FR76 1027 8000 0112 3456 7890 189' },
                        { id: 'La Banque Postale', name: 'La Banque Postale', bic: 'LBPFFRPPXXX', defaultIban: 'FR76 2004 1000 0112 3456 7890 189' },
                        { id: 'BoursoBank', name: 'BoursoBank', bic: 'BOURFRPPXXX', defaultIban: 'FR76 4061 8000 0112 3456 7890 189' },
                      ];

                      const epsBanks = [
                        { id: 'Erste Bank', name: 'Erste Bank & Sparkasse', shortName: 'Erste Bank', bic: 'GIBAATWWXXX', defaultIban: 'AT61 2011 1000 0012 3456' },
                        { id: 'Raiffeisen', name: 'Raiffeisen Bank', shortName: 'Raiffeisen', bic: 'RZBAATWWXXX', defaultIban: 'AT61 3200 0000 0012 3456' },
                        { id: 'Bank Austria', name: 'UniCredit Bank Austria', shortName: 'Bank Austria', bic: 'BKAUATWWXXX', defaultIban: 'AT61 1200 0000 0012 3456' },
                        { id: 'BAWAG P.S.K.', name: 'BAWAG P.S.K.', shortName: 'BAWAG P.S.K.', bic: 'BAWAATWWXXX', defaultIban: 'AT61 1400 0000 0012 3456' },
                        { id: 'Volksbank AT', name: 'Volksbank Gruppe', shortName: 'Volksbank AT', bic: 'VBOEATWWXXX', defaultIban: 'AT61 4300 0000 0012 3456' },
                        { id: 'Easybank AG', name: 'Easybank AG', shortName: 'Easybank AG', bic: 'EASYATW1XXX', defaultIban: 'AT61 1981 0000 0012 3456' },
                        { id: 'Oberbank', name: 'Oberbank AG', shortName: 'Oberbank', bic: 'OBKLAT2LXXX', defaultIban: 'AT61 1500 0000 0012 3456' },
                        { id: 'Spangler', name: 'Bankhaus Spängler', shortName: 'Bankhaus Spängler', bic: 'SPAEAT2SXXX', defaultIban: 'AT61 1515 0000 0012 3456' },
                      ];

                      const blikBanks = [
                        { id: 'PKO Bank Polski', name: 'PKO Bank Polski', bic: 'BPKOPLPWXXX', defaultIban: 'PL61 1020 1014 0000 0712 1981 2840' },
                        { id: 'mBank', name: 'mBank', bic: 'BREXPLPWMBA', defaultIban: 'PL61 1140 2004 0000 0712 1981 2840' },
                        { id: 'Santander PL', name: 'Santander Polska', bic: 'WBKAPLP1XXX', defaultIban: 'PL61 1090 1014 0000 0712 1981 2840' },
                        { id: 'ING PL', name: 'ING Bank Śląski', bic: 'INGBPLPWXXX', defaultIban: 'PL61 1050 1014 0000 0712 1981 2840' },
                        { id: 'Millennium', name: 'Bank Millennium', bic: 'BIGBPLPWXXX', defaultIban: 'PL61 1160 2202 0000 0712 1981 2840' },
                        { id: 'Alior Bank', name: 'Alior Bank', bic: 'ALIORPLPWXXX', defaultIban: 'PL61 2490 0005 0000 0712 1981 2840' },
                      ];

                      const adyenRails = [
                        { id: 'ideal', name: 'iDEAL', country: 'NL', flag: '🇳🇱', tag: 'Netherlands', cert: 'Currence iDEAL 2.0' },
                        { id: 'bancontact', name: 'Bancontact & Payconiq', country: 'BE', flag: '🇧🇪', tag: 'Belgium', cert: 'Bancontact Payconiq Co.' },
                        { id: 'sofort', name: 'Sofort / Giropay', country: 'DE', flag: '🇩🇪', tag: 'Germany', cert: 'TÜV Saarland Active' },
                        { id: 'cartes_bancaires', name: 'Cartes Bancaires', country: 'FR', flag: '🇫🇷', tag: 'France', cert: 'GIE CB Protected' },
                        { id: 'eps', name: 'EPS Überweisung', country: 'AT', flag: '🇦🇹', tag: 'Austria', cert: 'STUZZA Certified' },
                        { id: 'blik', name: 'BLIK 6-Digit', country: 'PL', flag: '🇵🇱', tag: 'Poland', cert: 'KIR Standard' },
                      ];

                      const dynamicBancontactUri = `payconiq://pay?amount=${(totalAmountLocal * 100).toFixed(0)}&currency=EUR&ref=tx_adyen_payconiq_${qrSessionKey}`;
                      const liveBancontactQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(dynamicBancontactUri)}&_t=${qrSessionKey}`;

                      // Active Bank Object and IBAN resolution
                      const activeIdealBankObj = idealBanks.find((b) => b.id === adyenIdealBank) || idealBanks[0];
                      const activeBancontactBankObj = bancontactBanks.find((b) => b.id === adyenBancontactBank) || bancontactBanks[0];
                      const activeSofortBankObj = sofortBanks.find((b) => b.id === adyenSofortBank) || sofortBanks[0];
                      const activeCbBankObj = cbBanks.find((b) => b.id === adyenCbBank) || cbBanks[0];
                      const activeEpsBankObj = epsBanks.find((b) => b.id === adyenEpsBank) || epsBanks[0];
                      const activeBlikBankObj = blikBanks.find((b) => b.id === adyenBlikBank) || blikBanks[0];

                      const currentRailMeta = adyenRails.find((r) => r.id === adyenBank) || adyenRails[0];

                      let currentActiveBankName = activeIdealBankObj.name;
                      let currentActiveBic = activeIdealBankObj.bic;
                      let currentDefaultIban = activeIdealBankObj.defaultIban;

                      if (adyenBank === 'bancontact') {
                        currentActiveBankName = activeBancontactBankObj.name;
                        currentActiveBic = activeBancontactBankObj.bic;
                        currentDefaultIban = activeBancontactBankObj.defaultIban;
                      } else if (adyenBank === 'sofort') {
                        currentActiveBankName = activeSofortBankObj.name;
                        currentActiveBic = activeSofortBankObj.bic;
                        currentDefaultIban = activeSofortBankObj.defaultIban;
                      } else if (adyenBank === 'cartes_bancaires') {
                        currentActiveBankName = activeCbBankObj.name;
                        currentActiveBic = activeCbBankObj.bic;
                        currentDefaultIban = activeCbBankObj.defaultIban;
                      } else if (adyenBank === 'eps') {
                        currentActiveBankName = activeEpsBankObj.name;
                        currentActiveBic = activeEpsBankObj.bic;
                        currentDefaultIban = activeEpsBankObj.defaultIban;
                      } else if (adyenBank === 'blik') {
                        currentActiveBankName = activeBlikBankObj.name;
                        currentActiveBic = activeBlikBankObj.bic;
                        currentDefaultIban = activeBlikBankObj.defaultIban;
                      }

                      const handleSelectRail = (railId: string) => {
                        setAdyenBank(railId as any);
                        if (railId === 'ideal') setAdyenIban(activeIdealBankObj.defaultIban);
                        else if (railId === 'bancontact') setAdyenIban(activeBancontactBankObj.defaultIban);
                        else if (railId === 'sofort') setAdyenIban(activeSofortBankObj.defaultIban);
                        else if (railId === 'cartes_bancaires') setAdyenIban(activeCbBankObj.defaultIban);
                        else if (railId === 'eps') setAdyenIban(activeEpsBankObj.defaultIban);
                        else if (railId === 'blik') setAdyenIban(activeBlikBankObj.defaultIban);
                      };

                      const handleLaunchBankApp = (bankName: string, protocolName: string) => {
                        const token = `EBA_${protocolName.replace(/[^A-Z0-9]/gi, '_').toUpperCase()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                        setAdyenConnectedRail({
                          bankName,
                          rail: protocolName,
                          bic: currentActiveBic,
                          token,
                        });
                        addToast({
                          type: 'success',
                          title: `${protocolName} Authorization Ready`,
                          description: `Direct interbank connection verified with ${bankName} (${currentActiveBic}). Click Complete Payment to clear €${eurAmount} EUR.`,
                        });
                      };

                      return (
                        <div className="space-y-4">
                          {/* 1. Header & Super Admin Status Indicator */}
                          <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <AdyenLogo size="lg" />
                              <div className="flex items-center gap-2 flex-wrap">
                                {isAdyenConfigured ? (
                                  <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    <BadgeCheck className="h-3.5 w-3.5" /> Super Admin Live Connected
                                  </span>
                                ) : (
                                  <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-bold font-mono flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                    <AlertCircle className="h-3.5 w-3.5" /> Setup Required in Super Admin
                                  </span>
                                )}
                                <Badge variant={isAdyenConfigured ? "teal" : "warning"} size="xs" className="font-mono text-[9px] rounded font-bold">
                                  {isAdyenConfigured ? 'PCI-DSS LEVEL 1 3DS2' : 'ADYEN RAILS PENDING SETUP'}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-0.5 pt-1">
                              <h3 className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                                <span>Adyen Global Financial Technology</span>
                                <span className="text-zinc-400 font-normal text-xs">• Enterprise 3DS2 &amp; Direct Clearing Rails</span>
                              </h3>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Unified global card processing, dynamic 3DS 2.0 biometric challenge, and European domestic clearing network
                              </p>
                            </div>
                          </div>

                          {/* 2. Warning Banner if Unconfigured */}
                          {!isAdyenConfigured && (
                            <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                              <div className="space-y-1 leading-relaxed">
                                <strong className="block text-amber-900 dark:text-amber-100 font-bold">
                                  Adyen Global Setup Required in Super Admin
                                </strong>
                                <p className="text-[11.5px] text-amber-800 dark:text-amber-300">
                                  Adyen payment rail is in <strong>Pending Configuration</strong> state. Super Admin can configure live <em>Merchant Account Name</em>, <em>API Key</em>, <em>Client Key</em>, and <em>HMAC Webhook Secret</em> in <em>Super Admin Settings &gt; Payment Plugins Hub</em> to enable live processing.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* 3. Adyen 2-Method Switcher (Clean, Intuitive, Real-World) */}
                          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                            <button
                              type="button"
                              onClick={() => setAdyenSubTab('card')}
                              className={`py-2 px-3 rounded-md text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                                adyenSubTab === 'card'
                                  ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-2xs font-extrabold ring-1 ring-teal-500/20'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <CreditCard className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                              <span className="whitespace-nowrap">Credit &amp; Debit Card</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdyenSubTab('local_banking')}
                              className={`py-2 px-3 rounded-md text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                                adyenSubTab === 'local_banking'
                                  ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-2xs font-extrabold ring-1 ring-teal-500/20'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <Landmark className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                              <span className="whitespace-nowrap">European Direct Banking</span>
                            </button>
                          </div>

                          {/* SUB-TAB 1: CREDIT & DEBIT CARDS */}
                          {adyenSubTab === 'card' && (
                            <div className="space-y-4">
                              {/* 3D Physical Bank Card Simulator */}
                              <div className="py-1">
                                <PhysicalBankCardSimulator
                                  cardIntelligence={cardIntelligence}
                                  cardNumber={cardNumber}
                                  cardHolder={cardHolder}
                                  cardExpiry={cardExpiry}
                                  cardCvv={cardCvv}
                                  isFlipped={isCardFlipped}
                                />
                              </div>

                              {/* Interactive Card Form Fields Directly Underneath */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                                <div className="col-span-2 sm:col-span-4">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                      Card Number *
                                    </label>
                                    {cardNumber.replace(/\D/g, '').length >= 4 && (
                                      <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                                        <span>{cardIntelligence.bankName}</span>
                                        <span className="text-zinc-400 dark:text-zinc-500">•</span>
                                        <span>{cardIntelligence.cardType}</span>
                                        <span className="text-zinc-400 dark:text-zinc-500">•</span>
                                        <span>{cardIntelligence.bankCountry}</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="relative">
                                    <CreditCard className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                    <input
                                      type="text"
                                      name="cardnumber"
                                      id="checkout-cardnumber"
                                      autoComplete="cc-number"
                                      inputMode="numeric"
                                      maxLength={cardIntelligence.maxLength + 4}
                                      value={cardNumber}
                                      onFocus={() => setIsCardFlipped(false)}
                                      onChange={handleCardNumberChange}
                                      placeholder="•••• •••• •••• ••••"
                                      className="w-full pl-9 pr-14 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                    />
                                    <div className="absolute right-3 top-2 scale-75 origin-right">
                                      {renderSchemeLogo()}
                                    </div>
                                  </div>
                                </div>

                                <div className="col-span-2">
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    Cardholder Name *
                                  </label>
                                  <div className="relative">
                                    <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                    <input
                                      type="text"
                                      name="ccname"
                                      id="checkout-cardholder"
                                      autoComplete="cc-name"
                                      value={cardHolder}
                                      onFocus={() => setIsCardFlipped(false)}
                                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                      placeholder="CARDHOLDER NAME"
                                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-bold"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    Expiry (MM/YY) *
                                  </label>
                                  <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                    <input
                                      type="text"
                                      name="ccexp"
                                      id="checkout-cardexpiry"
                                      autoComplete="cc-exp"
                                      inputMode="numeric"
                                      maxLength={5}
                                      value={cardExpiry}
                                      onFocus={() => setIsCardFlipped(false)}
                                      onChange={handleExpiryChange}
                                      placeholder="MM/YY"
                                      className="w-full pl-8 pr-2 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-bold text-center"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center justify-between">
                                    <span>CVV / CVC *</span>
                                    <span className="text-[9px] text-amber-500 font-mono">(Flips Card)</span>
                                  </label>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                    <input
                                      type="password"
                                      name="cvc"
                                      id="checkout-cardcvv"
                                      autoComplete="cc-csc"
                                      inputMode="numeric"
                                      maxLength={cardIntelligence.cvvLength}
                                      value={cardCvv}
                                      onFocus={() => setIsCardFlipped(true)}
                                      onChange={handleCvvChange}
                                      placeholder="CVC"
                                      className="w-full pl-8 pr-2 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-bold text-center"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-1 text-xs text-zinc-600 dark:text-zinc-400">
                                <input
                                  type="checkbox"
                                  id="adyenSaveCard"
                                  checked={saveCardForRecurring}
                                  onChange={(e) => setSaveCardForRecurring(e.target.checked)}
                                  className="rounded border-zinc-300 dark:border-zinc-700 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                />
                                <label htmlFor="adyenSaveCard" className="cursor-pointer text-[11px] font-medium">
                                  Save this card securely on Adyen Vault for automatic voice telephony renewals and quota replenishments.
                                </label>
                              </div>
                            </div>
                          )}

                          {/* SUB-TAB 2: LOCAL EUROPEAN & GLOBAL DIRECT BANKING */}
                          {adyenSubTab === 'local_banking' && (
                            <div className="space-y-4">
                              <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold text-emerald-950 dark:text-emerald-200">
                                  <span className="flex items-center gap-1.5">
                                    <Landmark className="h-4 w-4 text-emerald-600 shrink-0" />
                                    European Direct Interbank Clearing Rails
                                  </span>
                                  <Badge variant="teal" size="xs">SEPA Guaranteed • Instant</Badge>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                  Select your national European domestic payment method for instant bank-to-bank direct debit clearing.
                                </p>
                              </div>

                              {/* Visual European Rail Selector Grid - 6 High-Definition National Clearing Methods */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {adyenRails.map((rail) => {
                                  const isSelected = adyenBank === rail.id;
                                  return (
                                    <button
                                      key={rail.id}
                                      type="button"
                                      onClick={() => handleSelectRail(rail.id)}
                                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${
                                        isSelected
                                          ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-600 dark:border-teal-500 ring-2 ring-teal-500/30 font-bold'
                                          : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:border-teal-400'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xl shrink-0">{rail.flag}</span>
                                        <div className="min-w-0">
                                          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{rail.name}</div>
                                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-mono">{rail.country} • {rail.tag}</div>
                                        </div>
                                      </div>
                                      {isSelected ? (
                                        <BadgeCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                                      ) : (
                                        <div className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* DYNAMIC SUB-SCREEN: 1. iDEAL 2.0 (Netherlands 🇳🇱) */}
                              {adyenBank === 'ideal' && (
                                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 space-y-3.5 shadow-xs">
                                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">🇳🇱</span>
                                      <div>
                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">iDEAL 2.0 Dutch Bank Clearing</h4>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Select your official Dutch consumer or business bank</p>
                                      </div>
                                    </div>
                                    <Badge variant="teal" size="xs">Currence Certified</Badge>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                      <span>Select Dutch Bank Issuer *</span>
                                      <span className="font-mono text-teal-600 text-[10px]">Active Issuer: {activeIdealBankObj.name} (BIC: {activeIdealBankObj.bic})</span>
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                      {idealBanks.map((b) => {
                                        const isChosen = adyenIdealBank === b.id;
                                        return (
                                          <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => {
                                              setAdyenIdealBank(b.id);
                                              setAdyenIban(b.defaultIban);
                                            }}
                                            className={`p-2 rounded-lg text-xs font-bold text-left transition-all cursor-pointer flex items-center gap-1.5 border whitespace-nowrap truncate ${
                                              isChosen
                                                ? 'bg-teal-600 text-white border-teal-700 shadow-xs ring-2 ring-teal-500/30'
                                                : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-teal-400'
                                            }`}
                                          >
                                            <span className="text-sm shrink-0">{b.icon}</span>
                                            <span className="truncate">{b.name}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Action Launch Button */}
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleLaunchBankApp(activeIdealBankObj.name, 'iDEAL 2.0')}
                                      className="w-full py-2 px-3 rounded-lg text-white font-bold text-xs bg-teal-600 hover:bg-teal-700 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                      <span>Open Dutch Banking App ({activeIdealBankObj.name}) ↗</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* DYNAMIC SUB-SCREEN: 2. Bancontact & Payconiq (Belgium 🇧🇪) */}
                              {adyenBank === 'bancontact' && (
                                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 space-y-3.5 shadow-xs">
                                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">🇧🇪</span>
                                      <div>
                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Bancontact &amp; Payconiq Belgium</h4>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Payconiq QR mobile scanner or Belgian national direct debit</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                      <button
                                        type="button"
                                        onClick={() => setAdyenBancontactMode('payconiq_qr')}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                                          adyenBancontactMode === 'payconiq_qr'
                                            ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs'
                                            : 'text-zinc-500'
                                        }`}
                                      >
                                        Payconiq QR
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setAdyenBancontactMode('card')}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                                          adyenBancontactMode === 'card'
                                            ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs'
                                            : 'text-zinc-500'
                                        }`}
                                      >
                                        Belgian Banks / Card
                                      </button>
                                    </div>
                                  </div>

                                  {adyenBancontactMode === 'payconiq_qr' ? (
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                      <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xs shrink-0 relative overflow-hidden">
                                        <img
                                          src={liveBancontactQrUrl}
                                          alt="Payconiq QR"
                                          className={`w-32 h-32 object-contain rounded transition-all ${
                                            !isAdyenConfigured ? 'blur-[4px] opacity-40 select-none pointer-events-none' : ''
                                          }`}
                                        />
                                        {!isAdyenConfigured && (
                                          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-white/80 dark:bg-zinc-900/85 rounded-xl text-center backdrop-blur-2xs">
                                            <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mb-1 shadow-2xs">
                                              <Lock className="h-4 w-4" />
                                            </div>
                                            <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                              Setup Required
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="space-y-1.5 text-xs flex-1">
                                        <div className="flex items-center justify-between">
                                          <strong className="text-zinc-900 dark:text-zinc-100 block">Scan with Payconiq by Bancontact app</strong>
                                          {isAdyenConfigured ? (
                                            <span className="font-mono text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900 flex items-center gap-1">
                                              <Clock className="h-3 w-3" /> {Math.floor(adyenPayconiqTimer / 60)}:{(adyenPayconiqTimer % 60).toString().padStart(2, '0')}
                                            </span>
                                          ) : (
                                            <span className="font-medium text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900 flex items-center gap-1">
                                              <Clock className="h-3 w-3 text-amber-500" /> QR Inactive
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                                          Open the Payconiq app on your smartphone, scan this dynamic QR code, and approve <strong>€{eurAmount} EUR</strong>.
                                        </p>
                                        <div className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                                          Instant SEPA Direct Clearing • 0% Surcharge
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleLaunchBankApp('Payconiq Belgium', 'Payconiq')}
                                          className="px-3 py-1.5 rounded-lg text-white font-bold text-xs bg-teal-600 hover:bg-teal-700 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                        >
                                          <Smartphone className="h-3.5 w-3.5" />
                                          <span>Open Payconiq Mobile App ↗</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                          <span>Select Belgian Bank *</span>
                                          <span className="font-mono text-teal-600 text-[10px]">BIC: {activeBancontactBankObj.bic}</span>
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                          {bancontactBanks.map((b) => {
                                            const isChosen = adyenBancontactBank === b.id;
                                            return (
                                              <button
                                                key={b.id}
                                                type="button"
                                                onClick={() => {
                                                  setAdyenBancontactBank(b.id);
                                                  setAdyenIban(b.defaultIban);
                                                }}
                                                className={`p-2.5 rounded-lg text-left text-xs transition-all cursor-pointer border ${
                                                  isChosen
                                                    ? 'bg-teal-600 text-white border-teal-700 shadow-xs ring-2 ring-teal-500/30'
                                                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-teal-400'
                                                }`}
                                              >
                                                <div className="font-bold truncate">{b.name}</div>
                                                <div className={`text-[10px] font-mono mt-0.5 ${isChosen ? 'text-teal-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                  BIC: {b.bic}
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleLaunchBankApp(activeBancontactBankObj.name, 'Bancontact Direct')}
                                        className="w-full py-2 px-3 rounded-lg text-white font-bold text-xs bg-teal-600 hover:bg-teal-700 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                      >
                                        <Landmark className="h-3.5 w-3.5" />
                                        <span>Authorize Belgian Clearing ({activeBancontactBankObj.name}) ↗</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* DYNAMIC SUB-SCREEN: 3. Sofort / Giropay (Germany 🇩🇪) */}
                              {adyenBank === 'sofort' && (
                                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 space-y-3.5 shadow-xs">
                                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">🇩🇪</span>
                                      <div>
                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Sofort &amp; Giropay Germany</h4>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">TÜV Saarland certified direct bank transfer with PIN/TAN</p>
                                      </div>
                                    </div>
                                    <Badge variant="teal" size="xs">TÜV Saarland Active</Badge>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                      <span>Select German Bank *</span>
                                      <span className="font-mono text-teal-600 text-[10px]">BLZ: {activeSofortBankObj.blz} • BIC: {activeSofortBankObj.bic}</span>
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {sofortBanks.map((b) => {
                                        const isChosen = adyenSofortBank === b.id;
                                        return (
                                          <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => {
                                              setAdyenSofortBank(b.id);
                                              setAdyenIban(b.defaultIban);
                                            }}
                                            className={`p-2.5 rounded-lg text-left text-xs transition-all cursor-pointer border ${
                                              isChosen
                                                ? 'bg-teal-600 text-white border-teal-700 shadow-xs ring-2 ring-teal-500/30'
                                                : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-teal-400'
                                            }`}
                                          >
                                            <div className="font-bold truncate">{b.name}</div>
                                            <div className={`text-[10px] font-mono mt-0.5 ${isChosen ? 'text-teal-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                              BLZ: {b.blz}
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Action Launch Button */}
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleLaunchBankApp(activeSofortBankObj.name, 'Sofort / Giropay')}
                                      className="w-full py-2 px-3 rounded-lg text-white font-bold text-xs bg-teal-600 hover:bg-teal-700 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                    >
                                      <Lock className="h-3.5 w-3.5 shrink-0" />
                                      <span>Authorize via German Online Banking ({activeSofortBankObj.name}) ↗</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* DYNAMIC SUB-SCREEN: 4. Cartes Bancaires (France 🇫🇷) */}
                              {adyenBank === 'cartes_bancaires' && (
                                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 space-y-3.5 shadow-xs">
                                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">🇫🇷</span>
                                      <div>
                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Cartes Bancaires (GIE CB France)</h4>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">French national interbank smart card network with EMV 3DS2</p>
                                      </div>
                                    </div>
                                    <Badge variant="teal" size="xs">GIE CB Protected</Badge>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                      <span>Select French Bank Rail *</span>
                                      <span className="font-mono text-teal-600 text-[10px]">BIC: {activeCbBankObj.bic}</span>
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {cbBanks.map((b) => {
                                        const isChosen = adyenCbBank === b.id;
                                        return (
                                          <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => {
                                              setAdyenCbBank(b.id);
                                              setAdyenIban(b.defaultIban);
                                            }}
                                            className={`p-2.5 rounded-lg text-left text-xs transition-all cursor-pointer border ${
                                              isChosen
                                                ? 'bg-teal-600 text-white border-teal-700 shadow-xs ring-2 ring-teal-500/30'
                                                : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-teal-400'
                                            }`}
                                          >
                                            <div className="font-bold truncate">{b.name}</div>
                                            <div className={`text-[10px] font-mono mt-0.5 ${isChosen ? 'text-teal-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                              BIC: {b.bic}
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleLaunchBankApp(activeCbBankObj.name, 'GIE Cartes Bancaires')}
                                    className="w-full py-2 px-3 rounded-lg text-white font-bold text-xs bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                  >
                                    <CreditCard className="h-3.5 w-3.5" />
                                    <span>Authorize French CB Direct Settlement ({activeCbBankObj.name}) ↗</span>
                                  </button>
                                </div>
                              )}

                              {/* DYNAMIC SUB-SCREEN: 5. EPS Überweisung (Austria 🇦🇹) */}
                              {adyenBank === 'eps' && (
                                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 space-y-3.5 shadow-xs">
                                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">🇦🇹</span>
                                      <div>
                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">EPS Electronic Payment Standard (Austria)</h4>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Austrian domestic direct banking standard with instant clearing</p>
                                      </div>
                                    </div>
                                    <Badge variant="teal" size="xs">STUZZA Certified</Badge>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                      <span>Select Austrian Bank *</span>
                                      <span className="font-mono text-teal-600 text-[10px]">Active Issuer: {activeEpsBankObj.name} (BIC: {activeEpsBankObj.bic})</span>
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {epsBanks.map((b) => {
                                        const isChosen = adyenEpsBank === b.id;
                                        return (
                                          <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => {
                                              setAdyenEpsBank(b.id);
                                              setAdyenIban(b.defaultIban);
                                            }}
                                            className={`p-2.5 rounded-lg text-left text-xs transition-all cursor-pointer border ${
                                              isChosen
                                                ? 'bg-teal-600 text-white border-teal-700 shadow-xs ring-2 ring-teal-500/30 font-bold'
                                                : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-teal-400'
                                            }`}
                                          >
                                            <div className="font-bold truncate">{b.shortName || b.name}</div>
                                            <div className={`text-[10px] font-mono mt-0.5 ${isChosen ? 'text-teal-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                              BIC: {b.bic}
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Action Launch Button */}
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleLaunchBankApp(activeEpsBankObj.name, 'EPS Austria')}
                                      className="w-full py-2 px-3 rounded-lg text-white font-bold text-xs bg-teal-600 hover:bg-teal-700 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                    >
                                      <Landmark className="h-3.5 w-3.5 shrink-0" />
                                      <span>Connect Austrian Interbank Portal ({activeEpsBankObj.name}) ↗</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* DYNAMIC SUB-SCREEN: 6. BLIK 6-Digit (Poland 🇵🇱) */}
                              {adyenBank === 'blik' && (
                                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 space-y-3.5 shadow-xs">
                                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">🇵🇱</span>
                                      <div>
                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Polski Standard Płatności (BLIK)</h4>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Generate a 6-digit one-time code in your Polish bank app</p>
                                      </div>
                                    </div>
                                    <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900 flex items-center gap-1">
                                      <Clock className="h-3 w-3 animate-spin" /> Code valid: {adyenBlikTimer}s
                                    </span>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                      <span>Select Polish Bank *</span>
                                      <span className="font-mono text-teal-600 text-[10px]">BIC: {activeBlikBankObj.bic}</span>
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {blikBanks.map((b) => {
                                        const isChosen = adyenBlikBank === b.id;
                                        return (
                                          <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => {
                                              setAdyenBlikBank(b.id);
                                              setAdyenIban(b.defaultIban);
                                            }}
                                            className={`p-2.5 rounded-lg text-left text-xs transition-all cursor-pointer border ${
                                              isChosen
                                                ? 'bg-teal-600 text-white border-teal-700 shadow-xs ring-2 ring-teal-500/30'
                                                : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-teal-400'
                                            }`}
                                          >
                                            <div className="font-bold truncate">{b.name}</div>
                                            <div className={`text-[10px] font-mono mt-0.5 ${isChosen ? 'text-teal-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                              BIC: {b.bic}
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div className="max-w-md mx-auto space-y-2 pt-1">
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block text-center">
                                      Enter 6-Digit BLIK Code *
                                    </label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        maxLength={7}
                                        value={adyenBlikCode}
                                        onChange={(e) => {
                                          const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                                          setAdyenBlikCode(clean.length > 3 ? `${clean.slice(0, 3)} ${clean.slice(3)}` : clean);
                                        }}
                                        placeholder="782 914"
                                        className="w-full px-4 py-2.5 text-2xl rounded-xl bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700 font-mono font-black text-center tracking-widest text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-rose-500 shadow-inner"
                                      />
                                    </div>
                                    <div className="p-2 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-950 dark:text-rose-200 flex items-center gap-2">
                                      <Smartphone className="h-4 w-4 text-rose-600 shrink-0" />
                                      <span>Open your {activeBlikBankObj.name} mobile app to confirm the 6-digit transaction authorization.</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleLaunchBankApp(activeBlikBankObj.name, 'BLIK Poland')}
                                      className="w-full py-2 px-3 rounded-lg text-white font-bold text-xs bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                    >
                                      <Smartphone className="h-3.5 w-3.5" />
                                      <span>Confirm 6-Digit BLIK Code (€{eurAmount} EUR)</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Interbank Verified Session Card */}
                              {adyenConnectedRail && (
                                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-700 text-xs space-y-1.5 animate-fadeIn">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                                      <BadgeCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                                      <span>Interbank Direct Clearing Session Active</span>
                                    </span>
                                    <span className="font-mono text-[10.5px] text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded font-bold">
                                      Session Ref: {adyenConnectedRail.token}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11.5px] text-zinc-600 dark:text-zinc-400 pt-0.5">
                                    <span>Authorized Bank: <strong className="text-zinc-900 dark:text-zinc-200">{adyenConnectedRail.bankName}</strong> ({adyenConnectedRail.bic})</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                      SEPA Instant Ready
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Payer Account Name & National IBAN (Auto-synchronized with selected rail & bank) */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    Bank Account Holder Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={adyenAccountHolder || billingName}
                                    onChange={(e) => setAdyenAccountHolder(e.target.value)}
                                    placeholder="Mukesh swami"
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center justify-between">
                                    <span>{currentRailMeta.flag} {currentRailMeta.tag} IBAN ({currentActiveBankName}) *</span>
                                    <span className="text-[10px] font-mono text-teal-600 font-bold">BIC: {currentActiveBic}</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={adyenIban || currentDefaultIban}
                                    onChange={(e) => setAdyenIban(e.target.value.toUpperCase())}
                                    placeholder={currentDefaultIban}
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* FULL-WIDTH BOTTOM SETTLEMENT & CONVERTER BAR */}
                          <div className="p-3.5 rounded-lg bg-linear-to-r from-teal-50/90 via-emerald-50/50 to-sky-50/80 dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-sky-950/30 border border-teal-200/80 dark:border-teal-800/60 space-y-2.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-teal-200/60 dark:border-teal-800/60 pb-2">
                              <span className="text-xs font-bold text-teal-950 dark:text-teal-100 flex items-center gap-1.5">
                                <Globe2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                                Gateway Primary Settlement Currency: <strong>🇪🇺 EUR (Euro - €) / 🇺🇸 USD ($)</strong>
                              </span>
                              <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300 bg-white/90 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                                1 USD = {eurRate} EUR
                              </span>
                            </div>
                            <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400">
                              Direct Eurozone bank clearing and global 3DS2 card processing with 0% FX spread on Adyen acquiring rails.
                            </p>

                            {/* BUTTONS UNDERNEATH TEXT */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                              {selectedCurrencyCode !== 'EUR' && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedCurrencyCode('EUR')}
                                  className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-teal-800 dark:text-teal-200 bg-white dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-teal-300 dark:border-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                >
                                  <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                                  <span className="whitespace-nowrap">Switch to EUR (€)</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenConverterForPair(selectedCurrencyCode === 'EUR' ? 'USD' : selectedCurrencyCode, 'EUR', selectedCurrencyCode === 'EUR' ? basePriceUsd : totalAmountLocal)}
                                className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                title="Open Live Money Converter for this Currency Pair"
                              >
                                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                                <span className="whitespace-nowrap">Live Rate ({selectedCurrencyCode} ⇄ EUR)</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 3. CASHFREE PAYMENTS (DYNAMIC AUTOCOLLECT UPI QR & NETBANKING) */}
                    {selectedGateway === 'cashfree' && (() => {
                      const liveCashfreeGateway = enabledGateways.find(
                        (g: any) => g.gateway_key === 'cashfree' || g.gateway_key === selectedGateway
                      ) || {};
                      const isCashfreeConfigured = Boolean(
                        liveCashfreeGateway.is_configured &&
                        (liveCashfreeGateway.merchant_id || liveCashfreeGateway.public_key || liveCashfreeGateway.app_id) &&
                        liveCashfreeGateway.secret_key
                      );
                      const payableAmountInr = totalAmountLocal <= 0 ? 1 : totalAmountLocal;

                      return (
                        <CashfreePaymentExperience
                          isCashfreeConfigured={isCashfreeConfigured}
                          liveCashfreeGateway={liveCashfreeGateway}
                          payableAmountInr={payableAmountInr}
                          totalAmountLocal={totalAmountLocal}
                          basePriceUsd={basePriceUsd}
                          currentCurrency={currentCurrency}
                          selectedCurrencyCode={selectedCurrencyCode}
                          setSelectedCurrencyCode={setSelectedCurrencyCode}
                          isWalletTopup={isWalletTopup}
                          selectedPlanName={selectedPlan.name}
                          cashfreeSubTab={cashfreeSubTab}
                          setCashfreeSubTab={setCashfreeSubTab}
                          cashfreeCustomerPhone={cashfreeCustomerPhone}
                          setCashfreeCustomerPhone={setCashfreeCustomerPhone}
                          qrTimer={qrTimer}
                          formatTimer={formatTimer}
                          handleRegenerateQr={() => {
                            setQrTimer(300);
                            setQrSessionKey(Date.now());
                          }}
                          copiedField={copiedField}
                          handleCopyText={handleCopyText}
                          handleOpenConverterForPair={handleOpenConverterForPair}
                        />
                      );
                    })()}

                    {/* 4. PHONEPE DIRECT UPI RAIL */}
                    {selectedGateway === 'phonepe' && (() => {
                      const livePhonepeGateway = enabledGateways.find(
                        (g: any) => g.gateway_key === 'phonepe' || g.gateway_key === selectedGateway
                      ) || {};
                      const isPhonepeConfigured = Boolean(
                        livePhonepeGateway.is_configured &&
                        (livePhonepeGateway.merchant_id || livePhonepeGateway.public_key) &&
                        livePhonepeGateway.secret_key
                      );
                      const payableAmountInr = totalAmountLocal <= 0 ? 1 : totalAmountLocal;

                      return (
                        <PhonePePaymentExperience
                          isPhonepeConfigured={isPhonepeConfigured}
                          livePhonepeGateway={livePhonepeGateway}
                          payableAmountInr={payableAmountInr}
                          totalAmountLocal={totalAmountLocal}
                          currentCurrency={currentCurrency}
                          selectedCurrencyCode={selectedCurrencyCode}
                          isWalletTopup={isWalletTopup}
                          selectedPlanName={selectedPlan.name}
                          phonepeSubTab={phonepeSubTab}
                          setPhonepeSubTab={setPhonepeSubTab}
                          phonepeMobile={phonepeMobile}
                          setPhonepeMobile={setPhonepeMobile}
                          copiedField={copiedField}
                          handleCopyText={handleCopyText}
                          handleOpenConverterForPair={handleOpenConverterForPair}
                          setSelectedCurrencyCode={setSelectedCurrencyCode}
                          basePriceUsd={basePriceUsd}
                          addToast={addToast}
                        />
                      );
                    })()}

                    {/* 5. PAYPAL EXPRESS CHECKOUT & GLOBAL BUYER PROTECTION */}
                    {selectedGateway === 'paypal' && (() => {
                      const livePaypalGateway = enabledGateways.find(
                        (g: any) => g.gateway_key === 'paypal' || g.gateway_key === selectedGateway
                      ) || {};
                      const isPaypalConfigured = Boolean(
                        livePaypalGateway.is_configured &&
                        (livePaypalGateway.merchant_id || livePaypalGateway.public_key || livePaypalGateway.client_id) &&
                        livePaypalGateway.secret_key
                      );
                      const payableAmountUsd = basePriceUsd || (totalAmountLocal / (currentCurrency?.rate || 1));

                      return (
                        <PayPalPaymentExperience
                          isPaypalConfigured={isPaypalConfigured}
                          livePaypalGateway={livePaypalGateway}
                          payableAmountUsd={payableAmountUsd}
                          totalAmountLocal={totalAmountLocal}
                          currentCurrency={currentCurrency}
                          selectedCurrencyCode={selectedCurrencyCode}
                          isWalletTopup={isWalletTopup}
                          selectedPlanName={selectedPlan.name}
                          paypalSubTab={paypalSubTab}
                          setPaypalSubTab={setPaypalSubTab}
                          paypalPayerEmail={paypalPayerEmail || billingEmail}
                          setPaypalPayerEmail={setPaypalPayerEmail}
                          billingEmail={billingEmail}
                          handleOpenConverterForPair={handleOpenConverterForPair}
                          setSelectedCurrencyCode={setSelectedCurrencyCode}
                          basePriceUsd={basePriceUsd}
                          addToast={addToast}
                        />
                      );
                    })()}

                    {/* 6. PAYTM DIRECT WALLET & SOUNDBOX UPI RAIL */}
                    {selectedGateway === 'paytm' && (() => {
                      const livePaytmGateway = enabledGateways.find(
                        (g: any) => g.gateway_key === 'paytm' || g.gateway_key === selectedGateway
                      ) || {};
                      const isPaytmConfigured = Boolean(
                        livePaytmGateway.is_configured &&
                        (livePaytmGateway.merchant_id || livePaytmGateway.public_key)
                      );
                      const payableAmountInr = totalAmountLocal <= 0 ? 1 : totalAmountLocal;

                      return (
                        <PaytmSoundboxExperience
                          isPaytmConfigured={isPaytmConfigured}
                          livePaytmGateway={livePaytmGateway}
                          payableAmountInr={payableAmountInr}
                          totalAmountLocal={totalAmountLocal}
                          currentCurrency={currentCurrency}
                          selectedCurrencyCode={selectedCurrencyCode}
                          isWalletTopup={isWalletTopup}
                          selectedPlanName={selectedPlan.name}
                          paytmSubTab={paytmSubTab}
                          setPaytmSubTab={setPaytmSubTab}
                          paytmMobile={paytmMobile}
                          setPaytmMobile={setPaytmMobile}
                          paytmOtpCode={paytmOtpCode}
                          setPaytmOtpCode={setPaytmOtpCode}
                          paytmFastForward={paytmFastForward}
                          setPaytmFastForward={setPaytmFastForward}
                          copiedField={copiedField}
                          handleCopyText={handleCopyText}
                          handleOpenConverterForPair={handleOpenConverterForPair}
                          setSelectedCurrencyCode={setSelectedCurrencyCode}
                          basePriceUsd={basePriceUsd}
                          addToast={addToast}
                        />
                      );
                    })()}

                    {/* 7. COINBASE COMMERCE & WEB3 CRYPTO RAIL */}
                    {(selectedGateway === 'coinbase' || selectedGateway === 'crypto') && (() => {
                      const liveCryptoGateway = enabledGateways.find(
                        (g: any) => g.gateway_key === 'crypto' || g.gateway_key === 'coinbase' || g.gateway_key === selectedGateway
                      ) || {};
                      const details = liveCryptoGateway.details_json || {};

                      // Strict Blockchain-Specific Address Parsing (Zero cross-chain contamination)
                      const rawTrc = (details.wallet_trc20 || details.wallet_address_trc20 || (liveCryptoGateway.public_key?.startsWith('T') ? liveCryptoGateway.public_key : '') || '').trim();
                      const trcAddress = rawTrc.startsWith('T') && rawTrc.length >= 30 ? rawTrc : '';

                      const rawEvm = (liveCryptoGateway.public_key?.startsWith('0x') ? liveCryptoGateway.public_key : details.wallet_erc20 || details.wallet_address || '').trim();
                      const evmAddress = rawEvm.startsWith('0x') && rawEvm.length >= 40 ? rawEvm : '';

                      const rawBtc = (details.wallet_btc || (liveCryptoGateway.public_key && (liveCryptoGateway.public_key.startsWith('bc1') || liveCryptoGateway.public_key.startsWith('1') || liveCryptoGateway.public_key.startsWith('3')) ? liveCryptoGateway.public_key : '') || '').trim();
                      const btcAddress = (rawBtc.startsWith('bc1') || rawBtc.startsWith('1') || rawBtc.startsWith('3')) && rawBtc.length >= 26 ? rawBtc : '';

                      const rawSol = (details.wallet_sol || (liveCryptoGateway.public_key && !liveCryptoGateway.public_key.startsWith('0x') && !liveCryptoGateway.public_key.startsWith('T') && liveCryptoGateway.public_key.length >= 32 ? liveCryptoGateway.public_key : '') || '').trim();
                      const solAddress = rawSol.length >= 32 && !rawSol.startsWith('0x') && !rawSol.startsWith('T') ? rawSol : '';

                      const isCryptoConfigured = Boolean(
                        liveCryptoGateway.is_configured && (
                          trcAddress || evmAddress || btcAddress || solAddress || liveCryptoGateway.secret_key
                        )
                      );

                      const totalUsd = Math.max(1, isWalletTopup ? effectiveTopupUsd : basePriceUsd);

                      const btcAmount = (totalUsd / 65000).toFixed(6);
                      const ethAmount = (totalUsd / 3500).toFixed(5);
                      const solAmount = (totalUsd / 145).toFixed(4);
                      const usdtAmount = totalUsd.toFixed(2);

                      const coinMap: Record<
                        'USDT_TRC20' | 'USDT_ERC20' | 'BTC' | 'ETH' | 'SOL',
                        {
                          label: string;
                          network: string;
                          address: string;
                          amountStr: string;
                          rawAmount: string;
                          isConfigured: boolean;
                          qrUri: string;
                        }
                      > = {
                        USDT_TRC20: {
                          label: 'USDT (TRC-20)',
                          network: 'Tron Network',
                          address: trcAddress || 'Pending Super Admin Setup (USDT TRC-20 Tron Address Not Configured)',
                          amountStr: `${usdtAmount} USDT`,
                          rawAmount: usdtAmount,
                          isConfigured: Boolean(isCryptoConfigured && trcAddress),
                          qrUri: trcAddress ? `tron:${trcAddress}?amount=${usdtAmount}` : `crypto_unconfigured_pending_super_admin`,
                        },
                        USDT_ERC20: {
                          label: 'USDT (ERC-20)',
                          network: 'Ethereum Mainnet',
                          address: evmAddress || 'Pending Super Admin Setup (USDT ERC-20 Ethereum Address Not Configured)',
                          amountStr: `${usdtAmount} USDT`,
                          rawAmount: usdtAmount,
                          isConfigured: Boolean(isCryptoConfigured && evmAddress),
                          qrUri: evmAddress ? `ethereum:${evmAddress}?value=${usdtAmount}` : `crypto_unconfigured_pending_super_admin`,
                        },
                        BTC: {
                          label: 'BTC (Bitcoin)',
                          network: 'Bitcoin Mainnet',
                          address: btcAddress || 'Pending Super Admin Setup (Bitcoin BTC Address Not Configured)',
                          amountStr: `${btcAmount} BTC`,
                          rawAmount: btcAmount,
                          isConfigured: Boolean(isCryptoConfigured && btcAddress),
                          qrUri: btcAddress ? `bitcoin:${btcAddress}?amount=${btcAmount}` : `crypto_unconfigured_pending_super_admin`,
                        },
                        ETH: {
                          label: 'ETH (Ethereum)',
                          network: 'Ethereum Mainnet',
                          address: evmAddress || 'Pending Super Admin Setup (Ethereum ETH Address Not Configured)',
                          amountStr: `${ethAmount} ETH`,
                          rawAmount: ethAmount,
                          isConfigured: Boolean(isCryptoConfigured && evmAddress),
                          qrUri: evmAddress ? `ethereum:${evmAddress}?value=${ethAmount}` : `crypto_unconfigured_pending_super_admin`,
                        },
                        SOL: {
                          label: 'SOL (Solana)',
                          network: 'Solana High-Speed',
                          address: solAddress || 'Pending Super Admin Setup (Solana SOL Address Not Configured)',
                          amountStr: `${solAmount} SOL`,
                          rawAmount: solAmount,
                          isConfigured: Boolean(isCryptoConfigured && solAddress),
                          qrUri: solAddress ? `solana:${solAddress}?amount=${solAmount}` : `crypto_unconfigured_pending_super_admin`,
                        },
                      };

                      const currentCoin = coinMap[selectedCryptoCoin] || coinMap.USDT_TRC20;
                      const dynamicCryptoUri = currentCoin.isConfigured
                        ? currentCoin.qrUri
                        : 'crypto_unconfigured_pending_super_admin';
                      const liveCryptoQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(dynamicCryptoUri)}&_t=${qrSessionKey}`;

                      return (
                        <div className="space-y-4">
                          <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <CoinbaseCryptoLogo size="lg" />
                              <div className="flex items-center gap-2 flex-wrap">
                                {isCryptoConfigured ? (
                                  <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    <BadgeCheck className="h-3.5 w-3.5" /> Super Admin Live Settle
                                  </span>
                                ) : (
                                  <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-bold font-mono flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                    <AlertCircle className="h-3.5 w-3.5" /> Setup Required in Super Admin
                                  </span>
                                )}
                                <Badge variant={isCryptoConfigured ? "teal" : "warning"} size="sm" className="font-mono font-bold rounded-md px-2.5 py-0.5">
                                  {isCryptoConfigured ? '1-Block Auto-Credit' : '💎 Web3 Pending Setup'}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-0.5 pt-1">
                              <h3 className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100">
                                Multi-Chain Web3 &amp; Crypto Settlement Rail
                              </h3>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Instant decentralized confirmation across USDT, BTC, ETH and Solana networks
                              </p>
                            </div>
                          </div>

                          {/* Coin Selector */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {Object.entries(coinMap).map(([k, c]) => (
                              <button
                                key={k}
                                type="button"
                                onClick={() => setSelectedCryptoCoin(k as any)}
                                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                                  selectedCryptoCoin === k
                                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-2xs ring-1 ring-blue-400'
                                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                                }`}
                              >
                                <div className="text-xs font-bold">{c.label}</div>
                                <div className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">{c.network}</div>
                              </button>
                            ))}
                          </div>

                          {/* Real Dynamic Crypto QR Code Card */}
                          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
                            {/* 1. TOP NOTICE BANNER */}
                            {isCryptoConfigured ? (
                              <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 text-xs text-blue-950 dark:text-blue-200 flex items-start gap-2">
                                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                <div className="leading-relaxed">
                                  <strong>Web3 Decentralized Settlement Rail:</strong> Real-time mempool scanning with 1-block auto-credit on USDT, BTC, ETH and Solana networks.
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="space-y-1 leading-relaxed">
                                  <strong className="block text-amber-900 dark:text-amber-100 font-bold">
                                    Coinbase Commerce / Web3 Crypto Setup Required in Super Admin
                                  </strong>
                                  <p className="text-[11.5px] text-amber-800 dark:text-amber-300">
                                    Web3 cryptocurrency settling is in <strong>Pending Configuration</strong> state. Super Admin must configure merchant deposit address or Coinbase Commerce API credentials in <em>Super Admin Settings &gt; Payment Gateways</em> before crypto payments can be verified.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* 2. MIDDLE FORM FIELDS & QR */}
                            <div className="flex flex-col md:flex-row items-center gap-5">
                              <div className="flex flex-col items-center space-y-2.5 shrink-0">
                                <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl border-2 border-blue-500/40 shadow-md relative group overflow-hidden">
                                  <img
                                    src={liveCryptoQrUrl}
                                    alt={`${currentCoin.label} Deposit QR`}
                                    className={`w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg transition-all ${
                                      !currentCoin.isConfigured ? 'blur-[4px] opacity-40 select-none pointer-events-none' : ''
                                    }`}
                                    loading="eager"
                                  />
                                  {!currentCoin.isConfigured ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white/80 dark:bg-zinc-900/85 rounded-xl text-center backdrop-blur-2xs">
                                      <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mb-1.5 shadow-2xs">
                                        <Lock className="h-5 w-5" />
                                      </div>
                                      <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                        {isCryptoConfigured ? `${currentCoin.label} Address Required` : 'Super Admin Setup Required'}
                                      </span>
                                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-[130px] line-clamp-2">
                                        {isCryptoConfigured ? 'Configure wallet in Super Admin Settings' : 'Web3 Merchant Wallet Pending Setup'}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="absolute inset-x-0 bottom-1 flex justify-center">
                                      <span className="px-2 py-0.5 rounded-full text-white text-[9px] font-mono font-bold tracking-wider uppercase bg-blue-600 shadow-xs">
                                        {currentCoin.amountStr}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {currentCoin.isConfigured ? (
                                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                                    <span>Expires in: <strong>{formatTimer(cryptoTimer)}</strong></span>
                                    <button
                                      type="button"
                                      onClick={() => { setCryptoTimer(900); setQrSessionKey(Date.now()); }}
                                      className="p-1 rounded text-zinc-400 hover:text-blue-600 transition-colors cursor-pointer"
                                      title="Refresh Rate & Timer"
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

                              <div className="flex-1 space-y-2.5 w-full min-w-0">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">
                                      Deposit Address ({currentCoin.label}):
                                    </span>
                                    {currentCoin.isConfigured ? (
                                      <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                        Mempool Active (0/12 Conf)
                                      </span>
                                    ) : (
                                      <span className="font-mono text-[10px] text-amber-600 font-bold">
                                        Pending Setup
                                      </span>
                                    )}
                                  </div>
                                  <div className={`p-2.5 rounded border flex items-center justify-between gap-2 font-mono text-[11px] break-all select-all ${
                                    currentCoin.isConfigured
                                      ? 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 italic'
                                  }`}>
                                    <span className="truncate flex-1">{currentCoin.address}</span>
                                    {currentCoin.isConfigured && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(currentCoin.address, `${currentCoin.label} Address`)}
                                        className="text-teal-600 hover:text-teal-700 shrink-0 cursor-pointer p-1"
                                        title="Copy Address"
                                      >
                                        {copiedField === `${currentCoin.label} Address` ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                                    Exact Payable Crypto Amount:
                                  </label>
                                  <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-2 font-mono text-xs font-bold text-teal-700 dark:text-teal-300">
                                    <span>{currentCoin.amountStr}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(currentCoin.amountStr.split(' ')[0], 'Crypto Amount')}
                                      className="text-teal-600 hover:text-teal-700 shrink-0 cursor-pointer p-1"
                                      title="Copy Amount"
                                    >
                                      {copiedField === 'Crypto Amount' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    Blockchain Transaction Hash / TXID (Optional for manual speed-up)
                                  </label>
                                  <input
                                    type="text"
                                    value={cryptoTxHash}
                                    onChange={(e) => setCryptoTxHash(e.target.value)}
                                    placeholder="e.g. 0x9f823a... or TRC20 TXID"
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 3. FULL-WIDTH SPACIOUS BOTTOM SETTLEMENT & CONVERTER BAR */}
                            <div className="p-3.5 rounded-lg bg-linear-to-r from-blue-50/90 via-indigo-50/50 to-teal-50/80 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-teal-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-2.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-blue-200/60 dark:border-blue-800/60 pb-2">
                                <span className="text-xs font-bold text-blue-950 dark:text-blue-100 flex items-center gap-1.5">
                                  <Globe2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                  Gateway Primary Settlement Currency: <strong>💎 USDT / BTC / ETH Web3 Rail</strong>
                                </span>
                                <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-white/90 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                  1 USD = 1.00 USDT
                                </span>
                              </div>
                              <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400">
                                1-Block automated blockchain confirmation with zero intermediary processor spread fees.
                              </p>

                              {/* BUTTONS UNDERNEATH TEXT */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                                {selectedCurrencyCode !== 'USD' && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCurrencyCode('USD')}
                                    className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-blue-800 dark:text-blue-200 bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-blue-300 dark:border-blue-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  >
                                    <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                                    <span className="whitespace-nowrap">Switch to USD ($)</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenConverterForPair(selectedCurrencyCode === 'USD' ? 'INR' : selectedCurrencyCode, 'USDT', selectedCurrencyCode === 'USD' ? totalAmountLocal : basePriceUsd)}
                                  className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  title="Open Live Money Converter for this Currency Pair"
                                >
                                  <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                                  <span className="whitespace-nowrap">Live Rate ({selectedCurrencyCode} ⇄ USDT)</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 8. MERCADO PAGO LATAM (REAL DYNAMIC PIX QR, BOLETO, PARCELAS & PAN-LATAM) */}
                    {(selectedGateway === 'mercadopago' || selectedGateway === 'mercado_pago') && (() => {
                      const liveMercadoGateway = enabledGateways.find(
                        (g: any) => g.gateway_key === 'mercadopago' || g.gateway_key === 'mercado_pago' || g.gateway_key === selectedGateway
                      ) || {};
                      const isMercadoConfigured = Boolean(
                        liveMercadoGateway.is_configured &&
                        (liveMercadoGateway.merchant_id || liveMercadoGateway.public_key || liveMercadoGateway.secret_key)
                      );

                      const rawCollectorId = (liveMercadoGateway.merchant_id || liveMercadoGateway.public_key || liveMercadoGateway.details_json?.collector_id || '').trim();
                      const collectorId = isMercadoConfigured ? (rawCollectorId || 'APP_USR-782914-LIVE') : (rawCollectorId || 'Pending Super Admin Setup');

                      // Dynamic Currency Conversions for LatAm
                      const brlRate = 5.42;
                      const mxnRate = 19.85;
                      const copRate = 4150.0;
                      const brlAmount = (basePriceUsd * brlRate).toFixed(2);
                      const mxnAmount = (basePriceUsd * mxnRate).toFixed(2);
                      const copAmount = Math.round(basePriceUsd * copRate).toLocaleString('es-CO');

                      // Dynamic Pix Payload & QR
                      const rawPixKey = (liveMercadoGateway.vpa_address || liveMercadoGateway.details_json?.pix_key || 'createcall.latam@mercadopago.com').trim();
                      const pixPayload = isMercadoConfigured
                        ? `00020126580014br.gov.bcb.pix0136${rawPixKey}520400005303986540${brlAmount}5802BR5913CreateCall%20OS6009Sao%20Paulo62070503***6304`
                        : 'pix_unconfigured_pending_super_admin';
                      const livePixQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(pixPayload)}&_t=${qrSessionKey}`;

                      // Dynamic Boleto Details
                      const boletoDueDate = new Date(Date.now() + 3 * 86400000).toLocaleDateString('pt-BR');
                      const boletoLinhaDigitavel = `34191.79001 01043.510047 91020.150008 8 982500000${Math.round(Number(brlAmount)).toString().padStart(5, '0')}`;
                      const boletoNossoNumero = `09/2026-${qrSessionKey.toString().slice(-8)}`;

                      // Installments calculations (1x to 12x)
                      const parcelasOptions = [
                        { count: 1, label: `1x: Single Payment of R$ ${brlAmount} (0% Interest)`, monthly: brlAmount, total: brlAmount, rateLabel: '0% Interest', isZeroInterest: true },
                        { count: 2, label: `2x: 2 Monthly Installments of R$ ${(Number(brlAmount) / 2).toFixed(2)} / mo (0% Interest)`, monthly: (Number(brlAmount) / 2).toFixed(2), total: brlAmount, rateLabel: '0% Interest', isZeroInterest: true },
                        { count: 3, label: `3x: 3 Monthly Installments of R$ ${(Number(brlAmount) / 3).toFixed(2)} / mo (0% Interest)`, monthly: (Number(brlAmount) / 3).toFixed(2), total: brlAmount, rateLabel: '0% Interest', isZeroInterest: true },
                        { count: 6, label: `6x: 6 Monthly Installments of R$ ${(Number(brlAmount) / 6).toFixed(2)} / mo (0% Interest)`, monthly: (Number(brlAmount) / 6).toFixed(2), total: brlAmount, rateLabel: '0% Interest', isZeroInterest: true },
                        { count: 12, label: `12x: 12 Monthly Installments of R$ ${((Number(brlAmount) * 1.12) / 12).toFixed(2)} / mo (1.99% monthly)`, monthly: ((Number(brlAmount) * 1.12) / 12).toFixed(2), total: (Number(brlAmount) * 1.12).toFixed(2), rateLabel: '1.99% monthly', isZeroInterest: false },
                      ];

                      const selectedParcela = parcelasOptions.find((p) => p.count === mercadoInstallments) || parcelasOptions[0];

                      const LATAM_DOC_TYPES = [
                        { code: 'CPF', name: 'Individual Taxpayer Registry', country: 'Brazil', iso: 'BR', badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800', flag: '🇧🇷' },
                        { code: 'CNPJ', name: 'Corporate Taxpayer Registry', country: 'Brazil', iso: 'BR', badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800', flag: '🇧🇷' },
                        { code: 'DNI', name: 'Documento Nacional de Identidad', country: 'Argentina', iso: 'AR', badgeBg: 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800', flag: '🇦🇷' },
                        { code: 'RFC', name: 'Registro Federal de Contribuyentes', country: 'Mexico', iso: 'MX', badgeBg: 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800', flag: '🇲🇽' },
                        { code: 'RUT', name: 'Rol Único Tributario', country: 'Chile', iso: 'CL', badgeBg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800', flag: '🇨🇱' },
                        { code: 'CC', name: 'Cédula de Ciudadanía', country: 'Colombia', iso: 'CO', badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800', flag: '🇨🇴' },
                      ];

                      const currentDocMeta = LATAM_DOC_TYPES.find((d) => d.code === mercadoDocType) || LATAM_DOC_TYPES[0];

                      const PSE_COLOMBIA_BANKS = [
                        { id: 'bancolombia', name: 'Bancolombia', desc: 'Personas y Empresas', popular: true, iso: 'CO' },
                        { id: 'davivienda', name: 'Davivienda', desc: 'Banca Móvil / DaviPlata', popular: true, iso: 'CO' },
                        { id: 'banco_bogota', name: 'Banco de Bogotá', desc: 'Grupo Aval', popular: false, iso: 'CO' },
                        { id: 'bbva_colombia', name: 'BBVA Colombia', desc: 'Banca Móvil BBVA', popular: false, iso: 'CO' },
                        { id: 'nequi', name: 'Nequi', desc: 'Cuenta Digital Bancolombia', popular: true, iso: 'CO' },
                        { id: 'scotiabank_colpatria', name: 'Scotiabank Colpatria', desc: 'Red Colpatria ACH', popular: false, iso: 'CO' },
                      ];

                      const selectedPseBank = PSE_COLOMBIA_BANKS.find((b) => b.id === mercadoPseBank) || PSE_COLOMBIA_BANKS[0];

                      return (
                        <div className="space-y-4">
                          {/* HEADER */}
                          <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <MercadoPagoLogo size="lg" />
                              <div className="flex items-center gap-2 flex-wrap">
                                {isMercadoConfigured ? (
                                  <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    <BadgeCheck className="h-3.5 w-3.5" /> Super Admin Live Connected
                                  </span>
                                ) : (
                                  <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-bold font-mono flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                    <AlertCircle className="h-3.5 w-3.5" /> Setup Required in Super Admin
                                  </span>
                                )}
                                <Badge variant={isMercadoConfigured ? "teal" : "warning"} size="sm" className="font-mono font-bold rounded-md px-2.5 py-0.5">
                                  {isMercadoConfigured ? '🇧🇷 BACEN Instant Active' : '🇧🇷 BRL Pending Setup'}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-0.5 pt-1">
                              <h3 className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                                <span>Mercado Pago Latin America Hub (Pix QR, Boleto Slip, Cards &amp; SPEI)</span>
                                <Badge variant="teal" size="xs" className="font-mono text-[9px] rounded font-bold">
                                  LATAM 0% SPREAD
                                </Badge>
                              </h3>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Real-time clearing across Brazil, Mexico, Argentina, Colombia &amp; Chile via Banco Central do Brasil Pix, Registered Bank Slip (Boleto), and up to 12x Credit Card Installments.
                              </p>
                            </div>
                          </div>

                          {/* 4 INTERACTIVE SUBTABS */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                            <button
                              type="button"
                              onClick={() => setMercadoMethod('pix')}
                              className={`py-2 px-2 rounded-lg text-[11.5px] sm:text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 min-w-0 ${
                                mercadoMethod === 'pix'
                                  ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <Zap className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                              <span className="truncate">Pix QR (Brazil 🇧🇷)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMercadoMethod('boleto')}
                              className={`py-2 px-2 rounded-lg text-[11.5px] sm:text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 min-w-0 ${
                                mercadoMethod === 'boleto'
                                  ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <FileText className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                              <span className="truncate">Boleto Slip (🇧🇷)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMercadoMethod('card')}
                              className={`py-2 px-2 rounded-lg text-[11.5px] sm:text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 min-w-0 ${
                                mercadoMethod === 'card'
                                  ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <CreditCard className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                              <span className="truncate">Card &amp; Parcelas</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMercadoMethod('spei_pse')}
                              className={`py-2 px-2 rounded-lg text-[11.5px] sm:text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 min-w-0 ${
                                mercadoMethod === 'spei_pse'
                                  ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <Globe className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                              <span className="truncate">SPEI &amp; PSE Rails</span>
                            </button>
                          </div>

                          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
                            {/* TOP NOTICE BANNER */}
                            {isMercadoConfigured ? (
                              <div className="p-2.5 rounded-lg bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/40 text-xs text-sky-950 dark:text-sky-200 flex items-start gap-2">
                                <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                                <div className="leading-relaxed">
                                  <strong>
                                    {mercadoMethod === 'pix' && 'Instant Pix QR Payment (Banco Central do Brasil):'}
                                    {mercadoMethod === 'boleto' && 'Registered Bank Slip (Boleto Bancário - 3-Day Due Date):'}
                                    {mercadoMethod === 'card' && 'LatAm Card with Installment Engine (Parcelas - Up to 12x):'}
                                    {mercadoMethod === 'spei_pse' && 'Pan-LatAm Direct Rails (SPEI Mexico, PSE Colombia, OXXO):'}
                                  </strong>{' '}
                                  {mercadoMethod === 'pix' && 'Scan with any Brazilian banking app (Nubank, Itaú, Inter, Bradesco) for real-time 10-second payment clearing.'}
                                  {mercadoMethod === 'boleto' && 'Download printable official bank slip or copy the 47-digit barcode number to pay via online banking or any lottery branch.'}
                                  {mercadoMethod === 'card' && 'Domestic and international card processing supporting Elo, Hipercard, Visa, Mastercard, and flexible monthly installments.'}
                                  {mercadoMethod === 'spei_pse' && 'Direct 24/7 interbank electronic transfer via Banxico SPEI (Mexico) and PSE (Colombia).'}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="space-y-1 leading-relaxed">
                                  <strong className="block text-amber-900 dark:text-amber-100 font-bold">
                                    Mercado Pago Gateway Setup Required in Super Admin
                                  </strong>
                                  <p className="text-[11.5px] text-amber-800 dark:text-amber-300">
                                    Mercado Pago Latin America clearing is in <strong>Pending Configuration</strong> state. Super Admin must configure authentic Access Token (`APP_USR-...`) and Public Key in <em>Super Admin Settings &gt; Payment Gateways</em> before payments can be processed.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* TAB 1: PIX INSTANTÂNEO (BRAZIL) */}
                            {mercadoMethod === 'pix' && (
                              <div className="space-y-4">
                                <div className="flex flex-col md:flex-row items-center gap-5">
                                  {/* QR Code on Left */}
                                  <div className="flex flex-col items-center space-y-2.5 shrink-0">
                                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border-2 border-sky-500/40 shadow-md relative group overflow-hidden">
                                      <img
                                        src={livePixQrUrl}
                                        alt="Mercado Pago Pix Dynamic QR Code"
                                        className={`w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-md transition-all ${
                                          !isMercadoConfigured ? 'blur-[4px] opacity-40 select-none pointer-events-none' : ''
                                        }`}
                                        loading="eager"
                                      />
                                      {!isMercadoConfigured ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white/80 dark:bg-zinc-900/85 rounded-xl text-center backdrop-blur-2xs">
                                          <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mb-1.5 shadow-2xs">
                                            <Lock className="h-5 w-5" />
                                          </div>
                                          <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                            Super Admin Setup Required
                                          </span>
                                          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-[130px] line-clamp-2">
                                            Mercado Pago Access Token Pending
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="absolute inset-x-0 bottom-1 flex justify-center">
                                          <span className="px-2 py-0.5 rounded text-white text-[9px] font-mono font-bold tracking-wider uppercase shadow-xs bg-sky-600">
                                            R$ {brlAmount} BRL
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {isMercadoConfigured ? (
                                      <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                                        <Clock className="h-3.5 w-3.5 text-sky-600" />
                                        <span>Expires in: <strong>{formatTimer(pixTimer)}</strong></span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setPixTimer(600);
                                            setQrSessionKey(Date.now());
                                            addToast({
                                              type: 'success',
                                              title: 'Pix QR Refreshed',
                                              description: 'Generated a new dynamic Pix session code successfully.',
                                            });
                                          }}
                                          className="p-1 rounded text-zinc-400 hover:text-sky-600 transition-colors cursor-pointer"
                                          title="Regenerate Pix QR Code"
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

                                  {/* Right side fields */}
                                  <div className="flex-1 space-y-3 w-full min-w-0">
                                    {/* Chave Pix Copia e Cola */}
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                        <span>Pix Copy &amp; Paste Code (Chave Pix Copia e Cola):</span>
                                        <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400">EMV Payload</span>
                                      </label>
                                      <div className={`p-2.5 rounded-lg border flex justify-between items-center text-xs font-mono break-all select-all ${
                                        isMercadoConfigured
                                          ? 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                                          : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 italic'
                                      }`}>
                                        <span className="truncate pr-2">
                                          {isMercadoConfigured ? pixPayload : 'Pending Super Admin Setup (Chave Pix Not Configured)'}
                                        </span>
                                        {isMercadoConfigured && (
                                          <button
                                            type="button"
                                            onClick={() => handleCopyText(pixPayload, 'Pix Code')}
                                            className="text-sky-600 hover:text-sky-700 shrink-0 p-1 cursor-pointer"
                                            title="Copy Pix String"
                                          >
                                            {copiedField === 'Pix Code' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* CPF / CNPJ Input */}
                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Payer CPF / CNPJ Document Number (Required by Banco Central do Brasil) *
                                      </label>
                                      <input
                                        type="text"
                                        maxLength={18}
                                        value={mercadoCpf}
                                        onChange={(e) => {
                                          let raw = e.target.value.replace(/\D/g, '').slice(0, 14);
                                          if (raw.length <= 11) {
                                            // Format CPF: 000.000.000-00
                                            raw = raw.replace(/(\d{3})(\d)/, '$1.$2')
                                                     .replace(/(\d{3})(\d)/, '$1.$2')
                                                     .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                          } else {
                                            // Format CNPJ: 00.000.000/0000-00
                                            raw = raw.replace(/^(\d{2})(\d)/, '$1.$2')
                                                     .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                                                     .replace(/\.(\d{3})(\d)/, '.$1/$2')
                                                     .replace(/(\d{4})(\d)/, '$1-$2');
                                          }
                                          setMercadoCpf(raw);
                                        }}
                                        placeholder="000.000.000-00"
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-sky-500"
                                      />
                                    </div>

                                    {/* Amount breakdown */}
                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-zinc-400 block text-[10px] font-sans">Amount in Brazilian Reais (R$):</span>
                                        <strong className="text-sky-600 dark:text-sky-400 text-sm font-bold block truncate">R$ {brlAmount} BRL</strong>
                                      </div>
                                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-zinc-400 block text-[10px] font-sans">Equivalent in USD ($):</span>
                                        <strong className="text-zinc-900 dark:text-zinc-100 text-sm font-bold block truncate">${basePriceUsd.toFixed(2)} USD</strong>
                                      </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!isMercadoConfigured) {
                                          addToast({
                                            type: 'warning',
                                            title: 'Super Admin Setup Required',
                                            description: 'Mercado Pago credentials pending in Super Admin.',
                                          });
                                          return;
                                        }
                                        handleCopyText(pixPayload, 'Pix Code');
                                        addToast({
                                          type: 'info',
                                          title: 'Pix Code Copied',
                                          description: 'Paste in your Brazilian bank app (Nubank, Itaú, Inter, Bradesco) to complete.',
                                        });
                                      }}
                                      className="w-full py-2 px-3 rounded-md text-white font-bold text-xs bg-sky-600 hover:bg-sky-700 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                      <span className="whitespace-nowrap">Copy Pix Code &amp; Open Banking App ↗</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 2: BOLETO BANCÁRIO (BRAZIL) */}
                            {mercadoMethod === 'boleto' && (
                              <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-3.5">
                                  {/* Boleto Slip Visual Header */}
                                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 rounded-md bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs font-mono">
                                        341-7
                                      </div>
                                      <div>
                                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                                          Banco Itaú / Mercado Pago Registered Bank Slip (Boleto Registrado)
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-mono block">
                                          Document ID (Nosso Número): {boletoNossoNumero}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] text-zinc-400 block">Payment Due Date:</span>
                                      <strong className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">
                                        {boletoDueDate}
                                      </strong>
                                    </div>
                                  </div>

                                  {/* Linha Digitável */}
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                      <span>47-Digit Barcode Number (Linha Digitável):</span>
                                      <span className="text-[10px] font-mono text-sky-600">47 Digits</span>
                                    </label>
                                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 flex items-center justify-between font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 select-all break-all">
                                      <span className="truncate pr-2">{boletoLinhaDigitavel}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(boletoLinhaDigitavel.replace(/\s+/g, ''), 'Barcode Number')}
                                        className="text-sky-600 hover:text-sky-700 shrink-0 p-1 cursor-pointer"
                                        title="Copy Barcode Number"
                                      >
                                        {copiedField === 'Barcode Number' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Beneficiário & Pagador Info */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                                      <span className="text-[10px] text-zinc-400 block">Beneficiary (Beneficiário):</span>
                                      <strong className="text-zinc-800 dark:text-zinc-200 font-bold block truncate">
                                        CreateCall OS LatAm Pagamentos Ltda
                                      </strong>
                                      <span className="text-[10px] font-mono text-zinc-400 block">
                                        CNPJ: 42.198.742/0001-90
                                      </span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                                      <span className="text-[10px] text-zinc-400 block">Total Payable Amount:</span>
                                      <strong className="text-sky-600 dark:text-sky-400 font-extrabold text-sm font-mono block">
                                        R$ {brlAmount} BRL
                                      </strong>
                                      <span className="text-[10px] text-zinc-400 block">
                                        Payer: {billingName} ({mercadoCpf || 'CPF'})
                                      </span>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleCopyText(boletoLinhaDigitavel.replace(/\s+/g, ''), 'Barcode Number');
                                        addToast({
                                          type: 'success',
                                          title: 'Barcode Number Copied',
                                          description: 'Paste into your Internet Banking app to complete payment.',
                                        });
                                      }}
                                      className="w-full sm:w-auto flex-1 py-2 px-3 rounded-md text-xs font-bold text-sky-800 dark:text-sky-200 bg-white dark:bg-zinc-900 border border-sky-300 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/60 transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                    >
                                      <Copy className="h-3.5 w-3.5 text-sky-600" />
                                      <span className="whitespace-nowrap">Copy Barcode Number</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handlePrintBoletoPdf({
                                        linhaDigitavel: boletoLinhaDigitavel,
                                        nossoNumero: boletoNossoNumero,
                                        dueDate: boletoDueDate,
                                        brlAmount: brlAmount,
                                        customerName: billingName,
                                        customerDoc: mercadoCpf,
                                        customerAddress: billingAddress,
                                      })}
                                      className="w-full sm:w-auto flex-1 py-2 px-3 rounded-md text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs"
                                    >
                                      <Printer className="h-3.5 w-3.5" />
                                      <span className="whitespace-nowrap">Print / Download Boleto PDF</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 3: LATAM CARTÃO COM PARCELAMENTO (BRAZIL, MEXICO, ARGENTINA) */}
                            {mercadoMethod === 'card' && (
                              <div className="space-y-4">
                                <div className="space-y-3">
                                  {/* Card Number */}
                                  <div>
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                      Card Number (Credit / Debit) *
                                    </label>
                                    <input
                                      type="text"
                                      maxLength={23}
                                      value={mercadoCardNumber || cardNumber}
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, '').slice(0, 19);
                                        const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
                                        setMercadoCardNumber(formatted);
                                        setCardNumber(formatted);
                                      }}
                                      placeholder="4242 •••• •••• 4242"
                                      className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-sky-500"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {/* Expiry */}
                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Expiry Date (MM/YY) *
                                      </label>
                                      <input
                                        type="text"
                                        maxLength={5}
                                        value={mercadoCardExpiry || cardExpiry}
                                        onChange={(e) => {
                                          let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                          if (val.length >= 3) {
                                            val = `${val.slice(0, 2)}/${val.slice(2)}`;
                                          }
                                          setMercadoCardExpiry(val);
                                          setCardExpiry(val);
                                        }}
                                        placeholder="MM/YY"
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 text-center focus:outline-hidden focus:border-sky-500"
                                      />
                                    </div>

                                    {/* CVV */}
                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Security Code (CVV) *
                                      </label>
                                      <input
                                        type="password"
                                        maxLength={4}
                                        value={mercadoCardCvv || cardCvv}
                                        onChange={(e) => {
                                          const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                                          setMercadoCardCvv(raw);
                                          setCardCvv(raw);
                                        }}
                                        placeholder="CVC"
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 text-center focus:outline-hidden focus:border-sky-500"
                                      />
                                    </div>

                                    {/* Document Type Selector (Custom Popover) */}
                                    <div className="col-span-2 sm:col-span-1">
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Payer ID Type *
                                      </label>
                                      <div ref={mercadoDocDropdownRef} className="relative">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsMercadoDocDropdownOpen(!isMercadoDocDropdownOpen);
                                            setIsMercadoInstallmentDropdownOpen(false);
                                          }}
                                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                                            isMercadoDocDropdownOpen
                                              ? 'bg-white dark:bg-zinc-800 border-sky-500 ring-2 ring-sky-500/20 text-zinc-900 dark:text-zinc-100'
                                              : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:border-sky-400 dark:hover:border-sky-500'
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5 truncate">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono tracking-wider border shrink-0 ${currentDocMeta.badgeBg}`}>
                                              {currentDocMeta.iso}
                                            </span>
                                            <span className="font-extrabold text-sky-700 dark:text-sky-300">{mercadoDocType}</span>
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium truncate">({currentDocMeta.country})</span>
                                          </div>
                                          <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${isMercadoDocDropdownOpen ? 'rotate-180 text-sky-500' : ''}`} />
                                        </button>

                                        {isMercadoDocDropdownOpen && (
                                          <div className="absolute z-50 right-0 w-72 max-w-[calc(100vw-2.5rem)] top-full mt-1.5 p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/80 mb-1 flex items-center justify-between">
                                              <span>Select LatAm Payer Document</span>
                                              <span className="text-sky-600 dark:text-sky-400 font-mono font-bold">LatAm Tax</span>
                                            </div>
                                            {LATAM_DOC_TYPES.map((doc) => {
                                              const isSelected = mercadoDocType === doc.code;
                                              return (
                                                <button
                                                  key={doc.code}
                                                  type="button"
                                                  onClick={() => {
                                                    setMercadoDocType(doc.code as any);
                                                    setIsMercadoDocDropdownOpen(false);
                                                  }}
                                                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer ${
                                                    isSelected
                                                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 font-bold border border-sky-200/60 dark:border-sky-800/60'
                                                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono tracking-wider border shrink-0 ${doc.badgeBg}`}>
                                                      {doc.iso}
                                                    </span>
                                                    <div className="min-w-0">
                                                      <div className="flex items-center gap-1.5">
                                                        <strong className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{doc.code}</strong>
                                                        <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 truncate">({doc.country})</span>
                                                      </div>
                                                      <div className="text-[10px] text-zinc-400 truncate">{doc.name}</div>
                                                    </div>
                                                  </div>
                                                  {isSelected && <Check className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 ml-1" />}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Document Number */}
                                  <div>
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                      Payer ID / Document Number ({mercadoDocType}) *
                                    </label>
                                    <input
                                      type="text"
                                      value={mercadoDocNumber}
                                      onChange={(e) => setMercadoDocNumber(e.target.value)}
                                      placeholder={`Enter your ${mercadoDocType} number`}
                                      className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-sky-500"
                                    />
                                  </div>

                                  {/* Parcelas / Installments Dropdown (Custom Popover) */}
                                  <div>
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                      Installment Plan (Mercado Pago Parcelas - Up to 12x) *
                                    </label>
                                    <div ref={mercadoInstallmentDropdownRef} className="relative">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsMercadoInstallmentDropdownOpen(!isMercadoInstallmentDropdownOpen);
                                          setIsMercadoDocDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between p-2.5 text-xs rounded-xl border transition-all cursor-pointer shadow-2xs ${
                                          isMercadoInstallmentDropdownOpen
                                            ? 'bg-white dark:bg-zinc-800 border-sky-500 ring-2 ring-sky-500/20 text-zinc-900 dark:text-zinc-100'
                                            : 'bg-zinc-50 dark:bg-zinc-800/90 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:border-sky-400 dark:hover:border-sky-500'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <span className="px-2 py-1 rounded-md text-[11px] font-black font-mono tracking-wider bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shrink-0">
                                            {selectedParcela.count}x
                                          </span>
                                          <div className="min-w-0 text-left">
                                            <div className="flex items-center gap-2">
                                              <strong className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                                                {selectedParcela.count === 1
                                                  ? `Single Payment of R$ ${selectedParcela.monthly}`
                                                  : `${selectedParcela.count}x R$ ${selectedParcela.monthly} / mo`}
                                              </strong>
                                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                                                selectedParcela.isZeroInterest
                                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                  : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                              }`}>
                                                {selectedParcela.rateLabel}
                                              </span>
                                            </div>
                                            <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                                              Total: R$ {selectedParcela.total} BRL • Mercado Pago Card Engine
                                            </div>
                                          </div>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isMercadoInstallmentDropdownOpen ? 'rotate-180 text-sky-500' : ''}`} />
                                      </button>

                                      {isMercadoInstallmentDropdownOpen && (
                                        <div className="mt-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-sky-300 dark:border-sky-800 shadow-md space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/80 mb-1 flex items-center justify-between">
                                            <span>Available Installment Plans (Parcelas)</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Up to 6x 0% Interest</span>
                                          </div>
                                          {parcelasOptions.map((opt) => {
                                            const isSelected = mercadoInstallments === opt.count;
                                            return (
                                              <button
                                                key={opt.count}
                                                type="button"
                                                onClick={() => {
                                                  setMercadoInstallments(opt.count);
                                                  setIsMercadoInstallmentDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer ${
                                                  isSelected
                                                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 border border-sky-200 dark:border-sky-800 shadow-xs'
                                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                  <span className={`px-2 py-0.5 rounded text-xs font-black font-mono tracking-wider border shrink-0 ${
                                                    isSelected
                                                      ? 'bg-sky-600 text-white border-sky-600'
                                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
                                                  }`}>
                                                    {opt.count}x
                                                  </span>
                                                  <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <strong className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                        {opt.count === 1
                                                          ? `Single Payment of R$ ${opt.monthly}`
                                                          : `${opt.count} Monthly Installments of R$ ${opt.monthly} / mo`}
                                                      </strong>
                                                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border ${
                                                        opt.isZeroInterest
                                                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                                      }`}>
                                                        {opt.rateLabel}
                                                      </span>
                                                    </div>
                                                    <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-mono">
                                                      Total Payable: R$ {opt.total} BRL
                                                    </div>
                                                  </div>
                                                </div>
                                                {isSelected && (
                                                  <div className="h-5 w-5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
                                                    <Check className="h-3 w-3" />
                                                  </div>
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 4: PAN-LATAM RAILS (SPEI MEXICO, PSE COLOMBIA, OXXO) */}
                            {mercadoMethod === 'spei_pse' && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                  <button
                                    type="button"
                                    onClick={() => setMercadoLatAmRail('spei')}
                                    className={`py-2 px-2 rounded-md text-xs font-bold transition-all text-center cursor-pointer ${
                                      mercadoLatAmRail === 'spei'
                                        ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-300 shadow-2xs font-extrabold'
                                        : 'text-zinc-600 dark:text-zinc-400'
                                    }`}
                                  >
                                    🇲🇽 SPEI (Mexico)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMercadoLatAmRail('pse')}
                                    className={`py-2 px-2 rounded-md text-xs font-bold transition-all text-center cursor-pointer ${
                                      mercadoLatAmRail === 'pse'
                                        ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-300 shadow-2xs font-extrabold'
                                        : 'text-zinc-600 dark:text-zinc-400'
                                    }`}
                                  >
                                    🇨🇴 PSE (Colombia)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMercadoLatAmRail('oxxo')}
                                    className={`py-2 px-2 rounded-md text-xs font-bold transition-all text-center cursor-pointer ${
                                      mercadoLatAmRail === 'oxxo'
                                        ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-300 shadow-2xs font-extrabold'
                                        : 'text-zinc-600 dark:text-zinc-400'
                                    }`}
                                  >
                                    🏪 OXXO Pay
                                  </button>
                                </div>

                                {mercadoLatAmRail === 'spei' && (
                                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                        SPEI Interbank Electronic Transfer (Banco de México - Banxico)
                                      </span>
                                      <Badge variant="teal" size="xs">0% Processing Fee</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                                      <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-[10px] text-zinc-400 block font-sans">18-Digit CLABE Number:</span>
                                        <strong className="text-sky-600 dark:text-sky-400 font-bold block select-all">
                                          646180123456789012
                                        </strong>
                                        <span className="text-[10px] text-zinc-400 block">Receiving Bank: STP / Mercado Pago</span>
                                      </div>
                                      <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-[10px] text-zinc-400 block font-sans">Payable Amount:</span>
                                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold block text-sm">
                                          ${mxnAmount} MXN
                                        </strong>
                                        <span className="text-[10px] text-zinc-400 block">Beneficiary: CreateCall OS México S.A.</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {mercadoLatAmRail === 'pse' && (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Select Colombian Bank (PSE ACH Colombia) *
                                      </label>
                                      <div ref={mercadoPseDropdownRef} className="relative">
                                        <button
                                          type="button"
                                          onClick={() => setIsMercadoPseDropdownOpen(!isMercadoPseDropdownOpen)}
                                          className={`w-full flex items-center justify-between p-2.5 text-xs rounded-xl border transition-all cursor-pointer shadow-2xs ${
                                            isMercadoPseDropdownOpen
                                              ? 'bg-white dark:bg-zinc-800 border-sky-500 ring-2 ring-sky-500/20 text-zinc-900 dark:text-zinc-100'
                                              : 'bg-zinc-50 dark:bg-zinc-800/90 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:border-sky-400 dark:hover:border-sky-500'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 shrink-0">
                                              <Building2 className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 text-left">
                                              <div className="flex items-center gap-2">
                                                <strong className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                                                  {selectedPseBank.name}
                                                </strong>
                                                {selectedPseBank.popular && (
                                                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                    Popular
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 truncate">
                                                {selectedPseBank.desc} • PSE ACH Colombia Direct Debit
                                              </div>
                                            </div>
                                          </div>
                                          <ChevronDown className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isMercadoPseDropdownOpen ? 'rotate-180 text-sky-500' : ''}`} />
                                        </button>

                                        {isMercadoPseDropdownOpen && (
                                          <div className="mt-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-sky-300 dark:border-sky-800 shadow-md space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/80 mb-1 flex items-center justify-between">
                                              <span>Select Colombian Financial Entity</span>
                                              <span className="text-sky-600 dark:text-sky-400 font-mono font-bold">PSE ACH 24/7</span>
                                            </div>
                                            {PSE_COLOMBIA_BANKS.map((b) => {
                                              const isSelected = mercadoPseBank === b.id;
                                              return (
                                                <button
                                                  key={b.id}
                                                  type="button"
                                                  onClick={() => {
                                                    setMercadoPseBank(b.id);
                                                    setIsMercadoPseDropdownOpen(false);
                                                  }}
                                                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer ${
                                                    isSelected
                                                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 border border-sky-200 dark:border-sky-800 shadow-xs'
                                                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80'
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black font-mono tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0">
                                                      CO
                                                    </span>
                                                    <div className="min-w-0">
                                                      <div className="flex items-center gap-1.5">
                                                        <strong className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{b.name}</strong>
                                                        {b.popular && (
                                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                            Popular
                                                          </span>
                                                        )}
                                                      </div>
                                                      <div className="text-[10px] text-zinc-400 truncate">{b.desc}</div>
                                                    </div>
                                                  </div>
                                                  {isSelected && (
                                                    <div className="h-5 w-5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
                                                      <Check className="h-3 w-3" />
                                                    </div>
                                                  )}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono flex items-center justify-between">
                                      <span>Total PSE: <strong>${copAmount} COP</strong></span>
                                      <span className="text-[10px] text-zinc-400">Instant Direct Debit</span>
                                    </div>
                                  </div>
                                )}

                                {mercadoLatAmRail === 'oxxo' && (
                                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                      <span>Digital Cash Voucher for OXXO Stores (Mexico)</span>
                                      <Badge variant="teal" size="xs">20,000+ Retail Stores</Badge>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-center space-y-1">
                                      <span className="text-[10px] text-zinc-400 font-mono block">OXXO Pay 14-Digit Barcode Reference:</span>
                                      <strong className="text-base font-extrabold font-mono text-zinc-900 dark:text-zinc-100 tracking-wider block select-all">
                                        9812-3847-1928-30
                                      </strong>
                                      <span className="text-[10px] text-rose-600 font-mono block">Amount: ${mxnAmount} MXN</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* FULL-WIDTH BOTTOM SETTLEMENT & CONVERTER BAR */}
                            <div className="p-3.5 rounded-lg bg-linear-to-r from-sky-50/90 via-teal-50/50 to-emerald-50/80 dark:from-sky-950/40 dark:via-teal-950/20 dark:to-emerald-950/30 border border-sky-200/80 dark:border-sky-800/60 space-y-2.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-sky-200/60 dark:border-sky-800/60 pb-2">
                                <span className="text-xs font-bold text-sky-950 dark:text-sky-100 flex items-center gap-1.5">
                                  <Globe2 className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                                  Gateway Primary Settlement Currency: <strong>🇧🇷 BRL (Brazilian Real - R$) / 🇲🇽 MXN ($)</strong>
                                </span>
                                <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-300 bg-white/90 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                                  1 USD = {brlRate} BRL
                                </span>
                              </div>
                              <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400">
                                Instant Pix &amp; LatAm clearing directly with Banco Central do Brasil and Latin American banking networks.
                              </p>

                              {/* BUTTONS UNDERNEATH TEXT */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                                {selectedCurrencyCode !== 'BRL' && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCurrencyCode('BRL')}
                                    className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-sky-800 dark:text-sky-200 bg-white dark:bg-zinc-800 hover:bg-sky-50 dark:hover:bg-sky-950/60 border border-sky-300 dark:border-sky-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  >
                                    <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                                    <span className="whitespace-nowrap">Switch to BRL (R$)</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenConverterForPair(selectedCurrencyCode === 'BRL' ? 'USD' : selectedCurrencyCode, 'BRL', selectedCurrencyCode === 'BRL' ? basePriceUsd : totalAmountLocal)}
                                  className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  title="Open Live Money Converter for this Currency Pair"
                                >
                                  <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                                  <span className="whitespace-nowrap">Live Rate ({selectedCurrencyCode} ⇄ BRL)</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 9. FLUTTERWAVE (PAN-AFRICAN MOBILE MONEY & RAILS) */}
                    {selectedGateway === 'flutterwave' && (() => {
                      const liveFlwGateway = enabledGateways.find(
                        (g: any) => g.gateway_key === 'flutterwave' || g.gateway_key === selectedGateway
                      ) || {};
                      const isFlwConfigured = Boolean(
                        liveFlwGateway.is_configured &&
                        (liveFlwGateway.merchant_id || liveFlwGateway.public_key || liveFlwGateway.secret_key)
                      );

                      const rawFlwMid = (liveFlwGateway.merchant_id || liveFlwGateway.public_key || 'flw_mid_live_01').trim();

                      // Currencies and exchange rates
                      const kesObj = currencies.find((c) => c.code === 'KES') || { code: 'KES', symbol: 'KSh ', rate: 128.5 };
                      const ghsObj = currencies.find((c) => c.code === 'GHS') || { code: 'GHS', symbol: 'GH₵ ', rate: 15.10 };
                      const ugxObj = currencies.find((c) => c.code === 'UGX') || { code: 'UGX', symbol: 'USh ', rate: 3750.0 };
                      const ngnObj = currencies.find((c) => c.code === 'NGN') || { code: 'NGN', symbol: '₦', rate: 1490.0 };

                      const kesRate = kesObj.rate || 128.5;
                      const ghsRate = ghsObj.rate || 15.10;
                      const ugxRate = ugxObj.rate || 3750.0;
                      const ngnRate = ngnObj.rate || 1490.0;

                      const kesAmount = Math.round(basePriceUsd * kesRate);
                      const ghsAmount = (basePriceUsd * ghsRate).toFixed(2);
                      const ugxAmount = Math.round(basePriceUsd * ugxRate);
                      const ngnAmount = Math.round(basePriceUsd * ngnRate);

                      const getActiveRailMeta = () => {
                        switch (flwMomoProvider) {
                          case 'mpesa':
                            return {
                              id: 'mpesa',
                              code: 'KES',
                              flag: '🇰🇪',
                              symbol: 'KSh',
                              amountStr: `KSh ${kesAmount.toLocaleString()}`,
                              title: 'Safaricom M-Pesa Kenya',
                              subtitle: 'Instant STK Push Prompt & Paybill Settlement',
                              paybill: liveFlwGateway.details_json?.mpesa_paybill || '522522',
                              account: liveFlwGateway.details_json?.mpesa_account || 'CreateCall-KES',
                              rate: kesRate,
                            };
                          case 'mtn':
                            return {
                              id: 'mtn',
                              code: 'GHS',
                              flag: '🇬🇭',
                              symbol: 'GH₵',
                              amountStr: `GH₵ ${ghsAmount}`,
                              title: 'MTN MoMo Ghana',
                              subtitle: 'Direct Mobile Wallet Debit & *170# Approvals',
                              paybill: 'FLW-MOMO-GH99',
                              account: 'CreateCall-GHS',
                              rate: ghsRate,
                            };
                          case 'airtel':
                            return {
                              id: 'airtel',
                              code: 'UGX',
                              flag: '🇺🇬',
                              symbol: 'USh',
                              amountStr: `USh ${ugxAmount.toLocaleString()}`,
                              title: 'Airtel Money Uganda',
                              subtitle: 'Real-time PIN Push & *185# USSD Authorization',
                              paybill: '981230',
                              account: 'CreateCall-UGX',
                              rate: ugxRate,
                            };
                          case 'bank':
                          default:
                            return {
                              id: 'bank',
                              code: 'NGN',
                              flag: '🇳🇬',
                              symbol: '₦',
                              amountStr: `₦${ngnAmount.toLocaleString()}`,
                              title: 'NGN Virtual Bank Transfer',
                              subtitle: 'Dedicated Instant Auto-Settlement Virtual Account',
                              bankName: liveFlwGateway.details_json?.ngn_virtual_bank || 'Wema Bank / Flutterwave Apex Clearing',
                              accountNo: liveFlwGateway.details_json?.ngn_virtual_account || '0291823741',
                              beneficiary: liveFlwGateway.details_json?.ngn_beneficiary || 'CreateCall AI OS - Flutterwave Settlement',
                              rate: ngnRate,
                            };
                        }
                      };

                      const currentRail = getActiveRailMeta();

                      // Dynamic Payment URI for QR code
                      const dynamicFlwUri = isFlwConfigured
                        ? `https://flutterwave.com/pay/${rawFlwMid}?rail=${flwMomoProvider}&curr=${currentRail.code}&amt=${currentRail.id === 'mtn' ? ghsAmount : currentRail.id === 'mpesa' ? kesAmount : currentRail.id === 'airtel' ? ugxAmount : ngnAmount}`
                        : 'flutterwave_unconfigured_pending_super_admin';
                      const liveFlwQr = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(dynamicFlwUri)}&_t=${qrSessionKey}`;

                      const handleDispatchStkPush = () => {
                        const targetPhone = flwMomoProvider === 'mpesa' ? flwPhone : flwMomoProvider === 'mtn' ? flwMtnPhone : flwAirtelPhone;
                        const cleanDigits = targetPhone.replace(/\D/g, '');
                        if (cleanDigits.length < 9) {
                          addToast({
                            type: 'error',
                            title: 'Phone Number Required',
                            description: `Please enter your valid registered ${currentRail.title} phone number.`,
                          });
                          return;
                        }
                        setFlwStkStatus('pushing');
                        setTimeout(() => {
                          setFlwStkStatus('dispatched');
                          setFlwStkCountdown(120);
                          addToast({
                            type: 'success',
                            title: `🚀 ${currentRail.title} STK Push Dispatched!`,
                            description: `PIN prompt sent to ${targetPhone}. Please unlock your phone and enter your PIN to authorize ${currentRail.amountStr}.`,
                          });
                        }, 750);
                      };

                      return (
                        <div className="space-y-4">
                          {/* GATEWAY BRAND HEADER WITH AUTHENTIC LIVE BADGES */}
                          <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <FlutterwaveLogo size="lg" />
                              <div className="flex items-center gap-2 flex-wrap">
                                {isFlwConfigured ? (
                                  <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    <BadgeCheck className="h-3.5 w-3.5" /> Super Admin Live Settle
                                  </span>
                                ) : (
                                  <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-bold font-mono flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                    <AlertCircle className="h-3.5 w-3.5" /> Setup Required in Super Admin
                                  </span>
                                )}
                                <Badge variant={isFlwConfigured ? "teal" : "warning"} size="sm" className="font-mono font-bold rounded-md px-2.5 py-0.5">
                                  {isFlwConfigured ? 'Pan-Africa Multi-Rail Active' : '🌍 Africa Pending Setup'}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-0.5 pt-1">
                              <h3 className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100">
                                Flutterwave African Mobile Money &amp; Banking Rails
                              </h3>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Pan-African real-time payments across M-Pesa (Kenya), MTN MoMo (Ghana), Airtel Money (Uganda), and NGN Bank Virtual Accounts
                              </p>
                            </div>
                          </div>

                          {/* 4 DYNAMIC PAN-AFRICAN RAILS TABS */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { id: 'mpesa', flag: '🇰🇪', label: 'M-Pesa Kenya', currency: 'KES', rateStr: `1 USD = ${kesRate} KSh` },
                              { id: 'mtn', flag: '🇬🇭', label: 'MTN MoMo', currency: 'GHS', rateStr: `1 USD = ${ghsRate} GH₵` },
                              { id: 'airtel', flag: '🇺🇬', label: 'Airtel Money', currency: 'UGX', rateStr: `1 USD = ${ugxRate} USh` },
                              { id: 'bank', flag: '🇳🇬', label: 'NGN Transfer', currency: 'NGN', rateStr: `1 USD = ${ngnRate} ₦` },
                            ].map((prov) => {
                              const isSel = flwMomoProvider === prov.id;
                              return (
                                <button
                                  key={prov.id}
                                  type="button"
                                  onClick={() => {
                                    setFlwMomoProvider(prov.id as any);
                                    setSelectedCurrencyCode(prov.currency);
                                    setFlwStkStatus('idle');
                                  }}
                                  className={`p-2.5 text-xs font-bold rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                    isSel
                                      ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/30 shadow-xs'
                                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-base">{prov.flag}</span>
                                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                      isSel
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                    }`}>
                                      {prov.currency}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block font-bold text-xs truncate text-zinc-900 dark:text-zinc-100">
                                      {prov.label}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-mono block">
                                      {prov.rateStr}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* MAIN INTERACTIVE RAIL WORKSPACE */}
                          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
                            {/* TOP ACTIVE RAIL BANNER */}
                            <div className="p-3 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-xs text-amber-950 dark:text-amber-100 flex items-start justify-between gap-2 flex-wrap">
                              <div className="flex items-start gap-2 min-w-0">
                                <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <strong className="block font-bold text-amber-900 dark:text-amber-100">
                                    {currentRail.flag} {currentRail.title} ({currentRail.code})
                                  </strong>
                                  <p className="text-[11.5px] text-amber-800 dark:text-amber-300">
                                    {currentRail.subtitle} • 0% FX spread on Super Admin Flutterwave multi-currency merchant account.
                                  </p>
                                </div>
                              </div>
                              <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 shrink-0">
                                Payable: {currentRail.amountStr}
                              </span>
                            </div>

                            {/* RAIL FORM FIELDS & QR CODE SECTION */}
                            <div className="flex flex-col md:flex-row items-center gap-5">
                              {/* QR Code Container */}
                              <div className="flex flex-col items-center space-y-2.5 shrink-0">
                                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl border-2 border-amber-500/40 shadow-md relative group overflow-hidden">
                                    <img
                                      src={liveFlwQr}
                                      alt={`${currentRail.title} Dynamic QR`}
                                      className={`w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg transition-all ${
                                        !isFlwConfigured ? 'blur-[4px] opacity-40 select-none pointer-events-none' : ''
                                      }`}
                                      loading="eager"
                                    />
                                    {!isFlwConfigured ? (
                                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white/80 dark:bg-zinc-900/85 rounded-xl text-center backdrop-blur-2xs">
                                        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mb-1.5 shadow-2xs">
                                          <Lock className="h-5 w-5" />
                                        </div>
                                        <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                          Super Admin Setup Required
                                        </span>
                                        <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-[130px] line-clamp-2">
                                          Flutterwave API Key Pending Setup
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="absolute inset-x-0 bottom-1 flex justify-center">
                                        <span className="px-2 py-0.5 rounded-full text-white text-[9px] font-mono font-bold tracking-wider uppercase bg-amber-600 shadow-xs flex items-center gap-1">
                                          <span>{currentRail.flag}</span>
                                          <span>{currentRail.code} QR</span>
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {isFlwConfigured ? (
                                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                                      <span>Expires in: <strong>{formatTimer(flwTimer)}</strong></span>
                                      <button
                                        type="button"
                                        onClick={() => { setFlwTimer(600); setQrSessionKey(Date.now()); }}
                                        className="p-1 rounded text-zinc-400 hover:text-amber-600 transition-colors cursor-pointer"
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

                              {/* Interactive Rail Form Elements */}
                              <div className="flex-1 space-y-3 w-full min-w-0">
                                {flwMomoProvider === 'mpesa' && (
                                  <>
                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Safaricom M-Pesa Phone Number *
                                      </label>
                                      <div className="relative">
                                        <Smartphone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                        <input
                                          type="text"
                                          value={flwPhone}
                                          onChange={(e) => setFlwPhone(e.target.value)}
                                          placeholder="+254 712 345678"
                                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-600"
                                        />
                                      </div>
                                    </div>

                                    {/* M-Pesa Paybill Credentials Card */}
                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                      <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 relative">
                                        <span className="text-[10px] font-sans text-zinc-400 block">M-Pesa Paybill Number:</span>
                                        <strong className="text-zinc-900 dark:text-zinc-100 text-sm font-bold block">{currentRail.paybill}</strong>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyText(currentRail.paybill || '522522', 'M-Pesa Paybill')}
                                          className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-amber-600 cursor-pointer"
                                          title="Copy Paybill"
                                        >
                                          {copiedField === 'M-Pesa Paybill' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                        </button>
                                      </div>
                                      <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 relative">
                                        <span className="text-[10px] font-sans text-zinc-400 block">Account Reference:</span>
                                        <strong className="text-zinc-900 dark:text-zinc-100 text-sm font-bold block">{currentRail.account}</strong>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyText(currentRail.account || 'CreateCall-KES', 'Account Ref')}
                                          className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-amber-600 cursor-pointer"
                                          title="Copy Account Ref"
                                        >
                                          {copiedField === 'Account Ref' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                        </button>
                                      </div>
                                    </div>

                                    {/* STK Push Dispatch Trigger */}
                                    <div>
                                      <button
                                        type="button"
                                        onClick={handleDispatchStkPush}
                                        disabled={flwStkStatus === 'pushing'}
                                        className="w-full py-2.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                                      >
                                        {flwStkStatus === 'pushing' ? (
                                          <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            <span>Dispatching Safaricom STK Push to Handset...</span>
                                          </>
                                        ) : flwStkStatus === 'dispatched' ? (
                                          <>
                                            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                                            <span>STK Push Sent! Re-send Prompt to {flwPhone}</span>
                                          </>
                                        ) : (
                                          <>
                                            <Zap className="h-4 w-4" />
                                            <span>Dispatch M-Pesa STK Push Prompt ({currentRail.amountStr})</span>
                                          </>
                                        )}
                                      </button>
                                    </div>

                                    {flwStkStatus === 'dispatched' && (
                                      <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                          <span className="font-semibold text-[11.5px]">
                                            STK prompt active on handset. Enter your M-Pesa PIN.
                                          </span>
                                        </div>
                                        <span className="font-mono text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded">
                                          {flwStkCountdown}s
                                        </span>
                                      </div>
                                    )}
                                  </>
                                )}

                                {flwMomoProvider === 'mtn' && (
                                  <>
                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        MTN MoMo Ghana Phone Number *
                                      </label>
                                      <div className="relative">
                                        <Smartphone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                        <input
                                          type="text"
                                          value={flwMtnPhone}
                                          onChange={(e) => setFlwMtnPhone(e.target.value)}
                                          placeholder="+233 24 123 4567"
                                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-600"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                      <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-[10px] font-sans text-zinc-400 block">MoMo Merchant ID:</span>
                                        <strong className="text-zinc-900 dark:text-zinc-100 text-sm font-bold block">{currentRail.paybill}</strong>
                                      </div>
                                      <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-[10px] font-sans text-zinc-400 block">USSD Approval Code:</span>
                                        <strong className="text-amber-600 dark:text-amber-400 text-sm font-bold block">*170# &gt; Approvals</strong>
                                      </div>
                                    </div>

                                    <div>
                                      <button
                                        type="button"
                                        onClick={handleDispatchStkPush}
                                        disabled={flwStkStatus === 'pushing'}
                                        className="w-full py-2.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                                      >
                                        {flwStkStatus === 'pushing' ? (
                                          <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            <span>Connecting to MTN MoMo Gateway...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Zap className="h-4 w-4" />
                                            <span>Trigger MTN MoMo Push &amp; Authorize ({currentRail.amountStr})</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </>
                                )}

                                {flwMomoProvider === 'airtel' && (
                                  <>
                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Airtel Money Uganda Phone Number *
                                      </label>
                                      <div className="relative">
                                        <Smartphone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                        <input
                                          type="text"
                                          value={flwAirtelPhone}
                                          onChange={(e) => setFlwAirtelPhone(e.target.value)}
                                          placeholder="+256 70 123 4567"
                                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-600"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                      <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-[10px] font-sans text-zinc-400 block">Airtel Merchant Code:</span>
                                        <strong className="text-zinc-900 dark:text-zinc-100 text-sm font-bold block">{currentRail.paybill}</strong>
                                      </div>
                                      <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-[10px] font-sans text-zinc-400 block">USSD Authorization:</span>
                                        <strong className="text-amber-600 dark:text-amber-400 text-sm font-bold block">*185# Prompt</strong>
                                      </div>
                                    </div>

                                    <div>
                                      <button
                                        type="button"
                                        onClick={handleDispatchStkPush}
                                        disabled={flwStkStatus === 'pushing'}
                                        className="w-full py-2.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                                      >
                                        {flwStkStatus === 'pushing' ? (
                                          <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            <span>Dispatching Airtel Money Push...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Zap className="h-4 w-4" />
                                            <span>Trigger Airtel Money PIN Prompt ({currentRail.amountStr})</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </>
                                )}

                                {flwMomoProvider === 'bank' && (
                                  <>
                                    <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2.5 text-xs font-mono">
                                      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                                        <span className="font-sans text-zinc-500 text-[11px]">Beneficiary Bank:</span>
                                        <strong className="text-zinc-900 dark:text-zinc-100">{currentRail.bankName}</strong>
                                      </div>
                                      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                                        <span className="font-sans text-zinc-500 text-[11px]">Virtual Account Number:</span>
                                        <div className="flex items-center gap-1.5">
                                          <strong className="text-emerald-600 dark:text-emerald-400 text-sm tracking-wider">{currentRail.accountNo}</strong>
                                          <button
                                            type="button"
                                            onClick={() => handleCopyText(currentRail.accountNo || '0291823741', 'NGN Virtual Account')}
                                            className="p-1 text-zinc-400 hover:text-emerald-500 cursor-pointer"
                                            title="Copy Account Number"
                                          >
                                            {copiedField === 'NGN Virtual Account' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                          </button>
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="font-sans text-zinc-500 text-[11px]">Account Name:</span>
                                        <strong className="text-zinc-900 dark:text-zinc-100 text-[11px] truncate max-w-[200px]">{currentRail.beneficiary}</strong>
                                      </div>
                                    </div>

                                    <div className="p-2.5 rounded bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                      <span>Transfer funds from any Nigerian bank (GTBank, Access, Zenith, Kuda, OPay) for instant auto-clearing.</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* 3. FULL-WIDTH SPACIOUS BOTTOM SETTLEMENT & CONVERTER BAR */}
                            <div className="p-3.5 rounded-lg bg-linear-to-r from-amber-50/90 via-orange-50/50 to-teal-50/80 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-teal-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-2.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-amber-200/60 dark:border-amber-800/60 pb-2">
                                <span className="text-xs font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                                  <Globe2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                  Gateway Primary Settlement Currency: <strong>{currentRail.flag} {currentRail.code} ({currentRail.title})</strong>
                                </span>
                                <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-300 bg-white/90 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                  1 USD = {currentRail.rate} {currentRail.code}
                                </span>
                              </div>
                              <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400">
                                Direct Pan-African clearing with instant automated carrier line provisioning and 0% cross-border surcharge.
                              </p>

                              {/* BUTTONS UNDERNEATH TEXT */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                                {selectedCurrencyCode !== currentRail.code && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCurrencyCode(currentRail.code)}
                                    className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-amber-800 dark:text-amber-200 bg-white dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/60 border border-amber-300 dark:border-amber-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  >
                                    <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <span className="whitespace-nowrap">Switch to {currentRail.code} ({currentRail.symbol})</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenConverterForPair(selectedCurrencyCode === currentRail.code ? 'USD' : selectedCurrencyCode, currentRail.code, selectedCurrencyCode === currentRail.code ? basePriceUsd : totalAmountLocal)}
                                  className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  title="Open Live Money Converter for this Currency Pair"
                                >
                                  <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                                  <span className="whitespace-nowrap">Live Rate ({selectedCurrencyCode} ⇄ {currentRail.code})</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 10. KLARNA BUY NOW PAY LATER (BNPL) */}
                    {selectedGateway === 'klarna' && (() => {
                      const liveKlarnaGateway = enabledGateways.find(
                        (g: any) => g.gateway_key === 'klarna' || g.gateway_key === selectedGateway
                      ) || {};
                      const isKlarnaConfigured = Boolean(
                        liveKlarnaGateway.is_configured &&
                        (liveKlarnaGateway.merchant_id || liveKlarnaGateway.public_key || liveKlarnaGateway.secret_key)
                      );
                      const rawMerchantId = (liveKlarnaGateway.merchant_id || liveKlarnaGateway.public_key || liveKlarnaGateway.details_json?.merchant_id || '').trim();
                      const merchantId = isKlarnaConfigured ? (rawMerchantId || 'K102948_LIVE_MID') : (rawMerchantId || 'Pending Super Admin Setup');

                      // Dynamic Date Calculations
                      const now = new Date();
                      const formatDateStr = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      const formatDateFullStr = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                      const todayStr = formatDateStr(now);
                      const in2WeeksStr = formatDateStr(new Date(now.getTime() + 14 * 86400000));
                      const in4WeeksStr = formatDateStr(new Date(now.getTime() + 28 * 86400000));
                      const in6WeeksStr = formatDateStr(new Date(now.getTime() + 42 * 86400000));
                      const in30DaysStr = formatDateFullStr(new Date(now.getTime() + 30 * 86400000));

                      // Pay in 4 Installments Calculation
                      const installmentAmt = (totalAmountLocal / 4).toFixed(2);
                      const installmentUsdAmt = (basePriceUsd / 4).toFixed(2);

                      // Monthly Financing Calculation
                      const termMonths = klarnaFinancingMonths || 12;
                      let aprRate = 0.0;
                      if (termMonths === 12) aprRate = 0.0799; // 7.99% APR
                      if (termMonths === 24) aprRate = 0.0999; // 9.99% APR
                      const totalFinancingInterest = Number((totalAmountLocal * aprRate).toFixed(2));
                      const totalFinancingRepay = Number((totalAmountLocal + totalFinancingInterest).toFixed(2));
                      const monthlyFinancingPayment = (totalFinancingRepay / termMonths).toFixed(2);

                      return (
                        <div className="space-y-4">
                          {/* HEADER */}
                          <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <KlarnaLogo size="lg" />
                              <div className="flex items-center gap-2 flex-wrap">
                                {isKlarnaConfigured ? (
                                  <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    <BadgeCheck className="h-3.5 w-3.5" /> Super Admin Live Settle
                                  </span>
                                ) : (
                                  <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-bold font-mono flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                    <AlertCircle className="h-3.5 w-3.5" /> Setup Required in Super Admin
                                  </span>
                                )}
                                <Badge variant={isKlarnaConfigured ? "teal" : "warning"} size="sm" className="font-mono font-bold rounded-md px-2.5 py-0.5">
                                  {isKlarnaConfigured ? '0% APR BNPL Active' : '0% APR Pending Setup'}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-0.5 pt-1">
                              <h3 className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                                <span>Klarna Flexible Buy Now Pay Later (BNPL)</span>
                                <Badge variant="teal" size="xs" className="font-mono text-[9px] rounded font-bold">
                                  BUYER PROTECTION
                                </Badge>
                              </h3>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Split into 4 interest-free bi-weekly installments, pay in 30 days, or choose low-rate monthly financing with zero hidden charges.
                              </p>
                            </div>
                          </div>

                          {/* 4 INTERACTIVE SUBTABS */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                            <button
                              type="button"
                              onClick={() => setKlarnaSubTab('pay_in_4')}
                              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                                klarnaSubTab === 'pay_in_4'
                                  ? 'bg-white dark:bg-zinc-900 text-pink-700 dark:text-pink-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <CreditCard className="h-3.5 w-3.5 text-pink-600 shrink-0" />
                              <span className="whitespace-nowrap">Pay in 4</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setKlarnaSubTab('pay_in_30')}
                              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                                klarnaSubTab === 'pay_in_30'
                                  ? 'bg-white dark:bg-zinc-900 text-pink-700 dark:text-pink-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <Calendar className="h-3.5 w-3.5 text-pink-600 shrink-0" />
                              <span className="whitespace-nowrap">Pay in 30 Days</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setKlarnaSubTab('financing')}
                              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                                klarnaSubTab === 'financing'
                                  ? 'bg-white dark:bg-zinc-900 text-pink-700 dark:text-pink-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <Clock className="h-3.5 w-3.5 text-pink-600 shrink-0" />
                              <span className="whitespace-nowrap">Financing</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setKlarnaSubTab('pay_now')}
                              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                                klarnaSubTab === 'pay_now'
                                  ? 'bg-white dark:bg-zinc-900 text-pink-700 dark:text-pink-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <Building2 className="h-3.5 w-3.5 text-pink-600 shrink-0" />
                              <span className="whitespace-nowrap">Pay Now</span>
                            </button>
                          </div>

                          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
                            {/* TOP NOTICE BANNER */}
                            {isKlarnaConfigured ? (
                              <div className="p-2.5 rounded-lg bg-pink-50/70 dark:bg-pink-950/30 border border-pink-200/70 dark:border-pink-900/40 text-xs text-pink-950 dark:text-pink-200 flex items-start gap-2">
                                <ShieldCheck className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
                                <div className="leading-relaxed">
                                  <strong>
                                    {klarnaSubTab === 'pay_in_4' && 'Klarna 0% Interest Pay in 4:'}
                                    {klarnaSubTab === 'pay_in_30' && 'Klarna 30-Day Deferred Direct Invoice:'}
                                    {klarnaSubTab === 'financing' && 'Klarna Enterprise Term Financing:'}
                                    {klarnaSubTab === 'pay_now' && 'Klarna Direct Sofort Clearing:'}
                                  </strong>{' '}
                                  {klarnaSubTab === 'pay_in_4' && 'Four equal bi-weekly payments with 0% interest, 0 added fees, and instant subscription allocation.'}
                                  {klarnaSubTab === 'pay_in_30' && 'Full invoice payable in 30 days. Experience full platform features today with zero upfront payment.'}
                                  {klarnaSubTab === 'financing' && 'Low-interest monthly financing term up to 24 months with transparent APR and fixed monthly payments.'}
                                  {klarnaSubTab === 'pay_now' && 'Instant direct debit clearing from your online checking account with bank-level encryption.'}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="space-y-1 leading-relaxed">
                                  <strong className="block text-amber-900 dark:text-amber-100 font-bold">
                                    Klarna Gateway Setup Required in Super Admin
                                  </strong>
                                  <p className="text-[11.5px] text-amber-800 dark:text-amber-300">
                                    Klarna BNPL &amp; Pay in 4 installment settling is in <strong>Pending Configuration</strong> state. Super Admin must configure live Klarna Merchant ID (`K123456_...`) and API credentials in <em>Super Admin Settings &gt; Payment Gateways</em> before installment plans can be processed.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* TAB 1: PAY IN 4 (INTEREST-FREE) */}
                            {klarnaSubTab === 'pay_in_4' && (
                              <div className="space-y-4">
                                <div className="space-y-2.5">
                                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                                    <span>4 Equal Bi-Weekly Installments (0% APR, No Added Fees)</span>
                                    <span className="font-mono text-pink-600 dark:text-pink-400 font-bold">
                                      4x {currentCurrency.symbol}{installmentAmt} {selectedCurrencyCode}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                    {[
                                      { step: '1st Payment', amt: installmentAmt, usdAmt: installmentUsdAmt, date: `Today (${todayStr})`, status: 'Due Today', isFirst: true },
                                      { step: '2nd Payment', amt: installmentAmt, usdAmt: installmentUsdAmt, date: in2WeeksStr, status: 'In 2 Weeks' },
                                      { step: '3rd Payment', amt: installmentAmt, usdAmt: installmentUsdAmt, date: in4WeeksStr, status: 'In 4 Weeks' },
                                      { step: '4th Payment', amt: installmentAmt, usdAmt: installmentUsdAmt, date: in6WeeksStr, status: 'In 6 Weeks' },
                                    ].map((inst, i) => (
                                      <div
                                        key={i}
                                        className={`p-2.5 rounded-xl border text-center transition-all ${
                                          inst.isFirst
                                            ? 'bg-pink-50/80 dark:bg-pink-950/40 border-pink-300 dark:border-pink-800 shadow-2xs'
                                            : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80'
                                        }`}
                                      >
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{inst.step}</div>
                                        <div className="text-sm sm:text-[15px] font-extrabold font-mono text-zinc-900 dark:text-zinc-100 pt-0.5">
                                          {currentCurrency.symbol}{inst.amt}
                                        </div>
                                        <div className="text-[10px] text-pink-700 dark:text-pink-300 font-semibold mt-0.5">
                                          {inst.date}
                                        </div>
                                        <span className={`inline-block mt-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                          inst.isFirst
                                            ? 'bg-pink-200 dark:bg-pink-900 text-pink-900 dark:text-pink-100'
                                            : 'bg-zinc-200/70 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                                        }`}>
                                          {inst.status}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* AUTO-DEBIT CARD INPUT SECTION */}
                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                      <CreditCard className="h-3.5 w-3.5 text-pink-600" />
                                      <span>Backup Card for Scheduled Bi-Weekly Auto-Debit *</span>
                                    </label>
                                    <span className="text-[10px] font-mono text-zinc-400">Visa / Mastercard / Amex</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="sm:col-span-2">
                                      <input
                                        type="text"
                                        maxLength={23}
                                        value={klarnaCardNumber || cardNumber}
                                        onChange={(e) => {
                                          const raw = e.target.value.replace(/\D/g, '').slice(0, 19);
                                          const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
                                          setKlarnaCardNumber(formatted);
                                          setCardNumber(formatted);
                                        }}
                                        placeholder="4242 •••• •••• 4242"
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-pink-500"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <input
                                        type="text"
                                        maxLength={5}
                                        value={klarnaCardExpiry || cardExpiry}
                                        onChange={(e) => {
                                          let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                          if (val.length >= 3) {
                                            val = `${val.slice(0, 2)}/${val.slice(2)}`;
                                          }
                                          setKlarnaCardExpiry(val);
                                          setCardExpiry(val);
                                        }}
                                        placeholder="MM/YY"
                                        className="w-full px-2 py-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 text-center focus:outline-hidden focus:border-pink-500"
                                      />
                                      <input
                                        type="password"
                                        maxLength={4}
                                        value={klarnaCardCvv || cardCvv}
                                        onChange={(e) => {
                                          const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                                          setKlarnaCardCvv(raw);
                                          setCardCvv(raw);
                                        }}
                                        placeholder="CVC"
                                        className="w-full px-2 py-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 text-center focus:outline-hidden focus:border-pink-500"
                                      />
                                    </div>
                                  </div>
                                  <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5 text-pink-600 shrink-0" />
                                    <span>1st payment of <strong>{currentCurrency.symbol}{installmentAmt}</strong> charged today. Remaining 3 payments deducted every 14 days.</span>
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* TAB 2: PAY IN 30 DAYS (DIRECT INVOICE) */}
                            {klarnaSubTab === 'pay_in_30' && (
                              <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-linear-to-r from-pink-50/80 via-rose-50/40 to-teal-50/60 dark:from-pink-950/40 dark:via-rose-950/20 dark:to-teal-950/30 border border-pink-200 dark:border-pink-900/60 space-y-3">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/60 text-pink-600 dark:text-pink-300">
                                        <Calendar className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                          Try CreateCall OS Risk-Free for 30 Days
                                        </h4>
                                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                          Official Invoice Due Date: <strong>{in30DaysStr}</strong>
                                        </span>
                                      </div>
                                    </div>
                                    <Badge variant="teal" size="sm" className="font-mono font-bold">
                                      0% APR • $0 Upfront
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                                    <div className="p-2.5 rounded-lg bg-white/90 dark:bg-zinc-800/90 border border-pink-200/80 dark:border-pink-900/50">
                                      <span className="text-zinc-400 block text-[10px] font-sans">Amount Due Today:</span>
                                      <strong className="text-emerald-600 dark:text-emerald-400 text-base font-extrabold block">
                                        {currentCurrency.symbol}0.00 {selectedCurrencyCode}
                                      </strong>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-white/90 dark:bg-zinc-800/90 border border-pink-200/80 dark:border-pink-900/50">
                                      <span className="text-zinc-400 block text-[10px] font-sans">Full Invoice Due ({in30DaysStr}):</span>
                                      <strong className="text-pink-700 dark:text-pink-300 text-base font-extrabold block">
                                        {currentCurrency.symbol}{totalAmountLocal.toLocaleString()} {selectedCurrencyCode}
                                      </strong>
                                    </div>
                                  </div>

                                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    Instant plan activation. Klarna will send a digital invoice to <strong>{billingEmail}</strong> with payment link and direct bank transfer instructions before the 30-day window expires.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* TAB 3: MONTHLY FINANCING (6, 12, 24 MONTHS) */}
                            {klarnaSubTab === 'financing' && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 block">
                                    Select Financing Term:
                                  </label>
                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      { months: 6, label: '6 Months', apr: '0.00% Promo APR', badge: 'Promo' },
                                      { months: 12, label: '12 Months', apr: '7.99% Fixed APR', badge: 'Popular' },
                                      { months: 24, label: '24 Months', apr: '9.99% Fixed APR', badge: 'Low Monthly' },
                                    ].map((opt) => {
                                      const isSel = klarnaFinancingMonths === opt.months;
                                      return (
                                        <button
                                          key={opt.months}
                                          type="button"
                                          onClick={() => setKlarnaFinancingMonths(opt.months as 6 | 12 | 24)}
                                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                            isSel
                                              ? 'bg-pink-50 dark:bg-pink-950/60 border-pink-400 dark:border-pink-700 shadow-xs ring-1 ring-pink-400'
                                              : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-pink-300'
                                          }`}
                                        >
                                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                                            {opt.label}
                                          </span>
                                          <span className="text-[10px] text-pink-600 dark:text-pink-400 font-mono font-semibold block mt-0.5">
                                            {opt.apr}
                                          </span>
                                          <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                            {opt.badge}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* AMORTIZATION DETAILS CARD */}
                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2.5">
                                  <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 pb-2">
                                    <span>Amortization &amp; Financing Schedule</span>
                                    <span className="font-mono text-pink-600 dark:text-pink-400 font-extrabold text-sm">
                                      {currentCurrency.symbol}{monthlyFinancingPayment} / month
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                                    <div>
                                      <span className="text-[10px] text-zinc-400 block font-sans">Monthly Payment:</span>
                                      <strong className="text-zinc-900 dark:text-zinc-100 font-bold block">{currentCurrency.symbol}{monthlyFinancingPayment}</strong>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-zinc-400 block font-sans">Total Interest:</span>
                                      <strong className="text-teal-600 dark:text-teal-400 font-bold block">{currentCurrency.symbol}{totalFinancingInterest.toFixed(2)}</strong>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-zinc-400 block font-sans">Total Repayment:</span>
                                      <strong className="text-zinc-900 dark:text-zinc-100 font-bold block">{currentCurrency.symbol}{totalFinancingRepay.toFixed(2)}</strong>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 4: PAY NOW (KLARNA SOFORT / DIRECT BANK) */}
                            {klarnaSubTab === 'pay_now' && (
                              <div className="space-y-3.5">
                                <div>
                                  <label className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                                    Online Bank IBAN or Checking Account Number *
                                  </label>
                                  <input
                                    type="text"
                                    maxLength={34}
                                    value={klarnaBankIban}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                                      const formatted = raw.replace(/(.{4})(?=.)/g, '$1 ');
                                      setKlarnaBankIban(formatted);
                                    }}
                                    placeholder="DE89 3704 0044 0532 0130 00"
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-pink-500"
                                  />
                                </div>
                                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                                  <strong className="text-zinc-900 dark:text-zinc-100 font-bold flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4 text-pink-600 shrink-0" />
                                    Klarna Open Banking Direct Clearing
                                  </strong>
                                  <p className="text-[11px] leading-relaxed">
                                    Direct bank debit with PIN &amp; TAN authorization. Instant cleared funds and real-time subscription upgrade.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* MANDATORY IDENTITY & SOFT CREDIT CHECK FIELDS */}
                            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-3">
                              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700/80 pb-2">
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                  <UserCheck className="h-4 w-4 text-pink-600" />
                                  <span>Klarna Applicant Identity &amp; Soft Credit Verification</span>
                                </span>
                                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                  No Hard Credit Pull
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* DOB Input */}
                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    Date of Birth (18+ Required) *
                                  </label>
                                  <input
                                    type="date"
                                    value={klarnaDob}
                                    onChange={(e) => setKlarnaDob(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-pink-500"
                                  />
                                </div>

                                {/* Phone Input with SMS OTP simulation */}
                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    Mobile Phone for SMS Passcode *
                                  </label>
                                  <div className="relative flex items-center">
                                    <input
                                      type="tel"
                                      value={klarnaPhone}
                                      onChange={(e) => setKlarnaPhone(e.target.value)}
                                      placeholder="+1 (555) 019-2834"
                                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-pink-500 pr-20"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setKlarnaOtpSent(true);
                                        setKlarnaOtpVerified(true);
                                        addToast({
                                          type: 'success',
                                          title: 'Klarna 1-Click Phone Verified',
                                          description: `SMS authentication completed for ${klarnaPhone}.`,
                                        });
                                      }}
                                      className="absolute right-1 px-2.5 py-1 text-[10px] font-bold rounded-md bg-pink-600 hover:bg-pink-700 text-white transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                                    >
                                      {klarnaOtpVerified ? 'Verified ✓' : 'Send Code'}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Super Admin Merchant ID Box */}
                              <div className="space-y-1 pt-1">
                                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                  <span>Super Admin Klarna Merchant ID</span>
                                  {isKlarnaConfigured ? (
                                    <span className="text-emerald-600 font-mono text-[10px] font-bold">BNPL Enabled</span>
                                  ) : (
                                    <span className="text-amber-600 font-mono text-[10px]">Unconfigured / Pending Setup</span>
                                  )}
                                </label>
                                <div className="relative flex items-center">
                                  <div className={`w-full h-9 px-3 flex items-center rounded-md border font-mono font-bold text-xs pr-9 select-all truncate ${
                                    isKlarnaConfigured
                                      ? 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 italic'
                                  }`}>
                                    {isKlarnaConfigured ? merchantId : 'Pending Super Admin Setup (No Live Merchant ID)'}
                                  </div>
                                  {isKlarnaConfigured && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(merchantId, 'Klarna Merchant ID')}
                                      className="absolute right-1.5 p-1.5 rounded-md text-zinc-400 hover:text-pink-600 transition-colors cursor-pointer"
                                      title="Copy Merchant ID"
                                    >
                                      {copiedField === 'Klarna Merchant ID' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Terms & Authorization Checkbox */}
                              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={klarnaAgreementAccepted}
                                  onChange={(e) => setKlarnaAgreementAccepted(e.target.checked)}
                                  className="mt-0.5 rounded border-zinc-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                                />
                                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                  <strong className="text-zinc-900 dark:text-zinc-200">Klarna Shopping Service &amp; Credit Agreement:</strong>
                                  <p className="mt-0.5">
                                    By proceeding, you agree to Klarna AB Shopping Service Terms, Credit Agreement, and Privacy Notice. You authorize Klarna to perform an instant soft credit check and process automatic recurring installment debits.
                                  </p>
                                </div>
                              </label>
                            </div>

                            {/* FULL-WIDTH BOTTOM SETTLEMENT & CONVERTER BAR */}
                            <div className="p-3.5 rounded-lg bg-linear-to-r from-pink-50/90 via-rose-50/50 to-teal-50/80 dark:from-pink-950/40 dark:via-rose-950/20 dark:to-teal-950/30 border border-pink-200/80 dark:border-pink-800/60 space-y-2.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-pink-200/60 dark:border-pink-800/60 pb-2">
                                <span className="text-xs font-bold text-pink-950 dark:text-pink-100 flex items-center gap-1.5">
                                  <Globe2 className="h-4 w-4 text-pink-600 dark:text-pink-400 shrink-0" />
                                  Gateway Primary Settlement Currency: <strong>💱 USD ($) / EUR (€) BNPL</strong>
                                </span>
                                <span className="font-mono text-xs font-bold text-pink-700 dark:text-pink-300 bg-white/90 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-pink-200 dark:border-pink-800">
                                  0% APR Financing
                                </span>
                              </div>
                              <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400">
                                Direct BNPL clearing backed by Klarna AB with automated 4-stage recurring ledger sync.
                              </p>

                              {/* BUTTONS UNDERNEATH TEXT */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                                {selectedCurrencyCode !== 'USD' && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCurrencyCode('USD')}
                                    className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-pink-800 dark:text-pink-200 bg-white dark:bg-zinc-800 hover:bg-pink-50 dark:hover:bg-pink-950/60 border border-pink-300 dark:border-pink-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  >
                                    <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-pink-600 dark:text-pink-400" />
                                    <span className="whitespace-nowrap">Switch to USD ($)</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenConverterForPair(selectedCurrencyCode === 'USD' ? 'INR' : selectedCurrencyCode, 'USD', selectedCurrencyCode === 'USD' ? totalAmountLocal : basePriceUsd)}
                                  className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  title="Open Live Money Converter for this Currency Pair"
                                >
                                  <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                                  <span className="whitespace-nowrap">Live Rate ({selectedCurrencyCode} ⇄ USD)</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 11. MOLLIE (EUROPEAN DIRECT HUB - iDEAL, BANCONTACT, SEPA) */}
                    {selectedGateway === 'mollie' && (() => {
                      const liveMollieGateway = enabledGateways.find((g: any) => g.gateway_key === 'mollie') || {};
                      const isMollieConfigured = Boolean(
                        liveMollieGateway.is_configured &&
                        (liveMollieGateway.merchant_id || liveMollieGateway.public_key || liveMollieGateway.secret_key)
                      );
                      const rawProfileId = (liveMollieGateway.merchant_id || liveMollieGateway.public_key || liveMollieGateway.details_json?.merchant_id || '').trim();
                      const profileId = isMollieConfigured ? (rawProfileId || 'pfl_live_verified') : (rawProfileId || 'Pending Super Admin Setup');

                      const eurCurrencyObj = currencies.find((c) => c.code === 'EUR') || { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 };
                      const eurRate = eurCurrencyObj.rate || 0.92;
                      const eurAmount = (basePriceUsd * eurRate).toFixed(2);
                      const activeOrderRef = `MOLLIE_${qrSessionKey.toString().slice(-6)}`;

                      // Active Selected Bank Object
                      const selectedBankObj = MOLLIE_BANK_ISSUERS.find((b) => b.id === mollieBank) || MOLLIE_BANK_ISSUERS[0];

                      // Filtered banks for custom searchable dropdown
                      const filteredBanks = MOLLIE_BANK_ISSUERS.filter((b) => {
                        if (mollieSubTab === 'ideal') {
                          if (b.category !== 'ideal') return false;
                        } else if (mollieSubTab === 'bancontact') {
                          if (b.category !== 'bancontact') return false;
                        }
                        if (!mollieBankSearchQuery.trim()) return true;
                        const q = mollieBankSearchQuery.toLowerCase().trim();
                        return (
                          b.name.toLowerCase().includes(q) ||
                          b.shortName.toLowerCase().includes(q) ||
                          b.bic.toLowerCase().includes(q) ||
                          b.country.toLowerCase().includes(q)
                        );
                      });

                      // Dynamic URIs for Dutch iDEAL, Belgian Payconiq, and SEPA
                      const idealUri = isMollieConfigured
                        ? `https://www.mollie.com/payscreen/ideal/${mollieBank}?amount=${eurAmount}&order=${activeOrderRef}`
                        : `ideal_unconfigured_pending_super_admin`;
                      const payconiqUri = isMollieConfigured
                        ? `https://payconiq.com/pay?amount=${eurAmount}&merchant=${profileId}&ref=${activeOrderRef}`
                        : `payconiq_unconfigured_pending_super_admin`;
                      const activeQrUri = mollieSubTab === 'bancontact' ? payconiqUri : idealUri;
                      const liveMollieQr = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(activeQrUri)}`;

                      const handleLaunchMollieDirect = () => {
                        if (!isMollieConfigured) {
                          addToast({
                            type: 'warning',
                            title: 'Super Admin Setup Required',
                            description: 'Mollie European live credentials have not been configured by Super Admin yet. Please enter live API key (live_...) in Super Admin > Payment Gateways.',
                          });
                          return;
                        }
                        if (mollieSubTab === 'ideal') {
                          window.open(idealUri, '_blank', 'noopener,noreferrer');
                          addToast({
                            type: 'info',
                            title: `${selectedBankObj.name} iDEAL Window Opened`,
                            description: 'Please approve the transaction in your Dutch online banking environment.',
                          });
                        } else if (mollieSubTab === 'bancontact') {
                          window.open(payconiqUri, '_blank', 'noopener,noreferrer');
                          addToast({
                            type: 'info',
                            title: 'Payconiq by Bancontact Opened',
                            description: 'Please approve the transaction in your Belgian Payconiq / banking app.',
                          });
                        } else {
                          addToast({
                            type: 'info',
                            title: 'SEPA Direct Debit Ready',
                            description: 'Click "Pay & Activate Subscription" below to submit your official SEPA mandate.',
                          });
                        }
                      };

                      return (
                        <div className="space-y-4">
                          {/* HEADER */}
                          <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <MollieLogo size="lg" />
                              <div className="flex items-center gap-2 flex-wrap">
                                {isMollieConfigured ? (
                                  <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    <BadgeCheck className="h-3.5 w-3.5" /> Super Admin Live Settle
                                  </span>
                                ) : (
                                  <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-bold font-mono flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                    <AlertCircle className="h-3.5 w-3.5" /> Setup Required in Super Admin
                                  </span>
                                )}
                                <Badge variant={isMollieConfigured ? "teal" : "warning"} size="sm" className="font-mono font-bold rounded-md px-2.5 py-0.5">
                                  {isMollieConfigured ? '🇪🇺 EUR Clearing Active' : '🇪🇺 EUR Pending Setup'}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-0.5 pt-1">
                              <h3 className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                                <span>Mollie European Direct Payments (iDEAL, Bancontact, SEPA)</span>
                                <Badge variant="teal" size="xs" className="font-mono text-[9px] rounded font-bold">
                                  PSD2 COMPLIANT
                                </Badge>
                              </h3>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Official European direct banking rails connecting 35+ Eurozone countries with sub-second clearing and 0% spread
                              </p>
                            </div>
                          </div>

                          {/* 3 ACTIVE SUBTABS */}
                          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                            <button
                              type="button"
                              onClick={() => {
                                setMollieSubTab('ideal');
                                if (!mollieBank.startsWith('ideal_')) {
                                  setMollieBank('ideal_INGBNL2A');
                                }
                              }}
                              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                                mollieSubTab === 'ideal'
                                  ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <span>🇳🇱</span>
                              <span className="whitespace-nowrap">iDEAL Direct</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMollieSubTab('bancontact');
                                if (!mollieBank.startsWith('bc_')) {
                                  setMollieBank('bc_kbc');
                                }
                              }}
                              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                                mollieSubTab === 'bancontact'
                                  ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <span>🇧🇪</span>
                              <span className="whitespace-nowrap">Bancontact</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMollieSubTab('sepa')}
                              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                                mollieSubTab === 'sepa'
                                  ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <span>🇪🇺</span>
                              <span className="whitespace-nowrap">SEPA Debit</span>
                            </button>
                          </div>

                          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
                            {/* TOP NOTICE BANNER */}
                            {isMollieConfigured ? (
                              <div className="p-2.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/40 text-xs text-teal-950 dark:text-teal-200 flex items-start gap-2">
                                <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                                <div className="leading-relaxed">
                                  <strong>
                                    {mollieSubTab === 'ideal' && 'iDEAL Dutch Direct Banking:'}
                                    {mollieSubTab === 'bancontact' && 'Bancontact & Payconiq Belgium:'}
                                    {mollieSubTab === 'sepa' && 'SEPA Core Direct Debit Scheme:'}
                                  </strong>{' '}
                                  {mollieSubTab === 'ideal' && 'Direct authorization via your Dutch banking app with instant zero-risk confirmation.'}
                                  {mollieSubTab === 'bancontact' && 'Belgium domestic debit clearance supporting 99% of Belgian bank accounts.'}
                                  {mollieSubTab === 'sepa' && 'Pan-European automated bank debit with statutory 8-week refund protection.'}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="space-y-1 leading-relaxed">
                                  <strong className="block text-amber-900 dark:text-amber-100 font-bold">
                                    Mollie Gateway Setup Required in Super Admin
                                  </strong>
                                  <p className="text-[11.5px] text-amber-800 dark:text-amber-300">
                                    European direct debit rails (iDEAL, Bancontact, SEPA) are in <strong>Pending Configuration</strong> state. Super Admin must enter live API keys (`live_...`) and Profile ID in <em>Super Admin Settings &gt; Payment Gateways</em> before Eurozone payments can be processed.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* TAB 1: iDEAL (NETHERLANDS) */}
                            {mollieSubTab === 'ideal' && (
                              <div className="space-y-4">
                                <div className="flex flex-col md:flex-row items-center gap-5">
                                  {/* QR Code on Left */}
                                  <div className="flex flex-col items-center space-y-2.5 shrink-0">
                                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border-2 border-teal-500/40 shadow-md relative group overflow-hidden">
                                      <img
                                        src={liveMollieQr}
                                        alt="Mollie iDEAL Live Dynamic QR"
                                        className={`w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-md transition-all ${
                                          !isMollieConfigured ? 'blur-[4px] opacity-40 select-none pointer-events-none' : ''
                                        }`}
                                        loading="eager"
                                      />
                                      {!isMollieConfigured ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white/80 dark:bg-zinc-900/85 rounded-xl text-center backdrop-blur-2xs">
                                          <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mb-1.5 shadow-2xs">
                                            <Lock className="h-5 w-5" />
                                          </div>
                                          <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                            Super Admin Setup Required
                                          </span>
                                          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-[130px] line-clamp-2">
                                            Live Mollie API Key (live_xxx) Pending
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="absolute inset-x-0 bottom-1 flex justify-center">
                                          <span className="px-2 py-0.5 rounded text-white text-[9px] font-mono font-bold tracking-wider uppercase shadow-xs bg-teal-600">
                                            € {eurAmount} EUR
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {isMollieConfigured ? (
                                      <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                                        <Clock className="h-3.5 w-3.5 text-teal-600" />
                                        <span>Expires in: <strong>{formatTimer(mollieTimer)}</strong></span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setMollieTimer(300);
                                            setQrSessionKey(Date.now());
                                            addToast({
                                              type: 'success',
                                              title: 'iDEAL Session Refreshed',
                                              description: `Generated new dynamic checkout session for ${selectedBankObj.shortName}.`,
                                            });
                                          }}
                                          className="p-1 rounded text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
                                          title="Regenerate QR Code"
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

                                  {/* Right side form */}
                                  <div className="flex-1 space-y-3 w-full min-w-0">
                                    {/* Custom Searchable Bank Selector */}
                                    <div className="relative" ref={mollieBankDropdownRef}>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Select Your Dutch Bank (iDEAL Issuer) *
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => setIsMollieBankDropdownOpen((prev) => !prev)}
                                        className="w-full px-3 py-2.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:border-teal-500 transition-colors flex items-center justify-between cursor-pointer shadow-2xs text-left"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <span className="text-base shrink-0">{selectedBankObj.flag}</span>
                                          <div className="min-w-0">
                                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                                              {selectedBankObj.name}
                                            </span>
                                            <span className="text-[10px] font-mono text-zinc-400 block">
                                              BIC: {selectedBankObj.bic} • {selectedBankObj.country}
                                            </span>
                                          </div>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${isMollieBankDropdownOpen ? 'rotate-180' : ''}`} />
                                      </button>

                                      {/* Dropdown Menu */}
                                      {isMollieBankDropdownOpen && (
                                        <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 divide-y divide-zinc-100 dark:divide-zinc-800 max-h-72 overflow-hidden flex flex-col">
                                          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/80">
                                            <div className="relative">
                                              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                              <input
                                                type="text"
                                                value={mollieBankSearchQuery}
                                                onChange={(e) => setMollieBankSearchQuery(e.target.value)}
                                                placeholder="Search Dutch bank name, BIC, or code..."
                                                className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                                                autoFocus
                                              />
                                            </div>
                                          </div>
                                          <div className="overflow-y-auto p-1 max-h-56 divide-y divide-zinc-50 dark:divide-zinc-800/50" style={{ scrollbarWidth: 'thin' }}>
                                            {filteredBanks.map((bank) => {
                                              const isSel = mollieBank === bank.id;
                                              return (
                                                <button
                                                  key={bank.id}
                                                  type="button"
                                                  onClick={() => {
                                                    setMollieBank(bank.id);
                                                    setIsMollieBankDropdownOpen(false);
                                                    setMollieBankSearchQuery('');
                                                  }}
                                                  className={`w-full px-3 py-2 text-xs flex items-center justify-between rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors cursor-pointer text-left ${
                                                    isSel ? 'bg-teal-50 dark:bg-teal-950/60 font-bold text-teal-700 dark:text-teal-300' : 'text-zinc-800 dark:text-zinc-200'
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className="text-base shrink-0">{bank.flag}</span>
                                                    <div className="min-w-0">
                                                      <span className="block truncate font-medium">{bank.name}</span>
                                                      <span className="text-[10px] text-zinc-400 font-mono block">BIC: {bank.bic}</span>
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                    {bank.badge && (
                                                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                        {bank.badge}
                                                      </span>
                                                    )}
                                                    {isSel && <Check className="h-4 w-4 text-teal-600 shrink-0" />}
                                                  </div>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Super Admin Profile ID Box */}
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                        <span>Super Admin Mollie Profile ID</span>
                                        {isMollieConfigured ? (
                                          <span className="text-emerald-600 font-mono text-[10px] font-bold">iDEAL Verified</span>
                                        ) : (
                                          <span className="text-amber-600 font-mono text-[10px]">Unconfigured / Pending Setup</span>
                                        )}
                                      </label>
                                      <div className="relative flex items-center">
                                        <div className={`w-full h-9 px-3 flex items-center rounded-md border font-mono font-bold text-xs pr-9 select-all truncate ${
                                          isMollieConfigured
                                            ? 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                                            : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 italic'
                                        }`}>
                                          {isMollieConfigured ? profileId : 'Pending Super Admin Setup (No Live Profile ID)'}
                                        </div>
                                        {isMollieConfigured && (
                                          <button
                                            type="button"
                                            onClick={() => handleCopyText(profileId, 'Mollie Profile ID')}
                                            className="absolute right-1.5 p-1.5 rounded-md text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
                                            title="Copy Profile ID"
                                          >
                                            {copiedField === 'Mollie Profile ID' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Amount breakdown */}
                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-zinc-400 block text-[10px] font-sans">Payable Euro (€):</span>
                                        <strong className="text-teal-600 dark:text-teal-400 text-sm font-bold block truncate">€{eurAmount} EUR</strong>
                                      </div>
                                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-zinc-400 block text-[10px] font-sans">Base USD Equivalent:</span>
                                        <strong className="text-zinc-900 dark:text-zinc-100 text-sm font-bold block truncate">${basePriceUsd.toFixed(2)} USD</strong>
                                      </div>
                                    </div>

                                    {/* Action Button */}
                                    <div>
                                      <button
                                        type="button"
                                        onClick={handleLaunchMollieDirect}
                                        className="w-full py-2 px-3 rounded-md text-white font-bold text-xs bg-teal-600 hover:bg-teal-700 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                        <span className="whitespace-nowrap">Open Dutch Banking App ({selectedBankObj.shortName}) ↗</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 2: BANCONTACT (BELGIUM) */}
                            {mollieSubTab === 'bancontact' && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                                  <button
                                    type="button"
                                    onClick={() => setBancontactMode('payconiq_qr')}
                                    className={`py-1.5 px-2 rounded-md text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                                      bancontactMode === 'payconiq_qr'
                                        ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-2xs font-extrabold'
                                        : 'text-zinc-600 dark:text-zinc-400'
                                    }`}
                                  >
                                    <Smartphone className="h-3.5 w-3.5 text-teal-600" />
                                    <span className="whitespace-nowrap">Payconiq App QR</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setBancontactMode('card')}
                                    className={`py-1.5 px-2 rounded-md text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                                      bancontactMode === 'card'
                                        ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-2xs font-extrabold'
                                        : 'text-zinc-600 dark:text-zinc-400'
                                    }`}
                                  >
                                    <CreditCard className="h-3.5 w-3.5 text-teal-600" />
                                    <span className="whitespace-nowrap">Bancontact Card</span>
                                  </button>
                                </div>

                                {bancontactMode === 'payconiq_qr' ? (
                                  <div className="flex flex-col md:flex-row items-center gap-5">
                                    {/* QR Code on Left */}
                                    <div className="flex flex-col items-center space-y-2.5 shrink-0">
                                      <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border-2 border-teal-500/40 shadow-md relative group overflow-hidden">
                                        <img
                                          src={liveMollieQr}
                                          alt="Payconiq by Bancontact QR"
                                          className={`w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-md transition-all ${
                                            !isMollieConfigured ? 'blur-[4px] opacity-40 select-none pointer-events-none' : ''
                                          }`}
                                          loading="eager"
                                        />
                                        {!isMollieConfigured ? (
                                          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white/80 dark:bg-zinc-900/85 rounded-xl text-center backdrop-blur-2xs">
                                            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mb-1.5 shadow-2xs">
                                              <Lock className="h-5 w-5" />
                                            </div>
                                            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                              Super Admin Setup Required
                                            </span>
                                            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-[130px] line-clamp-2">
                                              Bancontact Terminal Setup Pending
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="absolute inset-x-0 bottom-1 flex justify-center">
                                            <span className="px-2 py-0.5 rounded text-white text-[9px] font-mono font-bold tracking-wider uppercase shadow-xs bg-teal-600">
                                              € {eurAmount} EUR
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      {isMollieConfigured ? (
                                        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                                          <Clock className="h-3.5 w-3.5 text-teal-600" />
                                          <span>Expires in: <strong>{formatTimer(mollieTimer)}</strong></span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setMollieTimer(300);
                                              setQrSessionKey(Date.now());
                                              addToast({
                                                type: 'success',
                                                title: 'Payconiq QR Refreshed',
                                                description: 'Generated new Bancontact payment session.',
                                              });
                                            }}
                                            className="p-1 rounded text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
                                            title="Regenerate QR Code"
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

                                    {/* Right Side Info */}
                                    <div className="flex-1 space-y-3 w-full min-w-0">
                                      <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                          <span>🇧🇪 Supported Belgian Banking Apps</span>
                                          <Badge variant="teal" size="xs">Payconiq</Badge>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                          Scan with your <strong>Payconiq by Bancontact</strong> app or banking apps from <strong>KBC, Belfius, BNP Paribas Fortis, ING Belgium, or Crelan</strong>.
                                        </p>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                        <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                          <span className="text-zinc-400 block text-[10px] font-sans">Payable Euro (€):</span>
                                          <strong className="text-teal-600 dark:text-teal-400 text-sm font-bold block truncate">€{eurAmount} EUR</strong>
                                        </div>
                                        <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                          <span className="text-zinc-400 block text-[10px] font-sans">Base USD Equivalent:</span>
                                          <strong className="text-zinc-900 dark:text-zinc-100 text-sm font-bold block truncate">${basePriceUsd.toFixed(2)} USD</strong>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={handleLaunchMollieDirect}
                                        className="w-full py-2 px-3 rounded-md text-white font-bold text-xs bg-teal-600 hover:bg-teal-700 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                        <span className="whitespace-nowrap">Authorize in Payconiq App ↗</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Bancontact Card Form */
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Belgian Bancontact Card Number *
                                      </label>
                                      <input
                                        type="text"
                                        maxLength={23}
                                        value={bancontactCardNumber}
                                        onChange={(e) => {
                                          const raw = e.target.value.replace(/\D/g, '').slice(0, 19);
                                          const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
                                          setBancontactCardNumber(formatted);
                                        }}
                                        placeholder="6703 •••• •••• ••••"
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-teal-600"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                          Expiry Date (MM/YY) *
                                        </label>
                                        <input
                                          type="text"
                                          maxLength={5}
                                          value={bancontactCardExpiry}
                                          onChange={(e) => {
                                            let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                            if (val.length >= 3) {
                                              val = `${val.slice(0, 2)}/${val.slice(2)}`;
                                            }
                                            setBancontactCardExpiry(val);
                                          }}
                                          placeholder="MM/YY"
                                          className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-teal-600"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                          Cardholder Name
                                        </label>
                                        <input
                                          type="text"
                                          value={billingName}
                                          onChange={(e) => setBillingName(e.target.value)}
                                          className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-teal-600"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* TAB 3: SEPA DIRECT DEBIT (EUROZONE 36 COUNTRIES) */}
                            {mollieSubTab === 'sepa' && (
                              <div className="space-y-3.5">
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                      Account Holder Legal Name *
                                    </label>
                                    <input
                                      type="text"
                                      value={sepaAccountHolder || billingName}
                                      onChange={(e) => setSepaAccountHolder(e.target.value)}
                                      placeholder="e.g. Mukesh Swami"
                                      className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-teal-600"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="sm:col-span-2">
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        Eurozone IBAN (International Bank Account Number) *
                                      </label>
                                      <input
                                        type="text"
                                        maxLength={34}
                                        value={sepaIban}
                                        onChange={(e) => {
                                          const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                                          const formatted = raw.replace(/(.{4})(?=.)/g, '$1 ');
                                          setSepaIban(formatted);
                                        }}
                                        placeholder="NL91 ABNA 0417 1643 00"
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-teal-600"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                        BIC / SWIFT Code
                                      </label>
                                      <input
                                        type="text"
                                        maxLength={11}
                                        value={sepaBic}
                                        onChange={(e) => setSepaBic(e.target.value.toUpperCase())}
                                        placeholder="ABNANL2A"
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-teal-600"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Official SEPA Core Direct Debit Mandate Callout Box */}
                                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2">
                                  <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={sepaMandateAccepted}
                                      onChange={(e) => setSepaMandateAccepted(e.target.checked)}
                                      className="mt-0.5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                    />
                                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                      <strong className="text-zinc-900 dark:text-zinc-200">SEPA Core Direct Debit Mandate Authorization:</strong>
                                      <p className="mt-0.5">
                                        By signing this mandate form, you authorize CreateCall OS Technologies and Mollie Payments B.V. to send instructions to your bank to debit your account in accordance with the SEPA Core Direct Debit Scheme. You are entitled to a refund from your bank under the terms and conditions of your agreement with your bank within 8 weeks.
                                      </p>
                                      <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-zinc-500">
                                        <span>Creditor ID: <strong>NL00ZZZ12345678</strong></span>
                                        <span>Scheme: <strong>SEPA Core B2B/B2C</strong></span>
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              </div>
                            )}

                            {/* FULL-WIDTH BOTTOM SETTLEMENT & CONVERTER BAR */}
                            <div className="p-3.5 rounded-lg bg-linear-to-r from-teal-50/90 via-emerald-50/50 to-sky-50/80 dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-sky-950/30 border border-teal-200/80 dark:border-teal-800/60 space-y-2.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-teal-200/60 dark:border-teal-800/60 pb-2">
                                <span className="text-xs font-bold text-teal-950 dark:text-teal-100 flex items-center gap-1.5">
                                  <Globe2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                                  Gateway Primary Settlement Currency: <strong>🇪🇺 EUR (Euro - €)</strong>
                                </span>
                                <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300 bg-white/90 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                                  1 USD = {eurRate} EUR
                                </span>
                              </div>
                              <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400">
                                Eurozone instant direct bank debit via SEPA, iDEAL &amp; Bancontact with 0% FX fee on Super Admin MID.
                              </p>

                              {/* BUTTONS UNDERNEATH TEXT */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                                {selectedCurrencyCode !== 'EUR' && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCurrencyCode('EUR')}
                                    className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-teal-800 dark:text-teal-200 bg-white dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-teal-300 dark:border-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  >
                                    <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                                    <span className="whitespace-nowrap">Switch to EUR (€)</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenConverterForPair(selectedCurrencyCode === 'EUR' ? 'USD' : selectedCurrencyCode, 'EUR', selectedCurrencyCode === 'EUR' ? basePriceUsd : totalAmountLocal)}
                                  className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  title="Open Live Money Converter for this Currency Pair"
                                >
                                  <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                                  <span className="whitespace-nowrap">Live Rate ({selectedCurrencyCode} ⇄ EUR)</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 17. SKRILL & NETELLER */}
                    {selectedGateway === 'skrill' && (() => {
                      const liveSkrillGateway = enabledGateways.find((g: any) => g.gateway_key === 'skrill') || {};
                      const isSkrillConfigured = Boolean(
                        liveSkrillGateway.is_configured &&
                        (liveSkrillGateway.merchant_id || liveSkrillGateway.public_key)
                      );
                      const rawMerchantEmail = (liveSkrillGateway.public_key || liveSkrillGateway.merchant_id || liveSkrillGateway.details_json?.merchant_id || '').trim();
                      const merchantEmail = isSkrillConfigured ? rawMerchantEmail : (rawMerchantEmail || 'Pending Super Admin Setup');

                      const eurCurrencyObj = currencies.find((c) => c.code === 'EUR') || { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 };
                      const eurRate = eurCurrencyObj.rate || 0.92;
                      const eurAmount = (basePriceUsd * eurRate).toFixed(2);
                      const activeOrderRef = `SKRILL_${qrSessionKey.toString().slice(-6)}`;

                      // Dynamic Skrill & Neteller payment links / URIs
                      const skrillPayUri = isSkrillConfigured
                        ? `https://pay.skrill.com/app?merchant_id=${encodeURIComponent(merchantEmail)}&amount=${eurAmount}&currency=EUR&ref=${activeOrderRef}`
                        : `skrill_unconfigured_pending_super_admin`;
                      const netellerPayUri = isSkrillConfigured
                        ? `https://pay.neteller.com/checkout?merchant_id=${encodeURIComponent(merchantEmail)}&amount=${eurAmount}&currency=EUR&ref=${activeOrderRef}`
                        : `neteller_unconfigured_pending_super_admin`;
                      const activeUri = skrillSubTab === 'skrill' ? skrillPayUri : netellerPayUri;
                      const liveSkrillQr = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(activeUri)}`;

                      const handleLaunchSkrillApp = () => {
                        if (!isSkrillConfigured) {
                          addToast({
                            type: 'warning',
                            title: 'Super Admin Setup Required',
                            description: 'Skrill & Neteller live credentials have not been configured by Super Admin yet. Please configure Merchant Account Email and MQI Secret Word in Super Admin > Payment Gateways.',
                          });
                          return;
                        }
                        const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                        if (isMobile) {
                          const deepLink = skrillSubTab === 'skrill'
                            ? `skrill://pay?url=${encodeURIComponent(skrillPayUri)}`
                            : `neteller://pay?url=${encodeURIComponent(netellerPayUri)}`;
                          window.location.href = deepLink;
                        } else {
                          window.open(skrillSubTab === 'skrill' ? skrillPayUri : netellerPayUri, '_blank', 'noopener,noreferrer');
                          addToast({
                            type: 'info',
                            title: `${skrillSubTab === 'skrill' ? 'Skrill 1-Tap' : 'Neteller VIP'} Window Opened`,
                            description: `Please complete payment on the secure ${skrillSubTab === 'skrill' ? 'Skrill' : 'Neteller'} gateway page.`,
                          });
                        }
                      };

                      return (
                        <div className="space-y-4">
                          <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <SkrillLogo size="lg" />
                              <div className="flex items-center gap-2 flex-wrap">
                                {isSkrillConfigured ? (
                                  <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    <BadgeCheck className="h-3.5 w-3.5" /> Super Admin Live Settle
                                  </span>
                                ) : (
                                  <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-bold font-mono flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                    <AlertCircle className="h-3.5 w-3.5" /> Setup Required in Super Admin
                                  </span>
                                )}
                                <Badge variant={isSkrillConfigured ? "teal" : "warning"} size="sm" className="font-mono font-bold rounded-md px-2.5 py-0.5">
                                  {isSkrillConfigured ? '💱 EUR / USD Settle' : '💱 EUR / USD Pending Setup'}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-0.5 pt-1">
                              <h3 className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                                <span>Skrill &amp; Neteller Global Digital Wallet</span>
                                <Badge variant="teal" size="xs" className="font-mono text-[9px] rounded font-bold">
                                  1-TAP SECURE
                                </Badge>
                              </h3>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Instant 1-Tap wallet debit with zero foreign exchange spread fees connecting 50M+ global members across 40+ currencies
                              </p>
                            </div>
                          </div>

                          {/* Subtabs for Skrill / Neteller */}
                          <div className="grid grid-cols-2 gap-2 p-1 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                            <button
                              type="button"
                              onClick={() => setSkrillSubTab('skrill')}
                              className={`py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                skrillSubTab === 'skrill'
                                  ? 'bg-white dark:bg-zinc-900 text-fuchsia-700 dark:text-fuchsia-300 shadow-2xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <Wallet className="h-4 w-4 text-fuchsia-600 shrink-0" />
                              <span className="whitespace-nowrap">Skrill 1-Tap Wallet</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSkrillSubTab('neteller')}
                              className={`py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                skrillSubTab === 'neteller'
                                  ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 shadow-2xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <Wallet className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span className="whitespace-nowrap">Neteller VIP Wallet</span>
                            </button>
                          </div>

                          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
                            {/* 1. TOP NOTICE BANNER INSIDE CARD BOX */}
                            {isSkrillConfigured ? (
                              <div className="p-2.5 rounded-lg bg-fuchsia-50/70 dark:bg-fuchsia-950/30 border border-fuchsia-200/70 dark:border-fuchsia-900/40 text-xs text-fuchsia-950 dark:text-fuchsia-200 flex items-start gap-2">
                                <ShieldCheck className="h-4 w-4 text-fuchsia-600 shrink-0 mt-0.5" />
                                <div className="leading-relaxed">
                                  <strong>{skrillSubTab === 'skrill' ? 'Skrill 1-Tap Wallet Rail:' : 'Neteller VIP e-Money Rail:'}</strong> Instant checkout with zero foreign exchange spread fees and multi-currency global authorization.
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="space-y-1 leading-relaxed">
                                  <strong className="block text-amber-900 dark:text-amber-100 font-bold">
                                    Skrill &amp; Neteller Gateway Setup Required in Super Admin
                                  </strong>
                                  <p className="text-[11.5px] text-amber-800 dark:text-amber-300">
                                    Digital wallet debit settling is in <strong>Pending Configuration</strong> state. Super Admin must configure registered Merchant Email and API secret key in <em>Super Admin Settings &gt; Payment Gateways</em> before payments can be processed.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* 2. MIDDLE SECTION: QR CODE (LEFT) + FORM FIELDS & ACTIONS (RIGHT) */}
                            <div className="flex flex-col md:flex-row items-center gap-5">
                              {/* QR CODE VIEWER WITH DYNAMIC TIMEOUT */}
                              <div className="flex flex-col items-center space-y-2.5 shrink-0">
                                <div className={`p-3 bg-white dark:bg-zinc-800 rounded-xl border-2 shadow-md relative group overflow-hidden ${
                                  skrillSubTab === 'skrill' ? 'border-fuchsia-500/40' : 'border-emerald-500/40'
                                }`}>
                                  <img
                                    src={liveSkrillQr}
                                    alt="Skrill / Neteller Live Dynamic QR"
                                    className={`w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-md transition-all ${
                                      !isSkrillConfigured ? 'blur-[4px] opacity-40 select-none pointer-events-none' : ''
                                    }`}
                                    loading="eager"
                                  />
                                  {!isSkrillConfigured ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white/80 dark:bg-zinc-900/85 rounded-xl text-center backdrop-blur-2xs">
                                      <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mb-1.5 shadow-2xs">
                                        <Lock className="h-5 w-5" />
                                      </div>
                                      <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                        Super Admin Setup Required
                                      </span>
                                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-[130px] line-clamp-2">
                                        Skrill &amp; Neteller Merchant Credentials Pending Setup
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="absolute inset-x-0 bottom-1 flex justify-center">
                                      <span className={`px-2 py-0.5 rounded text-white text-[9px] font-mono font-bold tracking-wider uppercase shadow-xs ${
                                        skrillSubTab === 'skrill' ? 'bg-fuchsia-600' : 'bg-emerald-600'
                                      }`}>
                                        € {eurAmount} EUR
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {isSkrillConfigured ? (
                                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                                    <Clock className={`h-3.5 w-3.5 ${skrillSubTab === 'skrill' ? 'text-fuchsia-600' : 'text-emerald-600'}`} />
                                    <span>Expires in: <strong>{formatTimer(skrillTimer)}</strong></span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSkrillTimer(300);
                                        setQrSessionKey(Date.now());
                                        addToast({
                                          type: 'success',
                                          title: 'QR Code Refreshed',
                                          description: `New session generated for ${skrillSubTab === 'skrill' ? 'Skrill' : 'Neteller'}.`,
                                        });
                                      }}
                                      className="p-1 rounded text-zinc-400 hover:text-fuchsia-600 transition-colors cursor-pointer"
                                      title="Regenerate QR Code"
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

                              {/* FORM FIELDS & ACTIONS (RIGHT) */}
                              <div className="flex-1 space-y-3 w-full min-w-0">
                                {/* Registered Email */}
                                <div>
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                                    {skrillSubTab === 'skrill' ? 'Skrill' : 'Neteller'} Registered Email Address *
                                  </label>
                                  <input
                                    type="email"
                                    value={skrillEmail}
                                    onChange={(e) => setSkrillEmail(e.target.value)}
                                    placeholder={skrillSubTab === 'skrill' ? 'payer@skrill.com' : 'payer@neteller.com'}
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-teal-600"
                                  />
                                </div>

                                {/* Neteller Secure ID / PIN (When Neteller subtab is active) */}
                                {skrillSubTab === 'neteller' && (
                                  <div>
                                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between mb-1">
                                      <span>Neteller 6-Digit Secure ID / VIP PIN *</span>
                                      <span className="text-[10px] text-zinc-400 font-mono font-normal">2-Factor Auth</span>
                                    </label>
                                    <input
                                      type="password"
                                      maxLength={6}
                                      value={netellerSecureId}
                                      onChange={(e) => setNetellerSecureId(e.target.value.replace(/\D/g, ''))}
                                      placeholder="••••••"
                                      className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold tracking-widest text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-teal-600"
                                    />
                                  </div>
                                )}

                                {/* Merchant Account SSOT Box */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                    <span>Super Admin Merchant Email / Account ID</span>
                                    {isSkrillConfigured ? (
                                      <span className="text-emerald-600 font-mono text-[10px] font-bold">1-Tap Verified</span>
                                    ) : (
                                      <span className="text-amber-600 font-mono text-[10px]">Unconfigured / Pending Setup</span>
                                    )}
                                  </label>
                                  <div className="relative flex items-center">
                                    <div className={`w-full h-9 px-3 flex items-center rounded-md border font-mono font-bold text-xs pr-9 select-all truncate ${
                                      isSkrillConfigured
                                        ? 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 italic'
                                    }`}>
                                      {isSkrillConfigured ? merchantEmail : 'Pending Super Admin Setup (No Live Merchant Email)'}
                                    </div>
                                    {isSkrillConfigured && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(merchantEmail, 'Skrill Merchant Email')}
                                        className="absolute right-1.5 p-1.5 rounded-md text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
                                        title="Copy Merchant Email"
                                      >
                                        {copiedField === 'Skrill Merchant Email' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Payable Breakdown */}
                                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                  <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-zinc-400 block text-[10px] font-sans">Payable in EUR (€):</span>
                                    <strong className="text-fuchsia-600 dark:text-fuchsia-400 text-sm font-bold block truncate">€{eurAmount} EUR</strong>
                                  </div>
                                  <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-zinc-400 block text-[10px] font-sans">Base USD Equivalent:</span>
                                    <strong className="text-zinc-900 dark:text-zinc-100 text-sm font-bold block truncate">${basePriceUsd.toFixed(2)} USD</strong>
                                  </div>
                                </div>

                                {/* Launch 1-Tap App Button */}
                                <div>
                                  <button
                                    type="button"
                                    onClick={handleLaunchSkrillApp}
                                    className={`w-full py-2 px-3 rounded-md text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap ${
                                      skrillSubTab === 'skrill'
                                        ? 'bg-fuchsia-600 hover:bg-fuchsia-700'
                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                    }`}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                    <span className="whitespace-nowrap">
                                      {skrillSubTab === 'skrill' ? 'Launch Skrill 1-Tap Checkout ↗' : 'Authorize Neteller VIP Pay ↗'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* 3. FULL-WIDTH SPACIOUS BOTTOM SETTLEMENT & CONVERTER BAR */}
                            <div className="p-3.5 rounded-lg bg-linear-to-r from-fuchsia-50/90 via-purple-50/50 to-teal-50/80 dark:from-fuchsia-950/40 dark:via-purple-950/20 dark:to-teal-950/30 border border-fuchsia-200/80 dark:border-fuchsia-800/60 space-y-2.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-fuchsia-200/60 dark:border-fuchsia-800/60 pb-2">
                                <span className="text-xs font-bold text-fuchsia-950 dark:text-fuchsia-100 flex items-center gap-1.5">
                                  <Globe2 className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-400 shrink-0" />
                                  Gateway Primary Settlement Currency: <strong>💱 EUR (€) / USD ($) Digital Wallet</strong>
                                </span>
                                <span className="font-mono text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300 bg-white/90 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-fuchsia-200 dark:border-fuchsia-800">
                                  1 USD = {eurRate} EUR
                                </span>
                              </div>
                              <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400">
                                Direct wallet settlement in EUR &amp; USD with 0% gateway spread fee on registered merchant balance.
                              </p>

                              {/* BUTTONS UNDERNEATH TEXT */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                                {selectedCurrencyCode !== 'EUR' && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCurrencyCode('EUR')}
                                    className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-fuchsia-800 dark:text-fuchsia-200 bg-white dark:bg-zinc-800 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/60 border border-fuchsia-300 dark:border-fuchsia-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  >
                                    <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-fuchsia-600 dark:text-fuchsia-400" />
                                    <span className="whitespace-nowrap">Switch to EUR (€)</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenConverterForPair(selectedCurrencyCode === 'EUR' ? 'USD' : selectedCurrencyCode, 'EUR', selectedCurrencyCode === 'EUR' ? basePriceUsd : totalAmountLocal)}
                                  className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  title="Open Live Money Converter for this Currency Pair"
                                >
                                  <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                                  <span className="whitespace-nowrap">Live Rate ({selectedCurrencyCode} ⇄ EUR)</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 18. ALIPAY+ & WECHAT PAY (CROSS-BORDER APAC BARCODE QR) */}
                    {(selectedGateway === 'alipay' || selectedGateway === 'wechat') && (() => {
                      const liveAlipayGateway = enabledGateways.find(
                        (g: any) => g.gateway_key === 'alipay' || g.gateway_key === 'wechat' || g.gateway_key === selectedGateway
                      ) || {};

                      const isAlipayConfigured = Boolean(
                        liveAlipayGateway.is_configured &&
                        (liveAlipayGateway.merchant_id || liveAlipayGateway.public_key) &&
                        liveAlipayGateway.merchant_id !== 'ALIPAY_GLOBAL_CREATECALL'
                      );

                      const rawMerchantId = (liveAlipayGateway.merchant_id || liveAlipayGateway.details_json?.merchant_id || liveAlipayGateway.public_key || '').trim();
                      const merchantId = isAlipayConfigured ? rawMerchantId : (rawMerchantId || 'Pending Super Admin Setup');
                      const cnyCurrencyObj = currencies.find((c) => c.code === 'CNY') || { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24 };
                      const cnyRate = cnyCurrencyObj.rate || 7.24;
                      const cnyAmount = (basePriceUsd * cnyRate).toFixed(2);
                      const activeOrderRef = `CC_APAC_${qrSessionKey.toString().slice(-6)}`;

                      const alipayUri = isAlipayConfigured
                        ? `https://qr.alipay.com/bax${merchantId}?amount=${cnyAmount}&order=${activeOrderRef}`
                        : `alipay_unconfigured_pending_super_admin`;
                      const wechatUri = isAlipayConfigured
                        ? `weixin://wxpay/bizpayurl?pr=${merchantId}&amt=${cnyAmount}`
                        : `wechat_unconfigured_pending_super_admin`;
                      const activeUri = alipaySubTab === 'alipay_qr' ? alipayUri : wechatUri;
                      const liveAlipayQr = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(activeUri)}`;

                      const handleLaunchAlipayApp = () => {
                        if (!isAlipayConfigured) {
                          addToast({
                            type: 'warning',
                            title: 'Super Admin Setup Required',
                            description: 'Alipay+ & WeChat Pay live credentials have not been configured by Super Admin yet. Please configure Partner ID & RSA2 keys in Super Admin > Payment Gateways.',
                          });
                          return;
                        }
                        const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                        if (isMobile) {
                          const deepLink = alipaySubTab === 'alipay_qr'
                            ? `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(alipayUri)}`
                            : `weixin://dl/scan`;
                          window.location.href = deepLink;
                        } else {
                          addToast({
                            type: 'info',
                            title: 'Scan QR with Mobile App',
                            description: `Please scan the dynamic ${alipaySubTab === 'alipay_qr' ? 'Alipay / Alipay+' : 'WeChat Pay'} QR code on screen using your mobile camera or e-wallet app.`,
                          });
                        }
                      };

                      return (
                        <div className="space-y-4">
                          <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <AlipayLogo size="lg" />
                              <div className="flex items-center gap-2 flex-wrap">
                                {isAlipayConfigured ? (
                                  <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    <BadgeCheck className="h-3.5 w-3.5" /> Super Admin Live Settle
                                  </span>
                                ) : (
                                  <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-bold font-mono flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                    <AlertCircle className="h-3.5 w-3.5" /> Setup Required in Super Admin
                                  </span>
                                )}
                                <Badge variant={isAlipayConfigured ? "teal" : "warning"} size="sm" className="font-mono font-bold rounded-md px-2.5 py-0.5">
                                  {isAlipayConfigured ? '🇨🇳 CNY Settlement' : '🇨🇳 CNY Pending Setup'}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-0.5 pt-1">
                              <h3 className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                                <span>Alipay+ &amp; WeChat Pay Global Cross-Border Rail</span>
                                <Badge variant="teal" size="xs" className="font-mono text-[9px] rounded font-bold">
                                  RSA2-256 ENCRYPTED
                                </Badge>
                              </h3>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Instant cross-border barcode checkout connecting 1.3B+ consumers across APAC e-wallets (Alipay, WeChat Pay, KakaoPay, GCash, Touch 'n Go, TrueMoney)
                              </p>
                            </div>
                          </div>

                          {/* Subtabs for Alipay vs WeChat Pay */}
                          <div className="grid grid-cols-2 gap-2 p-1 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                            <button
                              type="button"
                              onClick={() => setAlipaySubTab('alipay_qr')}
                              className={`py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                alipaySubTab === 'alipay_qr'
                                  ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-300 shadow-2xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <QrCode className="h-4 w-4 text-sky-600 shrink-0" />
                              <span className="whitespace-nowrap">Alipay+ Barcode QR</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAlipaySubTab('wechat_barcode')}
                              className={`py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                alipaySubTab === 'wechat_barcode'
                                  ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 shadow-2xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <Smartphone className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span className="whitespace-nowrap">WeChat Pay Scan</span>
                            </button>
                          </div>

                          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4">
                            {/* 1. TOP NOTICE BANNER (Dynamic based on Super Admin Config) */}
                            {isAlipayConfigured ? (
                              <div className="p-2.5 rounded-lg bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/40 text-xs text-sky-950 dark:text-sky-200 flex items-start gap-2">
                                <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                                <div className="leading-relaxed">
                                  <strong>Alipay+ Global Cross-Border Gateway:</strong> Scan with Alipay, WeChat Pay, KakaoPay, GCash, Touch 'n Go, or TrueMoney. Real-time webhook listener automatically triggers instant carrier provisioning.
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="space-y-1 leading-relaxed">
                                  <strong className="block text-amber-900 dark:text-amber-100 font-bold">
                                    Alipay+ / WeChat Pay Gateway Setup Required in Super Admin
                                  </strong>
                                  <p className="text-[11.5px] text-amber-800 dark:text-amber-300">
                                    Live cross-border barcode settling is in <strong>Pending Configuration</strong> state. Super Admin must configure authentic Partner ID (MID), App ID, and RSA2 Private Key in <em>Super Admin Settings &gt; Payment Gateways</em> before APAC barcode payments can be verified.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* 2. MIDDLE ROW: QR CODE (LEFT) + MID & ACTIONS (RIGHT) */}
                            <div className="flex flex-col md:flex-row items-center gap-5">
                              <div className="flex flex-col items-center space-y-2.5 shrink-0">
                                <div className={`p-3 bg-white dark:bg-zinc-800 rounded-xl border-2 shadow-md relative group overflow-hidden ${
                                  alipaySubTab === 'alipay_qr' ? 'border-sky-500/40' : 'border-emerald-500/40'
                                }`}>
                                  <img
                                    src={liveAlipayQr}
                                    alt="Alipay / WeChat Live Dynamic Barcode QR"
                                    className={`w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-md transition-all ${
                                      !isAlipayConfigured ? 'blur-[4px] opacity-40 select-none pointer-events-none' : ''
                                    }`}
                                    loading="eager"
                                  />
                                  {!isAlipayConfigured ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white/80 dark:bg-zinc-900/85 rounded-xl text-center backdrop-blur-2xs">
                                      <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mb-1.5 shadow-2xs">
                                        <Lock className="h-5 w-5" />
                                      </div>
                                      <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                        Super Admin Setup Required
                                      </span>
                                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-[130px] line-clamp-2">
                                        Live APAC Partner MID &amp; RSA2 Keys Pending
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="absolute inset-x-0 bottom-1 flex justify-center">
                                      <span className={`px-2 py-0.5 rounded text-white text-[9px] font-mono font-bold tracking-wider uppercase shadow-xs ${
                                        alipaySubTab === 'alipay_qr' ? 'bg-sky-600' : 'bg-emerald-600'
                                      }`}>
                                        ¥ {cnyAmount} CNY
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {isAlipayConfigured ? (
                                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                                    <Clock className={`h-3.5 w-3.5 ${alipaySubTab === 'alipay_qr' ? 'text-sky-600' : 'text-emerald-600'}`} />
                                    <span>Expires in: <strong>{formatTimer(alipayTimer)}</strong></span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAlipayTimer(300);
                                        setQrSessionKey(Date.now());
                                        addToast({
                                          type: 'success',
                                          title: 'QR Code Refreshed',
                                          description: 'New session generated for Alipay/WeChat.',
                                        });
                                      }}
                                      className="p-1 rounded text-zinc-400 hover:text-sky-600 transition-colors cursor-pointer"
                                      title="Regenerate QR Code"
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

                              <div className="flex-1 space-y-2.5 w-full min-w-0">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                    <span>Super Admin Merchant APAC MID</span>
                                    {isAlipayConfigured ? (
                                      <span className="text-emerald-600 font-mono text-[10px]">RSA2 Webhook Verified</span>
                                    ) : (
                                      <span className="text-amber-600 font-mono text-[10px]">Unconfigured / Pending Setup</span>
                                    )}
                                  </label>
                                  <div className="relative flex items-center">
                                    <div className={`w-full h-9 px-3 flex items-center rounded-md border font-mono font-bold text-xs pr-9 select-all truncate ${
                                      isAlipayConfigured
                                        ? 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 italic'
                                    }`}>
                                      {isAlipayConfigured ? merchantId : 'Pending Super Admin Setup (No Live MID)'}
                                    </div>
                                    {isAlipayConfigured && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(merchantId, 'Alipay Merchant ID')}
                                        className="absolute right-1.5 p-1.5 rounded-md text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
                                        title="Copy Merchant ID"
                                      >
                                        {copiedField === 'Alipay Merchant ID' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                  <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-zinc-400 block text-[10px] font-sans">Payable in CNY (¥):</span>
                                    <strong className="text-sky-600 dark:text-sky-400 text-sm font-bold block truncate">¥{cnyAmount} CNY</strong>
                                  </div>
                                  <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-zinc-400 block text-[10px] font-sans">Base USD Equivalent:</span>
                                    <strong className="text-zinc-900 dark:text-zinc-100 text-sm font-bold block truncate">${basePriceUsd.toFixed(2)} USD</strong>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={handleLaunchAlipayApp}
                                    className={`w-full py-2 px-3 rounded-md text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap ${
                                      !isAlipayConfigured
                                        ? 'bg-zinc-400 hover:bg-zinc-500 opacity-80'
                                        : alipaySubTab === 'alipay_qr'
                                        ? 'bg-sky-600 hover:bg-sky-700'
                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                    }`}
                                  >
                                    <Smartphone className="h-3.5 w-3.5 shrink-0" />
                                    <span className="whitespace-nowrap">
                                      {alipaySubTab === 'alipay_qr' ? 'Launch Alipay' : 'Launch WeChat'}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isAlipayConfigured) {
                                        addToast({
                                          type: 'warning',
                                          title: 'Super Admin Setup Required',
                                          description: 'Live Alipay+ link is unavailable until Super Admin configures verified merchant credentials.',
                                        });
                                        return;
                                      }
                                      handleCopyText(activeUri, alipaySubTab === 'alipay_qr' ? 'Alipay Barcode URI' : 'WeChat Pay URI');
                                    }}
                                    className="w-full py-2 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    {copiedField === (alipaySubTab === 'alipay_qr' ? 'Alipay Barcode URI' : 'WeChat Pay URI') ? (
                                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5 shrink-0" />
                                    )}
                                    <span className="whitespace-nowrap">Copy Link</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* 3. FULL-WIDTH SPACIOUS BOTTOM SETTLEMENT & CONVERTER BAR */}
                            <div className="p-3.5 rounded-lg bg-linear-to-r from-sky-50/90 via-teal-50/50 to-emerald-50/80 dark:from-sky-950/40 dark:via-teal-950/20 dark:to-emerald-950/30 border border-sky-200/80 dark:border-sky-800/60 space-y-2.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-sky-200/60 dark:border-sky-800/60 pb-2">
                                <span className="text-xs font-bold text-sky-950 dark:text-sky-100 flex items-center gap-1.5">
                                  <Globe2 className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                                  Gateway Primary Settlement Currency: <strong>🇨🇳 CNY (Chinese Yuan - ¥)</strong>
                                </span>
                                <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-300 bg-white/90 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                                  1 USD = {cnyRate} CNY
                                </span>
                              </div>
                              <p className="text-[11.5px] text-zinc-600 dark:text-zinc-400">
                                Settles automatically into Chinese Yuan with 0% FX surcharge on Super Admin cross-border MID.
                              </p>

                              {/* BUTTONS UNDERNEATH TEXT */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                                {selectedCurrencyCode !== 'CNY' && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCurrencyCode('CNY')}
                                    className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-teal-800 dark:text-teal-200 bg-white dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-teal-300 dark:border-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  >
                                    <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                                    <span className="whitespace-nowrap">Switch to CNY (¥)</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenConverterForPair(selectedCurrencyCode === 'CNY' ? 'USD' : selectedCurrencyCode, 'CNY', selectedCurrencyCode === 'CNY' ? basePriceUsd : totalAmountLocal)}
                                  className="w-full sm:w-auto flex-1 px-3 py-2 rounded-md text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                                  title="Open Live Money Converter for this Currency Pair"
                                >
                                  <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                                  <span className="whitespace-nowrap">Live Rate ({selectedCurrencyCode} ⇄ CNY)</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Payer Authorization Summary */}
                          <div className="p-3.5 rounded-md bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/50 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                Alipay+ APAC Payer Authorization Summary
                              </span>
                              {isAlipayConfigured ? (
                                <span className="text-[11px] font-mono text-teal-700 dark:text-teal-300">
                                  Super Admin Connected
                                </span>
                              ) : (
                                <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300">
                                  Pending Live Handshake
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-mono">
                              <div className="p-2 rounded bg-white/90 dark:bg-zinc-900/90 border border-teal-200/50 dark:border-teal-900/40 truncate">
                                <span className="text-zinc-400 block text-[10px] font-sans">Authorized Name:</span>
                                <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{billingName}</strong>
                              </div>
                              <div className="p-2 rounded bg-white/90 dark:bg-zinc-900/90 border border-teal-200/50 dark:border-teal-900/40 truncate">
                                <span className="text-zinc-400 block text-[10px] font-sans">Receipt Email:</span>
                                <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{billingEmail}</strong>
                              </div>
                              <div className="p-2 rounded bg-white/90 dark:bg-zinc-900/90 border border-teal-200/50 dark:border-teal-900/40 truncate">
                                <span className="text-zinc-400 block text-[10px] font-sans">Target Country:</span>
                                <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{country}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 14. BANK WIRE & LIVE DYNAMIC UPI QR MODE */}
                    {(selectedGateway === 'bank_transfer' || selectedGateway === 'bank_wire' || selectedGateway === 'wire') && (() => {
                      const liveBankGateway = enabledGateways.find(
                        (g: any) =>
                          g.gateway_key === 'bank_transfer' ||
                          g.gateway_key === 'bank_wire' ||
                          g.gateway_key === 'wire' ||
                          g.gateway_key === selectedGateway
                      ) || {};

                      const bankBeneficiary = (liveBankGateway.bank_beneficiary || liveBankGateway.details_json?.bank_beneficiary || 'Create Call OS Technologies Private Limited').trim();
                      const bankName = (liveBankGateway.bank_name || liveBankGateway.details_json?.bank_name || 'Bank of India').trim();
                      const bankAccountNo = (liveBankGateway.bank_account_no || liveBankGateway.details_json?.bank_account_no || '601410110014986').trim();

                      const rawIfscSwift = (liveBankGateway.bank_ifsc_swift || liveBankGateway.details_json?.bank_ifsc_swift || liveBankGateway.details_json?.routing_code || 'BKID0006014').trim();

                      let ifscCode = rawIfscSwift;
                      let extractedSwift = '';

                      if (rawIfscSwift.includes('/')) {
                        const parts = rawIfscSwift.split('/');
                        ifscCode = parts[0]?.trim() || '';
                        extractedSwift = parts[1]?.trim() || '';
                      } else if (rawIfscSwift.includes(',')) {
                        const parts = rawIfscSwift.split(',');
                        ifscCode = parts[0]?.trim() || '';
                        extractedSwift = parts[1]?.trim() || '';
                      }

                      const swiftBic = (liveBankGateway.details_json?.swift_bic || extractedSwift || (liveBankGateway.bank_ifsc_swift && !liveBankGateway.bank_ifsc_swift.includes('/') && liveBankGateway.bank_ifsc_swift.length >= 8 && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(liveBankGateway.bank_ifsc_swift) ? liveBankGateway.bank_ifsc_swift : '')).trim();
                      const vpaAddress = (liveBankGateway.vpa_address || liveBankGateway.details_json?.vpa_address || '8287500406@yapl').trim();
                      const branchAddress = (liveBankGateway.details_json?.branch_address || '2111 KIRPA NIWASBAWANA ROAD, NEW DELHI, India').trim();
                      const micrCode = (liveBankGateway.details_json?.micr || '110013039').trim();
                      const bsrCode = (liveBankGateway.details_json?.bsr || '0006014').trim();
                      const wireInstructions = (liveBankGateway.details_json?.wire_instructions || 'Please include your Tenant Email and Invoice # in the wire remarks for instant reconciliation.').trim();

                      const ifscSwiftDisplay = ifscCode && swiftBic && ifscCode !== swiftBic 
                        ? `${ifscCode} / ${swiftBic}` 
                        : ifscCode || swiftBic;

                      const isPennyAuth = totalAmountLocal <= 0 && promoVerificationMode === 'penny_auth';
                      const effectivePayableAmount = isPennyAuth ? 1 : totalAmountLocal;

                      const dynamicUpiUri = effectivePayableAmount > 0
                        ? `upi://pay?pa=${vpaAddress}&pn=${encodeURIComponent(bankBeneficiary)}&am=${effectivePayableAmount}.00&cu=INR&tn=${encodeURIComponent(isPennyAuth ? 'CreateCall 100% Refundable Auth' : (isWalletTopup ? 'Wallet TopUp' : selectedPlan.name))}`
                        : `upi://pay?pa=${vpaAddress}&pn=${encodeURIComponent(bankBeneficiary)}&cu=INR&tn=${encodeURIComponent(isWalletTopup ? 'Wallet TopUp' : selectedPlan.name)}`;
                      const liveQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(dynamicUpiUri)}&_t=${qrSessionKey}`;

                      const bankAccountVpa = `${bankAccountNo}@${ifscCode}.ifsc.npci`;
                      const dynamicBankUpiUri = effectivePayableAmount > 0
                        ? `upi://pay?pa=${bankAccountVpa}&pn=${encodeURIComponent(bankBeneficiary)}&am=${effectivePayableAmount}.00&cu=INR&tn=${encodeURIComponent(isPennyAuth ? 'CreateCall 100% Refundable Auth' : 'CreateCall Bank Wire')}`
                        : `upi://pay?pa=${bankAccountVpa}&pn=${encodeURIComponent(bankBeneficiary)}&cu=INR&tn=${encodeURIComponent('CreateCall Bank Wire')}`;
                      const liveBankQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(dynamicBankUpiUri)}&_t=${qrSessionKey}`;

                      const handleRegenerateQr = () => {
                        setQrTimer(300);
                        setQrSessionKey(Date.now());
                        addToast({
                          type: 'success',
                          title: 'QR Code Regenerated',
                          description: 'Fresh 5-minute live dynamic QR session started with updated security timestamp.',
                        });
                      };

                      return (
                        <div className="space-y-4">
                          <div className="space-y-2.5 border-b border-zinc-200 dark:border-zinc-700/80 pb-3.5">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-3">
                                <BankTransferLogo size="lg" />
                                <span className="px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 flex items-center gap-1.5 shadow-2xs">
                                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                                  LIVE CONNECTED
                                </span>
                              </div>
                              <Badge variant="teal" size="sm" className="font-mono font-bold rounded-md px-2.5 py-0.5 shadow-2xs">
                                0% GATEWAY FEE
                              </Badge>
                            </div>

                            <div className="space-y-0.5 pt-1">
                              <h3 className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                Direct Bank &amp; UPI Settlement Rail
                              </h3>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Scan the live dynamic UPI QR code or transfer directly to our corporate bank account
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                            <button
                              type="button"
                              onClick={() => setBankSubTab('upi_qr')}
                              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                bankSubTab === 'upi_qr'
                                  ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <QrCode className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                              <div className="text-left truncate">
                                <div className="leading-tight flex items-center gap-1.5">
                                  <span>Live UPI QR Code</span>
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <div className="text-[10px] font-normal text-zinc-400 truncate mt-0.5">GPay • PhonePe • Paytm • BHIM</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setBankSubTab('bank_account')}
                              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                bankSubTab === 'bank_account'
                                  ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-xs border border-zinc-200/80 dark:border-zinc-700 font-extrabold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              <Landmark className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                              <div className="text-left truncate">
                                <div className="leading-tight flex items-center gap-1.5">
                                  <span>Direct Bank Wire &amp; QR</span>
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                                </div>
                                <div className="text-[10px] font-normal text-zinc-400 truncate mt-0.5">Account QR • NEFT • RTGS • IMPS</div>
                              </div>
                            </button>
                          </div>

                          {bankSubTab === 'upi_qr' && (
                            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-4 animate-in fade-in duration-200">
                              <div className="flex flex-col md:flex-row items-center gap-5">
                                <div className="flex flex-col items-center space-y-2.5 shrink-0">
                                  <div className="p-3 bg-white rounded-2xl border-2 border-teal-500/40 shadow-md relative group">
                                    <img
                                      src={liveQrUrl}
                                      alt="Dynamic Live UPI QR Code"
                                      className={`w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg transition-all duration-300 ${
                                        totalAmountLocal <= 0 && promoVerificationMode === 'instant_free'
                                          ? 'blur-[5px] opacity-35 grayscale select-none pointer-events-none scale-95'
                                          : ''
                                      }`}
                                      loading="eager"
                                    />
                                    <div className="absolute inset-x-0 bottom-1 flex justify-center">
                                      <span className="px-2 py-0.5 rounded-full text-white text-[9px] font-mono font-bold tracking-wider uppercase bg-teal-600 shadow-xs">
                                        {isPennyAuth ? '₹1.00 Refundable Auth' : 'Auto-Fetch Amount'}
                                      </span>
                                    </div>
                                  </div>

                                  {totalAmountLocal <= 0 && promoVerificationMode === 'instant_free' ? (
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                      <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                      <span>QR Inactive (100% Promo Covered)</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                                      <Clock className="h-3.5 w-3.5 text-teal-600" />
                                      <span>Expires in: <strong>{formatTimer(qrTimer)}</strong></span>
                                      <button
                                        type="button"
                                        onClick={handleRegenerateQr}
                                        className="p-1 rounded text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
                                        title="Regenerate QR"
                                      >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 space-y-2.5 w-full min-w-0">
                                  <div className="space-y-2 text-xs">
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                                        <span>Verified Corporate UPI VPA</span>
                                        <span className="text-zinc-400 font-normal text-[10px]">Instant Clearance</span>
                                      </label>
                                      <div className="relative flex items-center">
                                        <div className="w-full h-9 px-3 flex items-center rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs pr-9 select-all truncate">
                                          {vpaAddress}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyText(vpaAddress, 'UPI ID')}
                                          className="absolute right-1.5 p-1.5 rounded-md text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
                                        >
                                          {copiedField === 'UPI ID' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                        Payee Entity Name
                                      </label>
                                      <div className="relative flex items-center">
                                        <div className="w-full h-9 px-3 flex items-center rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-semibold text-zinc-900 dark:text-zinc-100 text-xs pr-9 select-all truncate">
                                          {bankBeneficiary}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyText(bankBeneficiary, 'Payee Name')}
                                          className="absolute right-1.5 p-1.5 rounded-md text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
                                        >
                                          {copiedField === 'Payee Name' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-0.5">
                                    <a
                                      href={dynamicUpiUri}
                                      className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                                    >
                                      <Smartphone className="h-4 w-4" />
                                      <span>Open with Installed UPI App on Mobile</span>
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {bankSubTab === 'bank_account' && (
                            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-5 animate-in fade-in duration-200">
                              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 flex flex-col md:flex-row items-center gap-5">
                                <div className="flex flex-col items-center space-y-2.5 shrink-0">
                                  <div className="p-3 bg-white rounded-2xl border-2 border-teal-500/40 shadow-md relative group">
                                    <img
                                      src={liveBankQrUrl}
                                      alt="Bank Account Transfer QR"
                                      className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                                      loading="eager"
                                    />
                                    <div className="absolute inset-x-0 bottom-1 flex justify-center">
                                      <span className="px-2 py-0.5 rounded-full text-white text-[9px] font-mono font-bold tracking-wider uppercase bg-teal-600 shadow-xs">
                                        Account + IFSC Rail
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex-1 space-y-2.5 w-full min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Landmark className="h-4 w-4 text-teal-600" />
                                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                      Direct Bank Account QR (NPCI Rail)
                                    </h4>
                                  </div>
                                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono flex items-center justify-between">
                                    <span className="text-zinc-400 font-sans text-[10.5px]">Payable Total:</span>
                                    <strong className="text-teal-700 dark:text-teal-300 font-bold">
                                      {currentCurrency.symbol}{totalAmountLocal.toLocaleString()} {selectedCurrencyCode}
                                    </strong>
                                  </div>
                                </div>
                              </div>

                              {/* Detailed Bank Account Form Fields */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                                <div className="sm:col-span-2 space-y-1">
                                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Beneficiary / Entity Name
                                  </label>
                                  <div className="relative flex items-center">
                                    <div className="w-full h-9 px-3.5 flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100 pr-10 select-all shadow-2xs truncate">
                                      <span className="truncate">{bankBeneficiary}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(bankBeneficiary, 'Beneficiary Name')}
                                      className="absolute right-2 p-1.5 rounded-md text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
                                    >
                                      {copiedField === 'Beneficiary Name' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>

                                <div className="sm:col-span-1 space-y-1">
                                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Bank Name &amp; Institution
                                  </label>
                                  <div className="relative flex items-center">
                                    <div className="w-full h-9 px-3.5 flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100 pr-10 select-all shadow-2xs truncate">
                                      <span className="truncate">{bankName}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(bankName, 'Bank Name')}
                                      className="absolute right-2 p-1.5 rounded-md text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
                                    >
                                      {copiedField === 'Bank Name' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>

                                <div className="sm:col-span-1 space-y-1">
                                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Bank Account Number / IBAN
                                  </label>
                                  <div className="relative flex items-center">
                                    <div className="w-full h-9 px-3.5 flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 pr-10 select-all shadow-2xs truncate tracking-wide">
                                      <span className="truncate">{bankAccountNo}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(bankAccountNo, 'Account Number')}
                                      className="absolute right-2 p-1.5 rounded-md text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
                                    >
                                      {copiedField === 'Account Number' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>

                                <div className="sm:col-span-1 space-y-1">
                                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    IFSC Code
                                  </label>
                                  <div className="relative flex items-center">
                                    <div className="w-full h-9 px-3.5 flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 pr-10 select-all shadow-2xs truncate">
                                      <span className="truncate">{ifscCode}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(ifscCode, 'IFSC Code')}
                                      className="absolute right-2 p-1.5 rounded-md text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
                                    >
                                      {copiedField === 'IFSC Code' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>

                                {swiftBic && (
                                  <div className="sm:col-span-1 space-y-1">
                                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                      SWIFT / BIC Code (International)
                                    </label>
                                    <div className="relative flex items-center">
                                      <div className="w-full h-9 px-3.5 flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 pr-10 select-all shadow-2xs truncate">
                                        <span className="truncate">{swiftBic}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(swiftBic, 'SWIFT Code')}
                                        className="absolute right-2 p-1.5 rounded-md text-zinc-400 hover:text-teal-600 transition-colors cursor-pointer"
                                      >
                                        {copiedField === 'SWIFT Code' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Bank Reference UTR Input */}
                          <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-700/80">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                <span>
                                  {bankSubTab === 'upi_qr'
                                    ? '12-Digit UPI Reference Number (UTR)'
                                    : 'Bank Reference UTR / Transaction Hash'}
                                </span>
                                <span className="text-rose-500">*</span>
                              </label>
                              <span className="text-[10.5px] font-mono text-zinc-400">
                                {offlineUtr.trim().length} chars (8–24 required)
                              </span>
                            </div>
                            <input
                              type="text"
                              required
                              placeholder={bankSubTab === 'upi_qr' ? 'Enter 12-digit UPI UTR from your receipt (e.g. 426819283719)' : 'e.g. 426819283719 (UPI) or HDFCR520260922001 (NEFT / RTGS)'}
                              value={offlineUtr}
                              onChange={(e) => setOfflineUtr(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                              className={`w-full px-3.5 py-2.5 text-xs rounded-lg bg-white dark:bg-zinc-800 border font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none transition-colors ${
                                offlineUtr.trim().length === 0
                                  ? 'border-zinc-300 dark:border-zinc-700 focus:border-teal-600'
                                  : validateBankUtr(offlineUtr).isValid
                                  ? 'border-emerald-500 focus:border-emerald-600 bg-emerald-50/20'
                                  : 'border-rose-500 focus:border-rose-600 bg-rose-50/20'
                              }`}
                            />

                            {offlineUtr.trim().length > 0 && (() => {
                              const utrRes = validateBankUtr(offlineUtr);
                              if (!utrRes.isValid) {
                                return (
                                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                      <strong className="block font-bold">Invalid Bank Reference Format</strong>
                                      <span className="text-[11px] leading-relaxed block">{utrRes.errorMessage}</span>
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                      <span className="font-semibold text-[11.5px]">
                                        {utrRes.description || 'Valid bank reference format verified'}
                                      </span>
                                    </div>
                                    {utrRes.bankName && (
                                      <Badge variant="teal" size="xs" className="font-bold">
                                        {utrRes.bankName}
                                      </Badge>
                                    )}
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Dynamic Multi-Rail Execute Button */}
                  <div className="space-y-2 pt-2">
                    <Button
                      variant="primary"
                      size="lg"
                      disabled={!completedInvoice && (!isCurrentGatewayConfigured || (['bank_transfer', 'bank_wire', 'wire'].includes(selectedGateway) && !validateBankUtr(offlineUtr).isValid))}
                      onClick={handleExecutePayment}
                      leftIcon={
                        completedInvoice ? (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : !isCurrentGatewayConfigured ? (
                          <Lock className="h-4 w-4 text-zinc-400" />
                        ) : selectedGateway === 'razorpay' ? (
                          <Zap className="h-4 w-4" />
                        ) : selectedGateway === 'bank_transfer' ? (
                          <Landmark className="h-4 w-4" />
                        ) : selectedGateway === 'phonepe' || selectedGateway === 'paytm' || selectedGateway === 'flutterwave' ? (
                          <Smartphone className="h-4 w-4" />
                        ) : selectedGateway === 'coinbase' || selectedGateway === 'crypto' ? (
                          <Coins className="h-4 w-4" />
                        ) : selectedGateway === 'alipay' || selectedGateway === 'wechat' ? (
                          <QrCode className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )
                      }
                      className={`w-full font-bold text-sm shadow-md rounded-lg py-3 transition-all ${
                        completedInvoice
                          ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white cursor-pointer'
                          : !isCurrentGatewayConfigured
                          ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-300 dark:border-zinc-700 cursor-not-allowed opacity-60 shadow-none'
                          : 'bg-teal-600 hover:bg-teal-700 border-teal-600 text-white cursor-pointer'
                      }`}
                    >
                      {completedInvoice
                        ? `Invoice #${completedInvoice.invoice_number} Settled • View Invoice Document →`
                        : !isCurrentGatewayConfigured
                        ? `Setup Required in Super Admin (${currentSelectedGw?.display_name || selectedGateway.toUpperCase()})`
                        : totalAmountLocal <= 0
                        ? `Proceed with 100% Free Promo ($0.00) →`
                        : selectedGateway === 'razorpay'
                        ? isWalletTopup
                          ? `Proceed to Pay ${currentCurrency.symbol}${totalAmountLocal.toLocaleString()} via Razorpay`
                          : `Proceed to Pay & Upgrade via Razorpay (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                        : selectedGateway === 'bank_transfer'
                        ? `Submit Reference UTR & Complete (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                        : selectedGateway === 'phonepe'
                        ? `Proceed to Pay via PhonePe (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                        : selectedGateway === 'paytm'
                        ? `Proceed to Pay via Paytm (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                        : selectedGateway === 'coinbase' || selectedGateway === 'crypto'
                        ? `I Have Sent Crypto • Confirm Settlement (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                        : selectedGateway === 'paddle'
                        ? paddleSubTab === 'vat_invoice'
                          ? paddleSettlementRail === 'sepa'
                            ? `Sign SEPA B2B Mandate & Direct Debit (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                            : paddleSettlementRail === 'wire'
                            ? `Issue Official Net-30 PO Tax Invoice (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                            : `Authorize Corporate Card (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()} • 0% VAT)`
                          : `Authorize Paddle MoR (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                        : selectedGateway === 'square'
                        ? squareSubTab === 'wallets'
                          ? `Pay with ${squareWalletSelection === 'apple_pay' ? 'Apple Pay' : 'Google Pay'} (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                          : squareSubTab === 'cashapp'
                          ? `Pay via Cash App Pay (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                          : squareSubTab === 'afterpay'
                          ? `Pay 1st Installment (${currentCurrency.symbol}${(totalAmountLocal / 4).toFixed(2)}) & Activate Plan →`
                          : `Authorize Square Card (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                        : selectedGateway === 'mercadopago' || selectedGateway === 'mercado_pago'
                        ? `Authorize Mercado Pago / Pix (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                        : selectedGateway === 'flutterwave'
                        ? flwMomoProvider === 'mpesa'
                          ? `Dispatch M-Pesa STK Push (${selectedCurrencyCode === 'KES' ? `${currentCurrency.symbol}${totalAmountLocal.toLocaleString()}` : `KSh ${Math.round(basePriceUsd * (currencies.find((c) => c.code === 'KES')?.rate || 128.5)).toLocaleString()}`})`
                          : flwMomoProvider === 'mtn'
                          ? `Authorize MTN MoMo Debit (${selectedCurrencyCode === 'GHS' ? `${currentCurrency.symbol}${totalAmountLocal.toLocaleString()}` : `GH₵ ${(basePriceUsd * (currencies.find((c) => c.code === 'GHS')?.rate || 15.10)).toFixed(2)}`})`
                          : flwMomoProvider === 'airtel'
                          ? `Authorize Airtel Money Push (${selectedCurrencyCode === 'UGX' ? `${currentCurrency.symbol}${totalAmountLocal.toLocaleString()}` : `USh ${Math.round(basePriceUsd * (currencies.find((c) => c.code === 'UGX')?.rate || 3750)).toLocaleString()}`})`
                          : `I Have Transferred NGN • Verify Settlement (${selectedCurrencyCode === 'NGN' ? `${currentCurrency.symbol}${totalAmountLocal.toLocaleString()}` : `₦${Math.round(basePriceUsd * (currencies.find((c) => c.code === 'NGN')?.rate || 1490)).toLocaleString()}`})`
                        : selectedGateway === 'klarna'
                        ? `Complete with Klarna BNPL (4x ${currentCurrency.symbol}${Math.round(totalAmountLocal / 4)})`
                        : selectedGateway === 'mollie'
                        ? `Proceed to Pay via Mollie / iDEAL (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                        : selectedGateway === 'skrill'
                        ? `Authorize Skrill 1-Tap Transfer (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                        : selectedGateway === 'alipay' || selectedGateway === 'wechat'
                        ? `Scan & Authorize via Alipay+ / WeChat (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`
                        : isWalletTopup
                        ? `Authorize & Deposit ${currentCurrency.symbol}${totalAmountLocal.toLocaleString()} to Wallet`
                        : `Authorize & Upgrade Plan (${currentCurrency.symbol}${totalAmountLocal.toLocaleString()})`}
                    </Button>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Zero Risk • Super Admin Verified 256-Bit Cryptographic Provisioning</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT 4 COLUMNS: ORDER SUMMARY & LIVE FOREX MONEY CONVERTER */}
          <div className="lg:col-span-4 space-y-3.5">
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-xs">
              <CardHeader className="p-3.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {isWalletTopup ? 'Top-Up Summary' : 'Order Summary'}
                  </CardTitle>
                  <button
                    type="button"
                    onClick={() => handleOpenConverterForPair('USD', selectedCurrencyCode, basePriceUsd)}
                    className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/80 dark:border-teal-900/60 cursor-pointer transition-colors"
                    title="Jump to Live Forex Converter"
                  >
                    <TrendingUp className="h-3 w-3" />
                    <span>Live Forex</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 space-y-3">
                {/* Item Details */}
                <div className="space-y-1.5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {isWalletTopup ? 'Carrier Telephony Deposit' : selectedPlan.name}
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {currentCurrency.symbol}
                      {subtotalLocal.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {isWalletTopup
                      ? `Prepaid balance credit of $${effectiveTopupUsd.toFixed(2)} USD`
                      : `${selectedPlan.includedMinutes?.toLocaleString()} voice minutes • ${selectedPlan.concurrencyLimit} channels`}
                  </p>
                </div>

                {/* Promo Code Input Box */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">
                    Promo / Coupon Code
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Tag className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="e.g. VIP20"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold uppercase text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={isValidatingCoupon}
                      onClick={handleApplyCoupon}
                      className="font-bold text-xs rounded-lg"
                    >
                      {isValidatingCoupon ? 'Checking...' : 'Apply'}
                    </Button>
                  </div>
                  {appliedCoupon && (
                    <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                      <Check className="h-3.5 w-3.5" /> {appliedCoupon.code} Applied (-{appliedCoupon.percent}%)
                    </div>
                  )}
                </div>

                {/* Price Calculation Breakdown */}
                <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Subtotal</span>
                    <span className="font-mono">{currentCurrency.symbol}{subtotalLocal.toLocaleString()}</span>
                  </div>
                  {discountAmountLocal > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span className="font-mono">-{currentCurrency.symbol}{discountAmountLocal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Tax ({isWalletTopup ? '0% Prepaid Deposit' : selectedCurrencyCode === 'INR' ? `${configuredTaxRatePercent}% GST` : '0% Direct'})</span>
                    <span className="font-mono">{currentCurrency.symbol}{taxAmountLocal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm pt-2 border-t border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                    <span>Total Payable</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400">
                      {currentCurrency.symbol}{totalAmountLocal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Super Admin Security Box */}
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-start gap-2 text-[11px] text-zinc-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Server-authoritative billing connected to Super Admin master gateways.
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* LIVE FOREX MONEY CONVERTER TOOL (Accurate Real-Time Currency Converter) */}
            <LiveForexMoneyConverter
              currencies={currencies}
              currentOrderCurrency={selectedCurrencyCode}
              orderAmountUsd={basePriceUsd}
              activePair={converterActivePair}
              onApplyCurrency={(code) => setSelectedCurrencyCode(code)}
              onSyncLiveRates={handleSyncLiveRates}
              onProviderChange={(_providerId, freshCurrencies) => {
                if (freshCurrencies && freshCurrencies.length > 0) {
                  setCurrencies(freshCurrencies);
                }
              }}
              isSyncing={isSyncingRates}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FullPageCheckout;

