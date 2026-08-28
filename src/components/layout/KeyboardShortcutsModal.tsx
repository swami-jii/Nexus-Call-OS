import React from 'react';
import { Modal } from '../ui/Modal';
import { Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const shortcutGroups = [
    {
      title: 'Global Navigation',
      shortcuts: [
        { keys: ['⌘', 'K'], label: 'Open Command Palette' },
        { keys: ['?'], label: 'Show Keyboard Shortcuts' },
        { keys: ['⌘', 'B'], label: 'Toggle Sidebar Collapse' },
        { keys: ['⌘', 'Shift', 'T'], label: 'Toggle Dark / Light Mode' },
      ],
    },
    {
      title: 'Quick Page Jump (G then Key)',
      shortcuts: [
        { keys: ['G', 'D'], label: 'Go to Dashboard' },
        { keys: ['G', 'A'], label: 'Go to AI Agents' },
        { keys: ['G', 'C'], label: 'Go to Campaigns' },
        { keys: ['G', 'L'], label: 'Go to Call History' },
        { keys: ['G', 'K'], label: 'Go to Knowledge Base' },
        { keys: ['G', 'S'], label: 'Go to Settings' },
      ],
    },
    {
      title: 'Actions & Utilities',
      shortcuts: [
        { keys: ['⌘', 'Z'], label: 'Undo Last Delete / Action' },
        { keys: ['Esc'], label: 'Close Modal or Drawer' },
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      description="Linear-style power shortcuts for rapid navigation"
      maxWidth="lg"
    >
      <div className="space-y-6 pt-2">
        {shortcutGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {group.title}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.shortcuts.map((sc) => (
                <div
                  key={sc.label}
                  className="p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs"
                >
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                    {sc.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {sc.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[11px] shadow-2xs font-semibold border border-zinc-300 dark:border-zinc-700"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
