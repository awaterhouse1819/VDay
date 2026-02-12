alter table entries
  add column if not exists slot integer,
  add column if not exists question text,
  add column if not exists answer text;

alter table entries
  drop column if exists answers;

update entries set slot = 1 where slot is null;
update entries set question = '' where question is null;
update entries set answer = '' where answer is null;

alter table entries
  alter column slot set not null,
  alter column question set not null,
  alter column answer set not null;

alter table entries
  drop constraint if exists entries_partner_year_unique;

alter table entries
  add constraint entries_slot_check check (slot between 1 and 5),
  add constraint entries_partner_year_slot_unique unique (partner_id, year, slot);
