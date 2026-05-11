'use client';

// src/components/customers/AddNoteInlineForm.tsx
// Phase 19 Stage B step 4 - Inline expand form for adding a note to a customer.
// Click "+ הוסף הערה" → form expands → type Hebrew → save → server action runs
// → revalidatePath refreshes the customer page so the note appears in the timeline.

import { useState, useTransition } from 'react';
import { createNoteComm } from '@/lib/customers/commMutations';

interface ProjectOption {
  id:       string;
  title_he: string;
}

interface Props {
  customerId: string;
  projects:   ProjectOption[];
}

export default function AddNoteInlineForm({ customerId, projects }: Props) {
  const [open, setOpen]             = useState(false);
  const [text, setText]             = useState('');
  const [projectId, setProjectId]   = useState<string>('');
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setText('');
    setProjectId('');
    setErrorMsg(null);
  }

  function handleSubmit() {
    if (!text.trim()) {
      setErrorMsg('תוכן ההערה חובה');
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const res = await createNoteComm({
        customerId,
        projectId: projectId || null,
        text:      text.trim(),
      });
      if (!res.ok) {
        setErrorMsg(res.error || 'שגיאה בשמירה');
        return;
      }
      reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-sm text-blue-600 hover:bg-blue-50 py-2 mb-4 rounded-md border border-dashed border-stone-300 hover:border-blue-300 transition-colors"
      >
        + הוסף הערה
      </button>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="תוכן ההערה..."
        rows={3}
        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400 bg-white resize-y"
        dir="rtl"
        autoFocus
        disabled={isPending}
      />
      {projects.length > 0 && (
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-blue-400 bg-white"
          dir="rtl"
          disabled={isPending}
        >
          <option value="">— ללא קישור לפרויקט —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title_he}</option>
          ))}
        </select>
      )}
      {errorMsg && (
        <div className="text-xs text-red-600">{errorMsg}</div>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => { reset(); setOpen(false); }}
          disabled={isPending}
          className="text-sm px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded-md"
        >
          ביטול
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'שומר...' : 'שמור'}
        </button>
      </div>
    </div>
  );
}
