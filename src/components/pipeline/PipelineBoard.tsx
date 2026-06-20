'use client';

// src/components/pipeline/PipelineBoard.tsx
// Command center: money tiles + stage filters + job table. Ferrari: manual add-job,
// click-to-edit full panel (title, customer, ₪ values, stage, notes), link to offer.
import { useState, useMemo, useTransition } from 'react';
import { advanceJobStage, deleteJob, createJob, updateJob } from '@/lib/pipeline/jobPipelineData';
import { JobRow, JobStage, STAGE_META, STAGE_ORDER, PipelineSummary } from '@/lib/pipeline/jobPipelineTypes';

function ils(n: number): string { return '₪' + (Number(n) || 0).toLocaleString(); }
function dateHe(iso: string | null): string { return iso ? new Date(iso).toLocaleDateString('he-IL') : '—'; }
function daysAgo(iso: string | null): string {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'היום';
  if (d === 1) return 'אתמול';
  return 'לפני ' + d + ' ימים';
}

interface EditState {
  title_he: string; customer_name: string; customer_phone: string; customer_city: string;
  stage: JobStage; ales_cost: number; customer_total: number; commission: number; notes: string;
}
function editFromJob(j: JobRow): EditState {
  return {
    title_he: j.title_he, customer_name: j.customer_name || '', customer_phone: j.customer_phone || '',
    customer_city: j.customer_city || '', stage: j.stage, ales_cost: j.ales_cost || 0,
    customer_total: j.customer_total || 0, commission: j.commission || 0, notes: j.notes || '',
  };
}

const INPUT_CLS = 'w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md';
const NUM_CLS = 'w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md text-center';

function EditFields({ st, set }: { st: EditState; set: (patch: Partial<EditState>) => void }) {
  return (
    <div className="space-y-2 mt-2">
      <input value={st.title_he} onChange={(e) => set({ title_he: e.target.value })} placeholder="שם העבודה" className={INPUT_CLS} dir="rtl" />
      <div className="grid grid-cols-3 gap-2">
        <input value={st.customer_name} onChange={(e) => set({ customer_name: e.target.value })} placeholder="שם לקוח" className={INPUT_CLS} dir="rtl" />
        <input value={st.customer_phone} onChange={(e) => set({ customer_phone: e.target.value })} placeholder="טלפון" className={INPUT_CLS} dir="ltr" />
        <input value={st.customer_city} onChange={(e) => set({ customer_city: e.target.value })} placeholder="עיר" className={INPUT_CLS} dir="rtl" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="block"><span className="text-[11px] text-stone-500">עלות אלס ₪</span>
          <input type="number" inputMode="numeric" value={st.ales_cost || ''} onChange={(e) => { const v = Number(e.target.value) || 0; set({ ales_cost: v, commission: Math.max(0, (Number(st.customer_total) || 0) - v) }); }} className={NUM_CLS} dir="ltr" /></label>
        <label className="block"><span className="text-[11px] text-stone-500">ללקוח ₪</span>
          <input type="number" inputMode="numeric" value={st.customer_total || ''} onChange={(e) => { const v = Number(e.target.value) || 0; set({ customer_total: v, commission: Math.max(0, v - (Number(st.ales_cost) || 0)) }); }} className={NUM_CLS} dir="ltr" /></label>
        <label className="block"><span className="text-[11px] text-stone-500">עמלה ₪ (אוטומטי)</span>
          <input type="number" inputMode="numeric" value={st.commission || ''} onChange={(e) => set({ commission: Number(e.target.value) || 0 })} className={NUM_CLS} dir="ltr" /></label>
      </div>
      <label className="block"><span className="text-[11px] text-stone-500">שלב</span>
        <select value={st.stage} onChange={(e) => set({ stage: e.target.value as JobStage })} className={INPUT_CLS + ' bg-white'} dir="rtl">
          {STAGE_ORDER.map((s) => (<option key={s} value={s}>{STAGE_META[s].label}</option>))}
        </select>
      </label>
      <textarea value={st.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} placeholder="הערות" className={INPUT_CLS + ' resize-y'} dir="rtl" />
    </div>
  );
}

