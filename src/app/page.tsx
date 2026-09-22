import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  MessageCircle,
  Award,
  PhoneCall,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Star,
  Users,
  ShoppingBag,
} from 'lucide-react';
import productsData from '@/data/products.json';
import { CategoryGrid } from '@/components/CategoryGrid';
import { ProductCard } from '@/components/ProductCard';
import { siteConfig } from '@/config/site';
import { Product } from '@/types/product';


export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let products = productsData as Product[];
  
  // Try to fetch from DB first to get latest images/updates
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase.from('products').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true });
    
    if (data && data.length > 0) {
      const parse = (v: unknown) => {
        if (Array.isArray(v)) return v;
        try { return JSON.parse(String(v || '[]')); } catch { return []; }
      };
      
      products = data.map((row: any) => ({
        id: String(row.id),
        slug: String(row.slug),
        name: String(row.name),
        category: row.category as Product['category'],
        price: Number(row.price) || 0,
        unit: String(row.unit ?? ''),
        minOrder: row.min_order != null ? Number(row.min_order) : undefined,
        stock_label: (row.stock_label as Product['stock_label']) ?? 'Tersedia',
        isAvailable: Boolean(row.is_available),
        featured: Boolean(row.featured),
        tag: row.tag ? String(row.tag) : undefined,
        weightKg: row.weight_kg != null ? Number(row.weight_kg) : undefined,
        images: parse(row.images),
        activeIngredients: row.active_ingredients ? parse(row.active_ingredients) : undefined,
        short_desc: String(row.short_desc ?? ''),
        description: String(row.description ?? ''),
        composition: String(row.composition ?? ''),
        usage: String(row.usage_text ?? ''),
        dosage: row.dosage ? String(row.dosage) : undefined,
        suitableCrops: row.suitable_crops ? parse(row.suitable_crops) : undefined,
      }));
    }
  } catch {
    // fallback to json
  }

  const featuredProducts = products.filter((p) => p.featured).slice(0, 6);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. Hero Section */}
      <section className="relative bg-gradient-to-b from-tani-900 via-tani-800 to-tani-950 text-white overflow-hidden">
        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        {/* Subtle radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide animate-slide-up">
                <Star className="w-3.5 h-3.5 text-harvest-400 fill-harvest-400" />
                <span>Pusat Pupuk Pertanian Resmi &amp; Terlengkap</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Pupuk Berkualitas,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-harvest-300 via-harvest-400 to-emerald-400">
                  Hasil Panen
                </span>{' '}
                Maksimal.
              </h1>

              <p className="text-sm sm:text-lg text-emerald-100/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Katalog lengkap pupuk kimia, pupuk organik hayati, nutrisi daun, dan pestisida terpercaya. Pesan langsung ke pemilik toko via WhatsApp tanpa ribet.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                <Link
                  href="/produk"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-harvest-500 hover:bg-harvest-400 text-stone-950 font-black text-sm px-7 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 animate-pulse-glow"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Lihat Katalog Produk</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber}?text=Halo%20Toko%20Tani%20Makmur%2C%20saya%20ingin%20konsultasi%20pupuk.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-sm px-6 py-3.5 rounded-2xl border border-emerald-400/40 shadow-sm transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  <span>Konsultasi via WA</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-emerald-800/80 grid grid-cols-3 gap-2 text-center lg:text-left">
                <div className="animate-count-up" style={{ animationDelay: '0.1s' }}>
                  <div className="text-base sm:text-xl font-black text-harvest-400">{products.length}+</div>
                  <div className="text-[11px] sm:text-xs text-emerald-200">Produk Tersedia</div>
                </div>
                <div className="animate-count-up" style={{ animationDelay: '0.2s' }}>
                  <div className="text-base sm:text-xl font-black text-harvest-400">100%</div>
                  <div className="text-[11px] sm:text-xs text-emerald-200">Produk Asli Kementan</div>
                </div>
                <div className="animate-count-up" style={{ animationDelay: '0.3s' }}>
                  <div className="text-base sm:text-xl font-black text-harvest-400">Pesan Mudah</div>
                  <div className="text-[11px] sm:text-xs text-emerald-200">Langsung via WhatsApp</div>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md animate-float">
                <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl">
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-inner">
                    <Image
                      src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80"
                      alt="Petani panen padi subur makmur"
                      fill
                      priority
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-bold text-emerald-300">Stok Siap Kirim Hari Ini</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black leading-snug">
                        Toko Pupuk Tani Makmur
                      </h3>
                      <p className="text-xs text-stone-200">
                        Melayani pesanan petani perseorangan, gapoktan, dan toko pengecer.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating badge — produk count */}
                <div className="absolute -top-3 -right-3 bg-harvest-500 text-stone-950 rounded-2xl px-3 py-2 shadow-lg border-2 border-white animate-count-up">
                  <div className="text-lg font-black leading-none">{products.length}+</div>
                  <div className="text-[10px] font-bold">Produk</div>
                </div>

                {/* Floating badge — rating */}
                <div className="absolute -bottom-3 -left-3 bg-white text-stone-900 rounded-2xl px-3 py-2 shadow-lg border border-stone-100 flex items-center gap-1.5 animate-count-up" style={{ animationDelay: '0.2s' }}>
                  <Star className="w-4 h-4 text-harvest-500 fill-harvest-500" />
                  <div>
                    <div className="text-xs font-black leading-none">Terpercaya</div>
                    <div className="text-[10px] text-stone-500">Petani Bandung</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Category Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Kategori Produk Unggulan
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            Temukan berbagai jenis pupuk dan nutrisi sesuai fase pertumbuhan tanaman Anda.
          </p>
        </div>

        <CategoryGrid />
      </section>

      {/* 3. Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-tani-700 uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              <span>Rekomendasi Utama</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Produk Pilihan Petani
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Pupuk terlaris dan paling banyak dipesan petani daerah kami.
            </p>
          </div>

          <Link
            href="/produk"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-tani-700 hover:text-tani-900 group"
          >
            <span>Lihat Semua Produk ({products.length})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. How It Works — 3 Steps with visual connector */}
      <section className="bg-gradient-to-br from-stone-100 to-tani-50/40 py-12 sm:py-16 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold text-tani-700 uppercase tracking-wider">
              Mudah &amp; Tanpa Ribet
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Cara Pesan Pupuk via WhatsApp
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Pesan langsung ke pemilik toko dalam 3 langkah singkat tanpa perlu buat akun atau bayar online.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-10 left-[calc(33%-1px)] right-[calc(33%-1px)] h-0.5 bg-gradient-to-r from-tani-200 via-harvest-300 to-emerald-300 z-0" />

            {/* Step 1 */}
            <div className="relative bg-white p-6 rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow z-10">
              <div className="w-12 h-12 rounded-2xl bg-tani-100 border-2 border-tani-300 text-tani-800 font-black text-xl flex items-center justify-center mb-4 shadow-sm">
                1
              </div>
              <div className="w-8 h-1 bg-tani-400 rounded-full mb-3" />
              <h3 className="text-base font-bold text-stone-900 mb-2">
                Pilih Pupuk di Katalog
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Jelajahi produk di website, pilih pupuk yang dibutuhkan, dan atur jumlah sak/botol yang ingin dipesan.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white p-6 rounded-2xl border border-harvest-200/80 shadow-sm hover:shadow-md transition-shadow z-10">
              <div className="w-12 h-12 rounded-2xl bg-harvest-100 border-2 border-harvest-300 text-harvest-800 font-black text-xl flex items-center justify-center mb-4 shadow-sm">
                2
              </div>
              <div className="w-8 h-1 bg-harvest-400 rounded-full mb-3" />
              <h3 className="text-base font-bold text-stone-900 mb-2">
                Klik Pesan via WhatsApp
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Tekan tombol keranjang atau direct order. Format pesan pesanan otomatis sudah tersusun rapi dengan list produk.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white p-6 rounded-2xl border border-emerald-200/80 shadow-sm hover:shadow-md transition-shadow z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-emerald-800 font-black text-xl flex items-center justify-center mb-4 shadow-sm">
                3
              </div>
              <div className="w-8 h-1 bg-emerald-400 rounded-full mb-3" />
              <h3 className="text-base font-bold text-stone-900 mb-2">
                Konfirmasi &amp; Pengiriman
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Pemilik toko langsung mengonfirmasi ketersediaan stok dan mengatur jadwal antar atau ambil di toko.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Value Proposition */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 mb-1">100% Produk Asli</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Semua pupuk resmi dari pabrik terpercaya &amp; berizin Kementan.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="p-3 bg-blue-100 text-blue-800 rounded-xl shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 mb-1">Konsultasi Tani</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Bebas konsultasi dosis &amp; anjuran pemakaian gratis via WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="p-3 bg-harvest-100 text-harvest-800 rounded-xl shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 mb-1">Siap Antar ke Lahan</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Melayani pengiriman partai besar &amp; eceran ke sawah/kebun sekitar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="p-3 bg-purple-100 text-purple-800 rounded-xl shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 mb-1">Harga Bersahabat</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Harga transparan dan terjangkau untuk petani daerah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Store Visit / Location Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-tani-900 to-tani-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-400/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute right-20 bottom-0 w-32 h-32 bg-harvest-400/5 rounded-full translate-y-1/2 pointer-events-none" />

          <div className="space-y-3 text-center lg:text-left relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>Lokasi Toko Fisik</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black">
              Kunjungi Toko Pupuk Tani Makmur
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
              {siteConfig.address.full}. Kami siap melayani pembelian langsung di toko atau pemesanan antar via chat WhatsApp.
            </p>
            <div className="flex items-center justify-center lg:justify-start gap-3 text-xs text-stone-200 pt-1">
              <Clock className="w-4 h-4 text-harvest-400" />
              <span>{siteConfig.operatingHours.weekdays}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0 relative z-10">
            <Link
              href="/tentang"
              className="inline-flex items-center justify-center gap-2 bg-white text-stone-900 hover:bg-stone-100 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-sm transition-all active:scale-95"
            >
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Petunjuk Arah &amp; Detail</span>
            </Link>

            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}?text=Halo%20Toko%20Tani%20Makmur%2C%20apakah%20toko%20buka%20hari%20ini%3F`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-sm transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Hubungi via WA</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
