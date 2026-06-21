'use client';

// src/components/offers/OffersSentTracker.tsx
// Sent-offers register: list saved ARVO offers, update status inline, change recipient,
// view the exact saved document (HTML snapshot in a new window), edit notes, delete.
import { useState, useTransition } from 'react';
import {
  ArvoOfferRow, OfferStatus, OfferRecipient,
  STATUS_META, STATUS_ORDER, RECIPIENT_META, RECIPIENT_ORDER,
} from '@/lib/offers/arvoOffersTypes';
import { setOfferStatus, updateArvoOffer, deleteArvoOffer } from '@/lib/offers/arvoOffersData';

function ils(n: number): string { return '₪' + (Number(n) || 0).toLocaleString(); }
function dateHe(iso: string | null): string { return iso ? new Date(iso).toLocaleDateString('he-IL') : '—'; }
function daysAgo(iso: string | null): string {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'היום';
  if (d === 1) return 'אתמול';
  return 'לפני ' + d + ' ימים';
}

export default function OffersSentTracker({ offers }: { offers: ArvoOfferRow[] }) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OfferStatus | 'all' | 'open'>('open');
  const [editId, setEditId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const filtered = offers.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'open') return STATUS_META[o.status]?.open;
    return o.status === filter;
  });

  function changeStatus(id: string, status: OfferStatus) {
    setBusyId(id);
    startTransition(async () => { await setOfferStatus(id, status); setBusyId(null); });
  }
  function changeRecipient(id: string, recipient: OfferRecipient) {
    setBusyId(id);
    startTransition(async () => { await updateArvoOffer(id, { recipient }); setBusyId(null); });
  }
  function remove(id: string) {
    if (!confirm('למחוק את ההצעה השמורה לצמיתות?')) return;
    setBusyId(id);
    startTransition(async () => { await deleteArvoOffer(id); setBusyId(null); });
  }
  function viewOffer(o: ArvoOfferRow) {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>' + (o.offer_no || 'הצעה') + '</title>'
      + '<style>body{font-family:Heebo,system-ui,sans-serif;max-width:800px;margin:24px auto;padding:0 24px;line-height:1.85;color:#222;white-space:pre-wrap;}h1{font-size:18px;color:#c9a23f;border-bottom:2px solid #c9a23f;padding-bottom:8px;}</style></head><body>'
      + '<h1>הצעה ' + (o.offer_no || '') + (o.customer_name ? ' · ' + o.customer_name : '') + '</h1>'
      + (o.body_html || '<i>אין תוכן שמור</i>')
      + '</body></html>');
    w.document.close();
  }
  function startEdit(o: ArvoOfferRow) { setEditId(o.id); setNoteDraft(o.notes || ''); }
  function saveNote(id: string) {
    setBusyId(id);
    startTransition(async () => { await updateArvoOffer(id, { notes: noteDraft }); setBusyId(null); setEditId(null); });
  }

  const openCount = offers.filter((o) => STATUS_META[o.status]?.open).length;

  return (
    <div dir="rtl">
      {/* filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button onClick={() => setFilter('open')} className={'px-3 py-1.5 rounded-lg text-sm font-medium border ' + (filter === 'open' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200')}>פתוחות ({openCount})</button>
        <button onClick={() => setFilter('all')} className={'px-3 py-1.5 rounded-lg text-sm font-medium border ' + (filter === 'all' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200')}>הכל ({offers.length})</button>
        {STATUS_ORDER.map((s) => {
          const c = offers.filter((o) => o.status === s).length;
          if (c === 0) return null;
          return (
            <button key={s} onClick={() => setFilter(s)} className={'px-3 py-1.5 rounded-lg text-sm font-medium border ' + (filter === s ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200')}>
              {STATUS_META[s].label} ({c})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-lg p-8 text-center text-stone-400 text-sm">אין הצעות בקטגוריה זו</div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
          {filtered.map((o) => {
            const isBusy = busyId === o.id && pending;
            const isEditing = editId === o.id;
            return (
              <div key={o.id} className="border-b border-stone-100 last:border-0 p-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-stone-900 text-sm">{o.offer_no}</span>
                      {o.customer_name && (<span className="text-stone-600 text-sm">· {o.customer_name}</span>)}
                      <span className={'text-[11px] px-2 py-0.5 rounded-full font-medium ' + (RECIPIENT_META[o.recipient]?.cls || '')}>{RECIPIENT_META[o.recipient]?.label}</span>
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                      {ils(o.total_ils)} · נשמר {dateHe(o.sent_at || o.created_at)} · {daysAgo(o.sent_at || o.created_at)}
                    </div>
                    {o.notes && !isEditing && (<div className="text-xs text-stone-500 mt-1 bg-stone-50 rounded px-2 py-1">{o.notes}</div>)}
                    {isEditing && (
                      <div className="mt-2 flex gap-2">
                        <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="הערה / מעקב" className="flex-1 px-2 py-1 text-xs border border-stone-300 rounded-md" dir="rtl" />
                        <button onClick={() => saveNote(o.id)} disabled={isBusy} className="text-xs px-2 py-1 bg-emerald-600 text-white rounded-md disabled:opacity-50">שמור</button>
                        <button onClick={() => setEditId(null)} className="text-xs px-2 py-1 bg-stone-100 text-stone-600 rounded-md">ביטול</button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value as OfferStatus)} disabled={isBusy} className={'text-xs px-2 py-1 rounded-md border-0 font-medium ' + (STATUS_META[o.status]?.cls || '')}>
                      {STATUS_ORDER.map((s) => (<option key={s} value={s}>{STATUS_META[s].label}</option>))}
                    </select>
                    <select value={o.recipient} onChange={(e) => changeRecipient(o.id, e.target.value as OfferRecipient)} disabled={isBusy} className="text-xs px-2 py-1 rounded-md bg-stone-100 text-stone-600 border-0">
                      {RECIPIENT_ORDER.map((r) => (<option key={r} value={r}>{RECIPIENT_META[r].label}</option>))}
                    </select>
                    <button onClick={() => viewOffer(o)} className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100">👁️ צפה</button>
                    <button onClick={() => startEdit(o)} disabled={isBusy} className="text-xs px-2 py-1 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-50">✏️ הערה</button>
                    <button onClick={() => remove(o.id)} disabled={isBusy} className="text-xs px-2 py-1 rounded-md text-stone-300 hover:text-red-600 disabled:opacity-50">🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
