'use client';

// src/components/marble/MarbleManager.tsx
// Upload + name (EN/HE) + list/delete marble swatches.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MarbleSwatch, addSwatch, deleteSwatch } from '@/lib/marble/marbleData';
import { uploadToCloudinary } from '@/lib/intake/cloudinary';

export default function MarbleManager({ swatches }: { swatches: MarbleSwatch[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameHe, setNameHe] = useState('');
  const [pendingUrl, setPendingUrl] = useState('');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const up = await uploadToCloudinary(file, 'marble-swatches');
      setPendingUrl(up.url);
    } catch (err) {
      window.alert('העלאה נכשלה: ' + (err instanceof Error ? err.message : ''));
    }
    setBusy(false);
    e.target.value = '';
  }

  async function save() {
    if (!pendingUrl || !nameEn.trim()) { window.alert('צריך תמונה ושם באנגלית'); return; }
    setBusy(true);
    const res = await addSwatch(nameEn.trim(), nameHe.trim(), pendingUrl, '');
    setBusy(false);
    if (!res.ok) { window.alert('שמירה נכשלה: ' + (res.error || '')); return; }
    setNameEn(''); setNameHe(''); setPendingUrl('');
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm('להסיר את הדגימה?')) return;
    await deleteSwatch(id);
    router.refresh();
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div className="bg-white border border-stone-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-stone-700 mb-3">הוסף דגימת שיש</div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            {pendingUrl ? (
              <img src={pendingUrl} alt="preview" className="w-20 h-20 object-cover rounded-md border border-stone-300" />
            ) : (
              <label className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-stone-300 rounded-md cursor-pointer text-xs text-stone-400 text-center">
                {busy ? '...' : 'העלה תמונה'}
                <input type="file" accept="image/*" onChange={onFile} disabled={busy} className="hidden" />
              </label>
            )}
          </div>
          <label className="block">
            <span className="block text-xs font-medium text-stone-600 mb-1">שם (English)</span>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Atlantis Sand" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-stone-600 mb-1">שם (עברית)</span>
            <input value={nameHe} onChange={(e) => setNameHe(e.target.value)} placeholder="אטלנטיס חול" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
          </label>
          <button onClick={save} disabled={busy || !pendingUrl} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">שמור</button>
          {pendingUrl && (<button onClick={() => setPendingUrl('')} className="px-3 py-1.5 text-sm text-stone-500">בטל תמונה</button>)}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-stone-700 mb-2">{swatches.length} דגימות בספרייה</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {swatches.map((s) => (
            <div key={s.id} className="bg-white border border-stone-200 rounded-lg overflow-hidden">
              <img src={s.image_url} alt={s.name_en} className="w-full h-24 object-cover" />
              <div className="p-2">
                <div className="text-sm font-medium text-stone-800">{s.name_en}</div>
                {s.name_he && <div className="text-xs text-stone-500">{s.name_he}</div>}
                <button onClick={() => remove(s.id)} className="mt-1 text-xs text-red-500 hover:underline">הסר</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
