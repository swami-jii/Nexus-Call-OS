import React, { useState } from 'react';
import {
  Brain,
  Layers,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  Radio,
  Bot,
  HardDrive,
  Smartphone,
  Server,
  Zap,
  ShieldCheck,
  Code2,
  Palette,
  Eye,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  DollarSign,
  ChevronRight,
  ChevronDown,
  ListPlus,
  ArrowLeft,
  Crown,
  Star,
  Flame,
  Cpu,
  Activity,
  Globe,
  Award,
  Target,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Box,
  FileCode,
  CheckSquare,
  Square,
  Paintbrush,
  Gift,
  Tag,
  Download,
  Coins,
  CreditCard,
  Briefcase,
  HelpCircle,
  TrendingUp,
  Percent,
  Info,
  ExternalLink,
  Users,
  Building2,
  Clock,
  Ban,
  Rocket,
  Wrench,
  Infinity,
  Mic,
  Volume2,
  Wifi,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CustomSelect, CustomSelectOption } from '../ui/CustomSelect';
import { SubscriptionPlan } from '../../types';

export interface PlanMasterStudioProps {
  plans: SubscriptionPlan[];
  onSavePlan: (plan: Partial<SubscriptionPlan>) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
  onRefresh: () => void;
  isLoading?: boolean;
}

// Available Lucide Icons Dictionary
const AVAILABLE_ICONS: { [key: string]: React.ComponentType<{ className?: string }> } = {
  PhoneCall,
  Radio,
  Bot,
  HardDrive,
  Smartphone,
  Server,
  Zap,
  Sparkles,
  ShieldCheck,
  Crown,
  Star,
  Flame,
  Cpu,
  Activity,
  Globe,
  Award,
  Target,
  CheckCircle2,
  Layers,
  Box,
  Gift,
  Coins,
  Briefcase,
  TrendingUp,
  SlidersHorizontal,
};

// Global Currency Presets
const CURRENCY_PRESETS = [
  { label: 'USD ($) - US Dollar', symbol: '$', code: 'USD' },
  { label: 'EUR (€) - Euro', symbol: '€', code: 'EUR' },
  { label: 'GBP (£) - British Pound', symbol: '£', code: 'GBP' },
  { label: 'INR (₹) - Indian Rupee', symbol: '₹', code: 'INR' },
  { label: 'AUD (A$) - Australian Dollar', symbol: 'A$', code: 'AUD' },
  { label: 'CAD (C$) - Canadian Dollar', symbol: 'C$', code: 'CAD' },
  { label: 'SGD (S$) - Singapore Dollar', symbol: 'S$', code: 'SGD' },
  { label: 'JPY (¥) - Japanese Yen', symbol: '¥', code: 'JPY' },
  { label: 'AED (د.إ) - UAE Dirham', symbol: 'AED ', code: 'AED' },
];

