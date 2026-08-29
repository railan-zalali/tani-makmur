import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  MessageCircle,
  Phone,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Store,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { siteConfig } from '@/config/site';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Tentang Kami — ${siteConfig.name}`,
  description: `Profil, alamat toko fisik, jam buka, dan kontak WhatsApp Toko Pupuk Tani Makmur.`,
};

export default function TentangPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-tani-900 via-tani-800 to-tani-950 rounded-3xl p-6 sm:p-12 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            <Store className="w-3.5 h-3.5 text-harvest-400" />
            <span>Profil & Informasi Resmi</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Tentang Toko Pupuk <br className="hidden sm:inline" />
            <span className="text-harvest-400">{siteConfig.shortName}</span>
          </h1>
          <p className="text-xs sm:text-base text-emerald-100/90 leading-relaxed font-normal">
            Dedikasi kami mendampingi para petani lokal menyediakan sarana produksi pertanian bermutu tinggi demi terwujudnya panen yang melimpah dan berkah.
          </p>
        </div>
      </div>

      {/* Story & Background */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-6 space-y-4">
          <div className="inline-flex items-center gap-1 text-xs font-bold text-tani-700 uppercase tracking-wider">
            <HeartHandshake className="w-4 h-4" />
            <span>Cerita Kami</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-snug">
            Sahabat Sejati Petani Sejak Lebih dari 10 Tahun
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-stone-600 leading-relaxed">
            <p>
              Toko Pupuk <strong>{siteConfig.name}</strong> bermula dari kepedulian terhadap para petani daerah yang sering kesulitan mendapatkan pupuk asli berkualitas dengan harga yang wajar dan transparan.
            </p>
            <p>
              Kami menyediakan aneka ragam kebutuhan pertanian secara lengkap: mulai dari pupuk makro primer (Urea, NPK, SP-36, ZA), pupuk hayati & organik perbaikan struktur tanah, nutrisi daun/bunga fase pembuahan, hingga perlindungan tanaman pestisida terdaftar resmi Kementerian Pertanian Republik Indonesia.
            </p>
            <p>
              Dengan hadirnya website katalog ini, kami ingin mempermudah petani mengecek ketersediaan produk dan harga sebelum memesan langsung lewat chat WhatsApp.
            </p>
          </div>

          <div className="pt-2">
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}?text=Halo%20Toko%20Tani%20Makmur%2C%20saya%20ingin%20konsultasi%20pupuk.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Hubungi Pemilik Toko via WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-xl border border-stone-200">
            <Image
              src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80"
              alt="Gudang dan Toko Pupuk Tani Makmur"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-xs font-bold text-harvest-400">Gudang & Toko Resmi</span>
              <p className="text-sm font-black">Stok Lengkap & Tersimpan Bersih</p>
            </div>
          </div>
        </div>
      </div>

      {/* Our 3 Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">100% Produk Asli & Terdaftar</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Tidak menjual produk oplosan atau palsu. Semua pupuk dan pestisida berasal dari distributor dan pabrik resmi dengan izin edar Kementan RI.
          </p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-harvest-100 text-harvest-800 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Layanan Antar ke Lokasi</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Bagi pemesanan partai sedang hingga besar, kami menyediakan armada antar langsung ke lokasi sawah, kebun, atau rumah Anda.
          </p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Konsultasi Dosis & Masalah Tani</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Bingung dosis pupuk atau ada tanaman menguning/terserang hama? Silakan konsultasi gratis dengan kami melalui WhatsApp.
          </p>
        </div>
      </div>

      {/* Store Location & Working Hours */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-10 shadow-xs space-y-8">
        <div className="border-b border-stone-100 pb-4">
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">
            Informasi Kunjungan Toko & Kontak
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Silakan datang langsung ke toko fisik kami atau hubungi kami lewat kontak di bawah ini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Address & Hours */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-tani-100 text-tani-800 rounded-2xl shrink-0 mt-0.5">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Alamat Toko:</h4>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed mt-1">
                  {siteConfig.address.full}
                </p>
                <a
                  href={siteConfig.address.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-tani-700 hover:text-tani-900 hover:underline mt-2"
                >
                  <span>Buka di Aplikasi Google Maps &rarr;</span>
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-harvest-100 text-harvest-800 rounded-2xl shrink-0 mt-0.5">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Jam Operasional Toko:</h4>
                <p className="text-xs sm:text-sm text-stone-700 font-semibold mt-1">
                  {siteConfig.operatingHours.weekdays}
                </p>
                <p className="text-xs sm:text-sm text-stone-600">
                  {siteConfig.operatingHours.weekend}
                </p>
                <p className="text-xs text-emerald-700 font-semibold mt-1">
                  *{siteConfig.operatingHours.note}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl shrink-0 mt-0.5">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">WhatsApp Resmi Toko:</h4>
                <p className="text-xs sm:text-sm text-stone-700 font-bold mt-1">
                  {siteConfig.whatsappDisplay}
                </p>
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline mt-1"
                >
                  <span>Mulai Chat Sekarang &rarr;</span>
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Map Embed / Guide */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Petunjuk Akses
              </span>
              <h3 className="text-base font-bold text-stone-900">
                Mudah Diakses Kendaraan & Truk
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Toko terletak persis di pinggir jalan raya utama pertanian dengan akses jalan lebar untuk mobil pick-up, truk muatan pupuk, maupun sepeda motor petani. Tersedia area parkir dan muat barang yang luas.
              </p>
            </div>

            <div className="p-4 bg-emerald-100/60 rounded-xl border border-emerald-200/80">
              <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Siap Melayani Konsultasi Langsung</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-normal">
                Bawalah sampel daun/tanaman yang bermasalah bila ingin berkonsultasi langsung di toko kami.
              </p>
            </div>

            <a
              href={siteConfig.address.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Buka Rute Navigasi Google Maps</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
