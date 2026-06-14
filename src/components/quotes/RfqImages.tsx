'use client';

// src/components/quotes/RfqImages.tsx
// Upload + display RFQ reference image thumbnails on a quote.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addRfqImage, removeRfqImage, RfqImage } from '@/lib/quotes/rfqImages';
import { uploadToCloudinary } from '@/lib/intake/cloudinary';

export default function RfqImages({ quoteId, images }: { quoteId: string; images: RfqImage[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState('');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const up = await uploadToCloudinary(file, 'RFQ-images/' + quoteId);
      await addRfqImage(quoteId, up.url, label || file.name);
      setLabel('');
      router.refresh();
    } catch (err) {
      window.alert('העלאה נכשלה: ' + (err instanceof Error ? err.message : ''));
    }
    setBusy(false);
    e.target.value = '';
  }

  async function remove(i: number) {
    if (!window.confirm('להסיר את התמונה?')) return;
    await removeRfqImage(quoteId, i);
    router.refresh();
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 mb-4" dir="rtl">
      <div className="text-sm font-semibold text-stone-700 mb-3">תמונות הפניה מהלקוח (RFQ)</div>
      {images.length > 0 ? (
        <div className="flex flex-wrap gap-3 mb-3">
          {images.map((img, i) => (
            <div key={i} className="relative w-28">
              <a href={img.url} target="_blank" rel="noreferrer">
                <img src={img.url} alt={img.label} className="w-28 h-28 object-cover rounded-md border border-stone-200" />
              </a>
              <div className="text-xs text-stone-600 mt-1 truncate">{img.label}</div>
              <button onClick={() => remove(i)} className="absolute top-1 left-1 bg-white/90 rounded-full w-5 h-5 text-xs text-red-500 leading-none">✕</button>
            </div>
          ))}
        </div>
      ) : <div className="text-xs text-stone-400 mb-3">אין תמונות הפניה עדיין.</div>}
      <div className="flex gap-2 items-center">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="תיאור (למשל: סוג שיש / קיים / חדש)" className="flex-1 px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
        <label className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer whitespace-nowrap">
          {busy ? 'מעלה...' : '📎 הוסף תמונה'}
          <input type="file" accept="image/*" onChange={onFile} disabled={busy} className="hidden" />
        </label>
      </div>
    </div>
  );
}
