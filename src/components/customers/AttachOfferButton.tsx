'use client';

// src/components/customers/AttachOfferButton.tsx
// One-click offer attach on a project row: pick a PDF/image → Cloudinary → server action.

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadToCloudinary, getPdfPreviewUrl } from '@/lib/intake/cloudinary';
import { attachOfferToProject } from '@/lib/customers/attachOffer';

interface Props {
  customerId: string;
  projectId: string;
}

export default function AttachOfferButton({ customerId, projectId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setMsg('');
    try {
      const up = await uploadToCloudinary(file);
      const isPdf = /pdf$/i.test(up.format || '') || /\.pdf$/i.test(file.name);
      const thumb = isPdf ? getPdfPreviewUrl(up.url) : up.url;
      const res = await attachOfferToProject({
        customerId,
        projectId,
        url: up.url,
        filename: file.name,
        isPdf,
        thumbnailUrl: thumb,
      });
      if (!res.ok) {
        setMsg('שגיאה: ' + (res.error || ''));
      } else {
        setMsg('✓ צורף');
        router.refresh();
      }
    } catch (err) {
      setMsg('שגיאה: ' + (err instanceof Error ? err.message : 'העלאה נכשלה'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input ref={inputRef} type="file" accept=".pdf,image/*" onChange={onFile} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title="צרף קובץ הצעת מחיר לפרויקט"
        className="text-xs px-2.5 py-1 rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-50"
      >
        {busy ? '⏳ מעלה…' : '📎 צרף הצעה'}
      </button>
      {msg ? (
        <span className={'text-[11px] ' + (msg.startsWith('✓') ? 'text-emerald-600' : 'text-red-600')}>{msg}</span>
      ) : null}
    </span>
  );
}
