import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToastMessage } from '../../types';

interface ToastContextType {
  addToast: (
    typeOrObj: ToastMessage['type'] | Omit<ToastMessage, 'id'>,
    title?: string,
    description?: string
  ) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (
      typeOrObj: ToastMessage['type'] | Omit<ToastMessage, 'id'> | string,
      titleOrType?: string,
      description?: string
    ) => {
      let toastItem: Omit<ToastMessage, 'id'>;
      const validTypes = ['success', 'error', 'info', 'warning'];

      if (typeof typeOrObj === 'object') {
        toastItem = typeOrObj;
      } else if (validTypes.includes(typeOrObj as string)) {
        // Called as addToast('success', 'Title', 'Description')
        toastItem = {
          type: typeOrObj as ToastMessage['type'],
          title: titleOrType || 'Notification',
          description,
        };
      } else if (titleOrType && validTypes.includes(titleOrType)) {
        // Called as addToast('Title Message', 'success', 'Description')
        toastItem = {
          type: titleOrType as ToastMessage['type'],
          title: typeOrObj as string,
          description,
        };
      } else {
        toastItem = {
          type: 'info',
          title: (typeOrObj as string) || 'Notification',
          description: titleOrType,
        };
      }

      // Filter out empty titles or duplicate messages
      if (!toastItem.title || toastItem.title.trim() === '') return;

      const id = Math.random().toString(36).substring(2, 9);

      setToasts((prev) => {
        // Prevent duplicate toasts within 1 second
        if (prev.some((t) => t.title === toastItem.title && t.type === toastItem.type)) {
          return prev;
        }
        return [...prev, { ...toastItem, id }];
      });

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl flex items-start gap-3"
            >
              <div className="shrink-0 mt-0.5">{icons[toast.type || 'info']}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
