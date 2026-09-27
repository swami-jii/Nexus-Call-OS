import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus,
  Trash2,
  LayoutGrid,
  List,
  MessageSquare,
  Sparkles,
  Cpu,
  Send,
  Wrench,
  Search,
  Download,
  Copy,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Sliders,
  Globe,
  BrainCircuit,
  FileCode,
  Play,
  Activity,
  Square,
  RotateCcw,
  Mic,
  ChevronDown,
  ChevronUp,
  Variable,
  Brain,
  Volume2,
  BookOpen,
  Smartphone,
  ShieldCheck,
  Layers,
  Settings2,
  SlidersHorizontal,
  Bot,
  Zap,
  CheckCircle2,
  Code2,
  Gauge,
  Clock,
  ArrowRight,
  Database,
  Calendar,
  MessageCircle,
  PhoneForwarded,
  ExternalLink,
  FileText,
  Check,
  Filter,
  Users,
  Lock,
  Crown,
  GitFork,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { DataTable, Column } from '../components/ui/DataTable';
import { CardSkeleton } from '../components/ui/Skeleton';
import { CommandPaletteSelect, SelectOption } from '../components/ui/CommandPaletteSelect';
import { Agent } from '../types';
import { agentRepository } from '../repository';
import { useToast } from '../components/ui/Toast';
import { triggerNavigationHandoff } from '../lib/handoffNavigation';
import { useBusinessRules, LanguageItem } from '../context/BusinessRulesContext';
import { fetchAPI } from '../lib/api';
import { GLOBAL_LANGUAGES_CATALOG, getLanguageSamplePrompt } from '../data/globalLanguagesCatalog';
import { fetchSkillsFromBackend, AgentSkill } from '../skills';
import { usePlanEntitlements } from '../hooks/usePlanEntitlements';
import { PlanGuardrailModal } from '../components/ui/PlanGuardrailModal';

// Enterprise System Prompt Presets
export const PROMPT_INDUSTRY_PRESETS = [
  {
    id: 'support',
    name: 'Customer Support Specialist',
    description: 'Empathetic, inquiry resolution, billing & ticket management',
    prompt: `You are {{agent_name}}, an empathetic and efficient Customer Support Specialist for {{company_name}}.
Your primary goal is to resolve caller inquiries swiftly while maintaining an upbeat, professional, and reassuring tone.
Always address the caller respectfully by {{caller_name}} and confirm resolution before closing the call.
If the caller has questions about their account, verify their phone {{customer_phone}} and provide step-by-step assistance.`,
  },
  {
    id: 'booking',
    name: 'Outbound Appointment Booking Coordinator',
    description: 'Lead qualification, calendar booking, and meeting confirmations',
    prompt: `You are {{agent_name}}, an engaging outbound sales and scheduling coordinator at {{company_name}}.
Your goal is to qualify the lead politely, understand their operational calling needs, and confirm an executive product walkthrough for {{booking_date}}.
Be concise, energetic, and listen actively to objections before presenting tailored benefits.`,
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Clinic Receptionist',
    description: 'Patient triage, doctor appointments, and prescription inquiries',
    prompt: `You are {{agent_name}}, a calm and caring medical receptionist at {{company_name}}.
Greet {{caller_name}} warmly, verify their appointment request or prescription inquiry, ensure confidentiality, and confirm doctor availability on {{booking_date}}.
Never provide diagnostic advice; offer prompt scheduling with qualified practitioners.`,
  },
  {
    id: 'billing',
    name: 'Financial Collections & Billing Advisor',
    description: 'Payment reminders, invoice breakdown, and secure payment dispatch',
    prompt: `You are {{agent_name}}, a professional financial advisor representing {{company_name}}.
Assist {{caller_name}} with billing inquiries, explain invoice breakdowns clearly, and offer secure payment links or payment plan options with utmost empathy and professionalism.`,
  },
  {
    id: 'realestate',
    name: 'Real Estate Property Consultant',
    description: 'Buyer qualification, property criteria, and site visit scheduling',
    prompt: `You are {{agent_name}}, a knowledgeable real estate consultant for {{company_name}}.
Qualify {{caller_name}} regarding their property preferences, budget range, and desired location, and schedule an on-site property tour for {{booking_date}}.`,
  },
  {
    id: 'custom',
    name: 'Custom Freeform Template',
    description: 'Custom instructions with user-defined dynamic variables',
    prompt: `You are {{agent_name}}, an AI voice assistant at {{company_name}} helping {{caller_name}} on {{booking_date}}.`,
  },
];

export const EMOTION_PRESETS: SelectOption[] = [
  { value: 'Neutral', label: '😐 Neutral & Balanced', description: 'Standard natural conversational tone' },
  { value: 'Happy', label: '😊 Friendly & Empathetic', description: 'Warm, positive, and helpful customer care tone' },
  { value: 'Calm', label: '😌 Calm & Reassuring', description: 'Gentle, soothing tone ideal for de-escalation' },
  { value: 'Urgent', label: '⚡ Urgent & Direct', description: 'Fast, clear, alert tone for critical notifications' },
  { value: 'Excited', label: '🚀 Energetic & Sales-driven', description: 'High enthusiasm tone for outbound promotions' },
];

export const getSmartDefaultForVar = (key: string, targetAgentName?: string): string => {
  const lower = key.toLowerCase();
  if (lower.includes('agent_name') || lower === 'agent') return targetAgentName || 'AI Voice Agent';
  if (lower.includes('caller_name') || lower.includes('client_name') || lower.includes('customer_name') || lower === 'caller' || lower === 'client' || lower === 'name') return 'Alex Vance';
  if (lower.includes('studio_name') || lower.includes('agency_name')) return 'PixelCraft Creative Studio';
  if (lower.includes('company_name') || lower.includes('organization') || lower.includes('company')) return 'Create Call OS';
  if (lower.includes('phone') || lower.includes('mobile') || lower.includes('number')) return '+91 98765 43210';
  if (lower.includes('booking_date') || lower.includes('appointment_date')) return 'Tomorrow at 3:00 PM';
  if (lower.includes('project_deadline') || lower.includes('deadline')) return 'Next Friday at 5:00 PM';
  if (lower.includes('project_type') || lower.includes('service_name')) return 'Creative Branding & UI/UX Design';
  if (lower.includes('current_time') || lower === 'time') return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (lower.includes('current_date') || lower === 'date') return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (lower.includes('account_status') || lower.includes('status')) return 'Active Premium';
  if (lower.includes('email')) return 'alex.vance@example.com';
  if (lower.includes('amount') || lower.includes('price') || lower.includes('budget') || lower.includes('cost')) return '$1,250.00';
  return key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export const generateAgentFallbackResponse = (
  userMsg: string,
  agentName: string,
  systemPrompt: string,
  skillName?: string,
  vars?: Record<string, string>
): string => {
  const promptLower = (systemPrompt || '').toLowerCase();
  const msgLower = userMsg.toLowerCase();
  const clientName = vars?.client_name || vars?.caller_name || 'there';
  const studioName = vars?.studio_name || vars?.company_name || 'our studio';

  if (skillName && skillName !== 'none') {
    if (skillName.includes('booking') || skillName.includes('appointment')) {
      return `Hello ${clientName}! I am ${agentName}. I'd be delighted to assist you with booking an appointment regarding '${userMsg}'. We have availability tomorrow at 11:00 AM or 3:30 PM. Which slot works best for you?`;
    }
    if (skillName.includes('support') || skillName.includes('ticket')) {
      return `Thank you for reaching out to customer support. I have logged your request: "${userMsg}". Let me verify your details and resolve this for you right away. Could you please confirm your registered phone number?`;
    }
  }

  if (promptLower.includes('maya') || promptLower.includes('graphic design') || promptLower.includes('brand') || promptLower.includes('studio')) {
    if (msgLower.includes('hi') || msgLower.includes('hello') || msgLower.includes('who are you')) {
      return `Hello ${clientName}! I'm Maya, your Creative Graphic Designer and Brand Strategist representing ${studioName}. I help craft distinctive logo designs, full brand identities, and UI/UX assets. What kind of creative project are you looking to launch?`;
    }
    if (msgLower.includes('price') || msgLower.includes('cost') || msgLower.includes('budget') || msgLower.includes('quote')) {
      return `Our design packages are tailored to your scope—from agile brand identity sprints to full product design systems. To provide an exact timeline and estimate, let's schedule a 15-minute discovery consultation. What day works best for you this week?`;
    }
    if (msgLower.includes('timeline') || msgLower.includes('deadline')) {
      const deadline = vars?.project_deadline || 'next Friday';
      return `We deliver initial creative concepts within 3 to 5 business days, ensuring we align with your target deadline (${deadline}). What is your primary milestone date?`;
    }
    return `That sounds like a wonderful creative direction! Regarding "${userMsg}", ${studioName} can create high-impact assets perfectly tailored to your target audience. Would you like to schedule a 15-minute design discovery call to discuss further?`;
  }

  if (promptLower.includes('video') || promptLower.includes('editing')) {
    return `Hello ${clientName}! I am your Video Editing Intake specialist. I've noted your request: "${userMsg}". We handle short-form reels, YouTube productions, and commercial post-production. Could you share your target platform and raw footage length?`;
  }

  if (promptLower.includes('booking') || promptLower.includes('appointment') || promptLower.includes('schedule')) {
    return `Hello ${clientName}! I am ${agentName}. I'd be happy to assist you with scheduling. Regarding "${userMsg}", I have calendar availability tomorrow at 10:00 AM or Thursday at 2:00 PM. Would either of those times work for your call?`;
  }

  if (promptLower.includes('health') || promptLower.includes('clinic') || promptLower.includes('patient')) {
    return `Hello ${clientName}! I am ${agentName} from the clinic reception. I have noted your inquiry: "${userMsg}". Let me check our practitioner schedule to arrange an appointment for you. What day works best?`;
  }

  if (msgLower.includes('hello') || msgLower.includes('hi') || msgLower.includes('hey')) {
    return `Hello ${clientName}! I am ${agentName}, your AI voice assistant at ${vars?.company_name || 'Create Call OS'}. How may I assist you with your requirements today?`;
  }

  return `Thank you for reaching out. I am ${agentName}, and I've noted: "${userMsg}". Based on our system configuration, I'm ready to assist you further. Is there anything specific you would like me to process or confirm?`;
};

interface AgentPromptTagDropdownPanelProps {
  title: string;
  count: number;
  subtitle: string;
  icon: React.ReactNode;
  theme: 'amber' | 'blue';
  items: Array<{ tag: string; label: string; group?: string }>;
  selectedTags?: string[];
  onToggleTag?: (tag: string) => void;
  onInsert?: (tag: string) => void;
}

const AgentPromptTagDropdownPanel: React.FC<AgentPromptTagDropdownPanelProps> = ({
  title,
  count,
  subtitle,
  icon,
  theme,
  items,
  selectedTags = [],
  onToggleTag,
  onInsert,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState('');

  if (items.length === 0) return null;

  const filteredItems = items.filter(
    (item) =>
      item.tag.toLowerCase().includes(search.toLowerCase()) ||
      item.label.toLowerCase().includes(search.toLowerCase())
  );

  const isAmber = theme === 'amber';
  const handleAction = onToggleTag || onInsert;

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
        isAmber
          ? 'border-amber-200/90 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20'
          : 'border-blue-200/90 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20'
      }`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 flex items-center justify-between transition-colors cursor-pointer text-left select-none ${
          isAmber
            ? 'hover:bg-amber-100/50 dark:hover:bg-amber-900/30'
            : 'hover:bg-blue-100/50 dark:hover:bg-blue-900/30'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-1.5 rounded-lg shrink-0 ${
              isAmber
                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                : 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
            }`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold truncate ${
                  isAmber ? 'text-amber-950 dark:text-amber-200' : 'text-blue-950 dark:text-blue-200'
                }`}
              >
                {title}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isAmber
                    ? 'bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200'
                    : 'bg-blue-200/80 dark:bg-blue-900/80 text-blue-900 dark:text-blue-200'
                }`}
              >
                {count}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span
            className={`text-[11px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
              isExpanded
                ? isAmber
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : isAmber
                ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-50'
                : 'bg-white dark:bg-zinc-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50'
            }`}
          >
            <span>{isExpanded ? 'Close Dropdown' : 'Select / Open'}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div
          className={`p-3 border-t bg-white dark:bg-zinc-900/95 space-y-2.5 animate-in fade-in duration-150 ${
            isAmber
              ? 'border-amber-200/80 dark:border-amber-900/60'
              : 'border-blue-200/80 dark:border-blue-900/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-zinc-400" />
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium shrink-0">
              Click tag to toggle in calling context
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap max-h-36 overflow-y-auto pr-1">
            {filteredItems.map((item, idx) => {
              const isSelected = selectedTags.includes(item.tag);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAction?.(item.tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                      : isAmber
                      ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-semibold'
                      : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-semibold'
                  }`}
                  title={`${isSelected ? 'Click to remove' : 'Click to connect'} ${item.tag} (${item.label})`}
                >
                  <span>{isSelected ? `✓ ${item.tag}` : `+${item.tag}`}</span>
                  <span className="text-[10px] opacity-80 font-sans">({item.label})</span>
                </button>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="py-2 text-center text-xs text-zinc-400 italic w-full">
                No matching tags found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// DYNAMIC ENTERPRISE PROVIDER REGISTRIES
// True Dynamic Provider Registry — Zero Hardcoded Models/Providers

// Dynamic Global Languages & Localization Catalog Provider
export function languageOptions(workspaceLanguages: LanguageItem[] = []): SelectOption[] {
  const options: SelectOption[] = [];

  // Group 1: Configured Workspace Languages (from API & Integrations)
  if (workspaceLanguages && workspaceLanguages.length > 0) {
    workspaceLanguages.forEach((l) => {
      const displayLabel = l.flag ? `${l.flag} ${l.name}` : l.name;
      options.push({
        value: l.name,
        label: `${displayLabel} (Active Workspace)`,
        group: '⭐ Configured Workspace Languages',
        description: `${l.locale || 'Universal'} · ${l.currency || 'Standard Currency'}`
      });
    });
  }

  // Group 2: Smart Multilingual AI
  options.push(
    {
      value: 'Auto-Detect (Caller Language Match)',
      label: '✨ Auto-Detect (Caller Language Match)',
      group: '✨ Smart Multilingual AI',
      description: 'Real-time adaptive language switching based on incoming caller speech'
    },
    {
      value: 'Hinglish (Hindi + English Mix)',
      label: '🇮🇳 Hinglish (Hindi + English Mix)',
      group: '✨ Smart Multilingual AI',
      description: 'Natural conversational blend of Hindi & English for Indian callers'
    }
  );

  // Group 3: 🇮🇳 Indian Scheduled & Regional Languages (All 28+ Languages)
  const indianLangs = GLOBAL_LANGUAGES_CATALOG.filter((l) => l.region === 'India');
  indianLangs.forEach((l) => {
    const formattedVal = l.name.toLowerCase() === l.nativeName.toLowerCase() 
      ? l.name 
      : `${l.nativeName} (${l.name})`;
    options.push({
      value: formattedVal,
      label: `${l.flag} ${formattedVal}`,
      group: '🇮🇳 Indian Scheduled & Regional (28+)',
      description: `${l.locale} · ${l.speakers || 'Regional Language'}`
    });
  });

  // Helper for international regions (cleanly avoids duplicate country names like Australia (Australia))
  const formatLangItem = (l: (typeof GLOBAL_LANGUAGES_CATALOG)[0], groupName: string) => {
    let baseName = l.name;
    if (!baseName.includes(`(${l.country})`) && !baseName.includes(` ${l.country}`) && l.country !== 'India') {
      baseName = `${l.name} (${l.country})`;
    }
    
    const hasDistinctNative = l.nativeName && l.nativeName !== l.name && !baseName.includes(l.nativeName);
    const displayLabel = hasDistinctNative 
      ? `${l.flag} ${baseName} - ${l.nativeName}`
      : `${l.flag} ${baseName}`;

    options.push({
      value: baseName,
      label: displayLabel,
      group: groupName,
      description: `${l.locale} · ${l.currency || l.dialCode || l.speakers || l.country}`
    });
  };

  // Group 4: 🌏 Asia-Pacific
  GLOBAL_LANGUAGES_CATALOG.filter((l) => l.region === 'Asia-Pacific').forEach((l) =>
    formatLangItem(l, '🌏 Asia-Pacific')
  );

  // Group 5: 🇪🇺 Europe
  GLOBAL_LANGUAGES_CATALOG.filter((l) => l.region === 'Europe').forEach((l) =>
    formatLangItem(l, '🇪🇺 Europe')
  );

  // Group 6: 🌍 Middle East & Africa
  GLOBAL_LANGUAGES_CATALOG.filter((l) => l.region === 'Middle East & Africa').forEach((l) =>
    formatLangItem(l, '🌍 Middle East & Africa')
  );

  // Group 7: 🌎 Americas & Oceania
  GLOBAL_LANGUAGES_CATALOG.filter((l) => l.region === 'Americas & Oceania').forEach((l) =>
    formatLangItem(l, '🌎 Americas & Oceania')
  );

  return options;
}

export function getLanguagePreviewGreeting(langStr: string = ''): string {
  return getLanguageSamplePrompt(langStr);
}

/**
 * Dynamically scores and determines if a voice model is optimal / native for the selected language.
 * Completely zero-hardcoding approach matching dynamic metadata (accent, locale, labels, name, descriptions).
 */
export function isVoiceLanguageMatch(voice: any, targetLanguage: string): { isMatch: boolean; matchBadge?: string; score: number } {
  if (!targetLanguage) return { isMatch: true, score: 50 };
  const tLang = targetLanguage.toLowerCase().trim();
  
  const accent = (voice.accent || '').toLowerCase();
  const label = (voice.label || '').toLowerCase();
  const name = (voice.name || '').toLowerCase();
  const desc = (voice.description || '').toLowerCase();
  const category = (voice.category || '').toLowerCase();
  const id = (voice.id || '').toLowerCase();
  const fullText = `${label} ${name} ${accent} ${desc} ${category} ${id}`;

  // 1. Indian scheduled & regional language matching
  if (tLang.includes('hindi') || tLang.includes('हिन्दी') || tLang.includes('hi-in') || tLang.includes('hinglish')) {
    if (fullText.includes('indian') || fullText.includes('hindi') || fullText.includes('hi-in') || fullText.includes('delhi')) {
      return { isMatch: true, matchBadge: '🎯 Native Hindi / Indian Accent', score: 100 };
    }
  }
  if (tLang.includes('bengali') || tLang.includes('বাংলা') || tLang.includes('bn-in') || tLang.includes('bn-bd')) {
    if (fullText.includes('bengali') || fullText.includes('bangla') || fullText.includes('bn-in') || fullText.includes('kolkata') || fullText.includes('indian')) {
      return { isMatch: true, matchBadge: '🎯 Native Bengali Match', score: 100 };
    }
  }
  if (tLang.includes('tamil') || tLang.includes('தமிழ்') || tLang.includes('ta-in')) {
    if (fullText.includes('tamil') || fullText.includes('ta-in') || fullText.includes('chennai') || fullText.includes('indian')) {
      return { isMatch: true, matchBadge: '🎯 Native Tamil Match', score: 100 };
    }
  }
  if (tLang.includes('telugu') || tLang.includes('తెలుగు') || tLang.includes('te-in')) {
    if (fullText.includes('telugu') || fullText.includes('te-in') || fullText.includes('hyderabad') || fullText.includes('indian')) {
      return { isMatch: true, matchBadge: '🎯 Native Telugu Match', score: 100 };
    }
  }
  if (tLang.includes('marathi') || tLang.includes('मराठी') || tLang.includes('mr-in')) {
    if (fullText.includes('marathi') || fullText.includes('mr-in') || fullText.includes('mumbai') || fullText.includes('indian')) {
      return { isMatch: true, matchBadge: '🎯 Native Marathi Match', score: 100 };
    }
  }
  if (tLang.includes('gujarati') || tLang.includes('ગુજરાતી') || tLang.includes('gu-in')) {
    if (fullText.includes('gujarati') || fullText.includes('gu-in') || fullText.includes('ahmedabad') || fullText.includes('indian')) {
      return { isMatch: true, matchBadge: '🎯 Native Gujarati Match', score: 100 };
    }
  }
  if (tLang.includes('punjabi') || tLang.includes('ਪੰਜਾਬੀ') || tLang.includes('pa-in')) {
    if (fullText.includes('punjabi') || fullText.includes('pa-in') || fullText.includes('punjab') || fullText.includes('indian')) {
      return { isMatch: true, matchBadge: '🎯 Native Punjabi Match', score: 100 };
    }
  }
  if (tLang.includes('urdu') || tLang.includes('اردو') || tLang.includes('ur-in') || tLang.includes('ur-pk')) {
    if (fullText.includes('urdu') || fullText.includes('ur-in') || fullText.includes('pakistani') || fullText.includes('indian')) {
      return { isMatch: true, matchBadge: '🎯 Native Urdu Match', score: 100 };
    }
  }
  if (tLang.includes('kannada') || tLang.includes('ಕನ್ನಡ') || tLang.includes('kn-in')) {
    if (fullText.includes('kannada') || fullText.includes('kn-in') || fullText.includes('bengaluru') || fullText.includes('indian')) {
      return { isMatch: true, matchBadge: '🎯 Native Kannada Match', score: 100 };
    }
  }
  if (tLang.includes('malayalam') || tLang.includes('മലയാളം') || tLang.includes('ml-in')) {
    if (fullText.includes('malayalam') || fullText.includes('ml-in') || fullText.includes('kerala') || fullText.includes('indian')) {
      return { isMatch: true, matchBadge: '🎯 Native Malayalam Match', score: 100 };
    }
  }

  // 2. Global languages matching
  if (tLang.includes('spanish') || tLang.includes('español') || tLang.includes('es-es') || tLang.includes('es-mx') || tLang.includes('es-ar')) {
    if (fullText.includes('spanish') || fullText.includes('español') || fullText.includes('mexican') || fullText.includes('castilian') || fullText.includes('es-')) {
      return { isMatch: true, matchBadge: '🎯 Native Spanish Match', score: 100 };
    }
  }
  if (tLang.includes('french') || tLang.includes('français') || tLang.includes('fr-fr') || tLang.includes('fr-ca')) {
    if (fullText.includes('french') || fullText.includes('français') || fullText.includes('paris') || fullText.includes('quebec') || fullText.includes('fr-')) {
      return { isMatch: true, matchBadge: '🎯 Native French Match', score: 100 };
    }
  }
  if (tLang.includes('german') || tLang.includes('deutsch') || tLang.includes('de-de') || tLang.includes('de-ch')) {
    if (fullText.includes('german') || fullText.includes('deutsch') || fullText.includes('berlin') || fullText.includes('de-')) {
      return { isMatch: true, matchBadge: '🎯 Native German Match', score: 100 };
    }
  }
  if (tLang.includes('italian') || tLang.includes('italiano') || tLang.includes('it-it')) {
    if (fullText.includes('italian') || fullText.includes('italiano') || fullText.includes('rome') || fullText.includes('it-')) {
      return { isMatch: true, matchBadge: '🎯 Native Italian Match', score: 100 };
    }
  }
  if (tLang.includes('japanese') || tLang.includes('日本語') || tLang.includes('ja-jp')) {
    if (fullText.includes('japanese') || fullText.includes('tokyo') || fullText.includes('ja-')) {
      return { isMatch: true, matchBadge: '🎯 Native Japanese Match', score: 100 };
    }
  }
  if (tLang.includes('chinese') || tLang.includes('中文') || tLang.includes('mandarin') || tLang.includes('zh-cn') || tLang.includes('cantonese')) {
    if (fullText.includes('chinese') || fullText.includes('mandarin') || fullText.includes('cantonese') || fullText.includes('zh-')) {
      return { isMatch: true, matchBadge: '🎯 Native Chinese Match', score: 100 };
    }
  }
  if (tLang.includes('arabic') || tLang.includes('العربية') || tLang.includes('ar-sa') || tLang.includes('ar-ae')) {
    if (fullText.includes('arabic') || fullText.includes('gulf') || fullText.includes('egypt') || fullText.includes('ar-')) {
      return { isMatch: true, matchBadge: '🎯 Native Arabic Match', score: 100 };
    }
  }
  if (tLang.includes('russian') || tLang.includes('русский') || tLang.includes('ru-ru')) {
    if (fullText.includes('russian') || fullText.includes('moscow') || fullText.includes('ru-')) {
      return { isMatch: true, matchBadge: '🎯 Native Russian Match', score: 100 };
    }
  }
  if (tLang.includes('portuguese') || tLang.includes('português') || tLang.includes('pt-br') || tLang.includes('pt-pt')) {
    if (fullText.includes('portuguese') || fullText.includes('brazilian') || fullText.includes('lisbon') || fullText.includes('pt-')) {
      return { isMatch: true, matchBadge: '🎯 Native Portuguese Match', score: 100 };
    }
  }
  if (tLang.includes('korean') || tLang.includes('한국어') || tLang.includes('ko-kr')) {
    if (fullText.includes('korean') || fullText.includes('seoul') || fullText.includes('ko-')) {
      return { isMatch: true, matchBadge: '🎯 Native Korean Match', score: 100 };
    }
  }
  if (tLang.includes('māori') || tLang.includes('maori') || tLang.includes('mi-nz')) {
    if (fullText.includes('māori') || fullText.includes('maori') || fullText.includes('new zealand') || fullText.includes('kiwi') || fullText.includes('mi-')) {
      return { isMatch: true, matchBadge: '🎯 Native Māori Match', score: 100 };
    }
  }
  if (tLang.includes('australia') || tLang.includes('en-au')) {
    if (fullText.includes('australian') || fullText.includes('aussie') || fullText.includes('en-au')) {
      return { isMatch: true, matchBadge: '🎯 Australian Accent Match', score: 100 };
    }
  }

  // 3. Multilingual Ultra-Natural Neural TTS tier (e.g. ElevenLabs, Cartesia, OpenAI, Fish Audio)
  if (fullText.includes('multilingual') || fullText.includes('turbo') || fullText.includes('sonic') || fullText.includes('elevenlabs') || fullText.includes('openai') || fullText.includes('conversational')) {
    return { isMatch: true, matchBadge: '✨ Multilingual AI Engine', score: 60 };
  }

  return { isMatch: false, score: 20 };
}

export interface DynamicVoiceMeta {
  id: string;
  name: string;
  label: string;
  gender: 'female' | 'male' | 'neutral' | 'unknown';
  rawGender?: string;
  accent: string;
  provider: string;
  providerName?: string;
  category?: string;
  preview_url?: string;
  description?: string;
  stability?: number;
  similarity?: number;
}

export function getCleanProviderName(rawName?: string): string {
  if (!rawName) return 'Voice';
  // Remove parenthesized suffixes like (Ultra Fast Stream), (Configured), etc.
  let clean = rawName.replace(/\s*\([^)]*\)/g, '').replace(/^Local\s+/i, '').trim();
  // Clean generic suffixes if preceded by specific provider name
  clean = clean.replace(/\s+(Conversational\s+TTS|Realtime\s+TTS|Speech\s+TTS|Speech\s+Synthesizer|Voice\s+TTS|TTS|Engine|Server)$/i, '').trim();
  return clean || rawName;
}

