'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, PackageOpen } from 'lucide-react';
import productsJsonData from '@/data/products.json';
import { Product } from '@/types/product';
import { ProductCard } from '@/components/ProductCard';
import { SearchAndFilter } from '@/components/SearchAndFilter';

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('kategori') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('popular');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  // Try to fetch live products from API (MySQL); fall back to JSON if DB not yet set up
  const [products, setProducts] = useState<Product[]>(productsJsonData as Product[]);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (Array.isArray(data) && data.length > 0) setProducts(data); })
      .catch(() => {/* silently use JSON fallback */});
  }, []);

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

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;

        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();
          const matchName = product.name.toLowerCase().includes(query);
          const matchDesc = product.description.toLowerCase().includes(query);
          const matchShort = product.short_desc.toLowerCase().includes(query);
          const matchComp = product.composition.toLowerCase().includes(query);
          const matchCrops = product.suitableCrops?.some((c) => c.toLowerCase().includes(query));
          const matchIng = product.activeIngredients?.some((ai) => ai.toLowerCase().includes(query));
          if (!matchName && !matchDesc && !matchShort && !matchComp && !matchCrops && !matchIng) return false;
        }

        // Bahan aktif multi-select filter (product must have ALL selected)
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
            Pilih kebutuhan pupuk, pestisida, dan nutrisi untuk tanaman padi, jagung, cabai, dan hortikultura Anda. Pesan via WhatsApp dalam hitungan detik.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <SearchAndFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
        totalResults={filteredProducts.length}
        allIngredients={allIngredients}
        selectedIngredients={selectedIngredients}
        toggleIngredient={toggleIngredient}
      />

      {/* Product Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
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
              setSearchQuery('');
              setSelectedCategory('all');
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

export default function ProdukPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-stone-400">
          Memuat katalog produk...
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
