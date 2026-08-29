import { NextRequest, NextResponse } from 'next/server';

import { Product } from '@/types/product';

import { supabase } from '@/lib/supabase';

// Bulk import: replaces all existing products
export async function POST(req: NextRequest) {
  const pin = req.headers.get('x-admin-pin');
  if (pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const products: Product[] = await req.json();
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'Empty product list' }, { status: 400 });
    }

    // Existing category IDs in DB
    const { data: existingRows } = await supabase.from('categories').select('id');
    const existingIds = new Set((existingRows || []).map(r => r.id));
    const newCategories = Array.from(new Set(products.map((p) => p.category))).filter(
      (id) => !existingIds.has(id)
    );

    for (const catId of newCategories) {
      const name = catId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      await supabase.from('categories').insert({
        id: catId, name, short_name: name, icon_name: 'Package',
        badge_color: 'bg-stone-100 text-stone-800 border-stone-200',
        bg_color: 'bg-stone-50 group-hover:bg-stone-100',
        icon_color: 'text-stone-600', sort_order: 99
      });
    }

    // Replace products: delete all then insert. (Without transactions, this is risky, but it matches the previous logic)
    // Supabase needs a filter to delete all, e.g. neq id something impossible, or just not eq null
    await supabase.from('products').delete().neq('id', 'impossible-id');
    
    const insertData = products.map((p, i) => ({
      id: p.id, slug: p.slug, name: p.name, category: p.category, price: p.price, unit: p.unit,
      min_order: p.minOrder ?? null, stock_label: p.stock_label, is_available: p.isAvailable,
      featured: p.featured, tag: p.tag ?? null, weight_kg: p.weightKg ?? null,
      images: p.images ?? [], active_ingredients: p.activeIngredients ?? [],
      short_desc: p.short_desc, description: p.description, composition: p.composition,
      usage_text: p.usage, dosage: p.dosage ?? null, suitable_crops: p.suitableCrops ?? [], sort_order: i
    }));
    
    await supabase.from('products').insert(insertData);

    return NextResponse.json({
      ok: true,
      imported: products.length,
      newCategories: newCategories.length > 0 ? newCategories : undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Import failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
