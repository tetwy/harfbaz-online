# Supabase Setup

Bu klasör Supabase veritabanı şemasını ve migration dosyalarını içerir.

## Kurulum

1. [Supabase Dashboard](https://supabase.com) üzerinden yeni proje oluşturun
2. SQL Editor'a gidin
3. `schema.sql` dosyasının içeriğini yapıştırıp çalıştırın

## Dosyalar

- `schema.sql` - Tüm veritabanı şeması (tablolar, indexler, RPC fonksiyonları)

## Önemli Ayarlar

### Realtime Subscriptions
Database > Replication sayfasından şu tabloları realtime'a ekleyin:
- `rooms`
- `players`
- `votes`
- `answers`

### Authentication
Settings > Authentication sayfasından Anonymous Sign-ins'i aktif edin.

### Environment Variables
`.env.local` dosyasına Supabase URL ve Anon Key ekleyin:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```
