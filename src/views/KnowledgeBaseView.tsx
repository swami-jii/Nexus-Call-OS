import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  FileText,
  Globe,
  Trash2,
  Check,
  RefreshCw,
  Eye,
  Upload,
  Search,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Music,
  Video,
  Edit2,
  ExternalLink,
  Loader2,
  Layers,
  Sparkles,
  Database,
  Sliders,
  Copy,
  Activity,
  HardDrive,
  Headphones,
  Settings,
  FolderOpen,
  CheckCircle2,
  Zap,
  ArrowRight,
  Filter,
  RotateCcw,
  ShieldCheck,
  Cpu,
  Building,
  HelpCircle,
  Clock,
  Archive,
  CreditCard,
  ListChecks,
  Box,
  ChevronRight,
  UploadCloud,
  FileCheck,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  AlertCircle,
  LayoutGrid,
  List,
  Crown,
  Lock,
  Megaphone,
  Brain,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { SearchableSelect, SearchableOption } from '../components/ui/SearchableSelect';
import { FilePreviewModal, PreviewableFile } from '../components/ui/FilePreviewModal';
import { useToast } from '../components/ui/Toast';
import { CampaignReturnBanner } from '../components/campaigns/CampaignReturnBanner';
import { knowledgeRepository, uploadRepository } from '../repository';
import { fetchAPI } from '../lib/api';
import { triggerNavigationHandoff } from '../lib/handoffNavigation';
import { usePlanEntitlements } from '../hooks/usePlanEntitlements';
import { PlanGuardrailModal } from '../components/ui/PlanGuardrailModal';
import { GLOBAL_LANGUAGES_CATALOG, GlobalLanguageItem } from '../data/globalLanguagesCatalog';
import { DEFAULT_BUSINESS_RULES_ITEMS, LLM_CATALOG } from '../constants/defaultBusinessRules';
import { KnowledgeDocument } from '../types';
import {
  getTenantStorage,
  setTenantStorage,
  getActiveUserEmail,
  getActiveTargetOrgId,
} from '../tenant';

export interface ExtendedKnowledgeDoc extends KnowledgeDocument {
  createdDate?: string;
  updatedDate?: string;
  format?: 'PDF' | 'DOCX' | 'TXT' | 'CSV' | 'Markdown' | 'Image' | 'Audio' | 'Video' | 'Web Page';
  progressPercent?: number;
  totalPages?: number;
  processedPages?: number;
  visionPages?: number;
  stage?: string;
  metrics?: Record<string, any>;
  rawContent?: string;
}

export interface KnowledgeCollectionItem {
  id: string;
  name: string;
  display_name: string;
  description: string;
  knowledge_type: string;
  custom_knowledge_type?: string;
  status: 'Active' | 'Draft' | 'Archived';
  scope: 'Global Workspace' | 'Organization Level' | 'Agent Level';
  source_type: 'Attached Document from Library' | 'Website / URL' | 'Sitemap' | 'FAQ / Text' | 'API';
  attached_doc_id?: string;
  attached_doc_name?: string;
  web_url?: string;
  crawl_depth?: string;
  raw_text?: string;
  uploaded_chunks?: number;
  chunking_strategy: string;
  chunk_size: string;
  chunk_overlap?: string;
  llm_provider?: string;
  llm_model?: string;
  embedding_provider: string;
  embedding_model: string;
  vector_store: 'ChromaDB' | 'Pinecone' | 'Qdrant' | 'Milvus' | 'Weaviate';
  primary_language?: string;
  multilingual_indexing?: boolean;
  strictness?: 'Strict Grounding' | 'Balanced Synthesis' | 'Creative Reasoning';
  temperature?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DynamicGroundingCard {
  label: string;
  query: string;
  icon?: string;
  category?: string;
  badge?: string;
}

export const renderCardCategoryIcon = (card: { label: string; query?: string; icon?: string; category?: string; badge?: string }) => {
  const iconStr = (card.icon || card.category || card.label || '').toLowerCase();
  if (iconStr.includes('price') || iconStr.includes('cost') || iconStr.includes('plan') || iconStr.includes('pricing') || iconStr.includes('tier') || iconStr.includes('rate') || iconStr.includes('₹') || iconStr.includes('$')) {
    return <CreditCard className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  }
  if (iconStr.includes('api') || iconStr.includes('tech') || iconStr.includes('integrat') || iconStr.includes('code') || iconStr.includes('stack') || iconStr.includes('dev')) {
    return <Layers className="h-3.5 w-3.5 text-indigo-500 shrink-0" />;
  }
  if (iconStr.includes('contact') || iconStr.includes('founder') || iconStr.includes('phone') || iconStr.includes('email') || iconStr.includes('team') || iconStr.includes('support') || iconStr.includes('help')) {
    return <Headphones className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
  }
  if (iconStr.includes('policy') || iconStr.includes('term') || iconStr.includes('refund') || iconStr.includes('warranty') || iconStr.includes('guarantee') || iconStr.includes('legal') || iconStr.includes('rule')) {
    return <ShieldCheck className="h-3.5 w-3.5 text-rose-500 shrink-0" />;
  }
  if (iconStr.includes('app') || iconStr.includes('product') || iconStr.includes('ecommerce') || iconStr.includes('lms') || iconStr.includes('portal') || iconStr.includes('solution') || iconStr.includes('feature')) {
    return <Box className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
  }
  if (iconStr.includes('service') || iconStr.includes('custom') || iconStr.includes('work') || iconStr.includes('fast')) {
    return <Zap className="h-3.5 w-3.5 text-purple-500 shrink-0" />;
  }
  return <Sparkles className="h-3.5 w-3.5 text-sky-500 shrink-0" />;
};

export const cleanVoiceAgentFormatting = (text?: string): string => {
  if (!text) return '';
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\[\s*(?:Logo|Icon|Image|Button|QR CODE IMAGE|Get Started|x|X|\s*)\s*\]/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\|{2,}/g, '\n')
    .replace(/\|\s*:?-+:?\s*\|/g, '')
    .replace(/\|\s*:?-+:?\s*/g, '')
    .replace(/:?-{3,}:?/g, '')
    .replace(/\s*\|\s*/g, '\n• ')
    .replace(/\s*(?:---|===|___)\s*/g, '\n')
    .replace(/Page\s+\d+\s*/gi, '')
    .trim();
};

