import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Folder,
  FileText,
  UploadCloud,
  Trash2,
  Download,
  Search,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  File,
  FileSpreadsheet,
  FileCode,
  Music,
  Image as ImageIcon,
  BookOpen,
  Users,
  GitFork,
  User,
  Blocks,
  PlayCircle,
  ExternalLink,
  Layers,
  ArrowUpDown,
  Eye,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { ScreenId } from '../types';
import {
  uploadRepository,
  UploadedFileItem,
  UploadStorageStats,
  TrashStats,
} from '../repository';
import { FilePreviewModal, PreviewableFile } from '../components/ui/FilePreviewModal';

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; bg: string; borderColor: string; desc: string }
> = {
  knowledge_base: {
    label: 'Knowledge Base (RAG)',
    icon: BookOpen,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    desc: 'PDF manuals, documentation, and RAG knowledge vectors',
  },
  contacts: {
    label: 'Contacts & Leads',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-800',
    desc: 'Imported CSV spreadsheets & lead directory files',
  },
  audio: {
    label: 'Audio & Voice Prompts',
    icon: Music,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-800',
    desc: 'Voice clone samples, custom IVR audio & sound prompts',
  },
  workflows: {
    label: 'Voice Workflows',
    icon: GitFork,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    desc: 'Visual canvas workflow JSON templates & pipelines',
  },
  profiles: {
    label: 'Profile Media',
    icon: User,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    desc: 'User profile avatar images and cover headers',
  },
  integrations: {
    label: 'API & Integrations',
    icon: Blocks,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    desc: 'Integration schemas, API configuration payloads & docs',
  },
  recordings: {
    label: 'Call Recordings',
    icon: PlayCircle,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-800',
    desc: 'Recorded call audio streams and live test media',
  },
};

export interface FileStorageViewProps {
  onNavigate?: (screen: ScreenId) => void;
}

