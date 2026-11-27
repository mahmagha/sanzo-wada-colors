import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  hasBottomTray?: boolean;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  onClose,
  hasBottomTray = false,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 2400);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed ${
        hasBottomTray ? 'bottom-20 sm:bottom-6' : 'bottom-6'
      } right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-stone-900 text-stone-100 shadow-2xl border border-stone-700/60 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 max-w-[calc(100vw-2rem)]`}
    >
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
        <Check size={13} strokeWidth={2.5} />
      </div>
      <span className="truncate">{message}</span>
    </div>
  );
};
