import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useVersionHistory } from '@/hooks/useVersionHistory';

const STORAGE_KEY = 'graphviewer:versions:v1';

describe('useVersionHistory', () => {
  beforeEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('creates a manual snapshot and avoids duplicate snapshots for unchanged content', async () => {
    const { result, rerender } = renderHook(
      ({ code }) => useVersionHistory('diagram-1', code, 'mermaid'),
      { initialProps: { code: 'graph TD\nA-->B' } },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let firstVersionId: string | null = null;
    act(() => {
      const created = result.current.createVersion('手动快照');
      firstVersionId = created?.id ?? null;
    });

    await waitFor(() => {
      expect(result.current.versions).toHaveLength(1);
    });
    expect(firstVersionId).toBeTruthy();

    act(() => {
      const duplicate = result.current.createVersion('重复快照');
      expect(duplicate).toBeNull();
    });

    expect(result.current.versions).toHaveLength(1);

    rerender({ code: 'graph TD\nA-->C' });
    act(() => {
      result.current.createVersion('更新快照');
    });

    await waitFor(() => {
      expect(result.current.versions).toHaveLength(2);
    });
  });

  it('autosaves when content meaningfully changes and ignores whitespace-only changes', async () => {
    const { result, rerender } = renderHook(
      ({ code }) => useVersionHistory('diagram-1', code, 'mermaid'),
      { initialProps: { code: 'graph TD\nA-->B' } },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.createVersion('基线');
    });

    rerender({ code: 'graph TD\nA-->B\n' });
    act(() => {
      result.current.createVersion(undefined, true);
    });
    expect(result.current.versions).toHaveLength(1);

    rerender({ code: 'graph TD\nA-->C' });
    act(() => {
      result.current.createVersion(undefined, true);
    });

    await waitFor(() => {
      expect(result.current.versions).toHaveLength(2);
    });
    expect(result.current.versions[0]?.autoSave).toBe(true);
  });

  it('renames and deletes versions', async () => {
    const { result } = renderHook(() =>
      useVersionHistory('diagram-1', 'graph TD\nA-->B', 'mermaid'),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let versionId = '';
    act(() => {
      const created = result.current.createVersion('初始快照');
      versionId = created?.id ?? '';
    });

    await waitFor(() => {
      expect(result.current.versions).toHaveLength(1);
    });

    act(() => {
      result.current.renameVersion(versionId, '重命名快照');
    });
    await waitFor(() => {
      expect(result.current.versions[0]?.label).toBe('重命名快照');
    });

    act(() => {
      result.current.deleteVersion(versionId);
    });
    await waitFor(() => {
      expect(result.current.versions).toHaveLength(0);
    });
  });

  it('persists versions to localStorage after updates', async () => {
    const { result } = renderHook(() =>
      useVersionHistory('diagram-1', 'graph TD\nA-->B', 'mermaid'),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.createVersion('持久化快照');
    });

    await waitFor(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw || '[]')).toHaveLength(1);
    });
  });
});
