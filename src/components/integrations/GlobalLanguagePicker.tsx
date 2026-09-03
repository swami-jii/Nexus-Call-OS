import React, { useState, useMemo } from 'react';
import { Search, Globe, ChevronDown, ChevronRight, Check, Sparkles, X, ChevronUp } from 'lucide-react';
import {
  GLOBAL_LANGUAGES_CATALOG,
  GlobalLanguageItem,
  getCountryGroupedLanguages
} from '../../data/globalLanguagesCatalog';

interface GlobalLanguagePickerProps {
  selectedLocale?: string;
  onSelectLanguage: (lang: GlobalLanguageItem) => void;
}

export const GlobalLanguagePicker: React.FC<GlobalLanguagePickerProps> = ({
  selectedLocale,
  onSelectLanguage
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState<string>('All');
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({
    IN: true // Open India by default for easy access
  });

  const countryGroups = useMemo(() => getCountryGroupedLanguages(), []);

  // Selected language object
  const selectedLang = useMemo(() => {
    if (!selectedLocale) return null;
    return GLOBAL_LANGUAGES_CATALOG.find((l) => l.locale === selectedLocale);
  }, [selectedLocale]);

  // Filter logic
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return countryGroups
      .filter((group) => {
        if (activeRegion !== 'All' && group.region !== activeRegion) {
          return false;
        }
        return true;
      })
      .map((group) => {
        if (!q) return group;

        const matchCountry =
          group.country.toLowerCase().includes(q) ||
          group.countryCode.toLowerCase().includes(q) ||
          group.dialCode.includes(q);

        const filteredLangs = group.languages.filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            l.nativeName.toLowerCase().includes(q) ||
            l.locale.toLowerCase().includes(q) ||
            l.currency.toLowerCase().includes(q) ||
            (l.notes && l.notes.toLowerCase().includes(q))
        );

        if (matchCountry) {
          return group;
        }

        if (filteredLangs.length > 0) {
          return {
            ...group,
            languages: filteredLangs
          };
        }

        return null;
      })
      .filter(Boolean) as typeof countryGroups;
  }, [countryGroups, activeRegion, searchQuery]);

  const toggleCountry = (code: string) => {
    setExpandedCountries((prev) => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    filteredGroups.forEach((g) => {
      all[g.countryCode] = true;
    });
    setExpandedCountries(all);
  };

  const collapseAll = () => {
    setExpandedCountries({});
  };

  const totalLanguagesCount = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.languages.length, 0);
  }, [filteredGroups]);

  return (
    <div className="bg-zinc-50/80 dark:bg-zinc-950/80 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all overflow-hidden">
      {/* Collapsed Bar State */}
      {!isPanelOpen ? (
        <div className="p-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 rounded-lg shrink-0">
              <Globe className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2 min-w-0 truncate">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                Country &amp; Language Presets (200+ Global, 28+ India)
              </span>
              {selectedLang && (
                <span className="text-[10.5px] font-semibold px-2 py-0.5 bg-cyan-100/70 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 rounded-md shrink-0 flex items-center gap-1">
                  <span>{selectedLang.flag}</span>
                  <span>{selectedLang.name}</span>
                  <span className="font-mono text-[9px] opacity-75">({selectedLang.locale})</span>
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPanelOpen(true)}
            className="px-2.5 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-cyan-300 transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
          >
            <Sparkles className="h-3 w-3" />
            <span>Open Presets</span>
            <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
          </button>
        </div>
      ) : (
        /* Expanded Full Presets Box */
        <div className="p-3 space-y-2.5">
          {/* Header & Live Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-zinc-200/70 dark:border-zinc-800/70 pb-2">
            <div className="flex items-center justify-between sm:justify-start gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 rounded-lg shrink-0">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      Country &amp; Language Presets
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 rounded-full font-bold shrink-0">
                      {totalLanguagesCount} Languages
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                    Expand country dropdown to 1-click auto-fill all fields (India 28+ dialects, US, UK, etc.)
                  </p>
                </div>
              </div>

              {/* Close / Collapse Button (Mobile/Desktop) */}
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center gap-1 px-1.5 py-0.5 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 shrink-0 cursor-pointer sm:hidden"
                title="Collapse Presets Panel"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Hide</span>
              </button>
            </div>

            {/* Search Bar & Desktop Collapse Button */}
            <div className="flex items-center gap-1.5">
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Hindi, Tamil, Arabic, +91, hi-IN..."
                  className="w-full pl-8 pr-6 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-cyan-500 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                className="hidden sm:flex items-center gap-1 px-2 py-1 text-[10.5px] font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 rounded-lg shrink-0 cursor-pointer shadow-2xs"
                title="Collapse Presets Box"
              >
                <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
                <span>Hide Box</span>
              </button>
            </div>
          </div>

          {/* Region Filter Tabs & Controls */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              {[
                { id: 'All', label: 'All' },
                { id: 'India', label: '🇮🇳 India (28+)' },
                { id: 'Asia-Pacific', label: '🌏 Asia' },
                { id: 'Europe', label: '🇪🇺 Europe' },
                { id: 'Middle East & Africa', label: '🌍 MEA' },
                { id: 'Americas & Oceania', label: '🌎 Americas' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveRegion(tab.id)}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    activeRegion === tab.id
                      ? 'bg-cyan-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 shrink-0">
              <button
                type="button"
                onClick={expandAll}
                className="hover:text-cyan-600 dark:hover:text-cyan-400 font-semibold cursor-pointer"
              >
                Expand All
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={collapseAll}
                className="hover:text-cyan-600 dark:hover:text-cyan-400 font-semibold cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Scrollable Country Accordions Container (Balanced height: 220px) */}
          <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {filteredGroups.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400">
                No matching countries or languages found for "{searchQuery}".
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isExpanded = searchQuery.trim().length > 0 || !!expandedCountries[group.countryCode];
                const hasSelected = group.languages.some((l) => l.locale === selectedLocale);

                return (
                  <div
                    key={group.countryCode}
                    className={`border rounded-lg transition-all overflow-hidden ${
                      hasSelected
                        ? 'border-cyan-400 dark:border-cyan-700 bg-cyan-50/20 dark:bg-cyan-950/20'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                    }`}
                  >
                    {/* Country Accordion Row */}
                    <button
                      type="button"
                      onClick={() => toggleCountry(group.countryCode)}
                      className="w-full px-2.5 py-1.5 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base leading-none shrink-0">{group.flag}</span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {group.country}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline truncate">
                          ({group.currencySymbol} • {group.countryCode})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9.5px] font-semibold px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-zinc-600 dark:text-zinc-400">
                          {group.languages.length} {group.languages.length === 1 ? 'Lang' : 'Langs'}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Country Languages Grid */}
                    {isExpanded && (
                  <div className="p-2 pt-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40">
                    {group.languages.map((lang) => {
                      const isSelected = lang.locale === selectedLocale;

                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => onSelectLanguage(lang)}
                          className={`p-2 rounded-lg text-left border transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-50 dark:bg-cyan-950/70 border-cyan-500 dark:border-cyan-600 shadow-2xs ring-1 ring-cyan-500'
                              : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-cyan-300 dark:hover:border-cyan-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1 w-full">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span className="text-[11.5px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                  {lang.name}
                                </span>
                                {lang.isOfficial && (
                                  <span className="text-[8px] font-bold px-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded shrink-0">
                                    Official
                                  </span>
                                )}
                              </div>
                              <div className="text-[10.5px] font-semibold text-cyan-600 dark:text-cyan-400 truncate">
                                {lang.nativeName}
                              </div>
                            </div>

                            <span className="text-[9.5px] font-mono font-bold px-1 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded shrink-0">
                              {lang.locale}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1 text-[9px] text-zinc-500 pt-1 border-t border-zinc-100 dark:border-zinc-800/60 w-full">
                            <span className="truncate">
                              {lang.currency} • {lang.locale}
                            </span>
                            {isSelected ? (
                              <span className="text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-0.5 shrink-0">
                                <Check className="h-3 w-3" /> Selected
                              </span>
                            ) : (
                              <span className="text-zinc-400 hover:text-cyan-600 font-semibold shrink-0">
                                ⚡ Use
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
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
