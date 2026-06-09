'use client';

// src/components/sites/AddSiteForm.tsx
// Phase 34 — create a new site (e.g. a hotel).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSite } from '@/lib/sites/sitesData';

export default function AddSiteForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    if (!name.trim()) { setError('שם האתר חובה'); return; }
    setBusy(true);
    const res = await createSite({ name_he: name, address_he: address, notes_he: notes });
    setBusy(false);
    if (!res.ok) { setError(res.error || 'יצירה נכשלה'); return; }
    setName(''); setAddress(''); setNotes(''); setOpen(false);
    if (res.siteId) router.push('/sites/' + res.siteId);
    else router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">➕ אתר חדש</button>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 mb-4" dir="rtl">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם האתר (לדוגמה: מלון תל אביב)" className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white" dir="rtl" autoFocus />
      <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="כתובת (לא חובה)" className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white" dir="rtl" />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות (לא חובה)" rows={2} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white resize-y" dir="rtl" />
      {error && (<div className="text-xs text-red-600">{error}</div>)}
      <div className="flex gap-2 justify-end">
        <button onClick={() => { setOpen(false); setError(null); }} disabled={busy} className="text-sm px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded-md">ביטול</button>
        <button onClick={handleCreate} disabled={busy} className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{busy ? 'יוצר...' : 'צור אתר'}</button>
      </div>
    </div>
  );
}
