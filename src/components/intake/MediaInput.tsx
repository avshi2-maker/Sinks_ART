/**
 * MediaInput.tsx
 *
 * The single point where users feed media into the intake page.
 * Two modes:
 *   - "file"  → click-to-browse for an image/sketch/video/PDF
 *   - "url"   → paste a YouTube/Instagram/web URL
 *
 * Reports the chosen input + detected media type up to the parent
 * via onChange. Parent decides which analyzer to render next.
 *
 * Phase 15 — Multi-Format Media Intake
 * Created: 04/05/2026
 */

'use client';

import { useState } from 'react';
import {
  detectMediaTypeFromFile,
  detectMediaTypeFromUrl,
  MediaType,
  MEDIA_TYPE_LABEL_HE,
  MEDIA_TYPE_ICON,
} from '@/lib/intake/detectMediaType';

/** Max upload size in bytes — 50 MB. Cloudinary free tier accepts up to 100 MB. */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = '50 מ״ב';

/** Shape passed to parent when input becomes valid. */
export interface MediaSelection {
  mode:       'file' | 'url';
  mediaType:  MediaType;
  file?:      File;     // present when mode = 'file'
  url?:       string;   // present when mode = 'url'
}

interface Props {
  onChange: (selection: MediaSelection | null) => void;
  /** Disable interaction (e.g., while parent is uploading/analyzing). */
  disabled?: boolean;
}

type Mode = 'file' | 'url';

export default function MediaInput({ onChange, disabled }: Props) {
  const [mode, setMode] = useState<Mode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  // ── File mode handlers ──────────────────────────────────────────
  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    setError('');
    const picked = e.target.files?.[0];
    if (!picked) {
      setFile(null);
      onChange(null);
      return;
    }

    if (picked.size > MAX_FILE_SIZE_BYTES) {
      const mb = (picked.size / (1024 * 1024)).toFixed(1);
      setError('הקובץ גדול מדי (' + mb + ' מ״ב). הגודל המרבי: ' + MAX_FILE_SIZE_LABEL);
      setFile(null);
      onChange(null);
      // Clear the input so the user can re-pick the same file after fixing
      e.target.value = '';
      return;
    }

    setFile(picked);
    const detected = detectMediaTypeFromFile(picked);
    onChange({ mode: 'file', mediaType: detected, file: picked });
  }

  function clearFile() {
    setFile(null);
    setError('');
    onChange(null);
  }

  // ── URL mode handlers ───────────────────────────────────────────
  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setUrl(next);
    setError('');

    const trimmed = next.trim();
    if (!trimmed) {
      onChange(null);
      return;
    }

    // Light URL validation — must start with http or https
    if (!/^https?:\/\//i.test(trimmed)) {
      setError('כתובת חייבת להתחיל ב-http:// או https://');
      onChange(null);
      return;
    }

    const detected = detectMediaTypeFromUrl(trimmed);
    onChange({ mode: 'url', mediaType: detected, url: trimmed });
  }

  // ── Mode switch ─────────────────────────────────────────────────
  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setFile(null);
    setUrl('');
    onChange(null);
  }

  // ── Detected-type preview (only shown when there's a valid selection) ──
  const detectedType: MediaType | null =
    mode === 'file' && file
      ? detectMediaTypeFromFile(file)
      : mode === 'url' && url.trim() && /^https?:\/\//i.test(url.trim())
      ? detectMediaTypeFromUrl(url.trim())
      : null;

  return (
    <div className="media-input space-y-3" dir="rtl">
      {/* Mode tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => switchMode('file')}
          disabled={disabled}
          className={
            'px-4 py-2 text-sm rounded-t-md transition-colors ' +
            (mode === 'file'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
          }
        >
          📁 העלאת קובץ
        </button>
        <button
          type="button"
          onClick={() => switchMode('url')}
          disabled={disabled}
          className={
            'px-4 py-2 text-sm rounded-t-md transition-colors ' +
            (mode === 'url'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
          }
        >
          🔗 הדבקת קישור
        </button>
      </div>

      {/* File mode */}
      {mode === 'file' && (
        <div>
          <label
            htmlFor="media-file-input"
            className={
              'block w-full border-2 border-dashed rounded-md px-4 py-6 text-center cursor-pointer transition-colors ' +
              (disabled
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100')
            }
          >
            {file ? (
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {file.name}
                </div>
                <div className="text-xs text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} מ״ב
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm text-gray-700 mb-1">
                  לחצי כאן לבחירת קובץ
                </div>
                <div className="text-xs text-gray-500">
                  תמונה / סרטון / PDF — עד {MAX_FILE_SIZE_LABEL}
                </div>
              </div>
            )}
          </label>
          <input
            id="media-file-input"
            type="file"
            accept="image/*,video/*,application/pdf"
            onChange={handleFilePick}
            disabled={disabled}
            className="hidden"
          />
          {file && (
            <button
              type="button"
              onClick={clearFile}
              disabled={disabled}
              className="mt-2 text-xs text-red-600 hover:text-red-700"
            >
              ✕ הסר קובץ
            </button>
          )}
        </div>
      )}

      {/* URL mode */}
      {mode === 'url' && (
        <div>
          <input
            type="url"
            value={url}
            onChange={handleUrlChange}
            disabled={disabled}
            placeholder="https://youtu.be/... או https://instagram.com/..."
            dir="ltr"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          ⚠️ {error}
        </div>
      )}

      {/* Detected-type badge */}
      {detectedType && !error && (
        <div className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
          זוהה: {MEDIA_TYPE_ICON[detectedType]} {MEDIA_TYPE_LABEL_HE[detectedType]}
        </div>
      )}
    </div>
  );
}
