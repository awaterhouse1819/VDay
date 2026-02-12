create extension if not exists "pgcrypto";

create table if not exists board_images (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  uploaded_by_initials text not null,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists board_images_year_idx on board_images (year);
create index if not exists board_images_year_initials_idx on board_images (year, uploaded_by_initials);

alter table board_images
  add constraint board_images_initials_check check (uploaded_by_initials in ('ACW', 'SLS'));
