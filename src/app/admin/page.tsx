'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Lock, ShieldCheck, LogOut, Upload, Download, RefreshCw,
  Trash2, Check, PackageOpen, FileSpreadsheet,
  AlertTriangle, Eye, EyeOff, Database, Pencil, Tags, Plus, X, ImageIcon
} from 'lucide-react';
import { Product } from '@/types/product';
import Link from 'next/link';
import { useCategories, CategoryDef } from '@/context/CategoryContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'products' | 'images' | 'import' | 'seed' | 'kategori';

type PendingProductImage = {
  id: string;
  name: string;
  previewUrl: string;
  blob: Blob;
};

// ─── Simple Excel format ──────────────────────────────────────────────────────
// Columns: name | category | price | unit | stock_label | activeIngredients | short_desc | composition | images
// Arrays separated by semicolon. Minimal fields only — admin fills required ones.

function productsToSheet(products: Product[]) {
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

function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

function fileBaseName(name: string) {
  return name.replace(/\.[^.]+$/, '');
}

function webpName(name: string) {
  return `${generateId(fileBaseName(name)) || 'produk'}.webp`;
}

function convertImageToWebp(file: File): Promise<PendingProductImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const sourceUrl = URL.createObjectURL(file);
    img.onload = () => {
      const maxSide = 1200;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(sourceUrl);
        reject(new Error('Browser tidak bisa memproses gambar ini'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(sourceUrl);
        if (!blob) {
          reject(new Error(`Gagal mengubah ${file.name} ke WebP`));
          return;
        }
        resolve({
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          name: webpName(file.name),
          previewUrl: URL.createObjectURL(blob),
          blob,
        });
      }, 'image/webp', 0.82);
    };
    img.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error(`${file.name} bukan gambar yang valid`));
    };
    img.src = sourceUrl;
  });
}

