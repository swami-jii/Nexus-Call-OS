import React from 'react';
import { Lock, Check } from 'lucide-react';
import { Badge } from './Badge';

export interface PlanLockedBadgeProps {
  isLocked?: boolean;
  isAllowed?: boolean;
  requiredTier?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export const PlanLockedBadge: React.FC<PlanLockedBadgeProps> = ({
  isLocked,
  isAllowed,
  requiredTier = 'Growth Pro',
  onClick,
  className = '',
}) => {
  const locked = isLocked !== undefined ? isLocked : isAllowed !== undefined ? !isAllowed : false;

  if (!locked) {
    return (
      <Badge
        variant="success"
        className={`text-[10px] font-medium py-0.5 px-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 ${className}`}
      >
        <Check className="h-3 w-3" />
        Included in Plan
      </Badge>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${className}`}
      title={`Locked on current plan. Click to view upgrade options for ${requiredTier}.`}
    >
      <Lock className="h-3 w-3 text-amber-500 group-hover:animate-bounce" />
      <span>Locked ({requiredTier})</span>
    </button>
  );
};

