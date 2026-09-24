import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import productsData from '@/data/products.json';
import { Product } from '@/types/product';
import { ProductDetailClient } from './ProductDetailClient';
import { siteConfig } from '@/config/site';

interface Props {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

import { rowToProduct } from '@/utils/productMapper';

async function getProductBySlug(rawSlug: string): Promise<Product | null> {
  // Next.js App Router may pass percent-encoded chars verbatim (e.g. %2C → ,).
  // Decode once so the DB query always sees the canonical slug.
  let slug = rawSlug;
  try { slug = decodeURIComponent(rawSlug); } catch { /* malformed %, keep raw */ }

  // 1. Try DB directly
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase.from('products').select('*').eq('slug', slug).single();
    if (data && !error) return rowToProduct(data);
  } catch {
    // DB unavailable or not found
  }

  // 2. Fallback to static JSON
  // ponytail: Keep fallback to not break SSG if DB fails
  const jsonProducts = productsData as Product[];
  const fromJson = jsonProducts.find((p) => p.slug === slug);
  if (fromJson) return fromJson;

  return null;
}

async function getRelatedProducts(product: Product): Promise<Product[]> {
  // Try DB first
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase.from('products').select('*').eq('category', product.category).neq('id', product.id).limit(4);
    if (data && data.length > 0) return data.map(rowToProduct);
  } catch {
    // silently continue
  }

  // Fallback to JSON
  const jsonProducts = productsData as Product[];
  const fromJson = jsonProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);
  return fromJson;
}

// Static params for JSON-based products (ensures fast SSG for those slugs)
export function generateStaticParams() {
  return (productsData as Product[]).map((p) => ({ slug: p.slug }));
}

// DB-based products are served dynamically at request time (dynamicParams default = true)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: 'Produk Tidak Ditemukan' };

  return {
    title: `${product.name} — ${siteConfig.name}`,
    description: product.short_desc,
    openGraph: {
      title: `${product.name} | ${siteConfig.name}`,
      description: product.short_desc,
      images: [{ url: product.images[0] || '/LOGO.png', width: 800, height: 600, alt: product.name }],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
