alter table jurisdictions
  add column if not exists external_id text;

alter table jurisdictions
  add column if not exists slug text;

alter table jurisdictions
  add column if not exists status text not null default 'ACTIVE'
  check (status in ('ACTIVE', 'ARCHIVED'));

alter table jurisdictions
  add column if not exists activated_at timestamptz not null default now();

alter table jurisdictions
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'jurisdictions_type_external_id_key'
  ) then
    alter table jurisdictions
      add constraint jurisdictions_type_external_id_key unique (type, external_id);
  end if;
end $$;

create index if not exists jurisdictions_external_id_idx
  on jurisdictions (external_id);
