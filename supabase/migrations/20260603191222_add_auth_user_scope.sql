-- Her göreve sahibini bağlayan sütun.
-- Yeni kayıtlarda otomatik olarak giriş yapan kullanıcının kimliğiyle dolar.
alter table todos
  add column user_id uuid default auth.uid() references auth.users(id) on delete cascade;

-- Eski "herkes erişebilir" politikasını kaldır
drop policy if exists "herkes erisebilir" on todos;

-- Artık herkes YALNIZCA kendi görevlerine erişebilir
create policy "kendi gorevlerini gor"
  on todos for select
  using (auth.uid() = user_id);

create policy "kendi gorevini ekle"
  on todos for insert
  with check (auth.uid() = user_id);

create policy "kendi gorevini guncelle"
  on todos for update
  using (auth.uid() = user_id);

create policy "kendi gorevini sil"
  on todos for delete
  using (auth.uid() = user_id);
