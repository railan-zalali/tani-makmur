# PRD — Website Toko Pupuk
**Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-08-20  
**Author:** [Nama Tim]

---

## 1. Overview

Website katalog produk untuk toko pupuk. Pengunjung dapat menjelajahi produk, memilih beberapa item, lalu langsung memesan ke pemilik toko melalui WhatsApp dengan pesan yang sudah terisi otomatis.

**Tidak ada sistem pembayaran.** Semua transaksi diselesaikan secara manual oleh pemilik toko setelah menerima pesan WhatsApp.

---

## 2. Problem Statement

Toko pupuk saat ini mengandalkan komunikasi langsung (tatap muka / chat manual) untuk menerima pesanan. Pelanggan tidak memiliki referensi produk yang bisa diakses kapan saja, dan pemilik toko sering menerima pertanyaan berulang tentang jenis produk, harga, dan ketersediaan.

**Solusi:** Website katalog statis yang mengalihkan pesanan ke WhatsApp — tanpa kompleksitas backend, tanpa risiko payment gateway.

---

## 3. Goals

| Goal | Metrik Sukses |
|------|--------------|
| Tampilkan semua produk secara online | Semua produk terdaftar dan tampil di halaman katalog |
| Kurangi tanya-jawab manual pelanggan | Info produk lengkap tersedia di website |
| Permudah proses pemesanan | Pelanggan bisa kirim pesanan ke WA dalam < 3 klik |
| Mobile-first | Website bisa dipakai nyaman dari HP |

---

## 4. Out of Scope (versi ini)

- ❌ Payment gateway (transfer, QRIS, kartu kredit)
- ❌ Login / akun pelanggan
- ❌ Sistem stok real-time
- ❌ Admin dashboard / CMS
- ❌ Riwayat pesanan
- ❌ Notifikasi email / push notification

> **Catatan:** Fitur-fitur di atas bisa ditambahkan di iterasi berikutnya bila dibutuhkan.

---

## 5. Target Users

### Primary: Petani / Pelanggan Toko
- Usia 25–55 tahun
- Mayoritas akses via smartphone Android
- Tidak semua melek teknologi tinggi → UI harus simpel
- Ingin tahu harga dan jenis pupuk sebelum datang ke toko atau pesan

### Secondary: Pemilik Toko
- Menerima pesanan via WhatsApp yang sudah terstruktur
- Tidak perlu manage website setiap hari (produk relatif stabil)

---

## 6. User Stories

```
US-01  Sebagai pelanggan, saya ingin melihat semua produk pupuk beserta
       foto, nama, deskripsi, dan harga — agar saya bisa memilih sebelum
       menghubungi toko.

US-02  Sebagai pelanggan, saya ingin menambahkan beberapa produk ke
       "daftar pesanan" — agar saya bisa memesan lebih dari satu item
       sekaligus.

US-03  Sebagai pelanggan, saya ingin mengatur jumlah (qty) tiap produk
       yang ingin saya pesan.

US-04  Sebagai pelanggan, saya ingin menekan tombol "Pesan via WhatsApp"
       dan langsung diarahkan ke chat WA dengan pesan pesanan yang sudah
       terisi otomatis.

US-05  Sebagai pelanggan, saya ingin mencari atau menyaring produk
       berdasarkan kategori (pupuk organik, kimia, cair, dll).

US-06  Sebagai pelanggan, saya ingin melihat detail produk secara lengkap
       (foto besar, deskripsi, kandungan, anjuran pemakaian).

US-07  Sebagai pemilik toko, saya ingin pesan WA yang masuk sudah
       terstruktur (nama produk, qty, total estimasi) — agar mudah
       diproses.
```

---

## 7. Fitur & Spesifikasi

### 7.1 Halaman Beranda (`/`)

- Hero section: nama toko, tagline, tombol CTA "Lihat Produk"
- Section produk unggulan (featured) — 4–6 produk pilihan
- Section kategori produk (ikon + label)
- Info kontak toko (alamat, jam buka, nomor WA)

