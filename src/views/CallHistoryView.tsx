import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall,
  Play,
  Pause,
  Trash2,
  FileText,
  Download,
  Volume2,
  VolumeX,
  Edit2,
  Check,
  Tag,
  Share2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { DataTable, Column } from '../components/ui/DataTable';
import { CallLog } from '../types';
import { callHistoryRepository } from '../repository';
import { useToast } from '../components/ui/Toast';

export const CallHistoryView: React.FC = () => {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0); // 0 to 100%
  const [volume, setVolume] = useState(80); // 0 to 100%
  const [isMuted, setIsMuted] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);

  // Editable Notes and Tags State
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [tagInput, setTagInput] = useState('');

  const timerRef = useRef<any>(null);
  const { addToast } = useToast();

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await callHistoryRepository.getAll();
      setCallLogs(data);
      if (data.length > 0 && !selectedCall) {
        setSelectedCall(data[0]);
        setNotesText(data[0].summary || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load call logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (selectedCall) {
      setNotesText(selectedCall.summary || '');
      setIsPlaying(false);
      setAudioProgress(0);
      setCurrentTimeSec(0);
    }
  }, [selectedCall?.id]);

  // Simulated audio playback ticker
  useEffect(() => {
    if (isPlaying && selectedCall) {
      const duration = selectedCall.durationSeconds || 60;
      timerRef.current = setInterval(() => {
        setCurrentTimeSec((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            setAudioProgress(100);
            return duration;
          }
          const next = prev + 1;
          setAudioProgress((next / duration) * 100);
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, selectedCall]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setAudioProgress(val);
    if (selectedCall) {
      const dur = selectedCall.durationSeconds || 60;
      setCurrentTimeSec(Math.floor((val / 100) * dur));
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedCall) return;
    try {
      const updated = await callHistoryRepository.update(selectedCall.id, {
        summary: notesText,
      });
      setCallLogs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelectedCall(updated);
      setIsEditingNotes(false);
      addToast({
        type: 'success',
        title: 'Notes Saved',
        description: `Updated notes for Call #${updated.id}.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', description: err.message });
    }
  };

  const handleDownloadTranscript = () => {
    if (!selectedCall) return;
    const content = `CALL TRANSCRIPT #${selectedCall.id}\nContact: ${selectedCall.contactName} (${selectedCall.contactPhone})\nAgent: ${selectedCall.agentName}\nDate: ${selectedCall.timestamp}\nDuration: ${selectedCall.durationSeconds}s\n\nSUMMARY:\n${selectedCall.summary}\n\nTRANSCRIPT:\n` +
      selectedCall.transcript.map((t) => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_call_${selectedCall.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Downloaded Transcript',
      description: `Saved transcript_call_${selectedCall.id}.txt.`,
    });
  };

  const handleDeleteCall = async (id: string) => {
    const deletedRecord = callLogs.find((c) => c.id === id);
    if (!deletedRecord) return;

    setCallLogs((prev) => prev.filter((c) => c.id !== id));
    if (selectedCall?.id === id) {
      setSelectedCall(null);
    }

    try {
      await callHistoryRepository.delete(id);
    } catch (err: any) {
      setCallLogs((prev) => [deletedRecord, ...prev]);
      addToast({ type: 'error', title: 'Delete Failed', description: err.message });
      return;
    }

    addToast({
      type: 'info',
      title: 'Call Record Deleted',
      description: `Record #${id} removed.`,
      action: {
        label: 'Undo',
        onClick: async () => {
          try {
            const restored = await callHistoryRepository.create(deletedRecord);
            setCallLogs((prev) => [restored, ...prev]);
            setSelectedCall(restored);
            addToast({ type: 'success', title: 'Record Restored', description: `Call record restored.` });
          } catch (e: any) {
            addToast({ type: 'error', title: 'Undo Failed', description: e.message });
          }
        },
      },
    });
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await callHistoryRepository.deleteBulk(ids);
      setCallLogs((prev) => prev.filter((c) => !ids.includes(c.id)));
      addToast({ type: 'success', title: 'Bulk Delete Complete', description: `Deleted ${ids.length} call records.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Bulk Delete Failed', description: err.message });
    }
  };

  const columns: Column<CallLog>[] = [
    {
      key: 'contactName',
      header: 'Contact Name',
      sortable: true,
      render: (log) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
            <PhoneCall className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{log.contactName}</p>
            <p className="text-[11px] text-zinc-400">{log.contactPhone}</p>
          </div>
        </div>
      ),
    },
    { key: 'agentName', header: 'Agent', sortable: true },
    { key: 'direction', header: 'Direction', sortable: true },
    {
      key: 'sentiment',
      header: 'Sentiment',
      sortable: true,
      render: (log) => (
        <Badge
          variant={
            log.sentiment === 'positive'
              ? 'success'
              : log.sentiment === 'negative'
              ? 'danger'
              : 'default'
          }
          size="sm"
        >
          {log.sentiment}
        </Badge>
      ),
    },
    {
      key: 'durationSeconds',
      header: 'Duration',
      sortable: true,
      render: (log) => (
        <span className="font-mono text-xs">
          {Math.floor(log.durationSeconds / 60)}m {log.durationSeconds % 60}s
        </span>
      ),
    },
    {
      key: 'cost',
      header: 'Cost',
      sortable: true,
      render: (log) => <span className="font-mono text-xs">${log.cost.toFixed(3)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (log) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<FileText className="h-3.5 w-3.5" />}
            onClick={() => setSelectedCall(log)}
          >
            Inspect
          </Button>
          <Button
            size="sm"
            variant="danger"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => handleDeleteCall(log.id)}
          />
        </div>
      ),
    },
  ];

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Call History & AI Transcripts
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Review processed calls, sentiment ratings, audio recordings, and speaker turn-by-turn transcripts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={callLogs}
            isLoading={isLoading}
            error={error}
            onRetry={loadLogs}
            onBulkDelete={handleBulkDelete}
            searchPlaceholder="Search calls by contact, agent, phone, summary..."
            filterableKeys={[
              { label: 'Sentiment', key: 'sentiment', options: ['positive', 'neutral', 'negative'] },
              { label: 'Direction', key: 'direction', options: ['inbound', 'outbound'] },
            ]}
          />
        </div>

        {/* Call Detail Sidebar */}
        <div>
          {selectedCall ? (
            <Card className="sticky top-20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="primary">Call #{selectedCall.id}</Badge>
                  <span className="text-xs text-zinc-400">{selectedCall.timestamp}</span>
                </div>
                <CardTitle className="mt-2">{selectedCall.contactName}</CardTitle>
                <p className="text-xs text-zinc-500">
                  Agent: <strong className="text-zinc-800 dark:text-zinc-200">{selectedCall.agentName}</strong>
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Audio Recording Player Controls */}
                <div className="p-4 bg-zinc-900 text-zinc-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400">Recording Stream</span>
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Download className="h-3 w-3" />}
                      onClick={() => {
                        addToast({
                          type: 'success',
                          title: 'Downloading Audio',
                          description: `Downloading call_recording_${selectedCall.id}.mp3`,
                        });
                      }}
                    >
                      Download MP3
                    </Button>
                  </div>

                  {/* Play/Pause & Time Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 transition-all shadow-md"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                        <span>{formatTime(currentTimeSec)}</span>
                        <span>{formatTime(selectedCall.durationSeconds || 60)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={audioProgress}
                        onChange={handleSeek}
                        className="w-full accent-blue-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Volume toggle */}
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-zinc-400 hover:text-white"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Waveform Visualization */}
                  <div className="flex items-center gap-1 h-6 px-1">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          isPlaying ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700'
                        }`}
                        style={{
                          height: isPlaying
                            ? `${Math.max(20, (Math.sin(i * 0.8 + currentTimeSec) + 1) * 50)}%`
                            : '25%',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* AI Summary & Edit Notes */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">AI Call Summary & Notes:</p>
                    {isEditingNotes ? (
                      <Button size="sm" variant="primary" leftIcon={<Check className="h-3 w-3" />} onClick={handleSaveNotes}>
                        Save
                      </Button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingNotes(true)}
                        className="text-blue-600 text-[11px] font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Edit2 className="h-3 w-3" /> Edit Notes
                      </button>
                    )}
                  </div>

                  {isEditingNotes ? (
                    <textarea
                      rows={3}
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none"
                    />
                  ) : (
                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">{selectedCall.summary}</p>
                  )}
                </div>

                {/* Speaker Transcript */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Transcript:</p>
                    <button
                      type="button"
                      onClick={handleDownloadTranscript}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" /> Export TXT
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs">
                    {selectedCall.transcript.map((t, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg ${
                          t.speaker === 'AI'
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 text-[10px] opacity-75">
                          <span className="font-bold">{t.speaker}</span>
                          <span>{t.time}</span>
                        </div>
                        <p>{t.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-zinc-500 text-xs">
                Select a call log to inspect recording and speaker transcript.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
