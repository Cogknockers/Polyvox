alter table public.post_reports enable row level security;

drop policy if exists "Moderators can read post reports" on public.post_reports;

create policy "Moderators can read post reports"
  on public.post_reports
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_global_roles ugr
      where ugr.user_id = auth.uid()
        and ugr.role = 'admin'
    )
    or exists (
      select 1
      from public.posts p
      where p.id = post_reports.post_id
        and public.has_jurisdiction_role(
          p.jurisdiction_id,
          array['founder','moderator']::text[]
        )
    )
    or exists (
      select 1
      from public.post_comments c
      join public.posts p on p.id = c.post_id
      where c.id = post_reports.comment_id
        and public.has_jurisdiction_role(
          p.jurisdiction_id,
          array['founder','moderator']::text[]
        )
    )
  );
