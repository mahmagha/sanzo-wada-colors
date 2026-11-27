import React, { useRef, useState } from 'react';
import { X, Keyboard, BookOpen, Download, Upload, Calendar } from 'lucide-react';
import { ARCHIVAL_NOTES, MONTH_OPTIONS } from '../utils/paletteData';
import { useModalDialog } from '../utils/useModalDialog';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: string[];
  onImportFavorites: (importedKeys: string[]) => void;
  onSelectMonth?: (month: number) => void;
}

const KEYBOARD_SHORTCUTS = [
  { keys: '/', desc: 'Focus the search bar from anywhere' },
  { keys: '?', desc: 'Open or close this archive guide & shortcuts dialog' },
  { keys: 'Esc', desc: 'Close the active modal or panel' },
  { keys: '← / →', desc: 'Step to previous or next palette inside Studio modal' },
  { keys: 'Tab / Shift+Tab', desc: 'Navigate controls trapped cleanly inside open dialogs' },
];

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  favorites,
  onImportFavorites,
  onSelectMonth,
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useModalDialog({
    isOpen,
    dialogRef,
    onClose,
  });

  if (!isOpen) return null;

  const handleExportFavorites = () => {
    const payload = JSON.stringify(
      {
        version: 2,
        exportedAt: new Date().toISOString(),
        favorites,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sanzo-wada-favorites.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const rawList: unknown[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.favorites)
        ? parsed.favorites
        : [];
      const valid = rawList
        .filter((item): item is string => typeof item === 'string' && /^v[12]-\d+$/.test(item));
      if (valid.length === 0) {
        setImportError('No valid combination keys (e.g. "v1-42", "v2-10") found in JSON.');
        return;
      }
      onImportFavorites(valid);
    } catch {
      setImportError('Invalid JSON file. Expected an array or { favorites: [...] }.');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <BookOpen size={18} className="text-amber-800 dark:text-amber-400" />
            <div>
              <h2 id="guide-modal-title" className="text-base sm:text-lg font-editorial font-bold">
                Archive Guide, Shortcuts & Backup
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Historical context, keyboard controls, and portable favorites JSON backup.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide dialog"
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-editorial font-bold mb-3">
              <Keyboard size={15} className="text-amber-800 dark:text-amber-400" />
              <span>Keyboard Shortcuts</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {KEYBOARD_SHORTCUTS.map((sc) => (
                <div
                  key={sc.keys}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40 text-xs"
                >
                  <span className="text-stone-600 dark:text-stone-300">{sc.desc}</span>
                  <kbd className="px-2 py-0.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-code text-[11px] font-semibold shrink-0">
                    {sc.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Favorites Backup */}
          <section className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-editorial font-bold">
                  Favorites Backup ({favorites.length} saved)
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Export or restore your starred palettes as a portable JSON file.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportFavorites}
                  disabled={favorites.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Export JSON</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  aria-label="Import favorites JSON file"
                  onChange={(e) => handleImportFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-900 text-amber-50 hover:bg-amber-800 cursor-pointer"
                >
                  <Upload size={13} />
                  <span>Import JSON</span>
                </button>
              </div>
            </div>
            {importError && (
              <p className="text-xs font-code text-rose-600 dark:text-rose-400">{importError}</p>
            )}
          </section>

          {/* Archival Notes */}
          <section className="space-y-3">
            <h3 className="text-sm font-editorial font-bold">Historical & Editorial Context</h3>
            <div className="space-y-2.5">
              {ARCHIVAL_NOTES.map((note) => (
                <div
                  key={note.title}
                  className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-950/30"
                >
                  <div className="text-xs font-editorial font-bold text-amber-900 dark:text-amber-400">
                    {note.title}
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                    {note.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Vol. 2 12-Month Calendar Reference */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-editorial font-bold mb-3">
              <Calendar size={15} className="text-emerald-700 dark:text-emerald-400" />
              <span>Vol. 2 Traditional Japanese Months (1934–1935)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {MONTH_OPTIONS.map((m) => (
                <button
                  type="button"
                  key={m.month}
                  onClick={() => {
                    if (onSelectMonth) {
                      onClose();
                      onSelectMonth(m.month);
                    }
                  }}
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-emerald-700/50 dark:hover:border-emerald-500/50 bg-stone-50/50 dark:bg-stone-950/30 text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-editorial font-bold flex items-center justify-between">
                    <span>
                      {m.month.toString().padStart(2, '0')} • {m.name}
                    </span>
                    <span className="text-emerald-800 dark:text-emerald-400">
                      {m.ja} ({m.reading})
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    {m.motif}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
