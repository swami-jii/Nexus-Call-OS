import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'outline'
    | 'secondary'
    | 'emerald'
    | 'blue'
    | 'purple'
    | 'zinc'
    | 'info'
    | 'teal'
    | 'amber';
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
  const variants: Record<string, string> = {
    default:
      'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700',
    primary:
      'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80',
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
    emerald:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80',
    blue:
      'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80',
    purple:
      'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80',
    zinc:
      'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700',
    info:
      'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/80',
    teal:
      'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80',
    amber:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80',
  };

  const dotColors: Record<string, string> = {
    default:   'bg-zinc-400',
    primary:   'bg-teal-600',
    secondary: 'bg-zinc-400',
    success:   'bg-emerald-500',
    warning:   'bg-amber-500',
    danger:    'bg-red-500',
    outline:   'bg-zinc-400',
    emerald:   'bg-emerald-500',
    blue:      'bg-sky-500',
    purple:    'bg-purple-500',
    zinc:      'bg-zinc-400',
    info:      'bg-cyan-500',
    teal:      'bg-teal-500',
    amber:     'bg-amber-500',
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
