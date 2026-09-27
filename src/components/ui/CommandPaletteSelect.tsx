import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
  subGroup?: string;
  badge?: React.ReactNode | string;
  badgeVariant?: 'purple' | 'blue' | 'emerald' | 'amber' | 'cyan' | 'rose' | 'zinc';
  location?: string;
  icon?: React.ReactNode;
}

interface CommandPaletteSelectProps {
  options: SelectOption[];
  value?: string;
  values?: string[];
  isMulti?: boolean;
  staticMultiLabel?: string;
  staticMultiCode?: string;
  renderTrigger?: (selectedOptions: SelectOption[], values: string[]) => React.ReactNode;
  onChange?: (value: string) => void;
  onToggleValue?: (value: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
  placeholder?: string;
  label?: string;
  badge?: React.ReactNode | string;
  onBadgeClick?: () => void;
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

const cleanGroupName = (groupName?: string): string => {
  if (!groupName) return '';
  return groupName.replace(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Regional_Indicator}){1,2}\s*/u, '').trim() || groupName;
};

const getBadgeStyles = (variant?: string) => {
  switch (variant) {
    case 'purple':
      return 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80';
    case 'emerald':
      return 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80';
    case 'amber':
      return 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80';
    case 'rose':
      return 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80';
    case 'cyan':
      return 'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/80';
    case 'zinc':
      return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
    case 'blue':
    default:
      return 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80';
  }
};

