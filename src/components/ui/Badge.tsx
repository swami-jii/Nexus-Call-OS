import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline' | 'secondary';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  className = '',
}) => {
  const variants = {
    default:
      'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700',
    primary:
      'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900',
    secondary:
      'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700',
    success:
      'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900',
    warning:
      'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900',
    danger:
      'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900',
    outline:
      'bg-transparent text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700',
  };

  const dotColors = {
    default:   'bg-zinc-400',
    primary:   'bg-blue-600',
    secondary: 'bg-zinc-400',
    success:   'bg-emerald-500',
    warning:   'bg-amber-500',
    danger:    'bg-red-500',
    outline:   'bg-zinc-400',
  };

  // sm = 11px / caption — inside table cells
  // md = 12px / caption — standalone badges
  const sizes = {
    sm: 'px-2    py-0.5 text-[0.6875rem] gap-1',
    md: 'px-2.5  py-1   text-xs          gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full select-none whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      {children}
    </span>
  );
};
