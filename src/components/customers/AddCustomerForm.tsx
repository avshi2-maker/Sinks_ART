'use client';

// src/components/customers/AddCustomerForm.tsx
// Phase 35 — uses shared ContactForm (validated name+phone, green-on-valid, profession).
// Keeps the lead-source picker above the shared form.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCustomer } from '@/lib/customers/customerMutations';
import ContactForm, { ContactFormData } from '@/components/shared/ContactForm';

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'phone', label: 'טלפון' },
  { value: 'whatsapp', label: 'וואטסאפ' },
  { value: 'instagram', label: 'אינסטגרם' },
  { value: 'website', label: 'אתר' },
  { value: 'referral', label: 'המלצה' },
  { value: 'walk-in', label: 'הגעה ישירה' },
  { value: 'pinterest', label: 'פינטרסט' },
  { value: 'other', label: 'אחר' },
];

export default function AddCustomerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState('phone');

  async function handleSave(data: ContactFormData) {
    const res = await createCustomer({
      name_he: data.name_he,
      phone: data.phone,
      city: data.city,
      email: data.email,
      profession: data.profession,
      notes: data.notes,
      source,
    });
    if (res.ok) {
      setOpen(false);
      setSource('phone');
      router.refresh();
    }
    return res;
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
        <span>➕</span><span>לקוח חדש</span>
      </button>
    );
  }

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm mb-4" dir="rtl">
      <div className="text-sm font-medium text-stone-800 mb-3">לקוח חדש</div>
      <div className="mb-2">
        <label className="text-xs text-stone-500">מקור הליד</label>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400 bg-white" dir="rtl">
          {SOURCE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
      </div>
      <ContactForm onSave={handleSave} onCancel={() => setOpen(false)} saveLabel="שמור לקוח" />
    </div>
  );
}