export const FileStorageView: React.FC<FileStorageViewProps> = ({ onNavigate }) => {
  const { addToast } = useToast();
  const [stats, setStats] = useState<UploadStorageStats | null>(null);
  const [trashStats, setTrashStats] = useState<TrashStats | null>(null);
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadCategory, setUploadCategory] = useState<string>('knowledge_base');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Custom Searchable Dropdown State
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState<boolean>(false);
  const [targetSearchQuery, setTargetSearchQuery] = useState<string>('');
  const targetDropdownRef = useRef<HTMLDivElement>(null);

  // Preview Modal State
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [fileToDelete, setFileToDelete] = useState<UploadedFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Click outside to close custom dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(event.target as Node)) {
        setIsTargetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, filesData, trashStatsData] = await Promise.all([
        uploadRepository.getCategories(),
        uploadRepository.getFiles(selectedCategory === 'ALL' ? undefined : selectedCategory, searchTerm),
        uploadRepository.getTrashStats().catch(() => null),
      ]);
      setStats(statsData);
      setFiles(filesData);
      if (trashStatsData) setTrashStats(trashStatsData);
    } catch (err: any) {
      console.error('Error loading storage data:', err);
      addToast({
        type: 'error',
        title: 'Failed to load storage data',
        description: err.message || 'Please check backend connection',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  // Handle direct file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      try {
        await uploadRepository.uploadFile(uploadCategory, file);
        successCount++;
      } catch (err: any) {
        addToast({
          type: 'error',
          title: `Upload Failed for ${file.name}`,
          description: err.message || 'Upload error',
        });
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (successCount > 0) {
      addToast({
        type: 'success',
        title: 'Upload Successful',
        description: `Saved ${successCount} file(s) into uploads/${uploadCategory}/`,
      });
      await loadData();
    }
  };

  // Handle move to trash (soft delete)
  const handleMoveToTrash = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await uploadRepository.deleteFile(fileToDelete.category, fileToDelete.filename, false);
      addToast({
        type: 'info',
        title: 'Moved to Recycle Bin',
        description: `"${fileToDelete.filename}" moved to Recycle Bin. You can restore it anytime.`,
      });
      setDeleteModalOpen(false);
      setFileToDelete(null);
      await loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        description: err.message || 'Could not move file to Recycle Bin',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle permanent delete immediately
  const handlePermanentDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await uploadRepository.deleteFile(fileToDelete.category, fileToDelete.filename, true);
      addToast({
        type: 'success',
        title: 'File Deleted Permanently',
        description: `Permanently removed "${fileToDelete.filename}" from disk & database.`,
      });
      setDeleteModalOpen(false);
      setFileToDelete(null);
      await loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Permanent Delete Failed',
        description: err.message || 'Could not delete file permanently',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch =
        !searchTerm ||
        f.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.file_type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || f.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [files, searchTerm, selectedCategory]);

  const getFileIcon = (fileType: string) => {
    const ext = fileType.toUpperCase();
    if (ext.includes('PDF')) return <FileText className="h-5 w-5 text-rose-500" />;
    if (ext.includes('CSV') || ext.includes('XLS')) return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    if (ext.includes('JSON') || ext.includes('YAML') || ext.includes('TXT') || ext.includes('MD'))
      return <FileCode className="h-5 w-5 text-amber-500" />;
    if (ext.includes('MP3') || ext.includes('WAV') || ext.includes('OGG'))
      return <Music className="h-5 w-5 text-purple-500" />;
    if (ext.includes('PNG') || ext.includes('JPG') || ext.includes('JPEG') || ext.includes('WEBP'))
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    return <File className="h-5 w-5 text-zinc-500" />;
  };

  const handleOpenFilePreview = (file: UploadedFileItem) => {
    setPreviewFile({
      filename: file.filename,
      category: file.category,
      category_name: file.category_name,
      url: file.download_url,
      file_type: file.file_type,
      size_formatted: file.size_formatted,
      created_at: file.created_at,
    });
  };

  return (
    <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                File Storage & Uploads Hub
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Organized directory structure for all system imports, knowledge docs, voice assets, and leads
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('recycle-bin')}
              className="border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Recycle Bin ({trashStats?.total_items ?? 0})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            leftIcon={<UploadCloud className="h-4 w-4" />}
          >
            {isUploading ? 'Uploading...' : `Upload to ${CATEGORY_CONFIG[uploadCategory]?.label || 'Folder'}`}
          </Button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Uploaded Files</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {stats?.total_files ?? 0}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Across all storage categories</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Folder className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Storage Consumed</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {stats?.total_formatted ?? '0 B'}
              </h3>
              <p className="text-[11px] text-emerald-500 font-medium mt-0.5">Physical disk usage</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <HardDrive className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Active Subfolders</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {Object.keys(CATEGORY_CONFIG).length}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Auto-partitioned under uploads/</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Target Upload Subfolder Card - Custom Searchable Popover Dropdown */}
        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Target Upload Subfolder</p>
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <UploadCloud className="h-4 w-4" />
              </div>
            </div>

            {/* Custom Searchable Dropdown */}
            <div className="relative mt-2" ref={targetDropdownRef}>
              <button
                type="button"
                onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-between gap-2 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors shadow-xs cursor-pointer text-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {(() => {
                    const CurrentIcon = CATEGORY_CONFIG[uploadCategory]?.icon || Folder;
                    return (
                      <CurrentIcon
                        className={`h-3.5 w-3.5 shrink-0 ${CATEGORY_CONFIG[uploadCategory]?.color || 'text-zinc-500'}`}
                      />
                    );
                  })()}
                  <span className="font-semibold truncate">
                    {CATEGORY_CONFIG[uploadCategory]?.label || uploadCategory}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 truncate hidden sm:inline">
                    (uploads/{uploadCategory}/)
                  </span>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${
                    isTargetDropdownOpen ? 'rotate-180 text-blue-500' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu Popover - Wide & Spacious */}
              {isTargetDropdownOpen && (
                <div className="absolute top-full right-0 w-80 sm:w-96 mt-1.5 z-50 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Search Box */}
                  <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={targetSearchQuery}
                        onChange={(e) => setTargetSearchQuery(e.target.value)}
                        placeholder="Search destination subfolders..."
                        className="w-full h-8 pl-8 pr-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* List of subfolders */}
                  <div className="max-h-48 overflow-y-auto p-1 divide-y divide-zinc-50 dark:divide-zinc-800/40">
                    {Object.entries(CATEGORY_CONFIG)
                      .filter(([key, cfg]) => {
                        if (!targetSearchQuery) return true;
                        const query = targetSearchQuery.toLowerCase();
                        return (
                          cfg.label.toLowerCase().includes(query) ||
                          key.toLowerCase().includes(query) ||
                          cfg.desc.toLowerCase().includes(query)
                        );
                      })
                      .map(([key, cfg]) => {
                        const IconComp = cfg.icon;
                        const isSelected = uploadCategory === key;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setUploadCategory(key);
                              setIsTargetDropdownOpen(false);
                              setTargetSearchQuery('');
                            }}
                            className={`w-full p-2 rounded-lg text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200'
                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`h-6 w-6 rounded-md ${cfg.bg} flex items-center justify-center shrink-0`}>
                                <IconComp className={`h-3.5 w-3.5 ${cfg.color}`} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate leading-tight">{cfg.label}</p>
                                <p className="text-[10px] font-mono text-zinc-400 truncate">uploads/{key}/</p>
                              </div>
                            </div>
                            {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <p className="text-[10px] text-zinc-400 mt-1">Direct upload destination</p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Directories Navigator - Spans 2 Rows cleanly (4 columns x 2 rows) */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Storage Directories (uploads/ subfolders)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* ALL Button */}
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Layers className={`h-4 w-4 ${selectedCategory === 'ALL' ? 'text-white' : 'text-blue-500'}`} />
                <span className="text-xs font-bold truncate">All Upload Folders</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedCategory === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {stats?.total_files ?? 0} files
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className={selectedCategory === 'ALL' ? 'text-blue-100' : 'text-zinc-400'}>
                Entire root uploads/
              </span>
              <span className={`font-mono font-bold ${selectedCategory === 'ALL' ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                {stats?.total_formatted ?? '0 B'}
              </span>
            </div>
          </button>

          {/* Individual Categories */}
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const catStat = stats?.categories?.[key];
            const isSelected = selectedCategory === key;
            const IconComponent = cfg.icon;

            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <IconComponent className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white' : cfg.color}`} />
                    <span className="text-xs font-bold truncate" title={cfg.label}>
                      {cfg.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {catStat?.file_count ?? 0}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className={`font-mono text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-zinc-400'}`}>
                    uploads/{key}/
                  </span>
                  <span className={`font-mono font-bold shrink-0 ml-1 ${isSelected ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {catStat?.total_formatted ?? '0 B'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Files Table / Grid */}
      <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-zinc-200 dark:border-zinc-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedCategory === 'ALL'
                    ? 'All Stored Uploads'
                    : `Files in uploads/${selectedCategory}/`}
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                All files organized across subfolders with in-app live preview, download, and deletion.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-48 sm:w-64">
                <Input
                  placeholder="Search file name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-3.5 w-3.5" />}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5 bg-zinc-50 dark:bg-zinc-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title="Grid View"
                >
                  <Layers className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title="Table View"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {isLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Reading storage directory...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
                <Folder className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                No uploaded files found
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
                {searchTerm
                  ? `No files matching "${searchTerm}" in this directory.`
                  : `There are currently no files in uploads/${selectedCategory}/.`}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<UploadCloud className="h-3.5 w-3.5" />}
              >
                Upload File Here
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredFiles.map((file) => {
                const catMeta = CATEGORY_CONFIG[file.category];
                return (
                  <div
                    key={file.id}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 hover:border-blue-400 dark:hover:border-blue-600 transition-all group flex flex-col justify-between shadow-xs hover:shadow-md"
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-center justify-between gap-1.5 mb-2.5">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                            catMeta?.bg || 'bg-zinc-100 dark:bg-zinc-800'
                          } ${catMeta?.color || 'text-zinc-600'} ${catMeta?.borderColor || 'border-zinc-200'}`}
                        >
                          uploads/{file.category}/
                        </span>
                        <Badge variant="outline" className="text-[9px] uppercase font-mono">
                          {file.file_type}
                        </Badge>
                      </div>

                      {/* File Icon & Name (Clicking opens In-App Live Preview) */}
                      <div
                        onClick={() => handleOpenFilePreview(file)}
                        className="flex items-start gap-2.5 cursor-pointer"
                        title="Click to Live Preview"
                      >
                        <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 transition-colors">
                          {getFileIcon(file.file_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                            title={file.filename}
                          >
                            {file.filename}
                          </h4>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            {file.size_formatted} • {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenFilePreview(file)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Live Preview</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <a
                          href={`/api/uploads/${file.category}/${file.filename}?download=true`}
                          download={file.filename}
                          className="p-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          title="Download File"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setFileToDelete(file);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Delete File"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
                    <th className="py-2.5 px-3">Folder Path</th>
                    <th className="py-2.5 px-3">Format</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Uploaded Date</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredFiles.map((file) => {
                    const catMeta = CATEGORY_CONFIG[file.category];
                    return (
                      <tr key={file.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          <div
                            onClick={() => handleOpenFilePreview(file)}
                            className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                          >
                            {getFileIcon(file.file_type)}
                            <span className="truncate max-w-xs">{file.filename}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                              catMeta?.bg || 'bg-zinc-100'
                            } ${catMeta?.color || 'text-zinc-600'} ${catMeta?.borderColor || 'border-zinc-200'}`}
                          >
                            uploads/{file.category}/
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">{file.file_type}</td>
                        <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">{file.size_formatted}</td>
                        <td className="py-2.5 px-3 text-zinc-500">{new Date(file.created_at).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenFilePreview(file)}
                              className="text-[11px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                              title="Live Preview"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Preview</span>
                            </button>
                            <a
                              href={`/api/uploads/${file.category}/${file.filename}?download=true`}
                              download={file.filename}
                              className="p-1 text-zinc-400 hover:text-emerald-600 transition-colors"
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setFileToDelete(file);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete"
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
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete File"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleMoveToTrash}
              disabled={isDeleting}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              {isDeleting ? 'Deleting...' : 'Delete File'}
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
                Are you sure you want to delete this file?
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                The file will be moved to the <span className="font-semibold text-zinc-700 dark:text-zinc-300">Recycle Bin</span>. You can restore or download it anytime from the Recycle Bin screen.
              </p>
            </div>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400">File Name:</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[220px]" title={fileToDelete?.filename}>
                {fileToDelete?.filename}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400">Target Folder:</span>
              <span className="font-mono text-zinc-600 dark:text-zinc-300">
                uploads/{fileToDelete?.category}/
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400">File Size:</span>
              <span className="font-mono text-zinc-600 dark:text-zinc-300">
                {fileToDelete?.size_formatted}
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* In-App Live File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};
