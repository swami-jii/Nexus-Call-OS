import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  Copy,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Trash2,
  RotateCcw,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { fetchAPI } from '../../lib/api';
import { OfficialInvoiceDocument } from './OfficialInvoiceDocument';

export interface PaymentTransactionItem {
  id: string;
  transaction_id: string;
  gateway_order_id?: string;
  gateway_payment_id?: string;
  amount_usd: number;
  amount_local: number;
  currency: string;
  currency_symbol?: string;
  gateway: string;
  status: string;
  plan_id?: string;
  billing_cycle?: string;
  invoice_number?: string;
  created_at: string;
  completed_at?: string;
  details_json?: any;
}

export interface TransactionsTabProps {
  transactions?: PaymentTransactionItem[];
  isSuperAdmin?: boolean;
  onRefresh?: () => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions: initialTransactions,
  isSuperAdmin = false,
  onRefresh,
}) => {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'offline_pending' | 'refunded' | 'failed'>('all');
  const [transactions, setTransactions] = useState<PaymentTransactionItem[]>(() => initialTransactions || []);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; ref: string } | 'bulk' | null>(null);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAPI('/api/billing/transactions');
      if (res && Array.isArray(res.transactions)) {
        setTransactions(
          res.transactions.map((tx: any) => ({
            id: tx.id,
            transaction_id: tx.gateway_order_id || tx.transaction_reference || tx.id,
            gateway_order_id: tx.gateway_order_id,
            gateway_payment_id: tx.gateway_payment_id,
            amount_usd: tx.amount_usd || 0,
            amount_local: tx.amount_local || tx.amount_usd || 0,
            currency: tx.currency || 'USD',
            currency_symbol: tx.currency_symbol || '$',
            gateway: tx.gateway || 'Stripe',
            status: tx.status || 'completed',
            plan_id: tx.plan_id || 'Subscription',
            billing_cycle: tx.billing_cycle || 'monthly',
            invoice_number: tx.invoice_number,
            created_at: tx.created_at ? new Date(tx.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
            completed_at: tx.completed_at,
            details_json: tx.details_json,
          }))
        );
        setTotalCount(res.total || res.transactions.length);
      }
    } catch {
      // Retain existing
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialTransactions || initialTransactions.length === 0) {
      loadTransactions();
    } else {
      setTransactions(initialTransactions);
    }
  }, [initialTransactions, loadTransactions]);

  const completedCount = transactions.filter((tx) =>
    ['completed', 'paid', 'success', 'succeeded', 'active'].includes((tx.status || '').toLowerCase())
  ).length;

  const pendingUtrCount = transactions.filter((tx) =>
    ['offline_pending', 'pending_approval', 'wire_pending'].includes((tx.status || '').toLowerCase())
  ).length;

  const refundedCount = transactions.filter((tx) =>
    ['refunded', 'reversed', 'canceled', 'cancelled'].includes((tx.status || '').toLowerCase())
  ).length;

  const failedCount = transactions.filter((tx) =>
    ['failed', 'declined', 'error'].includes((tx.status || '').toLowerCase())
  ).length;

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.gateway.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.plan_id && tx.plan_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.invoice_number && tx.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const txStatus = (tx.status || '').toLowerCase();
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'completed'
        ? ['completed', 'paid', 'success', 'succeeded', 'active'].includes(txStatus)
        : statusFilter === 'pending'
        ? ['pending', 'created', 'initiated'].includes(txStatus)
        : statusFilter === 'offline_pending'
        ? ['offline_pending', 'pending_approval', 'wire_pending'].includes(txStatus)
        : statusFilter === 'refunded'
        ? ['refunded', 'reversed', 'canceled', 'cancelled'].includes(txStatus)
        : statusFilter === 'failed'
        ? ['failed', 'declined', 'error'].includes(txStatus)
        : true;

    return matchesSearch && matchesStatus;
  });

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map((tx) => tx.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteTransaction = async (txId: string, txRef: string) => {
    setIsDeleting(true);
    try {
      const res = await fetchAPI(`/api/billing/transactions/${encodeURIComponent(txId)}`, {
        method: 'DELETE',
      });
      if (res && res.success) {
        setTransactions((prev) => prev.filter((tx) => tx.id !== txId && tx.transaction_id !== txId));
        setSelectedIds((prev) => prev.filter((id) => id !== txId));
        addToast({
          type: 'success',
          title: 'Transaction Deleted',
          description: `Transaction ${txRef} and associated records removed successfully.`,
        });
        onRefresh?.();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        description: err.message || 'Could not delete transaction.',
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
      const res = await fetchAPI('/api/billing/transactions/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ transaction_ids: selectedIds }),
      });
      if (res && res.success) {
        setTransactions((prev) => prev.filter((tx) => !selectedIds.includes(tx.id)));
        addToast({
          type: 'success',
          title: 'Bulk Delete Complete',
          description: `Successfully deleted ${res.deleted_count || selectedIds.length} transactions.`,
        });
        setSelectedIds([]);
        onRefresh?.();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Bulk Delete Failed',
        description: err.message || 'Could not delete selected transactions.',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmTarget(null);
    }
  };

  const handleUpdateStatus = async (txId: string, newStatus: string, txRef: string) => {
    try {
      const res = await fetchAPI(`/api/billing/transactions/${encodeURIComponent(txId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, reason: `Admin marked as ${newStatus}` }),
      });
      if (res && res.success) {
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === txId || tx.transaction_id === txId ? { ...tx, status: newStatus } : tx))
        );
        addToast({
          type: 'success',
          title: 'Status Updated',
          description: `Transaction ${txRef} updated to ${newStatus}.`,
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
      const res = await fetchAPI('/api/billing/transactions/bulk-status', {
        method: 'POST',
        body: JSON.stringify({ transaction_ids: selectedIds, status: newStatus }),
      });
      if (res && res.success) {
        setTransactions((prev) =>
          prev.map((tx) => (selectedIds.includes(tx.id) ? { ...tx, status: newStatus } : tx))
        );
        addToast({
          type: 'success',
          title: 'Bulk Status Updated',
          description: `Updated status to ${newStatus} for ${selectedIds.length} transactions.`,
        });
        setSelectedIds([]);
        onRefresh?.();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Bulk Update Failed',
        description: err.message || 'Could not update status for selected transactions.',
      });
    }
  };

  const handleOpenInvoice = async (invoiceNumber: string, tx: PaymentTransactionItem) => {
    try {
      const res = await fetchAPI(`/api/billing/invoices/${encodeURIComponent(invoiceNumber)}`);
      if (res && res.invoice_number) {
        setSelectedInvoice({
          ...res,
          gateway: res.gateway || tx.gateway,
          gateway_key: res.gateway_key || tx.gateway,
          coupon_code: res.coupon_code || tx.details_json?.coupon_code,
          gateway_order_id: res.gateway_order_id || tx.gateway_order_id,
          gateway_payment_id: res.gateway_payment_id || tx.gateway_payment_id,
          amount_local: res.total_amount ?? tx.amount_local,
          details_json: { ...(tx.details_json || {}), ...(res.details_json || {}) },
        });
      } else {
        setSelectedInvoice({
          id: tx.id,
          invoice_number: invoiceNumber,
          transaction_id: tx.transaction_id,
          gateway: tx.gateway,
          gateway_key: tx.gateway,
          gateway_order_id: tx.gateway_order_id,
          gateway_payment_id: tx.gateway_payment_id,
          coupon_code: tx.details_json?.coupon_code,
          plan_name: tx.plan_id ? (tx.plan_id === 'wallet_topup' ? 'Prepaid Carrier Wallet Top-Up' : tx.plan_id) : 'Prepaid Carrier Wallet Top-Up',
          billing_cycle: tx.billing_cycle || 'one_time',
          amount: `${tx.currency_symbol || '$'}${tx.amount_local}`,
          amount_local: tx.amount_local,
          total_amount: tx.amount_local,
          subtotal: tx.amount_local,
          discount_amount: tx.details_json?.discount_local || 0,
          currency: tx.currency,
          currency_symbol: tx.currency_symbol || '$',
          status: tx.status,
          date: tx.created_at,
          created_at: tx.created_at,
          details_json: tx.details_json || {},
        });
      }
    } catch {
      setSelectedInvoice({
        id: tx.id,
        invoice_number: invoiceNumber,
        transaction_id: tx.transaction_id,
        gateway: tx.gateway,
        gateway_key: tx.gateway,
        gateway_order_id: tx.gateway_order_id,
        gateway_payment_id: tx.gateway_payment_id,
        coupon_code: tx.details_json?.coupon_code,
        plan_name: tx.plan_id ? (tx.plan_id === 'wallet_topup' ? 'Prepaid Carrier Wallet Top-Up' : tx.plan_id) : 'Prepaid Carrier Wallet Top-Up',
        billing_cycle: tx.billing_cycle || 'one_time',
        amount: `${tx.currency_symbol || '$'}${tx.amount_local}`,
        amount_local: tx.amount_local,
        total_amount: tx.amount_local,
        subtotal: tx.amount_local,
        discount_amount: tx.details_json?.discount_local || 0,
        currency: tx.currency,
        currency_symbol: tx.currency_symbol || '$',
        status: tx.status,
        date: tx.created_at,
        created_at: tx.created_at,
        details_json: tx.details_json || {},
      });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      type: 'success',
      title: 'Copied!',
      description: `Transaction reference copied to clipboard.`,
    });
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Data',
        description: 'No transactions available to export.',
      });
      return;
    }

    const headers = ['Transaction ID', 'Date', 'Gateway', 'Plan', 'Amount', 'Currency', 'Status', 'Invoice #'];
    const rows = transactions.map((tx) => [
      tx.transaction_id,
      tx.created_at,
      tx.gateway,
      tx.plan_id || 'Wallet Top-Up',
      tx.amount_local,
      tx.currency,
      tx.status,
      tx.invoice_number || 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `create_call_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Export Complete',
      description: 'Transaction ledger exported to CSV successfully.',
    });
  };

  if (selectedInvoice) {
    return (
      <OfficialInvoiceDocument
        invoice={selectedInvoice}
        onBack={() => setSelectedInvoice(null)}
        backLabel="Back to Financial Ledger"
        showTopBar={true}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <History className="h-4 w-4 text-teal-600" />
            {isSuperAdmin ? '👑 Global Multi-Tenant Financial Ledger' : 'Immutable Financial Ledger'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {isSuperAdmin
              ? 'Real-time unified audit log of all incoming subscriber payments, carrier wallet top-ups, gateway order IDs, and webhook confirmations.'
              : 'Real-time audit log of all subscriptions, carrier wallet top-ups, and gateway transactions.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="xs" className="font-mono font-semibold rounded-md">
            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-teal-600 dark:text-teal-400 inline" /> HMAC-SHA256 Signed
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-zinc-300 dark:border-zinc-700 text-xs rounded-md h-8"
            leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Bulk Selection Action Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 px-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm" className="font-mono font-bold">
              {selectedIds.length} Selected
            </Badge>
            <span className="text-xs text-teal-900 dark:text-teal-200 font-medium">
              Actions for selected transactions:
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleBulkUpdateStatus('success')}
                  className="border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold"
                  leftIcon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                >
                  Mark Settled
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleBulkUpdateStatus('refunded')}
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

      {/* Transactions Table Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference ID, invoice or gateway..."
              className="pl-9 h-8.5 text-xs rounded-md"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('offline_pending')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'offline_pending'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Pending UTR ({pendingUtrCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('refunded')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'refunded'
                  ? 'bg-rose-600 text-white dark:bg-rose-600 dark:text-white font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Refunded ({refundedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'failed'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Failed ({failedCount})
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadTransactions}
              disabled={isLoading}
              className="h-8 text-xs rounded-md ml-1"
              leftIcon={<RefreshCw className={`h-3 w-3 text-zinc-600 dark:text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Sync
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={handleToggleSelectAll}
                    className="h-3.5 w-3.5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    aria-label="Select all transactions"
                  />
                </th>
                <th className="py-3 px-5">Reference ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Gateway Rail</th>
                <th className="py-3 px-4">Plan / Purpose</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Invoice Link</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  const isSelected = selectedIds.includes(tx.id);
                  return (
                    <tr
                      key={tx.id || tx.transaction_id}
                      className={`hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors ${
                        isSelected ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(tx.id)}
                          className="h-3.5 w-3.5 rounded border-zinc-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          aria-label={`Select transaction ${tx.transaction_id}`}
                        />
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[140px] sm:max-w-[180px]">{tx.transaction_id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(tx.transaction_id)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                            title="Copy Transaction ID"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 font-mono">
                        {tx.created_at}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" size="xs" className="font-mono rounded-md uppercase">
                          {tx.gateway}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                        {tx.plan_id ? `${tx.plan_id}` : 'Prepaid Top-Up'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {tx.currency_symbol || '$'}{tx.amount_local?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {tx.invoice_number ? (
                          <button
                            type="button"
                            onClick={() => handleOpenInvoice(tx.invoice_number!, tx)}
                            className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold hover:underline cursor-pointer transition-colors group"
                            title="View Official Tax Invoice"
                          >
                            <FileText className="h-3.5 w-3.5 group-hover:scale-110 transition-transform shrink-0" />
                            <span>{tx.invoice_number}</span>
                          </button>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            ['completed', 'paid', 'success', 'succeeded', 'active'].includes((tx.status || '').toLowerCase())
                              ? 'success'
                              : ['refunded', 'reversed', 'canceled', 'cancelled'].includes((tx.status || '').toLowerCase())
                              ? 'danger'
                              : ['offline_pending', 'pending_approval', 'wire_pending'].includes((tx.status || '').toLowerCase())
                              ? 'warning'
                              : (tx.status || '').toLowerCase() === 'failed'
                              ? 'danger'
                              : 'secondary'
                          }
                          size="xs"
                          className="font-mono uppercase font-bold text-[10px]"
                        >
                          {['completed', 'paid', 'success', 'succeeded', 'active'].includes((tx.status || '').toLowerCase())
                            ? 'SUCCESS'
                            : ['refunded', 'reversed', 'canceled', 'cancelled'].includes((tx.status || '').toLowerCase())
                            ? 'REFUNDED'
                            : (tx.status || '').toLowerCase() === 'offline_pending'
                            ? 'PENDING UTR'
                            : (tx.status || '').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isSuperAdmin && (
                            <>
                              {['completed', 'paid', 'success', 'succeeded', 'active'].includes((tx.status || '').toLowerCase()) ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(tx.id, 'refunded', tx.transaction_id)}
                                  className="p-1.5 rounded-md border border-amber-200 dark:border-amber-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                                  title="Refund / Revert Transaction"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(tx.id, 'success', tx.transaction_id)}
                                  className="p-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                                  title="Mark as Success / Settled"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmTarget({ id: tx.id, ref: tx.transaction_id })}
                                className="p-1.5 rounded-md border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                                title="Delete Transaction"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopy(tx.transaction_id)}
                            className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Copy Transaction Reference"
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
                  <td colSpan={isSuperAdmin ? 9 : 8} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                    <History className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No Transactions Recorded</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {searchQuery ? 'Try clearing your search filters' : 'Financial ledger events will appear here in real time.'}
                    </p>
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
          title={deleteConfirmTarget === 'bulk' ? `Delete ${selectedIds.length} Transactions?` : `Delete Transaction ${deleteConfirmTarget.ref}?`}
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
                    handleDeleteTransaction(deleteConfirmTarget.id, deleteConfirmTarget.ref);
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
                    ? `You are about to permanently delete ${selectedIds.length} transaction ledger records and any associated invoices. This action cannot be reversed.`
                    : `You are about to permanently delete transaction record ${deleteConfirmTarget.ref} and its linked invoice. This action is irreversible.`}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TransactionsTab;
