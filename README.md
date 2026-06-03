# 📝 Yapılacaklar Listesi (Todo App)

HTML, CSS ve saf JavaScript ile yazılmış basit bir yapılacaklar uygulaması.
Veriler **Supabase** (PostgreSQL) üzerinde saklanır.

## Özellikler

- ➕ Görev ekleme
- ✅ Tamamlandı olarak işaretleme
- ❌ Görev silme
- 🔍 Filtreleme (Tümü / Aktif / Tamamlanan)
- 🗑️ Tamamlananları topluca silme
- ☁️ Veriler Supabase bulutunda kalıcı olarak saklanır

## Çalıştırma

`index.html` dosyasını bir tarayıcıda aç. Hepsi bu kadar.

## Teknolojiler

- HTML / CSS / JavaScript
- [Supabase](https://supabase.com) (veritabanı)

## Veritabanı kurulumu

`supabase/migrations/` klasöründeki SQL, `todos` tablosunu oluşturur.
Supabase CLI ile uygulamak için:

```bash
supabase link --project-ref <PROJE_REF>
supabase db push
```
