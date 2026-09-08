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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Audit Activity Log</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Complete compliance trail recording API key generations, prompt updates, carrier status, and telephony operations.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          isLoading={loading}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Refresh Log
        </Button>
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
