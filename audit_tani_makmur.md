# 🌾 Audit Sistem Tani Makmur — Senior Engineering Review

> **Tanggal Audit:** 24 September 2026  
> **Auditor:** Senior Engineer (AI)  
> **Scope:** Full codebase — arsitektur, keamanan, performa, DX, roadmap

---

## 📐 Arsitektur Sistem (As-Built)

```
Browser (Next.js 14 App Router, Client Components)
  ├── CartContext (localStorage persistence)
  ├── CategoryContext (API fetch + fallback)
  └── Pages: /, /produk, /produk/[slug], /tentang, /admin

API Routes (Edge-less, force-dynamic)
  ├── GET/POST /api/products       → Supabase PostgreSQL
  ├── GET      /api/categories     → Supabase PostgreSQL
  ├── POST     /api/product-images → Supabase Storage (service_role)
  ├── POST     /api/auth           → PIN check (env var)
  └── GET/PUT  /api/products/[id]  → CRUD produk

Storage: Supabase (PostgreSQL + Storage bucket "product-images")
Deploy: Vercel
```

**Gap vs PRD:** PRD mendesain JSON statis, implementasi sudah jauh melebihi itu — Supabase + Admin Panel + Image Upload. Ini positif, tapi ada tech debt yang perlu dibereskan.

---

## ✅ KELEBIHAN

### 1. Stack Pilihan Tepat
- **Next.js 14 App Router** — SSR/ISR ready, SEO-friendly, Vercel-optimized.
- **Supabase** — PostgreSQL hosted gratis, Storage built-in, tidak perlu kelola server sendiri.
- **TypeScript** — type safety ada, mencegah bug runtime.
- **Tailwind CSS** — konsisten, tidak ada CSS spaghetti.

### 2. Arsitektur Context yang Solid
- `CartContext` dengan **localStorage persistence** yang benar: guard `isInitialized` sebelum write mencegah race condition SSR vs client.
- `CategoryContext` punya **fallback hardcoded** yang elegant — kalau DB down, UI tetap berfungsi dengan kategori default.
- Kedua context meng-expose interface yang bersih dan tipe-nya lengkap.

### 3. Admin Dashboard Fitur Lengkap
Melampaui PRD (yang tidak membutuhkan admin panel sama sekali):
- ✅ PIN auth (sederhana tapi fungsional)
- ✅ Import Excel → produk (dengan inferensi kategori otomatis dari keyword!)
- ✅ Export Excel
- ✅ Upload gambar dengan **konversi WebP client-side** (hemat bandwidth)
- ✅ Watermark logo otomatis via Canvas 2D API
- ✅ Manajemen kategori dinamis
- ✅ Edit produk per-item

### 4. Image Processing yang Pintar
`imageUtils.ts` melakukan banyak hal dengan Canvas 2D murni:
- Konversi ke WebP + downscale (max 1200px) sebelum upload → hemat storage & bandwidth.
- Watermark dengan posisi fleksibel (9 posisi).
- Graceful fallback jika logo gagal dimuat — upload tetap jalan.
- Rotasi gambar sebelum upload.

### 5. WhatsApp Integration Bersih
`whatsapp.ts` — 3 fungsi terpisah untuk 3 use-case yang berbeda (cart, direct, consultation). Pesan sudah sesuai format PRD persis. `encodeURIComponent` dipakai dengan benar.

### 6. Dual Data Source (Resilient)
`/produk/page.tsx` fetch dari API, tapi **fallback ke JSON lokal** jika API gagal. User tidak pernah melihat halaman kosong meski DB down.

### 7. Category Inference Engine di Import Excel
`inferCategory()` di admin: regex matching 20+ pattern keyword untuk auto-assign kategori dari data Excel mentah. Ini kerja yang signifikan yang membantu pemilik toko impor data tanpa harus format manual.

---

## ❌ KEKURANGAN & RISIKO

### 🔴 KRITIS

#### K1. Keamanan Admin: PIN di sessionStorage, tidak ada rate-limit
```typescript
// auth/route.ts — tidak ada brute-force protection
if (pin === process.env.ADMIN_PIN) { return NextResponse.json({ ok: true }); }

// admin/page.tsx — PIN tersimpan plaintext di sessionStorage
sessionStorage.setItem('admin_pin', pinInput);
```
**Risiko:** Brute-force tak terbatas. PIN dari sessionStorage bisa dibaca JS lain (XSS). Seharusnya pakai httpOnly cookie + rate limiting.

#### K2. `mysql2` dependency yang tidak terpakai
```json
// package.json
"mysql2": "^3.23.4"  // ← terpasang tapi tidak dipakai (semua sudah pakai Supabase)
```
**Risiko:** Attack surface lebih lebar, bundle size lebih besar, bisa ada confusion.

