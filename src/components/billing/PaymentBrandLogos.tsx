import React, { useState } from 'react';

export interface PaymentLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const getImgClasses = (size: 'xs' | 'sm' | 'md' | 'lg' | string = 'md') => {
  switch (size) {
    case 'xs':
      return 'h-4 max-w-[65px]';
    case 'sm':
      return 'h-5 max-w-[85px]';
    case 'lg':
      return 'h-9 sm:h-10 max-w-[170px]';
    case 'md':
    default:
      return 'h-6.5 sm:h-7.5 max-w-[135px]';
  }
};

/**
 * 100% Official Authentic Brand Logos for Payment Rails & Gateways
 * Direct official PNG / SVG image assets served from Vite public directory.
 */

// 1. RAZORPAY
export const RazorpayLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#0C2340] dark:text-sky-400">Razorpay</span>;
  }
  return (
    <img
      src="/images/payments/razorpay.svg"
      alt="Razorpay"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 2. STRIPE
export const StripeLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#635BFF]">stripe</span>;
  }
  return (
    <img
      src="/images/payments/stripe.svg"
      alt="Stripe"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 3. CASHFREE
export const CashfreeLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#0C2340] dark:text-white">Cashfree</span>;
  }
  return (
    <img
      src="/images/payments/cashfree.png"
      alt="Cashfree"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 4. PAYPAL
export const PayPalLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#003087]">PayPal</span>;
  }
  return (
    <img
      src="/images/payments/paypal.svg"
      alt="PayPal"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 5. PHONEPE
export const PhonePeLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#5F259F]">PhonePe</span>;
  }
  return (
    <img
      src="/images/payments/phonepe.svg"
      alt="PhonePe"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 6. UPI
export const UpiLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#0C2340] dark:text-white">UPI</span>;
  }
  return (
    <img
      src="/images/payments/upi.svg"
      alt="UPI"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 7. PAYTM
export const PaytmLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#002970]">Paytm</span>;
  }
  return (
    <img
      src="/images/payments/paytm.svg"
      alt="Paytm"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 8. AUTHORIZE.NET
export const AuthorizeNetLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#122438]">Authorize.Net</span>;
  }
  return (
    <img
      src="/images/payments/authorizenet.svg"
      alt="Authorize.Net"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 9. SQUARE
export const SquareLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-zinc-900 dark:text-white">Square</span>;
  }
  return (
    <img
      src="/images/payments/square.svg"
      alt="Square"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none dark:invert ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 10. CASH APP
export const CashAppLogo: React.FC<PaymentLogoProps & { variant?: 'pill' | 'plain' | 'icon' }> = ({
  className = '',
  size = 'md',
}) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#00D632]">Cash App</span>;
  }
  return (
    <img
      src="/images/payments/cash_app.svg"
      alt="Cash App"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 11. AFTERPAY
export const AfterpayLogo: React.FC<PaymentLogoProps & { variant?: 'badge' | 'plain' }> = ({
  className = '',
  size = 'md',
}) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-zinc-900 dark:text-teal-200">afterpay</span>;
  }
  return (
    <img
      src="/images/payments/afterpay.svg"
      alt="Afterpay"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 12. PADDLE
export const PaddleLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#0D2040] dark:text-sky-200">paddle</span>;
  }
  return (
    <img
      src="/images/payments/paddle.svg"
      alt="Paddle"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none dark:invert ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 13. COINBASE CRYPTO
export const CoinbaseCryptoLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#0052FF]">coinbase</span>;
  }
  return (
    <img
      src="/images/payments/coinbase.svg"
      alt="Coinbase"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 14. FLUTTERWAVE
export const FlutterwaveLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-zinc-900 dark:text-white">Flutterwave</span>;
  }
  return (
    <img
      src="/images/payments/flutterwave.png"
      alt="Flutterwave"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 15. ADYEN
export const AdyenLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#0ABF53]">adyen</span>;
  }
  return (
    <img
      src="/images/payments/adyen.svg"
      alt="Adyen"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 16. MERCADO PAGO
export const MercadoPagoLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#009EE3]">mercado pago</span>;
  }
  return (
    <img
      src="/images/payments/mercadopago.png"
      alt="Mercado Pago"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 17. KLARNA
export const KlarnaLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-zinc-900 dark:text-white">Klarna.</span>;
  }
  return (
    <img
      src="/images/payments/klarna.svg"
      alt="Klarna"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none dark:invert ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 18. MOLLIE
export const MollieLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-zinc-900 dark:text-white">mollie</span>;
  }
  return (
    <img
      src="/images/payments/mollie.png"
      alt="Mollie"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none dark:invert ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 19. SKRILL
export const SkrillLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#811E4D]">skrill</span>;
  }
  return (
    <img
      src="/images/payments/skrill.svg"
      alt="Skrill"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 20. ALIPAY+
export const AlipayLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-[#1677FF]">Alipay+</span>;
  }
  return (
    <img
      src="/images/payments/alipay.png"
      alt="Alipay+"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// 21. BANK WIRE / NEFT
export const BankTransferLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  if (error) {
    return <span className="font-sans font-black text-base text-teal-800 dark:text-teal-200">Bank Wire / NEFT</span>;
  }
  return (
    <img
      src="/images/payments/bank_transfer.svg"
      alt="Bank Wire / NEFT"
      className={`${getImgClasses(size)} w-auto object-contain select-none pointer-events-none ${className}`}
      loading="eager"
      onError={() => setError(true)}
    />
  );
};

// CARD BRAND BADGES
export const VisaBrandLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  return (
    <img
      src="/images/payments/visa.svg"
      alt="VISA"
      className={`${size === 'xs' ? 'h-3.5' : size === 'sm' ? 'h-4.5' : size === 'lg' ? 'h-7' : 'h-5'} w-auto object-contain select-none shrink-0 ${className}`}
    />
  );
};

