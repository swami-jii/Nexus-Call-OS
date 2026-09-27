import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  Zap,
  Sparkles,
  Crown,
  Layers,
  ShieldCheck,
  Radio,
  PhoneCall,
  Bot,
  HardDrive,
  Smartphone,
  Server,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Table2,
  Sliders,
  Terminal,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import { SubscriptionPlan, BillingCurrencyOption } from '../../types';

export interface SubscriptionPlansTabProps {
  plans: SubscriptionPlan[];
  currency: BillingCurrencyOption;
  currentPlanId?: string;
  isSuperAdmin?: boolean;
  onSelectPlan: (plan: SubscriptionPlan, billingCycle: 'monthly' | 'yearly' | 'lifetime') => void;
}

export const SubscriptionPlansTab: React.FC<SubscriptionPlansTabProps> = ({
  plans,
  currency,
  currentPlanId = 'pro',
  isSuperAdmin: isSuperAdminProp,
  onSelectPlan,
}) => {
  const { user } = useAuth();
  const isSuperAdmin = Boolean(
    isSuperAdminProp ||
    (user as any)?.role === 'super_admin' ||
    (user as any)?.role === 'superadmin' ||
    user?.email === 'admin@createcall.ai'
  );

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [isMatrixExpanded, setIsMatrixExpanded] = useState<boolean>(true);
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);

  // Selected Plan in Matrix ('all' for full table, or 'starter' | 'pro' | 'business' | 'enterprise')
  const [selectedMatrixPlanKey, setSelectedMatrixPlanKey] = useState<
    'starter' | 'pro' | 'business' | 'enterprise' | 'all'
  >('pro');

  // Custom Dropdown Open State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  // Close custom dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to map plan to normalized key
  const getPlanKey = (plan: SubscriptionPlan): 'starter' | 'pro' | 'business' | 'enterprise' => {
    const idOrKey = (plan.plan_key || plan.id || '').toLowerCase();
    const name = (plan.name || '').toLowerCase();
    if (idOrKey.includes('starter') || name.includes('starter') || name.includes('trial')) return 'starter';
    if (idOrKey.includes('business') || name.includes('business')) return 'business';
    if (
      idOrKey.includes('enterprise') ||
      idOrKey.includes('vip') ||
      name.includes('vip') ||
      name.includes('sovereign') ||
      name.includes('enterprise')
    ) {
      return 'enterprise';
    }
    return 'pro';
  };

  // Find plan by key
  const getPlanByKey = (key: 'starter' | 'pro' | 'business' | 'enterprise') => {
    return (
      plans.find((p) => getPlanKey(p) === key) ||
      (key === 'pro' ? plans.find((p) => p.popular) : undefined) ||
      plans[0]
    );
  };

  // Scroll to matrix and select plan
  const handleFocusPlanInMatrix = (
    key: 'starter' | 'pro' | 'business' | 'enterprise',
    scroll: boolean = true
  ) => {
    setSelectedMatrixPlanKey(key);
    setIsMatrixExpanded(true);
    if (scroll && matrixRef.current) {
      matrixRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Calculate pricing based on chosen billing cycle
  const getPrice = (plan: SubscriptionPlan) => {
    let usd = plan.monthlyPrice;
    if (billingCycle === 'yearly') {
      usd = plan.yearlyPrice ?? Math.round(plan.monthlyPrice * 0.8);
    } else if (billingCycle === 'lifetime') {
      usd = plan.lifetimePrice ?? plan.monthlyPrice * 10;
    }
    const local = Math.round(usd * (currency.rate || 1));
    return { usd, local };
  };

  // Dynamic annual savings in USD and Local Currency
  const getYearlySavings = (plan: SubscriptionPlan) => {
    const monthlyRate = plan.monthlyPrice || 0;
    const yearlyRate = plan.yearlyPrice || Math.round(monthlyRate * 0.8);
    const savedAnnualUsd = (monthlyRate - yearlyRate) * 12;
    const savedAnnualLocal = Math.round(savedAnnualUsd * (currency.rate || 1));
    return { savedAnnualUsd, savedAnnualLocal };
  };

  // Dynamic cycle minutes calculation (+10% bonus for annual, lifetime quota for lifetime)
  const getDynamicMinutes = (plan: SubscriptionPlan) => {
    const base = plan.includedMinutes || 0;
    if (billingCycle === 'yearly') {
      const bonusMins = Math.round(base * 1.1);
      return `${bonusMins.toLocaleString()} Mins (+10%)`;
    }
    if (billingCycle === 'lifetime') {
      return `${base.toLocaleString()} Mins / mo`;
    }
    return `${base.toLocaleString()} Mins / mo`;
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="p-10 text-center space-y-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Layers className="h-9 w-9 text-zinc-300 dark:text-zinc-600 mx-auto" />
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No Public Plans Available</h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
          Subscription plans are configured by the Super Admin. Please contact workspace support for assistance.
        </p>
      </div>
    );
  }

  // Master Telephony Comparison Matrix Specifications
  const comparisonRows = [
    {
      category: 'Voice Telephony & SIP Trunks',
      icon: PhoneCall,
      features: [
        {
          name: 'Monthly Included Voice Minutes',
          desc: 'Carrier-grade inbound & outbound AI voice calling minutes.',
          values: {
            starter: billingCycle === 'yearly' ? '550 Mins/mo' : '500 Mins/mo',
            pro: billingCycle === 'yearly' ? '3,300 Mins/mo' : '3,000 Mins/mo',
            business: billingCycle === 'yearly' ? '11,000 Mins/mo' : '10,000 Mins/mo',
            enterprise: billingCycle === 'yearly' ? '55,000 Mins/mo' : '50,000 Mins/mo',
          },
        },
        {
          name: 'Concurrent Active Line Trunks',
          desc: 'Simultaneous in-flight phone calls without queue bottlenecks.',
          values: {
            starter: '2 Channels',
            pro: '10 Channels',
            business: '30 Channels',
            enterprise: '100 Channels (Burst to 150)',
          },
        },
        {
          name: 'Overage Telephony Rate',
          desc: 'Per-minute billing rate when monthly quota completes.',
          values: {
            starter: '$0.08 / min',
            pro: '$0.06 / min',
            business: '$0.045 / min',
            enterprise: '$0.035 / min',
          },
        },
        {
          name: 'Switch & Audio Latency SLA',
          desc: 'WebRTC & Opus 48kHz audio pipeline response time.',
          values: {
            starter: '< 250ms',
            pro: '< 120ms Sub-second',
            business: '< 90ms Ultra-low',
            enterprise: '< 60ms Bare-metal',
          },
        },
      ],
    },
    {
      category: 'AI Voice Intelligence & Vector DB',
      icon: Bot,
      features: [
        {
          name: 'Enterprise RAG Memory Storage',
          desc: 'PostgreSQL Vector embeddings & knowledge documents for agent context.',
          values: {
            starter: '200 MB',
            pro: '500 MB',
            business: '2,000 MB (2 GB)',
            enterprise: '10,000 MB (10 GB)',
          },
        },
        {
          name: 'Maximum Active AI Voice Agents',
          desc: 'Custom bots with specialized prompts, voices, and workflow logic.',
          values: {
            starter: '2 Agents',
            pro: '10 Agents',
            business: '35 Agents',
            enterprise: 'Unlimited Agents',
          },
        },
        {
          name: 'Studio Voice Cloning & Fine-Tuning',
          desc: 'Clone custom human voices and fine-tune pronunciation models.',
          values: {
            starter: false,
            pro: true,
            business: true,
            enterprise: 'Unlimited Studio Clones',
          },
        },
        {
          name: 'Multi-turn Memory Persistence',
          desc: 'Realtime caller recall and conversational sentiment analysis.',
          values: {
            starter: 'Basic (7 Days)',
            pro: 'Advanced (90 Days)',
            business: 'Enterprise (1 Year)',
            enterprise: 'Permanent Sovereign Vault',
          },
        },
      ],
    },
    {
      category: 'Carrier Hardware & Integrations',
      icon: Smartphone,
      features: [
        {
          name: 'Android GSM Multi-SIM Gateway',
          desc: 'Pair physical SIM cards via Android Companion APK for local carrier rates.',
          values: {
            starter: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          name: 'Twilio / Telnyx SIP Direct Trunks',
          desc: 'Bring your own carrier trunks or use platform pre-provisioned DIDs.',
          values: {
            starter: 'Pre-provisioned Only',
            pro: 'BYOT + Pre-provisioned',
            business: 'Multi-carrier Failover',
            enterprise: 'Dedicated Carrier Interconnect',
          },
        },
        {
          name: 'Realtime Webhooks & REST API',
          desc: 'Stream live call transcripts, events, and sentiment webhooks.',
          values: {
            starter: false,
            pro: '100 req/sec',
            business: '500 req/sec',
            enterprise: 'Unlimited High-Throughput',
          },
        },
      ],
    },
    {
      category: 'Realtime Terminal Logs & Telemetry Debugger',
      icon: Terminal,
      features: [
        {
          name: 'Live Realtime Execution Terminal',
          desc: 'Live streaming WebSocket telemetry logs, audio decoding, and RAG traces.',
          values: {
            starter: '50 Lines Buffer',
            pro: '500 Lines Buffer',
            business: '1,500 Lines Buffer',
            enterprise: 'Unlimited Buffer Traces',
          },
        },
        {
          name: 'Log File Export (.log / CSV)',
          desc: 'Download system diagnostic files for offline analysis and auditing.',
          values: {
            starter: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          name: 'Deep Telemetry & Raw SIP Traces',
          desc: 'Inspect raw WebRTC packets, SIP status codes, GSM gateway payloads, and TTFT latency.',
          values: {
            starter: 'Basic Level',
            pro: 'Detailed Telemetry',
            business: 'Full Sub-system Traces',
            enterprise: 'Raw Carrier Dumps & Webhooks',
          },
        },
        {
          name: 'Log Retention Window',
          desc: 'Historic log trace search and server buffer memory retention.',
          values: {
            starter: 'Session Only',
            pro: '15 Days History',
            business: '30 Days History',
            enterprise: '90 Days / Sovereign Vault',
          },
        },
      ],
    },
    {
      category: 'Platform Security & Support SLA',
      icon: ShieldCheck,
      features: [
        {
          name: 'Guaranteed SLA Uptime',
          desc: 'Contractually backed carrier and platform availability uptime.',
          values: {
            starter: '99.5% Standard',
            pro: '99.9% Production',
            business: '99.95% Mission Critical',
            enterprise: '99.99% Sovereign VIP',
          },
        },
        {
          name: 'Automated Tax Compliance Receipts',
          desc: 'GST/VAT registered downloadable PDF invoices and ledger exports.',
          values: {
            starter: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          name: 'Dedicated Solutions Architect',
          desc: '1-on-1 telephony engineer for prompt optimization and trunk routing.',
          values: {
            starter: false,
            pro: 'Email / Community',
            business: 'Priority Slack Channel',
            enterprise: 'Dedicated 24/7 Phone & TAM',
          },
        },
      ],
    },
  ];

  // Plan selector dropdown options
  const planSelectorOptions: {
    key: 'starter' | 'pro' | 'business' | 'enterprise' | 'all';
    label: string;
    icon: any;
    badge?: string;
  }[] = [
    { key: 'starter', label: 'Starter Trial', icon: Zap, badge: 'Trial' },
    { key: 'pro', label: 'Pro Scale Plan', icon: Sparkles, badge: '⭐ Popular' },
    { key: 'business', label: 'Business Enterprise', icon: Layers, badge: 'Growth' },
    { key: 'enterprise', label: 'Ultimate Sovereign VIP', icon: Server, badge: '👑 VIP' },
    { key: 'all', label: 'Compare All Plans (Side-by-Side Table)', icon: Table2, badge: 'Full Matrix' },
  ];

  // Selected Option Info for Dropdown Trigger
  const activeDropdownOption =
    planSelectorOptions.find((opt) => opt.key === selectedMatrixPlanKey) || planSelectorOptions[1];
  const DropdownTriggerIcon = activeDropdownOption.icon;

  // Subscription FAQ Questions
  const faqs = [
    {
      q: 'How does the Annual Billing 20% discount and +10% bonus minutes work?',
      a: 'When choosing Annual Billing, your subscription is billed annually at a 20% reduced rate, and you receive an extra 10% bonus voice minutes credited to your quota every single month of your annual cycle.',
    },
    {
      q: 'What happens if my voice minutes run out before the end of the billing cycle?',
      a: 'Your live calls will never drop abruptly. If your prepaid carrier wallet has funds, Create Call OS seamlessly falls back to your wallet at the discounted overage rate. You can also upgrade your plan or top up anytime.',
    },
    {
      q: 'What is the Lifetime License entitlement?',
      a: 'A Lifetime License is a one-time investment that grants permanent ownership of Create Call OS capabilities with zero recurring monthly subscription fees forever. You receive perpetual updates, GSM gateway unlocking, and monthly quota allowances renewed in perpetuity.',
    },
    {
      q: 'Can I change or upgrade my plan at any time?',
      a: 'Yes, absolutely! Plan upgrades take effect instantly with prorated credit applied to your new tier. All your RAG memory documents, AI agents, and call logs are seamlessly retained.',
    },
  ];

  const activeFocusedPlan =
    selectedMatrixPlanKey !== 'all' ? getPlanByKey(selectedMatrixPlanKey) : null;

  return (
    <div className="space-y-7">
      {/* ============================================================ */}
      {/* 1. HERO HEADER & BILLING CYCLE SELECTOR                      */}
      {/* ============================================================ */}
      <div className="text-center space-y-3.5 max-w-3xl mx-auto pt-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-500/10 dark:bg-teal-950/40 border border-teal-500/20 text-xs font-semibold text-teal-800 dark:text-teal-300">
          <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          <span>Transparent Telephony Tiers • Zero Hidden Overage Fees</span>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
          Subscription Plans &amp; Telephony Tiers
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Scale your voice AI telephony infrastructure with high-throughput SIP trunks, Android GSM nodes, and sub-second agent intelligence.
        </p>

        {/* Dynamic Billing Cycle Selector Tabs */}
        <div className="inline-flex p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 shadow-xs">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs ring-1 ring-zinc-200/50 dark:ring-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              billingCycle === 'yearly'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs ring-1 ring-zinc-200/50 dark:ring-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-extrabold bg-emerald-500 text-white shadow-2xs">
              SAVE 20% + 10% MINS
            </span>
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('lifetime')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              billingCycle === 'lifetime'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs ring-1 ring-zinc-200/50 dark:ring-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500 inline" />
            <span>Lifetime License</span>
            <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
              ONE-TIME
            </span>
          </button>
        </div>

        {/* Dynamic Billing Cycle Highlight Banner */}
        {billingCycle === 'yearly' && (
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-2.5 max-w-xl mx-auto animate-fadeIn">
            🎉 Annual Billing Active: Pay 20% less per month and receive <strong>+10% Bonus Voice Minutes</strong> automatically applied every billing cycle!
          </div>
        )}
        {billingCycle === 'lifetime' && (
          <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-lg p-2.5 max-w-xl mx-auto animate-fadeIn">
            👑 Lifetime Ownership: One-time payment with zero subscription renewals forever. Permanent multi-SIM unlocks and VIP priority routing included.
          </div>
        )}

        {/* Super Admin Sovereign Status Strip */}
        {isSuperAdmin && (
          <div className="p-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 dark:from-amber-950/40 dark:via-purple-950/40 dark:to-indigo-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs max-w-4xl mx-auto text-left animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <div className="font-black text-amber-950 dark:text-amber-200 text-sm flex items-center gap-2">
                  <span>👑 Sovereign Master Root License Active</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white font-mono uppercase">
                    Platform Root Owner
                  </span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-300 mt-0.5 text-xs leading-relaxed">
                  You are authenticated as the <strong>Sovereign Platform Owner</strong>. Your master instance operates with permanent lifetime unrestricted access ($0 / Lifetime) across all AI voice telephony minutes, unmetered concurrent SIP trunks, vector DB storage, and unlimited AI bots. The pricing tiers below configure public subscriber plans.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. DYNAMIC 4-TIER SUBSCRIPTION CARDS GRID (SELECTABLE)        */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const { local, usd } = getPrice(plan);
          const { savedAnnualLocal } = getYearlySavings(plan);
          const dynamicMinutes = getDynamicMinutes(plan);
          const planKey = getPlanKey(plan);

          const isCurrent =
            plan.id === currentPlanId ||
            (plan as any).plan_key === currentPlanId ||
            plan.name.toLowerCase() === currentPlanId.toLowerCase();
          const isPopular = plan.popular;

          // Check if this card is actively selected in matrix focus
          const isCardSelected = selectedMatrixPlanKey === planKey;

          // Details metadata from Plan Master Studio
          const dt = (plan as any).details_json || {};
          const customCtaBg = plan.cta_bg_color || dt.cta_bg_color;
          const customCtaTextColor = plan.cta_text_color || dt.cta_text_color;
          const customCtaLabel = plan.cta_text || dt.cta_text;
          const customBadgeText = plan.badge_text || dt.badge_text;
          const customBadgeColor = plan.badge_color || dt.badge_color;

          return (
            <Card
              key={plan.id || (plan as any).plan_key}
              onClick={() => handleFocusPlanInMatrix(planKey, false)}
              className={`relative rounded-xl flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                isCardSelected
                  ? 'border-2 border-teal-600 dark:border-teal-400 ring-2 ring-teal-500/20 shadow-md bg-teal-50/[0.04] dark:bg-teal-950/[0.15]'
                  : isPopular
                  ? 'border-2 border-teal-500/70 dark:border-teal-500/50 bg-white dark:bg-zinc-900 shadow-xs hover:border-teal-500 hover:shadow-sm'
                  : 'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {/* Top Tag / Selected Indicator */}
              {isCardSelected ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-sm text-[10px] bg-teal-700 text-white whitespace-nowrap flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Selected View
                  </span>
                </div>
              ) : customBadgeText ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className={`font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-sm text-[10px] whitespace-nowrap flex items-center gap-1 ${
                    customBadgeColor === 'emerald' ? 'bg-emerald-600 text-white' :
                    customBadgeColor === 'blue' ? 'bg-blue-600 text-white' :
                    customBadgeColor === 'purple' ? 'bg-purple-600 text-white' :
                    customBadgeColor === 'amber' ? 'bg-amber-500 text-black font-extrabold' :
                    customBadgeColor === 'rose' ? 'bg-rose-600 text-white' :
                    customBadgeColor === 'gradient' ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500 text-white shadow-sm' :
                    'bg-teal-600 text-white'
                  }`}>
                    {customBadgeText}
                  </span>
                </div>
              ) : isPopular ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-sm text-[10px] bg-teal-600 text-white whitespace-nowrap">
                    ⭐ Most Popular Choice
                  </span>
                </div>
              ) : null}

              {/* Card Header & Plan Name */}
              <CardHeader className="p-4 sm:p-5 pb-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-black text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
                    {plan.name}
                  </h3>
                  {isCurrent && (
                    <Badge variant="emerald" size="xs" className="font-bold font-mono rounded-md text-[10px] uppercase shrink-0">
                      Current
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed min-h-[36px]">
                  {plan.tagline}
                </p>

                {/* Price Display */}
                <div className="pt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
                      {currency.symbol}{local.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 font-sans">
                      {billingCycle === 'lifetime'
                        ? '/one-time'
                        : billingCycle === 'yearly'
                        ? '/mo'
                        : '/mo'}
                    </span>
                  </div>

                  {/* Sub-price billing notice */}
                  <div className="text-[11px] font-mono text-zinc-400 mt-1 min-h-[16px]">
                    {billingCycle === 'yearly' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Billed as {currency.symbol}{(local * 12).toLocaleString()}/yr (Save {currency.symbol}{savedAnnualLocal.toLocaleString()})
                      </span>
                    ) : billingCycle === 'lifetime' ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        One-Time • Lifetime Access
                      </span>
                    ) : (
                      <span>Billed monthly in {currency.code}</span>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Card Content & Limits */}
              <CardContent className="p-4 sm:p-5 pt-0 space-y-4 flex-1 flex flex-col justify-between">
                {/* Custom HTML banner if injected */}
                {plan.custom_html && (
                  <div
                    className="text-xs"
                    dangerouslySetInnerHTML={{ __html: plan.custom_html }}
                  />
                )}

                {/* Core Resource Metrics */}
                <div className="space-y-2 py-3 border-y border-zinc-100 dark:border-zinc-800 text-[11px] sm:text-xs">
                  <div className="flex items-center justify-between font-semibold gap-1">
                    <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                      <PhoneCall className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      {dt.voice_minutes_label || 'Voice Minutes:'}
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold text-right shrink-0 whitespace-nowrap">
                      {dynamicMinutes}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-semibold gap-1">
                    <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                      <Radio className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      {dt.concurrency_label || 'Live Concurrency:'}
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold shrink-0 whitespace-nowrap">
                      {plan.concurrencyLimit} Channels
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-semibold gap-1">
                    <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                      <HardDrive className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      {dt.rag_label || 'RAG Vector DB:'}
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold shrink-0 whitespace-nowrap">
                      {plan.ragStorageMb ? `${plan.ragStorageMb.toLocaleString()} MB Storage` : '200 MB Storage'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-semibold gap-1">
                    <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                      <Bot className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                      {dt.bots_label || 'AI Voice Bots:'}
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold shrink-0 whitespace-nowrap">
                      {plan.maxAgentsCount ? `${plan.maxAgentsCount} Bots` : 'Unlimited'}
                    </span>
                  </div>
                </div>

                {/* Capability Hardware Badges */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Carrier &amp; Platform Capabilities
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Android GSM Gateway</span>
                      {plan.gsmSimEnabled ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <CheckCircle2 className="h-3 w-3 shrink-0" /> {dt.gsm_label || 'Included'}
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-medium flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <X className="h-3 w-3 shrink-0" /> {dt.gsm_label || 'Not Included'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <span className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Custom Voice Cloning</span>
                      {plan.voiceCloningEnabled ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <CheckCircle2 className="h-3 w-3 shrink-0" /> {dt.voice_cloning_label || 'Studio Grade'}
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-medium flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <X className="h-3 w-3 shrink-0" /> {dt.voice_cloning_label || 'Basic TTS'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <span className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Webhooks &amp; REST API</span>
                      {plan.webhookApiEnabled ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <CheckCircle2 className="h-3 w-3 shrink-0" /> {dt.webhook_label || 'Enterprise'}
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-medium flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <X className="h-3 w-3 shrink-0" /> {dt.webhook_label || 'Not Included'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <span className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap">SLA Guarantee</span>
                      <span className="text-teal-700 dark:text-teal-300 font-bold shrink-0 whitespace-nowrap">
                        {dt.sla_label || (plan.prioritySlaEnabled ? '99.99% Priority' : '99.5% Standard')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features Checklist */}
                <div className="space-y-1.5 flex-1 pt-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Included Entitlements
                  </div>
                  {plan.features?.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action CTA & Matrix Spec Link */}
                <div className="pt-3 space-y-2">
                  {isSuperAdmin ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlan(plan, billingCycle);
                      }}
                      className="w-full font-bold text-xs rounded-lg shadow-xs cursor-pointer active:scale-95 transition-all border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 inline shrink-0" />
                        <span>Preview Tenant Checkout</span>
                      </span>
                    </Button>
                  ) : (
                    <Button
                      variant={isPopular ? 'primary' : 'outline'}
                      size="sm"
                      disabled={isCurrent && billingCycle === 'monthly'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlan(plan, billingCycle);
                      }}
                      style={{
                        backgroundColor: customCtaBg || undefined,
                        color: customCtaTextColor || undefined,
                        borderColor: customCtaBg || undefined,
                      }}
                      className={`w-full font-bold text-xs rounded-lg shadow-xs cursor-pointer active:scale-95 transition-all ${
                        !customCtaBg && (isPopular
                          ? 'bg-teal-600 hover:bg-teal-700 border-teal-600 text-white'
                          : 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800')
                      }`}
                    >
                      {isCurrent ? (
                        'Current Active Tier'
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 inline" /> {customCtaLabel || `Select ${plan.name}`}
                        </span>
                      )}
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFocusPlanInMatrix(planKey, true);
                    }}
                    className={`w-full text-center text-[11px] font-bold py-1 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      isCardSelected
                        ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400'
                    }`}
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>{isCardSelected ? 'Detailed Specs Active Below ▾' : 'Explore Full Technical Specs ▾'}</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* 3. FULL TELEPHONY SPECIFICATIONS COMPARISON MATRIX            */}
      {/* ============================================================ */}
      <div
        ref={matrixRef}
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden scroll-mt-6"
      >
        {/* Matrix Header Banner */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-850/40">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Detailed Telephony &amp; AI Capability Comparison Matrix
                </h3>
                <Badge variant="teal" size="xs" className="text-[10px] font-bold rounded-md">
                  Interactive Deep Dive
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Select any individual plan from the selector box below to view its complete technical breakdown.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={() => setIsMatrixExpanded((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-2xs"
            >
              <span>{isMatrixExpanded ? 'Collapse Matrix' : 'Expand Matrix'}</span>
              {isMatrixExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {isMatrixExpanded && (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Dedicated Single Plan Selector Control Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3.5 rounded-lg bg-zinc-50/80 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-700/70 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 shrink-0">
                  <Sliders className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span>Active Specification View:</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-teal-100/90 dark:bg-teal-950/80 text-teal-900 dark:text-teal-200 border border-teal-300/60 dark:border-teal-800/60">
                      {activeDropdownOption.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Switch between individual tier deep dives or side-by-side comparison using the dropdown.
                  </p>
                </div>
              </div>

              {/* Premium Custom Dropdown Selector */}
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="w-full sm:w-auto flex items-center justify-between gap-3 px-3.5 py-2 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 hover:border-teal-500 shadow-2xs transition-all cursor-pointer min-w-[240px]"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <DropdownTriggerIcon className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="truncate">{activeDropdownOption.label}</span>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180 text-teal-600' : ''
                    }`}
                  />
                </button>

                {/* Custom Dropdown Popup Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-72 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl z-30 py-1.5 animate-fadeIn">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                      Select Plan or Comparison Mode
                    </div>
                    {planSelectorOptions.map((opt) => {
                      const isSelected = selectedMatrixPlanKey === opt.key;
                      const IconComp = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setSelectedMatrixPlanKey(opt.key);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 font-bold'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <IconComp
                              className={`h-4 w-4 shrink-0 ${
                                isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-400'
                              }`}
                            />
                            <span className="truncate">{opt.label}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {opt.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                {opt.badge}
                              </span>
                            )}
                            {isSelected && <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* A. SINGLE PLAN FOCUSED DETAIL VIEW (When plan selected)   */}
            {/* ========================================================= */}
            {selectedMatrixPlanKey !== 'all' && activeFocusedPlan && (
              <div className="space-y-5 animate-fadeIn">
                {/* Plan Overview Hero Header Card */}
                {(() => {
                  const { local } = getPrice(activeFocusedPlan);
                  const dynamicMins = getDynamicMinutes(activeFocusedPlan);
                  const isCurrent =
                    activeFocusedPlan.id === currentPlanId ||
                    (activeFocusedPlan as any).plan_key === currentPlanId ||
                    activeFocusedPlan.name.toLowerCase() === currentPlanId.toLowerCase();

                  return (
                    <div className="rounded-lg bg-gradient-to-br from-teal-500/10 via-zinc-50 dark:via-zinc-850 to-white dark:to-zinc-900 border border-teal-500/40 p-4 sm:p-5 shadow-xs">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                              {activeFocusedPlan.name}
                            </span>
                            {activeFocusedPlan.popular && (
                              <Badge variant="teal" size="xs" className="font-extrabold uppercase text-[10px] rounded-md">
                                ⭐ Most Popular Tier
                              </Badge>
                            )}
                            {isCurrent && (
                              <Badge variant="emerald" size="xs" className="font-extrabold uppercase text-[10px] rounded-md">
                                Active Current Tier
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-2xl">
                            {activeFocusedPlan.tagline}
                          </p>

                          {/* Quick Spec Highlights Badges */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/60 border border-teal-500/20 text-xs font-bold text-teal-800 dark:text-teal-300">
                              <PhoneCall className="h-3.5 w-3.5" />
                              <span>{dynamicMins}</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                              <Radio className="h-3.5 w-3.5" />
                              <span>{activeFocusedPlan.concurrencyLimit} Channels</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-500/20 text-xs font-bold text-indigo-800 dark:text-indigo-300">
                              <HardDrive className="h-3.5 w-3.5" />
                              <span>{activeFocusedPlan.ragStorageMb ? `${activeFocusedPlan.ragStorageMb} MB Vector DB` : '200 MB Vector DB'}</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-500/20 text-xs font-bold text-purple-800 dark:text-purple-300">
                              <Bot className="h-3.5 w-3.5" />
                              <span>{activeFocusedPlan.maxAgentsCount ? `${activeFocusedPlan.maxAgentsCount} AI Voice Bots` : 'Unlimited AI Bots'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Action CTA */}
                        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 bg-white dark:bg-zinc-900/80 p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                              {billingCycle === 'lifetime' ? 'One-Time Payment' : 'Plan Investment'}
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 font-mono">
                                {currency.symbol}{local.toLocaleString()}
                              </span>
                              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                {billingCycle === 'lifetime' ? '/one-time' : '/mo'}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isCurrent && billingCycle === 'monthly'}
                            onClick={() => onSelectPlan(activeFocusedPlan, billingCycle)}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
                            leftIcon={<Zap className="h-3.5 w-3.5" />}
                          >
                            {isCurrent ? 'Current Active Tier' : `Select ${activeFocusedPlan.name}`}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Categorized Specifications Grid (Showing only this plan's parameters) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {comparisonRows.map((cat, catIdx) => {
                    const CatIcon = cat.icon || Layers;
                    return (
                      <div
                        key={catIdx}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 space-y-4 shadow-xs"
                      >
                        <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                          <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 shrink-0 shadow-2xs">
                            <CatIcon className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                              {cat.category}
                            </h4>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                              Carrier &amp; Platform Technical Specifications
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {cat.features.map((feat, featIdx) => {
                            const val = (feat.values as any)[selectedMatrixPlanKey];
                            const isBool = typeof val === 'boolean';

                            return (
                              <div
                                key={featIdx}
                                className="flex items-start justify-between gap-3 p-2.5 rounded-md bg-zinc-50/70 dark:bg-zinc-850/50 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 transition-colors"
                              >
                                <div className="space-y-0.5">
                                  <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                                    <span>{feat.name}</span>
                                  </div>
                                  <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-snug pl-5">
                                    {feat.desc}
                                  </p>
                                </div>

                                <div className="shrink-0 pt-0.5">
                                  {isBool ? (
                                    val ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                        <Check className="h-3.5 w-3.5" /> Included
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                        <X className="h-3.5 w-3.5" /> Not Included
                                      </span>
                                    )
                                  ) : (
                                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                                      {val}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* B. FULL 4-TIER SIDE-BY-SIDE MATRIX TABLE (When 'all')     */}
            {/* ========================================================= */}
            {selectedMatrixPlanKey === 'all' && (
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 animate-fadeIn">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-850/70 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                      <th className="p-3.5 pl-5 font-bold w-1/3">Feature / Capability</th>
                      <th className="p-3.5 font-bold text-center">
                        <div className="space-y-0.5">
                          <div>Starter Trial</div>
                          <button
                            type="button"
                            onClick={() => setSelectedMatrixPlanKey('starter')}
                            className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold hover:underline cursor-pointer"
                          >
                            Focus ↗
                          </button>
                        </div>
                      </th>
                      <th className="p-3.5 font-bold text-center text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20">
                        <div className="space-y-0.5">
                          <div>⭐ Pro Scale Plan</div>
                          <button
                            type="button"
                            onClick={() => setSelectedMatrixPlanKey('pro')}
                            className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold hover:underline cursor-pointer"
                          >
                            Focus ↗
                          </button>
                        </div>
                      </th>
                      <th className="p-3.5 font-bold text-center">
                        <div className="space-y-0.5">
                          <div>Business Enterprise</div>
                          <button
                            type="button"
                            onClick={() => setSelectedMatrixPlanKey('business')}
                            className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold hover:underline cursor-pointer"
                          >
                            Focus ↗
                          </button>
                        </div>
                      </th>
                      <th className="p-3.5 pr-5 font-bold text-center">
                        <div className="space-y-0.5">
                          <div>Ultimate VIP</div>
                          <button
                            type="button"
                            onClick={() => setSelectedMatrixPlanKey('enterprise')}
                            className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold hover:underline cursor-pointer"
                          >
                            Focus ↗
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {comparisonRows.map((cat, catIdx) => (
                      <React.Fragment key={catIdx}>
                        <tr className="bg-zinc-100/70 dark:bg-zinc-800/40">
                          <td
                            colSpan={5}
                            className="py-2 px-5 font-extrabold uppercase tracking-wider text-[11px] text-zinc-600 dark:text-zinc-300"
                          >
                            {cat.category}
                          </td>
                        </tr>
                        {cat.features.map((feat, featIdx) => (
                          <tr
                            key={featIdx}
                            className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/20 transition-colors"
                          >
                            <td className="p-3.5 pl-5 space-y-0.5">
                              <div className="font-bold text-zinc-900 dark:text-zinc-100">{feat.name}</div>
                              <div className="text-[11px] text-zinc-400 leading-snug">{feat.desc}</div>
                            </td>

                            {/* Starter */}
                            <td className="p-3.5 text-center font-mono text-zinc-700 dark:text-zinc-300">
                              {typeof feat.values.starter === 'boolean' ? (
                                feat.values.starter ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-zinc-300 dark:text-zinc-600 mx-auto" />
                                )
                              ) : (
                                feat.values.starter
                              )}
                            </td>

                            {/* Pro */}
                            <td className="p-3.5 text-center font-mono font-bold text-teal-800 dark:text-teal-300 bg-teal-50/30 dark:bg-teal-950/10">
                              {typeof feat.values.pro === 'boolean' ? (
                                feat.values.pro ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-zinc-300 dark:text-zinc-600 mx-auto" />
                                )
                              ) : (
                                feat.values.pro
                              )}
                            </td>

                            {/* Business */}
                            <td className="p-3.5 text-center font-mono text-zinc-700 dark:text-zinc-300">
                              {typeof feat.values.business === 'boolean' ? (
                                feat.values.business ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-zinc-300 dark:text-zinc-600 mx-auto" />
                                )
                              ) : (
                                feat.values.business
                              )}
                            </td>

                            {/* Enterprise */}
                            <td className="p-3.5 pr-5 text-center font-mono font-bold text-purple-700 dark:text-purple-300">
                              {typeof feat.values.enterprise === 'boolean' ? (
                                feat.values.enterprise ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-zinc-300 dark:text-zinc-600 mx-auto" />
                                )
                              ) : (
                                feat.values.enterprise
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. ENTERPRISE BESPOKE / HIGH-VOLUME CONTACT CENTER BANNER     */}
      {/* ============================================================ */}
      <div className="rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 border border-zinc-800 p-5 sm:p-7 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-md relative overflow-hidden">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[11px] font-bold font-mono uppercase tracking-wider">
            <Server className="h-3 w-3" /> Bespoke Enterprise Carrier Interconnect
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
            Need 100,000+ Voice Minutes or Dedicated On-Premise PBX?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            We engineer custom carrier interconnects, multi-tenant white-label instances, direct GSM hardware clusters, and sub-50ms dedicated AI voice inference.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              const enterprisePlan =
                plans.find((p) => p.name.includes('VIP') || p.name.includes('Enterprise')) ||
                plans[plans.length - 1];
              onSelectPlan(enterprisePlan, billingCycle);
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer"
            leftIcon={<Zap className="h-4 w-4" />}
          >
            Deploy VIP Sovereign Tier
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. FAQ & TRANSPARENCY ACCORDION                              */}
      {/* ============================================================ */}
      <div className="space-y-3.5">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Frequently Asked Billing &amp; Telephony Questions
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Everything you need to know about quotas, carrier overages, and sovereign licensing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
          {faqs.map((faq, idx) => {
            const isOpen = selectedFaq === idx;
            return (
              <div
                key={idx}
                onClick={() => setSelectedFaq(isOpen ? null : idx)}
                className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs cursor-pointer hover:border-teal-500/50 transition-all space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {faq.q}
                  </h4>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-teal-600 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
                  )}
                </div>
                {isOpen && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed animate-fadeIn">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlansTab;
