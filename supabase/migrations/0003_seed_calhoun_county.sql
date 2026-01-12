with state as (
  select id
  from jurisdictions
  where type = 'STATE' and name = 'Alabama'
  limit 1
),
existing_county as (
  select id
  from jurisdictions
  where type = 'COUNTY'
    and name = 'Calhoun'
    and parent_id in (select id from state)
),
inserted_county as (
  insert into jurisdictions (type, name, parent_id)
  select 'COUNTY', 'Calhoun', id
  from state
  where exists (select 1 from state)
    and not exists (select 1 from existing_county)
  returning id
),
county as (
  select id from inserted_county
  union all
  select id from existing_county
),
city as (
  select id
  from jurisdictions
  where type = 'CITY' and name = 'Jacksonville'
  limit 1
)
update jurisdictions
set parent_id = (select id from county)
where id in (select id from city)
  and exists (select 1 from county);
