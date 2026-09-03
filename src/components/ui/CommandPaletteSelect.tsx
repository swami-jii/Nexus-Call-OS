import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
}

interface CommandPaletteSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  badge?: React.ReactNode | string;
  id?: string;
  disabled?: boolean;
  align?: 'left' | 'right';
  allowCustom?: boolean;
  direction?: 'up' | 'down' | 'auto';
}

export const CommandPaletteSelect: React.FC<CommandPaletteSelectProps> = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  label,
  badge,
  id,
  disabled = false,
  align = 'left',
  allowCustom = true,
  direction = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const safeOptions = Array.isArray(options) ? options : [];

  const isOptionMatch = useCallback((opt: SelectOption, val: string | undefined): boolean => {
    if (!val) return false;
    if (opt.value === val || opt.label === val) return true;
    const vLower = String(val).toLowerCase().trim();
    const optValLower = String(opt.value || '').toLowerCase().trim();
    const optLabelLower = String(opt.label || '').toLowerCase().trim();
    if (optValLower === vLower || optLabelLower === vLower) return true;
    if (optValLower.length > 3 && vLower.includes(optValLower)) return true;
    if (vLower.length > 3 && optValLower.includes(vLower)) return true;
    return false;
  }, []);

  const selected = safeOptions.find((o) => isOptionMatch(o, value));

  const filtered = query.trim()
    ? safeOptions.filter(
        (o) =>
          (o.label || '').toLowerCase().includes(query.toLowerCase()) ||
          (o.value || '').toLowerCase().includes(query.toLowerCase()) ||
          (o.description || '').toLowerCase().includes(query.toLowerCase()) ||
          (o.group || '').toLowerCase().includes(query.toLowerCase())
      )
    : safeOptions;

  // Group filtered options
  const groups: Record<string, SelectOption[]> = {};
  for (const opt of filtered) {
    const grp = opt.group || '';
    if (!groups[grp]) groups[grp] = [];
    groups[grp].push(opt);
  }
  const groupKeys = Object.keys(groups);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    // Close other dropdowns
    window.dispatchEvent(new CustomEvent('app-close-dropdowns', { detail: { sourceId: id } }));
    if (direction === 'up') {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }
    setIsOpen(true);
    setQuery('');
    // Focus search after tick so dropdown is mounted
    setTimeout(() => inputRef.current?.focus(), 20);
  }, [disabled, direction, isOpen, id]);

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setIsOpen(false);
      setQuery('');
    },
    [onChange]
  );

  // Close when another dropdown opens
  useEffect(() => {
    const closeListener = (e: any) => {
      if (e?.detail?.sourceId !== id) {
        setIsOpen(false);
      }
    };
    window.addEventListener('app-close-dropdowns', closeListener);
    return () => window.removeEventListener('app-close-dropdowns', closeListener);
  }, [id]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard: Escape closes
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={containerRef} id={id}>
      {(label || badge) && (
        <div className="flex items-center justify-between mb-1 gap-2">
          {label && (
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 truncate">
              {label}
            </label>
          )}
          {badge && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40 rounded-md shrink-0">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full h-9 flex items-center justify-between gap-2 px-3 text-xs rounded-lg border transition-all overflow-hidden
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-600'}
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500/40' : 'border-zinc-200 dark:border-zinc-700'}
          bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100`}
      >
        <span className={`truncate text-left flex-1 ${(selected || value) ? 'font-semibold' : 'text-zinc-400'}`}>
          {selected ? selected.label : (value || placeholder)}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel - Responsive float overlay with comfortable readable width */}
      {isOpen && (
        <div
          className={`absolute z-[100] ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} ${align === 'right' ? 'right-0' : 'left-0'} min-w-[280px] sm:min-w-[340px] max-w-[440px] w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100 ring-1 ring-black/5 dark:ring-white/10`}
        >
          {/* Search Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70">
            <Search className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search or enter custom value..."
              className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none border-none font-medium"
            />
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
              {query.trim() ? `${filtered.length} of ${safeOptions.length}` : `${safeOptions.length} available`}
            </span>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
            {allowCustom && query.trim() && !safeOptions.some(o => (o.value || '').toLowerCase() === query.trim().toLowerCase() || (o.label || '').toLowerCase() === query.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => handleSelect(query.trim())}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-xs text-left rounded-lg bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 my-1 cursor-pointer"
              >
                <span className="truncate">✨ Use custom entry: "{query.trim()}"</span>
                <span className="text-[10px] font-mono bg-blue-200 dark:bg-blue-800 px-1.5 py-0.5 rounded text-blue-900 dark:text-blue-100 shrink-0">Custom</span>
              </button>
            )}
            {filtered.length === 0 && !allowCustom ? (
              <p className="px-3 py-4 text-xs text-zinc-400 italic text-center">No matching options found.</p>
            ) : (
              groupKeys.map((grp) => (
                <div key={grp}>
                  {grp && (
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 rounded sticky top-0 z-10">
                      {grp}
                    </div>
                  )}
                  {groups[grp].map((opt) => {
                    const isSelected = selected ? (selected.value === opt.value) : isOptionMatch(opt, value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 text-xs text-left rounded-lg transition-colors overflow-hidden
                          ${isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-semibold'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200'
                          }`}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate font-semibold text-xs text-zinc-900 dark:text-zinc-100">{opt.label}</span>
                          {opt.description && (
                            <span className="truncate text-[10px] text-zinc-400 dark:text-zinc-400 font-normal mt-0.5">{opt.description}</span>
                          )}
                        </div>
                        <Check
                          className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                            isSelected ? 'opacity-100 text-blue-500' : 'opacity-0'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
