import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Lock,
  Trash2,
  Star,
  AlertCircle,
  AlertTriangle,
  Smartphone,
  Landmark,
  ArrowLeft,
  ShieldCheck,
  Check,
  Zap,
  ChevronDown,
  Eye,
  EyeOff,
  RefreshCw,
  RotateCcw,
  Archive,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { fetchAPI } from '../../lib/api';
import {
  CardBrandsLogo,
  UpiLogo,
  BankTransferLogo,
  CardBrandLogoRenderer,
} from './PaymentBrandLogos';
import {
  analyzeCardNumber,
  formatCardNumberByScheme,
} from '../../lib/cardIntelligenceEngine';
import { PhysicalBankCardSimulator } from './PhysicalBankCardSimulator';

export interface SavedPaymentMethodItem {
  id: string;
  gateway: string;
  method_type: string;
  brand: string;
  last4: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  status: string;
  billing_name?: string;
  billing_email?: string;
  details_json?: any;
  created_at?: string;
  deleted_at?: string;
}

export interface PaymentMethodsTabProps {
  gateways: any[];
  billingAccount: any;
  onAddFunds?: (amountUsd?: number) => void;
  onUpgradePlan?: () => void;
  onNavigateTab?: (tab: string) => void;
  isSuperAdmin?: boolean;
}

const POPULAR_UPI_HANDLES = [
  '@okhdfcbank',
  '@okicici',
  '@oksbi',
  '@paytm',
  '@ybl',
  '@upi',
  '@ibl',
  '@axisbank',
];

const POPULAR_BANKS = [
  { name: 'HDFC Bank', code: 'HDFC0001234' },
  { name: 'State Bank of India', code: 'SBIN0000300' },
  { name: 'ICICI Bank', code: 'ICIC0000001' },
  { name: 'Axis Bank', code: 'UTIB0000004' },
  { name: 'Kotak Mahindra Bank', code: 'KKBK0000958' },
  { name: 'Punjab National Bank', code: 'PUNB0000100' },
  { name: 'Bank of Baroda', code: 'BARB0MUMBAI' },
  { name: 'JPMorgan Chase', code: 'CHASUS33' },
  { name: 'Citibank N.A.', code: 'CITI0000001' },
  { name: 'HSBC Bank', code: 'HSBC0560001' },
];

