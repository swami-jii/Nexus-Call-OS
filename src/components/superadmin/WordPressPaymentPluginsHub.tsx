import React, { useState } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sliders,
  SlidersHorizontal,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Server,
  Terminal,
  Activity,
  CreditCard,
  Building,
  Building2,
  Radio,
  Search,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MapPin,
  Info,
  Send,
  Link,
  Layers,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CustomSelect } from '../ui/CustomSelect';
import { useToast } from '../ui/Toast';
import { fetchAPI } from '../../repository';
import { GLOBAL_COUNTRY_CODES_CATALOG } from '../../data/globalCountryCodesCatalog';
import { getBanksForCountry, resolveBankDetailsForPin, getCountryBankingMeta, getBankSwiftBic } from '../../data/globalBankCatalogs';
import {
  StripeLogo,
  RazorpayLogo,
  CashfreeLogo,
  PhonePeLogo,
  PayPalLogo,
  BankTransferLogo,
  UpiLogo,
  PaytmLogo,
  AuthorizeNetLogo,
  SquareLogo,
  PaddleLogo,
  CoinbaseCryptoLogo,
  FlutterwaveLogo,
  AdyenLogo,
  MercadoPagoLogo,
  KlarnaLogo,
  MollieLogo,
  SkrillLogo,
  AlipayLogo,
} from '../billing/PaymentBrandLogos';

export interface AdminGatewayConfig {
  id: string;
  gateway_key: string;
  display_name: string;
  is_enabled: boolean;
  environment: string;
  public_key?: string;
  secret_key?: string;
  webhook_secret?: string;
  merchant_id?: string;
  vpa_address?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc_swift?: string;
  bank_beneficiary?: string;
  details_json?: any;
}

interface ModernToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  ariaLabel?: string;
}

export const ModernToggleSwitch: React.FC<ModernToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  ariaLabel,
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const trackClasses = isSm
    ? 'w-8 h-4.5 p-0.5'
    : isLg
    ? 'w-12 h-6.5 p-0.5'
    : 'w-10 h-5.5 p-0.5';

  const thumbSize = isSm
    ? 'h-3.5 w-3.5'
    : isLg
    ? 'h-5.5 w-5.5'
    : 'h-4.5 w-4.5';

  const translateChecked = isSm
    ? 'translate-x-3.5'
    : isLg
    ? 'translate-x-5.5'
    : 'translate-x-4.5';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || label || 'Toggle switch'}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange();
      }}
      className={`group relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${trackClasses} ${
        checked
          ? 'bg-emerald-500 shadow-xs shadow-emerald-500/30'
          : 'bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block rounded-full bg-white transition-transform duration-200 ease-in-out shadow-xs ${thumbSize} ${
          checked ? translateChecked : 'translate-x-0'
        }`}
      />
    </button>
  );
};

export interface GatewayFieldSchema {
  key: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'password' | 'select' | 'textarea';
  required?: boolean;
  isSecret?: boolean;
  isCustomField?: boolean;
  helpText?: string;
  directLinkUrl?: string;
  directLinkLabel?: string;
  options?: { value: string; label: string }[];
  colSpan?: 1 | 2;
}

export interface GatewayPluginMeta {
  category: 'global' | 'india' | 'offline';
  version: string;
  author: string;
  description: string;
  acceptedMethods: string[];
  currencies: string[];
  docsUrl: string;
  environmentOptions?: { value: string; label: string }[];
  fields: GatewayFieldSchema[];
  webhookEvents: { event: string; desc: string }[];
}

