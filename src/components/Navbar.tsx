'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X, MessageCircle, Lock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { siteConfig } from '@/config/site';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/produk', label: 'Katalog Produk' },
    { href: '/tentang', label: 'Tentang Kami' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      {/* Top Banner for announcement / WhatsApp hotline */}
      <div className="bg-tani-800 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-flex items-center justify-center bg-harvest-500 text-stone-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
              INFO
            </span>
            <span className="hidden sm:inline">Penyedia Pupuk Asli & Berkualitas untuk Petani Indonesia</span>
            <span className="sm:hidden">Penyedia Pupuk Asli & Terlengkap</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-harvest-300 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WA: {siteConfig.whatsappDisplay}</span>
            </a>
            <span className="hidden md:inline text-stone-400">|</span>
            <span className="hidden md:inline text-stone-300">Buka: 07.00 - 17.00 WIB</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-hidden">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-xs border border-tani-200 bg-white flex items-center justify-center transition-transform group-hover:scale-105">
              <Image
                src="/LOGO.png"
                alt="Logo Tani Makmur"
                width={48}
                height={48}
                className="object-contain p-1"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-tight text-tani-900 group-hover:text-tani-700 transition-colors">
                TANI MAKMUR
              </span>
              <span className="text-[11px] text-stone-700 font-medium -mt-1 hidden sm:block">
                Pusat Pupuk & Nutrisi Tani
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? 'bg-tani-50 text-tani-800 border border-tani-200/80 shadow-xs'
                      : 'text-stone-700 hover:text-tani-700 hover:bg-stone-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/admin"
              className="px-3 py-2 rounded-lg text-xs font-semibold text-stone-400 hover:text-stone-700 hover:bg-stone-50 flex items-center gap-1 transition-all"
              title="Admin Panel"
            >
              <Lock className="w-3 h-3" />
              <span>Admin</span>
            </Link>
          </nav>

          {/* Action Buttons: Cart Button + WhatsApp CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Button */}
            <button
              onClick={openCart}
              type="button"
              aria-label="Buka Keranjang Pesanan"
              className="relative p-2.5 rounded-xl border border-stone-200 hover:border-tani-500 hover:bg-tani-50 text-stone-700 hover:text-tani-700 transition-all flex items-center gap-2 cursor-pointer group"
            >
              <ShoppingBag className="w-5 h-5 transition-transform group-hover:scale-110 text-stone-700 group-hover:text-tani-700" />
              <span className="hidden sm:inline text-xs font-bold">Pesanan</span>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-harvest-500 text-stone-950 font-black text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-xs border border-white animate-bounce-short">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Direct WhatsApp Callout Button */}
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}?text=Halo%20Toko%20Tani%20Makmur%2C%20saya%20ingin%20konsultasi%20pupuk.`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white/20" />
              <span>Chat Toko</span>
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              aria-label="Toggle menu"
              className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu — smooth slide */}
      <div
        className={`md:hidden bg-white border-b border-stone-200 overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-semibold ${
                  active
                    ? 'bg-tani-100 text-tani-900 border border-tani-300'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-stone-100">
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}?text=Halo%20Toko%20Tani%20Makmur%2C%20saya%20ingin%20konsultasi%20pupuk.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat WhatsApp Pemilik Toko</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
