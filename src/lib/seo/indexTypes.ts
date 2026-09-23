// src/lib/seo/indexTypes.ts · updated 23.09.2026 13:07 (Asia/Jerusalem)
// Shared types for the Google indexing tracker (/index-tracker).

export type UrlKind = 'project' | 'guide' | 'city' | 'core' | 'video';
export type IndexStatus = 'new' | 'submitted' | 'indexed';

export interface TrackedUrl {
  url: string;
  path: string;          // decoded pathname, for display
  kind: UrlKind;
  lastmod: string | null;
  first_seen: string | null;
  submitted_at: string | null;
  indexed_at: string | null;
  bing_sent_at: string | null;
  bing_indexed_at: string | null;
  status: IndexStatus;
  inSitemap: boolean;    // false = was in the sitemap once, now removed
}

export const KIND_LABEL: Record<UrlKind, string> = {
  project: 'פרויקט',
  guide: 'מדריך',
  city: 'עיר',
  core: 'עמוד ראשי',
  video: 'וידאו',
};
