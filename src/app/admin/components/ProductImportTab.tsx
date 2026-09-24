import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, RefreshCw } from 'lucide-react';
import { Product } from '@/types/product';
import { productsToSheet, sheetRowToProduct } from '../utils/excelUtils';

interface ProductImportTabProps {
  pin: string;
  onImportSuccess: () => void;
  flash: (msg: string, isError?: boolean) => void;
}

export function ProductImportTab({ pin, onImportSuccess, flash }: ProductImportTabProps) {
  const [importPreview, setImportPreview] = useState<Product[]>([]);
  const [importFilename, setImportFilename] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      flash(`${importPreview.length} produk berhasil diimport`);
      setImportPreview([]);
      setImportFilename('');
      onImportSuccess();
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Import gagal', true);
    } finally {
      setImporting(false);
    }
  };

  return (
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
                  <tr key={i} className="hover:bg-stone-50">
                    <td className="px-3 py-2 font-semibold">{p.name}</td>
                    <td className="px-3 py-2 text-stone-500">{p.category}</td>
                    <td className="px-3 py-2 text-right">{p.price.toLocaleString('id')}</td>
                    <td className="px-3 py-2 text-stone-500 truncate max-w-[100px]">{(p.activeIngredients || []).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
            <button onClick={handleImport} disabled={importing}
              className="flex items-center gap-2 bg-tani-600 hover:bg-tani-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold transition-colors">
              {importing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {importing ? 'Menyimpan...' : 'Konfirmasi & Import Sekarang'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
