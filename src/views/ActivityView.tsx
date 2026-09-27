import React, { useEffect, useState } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AuditActivity } from '../types';
import { fetchAPI } from '../lib/api';

export const ActivityView: React.FC = () => {
  const [logs, setLogs] = useState<AuditActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = () => {
    setLoading(true);
    fetchAPI('/api/audit-logs?page_size=50')
      .then((res) => {
        const items = res.items || (Array.isArray(res) ? res : []);
        const mapped: AuditActivity[] = items.map((item: any) => ({
          id: item.id,
          user: item.user_email || item.user || 'Admin Super User',
          action: item.action || 'API Operation',
          target: item.resource || '/api',
          ip: item.ip_address || '127.0.0.1',
          timestamp: item.created_at || item.timestamp
            ? new Date(item.created_at || item.timestamp).toLocaleString()
            : new Date().toLocaleString(),
        }));
        setLogs(mapped);
      })
      .catch((err) => console.error('Audit logs fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns: Column<AuditActivity>[] = [
    {
      key: 'user',
      header: 'Operator / System',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{row.user}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action Performed',
      sortable: true,
      render: (row) => <Badge variant="primary" size="sm">{row.action}</Badge>,
    },
    {
      key: 'target',
      header: 'Target Resource',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{row.target}</span>,
    },
    {
      key: 'ip',
      header: 'IP Address',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-zinc-400">{row.ip}</span>,
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (row) => <span className="text-xs text-zinc-500">{row.timestamp}</span>,
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="space-y-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5 shrink-0">
        {/* ROW 1: Heading on Left + Badges on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/25 shrink-0">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap leading-none">
              Audit Activity Log
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Badge variant="emerald" className="text-xs shadow-2xs whitespace-nowrap">
              Sovereign Audit Trail
            </Badge>
          </div>
        </div>

        {/* ROW 2: Description on Left + Action Buttons on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Complete compliance trail recording API key generations, prompt updates, carrier status, and telephony operations.
          </p>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              isLoading={loading}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              className="h-7.5 text-xs font-semibold px-2.5 shadow-2xs"
            >
              Refresh Log
            </Button>
          </div>
        </div>
      </div>

      <DataTable
        title="System Operations Trail"
        description="Tamper-evident log of workspace administrative actions"
        columns={columns}
        data={logs}
        searchPlaceholder="Search audit log records..."
      />
    </div>
  );
};
