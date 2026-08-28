import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Phone, Mail, Trash2, Edit2, Check, Users, GitMerge, AlertCircle,
  Sparkles, Database, ChevronDown, ChevronUp, FileSpreadsheet, Eye, Download, UploadCloud,
  Folder, RefreshCw, ExternalLink, HardDrive, Layers, LayoutGrid, List, Search,
  CheckCircle, Undo2, Sliders, Variable
} from 'lucide-react';
import { DataTable, Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Contact } from '../types';
import { contactRepository, uploadRepository } from '../repository';
import { useToast } from '../components/ui/Toast';
import { FilePreviewModal, PreviewableFile } from '../components/ui/FilePreviewModal';

const countryCodes = [
  { code: '+1', flag: '🇺🇸', name: 'United States (+1)' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom (+44)' },
  { code: '+49', flag: '🇩🇪', name: 'Germany (+49)' },
  { code: '+33', flag: '🇫🇷', name: 'France (+33)' },
  { code: '+81', flag: '🇯🇵', name: 'Japan (+81)' },
  { code: '+61', flag: '🇦🇺', name: 'Australia (+61)' },
  { code: '+1-CA', flag: '🇨🇦', name: 'Canada (+1)' },
];

export const cleanFieldKey = (raw: string) => {
  return String(raw || '')
    .replace(/^custom_fields?:\s*/i, '')
    .replace(/^custom_fields?__/i, '')
    .replace(/^custom_field__/i, '')
    .replace(/^Dynamic Var:\s*/i, '')
    .replace(/^\{\{|\}\}$/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_');
};

export const QuickAttachDropdownPanel: React.FC<{
  title: string;
  count: number;
  subtitle: string;
  icon: React.ReactNode;
  theme: 'amber' | 'blue';
  items: Array<{ key: string; label: string; def: string; raw?: any }>;
  activeKeys: string[];
  onAttach: (key: string, def: string) => void;
}> = ({ title, count, subtitle, icon, theme, items, activeKeys, onAttach }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState('');

  if (items.length === 0) return null;

  const filteredItems = items.filter(
    (item) =>
      item.key.toLowerCase().includes(search.toLowerCase()) ||
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.def.toLowerCase().includes(search.toLowerCase())
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
              Click any field to attach
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {filteredItems.map((item, idx) => {
              const isAlreadyAdded = activeKeys.includes(item.key);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAlreadyAdded}
                  onClick={() => onAttach(item.key, item.def)}
                  className={`p-2 rounded-lg border text-left transition-all flex items-start justify-between gap-2 cursor-pointer ${
                    isAlreadyAdded
                      ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-60 cursor-not-allowed'
                      : isAmber
                      ? 'bg-amber-50/60 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border-amber-200 dark:border-amber-800/80 hover:border-amber-400'
                      : 'bg-blue-50/60 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-800/80 hover:border-blue-400'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        &#123;&#123;{item.key}&#125;&#125;
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {item.label}
                    </p>
                    {item.def && (
                      <p className="text-[9px] font-mono text-zinc-400 truncate mt-0.5">
                        Default: <strong className="text-zinc-600 dark:text-zinc-300">{item.def}</strong>
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5 ${
                      isAlreadyAdded
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                        : isAmber
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isAlreadyAdded ? '✓ Added' : '+ Attach'}
                  </span>
                </button>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="col-span-2 py-3 text-center text-xs text-zinc-400 italic">
                No matching {title.toLowerCase()} found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ComboboxValueInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options?: string[];
  placeholder?: string;
}> = ({ value, onChange, options = [], placeholder = 'Value' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(opt => !search || opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (options.length > 0) {
              setSearch('');
              setIsOpen(true);
            }
          }}
          className="w-full h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 pr-8 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
        />
        {options.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setSearch('');
              setIsOpen((prev) => !prev);
            }}
            className="absolute right-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 transition-colors cursor-pointer"
            title="Click to view all options"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
          </button>
        )}
      </div>

      {isOpen && options.length > 0 && (
        <div className="absolute z-50 right-0 top-full mt-1.5 min-w-[240px] max-w-[320px] w-max rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl py-1 text-xs">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
            <span>Detected Values ({options.length})</span>
            <span className="text-[9px] font-normal text-zinc-400">Click to select</span>
          </div>

          {options.length >= 2 && (
            <div className="p-1.5 border-b border-zinc-100 dark:border-zinc-800">
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-6 px-2 text-[11px] rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-center text-[11px] text-zinc-400">No matching value</div>
            ) : (
              filtered.map((opt, i) => {
                const isSelected = opt.toLowerCase() === value.toLowerCase();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    <span className="truncate pr-2">{opt}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ContactsView: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'contacts' | 'uploads'>('contacts');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploadedViewMode, setUploadedViewMode] = useState<'grid' | 'table'>('grid');
  const [uploadedSearch, setUploadedSearch] = useState<string>('');
  const [isLoadingUploads, setIsLoadingUploads] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const leadFileInputRef = useRef<HTMLInputElement>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCatalogKey, setSelectedCatalogKey] = useState<string>('');
  const [catalogSearchTerm, setCatalogSearchTerm] = useState<string>('');
  const [catalogTab, setCatalogTab] = useState<'all' | 'custom' | 'standard'>('all');
  const [fieldSearchTerm, setFieldSearchTerm] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const [countryPrefix, setCountryPrefix] = useState('+1');
  const [duplicateGroup, setDuplicateGroup] = useState<Contact[]>([]);

  const [customFieldCatalog, setCustomFieldCatalog] = useState<string[]>([]);
  const [newFieldKeyInput, setNewFieldKeyInput] = useState<string>('');
  const [newValueInput, setNewValueInput] = useState<string>('');

  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'new',
    tags: ['Inbound Lead'],
  });
  const [newCustomVars, setNewCustomVars] = useState<Array<{ key: string; value: string }>>([]);
  const [editCustomVars, setEditCustomVars] = useState<Array<{ key: string; value: string }>>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [syncingFileName, setSyncingFileName] = useState<string | null>(null);
  const [unimportingFileName, setUnimportingFileName] = useState<string | null>(null);
  const [customVarFilter, setCustomVarFilter] = useState('');

  const { addToast } = useToast();

  const [customValueHistory, setCustomValueHistory] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('nexus_field_value_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const saveCustomValueToHistory = (key: string, val: string) => {
    const cleanKey = key.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    const cleanVal = val.trim();
    if (!cleanKey || !cleanVal) return;
    setCustomValueHistory((prev) => {
      const existing = prev[cleanKey] || [];
      if (!existing.includes(cleanVal)) {
        const next = { ...prev, [cleanKey]: [...existing, cleanVal] };
        try {
          localStorage.setItem('nexus_field_value_history', JSON.stringify(next));
        } catch (e) {}
        return next;
      }
      return prev;
    });
  };

  const { registeredVariables, registeredDataFields, allRegisteredFields } = useMemo(() => {
    try {
      const saved = localStorage.getItem('nexus_custom_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        const vars = Array.isArray(parsed.variables) ? parsed.variables : [];
        const fields = Array.isArray(parsed.custom_fields) ? parsed.custom_fields : [];
        return {
          registeredVariables: vars,
          registeredDataFields: fields,
          allRegisteredFields: [...fields, ...vars]
        };
      }
    } catch (e) {}
    return { registeredVariables: [], registeredDataFields: [], allRegisteredFields: [] };
  }, [isAddModalOpen, isEditModalOpen, isCatalogModalOpen, isRefreshing]);

  const registeredDataFieldsList = useMemo(() => {
    return registeredDataFields.map((f: any) => {
      const key = cleanFieldKey(f.name || f.id || '');
      const label = f.display_name || key.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const def = f.default_value || '';
      return { key, label, def, raw: f };
    }).filter(item => Boolean(item.key));
  }, [registeredDataFields]);

  const registeredVariablesList = useMemo(() => {
    return registeredVariables.map((v: any) => {
      const key = cleanFieldKey(v.name || v.id || '');
      const label = v.display_name || key.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const def = v.default_value || '';
      return { key, label, def, raw: v };
    }).filter(item => Boolean(item.key));
  }, [registeredVariables]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await contactRepository.getAll();
      setContacts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load contacts.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUploadedFiles = async () => {
    setIsLoadingUploads(true);
    try {
      const files = await contactRepository.getUploadedFiles();
      setUploadedFiles(files);
    } catch (err: any) {
      console.error('Error loading uploaded contact files:', err);
    } finally {
      setIsLoadingUploads(false);
    }
  };

  useEffect(() => {
    loadContacts();
    loadUploadedFiles();
  }, []);

  const handleClearAllContacts = async () => {
    setIsClearing(true);
    try {
      const res = await contactRepository.clearAll();
      addToast({
        type: 'info',
        title: 'Database Cleared',
        description: `Cleared ${res.deleted_count || 0} contacts from database.`,
      });
      setIsClearAllModalOpen(false);
      await loadContacts();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Clear Failed',
        description: err.message || 'Could not clear contacts',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadContacts(), loadUploadedFiles()]);
      addToast({
        type: 'success',
        title: 'Contacts Refreshed',
        description: 'Contact directory and lead lists reloaded from database.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Refresh Failed',
        description: err.message || 'Could not refresh contacts.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSyncUploadedFile = async (filename: string) => {
    setSyncingFileName(filename);
    try {
      const res = await contactRepository.syncFile(filename);
      addToast({
        type: 'success',
        title: 'Contacts Imported',
        description: `Imported ${res.imported_count} contact(s) from "${filename}" into Directory.`,
      });
      await Promise.all([loadContacts(), loadUploadedFiles()]);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Import Failed',
        description: err.message || `Could not import "${filename}".`,
      });
    } finally {
      setSyncingFileName(null);
    }
  };

  const handleUnimportUploadedFile = async (filename: string) => {
    setUnimportingFileName(filename);
    try {
      const res = await contactRepository.unimportFile(filename);
      addToast({
        type: 'info',
        title: 'Removed from Directory',
        description: `Removed ${res.removed_count} contact(s) of "${filename}" from Directory.`,
      });
      await Promise.all([loadContacts(), loadUploadedFiles()]);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Removal Failed',
        description: err.message || `Could not remove contacts of "${filename}".`,
      });
    } finally {
      setUnimportingFileName(null);
    }
  };

  const handleDeleteUploadedFile = async (filename: string) => {
    try {
      await uploadRepository.deleteFile('contacts', filename, false);
      addToast({
        type: 'info',
        title: 'Moved to Recycle Bin',
        description: `"${filename}" moved to Recycle Bin.`,
      });
      await loadUploadedFiles();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        description: err.message,
      });
    }
  };

  const handleOpenFilePreview = (fileItem: any) => {
    setPreviewFile({
      filename: fileItem.filename,
      category: 'contacts',
      category_name: 'Contacts & Leads',
      url: fileItem.download_url,
      file_type: fileItem.file_type || 'CSV',
      size_formatted: fileItem.size_formatted,
      created_at: fileItem.created_at,
    });
  };

  const validateContactForm = (data: Partial<Contact>) => {
    const errs: Record<string, string> = {};
    if (!data.name?.trim()) errs.name = 'Contact name is required';
    if (!data.phone?.trim()) errs.phone = 'Phone number is required';
    if (!data.email?.trim()) errs.email = 'Email address is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateContact = async () => {
    if (!validateContactForm(newContact)) return;
    try {
      const fullPhone = newContact.phone?.startsWith('+')
        ? newContact.phone
        : `${countryPrefix} ${newContact.phone}`;

      const dynamicVars: Record<string, any> = {};
      newCustomVars.forEach(item => {
        if (item.key.trim()) {
          dynamicVars[item.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')] = item.value;
        }
      });

      const tagsVal = dynamicVars['tags'] || dynamicVars['tag'];
      const tagsList = tagsVal
        ? String(tagsVal).split(/[;,]/).map(t => t.trim()).filter(Boolean)
        : (newContact.tags || ['Inbound Lead']);

      const created = await contactRepository.create({
        name: newContact.name || '',
        email: newContact.email || '',
        phone: fullPhone,
        company: newContact.company || 'Enterprise Corp',
        leadScore: 75,
        status: (newContact.status as any) || 'new',
        tags: tagsList,
        custom_variables: dynamicVars,
      });

      setContacts((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setNewContact({ name: '', email: '', phone: '', company: '', status: 'new', tags: ['Inbound Lead'] });
      setNewCustomVars([]);
      setFormErrors({});
      addToast({
        type: 'success',
        title: 'Contact Created',
        description: `${created.name} added to directory with custom fields.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Creation Failed', description: err.message });
    }
  };

  const handleUpdateContact = async () => {
    if (!selectedContact) return;
    if (!validateContactForm(selectedContact)) return;
    try {
      const dynamicVars: Record<string, any> = {};
      editCustomVars.forEach(item => {
        const cleanKey = item.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        if (cleanKey) {
          dynamicVars[cleanKey] = item.value;
        }
      });

      // Preserve internal metadata if present (like source_file)
      const prevCv = selectedContact.custom_variables || {};
      if (prevCv.source_file && !dynamicVars.source_file) {
        dynamicVars.source_file = prevCv.source_file;
      }
      if (prevCv._source_file && !dynamicVars._source_file) {
        dynamicVars._source_file = prevCv._source_file;
      }

      const tagsVal = dynamicVars['tags'] || dynamicVars['tag'];
      const updatedTags = tagsVal
        ? String(tagsVal).split(/[;,]/).map(t => t.trim()).filter(Boolean)
        : (selectedContact.tags || []);

      const contactToUpdate = {
        ...selectedContact,
        tags: updatedTags,
        custom_variables: dynamicVars,
      };

      const updated = await contactRepository.update(selectedContact.id, contactToUpdate);
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelectedContact(null);
      setEditCustomVars([]);
      setIsEditModalOpen(false);
      addToast({
        type: 'success',
        title: 'Contact Saved',
        description: `Updated record and custom variables for ${updated.name}.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', description: err.message });
    }
  };

  const handleDeleteContact = async (id: string, name: string) => {
    const deletedContact = contacts.find((c) => c.id === id);
    if (!deletedContact) return;

    setContacts((prev) => prev.filter((c) => c.id !== id));

    try {
      await contactRepository.delete(id);
    } catch (err: any) {
      setContacts((prev) => [deletedContact, ...prev]);
      addToast({ type: 'error', title: 'Delete Failed', description: err.message });
      return;
    }

    addToast({
      type: 'info',
      title: 'Contact Removed',
      description: `Deleted ${name}.`,
      action: {
        label: 'Undo',
        onClick: async () => {
          try {
            const restored = await contactRepository.create(deletedContact);
            setContacts((prev) => [restored, ...prev]);
            addToast({ type: 'success', title: 'Contact Restored', description: `Restored ${name}.` });
          } catch (e: any) {
            addToast({ type: 'error', title: 'Undo Failed', description: e.message });
          }
        },
      },
    });
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await contactRepository.deleteBulk(ids);
      setContacts((prev) => prev.filter((c) => !ids.includes(c.id)));
      addToast({ type: 'success', title: 'Bulk Delete Complete', description: `Deleted ${ids.length} contacts.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Bulk Delete Failed', description: err.message });
    }
  };

  const handleBulkStatusChange = async (ids: string[], newStatus: string) => {
    try {
      await Promise.all(ids.map((id) => contactRepository.update(id, { status: newStatus as any })));
      setContacts((prev) =>
        prev.map((c) => (ids.includes(c.id) ? { ...c, status: newStatus as any } : c))
      );
      addToast({
        type: 'success',
        title: 'Bulk Update Complete',
        description: `Updated status to ${newStatus} for ${ids.length} contacts.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Bulk Update Failed', description: err.message });
    }
  };

  const handleDetectDuplicates = () => {
    // Detect matching email or phone
    const seenEmails = new Map<string, Contact>();
    const dupes: Contact[] = [];

    contacts.forEach((c) => {
      const email = c.email.toLowerCase();
      if (seenEmails.has(email)) {
        dupes.push(seenEmails.get(email)!);
        dupes.push(c);
      } else {
        seenEmails.set(email, c);
      }
    });

    if (dupes.length > 0) {
      setDuplicateGroup(dupes);
      setIsMergeModalOpen(true);
    } else {
      addToast({
        type: 'info',
        title: 'No Duplicates Found',
        description: 'All contact records have unique email and phone numbers.',
      });
    }
  };

  const handleMergeDuplicates = async () => {
    if (duplicateGroup.length < 2) return;
    const [primary, secondary] = duplicateGroup;

    try {
      await contactRepository.delete(secondary.id);
      setContacts((prev) => prev.filter((c) => c.id !== secondary.id));
      setIsMergeModalOpen(false);
      addToast({
        type: 'success',
        title: 'Contacts Merged',
        description: `Merged duplicate entry into primary record ${primary.name}.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Merge Failed', description: err.message });
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const res = await contactRepository.importCSVFile(file);
      await loadContacts();
      addToast({
        type: 'success',
        title: 'CSV Imported & Saved',
        description: `Imported ${res.imported_count} contact(s). Saved file to uploads/contacts/${res.file?.filename || ''}`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Import Failed', description: err.message });
    }
  };

  const filteredUploadedFiles = useMemo(() => {
    if (!uploadedSearch.trim()) return uploadedFiles;
    const q = uploadedSearch.toLowerCase().trim();
    return uploadedFiles.filter((f) => (f.filename || '').toLowerCase().includes(q));
  }, [uploadedFiles, uploadedSearch]);

  // Ignore standard UI top-level profile fields from custom variable boxes so they don't duplicate (Strictly 6 System Fields)
  const ignoredKeys = useMemo(
    () =>
      new Set([
        'name',
        'full_name',
        'contact_name',
        'customer_name',
        'first_name',
        'last_name',
        'phone',
        'phone_number',
        'mobile',
        'telephone',
        'email',
        'email_address',
        'company',
        'organization',
        'company_name',
        'status',
        'lead_status',
        'leadscore',
        'lead_score',
        'lead score',
        'score',
        'lastcalled',
        'last_called',
        'last called',
        'id',
        '_id',
        'created_at',
        'updated_at',
        'organization_id',
        'source_file',
        '_source_file',
        'source',
        '_source',
        'filename',
        'file_name',
        'source_filename',
        '_source_filename',
      ]),
    []
  );

  // Standard 6 Core CRM Fields from system (Always 6 fixed system fields)
  const standardCRMFieldDefinitions = useMemo(
    () => [
      { key: 'contact_name', label: 'Contact Name', source: 'name' as const, category: 'Standard CRM' },
      { key: 'phone_number', label: 'Phone Number', source: 'phone' as const, category: 'Standard CRM' },
      { key: 'email_address', label: 'Email Address', source: 'email' as const, category: 'Standard CRM' },
      { key: 'company', label: 'Company / Org', source: 'company' as const, category: 'Standard CRM' },
      { key: 'status', label: 'Lead Status', source: 'status' as const, category: 'Standard CRM' },
      { key: 'lead_score', label: 'Lead Score', source: 'leadScore' as const, category: 'Standard CRM' },
    ],
    []
  );

  const customVariableKeys = useMemo(() => {
    const keysSet = new Set<string>(customFieldCatalog);

    // 1. Add all registered Data Fields & Variables keys
    allRegisteredFields.forEach((item: any) => {
      const cleanKey = String(item.name || item.id || '').replace(/^custom_fields:\s*/i, '').replace(/^Dynamic Var:\s*/i, '').replace(/^\{\{|\}\}$/g, '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (cleanKey && !ignoredKeys.has(cleanKey)) {
        keysSet.add(cleanKey);
      }
    });

    // 2. Only include variables and parameters actually present in contacts / imported document
    contacts.forEach((c) => {
      if (c.custom_variables) {
        Object.keys(c.custom_variables).forEach((k) => {
          const lower = k.toLowerCase().trim();
          if (!ignoredKeys.has(lower) && !ignoredKeys.has(k) && k.trim()) {
            keysSet.add(k.trim());
          }
        });
      }
    });
    return Array.from(keysSet);
  }, [contacts, ignoredKeys, customFieldCatalog, allRegisteredFields]);

  const allDocumentFieldKeys = useMemo(() => {
    const standardKeys = standardCRMFieldDefinitions.map(s => s.key);
    return [...standardKeys, ...customVariableKeys];
  }, [standardCRMFieldDefinitions, customVariableKeys]);

  const existingVariableKeys = customVariableKeys;

  // Extract distinct saved values for each variable across the whole organization
  const valuesByKey = useMemo(() => {
    const map: Record<string, string[]> = {};

    // Helper to safely add unique value
    const addUniqueVal = (key: string, val: any) => {
      const cleanK = key.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
      const cleanV = String(val ?? '').trim();
      if (cleanK && cleanV && !ignoredKeys.has(cleanK)) {
        if (!map[cleanK]) map[cleanK] = [];
        if (!map[cleanK].includes(cleanV)) {
          map[cleanK].push(cleanV);
        }
      }
    };

    // 1. Standard CRM Fields
    standardCRMFieldDefinitions.forEach(({ key, source }) => {
      map[key] = [];
      contacts.forEach((c) => {
        let val = '';
        if (source === 'leadScore') {
          val = String(c.leadScore ?? 50);
        } else {
          val = String((c as any)[source] || '').trim();
        }
        if (val && !map[key].includes(val)) {
          map[key].push(val);
        }
      });
    });

    // 2. Custom Variables from contacts in database
    contacts.forEach((c) => {
      if (c.custom_variables) {
        Object.entries(c.custom_variables).forEach(([k, v]) => {
          addUniqueVal(k, v);
        });
      }
    });

    // 3. Registered Workspace Variables & Data Fields Fallback / Default Values + Allowed / Predefined Options
    allRegisteredFields.forEach((v: any) => {
      const possibleTags = [
        String(v.name || ''),
        String(v.tag || ''),
        String(v.id || ''),
        String(v.display_name || '').toLowerCase().replace(/[^a-z0-9_]/g, '_')
      ].map(t => t.replace(/^custom_fields:\s*/i, '').replace(/^Dynamic Var:\s*/i, '').replace(/^\{\{|\}\}$/g, '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'))
       .filter(Boolean);

      const uniqueTags = Array.from(new Set(possibleTags));

      uniqueTags.forEach(tag => {
        if (v.default_value) {
          addUniqueVal(tag, v.default_value);
        }
        if (v.allowed_values) {
          String(v.allowed_values)
            .split(/[,;\n]/)
            .map((s: string) => s.trim())
            .filter(Boolean)
            .forEach((opt: string) => addUniqueVal(tag, opt));
        }
        if (v.allowed_options) {
          (Array.isArray(v.allowed_options) ? v.allowed_options : String(v.allowed_options).split(/[,;\n]/))
            .map((s: string) => String(s).trim())
            .filter(Boolean)
            .forEach((opt: string) => addUniqueVal(tag, opt));
        }
        if (Array.isArray(v.options)) {
          v.options.forEach((opt: any) => addUniqueVal(tag, opt));
        }
      });
    });

    // 4. Values in active Edit form
    editCustomVars.forEach((item) => {
      if (item.key && item.value) {
        addUniqueVal(item.key, item.value);
      }
    });

    // 5. Values in active New Contact form
    newCustomVars.forEach((item) => {
      if (item.key && item.value) {
        addUniqueVal(item.key, item.value);
      }
    });

    // 6. Persistent Value History pool
    Object.entries(customValueHistory).forEach(([k, list]) => {
      if (Array.isArray(list)) {
        list.forEach((val) => addUniqueVal(k, val));
      }
    });

    return map;
  }, [contacts, ignoredKeys, standardCRMFieldDefinitions, allRegisteredFields, editCustomVars, newCustomVars, customValueHistory]);

  const handleAddNewFieldToCatalog = () => {
    const cleanKey = newFieldKeyInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanKey) return;
    if (!customFieldCatalog.includes(cleanKey)) {
      setCustomFieldCatalog((prev) => [...prev, cleanKey]);
    }
    setSelectedCatalogKey(cleanKey);
    setNewFieldKeyInput('');
    addToast({
      type: 'success',
      title: 'Field Created',
      description: `Created dynamic field {{${cleanKey}}}. You can now assign values to it.`,
    });
  };

  const getAssignedValueForField = (fieldKey: string): string => {
    if (!fieldKey) return '';
    if (selectedContact) {
      const customVar = editCustomVars.find((p) => p.key.toLowerCase() === fieldKey.toLowerCase());
      if (customVar && customVar.value !== undefined && customVar.value !== '') {
        return String(customVar.value);
      }
      if (fieldKey === 'contact_name' || fieldKey === 'name') return selectedContact.name || '';
      if (fieldKey === 'phone_number' || fieldKey === 'phone') return selectedContact.phone || '';
      if (fieldKey === 'email_address' || fieldKey === 'email') return selectedContact.email || '';
      if (fieldKey === 'company') return selectedContact.company || '';
      if (fieldKey === 'status') return selectedContact.status || '';
      if (fieldKey === 'lead_score' || fieldKey === 'leadscore') return String(selectedContact.leadScore ?? 50);
      if (fieldKey === 'tags' || fieldKey === 'tag') {
        return Array.isArray(selectedContact.tags) ? selectedContact.tags.join('; ') : String(selectedContact.tags || '');
      }
      if (selectedContact.custom_variables?.[fieldKey] !== undefined && selectedContact.custom_variables?.[fieldKey] !== '') {
        return String(selectedContact.custom_variables[fieldKey]);
      }
    } else {
      const customVar = newCustomVars.find((p) => p.key.toLowerCase() === fieldKey.toLowerCase());
      if (customVar && customVar.value !== undefined && customVar.value !== '') {
        return String(customVar.value);
      }
      if (fieldKey === 'contact_name' || fieldKey === 'name') return newContact.name || '';
      if (fieldKey === 'phone_number' || fieldKey === 'phone') return newContact.phone || '';
      if (fieldKey === 'email_address' || fieldKey === 'email') return newContact.email || '';
      if (fieldKey === 'company') return newContact.company || '';
      if (fieldKey === 'status') return newContact.status || '';
      if (fieldKey === 'lead_score' || fieldKey === 'leadscore') return String(newContact.leadScore ?? 50);
      if (fieldKey === 'tags' || fieldKey === 'tag') {
        return Array.isArray(newContact.tags) ? newContact.tags.join('; ') : String(newContact.tags || '');
      }
    }
    return '';
  };

  const handleAssignValueToField = (fieldKey: string, val: string) => {
    if (!fieldKey) return;
    const cleanVal = val.trim();
    if (!cleanVal) return;

    const previousVal = getAssignedValueForField(fieldKey);
    if (previousVal && previousVal.trim()) {
      saveCustomValueToHistory(fieldKey, previousVal.trim());
    }
    saveCustomValueToHistory(fieldKey, cleanVal);

    if (selectedContact) {
      setEditCustomVars((prev) => {
        const exists = prev.find((p) => p.key.toLowerCase() === fieldKey.toLowerCase());
        if (exists) {
          return prev.map((p) => (p.key.toLowerCase() === fieldKey.toLowerCase() ? { ...p, value: cleanVal } : p));
        }
        return [...prev, { key: fieldKey, value: cleanVal }];
      });

      if (fieldKey === 'contact_name' || fieldKey === 'name') {
        setSelectedContact((prev) => (prev ? { ...prev, name: cleanVal } : null));
      } else if (fieldKey === 'phone_number' || fieldKey === 'phone') {
        setSelectedContact((prev) => (prev ? { ...prev, phone: cleanVal } : null));
      } else if (fieldKey === 'email_address' || fieldKey === 'email') {
        setSelectedContact((prev) => (prev ? { ...prev, email: cleanVal } : null));
      } else if (fieldKey === 'company') {
        setSelectedContact((prev) => (prev ? { ...prev, company: cleanVal } : null));
      } else if (fieldKey === 'status') {
        setSelectedContact((prev) => (prev ? { ...prev, status: cleanVal as any } : null));
      } else if (fieldKey === 'lead_score' || fieldKey === 'leadscore') {
        setSelectedContact((prev) => (prev ? { ...prev, leadScore: parseInt(cleanVal, 10) || 50 } : null));
      } else if (fieldKey === 'tags' || fieldKey === 'tag') {
        setSelectedContact((prev) => (prev ? { ...prev, tags: cleanVal.split(/[;,]/).map((t) => t.trim()).filter(Boolean) } : null));
      }
    } else {
      setNewCustomVars((prev) => {
        const exists = prev.find((p) => p.key.toLowerCase() === fieldKey.toLowerCase());
        if (exists) {
          return prev.map((p) => (p.key.toLowerCase() === fieldKey.toLowerCase() ? { ...p, value: cleanVal } : p));
        }
        return [...prev, { key: fieldKey, value: cleanVal }];
      });

      if (fieldKey === 'contact_name' || fieldKey === 'name') {
        setNewContact((prev) => ({ ...prev, name: cleanVal }));
      } else if (fieldKey === 'phone_number' || fieldKey === 'phone') {
        setNewContact((prev) => ({ ...prev, phone: cleanVal }));
      } else if (fieldKey === 'email_address' || fieldKey === 'email') {
        setNewContact((prev) => ({ ...prev, email: cleanVal }));
      } else if (fieldKey === 'company') {
        setNewContact((prev) => ({ ...prev, company: cleanVal }));
      } else if (fieldKey === 'status') {
        setNewContact((prev) => ({ ...prev, status: cleanVal as any }));
      } else if (fieldKey === 'lead_score' || fieldKey === 'leadscore') {
        setNewContact((prev) => ({ ...prev, leadScore: parseInt(cleanVal, 10) || 50 }));
      } else if (fieldKey === 'tags' || fieldKey === 'tag') {
        setNewContact((prev) => ({ ...prev, tags: cleanVal.split(/[;,]/).map((t) => t.trim()).filter(Boolean) }));
      }
    }

    addToast({
      type: 'success',
      title: 'Value Assigned',
      description: `Assigned {{${fieldKey}}} = "${cleanVal}"`,
    });
  };

  const handleExportContacts = (dataToExport: Contact[], selectedIds: string[]) => {
    const rows = selectedIds.length > 0
      ? dataToExport.filter((r) => selectedIds.includes(r.id))
      : dataToExport;

    if (rows.length === 0) {
      addToast({ type: 'warning', title: 'No contacts to export' });
      return;
    }

    // Gather all dynamic custom variable keys present across these contacts
    const customKeysSet = new Set<string>();
    rows.forEach((r) => {
      if (r.custom_variables) {
        Object.keys(r.custom_variables).forEach((k) => {
          if (!ignoredKeys.has(k.toLowerCase()) && r.custom_variables[k] !== undefined && r.custom_variables[k] !== '') {
            customKeysSet.add(k);
          }
        });
      }
    });
    const customKeys = Array.from(customKeysSet);

    const headers = [
      'contact_name',
      'phone_number',
      'email_address',
      'company',
      'status',
      'lead_score',
      ...customKeys,
    ];

    const csvRows = rows.map((r) => {
      const baseValues = [
        `"${String(r.name || '').replace(/"/g, '""')}"`,
        `"${String(r.phone || '').replace(/"/g, '""')}"`,
        `"${String(r.email || '').replace(/"/g, '""')}"`,
        `"${String(r.company || '').replace(/"/g, '""')}"`,
        `"${String(r.status || 'new').replace(/"/g, '""')}"`,
        `"${String(r.leadScore ?? 50).replace(/"/g, '""')}"`,
      ];
      const customValues = customKeys.map((k) => {
        const val = r.custom_variables ? r.custom_variables[k] : '';
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      });
      return [...baseValues, ...customValues].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_contacts_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Contacts Exported',
      description: `Exported ${rows.length} contact(s) with ${customKeys.length} dynamic custom fields.`,
    });
  };

  const columns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Contact Name',
      sortable: true,
      render: (row) => {
        const rowTags = Array.isArray(row.tags) && row.tags.length > 0
          ? row.tags
          : (row.custom_variables?.tags || row.custom_variables?.tag
            ? String(row.custom_variables.tags || row.custom_variables.tag).split(/[;,]/).map(t => t.trim()).filter(Boolean)
            : []);

        return (
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {row.name[0]?.toUpperCase() || 'C'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs whitespace-nowrap">{row.name}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-zinc-400 whitespace-nowrap">{row.company || 'Direct Contact'}</span>
                {rowTags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {rowTags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium">
                        {String(t)}
                      </span>
                    ))}
                    {rowTags.length > 2 && (
                      <span className="text-[9px] text-zinc-400">+{rowTags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'Phone Number',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
          <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <span>{row.phone}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email Address',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap truncate max-w-[170px]" title={row.email}>
          <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">{row.email || '—'}</span>
        </div>
      ),
    },
    {
      key: 'leadScore',
      header: 'Lead Score',
      sortable: true,
      render: (row) => (
        <div className="whitespace-nowrap flex items-center gap-1">
          <span
            className={`font-mono font-bold text-xs ${
              row.leadScore >= 80
                ? 'text-emerald-600 dark:text-emerald-400'
                : row.leadScore >= 50
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-zinc-400'
            }`}
          >
            {row.leadScore}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">/ 100</span>
        </div>
      ),
    },
    {
      key: 'custom_variables',
      header: 'Variables',
      render: (row) => {
        const cv = row.custom_variables || {};
        const customKeys = Object.keys(cv).filter(
          k => !ignoredKeys.has(k) && !ignoredKeys.has(k.toLowerCase()) && cv[k] !== undefined && cv[k] !== ''
        );
        const count = customKeys.length;
        if (count === 0) {
          return <span className="text-[11px] text-zinc-400 whitespace-nowrap">0 Fields</span>;
        }
        return (
          <div className="whitespace-nowrap">
            <button
              type="button"
              onClick={() => {
                setSelectedContact({ ...row });
                const initialVars = customKeys.map(k => ({ key: k, value: String(cv[k] ?? '') }));
                setEditCustomVars(initialVars);
                setCustomVarFilter('');
                setIsEditModalOpen(true);
              }}
              title={customKeys.map(k => `${k}: ${cv[k]}`).join('\n')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/70 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 transition-all hover:scale-105 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Sparkles className="h-3 w-3 text-blue-500 shrink-0" />
              <span>{count} {count === 1 ? 'Variable' : 'Variables'}</span>
            </button>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => {
        const variants: Record<Contact['status'], any> = {
          converted: 'success',
          qualified: 'primary',
          contacted: 'warning',
          new: 'default',
          unreachable: 'danger',
        };
        return (
          <div className="whitespace-nowrap">
            <Badge variant={variants[row.status] || 'default'} size="sm">{row.status}</Badge>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <button
            type="button"
            title="Edit Contact & Variables"
            onClick={() => {
              setSelectedContact({ ...row });
              const cv = row.custom_variables || {};
              const initialVars = Object.keys(cv)
                .filter(k => !ignoredKeys.has(k) && !ignoredKeys.has(k.toLowerCase()) && cv[k] !== undefined && cv[k] !== '')
                .map(k => ({ key: k, value: String(cv[k] ?? '') }));
              setEditCustomVars(initialVars);
              setCustomVarFilter('');
              setIsEditModalOpen(true);
            }}
            className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors shadow-xs cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Delete Contact"
            onClick={() => handleDeleteContact(row.id, row.name)}
            className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 transition-colors shadow-xs cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Contact Directory & Leads</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage target customer leads, CRM sync entries, and dynamic business parameters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Reload contacts and files from database"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          {activeTab === 'contacts' && (
            <>
              {contacts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsClearAllModalOpen(true)}
                  className="border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Clear All ({contacts.length})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                leftIcon={<GitMerge className="h-4 w-4" />}
                onClick={handleDetectDuplicates}
              >
                Detect Duplicates
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setNewContact({ name: '', email: '', phone: '', company: '', status: 'new', tags: ['Inbound Lead'] });
                  setNewCustomVars([]);
                  setCustomVarFilter('');
                  setFormErrors({});
                  setIsAddModalOpen(true);
                }}
              >
                Add Contact
              </Button>
            </>
          )}

          {activeTab === 'uploads' && (
            <>
              <input
                type="file"
                ref={leadFileInputRef}
                accept=".csv,.txt,.tsv,.xlsx,.xls,.json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    handleImportFile(f).then(() => loadUploadedFiles());
                  }
                }}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoadingUploads ? 'animate-spin' : ''}`} />}
                onClick={loadUploadedFiles}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UploadCloud className="h-4 w-4" />}
                onClick={() => leadFileInputRef.current?.click()}
              >
                Upload & Import Leads File
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'contacts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>All Leads</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === 'contacts'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {contacts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('uploads');
              loadUploadedFiles();
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'uploads'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Uploaded Lead Files</span>
            <span
              className={`text-[10px] font-mono font-medium hidden sm:inline ${
                activeTab === 'uploads' ? 'text-blue-100' : 'text-zinc-400'
              }`}
            >
              (uploads/contacts/)
            </span>
            {uploadedFiles.length > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'uploads'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {uploadedFiles.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content 1: Contacts Directory DataTable */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          {/* Banner when workspace has 0 contacts but lead files exist in uploads/contacts/ */}
          {contacts.length === 0 && uploadedFiles.length > 0 && !isLoading && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Found {uploadedFiles.length} Lead File{uploadedFiles.length > 1 ? 's' : ''} in <span className="font-mono text-blue-600 dark:text-blue-400">uploads/contacts/</span>
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Your active directory is currently empty. Would you like to import leads from <strong className="text-zinc-800 dark:text-zinc-200">{uploadedFiles[0]?.filename}</strong>?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('uploads')}
                  className="text-xs"
                >
                  View Files
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={syncingFileName === uploadedFiles[0]?.filename}
                  onClick={() => handleSyncUploadedFile(uploadedFiles[0]?.filename)}
                  leftIcon={<UploadCloud className="h-4 w-4" />}
                  className="text-xs"
                >
                  {syncingFileName === uploadedFiles[0]?.filename ? 'Importing...' : `Import Leads`}
                </Button>
              </div>
            </div>
          )}

          <DataTable
            columns={columns}
            data={contacts}
            isLoading={isLoading}
            error={error}
            onRetry={loadContacts}
            onBulkDelete={handleBulkDelete}
            onBulkStatusChange={handleBulkStatusChange}
            bulkStatusOptions={['new', 'contacted', 'qualified', 'converted', 'unreachable']}
            onImportFile={handleImportFile}
            onExport={handleExportContacts}
            searchPlaceholder="Search contacts by name, email, phone, company, variables..."
            filterableKeys={[
              {
                label: 'Status',
                key: 'status',
                options: ['new', 'contacted', 'qualified', 'converted', 'unreachable'],
              },
            ]}
          />
        </div>
      )}

      {/* Tab Content 2: Uploaded Lead Files in uploads/contacts/ */}
      {activeTab === 'uploads' && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 space-y-4 shadow-xs">
          {/* Header & Controls Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Uploaded Lead CSV Files
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                  {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'} stored
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Physical CSV spreadsheets saved in <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">uploads/contacts/</span> with live interactive preview &amp; 1-click sync.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search input */}
              <div className="w-48 sm:w-56">
                <Input
                  type="text"
                  placeholder="Filter lead files..."
                  value={uploadedSearch}
                  onChange={(e) => setUploadedSearch(e.target.value)}
                  leftIcon={<Search className="h-3.5 w-3.5" />}
                  className="h-8 text-xs"
                />
              </div>

              {/* View Mode Toggle: Grid vs Table */}
              <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5 bg-zinc-50 dark:bg-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setUploadedViewMode('grid')}
                  className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
                    uploadedViewMode === 'grid'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title="Grid / Card View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setUploadedViewMode('table')}
                  className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
                    uploadedViewMode === 'table'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title="Table / List View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {isLoadingUploads ? (
            <div className="py-16 text-center">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Loading uploads/contacts/ files...</p>
            </div>
          ) : filteredUploadedFiles.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <FileSpreadsheet className="h-10 w-10 text-zinc-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {uploadedSearch ? `No files matching "${uploadedSearch}"` : 'No lead files uploaded yet'}
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto mb-4">
                {uploadedSearch
                  ? 'Try clearing your search query to see all stored CSV files.'
                  : 'You can import a CSV lead spreadsheet to automatically save it into uploads/contacts/ and load contacts into the system.'}
              </p>
              {!uploadedSearch && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<UploadCloud className="h-4 w-4" />}
                  onClick={() => leadFileInputRef.current?.click()}
                >
                  Upload Sample CSV Leads
                </Button>
              )}
            </div>
          ) : uploadedViewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredUploadedFiles.map((file) => {
                const matchingContacts = contacts.filter((c) => {
                  const cv = c.custom_variables || {};
                  const sf = cv.source_file || cv._source_file;
                  return sf === file.filename;
                });
                const count = matchingContacts.length > 0 ? matchingContacts.length : (file.imported_count || 0);
                const isImported = count > 0 || Boolean(file.is_imported);

                return (
                  <div
                    key={file.id || file.filename}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isImported
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1.5 mb-3">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          uploads/contacts/
                        </span>
                        {isImported ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            <span>In Directory ({count} leads)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            Not in Directory
                          </span>
                        )}
                      </div>

                      {/* File Icon & Info */}
                      <div
                        onClick={() => handleOpenFilePreview(file)}
                        className="flex items-start gap-3 cursor-pointer"
                        title="Click to Live Preview Table"
                      >
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                            isImported
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate hover:text-blue-600 transition-colors"
                            title={file.filename}
                          >
                            {file.filename}
                          </h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                            {file.size_formatted} • {file.file_type || 'CSV'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between gap-2">
                      {isImported ? (
                        <Button
                          size="xs"
                          variant="danger"
                          disabled={unimportingFileName === file.filename}
                          onClick={() => handleUnimportUploadedFile(file.filename)}
                          leftIcon={<Undo2 className="h-3.5 w-3.5" />}
                          className="text-xs flex-1 cursor-pointer bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                          title="Remove all contacts of this file from Directory"
                        >
                          {unimportingFileName === file.filename ? 'Removing...' : `Back from Import (${count})`}
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="primary"
                          disabled={syncingFileName === file.filename}
                          onClick={() => handleSyncUploadedFile(file.filename)}
                          leftIcon={<UploadCloud className="h-3.5 w-3.5" />}
                          className="text-xs flex-1 cursor-pointer font-semibold shadow-xs"
                          title="Import rows from this file into Contact Directory"
                        >
                          {syncingFileName === file.filename ? 'Importing...' : 'Import to Directory'}
                        </Button>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenFilePreview(file)}
                          className="p-1.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Live Table Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <a
                          href={`/api/uploads/contacts/${file.filename}?download=true`}
                          download={file.filename}
                          className="p-1.5 text-zinc-400 hover:text-emerald-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Download CSV"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteUploadedFile(file.filename)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Delete File"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-2.5 px-3">File Name</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Directory Path</th>
                    <th className="py-2.5 px-3">Format</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredUploadedFiles.map((file) => {
                    const matchingContacts = contacts.filter((c) => {
                      const cv = c.custom_variables || {};
                      const sf = cv.source_file || cv._source_file;
                      return sf === file.filename;
                    });
                    const count = matchingContacts.length > 0 ? matchingContacts.length : (file.imported_count || 0);
                    const isImported = count > 0 || Boolean(file.is_imported);

                    return (
                      <tr key={file.id || file.filename} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          <div
                            onClick={() => handleOpenFilePreview(file)}
                            className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                            title="Click to Live Preview Table"
                          >
                            <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span className="truncate max-w-xs">{file.filename}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {isImported ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                              <span>In Directory ({count} leads)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                              Not in Directory
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            uploads/contacts/
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-500">{file.file_type || 'CSV'}</td>
                        <td className="py-2.5 px-3 font-mono text-zinc-500">{file.size_formatted}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            {isImported ? (
                              <button
                                type="button"
                                disabled={unimportingFileName === file.filename}
                                onClick={() => handleUnimportUploadedFile(file.filename)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                                title="Remove rows from Contact Directory (Back from Import)"
                              >
                                <Undo2 className="h-3.5 w-3.5" />
                                <span>{unimportingFileName === file.filename ? 'Removing...' : `Back from Import (${count})`}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={syncingFileName === file.filename}
                                onClick={() => handleSyncUploadedFile(file.filename)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                                title="Import rows from this file into Contact Directory"
                              >
                                <UploadCloud className="h-3.5 w-3.5" />
                                <span>{syncingFileName === file.filename ? 'Importing...' : 'Import to Directory'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenFilePreview(file)}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                              title="Live Table Preview"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Live Preview</span>
                            </button>
                            <a
                              href={`/api/uploads/contacts/${file.filename}?download=true`}
                              download={file.filename}
                              className="p-1 text-zinc-400 hover:text-emerald-600 transition-colors"
                              title="Download CSV"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteUploadedFile(file.filename)}
                              className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete File (Move to Recycle Bin)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Contact Modal with Country Selector (Wider 2xl Modal) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Contact"
        description="Enter customer lead credentials and dynamic business variables."
        maxWidth="2xl"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Database className="h-4 w-4 text-blue-500" />}
              onClick={() => {
                setSelectedCatalogKey(allDocumentFieldKeys[0] || '');
                setCatalogSearchTerm('');
                setFieldSearchTerm('');
                setIsCatalogModalOpen(true);
              }}
            >
              Explore Variables & Fields ({allDocumentFieldKeys.length} Available)
            </Button>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateContact} leftIcon={<Check className="h-4 w-4" />}>
                Add Contact
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Eleanor Vance"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              error={formErrors.name}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="eleanor@acme.com"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              error={formErrors.email}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Phone Number & Country
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={countryPrefix}
                  onChange={(e) => setCountryPrefix(e.target.value)}
                  className="h-9 px-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                >
                  {countryCodes.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <div className="flex-1">
                  <Input
                    placeholder="(555) 234-5678"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    error={formErrors.phone}
                  />
                </div>
              </div>
            </div>

            <Input
              label="Company"
              placeholder="Acme Corp"
              value={newContact.company}
              onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Lead Status"
              options={[
                { value: 'new', label: 'New Lead' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'qualified', label: 'Qualified' },
                { value: 'converted', label: 'Converted' },
                { value: 'unreachable', label: 'Unreachable' },
              ]}
              value={newContact.status as any}
              onChange={(e) => setNewContact({ ...newContact, status: e.target.value as any })}
            />
            <Input
              label="Lead Score (0 - 100)"
              type="number"
              min={0}
              max={100}
              placeholder="85"
              value={String(newContact.leadScore ?? 50)}
              onChange={(e) =>
                setNewContact({
                  ...newContact,
                  leadScore: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                })
              }
            />
          </div>

          {/* Dynamic Custom Variables Section */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" /> Dynamic Custom Variables ({newCustomVars.length} Fields)
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Custom parameters resolved dynamically in AI prompt templates via &#123;&#123;variable&#125;&#125;.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                leftIcon={<Plus className="h-3 w-3" />}
                onClick={() => setNewCustomVars((prev) => [...prev, { key: '', value: '' }])}
              >
                Add Field
              </Button>
            </div>

            {/* Separate Collapsible Dropdown Panels for Data Fields and Variables */}
            {allRegisteredFields.length > 0 && (
              <div className="space-y-2.5">
                <QuickAttachDropdownPanel
                  title="CRM Data Fields"
                  count={registeredDataFieldsList.length}
                  subtitle="Schema attributes & CRM fields (e.g. alternate phone, doctor, carrier)"
                  icon={<Sliders className="h-4 w-4" />}
                  theme="amber"
                  items={registeredDataFieldsList}
                  activeKeys={newCustomVars.map(cv => cv.key)}
                  onAttach={(key, def) => {
                    setNewCustomVars(prev => [...prev, { key, value: def }]);
                    addToast(`Attached {{${key}}}`, 'success');
                  }}
                />

                <QuickAttachDropdownPanel
                  title="Workspace Dynamic Variables"
                  count={registeredVariablesList.length}
                  subtitle="Dynamic workspace variables & prompt tokens (e.g. appointment date, retry count)"
                  icon={<Variable className="h-4 w-4" />}
                  theme="blue"
                  items={registeredVariablesList}
                  activeKeys={newCustomVars.map(cv => cv.key)}
                  onAttach={(key, def) => {
                    setNewCustomVars(prev => [...prev, { key, value: def }]);
                    addToast(`Attached {{${key}}}`, 'success');
                  }}
                />
              </div>
            )}

            {newCustomVars.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-400">
                No custom fields added yet. Click &quot;Add Field&quot; to attach custom business parameters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {newCustomVars.map((cv, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold uppercase text-blue-600 dark:text-blue-400">
                        {cv.key ? `{{${cv.key}}}` : 'New Parameter'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewCustomVars((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-zinc-400 hover:text-red-500 transition-colors p-0.5"
                        title="Remove variable"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Input
                        placeholder="Key (e.g. token_number)"
                        value={cv.key}
                        onChange={(e) => {
                          const updated = [...newCustomVars];
                          updated[idx].key = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                          setNewCustomVars(updated);
                        }}
                      />
                      <ComboboxValueInput
                        placeholder="Value (e.g. 101)"
                        value={cv.value}
                        options={valuesByKey[cv.key] || []}
                        onChange={(val) => {
                          const updated = [...newCustomVars];
                          updated[idx].value = val;
                          setNewCustomVars(updated);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Contact Modal (Wider 2xl Modal) */}
      {selectedContact && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Contact: ${selectedContact.name}`}
          description="Update CRM profile information and custom business variables."
          maxWidth="2xl"
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Database className="h-4 w-4 text-blue-500" />}
                onClick={() => {
                  setSelectedCatalogKey(allDocumentFieldKeys[0] || '');
                  setCatalogSearchTerm('');
                  setFieldSearchTerm('');
                  setIsCatalogModalOpen(true);
                }}
              >
                Explore Variables & Fields ({allDocumentFieldKeys.length} Available)
              </Button>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleUpdateContact} leftIcon={<Check className="h-4 w-4" />}>
                  Save Changes
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={selectedContact.name}
                onChange={(e) => setSelectedContact({ ...selectedContact, name: e.target.value })}
              />
              <Input
                label="Email Address"
                value={selectedContact.email}
                onChange={(e) => setSelectedContact({ ...selectedContact, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                value={selectedContact.phone}
                onChange={(e) => setSelectedContact({ ...selectedContact, phone: e.target.value })}
              />
              <Input
                label="Company"
                value={selectedContact.company}
                onChange={(e) => setSelectedContact({ ...selectedContact, company: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Lead Status"
                options={[
                  { value: 'new', label: 'New Lead' },
                  { value: 'contacted', label: 'Contacted' },
                  { value: 'qualified', label: 'Qualified' },
                  { value: 'converted', label: 'Converted' },
                  { value: 'unreachable', label: 'Unreachable' },
                ]}
                value={selectedContact.status}
                onChange={(e) => setSelectedContact({ ...selectedContact, status: e.target.value as any })}
              />
              <Input
                label="Lead Score (0 - 100)"
                type="number"
                min={0}
                max={100}
                value={String(selectedContact.leadScore ?? 50)}
                onChange={(e) =>
                  setSelectedContact({
                    ...selectedContact,
                    leadScore: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                  })
                }
              />
            </div>

            {/* Dynamic Custom Variables / Business Data Editor */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" /> Dynamic Custom Variables ({editCustomVars.length} Fields)
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Custom parameters resolved dynamically in AI prompt templates via &#123;&#123;variable&#125;&#125;.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="h-3 w-3" />}
                  onClick={() => setEditCustomVars(prev => [...prev, { key: '', value: '' }])}
                >
                  Add Field
                </Button>
              </div>

              {/* Separate Collapsible Dropdown Panels for Data Fields and Variables */}
              {allRegisteredFields.length > 0 && (
                <div className="space-y-2.5">
                  <QuickAttachDropdownPanel
                    title="CRM Data Fields"
                    count={registeredDataFieldsList.length}
                    subtitle="Schema attributes & CRM fields (e.g. alternate phone, doctor, carrier)"
                    icon={<Sliders className="h-4 w-4" />}
                    theme="amber"
                    items={registeredDataFieldsList}
                    activeKeys={editCustomVars.map(cv => cv.key)}
                    onAttach={(key, def) => {
                      setEditCustomVars(prev => [...prev, { key, value: def }]);
                      addToast(`Attached {{${key}}}`, 'success');
                    }}
                  />

                  <QuickAttachDropdownPanel
                    title="Workspace Dynamic Variables"
                    count={registeredVariablesList.length}
                    subtitle="Dynamic workspace variables & prompt tokens (e.g. appointment date, retry count)"
                    icon={<Variable className="h-4 w-4" />}
                    theme="blue"
                    items={registeredVariablesList}
                    activeKeys={editCustomVars.map(cv => cv.key)}
                    onAttach={(key, def) => {
                      setEditCustomVars(prev => [...prev, { key, value: def }]);
                      addToast(`Attached {{${key}}}`, 'success');
                    }}
                  />
                </div>
              )}

              {editCustomVars.length > 4 && (
                <Input
                  placeholder="Filter custom fields (e.g. loan, token, doctor)..."
                  value={customVarFilter}
                  onChange={(e) => setCustomVarFilter(e.target.value)}
                />
              )}

              {editCustomVars.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-400">
                  No custom fields attached to this contact. Click &quot;Add Field&quot; to add business variables.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {editCustomVars
                    .map((cv, originalIdx) => ({ cv, originalIdx }))
                    .filter(
                      ({ cv }) =>
                        !customVarFilter ||
                        cv.key.toLowerCase().includes(customVarFilter.toLowerCase()) ||
                        cv.value.toLowerCase().includes(customVarFilter.toLowerCase())
                    )
                    .map(({ cv, originalIdx }) => (
                      <div
                        key={originalIdx}
                        className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 space-y-1.5 relative shadow-2xs hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/60">
                            {cv.key ? `{{${cv.key}}}` : 'New Parameter'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditCustomVars((prev) => prev.filter((_, i) => i !== originalIdx))}
                            className="text-zinc-400 hover:text-red-500 transition-colors p-0.5"
                            title="Remove variable"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <Input
                            placeholder="Key"
                            value={cv.key}
                            onChange={(e) => {
                              const updated = [...editCustomVars];
                              updated[originalIdx].key = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                              setEditCustomVars(updated);
                            }}
                          />
                          <ComboboxValueInput
                            placeholder="Value"
                            value={cv.value}
                            options={valuesByKey[cv.key] || []}
                            onChange={(val) => {
                              const updated = [...editCustomVars];
                              updated[originalIdx].value = val;
                              setEditCustomVars(updated);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Organization Data Catalog & Field Values Inspector Modal */}
      <Modal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        title="Document Fields & Dynamic Variables"
        description="All fields detected from your imported lead document and custom variables registered for your workspace."
        maxWidth="3xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {allDocumentFieldKeys.length} Document Field{allDocumentFieldKeys.length !== 1 ? 's' : ''} Detected ({standardCRMFieldDefinitions.length} Standard CRM + {customVariableKeys.length} Dynamic Custom)
            </span>
            <Button variant="primary" size="sm" onClick={() => setIsCatalogModalOpen(false)}>
              Done
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Top Summary Banner */}
          <div className="p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                100% Document Schema Captured ({allDocumentFieldKeys.length} Fields Total)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
                {standardCRMFieldDefinitions.length} Standard CRM
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-semibold border border-blue-300 dark:border-blue-800">
                {customVariableKeys.length} Dynamic Custom
              </span>
            </div>
          </div>

          {/* Top Bar: Add New Dynamic Field */}
          <div className="flex items-center gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Type new variable name (e.g. discount_code, appointment_time, notes)..."
                value={newFieldKeyInput}
                onChange={(e) => setNewFieldKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewFieldToCatalog();
                  }
                }}
                className="w-full h-8 px-3 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              />
            </div>
            <Button
              type="button"
              size="xs"
              variant="primary"
              onClick={handleAddNewFieldToCatalog}
              disabled={!newFieldKeyInput.trim()}
              leftIcon={<Plus className="h-3 w-3" />}
            >
              Add Field
            </Button>
          </div>

          {/* Sub-tabs for Fields Filter */}
          <div className="flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <button
              type="button"
              onClick={() => setCatalogTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                catalogTab === 'all'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              All Fields ({allDocumentFieldKeys.length})
            </button>
            <button
              type="button"
              onClick={() => setCatalogTab('custom')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                catalogTab === 'custom'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>Dynamic Variables ({customVariableKeys.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCatalogTab('standard')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                catalogTab === 'standard'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Database className="h-3 w-3" />
              <span>Standard CRM ({standardCRMFieldDefinitions.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-[450px]">
            {/* Left Column: Field Names List (Sidebar) */}
            <div className="md:col-span-5 border-r border-zinc-200 dark:border-zinc-800 pr-3.5 flex flex-col h-full overflow-hidden">
              <div className="pb-2 shrink-0">
                <input
                  type="text"
                  placeholder="Search document fields..."
                  value={fieldSearchTerm}
                  onChange={(e) => setFieldSearchTerm(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
                {(() => {
                  const standardKeySet = new Set(standardCRMFieldDefinitions.map(s => s.key));
                  const filteredKeys = allDocumentFieldKeys
                    .filter((k) => {
                      if (catalogTab === 'custom') return !standardKeySet.has(k);
                      if (catalogTab === 'standard') return standardKeySet.has(k);
                      return true;
                    })
                    .filter((k) => !fieldSearchTerm || k.toLowerCase().includes(fieldSearchTerm.toLowerCase()));

                  if (filteredKeys.length === 0) {
                    return (
                      <div className="p-4 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                        No matching fields.
                      </div>
                    );
                  }

                  return filteredKeys.map((k) => {
                    const isStandard = standardKeySet.has(k);
                    const count = valuesByKey[k]?.length || 0;
                    const isSelected = selectedCatalogKey === k;
                    const fieldAssignedVal = getAssignedValueForField(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setSelectedCatalogKey(k);
                          setCatalogSearchTerm('');
                        }}
                        className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border border-transparent'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-mono truncate">{`{{${k}}}`}</span>
                            {fieldAssignedVal && (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" title={`Assigned: "${fieldAssignedVal}"`} />
                            )}
                          </div>
                          <span className="text-[9px] text-zinc-400 font-normal truncate">
                            {fieldAssignedVal ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Active: &quot;{fieldAssignedVal}&quot;</span>
                            ) : (
                              isStandard ? 'CRM Core Field' : 'Dynamic Variable'
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                              isStandard
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                            }`}
                          >
                            {isStandard ? 'CRM' : 'Var'}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {count}
                          </span>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Right Column: Values for Selected Field */}
            <div className="md:col-span-7 flex flex-col h-full space-y-3 pl-1 overflow-hidden">
              {(() => {
                const currentAssignedVal = getAssignedValueForField(selectedCatalogKey);
                return (
                  <div className="flex items-center justify-between shrink-0">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono flex items-center gap-1.5">
                          Field: {selectedCatalogKey ? `{{${selectedCatalogKey}}}` : 'Select a field on the left'}
                        </h4>
                        {currentAssignedVal ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-medium text-[11px] border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                            <span>Current: <strong className="font-mono">{currentAssignedVal}</strong></span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-normal italic">
                            (No value assigned yet)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {valuesByKey[selectedCatalogKey]?.length || 0} distinct value(s) detected across contacts
                      </p>
                    </div>
                  </div>
                );
              })()}

              {selectedCatalogKey ? (
                <>
                  {/* Custom Value Creator */}
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder={`Assign custom value to {{${selectedCatalogKey}}}...`}
                      value={newValueInput}
                      onChange={(e) => setNewValueInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newValueInput.trim()) {
                          handleAssignValueToField(selectedCatalogKey, newValueInput);
                          setNewValueInput('');
                        }
                      }}
                      className="flex-1 h-8 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    />
                    <Button
                      size="xs"
                      variant="primary"
                      disabled={!newValueInput.trim()}
                      onClick={() => {
                        handleAssignValueToField(selectedCatalogKey, newValueInput);
                        setNewValueInput('');
                      }}
                    >
                      Assign
                    </Button>
                  </div>

                  {valuesByKey[selectedCatalogKey]?.length ? (
                    <>
                      <div className="shrink-0">
                        <Input
                          placeholder={`Filter in ${selectedCatalogKey} values...`}
                          value={catalogSearchTerm}
                          onChange={(e) => setCatalogSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
                        {valuesByKey[selectedCatalogKey]
                          .filter((val) => !catalogSearchTerm || val.toLowerCase().includes(catalogSearchTerm.toLowerCase()))
                          .map((val, vIdx) => {
                            const currentAssignedVal = getAssignedValueForField(selectedCatalogKey);
                            const isActive = Boolean(currentAssignedVal && currentAssignedVal.trim().toLowerCase() === val.trim().toLowerCase());

                            return (
                              <div
                                key={vIdx}
                                className={`p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                                  isActive
                                    ? 'bg-emerald-50/90 dark:bg-emerald-950/70 border-emerald-500/80 dark:border-emerald-600 shadow-sm ring-1 ring-emerald-500/30'
                                    : 'bg-zinc-50/60 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  {isActive && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0 shadow-xs">
                                      <Check className="h-3 w-3 stroke-[3]" />
                                    </span>
                                  )}
                                  <span
                                    className={`truncate ${
                                      isActive
                                        ? 'font-bold text-emerald-900 dark:text-emerald-100'
                                        : 'font-medium text-zinc-800 dark:text-zinc-200'
                                    }`}
                                  >
                                    {val}
                                  </span>
                                  {isActive && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shrink-0">
                                      Active
                                    </span>
                                  )}
                                </div>

                                {isActive ? (
                                  <Button
                                    size="xs"
                                    variant="primary"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs shrink-0 cursor-default"
                                    leftIcon={<Check className="h-3 w-3 stroke-[3]" />}
                                  >
                                    Assigned
                                  </Button>
                                ) : (
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    className="shrink-0 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400"
                                    onClick={() => handleAssignValueToField(selectedCatalogKey, val)}
                                  >
                                    Assign Value
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-400">
                      No saved values for this field yet. Type a value above to assign it.
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-400">
                  Select a variable field from the left to view its detected values.
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Clear All Contacts Confirmation Modal */}
      <Modal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        title="Clear All Contacts from Database"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsClearAllModalOpen(false)} disabled={isClearing}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearAllContacts}
              disabled={isClearing}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              {isClearing ? 'Clearing...' : `Clear All (${contacts.length})`}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-xl">
            <div className="h-9 w-9 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Are you sure you want to clear all {contacts.length} contacts?
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                This will delete all current contact entries from the database so you can import a fresh leads CSV file from scratch.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* In-App Live CSV Table Preview Modal */}
      {(() => {
        const previewUploadedMeta = previewFile ? uploadedFiles.find(f => f.filename === previewFile.filename) : null;
        const isPreviewImported = Boolean(previewUploadedMeta?.is_imported || (previewUploadedMeta?.imported_count && previewUploadedMeta.imported_count > 0));
        return (
          <FilePreviewModal
            file={previewFile}
            onClose={() => setPreviewFile(null)}
            extraActions={
              previewFile?.category === 'contacts' && previewUploadedMeta ? (
                <div className="flex items-center gap-1.5 mr-1">
                  {isPreviewImported ? (
                    <Button
                      size="xs"
                      variant="danger"
                      disabled={unimportingFileName === previewFile.filename}
                      onClick={() => handleUnimportUploadedFile(previewFile.filename)}
                      leftIcon={<Undo2 className="h-3.5 w-3.5" />}
                      className="text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                    >
                      {unimportingFileName === previewFile.filename ? 'Removing...' : 'Back from Import'}
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      variant="primary"
                      disabled={syncingFileName === previewFile.filename}
                      onClick={() => handleSyncUploadedFile(previewFile.filename)}
                      leftIcon={<UploadCloud className="h-3.5 w-3.5" />}
                      className="text-xs cursor-pointer"
                    >
                      {syncingFileName === previewFile.filename ? 'Importing...' : 'Import to Directory'}
                    </Button>
                  )}
                </div>
              ) : null
            }
          />
        );
      })()}
    </div>
  );
};
