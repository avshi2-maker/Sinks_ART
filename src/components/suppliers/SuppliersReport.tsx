'use client';

// src/components/suppliers/SuppliersReport.tsx
// Offers: edit line-items, delete, Word draft, RTL copy-text (Ales confirm + customer turnkey),
// customer picker + commission (% or fixed). Suppliers directory: edit/delete.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SupplierRow, SupplierOfferRow, OfferLine, CustomerPick,
  updateSupplier, deleteSupplier,
  updateSupplierOffer, deleteSupplierOffer, finalizeOfferCustomer,
} from '@/lib/suppliers/suppliersData';
import { createCustomer } from '@/lib/customers/customerMutations';

const STATUS_HE: Record<string, { label: string; cls: string }> = {
  new: { label: 'חדש', cls: 'bg-amber-100 text-amber-700' },
  drafted: { label: 'טיוטה הופקה', cls: 'bg-blue-100 text-blue-700' },
  sent: { label: 'נשלח', cls: 'bg-green-100 text-green-700' },
  archived: { label: 'אַרכיון', cls: 'bg-stone-100 text-stone-500' },
};

function ils(n: number): string { return '₪' + (Number(n) || 0).toLocaleString(); }
function dateHe(iso: string): string { return new Date(iso).toLocaleDateString('he-IL'); }
function todayHe(): string { return new Date().toLocaleDateString('he-IL'); }

function computeCustomerTotal(alesTotal: number, type: string, value: number): number {
  const v = Number(value) || 0;
  if (type === 'fixed') return Math.round(alesTotal + v);
  return Math.round(alesTotal * (1 + v / 100));
}

interface FinalizeState {
  customerId: string;
  custName: string;
  custPhone: string;
  custAddress: string;
  custNotes: string;
  commType: string;
  commValue: number;
}

