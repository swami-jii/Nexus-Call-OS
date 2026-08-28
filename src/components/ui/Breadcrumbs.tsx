import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onHomeClick?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onHomeClick }) => {
  return (
    <nav className="flex items-center space-x-1.5 text-xs text-zinc-500 dark:text-zinc-400 select-none">
      <button
        type="button"
        onClick={onHomeClick}
        className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-0.5 rounded"
      >
        <Home className="h-3.5 w-3.5" />
      </button>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-3 w-3 text-zinc-400 dark:text-zinc-600 shrink-0" />
          {item.active ? (
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {item.label}
            </span>
          ) : (
            <button
              type="button"
              onClick={item.onClick}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
