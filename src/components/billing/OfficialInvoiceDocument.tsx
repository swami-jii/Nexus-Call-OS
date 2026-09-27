import React from 'react';
import {
  Building,
  CheckCircle2,
  XCircle,
  Printer,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Copy,
  Mail,
  Download,
  Clock,
  FileText,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { fetchAPI } from '../../lib/api';
import { BillingInvoiceItem, InvoiceTemplateSettings } from '../../types';

export interface OfficialInvoiceDocumentProps {
  invoice: BillingInvoiceItem | any;
  templateSettings?: InvoiceTemplateSettings;
  onBack?: () => void;
  backLabel?: string;
  showTopBar?: boolean;
}

/**
 * Official Cryptographic Digital Seal / Mohar
 */
export const DigitalVerificationSeal: React.FC<{
  primaryColor?: string;
  sealText?: string;
  badgeText?: string;
  sealUrl?: string;
  size?: number;
  rotation?: number;
}> = ({
  primaryColor = '#0d9488',
  sealText = 'CREATE CALL OS • VERIFIED TAX INVOICE • DIGITALLY SIGNED •',
  badgeText = 'AUTHENTIC',
  sealUrl,
  size = 100,
  rotation = -5,
}) => {
  const dimensionStyle = {
    width: `${size}px`,
    height: `${size}px`,
    transform: `rotate(${rotation}deg)`,
    transition: 'all 0.15s ease',
  };

  if (sealUrl) {
    return (
      <div
        className="relative flex items-center justify-center select-none shrink-0 p-1"
        style={dimensionStyle}
      >
        <img
          src={sealUrl}
          alt="Official Seal / Mohar"
          className="w-full h-full object-contain filter drop-shadow-sm rounded-full"
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center justify-center select-none shrink-0"
      style={dimensionStyle}
    >
      <svg className="w-full h-full opacity-90" viewBox="0 0 120 120" style={{ color: primaryColor }}>
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="1" />
        <path
          id="sealCirclePath"
          d="M 60, 60 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0"
          fill="transparent"
        />
        <text className="text-[6.5px] uppercase font-mono font-bold tracking-[1.8px] fill-current">
          <textPath href="#sealCirclePath" startOffset="0%">
            {sealText}
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <ShieldCheck className="h-5 w-5" style={{ color: primaryColor }} />
        <span className="text-[7.5px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mt-0.5">
          {badgeText}
        </span>
        <span className="text-[6px] font-mono text-zinc-500 dark:text-zinc-400">SECURE RECORD</span>
      </div>
    </div>
  );
};

/**
 * Cryptographic QR Verification Matrix
 */
export const InvoiceQrCode: React.FC<{ invoiceNumber: string }> = ({ invoiceNumber }) => (
  <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 shadow-2xs flex flex-col items-center gap-1 shrink-0">
    <svg className="w-14 h-14 text-zinc-900 dark:text-zinc-100" viewBox="0 0 100 100" fill="currentColor">
      {/* Top Left Finder */}
      <rect x="5" y="5" width="28" height="28" />
      <rect x="9" y="9" width="20" height="20" fill="white" className="dark:fill-zinc-800" />
      <rect x="13" y="13" width="12" height="12" />

      {/* Top Right Finder */}
      <rect x="67" y="5" width="28" height="28" />
      <rect x="71" y="9" width="20" height="20" fill="white" className="dark:fill-zinc-800" />
      <rect x="75" y="13" width="12" height="12" />

      {/* Bottom Left Finder */}
      <rect x="5" y="67" width="28" height="28" />
      <rect x="9" y="71" width="20" height="20" fill="white" className="dark:fill-zinc-800" />
      <rect x="13" y="75" width="12" height="12" />

      {/* Internal Matrix Elements */}
      <rect x="40" y="8" width="6" height="6" />
      <rect x="52" y="8" width="6" height="6" />
      <rect x="40" y="20" width="6" height="6" />
      <rect x="52" y="26" width="6" height="6" />
      <rect x="40" y="38" width="6" height="6" />
      <rect x="8" y="44" width="6" height="6" />
      <rect x="20" y="44" width="6" height="6" />
      <rect x="68" y="44" width="6" height="6" />
      <rect x="80" y="44" width="6" height="6" />
      <rect x="44" y="52" width="6" height="6" />
      <rect x="56" y="52" width="6" height="6" />
      <rect x="68" y="60" width="6" height="6" />
      <rect x="80" y="68" width="6" height="6" />
      <rect x="40" y="74" width="6" height="6" />
      <rect x="52" y="80" width="6" height="6" />
      <rect x="68" y="86" width="6" height="6" />
      <rect x="80" y="86" width="6" height="6" />
    </svg>
    <span className="text-[7.5px] font-mono text-zinc-500 font-bold uppercase tracking-wider">VERIFY CERT</span>
  </div>
);

// Convert numbers to words for formal invoice representation
export const formatAmountInWords = (num: number, currency: string = 'USD'): string => {
  const rounded = Math.round(num * 100) / 100;
  const dollars = Math.floor(rounded);
  const cents = Math.round((rounded - dollars) * 100);

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertChunk = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return units[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + units[n % 10] : '') + ' ';
    return units[Math.floor(n / 100)] + ' Hundred ' + (n % 100 !== 0 ? convertChunk(n % 100) : '');
  };

  const currLabel = currency === 'INR' ? 'Indian Rupees' : currency === 'EUR' ? 'Euros' : currency === 'GBP' ? 'Pounds' : 'US Dollars';

  if (dollars === 0 && cents === 0) return `Zero ${currLabel} Only`;

  let words = '';
  const millions = Math.floor(dollars / 1000000);
  const thousands = Math.floor((dollars % 1000000) / 1000);
  const remainder = dollars % 1000;

  if (millions > 0) words += convertChunk(millions) + 'Million ';
  if (thousands > 0) words += convertChunk(thousands) + 'Thousand ';
  if (remainder > 0) words += convertChunk(remainder);

  words = words.trim() + ` ${currLabel}`;

  if (cents > 0) {
    const centLabel = currency === 'INR' ? 'Paise' : 'Cents';
    words += ` and ${convertChunk(cents).trim()} ${centLabel}`;
  }

  return words + ' Only';
};

interface ItemizedLine {
  num: string;
  title: string;
  desc: string;
  sac: string;
  qty: number;
  rate: number;
  taxable: number;
}

const DEFAULT_DOC_TEMPLATE: InvoiceTemplateSettings = {
  company_name: 'Create Call OS Technologies Private Limited',
  company_tagline: 'AI Voice Operating System • Global Carrier Telephony',
  head_office_address: 'Cyber City Innovation Hub, Tower 4, Sector 62, Noida - 201309',
  support_email: 'finance@createcall.ai',
  billing_email: 'billing@createcall.ai',
  support_phone: '+1 (800) 555-CALL',
  company_website: 'https://createcall.ai',
  gstin: '27AABCU9603R1ZM',
  cin: 'U72900DL2026PTC109822',
  sac_code: '998413 (Telephony & Cloud Computing)',
  dot_license: 'DoT-VNO-CAT-A/2026/891',
  tax_rate_percent: 18.0,
  tax_name: '18% Statutory GST (CGST 9% + SGST 9%)',
  place_of_supply: 'Cyber City, UP-09',
  jurisdiction: 'Courts of New Delhi / Noida Jurisdiction',
  authorized_signatory_name: 'Mukta Swami',
  authorized_signatory_title: 'Founder & Managing Director',
  terms_notes: 'Computer-generated tax receipt issued under IT Act Electronic Records Standards. All amounts settled in full with zero outstanding balance.',
  footer_note: 'This is a digitally certified tax invoice generated under IT Act Electronic Records Standards.',
  logo_url: '/create-call-banner-light.png',
  icon_logo_url: '/app-icon.png',
  banner_logo_url: '/create-call-banner-light.png',
  logo_mode: 'dual',
  icon_size: 48,
  logo_size: 52,
  logo_width: 220,
  logo_fit: 'contain',
  logo_layout: 'wide_banner',
  logo_position: 'left',
  signature_position: 'right',
  seal_position: 'center',
  seal_url: undefined,
  seal_size: 100,
  seal_rotation: -5,
  seal_text: 'CREATE CALL OS • VERIFIED TAX INVOICE • DIGITALLY SIGNED •',
  seal_badge_text: 'AUTHENTIC',
  signature_url: undefined,
  signature_font: 'Great Vibes, cursive',
  signature_size: 24,
  signature_rotation: -3,
  container_padding_px: 28,
  container_padding: 'normal',
  padding_top_px: 28,
  padding_right_px: 28,
  padding_bottom_px: 28,
  padding_left_px: 28,
  padding_linked: true,
  box_border_radius: 8,
  radius_top_left_px: 8,
  radius_top_right_px: 8,
  radius_bottom_right_px: 8,
  radius_bottom_left_px: 8,
  radius_linked: true,
  table_padding_px: 9,
  table_density: 'normal',
  table_border_style: 'grid',
  table_border_width_px: 1,
  table_border_color: '#d4d4d8',
  table_layout_mode: 'grid',
  header_theme_style: 'colored_bar',
  title_font_size: 20,
  company_font_size: 15,
  primary_color: '#0d9488',
  accent_color: '#047857',
  font_family: 'Inter',
  show_watermark: true,
  watermark_text: 'PAID IN FULL',
  watermark_angle: -25,
  watermark_opacity: 0.04,
  show_qr_code: true,
  show_hsn_sac: true,
  show_tax_breakup_table: true,
  invoice_title: 'TAX INVOICE / PAYMENT RECEIPT',
  invoice_prefix: 'CCOS-INV-',
  bank_name: 'Bank of India',
  bank_beneficiary: 'Create Call OS Technologies Private Limited',
  bank_account_no: '601410110014986',
  bank_ifsc_swift: 'BKID0006014',
  vpa_address: '9650855975@yapl',
};

export const getGatewayDisplayName = (gwRaw: string): string => {
  if (!gwRaw) return 'Official Encrypted Payment Gateway';
  const lower = gwRaw.toLowerCase();
  if (lower.includes('promo') || lower.includes('voucher') || lower.includes('free')) return 'Promotional Voucher Rail';
  if (lower.includes('razorpay')) return 'Razorpay Payments Rail';
  if (lower.includes('stripe')) return 'Stripe Global Card Rail';
  if (lower.includes('paypal')) return 'PayPal Commerce Network';
  if (lower.includes('phonepe')) return 'PhonePe Direct UPI 2.0 Rail';
  if (lower.includes('paytm')) return 'Paytm Payments Bank & UPI Rail';
  if (lower.includes('coinbase')) return 'Coinbase Web3 Blockchain Rail';
  if (lower.includes('crypto')) return 'Decentralized Blockchain Settlement Rail';
  if (lower.includes('mercadopago') || lower.includes('mercado_pago')) return 'Mercado Pago Latin America Rail';
  if (lower.includes('flutterwave')) return 'Flutterwave Africa Payment Rail';
  if (lower.includes('cashfree')) return 'Cashfree Payments Direct Rail';
  if (lower.includes('paddle')) return 'Paddle Global Merchant Rail';
  if (lower.includes('adyen')) return 'Adyen Enterprise Settlement Rail';
  if (lower.includes('square')) return 'Square / Block Payment Network';
  if (lower.includes('authorizenet') || lower.includes('authorize.net')) return 'Authorize.Net Visa Merchant Rail';
  if (lower.includes('mollie')) return 'Mollie European Multi-Currency Rail';
  if (lower.includes('skrill')) return 'Skrill Digital Wallet Network';
  if (lower.includes('klarna')) return 'Klarna Pay-Over-Time Network';
  if (lower.includes('bank') || lower.includes('wire') || lower.includes('neft') || lower.includes('rtgs')) return 'Commercial Bank Remittance Standard';
  return gwRaw.toUpperCase();
};

export const OfficialInvoiceDocument: React.FC<OfficialInvoiceDocumentProps> = ({
  invoice,
  templateSettings: inputTemplateSettings,
  onBack,
  backLabel = 'Back to Ledger',
  showTopBar = true,
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [templateSettings, setTemplateSettings] = React.useState<InvoiceTemplateSettings>(() => ({
    ...DEFAULT_DOC_TEMPLATE,
    ...(inputTemplateSettings || {}),
  }));

  React.useEffect(() => {
    if (inputTemplateSettings && Object.keys(inputTemplateSettings).length > 0) {
      setTemplateSettings((prev) => ({ ...prev, ...inputTemplateSettings }));
      return;
    }
    const loadSettings = async () => {
      try {
        const res = await fetchAPI('/api/billing/invoice-template-settings');
        if (res && res.company_name) {
          setTemplateSettings((prev) => ({ ...prev, ...res }));
        }
      } catch {
        // Fallback to default
      }
    };
    loadSettings();
  }, [inputTemplateSettings]);

  const primaryColor = templateSettings.primary_color || '#0d9488';
  const taxPercent = templateSettings.tax_rate_percent || 18.0;
  const rawTotal = invoice.amount_local !== undefined
    ? invoice.amount_local
    : invoice.total_amount !== undefined
    ? invoice.total_amount
    : invoice.amount !== undefined
    ? (typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : invoice.amount)
    : 49;

  const totalAmount = rawTotal;
  const isRefunded = Boolean(
    (invoice.status || '').toLowerCase() === 'refunded' ||
    (invoice.status || '').toLowerCase() === 'reversed' ||
    (invoice.status || '').toLowerCase() === 'canceled' ||
    (invoice.status || '').toLowerCase() === 'cancelled'
  );
  const isPaid = (invoice.status || 'paid').toLowerCase() === 'paid' || (invoice.status || '').toLowerCase() === 'completed' || (invoice.status || '').toLowerCase() === 'success';
  const isOfflinePending = (invoice.status || '').toLowerCase() === 'offline_pending';

  const isPromoInvoice = Boolean(
    invoice.is_free_promo ||
    invoice.details_json?.is_free_checkout ||
    (invoice.gateway && invoice.gateway.toLowerCase().includes('promo')) ||
    (invoice.gateway_key && invoice.gateway_key.toLowerCase().includes('promo')) ||
    (invoice.details_json?.gateway && String(invoice.details_json.gateway).toLowerCase().includes('promo')) ||
    (invoice.coupon_code && totalAmount === 0) ||
    (invoice.discount_amount && invoice.discount_amount > 0 && totalAmount === 0) ||
    totalAmount === 0
  );

  const isBankTransfer = Boolean(
    isOfflinePending ||
    invoice.gateway_key === 'bank_transfer' ||
    (invoice.gateway && (
      invoice.gateway.toLowerCase().includes('bank') ||
      invoice.gateway.toLowerCase().includes('wire') ||
      invoice.gateway.toLowerCase().includes('neft') ||
      invoice.gateway.toLowerCase().includes('rtgs')
    ))
  );

  const subtotal = isPromoInvoice
    ? 0
    : invoice.subtotal !== undefined
    ? invoice.subtotal
    : rawTotal / (1 + taxPercent / 100);

  const taxAmount = isPromoInvoice
    ? 0
    : invoice.tax_amount !== undefined
    ? invoice.tax_amount
    : rawTotal - subtotal;

  const currCode = invoice.currency || 'USD';
  const currSymbol = invoice.currency_symbol || (currCode === 'INR' ? '₹' : currCode === 'EUR' ? '€' : currCode === 'GBP' ? '£' : '$');

  const customerName =
    invoice.customer_name ||
    invoice.billing_name ||
    user?.fullName ||
    (user as any)?.name ||
    'Authorized Enterprise Customer';
  const customerEmail =
    invoice.customer_email ||
    invoice.billing_email ||
    user?.email ||
    'billing@customer.domain';
  const workspaceName =
    invoice.workspace_name ||
    (user as any)?.organization_name ||
    (user?.fullName ? `${user.fullName}'s Workspace` : 'Primary Sovereign AI Workspace');
  const customerAddress =
    invoice.customer_address ||
    invoice.billing_address ||
    'Official Registered Operational Headquarters';
  const customerTaxId =
    invoice.tax_id ||
    invoice.taxId ||
    (user as any)?.tax_id ||
    'B2C-RETAIL-CONSUMER';

  const watermarkString = templateSettings.watermark_text || (
    isRefunded
      ? 'REFUNDED'
      : isPaid
      ? (isPromoInvoice ? 'PROMO VOUCHER' : 'PAID IN FULL')
      : isOfflinePending
      ? 'PROFORMA'
      : 'TAX INVOICE'
  );

  // Sizing & Box Model Tokens
  const padTop = templateSettings.padding_top_px ?? templateSettings.container_padding_px ?? 28;
  const padRight = templateSettings.padding_right_px ?? templateSettings.container_padding_px ?? 28;
  const padBottom = templateSettings.padding_bottom_px ?? templateSettings.container_padding_px ?? 28;
  const padLeft = templateSettings.padding_left_px ?? templateSettings.container_padding_px ?? 28;

  // Border Radius Tokens
  const radTL = templateSettings.radius_top_left_px ?? templateSettings.box_border_radius ?? 8;
  const radTR = templateSettings.radius_top_right_px ?? templateSettings.box_border_radius ?? 8;
  const radBR = templateSettings.radius_bottom_right_px ?? templateSettings.box_border_radius ?? 8;
  const radBL = templateSettings.radius_bottom_left_px ?? templateSettings.box_border_radius ?? 8;
  const borderRadius = `${radTL}px ${radTR}px ${radBR}px ${radBL}px`;

  // Logos & Dimensions
  const logoMode = templateSettings.logo_mode || 'dual';
  const iconLogoUrl = templateSettings.icon_logo_url || '/app-icon.png';
  const bannerLogoUrl = templateSettings.banner_logo_url || templateSettings.logo_url || '/create-call-banner-light.png';
  const iconSizePx = templateSettings.icon_size || 48;
  const logoHeightPx = templateSettings.logo_size ? `${templateSettings.logo_size}px` : '52px';
  const logoWidthPx = templateSettings.logo_width && templateSettings.logo_width > 0 ? `${templateSettings.logo_width}px` : 'auto';
  const logoFit = templateSettings.logo_fit || 'contain';
  const logoPosition = templateSettings.logo_position || 'left';
  const signaturePosition = templateSettings.signature_position || 'right';

  const tablePaddingPx = typeof templateSettings.table_padding_px === 'number'
    ? templateSettings.table_padding_px
    : templateSettings.table_density === 'compact'
    ? 6
    : templateSettings.table_density === 'spacious'
    ? 14
    : 9;

  // Dynamic Itemized Line Items per Plan & Service Account
  const dynamicLineItems: ItemizedLine[] = React.useMemo(() => {
    if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
      return invoice.items.map((item: any, idx: number) => ({
        num: String(idx + 1).padStart(2, '0'),
        title: item.title || item.name || 'AI Voice Telephony Service',
        desc: item.desc || item.description || 'Enterprise AI Calling & Routing Infrastructure',
        sac: item.sac || templateSettings.sac_code?.split(' ')[0] || '998413',
        qty: item.qty || 1,
        rate: item.rate || item.price || subtotal,
        taxable: item.taxable || item.amount || subtotal,
      }));
    }

    const planLower = (invoice.plan_name || '').toLowerCase();
    const sacDefault = templateSettings.sac_code?.split(' ')[0] || '998413';
    const isTopup = planLower.includes('topup') || planLower.includes('top-up') || planLower.includes('wallet') || invoice.plan_id === 'wallet_topup' || invoice.details_json?.mode === 'wallet_topup';

    // 100% Free Promo Activation Commercial Itemization
    if (isPromoInvoice) {
      let catalogBase = 0;
      if (invoice.discount_amount && invoice.discount_amount > 0) {
        catalogBase = invoice.discount_amount;
      } else if (invoice.catalog_price_local && invoice.catalog_price_local > 0) {
        catalogBase = invoice.catalog_price_local;
      } else if (invoice.subtotal && invoice.subtotal > 0) {
        catalogBase = invoice.subtotal;
      } else if (invoice.original_price && invoice.original_price > 0) {
        catalogBase = invoice.original_price;
      } else if (isTopup) {
        const topupUsd = Number(invoice.details_json?.credited_amount_usd || invoice.details_json?.topup_amount_usd || invoice.amount_usd || 50);
        catalogBase = currCode === 'INR' ? topupUsd * 83.25 : currCode === 'EUR' ? topupUsd * 0.92 : currCode === 'GBP' ? topupUsd * 0.79 : topupUsd;
      } else if (planLower.includes('enterprise') || planLower.includes('sovereign')) {
        catalogBase = currCode === 'INR' ? 16499 : currCode === 'EUR' ? 185 : currCode === 'GBP' ? 159 : 199;
      } else if (planLower.includes('starter') || planLower.includes('base') || planLower.includes('free')) {
        catalogBase = currCode === 'INR' ? 1599 : currCode === 'EUR' ? 18 : currCode === 'GBP' ? 15 : 19;
      } else {
        catalogBase = currCode === 'INR' ? 3999 : currCode === 'EUR' ? 45 : currCode === 'GBP' ? 39 : 49;
      }

      const couponCode = invoice.coupon_code || invoice.details_json?.coupon_code || 'CREATECALL100';
      const lineItemTitle = isTopup
        ? (invoice.plan_name || 'Prepaid Carrier Wallet Top-Up')
        : (invoice.plan_name || 'Pro Scale AI Telephony Engine (Monthly Subscription)');
      const lineItemDesc = isTopup
        ? 'Prepaid Global Carrier Telephony Credits • PSTN / GSM Outbound Trunk Balance • Low-Latency AI Voice Transit'
        : 'Autonomous AI Voice Calling Engine • 1,000 Mins PSTN/SIP Calling • Low-Latency LLM Pipeline • Vector RAG Storage';

      return [
        {
          num: '01',
          title: lineItemTitle,
          desc: lineItemDesc,
          sac: sacDefault,
          qty: 1.0,
          rate: Number(catalogBase.toFixed(2)),
          taxable: Number(catalogBase.toFixed(2)),
        },
        {
          num: '02',
          title: `100% Promotional Voucher Discount (Coupon: ${couponCode})`,
          desc: 'Authorized promotional voucher applied in full • 100% invoice discount subsidy covered by platform master marketing ledger',
          sac: sacDefault,
          qty: 1.0,
          rate: Number((-catalogBase).toFixed(2)),
          taxable: Number((-catalogBase).toFixed(2)),
        },
        {
          num: '03',
          title: 'Dedicated Carrier Trunk Channels & Sovereign SIP Binding',
          desc: 'High-Concurrency Telecom Routing, Local Number Binding & Real-Time Call Event Webhooks (Included with Voucher)',
          sac: sacDefault,
          qty: 2.0,
          rate: 0.0,
          taxable: 0.0,
        },
      ];
    }

    if (isTopup) {
      return [
        {
          num: '01',
          title: invoice.plan_name || 'Prepaid Carrier Telephony Minutes & Transit Balance Top-Up',
          desc: 'Global PSTN / GSM Outbound Trunk Balance & Live SIP Routing Transit Pool Credits for AI Agent Dials',
          sac: sacDefault,
          qty: 1.0,
          rate: Number(subtotal.toFixed(2)),
          taxable: Number(subtotal.toFixed(2)),
        },
      ];
    } else if (planLower.includes('enterprise') || planLower.includes('sovereign')) {
      const item1Sub = subtotal * 0.8;
      const item2Sub = subtotal * 0.2;
      return [
        {
          num: '01',
          title: invoice.plan_name || 'Enterprise Sovereign AI Voice Cluster (Monthly)',
          desc: 'Dedicated LLM Orchestration, Real-Time Low Latency Audio Bridge, Unlimited RAG Vector Storage & SLA 99.99%',
          sac: sacDefault,
          qty: 1.0,
          rate: Number(item1Sub.toFixed(2)),
          taxable: Number(item1Sub.toFixed(2)),
        },
        {
          num: '02',
          title: 'High-Concurrency Multi-Carrier SIP Gateway Interconnect (10 Trunks)',
          desc: 'Dedicated Low-Latency PSTN Ingress/Egress Channels, Sovereign DID Carrier Interconnect & Priority Telephony Rail',
          sac: sacDefault,
          qty: 10.0,
          rate: Number((item2Sub / 10).toFixed(2)),
          taxable: Number(item2Sub.toFixed(2)),
        },
      ];
    } else if (planLower.includes('pro') || planLower.includes('scale')) {
      const item1Sub = subtotal * 0.85;
      const item2Sub = subtotal * 0.15;
      return [
        {
          num: '01',
          title: invoice.plan_name || 'Pro Scale AI Telephony Engine (Monthly Subscription)',
          desc: 'Autonomous AI Voice Calling Engine • 1,000 Mins PSTN/SIP Calling • Low-Latency LLM Pipeline • Vector RAG Storage',
          sac: sacDefault,
          qty: 1.0,
          rate: Number(item1Sub.toFixed(2)),
          taxable: Number(item1Sub.toFixed(2)),
        },
        {
          num: '02',
          title: 'Dedicated Carrier Trunk Channels (2 Inbound/Outbound Lines)',
          desc: 'High-Concurrency Telecom Routing, Local Number Binding & Real-Time Call Event Webhooks',
          sac: sacDefault,
          qty: 2.0,
          rate: Number((item2Sub / 2).toFixed(2)),
          taxable: Number(item2Sub.toFixed(2)),
        },
      ];
    } else {
      return [
        {
          num: '01',
          title: invoice.plan_name || 'AI Voice Agent Base Telephony Subscription',
          desc: 'Standard AI Voice Agent Runtime, PSTN Interconnect & Real-Time Analytics Dashboard',
          sac: sacDefault,
          qty: 1.0,
          rate: Number(subtotal.toFixed(2)),
          taxable: Number(subtotal.toFixed(2)),
        },
      ];
    }
  }, [invoice, subtotal, totalAmount, isPromoInvoice, currCode, templateSettings.sac_code]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyInvoiceNumber = (invNo: string) => {
    navigator.clipboard.writeText(invNo);
    addToast({
      type: 'success',
      title: 'Invoice Number Copied',
      description: `${invNo} copied to clipboard.`,
    });
  };

  const handleEmailInvoice = () => {
    addToast({
      type: 'info',
      title: 'Invoice Dispatched',
      description: `Official PDF invoice for ${invoice.invoice_number} sent to ${customerEmail}.`,
    });
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(invoice, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${invoice.invoice_number}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast({
      type: 'info',
      title: 'Ledger Record Exported',
      description: `Downloaded JSON audit ledger for ${invoice.invoice_number}.`,
    });
  };

  return (
    <div className="space-y-4" style={{ fontFamily: templateSettings.font_family || 'inherit' }}>
      {/* Top Bar for Dedicated Invoice Screen */}
      {showTopBar && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/90 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-700/60 shadow-2xs transition-all duration-200 cursor-pointer group shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-zinc-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:-translate-x-0.5 transition-all duration-200" />
                <span>{backLabel}</span>
              </button>
            )}

            {onBack && <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block shrink-0" />}

            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                <span>Tax Invoice</span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-semibold tracking-normal">
                  #{invoice.invoice_number}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => handleCopyInvoiceNumber(invoice.invoice_number)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Copy Invoice #"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadJson}
              className="text-xs font-semibold border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 cursor-pointer rounded-lg shadow-2xs"
              leftIcon={<Download className="h-3.5 w-3.5 text-zinc-500" />}
            >
              JSON
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleEmailInvoice}
              className="text-xs font-semibold border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 cursor-pointer rounded-lg shadow-2xs"
              leftIcon={<Mail className="h-3.5 w-3.5 text-zinc-500" />}
            >
              Email
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              style={{ backgroundColor: primaryColor }}
              className="text-white font-bold text-xs shadow-xs cursor-pointer px-3.5 rounded-lg hover:brightness-110 transition-all"
              leftIcon={<Printer className="h-3.5 w-3.5 text-white" />}
            >
              Print / PDF
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EXECUTIVE DIGITAL A4 CORPORATE TAX INVOICE DOCUMENT */}
      {/* ======================================================== */}
      <div
        id="invoice-printable-document"
        style={{
          borderRadius,
          paddingTop: `${padTop}px`,
          paddingRight: `${padRight}px`,
          paddingBottom: `${padBottom}px`,
          paddingLeft: `${padLeft}px`,
        }}
        className="relative bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 shadow-xl space-y-4 max-w-3xl mx-auto text-zinc-900 dark:text-zinc-100 font-sans print:p-0 print:border-none print:shadow-none print:max-w-full overflow-hidden text-[11px] transition-all"
      >
        {/* Subtle Diagonal Security Watermark */}
        {templateSettings.show_watermark !== false && (
          <div className="absolute inset-0 flex items-center justify-center select-none overflow-hidden z-0 pointer-events-none">
            <span
              className="text-6xl sm:text-8xl font-black uppercase tracking-widest select-none whitespace-nowrap"
              style={{
                color: primaryColor,
                transform: `rotate(${templateSettings.watermark_angle ?? -25}deg)`,
                opacity: templateSettings.watermark_opacity ?? 0.04,
              }}
            >
              {watermarkString}
            </span>
          </div>
        )}

        {/* Top Accent Stripe */}
        <div
          className="h-1.5 -mt-6 -mx-6 sm:-mt-8 sm:-mx-8 mb-4 print:h-1.5"
          style={{ backgroundColor: primaryColor }}
        />

        {/* 1. OFFICIAL BRAND HEADER WITH DUAL LOGO & METADATA */}
        <div className="relative z-10 pb-3 border-b border-zinc-300 dark:border-zinc-800">
          <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
            logoPosition === 'center' ? 'sm:flex-col sm:items-center text-center' : ''
          }`}>
            {/* Left / Center: Brand Logos & Company Information */}
            <div className={`space-y-2 min-w-0 max-w-md ${logoPosition === 'center' ? 'mx-auto text-center' : ''}`}>
              {/* Logo Presentation Switcher */}
              <div className="p-1 -m-1">
                {logoMode === 'dual' ? (
                  /* Dual Logo: Square Icon + Wide Banner text together */
                  <div className="flex items-center gap-3 flex-wrap">
                    <img
                      src={iconLogoUrl}
                      alt="App Icon Mark"
                      style={{ height: `${iconSizePx}px`, width: `${iconSizePx}px` }}
                      className="object-contain rounded-lg p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xs shrink-0"
                    />
                    <img
                      src={bannerLogoUrl}
                      alt="Create Call OS Official Banner"
                      style={{ height: logoHeightPx, width: logoWidthPx, objectFit: logoFit }}
                      className="max-w-full rounded p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                    />
                  </div>
                ) : logoMode === 'banner_only' ? (
                  /* Wide Banner Only */
                  <div className="flex items-center">
                    <img
                      src={bannerLogoUrl}
                      alt="Create Call OS Official Banner"
                      style={{ height: logoHeightPx, width: logoWidthPx, objectFit: logoFit }}
                      className="max-w-full rounded p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                    />
                  </div>
                ) : logoMode === 'icon_with_text' ? (
                  /* Square Icon + Company Name Lockup */
                  <div className="flex items-center gap-3">
                    <img
                      src={iconLogoUrl}
                      alt="Create Call OS Icon"
                      style={{ height: `${iconSizePx}px`, width: `${iconSizePx}px`, objectFit: logoFit }}
                      className="rounded-lg p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xs shrink-0"
                    />
                    <div className="min-w-0 text-left">
                      <div
                        className="font-extrabold text-zinc-950 dark:text-white tracking-tight leading-snug"
                        style={{ fontSize: `${templateSettings.company_font_size || 15}px` }}
                      >
                        {templateSettings.company_name}
                      </div>
                      <div
                        className="text-[9px] font-mono font-bold uppercase tracking-wider truncate"
                        style={{ color: primaryColor }}
                      >
                        {templateSettings.company_tagline || 'AI Voice Operating System • Global Carrier Telephony'}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Square Icon Only */
                  <div className="flex items-center">
                    <img
                      src={iconLogoUrl}
                      alt="App Icon"
                      style={{ height: `${iconSizePx}px`, width: `${iconSizePx}px`, objectFit: logoFit }}
                      className="rounded-lg p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                    />
                  </div>
                )}
              </div>

              {/* Legal Address & Identifiers */}
              <div className="p-1 -m-1 text-[10px] text-zinc-600 dark:text-zinc-400 space-y-0.5 leading-tight pt-1 font-sans">
                <div className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">{templateSettings.company_name}</div>
                <div>{templateSettings.head_office_address}</div>
                <div className="font-mono text-[9.5px]">
                  GSTIN: <span className="font-bold text-zinc-800 dark:text-zinc-200">{templateSettings.gstin}</span> • CIN: <span className="font-bold text-zinc-800 dark:text-zinc-200">{templateSettings.cin}</span>
                </div>
                <div className="font-mono text-[9.5px]">
                  SAC: <span className="font-bold">{templateSettings.sac_code}</span> • DoT: <span className="font-bold">{templateSettings.dot_license}</span>
                </div>
                <div className="text-[9px] text-zinc-500">
                  {templateSettings.support_email} • {templateSettings.billing_email} {templateSettings.support_phone ? `• ${templateSettings.support_phone}` : ''}
                </div>
              </div>
            </div>

            {/* Right / Top Badge: Tax Invoice Title Badge & Invoice Meta */}
            <div className={`p-1.5 -m-1.5 flex flex-col sm:items-end gap-1.5 shrink-0 text-left sm:text-right ${
              logoPosition === 'center' ? 'sm:items-center text-center mx-auto' : ''
            }`}>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono font-black uppercase tracking-wider shadow-2xs"
                style={{ fontSize: `${(templateSettings.title_font_size || 20) * 0.52}px` }}
              >
                <FileText className="h-3 w-3" />
                {templateSettings.invoice_title || 'TAX INVOICE / PAYMENT RECEIPT'}
              </div>

              <div className="pt-1 space-y-0.5 font-mono">
                <div
                  className="font-black text-zinc-950 dark:text-white tracking-tight"
                  style={{ fontSize: `${templateSettings.title_font_size || 20}px` }}
                >
                  {invoice.invoice_number}
                </div>
                <div className="text-[9.5px] text-zinc-500">
                  Ref: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{invoice.id || 'TXN-SETTLED-8894'}</span>
                </div>
              </div>

              <div className="pt-0.5">
                {isRefunded ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 text-[9.5px] font-mono font-bold uppercase">
                    <XCircle className="h-3 w-3 text-rose-600" />
                    REFUNDED / CREDIT REVERSED
                  </span>
                ) : isOfflinePending ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-[9.5px] font-mono font-bold uppercase">
                    <Clock className="h-3 w-3 text-amber-600" />
                    PROFORMA / PENDING WIRE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-[9.5px] font-mono font-bold uppercase">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    PAID IN FULL (SETTLED)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. FORMAL TWO-COLUMN PARTY DETAILS & SPECIFICATIONS TABLE */}
        <div
          style={{ borderRadius }}
          className="relative z-10 border border-zinc-300 dark:border-zinc-700 overflow-hidden text-[10.5px]"
        >
          {/* Table 1: Issuer & Billed-To 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-300 dark:divide-zinc-700">
            {/* Left Cell: Issuer Details */}
            <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-1">
              <div className="flex items-center justify-between text-zinc-500 font-bold uppercase tracking-wider text-[9px] pb-1 border-b border-zinc-200 dark:border-zinc-700/60">
                <span className="text-zinc-800 dark:text-zinc-200 font-bold">1. SERVICE PROVIDER / ISSUER</span>
                <Building className="h-3 w-3" style={{ color: primaryColor }} />
              </div>
              <div className="font-bold text-xs text-zinc-950 dark:text-zinc-50">{templateSettings.company_name}</div>
              <div className="text-zinc-600 dark:text-zinc-400 text-[10px] leading-tight">{templateSettings.head_office_address}</div>
              <div className="font-mono text-[9.5px] text-zinc-600 dark:text-zinc-300 pt-0.5">
                GSTIN / Tax ID: <strong className="text-zinc-900 dark:text-zinc-100">{templateSettings.gstin}</strong>
              </div>
              <div className="font-mono text-[9px] text-zinc-500">
                State: <strong className="text-zinc-700 dark:text-zinc-300">Uttar Pradesh (09)</strong> • SAC: <strong>{templateSettings.sac_code}</strong>
              </div>
            </div>

            {/* Right Cell: Billed-To Details */}
            <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-1">
              <div className="flex items-center justify-between text-zinc-500 font-bold uppercase tracking-wider text-[9px] pb-1 border-b border-zinc-200 dark:border-zinc-700/60">
                <span className="text-zinc-800 dark:text-zinc-200 font-bold">2. BILLED TO / RECIPIENT</span>
                <Building className="h-3 w-3" style={{ color: primaryColor }} />
              </div>
              <div className="font-bold text-xs text-zinc-950 dark:text-zinc-50">{customerName}</div>
              <div className="text-zinc-600 dark:text-zinc-300 text-[10px] font-medium">{workspaceName}</div>
              <div className="text-zinc-500 font-mono text-[9.5px]">{customerEmail}</div>
              <div className="text-zinc-600 dark:text-zinc-400 text-[10px] leading-tight">{customerAddress}</div>
              <div className="font-mono text-[9.5px] text-zinc-600 dark:text-zinc-300 pt-0.5">
                GSTIN / Tax ID: <strong className="text-zinc-900 dark:text-zinc-100">{invoice.tax_id || 'GSTIN27AAACZ1098Q1ZP'}</strong>
              </div>
            </div>
          </div>

          {/* Table 2: 4-Column Accounting Specifications Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-300 dark:divide-zinc-700 border-t border-zinc-300 dark:border-zinc-700 bg-zinc-100/70 dark:bg-zinc-850/60 text-[9.5px] font-mono">
            <div className="p-2">
              <span className="text-zinc-500 uppercase block text-[8.5px]">Invoice Date:</span>
              <strong className="text-zinc-900 dark:text-zinc-100">{invoice.date || invoice.created_at || new Date().toLocaleDateString()}</strong>
            </div>
            <div className="p-2">
              <span className="text-zinc-500 uppercase block text-[8.5px]">Payment Terms:</span>
              <strong className={isOfflinePending ? 'text-amber-600' : isPromoInvoice ? 'text-teal-600' : 'text-emerald-600'}>
                {isOfflinePending ? 'Wire Settlement' : isPromoInvoice ? '100% Promo Voucher' : 'Immediate Settled'}
              </strong>
            </div>
            <div className="p-2">
              <span className="text-zinc-500 uppercase block text-[8.5px]">Settlement Rail:</span>
              <strong className="text-zinc-900 dark:text-zinc-100 uppercase truncate block">
                {isPromoInvoice
                  ? `PROMO (${invoice.coupon_code || invoice.details_json?.coupon_code || 'VOUCHER'}) • ${getGatewayDisplayName(invoice.gateway || invoice.gateway_key || invoice.details_json?.gateway || 'PROMOTIONAL_VOUCHER')}`
                  : getGatewayDisplayName(invoice.gateway || invoice.gateway_key || invoice.details_json?.gateway || 'ELECTRONIC')}
              </strong>
            </div>
            <div className="p-2">
              <span className="text-zinc-500 uppercase block text-[8.5px]">Place of Supply:</span>
              <strong className="text-zinc-900 dark:text-zinc-100">{templateSettings.place_of_supply || 'Cyber City, UP-09'}</strong>
            </div>
          </div>
        </div>

        {/* 3. FORMAL ITEMIZED SERVICES TABLE (DYNAMIC BASED ON PLAN/PAYMENT) */}
        <div
          style={{ borderRadius }}
          className="relative z-10 border border-zinc-300 dark:border-zinc-700 overflow-hidden"
        >
          <table className="w-full text-[10.5px] text-left border-collapse">
            <thead className="bg-zinc-100 dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 uppercase font-bold text-[9px] tracking-wider border-b border-zinc-300 dark:border-zinc-700 font-mono">
              <tr>
                <th style={{ padding: `${tablePaddingPx}px 8px` }} className="text-center w-8 border-r border-zinc-300 dark:border-zinc-700">#</th>
                <th style={{ padding: `${tablePaddingPx}px 10px` }} className="border-r border-zinc-300 dark:border-zinc-700">Description of AI Voice Telephony Services &amp; Line Particulars</th>
                <th style={{ padding: `${tablePaddingPx}px 8px` }} className="text-center w-16 border-r border-zinc-300 dark:border-zinc-700">HSN/SAC</th>
                <th style={{ padding: `${tablePaddingPx}px 8px` }} className="text-center w-14 border-r border-zinc-300 dark:border-zinc-700">Qty</th>
                <th style={{ padding: `${tablePaddingPx}px 10px` }} className="text-right w-24 border-r border-zinc-300 dark:border-zinc-700">Rate ({currCode})</th>
                <th style={{ padding: `${tablePaddingPx}px 10px` }} className="text-right w-28">Taxable ({currCode})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-300 dark:divide-zinc-700 font-mono text-[10px]">
              {dynamicLineItems.map((item) => (
                <tr key={item.num} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                  <td style={{ padding: `${tablePaddingPx}px 8px` }} className="text-center text-zinc-400 font-bold border-r border-zinc-300 dark:border-zinc-700">{item.num}</td>
                  <td style={{ padding: `${tablePaddingPx}px 10px` }} className="font-sans border-r border-zinc-300 dark:border-zinc-700">
                    <div className="font-bold text-zinc-950 dark:text-zinc-50 text-[11px]">{item.title}</div>
                    <div className="text-[9.5px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{item.desc}</div>
                  </td>
                  <td style={{ padding: `${tablePaddingPx}px 8px` }} className="text-center text-zinc-600 dark:text-zinc-400 font-mono border-r border-zinc-300 dark:border-zinc-700">{item.sac}</td>
                  <td style={{ padding: `${tablePaddingPx}px 8px` }} className="text-center text-zinc-600 dark:text-zinc-400 border-r border-zinc-300 dark:border-zinc-700">{item.qty.toFixed(2)}</td>
                  <td style={{ padding: `${tablePaddingPx}px 10px` }} className="text-right text-zinc-700 dark:text-zinc-300 border-r border-zinc-300 dark:border-zinc-700">{currSymbol}{item.rate.toFixed(2)}</td>
                  <td style={{ padding: `${tablePaddingPx}px 10px` }} className="text-right font-bold text-zinc-950 dark:text-zinc-50">{currSymbol}{item.taxable.toFixed(2)}</td>
                </tr>
              ))}

              {/* 4. STATUTORY TAX CALCULATION & SUMMARY ROWS */}
              <tr className="bg-zinc-50 dark:bg-zinc-900/40 border-t-2 border-zinc-300 dark:border-zinc-700">
                <td colSpan={5} style={{ padding: `${tablePaddingPx}px 10px` }} className="text-right font-sans font-semibold text-zinc-700 dark:text-zinc-300 border-r border-zinc-300 dark:border-zinc-700">
                  Net Taxable Base Amount:
                </td>
                <td style={{ padding: `${tablePaddingPx}px 10px` }} className="text-right font-bold text-zinc-900 dark:text-zinc-100">
                  {currSymbol}{subtotal.toFixed(2)}
                </td>
              </tr>

              <tr>
                <td colSpan={5} style={{ padding: `${tablePaddingPx}px 10px` }} className="text-right font-sans text-zinc-600 dark:text-zinc-400 border-r border-zinc-300 dark:border-zinc-700">
                  Central GST (CGST @ {(taxPercent / 2).toFixed(1)}%):
                </td>
                <td style={{ padding: `${tablePaddingPx}px 10px` }} className="text-right text-zinc-800 dark:text-zinc-200">
                  {currSymbol}{(taxAmount / 2).toFixed(2)}
                </td>
              </tr>

              <tr>
                <td colSpan={5} style={{ padding: `${tablePaddingPx}px 10px` }} className="text-right font-sans text-zinc-600 dark:text-zinc-400 border-r border-zinc-300 dark:border-zinc-700">
                  State GST (SGST @ {(taxPercent / 2).toFixed(1)}%):
                </td>
                <td style={{ padding: `${tablePaddingPx}px 10px` }} className="text-right text-zinc-800 dark:text-zinc-200">
                  {currSymbol}{(taxAmount / 2).toFixed(2)}
                </td>
              </tr>

              {/* Grand Total Row */}
              <tr
                className="font-bold border-t-2 text-xs"
                style={{
                  backgroundColor: `${primaryColor}14`,
                  borderColor: primaryColor,
                }}
              >
                <td colSpan={5} className="p-2.5 font-sans text-zinc-950 dark:text-white uppercase tracking-tight border-r border-zinc-300 dark:border-zinc-700">
                  {isRefunded ? 'Grand Total Amount (Canceled / Refunded):' : 'Grand Total Settled Amount (Paid in Full):'}
                </td>
                <td
                  className="p-2.5 text-right font-mono text-sm font-black"
                  style={{ color: primaryColor }}
                >
                  {currSymbol}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. AMOUNT IN WORDS STRIP */}
        <div
          style={{ borderRadius }}
          className="relative z-10 p-2 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-mono flex items-center justify-between gap-2"
        >
          <span className="text-zinc-500 uppercase text-[8.5px] font-bold shrink-0">Amount in Words:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-right truncate">
            {formatAmountInWords(totalAmount, currCode)}
          </span>
        </div>

        {/* 6. DYNAMIC SETTLEMENT RAIL CLEARANCE TABLE (100% NON-HARDCODED) */}
        {isBankTransfer ? (
          <div
            style={{ borderRadius }}
            className="relative z-10 border border-zinc-300 dark:border-zinc-700 overflow-hidden text-[9.5px] font-mono"
          >
            <div className="flex items-center justify-between p-2 bg-zinc-100/90 dark:bg-zinc-850/90 border-b border-zinc-300 dark:border-zinc-700 font-bold uppercase text-[9px]">
              <span className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-bold">
                <CreditCard className="h-3 w-3" style={{ color: primaryColor }} />
                Official Bank Remittance &amp; Wire Clearance Standard
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ Statutory Standard</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-300 dark:divide-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="p-2">
                <span className="text-zinc-500 block text-[8px] uppercase">Bank Name:</span>
                <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{invoice.bank_name || templateSettings.bank_name || 'Bank of India'}</strong>
              </div>
              <div className="p-2">
                <span className="text-zinc-500 block text-[8px] uppercase">Beneficiary:</span>
                <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{invoice.bank_beneficiary || templateSettings.bank_beneficiary || templateSettings.company_name}</strong>
              </div>
              <div className="p-2">
                <span className="text-zinc-500 block text-[8px] uppercase">Account Number:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{invoice.bank_account_no || templateSettings.bank_account_no || '601410110014986'}</strong>
              </div>
              <div className="p-2">
                <span className="text-zinc-500 block text-[8px] uppercase">IFSC / UPI:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{invoice.bank_ifsc_swift || templateSettings.bank_ifsc_swift || templateSettings.vpa_address || 'BKID0006014'}</strong>
              </div>
            </div>
            {invoice.bank_reference_utr && (
              <div className="p-2 bg-emerald-50/40 dark:bg-emerald-950/20 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[9px]">
                <span className="text-zinc-500 font-bold">SUBMITTED BANK UTR / REFERENCE:</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300 tracking-wider">{invoice.bank_reference_utr}</span>
              </div>
            )}
          </div>
        ) : isPromoInvoice ? (
          <div
            style={{ borderRadius }}
            className="relative z-10 border border-teal-300 dark:border-teal-800 overflow-hidden text-[9.5px] font-mono bg-teal-50/30 dark:bg-teal-950/20"
          >
            <div className="flex items-center justify-between p-2 bg-teal-100/70 dark:bg-teal-900/40 border-b border-teal-200 dark:border-teal-800 font-bold uppercase text-[9px]">
              <span className="flex items-center gap-1.5 text-teal-900 dark:text-teal-200 font-bold">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                Official 100% Promotional Sponsorship &amp; Voucher Settlement
              </span>
              <span className="text-teal-800 dark:text-teal-300 font-bold">✓ Subsidized Master Ledger</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-teal-200 dark:divide-teal-800/60 bg-white/60 dark:bg-zinc-900/60">
              <div className="p-2">
                <span className="text-zinc-500 block text-[8px] uppercase">Sponsorship Mode:</span>
                <strong className="text-teal-900 dark:text-teal-200 truncate block">100% Promotional Voucher</strong>
              </div>
              <div className="p-2">
                <span className="text-zinc-500 block text-[8px] uppercase">Voucher Code:</span>
                <strong className="text-teal-900 dark:text-teal-200 truncate block">{invoice.coupon_code || invoice.details_json?.coupon_code || 'CREATECALL100'}</strong>
              </div>
              <div className="p-2">
                <span className="text-zinc-500 block text-[8px] uppercase">Validation Rail:</span>
                <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{getGatewayDisplayName(invoice.gateway || invoice.gateway_key || invoice.details_json?.gateway || 'PROMOTIONAL_VOUCHER')}</strong>
              </div>
              <div className="p-2">
                <span className="text-zinc-500 block text-[8px] uppercase">Settlement Status:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">✓ Settled In Full ({currSymbol}0.00 Due)</strong>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{ borderRadius }}
            className="relative z-10 border border-zinc-300 dark:border-zinc-700 overflow-hidden text-[9.5px] font-mono"
          >
            <div className="flex items-center justify-between p-2 bg-zinc-100/90 dark:bg-zinc-850/90 border-b border-zinc-300 dark:border-zinc-700 font-bold uppercase text-[9px]">
              <span className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-bold">
                <CreditCard className="h-3 w-3" style={{ color: primaryColor }} />
                Official Electronic Gateway Settlement Rail &amp; Digital Clearance
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ 256-Bit TLS Verified</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-300 dark:divide-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="p-2">
                <span className="text-zinc-500 block text-[8px] uppercase">Gateway Rail:</span>
                <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{getGatewayDisplayName(invoice.gateway || invoice.gateway_key || invoice.details_json?.gateway || 'stripe')}</strong>
              </div>
              <div className="p-2">
                <span className="text-zinc-500 block text-[8px] uppercase">Gateway Payment ID:</span>
                <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{invoice.gateway_payment_id || invoice.transaction_id || `PAY-${invoice.invoice_number}`}</strong>
              </div>
              <div className="p-2">
                <span className="text-zinc-500 block text-[8px] uppercase">Merchant Entity:</span>
                <strong className="text-zinc-900 dark:text-zinc-100 truncate block">{templateSettings.company_name}</strong>
              </div>
              <div className="p-2">
                <span className="text-zinc-500 block text-[8px] uppercase">Clearance Status:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">✓ Instant Ledger Settlement</strong>
              </div>
            </div>
          </div>
        )}

        {/* 7. DIGITAL SEAL, QR MATRIX & AUTHORIZED SIGNATURE FOOTER */}
        <div className={`relative z-10 grid grid-cols-1 ${
          signaturePosition === 'center'
            ? 'sm:grid-cols-1 text-center'
            : signaturePosition === 'left'
            ? 'sm:grid-cols-3'
            : 'sm:grid-cols-3'
        } gap-3 pt-3 border-t border-zinc-300 dark:border-zinc-800 items-center text-[9.5px]`}>
          {/* Left Column */}
          {signaturePosition === 'left' ? (
            /* Inverted: Signature Block on the Left */
            <div className="space-y-0.5 relative text-left">
              <div className="text-[8px] font-mono text-zinc-500 uppercase font-bold">For {templateSettings.company_name}</div>
              {templateSettings.signature_url ? (
                <div className="py-1 flex justify-start">
                  <img
                    src={templateSettings.signature_url}
                    alt="Authorized Signature"
                    style={{
                      height: `${templateSettings.signature_size ? templateSettings.signature_size * 1.5 : 36}px`,
                      transform: `rotate(${templateSettings.signature_rotation ?? -3}deg)`,
                    }}
                    className="max-w-[150px] object-contain filter dark:invert-0"
                  />
                </div>
              ) : (
                <div
                  className="select-none py-0.5 truncate"
                  style={{
                    color: primaryColor,
                    fontFamily: templateSettings.signature_font || 'Great Vibes, cursive',
                    fontSize: `${templateSettings.signature_size || 24}px`,
                    transform: `rotate(${templateSettings.signature_rotation ?? -3}deg)`,
                    transformOrigin: 'left center',
                  }}
                >
                  {templateSettings.authorized_signatory_name || 'Mukta Swami'}
                </div>
              )}
              <div className="font-bold text-zinc-950 dark:text-zinc-50 text-[10px]">
                {templateSettings.authorized_signatory_name || 'Mukta Swami'}
              </div>
              <div className="font-mono text-[8.5px] font-bold" style={{ color: primaryColor }}>
                {templateSettings.authorized_signatory_title || 'Founder & Managing Director'}
              </div>
              <div className="text-[7px] text-zinc-400 leading-tight font-mono pt-0.5">
                {templateSettings.footer_note || templateSettings.terms_notes || 'Computer-generated electronic tax invoice under IT Act, 2000.'}
              </div>

              {/* Overlapping Stamp in Left Signature Mode */}
              {templateSettings.seal_position === 'signature_stamp' && (
                <div className="absolute left-16 -top-2 opacity-80 mix-blend-multiply dark:mix-blend-screen z-20 pointer-events-none">
                  <DigitalVerificationSeal
                    primaryColor={primaryColor}
                    sealText={templateSettings.seal_text}
                    badgeText={templateSettings.seal_badge_text}
                    sealUrl={templateSettings.seal_url}
                    size={(templateSettings.seal_size || 100) * 0.8}
                    rotation={templateSettings.seal_rotation ?? -8}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Standard: QR Matrix on Left */
            <div className="flex items-center gap-2 p-1 -m-1">
              {templateSettings.show_qr_code !== false && (
                <InvoiceQrCode invoiceNumber={invoice.invoice_number || 'CCOS-INV-2026-8894'} />
              )}
              <div className="text-[8.5px] text-zinc-500 space-y-0.5 font-mono text-left">
                <div className="font-bold text-zinc-800 dark:text-zinc-200">Cryptographic Seal</div>
                <div className="break-all text-[7.5px] text-zinc-400">
                  SHA256:{(invoice.invoice_number || 'INV').replace(/[^a-zA-Z0-9]/g, '').padEnd(12, '0').slice(0, 12)}...
                </div>
                <div className="text-emerald-700 dark:text-emerald-400 font-bold">✓ IT Act Ledger Verified</div>
              </div>

              {/* Seal Placed beside QR Code if seal_position === 'left' */}
              {templateSettings.seal_position === 'left' && (
                <div className="ml-2 shrink-0">
                  <DigitalVerificationSeal
                    primaryColor={primaryColor}
                    sealText={templateSettings.seal_text}
                    badgeText={templateSettings.seal_badge_text}
                    sealUrl={templateSettings.seal_url}
                    size={(templateSettings.seal_size || 100) * 0.75}
                    rotation={templateSettings.seal_rotation ?? -5}
                  />
                </div>
              )}
            </div>
          )}

          {/* Center Column: Digital Mohar (if center position) */}
          <div className="flex justify-center p-1 -m-1">
            {templateSettings.seal_position === 'center' ? (
              <DigitalVerificationSeal
                primaryColor={primaryColor}
                sealText={templateSettings.seal_text}
                badgeText={templateSettings.seal_badge_text}
                sealUrl={templateSettings.seal_url}
                size={templateSettings.seal_size || 100}
                rotation={templateSettings.seal_rotation ?? -5}
              />
            ) : null}
          </div>

          {/* Right Column */}
          {signaturePosition === 'left' ? (
            /* Inverted: QR Code on the Right */
            <div className="flex items-center justify-end gap-2 p-1 -m-1">
              <div className="text-[8.5px] text-zinc-500 space-y-0.5 font-mono text-right">
                <div className="font-bold text-zinc-800 dark:text-zinc-200">Cryptographic Seal</div>
                <div className="break-all text-[7.5px] text-zinc-400">
                  SHA256:{(invoice.invoice_number || 'INV').replace(/[^a-zA-Z0-9]/g, '').padEnd(12, '0').slice(0, 12)}...
                </div>
                <div className="text-emerald-700 dark:text-emerald-400 font-bold">✓ IT Act Ledger Verified</div>
              </div>
              {templateSettings.show_qr_code !== false && (
                <InvoiceQrCode invoiceNumber={invoice.invoice_number || 'CCOS-INV-2026-8894'} />
              )}
            </div>
          ) : (
            /* Standard: Signatory Block on Right */
            <div className={`space-y-0.5 relative ${signaturePosition === 'center' ? 'text-center' : 'sm:text-right'} p-1 -m-1`}>
              <div className="text-[8px] font-mono text-zinc-500 uppercase font-bold">For {templateSettings.company_name}</div>

              {/* Signature Graphic / Calligraphy Font */}
              {templateSettings.signature_url ? (
                <div className={`py-1 flex ${signaturePosition === 'center' ? 'justify-center' : 'sm:justify-end justify-start'}`}>
                  <img
                    src={templateSettings.signature_url}
                    alt="Authorized Signature"
                    style={{
                      height: `${templateSettings.signature_size ? templateSettings.signature_size * 1.5 : 36}px`,
                      transform: `rotate(${templateSettings.signature_rotation ?? -3}deg)`,
                    }}
                    className="max-w-[150px] object-contain filter dark:invert-0"
                  />
                </div>
              ) : (
                <div
                  className="select-none py-0.5 truncate"
                  style={{
                    color: primaryColor,
                    fontFamily: templateSettings.signature_font || 'Great Vibes, cursive',
                    fontSize: `${templateSettings.signature_size || 24}px`,
                    transform: `rotate(${templateSettings.signature_rotation ?? -3}deg)`,
                    transformOrigin: signaturePosition === 'center' ? 'center center' : 'right center',
                  }}
                >
                  {templateSettings.authorized_signatory_name || 'Mukta Swami'}
                </div>
              )}

              <div className="font-bold text-zinc-950 dark:text-zinc-50 text-[10px]">
                {templateSettings.authorized_signatory_name || 'Mukta Swami'}
              </div>
              <div
                className="font-mono text-[8.5px] font-bold"
                style={{ color: primaryColor }}
              >
                {templateSettings.authorized_signatory_title || 'Founder & Managing Director'}
              </div>
              <div className="text-[7px] text-zinc-400 leading-tight font-mono pt-0.5">
                {templateSettings.footer_note || templateSettings.terms_notes || 'Computer-generated electronic tax invoice under IT Act, 2000.'}
              </div>

              {/* Overlapping Stamp in Right Signature Mode */}
              {templateSettings.seal_position === 'signature_stamp' && (
                <div className="absolute right-6 -top-3 opacity-80 mix-blend-multiply dark:mix-blend-screen z-20 pointer-events-none">
                  <DigitalVerificationSeal
                    primaryColor={primaryColor}
                    sealText={templateSettings.seal_text}
                    badgeText={templateSettings.seal_badge_text}
                    sealUrl={templateSettings.seal_url}
                    size={(templateSettings.seal_size || 100) * 0.85}
                    rotation={templateSettings.seal_rotation ?? -8}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
