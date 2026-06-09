'use client';

// src/components/sites/SiteContacts.tsx
// Phase 35d — site contacts: add + edit + delete, all via shared ContactForm.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addSiteContact, updateSiteContact, deleteSiteContact } from '@/lib/sites/siteMutations';
import type { SiteContact } from '@/lib/sites/sitesData';
import ContactForm, { ContactFormData } from '@/components/shared/ContactForm';

export default function SiteContacts({ siteId, contacts }: { siteId: string; contacts: SiteContact[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  async function handleAdd(data: ContactFormData) {
    const res = await addSiteContact({ siteId, name_he: data.name_he, role_he: data.profession, phone: data.phone, email: data.email });
    if (res.ok) { setAdding(false); router.refresh(); }
    return res;
  }

  async function handleEdit(id: string, data: ContactFormData) {
    const res = await updateSiteContact({ id, siteId, name_he: data.name_he, role_he: data.profession, phone: data.phone, email: data.email });
    if (res.ok) { setEditId(null); router.refresh(); }
    return res;
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
        <button onClick={() => { setAdding(!adding); setEditId(null); }} className="text-xs text-blue-600 hover:underline">{adding ? 'ביטול' : '+ הוסף איש קשר'}</button>
      </div>

      {adding && (
        <div className="mb-2">
          <ContactForm onSave={handleAdd} onCancel={() => setAdding(false)} saveLabel="הוסף איש קשר" />
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-4 text-center text-sm text-stone-500">אין אנשי קשר.</div>
      ) : (
        <div className="space-y-1.5">
          {contacts.map((c) => (
            editId === c.id ? (
              <ContactForm
                key={c.id}
                initial={{ name_he: c.name_he, phone: c.phone || '', profession: c.role_he || '', email: c.email || '' }}
                onSave={(data) => handleEdit(c.id, data)}
                onCancel={() => setEditId(null)}
                saveLabel="שמור שינויים"
              />
            ) : (
              <div key={c.id} className="bg-white border border-stone-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-stone-800">{c.name_he} {c.role_he ? <span className="text-stone-400 font-normal">· {c.role_he}</span> : null}</div>
                  {(c.phone || c.email) && (<div className="text-xs text-stone-500" dir="ltr">{[c.phone, c.email].filter(Boolean).join(' · ')}</div>)}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditId(c.id); setAdding(false); }} title="ערוך" className="text-stone-400 hover:text-blue-600 text-sm">✏️</button>
                  <button onClick={() => remove(c.id)} title="מחק" className="text-stone-300 hover:text-red-600 text-sm">🗑️</button>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </section>
  );
}
