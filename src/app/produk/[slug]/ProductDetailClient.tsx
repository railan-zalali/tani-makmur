'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import {
  ChevronLeft,
  Plus,
  Minus,
  ShoppingBag,
  MessageCircle,
  ShieldCheck,
  Truck,
  Sparkles,
  Info,
  CheckCircle2,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { Product } from '@/types/product';
import { formatRupiah } from '@/utils/formatters';
import { generateDirectProductWhatsAppUrl } from '@/utils/whatsapp';
import { useCart } from '@/context/CartContext';
import { ProductCard } from '@/components/ProductCard';
import { useCategories } from '@/context/CategoryContext';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({
  product,
  relatedProducts,
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const onThumbClick = useCallback((index: number) => {
    if (!emblaApi) return;
    emblaApi.scrollTo(index);
    setSelectedImage(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedImage(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const { addToCart } = useCart();
  const { getCategory } = useCategories();

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleDirectWhatsAppOrder = () => {
    const waUrl = generateDirectProductWhatsAppUrl(product, quantity);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const hasPrice = product.price > 0;
  const subtotal = product.price * quantity;
  const categoryLabel = getCategory(product.category)?.name || product.category;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-stone-500">
        <Link href="/" className="hover:text-tani-700 transition-colors">
          Beranda
        </Link>
        <span>/</span>
        <Link href="/produk" className="hover:text-tani-700 transition-colors">
          Katalog
        </Link>
        <span>/</span>
        <span className="text-stone-900 font-semibold truncate max-w-xs sm:max-w-md">
          {product.name}
        </span>
      </nav>

      {/* Main Product Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Product Images Gallery (Carousel) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Large Image Carousel */}
          <div className="overflow-hidden rounded-3xl border border-stone-200/90 shadow-sm bg-stone-100 relative group" ref={emblaRef}>
            <div className="flex touch-pan-y">
              {product.images.length > 0 ? (
                product.images.map((img, idx) => (
                  <div className="flex-[0_0_100%] min-w-0 relative aspect-square" key={idx}>
                    <Image
                      src={img}
                      alt={`${product.name} - slide ${idx + 1}`}
                      fill
                      priority={idx === 0}
                      className="object-cover"
                    />
                  </div>
                ))
              ) : (
                <div className="flex-[0_0_100%] min-w-0 relative aspect-square">
                  <Image src="/placeholder-product.jpg" alt={product.name} fill priority className="object-cover" />
                </div>
              )}
            </div>

            {/* Floating Tags */}
            {product.tag && (
              <div className="absolute top-4 left-4 z-10">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-harvest-500 text-stone-950 shadow-sm flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  <span>{product.tag}</span>
                </span>
              </div>
            )}
            <div className="absolute bottom-4 left-4 z-10">
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-stone-900/80 text-white backdrop-blur-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{product.stock_label}</span>
              </span>
            </div>
          </div>

          {/* Thumbnails (if multiple images) */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => onThumbClick(idx)}
                  type="button"
                  className={`relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer snap-center ${
                    selectedImage === idx
                      ? 'border-tani-600 ring-2 ring-tani-200 scale-95'
                      : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info & Action Card */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header info */}
          <div className="space-y-2">
            <span className="inline-block text-xs font-bold text-tani-700 bg-tani-50 border border-tani-200 px-3 py-1 rounded-full">
              {categoryLabel}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-snug">
              {product.name}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {product.short_desc}
            </p>
          </div>

          {/* Price Box */}
          <div className="p-4 sm:p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <div className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
              Harga Satuan
            </div>
            {hasPrice ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-tani-800">
                  {formatRupiah(product.price)}
                </span>
                <span className="text-sm font-bold text-stone-600">
                  / {product.unit}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-base sm:text-lg font-black text-stone-700">
                  Hubungi untuk konfirmasi harga
                </span>
              </div>
            )}
            <p className="text-[11px] text-emerald-700 font-semibold">
              ✓ Harga & stok dikonfirmasi langsung via WhatsApp
            </p>
            {product.weightKg && (
              <p className="text-[11px] text-stone-500 font-medium">
                Estimasi berat per item: ~{product.weightKg} kg
              </p>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Jumlah Pesanan:
              </label>
              {hasPrice && (
                <div className="text-xs text-stone-600">
                  Subtotal:{' '}
                  <span className="font-black text-stone-900 text-sm">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white border border-stone-300 rounded-2xl p-1 shadow-2xs">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  type="button"
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-stone-100 text-stone-600 active:scale-95 transition-colors cursor-pointer"
                  aria-label="Kurang satu"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-black text-stone-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  type="button"
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-stone-100 text-stone-600 active:scale-95 transition-colors cursor-pointer"
                  aria-label="Tambah satu"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs text-stone-500 font-medium">
                {product.unit}
              </span>
            </div>
          </div>

          {/* Action CTAs: Dual Ordering Options */}
          <div className="space-y-3 pt-2">
            {/* Direct WhatsApp Instant Order */}
            <button
              onClick={handleDirectWhatsAppOrder}
              type="button"
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-white/20" />
              <span>Pesan Sekarang via WhatsApp ({quantity} {product.unit})</span>
            </button>

            {/* Add to Multi-Item Cart */}
            <button
              onClick={handleAddToCart}
              type="button"
              className="w-full py-3.5 px-6 bg-white hover:bg-stone-50 text-stone-800 hover:text-tani-800 font-bold text-sm rounded-2xl border-2 border-stone-300 hover:border-tani-600 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isAdded ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-emerald-700">Sudah Masuk Keranjang!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-tani-700" />
                  <span>+ Tambah ke Keranjang Pesanan</span>
                </>
              )}
            </button>
          </div>

          {/* Guarantees / Service Notes */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-200 text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Produk Asli Resmi</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Bisa Kirim ke Sawah / Kebun</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Detailed Information (Description, Composition, Usage) */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-10 shadow-xs space-y-8">
        {/* Description */}
        <div>
          <h2 className="text-base sm:text-lg font-black text-stone-900 mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-tani-700" />
            <span>Deskripsi Produk Lengkap</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        {/* Composition & Nutrient Content */}
        <div className="pt-6 border-t border-stone-100">
          <h2 className="text-base sm:text-lg font-black text-stone-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-harvest-600" />
            <span>Kandungan & Komposisi Unsur Hara</span>
          </h2>
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/70 text-xs sm:text-sm font-semibold text-emerald-950">
            {product.composition}
          </div>
        </div>

        {/* Usage and Dosage Guidelines */}
        <div className="pt-6 border-t border-stone-100 space-y-4">
          <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-tani-700" />
            <span>Anjuran Pemakaian & Dosis Aplikasi</span>
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-stone-700">
            <div>
              <span className="font-bold text-stone-900 block mb-1">Cara Penggunaan:</span>
              <p className="leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
                {product.usage}
              </p>
            </div>
            {product.dosage && (
              <div>
                <span className="font-bold text-stone-900 block mb-1">Rekomendasi Dosis:</span>
                <p className="leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
                  {product.dosage}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Suitable Crops */}
        {product.suitableCrops && product.suitableCrops.length > 0 && (
          <div className="pt-6 border-t border-stone-100">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              Cocok Untuk Tanaman:
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.suitableCrops.map((crop, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-stone-100 text-stone-800 rounded-full text-xs font-bold border border-stone-200"
                >
                  🌱 {crop}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900">
              Produk Terkait Lainnya
            </h2>
            <Link
              href={`/produk?kategori=${product.category}`}
              className="text-xs sm:text-sm font-bold text-tani-700 hover:text-tani-900 flex items-center gap-1"
            >
              <span>Lihat Kategori Ini</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map((relProduct) => (
              <ProductCard key={relProduct.id} product={relProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
