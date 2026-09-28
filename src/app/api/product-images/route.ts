import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'product-images';
const STASH_FOLDER = 'stash';
const STASH_MAGIC_ID = '_stash_';

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL belum diatur');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY belum diatur di server');
  const [, payload] = key.split('.');
  const role = payload
    ? JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).role
    : '';
  if (role !== 'service_role') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY harus berisi service_role key, bukan anon/publishable key');
  }
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
    const useStashedUrl = String(form.get('useStashedUrl') || '');
    const fileName = safeFilePart(String(form.get('fileName') || 'produk.webp'));
    const file = form.get('image');

    const supabase = getAdminSupabase();
    await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => null);

    if (useStashedUrl) {
      if (!productId || productId === STASH_MAGIC_ID) {
        return NextResponse.json({ error: 'ProductId tidak valid untuk useStashedUrl' }, { status: 400 });
      }

      const { data: row, error: readError } = await supabase
        .from('products')
        .select('images')
        .eq('id', productId)
        .single();
      if (readError) throw readError;

      const images = [...parseImages(row?.images), useStashedUrl];
      const { error: updateError } = await supabase
        .from('products')
        .update({ images })
        .eq('id', productId);
      if (updateError) throw updateError;

      return NextResponse.json({ url: useStashedUrl });
    }

    if (!productId) {
      return NextResponse.json({ error: 'Produk atau gambar belum dipilih' }, { status: 400 });
    }

    const isStash = productId === STASH_MAGIC_ID;

    if (typeof file !== 'object' || file === null) {
      return NextResponse.json({ error: 'Gambar belum dipilih' }, { status: 400 });
    }
    const fileObj = file as Blob;
    if (fileObj.type !== 'image/webp') {
      return NextResponse.json({ error: 'File harus WebP' }, { status: 400 });
    }

    const folderPath = isStash ? STASH_FOLDER : safeFilePart(productId);
    const path = `${folderPath}/${Date.now()}-${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: 'image/webp', upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = publicData.publicUrl;

    if (isStash) {
      return NextResponse.json({ url: publicUrl, stashed: true });
    }

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
    console.error('POST /api/product-images error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
