'use client';

// src/components/customers/AddCustomerForm.tsx
// Ferrari intake: account + several contacts (one primary, with title) + a linked
// first project — all created in one save via createIntake.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createIntake } from '@/lib/customers/intakeMutations';
import { CONTACT_TITLES, type ContactTitle, type IntakeContact } from '@/lib/customers/intakeTypes';

const SOURCES: { v: string; l: string }[] = [
  { v: 'referral', l: 'הפניה' }, { v: 'whatsapp', l: 'וואטסאפ' }, { v: 'instagram', l: 'אינסטגרם' },
  { v: 'website', l: 'אתר' }, { v: 'pinterest', l: 'פינטרסט' }, { v: 'walk-in', l: 'הגעה' },
  { v: 'phone', l: 'טלפון' }, { v: 'other', l: 'אחר' },
];

function blankContact(primary = false): IntakeContact {
  return { name: '', title: 'איש קשר ראשי', phone: '', email: '', isPrimary: primary };
}

// --- validation ---------------------------------------------------------
// Israeli phone: 9-10 digits, allows spaces/dashes/+972. Mobile 05x or landline 0x.
function normalizePhone(raw: string): string { return (raw || '').replace(/[\s-()]/g, ''); }
function isValidPhone(raw: string): boolean {
  const p = normalizePhone(raw).replace(/^\+972/, '0');
  return /^0\d{8,9}$/.test(p);
}
function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((raw || '').trim());
}
// A contact's phone/email are OPTIONAL, but if filled they must be valid.
function phoneState(v?: string): 'empty' | 'ok' | 'bad' { return !(v || '').trim() ? 'empty' : (isValidPhone(v || '') ? 'ok' : 'bad'); }
function emailState(v?: string): 'empty' | 'ok' | 'bad' { return !(v || '').trim() ? 'empty' : (isValidEmail(v || '') ? 'ok' : 'bad'); }
function fieldClass(base: string, state: 'empty' | 'ok' | 'bad'): string {
  if (state === 'ok')  return base + ' border-green-400 bg-green-50 focus:border-green-500';
  if (state === 'bad') return base + ' border-red-400 bg-red-50 focus:border-red-500';
  return base;
}

