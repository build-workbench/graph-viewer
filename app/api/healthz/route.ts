import { NextResponse } from 'next/server';
import { isStaticExport } from '@/lib/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HEALTH_CHECK_TIMEOUT_MS = 5000;

type HealthStatus = {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  checks: {
    kroki: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
  };
};

async function checkKroki(): Promise<{ status: 'ok' | 'error'; latency?: number; error?: string }> {
  const krokiBaseUrl = process.env.KROKI_BASE_URL || 'https://kroki.io';

  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

    // 发送一个简单的请求到 Kroki 检查连接
    const response = await fetch(`${krokiBaseUrl}/graphviz/svg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'digraph G { A -> B }',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - start;

    if (response.ok) {
      return { status: 'ok', latency };
    }

    return { status: 'error', error: `HTTP ${response.status}` };
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return { status: 'error', error: errorMessage };
  }
}

export async function GET() {
  // 静态导出模式下不需要检查 Kroki
  if (isStaticExport) {
    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        mode: 'static',
      },
      { status: 200 },
    );
  }

  // 检查 Kroki 连接
  const krokiCheck = await checkKroki();

  // 确定整体状态
  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';
  if (krokiCheck.status === 'error') {
    overallStatus = 'degraded'; // Kroki 不可用不影响基本服务
  }

  const health: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      kroki: krokiCheck,
    },
  };

  return NextResponse.json(health, { status: 200 });
}