export const CommandPaletteSelect: React.FC<CommandPaletteSelectProps> = ({
  options = [],
  value = '',
  values,
  isMulti = false,
  staticMultiLabel,
  staticMultiCode,
  renderTrigger,
  onChange,
  onToggleValue,
  onSelectAll,
  onClearAll,
  placeholder = 'Select...',
  label,
  badge,
  onBadgeClick,
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
  const [maxListHeight, setMaxListHeight] = useState<number>(380);
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
    // Prefix / substring matching for legacy/short values like 'Appointment Based' matching 'Appointment Based & Scheduling'
    if (vLower.length >= 3 && (optValLower.startsWith(vLower) || optLabelLower.startsWith(vLower))) return true;
    if (optValLower.length >= 3 && (vLower.startsWith(optValLower) || vLower.startsWith(optLabelLower))) return true;
    // Word / token overlap matching
    const vTokens = vLower.split(/[\s&/(),-]+/).filter((t) => t.length > 2);
    const optTokens = `${optValLower} ${optLabelLower}`.split(/[\s&/(),-]+/).filter((t) => t.length > 2);
    if (vTokens.length > 0 && vTokens.every((vt) => optTokens.some((ot) => ot.includes(vt)))) return true;
    return false;
  }, []);

  const selected = safeOptions.find((o) => isOptionMatch(o, value));

  const filtered = query.trim()
    ? safeOptions.filter(
        (o) =>
          (o.label || '').toLowerCase().includes(query.toLowerCase()) ||
          (o.value || '').toLowerCase().includes(query.toLowerCase()) ||
          (o.description || '').toLowerCase().includes(query.toLowerCase()) ||
          (o.group || '').toLowerCase().includes(query.toLowerCase()) ||
          (o.subGroup || '').toLowerCase().includes(query.toLowerCase()) ||
          (o.location || '').toLowerCase().includes(query.toLowerCase())
      )
    : safeOptions;

  // Hierarchical two-tier grouping (Main Tab -> Sub Tab)
  interface GroupStructure {
    mainGroup: string;
    subGroups: Record<string, SelectOption[]>;
    subGroupKeys: string[];
    totalCount: number;
    hasSubGroups: boolean;
  }

  const mainGroups: Record<string, GroupStructure> = {};
  for (const opt of filtered) {
    const mainGrp = opt.group || '';
    const subGrp = opt.subGroup || '';
    if (!mainGroups[mainGrp]) {
      mainGroups[mainGrp] = {
        mainGroup: mainGrp,
        subGroups: {},
        subGroupKeys: [],
        totalCount: 0,
        hasSubGroups: false,
      };
    }
    if (!mainGroups[mainGrp].subGroups[subGrp]) {
      mainGroups[mainGrp].subGroups[subGrp] = [];
      mainGroups[mainGrp].subGroupKeys.push(subGrp);
    }
    if (subGrp) {
      mainGroups[mainGrp].hasSubGroups = true;
    }
    mainGroups[mainGrp].subGroups[subGrp].push(opt);
    mainGroups[mainGrp].totalCount += 1;
  }
  const mainGroupKeys = Object.keys(mainGroups);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    // Close other dropdowns
    window.dispatchEvent(new CustomEvent('app-close-dropdowns', { detail: { sourceId: id } }));

    // Smart Viewport Calculation to prevent any viewport clipping or taskbar overflow
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom - 20;
      const spaceAbove = rect.top - 20;

      const shouldOpenUp =
        direction === 'up' ||
        (direction === 'auto' && spaceBelow < 200 && spaceAbove > 320);

      setOpenUpward(shouldOpenUp);

      const availableHeight = shouldOpenUp ? spaceAbove : spaceBelow;
      const calculatedMaxHeight = Math.max(300, Math.min(480, availableHeight - 35));
      setMaxListHeight(calculatedMaxHeight);

      if (align === 'right') {
        setAlignRight(true);
      } else if (align === 'left') {
        setAlignRight(false);
      } else {
        const spaceOnRight = window.innerWidth - rect.right;
        setAlignRight(spaceOnRight < 240);
      }
    }

    setIsOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [disabled, direction, isOpen, id, align]);

  const currentSelectedValues = values || (value ? [value] : []);

  const handleSelect = useCallback(
    (val: string) => {
      if (isMulti) {
        if (onToggleValue) {
          onToggleValue(val);
        } else if (onChange) {
          onChange(val);
        }
      } else {
        onChange?.(val);
        setIsOpen(false);
        setQuery('');
      }
    },
    [isMulti, onToggleValue, onChange]
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

  const isExplicitSearchOrFilter = Boolean(
    placeholder && (
      placeholder.toLowerCase().startsWith('all ') ||
      placeholder.toLowerCase().startsWith('filter ') ||
      placeholder.toLowerCase().includes('optional') ||
      placeholder.toLowerCase().includes('none available') ||
      placeholder.toLowerCase().includes('select caller id did') ||
      placeholder.toLowerCase().includes('select sim slot')
    )
  );

  const renderSingleTrigger = () => {
    if (selected) {
      return (
        <>
          {selected.icon && <span className="shrink-0">{selected.icon}</span>}
          <span className="truncate text-left flex-1 font-semibold text-zinc-900 dark:text-zinc-100">
            {cleanOptionLabel(selected.label, !!selected.icon)}
          </span>
        </>
      );
    }

    if (safeOptions.length === 0) {
      return (
        <span className="truncate text-left flex-1 text-zinc-400 font-normal">
          {placeholder || 'None Available'}
        </span>
      );
    }

    const isIdOrHash = value && (
      value.includes('-') ||
      value.length > 22 ||
      /^(kno|bt|wh|dept|pol|disp|sim|dev|tel|sip|user|agent)_/i.test(value)
    );

    if (allowCustom && value && !isIdOrHash) {
      return (
        <span className="truncate text-left flex-1 font-semibold text-zinc-900 dark:text-zinc-100">
          {cleanOptionLabel(value, false)}
        </span>
      );
    }

    if (!isExplicitSearchOrFilter && safeOptions.length > 0 && !isMulti) {
      const defaultOpt = safeOptions[0];
      return (
        <>
          {defaultOpt.icon && <span className="shrink-0">{defaultOpt.icon}</span>}
          <span className="truncate text-left flex-1 font-semibold text-zinc-900 dark:text-zinc-100">
            {cleanOptionLabel(defaultOpt.label, !!defaultOpt.icon)}
          </span>
        </>
      );
    }

    return (
      <span className="truncate text-left flex-1 text-zinc-400 font-normal">
        {placeholder || 'Select...'}
      </span>
    );
  };

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
            onBadgeClick ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBadgeClick();
                }}
                className="text-[10px] font-semibold px-1.5 py-0.2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/40 rounded-md shrink-0 cursor-pointer transition-all hover:scale-105"
                title={`Open ${typeof badge === 'string' ? badge : 'configuration'}`}
              >
                {badge}
              </button>
            ) : typeof badge === 'string' ? (
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
          {isMulti ? (
            renderTrigger ? (
              renderTrigger(
                safeOptions.filter((o) => currentSelectedValues.includes(o.value)),
                currentSelectedValues
              )
            ) : currentSelectedValues.length > 0 ? (
              <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="shrink-0 text-blue-500 font-mono text-xs">⚡</span>
                  <span className="truncate text-left font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    {staticMultiLabel ||
                      (selected
                        ? cleanOptionLabel(selected.label, !!selected.icon)
                        : safeOptions.find((o) => o.value === currentSelectedValues[0])
                        ? cleanOptionLabel(safeOptions.find((o) => o.value === currentSelectedValues[0])!.label, false)
                        : 'Selected Capabilities')}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/90 text-blue-700 dark:text-blue-300 font-bold font-mono text-[10px] shrink-0 border border-blue-200 dark:border-blue-800/80">
                  {staticMultiCode || `${currentSelectedValues.length} Selected`}
                </span>
              </div>
            ) : (
              <span className="truncate text-left flex-1 text-zinc-400 font-normal">
                {placeholder}
              </span>
            )
          ) : (
            renderSingleTrigger()
          )}
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
        />
      </button>

      {/* Dropdown Panel - Floating popover with search & rich hierarchy */}
      {isOpen && (
        <div
          className={`absolute z-[999] ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} ${alignRight ? 'right-0' : 'left-0'} w-full min-w-full bg-white dark:bg-zinc-900 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 ring-1 ring-black/10 dark:ring-white/10`}
          style={{ maxHeight: `${maxListHeight + 65}px` }}
        >
          {/* Search Header */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-950/90 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Search className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  placeholder && placeholder.toLowerCase() !== 'select...'
                    ? placeholder.toLowerCase().startsWith('select ')
                      ? placeholder.replace(/^[Ss]elect\s+/i, 'Search ')
                      : placeholder.toLowerCase().startsWith('search ')
                      ? placeholder
                      : `Search ${placeholder.toLowerCase()}...`
                    : 'Search options...'
                }
                className="w-full bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none border-none font-medium"
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {isMulti && (
                <>
                  {onSelectAll && (
                    <button
                      type="button"
                      onClick={onSelectAll}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold cursor-pointer px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 transition-colors"
                    >
                      All
                    </button>
                  )}
                  {onClearAll && (
                    <button
                      type="button"
                      onClick={onClearAll}
                      className="text-[10px] text-zinc-500 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 font-bold cursor-pointer px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </>
              )}
              {(() => {
                const nonAllCount = filtered.filter((o) => o.value !== 'all' && o.value !== '').length;
                const displayCount = safeOptions.some((o) => o.value === 'all') && !query.trim()
                  ? nonAllCount
                  : filtered.length;
                return (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 shrink-0">
                    {displayCount} found
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Options List */}
          <div
            className="overflow-y-auto p-1.5 space-y-1.5 custom-scrollbar"
            style={{ maxHeight: `${maxListHeight}px` }}
          >
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
              mainGroupKeys.map((mainGrpKey) => {
                const grpStruct = mainGroups[mainGrpKey];

                return (
                  <div key={mainGrpKey} className="space-y-1 mb-2">
                    {/* Clean Category Divider */}
                    {mainGrpKey && (
                      <div className="px-3 py-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-50/90 dark:bg-zinc-950/90 rounded-lg sticky top-0 z-10 backdrop-blur-xs flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80">
                        <span className="truncate">{cleanGroupName(mainGrpKey)}</span>
                        <span className="text-[10px] font-mono font-medium text-zinc-400 dark:text-zinc-500">
                          {grpStruct.totalCount}
                        </span>
                      </div>
                    )}

                    {/* Sub-Tab Level Sections */}
                    {grpStruct.subGroupKeys.map((subGrpKey) => {
                      const items = grpStruct.subGroups[subGrpKey] || [];

                      return (
                        <div key={subGrpKey || 'default-sub'} className="space-y-1">
                          {/* Sub-Tab Section Header (when subGroup exists) */}
                          {subGrpKey && (
                            <div className="flex items-center justify-between px-2 pt-1 pb-0.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                              <span className="flex items-center gap-1.5 truncate">
                                <span className="text-blue-500 font-mono">↳</span>
                                <span className="uppercase tracking-wide text-zinc-600 dark:text-zinc-300">{subGrpKey}</span>
                              </span>
                              <span className="font-mono text-[9.5px] text-zinc-400 shrink-0">
                                ({items.length})
                              </span>
                            </div>
                          )}

                          {/* Clean Item Cards inside this Group */}
                          {items.map((opt) => {
                            const isSelected = isMulti
                              ? currentSelectedValues.includes(opt.value)
                              : selected
                              ? selected.value === opt.value
                              : isOptionMatch(opt, value) || (!value && !isExplicitSearchOrFilter && safeOptions[0]?.value === opt.value);

                            const badgeText = opt.badge;
                            const badgeStyle = getBadgeStyles(opt.badgeVariant);

                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSelect(opt.value)}
                                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-xs text-left rounded-xl transition-all cursor-pointer overflow-hidden border
                                  ${isSelected
                                    ? 'bg-blue-50/90 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold border-blue-300 dark:border-blue-700 shadow-2xs'
                                    : 'bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 border-zinc-100 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200'
                                  }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {opt.icon && <span className="shrink-0 text-blue-600 dark:text-blue-400">{opt.icon}</span>}
                                  <span className="truncate font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                                    {cleanOptionLabel(opt.label, !!opt.icon)}
                                  </span>
                                  {badgeText && (
                                    <span className={`text-[9.5px] font-semibold px-1.5 py-0.2 rounded border shrink-0 ${badgeStyle}`}>
                                      {typeof badgeText === 'string' ? badgeText : badgeText}
                                    </span>
                                  )}
                                </div>

                                <div className="shrink-0 pl-2">
                                  <Check
                                    className={`h-4 w-4 transition-opacity ${
                                      isSelected ? 'opacity-100 text-blue-600 dark:text-blue-400' : 'opacity-0'
                                    }`}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

