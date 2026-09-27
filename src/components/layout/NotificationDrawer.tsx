import React, { useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Bell,
  Check,
  Trash2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationItem, ScreenId } from '../../types';

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (screen: ScreenId) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const {
    notifications,
    unreadCount,
    categoryCounts,
    markAllAsRead,
    markAsRead,
    deleteNotification,
  } = useNotifications();

  const getNotificationIcon = (n: NotificationItem) => {
    if (n.type === 'error') {
      return <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />;
    }
    if (n.type === 'warning') {
      return <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
    }
    if (n.category === 'calls') {
      return <PhoneCall className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
    }
    if (n.category === 'telephony') {
      return <Zap className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
    }
    if (n.category === 'security') {
      return <ShieldCheck className="h-4 w-4 text-rose-500 dark:text-rose-400" />;
    }
    if (n.category === 'billing') {
      return <Zap className="h-4 w-4 text-purple-500 dark:text-purple-400" />;
    }
    return <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
  };

  const resolveNavigationTarget = (n: NotificationItem): ScreenId => {
    if (n.category === 'calls') return 'call-history';
    if (n.category === 'telephony') return 'android-gateway';
    if (n.category === 'billing') return 'billing';
    if (n.category === 'security') return 'api-keys';
    if (n.title.toLowerCase().includes('knowledge') || n.title.toLowerCase().includes('vector')) {
      return 'knowledge-base';
    }
    return 'notifications';
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.category === activeFilter;
  });

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Center"
      description="Realtime telephony events, AI call logs, and system triggers"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={unreadCount > 0 ? 'primary' : 'outline'} size="sm">
              {unreadCount > 0 ? `${unreadCount} Unread Alerts` : 'All Caught Up'}
            </Badge>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              leftIcon={<Check className="h-3.5 w-3.5" />}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All', count: categoryCounts.all },
            { id: 'calls', label: 'Calls', count: categoryCounts.calls },
            { id: 'telephony', label: 'GSM', count: categoryCounts.telephony },
            { id: 'system', label: 'System', count: categoryCounts.system },
            { id: 'billing', label: 'Billing', count: categoryCounts.billing },
            { id: 'security', label: 'Security', count: categoryCounts.security },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0 ${
                activeFilter === tab.id
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border-y border-zinc-100 dark:border-zinc-800 max-h-[calc(100vh-280px)] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 space-y-2">
              <div className="mx-auto h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Bell className="h-5 w-5 opacity-50" />
              </div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                No active notifications in this category
              </p>
              <p className="text-[11px] text-zinc-400">
                Telephony channels and AI voice pipelines are running smoothly.
              </p>
            </div>
          ) : (
            filtered.map((n) => {
              const isUnread = !n.read && !n.is_read;
              const targetScreen = resolveNavigationTarget(n);

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (isUnread) {
                      markAsRead(n.id);
                    }
                    if (onNavigate && targetScreen !== 'notifications') {
                      onNavigate(targetScreen);
                      onClose();
                    }
                  }}
                  className={`py-3.5 px-2.5 flex items-start gap-3 rounded-lg transition-colors group cursor-pointer ${
                    isUnread
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200/50 dark:border-zinc-700/50">
                    {getNotificationIcon(n)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {n.title}
                        </h4>
                        {isUnread && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                        )}
                        {(n.is_super_admin || n.sender_role === 'super_admin' || n.is_broadcast) && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            <ShieldCheck className="h-2.5 w-2.5 text-amber-500" />
                            From Super Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                        {n.time || 'Recently'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-normal break-words line-clamp-2">
                      {n.desc || n.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 rounded transition-opacity"
                    title="Dismiss notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-2 flex items-center justify-between gap-2">
          {onNavigate && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
              onClick={() => {
                onNavigate('notifications');
                onClose();
              }}
            >
              Open Full Notification Center
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
};
