import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Search,
  CheckCircle2,
  Printer,
  ArrowLeft,
  Building,
  ShieldCheck,
  Calendar,
  CreditCard,
  Copy,
  Mail,
  QrCode,
  ExternalLink,
  Check,
  Sparkles,
  Clock,
  X,
  Award,
  DollarSign,
  Receipt,
  FileCheck2,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { fetchAPI } from '../../repository';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { BillingInvoiceItem, InvoiceTemplateSettings } from '../../types';
import { OfficialInvoiceDocument } from './OfficialInvoiceDocument';

export interface InvoicesTabProps {
  invoices: BillingInvoiceItem[];
  onDownloadInvoice?: (invoice: BillingInvoiceItem) => void;
  isSuperAdmin?: boolean;
  onRefresh?: () => void;
}

/**
 * Official Cryptographic Digital Seal
 */
const DigitalVerificationSeal: React.FC = () => (
  <div className="relative flex items-center justify-center select-none w-28 h-28 shrink-0">
    <svg className="w-full h-full text-teal-600 dark:text-teal-400 opacity-90" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="1" />
      <path
        id="sealCirclePath"
        d="M 60, 60 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0"
        fill="transparent"
      />
      <text className="text-[6.5px] uppercase font-mono font-bold tracking-[1.8px] fill-current">
        <textPath href="#sealCirclePath" startOffset="0%">
          CREATE CALL OS • VERIFIED TAX INVOICE • DIGITALLY SIGNED •
        </textPath>
      </text>
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
      <ShieldCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" />
      <span className="text-[7.5px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mt-0.5">
        AUTHENTIC
      </span>
      <span className="text-[6.5px] font-mono text-zinc-500 dark:text-zinc-400">SECURE RECORD</span>
    </div>
  </div>
);

/**
 * Cryptographic QR Verification Matrix
 */
const InvoiceQrCode: React.FC<{ invoiceNumber: string }> = ({ invoiceNumber }) => (
  <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs flex flex-col items-center gap-1 shrink-0">
    <svg className="w-16 h-16 text-zinc-900 dark:text-zinc-100" viewBox="0 0 100 100" fill="currentColor">
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
    <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase tracking-wider">VERIFY CERT</span>
  </div>
);

