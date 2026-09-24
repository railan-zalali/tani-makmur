'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  ShieldCheck, LogOut, Upload, Check, PackageOpen,
  AlertTriangle, Database, Tags, ImageIcon,
} from 'lucide-react';
import { Product } from '@/types/product';
import { useCategories } from '@/context/CategoryContext';
import { AdminAuth } from './components/AdminAuth';
import { ProductTable } from './components/ProductTable';
import { ProductImportTab } from './components/ProductImportTab';
import { ProductImageTab } from './components/ProductImageTab';
import { SeedDatabaseTab } from './components/SeedDatabaseTab';
import { CategoryManagerTab } from './components/CategoryManagerTab';
import { productsToSheet } from './utils/excelUtils';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'products' | 'images' | 'import' | 'seed' | 'kategori';



// ─── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  // Category state
  const { categories, reload: reloadCategories } = useCategories();

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

  // Auth is handled by AdminAuth component

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

  // ─── Login Screen ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <AdminAuth 
        onSuccess={(validPin) => {
          setPin(validPin);
          setIsAuthenticated(true);
        }} 
      />
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
              onClick={() => { setIsAuthenticated(false); setPin(''); }}
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
          <ProductTable 
            products={products}
            loading={loading}
            onRefresh={loadProducts}
            onDelete={handleDelete}
            onExport={handleExport}
          />
        )}

        {/* -- Tab: Product Images -- */}
        {activeTab === 'images' && (
          <ProductImageTab
            products={products}
            setProducts={setProducts}
            pin={pin}
            flash={flash}
          />
        )}

        {/* ── Tab: Import Excel ── */}
        {activeTab === 'import' && (
          <ProductImportTab
            pin={pin}
            onImportSuccess={() => {
              setActiveTab('products');
              loadProducts();
            }}
            flash={flash}
          />
        )}

        {/* ── Tab: Seed ── */}
        {activeTab === 'seed' && (
          <SeedDatabaseTab
            pin={pin}
            onSeedSuccess={() => {
              setActiveTab('products');
              loadProducts();
            }}
            flash={flash}
          />
        )}

        {/* ── Tab: Kategori ── */}
        {activeTab === 'kategori' && (
          <CategoryManagerTab
            pin={pin}
            flash={flash}
            categories={categories}
            reloadCategories={reloadCategories}
          />
        )}
      </main>
    </div>
  );
}
