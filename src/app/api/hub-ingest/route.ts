// route.ts (src/app/api/hub-ingest/route.ts) · updated 29.10.2026 07:45 (Asia/Jerusalem)
// Door for Sapirim Hub (hub.marble-art.co.il): a WhatsApp message tagged "כיורי שיש" is filed here directly — no copy/paste.
// POST JSON { name?, phone?, text, media?: string[], at? } + header x-hub-key: HUB_INGEST_KEY
// Known phone (customer or any contact) → WhatsApp entry in that customer's timeline (+ follow-up task if none open).
// Unknown → new customer (source whatsapp) + primary contact + project "ליד מוואטסאפ" (status ליד) + timeline entry + task.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const CRM_URL = 'https://crm.marble-art.co.il';
const last9 = (p?: string | null) => String(p || '').replace(/\D/g, '').slice(-9);

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing on server');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  const secret = process.env.HUB_INGEST_KEY;
  if (!secret || req.headers.get('x-hub-key') !== secret) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { name?: string; phone?: string; text?: string; media?: string[]; at?: string } | null;
  const text = String(b?.text || '').trim();
  if (!text) return NextResponse.json({ ok: false, error: 'text required' }, { status: 400 });
  const db = sb();
  const p9 = last9(b?.phone);
  const name = (b?.name || '').trim();
  const at = b?.at || new Date().toISOString();
  const media = (b?.media || []).filter((u) => /^https:\/\//.test(u)).slice(0, 10);
  const body = text + (media.length ? '\n' + media.map((u) => '📎 ' + u).join('\n') : '');

  // 1) find existing customer by phone (account phone or any contact phone)
  let customerId: string | null = null; let customerName = '';
  if (p9.length === 9) {
    const cs = (await db.from('customers').select('id,name_he,phone').not('phone', 'is', null)).data || [];
    const c = cs.find((x) => last9(x.phone) === p9);
    if (c) { customerId = c.id; customerName = c.name_he; }
    if (!customerId) {
      const ct = (await db.from('customer_contacts').select('customer_id,phone').not('phone', 'is', null)).data || [];
      const k = ct.find((x) => last9(x.phone) === p9);
      if (k) { customerId = k.customer_id; customerName = (await db.from('customers').select('name_he').eq('id', k.customer_id).single()).data?.name_he || ''; }
    }
  }

  // 2) unknown → new customer + contact + first project
  let created = false; let projectId: string | null = null;
  if (!customerId) {
    const phone = b?.phone ? String(b.phone).replace(/[^\d+]/g, '') : null;
    customerName = name || (phone ? phone : 'ליד מוואטסאפ');
    const c = await db.from('customers').insert({ name_he: customerName, phone, source: 'whatsapp', source_details: 'Sapirim Hub', notes: null, is_active: true }).select('id').single();
    if (c.error) return NextResponse.json({ ok: false, error: c.error.message }, { status: 500 });
    customerId = c.data.id as string; created = true;
    await db.from('customer_contacts').insert({ customer_id: customerId, name: name || customerName, title: 'איש קשר ראשי', phone, is_primary: true });
    const now = new Date().toISOString();
    const pr = await db.from('projects').insert({ customer_id: customerId, title_he: 'ליד מוואטסאפ', status: 'ליד', inquiry_date: now.slice(0, 10), created_at: now, updated_at: now }).select('id').single();
    projectId = pr.data?.id || null;
  }

  // 3) timeline entry
  const cm = await db.from('customer_communications').insert({ customer_id: customerId, project_id: projectId, comm_type: 'whatsapp', subject: 'WhatsApp · Sapirim Hub', body, occurred_at: at }).select('id').single();
  if (cm.error) return NextResponse.json({ ok: false, error: cm.error.message }, { status: 500 });

  // 4) follow-up task if none open for this customer
  const open = await db.from('tasks').select('id').eq('customer_id', customerId).eq('status', 'open').limit(1);
  if (!open.data?.length) {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date());
    await db.from('tasks').insert({ title_he: `לחזור ל-${customerName} (וואטסאפ)`, due_date: today, customer_id: customerId, project_id: projectId, source: 'whatsapp', status: 'open' });
  }

  revalidatePath('/customers'); revalidatePath('/dashboard'); revalidatePath('/tasks');
  return NextResponse.json({ ok: true, created, ref: customerId, url: `${CRM_URL}/customers/${customerId}` });
}
