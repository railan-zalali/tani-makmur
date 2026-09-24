'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, RefreshCw, AlertTriangle, Check,
  Trash2, FlaskConical, Tag
} from 'lucide-react';
import { Product } from '@/types/product';
import ImageUploadSection from '@/components/ImageUploadSection';

import { useCategories } from '@/context/CategoryContext';

const STOCK_LABELS = ['Tersedia', 'Stok Menipis', 'Pre-Order'] as const;

// ─── Field helpers ────────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-bold text-stone-600 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, className = '' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-tani-500 focus:border-transparent outline-none transition-shadow ${className}`}
    />
  );
}

function Textarea({ value, onChange, rows = 3, placeholder }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-tani-500 focus:border-transparent outline-none resize-none transition-shadow"
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { categories } = useCategories();

  const [form, setForm] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pin, setPin] = useState('');
  const [pinPrompt, setPinPrompt] = useState(false);

  // Load PIN from sessionStorage (set by admin page)
  useEffect(() => {
    const stored = sessionStorage.getItem('admin_pin');
    if (stored) setPin(stored);
    else setPinPrompt(true);
  }, []);

  // Fetch product
  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Produk tidak ditemukan');
        return r.json();
      })
      .then((data: Product) => setForm(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const set = (field: keyof Product, value: unknown) =>
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);

  const handleSave = async () => {
    if (!form) return;
    if (!pin) { setPinPrompt(true); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/products/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json();
        if (res.status === 401) throw new Error('PIN salah. Kembali ke /admin dan login ulang.');
        throw new Error(body.error);
      }
      setSuccess('Produk berhasil disimpan!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form || !confirm(`Hapus produk "${form.name}"? Tidak bisa dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/products/${form.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': pin },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push('/admin');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus');
    }
  };

  // ── PIN prompt ─────────────────────────────────────────────────────────────
  if (pinPrompt) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-lg p-8 w-full max-w-sm space-y-4">
          <h2 className="font-black text-stone-900 text-lg">Masukkan PIN Admin</h2>
          <input
            type="password"
            placeholder="PIN Admin"
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tani-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = (e.target as HTMLInputElement).value;
                setPin(v);
                sessionStorage.setItem('admin_pin', v);
                setPinPrompt(false);
              }
            }}
          />
          <p className="text-xs text-stone-400">Tekan Enter untuk lanjut</p>
          <Link href="/admin" className="text-sm text-tani-700 font-semibold hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Admin Panel
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-tani-700" />
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-10 h-10 text-red-500" />
        <p className="font-bold text-stone-800">{error}</p>
        <Link href="/admin" className="text-sm text-tani-700 font-semibold hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali
        </Link>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-stone-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin" className="p-2 hover:bg-stone-100 rounded-xl text-stone-600 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <p className="text-xs text-stone-400 font-medium">Edit Produk</p>
              <h1 className="text-sm font-black text-stone-900 truncate">{form.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDelete}
              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              title="Hapus produk"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-tani-700 hover:bg-tani-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-60 transition-colors"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </header>

      {/* Flash */}
      {(error || success) && (
        <div className={`max-w-4xl mx-auto px-4 mt-4 flex items-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold ${
          error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {error ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
          {error || success}
        </div>
      )}

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Main Info */}
          <div className="lg:col-span-2 space-y-6">

            {/* Basic Info Card */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
              <h2 className="font-black text-stone-900 text-base border-b border-stone-100 pb-3">Informasi Dasar</h2>

              <div>
                <FieldLabel required>Nama Produk</FieldLabel>
                <TextInput value={form.name} onChange={(v) => set('name', v)} placeholder="Nama lengkap produk" />
              </div>

              <div>
                <FieldLabel>Slug / ID</FieldLabel>
                <TextInput value={form.slug} onChange={(v) => set('slug', v)} className="font-mono text-xs text-stone-500" />
                <p className="text-xs text-stone-400 mt-1">Digunakan untuk URL produk. Hanya huruf kecil, angka, dan tanda hubung.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Kategori</FieldLabel>
                  <select
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tani-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel required>Status Stok</FieldLabel>
                  <select
                    value={form.stock_label}
                    onChange={(e) => set('stock_label', e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tani-500 bg-white"
                  >
                    {STOCK_LABELS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Harga (Rp)</FieldLabel>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => set('price', Number(e.target.value))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tani-500"
                  />
                </div>
                <div>
                  <FieldLabel required>Satuan</FieldLabel>
                  <TextInput value={form.unit} onChange={(v) => set('unit', v)} placeholder="sak (50kg)" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Badge Tag</FieldLabel>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      value={form.tag ?? ''}
                      onChange={(e) => set('tag', e.target.value || undefined)}
                      placeholder="Terlaris, Organik, dll."
                      className="w-full border border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tani-500"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Berat (kg)</FieldLabel>
                  <input
                    type="number"
                    step="0.1"
                    value={form.weightKg ?? ''}
                    onChange={(e) => set('weightKg', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="50"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tani-500"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div
                    onClick={() => set('featured', !form.featured)}
                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1 ${form.featured ? 'bg-tani-600' : 'bg-stone-200'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.featured ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm font-semibold text-stone-700">Produk Unggulan</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div
                    onClick={() => set('isAvailable', !form.isAvailable)}
                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1 ${form.isAvailable ? 'bg-emerald-500' : 'bg-stone-200'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isAvailable ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm font-semibold text-stone-700">Produk Aktif</span>
                </label>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
              <h2 className="font-black text-stone-900 text-base border-b border-stone-100 pb-3">Deskripsi & Kandungan</h2>

              <div>
                <FieldLabel>Deskripsi Singkat</FieldLabel>
                <Textarea
                  rows={2}
                  value={form.short_desc}
                  onChange={(v) => set('short_desc', v)}
                  placeholder="1–2 kalimat ringkas yang tampil di card produk"
                />
              </div>

              <div>
                <FieldLabel>Deskripsi Lengkap</FieldLabel>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(v) => set('description', v)}
                  placeholder="Penjelasan detail produk untuk halaman detail"
                />
              </div>

              <div>
                <FieldLabel>Komposisi / Kandungan</FieldLabel>
                <Textarea
                  rows={2}
                  value={form.composition}
                  onChange={(v) => set('composition', v)}
                  placeholder="Nitrogen (N): 46% | Kadar Air Maks: 0.5%"
                />
              </div>

              <div>
                <FieldLabel>Cara Penggunaan</FieldLabel>
                <Textarea
                  rows={2}
                  value={form.usage}
                  onChange={(v) => set('usage', v)}
                  placeholder="Cara aplikasi pupuk/pestisida"
                />
              </div>

              <div>
                <FieldLabel>Dosis Anjuran</FieldLabel>
                <Textarea
                  rows={2}
                  value={form.dosage ?? ''}
                  onChange={(v) => set('dosage', v || undefined)}
                  placeholder="Padi: 200-250 kg/ha | Jagung: 200-300 kg/ha"
                />
              </div>
            </div>
          </div>

          {/* Right — Sidebar */}
          <div className="space-y-6">

            {/* Bahan Aktif Card */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-3">
              <h2 className="font-black text-stone-900 text-base flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-600" />
                Bahan Aktif
              </h2>
              <p className="text-xs text-stone-400">Pisahkan dengan titik koma (;)</p>
              <textarea
                rows={4}
                value={(form.activeIngredients ?? []).join(';\n')}
                onChange={(e) =>
                  set('activeIngredients',
                    e.target.value.split(/[;\n]/).map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder={"Nitrogen (N);\nFosfor (P);\nKalium (K)"}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none font-mono"
              />
              {/* Preview chips */}
              {(form.activeIngredients ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(form.activeIngredients ?? []).map((ai) => (
                    <span key={ai} className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                      {ai}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tanaman Cocok Card */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-3">
              <h2 className="font-black text-stone-900 text-base">Tanaman yang Cocok</h2>
              <p className="text-xs text-stone-400">Pisahkan dengan titik koma (;)</p>
              <textarea
                rows={4}
                value={(form.suitableCrops ?? []).join(';\n')}
                onChange={(e) =>
                  set('suitableCrops',
                    e.target.value.split(/[;\n]/).map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder={"Padi;\nJagung;\nCabai"}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-tani-500 resize-none font-mono"
              />
            </div>

            {/* Gambar Card */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-3">
              <h2 className="font-black text-stone-900 text-base">Gambar Produk</h2>
              <ImageUploadSection
                productId={form.id}
                images={form.images ?? []}
                pin={pin}
                onChange={(imgs) => set('images', imgs)}
              />
            </div>

            {/* Save button (bottom) */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-tani-700 hover:bg-tani-800 text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-60"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
