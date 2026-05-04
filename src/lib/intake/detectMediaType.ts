/**
 * detectMediaType.ts
 *
 * Pure media type detection. No side effects, no API calls.
 * Takes a URL string OR a File object → returns one of 7 media types.
 *
 * Phase 15 — Multi-Format Media Intake
 * Created: 03/05/2026
 */

export type MediaType =
  | 'youtube'
  | 'instagram'
  | 'photo'
  | 'sketch'
  | 'mp4'
  | 'pdf'
  | 'url';

/**
 * Detect media type from a URL string.
 * Returns 'url' as a generic fallback for any web link not matching a known platform.
 */
export function detectMediaTypeFromUrl(url: string): MediaType {
  const u = url.trim().toLowerCase();

  // YouTube — youtube.com/*, youtu.be/*, m.youtube.com/*
  if (
    u.includes('youtube.com/') ||
    u.includes('youtu.be/') ||
    u.includes('m.youtube.com/')
  ) {
    return 'youtube';
  }

  // Instagram — instagram.com/p/, instagram.com/reel/, instagram.com/tv/
  if (u.includes('instagram.com/')) {
    return 'instagram';
  }

  // Direct file URLs (e.g., Cloudinary, S3) — match by extension
  if (/\.(jpg|jpeg|png|webp|heic|gif)(\?|$)/i.test(u)) return 'photo';
  if (/\.(mp4|mov|webm|m4v|avi)(\?|$)/i.test(u))      return 'mp4';
  if (/\.pdf(\?|$)/i.test(u))                         return 'pdf';

  // Generic web link — for analyzing reference articles / blog posts
  return 'url';
}

/**
 * Detect media type from an uploaded File.
 * Falls back to extension matching if MIME type is missing or wrong
 * (common when files come from older Android phones — MIME is often empty).
 */
export function detectMediaTypeFromFile(file: File): MediaType {
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  // Prefer MIME type when available
  if (mime.startsWith('image/')) {
    // Differentiate sketch (hand-drawn on paper) from photo using filename hints.
    // Default = photo. User can manually re-tag as sketch in the UI later.
    if (/sketch|drawing|sktch/i.test(name)) {
      return 'sketch';
    }
    return 'photo';
  }
  if (mime.startsWith('video/'))         return 'mp4';
  if (mime === 'application/pdf')        return 'pdf';

  // MIME-type fallback by extension (Android phones often send empty MIME)
  if (/\.(jpg|jpeg|png|webp|heic|gif)$/i.test(name)) return 'photo';
  if (/\.(mp4|mov|webm|m4v|avi|3gp)$/i.test(name))   return 'mp4';
  if (/\.pdf$/i.test(name))                          return 'pdf';

  // Unknown file type — treat as URL placeholder for now (caller should warn user)
  return 'url';
}

/**
 * Convenience wrapper — accepts either input type and dispatches.
 */
export function detectMediaType(input: string | File): MediaType {
  if (typeof input === 'string') return detectMediaTypeFromUrl(input);
  return detectMediaTypeFromFile(input);
}

/**
 * Hebrew display label for each media type.
 * Used in the UI to show users what type was detected.
 */
export const MEDIA_TYPE_LABEL_HE: Record<MediaType, string> = {
  youtube:   'יוטיוב',
  instagram: 'אינסטגרם',
  photo:     'תמונה',
  sketch:    'שרטוט',
  mp4:       'סרטון',
  pdf:       'PDF',
  url:       'קישור',
};

/**
 * Emoji icon per type — used in compact UI badges.
 */
export const MEDIA_TYPE_ICON: Record<MediaType, string> = {
  youtube:   '▶️',
  instagram: '📷',
  photo:     '🖼️',
  sketch:    '✏️',
  mp4:       '🎬',
  pdf:       '📄',
  url:       '🔗',
};