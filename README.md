# FreshStore 🥬 — E-commerce Segar (Next.js + Supabase)

Website e-commerce jual kebutuhan segar (sayur, buah, daging, sembako) dengan tema **hijau-putih ala fresh market**. Tidak memerlukan server/database lokal sama sekali — database, file storage, dan auth semuanya di **Supabase**, siap deploy ke **Vercel** lewat **GitHub**.

## Arsitektur

```
Browser ──▶ Vercel (Next.js App Router, Server Actions)
                │
                ├──▶ Supabase Auth   (login/register, cookie session)
                ├──▶ Supabase DB    (PostgreSQL: products, categories, orders, profiles)
                └──▶ Supabase Storage (bucket 'product-images' untuk foto produk)
```

**File storage bersifat pluggable** (`lib/storage.js`): default Supabase Storage, cukup ubah 1 env var (`STORAGE_DRIVER=local`) untuk menyimpan file di disk server perusahaan (on-premise) — tanpa mengubah kode lain. Cocok jika website ini nanti dibeli/dijalankan di server lokal perusahaan.

## Fitur

| Area | Fitur |
|---|---|
| Toko | Hero, kategori, produk unggulan, katalog dengan pencarian + filter kategori + sort harga + pagination |
| Produk | Detail produk, produk terkait, badge stok/unggulan, `next/image` untuk performa |
| Keranjang | Context + localStorage, ubah kuantitas, total otomatis |
| Checkout | Form pengiriman, pesanan tersimpan ke tabel `orders` + `order_items`, stok berkurang otomatis, harga dihitung ulang di server |
| Akun | Profil + riwayat pesanan dengan status |
| Admin | Statistik (produk/pesanan/pelanggan/pendapatan), CRUD kategori, CRUD produk **dengan upload foto**, update status pesanan |
| Keamanan | Supabase Auth (RLS-ready), middleware proteksi `/admin` & `/account`, guard role admin di setiap server action |

## 1. Setup Supabase (sekali saja)

