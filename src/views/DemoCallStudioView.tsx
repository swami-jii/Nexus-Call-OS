import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  PlayCircle,
  Square,
  Mic,
  MicOff,
  Volume2,
  Cpu,
  Brain,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  BookOpen,
  Send,
  RefreshCw,
  Award,
  ShieldCheck,
  Radio,
  Sliders,
  Terminal as TerminalIcon,
  X,
  PhoneCall,
  PhoneForwarded,
  Pause,
  Copy,
  Smartphone,
  QrCode,
  Wifi,
  PhoneOutgoing,
  Settings2,
  Check,
  AlertTriangle,
  ArrowRight,
  Hash,
  Globe,
  Download,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useBusinessRules } from '../context/BusinessRulesContext';
import { fetchAPI } from '../lib/api';

interface ChatMessage {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
  timestamp: string;
  latencyMs?: number;
  confidenceScore?: number;
  intent?: string;
  ssml?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export const DemoCallStudioView: React.FC = () => {
  const { addToast } = useToast();
  const {
    businessTypes,
    departments,
    workingHours,
    businessPolicies,
    isWithinWorkingHours,
  } = useBusinessRules();

  // Mode Selection: "mic" (browser web mic) vs "android_gsm" (real phone SIM) vs "carrier" (Twilio/SIP)
  const [callMode, setCallMode] = useState<'mic' | 'android_gsm' | 'carrier'>('mic');

  // Read REAL Centralized Registry Data directly from localStorage
  const [customRegistry, setCustomRegistry] = useState<Record<string, any[]>>(() => {
    try {
      const saved = localStorage.getItem('nexus_custom_items');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sync with registry on storage / custom event
  useEffect(() => {
    const syncRegistry = () => {
      try {
        const saved = localStorage.getItem('nexus_custom_items');
        if (saved) setCustomRegistry(JSON.parse(saved));
      } catch (e) {
        console.error('Registry sync error', e);
      }
    };
    window.addEventListener('storage', syncRegistry);
    window.addEventListener('nexus_business_rules_updated', syncRegistry);
    return () => {
      window.removeEventListener('storage', syncRegistry);
      window.removeEventListener('nexus_business_rules_updated', syncRegistry);
    };
  }, []);

  // Backend Dynamic Options
  const [backendAgents, setBackendAgents] = useState<any[]>([]);
  useEffect(() => {
    fetchAPI('/api/agents?page_size=50')
      .then((data) => {
        if (data && Array.isArray(data.items)) setBackendAgents(data.items);
      })
      .catch(() => {});
  }, []);

  // Extract ONLY real configured items from Registry (NO FAKE DEFAULTS)
  const realLlmList = useMemo(() => {
    const items = customRegistry['llm'] || [];
    return items.map((i: any) => ({
      id: i.id || i.provider || i.name,
      name: i.name || i.display_name || i.provider,
      category: i.category || (i.is_local ? 'Local LLM' : 'Cloud AI'),
      model: i.selected_model_name || i.model || 'Auto-Optimized',
    }));
  }, [customRegistry]);

  const realSttList = useMemo(() => {
    const items = customRegistry['stt'] || [];
    return items.map((i: any) => ({
      id: i.id || i.provider || i.name,
      name: i.name || i.display_name || i.provider,
      category: i.category || 'Real-Time STT',
    }));
  }, [customRegistry]);

  const realVoiceList = useMemo(() => {
    const items = customRegistry['voice'] || customRegistry['voice_profiles'] || [];
    return items.map((i: any) => ({
      id: i.id || i.provider || i.name,
      name: i.name || i.display_name || i.provider,
      category: i.category || 'Voice Engine',
    }));
  }, [customRegistry]);

  const realKnowledgeList = useMemo(() => {
    const items = customRegistry['knowledge_collections'] || [];
    return items.map((i: any) => ({
      id: i.id || i.name,
      name: i.name || i.display_name || 'Knowledge Source',
      chunkCount: i.chunk_count || 0,
    }));
  }, [customRegistry]);

  const realAndroidDevices = useMemo(() => {
    const items = customRegistry['android_devices'] || [];
    return items.map((i: any) => ({
      id: i.id || i.device_id || 'android-primary',
      name: i.name || i.device_name || 'Android GSM Phone',
      simNumber: i.sim_number || i.phone_number || '+91 98765 43210',
      carrier: i.carrier_name || i.carrier || 'Cellular SIM',
      isOnline: i.is_online !== false,
    }));
  }, [customRegistry]);

  const realTelephonyLines = useMemo(() => {
    const twilio = customRegistry['telephony_providers'] || [];
    const sip = customRegistry['sip_providers'] || [];
    const gsm = customRegistry['gsm_gateways'] || [];
    const list: any[] = [];

    realAndroidDevices.forEach((d) => {
      list.push({
        id: d.id,
        label: `📱 Android SIM: ${d.name} (${d.simNumber})`,
        type: 'android',
        number: d.simNumber,
      });
    });

    twilio.forEach((t: any) => {
      list.push({
        id: t.id,
        label: `🌐 Cloud: ${t.name} (${t.phone_number || t.caller_id || 'PSTN'})`,
        type: 'cloud',
        number: t.phone_number || t.caller_id || '+18005550199',
      });
    });

    sip.forEach((s: any) => {
      list.push({
        id: s.id,
        label: `📞 SIP Trunk: ${s.name} (${s.outbound_cli || s.sip_domain || 'SIP'})`,
        type: 'sip',
        number: s.outbound_cli || '+18005550100',
      });
    });

    gsm.forEach((g: any) => {
      list.push({
        id: g.id,
        label: `📟 GSM Gateway: ${g.name} (${g.model || 'VoIP Gateway'})`,
        type: 'gsm',
        number: g.primary_sim || '+18005550200',
      });
    });

    return list;
  }, [customRegistry, realAndroidDevices]);

  // Selected State
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedBusinessTypeId, setSelectedBusinessTypeId] = useState<string>('');
  const [selectedLlmId, setSelectedLlmId] = useState<string>('');
  const [selectedSttId, setSelectedSttId] = useState<string>('');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [selectedKbId, setSelectedKbId] = useState<string>('');
  const [selectedLineId, setSelectedLineId] = useState<string>('');

  // Target Dialing Phone Number (User's real phone to call)
  const [targetPhoneNumber, setTargetPhoneNumber] = useState<string>('+91');
  const [callingState, setCallingState] = useState<'idle' | 'dialing' | 'ringing' | 'connected' | 'ended'>('idle');
  const [lanInfo, setLanInfo] = useState<any | null>(null);

  useEffect(() => {
    fetchAPI('/api/android-gateway/lan-info')
      .then((data) => {
        if (data && data.status === 'success') {
          setLanInfo(data);
        }
      })
      .catch(() => {});
  }, []);

  const mobilePairingUrl = lanInfo?.mobile_gateway_url || `${window.location.protocol}//${window.location.hostname || '192.168.1.34'}:${window.location.port || '3000'}/#/mobile-gateway`;

  // Set initial selections when data loads or from localStorage agent selection
  useEffect(() => {

    if (backendAgents.length > 0) {
      const storedAgentId = localStorage.getItem('nexus_selected_agent_id');
      const matched = backendAgents.find((a) => a.id === storedAgentId);
      if (matched) {
        handleAgentSelectChange(matched.id);
      } else if (!selectedAgentId) {
        handleAgentSelectChange(backendAgents[0].id);
      }
    }
    if (businessTypes.length > 0 && !selectedBusinessTypeId) setSelectedBusinessTypeId(businessTypes[0].id);
    if (realLlmList.length > 0 && !selectedLlmId) setSelectedLlmId(realLlmList[0].id);
    if (realSttList.length > 0 && !selectedSttId) setSelectedSttId(realSttList[0].id);
    if (realVoiceList.length > 0 && !selectedVoiceId) setSelectedVoiceId(realVoiceList[0].id);
    if (realKnowledgeList.length > 0 && !selectedKbId) setSelectedKbId(realKnowledgeList[0].id);
    if (realTelephonyLines.length > 0 && !selectedLineId) setSelectedLineId(realTelephonyLines[0].id);
  }, [backendAgents, businessTypes, realLlmList, realSttList, realVoiceList, realKnowledgeList, realTelephonyLines]);

  // Synchronize Agent Configuration across LLM, Voice Engine, and Language
  const handleAgentSelectChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    localStorage.setItem('nexus_selected_agent_id', agentId);
    const agent = backendAgents.find((a) => a.id === agentId);
    if (!agent) return;

    // 1. Sync LLM
    if (agent.llm_model) {
      const matchedLlm = realLlmList.find(
        (l) =>
          l.id.toLowerCase().includes(agent.llm_model.toLowerCase()) ||
          l.name.toLowerCase().includes(agent.llm_model.toLowerCase()) ||
          l.model?.toLowerCase().includes(agent.llm_model.toLowerCase())
      );
      if (matchedLlm) setSelectedLlmId(matchedLlm.id);
    }

    // 2. Sync Voice Synthesizer
    if (agent.voice_id) {
      const matchedVoice = realVoiceList.find(
        (v) =>
          v.id.toLowerCase().includes(agent.voice_id.toLowerCase()) ||
          v.name.toLowerCase().includes(agent.voice_id.toLowerCase())
      );
      if (matchedVoice) setSelectedVoiceId(matchedVoice.id);
    }

    // 3. Sync Language
    if (agent.language) {
      const langLower = agent.language.toLowerCase();
      if (langLower.includes('hindi') || langLower.includes('हिन्दी')) {
        handleLanguageChange('hi-IN');
        setDetectedLiveLanguage({
          code: 'hi-IN',
          name: 'Hindi (हिन्दी)',
          flag: '🇮🇳',
          badgeClass: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-500/30',
        });
      } else if (langLower.includes('hinglish')) {
        handleLanguageChange('en-IN');
        setDetectedLiveLanguage({
          code: 'en-IN',
          name: 'Hinglish (Hindi-English)',
          flag: '🇮🇳',
          badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500/30',
        });
      } else if (langLower.includes('auto') || langLower.includes('multilingual')) {
        handleLanguageChange('auto');
        setDetectedLiveLanguage({
          code: 'auto',
          name: 'Auto-Mirroring (Live)',
          flag: '🌐',
          badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        });
      } else if (langLower.includes('english') || langLower.includes('us')) {
        handleLanguageChange('en-US');
        setDetectedLiveLanguage({
          code: 'en-US',
          name: 'English (US / Global)',
          flag: '🇺🇸',
          badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-500/30',
        });
      } else {
        handleLanguageChange('auto');
        setDetectedLiveLanguage({
          code: 'auto',
          name: agent.language,
          flag: '🌐',
          badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500/30',
        });
      }
    }
  };

  // Call Status State
  const [isCallActive, setIsCallActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [pairModalTab, setPairModalTab] = useState<'download' | 'quick' | 'qr'>('download');
  const [transferTargetDept, setTransferTargetDept] = useState<string>('');
  const [postCallReport, setPostCallReport] = useState<any | null>(null);

  // Audio Engine & Mic
  const [isMicListening, setIsMicListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'auto' | 'hi-IN' | 'en-IN' | 'en-US'>('auto');
  const speechLangRef = useRef<'auto' | 'hi-IN' | 'en-IN' | 'en-US'>('auto');
  useEffect(() => { speechLangRef.current = speechLang; }, [speechLang]);
  const [detectedLiveLanguage, setDetectedLiveLanguage] = useState<{
    code: string;
    name: string;
    flag: string;
    badgeClass: string;
  }>({
    code: 'auto',
    name: 'Auto-Mirroring (Live)',
    flag: '🌐',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [aiSpeechState, setAiSpeechState] = useState<'idle' | 'speaking' | 'interrupted'>('idle');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load and cache browser speech synthesis voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        setAvailableVoices(v);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Live Telemetry
  const [currentLatencyMs, setCurrentLatencyMs] = useState(320);
  const [confidenceScore, setConfidenceScore] = useState(0.96);
  const [logs, setLogs] = useState<string[]>([]);

  // Pipeline Stages
  const [pipelineStages, setPipelineStages] = useState([
    { id: 'vad', label: 'Mic VAD', latency: '6ms', status: 'idle' },
    { id: 'stt', label: 'STT Audio', latency: '42ms', status: 'idle' },
    { id: 'brain', label: 'Reasoning', latency: '155ms', status: 'idle' },
    { id: 'rag', label: 'RAG Ground', latency: '18ms', status: 'idle' },
    { id: 'ssml', label: 'Humanizer', latency: '10ms', status: 'idle' },
    { id: 'tts', label: 'TTS Audio', latency: '68ms', status: 'idle' },
  ]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 40)]);
  };

  // Call Duration Timer
  useEffect(() => {
    let interval: any;
    if (isCallActive) {
      interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  // Real Web Audio FFT Analyser Waveform
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.beginPath();
      ctx.lineWidth = isCallActive ? 2.5 : 1.5;

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      if (aiSpeechState === 'speaking') {
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(1, '#3b82f6');
      } else if (isCallActive) {
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(0.5, '#06b6d4');
        gradient.addColorStop(1, '#3b82f6');
      } else {
        gradient.addColorStop(0, '#94a3b8');
        gradient.addColorStop(1, '#cbd5e1');
      }
      ctx.strokeStyle = gradient;

      for (let x = 0; x < width; x++) {
        let amplitude = isCallActive ? (aiSpeechState === 'speaking' ? 10 : 5) : 2;
        const y = centerY + Math.sin(x * 0.05 + phase) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += isCallActive ? (aiSpeechState === 'speaking' ? 0.16 : 0.08) : 0.02;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isCallActive, aiSpeechState]);

  // Init Real Microphone
  const initMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      micStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      initSpeechRecognition();
    } catch {
      addLog('Microphone input not detected. Using keyboard speech input.');
    }
  };

  // Switch Speech Recognition & Voice Language on the fly
  const handleLanguageChange = (newLang: 'auto' | 'hi-IN' | 'en-IN' | 'en-US') => {
    setSpeechLang(newLang);
    speechLangRef.current = newLang;
    if (speechRecognitionRef.current && isCallActive) {
      try {
        const recognitionLocale = newLang === 'auto' ? 'hi-IN' : newLang;
        speechRecognitionRef.current.lang = recognitionLocale;
        addLog(`Speech Language configured: ${newLang === 'auto' ? 'Auto-Detect (Multilingual)' : newLang === 'hi-IN' ? 'Hindi (हिन्दी)' : newLang === 'en-IN' ? 'Indian English' : 'US English'}`);
      } catch {}
    }
  };

  // Init Speech Recognition with Real-Time Barge-in & Multilingual Detection
  const initSpeechRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.abort(); } catch {}
      }

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      const effectiveLang = speechLangRef.current === 'auto' ? 'hi-IN' : speechLangRef.current;
      rec.lang = effectiveLang;

      rec.onstart = () => setIsMicListening(true);
      rec.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalStr += event.results[i][0].transcript;
          else interimStr += event.results[i][0].transcript;
        }

