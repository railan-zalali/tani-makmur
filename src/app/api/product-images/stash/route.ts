import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'product-images';
const STASH_FOLDER = 'stash';

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
    throw new Error('SUPABASE_SERVICE_ROLE_KEY harus service_role');
  }
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  if (req.headers.get('x-admin-pin') !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const supabase = getAdminSupabase();
    await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => null);

    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET)
      .list(STASH_FOLDER, { limit: 500, offset: 0, sortBy: { column: 'created_at', order: 'desc' } });

    if (listError) throw listError;

    const items = (files || []).filter((f) => !f.name.startsWith('.')).map((f) => {
      const path = `${STASH_FOLDER}/${f.name}`;
      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return {
        name: f.name,
        url: publicData.publicUrl,
        created_at: f.created_at,
        size: f.metadata?.size ?? null,
      };
    });

    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal mengambil stash';
    console.error('GET /api/product-images/stash error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (req.headers.get('x-admin-pin') !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('name');
    if (!fileName) {
      return NextResponse.json({ error: 'Name parameter required' }, { status: 400 });
    }
    const safeName = fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!safeName) {
      return NextResponse.json({ error: 'Name invalid' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const path = `${STASH_FOLDER}/${safeName}`;
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;

    return NextResponse.json({ ok: true, removed: path });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus stash';
    console.error('DELETE /api/product-images/stash error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
