import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className = '',
  action,
}) => {
  const styles = {
    info: 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200',
    success:
      'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200',
    warning:
      'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200',
    error:
      'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200',
  };

  const icons = {
    info: <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
    error: <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />,
  };

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs sm:text-sm ${styles[type]} ${className}`}>
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
