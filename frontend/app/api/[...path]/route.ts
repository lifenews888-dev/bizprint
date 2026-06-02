import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const REQUEST_TIMEOUT_MS = 15_000;
const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'accept-language',
  'authorization',
  'content-type',
  'user-agent',
  'x-api-version',
  'x-request-id',
];

const HOP_BY_HOP_HEADERS = [
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

const getBackendCandidates = () => {
  const candidates = [BACKEND_URL];
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    const current = new URL(BACKEND_URL);
    if (isDev && ['localhost', '127.0.0.1'].includes(current.hostname) && current.port === '4000') {
      candidates.push(`${current.protocol}//${current.hostname}:4001`);
    }
  } catch {}
  return Array.from(new Set(candidates));
};

const makeBackendUrl = (baseUrl: string, path: string[], req: NextRequest) => {
  const target = new URL(`/api/${path.join('/')}`, baseUrl);
  req.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });
  return target;
};

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const candidates = getBackendCandidates();
  try {
    makeBackendUrl(candidates[0], path, req);
  } catch {
    return NextResponse.json(
      { message: 'Backend API URL тохиргоо буруу байна' },
      { status: 500 },
    );
  }
  const headers = new Headers();
  FORWARDED_REQUEST_HEADERS.forEach(header => {
    const value = req.headers.get(header);
    if (value) headers.set(header, value);
  });
  const requestId = headers.get('x-request-id') || crypto.randomUUID();
  headers.set('x-request-id', requestId);
  headers.set('x-forwarded-host', req.nextUrl.host);
  headers.set('x-forwarded-proto', req.nextUrl.protocol.replace(':', ''));

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  let requestBody: ArrayBuffer | undefined;
  if (!['GET', 'HEAD'].includes(req.method)) {
    requestBody = await req.arrayBuffer();
  }

  let lastError: any = null;

  for (const [index, baseUrl] of candidates.entries()) {
    const target = makeBackendUrl(baseUrl, path, req);
    const isLast = index === candidates.length - 1;
    const attemptInit: RequestInit = {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...(requestBody ? { body: requestBody } : {}),
    };

    try {
      const res = await fetch(target, attemptInit);
      if (res.status === 404 && !isLast) {
        await res.body?.cancel().catch(() => {});
        continue;
      }
      const responseHeaders = new Headers(res.headers);
      HOP_BY_HOP_HEADERS.forEach(header => responseHeaders.delete(header));
      responseHeaders.set('x-request-id', requestId);
      responseHeaders.set('x-bizprint-backend', baseUrl);
      return new NextResponse(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
      });
    } catch (e: any) {
      lastError = e;
      if (!isLast) continue;
    }
  }

  const e = lastError;
  try {
    if (req.method === 'HEAD') {
      return new NextResponse(null, { status: 502, headers: { 'x-request-id': requestId } });
    }
    const isTimeout = e?.name === 'TimeoutError' || e?.name === 'AbortError';
    return NextResponse.json(
      { message: isTimeout ? 'Backend API хариу өгөхгүй байна' : 'Backend API холбогдохгүй байна' },
      { status: isTimeout ? 504 : 502, headers: { 'x-request-id': requestId } },
    );
  } catch {
    return NextResponse.json(
      { message: 'Backend API холбогдохгүй байна' },
      { status: 502, headers: { 'x-request-id': requestId } },
    );
  }
}

export const GET = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