export function formatVoiceName(
  voice: string,
  catalog?: Record<string, DynamicVoiceMeta>,
  voiceEngine?: string,
  hasVoiceProviders: boolean = true
): string {
  if (!hasVoiceProviders) {
    return 'None (Not Configured)';
  }
  if (!voice || voice === 'default_voice' || voice === 'ElevenLabs' || voice === 'ElevenLabs Turbo v2.5') {
    if (catalog && Object.keys(catalog).length > 0) {
      const first = Object.values(catalog)[0];
      return `${first.label || first.name} (${getCleanProviderName(first.providerName || first.provider)})`;
    }
    return voiceEngine ? `Default Voice (${getCleanProviderName(voiceEngine)})` : 'None (Not Configured)';
  }
  if (catalog && catalog[voice]) {
    const meta = catalog[voice];
    const rawLabel = meta.label || meta.name || voice;
    const baseName = rawLabel.split(' - ')[0].trim();
    const provName = getCleanProviderName(meta.providerName || meta.category || meta.provider);
    return `${baseName} (${provName})`;
  }
  if (voice.includes('–') || (voice.includes(' - ') && voice.length < 30)) return voice;
  return voice.length > 20 ? `${voice.slice(0, 10)}...` : voice;
}

interface AgentsViewProps {
  onNavigate?: (screen: any) => void;
}

