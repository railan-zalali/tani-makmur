import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (pin === process.env.ADMIN_PIN) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'PIN Salah' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
