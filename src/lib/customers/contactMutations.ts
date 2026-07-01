'use server';

// src/lib/customers/contactMutations.ts
// Add / edit / archive contacts on an account, and switch the primary contact.
// Enforces exactly one primary per customer.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { ContactTitle } from './intakeTypes';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface ContactResult { ok: boolean; error?: string; id?: string }

export interface AddContactInput {
  customerId: string;
  name:       string;
  title:      ContactTitle;
  phone?:     string;
  email?:     string;
  isPrimary?: boolean;
}

async function clearPrimary(db: ReturnType<typeof sb>, customerId: string) {
  await db.from('customer_contacts').update({ is_primary: false }).eq('customer_id', customerId).is('archived_at', null);
}

export async function addContact(input: AddContactInput): Promise<ContactResult> {
  const name = (input.name || '').trim();
  if (!name) return { ok: false, error: 'שם איש קשר חובה' };
  if (!input.title) return { ok: false, error: 'תפקיד חובה' };
  if (!input.customerId) return { ok: false, error: 'customerId missing' };
  const db = sb();
  if (input.isPrimary) await clearPrimary(db, input.customerId);
  const res = await db.from('customer_contacts').insert({
    customer_id: input.customerId,
    name,
    title:       input.title,
    phone:       input.phone?.trim() || null,
    email:       input.email?.trim() || null,
    is_primary:  !!input.isPrimary,
  }).select('id').single();
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/customers/' + input.customerId);
  return { ok: true, id: res.data.id as string };
}

export interface EditContactInput {
  contactId:  string;
  customerId: string;
  name:       string;
  title:      ContactTitle;
  phone?:     string;
  email?:     string;
}

export async function editContact(input: EditContactInput): Promise<ContactResult> {
  if (!input.contactId) return { ok: false, error: 'contactId missing' };
  const name = (input.name || '').trim();
  if (!name) return { ok: false, error: 'שם איש קשר חובה' };
  const db = sb();
  const res = await db.from('customer_contacts').update({
    name,
    title:      input.title,
    phone:      input.phone?.trim() || null,
    email:      input.email?.trim() || null,
    updated_at: new Date().toISOString(),
  }).eq('id', input.contactId);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/customers/' + input.customerId);
  return { ok: true };
}

export async function setPrimaryContact(contactId: string, customerId: string): Promise<ContactResult> {
  if (!contactId || !customerId) return { ok: false, error: 'missing id' };
  const db = sb();
  await clearPrimary(db, customerId);
  const res = await db.from('customer_contacts').update({ is_primary: true }).eq('id', contactId);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/customers/' + customerId);
  return { ok: true };
}

export async function archiveContact(contactId: string, customerId: string): Promise<ContactResult> {
  if (!contactId || !customerId) return { ok: false, error: 'missing id' };
  const db = sb();
  // Don't leave the account with zero primary: block archiving the primary if it's the last active contact.
  const active = await db.from('customer_contacts').select('id, is_primary').eq('customer_id', customerId).is('archived_at', null);
  if (active.error) return { ok: false, error: active.error.message };
  const rows = active.data || [];
  const target = rows.find((r) => r.id === contactId);
  if (target?.is_primary && rows.length > 1) {
    return { ok: false, error: 'לא ניתן להעביר לארכיון את איש הקשר הראשי — סמנו תחילה איש קשר ראשי אחר.' };
  }
  const res = await db.from('customer_contacts').update({ archived_at: new Date().toISOString() }).eq('id', contactId);
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/customers/' + customerId);
  return { ok: true };
}
