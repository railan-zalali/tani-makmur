'use client';

import React from 'react';
import Link from 'next/link';
import {
  FlaskConical, Leaf, Droplets, Bug, Sprout, Atom, Wheat,
  Package, Layers, Sparkles,
} from 'lucide-react';
import { useCategories } from '@/context/CategoryContext';

// Icon map — only place to update when adding a new Lucide icon
// ponytail: icons must be code; all other category data lives in DB
const ICON_MAP: Record<string, React.ReactNode> = {
  FlaskConical: <FlaskConical className="w-6 h-6" />,
  Leaf:         <Leaf className="w-6 h-6" />,
  Droplets:     <Droplets className="w-6 h-6" />,
  Bug:          <Bug className="w-6 h-6" />,
  Sprout:       <Sprout className="w-6 h-6" />,
  Atom:         <Atom className="w-6 h-6" />,
  Wheat:        <Wheat className="w-6 h-6" />,
  Layers:       <Layers className="w-6 h-6" />,
  Sparkles:     <Sparkles className="w-6 h-6" />,
  Package:      <Package className="w-6 h-6" />, // fallback
};

export function CategoryGrid() {
  const { categories } = useCategories();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/produk?kategori=${cat.id}`}
          className="group p-4 bg-white rounded-2xl border border-stone-200 hover:border-tani-400/60 shadow-xs hover:shadow-md transition-all flex flex-col items-center text-center text-stone-800 hover:text-tani-800 hover:-translate-y-0.5"
        >
          <div className={`w-12 h-12 rounded-2xl ${cat.bg_color} ${cat.icon_color} flex items-center justify-center transition-all mb-3 group-hover:scale-110`}>
            {ICON_MAP[cat.icon_name] ?? ICON_MAP['Package']}
          </div>
          <span className="text-xs sm:text-sm font-bold leading-tight line-clamp-2">
            {cat.short_name}
          </span>
          <span className="text-[10px] text-stone-400 mt-1 group-hover:text-tani-600 transition-colors">
            Jelajahi →
          </span>
        </Link>
      ))}
    </div>
  );
}
