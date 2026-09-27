import React, { useRef, useState, useMemo } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  MotionValue,
} from 'motion/react';
import { Share2, Sparkles, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandSocialIcon } from '../ui/BrandSocialIcon';
import { detectSocialPlatform, getPlatformMeta, formatSocialUrl } from '../../data/globalSocialPlatformsCatalog';

export interface ActiveSocialChannelItem {
  id: string;
  name: string;
  label?: string;
  url: string;
  iconId: string;
  customIconUrl?: string;
  brandColor: string;
}

export interface FloatingSocialDockProps {
  previewChannels?: ActiveSocialChannelItem[];
  previewPlacement?: string;
  isPreview?: boolean;
}

/**
 * World-Class Magnetic Proximity Dock Icon Item
 * Inspired by macOS Sequoia, Linear & Raycast UI with fluid spring physics
 */
const DockIconItem: React.FC<{
  mouseX: MotionValue<number>;
  channel: ActiveSocialChannelItem;
  isInteractive?: boolean;
}> = ({ mouseX, channel, isInteractive = true }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate distance from cursor to icon center
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Smooth proximity magnification (40px base -> 56px peak)
  const widthSync = useTransform(distance, [-150, 0, 150], [40, 58, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 160, damping: 14 });

  const iconScaleSync = useTransform(distance, [-150, 0, 150], [1, 1.28, 1]);
  const iconScale = useSpring(iconScaleSync, { mass: 0.1, stiffness: 160, damping: 14 });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className="aspect-square relative flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Raycast-style floating tooltip */}
      <AnimatePresence>
        {isHovered && isInteractive && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: -42, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.94 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute -top-1 left-1/2 -translate-x-1/2 pointer-events-none z-50 whitespace-nowrap"
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 shadow-xl border border-white/10 dark:border-zinc-300 text-[10px] font-semibold tracking-tight backdrop-blur-md">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: channel.brandColor || '#14b8a6' }}
              />
              <span>{channel.label || channel.name}</span>
            </div>
            {/* Tooltip caret pointer */}
            <div className="w-2 h-2 bg-zinc-900/95 dark:bg-zinc-100/95 rotate-45 mx-auto -mt-1 border-r border-b border-white/10 dark:border-zinc-300" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Icon Link */}
      <motion.a
        href={channel.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ scale: iconScale }}
        whileTap={{ scale: 0.9 }}
        title={`${channel.name} • ${channel.url}`}
        className="w-full h-full rounded-2xl flex items-center justify-center p-2 bg-zinc-100/80 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700/80 border border-zinc-200/60 dark:border-zinc-700/50 shadow-xs hover:shadow-md transition-colors cursor-pointer group"
      >
        {channel.customIconUrl ? (
          <img
            src={channel.customIconUrl}
            alt={channel.name}
            className="h-full w-full rounded-xl object-cover shadow-2xs"
          />
        ) : (
          <BrandSocialIcon
            platformId={channel.iconId}
            className="h-full w-full shrink-0 rounded-xl"
          />
        )}
      </motion.a>
    </motion.div>
  );
};

