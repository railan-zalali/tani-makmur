'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface CategoryDef {
  id: string;
  name: string;
  short_name: string;
  description?: string;
  icon_name: string;
  badge_color: string;
  bg_color: string;
  icon_color: string;
  sort_order: number;
}

interface CategoryContextValue {
  categories: CategoryDef[];
  getCategory: (id: string) => CategoryDef | undefined;
  /** Reload from API — call after admin adds a new category */
  reload: () => void;
}

const FALLBACK: CategoryDef[] = [
  { id: 'pupuk-kimia',   name: 'Pupuk Kimia / Anorganik',         short_name: 'Kimia',         icon_name: 'FlaskConical', badge_color: 'bg-blue-100 text-blue-800 border-blue-200',       bg_color: 'bg-blue-50 group-hover:bg-blue-100',     icon_color: 'text-blue-700',   sort_order: 1 },
  { id: 'pupuk-organik', name: 'Pupuk Organik & Kompos',           short_name: 'Organik',       icon_name: 'Leaf',         badge_color: 'bg-emerald-100 text-emerald-800 border-emerald-200', bg_color: 'bg-emerald-50 group-hover:bg-emerald-100', icon_color: 'text-emerald-700', sort_order: 2 },
  { id: 'pupuk-cair',    name: 'Pupuk Hayati & Cair (POC)',        short_name: 'Cair / POC',    icon_name: 'Droplets',     badge_color: 'bg-teal-100 text-teal-800 border-teal-200',         bg_color: 'bg-teal-50 group-hover:bg-teal-100',     icon_color: 'text-teal-700',   sort_order: 3 },
  { id: 'pestisida',     name: 'Pestisida & Perlindungan Tanaman', short_name: 'Pestisida',     icon_name: 'Bug',          badge_color: 'bg-amber-100 text-amber-800 border-amber-200',       bg_color: 'bg-amber-50 group-hover:bg-amber-100',   icon_color: 'text-amber-700',  sort_order: 4 },
  { id: 'media-tanam',   name: 'Media Tanam & Pembenah Tanah',     short_name: 'Media Tanam',   icon_name: 'Layers',       badge_color: 'bg-stone-100 text-stone-800 border-stone-200',       bg_color: 'bg-stone-50 group-hover:bg-stone-100',   icon_color: 'text-stone-600',  sort_order: 5 },
  { id: 'nutrisi-mikro', name: 'Nutrisi Mikro & Kalsium',          short_name: 'Nutrisi Mikro', icon_name: 'Sparkles',     badge_color: 'bg-purple-100 text-purple-800 border-purple-200',    bg_color: 'bg-purple-50 group-hover:bg-purple-100', icon_color: 'text-purple-700', sort_order: 6 },
  { id: 'benih',         name: 'Benih & Bibit Tanaman',            short_name: 'Benih',         icon_name: 'Wheat',        badge_color: 'bg-yellow-100 text-yellow-800 border-yellow-200',    bg_color: 'bg-yellow-50 group-hover:bg-yellow-100', icon_color: 'text-yellow-700', sort_order: 7 },
];

// Unknown category fallback style
const UNKNOWN: Omit<CategoryDef, 'id' | 'name' | 'short_name'> = {
  icon_name: 'Package',
  badge_color: 'bg-stone-100 text-stone-800 border-stone-200',
  bg_color: 'bg-stone-50 group-hover:bg-stone-100',
  icon_color: 'text-stone-600',
  sort_order: 99,
};

const CategoryContext = createContext<CategoryContextValue>({
  categories: FALLBACK,
  getCategory: (id) => FALLBACK.find((c) => c.id === id),
  reload: () => {},
});

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<CategoryDef[]>(FALLBACK);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      if (res.ok) setCategories(await res.json());
    } catch {
      // keep fallback
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getCategory = useCallback(
    (id: string): CategoryDef => {
      const found = categories.find((c) => c.id === id);
      if (found) return found;
      // For unknown categories: derive name from id slug
      const name = id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return { id, name, short_name: name, ...UNKNOWN };
    },
    [categories]
  );

  return (
    <CategoryContext.Provider value={{ categories, getCategory, reload: load }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoryContext);
}
