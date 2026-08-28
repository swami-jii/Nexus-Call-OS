import React from 'react';

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showPercent?: boolean;
  className?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'red';
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  label,
  showPercent = false,
  className = '',
  color = 'blue',
}) => {
  const percentage = Math.min(Math.max(0, Math.round((value / max) * 100)), 100);

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colors = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {label && <span>{label}</span>}
          {showPercent && <span>{percentage}%</span>}
        </div>
      )}
      <div
        className={`w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden ${heights[size]}`}
      >
        <div
          className={`h-full ${colors[color]} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
