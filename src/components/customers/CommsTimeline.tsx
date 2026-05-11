// src/components/customers/CommsTimeline.tsx
// Phase 16 — Communications timeline for a customer.
// Phase 19 — Now renders photos/videos inline using media_analysis data
//             joined by fetchCustomerPage. Adds Hebrew labels for photo/mp4/sketch.
// Client component (per-item expand/collapse state).

'use client';

import { useState } from 'react';
import type { CommunicationRow } from '@/lib/customers/types';

import type { CommFilterValue } from './CommsFilterTabs';

interface Props {
  comms: CommunicationRow[];
  filter?: CommFilterValue;
}

const COMM_TYPE_LABEL_HE: Record<string, string> = {
  call:     'שיחת טלפון',
  email:    'מייל',
  whatsapp: 'וואטסאפ',
  meeting:  'פגישה',
  sms:      'SMS',
  photo:    'תמונה',
  mp4:      'סרטון',
  sketch:   'שרטוט',
  other:    'אחר',
};

const COMM_TYPE_COLOR: Record<string, string> = {
  call:     'bg-amber-100 text-amber-800',
  email:    'bg-blue-100 text-blue-800',
  whatsapp: 'bg-green-100 text-green-800',
  meeting:  'bg-indigo-100 text-indigo-800',
  photo:    'bg-pink-100 text-pink-800',
  mp4:      'bg-purple-100 text-purple-800',
  sketch:   'bg-teal-100 text-teal-800',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('he-IL');
  const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

function formatDuration(seconds: number | null): string | null {
  if (seconds == null || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')} דקות`;
}

export function CommsTimeline({ comms, filter }: Props) {
  // Apply filter: photos and sketches both show under 'photo' tab
  const filtered = !filter || filter === 'all'
    ? comms
    : filter === 'photo'
      ? comms.filter(c => c.comm_type === 'photo' || c.comm_type === 'sketch')
      : comms.filter(c => c.comm_type === filter);

  if (filtered.length === 0) {
    return (
      <section className="bg-white border border-stone-200 rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-bold text-stone-900 mb-2">תקשורת</h2>
        <p className="text-sm text-stone-500">אין רישומי תקשורת ללקוח זה.</p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-stone-200 rounded-lg p-6 mb-6 shadow-sm">
      <h2 className="text-lg font-bold text-stone-900 mb-4">
        תקשורת ({filtered.length})
      </h2>
      <ol className="space-y-3">
        {filtered.map((c) => (
          <CommItem key={c.id} comm={c} />
        ))}
      </ol>
    </section>
  );
}

function CommItem({ comm }: { comm: CommunicationRow }) {
  const [expanded, setExpanded] = useState(false);
  const typeLabel = COMM_TYPE_LABEL_HE[comm.comm_type] ?? comm.comm_type;
  const typeClass = COMM_TYPE_COLOR[comm.comm_type] ?? 'bg-stone-100 text-stone-700';
  const duration = formatDuration(comm.duration_seconds);
  const media = comm.media_analysis ?? null;

  const transcriptLen = comm.transcript?.length ?? 0;
  const bodyLen = comm.body?.length ?? 0;
  const transcriptSnippet = comm.transcript?.slice(0, 200);
  const bodySnippet = comm.body?.slice(0, 200);
  const hasMore = transcriptLen > 200 || bodyLen > 200 || comm.ai_analysis != null || (media?.ai_full_report != null);

  // Decide which media element (if any) to render
  const isImage = comm.comm_type === 'photo' || comm.comm_type === 'sketch';
  const isVideo = comm.comm_type === 'mp4';
  const isAudio = comm.comm_type === 'call' && !!comm.audio_url;

  return (
    <li className="border border-stone-200 rounded-lg p-4 hover:border-stone-300 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeClass}`}>
            {typeLabel}
          </span>
          <span className="text-xs text-stone-500">{formatDateTime(comm.occurred_at)}</span>
          {duration ? <span className="text-xs text-stone-500">· {duration}</span> : null}
          {media?.source_filename ? (
            <span className="text-xs text-stone-500" dir="ltr">· {media.source_filename}</span>
          ) : null}
        </div>
        <code className="text-[10px] text-stone-400" dir="ltr">
          {comm.id.slice(0, 8)}
        </code>
      </div>

      {comm.subject ? (
        <p className="text-sm font-medium text-stone-800 mb-1">{comm.subject}</p>
      ) : null}

      {/* Image preview (photo/sketch) — always visible, click to expand below */}
      {isImage && media?.cloudinary_url ? (
        <div className="my-3">
          <a href={media.cloudinary_url} target="_blank" rel="noopener noreferrer" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media.thumbnail_url || media.cloudinary_url}
              alt={media.source_filename || 'תמונה'}
              className="rounded-md max-h-64 w-auto border border-stone-200 hover:border-stone-400 transition-colors"
              loading="lazy"
            />
          </a>
        </div>
      ) : null}

      {/* Video preview (mp4) */}
      {isVideo && media?.cloudinary_url ? (
        <div className="my-3">
          <video
            controls
            preload="none"
            className="rounded-md max-h-64 w-auto border border-stone-200"
            poster={media.thumbnail_url || undefined}
          >
            <source src={media.cloudinary_url} />
          </video>
        </div>
      ) : null}

      {/* AI-extracted metadata badges (when we have analysis) */}
      {media && (media.extracted_stone_type || media.extracted_dimensions || media.extracted_shape) ? (
        <div className="flex flex-wrap gap-2 my-2">
          {media.extracted_stone_type ? (
            <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md border border-stone-200">
              🪨 {media.extracted_stone_type}
            </span>
          ) : null}
          {media.extracted_shape ? (
            <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md border border-stone-200">
              📐 {media.extracted_shape}
            </span>
          ) : null}
          {media.extracted_dimensions ? (
            <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md border border-stone-200">
              📏 {media.extracted_dimensions}
            </span>
          ) : null}
        </div>
      ) : null}

      {transcriptSnippet ? (
        <p className="text-sm text-stone-700 leading-relaxed">
          {expanded ? comm.transcript : transcriptSnippet}
          {!expanded && transcriptLen > 200 ? '…' : ''}
        </p>
      ) : bodySnippet ? (
        <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
          {expanded ? comm.body : bodySnippet}
          {!expanded && bodyLen > 200 ? '…' : ''}
        </p>
      ) : !isImage && !isVideo ? (
        <p className="text-sm text-stone-400 italic">אין תמלול או תוכן</p>
      ) : null}

      {/* Audio player for calls */}
      {isAudio ? (
        <audio controls className="mt-3 w-full" preload="none">
          <source src={comm.audio_url!} />
        </audio>
      ) : null}

      {/* Expanded analysis: comm.ai_analysis OR media.ai_full_report */}
      {expanded && (comm.ai_analysis || media?.ai_full_report) ? (
        <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded text-xs text-stone-700">
          <div className="font-medium text-stone-800 mb-2">ניתוח אוטומטי</div>
          <pre className="whitespace-pre-wrap font-sans" dir="auto">
            {JSON.stringify(media?.ai_full_report || comm.ai_analysis, null, 2)}
          </pre>
        </div>
      ) : null}

      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          {expanded ? 'סגור' : 'פתח ניתוח מלא'}
        </button>
      ) : null}
    </li>
  );
}
