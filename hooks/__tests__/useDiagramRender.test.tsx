import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDiagramRender } from '@/hooks/useDiagramRender';

const fetchMock = vi.fn();
const mermaidRenderMock = vi.fn(async () => ({ svg: '<svg>local</svg>' }));
const graphvizLoadMock = vi.fn(async () => undefined);
const graphvizLayoutMock = vi.fn(async () => '<svg>graphviz</svg>');

vi.stubGlobal('fetch', fetchMock);

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: mermaidRenderMock,
  },
}));

vi.mock('@hpcc-js/wasm', () => ({
  graphviz: {
    wasmFolder: vi.fn(),
    load: graphvizLoadMock,
    layout: graphvizLayoutMock,
  },
}));

describe('useDiagramRender', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    mermaidRenderMock.mockClear();
    graphvizLoadMock.mockClear();
    graphvizLayoutMock.mockClear();
  });

  it('uses local rendering for svg mermaid diagrams', async () => {
    const { result } = renderHook(() => useDiagramRender('mermaid', 'svg', 'graph TD\nA-->B'));

    await act(async () => {
      await result.current.renderDiagram();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.svg).toBe('<svg>local</svg>');
    expect(result.current.showPreview).toBe(true);
  });

  it('uses local graphviz rendering for svg diagrams', async () => {
    const { result } = renderHook(() =>
      useDiagramRender('graphviz', 'svg', 'digraph G { A -> B }'),
    );

    await act(async () => {
      await result.current.renderDiagram();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(graphvizLayoutMock).toHaveBeenCalled();
    expect(result.current.svg).toBe('<svg>graphviz</svg>');
  });

  it('falls back to remote rendering for non-local formats', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ contentType: 'image/png', base64: 'abc123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { result } = renderHook(() => useDiagramRender('mermaid', 'png', 'graph TD\nA-->B'));

    await act(async () => {
      await result.current.renderDiagram();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.base64).toBe('abc123');
    expect(result.current.contentType).toBe('image/png');
  });

  it('uses an external abort signal for live preview remote rendering', async () => {
    const controller = new AbortController();
    let capturedSignal: AbortSignal | undefined;
    fetchMock.mockImplementationOnce((_url: string, init?: RequestInit) => {
      capturedSignal = init?.signal ?? undefined;
      return Promise.resolve(
        new Response(JSON.stringify({ contentType: 'image/png', base64: 'abc123' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    const { result } = renderHook(() => useDiagramRender('mermaid', 'png', 'graph TD\nA-->B'));

    await act(async () => {
      await result.current.renderDiagram(controller.signal);
    });

    expect(capturedSignal).toBe(controller.signal);
  });

  it('reports remote render errors with a user-friendly message', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 'KROKI_ERROR', status: 400, details: 'syntax error' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { result } = renderHook(() =>
      useDiagramRender('plantuml', 'png', '@startuml\nAlice -> Bob\n@enduml'),
    );

    await act(async () => {
      await result.current.renderDiagram();
    });

    expect(result.current.error).toContain('远程渲染服务渲染失败');
    expect(result.current.error).toContain('HTTP 502 / Kroki 400');
  });

  it('reports a clear error when remote rendering is disabled in static mode', async () => {
    const { result } = renderHook(() =>
      useDiagramRender('plantuml', 'png', '@startuml\nAlice -> Bob\n@enduml', undefined, false),
    );

    await act(async () => {
      await result.current.renderDiagram();
    });

    expect(result.current.error).toContain('静态部署模式');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('preserves local render errors when remote rendering is disabled', async () => {
    mermaidRenderMock.mockRejectedValueOnce(new Error('syntax error'));

    const { result } = renderHook(() =>
      useDiagramRender('mermaid', 'svg', 'invalid', undefined, false),
    );

    await act(async () => {
      await result.current.renderDiagram();
    });

    expect(result.current.error).toContain('syntax error');
    expect(result.current.error).not.toContain('静态部署模式');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears outputs when resetOutput is called', async () => {
    const { result } = renderHook(() => useDiagramRender('mermaid', 'svg', 'graph TD\nA-->B'));

    await act(async () => {
      await result.current.renderDiagram();
    });

    expect(result.current.svg).toBe('<svg>local</svg>');

    act(() => {
      result.current.resetOutput();
    });

    await waitFor(() => {
      expect(result.current.svg).toBe('');
      expect(result.current.base64).toBe('');
    });
  });

  describe('wasmLoadError', () => {
    it('initializes with empty wasmLoadError', () => {
      const { result } = renderHook(() => useDiagramRender('mermaid', 'svg', 'graph TD\nA-->B'));

      expect(result.current.wasmLoadError).toBe('');
    });

    it('clears wasmLoadError when engine changes', async () => {
      const { result, rerender } = renderHook(
        ({ engine }: { engine: 'mermaid' | 'graphviz' }) =>
          useDiagramRender(engine, 'svg', 'graph TD\nA-->B'),
        { initialProps: { engine: 'mermaid' as 'mermaid' | 'graphviz' } },
      );

      // 初始状态为空
      expect(result.current.wasmLoadError).toBe('');

      // 切换引擎
      rerender({ engine: 'graphviz' as 'mermaid' | 'graphviz' });

      // wasmLoadError 应该被清除
      await waitFor(() => {
        expect(result.current.wasmLoadError).toBe('');
      });
    });
  });
});
