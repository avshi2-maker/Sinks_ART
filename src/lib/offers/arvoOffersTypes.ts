// src/lib/offers/arvoOffersTypes.ts
// Pure types + constants for saved ARVO offers (NO 'use server').

export type OfferRecipient = 'customer' | 'ales' | 'none';
export type OfferStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'declined' | 'followup';

export interface ArvoOfferRow {
  id: string;
  offer_no: string;
  job_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  recipient: OfferRecipient;
  status: OfferStatus;
  total_ils: number;
  commission: number;
  body_html: string | null;
  notes: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export const RECIPIENT_META: Record<OfferRecipient, { label: string; cls: string }> = {
  customer: { label: 'ללקוח', cls: 'bg-blue-100 text-blue-700' },
  ales:     { label: 'לאלס להעברה', cls: 'bg-amber-100 text-amber-700' },
  none:     { label: 'לא נשלח', cls: 'bg-stone-100 text-stone-500' },
};
export const RECIPIENT_ORDER: OfferRecipient[] = ['customer', 'ales', 'none'];

export const STATUS_META: Record<OfferStatus, { label: string; cls: string; open: boolean }> = {
  draft:    { label: 'טיוטה',  cls: 'bg-stone-100 text-stone-600',    open: true },
  sent:     { label: 'נשלח',   cls: 'bg-blue-100 text-blue-700',      open: true },
  viewed:   { label: 'נצפה',   cls: 'bg-indigo-100 text-indigo-700',  open: true },
  approved: { label: 'אושר ✓', cls: 'bg-emerald-100 text-emerald-700',open: false },
  declined: { label: 'נדחה',   cls: 'bg-red-50 text-red-500',         open: false },
  followup: { label: 'למעקב',  cls: 'bg-orange-100 text-orange-700',  open: true },
};
export const STATUS_ORDER: OfferStatus[] = ['draft', 'sent', 'viewed', 'followup', 'approved', 'declined'];
