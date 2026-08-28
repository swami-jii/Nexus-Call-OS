import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Activity,
  Play,
  Square,
  RotateCcw,
  Zap,
  Volume2,
  Mic,
  Shield,
  Clock,
  Layers,
  Terminal,
  BarChart3,
  Sliders,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  User,
  Bot,
  MessageSquare,
  Languages,
  HeartHandshake,
  Workflow,
  RefreshCw,
  FileText,
  Lock,
} from 'lucide-react';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { useBusinessRules } from '../context/BusinessRulesContext';
import { fetchAPI } from '../lib/api';

export type EngineTab =
  | 'overview'
  | 'conversation'
  | 'state_machine'
  | 'emotion'
  | 'memory'
  | 'humanizer'
  | 'rules'
  | 'metrics'
  | 'timeline';

export interface TimelineEvent {
  id: string;
  time: string;
  type: 'state' | 'barge_in' | 'emotion' | 'policy' | 'audio' | 'turn';
  label: string;
  details: string;
}

export const ConversationEngineView: React.FC = () => {
  const { businessPolicies, departments, workingHours } = useBusinessRules();
  const [activeTab, setActiveTab] = useState<EngineTab>('overview');

  // Real-Time Subsystem Telemetry State
  const [sessionID, setSessionID] = useState('call_session_9921');
  const [activeState, setActiveState] = useState<'idle' | 'greeting' | 'listening' | 'processing' | 'responding' | 'waiting' | 'completed' | 'failed'>('waiting');
  const [detectedLanguage, setDetectedLanguage] = useState('en-US');
  const [detectedEmotion, setDetectedEmotion] = useState<'calm' | 'friendly' | 'neutral' | 'frustrated' | 'urgent'>('neutral');
  const [sentimentScore, setSentimentScore] = useState(0.0);
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [interruptionStatus, setInterruptionStatus] = useState<'clean' | 'barge_in_active' | 'user_speaking'>('clean');
  const [speakerFloor, setSpeakerFloor] = useState<'user' | 'ai' | 'neutral'>('neutral');
  const [silenceTimerSec, setSilenceTimerSec] = useState(0);
  const [currentLatencyMs, setCurrentLatencyMs] = useState(14.2);
  const [currentProvider, setCurrentProvider] = useState('Google AI Studio (Gemini 2.0)');
  const [currentLLM, setCurrentLLM] = useState('gemini-2.0-flash');
  const [currentVoice, setCurrentVoice] = useState('en-US-Journey-F');
  const [currentActionTrigger, setCurrentActionTrigger] = useState<'none' | 'human_transfer' | 'callback_request' | 'hold_request' | 'escalate'>('none');
  const [totalTurns, setTotalTurns] = useState(4);

  // Live Simulation Inputs
  const [simulatedInput, setSimulatedInput] = useState('');
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);

  // Turns History
  const [turnsHistory, setTurnsHistory] = useState<Array<{ speaker: 'user' | 'ai'; text: string; latency?: number; emotion?: string; ssml?: string }>>([
    { speaker: 'ai', text: 'Hello! Thank you for calling. I am Nikita. How can I help you today?', latency: 12, emotion: 'friendly', ssml: 'Hello! <break time="150ms"/> Thank you for calling.' },
    { speaker: 'user', text: 'kyaa aap meri help kar sakte ho?', emotion: 'neutral' },
    { speaker: 'ai', text: 'Main Nikita hu. Regarding your query, I am processing this for you immediately.', latency: 14, emotion: 'neutral', ssml: 'Main Nikita hu. <break time="250ms"/> Regarding your query.' },
  ]);

  // Timeline Event Log
  const [eventsLog, setEventsLog] = useState<TimelineEvent[]>([
    { id: '1', time: '10:14:02', type: 'state', label: 'State Transition', details: 'IDLE -> GREETING (Reason: call_started)' },
    { id: '2', time: '10:14:03', type: 'audio', label: 'Audio Streamed', details: 'Sent 4800 bytes (en-US-Journey-F)' },
    { id: '3', time: '10:14:04', type: 'state', label: 'State Transition', details: 'GREETING -> WAITING (Reason: greeting_completed)' },
    { id: '4', time: '10:14:15', type: 'turn', label: 'User Speech Input', details: 'Detected: "kyaa aap meri help kar sakte ho?"' },
    { id: '5', time: '10:14:15', type: 'emotion', label: 'Language & Emotion', details: 'Language: hi-IN, Emotion: neutral (score: 0.0)' },
    { id: '6', time: '10:14:16', type: 'state', label: 'State Transition', details: 'PROCESSING -> RESPONDING -> WAITING' },
  ]);

  // Silence Timer Simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setSilenceTimerSec((prev) => (prev >= 12 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle Trigger Barge-In Simulation
  const handleSimulateBargeIn = async () => {
    setInterruptionStatus('barge_in_active');
    setSpeakerFloor('user');
    setActiveState('listening');

    const newEvt: TimelineEvent = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
      type: 'barge_in',
      label: 'Barge-In Interruption',
      details: 'User spoke over AI playback. Audio buffer flushed.',
    };
    setEventsLog((prev) => [newEvt, ...prev]);

    setTimeout(() => {
      setInterruptionStatus('clean');
    }, 2000);
  };

  // Handle Simulate Process Turn
  const handleSimulateTurn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simulatedInput.trim()) return;

    setIsProcessingTurn(true);
    const inputVal = simulatedInput;
    setSimulatedInput('');

    // Add user turn
    setTurnsHistory((prev) => [...prev, { speaker: 'user', text: inputVal }]);
    setActiveState('processing');
    setSpeakerFloor('ai');

    try {
      const data = await fetchAPI('/api/conversation-engine/turn', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionID,
          user_input: inputVal,
          telephony_provider: 'simulated',
        }),
      });

      if (data) {
        const result = data.result || {};
        const aiText = result.ai_response || `Received '${inputVal}'. Engine processing turn.`;
        const ssmlText = result.humanized_ssml || aiText;
        const trigger = result.action_trigger || 'none';
        const em = result.emotion || 'neutral';
        const lat = result.latency_ms || 15;

        setCurrentLatencyMs(lat);
        setCurrentActionTrigger(trigger);
        setDetectedEmotion(em);
        setActiveState('waiting');
        setSpeakerFloor('neutral');
        setTotalTurns((prev) => prev + 1);

        setTurnsHistory((prev) => [
          ...prev,
          { speaker: 'ai', text: aiText, latency: lat, emotion: em, ssml: ssmlText },
        ]);

        const newEvt: TimelineEvent = {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          type: 'turn',
          label: 'Turn Executed',
          details: `Processed user turn (${lat}ms). Action trigger: ${trigger}`,
        };
        setEventsLog((prev) => [newEvt, ...prev]);
      } else {
        // Local simulation fallback
        const aiText = `Received '${inputVal}'. Engine active in local mode.`;
        setTurnsHistory((prev) => [...prev, { speaker: 'ai', text: aiText, latency: 15, emotion: 'neutral' }]);
        setActiveState('waiting');
        setSpeakerFloor('neutral');
      }
    } catch (err) {
      setTurnsHistory((prev) => [...prev, { speaker: 'ai', text: `Engine processed '${inputVal}' locally.`, latency: 12 }]);
      setActiveState('waiting');
      setSpeakerFloor('neutral');
    } finally {
      setIsProcessingTurn(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Conversation Engine Console
              </h1>
              <Badge variant="primary" size="sm" className="font-mono text-[10px]">
                v2.4 Core Brain
              </Badge>
              <Badge variant="success" size="sm">
                Provider Agnostic
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Universal real-time conversational intelligence layer for developers &amp; enterprise observability.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEventsLog([])} leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>
            Clear Logs
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSimulateBargeIn} leftIcon={<Zap className="h-3.5 w-3.5 text-amber-500" />}>
            Simulate Barge-In
          </Button>
        </div>
      </div>

      {/* Real-time Status Gauge Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="p-3 bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">State</span>
          <div className="flex items-center gap-1.5 font-bold text-xs text-blue-600 dark:text-blue-400 uppercase font-mono">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            {activeState}
          </div>
        </Card>

        <Card className="p-3 bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Language</span>
          <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 font-mono">{detectedLanguage}</span>
        </Card>

        <Card className="p-3 bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Emotion</span>
          <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 capitalize">{detectedEmotion}</span>
        </Card>

        <Card className="p-3 bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Speech Speed</span>
          <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 font-mono">{speechSpeed.toFixed(1)}x</span>
        </Card>

        <Card className="p-3 bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Interruption</span>
          <span className={`font-bold text-xs font-mono ${interruptionStatus === 'barge_in_active' ? 'text-amber-500' : 'text-zinc-600 dark:text-zinc-300'}`}>
            {interruptionStatus === 'barge_in_active' ? 'Barge-In!' : 'Clean'}
          </span>
        </Card>

        <Card className="p-3 bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Silence Timer</span>
          <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 font-mono">{silenceTimerSec}s / 12s</span>
        </Card>

        <Card className="p-3 bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Latency</span>
          <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 font-mono">{currentLatencyMs}ms</span>
        </Card>

        <Card className="p-3 bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Action Trigger</span>
          <span className="font-bold text-xs text-zinc-700 dark:text-zinc-300 font-mono uppercase">{currentActionTrigger}</span>
        </Card>
      </div>

      {/* 9 Main Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: <Activity className="h-3.5 w-3.5" /> },
          { id: 'conversation', label: 'Live Conversation', icon: <MessageSquare className="h-3.5 w-3.5" /> },
          { id: 'state_machine', label: 'State Machine', icon: <Workflow className="h-3.5 w-3.5" /> },
          { id: 'emotion', label: 'Emotion & Tone', icon: <HeartHandshake className="h-3.5 w-3.5" /> },
          { id: 'memory', label: 'Memory & Context', icon: <Layers className="h-3.5 w-3.5" /> },
          { id: 'humanizer', label: 'Humanizer & SSML', icon: <Volume2 className="h-3.5 w-3.5" /> },
          { id: 'rules', label: 'Conversation Rules', icon: <Shield className="h-3.5 w-3.5" /> },
          { id: 'metrics', label: 'Metrics', icon: <BarChart3 className="h-3.5 w-3.5" /> },
          { id: 'timeline', label: 'Debug Timeline', icon: <Terminal className="h-3.5 w-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as EngineTab)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 md:col-span-2 space-y-4 border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Active Session Telemetry
              </span>
              <Badge variant="outline" size="sm" className="font-mono">
                Session ID: {sessionID}
              </Badge>
            </CardTitle>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
              <div>
                <span className="text-[11px] text-zinc-400 block">LLM Engine</span>
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 font-mono">{currentLLM}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block">Voice Engine</span>
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 font-mono">{currentVoice}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block">Active Provider</span>
                <span className="font-bold text-xs text-blue-600 dark:text-blue-400">{currentProvider}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block">Floor Owner</span>
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 uppercase font-mono">{speakerFloor}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block">Total Turn Count</span>
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 font-mono">{totalTurns} Turns</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block">Avg Response Latency</span>
                <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 font-mono">{currentLatencyMs}ms</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Executive Summary</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 leading-relaxed">
                Active conversation with <strong>Nikita</strong>. Caller intent recognized with neutral sentiment score (0.0). No barge-in interruptions or policy escalation triggers detected in current turn cycle.
              </p>
            </div>
          </Card>

          <Card className="p-5 space-y-4 border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              Subsystem Health
            </CardTitle>
            <div className="space-y-3 text-xs">
              {[
                { label: 'State Machine Engine', status: 'Online', latency: '0.1ms' },
                { label: 'Turn Arbitration Lock', status: 'Online', latency: '0.2ms' },
                { label: 'Barge-In Detector', status: 'Online', latency: '0.4ms' },
                { label: 'VAD & Silence Tracker', status: 'Online', latency: '0.2ms' },
                { label: 'Humanizer SSML Pacer', status: 'Online', latency: '0.1ms' },
                { label: 'Compliance & Safety Filter', status: 'Online', latency: '0.3ms' },
              ].map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-zinc-50 dark:bg-zinc-900/50">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{s.label}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{s.status}</span>
                    <span className="text-zinc-400">{s.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 2: LIVE CONVERSATION */}
      {activeTab === 'conversation' && (
        <Card className="p-5 space-y-4 border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              Live Conversation Simulator &amp; Stream Inspector
            </span>
            <Badge variant="outline" size="sm">
              Session: {sessionID}
            </Badge>
          </CardTitle>

          <div className="h-80 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-y-auto space-y-3 font-sans">
            {turnsHistory.map((t, idx) => (
              <div key={idx} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-md p-3 rounded-xl text-xs space-y-1 ${
                    t.speaker === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-bl-none shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 font-mono">
                    <span className="font-bold uppercase">{t.speaker === 'user' ? 'Caller' : 'AI Agent'}</span>
                    {t.latency && <span>{t.latency}ms</span>}
                  </div>
                  <p>{t.text}</p>
                  {t.ssml && <div className="text-[10px] text-blue-400 font-mono pt-1">SSML: {t.ssml}</div>}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSimulateTurn} className="flex gap-2">
            <Input
              value={simulatedInput}
              onChange={(e) => setSimulatedInput(e.target.value)}
              placeholder="Type simulated caller message (e.g. 'kyaa aap meri help kar sakte ho?')..."
              className="text-xs"
            />
            <Button type="submit" variant="primary" size="md" isLoading={isProcessingTurn} leftIcon={<Play className="h-3.5 w-3.5" />}>
              Send Turn
            </Button>
          </form>
        </Card>
      )}

      {/* TAB CONTENT 3: STATE MACHINE */}
      {activeTab === 'state_machine' && (
        <Card className="p-5 space-y-6 border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Workflow className="h-4 w-4 text-indigo-500" />
              Finite State Machine Visualizer
            </span>
            <Badge variant="primary" size="sm" className="font-mono">
              Active: {activeState.toUpperCase()}
            </Badge>
          </CardTitle>

          {/* Finite State Machine Node Map */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
            {[
              { id: 'idle', label: 'IDLE' },
              { id: 'greeting', label: 'GREETING' },
              { id: 'listening', label: 'LISTENING' },
              { id: 'processing', label: 'PROCESSING' },
              { id: 'responding', label: 'RESPONDING' },
              { id: 'waiting', label: 'WAITING' },
              { id: 'completed', label: 'COMPLETED' },
              { id: 'failed', label: 'FAILED' },
            ].map((node) => {
              const isActive = activeState === node.id;
              return (
                <div
                  key={node.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-500/20 font-bold shadow-md'
                      : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 font-semibold'
                  }`}
                >
                  <span className="text-xs font-mono block">{node.label}</span>
                  <span className="text-[10px] opacity-75 mt-1 block">{isActive ? 'ACTIVE NOW' : 'Standby'}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* TAB CONTENT 4: EMOTION */}
      {activeTab === 'emotion' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-4 border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-rose-500" />
              Emotion &amp; Sentiment Gauges
            </CardTitle>
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-zinc-500 block mb-1">Sentiment Score (-1.0 to +1.0)</span>
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(sentimentScore + 1) * 50}%` }} />
                </div>
                <span className="font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mt-1 block">{sentimentScore.toFixed(2)}</span>
              </div>

              <div>
                <span className="text-zinc-500 block mb-1">Recommended Speech Speed</span>
                <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">{speechSpeed.toFixed(1)}x Normal Pacing</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4 border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Emotional State Classification
            </CardTitle>
            <div className="space-y-2">
              {['calm', 'friendly', 'neutral', 'frustrated', 'urgent'].map((stateName) => (
                <div
                  key={stateName}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between capitalize ${
                    detectedEmotion === stateName
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                      : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <span>{stateName}</span>
                  {detectedEmotion === stateName && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 5: MEMORY */}
      {activeTab === 'memory' && (
        <Card className="p-5 space-y-4 border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-500" />
            Short-Term &amp; Long-Term Conversation Context
          </CardTitle>

          <div className="space-y-3 text-xs">
            {turnsHistory.map((t, idx) => (
              <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 capitalize">{t.speaker}: </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{t.text}</span>
                </div>
                <Badge variant="outline" size="sm" className="font-mono">
                  {detectedLanguage}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB CONTENT 6: HUMANIZER */}
      {activeTab === 'humanizer' && (
        <Card className="p-5 space-y-4 border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-purple-500" />
            SSML Micro-Pause &amp; Humanizer Formatting
          </CardTitle>
          <div className="space-y-3 text-xs">
            {turnsHistory.filter(t => t.ssml).map((t, idx) => (
              <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1 font-mono">
                <span className="text-zinc-400 text-[10px]">Formatted SSML Stream:</span>
                <p className="text-purple-600 dark:text-purple-400 font-bold">{t.ssml}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB CONTENT 7: RULES */}
      {activeTab === 'rules' && (
        <Card className="p-5 space-y-4 border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span>SSOT Business &amp; Rules Policy Matrix</span>
            </CardTitle>
            <Badge variant="blue" size="sm">Active SSOT Rules ({businessPolicies.length + departments.length})</Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Configured Business Policies</div>
            {businessPolicies.map((p) => (
              <div key={p.id} className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{p.name}</span>
                  <span className="text-zinc-400 block text-[11px]">{p.policy_category || 'Governance'} • Trigger: {p.execution_time || 'Before Call Connect'}</span>
                  <span className="text-blue-600 dark:text-blue-400 text-[10px] block font-mono mt-0.5">Action: {p.violation_action || 'Block Action Immediately'}</span>
                </div>
                <Badge variant="success" size="sm">{p.status || 'Active'}</Badge>
              </div>
            ))}

            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pt-2">Department Escalation Protocols</div>
            {departments.map((d) => (
              <div key={d.id} className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{d.name} ({d.extension || '#101'})</span>
                  <span className="text-zinc-400 block text-[11px]">Strategy: {d.transfer_strategy || 'Round Robin'} • Manager: {d.manager || 'Unassigned'}</span>
                </div>
                <Badge variant="outline" size="sm" className="font-mono text-[10px]">Priority {d.queue_priority || 10}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB CONTENT 8: METRICS */}
      {activeTab === 'metrics' && (
        <Card className="p-5 space-y-4 border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            Real-Time Engine Performance Metrics
          </CardTitle>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Avg Response Latency</span>
              <span className="font-bold text-lg text-indigo-600 font-mono">{currentLatencyMs}ms</span>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Turn Count</span>
              <span className="font-bold text-lg text-zinc-800 dark:text-zinc-200 font-mono">{totalTurns}</span>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Cost / Session</span>
              <span className="font-bold text-lg text-emerald-600 font-mono">$0.0004</span>
            </div>
          </div>
        </Card>
      )}

      {/* TAB CONTENT 9: DEBUG TIMELINE */}
      {activeTab === 'timeline' && (
        <Card className="p-5 space-y-4 border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
              Real-Time Debug Audit Log Stream
            </span>
            <Badge variant="outline" size="sm" className="font-mono">
              {eventsLog.length} Events
            </Badge>
          </CardTitle>

          <div className="space-y-2 font-mono text-xs max-h-96 overflow-y-auto">
            {eventsLog.map((evt) => (
              <div key={evt.id} className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <span className="text-[10px] text-zinc-400">{evt.time}</span>
                <Badge variant="secondary" size="sm" className="text-[10px] uppercase">
                  {evt.type}
                </Badge>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{evt.label}:</span>
                <span className="text-zinc-600 dark:text-zinc-400">{evt.details}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
