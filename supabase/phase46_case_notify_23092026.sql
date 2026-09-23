-- phase46 · case_studies email-alert tracking · 23.09.2026
alter table case_studies add column if not exists notified_at timestamptz;       -- first "new job from Ales" email sent
alter table case_studies add column if not exists last_reminder_at timestamptz;  -- last daily nag
alter table case_studies add column if not exists opened_at timestamptz;         -- Avshi opened the case in CRM → nags stop
