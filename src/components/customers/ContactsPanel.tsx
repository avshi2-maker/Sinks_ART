'use client';

// src/components/customers/ContactsPanel.tsx
// Account contacts on the customer page: primary tagged, click-to-call/email,
// add / edit / archive / set-primary.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CONTACT_TITLES, type ContactTitle, type ContactRow } from '@/lib/customers/intakeTypes';
import { addContact, editContact, archiveContact, setPrimaryContact } from '@/lib/customers/contactMutations';

type Draft = { name: string; title: ContactTitle; phone: string; email: string };
const emptyDraft: Draft = { name: '', title: 'איש קשר ראשי', phone: '', email: '' };

export default function ContactsPanel({ customerId, contacts }: { customerId: string; contacts: ContactRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const inp = 'px-2.5 py-1.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400 bg-white';

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setErr(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) { setErr(res.error || 'שגיאה'); return; }
      setAdding(false); setEditingId(null); setDraft(emptyDraft);
      router.refresh();
    });
  }

  return (
    <section className="bg-white border border-stone-200 rounded-xl p-4 mb-5" dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-stone-800">אנשי קשר</h2>
        {!adding && !editingId && (
          <button onClick={() => { setDraft(emptyDraft); setAdding(true); }} className="text-sm text-blue-600 hover:underline">+ הוסף איש קשר</button>
        )}
      </div>

      {err && <div className="text-xs text-red-600 mb-2">{err}</div>}

      <div className="space-y-2">
        {contacts.length === 0 && !adding && (<div className="text-sm text-stone-400">אין אנשי קשר. הוסיפו אחד.</div>)}

        {contacts.map((c) => (
          editingId === c.id ? (
            <div key={c.id} className="border border-blue-200 bg-blue-50 rounded-lg p-2.5 space-y-2">
              <div className="flex gap-2 flex-wrap">
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="שם" className={inp} dir="rtl" disabled={isPending} />
                <select value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value as ContactTitle })} className={inp} dir="rtl" disabled={isPending}>
                  {CONTACT_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="טלפון" className={inp} dir="rtl" disabled={isPending} />
                <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="אימייל" className={inp} dir="ltr" disabled={isPending} />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setEditingId(null); setErr(null); }} disabled={isPending} className="text-xs px-3 py-1 text-stone-600 hover:bg-stone-100 rounded-md">ביטול</button>
                <button onClick={() => run(() => editContact({ contactId: c.id, customerId, name: draft.name, title: draft.title, phone: draft.phone, email: draft.email }))} disabled={isPending} className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">שמור</button>
              </div>
            </div>
          ) : (
            <div key={c.id} className={'flex items-center justify-between gap-3 rounded-lg p-2.5 border ' + (c.is_primary ? 'border-amber-300 bg-amber-50' : 'border-stone-200')}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-800 text-sm truncate">{c.name}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600">{c.title}</span>
                  {c.is_primary && <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white">★ ראשי</span>}
                </div>
                <div className="flex gap-3 mt-1 text-xs">
                  {c.phone && <a href={'tel:' + c.phone} className="text-blue-600 hover:underline no-underline" dir="ltr">📞 {c.phone}</a>}
                  {c.email && <a href={'mailto:' + c.email} className="text-blue-600 hover:underline no-underline" dir="ltr">📧 {c.email}</a>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!c.is_primary && <button onClick={() => run(() => setPrimaryContact(c.id, customerId))} disabled={isPending} className="text-[11px] text-amber-700 hover:underline" title="הפוך לראשי">סמן כראשי</button>}
                <button onClick={() => { setDraft({ name: c.name, title: c.title as ContactTitle, phone: c.phone || '', email: c.email || '' }); setEditingId(c.id); setAdding(false); setErr(null); }} disabled={isPending} className="text-stone-400 hover:text-blue-600 text-xs" title="ערוך">✏️</button>
                <button onClick={() => { if (window.confirm('להעביר את ' + c.name + ' לארכיון?')) run(() => archiveContact(c.id, customerId)); }} disabled={isPending} className="text-stone-400 hover:text-red-600 text-xs" title="ארכב">📥</button>
              </div>
            </div>
          )
        ))}

        {adding && (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-2.5 space-y-2">
            <div className="flex gap-2 flex-wrap">
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="שם" className={inp} dir="rtl" disabled={isPending} autoFocus />
              <select value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value as ContactTitle })} className={inp} dir="rtl" disabled={isPending}>
                {CONTACT_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="טלפון" className={inp} dir="rtl" disabled={isPending} />
              <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="אימייל" className={inp} dir="ltr" disabled={isPending} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setAdding(false); setErr(null); }} disabled={isPending} className="text-xs px-3 py-1 text-stone-600 hover:bg-stone-100 rounded-md">ביטול</button>
              <button onClick={() => run(() => addContact({ customerId, name: draft.name, title: draft.title, phone: draft.phone, email: draft.email, isPrimary: contacts.length === 0 }))} disabled={isPending} className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">הוסף</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
