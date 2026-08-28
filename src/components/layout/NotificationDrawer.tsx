import React from 'react';
import { Sheet } from '../ui/Sheet';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PhoneCall, AlertTriangle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const notifications = [
    {
      id: 'n1',
      title: 'High Call Volume Alert',
      desc: 'Campaign Q3 Outbound Blast reached 85% concurrent line capacity.',
      time: '2 mins ago',
      type: 'warning',
      icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    },
    {
      id: 'n2',
      title: 'Demo Scheduled by Agent Sophia',
      desc: 'David Miller (Acme Corp) scheduled a 20-min demo for Thursday 2:00 PM EST.',
      time: '12 mins ago',
      type: 'success',
      icon: <PhoneCall className="h-4 w-4 text-emerald-500" />,
    },
    {
      id: 'n3',
      title: 'Knowledge Base Synced',
      desc: 'Docs auto-indexer finished parsing 420 vector chunks from Manual v4.2.pdf.',
      time: '1 hour ago',
      type: 'info',
      icon: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
    },
    {
      id: 'n4',
      title: 'Workflow Execution Triggered',
      desc: 'Post-Call CRM Sync pushed 15 qualified lead records to HubSpot.',
      time: '3 hours ago',
      type: 'info',
      icon: <Zap className="h-4 w-4 text-purple-500" />,
    },
  ];

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
          <Badge variant="primary">3 Unread Alerts</Badge>
          <Button variant="ghost" size="sm">
            Mark all read
          </Button>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border-y border-zinc-100 dark:border-zinc-800">
          {notifications.map((n) => (
            <div key={n.id} className="py-3.5 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 p-2 rounded-lg transition-colors">
              <div className="mt-0.5 p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {n.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-zinc-400 shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                  {n.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
};
