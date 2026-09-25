export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

import { Product } from '@/types/product';

// Row shape from MySQL
interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: Product['category'];
  price: number;
  unit: string;
  min_order: number | null;
  stock_label: Product['stock_label'];
  is_available: number;
  featured: number;
  tag: string | null;
  weight_kg: number | null;
  images: string; // JSON string
  active_ingredients: string | null; // JSON string
  short_desc: string;
  description: string;
  composition: string;
  usage_text: string;
  dosage: string | null;
  suitable_crops: string | null; // JSON string
}

import { rowToProduct } from '@/utils/productMapper';

import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '1000', 10); // default high for backward compatibility

    let q = supabase.from('products').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true });

    if (category && category !== 'all') {
      q = q.eq('category', category);
    }
    if (featured === '1') {
      q = q.eq('featured', true);
    }

    if (limit && page) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      q = q.range(from, to);
    }

    const { data, error } = await q;
    if (error) throw error;
    
    return NextResponse.json(data.map(rowToProduct));
  } catch (err) {
    console.error('GET /api/products error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const pin = req.headers.get('x-admin-pin');
  if (pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: Product = await req.json();
    const insertData = {
      id: body.id, slug: body.slug, name: body.name, category: body.category, price: body.price, unit: body.unit,
      min_order: body.minOrder ?? null, stock_label: body.stock_label, is_available: body.isAvailable,
      featured: body.featured, tag: body.tag ?? null, weight_kg: body.weightKg ?? null,
      images: body.images, active_ingredients: body.activeIngredients ?? [],
      short_desc: body.short_desc, description: body.description, composition: body.composition,
      usage_text: body.usage, dosage: body.dosage ?? null, suitable_crops: body.suitableCrops ?? [], sort_order: 0
    };
    
    const { error } = await supabase.from('products').insert([insertData]);
    if (error) throw error;
    
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
