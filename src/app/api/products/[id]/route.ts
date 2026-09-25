export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

import { Product } from '@/types/product';

interface Ctx { params: { id: string } }

import { rowToProduct } from '@/utils/productMapper';

function authCheck(req: NextRequest) {
  return req.headers.get('x-admin-pin') === process.env.ADMIN_PIN;
}

import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', params.id).single();
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rowToProduct(data));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  if (!authCheck(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body: Product = await req.json();
    const updateData = {
      slug: body.slug, name: body.name, category: body.category, price: body.price, unit: body.unit,
      min_order: body.minOrder ?? null, stock_label: body.stock_label, is_available: body.isAvailable,
      featured: body.featured, tag: body.tag ?? null, weight_kg: body.weightKg ?? null,
      images: body.images, active_ingredients: body.activeIngredients ?? [],
      short_desc: body.short_desc, description: body.description, composition: body.composition,
      usage_text: body.usage, dosage: body.dosage ?? null, suitable_crops: body.suitableCrops ?? []
    };
    
    const { error } = await supabase.from('products').update(updateData).eq('id', params.id);
    if (error) throw error;
    
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!authCheck(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { error } = await supabase.from('products').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