export default function AddCustomerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [accountName, setAccountName] = useState('');
  const [city, setCity] = useState('');
  const [source, setSource] = useState('referral');
  const [contacts, setContacts] = useState<IntakeContact[]>([blankContact(true)]);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectStone, setProjectStone] = useState('');
  const [projectDims, setProjectDims] = useState('');

  function reset() {
    setAccountName(''); setCity(''); setSource('referral');
    setContacts([blankContact(true)]); setProjectTitle(''); setProjectStone(''); setProjectDims('');
    setErr(null);
  }

  function setContact(i: number, patch: Partial<IntakeContact>) {
    setContacts((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function setPrimary(i: number) {
    setContacts((cs) => cs.map((c, idx) => ({ ...c, isPrimary: idx === i })));
  }
  function addContact() { setContacts((cs) => [...cs, blankContact(false)]); }
  function removeContact(i: number) {
    setContacts((cs) => {
      const next = cs.filter((_, idx) => idx !== i);
      if (next.length && !next.some((c) => c.isPrimary)) next[0].isPrimary = true;
      return next.length ? next : [blankContact(true)];
    });
  }

  function submit() {
    setErr(null);
    const bad = contacts.find((c) => phoneState(c.phone) === 'bad' || emailState(c.email) === 'bad');
    if (bad) { setErr('יש לתקן טלפון/אימייל לא תקין לפני שמירה'); return; }
    startTransition(async () => {
      const res = await createIntake({
        accountName, city, source,
        contacts,
        projectTitle, projectStone, projectDimensions: projectDims,
      });
      if (!res.ok) { setErr(res.error || 'שגיאה'); return; }
      reset(); setOpen(false);
      if (res.customerId) router.push('/customers/' + res.customerId);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ לקוח חדש</button>
    );
  }

  const inp = 'w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400 bg-white';

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm text-right" dir="rtl" style={{ minWidth: 340 }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-semibold text-stone-800">לקוח / פרויקט חדש</span>
        <button onClick={() => { reset(); setOpen(false); }} className="text-stone-400 hover:text-stone-600 text-sm">✕</button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-xs font-semibold text-blue-700">פרטי החשבון</div>
        <div className="text-[11px] text-red-500 bg-red-50 border border-red-100 rounded-md px-2 py-1.5">מי הלקוח — החברה / האדם / העבודה ואנשי הקשר (לדוגמה: "מלון דודו"). חשבון אחד, שנשאר קבוע.</div>
        <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="שם הלקוח / החשבון (לדוגמה: מלון דודו)" className={inp} dir="rtl" disabled={isPending} />
        <div className="flex gap-2">
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="עיר" className={inp} dir="rtl" disabled={isPending} />
          <select value={source} onChange={(e) => setSource(e.target.value)} className={inp} dir="rtl" disabled={isPending}>
            {SOURCES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-700">אנשי קשר</span>
          <button onClick={addContact} disabled={isPending} className="text-xs text-blue-600 hover:underline">+ הוסף איש קשר</button>
        </div>
        {contacts.map((c, i) => (
          <div key={i} className="border border-stone-200 rounded-lg p-2.5 bg-stone-50 space-y-2">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-stone-700 shrink-0">
                <input type="radio" name="primary" checked={c.isPrimary} onChange={() => setPrimary(i)} disabled={isPending} />
                ראשי
              </label>
              <input value={c.name} onChange={(e) => setContact(i, { name: e.target.value })} placeholder="שם איש הקשר" className={inp} dir="rtl" disabled={isPending} />
              <select value={c.title} onChange={(e) => setContact(i, { title: e.target.value as ContactTitle })} className={inp + ' max-w-[130px]'} dir="rtl" disabled={isPending}>
                {CONTACT_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {contacts.length > 1 && (<button onClick={() => removeContact(i)} disabled={isPending} className="text-stone-400 hover:text-red-600 text-sm shrink-0" title="הסר">✕</button>)}
            </div>
            <div className="flex gap-2">
              <input value={c.phone} onChange={(e) => setContact(i, { phone: e.target.value })} placeholder="טלפון (לדוגמה 0501234567)" className={fieldClass(inp, phoneState(c.phone))} dir="rtl" disabled={isPending} />
              <input value={c.email} onChange={(e) => setContact(i, { email: e.target.value })} placeholder="אימייל" className={fieldClass(inp, emailState(c.email))} dir="ltr" disabled={isPending} />
            </div>
          </div>
        ))}
        <div className="text-[11px] text-stone-400">איש הקשר הראשי הוא מי שתעקוב אחריו ביומן היומי.</div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-xs font-semibold text-blue-700">פרויקט (חובה)</div>
        <div className="text-[11px] text-red-500 bg-red-50 border border-red-100 rounded-md px-2 py-1.5">מה בונים עבורו — עבודה ספציפית (לדוגמה: "כיור 270"). לחשבון אחד יכולים להיות כמה פרויקטים לאורך זמן.</div>
        <input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="כותרת הפרויקט (לדוגמה: כיור 270 — מלון דודו)" className={inp} dir="rtl" disabled={isPending} />
        <div className="flex gap-2">
          <input value={projectStone} onChange={(e) => setProjectStone(e.target.value)} placeholder="סוג אבן (אופציונלי)" className={inp} dir="rtl" disabled={isPending} />
          <input value={projectDims} onChange={(e) => setProjectDims(e.target.value)} placeholder="מידות (אופציונלי)" className={inp} dir="rtl" disabled={isPending} />
        </div>
      </div>

      {err && <div className="text-xs text-red-600 mb-2">{err}</div>}

      <div className="flex gap-2 justify-end">
        <button onClick={() => { reset(); setOpen(false); }} disabled={isPending} className="text-sm px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded-md">ביטול</button>
        <button onClick={submit} disabled={isPending || contacts.some((c) => phoneState(c.phone) === 'bad' || emailState(c.email) === 'bad')} className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{isPending ? 'שומר...' : 'צור לקוח + פרויקט'}</button>
      </div>
    </div>
  );
}
