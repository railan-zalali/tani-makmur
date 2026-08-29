'use client';

import React, { useState } from 'react';
import { Search, X, ArrowUpDown, FlaskConical, ChevronDown } from 'lucide-react';
import categoriesData from '@/data/categories.json';

interface SearchAndFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  totalResults: number;
  allIngredients: string[];
  selectedIngredients: string[];
  toggleIngredient: (ing: string) => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  totalResults,
  allIngredients,
  selectedIngredients,
  toggleIngredient,
}) => {
  const [ingredientOpen, setIngredientOpen] = useState(false);

  const categories = [
    { id: 'all', name: 'Semua Produk', shortName: 'Semua' },
    ...categoriesData.map((c) => ({ id: c.id, name: c.name, shortName: c.shortName })),
  ];

  const handleClear = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('popular');
    selectedIngredients.forEach((ing) => toggleIngredient(ing));
  };

  const isFiltered =
    searchQuery !== '' ||
    selectedCategory !== 'all' ||
    sortBy !== 'popular' ||
    selectedIngredients.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Row: Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pupuk atau pestisida..."
            className="w-full pl-10 pr-10 py-2.5 bg-stone-50 hover:bg-white focus:bg-white text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-tani-600 focus:ring-2 focus:ring-tani-200 transition-all focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="relative w-full sm:w-48 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-stone-50 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-tani-600 focus:ring-2 focus:ring-tani-200 focus:outline-hidden font-medium text-stone-700 cursor-pointer appearance-none"
          >
            <option value="popular">Terpopuler</option>
            <option value="price-asc">Nama: A - Z</option>
            <option value="price-desc">Nama: Z - A</option>
            <option value="name-asc">A - Z</option>
            <option value="name-desc">Z - A</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-stone-400">
            <span className="text-[10px]">▼</span>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="pt-2 border-t border-stone-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider shrink-0 hidden sm:inline mr-1">
          Kategori:
        </span>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              type="button"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-tani-700 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {cat.shortName}
            </button>
          );
        })}
      </div>

      {/* Bahan Aktif Filter — Collapsible */}
      {allIngredients.length > 0 && (
        <div className="pt-2 border-t border-stone-100">
          {/* Toggle Header */}
          <button
            type="button"
            onClick={() => setIngredientOpen((v) => !v)}
            className="w-full flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Filter Bahan Aktif
              </span>
              {selectedIngredients.length > 0 && (
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {selectedIngredients.length} aktif
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${
                ingredientOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Collapsible content */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              ingredientOpen ? 'max-h-[400px] mt-3' : 'max-h-0'
            }`}
          >
            <div className="flex flex-wrap gap-1.5">
              {allIngredients.map((ing) => {
                const isSelected = selectedIngredients.includes(ing);
                return (
                  <button
                    key={ing}
                    onClick={() => toggleIngredient(ing)}
                    type="button"
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {isSelected && <span className="mr-1">✓</span>}
                    {ing}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results indicator & Clear Filter */}
      <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
        <div>
          Menampilkan <span className="font-bold text-stone-800">{totalResults}</span> produk
          {selectedCategory !== 'all' && (
            <span> dalam <span className="font-semibold text-tani-800">{categories.find(c => c.id === selectedCategory)?.name}</span></span>
          )}
          {selectedIngredients.length > 0 && (
            <span className="text-emerald-700 font-semibold"> · {selectedIngredients.length} bahan aktif</span>
          )}
        </div>

        {isFiltered && (
          <button
            onClick={handleClear}
            type="button"
            className="text-xs text-tani-700 hover:text-tani-900 font-bold hover:underline flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
