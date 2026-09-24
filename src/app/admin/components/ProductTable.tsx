import React from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2, Download, Plus, RefreshCw, PackageOpen } from 'lucide-react';
import { Product } from '@/types/product';
import { formatRupiah } from '@/utils/formatters';
import { CategoryDef } from '@/context/CategoryContext';

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (id: string, name: string) => void;
  onExport: () => void;
}

export function ProductTable({
  products,
  loading,
  onRefresh,
  onDelete,
  onExport
}: ProductTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-black text-xl text-stone-900">Daftar Produk ({products.length})</h2>
        <div className="flex gap-2">
          <button onClick={onRefresh} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 text-sm font-bold text-stone-700 hover:bg-stone-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={onExport} disabled={!products.length}
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
            <p className="text-sm text-stone-500 mt-1">Buka tab &quot;Inisiasi DB&quot; atau Import Excel.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
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
                {products.map((p) => {
                  return (
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
                            href={`/produk/${encodeURIComponent(p.slug)}`}
                            target="_blank"
                            className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Lihat di toko"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/edit/${encodeURIComponent(p.id)}`}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit produk"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button onClick={() => onDelete(p.id, p.name)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