export const MastercardBrandLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  return (
    <img
      src="/images/payments/mastercard.svg"
      alt="Mastercard"
      className={`${size === 'xs' ? 'h-3.5' : size === 'sm' ? 'h-4.5' : size === 'lg' ? 'h-7' : 'h-5'} w-auto object-contain select-none shrink-0 ${className}`}
    />
  );
};

export const AmexBrandLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  return (
    <img
      src="/images/payments/amex.svg"
      alt="AMEX"
      className={`${size === 'xs' ? 'h-3.5' : size === 'sm' ? 'h-4.5' : size === 'lg' ? 'h-7' : 'h-5'} w-auto object-contain select-none shrink-0 ${className}`}
    />
  );
};

export const DiscoverBrandLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  return (
    <img
      src="/images/payments/discover.svg"
      alt="Discover"
      className={`${size === 'xs' ? 'h-3.5' : size === 'sm' ? 'h-4.5' : size === 'lg' ? 'h-7' : 'h-5'} w-auto object-contain select-none shrink-0 ${className}`}
    />
  );
};

export const RupayBrandLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  return (
    <img
      src="/images/payments/rupay.svg"
      alt="RuPay"
      className={`${size === 'xs' ? 'h-3.5' : size === 'sm' ? 'h-4.5' : size === 'lg' ? 'h-7' : 'h-5'} w-auto object-contain select-none shrink-0 ${className}`}
    />
  );
};

export const CardBrandsLogo: React.FC<PaymentLogoProps> = ({ className = '', size = 'md' }) => {
  return (
    <div className={`inline-flex items-center gap-2 max-w-full shrink-0 ${className}`}>
      <VisaBrandLogo size={size} />
      <MastercardBrandLogo size={size} />
    </div>
  );
};

export const ApplePayLogo: React.FC<PaymentLogoProps & { variant?: 'black' | 'white' | 'auto' }> = ({
  className = '',
  size = 'md',
}) => {
  return (
    <img
      src="/images/payments/apple_pay.svg"
      alt="Apple Pay"
      className={`${size === 'xs' ? 'h-3.5' : size === 'sm' ? 'h-4.5' : size === 'lg' ? 'h-7' : 'h-5.5'} w-auto object-contain select-none shrink-0 dark:invert ${className}`}
    />
  );
};