export const FloatingSocialDock: React.FC<FloatingSocialDockProps> = ({
  previewChannels,
  previewPlacement,
  isPreview = false,
}) => {
  const { user } = useAuth();
  const mouseX = useMotionValue(Infinity);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [isDockMinimized, setIsDockMinimized] = useState(false);

  // Compute active channels list
  const activeChannels = useMemo<ActiveSocialChannelItem[]>(() => {
    if (previewChannels) return previewChannels;
    if (!user) return [];

    const list: ActiveSocialChannelItem[] = [];

    // Standard preset channels
    if (user.socialLinks && typeof user.socialLinks === 'object') {
      Object.entries(user.socialLinks).forEach(([key, val]) => {
        const rawVal = typeof val === 'string' ? val.trim() : '';
        if (rawVal) {
          const detected = detectSocialPlatform(rawVal);
          const meta = getPlatformMeta(key);
          const formattedUrl = formatSocialUrl(rawVal, meta?.prefixUrl);
          list.push({
            id: key,
            name: detected.id !== 'website' ? detected.name : (meta?.name || key),
            url: formattedUrl,
            iconId: detected.id !== 'website' ? detected.id : (meta?.id || key),
            brandColor: detected.id !== 'website' ? detected.brandColor : (meta?.brandColor || '#14b8a6'),
          });
        }
      });
    }

    // Custom channels
    if (Array.isArray((user as any).customSocialChannels)) {
      (user as any).customSocialChannels.forEach((custom: any) => {
        if (custom && custom.enabled !== false && custom.url && typeof custom.url === 'string' && custom.url.trim()) {
          const detected = detectSocialPlatform(custom.url);
          list.push({
            id: custom.id || `custom_${Math.random()}`,
            name: custom.platform || detected.name,
            label: custom.label,
            url: formatSocialUrl(custom.url),
            iconId: custom.icon ? custom.icon.toLowerCase() : detected.id,
            customIconUrl: custom.customIconUrl,
            brandColor: detected.brandColor || custom.color || '#14b8a6',
          });
        }
      });
    }

    return list;
  }, [user, previewChannels]);

  const showSocial = isPreview ? true : user?.showSocialInUI !== false;
  const placement = previewPlacement || user?.socialPlacement || 'floating';

  // If placement is strictly header or sidebar only, floating dock should not render
  const isFloatingPlacement =
    placement === 'floating' ||
    placement === 'speed_dial' ||
    placement === 'bottom_island' ||
    placement === 'edge_drawer' ||
    placement === 'all';

  const shouldRender = isPreview || (showSocial && isFloatingPlacement && activeChannels.length > 0);

  if (!shouldRender || activeChannels.length === 0) {
    return null;
  }

  // =========================================================================
  // 1. SPEED-DIAL / RAYCAST ACTION TRIGGER MODE
  // =========================================================================
  if (placement === 'speed_dial') {
    return (
      <aside
        aria-label="Floating Speed-Dial Social Launcher"
        className="fixed bottom-6 right-6 z-40 select-none"
        onMouseEnter={() => setIsSpeedDialOpen(true)}
        onMouseLeave={() => setIsSpeedDialOpen(false)}
      >
        <div className="relative flex flex-col items-end gap-2.5">
          <AnimatePresence>
            {isSpeedDialOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                className="p-3 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.6)] flex flex-col gap-2 min-w-[190px] ring-1 ring-zinc-900/5 dark:ring-white/10"
              >
                <div className="flex items-center justify-between pb-1.5 px-1 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                    <span className="text-[10px] font-bold tracking-wider text-zinc-900 dark:text-zinc-100 uppercase">
                      Brand Channels
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
                    {activeChannels.length} active
                  </span>
                </div>

                <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto scrollbar-none py-0.5">
                  {activeChannels.map((channel, idx) => (
                    <motion.a
                      key={channel.id}
                      href={channel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.025, type: 'spring', stiffness: 400, damping: 24 }}
                      whileHover={{ scale: 1.02, x: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-zinc-100 dark:border-zinc-800/50 hover:border-teal-300 dark:hover:border-teal-700/60 text-zinc-900 dark:text-zinc-100 transition-all cursor-pointer group"
                      title={`${channel.name} - ${channel.url}`}
                    >
                      <div className="p-1 rounded-lg bg-white dark:bg-zinc-900 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                        {channel.customIconUrl ? (
                          <img
                            src={channel.customIconUrl}
                            alt={channel.name}
                            className="h-4 w-4 rounded object-cover"
                          />
                        ) : (
                          <BrandSocialIcon
                            platformId={channel.iconId}
                            className="h-4 w-4 shrink-0 rounded"
                          />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-semibold truncate leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {channel.label || channel.name}
                        </span>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate">
                          {channel.url.replace(/^https?:\/\//, '')}
                        </span>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trigger Button with Ambient Pulse Ring */}
          <motion.button
            type="button"
            onClick={() => setIsSpeedDialOpen((prev) => !prev)}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className={`h-11 w-11 rounded-full shadow-lg backdrop-blur-xl flex items-center justify-center cursor-pointer transition-all duration-300 relative border ${
              isSpeedDialOpen
                ? 'bg-teal-600 text-white border-teal-500 ring-4 ring-teal-500/20'
                : 'bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.12)]'
            }`}
            title={isSpeedDialOpen ? 'Close Channels' : 'Explore Social Channels'}
          >
            {!isSpeedDialOpen && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500 ring-2 ring-white dark:ring-zinc-900" />
              </span>
            )}
            {isSpeedDialOpen ? (
              <X className="h-4 w-4 stroke-[2.5]" />
            ) : (
              <Share2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            )}
          </motion.button>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // 2. MACOS SEQUOIA DYNAMIC ISLAND & FLOATING DOCK MODE (Magnetic Proximity)
  // =========================================================================
  const isCentered = placement === 'bottom_island';

  return (
    <aside
      aria-label="Floating Dynamic Glass Dock"
      className={`fixed ${
        isCentered
          ? 'bottom-6 left-1/2 -translate-x-1/2'
          : 'bottom-6 right-6'
      } z-40 select-none transition-all duration-300`}
    >
      <AnimatePresence mode="wait">
        {!isDockMinimized ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className="flex items-center gap-2 p-2 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.55)] ring-1 ring-zinc-900/5 dark:ring-white/10"
          >
            {/* Status Live Indicator Pill */}
            <div className="flex items-center gap-1.5 pl-2 pr-1 text-zinc-500 dark:text-zinc-400 border-r border-zinc-200/80 dark:border-zinc-800/80">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
              </span>
              <span className="text-[11px] font-bold font-mono tracking-tight text-zinc-800 dark:text-zinc-200 hidden sm:inline">
                Social
              </span>
            </div>

            {/* Proximity Magnetic Icon Items Row */}
            <div className="flex items-center gap-1.5 px-1">
              {activeChannels.map((channel) => (
                <DockIconItem
                  key={channel.id}
                  mouseX={mouseX}
                  channel={channel}
                />
              ))}
            </div>

            {/* Minimize / Collapse Button */}
            {!isPreview && (
              <button
                type="button"
                onClick={() => setIsDockMinimized(true)}
                title="Minimize Dock"
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        ) : (
          !isPreview && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={() => setIsDockMinimized(false)}
              title="Expand Social Dock"
              className="flex items-center gap-2 px-3.5 py-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-full shadow-xl hover:scale-105 transition-all text-zinc-800 dark:text-zinc-200 cursor-pointer group"
            >
              <Share2 className="h-4 w-4 text-teal-600 dark:text-teal-400 group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-300">
                Social ({activeChannels.length})
              </span>
              <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
            </motion.button>
          )
        )}
      </AnimatePresence>
    </aside>
  );
};
