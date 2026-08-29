// Category IDs are stored in DB — no hardcoded union type needed.
// Any string from the categories table is valid.
export type ProductCategory = string;


export interface CategoryInfo {
  id: ProductCategory;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  iconName: string;
  badgeColor: string;
  accentBg: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  price: number;
  unit: string; // e.g. "sak (50kg)", "botol (1L)", "bungkus (500g)", "karung (10kg)"
  minOrder?: number;
  stock_label: "Tersedia" | "Stok Menipis" | "Pre-Order";
  isAvailable: boolean;
  images: string[];
  short_desc: string;
  description: string;
  composition: string;
  usage: string;
  dosage?: string;
  suitableCrops?: string[];
  featured: boolean;
  tag?: string; // e.g. "Terlaris", "Rekomendasi", "Organik 100%"
  weightKg?: number;
  activeIngredients?: string[]; // e.g. ["Nitrogen", "Fosfor", "Kalium"]
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface WhatsAppOrderData {
  items: CartItem[];
  customerName?: string;
  customerNotes?: string;
}
