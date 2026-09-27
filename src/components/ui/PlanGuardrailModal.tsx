import React from 'react';
import {
  Lock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Zap,
  CheckCircle2,
  X,
  Crown,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';

export interface PlanGuardrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureTitle: string;
  featureDescription?: string;
  requiredTier?: string;
  currentPlanName?: string;
  onNavigateToBilling?: () => void;
}

export const PlanGuardrailModal: React.FC<PlanGuardrailModalProps> = ({
  isOpen,
  onClose,
  featureTitle,
  featureDescription,
  requiredTier = 'Growth Pro',
  currentPlanName = 'Starter Pilot',
  onNavigateToBilling,
}) => {
  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    onClose();
    if (onNavigateToBilling) {
      onNavigateToBilling();
    } else {
      // Fallback navigate to billing
      const event = new CustomEvent('nexus_navigate_screen', { detail: 'billing' });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-amber-500/30 dark:border-amber-500/20 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Header Icon & Status Badges */}
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-inner flex-shrink-0">
              <Lock className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700">
                  Current: {currentPlanName}
                </Badge>
                <Badge variant="default" className="text-[11px] font-semibold bg-gradient-to-r from-amber-500 to-rose-500 text-white border-none shadow-sm">
                  <Crown className="h-3 w-3 mr-1" /> Requires {requiredTier}
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {featureTitle}
              </h3>
            </div>
          </div>

          {/* Description Text */}
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 mb-5">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
                {featureDescription ||
                  `This capability or engine is locked on your current ${currentPlanName} plan. Upgrade your plan to activate higher capacity, frontier AI models, and real-time telecom pipelines.`}
              </p>
            </div>
          </div>

          {/* Unlocked Benefits Showcase */}
          <div className="space-y-2 mb-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              Unlocked on {requiredTier} & Above:
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-700 dark:text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span>Frontier Multi-Model AI</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span>Ultra-Low Latency Speech</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span>Expanded Carrier Concurrency</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span>Real-Time Webhooks & APIs</span>
              </li>
            </ul>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-medium"
            >
              Stay on Current Plan
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleUpgradeClick}
              className="text-xs font-semibold bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white shadow-md flex items-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              Upgrade to {requiredTier}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
