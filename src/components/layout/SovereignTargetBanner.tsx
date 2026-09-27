import React from 'react';
import { Eye, ShieldAlert, X, Building, ArrowRight, RefreshCw } from 'lucide-react';
import { useSovereignTarget } from '../../context/SovereignTargetContext';

export const SovereignTargetBanner: React.FC = () => {
  const { targetAccount, isTargetActive, resetToSovereignWorkspace } = useSovereignTarget();

  if (!isTargetActive || !targetAccount) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-950/90 via-zinc-900 to-amber-950/90 border-b border-amber-500/30 text-amber-200 px-3 sm:px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-lg backdrop-blur-md z-30 transition-all animate-fadeIn">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 flex items-center justify-center animate-pulse">
          <Eye className="h-4 w-4" />
        </span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 text-[10px]">
            Sovereign Target Inspection
          </span>
          <span className="text-zinc-300 font-medium">
            Scoped to <strong className="text-white font-bold">{targetAccount.userName}</strong>
          </span>
          <span className="text-amber-300/80 font-mono text-[11px]">({targetAccount.userEmail})</span>
          {targetAccount.orgName && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60">
              <Building className="h-3 w-3 text-amber-400/80" />
              {targetAccount.orgName}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-amber-400/70 hidden lg:inline">
          All platform tabs dynamically scoped to target account
        </span>
        <button
          type="button"
          onClick={resetToSovereignWorkspace}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
          title="Exit Inspection & Return to Primary Sovereign Workspace"
        >
          <X className="h-3.5 w-3.5" />
          Exit Inspection
        </button>
      </div>
    </div>
  );
};
