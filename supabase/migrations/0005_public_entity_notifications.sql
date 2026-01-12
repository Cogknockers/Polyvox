create table if not exists public_entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  jurisdiction_name text,
  contact_email text,
  contact_email_verification text not null default 'unverified'
    check (contact_email_verification in ('unverified', 'verified_by_mod')),
  notification_mode text not null default 'email_immediate'
    check (notification_mode in ('email_immediate', 'email_digest', 'none')),
  email_suppressed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists entity_mentions (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public_entities (id) on delete cascade,
  content_type text not null,
  content_id text not null,
  content_title text,
  content_url text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now()
);

create table if not exists email_outbox (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references public_entities (id) on delete set null,
  to_email text not null,
  subject text not null,
  template text not null
    check (template in ('entity_tag_immediate', 'entity_tag_digest')),
  payload jsonb not null,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed')),
  send_after timestamptz not null default now(),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_entities_notification_mode_idx
  on public_entities (notification_mode);

create index if not exists entity_mentions_entity_id_idx
  on entity_mentions (entity_id);

create index if not exists entity_mentions_content_id_idx
  on entity_mentions (content_id);

create index if not exists email_outbox_status_send_after_idx
  on email_outbox (status, send_after);

create index if not exists email_outbox_entity_id_idx
  on email_outbox (entity_id);

alter table public_entities enable row level security;
alter table entity_mentions enable row level security;
alter table email_outbox enable row level security;

create policy "Public read public entities"
  on public_entities for select
  to public
  using (true);

create policy "Service role manage public entities"
  on public_entities for all
  to authenticated
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Authenticated insert entity mentions"
  on entity_mentions for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Service role read entity mentions"
  on entity_mentions for select
  to authenticated
  using (auth.role() = 'service_role');

create policy "Service role insert email outbox"
  on email_outbox for insert
  to authenticated
  with check (auth.role() = 'service_role');

create policy "Service role read email outbox"
  on email_outbox for select
  to authenticated
  using (auth.role() = 'service_role');

create policy "Service role update email outbox"
  on email_outbox for update
  to authenticated
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
