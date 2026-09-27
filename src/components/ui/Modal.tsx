import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';
  footer?: React.ReactNode;
  zIndexClass?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth,
  size,
  footer,
  zIndexClass = 'z-[9999]',
}) => {
  const [mounted, setMounted] = useState(false);
  const effectiveSize = size || maxWidth || 'md';
  const isFull = effectiveSize === 'full';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-[720px]',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-[1100px]',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-[1300px]',
    full: 'w-full max-w-none h-screen max-h-screen',
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 ${zIndexClass} flex items-center justify-center ${isFull ? 'p-0' : 'p-4 sm:p-6 md:p-8'} overflow-hidden`}>
          {/* Backdrop (Dark overlay + Glassmorphic blur covering entire viewport) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: isFull ? 1 : 0.95, y: isFull ? 0 : 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: isFull ? 1 : 0.95, y: isFull ? 0 : 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative z-10 w-full flex flex-col ${widths[effectiveSize as keyof typeof widths] || 'max-w-md'} ${isFull ? 'h-full max-h-full rounded-none border-none' : 'h-auto max-h-[90vh] rounded-2xl border border-zinc-200 dark:border-zinc-800'} bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden`}
          >
            {/* Header */}
            {(title || description) && (
              <div className="px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-4 shrink-0">
                <div>
                  {title && (
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className={isFull ? 'p-0 overflow-hidden flex-1 flex flex-col min-h-0' : 'p-6 overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin scroll-smooth'}>{children}</div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
};