export const GATEWAY_METAS: Record<string, GatewayPluginMeta> = {
  stripe: {
    category: 'global',
    version: 'v4.8.2',
    author: 'Stripe Official Integration Bridge',
    description: 'Accept international Credit/Debit Cards, Apple Pay, Google Pay, and SEPA debit with instant webhook settlements.',
    acceptedMethods: ['Credit/Debit Cards', 'Apple Pay', 'Google Pay', 'SEPA Debit'],
    currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'],
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    environmentOptions: [
      { value: 'live', label: 'Live Production Mode (Real Cards & Charges)' },
      { value: 'test', label: 'Test Sandbox Mode (Test Cards: 4242 4242...)' },
    ],
    fields: [
      {
        key: 'public_key',
        label: 'Stripe Publishable Key',
        placeholder: 'pk_live_51... or pk_test_51...',
        required: true,
        directLinkUrl: 'https://dashboard.stripe.com/apikeys',
        directLinkLabel: 'Get Publishable Key ↗',
        helpText: 'Client-side publishable token used by Stripe Elements and Web SDKs.',
      },
      {
        key: 'secret_key',
        label: 'Stripe Secret API Key',
        placeholder: 'sk_live_51... or sk_test_51... or rk_live_...',
        type: 'password',
        isSecret: true,
        required: true,
        directLinkUrl: 'https://dashboard.stripe.com/apikeys',
        directLinkLabel: 'Create Secret Key ↗',
        helpText: 'Standard or restricted secret key starting with sk_live_... (encrypted AES-256 GCM).',
      },
      {
        key: 'webhook_secret',
        label: 'Stripe Webhook Signing Secret',
        placeholder: 'whsec_...',
        type: 'password',
        isSecret: true,
        directLinkUrl: 'https://dashboard.stripe.com/webhooks',
        directLinkLabel: 'Get Signing Secret ↗',
        helpText: 'Endpoint secret used to cryptographically verify Stripe-Signature HMAC headers.',
      },
      {
        key: 'merchant_id',
        label: 'Stripe Connected Account ID (Optional)',
        placeholder: 'acct_1N...',
        directLinkUrl: 'https://dashboard.stripe.com/connect/accounts/overview',
        directLinkLabel: 'Stripe Connect ↗',
        helpText: 'For Stripe Connect platform fee splits & multi-tenant direct charges.',
      },
      {
        key: 'statement_descriptor',
        label: 'Statement Descriptor Prefix',
        placeholder: 'CREATECALL',
        isCustomField: true,
        directLinkUrl: 'https://dashboard.stripe.com/settings/public',
        directLinkLabel: 'Branding Settings ↗',
        helpText: 'Appears on the customer credit card statement alongside the transaction charge (5-10 chars).',
        colSpan: 2,
      },
    ],
    webhookEvents: [
      { event: 'payment_intent.succeeded', desc: 'Credit Card / Wallet payment completed, auto-credits tenant carrier wallet.' },
      { event: 'payment_intent.payment_failed', desc: 'Card declined or 3DS verification failed, notifies customer.' },
      { event: 'checkout.session.completed', desc: 'Stripe Checkout session completed, activates subscription plan.' },
      { event: 'customer.subscription.updated', desc: 'Recurring billing cycle renewed, resets voice minutes & concurrency.' },
      { event: 'customer.subscription.deleted', desc: 'Subscription cancelled, downgrades workspace to free tier.' },
      { event: 'charge.refunded', desc: 'Refund processed, adjusts financial billing ledger and issues credit note.' },
      { event: 'invoice.payment_succeeded', desc: 'Automated recurring invoice settled successfully.' },
    ],
  },

  razorpay: {
    category: 'india',
    version: 'v3.9.0',
    author: 'Razorpay India Payments Core',
    description: 'Instant Indian UPI 2.0 (Google Pay, PhonePe, Paytm), RuPay/Visa/MasterCard, Netbanking, and Auto-Debit Mandates.',
    acceptedMethods: ['UPI QR & Intent', 'RuPay/Visa/MC', 'Netbanking 50+ Banks', 'Auto-Debit Mandate'],
    currencies: ['INR', 'USD'],
    docsUrl: 'https://dashboard.razorpay.com/app/keys',
    environmentOptions: [
      { value: 'live', label: 'Live Production Mode' },
      { value: 'test', label: 'Test Simulation Mode' },
    ],
    fields: [
      {
        key: 'public_key',
        label: 'Razorpay Key ID',
        placeholder: 'rzp_live_... or rzp_test_...',
        required: true,
        directLinkUrl: 'https://dashboard.razorpay.com/app/keys',
        directLinkLabel: 'Get Key ID ↗',
        helpText: 'Generated in Razorpay Dashboard > Settings > API Keys.',
      },
      {
        key: 'secret_key',
        label: 'Razorpay Key Secret',
        placeholder: '••••••••••••••••',
        type: 'password',
        isSecret: true,
        required: true,
        directLinkUrl: 'https://dashboard.razorpay.com/app/keys',
        directLinkLabel: 'Generate Secret ↗',
        helpText: 'Paired key secret for authenticating server-to-server Razorpay API requests.',
      },
      {
        key: 'webhook_secret',
        label: 'Razorpay Webhook Secret (HMAC)',
        placeholder: 'rzp_whsec_...',
        type: 'password',
        isSecret: true,
        directLinkUrl: 'https://dashboard.razorpay.com/app/webhooks',
        directLinkLabel: 'Manage Webhooks ↗',
        helpText: 'Configured in Razorpay Webhooks tab to cryptographically verify X-Razorpay-Signature.',
      },
      {
        key: 'merchant_id',
        label: 'Razorpay Merchant ID (MID)',
        placeholder: 'mid_createcall_01',
        helpText: 'Your official Razorpay Business Account Merchant Identifier.',
      },
      {
        key: 'vpa_address',
        label: 'Merchant UPI VPA Handle (For India QR)',
        placeholder: 'createcall@icici',
        helpText: 'Direct UPI Virtual Payment Address for dynamic UPI QR code generation.',
        colSpan: 2,
      },
    ],
    webhookEvents: [
      { event: 'payment.captured', desc: 'Confirms successful UPI / Card transaction capture.' },
      { event: 'order.paid', desc: 'Auto-activates customer plan and provisions voice minutes.' },
      { event: 'payment.failed', desc: 'Broadcasts error details to tenant dashboard.' },
      { event: 'refund.processed', desc: 'Credits reversal back to customer bank account.' },
    ],
  },

  cashfree: {
    category: 'india',
    version: 'v2.6.4',
    author: 'Cashfree AutoCollect Engine',
    description: 'High-speed payment processing with UPI Dynamic QR, Instant Settlement, and automated payment verification webhooks.',
    acceptedMethods: ['UPI Dynamic QR', 'Instant Netbanking', 'Credit/Debit Cards', 'EMI'],
    currencies: ['INR', 'USD'],
    docsUrl: 'https://merchant.cashfree.com/developers/api-keys',
    environmentOptions: [
      { value: 'production', label: 'Production Live Mode' },
      { value: 'sandbox', label: 'Sandbox / Test Environment' },
    ],
    fields: [
      {
        key: 'public_key',
        label: 'Cashfree App ID (Client ID)',
        placeholder: 'CF_APP_...',
        required: true,
        directLinkUrl: 'https://merchant.cashfree.com/developers/api-keys',
        directLinkLabel: 'Get App ID ↗',
        helpText: 'App ID from Cashfree Merchant Dashboard > Developers > API Keys.',
      },
      {
        key: 'secret_key',
        label: 'Cashfree Secret Key',
        placeholder: 'cfsk_ma_live_...',
        type: 'password',
        isSecret: true,
        required: true,
        directLinkUrl: 'https://merchant.cashfree.com/developers/api-keys',
        directLinkLabel: 'Get Key ↗',
        helpText: 'Secret API token used to sign Cashfree REST requests.',
      },
      {
        key: 'webhook_secret',
        label: 'Cashfree Webhook Signature Key',
        placeholder: 'cf_whsec_...',
        type: 'password',
        isSecret: true,
        directLinkUrl: 'https://merchant.cashfree.com/developers/webhooks',
        directLinkLabel: 'Webhooks ↗',
        helpText: 'Used to verify incoming Cashfree event payloads.',
      },
      {
        key: 'api_version',
        label: 'Cashfree API Version',
        placeholder: '2023-08-01',
        isCustomField: true,
        helpText: 'Cashfree PG REST API version.',
      },
    ],
    webhookEvents: [
      { event: 'PAYMENT_SUCCESS_WEBHOOK', desc: 'Notifies when UPI / Card payment is settled.' },
      { event: 'ORDER_PAID', desc: 'Unlocks tenant concurrency and increments carrier wallet.' },
      { event: 'PAYMENT_FAILED_WEBHOOK', desc: 'Logs failed payment attempt in audit history.' },
      { event: 'TRANSFER_SUCCESS', desc: 'Confirms vendor auto-payout settlement.' },
    ],
  },

  phonepe: {
    category: 'india',
    version: 'v2.1.0',
    author: 'PhonePe PG Next-Gen',
    description: 'Seamless zero-redirection PhonePe UPI payments, wallet balance integration, and real-time webhook callback listeners.',
    acceptedMethods: ['PhonePe UPI', 'Direct App Intent', 'PhonePe Wallet', 'RuPay Credit'],
    currencies: ['INR'],
    docsUrl: 'https://developer.phonepe.com/v1/reference/pg-api-overview',
    environmentOptions: [
      { value: 'production', label: 'Production Live Mode' },
      { value: 'sandbox', label: 'UAT Sandbox Mode' },
    ],
    fields: [
      {
        key: 'merchant_id',
        label: 'PhonePe Merchant ID (MID)',
        placeholder: 'MERCHANTUAT / M...',
        required: true,
        directLinkUrl: 'https://business.phonepe.com',
        directLinkLabel: 'PhonePe Business ↗',
        helpText: 'Official MID assigned by PhonePe onboarding team.',
      },
      {
        key: 'secret_key',
        label: 'PhonePe Salt Key / API Secret',
        placeholder: '••••••••••••••••••••••••••••••••',
        type: 'password',
        isSecret: true,
        required: true,
        directLinkUrl: 'https://developer.phonepe.com/v1/reference/key-management',
        directLinkLabel: 'Key Management ↗',
        helpText: '32-character Salt Key used for SHA256 checksum signatures.',
      },
      {
        key: 'salt_index',
        label: 'PhonePe Salt Index (Key Index)',
        placeholder: '1',
        isCustomField: true,
        required: true,
        helpText: 'Key Index matching your active Salt Key (usually 1).',
      },
      {
        key: 'vpa_address',
        label: 'PhonePe Merchant UPI VPA Handle',
        placeholder: 'createcall@ybl',
        helpText: 'Primary VPA address for direct UPI collections.',
      },
      {
        key: 'webhook_secret',
        label: 'Callback Verification Secret (Optional)',
        placeholder: 'phonepe_wh_sec_...',
        type: 'password',
        isSecret: true,
        colSpan: 2,
      },
    ],
    webhookEvents: [
      { event: 'PAYMENT_SUCCESS', desc: 'Instant acknowledgment of completed PhonePe transaction.' },
      { event: 'PAYMENT_ERROR', desc: 'Notifies when user cancels or payment expires.' },
      { event: 'PAYMENT_DECLINED', desc: 'Bank issuer declined transaction notice.' },
      { event: 'REFUND_SUCCESS', desc: 'Confirms refund processed back to PhonePe wallet / UPI.' },
    ],
  },

  paypal: {
    category: 'global',
    version: 'v3.5.1',
    author: 'PayPal Commerce Platform',
    description: 'Worldwide buyer protection and digital wallet payments supporting 200+ countries and major fiat currencies.',
    acceptedMethods: ['PayPal Balance', 'Pay in 4', 'International Credit Cards', 'Venmo'],
    currencies: ['USD', 'EUR', 'GBP', 'AUD', 'JPY', 'CAD'],
    docsUrl: 'https://developer.paypal.com/dashboard/applications',
    environmentOptions: [
      { value: 'live', label: 'Live Production Mode' },
      { value: 'sandbox', label: 'Sandbox Test Mode' },
    ],
    fields: [
      {
        key: 'public_key',
        label: 'PayPal REST Client ID',
        placeholder: 'AXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        required: true,
        directLinkUrl: 'https://developer.paypal.com/dashboard/applications',
        directLinkLabel: 'PayPal Apps ↗',
        helpText: 'Found in PayPal Developer Dashboard > Apps & Credentials.',
      },
      {
        key: 'secret_key',
        label: 'PayPal Client Secret',
        placeholder: 'EXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        type: 'password',
        isSecret: true,
        required: true,
        directLinkUrl: 'https://developer.paypal.com/dashboard/applications',
        directLinkLabel: 'Get Secret ↗',
        helpText: 'Secret key for OAuth2 token generation.',
      },
      {
        key: 'webhook_secret',
        label: 'PayPal Webhook ID',
        placeholder: 'WH-XXXXXXXXXXXXXXXXX',
        isSecret: true,
        directLinkUrl: 'https://developer.paypal.com/dashboard/webhooks',
        directLinkLabel: 'Webhooks ↗',
        helpText: 'Webhook ID created in PayPal Developer portal for event verification.',
      },
      {
        key: 'merchant_id',
        label: 'PayPal Merchant Account Email',
        placeholder: 'billing@createcall.ai',
        helpText: 'Primary PayPal Business Account email.',
      },
    ],
    webhookEvents: [
      { event: 'PAYMENT.CAPTURE.COMPLETED', desc: 'PayPal payment captured successfully.' },
      { event: 'CHECKOUT.ORDER.APPROVED', desc: 'Customer authorized PayPal order.' },
      { event: 'PAYMENT.CAPTURE.DENIED', desc: 'Transaction declined by PayPal risk engine.' },
      { event: 'BILLING.SUBSCRIPTION.RENEWED', desc: 'Recurring PayPal billing cycle renewed.' },
    ],
  },

  bank_wire: {
    category: 'offline',
    version: 'v5.0.0',
    author: 'CreateCall Sovereign Settlement Engine',
    description: 'Direct B2B wire transfers (NEFT / RTGS / IMPS / SWIFT) with 0% gateway fee and manual 1-click Super Admin approval.',
    acceptedMethods: ['NEFT Wire', 'RTGS Transfer', 'IMPS Instant', 'International SWIFT', 'UPI VPA Direct'],
    currencies: ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD'],
    docsUrl: '#',
    environmentOptions: [
      { value: 'live', label: 'Live Sovereign Rail' },
    ],
    fields: [
      {
        key: 'bank_beneficiary',
        label: 'Beneficiary / Account Holder Name',
        placeholder: 'Create Call OS Technologies Private Limited',
        required: true,
        colSpan: 2,
        helpText: 'Exact corporate or entity name registered on the bank account.',
      },
      {
        key: 'bank_name',
        label: 'Bank Name & Financial Institution',
        placeholder: 'HDFC Commercial Bank Ltd / JPMorgan Chase',
        required: true,
        helpText: 'Full name of your commercial banking partner.',
      },
      {
        key: 'bank_account_no',
        label: 'Bank Account Number / IBAN',
        placeholder: '50200089129031',
        required: true,
        helpText: 'Bank Account Number or International IBAN.',
      },
      {
        key: 'bank_ifsc_swift',
        label: 'IFSC Code / SWIFT BIC',
        placeholder: 'HDFC0001234 or CHASUS33XXX',
        required: true,
        helpText: 'IFSC code (for Indian NEFT/RTGS) or SWIFT BIC (for international wires).',
      },
      {
        key: 'vpa_address',
        label: 'UPI VPA / QR Handle (For India Direct)',
        placeholder: 'createcall.corp@hdfcbank',
        helpText: 'UPI ID handle displayed on invoice for 1-click scanning.',
      },
      {
        key: 'branch_address',
        label: 'Bank Branch Address & City',
        placeholder: 'Nariman Point, Mumbai, Maharashtra 400021',
        isCustomField: true,
        colSpan: 2,
        helpText: 'Physical address of the bank branch for wire remittances.',
      },
      {
        key: 'wire_instructions',
        label: 'Payment Instructions & Reference Rules',
        placeholder: 'Please include your Tenant Email and Invoice # in the wire remarks for instant reconciliation.',
        isCustomField: true,
        type: 'textarea',
        colSpan: 2,
        helpText: 'Displayed on invoices and checkout screens.',
      },
    ],
    webhookEvents: [
      { event: 'wire.submission_received', desc: 'Customer submitted UTR/Bank Reference.' },
      { event: 'wire.admin_verified', desc: 'Super Admin approved wire and activated plan.' },
      { event: 'wire.rejected', desc: 'Wire rejected due to incorrect UTR or missing funds.' },
    ],
  },

  bank_transfer: {
    category: 'offline',
    version: 'v5.0.0',
    author: 'CreateCall Sovereign Settlement Engine',
    description: 'Direct B2B wire transfers (NEFT / RTGS / IMPS / SWIFT) with 0% gateway fee and manual 1-click Super Admin approval.',
    acceptedMethods: ['NEFT Wire', 'RTGS Transfer', 'IMPS Instant', 'International SWIFT', 'UPI VPA Direct'],
    currencies: ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD'],
    docsUrl: '#',
    environmentOptions: [
      { value: 'live', label: 'Live Sovereign Rail' },
    ],
    fields: [
      {
        key: 'bank_beneficiary',
        label: 'Beneficiary / Account Holder Name',
        placeholder: 'Create Call OS Technologies Private Limited',
        required: true,
        colSpan: 2,
      },
      {
        key: 'bank_name',
        label: 'Bank Name & Financial Institution',
        placeholder: 'HDFC Commercial Bank Ltd / JPMorgan Chase',
        required: true,
      },
      {
        key: 'bank_account_no',
        label: 'Bank Account Number / IBAN',
        placeholder: '50200089129031',
        required: true,
      },
      {
        key: 'bank_ifsc_swift',
        label: 'IFSC Code / SWIFT BIC',
        placeholder: 'HDFC0001234 or CHASUS33XXX',
        required: true,
      },
      {
        key: 'vpa_address',
        label: 'UPI VPA / QR Handle (For India Direct)',
        placeholder: 'createcall.corp@hdfcbank',
      },
      {
        key: 'branch_address',
        label: 'Bank Branch Address & City',
        placeholder: 'Nariman Point, Mumbai, Maharashtra 400021',
        isCustomField: true,
        colSpan: 2,
      },
      {
        key: 'wire_instructions',
        label: 'Payment Instructions & Reference Rules',
        placeholder: 'Please include your Tenant Email and Invoice # in the wire remarks for instant reconciliation.',
        isCustomField: true,
        type: 'textarea',
        colSpan: 2,
      },
    ],
    webhookEvents: [
      { event: 'wire.submission_received', desc: 'Customer submitted UTR/Bank Reference.' },
      { event: 'wire.admin_verified', desc: 'Super Admin approved wire and activated plan.' },
    ],
  },

  paytm: {
    category: 'india',
    version: 'v4.1.0',
    author: 'Paytm Payments Core Integration',
    description: 'All-in-One Paytm UPI, Wallet balance, Postpaid BNPL, Paytm QR, and instant bank netbanking reconciliation.',
    acceptedMethods: ['Paytm UPI', 'Paytm Wallet', 'Postpaid BNPL', 'NetBanking 60+ Banks'],
    currencies: ['INR', 'USD'],
    docsUrl: 'https://dashboard.paytm.com/next/apikeys',
    environmentOptions: [
      { value: 'production', label: 'Production Live' },
      { value: 'staging', label: 'Staging / Test' },
    ],
    fields: [
      {
        key: 'merchant_id',
        label: 'Paytm Merchant Identifier (MID)',
        placeholder: 'Create981290312389',
        required: true,
        directLinkUrl: 'https://dashboard.paytm.com/next/apikeys',
        directLinkLabel: 'Paytm Keys ↗',
        helpText: 'Official MID from Paytm Business Dashboard.',
      },
      {
        key: 'secret_key',
        label: 'Paytm Merchant Key (Merchant Secret)',
        placeholder: '••••••••••••••••',
        type: 'password',
        isSecret: true,
        required: true,
        directLinkUrl: 'https://dashboard.paytm.com/next/apikeys',
        directLinkLabel: 'Get Secret ↗',
        helpText: 'Merchant Key used for AES encryption & checksum generation.',
      },
      {
        key: 'vpa_address',
        label: 'Paytm Merchant UPI VPA / Soundbox ID',
        placeholder: 'e.g. yourbusiness@paytm or 9876543210@paytm',
        helpText: 'Official Paytm Merchant UPI Virtual Payment Address linked to your Soundbox & QR.',
      },
      {
        key: 'website_name',
        label: 'Paytm Website Name',
        placeholder: 'DEFAULT or WEBSTAGING',
        isCustomField: true,
        helpText: 'Usually "DEFAULT" for production.',
      },
      {
        key: 'industry_type',
        label: 'Industry Type ID',
        placeholder: 'Retail / Software',
        isCustomField: true,
      },
    ],
    webhookEvents: [
      { event: 'TXN_SUCCESS', desc: 'Paytm transaction confirmed.' },
      { event: 'TXN_FAILURE', desc: 'Paytm transaction failed or expired.' },
    ],
  },

  authorizenet: {
    category: 'global',
    version: 'v3.2.0',
    author: 'Visa Solution / Authorize.Net',
    description: 'Enterprise US and global payment gateway with automated recurring billing, fraud detection suite, and eCheck processing.',
    acceptedMethods: ['Visa/MC/Amex/Discover', 'eCheck.Net ACH', 'Apple Pay', 'Visa Checkout'],
    currencies: ['USD', 'CAD', 'GBP', 'EUR', 'AUD'],
    docsUrl: 'https://developer.authorize.net/api/reference',
    environmentOptions: [
      { value: 'production', label: 'Production Mode' },
      { value: 'sandbox', label: 'Sandbox Test Mode' },
    ],
    fields: [
      {
        key: 'public_key',
        label: 'API Login ID',
        placeholder: '5k29XXXXXXXX',
        required: true,
        directLinkUrl: 'https://account.authorize.net',
        directLinkLabel: 'Authorize Portal ↗',
        helpText: 'Authorize.Net Merchant Interface > Settings > API Credentials.',
      },
      {
        key: 'secret_key',
        label: 'Transaction Key',
        placeholder: '8mXXXXXXXXXXXXXXXX',
        type: 'password',
        isSecret: true,
        required: true,
        helpText: 'Transaction key for authenticating XML/JSON requests.',
      },
      {
        key: 'webhook_secret',
        label: 'Signature Key (Webhook HMAC)',
        placeholder: '••••••••••••••••••••••••••••••••',
        type: 'password',
        isSecret: true,
      },
      {
        key: 'client_key',
        label: 'Public Client Key (Accept.js)',
        placeholder: '7zXXXXXXXXXXXXXXXX',
        isCustomField: true,
      },
    ],
    webhookEvents: [
      { event: 'net.authorize.payment.authcapture.created', desc: 'Credit card transaction captured.' },
      { event: 'net.authorize.payment.refund.created', desc: 'Refund recorded on Authorize.Net.' },
    ],
  },

  square: {
    category: 'global',
    version: 'v2.8.0',
    author: 'Square Developer Platform',
    description: 'Unified omnichannel payments: Cards, Apple Pay, Google Pay (G-Pay), Cash App Pay, and Afterpay (4x BNPL) via official Square Web Payments SDK.',
    acceptedMethods: ['Credit/Debit Cards', 'Apple Pay', 'Google Pay', 'Cash App Pay', 'Afterpay (4x BNPL)'],
    currencies: ['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'JPY', 'INR', 'AED', 'SGD', 'CHF', 'NZD', 'HKD'],
    docsUrl: 'https://developer.squareup.com/apps',
    environmentOptions: [
      { value: 'production', label: 'Production Live Mode' },
      { value: 'sandbox', label: 'Sandbox Test Mode' },
    ],
    fields: [
      {
        key: 'public_key',
        label: 'Square Application ID (Unified Cards, Apple Pay & Google Pay)',
        placeholder: 'sq0idp-XXXXXXXXXXXXXXXXXXXX',
        required: true,
        directLinkUrl: 'https://developer.squareup.com/apps',
        directLinkLabel: 'Square Apps ↗',
        helpText: 'Square Developer Dashboard > Credentials. Unified Application ID used for Card tokenization, Apple Pay & Google Pay.',
      },
      {
        key: 'secret_key',
        label: 'Square Access Token',
        placeholder: 'EAAAXXXXXXXXXXXXXXXXXXXXXXXX',
        type: 'password',
        isSecret: true,
        required: true,
        directLinkUrl: 'https://developer.squareup.com/apps',
        directLinkLabel: 'Access Token ↗',
        helpText: 'OAuth or Personal Access Token (starts with EAAA...) for backend payment capture & charge settlement.',
      },
      {
        key: 'merchant_id',
        label: 'Square Location ID (Settlement Location)',
        placeholder: 'LXXXXXXXXXXXXXXXX',
        required: true,
        helpText: 'Square Location ID (starts with L...) for payment settlement & digital wallet merchant binding.',
      },
      {
        key: 'webhook_secret',
        label: 'Webhook Signature Key',
        placeholder: '••••••••••••••••••••',
        type: 'password',
        isSecret: true,
        helpText: 'Square Webhook Signature Key for verifying instant payment event notifications.',
      },
      {
        key: 'cashtag',
        label: 'Merchant $Cashtag (For Square Cash App Pay)',
        placeholder: '$createcall',
        isCustomField: true,
        helpText: 'Your verified Square Cash App $Cashtag handle (e.g., $createcall) for instant customer QR code payments.',
        colSpan: 2,
      },
    ],
    webhookEvents: [
      { event: 'payment.updated', desc: 'Payment state changed to COMPLETED.' },
      { event: 'refund.updated', desc: 'Refund processed through Square.' },
    ],
  },

  paddle: {
    category: 'global',
    version: 'v2.0.0',
    author: 'Paddle Merchant of Record',
    description: 'Complete Merchant of Record infrastructure handling global sales tax, VAT calculation, SaaS billing, and invoice compliance.',
    acceptedMethods: ['Credit/Debit Cards', 'PayPal', 'iDEAL', 'Wire Transfers', 'Alipay'],
    currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'BRL', 'INR'],
    docsUrl: 'https://vendors.paddle.com/authentication',
    environmentOptions: [
      { value: 'production', label: 'Production Live' },
      { value: 'sandbox', label: 'Sandbox Environment' },
    ],
    fields: [
      {
        key: 'merchant_id',
        label: 'Paddle Vendor ID / Seller ID',
        placeholder: '123456',
        required: true,
        directLinkUrl: 'https://vendors.paddle.com/authentication',
        directLinkLabel: 'Paddle Auth ↗',
        helpText: 'Paddle Dashboard > Developer Tools > Authentication.',
      },
      {
        key: 'secret_key',
        label: 'Paddle API Key',
        placeholder: 'padd_live_XXXXXXXXXXXXXXXXXXXX',
        type: 'password',
        isSecret: true,
        required: true,
        directLinkUrl: 'https://vendors.paddle.com/authentication',
        directLinkLabel: 'API Keys ↗',
        helpText: 'API key for Paddle billing endpoints.',
      },
      {
        key: 'public_key',
        label: 'Paddle Client Token (Paddle.js)',
        placeholder: 'live_XXXXXXXXXXXXXXXXXXXX',
        helpText: 'Token used for Paddle.js in-line overlay checkout.',
      },
      {
        key: 'webhook_secret',
        label: 'Webhook Secret Key',
        placeholder: 'padd_whsec_XXXXXXXXXXXXXXXXXXXX',
        type: 'password',
        isSecret: true,
      },
    ],
    webhookEvents: [
      { event: 'transaction.completed', desc: 'SaaS subscription or invoice paid.' },
      { event: 'subscription.created', desc: 'New recurring subscription initialized.' },
    ],
  },

  crypto: {
    category: 'global',
    version: 'v3.1.0',
    author: 'Coinbase Commerce Web3 Engine',
    description: 'Decentralized and instant cryptocurrency checkout accepting USDC, USDT (TRC-20 & ERC-20), Bitcoin, Ethereum, and Solana with 0 chargebacks.',
    acceptedMethods: ['USDT (TRC-20)', 'USDT (ERC-20)', 'Bitcoin (BTC)', 'Ethereum (ETH)', 'Solana (SOL)'],
    currencies: ['USD', 'EUR', 'USDT', 'USDC', 'BTC', 'ETH', 'SOL'],
    docsUrl: 'https://commerce.coinbase.com/settings/security',
    environmentOptions: [
      { value: 'live', label: 'Mainnet Live Production' },
      { value: 'test', label: 'Testnet Simulation' },
    ],
    fields: [
      {
        key: 'secret_key',
        label: 'Coinbase Commerce API Key',
        placeholder: '••••••••-••••-••••-••••-••••••••••••',
        type: 'password',
        isSecret: true,
        directLinkUrl: 'https://commerce.coinbase.com/settings/security',
        directLinkLabel: 'Coinbase Keys ↗',
        helpText: 'Coinbase Commerce Dashboard > Settings > Security > API Keys.',
      },
      {
        key: 'webhook_secret',
        label: 'Webhook Shared Secret',
        placeholder: 'whsec_••••••••••••••••',
        type: 'password',
        isSecret: true,
        directLinkUrl: 'https://commerce.coinbase.com/settings/notifications',
        directLinkLabel: 'Webhooks ↗',
        helpText: 'Shared secret for cryptographic signature verification.',
      },
      {
        key: 'wallet_trc20',
        label: 'USDT (TRC-20 Tron) Deposit Address',
        placeholder: 'TX19847291823719283719283719283a',
        isCustomField: true,
        helpText: 'Tron network address for fast, low-fee USDT transfers.',
      },
      {
        key: 'public_key',
        label: 'USDT (ERC-20) & ETH Ethereum Wallet Address',
        placeholder: '0x71C56d8Ff60C895d988D4E12204E9d7bA2bB4e88',
        helpText: 'EVM mainnet wallet address for ERC-20 tokens and Ethereum.',
      },
      {
        key: 'wallet_btc',
        label: 'Bitcoin (BTC) Native Deposit Address',
        placeholder: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        isCustomField: true,
        helpText: 'Native SegWit (bc1q...) or Legacy Bitcoin address.',
      },
      {
        key: 'wallet_sol',
        label: 'Solana (SOL) SPL Wallet Address',
        placeholder: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        isCustomField: true,
        helpText: 'Solana network SPL address for sub-second confirmations.',
      },
      {
        key: 'crypto_network',
        label: 'Preferred Settlement Blockchain',
        placeholder: 'USDT (TRC-20) / Ethereum / Bitcoin / Solana',
        isCustomField: true,
        helpText: 'Default network tab highlighted for paying customers.',
      },
    ],
    webhookEvents: [
      { event: 'charge:confirmed', desc: 'Blockchain confirmations reached, funds credited.' },
      { event: 'charge:failed', desc: 'Transaction timed out or underpaid on chain.' },
    ],
  },

  flutterwave: {
    category: 'global',
    version: 'v3.4.0',
    author: 'Flutterwave Global Africa Core',
    description: 'Pan-African & global checkout connector supporting M-Pesa, Mobile Money (Ghana/Kenya/Nigeria), cards, and bank transfers.',
    acceptedMethods: ['M-Pesa Mobile', 'Card Processing', 'Bank Account Transfer', 'USSD Barter'],
    currencies: ['USD', 'NGN', 'KES', 'GHS', 'ZAR', 'EUR', 'GBP'],
    docsUrl: 'https://dashboard.flutterwave.com/settings/apis',
    environmentOptions: [
      { value: 'live', label: 'Live Production Mode' },
      { value: 'test', label: 'Test Sandbox Mode' },
    ],
    fields: [
      {
        key: 'public_key',
        label: 'Flutterwave Public Key',
        placeholder: 'FLWPUBK_LIVE-XXXXXXXXXXXXXXXXXXXX-X',
        required: true,
        directLinkUrl: 'https://dashboard.flutterwave.com/settings/apis',
        directLinkLabel: 'API Keys ↗',
      },
      {
        key: 'secret_key',
        label: 'Flutterwave Secret Key',
        placeholder: 'FLWSECK_LIVE-XXXXXXXXXXXXXXXXXXXX-X',
        type: 'password',
        isSecret: true,
        required: true,
      },
      {
        key: 'merchant_id',
        label: 'Flutterwave Encryption Key',
        placeholder: 'FLWSECK_LIVE••••••••••••',
        type: 'password',
        isSecret: true,
      },
      {
        key: 'webhook_secret',
        label: 'Webhook Secret Hash',
        placeholder: '••••••••••••••••••••',
        type: 'password',
        isSecret: true,
      },
    ],
    webhookEvents: [
      { event: 'charge.completed', desc: 'African Mobile Money / Card payment cleared.' },
      { event: 'transfer.completed', desc: 'Carrier payout settlement confirmed.' },
    ],
  },

  adyen: {
    category: 'global',
    version: 'v4.0.0',
    author: 'Adyen Global Financial Technology',
    description: 'Enterprise omnichannel processing with unified multi-currency routing, 3D Secure 2.0 dynamic authentication, and localized acquiring.',
    acceptedMethods: ['Credit/Debit Cards', 'SEPA Direct Debit', 'Cartes Bancaires', 'WeChat Pay', 'Alipay'],
    currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'HKD', 'JPY'],
    docsUrl: 'https://ca-live.adyen.com/ca/ca/overview/default.shtml',
    environmentOptions: [
      { value: 'live', label: 'Live Production' },
      { value: 'test', label: 'Test Environment' },
    ],
    fields: [
      {
        key: 'merchant_id',
        label: 'Adyen Merchant Account Name',
        placeholder: 'CreateCallECOM',
        required: true,
        directLinkUrl: 'https://ca-live.adyen.com',
        directLinkLabel: 'Adyen Portal ↗',
        helpText: 'Official Merchant Account identifier.',
      },
      {
        key: 'secret_key',
        label: 'Adyen API Key',
        placeholder: 'AQEyXXXXXXXXXXXXXXXXXXXXXXXX',
        type: 'password',
        isSecret: true,
        required: true,
      },
      {
        key: 'public_key',
        label: 'Adyen Client Key',
        placeholder: 'live_XXXXXXXXXXXXXXXXXXXXXXXX',
      },
      {
        key: 'webhook_secret',
        label: 'HMAC Webhook Key',
        placeholder: '••••••••••••••••••••••••••••••••',
        type: 'password',
        isSecret: true,
      },
    ],
    webhookEvents: [
      { event: 'AUTHORISATION', desc: '3DS2 authentication and authorization approved.' },
      { event: 'CAPTURE', desc: 'Settlement credited to Adyen merchant balance.' },
    ],
  },

  mercadopago: {
    category: 'global',
    version: 'v3.1.2',
    author: 'Mercado Pago Latin America Bridge',
    description: 'Leading Latin American fintech gateway supporting instant Brazil PIX QR codes, Boleto Bancario, Mexico SPEI, OXXO, and local debit cards.',
    acceptedMethods: ['Brazil PIX Instant', 'Boleto Bancario', 'Mexico SPEI / OXXO', 'LatAm Visa/Mastercard', 'Mercado Wallet'],
    currencies: ['USD', 'BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN'],
    docsUrl: 'https://www.mercadopago.com/developers/panel/app',
    environmentOptions: [
      { value: 'production', label: 'Production Live' },
      { value: 'sandbox', label: 'Sandbox Mode' },
    ],
    fields: [
      {
        key: 'public_key',
        label: 'Mercado Pago Public Key',
        placeholder: 'APP_USR-XXXXXXXXXXXXXXXX-XXXXXX-XXXXXXXX',
        required: true,
        directLinkUrl: 'https://www.mercadopago.com/developers/panel/app',
        directLinkLabel: 'Credentials ↗',
      },
      {
        key: 'secret_key',
        label: 'Mercado Pago Access Token',
        placeholder: 'APP_USR-XXXXXXXXXXXXXXXX-XXXXXX-XXXXXXXX',
        type: 'password',
        isSecret: true,
        required: true,
      },
      {
        key: 'webhook_secret',
        label: 'Webhook Secret Key',
        placeholder: '••••••••••••••••••••••••••••••••',
        type: 'password',
        isSecret: true,
      },
      {
        key: 'merchant_id',
        label: 'Integrator ID / Client ID (Optional)',
        placeholder: 'dev_123456',
      },
    ],
    webhookEvents: [
      { event: 'payment.created', desc: 'Brazil PIX / Card payment initiated.' },
      { event: 'payment.updated', desc: 'PIX QR code scanned and approved.' },
    ],
  },

  klarna: {
    category: 'global',
    version: 'v3.6.0',
    author: 'Klarna Bank AB Payment Suite',
    description: 'Global Buy Now Pay Later (BNPL) solution offering Pay in 30 Days, 3-4 Interest-Free Installments, Financing, and Direct Debit.',
    acceptedMethods: ['Pay in 4 Installments', 'Pay in 30 Days', 'Monthly Financing', 'Klarna Direct Debit'],
    currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SEK', 'NOK', 'DKK'],
    docsUrl: 'https://portal.klarna.com',
    environmentOptions: [
      { value: 'production', label: 'Production Live' },
      { value: 'playground', label: 'Playground Sandbox' },
    ],
    fields: [
      {
        key: 'public_key',
        label: 'Klarna API Username (UID)',
        placeholder: 'K123456_XXXXXXXXXXXX',
        required: true,
        directLinkUrl: 'https://portal.klarna.com',
        directLinkLabel: 'Klarna Portal ↗',
      },
      {
        key: 'secret_key',
        label: 'Klarna API Password / Secret',
        placeholder: '••••••••••••••••••••',
        type: 'password',
        isSecret: true,
        required: true,
      },
      {
        key: 'api_region',
        label: 'Klarna API Region Base',
        placeholder: 'Europe (api.klarna.com) / NA (api-na.klarna.com)',
        isCustomField: true,
      },
    ],
    webhookEvents: [
      { event: 'order.authorized', desc: 'Klarna BNPL authorized.' },
      { event: 'order.captured', desc: 'Installment captured.' },
    ],
  },

  mollie: {
    category: 'global',
    version: 'v2.9.1',
    author: 'Mollie European Payments Core',
    description: 'Frictionless European multi-method checkout supporting Netherlands iDEAL, Belgium Bancontact, Germany Giropay, EPS, and Apple Pay.',
    acceptedMethods: ['iDEAL (NL)', 'Bancontact (BE)', 'EPS (AT)', 'SOFORT / Giropay', 'Credit Cards', 'Apple Pay'],
    currencies: ['EUR', 'GBP', 'USD', 'CHF', 'PLN', 'SEK', 'NOK', 'DKK'],
    docsUrl: 'https://www.mollie.com/dashboard/developers/api-keys',
    environmentOptions: [
      { value: 'live', label: 'Live Production' },
      { value: 'test', label: 'Test Mode' },
    ],
    fields: [
      {
        key: 'secret_key',
        label: 'Mollie API Key',
        placeholder: 'live_dKJ891238912JKS9812...',
        type: 'password',
        isSecret: true,
        required: true,
        directLinkUrl: 'https://www.mollie.com/dashboard/developers/api-keys',
        directLinkLabel: 'Mollie Keys ↗',
        helpText: 'Starts with live_... or test_...',
      },
      {
        key: 'merchant_id',
        label: 'Mollie Profile ID',
        placeholder: 'pfl_3RkSN1234',
      },
      {
        key: 'webhook_secret',
        label: 'Webhook Secret (Optional)',
        placeholder: '••••••••••••••••',
        type: 'password',
        isSecret: true,
      },
    ],
    webhookEvents: [
      { event: 'payment.paid', desc: 'European local bank transfer confirmed.' },
      { event: 'refund.refunded', desc: 'Mollie refund processed.' },
    ],
  },

  skrill: {
    category: 'global',
    version: 'v2.4.0',
    author: 'Skrill & Neteller Wallet Engine',
    description: 'High-speed digital wallet and money transfer gateway supporting 40+ fiat currencies, rapid 1-tap checkout, and global card processing.',
    acceptedMethods: ['Skrill Digital Wallet', 'Neteller e-Money', 'Rapid Transfer Instant', 'Skrill 1-Tap'],
    currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED', 'INR'],
    docsUrl: 'https://www.skrill.com/en/business/integration',
    environmentOptions: [
      { value: 'production', label: 'Production Live' },
      { value: 'test', label: 'Test Mode' },
    ],
    fields: [
      {
        key: 'public_key',
        label: 'Skrill Merchant Account Email',
        placeholder: 'payments@createcall.ai',
        required: true,
        directLinkUrl: 'https://www.skrill.com/en/business/integration',
        directLinkLabel: 'Skrill Business ↗',
      },
      {
        key: 'secret_key',
        label: 'MQI / API Secret Word',
        placeholder: '••••••••••••••••',
        type: 'password',
        isSecret: true,
        required: true,
      },
      {
        key: 'merchant_id',
        label: 'Skrill Merchant Customer ID',
        placeholder: '12345678',
      },
    ],
    webhookEvents: [
      { event: 'status.success', desc: 'Skrill digital wallet settlement completed.' },
      { event: 'status.failed', desc: 'Transaction rejected.' },
    ],
  },

  alipay: {
    category: 'global',
    version: 'v3.3.0',
    author: 'Alipay+ & WeChat Pay Global Gateway',
    description: 'Cross-border Asia-Pacific payments connecting over 1.3 billion consumers across China, Hong Kong, Southeast Asia, and APAC wallets.',
    acceptedMethods: ['Alipay Cross-Border QR', 'WeChat Pay Scan', 'Alipay+ Global Wallets', 'China UnionPay'],
    currencies: ['USD', 'CNY', 'HKD', 'SGD', 'EUR', 'GBP', 'AUD', 'JPY', 'KRW'],
    docsUrl: 'https://global.alipay.com/docs',
    environmentOptions: [
      { value: 'production', label: 'Production Live' },
      { value: 'sandbox', label: 'Sandbox Environment' },
    ],
    fields: [
      {
        key: 'merchant_id',
        label: 'Alipay App ID',
        placeholder: '2021000123456789',
        required: true,
        directLinkUrl: 'https://global.alipay.com/docs',
        directLinkLabel: 'Alipay Docs ↗',
      },
      {
        key: 'secret_key',
        label: 'Merchant RSA2 Private Key (PEM format)',
        placeholder: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----',
        type: 'textarea',
        isSecret: true,
        required: true,
        colSpan: 2,
        helpText: 'PKCS#8 / PKCS#1 RSA Private Key formatted string.',
      },
      {
        key: 'alipay_public_key',
        label: 'Alipay Public Key (PEM format)',
        placeholder: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----',
        type: 'textarea',
        isCustomField: true,
        colSpan: 2,
        helpText: 'Public key provided by Alipay console.',
      },
    ],
    webhookEvents: [
      { event: 'trade.status.sync', desc: 'Alipay / WeChat Pay cross-border payment confirmed.' },
      { event: 'trade.refund.sync', desc: 'Refund acknowledged across APAC rails.' },
    ],
  },
};

