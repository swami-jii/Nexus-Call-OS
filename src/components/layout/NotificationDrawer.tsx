import React from 'react';
import { Sheet } from '../ui/Sheet';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PhoneCall, AlertTriangle, CheckCircle2, ShieldCheck, Zap, Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationItem } from '../../types';

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (screen: any) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAllAsRead, markAsRead, deleteNotification } = useNotifications();

  const getNotificationIcon = (n: NotificationItem) => {
    if (n.type === 'warning' || n.type === 'error') {
      return <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
    }
    if (n.category === 'calls' || n.category === 'telephony') {
      return <PhoneCall className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
    }
    if (n.category === 'security') {
      return <ShieldCheck className="h-4 w-4 text-purple-500 dark:text-purple-400" />;
    }
    if (n.category === 'billing') {
      return <Zap className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
    }
    return <CheckCircle2 className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
  };

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
          <Badge variant={unreadCount > 0 ? 'primary' : 'outline'} size="sm">
            {unreadCount > 0 ? `${unreadCount} Unread Alerts` : 'All Caught Up'}
          </Badge>
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

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border-y border-zinc-100 dark:border-zinc-800">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 space-y-2">
              <div className="mx-auto h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Bell className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium">No active notifications</p>
              <p className="text-[11px] text-zinc-400">
                Telephony channels and AI voice pipelines are running normally.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.read && !n.is_read) {
                    markAsRead(n.id);
                  }
                }}
                className={`py-3.5 px-2 flex items-start gap-3 rounded-lg transition-colors group cursor-pointer ${
                  !n.read && !n.is_read
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0">
                  {getNotificationIcon(n)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {n.title}
                      </h4>
                      {!n.read && !n.is_read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                      {n.time || 'Recently'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-normal break-words">
                    {n.desc || n.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(n.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 rounded transition-opacity"
                  title="Dismiss notification"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Sheet>
  );
};
