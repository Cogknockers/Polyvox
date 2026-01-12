alter table jurisdictions
  drop constraint if exists jurisdictions_type_check;

alter table jurisdictions
  add constraint jurisdictions_type_check
  check (type in ('COUNTRY', 'STATE', 'COUNTY', 'CITY'));