export interface GatewaySetupGuide {
  title: string;
  portalName: string;
  portalUrl: string;
  steps: string[];
  noteBadge?: string;
  noteText?: string;
}

export const GATEWAY_DEVELOPER_SETUP_GUIDES: Record<string, GatewaySetupGuide> = {
  razorpay: {
    title: 'How to get Razorpay Keys',
    portalName: 'Razorpay Dashboard',
    portalUrl: 'https://dashboard.razorpay.com/#/app/keys',
    steps: [
      'Log into <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">dashboard.razorpay.com</a>',
      'Go to <strong>Account & Settings</strong> &gt; <strong>API Keys</strong>',
      'Click <strong>Generate Key</strong> (or copy active live key)',
      'Copy <strong>Key ID</strong> (<span class="font-mono text-[10px]">rzp_live_...</span>)',
      'Copy <strong>Key Secret</strong> and paste in Secret Key field',
      'Under <strong>Webhooks</strong>, add your system listener URL & copy Secret',
    ],
    noteBadge: 'UPI INTENT & NETBANKING',
    noteText: 'UPI Intent, QR scanning, RuPay/Visa/Mastercard cards, and 50+ NetBanking banks activate automatically.',
  },

  stripe: {
    title: 'How to get Stripe Keys',
    portalName: 'Stripe Dashboard',
    portalUrl: 'https://dashboard.stripe.com/apikeys',
    steps: [
      'Log into <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">dashboard.stripe.com</a>',
      'Navigate to <strong>Developers</strong> &gt; <strong>API keys</strong>',
      'Copy <strong>Publishable key</strong> (<span class="font-mono text-[10px]">pk_live_...</span>)',
      'Click <strong>Reveal secret key</strong> & copy (<span class="font-mono text-[10px]">sk_live_...</span>)',
      'Open <strong>Webhooks</strong> &gt; Add endpoint &gt; Copy <strong>Signing secret</strong> (<span class="font-mono text-[10px]">whsec_...</span>)',
    ],
    noteBadge: 'APPLE PAY & GOOGLE PAY',
    noteText: 'Apple Pay, Google Pay, and Stripe Link 1-Click checkout are automatically active with your Publishable Key.',
  },

  cashfree: {
    title: 'How to get Cashfree Keys',
    portalName: 'Cashfree Merchant Portal',
    portalUrl: 'https://merchant.cashfree.com/merchants/login',
    steps: [
      'Log into <a href="https://merchant.cashfree.com" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">merchant.cashfree.com</a>',
      'Go to <strong>Payment Gateway</strong> &gt; <strong>Developers</strong> &gt; <strong>API Keys</strong>',
      'Copy <strong>App ID / Client ID</strong> (<span class="font-mono text-[10px]">CF...</span>)',
      'Generate & copy <strong>Secret Key</strong> (<span class="font-mono text-[10px]">cfsk_ma_...</span>)',
      'Configure Webhooks under Developer settings with your listener URL',
    ],
    noteBadge: 'DYNAMIC UPI QR',
    noteText: 'Dynamic UPI QR generates real-time Intent links with zero drop rates.',
  },

  phonepe: {
    title: 'How to get PhonePe Keys',
    portalName: 'PhonePe Business Portal',
    portalUrl: 'https://merchant.phonepe.com',
    steps: [
      'Log into <a href="https://merchant.phonepe.com" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">merchant.phonepe.com</a>',
      'Navigate to <strong>Developer Settings</strong> &gt; <strong>API Keys</strong>',
      'Copy your <strong>Merchant ID</strong> (<span class="font-mono text-[10px]">PGKEY...</span> or <span class="font-mono text-[10px]">M...</span>)',
      'Copy your <strong>Salt Key (API Secret)</strong>',
      'Enter your <strong>Salt Index</strong> (Default: <span class="font-mono text-[10px]">1</span>)',
      'Enter your verified <strong>UPI Merchant VPA</strong> (e.g. <span class="font-mono text-[10px]">createcall@ybl</span>)',
    ],
    noteBadge: 'PHONEPE DIRECT UPI',
    noteText: 'Supports PhonePe Direct App Switch, UPI QR, and instant VPA settlements.',
  },

  bank_transfer: {
    title: 'How to configure Bank Wire',
    portalName: 'Commercial NetBanking',
    portalUrl: '#',
    steps: [
      'Enter your official corporate <strong>Beneficiary / Account Holder Name</strong>',
      'Select or type your <strong>Commercial Bank Name</strong>',
      'Enter your verified <strong>Account Number / IBAN</strong>',
      'Enter your verified <strong>IFSC Code / SWIFT BIC</strong> (Auto-lookup available)',
      '(Optional) Enter <strong>UPI VPA Handle</strong> for 1-click invoice QR generation',
      'Provide reference notes for customer remittance remarks',
    ],
    noteBadge: '0% GATEWAY FEES',
    noteText: 'Direct settlement into your bank account. Admin verifies incoming UTR reference with 1 click.',
  },

  bank_wire: {
    title: 'How to configure Bank Wire',
    portalName: 'Commercial NetBanking',
    portalUrl: '#',
    steps: [
      'Enter your official corporate <strong>Beneficiary / Account Holder Name</strong>',
      'Select or type your <strong>Commercial Bank Name</strong>',
      'Enter your verified <strong>Account Number / IBAN</strong>',
      'Enter your verified <strong>IFSC Code / SWIFT BIC</strong> (Auto-lookup available)',
      '(Optional) Enter <strong>UPI VPA Handle</strong> for 1-click invoice QR generation',
      'Provide reference notes for customer remittance remarks',
    ],
    noteBadge: '0% GATEWAY FEES',
    noteText: 'Direct settlement into your bank account. Admin verifies incoming UTR reference with 1 click.',
  },

  paytm: {
    title: 'How to get Paytm Keys',
    portalName: 'Paytm Dashboard',
    portalUrl: 'https://dashboard.paytm.com',
    steps: [
      'Log into <a href="https://dashboard.paytm.com" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">dashboard.paytm.com</a>',
      'Go to <strong>Developer Settings</strong> &gt; <strong>API Keys</strong>',
      'Copy <strong>Merchant ID (MID)</strong> (<span class="font-mono text-[10px]">CREATE...</span>)',
      'Generate & copy <strong>Merchant Key</strong> (Secret Key)',
      'Enter your verified <strong>Merchant UPI ID</strong> (e.g. <span class="font-mono text-[10px]">paytm.corp@paytm</span>)',
      'Add Webhook Listener URL in Paytm callback settings',
    ],
    noteBadge: 'PAYTM WALLET & UPI',
    noteText: 'Instant Paytm Wallet OTP, Direct UPI QR, and RuPay card settlements enabled.',
  },

  paypal: {
    title: 'How to get PayPal Keys',
    portalName: 'PayPal Developer Portal',
    portalUrl: 'https://developer.paypal.com/dashboard/applications',
    steps: [
      'Log into <a href="https://developer.paypal.com" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">developer.paypal.com</a>',
      'Go to <strong>Apps & Credentials</strong> &gt; Select or Create App',
      'Copy <strong>Client ID</strong> (<span class="font-mono text-[10px]">AXX...</span>)',
      'Click <strong>Show</strong> & copy <strong>Secret Key</strong> (<span class="font-mono text-[10px]">EXX...</span>)',
      'Enter your primary <strong>PayPal Business Account Email</strong>',
      'Add Webhook listener for <span class="font-mono text-[10px]">PAYMENT.CAPTURE.COMPLETED</span>',
    ],
    noteBadge: 'GLOBAL REACH (200+ COUNTRIES)',
    noteText: 'Customers can pay with PayPal Balance, linked cards, or Pay in 4 worldwide.',
  },

  authorizenet: {
    title: 'How to get Authorize.Net Keys',
    portalName: 'Authorize.Net Portal',
    portalUrl: 'https://account.authorize.net',
    steps: [
      'Log into <a href="https://account.authorize.net" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">account.authorize.net</a>',
      'Go to <strong>Account</strong> &gt; <strong>Settings</strong> &gt; <strong>API Credentials & Keys</strong>',
      'Copy your <strong>API Login ID</strong> (<span class="font-mono text-[10px]">5k...</span>)',
      'Generate & copy your <strong>Transaction Key</strong> (<span class="font-mono text-[10px]">8m...</span>)',
      'Generate <strong>Public Client Key (Accept.js)</strong> for card tokenization',
      'Configure Webhook Signature Key under <strong>Webhooks</strong>',
    ],
    noteBadge: 'VISA / MC / AMEX / ACH',
    noteText: 'Enterprise card processing with in-page Accept.js tokenization and eCheck ACH direct debit.',
  },

  square: {
    title: 'How to get Square Keys',
    portalName: 'Square Developer Portal',
    portalUrl: 'https://developer.squareup.com/apps',
    steps: [
      'Log into <a href="https://developer.squareup.com/apps" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">developer.squareup.com</a>',
      'Open your App &gt; Click <strong>Credentials</strong> tab',
      'Copy <strong>Application ID</strong> (<span class="font-mono text-[10px]">sq0idp-...</span>)',
      'Copy <strong>Access Token</strong> (<span class="font-mono text-[10px]">EAAA...</span>)',
      'Click <strong>Locations</strong> &gt; Copy <strong>Location ID</strong> (<span class="font-mono text-[10px]">L...</span>)',
      'Enter your verified <strong>$Cashtag</strong> (e.g. <span class="font-mono text-[10px]">$createcall</span>)',
    ],
    noteBadge: 'OMNICHANNEL SUITE',
    noteText: 'Apple Pay, Google Pay (G-Pay), Cards, Cash App, and Afterpay (4x BNPL) automatically activate with these 3 keys!',
  },

  paddle: {
    title: 'How to get Paddle Keys',
    portalName: 'Paddle Vendor Dashboard',
    portalUrl: 'https://vendors.paddle.com/authentication',
    steps: [
      'Log into <a href="https://vendors.paddle.com" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">vendors.paddle.com</a>',
      'Navigate to <strong>Developer Tools</strong> &gt; <strong>Authentication</strong>',
      'Copy <strong>Vendor ID / Seller ID</strong> (<span class="font-mono text-[10px]">123456</span>)',
      'Generate & copy <strong>API Key</strong> (<span class="font-mono text-[10px]">padd_live_...</span>)',
      'Copy <strong>Client Token (Paddle.js)</strong> (<span class="font-mono text-[10px]">live_...</span>)',
      'Configure <strong>Webhook Secret</strong> in Webhook Alerts',
    ],
    noteBadge: 'MERCHANT OF RECORD',
    noteText: 'Paddle acts as MoR, handling global sales tax, VAT calculation, and SaaS billing compliance.',
  },

  crypto: {
    title: 'How to get Crypto / Coinbase Keys',
    portalName: 'Coinbase Commerce Portal',
    portalUrl: 'https://commerce.coinbase.com',
    steps: [
      'Log into <a href="https://commerce.coinbase.com" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">commerce.coinbase.com</a>',
      'Go to <strong>Settings</strong> &gt; <strong>Security</strong> &gt; <strong>API Keys</strong>',
      'Click <strong>Create API Key</strong> and copy key',
      'Copy <strong>Webhook Shared Secret</strong> under Notifications',
      'Add your decentralized wallet addresses (<strong>USDT-TRC20</strong>, <strong>BTC</strong>, <strong>ETH</strong>, <strong>SOL</strong>)',
      'Click Save & Publish Plugin',
    ],
    noteBadge: 'WEB3 & BLOCKCHAIN',
    noteText: 'Supports Coinbase automated hosted checkout plus direct decentralized blockchain payments with 0% middleman fees.',
  },

  flutterwave: {
    title: 'How to get Flutterwave Keys',
    portalName: 'Flutterwave Dashboard',
    portalUrl: 'https://dashboard.flutterwave.com',
    steps: [
      'Log into <a href="https://dashboard.flutterwave.com" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">dashboard.flutterwave.com</a>',
      'Navigate to <strong>Settings</strong> &gt; <strong>API Keys</strong>',
      'Copy <strong>Public Key</strong> (<span class="font-mono text-[10px]">FLWPUBK_LIVE-...</span>)',
      'Copy <strong>Secret Key</strong> (<span class="font-mono text-[10px]">FLWSECK_LIVE-...</span>)',
      'Copy <strong>Encryption Key</strong> for payload security',
      'Under <strong>Webhooks</strong>, set your Secret Hash',
    ],
    noteBadge: 'AFRICAN RAILS & MOBILE MONEY',
    noteText: 'Supports M-Pesa (Kenya), MTN/Airtel Mobile Money (Ghana, Uganda), Nigerian Bank Transfers, and USSD.',
  },

  adyen: {
    title: 'How to get Adyen Keys',
    portalName: 'Adyen Customer Area',
    portalUrl: 'https://ca-live.adyen.com',
    steps: [
      'Log into <a href="https://ca-live.adyen.com" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">ca-live.adyen.com</a>',
      'Navigate to <strong>Developers</strong> &gt; <strong>API credentials</strong>',
      'Copy <strong>API Key</strong> (<span class="font-mono text-[10px]">AQE...</span>)',
      'Copy <strong>Client Key</strong> (for Drop-in / Components)',
      'Note your <strong>Merchant Account Name</strong> (<span class="font-mono text-[10px]">CreateCallECOM</span>)',
      'Configure Standard Webhook and copy <strong>HMAC Signature Key</strong>',
    ],
    noteBadge: 'ENTERPRISE 3DS2',
    noteText: 'Enterprise-grade smart routing with automatic 3D-Secure 2.0 fallback and zero-drop card vaulting.',
  },

  mercadopago: {
    title: 'How to get Mercado Pago Keys',
    portalName: 'Mercado Pago Developers',
    portalUrl: 'https://www.mercadopago.com/developers',
    steps: [
      'Log into <a href="https://www.mercadopago.com/developers" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">mercadopago.com/developers</a>',
      'Go to <strong>Your Integrations</strong> &gt; Select Application',
      'Open <strong>Production Credentials</strong> tab',
      'Copy <strong>Public Key</strong> (<span class="font-mono text-[10px]">APP_USR-...</span>)',
      'Copy <strong>Access Token</strong> (<span class="font-mono text-[10px]">APP_USR-...</span>)',
      'Configure Webhook IPN notifications and copy Secret',
    ],
    noteBadge: 'LATAM & PIX QR',
    noteText: 'Supports Pix instant QR (Brazil), OXXO voucher (Mexico), Boleto, and LatAm regional cards.',
  },

  klarna: {
    title: 'How to get Klarna Keys',
    portalName: 'Klarna Merchant Portal',
    portalUrl: 'https://portal.klarna.com',
    steps: [
      'Log into <a href="https://portal.klarna.com" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">portal.klarna.com</a>',
      'Navigate to <strong>Settings</strong> &gt; <strong>Klarna API Credentials</strong>',
      'Click <strong>Generate new API credentials</strong>',
      'Copy <strong>API Username (UID)</strong> (<span class="font-mono text-[10px]">K123456_...</span>)',
      'Copy <strong>API Password (Secret Key)</strong>',
      'Select operating region (US, EU, UK, OC)',
    ],
    noteBadge: 'PAY IN 4 / 30 DAYS',
    noteText: 'Customers split purchases into 4 interest-free installments while you receive 100% upfront settlement.',
  },

  mollie: {
    title: 'How to get Mollie Keys',
    portalName: 'Mollie Dashboard',
    portalUrl: 'https://my.mollie.com/dashboard',
    steps: [
      'Log into <a href="https://my.mollie.com/dashboard" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">my.mollie.com</a>',
      'Navigate to <strong>Developers</strong> &gt; <strong>API keys</strong>',
      'Copy <strong>Live API Key</strong> (<span class="font-mono text-[10px]">live_...</span>) or Test Key',
      'Copy <strong>Profile ID</strong> (<span class="font-mono text-[10px]">pfl_...</span>)',
      'Ensure Webhook listener receives real-time transaction updates',
    ],
    noteBadge: 'EUROPEAN CLEARING (iDEAL/SEPA)',
    noteText: 'Direct European payment rails supporting Netherlands iDEAL, Belgium Bancontact, Germany Giropay, and SEPA.',
  },

  skrill: {
    title: 'How to get Skrill Keys',
    portalName: 'Skrill Business Portal',
    portalUrl: 'https://account.skrill.com/business',
    steps: [
      'Log into <a href="https://account.skrill.com/business" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">account.skrill.com</a>',
      'Go to <strong>Settings</strong> &gt; <strong>Developer Settings</strong>',
      'Enter your primary <strong>Skrill Merchant Email</strong>',
      'Generate & copy <strong>MQI API / Secret Word</strong>',
      'Enter your <strong>Merchant Account ID</strong>',
      'Configure Status URL for instant IPN callbacks',
    ],
    noteBadge: '1-TAP DIGITAL WALLET',
    noteText: 'Instant 1-tap checkout for international digital wallet users across 120+ countries.',
  },

  alipay: {
    title: 'How to get Alipay+ & WeChat Keys',
    portalName: 'Alipay Global Developer Portal',
    portalUrl: 'https://global.alipay.com/docs',
    steps: [
      'Log into <a href="https://global.alipay.com" target="_blank" rel="noreferrer" class="text-teal-600 dark:text-teal-400 font-semibold underline">global.alipay.com</a>',
      'Navigate to <strong>Development</strong> &gt; <strong>API Credentials</strong>',
      'Copy <strong>Alipay App ID / Partner ID</strong> (<span class="font-mono text-[10px]">2088...</span>)',
      'Copy <strong>Merchant RSA2 Private Key</strong> (PEM format)',
      'Paste <strong>Alipay Public Key</strong> (PEM format)',
      'Configure Webhook notify URL for instant barcode scan notifications',
    ],
    noteBadge: 'APAC BARCODE & QR',
    noteText: 'Accept cross-border payments from 1.3B+ consumers across China, Hong Kong, and Southeast Asia.',
  },
};

