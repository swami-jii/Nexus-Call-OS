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
  X,
  User,
  Brain,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { DataTable, Column } from '../components/ui/DataTable';
import { CallLog } from '../types';
import { callHistoryRepository } from '../repository';
import { useToast } from '../components/ui/Toast';

export const CallHistoryView: React.FC = () => {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inspection Drawer State
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [isInspectDrawerOpen, setIsInspectDrawerOpen] = useState(false);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0); // 0 to 100%
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);

  // Editable Notes State
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  const timerRef = useRef<any>(null);
  const { addToast } = useToast();

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await callHistoryRepository.getAll();
      setCallLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load call logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const historyAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (selectedCall) {
      setNotesText(selectedCall.summary || 'Call summary not available');
      if (historyAudioRef.current) {
        try {
          historyAudioRef.current.pause();
        } catch {}
        historyAudioRef.current = null;
      }
      setIsPlaying(false);
      setAudioProgress(0);
      setCurrentTimeSec(0);
    }
  }, [selectedCall?.id]);

  // Audio Playback & Progress handler
  const toggleHistoryAudioPlay = () => {
    if (!selectedCall) return;

    if (isPlaying) {
      if (historyAudioRef.current) {
        historyAudioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    let recUrl = (selectedCall as any).recording_url || selectedCall.recordingUrl;
    if (!recUrl || recUrl.includes('api.nexuscalling.com')) {
      recUrl = `/api/demo/recordings/${selectedCall.id}.mp3`;
    }

    try {
      if (historyAudioRef.current) {
        historyAudioRef.current.pause();
        historyAudioRef.current = null;
      }

      const audio = new Audio(recUrl);
      historyAudioRef.current = audio;
      setIsPlaying(true);

      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setCurrentTimeSec(Math.floor(audio.currentTime));
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      audio.onended = () => {
        setIsPlaying(false);
        setAudioProgress(0);
        setCurrentTimeSec(0);
        historyAudioRef.current = null;
      };
      audio.onerror = () => {
        console.warn('Real recording audio not reachable, falling back to visual playback timer');
      };

      audio.play().catch(() => {});
    } catch {
      setIsPlaying(true);
    }
  };

  // Fallback timer when real audio element is buffering or unavailable
  useEffect(() => {
    if (isPlaying && selectedCall && !historyAudioRef.current) {
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
      const targetSec = Math.floor((val / 100) * dur);
      setCurrentTimeSec(targetSec);
      if (historyAudioRef.current && historyAudioRef.current.duration) {
        historyAudioRef.current.currentTime = (val / 100) * historyAudioRef.current.duration;
      }
    }
  };

  const handleDownloadMp3 = () => {
    if (!selectedCall) return;
    let recUrl = (selectedCall as any).recording_url || selectedCall.recordingUrl;
    if (!recUrl || recUrl.includes('api.nexuscalling.com')) {
      recUrl = `/api/demo/recordings/${selectedCall.id}.mp3`;
    }

    const a = document.createElement('a');
    a.href = recUrl;
    a.download = `call_recording_${selectedCall.id}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    addToast({
      type: 'success',
      title: 'Downloading Recording',
      description: `Downloading call_recording_${selectedCall.id}.mp3`,
    });
  };

  const handleOpenInspect = (log: CallLog) => {
    setSelectedCall(log);
    setIsInspectDrawerOpen(true);
  };

  const handleCloseInspect = () => {
    setIsInspectDrawerOpen(false);
    setIsPlaying(false);
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
    const content =
      `CALL TRANSCRIPT #${selectedCall.id}\nContact: ${selectedCall.contactName} (${selectedCall.contactPhone})\nAgent: ${selectedCall.agentName}\nDate: ${selectedCall.timestamp}\nDuration: ${selectedCall.durationSeconds}s\n\nSUMMARY:\n${selectedCall.summary}\n\nTRANSCRIPT:\n` +
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

    try {
      await callHistoryRepository.delete(id);
      setCallLogs((prev) => prev.filter((c) => c.id !== id));
      if (selectedCall?.id === id) {
        setIsInspectDrawerOpen(false);
        setSelectedCall(null);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', description: err.message });
      return;
    }

    addToast({
      type: 'info',
      title: 'Call Record Deleted',
      description: `Record #${id} removed.`,
    });
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await callHistoryRepository.deleteBulk(ids);
      setCallLogs((prev) => prev.filter((c) => !ids.includes(c.id)));
      if (selectedCall && ids.includes(selectedCall.id)) {
        setIsInspectDrawerOpen(false);
        setSelectedCall(null);
      }
      addToast({ type: 'success', title: 'Bulk Delete Complete', description: `Deleted ${ids.length} call records.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Bulk Delete Failed', description: err.message });
    }
  };

  // Clean Single-Line Column Definitions
  const columns: Column<CallLog>[] = [
    {
      key: 'contactName',
      header: 'Contact & Phone',
      sortable: true,
      render: (log) => {
        const isMicTest =
          log.contactName?.toLowerCase().includes('browser mic') ||
          log.contactPhone?.toUpperCase().includes('MIC') ||
          log.contactPhone?.toUpperCase().includes('BROWSER');
        return (
          <div className="flex items-center gap-3 whitespace-nowrap min-w-[200px]">
            <div className={`h-8 w-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
              isMicTest
                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
            }`}>
              <PhoneCall className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-zinc-900 dark:text-zinc-100 whitespace-nowrap truncate">
                <span>{log.contactName || (isMicTest ? 'Test Browser Mic 1' : 'Direct Caller')}</span>
                {isMicTest && (
                  <Badge variant="blue" size="sm" className="text-[9px] py-0 px-1 font-semibold">
                    Web Mic
                  </Badge>
                )}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 font-semibold whitespace-nowrap">
                {log.contactPhone || (isMicTest ? 'TEST-BROWSER-MIC-01' : '+18005550199')}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'agentName',
      header: 'AI Agent Stack',
      sortable: true,
      render: (log) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Brain className="h-3.5 w-3.5 text-purple-500 shrink-0" />
          <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
            {log.agentName || 'Nikita (AI Voice)'}
          </span>
        </div>
      ),
    },
    {
      key: 'direction',
      header: 'Direction',
      sortable: true,
      render: (log) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold whitespace-nowrap border ${
            log.direction === 'inbound'
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
          }`}
        >
          {log.direction === 'inbound' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
          <span className="capitalize">{log.direction}</span>
        </span>
      ),
    },
    {
      key: 'sentiment',
      header: 'Sentiment',
      sortable: true,
      render: (log) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold whitespace-nowrap border ${
            log.sentiment === 'positive'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : log.sentiment === 'negative'
              ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
          }`}
        >
          <span className="capitalize">{log.sentiment}</span>
        </span>
      ),
    },
    {
      key: 'durationSeconds',
      header: 'Duration',
      sortable: true,
      render: (log) => (
        <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap flex items-center gap-1">
          <Clock className="h-3 w-3 text-zinc-400" />
          <span>
            {Math.floor(log.durationSeconds / 60)}m {log.durationSeconds % 60}s
          </span>
        </span>
      ),
    },
    {
      key: 'cost',
      header: 'Cost',
      sortable: true,
      render: (log) => (
        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
          ${log.cost.toFixed(3)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (log) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap justify-end">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 cursor-pointer shadow-2xs whitespace-nowrap"
            leftIcon={<FileText className="h-3.5 w-3.5 text-emerald-500" />}
            onClick={() => handleOpenInspect(log)}
          >
            Inspect
          </Button>
          <button
            type="button"
            onClick={() => handleDeleteCall(log.id)}
            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
            title="Delete Record"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
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
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Call History & AI Transcripts
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Review processed calls, sentiment ratings, audio recordings, and speaker turn-by-turn transcripts.
        </p>
      </div>

      {/* 100% Full-Width Clean Table (Zero Horizontal Squeeze) */}
      <div className="w-full">
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

      {/* Ultra-Premium Floating Glassmorphic Slide-Over Inspection Drawer with Rounded 3XL Curvature */}
      {isInspectDrawerOpen && selectedCall && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseInspect();
          }}
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-2 sm:p-4"
        >
          <div
            className="w-full max-w-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl h-full shadow-2xl border border-zinc-200/90 dark:border-zinc-800/90 rounded-3xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right-8 duration-300 ease-out"
          >
            {/* Drawer Header */}
            <div className="p-4.5 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-3 bg-gradient-to-r from-zinc-50/90 to-white/90 dark:from-zinc-900/90 dark:to-zinc-950">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                      Call #{selectedCall.id}
                    </span>
                    <Badge variant={selectedCall.sentiment === 'positive' ? 'success' : 'outline'} size="sm" className="text-[9px] py-0 uppercase font-bold">
                      {selectedCall.sentiment}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono block truncate">{selectedCall.timestamp}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseInspect}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Close Inspector"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Drawer Body (Scrollable with Smooth Touch) */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs font-sans no-scrollbar">
              {/* Caller Intelligence Hero Card */}
              <div className="p-4 bg-gradient-to-br from-zinc-50 to-emerald-50/30 dark:from-zinc-900/90 dark:to-emerald-950/20 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-blue-500" />
                    <span>Caller Profile & Telemetry</span>
                  </span>
                  <Badge variant={selectedCall.direction === 'inbound' ? 'outline' : 'emerald'} size="sm" className="text-[9.5px] uppercase font-mono font-bold">
                    {selectedCall.direction} Call
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shrink-0">
                      {selectedCall.contactName ? selectedCall.contactName.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {selectedCall.contactName || 'Unknown Contact'}
                      </div>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {selectedCall.contactPhone || 'Number Unavailable'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Duration</div>
                    <div className="font-mono font-extrabold text-xs text-zinc-800 dark:text-zinc-200">
                      {Math.floor(selectedCall.durationSeconds / 60)}m {selectedCall.durationSeconds % 60}s
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/80 text-[11px]">
                  <div className="flex items-center gap-1.5 text-zinc-500 truncate">
                    <Brain className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">Agent: <strong className="text-zinc-800 dark:text-zinc-200">{selectedCall.agentName}</strong></span>
                  </div>
                  <div className="flex items-center justify-end gap-1 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    <span>Cost: ${selectedCall.cost.toFixed(3)}</span>
                  </div>
                </div>
              </div>

              {/* Studio Recording Player Chassis */}
              <div className="p-4.5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-zinc-100 rounded-3xl space-y-3.5 shadow-xl border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span>HD 16kHz Call Audio Stream</span>
                  </span>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-7.5 px-3 rounded-xl flex items-center gap-1.5 shadow-md hover:scale-102 transition-transform cursor-pointer"
                    onClick={handleDownloadMp3}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download MP3</span>
                  </Button>
                </div>

                {/* Play/Pause & Time Controls */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={toggleHistoryAudioPlay}
                    className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white flex items-center justify-center shrink-0 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95 hover:scale-105"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </button>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between text-[10.5px] text-zinc-400 font-mono font-semibold">
                      <span className="text-emerald-400">{formatTime(currentTimeSec)}</span>
                      <span>{formatTime(selectedCall.durationSeconds || 60)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={audioProgress}
                      onChange={handleSeek}
                      className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Volume toggle */}
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="h-4.5 w-4.5 text-red-400" /> : <Volume2 className="h-4.5 w-4.5 text-zinc-300" />}
                  </button>
                </div>

                {/* Dynamic Waveform Visualizer */}
                <div className="flex items-center gap-1 h-7 px-1 bg-zinc-950/60 p-1.5 rounded-2xl border border-zinc-800">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        isPlaying ? 'bg-gradient-to-t from-emerald-500 to-teal-300 animate-pulse' : 'bg-zinc-700/60'
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

              {/* AI Call Intelligence & Notes */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/80 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 space-y-2.5 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>AI Executive Summary & Notes:</span>
                  </span>
                  {isEditingNotes ? (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white h-7 text-xs rounded-xl" onClick={handleSaveNotes}>
                      Save
                    </Button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingNotes(true)}
                      className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
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
                    className="w-full p-3 text-xs rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium bg-white/90 dark:bg-zinc-950/80 p-3 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80">
                    {selectedCall.summary || 'Call processed successfully by AI Voice Assistant.'}
                  </p>
                )}
              </div>

              {/* Turn-by-Turn Speaker Transcript */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>Turn-by-Turn Speaker Transcript:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadTranscript}
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Export TXT
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 text-xs no-scrollbar">
                  {selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                    selectedCall.transcript.map((t, idx) => {
                      const spkLower = (t.speaker || '').toLowerCase();
                      const isAi =
                        spkLower === 'ai' ||
                        spkLower.includes('agent') ||
                        spkLower.includes('nikita') ||
                        spkLower.includes('mukesh') ||
                        (selectedCall.agentName && spkLower.includes(selectedCall.agentName.toLowerCase()));

                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-3xl border transition-all shadow-2xs ${
                            isAi
                              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100 mr-5'
                              : 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80 text-blue-950 dark:text-blue-100 ml-5'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1 text-[10px] font-extrabold opacity-75">
                            <span className="flex items-center gap-1">
                              {isAi ? `🤖 ${selectedCall.agentName || 'AI Agent'}` : `👤 ${selectedCall.contactName || 'Caller'}`}
                            </span>
                            <span className="font-mono text-[9px]">{t.time}</span>
                          </div>
                          <p className="leading-relaxed font-medium">{t.text}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-5 text-center text-zinc-400 italic bg-zinc-50 dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                      No transcript messages recorded for this call.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer with Smooth Rounded Controls */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-900/95 flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="text-xs font-bold rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 h-9 px-4 shadow-xs"
                onClick={handleCloseInspect}
              >
                Close Inspector
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl h-9 px-4 shadow-md"
                onClick={handleDownloadTranscript}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export Full TXT
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