import type { OptionRow } from '@/lib/options/optionsCatalog';
export default function SuppliersReport({ suppliers, offers, customers = [], options = [] }: { suppliers: SupplierRow[]; offers: SupplierOfferRow[]; customers?: CustomerPick[]; options?: OptionRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt('העתק ידנית (Ctrl+C):', text);
    }
  }

  // ---- offer line-item editing ----
  const [editOfferId, setEditOfferId] = useState<string | null>(null);
  const [draftRef, setDraftRef] = useState('');
  const [draftLines, setDraftLines] = useState<OfferLine[]>([]);

  function startEditOffer(o: SupplierOfferRow) {
    setEditOfferId(o.id); setFinalizeId(null);
    setDraftRef(o.project_ref || '');
    setDraftLines(o.line_items.length ? o.line_items.map((l) => ({ ...l })) : [{ desc: '', price: 0 }]);
  }
  function setLine(i: number, field: keyof OfferLine, val: string) {
    setDraftLines((p) => p.map((l, idx) => idx === i ? { ...l, [field]: field === 'price' ? (Number(val) || 0) : val } : l));
  }
  const draftTotal = draftLines.reduce((s, l) => s + (Number(l.price) || 0), 0);

  async function saveOffer(id: string) {
    setBusy(id);
    const items = draftLines.filter((l) => (l.desc || '').trim() || (Number(l.price) || 0) > 0);
    const res = await updateSupplierOffer(id, { line_items: items, total_ils: draftTotal, project_ref: draftRef });
    setBusy(null);
    if (!res.ok) { window.alert('שמירה נכשלה: ' + (res.error || '')); return; }
    setEditOfferId(null);
    router.refresh();
  }
  async function removeOffer(id: string) {
    if (!window.confirm('למחוק את הצעת הספק? פעולה בלתי הפיכה.')) return;
    setBusy(id);
    const res = await deleteSupplierOffer(id);
    setBusy(null);
    if (!res.ok) { window.alert('מחיקה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }

  // ---- turnkey / commission editing ----
  const [finalizeId, setFinalizeId] = useState<string | null>(null);
  const [fin, setFin] = useState<FinalizeState>({ customerId: '', custName: '', custPhone: '', custAddress: '', custNotes: '', commType: 'pct', commValue: 0 });
  const [addons, setAddons] = useState<{ name: string; price: number }[]>([]);
  function addonsTotal() { return addons.reduce((s, a) => s + (Number(a.price) || 0), 0); }
  function addAddonFromCatalog(optId: string) {
    if (!optId) return;
    const opt = options.find((o) => o.id === optId);
    if (!opt) return;
    setAddons((a) => [...a, { name: opt.name_he, price: Number(opt.customer_price) || 0 }]);
  }
  function addCustomAddon() { setAddons((a) => [...a, { name: '', price: 0 }]); }
  function updateAddon(i: number, field: 'name' | 'price', val: string) {
    setAddons((a) => a.map((x, idx) => idx === i ? { ...x, [field]: field === 'price' ? (Number(val) || 0) : val } : x));
  }
  function removeAddon(i: number) { setAddons((a) => a.filter((_, idx) => idx !== i)); }

  function startFinalize(o: SupplierOfferRow) {
    setFinalizeId(o.id); setEditOfferId(null);
    setAddons(Array.isArray(o.addon_lines) ? o.addon_lines.map((a) => ({ name: a.name, price: Number(a.price) || 0 })) : []);
    setFin({
      customerId: o.customer_id || '',
      custName: o.cust_name || '',
      custPhone: o.cust_phone || '',
      custAddress: o.cust_address || '',
      custNotes: o.cust_notes || '',
      commType: o.commission_type || 'pct',
      commValue: Number(o.commission_value) || 0,
    });
  }
  function pickCustomer(cid: string) {
    const c = customers.find((x) => x.id === cid);
    if (!c) { setFin((p) => ({ ...p, customerId: '' })); return; }
    setFin((p) => ({ ...p, customerId: cid, custName: c.name_he || '', custPhone: c.phone || '', custAddress: p.custAddress || (c.city || '') }));
  }

  function alesConfirmText(o: SupplierOfferRow): string {
    const lines = o.line_items.map((l) => '• ' + (l.desc || '') + ' — ' + ((Number(l.price) || 0) === 0 ? 'כלול' : ils(l.price)));
    return [
      'טיוטת הצעת מחיר — לאישור',
      'אלס, אנא אשר את המחירים ששלחת.',
      '',
      'תאריך: ' + todayHe(),
      o.project_ref ? 'עבור: ' + o.project_ref : '',
      '',
      ...lines,
      '──────────',
      'סה"כ כולל מע"מ: ' + ils(o.total_ils),
      '',
      'המחיר כולל מע"מ.',
    ].filter((x) => x !== null).join('\n');
  }

  function customerOfferText(o: SupplierOfferRow, f: FinalizeState): string {
    const custTotal = computeCustomerTotal(o.total_ils, f.commType, f.commValue) + addonsTotal();
    const items = o.line_items.map((l, i) => (i + 1) + '. ' + (l.desc || ''));
    const addonItems = addons.filter((a) => a.name.trim()).map((a) => '• ' + a.name + ' — ' + ils(a.price));
    const noteLines = (f.custNotes || '').split('\n').map((s) => s.trim()).filter(Boolean).map((s) => '• ' + s);
    return [
      'הצעת מחיר',
      o.project_ref ? o.project_ref : '',
      '',
      f.custName ? 'לכבוד: ' + f.custName : '',
      f.custAddress ? 'כתובת: ' + f.custAddress : '',
      f.custPhone ? 'טלפון: ' + f.custPhone : '',
      'תאריך: ' + todayHe(),
      '',
      'הצעה לאספקה והתקנה (turnkey) הכוללת:',
      ...items,
      addonItems.length ? '' : '',
      addonItems.length ? 'תוספות:' : '',
      ...addonItems,
      '',
      '──────────',
      'סה"כ לתשלום: ' + ils(custTotal),
      'המחיר כולל מע"מ ואספקה והתקנה.',
      noteLines.length ? '' : '',
      noteLines.length ? 'הערות:' : '',
      ...noteLines,
    ].filter((x) => x !== '' || true).join('\n').replace(/\n{3,}/g, '\n\n');
  }

  async function saveNewCustomer() {
    if (!fin.custName.trim()) { window.alert('הזן שם לקוח קודם'); return; }
    setBusy('newcust');
    const res = await createCustomer({ name_he: fin.custName, phone: fin.custPhone, city: fin.custAddress, source: 'phone' });
    setBusy(null);
    if (!res.ok || !res.id) { window.alert('שמירת לקוח נכשלה: ' + (res.error || '')); return; }
    setFin((p) => ({ ...p, customerId: res.id as string }));
    window.alert('הלקוח נשמר ב-CRM ✓');
    router.refresh();
  }

  async function saveFinalize(o: SupplierOfferRow) {
    setBusy(o.id);
    const custTotal = computeCustomerTotal(o.total_ils, fin.commType, fin.commValue) + addonsTotal();
    const res = await finalizeOfferCustomer(o.id, {
      customer_id: fin.customerId || null,
      cust_name: fin.custName,
      cust_phone: fin.custPhone,
      cust_address: fin.custAddress,
      cust_notes: fin.custNotes,
      commission_type: fin.commType,
      commission_value: fin.commValue,
      customer_total_ils: custTotal,
      addon_lines: addons,
    });
    setBusy(null);
    if (!res.ok) { window.alert('שמירה נכשלה: ' + (res.error || '')); return; }
    setFinalizeId(null);
    router.refresh();
  }

  // ---- supplier directory editing ----
  const [editSupId, setEditSupId] = useState<string | null>(null);
  const [sName, setSName] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sTrade, setSTrade] = useState('');

  function startEditSup(s: SupplierRow) {
    setEditSupId(s.id); setSName(s.name || ''); setSPhone(s.phone || ''); setSTrade(s.trade || '');
  }
  async function saveSup(id: string) {
    setBusy(id);
    const res = await updateSupplier(id, { name: sName, phone: sPhone, trade: sTrade });
    setBusy(null);
    if (!res.ok) { window.alert('שמירה נכשלה: ' + (res.error || '')); return; }
    setEditSupId(null);
    router.refresh();
  }
  async function removeSup(id: string) {
    if (!window.confirm('למחוק את הספק מהספרייה? ההצעות שלו יישארו (ללא קישור).')) return;
    setBusy(id);
    const res = await deleteSupplier(id);
    setBusy(null);
    if (!res.ok) { window.alert('מחיקה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* OFFERS */}
      <section>
        <h2 className="text-sm font-semibold text-stone-700 mb-2">הצעות מחיר מספקים</h2>
        {offers.length === 0 && (<div className="text-sm text-stone-400 border border-dashed border-stone-200 rounded-lg p-4 text-center">אין הצעות עדיין · הדבק הצעת ספק בלשונית פניות</div>)}
        <div className="space-y-3">
          {offers.map((o) => {
            const st = STATUS_HE[o.status] || STATUS_HE.new;
            const lineEditing = editOfferId === o.id;
            const finalizing = finalizeId === o.id;
            const custTotalPreview = computeCustomerTotal(o.total_ils, fin.commType, fin.commValue);
            return (
              <div key={o.id} className="bg-white border border-stone-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-stone-800 text-sm">{o.supplier_name || 'ספק'}</span>
                  <span className={'text-[11px] px-2 py-0.5 rounded-full ' + st.cls}>{st.label}</span>
                  <span className="text-[11px] text-stone-400 mr-auto">{dateHe(o.created_at)}</span>
                </div>

                {!lineEditing && (
                  <>
                    {o.project_ref && (<div className="text-xs text-stone-500 mb-2">עבור: {o.project_ref}</div>)}
                    <div className="border border-stone-100 rounded overflow-hidden mb-2">
                      {o.line_items.map((l, i) => (
                        <div key={i} className="flex items-center justify-between px-2 py-1 text-sm border-b border-stone-50 last:border-0">
                          <span className="text-stone-700">{l.desc || '—'}</span>
                          <span className="text-stone-600 font-mono">{(Number(l.price) || 0) === 0 ? 'כלול' : ils(l.price)}</span>
                        </div>
                      ))}
                    </div>
                    {o.rfq_token && (<div className="text-[11px] text-stone-400 mb-1">מקור: RFQ · <span className="font-mono">{o.rfq_token.slice(0,8)}</span></div>)}
                    {o.ales_photo_urls && o.ales_photo_urls.length > 0 && (
                      <div className="mb-2">
                        <div className="text-[11px] font-semibold text-stone-500 mb-1">📷 תמונות אתר מאלס ({o.ales_photo_urls.length})</div>
                        <div className="flex flex-wrap gap-2">
                          {o.ales_photo_urls.map((u, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <a key={i} href={u} target="_blank" rel="noopener noreferrer"><img src={u} alt={'אתר ' + (i+1)} className="w-16 h-16 object-cover rounded-md border border-stone-200" /></a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-stone-800">עלות אלס (כולל מע"מ): {ils(o.total_ils)}</span>
                      <div className="flex gap-1 mr-auto flex-wrap">
                        <button onClick={() => copyText('ales-' + o.id, alesConfirmText(o))} className="text-xs px-3 py-1 rounded-md bg-stone-700 text-white hover:bg-stone-800">{copied === 'ales-' + o.id ? '✓ הועתק' : '📋 טקסט לאלס'}</button>
                        <button onClick={() => startFinalize(o)} className="text-xs px-3 py-1 rounded-md bg-amber-600 text-white font-semibold hover:bg-amber-700">🧾 הצעת לקוח</button>
                        <button onClick={() => startEditOffer(o)} className="text-xs px-2 py-1 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200">✏️ פריטים</button>
                        <button onClick={() => removeOffer(o.id)} disabled={busy === o.id} className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">🗑️</button>
                      </div>
                    </div>
                  </>
                )}

                {lineEditing && (
                  <div className="space-y-2">
                    <input value={draftRef} onChange={(e) => setDraftRef(e.target.value)} placeholder="עבור איזה פרויקט / כיור" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
                    <div className="border border-stone-200 rounded overflow-hidden">
                      {draftLines.map((l, i) => (
                        <div key={i} className="flex items-center gap-1 px-2 py-1 border-b border-stone-50 last:border-0">
                          <input value={l.desc} onChange={(e) => setLine(i, 'desc', e.target.value)} placeholder="תיאור" className="flex-1 px-2 py-1 text-sm border border-stone-200 rounded" dir="rtl" />
                          <input type="number" value={l.price || ''} onChange={(e) => setLine(i, 'price', e.target.value)} placeholder="0" className="w-24 px-2 py-1 text-sm border border-stone-200 rounded text-center" dir="ltr" />
                          <button onClick={() => setDraftLines((p) => p.filter((_, idx) => idx !== i))} className="w-7 text-stone-400 hover:text-red-600">🗑️</button>
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-2 py-1 bg-stone-50">
                        <button onClick={() => setDraftLines((p) => [...p, { desc: '', price: 0 }])} className="text-xs text-blue-600 hover:underline">+ הוסף שורה</button>
                        <span className="text-sm font-semibold text-stone-800">סה"כ: {ils(draftTotal)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveOffer(o.id)} disabled={busy === o.id} className="text-xs px-3 py-1 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50">💾 שמור</button>
                      <button onClick={() => setEditOfferId(null)} className="text-xs px-3 py-1 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200">ביטול</button>
                    </div>
                  </div>
                )}

                {finalizing && (
                  <div className="mt-2 border-t border-amber-200 pt-3 space-y-2 bg-amber-50/40 rounded-md p-2">
                    <div className="text-xs font-semibold text-amber-700">הצעת לקוח (turnkey) — אלס שולח ללקוח</div>
                    <select value={fin.customerId} onChange={(e) => pickCustomer(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl">
                      <option value="">— בחר לקוח קיים (או הקלד למטה) —</option>
                      {customers.map((c) => (<option key={c.id} value={c.id}>{c.name_he}{c.city ? ' · ' + c.city : ''}</option>))}
                    </select>
                    <div className="grid grid-cols-3 gap-2">
                      <input value={fin.custName} onChange={(e) => setFin({ ...fin, custName: e.target.value })} placeholder="שם לקוח" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
                      <input value={fin.custPhone} onChange={(e) => setFin({ ...fin, custPhone: e.target.value })} placeholder="טלפון" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" />
                      <input value={fin.custAddress} onChange={(e) => setFin({ ...fin, custAddress: e.target.value })} placeholder="כתובת" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap bg-white border border-stone-200 rounded-md p-2">
                      <span className="text-xs text-stone-500">רווח / עמלה:</span>
                      <div className="flex gap-1">
                        <button onClick={() => setFin({ ...fin, commType: 'pct' })} className={fin.commType === 'pct' ? 'text-xs px-2 py-1 rounded bg-amber-600 text-white' : 'text-xs px-2 py-1 rounded bg-stone-100 text-stone-500'}>%</button>
                        <button onClick={() => setFin({ ...fin, commType: 'fixed' })} className={fin.commType === 'fixed' ? 'text-xs px-2 py-1 rounded bg-amber-600 text-white' : 'text-xs px-2 py-1 rounded bg-stone-100 text-stone-500'}>₪ קבוע</button>
                      </div>
                      <input type="number" value={fin.commValue || ''} onChange={(e) => setFin({ ...fin, commValue: Number(e.target.value) || 0 })} placeholder="0" className="w-24 px-2 py-1 text-sm border border-stone-300 rounded text-center" dir="ltr" />
                      <div className="text-xs text-stone-500 mr-auto">עלות אלס {ils(o.total_ils)} · עמלה {ils(custTotalPreview - o.total_ils)}</div>
                    </div>
                    <div className="bg-white border border-stone-200 rounded-md p-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-stone-600">תוספות להצעה</span>
                        <span className="text-xs text-stone-400">סה"כ תוספות: {ils(addonsTotal())}</span>
                      </div>
                      {addons.map((a, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <input value={a.name} onChange={(e) => updateAddon(i, 'name', e.target.value)} placeholder="שם תוספת" className="flex-1 px-2 py-1 text-sm border border-stone-300 rounded" dir="rtl" />
                          <input type="number" value={a.price || ''} onChange={(e) => updateAddon(i, 'price', e.target.value)} placeholder="₪" className="w-24 px-2 py-1 text-sm border border-stone-300 rounded text-center" dir="ltr" />
                          <button onClick={() => removeAddon(i)} className="text-xs px-1.5 py-1 rounded text-stone-300 hover:text-red-600">🗑️</button>
                        </div>
                      ))}
                      <div className="flex items-center gap-1.5 pt-1">
                        <select onChange={(e) => { addAddonFromCatalog(e.target.value); e.target.value=''; }} defaultValue="" className="flex-1 px-2 py-1 text-xs border border-stone-300 rounded bg-stone-50" dir="rtl">
                          <option value="">➕ הוסף מהקטלוג…</option>
                          {options.map((opt) => (<option key={opt.id} value={opt.id}>{opt.name_he} · {ils(opt.customer_price)}</option>))}
                        </select>
                        <button onClick={addCustomAddon} className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200 whitespace-nowrap">+ שורה חופשית</button>
                      </div>
                    </div>

                    <div className="text-sm font-bold text-stone-900">סה"כ ללקוח (כולל מע"מ): {ils(custTotalPreview + addonsTotal())}</div>
                    <textarea value={fin.custNotes} onChange={(e) => setFin({ ...fin, custNotes: e.target.value })} placeholder="הערות (שורה לכל הערה) — לדוגמה: חיבור אינסטלטור בנפרד · אספקה תוך 3 שבועות" rows={3} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md resize-y" dir="rtl" />
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={saveNewCustomer} disabled={busy === 'newcust'} className="text-xs px-3 py-1 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">➕ שמור כלקוח חדש</button>
                      <button onClick={() => copyText('cust-' + o.id, customerOfferText(o, fin))} className="text-xs px-3 py-1 rounded-md bg-amber-600 text-white font-semibold hover:bg-amber-700">{copied === 'cust-' + o.id ? '✓ הועתק' : '📋 העתק הצעת לקוח'}</button>
                      <button onClick={() => saveFinalize(o)} disabled={busy === o.id} className="text-xs px-3 py-1 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50">💾 שמור (ל-ROI)</button>
                      <button onClick={() => setFinalizeId(null)} className="text-xs px-3 py-1 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200">סגור</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* DIRECTORY */}
      <section>
        <h2 className="text-sm font-semibold text-stone-700 mb-2">ספריית ספקים</h2>
        {suppliers.length === 0 && (<div className="text-sm text-stone-400 border border-dashed border-stone-200 rounded-lg p-4 text-center">אין ספקים בספרייה עדיין</div>)}
        <div className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-100">
          {suppliers.map((s) => {
            const editing = editSupId === s.id;
            return (
              <div key={s.id} className="p-3">
                {!editing && (
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="text-sm font-medium text-stone-800">{s.name}</div>
                      <div className="text-xs text-stone-400">{[s.trade, s.phone].filter(Boolean).join(' · ') || '—'}</div>
                    </div>
                    <div className="flex gap-1 mr-auto">
                      <button onClick={() => startEditSup(s)} className="text-xs px-2 py-1 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200">✏️ ערוך</button>
                      <button onClick={() => removeSup(s.id)} disabled={busy === s.id} className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">🗑️</button>
                    </div>
                  </div>
                )}
                {editing && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <input value={sName} onChange={(e) => setSName(e.target.value)} placeholder="שם" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
                      <input value={sPhone} onChange={(e) => setSPhone(e.target.value)} placeholder="טלפון" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="ltr" />
                      <input value={sTrade} onChange={(e) => setSTrade(e.target.value)} placeholder="תחום" className="px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveSup(s.id)} disabled={busy === s.id} className="text-xs px-3 py-1 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50">💾 שמור</button>
                      <button onClick={() => setEditSupId(null)} className="text-xs px-3 py-1 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200">ביטול</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}






