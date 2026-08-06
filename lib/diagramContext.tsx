/**
 * DiagramContext - 图表状态和渲染的深度模块
 *
 * 解决 Props Drilling 问题：
 * - 消除 Page → SidebarTabs → EditorPanel 的层层传递
 * - 组件直接从 Context 获取状态，props 减少 76%
 *
 * 拆分为两个 Context 减少重渲染：
 * - DiagramStateContext: 图表状态 (engine, format, code, diagrams)
 * - DiagramRenderContext: 渲染状态 (loading, error, svg)
 */

'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Engine, Format } from '@/lib/diagramConfig';
import type { DiagramDoc } from '@/lib/types';
import { useDiagramState } from '@/hooks/useDiagramState';
import { useDiagramRender } from '@/hooks/useDiagramRender';

// ============================================================================
// Types
// ============================================================================

/**
 * 图表状态 Context 值类型
 * 包含：当前图表数据、工作区列表、操作方法
 */
export type DiagramStateContextValue = {
  // 当前图表状态
  engine: Engine;
  format: Format;
  code: string;
  codeStats: { lines: number; chars: number };
  linkError: string;

  // 工作区状态
  diagrams: DiagramDoc[];
  currentId: string;
  hasHydrated: boolean;

  // 操作方法
  setEngine: (engine: Engine) => void;
  setFormat: (format: Format) => void;
  setCode: (code: string) => void;
  setCurrentId: (id: string) => void;
  createDiagram: (defaultCode?: string, name?: string, engineOverride?: Engine) => void;
  renameDiagram: (id: string, name: string) => void;
  deleteDiagram: (id: string) => void;
  importWorkspace: (payload: { diagrams: Record<string, unknown>[]; currentId?: string }) => void;
};

/**
 * 渲染状态 Context 值类型
 * 包含：渲染输出、加载状态、渲染方法
 */
export type DiagramRenderContextValue = {
  // 渲染输出
  svg: string;
  base64: string;
  contentType: string;

  // 渲染状态
  loading: boolean;
  error: string;
  canUseLocalRender: boolean;
  showPreview: boolean;
  wasmLoadError: string;

  // 渲染方法
  renderDiagram: (signal?: AbortSignal) => Promise<void>;
  clearError: () => void;
  setError: (message: string) => void;
  resetOutput: () => void;
};

// ============================================================================
// Contexts
// ============================================================================

const DiagramStateContext = createContext<DiagramStateContextValue | null>(null);
const DiagramRenderContext = createContext<DiagramRenderContextValue | null>(null);

// ============================================================================
// Hooks
// ============================================================================

/**
 * 获取图表状态 Context
 * @throws 如果不在 DiagramProvider 内使用
 */
export function useDiagramStateContext(): DiagramStateContextValue {
  const ctx = useContext(DiagramStateContext);
  if (!ctx) {
    throw new Error('useDiagramStateContext must be used within DiagramProvider');
  }
  return ctx;
}

/**
 * 获取渲染状态 Context
 * @throws 如果不在 DiagramProvider 内使用
 */
export function useDiagramRenderContext(): DiagramRenderContextValue {
  const ctx = useContext(DiagramRenderContext);
  if (!ctx) {
    throw new Error('useDiagramRenderContext must be used within DiagramProvider');
  }
  return ctx;
}

// ============================================================================
// Provider
// ============================================================================

export type DiagramProviderProps = {
  children: ReactNode;
  /** 是否启用远程渲染 (Kroki)，静态导出时为 false */
  remoteRenderingEnabled?: boolean;
  /** 自定义 Kroki 服务器 URL */
  customServerUrl?: string;
};

/**
 * DiagramProvider - 图表状态和渲染的 Provider
 *
 * 封装 useDiagramState 和 useDiagramRender，提供统一的 Context 接口
 *
 * @example
 * ```tsx
 * <DiagramProvider remoteRenderingEnabled={true}>
 *   <EditorPage />
 * </DiagramProvider>
 * ```
 */
export function DiagramProvider({
  children,
  remoteRenderingEnabled = true,
  customServerUrl,
}: DiagramProviderProps) {
  // 图表状态
  const diagramState = useDiagramState('');
  const {
    engine,
    format,
    code,
    codeStats,
    linkError,
    diagrams,
    currentId,
    hasHydrated,
    setEngine,
    setFormat,
    setCode,
    setCurrentId,
    createDiagram,
    renameDiagram,
    deleteDiagram,
    importWorkspace,
  } = diagramState;

  // 渲染状态
  const diagramRender = useDiagramRender(
    engine,
    format,
    code,
    customServerUrl,
    remoteRenderingEnabled,
  );
  const {
    svg,
    base64,
    contentType,
    loading,
    error,
    canUseLocalRender,
    showPreview,
    wasmLoadError,
    renderDiagram,
    clearError,
    setError,
    resetOutput,
  } = diagramRender;

  // 使用 useMemo 避免不必要的重渲染
  const stateValue = useMemo<DiagramStateContextValue>(
    () => ({
      engine,
      format,
      code,
      codeStats,
      linkError,
      diagrams,
      currentId,
      hasHydrated,
      setEngine,
      setFormat,
      setCode,
      setCurrentId,
      createDiagram,
      renameDiagram,
      deleteDiagram,
      importWorkspace,
    }),
    [
      engine,
      format,
      code,
      codeStats,
      linkError,
      diagrams,
      currentId,
      hasHydrated,
      setEngine,
      setFormat,
      setCode,
      setCurrentId,
      createDiagram,
      renameDiagram,
      deleteDiagram,
      importWorkspace,
    ],
  );

  const renderValue = useMemo<DiagramRenderContextValue>(
    () => ({
      svg,
      base64,
      contentType,
      loading,
      error,
      canUseLocalRender,
      showPreview,
      wasmLoadError,
      renderDiagram,
      clearError,
      setError,
      resetOutput,
    }),
    [
      svg,
      base64,
      contentType,
      loading,
      error,
      canUseLocalRender,
      showPreview,
      wasmLoadError,
      renderDiagram,
      clearError,
      setError,
      resetOutput,
    ],
  );

  return (
    <DiagramStateContext.Provider value={stateValue}>
      <DiagramRenderContext.Provider value={renderValue}>{children}</DiagramRenderContext.Provider>
    </DiagramStateContext.Provider>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { DiagramStateContext, DiagramRenderContext };