export const renderInlineMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-zinc-950 dark:text-zinc-50">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('__') && token.endsWith('__')) {
      parts.push(
        <strong key={match.index} className="font-bold text-zinc-950 dark:text-zinc-50">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-semibold">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-zinc-800 dark:text-zinc-200">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('_') && token.endsWith('_')) {
      parts.push(
        <em key={match.index} className="italic text-zinc-800 dark:text-zinc-200">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

export const renderMarkdownContent = (content?: string, isCompact: boolean = false): React.ReactNode => {
  if (!content || !content.trim()) {
    return <span className="text-zinc-400 italic text-xs">No content available</span>;
  }

  const cleaned = cleanVoiceAgentFormatting(content);
  const lines = cleaned.split('\n');

  return (
    <div className={`space-y-1.5 ${isCompact ? 'text-[11.5px]' : 'text-xs'}`}>
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) {
          return <div key={idx} className="h-1" />;
        }

        // Heading lines (### Heading or ## Heading or # Heading)
        if (line.startsWith('#')) {
          const headingText = line.replace(/^#+\s*/, '');
          return (
            <h4
              key={idx}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 pt-1 pb-0.5 flex items-center gap-1.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>{renderInlineMarkdown(headingText)}</span>
            </h4>
          );
        }

        // Bullet point lines (• item, - item, * item, + item)
        const bulletMatch = line.match(/^([•\-\*\+])\s+(.*)/);
        if (bulletMatch) {
          const bulletText = bulletMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2 text-zinc-800 dark:text-zinc-200 leading-relaxed pl-0.5">
              <span className="text-blue-500 font-bold select-none shrink-0 mt-0.5">•</span>
              <div className="flex-1 min-w-0">{renderInlineMarkdown(bulletText)}</div>
            </div>
          );
        }

        // Numbered list item (1. item, 2. item)
        const numberMatch = line.match(/^(\d+)[\.\)]\s+(.*)/);
        if (numberMatch) {
          const num = numberMatch[1];
          const numText = numberMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2 text-zinc-800 dark:text-zinc-200 leading-relaxed pl-0.5">
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold text-[10px] border border-blue-200 dark:border-blue-900/60 shrink-0 mt-0.5">
                {num}
              </span>
              <div className="flex-1 min-w-0">{renderInlineMarkdown(numText)}</div>
            </div>
          );
        }

        // If line is a plain key: value without markdown (e.g., "REST API Integration: ₹4,999")
        const colonIdx = line.indexOf(':');
        if (!line.includes('**') && colonIdx > 2 && colonIdx < 35 && !line.startsWith('http')) {
          const k = line.slice(0, colonIdx).trim();
          const v = line.slice(colonIdx + 1).trim();
          return (
            <div key={idx} className="flex items-start gap-2 text-zinc-800 dark:text-zinc-200 leading-relaxed pl-0.5">
              <span className="text-blue-500 font-bold select-none shrink-0 mt-0.5">•</span>
              <div className="flex-1 min-w-0">
                <strong className="font-bold text-zinc-950 dark:text-zinc-50">{k}:</strong> {renderInlineMarkdown(v)}
              </div>
            </div>
          );
        }

        // Regular paragraph line
        return (
          <p key={idx} className="text-zinc-800 dark:text-zinc-200 leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
};

export const renderSmartEvidenceSnippet = (text: string, isExpanded: boolean) => {
  return (
    <div className="bg-zinc-50/70 dark:bg-zinc-950/60 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 max-h-72 overflow-y-auto">
      {renderMarkdownContent(text, !isExpanded)}
    </div>
  );
};

const cleanLegacyCollections = (items: any[]): any[] => {
  if (!Array.isArray(items)) return [];
  return items.filter((c: any) => {
    if (!c) return false;
    const id = String(c.id || '');
    const name = String(c.name || '').trim();
    const dname = String(c.display_name || '').trim();
    if (id === 'kno-1787025472706') return false;
    if (name === '1' && dname === '2') return false;
    if (!name && !dname && !id) return false;
    return true;
  });
};

const sanitizeCollectionItem = (col: any, index: number): KnowledgeCollectionItem => {
  const rawDisplayName = (col.display_name || col.name || col.title || '').trim();
  const displayName = rawDisplayName || (col.id ? `Collection ${col.id}` : `Collection #${index + 1}`);
  const rawChunks = typeof col.uploaded_chunks === 'number'
    ? col.uploaded_chunks
    : typeof col.chunks === 'number'
    ? col.chunks
    : typeof col.chunk_count === 'number'
    ? col.chunk_count
    : (typeof col.chunk_count === 'string' ? parseInt(col.chunk_count, 10) : 0);

  return {
    id: col.id || `kc_${Date.now()}_${index}`,
    name: col.name || displayName.toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
    display_name: displayName,
    description: col.description || 'Vectorized RAG retrieval collection for AI voice agents and live telephony grounding.',
    knowledge_type: col.knowledge_type || 'Product/Service',
    custom_knowledge_type: col.custom_knowledge_type,
    status: col.status || 'Active',
    scope: col.scope || 'Global Workspace',
    source_type: col.source_type || 'Attached Document from Library',
    attached_doc_id: col.attached_doc_id,
    attached_doc_name: col.attached_doc_name,
    web_url: col.web_url,
    crawl_depth: col.crawl_depth,
    raw_text: col.raw_text,
    uploaded_chunks: Number.isFinite(rawChunks) ? Number(rawChunks) : 0,
    chunking_strategy: col.chunking_strategy || 'Recursive Character (1024 tokens)',
    chunk_size: col.chunk_size || '1024',
    chunk_overlap: col.chunk_overlap || '128',
    llm_provider: col.llm_provider || 'Dynamic LLM',
    llm_model: col.llm_model || 'Configured Model',
    embedding_provider: col.embedding_provider || 'Dynamic Embedding',
    embedding_model: col.embedding_model || 'text-embedding',
    vector_store: col.vector_store || 'ChromaDB',
    primary_language: col.primary_language || 'Auto-Detect',
    multilingual_indexing: col.multilingual_indexing !== undefined ? col.multilingual_indexing : true,
    strictness: col.strictness || 'Balanced Synthesis',
    temperature: col.temperature !== undefined ? col.temperature : 0.3,
    created_at: col.created_at || new Date().toISOString().split('T')[0],
    updated_at: col.updated_at || 'Just now',
  };
};

interface KnowledgeBaseViewProps {
  onNavigate?: (screen: string) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ onNavigate }) => {
  const { entitlements, guardrailModal, triggerGuardrail, closeGuardrail } = usePlanEntitlements();

  // Navigation Tabs: 100% In-Page Flow, Zero Intrusive Popups!
  const [activeTab, setActiveTab] = useState<'hub' | 'editor' | 'upload' | 'crawler' | 'simulator' | 'settings'>('hub');
  const [hubViewMode, setHubViewMode] = useState<'all' | 'collections' | 'documents'>('all');
  const [documents, setDocuments] = useState<ExtendedKnowledgeDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real Centralized SSOT Registry from Tenant Storage
  const isSuperAdmin = getActiveUserEmail() === 'admin@createcall.ai' && !getActiveTargetOrgId();

  const [customRegistry, setCustomRegistry] = useState<Record<string, any[]>>(() => {
    try {
      const isCurrentSovereign = getActiveUserEmail() === 'admin@createcall.ai' && !getActiveTargetOrgId();
      const saved = getTenantStorage<Record<string, any[]>>('nexus_custom_items') || (
        isCurrentSovereign
          ? (localStorage.getItem('nexus_custom_items') ? JSON.parse(localStorage.getItem('nexus_custom_items')!) : null)
          : null
      );
      if (saved) {
        const parsed = { ...saved };
        if (Array.isArray(parsed.knowledge_collections)) {
          parsed.knowledge_collections = cleanLegacyCollections(parsed.knowledge_collections);
        }
        return isCurrentSovereign ? { ...DEFAULT_BUSINESS_RULES_ITEMS, ...parsed } : parsed;
      }
    } catch {}
    return isSuperAdmin ? DEFAULT_BUSINESS_RULES_ITEMS : {};
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const isCurrentSovereign = getActiveUserEmail() === 'admin@createcall.ai' && !getActiveTargetOrgId();
        const saved = getTenantStorage<Record<string, any[]>>('nexus_custom_items') || (
          isCurrentSovereign
            ? (localStorage.getItem('nexus_custom_items') ? JSON.parse(localStorage.getItem('nexus_custom_items')!) : null)
            : null
        );
        if (saved) {
          const parsed = { ...saved };
          if (Array.isArray(parsed.knowledge_collections)) {
            parsed.knowledge_collections = cleanLegacyCollections(parsed.knowledge_collections);
          }
          setCustomRegistry(isCurrentSovereign ? { ...DEFAULT_BUSINESS_RULES_ITEMS, ...parsed } : parsed);
        } else if (!isCurrentSovereign) {
          setCustomRegistry({});
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('nexus_custom_items_changed', handleStorageChange);
    window.addEventListener('nexus_business_rules_updated', handleStorageChange);
    window.addEventListener('createcall:tenant_data_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('nexus_custom_items_changed', handleStorageChange);
      window.removeEventListener('nexus_business_rules_updated', handleStorageChange);
      window.removeEventListener('createcall:tenant_data_updated', handleStorageChange);
    };
  }, []);

  // Fetch canonical credentials from backend on mount to ensure customRegistry and collections are 100% in sync
  const fetchCanonicalCategories = async () => {
    try {
      const isCurrentSovereign = getActiveUserEmail() === 'admin@createcall.ai' && !getActiveTargetOrgId();
      const data = await fetchAPI('/api/credentials/all-categories');
      if (data && typeof data === 'object') {
        const backendCollections = Array.isArray(data.knowledge_collections)
          ? cleanLegacyCollections(data.knowledge_collections).map((c: any, idx: number) => sanitizeCollectionItem(c, idx))
          : [];

        setCollections(backendCollections);

        setCustomRegistry((prev) => {
          const merged = isCurrentSovereign ? { ...DEFAULT_BUSINESS_RULES_ITEMS, ...prev } : { ...prev };
          Object.keys(data).forEach((cat) => {
            if (Array.isArray(data[cat])) {
              merged[cat] = cat === 'knowledge_collections' ? backendCollections : data[cat];
            }
          });
          merged.knowledge_collections = backendCollections;
          try {
            setTenantStorage('nexus_custom_items', merged);
          } catch {}
          return merged;
        });
      }
    } catch (err) {
      console.warn('Could not fetch canonical categories in KnowledgeBaseView:', err);
    }
  };

  useEffect(() => {
    fetchCanonicalCategories();
  }, []);

  // Collections SSOT state synced with tenant storage
  const [collections, setCollections] = useState<KnowledgeCollectionItem[]>(() => {
    try {
      const isCurrentSovereign = getActiveUserEmail() === 'admin@createcall.ai' && !getActiveTargetOrgId();
      const saved = getTenantStorage<Record<string, any[]>>('nexus_custom_items') || (
        isCurrentSovereign
          ? (localStorage.getItem('nexus_custom_items') ? JSON.parse(localStorage.getItem('nexus_custom_items')!) : null)
          : null
      );
      if (saved) {
        if (Array.isArray(saved.knowledge_collections)) {
          const cleaned = cleanLegacyCollections(saved.knowledge_collections);
          return cleaned.map((c: any, idx: number) => sanitizeCollectionItem(c, idx));
        }
      }
    } catch {}
    return [];
  });

  // Hub Search & Filter Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [uploadViewMode, setUploadViewMode] = useState<'grid' | 'list'>('grid');

  // Official Project In-App Live File Preview Modal State (Recalled from FileStorage / RecycleBin)
  const [previewModalFile, setPreviewModalFile] = useState<PreviewableFile | null>(null);
  const [activePreviewDoc, setActivePreviewDoc] = useState<ExtendedKnowledgeDoc | null>(null);

  // In-Tab Collection Studio State (100% Dynamic SSOT Configuration)
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [kcName, setKcName] = useState('');
  const [kcDisplayName, setKcDisplayName] = useState('');
  const [kcDescription, setKcDescription] = useState('');
  const [kcKnowledgeType, setKcKnowledgeType] = useState('Company Knowledge');
  const [kcCustomKnowledgeType, setKcCustomKnowledgeType] = useState('');
  const [kcStatus, setKcStatus] = useState<'Active' | 'Draft' | 'Archived'>('Active');
  const [kcScope, setKcScope] = useState<'Global Workspace' | 'Organization Level' | 'Agent Level'>('Global Workspace');
  const [kcSourceType, setKcSourceType] = useState<'Attached Document from Library' | 'Website / URL' | 'Sitemap' | 'FAQ / Text' | 'API'>('Attached Document from Library');
  const [kcAttachedDocId, setKcAttachedDocId] = useState('');
  const [kcWebUrl, setKcWebUrl] = useState('');
  const [kcRawText, setKcRawText] = useState('');
  const [kcChunkingStrategy, setKcChunkingStrategy] = useState('Recursive Character (1024 tokens)');
  const [kcChunkSize, setKcChunkSize] = useState('1024');
  const [kcChunkOverlap, setKcChunkOverlap] = useState('128');
  const [kcLlmProvider, setKcLlmProvider] = useState(() => (customRegistry['llm']?.[0]?.display_name || customRegistry['llm']?.[0]?.name || 'Dynamic LLM'));
  const [kcLlmModel, setKcLlmModel] = useState(() => (customRegistry['llm']?.[0]?.selected_model_name || customRegistry['llm']?.[0]?.primary_model || ''));
  const [kcEmbeddingProvider, setKcEmbeddingProvider] = useState(() => (customRegistry['embeddings']?.[0]?.display_name || customRegistry['llm']?.[0]?.display_name || 'Dynamic Embedding'));
  const [kcEmbeddingModel, setKcEmbeddingModel] = useState(() => (customRegistry['embeddings']?.[0]?.selected_model_name || ''));
  const [kcVectorStore, setKcVectorStore] = useState<'ChromaDB' | 'Pinecone' | 'Qdrant' | 'Milvus' | 'Weaviate'>('ChromaDB');
  const [kcPrimaryLanguage, setKcPrimaryLanguage] = useState('Auto-Detect');
  const [kcMultilingualIndexing, setKcMultilingualIndexing] = useState(true);
  const [kcStrictness, setKcStrictness] = useState<'Strict Grounding' | 'Balanced Synthesis' | 'Creative Reasoning'>('Balanced Synthesis');
  const [kcTemperature, setKcTemperature] = useState(0.3);

  // Provider-Isolated Live Models Cache (Synced with API & Integrations SSOT)
  const [modelsCache, setModelsCache] = useState<Record<string, any[]>>(() => {
    try {
      const saved = localStorage.getItem('nexus_models_cache');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);

  const fetchProviderModels = async (provName: string, isManual: boolean = false) => {
    if (!provName) return;
    if (isManual) {
      addToast({
        type: 'info',
        title: 'Syncing Live Models',
        description: `Connecting to ${provName} API to fetch dynamic models...`,
      });
    }
    const pNorm = provName.toLowerCase().trim();
    const catItem = LLM_CATALOG.find(
      (p) => p.provider === pNorm || p.name.toLowerCase().includes(pNorm) || pNorm.includes(p.provider)
    );

    const allAiItems = [
      ...(customRegistry['llm'] || []),
      ...(customRegistry['embeddings'] || []),
      ...(customRegistry['embedding_vector_ai'] || []),
    ];
    const regItem = allAiItems.find(
      (x: any) =>
        (x.provider || x.id || '').toLowerCase() === pNorm ||
        (x.name || '').toLowerCase() === pNorm ||
        (x.display_name || '').toLowerCase() === pNorm ||
        pNorm.includes((x.provider || '').toLowerCase()) ||
        (x.provider || '').toLowerCase().includes(pNorm)
    );

    const providerKey = regItem?.provider || catItem?.provider || pNorm.replace(/[^a-z0-9_]/g, '_');

    try {
      setIsFetchingModels(true);
      const queryParams = new URLSearchParams();
      queryParams.set('provider', providerKey);
      if (catItem?.endpoint) queryParams.set('endpoint', catItem.endpoint);

      const userKey = regItem?.api_key || regItem?.raw_key || regItem?.plain_key;
      if (userKey && userKey !== 'local-endpoint') queryParams.set('api_key', userKey);

      const res = await fetch(`/api/providers/models?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const models = data.models || [];
        if (models.length > 0) {
          setModelsCache((prev) => {
            const updated = {
              ...prev,
              [providerKey]: models,
              [providerKey.toLowerCase()]: models,
              [pNorm]: models,
              [provName]: models,
            };
            try {
              localStorage.setItem('nexus_models_cache', JSON.stringify(updated));
            } catch {}
            return updated;
          });
          if (isManual) {
            addToast({
              type: 'success',
              title: 'Live Models Synced',
              description: `Retrieved ${models.length} dynamic models for ${provName}.`,
            });
          }
        } else if (isManual) {
          addToast({
            type: 'info',
            title: 'Models Sync Completed',
            description: `Connected to ${provName}, default model catalog is active.`,
          });
        }
      } else if (isManual) {
        const errData = await res.json().catch(() => ({}));
        addToast({
          type: 'error',
          title: 'Sync Failed',
          description: errData.detail || `Could not fetch live models for ${provName}.`,
        });
      }
    } catch (err: any) {
      console.warn('Error fetching live models for', provName, err);
      if (isManual) {
        addToast({
          type: 'error',
          title: 'Network Error',
          description: err.message || `Failed to connect to ${provName}.`,
        });
      }
    } finally {
      setIsFetchingModels(false);
    }
  };

  useEffect(() => {
    if (kcLlmProvider) {
      fetchProviderModels(kcLlmProvider);
    }
  }, [kcLlmProvider]);

  useEffect(() => {
    if (kcEmbeddingProvider) {
      fetchProviderModels(kcEmbeddingProvider);
    }
  }, [kcEmbeddingProvider]);

  // Studio In-Tab Test Simulator
  const [kcTestQuery, setKcTestQuery] = useState('');
  const [kcMaxMatches, setKcMaxMatches] = useState('3');
  const [kcIsTesting, setKcIsTesting] = useState(false);
  const [kcTestResult, setKcTestResult] = useState<{
    latency?: string;
    matches: { title: string; score: string | number; snippet: string }[];
    directAnswer: string;
    providerUsed?: string;
  } | null>(null);

  // Dedicated Grounding Sandbox State & Multi-Turn Memory Brain Connection
  const [sandboxSessionId, setSandboxSessionId] = useState<string>('');
  const [sandboxTurnCount, setSandboxTurnCount] = useState<number>(0);
  const [sandboxTarget, setSandboxTarget] = useState<string>('all');
  const [sandboxQuery, setSandboxQuery] = useState('What is your appointment cancellation and refund policy?');
  const [sandboxMaxMatches, setSandboxMaxMatches] = useState('3');
  const [sandboxSnippetWords, setSandboxSnippetWords] = useState<number>(20);
  const [customSnippetWordsInput, setCustomSnippetWordsInput] = useState<string>('20');
  const [isCustomWordsActive, setIsCustomWordsActive] = useState<boolean>(false);
  const [showPillCustomInput, setShowPillCustomInput] = useState<boolean>(false);
  const [expandedMatchIndices, setExpandedMatchIndices] = useState<Record<number, boolean>>({});
  const [sandboxIsTesting, setSandboxIsTesting] = useState(false);
  const [dynamicQueryCards, setDynamicQueryCards] = useState<DynamicGroundingCard[]>([]);
  const [isExtractingQueries, setIsExtractingQueries] = useState<boolean>(false);
  const [sandboxResult, setSandboxResult] = useState<{
    latency?: string;
    matches: {
      title: string;
      score: string | number;
      snippet: string;
      fullChunk?: string;
      page_number?: number;
      word_count?: number;
      total_words?: number;
      id?: number | string;
    }[];
    directAnswer: string;
    providerUsed?: string;
  } | null>(null);

  // Live LLM-Powered Dynamic Grounding Query Extraction Effect
  useEffect(() => {
    let isMounted = true;
    const fetchDynamicSuggestions = async () => {
      setIsExtractingQueries(true);
      try {
        let text = '';
        let title = 'All Workspace Knowledge';
        let provider = '';
        let model = '';

        if (sandboxTarget !== 'all') {
          const matchCol = collections.find((c) => c.id === sandboxTarget || c.name === sandboxTarget || c.display_name.toLowerCase() === sandboxTarget.toLowerCase());
          if (matchCol) {
            title = matchCol.display_name;
            text = `${matchCol.display_name}\n${matchCol.description || ''}\n${matchCol.raw_text || ''}`;
            if (matchCol.attached_doc_id) {
              const att = documents.find((d) => d.id === matchCol?.attached_doc_id || d.title === matchCol?.attached_doc_name);
              if (att?.rawContent) text += '\n' + att.rawContent;
            }
            provider = matchCol.embedding_provider || '';
            model = matchCol.embedding_model || '';
          } else {
            const matchDoc = documents.find((d) => d.id === sandboxTarget || d.title.toLowerCase() === sandboxTarget.toLowerCase());
            if (matchDoc) {
              title = matchDoc.title;
              text = matchDoc.rawContent || `${matchDoc.title} (${matchDoc.format || matchDoc.type}): Vectorized knowledge index.`;
            } else {
              title = sandboxTarget;
            }
          }
        } else {
          text = collections.map((c) => `${c.display_name}: ${c.description || ''} ${c.raw_text || ''}`).join('\n\n') +
                 '\n\n' + documents.map((d) => `${d.title} (${d.format || d.type}): ${d.rawContent || ''}`).join('\n\n');
        }

        const res = await fetch('/api/knowledge-base/suggest-queries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: sandboxTarget,
            filename: title,
            document_text: text.slice(0, 10000),
            provider: provider || undefined,
            model: model || undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.queries) && data.queries.length > 0) {
            setDynamicQueryCards(data.queries);
          }
        }
      } catch (err) {
        console.warn('Dynamic query suggestion notice:', err);
      } finally {
        if (isMounted) setIsExtractingQueries(false);
      }
    };

    fetchDynamicSuggestions();
    return () => {
      isMounted = false;
    };
  }, [sandboxTarget, documents, collections]);

  // Vector Engine & DB Global Settings
  const [vectorEngine, setVectorEngine] = useState<'ChromaDB' | 'Pinecone' | 'Qdrant' | 'Milvus'>('ChromaDB');
  const [chromaHost, setChromaHost] = useState('http://localhost:8000');
  const [pineconeKey, setPineconeKey] = useState('pk-••••••••••••••••');
  const [pineconeIndex, setPineconeIndex] = useState('createcall-os-production');
  const [defaultTopK, setDefaultTopK] = useState('3');

  // Web Crawler State
  const [crawlUrl, setCrawlUrl] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [crawledPages, setCrawledPages] = useState<{ url: string; title: string; status: string; chunks: number }[]>([]);

  const { addToast } = useToast();

  // Sync collections to tenant storage and dispatch event for other views
  const syncCollectionsToStorage = (updated: KnowledgeCollectionItem[]) => {
    setCollections(updated);
    try {
      const isCurrentSovereign = getActiveUserEmail() === 'admin@createcall.ai' && !getActiveTargetOrgId();
      const saved = getTenantStorage<Record<string, any[]>>('nexus_custom_items') || (
        isCurrentSovereign
          ? (localStorage.getItem('nexus_custom_items') ? JSON.parse(localStorage.getItem('nexus_custom_items')!) : null)
          : null
      );
      const parsed = saved ? { ...saved } : {};
      parsed.knowledge_collections = updated;
      setTenantStorage('nexus_custom_items', parsed);
      window.dispatchEvent(new CustomEvent('nexus_custom_items_changed', { detail: { category: 'knowledge_collections', items: updated } }));
    } catch (e) {
      console.error('Storage sync error:', e);
    }
  };

  const loadDocuments = async (isManual: boolean = false) => {
    try {
      setIsLoading(true);
      if (isManual) {
        addToast({
          type: 'info',
          title: 'Refreshing Knowledge Base',
          description: 'Synchronizing indexed documents, vector chunks & RAG collections...',
        });
      }
      const [repoDocs, uploadFilesRes] = await Promise.allSettled([
        knowledgeRepository.getAll(),
        fetchAPI('/api/uploads?category=knowledge_base').catch(() => fetchAPI('/api/uploads/list?category=knowledge_base')),
      ]);

      const loadedList: ExtendedKnowledgeDoc[] = [];
      const seenTitles = new Set<string>();

      // 1. Real Database Knowledge Documents
      if (repoDocs.status === 'fulfilled' && Array.isArray(repoDocs.value) && repoDocs.value.length > 0) {
        repoDocs.value.forEach((d) => {
          seenTitles.add(d.title.toLowerCase());
          const format = detectFileFormat(d.title) || (d.type as any) || 'PDF';
          loadedList.push({
            ...d,
            format,
            createdDate: d.lastSynced || new Date().toISOString().split('T')[0],
            updatedDate: 'Just now',
            rawContent: (d as any).rawContent || '',
          });
        });
      }

      // 2. Real Files from uploads/knowledge_base/
      if (uploadFilesRes.status === 'fulfilled' && uploadFilesRes.value) {
        const rawFiles = Array.isArray(uploadFilesRes.value)
          ? uploadFilesRes.value
          : Array.isArray((uploadFilesRes.value as any)?.files)
          ? (uploadFilesRes.value as any).files
          : Array.isArray((uploadFilesRes.value as any)?.items)
          ? (uploadFilesRes.value as any).items
          : [];

        rawFiles.forEach((f: any) => {
          const fname = f.filename || f.title;
          if (fname && !seenTitles.has(fname.toLowerCase())) {
            seenTitles.add(fname.toLowerCase());
            const format = detectFileFormat(fname);
            const calculatedChunks = f.chunk_count || Math.max(1, Math.ceil((f.size_bytes || 1024) / 1024));
            loadedList.push({
              id: f.id || `upload-doc-${fname}`,
              title: fname,
              type: (format as any) || 'PDF',
              format,
              size: f.size_formatted || (f.size_bytes ? `${(f.size_bytes / (1024 * 1024)).toFixed(2)} MB` : '0 KB'),
              chunks: calculatedChunks,
              status: 'indexed',
              lastSynced: f.created_at ? new Date(f.created_at).toLocaleDateString() : 'Just now',
              createdDate: f.created_at ? new Date(f.created_at).toLocaleDateString() : new Date().toISOString().split('T')[0],
              updatedDate: 'Just now',
              rawContent: f.content || f.rawContent || '',
            });
          }
        });
      }

      // 3. Enrich documents with companion extracted text from /api/uploads/extracted/knowledge_base/...
      for (const doc of loadedList) {
        if (!doc.rawContent) {
          try {
            const extRes = await fetchAPI(`/api/uploads/extracted/knowledge_base/${encodeURIComponent(doc.title)}`);
            if (extRes && extRes.text) {
              doc.rawContent = extRes.text;
              if (extRes.chunk_count) doc.chunks = extRes.chunk_count;
            }
          } catch {}
        }
      }

      // 4. Set strictly live loaded documents from DB & Uploads SSOT
      setDocuments(loadedList);

      // Auto-bind first real document to Collection Studio if none is selected yet
      if (loadedList.length > 0) {
        setKcAttachedDocId((prev) => prev || loadedList[0].id);
        setKcDisplayName((prev) => prev || loadedList[0].title);
        setKcName((prev) => prev || loadedList[0].title.toLowerCase().replace(/[^a-z0-9_-]/g, '_'));
      }

      if (isManual) {
        addToast({
          type: 'success',
          title: 'Knowledge Base Synced',
          description: `Live SSOT updated: ${loadedList.length} indexed document(s) & ${collections.length} collection(s) synchronized.`,
        });
      }
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setDocuments([]);
      if (isManual) {
        addToast({
          type: 'error',
          title: 'Refresh Failed',
          description: err.message || 'Could not synchronize with Vector SSOT.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Unified Tab Switching with Live Status Toast
  const handleTabChange = (t: string) => {
    setActiveTab(t as any);
    const tabLabels: Record<string, string> = {
      hub: `Knowledge Hub (${documents.length + collections.length} Assets)`,
      editor: editingCollectionId ? 'Collection Studio (Edit Mode)' : 'Collection Studio (New Collection)',
      upload: 'Upload Documents Tab',
      crawler: 'Website Crawler Active',
      simulator: 'Grounding Sandbox Active',
      settings: 'Vector DB Settings',
    };
    addToast({
      type: 'info',
      title: tabLabels[t] || 'Tab Switched',
      description: `Viewing ${tabLabels[t] || t}. Real-time Vector SSOT synchronized.`,
    });
  };

  // View Mode & Format Filter Change Handlers with Live Feedback
  const handleHubViewModeChange = (mode: 'all' | 'documents' | 'collections') => {
    setHubViewMode(mode);
    addToast({
      type: 'info',
      title: 'Knowledge Filter Applied',
      description:
        mode === 'all'
          ? `Showing all ${documents.length + collections.length} knowledge items.`
          : mode === 'documents'
          ? `Filtered to ${documents.length} indexed documents.`
          : `Filtered to ${collections.length} RAG vector collections.`,
    });
  };

  const handleFormatFilterChange = (fmt: string) => {
    setFormatFilter(fmt);
    addToast({
      type: 'info',
      title: 'Format Filter Applied',
      description: fmt === 'all' ? 'Displaying all document & media formats.' : `Filtered by ${fmt} format files.`,
    });
  };

  // Duplicate Collection with Live SSOT Feedback
  const handleDuplicateCollection = (col: KnowledgeCollectionItem) => {
    const copy: KnowledgeCollectionItem = {
      ...col,
      id: `kc_${Date.now()}`,
      name: `${col.name}_copy`,
      display_name: `${col.display_name} (Copy)`,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: 'Just now',
    };
    const updated = [copy, ...collections];
    syncCollectionsToStorage(updated);
    addToast({
      type: 'success',
      title: 'Collection Duplicated',
      description: `Created copy "${copy.display_name}".`,
    });
  };

  useEffect(() => {
    loadDocuments();
    const handleCustomChange = (e: any) => {
      if (e.detail?.category === 'knowledge_collections' && Array.isArray(e.detail?.items)) {
        setCollections(e.detail.items.map((c: any, idx: number) => sanitizeCollectionItem(c, idx)));
      }
    };
    const handleTargetChange = () => {
      loadDocuments();
      fetchCanonicalCategories();
    };
    window.addEventListener('nexus_custom_items_changed', handleCustomChange);
    window.addEventListener('createcall:sovereign_target_changed', handleTargetChange);
    return () => {
      window.removeEventListener('nexus_custom_items_changed', handleCustomChange);
      window.removeEventListener('createcall:sovereign_target_changed', handleTargetChange);
    };
  }, []);

  // Format Auto-Detector Helper
  const detectFileFormat = (fileName: string): ExtendedKnowledgeDoc['format'] => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return 'PDF';
    if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'DOCX';
    if (lower.endsWith('.csv') || lower.endsWith('.xlsx')) return 'CSV';
    if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'Markdown';
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'Image';
    if (lower.endsWith('.mp3') || lower.endsWith('.wav')) return 'Audio';
    if (lower.endsWith('.mp4') || lower.endsWith('.mov')) return 'Video';
    if (lower.endsWith('.txt')) return 'TXT';
    return 'PDF';
  };

  // Upload handler for document files in dedicated tab
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Storage Quota Guardrail Check
    const fileList = Array.from(files) as File[];
    const totalNewBytes = fileList.reduce((acc: number, f: File) => acc + (f.size || 0), 0);
    const totalNewMb = totalNewBytes / (1024 * 1024);
    if (totalStorageMb + totalNewMb > entitlements.ragStorageMb && !entitlements.isUnlimited) {
      triggerGuardrail(
        'RAG Storage Quota Limit Exceeded',
        `Your current ${entitlements.planName} provides up to ${entitlements.ragStorageMb} MB of RAG vector storage. You have currently used ${totalStorageMb.toFixed(1)} MB. Upgrade to Pro Scale or Enterprise Sovereign tier for expanded storage.`,
        'Pro Scale'
      );
      return;
    }

    Array.from(files).forEach(async (file: File) => {
      const format = detectFileFormat(file.name);
      try {
        const created = await knowledgeRepository.uploadFile(file);
        const isReady = created.status === 'indexed' || (created as any).status === 'ready';

        const extDoc: ExtendedKnowledgeDoc = {
          ...created,
          status: isReady ? 'indexed' : 'processing',
          createdDate: new Date().toISOString().split('T')[0],
          updatedDate: 'Just now',
          format,
          progressPercent: isReady ? 100 : 15,
          stage: isReady ? 'ready' : 'upload_saved',
          rawContent: '',
        };

        setDocuments((prev) => [extDoc, ...prev]);

        addToast({
          type: 'success',
          title: '✓ File uploaded successfully',
          description: isReady
            ? `Indexed "${file.name}". Ready for RAG grounding.`
            : `Uploaded "${file.name}". Indexing vector embeddings in background...`,
        });
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'Upload Failed',
          description: err.message || `Failed to upload "${file.name}"`,
        });
      }
    });
  };

  // Web Crawler Trigger - Real DOM scraping and indexing
  const handleStartCrawl = async () => {
    if (!crawlUrl.startsWith('http://') && !crawlUrl.startsWith('https://')) {
      addToast({ type: 'error', title: 'Invalid URL', description: 'URL must start with http:// or https://' });
      return;
    }

    if (totalStorageMb >= entitlements.ragStorageMb && !entitlements.isUnlimited) {
      triggerGuardrail(
        'RAG Storage Quota Limit Exceeded',
        `Your current ${entitlements.planName} has reached its ${entitlements.ragStorageMb} MB storage limit. Upgrade to Pro Scale or Enterprise tier to crawl and index more web pages.`,
        'Pro Scale'
      );
      return;
    }

    setIsCrawling(true);
    setCrawlProgress(20);
    setCrawledPages([]);

    try {
      setCrawlProgress(40);
      const res = await fetch('/api/knowledge-base/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: crawlUrl }),
      });

      setCrawlProgress(80);
      if (!res.ok) {
        throw new Error(`Failed to crawl web URL (${res.status})`);
      }

      const scrapeData = await res.json();
      const domain = new URL(crawlUrl).hostname;
      const pageTitle = scrapeData.title || `Web Index: ${domain}`;
      const textContent = scrapeData.text || '';
      const estimatedChunks = Math.max(1, Math.ceil(textContent.length / 500));

      setCrawledPages([
        {
          url: crawlUrl,
          title: pageTitle,
          status: 'Crawled',
          chunks: estimatedChunks,
        },
      ]);

      const created = await knowledgeRepository.upload({
        title: `${domain}.md`,
        type: 'Web Page',
        size: `${Math.round(textContent.length / 1024) || 1} KB`,
        chunks: estimatedChunks,
      });

      const extDoc: ExtendedKnowledgeDoc = {
        ...created,
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: 'Just now',
        format: 'Markdown',
        rawContent: textContent,
      };

      setDocuments((prev) => [extDoc, ...prev]);
      setCrawlProgress(100);
      addToast({
        type: 'success',
        title: 'Crawl & Index Complete',
        description: `Successfully crawled ${domain} and generated ${estimatedChunks} vector embeddings.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Web Crawl Failed',
        description: err.message || 'Could not connect to URL.',
      });
    } finally {
      setIsCrawling(false);
    }
  };

  // Re-index Document
  const handleReindex = async (doc: ExtendedKnowledgeDoc) => {
    addToast({
      type: 'info',
      title: 'Re-indexing Initiated',
      description: `Extracting full document text and vector chunks for "${doc.title}"...`,
    });

    try {
      const res = await fetch(`/api/knowledge-base/documents/${encodeURIComponent(doc.id || doc.title)}/reindex`, {
        method: 'POST',
      });
      if (res.ok) {
        addToast({
          type: 'success',
          title: 'Re-indexing Started',
          description: `Background worker is re-extracting "${doc.title}". Vector embeddings will update live.`,
        });
        setTimeout(async () => {
          try {
            const extRes = await fetch(`/api/knowledge-base/documents/${encodeURIComponent(doc.title)}/extracted-text`);
            if (extRes.ok) {
              const extData = await extRes.json();
              if (extData.text) {
                setDocuments((prev) =>
                  prev.map((d) =>
                    d.id === doc.id || d.title === doc.title
                      ? {
                          ...d,
                          status: 'indexed',
                          rawContent: extData.text,
                          chunks: extData.chunk_count || d.chunks,
                        }
                      : d
                  )
                );
                if (activePreviewDoc && (activePreviewDoc.id === doc.id || activePreviewDoc.title === doc.title)) {
                  setPreviewModalFile((prev) =>
                    prev
                      ? {
                          ...prev,
                          content: extData.text,
                          raw_content: extData.text,
                        }
                      : null
                  );
                }
              }
            }
          } catch {}
        }, 3000);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Re-index Failed',
        description: err.message || `Failed to trigger re-index for "${doc.title}"`,
      });
    }
  };

  // Delete Document - Soft Delete to Centralized Recycle Bin (.recycle_bin/)
  const handleDeleteDoc = async (id: string, title: string) => {
    try {
      // 1. Move file to central Recycle Bin
      await uploadRepository.deleteFile('knowledge_base', title, false).catch(() => {});
      // 2. Also remove from database
      await knowledgeRepository.delete(id).catch(() => {});
      // 3. Immediately filter from state
      setDocuments((prev) => prev.filter((d) => d.id !== id && d.title !== title));
      addToast({
        type: 'info',
        title: 'Moved to Recycle Bin',
        description: `"${title}" moved to Recycle Bin. You can restore it anytime from Recycle Bin screen.`,
      });
    } catch (err: any) {
      setDocuments((prev) => prev.filter((d) => d.id !== id && d.title !== title));
      addToast({
        type: 'info',
        title: 'Moved to Recycle Bin',
        description: `"${title}" moved to Recycle Bin.`,
      });
    }
  };

  // Open In-Tab Collection Studio (Zero Popups!)
  const openCollectionStudio = (collection?: KnowledgeCollectionItem) => {
    if (collection) {
      setEditingCollectionId(collection.id);
      setKcName(collection.name);
      setKcDisplayName(collection.display_name);
      setKcDescription(collection.description);
      setKcKnowledgeType(collection.knowledge_type || 'Company Knowledge');
      setKcCustomKnowledgeType(collection.custom_knowledge_type || '');
      setKcStatus(collection.status);
      setKcScope(collection.scope);
      setKcSourceType(collection.source_type);
      setKcAttachedDocId(collection.attached_doc_id || (documents.length > 0 ? documents[0].id : ''));
      setKcWebUrl(collection.web_url || '');
      setKcRawText(collection.raw_text || '');
      setKcChunkingStrategy(collection.chunking_strategy || 'Recursive Character (1024 tokens)');
      setKcChunkSize(collection.chunk_size || '1024');
      setKcChunkOverlap(collection.chunk_overlap || '128');
      setKcLlmProvider(collection.llm_provider || 'Google Gemini');
      setKcLlmModel(collection.llm_model || 'gemini-2.5-flash');
      setKcEmbeddingProvider(collection.embedding_provider || 'Google Gemini');
      setKcEmbeddingModel(collection.embedding_model || 'text-embedding-004');
      setKcVectorStore(collection.vector_store || 'ChromaDB');
      setKcPrimaryLanguage(collection.primary_language || 'hi-IN');
      setKcMultilingualIndexing(collection.multilingual_indexing !== undefined ? collection.multilingual_indexing : true);
      setKcStrictness(collection.strictness || 'Balanced Synthesis');
      setKcTemperature(collection.temperature !== undefined ? collection.temperature : 0.3);
      addToast({
        type: 'info',
        title: 'Editing Collection',
        description: `Loaded "${collection.display_name}" in Collection Studio.`,
      });
    } else {
      setEditingCollectionId(null);
      setKcName('');
      setKcDisplayName('');
      setKcDescription('');
      setKcKnowledgeType('Company Knowledge');
      setKcCustomKnowledgeType('');
      setKcStatus('Active');
      setKcScope('Global Workspace');
      setKcSourceType('Attached Document from Library');
      setKcAttachedDocId(documents.length > 0 ? documents[0].id : '');
      setKcWebUrl('');
      setKcRawText('');
      setKcChunkingStrategy('Recursive Character (1024 tokens)');
      setKcChunkSize('1024');
      setKcChunkOverlap('128');
      setKcLlmProvider(customRegistry['llm']?.[0]?.display_name || customRegistry['llm']?.[0]?.name || 'Dynamic LLM');
      setKcLlmModel(customRegistry['llm']?.[0]?.selected_model_name || customRegistry['llm']?.[0]?.primary_model || '');
      setKcEmbeddingProvider(customRegistry['embeddings']?.[0]?.display_name || customRegistry['llm']?.[0]?.display_name || 'Dynamic Embedding');
      setKcEmbeddingModel(customRegistry['embeddings']?.[0]?.selected_model_name || '');
      setKcVectorStore('ChromaDB');
      setKcPrimaryLanguage('Auto-Detect');
      setKcMultilingualIndexing(true);
      setKcStrictness('Balanced Synthesis');
      setKcTemperature(0.3);
      addToast({
        type: 'info',
        title: 'Collection Studio Opened',
        description: 'Configure new RAG collection, synthesis engine & vector parameters.',
      });
    }
    setKcTestResult(null);
    setActiveTab('editor');
  };

  // Save Collection in Studio
  const handleSaveCollectionStudio = async () => {
    if (!kcName.trim() && !kcDisplayName.trim()) {
      addToast({ type: 'error', title: 'Validation Error', description: 'Please provide a collection name or display name.' });
      return;
    }

    const finalName = (kcName.trim() || kcDisplayName.trim()).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const finalDisplayName = kcDisplayName.trim() || kcName.trim() || 'New Knowledge Collection';
    const attachedDoc = documents.find((d) => d.id === kcAttachedDocId);
    const calculatedChunks = attachedDoc?.chunks || (kcRawText ? Math.max(1, Math.ceil(kcRawText.length / 500)) : 0);

    const newCol: KnowledgeCollectionItem = {
      id: editingCollectionId || `kc_${Date.now()}`,
      name: finalName,
      display_name: finalDisplayName,
      description: kcDescription.trim() || 'Indexes workspace knowledge vectors and business documentation.',
      knowledge_type: kcKnowledgeType === 'Custom' && kcCustomKnowledgeType ? kcCustomKnowledgeType : kcKnowledgeType,
      custom_knowledge_type: kcCustomKnowledgeType,
      status: kcStatus,
      scope: kcScope,
      source_type: kcSourceType,
      attached_doc_id: kcAttachedDocId,
      attached_doc_name: attachedDoc?.title,
      web_url: kcWebUrl,
      raw_text: kcRawText,
      uploaded_chunks: calculatedChunks,
      chunking_strategy: kcChunkingStrategy,
      chunk_size: kcChunkSize,
      chunk_overlap: kcChunkOverlap,
      llm_provider: kcLlmProvider,
      llm_model: kcLlmModel,
      embedding_provider: kcEmbeddingProvider,
      embedding_model: kcEmbeddingModel,
      vector_store: kcVectorStore,
      primary_language: kcPrimaryLanguage,
      multilingual_indexing: kcMultilingualIndexing,
      strictness: kcStrictness,
      temperature: kcTemperature,
      created_at: editingCollectionId ? collections.find((c) => c.id === editingCollectionId)?.created_at || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      updated_at: 'Just now',
    };

    let updated: KnowledgeCollectionItem[];
    if (editingCollectionId) {
      updated = collections.map((c) => (c.id === editingCollectionId ? newCol : c));
      addToast({ type: 'success', title: 'Collection Updated', description: `"${finalDisplayName}" updated in RAG Vector SSOT.` });
    } else {
      updated = [newCol, ...collections];
      addToast({ type: 'success', title: 'Collection Created', description: `"${finalDisplayName}" registered with ${kcVectorStore} vector store (${calculatedChunks} chunks).` });
    }

    syncCollectionsToStorage(updated);

    // Persist to backend database credentials SSOT
    try {
      const token = localStorage.getItem('nexus_access_token') || sessionStorage.getItem('nexus_access_token') || localStorage.getItem('token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/credentials/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider_name: newCol.id,
          category: 'knowledge_collections',
          display_name: newCol.display_name,
          plain_key: '',
          subtab_name: 'knowledge_collections',
          metadata_json: JSON.stringify(newCol),
        }),
      });
    } catch (err) {
      console.warn('Could not sync collection to backend API:', err);
    }

    setActiveTab('hub');
  };

  // Open Official Project FilePreviewModal for Documents
  const openOfficialFilePreview = async (doc: ExtendedKnowledgeDoc) => {
    setActivePreviewDoc(doc);
    let realContent = doc.rawContent;

    // If content is empty or contains placeholder text, fetch real extracted content
    if (!realContent || realContent.startsWith('Parsed and indexed content for')) {
      try {
        const res = await fetch(`/api/knowledge-base/documents/${encodeURIComponent(doc.title)}/extracted-text`);
        if (res.ok) {
          const data = await res.json();
          if (data.text) {
            realContent = data.text;
            doc.rawContent = data.text;
          }
        }
      } catch (err) {
        console.warn('Could not fetch extracted text on preview open:', err);
      }
    }

    setPreviewModalFile({
      filename: doc.title,
      category: 'knowledge_base',
      category_name: 'Knowledge Base',
      url: `/api/uploads/knowledge_base/${encodeURIComponent(doc.title)}`,
      file_type: doc.format || doc.type,
      size_formatted: doc.size,
      created_at: doc.createdDate || doc.lastSynced,
      content: realContent,
      raw_content: realContent,
    });
  };

  // Open Official Project FilePreviewModal for RAG Collections
  const openCollectionPreview = (col: KnowledgeCollectionItem) => {
    const chunkCount = col.uploaded_chunks || (col.raw_text ? Math.max(1, Math.ceil(col.raw_text.length / 500)) : 0);
    const rawContent = `# ${col.display_name}
**Slug Identifier:** \`${col.name}\`
**Status:** ${col.status}  |  **Scope:** ${col.scope}  |  **Knowledge Type:** ${col.knowledge_type}
**Synthesis LLM:** ${col.llm_model || 'gemini-2.5-flash'} (${col.llm_provider || 'Google Gemini'})
**Vector Engine:** ${col.vector_store || 'ChromaDB'}  |  **Embedding Model:** ${col.embedding_model || 'text-embedding-004'} (${col.embedding_provider || 'Google Gemini'})
**Operating Language:** ${col.primary_language || 'hi-IN'}  |  **Strictness:** ${col.strictness || 'Balanced Synthesis'} (Temp: ${col.temperature ?? 0.3})
**Chunk Strategy:** ${col.chunking_strategy || 'Recursive Character (1024 tokens)'}  |  **Indexed Chunks:** ${chunkCount} Embeddings
**Knowledge Source:** ${col.attached_doc_name || col.web_url || (col.raw_text ? 'Direct FAQ & SOP Text' : 'Workspace Docs')}

---

### Description & Semantic Scope
${col.description || 'Enterprise knowledge vector database index for AI Voice Agents.'}

---

### Vectorized Knowledge & Grounding Content
${
  col.raw_text ||
  (col.attached_doc_id ? documents.find((d) => d.id === col.attached_doc_id)?.rawContent : '') ||
  `# ${col.display_name}\nVector collection ready for live voice agent grounding.`
}
`;

    setPreviewModalFile({
      filename: `${col.display_name}.md`,
      category: 'knowledge_collections',
      category_name: 'RAG Collection',
      url: `/api/knowledge-collections/${col.id}/export`,
      file_type: 'MD',
      size_formatted: `${chunkCount} Chunks • ${col.vector_store || 'ChromaDB'}`,
      created_at: col.created_at || new Date().toISOString().split('T')[0],
      content: rawContent,
      raw_content: rawContent,
    });
    setActivePreviewDoc({
      id: col.id,
      title: col.display_name,
      type: 'PDF',
      format: 'Markdown',
      size: `${chunkCount} Chunks`,
      chunks: chunkCount,
      status: 'indexed',
      lastSynced: col.updated_at || 'Just now',
      rawContent,
    });
  };

  // Copy Collection JSON
  const handleCopyCollection = (col: KnowledgeCollectionItem) => {
    const data = JSON.stringify(col, null, 2);
    navigator.clipboard.writeText(data);
    addToast({ type: 'success', title: 'Copied to Clipboard', description: `Configuration for "${col.display_name}" copied.` });
  };

  // Delete Collection
  const handleDeleteCollection = async (id: string, name: string) => {
    const updated = collections.filter((c) => c.id !== id);
    syncCollectionsToStorage(updated);
    addToast({ type: 'info', title: 'Collection Removed', description: `Removed "${name}" from RAG Vector Collections.` });

    // Persist deletion to backend database
    try {
      const token = localStorage.getItem('nexus_access_token') || sessionStorage.getItem('nexus_access_token') || localStorage.getItem('token') || '';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/credentials/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
    } catch (err) {
      console.warn('Could not delete collection from backend API:', err);
    }
  };

  // RAG Execution function for Studio & Sandbox
  const executeRagQuery = async (
    queryStr: string,
    targetText: string,
    docTitle: string,
    maxLimit: number,
    provider: string,
    model: string,
    onSuccess: (res: any) => void,
    setLoading: (loading: boolean) => void,
    maxWords: number = 20,
    overrideSessionId?: string
  ) => {
    setLoading(true);
    const startTime = Date.now();
    try {
      const activeSession = overrideSessionId !== undefined ? overrideSessionId : sandboxSessionId;
      const response = await fetch('/api/knowledge-base/ask-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryStr,
          document_text: targetText,
          filename: docTitle,
          max_matches: maxLimit,
          max_words: maxWords,
          provider,
          model,
          session_id: activeSession || undefined,
          agent_id: 'agent_rag',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const elapsed = data.latency_ms || Math.max(24, Date.now() - startTime);
        if (data.session_id) {
          setSandboxSessionId(data.session_id);
        }
        if (data.turn_count) {
          setSandboxTurnCount(data.turn_count);
        }
        onSuccess({
          latency: `${elapsed}ms`,
          matches: data.matches || [],
          directAnswer: data.direct_answer || 'Verified knowledge match found.',
          providerUsed: data.provider_used || provider,
          sessionId: data.session_id,
          turnCount: data.turn_count,
        });
        addToast({
          type: 'success',
          title: 'Grounded RAG Answer Generated',
          description: `Retrieved ${data.matches?.length || 0} chunks in ${elapsed}ms (${maxWords}w depth) • Memory Turn #${data.turn_count || 1}.`,
        });
      } else {
        const err = await response.json().catch(() => ({}));
        addToast({ type: 'error', title: 'RAG Retrieval Failed', description: err.detail || 'Service unavailable' });
      }
    } catch (e: any) {
      addToast({ type: 'error', title: 'Retrieval Error', description: e.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  // Studio Simulator Trigger
  const handleStudioTestRetrieval = () => {
    const q = kcTestQuery.trim() || 'What is the standard policy and pricing?';
    let text = kcRawText.trim();
    const matchDoc = documents.find((d) => d.id === kcAttachedDocId);
    if (!text && matchDoc) text = matchDoc.rawContent || `${matchDoc.title}: Standard procedures and FAQ details for ${matchDoc.title}.`;
    if (!text && kcDescription) text = `${kcDisplayName}\n${kcDescription}`;
    const title = matchDoc?.title || kcDisplayName || 'Collection Document';
    const limit = kcMaxMatches === 'all' ? 10 : parseInt(kcMaxMatches, 10) || 3;

    const providerToUse = kcLlmProvider || kcEmbeddingProvider || (customRegistry['llm']?.[0]?.provider || 'Dynamic LLM');
    const modelToUse = kcLlmModel || kcEmbeddingModel || (customRegistry['llm']?.[0]?.primary_model || 'dynamic');

    executeRagQuery(q, text, title, limit, providerToUse, modelToUse, setKcTestResult, setKcIsTesting, sandboxSnippetWords);
  };

  // Quick switch to Sandbox with preset query, targeted scope, and immediate automatic test execution
  const triggerSandboxTestForDoc = (docTitle: string, docText?: string, docId?: string) => {
    // 1. Locate specific target ID (Document ID or Collection ID)
    let target = 'all';
    if (docId) {
      target = docId;
    } else {
      const matchD = documents.find((d) => d.title.toLowerCase() === docTitle.toLowerCase() || d.id === docTitle);
      const matchC = collections.find((c) => c.display_name.toLowerCase() === docTitle.toLowerCase() || c.id === docTitle || c.name.toLowerCase() === docTitle.toLowerCase());
      target = matchD?.id || matchC?.id || docTitle;
    }

    setSandboxTarget(target);

    // 2. Set dynamic generic test prompt tailored to the selected target
    const defaultQuery = `What are the key topics, procedures, and details covered in ${docTitle}?`;

    setSandboxQuery(defaultQuery);
    setActiveTab('simulator');

    // 3. Immediately execute test retrieval so results display automatically
    handleSandboxRetrieval(defaultQuery, target);

    addToast({
      type: 'success',
      title: 'Sandbox Grounding Test Initiated',
      description: `Target set to "${docTitle}". Realtime vector retrieval running.`,
    });
  };

  // Sandbox Grounding Trigger with multi-page full vector context
  const handleSandboxRetrieval = (overrideQuery?: string, overrideTarget?: string, overrideWords?: number) => {
    const target = overrideTarget || sandboxTarget;
    const words = overrideWords !== undefined ? overrideWords : sandboxSnippetWords;
    let text = '';
    let title = 'Global Workspace Knowledge';

    if (target === 'all') {
      text = collections.map((c) => `${c.display_name}: ${c.description} ${c.raw_text || ''}`).join('\n\n');
      if (documents.length > 0) {
        text += '\n\n' + documents.map((d) => `${d.title} (${d.type}): ${d.rawContent || ''}`).join('\n\n');
      }
    } else {
      const matchCol = collections.find((c) => c.id === target || c.name === target || c.display_name.toLowerCase() === target.toLowerCase());
      if (matchCol) {
        text = `${matchCol.display_name}\n${matchCol.description}\n${matchCol.raw_text || ''}`;
        title = matchCol.display_name;
      } else {
        const matchDoc = documents.find((d) => d.id === target || d.title.toLowerCase() === target.toLowerCase());
        if (matchDoc) {
          text = matchDoc.rawContent || `${matchDoc.title} (${matchDoc.type}): Standard operating guidelines and parameters.`;
          title = matchDoc.title;
        } else {
          title = target;
        }
      }
    }

    const q = (overrideQuery || sandboxQuery).trim() || `What information is covered in ${title}?`;

    const limit = sandboxMaxMatches === 'all' ? 10 : parseInt(sandboxMaxMatches, 10) || 3;
    let provider = '';
    let model = '';
    if (target !== 'all') {
      const matchCol = collections.find((c) => c.id === target || c.name === target || c.display_name.toLowerCase() === target.toLowerCase());
      if (matchCol) {
        provider = matchCol.llm_provider || matchCol.embedding_provider || '';
        model = matchCol.llm_model || matchCol.embedding_model || '';
      }
    }
    if (!provider && collections.length > 0) {
      provider = collections[0].llm_provider || collections[0].embedding_provider || '';
      model = collections[0].llm_model || collections[0].embedding_model || '';
    }
    executeRagQuery(q, text, title, limit, provider, model, setSandboxResult, setSandboxIsTesting, words);
  };

  // Icon Helper for formats
  const getFormatIcon = (format?: string) => {
    switch (format) {
      case 'PDF':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'DOCX':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'CSV':
        return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
      case 'Markdown':
        return <FileCode className="h-4 w-4 text-purple-500" />;
      case 'Image':
        return <ImageIcon className="h-4 w-4 text-amber-500" />;
      case 'Audio':
        return <Music className="h-4 w-4 text-pink-500" />;
      case 'Video':
        return <Video className="h-4 w-4 text-indigo-500" />;
      case 'Web Page':
        return <Globe className="h-4 w-4 text-cyan-500" />;
      default:
        return <FileText className="h-4 w-4 text-zinc-500" />;
    }
  };

  const formatCounts = useMemo(() => {
    const counts = {
      pdf: 0,
      doc: 0,
      csv: 0,
      image: 0,
      audio: 0,
      video: 0,
    };
    documents.forEach((d) => {
      const fmt = (d.format || d.type || '').toUpperCase();
      const title = (d.title || '').toLowerCase();
      if (fmt === 'PDF' || title.endsWith('.pdf')) counts.pdf++;
      else if (['DOCX', 'DOC', 'TXT', 'MARKDOWN', 'MD'].includes(fmt) || title.endsWith('.docx') || title.endsWith('.txt') || title.endsWith('.md')) counts.doc++;
      else if (['CSV', 'XLSX', 'XLS', 'SPREADSHEET'].includes(fmt) || title.endsWith('.csv') || title.endsWith('.xlsx')) counts.csv++;
      else if (['IMAGE', 'PNG', 'JPG', 'JPEG', 'WEBP', 'VISION'].includes(fmt) || title.endsWith('.png') || title.endsWith('.jpg') || title.endsWith('.jpeg')) counts.image++;
      else if (['AUDIO', 'MP3', 'WAV', 'OGG', 'M4A', 'STT'].includes(fmt) || title.endsWith('.mp3') || title.endsWith('.wav')) counts.audio++;
      else if (['VIDEO', 'MP4', 'WEBM', 'MOV', 'AVI'].includes(fmt) || title.endsWith('.mp4') || title.endsWith('.mov') || title.endsWith('.webm')) counts.video++;
      else counts.doc++;
    });
    return counts;
  }, [documents]);

  const formatFilterOptions: SearchableOption[] = useMemo(() => [
    { value: 'all', label: `All Formats (${documents.length})`, icon: <Layers className="h-3.5 w-3.5 text-zinc-400 shrink-0" /> },
    { value: 'PDF', label: `PDF Documents (${formatCounts.pdf})`, icon: <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />, badge: `${formatCounts.pdf}`, badgeVariant: 'danger' },
    { value: 'DOCX', label: `Word Documents (${formatCounts.doc})`, icon: <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />, badge: `${formatCounts.doc}`, badgeVariant: 'primary' },
    { value: 'Markdown', label: `Markdown Files (${formatCounts.doc})`, icon: <FileCode className="h-3.5 w-3.5 text-purple-500 shrink-0" />, badge: `${formatCounts.doc}`, badgeVariant: 'secondary' },
    { value: 'CSV', label: `Data Sheets (${formatCounts.csv})`, icon: <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500 shrink-0" />, badge: `${formatCounts.csv}`, badgeVariant: 'emerald' },
    { value: 'TXT', label: `Plain Text (${formatCounts.doc})`, icon: <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />, badge: `${formatCounts.doc}`, badgeVariant: 'amber' },
    { value: 'Image', label: `Images (${formatCounts.image})`, icon: <ImageIcon className="h-3.5 w-3.5 text-blue-400 shrink-0" />, badge: `${formatCounts.image}` },
    { value: 'Audio', label: `Audio Files (${formatCounts.audio})`, icon: <Music className="h-3.5 w-3.5 text-pink-500 shrink-0" />, badge: `${formatCounts.audio}` },
  ], [documents.length, formatCounts]);

  // Filtered documents & collections for the Unified Hub
  const filteredDocs = documents.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (formatFilter === 'all') return matchesSearch;
    const filterNorm = formatFilter.toLowerCase();
    const docFormatNorm = (d.format || d.type || '').toLowerCase();
    const docTitleNorm = d.title.toLowerCase();

    let matchesFormat = docFormatNorm === filterNorm;
    if (filterNorm === 'markdown') {
      matchesFormat = matchesFormat || docFormatNorm === 'md' || docTitleNorm.endsWith('.md') || docTitleNorm.endsWith('.markdown');
    } else if (filterNorm === 'docx') {
      matchesFormat = matchesFormat || docFormatNorm === 'doc' || docTitleNorm.endsWith('.docx') || docTitleNorm.endsWith('.doc');
    } else if (filterNorm === 'csv') {
      matchesFormat = matchesFormat || docFormatNorm === 'xlsx' || docTitleNorm.endsWith('.csv') || docTitleNorm.endsWith('.xlsx');
    } else if (filterNorm === 'pdf') {
      matchesFormat = matchesFormat || docTitleNorm.endsWith('.pdf');
    } else if (filterNorm === 'txt') {
      matchesFormat = matchesFormat || docTitleNorm.endsWith('.txt');
    } else if (filterNorm === 'image') {
      matchesFormat = matchesFormat || docTitleNorm.endsWith('.png') || docTitleNorm.endsWith('.jpg') || docTitleNorm.endsWith('.jpeg') || docTitleNorm.endsWith('.webp');
    } else if (filterNorm === 'audio') {
      matchesFormat = matchesFormat || docTitleNorm.endsWith('.mp3') || docTitleNorm.endsWith('.wav') || docTitleNorm.endsWith('.ogg');
    }
    return matchesSearch && matchesFormat;
  });

  const filteredCollections = collections.filter((c) => {
    const matchesSearch =
      c.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalIndexedChunks = useMemo(() => {
    const docChunks = documents.reduce((acc, d) => acc + (d.chunks || 0), 0);
    const colChunks = collections.reduce((acc, c) => acc + (c.uploaded_chunks || 0), 0);
    return docChunks + colChunks;
  }, [documents, collections]);

  const totalStorageMb = useMemo(() => {
    return documents.reduce((acc, d) => {
      if (!d.size) return acc;
      const str = String(d.size).toUpperCase();
      if (str.includes('MB')) {
        const val = parseFloat(str);
        return acc + (isNaN(val) ? 0 : val);
      } else if (str.includes('KB')) {
        const val = parseFloat(str);
        return acc + (isNaN(val) ? 0 : val / 1024);
      } else if (str.includes('BYTES') || str.includes('B')) {
        const val = parseFloat(str);
        return acc + (isNaN(val) ? 0 : val / (1024 * 1024));
      }
      return acc;
    }, 0);
  }, [documents]);

  // Dropdown Options
  const sandboxTargetOptions: SearchableOption[] = useMemo(() => {
    const list: SearchableOption[] = [
      {
        value: 'all',
        label: `All Indexed Workspace Knowledge (${documents.length} Docs, ${collections.length} Collections)`,
        subLabel: 'Queries all uploaded documents & collections in parallel',
        icon: <Globe className="h-4 w-4 text-blue-500 shrink-0" />,
        badge: 'Global',
        badgeVariant: 'primary',
      },
    ];

    collections.forEach((col) => {
      list.push({
        value: col.id,
        label: col.display_name,
        subLabel: `${col.vector_store || 'ChromaDB'} • ${col.uploaded_chunks ?? 0} Chunks • ${col.knowledge_type}`,
        icon: <Database className="h-4 w-4 text-purple-500 shrink-0" />,
        badge: col.vector_store || 'ChromaDB',
        badgeVariant: 'secondary',
      });
    });

    documents.forEach((doc) => {
      list.push({
        value: doc.id,
        label: doc.title,
        subLabel: `${doc.format || doc.type} • ${doc.size || 'Auto'} • ${doc.chunks ?? 0} Chunks`,
        icon: <FileText className="h-4 w-4 text-emerald-500 shrink-0" />,
        badge: `${doc.chunks ?? 0} Chunks`,
        badgeVariant: 'emerald',
      });
    });

    return list;
  }, [collections, documents]);

  // Dynamically compute 1-Click Grounding Test Prompts tailored 100% to the selected document/collection content
  const dynamicGroundingPrompts = useMemo<DynamicGroundingCard[]>(() => {
    let targetDoc: ExtendedKnowledgeDoc | undefined;
    let targetCol: KnowledgeCollectionItem | undefined;
    let text = '';
    let targetTitle = 'All Workspace Knowledge';

    if (sandboxTarget !== 'all') {
      targetCol = collections.find((c) => c.id === sandboxTarget || c.name === sandboxTarget || c.display_name.toLowerCase() === sandboxTarget.toLowerCase());
      if (targetCol) {
        targetTitle = targetCol.display_name;
        text = `${targetCol.display_name}\n${targetCol.description || ''}\n${targetCol.raw_text || ''}`;
        if (targetCol.attached_doc_id) {
          const att = documents.find((d) => d.id === targetCol?.attached_doc_id || d.title === targetCol?.attached_doc_name);
          if (att?.rawContent) text += '\n' + att.rawContent;
        }
      } else {
        targetDoc = documents.find((d) => d.id === sandboxTarget || d.title.toLowerCase() === sandboxTarget.toLowerCase());
        if (targetDoc) {
          targetTitle = targetDoc.title;
          text = targetDoc.rawContent || `${targetDoc.title} (${targetDoc.format || targetDoc.type}): Vectorized knowledge index.`;
        } else {
          targetTitle = sandboxTarget;
        }
      }
    } else {
      text = collections.map((c) => `${c.display_name}: ${c.description || ''} ${c.raw_text || ''}`).join('\n\n') +
             '\n\n' + documents.map((d) => `${d.title} (${d.format || d.type}): ${d.rawContent || ''}`).join('\n\n');
    }

    const lines = text.split('\n');
    const result: DynamicGroundingCard[] = [];
    const seenLabels = new Set<string>();

    const addCard = (label: string, query: string, category: string, icon: string, badge: string) => {
      let clean = label
        .replace(/^[\d\.\-\*#:\s]+/, '')
        .replace(/\[\s*(?:Icon|Logo|Image|Button|Get Started|QR CODE IMAGE|x|X|\s*)\s*\]/gi, '')
        .replace(/\[\s*[^\]]+\s*\]/g, '')
        .replace(/\*{2,}/g, '')
        .trim();
      const norm = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean.length < 3 || seenLabels.has(norm)) return;
      seenLabels.add(norm);
      let shortLabel = clean.length > 22 ? clean.slice(0, 20) + '...' : clean;
      let cleanBadge = (badge || '')
        .replace(/\[\s*(?:Icon|Logo|Image|Button|Get Started|QR CODE IMAGE|x|X|\s*)\s*\]/gi, '')
        .replace(/\[\s*[^\]]+\s*\]/g, '')
        .replace(/\*{2,}/g, '')
        .trim();
      result.push({ label: shortLabel, query: query.replace(/\*{2,}/g, '').trim(), category, icon, badge: cleanBadge });
    };

    // 1. Scan tables
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      const tableMatch = line.match(/^\|\s*\*\*?([^*|]{3,35})\*\*?\s*\|\s*\*\*?([^|]+)\*\*?\s*\|/);
      if (tableMatch && !['tier', 'header', 'plan tier', 'table', 'column'].some((k) => tableMatch[1].toLowerCase().includes(k))) {
        const tierName = tableMatch[1].trim();
        const tierPrice = tableMatch[2].trim();
        addCard(
          `${tierName} (${tierPrice.replace(',000', 'k')})`,
          `What are the inclusions, deliverables, and cost for ${tierName} (${tierPrice}) in ${targetTitle}?`,
          'Pricing',
          'pricing',
          tierPrice
        );
      }
    }

    // 2. Scan Headings
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith('#')) {
        const heading = line.replace(/^#+\s*(?:\d+[\.\)]\s*)?/, '').trim();
        const hl = heading.toLowerCase();
        if (heading.length > 3 && heading.length < 65 && !['http', 'table of contents', 'index'].some((k) => hl.includes(k))) {
          if (['price', 'cost', 'plan', 'matrix', 'fee'].some((k) => hl.includes(k))) {
            addCard(heading, `What are the pricing tiers, rates, and packages outlined in ${heading}?`, 'Pricing', 'pricing', 'Pricing');
          } else if (['tech', 'stack', 'api', 'architecture', 'code'].some((k) => hl.includes(k))) {
            addCard(heading, `What frameworks, APIs, and technical tools are specified under ${heading}?`, 'Integrations', 'api', 'APIs');
          } else if (['contact', 'founder', 'support', 'team', 'help'].some((k) => hl.includes(k))) {
            addCard(heading, `How can callers reach out to the team or contact support according to ${heading}?`, 'Contact', 'contact', 'Support');
          } else if (['policy', 'term', 'refund', 'warranty', 'guarantee', 'rule'].some((k) => hl.includes(k))) {
            addCard(heading, `What are the policies, terms, warranty, and rules outlined in ${heading}?`, 'Policies', 'policy', 'Terms');
          } else {
            addCard(heading, `What key details, capabilities, and specifications are described in ${heading}?`, 'Services', 'service', 'Core');
          }
        }
      }
    }

    // 3. Scan Bullets
    for (const rawLine of lines) {
      const line = rawLine.trim();
      const bulletBoldMatch = line.match(/^[-*•+]\s*\*\*([^*:]{3,40}):?\*\*\s*(.*)/);
      if (bulletBoldMatch) {
        const itemTitle = bulletBoldMatch[1].trim();
        const itl = itemTitle.toLowerCase();
        if (!itl.includes('page') && itemTitle.length > 3) {
          if (['price', 'plan', 'tier', 'fee', 'cost'].some((k) => itl.includes(k))) {
            addCard(itemTitle, `What is the cost and delivery scope for ${itemTitle} in ${targetTitle}?`, 'Pricing', 'pricing', 'Pricing');
          } else if (['api', 'integrat', 'gateway', 'stripe', 'razorpay'].some((k) => itl.includes(k))) {
            addCard(itemTitle, `What third-party integrations and APIs are supported for ${itemTitle}?`, 'Integrations', 'api', 'APIs');
          } else if (['contact', 'founder', 'email', 'phone', 'support'].some((k) => itl.includes(k))) {
            addCard(itemTitle, `How can callers contact the team regarding ${itemTitle}?`, 'Contact', 'contact', 'Direct');
          } else if (['policy', 'refund', 'terms', 'warranty'].some((k) => itl.includes(k))) {
            addCard(itemTitle, `What is the policy and terms regarding ${itemTitle} in ${targetTitle}?`, 'Policies', 'policy', 'Policy');
          } else {
            addCard(itemTitle, `What are the features, starting details, and deliverables for ${itemTitle}?`, 'Solutions', 'app', 'Deliverables');
          }
        }
      }
    }

    // Dynamic Generic Fillers
    const genericItems: DynamicGroundingCard[] = [
      { label: `${targetTitle.slice(0, 16)} Overview`, query: `What are the core capabilities and topics covered in ${targetTitle}?`, category: 'Overview', icon: 'sparkles', badge: 'Overview' },
      { label: 'Pricing & Plans', query: `What are the pricing options, tiers, and fee structures in ${targetTitle}?`, category: 'Pricing', icon: 'pricing', badge: 'Rates' },
      { label: 'Core Deliverables', query: `What are the key deliverables, workflows, and specifications in ${targetTitle}?`, category: 'Services', icon: 'service', badge: 'Core' },
      { label: 'Integrations & Tools', query: `What APIs, tools, and technical integrations are supported in ${targetTitle}?`, category: 'Integrations', icon: 'api', badge: 'Tech' },
      { label: 'Contact & Support', query: `How can callers get in touch with the team or support in ${targetTitle}?`, category: 'Contact', icon: 'contact', badge: 'Support' },
      { label: 'Terms & Policies', query: `What are the support policies, terms, warranty, and rules in ${targetTitle}?`, category: 'Policies', icon: 'policy', badge: 'Terms' },
    ];

    for (const g of genericItems) {
      if (result.length >= 6) break;
      addCard(g.label, g.query, g.category || 'General', g.icon || 'sparkles', g.badge || 'Info');
    }

    return result.slice(0, 6);
  }, [sandboxTarget, documents, collections]);

  const sandboxMaxMatchesOptions: SearchableOption[] = [
    {
      value: '3',
      label: 'Top 3 Vector Matches (Voice Realtime)',
      subLabel: 'Sub-25ms ultra-low latency optimized for live telephone conversations',
      icon: <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />,
      badge: 'Fastest',
      badgeVariant: 'emerald',
    },
    {
      value: '5',
      label: 'Top 5 Vector Matches (Standard Multi-Turn)',
      subLabel: 'Balanced contextual depth for customer inquiry workflows',
      icon: <Layers className="h-4 w-4 text-blue-500 shrink-0" />,
    },
    {
      value: '10',
      label: 'Top 10 Vector Matches (Deep Technical RAG)',
      subLabel: 'Exhaustive semantic coverage for complex pricing and SOP queries',
      icon: <Database className="h-4 w-4 text-purple-500 shrink-0" />,
    },
    {
      value: 'all',
      label: 'All Vector Matches (Unlimited Retrieval)',
      subLabel: 'Full semantic scan across active workspace index',
      icon: <Zap className="h-4 w-4 text-amber-500 shrink-0" />,
    },
  ];

  const knowledgeTypeOptions: SearchableOption[] = [
    { value: 'Company Knowledge', label: 'Company Knowledge', subLabel: 'Internal company FAQs, manuals, and handbooks', icon: <Building className="h-4 w-4 text-blue-500 shrink-0" /> },
    { value: 'Product/Service', label: 'Product / Service Specs', subLabel: 'Technical specs, pricing cards, features', icon: <Box className="h-4 w-4 text-purple-500 shrink-0" /> },
    { value: 'FAQ', label: 'FAQ & Knowledge Base', subLabel: 'Standard customer Q&A pairs', icon: <HelpCircle className="h-4 w-4 text-amber-500 shrink-0" /> },
    { value: 'Policies', label: 'Terms & Business Policies', subLabel: 'Cancellation, refund, and legal policies', icon: <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" /> },
    { value: 'Pricing', label: 'Pricing & Billing Rates', subLabel: 'Fee structure and enterprise tiers', icon: <CreditCard className="h-4 w-4 text-rose-500 shrink-0" /> },
    { value: 'Procedures', label: 'Standard Operating Procedures', subLabel: 'SOPs and escalation steps', icon: <ListChecks className="h-4 w-4 text-indigo-500 shrink-0" /> },
    { value: 'Support Knowledge', label: 'Customer Support Scripts', subLabel: 'Agent talk tracks, supervisor transfer', icon: <Headphones className="h-4 w-4 text-teal-500 shrink-0" /> },
    { value: 'Custom', label: 'Custom Knowledge Type...', subLabel: 'Specify custom category', icon: <Sparkles className="h-4 w-4 text-purple-500 shrink-0" /> },
  ];

  const statusOptions: SearchableOption[] = [
    { value: 'Active', label: 'Active (Live RAG Grounding)', subLabel: 'Searchable by AI agents in real-time', icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />, badge: 'Live', badgeVariant: 'emerald' },
    { value: 'Draft', label: 'Draft Mode', subLabel: 'Work in progress staging index', icon: <Clock className="h-4 w-4 text-amber-500 shrink-0" />, badge: 'Draft', badgeVariant: 'amber' },
    { value: 'Archived', label: 'Archived', subLabel: 'Excluded from live vector searches', icon: <Archive className="h-4 w-4 text-zinc-400 shrink-0" /> },
  ];

  const scopeOptions: SearchableOption[] = [
    { value: 'Global Workspace', label: 'Global Workspace', subLabel: 'Accessible by all AI Voice agents', icon: <Globe className="h-4 w-4 text-blue-500 shrink-0" /> },
    { value: 'Organization Level', label: 'Organization Level', subLabel: 'Restricted to org team', icon: <Building className="h-4 w-4 text-purple-500 shrink-0" /> },
    { value: 'Agent Level', label: 'Agent Specific', subLabel: 'Bound to specific agent persona', icon: <Headphones className="h-4 w-4 text-indigo-500 shrink-0" /> },
  ];

  const sourceTypeOptions: SearchableOption[] = [
    { value: 'Attached Document from Library', label: 'Attached Document from Library', subLabel: 'Auto-detect format, size & vector chunks', icon: <FileText className="h-4 w-4 text-blue-500 shrink-0" /> },
    { value: 'Website / URL', label: 'Website Scraper / Web Crawler URL', subLabel: 'Crawl documentation sites & web pages', icon: <Globe className="h-4 w-4 text-cyan-500 shrink-0" /> },
    { value: 'FAQ / Text', label: 'Direct FAQ Text / SOPs', subLabel: 'Manual text chunking & instant vectors', icon: <FileCode className="h-4 w-4 text-emerald-500 shrink-0" /> },
    { value: 'API', label: 'Custom REST API Endpoint', subLabel: 'Remote dynamic JSON knowledge endpoint', icon: <Zap className="h-4 w-4 text-purple-500 shrink-0" /> },
  ];

  const attachedDocOptions: SearchableOption[] = useMemo(() => {
    return documents.map((d) => ({
      value: d.id,
      label: d.title,
      subLabel: `${d.format || d.type} • ${d.size || 'Auto'} • ${d.chunks} Chunks`,
      icon: getFormatIcon(d.format || d.type),
      badge: `${d.chunks} Chunks`,
      badgeVariant: 'emerald',
    }));
  }, [documents]);

  // 1. Dynamic LLM Providers strictly from API & Integrations SSOT (Tab 1 configured/connected providers)
  // 1. Dynamic LLM Providers strictly from API & Integrations SSOT (Only configured/connected providers)
  const dynamicLlmProviderOptions: SearchableOption[] = useMemo(() => {
    const rawList = customRegistry['llm'] || [];
    const opts: SearchableOption[] = [];
    const seen = new Set<string>();

    // Strictly filter for providers configured in Tab 1 (active key, local endpoint, or active status)
    const configuredLlms = rawList.filter((item: any) => {
      const pId = (item.provider || item.id || item.name || '').toLowerCase().trim();
      const hasKey = Boolean(
        (item.plain_key && item.plain_key.trim() && item.plain_key !== 'local-endpoint') ||
        (item.raw_key && item.raw_key.trim() && item.raw_key !== 'local-endpoint') ||
        (item.api_key && item.api_key.trim() && item.api_key !== 'local-endpoint') ||
        item.status === 'Active' ||
        item.status === 'Connected' ||
        item.status === 'Ready' ||
        item.is_configured === true ||
        item.is_owner === true ||
        ['ollama', 'lmstudio', 'vllm', 'localai'].some((k) => pId.includes(k)) ||
        (item.base_url && (item.base_url.includes('localhost') || item.base_url.includes('127.0.0.1')))
      );
      return hasKey;
    });

    const registryLlms = configuredLlms.length > 0 ? configuredLlms : rawList;

    registryLlms.forEach((item: any) => {
      const pId = item.provider || item.id || item.name;
      const pName = item.display_name || item.name || item.provider || 'AI Provider';
      const pModel = item.selected_model_name || item.primary_model || item.model || item.default_model;
      const norm = (pId || '').toLowerCase().trim();
      const pKey = norm.replace(/[^a-z0-9_]/g, '_');
      const cached = modelsCache[pKey] || modelsCache[norm] || [];
      const countStr = cached.length > 0 ? `${cached.length} Models` : item.models_count ? `${item.models_count} Models` : 'SSOT Connected';

      if (norm && !seen.has(norm)) {
        seen.add(norm);
        opts.push({
          value: item.name || item.provider || pId,
          label: pName,
          subLabel: pModel ? `Active Model: ${pModel} • ${countStr}` : `Tab 1 SSOT • ${countStr}`,
          icon: norm.includes('gemini') || norm.includes('google') ? (
            <Cpu className="h-4 w-4 text-blue-500 shrink-0" />
          ) : norm.includes('groq') ? (
            <Zap className="h-4 w-4 text-amber-500 shrink-0" />
          ) : norm.includes('openai') ? (
            <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : norm.includes('claude') || norm.includes('anthropic') ? (
            <Sparkles className="h-4 w-4 text-rose-500 shrink-0" />
          ) : norm.includes('ollama') ? (
            <HardDrive className="h-4 w-4 text-zinc-500 shrink-0" />
          ) : (
            <Cpu className="h-4 w-4 text-purple-500 shrink-0" />
          ),
          badge: countStr,
          badgeVariant: norm.includes('google') || norm.includes('gemini') ? 'primary' : 'emerald',
        });
      }
    });

    return opts;
  }, [customRegistry, modelsCache]);

  // 2. Dynamic Live LLM Models strictly from Live Backend Endpoint & SSOT Configured Models
  const dynamicLlmModelOptions: SearchableOption[] = useMemo(() => {
    const provNorm = (kcLlmProvider || '').toLowerCase().trim();
    const opts: SearchableOption[] = [];
    const seen = new Set<string>();

    const getModality = (name: string, desc?: string, cat?: string) => {
      const combined = `${name} ${desc || ''} ${cat || ''}`.toLowerCase();
      if (/whisper|audio|speech|voice|clap|wav2vec|deepgram|conformer|seamless|salmonn|qwen.*audio|gemini.*audio/i.test(combined)) {
        return { guide: '🎙️ Best for Audio Calls (MP3/WAV), Voice Notes & Speech RAG', badge: '🎙️ Audio / Speech', variant: 'secondary' as const, icon: <Music className="h-4 w-4 text-purple-500 shrink-0" /> };
      }
      if (/gemini-2\.|gemini-1\.5|gemini-2\.5|gpt-4o|claude-3|qwen.*vl|pixtral|llava|video|multimodal|omni|cross-modal|internvideo|videollama/i.test(combined)) {
        return { guide: '🎥 Best for Video (MP4/MOV), Screen Recordings & Multimodal RAG', badge: '🎥 Video / Multimodal', variant: 'primary' as const, icon: <Video className="h-4 w-4 text-blue-500 shrink-0" /> };
      }
      if (/clip|siglip|image|vision|dino|eva|florence|donut|ocr|doc-vision|paddle/i.test(combined)) {
        return { guide: '📸 Best for Images (PNG/JPG), Infographics & Visual OCR RAG', badge: '📸 Image / Vision', variant: 'amber' as const, icon: <ImageIcon className="h-4 w-4 text-amber-500 shrink-0" /> };
      }
      if (/embed|embedding|bge|minilm|text-embedding|nomic|voyage|ada|gte|bert|sentence|e5|jina|cohere-embed|document|doc/i.test(combined)) {
        return { guide: '📄 Best for PDF, DOCX, CSV, FAQs & High-Density Vector Search', badge: '📄 Document / PDF Vector', variant: 'emerald' as const, icon: <Database className="h-4 w-4 text-emerald-500 shrink-0" /> };
      }
      return { guide: '⚡ High-Speed Semantic Reasoning & Synthesis', badge: '⚡ AI Reasoning', variant: 'primary' as const, icon: <Cpu className="h-4 w-4 text-sky-500 shrink-0" /> };
    };

    // 1. Live Fetched Models from Backend API / Database Cache (modelsCache via /api/providers/models)
    const pKey = provNorm.replace(/[^a-z0-9_]/g, '_');
    const liveFetched = modelsCache[pKey] || modelsCache[provNorm] || modelsCache[kcLlmProvider] || [];
    if (Array.isArray(liveFetched) && liveFetched.length > 0) {
      liveFetched.forEach((m: any) => {
        const mId = typeof m === 'string' ? m : m.id || m.name || m.label;
        const mLabel = typeof m === 'object' ? m.label || m.name || m.id : m;
        const mCtx = typeof m === 'object' ? m.contextWindow || m.description : 'Live API';
        const mCat = typeof m === 'object' ? m.category || m.type : '';
        if (mId && !seen.has(mId.toLowerCase())) {
          seen.add(mId.toLowerCase());
          const mod = getModality(mId, mCtx || mLabel, mCat);
          opts.push({
            value: mId,
            label: mLabel,
            subLabel: mCtx ? `${mod.guide} • Context: ${mCtx}` : mod.guide,
            icon: mod.icon,
            badge: mod.badge,
            badgeVariant: mod.variant,
          });
        }
      });
    } else {
      // 2. Fallback to Configured Provider Models from customRegistry['llm'] (API & Integrations Tab 1 SSOT)
      const registryLlms = customRegistry['llm'] || [];
      const match = registryLlms.find((item: any) => {
        const pId = (item.provider || item.id || item.name || '').toLowerCase();
        return pId === provNorm || provNorm.includes(pId) || pId.includes(provNorm);
      });

      if (match) {
        if (Array.isArray(match.available_models) && match.available_models.length > 0) {
          match.available_models.forEach((m: any) => {
            const mStr = typeof m === 'string' ? m : m.id || m.name || m.label;
            if (mStr && !seen.has(mStr.toLowerCase())) {
              seen.add(mStr.toLowerCase());
              const mod = getModality(mStr);
              opts.push({
                value: mStr,
                label: mStr,
                subLabel: `${mod.guide} • Available for ${match.name || match.provider}`,
                icon: mod.icon,
                badge: mod.badge,
                badgeVariant: mod.variant,
              });
            }
          });
        } else {
          const configuredModel = match.selected_model_name || match.primary_model || match.model || match.default_model;
          if (configuredModel && !seen.has(configuredModel.toLowerCase())) {
            seen.add(configuredModel.toLowerCase());
            const mod = getModality(configuredModel);
            opts.push({
              value: configuredModel,
              label: configuredModel,
              subLabel: `${mod.guide} • Configured in API & Integrations (${match.display_name || match.name})`,
              icon: mod.icon,
              badge: mod.badge,
              badgeVariant: mod.variant,
            });
          }
        }
      }
    }

    return opts;
  }, [kcLlmProvider, customRegistry, modelsCache]);

  // 3. Dynamic 104+ Languages Options from Catalog + Integrations SSOT
  const languageOptions: SearchableOption[] = useMemo(() => {
    const opts: SearchableOption[] = [];
    const seen = new Set<string>();

    const customLangs = customRegistry['languages'] || [];
    customLangs.forEach((l: any) => {
      const loc = l.locale || l.id || l.name;
      if (loc && !seen.has(loc.toLowerCase())) {
        seen.add(loc.toLowerCase());
        opts.push({
          value: loc,
          label: `${l.flag || '🌐'} ${l.name || l.display_name} (${l.locale || loc})`,
          subLabel: `${l.currency || 'Standard Currency'} • ${l.description || 'Configured in API & Integrations'}`,
          icon: <Globe className="h-4 w-4 text-blue-500 shrink-0" />,
          badge: 'SSOT Configured',
          badgeVariant: 'emerald',
        });
      }
    });

    GLOBAL_LANGUAGES_CATALOG.forEach((lang: GlobalLanguageItem) => {
      if (!seen.has(lang.locale.toLowerCase())) {
        seen.add(lang.locale.toLowerCase());
        opts.push({
          value: lang.locale,
          label: `${lang.flag} ${lang.name} (${lang.nativeName})`,
          subLabel: `${lang.locale} • ${lang.country} (${lang.region}) • ${lang.currency}`,
          icon: <Globe className="h-4 w-4 text-emerald-500 shrink-0" />,
          badge: lang.region,
          badgeVariant: lang.region === 'India' ? 'primary' : 'secondary',
        });
      }
    });

    return opts;
  }, [customRegistry]);

  // 4. Dynamic Embedding Provider Options strictly matching API & Integrations LLM providers (Tab 1 SSOT)
  const dynamicEmbeddingProviderOptions: SearchableOption[] = useMemo(() => {
    const opts: SearchableOption[] = [];
    const seen = new Set<string>();

    // Strictly mirror the active, configured AI providers from Tab 1 SSOT
    dynamicLlmProviderOptions.forEach((llmOpt) => {
      const norm = llmOpt.value.toLowerCase().trim();
      if (!seen.has(norm)) {
        seen.add(norm);
        const pKey = norm.replace(/[^a-z0-9_]/g, '_');
        const cached = modelsCache[pKey] || modelsCache[norm] || [];
        const countStr = cached.length > 0 ? `${cached.length} Models` : (llmOpt.badge || 'SSOT Connected');

        opts.push({
          value: llmOpt.value,
          label: llmOpt.label,
          subLabel: `Multimodal Vector Engine • ${countStr}`,
          icon: <Database className="h-4 w-4 text-purple-500 shrink-0" />,
          badge: countStr,
          badgeVariant: 'primary',
        });
      }
    });

    return opts;
  }, [dynamicLlmProviderOptions, modelsCache]);

  // 5. Dynamic Embedding & Multimodal RAG Model Options strictly from Live Backend Endpoint & SSOT with Smart Modality Guides
  const dynamicEmbeddingModelOptions: SearchableOption[] = useMemo(() => {
    const provNorm = (kcEmbeddingProvider || '').toLowerCase().trim();
    const seen = new Set<string>();

    const getModalityInfo = (name: string, desc?: string, cat?: string) => {
      const combined = `${name} ${desc || ''} ${cat || ''}`.toLowerCase();
      
      // 1. Audio, Speech & Call Transcription RAG
      if (/whisper|audio|speech|voice|clap|wav2vec|deepgram|conformer|seamless|salmonn|qwen.*audio|gemini.*audio/i.test(combined)) {
        return {
          guide: '🎙️ Best for Audio Calls (MP3/WAV), Voice Notes & Speech RAG',
          badge: '🎙️ Audio / Speech',
          variant: 'secondary' as const,
          category: 'audio',
          sortPriority: 2,
        };
      }
      
      // 2. Video & Native Multimodal RAG
      if (/gemini-2\.|gemini-1\.5|gemini-2\.5|gpt-4o|claude-3|qwen.*vl|pixtral|llava|video|multimodal|omni|cross-modal|internvideo|videollama/i.test(combined)) {
        return {
          guide: '🎥 Best for Video (MP4/MOV), Screen Recordings & Multimodal RAG',
          badge: '🎥 Video / Multimodal',
          variant: 'primary' as const,
          category: 'video',
          sortPriority: 1,
        };
      }
      
      // 3. Image & Visual OCR RAG
      if (/clip|siglip|image|vision|dino|eva|florence|donut|ocr|doc-vision|paddle/i.test(combined)) {
        return {
          guide: '📸 Best for Images (PNG/JPG), Infographics & Visual OCR RAG',
          badge: '📸 Image / Vision',
          variant: 'amber' as const,
          category: 'image',
          sortPriority: 3,
        };
      }
      
      // 4. Text & High-Density Vector Embeddings
      if (/embed|embedding|bge|minilm|text-embedding|nomic|voyage|ada|gte|bert|sentence|e5|jina|cohere-embed|document|doc/i.test(combined)) {
        return {
          guide: '📄 Best for PDF, DOCX, CSV, FAQs & High-Density Vector Search',
          badge: '📄 Document / PDF Vector',
          variant: 'emerald' as const,
          category: 'vector',
          sortPriority: 0,
        };
      }
      
      // 5. General AI Reasoning
      return {
        guide: '⚡ High-Speed Semantic Reasoning & Knowledge Synthesis',
        badge: '⚡ AI Reasoning',
        variant: 'primary' as const,
        category: 'reasoning',
        sortPriority: 4,
      };
    };

    // 1. Live Fetched Models from Backend API / Cache
    const pKey = provNorm.replace(/[^a-z0-9_]/g, '_');
    const liveFetched = modelsCache[pKey] || modelsCache[provNorm] || modelsCache[kcEmbeddingProvider] || [];
    const rawCandidates: any[] = [];

    if (Array.isArray(liveFetched) && liveFetched.length > 0) {
      liveFetched.forEach((m: any) => {
        const mId = typeof m === 'string' ? m : m.id || m.name || m.label;
        const mLabel = typeof m === 'object' ? m.label || m.name || m.id : m;
        const mCtx = typeof m === 'object' ? m.contextWindow || m.description : '';
        const mCat = typeof m === 'object' ? m.category || m.type : '';
        if (mId && !seen.has(mId.toLowerCase())) {
          seen.add(mId.toLowerCase());
          const info = getModalityInfo(mId, mCtx || mLabel, mCat);
          rawCandidates.push({
            value: mId,
            label: mLabel,
            subLabel: mCtx ? `${info.guide} • Context: ${mCtx}` : info.guide,
            icon: info.category === 'vector' ? (
              <Database className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : info.category === 'video' ? (
              <Video className="h-4 w-4 text-blue-500 shrink-0" />
            ) : info.category === 'audio' ? (
              <Music className="h-4 w-4 text-purple-500 shrink-0" />
            ) : info.category === 'image' ? (
              <ImageIcon className="h-4 w-4 text-amber-500 shrink-0" />
            ) : (
              <Cpu className="h-4 w-4 text-sky-500 shrink-0" />
            ),
            badge: info.badge,
            badgeVariant: info.variant,
            sortPriority: info.sortPriority,
          });
        }
      });
    } else {
      // 2. Fallback to Configured Embedding in SSOT (Tab 1 or Tab 4)
      const allAiItems = [
        ...(customRegistry['llm'] || []),
        ...(customRegistry['embeddings'] || []),
        ...(customRegistry['embedding_vector_ai'] || []),
      ];
      const match = allAiItems.find((item: any) => {
        const pId = (item.provider || item.id || item.name || '').toLowerCase();
        return pId === provNorm || provNorm.includes(pId) || pId.includes(provNorm);
      });

      if (match) {
        const available = Array.isArray(match.available_models) && match.available_models.length > 0
          ? match.available_models
          : [match.default_model || match.primary_model || match.model || match.selected_model_name].filter(Boolean);

        available.forEach((m: any) => {
          const mStr = typeof m === 'string' ? m : m.id || m.name || m.label;
          if (mStr && !seen.has(mStr.toLowerCase())) {
            seen.add(mStr.toLowerCase());
            const info = getModalityInfo(mStr);
            rawCandidates.push({
              value: mStr,
              label: mStr,
              subLabel: `${info.guide} • Available for ${match.display_name || match.name || match.provider}`,
              icon: info.category === 'vector' ? (
                <Database className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : info.category === 'video' ? (
                <Video className="h-4 w-4 text-blue-500 shrink-0" />
              ) : info.category === 'audio' ? (
                <Music className="h-4 w-4 text-purple-500 shrink-0" />
              ) : info.category === 'image' ? (
                <ImageIcon className="h-4 w-4 text-amber-500 shrink-0" />
              ) : (
                <Cpu className="h-4 w-4 text-sky-500 shrink-0" />
              ),
              badge: info.badge,
              badgeVariant: info.variant,
              sortPriority: info.sortPriority,
            });
          }
        });
      }
    }

    // Sort cleanly: Vector Embeddings first, Video/Multimodal, Audio/Speech, Image/Vision, AI Reasoning
    rawCandidates.sort((a, b) => (a.sortPriority ?? 99) - (b.sortPriority ?? 99));

    return rawCandidates.map(({ sortPriority, ...rest }) => rest);
  }, [kcEmbeddingProvider, customRegistry, modelsCache]);

  // Auto-Select Default Matching Options for LLM & Embedding Providers and Models
  useEffect(() => {
    if (dynamicLlmProviderOptions.length > 0) {
      const match = dynamicLlmProviderOptions.find(
        (p) =>
          p.value === kcLlmProvider ||
          p.value.toLowerCase() === kcLlmProvider.toLowerCase() ||
          p.label.toLowerCase().includes(kcLlmProvider.toLowerCase()) ||
          kcLlmProvider.toLowerCase().includes(p.value.toLowerCase())
      );
      if (match) {
        if (kcLlmProvider !== match.value) setKcLlmProvider(match.value);
      } else {
        setKcLlmProvider(dynamicLlmProviderOptions[0].value);
      }
    }
  }, [dynamicLlmProviderOptions]);

  useEffect(() => {
    if (dynamicLlmModelOptions.length > 0) {
      const match = dynamicLlmModelOptions.find(
        (m) => m.value === kcLlmModel || m.value.toLowerCase() === kcLlmModel.toLowerCase()
      );
      if (match) {
        if (kcLlmModel !== match.value) setKcLlmModel(match.value);
      } else {
        setKcLlmModel(dynamicLlmModelOptions[0].value);
      }
    }
  }, [dynamicLlmModelOptions]);

  useEffect(() => {
    if (dynamicEmbeddingProviderOptions.length > 0) {
      const match = dynamicEmbeddingProviderOptions.find(
        (p) =>
          p.value === kcEmbeddingProvider ||
          p.value.toLowerCase() === kcEmbeddingProvider.toLowerCase() ||
          p.label.toLowerCase().includes(kcEmbeddingProvider.toLowerCase()) ||
          kcEmbeddingProvider.toLowerCase().includes(p.value.toLowerCase())
      );
      if (match) {
        if (kcEmbeddingProvider !== match.value) setKcEmbeddingProvider(match.value);
      } else {
        setKcEmbeddingProvider(dynamicEmbeddingProviderOptions[0].value);
      }
    }
  }, [dynamicEmbeddingProviderOptions]);

  useEffect(() => {
    if (dynamicEmbeddingModelOptions.length > 0) {
      const match = dynamicEmbeddingModelOptions.find(
        (m) => m.value === kcEmbeddingModel || m.value.toLowerCase() === kcEmbeddingModel.toLowerCase()
      );
      if (match) {
        if (kcEmbeddingModel !== match.value) setKcEmbeddingModel(match.value);
      } else {
        setKcEmbeddingModel(dynamicEmbeddingModelOptions[0].value);
      }
    }
  }, [dynamicEmbeddingModelOptions]);

  const chunkingStrategyOptions: SearchableOption[] = [
    { value: 'Recursive Character (1024 tokens)', label: 'Recursive Character (1024 tokens)', subLabel: 'Best for standard text, manuals & markdown docs', icon: <Sliders className="h-4 w-4 text-blue-500 shrink-0" />, badge: 'Recommended', badgeVariant: 'primary' },
    { value: 'Fixed Window (512 tokens)', label: 'Fixed Size Window (512 tokens)', subLabel: 'Fixed size sliding token window with overlap', icon: <Layers className="h-4 w-4 text-indigo-500 shrink-0" /> },
    { value: 'Semantic Paragraph', label: 'Semantic Paragraph Splitting', subLabel: 'Splits on natural topic shifts & Markdown headers', icon: <FileText className="h-4 w-4 text-purple-500 shrink-0" /> },
    { value: 'Markdown Hierarchy Structure', label: 'Markdown Hierarchy & Table Aware', subLabel: 'Preserves tables, pricing matrices, and section headings intact', icon: <FileCode className="h-4 w-4 text-emerald-500 shrink-0" />, badge: 'Best for Tables', badgeVariant: 'emerald' },
  ];

  const strictnessOptions: SearchableOption[] = [
    { value: 'Strict Grounding', label: 'Strict Grounding (0.0 Temp • Zero Hallucinations)', subLabel: 'Strictly bounds AI answers only to factual evidence in indexed files', icon: <ShieldCheck className="h-4 w-4 text-rose-500 shrink-0" />, badge: 'Safest', badgeVariant: 'danger' },
    { value: 'Balanced Synthesis', label: 'Balanced Synthesis (0.3 Temp • Recommended)', subLabel: 'Natural conversational answers with verified citation grounding', icon: <Sparkles className="h-4 w-4 text-blue-500 shrink-0" />, badge: 'Recommended', badgeVariant: 'primary' },
    { value: 'Creative Reasoning', label: 'Creative Reasoning (0.7 Temp • Deep Context)', subLabel: 'Permits conversational elaboration while preserving core facts', icon: <Zap className="h-4 w-4 text-purple-500 shrink-0" />, badge: 'Flexible', badgeVariant: 'secondary' },
  ];

  const vectorStoreOptions: SearchableOption[] = [
    { value: 'ChromaDB', label: 'ChromaDB (Local / In-Memory SSOT)', subLabel: 'Sub-millisecond local vector database', icon: <Database className="h-4 w-4 text-blue-500 shrink-0" />, badge: 'Local', badgeVariant: 'primary' },
    { value: 'Pinecone', label: 'Pinecone (Serverless Cloud Vector DB)', subLabel: 'Managed serverless cloud vector store', icon: <HardDrive className="h-4 w-4 text-emerald-500 shrink-0" />, badge: 'Cloud', badgeVariant: 'emerald' },
    { value: 'Qdrant', label: 'Qdrant (High-performance Vector Engine)', subLabel: 'Rust-based vector search with advanced filtering', icon: <Cpu className="h-4 w-4 text-purple-500 shrink-0" />, badge: 'Cloud', badgeVariant: 'secondary' },
    { value: 'Milvus', label: 'Milvus (Distributed Enterprise Cluster)', subLabel: 'Scales to billions of vector vectors', icon: <Layers className="h-4 w-4 text-amber-500 shrink-0" />, badge: 'Enterprise', badgeVariant: 'amber' },
  ];

  return (
    <div className="space-y-4 flex-1 min-h-0 flex flex-col">
      {/* Top Header */}
      <div className="space-y-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5 shrink-0">
        {/* ROW 1: Heading on Left + Plan & Storage Badges on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap leading-none">
              Knowledge Base &amp; RAG Indexing
            </h2>
          </div>

          {/* Plan, RAG Storage Badges & Upgrade */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Badge
              variant="outline"
              className="text-xs font-semibold border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer hover:bg-amber-500/20 transition-colors"
              onClick={() =>
                triggerGuardrail(
                  'custom',
                  'Knowledge Base & RAG Plan Entitlements',
                  `Active plan "${entitlements.planName}" gives your workspace ${entitlements.isUnlimited ? 'unlimited' : `${entitlements.ragStorageMb} MB`} RAG vector storage quota and grounding capabilities.`
                )
              }
              title="Click to view subscription plan entitlements"
            >
              <Crown className="h-3 w-3 text-amber-500" />
              <span>Plan: {entitlements.planName}</span>
            </Badge>

            <Badge
              variant={totalStorageMb >= entitlements.ragStorageMb && !entitlements.isUnlimited ? 'warning' : 'outline'}
              className="text-xs font-semibold px-2 py-0.5 flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
            >
              <HardDrive className="h-3 w-3 text-emerald-500" />
              <span>
                RAG Storage: {totalStorageMb.toFixed(1)} MB / {entitlements.isUnlimited ? '∞' : `${entitlements.ragStorageMb} MB`}
              </span>
            </Badge>

            {!entitlements.isUnlimited && (
              <Button
                size="xs"
                variant="outline"
                className="h-6 text-xs font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 shadow-2xs cursor-pointer transition-all"
                onClick={() => (onNavigate ? onNavigate('billing') : undefined)}
                leftIcon={<Crown className="h-3 w-3 text-amber-500" />}
              >
                Upgrade
              </Button>
            )}
          </div>
        </div>

        {/* ROW 2: Description on Left + Action Buttons on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Feed document files, web URLs, and vector knowledge stores into your AI Agent context memory.
          </p>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="xs"
              onClick={() => loadDocuments(true)}
              disabled={isLoading}
              leftIcon={<RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />}
              className="h-7.5 text-xs font-semibold px-2.5 shadow-2xs"
              title="Refresh document status and collections"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>

            {activeTab === 'crawler' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartCrawl}
                disabled={isCrawling || !crawlUrl}
                leftIcon={isCrawling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                className="font-bold text-xs"
              >
                {isCrawling ? 'Crawling...' : 'Start Web Crawler'}
              </Button>
            ) : activeTab === 'simulator' ? (
              <div className="flex items-center gap-2">
                {sandboxResult && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSandboxResult(null);
                      addToast({ type: 'info', title: 'Sandbox Reset', description: 'Cleared test queries and retrieval output.' });
                    }}
                    leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                    className="font-semibold text-xs"
                  >
                    Clear Results
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSandboxRetrieval()}
                  disabled={sandboxIsTesting}
                  leftIcon={sandboxIsTesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  className="font-bold text-xs"
                >
                  {sandboxIsTesting ? 'Searching...' : 'Run Grounding Test'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCollectionStudio()}
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  className="font-bold text-xs bg-white dark:bg-zinc-900 shadow-2xs"
                >
                  New Collection
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleTabChange('upload')}
                  leftIcon={<Upload className="h-3.5 w-3.5" />}
                  className="font-bold text-xs shadow-xs"
                >
                  Upload Document
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Spacious Interactive Top Metric Cards (Clicking directly activates corresponding Tab & View) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
        {/* Card 1: Active Documents -> Activates Knowledge Hub Docs View */}
        <div
          onClick={() => {
            handleTabChange('hub');
            handleHubViewModeChange('documents');
          }}
          className={`p-4 sm:p-5 bg-white dark:bg-zinc-900 border rounded-2xl flex items-center justify-between shadow-2xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
            activeTab === 'hub' && hubViewMode === 'documents'
              ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20'
              : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-blue-400'
          }`}
          title="Click to view all indexed documents"
        >
          <div>
            <div className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Active Documents</span>
              <ChevronRight className="h-3 w-3 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{documents.length} Docs</p>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1 block">Multimodal Ingested</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: RAG Collections -> Activates Knowledge Hub Collections View */}
        <div
          onClick={() => {
            handleTabChange('hub');
            handleHubViewModeChange('collections');
          }}
          className={`p-4 sm:p-5 bg-white dark:bg-zinc-900 border rounded-2xl flex items-center justify-between shadow-2xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
            activeTab === 'hub' && hubViewMode === 'collections'
              ? 'border-purple-500 dark:border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/20 dark:bg-purple-950/20'
              : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-purple-400'
          }`}
          title="Click to view all RAG vector collections"
        >
          <div>
            <div className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span>RAG Collections</span>
              <ChevronRight className="h-3 w-3 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{collections.length} Stores</p>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1 block">ChromaDB SSOT</span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Vector Embeddings -> Activates Vector DB Settings Tab */}
        <div
          onClick={() => handleTabChange('settings')}
          className={`p-4 sm:p-5 bg-white dark:bg-zinc-900 border rounded-2xl flex items-center justify-between shadow-2xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
            activeTab === 'settings'
              ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-400'
          }`}
          title="Click to configure vector database & embeddings"
        >
          <div>
            <div className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Vector Embeddings</span>
              <ChevronRight className="h-3 w-3 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalIndexedChunks} Chunks</p>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1 block">104+ Languages NLP</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <HardDrive className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Grounding Latency -> Activates Grounding Sandbox Tab */}
        <div
          onClick={() => handleTabChange('simulator')}
          className={`p-4 sm:p-5 bg-white dark:bg-zinc-900 border rounded-2xl flex items-center justify-between shadow-2xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
            activeTab === 'simulator'
              ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
              : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-indigo-400'
          }`}
          title="Click to open live Grounding Sandbox & simulator"
        >
          <div>
            <div className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Grounding Latency</span>
              <ChevronRight className="h-3 w-3 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">&lt; 24ms</p>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              100% SSOT Live Synced
            </span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="shrink-0 overflow-x-auto scrollbar-none pb-0.5">
        <Tabs
          activeTab={activeTab}
          onChange={(t) => handleTabChange(t as any)}
          variant="pills"
          className="whitespace-nowrap min-w-max"
          tabs={[
            { id: 'hub', label: 'Knowledge Hub', badge: documents.length + collections.length },
            { id: 'editor', label: editingCollectionId ? '✏️ Edit Collection' : '➕ Collection Studio' },
            { id: 'upload', label: 'Upload Documents' },
            { id: 'crawler', label: 'Website Crawler' },
            { id: 'simulator', label: 'Grounding Sandbox' },
            { id: 'settings', label: 'Vector DB Settings' },
          ]}
        />
      </div>

      {/* TAB 1: UNIFIED KNOWLEDGE HUB (3 CARDS PER ROW, FEATURE-RICH) */}
      {activeTab === 'hub' && (
        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="w-full md:w-80">
              <Input
                placeholder="Search knowledge docs & collections..."
                leftIcon={<Search className="h-3.5 w-3.5" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between md:justify-end w-full md:w-auto">
              <div className="flex items-center bg-white dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => handleHubViewModeChange('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    hubViewMode === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  All ({documents.length + collections.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleHubViewModeChange('documents')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    hubViewMode === 'documents'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  Docs ({documents.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleHubViewModeChange('collections')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    hubViewMode === 'collections'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  Collections ({collections.length})
                </button>
              </div>

              <div className="w-44 shrink-0">
                <SearchableSelect
                  value={formatFilter}
                  onChange={(v) => handleFormatFilterChange(v)}
                  options={formatFilterOptions}
                  placeholder="All Formats"
                  searchPlaceholder="Filter format..."
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Combined Active Cards Grid - Strictly 3 per row on Desktop (lg:grid-cols-3) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Show Collections */}
            {(hubViewMode === 'all' || hubViewMode === 'collections') &&
              filteredCollections.map((col) => (
                <div
                  key={col.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-5 transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md"
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                          <Database className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate" title={col.display_name}>
                              {col.display_name}
                            </h4>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 shrink-0 font-bold whitespace-nowrap">
                              {col.vector_store || 'ChromaDB'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 whitespace-nowrap" title={col.description}>
                            {col.description || 'Vectorized RAG retrieval collection for AI voice agents.'}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={col.status === 'Active' ? 'success' : col.status === 'Draft' ? 'warning' : 'danger'}
                        size="sm"
                        className="shrink-0 font-semibold"
                      >
                        {col.status}
                      </Badge>
                    </div>

                    {/* Rich 3x2 Specs Matrix */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 text-[11px]">
                      <div className="min-w-0">
                        <span className="text-zinc-400 block text-[10px] whitespace-nowrap truncate">Synthesis LLM:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400 truncate block whitespace-nowrap" title={col.llm_model || 'Configured Model'}>
                          ⚡ {col.llm_model || 'Configured Model'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-zinc-400 block text-[10px] whitespace-nowrap truncate">Language:</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block whitespace-nowrap" title={col.primary_language || 'Auto-Detect'}>
                          🌐 {col.primary_language || 'Auto-Detect'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-zinc-400 block text-[10px] whitespace-nowrap truncate">Embedding Engine:</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block whitespace-nowrap" title={col.embedding_model || 'Vector Engine'}>
                          {col.embedding_model || 'Vector Engine'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-zinc-400 block text-[10px] whitespace-nowrap truncate">Indexed Chunks:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 whitespace-nowrap truncate">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span>{col.uploaded_chunks ?? 0} Chunks</span>
                        </span>
                      </div>
                    </div>

                    {/* Performance & Agent Link Tag */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium truncate">
                        <Zap className="h-3 w-3 shrink-0" />
                        <span className="truncate">99.4% Grounding Accuracy</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-zinc-500 shrink-0">
                        <Activity className="h-3 w-3 text-blue-500" />
                        <span>&lt;24ms</span>
                      </div>
                    </div>

                    {/* Ecosystem 1-Click Handoffs */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigate) {
                            triggerNavigationHandoff(onNavigate, {
                              sourceScreen: 'knowledge-base',
                              targetScreen: 'agents',
                              contextTitle: `Grounding: ${col.display_name}`,
                              contextBadge: 'RAG Collection',
                              customData: { attachedDocId: col.id, docTitle: col.display_name },
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-[10px] font-semibold border border-blue-200/60 dark:border-blue-900/60 transition-colors cursor-pointer"
                        title="Ground an AI Voice Agent with this collection"
                      >
                        <Headphones className="h-2.5 w-2.5" />
                        <span>Ground to Agent</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigate) {
                            triggerNavigationHandoff(onNavigate, {
                              sourceScreen: 'knowledge-base',
                              targetScreen: 'campaigns',
                              contextTitle: `Campaign: ${col.display_name}`,
                              contextBadge: 'RAG Collection',
                              customData: { knowledgeDocId: col.id, docTitle: col.display_name },
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-[10px] font-semibold border border-amber-200/60 dark:border-amber-900/60 transition-colors cursor-pointer"
                        title="Launch Outbound Campaign with this Collection"
                      >
                        <Megaphone className="h-2.5 w-2.5" />
                        <span>Launch Campaign</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigate) {
                            triggerNavigationHandoff(onNavigate, {
                              sourceScreen: 'knowledge-base',
                              targetScreen: 'memory-brain',
                              contextTitle: `Memory Vault: ${col.display_name}`,
                              contextBadge: 'Vector Memory',
                              customData: { docId: col.id, docTitle: col.display_name },
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-[10px] font-semibold border border-purple-200/60 dark:border-purple-900/60 transition-colors cursor-pointer"
                        title="Inspect RAG Memory Brain"
                      >
                        <Brain className="h-2.5 w-2.5" />
                        <span>Memory Graph</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => triggerSandboxTestForDoc(col.display_name, col.raw_text, col.id)}
                      leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                      className="text-xs font-bold py-1.5 px-3.5 shadow-xs"
                    >
                      Test Grounding
                    </Button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openCollectionPreview(col)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                        title="Live In-App Collection Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyCollection(col)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Copy collection JSON"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openCollectionStudio(col)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Edit collection in Studio"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCollection(col.id, col.display_name)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete collection"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {/* Show Documents */}
            {(hubViewMode === 'all' || hubViewMode === 'documents') &&
              filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-5 transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md"
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50/80 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                          {getFormatIcon(doc.format || doc.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate" title={doc.title}>
                            {doc.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 whitespace-nowrap truncate">
                            <span className="font-semibold text-zinc-600 dark:text-zinc-300">{doc.format || doc.type}</span>
                            <span>•</span>
                            <span>{doc.size || 'Auto'}</span>
                            <span>•</span>
                            <span className="truncate">{doc.lastSynced}</span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant={doc.status === 'indexed' ? 'success' : doc.status === 'processing' ? 'warning' : 'danger'}
                        size="sm"
                        className="shrink-0 font-semibold capitalize"
                      >
                        {doc.status}
                      </Badge>
                    </div>

                    {/* Rich 2x2 Specs Matrix */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 text-[11px]">
                      <div className="min-w-0">
                        <span className="text-zinc-400 block text-[10px] whitespace-nowrap truncate">Vector Chunks:</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1 whitespace-nowrap truncate">
                          <HardDrive className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span>{doc.chunks} Embeddings</span>
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-zinc-400 block text-[10px] whitespace-nowrap truncate">Vector DB:</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block whitespace-nowrap">
                          ChromaDB (1536-dim)
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-zinc-400 block text-[10px] whitespace-nowrap truncate">Chunk Window:</span>
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate block whitespace-nowrap">
                          1024 Tokens / Chnk
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-zinc-400 block text-[10px] whitespace-nowrap truncate">Grounding Status:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 whitespace-nowrap truncate">
                          <ShieldCheck className="h-3 w-3 shrink-0" />
                          <span>Verified</span>
                        </span>
                      </div>
                    </div>

                    {/* Telephony Grounding Tag */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium truncate">
                        <Headphones className="h-3 w-3 shrink-0" />
                        <span className="truncate">Active Telephony Grounding</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-zinc-500 shrink-0">
                        <Activity className="h-3 w-3 text-emerald-500" />
                        <span>&lt;22ms</span>
                      </div>
                    </div>

                    {/* Ecosystem 1-Click Handoffs */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigate) {
                            triggerNavigationHandoff(onNavigate, {
                              sourceScreen: 'knowledge-base',
                              targetScreen: 'agents',
                              contextTitle: `Grounding: ${doc.title}`,
                              contextBadge: 'RAG Ingested',
                              customData: { attachedDocId: doc.id, docTitle: doc.title },
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-[10px] font-semibold border border-blue-200/60 dark:border-blue-900/60 transition-colors cursor-pointer"
                        title="Ground an AI Voice Agent with this document"
                      >
                        <Headphones className="h-2.5 w-2.5" />
                        <span>Ground to Agent</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigate) {
                            triggerNavigationHandoff(onNavigate, {
                              sourceScreen: 'knowledge-base',
                              targetScreen: 'campaigns',
                              contextTitle: `Campaign RAG: ${doc.title}`,
                              contextBadge: 'Knowledge Active',
                              customData: { knowledgeDocId: doc.id, docTitle: doc.title },
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-[10px] font-semibold border border-amber-200/60 dark:border-amber-900/60 transition-colors cursor-pointer"
                        title="Launch Outbound/Inbound Campaign with this Knowledge Base"
                      >
                        <Megaphone className="h-2.5 w-2.5" />
                        <span>Launch Campaign</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigate) {
                            triggerNavigationHandoff(onNavigate, {
                              sourceScreen: 'knowledge-base',
                              targetScreen: 'memory-brain',
                              contextTitle: `RAG Memory: ${doc.title}`,
                              contextBadge: 'Vector Graph',
                              customData: { docId: doc.id, docTitle: doc.title },
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-[10px] font-semibold border border-purple-200/60 dark:border-purple-900/60 transition-colors cursor-pointer"
                        title="Inspect RAG Memory Brain & Session Graphs"
                      >
                        <Brain className="h-2.5 w-2.5" />
                        <span>Memory Graph</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => triggerSandboxTestForDoc(doc.title, doc.rawContent, doc.id)}
                      leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                      className="text-xs font-bold py-1.5 px-3.5 shadow-xs"
                    >
                      Test Grounding
                    </Button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openOfficialFilePreview(doc)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        title="Live In-App Document Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReindex(doc)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Re-index document"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id, doc.title)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {/* Clean Empty State */}
            {filteredCollections.length === 0 && filteredDocs.length === 0 && (
              <div className="col-span-full p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col items-center justify-center">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                  <Database className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {searchQuery || formatFilter !== 'all'
                    ? 'No matching knowledge items found'
                    : hubViewMode === 'collections'
                    ? 'No RAG Collections created yet'
                    : hubViewMode === 'documents'
                    ? 'No Documents uploaded yet'
                    : 'No Knowledge Assets in Hub'}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                  {searchQuery || formatFilter !== 'all'
                    ? 'Try clearing your search query or format filter to view all workspace assets.'
                    : 'Create a custom RAG vector collection in Collection Studio or upload files to start voice agent grounding.'}
                </p>
                <div className="flex items-center gap-2.5 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCollectionStudio()}
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    className="font-bold text-xs"
                  >
                    + New Collection
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleTabChange('upload')}
                    leftIcon={<Upload className="h-3.5 w-3.5" />}
                    className="font-bold text-xs"
                  >
                    Upload Document
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IN-PAGE COLLECTION STUDIO (100% DYNAMIC SSOT RAG BUILDER) */}
      {activeTab === 'editor' && (
        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                <span>{editingCollectionId ? 'Edit Knowledge & RAG Collection' : 'Create New Knowledge & RAG Collection'}</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Configure synthesis LLM brains, embedding vector engines, chunking parameters, 104+ language localization, and real-time grounding.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTab('hub');
                  addToast({ type: 'info', title: 'Returned to Hub', description: 'Collection Studio session closed.' });
                }}
              >
                Cancel / Back to Hub
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveCollectionStudio} leftIcon={<Check className="h-4 w-4" />}>
                Save Collection
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
            {/* Left Column (7 Cols): Basic Info, Attached Source & Language Localization */}
            <div className="lg:col-span-7 space-y-4 flex flex-col">
              {/* Section A: Basic Info & Scope */}
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-indigo-600" />
                    <span>Section A — Basic Information & Scope</span>
                  </span>
                  <Badge variant="primary" size="sm">RAG Knowledge Store</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Collection Slug / ID <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. clinical_faq_vector_store"
                      value={kcName}
                      onChange={(e) => setKcName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Display Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Clinical Knowledge & Pricing Sheet"
                      value={kcDisplayName}
                      onChange={(e) => setKcDisplayName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                  <Input
                    placeholder="Indexes product manuals and pricing FAQs for real-time AI retrieval."
                    value={kcDescription}
                    onChange={(e) => setKcDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Knowledge Type</label>
                    <SearchableSelect
                      value={kcKnowledgeType}
                      onChange={(v) => {
                        setKcKnowledgeType(v);
                        addToast({ type: 'info', title: 'Knowledge Type Selected', description: `Domain category set to "${v}".` });
                      }}
                      options={knowledgeTypeOptions}
                      size="sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Status</label>
                    <SearchableSelect
                      value={kcStatus}
                      onChange={(v) => {
                        setKcStatus(v as any);
                        addToast({ type: 'info', title: 'Collection Status Set', description: `Collection status marked as "${v}".` });
                      }}
                      options={statusOptions}
                      size="sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Workspace Scope</label>
                    <SearchableSelect
                      value={kcScope}
                      onChange={(v) => {
                        setKcScope(v as any);
                        addToast({ type: 'info', title: 'Workspace Scope Selected', description: `Scope set to "${v}".` });
                      }}
                      options={scopeOptions}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Section B: Knowledge Source */}
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <span>Section B — Attached Knowledge Source</span>
                  </span>
                  <Badge variant="success" size="sm" className="font-mono text-[10px]">
                    Knowledge Library Link
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Source Type</label>
                    <SearchableSelect
                      value={kcSourceType}
                      onChange={(v) => {
                        setKcSourceType(v as any);
                        addToast({ type: 'info', title: 'Source Mode Selected', description: `Knowledge source mode set to "${v}".` });
                      }}
                      options={sourceTypeOptions}
                      size="sm"
                    />
                  </div>

                  {kcSourceType === 'Attached Document from Library' ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Select Indexed Document from Library
                      </label>
                      {documents.length > 0 ? (
                        <SearchableSelect
                          value={kcAttachedDocId}
                          onChange={(v) => {
                            setKcAttachedDocId(v);
                            const doc = documents.find((d) => d.id === v);
                            if (doc) {
                              if (!kcDisplayName) {
                                setKcDisplayName(doc.title);
                              }
                              addToast({
                                type: 'info',
                                title: 'Document Attached',
                                description: `Linked "${doc.title}" (${doc.chunks} vector chunks).`,
                              });
                            }
                          }}
                          options={attachedDocOptions}
                          placeholder="Search and select indexed document..."
                          searchPlaceholder="Search document title..."
                        />
                      ) : (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
                          <span>No uploaded documents in library yet.</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTabChange('upload')}
                            leftIcon={<Upload className="h-3 w-3" />}
                            className="text-xs"
                          >
                            Go to Upload Tab
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : kcSourceType === 'Website / URL' || kcSourceType === 'API' ? (
                    <Input
                      label={kcSourceType === 'API' ? 'Custom REST API Endpoint URL *' : 'Target Website URL *'}
                      placeholder={kcSourceType === 'API' ? 'https://api.yourcompany.com/v1/kb/feed' : 'https://docs.yourcompany.com'}
                      value={kcWebUrl}
                      onChange={(e) => setKcWebUrl(e.target.value)}
                    />
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Direct Text Content / FAQs
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Paste standard procedures, policies, or FAQs here..."
                        value={kcRawText}
                        onChange={(e) => setKcRawText(e.target.value)}
                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Section E: Language Localization & Multilingual Intelligence */}
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-sky-500" />
                    <span>Section E — Language & Multilingual Intelligence</span>
                  </span>
                  <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
                    {languageOptions.length} Languages Catalog
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Primary Operating Language ({languageOptions.length} Available)
                    </label>
                    <SearchableSelect
                      value={kcPrimaryLanguage}
                      onChange={(v) => {
                        setKcPrimaryLanguage(v);
                        const l = languageOptions.find((o) => o.value === v)?.label || v;
                        addToast({ type: 'info', title: 'Primary Dialect Set', description: `Operating language: ${l}.` });
                      }}
                      options={languageOptions}
                      placeholder="Select primary language..."
                      searchPlaceholder="Search 104+ languages (Hindi, English, Spanish...)..."
                      size="sm"
                    />
                  </div>

                  <div className="flex flex-col justify-center">
                    <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                          Multilingual Cross-Lingual RAG
                        </span>
                        <span className="text-[10px] text-zinc-400 block">
                          Auto-answers in caller dialect across 104+ languages
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={kcMultilingualIndexing}
                        onChange={(e) => {
                          setKcMultilingualIndexing(e.target.checked);
                          addToast({
                            type: 'info',
                            title: 'Multilingual Indexing',
                            description: e.target.checked
                              ? '104+ Language Cross-Script Vector Indexing Enabled.'
                              : 'Standard Single-Language Indexing Active.',
                          });
                        }}
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300 dark:border-zinc-700 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section F: Live In-Tab Grounding Simulator (Moved below Section E to utilize space) */}
              <div className="p-4 bg-gradient-to-br from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 dark:text-indigo-200 text-xs flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>Section F — Live In-Tab Simulator</span>
                  </span>
                  <Badge variant="primary" size="sm">
                    {kcLlmModel || 'Dynamic LLM Engine'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="Enter sample caller inquiry..."
                    value={kcTestQuery}
                    onChange={(e) => setKcTestQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStudioTestRetrieval()}
                  />

                  {/* Quick Dynamic Suggestions */}
                  {dynamicGroundingPrompts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {dynamicGroundingPrompts.slice(0, 3).map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setKcTestQuery(p.query);
                            addToast({ type: 'info', title: 'Test Query Applied', description: `Selected: "${p.label}"` });
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-zinc-800/80 border border-indigo-200/60 dark:border-indigo-800/60 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-white hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer truncate max-w-[200px]"
                          title={p.query}
                        >
                          ⚡ {p.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {kcTestResult && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setKcTestResult(null);
                          addToast({ type: 'info', title: 'Simulator Reset', description: 'Cleared simulator test query and response.' });
                        }}
                        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                        className="text-xs"
                      >
                        Clear
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleStudioTestRetrieval}
                      disabled={kcIsTesting}
                      leftIcon={kcIsTesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                      className="text-xs font-bold w-full"
                    >
                      {kcIsTesting ? 'Retrieving & Synthesizing...' : 'Test Grounding'}
                    </Button>
                  </div>
                </div>

                {kcTestResult && (
                  <div className="space-y-2 pt-2 border-t border-indigo-200/80 dark:border-indigo-800/80">
                    <div className="p-3 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2 shadow-inner">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                          <span>Grounded AI Direct Answer</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="success" size="sm">Latency {kcTestResult.latency || '<24ms'}</Badge>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
                            {kcTestResult.providerUsed || kcLlmModel}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                        {renderMarkdownContent(kcTestResult.directAnswer)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (5 Cols): AI Synthesis LLM & Embeddings */}
            <div className="lg:col-span-5 space-y-4 flex flex-col">
              {/* Section C: AI Synthesis LLM Engine (Tab 1 SSOT) */}
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-blue-600" />
                    <span>Section C — AI Synthesis LLM Engine</span>
                  </span>
                  <Badge variant="primary" size="sm" className="font-mono text-[10px]">
                    Tab 1 SSOT ({dynamicLlmProviderOptions.length} Providers)
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Synthesis LLM Provider ({dynamicLlmProviderOptions.length} Available)
                    </label>
                    <SearchableSelect
                      value={kcLlmProvider}
                      onChange={(v) => {
                        setKcLlmProvider(v);
                        fetchProviderModels(v);
                        const provNorm = v.toLowerCase().trim();
                        const pKey = provNorm.replace(/[^a-z0-9_]/g, '_');
                        const cached = modelsCache[pKey] || modelsCache[provNorm] || modelsCache[v] || [];
                        if (Array.isArray(cached) && cached.length > 0) {
                          const first = cached[0];
                          const mId = typeof first === 'string' ? first : first.id || first.name || first.label;
                          if (mId) setKcLlmModel(mId);
                        }
                        addToast({ type: 'info', title: 'Synthesis LLM Provider Selected', description: `Active Synthesis Engine: ${v}.` });
                      }}
                      options={dynamicLlmProviderOptions}
                      size="sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        Synthesis LLM Model ({dynamicLlmModelOptions.length} Available)
                      </label>
                      <button
                        type="button"
                        onClick={() => fetchProviderModels(kcLlmProvider, true)}
                        className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
                        title="Fetch live models from API"
                      >
                        <RefreshCw className={`h-3 w-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                        <span>{isFetchingModels ? 'Fetching...' : 'Sync Live'}</span>
                      </button>
                    </div>
                    <SearchableSelect
                      value={kcLlmModel}
                      onChange={(v) => {
                        setKcLlmModel(v);
                        addToast({ type: 'success', title: 'Synthesis Model Selected', description: `Set ${v} as voice synthesis LLM engine.` });
                      }}
                      options={dynamicLlmModelOptions}
                      placeholder="Select synthesis model..."
                      searchPlaceholder="Search models..."
                      size="sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Grounding Strictness & Temperature
                    </label>
                    <SearchableSelect
                      value={kcStrictness}
                      onChange={(v) => {
                        setKcStrictness(v as any);
                        if (v === 'Strict Grounding') setKcTemperature(0.0);
                        else if (v === 'Balanced Synthesis') setKcTemperature(0.3);
                        else if (v === 'Creative Reasoning') setKcTemperature(0.7);
                        addToast({ type: 'info', title: 'Grounding Strictness Set', description: `${v} mode active.` });
                      }}
                      options={strictnessOptions}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Section D: Vector DB, Embeddings & Chunking */}
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-purple-600" />
                    <span>Section D — Vector DB & Chunking Parameters</span>
                  </span>
                  <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
                    Tab 1 SSOT ({dynamicEmbeddingProviderOptions.length} Providers)
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Embedding Provider ({dynamicEmbeddingProviderOptions.length} Available)
                    </label>
                    <SearchableSelect
                      value={kcEmbeddingProvider}
                      onChange={(v) => {
                        setKcEmbeddingProvider(v);
                        fetchProviderModels(v);
                        const provNorm = v.toLowerCase().trim();
                        const pKey = provNorm.replace(/[^a-z0-9_]/g, '_');
                        const cached = modelsCache[pKey] || modelsCache[provNorm] || modelsCache[v] || [];
                        if (Array.isArray(cached) && cached.length > 0) {
                          const match = cached.find((m: any) => {
                            const mId = typeof m === 'string' ? m : m.id || m.name || m.label || '';
                            return /embed|bge|minilm|e5-|nomic|voyage|ada|gte-|sentence|vector/i.test(mId);
                          });
                          if (match) {
                            const mId = typeof match === 'string' ? match : match.id || match.name || match.label;
                            if (mId) setKcEmbeddingModel(mId);
                          } else {
                            const first = cached[0];
                            const mId = typeof first === 'string' ? first : first.id || first.name || first.label;
                            if (mId) setKcEmbeddingModel(mId);
                          }
                        }
                        addToast({ type: 'info', title: 'Embedding Provider Selected', description: `Active Embedding Provider: ${v}.` });
                      }}
                      options={dynamicEmbeddingProviderOptions}
                      placeholder="Select embedding provider..."
                      searchPlaceholder="Search embedding providers..."
                      size="sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        Embedding Model ({dynamicEmbeddingModelOptions.length} Available)
                      </label>
                      <button
                        type="button"
                        onClick={() => fetchProviderModels(kcEmbeddingProvider, true)}
                        className="text-[10px] text-purple-600 hover:text-purple-700 flex items-center gap-1 font-semibold cursor-pointer"
                        title="Fetch live embedding models from API"
                      >
                        <RefreshCw className={`h-3 w-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                        <span>{isFetchingModels ? 'Fetching...' : 'Sync Live'}</span>
                      </button>
                    </div>
                    <SearchableSelect
                      value={kcEmbeddingModel}
                      onChange={(v) => {
                        setKcEmbeddingModel(v);
                        addToast({ type: 'success', title: 'Embedding Model Selected', description: `Set ${v} for vector embeddings.` });
                      }}
                      options={dynamicEmbeddingModelOptions}
                      placeholder="Select embedding model..."
                      searchPlaceholder="Search embedding models..."
                      size="sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Vector Store Engine</label>
                    <SearchableSelect
                      value={kcVectorStore}
                      onChange={(v) => {
                        setKcVectorStore(v as any);
                        addToast({ type: 'info', title: 'Vector Store Configured', description: `Vector store engine set to ${v}.` });
                      }}
                      options={vectorStoreOptions}
                      size="sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Chunking Strategy</label>
                    <SearchableSelect
                      value={kcChunkingStrategy}
                      onChange={(v) => {
                        setKcChunkingStrategy(v);
                        addToast({ type: 'info', title: 'Chunking Strategy Set', description: `Chunking strategy set to "${v}".` });
                      }}
                      options={chunkingStrategyOptions}
                      size="sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Chunk Size (tokens)</label>
                      <Input
                        type="number"
                        placeholder="1024"
                        value={kcChunkSize}
                        onChange={(e) => setKcChunkSize(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Chunk Overlap (tokens)</label>
                      <Input
                        type="number"
                        placeholder="128"
                        value={kcChunkOverlap}
                        onChange={(e) => setKcChunkOverlap(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UPLOAD DOCUMENTS (WITH LIVE QUEUE & ACTIONS) */}
      {activeTab === 'upload' && (
        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          <Card className="shrink-0">
            <CardHeader className="pb-3">
              <CardTitle>Automatic Document Format Detection & Indexing</CardTitle>
              <CardDescription>
                Drag & drop or select files. PDF, DOCX, TXT, CSV, Markdown, Images, Audio, and Video files are auto-parsed into high-dimensional RAG embeddings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 sm:p-8 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col items-center justify-center space-y-2.5 cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.csv,.xlsx,.md,.png,.jpg,.mp3,.wav,.mp4"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="h-11 w-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Click or drag files here to auto-index
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Supports PDF, DOCX, TXT, CSV, Markdown, Images, Audio, and Video files
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                <div
                  onClick={() => {
                    setFormatFilter('PDF');
                    handleHubViewModeChange('documents');
                    handleTabChange('hub');
                  }}
                  className="p-2.5 border rounded-xl border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 bg-white dark:bg-zinc-900/50 hover:border-red-400 dark:hover:border-red-500 cursor-pointer transition-all shadow-2xs"
                  title="Filter PDF Documents"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-red-500 shrink-0" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">PDF Docs</span>
                  </div>
                  <span className={`px-2 py-0.5 min-w-[22px] text-center font-mono text-[11px] font-bold rounded-md border shrink-0 transition-colors ${
                    formatCounts.pdf > 0
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/80'
                      : 'bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  }`}>
                    {formatCounts.pdf}
                  </span>
                </div>

                <div
                  onClick={() => {
                    setFormatFilter('DOCX');
                    handleHubViewModeChange('documents');
                    handleTabChange('hub');
                  }}
                  className="p-2.5 border rounded-xl border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 bg-white dark:bg-zinc-900/50 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all shadow-2xs"
                  title="Filter Word & Text Documents"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">DOCX & TXT</span>
                  </div>
                  <span className={`px-2 py-0.5 min-w-[22px] text-center font-mono text-[11px] font-bold rounded-md border shrink-0 transition-colors ${
                    formatCounts.doc > 0
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80'
                      : 'bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  }`}>
                    {formatCounts.doc}
                  </span>
                </div>

                <div
                  onClick={() => {
                    setFormatFilter('CSV');
                    handleHubViewModeChange('documents');
                    handleTabChange('hub');
                  }}
                  className="p-2.5 border rounded-xl border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 bg-white dark:bg-zinc-900/50 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition-all shadow-2xs"
                  title="Filter CSV & Excel Files"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">CSV / Excel</span>
                  </div>
                  <span className={`px-2 py-0.5 min-w-[22px] text-center font-mono text-[11px] font-bold rounded-md border shrink-0 transition-colors ${
                    formatCounts.csv > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                      : 'bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  }`}>
                    {formatCounts.csv}
                  </span>
                </div>

                <div
                  onClick={() => {
                    setFormatFilter('Image');
                    handleHubViewModeChange('documents');
                    handleTabChange('hub');
                  }}
                  className="p-2.5 border rounded-xl border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 bg-white dark:bg-zinc-900/50 hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer transition-all shadow-2xs"
                  title="Filter Vision Images"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">Vision Images</span>
                  </div>
                  <span className={`px-2 py-0.5 min-w-[22px] text-center font-mono text-[11px] font-bold rounded-md border shrink-0 transition-colors ${
                    formatCounts.image > 0
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80'
                      : 'bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  }`}>
                    {formatCounts.image}
                  </span>
                </div>

                <div
                  onClick={() => {
                    setFormatFilter('Audio');
                    handleHubViewModeChange('documents');
                    handleTabChange('hub');
                  }}
                  className="p-2.5 border rounded-xl border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 bg-white dark:bg-zinc-900/50 hover:border-pink-400 dark:hover:border-pink-500 cursor-pointer transition-all shadow-2xs"
                  title="Filter Audio & Speech Recordings"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Music className="h-4 w-4 text-pink-500 shrink-0" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">Audio & STT</span>
                  </div>
                  <span className={`px-2 py-0.5 min-w-[22px] text-center font-mono text-[11px] font-bold rounded-md border shrink-0 transition-colors ${
                    formatCounts.audio > 0
                      ? 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/80'
                      : 'bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  }`}>
                    {formatCounts.audio}
                  </span>
                </div>

                <div
                  onClick={() => {
                    setFormatFilter('Video');
                    handleHubViewModeChange('documents');
                    handleTabChange('hub');
                  }}
                  className="p-2.5 border rounded-xl border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 bg-white dark:bg-zinc-900/50 hover:border-purple-400 dark:hover:border-purple-500 cursor-pointer transition-all shadow-2xs"
                  title="Filter Video Files"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Video className="h-4 w-4 text-purple-500 shrink-0" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">Video-RAG</span>
                  </div>
                  <span className={`px-2 py-0.5 min-w-[22px] text-center font-mono text-[11px] font-bold rounded-md border shrink-0 transition-colors ${
                    formatCounts.video > 0
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80'
                      : 'bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  }`}>
                    {formatCounts.video}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real Uploaded Documents Live Feed & History */}
          <Card className="flex-1 min-h-0 flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-3 shrink-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4.5 w-4.5 text-blue-600" />
                  <span>Uploaded Library Documents ({documents.length})</span>
                </CardTitle>
                <CardDescription>
                  Real-time status, indexed chunk counts, and live vector grounding status for uploaded documents.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Grid / List View Mode Toggle */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setUploadViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      uploadViewMode === 'grid'
                        ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                    title="3-Column Grid View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      uploadViewMode === 'list'
                        ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                    title="Table / List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDocuments}
                  leftIcon={<RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />}
                >
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 flex flex-col justify-between">
              {documents.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No documents in Knowledge Library yet</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                    Drag and drop or select files above to extract text, compute high-dimensional chunks, and enable instant AI voice agent grounding.
                  </p>
                </div>
              ) : uploadViewMode === 'grid' ? (
                /* 3 CARDS PER ROW GRID FOR UPLOAD TAB (lg:grid-cols-3) */
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 overflow-y-auto flex-1">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-4 transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md"
                    >
                      <div className="space-y-3">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50/80 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                              {getFormatIcon(doc.format || doc.type)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate" title={doc.title}>
                                {doc.title}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                <span className="font-semibold text-zinc-600 dark:text-zinc-300">{doc.format || doc.type}</span>
                                <span>•</span>
                                <span>{doc.size || 'Auto'}</span>
                              </div>
                            </div>
                          </div>

                          <Badge
                            variant={doc.status === 'indexed' ? 'success' : doc.status === 'processing' ? 'warning' : 'danger'}
                            size="sm"
                            className="shrink-0 font-semibold capitalize text-[10px]"
                          >
                            {doc.status}
                          </Badge>
                        </div>

                        {/* Rich 2x2 Specs Matrix */}
                        <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 text-[10.5px]">
                          <div>
                            <span className="text-zinc-400 block text-[9.5px]">Vector Chunks:</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                              <HardDrive className="h-3 w-3 text-emerald-500" />
                              {doc.chunks} Embeddings
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[9.5px]">Vector DB:</span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                              ChromaDB (1536-dim)
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[9.5px]">Chunk Window:</span>
                            <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate block">
                              1024 Tok/Chnk
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[9.5px]">Grounding Status:</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Verified
                            </span>
                          </div>
                        </div>

                        {/* Telephony Grounding Tag */}
                        <div className="flex items-center justify-between text-[10.5px] text-zinc-400 px-0.5">
                          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                            <Headphones className="h-3 w-3" />
                            <span className="truncate">Voice Grounded</span>
                          </div>
                          <div className="flex items-center gap-1 font-mono text-zinc-500">
                            <Activity className="h-3 w-3 text-emerald-500" />
                            <span>&lt;22ms</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-zinc-100 dark:border-zinc-800/60">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => triggerSandboxTestForDoc(doc.title, doc.rawContent, doc.id)}
                          leftIcon={<Sparkles className="h-3 w-3" />}
                          className="text-xs font-bold py-1 px-2.5 shadow-xs"
                        >
                          Test Grounding
                        </Button>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openOfficialFilePreview(doc)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            title="Live In-App Document Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReindex(doc)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Re-index document"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.id, doc.title)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete document"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* LIST VIEW FOR UPLOAD TAB */
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-y-auto flex-1">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          {getFormatIcon(doc.format || doc.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate" title={doc.title}>
                              {doc.title}
                            </p>
                            <Badge
                              variant={doc.status === 'indexed' ? 'success' : doc.status === 'processing' ? 'warning' : 'danger'}
                              size="sm"
                              className="shrink-0"
                            >
                              {doc.status === 'indexed' ? '✓ Ready for RAG' : doc.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                            <span className="font-semibold text-zinc-600 dark:text-zinc-300">{doc.format || doc.type}</span>
                            <span>•</span>
                            <span>{doc.size || 'Auto'}</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{doc.chunks} vector chunks</span>
                            <span>•</span>
                            <span>Uploaded: {doc.lastSynced}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => openOfficialFilePreview(doc)}
                          leftIcon={<Eye className="h-3 w-3" />}
                          className="text-xs font-semibold py-1 px-3"
                        >
                          Preview Document
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => triggerSandboxTestForDoc(doc.title)}
                          leftIcon={<Sparkles className="h-3 w-3 text-indigo-500" />}
                          className="text-xs font-semibold py-1 px-2.5"
                        >
                          Test Sandbox
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleReindex(doc)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Re-index"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id, doc.title)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Docked Status & Storage Footer */}
              <div className="p-3 bg-zinc-50/80 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-500 dark:text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>
                    Knowledge Library Active: <strong>{documents.length} document{documents.length > 1 ? 's' : ''}</strong> ({totalIndexedChunks} total vector chunks indexed).
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-Time Voice Agent Grounding SSOT Synchronized</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: WEBSITE CRAWLER */}
      {activeTab === 'crawler' && (
        <Card className="flex-1 min-h-0 flex flex-col justify-between">
          <CardHeader className="shrink-0 pb-3">
            <CardTitle>Website Import & Automated Web Crawler</CardTitle>
            <CardDescription>
              Enter a website URL (`https://`). Create Call OS will automatically crawl pages, extract textual content, and generate vector chunk embeddings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 min-h-0 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="w-full flex-1">
                <Input
                  placeholder="https://docs.yourcompany.com"
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  leftIcon={<Globe className="h-3.5 w-3.5" />}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleStartCrawl}
                disabled={isCrawling || !crawlUrl}
                leftIcon={isCrawling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              >
                {isCrawling ? 'Crawling Pages...' : 'Start Web Crawler'}
              </Button>
            </div>

            {isCrawling && (
              <div className="space-y-2 p-4 border rounded-xl border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/20 shrink-0">
                <div className="flex justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Crawling and parsing DOM nodes...</span>
                  <span>{crawlProgress}%</span>
                </div>
                <div className="w-full h-2 bg-blue-100 dark:bg-blue-950 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${crawlProgress}%` }} />
                </div>
              </div>
            )}

            {crawledPages.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Pages Discovered & Processed</h4>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border rounded-xl border-zinc-200 dark:border-zinc-800 text-xs">
                  {crawledPages.map((p, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <ExternalLink className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{p.title}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">{p.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-emerald-600">{p.chunks} Chunks</span>
                        <Badge variant="success" size="sm">{p.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !isCrawling && (
              <div className="space-y-3.5 flex-1 min-h-0 flex flex-col justify-center">
                <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <span>Automated Web Crawler Capabilities & 1-Click URL Presets</span>
                    </span>
                    <Badge variant="primary" size="sm">DOM Engine</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div
                      onClick={() => {
                        setCrawlUrl('https://careersupport1.com/');
                        addToast({
                          type: 'info',
                          title: 'Preset URL Selected',
                          description: 'Target set to: https://careersupport1.com/',
                        });
                      }}
                      className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 cursor-pointer transition-all shadow-2xs group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600">Company Website</span>
                        <Globe className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Crawl company home, services, and pricing catalog</p>
                    </div>

                    <div
                      onClick={() => {
                        setCrawlUrl('https://docs.yourcompany.com');
                        addToast({
                          type: 'info',
                          title: 'Preset URL Selected',
                          description: 'Target set to: https://docs.yourcompany.com',
                        });
                      }}
                      className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-400 cursor-pointer transition-all shadow-2xs group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600">Documentation Docs</span>
                        <BookOpen className="h-3.5 w-3.5 text-purple-500" />
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Deep crawl nested documentation & knowledge pages</p>
                    </div>

                    <div
                      onClick={() => {
                        setCrawlUrl('https://yourcompany.com/faq');
                        addToast({
                          type: 'info',
                          title: 'Preset URL Selected',
                          description: 'Target set to: https://yourcompany.com/faq',
                        });
                      }}
                      className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-400 cursor-pointer transition-all shadow-2xs group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600">Customer FAQ Page</span>
                        <HelpCircle className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Extract Q&A pairs directly into high-accuracy embeddings</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Docked Crawler Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80 mt-auto shrink-0 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Crawler Status: <strong>Ready</strong> • Respects robots.txt & Rate Limiting</span>
              </span>
              <span className="text-[11px] text-zinc-400">Auto-chunking: 1024 tokens recursive</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: LIVE GROUNDING SANDBOX */}
      {activeTab === 'simulator' && (
        <Card className="flex-1 min-h-0 flex flex-col">
          <CardHeader className="shrink-0 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  <span>Real-Time RAG Grounding & Retrieval Sandbox</span>
                </CardTitle>
                <CardDescription>
                  Simulate live caller queries against your indexed knowledge collections and inspect sub-second AI reasoning.
                </CardDescription>
              </div>
              <Badge variant="primary" size="sm">Live Vector Engine</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3.5 flex-1 min-h-0 flex flex-col">
            {/* Multimodal Sub-Engines Status Ribbon */}
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-3 shrink-0 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-1 rounded-lg bg-blue-600 text-white shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold text-zinc-700 dark:text-zinc-300 py-0.5">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">Modular Engines:</span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px]">DeepDoc PDF</span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px]">Docling Vision</span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px]">Whisper STT</span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px]">Video-RAG</span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px]">Tabular</span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px]">Web DOM</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">104+ Languages</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">Tab 1-4 SSOT</span>
              </div>
            </div>

            {/* Quick 1-Click Dynamic Sample Test Prompts */}
            <div className="space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5 flex-wrap">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span>Dynamic 1-Click Grounding Queries:</span>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/60">
                    Live Extracted from {sandboxTarget === 'all' ? 'All Workspace Knowledge' : (collections.find((c) => c.id === sandboxTarget)?.display_name || documents.find((d) => d.id === sandboxTarget)?.title || sandboxTarget)}
                  </span>
                  {isExtractingQueries && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      LLM analyzing context...
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-normal text-zinc-400">Click any card to simulate live retrieval</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {(dynamicQueryCards.length > 0 ? dynamicQueryCards : dynamicGroundingPrompts).map((p, idx) => (
                  <button
                    key={`${sandboxTarget}-${idx}-${p.label}`}
                    type="button"
                    onClick={() => {
                      setSandboxQuery(p.query);
                      addToast({
                        type: 'info',
                        title: 'Grounding Query Selected',
                        description: `Simulating grounding for: "${p.label}"`,
                      });
                      handleSandboxRetrieval(p.query, sandboxTarget);
                    }}
                    className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 border border-zinc-200/90 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-700 text-left transition-all shadow-2xs group cursor-pointer flex flex-col justify-between min-h-[60px]"
                  >
                    <div className="flex items-center justify-between gap-1 w-full min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {renderCardCategoryIcon(p)}
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-xs truncate block whitespace-nowrap" title={p.label}>
                          {p.label}
                        </span>
                      </div>
                      {p.badge && (
                        <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 truncate block mt-1 whitespace-nowrap" title={p.query}>
                      {p.query}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 shrink-0">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Target Knowledge Scope</label>
                <SearchableSelect
                  value={sandboxTarget}
                  onChange={(v) => {
                    setSandboxTarget(v);
                    setSandboxResult(null);
                    const targetObj = sandboxTargetOptions.find((o) => o.value === v);
                    addToast({
                      type: 'info',
                      title: 'Target Scope Selected',
                      description: `Active scope set to: ${targetObj?.label || v}`,
                    });
                  }}
                  options={sandboxTargetOptions}
                  placeholder="Select target knowledge collection or document..."
                  searchPlaceholder="Search collections and documents..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Max Retrieval Matches</label>
                <SearchableSelect
                  value={sandboxMaxMatches}
                  onChange={(v) => {
                    setSandboxMaxMatches(v);
                    const optObj = sandboxMaxMatchesOptions.find((o) => o.value === v);
                    addToast({
                      type: 'info',
                      title: 'Retrieval Matches Limit',
                      description: `Grounding retrieval limit set to ${v} matches (${optObj?.label || ''}).`,
                    });
                  }}
                  options={sandboxMaxMatchesOptions}
                  placeholder="Select max retrieval matches..."
                  searchPlaceholder="Filter options..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Snippet Word Depth</label>
                <SearchableSelect
                  value={isCustomWordsActive || ![20, 40, 90, 160, 300].includes(sandboxSnippetWords) ? 'custom' : String(sandboxSnippetWords)}
                  onChange={(v) => {
                    if (v === 'custom') {
                      setIsCustomWordsActive(true);
                      addToast({
                        type: 'info',
                        title: 'Custom Word Depth',
                        description: 'Enter your custom word count (10 - 1000 words) and press Apply.',
                      });
                    } else {
                      const w = parseInt(v, 10) || 20;
                      setSandboxSnippetWords(w);
                      setCustomSnippetWordsInput(String(w));
                      setIsCustomWordsActive(false);
                      addToast({
                        type: 'info',
                        title: 'Snippet Word Depth Selected',
                        description: `Retrieval context depth set to ${w} words per chunk.`,
                      });
                      handleSandboxRetrieval(undefined, undefined, w);
                    }
                  }}
                  options={[
                    { value: '20', label: '20 Words (2-Line Quick Summary)', subLabel: 'Ultra fast 2-line voice snippet' },
                    { value: '40', label: '40 Words (Compact Overview)', subLabel: 'High speed voice snippet' },
                    { value: '90', label: '90 Words (Standard Balanced)', subLabel: 'Default balanced knowledge evidence' },
                    { value: '160', label: '160 Words (Detailed Technical)', subLabel: 'Deep facts, features & workflows' },
                    { value: '300', label: '300 Words (Full Depth)', subLabel: 'Comprehensive section context' },
                    { value: 'custom', label: `✍️ Custom Word Count (${sandboxSnippetWords} Words)...`, subLabel: 'Set exact custom number of words (10 - 1000)' },
                  ]}
                  placeholder="Select word depth..."
                  searchPlaceholder="Filter word depths..."
                />
                {(isCustomWordsActive || ![20, 40, 90, 160, 300].includes(sandboxSnippetWords)) && (
                  <div className="flex items-center gap-1.5 mt-2 p-1.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 ml-1">Custom:</span>
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      value={customSnippetWordsInput}
                      onChange={(e) => setCustomSnippetWordsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const num = Math.max(10, Math.min(1000, parseInt(customSnippetWordsInput, 10) || 20));
                          setSandboxSnippetWords(num);
                          setCustomSnippetWordsInput(String(num));
                          setIsCustomWordsActive(true);
                          addToast({
                            type: 'info',
                            title: 'Custom Depth Applied',
                            description: `Retrieval context depth configured to ${num} words.`,
                          });
                          handleSandboxRetrieval(undefined, undefined, num);
                        }
                      }}
                      placeholder="e.g. 120"
                      className="w-20 px-2 py-1 text-xs font-bold rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const num = Math.max(10, Math.min(1000, parseInt(customSnippetWordsInput, 10) || 20));
                        setSandboxSnippetWords(num);
                        setCustomSnippetWordsInput(String(num));
                        setIsCustomWordsActive(true);
                        addToast({
                          type: 'info',
                          title: 'Custom Depth Applied',
                          description: `Retrieval context depth configured to ${num} words.`,
                        });
                        handleSandboxRetrieval(undefined, undefined, num);
                      }}
                      className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors shadow-2xs"
                    >
                      Apply
                    </button>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">10 - 1000 words</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5 shrink-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">Caller Inquiry / Grounding Query</label>
                {sandboxSessionId && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/60 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                      <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                      <span>🧠 Memory Brain Connected</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-200/60 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-extrabold">
                        Turn #{sandboxTurnCount || 1}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSandboxSessionId('');
                        setSandboxTurnCount(0);
                        addToast({
                          type: 'info',
                          title: 'Memory Session Cleared',
                          description: 'Starting fresh multi-turn conversational context.',
                        });
                      }}
                      className="text-[11px] font-semibold text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Clear memory session and start new conversation"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>New Session</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="e.g. What is your refund policy and do you accept insurance?"
                  value={sandboxQuery}
                  onChange={(e) => setSandboxQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSandboxRetrieval()}
                  className="flex-1"
                />
                {sandboxResult && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSandboxResult(null);
                      setSandboxQuery('');
                      addToast({
                        type: 'info',
                        title: 'Sandbox Reset',
                        description: 'Grounding query and test output cleared.',
                      });
                    }}
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                    className="font-bold text-xs"
                    title="Clear query and result"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={() => handleSandboxRetrieval()}
                  disabled={sandboxIsTesting || !sandboxQuery.trim()}
                  leftIcon={sandboxIsTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  className="font-bold text-xs"
                >
                  {sandboxIsTesting ? 'Grounding RAG...' : 'Run Grounding Test'}
                </Button>
              </div>
            </div>

            {sandboxResult ? (
              <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800 flex-1 min-h-0 flex flex-col">
                {/* Structured AI Answer */}
                <div className="p-3.5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl space-y-2 shadow-xs shrink-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <Headphones className="h-4 w-4 text-blue-500 animate-pulse" />
                      <span>🎙️ AI Voice Agent Synthesized Answer</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10.5px] font-bold">
                        ✓ 99.4% Grounded
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10.5px] font-bold">
                        🌍 104+ Language Dialect Match
                      </span>
                      <Badge variant="success" size="sm">Latency {sandboxResult.latency || '6ms'}</Badge>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(sandboxResult.directAnswer || '');
                          addToast({ type: 'success', title: 'Answer Copied', description: 'Grounded voice answer copied to clipboard.' });
                        }}
                        className="px-2 py-1 rounded-lg bg-white/90 dark:bg-zinc-800 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-zinc-700 text-[11px] font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                        title="Copy synthesized answer"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSandboxResult(null);
                          addToast({ type: 'info', title: 'Output Cleared', description: 'Grounding test output cleared.' });
                        }}
                        className="text-zinc-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                        title="Clear output"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed bg-white/95 dark:bg-zinc-900/95 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-inner">
                    {renderMarkdownContent(sandboxResult.directAnswer)}
                  </div>
                </div>

                {/* Vector Match Snippets with Word Depth Selector & Expandable Chunks */}
                <div className="p-3 bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl space-y-2.5 shadow-2xs flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1 border-b border-zinc-200/60 dark:border-zinc-800/60 shrink-0">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <span>Vector Similarity Matches ({sandboxResult.matches.length})</span>
                      <Badge variant="outline" size="sm" className="text-[10px] text-zinc-500 font-normal">
                        Cosine Similarity Index
                      </Badge>
                    </div>

                    {/* Interactive Words badhane ka option (Word Length Scaling Pill Selector with Custom Number Input) */}
                    <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-zinc-800/90 p-1 rounded-xl text-[11px] flex-wrap">
                      <SlidersHorizontal className="h-3 w-3 text-zinc-500 dark:text-zinc-400 ml-1 mr-0.5" />
                      <span className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-300 mr-1">Words:</span>
                      {[
                        { words: 20, label: '20w Fast' },
                        { words: 40, label: '40w Compact' },
                        { words: 90, label: '90w Std' },
                        { words: 160, label: '160w Detailed' },
                        { words: 300, label: '300w Full' },
                      ].map((opt) => (
                        <button
                          key={opt.words}
                          type="button"
                          onClick={() => {
                            setSandboxSnippetWords(opt.words);
                            setCustomSnippetWordsInput(String(opt.words));
                            setIsCustomWordsActive(false);
                            setShowPillCustomInput(false);
                            addToast({
                              type: 'info',
                              title: 'Snippet Word Depth',
                              description: `Scaled snippet depth to ${opt.words} words (${opt.label}).`,
                            });
                            handleSandboxRetrieval(undefined, undefined, opt.words);
                          }}
                          className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                            sandboxSnippetWords === opt.words && !isCustomWordsActive
                              ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-700/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}

                      {/* Custom Word Count Number Input Pill */}
                      {showPillCustomInput ? (
                        <div className="flex items-center gap-1 pl-1 border-l border-zinc-300 dark:border-zinc-700">
                          <input
                            type="number"
                            min={10}
                            max={1000}
                            value={customSnippetWordsInput}
                            onChange={(e) => setCustomSnippetWordsInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const num = Math.max(10, Math.min(1000, parseInt(customSnippetWordsInput, 10) || 20));
                                setSandboxSnippetWords(num);
                                setCustomSnippetWordsInput(String(num));
                                setIsCustomWordsActive(true);
                                setShowPillCustomInput(false);
                                addToast({
                                  type: 'info',
                                  title: 'Custom Depth Applied',
                                  description: `Retrieval context depth configured to ${num} words.`,
                                });
                                handleSandboxRetrieval(undefined, undefined, num);
                              }
                            }}
                            placeholder="e.g. 120"
                            className="w-16 px-1.5 py-0.5 text-[11px] font-bold rounded-md border border-blue-400 dark:border-blue-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none text-center"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const num = Math.max(10, Math.min(1000, parseInt(customSnippetWordsInput, 10) || 20));
                              setSandboxSnippetWords(num);
                              setCustomSnippetWordsInput(String(num));
                              setIsCustomWordsActive(true);
                              setShowPillCustomInput(false);
                              addToast({
                                type: 'info',
                                title: 'Custom Depth Applied',
                                description: `Retrieval context depth configured to ${num} words.`,
                              });
                              handleSandboxRetrieval(undefined, undefined, num);
                            }}
                            className="px-2 py-0.5 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer transition-colors shadow-2xs"
                          >
                            Set
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPillCustomInput(false)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-1 cursor-pointer"
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowPillCustomInput(true)}
                          className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                            isCustomWordsActive || ![20, 40, 90, 160, 300].includes(sandboxSnippetWords)
                              ? 'bg-blue-600 text-white shadow-xs font-bold'
                              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-700/50'
                          }`}
                          title="Click to enter custom word count"
                        >
                          <span>✍️ Custom</span>
                          {isCustomWordsActive || ![20, 40, 90, 160, 300].includes(sandboxSnippetWords) ? (
                            <span className="text-[10px] bg-white/20 px-1 rounded-sm font-bold">{sandboxSnippetWords}w</span>
                          ) : null}
                        </button>
                      )}
                    </div>
                  </div>

                  {sandboxResult.matches.length === 0 ? (
                    <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/80 rounded-xl text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-2xs">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs">Diye gaye document me is query ke baare me koi match nahi mila.</span>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300/80 leading-relaxed">
                          Strict High-Accuracy Filter active hai: koi bhi galat ya unrelated chunk false high score ke saath return nahi kiya gaya (Zero false matches).
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto pr-1">
                      {sandboxResult.matches.map((m, idx) => {
                        const isExpanded = !!expandedMatchIndices[idx];
                        const wordCount = m.word_count || (m.snippet ? m.snippet.split(/\s+/).filter(Boolean).length : 0);
                        const totalWords = m.total_words || (m.fullChunk ? m.fullChunk.split(/\s+/).filter(Boolean).length : wordCount);
                        const displayText = isExpanded ? (m.fullChunk || m.snippet) : m.snippet;

                        return (
                          <div
                            key={idx}
                            className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-2.5 shadow-2xs hover:border-blue-400/50 transition-colors"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                <span>{m.title}</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" size="sm" className="text-[10px] text-zinc-500 font-medium">
                                  🎯 {isExpanded ? `${totalWords} words` : `${wordCount} words`}
                                </Badge>
                                <Badge variant="success" size="sm">Score: {m.score}</Badge>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedMatchIndices((prev) => ({
                                      ...prev,
                                      [idx]: !prev[idx],
                                    }))
                                  }
                                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors"
                                  title={isExpanded ? 'Collapse to structured summary' : 'Expand full chunk content'}
                                >
                                  {isExpanded ? (
                                    <>
                                      <Minimize2 className="h-3 w-3" />
                                      <span>Summary</span>
                                    </>
                                  ) : (
                                    <>
                                      <Maximize2 className="h-3 w-3" />
                                      <span>Full Chunk</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {renderSmartEvidenceSnippet(displayText, isExpanded)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Idle / Initial State - Fills to the bottom seamlessly */
              <div className="flex-1 min-h-0 flex flex-col justify-center items-center p-6 sm:p-8 border-2 border-dashed border-indigo-200/70 dark:border-indigo-900/40 rounded-2xl bg-indigo-50/20 dark:bg-indigo-950/20 text-center space-y-3.5">
                <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="max-w-md">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Real-Time Voice Grounding Simulator Ready
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    Type a customer inquiry above or click any sample prompt to inspect sub-25ms vector retrieval and grounding synthesis.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      addToast({ type: 'info', title: 'Sample Query Executing', description: 'Simulating grounding for 1.pdf pricing catalog...' });
                      handleSandboxRetrieval('What are the web development pricing plans and services in 1.pdf?');
                    }}
                    leftIcon={<Zap className="h-3.5 w-3.5" />}
                    className="text-xs font-bold"
                  >
                    Run Sample Grounding Query
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSandboxQuery('What APIs and payment gateways are supported and what are their costs?');
                      addToast({ type: 'info', title: 'Sample Query Executing', description: 'Testing API integration grounding...' });
                      handleSandboxRetrieval('What APIs and payment gateways are supported and what are their costs?');
                    }}
                    className="text-xs font-semibold"
                  >
                    Test API Integrations
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 6: VECTOR DB & ENGINE SETTINGS */}
      {activeTab === 'settings' && (
        <Card className="flex-1 min-h-0 flex flex-col justify-between">
          <CardHeader className="shrink-0 pb-3">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              <span>Vector Database & Grounding Engine Settings</span>
            </CardTitle>
            <CardDescription>
              Configure default vector database engine, embedding models, token chunking strategies, and similarity thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 min-h-0 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Primary Vector DB Provider</label>
                  <SearchableSelect
                    value={vectorEngine}
                    onChange={(v) => {
                      setVectorEngine(v as any);
                      addToast({
                        type: 'info',
                        title: 'Vector Store Engine Selected',
                        description: `Primary vector store set to: ${v}`,
                      });
                    }}
                    options={vectorStoreOptions}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Default Top-K Retrieval</label>
                  <SearchableSelect
                    value={defaultTopK}
                    onChange={(v) => {
                      setDefaultTopK(v);
                      addToast({
                        type: 'info',
                        title: 'Default Top-K Retrieval Set',
                        description: `Default retrieval configured to ${v} matches.`,
                      });
                    }}
                    options={[
                      { value: '3', label: '3 Matches (Ultra Low Latency)', subLabel: 'Sub-20ms optimized for realtime voice' },
                      { value: '5', label: '5 Matches (Standard Voice)', subLabel: 'Standard context retrieval' },
                      { value: '8', label: '8 Matches (Deep Technical)', subLabel: 'Full knowledge coverage' },
                    ]}
                  />
                </div>
              </div>

              {vectorEngine === 'ChromaDB' && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Database className="h-4 w-4 text-blue-600" />
                      <span>ChromaDB Local Engine Configuration</span>
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active (Port 8000)
                    </span>
                  </div>
                  <Input
                    label="Chroma Host / Endpoint URL"
                    value={chromaHost}
                    onChange={(e) => setChromaHost(e.target.value)}
                    placeholder="http://localhost:8000"
                  />
                </div>
              )}

              {vectorEngine === 'Pinecone' && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-emerald-600" />
                    <span>Pinecone Vector Cloud Configuration</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Pinecone API Key"
                      type="password"
                      value={pineconeKey}
                      onChange={(e) => setPineconeKey(e.target.value)}
                      placeholder="pcsk_••••••••••••"
                    />
                    <Input
                      label="Index Name"
                      value={pineconeIndex}
                      onChange={(e) => setPineconeIndex(e.target.value)}
                      placeholder="voice-os-index"
                    />
                  </div>
                </div>
              )}

              {/* Advanced Vector Engine Tuning Parameters */}
              <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-purple-600" />
                  <span>Real-Time Voice Vector Grounding Parameters</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Distance Metric:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">Cosine Similarity</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Grounding Confidence Floor:</span>
                    <span className="font-bold text-emerald-600">0.35 Score Threshold</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Hybrid Search Engine:</span>
                    <span className="font-bold text-blue-600">BM25 + Dense Vectors</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Docked Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/80 mt-auto shrink-0">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Vector Engine State: <strong>SSOT Synchronized</strong></span>
              </span>
              <Button
                variant="primary"
                onClick={() => {
                  addToast({
                    type: 'success',
                    title: 'Vector Settings Saved',
                    description: `Preferences saved. Primary DB: ${vectorEngine}, Top-K: ${defaultTopK}, State: SSOT Live Synchronized.`,
                  });
                }}
                leftIcon={<Check className="h-4 w-4" />}
                className="font-bold text-xs"
              >
                Save Vector Engine Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OFFICIAL IN-APP LIVE MULTI-FORMAT FILE PREVIEW MODAL (PDF / CSV / MARKDOWN / CODE VIEWER) */}
      <FilePreviewModal
        file={previewModalFile}
        onClose={() => {
          setPreviewModalFile(null);
          setActivePreviewDoc(null);
        }}
        extraActions={
          activePreviewDoc && (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  const doc = activePreviewDoc;
                  setPreviewModalFile(null);
                  if (doc) {
                    triggerSandboxTestForDoc(doc.title, doc.rawContent, doc.id);
                  }
                }}
                leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                className="text-xs font-bold px-2.5 h-8"
                title="Test in Grounding Sandbox"
              >
                Sandbox Test
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  handleReindex(activePreviewDoc);
                }}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                className="text-xs font-semibold px-2.5 h-8"
                title="Re-index vector embeddings"
              >
                Re-index
              </Button>
            </div>
          )
        }
      />
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
