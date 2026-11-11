import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Product } from '@/types/product';
import { Upload, ImageIcon, RefreshCw, ZoomIn, X, Save, Trash2, HardDrive, Search, SlidersHorizontal } from 'lucide-react';
import { convertToWebp, applyWatermark } from '@/utils/imageUtils';

export type PendingProductImage = {
  id: string;
  name: string;
  previewUrl: string;
  blob: Blob;
  rotation: number;
};

export type StashedImage = {
  name: string;
  url: string;
  created_at?: string;
  size?: number | null;
  localStashId?: string;
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

type ImageFilterMode = 'all' | 'no-images' | 'has-images';
type LeftTab = 'queue' | 'stash';

const WM_STORAGE_KEY = 'tani_admin_watermark';

export function ProductImageTab({ products, setProducts, pin, flash }: ProductImageTabProps) {
  const [pendingImages, setPendingImages] = useState<PendingProductImage[]>([]);
  const [draggedImageId, setDraggedImageId] = useState('');
  const [selectedImageId, setSelectedImageId] = useState('');
  const [imageSearch, setImageSearch] = useState('');
  const [savingImageFor, setSavingImageFor] = useState('');

  const [stashedImages, setStashedImages] = useState<StashedImage[]>([]);
  const [loadingStash, setLoadingStash] = useState(false);
  const [savingStashIds, setSavingStashIds] = useState<Set<string>>(new Set());
  const [savingStashAll, setSavingStashAll] = useState(false);

  const [imageFilter, setImageFilter] = useState<ImageFilterMode>('all');

  const [draggedStashName, setDraggedStashName] = useState('');
  const [selectedStashName, setSelectedStashName] = useState('');

  const [leftTab, setLeftTab] = useState<LeftTab>('queue');
  const [showWm, setShowWm] = useState(false);
  const [zoom, setZoom] = useState<{ url: string; rotation?: number } | null>(null);

  const [wmAdmin, setWmAdmin] = useState<{ opacity: number; sizeRatio: number; position: 'center' }>(() => {
    if (typeof window === 'undefined') return { opacity: 0.15, sizeRatio: 0.35, position: 'center' as const };
    try {
      const raw = window.localStorage.getItem(WM_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { opacity?: number; sizeRatio?: number };
        if (typeof parsed.opacity === 'number' && typeof parsed.sizeRatio === 'number') {
          return { opacity: parsed.opacity, sizeRatio: parsed.sizeRatio, position: 'center' as const };
        }
      }
    } catch {
      /* ignore corrupt settings */
    }
    return { opacity: 0.15, sizeRatio: 0.35, position: 'center' as const };
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(WM_STORAGE_KEY, JSON.stringify(wmAdmin));
    } catch {
      /* storage unavailable */
    }
  }, [wmAdmin]);

  const imageFileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const loadStashedImages = useCallback(async () => {
    setLoadingStash(true);
    try {
      const res = await fetch('/api/product-images/stash', {
        headers: { 'x-admin-pin': pin }
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Gagal memuat stash');
      setStashedImages(body.items || []);
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Gagal memuat gambar tersimpan', true);
    } finally {
      setLoadingStash(false);
    }
  }, [pin, flash]);

  useEffect(() => {
    loadStashedImages();
  }, [loadStashedImages]);

  // Drag & drop gambar hanya diaktifkan di perangkat dengan mouse/pointer presisi.
  // Di perangkat touch, draggable mengganggu tap (klik tidak terpicu).
  const [canDrag, setCanDrag] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanDrag(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const searchTokens = imageSearch
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const filteredProducts = (() => {
    let list = products;
    if (imageFilter === 'no-images') {
      list = list.filter((p) => (p.images?.length ?? 0) === 0);
    } else if (imageFilter === 'has-images') {
      list = list.filter((p) => (p.images?.length ?? 0) > 0);
    }
    if (searchTokens.length > 0) {
      list = list.filter((p) =>
        searchTokens.some((tok) => p.name.toLowerCase().includes(tok))
      );
    }
    return list;
  })();

  const productImageStats = {
    total: products.length,
    noImages: products.filter((p) => (p.images?.length ?? 0) === 0).length,
    hasImages: products.filter((p) => (p.images?.length ?? 0) > 0).length,
  };

  const handleProductImages = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      flash('Pilih file gambar JPG, PNG, atau WebP', true);
      return;
    }

    try {
      const converted = await Promise.all(imageFiles.map(file => convertImageToWebp(file)));
      setPendingImages((prev) => [...prev, ...converted]);
      setLeftTab('queue');
      flash(`${converted.length} gambar siap ditempel ke produk`);
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Gagal memproses gambar', true);
    } finally {
      if (imageFileRef.current) imageFileRef.current.value = '';
    }
  };

  const stashOneImage = async (imageId: string) => {
    const image = pendingImages.find((i) => i.id === imageId);
    if (!image) return;

    setSavingStashIds((prev) => new Set(prev).add(imageId));
    try {
      const watermarkedBlob = await applyWatermark(image.blob, {
        logoUrl: '/LOGO.png',
        position: wmAdmin.position,
        opacity: wmAdmin.opacity,
        sizeRatio: wmAdmin.sizeRatio,
        rotation: image.rotation || 0
      });

      const form = new FormData();
      form.append('productId', '_stash_');
      form.append('fileName', image.name);
      form.append('image', watermarkedBlob, image.name);

      const res = await fetch('/api/product-images', {
        method: 'POST',
        headers: { 'x-admin-pin': pin },
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Gagal menyimpan ke sistem');

      setStashedImages((prev) => [
        { name: image.name, url: body.url, created_at: new Date().toISOString(), localStashId: imageId },
        ...prev,
      ]);
      setPendingImages((prev) => prev.filter((i) => i.id !== imageId));
      URL.revokeObjectURL(image.previewUrl);
      if (selectedImageId === imageId) setSelectedImageId('');
      if (!savingStashAll) setLeftTab('stash');
      flash(`${image.name} disimpan ke sistem`);
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Gagal menyimpan', true);
    } finally {
      setSavingStashIds((prev) => {
        const n = new Set(prev); n.delete(imageId); return n;
      });
    }
  };

  const stashAllPending = async () => {
    if (pendingImages.length === 0) return;
    setSavingStashAll(true);
    try {
      const ids = pendingImages.map((i) => i.id);
      for (const id of ids) {
        await stashOneImage(id);
      }
      setLeftTab('stash');
      flash('Semua gambar disimpan ke sistem');
    } finally {
      setSavingStashAll(false);
    }
  };

  const deleteStashed = async (stashed: StashedImage) => {
    try {
      const params = new URLSearchParams({ name: stashed.name });
      const res = await fetch(`/api/product-images/stash?${params.toString()}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': pin },
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Gagal menghapus');
      }
      setStashedImages((prev) => prev.filter((s) => s.name !== stashed.name));
      if (selectedStashName === stashed.name) setSelectedStashName('');
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Gagal menghapus', true);
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

  const useStashedOnProduct = async (product: Product, stashName: string) => {
    const stashed = stashedImages.find((s) => s.name === stashName);
    if (!stashed) return;

    setSavingImageFor(product.id);
    try {
      const form = new FormData();
      form.append('productId', product.id);
      form.append('useStashedUrl', stashed.url);

      const res = await fetch('/api/product-images', {
        method: 'POST',
        headers: { 'x-admin-pin': pin },
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Gagal menggunakan gambar tersimpan');

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, images: [...(item.images ?? []), body.url] }
            : item
        )
      );
      setStashedImages((prev) => prev.filter((s) => s.name !== stashName));
      if (selectedStashName === stashName) setSelectedStashName('');
      flash(`Gambar tersimpan ditambahkan ke ${product.name}`);
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'Gagal menggunakan gambar', true);
    } finally {
      setSavingImageFor('');
      setDraggedStashName('');
    }
  };

  const productHasActiveDropTarget = !!(selectedImageId || draggedImageId || selectedStashName || draggedStashName);

  const onProductDrop = (product: Product, e: React.DragEvent) => {
    e.preventDefault();
    const pendingId = e.dataTransfer.getData('text/plain') || draggedImageId;
    const stashName = e.dataTransfer.getData('text/stash') || draggedStashName;
    if (stashName) {
      useStashedOnProduct(product, stashName);
    } else if (pendingId) {
      attachImageToProduct(product, pendingId);
    }
  };

  const onProductClick = (product: Product) => {
    if (selectedStashName) {
      useStashedOnProduct(product, selectedStashName);
    } else if (selectedImageId) {
      attachImageToProduct(product, selectedImageId);
    }
  };

  const selectedPending = pendingImages.find((i) => i.id === selectedImageId);
  const selectedStash = stashedImages.find((s) => s.name === selectedStashName);

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-3 sm:space-y-4">

      {/* ── Zoom preview (single, shared) ── */}
      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setZoom(null)}>
          <div className="relative w-full max-w-4xl max-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoom.url} alt="Preview" className="w-full max-h-[90vh] object-contain rounded-2xl" style={{ transform: `rotate(${zoom.rotation || 0}deg)` }} />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setZoom(null); }}
              className="absolute -top-5 -right-5 bg-white text-stone-900 p-2.5 min-h-[44px] min-w-[44px] rounded-full font-bold shadow-lg border-2 border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors"
              aria-label="Tutup preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-black text-xl sm:text-2xl text-stone-900 leading-tight">Gambar Produk</h2>
          <p className="text-sm text-stone-500 mt-1 leading-relaxed max-w-[640px]">
            Pilih gambar lalu klik produk untuk tempel. Produk belum ada di daftar? Klik <span className="font-bold text-stone-600">Simpan</span> dulu — nanti bisa ditempel dari tab <span className="font-bold text-stone-600">Tersimpan</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowWm((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-3 min-h-[44px] rounded-xl text-sm font-bold border transition-all ${showWm ? 'bg-stone-100 border-stone-300 text-stone-800' : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700'}`}
            title="Pengaturan watermark"
          >
            <SlidersHorizontal className="w-5 h-5 stroke-[2.25]" />
            <span className="hidden sm:inline">Watermark</span>
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-3 min-h-[44px] bg-white border border-stone-200 hover:border-tani-400 rounded-xl text-sm font-bold text-stone-700 transition-all shadow-sm hover:shadow active:scale-[0.98]"
          >
            <svg className="w-5 h-5 text-tani-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Kamera
          </button>
          <button
            type="button"
            onClick={() => imageFileRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-3 min-h-[44px] bg-tani-700 hover:bg-tani-800 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Upload className="w-5 h-5 shrink-0 stroke-[2.25]" />
            Pilih / Drop Gambar
          </button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => e.target.files && handleProductImages(e.target.files)} />
          <input ref={imageFileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => e.target.files && handleProductImages(e.target.files)} />
        </div>
      </div>

      {/* ── Watermark (collapsible, settings persist di localStorage) ── */}
      {showWm && (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="text-xs font-black text-stone-500 uppercase tracking-wide shrink-0 px-2.5 py-1 bg-stone-50 rounded-lg border border-stone-200">Watermark</span>
            <div className="flex items-center gap-3 flex-1 min-w-[200px] max-w-[380px]">
              <span className="text-xs font-bold text-stone-600 shrink-0 w-16">Opacity</span>
              <input type="range" min="5" max="100" step="5" value={Math.round(wmAdmin.opacity * 100)}
                onChange={(e) => setWmAdmin({ ...wmAdmin, opacity: Number(e.target.value) / 100 })}
                className="flex-1 accent-tani-700 h-2 cursor-pointer" />
              <span className="text-xs font-mono font-bold text-stone-700 w-10 text-right tabular-nums">{Math.round(wmAdmin.opacity * 100)}%</span>
            </div>
            <div className="flex items-center gap-3 flex-1 min-w-[200px] max-w-[380px]">
              <span className="text-xs font-bold text-stone-600 shrink-0 w-16">Ukuran</span>
              <input type="range" min="5" max="60" step="5" value={Math.round(wmAdmin.sizeRatio * 100)}
                onChange={(e) => setWmAdmin({ ...wmAdmin, sizeRatio: Number(e.target.value) / 100 })}
                className="flex-1 accent-tani-700 h-2 cursor-pointer" />
              <span className="text-xs font-mono font-bold text-stone-700 w-10 text-right tabular-nums">{Math.round(wmAdmin.sizeRatio * 100)}%</span>
            </div>
            {pendingImages.length > 0 && (() => {
              const prev = pendingImages.find((i) => i.id === selectedImageId) ?? pendingImages[0];
              return (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-tani-400 shrink-0">
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
      )}

      {/* ── Selection toolbar (muncul hanya saat ada gambar terpilih) ── */}
      {(selectedPending || selectedStash) && (
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-2 border-tani-300 rounded-2xl px-3.5 py-2.5 flex items-center gap-3 shadow-md">
          <div className="w-11 h-11 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPending ? selectedPending.previewUrl : selectedStash!.url}
              alt=""
              draggable={false}
              className="w-full h-full object-cover"
              style={{ transform: selectedPending ? `rotate(${selectedPending.rotation}deg)` : undefined }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-stone-800 truncate">{selectedPending ? selectedPending.name : selectedStash!.name}</p>
            <p className="text-[11px] text-stone-500 truncate">
              {selectedPending ? 'Klik produk di kanan untuk tempel langsung, atau simpan dulu ke sistem' : 'Klik produk di kanan untuk tempel gambar ini'}
            </p>
          </div>
          {selectedPending && (
            <button
              type="button"
              onClick={() => stashOneImage(selectedPending.id)}
              disabled={savingStashIds.has(selectedPending.id)}
              className="inline-flex items-center gap-2 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 min-h-[44px] rounded-xl transition-colors shadow-sm disabled:opacity-60 shrink-0"
              title="Simpan gambar ke sistem storage — tempel ke produk nanti"
            >
              {savingStashIds.has(selectedPending.id) ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 stroke-[2]" />}
              Simpan
            </button>
          )}
          <button
            type="button"
            onClick={() => { setSelectedImageId(''); setSelectedStashName(''); }}
            className="p-2 min-h-[40px] min-w-[40px] text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors shrink-0 flex items-center justify-center"
            aria-label="Batal pilih gambar"
          >
            <X className="w-5 h-5 stroke-[2.25]" />
          </button>
        </div>
      )}

      {/* ── Main 2-col layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 items-start">

        {/* ── Left: Gambar (Antrean + Tersimpan dalam satu kartu bertab) ── */}
        <div className="lg:col-span-2 flex flex-col gap-3 w-full">

          {/* Drop zone (slim) */}
          <div
            className="border-2 border-dashed border-stone-300 hover:border-tani-500 rounded-2xl py-4 px-4 text-center cursor-pointer transition-all bg-stone-50 hover:bg-tani-50 active:scale-[0.99]"
            onClick={() => imageFileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-tani-500', 'bg-tani-50'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('border-tani-500', 'bg-tani-50')}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-tani-500', 'bg-tani-50'); handleProductImages(e.dataTransfer.files); }}
          >
            <p className="text-sm font-bold text-stone-600 inline-flex items-center gap-2 justify-center">
              <Upload className="w-4 h-4 stroke-[2]" />
              Klik atau drop gambar di sini
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">JPG, PNG, WebP — otomatis dikonversi ke WebP + watermark</p>
          </div>

          {/* Kartu gambar bertab */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm flex flex-col w-full">

            {/* Tab bar */}
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 border-b border-stone-200 bg-stone-50/70">
              <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setLeftTab('queue')}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 min-h-[36px] rounded-lg transition-all ${
                    leftTab === 'queue' ? 'bg-white text-tani-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 stroke-[2]" />
                  Antrean
                  <span className={`text-[11px] font-black px-1.5 rounded-full tabular-nums ${pendingImages.length > 0 ? 'bg-tani-100 text-tani-700' : 'bg-stone-200/70 text-stone-400'}`}>
                    {pendingImages.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setLeftTab('stash')}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 min-h-[36px] rounded-lg transition-all ${
                    leftTab === 'stash' ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <HardDrive className="w-4 h-4 stroke-[2]" />
                  Tersimpan
                  <span className={`text-[11px] font-black px-1.5 rounded-full tabular-nums ${stashedImages.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200/70 text-stone-400'}`}>
                    {stashedImages.length}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                {leftTab === 'queue' && pendingImages.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={stashAllPending}
                      disabled={savingStashAll}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 min-h-[36px] rounded-lg transition-colors disabled:opacity-60 border border-emerald-200"
                      title="Simpan semua gambar antrean ke sistem storage"
                    >
                      {savingStashAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2]" />}
                      Simpan Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => { pendingImages.forEach((i) => URL.revokeObjectURL(i.previewUrl)); setPendingImages([]); setSelectedImageId(''); }}
                      className="p-2 min-h-[36px] min-w-[36px] text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                      title="Kosongkan antrean"
                      aria-label="Kosongkan antrean gambar"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2]" />
                    </button>
                  </>
                )}
                {leftTab === 'stash' && (
                  <button
                    type="button"
                    onClick={loadStashedImages}
                    className="p-2 min-h-[36px] min-w-[36px] text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors flex items-center justify-center"
                    title="Muat ulang"
                    aria-label="Muat ulang gambar tersimpan"
                  >
                    <RefreshCw className={`w-4 h-4 stroke-[2] ${loadingStash ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Konten tab */}
            {leftTab === 'queue' ? (
              pendingImages.length === 0 ? (
                <div className="p-10 text-center">
                  <ImageIcon className="w-10 h-10 text-stone-200 mx-auto mb-2.5 stroke-[1.5]" />
                  <p className="text-sm font-semibold text-stone-400">Belum ada gambar di antrean</p>
                  <p className="text-xs text-stone-300 mt-1">Ambil foto atau upload untuk mulai</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 p-3 overflow-y-auto max-h-[56vh] lg:max-h-[520px]">
                  {pendingImages.map((image) => {
                    const isSaving = savingStashIds.has(image.id);
                    const isSelected = selectedImageId === image.id;
                    return (
                      <div
                        key={image.id}
                        draggable={canDrag && !isSaving}
                        onDragStart={(e) => { setDraggedImageId(image.id); e.dataTransfer.setData('text/plain', image.id); }}
                        onDragEnd={() => setDraggedImageId('')}
                        onClick={() => setSelectedImageId((cur) => cur === image.id ? '' : image.id)}
                        className={`group relative rounded-xl overflow-hidden bg-stone-100 cursor-grab active:cursor-grabbing transition-all ${
                          isSelected ? 'ring-2 ring-tani-500 shadow-md' : 'hover:shadow-sm'
                        } ${isSaving ? 'opacity-60 pointer-events-none' : ''}`}
                      >
                        <div className="aspect-square relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.previewUrl} alt="" draggable={false} className="object-cover w-full h-full" style={{ transform: `rotate(${image.rotation}deg)` }} />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/LOGO.png" alt="" aria-hidden
                            className="absolute object-contain pointer-events-none z-10"
                            style={{ width: `${wmAdmin.sizeRatio * 100}%`, opacity: wmAdmin.opacity, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                          {isSaving && (
                            <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-20">
                              <RefreshCw className="w-6 h-6 text-tani-700 animate-spin" />
                            </div>
                          )}
                          {/* Aksi hover — selalu tampil di perangkat touch */}
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-black/55 backdrop-blur-[2px] p-1 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity z-20">
                            <button type="button" onClick={(e) => { e.stopPropagation(); setZoom({ url: image.previewUrl, rotation: image.rotation }); }}
                              className="p-1.5 min-h-[30px] min-w-[30px] text-white hover:bg-white/20 rounded-md flex items-center justify-center"
                              title="Zoom">
                              <ZoomIn className="w-4 h-4 stroke-[2]" />
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setPendingImages((prev) => prev.map((img) => img.id === image.id ? { ...img, rotation: (img.rotation + 90) % 360 } : img)); }}
                              className="p-1.5 min-h-[30px] min-w-[30px] text-white hover:bg-white/20 rounded-md flex items-center justify-center"
                              title="Putar 90°">
                              <RefreshCw className="w-4 h-4 stroke-[2]" />
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); stashOneImage(image.id); }}
                              className="p-1.5 min-h-[30px] min-w-[30px] text-white hover:bg-white/20 rounded-md flex items-center justify-center"
                              title="Simpan ke sistem — tempel ke produk nanti">
                              <Save className="w-4 h-4 stroke-[2]" />
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); URL.revokeObjectURL(image.previewUrl); setPendingImages((prev) => prev.filter((it) => it.id !== image.id)); if (isSelected) setSelectedImageId(''); }}
                              className="p-1.5 min-h-[30px] min-w-[30px] text-white hover:bg-red-500/80 rounded-md flex items-center justify-center"
                              title="Hapus dari antrean">
                              <X className="w-4 h-4 stroke-[2]" />
                            </button>
                          </div>
                        </div>
                        <p className={`px-1.5 py-1 text-[10px] font-semibold truncate bg-white ${isSelected ? 'text-tani-700' : 'text-stone-500'}`}>{image.name}</p>
                        {isSelected && (
                          <span className="absolute top-1.5 left-1.5 bg-tani-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md z-20 shadow-sm">
                            ✓ PILIH
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              loadingStash && stashedImages.length === 0 ? (
                <div className="p-10 text-center">
                  <RefreshCw className="w-10 h-10 text-stone-200 mx-auto mb-2.5 animate-spin stroke-[1.5]" />
                  <p className="text-sm font-semibold text-stone-400">Memuat gambar tersimpan…</p>
                </div>
              ) : stashedImages.length === 0 ? (
                <div className="p-10 text-center">
                  <HardDrive className="w-10 h-10 text-stone-200 mx-auto mb-2.5 stroke-[1.5]" />
                  <p className="text-sm font-semibold text-stone-400">Belum ada gambar tersimpan</p>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">Simpan gambar antrean ke sistem untuk dilanjutkan nanti tanpa upload ulang</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 p-3 overflow-y-auto max-h-[56vh] lg:max-h-[520px]">
                  {stashedImages.map((stashed) => {
                    const isSelected = selectedStashName === stashed.name;
                    return (
                      <div
                        key={stashed.name}
                        draggable={canDrag}
                        onDragStart={(e) => { setDraggedStashName(stashed.name); e.dataTransfer.setData('text/stash', stashed.name); }}
                        onDragEnd={() => setDraggedStashName('')}
                        onClick={() => setSelectedStashName((cur) => cur === stashed.name ? '' : stashed.name)}
                        className={`group relative rounded-xl overflow-hidden bg-stone-100 cursor-grab active:cursor-grabbing transition-all ${
                          isSelected ? 'ring-2 ring-emerald-500 shadow-md' : 'hover:shadow-sm'
                        }`}
                      >
                        <div className="aspect-square relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={stashed.url} alt="" draggable={false} className="object-cover w-full h-full" loading="lazy" />
                          {/* Aksi hover — selalu tampil di perangkat touch */}
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-black/55 backdrop-blur-[2px] p-1 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity z-20">
                            <button type="button" onClick={(e) => { e.stopPropagation(); setZoom({ url: stashed.url }); }}
                              className="p-1.5 min-h-[30px] min-w-[30px] text-white hover:bg-white/20 rounded-md flex items-center justify-center"
                              title="Zoom">
                              <ZoomIn className="w-4 h-4 stroke-[2]" />
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); deleteStashed(stashed); }}
                              className="p-1.5 min-h-[30px] min-w-[30px] text-white hover:bg-red-500/80 rounded-md flex items-center justify-center"
                              title="Hapus dari sistem">
                              <Trash2 className="w-4 h-4 stroke-[2]" />
                            </button>
                          </div>
                        </div>
                        <p className={`px-1.5 py-1 text-[10px] font-semibold truncate bg-white ${isSelected ? 'text-emerald-700' : 'text-stone-500'}`}>{stashed.name}</p>
                        {isSelected && (
                          <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md z-20 shadow-sm">
                            ✓ PILIH
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>

        {/* ── Right: Daftar Produk ── */}
        <div className="lg:col-span-3 flex flex-col gap-3 w-full min-w-0">

          {/* Search + filter */}
          <div className="bg-white border border-stone-200 rounded-2xl p-3 shadow-sm w-full">
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 shrink-0 stroke-[2]" />
                <input
                  value={imageSearch}
                  onChange={(e) => setImageSearch(e.target.value)}
                  placeholder="Cari produk… pisahkan dengan koma: npk, urea, tomat"
                  className="w-full pl-11 pr-3 py-2.5 min-h-[44px] border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:ring-4 focus:ring-tani-100 focus:border-tani-500 placeholder:text-stone-400 placeholder:font-normal transition-all bg-white"
                />
              </div>
              {imageSearch && (
                <button
                  type="button"
                  onClick={() => setImageSearch('')}
                  className="p-2.5 min-h-[44px] min-w-[44px] text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition-colors shrink-0 flex items-center justify-center"
                  aria-label="Bersihkan pencarian"
                >
                  <X className="w-5 h-5 stroke-[2.25]" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => setImageFilter('all')}
                className={`text-xs font-bold px-3 py-1.5 min-h-[34px] rounded-lg transition-all border ${
                  imageFilter === 'all'
                    ? 'bg-tani-700 text-white shadow-sm border-tani-700'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border-stone-200'
                }`}
              >
                Semua <span className="ml-1 opacity-90 tabular-nums">({productImageStats.total})</span>
              </button>
              <button
                type="button"
                onClick={() => setImageFilter('no-images')}
                className={`text-xs font-bold px-3 py-1.5 min-h-[34px] rounded-lg transition-all border ${
                  imageFilter === 'no-images'
                    ? 'bg-amber-500 text-white shadow-sm border-amber-500'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                }`}
                title="Produk yang masih pakai gambar placeholder / belum ada gambar"
              >
                Belum Ada <span className="ml-1 opacity-90 tabular-nums">({productImageStats.noImages})</span>
              </button>
              <button
                type="button"
                onClick={() => setImageFilter('has-images')}
                className={`text-xs font-bold px-3 py-1.5 min-h-[34px] rounded-lg transition-all border ${
                  imageFilter === 'has-images'
                    ? 'bg-emerald-600 text-white shadow-sm border-emerald-600'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                }`}
              >
                Sudah Ada <span className="ml-1 opacity-90 tabular-nums">({productImageStats.hasImages})</span>
              </button>
              {searchTokens.length > 1 && searchTokens.map((tok) => (
                <span key={tok} className="inline-flex items-center gap-1 bg-tani-50 border border-tani-200 text-tani-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {tok}
                  <span className="text-tani-500 text-[11px] font-black tabular-nums">({products.filter((p) => p.name.toLowerCase().includes(tok)).length})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Product list */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm flex flex-col w-full">
            <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50/70 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-stone-500 font-medium">
                Daftar Produk <span className="tabular-nums font-bold text-stone-700">{filteredProducts.length}</span>
                <span className="mx-1">/</span>
                <span className="tabular-nums font-bold text-stone-700">{products.length}</span>
              </p>
              {productHasActiveDropTarget && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-tani-700 bg-tani-50 px-2.5 py-1 rounded-full border border-tani-200">
                  <span className="w-2 h-2 rounded-full bg-tani-500 animate-pulse shrink-0"></span>
                  Gambar aktif — klik produk untuk tempel
                </span>
              )}
            </div>

            <div className="divide-y divide-stone-100 overflow-y-auto max-h-[70vh] lg:max-h-[640px]">
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center">
                  <ImageIcon className="w-12 h-12 text-stone-200 mx-auto mb-3 stroke-[1.5]" />
                  <p className="text-base font-semibold text-stone-500">Produk tidak ditemukan</p>
                  <p className="text-xs text-stone-400 mt-1.5">Coba kata kunci lain atau ubah filter di atas</p>
                </div>
              ) : filteredProducts.map((product) => {
                const imageCount = product.images?.length ?? 0;
                const isPlaceholder = imageCount === 0;
                return (
                  <div
                    key={product.id}
                    onClick={() => onProductClick(product)}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-emerald-50'); }}
                    onDragLeave={(e) => e.currentTarget.classList.remove('bg-emerald-50')}
                    onDrop={(e) => { e.currentTarget.classList.remove('bg-emerald-50'); onProductDrop(product, e); }}
                    className={`flex items-center gap-3 px-4 py-3 transition-all w-full ${
                      productHasActiveDropTarget
                        ? 'cursor-pointer hover:bg-emerald-50'
                        : 'hover:bg-stone-50/60'
                    } ${isPlaceholder ? 'border-l-4 border-l-amber-400 bg-amber-50/30' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 border ${isPlaceholder ? 'border-amber-300 bg-amber-50' : 'border-stone-200 bg-stone-100'}`}>
                      {product.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.images[0]} alt="" draggable={false} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-amber-400 stroke-[1.75]" />
                        </div>
                      )}
                      {imageCount > 1 && (
                        <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[10px] font-black px-1.5 rounded-md tabular-nums leading-4">
                          {imageCount}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-stone-900 truncate leading-tight">{product.name}</p>
                      <p className="text-xs text-stone-500 mt-0.5 font-medium">{product.category}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {savingImageFor === product.id ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-tani-50 rounded-full border border-tani-200">
                          <RefreshCw className="w-4 h-4 animate-spin text-tani-700 stroke-[2.5]" />
                          <span className="text-[10px] font-bold text-tani-700">Menyimpan…</span>
                        </span>
                      ) : (
                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border tabular-nums ${
                          isPlaceholder
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isPlaceholder ? '⚠ Kosong' : `${imageCount} foto`}
                        </span>
                      )}
                      {productHasActiveDropTarget && !savingImageFor && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-700 font-black bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                          → Tempel
                        </span>
                      )}
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
