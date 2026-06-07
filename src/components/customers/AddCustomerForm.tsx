'use client';

// src/components/customers/AddCustomerForm.tsx
// Phase 22 — collapsible "new customer" form for the /customers page.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCustomer } from '@/lib/customers/customerMutations';

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameHe, setNameHe] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [source, setSource] = useState('phone');

  async function handleSave() {
    setError(null);
    if (!nameHe.trim()) { setError('חובה להזין שם לקוח'); return; }
    setSaving(true);
    const res = await createCustomer({ name_he: nameHe, phone, city, source });
    setSaving(false);
    if (!res.ok) { setError(res.error || 'שמירה נכשלה'); return; }
    setNameHe(''); setPhone(''); setCity(''); setSource('phone');
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
        <span>➕</span><span>לקוח חדש</span>
      </button>
    );
  }

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm" dir="rtl">
      <div className="text-sm font-medium text-stone-800 mb-3">לקוח חדש</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={nameHe} onChange={(e) => setNameHe(e.target.value)} placeholder="שם הלקוח *" className="px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400" dir="rtl" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="טלפון" className="px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400" dir="ltr" />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="עיר" className="px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400" dir="rtl" />
        <select value={source} onChange={(e) => setSource(e.target.value)} className="px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400 bg-white" dir="rtl">
          {SOURCE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
      </div>
      {error && (<div className="text-xs text-red-600 mt-2">{error}</div>)}
      <div className="flex items-center gap-2 mt-3">
        <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'שומר...' : 'שמור לקוח'}
        </button>
        <button onClick={() => { setOpen(false); setError(null); }} disabled={saving} className="px-4 py-1.5 text-sm text-stone-600 rounded-md hover:bg-stone-100">
          ביטול
        </button>
      </div>
    </div>
  );
}
