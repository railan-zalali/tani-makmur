import React, { useState, useRef } from 'react';
import { Product } from '@/types/product';
import { Upload, ImageIcon, RefreshCw, ZoomIn, X } from 'lucide-react';
import { convertToWebp, applyWatermark } from '@/utils/imageUtils';

export type PendingProductImage = {
  id: string;
  name: string;
  previewUrl: string;
  blob: Blob;
  rotation: number;
};

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

async function convertImageToWebp(file: File): Promise<PendingProductImage> {
  try {
    const webpBlob = await convertToWebp(file, 0.82);

    return {
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      name: webpName(file.name),
      previewUrl: URL.createObjectURL(webpBlob),
      blob: webpBlob,
      rotation: 0
    };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : `Gagal memproses ${file.name}`);
  }
}

interface ProductImageTabProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  pin: string;
  flash: (msg: string, isError?: boolean) => void;
}

export function ProductImageTab({ products, setProducts, pin, flash }: ProductImageTabProps) {
  const [pendingImages, setPendingImages] = useState<PendingProductImage[]>([]);
  const [draggedImageId, setDraggedImageId] = useState('');
  const [selectedImageId, setSelectedImageId] = useState('');
  const [imageSearch, setImageSearch] = useState('');
  const [savingImageFor, setSavingImageFor] = useState('');
  
  const [wmAdmin, setWmAdmin] = useState({ opacity: 0.15, sizeRatio: 0.35, position: 'center' as const });
  const [zoomAdminId, setZoomAdminId] = useState<string>('');

  const imageFileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const searchTokens = imageSearch
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const filteredProducts = searchTokens.length === 0
    ? products
    : products.filter((p) =>
        searchTokens.some((tok) => p.name.toLowerCase().includes(tok))
      );

  const handleProductImages = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      flash('Pilih file gambar JPG, PNG, atau WebP', true);
      return;
    }

    try {
      const converted = await Promise.all(imageFiles.map(file => convertImageToWebp(file)));
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
      const watermarkedBlob = await applyWatermark(image.blob, {
        logoUrl: '/LOGO.png',
        position: wmAdmin.position,
        opacity: wmAdmin.opacity,
        sizeRatio: wmAdmin.sizeRatio,
        rotation: image.rotation || 0
      });

      const form = new FormData();
      form.append('productId', product.id);
      form.append('fileName', image.name);
      form.append('image', watermarkedBlob, image.name);

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

  return (
    <div className="space-y-5">
      {zoomAdminId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setZoomAdminId('')}>
          <div className="relative max-w-4xl max-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingImages.find(i => i.id === zoomAdminId)?.previewUrl} alt="Zoom" className="max-w-full max-h-[90vh] object-contain rounded-lg" style={{ transform: `rotate(${pendingImages.find(i => i.id === zoomAdminId)?.rotation || 0}deg)` }} />
            <button className="absolute -top-4 -right-4 bg-white text-stone-900 p-2 rounded-full font-bold">X</button>
          </div>
        </div>
      )}

      {/* ── Header bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-xl text-stone-900">Gambar Produk</h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Drop gambar ke produk, atau pilih gambar lalu klik produk tujuan.
          </p>
        </div>
        {/* Upload buttons compact */}
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 hover:border-tani-400 rounded-xl text-sm font-bold text-stone-700 transition-colors shadow-xs"
          >
            <svg className="w-4 h-4 text-tani-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Kamera
          </button>
          <button
            type="button"
            onClick={() => imageFileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-tani-700 hover:bg-tani-800 rounded-xl text-sm font-bold text-white transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4" />
            Pilih / Drop Gambar
          </button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => e.target.files && handleProductImages(e.target.files)} />
          <input ref={imageFileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => e.target.files && handleProductImages(e.target.files)} />
        </div>
      </div>

      {/* ── Watermark bar ── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-xs font-black text-stone-500 uppercase tracking-wide shrink-0">Watermark</span>
          <div className="flex items-center gap-3 flex-1 min-w-[160px]">
            <span className="text-xs font-semibold text-stone-500 shrink-0 w-14">Opacity</span>
            <input type="range" min="5" max="100" step="5" value={Math.round(wmAdmin.opacity * 100)}
              onChange={(e) => setWmAdmin({ ...wmAdmin, opacity: Number(e.target.value) / 100 })}
              className="flex-1 accent-tani-700" />
            <span className="text-xs font-mono text-stone-700 w-9 text-right">{Math.round(wmAdmin.opacity * 100)}%</span>
          </div>
          <div className="flex items-center gap-3 flex-1 min-w-[160px]">
            <span className="text-xs font-semibold text-stone-500 shrink-0 w-14">Ukuran</span>
            <input type="range" min="5" max="60" step="5" value={Math.round(wmAdmin.sizeRatio * 100)}
              onChange={(e) => setWmAdmin({ ...wmAdmin, sizeRatio: Number(e.target.value) / 100 })}
              className="flex-1 accent-tani-700" />
            <span className="text-xs font-mono text-stone-700 w-9 text-right">{Math.round(wmAdmin.sizeRatio * 100)}%</span>
          </div>
          {/* Inline live preview */}
          {pendingImages.length > 0 && (() => {
            const prev = pendingImages.find((i) => i.id === selectedImageId) ?? pendingImages[0];
            return (
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border-2 border-tani-300 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={prev.previewUrl} alt="" className="w-full h-full object-cover" style={{ transform: `rotate(${prev.rotation}deg)` }} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/LOGO.png" alt="" aria-hidden className="absolute object-contain pointer-events-none"
                  style={{ width: `${wmAdmin.sizeRatio * 100}%`, opacity: wmAdmin.opacity, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Main 2-col layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Left: Gambar Siap Tempel ── */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-stone-300 hover:border-tani-500 rounded-2xl p-5 text-center cursor-pointer transition-all bg-stone-50 hover:bg-tani-50"
            onClick={() => imageFileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleProductImages(e.dataTransfer.files); }}
          >
            <Upload className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-500">Drop gambar di sini</p>
            <p className="text-xs text-stone-400 mt-0.5">atau klik tombol di atas</p>
          </div>

          {/* Pending grid */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-stone-700">Siap Tempel</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pendingImages.length > 0 ? 'bg-tani-100 text-tani-700' : 'bg-stone-100 text-stone-500'}`}>
                  {pendingImages.length}
                </span>
              </div>
              {pendingImages.length > 0 && (
                <button
                  onClick={() => { pendingImages.forEach((i) => URL.revokeObjectURL(i.previewUrl)); setPendingImages([]); setSelectedImageId(''); }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                >
                  Bersihkan semua
                </button>
              )}
            </div>

            {pendingImages.length === 0 ? (
              <div className="p-10 text-center">
                <ImageIcon className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-stone-400">Belum ada gambar</p>
                <p className="text-xs text-stone-300 mt-1">Upload gambar untuk mulai</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 p-3 overflow-y-auto max-h-[520px]">
                {pendingImages.map((image) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={(e) => { setDraggedImageId(image.id); e.dataTransfer.setData('text/plain', image.id); }}
                    onDragEnd={() => setDraggedImageId('')}
                    onClick={() => setSelectedImageId((cur) => cur === image.id ? '' : image.id)}
                    className={`rounded-xl border overflow-hidden bg-white cursor-grab active:cursor-grabbing transition-all ${
                      selectedImageId === image.id
                        ? 'border-tani-500 ring-2 ring-tani-200 shadow-md'
                        : 'border-stone-200 hover:border-tani-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="aspect-square bg-stone-100 overflow-hidden relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.previewUrl} alt=""
                        className="object-cover w-full h-full transition-transform duration-300"
                        style={{ transform: `rotate(${image.rotation}deg)` }}
                      />
                      {/* Watermark overlay */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/LOGO.png" alt="" aria-hidden
                        className="absolute object-contain pointer-events-none z-10"
                        style={{ width: `${wmAdmin.sizeRatio * 100}%`, opacity: wmAdmin.opacity, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
                      />
                      {/* Selected badge */}
                      {selectedImageId === image.id && (
                        <div className="absolute top-1.5 left-1.5 bg-tani-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-20">
                          DIPILIH
                        </div>
                      )}
                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setZoomAdminId(image.id); }}
                        className="absolute top-1.5 left-1.5 bg-white/90 hover:bg-white text-stone-700 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm"
                        title="Zoom">
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setPendingImages((prev) => prev.map((img) => img.id === image.id ? { ...img, rotation: (img.rotation + 90) % 360 } : img)); }}
                        className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-white text-stone-700 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm"
                        title="Putar 90°">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="px-2 py-1.5 flex items-center justify-between gap-1">
                      <p className="text-[10px] font-semibold text-stone-500 truncate">{image.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); URL.revokeObjectURL(image.previewUrl); setPendingImages((prev) => prev.filter((it) => it.id !== image.id)); if (selectedImageId === image.id) setSelectedImageId(''); }}
                        className="p-0.5 text-stone-300 hover:text-red-500 rounded shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Daftar Produk ── */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Search + status bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={imageSearch}
                  onChange={(e) => setImageSearch(e.target.value)}
                  placeholder="Cari produk… pisahkan nama dengan koma: npk, urea, tomat"
                  className="w-full pl-9 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tani-500 placeholder:text-stone-400"
                />
              </div>
              {imageSearch && (
                <button onClick={() => setImageSearch('')} className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Multi-keyword chips */}
            {searchTokens.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {searchTokens.map((tok) => (
                  <span key={tok} className="inline-flex items-center gap-1 bg-tani-50 border border-tani-200 text-tani-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {tok}
                    <span className="text-tani-400 text-[10px]">({products.filter((p) => p.name.toLowerCase().includes(tok)).length})</span>
                  </span>
                ))}
              </div>
            )}
            {/* Status */}
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-stone-400">
                {filteredProducts.length} dari {products.length} produk
                {selectedImageId ? ' — klik produk untuk tempel gambar terpilih' : draggedImageId ? ' — lepaskan ke produk tujuan' : ''}
              </p>
              {(selectedImageId || draggedImageId) && (
                <span className="text-xs font-bold text-tani-600 animate-pulse">● Gambar aktif</span>
              )}
            </div>
          </div>

          {/* Product list */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col">
            <div className="divide-y divide-stone-100 overflow-y-auto max-h-[600px]">
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm font-semibold text-stone-400">Produk tidak ditemukan</p>
                  <p className="text-xs text-stone-300 mt-1">Coba kata kunci lain</p>
                </div>
              ) : filteredProducts.map((product) => {
                const isTarget = !!(selectedImageId || draggedImageId);
                return (
                  <div
                    key={product.id}
                    onClick={() => selectedImageId && attachImageToProduct(product, selectedImageId)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain') || draggedImageId; attachImageToProduct(product, id); }}
                    className={`flex items-center gap-3 px-4 py-3 transition-all ${
                      isTarget
                        ? 'cursor-pointer hover:bg-emerald-50 hover:border-l-4 hover:border-l-emerald-400'
                        : 'hover:bg-stone-50'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                      {product.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-stone-300" />
                        </div>
                      )}
                      {/* Image count badge */}
                      {(product.images?.length ?? 0) > 0 && (
                        <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[9px] font-bold px-1 rounded">
                          {product.images!.length}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-stone-900 truncate">{product.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{product.category}</p>
                      {/* Highlighted keywords */}
                      {searchTokens.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {searchTokens.filter((tok) => product.name.toLowerCase().includes(tok)).map((tok) => (
                            <span key={tok} className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">{tok}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right side */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        (product.images?.length ?? 0) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'
                      }`}>
                        {product.images?.length ?? 0} foto
                      </span>
                      {isTarget && (
                        <span className="text-[10px] text-emerald-600 font-bold">
                          → Tempel
                        </span>
                      )}
                      {savingImageFor === product.id && <RefreshCw className="w-3.5 h-3.5 animate-spin text-tani-600" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
