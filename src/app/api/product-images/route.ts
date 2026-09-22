import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'product-images';

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) throw new Error('Supabase env belum lengkap');
  return createClient(url, key);
}

function safeFilePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'produk';
}

function parseImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-pin') !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const productId = String(form.get('productId') || '');
    const fileName = safeFilePart(String(form.get('fileName') || 'produk.webp'));
    const file = form.get('image');

    if (!productId || !(file instanceof File)) {
      return NextResponse.json({ error: 'Produk atau gambar belum dipilih' }, { status: 400 });
    }
    if (file.type !== 'image/webp') {
      return NextResponse.json({ error: 'File harus WebP' }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => null);

    const path = `${safeFilePart(productId)}/${Date.now()}-${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: 'image/webp', upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = publicData.publicUrl;

    const { data: row, error: readError } = await supabase
      .from('products')
      .select('images')
      .eq('id', productId)
      .single();

    if (readError) throw readError;

    const images = [...parseImages(row?.images), publicUrl];
    const { error: updateError } = await supabase
      .from('products')
      .update({ images })
      .eq('id', productId);

    if (updateError) throw updateError;

    return NextResponse.json({ url: publicUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload gambar gagal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
