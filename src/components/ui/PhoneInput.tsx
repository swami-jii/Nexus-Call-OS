import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Check, Phone } from 'lucide-react';
import { ALL_COUNTRIES, Country, detectCountryFromPhone } from '../../data/globalCountryCodesCatalog';

export interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string, isValid: boolean) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  label = 'Phone Number',
  error,
  placeholder,
  disabled = false,
  className = '',
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(ALL_COUNTRIES[0]); // US default
  const [nationalNumber, setNationalNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync internal state when external value changes or initializes
  useEffect(() => {
    if (!value) {
      setNationalNumber('');
      return;
    }
    const detected = detectCountryFromPhone(value);
    if (detected) {
      setSelectedCountry(detected);
      const rawDigits = value.replace(detected.dialCode, '').trim();
      setNationalNumber(rawDigits);
    } else {
      setNationalNumber(value);
    }
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = ALL_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;

    // Auto-detect if user pastes or types '+'
    if (rawVal.startsWith('+')) {
      const detected = detectCountryFromPhone(rawVal);
      if (detected) {
        setSelectedCountry(detected);
        const rest = rawVal.replace(detected.dialCode, '').trim();
        setNationalNumber(rest);
        const fullNum = `${detected.dialCode} ${rest}`;
        const isValid = rest.replace(/\D/g, '').length >= 7;
        onChange(fullNum, isValid);
        return;
      }
    }

    setNationalNumber(rawVal);
    const fullNum = `${selectedCountry.dialCode} ${rawVal}`;
    const digitsOnly = rawVal.replace(/\D/g, '');
    const isValid = digitsOnly.length >= 7;
    onChange(fullNum, isValid);
  };

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');
    const fullNum = `${country.dialCode} ${nationalNumber}`;
    const digitsOnly = nationalNumber.replace(/\D/g, '');
    const isValid = digitsOnly.length >= 7;
    onChange(fullNum, isValid);
  };

  const isValidLength = nationalNumber.replace(/\D/g, '').length >= 7;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      <div className="relative flex items-center" ref={dropdownRef}>
        {/* Country Selector Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-zinc-50 dark:bg-zinc-900 border border-r-0 border-zinc-200 dark:border-zinc-800 rounded-l-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span>{selectedCountry.dialCode}</span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </button>

        {/* Phone Input Field */}
        <input
          type="tel"
          disabled={disabled}
          value={nationalNumber}
          onChange={handleTextChange}
          placeholder={placeholder || selectedCountry.format}
          className={`w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border rounded-r-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
            error
              ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        />

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-72 max-h-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
            {/* Search Box */}
            <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/50">
              <Search className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code..."
                className="w-full text-xs bg-transparent border-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {filteredCountries.length === 0 ? (
                <div className="p-3 text-center text-xs text-zinc-400">No countries found</div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.code === selectedCountry.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelectCountry(c)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-950/50 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs truncate">
                        <span className="text-base">{c.flag}</span>
                        <span className="text-zinc-900 dark:text-zinc-100 truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-zinc-500">{c.dialCode}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Helper text / error / validation */}
      {error ? (
        <p className="text-[11px] text-red-500">{error}</p>
      ) : (
        <div className="flex items-center justify-between text-[10px] text-zinc-400">
          <span>Format: {selectedCountry.dialCode} {selectedCountry.format}</span>
          {nationalNumber && (
            <span className={isValidLength ? 'text-emerald-500 font-medium' : 'text-amber-500'}>
              {isValidLength ? 'Valid number format' : 'Incomplete digits'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
