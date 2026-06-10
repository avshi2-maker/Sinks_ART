/**
 * src/components/sinc/AudioFilePicker.tsx
 *
 * Audio file picker for /sinc page.
 * Drag-drop + click-to-browse. Hebrew RTL. Validates type and size.
 * Shows duration BEFORE upload (lets us estimate ElevenLabs cost).
 *
 * Phase B/C — Audio pipeline (Session 17, 06/05/2026)
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import {
  getAudioDurationLocal,
  formatAudioSize,
  formatAudioDuration,
} from '@/lib/sinc/cloudinaryAudio';
import { calcElevenLabsCost, formatUsd } from '@/lib/sinc/apiMeter';

interface Props {
  onFileSelected: (file: File, durationSec: number) => void;
  disabled?:      boolean;
}

const ACCEPTED_TYPES = '.mp3,.m4a,.wav,.ogg,.aac,.flac,.mp4,.mov,.m4v,audio/*,video/mp4';
const MAX_BYTES      = 100 * 1024 * 1024;   // 100 MB

interface PickedFile {
  file:        File;
  durationSec: number;
}

export default function AudioFilePicker({ onFileSelected, disabled }: Props) {
  const [picked, setPicked]       = useState<PickedFile | null>(null);
  const [isDragging, setDragging] = useState(false);
  const [error, setError]         = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback(async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/') &&
        !/\.(mp3|m4a|wav|ogg|aac|flac|mp4|mov|m4v)$/i.test(file.name)) {
      return 'הקובץ אינו קובץ אודיו (mp3 / m4a / wav / ogg / aac / flac)';
    }
    if (file.size > MAX_BYTES) {
      return `הקובץ גדול מדי (${formatAudioSize(file.size)}). מקסימום 100 מ״ב.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError('');

    const validationErr = await validate(file);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    let durationSec = 0;
    try {
      durationSec = await getAudioDurationLocal(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בקריאת משך האודיו');
      return;
    }

    const result: PickedFile = { file, durationSec };
    setPicked(result);
    onFileSelected(file, durationSec);
  }, [validate, onFileSelected]);

  function handleClickBrowse() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';   // allow re-picking the same file
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (disabled) return;
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function handleClear() {
    setPicked(null);
    setError('');
  }

  // ── Render ──

  const dropzoneClass =
    'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ' +
    (isDragging
      ? 'border-blue-400 bg-blue-50'
      : 'border-gray-300 bg-gray-50 hover:bg-gray-100') +
    (disabled ? ' opacity-50 cursor-not-allowed' : '');

  return (
    <div className="audio-file-picker space-y-3" dir="rtl">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {!picked && (
        <div
          className={dropzoneClass}
          onClick={handleClickBrowse}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-3xl mb-2">🎙️</div>
          <div className="text-sm font-medium text-gray-900 mb-1">
            גרור הקלטה לכאן או לחץ לבחירת קובץ
          </div>
          <div className="text-xs text-gray-500">
            mp3 / m4a / wav / ogg / aac / flac · עד 100 מ״ב
          </div>
        </div>
      )}

      {picked && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                🎙️ {picked.file.name}
              </div>
              <div className="text-xs text-gray-500 mt-1 space-x-2 space-x-reverse" style={{ direction: 'rtl' }}>
                <span>{formatAudioSize(picked.file.size)}</span>
                <span>· משך: {formatAudioDuration(picked.durationSec)}</span>
                <span>· עלות תמלול משוערת: {formatUsd(calcElevenLabsCost(picked.durationSec))}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
              title="הסר ובחר קובץ אחר"
            >
              ❌ הסר
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