export const GooglePayLogo: React.FC<PaymentLogoProps & { variant?: 'pill' | 'plain' }> = ({
  className = '',
  size = 'md',
}) => {
  return (
    <img
      src="/images/payments/google_pay.svg"
      alt="Google Pay"
      className={`${size === 'xs' ? 'h-3.5' : size === 'sm' ? 'h-4.5' : size === 'lg' ? 'h-7' : 'h-5.5'} w-auto object-contain select-none shrink-0 ${className}`}
    />
  );
};

export const StripeLinkLogo: React.FC<PaymentLogoProps> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#00D66F] text-[#0A2540] font-black text-xs tracking-wider select-none shrink-0 ${className}`}>
      <span>link</span>
    </div>
  );
};

// ==============================================================================
// AUTHENTIC BANK BRANDING & VECTOR LOGOS (INDIA & GLOBAL)
// ==============================================================================

export const SbiBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="15" fill="#00539F" />
        <circle cx="16" cy="16" r="5.5" fill="#FFFFFF" />
        <rect x="14.5" y="16" width="3" height="15" fill="#00539F" />
      </svg>
      <div className="flex flex-col text-left leading-none">
        <span className="font-sans font-black text-xs tracking-wider text-white uppercase drop-shadow-sm">SBI</span>
        <span className="text-[7px] text-sky-200 font-medium tracking-tight">State Bank of India</span>
      </div>
    </div>
  );
};

export const HdfcBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="3" fill="#004C8F" />
        <rect x="4" y="4" width="24" height="24" fill="#ED1C24" />
        <rect x="10" y="10" width="12" height="12" fill="#FFFFFF" />
        <rect x="13" y="4" width="6" height="24" fill="#004C8F" />
        <rect x="4" y="13" width="24" height="6" fill="#004C8F" />
      </svg>
      <span className="font-sans font-black text-xs tracking-tight text-white uppercase drop-shadow-sm">HDFC BANK</span>
    </div>
  );
};

export const IciciBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="15" fill="#B8282E" />
        <path d="M16 6C10.5 6 6 10.5 6 16C6 21.5 10.5 26 16 26C18.5 26 20.8 25.1 22.5 23.5L18.5 19.5C17.7 20.1 16.9 20.5 16 20.5C13.5 20.5 11.5 18.5 11.5 16C11.5 13.5 13.5 11.5 16 11.5C18.5 11.5 20.5 13.5 20.5 16H26C26 10.5 21.5 6 16 6Z" fill="#F37023" />
        <circle cx="16" cy="16" r="2.5" fill="#FFFFFF" />
      </svg>
      <span className="font-sans font-black text-xs tracking-tight text-amber-200 drop-shadow-sm">i ICICI Bank</span>
    </div>
  );
};

export const AxisBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 32 32" fill="none">
        <path d="M16 3L30 29H2L16 3Z" fill="#861F41" />
        <path d="M16 9L25 26H7L16 9Z" fill="#FFFFFF" />
        <path d="M16 15L21 24H11L16 15Z" fill="#861F41" />
      </svg>
      <span className="font-sans font-black text-xs tracking-wider text-rose-100 uppercase drop-shadow-sm">AXIS BANK</span>
    </div>
  );
};

export const KotakBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="15" fill="#EE1C25" />
        <path d="M11 9H14V23H11V9ZM21 9L15 15.5L21 23H17L12.5 17.5V14L17 9H21Z" fill="#FFFFFF" />
      </svg>
      <span className="font-sans font-black text-xs tracking-tight text-white drop-shadow-sm">kotak</span>
    </div>
  );
};

export const BobBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="15" fill="#F15A24" />
        <path d="M16 5C10 5 5 10 5 16C5 22 10 27 16 27C22 27 27 22 27 16C27 10 22 5 16 5ZM16 23C12.1 23 9 19.9 9 16C9 12.1 12.1 9 16 9C19.9 9 23 12.1 23 16C23 19.9 19.9 23 16 23Z" fill="#FFFFFF" />
      </svg>
      <span className="font-sans font-black text-xs tracking-tight text-orange-100 drop-shadow-sm">Bank of Baroda</span>
    </div>
  );
};

