import { Metadata } from 'next';
import { Suspense } from 'react';
import productsJsonData from '@/data/products.json';
import { Product } from '@/types/product';
import { siteConfig } from '@/config/site';
import { CatalogClient } from './CatalogClient';
import { ProductGridSkeleton } from '@/components/ProductCardSkeleton';

// ─── Meta / Open Graph ────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: `Katalog Produk Pupuk & Pertanian`,
  description: `Katalog lengkap pupuk kimia, organik, hayati, pestisida, dan nutrisi tanaman ${siteConfig.name}. Pesan mudah via WhatsApp.`,
  openGraph: {
    title: `Katalog Pupuk Terlengkap | ${siteConfig.name}`,
    description: `Temukan pupuk urea, NPK, organik, hayati, pestisida, dan nutrisi mikro terlengkap. Harga transparan, pesan via WhatsApp.`,
    type: 'website',
    locale: 'id_ID',
    siteName: siteConfig.name,
    images: [{ url: '/LOGO.png', width: 512, height: 512, alt: siteConfig.name }],
  },
  alternates: { canonical: '/produk' },
};

// ─── Server-side data fetch ───────────────────────────────────────────────────
import { rowToProduct } from '@/utils/productMapper';

export const dynamic = 'force-dynamic';

async function fetchProducts(): Promise<Product[]> {
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row) => rowToProduct(row));
    }
  } catch {
    // DB unavailable — fall through to static fallback
  }
  return productsJsonData as Product[];
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ProdukPage({
  searchParams,
}: {
  searchParams?: { kategori?: string };
}) {
  const products = await fetchProducts();
  const initialCategory = searchParams?.kategori || 'all';

  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProductGridSkeleton count={12} />
      </div>
    }>
      <CatalogClient products={products} initialCategory={initialCategory} />
    </Suspense>
  );
}
