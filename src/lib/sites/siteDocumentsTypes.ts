// src/lib/sites/siteDocumentsTypes.ts
// Pure types + constants for site documents (NO 'use server').

export type DocType = 'offer' | 'report' | 'drawing' | 'other';

export interface SiteDocument {
  id: string;
  site_id: string;
  project_id: string | null;
  customer_id: string | null;
  doc_type: DocType;
  title_he: string;
  cloudinary_url: string;
  file_name: string | null;
  total_ils: number | null;
  notes_he: string | null;
  created_at: string;
}

export const DOC_TYPE_META: Record<DocType, { label: string; emoji: string; cls: string }> = {
  offer:   { label: 'הצעת מחיר', emoji: '💰', cls: 'bg-emerald-100 text-emerald-700' },
  report:  { label: 'דוח', emoji: '📋', cls: 'bg-blue-100 text-blue-700' },
  drawing: { label: 'שרטוט', emoji: '📐', cls: 'bg-indigo-100 text-indigo-700' },
  other:   { label: 'אחר', emoji: '📎', cls: 'bg-stone-100 text-stone-600' },
};

export const DOC_TYPE_ORDER: DocType[] = ['offer', 'report', 'drawing', 'other'];
