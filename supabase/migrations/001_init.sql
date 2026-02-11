create table if not exists questions (
  id serial primary key,
  prompt text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_prompt_unique unique (prompt)
);

create table if not exists entries (
  id serial primary key,
  year integer not null,
  partner_id varchar(3) not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entries_partner_year_unique unique (partner_id, year),
  constraint entries_partner_check check (partner_id in ('ACW', 'SLS'))
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_questions on questions;
create trigger set_updated_at_questions
before update on questions
for each row
execute procedure set_updated_at();

drop trigger if exists set_updated_at_entries on entries;
create trigger set_updated_at_entries
before update on entries
for each row
execute procedure set_updated_at();
