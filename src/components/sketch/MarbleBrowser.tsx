'use client';

// src/components/sketch/MarbleBrowser.tsx
// Marble catalog browser for the sketch builder — TWO sources:
//   1) קטלוג        — the shared marble_swatches gallery
//   2) דגימות הלקוח — a specific customer's OWN uploaded sample photos (media_analyses)
// Pick a stone for either the exterior (שיש חוץ) or the interior/basin (שיש פנים).

import { useEffect, useState } from 'react';
import { MarbleSwatch, CustomerSample, fetchCustomerSamples } from '@/lib/marble/marbleData';
import EntityPicker, { PickerItem } from '@/components/shared/EntityPicker';

export interface MarbleBrowserProps {
  swatches: MarbleSwatch[];
  customers?: PickerItem[];
  initialCustomerId?: string;
  initialCustomerLabel?: string;
  exterior: string;
  interior: string;
  exteriorUrl?: string;
  interiorUrl?: string;
  onPick: (layer: 'ext' | 'int', name: string, url: string) => void;
}

export default function MarbleBrowser({
  swatches, customers = [], initialCustomerId = '', initialCustomerLabel = '',
  exterior, interior, exteriorUrl = '', interiorUrl = '', onPick,
}: MarbleBrowserProps) {
  const [open, setOpen] = useState(false);
  const [layer, setLayer] = useState<'ext' | 'int'>('ext');
  const [source, setSource] = useState<'catalog' | 'customer'>('catalog');
  const [q, setQ] = useState('');
  const [cust, setCust] = useState<{ id: string; label: string } | null>(
    initialCustomerId ? { id: initialCustomerId, label: initialCustomerLabel || 'לקוח' } : null,
  );
  const [samples, setSamples] = useState<CustomerSample[]>([]);
  const [loading, setLoading] = useState(false);

  async function chooseCustomer(id: string, label: string) {
    setCust({ id, label });
    setLoading(true);
    try {
      const rows = await fetchCustomerSamples(id);
      setSamples(rows);
    } catch {
      setSamples([]);
    } finally {
      setLoading(false);
    }
  }
  // preload the initial customer's samples once
  useEffect(() => {
    if (initialCustomerId) { void chooseCustomer(initialCustomerId, initialCustomerLabel || 'לקוח'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nameOf = (s: MarbleSwatch) => s.name_he || s.name_en;
  const query = q.trim().toLowerCase();
  const filtered = swatches.filter((s) =>
    !query || ((s.name_he || '') + ' ' + s.name_en + ' ' + (s.category || '')).toLowerCase().includes(query));
  const curName = layer === 'ext' ? exterior : interior;
  const curUrl = layer === 'ext' ? exteriorUrl : interiorUrl;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-sm px-4 py-2 rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 flex items-center justify-center gap-2"
      >
        🎨 עיין בקטלוג / דגימות הלקוח ובחר שיש
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()} dir="rtl">
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
              <div className="text-base font-semibold text-stone-800">בחירת שיש</div>
              <button type="button" onClick={() => setOpen(false)} className="w-8 h-8 rounded-md hover:bg-stone-100 text-stone-500 text-lg">✕</button>
            </div>

            {/* source tabs */}
            <div className="flex gap-1 px-4 pt-3">
              <button type="button" onClick={() => setSource('catalog')} className={'px-3 py-1.5 rounded-t-md text-sm font-semibold border-b-2 ' + (source === 'catalog' ? 'border-stone-800 text-stone-900' : 'border-transparent text-stone-400')}>קטלוג שיש</button>
              <button type="button" onClick={() => setSource('customer')} className={'px-3 py-1.5 rounded-t-md text-sm font-semibold border-b-2 ' + (source === 'customer' ? 'border-stone-800 text-stone-900' : 'border-transparent text-stone-400')}>דגימות הלקוח</button>
            </div>

            {/* controls */}
            <div className="px-4 py-3 border-b border-stone-100 space-y-2 bg-stone-50">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setLayer('ext')} className={'px-3 py-2 rounded-md text-sm font-semibold border text-right ' + (layer === 'ext' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-300')}>
                  שיש חוץ<span className="block text-[11px] font-normal opacity-80">{exterior || '— לא נבחר —'}</span>
                </button>
                <button type="button" onClick={() => setLayer('int')} className={'px-3 py-2 rounded-md text-sm font-semibold border text-right ' + (layer === 'int' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-300')}>
                  שיש פנים (אגן)<span className="block text-[11px] font-normal opacity-80">{interior || '— לא נבחר —'}</span>
                </button>
              </div>
              {source === 'catalog' ? (
                <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש לפי שם / קטגוריה…" className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md" dir="rtl" />
              ) : (
                <div>
                  <EntityPicker
                    items={customers}
                    placeholder={cust ? 'לקוח: ' + cust.label + ' — החלף…' : 'בחר לקוח לטעינת הדגימות שלו…'}
                    emptyText="אין לקוחות"
                    onPick={(it) => chooseCustomer(it.id, it.label)}
                  />
                </div>
              )}
            </div>

            {/* grid */}
            <div className="overflow-y-auto p-3 flex-1">
              {source === 'catalog' ? (
                filtered.length === 0 ? (
                  <div className="text-center text-stone-500 text-sm py-10">{swatches.length === 0 ? 'אין דגימות בקטלוג — הוסף בעמוד «שיש».' : 'לא נמצאו דגימות לחיפוש זה.'}</div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {filtered.map((s) => {
                      const sel = nameOf(s) === curName && !curUrl;
                      return (
                        <button key={s.id} type="button" onClick={() => onPick(layer, nameOf(s), '')} className={'group rounded-lg overflow-hidden border-2 text-right bg-white ' + (sel ? 'border-blue-500 ring-2 ring-blue-200' : 'border-stone-200 hover:border-stone-400')} title={s.name_en}>
                          <div className="relative">
                            <img src={s.image_url} alt={s.name_en} className="w-full h-24 object-cover" />
                            {sel && <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">✓ נבחר</span>}
                          </div>
                          <div className="px-2 py-1.5">
                            <div className="text-xs font-medium text-stone-800 truncate">{s.name_he || s.name_en}</div>
                            {s.category && <div className="text-[10px] text-stone-400 truncate">{s.category}</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : (
                !cust ? (
                  <div className="text-center text-stone-500 text-sm py-10">בחר לקוח למעלה כדי לראות את דגימות השיש שהעלה.</div>
                ) : loading ? (
                  <div className="text-center text-stone-400 text-sm py-10">טוען דגימות…</div>
                ) : samples.length === 0 ? (
                  <div className="text-center text-stone-500 text-sm py-10">אין תמונות דגימה ללקוח «{cust.label}». (מדיה מסוג «תמונה» נמשכת מכרטיס הלקוח.)</div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {samples.map((s) => {
                      const sel = curUrl === s.image_url;
                      return (
                        <button key={s.id} type="button" onClick={() => onPick(layer, s.label, s.image_url)} className={'group rounded-lg overflow-hidden border-2 text-right bg-white ' + (sel ? 'border-blue-500 ring-2 ring-blue-200' : 'border-stone-200 hover:border-stone-400')} title={s.label}>
                          <div className="relative">
                            <img src={s.thumbnail_url || s.image_url} alt={s.label} className="w-full h-24 object-cover" />
                            {sel && <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">✓ נבחר</span>}
                            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded">דגימת לקוח</span>
                          </div>
                          <div className="px-2 py-1.5">
                            <div className="text-xs font-medium text-stone-800 truncate">{s.label}</div>
                            {s.stone_hint && <div className="text-[10px] text-stone-400 truncate">זוהה: {s.stone_hint}</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* footer */}
            <div className="px-4 py-3 border-t border-stone-200 flex items-center justify-between">
              <div className="text-[11px] text-stone-500">חוץ: <b>{exterior || '—'}</b> · פנים: <b>{interior || '—'}</b></div>
              <button type="button" onClick={() => setOpen(false)} className="text-sm px-5 py-2 rounded-md bg-stone-800 text-white hover:bg-stone-700">סיום</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
