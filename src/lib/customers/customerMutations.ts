'use server';

// src/lib/customers/customerMutations.ts
// Phase 22 — customer-list cleanup: create a real customer + archive (soft-delete) rows.
// archiveCustomer sets archived_at; the list fetcher hides archived rows. Reversible.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

const ALLOWED_SOURCES = ['pinterest', 'whatsapp', 'instagram', 'website', 'referral', 'walk-in', 'phone', 'other'];

export interface CreateCustomerInput {
  name_he: string;
  phone?: string;
  city?: string;
  email?: string;
  source?: string;
  profession?: string;
  notes?: string;
}

export interface MutationResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export async function createCustomer(input: CreateCustomerInput): Promise<MutationResult> {
  const name = (input.name_he || '').trim().replace(/\s+/g, ' ');
  if (!name) return { ok: false, error: 'חובה להזין שם לקוח' };

  const source = ALLOWED_SOURCES.includes(input.source || '') ? input.source : 'phone';

  const sb = getServerSupabase();
  const res = await sb
    .from('customers')
    .insert({
      name_he: name,
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
      email: input.email?.trim() || null,
      profession: input.profession?.trim() || null,
      notes: input.notes?.trim() || null,
      source,
      is_active: true,
    })
    .select('id')
    .maybeSingle();

  if (res.error) return { ok: false, error: res.error.message };

  revalidatePath('/customers');
  return { ok: true, id: res.data?.id as string | undefined };
}

export async function archiveCustomer(id: string): Promise<MutationResult> {
  if (!id) return { ok: false, error: 'missing id' };
  const sb = getServerSupabase();
  const res = await sb
    .from('customers')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);

  if (res.error) return { ok: false, error: res.error.message };

  revalidatePath('/customers');
  return { ok: true };
}

export interface UpdateCustomerInput {
  id: string;
  name_he: string;
  phone?: string;
  city?: string;
  email?: string;
  profession?: string;
  notes?: string;
}

export async function updateCustomer(input: UpdateCustomerInput): Promise<MutationResult> {
  if (!input.id) return { ok: false, error: 'missing id' };
  const name = (input.name_he || '').trim().replace(/\s+/g, ' ');
  if (!name) return { ok: false, error: 'חובה להזין שם לקוח' };
  const sb = getServerSupabase();
  const res = await sb
    .from('customers')
    .update({
      name_he: name,
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
      email: input.email?.trim() || null,
      profession: input.profession?.trim() || null,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/customers/' + input.id);
  return { ok: true, id: input.id };
}