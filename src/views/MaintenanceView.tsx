import React from 'react';
import { Wrench, ShieldAlert, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';

export const MaintenanceView: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center animate-bounce">
        <Wrench className="h-8 w-8" />
      </div>
      <Badge variant="warning">Scheduled Infrastructure Upgrade</Badge>
      <h2 className="text-2xl font-bold tracking-tight">Telephony Kernel Maintenance</h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
        We are upgrading our sub-300ms WebRTC voice processing containers. Active calls continue running uninterrupted via standby backup SIP trunks.
      </p>

      <div className="w-full max-w-md p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 text-left">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-zinc-500">Upgrade Progress</span>
          <span className="font-mono font-bold text-blue-600">75% Complete</span>
        </div>
        <Progress value={75} max={100} color="blue" />
        <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Estimated Completion: 14 Minutes
        </p>
      </div>
    </div>
  );
};
