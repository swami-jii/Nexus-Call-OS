import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  label,
  error,
}) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-xs font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400">
          {label}
        </label>
      )}
      <div className="space-y-2">
        {options.map((opt) => {
          const optId = `${name}-${opt.value}`;
          const isSelected = value === opt.value;
          return (
            <label
              key={opt.value}
              htmlFor={optId}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/20'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <input
                type="radio"
                id={optId}
                name={name}
                value={opt.value}
                checked={isSelected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <div
                className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                  isSelected ? 'border-blue-600 bg-blue-600' : 'border-zinc-400 dark:border-zinc-600'
                }`}
              >
                {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
              <div className="text-sm">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{opt.label}</span>
                {opt.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{opt.description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
    </div>
  );
};
