with country as (
  insert into jurisdictions (type, name)
  values ('COUNTRY', 'USA')
  returning id
),
state as (
  insert into jurisdictions (type, name, parent_id)
  select 'STATE', 'Alabama', id from country
  returning id
),
county as (
  insert into jurisdictions (type, name, parent_id)
  select 'COUNTY', 'Calhoun', id from state
  returning id
),
city as (
  insert into jurisdictions (type, name, parent_id)
  select 'CITY', 'Jacksonville', id from county
  returning id
)
insert into offices (jurisdiction_id, office_type, name)
select id, 'MAYOR', 'Mayor of Jacksonville' from city;
