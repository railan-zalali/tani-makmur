import { Product } from '@/types/product';

export function rowToProduct(row: Record<string, unknown>): Product {
  const parse = (v: unknown) => {
    if (Array.isArray(v)) return v;
    try {
      return JSON.parse(String(v || '[]'));
    } catch {
      return [];
    }
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
