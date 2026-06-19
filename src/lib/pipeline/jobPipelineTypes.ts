// src/lib/pipeline/jobPipelineTypes.ts
// Pure types + constants for the job pipeline (NO 'use server' — these are objects,
// not server actions, so they live in their own module).

export type JobStage =
  | 'new_lead'
  | 'awaiting_ales'
  | 'priced'
  | 'offer_sent'
  | 'ordered'
  | 'delivered'
  | 'paid'
  | 'lost';

export interface JobRow {
  id: string;
  created_at: string;
  updated_at: string;
  title_he: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_city: string | null;
  rfq_id: string | null;
  supplier_offer_id: string | null;
  stage: JobStage;
  ales_cost: number;
  customer_total: number;
  commission: number;
  notes: string | null;
  ordered_at: string | null;
  paid_at: string | null;
}

export const STAGE_META: Record<JobStage, { label: string; short: string; order: number; cls: string; active: boolean }> = {
  new_lead:      { label: 'ליד חדש',        short: 'ליד',       order: 1, cls: 'bg-stone-100 text-stone-600',   active: true },
  awaiting_ales: { label: 'ממתין לאלס',     short: 'אצל אלס',   order: 2, cls: 'bg-amber-100 text-amber-700',   active: true },
  priced:        { label: 'תומחר — לטיפול', short: 'תומחר',     order: 3, cls: 'bg-orange-100 text-orange-700', active: true },
  offer_sent:    { label: 'הצעה נשלחה',     short: 'הצעה בחוץ', order: 4, cls: 'bg-blue-100 text-blue-700',     active: true },
  ordered:       { label: 'הוזמן / בייצור', short: 'בייצור',    order: 5, cls: 'bg-indigo-100 text-indigo-700', active: true },
  delivered:     { label: 'סופק',           short: 'סופק',      order: 6, cls: 'bg-teal-100 text-teal-700',      active: true },
  paid:          { label: 'שולם ✓',         short: 'שולם',      order: 7, cls: 'bg-emerald-100 text-emerald-700',active: false },
  lost:          { label: 'אבוד',           short: 'אבוד',      order: 8, cls: 'bg-red-50 text-red-400',         active: false },
};

export const STAGE_ORDER: JobStage[] = ['new_lead', 'awaiting_ales', 'priced', 'offer_sent', 'ordered', 'delivered', 'paid', 'lost'];

export interface PipelineSummary {
  byStage: Record<JobStage, { count: number; value: number }>;
  activeCount: number;
  activeValue: number;
  paidValueAll: number;
  commissionPaidAll: number;
}
