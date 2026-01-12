create extension if not exists "pgcrypto";

create table jurisdictions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('COUNTRY', 'STATE', 'COUNTY', 'CITY')),
  name text not null,
  parent_id uuid references jurisdictions (id) on delete set null
);

create index jurisdictions_parent_id_idx on jurisdictions (parent_id);

create table offices (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references jurisdictions (id) on delete cascade,
  office_type text not null,
  name text not null
);

create index offices_jurisdiction_id_idx on offices (jurisdiction_id);

create table office_activations (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null unique references offices (id) on delete cascade,
  status text not null check (status in ('DORMANT', 'SEEDLING', 'ROOTED')) default 'DORMANT',
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table office_activation_supporters (
  office_id uuid not null references offices (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (office_id, user_id)
);

create index office_activation_supporters_office_id_idx on office_activation_supporters (office_id);

create table issues (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references offices (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index issues_office_id_idx on issues (office_id);

create table comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now()
);

create index comments_issue_id_idx on comments (issue_id);

create table comment_votes (
  comment_id uuid not null references comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index comment_votes_comment_id_idx on comment_votes (comment_id);

alter table jurisdictions enable row level security;
alter table offices enable row level security;
alter table office_activations enable row level security;
alter table office_activation_supporters enable row level security;
alter table issues enable row level security;
alter table comments enable row level security;
alter table comment_votes enable row level security;

create policy "Public read jurisdictions"
  on jurisdictions for select
  to public
  using (true);

create policy "Public read offices"
  on offices for select
  to public
  using (true);

create policy "Public read office activations"
  on office_activations for select
  to public
  using (true);

create policy "Authenticated insert office activations"
  on office_activations for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated insert activation supporters"
  on office_activation_supporters for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Authenticated delete activation supporters"
  on office_activation_supporters for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Public read issues"
  on issues for select
  to public
  using (true);

create policy "Authenticated insert issues"
  on issues for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Public read comments"
  on comments for select
  to public
  using (true);

create policy "Authenticated insert comments"
  on comments for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated insert comment votes"
  on comment_votes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Authenticated update comment votes"
  on comment_votes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
