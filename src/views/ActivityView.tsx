import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { AuditActivity } from '../types';
import { fetchAPI } from '../lib/api';

export const ActivityView: React.FC = () => {
  const [logs, setLogs] = useState<AuditActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchAPI('/api/audit-logs')
      .then((res) => {
        const mapped: AuditActivity[] = (res.items || []).map((item: any) => ({
          id: item.id,
          user: item.user_email || 'System / Admin',
          action: item.action || 'API Request',
          target: item.resource || '/api',
          ip: item.ip_address || '127.0.0.1',
          timestamp: item.timestamp ? new Date(item.timestamp).toLocaleString() : new Date().toLocaleString(),
        }));
        setLogs(mapped);
      })
      .catch((err) => console.error('Audit logs fetch error:', err))
      .finally(() => setLoading(false));
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
      render: (row) => <span className="font-mono text-xs">{row.target}</span>,
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
      <div>
        <h2 className="text-xl font-bold tracking-tight">Audit Activity Log</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Complete compliance trail recording API key generations, prompt updates, and SIP trunk scalings.
        </p>
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