// Normalise free-text category from Excel → valid ProductCategory slug
const CATEGORY_MAP: Record<string, Product['category']> = {
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

function normalizeCategory(raw: unknown): Product['category'] {
  const key = String(raw ?? '').trim().toLowerCase();
  // Return the mapped value, or the original slug if it's already a known category id,
  // or fall back to 'pupuk-kimia' only if truly unrecognized.
  // ponytail: explicit over silent – unknown categories fall back but admin sees it in preview
  return CATEGORY_MAP[key] ?? (key as Product['category']) ?? 'pupuk-kimia';
}

function inferCategory(row: Record<string, unknown>): Product['category'] {
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
function sheetRowToProduct(row: Record<string, any>): Product {
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

// ─── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Import state
  const [importPreview, setImportPreview] = useState<Product[]>([]);
  const [importFilename, setImportFilename] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);

  // Seed state
  const [seeding, setSeeding] = useState(false);

  // Product image state
  const [pendingImages, setPendingImages] = useState<PendingProductImage[]>([]);
  const [draggedImageId, setDraggedImageId] = useState('');
  const [selectedImageId, setSelectedImageId] = useState('');
  const [imageSearch, setImageSearch] = useState('');
  const [savingImageFor, setSavingImageFor] = useState('');

  // Category state
  const { categories, reload: reloadCategories } = useCategories();
  const [newCat, setNewCat] = useState<Partial<CategoryDef>>({ icon_name: 'Package', badge_color: 'bg-stone-100 text-stone-800 border-stone-200', bg_color: 'bg-stone-50 group-hover:bg-stone-100', icon_color: 'text-stone-600', sort_order: 99 });
  const [savingCat, setSavingCat] = useState(false);

  const flash = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(''), 5000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); }
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Gagal memuat produk dari database');
      setProducts(await res.json());
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Error', true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadProducts();
  }, [isAuthenticated, loadProducts]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = () => {
    if (!pinInput.trim()) { setPinError('Masukkan PIN admin'); return; }
    setPin(pinInput);
    sessionStorage.setItem('admin_pin', pinInput);
    setIsAuthenticated(true);
    setPinError('');
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus produk "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': pin },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      flash('Produk berhasil dihapus');
      loadProducts();
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Gagal menghapus', true);
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const wb = productsToSheet(products);
    XLSX.writeFile(wb, `tanimakmur-produk-${new Date().toISOString().slice(0, 10)}.xlsx`);
    flash('File Excel berhasil diunduh');
  };

  // ── Download Template ─────────────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    // Template dengan 2 contoh baris supaya admin tau formatnya
    const example: Product[] = [
      {
        id: '', slug: '', name: 'Pupuk Urea 50kg', category: 'pupuk-kimia',
        price: 140000, unit: 'sak (50kg)', stock_label: 'Tersedia',
        isAvailable: true, featured: true, tag: 'Terlaris',
        activeIngredients: ['Nitrogen (N)'],
        images: ['https://contoh-url-gambar.jpg'],
        short_desc: 'Deskripsi singkat produk di sini',
        description: '', composition: 'Nitrogen (N): 46%',
        usage: '', dosage: '200-250 kg/ha',
      },
      {
        id: '', slug: '', name: 'Pupuk NPK 16-16-16', category: 'pupuk-kimia',
        price: 425000, unit: 'sak (50kg)', stock_label: 'Tersedia',
        isAvailable: true, featured: false, tag: '',
        activeIngredients: ['Nitrogen (N)', 'Fosfor (P)', 'Kalium (K)'],
        images: ['https://contoh-url-gambar-2.jpg'],
        short_desc: 'Deskripsi singkat produk kedua',
        description: '', composition: 'N: 16% | P: 16% | K: 16%',
        usage: '', dosage: '',
      },
    ];
    const wb = productsToSheet(example);
    XLSX.writeFile(wb, 'template-produk-tanimakmur.xlsx');
    flash('Template Excel berhasil diunduh');
  };

  // ── Excel Parse ────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws);
        setImportPreview(rows.map(sheetRowToProduct));
      } catch {
        flash('File Excel tidak valid atau format tidak sesuai template', true);
      }
    };
    reader.readAsBinaryString(file);
  };

  // ── Import to DB ──────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!importPreview.length) return;
    if (!confirm(`Import ${importPreview.length} produk? Data lama akan digantikan sepenuhnya.`)) return;
    setImporting(true);
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify(importPreview),
      });
      if (!res.ok) {
        const body = await res.json();
        if (res.status === 401) throw new Error('PIN salah. Silakan logout dan login ulang.');
        throw new Error(body.error);
      }
      const { imported } = await res.json();
      flash(`${imported} produk berhasil diimpor ke database`);
      setImportPreview([]);
      setImportFilename('');
      if (fileRef.current) fileRef.current.value = '';
      setActiveTab('products');
      loadProducts();
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Import gagal', true);
    } finally {
      setImporting(false);
    }
  };

  const handleProductImages = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      flash('Pilih file gambar JPG, PNG, atau WebP', true);
      return;
    }

    try {
      const converted = await Promise.all(imageFiles.map(convertImageToWebp));
      setPendingImages((prev) => [...prev, ...converted]);
      flash(`${converted.length} gambar siap ditempel ke produk`);
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Gagal memproses gambar', true);
    } finally {
      if (imageFileRef.current) imageFileRef.current.value = '';
    }
  };

  const attachImageToProduct = async (product: Product, imageId: string) => {
    const image = pendingImages.find((item) => item.id === imageId);
    if (!image) return;

    setSavingImageFor(product.id);
    try {
      const form = new FormData();
      form.append('productId', product.id);
      form.append('fileName', image.name);
      form.append('image', image.blob, image.name);

      const res = await fetch('/api/product-images', {
        method: 'POST',
        headers: { 'x-admin-pin': pin },
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Upload gambar gagal');

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, images: [...(item.images ?? []), body.url] }
            : item
        )
      );
      setPendingImages((prev) => prev.filter((item) => item.id !== image.id));
      URL.revokeObjectURL(image.previewUrl);
      if (selectedImageId === image.id) setSelectedImageId('');
      flash(`Gambar ditambahkan ke ${product.name}`);
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Gagal menyimpan gambar', true);
    } finally {
      setSavingImageFor('');
      setDraggedImageId('');
    }
  };

  // ── Seed from JSON ────────────────────────────────────────────────────────
  const handleSeed = async () => {
    if (!confirm('Seed produk dari file JSON default ke database? Data lama akan digantikan.')) return;
    setSeeding(true);
    try {
      const { default: localProducts } = await import('@/data/products.json');
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify(localProducts),
      });
      if (!res.ok) {
        const body = await res.json();
        if (res.status === 401) throw new Error('PIN salah. Silakan logout dan login ulang.');
        throw new Error(body.error);
      }
      const { imported } = await res.json();
      flash(`${imported} produk berhasil di-seed ke database`);
      setActiveTab('products');
      loadProducts();
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Seed gagal', true);
    } finally {
      setSeeding(false);
    }
  };

  // ─── Login Screen ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tani-950 via-tani-900 to-tani-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-tani-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Admin Panel</h1>
            <p className="text-sm text-emerald-200">Tani Makmur — Manajemen Produk</p>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Masukkan PIN Admin"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button type="button" onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pinError && <p className="text-red-300 text-xs">{pinError}</p>}
            <button onClick={handleLogin}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Masuk ke Admin Panel
            </button>
          </div>
          <p className="text-center text-xs text-white/40">
            PIN diatur via env variable <code className="font-mono">ADMIN_PIN</code>
          </p>
        </div>
      </div>
    );
  }

  // ─── Admin Dashboard ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-tani-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <span className="font-black text-sm">Admin Panel</span>
            <span className="text-xs text-emerald-300 hidden sm:inline">— Tani Makmur</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-emerald-300 hidden sm:inline">{products.length} produk</span>
            <button
              onClick={() => { setIsAuthenticated(false); setPin(''); setPinInput(''); }}
              className="flex items-center gap-1.5 text-xs text-red-300 hover:text-red-200 px-3 py-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/10"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Flash messages */}
      {(error || success) && (
        <div className={`max-w-7xl mx-auto px-4 mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
          error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {error ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
          {error || success}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 bg-white rounded-2xl border border-stone-200 p-1.5 w-fit shadow-xs">
          {([
            { id: 'products', label: 'Daftar Produk', icon: PackageOpen },
            { id: 'images',   label: 'Gambar Produk', icon: ImageIcon },
            { id: 'import',   label: 'Import Excel',  icon: Upload },
            { id: 'kategori', label: 'Kategori',       icon: Tags },
            { id: 'seed',     label: 'Inisiasi DB',   icon: Database },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === id ? 'bg-tani-800 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Products ── */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-black text-xl text-stone-900">Daftar Produk ({products.length})</h2>
              <div className="flex gap-2">
                <button onClick={loadProducts} disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 text-sm font-bold text-stone-700 hover:bg-stone-50">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button onClick={handleExport} disabled={!products.length}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50">
                  <Download className="w-4 h-4" />
                  Export Excel
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-stone-400">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Memuat data...
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-16 text-center space-y-4">
                <PackageOpen className="w-12 h-12 text-stone-300 mx-auto" />
                <div>
                  <p className="font-bold text-stone-700">Database kosong</p>
                  <p className="text-sm text-stone-500 mt-1">Buka tab &quot;Inisiasi DB&quot; untuk seed data awal.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-bold text-stone-600 text-xs">Nama Produk</th>
                        <th className="text-left px-4 py-3 font-bold text-stone-600 text-xs">Kategori</th>
                        <th className="text-right px-4 py-3 font-bold text-stone-600 text-xs">Harga</th>
                        <th className="text-left px-4 py-3 font-bold text-stone-600 text-xs">Bahan Aktif</th>
                        <th className="text-left px-4 py-3 font-bold text-stone-600 text-xs">Stok</th>
                        <th className="text-center px-4 py-3 font-bold text-stone-600 text-xs">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-stone-50/50">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-stone-900 line-clamp-1 max-w-[220px]">{p.name}</div>
                            {p.featured && <span className="text-[10px] bg-harvest-100 text-harvest-800 px-1.5 py-0.5 rounded font-bold">Unggulan</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-tani-100 text-tani-800 px-2 py-0.5 rounded-full font-semibold">{p.category}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-stone-900 whitespace-nowrap">
                            Rp {p.price.toLocaleString('id')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {(p.activeIngredients ?? []).slice(0, 2).map((ai) => (
                                <span key={ai} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">{ai}</span>
                              ))}
                              {(p.activeIngredients?.length ?? 0) > 2 && (
                                <span className="text-[10px] text-stone-400">+{(p.activeIngredients?.length ?? 0) - 2}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              p.stock_label === 'Tersedia' ? 'bg-emerald-100 text-emerald-700' :
                              p.stock_label === 'Stok Menipis' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>{p.stock_label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Link
                                href={`/produk/${p.slug}`}
                                target="_blank"
                                className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
                                title="Lihat di toko"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/admin/edit/${p.id}`}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit produk"
                              >
                                <Pencil className="w-4 h-4" />
                              </Link>
                              <button onClick={() => handleDelete(p.id, p.name)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -- Tab: Product Images -- */}
        {activeTab === 'images' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-black text-xl text-stone-900">Gambar Produk</h2>
              <p className="text-sm text-stone-500 mt-1">
                Upload JPG/PNG/WebP, pilih gambar lalu klik produk. Bisa juga seret gambar ke produk.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="p-4 border-b border-stone-200 bg-stone-50 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">Daftar Produk</h3>
                    <p className="text-xs text-stone-500">
                      {selectedImageId ? 'Klik produk tujuan untuk menyimpan gambar terpilih.' : 'Pilih gambar di kanan, atau drop gambar ke produk.'}
                    </p>
                  </div>
                  <input
                    value={imageSearch}
                    onChange={(e) => setImageSearch(e.target.value)}
                    placeholder="Cari nama produk..."
                    className="w-full sm:w-72 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tani-500"
                  />
                </div>
                <div className="divide-y divide-stone-100 max-h-[680px] overflow-y-auto">
                  {products
                    .filter((product) => product.name.toLowerCase().includes(imageSearch.toLowerCase()))
                    .map((product) => (
                      <div
                        key={product.id}
                        onClick={() => selectedImageId && attachImageToProduct(product, selectedImageId)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const id = e.dataTransfer.getData('text/plain') || draggedImageId;
                          attachImageToProduct(product, id);
                        }}
                        className={`p-3 flex items-center gap-3 transition-colors ${
                          selectedImageId || draggedImageId ? 'cursor-pointer hover:bg-emerald-50' : 'hover:bg-stone-50'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-stone-900 truncate">{product.name}</p>
                          <p className="text-xs text-stone-500 truncate">{product.category || 'tanpa kategori'}</p>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                          product.images?.length ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                        }`}>
                          {product.images?.length ?? 0} gambar
                        </span>
                        {savingImageFor === product.id && <RefreshCw className="w-4 h-4 animate-spin text-tani-700" />}
                      </div>
                    ))}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div
                  className="bg-white border-2 border-dashed border-stone-300 hover:border-tani-500 rounded-2xl p-6 text-center cursor-pointer transition-colors"
                  onClick={() => imageFileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleProductImages(e.dataTransfer.files);
                  }}
                >
                  <input
                    ref={imageFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handleProductImages(e.target.files)}
                    className="hidden"
                  />
                  <Upload className="w-9 h-9 text-stone-400 mx-auto mb-3" />
                  <p className="font-bold text-stone-800">Upload atau drop gambar produk</p>
                  <p className="text-xs text-stone-500 mt-1">Gambar otomatis dikompres ke WebP maksimal 1200px.</p>
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                  <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-700">Gambar Siap Tempel ({pendingImages.length})</span>
                    {pendingImages.length > 0 && (
                      <button
                        onClick={() => {
                          pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
                          setPendingImages([]);
                          setSelectedImageId('');
                        }}
                        className="text-xs font-bold text-red-600 hover:text-red-700"
                      >
                        Bersihkan
                      </button>
                    )}
                  </div>
                  {pendingImages.length === 0 ? (
                    <div className="p-8 text-center text-sm text-stone-400">
                      Belum ada gambar yang di-upload.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 p-4 max-h-[480px] overflow-y-auto">
                      {pendingImages.map((image) => (
                        <div
                          key={image.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedImageId(image.id);
                            e.dataTransfer.setData('text/plain', image.id);
                          }}
                          onDragEnd={() => setDraggedImageId('')}
                          onClick={() => setSelectedImageId((current) => current === image.id ? '' : image.id)}
                          className={`rounded-2xl border overflow-hidden bg-white cursor-pointer shadow-xs transition-all ${
                            selectedImageId === image.id
                              ? 'border-tani-600 ring-2 ring-tani-200'
                              : 'border-stone-200 hover:border-tani-300'
                          }`}
                        >
                          <div className="aspect-square bg-stone-100">
                            <img src={image.previewUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="p-2 flex items-start justify-between gap-2">
                            <p className="text-[11px] font-semibold text-stone-600 line-clamp-2">{image.name}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                URL.revokeObjectURL(image.previewUrl);
                                setPendingImages((prev) => prev.filter((item) => item.id !== image.id));
                                if (selectedImageId === image.id) setSelectedImageId('');
                              }}
                              className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              title="Hapus dari antrean"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Import Excel ── */}
        {activeTab === 'import' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="font-black text-xl text-stone-900">Import dari Excel</h2>
              <p className="text-sm text-stone-500 mt-1">
                Upload file Excel sederhana. Kolom wajib: <code className="bg-stone-100 px-1 rounded text-xs font-mono">name, category, price, unit</code>. Data lama akan digantikan.
              </p>
            </div>

            {/* Panduan Kolom */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-stone-800 text-sm">📋 Kolom Excel yang Digunakan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { col: 'id', ket: 'ID unik (kosongkan = otomatis dari nama)', wajib: false },
                  { col: 'name', ket: 'Nama produk', wajib: true },
                  { col: 'category', ket: 'pupuk-kimia / pupuk-organik / pupuk-cair / pestisida / media-tanam / nutrisi-mikro / benih', wajib: true },
                  { col: 'price', ket: 'Harga angka (tanpa Rp)', wajib: true },
                  { col: 'unit', ket: 'Satuan, mis: sak (50kg)', wajib: true },
                  { col: 'stock_label', ket: 'Tersedia / Stok Menipis / Pre-Order', wajib: false },
                  { col: 'featured', ket: 'TRUE / FALSE', wajib: false },
                  { col: 'tag', ket: 'Badge kecil mis: Terlaris', wajib: false },
                  { col: 'activeIngredients', ket: 'Pisahkan dengan titik koma (;)', wajib: false },
                  { col: 'short_desc', ket: 'Deskripsi singkat 1–2 kalimat', wajib: false },
                  { col: 'composition', ket: 'Komposisi kandungan', wajib: false },
                  { col: 'dosage', ket: 'Dosis anjuran', wajib: false },
                  { col: 'images', ket: 'URL gambar, pisahkan dengan ;', wajib: false },
                ].map(({ col, ket, wajib }) => (
                  <div key={col} className="flex gap-2">
                    <code className={`font-mono px-1.5 py-0.5 rounded text-[11px] shrink-0 ${wajib ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-600'}`}>
                      {col}{wajib ? '*' : ''}
                    </code>
                    <span className="text-stone-500 leading-tight">{ket}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-stone-400">* = wajib diisi</p>
            </div>

            {/* Download template */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-blue-900 text-sm">📄 Download Template Excel</h3>
                <p className="text-xs text-blue-700 mt-0.5">Template berisi 2 baris contoh agar mudah diisi. Hapus baris contoh sebelum import.</p>
              </div>
              <button onClick={handleDownloadTemplate}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
                Download Template
              </button>
            </div>

            {/* File upload */}
            <div
              className="border-2 border-dashed border-stone-300 hover:border-tani-500 rounded-2xl p-10 text-center cursor-pointer transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
              <Upload className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              {importFilename ? (
                <div>
                  <p className="font-bold text-tani-800">{importFilename}</p>
                  <p className="text-sm text-stone-500">{importPreview.length} produk terdeteksi — klik untuk ganti file</p>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-stone-700">Klik untuk pilih file Excel</p>
                  <p className="text-sm text-stone-500">Format: .xlsx atau .xls</p>
                </div>
              )}
            </div>

            {/* Preview */}
            {importPreview.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                  <span className="text-sm font-bold text-stone-700">Preview ({importPreview.length} produk)</span>
                  <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                    Kategori sudah dinormalisasi otomatis ✓
                  </span>
                </div>
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-xs">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="text-left px-3 py-2 font-bold text-stone-500">Nama</th>
                        <th className="text-left px-3 py-2 font-bold text-stone-500">Kategori (hasil normalisasi)</th>
                        <th className="text-right px-3 py-2 font-bold text-stone-500">Harga</th>
                        <th className="text-left px-3 py-2 font-bold text-stone-500">Bahan Aktif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {importPreview.map((p, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-stone-900 max-w-[180px] truncate">{p.name}</td>
                          <td className="px-3 py-2">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-tani-100 text-tani-800 border border-tani-200">
                              {p.category}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">Rp {p.price.toLocaleString('id')}</td>
                          <td className="px-3 py-2 text-stone-600 max-w-[160px] truncate">{(p.activeIngredients ?? []).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            )}

            <button
              onClick={handleImport}
              disabled={!importPreview.length || importing}
              className="w-full flex items-center justify-center gap-2 bg-tani-700 hover:bg-tani-800 text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-40 transition-colors"
            >
              {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? `Mengimpor ${importPreview.length} produk...` : `Import ${importPreview.length} Produk ke Database`}
            </button>
          </div>
        )}

        {/* ── Tab: Seed ── */}
        {activeTab === 'seed' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h2 className="font-black text-xl text-stone-900">Inisiasi Database</h2>
              <p className="text-sm text-stone-500 mt-1">Gunakan tab ini untuk pertama kali setup atau reset database.</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800 text-sm">Langkah setup pertama kali:</p>
                  <ol className="text-xs text-amber-700 mt-2 space-y-1 list-decimal list-inside">
                    <li>Buat database MySQL di cPanel &rarr; phpMyAdmin</li>
                    <li>Import file <code className="font-mono bg-amber-100 px-1 rounded">schema.sql</code></li>
                    <li>Set env: <code className="font-mono bg-amber-100 px-1 rounded">DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, ADMIN_PIN</code></li>
                    <li>Jalankan <code className="font-mono bg-amber-100 px-1 rounded">npm run build</code></li>
                    <li>Klik tombol Seed di bawah</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
              <div>
                <h3 className="font-bold text-stone-900">Seed Data Default</h3>
                <p className="text-sm text-stone-500 mt-1">
                  Mengisi database dengan 16 produk dari <code className="font-mono text-xs bg-stone-100 px-1 rounded">products.json</code>. Data lama akan dihapus.
                </p>
              </div>
              <button onClick={handleSeed} disabled={seeding}
                className="flex items-center gap-2 bg-tani-700 hover:bg-tani-800 text-white font-bold px-6 py-3 rounded-xl text-sm disabled:opacity-60">
                {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {seeding ? 'Menyimpan ke database...' : 'Seed Data Default ke Database'}
              </button>
            </div>
          </div>
        )}
        {/* ── Tab: Kategori ── */}
        {activeTab === 'kategori' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="font-black text-xl text-stone-900">Manajemen Kategori</h2>
              <p className="text-sm text-stone-500 mt-1">
                Tambah kategori baru tanpa perlu edit kode. Kategori baru dari Excel juga muncul di sini otomatis.
              </p>
            </div>

            {/* Add new category form */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
              <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-tani-700" />
                Tambah / Update Kategori
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">ID Kategori *</label>
                  <input value={newCat.id ?? ''} onChange={(e) => setNewCat((p) => ({ ...p, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    placeholder="mis: benih-padi" className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tani-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">Nama Lengkap *</label>
                  <input value={newCat.name ?? ''} onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))}
                    placeholder="mis: Benih & Bibit Padi" className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tani-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">Nama Singkat *</label>
                  <input value={newCat.short_name ?? ''} onChange={(e) => setNewCat((p) => ({ ...p, short_name: e.target.value }))}
                    placeholder="mis: Benih Padi" className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tani-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">Icon (Lucide name)</label>
                  <input value={newCat.icon_name ?? 'Package'} onChange={(e) => setNewCat((p) => ({ ...p, icon_name: e.target.value }))}
                    placeholder="Package / Wheat / Leaf / Bug ..." className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-tani-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">Badge Color (Tailwind classes)</label>
                  <input value={newCat.badge_color ?? ''} onChange={(e) => setNewCat((p) => ({ ...p, badge_color: e.target.value }))}
                    placeholder="bg-yellow-100 text-yellow-800 border-yellow-200" className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-tani-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 block mb-1">Urutan (sort_order)</label>
                  <input type="number" value={newCat.sort_order ?? 99} onChange={(e) => setNewCat((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tani-500" />
                </div>
              </div>
              <button
                disabled={savingCat || !newCat.id || !newCat.name || !newCat.short_name}
                onClick={async () => {
                  setSavingCat(true);
                  try {
                    const res = await fetch('/api/categories', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
                      body: JSON.stringify(newCat),
                    });
                    if (!res.ok) throw new Error((await res.json()).error);
                    flash(`Kategori "${newCat.id}" berhasil disimpan`);
                    setNewCat({ icon_name: 'Package', badge_color: 'bg-stone-100 text-stone-800 border-stone-200', bg_color: 'bg-stone-50 group-hover:bg-stone-100', icon_color: 'text-stone-600', sort_order: 99 });
                    reloadCategories();
                  } catch (e: unknown) {
                    flash(e instanceof Error ? e.message : 'Gagal menyimpan', true);
                  } finally {
                    setSavingCat(false);
                  }
                }}
                className="flex items-center gap-2 bg-tani-700 hover:bg-tani-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors"
              >
                {savingCat ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Simpan Kategori
              </button>
            </div>

            {/* Existing categories list */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                <span className="text-sm font-bold text-stone-700">{categories.length} Kategori Aktif</span>
                <button onClick={() => reloadCategories()} className="text-xs text-stone-500 hover:text-tani-700 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              <div className="divide-y divide-stone-100">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between px-4 py-3 hover:bg-stone-50">
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cat.badge_color}`}>
                        {cat.short_name}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-stone-900">{cat.name}</p>
                        <p className="text-xs text-stone-400 font-mono">{cat.id} · icon: {cat.icon_name} · order: {cat.sort_order}</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm(`Hapus kategori "${cat.name}"? Produk yang memakai kategori ini perlu diupdate manual.`)) return;
                        await fetch('/api/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin }, body: JSON.stringify({ id: cat.id }) });
                        flash(`Kategori "${cat.id}" dihapus`);
                        reloadCategories();
                      }}
                      className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus kategori"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-700 space-y-1">
              <p className="font-bold">💡 Tips:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Kategori baru dari Excel otomatis muncul di sini setelah import</li>
                <li>Gunakan form di atas untuk set icon dan warna yang tepat</li>
                <li>Icon menggunakan nama Lucide React: <span className="font-mono">Wheat, Leaf, Bug, Droplets, Atom, Layers...</span></li>
                <li>Badge color gunakan class Tailwind: <span className="font-mono">bg-yellow-100 text-yellow-800 border-yellow-200</span></li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