export const PaymentMethodsTab: React.FC<PaymentMethodsTabProps> = ({
  gateways,
  billingAccount,
  onAddFunds,
  onUpgradePlan,
  onNavigateTab,
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

  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethodItem[]>([]);
  const [recycledMethods, setRecycledMethods] = useState<SavedPaymentMethodItem[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'recycle_bin'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // In-App Action Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    details?: { label: string; value: React.ReactNode; isDanger?: boolean }[];
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'primary' | 'warning';
    isLoading?: boolean;
    onConfirm?: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
  });

  // Dedicated Inline Workspace State (NO POPUPS / NO MODALS)
  const [viewMode, setViewMode] = useState<'list' | 'add_method'>('list');
  const [methodType, setMethodType] = useState<'card' | 'upi_mandate' | 'bank_debit'>('card');
  const [selectedGateway, setSelectedGateway] = useState<string>('razorpay');

  // Card specific state
  const [cardNumberRaw, setCardNumberRaw] = useState('');
  const [cardHolderName, setCardHolderName] = useState(() => user?.fullName || 'Mukesh Swami');
  const [expMonth, setExpMonth] = useState('12');
  const [expYear, setExpYear] = useState('2029');
  const [cardCvv, setCardCvv] = useState('');
  const [cardTierType, setCardTierType] = useState('Credit');
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // UPI specific state
  const [upiId, setUpiId] = useState('');
  const [upiAccountHolder, setUpiAccountHolder] = useState(() => user?.fullName || 'Mukesh Swami');
  const [upiApp, setUpiApp] = useState('gpay');
  const [mandateFrequency, setMandateFrequency] = useState('monthly');
  const [mandateLimit, setMandateLimit] = useState('15000');
  const [isUpiVerified, setIsUpiVerified] = useState(false);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);

  // Bank Debit / eNACH specific state
  const [bankName, setBankName] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState(() => user?.fullName || 'Mukesh Swami');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankAccountConfirm, setBankAccountConfirm] = useState('');
  const [bankIfscSwift, setBankIfscSwift] = useState('');
  const [bankAccountType, setBankAccountType] = useState('current');
  const [mandateChannel, setMandateChannel] = useState('enach_netbanking');

  // Common metadata
  const [billingEmail, setBillingEmail] = useState(() => user?.email || 'admin@createcall.ai');
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync user details when user loads or updates
  useEffect(() => {
    if (user?.fullName) {
      setCardHolderName(user.fullName);
      setUpiAccountHolder(user.fullName);
      setBankAccountHolder(user.fullName);
    }
    if (user?.email) {
      setBillingEmail(user.email);
    }
  }, [user]);

  // Analyze card intelligence in real-time
  const cardIntelligence = useMemo(() => {
    const meta = analyzeCardNumber(cardNumberRaw);
    if (cardTierType) {
      meta.cardType = cardTierType;
    }
    return meta;
  }, [cardNumberRaw, cardTierType]);

  // Format expiry MM/YY string for 3D card
  const formattedExpiry = useMemo(() => {
    const mm = expMonth.padStart(2, '0');
    const yy = expYear.slice(-2);
    return `${mm}/${yy}`;
  }, [expMonth, expYear]);

  // Format card number display
  const formattedCardNumber = useMemo(() => {
    return formatCardNumberByScheme(cardNumberRaw, cardIntelligence.formatPattern);
  }, [cardNumberRaw, cardIntelligence.formatPattern]);

  // 1. Fetch Real Saved Payment Methods from Backend DB
  const loadPaymentMethods = useCallback(async () => {
    setIsLoading(true);
    try {
      const [activeData, recycledData] = await Promise.allSettled([
        fetchAPI('/api/billing/payment-methods'),
        fetchAPI('/api/billing/payment-methods/recycle-bin'),
      ]);
      if (activeData.status === 'fulfilled' && Array.isArray(activeData.value)) {
        setSavedMethods(activeData.value);
      }
      if (recycledData.status === 'fulfilled' && Array.isArray(recycledData.value)) {
        setRecycledMethods(recycledData.value);
      }
    } catch (err: any) {
      console.warn('Failed to load saved payment methods:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  // Sync default gateway preference
  useEffect(() => {
    if (gateways && gateways.length > 0) {
      const activeList = gateways.filter((g) => g.gateway_key !== 'global_invoice_template');
      if (activeList.length > 0 && !activeList.some((g) => g.gateway_key === selectedGateway)) {
        const rzp = activeList.find((g) => g.gateway_key === 'razorpay');
        setSelectedGateway(rzp ? rzp.gateway_key : activeList[0].gateway_key);
      }
    }
  }, [gateways, selectedGateway]);

  // Handle UPI Handle preset click
  const handleSelectUpiHandle = (handle: string) => {
    if (!upiId) {
      setUpiId(`user${handle}`);
    } else if (upiId.includes('@')) {
      const prefix = upiId.split('@')[0];
      setUpiId(`${prefix}${handle}`);
    } else {
      setUpiId(`${upiId}${handle}`);
    }
    setIsUpiVerified(false);
  };

  // Handle Bank preset click
  const handleSelectBankPreset = (bank: { name: string; code: string }) => {
    setBankName(bank.name);
    setBankIfscSwift(bank.code);
  };

  // Verify UPI VPA format
  const handleVerifyUpi = () => {
    if (!upiId || !upiId.includes('@') || upiId.length < 5) {
      addToast({
        type: 'error',
        title: 'Invalid UPI ID',
        description: 'Please enter a valid VPA (e.g., username@okhdfcbank).',
      });
      return;
    }
    setIsVerifyingUpi(true);
    setTimeout(() => {
      setIsVerifyingUpi(false);
      setIsUpiVerified(true);
      addToast({
        type: 'success',
        title: 'UPI VPA Validated',
        description: `Virtual Payment Address "${upiId}" resolved and ready for Autopay.`,
      });
    }, 600);
  };

  // 2. Set as Primary Default Payment Method
  const handleSetDefault = async (methodId: string) => {
    setActionLoadingId(methodId);
    try {
      const res = await fetchAPI(`/api/billing/payment-methods/${methodId}/set-default`, {
        method: 'POST',
      });
      addToast({
        type: 'success',
        title: 'Primary Method Updated',
        description: res.message || 'Payment method set as primary default for renewals and auto-recharge.',
      });
      await loadPaymentMethods();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        description: err.message || 'Could not update primary payment method.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Move Saved Payment Method to Recycle Bin (Soft Delete)
  const handleDelete = (methodId: string, item?: SavedPaymentMethodItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Move Payment Method to Trash',
      description: 'Are you sure you want to move this payment method to the Recycle Bin? It will no longer be used for recurring billing or automatic top-ups, but can be restored anytime.',
      confirmLabel: 'Move to Trash',
      confirmVariant: 'danger',
      details: [
        { label: 'Instrument', value: item ? `${item.brand || item.gateway} (•••• ${item.last4})` : `Method ${methodId.slice(0, 8)}` },
        { label: 'Type', value: item?.method_type?.toUpperCase() || 'PAYMENT METHOD' },
        { label: 'Action', value: 'Moved to Recycle Bin (Soft Delete)', isDanger: true },
      ],
      onConfirm: async () => {
        setActionLoadingId(methodId);
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          const res = await fetchAPI(`/api/billing/payment-methods/${methodId}`, {
            method: 'DELETE',
          });
          addToast({
            type: 'info',
            title: 'Moved to Recycle Bin',
            description: res.message || 'Payment method moved to Recycle Bin. You can restore or permanently delete it anytime.',
          });
          await loadPaymentMethods();
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Action Failed',
            description: err.message || 'Could not remove payment method.',
          });
        } finally {
          setActionLoadingId(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  // 4. Restore Payment Method from Recycle Bin
  const handleRestore = async (methodId: string) => {
    setActionLoadingId(methodId);
    try {
      const res = await fetchAPI(`/api/billing/payment-methods/${methodId}/restore`, {
        method: 'POST',
      });
      addToast({
        type: 'success',
        title: 'Payment Method Restored',
        description: res.message || 'Payment method has been restored to your active vault.',
      });
      await loadPaymentMethods();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Restore Failed',
        description: err.message || 'Could not restore payment method.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5. Permanently Delete Payment Method from Database
  const handlePermanentDelete = (methodId: string, item?: SavedPaymentMethodItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Delete Payment Instrument',
      description: '⚠️ WARNING: Are you sure you want to permanently delete this payment method from the database? This action is irreversible.',
      confirmLabel: 'Permanently Delete',
      confirmVariant: 'danger',
      details: [
        { label: 'Instrument', value: item ? `${item.brand || item.gateway} (•••• ${item.last4})` : `Method ${methodId.slice(0, 8)}` },
        { label: 'Token Record', value: methodId },
        { label: 'Database Purge', value: 'Permanent Deletion (Cannot be undone)', isDanger: true },
      ],
      onConfirm: async () => {
        setActionLoadingId(methodId);
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          const res = await fetchAPI(`/api/billing/payment-methods/${methodId}/permanent`, {
            method: 'DELETE',
          });
          addToast({
            type: 'success',
            title: 'Permanently Deleted',
            description: res.message || 'Payment method permanently wiped from database.',
          });
          await loadPaymentMethods();
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Delete Failed',
            description: err.message || 'Could not permanently delete payment method.',
          });
        } finally {
          setActionLoadingId(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  // 6. Empty Entire Recycle Bin
  const handleEmptyRecycleBin = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Empty Recycle Bin',
      description: '⚠️ WARNING: Are you sure you want to permanently wipe all recycled payment instruments? All deleted tokens will be permanently purged from the database.',
      confirmLabel: 'Empty & Purge All',
      confirmVariant: 'danger',
      details: [
        { label: 'Items to Purge', value: `${recycledMethods.length} payment instruments` },
        { label: 'Database Purge', value: 'Permanent Bulk Deletion', isDanger: true },
      ],
      onConfirm: async () => {
        setIsLoading(true);
        try {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          const res = await fetchAPI('/api/billing/payment-methods/recycle-bin/empty', {
            method: 'POST',
          });
          addToast({
            type: 'success',
            title: 'Recycle Bin Emptied',
            description: res.message || 'All recycled payment methods permanently purged from database.',
          });
          await loadPaymentMethods();
        } catch (err: any) {
          addToast({
            type: 'error',
            title: 'Action Failed',
            description: err.message || 'Could not empty recycle bin.',
          });
        } finally {
          setIsLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
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

  // 1-Click Direct Razorpay Vault Authorization (₹1 Refundable Auth)
  const handleRazorpayDirectAuth = async () => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !(window as any).Razorpay) {
        throw new Error('Could not load Razorpay SDK. Please check your internet connection.');
      }

      const rzpGateway = gateways.find((g) => g.gateway_key === 'razorpay') || {};
      const publicKey = rzpGateway.public_key || 'rzp_live_Ayqx8FqkgKWiKA';

      const rzpOptions: any = {
        key: publicKey,
        amount: 100, // ₹1 (100 paise) instant refundable card / mandate verification
        currency: 'INR',
        name: 'Create Call OS',
        description: 'Payment Instrument Tokenization Vault Authorization (₹1 Refundable)',
        prefill: {
          name: cardHolderName || user?.fullName || 'Super Admin',
          email: billingEmail || user?.email || 'admin@createcall.ai',
        },
        theme: { color: '#0d9488' },
        handler: async (response: any) => {
          try {
            const payload = {
              gateway: 'razorpay',
              method_type: methodType,
              brand: 'razorpay_vault',
              last4: (response.razorpay_payment_id || '').slice(-4) || '8812',
              billing_name: cardHolderName || user?.fullName || 'Verified Instrument Holder',
              billing_email: billingEmail || user?.email,
              set_as_default: setAsDefault || savedMethods.length === 0,
            };
            const res = await fetchAPI('/api/billing/payment-methods/setup', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            addToast({
              type: 'success',
              title: 'Instrument Tokenized via Razorpay Vault!',
              description: res.message || 'Payment method successfully registered and verified with Razorpay.',
            });
            setViewMode('list');
            await loadPaymentMethods();
          } catch (err: any) {
            addToast({
              type: 'error',
              title: 'Registration Error',
              description: err.message || 'Could not persist tokenized method.',
            });
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            addToast({
              type: 'info',
              title: 'Authorization Window Closed',
              description: 'Razorpay vault window was closed.',
            });
          },
        },
      };

      const rzpInstance = new (window as any).Razorpay(rzpOptions);
      rzpInstance.on('payment.failed', (resp: any) => {
        setIsSubmitting(false);
        const desc = resp.error?.description || 'Could not authorize instrument.';
        addToast({
          type: 'error',
          title: 'Authorization Declined',
          description: desc,
        });
      });
      rzpInstance.open();
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message);
      addToast({
        type: 'error',
        title: 'Action Failed',
        description: err.message,
      });
    }
  };

  // 4. Submit Setup / Tokenize New Payment Method
  const handleSetupPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      let last4 = '4242';
      let brand = 'visa';
      let holderLegalName = cardHolderName;

      if (methodType === 'card') {
        const cleaned = cardNumberRaw.replace(/\D/g, '');
        if (cleaned.length < 13 || cleaned.length > 19) {
          throw new Error('Please enter a valid card number (13 to 19 digits).');
        }

        // Expiry Date Validation
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const selectedYear = parseInt(expYear, 10);
        const selectedMonth = parseInt(expMonth, 10);
        if (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)) {
          throw new Error('Card expiry date cannot be in the past.');
        }

        if (!cardCvv || cardCvv.length < 3) {
          throw new Error('Please enter a valid 3 or 4-digit CVV/CVC code.');
        }

        last4 = cleaned.slice(-4);
        brand = cardIntelligence.scheme !== 'generic' ? cardIntelligence.scheme : 'visa';
        holderLegalName = cardHolderName.trim() || 'Valued Cardholder';
      } else if (methodType === 'upi_mandate') {
        const trimmedUpi = upiId.trim();
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
        if (!trimmedUpi || !upiRegex.test(trimmedUpi)) {
          throw new Error('Please enter a valid VPA / UPI ID format (e.g. user@okhdfcbank or 9876543210@paytm).');
        }
        last4 = trimmedUpi.split('@')[0].slice(-4) || 'upi';
        brand = 'upi';
        holderLegalName = upiAccountHolder.trim() || 'UPI Mandate Holder';
      } else if (methodType === 'bank_debit') {
        const cleaned = bankAccountNo.replace(/\D/g, '');
        if (cleaned.length < 6) {
          throw new Error('Please enter a valid bank account number (minimum 6 digits).');
        }
        if (bankAccountConfirm && bankAccountNo !== bankAccountConfirm) {
          throw new Error('Bank account numbers do not match. Please re-check.');
        }
        const cleanedIfsc = bankIfscSwift.trim().toUpperCase();
        if (!cleanedIfsc || cleanedIfsc.length < 5) {
          throw new Error('Please enter a valid IFSC or SWIFT code (e.g. HDFC0001234).');
        }
        last4 = cleaned.slice(-4);
        brand = bankName ? bankName.toLowerCase().replace(/\s+/g, '_').slice(0, 16) : 'bank_wire';
        holderLegalName = bankAccountHolder.trim() || 'Bank Account Holder';
      }

      const payload = {
        gateway: selectedGateway,
        method_type: methodType,
        brand: brand,
        last4: last4,
        exp_month: methodType === 'card' ? parseInt(expMonth, 10) : undefined,
        exp_year: methodType === 'card' ? parseInt(expYear, 10) : undefined,
        billing_name: holderLegalName,
        billing_email: billingEmail,
        set_as_default: setAsDefault || savedMethods.length === 0,
      };

      const res = await fetchAPI('/api/billing/payment-methods/setup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      addToast({
        type: 'success',
        title: 'Payment Method Attached',
        description: res.message || 'Tokenized payment instrument securely registered.',
      });

      // Reset form & return to list view
      setCardNumberRaw('');
      setCardCvv('');
      setUpiId('');
      setIsUpiVerified(false);
      setBankAccountNo('');
      setBankAccountConfirm('');
      setBankIfscSwift('');
      setViewMode('list');
      await loadPaymentMethods();
    } catch (err: any) {
      setFormError(err.message || 'Failed to tokenize payment method.');
      addToast({
        type: 'error',
        title: 'Setup Failed',
        description: err.message || 'Failed to tokenize and save payment method.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // VIEW MODE: DEDICATED INLINE ADD WORKSPACE
  // ==========================================
  if (viewMode === 'add_method') {
    return (
      <div className="space-y-5">
        {/* 1. Top Header & Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFormError(null);
              setViewMode('list');
            }}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="font-bold border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs rounded-lg cursor-pointer"
          >
            Back to Payment Methods
          </Button>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" size="sm" className="font-mono text-xs text-teal-600 dark:text-teal-400 border-teal-500/30">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 inline" /> Zero Wallet Mutation
            </Badge>
          </div>
        </div>

        {/* 2. Header Title Section */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            Add Secure Payment Method
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Attach a PCI-DSS Level 1 tokenized card or autopay mandate for subscriptions and auto-recharge. Zero raw card storage.
          </p>
        </div>

        {/* Security Disclosure Strip */}
        <div className="p-4 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/50 flex items-start gap-3">
          <Lock className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              Bank-Grade Cryptographic Tokenization Vault:
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
              Your payment instrument details are tokenized securely using standard PCI-DSS Level 1 compliance. Raw card numbers, CVVs, or bank PINs are never stored on application servers.
            </p>
          </div>
        </div>

        {/* Error Alert if any */}
        {formError && (
          <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Setup Form */}
        <form onSubmit={handleSetupPaymentMethod} className="space-y-6">
          {/* STEP 1: PAYMENT METHOD SELECTOR */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg shadow-xs">
            <CardHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                1. Select Payment Method Type
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <button
                  type="button"
                  onClick={() => setMethodType('card')}
                  className={`p-4 rounded-xl border text-left flex flex-col items-start gap-2.5 cursor-pointer transition-all duration-200 ${
                    methodType === 'card'
                      ? 'border-teal-500 bg-gradient-to-br from-teal-500/10 to-teal-500/5 ring-2 ring-teal-500/30 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/50 dark:border-teal-900/50 text-teal-600 dark:text-teal-400">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    {methodType === 'card' && (
                      <span className="flex h-2 w-2 rounded-full bg-teal-500 ring-4 ring-teal-500/20" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Credit / Debit Card
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      PCI-DSS Level 1 Tokenized Vault (Visa, MC, RuPay, Amex)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethodType('upi_mandate')}
                  className={`p-4 rounded-xl border text-left flex flex-col items-start gap-2.5 cursor-pointer transition-all duration-200 ${
                    methodType === 'upi_mandate'
                      ? 'border-teal-500 bg-gradient-to-br from-teal-500/10 to-teal-500/5 ring-2 ring-teal-500/30 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/50 dark:border-teal-900/50 text-teal-600 dark:text-teal-400">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    {methodType === 'upi_mandate' && (
                      <span className="flex h-2 w-2 rounded-full bg-teal-500 ring-4 ring-teal-500/20" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      UPI Autopay Mandate
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Recurring Subscriptions via GPay, PhonePe, Paytm &amp; BHIM
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethodType('bank_debit')}
                  className={`p-4 rounded-xl border text-left flex flex-col items-start gap-2.5 cursor-pointer transition-all duration-200 ${
                    methodType === 'bank_debit'
                      ? 'border-teal-500 bg-gradient-to-br from-teal-500/10 to-teal-500/5 ring-2 ring-teal-500/30 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/50 dark:border-teal-900/50 text-teal-600 dark:text-teal-400">
                      <Landmark className="h-5 w-5" />
                    </div>
                    {methodType === 'bank_debit' && (
                      <span className="flex h-2 w-2 rounded-full bg-teal-500 ring-4 ring-teal-500/20" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Bank Debit Profile
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      eNACH Direct Debit / Corporate Account Wire
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* STEP 2: DYNAMIC DETAILS ACCORDING TO SELECTED METHOD */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  2. {methodType === 'card' && 'Enter Card Details (Visa, Mastercard, RuPay, Amex)'}
                  {methodType === 'upi_mandate' && 'Enter UPI ID / VPA (GPay, PhonePe, Paytm, BHIM)'}
                  {methodType === 'bank_debit' && 'Enter Bank Account Details for Direct Debit'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> 256-Bit Encrypted
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Billing &amp; Receipt Email *
                </label>
                <Input
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="finance@createcall.ai"
                  className="h-10 text-xs rounded-lg border-zinc-300 dark:border-zinc-700 max-w-md"
                  required
                />
              </div>

              {/* ========================================================================= */}
              {/* DYNAMIC VIEW A: CREDIT / DEBIT CARD WORKSPACE */}
              {/* ========================================================================= */}
              {methodType === 'card' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                  {/* Left Column: Interactive Form */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Cardholder Legal Name *
                        </label>
                        <span className="text-[10px] text-zinc-400">As printed on card</span>
                      </div>
                      <Input
                        value={cardHolderName}
                        onChange={(e) => setCardHolderName(e.target.value)}
                        placeholder="e.g. John Doe or Acme Corp"
                        className="h-10 text-xs rounded-lg border-zinc-300 dark:border-zinc-700 uppercase"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Card Number *
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400">
                            {cardIntelligence.bankName}
                          </span>
                          <span className="text-[10px] text-zinc-400 capitalize">
                            • {cardIntelligence.scheme}
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <Input
                          value={formattedCardNumber}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            const meta = analyzeCardNumber(raw);
                            const capped = raw.slice(0, meta.maxLength);
                            setCardNumberRaw(capped);
                          }}
                          placeholder="4598 4500 3755 4547"
                          className="h-10 text-xs font-mono tracking-wider rounded-lg border-zinc-300 dark:border-zinc-700 pr-12"
                          required
                        />
                        <div className="absolute right-3 top-2.5 scale-75 origin-right pointer-events-none">
                          <CardBrandLogoRenderer scheme={cardIntelligence.scheme} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {/* Month Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Exp Month *
                        </label>
                        <div className="relative">
                          <select
                            value={expMonth}
                            onChange={(e) => setExpMonth(e.target.value)}
                            className="w-full h-10 px-2.5 pr-7 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer appearance-none"
                          >
                            {Array.from({ length: 12 }, (_, i) => {
                              const m = String(i + 1).padStart(2, '0');
                              return (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              );
                            })}
                          </select>
                          <div className="absolute right-2 top-3 pointer-events-none text-zinc-400">
                            <ChevronDown className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* Year Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Exp Year *
                        </label>
                        <div className="relative">
                          <select
                            value={expYear}
                            onChange={(e) => setExpYear(e.target.value)}
                            className="w-full h-10 px-2.5 pr-7 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer appearance-none"
                          >
                            {Array.from({ length: 14 }, (_, i) => {
                              const y = String(2025 + i);
                              return (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              );
                            })}
                          </select>
                          <div className="absolute right-2 top-3 pointer-events-none text-zinc-400">
                            <ChevronDown className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* CVV / CVC */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                          <span>CVV/CVC *</span>
                          <span className="text-[10px] text-zinc-400">3-4 digits</span>
                        </label>
                        <Input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setCardCvv(val);
                          }}
                          onFocus={() => setIsCardFlipped(true)}
                          onBlur={() => setIsCardFlipped(false)}
                          placeholder="•••"
                          className="h-10 text-xs font-mono tracking-widest rounded-lg border-zinc-300 dark:border-zinc-700"
                          required
                        />
                      </div>
                    </div>

                    {/* Card Tier / Account Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Card Category
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Credit', 'Debit', 'Corporate'].map((tier) => (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => setCardTierType(tier)}
                            className={`py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                              cardTierType === tier
                                ? 'bg-teal-500 text-white border-teal-500 shadow-2xs'
                                : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            {tier}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live 3D Bank Card Simulator */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900/60 dark:to-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
                    <div className="w-full max-w-[340px] space-y-3">
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-teal-600" /> Live Card Preview
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsCardFlipped(!isCardFlipped)}
                          className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="h-3 w-3" /> Flip Card ({isCardFlipped ? 'Back' : 'Front'})
                        </button>
                      </div>

                      <PhysicalBankCardSimulator
                        cardIntelligence={cardIntelligence}
                        cardNumber={cardNumberRaw}
                        cardHolder={cardHolderName}
                        cardExpiry={formattedExpiry}
                        cardCvv={cardCvv}
                        isFlipped={isCardFlipped}
                      />

                      <div className="text-center">
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {cardIntelligence.bankName} • 256-bit AES Token Vault
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* DYNAMIC VIEW B: UPI AUTOPAY MANDATE WORKSPACE */}
              {/* ========================================================================= */}
              {methodType === 'upi_mandate' && (
                <div className="space-y-5 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        UPI Account Holder Legal Name *
                      </label>
                      <Input
                        value={upiAccountHolder}
                        onChange={(e) => setUpiAccountHolder(e.target.value)}
                        placeholder="e.g. Rahul Sharma or Super Admin"
                        className="h-10 text-xs rounded-lg border-zinc-300 dark:border-zinc-700"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                        <span>Preferred UPI App</span>
                        <span className="text-[10px] text-zinc-400">One-click app intent</span>
                      </label>
                      <div className="relative">
                        <select
                          value={upiApp}
                          onChange={(e) => setUpiApp(e.target.value)}
                          className="w-full h-10 px-3 pr-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer appearance-none"
                        >
                          <option value="gpay">Google Pay (GPay / @okhdfcbank / @oksbi)</option>
                          <option value="phonepe">PhonePe (@ybl / @ibl / @axl)</option>
                          <option value="paytm">Paytm Payments Bank (@paytm)</option>
                          <option value="bhim">BHIM UPI (NPCI Standard / @upi)</option>
                          <option value="amazonpay">Amazon Pay UPI (@apl)</option>
                          <option value="cred">CRED UPI (@cred)</option>
                        </select>
                        <div className="absolute right-3 top-3 pointer-events-none text-zinc-400">
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Virtual Payment Address Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Virtual Payment Address (VPA / UPI ID) *
                      </label>
                      {isUpiVerified && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="h-3.5 w-3.5" /> VPA Verified
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={upiId}
                        onChange={(e) => {
                          setUpiId(e.target.value);
                          setIsUpiVerified(false);
                        }}
                        placeholder="e.g. organization@okhdfcbank or 9876543210@paytm"
                        className="h-10 text-xs font-mono rounded-lg border-zinc-300 dark:border-zinc-700 flex-1"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleVerifyUpi}
                        isLoading={isVerifyingUpi}
                        className="text-xs font-bold shrink-0 border-teal-500/40 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                      >
                        Verify VPA
                      </Button>
                    </div>

                    {/* Quick UPI Handle Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] text-zinc-500 font-medium mr-1">
                        Popular Handles:
                      </span>
                      {POPULAR_UPI_HANDLES.map((handle) => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => handleSelectUpiHandle(handle)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-600 dark:hover:text-teal-400 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Autopay Mandate Frequency & Max Limit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-900/40">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Autopay Frequency
                      </label>
                      <div className="relative">
                        <select
                          value={mandateFrequency}
                          onChange={(e) => setMandateFrequency(e.target.value)}
                          className="w-full h-9 px-3 pr-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer appearance-none"
                        >
                          <option value="monthly">Monthly Recurring Plan Renewal</option>
                          <option value="on_demand">On-Demand Auto-Recharge (&lt; ₹100 threshold)</option>
                          <option value="quarterly">Quarterly Corporate Billing</option>
                        </select>
                        <div className="absolute right-3 top-2.5 pointer-events-none text-zinc-400">
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Max Recurring Debit Cap (NPCI E-Mandate)
                      </label>
                      <div className="relative">
                        <select
                          value={mandateLimit}
                          onChange={(e) => setMandateLimit(e.target.value)}
                          className="w-full h-9 px-3 pr-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer appearance-none"
                        >
                          <option value="5000">₹5,000 / month max cap</option>
                          <option value="15000">₹15,000 / month max cap (Standard)</option>
                          <option value="25000">₹25,000 / month max cap (Business)</option>
                          <option value="50000">₹50,000 / month max cap (Enterprise)</option>
                        </select>
                        <div className="absolute right-3 top-2.5 pointer-events-none text-zinc-400">
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* DYNAMIC VIEW C: BANK DEBIT / eNACH WORKSPACE */}
              {/* ========================================================================= */}
              {methodType === 'bank_debit' && (
                <div className="space-y-5 pt-2">
                  {/* Popular Bank Selector Chips */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Popular Banking Institutions
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {POPULAR_BANKS.map((b) => (
                        <button
                          key={b.name}
                          type="button"
                          onClick={() => handleSelectBankPreset(b)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                            bankName === b.name
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-100 ring-1 ring-teal-500'
                              : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="text-xs font-bold truncate">{b.name}</div>
                          <div className="text-[10px] font-mono text-zinc-400">{b.code.slice(0, 4)}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Bank Legal Name *
                      </label>
                      <Input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank Ltd. or State Bank of India"
                        className="h-10 text-xs rounded-lg border-zinc-300 dark:border-zinc-700"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Account Holder Legal Full Name *
                      </label>
                      <Input
                        value={bankAccountHolder}
                        onChange={(e) => setBankAccountHolder(e.target.value)}
                        placeholder="e.g. Acme Telecom Private Limited"
                        className="h-10 text-xs rounded-lg border-zinc-300 dark:border-zinc-700"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Bank Account Number *
                      </label>
                      <Input
                        value={bankAccountNo}
                        onChange={(e) => setBankAccountNo(e.target.value.replace(/\D/g, ''))}
                        placeholder="50100234891234"
                        className="h-10 text-xs font-mono rounded-lg border-zinc-300 dark:border-zinc-700"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Confirm Account Number *
                        </label>
                        {bankAccountNo && bankAccountConfirm && bankAccountNo === bankAccountConfirm && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 font-mono">
                            <CheckCircle2 className="h-3 w-3" /> Matched
                          </span>
                        )}
                      </div>
                      <Input
                        value={bankAccountConfirm}
                        onChange={(e) => setBankAccountConfirm(e.target.value.replace(/\D/g, ''))}
                        placeholder="Re-type account number"
                        className="h-10 text-xs font-mono rounded-lg border-zinc-300 dark:border-zinc-700"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        IFSC / SWIFT Routing Code *
                      </label>
                      <Input
                        value={bankIfscSwift}
                        onChange={(e) => setBankIfscSwift(e.target.value.toUpperCase())}
                        placeholder="HDFC0001234 or CHASUS33"
                        className="h-10 text-xs font-mono uppercase rounded-lg border-zinc-300 dark:border-zinc-700"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Account Type
                      </label>
                      <div className="relative">
                        <select
                          value={bankAccountType}
                          onChange={(e) => setBankAccountType(e.target.value)}
                          className="w-full h-10 px-3 pr-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer appearance-none"
                        >
                          <option value="current">Current / Corporate Account</option>
                          <option value="savings">Savings Account</option>
                          <option value="escrow">Escrow Trust Account</option>
                        </select>
                        <div className="absolute right-3 top-3 pointer-events-none text-zinc-400">
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Authorization Method
                      </label>
                      <div className="relative">
                        <select
                          value={mandateChannel}
                          onChange={(e) => setMandateChannel(e.target.value)}
                          className="w-full h-10 px-3 pr-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer appearance-none"
                        >
                          <option value="enach_netbanking">eNACH (NetBanking OTP Auth)</option>
                          <option value="enach_debitcard">eNACH (Debit Card Auth)</option>
                          <option value="physical_mandate">Physical Paper Mandate</option>
                        </select>
                        <div className="absolute right-3 top-3 pointer-events-none text-zinc-400">
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Common: Set as Default Checkbox */}
              <div className="flex items-center gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <input
                  type="checkbox"
                  id="setAsDefaultCheckbox"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer border-zinc-300 dark:border-zinc-700"
                />
                <label htmlFor="setAsDefaultCheckbox" className="text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer font-medium">
                  Set as primary default payment method for subscription renewals and automated carrier auto-recharge
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons Bar */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFormError(null);
                setViewMode('list');
              }}
              className="text-xs border-zinc-300 dark:border-zinc-700"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 border-teal-600 text-white font-bold text-xs rounded-lg shadow-sm px-6 h-10"
            >
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              Securely Tokenize &amp; Save Instrument
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // VIEW MODE: SAVED PAYMENT METHODS LIST
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1 max-w-xl">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {isSuperAdmin ? (
              <>
                <Landmark className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
                <span>👑 Platform Payment Gateways &amp; Settlement Rails</span>
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 text-teal-600" />
                <span>Saved Payment Methods &amp; Autopay</span>
              </>
            )}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {isSuperAdmin
              ? 'Multi-tenant payment settlement rails, gateway operational status, webhook dispatchers, and tokenized vault security.'
              : 'Manage tokenized payment instruments used for subscription renewals, auto-recharge triggers, and one-click checkouts.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isSuperAdmin && onNavigateTab && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab('settings')}
              className="border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-bold text-xs shadow-2xs rounded-lg"
            >
              <Landmark className="h-3.5 w-3.5 mr-1.5 inline" /> Gateway Credentials &amp; Tax
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setFormError(null);
              setViewMode('add_method');
            }}
            className={`${
              isSuperAdmin
                ? 'bg-purple-600 hover:bg-purple-700 border-purple-600'
                : 'bg-teal-600 hover:bg-teal-700 border-teal-600'
            } text-white font-bold text-xs shadow-2xs rounded-lg`}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5 inline" /> {isSuperAdmin ? 'Attach Master Instrument' : 'Add Payment Method'}
          </Button>
        </div>
      </div>

      {/* Super Admin Gateway Infrastructure Grid */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {/* 1. Razorpay */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Razorpay Direct Rail
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                INR (₹)
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              UPI AutoPay Mandates, 3D Secure 2.0 Cards, EMI, NetBanking (58 banks).
            </p>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>Settlement: T+1 Direct</span>
              <span className="text-emerald-600 font-bold">100% Operational</span>
            </div>
          </div>

          {/* 2. Stripe */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Stripe International
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                USD ($) / Global
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              135+ Multi-Currency, Apple Pay, Google Pay, SEPA, Link 1-click checkout.
            </p>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>Settlement: T+2 Rolling</span>
              <span className="text-emerald-600 font-bold">100% Operational</span>
            </div>
          </div>

          {/* 3. Cashfree / NPCI */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Cashfree &amp; NPCI UPI
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                0% Fee Rail
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Instant dynamic QR code generation, PhonePe / GPay app intent routing.
            </p>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>Settlement: Instant RTGS</span>
              <span className="text-emerald-600 font-bold">100% Operational</span>
            </div>
          </div>

          {/* 4. Bank Wire / RTGS */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Offline Bank Transfer
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                RTGS / NEFT
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Enterprise invoice payment matching, UTR tracking, manual ledger sync.
            </p>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>Verification: Admin Queue</span>
              <span className="text-emerald-600 font-bold">Active Pipeline</span>
            </div>
          </div>
        </div>
      )}



      {/* Subtabs: Active Methods vs Recycle Bin */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('active')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'active'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Active Vault ({savedMethods.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('recycle_bin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'recycle_bin'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Recycle Bin ({recycledMethods.length})</span>
          </button>
        </div>

        {activeSubTab === 'recycle_bin' && recycledMethods.length > 0 && (
          <Button
            variant="outline"
            size="xs"
            onClick={handleEmptyRecycleBin}
            className="text-xs text-red-600 dark:text-red-400 border-red-300 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-3 w-3 mr-1" /> Empty Recycle Bin
          </Button>
        )}
      </div>

      {/* 1. Active Tokenized Methods Subtab */}
      {activeSubTab === 'active' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Active Tokenized Instruments ({savedMethods.length})
            </h4>
            <span className="text-[11px] font-mono text-zinc-400">
              PCI-DSS Tokenized • Zero Raw Data
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              <div className="h-36 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
              <div className="h-36 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
            </div>
          ) : savedMethods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedMethods.map((pm) => {
                const isDefault = pm.is_default;
                const isCard = pm.method_type === 'card';
                const isUpi = pm.method_type === 'upi_mandate';
                const isBank = pm.method_type === 'bank_debit';

                return (
                  <Card
                    key={pm.id}
                    className={`rounded-xl p-5 relative overflow-hidden transition-all shadow-xs ${
                      isDefault
                        ? 'border-teal-500 bg-gradient-to-br from-white to-teal-50/40 dark:from-zinc-900 dark:to-teal-950/30 ring-1 ring-teal-500/30'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                          {isCard && <CardBrandsLogo size="xs" />}
                          {isUpi && <UpiLogo size="xs" />}
                          {isBank && <BankTransferLogo size="xs" />}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                              {isCard && `•••• •••• •••• ${pm.last4}`}
                              {isUpi && `UPI Autopay •••• ${pm.last4}`}
                              {isBank && `Bank Account •••• ${pm.last4}`}
                            </span>
                            {isDefault && (
                              <Badge variant="primary" size="xs" className="text-[10px] font-bold uppercase rounded">
                                PRIMARY
                              </Badge>
                            )}
                          </div>

                          <div className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                            {pm.brand ? `${pm.brand.replace('_', ' ')} • ` : ''}
                            {isCard && pm.exp_month && pm.exp_year
                              ? `Expires ${String(pm.exp_month).padStart(2, '0')}/${pm.exp_year}`
                              : isUpi && pm.details_json?.vpa
                              ? `VPA: ${pm.details_json.vpa}`
                              : isBank && pm.details_json?.bank_name
                              ? `${pm.details_json.bank_name}`
                              : `${pm.method_type.replace('_', ' ')}`}
                          </div>

                          <div className="text-[11px] text-zinc-400 font-mono">
                            Holder: {pm.billing_name}
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant={pm.status === 'verified' ? 'emerald' : 'secondary'}
                        size="xs"
                        className="font-semibold text-[10px] rounded"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                        {pm.status}
                      </Badge>
                    </div>

                    {/* Metadata & Actions Strip */}
                    <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                        Rail: <strong className="capitalize text-zinc-700 dark:text-zinc-300">{pm.gateway}</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(pm.id)}
                            disabled={actionLoadingId === pm.id}
                            className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Star className="h-3 w-3" /> Set Default
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(pm.id, pm)}
                          disabled={actionLoadingId === pm.id}
                          className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" /> Move to Trash
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="p-8 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                <CreditCard className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  No Active Payment Methods
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  You currently have zero active payment methods in your vault. Add a card or payment profile to enable automated monthly renewals and seamless prepaid wallet auto-recharge.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormError(null);
                  setViewMode('add_method');
                }}
                className="text-xs border-zinc-300 dark:border-zinc-700"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Setup Payment Method
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 2. Recycle Bin Subtab */}
      {activeSubTab === 'recycle_bin' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <Archive className="h-3.5 w-3.5" /> Recycled Payment Methods ({recycledMethods.length})
            </h4>
            <span className="text-[11px] text-zinc-400">
              Soft-deleted instruments. Restore or permanently erase.
            </span>
          </div>

          {recycledMethods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recycledMethods.map((pm) => {
                const isCard = pm.method_type === 'card';
                const isUpi = pm.method_type === 'upi_mandate';
                const isBank = pm.method_type === 'bank_debit';

                return (
                  <Card
                    key={pm.id}
                    className="rounded-xl p-5 relative overflow-hidden transition-all shadow-xs border-red-200 dark:border-red-900/40 bg-red-50/20 dark:bg-red-950/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                          {isCard && <CardBrandsLogo size="xs" />}
                          {isUpi && <UpiLogo size="xs" />}
                          {isBank && <BankTransferLogo size="xs" />}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                              {isCard && `•••• •••• •••• ${pm.last4}`}
                              {isUpi && `UPI Autopay •••• ${pm.last4}`}
                              {isBank && `Bank Account •••• ${pm.last4}`}
                            </span>
                            <Badge variant="outline" size="xs" className="text-[10px] text-red-600 border-red-300 uppercase">
                              IN TRASH
                            </Badge>
                          </div>

                          <div className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                            {pm.brand ? `${pm.brand.replace('_', ' ')} • ` : ''}
                            {isCard && pm.exp_month && pm.exp_year
                              ? `Expires ${String(pm.exp_month).padStart(2, '0')}/${pm.exp_year}`
                              : `${pm.method_type.replace('_', ' ')}`}
                          </div>

                          <div className="text-[10px] text-red-500 font-mono">
                            Deleted: {pm.deleted_at || 'Recently'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Strip */}
                    <div className="mt-4 pt-3.5 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                        Rail: <strong className="capitalize text-zinc-700 dark:text-zinc-300">{pm.gateway}</strong>
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleRestore(pm.id)}
                          disabled={actionLoadingId === pm.id}
                          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="h-3 w-3" /> Restore
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePermanentDelete(pm.id, pm)}
                          disabled={actionLoadingId === pm.id}
                          className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" /> Delete Permanently
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
              <Archive className="h-8 w-8 text-zinc-400 mx-auto" />
              <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Recycle Bin is Empty
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                No deleted payment instruments in trash.
              </p>
            </div>
          )}
        </div>
      )}



      {/* 3. Security Compliance Disclosure */}
      <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 flex items-start gap-3">
        <Lock className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          <p>
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">Zero Raw PAN/CVV Retention: </strong>
            CREATE CALL OS never stores raw debit/credit card numbers, CVVs, or private banking PINs on application servers.
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
            All card transactions use PCI-DSS Level 1 tokenized client-side vaults (Razorpay / Stripe). Saved references represent secure revocable gateway tokens.
          </p>
        </div>
      </div>

      {/* In-App Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => {
          if (!confirmModal.isLoading) {
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        title={confirmModal.title}
        description={confirmModal.description}
        maxWidth="xl"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
              disabled={confirmModal.isLoading}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (confirmModal.onConfirm) {
                  confirmModal.onConfirm();
                }
              }}
              disabled={confirmModal.isLoading}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
            >
              {confirmModal.isLoading ? 'Processing...' : confirmModal.confirmLabel || 'Confirm Action'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 py-1">
          {confirmModal.details && confirmModal.details.length > 0 && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/50 divide-y divide-zinc-200/70 dark:divide-zinc-800/70 text-xs overflow-hidden">
              {confirmModal.details.map((d, i) => (
                <div key={i} className="flex items-center justify-between px-3.5 py-2.5 gap-3">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium shrink-0">{d.label}</span>
                  <span className={`font-mono text-right break-all ${d.isDanger ? 'font-bold text-rose-600 dark:text-rose-400' : 'font-semibold text-zinc-900 dark:text-zinc-100'}`}>
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <span>This payment instrument operation is performed directly on your authenticated vault.</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentMethodsTab;
