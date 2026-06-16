'use client';

// src/components/sketch/SaveSketchToGallery.tsx
// Button + panel: save the current sketch SVG into the demos gallery (kind='sketch').
// Optional customer link -> optional project link. Leave both blank = general gallery asset.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  saveSketchToGallery,
  fetchCustomersForPicker,
  fetchProjectsForCustomer,
  CustomerPickLite,
  ProjectPickLite,
} from '@/lib/demos/demosData';

export default function SaveSketchToGallery({ svg, spec, defaultTitle }: { svg: string; spec: Record<string, unknown>; defaultTitle?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerPickLite[]>([]);
  const [projects, setProjects] = useState<ProjectPickLite[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState(defaultTitle || '');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  async function openPanel() {
    setOpen(true); setOk(false);
    setTitle(defaultTitle || '');
    const cs = await fetchCustomersForPicker();
    setCustomers(cs);
  }
  async function pickCustomer(cid: string) {
    setCustomerId(cid); setProjectId(''); setProjects([]);
    if (cid) setProjects(await fetchProjectsForCustomer(cid));
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

  return (
    <div className="w-full mt-2 border border-pink-200 bg-pink-50/40 rounded-md p-3 space-y-2" dir="rtl">
      <div className="text-xs font-semibold text-pink-700">שמירת שרטוט לגלריה</div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="כותרת השרטוט" className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded-md" dir="rtl" />
      <div className="grid grid-cols-2 gap-2">
        <select value={customerId} onChange={(e) => pickCustomer(e.target.value)} className="px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white" dir="rtl">
          <option value="">— ללא לקוח (נכס כללי) —</option>
          {customers.map((c) => (<option key={c.id} value={c.id}>{c.name_he}</option>))}
        </select>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={!customerId} className="px-2 py-1.5 text-sm border border-stone-300 rounded-md bg-white disabled:opacity-50" dir="rtl">
          <option value="">— ללא פרויקט —</option>
          {projects.map((p) => (<option key={p.id} value={p.id}>{p.title_he || 'פרויקט'}</option>))}
        </select>
      </div>
      {ok && (<div className="text-xs text-emerald-600">✓ נשמר לגלריה</div>)}
      <div className="flex gap-2">
        <button onClick={save} disabled={busy} className="text-sm px-4 py-1.5 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 disabled:opacity-50">{busy ? 'שומר…' : '💾 שמור'}</button>
        <button onClick={() => setOpen(false)} className="text-sm px-4 py-1.5 bg-stone-100 text-stone-600 rounded-md hover:bg-stone-200">ביטול</button>
      </div>
    </div>
  );
}
