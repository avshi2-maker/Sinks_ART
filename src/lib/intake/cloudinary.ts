/**
 * cloudinary.ts
 *
 * Browser-side Cloudinary upload + URL transform helpers for Phase 15.
 * Pure logic — no React, no DB, no UI.
 *
 * Two operations:
 *   1. uploadToCloudinary(file)           — sends a File to Cloudinary's unsigned upload endpoint
 *   2. getVideoFrameUrl(videoUrl, sec?)   — pure URL transform: returns a JPEG of frame at given second
 *      getPdfPreviewUrl(pdfUrl)           — pure URL transform: returns a JPEG of page 1 of a PDF
 *      getResizedImageUrl(imageUrl, w, h) — pure URL transform: returns a resized image
 *
 * Phase 15 — Multi-Format Media Intake
 * Created: 03/05/2026
 * Updated: 06/05/2026 (Session 17: getVideoFrameUrl now accepts secondMark for Mp4Analyzer time picker)
 */

const CLOUD_NAME      = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME      || '';
const PRESET_INTAKE   = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_INTAKE   || '';

export interface CloudinaryUploadResult {
  url:           string;
  publicId:      string;
  resourceType:  'image' | 'video' | 'raw' | 'auto';
  format:        string;
  bytes:         number;
  width?:        number;
  height?:       number;
  duration?:     number;
}

export async function uploadToCloudinary(file: File, folder?: string): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME)    throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set in .env.local');
  if (!PRESET_INTAKE) throw new Error('NEXT_PUBLIC_CLOUDINARY_PRESET_INTAKE is not set in .env.local');

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', PRESET_INTAKE);
  if (folder) form.append('folder', folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  const res = await fetch(endpoint, {
    method: 'POST',
    body:   form,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Cloudinary upload failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    url:          data.secure_url,
    publicId:     data.public_id,
    resourceType: data.resource_type,
    format:       data.format,
    bytes:        data.bytes,
    width:        data.width,
    height:       data.height,
    duration:     data.duration,
  };
}

/**
 * Build a JPEG-frame URL from a Cloudinary video URL.
 * Inserts `/upload/so_<sec>,w_1200,f_jpg/` and changes the extension to `.jpg`.
 *
 *   so_1   → "start offset 1 second"   (default; avoids black opening frames)
 *   so_75  → "start offset 75 seconds" (1:15 into the video)
 *
 * @param videoUrl   The Cloudinary video URL
 * @param secondMark Integer seconds (default 1). Negatives + non-integers fall back to 1.
 *                   Cloudinary clamps automatically if secondMark > video duration.
 */
export function getVideoFrameUrl(videoUrl: string, secondMark = 1): string {
  if (!videoUrl.includes('/upload/')) return videoUrl;

  const sec = Number.isFinite(secondMark) && secondMark >= 0
    ? Math.floor(secondMark)
    : 1;

  return videoUrl
    .replace('/upload/', `/upload/so_${sec},w_1200,f_jpg/`)
    .replace(/\.(mp4|mov|webm|avi|m4v|mkv|3gp)(\?.*)?$/i, '.jpg$2');
}

export function getPdfPreviewUrl(pdfUrl: string): string {
  if (!pdfUrl.includes('/upload/')) return pdfUrl;

  return pdfUrl
    .replace('/upload/', '/upload/pg_1,w_1200,f_jpg/')
    .replace(/\.pdf(\?.*)?$/i, '.jpg$1');
}

export function getResizedImageUrl(
  imageUrl: string,
  width    = 400,
  height   = 400
): string {
  if (!imageUrl.includes('/upload/')) return imageUrl;

  return imageUrl.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && PRESET_INTAKE);
}

export const CLOUDINARY_CONFIG = {
  cloudName: CLOUD_NAME,
  preset:    PRESET_INTAKE,
};
