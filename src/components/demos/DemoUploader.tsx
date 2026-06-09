'use client';

// src/components/demos/DemoUploader.tsx
// Phase 38 — add a demo: upload image to Cloudinary (Demo-Trials folder) + save row.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/intake/cloudinary';
import { saveDemo } from '@/lib/demos/demosData';

export default function DemoUploader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [marble, setMarble] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setError(null);
    if (!file) { setError('בחרו תמונה'); return; }
    if (!isCloudinaryConfigured()) { setError('Cloudinary לא מוגדר'); return; }
    setBusy(true);
    try {
      const uploaded = await uploadToCloudinary(file, 'Demo-Trials');
      const res = await saveDemo({
        title_he: title,
        cloudinary_url: uploaded.url,
        cloudinary_public_id: uploaded.publicId,
        thumbnail_url: uploaded.url,
        marble_family: marble,
        notes_he: notes,
      });
      setBusy(false);
      if (!res.ok) { setError('שמירה נכשלה: ' + (res.error || '')); return; }
      setFile(null); setTitle(''); setMarble(''); setNotes(''); setOpen(false);
      router.refresh();
    } catch (e) {
      setBusy(false);
      setError('העלאה נכשלה: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
        <span>➕</span><span>הדמיה חדשה</span>
      </button>
    );
  }

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4 shadow-sm" dir="rtl">
      <div className="text-sm font-medium text-stone-800 mb-3">הדמיה חדשה</div>
      <label className="flex items-center justify-center gap-2 w-full px-4 py-6 mb-2 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 text-sm text-stone-600"><span>📁 {file ? file.name : 'בחרו תמונה או וידאו'}</span><input type="file" accept="image/*,video/mp4" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" /></label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="כותרת (לדוגמה: כיור אובלי שיש כרמרה)" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
        <input value={marble} onChange={(e) => setMarble(e.target.value)} placeholder="סוג שיש" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
      </div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות" rows={2} className="w-full mt-2 px-2 py-1.5 text-sm border border-stone-300 rounded-md resize-y" dir="rtl" />
      {error && (<div className="text-xs text-red-600 mt-2">{error}</div>)}
      <div className="flex items-center gap-2 mt-3">
        <button onClick={add} disabled={busy} className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">{busy ? 'מעלה...' : 'שמור הדמיה'}</button>
        <button onClick={() => { setOpen(false); setError(null); }} disabled={busy} className="px-4 py-1.5 text-sm text-stone-600 rounded-md hover:bg-stone-100">ביטול</button>
      </div>
    </div>
  );
}
