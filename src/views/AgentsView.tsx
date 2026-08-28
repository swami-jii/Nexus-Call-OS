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
import { fetchAPI } from '../lib/api';

const AgentPromptTagDropdownPanel: React.FC<{
  title: string;
  count: number;
  subtitle: string;
  icon: React.ReactNode;
  theme: 'amber' | 'blue';
  items: Array<{ tag: string; label: string; group?: string }>;
  onInsert: (tag: string) => void;
}> = ({ title, count, subtitle, icon, theme, items, onInsert }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState('');

  if (items.length === 0) return null;

  const filteredItems = items.filter(
    (item) =>
      item.tag.toLowerCase().includes(search.toLowerCase()) ||
      item.label.toLowerCase().includes(search.toLowerCase())
  );

  const isAmber = theme === 'amber';

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
              Click tag to insert into prompt
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap max-h-36 overflow-y-auto pr-1">
            {filteredItems.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onInsert(item.tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isAmber
                    ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-semibold'
                    : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-semibold'
                }`}
                title={`Click to insert ${item.tag} (${item.label})`}
              >
                <span>+{item.tag}</span>
                <span className="text-[10px] opacity-75 font-sans">({item.label})</span>
              </button>
            ))}
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
import { useBusinessRules } from '../context/BusinessRulesContext';

// ==========================================
// DYNAMIC ENTERPRISE PROVIDER REGISTRIES
// True Dynamic Provider Registry — Zero Hardcoded Models/Providers

export const LANGUAGE_GROUPS = [
  { category: '✨ Smart Multilingual AI', languages: ['Auto-Detect (Caller Language Match)', 'Hinglish (Hindi + English Mix)'] },
  { category: '🇮🇳 Indian Scheduled & Regional', languages: ['हिन्दी (Hindi)', 'English (India)', 'বাংলা (Bengali)', 'मराठी (Marathi)', 'ગુજરાતી (Gujarati)', 'தமிழ் (Tamil)', 'తెలుగు (Telugu)', 'ಕನ್ನಡ (Kannada)', 'മലയാളം (Malayalam)', 'ਪੰਜਾਬੀ (Punjabi)', 'اردو (Urdu)', 'ଓଡ଼ିଆ (Odia)'] },
  { category: '🌐 Global International', languages: ['English (US)', 'English (UK)', 'Español (Spanish)', 'Français (French)', 'Deutsch (German)', 'العربية (Arabic)', '日本語 (Japanese)', '中文 (Chinese)', 'Português (Portuguese)', 'Italiano (Italian)', 'Nederlands (Dutch)', 'Bahasa Indonesia'] },
];

export function languageOptions(): SelectOption[] {
  return LANGUAGE_GROUPS.flatMap((g) =>
    g.languages.map((lang) => ({ value: lang, label: lang, group: g.category }))
  );
}

export function formatVoiceName(voice: string): string {
  if (!voice) return 'Default Voice';
  if (voice === '21m00Tcm4TlvDq8ikWAM') return 'ElevenLabs – Rachel';
  if (voice === 'AZnzlk1XvdvUeBnXmlld') return 'ElevenLabs – Domi';
  if (voice === 'EXAVITQu4vr4xnSDxMaL') return 'ElevenLabs – Bella';
  if (voice === 'ErXwobaYiN019PkySvjV') return 'ElevenLabs – Antoni';
  if (voice === 'MF3mGyEYCl7XYWbV9V6O') return 'ElevenLabs – Elli';
  if (voice === 'TxGEqnHWrfWFTfGW9XjX') return 'ElevenLabs – Josh';
  if (voice === 'VR6AewLTigWG4xSOukaG') return 'ElevenLabs – Arnold';
  if (voice === 'pNInz6obpgDQGcFmaJgB') return 'ElevenLabs – Adam';
  if (voice.length > 22 && !voice.includes(' ')) return `Voice (${voice.slice(0, 10)}...)`;
  return voice;
}

interface AgentsViewProps {
  onNavigate?: (screen: any) => void;
}

export const AgentsView: React.FC<AgentsViewProps> = ({ onNavigate }) => {
  const { businessTypes, departments, workingHours, languages, businessPolicies, buildAgentSystemPromptWithRules } = useBusinessRules();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeTab, setActiveTab] = useState<'roster' | 'playground' | 'prompts' | 'memory' | 'tools' | 'voice_test'>('roster');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Dynamic Provider & Model Registry State
  const [llmProviders, setLlmProviders] = useState<SelectOption[]>([]);
  const [voiceProviders, setVoiceProviders] = useState<SelectOption[]>([]);
  const [selectedLLMProvider, setSelectedLLMProvider] = useState('');
  const [selectedVoiceProvider, setSelectedVoiceProvider] = useState('');

  const [llmModels, setLlmModels] = useState<SelectOption[]>([]);
  const [voiceModels, setVoiceModels] = useState<SelectOption[]>([]);
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
  const [testText, setTestText] = useState('Hello, this is Nexus Call OS Voice Testing.');
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
          setLlmModels(res.models.map((m: any) => ({
            value: m.id,
            label: m.label,
            description: m.contextWindow
          })));
          setNewAgentData(prev => ({ ...prev, llmModel: prev.llmModel || res.models[0].id }));
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
  }, [selectedLLMProvider]);

  useEffect(() => {
    if (!selectedVoiceProvider) {
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
          setVoiceModels(res.voices.map((v: any) => ({
            value: v.id,
            label: v.label,
            description: `${v.gender} · ${v.accent}`
          })));
          setNewAgentData(prev => ({ ...prev, voice: prev.voice || res.voices[0].id }));
        } else {
          setVoiceModels([]);
          setNewAgentData(prev => ({ ...prev, voice: '' }));
        }
      } catch (err) {
        setVoiceModels([]);
      } finally {
        setIsVoicesLoading(false);
      }
    };
    fetchVoices();
  }, [selectedVoiceProvider]);

  useEffect(() => {
    if (!testVoiceProvider) return;
    const fetchTestVoices = async () => {
      setIsTestVoicesLoading(true);
      setTestVoiceLimitation(null);
      try {
        const res = await fetchAPI(`/api/providers/voices?provider=${testVoiceProvider}`);
        if (res.voices && res.voices.length > 0) {
          setTestVoiceModels(res.voices.map((v: any) => ({
            value: v.id,
            label: v.label,
            description: `${v.gender} · ${v.accent}`
          })));
          setTestVoiceModel(res.voices[0].label);
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

  // Auto-scroll anchor for conversation
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatSending]);

  // Prompt test state
  const [promptTemplate, setPromptTemplate] = useState('Hello {{name}}, welcome to {{company}} AI Voice Support.');
  const [promptVars, setPromptVars] = useState({ name: 'Alex Vance', company: 'Nexus AI' });
  const [compiledPromptResult, setCompiledPromptResult] = useState<any>(null);

  // Memory state
  const [agentMemory, setAgentMemory] = useState<any>(null);
  const [isMemoryLoading, setIsMemoryLoading] = useState(false);
  const [memoryError, setMemoryError] = useState<string | null>(null);

  // Tool execution state
  const [toolName, setToolName] = useState<string>('calculator');
  const [toolArgsStr, setToolArgsStr] = useState<string>('{"expression": "250 * 4"}');
  const [toolOutput, setToolOutput] = useState<any>(null);

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
    businessTypeId: 'bt_1',
    departmentId: 'dep_1',
    workingHoursId: 'wh_1',
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
    businessTypeId: 'bt_1',
    departmentId: 'dep_1',
    workingHoursId: 'wh_1',
  });

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
      const saved = localStorage.getItem('nexus_custom_items');
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

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await agentRepository.getAll();
      setAgents(data);
      try {
        localStorage.setItem('nexus_agents', JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('nexus_business_rules_updated'));
      } catch (e) {}
      if (data.length > 0 && !selectedAgent) {
        setSelectedAgent(data[0]);
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
        const [providersRes, credsRes] = await Promise.all([
          fetchAPI('/api/providers').catch(() => ({ llm: [], voice: [] })),
          fetchAPI('/api/credentials').catch(() => ({ credentials: [] }))
        ]);

        const configuredCreds = credsRes.credentials || [];
        const configuredLlmIds = new Set(configuredCreds.filter((c: any) => c.category === 'llm').map((c: any) => c.provider.toLowerCase()));
        const configuredVoiceIds = new Set(configuredCreds.filter((c: any) => c.category === 'voice').map((c: any) => c.provider.toLowerCase()));

        let llms: SelectOption[] = [];
        let voices: SelectOption[] = [];

        if (providersRes.llm) {
          const rawLlms = providersRes.llm;
          const filteredLlms = configuredLlmIds.size > 0 
            ? rawLlms.filter((p: any) => configuredLlmIds.has(p.id.toLowerCase()))
            : rawLlms;
          llms = filteredLlms.map((p: any) => ({
            value: p.id,
            label: `${p.name} (Configured)`,
            description: p.description
          }));
          setLlmProviders(llms.length > 0 ? llms : rawLlms.map((p: any) => ({ value: p.id, label: p.name, description: p.description })));
        }

        if (providersRes.voice) {
          const rawVoices = providersRes.voice;
          const filteredVoices = configuredVoiceIds.size > 0
            ? rawVoices.filter((p: any) => configuredVoiceIds.has(p.id.toLowerCase()))
            : rawVoices;
          voices = filteredVoices.map((p: any) => ({
            value: p.id,
            label: `${p.name} (Configured)`,
            description: p.description
          }));
          setVoiceProviders(voices.length > 0 ? voices : rawVoices.map((p: any) => ({ value: p.id, label: p.name, description: p.description })));
        }

        // Set default selected provider (configured first, or first in list)
        const firstLlm = llms.find(p => configuredLlmIds.has(p.value.toLowerCase()))?.value || llms[0]?.value || '';
        const firstVoice = voices.find(p => configuredVoiceIds.has(p.value.toLowerCase()))?.value || voices[0]?.value || '';

        if (firstLlm) setSelectedLLMProvider(firstLlm);
        if (firstVoice) setSelectedVoiceProvider(firstVoice);

      } catch (err) {
        console.error('Failed to fetch provider lists', err);
      }
    };
    fetchProviders();
    loadAgents();
  }, []);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const msgText = chatInput;
    setChatInput('');
    setChatMessages((prev) => [...prev, { speaker: 'user', text: msgText }]);
    setIsChatSending(true);

    try {
      const res = await fetchAPI('/api/agent-engine/interact', {
        method: 'POST',
        body: JSON.stringify({
          agent_id: selectedAgent?.id || 'agent_1',
          user_message: msgText,
          selected_skill: selectedSkill,
        }),
      });

      setChatMessages((prev) => [
        ...prev,
        {
          speaker: 'ai',
          text: res.ai_response,
          latency: res.latency_ms,
          tokens: res.tokens_used,
          cost: res.estimated_cost,
          provider: res.selected_provider,
        },
      ]);
    } catch (err) {
      addToast('error', 'Failed to communicate with AI Agent Engine');
    } finally {
      setIsChatSending(false);
    }
  };

  const handleCompilePrompt = async () => {
    try {
      const res = await fetchAPI('/api/agent-engine/prompts/test', {
        method: 'POST',
        body: JSON.stringify({
          template: promptTemplate,
          variables: promptVars,
        }),
      });
      setCompiledPromptResult(res);
      addToast('success', 'Prompt compiled successfully');
    } catch (err) {
      addToast('error', 'Failed to compile prompt template');
    }
  };

  const handleFetchMemory = async () => {
    try {
      setIsMemoryLoading(true);
      setMemoryError(null);
      const targetId = selectedAgent?.id || 'agent_1';
      const res = await fetchAPI(`/api/agent-engine/memory/${targetId}`);
      setAgentMemory(res);
      addToast('info', 'Fetched Agent Memory Session state');
    } catch (err: any) {
      setMemoryError(err.message || 'Fetch memory error');
      addToast('error', 'Fetch memory error');
    } finally {
      setIsMemoryLoading(false);
    }
  };

  const handleExecuteTool = async () => {
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(toolArgsStr);
      } catch (e) {
        addToast('error', 'Invalid JSON tool arguments');
        return;
      }

      const res = await fetchAPI('/api/agent-engine/tools/execute', {
        method: 'POST',
        body: JSON.stringify({
          tool_name: toolName,
          arguments: parsed,
        }),
      });
      setToolOutput(res.output);
      addToast('success', `Tool '${toolName}' executed successfully`);
    } catch (err) {
      addToast('error', 'Tool execution error');
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentData.name.trim()) {
      addToast('warning', 'Agent name is required');
      return;
    }

    try {
      const created = await agentRepository.create({
        name: newAgentData.name,
        role: newAgentData.role,
        voice: newAgentData.voice,
        llmModel: newAgentData.llmModel,
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
        llmModel: '',
        language: 'English',
        status: 'active',
        systemPrompt: 'You are an empathetic, professional AI voice assistant.',
        temperature: 0.3,
        maxDurationSeconds: 600,
      });
      addToast('success', `Agent '${created.name}' created successfully!`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create agent');
    }
  };

  const handleOpenEditModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setEditAgentData({
      name: agent.name,
      role: agent.role,
      voice: agent.voice,
      llmModel: agent.llmModel,
      language: agent.language,
      status: agent.status,
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature,
      maxDurationSeconds: agent.maxDurationSeconds,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;

    try {
      const updated = await agentRepository.update(selectedAgent.id, editAgentData);
      setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setSelectedAgent(updated);
      setIsEditModalOpen(false);
      addToast('success', `Agent '${updated.name}' updated successfully!`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update agent');
    }
  };

  const handleDeleteAgent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete agent '${name}'?`)) return;
    try {
      await agentRepository.delete(id);
      setAgents((prev) => prev.filter((a) => a.id !== id));
      if (selectedAgent?.id === id) setSelectedAgent(null);
      addToast('info', `Agent '${name}' deleted.`);
    } catch (err: any) {
      addToast('error', 'Failed to delete agent');
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
          <div className="font-semibold text-zinc-800 dark:text-zinc-200">{row.voice}</div>
          <div className="text-[11px] text-zinc-400 font-mono">{row.llmModel}</div>
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
            onClick={() => handleDeleteAgent(row.id, row.name)}
            title="Delete Agent"
            className="h-7 px-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* PAGE HEADER */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          AI Voice Agents &amp; Engine Studio
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Enterprise multi-provider registry, dynamic models, real-time memory viewer, and interactive playground.
        </p>
      </div>

      {/* TOOLBAR 1: TABS ONLY */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-start gap-1 overflow-x-auto shrink-0 whitespace-nowrap shadow-xs">
        <button
          onClick={() => setActiveTab('roster')}
          className={`h-9 px-4 text-sm font-semibold rounded-lg transition-all flex items-center justify-center shrink-0 ${
            activeTab === 'roster'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Agent Roster
        </button>
        <button
          onClick={() => setActiveTab('playground')}
          className={`h-9 px-4 text-sm font-semibold rounded-lg transition-all flex items-center justify-center shrink-0 ${
            activeTab === 'playground'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Playground
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`h-9 px-4 text-sm font-semibold rounded-lg transition-all flex items-center justify-center shrink-0 ${
            activeTab === 'prompts'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Prompt Tester
        </button>
        <button
          onClick={() => {
            setActiveTab('memory');
            handleFetchMemory();
          }}
          className={`h-9 px-4 text-sm font-semibold rounded-lg transition-all flex items-center justify-center shrink-0 ${
            activeTab === 'memory'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Memory Viewer
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`h-9 px-4 text-sm font-semibold rounded-lg transition-all flex items-center justify-center shrink-0 ${
            activeTab === 'tools'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Tool Console
        </button>
        <button
          onClick={() => setActiveTab('voice_test')}
          className={`h-9 px-4 text-sm font-semibold rounded-lg transition-all flex items-center justify-center shrink-0 ${
            activeTab === 'voice_test'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Voice Studio
        </button>
        <button
          onClick={() => setActiveTab('voice_profiles' as any)}
          className={`h-9 px-4 text-sm font-semibold rounded-lg transition-all flex items-center justify-center shrink-0 ${
            (activeTab as string) === 'voice_profiles'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
          Voice Profiles
        </button>
      </div>

      {/* TAB 1: ROSTER VIEW (GRID / TABLE) */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* TOOLBAR 2: ACTION BUTTONS ONLY (Shared by Grid and List View) */}
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <Badge variant="primary" size="md">
                Active Persona: {selectedAgent?.name || 'Nexus Voice Assistant'}
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
                onClick={() => setIsCreateModalOpen(true)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map((agent) => (
                <Card
                  key={agent.id}
                  className={`p-4 transition-all duration-200 cursor-pointer ${
                    selectedAgent?.id === agent.id
                      ? 'border-blue-500 shadow-md ring-1 ring-blue-500'
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

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <Mic className="h-3.5 w-3.5 text-blue-500" /> Voice Engine:
                      </span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatVoiceName(agent.voice)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-purple-500" /> LLM Model:
                      </span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{agent.llmModel}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-emerald-500" /> Language:
                      </span>
                      <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{agent.language}</span>
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
                        if (onNavigate) {
                          onNavigate('demo-studio');
                        }
                      }}
                      className="text-xs font-semibold"
                    >
                      Open Studio
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
                          handleDeleteAgent(agent.id, agent.name);
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
        <div className="flex flex-col lg:flex-row gap-0 h-[660px] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
          {/* ── LEFT SIDE: CONVERSATION PANEL ───────────────────── */}
          <div className="flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/60 dark:bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {selectedAgent?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    {selectedAgent?.name || 'AI Assistant'}
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Engine Active" />
                  </h3>
                  <p className="text-xs text-zinc-500 truncate max-w-xs">
                    {selectedAgent?.role || 'Voice Agent Persona'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChatMessages([])}
                  className="text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Clear Session
                </button>
              </div>
            </div>

            {/* Scrollable Conversation */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin">
              {chatMessages.length === 0 && !isChatSending ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Start a session with {selectedAgent?.name || 'Agent'}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                      Type a message below to test real-time LLM response execution, latency, and token metrics.
                    </p>
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
          <div className="w-full lg:w-80 shrink-0 flex flex-col overflow-y-auto bg-zinc-50/60 dark:bg-zinc-900/40 p-5 space-y-5 scrollbar-thin">
            {/* 1. Model Info */}
            <div>
              <h4 className="text-[0.6875rem] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                Model Info
              </h4>
              <div className="p-3.5 bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/80 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">LLM Model</span>
                  <span className="font-semibold font-mono text-zinc-800 dark:text-zinc-200 text-[11px]">
                    {selectedAgent?.llmModel || 'Gemini 1.5 Flash'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Voice Engine</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-[11px]">
                    {selectedAgent?.voice || 'Rachel'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Language</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-[11px]">
                    {selectedAgent?.language || 'English (US)'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-zinc-100 dark:border-zinc-700/60">
                  <span className="text-zinc-500">Preset Skill</span>
                  <select
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 font-medium text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="none">Dynamic Agent Persona (Pure LLM)</option>
                    <option value="greeting">Greeting & Qualification</option>
                    <option value="appointment">Appointment Booking</option>
                    <option value="objection">Objection Handling</option>
                    <option value="transfer">Transfer Decision</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Telemetry & Metrics (Latency, Tokens, Cost) */}
            <div>
              <h4 className="text-[0.6875rem] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                Realtime Metrics
              </h4>
              {(() => {
                const lastAiMsg = [...chatMessages].reverse().find((m) => m.speaker === 'ai');
                return (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/80 text-center">
                      <span className="text-[10px] text-zinc-400 block font-medium">Latency</span>
                      <span className="font-bold text-sm text-blue-600 font-mono">
                        {lastAiMsg?.latency !== undefined ? `${lastAiMsg.latency}ms` : '—'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/80 text-center">
                      <span className="text-[10px] text-zinc-400 block font-medium">Tokens</span>
                      <span className="font-bold text-sm text-purple-600 font-mono">
                        {lastAiMsg?.tokens !== undefined ? lastAiMsg.tokens : '—'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/80 text-center">
                      <span className="text-[10px] text-zinc-400 block font-medium">Cost</span>
                      <span className="font-bold text-sm text-emerald-600 font-mono">
                        {lastAiMsg?.cost !== undefined ? `$${lastAiMsg.cost.toFixed(4)}` : '—'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 3. Memory & Context */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[0.6875rem] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Memory & Context
                </h4>
                <button
                  type="button"
                  onClick={handleFetchMemory}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Refresh Memory
                </button>
              </div>
              <div className="p-3.5 bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/80 space-y-2 text-xs">
                {agentMemory ? (
                  <>
                    <div className="flex justify-between text-zinc-500">
                      <span>Session ID:</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">
                        {agentMemory.session_id}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Context Window:</span>
                      <span className="font-mono text-blue-600 font-semibold">
                        {agentMemory.context_window_used || 128} / {agentMemory.max_context_limit || 8192}
                      </span>
                    </div>
                    <div className="text-zinc-600 dark:text-zinc-300 text-[11px] border-t border-zinc-100 dark:border-zinc-700 pt-2 leading-normal">
                      {agentMemory.summary || 'Active session memory initialized.'}
                    </div>
                  </>
                ) : (
                  <p className="text-zinc-400 italic text-[11px]">
                    No active memory loaded. Click Refresh Memory to inspect context.
                  </p>
                )}
              </div>
            </div>

            {/* 4. System Prompt Directive */}
            <div className="flex-1 flex flex-col min-h-[140px]">
              <h4 className="text-[0.6875rem] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                System Prompt Directive
              </h4>
              <Textarea
                rows={5}
                value={selectedAgent?.systemPrompt || ''}
                onChange={(e) => {
                  if (!selectedAgent) return;
                  setSelectedAgent({ ...selectedAgent, systemPrompt: e.target.value });
                }}
                placeholder="Enter system prompt instructions..."
                className="font-mono text-xs flex-1 bg-white dark:bg-zinc-800/80 resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROMPT TESTER */}
      {activeTab === 'prompts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4 space-y-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileCode className="h-4 w-4 text-purple-500" />
              Prompt Template Compiler
            </CardTitle>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-500 font-medium">Template String with Handlebars</label>
                <Textarea
                  rows={6}
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  className="font-mono text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 font-medium">Variable: {"{{name}}"}</label>
                  <Input
                    value={promptVars.name}
                    onChange={(e) => setPromptVars({ ...promptVars, name: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 font-medium">Variable: {"{{company}}"}</label>
                  <Input
                    value={promptVars.company}
                    onChange={(e) => setPromptVars({ ...promptVars, company: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>
              </div>

              <Button size="sm" variant="primary" onClick={handleCompilePrompt} leftIcon={<Sparkles className="h-4 w-4" />}>
                Compile & Evaluate Tokens
              </Button>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <CardTitle className="text-sm font-bold">Compiled Prompt Output</CardTitle>
            {compiledPromptResult ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-zinc-950 text-emerald-400 font-mono rounded-lg border border-zinc-800">
                  {compiledPromptResult.compiled_prompt}
                </div>
                <div className="flex gap-4 text-zinc-500 font-mono">
                  <span>Estimated Tokens: {compiledPromptResult.estimated_token_count}</span>
                  <span>Variable Count: {compiledPromptResult.variable_count}</span>
                </div>
              </div>
            ) : (
              <p className="text-zinc-400 italic text-xs">Click Compile to render handlebars payload.</p>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: MEMORY VIEWER */}
      {activeTab === 'memory' && (
        <Card className="flex flex-col min-h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-emerald-500" />
                Agent Memory & Session State
              </CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={handleFetchMemory} isLoading={isMemoryLoading} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
              Refresh Memory
            </Button>
          </CardHeader>
          <div className="p-5 flex-1 flex flex-col">
            {isMemoryLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800" />
                  <div className="h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800" />
                  <div className="h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="h-32 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800" />
              </div>
            ) : memoryError ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4 border border-red-100 dark:border-red-900/30">
                  <RefreshCw className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Failed to load memory</h3>
                <p className="text-xs text-zinc-500 max-w-sm mb-4">{memoryError}</p>
                <Button size="sm" variant="secondary" onClick={handleFetchMemory}>Try Again</Button>
              </div>
            ) : agentMemory ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-center">
                    <span className="text-zinc-500 mb-1">Session ID</span>
                    <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{agentMemory.session_id}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-center">
                    <span className="text-zinc-500 mb-1">Context Window</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-bold text-lg text-blue-600">{agentMemory.context_window_used}</span>
                      <span className="text-zinc-500">/ {agentMemory.max_context_limit}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-center">
                    <span className="text-zinc-500 mb-1">Entities Extracted</span>
                    <p className="font-bold text-lg text-emerald-600">{agentMemory.entities_extracted?.length || 0}</p>
                  </div>
                </div>

                <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-2 uppercase tracking-wider">Conversation Summary</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{agentMemory.summary}</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 border border-zinc-200 dark:border-zinc-700">
                  <BrainCircuit className="h-5 w-5 text-zinc-400" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">No Active Memory</h3>
                <p className="text-xs text-zinc-500 max-w-sm mb-4">
                  There is no active session memory for this agent. Start a conversation in the playground or click refresh to sync.
                </p>
                <Button size="sm" variant="primary" onClick={handleFetchMemory}>Sync Session State</Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* TAB 5: TOOL CONSOLE */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4 space-y-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-500" />
              Tool Execution Console
            </CardTitle>
            <div>
              <label className="text-xs font-semibold text-zinc-500">Tool Name</label>
              <select
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                className="w-full h-8 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 mt-1"
              >
                <option value="calculator">Math Calculator</option>
                <option value="date_time">Current Date / Time</option>
                <option value="knowledge_base">Knowledge Base Search</option>
                <option value="crm_lookup">CRM Customer Lookup</option>
                <option value="http_webhook">HTTP Webhook</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500">Tool Arguments (JSON)</label>
              <Textarea
                rows={4}
                value={toolArgsStr}
                onChange={(e) => setToolArgsStr(e.target.value)}
                className="font-mono text-xs mt-1"
              />
            </div>
            <Button size="sm" variant="primary" onClick={handleExecuteTool} leftIcon={<Wrench className="h-4 w-4" />}>
              Execute Tool
            </Button>
          </Card>

          <Card className="p-4 space-y-3">
            <CardTitle className="text-sm font-bold">Execution Response Payload</CardTitle>
            {toolOutput ? (
              <pre className="bg-zinc-950 text-emerald-400 font-mono text-xs p-4 rounded-lg overflow-x-auto border border-zinc-800">
                {JSON.stringify(toolOutput, null, 2)}
              </pre>
            ) : (
              <p className="text-zinc-400 italic text-xs">Execute a tool to view JSON response payload.</p>
            )}
          </Card>
        </div>
      )}

      {/* TAB 6: VOICE TEST STUDIO */}
      {activeTab === 'voice_test' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Controls */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-5 space-y-5 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Mic className="h-4 w-4 text-blue-500" />
                  Voice Configuration
                </CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <CommandPaletteSelect
                    label="Voice Provider"
                    options={voiceProviders}
                    value={testVoiceProvider}
                    onChange={(vpId) => setTestVoiceProvider(vpId)}
                    placeholder="Select provider..."
                    id="test-voice-provider"
                  />
                  <div className="relative">
                    <CommandPaletteSelect
                      label="Voice Model"
                      options={testVoiceModels}
                      value={testVoiceModel}
                      onChange={(voiceId) => setTestVoiceModel(voiceId)}
                      placeholder={isTestVoicesLoading ? 'Loading voices...' : 'Select voice...'}
                      id="test-voice-model"
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
                  />

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Speed</label>
                    <Input type="number" step="0.1" value={testSpeed} onChange={(e) => setTestSpeed(Number(e.target.value))} className="h-10 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Pitch</label>
                    <Input type="number" step="0.1" value={testPitch} onChange={(e) => setTestPitch(Number(e.target.value))} className="h-10 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Temperature</label>
                    <Input type="number" step="0.1" value={testTemperature} onChange={(e) => setTestTemperature(Number(e.target.value))} className="h-10 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Style</label>
                    <Input type="number" step="0.1" value={testStyle} onChange={(e) => setTestStyle(Number(e.target.value))} className="h-10 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Stability</label>
                    <Input type="number" step="0.1" value={testStability} onChange={(e) => setTestStability(Number(e.target.value))} className="h-10 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Similarity</label>
                    <Input type="number" step="0.1" value={testSimilarity} onChange={(e) => setTestSimilarity(Number(e.target.value))} className="h-10 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Emotion</label>
                    <select
                      value={testEmotion}
                      onChange={(e) => setTestEmotion(e.target.value)}
                      className="w-full h-10 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 mt-1"
                    >
                      <option value="Neutral">Neutral</option>
                      <option value="Happy">Happy</option>
                      <option value="Sad">Sad</option>
                      <option value="Angry">Angry</option>
                      <option value="Excited">Excited</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card className="p-5 space-y-4 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                    Text Input
                  </div>
                  <span className="text-xs font-normal text-zinc-400">{testText.length} characters</span>
                </CardTitle>
                <Textarea
                  rows={4}
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter text to synthesize..."
                  className="text-sm"
                />
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    isLoading={isTestGenerating}
                    leftIcon={<Play className="h-4 w-4" />}
                    onClick={async () => {
                      if (!testVoiceModel) return addToast('error', 'Select a voice model first');
                      setIsTestGenerating(true);
                      try {
                        const res = await fetch('/api/providers/voices/preview', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ provider: testVoiceProvider, voice_id: testVoiceModel, text: testText }),
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
                          const utterance = new SpeechSynthesisUtterance(testText);
                          window.speechSynthesis.speak(utterance);
                          addToast('success', 'Speech synthesized via Web Speech engine');
                        }
                      } catch (err) {
                        try {
                          const utterance = new SpeechSynthesisUtterance(testText);
                          window.speechSynthesis.speak(utterance);
                          addToast('success', 'Speech synthesized via Web Speech engine');
                        } catch (e) {
                          addToast('error', 'Failed to generate speech');
                        }
                      } finally {
                        setIsTestGenerating(false);
                      }
                    }}
                  >
                    Generate Speech
                  </Button>
                  
                  {testAudioUrl && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        if (testAudioRef.current) {
                          testAudioRef.current.currentTime = 0;
                          testAudioRef.current.play();
                        }
                      }} leftIcon={<RotateCcw className="h-4 w-4" />}>
                        Replay
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        if (testAudioRef.current) {
                          testAudioRef.current.pause();
                          testAudioRef.current.currentTime = 0;
                        }
                      }} leftIcon={<Square className="h-4 w-4" />}>
                        Stop
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        const link = document.createElement('a');
                        link.href = testAudioUrl;
                        link.download = `nexus_voice_${Date.now()}.mp3`;
                        link.click();
                      }} leftIcon={<Download className="h-4 w-4" />}>
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right: Output & Metadata */}
            <div className="space-y-6">
              <Card className="p-5 space-y-4 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  Playback & Metadata
                </CardTitle>
                
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center min-h-32 w-full">
                  <audio ref={testAudioRef} controls className="w-full h-10" src={testAudioUrl || undefined} />
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 font-semibold">Status</span>
                    <Badge variant={isTestGenerating ? 'secondary' : (testAudioUrl ? 'success' : 'default')} size="sm">
                      {isTestGenerating ? 'Streaming...' : (testAudioUrl ? 'Ready' : 'Idle')}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 font-semibold">Format</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-mono">audio/mpeg</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 font-semibold">Sample Rate</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-mono">24000 Hz</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-zinc-500 font-semibold">Estimated Cost</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-mono">~ $0.00{Math.floor(testText.length * 0.15)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: VOICE PROFILES STUDIO (PERSONA CONFIGURATION OBJECTS) */}
      {(activeTab as string) === 'voice_profiles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span>Persona Voice Profiles & Accent Studio</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Configure persona voice profiles, accent settings, pitch, stability, and assign them directly to AI Voice Agents.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setActiveTab('voice_test');
                addToast('info', 'Configure new voice persona parameters in Voice Studio');
              }}
            >
              Create Voice Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (SDR Receptionist)', description: 'ElevenLabs • US Neutral Female', gender: 'Female', accent: 'US Neutral', engine: 'ElevenLabs', status: 'Active', stability: 0.45, similarity: 0.85 },
              { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Executive Support)', description: 'ElevenLabs • UK Professional Female', gender: 'Female', accent: 'UK Professional', engine: 'ElevenLabs', status: 'Active', stability: 0.50, similarity: 0.80 },
              { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Soft Support)', description: 'ElevenLabs • US Soft Female', gender: 'Female', accent: 'US Soft', engine: 'ElevenLabs', status: 'Active', stability: 0.40, similarity: 0.75 },
              { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Deep Sales)', description: 'ElevenLabs • US Deep Male', gender: 'Male', accent: 'US Executive', engine: 'ElevenLabs', status: 'Active', stability: 0.55, similarity: 0.85 },
              { id: 'aura-stella-en', name: 'Stella (Conversational Realtime)', description: 'Deepgram Aura • Telephony Female', gender: 'Female', accent: 'US English', engine: 'Deepgram Aura', status: 'Active', stability: 0.50, similarity: 0.90 },
              { id: 'sonic-latest', name: 'Sonic (Ultra Fast Stream)', description: 'Cartesia Sonic • Low Latency <100ms', gender: 'Female', accent: 'Multilingual', engine: 'Cartesia', status: 'Active', stability: 0.45, similarity: 0.85 },
            ].map((vp) => (
              <Card key={vp.id} className="p-4 space-y-3 hover:border-blue-500/50 transition-all border-zinc-200 dark:border-zinc-800 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      <Mic className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{vp.name}</h4>
                      <span className="text-[10px] text-zinc-500 font-mono block">{vp.engine}</span>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">{vp.status}</Badge>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">{vp.description}</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg font-mono">
                  <div>
                    <span className="text-zinc-400 block">Stability</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{vp.stability}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Similarity</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{vp.similarity}</span>
                  </div>
                </div>
                <div className="pt-1 flex items-center justify-between gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    className="w-full justify-center text-[11px]"
                    onClick={() => {
                      setTestVoiceModel(vp.id);
                      setActiveTab('voice_test');
                      addToast('info', `Loaded voice profile '${vp.name}' in Voice Studio`);
                    }}
                  >
                    Test Profile Audio
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* CREATE AGENT MODAL — Enterprise Command-Palette Dropdowns */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New AI Agent" maxWidth="4xl">
        <form onSubmit={handleCreateAgent} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <Card className="p-4 space-y-4 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                <CardTitle className="text-sm font-bold flex items-center gap-2 mb-2">
                  <span className="h-5 w-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                    1
                  </span>
                  Agent Identity
                </CardTitle>
                
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Agent Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newAgentData.name}
                    onChange={(e) => setNewAgentData({ ...newAgentData, name: e.target.value })}
                    placeholder="e.g. Rachel – Inbound Support Lead"
                    className="text-sm h-10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Role / Persona
                  </label>
                  <Input
                    value={newAgentData.role}
                    onChange={(e) => setNewAgentData({ ...newAgentData, role: e.target.value })}
                    placeholder="e.g. Customer Support Specialist"
                    className="text-sm h-10"
                  />
                </div>
              </Card>

              <Card className="p-4 space-y-4 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                <CardTitle className="text-sm font-bold flex items-center gap-2 mb-2">
                  <span className="h-5 w-5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center">
                    2
                  </span>
                  Language Model Engine
                </CardTitle>

              <div className="grid grid-cols-2 gap-4">
                <CommandPaletteSelect
                  label="LLM Provider"
                  options={llmProviders}
                  value={selectedLLMProvider}
                  onChange={(provId) => setSelectedLLMProvider(provId)}
                  placeholder="Select LLM provider..."
                  id="create-llm-provider"
                />
                <div className="relative">
                  <CommandPaletteSelect
                    label="Model"
                    options={llmModels}
                    value={newAgentData.llmModel}
                    onChange={(modelId) => setNewAgentData((prev) => ({ ...prev, llmModel: modelId }))}
                    placeholder={isModelsLoading ? 'Loading models...' : 'Select model...'}
                    id="create-llm-model"
                  />
                  {llmProviderLimitation && (
                    <div className="absolute top-16 left-0 right-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] p-2 rounded-md border border-red-200 dark:border-red-800/30 z-10">
                      {llmProviderLimitation}
                    </div>
                  )}
                </div>
              </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <Card className="p-4 space-y-4 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                <CardTitle className="text-sm font-bold flex items-center gap-2 mb-2">
                  <span className="h-5 w-5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                    3
                  </span>
                  Voice Engine
                </CardTitle>
              <div className="grid grid-cols-2 gap-4">
                <CommandPaletteSelect
                  label="Voice Provider"
                  options={voiceProviders}
                  value={selectedVoiceProvider}
                  onChange={(vpId) => setSelectedVoiceProvider(vpId)}
                  placeholder="Select voice provider..."
                  id="create-voice-provider"
                />
                <div className="relative">
                  <CommandPaletteSelect
                    label="Voice"
                    options={voiceModels}
                    value={newAgentData.voice}
                    onChange={(voiceId) => setNewAgentData((prev) => ({ ...prev, voice: voiceId }))}
                    placeholder={isVoicesLoading ? 'Loading voices...' : 'Select voice...'}
                    id="create-voice"
                  />
                  {voiceProviderLimitation && (
                    <div className="absolute top-16 left-0 right-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] p-2 rounded-md border border-red-200 dark:border-red-800/30 z-10">
                      {voiceProviderLimitation}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mt-2 mb-2">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                    Custom Preview Sample Text
                  </label>
                  <Input
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Enter custom text to test voice..."
                    className="text-xs h-8"
                  />
                </div>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  isLoading={isPreviewing}
                  leftIcon={isPreviewing ? undefined : <Mic className="h-3 w-3" />}
                  onClick={async () => {
                    const voiceId = newAgentData.voice;
                    if (!voiceId) return;
                    setIsPreviewing(true);
                    setPreviewError(null);
                    const sampleText = previewText.trim() || 'Hello, I am ready to handle your calls.';
                    try {
                      const res = await fetch('/api/providers/voices/preview', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ provider: selectedVoiceProvider, voice_id: voiceId, text: sampleText }),
                      });
                      if (res.ok) {
                        const blob = await res.blob();
                        const audio = new Audio(URL.createObjectURL(blob));
                        await audio.play();
                      } else {
                        const utterance = new SpeechSynthesisUtterance(sampleText);
                        window.speechSynthesis.speak(utterance);
                      }
                    } catch (err: any) {
                      try {
                        const utterance = new SpeechSynthesisUtterance(sampleText);
                        window.speechSynthesis.speak(utterance);
                      } catch (e) {
                        setPreviewError('Voice preview playback failed.');
                      }
                    } finally {
                      setIsPreviewing(false);
                    }
                  }}
                  className="h-7 text-[11px] w-full"
                >
                  ▶ Preview Voice
                </Button>
                {previewError && <span className="text-[10px] text-red-500 block text-center mt-1">{previewError}</span>}
              </div>
              </Card>

              <Card className="p-4 space-y-4 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm mt-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2 mb-2">
                  <span className="h-5 w-5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
                    4
                  </span>
                  Language &amp; Settings
                </CardTitle>
                <div className="grid grid-cols-2 gap-4">
                  <CommandPaletteSelect
                    label="Language"
                    options={languageOptions()}
                    value={newAgentData.language}
                    onChange={(lang) => setNewAgentData((prev) => ({ ...prev, language: lang }))}
                    placeholder="Select language..."
                    id="create-language"
                  />
                  
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Temperature
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={newAgentData.temperature}
                      onChange={(e) => setNewAgentData({ ...newAgentData, temperature: parseFloat(e.target.value) })}
                      className="text-sm h-10"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* SSOT Business & Rules Section */}
          <Card className="p-4 space-y-4 border-blue-200/80 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <span className="h-5 w-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  SSOT
                </span>
                <span>Business &amp; Rules Configuration</span>
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                onClick={() => {
                  const updatedPrompt = buildAgentSystemPromptWithRules(newAgentData.systemPrompt, newAgentData.businessTypeId, newAgentData.departmentId);
                  setNewAgentData(prev => ({ ...prev, systemPrompt: updatedPrompt }));
                  addToast('success', 'Injected Business Rules & Compliance Guardrails into System Prompt');
                }}
              >
                ⚡ Apply SSOT Rules to System Prompt
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Business Vertical</label>
                <select
                  value={newAgentData.businessTypeId}
                  onChange={(e) => {
                    const btId = e.target.value;
                    const selectedBt = businessTypes.find(b => b.id === btId || b.name === btId);
                    setNewAgentData(prev => ({
                      ...prev,
                      businessTypeId: btId,
                      language: selectedBt?.default_language || prev.language
                    }));
                  }}
                  className="w-full h-9 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
                >
                  {businessTypes.map(bt => (
                    <option key={bt.id} value={bt.id}>{bt.name} ({bt.category || 'General'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Target Department</label>
                <select
                  value={newAgentData.departmentId}
                  onChange={(e) => setNewAgentData(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full h-9 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.extension || '#101'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Operating Hours Profile</label>
                <select
                  value={newAgentData.workingHoursId}
                  onChange={(e) => setNewAgentData(prev => ({ ...prev, workingHoursId: e.target.value }))}
                  className="w-full h-9 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs"
                >
                  {workingHours.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Full Width Row */}
          <Card className="p-4 space-y-4 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
            <CardTitle className="text-sm font-bold flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-md bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center">
                  5
                </span>
                <span>System Instructions</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-normal">
                Click any tag below to insert into prompt
              </span>
            </CardTitle>

            {/* Separate Collapsible Dropdown Panels for Data Fields and Variables in Prompts */}
            <div className="space-y-2.5">
              <AgentPromptTagDropdownPanel
                title="CRM Data Fields"
                count={promptDataFieldTags.length}
                subtitle="Schema attributes & fields (e.g. {{contact.alternate_phone}}, {{contact.insurance_carrier}})"
                icon={<Sliders className="h-4 w-4" />}
                theme="amber"
                items={promptDataFieldTags}
                onInsert={(tag) => {
                  const current = newAgentData.systemPrompt || '';
                  setNewAgentData({ ...newAgentData, systemPrompt: `${current} ${tag}`.trim() });
                  addToast(`Inserted ${tag} into prompt`, 'info');
                }}
              />

              <AgentPromptTagDropdownPanel
                title="Workspace Dynamic Variables"
                count={promptVariableTags.length}
                subtitle="Dynamic workspace variables & tokens (e.g. {{appointment_date}}, {{company_name}})"
                icon={<Variable className="h-4 w-4" />}
                theme="blue"
                items={promptVariableTags}
                onInsert={(tag) => {
                  const current = newAgentData.systemPrompt || '';
                  setNewAgentData({ ...newAgentData, systemPrompt: `${current} ${tag}`.trim() });
                  addToast(`Inserted ${tag} into prompt`, 'info');
                }}
              />
            </div>

            <div>
              <Textarea
                rows={5}
                value={newAgentData.systemPrompt}
                onChange={(e) => setNewAgentData({ ...newAgentData, systemPrompt: e.target.value })}
                className="font-mono text-sm"
                placeholder="Enter base prompt directive... e.g. Hello {{contact.name}}, your registered insurance is {{contact.dental_insurance_carrier}}."
              />
            </div>
          </Card>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-5 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" size="md" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save &amp; Provision Agent
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT AGENT MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Agent: ${selectedAgent?.name}`} maxWidth="4xl">
        <form onSubmit={handleUpdateAgent} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <Card className="p-4 space-y-4 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                <CardTitle className="text-sm font-bold flex items-center gap-2 mb-2">
                  <span className="h-5 w-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                    1
                  </span>
                  Agent Identity
                </CardTitle>
                
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Agent Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editAgentData.name}
                    onChange={(e) => setEditAgentData({ ...editAgentData, name: e.target.value })}
                    className="text-sm h-10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Role / Persona
                  </label>
                  <Input
                    value={editAgentData.role}
                    onChange={(e) => setEditAgentData({ ...editAgentData, role: e.target.value })}
                    className="text-sm h-10"
                  />
                </div>
              </Card>

              <Card className="p-4 space-y-4 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                <CardTitle className="text-sm font-bold flex items-center gap-2 mb-2">
                  <span className="h-5 w-5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center">
                    2
                  </span>
                  Language Model Engine
                </CardTitle>

              <div className="grid grid-cols-2 gap-4">
                <CommandPaletteSelect
                  label="LLM Provider"
                  options={llmProviders}
                  value={selectedLLMProvider}
                  onChange={(provId) => setSelectedLLMProvider(provId)}
                  placeholder="Select LLM provider..."
                  id="edit-llm-provider"
                />
                <div className="relative">
                  <CommandPaletteSelect
                    label="Model"
                    options={llmModels}
                    value={editAgentData.llmModel}
                    onChange={(modelId) => setEditAgentData((prev) => ({ ...prev, llmModel: modelId }))}
                    placeholder={isModelsLoading ? 'Loading models...' : 'Select model...'}
                    id="edit-llm-model"
                  />
                  {llmProviderLimitation && (
                    <div className="absolute top-16 left-0 right-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] p-2 rounded-md border border-red-200 dark:border-red-800/30 z-10">
                      {llmProviderLimitation}
                    </div>
                  )}
                </div>
              </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <Card className="p-4 space-y-4 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                <CardTitle className="text-sm font-bold flex items-center gap-2 mb-2">
                  <span className="h-5 w-5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                    3
                  </span>
                  Voice Engine
                </CardTitle>
              <div className="grid grid-cols-2 gap-4">
                <CommandPaletteSelect
                  label="Voice Provider"
                  options={voiceProviders}
                  value={selectedVoiceProvider}
                  onChange={(vpId) => setSelectedVoiceProvider(vpId)}
                  placeholder="Select voice provider..."
                  id="edit-voice-provider"
                />
                <div className="relative">
                  <CommandPaletteSelect
                    label="Voice"
                    options={voiceModels}
                    value={editAgentData.voice}
                    onChange={(voiceId) => setEditAgentData((prev) => ({ ...prev, voice: voiceId }))}
                    placeholder={isVoicesLoading ? 'Loading voices...' : 'Select voice...'}
                    id="edit-voice"
                  />
                  {voiceProviderLimitation && (
                    <div className="absolute top-16 left-0 right-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] p-2 rounded-md border border-red-200 dark:border-red-800/30 z-10">
                      {voiceProviderLimitation}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mt-2 mb-2">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                    Custom Preview Sample Text
                  </label>
                  <Input
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Enter custom text to test voice..."
                    className="text-xs h-8"
                  />
                </div>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  isLoading={isPreviewing}
                  leftIcon={isPreviewing ? undefined : <Mic className="h-3 w-3" />}
                  onClick={async () => {
                    const voiceId = editAgentData.voice;
                    if (!voiceId) return;
                    setIsPreviewing(true);
                    setPreviewError(null);
                    const sampleText = previewText.trim() || 'Hello, I am ready to handle your calls.';
                    try {
                      const res = await fetch('/api/providers/voices/preview', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ provider: selectedVoiceProvider, voice_id: voiceId, text: sampleText }),
                      });
                      if (res.ok) {
                        const blob = await res.blob();
                        const audio = new Audio(URL.createObjectURL(blob));
                        await audio.play();
                      } else {
                        const utterance = new SpeechSynthesisUtterance(sampleText);
                        window.speechSynthesis.speak(utterance);
                      }
                    } catch (err: any) {
                      try {
                        const utterance = new SpeechSynthesisUtterance(sampleText);
                        window.speechSynthesis.speak(utterance);
                      } catch (e) {
                        setPreviewError('Voice preview playback failed.');
                      }
                    } finally {
                      setIsPreviewing(false);
                    }
                  }}
                  className="h-7 text-[11px] w-full"
                >
                  ▶ Preview Voice
                </Button>
                {previewError && <span className="text-[10px] text-red-500 block text-center mt-1">{previewError}</span>}
              </div>
              </Card>

              <Card className="p-4 space-y-4 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm mt-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2 mb-2">
                  <span className="h-5 w-5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
                    4
                  </span>
                  Language &amp; Settings
                </CardTitle>
                <div className="grid grid-cols-2 gap-4">
                  <CommandPaletteSelect
                    label="Language"
                    options={languageOptions()}
                    value={editAgentData.language}
                    onChange={(lang) => setEditAgentData((prev) => ({ ...prev, language: lang }))}
                    placeholder="Select language..."
                    id="edit-language"
                  />
                  
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Temperature
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={editAgentData.temperature}
                      onChange={(e) => setEditAgentData({ ...editAgentData, temperature: parseFloat(e.target.value) })}
                      className="text-sm h-10"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Full Width Row */}
          <Card className="p-4 space-y-4 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
            <CardTitle className="text-sm font-bold flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-md bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center">
                  5
                </span>
                <span>System Instructions</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-normal">
                Click any tag below to insert into prompt
              </span>
            </CardTitle>

            {/* Separate Collapsible Dropdown Panels for Data Fields and Variables in Prompts */}
            <div className="space-y-2.5">
              <AgentPromptTagDropdownPanel
                title="CRM Data Fields"
                count={promptDataFieldTags.length}
                subtitle="Schema attributes & fields (e.g. {{contact.alternate_phone}}, {{contact.insurance_carrier}})"
                icon={<Sliders className="h-4 w-4" />}
                theme="amber"
                items={promptDataFieldTags}
                onInsert={(tag) => {
                  const current = editAgentData.systemPrompt || '';
                  setEditAgentData({ ...editAgentData, systemPrompt: `${current} ${tag}`.trim() });
                  addToast(`Inserted ${tag} into prompt`, 'info');
                }}
              />

              <AgentPromptTagDropdownPanel
                title="Workspace Dynamic Variables"
                count={promptVariableTags.length}
                subtitle="Dynamic workspace variables & tokens (e.g. {{appointment_date}}, {{company_name}})"
                icon={<Variable className="h-4 w-4" />}
                theme="blue"
                items={promptVariableTags}
                onInsert={(tag) => {
                  const current = editAgentData.systemPrompt || '';
                  setEditAgentData({ ...editAgentData, systemPrompt: `${current} ${tag}`.trim() });
                  addToast(`Inserted ${tag} into prompt`, 'info');
                }}
              />
            </div>

            <div>
              <Textarea
                rows={5}
                value={editAgentData.systemPrompt}
                onChange={(e) => setEditAgentData({ ...editAgentData, systemPrompt: e.target.value })}
                className="font-mono text-sm"
                placeholder="Enter base prompt directive... e.g. Hello {{contact.name}}, your registered insurance is {{contact.dental_insurance_carrier}}."
              />
            </div>
          </Card>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-5 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" size="md" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
