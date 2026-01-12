create table if not exists public.user_theme (
  user_id uuid primary key references auth.users(id) on delete cascade,
  base_hex text not null,
  palette jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_theme enable row level security;

create policy "User theme: select own" on public.user_theme
  for select
  using (auth.uid() = user_id);

create policy "User theme: insert own" on public.user_theme
  for insert
  with check (auth.uid() = user_id);

create policy "User theme: update own" on public.user_theme
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
