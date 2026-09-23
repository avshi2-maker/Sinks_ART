'use client';
// src/components/case/AddPhotos.tsx · updated 23.09.2026 13:07 (Asia/Jerusalem)
// 📷 Add photos to a case file after the job is finished (e.g. photos Ales sent on WhatsApp).
// Uploads with the CRM's existing intake preset → appended to case_studies.after_media (CRM copy only).

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadToCloudinary } from '@/lib/intake/cloudinary';
import { addCaseMedia } from '@/lib/case/caseMutations';

const btn = 'text-sm px-3 py-2 rounded-md border border-sky-600 text-sky-700 bg-white hover:bg-sky-50 disabled:opacity-50';

export default function AddPhotos({ id }: { id: string }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function pick(list: FileList | null) {
    const files = Array.from(list || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    setBusy(true);
    const added: { url: string; type: string; public_id: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      setMsg('מעלה ' + (i + 1) + '/' + files.length + '…');
      try {
        const r = await uploadToCloudinary(files[i], 'ales-jobs/case-extra');
        added.push({ url: r.url, type: 'image', public_id: r.publicId });
      } catch (e) {
        setMsg('⚠️ ' + (e as Error).message);
      }
    }
    if (added.length) {
      const r = await addCaseMedia(id, added);
      setMsg(r.ok ? '✓ נוספו ' + added.length + ' תמונות · עכשיו לחץ ✨ צור מחדש כדי שיקבלו ALT' : '⚠️ ' + r.error);
      router.refresh();
    }
    setBusy(false);
    if (ref.current) ref.current.value = '';
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={btn} disabled={busy} onClick={() => ref.current?.click()}>{busy ? 'מעלה…' : '📷 הוסף תמונות'}</button>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
      {msg && <span className="text-xs text-stone-600">{msg}</span>}
    </div>
  );
}