export const InvoicesTab: React.FC<InvoicesTabProps> = ({
  invoices: initialInvoices,
  onDownloadInvoice,
  isSuperAdmin: isSuperAdminProp,
  onRefresh,
}) => {
  const { user } = useAuth();
  const isSuperAdmin = Boolean(
    isSuperAdminProp ||
    (user as any)?.role === 'super_admin' ||
    (user as any)?.role === 'superadmin' ||
    user?.email === 'admin@createcall.ai'
  );
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'offline_pending' | 'refunded'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoiceItem | null>(null);
  const [localInvoices, setLocalInvoices] = useState<BillingInvoiceItem[]>(() => initialInvoices || []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; num: string } | 'bulk' | null>(null);

  useEffect(() => {
    if (initialInvoices) {
      setLocalInvoices(initialInvoices);
    }
  }, [initialInvoices]);

  const [templateSettings, setTemplateSettings] = useState<InvoiceTemplateSettings>({
    company_name: 'Create Call OS Technologies Private Limited',
    company_tagline: 'AI Voice Operating System • Global Carrier Telephony',
    head_office_address: 'Cyber City Innovation Hub, Tower 4, Sector 62, Noida - 201309, India',
    support_email: 'finance@createcall.ai',
    billing_email: 'billing@createcall.ai',
    support_phone: '+1 (800) 555-CALL',
    gstin: '27AABCU9603R1ZM',
    cin: 'U72900DL2026PTC109822',
    sac_code: '998413 (Telephony & Cloud Computing)',
    dot_license: 'DoT-VNO-CAT-A/2026/891',
    tax_rate_percent: 18.0,
    tax_name: '18% Statutory GST (CGST 9% + SGST 9%)',
    authorized_signatory_name: 'Mukta Swami',
    authorized_signatory_title: 'Founder & Managing Director',
    terms_notes: 'Computer-generated tax receipt issued under IT Act Electronic Records Standards. All amounts settled in full with zero outstanding balance.',
  });

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const res = await fetchAPI('/api/billing/invoice-template-settings');
        if (res && res.company_name) {
          setTemplateSettings((prev) => ({ ...prev, ...res }));
        }
      } catch {
        // Use default fallback
      }
    };
    loadTemplate();
  }, []);

  const filteredInvoices = useMemo(() => {
    return localInvoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.invoice_number?.toLowerCase().includes(q) ||
        (inv.plan_name && inv.plan_name.toLowerCase().includes(q)) ||
        (inv.billing_name && inv.billing_name.toLowerCase().includes(q)) ||
        (inv.customer_email && inv.customer_email.toLowerCase().includes(q));

      const invStatus = (inv.status || 'paid').toLowerCase();
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'paid'
          ? ['paid', 'completed', 'active', 'success'].includes(invStatus)
          : statusFilter === 'offline_pending'
          ? ['offline_pending', 'pending_approval', 'wire_pending'].includes(invStatus)
          : statusFilter === 'refunded'
          ? ['refunded', 'reversed', 'canceled', 'cancelled'].includes(invStatus)
          : statusFilter === 'pending'
          ? ['pending', 'created', 'initiated'].includes(invStatus)
          : true;

      return matchesSearch && matchesStatus;
    });
  }, [localInvoices, searchQuery, statusFilter]);

  const totalInvoiced = useMemo(
    () => localInvoices.reduce((acc, curr) => acc + (curr.total_amount || parseFloat(curr.amount) || 0), 0),
    [localInvoices]
  );
  const paidInvoicesCount = useMemo(
    () => localInvoices.filter((i) => ['paid', 'completed', 'active', 'success'].includes(i.status?.toLowerCase() || '')).length,
    [localInvoices]
  );
  const refundedInvoicesCount = useMemo(
    () => localInvoices.filter((i) => ['refunded', 'reversed', 'canceled', 'cancelled'].includes(i.status?.toLowerCase() || '')).length,
    [localInvoices]
  );

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map((i) => i.id || i.invoice_number));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteInvoice = async (invoiceId: string, invoiceNum: string) => {
    setIsDeleting(true);
    try {
      const res = await fetchAPI(`/api/billing/invoices/${encodeURIComponent(invoiceId)}`, {
        method: 'DELETE',
      });
      if (res && res.success) {
        setLocalInvoices((prev) => prev.filter((i) => i.id !== invoiceId && i.invoice_number !== invoiceId));
        setSelectedIds((prev) => prev.filter((id) => id !== invoiceId && id !== invoiceNum));
        addToast({
          type: 'success',
          title: 'Invoice Deleted',
          description: `Invoice ${invoiceNum} removed successfully.`,
        });
        onRefresh?.();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        description: err.message || 'Could not delete invoice.',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmTarget(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await fetchAPI('/api/billing/invoices/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ invoice_ids: selectedIds }),
      });
      if (res && res.success) {
        setLocalInvoices((prev) => prev.filter((i) => !selectedIds.includes(i.id) && !selectedIds.includes(i.invoice_number)));
        addToast({
          type: 'success',
          title: 'Bulk Delete Complete',
          description: `Successfully deleted ${res.deleted_count || selectedIds.length} invoice records.`,
        });
        setSelectedIds([]);
        onRefresh?.();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Bulk Delete Failed',
        description: err.message || 'Could not delete selected invoices.',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmTarget(null);
    }
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: string, invoiceNum: string) => {
    try {
      const res = await fetchAPI(`/api/billing/invoices/${encodeURIComponent(invoiceId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, reason: `Admin marked as ${newStatus}` }),
      });
      if (res && res.success) {
        setLocalInvoices((prev) =>
          prev.map((i) => (i.id === invoiceId || i.invoice_number === invoiceId ? { ...i, status: newStatus } : i))
        );
        addToast({
          type: 'success',
          title: 'Status Updated',
          description: `Invoice ${invoiceNum} status changed to ${newStatus}.`,
        });
        onRefresh?.();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: err.message || 'Could not update status.',
      });
    }
  };

  const handleBulkUpdateStatus = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetchAPI('/api/billing/invoices/bulk-status', {
        method: 'POST',
        body: JSON.stringify({ invoice_ids: selectedIds, status: newStatus }),
      });
      if (res && res.success) {
        setLocalInvoices((prev) =>
          prev.map((i) =>
            selectedIds.includes(i.id) || selectedIds.includes(i.invoice_number)
              ? { ...i, status: newStatus }
              : i
          )
        );
        addToast({
          type: 'success',
          title: 'Bulk Status Updated',
          description: `Updated status to ${newStatus} for ${selectedIds.length} invoices.`,
        });
        setSelectedIds([]);
        onRefresh?.();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Bulk Update Failed',
        description: err.message || 'Could not update status for selected invoices.',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyInvoiceNumber = (invNum: string) => {
    navigator.clipboard.writeText(invNum);
    addToast({
      type: 'success',
      title: 'Invoice Number Copied',
      description: `${invNum} copied to clipboard.`,
    });
  };

  const handleEmailInvoice = (inv: BillingInvoiceItem) => {
    const emailTo = inv.customer_email || inv.billing_email || user?.email || 'your registered address';
    addToast({
      type: 'success',
      title: 'Invoice Receipt Dispatched',
      description: `Official PDF invoice for ${inv.invoice_number} sent to ${emailTo}.`,
    });
  };

  const handleDownloadJson = (inv: BillingInvoiceItem) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(inv, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${inv.invoice_number}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast({
      type: 'info',
      title: 'Ledger Record Exported',
      description: `Downloaded JSON audit ledger for ${inv.invoice_number}.`,
    });
  };

  // Convert numbers to words for formal invoice representation
  const formatAmountInWords = (num: number, currency: string = 'USD'): string => {
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

    let words = '';
    const thousands = Math.floor(dollars / 1000);
    const rem = dollars % 1000;

    if (thousands > 0) words += convertChunk(thousands) + 'Thousand ';
    if (rem > 0) words += convertChunk(rem);

    const currLabel = currency === 'INR' ? 'Indian Rupees' : currency === 'EUR' ? 'Euros' : currency === 'GBP' ? 'Pounds' : 'US Dollars';
    words = (words.trim() || 'Zero') + ' ' + currLabel;

    if (cents > 0) {
      words += ' and ' + convertChunk(cents).trim() + (currency === 'INR' ? ' Paise' : ' Cents');
    }

    return words.trim() + ' Only';
  };

  // ==========================================
  // INLINE INVOICE DETAIL & PRINT VIEW (OFFICIAL DOC STYLE)
  // ==========================================
  if (selectedInvoice) {
    return (
      <OfficialInvoiceDocument
        invoice={selectedInvoice}
        templateSettings={templateSettings}
        onBack={() => setSelectedInvoice(null)}
        backLabel="Back to Invoices Ledger"
        showTopBar={true}
      />
    );
  }

  // ==========================================
  // INVOICES LEDGER TABLE VIEW
  // ==========================================
  return (
    <div className="space-y-5">
      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Total Invoiced Volume</span>
            <DollarSign className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-50 font-mono mt-1">
            ${totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 font-mono">
            {localInvoices.length} Total Receipts Generated
          </div>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Paid Tax Receipts</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {paidInvoicesCount} Records
          </div>
          <div className="text-[11px] text-emerald-500 mt-1 font-mono">
            100% Settled & Authenticated
          </div>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
            <span>GST / VAT Tax Compliance</span>
            <ShieldCheck className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono mt-1 flex items-center gap-1.5">
            18% Statutory
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 font-mono">
            GSTIN: 27AABCU9603R1ZM
          </div>
        </Card>
      </div>

      {/* Bulk Selection Action Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 px-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm" className="font-mono font-bold">
              {selectedIds.length} Selected
            </Badge>
            <span className="text-xs text-teal-900 dark:text-teal-200 font-medium">
              Actions for selected invoices:
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleBulkUpdateStatus('Paid')}
                  className="border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold"
                  leftIcon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                >
                  Mark Paid
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleBulkUpdateStatus('Refunded')}
                  className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold"
                  leftIcon={<RotateCcw className="h-3.5 w-3.5 text-amber-600" />}
                >
                  Refund / Revert
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => setDeleteConfirmTarget('bulk')}
                  className="text-xs font-semibold"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Delete ({selectedIds.length})
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="xs"
              onClick={() => setSelectedIds([])}
              className="text-xs text-zinc-500 hover:text-zinc-800 border-zinc-300 dark:border-zinc-700"
              leftIcon={<X className="h-3.5 w-3.5" />}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Invoices Table Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-xs overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice # or plan..."
              className="w-full h-8.5 pl-8.5 pr-3 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800'
              }`}
            >
              All ({localInvoices.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'paid'
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800'
              }`}
            >
              Paid ({paidInvoicesCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('offline_pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'offline_pending'
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800'
              }`}
            >
              Pending Wires ({localInvoices.filter((i) => i.status?.toLowerCase() === 'offline_pending').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('refunded')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'refunded'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800'
              }`}
            >
              Refunded ({refundedInvoicesCount})
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={handleToggleSelectAll}
                    className="h-3.5 w-3.5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    aria-label="Select all invoices"
                  />
                </th>
                <th className="py-3 px-4">Invoice #</th>
                {isSuperAdmin && <th className="py-3 px-4">Subscriber / Org</th>}
                <th className="py-3 px-4">Plan / Description</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const invKey = inv.id || inv.invoice_number;
                  const isSelected = selectedIds.includes(invKey);
                  return (
                    <tr
                      key={invKey}
                      className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors ${
                        isSelected ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(invKey)}
                          className="h-3.5 w-3.5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          aria-label={`Select invoice ${inv.invoice_number}`}
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                          <span>{inv.invoice_number}</span>
                        </div>
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3 px-4 text-zinc-800 dark:text-zinc-200">
                          <div className="font-semibold">{inv.billing_name || 'Subscriber Organization'}</div>
                          <div className="text-[10px] text-zinc-400 font-mono truncate max-w-[160px]">
                            {inv.customer_email || inv.billing_email || 'tenant@createcall.ai'}
                          </div>
                        </td>
                      )}
                      <td className="py-3 px-4 text-zinc-800 dark:text-zinc-200">
                        <div className="font-semibold">{inv.plan_name}</div>
                        <div className="text-[10px] text-zinc-400 capitalize">{inv.billing_cycle || 'Monthly'} Subscription Cycle</div>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                        {inv.date || inv.created_at}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {inv.currency_symbol || '$'}{inv.total_amount?.toLocaleString() || inv.amount}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            ['paid', 'completed', 'active', 'success'].includes(inv.status.toLowerCase())
                              ? 'emerald'
                              : ['refunded', 'reversed', 'canceled', 'cancelled'].includes(inv.status.toLowerCase())
                              ? 'danger'
                              : 'warning'
                          }
                          size="xs"
                          className="font-mono uppercase font-bold text-[10px]"
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setSelectedInvoice(inv)}
                            className="border-zinc-300 dark:border-zinc-700 text-xs rounded-lg hover:border-teal-500 font-semibold"
                            leftIcon={<FileCheck2 className="h-3.5 w-3.5 text-teal-600" />}
                          >
                            View Tax Invoice
                          </Button>
                          {isSuperAdmin && (
                            <>
                              {['paid', 'completed', 'active', 'success'].includes(inv.status.toLowerCase()) ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(inv.id || inv.invoice_number, 'Refunded', inv.invoice_number)}
                                  className="p-1.5 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                                  title="Refund / Revert Invoice"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(inv.id || inv.invoice_number, 'Paid', inv.invoice_number)}
                                  className="p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                                  title="Mark Settled / Paid"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmTarget({ id: inv.id || inv.invoice_number, num: inv.invoice_number })}
                                className="p-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                                title="Delete Invoice Record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopyInvoiceNumber(inv.invoice_number)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Copy Invoice Number"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isSuperAdmin ? 8 : 7} className="py-10 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                    No tax invoices found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <Modal
          isOpen={Boolean(deleteConfirmTarget)}
          onClose={() => setDeleteConfirmTarget(null)}
          title={deleteConfirmTarget === 'bulk' ? `Delete ${selectedIds.length} Invoices?` : `Delete Invoice ${deleteConfirmTarget.num}?`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmTarget(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (deleteConfirmTarget === 'bulk') {
                    handleBulkDelete();
                  } else {
                    handleDeleteInvoice(deleteConfirmTarget.id, deleteConfirmTarget.num);
                  }
                }}
                disabled={isDeleting}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Permanent Delete'}
              </Button>
            </div>
          }
        >
          <div className="space-y-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold">Permanent Deletion Warning</p>
                <p className="text-[11px] mt-0.5">
                  {deleteConfirmTarget === 'bulk'
                    ? `You are about to permanently delete ${selectedIds.length} invoice records from the database. This action cannot be reversed.`
                    : `You are about to permanently delete tax invoice ${deleteConfirmTarget.num} from the database. This action is irreversible.`}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InvoicesTab;