export const PnbBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="15" fill="#A61D24" />
        <circle cx="16" cy="16" r="11" fill="#F5A800" />
        <circle cx="16" cy="16" r="6" fill="#A61D24" />
      </svg>
      <span className="font-sans font-black text-xs tracking-tight text-amber-200 drop-shadow-sm">punjab national bank</span>
    </div>
  );
};

export const ChaseBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 32 32" fill="none">
        <polygon points="10,2 22,2 30,10 30,22 22,30 10,30 2,22 2,10" fill="#117ACA" />
        <rect x="10" y="10" width="12" height="12" fill="#FFFFFF" />
      </svg>
      <span className="font-sans font-black text-xs tracking-widest text-blue-100 uppercase drop-shadow-sm">CHASE</span>
    </div>
  );
};

export const BofaBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg className="h-5 w-6 shrink-0" viewBox="0 0 36 24" fill="none">
        <rect x="2" y="2" width="14" height="20" fill="#0067FF" />
        <rect x="20" y="2" width="14" height="20" fill="#E31837" />
        <path d="M5 6H13M5 12H13M5 18H13M23 6H31M23 12H31M23 18H31" stroke="#FFFFFF" strokeWidth="1.5" />
      </svg>
      <span className="font-sans font-black text-[11px] tracking-tight text-white uppercase drop-shadow-sm">BANK OF AMERICA</span>
    </div>
  );
};

export const CitiBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-sans font-black text-sm tracking-tight text-sky-100 relative drop-shadow-sm">
        citi
        <span className="absolute -top-1 left-2 w-5 h-2 border-t-2 border-red-500 rounded-t-full" />
      </span>
    </div>
  );
};

export const HsbcBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg className="h-4.5 w-6 shrink-0" viewBox="0 0 40 24" fill="none">
        <polygon points="4,2 20,12 4,22" fill="#DB0011" />
        <polygon points="36,2 20,12 36,22" fill="#DB0011" />
        <polygon points="4,2 20,12 36,2" fill="#FFFFFF" />
        <polygon points="4,22 20,12 36,22" fill="#FFFFFF" />
      </svg>
      <span className="font-sans font-black text-xs tracking-widest text-white uppercase drop-shadow-sm">HSBC</span>
    </div>
  );
};

export const BarclaysBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 32 32" fill="none">
        <path d="M16 4L22 10L28 6L24 18L16 28L8 18L4 6L10 10L16 4Z" fill="#00AEEF" />
      </svg>
      <span className="font-sans font-black text-xs tracking-wider text-cyan-200 uppercase drop-shadow-sm">BARCLAYS</span>
    </div>
  );
};

export const EmiratesNbdLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="15" fill="#0A2240" />
        <path d="M16 6L26 16L16 26L6 16L16 6Z" stroke="#C5A059" strokeWidth="2.5" fill="none" />
      </svg>
      <span className="font-sans font-black text-xs tracking-tight text-amber-200 drop-shadow-sm">Emirates NBD</span>
    </div>
  );
};

export const BoiBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '', size = 'md' }) => {
  const iconSize = size === 'xs' ? 'h-4 w-4' : size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  return (
    <div className={`inline-flex items-center gap-2 max-w-full ${className}`}>
      <svg className={`${iconSize} shrink-0`} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="4" fill="#F47920" />
        <path d="M16 4.5L19.2 12.2L27.5 13.1L21.3 18.5L23.1 26.6L16 22.4L8.9 26.6L10.7 18.5L4.5 13.1L12.8 12.2L16 4.5Z" fill="#FFFFFF" />
        <circle cx="16" cy="16.5" r="3.2" fill="#003580" />
      </svg>
      <div className="flex flex-col text-left leading-tight truncate">
        <span className="font-sans font-black text-xs tracking-wider text-slate-900 dark:text-white uppercase drop-shadow-xs truncate">
          Bank of India
        </span>
        <span className="text-[7.5px] text-amber-700 dark:text-amber-300 font-semibold tracking-tight truncate">
          Relationship beyond banking
        </span>
      </div>
    </div>
  );
};