---

### 7.2 Halaman Katalog (`/produk`)

**Tampilan Produk:**
- Grid layout: 2 kolom (mobile) / 3–4 kolom (desktop)
- Tiap card menampilkan:
  - Foto produk
  - Nama produk
  - Kategori (badge)
  - Harga per satuan (Rp)
  - Satuan (kg, liter, sak, dll)
  - Tombol **"+ Tambah ke Pesanan"**

**Filter & Search:**
- Filter by kategori (tabs atau dropdown)
- Search bar by nama produk
- Sort: harga terendah / tertinggi, A–Z

---

### 7.3 Halaman Detail Produk (`/produk/:slug`)

- Foto produk (bisa lebih dari 1, swipeable di mobile)
- Nama produk
- Kategori
- Harga & satuan
- Deskripsi produk
- Kandungan / komposisi
- Anjuran pemakaian
- Input qty + tombol **"+ Tambah ke Pesanan"**
- Tombol **"Pesan Sekarang via WhatsApp"** (langsung 1 produk ini)

---

### 7.4 Keranjang Pesanan (Floating / Drawer)

> Bukan cart e-commerce penuh — ini hanya daftar item yang akan dikirim ke WA.

- Floating button di kanan bawah: ikon keranjang + badge jumlah item
- Tap → drawer/modal muncul dari bawah (mobile-friendly)
- Isi drawer:
  - List produk yang dipilih (nama, qty, harga satuan, subtotal)
  - Kontrol qty per item (+ / −) + tombol hapus item
  - Total estimasi harga (dengan label "estimasi, harga final dikonfirmasi toko")
  - Input opsional: nama pemesan, catatan pesanan
  - Tombol besar **"Pesan via WhatsApp"**

---

### 7.5 Alur WhatsApp Order

Saat pelanggan klik **"Pesan via WhatsApp"**, browser membuka:

```
https://wa.me/62XXXXXXXXXX?text=[pesan_terenkode]
```

**Format pesan otomatis:**

```
Halo Toko [Nama Toko] 👋

Saya ingin memesan produk berikut:

1. Pupuk Urea 50kg — 2 sak — Rp 280.000
2. Pupuk NPK Mutiara 25kg — 1 sak — Rp 175.000
3. Pupuk Organik Cair 1L — 3 botol — Rp 90.000

📦 Total estimasi: Rp 545.000

Nama: [opsional, dari input]
Catatan: [opsional]

Mohon konfirmasi ketersediaan dan harga final. Terima kasih! 🙏
```

**Rules:**
- Nomor WA dikonfigurasi di env variable / config file (bukan hardcode)
- Pesan di-encode dengan `encodeURIComponent()`
- Harga di pesan diberi label "estimasi" — harga final dari toko
- Keranjang di-clear setelah redirect WA

---

### 7.6 Halaman Tentang Toko (`/tentang`)

- Foto toko / tim
- Cerita singkat toko
- Alamat lengkap + Google Maps embed
- Jam operasional
- Nomor WA (clickable `wa.me` link)

---

## 8. Data Model (Produk)

Untuk versi ini, data produk bisa disimpan sebagai **JSON statis** (tidak butuh database).

```json
{
  "id": "pupuk-urea-50kg",
  "slug": "pupuk-urea-50kg",
  "name": "Pupuk Urea 50kg",
  "category": "pupuk-kimia",
  "price": 140000,
  "unit": "sak",
  "stock_label": "Tersedia",
  "images": ["urea-50kg-1.jpg", "urea-50kg-2.jpg"],
  "short_desc": "Pupuk nitrogen tinggi untuk pertumbuhan vegetatif tanaman.",
  "description": "...",
  "composition": "Nitrogen (N): 46%",
  "usage": "...",
  "featured": true
}
```

