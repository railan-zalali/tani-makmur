export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';


// Default categories seeded from categories.json if DB table is empty
const DEFAULT_CATEGORIES = [
  { id: 'pupuk-kimia', name: 'Pupuk Kimia / Anorganik', short_name: 'Kimia', icon_name: 'FlaskConical', badge_color: 'bg-blue-100 text-blue-800 border-blue-200', bg_color: 'bg-blue-50 group-hover:bg-blue-100', icon_color: 'text-blue-700', sort_order: 1, description: 'Pupuk tunggal dan majemuk sintetis.' },
  { id: 'pupuk-organik', name: 'Pupuk Organik & Kompos', short_name: 'Organik', icon_name: 'Leaf', badge_color: 'bg-emerald-100 text-emerald-800 border-emerald-200', bg_color: 'bg-emerald-50 group-hover:bg-emerald-100', icon_color: 'text-emerald-700', sort_order: 2, description: 'Menyuburkan tanah dan ramah lingkungan.' },
  { id: 'pupuk-cair', name: 'Pupuk Hayati & Cair (POC)', short_name: 'Cair / POC', icon_name: 'Droplets', badge_color: 'bg-teal-100 text-teal-800 border-teal-200', bg_color: 'bg-teal-50 group-hover:bg-teal-100', icon_color: 'text-teal-700', sort_order: 3, description: 'Nutrisi cair cepat serap.' },
  { id: 'pestisida', name: 'Pestisida & Perlindungan Tanaman', short_name: 'Pestisida', icon_name: 'Bug', badge_color: 'bg-amber-100 text-amber-800 border-amber-200', bg_color: 'bg-amber-50 group-hover:bg-amber-100', icon_color: 'text-amber-700', sort_order: 4, description: 'Insektisida, fungisida, herbisida.' },
  { id: 'media-tanam', name: 'Media Tanam & Pembenah Tanah', short_name: 'Media Tanam', icon_name: 'Layers', badge_color: 'bg-stone-100 text-stone-800 border-stone-200', bg_color: 'bg-stone-50 group-hover:bg-stone-100', icon_color: 'text-stone-600', sort_order: 5, description: 'Tanah subur, sekam bakar, cocopeat.' },
  { id: 'nutrisi-mikro', name: 'Nutrisi Mikro & Kalsium', short_name: 'Nutrisi Mikro', icon_name: 'Sparkles', badge_color: 'bg-purple-100 text-purple-800 border-purple-200', bg_color: 'bg-purple-50 group-hover:bg-purple-100', icon_color: 'text-purple-700', sort_order: 6, description: 'Boron, kalsium, magnesium.' },
  { id: 'benih', name: 'Benih & Bibit Tanaman', short_name: 'Benih', icon_name: 'Wheat', badge_color: 'bg-yellow-100 text-yellow-800 border-yellow-200', bg_color: 'bg-yellow-50 group-hover:bg-yellow-100', icon_color: 'text-yellow-700', sort_order: 7, description: 'Benih unggul bersertifikat.' },
];

import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true }).order('id', { ascending: true });

    // Auto-seed defaults if table is empty
    if (!error && (!data || data.length === 0)) {
      await supabase.from('categories').insert(DEFAULT_CATEGORIES);
      return NextResponse.json(DEFAULT_CATEGORIES);
    }

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(DEFAULT_CATEGORIES);
  }
}

export async function POST(req: NextRequest) {
  const pin = req.headers.get('x-admin-pin');
  if (pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, short_name, description = '', icon_name = 'Package',
      badge_color = 'bg-stone-100 text-stone-800 border-stone-200',
      bg_color = 'bg-stone-50 group-hover:bg-stone-100',
      icon_color = 'text-stone-600', sort_order = 99 } = body;

    if (!id || !name || !short_name) {
      return NextResponse.json({ error: 'id, name, short_name wajib diisi' }, { status: 400 });
    }


    const { error } = await supabase.from('categories').upsert({
      id, name, short_name, description, icon_name, badge_color, bg_color, icon_color, sort_order
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const pin = req.headers.get('x-admin-pin');
  if (pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await req.json();
  await supabase.from('categories').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