export const CanaraBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-2 max-w-full ${className}`}>
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="4" fill="#0072BC" />
        <polygon points="16,6 26,24 6,24" fill="#FDB913" />
        <polygon points="16,11 23,23 9,23" fill="#0072BC" />
      </svg>
      <div className="flex flex-col text-left leading-tight truncate">
        <span className="font-sans font-black text-xs tracking-wider text-slate-900 dark:text-white uppercase truncate">
          Canara Bank
        </span>
      </div>
    </div>
  );
};

export const UnionBankLogo: React.FC<{ className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-2 max-w-full ${className}`}>
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="4" fill="#ED1C24" />
        <path d="M9 8H14V17C14 19 15 20 16 20C17 20 18 19 18 17V8H23V17C23 22 20 25 16 25C12 25 9 22 9 17V8Z" fill="#FFFFFF" />
      </svg>
      <div className="flex flex-col text-left leading-tight truncate">
        <span className="font-sans font-black text-xs tracking-wider text-slate-900 dark:text-white uppercase truncate">
          Union Bank of India
        </span>
      </div>
    </div>
  );
};

/**
 * Universal Bank Brand Header Resolver
 */
export const BankBrandLogoRenderer: React.FC<{
  bankCode?: string;
  bankName?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}> = ({ bankCode, bankName = '', className = '', size = 'md' }) => {
  const code = (bankCode || '').toLowerCase().trim();
  const name = (bankName || '').toLowerCase().trim();

  if (code === 'boi' || name.includes('bank of india') || code.includes('bkid') || name.includes('boi')) {
    return <BoiBankLogo className={className} size={size} />;
  }
  if (code === 'sbi' || name.includes('state bank of india') || name.includes('sbi') || code.includes('sbin')) {
    return <SbiBankLogo className={className} size={size} />;
  }
  if (code === 'hdfc' || name.includes('hdfc')) {
    return <HdfcBankLogo className={className} size={size} />;
  }
  if (code === 'icici' || name.includes('icici')) {
    return <IciciBankLogo className={className} size={size} />;
  }
  if (code === 'axis' || name.includes('axis') || code.includes('utib')) {
    return <AxisBankLogo className={className} size={size} />;
  }
  if (code === 'kotak' || name.includes('kotak') || code.includes('kkbk')) {
    return <KotakBankLogo className={className} size={size} />;
  }
  if (code === 'bob' || name.includes('baroda') || code.includes('barb')) {
    return <BobBankLogo className={className} size={size} />;
  }
  if (code === 'pnb' || name.includes('punjab national') || code.includes('punb')) {
    return <PnbBankLogo className={className} size={size} />;
  }
  if (code === 'canara' || name.includes('canara') || code.includes('cnrb')) {
    return <CanaraBankLogo className={className} size={size} />;
  }
  if (code === 'union' || name.includes('union bank') || code.includes('ubin')) {
    return <UnionBankLogo className={className} size={size} />;
  }
  if (code === 'chase' || name.includes('chase') || name.includes('jpmorgan')) {
    return <ChaseBankLogo className={className} size={size} />;
  }
  if (code === 'bofa' || name.includes('bank of america')) {
    return <BofaBankLogo className={className} size={size} />;
  }
  if (code === 'citi' || name.includes('citibank') || name.includes('citi')) {
    return <CitiBankLogo className={className} size={size} />;
  }
  if (code === 'hsbc' || name.includes('hsbc')) {
    return <HsbcBankLogo className={className} size={size} />;
  }
  if (code === 'barclays' || name.includes('barclays')) {
    return <BarclaysBankLogo className={className} size={size} />;
  }
  if (code === 'emiratesnbd' || name.includes('emirates nbd')) {
    return <EmiratesNbdLogo className={className} size={size} />;
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-800 text-white shadow-xs max-w-full ${className}`}>
      <span className="font-sans font-bold text-xs tracking-wider uppercase drop-shadow-xs truncate">
        {bankName || 'BANK WIRE SETTLEMENT'}
      </span>
    </div>
  );
};

export const CardBrandLogoRenderer: React.FC<{
  brand?: string;
  scheme?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | string;
  className?: string;
}> = ({ brand, scheme, size = 'md', className = '' }) => {
  const b = (brand || scheme || '').toLowerCase().trim();
  if (b.includes('visa')) return <VisaBrandLogo size={size} className={className} />;
  if (b.includes('mastercard') || b.includes('master')) return <MastercardBrandLogo size={size} className={className} />;
  if (b.includes('amex') || b.includes('american')) return <AmexBrandLogo size={size} className={className} />;
  if (b.includes('discover')) return <DiscoverBrandLogo size={size} className={className} />;
  if (b.includes('rupay')) return <RupayBrandLogo size={size} className={className} />;
  if (b.includes('upi')) return <UpiLogo size={size} className={className} />;

  return (
    <div className={`font-mono text-xs font-black uppercase tracking-wider text-teal-300 bg-black/50 px-2 py-0.5 rounded border border-teal-500/30 ${className}`}>
      {brand || scheme || 'CARD'}
    </div>
  );
};

/**
 * Universal Payment Gateway Brand Resolver
 */
export const GatewayLogoRenderer: React.FC<{
  gatewayKey: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fallbackText?: string;
  bankName?: string;
}> = ({ gatewayKey, className = '', size = 'md', fallbackText, bankName }) => {
  const key = (gatewayKey || '').toLowerCase().trim();

  if (key === 'razorpay') {
    return <RazorpayLogo className={className} size={size} />;
  }
  if (key === 'stripe') {
    return <StripeLogo className={className} size={size} />;
  }
  if (key === 'cashfree') {
    return <CashfreeLogo className={className} size={size} />;
  }
  if (key === 'paypal') {
    return <PayPalLogo className={className} size={size} />;
  }
  if (key === 'phonepe') {
    return <PhonePeLogo className={className} size={size} />;
  }
  if (key === 'paytm') {
    return <PaytmLogo className={className} size={size} />;
  }
  if (key === 'authorizenet' || key === 'authorize.net') {
    return <AuthorizeNetLogo className={className} size={size} />;
  }
  if (key === 'square') {
    return <SquareLogo className={className} size={size} />;
  }
  if (key === 'paddle') {
    return <PaddleLogo className={className} size={size} />;
  }
  if (key === 'crypto' || key === 'coinbase') {
    return <CoinbaseCryptoLogo className={className} size={size} />;
  }
  if (key === 'flutterwave') {
    return <FlutterwaveLogo className={className} size={size} />;
  }
  if (key === 'adyen') {
    return <AdyenLogo className={className} size={size} />;
  }
  if (key === 'mercadopago' || key === 'mercado_pago') {
    return <MercadoPagoLogo className={className} size={size} />;
  }
  if (key === 'klarna') {
    return <KlarnaLogo className={className} size={size} />;
  }
  if (key === 'mollie') {
    return <MollieLogo className={className} size={size} />;
  }
  if (key === 'skrill') {
    return <SkrillLogo className={className} size={size} />;
  }
  if (key === 'alipay' || key === 'wechat') {
    return <AlipayLogo className={className} size={size} />;
  }
  if (key === 'bank_transfer' || key === 'bank_wire' || key === 'neft' || key === 'wire') {
    if (bankName) {
      return <BankBrandLogoRenderer bankName={bankName} className={className} size={size} />;
    }
    return <BankTransferLogo className={className} size={size} />;
  }
  if (key === 'upi') {
    return <UpiLogo className={className} size={size} />;
  }
  if (key === 'card' || key === 'cards' || key === 'credit_card') {
    return <CardBrandsLogo className={className} size={size} />;
  }
  if (key === 'apple_pay' || key === 'applepay' || key === 'apple') {
    return <ApplePayLogo className={className} size={size} />;
  }
  if (key === 'google_pay' || key === 'googlepay' || key === 'gpay') {
    return <GooglePayLogo className={className} size={size} />;
  }
  if (key === 'link' || key === 'stripe_link') {
    return <StripeLinkLogo className={className} size={size} />;
  }
  if (key === 'cashapp' || key === 'cash_app') {
    return <CashAppLogo className={className} size={size} />;
  }
  if (key === 'afterpay' || key === 'clearpay') {
    return <AfterpayLogo className={className} size={size} />;
  }

  return (
    <span className={`font-mono text-xs font-bold text-zinc-700 dark:text-zinc-200 truncate ${className}`}>
      {fallbackText || gatewayKey.toUpperCase()}
    </span>
  );
};

export default GatewayLogoRenderer;
