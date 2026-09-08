import React, { useState, useEffect } from 'react';
import { Terminal, Pause, Play, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SystemLog } from '../types';
import { fetchAPI } from '../lib/api';

export const LogsView: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const [sessData, auditData, callsData] = await Promise.all([
          fetchAPI('/api/live-sessions').catch(() => ({ sessions: [] })),
          fetchAPI('/api/audit-logs?page_size=30').catch(() => ({ items: [] })),
          fetchAPI('/api/calls?page_size=15').catch(() => ({ items: [] })),
        ]);

        const generated: SystemLog[] = [];

        // 1. Live sessions logs
        (sessData.sessions || []).forEach((s: any) => {
          (s.transcript || []).forEach((t: any, idx: number) => {
            generated.push({
              id: `log_sess_${s.call_id}_${idx}`,
              timestamp: t.timestamp || t.time || new Date().toLocaleTimeString(),
              level: 'INFO',
              component: 'VOICE_PIPELINE',
              message: `Live Call ${s.call_id?.slice(0, 8)} [${t.speaker || 'AI'}]: ${t.text}`,
            });
          });
        });

        // 2. Real call logs transcripts & completion events
        const calls = Array.isArray(callsData) ? callsData : (callsData.items || []);
        calls.forEach((c: any) => {
          const tDate = c.created_at ? new Date(c.created_at).toLocaleTimeString() : new Date().toLocaleTimeString();
          generated.push({
            id: `log_call_${c.id}`,
            timestamp: tDate,
            level: c.status === 'failed' ? 'ERROR' : 'INFO',
            component: 'SIP_TELEPHONY',
            message: `Call to ${c.phone_number || c.contact_name} (${c.duration || 0}s) - Sentiment: ${c.sentiment || 'Positive'} - Status: ${c.status || 'completed'}`,
          });
        });

        // 3. Real audit logs
        const audits = Array.isArray(auditData) ? auditData : (auditData.items || []);
        audits.forEach((a: any) => {
          const aDate = a.timestamp || a.created_at ? new Date(a.timestamp || a.created_at).toLocaleTimeString() : new Date().toLocaleTimeString();
          generated.push({
            id: `log_audit_${a.id}`,
            timestamp: aDate,
            level: 'INFO',
            component: 'AUDIT_GATEWAY',
            message: `[${a.action}] Resource: ${a.resource} by ${a.user_email || a.user || 'Admin'} (IP: ${a.ip_address || a.ip || '127.0.0.1'})`,
          });
        });

        if (generated.length > 0) {
          setLogs(generated);
        }
      } catch (err) {
        console.warn('Log stream poll error:', err);
      }
    };

    fetchLogs();
    if (!isStreaming) return;
    const interval = setInterval(fetchLogs, 3000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const filteredLogs = logs.filter((l) => {
    if (filterLevel === 'ALL') return true;
    return l.level === filterLevel;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Realtime Terminal Execution Logs</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Live WebRTC frame decoding, LLM token streaming latency, SIP carrier debug events, and workspace audit operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isStreaming ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setIsStreaming(!isStreaming)}
            leftIcon={isStreaming ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
          >
            {isStreaming ? 'Streaming Live' : 'Resume Stream'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLogs([])} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
            Clear
          </Button>
        </div>
      </div>

      <Card className="bg-zinc-950 text-zinc-100 border-zinc-800">
        <CardHeader className="border-b border-zinc-800 flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-blue-400" />
            <CardTitle className="text-xs font-mono text-zinc-200">createcall-telephony-core.log</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="h-7 px-2 text-[11px] font-mono rounded bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none"
            >
              <option value="ALL">ALL LEVELS</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="DEBUG">DEBUG</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-4 font-mono text-xs max-h-96 overflow-y-auto space-y-2 scrollbar-thin">
          {filteredLogs.length === 0 ? (
            <p className="text-zinc-500 italic">No active voice telemetry logs recorded.</p>
          ) : (
            filteredLogs.map((l) => {
              const levelColors: Record<SystemLog['level'], string> = {
                INFO: 'text-blue-400',
                WARN: 'text-amber-400',
                ERROR: 'text-red-400 font-bold',
                DEBUG: 'text-zinc-500',
              };
              return (
                <div key={l.id} className="flex items-start gap-3 hover:bg-zinc-900/80 p-1 rounded transition-colors">
                  <span className="text-zinc-500 shrink-0 font-mono">{l.timestamp}</span>
                  <span className={`shrink-0 w-14 font-bold ${levelColors[l.level]}`}>[{l.level}]</span>
                  <span className="text-zinc-400 shrink-0 font-semibold">[{l.component}]</span>
                  <span className="text-zinc-200 break-all flex-1">{l.message}</span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
