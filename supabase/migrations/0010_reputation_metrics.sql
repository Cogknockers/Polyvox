create or replace function public.get_user_reputation(p_user_id uuid)
returns table (
  user_id uuid,
  upvotes_received integer,
  downvotes_received integer,
  net_votes integer,
  resolved_reports integer,
  score integer,
  vote_cast_total integer,
  vote_cast_down integer,
  downvote_ratio numeric
)
language sql
stable
security definer
set search_path = public
as $$
with post_votes_received as (
  select
    coalesce(sum(case when pv.value = 1 then 1 else 0 end), 0)::integer as upvotes,
    coalesce(sum(case when pv.value = -1 then 1 else 0 end), 0)::integer as downvotes
  from public.posts p
  join public.post_votes pv on pv.post_id = p.id
  where p.author_id = p_user_id
),
comment_votes_received as (
  select
    coalesce(sum(case when cv.value = 1 then 1 else 0 end), 0)::integer as upvotes,
    coalesce(sum(case when cv.value = -1 then 1 else 0 end), 0)::integer as downvotes
  from public.comments c
  join public.comment_votes cv on cv.comment_id = c.id
  where c.created_by = p_user_id
),
report_penalties as (
  select
    count(*)::integer as resolved_reports
  from public.post_reports r
  left join public.posts p on p.id = r.post_id
  left join public.post_comments pc on pc.id = r.comment_id
  left join public.posts p2 on p2.id = pc.post_id
  where r.status = 'resolved'
    and (
      p.author_id = p_user_id
      or p2.author_id = p_user_id
    )
),
vote_behavior as (
  select value
  from (
    select value, created_at
    from public.post_votes
    where user_id = p_user_id
    union all
    select value, created_at
    from public.comment_votes
    where user_id = p_user_id
  ) v
  order by created_at desc nulls last
  limit 50
),
vote_behavior_agg as (
  select
    count(*)::integer as vote_cast_total,
    coalesce(sum(case when value = -1 then 1 else 0 end), 0)::integer as vote_cast_down
  from vote_behavior
)
select
  p_user_id as user_id,
  (pvr.upvotes + cvr.upvotes) as upvotes_received,
  (pvr.downvotes + cvr.downvotes) as downvotes_received,
  (pvr.upvotes + cvr.upvotes) - (pvr.downvotes + cvr.downvotes) as net_votes,
  rp.resolved_reports as resolved_reports,
  (pvr.upvotes + cvr.upvotes) - (pvr.downvotes + cvr.downvotes) - (rp.resolved_reports * 2) as score,
  vba.vote_cast_total,
  vba.vote_cast_down,
  case
    when vba.vote_cast_total = 0 then 0
    else round((vba.vote_cast_down::numeric / vba.vote_cast_total), 3)
  end as downvote_ratio
from post_votes_received pvr, comment_votes_received cvr, report_penalties rp, vote_behavior_agg vba;
$$;

grant execute on function public.get_user_reputation(uuid) to anon, authenticated;