1. Buat project di [supabase.com](https://supabase.com) → **New project**.
2. Buka **SQL Editor**, jalankan seluruh script di bawah ini (schema + data awal + storage bucket):

```sql
-- ===== TABEL =====
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  role text not null default 'customer' check (role in ('admin','customer')),
  created_at timestamptz default now()
);

create table categories (
  id bigint generated always as identity primary key,
  name text unique not null,
  slug text unique not null,
  created_at timestamptz default now()
);

create table products (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  unit text not null default 'pcs',
  stock int not null default 0,
  category_id bigint references categories on delete set null,
  image_url text,
  is_featured boolean default false,
  created_at timestamptz default now()
);

create table orders (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete set null,
  customer_name text not null,
  phone text not null,
  address text not null,
  total numeric(14,2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending','paid','shipped','done','cancelled')),
  created_at timestamptz default now()
);

create table order_items (
  id bigint generated always as identity primary key,
  order_id bigint references orders on delete cascade,
  product_id bigint references products on delete set null,
  name text not null,
  price numeric(12,2) not null,
  qty int not null
);

-- Profil otomatis dibuat saat user mendaftar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, new.raw_user_meta_data->>'name');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== STORAGE BUCKET (publik untuk foto produk) =====
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);

create policy "Public read" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "Service write" on storage.objects for insert
  with check (bucket_id = 'product-images');

-- ===== DATA AWAL =====
insert into categories (name, slug) values
  ('Sayur Segar','sayur-segar'), ('Buah Segar','buah-segar'),
  ('Daging & Ikan','daging-ikan'), ('Sembako','sembako'),
  ('Minuman','minuman'), ('Snack','snack');

insert into products (name, description, price, unit, stock, category_id, image_url, is_featured) values
  ('Bayam Hijau Segar','Bayam petik pagi, kaya zat besi.', 5000, 'ikat', 50, 1, 'https://picsum.photos/seed/bayam/600/400', true),
  ('Tomat Merah','Tomat matang pohon, manis-asam segar.', 12000, 'kg', 40, 1, 'https://picsum.photos/seed/tomat/600/400', false),
  ('Kentang Granola','Kentang kualitas supermarket.', 15000, 'kg', 60, 1, 'https://picsum.photos/seed/kentang/600/400', false),
  ('Jeruk Peras Manis','Jeruk peras kaya vitamin C.', 25000, 'kg', 30, 2, 'https://picsum.photos/seed/jeruk/600/400', true),
  ('Pisang Cavendish','Pisang cavendish matang sempurna.', 32000, 'sisir', 25, 2, 'https://picsum.photos/seed/pisang/600/400', false),
  ('Ayam Broiler Utuh','Ayam potong segar, karkas bersih.', 38000, 'kg', 20, 3, 'https://picsum.photos/seed/ayam/600/400', true),
  ('Ikan Kembung','Ikan kembung segar hasil tangkapan nelayan.', 30000, 'kg', 15, 3, 'https://picsum.photos/seed/ikan/600/400', false),
  ('Beras Pandan Wangi 5kg','Beras pulen dan harum.', 72000, 'pack', 35, 4, 'https://picsum.photos/seed/beras/600/400', false),
  ('Minyak Goreng 2L','Minyak goreng 2x penyaringan.', 41000, 'pcs', 45, 4, 'https://picsum.photos/seed/minyak/600/400', false),
  ('Kopi Sachet isi 10','Kopi instan 3-in-1.', 15000, 'pack', 80, 5, 'https://picsum.photos/seed/kopi/600/400', false);
```

3. Buka **Authentication → Providers**, aktifkan Email. Untuk development, nonaktifkan **"Confirm email"** agar user langsung bisa login.

## 2. Environment Variables

**Development lokal** — buat `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...        # Settings → API → anon public
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...            # Settings → API → service_role (RAHASIA!)
STORAGE_DRIVER=supabase                            # atau 'local' untuk simpan di disk server
# LOCAL_UPLOAD_DIR=/var/www/uploads                # hanya jika STORAGE_DRIVER=local
```

**Production (Vercel)** — push ke GitHub, lalu di Vercel: **Project → Settings → Environment Variables** → tambahkan variabel yang sama → Vercel akan auto-deploy setiap `git push`. Koneksi GitHub–Vercel–Supabase berjalan penuh tanpa server lokal.

## 3. Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
```

**Membuat akun admin:** daftar seperti biasa lewat halaman `/login`, lalu di Supabase SQL Editor jalankan:

```sql
update profiles set role = 'admin' where id = (select id from auth.users where email = 'email-anda@mail.com');
```

Login kembali → menu **Admin** muncul di header.

## 4. Ganti Penyimpanan File ke Server Lokal (jika dibeli/dijalankan on-premise)

1. Set env: `STORAGE_DRIVER=local` (dan opsional `LOCAL_UPLOAD_DIR`)
2. Jalankan di server perusahaan (bukan Vercel, karena perlu disk tulis): `npm run build && npm start`
3. File foto produk otomatis tersimpan di `public/uploads` dan di-serve langsung oleh Next.js. Tidak ada perubahan kode sama sekali — semua lewat `lib/storage.js`.

## Struktur Proyek

```
freshstore/
├── app/
│   ├── layout.js / globals.css     # Layout global, tema hijau-putih
│   ├── page.js                     # Beranda: hero, kategori, unggulan, katalog+filter+pagination
│   ├── products/[id]/page.js       # Detail produk + terkait
│   ├── cart/page.js                # Keranjang + checkout (client)
│   ├── account/page.js             # Profil & riwayat pesanan
│   ├── login/page.js               # Login & daftar (Supabase Auth)
│   └── admin/page.js               # Dashboard: statistik, kategori, produk+upload, pesanan
├── components/
│   ├── Header.js  CartProvider.js  ProductCard.js  AddToCartButton.js
├── lib/
│   ├── supabase/server.js          # Klien cookie-aware + service-role
│   ├── storage.js                  # Abstraksi file: Supabase ⇄ disk lokal
│   └── actions.js                  # Server actions: auth, CRUD, checkout
└── middleware.js                   # Proteksi /admin & /account
```

## Roadmap Lanjutan (sesuai materi kursus)

- **Stripe** — sambungkan `placeOrder` dengan Stripe Checkout (Bab 10)
- **Grafik penjualan** — Recharts di dashboard admin (Bab 11)
- **Edit produk** — halaman edit dengan nilai default dinamis (Bab 7)
- **Prisma** — jika ingin ORM di atas PostgreSQL Supabase (Bab 6)
