import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
  icon?: React.ReactNode;
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
  align?: 'left' | 'right' | 'auto';
  allowCustom?: boolean;
  direction?: 'up' | 'down' | 'auto';
  variant?: 'default' | 'blue' | 'purple' | 'emerald' | 'amber';
  className?: string;
}

// Cleanly strip duplicate leading emojis when an authentic SVG icon is rendered
const cleanOptionLabel = (label: string, hasIcon: boolean): string => {
  if (!hasIcon || !label) return label;
  return label.replace(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Regional_Indicator}){1,2}\s*/u, '').trim() || label;
};

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
  variant = 'default',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [alignRight, setAlignRight] = useState(align === 'right');
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

    // Smart Viewport Calculation
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (direction === 'up') {
        setOpenUpward(true);
      } else if (direction === 'down') {
        setOpenUpward(false);
      } else {
        // Auto: open upward if space below is tight (< 340px) or space above is greater
        setOpenUpward(spaceBelow < 320 && spaceAbove > spaceBelow);
      }

      if (align === 'right') {
        setAlignRight(true);
      } else if (align === 'left') {
        setAlignRight(false);
      } else {
        setAlignRight(rect.right > window.innerWidth - 220);
      }
    }

    setIsOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [disabled, direction, isOpen, id, align]);

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

  const variantBorder =
    variant === 'purple'
      ? 'border-purple-500/40 text-purple-600 dark:text-purple-400 focus:ring-purple-500'
      : variant === 'blue'
      ? 'border-blue-500/40 text-blue-600 dark:text-blue-400 focus:ring-blue-500'
      : variant === 'emerald'
      ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500'
      : variant === 'amber'
      ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 focus:ring-amber-500'
      : 'border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-blue-500';

  return (
    <div className={`relative w-full ${className}`} ref={containerRef} id={id}>
      {(label || badge) && (
        <div className="flex items-center justify-between mb-1 gap-2">
          {label && (
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
              {label}
            </label>
          )}
          {badge && (
            typeof badge === 'string' ? (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40 rounded-md shrink-0">
                {badge}
              </span>
            ) : (
              badge
            )
          )}
        </div>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full min-h-[38px] flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl border transition-all overflow-hidden shadow-xs cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-zinc-400 dark:hover:border-zinc-600'}
          ${isOpen ? 'ring-2 ring-blue-500/30 border-blue-500 shadow-md' : variantBorder}
          bg-white dark:bg-zinc-900 font-medium`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
          <span className={`truncate text-left flex-1 ${(selected || value) ? 'font-semibold' : 'text-zinc-400'}`}>
            {selected 
              ? cleanOptionLabel(selected.label, !!selected.icon)
              : (safeOptions.length > 0 && value && value.includes('-') && value.length > 25
                  ? cleanOptionLabel(safeOptions[0].label, !!safeOptions[0].icon)
                  : cleanOptionLabel(value || placeholder, false))}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
        />
      </button>

      {/* Dropdown Panel - Floating popover with search */}
      {isOpen && (
        <div
          className={`absolute z-[120] ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} ${
            alignRight ? 'right-0' : 'left-0'
          } w-full min-w-[260px] sm:min-w-[290px] max-w-[calc(100vw-32px)] sm:max-w-[400px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-700/90 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 ring-1 ring-black/10 dark:ring-white/10`}
        >
          {/* Search Header */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80">
            <Search className="h-4 w-4 text-blue-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or enter keywords..."
              className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none border-none font-medium"
            />
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 shrink-0">
              {filtered.length} found
            </span>
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            {allowCustom && query.trim() && !safeOptions.some(o => (o.value || '').toLowerCase() === query.trim().toLowerCase() || (o.label || '').toLowerCase() === query.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => handleSelect(query.trim())}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left rounded-xl bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 my-1 cursor-pointer"
              >
                <span className="truncate">✨ Use custom entry: &quot;{query.trim()}&quot;</span>
                <span className="text-[10px] font-mono bg-blue-200 dark:bg-blue-800 px-1.5 py-0.5 rounded text-blue-900 dark:text-blue-100 shrink-0">Custom</span>
              </button>
            )}
            {filtered.length === 0 && !allowCustom ? (
              <p className="px-3 py-6 text-xs text-zinc-400 italic text-center">No matching options found.</p>
            ) : (
              groupKeys.map((grp) => (
                <div key={grp} className="space-y-0.5">
                  {grp && (
                    <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 bg-zinc-50/90 dark:bg-zinc-800/80 rounded-lg sticky top-0 z-10 backdrop-blur-xs">
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
                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-xs text-left rounded-xl transition-all cursor-pointer overflow-hidden
                          ${isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 shadow-2xs'
                            : 'hover:bg-zinc-100/90 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200'
                          }`}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="truncate font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                            <span>{cleanOptionLabel(opt.label, !!opt.icon)}</span>
                          </span>
                          {opt.description && (
                            <span className="truncate text-[10.5px] text-zinc-400 dark:text-zinc-400 font-normal mt-0.5">{opt.description}</span>
                          )}
                        </div>
                        <Check
                          className={`h-4 w-4 shrink-0 transition-opacity ${
                            isSelected ? 'opacity-100 text-blue-600 dark:text-blue-400' : 'opacity-0'
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
