// src/lib/case/caseTypes.ts · updated 23.09.2026 10:33 (Asia/Jerusalem)
// Case-study types shared by CRM pages, API routes and gates.

export type CaseStatus = 'new' | 'generated' | 'published' | 'archived';

export interface MediaItem { url: string; type?: string; public_id?: string; durationSec?: number }

export interface CaseFaq { q: string; a: string }

export interface CaseGen {
  title?: string;
  slug?: string;
  meta?: string;
  summary?: string;
  challenge?: string;
  process?: string;
  result?: string;
  material?: string;
  size?: string;
  faq?: CaseFaq[];
  alt?: string[];        // one per published image, same order as publishedImages()
  tags?: string[];
  social?: { ig?: string; fb?: string; pin?: string };
}

export interface CaseStudy {
  id: string;
  ales_job_id: string | null;
  status: CaseStatus;
  job_type: string | null;
  title_raw: string | null;
  city: string | null;
  customer_name: string | null;
  customer_id: string | null;
  first_name: string | null;
  fields: Record<string, unknown>;
  notes: string | null;
  before_media: MediaItem[];
  after_media: MediaItem[];
  voice: MediaItem | null;
  rating: number | null;
  quote: string | null;
  consent: { photos?: boolean; name_city?: boolean; quote?: boolean; stamped_at?: string };
  finish_date: string | null;
  ales_created_at: string | null;
  transcript: string | null;
  transcript_cost: number | null;
  gen: CaseGen;
  slug: string | null;
  gen_tokens_in: number | null;
  gen_tokens_out: number | null;
  gen_cost: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_HE: Record<CaseStatus, string> = {
  new: 'חדש מאלס',
  generated: 'נוצר · ממתין לאישור',
  published: 'פורסם',
  archived: 'בארכיון',
};

export const TYPE_HE: Record<string, string> = {
  sinks: 'כיורים', renovation: 'שיפוצים', doors: 'דלתות שיש', testimonial: 'המלצות',
};

export const SITE_URL = 'https://www.marble-art.co.il';

// Images that may appear on the public page: after-install first, then before. Videos excluded.
export function publishedImages(c: Pick<CaseStudy, 'after_media' | 'before_media'>): MediaItem[] {
  const isImg = (m: MediaItem) => !m.type || m.type === 'image';
  return [...(c.after_media || []).filter(isImg), ...(c.before_media || []).filter(isImg)].slice(0, 8);
}

export function fieldStr(c: CaseStudy, key: string): string {
  const v = (c.fields || {})[key];
  return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
}
