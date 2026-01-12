alter table public.profiles
  add column if not exists bio text,
  add column if not exists party_affiliation text,
  add column if not exists party_affiliation_public boolean not null default false,
  add column if not exists district_label text,
  add column if not exists location_country text,
  add column if not exists location_state text,
  add column if not exists location_county_fips text,
  add column if not exists location_county_name text,
  add column if not exists location_city text;

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme_mode text not null default 'system'
    check (theme_mode in ('system', 'light', 'dark')),
  theme_primary_oklch text,
  theme_accent_seed text,
  reduce_motion boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can read their preferences"
  on public.user_preferences
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their preferences"
  on public.user_preferences
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their preferences"
  on public.user_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
