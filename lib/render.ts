/**
 * 渲染模块
 *
 * 按 engine/format 分流到本地 WASM 渲染或远程 Kroki 代理。
 * 本地支持 mermaid / flowchart / graphviz + svg；其余走 /api/render。
 */

import type { Engine, Format } from '@/lib/diagramConfig';
import { canUseLocalRender } from '@/lib/diagramConfig';
import { ApiError, ErrorCode, createErrorFromResponse, isApiError } from '@/lib/errors';

export type RenderOutput = {
  contentType: string;
  svg: string;
  base64: string;
};

export type RenderInput = {
  engine: Engine;
  format: Format;
  code: string;
  krokiBaseUrl?: string;
};

export class RenderError extends ApiError {
  constructor(code: ErrorCode, context: Record<string, unknown> = {}) {
    super(code, context);
    this.name = 'RenderError';
  }
}

// ============================================================================
// 本地 WASM 渲染
// ============================================================================

type MermaidApi = {
  initialize?: (cfg: Record<string, unknown>) => void;
  render: (id: string, code: string) => Promise<{ svg: string }>;
};

type GraphvizApi = {
  wasmFolder?: (url: string) => void;
  load?: () => Promise<void>;
  layout: (code: string, format: string, engine: string) => Promise<string>;
};

const GRAPHVIZ_WASM_BASE_URL =
  process.env.NEXT_PUBLIC_GRAPHVIZ_WASM_BASE_URL ||
  'https://cdn.jsdelivr.net/npm/@hpcc-js/wasm/dist';

let mermaidPromise: Promise<MermaidApi> | null = null;
let graphvizPromise: Promise<GraphvizApi> | null = null;

/**
 * 加载并初始化 Mermaid（单例，重复调用返回同一 Promise）
 */
export function loadMermaid(): Promise<MermaidApi> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid')
      .then((module) => {
        const mermaid = (module?.default ?? module) as MermaidApi;
        if (mermaid?.initialize) {
          mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict' });
        }
        return mermaid;
      })
      .catch((error) => {
        mermaidPromise = null;
        throw error;
      });
  }
  return mermaidPromise;
}

/**
 * 加载并初始化 Graphviz WASM（单例，重复调用返回同一 Promise）
 */
export function loadGraphviz(): Promise<GraphvizApi> {
  if (!graphvizPromise) {
    graphvizPromise = import('@hpcc-js/wasm')
      .then(async (module) => {
        const mod = module as Record<string, unknown>;
        const g = (mod.graphviz ?? module) as GraphvizApi;
        if (g?.wasmFolder) {
          g.wasmFolder(GRAPHVIZ_WASM_BASE_URL);
        }
        if (g?.load) {
          await g.load();
        }
        return g;
      })
      .catch((error) => {
        graphvizPromise = null;
        throw error;
      });
  }
  return graphvizPromise;
}

async function renderLocal(input: RenderInput, signal?: AbortSignal): Promise<RenderOutput> {
  const { engine, code } = input;

  if (signal?.aborted) {
    throw new RenderError(ErrorCode.ABORTED);
  }

  try {
    if (engine === 'graphviz') {
      const gv = await loadGraphviz();
      if (!gv?.layout) throw new RenderError(ErrorCode.LOCAL_RENDER_FAILED);
      if (signal?.aborted) throw new RenderError(ErrorCode.ABORTED);
      const svgText = await gv.layout(code, 'svg', 'dot');
      if (!svgText) throw new RenderError(ErrorCode.LOCAL_RENDER_FAILED);
      return { contentType: 'image/svg+xml', svg: svgText as string, base64: '' };
    }

    if (engine === 'mermaid' || engine === 'flowchart') {
      const mermaid = await loadMermaid();
      if (!mermaid?.render) throw new RenderError(ErrorCode.LOCAL_RENDER_FAILED);
      if (signal?.aborted) throw new RenderError(ErrorCode.ABORTED);
      const id = `mmd-${Date.now()}`;
      const result = await mermaid.render(id, code);
      if (!result?.svg) throw new RenderError(ErrorCode.LOCAL_RENDER_FAILED);
      return { contentType: 'image/svg+xml', svg: result.svg as string, base64: '' };
    }

    throw new RenderError(ErrorCode.UNSUPPORTED_FORMAT);
  } catch (error: unknown) {
    if (error instanceof RenderError) throw error;
    throw new RenderError(ErrorCode.LOCAL_RENDER_FAILED, {
      originalMessage: error instanceof Error ? error.message : '本地渲染失败',
    });
  }
}

// ============================================================================
// 远程 Kroki 渲染
// ============================================================================

async function renderRemote(
  input: RenderInput,
  signal: AbortSignal | undefined,
  enabled: boolean,
): Promise<RenderOutput> {
  if (!enabled) {
    throw new RenderError(ErrorCode.REMOTE_DISABLED);
  }

  const { engine, format, code, krokiBaseUrl } = input;

  if (signal?.aborted) {
    throw new RenderError(ErrorCode.ABORTED);
  }

  try {
    const payload: Record<string, unknown> = { engine, format, code };
    const customBaseUrl = typeof krokiBaseUrl === 'string' ? krokiBaseUrl.trim() : '';
    if (customBaseUrl) {
      payload.krokiBaseUrl = customBaseUrl;
    }

    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw createErrorFromResponse(res, json);
    }

    const data = (await res.json()) as {
      contentType?: string;
      svg?: string;
      base64?: string;
    };

    return {
      contentType: data.contentType || '',
      svg: data.svg || '',
      base64: data.base64 || '',
    };
  } catch (error: unknown) {
    if (isApiError(error)) {
      throw new RenderError(error.code, error.context);
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new RenderError(ErrorCode.ABORTED);
    }
    throw new RenderError(ErrorCode.NETWORK_ERROR, {
      originalMessage: error instanceof Error ? error.message : '网络错误',
    });
  }
}

// ============================================================================
// 公共入口
// ============================================================================

export type RenderOptions = {
  enableRemoteRendering: boolean;
};

export async function renderDiagram(
  input: RenderInput,
  options: RenderOptions,
  signal?: AbortSignal,
): Promise<RenderOutput> {
  const { engine, format } = input;

  if (canUseLocalRender(engine, format)) {
    return renderLocal(input, signal);
  }

  if (options.enableRemoteRendering) {
    return renderRemote(input, signal, true);
  }

  throw new RenderError(ErrorCode.REMOTE_DISABLED);
}
