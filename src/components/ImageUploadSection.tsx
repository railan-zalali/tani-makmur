'use client';

/**
 * ImageUploadSection — komponen upload gambar untuk halaman Edit Produk.
 * Fitur: ambil foto (camera), pilih dari galeri, WebP compression, watermark logo.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera, ImagePlus, Trash2, RefreshCw, X,
  ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';
import { convertToWebp, applyWatermark, WatermarkPosition } from '@/utils/imageUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingImage {
  localId: string;
  previewUrl: string;      // ObjectURL (revoke on cleanup)
  blob: Blob;
  fileName: string;
  status: 'ready' | 'uploading' | 'done' | 'error';
  error?: string;
  uploadedUrl?: string;
  rotation: number;
}

interface WatermarkSettings {
  enabled: boolean;
  position: WatermarkPosition;
  opacity: number;   // 0.05 – 1.0
  sizeRatio: number; // 0.05 – 0.6
}

const STORAGE_KEY = 'tani_watermark_settings';

const DEFAULT_WM: WatermarkSettings = {
  enabled: true,
  position: 'bottom-right',
  opacity: 1.0,
  sizeRatio: 0.25,
};

const POSITIONS: WatermarkPosition[] = [
  'top-left',    'top-center',    'top-right',
  'center-left', 'center',        'center-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

const POS_LABEL: Record<WatermarkPosition, string> = {
  'top-left': '↖', 'top-center': '↑', 'top-right': '↗',
  'center-left': '←', 'center': '•', 'center-right': '→',
  'bottom-left': '↙', 'bottom-center': '↓', 'bottom-right': '↘',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  productId: string;
  images: string[];           // form.images dari parent
  pin: string;
  onChange: (images: string[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

// Posisi watermark CSS — overlay diletakkan di wrapper yang TIDAK ikut rotate,
// sehingga koordinatnya match dengan hasil canvas applyWatermark (gambar sudah
// di-rotate ke canvas, lalu watermark ditempel di atas canvas yang sudah dirotate).
const getPreviewPositionStyles = (pos: WatermarkPosition): React.CSSProperties => {
  const pad = '2.5%';
  const base: React.CSSProperties = {};
  if (pos.includes('top')) base.top = pad;
  if (pos.includes('bottom')) base.bottom = pad;
  if (pos.includes('left')) base.left = pad;
  if (pos.includes('right')) base.right = pad;
  
  let t = '';
  if (pos === 'top-center' || pos === 'bottom-center') { base.left = '50%'; t = 'translateX(-50%)'; }
  else if (pos === 'center-left' || pos === 'center-right') { base.top = '50%'; t = 'translateY(-50%)'; }
  else if (pos === 'center') { base.top = '50%'; base.left = '50%'; t = 'translate(-50%, -50%)'; }
  if (t) base.transform = t;
  return base;
};

export default function ImageUploadSection({ productId, images, pin, onChange }: Props) {
  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [pending, setPending]       = useState<PendingImage[]>([]);
  // Ref untuk baca pending terkini dari dalam async callback tanpa stale closure
  const pendingRef = useRef<PendingImage[]>([]);
  const [wm, setWm]                 = useState<WatermarkSettings>(DEFAULT_WM);
  const wmRef = useRef<WatermarkSettings>(DEFAULT_WM);
  const [showWmPanel, setShowWmPanel] = useState(false);
  const [showManual, setShowManual]   = useState(false);
  const [processing, setProcessing]   = useState(false);
  const [isDragging, setIsDragging]   = useState(false);

  // Sync ref setiap kali state berubah
  useEffect(() => { pendingRef.current = pending; }, [pending]);
  useEffect(() => { wmRef.current = wm; }, [wm]);

  // Load watermark settings dari localStorage (persist antar produk)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setWm({ ...DEFAULT_WM, ...JSON.parse(saved) });
    } catch { /* ignore */ }
  }, []);

  const saveWm = useCallback((next: WatermarkSettings) => {
    setWm(next);
    wmRef.current = next;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  // Cleanup ObjectURLs on unmount
  useEffect(() => {
    return () => {
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Process File(s) ────────────────────────────────────────────────────────

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!arr.length) return;
    setProcessing(true);

    const results: PendingImage[] = [];
    for (const file of arr) {
      try {
        const blob = await convertToWebp(file);
        const localId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const baseName = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) || 'produk';
        results.push({
          localId,
          previewUrl: URL.createObjectURL(blob),
          blob,
          fileName: `${baseName}.webp`,
          status: 'ready',
          rotation: 0,
        });
      } catch (err) {
        console.error('processFiles error:', err);
      }
    }

    if (results.length) {
      setPending((prev) => [...prev, ...results]);
    }
    setProcessing(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);
  
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  // ── Upload single pending image ────────────────────────────────────────────

  const uploadOne = useCallback(async (localId: string) => {
    // Tandai uploading
    setPending((prev) =>
      prev.map((p) => p.localId === localId ? { ...p, status: 'uploading' } : p)
    );

    // Baca item dari ref (selalu fresh, bebas stale closure)
    const item = pendingRef.current.find((p) => p.localId === localId);
    if (!item) return;

    // Baca wm settings dari ref (selalu fresh)
    const currentWm = wmRef.current;

    try {
      let finalBlob = item.blob;
      if (currentWm.enabled) {
        // applyWatermark sudah graceful fallback — tidak akan throw jika LOGO.png gagal
        const watermarkedBlob = await applyWatermark(item.blob, {
          logoUrl: '/LOGO.png',
          position: currentWm.position,
          opacity: currentWm.opacity,
          sizeRatio: currentWm.sizeRatio,
          rotation: item.rotation,
        });
        finalBlob = watermarkedBlob;
      }

      const form = new FormData();
      form.append('productId', productId);
      form.append('fileName', item.fileName);
      form.append('image', finalBlob, item.fileName);

      const res  = await fetch('/api/product-images', {
        method: 'POST',
        headers: { 'x-admin-pin': pin },
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Upload gagal');

      const url: string = body.url;
      // Gunakan callback form agar tidak bergantung pada closure images yang stale
      onChange([...images, url]);

      setPending((prev) =>
        prev.map((p) =>
          p.localId === localId ? { ...p, status: 'done', uploadedUrl: url } : p
        )
      );
    } catch (err) {
      setPending((prev) =>
        prev.map((p) =>
          p.localId === localId
            ? { ...p, status: 'error', error: err instanceof Error ? err.message : 'Upload gagal' }
            : p
        )
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, pin, images, onChange]);

  // Upload all ready ones — baca dari ref untuk hindari stale closure
  const uploadAll = useCallback(() => {
    pendingRef.current
      .filter((p) => p.status === 'ready')
      .forEach((p) => uploadOne(p.localId));
  }, [uploadOne]);

  const removePending = (localId: string) => {
    const item = pending.find((p) => p.localId === localId);
    if (item) URL.revokeObjectURL(item.previewUrl);
    setPending((prev) => prev.filter((p) => p.localId !== localId));
  };

  const removeExisting = (url: string) => {
    onChange(images.filter((u) => u !== url));
  };

  const readyCount = pending.filter((p) => p.status === 'ready').length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Existing images grid ── */}
      {images.length > 0 && (
        <div>
          <p className="text-xs font-bold text-stone-500 mb-2">
            Gambar saat ini ({images.length})
          </p>
          <div className="grid grid-cols-3 gap-2">
            {images.map((url, i) => (
              <div key={url} className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-square bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url} alt={`Gambar ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {i === 0 && (
                  <span className="absolute top-1 left-1 text-[10px] bg-tani-700 text-white font-bold px-1.5 py-0.5 rounded-md">
                    Utama
                  </span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <a
                    href={url} target="_blank" rel="noreferrer"
                    className="p-1.5 bg-white/90 rounded-lg text-stone-700 hover:bg-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => removeExisting(url)}
                    className="p-1.5 bg-white/90 rounded-lg text-red-600 hover:bg-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Watermark settings panel ── */}
      <div className="border border-stone-200 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowWmPanel((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100 transition-colors text-sm"
        >
          <span className="flex items-center gap-2 font-bold text-stone-700">
            <span
              className={`w-2 h-2 rounded-full ${wm.enabled ? 'bg-tani-600' : 'bg-stone-300'}`}
            />
            Watermark Logo & Rotasi
            {wm.enabled && (
              <span className="text-xs font-normal text-stone-400">
                {Math.round(wm.opacity * 100)}% opacity · {Math.round(wm.sizeRatio * 100)}% ukuran
              </span>
            )}
          </span>
          {showWmPanel ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </button>

        {showWmPanel && (
          <div className="p-4 space-y-4 bg-white border-t border-stone-100">
            {/* Toggle on/off */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => saveWm({ ...wm, enabled: !wm.enabled })}
                className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors cursor-pointer ${wm.enabled ? 'bg-tani-600' : 'bg-stone-200'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${wm.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm font-semibold text-stone-700">
                {wm.enabled ? 'Watermark aktif' : 'Watermark nonaktif'}
              </span>
            </label>

            {wm.enabled && (
              <>
                {/* Position grid 3×3 */}
                <div>
                  <p className="text-xs font-bold text-stone-500 mb-2">Posisi</p>
                  <div className="grid grid-cols-3 gap-1 w-fit">
                    {POSITIONS.map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => saveWm({ ...wm, position: pos })}
                        className={`w-10 h-10 rounded-lg text-lg font-bold transition-all ${
                          wm.position === pos
                            ? 'bg-tani-700 text-white shadow-sm'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                        title={pos}
                      >
                        {POS_LABEL[pos]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opacity slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-stone-500">Opacity</p>
                    <span className="text-xs font-mono text-stone-600">{Math.round(wm.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range" min="5" max="100" step="5"
                    value={Math.round(wm.opacity * 100)}
                    onChange={(e) => saveWm({ ...wm, opacity: Number(e.target.value) / 100 })}
                    className="w-full accent-tani-700"
                  />
                </div>

                {/* Size slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-stone-500">Ukuran Logo</p>
                    <span className="text-xs font-mono text-stone-600">{Math.round(wm.sizeRatio * 100)}% lebar gambar</span>
                  </div>
                  <input
                    type="range" min="5" max="60" step="5"
                    value={Math.round(wm.sizeRatio * 100)}
                    onChange={(e) => saveWm({ ...wm, sizeRatio: Number(e.target.value) / 100 })}
                    className="w-full accent-tani-700"
                  />
                </div>

                  {/* Rotasi sekarang ada di masing-masing gambar */}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Upload buttons + Drag & Drop zone ── */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`p-3 border-2 border-dashed rounded-2xl transition-colors ${
          isDragging ? 'border-tani-500 bg-tani-50' : 'border-stone-200 bg-stone-50/50'
        }`}
      >
        {/* Hidden inputs */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={processing}
            className="flex flex-col items-center gap-2 py-4 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {processing ? <RefreshCw className="w-6 h-6 text-tani-600 animate-spin" /> : <Camera className="w-6 h-6 text-tani-700" />}
            <span className="text-xs font-bold text-stone-700">Ambil Foto</span>
            <span className="text-[10px] text-stone-400">Buka kamera</span>
          </button>

          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={processing}
            className="flex flex-col items-center gap-2 py-4 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {processing ? <RefreshCw className="w-6 h-6 text-tani-600 animate-spin" /> : <ImagePlus className="w-6 h-6 text-tani-700" />}
            <span className="text-xs font-bold text-stone-700">Pilih Galeri</span>
            <span className="text-[10px] text-stone-400">Multi-pilih OK</span>
          </button>
        </div>

        {/* Drag hint — selalu tampil */}
        <p className={`text-center text-[10px] mt-2 transition-colors ${
          isDragging ? 'text-tani-600 font-bold' : 'text-stone-400'
        }`}>
          {isDragging ? '✦ Lepaskan untuk upload' : '↓ Drag & drop gambar ke sini'}
        </p>
      </div>

      {/* ── Pending queue ── */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-stone-500">
              Antrean upload ({pending.length})
            </p>
            <div className="flex gap-2">
              {readyCount > 0 && (
                <button
                  type="button"
                  onClick={uploadAll}
                  className="text-xs font-bold text-tani-700 hover:text-tani-800 bg-tani-50 hover:bg-tani-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Upload Semua ({readyCount})
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
                  setPending([]);
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Bersihkan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {pending.map((item) => (
              <div
                key={item.localId}
                className={`relative rounded-xl overflow-hidden border ${
                  item.status === 'done'  ? 'border-emerald-300 bg-emerald-50' :
                  item.status === 'error' ? 'border-red-300 bg-red-50' :
                  item.status === 'uploading' ? 'border-tani-300' :
                  'border-stone-200'
                }`}
              >
                  {/* Wrapper: overflow-hidden untuk clip gambar yang keluar saat rotasi */}
                  <div className="aspect-square bg-stone-100 relative overflow-hidden group">
                    {/* Inner: clip frame untuk gambar yang dirotate */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img
                        src={item.previewUrl} alt={item.fileName}
                        className="object-cover transition-transform duration-300"
                        style={{
                          width: item.rotation === 90 || item.rotation === 270 ? 'auto' : '100%',
                          height: item.rotation === 90 || item.rotation === 270 ? '100%' : 'auto',
                          minWidth: '100%',
                          minHeight: '100%',
                          transform: `rotate(${item.rotation}deg)`
                        }}
                      />
                    </div>

                    {/* Watermark overlay — di luar div yang rotate agar posisinya
                        sesuai dengan hasil akhir canvas (gambar sudah dirotate,
                        watermark ditempel di atas canvas pada koordinat final) */}
                    {wm.enabled && (
                      <img
                        src="/LOGO.png"
                        alt=""
                        aria-hidden="true"
                        className="absolute object-contain pointer-events-none z-10"
                        style={{
                          width: `${wm.sizeRatio * 100}%`,
                          opacity: wm.opacity,
                          ...getPreviewPositionStyles(wm.position)
                        }}
                      />
                    )}

                    {/* Tombol rotate individual */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPending(prev => prev.map(img => img.localId === item.localId ? { ...img, rotation: (img.rotation + 90) % 360 } : img));
                      }}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      title="Putar gambar 90°"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                {/* Overlay status */}
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-tani-700 animate-spin" />
                  </div>
                )}
                {item.status === 'done' && (
                  <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                    <div className="bg-emerald-500 rounded-full p-1">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Actions bar */}
                <div className="p-1.5 flex items-center justify-between gap-1">
                  {item.status === 'ready' && (
                    <button
                      type="button"
                      onClick={() => uploadOne(item.localId)}
                      className="flex-1 text-[11px] font-bold text-tani-700 bg-tani-50 hover:bg-tani-100 py-1 rounded-lg transition-colors"
                    >
                      Upload
                    </button>
                  )}
                  {item.status === 'error' && (
                    <button
                      type="button"
                      onClick={() => uploadOne(item.localId)}
                      className="flex-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 py-1 rounded-lg transition-colors"
                      title={item.error}
                    >
                      Coba Lagi
                    </button>
                  )}
                  {item.status === 'done' && (
                    <span className="flex-1 text-[11px] font-bold text-emerald-600 text-center">
                      ✓ Tersimpan
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePending(item.localId)}
                    className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Manual URL fallback ── */}
      <div>
        <button
          type="button"
          onClick={() => setShowManual((v) => !v)}
          className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1 transition-colors"
        >
          {showManual ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Edit URL manual
        </button>
        {showManual && (
          <div className="mt-2 space-y-1.5">
            <p className="text-[11px] text-stone-400">Satu URL per baris. Baris pertama = gambar utama.</p>
            <textarea
              rows={4}
              value={images.join('\n')}
              onChange={(e) =>
                onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))
              }
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-tani-500 resize-none font-mono"
              placeholder="https://..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
