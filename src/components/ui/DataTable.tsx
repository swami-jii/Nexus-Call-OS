import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowUpDown,
  Search,
  Download,
  Upload,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Pagination } from './Pagination';
import { Skeleton } from './Skeleton';

const DataTableFilterDropdown: React.FC<{
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}> = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const allLabel = `All ${label.toLowerCase().endsWith('s') ? `${label}es` : `${label}s`}`;
  const isFiltered = Boolean(value && value !== 'ALL');
  const displayLabel = isFiltered
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : allLabel;

  const getDotColor = (opt: string) => {
    const norm = opt.toLowerCase();
    if (norm === 'all') return 'bg-zinc-400';
    if (norm === 'new' || norm === 'inbound') return 'bg-amber-500';
    if (norm === 'contacted' || norm === 'active' || norm === 'in_progress') return 'bg-blue-500';
    if (norm === 'qualified' || norm === 'verified') return 'bg-purple-500';
    if (norm === 'converted' || norm === 'completed' || norm === 'success') return 'bg-emerald-500';
    if (norm === 'unreachable' || norm === 'failed' || norm === 'inactive') return 'bg-rose-500';
    return 'bg-blue-500';
  };

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-9 px-3 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
          isFiltered
            ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-xs'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
        }`}
      >
        <Filter className={`h-3.5 w-3.5 shrink-0 ${isFiltered ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
        <span className="truncate max-w-[130px]">{displayLabel}</span>
        {isFiltered && (
          <span className={`h-2 w-2 rounded-full ${getDotColor(value)} shrink-0`} />
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-zinc-600 dark:text-zinc-200' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Filter by {label}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange('ALL');
              setIsOpen(false);
            }}
            className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer text-left ${
              !isFiltered
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-400" />
              <span>{allLabel}</span>
            </div>
            {!isFiltered && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
          </button>

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

          {options.map((opt) => {
            const isSelected = value === opt;
            const formattedOpt = opt.charAt(0).toUpperCase() + opt.slice(1);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${getDotColor(opt)}`} />
                  <span>{formattedOpt}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DataTablePageSizeDropdown: React.FC<{
  value: number;
  onChange: (size: number) => void;
  options?: number[];
}> = ({ value, onChange, options = [10, 25, 50, 100] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
      >
        <span>{value}</span>
        <ChevronDown
          className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-1 w-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
          {options.map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => {
                onChange(sz);
                setIsOpen(false);
              }}
              className={`w-full px-2 py-1 rounded text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                value === sz
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{sz}</span>
              {value === sz && <Check className="h-3 w-3 text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  filterableKeys?: { label: string; key: keyof T | string; options: string[] }[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onBulkDelete?: (selectedIds: string[]) => void;
  onBulkStatusChange?: (selectedIds: string[], status: string) => void;
  renderCustomBulkActions?: (selectedIds: string[], setSelectedIds: (ids: string[]) => void) => React.ReactNode;
  onImportCSV?: (parsedData: any[]) => void;
  onImportFile?: (file: File) => void;
  onExport?: (data: T[], selectedIds: string[]) => void;
  bulkStatusOptions?: string[];
  hideToolbar?: boolean;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  title,
  description,
  actions,
  filterableKeys = [],
  isLoading = false,
  error = null,
  onRetry,
  onBulkDelete,
  onBulkStatusChange,
  renderCustomBulkActions,
  onImportCSV,
  onImportFile,
  onExport,
  bulkStatusOptions = [],
  hideToolbar = false,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Search matches
      const matchesSearch =
        !searchTerm ||
        Object.values(row).some((val) =>
          String(val ?? '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );

      // Category filters
      const matchesFilters = Object.entries(activeFilters).every(([key, filterVal]) => {
        if (!filterVal || filterVal === 'ALL') return true;
        const rowVal = (row as any)[key] ?? (row as any).custom_variables?.[key];
        return String(rowVal ?? '') === filterVal;
      });

      return matchesSearch && matchesFilters;
    });
  }, [data, searchTerm, activeFilters]);

  // Sort Logic
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = (a as any)[sortKey];
      const valB = (b as any)[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const comp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Selection Logic
  const isAllSelected =
    paginatedData.length > 0 && paginatedData.every((row) => selectedIds.includes(row.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedData.some((r) => r.id === id)));
    } else {
      const newIds = new Set([...selectedIds, ...paginatedData.map((r) => r.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Sort Handler
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = columns.map((c) => c.header).join(',');
    const rowsToExport = selectedIds.length > 0
      ? sortedData.filter((r) => selectedIds.includes(r.id))
      : sortedData;

    const rows = rowsToExport.map((row) =>
      columns
        .map((col) => {
          const val = (row as any)[col.key];
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_data_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onImportFile) {
      onImportFile(file);
      e.target.value = '';
      return;
    }

    if (onImportCSV) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split('\n').filter((l) => l.trim().length > 0);
          if (lines.length < 2) return;

          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const parsed = lines.slice(1).map((line) => {
            const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            const rowObj: any = {};
            headers.forEach((h, idx) => {
              rowObj[h.toLowerCase()] = values[idx] || '';
            });
            return rowObj;
          });

          onImportCSV(parsed);
        } catch (err) {
          console.error('Error parsing CSV import:', err);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  return (
    <div className="w-full space-y-4">
      {/* Table Top Toolbar */}
      {!hideToolbar && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {(title || description) && (
          <div>
            {title && (
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="w-full sm:w-64">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Filters */}
          {filterableKeys.map((fKey) => (
            <DataTableFilterDropdown
              key={String(fKey.key)}
              label={fKey.label}
              options={fKey.options}
              value={activeFilters[String(fKey.key)] || 'ALL'}
              onChange={(val) => {
                setActiveFilters({ ...activeFilters, [String(fKey.key)]: val });
                setCurrentPage(1);
              }}
            />
          ))}

          {/* Import CSV / Documents */}
          {(onImportCSV || onImportFile) && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.txt,.tsv,.xlsx,.xls,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="h-3.5 w-3.5" />}
              >
                Import
              </Button>
            </>
          )}

          {/* Export CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onExport) {
                onExport(sortedData, selectedIds);
              } else {
                handleExportCSV();
              }
            }}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Export
          </Button>

          {actions}
        </div>
      </div>
      )}

      {/* Bulk actions banner if rows selected */}
      {selectedIds.length > 0 && (
        <div className="px-4 py-2.5 bg-teal-50/90 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs text-teal-900 dark:text-teal-200 shadow-xs">
          <span className="font-semibold">
            {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {bulkStatusOptions.length > 0 && onBulkStatusChange && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onBulkStatusChange(selectedIds, e.target.value);
                    setSelectedIds([]);
                  }
                }}
                defaultValue=""
                className="h-8 px-2 text-xs font-medium rounded-md border border-teal-300 dark:border-teal-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" value="" disabled>
                  Update Status...
                </option>
                {bulkStatusOptions.map((st) => (
                  <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" key={st} value={st}>
                    Mark {st}
                  </option>
                ))}
              </select>
            )}

            {renderCustomBulkActions && renderCustomBulkActions(selectedIds, setSelectedIds)}

            {onBulkDelete && (
              <Button
                size="sm"
                variant="danger"
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => {
                  onBulkDelete(selectedIds);
                  setSelectedIds([]);
                }}
              >
                Delete Selected
              </Button>
            )}

            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Error state alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center justify-between text-xs text-red-800 dark:text-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Main Data Grid Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900/90 shadow-xs">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-sm border-collapse">
            {/* Header */}
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold select-none">
                <th className="p-3 pl-4 w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="px-3 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                    style={{ width: col.width }}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(String(col.key))}
                        className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                      >
                        <span>{col.header}</span>
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-normal text-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="p-3.5 pl-4">
                      <Skeleton className="h-4 w-4 rounded-xs" />
                    </td>
                    {columns.map((col) => (
                      <td key={String(col.key)} className="p-3.5">
                        <Skeleton className="h-4 w-24 rounded-sm" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="p-10 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <Filter className="h-9 w-9 text-zinc-300 dark:text-zinc-600" />
                      <p className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                        No matching records found
                      </p>
                      <p className="text-xs text-zinc-500">
                        Try adjusting your search keyword or active category filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const isSelected = selectedIds.includes(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 ${
                        isSelected ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="p-3.5 pl-4">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(row.id)}
                          className="flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      {columns.map((col) => (
                        <td key={String(col.key)} className="p-3.5 text-zinc-800 dark:text-zinc-200">
                          {col.render ? col.render(row) : String((row as any)[col.key] ?? '-')}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination & Page Size */}
        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Rows per page:</span>
            <DataTablePageSizeDropdown
              value={pageSize}
              onChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              options={[10, 25, 50, 100]}
            />
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={sortedData.length}
            itemsPerPage={pageSize}
          />
        </div>
      </div>
    </div>
  );
}
