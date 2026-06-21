'use client';

// src/components/shared/ContactForm.tsx
// Phase 35 — unified contact/customer intake form.
// name + phone required (green-on-valid), profession/email/city/notes optional.
// Reusable: parent passes onSave(data) for the right context (customer or site-contact).

import { useState } from 'react';
import PhoneInput from './PhoneInput';
import { isValidIlPhone } from '@/lib/shared/phoneValidation';

export interface ContactFormData {
  name_he: string;
  phone: string;
  profession: string;
  email: string;
  city: string;
  notes: string;
}

interface Props {
  initial?: Partial<ContactFormData>;
  professionOptions?: string[];
  onSave: (data: ContactFormData) => Promise<{ ok: boolean; error?: string }>;
  onCancel?: () => void;
  saveLabel?: string;
}

const DEFAULT_PROFESSIONS = ['אדריכל', 'מעצב/ת פנים', 'קבלן', 'מנהל פרויקט', 'פיקוח', 'רכש', 'לקוח פרטי', 'אחר'];

export default function ContactForm({ initial = {}, professionOptions = DEFAULT_PROFESSIONS, onSave, onCancel, saveLabel = 'שמור' }: Props) {
  const [name, setName] = useState(initial.name_he || '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [profession, setProfession] = useState(initial.profession || '');
  const [email, setEmail] = useState(initial.email || '');
  const [city, setCity] = useState(initial.city || '');
  const [notes, setNotes] = useState(initial.notes || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const nameOk = name.trim().length > 0;
  const phoneOk = isValidIlPhone(phone);

  async function handleSave() {
    setAttempted(true);
    setError(null);
    if (!nameOk) { setError('שם חובה'); return; }
    if (!phoneOk) { setError('טלפון תקין חובה (נייד או קווי)'); return; }
    setBusy(true);
    const res = await onSave({ name_he: name.trim(), phone: phone.trim(), profession, email: email.trim(), city: city.trim(), notes: notes.trim() });
    setBusy(false);
    if (!res.ok) { setError(res.error || 'שמירה נכשלה'); return; }
  }

  const nameBorder = attempted && !nameOk ? '#dc2626' : '#d6d3d1';

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2" dir="rtl">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-stone-500">שם מלא <span className="text-red-600">*</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם" dir="rtl" className="w-full px-2 py-1.5 text-sm rounded-md focus:outline-none" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: nameBorder }} />
          {attempted && !nameOk && (<span className="text-xs text-red-600">שדה חובה</span>)}
        </div>
        <div>
          <label className="text-xs text-stone-500">טלפון <span className="text-red-600">*</span></label>
          <PhoneInput value={phone} onChange={setPhone} required showError={attempted} />
        </div>
        <div>
          <label className="text-xs text-stone-500">מקצוע / תפקיד</label>
          <select value={profession} onChange={(e) => setProfession(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl">
            <option value="">— בחר —</option>
            {professionOptions.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
        <div>
          <label className="text-xs text-stone-500">אימייל</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" dir="ltr" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" />
        </div>
        <div>
          <label className="text-xs text-stone-500">עיר</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="עיר" dir="rtl" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" />
        </div>
      </div>
      <div>
        <label className="text-xs text-stone-500">הערות</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות חופשיות..." rows={2} dir="rtl" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md resize-y" />
      </div>
      {error && (<div className="text-xs text-red-600">{error}</div>)}
      <div className="flex justify-end gap-2">
        {onCancel && (<button onClick={onCancel} disabled={busy} className="text-sm px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded-md">ביטול</button>)}
        <button onClick={handleSave} disabled={busy} className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{busy ? 'שומר...' : saveLabel}</button>
      </div>
    </div>
  );
}
