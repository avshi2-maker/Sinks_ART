'use client';

// src/components/demos/DemoCard.tsx
// Single gallery card: AI demo (image/video) OR saved sketch (inline SVG). Edit/delete/download/whatsapp.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateDemo, deleteDemo, setDemoImage, DemoTrial } from '@/lib/demos/demosData';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/intake/cloudinary';
import { getVideoFrameUrl } from '@/lib/intake/cloudinary';

export default function DemoCard({ demo }: { demo: DemoTrial }) {
  const router = useRouter();
  const isSketch = demo.kind === 'sketch' && !!demo.sketch_svg;
  const isVideo = !!demo.cloudinary_url && demo.cloudinary_url.includes('/video/upload/');
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(demo.title_he || '');
  const [marble, setMarble] = useState(demo.marble_family || '');
  const [notes, setNotes] = useState(demo.notes_he || '');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await updateDemo(demo.id, { title_he: title, marble_family: marble, notes_he: notes });
    setBusy(false);
    if (!res.ok) { window.alert('שמירה נכשלה: ' + (res.error || '')); return; }
    setEditing(false); router.refresh();
  }
  async function remove() {
    if (!window.confirm('למחוק פריט זה לצמיתות?')) return;
    setBusy(true);
    const res = await deleteDemo(demo.id);
    setBusy(false);
    if (!res.ok) { window.alert('מחיקה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }
  async function uploadRender(file: File) {
    if (!isCloudinaryConfigured()) { window.alert('Cloudinary לא מוגדר'); return; }
    setBusy(true);
    try {
      const up = await uploadToCloudinary(file, 'Demo-Trials');
      const res = await setDemoImage(demo.id, up.url, up.publicId);
      setBusy(false);
      if (!res.ok) { window.alert('העלאה נכשלה: ' + (res.error || '')); return; }
      router.refresh();
    } catch (e) {
      setBusy(false);
      window.alert('העלאה נכשלה: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  function copyPrompt() {
    if (demo.nano_banana_prompt) { navigator.clipboard.writeText(demo.nano_banana_prompt); window.alert('הפרומפט הועתק'); }
  }
  function downloadSketch() {
    if (!demo.sketch_svg) return;
    const blob = new Blob([demo.sketch_svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (demo.title_he || 'sketch').replace(/\s+/g, '_') + '.svg';
    a.click();
    URL.revokeObjectURL(url);
  }
  function sendWhatsApp() {
    const txt = encodeURIComponent((demo.title_he || 'פריט') + (demo.cloudinary_url ? '\n' + demo.cloudinary_url : ''));
    window.open('https://api.whatsapp.com/send?text=' + txt, '_blank');
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm" dir="rtl">
      {isSketch ? (
        <div className="relative w-full h-44 bg-white border-b border-stone-100 overflow-hidden flex items-center justify-center p-1" dangerouslySetInnerHTML={{ __html: demo.sketch_svg as string }} />
      ) : demo.cloudinary_url ? (
        isVideo ? (
          <a href={demo.cloudinary_url} target="_blank" rel="noopener noreferrer" className="relative block">
            <img src={getVideoFrameUrl(demo.cloudinary_url, 1)} alt={demo.title_he || 'הדמיה'} className="w-full h-44 object-cover" />
            <span className="absolute inset-0 flex items-center justify-center text-white text-4xl drop-shadow-lg">▶</span>
          </a>
        ) : (
          <a href={demo.cloudinary_url} target="_blank" rel="noopener noreferrer">
            <img src={demo.thumbnail_url || demo.cloudinary_url} alt={demo.title_he || 'הדמיה'} className="w-full h-44 object-cover" />
          </a>
        )
      ) : (
        <label className="w-full h-44 bg-stone-50 border-b border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-500">
          <span className="text-2xl">⬆️</span>
          <span>{busy ? 'מעלה…' : 'העלה רינדר'}</span>
          <input type="file" accept="image/*,video/mp4" className="hidden" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadRender(f); }} />
        </label>
      )}
      <div className="p-3 space-y-2">
        {editing ? (
          <div className="space-y-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="כותרת" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
            {!isSketch && (<input value={marble} onChange={(e) => setMarble(e.target.value)} placeholder="סוג שיש" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />)}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות" rows={2} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md resize-y" dir="rtl" />
            <div className="flex gap-2">
              <button onClick={save} disabled={busy} className="text-sm px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">שמור</button>
              <button onClick={() => setEditing(false)} className="text-sm px-3 py-1 text-stone-600 hover:bg-stone-100 rounded-md">ביטול</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              {isSketch && (<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-semibold">📐 שרטוט</span>)}
              <div className="text-sm font-medium text-stone-800">{demo.title_he || (isSketch ? 'שרטוט' : 'הדמיה')}</div>
            </div>
            {demo.marble_family && (<div className="text-xs text-stone-500">🪨 {demo.marble_family}</div>)}
            {demo.notes_he && (<div className="text-xs text-stone-500">{demo.notes_he}</div>)}
            <div className="flex items-center gap-3 pt-1 text-stone-400">
              {demo.nano_banana_prompt && (<button onClick={copyPrompt} title="העתק פרומפט" className="hover:text-blue-600 text-sm">📋</button>)}
              {isSketch ? (
                <button onClick={downloadSketch} title="הורד SVG" className="hover:text-blue-600 text-sm">⬇️</button>
              ) : demo.cloudinary_url ? (
                <a href={demo.cloudinary_url} download title="הורד" className="hover:text-blue-600 text-sm">⬇️</a>
              ) : null}
              <button onClick={sendWhatsApp} title="שלח בוואטסאפ" className="hover:text-green-600 text-sm">💬</button>
              <button onClick={() => setEditing(true)} title="ערוך" className="hover:text-blue-600 text-sm">✏️</button>
              <button onClick={remove} disabled={busy} title="מחק" className="hover:text-red-600 text-sm">🗑️</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
