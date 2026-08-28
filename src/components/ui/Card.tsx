import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverable = false, ...props }) => {
  return (
    <div
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 ${
        hoverable
          ? 'transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/80 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Section Title — 17px semibold (ds-section-title)
export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3
      className={`text-[1.063rem] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

// Caption — 12px body
export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p
      className={`text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-normal ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`px-5 py-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
