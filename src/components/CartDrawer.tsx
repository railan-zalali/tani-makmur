'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, MessageCircle, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatRupiah } from '@/utils/formatters';
import { generateCartWhatsAppUrl } from '@/utils/whatsapp';
import { siteConfig } from '@/config/site';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalPrice,
    totalItems,
    customerName,
    customerNotes,
    setCustomerName,
    setCustomerNotes,
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return;

    setIsSubmitting(true);
    const waUrl = generateCartWhatsAppUrl(items, customerName, customerNotes);

    // Open WhatsApp link in new tab
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // Sesuai PRD Section 7.5: Keranjang di-clear setelah redirect WA
    setTimeout(() => {
      clearCart();
      setIsSubmitting(false);
      closeCart();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-tani-100 text-tani-800 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-stone-900">
                  Daftar Pesanan Pupuk
                </h2>
                <p className="text-xs text-stone-600">
                  {totalItems} item dipilih
                </p>
              </div>
            </div>

            <button
              onClick={closeCart}
              type="button"
              aria-label="Tutup keranjang"
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-8 h-8 text-stone-300" />
                </div>
                <h3 className="text-base font-bold text-stone-700 mb-1">
                  Keranjang Masih Kosong
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mb-6">
                  Pilih pupuk yang Anda butuhkan dari katalog produk kami untuk memesan via WhatsApp.
                </p>
                <button
                  onClick={closeCart}
                  type="button"
                  className="px-5 py-2.5 bg-tani-700 text-white text-xs font-bold rounded-xl hover:bg-tani-800 transition-colors shadow-xs"
                >
                  Jelajahi Produk
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Item Terpilih
                  </span>
                  <button
                    onClick={clearCart}
                    type="button"
                    className="text-xs text-red-700 hover:text-red-800 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex gap-3 items-center justify-between"
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0 border border-stone-200">
                        <Image
                          src={item.product.images[0] || 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80'}
                          alt={item.product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-stone-900 truncate mb-0.5">
                          {item.product.name}
                        </h4>
                        <div className="text-[11px] text-stone-500 mb-1">
                          {formatRupiah(item.product.price)} / {item.product.unit}
                        </div>
                        <div className="text-xs font-black text-tani-800">
                          Subtotal: {formatRupiah(item.product.price * item.quantity)}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-white border border-stone-300 rounded-xl p-1 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          type="button"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-600 active:scale-95 transition-colors"
                          aria-label="Kurang satu"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          type="button"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-600 active:scale-95 transition-colors"
                          aria-label="Tambah satu"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Optional Customer Information Fields */}
                <div className="pt-3 border-t border-stone-200 space-y-3">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                    Info Tambahan (Opsional)
                  </span>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nama Pemesan
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Pak Slamet / Kelompok Tani Subur"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-tani-500 focus:border-tani-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Catatan Pesanan / Alamat Kirim
                    </label>
                    <textarea
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Contoh: Tolong kirim ke Dusun Krajan RT 03 besok pagi"
                      rows={2}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-tani-500 focus:border-tani-500 resize-none"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer — WhatsApp CTA */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
                  <span>Total Item Dipilih</span>
                  <span className="font-bold text-stone-800">{totalItems} produk</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-snug bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  💬 Harga &amp; stok akan dikonfirmasi langsung oleh pemilik toko via WhatsApp.
                </p>
              </div>

              <button
                onClick={handleWhatsAppCheckout}
                disabled={isSubmitting}
                type="button"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                <MessageCircle className="w-5 h-5 fill-white/20" />
                <span>{isSubmitting ? 'Membuka WhatsApp...' : 'Pesan via WhatsApp'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
