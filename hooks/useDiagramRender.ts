import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Engine, Format } from '@/lib/diagramConfig';
import { canUseLocalRender as canUseLocalRenderConfig } from '@/lib/diagramConfig';
import { logger } from '@/lib/logger';
import { renderDiagram as runRender, RenderError } from '@/lib/render';
import { isApiError } from '@/lib/errors';

type RenderOutputState = {
  contentType: string;
  svg: string;
  base64: string;
};

const EMPTY_OUTPUT: RenderOutputState = {
  contentType: '',
  svg: '',
  base64: '',
};

export type UseDiagramRenderResult = {
  svg: string;
  base64: string;
  contentType: string;
  loading: boolean;
  error: string;
  canUseLocalRender: boolean;
  showPreview: boolean;
  wasmLoadError: string;
  renderDiagram: (signal?: AbortSignal) => Promise<void>;
  clearError: () => void;
  setError: (message: string) => void;
  resetOutput: () => void;
};

export function useDiagramRender(
  engine: Engine,
  format: Format,
  code: string,
  krokiBaseUrl?: string,
  remoteRenderingEnabled = true,
): UseDiagramRenderResult {
  const [output, setOutput] = useState<RenderOutputState>(EMPTY_OUTPUT);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setErrorState] = useState<string>('');
  const [wasmLoadError, setWasmLoadError] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const canUseLocalRender = useMemo(
    () => canUseLocalRenderConfig(engine, format),
    [engine, format],
  );

  const showPreview = useMemo(() => {
    if (format === 'svg') {
      return Boolean(output.svg);
    }
    return Boolean(output.base64);
  }, [format, output]);

  const renderOptions = useMemo(
    () => ({ enableRemoteRendering: remoteRenderingEnabled }),
    [remoteRenderingEnabled],
  );

  useEffect(() => {
    let cancelled = false;
    setWasmLoadError('');

    if (engine === 'mermaid' || engine === 'flowchart') {
      import('mermaid')
        .then((module) => {
          if (cancelled) return;
          const mermaid = module?.default ?? module;
          if (mermaid?.initialize) {
            mermaid.initialize({
              startOnLoad: false,
              theme: 'neutral',
              securityLevel: 'strict',
            });
          }
          setWasmLoadError('');
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          const msg = e instanceof Error ? e.message : 'Unknown error';
          setWasmLoadError(`Mermaid 加载失败: ${msg}`);
          logger.error('wasm-load', { engine: 'mermaid', error: msg });
        });
    }
    if (engine === 'graphviz') {
      const wasmBaseUrl =
        process.env.NEXT_PUBLIC_GRAPHVIZ_WASM_BASE_URL ||
        'https://cdn.jsdelivr.net/npm/@hpcc-js/wasm/dist';
      import('@hpcc-js/wasm')
        .then(async (module) => {
          if (cancelled) return;
          const Graphviz = module.Graphviz as {
            wasmFolder?: (url: string) => void;
            load?: () => Promise<void>;
          };
          if (Graphviz?.wasmFolder) {
            Graphviz.wasmFolder(wasmBaseUrl);
          }
          if (Graphviz?.load) {
            await Graphviz.load();
          }
          setWasmLoadError('');
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          const msg = e instanceof Error ? e.message : 'Unknown error';
          setWasmLoadError(`Graphviz WASM 加载失败: ${msg}。请检查网络连接。`);
          logger.error('wasm-load', { engine: 'graphviz', error: msg });
        });
    }

    return () => {
      cancelled = true;
    };
  }, [engine]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const resetOutput = useCallback(() => {
    setOutput(EMPTY_OUTPUT);
  }, []);

  const clearError = useCallback(() => {
    setErrorState('');
  }, []);

  const setError = useCallback((message: string) => {
    setErrorState(message);
  }, []);

  const applyOutputIfLatest = useCallback((requestId: number, nextOutput: RenderOutputState) => {
    if (requestIdRef.current === requestId) {
      setOutput(nextOutput);
    }
  }, []);

  const renderDiagram = useCallback(
    async (externalSignal?: AbortSignal) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setErrorState('');
      resetOutput();

      try {
        if (abortRef.current) {
          abortRef.current.abort();
        }
        abortRef.current = externalSignal ? null : new AbortController();
        const signal = externalSignal ?? abortRef.current?.signal;
        if (!signal || signal.aborted) {
          return;
        }

        const result = await runRender(
          { engine, format, code, krokiBaseUrl },
          renderOptions,
          signal,
        );

        if (signal.aborted) {
          return;
        }

        applyOutputIfLatest(requestId, result);
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') {
          return;
        }
        if (e instanceof RenderError && e.code === 'ABORTED') {
          return;
        }
        if (requestIdRef.current === requestId) {
          const message =
            isApiError(e) || e instanceof RenderError
              ? e.message
              : e instanceof Error
                ? e.message || '渲染失败'
                : '渲染失败';
          setErrorState(message);
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [applyOutputIfLatest, code, engine, format, krokiBaseUrl, renderOptions, resetOutput],
  );

  return {
    svg: output.svg,
    base64: output.base64,
    contentType: output.contentType,
    loading,
    error,
    canUseLocalRender,
    showPreview,
    wasmLoadError,
    renderDiagram,
    clearError,
    setError,
    resetOutput,
  };
}
