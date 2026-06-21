'use client';

// src/components/shared/EntityPicker.tsx
// Searchable single-select combobox (no deps). Type to filter, click to pick.
// Used to link existing projects to a site and to pull existing customers in as site contacts.

import { useState, useMemo, useRef, useEffect } from 'react';

export interface PickerItem {
  id: string;
  label: string;
  sublabel?: string | null;
  badge?: string | null;
  disabled?: boolean;
  disabledNote?: string | null;
}

interface Props {
  items: PickerItem[];
  placeholder?: string;
  emptyText?: string;
  onPick: (item: PickerItem) => void;
  autoFocus?: boolean;
}

const ROW_BASE = 'w-full text-right px-3 py-2 flex items-center justify-between gap-2 ';
const ROW_OK = 'hover:bg-blue-50';
const ROW_OFF = 'opacity-50 cursor-not-allowed';

export default function EntityPicker({ items, placeholder = 'חיפוש...', emptyText = 'לא נמצאו תוצאות', onPick, autoFocus = false }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((it) => (it.label + ' ' + (it.sublabel || '')).toLowerCase().includes(needle));
  }, [q, items]);

  return (
    <div ref={boxRef} className="relative" dir="rtl">
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder} autoFocus={autoFocus} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white focus:outline-none focus:border-blue-400" />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto bg-white border border-stone-200 rounded-md shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-xs text-stone-400 text-center">{emptyText}</div>
          ) : (
            filtered.map((it) => {
              const rowClass = ROW_BASE + (it.disabled ? ROW_OFF : ROW_OK);
              return (
                <button key={it.id} type="button" disabled={it.disabled} onClick={() => { if (!it.disabled) { onPick(it); setQ(''); setOpen(false); } }} className={rowClass}>
                  <span className="min-w-0">
                    <span className="block text-sm text-stone-800 truncate">{it.label}</span>
                    {it.sublabel ? <span className="block text-xs text-stone-400 truncate" dir="ltr">{it.sublabel}</span> : null}
                    {it.disabled && it.disabledNote ? <span className="block text-xs text-amber-600">{it.disabledNote}</span> : null}
                  </span>
                  {it.badge ? <span className="text-xs text-stone-500 whitespace-nowrap">{it.badge}</span> : null}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
