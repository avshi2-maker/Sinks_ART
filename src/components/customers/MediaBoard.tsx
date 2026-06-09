'use client';

// src/components/customers/MediaBoard.tsx
// Phase 36 — customer media board: attach/detach assets to projects.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { attachMediaToProject, detachMediaFromProject, MediaAsset } from '@/lib/customers/mediaLink';

interface ProjectLite { id: string; title_he: string; }
interface Props { customerId: string; media: MediaAsset[]; projects: ProjectLite[]; }

export default function MediaBoard({ customerId, media, projects }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const projectName = (id: string | null) => id ? (projects.find((p) => p.id === id)?.title_he || 'פרויקט') : null;

  async function attach(mediaId: string, projectId: string) {
    if (!projectId) return;
    setBusyId(mediaId);
    const res = await attachMediaToProject(mediaId, projectId, customerId);
    setBusyId(null);
    if (!res.ok) { window.alert('שיוך נכשל: ' + (res.error || '')); return; }
    router.refresh();
  }
  async function detach(mediaId: string) {
    setBusyId(mediaId);
    const res = await detachMediaFromProject(mediaId, customerId);
    setBusyId(null);
    if (!res.ok) { window.alert('ניתוק נכשל: ' + (res.error || '')); return; }
    router.refresh();
  }

  if (media.length === 0) return null;

  return (
    <section className="bg-white border border-stone-200 rounded-lg p-4 mb-6 shadow-sm" dir="rtl">
      <h2 className="text-sm font-semibold text-stone-700 mb-3">מדיה ({media.length}) — שייך לפרויקט</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {media.map((m) => (
          <div key={m.id} className="border border-stone-200 rounded-lg overflow-hidden">
            {(m.thumbnail_url || m.cloudinary_url) ? (
              <a href={m.cloudinary_url || m.thumbnail_url || '#'} target="_blank" rel="noopener noreferrer" className="block">
                <img src={m.thumbnail_url || m.cloudinary_url || ''} alt={m.source_filename || 'media'} className="w-full h-32 object-cover" />
              </a>
            ) : (
              <div className="w-full h-32 bg-stone-100 flex items-center justify-center text-stone-400 text-xs">אין תצוגה</div>
            )}
            <div className="p-2 space-y-1">
              {m.extracted_stone_type && (<div className="text-xs text-stone-500 truncate">🪨 {m.extracted_stone_type}</div>)}
              {m.extracted_dimensions && (<div className="text-xs text-stone-500 truncate">📏 {m.extracted_dimensions}</div>)}
              {m.project_id ? (
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs text-green-700 truncate">✓ {projectName(m.project_id)}</span>
                  <button onClick={() => detach(m.id)} disabled={busyId === m.id} className="text-xs text-stone-400 hover:text-red-600 shrink-0">נתק</button>
                </div>
              ) : (
                projects.length > 0 ? (
                  <select defaultValue="" onChange={(e) => attach(m.id, e.target.value)} disabled={busyId === m.id} className="w-full px-1 py-1 text-xs border border-stone-300 rounded-md bg-white" dir="rtl">
                    <option value="">— שייך לפרויקט —</option>
                    {projects.map((p) => (<option key={p.id} value={p.id}>{p.title_he}</option>))}
                  </select>
                ) : (
                  <span className="text-xs text-stone-400">אין פרויקטים</span>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
