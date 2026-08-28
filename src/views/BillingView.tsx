import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Download,
  Check,
  FileText,
  Receipt,
  ShieldCheck,
  Plus,
  Tag,
  Percent,
  Trash2,
  DollarSign,
  Building,
  Smartphone,
  Globe,
  QrCode,
  Zap,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { useToast } from '../components/ui/Toast';
import { couponRepository, paymentMethodRepository, planRepository } from '../repository';
import { Coupon, PaymentMethodItem, SubscriptionPlan } from '../types';

export const BillingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [currentPlanId, setCurrentPlanId] = useState('pro');

  // Repositories Data State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Checkout & Coupon Application
  const [checkoutCouponCode, setCheckoutCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Billing Address & Tax Details
  const [taxId, setTaxId] = useState('US987654321-GSTIN');
  const [billingAddress, setBillingAddress] = useState('500 Howard St, San Francisco, CA 94105, USA');

  // Modals
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isCreateCouponModalOpen, setIsCreateCouponModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);

  // Add Payment Method Form State
  const [paymentType, setPaymentType] = useState<
    'card' | 'upi' | 'netbanking' | 'paypal' | 'wallet' | 'apple_pay' | 'google_pay'
  >('card');
  const [cardHolder, setCardHolder] = useState('Alex Vance');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [upiId, setUpiId] = useState('alexvance@okaxis');

  // New Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [newDiscountValue, setNewDiscountValue] = useState(25);
  const [newMinPurchase, setNewMinPurchase] = useState(50);
  const [newExpiry, setNewExpiry] = useState('2026-12-31');

  const { addToast } = useToast();

  const loadBillingData = async () => {
    const loadedPlans = await planRepository.getAll();
    const loadedPm = await paymentMethodRepository.getAll();
    const loadedCoupons = await couponRepository.getAll();
    setPlans(loadedPlans);
    setPaymentMethods(loadedPm);
    setCoupons(loadedCoupons);
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const invoices = [
    { id: 'inv_8801', date: 'Jul 01, 2026', amount: '$199.00', status: 'Paid', plan: 'Pro Subscription' },
    { id: 'inv_8800', date: 'Jun 01, 2026', amount: '$199.00', status: 'Paid', plan: 'Pro Subscription' },
    { id: 'inv_8799', date: 'May 01, 2026', amount: '$199.00', status: 'Paid', plan: 'Pro Subscription' },
  ];

  // Apply Coupon Logic
  const handleApplyCoupon = () => {
    if (!checkoutCouponCode.trim()) return;
    const found = coupons.find(
      (c) => c.code.toLowerCase() === checkoutCouponCode.trim().toLowerCase() && c.active
    );
    if (!found) {
      addToast({ type: 'error', title: 'Invalid Coupon', description: 'Coupon code not found or expired.' });
      return;
    }
    setAppliedCoupon(found);
    addToast({
      type: 'success',
      title: 'Coupon Applied!',
      description: `Discount ${found.discountType === 'percentage' ? `${found.discountValue}%` : `$${found.discountValue}`} applied.`,
    });
  };

  // Add Payment Method Handler
  const handleAddPaymentMethod = async () => {
    const created = await paymentMethodRepository.create({
      type: paymentType,
      brand: paymentType === 'card' ? 'Visa' : paymentType === 'upi' ? 'UPI' : 'PayPal',
      last4: cardNumber.slice(-4) || '1111',
      expMonth: 12,
      expYear: 2028,
      isDefault: paymentMethods.length === 0,
      holderName: cardHolder,
      details: paymentType === 'upi' ? upiId : undefined,
    });
    setPaymentMethods((prev) => [...prev, created]);
    setIsAddPaymentModalOpen(false);
    addToast({ type: 'success', title: 'Payment Method Added', description: `Saved ${paymentType.toUpperCase()} option.` });
  };

  // Create Coupon Handler
  const handleCreateCoupon = async () => {
    if (!newCouponCode.trim()) return;
    const created = await couponRepository.create({
      code: newCouponCode.toUpperCase(),
      discountType: newDiscountType,
      discountValue: Number(newDiscountValue),
      minPurchase: Number(newMinPurchase),
      applicablePlans: ['Starter', 'Pro', 'Business', 'Enterprise'],
      maxUsage: 500,
      perUserLimit: 1,
      usageCount: 0,
      expiryDate: newExpiry,
      active: true,
    });
    setCoupons((prev) => [...prev, created]);
    setIsCreateCouponModalOpen(false);
    setNewCouponCode('');
    addToast({ type: 'success', title: 'Coupon Created', description: `Code ${created.code} activated.` });
  };

  // Toggle Coupon Active Status
  const handleToggleCoupon = async (c: Coupon) => {
    const updated = await couponRepository.update(c.id, { active: !c.active });
    setCoupons((prev) => prev.map((item) => (item.id === c.id ? updated : item)));
    addToast({
      type: 'info',
      title: 'Coupon Status',
      description: `${c.code} is now ${updated.active ? 'Active' : 'Deactivated'}.`,
    });
  };

  // Set Default Payment Method
  const handleSetDefaultPayment = async (id: string) => {
    const updated = paymentMethods.map((pm) => ({
      ...pm,
      isDefault: pm.id === id,
    }));
    setPaymentMethods(updated);
    addToast({ type: 'success', title: 'Default Payment Method', description: 'Updated primary payment option.' });
  };

  // Delete Payment Method
  const handleDeletePayment = async (id: string) => {
    await paymentMethodRepository.delete(id);
    setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
    addToast({ type: 'info', title: 'Payment Method Removed', description: 'Deleted payment option.' });
  };

  // Invoice Download
  const handleDownloadInvoice = (invId: string, format: 'PDF' | 'CSV') => {
    const content = `Invoice ID: ${invId}\nFormat: ${format}\nStatus: Paid\nOrganization: Nexus Org`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invId}.${format.toLowerCase()}`;
    link.click();
    addToast({ type: 'success', title: 'Invoice Downloaded', description: `Saved ${invId}.${format.toLowerCase()}` });
  };

  const getPrice = (plan: SubscriptionPlan) => {
    if (billingCycle === 'yearly') return plan.yearlyPrice;
    if (billingCycle === 'lifetime' && plan.lifetimePrice) return plan.lifetimePrice;
    return plan.monthlyPrice;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Enterprise Billing & Subscription Center
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage subscription plans, concurrency limits, payment gateways, tax GST/VAT profiles, and discount coupons.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAddPaymentModalOpen(true)} leftIcon={<CreditCard className="h-4 w-4" />}>
            Add Payment Method
          </Button>
          <Button variant="primary" onClick={() => setActiveTab('plans')} leftIcon={<Sparkles className="h-4 w-4" />}>
            Upgrade Plan
          </Button>
        </div>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t)}
        variant="pills"
        tabs={[
          { id: 'overview', label: 'Overview & Usage' },
          { id: 'plans', label: 'Subscription Plans' },
          { id: 'payments', label: 'Payment Methods', badge: paymentMethods.length },
          { id: 'coupons', label: 'Coupons & Discounts', badge: coupons.length },
          { id: 'invoices', label: 'Invoices & Taxes' },
        ]}
      />

      {/* TAB 1: OVERVIEW & USAGE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-blue-100">Current Plan</p>
                    <h3 className="text-2xl font-black mt-1">Pro Scale Plan</h3>
                  </div>
                  <Badge variant="success" size="sm" className="bg-emerald-500 text-white border-none">
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-blue-100">Renews on August 15, 2026 • $199.00 / month</p>
                <div className="pt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-white text-blue-700 hover:bg-blue-50 border-none font-bold"
                    onClick={() => setActiveTab('plans')}
                  >
                    Change Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-zinc-500 uppercase">Monthly Voice Minutes</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">1,842</span>
                  <span className="text-xs text-zinc-400">/ 3,000 Mins</span>
                </div>
                <Progress value={61} variant="primary" size="sm" />
                <p className="text-[10px] text-zinc-400">61% of monthly allocation consumed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-zinc-500 uppercase">Concurrent Line Capacity</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">4 / 10</span>
                  <span className="text-xs text-emerald-500 font-bold">4 Active Calls</span>
                </div>
                <Progress value={40} variant="success" size="sm" />
                <p className="text-[10px] text-zinc-400">6 additional concurrent trunks available</p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Architecture Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Multi-Gateway Payment Architecture Integration
              </CardTitle>
              <CardDescription>
                Unified checkout processor routing through Stripe, Razorpay, Cashfree, PayPal, PhonePe, Google Pay, Apple Pay, and UPI.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Stripe Global', status: 'Active (US/EU)', type: 'Card & Wallet' },
                { name: 'Razorpay India', status: 'Active (IN)', type: 'UPI & NetBanking' },
                { name: 'PayPal Express', status: 'Active Global', type: 'PayPal Balance' },
                { name: 'Cashfree Payments', status: 'Active (IN)', type: 'Cards & Wallets' },
              ].map((gw, idx) => (
                <div key={idx} className="p-3 border rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs space-y-1">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{gw.name}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{gw.status}</p>
                  <p className="text-[10px] text-zinc-400">{gw.type}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTION PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Billing Cycle Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <span>Yearly Billing</span>
                <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold">
                  Save 20%
                </span>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('lifetime')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  billingCycle === 'lifetime'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Lifetime Enterprise License
              </button>
            </div>
          </div>

          {/* Grid of Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const price = getPrice(plan);
              const isCurrent = plan.id === currentPlanId;

              return (
                <Card
                  key={plan.id}
                  className={`flex flex-col justify-between relative ${
                    plan.popular
                      ? 'border-2 border-blue-600 shadow-lg shadow-blue-500/10'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full">
                      Most Popular Choice
                    </div>
                  )}

                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-xs">{plan.tagline}</CardDescription>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">${price}</span>
                      <span className="text-xs text-zinc-400 font-semibold">
                        {billingCycle === 'monthly' ? '/mo' : billingCycle === 'yearly' ? '/mo (billed annually)' : ' lifetime'}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 text-xs space-y-4">
                    <ul className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                          <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={isCurrent ? 'outline' : plan.popular ? 'primary' : 'outline'}
                      className="w-full"
                      onClick={() => {
                        setSelectedPlanForCheckout(plan);
                        setIsUpgradeModalOpen(true);
                      }}
                    >
                      {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT METHODS */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Saved Payment Methods</CardTitle>
              <CardDescription>Credit Cards, Debit Cards, UPI IDs, PayPal, and Apple Pay</CardDescription>
            </div>
            <Button size="sm" variant="primary" onClick={() => setIsAddPaymentModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Add Payment Method
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="p-4 border rounded-2xl border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/30"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center font-bold">
                    {pm.type === 'card' ? <CreditCard className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {pm.brand} {pm.last4 ? `•••• ${pm.last4}` : pm.details}
                      </p>
                      {pm.isDefault && <Badge variant="success" size="sm">Default</Badge>}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {pm.holderName} {pm.expMonth ? `• Exp ${pm.expMonth}/${pm.expYear}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!pm.isDefault && (
                    <Button size="sm" variant="outline" onClick={() => handleSetDefaultPayment(pm.id)}>
                      Make Default
                    </Button>
                  )}
                  <Button size="sm" variant="danger" onClick={() => handleDeletePayment(pm.id)} leftIcon={<Trash2 className="h-3.5 w-3.5" />} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: COUPONS & DISCOUNTS */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Admin Coupon Management System</CardTitle>
                <CardDescription>Create percentage or fixed-amount discount coupons for checkout.</CardDescription>
              </div>
              <Button size="sm" variant="primary" onClick={() => setIsCreateCouponModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
                Create Coupon Code
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="p-4 border rounded-2xl border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center font-bold">
                      <Tag className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-zinc-100">{c.code}</span>
                        <Badge variant={c.active ? 'success' : 'neutral'} size="sm">
                          {c.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `$${c.discountValue} FLAT OFF`} • Min Purchase: ${c.minPurchase} • Used {c.usageCount}/{c.maxUsage}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleToggleCoupon(c)}>
                      {c.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: INVOICES & TAXES */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {/* Tax Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Tax & VAT/GST Profile</CardTitle>
              <CardDescription>Maintain organizational Tax Identification for legal invoice receipts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GSTIN / VAT ID / Tax Identification"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                />
                <Input
                  label="Billing Address"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                />
              </div>
              <Button variant="primary" onClick={() => addToast({ type: 'success', title: 'Tax Details Saved', description: 'Updated tax profile.' })}>
                Save Tax Profile
              </Button>
            </CardContent>
          </Card>

          {/* Invoices List */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>Download PDF and CSV receipts for accounting audit trail.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-zinc-100 dark:divide-zinc-800">
              {invoices.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{inv.id}</span>
                      <Badge variant="success" size="sm">{inv.status}</Badge>
                    </div>
                    <p className="text-zinc-500 text-[11px] mt-0.5">{inv.plan} • {inv.date}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{inv.amount}</span>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadInvoice(inv.id, 'PDF')}>
                      PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadInvoice(inv.id, 'CSV')}>
                      CSV
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* CHECKOUT & UPGRADE MODAL WITH COUPON CODE INPUT */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title={`Subscribe to ${selectedPlanForCheckout?.name || 'Selected Plan'}`}
        description="Select payment gateway & apply discount coupon."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (selectedPlanForCheckout) {
                  setCurrentPlanId(selectedPlanForCheckout.id);
                  setIsUpgradeModalOpen(false);
                  addToast({ type: 'success', title: 'Subscription Activated', description: `Successfully upgraded to ${selectedPlanForCheckout.name}.` });
                }
              }}
            >
              Complete Checkout
            </Button>
          </>
        }
      >
        {selectedPlanForCheckout && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-100">{selectedPlanForCheckout.name} Plan</span>
              <span className="font-extrabold text-blue-600">${selectedPlanForCheckout.monthlyPrice}/mo</span>
            </div>

            {/* Coupon Application Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Discount Coupon</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter WELCOME20"
                  value={checkoutCouponCode}
                  onChange={(e) => setCheckoutCouponCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
                <Button size="sm" variant="outline" onClick={handleApplyCoupon}>
                  Apply
                </Button>
              </div>
              {appliedCoupon && (
                <p className="text-xs text-emerald-600 font-semibold">
                  Coupon Applied: {appliedCoupon.code} (-{appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `$${appliedCoupon.discountValue}`})
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE COUPON MODAL */}
      <Modal
        isOpen={isCreateCouponModalOpen}
        onClose={() => setIsCreateCouponModalOpen(false)}
        title="Create Promotional Coupon"
        description="Configure coupon discount code and minimum spend requirements."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateCouponModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateCoupon}>
              Save & Activate Coupon
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Coupon Code" value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value)} placeholder="SUMMER50" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Discount Type</label>
              <select
                value={newDiscountType}
                onChange={(e) => setNewDiscountType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <Input label="Discount Value" type="number" value={newDiscountValue.toString()} onChange={(e) => setNewDiscountValue(Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Min Purchase ($)" type="number" value={newMinPurchase.toString()} onChange={(e) => setNewMinPurchase(Number(e.target.value))} />
            <Input label="Expiry Date" type="date" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* ADD PAYMENT METHOD MODAL */}
      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        title="Add Payment Method"
        description="Select Credit/Debit Card, UPI ID, or Wallet gateway."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddPaymentMethod}>
              Save Payment Method
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Payment Gateway Option</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100"
            >
              <option value="card">Credit / Debit Card (Stripe / Cashfree)</option>
              <option value="upi">UPI / VPA (Razorpay / PhonePe)</option>
              <option value="paypal">PayPal Balance</option>
              <option value="netbanking">Net Banking (All Indian Banks)</option>
            </select>
          </div>

          {paymentType === 'card' ? (
            <>
              <Input label="Cardholder Name" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
              <Input label="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
              <Input label="Expiration (MM/YY)" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
            </>
          ) : (
            <Input label="UPI ID / Wallet Email" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
          )}
        </div>
      </Modal>
    </div>
  );
};
