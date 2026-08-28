import React, { useState, useEffect } from 'react';
import { Terminal, Pause, Play } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SystemLog } from '../types';
import { fetchAPI } from '../lib/api';

export const LogsView: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  useEffect(() => {
    const fetchLogs = () => {
      fetchAPI('/api/live-sessions')
        .then((data) => {
          const sessions = data.sessions || [];
          const generated: SystemLog[] = [];
          sessions.forEach((s: any) => {
            (s.transcript || []).forEach((t: any, idx: number) => {
              generated.push({
                id: `log_${s.call_id}_${idx}`,
                timestamp: t.timestamp || new Date().toLocaleTimeString(),
                level: 'INFO',
                component: 'VOICE_PIPELINE',
                message: `Call ${s.call_id} [${t.speaker}]: ${t.text}`,
              });
            });
          });

          if (generated.length > 0) {
            setLogs(generated.reverse());
          }
        })
        .catch(() => {});
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
            Live WebRTC frame decoding, LLM token streaming latency, and SIP carrier debug events.
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
          <Button variant="outline" size="sm" onClick={() => setLogs([])}>
            Clear
          </Button>
        </div>
      </div>

      <Card className="bg-zinc-950 text-zinc-100 border-zinc-800">
        <CardHeader className="border-b border-zinc-800 flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-blue-400" />
            <CardTitle className="text-xs font-mono text-zinc-200">nexus-telephony-core.log</CardTitle>
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
                  <span className="text-zinc-500 shrink-0">{l.timestamp}</span>
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
