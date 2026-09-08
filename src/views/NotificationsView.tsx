import React, { useState } from 'react';
import { Bell, Check, Trash2, Search, PhoneCall, Zap, ShieldAlert, CreditCard, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { useToast } from '../components/ui/Toast';
import { useNotifications } from '../context/NotificationContext';
import { NotificationItem } from '../types';

export const NotificationsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    clearAll,
    fetchNotifications,
  } = useNotifications();

  const { addToast } = useToast();

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    addToast({
      type: 'info',
      title: 'Notifications Cleared',
      description: 'All pending alerts marked as read.',
    });
  };

  const handleDelete = async (id: string, title: string) => {
    await deleteNotification(id);
    addToast({
      type: 'info',
      title: 'Notification Dismissed',
      description: `Removed "${title}".`,
    });
  };

  const handleClearAll = async () => {
    await clearAll();
    addToast({
      type: 'info',
      title: 'All Notifications Cleared',
      description: 'Workspace notification history has been reset.',
    });
  };

  const filtered = notifications.filter((n) => {
    const matchesTab = activeTab === 'all' || n.category === activeTab;
    const matchesQuery =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.desc || n.message || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getCategoryIcon = (category: string, type: string) => {
    if (type === 'warning' || type === 'error') {
      return <ShieldAlert className="h-4 w-4 text-amber-500" />;
    }
    switch (category) {
      case 'telephony':
        return <Zap className="h-4 w-4 text-amber-500" />;
      case 'calls':
        return <PhoneCall className="h-4 w-4 text-blue-500" />;
      case 'billing':
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      case 'security':
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Notification Center
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Realtime alerts covering call completions, trunk capacity, GSM gateway status, and vector index syncs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleMarkAllRead}
              leftIcon={<Check className="h-3.5 w-3.5" />}
            >
              Mark All Read ({unreadCount})
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Tabs
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            setPage(1);
          }}
          variant="pills"
          tabs={[
            { id: 'all', label: 'All Alerts', badge: notifications.length },
            { id: 'calls', label: 'AI Calls' },
            { id: 'telephony', label: 'Telephony & GSM' },
            { id: 'system', label: 'System' },
            { id: 'billing', label: 'Billing' },
            { id: 'security', label: 'Security' },
          ]}
        />
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search alerts..."
            leftIcon={<Search className="h-3.5 w-3.5" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-zinc-100 dark:divide-zinc-800">
          {paginated.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
              <Bell className="h-6 w-6 mx-auto text-zinc-400 opacity-50" />
              <p className="font-medium">No notifications matching current criteria.</p>
              <p className="text-[11px]">New incoming call and system events will appear here in real time.</p>
            </div>
          ) : (
            paginated.map((n) => {
              const isUnread = !n.read && !n.is_read;
              return (
                <div
                  key={n.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isUnread
                      ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/60 dark:hover:bg-blue-950/30'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="mt-0.5 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0">
                      {getCategoryIcon(n.category, n.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`text-xs sm:text-sm font-semibold ${
                            isUnread
                              ? 'text-zinc-900 dark:text-zinc-100'
                              : 'text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {n.title}
                        </h4>
                        {isUnread && (
                          <Badge variant="primary" size="sm">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-normal">
                        {n.desc || n.message}
                      </p>
                      <span className="text-[10px] text-zinc-400 mt-1 block font-mono">
                        {n.time || 'Recently'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isUnread && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(n.id)}
                        leftIcon={<Check className="h-3.5 w-3.5" />}
                      >
                        Mark Read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => handleDelete(n.id, n.title)}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span>
              Page {page} of {totalPages} ({filtered.length} total)
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
