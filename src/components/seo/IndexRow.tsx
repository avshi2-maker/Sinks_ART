'use client';
// src/components/seo/IndexRow.tsx · updated 23.09.2026 07:57 (Asia/Jerusalem)
// One URL row: path, kind, dates, copy / Search Console / Google check / status buttons.

import type { TrackedUrl } from '@/lib/seo/indexTypes';
import { KIND_LABEL } from '@/lib/seo/indexTypes';

const TZ = 'Asia/Jerusalem';
function d(iso: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('he-IL', { timeZone: TZ, day: '2-digit', month: '2-digit', year: '2-digit' }); } catch { return '—'; }
}

const STATUS_CLS: Record<string, string> = {
  new: 'bg-amber-100 text-amber-800',
  submitted: 'bg-sky-100 text-sky-800',
  indexed: 'bg-emerald-100 text-emerald-800',
};
const STATUS_TXT: Record<string, string> = { new: '🆕 חדש', submitted: '📨 נשלח לגוגל', indexed: '✅ מאונדקס' };

const btn = 'text-xs px-2 py-1 rounded border border-stone-300 bg-white hover:bg-stone-50 no-underline text-stone-700 whitespace-nowrap';
const btnGo = 'text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 whitespace-nowrap';
const btnSky = 'text-xs px-2 py-1 rounded bg-sky-600 text-white hover:bg-sky-700 whitespace-nowrap';

interface Props {
  row: TrackedUrl;
  gscProperty: string;
  checked: boolean;
  busy: boolean;
  onCheck: (url: string) => void;
  onCopy: (text: string) => void;
  onStatus: (urls: string[], action: 'submitted' | 'indexed' | 'reset') => void;
}

export default function IndexRow({ row, gscProperty, checked, busy, onCheck, onCopy, onStatus }: Props) {
  const gsc = 'https://search.google.com/search-console/inspect?resource_id=' + encodeURIComponent(gscProperty) + '&id=' + encodeURIComponent(row.url);
  const siteCheck = 'https://www.google.com/search?q=' + encodeURIComponent('site:' + row.url);
  const rowCls = 'flex flex-col gap-2 p-3 border-b border-stone-200 ' + (row.inSitemap ? '' : 'opacity-50');
  return (
    <div className={rowCls}>
      <div className="flex items-start gap-2">
        <input type="checkbox" className="mt-1" checked={checked} onChange={() => onCheck(row.url)} aria-label="בחר" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={'text-[11px] font-semibold px-2 py-0.5 rounded ' + STATUS_CLS[row.status]}>{STATUS_TXT[row.status]}</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-600">{KIND_LABEL[row.kind]}</span>
            {!row.inSitemap && <span className="text-[11px] px-2 py-0.5 rounded bg-red-100 text-red-700">הוסר מה-sitemap</span>}
          </div>
          <div className="font-mono text-[13px] text-stone-900 break-all mt-1" dir="ltr">{row.path}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">נראה לראשונה {d(row.first_seen)} · נשלח {d(row.submitted_at)} · אונדקס {d(row.indexed_at)}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 ps-6">
        <button type="button" className={btn} onClick={() => onCopy(row.url)}>📋 העתק</button>
        <a className={btn} href={gsc} target="_blank" rel="noreferrer">🔍 Search Console</a>
        <a className={btn} href={siteCheck} target="_blank" rel="noreferrer">🌐 בדוק בגוגל</a>
        {row.status === 'new' && <button type="button" className={btnSky} disabled={busy} onClick={() => onStatus([row.url], 'submitted')}>📨 סמן נשלח</button>}
        {row.status !== 'indexed' && <button type="button" className={btnGo} disabled={busy} onClick={() => onStatus([row.url], 'indexed')}>✅ סמן מאונדקס</button>}
        {row.status !== 'new' && <button type="button" className={btn} disabled={busy} onClick={() => onStatus([row.url], 'reset')}>↺ אפס</button>}
      </div>
    </div>
  );
}
