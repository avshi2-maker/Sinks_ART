'use client';

// src/components/sites/SiteDocuments.tsx
// Phase 36 — site documents/offers.
// Upload PDF/image -> Cloudinary, list with page-1 PDF thumbnail, optional auto follow-up
// task, optional push to the global offers tracker, and a WhatsApp follow-up nudge.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadToCloudinary, getPdfPreviewUrl } from '@/lib/intake/cloudinary';
import { addSiteDocument, deleteSiteDocument } from '@/lib/sites/siteDocuments';
import { DOC_TYPE_META, DOC_TYPE_ORDER } from '@/lib/sites/siteDocumentsTypes';
import type { SiteDocument, DocType } from '@/lib/sites/siteDocumentsTypes';
import type { SiteProject, SiteContact } from '@/lib/sites/sitesData';

const INPUT = 'w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white';

function ils(n: number | null): string { return '₪' + (Math.round(n || 0)).toLocaleString('he-IL'); }
function fmtDate(iso: string): string { return new Date(iso).toLocaleDateString('he-IL'); }
function isPdf(url: string): boolean { return /\.pdf(\?.*)?$/i.test(url); }

function waUrl(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^0/, '972');
  return 'https://api.whatsapp.com/send?phone=' + digits + '&text=' + encodeURIComponent(text);
}

interface Props {
  siteId: string;
  documents: SiteDocument[];
  projects: SiteProject[];
  contacts: SiteContact[];
}