**Kategori produk (contoh):**
- `pupuk-kimia` — Pupuk Kimia / Anorganik
- `pupuk-organik` — Pupuk Organik
- `pupuk-cair` — Pupuk Cair
- `pestisida` — Pestisida & Herbisida
- `media-tanam` — Media Tanam

---

## 9. Tech Stack Rekomendasi

### Pilihan A — Paling Simpel (Recommended untuk MVP)

| Layer | Teknologi |
|-------|-----------|
| Frontend | **Next.js** (App Router) + Tailwind CSS |
| Data Produk | JSON file (lokal) atau Google Sheets via API |
| Hosting | Vercel (free tier cukup) |
| Gambar | Vercel Image Optimization / Cloudinary (free) |

> **Kenapa Next.js?** Static generation = cepat, SEO-friendly, hosting gratis di Vercel. Tidak butuh backend sama sekali untuk versi ini.

### Pilihan B — Lebih Sederhana Lagi

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML + CSS + Vanilla JS |
| Hosting | GitHub Pages / Netlify |

> Pilih B hanya jika tim tidak familiar dengan React.

---

## 10. Desain & UX Guidelines

### Visual
- **Warna utama:** Hijau (#2D7A3A atau sesuai brand toko) — identik dengan pertanian
- **Warna aksen:** Kuning/oranye untuk CTA utama
- **Font:** Inter atau Plus Jakarta Sans (clean, readable di mobile)
- **Foto produk:** Background putih / konsisten

### UX Principles
- **Mobile-first** — mayoritas user akses dari HP
- Tombol CTA minimal 44px height (accessible tap target)
- Keranjang selalu terlihat (floating, tidak tersembunyi di menu)
- Pesan WA harus langsung terbuka di app WhatsApp, bukan web
- Tidak ada form panjang — input sesimple mungkin

### Accessibility
- Alt text pada semua gambar produk
- Kontras warna minimal WCAG AA
- Navigasi bisa dengan keyboard

---

## 11. Pages Summary

| Route | Nama Halaman | Priority |
|-------|-------------|---------|
| `/` | Beranda | P0 |
| `/produk` | Katalog Semua Produk | P0 |
| `/produk/:slug` | Detail Produk | P0 |
| `/tentang` | Tentang Toko | P1 |

---

## 12. Non-Functional Requirements

| Aspek | Target |
|-------|--------|
| Page Speed (LCP) | < 2.5 detik di koneksi 4G |
| Mobile Responsive | 320px – 1440px |
| Browser Support | Chrome, Firefox, Safari (2 versi terakhir) |
| SEO | Meta title & description per halaman, Open Graph |
| Uptime | 99.9% (Vercel/Netlify handle ini) |

---

## 13. Milestones

| Phase | Deliverable | Est. Waktu |
|-------|------------|-----------|
| **Phase 1** | Setup project + data JSON produk + halaman katalog | 3–4 hari |
| **Phase 2** | Detail produk + keranjang + WhatsApp redirect | 3–4 hari |
| **Phase 3** | Beranda + halaman Tentang + polish UI | 2–3 hari |
| **Phase 4** | QA (mobile testing, WA flow test) + deploy | 1–2 hari |

**Total estimasi: ~2 minggu** (1 developer, part-time)

---

## 14. Open Questions

- [ ] Berapa jumlah produk yang akan ditampilkan saat launch? (menentukan apakah perlu pagination)
- [ ] Apakah harga produk sering berubah? (jika ya, pertimbangkan Google Sheets sebagai "CMS")
- [ ] Nomor WhatsApp toko yang akan digunakan?
- [ ] Apakah ada branding / logo yang sudah ada?
- [ ] Bahasa website: Indonesia saja, atau perlu dwibahasa?

---

## 15. Referensi

- WhatsApp Click to Chat API: https://faq.whatsapp.com/425247423114725
- Next.js Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com

---

*PRD ini adalah living document. Update setiap ada keputusan baru dari stakeholder.*
