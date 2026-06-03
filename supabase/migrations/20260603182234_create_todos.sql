-- Görevleri tutacak tablo
create table todos (
  id bigint generated always as identity primary key,
  text text not null,
  completed boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security'i aç
alter table todos enable row level security;

-- Giriş sistemi olmadığı için herkesin erişimine izin ver
create policy "herkes erisebilir"
on todos for all
using (true)
with check (true);
