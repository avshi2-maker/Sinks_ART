-- supabase/phase41_trabelsi_material_settings_01072026.sql
-- Editable fixed data for the material calculator (Trabelsi porcelain costs).
-- Single-row settings table. Run BEFORE deploying the material-calc code.

create table if not exists trabelsi_material_settings (
  id           int primary key default 1,
  sheet_len_cm numeric not null default 270,   -- 2.70 m sheet
  sheet_wid_cm numeric not null default 120,   -- 1.20 m sheet
  price_per_m2 numeric not null default 199,   -- ILS per m2 (Trabelsi line #3 basis)
  crate_ils    numeric not null default 980,   -- כלוב — wood crate, each
  delivery_ils numeric not null default 350,   -- הובלה ופריקה
  vat_pct      numeric not null default 18,
  updated_at   timestamptz not null default now(),
  constraint trabelsi_single_row check (id = 1)
);

alter table trabelsi_material_settings enable row level security;
drop policy if exists "anon all trabelsi_material_settings" on trabelsi_material_settings;
create policy "anon all trabelsi_material_settings" on trabelsi_material_settings for all to anon using (true) with check (true);

insert into trabelsi_material_settings (id, sheet_len_cm, sheet_wid_cm, price_per_m2, crate_ils, delivery_ils, vat_pct)
values (1, 270, 120, 199, 980, 350, 18)
on conflict (id) do nothing;
