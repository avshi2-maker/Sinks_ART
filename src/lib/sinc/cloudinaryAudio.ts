/**
 * src/lib/sinc/cloudinaryAudio.ts
 *
 * Audio file upload helper for SinC-ART.
 * Uses the existing `marble_calls` Cloudinary preset (folder: marble-sinks/calls).
 * Browser-side: file goes directly from user's device to Cloudinary,
 * never through our Vercel server (saves bandwidth + faster).
 *
 * Phase B/C — Audio pipeline (Session 17, 06/05/2026)
 */

import type { CloudinaryAudioUploadResult } from './types';

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME    || '';
const PRESET_CALLS  = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_CALLS  || '';

/**
 * Upload an audio file (mp3/m4a/wav/ogg) to Cloudinary.
 * Returns the secure_url + duration so we can compute ElevenLabs cost
 * before transcribing.
 */
export async function uploadAudioToCloudinary(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<CloudinaryAudioUploadResult> {
  if (!CLOUD_NAME)   throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set');
  if (!PRESET_CALLS) throw new Error('NEXT_PUBLIC_CLOUDINARY_PRESET_CALLS is not set');

  // Use auto/upload — Cloudinary detects audio vs video automatically.
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  // Use XMLHttpRequest (not fetch) so we can track upload progress.
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', PRESET_CALLS);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            url:         data.secure_url,
            publicId:    data.public_id,
            durationSec: data.duration || 0,
            bytes:       data.bytes,
          });
        } catch (e) {
          reject(new Error('Cloudinary returned non-JSON: ' + xhr.responseText.substring(0, 200)));
        }
      } else {
        reject(new Error(`Cloudinary upload failed (${xhr.status}): ${xhr.responseText.substring(0, 200)}`));
      }
    });

    xhr.addEventListener('error',   () => reject(new Error('Cloudinary upload network error')));
    xhr.addEventListener('abort',   () => reject(new Error('Cloudinary upload aborted')));
    xhr.addEventListener('timeout', () => reject(new Error('Cloudinary upload timed out')));

    xhr.open('POST', endpoint);
    xhr.send(form);
  });
}

/**
 * Get audio duration BEFORE upload (lets us show estimated transcription cost).
 * Uses HTML5 audio API — works for mp3/m4a/wav/ogg.
 */
export function getAudioDurationLocal(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url   = URL.createObjectURL(file);
    const audio = document.createElement('audio');

    audio.addEventListener('loadedmetadata', () => {
      const sec = isFinite(audio.duration) ? audio.duration : 0;
      URL.revokeObjectURL(url);
      resolve(sec);
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('לא ניתן לקרוא את משך האודיו (קובץ פגום או לא נתמך)'));
    });

    audio.src = url;
  });
}

/**
 * Format file size for human display.
 */
export function formatAudioSize(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' ק״ב';
  return (bytes / (1024 * 1024)).toFixed(2) + ' מ״ב';
}

/**
 * Format duration for human display.
 */
export function formatAudioDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '?';
  const min = Math.floor(sec / 60);
  const rem = Math.floor(sec % 60);
  if (min === 0) return `${rem} שניות`;
  return `${min}:${rem.toString().padStart(2, '0')} דקות`;
}
