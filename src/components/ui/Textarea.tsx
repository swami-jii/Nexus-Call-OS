import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const areaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={areaId}
            className="block text-xs font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          className={`w-full rounded-lg border bg-white dark:bg-zinc-900 p-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 dark:focus:border-teal-400 disabled:opacity-50 min-h-[90px] ${
            error
              ? 'border-red-500 focus:ring-red-500/20'
              : 'border-zinc-300 dark:border-zinc-700/80'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
