'use client';
// src/components/seo/IndexTracker.tsx · updated 23.09.2026 13:07 (Asia/Jerusalem)
// Google indexing work-list: filters, bulk copy, bulk status, per-URL actions.
// Flow: new URL appears (auto from sitemap) -> copy -> Search Console "Request indexing" -> mark submitted -> later mark indexed.

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { TrackedUrl, IndexStatus, UrlKind } from '@/lib/seo/indexTypes';
import { KIND_LABEL } from '@/lib/seo/indexTypes';
import { setIndexStatus, sendToBing, type IndexAction } from '@/lib/seo/indexMutations';
import IndexRow from './IndexRow';

type StatusFilter = 'all' | IndexStatus;
const S_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'new', label: '🆕 חדשים' },
  { id: 'submitted', label: '📨 נשלחו' },
  { id: 'indexed', label: '✅ מאונדקסים' },
  { id: 'all', label: 'הכל' },
];
const tabOn = 'px-3 py-1.5 rounded-md text-sm bg-indigo-600 text-white';
const tabOff = 'px-3 py-1.5 rounded-md text-sm text-stone-700 bg-white border border-stone-200 hover:bg-stone-50';
const bulkBtn = 'text-sm px-3 py-1.5 rounded-md border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40';

export default function IndexTracker({ rows, gscProperty, sitemapUrl }: { rows: TrackedUrl[]; gscProperty: string; sitemapUrl: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>('new');
  const [kind, setKind] = useState<'all' | UrlKind>('all');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');
  const [pending, start] = useTransition();

  const counts = useMemo(() => {
    const c = { new: 0, submitted: 0, indexed: 0, all: rows.length } as Record<StatusFilter, number>;
    rows.forEach((r) => { c[r.status] += 1; });
    return c;
  }, [rows]);

  const shown = useMemo(() => rows.filter((r) => (status === 'all' || r.status === status) && (kind === 'all' || r.kind === kind)), [rows, status, kind]);
  const kinds = useMemo(() => Array.from(new Set(rows.map((r) => r.kind))), [rows]);

  function flash(t: string) { setToast(t); setTimeout(() => setToast(''), 2500); }

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); flash('✓ הועתק'); }
    catch { window.prompt('העתק ידנית:', text); }
  }

  function check(url: string) {
    setSel((p) => { const n = new Set(p); if (n.has(url)) n.delete(url); else n.add(url); return n; });
  }

  function allShown() {
    setSel((p) => (p.size === shown.length ? new Set() : new Set(shown.map((r) => r.url))));
  }

  function act(urls: string[], action: IndexAction) {
    start(async () => {
      const r = await setIndexStatus(urls, action);
      if (!r.ok) { flash('שגיאה: ' + r.error); return; }
      setSel(new Set());
      flash(action === 'submitted' ? '✓ סומן כנשלח' : action === 'indexed' ? '✓ סומן כמאונדקס' : '✓ אופס');
      router.refresh();
    });
  }

  function bing(urls: string[]) {
    start(async () => {
      const r = await sendToBing(urls);
      flash(r.ok ? '✓ נשלחו ' + urls.length + ' לבינג (IndexNow ' + r.status + ')' : 'שגיאה: ' + r.error);
      if (r.ok) { setSel(new Set()); router.refresh(); }
    });
  }

  const selected = Array.from(sel);
  const target = selected.length ? selected : shown.map((r) => r.url);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {S_TABS.map((t) => (
          <button key={t.id} type="button" className={status === t.id ? tabOn : tabOff} onClick={() => { setStatus(t.id); setSel(new Set()); }}>{t.label} ({counts[t.id]})</button>
        ))}
        <select className="text-sm border border-stone-300 rounded-md px-2 py-1.5 bg-white" value={kind} onChange={(e) => setKind(e.target.value as 'all' | UrlKind)}>
          <option value="all">כל הסוגים</option>
          {kinds.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-stone-50 border border-stone-200 rounded-md p-2">
        <button type="button" className={bulkBtn} onClick={allShown} disabled={!shown.length}>{sel.size === shown.length && shown.length ? '☐ נקה בחירה' : '☑ בחר הכל'}</button>
        <button type="button" className={bulkBtn} onClick={() => copy(target.join('\n'))} disabled={!target.length}>📋 העתק {selected.length ? selected.length + ' נבחרים' : 'את כל ' + shown.length}</button>
        <button type="button" className={bulkBtn} onClick={() => act(target, 'submitted')} disabled={!target.length || pending}>📨 סמן נשלח</button>
        <button type="button" className={bulkBtn} onClick={() => act(target, 'indexed')} disabled={!target.length || pending}>✅ סמן מאונדקס</button>
        <button type="button" className={bulkBtn + ' border-teal-600 text-teal-800'} onClick={() => bing(target)} disabled={!target.length || pending}>🅱️ שלח {selected.length ? selected.length + ' נבחרים' : 'הכל'} לבינג</button>
        <button type="button" className={bulkBtn} onClick={() => copy(sitemapUrl)}>🗺️ העתק כתובת sitemap</button>
        {toast && <span className="text-sm font-semibold text-emerald-700">{toast}</span>}
      </div>

      <div className="bg-white border border-stone-200 rounded-md">
        {shown.length ? shown.map((r) => (
          <IndexRow key={r.url} row={r} gscProperty={gscProperty} checked={sel.has(r.url)} busy={pending} onCheck={check} onCopy={copy} onStatus={act} onBing={bing} />
        )) : <div className="p-8 text-center text-stone-500 text-sm">אין כתובות בסינון הזה.</div>}
      </div>
    </div>
  );
}
