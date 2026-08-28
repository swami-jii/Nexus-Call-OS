import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  Download,
  Search,
  RefreshCw,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  FileCode,
  Music,
  Image as ImageIcon,
  File,
  HardDrive,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpDown,
  BookOpen,
  Users,
  GitFork,
  User,
  Blocks,
  PlayCircle,
  ShieldAlert,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import {
  uploadRepository,
  TrashItem,
  TrashStats,
} from '../repository';
import { FilePreviewModal, PreviewableFile } from '../components/ui/FilePreviewModal';

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; bg: string; borderColor: string }
> = {
  knowledge_base: {
    label: 'Knowledge Base (RAG)',
    icon: BookOpen,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
  },
  contacts: {
    label: 'Contacts & Leads',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  audio: {
    label: 'Audio & Voice Prompts',
    icon: Music,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  workflows: {
    label: 'Voice Workflows',
    icon: GitFork,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  profiles: {
    label: 'Profile Media',
    icon: User,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  integrations: {
    label: 'API & Integrations',
    icon: Blocks,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
  },
  recordings: {
    label: 'Call Recordings',
    icon: PlayCircle,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-800',
  },
};

export const RecycleBinView: React.FC = () => {
  const { addToast } = useToast();
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [trashStats, setTrashStats] = useState<TrashStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Preview Modal State
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);

  // Single item permanent delete modal
  const [itemToDelete, setItemToDelete] = useState<TrashItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState<boolean>(false);

  // Empty trash modal
  const [isEmptyTrashModalOpen, setIsEmptyTrashModalOpen] = useState<boolean>(false);
  const [isEmptying, setIsEmptying] = useState<boolean>(false);

  // Multi-select for bulk restore/purge
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState<boolean>(false);

  const loadTrash = async () => {
    setIsLoading(true);
    try {
      const [items, stats] = await Promise.all([
        uploadRepository.getTrashItems(selectedCategory === 'ALL' ? undefined : selectedCategory, searchTerm),
        uploadRepository.getTrashStats(),
      ]);
      setTrashItems(items);
      setTrashStats(stats);
      setSelectedIds([]);
    } catch (err: any) {
      console.error('Error loading trash:', err);
      addToast({
        type: 'error',
        title: 'Failed to load Recycle Bin',
        description: err.message || 'Please check backend connection',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, [selectedCategory]);

  // Restore single item
  const handleRestoreItem = async (item: TrashItem) => {
    try {
      const res = await uploadRepository.restoreTrashItem(item.trash_id);
      addToast({
        type: 'success',
        title: 'File Restored',
        description: res.message || `Restored "${item.filename}" to uploads/${item.category}/`,
      });
      await loadTrash();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Restore Failed',
        description: err.message || 'Could not restore file',
      });
    }
  };

  // Permanently delete single item
  const confirmPermanentDelete = async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    try {
      await uploadRepository.permanentlyDeleteTrashItem(itemToDelete.trash_id);
      addToast({
        type: 'success',
        title: 'Permanently Purged',
        description: `Wiped "${itemToDelete.filename}" completely from disk & database.`,
      });
      setItemToDelete(null);
      await loadTrash();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Purge Failed',
        description: err.message || 'Could not permanently delete item',
      });
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Empty whole recycle bin
  const confirmEmptyTrash = async () => {
    setIsEmptying(true);
    try {
      const res = await uploadRepository.emptyTrash();
      addToast({
        type: 'success',
        title: 'Recycle Bin Emptied',
        description: res.message || `All ${res.purged_count} files permanently removed.`,
      });
      setIsEmptyTrashModalOpen(false);
      await loadTrash();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Empty Bin Failed',
        description: err.message || 'Could not empty recycle bin',
      });
    } finally {
      setIsEmptying(false);
    }
  };

  // Bulk restore
  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkActionLoading(true);
    let count = 0;
    for (const id of selectedIds) {
      try {
        await uploadRepository.restoreTrashItem(id);
        count++;
      } catch (err) {
        console.error(err);
      }
    }
    setIsBulkActionLoading(false);
    addToast({
      type: 'success',
      title: 'Bulk Restore Complete',
      description: `Restored ${count} file(s) to their original folders.`,
    });
    await loadTrash();
  };

  // Bulk purge
  const handleBulkPurge = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkActionLoading(true);
    let count = 0;
    for (const id of selectedIds) {
      try {
        await uploadRepository.permanentlyDeleteTrashItem(id);
        count++;
      } catch (err) {
        console.error(err);
      }
    }
    setIsBulkActionLoading(false);
    addToast({
      type: 'success',
      title: 'Bulk Purge Complete',
      description: `Permanently removed ${count} file(s) from disk.`,
    });
    await loadTrash();
  };

  // Filtered files
  const filteredItems = useMemo(() => {
    return trashItems.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.file_type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [trashItems, searchTerm, selectedCategory]);

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

  const handleOpenFilePreview = (item: TrashItem) => {
    setPreviewFile({
      filename: item.filename,
      category: item.category,
      category_name: item.category_name,
      url: `/api/uploads/trash/download/${item.trash_id}`,
      file_type: item.file_type,
      size_formatted: item.size_formatted,
      created_at: item.deleted_at,
      is_trash: true,
    });
  };

  return (
    <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-rose-600/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                System Recycle Bin & Trash Hub
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Safely inspect, restore, or permanently purge deleted uploads and data records
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTrash}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsEmptyTrashModalOpen(true)}
            disabled={trashItems.length === 0}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Empty Recycle Bin
          </Button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Items in Recycle Bin</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {trashStats?.total_items ?? 0}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Recoverable files</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Trash Storage Size</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {trashStats?.total_formatted ?? '0 B'}
              </h3>
              <p className="text-[11px] text-amber-500 font-medium mt-0.5">Can be freed on empty</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <HardDrive className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Oldest Trashed Item</p>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 truncate max-w-[160px]">
                {trashStats?.oldest_item
                  ? new Date(trashStats.oldest_item).toLocaleDateString()
                  : 'None'}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Retention timestamp</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Quick Safety Status</p>
              <div className="flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Soft-Delete Active</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Zero accidental data loss</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Folders Filter - Spans 2 Rows cleanly (4 columns x 2 rows) */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Filter by Source Subfolder
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* ALL Button */}
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedCategory === 'ALL'
                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Layers className={`h-4 w-4 ${selectedCategory === 'ALL' ? 'text-white' : 'text-rose-500'}`} />
                <span className="text-xs font-bold truncate">All Deleted Files</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedCategory === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {trashItems.length}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className={selectedCategory === 'ALL' ? 'text-rose-100' : 'text-zinc-400'}>
                All categories combined
              </span>
              <span className={`font-mono font-bold ${selectedCategory === 'ALL' ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                {trashStats?.total_formatted ?? '0 B'}
              </span>
            </div>
          </button>

          {/* Individual Categories */}
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const countInCat = trashItems.filter((i) => i.category === key).length;
            const isSelected = selectedCategory === key;
            const IconComponent = cfg.icon;

            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
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
                    {countInCat}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className={`font-mono text-[10px] truncate ${isSelected ? 'text-rose-100' : 'text-zinc-400'}`}>
                    uploads/{key}/
                  </span>
                  <span className={`font-mono font-bold shrink-0 ml-1 ${isSelected ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {countInCat} files
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Trash View Section */}
      <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-zinc-200 dark:border-zinc-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedCategory === 'ALL'
                    ? 'Recycle Bin Contents'
                    : `Deleted items from uploads/${selectedCategory}/`}
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Restoring a file returns it to its original subfolder. Permanent deletion clears it from disk and database.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-48 sm:w-64">
                <Input
                  placeholder="Search in Recycle Bin..."
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
                      ? 'bg-white dark:bg-zinc-700 text-rose-600 dark:text-rose-400 shadow-xs font-semibold'
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
                      ? 'bg-white dark:bg-zinc-700 text-rose-600 dark:text-rose-400 shadow-xs font-semibold'
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

        {/* Bulk Action Banner */}
        {selectedIds.length > 0 && (
          <div className="px-4 py-2.5 bg-rose-50/90 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900/80 flex items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200">
            <span className="font-semibold">
              {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected in Recycle Bin
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRestore}
                disabled={isBulkActionLoading}
                leftIcon={<RotateCcw className="h-3.5 w-3.5 text-blue-500" />}
              >
                Restore Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkPurge}
                disabled={isBulkActionLoading}
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Purge Selected Permanently
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-4 sm:p-5">
          {isLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="h-8 w-8 text-rose-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Reading Recycle Bin contents...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Recycle Bin is Empty
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                {searchTerm
                  ? `No deleted files matching "${searchTerm}".`
                  : 'No deleted items found in this section. Your storage is clean!'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredItems.map((item) => {
                const catMeta = CATEGORY_CONFIG[item.category];
                const isSelected = selectedIds.includes(item.trash_id);

                return (
                  <div
                    key={item.trash_id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between shadow-xs ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 shadow-md'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 hover:border-rose-300 dark:hover:border-rose-700'
                    }`}
                  >
                    <div>
                      {/* Top bar with checkbox and folder badge */}
                      <div className="flex items-center justify-between gap-1.5 mb-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, item.trash_id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== item.trash_id));
                            }
                          }}
                          className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                        />
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                            catMeta?.bg || 'bg-zinc-100 dark:bg-zinc-800'
                          } ${catMeta?.color || 'text-zinc-600'} ${catMeta?.borderColor || 'border-zinc-200'}`}
                        >
                          From uploads/{item.category}/
                        </span>
                      </div>

                      {/* File Icon & Name (Clicking opens In-App Live Preview) */}
                      <div
                        onClick={() => handleOpenFilePreview(item)}
                        className="flex items-start gap-2.5 cursor-pointer group"
                        title="Click to Live Preview"
                      >
                        <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center shrink-0 mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {getFileIcon(item.file_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors"
                            title={item.filename}
                          >
                            {item.filename}
                          </h4>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            {item.size_formatted} • Deleted {new Date(item.deleted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreItem(item)}
                        className="text-[11px] h-7 px-2.5 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60"
                        leftIcon={<RotateCcw className="h-3 w-3" />}
                      >
                        Restore
                      </Button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenFilePreview(item)}
                          className="p-1.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          title="Live Preview"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={`/api/uploads/trash/download/${item.trash_id}`}
                          download={item.filename}
                          className="p-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          title="Download Copy"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Purge Permanently"
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
                    <th className="py-2.5 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(filteredItems.map((i) => i.trash_id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        className="rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">File Name</th>
                    <th className="py-2.5 px-3">Original Source Path</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Deleted Date</th>
                    <th className="py-2.5 px-3">Deleted By</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredItems.map((item) => {
                    const catMeta = CATEGORY_CONFIG[item.category];
                    const isSelected = selectedIds.includes(item.trash_id);

                    return (
                      <tr
                        key={item.trash_id}
                        className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors ${
                          isSelected ? 'bg-rose-50/20 dark:bg-rose-950/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds((prev) => [...prev, item.trash_id]);
                              } else {
                                setSelectedIds((prev) => prev.filter((id) => id !== item.trash_id));
                              }
                            }}
                            className="rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          <div
                            onClick={() => handleOpenFilePreview(item)}
                            className="flex items-center gap-2 cursor-pointer hover:text-rose-600 transition-colors"
                          >
                            {getFileIcon(item.file_type)}
                            <span className="truncate max-w-xs">{item.filename}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                              catMeta?.bg || 'bg-zinc-100'
                            } ${catMeta?.color || 'text-zinc-600'} ${catMeta?.borderColor || 'border-zinc-200'}`}
                          >
                            uploads/{item.category}/
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">{item.size_formatted}</td>
                        <td className="py-2.5 px-3 text-zinc-500">{new Date(item.deleted_at).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-zinc-400">{item.deleted_by || 'Operator'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenFilePreview(item)}
                              className="text-[11px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                              title="Live Preview"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Preview</span>
                            </button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreItem(item)}
                              className="h-6 text-[10px] px-2 text-blue-600"
                              leftIcon={<RotateCcw className="h-3 w-3" />}
                            >
                              Restore
                            </Button>
                            <a
                              href={`/api/uploads/trash/download/${item.trash_id}`}
                              download={item.filename}
                              className="p-1 text-zinc-400 hover:text-emerald-600 transition-colors"
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setItemToDelete(item)}
                              className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Permanently"
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

      {/* Permanent Delete Single Item Modal */}
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Permanently Purge File from System?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <p className="font-bold">Irreversible Permanent Destruction</p>
              <p>
                This will completely wipe{' '}
                <span className="font-mono font-bold">{itemToDelete?.filename}</span> from the physical server disk and clean up any remaining database references.
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                ⚠️ This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setItemToDelete(null)} disabled={isDeletingItem}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmPermanentDelete}
              disabled={isDeletingItem}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              {isDeletingItem ? 'Purging...' : 'Purge Permanently'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Empty Whole Recycle Bin Modal */}
      <Modal
        isOpen={isEmptyTrashModalOpen}
        onClose={() => setIsEmptyTrashModalOpen(false)}
        title="Empty Entire Recycle Bin?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <p className="font-bold">Purge All {trashItems.length} Trashed Files</p>
              <p>
                This will permanently remove all {trashItems.length} deleted items ({trashStats?.total_formatted}) from the server disk and wipe all metadata.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsEmptyTrashModalOpen(false)} disabled={isEmptying}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmEmptyTrash}
              disabled={isEmptying}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              {isEmptying ? 'Emptying...' : 'Empty Recycle Bin Now'}
            </Button>
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
