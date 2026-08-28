import React from 'react';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  status,
  className = '',
}) => {
  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const statusColors = {
    online: 'bg-emerald-500 ring-white dark:ring-zinc-900',
    offline: 'bg-zinc-400 ring-white dark:ring-zinc-900',
    busy: 'bg-red-500 ring-white dark:ring-zinc-900',
    away: 'bg-amber-500 ring-white dark:ring-zinc-900',
  };

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 select-none ${sizes[size]} ${className}`}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
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
