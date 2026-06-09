'use client';

// src/components/sites/SiteContacts.tsx
// Phase 34 — site contacts: add form + list with delete.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addSiteContact, deleteSiteContact } from '@/lib/sites/siteMutations';
import type { SiteContact } from '@/lib/sites/sitesData';

export default function SiteContacts({ siteId, contacts }: { siteId: string; contacts: SiteContact[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setError(null);
    if (!name.trim()) { setError('שם חובה'); return; }
    setBusy(true);
    const res = await addSiteContact({ siteId, name_he: name, role_he: role, phone, email });
    setBusy(false);
    if (!res.ok) { setError(res.error || 'נכשל'); return; }
    setName(''); setRole(''); setPhone(''); setEmail(''); setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm('למחוק איש קשר זה?')) return;
    const res = await deleteSiteContact(id, siteId);
    if (!res.ok) { window.alert('מחיקה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }

  return (
    <section className="mb-6" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-stone-700">אנשי קשר ({contacts.length})</h2>
        <button onClick={() => setOpen(!open)} className="text-xs text-blue-600 hover:underline">{open ? 'ביטול' : '+ הוסף איש קשר'}</button>
      </div>

      {open && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 mb-2">
          <div className="grid grid-cols-2 gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl" />
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="תפקיד (מנהל/אדריכל/רכש)" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="טלפון" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="ltr" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="אימייל" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="ltr" />
          </div>
          {error && (<div className="text-xs text-red-600">{error}</div>)}
          <button onClick={add} disabled={busy} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{busy ? 'שומר...' : 'שמור'}</button>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-4 text-center text-sm text-stone-500">אין אנשי קשר.</div>
      ) : (
        <div className="space-y-1.5">
          {contacts.map((c) => (
            <div key={c.id} className="bg-white border border-stone-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-stone-800">{c.name_he} {c.role_he ? <span className="text-stone-400 font-normal">· {c.role_he}</span> : null}</div>
                {(c.phone || c.email) && (<div className="text-xs text-stone-500" dir="ltr">{[c.phone, c.email].filter(Boolean).join(' · ')}</div>)}
              </div>
              <button onClick={() => remove(c.id)} title="מחק" className="text-stone-300 hover:text-red-600 text-sm">🗑️</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
