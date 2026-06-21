'use client';

// src/components/sites/SiteContacts.tsx
// Phase 35e — site contacts: add-from-existing-customer (picker) + add-new + edit + delete.
// "מלקוח קיים" pulls an existing customer (e.g. Ziv, Dudu) and pre-fills the form so only
// the role (e.g. פיקוח) needs setting. "חדש" types a fresh contact. Both save to site_contacts.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addSiteContact, updateSiteContact, deleteSiteContact } from '@/lib/sites/siteMutations';
import type { SiteContact, CustomerMini } from '@/lib/sites/sitesData';
import ContactForm, { ContactFormData } from '@/components/shared/ContactForm';
import EntityPicker, { PickerItem } from '@/components/shared/EntityPicker';

type Mode = 'idle' | 'new' | 'pick';

export default function SiteContacts({ siteId, contacts, customers }: { siteId: string; contacts: SiteContact[]; customers: CustomerMini[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('idle');
  const [prefill, setPrefill] = useState<Partial<ContactFormData> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  function reset() { setMode('idle'); setPrefill(null); }

  async function handleAdd(data: ContactFormData) {
    const res = await addSiteContact({ siteId, name_he: data.name_he, role_he: data.profession, phone: data.phone, email: data.email });
    if (res.ok) { reset(); router.refresh(); }
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

  const customerItems: PickerItem[] = customers.map((c) => ({
    id: c.id,
    label: c.name_he,
    sublabel: [c.phone, c.email].filter(Boolean).join(' · ') || null,
  }));

  function pickCustomer(id: string) {
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    setPrefill({ name_he: c.name_he, phone: c.phone || '', email: c.email || '', profession: '' });
    setMode('new');
  }

  return (
    <section className="mb-6" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-stone-700">אנשי קשר ({contacts.length})</h2>
        {mode === 'idle' ? (
          <span className="flex items-center gap-3">
            <button onClick={() => { setEditId(null); setPrefill(null); setMode('pick'); }} className="text-xs text-blue-600 hover:underline">📇 מלקוח קיים</button>
            <button onClick={() => { setEditId(null); setPrefill(null); setMode('new'); }} className="text-xs text-blue-600 hover:underline">+ חדש</button>
          </span>
        ) : (
          <button onClick={reset} className="text-xs text-stone-500 hover:underline">ביטול</button>
        )}
      </div>

      {mode === 'pick' && (
        <div className="mb-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs text-stone-500 mb-1">בחר לקוח קיים להוספה כאיש קשר באתר</div>
          <EntityPicker items={customerItems} placeholder="חיפוש לקוח לפי שם / טלפון..." emptyText="לא נמצאו לקוחות" onPick={(it) => pickCustomer(it.id)} autoFocus />
        </div>
      )}

      {mode === 'new' && (
        <div className="mb-2">
          <ContactForm initial={prefill || {}} onSave={handleAdd} onCancel={reset} saveLabel="הוסף איש קשר" />
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-4 text-center text-sm text-stone-500">אין אנשי קשר.</div>
      ) : (
        <div className="space-y-1.5">
          {contacts.map((c) => (
            editId === c.id ? (
              <ContactForm key={c.id} initial={{ name_he: c.name_he, phone: c.phone || '', profession: c.role_he || '', email: c.email || '' }} onSave={(data) => handleEdit(c.id, data)} onCancel={() => setEditId(null)} saveLabel="שמור שינויים" />
            ) : (
              <div key={c.id} className="bg-white border border-stone-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-stone-800">{c.name_he} {c.role_he ? <span className="text-stone-400 font-normal">· {c.role_he}</span> : null}</div>
                  {(c.phone || c.email) && (<div className="text-xs text-stone-500" dir="ltr">{[c.phone, c.email].filter(Boolean).join(' · ')}</div>)}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditId(c.id); reset(); }} title="ערוך" className="text-stone-400 hover:text-blue-600 text-sm">✏️</button>
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
