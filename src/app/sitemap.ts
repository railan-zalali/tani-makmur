import { MetadataRoute } from 'next';
import productsJsonData from '@/data/products.json';
import { Product } from '@/types/product';
import { siteConfig } from '@/config/site';

// ponytail: slug list dari JSON + DB. Supabase call opsional — jika gagal, pakai JSON saja.
async function getAllSlugs(): Promise<string[]> {
  const jsonSlugs = (productsJsonData as Product[]).map((p) => p.slug);

  try {
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase.from('products').select('slug');
    if (data && data.length > 0) {
      const dbSlugs = data.map((r: { slug: string }) => r.slug);
      // Merge: DB overrides JSON, no duplicates
      return Array.from(new Set([...dbSlugs, ...jsonSlugs]));
    }
  } catch {
    // silently use JSON
  }
  return jsonSlugs;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || `https://${siteConfig.name.toLowerCase().replace(/\s+/g, '-')}.vercel.app`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllSlugs();

  const productUrls: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE_URL}/produk/${encodeURIComponent(slug)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/produk`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tentang`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...productUrls,
  ];
}