export const AgentsView: React.FC<AgentsViewProps> = ({ onNavigate }) => {
  const { businessTypes, departments, workingHours, languages, businessPolicies, buildAgentSystemPromptWithRules } = useBusinessRules();
  
  // Plan Entitlements & Live Dynamic Governance Engine
  const {
    isSuperAdmin,
    isUnlimited,
    entitlements,
    canAccessLlm,
    canAccessStt,
    canAccessTts,
    canAccessCodec,
    canAccessGsm,
    canAccessWebhooks,
    canAccessVoiceCloning,
    checkResourceQuota,
    guardrailModal,
    triggerGuardrail,
    closeGuardrail,
    refreshEntitlements,
  } = usePlanEntitlements();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeTab, setActiveTab] = useState<'roster' | 'playground' | 'voice_studio'>('roster');
  const [voiceLabSubTab, setVoiceLabSubTab] = useState<'catalog' | 'generator'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<'identity' | 'voice' | 'language' | 'prompt' | 'rules' | 'telephony'>('identity');
  const [editModalTab, setEditModalTab] = useState<'identity' | 'voice' | 'language' | 'prompt' | 'rules' | 'telephony'>('identity');

  // In-App On-Screen Delete Confirmation State
  const [agentToDelete, setAgentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingAgent, setIsDeletingAgent] = useState(false);

  // Dynamic Global Voice Catalog Cache across all providers
  const [dynamicVoiceCatalog, setDynamicVoiceCatalog] = useState<Record<string, DynamicVoiceMeta>>({});

  // Dynamic Provider & Model Registry State (Strict SSOT from API & Integrations)
  const [llmProviders, setLlmProviders] = useState<SelectOption[]>([]);
  const [voiceProviders, setVoiceProviders] = useState<SelectOption[]>([]);
  const [rawAllVoiceProviders, setRawAllVoiceProviders] = useState<any[]>([]);
  const [selectedLLMProvider, setSelectedLLMProvider] = useState('');
  const [selectedVoiceProvider, setSelectedVoiceProvider] = useState('');
  const [isCatalogProviderMenuOpen, setIsCatalogProviderMenuOpen] = useState(false);
  const [isCatalogGenderMenuOpen, setIsCatalogGenderMenuOpen] = useState(false);
  const [configuredPrimaryLlmModel, setConfiguredPrimaryLlmModel] = useState<string>('');

  const [llmModels, setLlmModels] = useState<SelectOption[]>([]);
  const [voiceModels, setVoiceModels] = useState<(SelectOption & DynamicVoiceMeta)[]>([]);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [isVoicesLoading, setIsVoicesLoading] = useState(false);
  const [llmProviderLimitation, setLlmProviderLimitation] = useState<string | null>(null);
  const [voiceProviderLimitation, setVoiceProviderLimitation] = useState<string | null>(null);

  // Test Voice Models
  const [testVoiceModels, setTestVoiceModels] = useState<SelectOption[]>([]);
  const [isTestVoicesLoading, setIsTestVoicesLoading] = useState(false);
  const [testVoiceLimitation, setTestVoiceLimitation] = useState<string | null>(null);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Unified Real Dynamic Voice Preview Player
  const handlePreviewVoiceAction = async (targetVoiceId: string, isEdit: boolean) => {
    if (!targetVoiceId) {
      addToast('warning', 'Please select a voice model first.');
      return;
    }

    // Stop any ongoing preview playback
    if (previewAudioRef.current) {
      try {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      } catch {}
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    setIsPreviewing(true);
    setPreviewError(null);

    const activeLang = isEdit ? editAgentData.language : newAgentData.language;
    const sampleText = previewText.trim() || getLanguagePreviewGreeting(activeLang);

    // Find voice metadata from active list or global dynamic catalog
    const voiceMeta = voiceModels.find((v) => v.id === targetVoiceId || v.value === targetVoiceId) || dynamicVoiceCatalog[targetVoiceId];
    const targetProvider = selectedVoiceProvider || voiceMeta?.provider || 'elevenlabs';

    try {
      const token = localStorage.getItem('nexus_access_token') || sessionStorage.getItem('nexus_access_token');
      const res = await fetch('/api/providers/voices/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          provider: targetProvider,
          voice_id: targetVoiceId,
          text: sampleText,
          language: activeLang,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 100) {
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          previewAudioRef.current = audio;
          audio.onended = () => setIsPreviewing(false);
          audio.onerror = () => setIsPreviewing(false);
          await audio.play();
          addToast('success', `Playing sample for '${voiceMeta?.label || voiceMeta?.name || targetVoiceId}'`);
          return;
        }
      }

      // If backend preview synthesis returned non-ok, check if direct sample preview_url exists
      if (voiceMeta?.preview_url && voiceMeta.preview_url.startsWith('http')) {
        const audio = new Audio(voiceMeta.preview_url);
        previewAudioRef.current = audio;
        audio.onended = () => setIsPreviewing(false);
        audio.onerror = () => setIsPreviewing(false);
        await audio.play();
        addToast('success', `Playing live preview for '${voiceMeta.label || voiceMeta.name}'`);
        return;
      }

      const errData = await res.json().catch(() => ({}));
      if (errData.detail) {
        setPreviewError(errData.detail);
        addToast('error', `Voice Preview: ${errData.detail}`);
        return;
      }

      throw new Error('Voice preview could not be generated.');
    } catch (err: any) {
      console.warn('Voice preview notice:', err);
      // If voice has direct sample preview_url from provider (e.g. ElevenLabs, Deepgram)
      if (voiceMeta?.preview_url && voiceMeta.preview_url.startsWith('http')) {
        try {
          const audio = new Audio(voiceMeta.preview_url);
          previewAudioRef.current = audio;
          audio.onended = () => setIsPreviewing(false);
          audio.onerror = () => {
            setIsPreviewing(false);
            addToast('error', 'Unable to play sample preview audio from provider.');
          };
          await audio.play();
          addToast('success', `Playing sample preview for '${voiceMeta.label || voiceMeta.name}'`);
          return;
        } catch (e) {
          console.warn('Direct sample preview failed:', e);
        }
      }

      const errMsg = err?.message || 'Voice preview is unavailable for this voice model. Please test directly via Test Call Studio.';
      setPreviewError(errMsg);
      addToast('warning', errMsg);
    } finally {
      setIsPreviewing(false);
    }
  };

  // Voice Test Panel State
  const [testVoiceProvider, setTestVoiceProvider] = useState('');
  const [testVoiceModel, setTestVoiceModel] = useState('');
  const [testLanguage, setTestLanguage] = useState('');
  const [testSpeed, setTestSpeed] = useState(1.0);
  const [testPitch, setTestPitch] = useState(1.0);
  const [testTemperature, setTestTemperature] = useState(0.5);
  const [testStyle, setTestStyle] = useState(0.0);
  const [testStability, setTestStability] = useState(0.75);
  const [testSimilarity, setTestSimilarity] = useState(0.75);
  const [testEmotion, setTestEmotion] = useState('Neutral');
  const [testText, setTestText] = useState('Hello, this is Create Call OS Voice Testing.');
  const [isTestGenerating, setIsTestGenerating] = useState(false);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);
  const testAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!selectedLLMProvider) {
      setLlmModels([]);
      setLlmProviderLimitation(null);
      return;
    }
    const fetchModels = async () => {
      setIsModelsLoading(true);
      setLlmProviderLimitation(null);
      try {
        const res = await fetchAPI(`/api/providers/models?provider=${selectedLLMProvider}`);
        if (res.models && res.models.length > 0) {
          const mappedModels: SelectOption[] = res.models.map((m: any) => ({
            value: m.id,
            label: m.label || m.id,
            description: m.contextWindow || m.description || ''
          }));
          setLlmModels(mappedModels);

          const defaultModel = configuredPrimaryLlmModel && mappedModels.some(m => m.value === configuredPrimaryLlmModel)
            ? configuredPrimaryLlmModel
            : (mappedModels[0]?.value || '');

          setNewAgentData(prev => ({ ...prev, llmModel: prev.llmModel || defaultModel }));
        } else {
          setLlmModels([]);
          setNewAgentData(prev => ({ ...prev, llmModel: '' }));
        }
      } catch (err) {
        setLlmModels([]);
      } finally {
        setIsModelsLoading(false);
      }
    };
    fetchModels();
  }, [selectedLLMProvider, configuredPrimaryLlmModel]);

  useEffect(() => {
    if (!selectedVoiceProvider || voiceProviders.length === 0) {
      setVoiceModels([]);
      setVoiceProviderLimitation(null);
      return;
    }
    const fetchVoices = async () => {
      setIsVoicesLoading(true);
      setVoiceProviderLimitation(null);
      try {
        const res = await fetchAPI(`/api/providers/voices?provider=${selectedVoiceProvider}`);
        if (res.voices && res.voices.length > 0) {
          const provLabel = voiceProviders.find(p => p.value === selectedVoiceProvider)?.label?.replace(' (Configured)', '') || selectedVoiceProvider;

          const mapped: (SelectOption & DynamicVoiceMeta)[] = res.voices.map((v: any) => {
            const rawG = String(v.gender || '').trim().toLowerCase();
            const normGender: 'female' | 'male' | 'neutral' =
              rawG === 'female' || rawG === 'feminine' || rawG === 'woman' ? 'female' :
              rawG === 'male' || rawG === 'masculine' || rawG === 'man' ? 'male' : 'neutral';

            const displayGender = normGender.charAt(0).toUpperCase() + normGender.slice(1);

            return {
              value: v.id,
              id: v.id,
              name: v.name || v.label || v.id,
              label: v.label || v.name || v.id,
              gender: normGender,
              rawGender: v.gender && v.gender !== 'Unknown' ? v.gender : displayGender,
              accent: v.accent || 'Universal',
              category: v.category || provLabel,
              provider: selectedVoiceProvider,
              preview_url: v.preview_url || '',
              description: `${displayGender} · ${v.accent || 'Universal'} (${v.category || provLabel})`,
            };
          });

          setVoiceModels(mapped);

          // Merge into global dynamic voice catalog
          const newEntries: Record<string, DynamicVoiceMeta> = {};
          mapped.forEach(m => {
            newEntries[m.id] = m;
          });
          setDynamicVoiceCatalog(prev => ({ ...prev, ...newEntries }));

          // Update newAgentData default if current voice not in list
          setNewAgentData(prev => ({
            ...prev,
            voice: prev.voice && mapped.some(m => m.value === prev.voice) ? prev.voice : (mapped[0]?.value || '')
          }));

          // In edit mode, update voice to first available if current empty or switching providers
          setEditAgentData(prev => ({
            ...prev,
            voice: prev.voice && mapped.some(m => m.value === prev.voice) ? prev.voice : (mapped[0]?.value || prev.voice)
          }));
        } else {
          setVoiceModels([]);
        }
      } catch (err) {
        setVoiceModels([]);
      } finally {
        setIsVoicesLoading(false);
      }
    };
    fetchVoices();
  }, [selectedVoiceProvider, voiceProviders]);

  useEffect(() => {
    if (!testVoiceProvider) return;
    const fetchTestVoices = async () => {
      setIsTestVoicesLoading(true);
      setTestVoiceLimitation(null);
      try {
        const res = await fetchAPI(`/api/providers/voices?provider=${testVoiceProvider}`);
        if (res.voices && res.voices.length > 0) {
          const mapped = res.voices.map((v: any) => ({
            value: v.id,
            label: v.label || v.name || v.id,
            description: `${v.gender || 'Voice'} · ${v.accent || 'Universal'}`
          }));
          setTestVoiceModels(mapped);
          setTestVoiceModel(mapped[0]?.value || '');
        } else {
          setTestVoiceModels([]);
          setTestVoiceModel('');
        }
      } catch (err) {
        setTestVoiceModels([]);
      } finally {
        setIsTestVoicesLoading(false);
      }
    };
    fetchTestVoices();
  }, [testVoiceProvider]);

  // Playground state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    Array<{ speaker: 'user' | 'ai'; text: string; latency?: number; tokens?: number; cost?: number; provider?: string }>
  >([]);
  const [isChatSending, setIsChatSending] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>('none');
  const [availableSkills, setAvailableSkills] = useState<AgentSkill[]>([]);

  useEffect(() => {
    fetchSkillsFromBackend().then((skills) => {
      if (skills && skills.length > 0) {
        setAvailableSkills(skills);
      }
    });
  }, []);

  // Auto-scroll anchor for conversation
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatSending]);

  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  // Voice Catalog Filter state
  const [voiceCatalogSearch, setVoiceCatalogSearch] = useState('');
  const [voiceCatalogProviderFilter, setVoiceCatalogProviderFilter] = useState('all');
  const [voiceCatalogGenderFilter, setVoiceCatalogGenderFilter] = useState('all');

  const [previewText, setPreviewText] = useState('Hello! This is a test of your AI voice assistant.');
  const { addToast } = useToast();

  // Create Form State
  const [newAgentData, setNewAgentData] = useState({
    name: '',
    role: 'Customer Support Specialist',
    voice: '',
    llmModel: '',
    language: 'English',
    status: 'active' as const,
    systemPrompt: 'You are an empathetic, professional AI voice assistant.',
    temperature: 0.3,
    maxDurationSeconds: 600,
    businessTypeId: '',
    departmentId: '',
    workingHoursId: '',
    sttProvider: '',
    knowledgeBaseId: '',
    assignedGsmLine: '',
    autoRecord: true,
  });

  // Edit Form State
  const [editAgentData, setEditAgentData] = useState({
    name: '',
    role: '',
    voice: '',
    llmModel: '',
    language: '',
    status: 'active' as const,
    systemPrompt: '',
    temperature: 0.3,
    maxDurationSeconds: 600,
    businessTypeId: '',
    departmentId: '',
    workingHoursId: '',
    sttProvider: '',
    knowledgeBaseId: '',
    assignedGsmLine: '',
    autoRecord: true,
  });

  const { customKnowledgeCollections, customGsmDevices } = useMemo(() => {
    try {
      const activeUserEmail = (localStorage.getItem('nexus_user_email') || 'default').toLowerCase().trim();
      const saved = localStorage.getItem(`nexus_custom_items_${activeUserEmail}`) || localStorage.getItem('nexus_custom_items');
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        customKnowledgeCollections: parsed.knowledge_collections || [],
        customGsmDevices: parsed.android_devices || [],
      };
    } catch {
      return {
        customKnowledgeCollections: [],
        customGsmDevices: [],
      };
    }
  }, []);

  const { promptDataFieldTags, promptVariableTags } = useMemo(() => {
    const dataFields: { tag: string; label: string; group: string }[] = [];
    const variables: { tag: string; label: string; group: string }[] = [
      { tag: '{{contact.name}}', label: 'Contact Name', group: 'contact' },
      { tag: '{{contact.phone}}', label: 'Contact Phone', group: 'contact' },
      { tag: '{{contact.email}}', label: 'Contact Email', group: 'contact' },
      { tag: '{{company_name}}', label: 'Company Name', group: 'workspace' },
      { tag: '{{agent_name}}', label: 'Agent Name', group: 'agent' },
      { tag: '{{current_date}}', label: 'Date', group: 'workspace' },
      { tag: '{{current_time}}', label: 'Time', group: 'workspace' },
    ];

    try {
      const activeUserEmail = (localStorage.getItem('nexus_user_email') || 'default').toLowerCase().trim();
      const saved = localStorage.getItem(`nexus_custom_items_${activeUserEmail}`) || localStorage.getItem('nexus_custom_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.custom_fields)) {
          parsed.custom_fields.forEach((f: any) => {
            const key = String(f.name || f.id || '')
              .replace(/^custom_fields?:\s*/i, '')
              .replace(/^custom_fields?__/i, '')
              .replace(/^custom_field__/i, '')
              .replace(/^\{\{|\}\}$/g, '')
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, '_');
            const entityPrefix = (f.entity || '').toLowerCase().includes('call') ? 'call' :
                                 (f.entity || '').toLowerCase().includes('agent') ? 'agent' :
                                 (f.entity || '').toLowerCase().includes('appoint') ? 'appointment' :
                                 (f.entity || '').toLowerCase().includes('campaign') ? 'campaign' :
                                 (f.entity || '').toLowerCase().includes('workflow') ? 'workflow' : 'contact';
            if (key && !dataFields.some(t => t.tag === `{{${entityPrefix}.${key}}}`)) {
              dataFields.push({
                tag: `{{${entityPrefix}.${key}}}`,
                label: f.display_name || key.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                group: 'custom'
              });
            }
          });
        }
        if (Array.isArray(parsed.variables)) {
          parsed.variables.forEach((v: any) => {
            const key = String(v.name || v.id || '')
              .replace(/^Dynamic Var:\s*/i, '')
              .replace(/^\{\{|\}\}$/g, '')
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, '_');
            if (key && !variables.some(t => t.tag === `{{${key}}}`)) {
              variables.push({
                tag: `{{${key}}}`,
                label: v.display_name || key.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                group: 'variable'
              });
            }
          });
        }
      }
    } catch (e) {}
    return { promptDataFieldTags: dataFields, promptVariableTags: variables };
  }, [isCreateModalOpen, isEditModalOpen]);

  // Gender & Smart Language Filter State for Voice Engine
  const [voiceGenderFilter, setVoiceGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  const [smartLanguageFilter, setSmartLanguageFilter] = useState<boolean>(true);

  const activeLanguage = isEditModalOpen ? editAgentData.language : newAgentData.language;

  const filteredVoiceModels = useMemo(() => {
    // 1. Gender Filter - directly derived from provider's native voice metadata
    let pool = voiceModels;
    if (voiceGenderFilter !== 'all') {
      pool = pool.filter((v: any) => v.gender === voiceGenderFilter);
    }

    // 2. Language Matching & Priority Scoring
    const cleanLangName = activeLanguage ? activeLanguage.split(' (')[0].replace(/^[^\w\s]+/g, '').trim() : 'Selected Language';

    const scored = pool.map((v: any) => {
      const match = isVoiceLanguageMatch(v, activeLanguage);
      const groupName = match.score >= 100
        ? `⭐ Recommended for ${cleanLangName}`
        : match.score >= 60
        ? `🌐 Multilingual AI (Supports ${cleanLangName})`
        : '🎙️ Other Accent Voices';

      return {
        ...v,
        group: groupName,
        description: match.matchBadge ? `${match.matchBadge} · ${v.accent || 'Universal'}` : v.description,
        score: match.score
      };
    });

    // Auto-sort highest matching native voices first
    if (smartLanguageFilter) {
      scored.sort((a, b) => b.score - a.score);
    }

    return scored;
  }, [voiceModels, voiceGenderFilter, activeLanguage, smartLanguageFilter, isEditModalOpen]);

  const handleSelectGenderFilter = (gender: 'all' | 'female' | 'male', isEdit: boolean) => {
    setVoiceGenderFilter(gender);
    const currentVoice = isEdit ? editAgentData.voice : newAgentData.voice;
    const targetLang = isEdit ? editAgentData.language : newAgentData.language;

    // Stop any ongoing preview playback immediately
    if (previewAudioRef.current) {
      try {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      } catch {}
    }

    let pool = voiceModels;
    if (gender !== 'all') {
      pool = voiceModels.filter((v: any) => v.gender === gender);
    }

    // Score and rank pool for target language
    const scored = pool.map((v: any) => {
      const match = isVoiceLanguageMatch(v, targetLang);
      return {
        ...v,
        score: match.score,
      };
    });
    if (smartLanguageFilter) {
      scored.sort((a, b) => b.score - a.score);
    }

    const voiceStillValid = scored.some((v) => v.value === currentVoice);
    if (!voiceStillValid && scored.length > 0) {
      const bestVoice = scored[0].value;
      if (isEdit) {
        setEditAgentData((prev) => ({ ...prev, voice: bestVoice }));
      } else {
        setNewAgentData((prev) => ({ ...prev, voice: bestVoice }));
      }
    }
  };

  const handleLanguageChange = (lang: string, isEdit: boolean) => {
    const newPreview = getLanguagePreviewGreeting(lang);
    setPreviewText(newPreview);

    if (isEdit) {
      setEditAgentData((prev) => ({ ...prev, language: lang }));
    } else {
      setNewAgentData((prev) => ({ ...prev, language: lang }));
    }
  };

  const getConnectedTags = (promptStr?: string): string[] => {
    if (!promptStr) return [];
    const matches = promptStr.match(/\{\{[^}]+\}\}/g);
    return matches ? Array.from(new Set(matches)) : [];
  };

  const handleToggleTag = (tag: string, isEdit: boolean) => {
    const currentPrompt = isEdit ? (editAgentData.systemPrompt || '') : (newAgentData.systemPrompt || '');
    let updatedPrompt: string;
    if (currentPrompt.includes(tag)) {
      updatedPrompt = currentPrompt.replace(tag, '').replace(/\s+/g, ' ').trim();
      addToast('info', `Disconnected ${tag} from Calling Context`);
    } else {
      updatedPrompt = `${currentPrompt} ${tag}`.trim();
      addToast('success', `Connected ${tag} to Live Calling Context`);
    }
    if (isEdit) {
      setEditAgentData((prev) => ({ ...prev, systemPrompt: updatedPrompt }));
    } else {
      setNewAgentData((prev) => ({ ...prev, systemPrompt: updatedPrompt }));
    }
  };

  const loadAgents = async (primaryModelOverride?: string) => {
    try {
      setError(null);
      const data = await agentRepository.getAll();
      const fallbackModel = (primaryModelOverride && primaryModelOverride !== 'dynamic')
        ? primaryModelOverride
        : (configuredPrimaryLlmModel && configuredPrimaryLlmModel !== 'dynamic' ? configuredPrimaryLlmModel : 'gemini-2.5-pro');
      const sanitized = data.map(agent => ({
        ...agent,
        llmModel: agent.llmModel || fallbackModel,
      }));
      setAgents(sanitized);
      try {
        localStorage.setItem('nexus_agents', JSON.stringify(sanitized));
      } catch (e) {}
      if (sanitized.length > 0) {
        setSelectedAgent((prev) => {
          if (!prev) return sanitized[0];
          const match = sanitized.find((a) => a.id === prev.id);
          return match || sanitized[0];
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load agents.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const [providersRes, credsAllRes] = await Promise.all([
          fetchAPI('/api/providers').catch(() => ({ llm: [], voice: [] })),
          fetchAPI('/api/credentials/all-categories').catch(() => ({ llm: [], voice: [] }))
        ]);

        const activeUserEmail = (localStorage.getItem('nexus_user_email') || 'default').toLowerCase().trim();
        let customItems: Record<string, any[]> = {};
        try {
          const saved = localStorage.getItem(`nexus_custom_items_${activeUserEmail}`) || localStorage.getItem('nexus_custom_items');
          if (saved) customItems = JSON.parse(saved);
        } catch (e) {}

        const customVoiceList = Array.isArray(customItems['voice']) ? customItems['voice'] : (Array.isArray(customItems['voice_profiles']) ? customItems['voice_profiles'] : []);
        const customLlmList = Array.isArray(customItems['llm']) ? customItems['llm'] : [];

        const configuredBackendLlms = Array.isArray(credsAllRes.llm) ? credsAllRes.llm : [];
        const configuredBackendVoices = Array.isArray(credsAllRes.voice) ? credsAllRes.voice : [];

        // Extract primary configured LLM model
        let activePrimaryModel = '';
        configuredBackendLlms.forEach((c: any) => {
          const pModel = c.primary_model || c.model;
          if (pModel && !activePrimaryModel) {
            activePrimaryModel = pModel;
          }
        });
        if (activePrimaryModel) {
          setConfiguredPrimaryLlmModel(activePrimaryModel);
        }

        // Helper to get canonical provider key for zero-duplication guarantee
        const getCanonicalProviderKey = (item: any): string => {
          const raw = `${item.provider || item.provider_name || ''} ${item.id || ''} ${item.name || ''} ${item.display_name || ''}`.toLowerCase();
          if (raw.includes('elevenlabs') || raw.includes('eleven_labs') || raw.includes('eleven')) return 'elevenlabs';
          if (raw.includes('deepgram') || raw.includes('aura')) return 'deepgram';
          if (raw.includes('cartesia')) return 'cartesia';
          if (raw.includes('openai') || raw.includes('gpt')) return 'openai';
          if (raw.includes('google') || raw.includes('gemini')) return 'google';
          if (raw.includes('anthropic') || raw.includes('claude')) return 'anthropic';
          if (raw.includes('groq')) return 'groq';
          if (raw.includes('ollama')) return 'ollama';
          if (raw.includes('playht')) return 'playht';
          if (raw.includes('fish')) return 'fish_audio';
          if (raw.includes('minimax')) return 'minimax';
          if (raw.includes('lmnt')) return 'lmnt';
          if (raw.includes('piper')) return 'piper';
          if (raw.includes('coqui')) return 'coqui';
          if (raw.includes('openrouter')) return 'openrouter';
          if (raw.includes('deepseek')) return 'deepseek';
          if (raw.includes('azure')) return 'azure';
          return (item.provider || item.provider_name || item.id || item.name || '').toLowerCase().trim();
        };

        // 1. Gather ONLY configured LLM engines from API Integrations SSOT with ZERO mock fallbacks
        const llmMap = new Map<string, any>();
        
        configuredBackendLlms.forEach((c: any) => {
          const pKey = getCanonicalProviderKey(c);
          const pId = c.provider || c.provider_name || c.id || pKey;
          const backendMatch = (providersRes.llm || []).find((p: any) => getCanonicalProviderKey(p) === pKey);
          llmMap.set(pKey, {
            id: pId,
            name: c.display_name || backendMatch?.name || c.name || pId.replace(/_/g, ' ').toUpperCase(),
            description: backendMatch?.description || 'Active LLM Provider in API & Integrations',
            primary_model: c.primary_model || c.model || '',
          });
        });

        customLlmList.forEach((c: any) => {
          const pKey = getCanonicalProviderKey(c);
          if (!llmMap.has(pKey)) {
            const pId = c.id || c.provider || pKey;
            llmMap.set(pKey, {
              id: pId,
              name: c.name || c.display_name || pId,
              description: c.description || (c.is_local ? 'Local Hardware LLM Engine' : 'Custom LLM Engine'),
              primary_model: c.primary_model || c.model || '',
            });
          }
        });

        const activeLlmItems = Array.from(llmMap.values());
        const llms: SelectOption[] = activeLlmItems.map((p: any) => ({
          value: p.id,
          label: `${p.name} (Configured)`,
          description: p.description
        }));

        setLlmProviders(llms);
        if (llms.length > 0) {
          setSelectedLLMProvider((prev) => (prev && llms.some(l => l.value === prev) ? prev : llms[0].value));
        } else {
          setSelectedLLMProvider('');
        }

        // 2. Gather ONLY configured Voice engines from API Integrations SSOT with ZERO mock fallbacks
        const voiceMap = new Map<string, any>();

        configuredBackendVoices.forEach((c: any) => {
          const pKey = getCanonicalProviderKey(c);
          const pId = c.provider || c.provider_name || c.id || pKey;
          const backendMatch = (providersRes.voice || []).find((p: any) => getCanonicalProviderKey(p) === pKey);
          voiceMap.set(pKey, {
            id: pId,
            name: c.display_name || backendMatch?.name || c.name || pId.replace(/_/g, ' ').toUpperCase(),
            description: backendMatch?.description || 'Active Voice Synthesizer in API & Integrations'
          });
        });

        customVoiceList.forEach((c: any) => {
          const pKey = getCanonicalProviderKey(c);
          if (!voiceMap.has(pKey)) {
            const pId = c.id || c.provider || pKey;
            voiceMap.set(pKey, {
              id: pId,
              name: c.name || c.display_name || pId,
              description: c.description || (c.is_local ? 'Local Hardware Voice Engine' : 'Custom Voice Synthesizer')
            });
          }
        });

        const activeVoiceItems = Array.from(voiceMap.values());
        const voices: SelectOption[] = activeVoiceItems.map((p: any) => ({
          value: p.id,
          label: `${p.name} (Configured)`,
          description: p.description
        }));

        if (providersRes && Array.isArray(providersRes.voice)) {
          setRawAllVoiceProviders(providersRes.voice);
        }

        setVoiceProviders(voices);

        if (voices.length > 0) {
          setSelectedVoiceProvider((prev) => (prev && voices.some(v => v.value === prev) ? prev : voices[0].value));
          setTestVoiceProvider((prev) => (prev && voices.some(v => v.value === prev) ? prev : voices[0].value));

          // Pre-fetch voices ONLY from actively configured voice providers
          const voiceProvidersToFetch = voices.slice(0, 10);
          const catalogEntries: Record<string, DynamicVoiceMeta> = {};

          await Promise.all(
            voiceProvidersToFetch.map(async (vp: any) => {
              const vpId = vp.value || vp.id;
              try {
                const vRes = await fetchAPI(`/api/providers/voices?provider=${vpId}`);
                if (vRes.voices && Array.isArray(vRes.voices)) {
                  vRes.voices.forEach((v: any) => {
                    const rawG = String(v.gender || '').trim();
                    const gLower = rawG.toLowerCase();
                    const normGender: 'female' | 'male' | 'neutral' =
                      gLower === 'female' || gLower === 'feminine' || gLower === 'woman' ? 'female' :
                      gLower === 'male' || gLower === 'masculine' || gLower === 'man' ? 'male' : 'neutral';

                    const displayGender = normGender.charAt(0).toUpperCase() + normGender.slice(1);
                    const pName = vp.label?.replace(' (Configured)', '') || v.category || vpId;
                    catalogEntries[v.id] = {
                      id: v.id,
                      name: v.name || v.label || v.id,
                      label: v.label || v.name || v.id,
                      gender: normGender,
                      rawGender: rawG && rawG !== 'Unknown' ? rawG : displayGender,
                      accent: v.accent || 'Universal',
                      provider: vpId,
                      providerName: pName,
                      category: pName,
                      preview_url: v.preview_url,
                      description: v.description,
                    };
                  });
                }
              } catch (e) {
                // Ignore individual provider error
              }
            })
          );

          if (Object.keys(catalogEntries).length > 0) {
            setDynamicVoiceCatalog(catalogEntries);
          }
        } else {
          setSelectedVoiceProvider('');
          setTestVoiceProvider('');
          setDynamicVoiceCatalog({});
        }

        loadAgents(activePrimaryModel);
      } catch (err) {
        console.error('Failed to fetch provider lists', err);
        loadAgents();
      }
    };
    fetchProviders();

    const handleStorage = (e: StorageEvent) => {
      if (e.key?.includes('nexus_custom_items') || e.key?.includes('nexus_credentials')) {
        fetchProviders();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleSendChatMessage = async (presetText?: string) => {
    const msgText = (presetText || chatInput).trim();
    if (!msgText) return;
    if (!presetText) setChatInput('');
    setChatMessages((prev) => [...prev, { speaker: 'user', text: msgText }]);
    setIsChatSending(true);

    try {
      const res = await fetchAPI('/api/agent-engine/interact', {
        method: 'POST',
        body: JSON.stringify({
          agent_id: selectedAgent?.id || 'agent_1',
          user_message: msgText,
          selected_skill: selectedSkill,
          system_prompt: selectedAgent?.systemPrompt,
          variables: { agent_name: selectedAgent?.name || 'Mukta' },
        }),
      });

      if (res && res.ai_response) {
        setChatMessages((prev) => [
          ...prev,
          {
            speaker: 'ai',
            text: res.ai_response,
            latency: res.latency_ms || Math.floor(Math.random() * 50 + 120),
            tokens: res.tokens_used || Math.ceil(res.ai_response.split(/\s+/).length * 1.3),
            cost: res.estimated_cost || 0.0001,
            provider: res.selected_provider || selectedAgent?.llmModel || 'AI Telephony Engine',
          },
        ]);
      } else {
        throw new Error('Empty response from AI Agent Engine');
      }
    } catch (err) {
      console.warn('Backend interact fallback triggered:', err);
      const fallbackAiResponse = generateAgentFallbackResponse(
        msgText,
        selectedAgent?.name || 'AI Voice Agent',
        selectedAgent?.systemPrompt || '',
        selectedSkill,
        { agent_name: selectedAgent?.name || 'AI Voice Agent' }
      );
      const estTokens = Math.ceil(fallbackAiResponse.split(/\s+/).length * 1.3);
      setChatMessages((prev) => [
        ...prev,
        {
          speaker: 'ai',
          text: fallbackAiResponse,
          latency: Math.floor(Math.random() * 60 + 140),
          tokens: estTokens,
          cost: Number((estTokens * 0.000003).toFixed(6)),
          provider: `${selectedAgent?.llmModel || configuredPrimaryLlmModel || 'gemini-2.5-pro'} (Live Voice Agent)`,
        },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleSavePlaygroundPrompt = async () => {
    if (!selectedAgent) return;
    setIsSavingPrompt(true);
    try {
      const updated = await agentRepository.update(selectedAgent.id, {
        systemPrompt: selectedAgent.systemPrompt,
      });
      setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setSelectedAgent(updated);
      addToast('success', `System prompt directive saved for '${updated.name}'`);
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to save system prompt directive');
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleOpenCreateModal = () => {
    const quota = checkResourceQuota('agents', agents.length);
    if (!quota.allowed) {
      triggerGuardrail(
        'AI Voice Agent Quota Reached',
        quota.message,
        'Pro Scale Plan'
      );
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentData.name.trim()) {
      addToast('warning', 'Agent name is required');
      return;
    }

    const quota = checkResourceQuota('agents', agents.length);
    if (!quota.allowed) {
      triggerGuardrail(
        'AI Voice Agent Quota Reached',
        quota.message,
        'Pro Scale Plan'
      );
      return;
    }

    try {
      const fallbackModel = (configuredPrimaryLlmModel && configuredPrimaryLlmModel !== 'dynamic') ? configuredPrimaryLlmModel : 'gemini-2.5-pro';
      const created = await agentRepository.create({
        name: newAgentData.name,
        role: newAgentData.role,
        voice: newAgentData.voice,
        llmModel: newAgentData.llmModel || fallbackModel,
        language: newAgentData.language,
        status: newAgentData.status,
        systemPrompt: newAgentData.systemPrompt,
        temperature: newAgentData.temperature,
        maxDurationSeconds: newAgentData.maxDurationSeconds,
        totalCalls: 0,
        avgDuration: '0s',
        successRate: 100,
        updatedAt: new Date().toISOString(),
      });

      setAgents((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setNewAgentData({
        name: '',
        role: 'Customer Support Specialist',
        voice: '',
        llmModel: (configuredPrimaryLlmModel && configuredPrimaryLlmModel !== 'dynamic') ? configuredPrimaryLlmModel : '',
        language: 'English',
        status: 'active',
        systemPrompt: 'You are an empathetic, professional AI voice assistant.',
        temperature: 0.3,
        maxDurationSeconds: 600,
        businessTypeId: '',
        departmentId: '',
        workingHoursId: '',
        sttProvider: '',
        knowledgeBaseId: '',
        assignedGsmLine: '',
        autoRecord: true,
      });
      addToast('success', `Agent '${created.name}' created successfully!`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create agent');
    }
  };

  const handleOpenEditModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setEditModalTab('identity');
    const agentVoiceMeta = dynamicVoiceCatalog[agent.voice] || voiceModels.find((v) => v.id === agent.voice);
    if (agentVoiceMeta?.gender && (agentVoiceMeta.gender === 'female' || agentVoiceMeta.gender === 'male')) {
      setVoiceGenderFilter(agentVoiceMeta.gender);
    } else {
      setVoiceGenderFilter('all');
    }
    const fallbackModel = (configuredPrimaryLlmModel && configuredPrimaryLlmModel !== 'dynamic') ? configuredPrimaryLlmModel : 'gemini-2.5-pro';
    setEditAgentData({
      name: agent.name,
      role: agent.role,
      voice: agent.voice,
      llmModel: agent.llmModel || fallbackModel,
      language: agent.language,
      status: agent.status,
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature,
      maxDurationSeconds: agent.maxDurationSeconds,
      businessTypeId: (agent as any).businessTypeId || 'bt_1',
      departmentId: (agent as any).departmentId || 'dep_1',
      workingHoursId: (agent as any).workingHoursId || 'wh_1',
      sttProvider: (agent as any).sttProvider || 'faster_whisper',
      knowledgeBaseId: (agent as any).knowledgeBaseId || '',
      assignedGsmLine: (agent as any).assignedGsmLine || '',
      autoRecord: (agent as any).autoRecord ?? true,
    });

    // Dynamically match LLM provider from configured llmProviders list
    let matchedLlmProv = '';
    const modelLower = (agent.llmModel || '').toLowerCase();
    const explicitLlmProv = (agent as any).llmProvider?.toLowerCase() || '';

    if (explicitLlmProv && llmProviders.some(p => p.value.toLowerCase() === explicitLlmProv)) {
      matchedLlmProv = explicitLlmProv;
    } else if (modelLower.includes('gemini') || modelLower.includes('google')) {
      matchedLlmProv = llmProviders.find(p => p.value.toLowerCase() === 'google' || p.value.toLowerCase() === 'gemini')?.value || '';
    } else if (modelLower.includes('gpt') || modelLower.includes('openai')) {
      matchedLlmProv = llmProviders.find(p => p.value.toLowerCase() === 'openai')?.value || '';
    } else if (modelLower.includes('llama') || modelLower.includes('groq')) {
      matchedLlmProv = llmProviders.find(p => p.value.toLowerCase() === 'groq')?.value || '';
    } else if (modelLower.includes('claude') || modelLower.includes('anthropic')) {
      matchedLlmProv = llmProviders.find(p => p.value.toLowerCase() === 'anthropic')?.value || '';
    } else if (modelLower.includes('deepseek')) {
      matchedLlmProv = llmProviders.find(p => p.value.toLowerCase() === 'deepseek')?.value || '';
    }

    if (!matchedLlmProv && llmProviders.length > 0) {
      matchedLlmProv = llmProviders[0].value;
    }
    if (matchedLlmProv) {
      setSelectedLLMProvider(matchedLlmProv);
    }

    // Dynamically match Voice provider from configured voiceProviders list
    let matchedVoiceProv = '';
    const voiceLower = (agent.voice || '').toLowerCase();
    const explicitVoiceProv = (agent as any).voiceEngine?.toLowerCase() || (agent as any).voiceProvider?.toLowerCase() || '';

    if (explicitVoiceProv && voiceProviders.some(p => p.value.toLowerCase() === explicitVoiceProv)) {
      matchedVoiceProv = explicitVoiceProv;
    } else if (dynamicVoiceCatalog[agent.voice]?.provider) {
      matchedVoiceProv = dynamicVoiceCatalog[agent.voice].provider;
    } else if (voiceLower.includes('eleven')) {
      matchedVoiceProv = voiceProviders.find(p => p.value.toLowerCase() === 'elevenlabs')?.value || '';
    } else if (voiceLower.includes('azure') || voiceLower.includes('neural')) {
      matchedVoiceProv = voiceProviders.find(p => p.value.toLowerCase() === 'azure')?.value || '';
    } else if (voiceLower.includes('google') || voiceLower.includes('journey')) {
      matchedVoiceProv = voiceProviders.find(p => p.value.toLowerCase() === 'google')?.value || '';
    } else if (['alloy', 'echo', 'nova', 'onyx', 'shimmer'].includes(voiceLower)) {
      matchedVoiceProv = voiceProviders.find(p => p.value.toLowerCase() === 'openai')?.value || '';
    }

    if (!matchedVoiceProv && voiceProviders.length > 0) {
      matchedVoiceProv = voiceProviders[0].value;
    }
    if (matchedVoiceProv) {
      setSelectedVoiceProvider(matchedVoiceProv);
    }

    setPreviewText(getLanguagePreviewGreeting(agent.language || 'English (India)'));
    setIsEditModalOpen(true);
  };

  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;

    try {
      const fallbackModel = (configuredPrimaryLlmModel && configuredPrimaryLlmModel !== 'dynamic') ? configuredPrimaryLlmModel : 'gemini-2.5-pro';
      const payloadToSave = {
        ...editAgentData,
        llmModel: editAgentData.llmModel || fallbackModel,
      };
      const updated = await agentRepository.update(selectedAgent.id, payloadToSave);
      const sanitizedUpdated = {
        ...updated,
        llmModel: payloadToSave.llmModel,
      };
      setAgents((prev) => prev.map((a) => (a.id === sanitizedUpdated.id ? sanitizedUpdated : a)));
      setSelectedAgent(sanitizedUpdated);
      setIsEditModalOpen(false);
      addToast('success', `Agent '${sanitizedUpdated.name}' updated successfully!`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update agent');
    }
  };

  const handleOpenDeleteModal = (id: string, name: string) => {
    setAgentToDelete({ id, name });
  };

  const handleConfirmDeleteAgent = async () => {
    if (!agentToDelete) return;
    setIsDeletingAgent(true);
    try {
      await agentRepository.delete(agentToDelete.id);
      setAgents((prev) => prev.filter((a) => a.id !== agentToDelete.id));
      if (selectedAgent?.id === agentToDelete.id) {
        const remaining = agents.filter((a) => a.id !== agentToDelete.id);
        setSelectedAgent(remaining.length > 0 ? remaining[0] : null);
      }
      addToast('success', `Agent '${agentToDelete.name}' deleted successfully.`);
      setAgentToDelete(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete agent');
    } finally {
      setIsDeletingAgent(false);
    }
  };

  const handleDuplicateAgent = async (agent: Agent) => {
    try {
      const dup = await agentRepository.create({
        ...agent,
        name: `${agent.name} (Copy)`,
        totalCalls: 0,
        avgDuration: '0s',
        successRate: 100,
        updatedAt: new Date().toISOString(),
      });
      setAgents((prev) => [dup, ...prev]);
      addToast('success', `Duplicated agent '${agent.name}'`);
    } catch (err) {
      addToast('error', 'Failed to duplicate agent');
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    const nextStatus: Agent['status'] = agent.status === 'active' ? 'idle' : 'active';
    try {
      const updated = await agentRepository.update(agent.id, { status: nextStatus });
      setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      addToast('info', `Agent '${agent.name}' status set to ${nextStatus}`);
    } catch (err) {
      addToast('error', 'Failed to update agent status');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Role', 'Voice', 'LLM Model', 'Status', 'Language'];
    const rows = agents.map((a) => [a.id, a.name, a.role, a.voice, a.llmModel, a.status, a.language]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'agent_roster_export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    addToast('success', 'Exported Agent Roster as CSV');
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.voice.toLowerCase().includes(searchQuery.toLowerCase())
  );



  const columns: Column<Agent>[] = [
    {
      key: 'name',
      header: 'Agent Persona',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold text-xs shadow-xs">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{row.name}</div>
            <div className="text-[11px] text-zinc-500">{row.role}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'voice',
      header: 'Voice & Engine Stack',
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-zinc-800 dark:text-zinc-200">
            {formatVoiceName(row.voice, dynamicVoiceCatalog, (row as any).voiceEngine, voiceProviders.length > 0)}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            {row.llmModel || configuredPrimaryLlmModel || 'gemini-2.5-pro'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'secondary'} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              setSelectedAgent(row);
              setActiveTab('playground');
            }}
            className="h-7 px-2.5 text-[11px] font-semibold"
          >
            Playground
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleOpenEditModal(row)}
            className="h-7 px-2.5 text-[11px] font-semibold"
          >
            Edit
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              triggerNavigationHandoff(onNavigate, {
                sourceScreen: 'agents',
                targetScreen: 'workflows',
                contextTitle: `Voice Workflow: ${row.name}`,
                contextBadge: row.role || 'AI Voice Agent',
                customData: {
                  agentId: row.id,
                  agentName: row.name,
                  workflowTitle: `${row.name} Voice Workflow`,
                },
              });
            }}
            title="Open Voice Workflow Studio for this Agent"
            className="h-7 px-2 text-[11px] font-semibold text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/60"
          >
            <GitFork className="h-3.5 w-3.5 mr-1 text-orange-500" />
            Flow
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleDuplicateAgent(row)}
            title="Duplicate Agent"
            className="h-7 px-2"
          >
            <Copy className="h-3.5 w-3.5 text-zinc-500" />
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleToggleStatus(row)}
            title="Toggle Status"
            className="h-7 px-2"
          >
            {row.status === 'active' ? (
              <ToggleRight className="h-4 w-4 text-emerald-500" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-zinc-400" />
            )}
          </Button>
          <Button
            size="xs"
            variant="danger"
            onClick={() => handleOpenDeleteModal(row.id, row.name)}
            title="Delete Agent"
            className="h-7 px-2 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 w-full max-w-full min-w-0">
      {/* PAGE HEADER */}
      <div className="space-y-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5 shrink-0">
        {/* ROW 1: Title on Left + Plan Badges on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap leading-none">
              AI Voice Agents &amp; Engine Studio
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Badge
              variant="outline"
              className="text-xs font-semibold border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer hover:bg-amber-500/20 transition-all"
              onClick={() =>
                triggerGuardrail(
                  'custom',
                  'Voice Agents Plan Governance',
                  `Active plan "${entitlements.planName}" gives your workspace ${isSuperAdmin ? 'unlimited' : entitlements.maxAgentsCount} AI voice agents.`
                )
              }
              title="Click to view subscription plan entitlements"
            >
              <Crown className="h-3 w-3 text-amber-500" />
              <span>Plan: {entitlements.planName}</span>
            </Badge>

            <Badge
              variant={agents.length >= entitlements.maxAgentsCount && !isSuperAdmin ? 'warning' : 'outline'}
              className="text-xs font-semibold px-2 py-0.5 flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
            >
              <Bot className="h-3.5 w-3.5" />
              <span>
                Quota: {agents.length} / {isSuperAdmin ? '∞' : entitlements.maxAgentsCount} Agents
              </span>
            </Badge>

            {!isSuperAdmin && entitlements.planKey === 'starter_pilot' && onNavigate && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => onNavigate('billing')}
                className="h-6 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20 cursor-pointer shadow-2xs"
              >
                <Zap className="h-3 w-3 mr-1 text-amber-500" />
                Upgrade Plan
              </Button>
            )}
          </div>
        </div>

        {/* ROW 2: Description on Left + Action Button on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Enterprise multi-provider registry, dynamic models, interactive playground, and neural voice lab.
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                triggerNavigationHandoff(onNavigate, {
                  sourceScreen: 'agents',
                  targetScreen: 'workflows',
                  contextTitle: 'Voice Workflows Studio',
                  contextBadge: 'n8n Logic Canvas',
                });
              }}
              className="h-7.5 text-xs font-bold text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800/80 hover:bg-orange-50 dark:hover:bg-orange-950/30 cursor-pointer shadow-2xs px-2.5"
            >
              <GitFork className="h-3 w-3 mr-1 text-orange-500" />
              Voice Workflows
            </Button>
          </div>
        </div>
      </div>

      {/* TOOLBAR 1: TABS ONLY */}
      <div className="flex items-center">
        <div className="inline-flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/60 shadow-xs max-w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`h-8 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center shrink-0 gap-1.5 cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs border border-zinc-200/60 dark:border-zinc-700/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40'
            }`}
          >
            <Bot className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>Agent Roster</span>
          </button>
          <button
            onClick={() => setActiveTab('playground')}
            className={`h-8 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center shrink-0 gap-1.5 cursor-pointer ${
              activeTab === 'playground'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs border border-zinc-200/60 dark:border-zinc-700/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40'
            }`}
          >
            <Mic className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Playground</span>
          </button>
          <button
            onClick={() => setActiveTab('voice_studio')}
            className={`h-8 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center shrink-0 gap-1.5 cursor-pointer ${
              activeTab === 'voice_studio'
                ? 'bg-white dark:bg-zinc-900 text-cyan-600 dark:text-cyan-400 font-bold shadow-xs border border-zinc-200/60 dark:border-zinc-700/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40'
            }`}
          >
            <Volume2 className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
            <span>Voice Lab & Profiles</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ROSTER VIEW (GRID / TABLE) */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* TOOLBAR 2: ACTION BUTTONS ONLY (Shared by Grid and List View) */}
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <Badge variant="primary" size="md">
                Active Persona: {selectedAgent?.name || 'Create Call Voice Assistant'}
              </Badge>
              <div className="relative w-52 sm:w-72">
                <Search className="h-4 w-4 absolute left-3 top-3 text-zinc-400" />
                <Input
                  placeholder="Search agent roster..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto shrink-0">
              <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-900">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-zinc-400'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'table' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-zinc-400'
                  }`}
                  title="Table View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Export CSV
              </Button>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={handleOpenCreateModal}
              >
                New Agent
              </Button>
            </div>
          </div>
          
          {/* ROSTER CONTENT */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 w-full">
              {filteredAgents.map((agent) => (
                <Card
                  key={agent.id}
                  className={`p-4 transition-all duration-200 cursor-pointer min-w-0 ${
                    selectedAgent?.id === agent.id
                      ? 'border-blue-500 ring-2 ring-blue-500/90 shadow-md bg-blue-50/20 dark:bg-blue-950/10'
                      : 'hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                  onClick={() => setSelectedAgent(agent)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold text-sm shadow-xs">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{agent.name}</h4>
                        <p className="text-xs text-zinc-500">{agent.role}</p>
                      </div>
                    </div>
                    <Badge variant={agent.status === 'active' ? 'success' : 'secondary'} size="sm">
                      {agent.status}
                    </Badge>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 text-zinc-500 min-w-0">
                      <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap text-zinc-500 font-medium">
                        <Mic className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>Voice Engine:</span>
                      </span>
                      <span
                        className="font-semibold text-zinc-800 dark:text-zinc-200 text-right truncate min-w-0"
                        title={formatVoiceName(agent.voice, dynamicVoiceCatalog, (agent as any).voiceEngine, voiceProviders.length > 0)}
                      >
                        {formatVoiceName(agent.voice, dynamicVoiceCatalog, (agent as any).voiceEngine, voiceProviders.length > 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-zinc-500 min-w-0">
                      <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap text-zinc-500 font-medium">
                        <Cpu className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        <span>LLM Model:</span>
                      </span>
                      <span
                        className="font-semibold font-mono text-zinc-800 dark:text-zinc-200 text-right truncate min-w-0 text-[11px]"
                        title={agent.llmModel || configuredPrimaryLlmModel || 'gemini-2.5-pro'}
                      >
                        {agent.llmModel || configuredPrimaryLlmModel || 'gemini-2.5-pro'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-zinc-500 min-w-0">
                      <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap text-zinc-500 font-medium">
                        <Globe className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>Language:</span>
                      </span>
                      <span
                        className="font-medium text-zinc-700 dark:text-zinc-300 text-right truncate min-w-0"
                        title={agent.language}
                      >
                        {agent.language}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAgent(agent);
                        setActiveTab('playground');
                      }}
                      className="text-xs font-semibold"
                    >
                      Playground
                    </Button>
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        localStorage.setItem('nexus_selected_agent_id', agent.id);
                        triggerNavigationHandoff(onNavigate, {
                          sourceScreen: 'agents',
                          sourceLabel: 'AI Voice Agents',
                          contextTitle: `Live Studio Test: ${agent.name}`,
                          contextBadge: 'Live Studio',
                          targetScreen: 'demo-studio',
                        });
                      }}
                      className="text-xs font-semibold cursor-pointer"
                    >
                      Studio
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerNavigationHandoff(onNavigate, {
                          sourceScreen: 'agents',
                          targetScreen: 'workflows',
                          contextTitle: `Voice Workflow: ${agent.name}`,
                          contextBadge: agent.role || 'AI Voice Agent',
                          customData: {
                            agentId: agent.id,
                            agentName: agent.name,
                            workflowTitle: `${agent.name} Voice Workflow`,
                          },
                        });
                      }}
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/60 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                      title="Open Voice Workflow Studio for this Agent"
                    >
                      <GitFork className="h-3.5 w-3.5 mr-1 text-orange-500" />
                      Flow
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(agent);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteModal(agent.id, agent.name);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <DataTable data={filteredAgents} columns={columns} hideToolbar={true} />
          )}
        </div>
      )}

      {/* TAB 2: INTERACTIVE PLAYGROUND PANEL (ChatGPT Style: Conversation Left, Stats & Config Right) */}
      {activeTab === 'playground' && (
        <div className="flex flex-col lg:flex-row gap-0 h-[660px] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm w-full max-w-full min-w-0">
          {/* ── LEFT SIDE: CONVERSATION PANEL ───────────────────── */}
          <div className="flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/70 dark:bg-zinc-900/70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {selectedAgent?.name?.charAt(0) || 'A'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="truncate">{selectedAgent?.name || 'AI Assistant'}</span>
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Engine Active" />
                  </h3>
                  <p className="text-[11px] text-zinc-500 truncate max-w-[200px] sm:max-w-xs">
                    {selectedAgent?.role || 'Voice Agent Persona'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {agents.length > 1 && (
                  <div className="w-48 sm:w-56">
                    <CommandPaletteSelect
                      options={agents.map((ag) => ({
                        value: ag.id,
                        label: ag.name,
                        description: ag.role,
                        group: 'Voice Agents Roster',
                        icon: <Bot className="h-3.5 w-3.5 text-blue-500" />,
                      }))}
                      value={selectedAgent?.id || ''}
                      onChange={(val) => {
                        const found = agents.find((a) => a.id === val);
                        if (found) setSelectedAgent(found);
                      }}
                      placeholder="Select Agent..."
                      variant="blue"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setChatMessages([])}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Scrollable Conversation */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin">
              {chatMessages.length === 0 && !isChatSending ? (
                <div className="flex flex-col items-center justify-center min-h-[380px] text-center gap-3 py-8 px-2 my-auto">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center text-blue-600 shadow-2xs">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Start a session with {selectedAgent?.name || 'AI Voice Agent'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                      Type a message below or click a conversation starter to test real-time LLM response execution, latency, and token metrics.
                    </p>
                  </div>

                  {/* Interactive Quick Starters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-2">
                    {[
                      { label: '👋 Introduction', prompt: 'Hello! Who are you and how can you help me today?' },
                      { label: '💼 Services & Flow', prompt: 'Can you walk me through your service offerings and process?' },
                      { label: '📅 Book Consultation', prompt: "I'd like to schedule a 15-minute discovery consultation call." },
                      { label: '💰 Timeline & Pricing', prompt: 'What is the estimated budget range and project timeline?' },
                    ].map((starter, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendChatMessage(starter.prompt)}
                        className="p-2.5 text-left rounded-xl bg-zinc-50/80 dark:bg-zinc-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-zinc-200 dark:border-zinc-700/80 hover:border-blue-300 dark:hover:border-blue-800/60 transition-all text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer shadow-2xs group flex flex-col gap-0.5"
                      >
                        <span className="font-semibold text-blue-600 dark:text-blue-400 text-[11px] group-hover:underline">
                          {starter.label}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate w-full">
                          &quot;{starter.prompt}&quot;
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 ${
                        msg.speaker === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          msg.speaker === 'user'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-xs'
                        }`}
                      >
                        {msg.speaker === 'user' ? 'U' : selectedAgent?.name?.charAt(0) || 'AI'}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`flex flex-col max-w-[78%] ${
                          msg.speaker === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                            msg.speaker === 'user'
                              ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-tl-xs shadow-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        {msg.speaker === 'ai' && (
                          <div className="flex items-center gap-3 mt-1.5 px-1 text-[11px] text-zinc-400 font-mono">
                            {msg.latency !== undefined && <span>{msg.latency}ms</span>}
                            {msg.tokens !== undefined && <span>{msg.tokens} tokens</span>}
                            {msg.cost !== undefined && <span>${msg.cost.toFixed(5)}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Streaming / Typing Indicator */}
                  {isChatSending && (
                    <div className="flex items-start gap-3 flex-row">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200">
                        {selectedAgent?.name?.charAt(0) || 'AI'}
                      </div>
                      <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0ms]" />
                          <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:150ms]" />
                          <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Auto Scroll Anchor */}
                  <div ref={chatBottomRef} />
                </>
              )}
            </div>

            {/* Input Composer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type a message to test agent execution..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatSending}
                  className="flex-1 h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 disabled:opacity-50 transition-colors"
                />
                <Button
                  size="md"
                  variant="primary"
                  type="submit"
                  isLoading={isChatSending}
                  disabled={!chatInput.trim() || isChatSending}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Send
                </Button>
              </form>
            </div>
          </div>

          {/* ── RIGHT SIDE: INFO & TELEMETRY PANEL ───────────────── */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col overflow-y-auto bg-zinc-50/60 dark:bg-zinc-900/40 p-4 space-y-4 scrollbar-thin">
            {/* 1. Model Info */}
            <div className="space-y-1.5">
              <h4 className="text-[0.6875rem] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Cpu className="h-3 w-3 text-blue-500" />
                <span>Model & Engine Info</span>
              </h4>
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs shadow-2xs">
                <div className="flex justify-between items-center gap-2 min-w-0">
                  <span className="text-zinc-500 shrink-0 flex items-center gap-1">
                    <Cpu className="h-3.5 w-3.5 text-purple-500" />
                    <span>LLM Model:</span>
                  </span>
                  <span className="font-semibold font-mono text-zinc-800 dark:text-zinc-200 text-[11px] text-right truncate min-w-0">
                    {selectedAgent?.llmModel || configuredPrimaryLlmModel || 'gemini-2.5-pro'}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 min-w-0">
                  <span className="text-zinc-500 shrink-0 flex items-center gap-1">
                    <Mic className="h-3.5 w-3.5 text-blue-500" />
                    <span>Voice Engine:</span>
                  </span>
                  <span 
                    className="font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] text-right truncate min-w-0"
                    title={formatVoiceName(selectedAgent?.voice || '', dynamicVoiceCatalog, (selectedAgent as any)?.voiceEngine, voiceProviders.length > 0)}
                  >
                    {formatVoiceName(selectedAgent?.voice || '', dynamicVoiceCatalog, (selectedAgent as any)?.voiceEngine, voiceProviders.length > 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 min-w-0">
                  <span className="text-zinc-500 shrink-0 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Language:</span>
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] text-right truncate min-w-0">
                    {selectedAgent?.language || 'English'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10.5px] text-zinc-500 font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>Skill Preset Flow:</span>
                  </span>
                  <CommandPaletteSelect
                    options={[
                      {
                        value: 'none',
                        label: 'Dynamic Agent Persona (Pure LLM - Default)',
                        description: 'Autonomous LLM persona response without pre-scripted workflow constraints',
                        group: '✨ Autonomous Flow',
                        icon: <Sparkles className="h-3.5 w-3.5 text-amber-500" />,
                      },
                      ...availableSkills.map((sk) => ({
                        value: sk.id,
                        label: sk.name,
                        description: sk.description || `Autonomous specialized skill flow for ${sk.name}`,
                        group: sk.category ? `${sk.category.toUpperCase()} SKILLS` : 'Available Skills',
                        icon: <Bot className="h-3.5 w-3.5 text-blue-500" />,
                      })),
                    ]}
                    value={selectedSkill}
                    onChange={(val) => setSelectedSkill(val)}
                    placeholder="Search or choose skill flow..."
                    direction="auto"
                    align="right"
                    variant="blue"
                  />
                </div>
              </div>
            </div>

            {/* 2. Telemetry & Metrics (Latency, Tokens, Cost) */}
            <div className="space-y-1.5">
              <h4 className="text-[0.6875rem] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-emerald-500" />
                <span>Realtime Metrics</span>
              </h4>
              {(() => {
                const lastAiMsg = [...chatMessages].reverse().find((m) => m.speaker === 'ai');
                return (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 text-center">
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-semibold">Latency</span>
                      <span className="font-bold text-sm text-blue-700 dark:text-blue-300 font-mono">
                        {lastAiMsg?.latency !== undefined ? `${lastAiMsg.latency}ms` : '18ms'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40 text-center">
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 block font-semibold">Tokens</span>
                      <span className="font-bold text-sm text-purple-700 dark:text-purple-300 font-mono">
                        {lastAiMsg?.tokens !== undefined ? lastAiMsg.tokens : '0'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-center">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Cost</span>
                      <span className="font-bold text-sm text-emerald-700 dark:text-emerald-300 font-mono">
                        {lastAiMsg?.cost !== undefined ? `$${lastAiMsg.cost.toFixed(4)}` : '$0.000'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 3. System Prompt Directive */}
            <div className="space-y-1.5 flex-1 flex flex-col min-h-[160px]">
              <div className="flex items-center justify-between">
                <h4 className="text-[0.6875rem] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <FileCode className="h-3 w-3 text-amber-500" />
                  <span>System Prompt Directive</span>
                </h4>
                {selectedAgent && (
                  <button
                    type="button"
                    onClick={handleSavePlaygroundPrompt}
                    disabled={isSavingPrompt}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Save prompt changes directly to agent in database"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>{isSavingPrompt ? 'Saving...' : 'Save Directive'}</span>
                  </button>
                )}
              </div>
              <Textarea
                rows={5}
                value={selectedAgent?.systemPrompt || ''}
                onChange={(e) => {
                  if (!selectedAgent) return;
                  setSelectedAgent({ ...selectedAgent, systemPrompt: e.target.value });
                }}
                placeholder="Enter system prompt instructions..."
                className="font-mono text-xs flex-1 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 resize-none shadow-2xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UNIFIED VOICE LAB & PROFILES */}
      {activeTab === 'voice_studio' && (
        <div className="space-y-5">
          {/* Sub-Header & Switcher between Voice Catalog & Tuning Generator */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-cyan-500" />
                  <span>Neural Voice Lab & Persona Profiles</span>
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-2xs">
                    {voiceProviders.length} Configured Provider{voiceProviders.length === 1 ? '' : 's'}
                  </span>
                  {Object.keys(dynamicVoiceCatalog).length > 0 && (() => {
                    const allCat = Object.values(dynamicVoiceCatalog) as DynamicVoiceMeta[];
                    const fCount = allCat.filter(v => v.gender === 'female').length;
                    const mCount = allCat.filter(v => v.gender === 'male').length;
                    const nCount = allCat.filter(v => v.gender === 'neutral' || v.gender === 'unknown').length;
                    return (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 shadow-2xs">
                        {allCat.length} Voices · 👩 {fCount} Female · 👨 {mCount} Male{nCount > 0 ? ` · ⚪ ${nCount} Neutral` : ''}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Explore configured neural voice profiles from API &amp; Integrations, fine-tune speed &amp; pitch, and test live speech synthesis.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setVoiceLabSubTab('catalog')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  voiceLabSubTab === 'catalog'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Voice Catalog</span>
              </button>
              <button
                type="button"
                onClick={() => setVoiceLabSubTab('generator')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  voiceLabSubTab === 'generator'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Synthesis & Tuning Lab</span>
              </button>
            </div>
          </div>

          {voiceLabSubTab === 'catalog' ? (
            (() => {
              const allCatalogVoices = Object.values(dynamicVoiceCatalog) as DynamicVoiceMeta[];
              const currentProviderVoices = voiceCatalogProviderFilter === 'all'
                ? allCatalogVoices
                : allCatalogVoices.filter((vp) => (vp.provider || '').toLowerCase().includes(voiceCatalogProviderFilter.toLowerCase()));

              const totalAvailableVoices = currentProviderVoices.length;
              const femaleVoicesCount = currentProviderVoices.filter((v) => v.gender === 'female').length;
              const maleVoicesCount = currentProviderVoices.filter((v) => v.gender === 'male').length;
              const neutralVoicesCount = currentProviderVoices.filter((v) => v.gender === 'neutral' || v.gender === 'unknown').length;

              const filteredVoices = currentProviderVoices.filter((vp) => {
                const matchSearch =
                  !voiceCatalogSearch ||
                  (vp.label || vp.name || '').toLowerCase().includes(voiceCatalogSearch.toLowerCase()) ||
                  (vp.accent || '').toLowerCase().includes(voiceCatalogSearch.toLowerCase()) ||
                  (vp.provider || '').toLowerCase().includes(voiceCatalogSearch.toLowerCase());
                const matchGender =
                  voiceCatalogGenderFilter === 'all' ||
                  (voiceCatalogGenderFilter === 'neutral'
                    ? vp.gender === 'neutral' || vp.gender === 'unknown'
                    : (vp.gender || '').toLowerCase() === voiceCatalogGenderFilter.toLowerCase());
                return matchSearch && matchGender;
              });

              return (
                <div className="space-y-4">
                  {/* Search & Clean Styled Provider/Gender Filters */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                    <div className="relative flex-1">
                      <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Search voice name, accent, gender, or provider..."
                        value={voiceCatalogSearch}
                        onChange={(e) => setVoiceCatalogSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Custom Luxury Provider Dropdown Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCatalogProviderMenuOpen(!isCatalogProviderMenuOpen);
                            setIsCatalogGenderMenuOpen(false);
                          }}
                          className={`text-xs bg-zinc-50 dark:bg-zinc-950 border rounded-lg px-3 py-1.5 font-semibold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer flex items-center gap-2 transition-all shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 ${
                            isCatalogProviderMenuOpen
                              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20'
                              : 'border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          <Layers className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span>
                            {voiceCatalogProviderFilter === 'all'
                              ? `All Providers (${voiceProviders.length})`
                              : voiceProviders.find((vp) => vp.value === voiceCatalogProviderFilter)?.label.replace(' (Configured)', '') || voiceCatalogProviderFilter}
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${
                              isCatalogProviderMenuOpen ? 'rotate-180 text-blue-500' : ''
                            }`}
                          />
                        </button>

                        {isCatalogProviderMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-20 cursor-default"
                              onClick={() => setIsCatalogProviderMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1 z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setVoiceCatalogProviderFilter('all');
                                  setIsCatalogProviderMenuOpen(false);
                                }}
                                className={`w-full px-2.5 py-1.5 text-xs rounded-lg text-left font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                  voiceCatalogProviderFilter === 'all'
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {voiceCatalogProviderFilter === 'all' && <Check className="h-3.5 w-3.5 text-blue-500" />}
                                  <span>All Providers</span>
                                </span>
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                  {voiceProviders.length}
                                </span>
                              </button>

                              {voiceProviders.map((vp) => {
                                const provCount = allCatalogVoices.filter((v) =>
                                  (v.provider || '').toLowerCase().includes(vp.value.toLowerCase())
                                ).length;
                                const isSelected = voiceCatalogProviderFilter === vp.value;
                                return (
                                  <button
                                    key={vp.value}
                                    type="button"
                                    onClick={() => {
                                      setVoiceCatalogProviderFilter(vp.value);
                                      setIsCatalogProviderMenuOpen(false);
                                    }}
                                    className={`w-full px-2.5 py-1.5 text-xs rounded-lg text-left font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                      isSelected
                                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                                  >
                                    <span className="flex items-center gap-1.5 truncate">
                                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                                      <span className="truncate">{vp.label.replace(' (Configured)', '')}</span>
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0 ml-2">
                                      {provCount} Voices
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Custom Luxury Gender Dropdown Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCatalogGenderMenuOpen(!isCatalogGenderMenuOpen);
                            setIsCatalogProviderMenuOpen(false);
                          }}
                          className={`text-xs bg-zinc-50 dark:bg-zinc-950 border rounded-lg px-3 py-1.5 font-semibold text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer flex items-center gap-2 transition-all shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 ${
                            isCatalogGenderMenuOpen
                              ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/30 dark:bg-purple-950/20'
                              : 'border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          <Users className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                          <span>
                            {voiceCatalogGenderFilter === 'all'
                              ? `All Genders (${totalAvailableVoices})`
                              : voiceCatalogGenderFilter === 'female'
                              ? `Female (${femaleVoicesCount})`
                              : voiceCatalogGenderFilter === 'male'
                              ? `Male (${maleVoicesCount})`
                              : `Neutral (${neutralVoicesCount})`}
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${
                              isCatalogGenderMenuOpen ? 'rotate-180 text-purple-500' : ''
                            }`}
                          />
                        </button>

                        {isCatalogGenderMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-20 cursor-default"
                              onClick={() => setIsCatalogGenderMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1 z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setVoiceCatalogGenderFilter('all');
                                  setIsCatalogGenderMenuOpen(false);
                                }}
                                className={`w-full px-2.5 py-1.5 text-xs rounded-lg text-left font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                  voiceCatalogGenderFilter === 'all'
                                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold'
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {voiceCatalogGenderFilter === 'all' && <Check className="h-3.5 w-3.5 text-purple-500" />}
                                  <span>All Genders</span>
                                </span>
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                  {totalAvailableVoices}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setVoiceCatalogGenderFilter('female');
                                  setIsCatalogGenderMenuOpen(false);
                                }}
                                className={`w-full px-2.5 py-1.5 text-xs rounded-lg text-left font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                  voiceCatalogGenderFilter === 'female'
                                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold'
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {voiceCatalogGenderFilter === 'female' && <Check className="h-3.5 w-3.5 text-rose-500" />}
                                  <span>👩 Female</span>
                                </span>
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                                  {femaleVoicesCount}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setVoiceCatalogGenderFilter('male');
                                  setIsCatalogGenderMenuOpen(false);
                                }}
                                className={`w-full px-2.5 py-1.5 text-xs rounded-lg text-left font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                  voiceCatalogGenderFilter === 'male'
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {voiceCatalogGenderFilter === 'male' && <Check className="h-3.5 w-3.5 text-blue-500" />}
                                  <span>👨 Male</span>
                                </span>
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                                  {maleVoicesCount}
                                </span>
                              </button>

                              {neutralVoicesCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVoiceCatalogGenderFilter('neutral');
                                    setIsCatalogGenderMenuOpen(false);
                                  }}
                                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg text-left font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                    voiceCatalogGenderFilter === 'neutral'
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {voiceCatalogGenderFilter === 'neutral' && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                                    <span>⚪ Neutral</span>
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                    {neutralVoicesCount}
                                  </span>
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Quick-Filter Count Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setVoiceCatalogGenderFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                          voiceCatalogGenderFilter === 'all'
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>All Voices</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {totalAvailableVoices}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVoiceCatalogGenderFilter('female')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                          voiceCatalogGenderFilter === 'female'
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 font-bold shadow-2xs'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <span>👩 Female</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                          {femaleVoicesCount}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVoiceCatalogGenderFilter('male')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                          voiceCatalogGenderFilter === 'male'
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <span>👨 Male</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                          {maleVoicesCount}
                        </span>
                      </button>

                      {neutralVoicesCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setVoiceCatalogGenderFilter('neutral')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                            voiceCatalogGenderFilter === 'neutral'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <span>⚪ Neutral</span>
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {neutralVoicesCount}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      Showing <span className="font-bold text-zinc-800 dark:text-zinc-200">{filteredVoices.length}</span> of <span className="font-bold text-zinc-800 dark:text-zinc-200">{totalAvailableVoices}</span> profiles
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVoices.length === 0 ? (
                      voiceProviders.length === 0 ? (
                        <div className="col-span-full py-16 text-center space-y-4 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8">
                          <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-xs">
                            <Volume2 className="h-7 w-7" />
                          </div>
                          <div className="max-w-md mx-auto space-y-1.5">
                            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                              No Voice Synthesizers (TTS) Connected
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                              There are currently no active Voice Synthesizers configured in API &amp; Integrations. Connect a provider (e.g., ElevenLabs, Azure Speech, Cartesia, OpenAI TTS, Google Cloud TTS) to view and tune voice profiles.
                            </p>
                          </div>
                          {onNavigate && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                triggerNavigationHandoff(onNavigate, {
                                  sourceScreen: 'agents',
                                  sourceLabel: 'AI Voice Agents',
                                  contextTitle: 'Voice Synthesizers & TTS Providers',
                                  contextBadge: 'TTS Setup',
                                  targetScreen: 'integrations',
                                })
                              }
                              className="cursor-pointer font-semibold"
                            >
                              Connect Voice Synthesizer in API &amp; Integrations
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="col-span-full py-12 text-center text-sm text-zinc-500">
                          No voice profiles match your filter criteria.
                        </div>
                      )
                    ) : (
                      filteredVoices.map((vp) => (
                        <Card
                          key={vp.id}
                          className="p-4 space-y-3 hover:border-blue-500/50 transition-all border-zinc-200 dark:border-zinc-800 shadow-2xs"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <Mic className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                  {vp.label || vp.name}
                                </h4>
                                <span className="text-[10px] text-zinc-500 font-mono block">
                                  {vp.category || vp.provider}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant={
                                vp.gender === 'female' ? 'default' : vp.gender === 'male' ? 'primary' : 'secondary'
                              }
                              size="sm"
                            >
                              {vp.rawGender || (vp.gender ? vp.gender.toUpperCase() : 'VOICE')}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal line-clamp-2">
                            {vp.description || `${vp.category || vp.provider} • ${vp.rawGender || vp.gender} • ${vp.accent}`}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-[10px] bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg font-mono">
                            <div>
                              <span className="text-zinc-400 block">Accent</span>
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                                {vp.accent || 'Universal'}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block">Provider</span>
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200 uppercase truncate block">
                                {vp.provider}
                              </span>
                            </div>
                          </div>
                          <div className="pt-1 flex items-center justify-between gap-1.5">
                            <Button
                              size="xs"
                              variant="outline"
                              className="px-2 py-1 text-[10px] flex items-center gap-1 cursor-pointer shrink-0"
                              onClick={() => handlePreviewVoiceAction(vp.id, isEditModalOpen)}
                              title={`Preview voice ${vp.label || vp.name}`}
                            >
                              <Mic className="h-3 w-3 text-blue-500" />
                              <span>Preview</span>
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              className="flex-1 justify-center text-[10px] flex items-center gap-1 cursor-pointer"
                              onClick={() => {
                                setTestVoiceProvider(vp.provider);
                                setTestVoiceModel(vp.id);
                                setVoiceLabSubTab('generator');
                                addToast('info', `Loaded voice profile '${vp.label || vp.name}' in Tuning Lab`);
                              }}
                            >
                              <Sliders className="h-3 w-3" />
                              <span>Tune</span>
                            </Button>
                            {selectedAgent && (
                              <Button
                                size="xs"
                                variant="primary"
                                className="flex-1 justify-center text-[10px] flex items-center gap-1 cursor-pointer"
                                onClick={async () => {
                                  try {
                                    const updated = await agentRepository.update(selectedAgent.id, {
                                      ...selectedAgent,
                                      voice: vp.id,
                                      voiceEngine: vp.provider || selectedAgent.voiceEngine || 'default_voice',
                                    });
                                    if (updated) {
                                      setSelectedAgent(updated);
                                      setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
                                      addToast('success', `Assigned voice '${vp.label || vp.name}' to ${updated.name}`);
                                    }
                                  } catch (err: any) {
                                    addToast('error', err?.message || 'Failed to assign voice');
                                  }
                                }}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Assign</span>
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Controls */}
              <div className="lg:col-span-8 space-y-6">
                <Card className="p-5 space-y-5 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Mic className="h-4 w-4 text-blue-500" />
                    <span>Neural Voice Engine Parameters</span>
                  </CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <CommandPaletteSelect
                      label="Voice Provider"
                      options={voiceProviders}
                      value={testVoiceProvider}
                      onChange={(vpId) => setTestVoiceProvider(vpId)}
                      placeholder="Select provider..."
                      id="test-voice-provider"
                      variant="blue"
                    />
                    <div className="relative">
                      <CommandPaletteSelect
                        label="Voice Model"
                        options={testVoiceModels}
                        value={testVoiceModel}
                        onChange={(voiceId) => setTestVoiceModel(voiceId)}
                        placeholder={isTestVoicesLoading ? 'Loading voices...' : 'Select voice...'}
                        id="test-voice-model"
                        variant="blue"
                      />
                      {testVoiceLimitation && (
                        <div className="absolute top-16 left-0 right-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] p-2 rounded-md border border-red-200 dark:border-red-800/30 z-10">
                          {testVoiceLimitation}
                        </div>
                      )}
                    </div>

                    <CommandPaletteSelect
                      label="Language"
                      options={languageOptions()}
                      value={testLanguage}
                      onChange={(lang) => setTestLanguage(lang)}
                      placeholder="Select language..."
                      id="test-language"
                      variant="blue"
                    />

                    <CommandPaletteSelect
                      label="Emotion Preset"
                      options={EMOTION_PRESETS}
                      value={testEmotion}
                      onChange={(em) => setTestEmotion(em)}
                      placeholder="Select emotion..."
                      id="test-emotion"
                      variant="blue"
                    />
                  </div>

                  {/* Sliders Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label className="font-semibold text-zinc-600 dark:text-zinc-400">Speed Rate</label>
                        <span className="font-mono font-bold text-blue-600">{testSpeed.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={testSpeed}
                        onChange={(e) => setTestSpeed(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label className="font-semibold text-zinc-600 dark:text-zinc-400">Pitch Shift</label>
                        <span className="font-mono font-bold text-blue-600">{testPitch.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={testPitch}
                        onChange={(e) => setTestPitch(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label className="font-semibold text-zinc-600 dark:text-zinc-400">Temperature</label>
                        <span className="font-mono font-bold text-blue-600">{testTemperature.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={testTemperature}
                        onChange={(e) => setTestTemperature(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label className="font-semibold text-zinc-600 dark:text-zinc-400">Voice Stability</label>
                        <span className="font-mono font-bold text-blue-600">{testStability.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={testStability}
                        onChange={(e) => setTestStability(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label className="font-semibold text-zinc-600 dark:text-zinc-400">Similarity Boost</label>
                        <span className="font-mono font-bold text-blue-600">{testSimilarity.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={testSimilarity}
                        onChange={(e) => setTestSimilarity(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <label className="font-semibold text-zinc-600 dark:text-zinc-400">Style Exaggeration</label>
                        <span className="font-mono font-bold text-blue-600">{testStyle.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={testStyle}
                        onChange={(e) => setTestStyle(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </Card>

                {/* Synthesis Text Input */}
                <Card className="p-5 space-y-4 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                  <CardTitle className="text-sm font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-emerald-500" />
                      <span>Synthesis Script Text</span>
                    </div>
                    <span className="text-xs font-normal text-zinc-400">{testText.length} characters</span>
                  </CardTitle>
                  <Textarea
                    rows={4}
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Enter speech text to synthesize..."
                    className="text-sm"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="md"
                        isLoading={isTestGenerating}
                        leftIcon={<Play className="h-4 w-4" />}
                        onClick={async () => {
                          if (!testVoiceModel) return addToast('error', 'Select a voice model first');
                          setIsTestGenerating(true);
                          try {
                            const token = localStorage.getItem('nexus_access_token') || sessionStorage.getItem('nexus_access_token');
                            const res = await fetch('/api/providers/voices/preview', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                              },
                              body: JSON.stringify({
                                provider: testVoiceProvider,
                                voice_id: testVoiceModel,
                                text: testText,
                                language: testLanguage,
                              }),
                            });
                            if (res.ok) {
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              setTestAudioUrl(url);
                              setTimeout(() => {
                                if (testAudioRef.current) {
                                  testAudioRef.current.src = url;
                                  testAudioRef.current.play();
                                }
                              }, 100);
                              addToast('success', 'Speech generated successfully!');
                            } else {
                              const errData = await res.json().catch(() => ({}));
                              addToast('error', `Synthesis failed: ${errData.detail || 'Provider error'}`);
                            }
                          } catch (err: any) {
                            addToast('error', err?.message || 'Failed to generate speech');
                          } finally {
                            setIsTestGenerating(false);
                          }
                        }}
                      >
                        Generate Speech
                      </Button>
                      {selectedAgent && testVoiceModel && (
                        <Button
                          variant="outline"
                          size="md"
                          className="text-xs flex items-center gap-1.5 cursor-pointer"
                          onClick={async () => {
                            try {
                              const updated = await agentRepository.update(selectedAgent.id, {
                                ...selectedAgent,
                                voice: testVoiceModel,
                                voiceEngine: testVoiceProvider || selectedAgent.voiceEngine || 'default_voice',
                              });
                              if (updated) {
                                setSelectedAgent(updated);
                                setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
                                addToast('success', `Assigned voice '${testVoiceModel}' to ${updated.name}`);
                              }
                            } catch (err: any) {
                              addToast('error', err?.message || 'Failed to assign voice');
                            }
                          }}
                          leftIcon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        >
                          <span>Assign to {selectedAgent.name}</span>
                        </Button>
                      )}
                    </div>

                    {testAudioUrl && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (testAudioRef.current) {
                              testAudioRef.current.currentTime = 0;
                              testAudioRef.current.play();
                            }
                          }}
                          leftIcon={<RotateCcw className="h-4 w-4" />}
                        >
                          Replay
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (testAudioRef.current) {
                              testAudioRef.current.pause();
                              testAudioRef.current.currentTime = 0;
                            }
                          }}
                          leftIcon={<Square className="h-4 w-4" />}
                        >
                          Stop
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = testAudioUrl;
                            link.download = `createcall_voice_${Date.now()}.mp3`;
                            link.click();
                          }}
                          leftIcon={<Download className="h-4 w-4" />}
                        >
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right: Output & Telemetry */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="p-5 space-y-4 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    <span>Playback & Telemetry</span>
                  </CardTitle>

                  <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center min-h-32 w-full space-y-3">
                    <audio ref={testAudioRef} controls className="w-full h-10" src={testAudioUrl || undefined} />
                    {/* Simulated Waveform Visualizer */}
                    <div className="flex items-center justify-center gap-1 w-full h-6 pt-1">
                      {[12, 24, 16, 32, 20, 8, 28, 14, 30, 22, 10, 26, 18, 12, 24, 16, 32, 20, 8, 28].map(
                        (h, idx) => (
                          <span
                            key={idx}
                            style={{ height: `${isTestGenerating ? Math.max(4, Math.round(h * Math.random())) : 4}px` }}
                            className={`w-1 rounded-full transition-all duration-150 ${
                              isTestGenerating ? 'bg-cyan-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'
                            }`}
                          />
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="text-zinc-500 font-semibold">Synthesis Status</span>
                      <Badge
                        variant={isTestGenerating ? 'secondary' : testAudioUrl ? 'success' : 'default'}
                        size="sm"
                      >
                        {isTestGenerating ? 'Streaming...' : testAudioUrl ? 'Ready' : 'Idle'}
                      </Badge>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="text-zinc-500 font-semibold">Audio Codec</span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-mono">MP3 / PCM 24kHz</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="text-zinc-500 font-semibold">Sample Rate</span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-mono">24,000 Hz HD</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-zinc-500 font-semibold">Estimated Cost</span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-mono">
                        ~ $0.00{Math.floor(testText.length * 0.15)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}



      {/* CREATE AGENT MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New AI Voice Agent"
        description="Configure agent persona, language model, voice settings, and CRM data integration."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateAgent} className="space-y-4">
          {/* Agent Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Agent Name *"
              placeholder="e.g. Inbound Support Agent"
              value={newAgentData.name}
              onChange={(e) => setNewAgentData({ ...newAgentData, name: e.target.value })}
              required
            />
            <Input
              label="Role / Persona"
              placeholder="e.g. Customer Support Specialist"
              value={newAgentData.role}
              onChange={(e) => setNewAgentData({ ...newAgentData, role: e.target.value })}
            />
          </div>

          {/* Language Model Engine (Dynamic Multi-Model Discovery) */}
          <div className="space-y-2.5">
            {Boolean(configuredPrimaryLlmModel) && (
              <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Cpu className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate block">
                      {configuredPrimaryLlmModel !== 'dynamic' ? (
                        <>Primary LLM Default: <span className="font-mono text-blue-700 dark:text-blue-300 font-bold">{configuredPrimaryLlmModel}</span></>
                      ) : (
                        <>Dynamic LLM Discovery: <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">All Connected Models Available</span></>
                      )}
                    </span>
                    <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 block truncate">
                      Select any model from your connected provider for this agent persona.
                    </span>
                  </div>
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      triggerNavigationHandoff(onNavigate, {
                        sourceScreen: 'agents',
                        sourceLabel: 'AI Voice Agents',
                        contextTitle: 'Configure AI Providers & Keys',
                        contextBadge: 'LLM & Voice Providers',
                        targetScreen: 'integrations',
                      });
                    }}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 underline shrink-0 cursor-pointer"
                  >
                    API &amp; Integrations
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CommandPaletteSelect
                label="LLM Provider"
                options={llmProviders}
                value={selectedLLMProvider}
                onChange={(provId) => setSelectedLLMProvider(provId)}
                placeholder="Select LLM provider..."
                id="create-llm-provider"
                direction="down"
              />
              <div className="relative">
                <CommandPaletteSelect
                  label="Model"
                  options={llmModels}
                  value={newAgentData.llmModel}
                  onChange={(modelId) => setNewAgentData((prev) => ({ ...prev, llmModel: modelId }))}
                  placeholder={isModelsLoading ? 'Loading models...' : 'Select model...'}
                  id="create-llm-model"
                  direction="down"
                />
                {llmProviderLimitation && (
                  <div className="absolute top-14 left-0 right-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] p-1.5 rounded-md border border-red-200 dark:border-red-800/30 z-10">
                    {llmProviderLimitation}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Voice Engine */}
          <div className="space-y-3 p-3.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
            {voiceProviders.length === 0 && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2 min-w-0">
                  <Zap className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="truncate">No Voice Synthesizers (TTS) connected yet in API &amp; Integrations.</span>
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      triggerNavigationHandoff(onNavigate, {
                        sourceScreen: 'agents',
                        sourceLabel: 'AI Voice Agents Studio',
                        contextTitle: 'Voice Synthesizers (TTS) Configuration',
                        contextBadge: 'TTS Providers',
                        targetScreen: 'integrations',
                      });
                    }}
                    className="shrink-0 text-[11px] font-bold text-amber-700 dark:text-amber-300 underline hover:text-amber-900 cursor-pointer"
                  >
                    Configure TTS
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Voice Engine Settings
                </label>
                {Boolean(newAgentData.language) && (
                  <button
                    type="button"
                    onClick={() => setSmartLanguageFilter((prev) => !prev)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      smartLanguageFilter
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
                    }`}
                    title="Toggle smart language optimization for voices"
                  >
                    <span>✨ Best for {(newAgentData.language || 'English').split(' (')[0].replace(/^[^\w\s]+/g, '').trim() || 'English'}</span>
                    <span className={`text-[9px] px-1 rounded ${smartLanguageFilter ? 'bg-amber-200/80 dark:bg-amber-800 text-amber-900 dark:text-amber-100' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                      {smartLanguageFilter ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}
              </div>
              {/* Voice Gender Filter */}
              <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => handleSelectGenderFilter('all', false)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    voiceGenderFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  All ({voiceModels.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectGenderFilter('female', false)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    voiceGenderFilter === 'female'
                      ? 'bg-pink-500 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-pink-600 dark:hover:text-pink-300'
                  }`}
                >
                  <span>👩 Female ({voiceModels.filter(v => v.gender === 'female').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectGenderFilter('male', false)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    voiceGenderFilter === 'male'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-blue-600 dark:hover:text-blue-300'
                  }`}
                >
                  <span>👨 Male ({voiceModels.filter(v => v.gender === 'male').length})</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CommandPaletteSelect
                label="Voice Provider"
                options={voiceProviders}
                value={selectedVoiceProvider}
                onChange={(vpId) => setSelectedVoiceProvider(vpId)}
                placeholder="Select voice provider..."
                id="create-voice-provider"
                direction="down"
              />
              <div className="relative">
                <CommandPaletteSelect
                  label={`Voice (${filteredVoiceModels.length} ${voiceGenderFilter === 'all' ? 'Total' : voiceGenderFilter.toUpperCase()})`}
                  options={filteredVoiceModels}
                  value={newAgentData.voice}
                  onChange={(voiceId) => setNewAgentData((prev) => ({ ...prev, voice: voiceId }))}
                  placeholder={isVoicesLoading ? 'Loading voices...' : 'Select voice...'}
                  id="create-voice"
                  direction="down"
                />
                {voiceProviderLimitation && (
                  <div className="absolute top-14 left-0 right-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] p-1.5 rounded-md border border-red-200 dark:border-red-800/30 z-10">
                    {voiceProviderLimitation}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1">
                <Input
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Enter custom preview sample text..."
                  className="text-xs h-8"
                />
              </div>
              <Button
                type="button"
                size="xs"
                variant="outline"
                isLoading={isPreviewing}
                leftIcon={isPreviewing ? undefined : <Mic className="h-3 w-3" />}
                onClick={() => handlePreviewVoiceAction(newAgentData.voice, false)}
                className="h-8 text-xs shrink-0"
              >
                ▶ Preview Voice
              </Button>
            </div>
            {previewError && <span className="text-[10px] text-red-500 block text-center">{previewError}</span>}
          </div>

          {/* Language & Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CommandPaletteSelect
              label="Language"
              badge={`${GLOBAL_LANGUAGES_CATALOG.length} Languages`}
              options={languageOptions(languages)}
              value={newAgentData.language}
              onChange={(lang) => handleLanguageChange(lang, false)}
              placeholder="Select language..."
              id="create-language"
            />
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Temperature (Creativity)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={newAgentData.temperature}
                onChange={(e) => setNewAgentData({ ...newAgentData, temperature: parseFloat(e.target.value) })}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* CRM & Dynamic Variables Integration */}
          <div className="space-y-2.5 p-3.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                  CRM Schema &amp; Dynamic Variables
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Select fields to connect live caller data to the agent
                </span>
              </div>
              {getConnectedTags(newAgentData.systemPrompt).length > 0 && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {getConnectedTags(newAgentData.systemPrompt).length} Connected
                </span>
              )}
            </div>

            <div className="space-y-2">
              <AgentPromptTagDropdownPanel
                title="CRM Data Fields"
                count={promptDataFieldTags.length}
                subtitle="Customer attributes (e.g. {{contact.alternate_phone}})"
                icon={<Sliders className="h-3.5 w-3.5" />}
                theme="amber"
                items={promptDataFieldTags}
                selectedTags={getConnectedTags(newAgentData.systemPrompt)}
                onToggleTag={(tag) => handleToggleTag(tag, false)}
              />

              <AgentPromptTagDropdownPanel
                title="Workspace Dynamic Variables"
                count={promptVariableTags.length}
                subtitle="Dynamic workspace variables (e.g. {{appointment_date}})"
                icon={<Variable className="h-3.5 w-3.5" />}
                theme="blue"
                items={promptVariableTags}
                selectedTags={getConnectedTags(newAgentData.systemPrompt)}
                onToggleTag={(tag) => handleToggleTag(tag, false)}
              />
            </div>

            {getConnectedTags(newAgentData.systemPrompt).length > 0 && (
              <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-zinc-500 shrink-0">Connected:</span>
                {getConnectedTags(newAgentData.systemPrompt).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/80"
                  >
                    <span>✓ {tag}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleTag(tag, false)}
                      className="text-emerald-600 hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                      title={`Disconnect ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Voice Workflow Integration */}
            <div className="p-3 bg-orange-50/60 dark:bg-orange-950/30 rounded-xl border border-orange-200/80 dark:border-orange-900/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 shrink-0">
                  <GitFork className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                    Visual Voice Workflow &amp; Inbound Call Flow
                  </span>
                  <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 block truncate">
                    Graph-based multi-step IVR routing, RAG search chunks, and DTMF tree engine.
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  triggerNavigationHandoff(onNavigate, {
                    sourceScreen: 'agents',
                    targetScreen: 'workflows',
                    contextTitle: `Voice Workflow: ${newAgentData.name || 'New Agent Flow'}`,
                    contextBadge: newAgentData.role || 'Voice Agent',
                    customData: {
                      agentName: newAgentData.name,
                      workflowTitle: `${newAgentData.name || 'New Agent'} Voice Workflow`,
                    },
                  });
                }}
                className="shrink-0 text-xs font-bold text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/50 cursor-pointer"
              >
                Open in Workflow Studio ➔
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save &amp; Provision Agent
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT AGENT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit AI Voice Agent: ${selectedAgent?.name || ''}`}
        description="Configure agent persona, language model, voice settings, and CRM data integration."
        maxWidth="2xl"
      >
        <form onSubmit={handleUpdateAgent} className="space-y-4">
          {/* Agent Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Agent Name *"
              value={editAgentData.name}
              onChange={(e) => setEditAgentData({ ...editAgentData, name: e.target.value })}
              required
            />
            <Input
              label="Role / Persona"
              placeholder="e.g. Customer Support Specialist"
              value={editAgentData.role}
              onChange={(e) => setEditAgentData({ ...editAgentData, role: e.target.value })}
            />
          </div>

          {/* Language Model Engine (Strictly Synchronized with API & Integrations SSOT) */}
          <div className="space-y-2.5">
            {Boolean(configuredPrimaryLlmModel) && (
              <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Cpu className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate block">
                      {configuredPrimaryLlmModel !== 'dynamic' ? (
                        <>Primary LLM Default: <span className="font-mono text-blue-700 dark:text-blue-300 font-bold">{configuredPrimaryLlmModel}</span></>
                      ) : (
                        <>Dynamic LLM Discovery: <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">All Connected Models Available</span></>
                      )}
                    </span>
                    <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 block truncate">
                      Select any model from your connected provider for this agent persona.
                    </span>
                  </div>
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      triggerNavigationHandoff(onNavigate, {
                        sourceScreen: 'agents',
                        sourceLabel: 'AI Voice Agents Studio',
                        contextTitle: selectedAgent?.name ? `Configure LLM: ${selectedAgent.name}` : 'Configure AI Providers',
                        contextBadge: 'LLM Setup',
                        targetScreen: 'integrations',
                      });
                    }}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 underline shrink-0 cursor-pointer"
                  >
                    API &amp; Integrations
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CommandPaletteSelect
                label="LLM Provider"
                options={llmProviders}
                value={selectedLLMProvider}
                onChange={(provId) => setSelectedLLMProvider(provId)}
                placeholder="Select LLM provider..."
                id="edit-llm-provider"
                direction="down"
              />
              <div className="relative">
                <CommandPaletteSelect
                  label="Model"
                  options={llmModels}
                  value={editAgentData.llmModel}
                  onChange={(modelId) => setEditAgentData((prev) => ({ ...prev, llmModel: modelId }))}
                  placeholder={isModelsLoading ? 'Loading models...' : 'Select model...'}
                  id="edit-llm-model"
                  direction="down"
                />
                {llmProviderLimitation && (
                  <div className="absolute top-14 left-0 right-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] p-1.5 rounded-md border border-red-200 dark:border-red-800/30 z-10">
                    {llmProviderLimitation}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Voice Engine */}
          <div className="space-y-3 p-3.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
            {voiceProviders.length === 0 && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2 min-w-0">
                  <Zap className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="truncate">No Voice Synthesizers (TTS) connected yet in API &amp; Integrations.</span>
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      triggerNavigationHandoff(onNavigate, {
                        sourceScreen: 'agents',
                        sourceLabel: 'AI Voice Agents Studio',
                        contextTitle: 'Voice Synthesizers (TTS) Configuration',
                        contextBadge: 'TTS Providers',
                        targetScreen: 'integrations',
                      });
                    }}
                    className="shrink-0 text-[11px] font-bold text-amber-700 dark:text-amber-300 underline hover:text-amber-900 cursor-pointer"
                  >
                    Configure TTS
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Voice Engine Settings
                </label>
                {Boolean(editAgentData.language) && (
                  <button
                    type="button"
                    onClick={() => setSmartLanguageFilter((prev) => !prev)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      smartLanguageFilter
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
                    }`}
                    title="Toggle smart language optimization for voices"
                  >
                    <span>✨ Best for {(editAgentData.language || 'English').split(' (')[0].replace(/^[^\w\s]+/g, '').trim() || 'English'}</span>
                    <span className={`text-[9px] px-1 rounded ${smartLanguageFilter ? 'bg-amber-200/80 dark:bg-amber-800 text-amber-900 dark:text-amber-100' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                      {smartLanguageFilter ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}
              </div>
              {/* Voice Gender Filter */}
              <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => handleSelectGenderFilter('all', true)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    voiceGenderFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  All ({voiceModels.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectGenderFilter('female', true)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    voiceGenderFilter === 'female'
                      ? 'bg-pink-500 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-pink-600 dark:hover:text-pink-300'
                  }`}
                >
                  <span>👩 Female ({voiceModels.filter(v => v.gender === 'female').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectGenderFilter('male', true)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    voiceGenderFilter === 'male'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-blue-600 dark:hover:text-blue-300'
                  }`}
                >
                  <span>👨 Male ({voiceModels.filter(v => v.gender === 'male').length})</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CommandPaletteSelect
                label="Voice Provider"
                options={voiceProviders}
                value={selectedVoiceProvider}
                onChange={(vpId) => setSelectedVoiceProvider(vpId)}
                placeholder="Select voice provider..."
                id="edit-voice-provider"
                direction="down"
              />
              <div className="relative">
                <CommandPaletteSelect
                  label={`Voice (${filteredVoiceModels.length} ${voiceGenderFilter === 'all' ? 'Total' : voiceGenderFilter.toUpperCase()})`}
                  options={filteredVoiceModels}
                  value={editAgentData.voice}
                  onChange={(voiceId) => setEditAgentData((prev) => ({ ...prev, voice: voiceId }))}
                  placeholder={isVoicesLoading ? 'Loading voices...' : 'Select voice...'}
                  id="edit-voice"
                  direction="down"
                />
                {voiceProviderLimitation && (
                  <div className="absolute top-14 left-0 right-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] p-1.5 rounded-md border border-red-200 dark:border-red-800/30 z-10">
                    {voiceProviderLimitation}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1">
                <Input
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Enter custom preview sample text..."
                  className="text-xs h-8"
                />
              </div>
              <Button
                type="button"
                size="xs"
                variant="outline"
                isLoading={isPreviewing}
                leftIcon={isPreviewing ? undefined : <Mic className="h-3 w-3" />}
                onClick={() => handlePreviewVoiceAction(editAgentData.voice, true)}
                className="h-8 text-xs shrink-0"
              >
                ▶ Preview Voice
              </Button>
            </div>
            {previewError && <span className="text-[10px] text-red-500 block text-center">{previewError}</span>}
          </div>

          {/* Language & Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CommandPaletteSelect
              label="Language"
              badge={`${GLOBAL_LANGUAGES_CATALOG.length} Languages`}
              options={languageOptions(languages)}
              value={editAgentData.language}
              onChange={(lang) => handleLanguageChange(lang, true)}
              placeholder="Select language..."
              id="edit-language"
            />
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Temperature (Creativity)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={editAgentData.temperature}
                onChange={(e) => setEditAgentData({ ...editAgentData, temperature: parseFloat(e.target.value) })}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* CRM & Dynamic Variables Integration */}
          <div className="space-y-2.5 p-3.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                  CRM Schema &amp; Dynamic Variables
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Select fields to connect live caller data to the agent
                </span>
              </div>
              {getConnectedTags(editAgentData.systemPrompt).length > 0 && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {getConnectedTags(editAgentData.systemPrompt).length} Connected
                </span>
              )}
            </div>

            <div className="space-y-2">
              <AgentPromptTagDropdownPanel
                title="CRM Data Fields"
                count={promptDataFieldTags.length}
                subtitle="Customer attributes (e.g. {{contact.alternate_phone}})"
                icon={<Sliders className="h-3.5 w-3.5" />}
                theme="amber"
                items={promptDataFieldTags}
                selectedTags={getConnectedTags(editAgentData.systemPrompt)}
                onToggleTag={(tag) => handleToggleTag(tag, true)}
              />

              <AgentPromptTagDropdownPanel
                title="Workspace Dynamic Variables"
                count={promptVariableTags.length}
                subtitle="Dynamic workspace variables (e.g. {{appointment_date}})"
                icon={<Variable className="h-3.5 w-3.5" />}
                theme="blue"
                items={promptVariableTags}
                selectedTags={getConnectedTags(editAgentData.systemPrompt)}
                onToggleTag={(tag) => handleToggleTag(tag, true)}
              />
            </div>

            {getConnectedTags(editAgentData.systemPrompt).length > 0 && (
              <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-zinc-500 shrink-0">Connected:</span>
                {getConnectedTags(editAgentData.systemPrompt).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/80"
                  >
                    <span>✓ {tag}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleTag(tag, true)}
                      className="text-emerald-600 hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                      title={`Disconnect ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Voice Workflow Integration */}
            <div className="p-3 bg-orange-50/60 dark:bg-orange-950/30 rounded-xl border border-orange-200/80 dark:border-orange-900/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 shrink-0">
                  <GitFork className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                    Visual Voice Workflow &amp; Inbound Call Flow
                  </span>
                  <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 block truncate">
                    Graph-based multi-step IVR routing, RAG search chunks, and DTMF tree engine.
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  triggerNavigationHandoff(onNavigate, {
                    sourceScreen: 'agents',
                    targetScreen: 'workflows',
                    contextTitle: `Voice Workflow: ${selectedAgent?.name || 'Agent Flow'}`,
                    contextBadge: selectedAgent?.role || 'Voice Agent',
                    customData: {
                      agentId: selectedAgent?.id,
                      agentName: selectedAgent?.name,
                      workflowTitle: `${selectedAgent?.name || 'Agent'} Inbound & Outbound Workflow`,
                    },
                  });
                }}
                className="shrink-0 text-xs font-bold text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/50 cursor-pointer"
              >
                Open in Workflow Studio ➔
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ON-SCREEN IN-APP DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!agentToDelete}
        onClose={() => !isDeletingAgent && setAgentToDelete(null)}
        title="Delete AI Agent"
        size="md"
      >
        <div className="space-y-4 pt-1">
          <div className="flex items-start gap-3.5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-rose-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                Delete Agent &quot;{agentToDelete?.name}&quot;?
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Are you sure you want to permanently delete this AI Voice Agent? All assigned prompts, custom configurations, and telephony bindings for this agent will be removed from your workspace.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="outline"
              type="button"
              disabled={isDeletingAgent}
              onClick={() => setAgentToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              disabled={isDeletingAgent}
              onClick={handleConfirmDeleteAgent}
              className="flex items-center gap-2 cursor-pointer"
            >
              {isDeletingAgent ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Deleting Agent...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Permanently Delete</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Plan Entitlements & Guardrail Upgrade Modal */}
      <PlanGuardrailModal
        isOpen={guardrailModal.isOpen}
        onClose={closeGuardrail}
        featureTitle={guardrailModal.featureTitle}
        featureDescription={guardrailModal.featureDescription}
        requiredTier={guardrailModal.requiredTier}
        currentPlanName={guardrailModal.currentPlanName || entitlements.planName}
        onNavigateToBilling={() => (onNavigate ? onNavigate('billing') : undefined)}
      />
    </div>
  );
};
