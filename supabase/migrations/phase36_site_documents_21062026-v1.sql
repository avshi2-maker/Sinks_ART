-- Phase 36 — Site Documents + offer PDF bridge
-- Run in Supabase SQL Editor (Marble project: givcxgzhfoetujhrjgvc).
-- Safe to re-run (idempotent).

create extension if not exists "pgcrypto";

create table if not exists public.site_documents (
  id             uuid primary key default gen_random_uuid(),
  site_id        uuid not null references public.sites(id) on delete cascade,
  project_id     uuid references public.projects(id) on delete set null,
  customer_id    uuid references public.customers(id) on delete set null,
  doc_type       text not null default 'offer',   -- 'offer' | 'report' | 'drawing' | 'other'
  title_he       text not null,
  cloudinary_url text not null,
  file_name      text,
  total_ils      numeric,
  notes_he       text,
  created_at     timestamptz not null default now()
);

create index if not exists site_documents_site_id_idx on public.site_documents(site_id);

alter table public.site_documents enable row level security;
drop policy if exists "anon all site_documents" on public.site_documents;
create policy "anon all site_documents" on public.site_documents
  for all using (true) with check (true);

-- Dashboard bridge: let a tracked offer carry its PDF/file URL.
alter table public.arvo_offers add column if not exists document_url text;
