import React from 'react';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

const GRADIENT_PALETTES = [
  'from-emerald-500 to-teal-700 text-white',
  'from-blue-500 to-indigo-700 text-white',
  'from-purple-500 to-pink-600 text-white',
  'from-amber-500 to-orange-600 text-white',
  'from-cyan-500 to-blue-600 text-white',
  'from-rose-500 to-red-700 text-white',
  'from-violet-600 to-indigo-900 text-white',
];

const getInitials = (name: string): string => {
  if (!name || !name.trim()) return 'U';
  const clean = name.trim().replace(/[@._-]/g, ' ');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getDeterministicGradient = (str: string): string => {
  if (!str) return GRADIENT_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[index];
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  status,
  className = '',
}) => {
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs font-semibold',
    md: 'h-10 w-10 text-sm font-semibold',
    lg: 'h-12 w-12 text-base font-bold',
    xl: 'h-16 w-16 text-lg font-bold',
    '2xl': 'h-20 w-20 text-xl font-bold',
    '3xl': 'h-24 w-24 text-2xl font-bold',
  };

  const iconSizes = {
    xs: 'h-3.5 w-3.5',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
    '2xl': 'h-10 w-10',
    '3xl': 'h-12 w-12',
  };

  const statusColors = {
    online: 'bg-emerald-500 ring-white dark:ring-zinc-900',
    offline: 'bg-zinc-400 ring-white dark:ring-zinc-900',
    busy: 'bg-red-500 ring-white dark:ring-zinc-900',
    away: 'bg-amber-500 ring-white dark:ring-zinc-900',
  };

  const hasValidImage = Boolean(src && typeof src === 'string' && src.trim() !== '' && !imageFailed);

  return (
    <div className="relative inline-block shrink-0 select-none">
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs ${sizes[size]} ${className}`}
      >
        {hasValidImage ? (
          <img
            src={src}
            alt={name || 'User Avatar'}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover rounded-full"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
            <svg
              className={`${iconSizes[size]} text-zinc-400 dark:text-zinc-500`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ${statusColors[status]}`}
        />
      )}
    </div>
  );
};

export const AvatarGroup: React.FC<{
  users: { name: string; src?: string }[];
  limit?: number;
}> = ({ users, limit = 3 }) => {
  const visible = users.slice(0, limit);
  const remaining = users.length - limit;

  return (
    <div className="flex items-center -space-x-2 overflow-hidden">
      {visible.map((user, idx) => (
        <Avatar key={idx} name={user.name} src={user.src} size="sm" className="ring-2 ring-white dark:ring-zinc-900" />
      ))}
      {remaining > 0 && (
        <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center text-xs font-medium ring-2 ring-white dark:ring-zinc-900">
          +{remaining}
        </div>
      )}
    </div>
  );
};