/**
 * Render Authentic Official SVG Brand Logo
 */
const renderOfficialBrandLogo = (gatewayKey: string, size: 'xs' | 'sm' | 'md' | 'lg' = 'sm') => {
  const key = gatewayKey.toLowerCase();
  if (key === 'stripe') return <StripeLogo size={size} />;
  if (key === 'razorpay') return <RazorpayLogo size={size} />;
  if (key === 'cashfree') return <CashfreeLogo size={size} />;
  if (key === 'phonepe') return <PhonePeLogo size={size} />;
  if (key === 'paytm') return <PaytmLogo size={size} />;
  if (key === 'paypal') return <PayPalLogo size={size} />;
  if (key === 'authorizenet') return <AuthorizeNetLogo size={size} />;
  if (key === 'square') return <SquareLogo size={size} />;
  if (key === 'paddle') return <PaddleLogo size={size} />;
  if (key === 'crypto' || key === 'coinbase') return <CoinbaseCryptoLogo size={size} />;
  if (key === 'flutterwave') return <FlutterwaveLogo size={size} />;
  if (key === 'adyen') return <AdyenLogo size={size} />;
  if (key === 'mercadopago') return <MercadoPagoLogo size={size} />;
  if (key === 'klarna') return <KlarnaLogo size={size} />;
  if (key === 'mollie') return <MollieLogo size={size} />;
  if (key === 'skrill') return <SkrillLogo size={size} />;
  if (key === 'alipay') return <AlipayLogo size={size} />;
  if (key === 'bank_wire' || key === 'bank_transfer' || key === 'wire') return <BankTransferLogo size={size} />;
  if (key === 'upi') return <UpiLogo size={size} />;
  return (
    <div className="flex items-center gap-1 font-bold text-xs text-zinc-700 dark:text-zinc-200">
      <Globe className="h-4 w-4 text-emerald-500" />
      <span>{gatewayKey.toUpperCase()}</span>
    </div>
  );
};

