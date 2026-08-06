import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLivePreview } from './useLivePreview';

describe('useLivePreview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with livePreview enabled', () => {
    const renderDiagram = vi.fn();
    const resetOutput = vi.fn();

    const { result } = renderHook(() =>
      useLivePreview({
        engine: 'mermaid',
        code: 'graph TD[A-->B]',
        debounceMs: 300,
        renderDiagram,
        resetOutput,
      }),
    );

    expect(result.current.livePreview).toBe(true);
  });

  it('calls renderDiagram after debounce delay', async () => {
    const renderDiagram = vi.fn().mockResolvedValue(undefined);
    const resetOutput = vi.fn();

    renderHook(() =>
      useLivePreview({
        engine: 'mermaid',
        code: 'graph TD[A-->B]',
        debounceMs: 300,
        renderDiagram,
        resetOutput,
      }),
    );

    // Before debounce
    expect(renderDiagram).not.toHaveBeenCalled();

    // Advance time past debounce and flush pending promises
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(renderDiagram).toHaveBeenCalledTimes(1);
  });

  it('resets output when code is empty', () => {
    const renderDiagram = vi.fn();
    const resetOutput = vi.fn();

    renderHook(() =>
      useLivePreview({
        engine: 'mermaid',
        code: '',
        debounceMs: 300,
        renderDiagram,
        resetOutput,
      }),
    );

    expect(resetOutput).toHaveBeenCalled();
    expect(renderDiagram).not.toHaveBeenCalled();
  });

  it('does not call renderDiagram when livePreview is disabled', async () => {
    const renderDiagram = vi.fn();
    const resetOutput = vi.fn();

    const { result } = renderHook(() =>
      useLivePreview({
        engine: 'mermaid',
        code: 'graph TD[A-->B]',
        debounceMs: 300,
        renderDiagram,
        resetOutput,
      }),
    );

    // Disable live preview
    act(() => {
      result.current.setLivePreview(false);
    });

    // Advance time
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(renderDiagram).not.toHaveBeenCalled();
  });

  it('clears debounce timer on unmount', () => {
    const renderDiagram = vi.fn();
    const resetOutput = vi.fn();

    const { unmount } = renderHook(() =>
      useLivePreview({
        engine: 'mermaid',
        code: 'graph TD[A-->B]',
        debounceMs: 300,
        renderDiagram,
        resetOutput,
      }),
    );

    unmount();

    // Advance time after unmount
    vi.advanceTimersByTime(500);

    // renderDiagram should not be called because timer was cleared
    expect(renderDiagram).not.toHaveBeenCalled();
  });

  it('cancels pending render on code change', async () => {
    const renderDiagram = vi.fn().mockResolvedValue(undefined);
    const resetOutput = vi.fn();

    const { rerender } = renderHook(
      ({ code }) =>
        useLivePreview({
          engine: 'mermaid',
          code,
          debounceMs: 300,
          renderDiagram,
          resetOutput,
        }),
      { initialProps: { code: 'graph TD[A-->B]' } },
    );

    // Wait half the debounce time
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Change code (should cancel pending render and start new debounce)
    rerender({ code: 'graph TD[B-->C]' });

    // Advance remaining time from first debounce (should not trigger)
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(renderDiagram).not.toHaveBeenCalled();

    // Advance to complete second debounce
    await act(async () => {
      vi.advanceTimersByTime(150);
      await Promise.resolve();
    });

    expect(renderDiagram).toHaveBeenCalledTimes(1);
  });
});
