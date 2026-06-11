'use client';

// src/components/po/PoAssetsConfirm.tsx
// Stage 2d: asset uploader (jpg/mp4/mp3 -> Cloudinary PO folder) + Ales confirmation paste box.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductionOrder, addAsset, setAlesConfirmation } from '@/lib/po/poData';
import { uploadToCloudinary } from '@/lib/intake/cloudinary';

function fmtDT(iso: string) { return new Date(iso).toLocaleDateString('he-IL'); }

export default function PoAssetsConfirm({ po }: { po: ProductionOrder }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState('');
  const [conf, setConf] = useState(po.ales_confirmation || '');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const up = await uploadToCloudinary(file, 'PO-assets/' + po.po_number);
      await addAsset(po.id, up.url, up.resourceType, up.publicId, label || file.name);
      setLabel('');
      router.refresh();
    } catch (err) {
      window.alert('העלאה נכשלה: ' + (err instanceof Error ? err.message : ''));
    }
    setBusy(false);
    e.target.value = '';
  }

  async function saveConf() {
    setBusy(true);
    await setAlesConfirmation(po.id, conf);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-5" dir="rtl">
      <div>
        <div className="text-sm font-semibold text-stone-700 mb-2">נכסים מצורפים (תמונות / וידאו / אודיו)</div>
        {po.assets.length > 0 ? (
          <div className="space-y-1 mb-3">
            {po.assets.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm bg-stone-50 rounded-md px-3 py-1.5">
                <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{a.label}</a>
                <span className="text-xs text-stone-400">{a.type} · {fmtDT(a.uploaded_at)}</span>
              </div>
            ))}
          </div>
        ) : <div className="text-xs text-stone-400 mb-3">אין נכסים מצורפים.</div>}
        <div className="flex gap-2 items-center">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="תיאור הקובץ (אופציונלי)" className="flex-1 px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
          <label className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
            {busy ? 'מעלה...' : '📎 צרף קובץ'}
            <input type="file" accept="image/*,video/*,audio/*" onChange={onFile} disabled={busy} className="hidden" />
          </label>
        </div>
      </div>

      <div className="border-t border-stone-100 pt-4">
        <div className="text-sm font-semibold text-stone-700 mb-2">אישור אלס (הדבק WhatsApp / סיכום שיחה)</div>
        {po.ales_confirmed_at && (<div className="text-xs text-green-600 mb-1">✓ אושר · {fmtDT(po.ales_confirmed_at)}</div>)}
        <textarea value={conf} onChange={(e) => setConf(e.target.value)} rows={3} placeholder="הדבק כאן את אישור אלס — הבנתי ומאשר את ההזמנה..." className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
        <button onClick={saveConf} disabled={busy} className="mt-2 text-xs px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700">שמור אישור</button>
      </div>
    </div>
  );
}
