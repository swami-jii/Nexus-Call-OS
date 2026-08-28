import React, { useState, useEffect } from 'react';
import {
  Search,
  Bot,
  PhoneCall,
  Users,
  Megaphone,
  Settings,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { ScreenId } from '../../types';
import { Modal } from '../ui/Modal';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenId) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or toggle
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const commands = [
    {
      screen: 'dashboard' as ScreenId,
      title: 'Go to Executive Dashboard',
      category: 'Navigation',
      icon: <Search className="h-4 w-4" />,
    },
    {
      screen: 'agents' as ScreenId,
      title: 'Configure AI Voice Agents (Sophia, Marcus, Elena)',
      category: 'AI Agents',
      icon: <Bot className="h-4 w-4 text-blue-500" />,
    },
    {
      screen: 'call-history' as ScreenId,
      title: 'View Call Logs & Audio Transcripts',
      category: 'Telephony',
      icon: <PhoneCall className="h-4 w-4 text-emerald-500" />,
    },
    {
      screen: 'campaigns' as ScreenId,
      title: 'Manage AI Outbound & Inbound Campaigns',
      category: 'Outreach',
      icon: <Megaphone className="h-4 w-4 text-amber-500" />,
    },
    {
      screen: 'contacts' as ScreenId,
      title: 'Browse Lead Contacts Directory',
      category: 'Directory',
      icon: <Users className="h-4 w-4 text-purple-500" />,
    },
    {
      screen: 'settings' as ScreenId,
      title: 'OS Settings & Telephony Routing',
      category: 'System',
      icon: <Settings className="h-4 w-4 text-zinc-500" />,
    },
    {
      screen: 'help-center' as ScreenId,
      title: 'Open API Documentation & Help Center',
      category: 'Support',
      icon: <HelpCircle className="h-4 w-4 text-blue-400" />,
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (screen: ScreenId) => {
    onNavigate(screen);
    onClose();
    setQuery('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl">
      <div className="space-y-4 -m-2">
        {/* Input */}
        <div className="relative flex items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <Search className="h-5 w-5 text-zinc-400 absolute left-2 pointer-events-none" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, screen, or search keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 text-base bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto space-y-1 py-1">
          {filteredCommands.length === 0 ? (
            <p className="p-4 text-center text-xs text-zinc-500">No matching commands found.</p>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(cmd.screen)}
                className="w-full flex items-center justify-between p-3 rounded-lg text-left text-xs sm:text-sm hover:bg-blue-50 dark:hover:bg-blue-950/40 text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span>{cmd.icon}</span>
                  <span className="font-medium">{cmd.title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] uppercase font-semibold">
                    {cmd.category}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 select-none">
          <span>
            Use <kbd className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded">↑</kbd>{' '}
            <kbd className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded">↓</kbd> to navigate
          </span>
          <span>
            Press <kbd className="px-1 bg-zinc-200 dark:bg-zinc-800 rounded">ESC</kbd> to close
          </span>
        </div>
      </div>
    </Modal>
  );
};
