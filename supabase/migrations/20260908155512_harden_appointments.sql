alter table public.appointments
  add column if not exists invite_status text not null default 'pending'
    check (invite_status in ('pending', 'sent', 'failed')),
  add column if not exists invite_error text,
  add column if not exists invite_sent_at timestamptz;
