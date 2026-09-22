/**
 * Shared image utilities — WebP compression + watermark via Canvas 2D API.
 *
 * ponytail: watermark di-composite via Canvas 2D API — cukup untuk use-case ini.
 * Ceiling: tidak support SVG filter, animasi, atau multi-layer. Jika butuh kualitas
 * lebih tinggi, pakai sharp di server-side (API route).
 */

export type WatermarkPosition =
  | 'top-left'     | 'top-center'    | 'top-right'
  | 'center-left'  | 'center'        | 'center-right'
  | 'bottom-left'  | 'bottom-center' | 'bottom-right';

export interface WatermarkOptions {
  /** URL logo yang bisa diakses browser, e.g. '/LOGO.png' */
  logoUrl: string;
  position: WatermarkPosition;
  /** 0.0 – 1.0 */
  opacity: number;
  /** Rasio lebar logo relatif terhadap lebar gambar, 0.05 – 0.6. Default 0.25 */
  sizeRatio: number;
}

const MAX_SIDE = 1200;

/** Konversi File → WebP Blob. Downscale ke maxSide jika perlu. */
export function convertToWebp(file: File, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const srcUrl = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(srcUrl);
        reject(new Error('Browser tidak bisa memproses gambar ini'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(srcUrl);
        if (!blob) { reject(new Error(`Gagal mengubah ${file.name} ke WebP`)); return; }
        resolve(blob);
      }, 'image/webp', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(srcUrl); reject(new Error(`${file.name} bukan gambar valid`)); };
    img.src = srcUrl;
  });
}

/** Load Image dari URL, return HTMLImageElement */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal memuat gambar: ${url}`));
    img.src = url;
  });
}

/** Hitung koordinat x,y posisi logo dalam canvas */
function calcPosition(
  pos: WatermarkPosition,
  canvasW: number, canvasH: number,
  logoW: number, logoH: number,
  padding: number,
): { x: number; y: number } {
  const col = pos.endsWith('right')
    ? 'right'
    : pos.endsWith('center') && !pos.startsWith('center')
    ? 'center'
    : pos === 'center'
    ? 'center'
    : pos.includes('left')
    ? 'left'
    : 'center';

  const row = pos.startsWith('top')
    ? 'top'
    : pos.startsWith('bottom')
    ? 'bottom'
    : 'center';

  const x =
    col === 'left'   ? padding :
    col === 'right'  ? canvasW - logoW - padding :
                       (canvasW - logoW) / 2;

  const y =
    row === 'top'    ? padding :
    row === 'bottom' ? canvasH - logoH - padding :
                       (canvasH - logoH) / 2;

  return { x, y };
}

/** Terapkan watermark logo ke Blob, return Blob baru (WebP).
 *  Jika logo gagal dimuat (network error, CORS, dll), fallback graceful:
 *  log warning dan return blob asli tanpa watermark — upload tetap berjalan.
 */
export async function applyWatermark(source: Blob, opts: WatermarkOptions): Promise<Blob> {
  const srcUrl = URL.createObjectURL(source);

  // Load base image (wajib) — jika gagal, throw
  const baseImg = await loadImage(srcUrl).finally(() => URL.revokeObjectURL(srcUrl));

  // Load logo (opsional) — jika gagal, skip watermark & return source
  let logoImg: HTMLImageElement;
  try {
    logoImg = await loadImage(opts.logoUrl);
  } catch {
    console.warn('[applyWatermark] Logo gagal dimuat, watermark di-skip:', opts.logoUrl);
    return source;
  }

  const canvas = document.createElement('canvas');
  canvas.width  = baseImg.width;
  canvas.height = baseImg.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn('[applyWatermark] Canvas 2D tidak tersedia, watermark di-skip');
    return source;
  }

  // 1. Gambar base image
  ctx.drawImage(baseImg, 0, 0);

  // 2. Hitung ukuran logo
  const logoW   = Math.round(canvas.width * Math.max(0.05, Math.min(0.6, opts.sizeRatio)));
  const aspect  = logoImg.naturalHeight / logoImg.naturalWidth || 1;
  const logoH   = Math.round(logoW * aspect);
  const padding = Math.round(canvas.width * 0.025);

  const { x, y } = calcPosition(opts.position, canvas.width, canvas.height, logoW, logoH, padding);

  // 3. Composite logo dengan opacity
  ctx.globalAlpha = Math.max(0.01, Math.min(1, opts.opacity));
  ctx.drawImage(logoImg, x, y, logoW, logoH);
  ctx.globalAlpha = 1;

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Gagal menerapkan watermark')); return; }
      resolve(blob);
    }, 'image/webp', 0.82);
  });
}
