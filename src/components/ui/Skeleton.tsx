import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
}) => {
  const variants = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-zinc-200 dark:bg-zinc-800/80 ${variants[variant]} ${className}`}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="h-10 w-10" />
        <div className="space-y-1.5 w-32">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <div className="space-y-2 pt-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <tr className="border-b border-zinc-100 dark:border-zinc-800/60 animate-pulse">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="p-3">
        <Skeleton className="h-4 w-3/4" />
      </td>
    ))}
  </tr>
);

export const MetricSkeleton: React.FC = () => (
  <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
    <div className="flex justify-between items-center">
      <Skeleton className="h-3 w-24" />
      <Skeleton variant="circular" className="h-8 w-8" />
    </div>
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-3 w-20" />
  </div>
);