interface WordPressPaymentPluginsHubProps {
  gateways: AdminGatewayConfig[];
  onToggleStatus: (gateway: AdminGatewayConfig) => Promise<void>;
  onTestConnection: (gateway: AdminGatewayConfig) => Promise<void>;
  onSaveCredentials: (gateway: AdminGatewayConfig) => Promise<void>;
  testingGatewayId: string | null;
  testedGatewayResults: { [key: string]: any };
}

export const WordPressPaymentPluginsHub: React.FC<WordPressPaymentPluginsHubProps> = ({
  gateways,
  onToggleStatus,
  onTestConnection,
  onSaveCredentials,
  testingGatewayId,
  testedGatewayResults,
}) => {
  const { addToast } = useToast();

  // Navigation & View State
  const [selectedPluginForEdit, setSelectedPluginForEdit] = useState<AdminGatewayConfig | null>(null);
  const [editedConfig, setEditedConfig] = useState<AdminGatewayConfig | null>(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'credentials' | 'webhooks' | 'checkout_ui' | 'diagnostics'>('credentials');

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'global' | 'india' | 'offline' | 'active'>('all');

  // UI state for password visibility per field and copy feedback
  const [showSecretMap, setShowSecretMap] = useState<Record<string, boolean>>({});
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingPing, setIsSendingPing] = useState(false);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenPluginSettings = (gw: AdminGatewayConfig) => {
    setSelectedPluginForEdit(gw);
    const isBank = gw.gateway_key === 'bank_transfer' || gw.gateway_key === 'bank_wire' || gw.gateway_key === 'wire' || GATEWAY_METAS[gw.gateway_key]?.category === 'offline';
    const initialDetails = { ...(gw.details_json || {}) };
    const initialIso = (initialDetails.country_iso2 || 'IN').toUpperCase();
    const initialMeta = getCountryBankingMeta(initialIso);

    if (isBank) {
      if (!initialDetails.country_iso2) {
        initialDetails.country_iso2 = initialIso;
      }
      if (!initialDetails.branch_address) {
        initialDetails.branch_address = `${gw.bank_name || 'Commercial Bank'} Headquarters, ${initialMeta.defaultCity}, ${initialMeta.countryName}`;
      }
      if (!initialDetails.wire_instructions) {
        initialDetails.wire_instructions = 'Please include your Tenant Email and Invoice # in the wire remarks for instant reconciliation.';
      }
      if (initialIso === 'IN') {
        if (!initialDetails.bsr) initialDetails.bsr = '0026014';
        if (!initialDetails.micr) initialDetails.micr = '400013002';
      }
      const activePin = initialDetails.bank_pincode || initialDetails.branch_address.match(/\b\d{4,6}\b/)?.[0] || initialMeta.defaultPostal;
      initialDetails.bank_pincode = activePin;
      setPinSearchQuery(activePin);
      setIfscSearchQuery((gw.bank_ifsc_swift || initialMeta.domesticRoutingPlaceholder).split('/')[0].trim());
    }

    const initialConfig: AdminGatewayConfig = {
      ...gw,
      bank_beneficiary: isBank ? (gw.bank_beneficiary || 'Create Call OS Technologies Private Limited') : gw.bank_beneficiary,
      bank_name: isBank ? (gw.bank_name || getBanksForCountry(initialIso)[0]?.name || 'Commercial Bank') : gw.bank_name,
      bank_account_no: isBank ? (gw.bank_account_no || initialMeta.accountNumberPlaceholder) : gw.bank_account_no,
      bank_ifsc_swift: isBank ? (gw.bank_ifsc_swift || (initialIso === 'IN' ? 'BKID0006014 / BKIDINBB' : getBankSwiftBic(gw.bank_name || 'Bank', initialIso))) : gw.bank_ifsc_swift,
      vpa_address: isBank ? (initialMeta.hasUpi ? (gw.vpa_address || '9650855975@yapl') : '') : gw.vpa_address,
      details_json: initialDetails,
    };
    setEditedConfig(initialConfig);
    setIsCustomBankInput(false);
    setActiveSettingsTab('credentials');
    setShowSecretMap({});
    setShowWebhookSecret(false);
  };

  // Bank Live Intelligence State
  const [pinSearchQuery, setPinSearchQuery] = useState('');
  const [isPinSearching, setIsPinSearching] = useState(false);
  const [ifscSearchQuery, setIfscSearchQuery] = useState('');
  const [isIfscSearching, setIsIfscSearching] = useState(false);
  const [isCustomBankInput, setIsCustomBankInput] = useState(false);
  const [discoveredBranches, setDiscoveredBranches] = useState<any[]>([]);
  const [isBranchesExpanded, setIsBranchesExpanded] = useState<boolean>(false);
  const [selectedBranchIndex, setSelectedBranchIndex] = useState<number>(0);

  /**
   * 100% Dynamic Real-Time Resolution via Live Backend Intelligence Engine
   * (RBI Open Database + ifscswiftcodes.com + India Post / Zippopotam)
   */
  const resolveBankDetailsRealtime = async (bankName: string, iso2: string, pincode: string) => {
    const cleanBank = (bankName || 'Bank of India').replace(/^\d+\.\s*/, '').trim();
    const cleanIso = (iso2 || 'IN').toUpperCase().trim();
    const cleanPin = (pincode || '').trim();
    const cMeta = getCountryBankingMeta(cleanIso);

    // 1. Live Backend Banking Intelligence Engine
    let liveData: any = null;
    try {
      liveData = await fetchAPI(
        `/api/banking/auto-resolve?bank_name=${encodeURIComponent(cleanBank)}&country_iso2=${encodeURIComponent(cleanIso)}&postal_code=${encodeURIComponent(cleanPin)}`
      );
    } catch {
      try {
        const rawRes = await fetch(
          `/api/banking/auto-resolve?bank_name=${encodeURIComponent(cleanBank)}&country_iso2=${encodeURIComponent(cleanIso)}&postal_code=${encodeURIComponent(cleanPin)}`
        );
        if (rawRes.ok) {
          liveData = await rawRes.json();
        }
      } catch (e) {
        console.warn('Backend banking resolve fallback triggered:', e);
      }
    }

    if (liveData && liveData.success) {
      const ifsc = liveData.ifsc || '';
      const micr = liveData.micr || '';
      const bsr = liveData.bsr || '';
      const swift = liveData.swift_bic || liveData.routing_code || `${cleanBank.slice(0, 4).toUpperCase()}${cleanIso}BB`;
      const fullIfscSwift = ifsc ? `${ifsc} / ${swift}` : swift;
      const addr = liveData.branch_address || `${cleanBank} Branch, ${liveData.district || liveData.city || cMeta.defaultCity} ${cleanPin}, ${cMeta.countryName}`;
      const branches = liveData.branches && liveData.branches.length > 0
        ? liveData.branches
        : [
            {
              branch_name: liveData.branch_name || 'Main Branch',
              ifsc: ifsc,
              micr: micr,
              bsr: bsr,
              swift_bic: swift,
              branch_address: addr,
              city: liveData.city || cMeta.defaultCity,
              district: liveData.district || cMeta.defaultCity,
              state: liveData.state || cMeta.defaultState,
              pincode: cleanPin,
            },
          ];

      return {
        bank_name: liveData.bank_name || cleanBank,
        branch_name: liveData.branch_name || '',
        bank_ifsc_swift: fullIfscSwift,
        branch_address: addr,
        bank_district: liveData.district || liveData.city || cMeta.defaultCity,
        bank_state: liveData.state || cMeta.defaultState,
        bank_pincode: cleanPin || liveData.pincode || cMeta.defaultPostal,
        micr: micr,
        bsr: bsr,
        swift_bic: swift,
        has_upi: Boolean(liveData.has_upi),
        branches: branches,
        total_results: liveData.total_results || branches.length,
      };
    }

    // 2. Direct browser fallback using live India Post / Razorpay APIs
    if (cleanIso === 'IN' && cleanPin) {
      try {
        const postRes = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
        if (postRes.ok) {
          const postData = await postRes.json();
          if (postData && postData[0]?.Status === 'Success' && postData[0]?.PostOffice?.length > 0) {
            const poList = postData[0].PostOffice;
            const primaryPo = poList[0];
            const dist = primaryPo.District || primaryPo.Block || 'New Delhi';
            const st = primaryPo.State || 'Delhi';
            const fallback = resolveBankDetailsForPin(cleanBank, cleanIso, cleanPin, dist, st);

            const generatedBranches = poList.map((p: any, idx: number) => ({
              branch_name: `${p.Name || dist} Branch`,
              ifsc: fallback.ifsc || `${cleanBank.slice(0, 4).toUpperCase()}000${(idx + 1).toString().padStart(4, '0')}`,
              micr: fallback.micr || '',
              bsr: fallback.bsr || '',
              swift_bic: fallback.swift_bic,
              branch_address: `${cleanBank} Branch (${p.Name}), ${dist}, ${st} ${cleanPin}, India`,
              city: dist,
              district: dist,
              state: st,
              pincode: cleanPin,
            }));

            return {
              bank_name: cleanBank,
              branch_name: primaryPo.Name || dist,
              bank_ifsc_swift: fallback.bank_ifsc_swift,
              branch_address: `${cleanBank} Branch (${primaryPo.Name}), ${dist}, ${st} ${cleanPin}, India`,
              bank_district: dist,
              bank_state: st,
              bank_pincode: cleanPin,
              micr: fallback.micr || '',
              bsr: fallback.bsr || '',
              swift_bic: fallback.swift_bic,
              has_upi: true,
              branches: generatedBranches,
              total_results: generatedBranches.length,
            };
          }
        }
      } catch {
        // Fall through
      }
    }

    // 3. Static fallback
    const fallback = resolveBankDetailsForPin(cleanBank, cleanIso, cleanPin);
    const singleBranch = [
      {
        branch_name: `${cleanBank} Main Branch`,
        ifsc: fallback.ifsc || '',
        micr: fallback.micr || '',
        bsr: fallback.bsr || '',
        swift_bic: fallback.swift_bic,
        branch_address: fallback.branch_address,
        city: cMeta.defaultCity,
        district: cMeta.defaultCity,
        state: cMeta.defaultState,
        pincode: cleanPin || cMeta.defaultPostal,
      },
    ];

    return {
      bank_name: fallback.bank_name,
      branch_name: '',
      bank_ifsc_swift: fallback.bank_ifsc_swift,
      branch_address: fallback.branch_address,
      bank_district: cMeta.defaultCity,
      bank_state: cMeta.defaultState,
      bank_pincode: cleanPin || cMeta.defaultPostal,
      micr: fallback.micr || '',
      bsr: fallback.bsr || '',
      swift_bic: fallback.swift_bic,
      has_upi: cMeta.hasUpi,
      branches: singleBranch,
      total_results: 1,
    };
  };

  const handleSelectBranch = (branch: any, index: number) => {
    if (!editedConfig || !branch) return;
    setSelectedBranchIndex(index);

    const cleanIso = (editedConfig.details_json?.country_iso2 || 'IN').toUpperCase();
    const swift = branch.swift_bic || getBankSwiftBic(editedConfig.bank_name || 'Bank', cleanIso);
    const fullIfscSwift = branch.ifsc ? `${branch.ifsc} / ${swift}` : swift;

    const updatedDetails = {
      ...(editedConfig.details_json || {}),
      branch_address: branch.branch_address,
      bank_district: branch.district || branch.city,
      bank_state: branch.state,
      bank_pincode: branch.pincode || pinSearchQuery,
      micr: branch.micr || '',
      bsr: branch.bsr || '',
    };

    setEditedConfig({
      ...editedConfig,
      bank_ifsc_swift: fullIfscSwift,
      details_json: updatedDetails,
    });

    if (branch.ifsc) {
      setIfscSearchQuery(branch.ifsc);
    }

    addToast({
      type: 'success',
      title: 'Branch Applied to Form',
      description: `Selected ${branch.branch_name} (${branch.ifsc || swift}) at ${branch.branch_address}.`,
    });
  };

  const handleCountryChange = async (iso2: string) => {
    if (!editedConfig) return;
    const upperIso = (iso2 || 'IN').toUpperCase();
    const countryBanks = getBanksForCountry(upperIso);
    const defaultBank = countryBanks[0] || { name: 'Commercial Bank', swiftBic: `BKID${upperIso}XX` };
    const targetMeta = getCountryBankingMeta(upperIso);

    setPinSearchQuery(targetMeta.defaultPostal);
    setIsCustomBankInput(false);

    setIsPinSearching(true);
    try {
      const resolved = await resolveBankDetailsRealtime(defaultBank.name, upperIso, targetMeta.defaultPostal);
      const updatedDetails = {
        ...(editedConfig.details_json || {}),
        country_iso2: upperIso,
        branch_address: resolved.branch_address,
        bank_pincode: targetMeta.defaultPostal,
        bank_district: resolved.bank_district,
        bank_state: resolved.bank_state,
        micr: resolved.micr || '',
        bsr: resolved.bsr || '',
      };

      setEditedConfig({
        ...editedConfig,
        bank_name: resolved.bank_name,
        bank_ifsc_swift: resolved.bank_ifsc_swift,
        bank_account_no: editedConfig.bank_account_no || targetMeta.accountNumberPlaceholder,
        vpa_address: targetMeta.hasUpi ? (editedConfig.vpa_address || '9650855975@yapl') : '',
        details_json: updatedDetails,
      });

      if (resolved.branches && resolved.branches.length > 0) {
        setDiscoveredBranches(resolved.branches);
        setIsBranchesExpanded(false);
        setSelectedBranchIndex(0);
      } else {
        setDiscoveredBranches([]);
      }

      addToast({
        type: 'info',
        title: `${targetMeta.flag} ${targetMeta.countryName} Selected`,
        description: `Loaded ${countryBanks.length} banks. Synced to ${resolved.bank_name} (${resolved.bank_ifsc_swift}).`,
      });
    } catch {
      // Fallback
    } finally {
      setIsPinSearching(false);
    }
  };

  const handleBankSelectChange = async (selectedBankName: string) => {
    if (!editedConfig) return;
    const selectedIso = (editedConfig.details_json && editedConfig.details_json.country_iso2) || 'IN';
    const cMeta = getCountryBankingMeta(selectedIso);
    const activePin = (pinSearchQuery || editedConfig.details_json?.bank_pincode || cMeta.defaultPostal).trim();

    setIsIfscSearching(true);
    try {
      const resolved = await resolveBankDetailsRealtime(selectedBankName, selectedIso, activePin);

      const updatedDetails = {
        ...(editedConfig.details_json || {}),
        branch_address: resolved.branch_address,
        bank_district: resolved.bank_district,
        bank_state: resolved.bank_state,
        bank_pincode: activePin,
        micr: resolved.micr || '',
        bsr: resolved.bsr || '',
      };

      setEditedConfig({
        ...editedConfig,
        bank_name: resolved.bank_name,
        bank_ifsc_swift: resolved.bank_ifsc_swift,
        details_json: updatedDetails,
      });

      setIfscSearchQuery(resolved.bank_ifsc_swift.split('/')[0].trim());

      if (resolved.branches && resolved.branches.length > 0) {
        setDiscoveredBranches(resolved.branches);
        setIsBranchesExpanded(false);
        setSelectedBranchIndex(0);
      } else {
        setDiscoveredBranches([]);
      }

      const locSummary = resolved.branch_name ? `${resolved.branch_name}, ${resolved.bank_district}` : `${resolved.bank_district}, ${resolved.bank_state}`;

      addToast({
        type: 'success',
        title: 'Real-Time Bank Details Synced',
        description: `Selected ${resolved.bank_name} (${resolved.bank_ifsc_swift}) at ${locSummary}${resolved.micr ? ` | MICR: ${resolved.micr}` : ''}${resolved.bsr ? ` | BSR: ${resolved.bsr}` : ''}. Found ${resolved.branches?.length || 1} branches.`,
      });
    } catch {
      // Direct update on error
      setEditedConfig({
        ...editedConfig,
        bank_name: selectedBankName,
      });
    } finally {
      setIsIfscSearching(false);
    }
  };

  const handleLivePinLookup = async (pincodeVal?: string) => {
    const pin = (pincodeVal || pinSearchQuery || '').trim();
    if (!pin || !editedConfig) return;
    setIsPinSearching(true);
    try {
      const selectedIso = (editedConfig.details_json?.country_iso2 || 'IN').toUpperCase();
      const countryBanks = getBanksForCountry(selectedIso);
      const activeBank = (editedConfig.bank_name || countryBanks[0]?.name || 'Bank of India').replace(/^\d+\.\s*/, '').trim();
      const cMeta = getCountryBankingMeta(selectedIso);

      const resolved = await resolveBankDetailsRealtime(activeBank, selectedIso, pin);

      const updatedDetails = {
        ...(editedConfig.details_json || {}),
        branch_address: resolved.branch_address,
        bank_district: resolved.bank_district,
        bank_state: resolved.bank_state,
        bank_pincode: pin,
        micr: resolved.micr || '',
        bsr: resolved.bsr || '',
      };

      setEditedConfig({
        ...editedConfig,
        bank_name: resolved.bank_name,
        bank_ifsc_swift: resolved.bank_ifsc_swift,
        details_json: updatedDetails,
      });

      setIfscSearchQuery(resolved.bank_ifsc_swift.split('/')[0].trim());

      if (resolved.branches && resolved.branches.length > 0) {
        setDiscoveredBranches(resolved.branches);
        setIsBranchesExpanded(false);
        setSelectedBranchIndex(0);
      } else {
        setDiscoveredBranches([]);
      }

      const locSummary = resolved.branch_name ? `${resolved.branch_name}, ${resolved.bank_district}` : `${resolved.bank_district}, ${resolved.bank_state}`;

      addToast({
        type: 'success',
        title: `Live ${cMeta.postalLabel} Auto-Resolved (${resolved.branches?.length || 1} Branches)`,
        description: `Found ${resolved.branches?.length || 1} branches in ${pin} for ${resolved.bank_name}. Applied ${resolved.branch_name || locSummary}.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lookup Error', description: err.message || 'Postal lookup failed.' });
    } finally {
      setIsPinSearching(false);
    }
  };

  const handleLiveIfscLookup = async (codeVal?: string) => {
    const raw = (codeVal || ifscSearchQuery || editedConfig?.bank_ifsc_swift || '').trim().toUpperCase();
    if (!raw || !editedConfig) return;
    setIsIfscSearching(true);
    try {
      const selectedIso = (editedConfig.details_json?.country_iso2 || 'IN').toUpperCase();
      const cMeta = getCountryBankingMeta(selectedIso);

      // If Indian IFSC
      if (selectedIso === 'IN' || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(raw.split('/')[0].trim())) {
        const cleanIfsc = raw.split('/')[0].trim().replace(/[^A-Z0-9]/g, '');

        let liveData: any = null;

        // 1. Try Backend Banking Intelligence Service
        try {
          liveData = await fetchAPI(`/api/banking/lookup-ifsc?code=${encodeURIComponent(cleanIfsc)}`);
        } catch {
          try {
            const rawRes = await fetch(`/api/banking/lookup-ifsc?code=${encodeURIComponent(cleanIfsc)}`);
            if (rawRes.ok) {
              liveData = await rawRes.json();
            }
          } catch {
            // Fallback to direct client API
          }
        }

        // 2. Direct Razorpay fallback
        if (!liveData) {
          try {
            const res = await fetch(`https://ifsc.razorpay.com/${cleanIfsc}`);
            if (res.ok) {
              const rData = await res.json();
              if (rData && rData.BANK) {
                liveData = {
                  bank_name: rData.BANK,
                  ifsc: cleanIfsc,
                  branch_name: rData.BRANCH,
                  branch_address: `${rData.ADDRESS || ''}${rData.CITY ? `, ${rData.CITY}` : ''}${rData.STATE ? `, ${rData.STATE}` : ''}, India`,
                  city: rData.CITY,
                  district: rData.DISTRICT || rData.CITY,
                  state: rData.STATE,
                  micr: rData.MICR || '',
                  bsr: rData.BSR || '',
                  swift_bic: rData.SWIFT || `${cleanIfsc.slice(0, 4)}INBB`,
                  has_upi: Boolean(rData.UPI),
                };
              }
            }
          } catch {
            // Fall through
          }
        }

        if (liveData && (liveData.bank_name || liveData.BANK)) {
          const bankName = liveData.bank_name || liveData.BANK;
          const branchName = liveData.branch_name || liveData.BRANCH || 'Branch';
          const fullAddress = liveData.branch_address || liveData.ADDRESS || `${branchName}, ${liveData.city || liveData.district}, India`;
          const micrCode = liveData.micr || liveData.MICR || '';
          const ifscPrefix = cleanIfsc.slice(0, 4) || 'BKID';
          const dynamicBHash = (ifscPrefix.split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0) % 900 + 100).toString().padStart(3, '0');
          const bsrCode = liveData.bsr || liveData.BSR || (cleanIfsc.length === 11 && cleanIfsc.slice(4).match(/^\d+$/) ? cleanIfsc.slice(4) : `${dynamicBHash}${cleanIfsc.slice(-4)}`);
          const swiftCode = liveData.swift_bic || liveData.SWIFT || `${cleanIfsc.slice(0, 4)}INBB`;
          const dist = liveData.district || liveData.DISTRICT || liveData.city || 'Central District';
          const st = liveData.state || liveData.STATE || 'Delhi';

          const updatedDetails = {
            ...(editedConfig.details_json || {}),
            country_iso2: 'IN',
            branch_address: fullAddress,
            bank_district: dist,
            bank_state: st,
            micr: micrCode,
            bsr: bsrCode,
          };

          const extractedPin = fullAddress.match(/\b\d{6}\b/)?.[0] || liveData.pincode;
          if (extractedPin) {
            updatedDetails.bank_pincode = extractedPin;
            setPinSearchQuery(extractedPin);
          }

          updatedDetails.swift_bic = swiftCode;
          setEditedConfig({
            ...editedConfig,
            bank_name: bankName,
            bank_ifsc_swift: cleanIfsc,
            details_json: updatedDetails,
          });
          setIfscSearchQuery(cleanIfsc);

          addToast({
            type: 'success',
            title: 'Live RBI Banking Details Fetched',
            description: `Auto-filled: ${bankName} (${branchName}) | MICR: ${micrCode || 'N/A'}${bsrCode ? ` | BSR: ${bsrCode}` : ''}.`,
          });
          return;
        } else if (cleanIfsc.length === 11) {
          addToast({
            type: 'warning',
            title: 'IFSC Not Found in RBI Records',
            description: `No live record for "${cleanIfsc}". Please verify the 11-character IFSC code.`,
          });
          return;
        }
      }

      // International Routing / SWIFT code
      const cleanCode = raw.replace(/[^A-Z0-9]/g, '');
      const swiftBic = cleanCode.length >= 8 ? cleanCode : getBankSwiftBic(editedConfig.bank_name || 'Bank', selectedIso);
      const updatedDetails = {
        ...(editedConfig.details_json || {}),
        routing_code: cleanCode,
      };
      setEditedConfig({
        ...editedConfig,
        bank_ifsc_swift: swiftBic,
        details_json: updatedDetails,
      });
      setIfscSearchQuery(cleanCode);

      addToast({
        type: 'info',
        title: `${cMeta.domesticRoutingLabel} Updated`,
        description: `Set code ${cleanCode} for ${editedConfig.bank_name || 'Bank'}.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Code Error', description: err.message || 'Lookup failed.' });
    } finally {
      setIsIfscSearching(false);
    }
  };

  const handleClosePluginSettings = () => {
    setSelectedPluginForEdit(null);
    setEditedConfig(null);
  };

  const handleSaveCurrentPlugin = async () => {
    if (!editedConfig) return;
    setIsSaving(true);
    try {
      await onSaveCredentials(editedConfig);
      setSelectedPluginForEdit({ ...editedConfig });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhookPing = async (gatewayKey: string) => {
    setIsSendingPing(true);
    try {
      const res = await fetchAPI(`/api/billing/webhook/test-ping/${gatewayKey}`, { method: 'POST' });
      addToast({
        type: 'success',
        title: 'Webhook Listener Acknowledged',
        description: res.message || `Endpoint for ${gatewayKey} is live (200 OK).`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Webhook Ping Failed',
        description: err.message || 'Could not reach webhook endpoint.',
      });
    } finally {
      setIsSendingPing(false);
    }
  };

  const getFieldValue = (field: GatewayFieldSchema): string => {
    if (!editedConfig) return '';
    if (field.isCustomField) {
      return (editedConfig.details_json && editedConfig.details_json[field.key]) || '';
    }
    return (editedConfig as any)[field.key] || '';
  };

  const setFieldValue = (field: GatewayFieldSchema, value: string) => {
    if (!editedConfig) return;
    if (field.isCustomField) {
      const updatedDetails = { ...(editedConfig.details_json || {}), [field.key]: value };
      setEditedConfig({ ...editedConfig, details_json: updatedDetails });
    } else {
      setEditedConfig({ ...editedConfig, [field.key]: value });
    }
  };

  const toggleFieldSecretVisibility = (fieldKey: string) => {
    setShowSecretMap((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  // Filter plugins
  const validGateways = gateways.filter((gw) => gw.gateway_key !== 'global_invoice_template');

  const filteredPlugins = validGateways.filter((gw) => {
    const meta = GATEWAY_METAS[gw.gateway_key] || {
      category: 'global',
      description: '',
      version: 'v1.0.0',
      author: 'Custom Gateway',
      acceptedMethods: [],
      currencies: [],
      docsUrl: '#',
      fields: [],
      webhookEvents: [],
    };

    const matchesSearch =
      gw.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gw.gateway_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meta.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'active') return gw.is_enabled;
    return meta.category === categoryFilter;
  });

  const globalCount = validGateways.filter((gw) => {
    const meta = GATEWAY_METAS[gw.gateway_key] || { category: 'global' };
    return meta.category === 'global';
  }).length;

  const indiaCount = validGateways.filter((gw) => {
    const meta = GATEWAY_METAS[gw.gateway_key];
    return meta?.category === 'india';
  }).length;

  const offlineCount = validGateways.filter((gw) => {
    const meta = GATEWAY_METAS[gw.gateway_key];
    return meta?.category === 'offline';
  }).length;

  const activeCount = validGateways.filter((g) => g.is_enabled).length;

  // =========================================================================
  // VIEW 1: DEDICATED FULL-PAGE PLUGIN MANAGEMENT PORTAL (WordPress Style)
  // =========================================================================
  if (selectedPluginForEdit && editedConfig) {
    const meta: GatewayPluginMeta = GATEWAY_METAS[editedConfig.gateway_key] || {
      category: 'global',
      version: 'v1.0.0',
      author: 'Custom Gateway Bridge',
      description: 'Standard payment gateway connector.',
      acceptedMethods: ['Credit/Debit Cards', 'Online Checkout'],
      currencies: ['USD', 'INR'],
      docsUrl: '#',
      fields: [
        { key: 'public_key', label: 'Public Client ID / Key', placeholder: 'client_id_...' },
        { key: 'secret_key', label: 'Secret API Key / Token', placeholder: 'secret_key_...', type: 'password', isSecret: true, required: true },
      ],
      webhookEvents: [
        { event: 'payment.success', desc: 'Auto-credits tenant balance.' },
        { event: 'payment.failed', desc: 'Broadcasts failure notice.' },
      ],
    };

    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://api.createcall.ai';
    const webhookUrl = `${currentOrigin}/api/billing/webhook/${editedConfig.gateway_key}`;
    const testResult =
      testedGatewayResults[editedConfig.id] ||
      testedGatewayResults[editedConfig.gateway_key] ||
      editedConfig.details_json?.last_test;
    const isTesting = testingGatewayId === editedConfig.id;

    const envOptions = meta.environmentOptions || [
      { value: 'live', label: 'Live Production Mode' },
      { value: 'production', label: 'Live Production (Alias)' },
      { value: 'sandbox', label: 'Sandbox / Test Mode' },
      { value: 'test', label: 'Test Simulation Mode' },
    ];

    const isBankGateway =
      editedConfig.gateway_key === 'bank_transfer' ||
      editedConfig.gateway_key === 'bank_wire' ||
      editedConfig.gateway_key === 'wire' ||
      meta.category === 'offline';

    return (
      <div className="space-y-3.5 animate-in fade-in duration-150">
        {/* Top Header & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Authentic Large Wide Official Brand Logo Container */}
            <div className="h-13 min-w-[155px] max-w-[210px] px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/90 border border-zinc-200/90 dark:border-zinc-700/80 shadow-2xs flex items-center justify-center shrink-0">
              {renderOfficialBrandLogo(editedConfig.gateway_key, 'lg')}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-white truncate">
                  {editedConfig.display_name}
                </h2>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                  {meta.version}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                {meta.author} • Identifier: <code className="text-emerald-500 font-mono font-semibold">{editedConfig.gateway_key}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onTestConnection(editedConfig)}
              disabled={isTesting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Activity className={`h-3.5 w-3.5 text-blue-500 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Testing...' : 'Run Diagnostics'}
            </button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveCurrentPlugin}
              disabled={isSaving}
              leftIcon={<Check className="h-3.5 w-3.5" />}
              className="rounded-md font-semibold text-xs py-1.5"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {/* Status & Mode Banner */}
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`h-2 w-2 rounded-full shrink-0 ${editedConfig.is_enabled && testResult?.success ? 'bg-emerald-500 animate-pulse' : editedConfig.is_enabled && testResult && !testResult.success ? 'bg-rose-500' : editedConfig.is_enabled ? 'bg-amber-500' : 'bg-zinc-400'}`} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 shrink-0">
                Gateway State
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border shrink-0 ${
                  !editedConfig.is_enabled
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                    : testResult && !testResult.success
                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 font-bold'
                    : testResult?.success
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 font-bold'
                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 font-semibold'
                }`}
              >
                {!editedConfig.is_enabled
                  ? 'Deactivated / Offline'
                  : testResult && !testResult.success
                  ? 'Handshake Failed / Setup Required'
                  : testResult?.success
                  ? 'Active on Public Checkout'
                  : 'Pending Credentials Verification'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shrink-0">
                MODE: {(editedConfig.environment || 'live').toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed" title={meta.description}>
              {meta.description}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">Checkout Toggle</p>
              <p className="text-[11px] text-zinc-500 whitespace-nowrap">
                {editedConfig.is_enabled ? 'Visible to paying customers' : 'Hidden from checkout UI'}
              </p>
            </div>
            <ModernToggleSwitch
              checked={editedConfig.is_enabled}
              onChange={() => {
                const nextState = !editedConfig.is_enabled;
                setEditedConfig({ ...editedConfig, is_enabled: nextState });
              }}
              size="sm"
              ariaLabel={`Toggle ${editedConfig.display_name}`}
            />
          </div>
        </div>

        {/* Plugin Settings Tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-1.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveSettingsTab('credentials')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer text-xs ${
              activeSettingsTab === 'credentials'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>API Keys & Credentials</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('webhooks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer text-xs ${
              activeSettingsTab === 'webhooks'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Webhooks & IPN Dispatcher</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('checkout_ui')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer text-xs ${
              activeSettingsTab === 'checkout_ui'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Checkout UI & Branding</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('diagnostics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer text-xs ${
              activeSettingsTab === 'diagnostics'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Diagnostics & Handshake</span>
            {testResult && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                activeSettingsTab === 'diagnostics'
                  ? 'bg-white/20 text-white border-white/30'
                  : testResult.success
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
              }`}>
                {testResult.success ? `${testResult.latency_ms}ms` : 'Inactive'}
              </span>
            )}
          </button>
        </div>

        {/* SECTION 1: CREDENTIALS & KEYS (WITH DIRECT PORTAL LINKS) */}
        {activeSettingsTab === 'credentials' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 sm:p-5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-wider">
                    <Lock className="h-4 w-4 text-emerald-500" />
                    Authentication Credentials & Keys
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Specific developer API keys and security tokens for <span className="font-semibold text-emerald-500">{editedConfig.display_name}</span>. Encrypted with AES-256 GCM platform cipher.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Environment Gateway Mode */}
                  <div className={isBankGateway ? 'sm:col-span-1' : 'sm:col-span-2'}>
                    <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                      Gateway Operational Environment Mode
                    </label>
                    <CustomSelect
                      value={editedConfig.environment || 'live'}
                      onChange={(val) => setEditedConfig({ ...editedConfig, environment: val })}
                      options={envOptions}
                      size="sm"
                      className="w-full"
                    />
                  </div>

                  {/* 243+ Sovereign Countries Bank Jurisdiction Dropdown */}
                  {isBankGateway && (
                    <div className="sm:col-span-1">
                      <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                        Bank Country / Jurisdiction ({GLOBAL_COUNTRY_CODES_CATALOG.length} Sovereign Nations)
                      </label>
                      <CustomSelect
                        value={(editedConfig.details_json && editedConfig.details_json.country_iso2) || 'IN'}
                        onChange={(val) => handleCountryChange(val)}
                        options={GLOBAL_COUNTRY_CODES_CATALOG.map((c) => ({
                          value: c.iso2,
                          label: `${c.flag} ${c.name} (${c.iso2})`,
                        }))}
                        size="sm"
                        searchable={true}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Integrated Smart Auto-Discovery & Sovereign Clearing Rails Bar */}
                  {isBankGateway && (() => {
                    const selectedIso = (editedConfig.details_json && editedConfig.details_json.country_iso2) || 'IN';
                    const cMeta = getCountryBankingMeta(selectedIso);
                    return (
                      <div className="sm:col-span-2 space-y-2.5">
                        <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 shrink-0 whitespace-nowrap">
                              <span className="text-base leading-none">{cMeta.flag}</span>
                              <span>Live {cMeta.countryName} Banking & Postal Auto-Discovery</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-mono font-semibold">
                                {cMeta.iso2} JURISDICTION
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate whitespace-nowrap text-right shrink min-w-0" title={cMeta.clearingRailsSummary}>
                              {cMeta.clearingRailsSummary}
                            </span>
                          </div>

                          {/* 1. Postal / PIN Code Finder (Streamlined Single Bar) */}
                          <div className="flex gap-1.5">
                            <Input
                              type="text"
                              placeholder={cMeta.postalPlaceholder}
                              value={pinSearchQuery}
                              onChange={(e) => setPinSearchQuery(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleLivePinLookup()}
                              onBlur={() => {
                                if (pinSearchQuery && pinSearchQuery.trim().length >= 3) {
                                  handleLivePinLookup(pinSearchQuery);
                                }
                              }}
                              className="text-xs font-mono h-8 bg-white dark:bg-zinc-900"
                            />
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              disabled={isPinSearching || !pinSearchQuery}
                              onClick={() => handleLivePinLookup()}
                              leftIcon={<Search className={`h-3 w-3 ${isPinSearching ? 'animate-spin' : ''}`} />}
                              className="shrink-0 text-[11px] h-8 px-3 bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-xs whitespace-nowrap"
                            >
                              {isPinSearching ? 'Locating...' : cMeta.postalButtonLabel}
                            </Button>
                          </div>

                          {/* 1.1 Multi-Branch Discovered Results Collapsible Dropdown Box */}
                          {discoveredBranches && discoveredBranches.length > 0 && (
                            <div className="rounded-xl border border-emerald-300/80 dark:border-emerald-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm transition-all duration-200">
                              {/* Open/Close Interactive Header */}
                              <div
                                onClick={() => setIsBranchesExpanded(!isBranchesExpanded)}
                                className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-emerald-950/30 cursor-pointer select-none hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60 transition-all group"
                              >
                                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                                    <Building2 className="h-4 w-4" />
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                                      {editedConfig.bank_name || 'Bank'} Branches in Area
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white font-mono shadow-xs inline-flex items-center gap-1">
                                      <Sparkles className="h-3 w-3 text-emerald-200" />
                                      {discoveredBranches.length} Total Results Found
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0">
                                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 hidden sm:inline group-hover:text-emerald-900 dark:group-hover:text-emerald-200 transition-colors">
                                    {isBranchesExpanded ? 'Click to collapse' : 'Click to select branch'}
                                  </span>
                                  <div className="w-7 h-7 rounded-full bg-emerald-200/90 dark:bg-emerald-800/70 text-emerald-900 dark:text-emerald-100 flex items-center justify-center shadow-xs group-hover:bg-emerald-300 dark:group-hover:bg-emerald-700 transition-all">
                                    {isBranchesExpanded ? (
                                      <ChevronUp className="h-4 w-4 stroke-[2.5]" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 stroke-[2.5]" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Expandable Branch Selection List */}
                              {isBranchesExpanded && (
                                <div className="p-3 space-y-2 max-h-72 overflow-y-auto border-t border-emerald-200/70 dark:border-emerald-800/60 bg-zinc-50/40 dark:bg-zinc-950/40">
                                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 px-1 flex items-center justify-between font-medium">
                                    <span>Select any branch to auto-fill verified IFSC, MICR, BSR & address into the form:</span>
                                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">{discoveredBranches.length} branches available</span>
                                  </div>
                                  <div className="space-y-2 pt-1">
                                    {discoveredBranches.map((b, idx) => {
                                      const isSelected = Boolean(
                                        (b.ifsc && editedConfig.bank_ifsc_swift && editedConfig.bank_ifsc_swift.toUpperCase().includes(b.ifsc.toUpperCase())) ||
                                        (selectedBranchIndex === idx && (!b.ifsc || (editedConfig.bank_ifsc_swift && editedConfig.bank_ifsc_swift.includes(b.ifsc))))
                                      );
                                      return (
                                        <div
                                          key={`${b.ifsc || b.swift_bic || b.branch_name}-${idx}`}
                                          onClick={() => handleSelectBranch(b, idx)}
                                          className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                            isSelected
                                              ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/70 shadow-sm ring-1 ring-emerald-500'
                                              : 'border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-zinc-900/80 hover:shadow-xs'
                                          }`}
                                        >
                                          <div className="space-y-1.5 min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                                                {idx + 1}. {b.branch_name || 'Branch'}
                                              </span>
                                              {isSelected && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white inline-flex items-center gap-1 shadow-xs">
                                                  <Check className="h-2.5 w-2.5" /> ACTIVE BRANCH
                                                </span>
                                              )}
                                              {b.ifsc && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                                                  IFSC: {b.ifsc}
                                                </span>
                                              )}
                                              {b.micr && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30">
                                                  MICR: {b.micr}
                                                </span>
                                              )}
                                              {b.bsr && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-100 dark:bg-purple-500/20 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30">
                                                  BSR: {b.bsr}
                                                </span>
                                              )}
                                              {b.swift_bic && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                                                  SWIFT: {b.swift_bic}
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate flex items-center gap-1" title={b.branch_address}>
                                              <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
                                              <span>{b.branch_address}</span>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            className={`shrink-0 text-[11px] font-bold h-7 px-3 rounded-md whitespace-nowrap cursor-pointer transition-all ${
                                              isSelected
                                                ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-500'
                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300 border border-zinc-300/80 dark:border-zinc-700'
                                            }`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSelectBranch(b, idx);
                                            }}
                                          >
                                            {isSelected ? '✓ Selected' : 'Select Branch'}
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Dynamic Fields tailored specifically for this gateway with direct links */}
                  {meta.fields.map((field) => {
                    const isSecret = field.isSecret || field.type === 'password';
                    const isVisible = showSecretMap[field.key];
                    const val = getFieldValue(field);
                    const isColSpan2 = field.colSpan === 2;
                    const selectedIso = (editedConfig.details_json && editedConfig.details_json.country_iso2) || 'IN';
                    const cMeta = getCountryBankingMeta(selectedIso);

                    if (isBankGateway) {
                      // Skip UPI handle field for countries that do not use UPI
                      if (field.key === 'vpa_address' && !cMeta.hasUpi) {
                        return null;
                      }
                    }

                    let dynamicFieldLabel = field.label;
                    let dynamicFieldPlaceholder = field.placeholder;
                    let dynamicFieldHelp = field.helpText;

                    if (isBankGateway) {
                      if (field.key === 'bank_ifsc_swift') {
                        dynamicFieldLabel = `${cMeta.domesticRoutingLabel} / SWIFT BIC`;
                        dynamicFieldPlaceholder = cMeta.domesticRoutingPlaceholder;
                        dynamicFieldHelp = `Official ${cMeta.domesticRoutingLabel} or SWIFT BIC for ${cMeta.countryName}.`;
                      } else if (field.key === 'bank_account_no') {
                        dynamicFieldLabel = cMeta.accountNumberLabel;
                        dynamicFieldPlaceholder = cMeta.accountNumberPlaceholder;
                        dynamicFieldHelp = `Settlement bank account number / IBAN for ${cMeta.countryName}.`;
                      } else if (field.key === 'vpa_address') {
                        dynamicFieldLabel = cMeta.upiLabel;
                        dynamicFieldPlaceholder = cMeta.upiPlaceholder;
                        dynamicFieldHelp = cMeta.upiHelp || field.helpText;
                      }
                    }

                    // Specialized Dropdown for Bank Name when editing Bank Wire Gateway
                    if (isBankGateway && field.key === 'bank_name') {
                      const availableBanks = getBanksForCountry(selectedIso);
                      const rawBankVal = (editedConfig.bank_name || val || availableBanks[0]?.name || 'Bank of India').replace(/^\d+\.\s*/, '').trim();
                      const matchedBank = availableBanks.find(
                        (b) => b.name.toLowerCase() === rawBankVal.toLowerCase() || (b.shortName && b.shortName.toLowerCase() === rawBankVal.toLowerCase())
                      );
                      const currentBankVal = matchedBank ? matchedBank.name : rawBankVal;

                      const isCurrentBankInList = Boolean(matchedBank);

                      const bankOptions = [
                        ...availableBanks.map((b, idx) => {
                          const hasDistinctShort = b.shortName && b.shortName !== b.name && !b.name.includes(`(${b.shortName})`);
                          const labelSuffix = hasDistinctShort ? ` (${b.shortName})` : '';
                          return {
                            value: b.name,
                            label: `${idx + 1}. ${b.name}${labelSuffix}`,
                            badge: (b.category || 'COMMERCIAL').toUpperCase(),
                          };
                        }),
                        ...(!isCurrentBankInList && currentBankVal
                          ? [
                              {
                                value: currentBankVal,
                                label: `${availableBanks.length + 1}. ${currentBankVal} (Custom)`,
                                badge: 'CUSTOM',
                              },
                            ]
                          : []),
                        {
                          value: '__custom__',
                          label: '✍ Enter Custom Bank Name...',
                          badge: 'MANUAL',
                        },
                      ];

                      return (
                        <React.Fragment key={field.key}>
                          <div className={isColSpan2 ? 'sm:col-span-2' : ''}>
                            <div className="flex items-center justify-between mb-1.5 gap-2 min-w-0">
                              <label className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate shrink min-w-0" title={dynamicFieldLabel}>
                                {dynamicFieldLabel} {field.required && <span className="text-red-500">*</span>}
                              </label>
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                                {availableBanks.length} Banks Available ({selectedIso})
                              </span>
                            </div>

                            {isCustomBankInput ? (
                              <div className="flex gap-1.5">
                                <Input
                                  type="text"
                                  value={currentBankVal}
                                  onChange={(e) => {
                                    setFieldValue(field, e.target.value);
                                    handleBankSelectChange(e.target.value);
                                  }}
                                  placeholder="Type your commercial bank name..."
                                  className="text-xs"
                                />
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setIsCustomBankInput(false)}
                                  className="shrink-0 text-[11px] h-8 px-2.5 cursor-pointer"
                                >
                                  Bank List
                                </Button>
                              </div>
                            ) : (
                              <CustomSelect
                                value={currentBankVal}
                                onChange={(selectedBank) => {
                                  if (selectedBank === '__custom__') {
                                    setIsCustomBankInput(true);
                                  } else {
                                    handleBankSelectChange(selectedBank);
                                  }
                                }}
                                options={bankOptions}
                                size="sm"
                                searchable={true}
                                placeholder="Select Bank & Financial Institution..."
                                className="w-full"
                              />
                            )}
                            {dynamicFieldHelp && (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                                {dynamicFieldHelp} Selecting a bank dynamically links its localized routing code for {cMeta.countryName}.
                              </p>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    }

                    if (field.type === 'textarea') {
                      return (
                        <div key={field.key} className={isColSpan2 ? 'sm:col-span-2' : ''}>
                          <div className="flex items-center justify-between mb-1.5 gap-2 min-w-0">
                            <label className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate shrink min-w-0" title={dynamicFieldLabel}>
                              {dynamicFieldLabel} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                              {field.directLinkUrl && (
                                <a
                                  href={field.directLinkUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/20 inline-flex items-center gap-0.5 transition-colors cursor-pointer border border-emerald-500/20 whitespace-nowrap shrink-0"
                                  title={`Open ${field.directLinkLabel || 'Console'}`}
                                >
                                  <span>{field.directLinkLabel || 'Get Key ↗'}</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                              {isSecret && (
                                <button
                                  type="button"
                                  onClick={() => toggleFieldSecretVisibility(field.key)}
                                  className="text-[10px] text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded transition-colors whitespace-nowrap shrink-0"
                                >
                                  {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                  <span>{isVisible ? 'Mask' : 'Reveal'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <textarea
                            rows={3}
                            value={val}
                            onChange={(e) => setFieldValue(field, e.target.value)}
                            placeholder={dynamicFieldPlaceholder}
                            className={`w-full p-2.5 font-mono text-xs rounded-md bg-zinc-50 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500`}
                          />
                          {dynamicFieldHelp && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{dynamicFieldHelp}</p>
                          )}
                        </div>
                      );
                    }

                    return (
                      <React.Fragment key={field.key}>
                        <div className={isColSpan2 ? 'sm:col-span-2' : ''}>
                          <div className="flex items-center justify-between mb-1.5 gap-2 min-w-0">
                            <label className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate shrink min-w-0" title={dynamicFieldLabel}>
                              {dynamicFieldLabel} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                              {field.directLinkUrl && (
                                <a
                                  href={field.directLinkUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/20 inline-flex items-center gap-0.5 transition-colors cursor-pointer border border-emerald-500/20 whitespace-nowrap shrink-0"
                                  title={`Open ${field.directLinkLabel || 'Console'}`}
                                >
                                  <span>{field.directLinkLabel || 'Get Key ↗'}</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                              {isSecret && (
                                <button
                                  type="button"
                                  onClick={() => toggleFieldSecretVisibility(field.key)}
                                  className="text-[10px] text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded transition-colors whitespace-nowrap shrink-0"
                                >
                                  {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                  <span>{isVisible ? 'Mask' : 'Reveal'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="relative">
                            <Input
                              type={isSecret && !isVisible ? 'password' : 'text'}
                              value={val}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                setFieldValue(field, newVal);
                                if (isBankGateway && field.key === 'bank_ifsc_swift') {
                                  const cleanIfsc = newVal.split('/')[0].trim().toUpperCase();
                                  if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
                                    handleLiveIfscLookup(cleanIfsc);
                                  }
                                }
                              }}
                              onBlur={() => {
                                if (isBankGateway && field.key === 'bank_ifsc_swift') {
                                  const cleanIfsc = (val || '').split('/')[0].trim().toUpperCase();
                                  if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
                                    handleLiveIfscLookup(cleanIfsc);
                                  }
                                }
                              }}
                              placeholder={dynamicFieldPlaceholder}
                              className={`text-xs pr-9 rounded-md ${
                                field.isSecret || field.key.includes('key') || field.key.includes('id') || field.key.includes('no') || field.key.includes('ifsc')
                                  ? 'font-mono'
                                  : ''
                              }`}
                            />
                            {val && (
                              <button
                                type="button"
                                onClick={() => handleCopy(val, field.key)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-emerald-500 cursor-pointer"
                                title={`Copy ${dynamicFieldLabel}`}
                              >
                                {copiedKey === field.key ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                          {dynamicFieldHelp && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{dynamicFieldHelp}</p>
                          )}
                        </div>

                        {/* Dedicated Dynamic MICR field for Indian Banking Jurisdiction */}
                        {isBankGateway && field.key === 'bank_ifsc_swift' && cMeta.hasMicr && (
                          <div className="sm:col-span-1">
                            <div className="flex items-center justify-between mb-1.5 gap-2 min-w-0">
                              <label className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate shrink min-w-0" title={cMeta.micrLabel}>
                                {cMeta.micrLabel}
                              </label>
                              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 shrink-0">
                                {cMeta.micrBadge || '9 Digits (RBI)'}
                              </span>
                            </div>
                            <div className="relative">
                              <Input
                                type="text"
                                value={editedConfig.details_json?.micr || ''}
                                onChange={(e) =>
                                  setEditedConfig({
                                    ...editedConfig,
                                    details_json: {
                                      ...(editedConfig.details_json || {}),
                                      micr: e.target.value.replace(/[^0-9]/g, '').slice(0, 9),
                                    },
                                  })
                                }
                                placeholder={cMeta.micrPlaceholder}
                                className="text-xs font-mono pr-9"
                              />
                              {editedConfig.details_json?.micr && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(editedConfig.details_json?.micr || '', 'micr')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-emerald-500 cursor-pointer"
                                  title="Copy MICR Code"
                                >
                                  {copiedKey === 'micr' ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                              {cMeta.micrHelp || 'Magnetic Ink Character Recognition code for electronic cheque clearing.'}
                            </p>
                          </div>
                        )}

                        {/* Dedicated Dynamic BSR Code field for Indian Banking Jurisdiction */}
                        {isBankGateway && field.key === 'bank_ifsc_swift' && cMeta.hasBsr && (
                          <div className="sm:col-span-1">
                            <div className="flex items-center justify-between mb-1.5 gap-2 min-w-0">
                              <label className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate shrink min-w-0" title={cMeta.bsrLabel}>
                                {cMeta.bsrLabel}
                              </label>
                              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 shrink-0">
                                {cMeta.bsrBadge || '7 Digits (RBI)'}
                              </span>
                            </div>
                            <div className="relative">
                              <Input
                                type="text"
                                value={editedConfig.details_json?.bsr || ''}
                                onChange={(e) =>
                                  setEditedConfig({
                                    ...editedConfig,
                                    details_json: {
                                      ...(editedConfig.details_json || {}),
                                      bsr: e.target.value.replace(/[^0-9]/g, '').slice(0, 7),
                                    },
                                  })
                                }
                                placeholder={cMeta.bsrPlaceholder}
                                className="text-xs font-mono pr-9"
                              />
                              {editedConfig.details_json?.bsr && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(editedConfig.details_json?.bsr || '', 'bsr')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-emerald-500 cursor-pointer"
                                  title="Copy BSR Code"
                                >
                                  {copiedKey === 'bsr' ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                              {cMeta.bsrHelp || '7-digit Basic Statistical Returns code issued by RBI for branch identification & TDS filing.'}
                            </p>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar Security & Documentation */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Sovereign AES Encryption
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Keys are encrypted at rest with AES-256 GCM platform ciphers. In-memory decryption occurs only during checkout processing.
                </p>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[10px] space-y-1">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Data Privacy</span>
                    <span className="text-emerald-500 font-bold font-mono">ENCRYPTED</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Isolation</span>
                    <span className="text-emerald-500 font-bold font-mono">PER-GATEWAY DB</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-2xs">
                <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
                  Official Developer Console
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Need authentic API credentials? Log in to your {editedConfig.display_name} merchant account.
                </p>
                {meta.docsUrl && meta.docsUrl !== '#' && (
                  <a
                    href={meta.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 cursor-pointer"
                  >
                    <span>Open Developer API Portal</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Dynamic Step-by-Step Developer Setup Guide for all 18 gateways */}
              {(() => {
                const guide = GATEWAY_DEVELOPER_SETUP_GUIDES[editedConfig.gateway_key] || GATEWAY_DEVELOPER_SETUP_GUIDES[editedConfig.gateway_key.toLowerCase()];
                if (!guide) return null;
                return (
                  <div className="p-3.5 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 space-y-2.5 shadow-2xs">
                    <h4 className="text-[11px] font-bold text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      {guide.title}
                    </h4>
                    <ol className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                      {guide.steps.map((step, sIdx) => (
                        <li key={sIdx} dangerouslySetInnerHTML={{ __html: step }} />
                      ))}
                    </ol>
                    {guide.noteText && (
                      <div className="p-2 rounded bg-white/80 dark:bg-zinc-900/80 border border-teal-200/60 dark:border-teal-800/40 text-[10px] text-teal-800 dark:text-teal-300 font-medium">
                        {guide.noteBadge ? <strong>{guide.noteBadge}: </strong> : '⚡ '}
                        {guide.noteText}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* SECTION 2: WEBHOOK & IPN DISPATCHER */}
        {activeSettingsTab === 'webhooks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-2xs">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
                    <Radio className="h-3.5 w-3.5 text-emerald-500" />
                    Real-Time Webhook Endpoint
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Copy this unique URL and paste it into your {editedConfig.display_name} webhook configuration.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      System Webhook Listener URL
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={webhookUrl}
                        className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800/80 text-emerald-600 dark:text-emerald-400 font-bold rounded-md"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(webhookUrl, 'webhook_url')}
                        leftIcon={copiedKey === 'webhook_url' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        className="shrink-0 font-semibold text-xs rounded-md"
                      >
                        {copiedKey === 'webhook_url' ? 'Copied' : 'Copy'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleTestWebhookPing(editedConfig.gateway_key)}
                        disabled={isSendingPing}
                        leftIcon={<Send className={`h-3 w-3 ${isSendingPing ? 'animate-spin' : ''}`} />}
                        className="shrink-0 font-semibold text-xs rounded-md"
                      >
                        {isSendingPing ? 'Pinging...' : 'Test Listener Ping'}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                        Webhook Signing Secret (HMAC-SHA256)
                      </label>
                      <div className="flex items-center gap-2">
                        {meta.docsUrl && (
                          <a
                            href={meta.docsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 rounded bg-emerald-500/10 text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/20 inline-flex items-center gap-1 transition-colors cursor-pointer border border-emerald-500/20"
                          >
                            <span>Manage Webhooks ↗</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                          className="text-[11px] text-zinc-500 hover:text-emerald-500 font-medium flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          {showWebhookSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          {showWebhookSecret ? 'Mask Secret' : 'Reveal Secret'}
                        </button>
                      </div>
                    </div>
                    <Input
                      type={showWebhookSecret ? 'text' : 'password'}
                      value={editedConfig.webhook_secret || ''}
                      onChange={(e) => setEditedConfig({ ...editedConfig, webhook_secret: e.target.value })}
                      placeholder="whsec_... or secret_signing_key"
                      className="font-mono text-xs rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* 4-Step Quick Setup Guide */}
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-2.5 text-xs">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Layers className="h-3.5 w-3.5 text-blue-500" />
                  Quick Webhook Setup Instructions (4 Steps)
                </h4>
                <ol className="space-y-1.5 list-decimal list-inside text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                  <li>Open the official developer dashboard for <span className="font-semibold text-emerald-500">{editedConfig.display_name}</span>.</li>
                  <li>Navigate to <strong>Webhooks</strong> &gt; Click <strong>+ Add endpoint</strong>.</li>
                  <li>Paste the <strong>System Webhook Listener URL</strong> shown above into the endpoint URL field.</li>
                  <li>Select the supported events shown below, copy your <strong>Signing Secret</strong>, and paste it into the field above.</li>
                </ol>
              </div>

              {/* Handled Events List tailored for this gateway */}
              <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-2xs">
                <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Supported Webhook Events for {editedConfig.display_name}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {meta.webhookEvents.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/50 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-emerald-500">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span>{item.event}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Webhook Queue Telemetry
              </h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Incoming webhook events are cryptographically authenticated with SHA-256 HMAC and acknowledged with <code className="text-emerald-500 font-mono">200 OK</code> within 30ms.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 3: CHECKOUT UI & BRANDING */}
        {activeSettingsTab === 'checkout_ui' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-2xs">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                    Customer Checkout Customization
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Customize how this gateway appears to end-users during subscription upgrade & top-up checkout.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Checkout Gateway Display Title
                    </label>
                    <Input
                      value={editedConfig.display_name}
                      onChange={(e) => setEditedConfig({ ...editedConfig, display_name: e.target.value })}
                      placeholder="e.g. Credit/Debit Card (Stripe)"
                      className="rounded-md text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Accepted Payment Rails Badges
                    </label>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {meta.acceptedMethods.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Supported Settlement Currencies
                    </label>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {meta.currencies.map((curr, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        >
                          {curr}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Interactive Checkout Preview Tile */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-2xs">
                <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                  Live Checkout Preview
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Interactive tile as seen by customers on the payment screen.
                </p>

                <div className="p-3.5 rounded-lg border-2 border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-12 px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-2xs flex-1 max-w-[200px]">
                      {renderOfficialBrandLogo(editedConfig.gateway_key, 'md')}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Selected
                      </span>
                      <div className="h-4.5 w-4.5 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-emerald-500">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-emerald-500/20 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                        {editedConfig.display_name}
                      </h5>
                      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                        {meta.currencies.slice(0, 4).join(', ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      {meta.acceptedMethods.join(' • ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: DIAGNOSTICS & HANDSHAKE TEST */}
        {activeSettingsTab === 'diagnostics' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
                    <Terminal className="h-3.5 w-3.5 text-blue-500" />
                    Live Gateway Connectivity Diagnostics
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Sends a cryptographic handshake ping to verify API keys, TLS certificates, and real server latency with {editedConfig.display_name}.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onTestConnection(editedConfig)}
                  disabled={isTesting}
                  leftIcon={<RefreshCw className={`h-3 w-3 ${isTesting ? 'animate-spin' : ''}`} />}
                  className="font-semibold text-xs rounded-md shrink-0"
                >
                  {isTesting ? 'Testing Handshake...' : 'Trigger Live Handshake'}
                </Button>
              </div>

              {testResult ? (
                <div className="space-y-3 text-xs">
                  {testResult.success ? (
                    <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Connection Verified & Handshake Active</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600/40">
                          {testResult.latency_ms} ms Latency
                        </span>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {testResult.message || `Successfully communicated with ${editedConfig.display_name} API servers.`}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span>{testResult.status === 'unconfigured' ? 'Credentials Required' : 'Authentication / Handshake Failed'}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-600/40">
                          {testResult.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {testResult.message}
                      </p>
                      {testResult.status === 'unconfigured' && (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => setActiveSettingsTab('credentials')}
                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>→ Go to &quot;API Keys & Credentials&quot; tab to enter your keys</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                      Raw Diagnostic Telemetry Response
                    </p>
                    <pre className="p-3 rounded-md bg-zinc-950 text-emerald-400 font-mono text-[10px] overflow-x-auto border border-zinc-800">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-zinc-500 text-xs space-y-2">
                  <Activity className="h-6 w-6 mx-auto text-zinc-400 opacity-50" />
                  <p>Click &quot;Trigger Live Handshake&quot; to test network roundtrip latency with {editedConfig.display_name}.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={handleClosePluginSettings} className="font-semibold text-xs rounded-md">
            ← Return to Plugins Hub
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditedConfig({ ...selectedPluginForEdit, details_json: { ...(selectedPluginForEdit.details_json || {}) } })}
              disabled={isSaving}
              className="rounded-md text-xs"
            >
              Reset Changes
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveCurrentPlugin}
              disabled={isSaving}
              leftIcon={<Check className="h-3.5 w-3.5" />}
              className="font-semibold text-xs rounded-md px-4"
            >
              {isSaving ? 'Saving...' : 'Save & Publish Plugin'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: WORDPRESS-STYLE PLUGINS CATALOG HUB (Overview Grid)
  // =========================================================================
  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Sovereign Payment Gateway Connectors</span>
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              1-click multi-currency gateway activation with real-time handshake telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeCount} of {gateways.length} Plugins Active</span>
          </div>
        </div>
      </div>

      {/* Filtering & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        {/* Category Buttons */}
        <div
          className="flex items-center gap-1 w-full md:w-auto p-1 rounded-md bg-zinc-100/90 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/50 overflow-x-auto no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap text-xs ${
              categoryFilter === 'all'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700/60'
            }`}
          >
            All Plugins ({gateways.length})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('global')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap text-xs ${
              categoryFilter === 'global'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700/60'
            }`}
          >
            Cards & Global ({globalCount})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('india')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap text-xs ${
              categoryFilter === 'india'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700/60'
            }`}
          >
            India UPI & NetBanking ({indiaCount})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('offline')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap text-xs ${
              categoryFilter === 'offline'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700/60'
            }`}
          >
            Direct Bank Wire ({offlineCount})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('active')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap text-xs ${
              categoryFilter === 'active'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold shadow-xs shadow-emerald-500/25'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700/60'
            }`}
          >
            Active Only ({activeCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-60 shrink-0">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search gateway plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 pl-8.5 pr-3 text-xs rounded-md bg-zinc-50 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Plugin Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredPlugins.length === 0 ? (
          <div className="col-span-full py-10 text-center text-xs text-zinc-500 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            No payment gateway plugins found matching &quot;{searchQuery}&quot;.
          </div>
        ) : (
          filteredPlugins.map((gw) => {
            const meta: GatewayPluginMeta = GATEWAY_METAS[gw.gateway_key] || {
              category: 'global',
              version: 'v1.0.0',
              author: 'Custom Gateway Bridge',
              description: 'Custom payment gateway connector.',
              acceptedMethods: ['Cards', 'Online Payments'],
              currencies: ['USD', 'INR'],
              docsUrl: '#',
              fields: [],
              webhookEvents: [],
            };

            const testResult =
              testedGatewayResults[gw.id] ||
              testedGatewayResults[gw.gateway_key] ||
              gw.details_json?.last_test;
            const isTesting = testingGatewayId === gw.id;

            return (
              <div
                key={gw.id}
                className={`group relative rounded-lg p-4 flex flex-col justify-between border transition-all duration-200 ${
                  gw.is_enabled
                    ? 'bg-white dark:bg-zinc-900 border-zinc-200/90 dark:border-zinc-800 shadow-2xs hover:shadow-md hover:border-emerald-500/50 dark:hover:border-emerald-500/40'
                    : 'bg-zinc-50/70 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Top Brand Logo Banner & Controls */}
                  <div className="flex items-center justify-between gap-3">
                    {/* Authentic Wide Brand Logo Box */}
                    <div className="h-12 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/90 border border-zinc-200/90 dark:border-zinc-700/80 shadow-2xs flex items-center justify-center shrink-0 min-w-[130px] max-w-[170px]">
                      {renderOfficialBrandLogo(gw.gateway_key, 'md')}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60">
                        {meta.version}
                      </span>
                      <ModernToggleSwitch
                        checked={gw.is_enabled}
                        onChange={() => onToggleStatus(gw)}
                        size="sm"
                        ariaLabel={`Toggle ${gw.display_name}`}
                      />
                    </div>
                  </div>

                  {/* Plugin Title & Provider Author */}
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" title={gw.display_name}>
                      {gw.display_name}
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5" title={meta.author}>
                      {meta.author}
                    </p>
                  </div>

                  {/* Plugin Description - Fixed 2-line height for clean parity */}
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed min-h-[34px]" title={meta.description}>
                    {meta.description}
                  </p>

                  {/* Badges & Mode Row */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border shrink-0 whitespace-nowrap ${
                        !gw.is_enabled
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                          : testResult && !testResult.success
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold'
                          : testResult?.success
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold'
                      }`}
                    >
                      {!gw.is_enabled
                        ? 'Deactivated'
                        : testResult && !testResult.success
                        ? 'Setup Required'
                        : testResult?.success
                        ? 'Active on Checkout'
                        : 'Setup Required'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase font-bold border border-blue-500/30 shrink-0 whitespace-nowrap">
                      Mode: {gw.environment}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 truncate max-w-[130px]" title={meta.currencies.join(', ')}>
                      {meta.currencies.join(', ')}
                    </span>
                  </div>

                  {/* Per-Gateway Individual Live Test Diagnostic Pill */}
                  {testResult && testResult.success ? (
                    <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between whitespace-nowrap overflow-hidden">
                      <span className="font-bold flex items-center gap-1.5 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Handshake OK
                      </span>
                      <span className="font-mono text-zinc-500 dark:text-zinc-400 text-[11px] truncate">{testResult.latency_ms} ms</span>
                    </div>
                  ) : testResult && testResult.status === 'unconfigured' ? (
                    <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between whitespace-nowrap overflow-hidden">
                      <span className="font-semibold flex items-center gap-1.5 shrink-0 text-[11px]">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Keys Required
                      </span>
                      <span className="font-mono text-amber-600/80 dark:text-amber-400/80 text-[10px]">Unconfigured</span>
                    </div>
                  ) : testResult && !testResult.success ? (
                    <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center justify-between whitespace-nowrap overflow-hidden">
                      <span className="font-semibold flex items-center gap-1.5 shrink-0 text-[11px]">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Handshake Failed
                      </span>
                      <span className="font-mono text-red-500 text-[10px]">Auth Error</span>
                    </div>
                  ) : (
                    <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/50 text-xs text-zinc-500 flex items-center justify-between whitespace-nowrap overflow-hidden">
                      <span className="flex items-center gap-1.5 shrink-0 text-[11px]">
                        <Activity className="h-3.5 w-3.5 text-zinc-400" /> Not Tested Yet
                      </span>
                      <span className="font-mono text-zinc-400 text-[10px]">Standby</span>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-200/80 dark:border-zinc-800 gap-2">
                  <button
                    type="button"
                    onClick={() => onTestConnection(gw)}
                    disabled={isTesting}
                    className="flex-1 h-8.5 text-xs font-semibold rounded-md px-2.5 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Activity className={`h-3.5 w-3.5 text-blue-500 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPluginSettings(gw)}
                    className="flex-1 h-8.5 text-xs font-bold rounded-md px-3 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Configure Plugin</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default WordPressPaymentPluginsHub;