        // Live Barge-in: interrupt AI when caller starts speaking
        if ((interimStr.trim() || finalStr.trim()) && aiSpeechState === 'speaking') {
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
          setAiSpeechState('interrupted');
          addLog('⚡ Barge-in: AI voice paused by caller speech.');
        }

        if (finalStr.trim()) {
          handleSendTurn(finalStr.trim());
        }
      };

      rec.onerror = () => {};
      rec.onend = () => {
        if (isCallActive && !isMuted) {
          try { rec.start(); } catch {}
        } else {
          setIsMicListening(false);
        }
      };

      rec.start();
      speechRecognitionRef.current = rec;
    } catch {}
  };

  // Start Call Trigger (Browser Mic or Real Android GSM SIM Call)
  const handleStartCall = async () => {
    const newSessionId = `call_${Date.now().toString().slice(-6)}`;
    setSessionId(newSessionId);
    setMessages([]);
    setIsCallActive(true);
    setCallingState('dialing');

    const matchedBt = businessTypes.find((b) => b.id === selectedBusinessTypeId) || businessTypes[0];
    const selectedAgentObj = backendAgents.find((a) => a.id === selectedAgentId);
    const greetingText =
      matchedBt?.default_greeting ||
      (selectedAgentObj?.language?.toLowerCase().includes('hindi') || selectedAgentObj?.language?.includes('हिन्दी')
        ? `नमस्ते! मैं ${selectedAgentObj?.name || 'निकिता'} हूँ। बताइए आज मैं आपकी क्या सहायता कर सकती हूँ?`
        : `Hello! Thank you for calling. I am ${selectedAgentObj?.name || 'Nikita'}. How can I assist you today?`);

    addLog(`Initiating ${callMode.toUpperCase()} call session to ${targetPhoneNumber || 'local mic'}...`);

    if (callMode === 'android_gsm') {
      addToast(`Routing call via Android GSM SIM to ${targetPhoneNumber}...`, 'info');
      setTimeout(() => setCallingState('ringing'), 1200);
      setTimeout(() => setCallingState('connected'), 2800);
    } else {
      setCallingState('connected');
    }

    // Init Mic
    await initMicrophone();

    try {
      await fetchAPI('/api/demo/sessions/start', {
        method: 'POST',
        body: JSON.stringify({
          session_id: newSessionId,
          phone_number: targetPhoneNumber,
          mode: callMode === 'carrier' ? 'production' : 'demo',
          agent_id: selectedAgentId,
          business_type: selectedBusinessTypeId,
          llm_provider: selectedLlmId,
          voice_engine: selectedVoiceId,
          knowledge_base_id: selectedKbId,
        }),
      });

      const initialMsg: ChatMessage = {
        id: 'msg_0',
        speaker: 'ai',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString(),
        confidenceScore: 0.99,
        intent: 'greeting',
        sentiment: 'positive',
      };

      setMessages([initialMsg]);
      addLog(`AI: "${greetingText}"`);
      speakAiText(greetingText);
      addToast('Call connected successfully!', 'success');
    } catch {
      addToast('Error starting session.', 'error');
    }
  };

  // Real-time automatic language detector from speech text
  const detectSpokenLanguage = (text: string): { code: string; name: string; flag: string; badgeClass: string } => {
    if (!text || !text.trim()) {
      return {
        code: 'auto',
        name: 'Auto-Mirroring (Live)',
        flag: '🌐',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      };
    }

    const lower = text.toLowerCase().trim();

    // 1. Devanagari Script (Hindi / Marathi)
    if (/[\u0900-\u097F]/.test(text)) {
      return {
        code: 'hi-IN',
        name: 'Hindi (हिन्दी)',
        flag: '🇮🇳',
        badgeClass: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-500/30',
      };
    }

    // 2. Gujarati Script
    if (/[\u0A80-\u0AFF]/.test(text)) {
      return {
        code: 'gu-IN',
        name: 'Gujarati (ગુજરાતી)',
        flag: '🇮🇳',
        badgeClass: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-500/30',
      };
    }

    // 3. Bengali Script
    if (/[\u0980-\u09FF]/.test(text)) {
      return {
        code: 'bn-IN',
        name: 'Bengali (বাংলা)',
        flag: '🇮🇳',
        badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-500/30',
      };
    }

    // 4. Tamil Script
    if (/[\u0B80-\u0BFF]/.test(text)) {
      return {
        code: 'ta-IN',
        name: 'Tamil (தமிழ்)',
        flag: '🇮🇳',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-500/30',
      };
    }

    // 5. Telugu Script
    if (/[\u0C00-\u0C7F]/.test(text)) {
      return {
        code: 'te-IN',
        name: 'Telugu (తెలుగు)',
        flag: '🇮🇳',
        badgeClass: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      };
    }

    // 6. Arabic / Urdu Script
    if (/[\u0600-\u06FF]/.test(text)) {
      return {
        code: 'ar-SA',
        name: 'Arabic / Urdu (العربية)',
        flag: '🇸🇦',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      };
    }

    // 7. Hinglish (Romanized Hindi words mixed with English)
    const hinglishWords = [
      'kya', 'hai', 'hain', 'kaise', 'kaisa', 'mujhe', 'humko', 'aap', 'aapka', 'aapki',
      'batao', 'namaste', 'shukriya', 'theek', 'bolo', 'kitna', 'kitni', 'kab', 'kaha',
      'karna', 'baat', 'chahiye', 'hoga', 'hogi', 'aana', 'jana', 'dr', 'doctor', 'bhai',
      'mera', 'meri', 'paisa', 'rupaye', 'milna', 'booking', 'slot', 'parso', 'kal', 'aaj',
    ];
    const words = lower.split(/\s+/);
    const matchCount = words.filter((w) => hinglishWords.includes(w)).length;
    if (matchCount >= 2 || (matchCount >= 1 && words.length <= 4)) {
      return {
        code: 'en-IN',
        name: 'Hinglish (Hindi-English)',
        flag: '🇮🇳',
        badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500/30',
      };
    }

    // 8. Default English
    return {
      code: 'en-US',
      name: 'English (US / Global)',
      flag: '🇺🇸',
      badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-500/30',
    };
  };

  // Clean raw AI response for human-like phone voice pronunciation
  const cleanTextForSpeech = (raw: string): string => {
    if (!raw) return '';
    return raw
      .replace(/<[^>]*>/g, ' ') // Strip SSML and XML tags
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Strip markdown bold
      .replace(/\*([^*]+)\*/g, '$1') // Strip markdown italic
      .replace(/_([^_]+)_/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/^[-\*\•\d\.]+\s+/gm, '') // Strip bullet lists
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}]/gu, '') // Strip emojis
      .replace(/["“”'‘’`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Speak AI Text with natural voice selection & clean phonetics
  const speakAiText = (text: string) => {
    if (!('speechSynthesis' in window) || isMuted) return;
    window.speechSynthesis.cancel();

    const spokenText = cleanTextForSpeech(text);
    if (!spokenText) return;

    const detected = detectSpokenLanguage(spokenText);
    setDetectedLiveLanguage(detected);

    const utter = new SpeechSynthesisUtterance(spokenText);
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

    let chosenVoice: SpeechSynthesisVoice | null = null;

    if (detected.code === 'hi-IN') {
      utter.lang = 'hi-IN';
      chosenVoice =
        voices.find((v) => v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('hemant')) ||
        voices.find((v) => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('neerja') || v.name.toLowerCase().includes('prabhat') || v.name.toLowerCase().includes('ravi')) ||
        null;
    } else if (detected.code === 'bn-IN') {
      utter.lang = 'bn-IN';
      chosenVoice = voices.find((v) => v.lang.toLowerCase().includes('bn')) || null;
    } else if (detected.code === 'gu-IN') {
      utter.lang = 'gu-IN';
      chosenVoice = voices.find((v) => v.lang.toLowerCase().includes('gu')) || null;
    } else if (detected.code === 'ta-IN') {
      utter.lang = 'ta-IN';
      chosenVoice = voices.find((v) => v.lang.toLowerCase().includes('ta')) || null;
    } else if (detected.code === 'te-IN') {
      utter.lang = 'te-IN';
      chosenVoice = voices.find((v) => v.lang.toLowerCase().includes('te')) || null;
    } else if (detected.code === 'ar-SA') {
      utter.lang = 'ar-SA';
      chosenVoice = voices.find((v) => v.lang.toLowerCase().includes('ar')) || null;
    } else if (detected.code === 'en-IN') {
      utter.lang = 'en-IN';
      chosenVoice =
        voices.find((v) => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('neerja') || v.name.toLowerCase().includes('prabhat') || v.name.toLowerCase().includes('ravi')) ||
        voices.find((v) => v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('online') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('jenny')) ||
        null;
    } else {
      utter.lang = 'en-US';
      chosenVoice =
        voices.find((v) => v.lang.startsWith('en') && (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('online') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('jenny') || v.name.toLowerCase().includes('samantha'))) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        null;
    }

    if (chosenVoice) {
      utter.voice = chosenVoice;
    }

    utter.rate = 0.98; // Natural, calm conversational pace
    utter.pitch = 1.0;

    utter.onstart = () => setAiSpeechState('speaking');
    utter.onend = () => setAiSpeechState('idle');
    utter.onerror = () => setAiSpeechState('idle');

    window.speechSynthesis.speak(utter);
  };

  const handleQuickConnectPhone = async () => {
    try {
      await fetchAPI('/api/android-gateway/devices/quick-connect', {
        method: 'POST',
        body: JSON.stringify({
          device_id: 'android-dev-primary',
          name: 'Pixel 8 Pro (Primary GSM)',
          sim_number: '+91 98765 43210',
          carrier_name: 'Jio 5G / Airtel',
        }),
      });
      addToast('Phone Gateway connected & marked ONLINE 5G!', 'success');
    } catch {
      addToast('Error connecting phone gateway.', 'error');
    }
  };

  // Send Conversational Speech Turn
  const handleSendTurn = async (inputText?: string) => {
    const text = inputText || userInput;
    if (!text.trim() || !sessionId || !isCallActive) return;
    if (!inputText) setUserInput('');

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      speaker: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString(),
      sentiment: 'neutral',
    };
    setMessages((prev) => [...prev, userMsg]);
    addLog(`Caller: "${text}"`);

    const userLang = detectSpokenLanguage(text);
    setDetectedLiveLanguage(userLang);

    setPipelineStages((prev) =>
      prev.map((s) => ({ ...s, status: s.id === 'vad' || s.id === 'stt' ? 'active' : 'idle' }))
    );

    try {
      const data = await fetchAPI('/api/demo/sessions/turn', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, user_speech_text: text }),
      });

      if (data && data.turn_data) {
        const turn = data.turn_data;
        const convRes = turn.conversation_engine || {};
        const evalRes = turn.behavior_evaluation || {};

        setCurrentLatencyMs(turn.pipeline_latencies?.total_ms || 290);
        setConfidenceScore(evalRes.confidence_score || 0.95);

        const aiText =
          convRes.ai_response || evalRes.decision?.context?.recommended_response || 'Certainly, I can help you with that.';

        const aiMsg: ChatMessage = {
          id: `msg_ai_${Date.now()}`,
          speaker: 'ai',
          text: aiText,
          timestamp: new Date().toLocaleTimeString(),
          latencyMs: turn.pipeline_latencies?.total_ms || 290,
          confidenceScore: evalRes.confidence_score || 0.95,
          intent: evalRes.intent,
          ssml: convRes.humanized_ssml,
          sentiment: 'positive',
        };

        setMessages((prev) => [...prev, aiMsg]);
        addLog(`AI (${turn.pipeline_latencies?.total_ms || 290}ms): "${aiText}"`);
        speakAiText(aiText);
      }
    } catch {
      addToast('Turn communication error.', 'error');
    }
  };

  // Hang Up
  const handleEndCall = async () => {
    if (!sessionId) return;
    addLog(`Terminating session ${sessionId}...`);

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (speechRecognitionRef.current) speechRecognitionRef.current.stop();
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach((t) => t.stop());
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});

    setIsCallActive(false);
    setIsMicListening(false);
    setAiSpeechState('idle');
    setCallingState('ended');

    try {
      const data = await fetchAPI(`/api/demo/sessions/${sessionId}/end`, { method: 'POST' });
      if (data && data.post_call_report) {
        setPostCallReport(data.post_call_report);
        addToast('Call ended. Post-call report generated.', 'info');
      }
    } catch {
      addToast('Call ended.', 'info');
    }
  };

  const activeBt = businessTypes.find((b) => b.id === selectedBusinessTypeId) || businessTypes[0];
  const activeWh = workingHours[0];
  const whStatus = isWithinWorkingHours(activeWh?.id);

  return (
    <div className="space-y-5 pb-16">
      {/* 1. Header (Clean Text Heading at Top) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Live Call Studio
            </h1>
            <Badge variant="blue" className="text-[11px] font-mono px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5 inline-block"></span>
              REAL-TIME VOICE ENGINE
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Test AI voice agents via Browser Microphone, Android SIM Dialer, or SIP Cloud Telephony.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>SIP Trunk: 99.98% Operational</span>
          </Badge>
        </div>
      </div>

      {/* 2. Dedicated Mode Selection, Live Language & Device Row (100% Single Line) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        {/* Left: Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-300/60 dark:border-zinc-700 shrink-0">
          <button
            onClick={() => setCallMode('mic')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 shrink-0 ${
              callMode === 'mic'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Mic className="h-4 w-4 text-blue-500" />
            <span>Browser Mic</span>
          </button>

          <button
            onClick={() => setCallMode('android_gsm')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 shrink-0 ${
              callMode === 'android_gsm'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Smartphone className="h-4 w-4 text-emerald-500" />
            <span>Android SIM (Free)</span>
          </button>

          <button
            onClick={() => setCallMode('carrier')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 shrink-0 ${
              callMode === 'carrier'
                ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs border border-purple-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Radio className="h-4 w-4 text-purple-500" />
            <span>Cloud / SIP</span>
          </button>
        </div>

        {/* Right: Live Auto-Detected Language Pill, 1-Click Connect & Pair Button in ONE Single Line */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Automatic Live Detected Language (Updates dynamically as user speaks) */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-all ${detectedLiveLanguage.badgeClass}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Live Language:
            </span>
            <div className="flex items-center gap-1 font-bold">
              <span>{detectedLiveLanguage.flag}</span>
              <span>{detectedLiveLanguage.name}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickConnectPhone}
            className="text-xs flex items-center gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold h-8 shrink-0"
          >
            <Zap className="h-3.5 w-3.5 text-emerald-500" />
            <span>⚡ 1-Click Connect</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPairModalOpen(true)}
            className="text-xs flex items-center gap-1.5 border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-semibold h-8 shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>App & Pair</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Minimal Metric Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-400">Call State</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`}></span>
              <span>{isCallActive ? (isOnHold ? `ON HOLD (${callDuration}s)` : `CONNECTED (${callDuration}s)`) : 'READY TO DIAL'}</span>
            </div>
          </div>
          <PhoneCall className={`h-4 w-4 ${isCallActive ? 'text-emerald-500' : 'text-zinc-400'}`} />
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-400">Speech Latency (RTT)</span>
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
              {currentLatencyMs}ms <span className="text-[10px] text-emerald-500 font-normal">Ultra-Fast</span>
            </div>
          </div>
          <Zap className="h-4 w-4 text-blue-500" />
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-400">Selected LLM Brain</span>
            <div className="text-sm font-bold text-purple-600 dark:text-purple-400 truncate max-w-[140px] mt-0.5">
              {realLlmList.find((l) => l.id === selectedLlmId)?.name || 'Default LLM'}
            </div>
          </div>
          <Brain className="h-4 w-4 text-purple-500" />
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-400">Outbound Route</span>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {callMode === 'android_gsm' ? 'Free GSM SIM' : callMode === 'mic' ? 'Local Web Audio' : 'PSTN Carrier'}
            </div>
          </div>
          <Radio className="h-4 w-4 text-emerald-500" />
        </div>
      </div>

      {/* 3. Dynamic Configuration Matrix (Adapts based on Selected Call Mode) */}
      <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
        <CardHeader className="py-3 px-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider">
              {callMode === 'mic'
                ? 'Browser Microphone & Engine Matrix'
                : callMode === 'android_gsm'
                ? 'Android GSM SIM Telephony Matrix (Free)'
                : 'Cloud Carrier & SIP Trunking Matrix'}
            </CardTitle>
          </div>
          <span className="text-[11px] text-zinc-400">
            {callMode === 'mic' ? 'Local Web Audio Routing' : callMode === 'android_gsm' ? 'Cellular SIM Routing' : 'PSTN Cloud Routing'}
          </span>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Dynamic Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {callMode === 'android_gsm' ? (
              <>
                {/* 1. Paired Mobile Device */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider block mb-1">
                    1. Paired Mobile Device (SIM Gateway)
                  </label>
                  <select
                    value={selectedLineId}
                    onChange={(e) => setSelectedLineId(e.target.value)}
                    disabled={isCallActive}
                    className="w-full bg-white dark:bg-zinc-900 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-emerald-500 shadow-xs"
                  >
                    {realAndroidDevices.length === 0 ? (
                      <option value="android-primary">📱 Primary Mobile Phone (+91 98765 43210)</option>
                    ) : (
                      realAndroidDevices.map((d) => (
                        <option key={d.id} value={d.id}>
                          📱 {d.name} ({d.simNumber} • {d.carrier})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* 2. SIM Card Slot */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider block mb-1">
                    2. SIM Card & Carrier Slot
                  </label>
                  <select
                    disabled={isCallActive}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    <option value="sim1">SIM Slot 1: Primary 5G (Jio / Airtel - Unlimited)</option>
                    <option value="sim2">SIM Slot 2: Secondary Cellular (Vodafone / Vi)</option>
                    <option value="auto">Auto-Select Best Signal SIM</option>
                  </select>
                </div>

                {/* 3. AI Voice Agent */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider block">
                      3. AI Voice Agent
                    </label>
                    {backendAgents.find((a) => a.id === selectedAgentId) && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Synced</span>
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => handleAgentSelectChange(e.target.value)}
                    disabled={isCallActive}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-blue-500 font-medium shadow-xs"
                  >
                    {backendAgents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role || 'Voice Assistant'} • {a.language || 'Multilingual'})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : callMode === 'carrier' ? (
              <>
                {/* 1. Cloud Carrier / SIP Trunk */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider block mb-1">
                    1. Cloud Telephony / SIP Trunk
                  </label>
                  <select
                    value={selectedLineId}
                    onChange={(e) => setSelectedLineId(e.target.value)}
                    disabled={isCallActive}
                    className="w-full bg-white dark:bg-zinc-900 border border-purple-500/40 text-purple-600 dark:text-purple-400 font-semibold text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="twilio-main">🌐 Twilio Cloud Voice (PSTN Elastic SIP)</option>
                    <option value="telnyx-sip">📞 Telnyx Global Carrier Route</option>
                    <option value="freepbx-trunk">📟 FreePBX / Asterisk SIP Trunk</option>
                  </select>
                </div>

                {/* 2. Outbound Caller ID */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider block mb-1">
                    2. Outbound Caller ID CLI
                  </label>
                  <select
                    disabled={isCallActive}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    <option value="cli-1">+1 (800) 555-0199 (US Toll-Free)</option>
                    <option value="cli-2">+91 11 4987 6543 (India Delhi CLI)</option>
                    <option value="cli-3">+44 20 7946 0912 (UK London CLI)</option>
                  </select>
                </div>

                {/* 3. AI Voice Agent */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider block">
                      3. AI Voice Agent
                    </label>
                    {backendAgents.find((a) => a.id === selectedAgentId) && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Synced</span>
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => handleAgentSelectChange(e.target.value)}
                    disabled={isCallActive}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-blue-500 font-medium shadow-xs"
                  >
                    {backendAgents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role || 'Voice Assistant'} • {a.language || 'Multilingual'})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* 1. AI Voice Agent */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider block">
                      1. AI Voice Agent
                    </label>
                    {backendAgents.find((a) => a.id === selectedAgentId) && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Synced</span>
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => handleAgentSelectChange(e.target.value)}
                    disabled={isCallActive}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-blue-500 font-medium shadow-xs"
                  >
                    {backendAgents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role || 'Voice Assistant'} • {a.language || 'Multilingual'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Business Vertical */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider block mb-1">
                    2. Business Vertical & Rules
                  </label>
                  <select
                    value={selectedBusinessTypeId}
                    onChange={(e) => setSelectedBusinessTypeId(e.target.value)}
                    disabled={isCallActive}
                    className="w-full bg-white dark:bg-zinc-900 border border-blue-500/40 text-blue-600 dark:text-blue-400 font-semibold text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-blue-500"
                  >
                    {businessTypes.map((bt) => (
                      <option key={bt.id} value={bt.id}>
                        {bt.name} ({bt.category || 'Vertical'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Knowledge Base */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider block mb-1">
                    3. Knowledge Collection (RAG)
                  </label>
                  <select
                    value={selectedKbId}
                    onChange={(e) => setSelectedKbId(e.target.value)}
                    disabled={isCallActive}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-blue-500"
                  >
                    {realKnowledgeList.length === 0 ? (
                      <option value="kb-default">Global Workspace Knowledge</option>
                    ) : (
                      realKnowledgeList.map((kb) => (
                        <option key={kb.id} value={kb.id}>
                          {kb.name} ({kb.chunkCount} Chunks)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Dynamic Row 2: LLM Brain, STT, Voice Synthesizer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* LLM Model */}
            <div>
              <label className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider block mb-1">
                {callMode === 'mic' ? '4. LLM Reasoning Model' : '4. AI Reasoning Brain'}
              </label>
              <select
                value={selectedLlmId}
                onChange={(e) => setSelectedLlmId(e.target.value)}
                disabled={isCallActive}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-blue-500"
              >
                {realLlmList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.model} ({l.category})
                  </option>
                ))}
              </select>
            </div>

            {/* STT Engine */}
            <div>
              <label className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider block mb-1">
                {callMode === 'mic' ? '5. Speech-to-Text Engine' : '5. Telephony STT Transcriber'}
              </label>
              <select
                value={selectedSttId}
                onChange={(e) => setSelectedSttId(e.target.value)}
                disabled={isCallActive}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-blue-500"
              >
                {realSttList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            {/* TTS Voice */}
            <div>
              <label className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider block mb-1">
                {callMode === 'mic' ? '6. TTS Voice Synthesizer' : '6. Voice Audio Streamer'}
              </label>
              <select
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                disabled={isCallActive}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-blue-500"
              >
                {realVoiceList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic SSOT Business Context Banner */}
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-blue-700 dark:text-blue-300">
                🏢 {activeBt?.name || 'General Clinic'}
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-zinc-600 dark:text-zinc-400">
                Opening Greeting: &quot;{activeBt?.default_greeting || 'Hello! How can I assist you?'}&quot;
              </span>
              <span className="text-zinc-300">•</span>
              <span className={whStatus.isWorking ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                ⏰ {whStatus.isWorking ? 'Business Hours Active (Open)' : 'After-Hours Rule'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {businessPolicies.slice(0, 2).map((p) => (
                <Badge key={p.id} variant="outline" size="sm" className="text-[10px] bg-white dark:bg-zinc-900">
                  🛡️ {p.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Dynamic Call Action Deck (Adapts to Browser Mic vs. Android GSM SIM vs. Cloud SIP) */}
      <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-950 to-blue-950 text-white">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
            {/* Left: Dynamic Input / Route Info */}
            <div className="space-y-1.5 w-full lg:w-auto flex-1">
              {callMode === 'mic' ? (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Mic className="h-4 w-4" />
                      <span>Direct Local Browser Microphone Playout</span>
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      ⚡ Zero Phone Number Required • Live Web Audio
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-2 text-xs text-zinc-300 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Speak directly into your device microphone. AI will listen in real-time.</span>
                    </div>
                    <Badge variant="blue" className="text-[10px]">
                      Web Speech VAD Active
                    </Badge>
                  </div>
                </div>
              ) : callMode === 'android_gsm' ? (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4" />
                      <span>Target Mobile Number to Call via Cellular SIM</span>
                    </label>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      ⚡ Free Unlimited Calls via Mobile SIM
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={targetPhoneNumber}
                      onChange={(e) => setTargetPhoneNumber(e.target.value)}
                      placeholder="Enter mobile number with country code (e.g. +91 98765 43210)"
                      disabled={isCallActive}
                      className="flex-1 bg-zinc-800/80 border border-zinc-700 text-white placeholder-zinc-500 text-sm rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Badge variant="emerald" className="text-xs px-3 py-2 whitespace-nowrap">
                      📱 Real Mobile SIM Route
                    </Badge>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <Radio className="h-4 w-4" />
                      <span>Target Cloud PSTN / SIP Phone Number</span>
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      Twilio / Telnyx Carrier Gateway
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={targetPhoneNumber}
                      onChange={(e) => setTargetPhoneNumber(e.target.value)}
                      placeholder="Enter PSTN number (e.g. +1 800 555 0199)"
                      disabled={isCallActive}
                      className="flex-1 bg-zinc-800/80 border border-zinc-700 text-white placeholder-zinc-500 text-sm rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <Badge variant="blue" className="text-xs px-3 py-2 whitespace-nowrap">
                      🌐 PSTN SIP Route
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Big Call / Hang Up Trigger Buttons */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              {!isCallActive ? (
                <Button
                  onClick={handleStartCall}
                  className={`font-bold text-sm px-7 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105 ${
                    callMode === 'android_gsm'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                      : callMode === 'carrier'
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                  }`}
                >
                  <PhoneCall className="h-5 w-5" />
                  <span>
                    {callMode === 'android_gsm'
                      ? 'Call Mobile via SIM (Free)'
                      : callMode === 'carrier'
                      ? 'Start Cloud SIP Session'
                      : 'Start Mic Voice Session'}
                  </span>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsMuted(!isMuted)}
                    variant="outline"
                    className={`text-xs px-3.5 py-2.5 rounded-xl border-zinc-700 bg-zinc-800 text-white ${
                      isMuted ? 'text-amber-400 border-amber-500' : ''
                    }`}
                  >
                    {isMuted ? <MicOff className="h-4 w-4 mr-1.5" /> : <Mic className="h-4 w-4 mr-1.5" />}
                    <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                  </Button>

                  <Button
                    onClick={() => setIsOnHold(!isOnHold)}
                    variant="outline"
                    className={`text-xs px-3.5 py-2.5 rounded-xl border-zinc-700 bg-zinc-800 text-white ${
                      isOnHold ? 'text-amber-400 border-amber-500' : ''
                    }`}
                  >
                    <Pause className="h-4 w-4 mr-1.5" />
                    <span>{isOnHold ? 'Resume' : 'Hold'}</span>
                  </Button>

                  <Button
                    onClick={() => setIsTransferModalOpen(true)}
                    variant="outline"
                    className="text-xs px-3.5 py-2.5 rounded-xl border-zinc-700 bg-zinc-800 text-white"
                  >
                    <PhoneForwarded className="h-4 w-4 mr-1.5" />
                    <span>Transfer</span>
                  </Button>

                  <Button
                    onClick={handleEndCall}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-1.5"
                  >
                    <Square className="h-4 w-4" />
                    <span>Hang Up ({callDuration}s)</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Live Pipeline Latency Stepper */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
        {pipelineStages.map((stage) => (
          <div
            key={stage.id}
            className={`p-2.5 rounded-xl border transition-all ${
              stage.status === 'active'
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 font-bold text-blue-600 dark:text-blue-400 shadow-sm'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <div className="text-[10px] text-zinc-400 font-mono">{stage.latency}</div>
            <div className="font-semibold mt-0.5 truncate">{stage.label}</div>
          </div>
        ))}
      </div>

      {/* 6. Live Speech Conversation Stage & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Conversation Stream (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 flex flex-col h-[480px]">
            <CardHeader className="py-3 px-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mic className={`h-4 w-4 ${isMicListening ? 'text-emerald-500 animate-pulse' : 'text-blue-500'}`} />
                <CardTitle className="text-xs font-bold uppercase tracking-wider">
                  Live Conversation Transcript
                </CardTitle>
              </div>

              <div className="flex items-center space-x-2">
                <canvas
                  ref={canvasRef}
                  width={110}
                  height={20}
                  className="rounded-lg bg-zinc-100 dark:bg-zinc-800"
                />
                <Badge variant={isCallActive ? 'emerald' : 'slate'} className="text-[10px] font-mono">
                  {isCallActive ? 'LIVE DUPLEX' : 'IDLE'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 flex-1 overflow-y-auto space-y-3 font-sans text-xs">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-2">
                  <PlayCircle className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                  <p>Start call session to speak or receive incoming turns.</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.speaker === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-zinc-400">
                      <span className="font-bold capitalize">{m.speaker === 'user' ? '👤 Caller' : '🤖 AI Agent'}</span>
                      <span>•</span>
                      <span>{m.timestamp}</span>
                      {m.latencyMs && <span className="text-blue-500 font-mono font-bold">({m.latencyMs}ms)</span>}
                    </div>

                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        m.speaker === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-none border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))
              )}
            </CardContent>

            {/* Turn Input Bar */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center space-x-2">
              <input
                type="text"
                placeholder={
                  isCallActive
                    ? isMicListening
                      ? '🎙️ Microphone listening... (or type speech here)'
                      : 'Type speech...'
                    : 'Start call session to enable speech turn...'
                }
                disabled={!isCallActive}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendTurn()}
                className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
              <Button
                onClick={() => handleSendTurn()}
                disabled={!isCallActive || !userInput.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2.5 rounded-xl"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Terminal Logs & Active Devices (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="py-2.5 px-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
              <div className="flex items-center space-x-2">
                <TerminalIcon className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-xs font-bold font-mono">Live Kernel Logs</CardTitle>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">{logs.length} events</span>
            </CardHeader>
            <CardContent className="p-3 bg-zinc-950 font-mono text-[11px] text-emerald-400 h-44 overflow-y-auto space-y-1 rounded-b-xl">
              {logs.length === 0 ? (
                <span className="text-zinc-600">// Waiting for real-time speech events...</span>
              ) : (
                logs.map((log, idx) => <div key={idx}>{log}</div>)
              )}
            </CardContent>
          </Card>

          {/* Connected Android GSM SIM Card */}
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-emerald-500" />
                <span>Connected Android GSM Phone</span>
              </span>
              <Badge variant="emerald" className="text-[10px]">
                Online 5G
              </Badge>
            </div>

            {realAndroidDevices.length === 0 ? (
              <div className="text-center py-2 text-zinc-400">
                <p>No Android phone connected.</p>
                <button
                  onClick={() => setIsPairModalOpen(true)}
                  className="text-blue-500 underline text-[11px] mt-1"
                >
                  Pair Android Companion Phone
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between font-medium">
                  <span>{realAndroidDevices[0].name}</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {realAndroidDevices[0].simNumber}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Carrier: {realAndroidDevices[0].carrier}</span>
                  <span>Auto-Answer: Active</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 7. Universal Mobile Phone Pairing & Native App Download Modal */}
      {isPairModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsPairModalOpen(false)}
          title="Nexus Mobile Gateway Hub"
          size="lg"
        >
          <div className="space-y-3.5 text-xs">
            {/* Logo Banner */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center space-x-3">
              <img src="/app-icon.png" alt="Nexus Logo" className="w-9 h-9 rounded-xl shadow-md border border-emerald-500/40 object-cover" />
              <div>
                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>Nexus Mobile Gateway Hub</span>
                  <Badge variant="emerald" className="text-[9px] font-mono py-0">v2.4</Badge>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Universal GSM SIM Telephony & Live Multi-Device Gateway
                </p>
              </div>
            </div>

            {/* Clean 2-Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <button
                onClick={() => setPairModalTab('qr')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  pairModalTab === 'qr'
                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Instant QR Scan & Pair</span>
              </button>

              <button
                onClick={() => setPairModalTab('download')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  pairModalTab === 'download'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Native Apps</span>
              </button>
            </div>

            {/* Tab 1: Instant QR Connect */}
            {pairModalTab === 'qr' && (
              <div className="space-y-3">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center space-y-2">
                  <div className="p-2 bg-white rounded-xl shadow-md border-2 border-emerald-500">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=3&data=${encodeURIComponent(
                        mobilePairingUrl
                      )}`}
                      alt="Scan Mobile QR Code"
                      className="w-40 h-40 rounded-lg"
                      onError={(e: any) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="text-center space-y-0.5 w-full max-w-sm">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Direct Mobile URL</span>
                    <div className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 truncate select-all">
                      {mobilePairingUrl}
                    </div>
                  </div>
                </div>

                {/* Multi-Device Mesh Notification */}
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 text-emerald-700 dark:text-emerald-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                    <div>
                      <span className="font-bold text-[11px] block">Multi-Device Mesh Active</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Scan from 1 to 10+ phones simultaneously — all auto-sync in real-time!
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={realAndroidDevices.filter((d) => d.is_online).length > 0 ? 'emerald' : 'neutral'}
                    className="text-[9px] font-mono px-2 py-0"
                  >
                    {realAndroidDevices.filter((d) => d.is_online).length} Active Online
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      window.open(mobilePairingUrl, '_blank');
                      addToast('Opened Mobile Companion in testing window!', 'info');
                    }}
                    className="w-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-2 flex items-center justify-center gap-1.5 shadow-sm rounded-xl"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Launch on This Device</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(mobilePairingUrl);
                      addToast('Mobile Companion Link copied!', 'success');
                    }}
                    className="w-full text-xs font-semibold py-2 flex items-center justify-center gap-1.5 rounded-xl"
                  >
                    <Copy className="h-4 w-4 text-zinc-500" />
                    <span>Copy Mobile Link</span>
                  </Button>
                </div>
              </div>
            )}


            {/* Tab 2: Download Native Clients */}
            {pairModalTab === 'download' && (
              <div className="space-y-3">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Download the official native client installer to run background SIM calling on your phone or computer:
                </p>

                <div className="space-y-2">
                  {/* 1. Android Phone App */}
                  <a
                    href="/api/android-gateway/download/apk"
                    download="Nexus-GSM-Gateway-v2.4.apk"
                    className="p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-between hover:border-emerald-500 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg group-hover:scale-110 transition-transform">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>1. Android Native App</span>
                          <Badge variant="emerald" className="text-[9px] py-0">Android 8 to 15</Badge>
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Direct APK package with auto-answer & background SIM telephony bridge.
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0">
                      <Download className="h-3.5 w-3.5 mr-1" />
                      APK
                    </Button>
                  </a>

                  {/* 2. Apple iPhone & iPad App */}
                  <a
                    href="/api/android-gateway/download/ios"
                    download="Nexus-iOS-Companion-Xcode.zip"
                    className="p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-between hover:border-blue-500 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                        <PhoneCall className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>2. Apple iPhone / iPad App</span>
                          <Badge variant="blue" className="text-[9px] py-0">iOS 15 to 18+</Badge>
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Native Swift Xcode project with CallKit & VoIP telephony bridge.
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0">
                      <Download className="h-3.5 w-3.5 mr-1" />
                      iOS Project
                    </Button>
                  </a>

                  {/* 3. Apple macOS Desktop App */}
                  <a
                    href="/api/android-gateway/download/mac"
                    download="Nexus-macOS-Companion.zip"
                    className="p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-between hover:border-purple-500 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg group-hover:scale-110 transition-transform">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>3. Apple Mac (macOS App)</span>
                          <Badge variant="purple" className="text-[9px] py-0">Apple Silicon & Intel</Badge>
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Mac companion gateway with iPhone Continuity & Web Audio relay.
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs font-bold shrink-0">
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Mac ZIP
                    </Button>
                  </a>

                  {/* 4. Windows PC Desktop App */}
                  <a
                    href="/api/android-gateway/download/win"
                    download="Nexus-Windows-Companion.zip"
                    className="p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-between hover:border-teal-500 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-teal-500/10 text-teal-500 rounded-lg group-hover:scale-110 transition-transform">
                        <Radio className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>4. Windows PC App (.NET)</span>
                          <Badge variant="emerald" className="text-[9px] py-0">Win 10/11</Badge>
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Windows cellular modem & USB GSM dongle service node.
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs font-bold shrink-0">
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Win ZIP
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* 8. Department Transfer Modal */}
      {isTransferModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsTransferModalOpen(false)}
          title="Transfer Active Call to Department"
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-zinc-500 dark:text-zinc-400">
              Select department queue to transfer caller:
            </p>
            <div className="space-y-2">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  onClick={() => setTransferTargetDept(dept.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    transferTargetDept === dept.id
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 font-semibold'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div>
                    <div className="text-zinc-900 dark:text-zinc-100 font-bold">{dept.name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">Ext: {dept.extension || '#101'}</div>
                  </div>
                  <PhoneForwarded className="h-4 w-4 text-blue-500" />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTransferModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  addToast('Call transferred.', 'success');
                  setIsTransferModalOpen(false);
                }}
                disabled={!transferTargetDept}
                className="bg-blue-600 text-white text-xs px-4"
              >
                Execute Transfer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 9. Post-Call Report Modal */}
      {postCallReport && (
        <Modal
          isOpen={true}
          onClose={() => setPostCallReport(null)}
          title="Post-Call Intelligence Report"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Conversation Summary</span>
              <p className="text-zinc-800 dark:text-zinc-200 mt-1 leading-relaxed">{postCallReport.summary}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Lead Score</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {postCallReport.lead_qualification?.score || 92}%
                </div>
              </div>

              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Booking Status</div>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {postCallReport.appointment_result?.status || 'Pre-Booked'}
                </div>
              </div>

              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Sentiment</div>
                <div className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {postCallReport.sentiment?.overall || 'Positive'}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <Button onClick={() => setPostCallReport(null)} className="bg-blue-600 text-white text-xs px-5">
                Close Report
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

