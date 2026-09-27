import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Square, CheckSquare, Search, X } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  disabled?: boolean;
  category?: string;
}

export interface CustomSelectProps {
  value?: string;
  values?: string[];
  onChange?: (value: string) => void;
  onMultiChange?: (values: string[]) => void;
  multiSelect?: boolean;
  options: CustomSelectOption[];
  placeholder?: string;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  disabled?: boolean;
  align?: 'left' | 'right';
  id?: string;
  badgeSummary?: string;
  searchable?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  values,
  onChange,
  onMultiChange,
  multiSelect = false,
  options,
  placeholder = 'Select option...',
  label,
  size = 'sm',
  className = '',
  disabled = false,
  align = 'left',
  id,
  badgeSummary,
  searchable,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Determine active selection array for multi-select
  const currentValues = useMemo<string[]>(() => {
    if (multiSelect) {
      if (Array.isArray(values)) return values;
      if (value) return [value];
      return [];
    }
    return value ? [value] : [];
  }, [multiSelect, values, value]);

  // Find single selected option
  const singleSelectedOption = options.find((opt) => opt.value === (value || currentValues[0]));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  const sizeClasses = {
    xs: 'h-7.5 px-2.5 text-xs gap-1.5',
    sm: 'h-8.5 px-3 text-xs gap-2',
    md: 'h-10 px-3.5 text-sm gap-2.5',
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
  };

  // Filter options if search query is active
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) => opt.label.toLowerCase().includes(q) || (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const handleToggleOption = (optVal: string) => {
    if (!multiSelect) {
      onChange?.(optVal);
      setIsOpen(false);
      setSearchQuery('');
      return;
    }

    const isCurrentlySelected = currentValues.includes(optVal);
    const newValues = isCurrentlySelected
      ? currentValues.filter((v) => v !== optVal)
      : [...currentValues, optVal];

    onMultiChange?.(newValues);
    onChange?.(newValues[0] || '');
  };

  const handleSelectAll = () => {
    const allSelectable = options.filter((o) => !o.disabled).map((o) => o.value);
    onMultiChange?.(allSelectable);
    onChange?.(allSelectable[0] || '');
  };

  const handleClearAll = () => {
    onMultiChange?.([]);
    onChange?.('');
  };

  // Determine trigger label rendering
  const renderTriggerContent = () => {
    if (multiSelect) {
      const count = currentValues.length;
      if (count === 0) {
        return <span className="text-zinc-400 font-normal truncate">{placeholder}</span>;
      }
      if (count === options.length) {
        return (
          <span className="flex items-center gap-1.5 truncate text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckSquare className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span className="truncate">All ({count}) Enabled</span>
          </span>
        );
      }
      if (count === 1) {
        const selected = options.find((o) => o.value === currentValues[0]);
        return (
          <span className="flex items-center gap-1.5 truncate">
            {selected?.icon && <span className="shrink-0 text-zinc-400">{selected.icon}</span>}
            <span className="truncate">{selected?.label || currentValues[0]}</span>
          </span>
        );
      }
      // Multiple items selected
      const firstSelected = options.find((o) => o.value === currentValues[0]);
      return (
        <span className="flex items-center gap-1.5 truncate">
          {firstSelected?.icon && <span className="shrink-0 text-zinc-400">{firstSelected.icon}</span>}
          <span className="truncate">
            {firstSelected ? firstSelected.label.split('(')[0].trim() : currentValues[0]}
          </span>
          <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            +{count - 1} more
          </span>
        </span>
      );
    }

    // Single Select
    return (
      <span className="flex items-center gap-2 truncate">
        {singleSelectedOption?.icon && (
          <span className="shrink-0 text-zinc-400">{singleSelectedOption.icon}</span>
        )}
        <span className="truncate">
          {singleSelectedOption ? singleSelectedOption.label : placeholder}
        </span>
      </span>
    );
  };

  const isAllSelected = multiSelect && currentValues.length === options.length && options.length > 0;

  return (
    <div className={`relative inline-block text-left ${isOpen ? 'z-50' : 'z-10'} ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full ${sizeClasses[size]} rounded-lg border flex items-center justify-between transition-all cursor-pointer font-semibold shadow-2xs ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white'
            : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-750 hover:border-zinc-300 dark:hover:border-zinc-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 truncate min-w-0 pr-1">
          {renderTriggerContent()}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {badgeSummary && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              {badgeSummary}
            </span>
          )}
          {multiSelect && currentValues.length > 0 && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
              {currentValues.length}
            </span>
          )}
          <ChevronDown
            className={`${iconSizes[size]} shrink-0 text-zinc-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-emerald-500' : ''
            }`}
          />
        </div>
      </button>

      {/* Custom Popover Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1 min-w-full sm:min-w-[280px] w-max max-w-[420px] rounded-xl border border-zinc-200 dark:border-zinc-700/90 bg-white dark:bg-zinc-900 shadow-2xl py-1.5 focus:outline-none ring-1 ring-black/10 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          role="listbox"
        >
          {/* Multi-Select Header Toolbar */}
          {multiSelect && (
            <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] gap-2">
              <span className="font-mono text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                {currentValues.length} / {options.length} Selected
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Optional Search Filter */}
          {(searchable || options.length > 6) && (
            <div className="px-2 py-1 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative flex items-center">
                <Search className="absolute left-2 h-3 w-3 text-zinc-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter options..."
                  className="w-full pl-6 pr-6 py-1 text-[11px] rounded-md bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1.5 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            className="max-h-60 overflow-y-auto no-scrollbar py-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-zinc-400 font-medium">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = multiSelect
                  ? currentValues.includes(opt.value)
                  : opt.value === (value || currentValues[0]);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      if (!opt.disabled) {
                        handleToggleOption(opt.value);
                      }
                    }}
                    className={`w-[calc(100%-8px)] mx-1 flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-left transition-colors cursor-pointer ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {multiSelect ? (
                        isSelected ? (
                          <CheckSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        )
                      ) : (
                        opt.icon && <span className="shrink-0">{opt.icon}</span>
                      )}

                      {multiSelect && opt.icon && (
                        <span className="shrink-0">{opt.icon}</span>
                      )}

                      <span className="whitespace-normal text-left truncate">{opt.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          {opt.badge}
                        </span>
                      )}
                      {!multiSelect && isSelected && (
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Multi-Select Footer Done Button */}
          {multiSelect && (
            <div className="px-2.5 pt-1.5 pb-0.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 font-medium">Click outside or Done to close</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-teal-600 hover:bg-teal-500 text-white shadow-2xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;

