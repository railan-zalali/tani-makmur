'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Check, Eye, Tag, FlaskConical } from 'lucide-react';
import { Product } from '@/types/product';
import { formatRupiah } from '@/utils/formatters';
import { useCart } from '@/context/CartContext';
import { useCategories } from '@/context/CategoryContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { getCategory } = useCategories();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const cat = getCategory(product.category);
  const categoryBadge = { label: cat?.short_name || product.category, color: cat?.badge_color || 'bg-stone-100 text-stone-800' };
  const ingredients = product.activeIngredients ?? [];

  return (
    <div className="group bg-white rounded-2xl border border-stone-200/90 hover:border-tani-400/60 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Image Container */}
      <Link href={`/produk/${encodeURIComponent(product.slug)}`} className="block relative aspect-square w-full bg-stone-50 overflow-hidden">
        <Image
          src={product.images[0] || '/placeholder-product.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border shadow-xs backdrop-blur-xs ${categoryBadge.color}`}>
            {categoryBadge.label}
          </span>
          {product.tag && (
            <span className="text-[10px] sm:text-xs font-extrabold px-2 py-0.5 rounded-full bg-harvest-500 text-stone-950 shadow-xs flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              <span>{product.tag}</span>
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="absolute bottom-2 left-2 pointer-events-none">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-900/75 text-white backdrop-blur-xs flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${product.isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {product.stock_label}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col gap-2">
        {/* Name */}
        <Link href={`/produk/${encodeURIComponent(product.slug)}`}>
          <h3 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-2 hover:text-tani-700 transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Bahan Aktif chips */}
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <FlaskConical className="w-3 h-3 text-emerald-600 shrink-0" />
            {ingredients.slice(0, 2).map((ing) => (
              <span key={ing} className="text-[9px] sm:text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-semibold leading-none">
                {ing}
              </span>
            ))}
            {ingredients.length > 2 && (
              <span className="text-[9px] text-stone-400 font-semibold">+{ingredients.length - 2}</span>
            )}
          </div>
        )}

        <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed flex-1">
          {product.short_desc}
        </p>

        {/* Price & Actions */}
        <div className="pt-2 border-t border-stone-100">
          <div className="mb-2.5">
            <div className="text-sm sm:text-base font-black text-tani-800">
              {formatRupiah(product.price)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-stone-500 font-medium">
              per {product.unit}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5">
            <Link
              href={`/produk/${encodeURIComponent(product.slug)}`}
              className="hidden sm:flex items-center justify-center p-2 rounded-xl border border-stone-200 hover:border-tani-500 hover:bg-tani-50 text-stone-600 hover:text-tani-700 transition-colors"
              title="Lihat Detail"
            >
              <Eye className="w-4 h-4" />
            </Link>

            <button
              onClick={handleAddToCart}
              type="button"
              className={`sm:col-span-3 w-full py-2 sm:py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 min-h-[42px] cursor-pointer shadow-xs active:scale-95 ${
                isAdded
                  ? 'bg-emerald-700 text-white'
                  : 'bg-tani-700 hover:bg-tani-800 text-white'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Ditambahkan!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span className="truncate">+ Pesan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
