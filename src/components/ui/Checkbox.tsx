import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, checked, className = '', id, onChange, ...props }, ref) => {
    const checkId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <label htmlFor={checkId} className="inline-flex items-start gap-2.5 cursor-pointer select-none">
        <div className="relative flex items-center mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkId}
            checked={checked}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <div className="h-4 w-4 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600/30 transition-colors flex items-center justify-center">
            {checked && <Check className="h-3 w-3 text-white stroke-[3]" />}
          </div>
        </div>
        {(label || description) && (
          <div className="text-sm leading-none">
            {label && <p className="font-medium text-zinc-900 dark:text-zinc-100">{label}</p>}
            {description && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
