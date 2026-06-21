'use client';

// src/components/sites/SiteProjects.tsx
// Phase 35e — projects roll-up with LIVE linking.
// Lists projects attached to this site (detach each) + a searchable picker to attach an
// existing unlinked project. Wires the previously-unused attachProjectToSite/detach backend.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { attachProjectToSite, detachProjectFromSite } from '@/lib/sites/siteMutations';
import type { SiteProject, LinkableProject } from '@/lib/sites/sitesData';
import EntityPicker, { PickerItem } from '@/components/shared/EntityPicker';

function ils(n: number | null): string { return '₪' + (Math.round(n || 0)).toLocaleString('he-IL'); }

export default function SiteProjects({ siteId, linked, candidates }: { siteId: string; linked: SiteProject[]; candidates: LinkableProject[] }) {
  const router = useRouter();
  const [linking, setLinking] = useState(false);
  const [busy, setBusy] = useState(false);

  const items: PickerItem[] = candidates
    .filter((p) => p.site_id !== siteId)
    .map((p) => {
      const onOtherSite = !!p.site_id && p.site_id !== siteId;
      return {
        id: p.id,
        label: p.title_he,
        sublabel: p.customer_name,
        badge: ils(p.quoted_price_ils),
        disabled: onOtherSite,
        disabledNote: onOtherSite ? 'כבר מקושר לאתר אחר' : null,
      };
    });

  async function link(projectId: string) {
    setBusy(true);
    const res = await attachProjectToSite(projectId, siteId);
    setBusy(false);
    if (!res.ok) { window.alert('קישור נכשל: ' + (res.error || '')); return; }
    setLinking(false);
    router.refresh();
  }

  async function unlink(projectId: string) {
    if (!window.confirm('להסיר את הפרויקט מהאתר? (הפרויקט עצמו לא נמחק)')) return;
    setBusy(true);
    const res = await detachProjectFromSite(projectId, siteId);
    setBusy(false);
    if (!res.ok) { window.alert('הסרה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }

  return (
    <section className="mb-6" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-stone-700">פרויקטים באתר ({linked.length})</h2>
        <button onClick={() => setLinking(!linking)} disabled={busy} className="text-xs text-blue-600 hover:underline">{linking ? 'ביטול' : '🔗 קשר פרויקט קיים'}</button>
      </div>

      {linking && (
        <div className="mb-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs text-stone-500 mb-1">בחר פרויקט קיים לקישור לאתר זה</div>
          <EntityPicker items={items} placeholder="חיפוש לפי שם פרויקט או לקוח..." emptyText="אין פרויקטים זמינים לקישור" onPick={(it) => link(it.id)} autoFocus />
        </div>
      )}

      {linked.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-4 text-center text-sm text-stone-500">אין פרויקטים מקושרים עדיין.</div>
      ) : (
        <div className="space-y-1.5">
          {linked.map((p) => (
            <div key={p.id} className="bg-white border border-stone-200 rounded-lg p-3 flex items-center justify-between gap-2">
              <span className="text-sm text-stone-800 min-w-0 truncate">{p.title_he}</span>
              <span className="flex items-center gap-3 whitespace-nowrap">
                <span className="text-xs text-stone-500">{p.status} · {ils(p.quoted_price_ils)}</span>
                <button onClick={() => unlink(p.id)} disabled={busy} title="הסר מהאתר" className="text-stone-300 hover:text-red-600 text-sm">🗑️</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