#### K3. `images: { unoptimized: true }` di next.config.js
```javascript
images: { unoptimized: true, ... }  // ← mematikan Next.js Image Optimization!
```
**Risiko:** Gambar produk tidak di-optimize oleh Vercel. LCP target <2.5 detik dari PRD jadi lebih sulit dicapai. Ini seharusnya hanya dipakai untuk static export, bukan Vercel deployment.

#### K4. Service Role Key exposed risk
`/api/product-images/route.ts` menggunakan `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS). Ini dipakai di **server-side API route** yang benar — tapi kalau Supabase RLS belum dikonfigurasi di tabel `products`, maka **anon key dari browser juga bisa write langsung ke DB**.

---

### 🟡 SEDANG

#### S1. Admin page 1343 baris — God Component
`/admin/page.tsx` adalah 1 file dengan 1343 baris yang berisi: auth, product list, Excel import, image upload, category management, watermark config, seed data. Sulit di-maintain dan di-debug.

#### S2. Halaman Produk Catalog — `'use client'` penuh, tidak ada SSR/SSG
```typescript
// produk/page.tsx line 1
'use client';
// + fetch di useEffect
```
Semua produk di-fetch client-side setelah halaman render. SEO untuk halaman katalog kurang optimal (crawler tidak bisa baca produk). Idealnya pakai `generateStaticParams` atau Server Component.

#### S3. Tidak ada pagination / infinite scroll
Semua produk di-load sekaligus ke memory browser. Kalau produk >500 item, ini akan terasa lambat.

#### S4. `rowToProduct()` di products API route: dead code path
```typescript
// Fungsi rowToProduct() di products/route.ts masih ditulis untuk MySQL row format
// tapi data dari Supabase sudah dalam format yang berbeda (JSON arrays sudah parsed)
// dan fungsi ini tidak dipakai — data langsung di-pass: data.map(rowToProduct)
// tapi supabase sudah return parsed JSON, bukan string
```
Ada mismatch antara `ProductRow` interface (MySQL format dengan JSON string) vs data actual dari Supabase yang sudah parsed.

#### S5. `xlsx` library di dependencies production
```json
"xlsx": "^0.18.5"  // heavy library, hanya dipakai di admin page
```
Library ini ~600KB. Harusnya lazy-loaded atau dipindah ke admin-only bundle.

#### S6. Cart tidak disinkronkan saat produk diedit/dihapus
Jika admin mengedit harga produk, cart user yang masih open akan menampilkan harga lama sampai halaman di-refresh.

#### S7. Fallback gambar hardcode ke Unsplash external URL
```typescript
// CartDrawer.tsx line 130
src={item.product.images[0] || 'https://images.unsplash.com/...'}
```
External dependency yang bisa down/rate-limited. Seharusnya pakai placeholder lokal (`/placeholder.webp`).

---

### 🟢 MINOR / DX

#### M1. `CATEGORY_MAP` di admin page duplikat dengan `FALLBACK` di CategoryContext
Dua sumber kebenaran untuk kategori yang valid. Perlu disatukan.

#### M2. Tidak ada loading skeleton
Saat produk di-fetch, hanya ada teks "Memuat katalog...". Skeleton placeholder akan jauh lebih baik untuk UX.

#### M3. Admin edit produk (`/admin/edit/[id]`) — belum diaudit
Dari struktur direktori ada route ini tapi tidak sempat diaudit. Perlu dipastikan konsisten.

#### M4. `data/products.json` sebagai fallback — tidak diketahui seberapa fresh
Kalau JSON ini tidak diupdate saat admin edit produk di DB, fallback akan selalu stale.

---

## 📊 Scorecard

| Aspek | Nilai | Catatan |
|-------|-------|---------|
| Arsitektur | 7/10 | Solid untuk MVP, perlu decompose admin |
| Keamanan | 4/10 | PIN auth lemah, perlu hardening |
| Performa | 5/10 | `unoptimized: true` + no pagination |
| Kode Bersih | 6/10 | God component admin, dead code |
| Fitur Completeness | 8/10 | Jauh melebihi PRD |
| DX (Developer Experience) | 6/10 | TypeScript bagus, tapi sulit navigate admin |
| **Overall** | **6/10** | **Layak MVP, butuh hardening sebelum scale** |

---

## 🗺️ RENCANA PENGEMBANGAN (Roadmap)

### 🔥 Phase 1 — Security & Stability Fix (1–2 hari, HARUS sekarang)
> Ini wajib sebelum traffic nyata masuk.

1. **[K2] Hapus `mysql2`** dari `package.json` — `npm uninstall mysql2`
2. **[K3] Fix `unoptimized: true`** → hapus flag ini, tambahkan domain Supabase ke `remotePatterns` dengan benar
3. **[K1] Rate-limit `/api/auth`** — tambahkan in-memory counter (5 attempt / 15 menit) atau pakai Vercel Edge Middleware
4. **[K4] Verifikasi Supabase RLS** — pastikan `anon` role hanya bisa SELECT, tidak bisa INSERT/UPDATE/DELETE tabel `products`
5. **[S7] Buat `/public/placeholder.webp`** dan ganti fallback Unsplash hardcoded

---

### 🔧 Phase 2 — Performance & SEO (3–5 hari)
> Ini yang membuat website naik kelas.

1. **[S2] Convert `/produk` ke Server Component + Suspense streaming**
   - Ambil produk di server, hydrate di client untuk interaktivitas filter
   - Katalog bisa di-cache dan langsung dibaca crawler
2. **[S3] Infinite scroll / pagination** — implementasikan `LIMIT/OFFSET` di API dan render bertahap
3. **Open Graph + meta tags per produk** — `generateMetadata()` di `/produk/[slug]/page.tsx`
4. **Skeleton loading** untuk product grid (3–4 card placeholder animated)
5. **Sitemap** — `app/sitemap.ts` dengan semua slug produk untuk SEO

---

### 🏗️ Phase 3 — Code Quality & Maintainability (3–5 hari)
> Ini untuk kesehatan jangka panjang codebase.

1. **[S1] Pecah admin/page.tsx** menjadi:
   - `AdminProductsTab.tsx`
   - `AdminImportTab.tsx`
   - `AdminImagesTab.tsx`
   - `AdminCategoriesTab.tsx`
   - `useAdminAuth.ts` (hook)
2. **[M1] Satu sumber kebenaran kategori** — `CATEGORY_MAP` di admin ambil dari API, bukan hardcode lagi
3. **[S4] Fix `rowToProduct`** — hapus atau gunakan dengan benar (align ke format Supabase)
4. **[M4] Update `data/products.json`** otomatis saat admin save, atau hapus fallback ini entirely

---

### 🚀 Phase 4 — Fitur Baru Bernilai Tinggi (1–3 minggu)
> Berdasarkan analisis bisnis, ini yang paling berdampak ke revenue toko.

#### 4A. Analitik Sederhana (HIGH VALUE)
Track berapa kali tombol "Pesan via WhatsApp" diklik per produk. Data ini bisa: identifikasi produk terlaris, bantu pricing decision, dan meyakinkan owner bahwa website memberikan nilai.
- Implementasi: tambah kolom `wa_click_count` di tabel `products`, increment via API route saat tombol diklik
- Admin bisa lihat chart sederhana "Produk Paling Sering Dipesan"

#### 4B. PWA / Offline Support (HIGH VALUE untuk petani di daerah)
Petani di daerah sering punya koneksi tidak stabil. Dengan Service Worker + manifest.json, website bisa:
- Di-install ke homescreen Android (tanpa Play Store)
- Cache katalog produk untuk browsing offline
- Ukuran effort: 1 hari untuk manifest + basic SW

#### 4C. Share Produk / Keranjang (MEDIUM VALUE)
Tombol share di halaman detail produk: generate URL dengan produk sudah pre-filled di keranjang. Petani bisa forward link ke sesama atau ke petugas tani.
- `?cart=produk-a:2,produk-b:1` di URL → auto-fill keranjang

#### 4D. Riwayat Pesanan WhatsApp (MEDIUM VALUE)
Sebelum clear cart, simpan snapshot pesanan ke localStorage dengan timestamp. Halaman `/riwayat` yang ringan — murni client-side, tidak butuh auth, tidak butuh backend.
- User bisa lihat "pesanan terakhir" dan repeat order dengan 1 klik

#### 4E. Multi-Foto Swipeable di Detail Produk (LOW EFFORT, HIGH UX)
Jika produk punya >1 gambar, tampilkan carousel swipeable di mobile. Data sudah ada (field `images: string[]`), tinggal komponen presentasinya.

---

### 📋 Summary Prioritas

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 🔴 P0 | Security fix (K1, K2, K3, K4) | 0.5 hari | Kritis |
| 🔴 P0 | Fix placeholder image | 1 jam | Stability |
| 🟡 P1 | Server Component untuk /produk | 1 hari | SEO + Performa |
| 🟡 P1 | Pecah admin page | 1 hari | Maintainability |
| 🟡 P1 | Open Graph meta tags | 0.5 hari | SEO |
| 🟢 P2 | PWA manifest | 0.5 hari | Mobile UX |
| 🟢 P2 | Analitik WA clicks | 1 hari | Business insight |
| 🟢 P2 | Skeleton loading | 0.5 hari | Perceived performance |
| ⚪ P3 | Share produk via URL | 1 hari | Virality |
| ⚪ P3 | Riwayat pesanan (localStorage) | 1 hari | Retention |
| ⚪ P3 | Multi-foto swipeable | 1 hari | UX |

---

*Audit ini berdasarkan snapshot kode pada 24 September 2026.*
