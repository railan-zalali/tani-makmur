import React, { useState } from 'react';
import { Plus, RefreshCw, X } from 'lucide-react';
import { CategoryDef } from '@/types/product';

interface CategoryManagerTabProps {
  pin: string;
  flash: (msg: string, isError?: boolean) => void;
  categories: CategoryDef[];
  reloadCategories: () => void;
}

export function CategoryManagerTab({ pin, flash, categories, reloadCategories }: CategoryManagerTabProps) {
  const [newCat, setNewCat] = useState<Partial<CategoryDef>>({ icon_name: 'Package', badge_color: 'bg-stone-100 text-stone-800 border-stone-200', bg_color: 'bg-stone-50 group-hover:bg-stone-100', icon_color: 'text-stone-600', sort_order: 99 });
  const [savingCat, setSavingCat] = useState(false);

  return (
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
                  try {
                    const res = await fetch('/api/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin }, body: JSON.stringify({ id: cat.id }) });
                    if (!res.ok) throw new Error((await res.json()).error);
                    flash(`Kategori "${cat.id}" dihapus`);
                    reloadCategories();
                  } catch (e: unknown) {
                    flash(e instanceof Error ? e.message : 'Gagal menghapus', true);
                  }
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
  );
}
