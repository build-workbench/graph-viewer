import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDiagramState } from '@/hooks/useDiagramState';

const STORAGE_KEY = 'graphviewer:state:v1';

function setSearch(search: string) {
  window.history.replaceState({}, '', search ? `/?${search}` : '/');
}

describe('useDiagramState', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setSearch('');
  });

  it('creates an initial diagram after hydration', async () => {
    const initialCode = 'graph TD\nA-->B';
    const { result } = renderHook(() => useDiagramState(initialCode));

    await waitFor(() => {
      expect(result.current.diagrams).toHaveLength(1);
      expect(result.current.currentId).toBe(result.current.diagrams[0]?.id);
    });

    expect(result.current.engine).toBe('mermaid');
    expect(result.current.format).toBe('svg');
    expect(result.current.code).toBe(initialCode);
    expect(result.current.codeStats.lines).toBe(2);
    expect(result.current.codeStats.chars).toBe(initialCode.length);
    expect(result.current.diagrams[0]).toMatchObject({
      name: '未命名图 1',
      engine: 'mermaid',
      format: 'svg',
      code: initialCode,
    });
  });

  it('persists workspace using diagrams and currentId only after hydration', async () => {
    const { result } = renderHook(() => useDiagramState('seed'));

    await waitFor(() => {
      expect(result.current.diagrams).toHaveLength(1);
    });

    await waitFor(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw || '{}');
      expect(parsed.currentId).toBe(result.current.currentId);
      expect(parsed.diagrams).toHaveLength(1);
      expect(parsed.engine).toBeUndefined();
      expect(parsed.format).toBeUndefined();
      expect(parsed.code).toBeUndefined();
    });
  });

  it('restores persisted state from localStorage without overwriting it on first mount', async () => {
    const persisted = {
      currentId: 'd-2',
      diagrams: [
        {
          id: 'd-1',
          name: '图 1',
          engine: 'mermaid',
          format: 'svg',
          code: 'graph TD\nA-->B',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'd-2',
          name: '图 2',
          engine: 'graphviz',
          format: 'svg',
          code: 'digraph G { A -> B }',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ],
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

    const { result } = renderHook(() => useDiagramState('fallback'));

    await waitFor(() => {
      expect(result.current.currentId).toBe('d-2');
    });

    expect(result.current.diagrams).toHaveLength(2);
    expect(result.current.engine).toBe('graphviz');
    expect(result.current.format).toBe('svg');
    expect(result.current.code).toBe('digraph G { A -> B }');
    expect(result.current.diagrams.map((diagram: { id: string }) => diagram.id)).toEqual([
      'd-1',
      'd-2',
    ]);
  });

  it('prefers query parameters over persisted workspace state', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentId: 'persisted',
        diagrams: [
          {
            id: 'persisted',
            name: 'Persisted',
            engine: 'mermaid',
            format: 'svg',
            code: 'graph TD\nOld-->State',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      }),
    );
    setSearch('engine=graphviz&format=png&code=digraph%20G%20%7B%20A%20-%3E%20B%20%7D');

    const { result } = renderHook(() => useDiagramState('fallback'));

    await waitFor(() => {
      expect(result.current.diagrams).toHaveLength(1);
    });

    expect(result.current.engine).toBe('graphviz');
    expect(result.current.format).toBe('png');
    expect(result.current.code).toBe('digraph G { A -> B }');
    expect(result.current.diagrams[0]).toMatchObject({
      id: 'persisted',
      name: 'Persisted',
    });
  });

  it('switches current diagram and syncs engine, format, and code', async () => {
    const { result } = renderHook(() => useDiagramState('seed'));

    await waitFor(() => {
      expect(result.current.diagrams).toHaveLength(1);
    });

    act(() => {
      result.current.importWorkspace({
        diagrams: [
          {
            id: 'a',
            name: 'Mermaid 图',
            engine: 'mermaid',
            format: 'svg',
            code: 'graph TD\nA-->B',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: 'b',
            name: 'Graphviz 图',
            engine: 'graphviz',
            format: 'png',
            code: 'digraph G { A -> B }',
            updatedAt: '2024-01-02T00:00:00.000Z',
          },
        ],
        currentId: 'b',
      });
    });

    await waitFor(() => {
      expect(result.current.currentId).toBe('b');
    });

    expect(result.current.engine).toBe('graphviz');
    expect(result.current.format).toBe('png');
    expect(result.current.code).toBe('digraph G { A -> B }');

    act(() => {
      result.current.setCurrentId('a');
    });

    expect(result.current.currentId).toBe('a');
    expect(result.current.engine).toBe('mermaid');
    expect(result.current.format).toBe('svg');
    expect(result.current.code).toBe('graph TD\nA-->B');
  });

  it('resets to a fresh empty document when deleting the last diagram', async () => {
    const { result } = renderHook(() => useDiagramState('seed'));

    await waitFor(() => {
      expect(result.current.diagrams).toHaveLength(1);
    });

    act(() => {
      result.current.importWorkspace({
        diagrams: [
          {
            id: 'only',
            name: '唯一图表',
            engine: 'plantuml',
            format: 'pdf',
            code: '@startuml\nAlice -> Bob\n@enduml',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        currentId: 'only',
      });
    });

    await waitFor(() => {
      expect(result.current.currentId).toBe('only');
    });

    act(() => {
      result.current.deleteDiagram('only');
    });

    await waitFor(() => {
      expect(result.current.diagrams).toHaveLength(1);
      expect(result.current.code).toBe('');
    });

    expect(result.current.currentId).toBe(result.current.diagrams[0]?.id);
    expect(result.current.diagrams[0]).toMatchObject({
      name: '未命名图 1',
      engine: 'mermaid',
      format: 'svg',
      code: '',
    });
    expect(result.current.engine).toBe('mermaid');
    expect(result.current.format).toBe('svg');
  });
});
