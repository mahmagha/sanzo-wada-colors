import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 2400);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-stone-900 text-stone-100 shadow-2xl border border-stone-700/60 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
        <Check size={13} strokeWidth={2.5} />
      </div>
      <span>{message}</span>
    </div>
  );
};
