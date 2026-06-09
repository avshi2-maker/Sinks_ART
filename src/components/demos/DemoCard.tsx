'use client';

// src/components/demos/DemoCard.tsx
// Phase 38 — single demo card: image, title, marble, prompt copy, edit/delete/download/whatsapp.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateDemo, deleteDemo, DemoTrial } from '@/lib/demos/demosData';

export default function DemoCard({ demo }: { demo: DemoTrial }) {
  const router = useRouter();
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
    if (!window.confirm('למחוק הדמיה זו לצמיתות?')) return;
    setBusy(true);
    const res = await deleteDemo(demo.id);
    setBusy(false);
    if (!res.ok) { window.alert('מחיקה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }
  function copyPrompt() {
    if (demo.nano_banana_prompt) { navigator.clipboard.writeText(demo.nano_banana_prompt); window.alert('הפרומפט הועתק'); }
  }
  function sendWhatsApp() {
    const txt = encodeURIComponent((demo.title_he || 'הדמיה') + (demo.cloudinary_url ? '\n' + demo.cloudinary_url : ''));
    window.open('https://api.whatsapp.com/send?text=' + txt, '_blank');
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm" dir="rtl">
      {demo.cloudinary_url ? (
        <a href={demo.cloudinary_url} target="_blank" rel="noopener noreferrer">
          <img src={demo.thumbnail_url || demo.cloudinary_url} alt={demo.title_he || 'הדמיה'} className="w-full h-44 object-cover" />
        </a>
      ) : (
        <div className="w-full h-44 bg-stone-100 flex items-center justify-center text-stone-400 text-sm">אין תמונה</div>
      )}
      <div className="p-3 space-y-2">
        {editing ? (
          <div className="space-y-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="כותרת" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
            <input value={marble} onChange={(e) => setMarble(e.target.value)} placeholder="סוג שיש" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות" rows={2} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md resize-y" dir="rtl" />
            <div className="flex gap-2">
              <button onClick={save} disabled={busy} className="text-sm px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">שמור</button>
              <button onClick={() => setEditing(false)} className="text-sm px-3 py-1 text-stone-600 hover:bg-stone-100 rounded-md">ביטול</button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm font-medium text-stone-800">{demo.title_he || 'הדמיה'}</div>
            {demo.marble_family && (<div className="text-xs text-stone-500">🪨 {demo.marble_family}</div>)}
            {demo.notes_he && (<div className="text-xs text-stone-500">{demo.notes_he}</div>)}
            <div className="flex items-center gap-3 pt-1 text-stone-400">
              {demo.nano_banana_prompt && (<button onClick={copyPrompt} title="העתק פרומפט" className="hover:text-blue-600 text-sm">📋</button>)}
              {demo.cloudinary_url && (<a href={demo.cloudinary_url} download title="הורד" className="hover:text-blue-600 text-sm">⬇️</a>)}
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
