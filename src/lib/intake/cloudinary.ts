/**
 * cloudinary.ts
 *
 * Browser-side Cloudinary upload + URL transform helpers for Phase 15.
 * Pure logic — no React, no DB, no UI.
 *
 * Two operations:
 *   1. uploadToCloudinary(file)           — sends a File to Cloudinary's unsigned upload endpoint
 *   2. getVideoFrameUrl(videoUrl)         — pure URL transform: returns a JPEG of second 1 of a video
 *      getPdfPreviewUrl(pdfUrl)           — pure URL transform: returns a JPEG of page 1 of a PDF
 *      getResizedImageUrl(imageUrl, w, h) — pure URL transform: returns a resized image
 *
 * Phase 15 — Multi-Format Media Intake
 * Created: 03/05/2026
 */

// Read configuration from environment. These must be set in .env.local.
// NEXT_PUBLIC_* values are exposed to the browser (safe for cloud_name + preset names).
const CLOUD_NAME      = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME      || '';
const PRESET_INTAKE   = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_INTAKE   || '';

/** Result returned from a successful Cloudinary upload. */
export interface CloudinaryUploadResult {
  url:           string;   // secure HTTPS URL of the uploaded asset
  publicId:      string;   // Cloudinary's identifier for the asset
  resourceType:  'image' | 'video' | 'raw' | 'auto';
  format:        string;   // 'jpg', 'mp4', 'pdf', etc.
  bytes:         number;   // file size as Cloudinary stored it
  width?:        number;   // present for image/video
  height?:       number;   // present for image/video
  duration?:     number;   // present for video (seconds)
}

/**
 * Upload a File directly from the browser to Cloudinary.
 * Uses the unsigned `marble_intake` preset → folder `marble-sinks/intake/`.
 *
 * Throws if env vars are missing or the upload fails.
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME)    throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set in .env.local');
  if (!PRESET_INTAKE) throw new Error('NEXT_PUBLIC_CLOUDINARY_PRESET_INTAKE is not set in .env.local');

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', PRESET_INTAKE);

  // 'auto' resource_type lets Cloudinary detect image/video/raw from the file.
  // PDFs land as resource_type='image' (Cloudinary treats them as images for transforms).
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
 * Inserts `/upload/so_1,w_1200,f_jpg/` and changes the extension to `.jpg`.
 * `so_1` = "start offset 1 second" — first frame after the very start (avoids black frames).
 *
 * Used to feed an MP4 upload into Claude vision API (which doesn't accept video directly).
 *
 * Returns the input unchanged if it doesn't look like a Cloudinary video URL.
 */
export function getVideoFrameUrl(videoUrl: string): string {
  if (!videoUrl.includes('/upload/')) return videoUrl;

  return videoUrl
    .replace('/upload/', '/upload/so_1,w_1200,f_jpg/')
    .replace(/\.(mp4|mov|webm|avi|m4v|mkv|3gp)(\?.*)?$/i, '.jpg$2');
}

/**
 * Build a JPEG-of-page-1 URL from a Cloudinary PDF URL.
 * `pg_1` = "page 1". Cloudinary handles PDFs as images, so this works server-side.
 *
 * Used to feed a PDF upload into Claude vision API (which doesn't accept PDF natively
 * via the standard messages endpoint without the document content type).
 */
export function getPdfPreviewUrl(pdfUrl: string): string {
  if (!pdfUrl.includes('/upload/')) return pdfUrl;

  return pdfUrl
    .replace('/upload/', '/upload/pg_1,w_1200,f_jpg/')
    .replace(/\.pdf(\?.*)?$/i, '.jpg$1');
}

/**
 * Resize a Cloudinary image URL by inserting a width/height/crop transform.
 * `c_fill` = scale + crop to fill the box exactly (good for thumbnails).
 *
 * Defaults: 400x400 thumbnails. Override per call.
 */
export function getResizedImageUrl(
  imageUrl: string,
  width    = 400,
  height   = 400
): string {
  if (!imageUrl.includes('/upload/')) return imageUrl;

  return imageUrl.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
}

/**
 * Check whether the env vars needed for upload are present.
 * Useful for showing a friendly error in the UI before the user even tries to upload.
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && PRESET_INTAKE);
}

/** Read-only debug accessors (used by tests + DevTools console). */
export const CLOUDINARY_CONFIG = {
  cloudName: CLOUD_NAME,
  preset:    PRESET_INTAKE,
};