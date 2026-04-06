import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app';
  const res = await fetch(`${apiUrl}/api/quote/instant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
