create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by owner"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create table if not exists user_global_roles (
  user_id uuid references auth.users (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table user_global_roles enable row level security;

create policy "Read own global roles"
  on user_global_roles for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists jurisdiction_memberships (
  user_id uuid references auth.users (id) on delete cascade,
  jurisdiction_id uuid references jurisdictions (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, jurisdiction_id, role)
);

create index if not exists jurisdiction_memberships_jurisdiction_id_idx
  on jurisdiction_memberships (jurisdiction_id);

alter table jurisdiction_memberships enable row level security;

create policy "Read own jurisdiction roles"
  on jurisdiction_memberships for select
  to authenticated
  using (auth.uid() = user_id);
