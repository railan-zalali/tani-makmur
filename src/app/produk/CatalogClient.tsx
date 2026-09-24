'use client';

import React, { useState, useMemo } from 'react';
import { Sparkles, PackageOpen, ChevronDown } from 'lucide-react';
import { Product } from '@/types/product';
import { ProductCard } from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton';
import { SearchAndFilter } from '@/components/SearchAndFilter';

const PAGE_SIZE = 24; // produk per batch

interface CatalogClientProps {
  products: Product[];
  initialCategory: string;
}

export function CatalogClient({ products, initialCategory }: CatalogClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('popular');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Derive all unique bahan aktif from product list
  const allIngredients = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.activeIngredients?.forEach((ai) => set.add(ai)));
    return Array.from(set).sort();
  }, [products]);

  const toggleIngredient = (ing: string) =>
    setSelectedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );

  // Reset pagination whenever filter/sort changes
  const handleSetSearchQuery = (q: string) => { setSearchQuery(q); setVisibleCount(PAGE_SIZE); };
  const handleSetCategory = (c: string) => { setSelectedCategory(c); setVisibleCount(PAGE_SIZE); };
  const handleSetSort = (s: string) => { setSortBy(s); setVisibleCount(PAGE_SIZE); };
  const handleToggleIngredient = (ing: string) => { toggleIngredient(ing); setVisibleCount(PAGE_SIZE); };

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;

        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();
          if (
            !product.name.toLowerCase().includes(query) &&
            !product.description.toLowerCase().includes(query) &&
            !product.short_desc.toLowerCase().includes(query) &&
            !product.composition.toLowerCase().includes(query) &&
            !product.suitableCrops?.some((c) => c.toLowerCase().includes(query)) &&
            !product.activeIngredients?.some((ai) => ai.toLowerCase().includes(query))
          ) return false;
        }

        if (selectedIngredients.length > 0) {
          const productIngs = product.activeIngredients ?? [];
          if (!selectedIngredients.every((sel) => productIngs.includes(sel))) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, sortBy, selectedIngredients]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;
  const remaining = filteredProducts.length - visibleCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-tani-900 to-tani-800 rounded-3xl p-6 sm:p-10 text-white shadow-md">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Katalog Lengkap &amp; Terpercaya</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Katalog Produk Pupuk &amp; Pertanian
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Pilih kebutuhan pupuk, pestisida, dan nutrisi untuk tanaman padi, jagung, cabai, dan hortikultura Anda.
            Pesan via WhatsApp dalam hitungan detik.
          </p>
          <p className="text-[11px] text-emerald-200/70">
            {products.length} produk tersedia
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <SearchAndFilter
        searchQuery={searchQuery}
        setSearchQuery={handleSetSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={handleSetCategory}
        sortBy={sortBy}
        setSortBy={handleSetSort}
        totalResults={filteredProducts.length}
        allIngredients={allIngredients}
        selectedIngredients={selectedIngredients}
        toggleIngredient={handleToggleIngredient}
      />

      {/* Product Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex flex-col items-center gap-3 pt-4">
              <p className="text-xs text-stone-500">
                Menampilkan <span className="font-bold text-stone-800">{visibleCount}</span> dari{' '}
                <span className="font-bold text-stone-800">{filteredProducts.length}</span> produk
              </p>
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                type="button"
                className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 hover:border-tani-400 hover:bg-tani-50 text-stone-700 hover:text-tani-800 text-sm font-bold rounded-2xl transition-all shadow-xs hover:shadow-md active:scale-95"
              >
                <ChevronDown className="w-4 h-4" />
                Muat {Math.min(remaining, PAGE_SIZE)} Produk Lagi
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto text-stone-400">
            <PackageOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-stone-800">
              Produk Tidak Ditemukan
            </h3>
            <p className="text-xs text-stone-500">
              Tidak ada produk yang cocok dengan filter yang dipilih.
            </p>
          </div>
          <button
            onClick={() => {
              handleSetSearchQuery('');
              handleSetCategory('all');
              setSelectedIngredients([]);
            }}
            type="button"
            className="px-5 py-2.5 bg-tani-700 hover:bg-tani-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            Tampilkan Semua Produk
          </button>
        </div>
      )}
    </div>
  );
}
