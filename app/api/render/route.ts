import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getKrokiType, isEngine, isFormat } from '@/lib/diagramConfig';
import { logger } from '@/lib/logger';
import { APP_CONFIG } from '@/lib/config';
import { checkRateLimit, pruneRateLimitCache } from '@/lib/server/rateLimit';
import { renderCache, type RenderCacheEntry } from '@/lib/server/renderCache';
import { ApiError, ErrorCode } from '@/lib/errors';

// Detect static export mode / 检测静态导出模式
const isStaticExport =
  process.env.GITHUB_PAGES === 'true' || process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';

export const runtime = 'nodejs';
// API routes are removed during static export build, so always use force-dynamic
// API 路由在静态导出构建期间会被移除，因此始终使用 force-dynamic
export const dynamic = 'force-dynamic';

function normalizeKrokiBaseUrl(value: string): string | null {
  try {
    const u = new URL(value);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (u.username || u.password) return null;
    if (u.search || u.hash) return null;
    const pathname = u.pathname.replace(/\/$/, '');
    return `${u.origin}${pathname}`;
  } catch {
    return null;
  }
}

function parseKrokiBaseUrlAllowlist(raw: string | undefined): Set<string> {
  const parts = (raw || '')
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out = new Set<string>();
  for (const p of parts) {
    const n = normalizeKrokiBaseUrl(p);
    if (n) out.add(n);
  }
  return out;
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  const out = new ArrayBuffer(buf.byteLength);
  new Uint8Array(out).set(buf);
  return out;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function POST(req: NextRequest) {
  // NOTE: This code path is effectively unreachable in static export builds
  // because scripts/build-static-export.mjs removes the app/api directory.
  // The check remains for safety in case the API route is somehow accessed.
  if (isStaticExport) {
    return NextResponse.json(
      {
        error:
          'API not available in static export mode. Please use Docker deployment for full functionality.',
      },
      { status: 503 },
    );
  }

  // === 请求体大小限制 ===
  const MAX_BODY_SIZE = 150_000; // 略大于 maxCodeLength (100KB)
  const contentLength = req.headers.get('content-length');
  const transferEncoding = req.headers.get('transfer-encoding');

  // 检查 Content-Length（对于有明确长度的请求）
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    logger.warn('render', { message: 'Request body too large', contentLength });
    const error = new ApiError(ErrorCode.PAYLOAD_TOO_LARGE, { maxLength: MAX_BODY_SIZE });
    return NextResponse.json(error.toJSON(), { status: 413 });
  }

  // 检查 Transfer-Encoding: chunked（流式请求）
  // Next.js 默认有内置限制，但我们记录警告以便监控
  if (transferEncoding?.toLowerCase().includes('chunked')) {
    logger.info('render', {
      message: 'Chunked transfer encoding detected, relying on Next.js body limit',
    });
  }

  // === 速率限制检查 ===
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  pruneRateLimitCache();
  const rateLimitResult = checkRateLimit(clientIp);
  if (!rateLimitResult.allowed) {
    logger.warn('render', { message: 'Rate limit exceeded', ip: clientIp });
    const error = new ApiError(ErrorCode.RATE_LIMIT_EXCEEDED);
    return NextResponse.json(error.toJSON(), {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetAt / 1000)),
      },
    });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      const error = new ApiError(ErrorCode.INVALID_BODY);
      return NextResponse.json(error.toJSON(), { status: 400 });
    }

    const { engine, format, code, binary, krokiBaseUrl } = body as {
      engine?: string;
      format?: string;
      code?: string;
      binary?: boolean;
      krokiBaseUrl?: string;
    };

    if (!engine || !format || typeof code !== 'string') {
      const error = new ApiError(ErrorCode.MISSING_FIELDS);
      return NextResponse.json(error.toJSON(), { status: 400 });
    }

    if (!isEngine(engine)) {
      logger.warn('render', { message: 'Unsupported engine', engine });
      const error = new ApiError(ErrorCode.UNSUPPORTED_ENGINE);
      return NextResponse.json(error.toJSON(), { status: 400 });
    }
    if (!isFormat(format)) {
      logger.warn('render', { message: 'Unsupported format', format });
      const error = new ApiError(ErrorCode.UNSUPPORTED_FORMAT);
      return NextResponse.json(error.toJSON(), { status: 400 });
    }

    if (code.length > APP_CONFIG.render.maxCodeLength) {
      logger.error('render', { message: 'Code too long', engine, format, length: code.length });
      const error = new ApiError(ErrorCode.PAYLOAD_TOO_LARGE, {
        maxLength: APP_CONFIG.render.maxCodeLength,
      });
      return NextResponse.json(error.toJSON(), { status: 413 });
    }

    const type = getKrokiType(engine);

    const envBaseRaw = process.env.KROKI_BASE_URL || 'https://kroki.io';
    const envBase = normalizeKrokiBaseUrl(envBaseRaw);
    if (!envBase) {
      throw new ApiError(ErrorCode.INVALID_KROKI_CONFIG);
    }

    let base = envBase;
    const requestedBaseRaw = typeof krokiBaseUrl === 'string' ? krokiBaseUrl.trim() : '';
    if (requestedBaseRaw) {
      const requested = normalizeKrokiBaseUrl(requestedBaseRaw);
      if (!requested) {
        throw new ApiError(ErrorCode.INVALID_KROKI_BASE_URL);
      }

      // 安全策略：
      // 1. 如果 KROKI_ALLOW_CLIENT_BASE_URL=true，允许任意 URL（不推荐，仅用于开发测试）
      // 2. 否则，检查 KROKI_CLIENT_BASE_URL_ALLOWLIST 白名单
      // 3. 如果白名单为空，默认只允许 KROKI_BASE_URL
      const allowAny = (process.env.KROKI_ALLOW_CLIENT_BASE_URL || '').toLowerCase() === 'true';
      const allowlist = parseKrokiBaseUrlAllowlist(process.env.KROKI_CLIENT_BASE_URL_ALLOWLIST);

      if (allowAny) {
        // 允许任意 URL（生产环境不推荐）
        logger.warn('render', { message: 'Allowing arbitrary Kroki URL', requested });
        base = requested;
      } else if (allowlist.has(requested)) {
        // URL 在白名单中
        base = requested;
      } else if (requested === envBase) {
        // URL 与默认的 KROKI_BASE_URL 相同
        base = requested;
      } else {
        // 拒绝其他 URL
        throw new ApiError(ErrorCode.KROKI_BASE_URL_NOT_ALLOWED);
      }
    }

    const url = `${base}/${type}/${format}`;
    const accept =
      format === 'svg' ? 'image/svg+xml' : format === 'png' ? 'image/png' : 'application/pdf';

    const now = Date.now();
    renderCache.prune(now);

    const k = renderCache.createKey(base, engine, format, code);
    const cached = renderCache.get(k);
    if (cached && !renderCache.isExpired(cached, now)) {
      // Add caching headers for client-side cache reuse
      const cacheControl = 'public, max-age=3600';
      const etagHash = createHash('sha256')
        .update(cached.svg || cached.base64 || '')
        .digest('hex')
        .substring(0, 16);
      const etag = `"${etagHash}"`;

      if (binary) {
        if (format === 'svg' && cached.svg) {
          return new NextResponse(toArrayBuffer(Buffer.from(cached.svg)), {
            status: 200,
            headers: {
              'Content-Type': cached.contentType,
              'Content-Disposition': `attachment; filename=diagram.${format}`,
              'Cache-Control': cacheControl,
              ETag: etag,
            },
          });
        }
        if (cached.base64) {
          const buf = Buffer.from(cached.base64, 'base64');
          return new NextResponse(toArrayBuffer(buf), {
            status: 200,
            headers: {
              'Content-Type': cached.contentType,
              'Content-Disposition': `attachment; filename=diagram.${format}`,
              'Cache-Control': cacheControl,
              ETag: etag,
            },
          });
        }
      } else {
        if (format === 'svg' && cached.svg) {
          return NextResponse.json(
            { contentType: cached.contentType, svg: cached.svg },
            {
              headers: {
                'Cache-Control': cacheControl,
                ETag: etag,
              },
            },
          );
        } else if (cached.base64) {
          return NextResponse.json(
            { contentType: cached.contentType, base64: cached.base64 },
            {
              headers: {
                'Cache-Control': cacheControl,
                ETag: etag,
              },
            },
          );
        }
      }
    }

    let task = renderCache.getInflight(k);
    if (!task) {
      task = (async () => {
        let krokiResp: Response;
        try {
          krokiResp = await fetchWithTimeout(
            url,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                Accept: accept,
                'User-Agent':
                  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36 GraphViewer/1.0.0',
              },
              body: code,
            },
            APP_CONFIG.render.timeoutMs,
          );
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
            logger.error('render', {
              message: 'Kroki timeout',
              engine,
              format,
              timeoutMs: APP_CONFIG.render.timeoutMs,
              length: code.length,
            });
            throw new ApiError(ErrorCode.KROKI_TIMEOUT, { krokiUrl: url });
          }
          const errMsg = error instanceof Error ? error.message : '';
          logger.error('render', {
            message: 'Kroki network error',
            engine,
            format,
            length: code.length,
            error: errMsg,
          });
          throw new ApiError(ErrorCode.KROKI_NETWORK_ERROR, {
            krokiUrl: url,
            originalMessage: errMsg,
          });
        }

        if (!krokiResp.ok) {
          const text = await krokiResp.text().catch(() => '');
          logger.error('render', {
            message: 'Kroki render error',
            engine,
            format,
            status: krokiResp.status,
            length: code.length,
          });
          throw new ApiError(ErrorCode.KROKI_ERROR, {
            httpStatus: 502,
            krokiStatus: krokiResp.status,
            krokiUrl: url,
            details: text.slice(0, 2000),
          });
        }

        const arrayBuffer = await krokiResp.arrayBuffer();
        const contentType =
          krokiResp.headers.get('content-type') ||
          (format === 'svg' ? 'image/svg+xml' : format === 'png' ? 'image/png' : 'application/pdf');
        const buffer = Buffer.from(arrayBuffer);
        const cacheEntry: RenderCacheEntry = {
          expires: Date.now() + APP_CONFIG.cache.ttlMs,
          contentType,
        };

        if (format === 'svg') {
          const svgText = new TextDecoder().decode(buffer);
          cacheEntry.svg = svgText;
        } else {
          const base64 = buffer.toString('base64');
          cacheEntry.base64 = base64;
        }

        renderCache.set(k, cacheEntry);
        renderCache.prune(Date.now());

        return { buffer, cacheEntry };
      })().finally(() => {
        renderCache.deleteInflight(k);
      });
      renderCache.setInflight(k, task);
    }

    const { buffer, cacheEntry } = await task;
    const contentType = cacheEntry.contentType;

    // 速率限制响应头
    const rateLimitHeaders = {
      'X-RateLimit-Remaining': String(rateLimitResult.remaining),
      'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetAt / 1000)),
    };

    if (!binary) {
      if (format === 'svg') {
        const svgText = cacheEntry.svg ?? new TextDecoder().decode(buffer);
        return NextResponse.json({ contentType, svg: svgText }, { headers: rateLimitHeaders });
      }
      const base64 = cacheEntry.base64 ?? buffer.toString('base64');
      return NextResponse.json({ contentType, base64 }, { headers: rateLimitHeaders });
    }

    return new NextResponse(toArrayBuffer(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename=diagram.${format}`,
        ...rateLimitHeaders,
      },
    });
  } catch (e: unknown) {
    if (e instanceof ApiError) {
      let statusCode = 500;

      // 根据错误码映射 HTTP 状态码
      switch (e.code) {
        case ErrorCode.KROKI_TIMEOUT:
          statusCode = 504;
          break;
        case ErrorCode.KROKI_NETWORK_ERROR:
        case ErrorCode.KROKI_ERROR:
          statusCode = 502;
          break;
        case ErrorCode.PAYLOAD_TOO_LARGE:
          statusCode = 413;
          break;
        case ErrorCode.RATE_LIMIT_EXCEEDED:
          statusCode = 429;
          break;
        case ErrorCode.INVALID_BODY:
        case ErrorCode.MISSING_FIELDS:
        case ErrorCode.UNSUPPORTED_ENGINE:
        case ErrorCode.UNSUPPORTED_FORMAT:
        case ErrorCode.INVALID_KROKI_BASE_URL:
        case ErrorCode.KROKI_BASE_URL_NOT_ALLOWED:
          statusCode = 400;
          break;
      }

      return NextResponse.json(e.toJSON(), { status: statusCode });
    }
    const errMsg = e instanceof Error ? e.message : '';
    logger.error('render', { message: 'Unexpected server error', error: errMsg });
    return NextResponse.json({ error: 'Server error', message: errMsg }, { status: 500 });
  }
}
