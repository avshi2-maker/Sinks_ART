'use client';

// src/components/dashboard/ArchiveButton.tsx
// Small reversible "hide" control for a dashboard row (project or comm).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { archiveProject, archiveComm } from '@/lib/dashboard/archiveActions';

export default function ArchiveButton({ kind, id, label }: { kind: 'project' | 'comm'; id: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const what = kind === 'project' ? 'פרויקט זה' : 'רשומת תקשורת זו';
    if (!window.confirm('להסתיר ' + what + ' מהלוח? (ניתן לשחזר)')) return;
    setBusy(true);
    const res = kind === 'project' ? await archiveProject(id) : await archiveComm(id);
    setBusy(false);
    if (!res.ok) { window.alert('ההסתרה נכשלה: ' + (res.error || '')); return; }
    router.refresh();
  }

  return (
    <button onClick={go} disabled={busy} title="הסתר מהלוח" className="text-stone-300 hover:text-red-600 text-xs disabled:opacity-40">{busy ? '…' : (label || '✕')}</button>
  );
}
