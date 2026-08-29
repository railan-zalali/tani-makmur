'use client';

import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export const FloatingCartBtn: React.FC = () => {
  const { totalItems, openCart } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-40 animate-in slide-in-from-bottom-5 duration-300">
      <button
        onClick={openCart}
        type="button"
        className="group relative flex items-center gap-3 bg-tani-800 hover:bg-tani-900 active:scale-95 text-white pl-4 pr-5 py-3 rounded-full shadow-xl hover:shadow-2xl border-2 border-emerald-400/80 transition-all cursor-pointer"
        aria-label="Lihat keranjang pesanan"
      >
        <div className="relative">
          <div className="p-2 bg-emerald-600 rounded-full">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="absolute -top-1.5 -right-1.5 bg-harvest-500 text-stone-950 font-black text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-xs border border-white">
            {totalItems}
          </span>
        </div>

        <div className="text-left">
          <div className="text-[11px] text-emerald-200 font-bold uppercase tracking-wider leading-tight">
            Keranjang ({totalItems})
          </div>
          <div className="text-xs font-bold text-white leading-tight">
            Pesan via WhatsApp →
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform ml-1" />
      </button>
    </div>
  );
};
