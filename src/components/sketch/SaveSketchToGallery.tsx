'use client';
// src/components/sketch/SaveSketchToGallery.tsx
// Button + panel: save the current sketch SVG into the demos gallery (kind='sketch').
// FREE picker: link to ANY project (any customer) and/or a customer. Blank = general gallery asset.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  saveSketchToGallery,
  fetchCustomersForPicker,
  fetchAllProjectsForPicker,
  CustomerPickLite,
  ProjectPickFull,
} from '@/lib/demos/demosData';

export default function SaveSketchToGallery({ svg, spec, defaultTitle }: { svg: string; spec: Record<string, unknown>; defaultTitle?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerPickLite[]>([]);
  const [projects, setProjects] = useState<ProjectPickFull[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState(defaultTitle || '');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  async function openPanel() {
    setOpen(true); setOk(false);
    setTitle(defaultTitle || '');
    setCustomerId(''); setProjectId('');
    const [cs, ps] = await Promise.all([fetchCustomersForPicker(), fetchAllProjectsForPicker()]);
    setCustomers(cs);
    setProjects(ps);
  }

  // Picking a project auto-fills the customer, keeping the saved row consistent.
  function pickProject(pid: string) {
    setProjectId(pid);
    const p = projects.find((x) => x.id === pid);
    if (p && p.customer_id) setCustomerId(p.customer_id);
  }

  async function save() {
    setBusy(true);
    const res = await saveSketchToGallery({
      title_he: title,
      sketch_svg: svg,
      spec,
      customer_id: customerId || null,
      project_id: projectId || null,
    });
    setBusy(false);
    if (!res.ok) { window.alert('שמירה נכשלה: ' + (res.error || '')); return; }
    setOk(true);
    setTimeout(() => { setOpen(false); router.refresh(); }, 1200);
  }

  if (!open) {
    return <button onClick={openPanel} className="text-sm px-4 py-1.5 bg-pink-600 text-white rounded-md hover:bg-pink-700">🖼️ שמור לגלריה</button>;
  }

  const projLabel = (p: ProjectPickFull) => (p.customer_name ? p.customer_name + ' — ' : '') + (p.title_he || 'פרויקט');

  return (
    <div className="w-full mt-2 border border-pink-200 bg-pink-50/40 rounded-md p-3 space-y-2" dir="rtl">
      <div className="text-xs font-semibold text-pink-700">שמירת שרטוט לגלריה</div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="כותרת השרטוט" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
      <div className="space-y-2">
        <div>
          <label className="block text-[11px] text-stone-500 mb-0.5">פרויקט (כל פרויקט · כל לקוח)</label>
          <select value={projectId} onChange={(e) => pickProject(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl">
            <option value="">— ללא פרויקט —</option>
            {projects.map((p) => (<option key={p.id} value={p.id}>{projLabel(p)}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-stone-500 mb-0.5">לקוח (אופציונלי · מתמלא אוטומטית מהפרויקט)</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl">
            <option value="">— ללא לקוח —</option>
            {customers.map((c) => (<option key={c.id} value={c.id}>{c.name_he}</option>))}
          </select>
        </div>
      </div>
      {ok && (<div className="text-xs text-emerald-600">✓ נשמר לגלריה</div>)}
      <div className="flex gap-2">
        <button onClick={save} disabled={busy} className="text-sm px-4 py-1.5 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 disabled:opacity-50">{busy ? 'שומר…' : '💾 שמור'}</button>
        <button onClick={() => setOpen(false)} className="text-sm px-4 py-1.5 bg-stone-100 text-stone-600 rounded-md hover:bg-stone-200">ביטול</button>
      </div>
    </div>
  );
}
