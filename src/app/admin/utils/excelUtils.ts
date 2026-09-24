import * as XLSX from 'xlsx';
import { Product } from '@/types/product';

// ─── Simple Excel format ──────────────────────────────────────────────────────
// Columns: name | category | price | unit | stock_label | activeIngredients | short_desc | composition | images
// Arrays separated by semicolon. Minimal fields only — admin fills required ones.

export function productsToSheet(products: Product[]) {
  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    unit: p.unit,
    stock_label: p.stock_label,
    featured: p.featured ? 'TRUE' : 'FALSE',
    tag: p.tag ?? '',
    activeIngredients: (p.activeIngredients ?? []).join('; '),
    short_desc: p.short_desc,
    composition: p.composition,
    dosage: p.dosage ?? '',
    images: (p.images ?? []).join('; '),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  // Set column widths for readability
  ws['!cols'] = [
    { wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
    { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 35 },
    { wch: 50 }, { wch: 40 }, { wch: 30 }, { wch: 60 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produk');
  return wb;
}

export function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

// Normalise free-text category from Excel → valid ProductCategory slug
export const CATEGORY_MAP: Record<string, Product['category']> = {
  // exact slugs
  'pupuk-kimia': 'pupuk-kimia',
  'pupuk-organik': 'pupuk-organik',
  'pupuk-cair': 'pupuk-cair',
  'pestisida': 'pestisida',
  'media-tanam': 'media-tanam',
  'nutrisi-mikro': 'nutrisi-mikro',
  // common free-text labels (what users type in Excel)
  'kimia': 'pupuk-kimia',
  'anorganik': 'pupuk-kimia',
  'pupuk kimia': 'pupuk-kimia',
  'pupuk anorganik': 'pupuk-kimia',
  'organik': 'pupuk-organik',
  'kompos': 'pupuk-organik',
  'pupuk organik': 'pupuk-organik',
  'pupuk organik & kompos': 'pupuk-organik',
  'cair': 'pupuk-cair',
  'poc': 'pupuk-cair',
  'hayati': 'pupuk-cair',
  'pupuk cair': 'pupuk-cair',
  'pupuk hayati': 'pupuk-cair',
  'pupuk hayati & cair (poc)': 'pupuk-cair',
  'cair / poc': 'pupuk-cair',
  'insektisida': 'pestisida',
  'fungisida': 'pestisida',
  'herbisida': 'pestisida',
  'pestisida & perlindungan tanaman': 'pestisida',
  'media': 'media-tanam',
  'tanah': 'media-tanam',
  'media tanam': 'media-tanam',
  'media tanam & pembenah tanah': 'media-tanam',
  'nutrisi': 'nutrisi-mikro',
  'mikro': 'nutrisi-mikro',
  'nutrisi mikro': 'nutrisi-mikro',
  'nutrisi mikro & kalsium': 'nutrisi-mikro',
  'kalsium': 'nutrisi-mikro',
  // benih
  'benih': 'benih',
  'bibit': 'benih',
  'benih & bibit tanaman': 'benih',
  'benih & bibit': 'benih',
  'seeds': 'benih',
  'seed': 'benih',
};

export function normalizeCategory(raw: unknown): Product['category'] {
  const key = String(raw ?? '').trim().toLowerCase();
  return CATEGORY_MAP[key] ?? (key as Product['category']) ?? 'pupuk-kimia';
}

export function inferCategory(row: Record<string, unknown>): Product['category'] {
  const explicit = String(row.category ?? '').trim();
  if (explicit) return normalizeCategory(explicit);

  const text = [
    row.name,
    row.tag,
    row.activeIngredients,
    row.short_desc,
    row.composition,
  ].map((v) => String(v ?? '').toLowerCase()).join(' ');

  if (text.includes('benih')) return 'benih';
  if (/klerat|racun tikus|brodifakum/.test(text)) return 'rodentisida';
  if (/toxiput|metaldehida|siput|keong/.test(text)) return 'moluskisida';
  if (/samite|piridaben/.test(text)) return 'akarisida';
  if (/trico|trichoderma/.test(text)) return 'fungisida-hayati';
  if (/agristick|glumon|metalik|perekat|perata/.test(text)) return 'perekat';
  if (/atonik|gib gro|giberelat|rootune|ambition|asam amino|fulvat|zpt|hormon/.test(text)) return 'zpt';
  if (/asam humat|dolomit|pembenah|poshmic|powersoil|kalsium magnesium karbonat/.test(text)) return 'pembenah tanah';
  if (/em 4|bakteri fermentasi/.test(text)) return 'pupuk-hayati';
  if (/boron|calnit|calsium|calcium|kalsium|magnesium|mikro|zn|fe|cu|mn|vitaflex|folirfos|mag - s|mag s/.test(text)) return 'pupuk-mikro';
  if (/gandasil/.test(text)) return 'pupuk-daun';
  if (/pupuk organik|molase|tetes tebu|bahan organik/.test(text)) return 'pupuk-organik';
  if (/npk|kcl|kno3|tsp|za |za non|nitrea|urea|fertiphos|ultradap|map|mkp|sop|kalium|fosfat|phosphate|phospat|amonium|nitrogen/.test(text)) return 'pupuk-kimia';
  return 'pupuk';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sheetRowToProduct(row: Record<string, any>): Product {
  const bool = (v: unknown) => String(v).toUpperCase() === 'TRUE' || v === true || v === 1;
  const arr = (v: unknown) =>
    String(v ?? '').trim()
      ? String(v).split(';').map((s) => s.trim()).filter(Boolean)
      : [];

  const name = String(row.name ?? '').trim();
  const id = row.id ? String(row.id).trim() : generateId(name);

  return {
    id,
    slug: id,
    name,
    category: inferCategory(row),
    price: Number(row.price) || 0,
    unit: String(row.unit ?? ''),
    stock_label: (row.stock_label as Product['stock_label']) ?? 'Tersedia',
    isAvailable: true,
    featured: bool(row.featured),
    tag: row.tag || undefined,
    weightKg: undefined,
    activeIngredients: arr(row.activeIngredients),
    images: arr(row.images),
    short_desc: String(row.short_desc ?? ''),
    description: String(row.description ?? row.short_desc ?? ''),
    composition: String(row.composition ?? ''),
    usage: String(row.usage ?? ''),
    dosage: row.dosage || undefined,
    suitableCrops: arr(row.suitableCrops),
  };
}
