'use server';

// src/lib/customers/intakeMutations.ts
// Ferrari intake — one save creates: the account (customers row), its contacts
// (customer_contacts, exactly one primary), and a linked first project.

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { CreateIntakeInput, IntakeResult } from './intakeTypes';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

const ALLOWED_SOURCES = ['pinterest', 'whatsapp', 'instagram', 'website', 'referral', 'walk-in', 'phone', 'other'];

export async function createIntake(input: CreateIntakeInput): Promise<IntakeResult> {
  const accountName = (input.accountName || '').trim().replace(/\s+/g, ' ');
  const projectTitle = (input.projectTitle || '').trim().replace(/\s+/g, ' ');
  if (!accountName)  return { ok: false, error: 'חובה להזין שם לקוח / חשבון' };
  if (!projectTitle) return { ok: false, error: 'חובה להזין כותרת פרויקט' };

  const contacts = (input.contacts || []).filter((c) => (c.name || '').trim());
  if (contacts.length === 0) return { ok: false, error: 'חובה להזין לפחות איש קשר אחד' };
  const primaries = contacts.filter((c) => c.isPrimary);
  if (primaries.length !== 1) return { ok: false, error: 'יש לסמן בדיוק איש קשר ראשי אחד' };
  for (const c of contacts) {
    if (!c.title) return { ok: false, error: 'לכל איש קשר חובה לבחור תפקיד' };
  }

  const primary = primaries[0];
  const source = ALLOWED_SOURCES.includes(input.source || '') ? input.source : 'phone';
  const db = sb();

  // 1) Account (customer). Mirror the primary contact's phone/email to the
  //    account row so existing list views (which show phone) still work.
  const custRes = await db.from('customers').insert({
    name_he:  accountName,
    phone:    primary.phone?.trim() || null,
    email:    primary.email?.trim() || null,
    city:     input.city?.trim() || null,
    notes:    input.notes?.trim() || null,
    source,
    is_active: true,
  }).select('id').single();
  if (custRes.error) return { ok: false, error: custRes.error.message };
  const customerId = custRes.data.id as string;

  // 2) Contacts.
  const contactRows = contacts.map((c) => ({
    customer_id: customerId,
    name:        c.name.trim(),
    title:       c.title,
    phone:       c.phone?.trim() || null,
    email:       c.email?.trim() || null,
    is_primary:  c.isPrimary,
  }));
  const contRes = await db.from('customer_contacts').insert(contactRows);
  if (contRes.error) return { ok: false, error: 'לקוח נוצר, אך שגיאה בשמירת אנשי קשר: ' + contRes.error.message };

  // 3) Linked first project.
  const nowIso = new Date().toISOString();
  const projRes = await db.from('projects').insert({
    customer_id:   customerId,
    title_he:      projectTitle,
    status:        'ליד',
    stone_type_he: input.projectStone?.trim() || null,
    dimensions:    input.projectDimensions?.trim() || null,
    inquiry_date:  nowIso.slice(0, 10),
    created_at:    nowIso,
    updated_at:    nowIso,
  }).select('id').single();
  if (projRes.error) return { ok: false, error: 'לקוח ואנשי קשר נוצרו, אך שגיאה ביצירת הפרויקט: ' + projRes.error.message };

  revalidatePath('/customers');
  revalidatePath('/dashboard');
  return { ok: true, customerId, projectId: projRes.data.id as string };
}
