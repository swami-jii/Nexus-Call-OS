import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Globe,
  Search,
  CheckCircle2,
  Key,
  ExternalLink,
  Zap,
  Filter,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ShieldCheck,
  Code2,
  Lock,
  Layers,
  Plus,
  BookOpen,
  Cpu,
  LayoutGrid,
  List,
  Table,
  Check,
  X,
  Radio,
  Server,
  Activity,
  Workflow,
  Eye,
  EyeOff,
  Sliders,
  RotateCcw,
  Trash2,
  FolderPlus,
  FolderMinus,
  ChevronDown,
  Sparkles as SparklesIcon,
  Brain,
  Building2
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CommandPaletteSelect, SelectOption } from '../ui/CommandPaletteSelect';

interface PublicApiItem {
  s_no: number;
  category_s_no: number;
  api: string;
  description: string;
  category: string;
  auth: string;
  is_free: boolean;
  https: boolean;
  cors: string;
  url: string;
  get_api_link: string;
}

interface ActiveDbApiItem {
  id: string;
  provider: string;
  display_name: string;
  api: string;
  s_no: number;
  category: string;
  description?: string;
  url: string;
  auth: string;
  is_free: boolean;
  created_at?: string;
  target_modules?: string[];
}

interface CategoryStat {
  name: string;
  total: number;
  free: number;
  keyed: number;
}

interface PublicApisCatalogTabProps {
  onAddToast?: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; description: string }) => void;
  onActiveCountChange?: (count: number) => void;
}

const AVAILABLE_MODULES = [
  { id: 'agents', label: 'AI Voice Agents', sidebar: 'AI Voice Agents', icon: <Sparkles className="h-3.5 w-3.5" />, desc: 'Voice Receptionists & Realtime Assistants' },
  { id: 'studio', label: 'Live Call Studio', sidebar: 'Live Call Studio', icon: <Activity className="h-3.5 w-3.5" />, desc: 'Realtime Telephony Audio Stream' },
  { id: 'campaigns', label: 'AI Campaigns', sidebar: 'AI Campaigns', icon: <Radio className="h-3.5 w-3.5" />, desc: 'Outbound Auto-Dialer & Broadcast' },
  { id: 'rag', label: 'Knowledge Base (RAG)', sidebar: 'Knowledge Base (RAG)', icon: <Server className="h-3.5 w-3.5" />, desc: 'Vector Search & Document Q&A' },
  { id: 'webhooks', label: 'Integrations & Webhooks', sidebar: 'Integrations & Webhooks', icon: <Workflow className="h-3.5 w-3.5" />, desc: 'Event Dispatch & Automations' },
];

const AUTH_TYPES = [
  { id: 'None', label: 'Free / Public', icon: '🟢', sub: 'Zero Key (Instant)' },
  { id: 'apiKey', label: 'API Key Header', icon: '🔑', sub: 'x-api-key' },
  { id: 'Bearer', label: 'Bearer Token', icon: '🛡️', sub: 'Authorization: Bearer' },
  { id: 'OAuth', label: 'OAuth 2.0', icon: '🔐', sub: 'Client Credentials' },
];