export default function PipelineBoard({ jobs, summary }: { jobs: JobRow[]; summary: PipelineSummary }) {
  const [filter, setFilter] = useState<JobStage | 'all' | 'active'>('active');
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [add, setAdd] = useState<EditState>({ title_he: '', customer_name: '', customer_phone: '', customer_city: '', stage: 'priced', ales_cost: 0, customer_total: 0, commission: 0, notes: '' });

  const filtered = useMemo(() => {
    if (filter === 'all') return jobs;
    if (filter === 'active') return jobs.filter((j) => STAGE_META[j.stage as JobStage]?.active);
    return jobs.filter((j) => j.stage === filter);
  }, [jobs, filter]);

  function nextStage(s: JobStage): JobStage | null {
    const flow: JobStage[] = ['priced', 'offer_sent', 'ordered', 'delivered', 'paid'];
    const i = flow.indexOf(s);
    if (i >= 0 && i < flow.length - 1) return flow[i + 1];
    if (s === 'new_lead') return 'awaiting_ales';
    if (s === 'awaiting_ales') return 'priced';
    return null;
  }

  function advance(id: string, to: JobStage, title: string) {
    if (!confirm('להעביר את "' + title + '" לשלב: ' + STAGE_META[to].label + ' ?')) return;
    setBusyId(id);
    startTransition(async () => { await advanceJobStage(id, to); setBusyId(null); });
  }
  function markLost(id: string, title: string) {
    if (!confirm('לסמן את "' + title + '" כאבוד?')) return;
    setBusyId(id);
    startTransition(async () => { await advanceJobStage(id, 'lost'); setBusyId(null); });
  }
  function remove(id: string) {
    if (!confirm('למחוק את העבודה לצמיתות?')) return;
    setBusyId(id);
    startTransition(async () => { await deleteJob(id); setBusyId(null); });
  }
  function openEdit(j: JobRow) { setEditId(j.id); setEdit(editFromJob(j)); }
  function saveEdit() {
    if (!editId || !edit) return;
    setBusyId(editId);
    startTransition(async () => {
      await updateJob(editId, { ...edit });
      setBusyId(null); setEditId(null); setEdit(null);
    });
  }
  function saveAdd() {
    if (!add.title_he.trim()) { alert('הזן שם עבודה'); return; }
    setBusyId('add');
    startTransition(async () => {
      await createJob({ ...add });
      setBusyId(null); setShowAdd(false);
      setAdd({ title_he: '', customer_name: '', customer_phone: '', customer_city: '', stage: 'priced', ales_cost: 0, customer_total: 0, commission: 0, notes: '' });
    });
  }

  return (
    <div dir="rtl">
      {/* money tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <div className="text-xs text-stone-500">עבודות פעילות</div>
          <div className="text-2xl font-bold text-stone-900">{summary.activeCount}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <div className="text-xs text-stone-500">שווי פעיל (ללקוח)</div>
          <div className="text-2xl font-bold text-blue-700">{ils(summary.activeValue)}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <div className="text-xs text-stone-500">עמלה צפויה (פעיל)</div>
          <div className="text-2xl font-bold text-purple-700">{ils(summary.commissionActive)}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <div className="text-xs text-stone-500">שולם — סה"כ</div>
          <div className="text-2xl font-bold text-emerald-700">{ils(summary.paidValueAll)}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <div className="text-xs text-stone-500">עמלה שנגבתה</div>
          <div className="text-2xl font-bold text-amber-600">{ils(summary.commissionPaidAll)}</div>
        </div>
      </div>

      {/* add job */}
      <div className="mb-3">
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700">+ עבודה חדשה</button>
        ) : (
          <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3">
            <div className="text-sm font-semibold text-blue-800">עבודה חדשה (ידנית)</div>
            <EditFields st={add} set={(patch) => setAdd((p) => ({ ...p, ...patch }))} />
            <div className="flex gap-2 mt-2">
              <button onClick={saveAdd} disabled={pending} className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 disabled:opacity-50">💾 צור עבודה</button>
              <button onClick={() => setShowAdd(false)} className="text-xs px-3 py-1.5 bg-stone-100 text-stone-600 rounded-md hover:bg-stone-200">ביטול</button>
            </div>
          </div>
        )}
      </div>

      {/* stage filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button onClick={() => setFilter('active')} className={'px-3 py-1.5 rounded-lg text-sm font-medium border ' + (filter === 'active' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200')}>פעילות</button>
        <button onClick={() => setFilter('all')} className={'px-3 py-1.5 rounded-lg text-sm font-medium border ' + (filter === 'all' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200')}>הכל ({jobs.length})</button>
        {STAGE_ORDER.map((s) => {
          const m = STAGE_META[s];
          const c = summary.byStage[s]?.count || 0;
          return (
            <button key={s} onClick={() => setFilter(s)} className={'px-3 py-1.5 rounded-lg text-sm font-medium border ' + (filter === s ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200')}>
              <span className={'inline-block w-2 h-2 rounded-full me-1 ' + m.cls.split(' ')[0]}></span>{m.short} ({c})
            </button>
          );
        })}
      </div>

      {/* table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-lg p-8 text-center text-stone-400 text-sm">אין עבודות בקטגוריה זו</div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
          {filtered.map((j) => {
            const m = STAGE_META[j.stage as JobStage] || STAGE_META.priced;
            const nxt = nextStage(j.stage as JobStage);
            const isBusy = busyId === j.id && pending;
            const isEditing = editId === j.id;
            return (
              <div key={j.id} className="border-b border-stone-100 last:border-0 p-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={'text-[11px] px-2 py-0.5 rounded-full font-medium ' + m.cls}>{m.label}</span>
                      <span className="font-semibold text-stone-900 text-sm break-words">{j.title_he}</span>
                    </div>
                    <div className="text-xs text-stone-500 mt-1">{[j.customer_name, j.customer_phone, j.customer_city].filter(Boolean).join(' · ') || '—'}</div>
                    <div className="text-xs text-stone-400 mt-0.5">עלות אלס {ils(j.ales_cost)} · ללקוח {ils(j.customer_total)} · עמלה {ils(j.commission)}</div>
                    {j.offer_sent_at && (
                      <div className="text-xs mt-0.5">
                        <span className="text-stone-500">הצעה נשלחה {dateHe(j.offer_sent_at)}</span>
                        <span className="text-amber-600 font-medium"> · {daysAgo(j.offer_sent_at)}</span>
                      </div>
                    )}
                    {j.supplier_offer_id && (<a href="/suppliers" className="text-xs text-blue-600 hover:underline mt-0.5 inline-block">↗ פתח הצעת ספק</a>)}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {nxt && j.stage !== 'paid' && j.stage !== 'lost' && (
                      <button onClick={() => advance(j.id, nxt, j.title_he)} disabled={isBusy} className="text-xs px-2.5 py-1 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50">→ {STAGE_META[nxt].short}</button>
                    )}
                    <button onClick={() => (isEditing ? setEditId(null) : openEdit(j))} disabled={isBusy} className="text-xs px-2 py-1 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-50">{isEditing ? 'סגור' : '✏️ ערוך'}</button>
                    {j.stage !== 'lost' && j.stage !== 'paid' && (<button onClick={() => markLost(j.id, j.title_he)} disabled={isBusy} className="text-xs px-2 py-1 rounded-md bg-stone-100 text-stone-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">אבוד</button>)}
                    <button onClick={() => remove(j.id)} disabled={isBusy} className="text-xs px-2 py-1 rounded-md text-stone-300 hover:text-red-600 disabled:opacity-50">🗑️</button>
                  </div>
                </div>

                {isEditing && edit && (
                  <div className="mt-2 border-t border-stone-200 pt-2">
                    <EditFields st={edit} set={(patch) => setEdit((p) => (p ? { ...p, ...patch } : p))} />
                    <div className="flex gap-2 mt-2">
                      <button onClick={saveEdit} disabled={isBusy} className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 disabled:opacity-50">💾 שמור</button>
                      <button onClick={() => { setEditId(null); setEdit(null); }} className="text-xs px-3 py-1.5 bg-stone-100 text-stone-600 rounded-md hover:bg-stone-200">ביטול</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