export default function SiteDocuments({ siteId, documents, projects, contacts }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType>('offer');
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [total, setTotal] = useState('');
  const [createTask, setCreateTask] = useState(true);
  const [dueDays, setDueDays] = useState('5');
  const [pushTracker, setPushTracker] = useState(true);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const firstPhoneContact = contacts.find((c) => c.phone);

  function pickFile(f: File | null) {
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  }

  function reset() {
    setOpen(false); setFile(null); setDocType('offer'); setTitle(''); setProjectId('');
    setTotal(''); setCreateTask(true); setDueDays('5'); setPushTracker(true); setError(null); setStage('');
  }

  async function save() {
    setError(null);
    if (!file) { setError('בחר קובץ'); return; }
    if (!title.trim()) { setError('כותרת חובה'); return; }
    setBusy(true);
    try {
      setStage('מעלה קובץ ל-Cloudinary...');
      const up = await uploadToCloudinary(file, 'marble-sinks/site-docs');
      setStage('שומר רשומה...');
      const totalNum = total.trim() ? Number(total.replace(/[^\d.]/g, '')) : null;
      const res = await addSiteDocument({
        siteId,
        doc_type: docType,
        title_he: title.trim(),
        cloudinary_url: up.url,
        file_name: file.name,
        project_id: projectId || null,
        total_ils: totalNum,
        createTask,
        taskDueInDays: Number(dueDays) || 5,
        pushToTracker: pushTracker,
        customer_name: firstPhoneContact?.name_he || null,
        customer_phone: firstPhoneContact?.phone || null,
      });
      if (!res.ok) { setError(res.error || 'שמירה נכשלה'); setBusy(false); setStage(''); return; }
      setBusy(false);
      reset();
      router.refresh();
    } catch (e) {
      setBusy(false); setStage('');
      setError(e instanceof Error ? e.message : 'העלאה נכשלה');
    }
  }

  async function remove(id: string) {
    if (!window.confirm('למחוק מסמך זה? (הקובץ ב-Cloudinary יישאר)')) return;
    const res = await deleteSiteDocument(id, siteId);
    if (!res.ok) { window.alert('מחיקה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }

  return (
    <section className="mb-6" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-stone-700">מסמכים והצעות ({documents.length})</h2>
        <button onClick={() => (open ? reset() : setOpen(true))} className="text-xs text-blue-600 hover:underline">{open ? 'ביטול' : '➕ הוסף מסמך/הצעה'}</button>
      </div>

      {open && (
        <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <input type="file" accept="application/pdf,image/*" onChange={(e) => pickFile(e.target.files?.[0] || null)} className="w-full text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-stone-500">סוג</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value as DocType)} className={INPUT} dir="rtl">
                {DOC_TYPE_ORDER.map((t) => (<option key={t} value={t}>{DOC_TYPE_META[t].emoji} {DOC_TYPE_META[t].label}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-500">כותרת</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="כותרת המסמך" className={INPUT} dir="rtl" />
            </div>
            <div>
              <label className="text-xs text-stone-500">פרויקט מקושר (לא חובה)</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={INPUT} dir="rtl">
                <option value="">— ללא —</option>
                {projects.map((p) => (<option key={p.id} value={p.id}>{p.title_he}</option>))}
              </select>
            </div>
            {docType === 'offer' && (
              <div>
                <label className="text-xs text-stone-500">סכום הצעה ₪ (לא חובה)</label>
                <input value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0" inputMode="numeric" className={INPUT} dir="ltr" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 text-xs text-stone-600">
              <input type="checkbox" checked={createTask} onChange={(e) => setCreateTask(e.target.checked)} />
              <span>צור משימת מעקב בעוד</span>
              <input value={dueDays} onChange={(e) => setDueDays(e.target.value)} inputMode="numeric" className="w-10 px-1 py-0.5 text-center border border-stone-300 rounded" />
              <span>ימים</span>
            </label>
            {docType === 'offer' && (
              <label className="flex items-center gap-1.5 text-xs text-stone-600">
                <input type="checkbox" checked={pushTracker} onChange={(e) => setPushTracker(e.target.checked)} />
                <span>הוסף למעקב הצעות בלוח</span>
              </label>
            )}
          </div>

          {error && (<div className="text-xs text-red-600">{error}</div>)}
          <div className="flex items-center justify-end gap-2">
            {stage && (<span className="text-xs text-stone-500">{stage}</span>)}
            <button onClick={save} disabled={busy} className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{busy ? 'מעבד...' : 'שמור מסמך'}</button>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-4 text-center text-sm text-stone-500">אין מסמכים עדיין.</div>
      ) : (
        <div className="space-y-1.5">
          {documents.map((d) => {
            const meta = DOC_TYPE_META[d.doc_type] || DOC_TYPE_META.other;
            const thumb = isPdf(d.cloudinary_url) ? getPdfPreviewUrl(d.cloudinary_url) : d.cloudinary_url;
            const waMsg = 'שלום ' + (firstPhoneContact?.name_he || '') + ', רציתי לבדוק לגבי ההצעה ' + d.title_he + '. נשמח לתשובתך, תודה!';
            return (
              <div key={d.id} className="bg-white border border-stone-200 rounded-lg p-2.5 flex items-center gap-3">
                <a href={d.cloudinary_url} target="_blank" rel="noreferrer" className="shrink-0 w-12 h-14 rounded border border-stone-200 overflow-hidden bg-stone-50 flex items-center justify-center">
                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                </a>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-stone-800 truncate">{d.title_he}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={'text-[11px] px-1.5 py-0.5 rounded ' + meta.cls}>{meta.emoji} {meta.label}</span>
                    {d.total_ils ? <span className="text-xs text-stone-500">{ils(d.total_ils)}</span> : null}
                    <span className="text-xs text-stone-400">{fmtDate(d.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={d.cloudinary_url} target="_blank" rel="noreferrer" title="פתח" className="text-stone-400 hover:text-blue-600 text-sm">👁️</a>
                  {d.doc_type === 'offer' && firstPhoneContact?.phone ? (<a href={waUrl(firstPhoneContact.phone, waMsg)} target="_blank" rel="noreferrer" title={'מעקב WhatsApp ל' + firstPhoneContact.name_he} className="text-stone-400 hover:text-green-600 text-sm">💬</a>) : null}
                  <button onClick={() => remove(d.id)} title="מחק" className="text-stone-300 hover:text-red-600 text-sm">🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