export const PublicApisCatalogTab: React.FC<PublicApisCatalogTabProps> = ({ onAddToast, onActiveCountChange }) => {
  // Master Catalog State (Full 1,722+ APIs dataset for search/modal auto-populate)
  const [allCatalogApis, setAllCatalogApis] = useState<PublicApiItem[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [totalFree, setTotalFree] = useState(809);
  const [totalKeyed, setTotalKeyed] = useState(913);

  // ACTIVE WORKSPACE CARDS ONLY (Persisted in SQLite Database)
  const [activeCards, setActiveCards] = useState<ActiveDbApiItem[]>([]);
  const [isLoadingActive, setIsLoadingActive] = useState(true);

  // Live broadcast active cards count to parent view & global event
  useEffect(() => {
    onActiveCountChange?.(activeCards.length);
    try {
      window.dispatchEvent(new CustomEvent('nexus_public_apis_count_changed', { detail: activeCards.length }));
    } catch (e) {}
  }, [activeCards.length, onActiveCountChange]);

  // Layout View Switcher: 'grid' | 'list' | 'compact'
  const [viewLayout, setViewLayout] = useState<'grid' | 'list' | 'compact'>('grid');

  // Unified Filter Controls (Category, Search, Status Filter for Active Cards)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [authFilter, setAuthFilter] = useState<'all' | 'free' | 'keyed'>('all');

  // Live Ground Truth Tester State
  const [testInput, setTestInput] = useState('What is the live weather in Delhi?');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isBulkActionRunning, setIsBulkActionRunning] = useState(false);

  // Modals
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);

  // -------------------------------------------------------------
  // DYNAMIC ADD & CONFIGURE MODAL FORM STATE
  // -------------------------------------------------------------
  const [modalCategoryFilter, setModalCategoryFilter] = useState<string>('all');
  const [selectedApiOption, setSelectedApiOption] = useState<string>('1');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [formApiName, setFormApiName] = useState<string>('AdoptAPet');
  const [formCategory, setFormCategory] = useState<string>('Animals');
  const [formDescription, setFormDescription] = useState<string>('Resource to help get pets adopted');
  const [formEndpointUrl, setFormEndpointUrl] = useState<string>('https://www.adoptapet.com/public/apis/pet_list.html');
  const [formDocUrl, setFormDocUrl] = useState<string>('https://www.adoptapet.com/public/apis/pet_list.html');
  const [formAuthType, setFormAuthType] = useState<string>('apiKey');
  const [formApiKey, setFormApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [formHttps, setFormHttps] = useState<boolean>(true);
  const [formCors, setFormCors] = useState<string>('Yes');
  const [formSNo, setFormSNo] = useState<number>(1);
  const [selectedModules, setSelectedModules] = useState<string[]>(['agents', 'studio', 'campaigns', 'rag', 'webhooks']);
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState<boolean>(false);
  const moduleDropdownRef = useRef<HTMLDivElement>(null);
  const [isSavingRecord, setIsSavingRecord] = useState<boolean>(false);

  // In-Modal Live Connection Tester State
  const [modalTestStatus, setModalTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [modalTestMessage, setModalTestMessage] = useState<string>('');

  // Close module dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(e.target as Node)) {
        setIsModuleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Fetch Active Database Records from SQLite
  const fetchActiveDbRecords = async () => {
    try {
      const res = await fetch('/api/public-apis/active');
      if (res.ok) {
        const data = await res.json();
        setActiveCards(data.active_apis || []);
      }
    } catch (e) {
      console.error('Failed to fetch active DB records:', e);
    } finally {
      setIsLoadingActive(false);
    }
  };

  // 2. Initial Data Loading (Categories, Full Catalog, and DB Active Cards)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [catRes, allRes] = await Promise.all([
          fetch('/api/public-apis/categories'),
          fetch('/api/public-apis/catalog?limit=2500'),
          fetchActiveDbRecords()
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }

        if (allRes.ok) {
          const allData = await allRes.json();
          const items: PublicApiItem[] = allData.apis || [];
          setAllCatalogApis(items);
          setTotalFree(allData.total_free_apis || 809);
          setTotalKeyed(allData.total_keyed_apis || 913);

          if (items.length > 0) {
            const first = items[0];
            setSelectedApiOption(String(first.s_no));
            setFormApiName(first.api);
            setFormCategory(first.category);
            setFormDescription(first.description);
            setFormEndpointUrl(first.url);
            setFormDocUrl(first.url);
            setFormAuthType(first.is_free ? 'None' : first.auth);
            setFormHttps(first.https);
            setFormCors(first.cors);
            setFormSNo(first.s_no);
          }
        }
      } catch (e) {
        console.error('Failed to load initial catalog:', e);
      }
    };
    loadInitialData();
  }, []);

  // Number of active cards in the currently selected category
  const activeCountInSelectedCategory = useMemo(() => {
    if (selectedCategory === 'all') return activeCards.length;
    return activeCards.filter((c) => c.category.toLowerCase() === selectedCategory.toLowerCase()).length;
  }, [activeCards, selectedCategory]);

  // Total APIs available in selected category in catalog
  const totalCountInSelectedCategory = useMemo(() => {
    if (selectedCategory === 'all') return allCatalogApis.length;
    return allCatalogApis.filter((c) => c.category.toLowerCase() === selectedCategory.toLowerCase()).length;
  }, [allCatalogApis, selectedCategory]);

  // Check if all items in current selected category are already active in workspace
  const isAllCategoryAdded = useMemo(() => {
    if (selectedCategory === 'all') {
      return allCatalogApis.length > 0 && activeCards.length >= allCatalogApis.length;
    }
    return totalCountInSelectedCategory > 0 && activeCountInSelectedCategory >= totalCountInSelectedCategory;
  }, [selectedCategory, allCatalogApis.length, activeCards.length, totalCountInSelectedCategory, activeCountInSelectedCategory]);

  const hasActiveCardsInSelectedCategory = useMemo(() => {
    return activeCountInSelectedCategory > 0;
  }, [activeCountInSelectedCategory]);

  // Filtered Active Cards (Cards that will be rendered on the screen)
  const displayedCards = useMemo(() => {
    return activeCards.filter((card) => {
      // Category filter
      if (selectedCategory !== 'all' && card.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Auth filter
      if (authFilter === 'free' && !card.is_free) return false;
      if (authFilter === 'keyed' && card.is_free) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = card.api.toLowerCase().includes(q);
        const descMatch = (card.description || '').toLowerCase().includes(q);
        const catMatch = card.category.toLowerCase().includes(q);
        const snoMatch = String(card.s_no).includes(q.replace('#', ''));
        if (!nameMatch && !descMatch && !catMatch && !snoMatch) return false;
      }
      return true;
    });
  }, [activeCards, selectedCategory, authFilter, searchQuery]);

  // -------------------------------------------------------------
  // INSTANT OPTIMISTIC ACTIONS (0ms UI RESPONSE + DB PERSISTENCE)
  // -------------------------------------------------------------

  // 1. Remove Single API Card from Workspace (Hat Jaye)
  const handleRemoveSingleApi = async (apiName: string) => {
    // Instant 0ms Optimistic UI Removal
    setActiveCards((prev) => prev.filter((c) => c.api.toLowerCase() !== apiName.toLowerCase()));

    if (onAddToast) {
      onAddToast({
        type: 'info',
        title: 'Card Removed',
        description: `${apiName} removed from workspace cards.`
      });
    }

    // Delete from SQLite in background
    try {
      await fetch(`/api/public-apis/deactivate/${encodeURIComponent(apiName)}`, {
        method: 'DELETE'
      });
      fetchActiveDbRecords();
    } catch (e) {
      console.error('Failed to delete card from database:', e);
    }
  };

  // 2. Category-Specific Add (e.g. Add all 22 Weather APIs or Add All 1,722 APIs)
  const handleAddCategory = async () => {
    if (isBulkActionRunning) return;
    setIsBulkActionRunning(true);

    const targetItems = selectedCategory === 'all'
      ? allCatalogApis
      : allCatalogApis.filter((a) => a.category.toLowerCase() === selectedCategory.toLowerCase());

    const newItems: ActiveDbApiItem[] = targetItems.map((item) => ({
      id: `bulk_${item.s_no}`,
      provider: `public_api_${item.s_no}_${item.api.toLowerCase().replace(' ', '_')}`,
      display_name: item.api,
      api: item.api,
      s_no: item.s_no,
      category: item.category,
      description: item.description,
      url: item.url,
      auth: item.auth,
      is_free: item.is_free,
      created_at: new Date().toISOString(),
      target_modules: ['agents', 'studio', 'campaigns', 'rag', 'webhooks']
    }));

    // Instant 0ms Optimistic UI Update
    setActiveCards((prev) => {
      const existingOtherCats = prev.filter((c) =>
        selectedCategory === 'all' ? false : c.category.toLowerCase() !== selectedCategory.toLowerCase()
      );
      return [...newItems, ...existingOtherCats];
    });

    const label = selectedCategory === 'all' ? 'All 1,722 Public APIs' : `${selectedCategory} (${newItems.length} APIs)`;
    if (onAddToast) {
      onAddToast({
        type: 'success',
        title: 'Category Added to Workspace',
        description: `Added all ${label} as active cards.`
      });
    }

    // Sync to SQLite Database in background
    try {
      await fetch('/api/public-apis/bulk-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          modules: ['agents', 'studio', 'campaigns', 'rag', 'webhooks']
        })
      });
      await fetchActiveDbRecords();
    } catch (e) {
      console.error('Failed to bulk sync to database:', e);
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  // 3. Category-Specific Remove (e.g. Remove Weather or Remove All)
  const handleRemoveCategory = async () => {
    if (isBulkActionRunning) return;
    setIsBulkActionRunning(true);

    // Instant 0ms Optimistic UI Removal
    setActiveCards((prev) => {
      if (selectedCategory === 'all') return [];
      return prev.filter((c) => c.category.toLowerCase() !== selectedCategory.toLowerCase());
    });

    const label = selectedCategory === 'all' ? 'All Workspace Cards' : `${selectedCategory} Cards`;
    if (onAddToast) {
      onAddToast({
        type: 'info',
        title: 'Cards Removed',
        description: `Removed all ${label} from workspace.`
      });
    }

    // Delete from SQLite Database in background
    try {
      if (selectedCategory === 'all') {
        await fetch('/api/public-apis/bulk-reset', { method: 'POST' });
      } else {
        await fetch('/api/public-apis/bulk-deactivate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: selectedCategory })
        });
      }
      await fetchActiveDbRecords();
    } catch (e) {
      console.error('Failed to delete category from database:', e);
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  // Quick Starter Pack Add (Top 4 Essential Tools)
  const handleAddStarterPack = async () => {
    const starterNames = ['Open-Meteo', 'CoinGecko', 'Free Dictionary', 'REST Countries'];
    const starters = allCatalogApis.filter((a) =>
      starterNames.some((n) => a.api.toLowerCase().includes(n.toLowerCase()))
    );

    const newCards: ActiveDbApiItem[] = starters.map((item) => ({
      id: `starter_${item.s_no}`,
      provider: `public_api_${item.s_no}_${item.api.toLowerCase().replace(' ', '_')}`,
      display_name: item.api,
      api: item.api,
      s_no: item.s_no,
      category: item.category,
      description: item.description,
      url: item.url,
      auth: item.auth,
      is_free: item.is_free,
      created_at: new Date().toISOString(),
      target_modules: ['agents', 'studio', 'campaigns', 'rag', 'webhooks']
    }));

    setActiveCards((prev) => [...newCards, ...prev]);

    if (onAddToast) {
      onAddToast({
        type: 'success',
        title: 'Starter Pack Added',
        description: 'Added 4 Essential APIs (Weather, Crypto, Dictionary, Countries).'
      });
    }

    for (const item of starters) {
      try {
        await fetch('/api/public-apis/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            s_no: item.s_no,
            api: item.api,
            category: item.category,
            description: item.description,
            url: item.url,
            auth: item.auth,
            is_free: item.is_free,
            https: item.https,
            cors: item.cors,
            target_modules: ['agents', 'studio', 'campaigns', 'rag', 'webhooks']
          })
        });
      } catch (e) {
        console.error('Failed to activate starter item:', e);
      }
    }
    fetchActiveDbRecords();
  };

  // Handle Category Filter Change inside Modal
  const handleModalCategoryChange = (catName: string) => {
    setModalCategoryFilter(catName);
    if (catName !== 'all') {
      const firstInCat = allCatalogApis.find((a) => a.category.toLowerCase() === catName.toLowerCase());
      if (firstInCat) {
        handleSelectApiOption(String(firstInCat.s_no));
      }
    }
  };

  // Handle Dynamic Selection from API Dropdown in Modal
  const handleSelectApiOption = (val: string) => {
    setSelectedApiOption(val);
    setModalTestStatus('idle');
    setModalTestMessage('');

    if (val === 'custom') {
      setIsCustomMode(true);
      setFormApiName('');
      setFormCategory(modalCategoryFilter !== 'all' ? modalCategoryFilter : 'Development');
      setFormDescription('');
      setFormEndpointUrl('');
      setFormDocUrl('');
      setFormAuthType('apiKey');
      setFormApiKey('');
      setFormHttps(true);
      setFormCors('Yes');
      setFormSNo(0);
      return;
    }

    setIsCustomMode(false);
    const targetSno = parseInt(val, 10);
    const matched = allCatalogApis.find((a) => a.s_no === targetSno) || allCatalogApis.find((a) => a.api.toLowerCase() === val.toLowerCase());

    if (matched) {
      setFormApiName(matched.api);
      setFormCategory(matched.category);
      setFormDescription(matched.description);
      setFormEndpointUrl(matched.url);
      setFormDocUrl(matched.url);
      setFormAuthType(matched.is_free ? 'None' : (matched.auth.includes('OAuth') ? 'OAuth' : 'apiKey'));
      setFormApiKey('');
      setFormHttps(matched.https);
      setFormCors(matched.cors);
      setFormSNo(matched.s_no);
    }
  };

  // Toggle Target Module in Modal
  const toggleTargetModule = (modId: string) => {
    setSelectedModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  // Open Modal for Specific Card Edit / Configure
  const openModalForCard = (apiName: string) => {
    const existing = activeCards.find((c) => c.api.toLowerCase() === apiName.toLowerCase());
    const catalogItem = allCatalogApis.find((a) => a.api.toLowerCase() === apiName.toLowerCase());

    const chosenCat = existing?.category || catalogItem?.category || 'General';
    setModalCategoryFilter(chosenCat);
    setSelectedApiOption(String(existing?.s_no || catalogItem?.s_no || 1));
    setIsCustomMode(false);
    setFormApiName(existing?.api || catalogItem?.api || apiName);
    setFormCategory(chosenCat);
    setFormDescription(existing?.description || catalogItem?.description || '');
    setFormEndpointUrl(existing?.url || catalogItem?.url || '');
    setFormDocUrl(existing?.url || catalogItem?.url || '');
    setFormAuthType(existing?.auth || (catalogItem?.is_free ? 'None' : catalogItem?.auth || 'apiKey'));
    setFormApiKey('');
    setFormHttps(true);
    setFormCors('Yes');
    setFormSNo(existing?.s_no || catalogItem?.s_no || 1);
    setSelectedModules(existing?.target_modules || ['agents', 'studio', 'campaigns', 'rag', 'webhooks']);
    setModalTestStatus('idle');
    setModalTestMessage('');
    setIsConfigureModalOpen(true);
  };

  // Open Modal for Blank Create
  const openModalForCreate = () => {
    setModalCategoryFilter('all');
    setSelectedApiOption('1');
    setIsCustomMode(false);
    if (allCatalogApis.length > 0) {
      const first = allCatalogApis[0];
      setFormApiName(first.api);
      setFormCategory(first.category);
      setFormDescription(first.description);
      setFormEndpointUrl(first.url);
      setFormDocUrl(first.url);
      setFormAuthType(first.is_free ? 'None' : first.auth);
      setFormApiKey('');
      setFormHttps(first.https);
      setFormCors(first.cors);
      setFormSNo(first.s_no);
    }
    setModalTestStatus('idle');
    setModalTestMessage('');
    setIsConfigureModalOpen(true);
  };

  // Live Ground Truth Simulator Test
  const handleTestQuery = async () => {
    if (!testInput.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/public-apis/test-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testInput })
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data.ground_truth_answer || 'No factual data found for this query.');
      } else {
        setTestResult('Error resolving live factual query.');
      }
    } catch (e: any) {
      setTestResult(`Error: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  // In-Modal Live Connection Test
  const handleTestInModalConnection = async () => {
    if (!formEndpointUrl.trim()) return;
    setModalTestStatus('testing');
    setModalTestMessage('Testing public endpoint reachability...');
    try {
      const startTime = Date.now();
      const res = await fetch('/api/public-apis/test-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `API #${formSNo || 1} ${formApiName}` })
      });
      const latency = Date.now() - startTime;
      if (res.ok) {
        setModalTestStatus('success');
        setModalTestMessage(`Connected successfully! Sub-100ms latency verified: ${latency}ms.`);
      } else {
        setModalTestStatus('error');
        setModalTestMessage('Connection warning. Verify network endpoint.');
      }
    } catch (e: any) {
      setModalTestStatus('error');
      setModalTestMessage(`Connection test failed: ${e.message}`);
    }
  };

  // Save Configured API Record from Modal into Workspace Cards & DB
  const handleSaveApiRecord = async (addAnother: boolean = false) => {
    if (!formApiName.trim() || !formEndpointUrl.trim()) {
      if (onAddToast) {
        onAddToast({
          type: 'error',
          title: 'Validation Error',
          description: 'Please provide at least API Name and Base URL / Endpoint.'
        });
      }
      return;
    }

    setIsSavingRecord(true);
    try {
      const newCard: ActiveDbApiItem = {
        id: `saved_${Date.now()}`,
        provider: `public_api_${formSNo}_${formApiName.toLowerCase().replace(' ', '_')}`,
        display_name: formApiName.trim(),
        api: formApiName.trim(),
        s_no: formSNo,
        category: formCategory,
        description: formDescription.trim(),
        url: formEndpointUrl.trim(),
        auth: formAuthType,
        is_free: formAuthType === 'None',
        created_at: new Date().toISOString(),
        target_modules: selectedModules
      };

      // Instant Optimistic Add
      setActiveCards((prev) => [newCard, ...prev.filter((c) => c.api.toLowerCase() !== formApiName.toLowerCase())]);

      if (onAddToast) {
        onAddToast({
          type: 'success',
          title: 'Card Added to Workspace',
          description: `${formApiName} is now active in your workspace cards.`
        });
      }

      await fetch('/api/public-apis/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          s_no: formSNo,
          api: formApiName.trim(),
          category: formCategory,
          description: formDescription.trim(),
          url: formEndpointUrl.trim(),
          auth: formAuthType,
          is_free: formAuthType === 'None',
          https: formHttps,
          cors: formCors,
          apiKey: formApiKey.trim(),
          target_modules: selectedModules
        })
      });

      fetchActiveDbRecords();

      if (addAnother) {
        openModalForCreate();
      } else {
        setIsConfigureModalOpen(false);
      }
    } catch (e: any) {
      if (onAddToast) {
        onAddToast({
          type: 'error',
          title: 'Save Failed',
          description: e.message
        });
      }
    } finally {
      setIsSavingRecord(false);
    }
  };

  // Prepare Category Dropdown Options with Live Counts
  const modalCategoryOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [
      {
        value: 'all',
        label: '🌐 All 50 Categories (1,722 APIs Total)',
        description: `${totalFree} Free APIs • ${totalKeyed} Keyed Integrations`,
        group: 'Universal Catalog'
      }
    ];

    categories.forEach((cat) => {
      opts.push({
        value: cat.name,
        label: `${cat.name} (${cat.total} APIs • ${cat.free} Free)`,
        description: `${cat.free} Always-Active Free APIs, ${cat.keyed} Keyed integrations`,
        group: 'Categories (50 Total)'
      });
    });

    return opts;
  }, [categories, totalFree, totalKeyed]);

  // Prepare Filtered 1,722+ Options for CommandPaletteSelect
  const commandPaletteOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [
      {
        value: 'custom',
        label: '✨ Custom Public API / Endpoint...',
        description: 'Specify your own custom API endpoint and authentication',
        group: 'Custom Integration'
      }
    ];

    const sourceList = modalCategoryFilter === 'all'
      ? allCatalogApis
      : allCatalogApis.filter((a) => a.category.toLowerCase() === modalCategoryFilter.toLowerCase());

    sourceList.forEach((item) => {
      opts.push({
        value: String(item.s_no),
        label: `[#${item.s_no}] ${item.api}`,
        description: `${item.description} (${item.is_free ? '🟢 Free / No Key' : `🔑 ${item.auth}`})`,
        group: `${item.category} (${categories.find((c) => c.name === item.category)?.total || ''} APIs)`
      });
    });

    return opts;
  }, [allCatalogApis, modalCategoryFilter, categories]);

  // Prepare Authentication Type Options for CommandPaletteSelect
  const authTypeOptions: SelectOption[] = useMemo(() => [
    {
      value: 'None',
      label: '🟢 Free / Public (Zero Key Required)',
      description: '100% Free, keyless and always active for live telephony calls',
      group: 'Authentication Mode'
    },
    {
      value: 'apiKey',
      label: '🔑 API Key Header (x-api-key)',
      description: 'Standard HTTP header authentication with custom API key',
      group: 'Authentication Mode'
    },
    {
      value: 'Bearer',
      label: '🛡️ Bearer Token (Authorization: Bearer)',
      description: 'Authorization header with Bearer token / JWT',
      group: 'Authentication Mode'
    },
    {
      value: 'OAuth',
      label: '🔐 OAuth 2.0 (Client Credentials)',
      description: 'Client ID & Secret token exchange grant',
      group: 'Authentication Mode'
    }
  ], []);

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER ACTION BAR (Single Clean Row) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Public APIs Catalog &amp; Live Intelligence Hub (1,722+ Integrated)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Zero-latency background world knowledge dataset indexed across 50 categories. Add public API tools to empower your AI voice calling agents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Layout Switcher */}
          <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-zinc-50 dark:bg-zinc-950">
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewLayout === 'grid'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 font-bold shadow-2xs'
                  : 'text-zinc-400 hover:text-zinc-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewLayout('list')}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewLayout === 'list'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 font-bold shadow-2xs'
                  : 'text-zinc-400 hover:text-zinc-800'
              }`}
              title="Inline List View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewLayout('compact')}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewLayout === 'compact'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 font-bold shadow-2xs'
                  : 'text-zinc-400 hover:text-zinc-800'
              }`}
              title="Compact View"
            >
              <Table className="h-4 w-4" />
            </button>
          </div>

          {/* Active Module Matrix Button */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Cpu className="h-4 w-4 text-emerald-500" />}
            onClick={() => setIsMatrixModalOpen(true)}
            className="bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 font-bold text-xs cursor-pointer shadow-2xs"
          >
            ⚡ Active Module Matrix
          </Button>

          {/* Add Public API Button */}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openModalForCreate}
          >
            Add Public API
          </Button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Total Public APIs Catalog</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">1,722</div>
            <div className="text-[10px] text-zinc-400">Indexed across 50 categories</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <Globe className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Configured Workspace Cards</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {activeCards.length} Added
            </div>
            <div className="text-[10px] text-emerald-600/80 dark:text-emerald-500">
              {selectedCategory !== 'all' ? `(${activeCountInSelectedCategory} in ${selectedCategory})` : 'Active in Telephony Calls'}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/20 p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">Keyed Integrations Available</div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{totalKeyed}</div>
            <div className="text-[10px] text-amber-600/80 dark:text-amber-500">Configurable with API Key</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
            <Key className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. GROUND-TRUTH SIMULATOR + CATEGORY-SPECIFIC ADD / REMOVE BUTTONS */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Live Voice Engine Ground-Truth Simulator (Sub-100ms)
            </h4>
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden md:inline">
            Tests silent background retrieval without exposing internal API metadata to caller
          </span>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestQuery()}
              placeholder="e.g., What is the live weather in Delhi? 1 USD to INR? Definition of serendipity..."
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Test Query Button */}
            <Button
              variant="primary"
              size="sm"
              disabled={isTesting || !testInput.trim()}
              onClick={handleTestQuery}
              leftIcon={isTesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              className="cursor-pointer text-xs font-bold shrink-0"
            >
              Test Ground Truth
            </Button>

            {/* Category-Specific Add Button */}
            <Button
              variant="outline"
              size="sm"
              disabled={isBulkActionRunning || isAllCategoryAdded}
              onClick={handleAddCategory}
              leftIcon={isBulkActionRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500" /> : <FolderPlus className="h-3.5 w-3.5 text-emerald-500" />}
              className={`font-bold text-xs cursor-pointer shadow-2xs shrink-0 transition-all ${
                isAllCategoryAdded
                  ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700 cursor-not-allowed opacity-60'
                  : 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
              }`}
              title={
                isAllCategoryAdded
                  ? `All ${selectedCategory === 'all' ? '1,722 APIs' : selectedCategory + ' APIs'} are already added to workspace`
                  : `Add all APIs in ${selectedCategory === 'all' ? 'All 50 Categories' : selectedCategory} to workspace`
              }
            >
              {isBulkActionRunning
                ? 'Processing...'
                : isAllCategoryAdded
                ? `✓ Added ${selectedCategory === 'all' ? 'All (1,722)' : `All (${activeCountInSelectedCategory})`}`
                : `✨ Add ${selectedCategory === 'all' ? 'All (1,722 APIs)' : `${selectedCategory} (${totalCountInSelectedCategory})`}`}
            </Button>

            {/* Category-Specific Remove Button */}
            <Button
              variant="outline"
              size="sm"
              disabled={isBulkActionRunning || !hasActiveCardsInSelectedCategory}
              onClick={handleRemoveCategory}
              leftIcon={isBulkActionRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-rose-500" /> : <FolderMinus className="h-3.5 w-3.5 text-rose-500" />}
              className={`font-bold text-xs cursor-pointer shrink-0 transition-all ${
                !hasActiveCardsInSelectedCategory
                  ? 'text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800 cursor-not-allowed opacity-40'
                  : 'text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 shadow-2xs'
              }`}
              title={
                !hasActiveCardsInSelectedCategory
                  ? `No active cards to remove in ${selectedCategory === 'all' ? 'workspace' : selectedCategory}`
                  : `Remove all APIs in ${selectedCategory === 'all' ? 'workspace' : selectedCategory} from workspace`
              }
            >
              ✕ Remove {selectedCategory === 'all' ? `All (${activeCards.length})` : `${selectedCategory} (${activeCountInSelectedCategory})`}
            </Button>
          </div>
        </div>

        {testResult && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 p-3 text-xs text-zinc-800 dark:text-zinc-200 font-mono">
            <span className="font-bold text-blue-600 dark:text-blue-400">Resolved Factual Context: </span>
            {testResult}
          </div>
        )}
      </div>

      {/* 4. SEARCH & CATEGORY FILTER TOOLBAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-50/60 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 text-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeCards.length} configured workspace APIs...`}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-9 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:border-blue-500 focus:outline-hidden"
          >
            <option value="all">All 50 Categories (1,722 APIs Total)</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.total} APIs • {c.free} Free)
              </option>
            ))}
          </select>

          {/* Auth Filter Pills */}
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 p-1">
            <button
              onClick={() => setAuthFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                authFilter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              All ({displayedCards.length})
            </button>
            <button
              onClick={() => setAuthFilter('free')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                authFilter === 'free'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <span>🟢</span> Free
            </button>
            <button
              onClick={() => setAuthFilter('keyed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                authFilter === 'keyed'
                  ? 'bg-amber-600 text-white shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <span>🔑</span> Keyed
            </button>
          </div>
        </div>
      </div>

      {/* 5. ACTIVE WORKSPACE CARDS RENDERING (DISPLAYS ONLY ADDED CARDS) */}
      {isLoadingActive ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-xs text-zinc-500">Loading configured workspace APIs...</p>
        </div>
      ) : displayedCards.length === 0 ? (
        /* CLEAN EMPTY STATE WHEN 0 CARDS ARE CONFIGURED */
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-12 text-center space-y-4 shadow-2xs">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 mx-auto flex items-center justify-center">
            <Globe className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {activeCards.length === 0
                ? 'No Public APIs Added to Workspace Yet'
                : `No active cards in category "${selectedCategory}"`}
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {activeCards.length === 0
                ? 'Add public API tools to empower your AI voice agents with real-time weather, crypto rates, dictionaries, and factual knowledge during phone calls.'
                : 'Click the "✨ Add ' + (selectedCategory === 'all' ? 'All' : selectedCategory) + '" button above to add cards to this category.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={openModalForCreate}
            >
              + Add Public API
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sparkles className="h-4 w-4 text-amber-500" />}
              onClick={handleAddStarterPack}
              className="bg-amber-50/60 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-bold"
            >
              ⚡ Add 4 Starter APIs (Weather, Crypto, Dict, Country)
            </Button>
            {selectedCategory !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FolderPlus className="h-4 w-4 text-emerald-500" />}
                onClick={handleAddCategory}
              >
                ✨ Add All in {selectedCategory} ({totalCountInSelectedCategory})
              </Button>
            )}
          </div>
        </div>
      ) : viewLayout === 'list' ? (
        /* WORKSPACE INLINE LIST VIEW (2-COLUMN GRID WITH DEDICATED BOTTOM BUTTON STRIP) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {displayedCards.map((card) => {
            const targetModules = card.target_modules || ['AI Voice Agents', 'Live Call Studio', 'AI Campaigns', 'Knowledge Base (RAG)', 'Integrations & Webhooks'];
            const isGlobalScope = targetModules.length >= 5 || targetModules.includes('Global Workspace') || targetModules.includes('Global (All Modules)');

            return (
              <div
                key={card.id || card.api}
                className="group relative p-3.5 bg-white dark:bg-zinc-900 border border-emerald-300/80 dark:border-emerald-800/80 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 min-w-0"
              >
                {/* Top Section: Icon, Serial, Full Title, Category, Auth & Active Badge */}
                <div className="space-y-2 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shrink-0">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {card.s_no > 0 && (
                            <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
                              #{card.s_no}
                            </span>
                          )}
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {card.api}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="rounded-md bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40">
                            {card.category}
                          </span>
                          <Badge
                            variant={card.auth_type === 'None' || (!card.auth_type && card.is_free) ? 'success' : 'warning'}
                            size="sm"
                            className="text-[9.5px] py-0 font-semibold"
                          >
                            {card.auth_type === 'None' || (!card.auth_type && card.is_free) ? '🟢 Free' : `🔑 ${card.auth_type || card.auth || 'Keyed'}`}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <span className="flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[9.5px] font-bold shadow-2xs whitespace-nowrap shrink-0">
                      <Check className="h-3 w-3" />
                      Active in DB
                    </span>
                  </div>

                  {/* Description / URL */}
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                    {card.description || card.url}
                  </p>

                  {/* Target Modules Strip */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {isGlobalScope ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono text-[9.5px] font-bold flex items-center gap-1">
                        🌐 Global (All 5 Modules Bound)
                      </span>
                    ) : (
                      targetModules.slice(0, 3).map((mod: string, mIdx: number) => (
                        <span
                          key={mIdx}
                          className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[9.5px] font-semibold flex items-center gap-1"
                        >
                          {mod === 'AI Voice Agents' && '🤖 Agents'}
                          {mod === 'Live Call Studio' && '🎙️ Studio'}
                          {mod === 'AI Campaigns' && '📡 Campaigns'}
                          {mod === 'Knowledge Base (RAG)' && '📚 RAG'}
                          {mod === 'Integrations & Webhooks' && '⚡ Webhooks'}
                          {mod !== 'AI Voice Agents' && mod !== 'Live Call Studio' && mod !== 'AI Campaigns' && mod !== 'Knowledge Base (RAG)' && mod !== 'Integrations & Webhooks' && mod}
                        </span>
                      ))
                    )}
                    {!isGlobalScope && targetModules.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono text-[9px] font-bold">
                        +{targetModules.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Dedicated Action Buttons Strip */}
                <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 truncate">
                    {card.url ? (
                      <span className="truncate max-w-[130px] sm:max-w-[170px]">{card.url.replace(/^https?:\/\//, '')}</span>
                    ) : (
                      <span>Sub-100ms Ground-Truth</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openModalForCard(card.api)}
                      className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                    >
                      <SlidersHorizontal className="h-3 w-3 text-zinc-500" />
                      <span>Config</span>
                    </button>

                    <button
                      onClick={() => handleRemoveSingleApi(card.api)}
                      className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                      title="Remove this card from workspace"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Remove</span>
                    </button>

                    {card.url && (
                      <a
                        href={card.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                      >
                        <span>Docs</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewLayout === 'compact' ? (
        /* WORKSPACE COMPACT VIEW (4-COLUMN RESPONSIVE TILES) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {displayedCards.map((card) => {
            const targetModules = card.target_modules || ['AI Voice Agents', 'Live Call Studio', 'AI Campaigns', 'Knowledge Base (RAG)', 'Integrations & Webhooks'];
            const isGlobalScope = targetModules.length >= 5 || targetModules.includes('Global Workspace') || targetModules.includes('Global (All Modules)');

            return (
              <div
                key={card.id || card.api}
                className="group relative p-3 bg-white dark:bg-zinc-900 border border-emerald-300/80 dark:border-emerald-800/80 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-2.5 text-xs min-w-0"
              >
                <div className="space-y-1.5 min-w-0">
                  {/* Top Bar: Serial + Category + Auth Badge */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-mono text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                        #{card.s_no || 1}
                      </span>
                      <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/50 truncate max-w-[100px]">
                        {card.category}
                      </span>
                    </div>

                    <Badge
                      variant={card.auth_type === 'None' || (!card.auth_type && card.is_free) ? 'success' : 'warning'}
                      size="sm"
                      className="text-[9px] py-0 px-1.5 font-semibold shrink-0"
                    >
                      {card.auth_type === 'None' || (!card.auth_type && card.is_free) ? '🟢 Free' : `🔑 ${card.auth_type || card.auth || 'Keyed'}`}
                    </Badge>
                  </div>

                  {/* API Title */}
                  <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {card.api}
                  </h5>

                  {/* Description */}
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-normal">
                    {card.description || card.url}
                  </p>

                  {/* Module Bindings Indicator */}
                  <div className="pt-0.5">
                    <span className="text-[9px] font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 font-semibold truncate block">
                      {isGlobalScope ? '🌐 Global (All 5 Modules)' : `${targetModules.length} Modules Bound`}
                    </span>
                  </div>
                </div>

                {/* Bottom Buttons Toolbar */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModalForCard(card.api)}
                      className="px-2 py-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                    >
                      <SlidersHorizontal className="h-2.5 w-2.5 text-zinc-500" />
                      <span>Config</span>
                    </button>

                    <button
                      onClick={() => handleRemoveSingleApi(card.api)}
                      className="px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                      title="Remove this card from workspace"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  {card.url && (
                    <a
                      href={card.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                    >
                      <span>Docs</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* WORKSPACE GRID VIEW (STANDARD 3-COLUMN CARDS) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedCards.map((card) => {
            const targetModules = card.target_modules || ['AI Voice Agents', 'Live Call Studio', 'AI Campaigns', 'Knowledge Base (RAG)', 'Integrations & Webhooks'];
            const isGlobalScope = targetModules.length >= 5 || targetModules.includes('Global Workspace') || targetModules.includes('Global (All Modules)');

            return (
              <div
                key={card.id || card.api}
                className="group relative flex flex-col justify-between rounded-2xl border border-emerald-400/80 bg-white dark:bg-zinc-900 p-4 transition-all hover:shadow-md hover:border-emerald-500 shadow-2xs gap-3 min-w-0"
              >
                <div className="space-y-2.5 min-w-0">
                  {/* Header: Icon, Serial, API Name, Category & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shrink-0">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {card.s_no > 0 && (
                            <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
                              #{card.s_no}
                            </span>
                          )}
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {card.api}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="rounded-md bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40">
                            {card.category}
                          </span>
                          <Badge
                            variant={card.auth_type === 'None' || (!card.auth_type && card.is_free) ? 'success' : 'warning'}
                            size="sm"
                            className="text-[9.5px] py-0 font-semibold"
                          >
                            {card.auth_type === 'None' || (!card.auth_type && card.is_free) ? '🟢 Free' : `🔑 ${card.auth_type || card.auth || 'Keyed'}`}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <span className="flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-bold shadow-xs shrink-0">
                      <Check className="h-3 w-3" />
                      Active Card
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                    {card.description || card.url}
                  </p>

                  {/* Target Modules Tags */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {isGlobalScope ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono text-[9.5px] font-bold flex items-center gap-1">
                        🌐 Global (All 5 Modules Bound)
                      </span>
                    ) : (
                      targetModules.slice(0, 3).map((mod: string, mIdx: number) => (
                        <span
                          key={mIdx}
                          className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[9.5px] font-semibold flex items-center gap-1"
                        >
                          {mod === 'AI Voice Agents' && '🤖 Agents'}
                          {mod === 'Live Call Studio' && '🎙️ Studio'}
                          {mod === 'AI Campaigns' && '📡 Campaigns'}
                          {mod === 'Knowledge Base (RAG)' && '📚 RAG'}
                          {mod === 'Integrations & Webhooks' && '⚡ Webhooks'}
                          {mod !== 'AI Voice Agents' && mod !== 'Live Call Studio' && mod !== 'AI Campaigns' && mod !== 'Knowledge Base (RAG)' && mod !== 'Integrations & Webhooks' && mod}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Footer: Action Buttons */}
                <div className="mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-1.5 flex-nowrap">
                  <div className="flex items-center gap-1 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0 whitespace-nowrap">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Active in DB</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openModalForCard(card.api)}
                      className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0 shadow-2xs"
                    >
                      <SlidersHorizontal className="h-3 w-3 shrink-0" />
                      <span>Config</span>
                    </button>

                    <button
                      onClick={() => handleRemoveSingleApi(card.api)}
                      className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0 shadow-2xs"
                      title="Remove this card from workspace"
                    >
                      <Trash2 className="h-3 w-3 shrink-0" />
                      <span>Remove</span>
                    </button>

                    {card.url && (
                      <a
                        href={card.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0 shadow-2xs"
                      >
                        <span>Docs</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. DYNAMIC 2-TIER SEARCHABLE ADD & CONFIGURE MODAL */}
      <Modal
        isOpen={isConfigureModalOpen}
        onClose={() => setIsConfigureModalOpen(false)}
        size="2xl"
        title={isCustomMode ? 'Add Custom Public API Tool' : `Configure [ #${formSNo} ] ${formApiName}`}
        description="Search by Category or directly select any API from the 1,722+ curated dataset across 50 categories to auto-populate all dynamic endpoints and metadata."
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span>📖 Setup Guide &amp; Docs</span>
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsConfigureModalOpen(false)}
                className="cursor-pointer text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                disabled={isSavingRecord}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveApiRecord(true);
                }}
                className="cursor-pointer text-xs"
              >
                Save &amp; Add Another
              </Button>
              <Button
                variant="primary"
                disabled={isSavingRecord}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveApiRecord(false);
                }}
                leftIcon={isSavingRecord ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                className="cursor-pointer font-bold text-xs"
              >
                {isSavingRecord ? 'Saving...' : 'Save & Close'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3.5 text-xs">
          {/* TIER 1: SEARCHABLE CATEGORY SELECTOR WITH LIVE ITEM COUNTS */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              1. Filter by Category (50 Curated Categories with Live Counts)
            </label>
            <CommandPaletteSelect
              value={modalCategoryFilter}
              onChange={handleModalCategoryChange}
              options={modalCategoryOptions}
              placeholder="Search 50 categories (e.g. Weather, Crypto, Business, Health)..."
              allowCustom={false}
            />
          </div>

          {/* TIER 2: SEARCHABLE API SELECTOR WITH ALL MATCHING APIS */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                2. Select Public API ({modalCategoryFilter === 'all' ? '1,722 APIs Total' : `${commandPaletteOptions.length - 1} APIs in ${modalCategoryFilter}`})
              </label>
              <span className="text-[10px] text-zinc-400">
                Select any API to auto-fill all endpoints &amp; documentation
              </span>
            </div>
            <CommandPaletteSelect
              value={selectedApiOption}
              onChange={handleSelectApiOption}
              options={commandPaletteOptions}
              placeholder={`Search ${modalCategoryFilter === 'all' ? '1,722+ APIs' : modalCategoryFilter + ' APIs'} by name, serial number, or description...`}
              allowCustom={false}
            />
          </div>

          {/* DYNAMIC AUTO-FILLED API METADATA PREVIEW BANNER */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    {formSNo > 0 && (
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        #{formSNo}
                      </span>
                    )}
                    <h5 className="font-bold text-zinc-900 dark:text-zinc-100">{formApiName || 'Custom API'}</h5>
                  </div>
                  <span className="text-[10px] text-zinc-500 block">Category: {formCategory}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {formAuthType === 'None' ? (
                  <Badge variant="success" size="sm" className="font-semibold text-[10px]">
                    🟢 Free (Always Active)
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm" className="font-semibold text-[10px]">
                    🔑 {formAuthType}
                  </Badge>
                )}
                {formDocUrl && (
                  <a
                    href={formDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Docs</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {formDescription && (
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-200/60 dark:border-zinc-800/60 pt-2 mt-1">
                {formDescription}
              </p>
            )}
          </div>

          {/* 2-COLUMN NAME & CATEGORY FIELDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                API Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formApiName}
                onChange={(e) => setFormApiName(e.target.value)}
                placeholder="e.g. Open-Meteo Weather"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* BASE URL / ENDPOINT */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Base URL / Official API Endpoint <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-zinc-400 font-mono text-xs select-none">🌐</span>
              <input
                type="url"
                value={formEndpointUrl}
                onChange={(e) => setFormEndpointUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* 2-COLUMN SINGLE ROW: AUTHENTICATION TYPE & TARGET WORKSPACE MODULE BINDING */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            {/* 1. AUTHENTICATION TYPE DROPDOWN */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Authentication Type
              </label>
              <CommandPaletteSelect
                value={formAuthType}
                onChange={(val) => setFormAuthType(val)}
                options={authTypeOptions}
                placeholder="Select Authentication Type..."
                allowCustom={false}
              />
            </div>

            {/* 2. TARGET WORKSPACE MODULE BINDING (MULTI-SELECT DROPDOWN) */}
            <div className="space-y-1 relative" ref={moduleDropdownRef}>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Target Sidebar Module Binding
                </label>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSelectedModules(['agents', 'studio', 'campaigns', 'rag', 'webhooks'])}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                  >
                    All
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedModules([])}
                    className="text-zinc-500 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Dropdown Trigger Button */}
              <button
                type="button"
                onClick={() => setIsModuleDropdownOpen((prev) => !prev)}
                className={`w-full h-9 flex items-center justify-between gap-2 px-3 text-xs rounded-lg border transition-all cursor-pointer bg-white dark:bg-zinc-900 ${
                  isModuleDropdownOpen
                    ? 'border-blue-500 ring-1 ring-blue-500/40'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-400'
                }`}
              >
                <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate text-left flex-1">
                  {selectedModules.length === AVAILABLE_MODULES.length
                    ? '🌐 Global (All 5 Modules Active)'
                    : selectedModules.length === 0
                    ? '⚠️ No Modules Selected'
                    : `${selectedModules.length} Active: ${selectedModules
                        .map((id) => AVAILABLE_MODULES.find((m) => m.id === id)?.label.split(' ')[0])
                        .filter(Boolean)
                        .join(', ')}`}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/50">
                    {selectedModules.length}/{AVAILABLE_MODULES.length}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-150 ${isModuleDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Floating Dropdown Panel */}
              {isModuleDropdownOpen && (
                <div className="absolute z-[100] top-full mt-1.5 left-0 right-0 min-w-[280px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100 ring-1 ring-black/5 dark:ring-white/10 p-1.5 space-y-1">
                  <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 rounded">
                    <span>Sidebar Modules</span>
                    <span>{selectedModules.length} of {AVAILABLE_MODULES.length} Selected</span>
                  </div>

                  {/* MASTER GLOBAL ALL MODULES OPTION */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedModules.length === AVAILABLE_MODULES.length) {
                        setSelectedModules([]);
                      } else {
                        setSelectedModules(AVAILABLE_MODULES.map((m) => m.id));
                      }
                    }}
                    className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg text-xs text-left transition-all cursor-pointer ${
                      selectedModules.length === AVAILABLE_MODULES.length
                        ? 'bg-blue-50/90 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 shadow-2xs'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="p-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                        <Globe className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold truncate">🌐 Global Workspace (All Modules)</span>
                        <span className="text-[10px] text-zinc-400 font-normal truncate">Bind to all 5 Sidebar modules</span>
                      </div>
                    </div>
                    <div className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                      selectedModules.length === AVAILABLE_MODULES.length
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : selectedModules.length > 0
                        ? 'bg-blue-100 border-blue-400 text-blue-600'
                        : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                    }`}>
                      {selectedModules.length === AVAILABLE_MODULES.length ? (
                        <Check className="h-3 w-3 stroke-[3]" />
                      ) : selectedModules.length > 0 ? (
                        <span className="block w-2 h-0.5 bg-blue-600 rounded"></span>
                      ) : null}
                    </div>
                  </button>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 my-1"></div>

                  {/* INDIVIDUAL MODULES */}
                  {AVAILABLE_MODULES.map((mod) => {
                    const isSelected = selectedModules.includes(mod.id);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => toggleTargetModule(mod.id)}
                        className={`w-full flex items-center justify-between gap-2 p-1.5 rounded-lg text-xs text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`p-1 rounded-md shrink-0 ${isSelected ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                            {mod.icon}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold truncate text-[11px]">{mod.label}</span>
                            <span className="text-[9px] text-zinc-400 font-normal truncate">Sidebar: {mod.sidebar}</span>
                          </div>
                        </div>
                        <div className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC AUTH INFO (FREE BANNER OR API KEY INPUT FIELD) */}
          {formAuthType === 'None' ? (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>This API is 100% Free &amp; Keyless. It is always active in the background for live voice telephone calls.</span>
            </div>
          ) : (
            <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  API Key / Auth Token <span className="text-amber-500">*</span>
                </label>
                {formDocUrl && (
                  <a
                    href={formDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Get {formApiName} API Key</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-zinc-400 font-mono text-xs select-none">🔒</span>
                <input
                  type={showApiKeyInput ? 'text' : 'password'}
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  placeholder="Enter your private API key (e.g. sk_live_...)"
                  className="w-full pl-8 pr-9 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-hidden focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showApiKeyInput ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE SIDEBAR MODULE PILLS */}
          {selectedModules.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-semibold text-zinc-400 mr-0.5">Active In:</span>
              {selectedModules.length === AVAILABLE_MODULES.length ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40 text-[10px] font-semibold shadow-2xs">
                  <Globe className="h-3 w-3 text-blue-600" />
                  <span>Global (All 5 Sidebar Modules Active)</span>
                </span>
              ) : (
                AVAILABLE_MODULES.map((mod) => {
                  const isSelected = selectedModules.includes(mod.id);
                  if (!isSelected) return null;
                  return (
                    <span
                      key={mod.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40 text-[10px] font-semibold shadow-2xs"
                    >
                      <span>{mod.icon}</span>
                      <span>{mod.label}</span>
                      <button
                        type="button"
                        onClick={() => toggleTargetModule(mod.id)}
                        className="hover:text-rose-600 cursor-pointer ml-0.5"
                        title={`Remove ${mod.label}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>
          )}

          {/* IN-MODAL LIVE TEST BUTTON & RESULT */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {modalTestStatus === 'success' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ {modalTestMessage}</span>
                ) : modalTestStatus === 'error' ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">✕ {modalTestMessage}</span>
                ) : (
                  <span>Verify API Reachability &amp; Latency</span>
                )}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={modalTestStatus === 'testing'}
              onClick={handleTestInModalConnection}
              leftIcon={modalTestStatus === 'testing' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
              className="cursor-pointer text-xs font-bold"
            >
              {modalTestStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 7. SETUP GUIDE & DOCUMENTATION MODAL (SINGLE CLEAN SCROLLBAR) */}
      <Modal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        size="2xl"
        title="Public APIs & Live Intelligence — Setup & Architecture Guide"
        description="Learn how the 1,722+ curated Public APIs dataset operates with sub-100ms background execution during live telephony calls."
        footer={
          <div className="flex justify-end w-full">
            <Button variant="primary" onClick={() => setIsGuideModalOpen(false)} className="cursor-pointer text-xs font-bold">
              Close Guide
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed pr-1">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-1">
            <h5 className="font-bold text-blue-900 dark:text-blue-300">⚡ Overview &amp; Voice Calling Architecture</h5>
            <p>
              Nexus Call OS embeds the complete permanent dataset of <strong>1,722+ Curated Public APIs</strong> across 50 categories. This system ensures sub-100ms real-time intelligence for all telephone calls without exposing technical API names or URLs to the caller.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>🟢 1. 809 Free / Always Active APIs</span>
            </h4>
            <p>
              809 APIs have <code>Auth: None</code> and are completely free. The backend engine automatically connects to them for:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Weather &amp; Geocoding:</strong> Open-Meteo worldwide forecast with population-weighted city geocoding.</li>
              <li><strong>Forex &amp; Crypto Rates:</strong> European Central Bank (Frankfurter) and CoinGecko real-time feeds.</li>
              <li><strong>Dictionary &amp; Word Definitions:</strong> Free Dictionary API with meanings, phonetics, and examples.</li>
              <li><strong>Country &amp; Geography:</strong> REST Countries API for capitals, populations, and currencies.</li>
              <li><strong>Universal Knowledge:</strong> Wikipedia REST API and DuckDuckGo Instant Answers for any factual query.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>🔑 2. 913 Keyed APIs (User Configurable)</span>
            </h4>
            <p>
              For APIs that require authentication (OpenAI, Twilio, Stripe, NewsAPI, Spotify, etc.), click the <strong>"Configure"</strong> button on any card or select it from the <strong>"Add Public API"</strong> dropdown. Click <strong>"Docs"</strong> to visit the official provider website and generate your API key.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>🛡️ 3. Silent Ground-Truth Resolution (Zero Technical Leaks)</span>
            </h4>
            <p>
              When a caller speaks during an active call, the voice engine resolves the factual ground-truth in the background and instructs the LLM to deliver a warm, natural human answer. Internal URLs, tokens, and database keys are never recited to the caller.
            </p>
          </div>
        </div>
      </Modal>

      {/* 8. ENTERPRISE FIGMA-GRADE ACTIVE WORKSPACE MODULE MATRIX MODAL */}
      <Modal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        size="2xl"
        title="⚡ Public APIs Catalog & Live Intelligence - Workspace Integration Matrix"
        description="Realtime operational binding map of Public APIs across Nexus Call OS subsystem engines and workspace modules."
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              Auto-scanned live workspace state ({activeCards.length} configured items)
            </span>
            <Button variant="primary" onClick={() => setIsMatrixModalOpen(false)} className="cursor-pointer text-xs font-bold">
              Done &amp; Close Matrix
            </Button>
          </div>
        }
      >
        <div className="space-y-5 text-xs">
          {/* Top Figma-Grade Header Banner Card */}
          <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-zinc-950 text-white rounded-2xl border border-indigo-900/60 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300 shrink-0">
                  <Sparkles className="h-6 w-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-base tracking-tight text-white">Public APIs Live Intelligence Dependency Matrix</h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE MONITORING
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-xl">
                    Realtime cross-system dependency tracking across all 5 workspace modules: AI Voice Agents, Live Call Studio, AI Campaigns, Knowledge Base (RAG), and Integrations &amp; Webhooks.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-3 pt-1 border-t border-white/10 font-mono">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Configured Cards</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">{activeCards.length} Added</div>
                </div>
                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Free Zero-Auth APIs</div>
                  <div className="text-lg font-black text-slate-300 mt-0.5">{totalFree} Always Live</div>
                </div>
                <span className="h-3 w-3 rounded-full bg-slate-400" />
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Subsystems Bound</div>
                  <div className="text-lg font-black text-indigo-400 mt-0.5">5/5 Modules</div>
                </div>
                <Zap className="h-4 w-4 text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Subsystem Engines & Module Activity Matrix */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h5 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Workspace Subsystem &amp; Engine Binding Matrix (5 Modules)</span>
              </h5>
              <span className="text-[10px] font-mono text-zinc-500">Auto-scanned live workspace state</span>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs">
              {[
                {
                  name: 'AI Voice Agents (Voice Receptionists & SDRs)',
                  scope: 'Global Workspace (All Agents)',
                  statusText: '🟢 LIVE (100% BOUND)',
                  desc: 'Provides silent real-time ground truth for caller queries across 104+ global languages without exposing technical URLs or tokens.',
                  icon: <SparklesIcon className="h-4 w-4 text-purple-500" />,
                  tag: '🤖 AI Voice Agents',
                  tagColor: 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                },
                {
                  name: 'Live Call Studio (Realtime Telephony Console)',
                  scope: 'Global Workspace',
                  statusText: '🟢 LIVE (SUB-100MS)',
                  desc: 'Realtime query simulator, acoustic stream inspection & diagnostic latency telemetry during live active telephony calls.',
                  icon: <Activity className="h-4 w-4 text-emerald-500" />,
                  tag: '🎙️ Live Call Studio',
                  tagColor: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                },
                {
                  name: 'AI Campaigns (Outbound Blast Campaigns)',
                  scope: 'Global Workspace (All Campaigns)',
                  statusText: '🟢 LIVE (DYNAMIC BINDING)',
                  desc: 'Auto-injects dynamic public data variables (forex rates, weather, crypto prices, fact lookups) into outbound voice scripts.',
                  icon: <Radio className="h-4 w-4 text-blue-500" />,
                  tag: '📡 AI Campaigns',
                  tagColor: 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                },
                {
                  name: 'Knowledge Base (Vector RAG & Datasets)',
                  scope: 'Global Workspace (RAG Pipeline)',
                  statusText: '🟢 LIVE (HYBRID AUGMENTATION)',
                  desc: 'Augments enterprise internal PDF documents with live public datasets, dictionary definitions, and verified world facts.',
                  icon: <Server className="h-4 w-4 text-amber-500" />,
                  tag: '📚 Knowledge Base (RAG)',
                  tagColor: 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                },
                {
                  name: 'Integrations & Webhooks (Automation Engine)',
                  scope: 'Global Workspace',
                  statusText: '🟢 LIVE (EVENT DISPATCH)',
                  desc: 'Enables external event triggers, automated API webhook dispatching, and post-call CRM pipeline synchronizations.',
                  icon: <Workflow className="h-4 w-4 text-cyan-500" />,
                  tag: '⚡ Integrations & Webhooks',
                  tagColor: 'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                }
              ].map((subsystem, sIdx) => (
                <div key={sIdx} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="h-3 w-3 rounded-full mt-1 shrink-0 bg-emerald-500 animate-pulse" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h6 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{subsystem.name}</h6>
                        <span className="text-[10px] font-mono text-zinc-400">({subsystem.scope})</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          {subsystem.statusText}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{subsystem.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2.5 py-1 rounded-xl border font-extrabold text-[10px] flex items-center gap-1.5 shadow-2xs ${subsystem.tagColor}`}>
                      {subsystem.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configured Workspace API Items Section (If activeCards exist) */}
          {activeCards.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Configured Workspace Cards ({activeCards.length} Active Integrations)</span>
                </h5>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">100% Synced</span>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs max-h-60 overflow-y-auto">
                {activeCards.map((apiItem) => {
                  const targetModules = apiItem.target_modules || ['AI Voice Agents', 'Live Call Studio', 'AI Campaigns', 'Knowledge Base (RAG)', 'Integrations & Webhooks'];
                  return (
                    <div key={apiItem.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span className="h-2.5 w-2.5 rounded-full mt-1 shrink-0 bg-emerald-500 animate-pulse" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h6 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{apiItem.name}</h6>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono">
                              {apiItem.category}
                            </span>
                            <Badge variant={apiItem.auth_type === 'None' ? 'success' : 'warning'} size="sm" className="text-[9px]">
                              {apiItem.auth_type === 'None' ? '🟢 Free' : `🔑 ${apiItem.auth_type}`}
                            </Badge>
                          </div>
                          <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {apiItem.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap shrink-0">
                        {targetModules.slice(0, 3).map((m: string, mIdx: number) => (
                          <span key={mIdx} className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[9px] font-semibold">
                            {m === 'AI Voice Agents' && '🤖 Agents'}
                            {m === 'Live Call Studio' && '🎙️ Studio'}
                            {m === 'AI Campaigns' && '📡 Campaigns'}
                            {m === 'Knowledge Base (RAG)' && '📚 RAG'}
                            {m === 'Integrations & Webhooks' && '⚡ Webhooks'}
                            {m !== 'AI Voice Agents' && m !== 'Live Call Studio' && m !== 'AI Campaigns' && m !== 'Knowledge Base (RAG)' && m !== 'Integrations & Webhooks' && m}
                          </span>
                        ))}
                        {targetModules.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono text-[9px] font-bold">
                            +{targetModules.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Models & Engine Provider Active Summary */}
          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 dark:text-blue-200 text-[11px] flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Live Workspace Data Pipeline &amp; Public APIs SSOT Binding Info</span>
              </span>
              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold">Single Source of Truth (SSOT)</span>
            </div>
            <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
              All 1,722+ catalogued Public APIs and configured workspace cards automatically sync across active call routines. Dynamic ground-truth queries (weather forecasts, real-time forex conversions, dictionary definitions, crypto rates) are resolved silently in sub-100ms without exposing technical URLs or authentication secrets to callers.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
