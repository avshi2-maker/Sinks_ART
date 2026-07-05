'use client';

// src/components/purchasing/TrabelsiOrdersRegister.tsx
// The Trabelsi purchasing register: every saved order with TRB number, full date+time stamp,
// clickable status ticks (draft/sent/approved/paused/supplied/archived) and free remarks per row.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTrabelsiStatus, updateTrabelsiRemarks, type TrabelsiOrder, type TrabelsiStatus } from '@/lib/purchasing/trabelsiOrders';

const STATUSES: { v: TrabelsiStatus; l: string; cls: string }[] = [
  { v: 'draft', l: 'טיוטה', cls: 'bg-stone-100 text-stone-600 border-stone-300' },
  { v: 'sent', l: 'נשלח', cls: 'bg-blue-50 text-blue-700 border-blue-300' },
  { v: 'approved', l: 'אושר', cls: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  { v: 'paused', l: 'מושהה', cls: 'bg-amber-50 text-amber-700 border-amber-300' },
  { v: 'supplied', l: 'סופק', cls: 'bg-green-100 text-green-800 border-green-400' },
  { v: 'archived', l: 'בארכיון', cls: 'bg-stone-100 text-stone-400 border-stone-200' },
];

function ils(n: number): string { return '₪' + (Math.round(Number(n) || 0)).toLocaleString('he-IL'); }
function stamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' · ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

export default function TrabelsiOrdersRegister({ orders, onEdit }: { orders: TrabelsiOrder[]; onEdit?: (o: TrabelsiOrder) => void }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState('');
  const [openText, setOpenText] = useState('');
  const [remarksDraft, setRemarksDraft] = useState<Record<string, string>>({});
  const [savedRemark, setSavedRemark] = useState('');
  const [copiedId, setCopiedId] = useState('');

  async function setStatus(id: string, status: TrabelsiStatus) {
    setBusyId(id);
    const res = await updateTrabelsiStatus(id, status);
    setBusyId('');
    if (!res.ok) { window.alert('עדכון סטטוס נכשל: ' + (res.error || '')); return; }
    router.refresh();
  }

  async function saveRemarks(id: string) {
    const val = remarksDraft[id];
    if (val === undefined) return;
    setBusyId(id);
    const res = await updateTrabelsiRemarks(id, val);
    setBusyId('');
    if (!res.ok) { window.alert('שמירת הערה נכשלה: ' + (res.error || '')); return; }
    setSavedRemark(id);
    setTimeout(() => setSavedRemark(''), 2000);
    router.refresh();
  }

  function copyPo(o: TrabelsiOrder) {
    if (!o.po_text) return;
    navigator.clipboard.writeText(o.po_text).then(() => { setCopiedId(o.id); setTimeout(() => setCopiedId(''), 2000); });
  }

  if (orders.length === 0) {
    return <div className="bg-white border border-stone-200 rounded-lg p-8 text-center text-sm text-stone-400" dir="rtl">אין עדיין הזמנות בפנקס. צור הזמנה בלשונית 🛒 ושמור אותה.</div>;
  }

  return (
    <div dir="rtl" className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="bg-white border border-stone-200 rounded-lg p-4">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
            <div>
              <span className="font-bold text-stone-900" dir="ltr">{o.order_number}</span>
              <span className="text-sm text-stone-600 mr-2">{o.sketch_titles || '—'}</span>
            </div>
            <div className="text-xs text-stone-400">נוצר: {stamp(o.created_at)}{o.updated_at && o.updated_at !== o.created_at ? ' · עודכן: ' + stamp(o.updated_at) : ''}</div>
          </div>
          <div className="text-sm text-stone-600 mb-3">
            {o.sheets} לוחות · {(Math.round(o.area_m2 * 100) / 100).toFixed(2)} מ"ר · <span className="font-semibold text-stone-900">{ils(o.total_ils)}</span>
            {o.notes_he && (<span className="mr-2 text-amber-700">· ⚠️ {o.notes_he}</span>)}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {STATUSES.map((s) => (
              <button key={s.v} onClick={() => setStatus(o.id, s.v)} disabled={busyId === o.id}
                className={'text-xs px-2.5 py-1 rounded-full border transition-all ' + (o.status === s.v ? s.cls + ' font-bold ring-1 ring-offset-1 ring-stone-300' : 'bg-white text-stone-400 border-stone-200 hover:border-stone-400')}>
                {o.status === s.v ? '✓ ' : ''}{s.l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={remarksDraft[o.id] !== undefined ? remarksDraft[o.id] : (o.remarks_he || '')}
              onChange={(e) => setRemarksDraft((p) => ({ ...p, [o.id]: e.target.value }))}
              placeholder="הערות חופשיות למעקב…"
              className="flex-1 px-2 py-1.5 text-sm border border-stone-200 rounded-md" dir="rtl" />
            <button onClick={() => saveRemarks(o.id)} disabled={busyId === o.id} className="text-xs px-3 py-1.5 border border-stone-300 rounded-md text-stone-600 hover:bg-stone-50">{savedRemark === o.id ? '✓' : 'שמור'}</button>
            {onEdit && (<button onClick={() => onEdit(o)} title="ערוך הזמנה" className="text-xs px-3 py-1.5 border border-stone-300 rounded-md text-stone-600 hover:bg-stone-50">✏️ ערוך</button>)}
            <button onClick={() => copyPo(o)} title="העתק להצעת ARVO" className="text-xs px-3 py-1.5 border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50">{copiedId === o.id ? 'הועתק ✓' : '📋 העתק'}</button>
            <button onClick={() => setOpenText(openText === o.id ? '' : o.id)} title="הצג טקסט הזמנה" className="text-xs px-2 py-1.5 text-stone-400 hover:text-blue-600">👁️</button>
          </div>
          {openText === o.id && o.po_text && (
            <pre className="mt-2 bg-stone-50 border border-stone-200 rounded-md p-3 text-xs text-stone-700 whitespace-pre-wrap font-sans">{o.po_text}</pre>
          )}
        </div>
      ))}
    </div>
  );
}
