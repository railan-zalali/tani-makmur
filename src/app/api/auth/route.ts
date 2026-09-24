import { NextRequest, NextResponse } from 'next/server';

// ponytail: in-memory rate limit — cukup untuk admin panel 1 toko.
// Ceiling: restart server reset counter; tidak scale di multi-instance.
// Upgrade path: pakai Upstash Redis + @vercel/kv jika butuh distributed rate limit.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 menit

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const now = Date.now();
  const entry = attempts.get(ip);

  if (entry) {
    if (now < entry.resetAt && entry.count >= MAX_ATTEMPTS) {
      const waitMin = Math.ceil((entry.resetAt - now) / 60000);
      return NextResponse.json(
        { error: `Terlalu banyak percobaan. Coba lagi dalam ${waitMin} menit.` },
        { status: 429 }
      );
    }
    if (now >= entry.resetAt) {
      attempts.delete(ip); // reset window
    }
  }

  try {
    const { pin } = await req.json();
    if (pin === process.env.ADMIN_PIN) {
      attempts.delete(ip); // sukses → reset counter
      return NextResponse.json({ ok: true });
    }

    // Gagal → increment counter
    const current = attempts.get(ip);
    attempts.set(ip, {
      count: (current?.count ?? 0) + 1,
      resetAt: current?.resetAt ?? now + WINDOW_MS,
    });
    return NextResponse.json({ error: 'PIN Salah' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
