'use client';
// src/components/case/SyncButton.tsx · updated 23.09.2026 10:35 (Asia/Jerusalem)
// 🔄 pull finished jobs from the Ales app now.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { syncNow } from '@/lib/case/caseMutations';

const btn = 'text-sm px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50';

export default function SyncButton() {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  function go() {
    start(async () => {
      const r = await syncNow();
      setMsg(r.ok ? (r.added ? '✓ נוספו ' + r.added + ' עבודות חדשות' : '✓ אין עבודות חדשות') : '⚠️ ' + r.error);
      router.refresh();
    });
  }
  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-stone-600">{msg}</span>}
      <button type="button" className={btn} disabled={pending} onClick={go}>{pending ? 'מסנכרן…' : '🔄 סנכרן מאלס'}</button>
    </div>
  );
}
