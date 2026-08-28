import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  ArrowLeft,
  Share2,
  Check,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';

interface MobileGatewayProps {
  onNavigate?: (screen: any) => void;
}

export const MobileGatewayView: React.FC<MobileGatewayProps> = ({ onNavigate }) => {
  const { addToast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);

  const copyPairingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    addToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg space-y-4 my-auto">
        
        {/* Header */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onNavigate && (
              <button
                onClick={() => onNavigate('demo-studio')}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <img
              src="/app-icon.png"
              alt="Nexus App Logo"
              className="w-10 h-10 rounded-xl shadow-md border border-emerald-500/40 object-cover"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Nexus Call OS</h1>
                <Badge variant="emerald" className="text-[9px] px-1.5 py-0 font-mono">
                  v2.4
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Android Gateway Installer
              </p>
            </div>
          </div>

          <button
            onClick={copyPairingLink}
            title="Share Link"
            className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Primary Download Card */}
        <div className="p-6 bg-white dark:bg-zinc-900 border border-emerald-500/30 rounded-2xl shadow-md space-y-5">
          <div className="text-center space-y-1.5">
            <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 mb-1">
              <Smartphone className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              Download Android Gateway
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Install the official native Android app to route GSM voice calls through your phone's real SIM cards.
            </p>
          </div>

          {/* Large Primary Download Button */}
          <div className="space-y-2">
            <a
              href="/download"
              download="Nexus-GSM-Gateway-v2.4.apk"
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2.5 transition-all"
            >
              <Download className="h-5 w-5" />
              <span>Download Android APK</span>
            </a>

            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1 font-mono">
              <span>Nexus-GSM-Gateway-v2.4.apk</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">~6.86 MB</span>
            </div>
          </div>

          {/* Installation Steps */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <span className="font-bold text-[11px] uppercase tracking-wider text-zinc-400 block">
              Quick Installation Steps
            </span>

            <div className="space-y-2 text-zinc-600 dark:text-zinc-300 text-xs">
              <div className="flex items-start space-x-2.5 p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>Tap <strong>Download Android APK</strong> above.</span>
              </div>

              <div className="flex items-start space-x-2.5 p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>If Chrome asks <em>"File might be harmful"</em>, tap <strong>Download anyway</strong>.</span>
              </div>

              <div className="flex items-start space-x-2.5 p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>Once downloaded, tap <strong>Open</strong> &rarr; tap <strong>Install</strong>.</span>
              </div>

              <div className="flex items-start space-x-2.5 p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <span>Open the app and grant permissions for Microphone, Phone Calls & Notifications.</span>
              </div>
            </div>
          </div>

          {/* Completion Note */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>
              <strong>Installation complete?</strong> Open <strong>Nexus Call OS Gateway</strong> on your phone.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
