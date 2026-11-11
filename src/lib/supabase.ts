import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Next.js App Router meng-cache respons `fetch` di .next/cache/fetch-cache.
// Cache ini pernah membuat katalog menyajikan data produk BULANAN LALU
// (gambar yang diupload belakangan tidak muncul → placeholder),
// karena cache tidak pernah di-revalidate. Matikan caching untuk SEMUA
// panggilan Supabase agar katalog/detail/admin selalu membaca data terbaru.
const supabaseFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' });

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: supabaseFetch },
});
