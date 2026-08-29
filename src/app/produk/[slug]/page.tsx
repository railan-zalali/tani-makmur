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

// Normalise a DB row into a Product (mirrors API route logic)
// ponytail: duplicates rowToProduct in API route; acceptable — avoids self-HTTP fetch
function rowToProduct(row: Record<string, unknown>): Product {
  const parse = (v: unknown) => {
    if (Array.isArray(v)) return v;
    try { return JSON.parse(String(v || '[]')); } catch { return []; }
  };
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    category: row.category as Product['category'],
    price: Number(row.price) || 0,
    unit: String(row.unit ?? ''),
    minOrder: row.min_order != null ? Number(row.min_order) : undefined,
    stock_label: (row.stock_label as Product['stock_label']) ?? 'Tersedia',
    isAvailable: Boolean(row.is_available),
    featured: Boolean(row.featured),
    tag: row.tag ? String(row.tag) : undefined,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : undefined,
    images: parse(row.images),
    activeIngredients: row.active_ingredients ? parse(row.active_ingredients) : undefined,
    short_desc: String(row.short_desc ?? ''),
    description: String(row.description ?? ''),
    composition: String(row.composition ?? ''),
    usage: String(row.usage_text ?? ''),
    dosage: row.dosage ? String(row.dosage) : undefined,
    suitableCrops: row.suitable_crops ? parse(row.suitable_crops) : undefined,
  };
}

async function getProductBySlug(slug: string): Promise<Product | null> {
  // 1. Try static JSON first (fast, zero latency)
  const jsonProducts = productsData as Product[];
  const fromJson = jsonProducts.find((p) => p.slug === slug);
  if (fromJson) return fromJson;

  // 2. Try DB directly
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase.from('products').select('*').eq('slug', slug).single();
    if (data && !error) return rowToProduct(data);
  } catch {
    // DB unavailable
  }
  return null;
}

async function getRelatedProducts(product: Product): Promise<Product[]> {
  const jsonProducts = productsData as Product[];

  // Try JSON related first
  const fromJson = jsonProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);
  if (fromJson.length > 0) return fromJson;

  // Try DB
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase.from('products').select('*').eq('category', product.category).neq('id', product.id).limit(4);
    if (data) return data.map(rowToProduct);
  } catch {
    return [];
  }
  return [];
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
