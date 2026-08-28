import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap rounded-lg';

  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm border border-blue-600/80',
    secondary:
      'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700',
    outline:
      'bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800',
    ghost:
      'bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-red-600',
    link:
      'bg-transparent text-blue-600 dark:text-blue-400 hover:underline p-0 h-auto font-medium',
  };

  // Design system scale:
  // xs = 32px tall, caption text  — compact table actions
  // sm = 36px tall, caption text  — toolbar secondary actions
  // md = 40px tall, body text     — primary actions
  // lg = 44px tall, body text     — hero / modal primary CTA
  const sizes = {
    xs:   'h-8  px-2.5 text-[0.6875rem] gap-1',
    sm:   'h-9  px-3.5 text-xs          gap-1.5',
    md:   'h-10 px-4   text-sm          gap-2',
    lg:   'h-11 px-5   text-sm          gap-2',
    icon: 'h-10 w-10   p-0             text-sm',
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
    </button>
  );
};