// Header Icon Glow & Background Presets
const ICON_COLOR_PRESETS = [
  { label: 'Teal Cyan', value: 'teal', bgClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 ring-teal-500/20' },
  { label: 'Royal Amber', value: 'amber', bgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 ring-amber-500/20' },
  { label: 'Cyber Violet', value: 'purple', bgClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 ring-purple-500/20' },
  { label: 'Emerald Mint', value: 'emerald', bgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 ring-emerald-500/20' },
  { label: 'Electric Blue', value: 'blue', bgClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 ring-blue-500/20' },
  { label: 'Crimson Rose', value: 'rose', bgClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 ring-rose-500/20' },
];

// Target Audience Category Options with Pristine SVG Icons
const TARGET_AUDIENCE_OPTIONS = [
  { label: 'For Small Teams & Startups', value: 'For Small Teams & Startups', icon: <Users className="h-3.5 w-3.5 text-teal-500" /> },
  { label: 'For Growing Businesses', value: 'For Growing Businesses', icon: <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> },
  { label: 'For Mid-Market Call Centers', value: 'For Mid-Market Call Centers', icon: <Building2 className="h-3.5 w-3.5 text-indigo-500" /> },
  { label: 'For Large Sovereign Enterprises', value: 'For Large Enterprises', icon: <Crown className="h-3.5 w-3.5 text-amber-500" /> },
  { label: 'Elastic Usage (Pay As You Go)', value: 'Elastic Usage', icon: <Activity className="h-3.5 w-3.5 text-emerald-500" /> },
  { label: 'For Power Dialers & MSPs', value: 'For Power Dialers & MSPs', icon: <Rocket className="h-3.5 w-3.5 text-purple-500" /> },
  { label: 'For Custom Solutions & Telecom', value: 'For Custom Solutions', icon: <Wrench className="h-3.5 w-3.5 text-rose-500" /> },
];

// Header Lucide Vector Icons Dictionary
const HEADER_ICON_OPTIONS = [
  { label: 'Lightning Zap (Speed)', value: 'Zap', icon: <Zap className="h-3.5 w-3.5 text-amber-500" /> },
  { label: 'Royal Crown (VIP Tier)', value: 'Crown', icon: <Crown className="h-3.5 w-3.5 text-yellow-500" /> },
  { label: 'High-Throughput Flame', value: 'Flame', icon: <Flame className="h-3.5 w-3.5 text-rose-500" /> },
  { label: 'AI Voice Bot Master', value: 'Bot', icon: <Bot className="h-3.5 w-3.5 text-teal-500" /> },
  { label: 'Phone Call Node', value: 'PhoneCall', icon: <PhoneCall className="h-3.5 w-3.5 text-emerald-500" /> },
  { label: 'Sovereign Shield (Enterprise)', value: 'ShieldCheck', icon: <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" /> },
  { label: 'Global Telephony Cloud', value: 'Globe', icon: <Globe className="h-3.5 w-3.5 text-sky-500" /> },
  { label: 'Featured Star Rating', value: 'Star', icon: <Star className="h-3.5 w-3.5 text-amber-400" /> },
  { label: 'Neural AI Sparkles', value: 'Sparkles', icon: <Sparkles className="h-3.5 w-3.5 text-purple-400" /> },
  { label: 'Prestige Award Tier', value: 'Award', icon: <Award className="h-3.5 w-3.5 text-orange-500" /> },
  { label: 'Custom Sliders Node', value: 'SlidersHorizontal', icon: <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" /> },
];

// Free Trial Presets with Realistic Vector Icons
const TRIAL_PRESET_OPTIONS = [
  { label: 'No Free Trial (Immediate Charge)', value: '0', icon: <Ban className="h-3.5 w-3.5 text-zinc-400" /> },
  { label: '3-Day Rapid Evaluation Trial', value: '3', icon: <Clock className="h-3.5 w-3.5 text-amber-500" /> },
  { label: '7-Day Free Trial', value: '7', icon: <Gift className="h-3.5 w-3.5 text-teal-500" /> },
  { label: '14-Day Free Trial (Recommended)', value: '14', icon: <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> },
  { label: '30-Day Enterprise Trial', value: '30', icon: <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" /> },
  { label: '60-Day Extended Pilot', value: '60', icon: <Crown className="h-3.5 w-3.5 text-purple-500" /> },
  { label: 'Custom Trial Duration...', value: 'custom', icon: <SlidersHorizontal className="h-3.5 w-3.5 text-blue-500" /> },
];

// Telephony Quotas CustomSelect Preset Options
const VOICE_MINUTES_PRESET_OPTIONS: CustomSelectOption[] = [
  { value: '500', label: '500 Mins / mo (Starter Pilot)', badge: '500m' },
  { value: '1000', label: '1,000 Mins / mo (Team Growth)', badge: '1k' },
  { value: '3000', label: '3,000 Mins / mo (Growth Pro)', badge: '3k' },
  { value: '5000', label: '5,000 Mins / mo (Scale Tier)', badge: '5k' },
  { value: '10000', label: '10,000 Mins / mo (Business Scale)', badge: '10k' },
  { value: '25000', label: '25,000 Mins / mo (High Volume)', badge: '25k' },
  { value: '50000', label: '50,000 Mins / mo (Enterprise VIP)', badge: '50k' },
  { value: '100000', label: '100,000 Mins / mo (Ultra MSP)', badge: '100k' },
  { value: 'unlimited', label: 'Unlimited Voice Minutes (Uncapped)', badge: '∞' },
  { value: 'custom', label: 'Custom Allocation (Specify below)...', badge: 'Custom' },
];

const CONCURRENCY_PRESET_OPTIONS: CustomSelectOption[] = [
  { value: '1', label: '1 Trunk (Single Line Inbound/Outbound)', badge: '1 Line' },
  { value: '2', label: '2 Trunks (Small Pilot)', badge: '2 Lines' },
  { value: '5', label: '5 Trunks (Small Team)', badge: '5 Lines' },
  { value: '10', label: '10 Trunks (Growth Pro)', badge: '10 Lines' },
  { value: '15', label: '15 Trunks (Medium Operations)', badge: '15 Lines' },
  { value: '30', label: '30 Trunks (Business Scale)', badge: '30 Lines' },
  { value: '50', label: '50 Trunks (Call Center Fleet)', badge: '50 Lines' },
  { value: '100', label: '100 Trunks (Enterprise VIP)', badge: '100 Lines' },
  { value: '250', label: '250 Trunks (Ultra High-Throughput)', badge: '250 Lines' },
  { value: 'unlimited', label: 'Uncapped Concurrency (Elastic Cloud SIP)', badge: '∞' },
  { value: 'custom', label: 'Custom Capacity (Specify below)...', badge: 'Custom' },
];

const RAG_STORAGE_PRESET_OPTIONS: CustomSelectOption[] = [
  { value: '100', label: '100 MB (~5,000 PDF/Doc Pages)', badge: '100 MB' },
  { value: '250', label: '250 MB (~12,500 Pages)', badge: '250 MB' },
  { value: '500', label: '500 MB (~25,000 Pages)', badge: '500 MB' },
  { value: '1000', label: '1,000 MB / 1 GB (~50,000 Pages)', badge: '1 GB' },
  { value: '2000', label: '2,000 MB / 2 GB (~100,000 Pages)', badge: '2 GB' },
  { value: '5000', label: '5,000 MB / 5 GB (~250,000 Pages)', badge: '5 GB' },
  { value: '10000', label: '10,000 MB / 10 GB (~500,000 Pages)', badge: '10 GB' },
  { value: '50000', label: '50,000 MB / 50 GB (~2.5M Pages)', badge: '50 GB' },
  { value: 'unlimited', label: 'Unlimited Vector Memory (Infinite Embeddings)', badge: '∞' },
  { value: 'custom', label: 'Custom Vector Storage (Specify below)...', badge: 'Custom' },
];

const AGENTS_COUNT_PRESET_OPTIONS: CustomSelectOption[] = [
  { value: '1', label: '1 AI Voice Agent (Single Agent)', badge: '1 Bot' },
  { value: '2', label: '2 AI Voice Agents (Inbound + Outbound)', badge: '2 Bots' },
  { value: '5', label: '5 AI Voice Agents (Department Team)', badge: '5 Bots' },
  { value: '10', label: '10 AI Voice Agents (Growth Pro)', badge: '10 Bots' },
  { value: '25', label: '25 AI Voice Agents (Business Scale)', badge: '25 Bots' },
  { value: '50', label: '50 AI Voice Agents (High Scale Fleet)', badge: '50 Bots' },
  { value: '100', label: '100 AI Voice Agents (Enterprise Swarm)', badge: '100 Bots' },
  { value: 'unlimited', label: 'Unlimited AI Voice Bots (Unrestricted)', badge: '∞' },
  { value: 'custom', label: 'Custom Agent Count (Specify below)...', badge: 'Custom' },
];

const PHONE_NUMBERS_PRESET_OPTIONS: CustomSelectOption[] = [
  { value: '0', label: '0 Included (BYON - Bring Your Own Numbers Only)', badge: 'BYON' },
  { value: '1', label: '1 Local Dedicated Inbound DID Included', badge: '1 DID' },
  { value: '2', label: '2 Local / Regional Phone Lines', badge: '2 DIDs' },
  { value: '5', label: '5 Dedicated DID Line Numbers', badge: '5 DIDs' },
  { value: '10', label: '10 Multi-Region DID Phone Lines', badge: '10 DIDs' },
  { value: 'unlimited', label: 'Unlimited DID Line Provisioning', badge: '∞' },
  { value: 'custom', label: 'Custom Phone Numbers (Specify below)...', badge: 'Custom' },
];

const CARRIER_GSM_OPTIONS: CustomSelectOption[] = [
  { value: 'Included', label: 'Included (Single SIM Gateway)', badge: 'Standard' },
  { value: 'Included (Multi-SIM)', label: 'Included (Multi-SIM Android Cluster)', badge: 'Multi-SIM' },
  { value: 'Dedicated Gateway Cluster', label: 'Dedicated Hardware Gateway Cluster', badge: 'Enterprise' },
  { value: 'Pay-Per-Minute', label: 'Pay-Per-Minute ($0.01/min Telecom)', badge: 'Usage' },
  { value: 'Not Included', label: 'Not Included (Cloud SIP Trunks Only)', badge: 'Off' },
  { value: 'custom', label: 'Custom Specification...', badge: 'Custom' },
];

const CARRIER_VOICE_CLONING_OPTIONS: CustomSelectOption[] = [
  { value: 'Studio Grade', label: 'Studio Grade (ElevenLabs & Cartesia)', badge: 'Studio' },
  { value: 'Ultra HD Neural', label: 'Ultra HD Neural (Zero-Shot Instant Clone)', badge: 'Ultra HD' },
  { value: 'Sub-200ms Neural', label: 'Sub-200ms Neural Real-Time Streaming', badge: '<200ms' },
  { value: 'Basic TTS', label: 'Standard System Voices (Basic TTS)', badge: 'Basic' },
  { value: 'Custom Neural Voices', label: 'Custom Fine-Tuned Voice Models', badge: 'Bespoke' },
  { value: 'custom', label: 'Custom Specification...', badge: 'Custom' },
];

const CARRIER_WEBHOOK_OPTIONS: CustomSelectOption[] = [
  { value: 'Enterprise High-Speed', label: 'Enterprise High-Speed (100 req/s Push)', badge: '100 req/s' },
  { value: 'Enterprise', label: 'Enterprise REST & Event Webhooks', badge: 'Standard' },
  { value: '1,000 req/s Streaming', label: 'High-Throughput (1,000 req/s Stream)', badge: '1k req/s' },
  { value: 'Standard Webhooks', label: 'Standard Webhooks (10 req/s Rate Limit)', badge: 'Basic' },
  { value: 'Not Included', label: 'Not Included (Web Dashboard Only)', badge: 'Off' },
  { value: 'custom', label: 'Custom Specification...', badge: 'Custom' },
];

const CARRIER_SLA_OPTIONS: CustomSelectOption[] = [
  { value: '99.99% Guaranteed', label: '99.99% Guaranteed (15-Min Response SLA)', badge: '99.99%' },
  { value: '99.99% Priority', label: '99.99% Priority Telecom SLA', badge: 'Priority' },
  { value: '99.99% Sovereign VIP', label: '99.99% Sovereign VIP (Dedicated Hotline)', badge: 'VIP' },
  { value: '99.999% Fault-Tolerant', label: '99.999% Fault-Tolerant Carrier Mesh', badge: 'Carrier' },
  { value: '99.5% Standard', label: '99.5% Standard Business Hours Support', badge: '99.5%' },
  { value: 'custom', label: 'Custom Negotiated SLA...', badge: 'Custom' },
];

// Runtime Terminal & Execution Log Entitlements
const LOG_BUFFER_OPTIONS: CustomSelectOption[] = [
  { value: '50', label: '50 Lines Buffer (Free / Starter Pilot)', badge: '50 Lines' },
  { value: '200', label: '200 Lines Buffer (Light Debugger)', badge: '200 Lines' },
  { value: '500', label: '500 Lines Buffer (Growth Pro)', badge: '500 Lines' },
  { value: '1500', label: '1,500 Lines Buffer (Business Scale)', badge: '1.5k Lines' },
  { value: '5000', label: '5,000 Lines Buffer (High Volume Traces)', badge: '5k Lines' },
  { value: '99999', label: 'Unlimited Buffer (Unrestricted Sovereign Traces)', badge: '∞' },
  { value: 'custom', label: 'Custom Line Limit...', badge: 'Custom' },
];

const LOG_RETENTION_OPTIONS: CustomSelectOption[] = [
  { value: '0', label: 'Live Session Only (Zero Long-Term Storage)', badge: 'Session' },
  { value: '7', label: '7 Days Log Retention', badge: '7 Days' },
  { value: '15', label: '15 Days Log Retention (Pro)', badge: '15 Days' },
  { value: '30', label: '30 Days Log Retention (Business)', badge: '30 Days' },
  { value: '90', label: '90 Days Log Retention (Enterprise)', badge: '90 Days' },
  { value: '365', label: '365 Days / 1 Year Sovereign Vault', badge: '1 Year' },
  { value: 'custom', label: 'Custom Retention Duration...', badge: 'Custom' },
];

// All Available Speech-to-Text Engines for Multi-Select Provisioning
const STT_ENGINE_CUSTOM_OPTIONS: CustomSelectOption[] = [
  { value: 'deepgram_nova2', label: 'Deepgram Nova-2 (Ultra-fast <150ms Streaming)', icon: <Mic className="h-3.5 w-3.5 text-teal-500" />, badge: '<150ms' },
  { value: 'whisper_large_v3', label: 'OpenAI Whisper Large v3 (Precision Accuracy)', icon: <Mic className="h-3.5 w-3.5 text-emerald-500" />, badge: 'Accuracy' },
  { value: 'assemblyai_conformer2', label: 'AssemblyAI Conformer-2 (Call Center Tuned)', icon: <Mic className="h-3.5 w-3.5 text-blue-500" />, badge: 'Tuned' },
  { value: 'google_stt', label: 'Google Cloud Speech-to-Text (120+ Languages)', icon: <Mic className="h-3.5 w-3.5 text-amber-500" />, badge: '120+ Lang' },
  { value: 'azure_realtime', label: 'Azure Real-Time Speech (Cognitive Speech)', icon: <Mic className="h-3.5 w-3.5 text-indigo-500" />, badge: 'Azure' },
  { value: 'faster_whisper', label: 'Faster-Whisper (Sovereign Local On-Prem)', icon: <Mic className="h-3.5 w-3.5 text-purple-500" />, badge: 'Sovereign' },
  { value: 'whisper_cpp', label: 'Whisper.cpp (Lightweight C++ Local Engine)', icon: <Mic className="h-3.5 w-3.5 text-zinc-400" />, badge: 'C++' },
  { value: 'vosk_local', label: 'Vosk Offline Speech (Zero-GPU Local Engine)', icon: <Mic className="h-3.5 w-3.5 text-amber-400" />, badge: 'Vosk' },
  { value: 'nvidia_riva', label: 'NVIDIA Riva ASR (CUDA High-Speed Speech)', icon: <Mic className="h-3.5 w-3.5 text-emerald-400" />, badge: 'Riva' },
  { value: 'gladia_realtime', label: 'Gladia AI Real-Time Audio Engine', icon: <Mic className="h-3.5 w-3.5 text-rose-500" />, badge: 'Gladia' },
  { value: 'rev_ai', label: 'Rev AI Real-Time Enterprise Analytics', icon: <Mic className="h-3.5 w-3.5 text-cyan-500" />, badge: 'Enterprise' },
];

// All Available Text-to-Speech Synthesizers for Multi-Select Provisioning
const TTS_ENGINE_CUSTOM_OPTIONS: CustomSelectOption[] = [
  { value: 'elevenlabs_turbo25', label: 'ElevenLabs Turbo v2.5 (Studio Ultra HD)', icon: <Volume2 className="h-3.5 w-3.5 text-purple-500" />, badge: 'Studio' },
  { value: 'cartesia_sonic', label: 'Cartesia Sonic (Ultra-low 90ms Latency)', icon: <Volume2 className="h-3.5 w-3.5 text-rose-500" />, badge: '90ms' },
  { value: 'openai_tts1', label: 'OpenAI TTS-1 HD (Natural Human Tone)', icon: <Volume2 className="h-3.5 w-3.5 text-emerald-500" />, badge: 'OpenAI' },
  { value: 'playht_2', label: 'PlayHT 2.0 Real-Time Conversational', icon: <Volume2 className="h-3.5 w-3.5 text-amber-500" />, badge: 'Realtime' },
  { value: 'deepgram_aura', label: 'Deepgram Aura Real-Time Voice', icon: <Volume2 className="h-3.5 w-3.5 text-teal-500" />, badge: 'Aura' },
  { value: 'azure_tts', label: 'Azure Neural TTS (Multi-Lingual)', icon: <Volume2 className="h-3.5 w-3.5 text-indigo-500" />, badge: 'Azure' },
  { value: 'amazon_polly', label: 'Amazon Polly Neural (AWS Telecom)', icon: <Volume2 className="h-3.5 w-3.5 text-orange-500" />, badge: 'AWS' },
  { value: 'piper_local', label: 'Piper TTS (Local Sovereign Embedded)', icon: <Volume2 className="h-3.5 w-3.5 text-zinc-400" />, badge: 'Local' },
  { value: 'coqui_local', label: 'Coqui XTTS-v2 (Local Multi-Lingual GPU Voice)', icon: <Volume2 className="h-3.5 w-3.5 text-indigo-400" />, badge: 'Coqui' },
];

// All Available LLM Intelligence Reasoning Models for Multi-Select Provisioning
const LLM_MODEL_CUSTOM_OPTIONS: CustomSelectOption[] = [
  { value: 'openai_gpt4o', label: 'OpenAI GPT-4o (Flagship Multimodal Intelligence)', icon: <Brain className="h-3.5 w-3.5 text-emerald-500" />, badge: 'GPT-4o' },
  { value: 'openai_gpt4o_mini', label: 'OpenAI GPT-4o-mini (Ultra-Fast Low-Latency)', icon: <Brain className="h-3.5 w-3.5 text-teal-500" />, badge: 'Fast' },
  { value: 'anthropic_claude35', label: 'Claude 3.5 Sonnet (Complex Reasoning & Tasks)', icon: <Brain className="h-3.5 w-3.5 text-purple-500" />, badge: 'Claude' },
  { value: 'anthropic_claude35_haiku', label: 'Claude 3.5 Haiku (Sub-Second Fast Turn-Taking)', icon: <Brain className="h-3.5 w-3.5 text-rose-500" />, badge: 'Sub-Sec' },
  { value: 'google_gemini_pro', label: 'Google Gemini 1.5 Pro (2M Token Long Context)', icon: <Brain className="h-3.5 w-3.5 text-blue-500" />, badge: 'Gemini' },
  { value: 'google_gemini_flash', label: 'Google Gemini 1.5 Flash (Instant Response)', icon: <Brain className="h-3.5 w-3.5 text-amber-500" />, badge: 'Flash' },
  { value: 'groq_llama33', label: 'Groq LPU Llama 3.3 70B (<200ms Instant Voice)', icon: <Brain className="h-3.5 w-3.5 text-orange-500" />, badge: '<200ms' },
  { value: 'deepseek_v3', label: 'DeepSeek-V3 / R1 (Deep Strategic Reasoner)', icon: <Brain className="h-3.5 w-3.5 text-indigo-500" />, badge: 'DeepSeek' },
  { value: 'ollama_local', label: 'Local Ollama / Sovereign Llama 3.3 On-Premise', icon: <Brain className="h-3.5 w-3.5 text-zinc-400" />, badge: 'Ollama' },
  { value: 'lmstudio_local', label: 'LM Studio (Local Desktop GPU Inference Server)', icon: <Brain className="h-3.5 w-3.5 text-blue-400" />, badge: 'LM Studio' },
  { value: 'vllm_local', label: 'vLLM Server (Local / Self-Hosted High-Speed)', icon: <Brain className="h-3.5 w-3.5 text-purple-400" />, badge: 'vLLM' },
  { value: 'localai_local', label: 'LocalAI Engine (Self-Hosted CPU/GPU Server)', icon: <Brain className="h-3.5 w-3.5 text-emerald-400" />, badge: 'LocalAI' },
];

// All Available Carrier Audio Codecs for Multi-Select Provisioning
const AUDIO_CODEC_CUSTOM_OPTIONS: CustomSelectOption[] = [
  { value: 'opus_48k', label: 'Opus 48kHz HD Wideband (Zero-Latency WebRTC)', icon: <Wifi className="h-3.5 w-3.5 text-teal-500" />, badge: '48kHz' },
  { value: 'g711u', label: 'G.711u / PCMU (North America Telecom PSTN 64k)', icon: <Radio className="h-3.5 w-3.5 text-blue-500" />, badge: 'PCMU' },
  { value: 'g711a', label: 'G.711a / PCMA (Europe & International PSTN 64k)', icon: <Radio className="h-3.5 w-3.5 text-indigo-500" />, badge: 'PCMA' },
  { value: 'g722_hd', label: 'G.722 HD Voice 16kHz (Wideband SIP VoIP)', icon: <Radio className="h-3.5 w-3.5 text-emerald-500" />, badge: '16kHz' },
  { value: 'amr_wb', label: 'AMR-WB Adaptive Multi-Rate (GSM Cellular)', icon: <Radio className="h-3.5 w-3.5 text-amber-500" />, badge: 'AMR-WB' },
  { value: 'speex_16k', label: 'Speex 16kHz Ultra-Low Bitrate Codec', icon: <Radio className="h-3.5 w-3.5 text-purple-500" />, badge: 'Speex' },
  { value: 'pcm_16k', label: 'Linear PCM 16-bit (Lossless Raw Audio Stream)', icon: <Radio className="h-3.5 w-3.5 text-rose-500" />, badge: 'PCM' },
];

// Call Duration Bounds
const MAX_CALL_DURATION_OPTIONS: CustomSelectOption[] = [
  { value: '15', label: '15 Minutes Maximum per Call (Inquiry Cap)', icon: <Clock className="h-3.5 w-3.5 text-zinc-400" />, badge: '15m' },
  { value: '30', label: '30 Minutes Maximum per Call (Standard)', icon: <Clock className="h-3.5 w-3.5 text-teal-500" />, badge: '30m' },
  { value: '60', label: '60 Minutes (1 Hour Standard Support)', icon: <Clock className="h-3.5 w-3.5 text-blue-500" />, badge: '60m' },
  { value: '120', label: '120 Minutes (2 Hours Extended Consulting)', icon: <Clock className="h-3.5 w-3.5 text-purple-500" />, badge: '120m' },
  { value: '240', label: '240 Minutes (4 Hours High Duration Shift)', icon: <Clock className="h-3.5 w-3.5 text-indigo-500" />, badge: '240m' },
  { value: 'unlimited', label: 'Unlimited (No Call Duration Cap)', icon: <Infinity className="h-3.5 w-3.5 text-amber-500" />, badge: '∞' },
];

// 1-Click Plan Archetype Blueprints
export interface PlanArchetype {
  name: string;
  key: string;
  monthly: number;
  yearly: number;
  lifetime: number;
  tagline: string;
  category: string;
  icon: string;
  iconColor: string;
  trial: string;
  isCustom: boolean;
  minutes: number;
  concurrency: number;
  ragMb: number;
  agents: number;
  gsm_sim_enabled: boolean;
  gsm_label: string;
  voice_cloning_enabled: boolean;
  voice_cloning_label: string;
  webhook_api_enabled: boolean;
  webhook_label: string;
  priority_sla_enabled: boolean;
  sla_label: string;
  features: string[];
  log_buffer_limit?: number;
  allow_log_export?: boolean;
  raw_telemetry_enabled?: boolean;
  log_retention_days?: number;
  live_terminal_label?: string;
  allowed_stt_engines?: string[];
  allowed_tts_engines?: string[];
  allowed_llm_models?: string[];
  allowed_audio_codecs?: string[];
  max_call_duration_mins?: string;
}

const PLAN_ARCHETYPES: PlanArchetype[] = [
  {
    name: 'Starter Pilot',
    key: 'starter_pilot',
    monthly: 19,
    yearly: 15,
    lifetime: 190,
    tagline: 'Ideal for small pilots & testing voice AI agents.',
    category: 'For Small Teams & Startups',
    icon: 'Zap',
    iconColor: 'teal',
    trial: '7',
    isCustom: false,
    minutes: 500,
    concurrency: 2,
    ragMb: 200,
    agents: 2,
    gsm_sim_enabled: true,
    gsm_label: 'Included',
    voice_cloning_enabled: false,
    voice_cloning_label: 'Basic TTS',
    webhook_api_enabled: false,
    webhook_label: 'Not Included',
    priority_sla_enabled: false,
    sla_label: '99.5% Standard',
    log_buffer_limit: 50,
    allow_log_export: false,
    raw_telemetry_enabled: false,
    log_retention_days: 0,
    live_terminal_label: '50 Line Buffer',
    features: [
      '500 Monthly Voice Minutes',
      '2 Concurrent Active Trunks',
      'Up to 2 Active AI Voice Agents',
      'Standard LLM & TTS Engines',
      'Basic Call Analytics & Recording',
      'Community Support',
    ],
    allowed_stt_engines: ['deepgram_nova2', 'whisper_large_v3'],
    allowed_tts_engines: ['openai_tts1', 'piper_local'],
    allowed_llm_models: ['openai_gpt4o_mini', 'google_gemini_flash'],
    allowed_audio_codecs: ['opus_48k', 'g711u'],
    max_call_duration_mins: '30',
  },
  {
    name: 'Growth Pro',
    key: 'growth_pro',
    monthly: 49,
    yearly: 39,
    lifetime: 490,
    tagline: 'High-throughput outbound sales & campaign dialers.',
    category: 'For Growing Businesses',
    icon: 'Crown',
    iconColor: 'amber',
    trial: '14',
    isCustom: false,
    minutes: 3000,
    concurrency: 10,
    ragMb: 500,
    agents: 10,
    gsm_sim_enabled: true,
    gsm_label: 'Included',
    voice_cloning_enabled: true,
    voice_cloning_label: 'Studio Grade',
    webhook_api_enabled: true,
    webhook_label: 'Enterprise',
    priority_sla_enabled: true,
    sla_label: '99.99% Priority',
    log_buffer_limit: 500,
    allow_log_export: true,
    raw_telemetry_enabled: true,
    log_retention_days: 15,
    live_terminal_label: '500 Line Buffer + Export',
    features: [
      '3,000 Monthly Voice Minutes',
      '10 Concurrent Line Trunks',
      '10 Active AI Voice Agents',
      'Full RAG Memory Hub (500 MB)',
      'Android GSM & Cloud DID Support',
      'Custom Voice Fine-Tuning & Webhooks',
      'Priority Support SLA',
      'Realtime Terminal Logs & Export',
    ],
    allowed_stt_engines: ['deepgram_nova2', 'whisper_large_v3', 'assemblyai_conformer2'],
    allowed_tts_engines: ['elevenlabs_turbo25', 'cartesia_sonic', 'openai_tts1'],
    allowed_llm_models: ['openai_gpt4o', 'openai_gpt4o_mini', 'anthropic_claude35_haiku', 'groq_llama33'],
    allowed_audio_codecs: ['opus_48k', 'g711u', 'g722_hd'],
    max_call_duration_mins: '60',
  },
  {
    name: 'Business Scale',
    key: 'business_scale',
    monthly: 99,
    yearly: 79,
    lifetime: 990,
    tagline: 'Scalable multi-agent architecture with vector memory.',
    category: 'For Mid-Market Call Centers',
    icon: 'Flame',
    iconColor: 'purple',
    trial: '14',
    isCustom: false,
    minutes: 10000,
    concurrency: 30,
    ragMb: 2000,
    agents: 25,
    gsm_sim_enabled: true,
    gsm_label: 'Included (Multi-SIM)',
    voice_cloning_enabled: true,
    voice_cloning_label: 'Ultra HD Neural',
    webhook_api_enabled: true,
    webhook_label: 'Enterprise High-Speed',
    priority_sla_enabled: true,
    sla_label: '99.99% Guaranteed',
    log_buffer_limit: 1500,
    allow_log_export: true,
    raw_telemetry_enabled: true,
    log_retention_days: 30,
    live_terminal_label: '1,500 Line Buffer + Export',
    features: [
      '10,000 Monthly Voice Minutes',
      '30 Concurrent Line Trunks',
      '25 Active AI Voice Agents',
      '2,000 MB RAG Vector DB Storage',
      'Android Multi-SIM Gateway Pairing',
      'Live Call Barge & Whispering Supervision',
      'Enterprise REST Webhooks (100 req/s)',
      'Dedicated Account Manager',
    ],
    allowed_stt_engines: ['deepgram_nova2', 'whisper_large_v3', 'assemblyai_conformer2', 'google_stt', 'azure_realtime'],
    allowed_tts_engines: ['elevenlabs_turbo25', 'cartesia_sonic', 'openai_tts1', 'playht_2', 'azure_tts'],
    allowed_llm_models: ['openai_gpt4o', 'anthropic_claude35', 'google_gemini_pro', 'groq_llama33', 'deepseek_v3'],
    allowed_audio_codecs: ['opus_48k', 'g711u', 'g711a', 'g722_hd', 'amr_wb'],
    max_call_duration_mins: '120',
  },
  {
    name: 'Enterprise VIP',
    key: 'enterprise_vip',
    monthly: 299,
    yearly: 239,
    lifetime: 2990,
    tagline: 'Mission-critical bare-metal sovereign telephony with 99.99% SLA.',
    category: 'For Large Enterprises',
    icon: 'ShieldCheck',
    iconColor: 'emerald',
    trial: '30',
    isCustom: false,
    minutes: 50000,
    concurrency: 100,
    ragMb: 10000,
    agents: 0,
    gsm_sim_enabled: true,
    gsm_label: 'Multi-SIM Cluster',
    voice_cloning_enabled: true,
    voice_cloning_label: 'Sub-200ms Neural',
    webhook_api_enabled: true,
    webhook_label: 'High-Throughput Dedicated',
    priority_sla_enabled: true,
    sla_label: '99.99% Sovereign VIP',
    log_buffer_limit: 5000,
    allow_log_export: true,
    raw_telemetry_enabled: true,
    log_retention_days: 90,
    live_terminal_label: 'Unlimited Traces + Export',
    features: [
      '50,000 Monthly Voice Minutes',
      '100 Concurrent Trunks',
      'Unlimited AI Voice Bots',
      '10,000 MB Vector RAG Embeddings',
      'Bare-Metal Redundant Carrier SIP',
      'Full STIR/SHAKEN Compliance',
      'Dedicated 1-on-1 Solutions Architect',
      'Custom Security & SSO Integration',
    ],
    allowed_stt_engines: ['deepgram_nova2', 'whisper_large_v3', 'assemblyai_conformer2', 'google_stt', 'azure_realtime', 'faster_whisper', 'gladia_realtime', 'rev_ai'],
    allowed_tts_engines: ['elevenlabs_turbo25', 'cartesia_sonic', 'openai_tts1', 'playht_2', 'deepgram_aura', 'azure_tts', 'amazon_polly', 'piper_local'],
    allowed_llm_models: ['openai_gpt4o', 'openai_gpt4o_mini', 'anthropic_claude35', 'anthropic_claude35_haiku', 'google_gemini_pro', 'google_gemini_flash', 'groq_llama33', 'deepseek_v3', 'ollama_local'],
    allowed_audio_codecs: ['opus_48k', 'g711u', 'g711a', 'g722_hd', 'amr_wb', 'speex_16k', 'pcm_16k'],
    max_call_duration_mins: 'unlimited',
  },
  {
    name: 'Pay As You Go',
    key: 'pay_as_you_go',
    monthly: 0,
    yearly: 0,
    lifetime: 0,
    tagline: 'Zero monthly commitment, pay only for consumed minutes & channels.',
    category: 'Elastic Usage',
    icon: 'Activity',
    iconColor: 'blue',
    trial: '0',
    isCustom: false,
    minutes: 100,
    concurrency: 1,
    ragMb: 50,
    agents: 1,
    gsm_sim_enabled: true,
    gsm_label: 'Pay-Per-Minute',
    voice_cloning_enabled: false,
    voice_cloning_label: 'Standard TTS',
    webhook_api_enabled: false,
    webhook_label: 'Standard Webhooks',
    priority_sla_enabled: false,
    sla_label: '99.5% Standard',
    features: [
      'Pay Only For Consumed Minutes ($0.02/min)',
      'Elastic Channels Auto-Scaling',
      '1 Active Voice Bot',
      'Standard Cloud SIP Provider',
      'Self-Serve Knowledge Base',
    ],
    allowed_stt_engines: ['deepgram_nova2'],
    allowed_tts_engines: ['openai_tts1'],
    allowed_llm_models: ['openai_gpt4o_mini'],
    allowed_audio_codecs: ['opus_48k', 'g711u'],
    max_call_duration_mins: '30',
  },
  {
    name: 'Unlimited Ultra',
    key: 'unlimited_ultra',
    monthly: 499,
    yearly: 399,
    lifetime: 4990,
    tagline: 'Uncapped concurrency, dedicated trunking & direct carrier SIP.',
    category: 'For Power Dialers & MSPs',
    icon: 'Sparkles',
    iconColor: 'rose',
    trial: '14',
    isCustom: false,
    minutes: 100000,
    concurrency: 250,
    ragMb: 50000,
    agents: 0,
    gsm_sim_enabled: true,
    gsm_label: 'Dedicated Gateway Cluster',
    voice_cloning_enabled: true,
    voice_cloning_label: 'Instant Neural Cloning',
    webhook_api_enabled: true,
    webhook_label: '1,000 req/s Streaming',
    priority_sla_enabled: true,
    sla_label: '99.999% Fault-Tolerant',
    features: [
      '100,000 Monthly Voice Minutes',
      '250 Concurrent Dedicated Trunks',
      'Unlimited AI Voice Agents',
      '50,000 MB Vector Storage',
      'Global DID Wholesale Provisioning',
      'Automated Bulk Campaign Dialing Engine',
      '24/7 Dedicated Support Hotline',
    ],
    allowed_stt_engines: ['deepgram_nova2', 'whisper_large_v3', 'assemblyai_conformer2', 'google_stt', 'azure_realtime', 'faster_whisper', 'gladia_realtime', 'rev_ai'],
    allowed_tts_engines: ['elevenlabs_turbo25', 'cartesia_sonic', 'openai_tts1', 'playht_2', 'deepgram_aura', 'azure_tts', 'amazon_polly', 'piper_local'],
    allowed_llm_models: ['openai_gpt4o', 'openai_gpt4o_mini', 'anthropic_claude35', 'anthropic_claude35_haiku', 'google_gemini_pro', 'google_gemini_flash', 'groq_llama33', 'deepseek_v3', 'ollama_local'],
    allowed_audio_codecs: ['opus_48k', 'g711u', 'g711a', 'g722_hd', 'amr_wb', 'speex_16k', 'pcm_16k'],
    max_call_duration_mins: 'unlimited',
  },
  {
    name: 'Custom Enterprise',
    key: 'custom_enterprise',
    monthly: 0,
    yearly: 0,
    lifetime: 0,
    tagline: 'Bespoke AI voice architecture, custom SIP trunking & dedicated SLA.',
    category: 'For Custom Solutions',
    icon: 'SlidersHorizontal',
    iconColor: 'purple',
    trial: '30',
    isCustom: true,
    minutes: 25000,
    concurrency: 50,
    ragMb: 5000,
    agents: 50,
    gsm_sim_enabled: true,
    gsm_label: 'Custom Tailored',
    voice_cloning_enabled: true,
    voice_cloning_label: 'Custom Neural Voices',
    webhook_api_enabled: true,
    webhook_label: 'Custom REST Endpoints',
    priority_sla_enabled: true,
    sla_label: 'Custom Negotiated SLA',
    features: [
      'Tailored Minutes & Trunk Concurrency',
      'Custom LLM Fine-Tuned Voice Models',
      'Private Bare-Metal Server Deployment',
      'Custom CRM & PBX Telephony Integration',
      'Dedicated Account Executive & TAM',
    ],
    allowed_stt_engines: ['deepgram_nova2', 'whisper_large_v3', 'assemblyai_conformer2', 'google_stt', 'azure_realtime'],
    allowed_tts_engines: ['elevenlabs_turbo25', 'cartesia_sonic', 'openai_tts1', 'playht_2'],
    allowed_llm_models: ['openai_gpt4o', 'anthropic_claude35', 'google_gemini_pro', 'groq_llama33', 'deepseek_v3'],
    allowed_audio_codecs: ['opus_48k', 'g711u', 'g722_hd', 'amr_wb'],
    max_call_duration_mins: '240',
  },
];

// Ready-to-Use Feature Library for Multi-Selection
const TELEPHONY_FEATURE_CATALOG = [
  { id: 'f1', label: 'Zero-Latency WebRTC & Opus 48kHz Codec', category: 'Telephony' },
  { id: 'f2', label: 'Carrier Redundant SIP Trunks (BYOT / Pre-provisioned)', category: 'Telephony' },
  { id: 'f3', label: 'Real-Time Live Call Barge, Whispering & Supervision', category: 'Telephony' },
  { id: 'f4', label: 'Android Companion GSM Multi-SIM Gateway Pairing', category: 'Hardware' },
  { id: 'f5', label: 'Custom Voice Cloning Engine (ElevenLabs & Cartesia)', category: 'AI & Speech' },
  { id: 'f6', label: 'PostgreSQL Vector RAG Knowledge Base Embeddings', category: 'AI & Speech' },
  { id: 'f7', label: 'Sub-Second Conversational Speech Turn-Taking (<250ms)', category: 'AI & Speech' },
  { id: 'f8', label: 'Multi-Tenant Organization Workspace Partitioning', category: 'Platform' },
  { id: 'f9', label: 'Enterprise Webhooks & Event-Driven REST API (100 req/s)', category: 'Platform' },
  { id: 'f10', label: 'Automated Campaign Batch Dialing & Smart Retries', category: 'Telephony' },
  { id: 'f11', label: 'Unlimited Call Audio Recordings & Cloud Storage', category: 'Platform' },
  { id: 'f12', label: 'Contractual 99.99% Sovereign Telephony SLA Guarantee', category: 'Enterprise' },
  { id: 'f13', label: 'Dedicated 1-on-1 Solutions Telephony Architect & TAM', category: 'Enterprise' },
  { id: 'f14', label: 'STIR/SHAKEN Caller ID Spoof Verification Compliance', category: 'Telephony' },
  { id: 'f15', label: 'Automated GST/VAT Tax Invoices & Ledger PDF Exports', category: 'Billing' },
];

// Unified 1-Click Code Themes
const UNIFIED_CODE_TEMPLATES = [
  {
    name: 'Golden VIP Luxury',
    description: 'Gold sheen, glowing amber borders and luxury badge',
    code: `/* Golden VIP Luxury Theme */
<style>
#inpage-studio-live-preview-card {
  background: radial-gradient(circle at top right, rgba(245, 158, 11, 0.15), transparent 70%),
              linear-gradient(180deg, rgba(24, 24, 27, 0.98), rgba(9, 9, 11, 1)) !important;
  border: 2px solid rgba(245, 158, 11, 0.7) !important;
  box-shadow: 0 0 35px rgba(245, 158, 11, 0.28) !important;
}
</style>

<div style="display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:9999px; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.4); color:#fbbf24; font-size:11px; font-weight:800; margin-bottom:8px;">
  <span>★ SOVEREIGN VIP EXCLUSIVE ACCESS</span>
</div>`,
  },
  {
    name: 'Cyberpunk Neon Violet',
    description: 'Ultraviolet glow, glowing borders and high concurrency ribbon',
    code: `/* Cyberpunk Neon Violet Theme */
<style>
#inpage-studio-live-preview-card {
  background: radial-gradient(circle at top left, rgba(168, 85, 247, 0.2), transparent 60%),
              radial-gradient(circle at bottom right, rgba(6, 182, 212, 0.18), transparent 60%),
              #0f0f13 !important;
  border: 2px solid rgba(168, 85, 247, 0.8) !important;
  box-shadow: 0 0 35px rgba(168, 85, 247, 0.35) !important;
}
</style>

<div style="background: linear-gradient(90deg, #a855f7, #06b6d4); color:#fff; font-size:10px; font-weight:800; text-transform:uppercase; padding:4px 10px; border-radius:6px; display:inline-block; margin-bottom:8px; letter-spacing:1px; box-shadow:0 0 15px rgba(168,85,247,0.4);">
  ⚡ HIGH CONCURRENCY ENGINE
</div>`,
  },
  {
    name: 'Emerald Matrix Terminal',
    description: 'Matrix green terminal glow with sub-second SLA ribbon',
    code: `/* Emerald Matrix Terminal Theme */
<style>
#inpage-studio-live-preview-card {
  background: radial-gradient(circle at center top, rgba(16, 185, 129, 0.18), transparent 70%),
              #09090b !important;
  border: 2px solid rgba(16, 185, 129, 0.7) !important;
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.25) !important;
}
</style>

<div style="color:#34d399; font-size:11px; font-family:monospace; font-weight:700; margin-bottom:6px; letter-spacing:0.5px;">
  [SYSTEM STATUS // 99.99% SLA BARE-METAL READY]
</div>`,
  },
  {
    name: 'Frosted Glassmorphic',
    description: 'Translucent frosted glass with smooth border sheen',
    code: `/* Frosted Glassmorphism Theme */
<style>
#inpage-studio-live-preview-card {
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;
}
</style>

<div style="border-left: 2px solid #38bdf8; padding-left: 8px; font-size: 11px; color: #7dd3fc; margin-bottom: 8px;">
  ✦ Instant Voice Provisioning Included
</div>`,
  },
];

const BADGE_COLOR_PRESETS = [
  { label: 'Teal Green (Default)', value: 'teal' },
  { label: 'Emerald Glow', value: 'emerald' },
  { label: 'Royal Blue', value: 'blue' },
  { label: 'Neon Purple', value: 'purple' },
  { label: 'Golden Amber', value: 'amber' },
  { label: 'Crimson Rose', value: 'rose' },
  { label: 'Rainbow Gradient', value: 'gradient' },
];

const BUTTON_BG_PRESETS = [
  { label: 'Teal 600 (Standard)', value: '#0d9488' },
  { label: 'Emerald 600', value: '#059669' },
  { label: 'Blue 600', value: '#2563eb' },
  { label: 'Purple 600', value: '#7c3aed' },
  { label: 'Golden Amber', value: '#d97706' },
  { label: 'Rose Red', value: '#e11d48' },
  { label: 'Dark Obsidian', value: '#18181b' },
  { label: 'Gradient Cyan-Indigo', value: 'linear-gradient(135deg, #06b6d4, #4f46e5)' },
  { label: 'Gradient Gold-Amber', value: 'linear-gradient(135deg, #f59e0b, #d97706)' },
];

const ACCENT_GLOW_PRESETS = [
  { label: 'Standard Clean (Zinc Border)', value: 'default', borderClass: 'border border-zinc-200 dark:border-zinc-800' },
  { label: 'Teal Popular Focus', value: 'teal-focus', borderClass: 'border-2 border-teal-500/70 dark:border-teal-500/50 ring-2 ring-teal-500/20 shadow-md' },
  { label: 'Emerald Sovereign Glow', value: 'emerald-glow', borderClass: 'border-2 border-emerald-500/80 shadow-[0_0_25px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/40' },
  { label: 'Cyberpunk Violet Glow', value: 'violet-glow', borderClass: 'border-2 border-purple-500/80 shadow-[0_0_25px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/40' },
  { label: 'Golden VIP Aura', value: 'gold-glow', borderClass: 'border-2 border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/40' },
  { label: 'Neon Cyan Horizon', value: 'cyan-glow', borderClass: 'border-2 border-cyan-500/80 shadow-[0_0_25px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/40' },
  { label: 'Frosted Glass Sheen', value: 'glass', borderClass: 'border border-white/20 backdrop-blur-xl shadow-lg' },
];

export const PlanMasterStudio: React.FC<PlanMasterStudioProps> = ({
  plans,
  onSavePlan,
  onDeletePlan,
  onRefresh,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStudioPlan, setActiveStudioPlan] = useState<Partial<SubscriptionPlan> | null>(null);

  // Saved Custom Templates state (persisted to localStorage)
  const [savedCustomTemplates, setSavedCustomTemplates] = useState<PlanArchetype[]>(() => {
    try {
      const stored = localStorage.getItem('createcall_custom_plan_templates');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('starter_pilot');
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [customTemplateNameInput, setCustomTemplateNameInput] = useState('');

  // Accordion open/close state for Box 1, 2, 3, 4 (Box 1 open by default)
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    identity: true,
    pricing: false,
    trial: false,
    advanced: false,
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleSelectTemplate = (key: string) => {
    setSelectedTemplateKey(key);
    const allTemplates = [...PLAN_ARCHETYPES, ...savedCustomTemplates];
    const arch = allTemplates.find((t) => t.key === key);
    if (!arch || !activeStudioPlan) return;

    setActiveStudioPlan({
      ...activeStudioPlan,
      name: arch.name,
      plan_key: arch.key,
      monthly_price_usd: arch.monthly,
      yearly_price_usd: arch.yearly,
      lifetime_price_usd: arch.lifetime,
      tagline: arch.tagline,
      included_minutes: arch.minutes,
      concurrency_limit: arch.concurrency,
      rag_storage_mb: arch.ragMb,
      max_agents_count: arch.agents,
      gsm_sim_enabled: arch.gsm_sim_enabled,
      gsm_label: arch.gsm_label,
      voice_cloning_enabled: arch.voice_cloning_enabled,
      voice_cloning_label: arch.voice_cloning_label,
      webhook_api_enabled: arch.webhook_api_enabled,
      webhook_label: arch.webhook_label,
      priority_sla_enabled: arch.priority_sla_enabled,
      sla_label: arch.sla_label,
      features_list: [...arch.features],
      badge_icon: arch.icon,
      cta_text: arch.isCustom ? 'Talk to Enterprise Sales' : `Select ${arch.name}`,
      details_json: {
        ...(activeStudioPlan.details_json || {}),
        target_category: arch.category,
        plan_icon: arch.icon,
        plan_icon_color: arch.iconColor,
        trial_days: arch.trial,
        is_custom_quote: arch.isCustom,
        show_slug_on_card: activeStudioPlan.details_json?.show_slug_on_card ?? true,
        allowed_stt_engines: arch.allowed_stt_engines || ['deepgram_nova2', 'whisper_large_v3'],
        allowed_tts_engines: arch.allowed_tts_engines || ['elevenlabs_turbo25', 'cartesia_sonic'],
        allowed_llm_models: arch.allowed_llm_models || ['openai_gpt4o', 'anthropic_claude35'],
        allowed_audio_codecs: arch.allowed_audio_codecs || ['opus_48k', 'g711u'],
        max_call_duration_mins: arch.max_call_duration_mins || '60',
        stt_engine: arch.allowed_stt_engines?.[0] || 'deepgram_nova2',
        tts_engine: arch.allowed_tts_engines?.[0] || 'elevenlabs_turbo25',
        audio_codec: arch.allowed_audio_codecs?.[0] || 'opus_48k',
      },
    });
    setBulkFeaturesText(arch.features.join('\n'));
    showToast(`Loaded "${arch.name}" tier preset with all quotas & capabilities`);
  };

  const handleSaveCurrentAsCustomTemplate = () => {
    if (!activeStudioPlan) return;
    if (!customTemplateNameInput.trim()) {
      showToast('Please enter a template blueprint name', 'error');
      return;
    }

    const newKey = `custom_${Date.now()}`;
    const newArch: PlanArchetype = {
      name: customTemplateNameInput.trim(),
      key: newKey,
      monthly: activeStudioPlan.monthly_price_usd || 0,
      yearly: activeStudioPlan.yearly_price_usd || 0,
      lifetime: activeStudioPlan.lifetime_price_usd || 0,
      tagline: activeStudioPlan.tagline || '',
      category: activeStudioPlan.details_json?.target_category || 'Custom Blueprint',
      icon: activeStudioPlan.badge_icon || 'SlidersHorizontal',
      iconColor: activeStudioPlan.details_json?.plan_icon_color || 'purple',
      trial: activeStudioPlan.details_json?.trial_days || '0',
      isCustom: Boolean(activeStudioPlan.details_json?.is_custom_quote),
      minutes: activeStudioPlan.included_minutes || 0,
      concurrency: activeStudioPlan.concurrency_limit || 0,
      ragMb: activeStudioPlan.rag_storage_mb || 0,
      agents: activeStudioPlan.max_agents_count || 0,
      gsm_sim_enabled: activeStudioPlan.gsm_sim_enabled ?? true,
      gsm_label: activeStudioPlan.gsm_label || 'Included',
      voice_cloning_enabled: activeStudioPlan.voice_cloning_enabled ?? false,
      voice_cloning_label: activeStudioPlan.voice_cloning_label || 'Basic TTS',
      webhook_api_enabled: activeStudioPlan.webhook_api_enabled ?? false,
      webhook_label: activeStudioPlan.webhook_label || 'Not Included',
      priority_sla_enabled: activeStudioPlan.priority_sla_enabled ?? false,
      sla_label: activeStudioPlan.sla_label || '99.5% Standard',
      features: [...(activeStudioPlan.features_list || [])],
      allowed_stt_engines: activeStudioPlan.details_json?.allowed_stt_engines || ['deepgram_nova2'],
      allowed_tts_engines: activeStudioPlan.details_json?.allowed_tts_engines || ['elevenlabs_turbo25'],
      allowed_llm_models: activeStudioPlan.details_json?.allowed_llm_models || ['openai_gpt4o'],
      allowed_audio_codecs: activeStudioPlan.details_json?.allowed_audio_codecs || ['opus_48k'],
      max_call_duration_mins: activeStudioPlan.details_json?.max_call_duration_mins || '60',
    };

    const updated = [...savedCustomTemplates, newArch];
    setSavedCustomTemplates(updated);
    try {
      localStorage.setItem('createcall_custom_plan_templates', JSON.stringify(updated));
      showToast(`Saved blueprint "${newArch.name}" to your 1-Click Library`);
    } catch {
      showToast('Failed to persist blueprint locally', 'error');
    }
    setSelectedTemplateKey(newKey);
    setIsSaveTemplateModalOpen(false);
    setCustomTemplateNameInput('');
  };

  const handleDeleteCustomTemplate = (key: string, e?: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedCustomTemplates.filter((t) => t.key !== key);
    setSavedCustomTemplates(updated);
    try {
      localStorage.setItem('createcall_custom_plan_templates', JSON.stringify(updated));
      showToast('Custom template deleted');
    } catch {
      // ignore
    }
    if (selectedTemplateKey === key) {
      setSelectedTemplateKey('starter_pilot');
    }
  };

  // Top Tabs State: 'general' | 'telephony' | 'features' | 'style' | 'code'
  const [studioTab, setStudioTab] = useState<'general' | 'telephony' | 'features' | 'style' | 'code'>('general');

  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [isBulkFeatureMode, setIsBulkFeatureMode] = useState(false);
  const [bulkFeaturesText, setBulkFeaturesText] = useState('');
  const [previewCycle, setPreviewCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper getters for normalized plan data
  const getPlanMonthly = (p: SubscriptionPlan) => p.monthly_price_usd ?? p.monthlyPrice ?? p.price?.monthly ?? 0;
  const getPlanYearly = (p: SubscriptionPlan) => p.yearly_price_usd ?? p.yearlyPrice ?? p.price?.yearly ?? Math.round(getPlanMonthly(p) * 0.8);
  const getPlanLifetime = (p: SubscriptionPlan) => p.lifetime_price_usd ?? p.lifetimePrice ?? p.price?.lifetime ?? getPlanMonthly(p) * 10;
  const getPlanMinutes = (p: SubscriptionPlan) => p.included_minutes ?? p.includedMinutes ?? p.limits?.minutes ?? 0;
  const getPlanConcurrency = (p: SubscriptionPlan) => p.concurrency_limit ?? p.concurrencyLimit ?? p.limits?.concurrency ?? 0;
  const getPlanAgents = (p: SubscriptionPlan) => p.max_agents_count ?? p.maxAgentsCount ?? p.limits?.agents ?? 0;
  const getPlanRagMb = (p: SubscriptionPlan) => p.rag_storage_mb ?? p.ragStorageMb ?? p.limits?.ragStorageMb ?? 0;
  const getPlanFeatures = (p: SubscriptionPlan): string[] => p.features_list ?? p.features ?? [];
  const isPlanActive = (p: SubscriptionPlan) => p.is_active !== false;

  // Filter plans for the Master Ledger table
  const filteredPlans = plans.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (p.name || '').toLowerCase().includes(q) || (p.plan_key || p.id || '').toLowerCase().includes(q);
    const featureMatch = getPlanFeatures(p).some((f) => f.toLowerCase().includes(q));
    return nameMatch || featureMatch;
  });

  const handleOpenCreateInPage = () => {
    const starterArch = PLAN_ARCHETYPES[0];
    setActiveStudioPlan({
      name: '',
      plan_key: '',
      monthly_price_usd: 19,
      yearly_price_usd: 15,
      lifetime_price_usd: 190,
      currency: 'USD',
      billing_interval: 'month',
      is_active: true,
      popular: false,
      included_minutes: 500,
      concurrency_limit: 2,
      max_agents_count: 2,
      rag_storage_mb: 200,
      gsm_sim_enabled: true,
      voice_cloning_enabled: false,
      webhook_api_enabled: false,
      priority_sla_enabled: false,
      badge_text: '',
      badge_color: 'teal',
      badge_icon: 'Zap',
      accent_color: 'default',
      cta_text: 'Get Started Today',
      cta_link: '',
      cta_bg_color: '#0d9488',
      cta_text_color: '#ffffff',
      cta_icon: 'Zap',
      gsm_label: 'Included',
      voice_cloning_label: 'Basic TTS',
      webhook_label: 'Not Included',
      sla_label: '99.5% Standard',
      voice_minutes_label: 'Voice Minutes:',
      concurrency_label: 'Live Concurrency:',
      rag_label: 'RAG Vector DB:',
      bots_label: 'AI Voice Bots:',
      tagline: 'Ideal for small pilots & testing voice AI agents.',
      sub_billing_text: 'Billed monthly in USD • Cancel anytime • Zero hidden fees',
      features_list: [
        '500 Monthly Voice Minutes',
        '2 Concurrent Active Trunks',
        'Up to 2 Active AI Voice Agents',
        'Standard LLM & TTS Engines',
        'Basic Call Analytics & Recording',
        'Community Support',
      ],
      details_json: {
        currency_symbol: '$',
        currency_code: 'USD',
        target_category: 'For Small Teams & Startups',
        plan_icon: 'Zap',
        plan_icon_color: 'teal',
        trial_days: '14',
        trial_requires_cc: false,
        setup_fee_usd: 0,
        is_setup_fee_waived: false,
        sub_billing_text: 'Billed monthly in USD • Cancel anytime • Zero hidden fees',
        is_custom_quote: false,
        is_lifetime_enabled: true,
        lifetime_subtext: 'One-Time Payment • Lifetime Access',
        show_slug_on_card: true,
        is_unlimited_minutes: false,
        is_unlimited_concurrency: false,
        is_unlimited_rag: false,
        is_unlimited_agents: false,
        phone_numbers_included: 0,
        phone_numbers_label: 'Dedicated DID Lines:',
        is_unlimited_phone_numbers: false,
        overage_rate_per_min: '0.02',
        rollover_minutes: false,
        burst_channels_allowed: '+2 Burst Trunks',
        allowed_stt_engines: ['deepgram_nova2', 'whisper_large_v3'],
        allowed_tts_engines: ['openai_tts1', 'piper_local'],
        allowed_llm_models: ['openai_gpt4o_mini', 'google_gemini_flash'],
        allowed_audio_codecs: ['opus_48k', 'g711u'],
        stt_engine: 'deepgram_nova2',
        tts_engine: 'openai_tts1',
        audio_codec: 'opus_48k',
        max_call_duration_mins: '30',
      },
    });
    setOpenSections({ identity: true, pricing: false, trial: false, advanced: false });
    setStudioTab('general');
  };

  const handleOpenEditInPage = (p: SubscriptionPlan) => {
    const dt = p.details_json || {};
    const features = [...getPlanFeatures(p)];
    setActiveStudioPlan({
      ...p,
      monthly_price_usd: getPlanMonthly(p),
      yearly_price_usd: getPlanYearly(p),
      lifetime_price_usd: getPlanLifetime(p),
      included_minutes: getPlanMinutes(p),
      concurrency_limit: getPlanConcurrency(p),
      max_agents_count: getPlanAgents(p),
      rag_storage_mb: getPlanRagMb(p),
      features_list: features,
      gsm_sim_enabled: p.gsm_sim_enabled ?? p.gsmSimEnabled ?? true,
      voice_cloning_enabled: p.voice_cloning_enabled ?? p.voiceCloningEnabled ?? false,
      webhook_api_enabled: p.webhook_api_enabled ?? p.webhookApiEnabled ?? false,
      priority_sla_enabled: p.priority_sla_enabled ?? p.prioritySlaEnabled ?? false,
      badge_text: p.badge_text || dt.badge_text || '',
      badge_color: p.badge_color || dt.badge_color || 'teal',
      badge_icon: p.badge_icon || dt.badge_icon || dt.plan_icon || 'Zap',
      accent_color: p.accent_color || dt.accent_color || 'default',
      cta_text: p.cta_text || dt.cta_text || `Select ${p.name || 'Plan'}`,
      cta_link: p.cta_link || dt.cta_link || '',
      cta_bg_color: p.cta_bg_color || dt.cta_bg_color || '#0d9488',
      cta_text_color: p.cta_text_color || dt.cta_text_color || '#ffffff',
      cta_icon: p.cta_icon || dt.cta_icon || 'Zap',
      gsm_label: p.gsm_label || dt.gsm_label || (p.gsm_sim_enabled ?? p.gsmSimEnabled ? 'Included' : 'Not Included'),
      voice_cloning_label: p.voice_cloning_label || dt.voice_cloning_label || (p.voice_cloning_enabled ?? p.voiceCloningEnabled ? 'Studio Grade' : 'Basic TTS'),
      webhook_label: p.webhook_label || dt.webhook_label || (p.webhook_api_enabled ?? p.webhookApiEnabled ? 'Enterprise' : 'Not Included'),
      sla_label: p.sla_label || dt.sla_label || (p.priority_sla_enabled ?? p.prioritySlaEnabled ? '99.99% Priority' : '99.5% Standard'),
      voice_minutes_label: p.voice_minutes_label || dt.voice_minutes_label || 'Voice Minutes:',
      concurrency_label: p.concurrency_label || dt.concurrency_label || 'Live Concurrency:',
      rag_label: p.rag_label || dt.rag_label || 'RAG Vector DB:',
      bots_label: p.bots_label || dt.bots_label || 'AI Voice Bots:',
      sub_billing_text: p.sub_billing_text || dt.sub_billing_text || 'Billed monthly in USD • Cancel anytime',
      custom_css: p.custom_css || dt.custom_css || '',
      custom_html: p.custom_html || dt.custom_html || '',
      is_active: isPlanActive(p),
      popular: Boolean(p.popular),
      details_json: {
        currency_symbol: dt.currency_symbol || '$',
        currency_code: dt.currency_code || 'USD',
        target_category: dt.target_category || 'For Growing Teams',
        plan_icon: dt.plan_icon || p.badge_icon || 'Zap',
        plan_icon_color: dt.plan_icon_color || 'teal',
        trial_days: dt.trial_days || '14',
        trial_requires_cc: Boolean(dt.trial_requires_cc),
        setup_fee_usd: dt.setup_fee_usd ?? 0,
        is_setup_fee_waived: Boolean(dt.is_setup_fee_waived),
        sub_billing_text: dt.sub_billing_text || p.sub_billing_text || 'Billed monthly in USD • Cancel anytime',
        is_custom_quote: Boolean(dt.is_custom_quote),
        is_lifetime_enabled: dt.is_lifetime_enabled !== false,
        lifetime_subtext: dt.lifetime_subtext || 'One-Time Payment • Lifetime Access',
        show_slug_on_card: dt.show_slug_on_card !== false,
        is_unlimited_minutes: Boolean(dt.is_unlimited_minutes),
        is_unlimited_concurrency: Boolean(dt.is_unlimited_concurrency),
        is_unlimited_rag: Boolean(dt.is_unlimited_rag),
        is_unlimited_agents: Boolean(dt.is_unlimited_agents) || p.max_agents_count === 0,
        phone_numbers_included: dt.phone_numbers_included ?? 0,
        phone_numbers_label: dt.phone_numbers_label || 'Dedicated DID Lines:',
        is_unlimited_phone_numbers: Boolean(dt.is_unlimited_phone_numbers),
        overage_rate_per_min: dt.overage_rate_per_min || '0.02',
        rollover_minutes: Boolean(dt.rollover_minutes),
        burst_channels_allowed: dt.burst_channels_allowed || '+5 Burst Trunks',
        allowed_stt_engines: dt.allowed_stt_engines || (dt.stt_engine ? [dt.stt_engine] : ['deepgram_nova2', 'whisper_large_v3']),
        allowed_tts_engines: dt.allowed_tts_engines || (dt.tts_engine ? [dt.tts_engine] : ['elevenlabs_turbo25', 'cartesia_sonic']),
        allowed_llm_models: dt.allowed_llm_models || ['openai_gpt4o', 'anthropic_claude35'],
        allowed_audio_codecs: dt.allowed_audio_codecs || (dt.audio_codec ? [dt.audio_codec] : ['opus_48k', 'g711u']),
        stt_engine: dt.stt_engine || 'deepgram_nova2',
        tts_engine: dt.tts_engine || 'elevenlabs_turbo25',
        audio_codec: dt.audio_codec || 'opus_48k',
        max_call_duration_mins: dt.max_call_duration_mins || '60',
        ...dt,
      },
    });
    setBulkFeaturesText(features.join('\n'));
    setOpenSections({ identity: true, pricing: false, trial: false, advanced: false });
    setStudioTab('general');
  };

  const handleClonePlan = async (p: SubscriptionPlan) => {
    const timestamp = Date.now();
    const clonedData: Partial<SubscriptionPlan> = {
      name: `${p.name || 'Custom Plan'} (Copy)`,
      plan_key: `${p.plan_key || p.id}_copy_${timestamp.toString().slice(-4)}`,
      tagline: p.tagline,
      monthly_price_usd: getPlanMonthly(p),
      yearly_price_usd: getPlanYearly(p),
      lifetime_price_usd: getPlanLifetime(p),
      included_minutes: getPlanMinutes(p),
      concurrency_limit: getPlanConcurrency(p),
      max_agents_count: getPlanAgents(p),
      rag_storage_mb: getPlanRagMb(p),
      gsm_sim_enabled: p.gsm_sim_enabled ?? p.gsmSimEnabled ?? true,
      voice_cloning_enabled: p.voice_cloning_enabled ?? p.voiceCloningEnabled ?? false,
      webhook_api_enabled: p.webhook_api_enabled ?? p.webhookApiEnabled ?? false,
      priority_sla_enabled: p.priority_sla_enabled ?? p.prioritySlaEnabled ?? false,
      features_list: [...getPlanFeatures(p)],
      badge_text: p.badge_text || '',
      badge_color: p.badge_color || 'teal',
      badge_icon: p.badge_icon || 'Zap',
      accent_color: p.accent_color || 'default',
      cta_text: `Select ${p.name || 'Plan'} (Copy)`,
      cta_link: p.cta_link || '',
      cta_bg_color: p.cta_bg_color || '#0d9488',
      cta_text_color: p.cta_text_color || '#ffffff',
      cta_icon: p.cta_icon || 'Zap',
      sub_billing_text: p.sub_billing_text || 'Billed monthly in USD • Cancel anytime',
      custom_css: p.custom_css || '',
      custom_html: p.custom_html || '',
      popular: false,
      is_active: true,
      sort_order: plans.length + 1,
      details_json: { ...(p.details_json || {}) },
    };
    try {
      setIsSaving(true);
      await onSavePlan(clonedData);
      showToast(`Cloned plan "${p.name}" successfully.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to clone plan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveActiveStudioPlan = async () => {
    if (!activeStudioPlan) return;
    if (!activeStudioPlan.name?.trim()) {
      showToast('Plan name is required', 'error');
      return;
    }
    if (!activeStudioPlan.plan_key?.trim()) {
      showToast('Plan key identifier is required', 'error');
      return;
    }

    const compiledDetailsJson = {
      ...(activeStudioPlan.details_json || {}),
      cta_bg_color: activeStudioPlan.cta_bg_color,
      cta_text_color: activeStudioPlan.cta_text_color,
      cta_icon: activeStudioPlan.cta_icon,
      cta_link: activeStudioPlan.cta_link,
      badge_text: activeStudioPlan.badge_text,
      badge_color: activeStudioPlan.badge_color,
      badge_icon: activeStudioPlan.badge_icon,
      accent_color: activeStudioPlan.accent_color,
      gsm_label: activeStudioPlan.gsm_label,
      voice_cloning_label: activeStudioPlan.voice_cloning_label,
      webhook_label: activeStudioPlan.webhook_label,
      sla_label: activeStudioPlan.sla_label,
      voice_minutes_label: activeStudioPlan.voice_minutes_label,
      concurrency_label: activeStudioPlan.concurrency_label,
      rag_label: activeStudioPlan.rag_label,
      bots_label: activeStudioPlan.bots_label,
      sub_billing_text: activeStudioPlan.sub_billing_text,
      target_category: activeStudioPlan.details_json?.target_category,
      plan_icon: activeStudioPlan.badge_icon || activeStudioPlan.details_json?.plan_icon,
      plan_icon_color: activeStudioPlan.details_json?.plan_icon_color || 'teal',
      currency_symbol: activeStudioPlan.details_json?.currency_symbol || '$',
      currency_code: activeStudioPlan.details_json?.currency_code || 'USD',
      is_custom_quote: Boolean(activeStudioPlan.details_json?.is_custom_quote),
      is_lifetime_enabled: activeStudioPlan.details_json?.is_lifetime_enabled !== false,
      trial_days: activeStudioPlan.details_json?.trial_days || '0',
      trial_requires_cc: Boolean(activeStudioPlan.details_json?.trial_requires_cc),
      setup_fee_usd: activeStudioPlan.details_json?.setup_fee_usd ?? 0,
      is_setup_fee_waived: Boolean(activeStudioPlan.details_json?.is_setup_fee_waived),
      lifetime_subtext: activeStudioPlan.details_json?.lifetime_subtext || 'One-Time Payment • Lifetime Access',
      show_slug_on_card: activeStudioPlan.details_json?.show_slug_on_card !== false,
      is_unlimited_minutes: Boolean(activeStudioPlan.details_json?.is_unlimited_minutes),
      is_unlimited_concurrency: Boolean(activeStudioPlan.details_json?.is_unlimited_concurrency),
      is_unlimited_rag: Boolean(activeStudioPlan.details_json?.is_unlimited_rag),
      is_unlimited_agents: Boolean(activeStudioPlan.details_json?.is_unlimited_agents) || activeStudioPlan.max_agents_count === 0,
      phone_numbers_included: activeStudioPlan.details_json?.phone_numbers_included ?? 0,
      phone_numbers_label: activeStudioPlan.details_json?.phone_numbers_label || 'Dedicated DID Lines:',
      is_unlimited_phone_numbers: Boolean(activeStudioPlan.details_json?.is_unlimited_phone_numbers),
      overage_rate_per_min: activeStudioPlan.details_json?.overage_rate_per_min || '0.02',
      rollover_minutes: Boolean(activeStudioPlan.details_json?.rollover_minutes),
      burst_channels_allowed: activeStudioPlan.details_json?.burst_channels_allowed || '+5 Burst Trunks',
      allowed_stt_engines: activeStudioPlan.details_json?.allowed_stt_engines || ['deepgram_nova2', 'whisper_large_v3'],
      allowed_tts_engines: activeStudioPlan.details_json?.allowed_tts_engines || ['elevenlabs_turbo25', 'cartesia_sonic'],
      allowed_llm_models: activeStudioPlan.details_json?.allowed_llm_models || ['openai_gpt4o', 'anthropic_claude35'],
      allowed_audio_codecs: activeStudioPlan.details_json?.allowed_audio_codecs || ['opus_48k', 'g711u'],
      stt_engine: activeStudioPlan.details_json?.stt_engine || activeStudioPlan.details_json?.allowed_stt_engines?.[0] || 'deepgram_nova2',
      tts_engine: activeStudioPlan.details_json?.tts_engine || activeStudioPlan.details_json?.allowed_tts_engines?.[0] || 'elevenlabs_turbo25',
      audio_codec: activeStudioPlan.details_json?.audio_codec || activeStudioPlan.details_json?.allowed_audio_codecs?.[0] || 'opus_48k',
      max_call_duration_mins: activeStudioPlan.details_json?.max_call_duration_mins || '60',
      log_buffer_limit: activeStudioPlan.log_buffer_limit ?? activeStudioPlan.details_json?.log_buffer_limit ?? 50,
      allow_log_export: activeStudioPlan.allow_log_export !== undefined ? activeStudioPlan.allow_log_export : (activeStudioPlan.details_json?.allow_log_export ?? false),
      raw_telemetry_enabled: activeStudioPlan.raw_telemetry_enabled !== undefined ? activeStudioPlan.raw_telemetry_enabled : (activeStudioPlan.details_json?.raw_telemetry_enabled ?? false),
      log_retention_days: activeStudioPlan.log_retention_days ?? activeStudioPlan.details_json?.log_retention_days ?? 0,
      live_terminal_label: activeStudioPlan.live_terminal_label || activeStudioPlan.details_json?.live_terminal_label || '50 Line Buffer',
    };

    const payloadToSave: Partial<SubscriptionPlan> = {
      ...activeStudioPlan,
      log_buffer_limit: compiledDetailsJson.log_buffer_limit,
      allow_log_export: compiledDetailsJson.allow_log_export,
      raw_telemetry_enabled: compiledDetailsJson.raw_telemetry_enabled,
      log_retention_days: compiledDetailsJson.log_retention_days,
      live_terminal_label: compiledDetailsJson.live_terminal_label,
      sub_billing_text: activeStudioPlan.sub_billing_text || compiledDetailsJson.sub_billing_text,
      details_json: compiledDetailsJson,
    };

    try {
      setIsSaving(true);
      await onSavePlan(payloadToSave);
      showToast(`Plan "${activeStudioPlan.name}" saved successfully.`);
      setActiveStudioPlan(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save plan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteActivePlan = async (id: string) => {
    try {
      setIsSaving(true);
      await onDeletePlan(id);
      showToast('Plan tier deleted successfully.');
      setDeleteConfirmId(null);
      if (activeStudioPlan?.id === id) {
        setActiveStudioPlan(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete plan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCatalogFeature = (label: string) => {
    if (!activeStudioPlan) return;
    const current = activeStudioPlan.features_list || [];
    if (current.includes(label)) {
      setActiveStudioPlan({
        ...activeStudioPlan,
        features_list: current.filter((f) => f !== label),
      });
    } else {
      setActiveStudioPlan({
        ...activeStudioPlan,
        features_list: [...current, label],
      });
    }
  };

  const handleAddCustomFeature = () => {
    if (!newFeatureInput.trim() || !activeStudioPlan) return;
    const current = activeStudioPlan.features_list || [];
    setActiveStudioPlan({
      ...activeStudioPlan,
      features_list: [...current, newFeatureInput.trim()],
    });
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    if (!activeStudioPlan) return;
    const current = [...(activeStudioPlan.features_list || [])];
    current.splice(idx, 1);
    setActiveStudioPlan({
      ...activeStudioPlan,
      features_list: current,
    });
  };

  const handleMoveFeature = (idx: number, direction: 'up' | 'down') => {
    if (!activeStudioPlan) return;
    const current = [...(activeStudioPlan.features_list || [])];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= current.length) return;
    const temp = current[idx];
    current[idx] = current[targetIdx];
    current[targetIdx] = temp;
    setActiveStudioPlan({
      ...activeStudioPlan,
      features_list: current,
    });
  };

  const handleApplyBulkFeatures = () => {
    if (!activeStudioPlan) return;
    const parsed = bulkFeaturesText
      .split('\n')
      .map((l) => l.trim().replace(/^[-•*]\s*/, ''))
      .filter(Boolean);
    setActiveStudioPlan({
      ...activeStudioPlan,
      features_list: parsed,
    });
    setIsBulkFeatureMode(false);
    showToast(`Updated with ${parsed.length} feature points.`);
  };

  const handleApplyUnifiedCodeTemplate = (tmpl: typeof UNIFIED_CODE_TEMPLATES[0]) => {
    if (!activeStudioPlan) return;
    setActiveStudioPlan({
      ...activeStudioPlan,
      custom_html: tmpl.code,
    });
    showToast(`Applied code theme: ${tmpl.name}`);
  };

  // Preview price calculations & dynamic tokens
  const currencySymbol = activeStudioPlan?.details_json?.currency_symbol || '$';
  const currencyCode = activeStudioPlan?.details_json?.currency_code || 'USD';
  const isCustomQuote = Boolean(activeStudioPlan?.details_json?.is_custom_quote);
  const monthlyVal = activeStudioPlan?.monthly_price_usd ?? 0;
  const isFreeTier = monthlyVal === 0 && !isCustomQuote;
  const yearlyVal = activeStudioPlan?.yearly_price_usd ?? Math.round(monthlyVal * 0.8);
  const lifetimeVal = activeStudioPlan?.lifetime_price_usd ?? monthlyVal * 10;
  const trialDays = activeStudioPlan?.details_json?.trial_days || '0';
  const setupFee = activeStudioPlan?.details_json?.setup_fee_usd ?? 0;
  const isSetupFeeWaived = Boolean(activeStudioPlan?.details_json?.is_setup_fee_waived);
  const targetCategory = activeStudioPlan?.details_json?.target_category || '';
  const headerIconName = activeStudioPlan?.badge_icon || activeStudioPlan?.details_json?.plan_icon || 'Zap';
  const headerIconColor = activeStudioPlan?.details_json?.plan_icon_color || 'teal';
  const HeaderPlanIcon = AVAILABLE_ICONS[headerIconName] || Zap;

  const currentPreviewPrice =
    previewCycle === 'monthly' ? monthlyVal : previewCycle === 'yearly' ? yearlyVal : lifetimeVal;

  const previewAnnualSavings = (monthlyVal - yearlyVal) * 12;

  const baseMinutes = activeStudioPlan?.included_minutes ?? 0;
  const isUnlimitedMinutes = Boolean(activeStudioPlan?.details_json?.is_unlimited_minutes);
  const isUnlimitedConcurrency = Boolean(activeStudioPlan?.details_json?.is_unlimited_concurrency);
  const isUnlimitedRag = Boolean(activeStudioPlan?.details_json?.is_unlimited_rag);
  const isUnlimitedAgents = Boolean(activeStudioPlan?.details_json?.is_unlimited_agents) || (activeStudioPlan?.max_agents_count === 0 && !activeStudioPlan?.details_json?.is_custom_quote);
  const includedPhoneNumbers = activeStudioPlan?.details_json?.phone_numbers_included ?? 0;
  const isUnlimitedPhoneNumbers = Boolean(activeStudioPlan?.details_json?.is_unlimited_phone_numbers);

  const previewDynamicMinutes = isUnlimitedMinutes
    ? 'Unlimited Voice Minutes'
    : previewCycle === 'yearly'
    ? `${Math.round(baseMinutes * 1.1).toLocaleString()} Mins (+10%)`
    : `${baseMinutes.toLocaleString()} Mins / mo`;

  // Render Icon Helper
  const CtaButtonIcon =
    activeStudioPlan?.cta_icon && AVAILABLE_ICONS[activeStudioPlan.cta_icon]
      ? AVAILABLE_ICONS[activeStudioPlan.cta_icon]
      : Zap;

  // Selected Accent Glow Class
  const activeAccentClass =
    ACCENT_GLOW_PRESETS.find((a) => a.value === activeStudioPlan?.accent_color)?.borderClass ||
    (activeStudioPlan?.popular
      ? 'border-2 border-teal-500/70 dark:border-teal-500/50 shadow-xs hover:border-teal-500'
      : 'border border-zinc-200 dark:border-zinc-800 shadow-xs');

  // Active capabilities count calculation
  const activeCapabilityCount = [
    activeStudioPlan?.gsm_sim_enabled !== false,
    Boolean(activeStudioPlan?.voice_cloning_enabled),
    Boolean(activeStudioPlan?.webhook_api_enabled),
    Boolean(activeStudioPlan?.priority_sla_enabled),
  ].filter(Boolean).length;

  // =========================================================================
  // VIEW 1: FULL IN-PAGE STUDIO (WITH TOP TABS & LIVE PREVIEW)
  // =========================================================================
  if (activeStudioPlan) {
    return (
      <div className="space-y-4 animate-in fade-in duration-150">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold border transition-all animate-in fade-in slide-in-from-top-3 ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-emerald-950/40'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-rose-950/40'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Studio Top Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 px-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveStudioPlan(null)}
              leftIcon={<ArrowLeft className="h-3 w-3" />}
              className="text-[11px] h-7 px-2.5 text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer"
            >
              Back
            </Button>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>{activeStudioPlan.name ? `Editing: ${activeStudioPlan.name}` : 'Create New Plan'}</span>
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 font-mono font-semibold">
                #{activeStudioPlan.plan_key || 'key'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveStudioPlan(null)}
              className="text-[11px] h-7 px-2.5 text-zinc-600 dark:text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveActiveStudioPlan}
              disabled={isSaving}
              leftIcon={<Check className="h-3 w-3" />}
              className="text-[11px] h-7 px-3 font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-teal-900/40"
            >
              {isSaving ? 'Saving...' : 'Save Plan Tier'}
            </Button>
          </div>
        </div>

        {/* Compact Pro Horizontal Studio Tabs Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-750 overflow-x-auto no-scrollbar">
          {[
            { id: 'general', label: '1. General & Pricing', icon: DollarSign },
            { id: 'telephony', label: '2. Telephony Quotas', icon: PhoneCall },
            { id: 'features', label: `3. Features (${activeStudioPlan.features_list?.length || 0})`, icon: ListPlus },
            { id: 'style', label: '4. Badges & Themes', icon: Palette },
            { id: 'code', label: '5. HTML & CSS', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = studioTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStudioTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-2xs border border-zinc-200/80 dark:border-zinc-700 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-zinc-700/40'
                }`}
              >
                <Icon className={`h-3 w-3 shrink-0 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dual-Pane Studio Body (7 Cols Left Form + 5 Cols Right Live Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT PANE (7 Cols): Multi-Tab Control Studio */}
          <div className="lg:col-span-7 space-y-4">
            {/* TAB 1: GENERAL & PRICING (ENTERPRISE-GRADE MASTERPIECE UI) */}
            {studioTab === 'general' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                {/* 1. Sleek 1-Click Archetype Quick-Bar (with Dropdown & Custom Template Saver) */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500/5 via-teal-500/10 to-transparent dark:from-teal-950/30 dark:via-zinc-900 dark:to-zinc-900 border border-teal-500/20 dark:border-teal-800/40 shadow-2xs space-y-2.5 relative z-40 overflow-visible">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300">
                      <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>1-Click Tier Templates &amp; Custom Blueprints:</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">Select template to auto-fill all parameters, or save custom</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 min-w-[240px]">
                      <CustomSelect
                        value={selectedTemplateKey}
                        onChange={(val) => handleSelectTemplate(val)}
                        placeholder="Choose a 1-Click Plan Template..."
                        options={[
                          ...PLAN_ARCHETYPES.map((arch) => {
                            const IconComponent = AVAILABLE_ICONS[arch.icon] || Zap;
                            return {
                              value: arch.key,
                              label: `${arch.name} ${arch.isCustom ? '(Custom Quote)' : `($${arch.monthly}/mo)`} — ${arch.category}`,
                              badge: arch.isCustom ? 'Custom' : `$${arch.monthly}/mo`,
                              icon: <IconComponent className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />,
                            };
                          }),
                          ...(savedCustomTemplates.length > 0
                            ? savedCustomTemplates.map((cust) => ({
                                value: cust.key,
                                label: `${cust.name} ($${cust.monthly}/mo) — Custom Saved Blueprint`,
                                badge: 'Custom Saved',
                                icon: <Layers className="h-3.5 w-3.5 text-amber-500" />,
                              }))
                            : []),
                        ]}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomTemplateNameInput(activeStudioPlan.name ? `${activeStudioPlan.name} Template` : 'My Custom Template');
                          setIsSaveTemplateModalOpen(true);
                        }}
                        className="h-8.5 px-3 rounded-lg border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Layers className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                        <span>Save as Custom Template</span>
                      </button>

                      {savedCustomTemplates.some((t) => t.key === selectedTemplateKey) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomTemplate(selectedTemplateKey)}
                          className="h-8.5 px-2.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Delete selected custom template"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Save Custom Template Modal/Dialog */}
                  {isSaveTemplateModalOpen && (
                    <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-teal-500/50 shadow-md space-y-2 animate-in fade-in duration-100">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-teal-600" />
                          <span>Save Current Plan as Reusable Custom Template</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsSaveTemplateModalOpen(false)}
                          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={customTemplateNameInput}
                          onChange={(e) => setCustomTemplateNameInput(e.target.value)}
                          placeholder="e.g. VIP Call Center High-Volume Blueprint"
                          className="h-8 text-xs flex-1"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSaveCurrentAsCustomTemplate}
                          leftIcon={<Check className="h-3 w-3" />}
                          className="text-xs h-8 px-3 bg-teal-600 text-white"
                        >
                          Confirm &amp; Save
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. ACCORDION BOX 1: PLAN IDENTITY & BRANDING */}
                <div className={`rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs transition-all ${openSections.identity ? 'overflow-visible relative z-30' : 'overflow-hidden relative z-10'}`}>
                  <button
                    type="button"
                    onClick={() => toggleSection('identity')}
                    className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-3 text-left hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-6 w-6 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-black border border-teal-500/20 shrink-0">
                        1
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                          <span>Plan Identity &amp; Branding</span>
                          {!openSections.identity && activeStudioPlan.name && (
                            <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 truncate max-w-[200px]">
                              {activeStudioPlan.name} (#{activeStudioPlan.plan_key || 'key'})
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate">
                          Plan naming, unique URL slug, tagline pitch, and category badge
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-zinc-400 font-semibold hidden sm:inline">
                        {openSections.identity ? 'Collapse' : 'Expand'}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
                          openSections.identity ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {openSections.identity && (
                    <div className="p-4 pt-2 space-y-3.5 border-t border-zinc-100 dark:border-zinc-800/80 animate-in fade-in duration-150">
                      {/* Name & Slug */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              Plan Name <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {(activeStudioPlan.name || '').length}/40
                            </span>
                          </div>
                          <Input
                            value={activeStudioPlan.name || ''}
                            onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, name: e.target.value })}
                            placeholder="e.g. Growth Pro"
                            className="h-8.5 text-xs font-semibold"
                            maxLength={40}
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              Slug Identifier <span className="text-rose-500">*</span>
                            </label>
                            {/* Card Display Dual Button Box [ ON ] [ OFF ] */}
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-zinc-400 uppercase font-bold">Show on Card:</span>
                              <div className="inline-flex p-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveStudioPlan({
                                      ...activeStudioPlan,
                                      details_json: {
                                        ...(activeStudioPlan.details_json || {}),
                                        show_slug_on_card: true,
                                      },
                                    });
                                    showToast('Slug badge will show on card');
                                  }}
                                  className={`px-1.5 py-0.2 text-[9px] font-bold rounded transition-all cursor-pointer ${
                                    (activeStudioPlan.details_json?.show_slug_on_card ?? true)
                                      ? 'bg-teal-600 text-white shadow-2xs font-extrabold'
                                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                  }`}
                                >
                                  ON
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveStudioPlan({
                                      ...activeStudioPlan,
                                      details_json: {
                                        ...(activeStudioPlan.details_json || {}),
                                        show_slug_on_card: false,
                                      },
                                    });
                                    showToast('Slug badge hidden from card');
                                  }}
                                  className={`px-1.5 py-0.2 text-[9px] font-bold rounded transition-all cursor-pointer ${
                                    activeStudioPlan.details_json?.show_slug_on_card === false
                                      ? 'bg-zinc-600 text-white shadow-2xs font-extrabold'
                                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                  }`}
                                >
                                  OFF
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono font-bold">#</span>
                            <input
                              type="text"
                              value={activeStudioPlan.plan_key || ''}
                              onChange={(e) =>
                                setActiveStudioPlan({
                                  ...activeStudioPlan,
                                  plan_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                                })
                              }
                              placeholder="growth_pro"
                              className="w-full h-8.5 pl-6 pr-16 text-xs font-mono rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!activeStudioPlan.name) return;
                                const slug = activeStudioPlan.name
                                  .toLowerCase()
                                  .trim()
                                  .replace(/[^a-z0-9]+/g, '_')
                                  .replace(/^_+|_+$/g, '');
                                setActiveStudioPlan({ ...activeStudioPlan, plan_key: slug });
                                showToast(`Auto-slug: #${slug}`);
                              }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-teal-600 dark:text-teal-400 font-bold px-1.5 py-0.5 rounded hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer"
                            >
                              ⚡ Auto
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tagline Pitch */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Tagline / Pitch Headline
                        </label>
                        <Input
                          value={activeStudioPlan.tagline || ''}
                          onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, tagline: e.target.value })}
                          placeholder="e.g. High-throughput outbound sales & campaign dialers."
                          className="h-8.5 text-xs"
                          maxLength={100}
                        />
                        <p className="text-[10px] text-zinc-400">Shown directly beneath the plan title on the pricing table.</p>
                      </div>

                      {/* Audience & Icon & Glow */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Target Audience
                          </label>
                          <CustomSelect
                            value={activeStudioPlan.details_json?.target_category || 'For Growing Businesses'}
                            onChange={(val) =>
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  target_category: val,
                                },
                              })
                            }
                            options={TARGET_AUDIENCE_OPTIONS}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Header Icon
                          </label>
                          <CustomSelect
                            value={activeStudioPlan.badge_icon || activeStudioPlan.details_json?.plan_icon || 'Zap'}
                            onChange={(val) =>
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                badge_icon: val,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  plan_icon: val,
                                },
                              })
                            }
                            options={HEADER_ICON_OPTIONS}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Icon Color Glow
                          </label>
                          <CustomSelect
                            value={activeStudioPlan.details_json?.plan_icon_color || 'teal'}
                            onChange={(val) =>
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  plan_icon_color: val,
                                },
                              })
                            }
                            options={ICON_COLOR_PRESETS.map((ic) => ({ label: ic.label, value: ic.value }))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. ACCORDION BOX 2: PRICING & BILLING ENGINE */}
                <div className={`rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs transition-all ${openSections.pricing ? 'overflow-visible relative z-25' : 'overflow-hidden relative z-10'}`}>
                  <button
                    type="button"
                    onClick={() => toggleSection('pricing')}
                    className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-3 text-left hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-6 w-6 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-black border border-teal-500/20 shrink-0">
                        2
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                          <span>Pricing &amp; Billing Cycles</span>
                          {!openSections.pricing && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                              {isCustomQuote
                                ? 'Enterprise Quote'
                                : isFreeTier
                                ? 'Free $0'
                                : `${currencySymbol}${monthlyVal}/mo • Annual ${currencySymbol}${yearlyVal}/mo • Life ${currencySymbol}${lifetimeVal}`}
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate">
                          Set currency, pricing mode, and monthly / annual / lifetime rates
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-zinc-400 font-semibold hidden sm:inline">
                        {openSections.pricing ? 'Collapse' : 'Expand'}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
                          openSections.pricing ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {openSections.pricing && (
                    <div className="p-4 pt-2 space-y-3.5 border-t border-zinc-100 dark:border-zinc-800/80 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Billing Currency
                        </span>
                        <div className="w-56">
                          <CustomSelect
                            value={currencyCode}
                            onChange={(val) => {
                              const found = CURRENCY_PRESETS.find((c) => c.code === val) || CURRENCY_PRESETS[0];
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  currency_code: found.code,
                                  currency_symbol: found.symbol,
                                },
                              });
                              showToast(`Currency set to ${found.label}`);
                            }}
                            options={CURRENCY_PRESETS.map((c) => ({ label: c.label, value: c.code }))}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* 3 Visual Mode Cards */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Pricing Tier Model
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                monthly_price_usd: activeStudioPlan.monthly_price_usd || 49,
                                yearly_price_usd: activeStudioPlan.yearly_price_usd || 39,
                                lifetime_price_usd: activeStudioPlan.lifetime_price_usd || 499,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  is_custom_quote: false,
                                },
                              });
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              !isCustomQuote && !isFreeTier
                                ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-500 ring-2 ring-teal-500/20 shadow-2xs'
                                : 'bg-zinc-50/50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                            }`}
                          >
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <DollarSign className="h-3.5 w-3.5 text-teal-600" />
                              <span>Standard Paid Plan</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1">
                              Monthly &amp; discounted annual billing
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                monthly_price_usd: 0,
                                yearly_price_usd: 0,
                                lifetime_price_usd: 0,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  is_custom_quote: false,
                                },
                              });
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isFreeTier
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs'
                                : 'bg-zinc-50/50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                            }`}
                          >
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <Gift className="h-3.5 w-3.5 text-emerald-600" />
                              <span>100% Free Forever</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1">
                              {currencySymbol}0 • Instant access
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  is_custom_quote: true,
                                },
                              });
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isCustomQuote
                                ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/20 shadow-2xs'
                                : 'bg-zinc-50/50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                            }`}
                          >
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <Crown className="h-3.5 w-3.5 text-purple-600" />
                              <span>Enterprise Quote</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1">
                              Hide price • "Talk to Sales" CTA
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Standard Pricing Inputs: MONTHLY, ANNUAL, LIFETIME IN ONE ROW */}
                      {!isCustomQuote && !isFreeTier && (
                        <div className="space-y-3 pt-1">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                            {/* 1. Monthly Rate */}
                            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                Monthly Price ({currencySymbol})
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs font-mono">
                                  {currencySymbol}
                                </span>
                                <input
                                  type="number"
                                  value={activeStudioPlan.monthly_price_usd ?? 0}
                                  onChange={(e) =>
                                    setActiveStudioPlan({
                                      ...activeStudioPlan,
                                      monthly_price_usd: Number(e.target.value),
                                    })
                                  }
                                  placeholder="49"
                                  className="w-full h-8 pl-7 pr-2 text-xs font-bold font-mono rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                              </div>
                              <p className="text-[10px] text-zinc-400">Monthly recurring charge</p>
                            </div>

                            {/* 2. Annual Rate */}
                            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                  Annual Rate ({currencySymbol}/mo)
                                </label>
                                {previewAnnualSavings > 0 && (
                                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                                    Save {currencySymbol}{previewAnnualSavings}/yr
                                  </span>
                                )}
                              </div>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs font-mono">
                                  {currencySymbol}
                                </span>
                                <input
                                  type="number"
                                  value={activeStudioPlan.yearly_price_usd ?? 0}
                                  onChange={(e) =>
                                    setActiveStudioPlan({
                                      ...activeStudioPlan,
                                      yearly_price_usd: Number(e.target.value),
                                    })
                                  }
                                  placeholder="39"
                                  className="w-full h-8 pl-7 pr-2 text-xs font-bold font-mono rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                {[
                                  { label: '10%', pct: 10 },
                                  { label: '15%', pct: 15 },
                                  { label: '20%', pct: 20 },
                                  { label: '25%', pct: 25 },
                                ].map((d) => (
                                  <button
                                    key={d.pct}
                                    type="button"
                                    onClick={() => {
                                      const base = activeStudioPlan.monthly_price_usd || 49;
                                      setActiveStudioPlan({
                                        ...activeStudioPlan,
                                        yearly_price_usd: Math.round(base * (1 - d.pct / 100)),
                                      });
                                    }}
                                    className="px-1 py-0.2 text-[9px] font-bold rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                                  >
                                    {d.label}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const base = activeStudioPlan.monthly_price_usd || 49;
                                    setActiveStudioPlan({
                                      ...activeStudioPlan,
                                      yearly_price_usd: Math.round((base * 10) / 12),
                                    });
                                  }}
                                  className="px-1 py-0.2 text-[9px] font-bold rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                                >
                                  2Mo Free
                                </button>
                              </div>
                            </div>

                            {/* 3. Lifetime Perpetual Rate */}
                            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                  Lifetime Price ({currencySymbol})
                                </label>
                                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                                  One-Time
                                </span>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs font-mono">
                                  {currencySymbol}
                                </span>
                                <input
                                  type="number"
                                  value={activeStudioPlan.lifetime_price_usd ?? 0}
                                  onChange={(e) =>
                                    setActiveStudioPlan({
                                      ...activeStudioPlan,
                                      lifetime_price_usd: Number(e.target.value),
                                    })
                                  }
                                  placeholder="499"
                                  className="w-full h-8 pl-7 pr-2 text-xs font-bold font-mono rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </div>
                              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                {[
                                  { label: '8x Mo', mul: 8 },
                                  { label: '10x Mo', mul: 10 },
                                  { label: '12x Mo', mul: 12 },
                                ].map((m) => (
                                  <button
                                    key={m.mul}
                                    type="button"
                                    onClick={() => {
                                      const base = activeStudioPlan.monthly_price_usd || 49;
                                      setActiveStudioPlan({
                                        ...activeStudioPlan,
                                        lifetime_price_usd: base * m.mul,
                                      });
                                    }}
                                    className="px-1 py-0.2 text-[9px] font-bold rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-600 hover:text-white transition-colors cursor-pointer"
                                  >
                                    {m.label}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveStudioPlan({
                                      ...activeStudioPlan,
                                      lifetime_price_usd: 0,
                                    });
                                  }}
                                  className="px-1 py-0.2 text-[9px] font-bold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 transition-colors cursor-pointer"
                                >
                                  $0
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Pricing Subtext & Tax Terms */}
                          <div className="space-y-1 pt-1">
                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              Pricing Terms / Tax Subtext
                            </label>
                            <input
                              type="text"
                              value={activeStudioPlan.sub_billing_text || activeStudioPlan.details_json?.sub_billing_text || ''}
                              onChange={(e) =>
                                setActiveStudioPlan({
                                  ...activeStudioPlan,
                                  sub_billing_text: e.target.value,
                                  details_json: {
                                    ...(activeStudioPlan.details_json || {}),
                                    sub_billing_text: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. Billed monthly in USD • Cancel anytime • + Applicable Taxes"
                              className="w-full h-8 px-2.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                        </div>
                      )}

                      {isCustomQuote && (
                        <div className="p-3 rounded-lg bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-300">
                          ℹ️ <strong>Enterprise Quote Mode:</strong> Numerical pricing will be hidden on public storefronts. Instead, visitors will see a <strong>"Talk to Enterprise Sales"</strong> contact button.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. ACCORDION BOX 3: ONBOARDING TRIAL & STOREFRONT VISIBILITY */}
                <div className={`rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs transition-all ${openSections.trial ? 'overflow-visible relative z-20' : 'overflow-hidden relative z-10'}`}>
                  <button
                    type="button"
                    onClick={() => toggleSection('trial')}
                    className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-3 text-left hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-6 w-6 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-black border border-teal-500/20 shrink-0">
                        3
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                          <span>Free Trial &amp; Catalog Visibility</span>
                          {!openSections.trial && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                              {trialDays === '0' ? 'No Trial' : `${trialDays}-Day Free Trial`} • Order #{activeStudioPlan.sort_order ?? 1} • {activeStudioPlan.is_active !== false ? 'Live' : 'Hidden'}
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate">
                          Set evaluation trial duration, order position and enable storefront purchasing
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-zinc-400 font-semibold hidden sm:inline">
                        {openSections.trial ? 'Collapse' : 'Expand'}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
                          openSections.trial ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {openSections.trial && (
                    <div className="p-4 pt-2 space-y-3.5 border-t border-zinc-100 dark:border-zinc-800/80 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                        {/* Trial Presets + Custom Days Input */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Free Trial Duration Mode
                          </label>
                          <CustomSelect
                            value={
                              ['0', '3', '7', '14', '30', '60'].includes(activeStudioPlan.details_json?.trial_days || '0')
                                ? (activeStudioPlan.details_json?.trial_days || '0')
                                : 'custom'
                            }
                            onChange={(val) => {
                              if (val === 'custom') {
                                setActiveStudioPlan({
                                  ...activeStudioPlan,
                                  details_json: {
                                    ...(activeStudioPlan.details_json || {}),
                                    trial_days: activeStudioPlan.details_json?.trial_days === '0' ? '21' : (activeStudioPlan.details_json?.trial_days || '21'),
                                  },
                                });
                              } else {
                                setActiveStudioPlan({
                                  ...activeStudioPlan,
                                  details_json: {
                                    ...(activeStudioPlan.details_json || {}),
                                    trial_days: val,
                                  },
                                });
                              }
                            }}
                            options={TRIAL_PRESET_OPTIONS}
                            className="w-full"
                          />

                          {/* Custom Trial Days Direct Numerical Editor */}
                          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                                Custom Trial Duration:
                              </span>
                              <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">
                                {trialDays === '0' ? 'Disabled (0d)' : `${trialDays} Days Free`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={365}
                                value={Number(activeStudioPlan.details_json?.trial_days || 0)}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value));
                                  setActiveStudioPlan({
                                    ...activeStudioPlan,
                                    details_json: {
                                      ...(activeStudioPlan.details_json || {}),
                                      trial_days: String(val),
                                    },
                                  });
                                }}
                                placeholder="14"
                                className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                              <span className="text-xs font-semibold text-zinc-400 shrink-0">Days</span>
                            </div>

                            {/* Quick Presets Pills */}
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {[
                                { label: '0d (No Trial)', days: 0 },
                                { label: '3d', days: 3 },
                                { label: '7d', days: 7 },
                                { label: '14d', days: 14 },
                                { label: '21d', days: 21 },
                                { label: '30d', days: 30 },
                                { label: '45d', days: 45 },
                                { label: '60d', days: 60 },
                                { label: '90d', days: 90 },
                              ].map((p) => (
                                <button
                                  key={p.days}
                                  type="button"
                                  onClick={() =>
                                    setActiveStudioPlan({
                                      ...activeStudioPlan,
                                      details_json: {
                                        ...(activeStudioPlan.details_json || {}),
                                        trial_days: String(p.days),
                                      },
                                    })
                                  }
                                  className={`px-1.5 py-0.5 text-[9px] font-bold font-mono rounded transition-colors cursor-pointer border ${
                                    Number(activeStudioPlan.details_json?.trial_days ?? 0) === p.days
                                      ? 'bg-teal-600 text-white border-teal-600'
                                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                  }`}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Catalog Position & Trial CC Policy */}
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              Catalog Position Order
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveStudioPlan({
                                    ...activeStudioPlan,
                                    sort_order: Math.max(1, (activeStudioPlan.sort_order ?? 1) - 1),
                                  })
                                }
                                className="h-8.5 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={activeStudioPlan.sort_order ?? 1}
                                onChange={(e) =>
                                  setActiveStudioPlan({ ...activeStudioPlan, sort_order: Number(e.target.value) })
                                }
                                className="w-full h-8.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono text-center focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveStudioPlan({
                                    ...activeStudioPlan,
                                    sort_order: (activeStudioPlan.sort_order ?? 1) + 1,
                                  })
                                }
                                className="h-8.5 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Trial Credit Card Required Policy Card */}
                          <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1">
                            <label className="flex items-center justify-between cursor-pointer">
                              <div>
                                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                  <CreditCard className="h-3.5 w-3.5 text-teal-600" />
                                  <span>Require Card for Trial</span>
                                </div>
                                <div className="text-[10px] text-zinc-500">
                                  {activeStudioPlan.details_json?.trial_requires_cc ? 'Card saved for auto-renewal after trial' : 'No credit card required upfront'}
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={Boolean(activeStudioPlan.details_json?.trial_requires_cc)}
                                onChange={(e) =>
                                  setActiveStudioPlan({
                                    ...activeStudioPlan,
                                    details_json: {
                                      ...(activeStudioPlan.details_json || {}),
                                      trial_requires_cc: e.target.checked,
                                    },
                                  })
                                }
                                className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Storefront Switches */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <label className="flex items-center justify-between p-3 rounded-xl border bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-100/60 transition-colors">
                          <div>
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Live in Storefront</div>
                            <div className="text-[10px] text-zinc-500">Allow customers to buy this plan</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={activeStudioPlan.is_active !== false}
                            onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, is_active: e.target.checked })}
                            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-xl border bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-100/60 transition-colors">
                          <div>
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Featured (Popular)</div>
                            <div className="text-[10px] text-zinc-500">Display recommended badge</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(activeStudioPlan.popular)}
                            onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, popular: e.target.checked })}
                            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. ACCORDION BOX 4: CHECKOUT ROUTING & PROVISIONING FEES */}
                <div className={`rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs transition-all ${openSections.advanced ? 'overflow-visible relative z-15' : 'overflow-hidden relative z-10'}`}>
                  <button
                    type="button"
                    onClick={() => toggleSection('advanced')}
                    className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-3 text-left hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-6 w-6 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-black border border-teal-500/20 shrink-0">
                        4
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                          <span>Checkout Routing &amp; Provisioning Fees</span>
                          {!openSections.advanced && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                              {activeStudioPlan.cta_link ? 'External Payment Link' : 'In-App Native Checkout'} • {setupFee > 0 ? (isSetupFeeWaived ? `Setup: ${currencySymbol}${setupFee} (Waived)` : `Setup: ${currencySymbol}${setupFee}`) : 'Setup: Free ($0)'}
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate">
                          Configure customer checkout destination (In-App vs External Payment Link) and one-time setup fees
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-zinc-400 font-semibold hidden sm:inline">
                        {openSections.advanced ? 'Collapse' : 'Expand'}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
                          openSections.advanced ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {openSections.advanced && (
                    <div className="p-4 pt-2 space-y-4 border-t border-zinc-100 dark:border-zinc-800/80 animate-in fade-in duration-150">
                      {/* Sub-Section 1: Checkout Gateway & Destination */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            1. Customer Checkout Destination
                          </label>
                          <span className="text-[10px] text-zinc-400">Where should customers go when clicking "Select Plan"?</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Mode A: In-App Native Checkout */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                cta_link: '',
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  cta_link: '',
                                },
                              });
                              showToast('Using In-App Native Checkout');
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              !activeStudioPlan.cta_link
                                ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-500 ring-2 ring-teal-500/20 shadow-2xs'
                                : 'bg-zinc-50/50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5 text-teal-600" />
                                <span>In-App Native Checkout</span>
                              </div>
                              {!activeStudioPlan.cta_link && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-600 text-white">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                              Customers checkout directly inside Create Call OS using Card simulator or configured Stripe Elements.
                            </p>
                          </button>

                          {/* Mode B: External Payment Gateway Link */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!activeStudioPlan.cta_link) {
                                setActiveStudioPlan({
                                  ...activeStudioPlan,
                                  cta_link: 'https://buy.stripe.com/test_sample_checkout',
                                  details_json: {
                                    ...(activeStudioPlan.details_json || {}),
                                    cta_link: 'https://buy.stripe.com/test_sample_checkout',
                                  },
                                });
                              }
                              showToast('Switched to External Payment Link Mode');
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              activeStudioPlan.cta_link
                                ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs'
                                : 'bg-zinc-50/50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <ExternalLink className="h-3.5 w-3.5 text-indigo-600" />
                                <span>External Payment Link</span>
                              </div>
                              {activeStudioPlan.cta_link && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-600 text-white">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                              Redirects user to an external Stripe Payment Link, LemonSqueezy, or custom portal when clicking CTA.
                            </p>
                          </button>
                        </div>

                        {/* External Payment Link Input Box */}
                        {activeStudioPlan.cta_link && (
                          <div className="p-3 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 space-y-2 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200">
                                External Checkout URL <span className="text-rose-500">*</span>
                              </label>
                              <div className="flex items-center gap-2">
                                <a
                                  href={activeStudioPlan.cta_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                                >
                                  <span>🔗 Test / Open URL</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveStudioPlan({
                                      ...activeStudioPlan,
                                      cta_link: '',
                                      details_json: {
                                        ...(activeStudioPlan.details_json || {}),
                                        cta_link: '',
                                      },
                                    });
                                    showToast('Reset to In-App Checkout');
                                  }}
                                  className="text-[10px] text-zinc-400 hover:text-rose-500 font-semibold cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            <input
                              type="url"
                              value={activeStudioPlan.cta_link || ''}
                              onChange={(e) =>
                                setActiveStudioPlan({
                                  ...activeStudioPlan,
                                  cta_link: e.target.value,
                                  details_json: {
                                    ...(activeStudioPlan.details_json || {}),
                                    cta_link: e.target.value,
                                  },
                                })
                              }
                              placeholder="https://buy.stripe.com/test_123456789"
                              className="w-full h-8.5 px-2.5 text-xs font-mono rounded-lg bg-white dark:bg-zinc-900 border border-indigo-300 dark:border-indigo-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80">
                              ℹ️ Visitors clicking the CTA button in public storefronts will be redirected directly to this address.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Sub-Section 2: One-Time Provisioning / Setup Fee */}
                      <div className="space-y-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                              2. One-Time Setup &amp; Activation Fee
                            </label>
                            <p className="text-[10px] text-zinc-400">
                              Charged only once on the first invoice. Renewals bill at regular rate.
                            </p>
                          </div>
                          <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-300">
                            {setupFee === 0 ? 'Free ($0)' : `${currencySymbol}${setupFee}`}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 items-start">
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                              Setup Fee Amount ({currencySymbol})
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs font-mono">
                                {currencySymbol}
                              </span>
                              <input
                                type="number"
                                value={activeStudioPlan.details_json?.setup_fee_usd ?? 0}
                                onChange={(e) =>
                                  setActiveStudioPlan({
                                    ...activeStudioPlan,
                                    details_json: {
                                      ...(activeStudioPlan.details_json || {}),
                                      setup_fee_usd: Number(e.target.value),
                                    },
                                  })
                                }
                                placeholder="0"
                                className="w-full h-8 pl-7 pr-2 text-xs font-bold font-mono rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                            </div>

                            {/* Presets */}
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {[
                                { label: 'Free $0', val: 0 },
                                { label: '$29', val: 29 },
                                { label: '$49', val: 49 },
                                { label: '$99', val: 99 },
                                { label: '$199', val: 199 },
                              ].map((preset) => (
                                <button
                                  key={preset.val}
                                  type="button"
                                  onClick={() =>
                                    setActiveStudioPlan({
                                      ...activeStudioPlan,
                                      details_json: {
                                        ...(activeStudioPlan.details_json || {}),
                                        setup_fee_usd: preset.val,
                                      },
                                    })
                                  }
                                  className={`px-1.5 py-0.2 text-[9px] font-bold rounded transition-colors cursor-pointer border ${
                                    setupFee === preset.val
                                      ? 'bg-teal-600 text-white border-teal-600'
                                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Waiver Promo Toggle */}
                          <div className="space-y-1.5 pt-0.5">
                            <label className="flex items-center justify-between p-2.5 rounded-lg border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-teal-500 transition-colors">
                              <div>
                                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>Waive Setup Fee Promo</span>
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">
                                  Displays strikethrough FREE badge
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={Boolean(activeStudioPlan.details_json?.is_setup_fee_waived)}
                                onChange={(e) =>
                                  setActiveStudioPlan({
                                    ...activeStudioPlan,
                                    details_json: {
                                      ...(activeStudioPlan.details_json || {}),
                                      is_setup_fee_waived: e.target.checked,
                                    },
                                  })
                                }
                                className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                              />
                            </label>
                            <p className="text-[9px] text-zinc-400 leading-relaxed px-1">
                              When enabled, visitors see: <span className="line-through text-zinc-500 font-mono">${setupFee || 49}</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">FREE PROMO</span>.
                            </p>
                          </div>
                        </div>

                        {/* Customer First Invoice Breakdown Summary */}
                        <div className="p-3 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
                          <div className="space-y-0.5">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">
                              First Billing Invoice: {currencySymbol}{monthlyVal + (isSetupFeeWaived ? 0 : setupFee)}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              Includes base plan ({currencySymbol}{monthlyVal}) + setup ({isSetupFeeWaived ? 'Waived Free' : `${currencySymbol}${setupFee}`})
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-bold uppercase text-zinc-400">Renewals</div>
                            <div className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                              {currencySymbol}{monthlyVal}/mo
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: TELEPHONY LIMITS & QUOTAS */}
            {studioTab === 'telephony' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Header Summary Banner */}
                <div className="flex items-center justify-between p-2.5 px-3 rounded-lg bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <Radio className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        Telephony Engine Quotas &amp; Carrier Allocations
                      </h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        Configure voice minutes, concurrent SIP trunks, vector memory, phone lines &amp; carrier capabilities.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-800 text-teal-700 dark:text-teal-300 border border-zinc-200 dark:border-zinc-700 shrink-0 whitespace-nowrap">
                    Live Sync Active
                  </span>
                </div>

                {/* 5 Core Quota Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* CARD 1: Voice Minutes Quota */}
                  <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 space-y-2.5">
                    {/* Header: Strict Single Line */}
                    <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-zinc-100 min-w-0">
                        <PhoneCall className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="truncate">Voice Minutes Quota</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/25 shrink-0 whitespace-nowrap">
                        {activeStudioPlan.details_json?.is_unlimited_minutes
                          ? 'Unlimited Minutes'
                          : `${(activeStudioPlan.included_minutes || 0).toLocaleString()} Mins`}
                      </span>
                    </div>

                    {/* Pre-configured Dropdown */}
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Pre-configured Allocation Preset</label>
                      <CustomSelect
                        value={
                          activeStudioPlan.details_json?.is_unlimited_minutes
                            ? 'unlimited'
                            : [500, 1000, 3000, 5000, 10000, 25000, 50000, 100000].includes(activeStudioPlan.included_minutes || 0)
                            ? String(activeStudioPlan.included_minutes)
                            : 'custom'
                        }
                        onChange={(val) => {
                          if (val === 'unlimited') {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              included_minutes: 0,
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_minutes: true },
                            });
                          } else if (val === 'custom') {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_minutes: false },
                            });
                          } else {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              included_minutes: Number(val),
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_minutes: false },
                            });
                          }
                        }}
                        options={VOICE_MINUTES_PRESET_OPTIONS}
                        size="xs"
                        className="w-full"
                      />
                    </div>

                    {/* Exact Numeric & Custom Label (2 cols) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Exact Allocation (Mins)</label>
                        <input
                          type="number"
                          disabled={Boolean(activeStudioPlan.details_json?.is_unlimited_minutes)}
                          value={activeStudioPlan.details_json?.is_unlimited_minutes ? '' : (activeStudioPlan.included_minutes ?? 0)}
                          placeholder={activeStudioPlan.details_json?.is_unlimited_minutes ? 'Unlimited' : '0'}
                          onChange={(e) =>
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              included_minutes: Math.max(0, Number(e.target.value)),
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_minutes: false },
                            })
                          }
                          className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Display Label</label>
                        <input
                          type="text"
                          value={activeStudioPlan.voice_minutes_label || 'Voice Minutes:'}
                          onChange={(e) =>
                            setActiveStudioPlan({ ...activeStudioPlan, voice_minutes_label: e.target.value })
                          }
                          placeholder="e.g. Voice Minutes:"
                          className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* Overage & Rollover Settings (Single Line) */}
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between gap-2 text-[10px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-zinc-500 font-medium shrink-0 whitespace-nowrap">Overage ($/min):</span>
                        <input
                          type="number"
                          step="0.005"
                          placeholder="0.02"
                          value={activeStudioPlan.details_json?.overage_rate_per_min ?? '0.02'}
                          onChange={(e) =>
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              details_json: { ...(activeStudioPlan.details_json || {}), overage_rate_per_min: e.target.value },
                            })
                          }
                          className="w-16 h-6 px-1.5 text-xs rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-center focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300 shrink-0 whitespace-nowrap select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(activeStudioPlan.details_json?.rollover_minutes)}
                          onChange={(e) =>
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              details_json: { ...(activeStudioPlan.details_json || {}), rollover_minutes: e.target.checked },
                            })
                          }
                          className="rounded border-zinc-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="text-[10px] font-medium">Rollover unused</span>
                      </label>
                    </div>
                  </div>

                  {/* CARD 2: Live Concurrency */}
                  <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 space-y-2.5">
                    {/* Header: Strict Single Line */}
                    <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-zinc-100 min-w-0">
                        <Radio className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">Live Call Concurrency</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shrink-0 whitespace-nowrap">
                        {activeStudioPlan.details_json?.is_unlimited_concurrency
                          ? 'Uncapped Trunks'
                          : `${activeStudioPlan.concurrency_limit || 0} Trunks`}
                      </span>
                    </div>

                    {/* Pre-configured Dropdown */}
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Concurrent Channels Tier</label>
                      <CustomSelect
                        value={
                          activeStudioPlan.details_json?.is_unlimited_concurrency
                            ? 'unlimited'
                            : [1, 2, 5, 10, 15, 30, 50, 100, 250].includes(activeStudioPlan.concurrency_limit || 0)
                            ? String(activeStudioPlan.concurrency_limit)
                            : 'custom'
                        }
                        onChange={(val) => {
                          if (val === 'unlimited') {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              concurrency_limit: 0,
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_concurrency: true },
                            });
                          } else if (val === 'custom') {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_concurrency: false },
                            });
                          } else {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              concurrency_limit: Number(val),
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_concurrency: false },
                            });
                          }
                        }}
                        options={CONCURRENCY_PRESET_OPTIONS}
                        size="xs"
                        className="w-full"
                      />
                    </div>

                    {/* Exact Numeric & Custom Label (2 cols) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Trunk Capacity</label>
                        <input
                          type="number"
                          disabled={Boolean(activeStudioPlan.details_json?.is_unlimited_concurrency)}
                          value={activeStudioPlan.details_json?.is_unlimited_concurrency ? '' : (activeStudioPlan.concurrency_limit ?? 0)}
                          placeholder={activeStudioPlan.details_json?.is_unlimited_concurrency ? 'Uncapped' : '0'}
                          onChange={(e) =>
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              concurrency_limit: Math.max(0, Number(e.target.value)),
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_concurrency: false },
                            })
                          }
                          className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Display Label</label>
                        <input
                          type="text"
                          value={activeStudioPlan.concurrency_label || 'Live Concurrency:'}
                          onChange={(e) =>
                            setActiveStudioPlan({ ...activeStudioPlan, concurrency_label: e.target.value })
                          }
                          placeholder="e.g. Live Concurrency:"
                          className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* Spike Burst Setting (Single Line) */}
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between gap-2 text-[10px]">
                      <span className="text-zinc-500 font-medium shrink-0 whitespace-nowrap">Auto-Scale Spike Burst:</span>
                      <input
                        type="text"
                        placeholder="+5 Channels Peak"
                        value={activeStudioPlan.details_json?.burst_channels_allowed || '+5 Channels Peak'}
                        onChange={(e) =>
                          setActiveStudioPlan({
                            ...activeStudioPlan,
                            details_json: { ...(activeStudioPlan.details_json || {}), burst_channels_allowed: e.target.value },
                          })
                        }
                        className="w-36 h-6 px-2 text-xs rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* CARD 3: RAG Storage */}
                  <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 space-y-2.5">
                    {/* Header: Strict Single Line */}
                    <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-zinc-100 min-w-0">
                        <HardDrive className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="truncate">RAG Vector DB Storage</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 shrink-0 whitespace-nowrap">
                        {activeStudioPlan.details_json?.is_unlimited_rag
                          ? 'Unlimited DB'
                          : `${activeStudioPlan.rag_storage_mb || 0} MB`}
                      </span>
                    </div>

                    {/* Pre-configured Dropdown */}
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Vector Memory Allocation</label>
                      <CustomSelect
                        value={
                          activeStudioPlan.details_json?.is_unlimited_rag
                            ? 'unlimited'
                            : [100, 250, 500, 1000, 2000, 5000, 10000, 50000].includes(activeStudioPlan.rag_storage_mb || 0)
                            ? String(activeStudioPlan.rag_storage_mb)
                            : 'custom'
                        }
                        onChange={(val) => {
                          if (val === 'unlimited') {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              rag_storage_mb: 0,
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_rag: true },
                            });
                          } else if (val === 'custom') {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_rag: false },
                            });
                          } else {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              rag_storage_mb: Number(val),
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_rag: false },
                            });
                          }
                        }}
                        options={RAG_STORAGE_PRESET_OPTIONS}
                        size="xs"
                        className="w-full"
                      />
                    </div>

                    {/* Exact Numeric & Custom Label (2 cols) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Storage (MB)</label>
                        <input
                          type="number"
                          disabled={Boolean(activeStudioPlan.details_json?.is_unlimited_rag)}
                          value={activeStudioPlan.details_json?.is_unlimited_rag ? '' : (activeStudioPlan.rag_storage_mb ?? 0)}
                          placeholder={activeStudioPlan.details_json?.is_unlimited_rag ? 'Unlimited' : '0'}
                          onChange={(e) =>
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              rag_storage_mb: Math.max(0, Number(e.target.value)),
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_rag: false },
                            })
                          }
                          className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Display Label</label>
                        <input
                          type="text"
                          value={activeStudioPlan.rag_label || 'RAG Vector DB:'}
                          onChange={(e) =>
                            setActiveStudioPlan({ ...activeStudioPlan, rag_label: e.target.value })
                          }
                          placeholder="e.g. RAG Vector DB:"
                          className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* Capacity Indicator (Single Line) */}
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[10px] whitespace-nowrap">
                      <span className="text-zinc-500 font-medium">Vector Capacity:</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                        {activeStudioPlan.details_json?.is_unlimited_rag
                          ? 'Infinite documents & embeddings'
                          : `≈ ${((activeStudioPlan.rag_storage_mb || 200) * 50).toLocaleString()} PDF/doc pages`}
                      </span>
                    </div>
                  </div>

                  {/* CARD 4: Max AI Voice Agents */}
                  <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 space-y-2.5">
                    {/* Header: Strict Single Line */}
                    <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-zinc-100 min-w-0">
                        <Bot className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span className="truncate">Max AI Voice Agents</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 shrink-0 whitespace-nowrap">
                        {activeStudioPlan.details_json?.is_unlimited_agents || activeStudioPlan.max_agents_count === 0
                          ? 'Unlimited Bots'
                          : `${activeStudioPlan.max_agents_count} Bots`}
                      </span>
                    </div>

                    {/* Pre-configured Dropdown */}
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Active Bot Deployments</label>
                      <CustomSelect
                        value={
                          activeStudioPlan.details_json?.is_unlimited_agents || activeStudioPlan.max_agents_count === 0
                            ? 'unlimited'
                            : [1, 2, 5, 10, 25, 50, 100].includes(activeStudioPlan.max_agents_count || 0)
                            ? String(activeStudioPlan.max_agents_count)
                            : 'custom'
                        }
                        onChange={(val) => {
                          if (val === 'unlimited') {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              max_agents_count: 0,
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_agents: true },
                            });
                          } else if (val === 'custom') {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_agents: false },
                            });
                          } else {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              max_agents_count: Number(val),
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_agents: false },
                            });
                          }
                        }}
                        options={AGENTS_COUNT_PRESET_OPTIONS}
                        size="xs"
                        className="w-full"
                      />
                    </div>

                    {/* Exact Numeric & Custom Label (2 cols) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Bot Count</label>
                        <input
                          type="number"
                          disabled={Boolean(activeStudioPlan.details_json?.is_unlimited_agents) || activeStudioPlan.max_agents_count === 0}
                          value={
                            activeStudioPlan.details_json?.is_unlimited_agents || activeStudioPlan.max_agents_count === 0
                              ? ''
                              : (activeStudioPlan.max_agents_count ?? 0)
                          }
                          placeholder={activeStudioPlan.details_json?.is_unlimited_agents || activeStudioPlan.max_agents_count === 0 ? 'Unlimited' : '0'}
                          onChange={(e) =>
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              max_agents_count: Math.max(0, Number(e.target.value)),
                              details_json: { ...(activeStudioPlan.details_json || {}), is_unlimited_agents: false },
                            })
                          }
                          className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Display Label</label>
                        <input
                          type="text"
                          value={activeStudioPlan.bots_label || 'AI Voice Bots:'}
                          onChange={(e) =>
                            setActiveStudioPlan({ ...activeStudioPlan, bots_label: e.target.value })
                          }
                          placeholder="e.g. AI Voice Bots:"
                          className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* Swarm Indicator (Single Line) */}
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[10px] whitespace-nowrap">
                      <span className="text-zinc-500 font-medium">Multi-Agent Swarm:</span>
                      <span className="text-purple-600 dark:text-purple-400 font-semibold truncate">
                        Sub-agent transfers enabled
                      </span>
                    </div>
                  </div>

                  {/* CARD 5 (Span 2 cols): Dedicated DID Phone Numbers */}
                  <div className="sm:col-span-2 p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 space-y-2.5">
                    {/* Header: Strict Single Line */}
                    <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-zinc-100 min-w-0">
                        <Globe className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="truncate">Dedicated Inbound / Outbound DID Phone Numbers</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 shrink-0 whitespace-nowrap">
                        {activeStudioPlan.details_json?.is_unlimited_phone_numbers
                          ? 'Unlimited DIDs'
                          : activeStudioPlan.details_json?.phone_numbers_included
                          ? `${activeStudioPlan.details_json?.phone_numbers_included} Included`
                          : '0 (BYON Only)'}
                      </span>
                    </div>

                    {/* Pre-configured Dropdown */}
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Phone Numbers Allocation Preset</label>
                      <CustomSelect
                        value={
                          activeStudioPlan.details_json?.is_unlimited_phone_numbers
                            ? 'unlimited'
                            : [0, 1, 2, 5, 10].includes(activeStudioPlan.details_json?.phone_numbers_included ?? 0)
                            ? String(activeStudioPlan.details_json?.phone_numbers_included ?? 0)
                            : 'custom'
                        }
                        onChange={(val) => {
                          if (val === 'unlimited') {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              details_json: {
                                ...(activeStudioPlan.details_json || {}),
                                is_unlimited_phone_numbers: true,
                                phone_numbers_included: 0,
                              },
                            });
                          } else if (val === 'custom') {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              details_json: {
                                ...(activeStudioPlan.details_json || {}),
                                is_unlimited_phone_numbers: false,
                              },
                            });
                          } else {
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              details_json: {
                                ...(activeStudioPlan.details_json || {}),
                                is_unlimited_phone_numbers: false,
                                phone_numbers_included: Number(val),
                              },
                            });
                          }
                        }}
                        options={PHONE_NUMBERS_PRESET_OPTIONS}
                        size="xs"
                        className="w-full"
                      />
                    </div>

                    {/* Exact Numeric & Custom Label (2 cols) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">
                          Included Numbers Count (0 = BYON)
                        </label>
                        <input
                          type="number"
                          disabled={Boolean(activeStudioPlan.details_json?.is_unlimited_phone_numbers)}
                          value={
                            activeStudioPlan.details_json?.is_unlimited_phone_numbers
                              ? ''
                              : (activeStudioPlan.details_json?.phone_numbers_included ?? 0)
                          }
                          placeholder={activeStudioPlan.details_json?.is_unlimited_phone_numbers ? 'Unlimited' : '0'}
                          onChange={(e) =>
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              details_json: {
                                ...(activeStudioPlan.details_json || {}),
                                phone_numbers_included: Math.max(0, Number(e.target.value)),
                                is_unlimited_phone_numbers: false,
                              },
                            })
                          }
                          className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Display Label</label>
                        <input
                          type="text"
                          value={activeStudioPlan.details_json?.phone_numbers_label || 'Dedicated DID Lines:'}
                          onChange={(e) =>
                            setActiveStudioPlan({
                              ...activeStudioPlan,
                              details_json: {
                                ...(activeStudioPlan.details_json || {}),
                                phone_numbers_label: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. Dedicated DID Lines:"
                          className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Carrier & Platform Capabilities (4 Interactive Cards) */}
                <div className="space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <span>Carrier &amp; Platform Capabilities</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                        {activeCapabilityCount}/4 Active
                      </span>
                    </h5>
                    <span className="text-[9px] text-zinc-400">Entitlement Badges &amp; Quick Presets</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Capability 1: Android GSM Gateway */}
                    <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Smartphone className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            Android GSM Multi-SIM Gateway
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={activeStudioPlan.gsm_sim_enabled !== false}
                            onChange={(e) =>
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                gsm_sim_enabled: e.target.checked,
                                gsm_label: e.target.checked ? (activeStudioPlan.gsm_label || 'Included') : 'Not Included',
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        Direct local SIM routing with zero per-minute telecom markup
                      </p>

                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Entitlement Preset</label>
                        <CustomSelect
                          value={
                            CARRIER_GSM_OPTIONS.some((o) => o.value === activeStudioPlan.gsm_label)
                              ? (activeStudioPlan.gsm_label || 'Included')
                              : 'custom'
                          }
                          onChange={(val) => {
                            if (val !== 'custom') {
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                gsm_sim_enabled: val !== 'Not Included',
                                gsm_label: val,
                              });
                            }
                          }}
                          options={CARRIER_GSM_OPTIONS}
                          size="xs"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Custom Display Badge Label</label>
                        <input
                          type="text"
                          value={activeStudioPlan.gsm_label || (activeStudioPlan.gsm_sim_enabled ? 'Included' : 'Not Included')}
                          onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, gsm_label: e.target.value })}
                          placeholder="e.g. Included (Multi-SIM)"
                          className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* Capability 2: Custom Voice Cloning */}
                    <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0">
                            <Sparkles className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            Custom Voice Cloning Engine
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={activeStudioPlan.voice_cloning_enabled !== false}
                            onChange={(e) =>
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                voice_cloning_enabled: e.target.checked,
                                voice_cloning_label: e.target.checked ? (activeStudioPlan.voice_cloning_label || 'Studio Grade') : 'Basic TTS',
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-zinc-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        Instant zero-shot neural voice clone with custom emotional inflection
                      </p>

                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Voice Synthesis Tier</label>
                        <CustomSelect
                          value={
                            CARRIER_VOICE_CLONING_OPTIONS.some((o) => o.value === activeStudioPlan.voice_cloning_label)
                              ? (activeStudioPlan.voice_cloning_label || 'Studio Grade')
                              : 'custom'
                          }
                          onChange={(val) => {
                            if (val !== 'custom') {
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                voice_cloning_enabled: val !== 'Basic TTS',
                                voice_cloning_label: val,
                              });
                            }
                          }}
                          options={CARRIER_VOICE_CLONING_OPTIONS}
                          size="xs"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Custom Display Badge Label</label>
                        <input
                          type="text"
                          value={activeStudioPlan.voice_cloning_label || (activeStudioPlan.voice_cloning_enabled ? 'Studio Grade' : 'Basic TTS')}
                          onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, voice_cloning_label: e.target.value })}
                          placeholder="e.g. Ultra HD Neural"
                          className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* Capability 3: Webhooks & REST API */}
                    <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
                            <Server className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            Enterprise Webhooks &amp; REST API
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={activeStudioPlan.webhook_api_enabled !== false}
                            onChange={(e) =>
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                webhook_api_enabled: e.target.checked,
                                webhook_label: e.target.checked ? (activeStudioPlan.webhook_label || 'Enterprise') : 'Not Included',
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        Real-time bi-directional events, transcript streaming &amp; CRM dispatch
                      </p>

                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">API Throughput Tier</label>
                        <CustomSelect
                          value={
                            CARRIER_WEBHOOK_OPTIONS.some((o) => o.value === activeStudioPlan.webhook_label)
                              ? (activeStudioPlan.webhook_label || 'Enterprise')
                              : 'custom'
                          }
                          onChange={(val) => {
                            if (val !== 'custom') {
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                webhook_api_enabled: val !== 'Not Included',
                                webhook_label: val,
                              });
                            }
                          }}
                          options={CARRIER_WEBHOOK_OPTIONS}
                          size="xs"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Custom Display Badge Label</label>
                        <input
                          type="text"
                          value={activeStudioPlan.webhook_label || (activeStudioPlan.webhook_api_enabled ? 'Enterprise' : 'Not Included')}
                          onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, webhook_label: e.target.value })}
                          placeholder="e.g. Enterprise High-Speed"
                          className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                        />
                      </div>

                      {/* API Keys Quota & Rate Limit Settings */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Max API Keys</label>
                          <input
                            type="number"
                            min="1"
                            value={activeStudioPlan.details_json?.max_api_keys ?? (activeStudioPlan.webhook_api_enabled ? 5 : 1)}
                            onChange={(e) =>
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  max_api_keys: Math.max(1, Number(e.target.value)),
                                },
                              })
                            }
                            className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-center focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Rate Limit (rpm)</label>
                          <input
                            type="number"
                            min="10"
                            value={activeStudioPlan.details_json?.api_rate_limit_per_min ?? (activeStudioPlan.webhook_api_enabled ? 300 : 60)}
                            onChange={(e) =>
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  api_rate_limit_per_min: Math.max(10, Number(e.target.value)),
                                },
                              })
                            }
                            className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-center focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Daily Quota (req)</label>
                          <input
                            type="number"
                            min="100"
                            value={activeStudioPlan.details_json?.api_daily_quota ?? (activeStudioPlan.webhook_api_enabled ? 25000 : 1000)}
                            onChange={(e) =>
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  api_daily_quota: Math.max(100, Number(e.target.value)),
                                },
                              })
                            }
                            className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-center focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Capability 4: Contractual 99.99% SLA */}
                    <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            Contractual 99.99% SLA Guarantee
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={activeStudioPlan.priority_sla_enabled !== false}
                            onChange={(e) =>
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                priority_sla_enabled: e.target.checked,
                                sla_label: e.target.checked ? (activeStudioPlan.sla_label || '99.99% Priority') : '99.5% Standard',
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-zinc-600 peer-checked:bg-amber-600"></div>
                        </label>
                      </div>

                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        Carrier-grade redundant routing with 15-minute engineering response
                      </p>

                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Service Level Tier</label>
                        <CustomSelect
                          value={
                            CARRIER_SLA_OPTIONS.some((o) => o.value === activeStudioPlan.sla_label)
                              ? (activeStudioPlan.sla_label || '99.99% Guaranteed')
                              : 'custom'
                          }
                          onChange={(val) => {
                            if (val !== 'custom') {
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                priority_sla_enabled: val !== '99.5% Standard',
                                sla_label: val,
                              });
                            }
                          }}
                          options={CARRIER_SLA_OPTIONS}
                          size="xs"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Custom Display Badge Label</label>
                        <input
                          type="text"
                          value={activeStudioPlan.sla_label || (activeStudioPlan.priority_sla_enabled ? '99.99% Priority' : '99.5% Standard')}
                          onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, sla_label: e.target.value })}
                          placeholder="e.g. 99.99% Sovereign VIP"
                          className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* Capability 5: Realtime Terminal Buffer Quota */}
                    <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 shrink-0">
                            <Activity className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            Realtime Terminal Buffer Limit
                          </span>
                        </div>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 shrink-0 whitespace-nowrap">
                          {Number(activeStudioPlan.log_buffer_limit ?? activeStudioPlan.details_json?.log_buffer_limit ?? 50) >= 99999
                            ? 'Unlimited Lines'
                            : `${activeStudioPlan.log_buffer_limit ?? activeStudioPlan.details_json?.log_buffer_limit ?? 50} Lines`}
                        </span>
                      </div>

                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        Maximum live scrollback line buffer memory for terminal execution logs
                      </p>

                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Buffer Quota Preset</label>
                        <CustomSelect
                          value={
                            LOG_BUFFER_OPTIONS.some((o) => o.value === String(activeStudioPlan.log_buffer_limit ?? activeStudioPlan.details_json?.log_buffer_limit ?? 50))
                              ? String(activeStudioPlan.log_buffer_limit ?? activeStudioPlan.details_json?.log_buffer_limit ?? 50)
                              : 'custom'
                          }
                          onChange={(val) => {
                            if (val !== 'custom') {
                              const numVal = Number(val);
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                log_buffer_limit: numVal,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  log_buffer_limit: numVal,
                                },
                              });
                            }
                          }}
                          options={LOG_BUFFER_OPTIONS}
                          size="xs"
                          className="w-full"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Exact Lines</label>
                          <input
                            type="number"
                            value={activeStudioPlan.log_buffer_limit ?? activeStudioPlan.details_json?.log_buffer_limit ?? 50}
                            onChange={(e) => {
                              const val = Math.max(10, Number(e.target.value));
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                log_buffer_limit: val,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  log_buffer_limit: val,
                                },
                              });
                            }}
                            className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Display Badge</label>
                          <input
                            type="text"
                            value={activeStudioPlan.live_terminal_label || activeStudioPlan.details_json?.live_terminal_label || '50 Line Buffer'}
                            onChange={(e) =>
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                live_terminal_label: e.target.value,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  live_terminal_label: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g. 500 Line Buffer + Export"
                            className="w-full h-7.5 px-2 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Capability 6: Log Export & Deep Telemetry */}
                    <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                            <Download className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            Log Export &amp; Raw Telemetry
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={activeStudioPlan.allow_log_export ?? activeStudioPlan.details_json?.allow_log_export ?? false}
                            onChange={(e) =>
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                allow_log_export: e.target.checked,
                                raw_telemetry_enabled: e.target.checked,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  allow_log_export: e.target.checked,
                                  raw_telemetry_enabled: e.target.checked,
                                },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-zinc-600 peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        Permission to download .log files &amp; view deep raw SIP traces
                      </p>

                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Log Retention Window</label>
                        <CustomSelect
                          value={
                            LOG_RETENTION_OPTIONS.some((o) => o.value === String(activeStudioPlan.log_retention_days ?? activeStudioPlan.details_json?.log_retention_days ?? 0))
                              ? String(activeStudioPlan.log_retention_days ?? activeStudioPlan.details_json?.log_retention_days ?? 0)
                              : 'custom'
                          }
                          onChange={(val) => {
                            if (val !== 'custom') {
                              const numDays = Number(val);
                              setActiveStudioPlan({
                                ...activeStudioPlan,
                                log_retention_days: numDays,
                                details_json: {
                                  ...(activeStudioPlan.details_json || {}),
                                  log_retention_days: numDays,
                                },
                              });
                            }
                          }}
                          options={LOG_RETENTION_OPTIONS}
                          size="xs"
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs">
                        <span className="text-[10px] text-zinc-600 dark:text-zinc-300 font-medium">Allow Export File (.log)</span>
                        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                          activeStudioPlan.allow_log_export ?? activeStudioPlan.details_json?.allow_log_export
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}>
                          {activeStudioPlan.allow_log_export ?? activeStudioPlan.details_json?.allow_log_export ? 'Unlocked' : 'Locked (Pro)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: ADVANCED SPEECH, LLM & CODEC PROVISIONING (MULTI-SELECT ACCESS) */}
                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <SlidersHorizontal className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      <div className="min-w-0">
                        <h5 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          Advanced Speech Engine, AI Models &amp; Codec Provisioning
                        </h5>
                        <p className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate">
                          Multi-select all allowed STT engines, TTS synthesizers, LLM intelligences, and telephony codecs.
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 border border-zinc-200 dark:border-zinc-700 shrink-0 whitespace-nowrap self-start sm:self-auto">
                      Multi-Select Access Mode
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* 1. Speech-to-Text (STT) Provisioning */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-750 space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                        <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                          <Mic className="h-3 w-3" /> STT Speech-to-Text ({activeStudioPlan.details_json?.allowed_stt_engines?.length || 1}/11)
                        </span>
                        <span className="font-mono text-[9px] text-zinc-400">Multi-Select</span>
                      </div>
                      <CustomSelect
                        multiSelect
                        values={
                          activeStudioPlan.details_json?.allowed_stt_engines ||
                          (activeStudioPlan.details_json?.stt_engine
                            ? [activeStudioPlan.details_json.stt_engine]
                            : ['deepgram_nova2', 'whisper_large_v3'])
                        }
                        onMultiChange={(vals) =>
                          setActiveStudioPlan({
                            ...activeStudioPlan,
                            details_json: {
                              ...(activeStudioPlan.details_json || {}),
                              allowed_stt_engines: vals,
                              stt_engine: vals[0] || 'deepgram_nova2',
                            },
                          })
                        }
                        options={STT_ENGINE_CUSTOM_OPTIONS}
                        placeholder="Select Allowed STT Engines..."
                        size="xs"
                        className="w-full"
                      />
                      <p className="text-[9px] text-zinc-400 truncate">
                        Active: {(activeStudioPlan.details_json?.allowed_stt_engines || ['deepgram_nova2']).join(', ')}
                      </p>
                    </div>

                    {/* 2. Voice Synthesis (TTS) Provisioning */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-750 space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                          <Volume2 className="h-3 w-3" /> Voice Synthesizers ({activeStudioPlan.details_json?.allowed_tts_engines?.length || 1}/9)
                        </span>
                        <span className="font-mono text-[9px] text-zinc-400">Multi-Select</span>
                      </div>
                      <CustomSelect
                        multiSelect
                        values={
                          activeStudioPlan.details_json?.allowed_tts_engines ||
                          (activeStudioPlan.details_json?.tts_engine
                            ? [activeStudioPlan.details_json.tts_engine]
                            : ['elevenlabs_turbo25', 'cartesia_sonic'])
                        }
                        onMultiChange={(vals) =>
                          setActiveStudioPlan({
                            ...activeStudioPlan,
                            details_json: {
                              ...(activeStudioPlan.details_json || {}),
                              allowed_tts_engines: vals,
                              tts_engine: vals[0] || 'elevenlabs_turbo25',
                            },
                          })
                        }
                        options={TTS_ENGINE_CUSTOM_OPTIONS}
                        placeholder="Select Allowed Voice Engines..."
                        size="xs"
                        className="w-full"
                      />
                      <p className="text-[9px] text-zinc-400 truncate">
                        Active: {(activeStudioPlan.details_json?.allowed_tts_engines || ['elevenlabs_turbo25']).join(', ')}
                      </p>
                    </div>

                    {/* 3. Conversational LLM Models Provisioning */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-750 space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <Brain className="h-3 w-3" /> LLM Reasoning ({activeStudioPlan.details_json?.allowed_llm_models?.length || 2}/12)
                        </span>
                        <span className="font-mono text-[9px] text-zinc-400">Multi-Select</span>
                      </div>
                      <CustomSelect
                        multiSelect
                        values={
                          activeStudioPlan.details_json?.allowed_llm_models || ['openai_gpt4o', 'anthropic_claude35']
                        }
                        onMultiChange={(vals) =>
                          setActiveStudioPlan({
                            ...activeStudioPlan,
                            details_json: {
                              ...(activeStudioPlan.details_json || {}),
                              allowed_llm_models: vals,
                            },
                          })
                        }
                        options={LLM_MODEL_CUSTOM_OPTIONS}
                        placeholder="Select Allowed LLM Models..."
                        size="xs"
                        className="w-full"
                      />
                      <p className="text-[9px] text-zinc-400 truncate">
                        Active: {(activeStudioPlan.details_json?.allowed_llm_models || ['openai_gpt4o']).join(', ')}
                      </p>
                    </div>

                    {/* 4. Carrier Audio Codecs Provisioning */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-750 space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Wifi className="h-3 w-3" /> Audio Codecs ({activeStudioPlan.details_json?.allowed_audio_codecs?.length || 1}/7)
                        </span>
                        <span className="font-mono text-[9px] text-zinc-400">Multi-Select</span>
                      </div>
                      <CustomSelect
                        multiSelect
                        values={
                          activeStudioPlan.details_json?.allowed_audio_codecs ||
                          (activeStudioPlan.details_json?.audio_codec
                            ? [activeStudioPlan.details_json.audio_codec]
                            : ['opus_48k', 'g711u'])
                        }
                        onMultiChange={(vals) =>
                          setActiveStudioPlan({
                            ...activeStudioPlan,
                            details_json: {
                              ...(activeStudioPlan.details_json || {}),
                              allowed_audio_codecs: vals,
                              audio_codec: vals[0] || 'opus_48k',
                            },
                          })
                        }
                        options={AUDIO_CODEC_CUSTOM_OPTIONS}
                        placeholder="Select Allowed Codecs..."
                        size="xs"
                        className="w-full"
                      />
                      <p className="text-[9px] text-zinc-400 truncate">
                        Active: {(activeStudioPlan.details_json?.allowed_audio_codecs || ['opus_48k']).join(', ')}
                      </p>
                    </div>

                    {/* 5. Max Call Duration Limit */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-750 space-y-1.5 sm:col-span-2 lg:col-span-2">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Clock className="h-3 w-3" /> Maximum Call Duration Timeout Cap
                        </span>
                        <span className="font-mono text-[9px] text-zinc-400">Boundary Cap</span>
                      </div>
                      <CustomSelect
                        value={activeStudioPlan.details_json?.max_call_duration_mins || '60'}
                        onChange={(val) =>
                          setActiveStudioPlan({
                            ...activeStudioPlan,
                            details_json: { ...(activeStudioPlan.details_json || {}), max_call_duration_mins: val },
                          })
                        }
                        options={MAX_CALL_DURATION_OPTIONS}
                        placeholder="Select Max Call Duration..."
                        size="xs"
                        className="w-full"
                      />
                      <p className="text-[9px] text-zinc-400 truncate">
                        Calls reaching this duration limit are gracefully finalized or bridged with carrier disconnect tone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FEATURE CHECKLIST BUILDER */}
            {studioTab === 'features' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Included Entitlements &amp; Points ({activeStudioPlan.features_list?.length || 0})
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isBulkFeatureMode) {
                        setBulkFeaturesText((activeStudioPlan.features_list || []).join('\n'));
                      }
                      setIsBulkFeatureMode(!isBulkFeatureMode);
                    }}
                    className="text-[11px] text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                  >
                    {isBulkFeatureMode ? 'Switch to Multi-Select' : 'Bulk Textarea Mode'}
                  </button>
                </div>

                {isBulkFeatureMode ? (
                  <div className="space-y-2">
                    <textarea
                      value={bulkFeaturesText}
                      onChange={(e) => setBulkFeaturesText(e.target.value)}
                      placeholder="Paste or write one feature per line..."
                      rows={6}
                      className="w-full p-2.5 font-mono text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <Button variant="primary" size="sm" onClick={handleApplyBulkFeatures} className="text-xs h-7">
                      Save Bulk Features
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Add Single Feature */}
                    <div className="flex items-center gap-2">
                      <Input
                        value={newFeatureInput}
                        onChange={(e) => setNewFeatureInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomFeature()}
                        placeholder="Type custom deliverable point..."
                        className="h-7.5 text-xs flex-1"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddCustomFeature}
                        leftIcon={<Plus className="h-3 w-3" />}
                        className="text-xs h-7.5 px-3 bg-teal-600 text-white"
                      >
                        Add
                      </Button>
                    </div>

                    {/* Multi-Select Catalog Checkbox Tags */}
                    <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                        <CheckSquare className="h-3 w-3 text-teal-500" /> Multi-Select Telephony Library (Click to toggle)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {TELEPHONY_FEATURE_CATALOG.map((f) => {
                          const isChecked = (activeStudioPlan.features_list || []).includes(f.label);
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => handleToggleCatalogFeature(f.label)}
                              className={`text-left p-1.5 px-2 rounded text-[11px] transition-colors flex items-center justify-between gap-1.5 border cursor-pointer ${
                                isChecked
                                  ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/40 font-semibold'
                                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                              }`}
                            >
                              <span className="truncate">{f.label}</span>
                              {isChecked ? (
                                <CheckSquare className="h-3 w-3 text-teal-600 shrink-0" />
                              ) : (
                                <Square className="h-3 w-3 text-zinc-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Configured Features Re-orderable list */}
                    <div className="space-y-1 max-h-48 overflow-y-auto p-0.5">
                      {(activeStudioPlan.features_list || []).map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-1.5 px-2 rounded-md bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                            <input
                              type="text"
                              value={feat}
                              onChange={(e) => {
                                const updated = [...(activeStudioPlan.features_list || [])];
                                updated[idx] = e.target.value;
                                setActiveStudioPlan({ ...activeStudioPlan, features_list: updated });
                              }}
                              className="bg-transparent border-none focus:outline-none text-xs text-zinc-900 dark:text-zinc-100 w-full"
                            />
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveFeature(idx, 'up')}
                              disabled={idx === 0}
                              className="p-0.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveFeature(idx, 'down')}
                              disabled={idx === (activeStudioPlan.features_list?.length || 0) - 1}
                              className="p-0.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(idx)}
                              className="p-0.5 text-zinc-400 hover:text-rose-500 cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 4: BADGES & BUTTON THEMES */}
            {studioTab === 'style' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                {/* 1. Top Floating Badge */}
                <div className="space-y-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Top Floating Badge
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Badge Text
                      </label>
                      <Input
                        value={activeStudioPlan.badge_text || ''}
                        onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, badge_text: e.target.value })}
                        placeholder="e.g. ⭐ Most Popular Choice"
                        className="h-7 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Badge Color
                      </label>
                      <CustomSelect
                        value={activeStudioPlan.badge_color || 'teal'}
                        onChange={(val) => setActiveStudioPlan({ ...activeStudioPlan, badge_color: val })}
                        options={BADGE_COLOR_PRESETS.map((b) => ({ label: b.label, value: b.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Action CTA Button Customizer */}
                <div className="space-y-2.5 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    CTA Button Text &amp; Color
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Button Label
                      </label>
                      <Input
                        value={activeStudioPlan.cta_text || ''}
                        onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, cta_text: e.target.value })}
                        placeholder="e.g. Select Plan"
                        className="h-7 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Button Icon
                      </label>
                      <CustomSelect
                        value={activeStudioPlan.cta_icon || 'Zap'}
                        onChange={(val) => setActiveStudioPlan({ ...activeStudioPlan, cta_icon: val })}
                        options={[
                          { label: '⚡ Zap (Default)', value: 'Zap' },
                          { label: '✨ Sparkles', value: 'Sparkles' },
                          { label: '📞 Phone Call', value: 'PhoneCall' },
                          { label: '👑 Crown VIP', value: 'Crown' },
                          { label: '🛡️ Shield Check', value: 'ShieldCheck' },
                          { label: '🔥 Flame Hot', value: 'Flame' },
                          { label: '✓ Check Circle', value: 'CheckCircle2' },
                        ]}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Button Background Color */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Button Background Color
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      {BUTTON_BG_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setActiveStudioPlan({ ...activeStudioPlan, cta_bg_color: p.value })}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-all cursor-pointer ${
                            activeStudioPlan.cta_bg_color === p.value
                              ? 'ring-2 ring-teal-500 border-transparent text-white font-bold shadow-2xs'
                              : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                          }`}
                          style={{ background: p.value, color: '#ffffff' }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">Hex:</span>
                      <input
                        type="color"
                        value={activeStudioPlan.cta_bg_color?.startsWith('#') ? activeStudioPlan.cta_bg_color : '#0d9488'}
                        onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, cta_bg_color: e.target.value })}
                        className="h-5.5 w-7 rounded cursor-pointer border border-zinc-300"
                      />
                      <input
                        type="text"
                        value={activeStudioPlan.cta_bg_color || ''}
                        onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, cta_bg_color: e.target.value })}
                        placeholder="#0d9488"
                        className="h-6.5 w-24 px-1.5 text-xs font-mono rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                      />
                    </div>
                  </div>

                  {/* Button Text Color */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Button Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeStudioPlan.cta_text_color?.startsWith('#') ? activeStudioPlan.cta_text_color : '#ffffff'}
                        onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, cta_text_color: e.target.value })}
                        className="h-5.5 w-7 rounded cursor-pointer border border-zinc-300"
                      />
                      <input
                        type="text"
                        value={activeStudioPlan.cta_text_color || '#ffffff'}
                        onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, cta_text_color: e.target.value })}
                        className="h-6.5 w-24 px-1.5 text-xs font-mono rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Border Accent & Glowing Aura Preset */}
                <div className="space-y-1.5 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Card Border Accent &amp; Glow Preset
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {ACCENT_GLOW_PRESETS.map((glow) => (
                      <button
                        key={glow.value}
                        type="button"
                        onClick={() => setActiveStudioPlan({ ...activeStudioPlan, accent_color: glow.value })}
                        className={`p-1.5 px-2 rounded-md text-left text-xs font-semibold border transition-all cursor-pointer ${
                          activeStudioPlan.accent_color === glow.value
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-teal-500 shadow-2xs ring-1 ring-teal-500/50'
                            : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                        }`}
                      >
                        <div>{glow.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: HTML & CSS CODE DESIGNER (UNIFIED CODE BOX) */}
            {studioTab === 'code' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Code2 className="h-3 w-3 text-purple-500" /> One-Click Code Themes
                  </h5>
                  <button
                    type="button"
                    onClick={() => setActiveStudioPlan({ ...activeStudioPlan, custom_html: '', custom_css: '' })}
                    className="text-[10px] text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    Clear Code Box
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {UNIFIED_CODE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => handleApplyUnifiedCodeTemplate(tmpl)}
                      className="p-1.5 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-purple-500 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-500 transition-colors">
                        {tmpl.name}
                      </div>
                      <div className="text-[9px] text-zinc-500 line-clamp-1 mt-0.5">{tmpl.description}</div>
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 text-[10px] flex items-center gap-1">
                      Unified Code Box (HTML + &lt;style&gt; CSS + JS)
                    </label>
                    <span className="text-[9px] font-mono text-zinc-500">Target #inpage-studio-live-preview-card</span>
                  </div>
                  <textarea
                    value={activeStudioPlan.custom_html || ''}
                    onChange={(e) => setActiveStudioPlan({ ...activeStudioPlan, custom_html: e.target.value })}
                    placeholder="<div>Write custom HTML ribbons, promo banners, or styled tags...</div>&#10;<style>&#10;#inpage-studio-live-preview-card { border-color: #06b6d4 !important; }&#10;</style>"
                    rows={9}
                    className="w-full p-2.5 font-mono text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-y leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANE (5 Cols): Live Real-Time Split Preview (EXACT SUBSCRIPTION PLANS TAB CARD) */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-3 sticky top-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Eye className="h-3 w-3 text-teal-600" /> Real-Time Live Preview
                </span>

                {/* Billing Cycle Switcher */}
                <div className="inline-flex p-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 shadow-2xs">
                  {(['monthly', 'yearly', 'lifetime'] as const).map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setPreviewCycle(cycle)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded capitalize transition-all cursor-pointer ${
                        previewCycle === cycle
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-2xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      {cycle === 'yearly' ? 'Annual' : cycle}
                    </button>
                  ))}
                </div>
              </div>

              {/* EXACT VISUAL REPLICA OF THE BILLING & USAGE CARD */}
              <div
                id="inpage-studio-live-preview-card"
                className={`custom-plan-card relative rounded-xl flex flex-col justify-between transition-all duration-200 bg-white dark:bg-zinc-900 ${activeAccentClass}`}
              >
                {/* Top Tag / Selected / Popular Indicator */}
                {(activeStudioPlan.badge_text || activeStudioPlan.popular) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span
                      className={`custom-plan-badge font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-sm text-[10px] whitespace-nowrap flex items-center gap-1 ${
                        activeStudioPlan.badge_color === 'emerald' ? 'bg-emerald-600 text-white' :
                        activeStudioPlan.badge_color === 'blue' ? 'bg-blue-600 text-white' :
                        activeStudioPlan.badge_color === 'purple' ? 'bg-purple-600 text-white' :
                        activeStudioPlan.badge_color === 'amber' ? 'bg-amber-500 text-black font-extrabold' :
                        activeStudioPlan.badge_color === 'rose' ? 'bg-rose-600 text-white' :
                        activeStudioPlan.badge_color === 'gradient' ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500 text-white shadow-sm' :
                        'bg-teal-600 text-white'
                      }`}
                    >
                      {activeStudioPlan.badge_text || '⭐ Most Popular Choice'}
                    </span>
                  </div>
                )}

                {/* Card Header & Plan Name */}
                <div className="p-4 sm:p-5 pb-3 space-y-2">
                  {/* Audience Category Pill & Header Icon */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center border shadow-2xs ${
                          headerIconColor === 'amber'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : headerIconColor === 'purple'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                            : headerIconColor === 'emerald'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : headerIconColor === 'blue'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                            : headerIconColor === 'rose'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30'
                        }`}
                      >
                        <HeaderPlanIcon className="h-4 w-4" />
                      </div>
                      {targetCategory && (
                        <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          {targetCategory}
                        </span>
                      )}
                    </div>
                    {(activeStudioPlan.details_json?.show_slug_on_card ?? true) && (
                      <span className="text-[10px] font-mono text-zinc-400">
                        #{activeStudioPlan.plan_key || 'key'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-black text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
                      {activeStudioPlan.name || 'Plan Name'}
                    </h3>
                  </div>

                  {activeStudioPlan.tagline && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed min-h-[36px]">
                      {activeStudioPlan.tagline}
                    </p>
                  )}

                  {/* Price Display */}
                  <div className="pt-2">
                    {isCustomQuote ? (
                      <div>
                        <div className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                          Custom Pricing
                        </div>
                        <div className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold mt-1">
                          Tailored Telephony SLA • Talk to Sales
                        </div>
                      </div>
                    ) : isFreeTier ? (
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                            {currencySymbol}0
                          </span>
                          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 font-sans">
                            /free forever
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                          ✓ Instant Activation • No Credit Card Required
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
                            {currencySymbol}{currentPreviewPrice.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 font-sans">
                            {previewCycle === 'lifetime'
                              ? '/one-time'
                              : previewCycle === 'yearly'
                              ? '/mo'
                              : '/mo'}
                          </span>
                        </div>

                        {/* Sub-price billing notice */}
                        <div className="text-[11px] font-mono text-zinc-400 mt-1 min-h-[16px]">
                          {previewCycle === 'yearly' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Billed as {currencySymbol}${(currentPreviewPrice * 12).toLocaleString()}/yr (Save {currencySymbol}{previewAnnualSavings.toLocaleString()})
                            </span>
                          ) : previewCycle === 'lifetime' ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              {activeStudioPlan.details_json?.lifetime_subtext || 'One-Time • Lifetime Access'}
                            </span>
                          ) : (
                            <span>{activeStudioPlan.sub_billing_text || activeStudioPlan.details_json?.sub_billing_text || `Billed monthly in ${currencyCode}`}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Setup Fee Notice */}
                    {setupFee > 0 && (
                      <div className="pt-1">
                        {isSetupFeeWaived ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span>Setup Fee:</span>
                            <span className="line-through text-zinc-400 font-mono">{currencySymbol}{setupFee}</span>
                            <span className="font-bold bg-emerald-500/10 px-1 rounded">FREE (Waived Promo)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            + {currencySymbol}{setupFee} one-time provisioning fee
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Content & Limits */}
                <div className="p-4 sm:p-5 pt-0 space-y-4 flex-1 flex flex-col justify-between">
                  {/* Custom HTML snippet if injected */}
                  {activeStudioPlan.custom_html && (
                    <div
                      className="text-xs my-1"
                      dangerouslySetInnerHTML={{ __html: activeStudioPlan.custom_html }}
                    />
                  )}

                  {/* Free Trial Highlight Banner */}
                  {trialDays !== '0' && (
                    <div className="p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between text-xs text-indigo-800 dark:text-indigo-300 font-semibold shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <Gift className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span>{trialDays}-Day Full Free Trial Included</span>
                      </div>
                      <span className="text-[9px] font-mono opacity-80">
                        {activeStudioPlan.details_json?.trial_requires_cc ? 'Card req.' : 'No CC req.'}
                      </span>
                    </div>
                  )}

                  {/* Core Resource Metrics */}
                  <div className="space-y-2 py-3 border-y border-zinc-100 dark:border-zinc-800 text-[11px] sm:text-xs">
                    <div className="flex items-center justify-between font-semibold gap-1">
                      <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                        <PhoneCall className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        {activeStudioPlan.voice_minutes_label || 'Voice Minutes:'}
                      </span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold text-right shrink-0 whitespace-nowrap">
                        {previewDynamicMinutes}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-semibold gap-1">
                      <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                        <Radio className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        {activeStudioPlan.concurrency_label || 'Live Concurrency:'}
                      </span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold shrink-0 whitespace-nowrap">
                        {isUnlimitedConcurrency ? 'Unlimited Channels' : `${activeStudioPlan.concurrency_limit || 0} Channels`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-semibold gap-1">
                      <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                        <HardDrive className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        {activeStudioPlan.rag_label || 'RAG Vector DB:'}
                      </span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold shrink-0 whitespace-nowrap">
                        {isUnlimitedRag ? 'Unlimited Vector Memory' : activeStudioPlan.rag_storage_mb ? `${activeStudioPlan.rag_storage_mb.toLocaleString()} MB Storage` : '200 MB Storage'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-semibold gap-1">
                      <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                        <Bot className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                        {activeStudioPlan.bots_label || 'AI Voice Bots:'}
                      </span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold shrink-0 whitespace-nowrap">
                        {isUnlimitedAgents ? 'Unlimited Voice Bots' : activeStudioPlan.max_agents_count ? `${activeStudioPlan.max_agents_count} Bots` : 'Unlimited'}
                      </span>
                    </div>

                    {(includedPhoneNumbers > 0 || isUnlimitedPhoneNumbers) && (
                      <div className="flex items-center justify-between font-semibold gap-1">
                        <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                          <Globe className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          {activeStudioPlan.details_json?.phone_numbers_label || 'Dedicated DID Lines:'}
                        </span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold shrink-0 whitespace-nowrap">
                          {isUnlimitedPhoneNumbers ? 'Unlimited DIDs' : `${includedPhoneNumbers} Included`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Capability Hardware Badges */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center justify-between">
                      <span>Carrier &amp; Platform Capabilities</span>
                      <span className="text-[9px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                        {activeCapabilityCount}/4 Included
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Android GSM Multi-SIM</span>
                        {activeStudioPlan.gsm_sim_enabled !== false ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <CheckCircle2 className="h-3 w-3 shrink-0" /> {activeStudioPlan.gsm_label || 'Included'}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-medium flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <X className="h-3 w-3 shrink-0" /> {activeStudioPlan.gsm_label || 'Not Included'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <span className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Custom Voice Cloning Engine</span>
                        {activeStudioPlan.voice_cloning_enabled ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <CheckCircle2 className="h-3 w-3 shrink-0" /> {activeStudioPlan.voice_cloning_label || 'Studio Grade'}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-medium flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <X className="h-3 w-3 shrink-0" /> {activeStudioPlan.voice_cloning_label || 'Basic TTS'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <span className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Enterprise Webhooks &amp; REST API</span>
                        {activeStudioPlan.webhook_api_enabled ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <CheckCircle2 className="h-3 w-3 shrink-0" /> {activeStudioPlan.webhook_label || 'Enterprise'}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-medium flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <X className="h-3 w-3 shrink-0" /> {activeStudioPlan.webhook_label || 'Not Included'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <span className="text-zinc-600 dark:text-zinc-400 whitespace-nowrap">Contractual 99.99% SLA</span>
                        <span className="text-teal-700 dark:text-teal-300 font-bold shrink-0 whitespace-nowrap">
                          {activeStudioPlan.sla_label || (activeStudioPlan.priority_sla_enabled ? '99.99% Priority' : '99.5% Standard')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Speech, LLM & Codecs Entitlements Summary */}
                  <div className="p-2.5 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Cpu className="h-3 w-3 text-teal-600 dark:text-teal-400" /> AI Voice &amp; Speech Engines
                      </span>
                      <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">
                        {activeStudioPlan.details_json?.max_call_duration_mins === 'unlimited'
                          ? '∞ Duration'
                          : `${activeStudioPlan.details_json?.max_call_duration_mins || 60}m/call`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] text-zinc-600 dark:text-zinc-400">
                      <div>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">STT: </span>
                        <span>{activeStudioPlan.details_json?.allowed_stt_engines?.length || 1} Engines Allowed</span>
                      </div>
                      <div>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">TTS: </span>
                        <span>{activeStudioPlan.details_json?.allowed_tts_engines?.length || 1} Synthesizers</span>
                      </div>
                      <div>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">LLMs: </span>
                        <span>{activeStudioPlan.details_json?.allowed_llm_models?.length || 2} Reasoning Models</span>
                      </div>
                      <div>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">Codecs: </span>
                        <span>{activeStudioPlan.details_json?.allowed_audio_codecs?.length || 1} Telecom Codecs</span>
                      </div>
                    </div>
                  </div>

                  {/* Features Checklist */}
                  {(activeStudioPlan.features_list || []).length > 0 && (
                    <div className="space-y-1.5 flex-1 pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Included Entitlements
                      </div>
                      {(activeStudioPlan.features_list || []).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action CTA & Matrix Spec Link */}
                  <div className="pt-3 space-y-2">
                    <button
                      type="button"
                      style={{
                        background: activeStudioPlan.cta_bg_color || '#0d9488',
                        color: activeStudioPlan.cta_text_color || '#ffffff',
                      }}
                      className="custom-plan-cta w-full font-bold text-xs py-2.5 px-4 rounded-lg shadow-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 hover:opacity-95"
                    >
                      <CtaButtonIcon className="h-3.5 w-3.5 inline shrink-0" />
                      <span>
                        {isCustomQuote
                          ? 'Talk to Enterprise Sales ➔'
                          : activeStudioPlan.cta_text || `Select ${activeStudioPlan.name || 'Plan'}`}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="w-full text-center text-[11px] font-bold py-1 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                      <span>Explore Full Technical Specs ▾</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 text-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
              Live edits synchronize across public pricing, organization subscriptions &amp; checkout sessions.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: CLEAN MASTER TABLE LEDGER (Default state - Exactly like before!)
  // =========================================================================
  return (
    <div className="space-y-3.5">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold border transition-all animate-in fade-in slide-in-from-top-3 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-emerald-950/40'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-rose-950/40'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-emerald-500" />
            Subscription Plans Master Ledger
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Create, edit, or configure strict usage caps, telephony quotas, features and styling for all plans.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            className="text-xs font-semibold"
          >
            Sync
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateInPage}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            className="text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white"
          >
            Create New Plan Tier
          </Button>
        </div>
      </div>

      {/* Plans Table Ledger */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
        <div className="overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 uppercase font-bold text-[11px] border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-3.5 py-2.5">Plan Name</th>
                <th className="px-3.5 py-2.5">Key</th>
                <th className="px-3.5 py-2.5">Monthly ($)</th>
                <th className="px-3.5 py-2.5">Minutes</th>
                <th className="px-3.5 py-2.5">Concurrency</th>
                <th className="px-3.5 py-2.5">Agents</th>
                <th className="px-3.5 py-2.5">Features</th>
                <th className="px-3.5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 text-xs">
                    No subscription plans configured. Click "Create New Plan Tier" to add one.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((p) => {
                  const monthly = getPlanMonthly(p);
                  const mins = getPlanMinutes(p);
                  const conc = getPlanConcurrency(p);
                  const agents = getPlanAgents(p);
                  const features = getPlanFeatures(p);

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{p.name || 'Untitled'}</span>
                          {p.popular && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 dark:text-amber-400 font-bold">
                              Popular
                            </span>
                          )}
                          {(p.custom_css || p.custom_html) && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/15 text-purple-400 font-mono font-bold">
                              Code
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3.5 py-2.5 font-mono text-zinc-500 text-[11px]">{p.plan_key || p.id}</td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-zinc-900 dark:text-zinc-100">${monthly}</td>
                      <td className="px-3.5 py-2.5 font-bold text-blue-600 dark:text-blue-400">{mins.toLocaleString()} min</td>
                      <td className="px-3.5 py-2.5 font-bold text-emerald-600 dark:text-emerald-400">{conc} Trunks</td>
                      <td className="px-3.5 py-2.5 text-zinc-700 dark:text-zinc-300">{agents ? `${agents} Bots` : 'Unlimited'}</td>
                      <td className="px-3.5 py-2.5 text-zinc-500 dark:text-zinc-400 text-xs truncate max-w-xs">
                        {features.join(', ') || 'Standard Features'}
                      </td>

                      <td className="px-3.5 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditInPage(p)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-blue-600 dark:text-blue-400 font-bold transition-colors cursor-pointer"
                            title="Edit Plan"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClonePlan(p)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            title="Clone Plan"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-rose-500 font-bold transition-colors cursor-pointer"
                            title="Delete Plan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertCircle className="h-6 w-6" />
              <h4 className="text-base font-bold text-zinc-900 dark:text-white">Delete Subscription Plan?</h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete this plan tier? Any existing tenants currently subscribed to
              this plan will maintain their grandfathered quotas, but new users will no longer be able to purchase it.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteActivePlan(deleteConfirmId)}
                className="text-xs h-8 font-semibold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanMasterStudio;
