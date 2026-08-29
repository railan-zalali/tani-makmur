import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, MessageCircle, Clock, ShieldCheck, Heart } from 'lucide-react';
import { siteConfig } from '@/config/site';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center">
                <Image
                  src="/LOGO.png"
                  alt="Logo Tani Makmur"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-white font-black text-lg tracking-tight">TANI MAKMUR</h3>
                <p className="text-xs text-stone-400 font-medium">Toko Pupuk & Nutrisi Pertanian</p>
              </div>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              {siteConfig.description}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-800/80 rounded-lg text-emerald-400 text-xs font-semibold border border-stone-700">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Produk Asli Terdaftar Resmi</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide uppercase">Navigasi Cepat</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/produk" className="hover:text-emerald-400 transition-colors">
                  Katalog Semua Pupuk
                </Link>
              </li>
              <li>
                <Link href="/produk?kategori=pupuk-kimia" className="hover:text-emerald-400 transition-colors">
                  Pupuk Kimia (Urea, NPK, SP36, ZA)
                </Link>
              </li>
              <li>
                <Link href="/produk?kategori=pupuk-organik" className="hover:text-emerald-400 transition-colors">
                  Pupuk Organik & Kompos
                </Link>
              </li>
              <li>
                <Link href="/produk?kategori=pupuk-cair" className="hover:text-emerald-400 transition-colors">
                  Pupuk Daun & Hayati Cair (POC)
                </Link>
              </li>
              <li>
                <Link href="/tentang" className="hover:text-emerald-400 transition-colors">
                  Tentang Toko & Lokasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Store Hours & Order Process */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide uppercase">Jam Operasional</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-harvest-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">{siteConfig.operatingHours.weekdays}</p>
                  <p className="text-stone-400">{siteConfig.operatingHours.weekend}</p>
                  <p className="text-emerald-400 text-[11px] mt-1">*{siteConfig.operatingHours.note}</p>
                </div>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-stone-800/60 rounded-xl border border-stone-700/60 text-xs">
              <p className="font-semibold text-stone-200 mb-1">Cara Pesan Sangat Mudah:</p>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                Pilih produk di website &rarr; klik tombol WhatsApp &rarr; pesan otomatis terkirim ke pemilik toko.
              </p>
            </div>
          </div>

          {/* Contact & Address */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide uppercase">Hubungi Kami</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-stone-300 leading-relaxed">
                  {siteConfig.address.full}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-bold hover:text-emerald-400 transition-colors"
                >
                  WhatsApp: {siteConfig.whatsappDisplay}
                </a>
              </li>
            </ul>
            <div className="mt-4">
              <a
                href={siteConfig.address.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg text-xs font-semibold transition-all border border-stone-700"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Buka di Google Maps</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright & notes */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. Hak Cipta Dilindungi.</p>
          <p className="flex items-center gap-1 text-[11px]">
            <span>Didedikasikan untuk kemakmuran petani Indonesia</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};
