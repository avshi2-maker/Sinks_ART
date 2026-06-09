'use client';

// src/components/customers/AddProjectForm.tsx
// Phase 35e — richer project form: stone/dimensions/description + site link.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '@/lib/customers/projectMutations';

const STATUS_OPTIONS = ['ליד', 'שיחת בירור', 'הצעת מחיר נשלחה', 'אושר', 'שולמה מקדמה', 'תשלום מלא', 'הסתיים', 'אבוד'];

interface SiteLite { id: string; name_he: string; }
interface Props {
  customerId: string;
  sites?: SiteLite[];
}

export default function AddProjectForm({ customerId, sites = [] }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('ליד');
  const [stoneType, setStoneType] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [description, setDescription] = useState('');
  const [siteId, setSiteId] = useState('');

  async function handleSave() {
    setError(null);
    if (!title.trim()) { setError('יש להזין כותרת לפרויקט'); return; }
    setSaving(true);
    const res = await createProject({
      customerId, titleHe: title, status,
      stoneTypeHe: stoneType, dimensions, descriptionHe: description,
      siteId: siteId || null,
    });
    setSaving(false);
    if (!res.ok) { setError(res.error || 'שמירה נכשלה'); return; }
    setTitle(''); setStatus('ליד'); setStoneType(''); setDimensions(''); setDescription(''); setSiteId('');
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
        <span>➕</span><span>פרויקט חדש</span>
      </button>
    );
  }

  return (
    <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2" dir="rtl">
      <div className="text-sm font-medium text-stone-800 mb-3">פרויקט חדש</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-500">כותרת הפרויקט <span className="text-red-600">*</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: כיור שיש — אמבטיה ראשית" className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400" dir="rtl" />
        </div>
        <div>
          <label className="text-xs text-stone-500">סטטוס</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white focus:outline-none focus:border-blue-400" dir="rtl">
            {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div>
          <label className="text-xs text-stone-500">סוג אבן</label>
          <input value={stoneType} onChange={(e) => setStoneType(e.target.value)} placeholder="שיש איטלקי / גרניט פורצלן" className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400" dir="rtl" />
        </div>
        <div>
          <label className="text-xs text-stone-500">מידות</label>
          <input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="213×45 ס״מ" className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400" dir="rtl" />
        </div>
        {sites.length > 0 && (
          <div>
            <label className="text-xs text-stone-500">קישור לאתר (מלון/מבנה)</label>
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white focus:outline-none focus:border-blue-400" dir="rtl">
              <option value="">— ללא —</option>
              {sites.map((s) => (<option key={s.id} value={s.id}>{s.name_he}</option>))}
            </select>
          </div>
        )}
      </div>
      <div className="mt-3">
        <label className="text-xs text-stone-500">תיאור / הערות</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="פרטים נוספים על הפרויקט..." rows={2} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400 resize-y" dir="rtl" />
      </div>
      {error && (<div className="text-xs text-red-600 mt-2">{error}</div>)}
      <div className="flex items-center gap-2 mt-3">
        <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">{saving ? 'שומר...' : 'שמור פרויקט'}</button>
        <button onClick={() => { setOpen(false); setError(null); }} disabled={saving} className="px-4 py-1.5 text-sm text-stone-600 rounded-md hover:bg-stone-100">ביטול</button>
      </div>
    </div>
  );
}
