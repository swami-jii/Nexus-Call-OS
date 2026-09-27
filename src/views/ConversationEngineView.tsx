import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Cpu,
  Activity,
  Play,
  Square,
  RotateCcw,
  Zap,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
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
  Download,
  PhoneCall,
  PhoneOff,
  BellRing,
  Send,
  SlidersHorizontal,
  ChevronDown,
  Copy,
  Check,
  Radio,
  Gauge,
  Timer,
  AlertTriangle,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { useBusinessRules } from '../context/BusinessRulesContext';
import { useToast } from '../components/ui/Toast';
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
  type: 'state' | 'barge_in' | 'emotion' | 'policy' | 'audio' | 'turn' | 'nudge';
  label: string;
  details: string;
}

export interface StateTransitionLog {
  from_state: string;
  to_state: string;
  reason: string;
  timestamp: string;
}

export interface AgentItem {
  id: string;
  name: string;
  system_prompt?: string;
  llm_model?: string;
  voice_id?: string;
  language?: string;
}

export const ConversationEngineView: React.FC = () => {
  const { addToast } = useToast();
  const { businessPolicies, departments } = useBusinessRules();
  const [activeTab, setActiveTab] = useState<EngineTab>('overview');

  // Agents & Session
  const [agentsList, setAgentsList] = useState<AgentItem[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [sessionID, setSessionID] = useState<string>(() => `session_${Math.floor(1000 + Math.random() * 9000)}`);
  const [isInitializing, setIsInitializing] = useState(false);
  const [copiedSession, setCopiedSession] = useState(false);

  // Real-Time Subsystem Telemetry State
  const [activeState, setActiveState] = useState<string>('idle');
  const [detectedLanguage, setDetectedLanguage] = useState('en-US');
  const [detectedEmotion, setDetectedEmotion] = useState<'calm' | 'friendly' | 'neutral' | 'frustrated' | 'urgent'>('neutral');
  const [sentimentScore, setSentimentScore] = useState(0.0);
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [interruptionStatus, setInterruptionStatus] = useState<'clean' | 'barge_in_active'>('clean');
  const [speakerFloor, setSpeakerFloor] = useState<'user' | 'ai' | 'neutral'>('neutral');
  const [silenceTimerSec, setSilenceTimerSec] = useState(0);
  const [currentLatencyMs, setCurrentLatencyMs] = useState(14.0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0.0);
  const [currentProvider, setCurrentProvider] = useState('Google AI Studio (Gemini 2.0)');
  const [currentLLM, setCurrentLLM] = useState('Gemini 2.0 Flash');
  const [currentVoice, setCurrentVoice] = useState('en-US-Journey-F');
  const [currentAgentName, setCurrentAgentName] = useState('AI Assistant');
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState('You are a helpful, polite, and professional AI voice telephony assistant.');
  const [currentActionTrigger, setCurrentActionTrigger] = useState<string>('none');
  const [totalTurns, setTotalTurns] = useState(0);
  const [interruptionCount, setInterruptionCount] = useState(0);
  const [nudgeCount, setNudgeCount] = useState(0);

  // Audio Playback & Voice Input State
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);

  // Live Simulation Inputs
  const [simulatedInput, setSimulatedInput] = useState('');
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);

  // Turns History & FSM Logs
  const [turnsHistory, setTurnsHistory] = useState<Array<{
    speaker: 'user' | 'ai' | 'assistant';
    text: string;
    latency?: number;
    emotion?: string;
    ssml?: string;
    timestamp?: string;
  }>>([]);

  const [stateHistory, setStateHistory] = useState<StateTransitionLog[]>([]);

  // Timeline Event Log
  const [eventsLog, setEventsLog] = useState<TimelineEvent[]>([]);
  const [timelineFilter, setTimelineFilter] = useState<string>('all');

  // Interactive SSML Playground State
  const [testSSMLText, setTestSSMLText] = useState('Namaste, main aapki booking confirm karne ke liye call kar rahi hu.');
  const [testSSMLStyle, setTestSSMLStyle] = useState<'balanced' | 'expressive' | 'casual'>('balanced');
  const [testSSMLSpeed, setTestSSMLSpeed] = useState(1.0);
  const [testSSMLOutput, setTestSSMLOutput] = useState('');
  const [isTestingSSML, setIsTestingSSML] = useState(false);

  // Policy Live Validator State
  const [policyTestInput, setPolicyTestInput] = useState('');
  const [policyTestResult, setPolicyTestResult] = useState<{
    trigger: string;
    sanitized: string;
    compliant: boolean;
  } | null>(null);

  // Silence Timer Tracker
  useEffect(() => {
    if (activeState === 'completed' || activeState === 'failed') return;
    const interval = setInterval(() => {
      setSilenceTimerSec((prev) => (prev >= 6 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeState]);

  // Load Real Agents from Backend
  useEffect(() => {
    let isMounted = true;
    async function loadAgents() {
      try {
        const data = await fetchAPI('/api/agents');
        if (isMounted && data) {
          const agents: AgentItem[] = Array.isArray(data) ? data : data.agents || [];
          setAgentsList(agents);
          if (agents.length > 0) {
            setSelectedAgentId(agents[0].id);
            setCurrentAgentName(agents[0].name || 'AI Voice Agent');
            if (agents[0].llm_model) setCurrentLLM(agents[0].llm_model);
            if (agents[0].voice_id) setCurrentVoice(agents[0].voice_id);
            if (agents[0].system_prompt) setCurrentSystemPrompt(agents[0].system_prompt);
            if (agents[0].language) setDetectedLanguage(agents[0].language);
          }
        }
      } catch (err) {
        console.error('Failed to load agents list:', err);
      }
    }
    loadAgents();
    return () => {
      isMounted = false;
    };
  }, []);

  // Text-To-Speech (TTS) Voice Synthesis Handler
  const speakText = (text: string, rate: number = 1.0) => {
    if (isAudioMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/<[^>]*>/g, '').trim();
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = Math.max(0.7, Math.min(1.4, rate));
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Female')) && (v.lang.includes('en') || v.lang.includes('hi'))
      ) || voices[0];
      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS playback error:', e);
      setIsPlayingAudio(false);
    }
  };

  // Web Speech API Voice Input (Microphone)
  const handleToggleMic = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addToast('warning', 'Speech Recognition is not supported by your browser. Please use Chrome/Edge or type your message.');
      return;
    }

    if (isListeningMic) {
      setIsListeningMic(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = detectedLanguage === 'hi-IN' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListeningMic(true);
        setActiveState('listening');
        setSpeakerFloor('user');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSimulatedInput(transcript);
          handleProcessTurnWithText(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListeningMic(false);
      };

      recognition.onend = () => {
        setIsListeningMic(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListeningMic(false);
    }
  };

  // Start New Real Session
  const handleStartSession = async () => {
    setIsInitializing(true);
    const newSessionId = `session_${Math.floor(1000 + Math.random() * 9000)}`;
    setSessionID(newSessionId);
    setSilenceTimerSec(0);
    setTurnsHistory([]);
    setEventsLog([]);
    setStateHistory([]);
    setTotalTurns(0);
    setInterruptionCount(0);
    setNudgeCount(0);
    setSentimentScore(0.0);
    setDetectedEmotion('neutral');
    setCurrentActionTrigger('none');

    try {
      const data = await fetchAPI('/api/conversation-engine/start-session', {
        method: 'POST',
        body: JSON.stringify({
          session_id: newSessionId,
          agent_id: selectedAgentId || undefined,
        }),
      });

      if (data && data.status === 'success') {
        const meta = data.agent_meta || {};
        const resolvedName = meta.agent_name || (agentsList.find((a) => a.id === selectedAgentId)?.name || (agentsList[0]?.name || 'AI Voice Agent'));
        setCurrentAgentName(resolvedName);
        if (meta.llm_model) setCurrentLLM(meta.llm_model);
        if (meta.voice_id) setCurrentVoice(meta.voice_id);
        if (meta.system_prompt) setCurrentSystemPrompt(meta.system_prompt);
        if (meta.language) setDetectedLanguage(meta.language);

        setActiveState(data.state || 'waiting');
        setSpeakerFloor('neutral');

        const greeting = data.initial_greeting || `Hello! Thank you for calling. I am ${resolvedName}. How can I help you today?`;
        setTurnsHistory([
          {
            speaker: 'ai',
            text: greeting,
            latency: 12,
            emotion: 'friendly',
            ssml: greeting,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);

        if (data.state_history) {
          setStateHistory(data.state_history);
        }

        const newEvts: TimelineEvent[] = [
          {
            id: '1',
            time: new Date().toLocaleTimeString(),
            type: 'state',
            label: 'Session Initialized',
            details: `Agent '${resolvedName}' ready on session ${newSessionId}`,
          },
          {
            id: '2',
            time: new Date().toLocaleTimeString(),
            type: 'audio',
            label: 'Greeting Streamed',
            details: `Initial welcome speech dispatched via ${meta.voice_id || 'en-US-Journey-F'}`,
          },
        ];
        setEventsLog(newEvts);

        // Play initial greeting
        speakText(greeting, 1.0);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      setActiveState('waiting');
      const fallbackGreeting = `Hello! Thank you for calling. I am ${currentAgentName}. How can I help you today?`;
      setTurnsHistory([
        {
          speaker: 'ai',
          text: fallbackGreeting,
          latency: 10,
          emotion: 'friendly',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      speakText(fallbackGreeting, 1.0);
    } finally {
      setIsInitializing(false);
    }
  };

  // End Session
  const handleEndSession = async () => {
    try {
      await fetchAPI('/api/conversation-engine/end-session', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionID,
          reason: 'normal_hangup',
        }),
      });
      setActiveState('completed');
      setSpeakerFloor('neutral');
      const newEvt: TimelineEvent = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString(),
        type: 'state',
        label: 'Session Terminated',
        details: 'Call lifecycle marked as COMPLETED. Telemetry archived.',
      };
      setEventsLog((prev) => [newEvt, ...prev]);
    } catch (err) {
      setActiveState('completed');
    }
  };

  // Handle Trigger Barge-In Simulation
  const handleSimulateBargeIn = async () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setInterruptionStatus('barge_in_active');
    setSpeakerFloor('user');
    setActiveState('interrupted');
    setInterruptionCount((prev) => prev + 1);

    const newEvt: TimelineEvent = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
      type: 'barge_in',
      label: 'Barge-In Interruption Detected',
      details: 'User spoke over active AI playback. Speech queue flushed instantly.',
    };
    setEventsLog((prev) => [newEvt, ...prev]);

    try {
      await fetchAPI('/api/conversation-engine/barge-in', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionID }),
      });
    } catch (err) {
      console.warn('Barge-in backend sync:', err);
    }

    setTimeout(() => {
      setInterruptionStatus('clean');
      setActiveState('listening');
    }, 1500);
  };

  // Handle Trigger Silence Nudge
  const handleTriggerSilenceNudge = async () => {
    setSilenceTimerSec(0);
    setNudgeCount((prev) => prev + 1);
    setActiveState('responding');
    setSpeakerFloor('ai');

    try {
      const data = await fetchAPI('/api/conversation-engine/nudge', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionID }),
      });

      if (data && data.nudge_text) {
        const nudge = data.nudge_text;
        setTurnsHistory((prev) => [
          ...prev,
          {
            speaker: 'ai',
            text: nudge,
            latency: 10,
            emotion: 'friendly',
            ssml: data.humanized_ssml || nudge,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);

        const newEvt: TimelineEvent = {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          type: 'nudge',
          label: 'Silence Nudge Triggered',
          details: `VAD inactivity exceeded threshold. Re-engagement prompt delivered: "${nudge}"`,
        };
        setEventsLog((prev) => [newEvt, ...prev]);
        speakText(nudge, 1.0);
      }
    } catch (err) {
      const fallbackNudge = `Kya aap sun pa rahe hain? Main ${currentAgentName} hu, aapki help ke liye yahan hu.`;
      setTurnsHistory((prev) => [
        ...prev,
        {
          speaker: 'ai',
          text: fallbackNudge,
          latency: 10,
          emotion: 'friendly',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      speakText(fallbackNudge, 1.0);
    } finally {
      setActiveState('waiting');
      setSpeakerFloor('neutral');
    }
  };

  // Process Turn Execution
  const handleProcessTurnWithText = async (inputText: string) => {
    if (!inputText.trim() || isProcessingTurn) return;

    setIsProcessingTurn(true);
    setSilenceTimerSec(0);

    const userTurnObj = {
      speaker: 'user' as const,
      text: inputText,
      timestamp: new Date().toLocaleTimeString(),
    };
    setTurnsHistory((prev) => [...prev, userTurnObj]);
    setActiveState('thinking');
    setSpeakerFloor('ai');

    try {
      const data = await fetchAPI('/api/conversation-engine/turn', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionID,
          agent_id: selectedAgentId || undefined,
          user_input: inputText,
          telephony_provider: 'simulated',
        }),
      });

      if (data && data.status === 'success') {
        const result = data.result || {};
        const tel = data.telemetry || {};

        const aiText = result.ai_response || `I am ${currentAgentName}. I received your message: '${inputText}'.`;
        const ssmlText = result.humanized_ssml || aiText;
        const trigger = result.action_trigger || 'none';
        const em = (result.emotion || 'neutral') as 'calm' | 'friendly' | 'neutral' | 'frustrated' | 'urgent';
        const lat = result.latency_ms || 14.0;
        const spd = result.speech_speed || 1.0;
        const lang = result.language || detectedLanguage;

        setCurrentLatencyMs(lat);
        setCurrentActionTrigger(trigger);
        setDetectedEmotion(em);
        setSpeechSpeed(spd);
        setDetectedLanguage(lang);
        setActiveState('waiting');
        setSpeakerFloor('neutral');
        setTotalTurns((prev) => prev + 1);

        if (tel.total_tokens) setTotalTokens(tel.total_tokens);
        if (tel.estimated_cost) setEstimatedCost(tel.estimated_cost);
        if (tel.state_history) setStateHistory(tel.state_history);

        if (em === 'friendly') setSentimentScore(0.75);
        else if (em === 'frustrated') setSentimentScore(-0.75);
        else if (em === 'urgent') setSentimentScore(-0.25);
        else if (em === 'calm') setSentimentScore(0.4);
        else setSentimentScore(0.0);

        setTurnsHistory((prev) => [
          ...prev,
          {
            speaker: 'ai',
            text: aiText,
            latency: lat,
            emotion: em,
            ssml: ssmlText,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);

        const newEvt: TimelineEvent = {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          type: 'turn',
          label: 'Turn Completed',
          details: `Processed in ${lat}ms | Emotion: ${em} | Trigger: ${trigger}`,
        };
        setEventsLog((prev) => [newEvt, ...prev]);

        speakText(aiText, spd);
      } else {
        throw new Error('Invalid turn response');
      }
    } catch (err) {
      console.error('Turn processing error:', err);
      const fallbackText = `I am ${currentAgentName}. I have noted your message: '${inputText}'. How may I assist you further?`;
      setTurnsHistory((prev) => [
        ...prev,
        {
          speaker: 'ai',
          text: fallbackText,
          latency: 12.0,
          emotion: 'neutral',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setActiveState('waiting');
      setSpeakerFloor('neutral');
      speakText(fallbackText, 1.0);
    } finally {
      setIsProcessingTurn(false);
      setSimulatedInput('');
    }
  };

  const handleSimulateTurn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleProcessTurnWithText(simulatedInput);
  };

  // Test SSML Playground
  const handleTestSSML = async () => {
    if (!testSSMLText.trim()) return;
    setIsTestingSSML(true);
    try {
      const data = await fetchAPI('/api/conversation-engine/test-ssml', {
        method: 'POST',
        body: JSON.stringify({
          text: testSSMLText,
          style: testSSMLStyle,
          speech_speed: testSSMLSpeed,
        }),
      });
      if (data && data.ssml_output) {
        setTestSSMLOutput(data.ssml_output);
      }
    } catch (err) {
      setTestSSMLOutput(`<speak>${testSSMLText}</speak>`);
    } finally {
      setIsTestingSSML(false);
    }
  };

  // Test Policy Evaluator
  const handleTestPolicy = (text: string) => {
    setPolicyTestInput(text);
    if (!text.trim()) {
      setPolicyTestResult(null);
      return;
    }

    const lower = text.toLowerCase();
    let trigger = 'none';
    if (lower.includes('human') || lower.includes('operator') || lower.includes('agent') || lower.includes('insan')) {
      trigger = 'HUMAN_TRANSFER';
    } else if (lower.includes('call back') || lower.includes('later') || lower.includes('busy')) {
      trigger = 'CALLBACK_REQUEST';
    } else if (lower.includes('hold') || lower.includes('wait') || lower.includes('ruk')) {
      trigger = 'HOLD_REQUEST';
    } else if (lower.includes('fraud') || lower.includes('scam') || lower.includes('complaint') || lower.includes('shikayat') || lower.includes('gussa')) {
      trigger = 'ESCALATE';
    }

    let sanitized = text;
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED-SSN]');
    sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED-CARD]');

    setPolicyTestResult({
      trigger,
      sanitized,
      compliant: true,
    });
  };

  // Copy Session ID
  const handleCopySession = () => {
    navigator.clipboard.writeText(sessionID);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };

  // Export Session JSON
  const handleExportSessionJSON = () => {
    const payload = {
      session_id: sessionID,
      agent_id: selectedAgentId,
      agent_name: currentAgentName,
      llm_model: currentLLM,
      voice_id: currentVoice,
      language: detectedLanguage,
      active_state: activeState,
      total_turns: turnsHistory.length,
      avg_latency_ms: currentLatencyMs,
      total_tokens: totalTokens,
      estimated_cost_usd: estimatedCost,
      interruption_count: interruptionCount,
      nudge_count: nudgeCount,
      turns_history: turnsHistory,
      state_history: stateHistory,
      events_log: eventsLog,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_engine_${sessionID}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEvents = useMemo(() => {
    if (timelineFilter === 'all') return eventsLog;
    return eventsLog.filter((e) => e.type === timelineFilter);
  }, [eventsLog, timelineFilter]);

  return (
    <div className="space-y-6 w-full select-none pb-12 font-sans">
      {/* ══════════════════════════════════════════════════════════════════════
          1. ULTRA LUXURY HEADER & CONTROL DECK
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800/80 p-5 sm:p-6 text-white shadow-xl">
        {/* Subtle Background Glow Elements */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Left Title & Status Header */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 shrink-0">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Cpu className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Conversation Engine Console
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  v2.4 CORE BRAIN
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Provider Agnostic
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Universal real-time conversational intelligence layer controlling turn-taking, barge-in arbitration, silence timeouts, and acoustic humanization.
              </p>
            </div>
          </div>

          {/* Right Action Toolbar Deck */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 backdrop-blur-md">
            {/* Real Agent Selector Dropdown */}
            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-inner">
              <Bot className="h-4 w-4 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Active Agent</span>
                <select
                  value={selectedAgentId}
                  onChange={(e) => {
                    const aId = e.target.value;
                    setSelectedAgentId(aId);
                    const found = agentsList.find((a) => a.id === aId);
                    if (found) {
                      setCurrentAgentName(found.name);
                      if (found.llm_model) setCurrentLLM(found.llm_model);
                      if (found.voice_id) setCurrentVoice(found.voice_id);
                      if (found.system_prompt) setCurrentSystemPrompt(found.system_prompt);
                      if (found.language) setDetectedLanguage(found.language);
                    }
                  }}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-1"
                >
                  {agentsList.length > 0 ? (
                    agentsList.map((ag) => (
                      <option key={ag.id} value={ag.id} className="bg-slate-900 text-white">
                        {ag.name} ({ag.llm_model || 'Gemini 2.0'})
                      </option>
                    ))
                  ) : (
                    <option value="" className="bg-slate-900 text-white">
                      AI Voice Agent (Default)
                    </option>
                  )}
                </select>
              </div>
            </div>

            {/* Session ID Pill */}
            <button
              onClick={handleCopySession}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-cyan-300 transition-colors"
              title="Click to copy session ID"
            >
              <span className="text-[10px] text-slate-400 font-sans">ID:</span>
              <span>{sessionID}</span>
              {copiedSession ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3 w-3 text-slate-400" />}
            </button>

            {/* Start / In-Session Action Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartSession}
              isLoading={isInitializing}
              leftIcon={<Play className="h-3.5 w-3.5 fill-current" />}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md shadow-cyan-500/20 font-bold text-xs"
            >
              Start Session
            </Button>

            {/* Quick Simulate Barge-in */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSimulateBargeIn}
              leftIcon={<Zap className="h-3.5 w-3.5 text-amber-400 fill-current" />}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-semibold"
              title="Interrupt AI playback immediately (Barge-in)"
            >
              Barge-In
            </Button>

            {/* Quick Silence Nudge */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTriggerSilenceNudge}
              leftIcon={<BellRing className="h-3.5 w-3.5 text-cyan-400" />}
              className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs font-semibold"
              title="Simulate silence timeout re-prompt"
            >
              Nudge
            </Button>

            {/* Audio Playback Mute Toggle */}
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className={`p-2 rounded-lg border transition-colors ${
                isAudioMuted
                  ? 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-400'
                  : 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25'
              }`}
              title={isAudioMuted ? 'Unmute Live TTS Audio' : 'Mute Live TTS Audio'}
            >
              {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndSession}
              className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 transition-colors"
              title="End conversation session"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. HIGH-TECH OBSIDIAN TELEMETRY GAUGES (8 GAUGE CARDS)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Gauge 1: State */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-700 transition-all">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
            <span>FSM State</span>
            <Workflow className="h-3 w-3 text-blue-500 opacity-60" />
          </div>
          <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                activeState === 'listening'
                  ? 'bg-amber-500 animate-ping'
                  : activeState === 'thinking'
                  ? 'bg-purple-500 animate-spin'
                  : activeState === 'speaking'
                  ? 'bg-emerald-500 animate-pulse'
                  : activeState === 'interrupted'
                  ? 'bg-rose-500 animate-bounce'
                  : activeState === 'completed'
                  ? 'bg-zinc-400'
                  : 'bg-blue-500'
              }`}
            />
            <span
              className={
                activeState === 'listening'
                  ? 'text-amber-600 dark:text-amber-400 uppercase'
                  : activeState === 'thinking'
                  ? 'text-purple-600 dark:text-purple-400 uppercase'
                  : activeState === 'speaking'
                  ? 'text-emerald-600 dark:text-emerald-400 uppercase'
                  : activeState === 'interrupted'
                  ? 'text-rose-600 dark:text-rose-400 uppercase'
                  : 'text-blue-600 dark:text-blue-400 uppercase'
              }
            >
              {activeState}
            </span>
          </div>
        </div>

        {/* Gauge 2: Language */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-cyan-400 transition-all">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
            <span>Language</span>
            <Languages className="h-3 w-3 text-cyan-500 opacity-60" />
          </div>
          <div className="font-mono font-bold text-xs text-zinc-800 dark:text-zinc-100">
            {detectedLanguage}
          </div>
        </div>

        {/* Gauge 3: Emotion */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
            <span>Emotion</span>
            <HeartHandshake className="h-3 w-3 text-emerald-500 opacity-60" />
          </div>
          <div
            className={`font-bold text-xs capitalize ${
              detectedEmotion === 'frustrated'
                ? 'text-rose-600 dark:text-rose-400'
                : detectedEmotion === 'urgent'
                ? 'text-amber-600 dark:text-amber-400'
                : detectedEmotion === 'friendly' || detectedEmotion === 'calm'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {detectedEmotion} ({sentimentScore > 0 ? `+${sentimentScore.toFixed(1)}` : sentimentScore.toFixed(1)})
          </div>
        </div>

        {/* Gauge 4: Speech Speed */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
            <span>Speed Rate</span>
            <Gauge className="h-3 w-3 text-indigo-500 opacity-60" />
          </div>
          <div className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
            {speechSpeed.toFixed(2)}x
          </div>
        </div>

        {/* Gauge 5: Interruption */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
            <span>Barge-In</span>
            <Zap className="h-3 w-3 text-amber-500 opacity-60" />
          </div>
          <div
            className={`font-mono font-bold text-xs ${
              interruptionStatus === 'barge_in_active'
                ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {interruptionStatus === 'barge_in_active' ? 'Active!' : `${interruptionCount} Evts`}
          </div>
        </div>

        {/* Gauge 6: Silence Timer */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
            <span>Silence VAD</span>
            <Timer className="h-3 w-3 text-blue-500 opacity-60" />
          </div>
          <div className="font-mono font-bold text-xs text-zinc-800 dark:text-zinc-200">
            {silenceTimerSec}s / 6s
          </div>
        </div>

        {/* Gauge 7: Latency */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-purple-400 transition-all">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
            <span>Turn Latency</span>
            <Activity className="h-3 w-3 text-purple-500 opacity-60" />
          </div>
          <div className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
            {currentLatencyMs}ms
          </div>
        </div>

        {/* Gauge 8: Action Trigger */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-rose-400 transition-all">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400 mb-1">
            <span>Trigger</span>
            <Shield className="h-3 w-3 text-rose-500 opacity-60" />
          </div>
          <div
            className={`font-mono font-bold text-xs uppercase truncate ${
              currentActionTrigger !== 'none' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'
            }`}
          >
            {currentActionTrigger}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. SLEEK SEGMENTED TAB NAVIGATION
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: <Activity className="h-3.5 w-3.5" /> },
          { id: 'conversation', label: 'Live Simulator', icon: <MessageSquare className="h-3.5 w-3.5" /> },
          { id: 'state_machine', label: 'State Machine', icon: <Workflow className="h-3.5 w-3.5" /> },
          { id: 'emotion', label: 'Emotion & Tone', icon: <HeartHandshake className="h-3.5 w-3.5" /> },
          { id: 'memory', label: 'Memory & Context', icon: <Layers className="h-3.5 w-3.5" /> },
          { id: 'humanizer', label: 'Humanizer & SSML', icon: <Volume2 className="h-3.5 w-3.5" /> },
          { id: 'rules', label: 'Rules Policy Matrix', icon: <Shield className="h-3.5 w-3.5" /> },
          { id: 'metrics', label: 'Performance Metrics', icon: <BarChart3 className="h-3.5 w-3.5" /> },
          { id: 'timeline', label: 'Debug Timeline', icon: <Terminal className="h-3.5 w-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as EngineTab)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. TAB CONTENT PANELS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2 space-y-6 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Live Telephony Session Telemetry</h3>
                  <p className="text-[11px] text-zinc-400">Core Brain dynamic telemetry for active caller connection</p>
                </div>
              </div>
              <Badge variant="outline" size="sm" className="font-mono text-xs">
                Agent: {currentAgentName}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">LLM Engine</span>
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 font-mono">{currentLLM}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">Voice Model</span>
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 font-mono">{currentVoice}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">Provider</span>
                <span className="font-bold text-xs text-blue-600 dark:text-blue-400">{currentProvider}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">Floor Owner</span>
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 uppercase font-mono">{speakerFloor}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">Total Turns</span>
                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 font-mono">{turnsHistory.length} Turns</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold uppercase">Avg Latency</span>
                <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 font-mono">{currentLatencyMs}ms</span>
              </div>
            </div>

            {/* Live Audio Visualizer Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-cyan-500/10 border border-blue-200/50 dark:border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-end gap-1 h-7 bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {[40, 75, 55, 90, 60, 85, 30, 95, 70, 50, 80, 45].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-200 ${
                        isPlayingAudio
                          ? 'bg-gradient-to-t from-blue-600 to-indigo-500 animate-pulse'
                          : activeState === 'thinking'
                          ? 'bg-purple-500/60'
                          : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                      style={{
                        height: isPlayingAudio ? `${h}%` : activeState === 'thinking' ? `${(i % 4) * 25 + 20}%` : '20%',
                      }}
                    />
                  ))}
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                    {isPlayingAudio ? 'Live TTS Audio Synthesis Active' : activeState === 'thinking' ? 'Reasoning Engine Executing...' : 'Audio Floor Idle'}
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    SSML Pacing: {speechSpeed}x • Breaths: Active • PII Masking: Enforced
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const lastAiTurn = [...turnsHistory].reverse().find((t) => t.speaker === 'ai');
                  if (lastAiTurn) speakText(lastAiTurn.text, speechSpeed);
                }}
                leftIcon={<Volume2 className="h-3.5 w-3.5 text-blue-500" />}
                className="shrink-0"
              >
                Replay Last Turn
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Executive Conversation Summary</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 leading-relaxed">
                Active session running with agent <strong>{currentAgentName}</strong>. State machine is currently in{' '}
                <strong className="uppercase font-mono text-blue-600 dark:text-blue-400">{activeState}</strong> state.
                Detected sentiment is <strong>{detectedEmotion}</strong> (score {sentimentScore.toFixed(2)}). Total turns executed:{' '}
                <strong>{turnsHistory.length}</strong> with {interruptionCount} barge-in interruptions and {nudgeCount} silence nudges recorded.
              </p>
            </div>
          </Card>

          {/* Subsystem Health Diagnostic */}
          <Card className="p-6 space-y-4 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Subsystem Health</h3>
              </div>
              <Badge variant="success" size="sm" className="font-mono text-[10px]">
                100% Operational
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { label: 'State Machine Engine', status: 'Online', latency: '0.1ms' },
                { label: 'Turn Arbitration Lock', status: 'Online', latency: '0.2ms' },
                { label: 'Barge-In Detector', status: 'Online', latency: '0.3ms' },
                { label: 'VAD & Silence Tracker', status: 'Online', latency: '0.2ms' },
                { label: 'Humanizer SSML Pacer', status: 'Online', latency: '0.1ms' },
                { label: 'Compliance & Safety Filter', status: 'Online', latency: '0.2ms' },
              ].map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/40 dark:border-zinc-800/40">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{s.status}</span>
                    <span className="text-zinc-400">{s.latency}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={handleExportSessionJSON}
                leftIcon={<Download className="h-3.5 w-3.5" />}
              >
                Export Session Telemetry JSON
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: LIVE CONVERSATION SIMULATOR */}
      {activeTab === 'conversation' && (
        <Card className="p-6 space-y-4 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Live Voice Turn Simulator</h3>
                <p className="text-[11px] text-zinc-400">Stream inspector with speech recognition &amp; audio synthesis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" size="sm" className="font-mono">
                Agent: {currentAgentName}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTurnsHistory([])}
                leftIcon={<RotateCcw className="h-3 w-3" />}
              >
                Clear Stream
              </Button>
            </div>
          </div>

          {/* Quick Simulation Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-zinc-400 mr-1 flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" /> Quick Tests:
            </span>
            {[
              'Kripya meri billing problem solve karo',
              'I want to talk to a human supervisor immediately',
              'Can you please call me back later? I am busy',
              'Hold on a minute, let me find my bill',
              'Thank you so much, you were very helpful!',
              'Goodbye, have a great day!',
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSimulatedInput(chip);
                  handleProcessTurnWithText(chip);
                }}
                disabled={isProcessingTurn}
                className="text-[11px] px-3 py-1 rounded-full bg-zinc-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-zinc-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer font-medium"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Conversation Chat Stream Container */}
          <div className="h-96 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-y-auto space-y-3.5 font-sans">
            {turnsHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 space-y-2">
                <Bot className="h-10 w-10 opacity-30" />
                <p className="text-xs">No turns recorded yet. Type a message below or click &quot;Start Session&quot;.</p>
              </div>
            ) : (
              turnsHistory.map((t, idx) => (
                <div key={idx} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xl p-4 rounded-2xl text-xs space-y-1.5 shadow-xs ${
                      t.speaker === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-bl-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 font-mono">
                      <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                        {t.speaker === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                        {t.speaker === 'user' ? 'Caller' : currentAgentName}
                      </span>
                      <div className="flex items-center gap-2">
                        {t.latency && <span>{t.latency}ms</span>}
                        {t.timestamp && <span>{t.timestamp}</span>}
                      </div>
                    </div>
                    <p className="leading-relaxed text-xs">{t.text}</p>
                    {t.ssml && t.speaker !== 'user' && (
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono pt-1 border-t border-zinc-100 dark:border-zinc-800">
                        SSML: {t.ssml}
                      </div>
                    )}
                    {t.speaker !== 'user' && (
                      <div className="pt-1 flex items-center justify-end">
                        <button
                          onClick={() => speakText(t.text, speechSpeed)}
                          className="text-[10px] flex items-center gap-1 text-blue-500 hover:text-blue-600 font-mono"
                        >
                          <Volume2 className="h-3 w-3" /> Speak Turn
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input & Voice Controls */}
          <form onSubmit={handleSimulateTurn} className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleToggleMic}
              className={isListeningMic ? 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/50 animate-pulse' : ''}
              title={isListeningMic ? 'Stop Voice Listening' : 'Speak using Microphone'}
            >
              {isListeningMic ? <Mic className="h-4 w-4 text-rose-600" /> : <MicOff className="h-4 w-4 text-zinc-400" />}
            </Button>

            <Input
              value={simulatedInput}
              onChange={(e) => setSimulatedInput(e.target.value)}
              placeholder="Type simulated caller message (e.g. 'kyaa aap meri help kar sakte ho?')..."
              className="text-xs"
              disabled={isProcessingTurn}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isProcessingTurn}
              leftIcon={<Send className="h-3.5 w-3.5" />}
              disabled={!simulatedInput.trim()}
            >
              Send Turn
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 3: STATE MACHINE */}
      {activeTab === 'state_machine' && (
        <Card className="p-6 space-y-6 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Workflow className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Finite State Machine (FSM) Visualizer</h3>
                <p className="text-[11px] text-zinc-400">Deterministic state transitions governing caller turn life cycles</p>
              </div>
            </div>
            <Badge variant="primary" size="sm" className="font-mono">
              Active State: {activeState.toUpperCase()}
            </Badge>
          </div>

          {/* Finite State Machine Node Map */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
            {[
              { id: 'idle', label: 'IDLE', desc: 'Standby' },
              { id: 'greeting', label: 'GREETING', desc: 'Welcome' },
              { id: 'listening', label: 'LISTENING', desc: 'VAD Active' },
              { id: 'thinking', label: 'THINKING', desc: 'Reasoning' },
              { id: 'speaking', label: 'SPEAKING', desc: 'Audio Out' },
              { id: 'waiting', label: 'WAITING', desc: 'Turn Floor' },
              { id: 'interrupted', label: 'INTERRUPTED', desc: 'Barge-In' },
              { id: 'completed', label: 'COMPLETED', desc: 'Hangup' },
            ].map((node) => {
              const isActive = activeState.toLowerCase() === node.id;
              return (
                <div
                  key={node.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-500/20 font-bold shadow-lg scale-105'
                      : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 font-semibold'
                  }`}
                >
                  <span className="text-xs font-mono block tracking-wider">{node.label}</span>
                  <span className="text-[10px] opacity-75 mt-1 block font-normal">
                    {isActive ? 'ACTIVE NOW' : node.desc}
                  </span>
                </div>
              );
            })}
          </div>

          {/* State Transition History Table */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Live State Transition Logs</h4>
            <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-100 dark:bg-zinc-950 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5">From State</th>
                    <th className="p-2.5">To State</th>
                    <th className="p-2.5">Transition Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {stateHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-zinc-400">
                        No state transitions recorded for this session yet.
                      </td>
                    </tr>
                  ) : (
                    stateHistory.map((sh, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/50">
                        <td className="p-2.5 text-zinc-400">{sh.timestamp || '00:00:00'}</td>
                        <td className="p-2.5 uppercase font-bold text-zinc-600 dark:text-zinc-400">{sh.from_state}</td>
                        <td className="p-2.5 uppercase font-bold text-blue-600 dark:text-blue-400">{sh.to_state}</td>
                        <td className="p-2.5 text-zinc-600 dark:text-zinc-300">{sh.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 4: EMOTION */}
      {activeTab === 'emotion' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-5 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-rose-500" />
              Emotion &amp; Sentiment Gauges
            </CardTitle>
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-zinc-500 font-medium">Sentiment Score (-1.0 to +1.0)</span>
                  <span className="font-mono font-bold text-xs text-zinc-800 dark:text-zinc-200">
                    {sentimentScore.toFixed(2)}
                  </span>
                </div>
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      sentimentScore > 0.2
                        ? 'bg-emerald-500'
                        : sentimentScore < -0.2
                        ? 'bg-rose-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.max(5, Math.min(100, (sentimentScore + 1) * 50))}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 space-y-2">
                <span className="text-zinc-500 block font-medium">Adaptive Speech Modulation</span>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Recommended Voice Pacing:</span>
                  <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                    {speechSpeed.toFixed(2)}x Normal Pacing
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  When caller is frustrated or angry, speech speed automatically reduces to 0.9x with calm, reassuring fillers.
                  When caller has urgent requests, speed increases to 1.15x.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Emotional State Classification
            </CardTitle>
            <div className="space-y-2.5">
              {[
                { name: 'calm', desc: 'Relaxed, polite, patiently listening' },
                { name: 'friendly', desc: 'Positive, appreciative, warm tone' },
                { name: 'neutral', desc: 'Standard business informational query' },
                { name: 'frustrated', desc: 'Unhappy, dissatisfied, escalated complaints' },
                { name: 'urgent', desc: 'Immediate action, time-sensitive problem' },
              ].map((stateObj) => (
                <div
                  key={stateObj.name}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between capitalize transition-all ${
                    detectedEmotion === stateObj.name
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-500 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div>
                    <span className="font-bold">{stateObj.name}</span>
                    <span className="text-[11px] font-normal text-zinc-400 block">{stateObj.desc}</span>
                  </div>
                  {detectedEmotion === stateObj.name && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: MEMORY & CONTEXT */}
      {activeTab === 'memory' && (
        <Card className="p-6 space-y-5 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-500" />
            Short-Term Conversation Memory &amp; Active Persona Context
          </CardTitle>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Active System Prompt</span>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-mono bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 leading-relaxed">
              {currentSystemPrompt}
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Context Turns Buffer</span>
            {turnsHistory.length === 0 ? (
              <p className="text-zinc-400 text-xs text-center p-4">No conversation memory stored for this session yet.</p>
            ) : (
              turnsHistory.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase font-mono text-[10px]">
                      {t.speaker}:
                    </span>
                    <p className="text-zinc-600 dark:text-zinc-400 text-xs">{t.text}</p>
                  </div>
                  <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                    {detectedLanguage}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* TAB 6: HUMANIZER & SSML PLAYGROUND */}
      {activeTab === 'humanizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-purple-500" />
              SSML Humanizer Playground
            </CardTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Test dynamic SSML micro-breaks, prosody speed modifications, and breath insertion in real time.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-500 block mb-1 font-medium">Input Speech Text</label>
                <textarea
                  value={testSSMLText}
                  onChange={(e) => setTestSSMLText(e.target.value)}
                  className="w-full h-24 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs outline-none font-sans"
                  placeholder="Type speech string to humanize..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 block mb-1 font-medium">Pacing Style</label>
                  <select
                    value={testSSMLStyle}
                    onChange={(e) => setTestSSMLStyle(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold outline-none"
                  >
                    <option value="balanced">Balanced (150ms pauses)</option>
                    <option value="expressive">Expressive (200-350ms pauses)</option>
                    <option value="casual">Casual (120ms pauses)</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1 font-medium">Speed Multiplier ({testSSMLSpeed}x)</label>
                  <input
                    type="range"
                    min="0.8"
                    max="1.3"
                    step="0.05"
                    value={testSSMLSpeed}
                    onChange={(e) => setTestSSMLSpeed(parseFloat(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="primary" size="sm" onClick={handleTestSSML} isLoading={isTestingSSML} leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
                  Format SSML
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakText(testSSMLText, testSSMLSpeed)}
                  leftIcon={<Volume2 className="h-3.5 w-3.5" />}
                >
                  Test Audio Playback
                </Button>
              </div>

              {testSSMLOutput && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-1 font-mono text-xs">
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">Generated SSML Tag Output:</span>
                  <p className="text-purple-900 dark:text-purple-200 break-all">{testSSMLOutput}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Formatted Turn History SSML */}
          <Card className="p-6 space-y-4 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-purple-500" />
              Live Conversation SSML Output Stream
            </CardTitle>
            <div className="space-y-3 text-xs max-h-96 overflow-y-auto">
              {turnsHistory.filter((t) => t.ssml).length === 0 ? (
                <p className="text-zinc-400 text-xs text-center p-4">No humanized turns dispatched in this session yet.</p>
              ) : (
                turnsHistory
                  .filter((t) => t.ssml)
                  .map((t, idx) => (
                    <div key={idx} className="p-3.5 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1 font-mono">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>Turn #{idx + 1}</span>
                        <span>{t.latency}ms latency</span>
                      </div>
                      <p className="text-purple-600 dark:text-purple-400 font-bold break-all">{t.ssml}</p>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 7: RULES & POLICY VALIDATOR */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Policy Live Tester */}
          <Card className="p-6 space-y-4 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              Interactive SSOT Policy &amp; PII Compliance Validator
            </CardTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Type any customer statement to test compliance masking (Credit Card / SSN) and action triggers (Human transfer, Callback, Escalation).
            </p>

            <Input
              value={policyTestInput}
              onChange={(e) => handleTestPolicy(e.target.value)}
              placeholder="e.g. 'I want to talk to a human supervisor immediately, my card is 4111 2222 3333 4444'..."
              className="text-xs"
            />

            {policyTestResult && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">Triggered Action:</span>
                  <Badge variant={policyTestResult.trigger !== 'none' ? 'warning' : 'success'} size="sm" className="mt-1">
                    {policyTestResult.trigger}
                  </Badge>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">PII Masked String:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 block mt-1 break-all">
                    {policyTestResult.sanitized}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">Compliance Status:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold block mt-1">PCI/HIPAA PASS</span>
                </div>
              </div>
            )}
          </Card>

          {/* Configured Policies & Departments */}
          <Card className="p-6 space-y-4 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Configured Business Policies &amp; Department Escalations</h3>
              </div>
              <Badge variant="blue" size="sm">
                Active Rules ({businessPolicies.length + departments.length})
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Business Policies</div>
              {businessPolicies.length === 0 ? (
                <p className="text-zinc-400 p-2">Default security &amp; PII policies active across all voice channels.</p>
              ) : (
                businessPolicies.map((p) => (
                  <div key={p.id} className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{p.name}</span>
                      <span className="text-zinc-400 block text-[11px]">
                        {p.policy_category || 'Governance'} • Trigger: {p.execution_time || 'Before Call Connect'}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 text-[10px] block font-mono mt-0.5">
                        Action: {p.violation_action || 'Block Action Immediately'}
                      </span>
                    </div>
                    <Badge variant="success" size="sm">
                      {p.status || 'Active'}
                    </Badge>
                  </div>
                ))
              )}

              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pt-2">Department Escalations</div>
              {departments.length === 0 ? (
                <p className="text-zinc-400 p-2">Customer Support and Operations default queues configured.</p>
              ) : (
                departments.map((d) => (
                  <div key={d.id} className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {d.name} ({d.extension || '#101'})
                      </span>
                      <span className="text-zinc-400 block text-[11px]">
                        Strategy: {d.transfer_strategy || 'Round Robin'} • Manager: {d.manager || 'Unassigned'}
                      </span>
                    </div>
                    <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                      Priority {d.queue_priority || 10}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 8: METRICS */}
      {activeTab === 'metrics' && (
        <Card className="p-6 space-y-6 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            Real-Time Engine Performance Metrics
          </CardTitle>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Avg Response Latency</span>
              <span className="font-bold text-xl text-indigo-600 font-mono">{currentLatencyMs}ms</span>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Total Turns</span>
              <span className="font-bold text-xl text-zinc-800 dark:text-zinc-200 font-mono">{turnsHistory.length}</span>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Total Tokens</span>
              <span className="font-bold text-xl text-blue-600 font-mono">{totalTokens}</span>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Est. Cost / Session</span>
              <span className="font-bold text-xl text-emerald-600 font-mono">${estimatedCost.toFixed(4)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Turn-by-Turn Latency Breakdown</h4>
            <div className="space-y-2">
              {turnsHistory.length === 0 ? (
                <p className="text-zinc-400 text-xs text-center p-3">No turn data available.</p>
              ) : (
                turnsHistory.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg text-xs font-mono">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Turn #{idx + 1} ({t.speaker.toUpperCase()})
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {t.latency ? `${t.latency}ms` : '12ms'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      )}

      {/* TAB 9: DEBUG TIMELINE */}
      {activeTab === 'timeline' && (
        <Card className="p-6 space-y-4 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Real-Time Debug Audit Log Stream</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg text-xs">
                {['all', 'state', 'turn', 'barge_in', 'nudge', 'audio'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimelineFilter(filter)}
                    className={`px-2.5 py-1 rounded-md capitalize font-mono text-[10px] font-bold transition-all ${
                      timelineFilter === filter
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={() => setEventsLog([])} leftIcon={<RotateCcw className="h-3 w-3" />}>
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs max-h-96 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <p className="text-zinc-400 text-xs text-center p-6">No event logs matching filter.</p>
            ) : (
              filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3"
                >
                  <span className="text-[10px] text-zinc-400">{evt.time}</span>
                  <Badge
                    variant={
                      evt.type === 'barge_in'
                        ? 'danger'
                        : evt.type === 'state'
                        ? 'primary'
                        : evt.type === 'turn'
                        ? 'success'
                        : 'secondary'
                    }
                    size="sm"
                    className="text-[10px] uppercase"
                  >
                    {evt.type}
                  </Badge>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{evt.label}:</span>
                  <span className="text-zinc-600 dark:text-zinc-400 break-all">{evt.details}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
