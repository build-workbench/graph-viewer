import { useCallback, useEffect, useMemo, useState } from 'react';
import { decompressFromEncodedURIComponent } from 'lz-string';
import type { Engine, Format } from '@/lib/diagramConfig';
import { isEngine, isFormat } from '@/lib/diagramConfig';
import type { DiagramDoc, PersistedWorkspaceData } from '@/lib/types';
import { isPersistedWorkspace } from '@/lib/types';
import { logger } from '@/lib/logger';
import { loadFromStorage, saveToStorage } from '@/lib/storage';
import { APP_CONFIG } from '@/lib/config';

type DiagramState = {
  engine: Engine;
  format: Format;
  code: string;
  codeStats: { lines: number; chars: number };
  linkError: string;
  diagrams: DiagramDoc[];
  currentId: string;
  hasHydrated: boolean;
};

type DiagramStateControls = {
  setEngine: (engine: Engine) => void;
  setFormat: (format: Format) => void;
  setCode: (code: string) => void;
  setCurrentId: (id: string) => void;
  createDiagram: (defaultCode?: string, name?: string, engineOverride?: Engine) => void;
  renameDiagram: (id: string, name: string) => void;
  deleteDiagram: (id: string) => void;
  importWorkspace: (payload: { diagrams: Record<string, unknown>[]; currentId?: string }) => void;
};

function generateDiagramId(): string {
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultDiagram(): DiagramDoc {
  return {
    id: generateDiagramId(),
    name: '未命名图 1',
    engine: 'mermaid',
    format: 'svg',
    code: '',
    updatedAt: new Date().toISOString(),
  };
}

export function useDiagramState(initialCode: string): DiagramState & DiagramStateControls {
  // === 单一数据源：diagrams 和 currentId ===
  const [diagrams, setDiagrams] = useState<DiagramDoc[]>([]);
  const [currentId, setCurrentId] = useState<string>('');
  const [linkError, setLinkError] = useState<string>('');
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  // === 派生状态：从 diagrams 派生 engine/format/code ===
  const currentDiagram = useMemo(
    () => diagrams.find((d) => d.id === currentId),
    [diagrams, currentId],
  );

  const engine = currentDiagram?.engine ?? 'mermaid';
  const format = currentDiagram?.format ?? 'svg';
  const code = currentDiagram?.code ?? initialCode;

  const codeStats = useMemo(() => {
    const lines = code.split('\n').length;
    const chars = code.length;
    return { lines, chars };
  }, [code]);

  // === 水合：从 URL 或 localStorage 初始化 ===
  useEffect(() => {
    if (typeof window === 'undefined') {
      setHasHydrated(true);
      return;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const qsEngine = params.get('engine');
      const qsFormat = params.get('format');
      const qsCode = params.get('code');
      const qsEncoded = params.get('encoded');
      let appliedFromQuery = false;

      // 处理 URL 参数
      let queryEngine: Engine | undefined;
      let queryFormat: Format | undefined;
      let queryCode: string | undefined;

      if (qsEngine) {
        if (isEngine(qsEngine)) {
          queryEngine = qsEngine;
          appliedFromQuery = true;
        } else {
          setLinkError('分享链接中的引擎参数无效，已使用默认引擎。');
        }
      }
      if (qsFormat) {
        if (isFormat(qsFormat)) {
          queryFormat = qsFormat;
          appliedFromQuery = true;
        } else {
          setLinkError((prev: string) => prev || '分享链接中的格式参数无效，已使用默认格式。');
        }
      }
      if (qsCode !== null) {
        if (qsEncoded === '1') {
          try {
            const decompressed = decompressFromEncodedURIComponent(qsCode);
            if (typeof decompressed === 'string' && decompressed.length > 0) {
              queryCode = decompressed;
            } else {
              setLinkError(
                (prev: string) => prev || '分享链接中的代码解压后为空，已使用原始内容。',
              );
              queryCode = qsCode;
            }
          } catch {
            setLinkError((prev: string) => prev || '分享链接中的代码解压失败，已使用原始内容。');
            queryCode = qsCode;
          }
        } else {
          queryCode = qsCode;
        }
        appliedFromQuery = true;
      }

      // 从 localStorage 加载
      const persisted = loadFromStorage<PersistedWorkspaceData | null>(
        APP_CONFIG.storage.stateKey,
        null,
      );

      if (persisted && isPersistedWorkspace(persisted) && persisted.diagrams.length > 0) {
        setDiagrams(persisted.diagrams);
        const nextId =
          persisted.currentId && persisted.diagrams.some((d) => d.id === persisted.currentId)
            ? persisted.currentId
            : (persisted.diagrams[0]?.id ?? '');
        setCurrentId(nextId);

        // 如果 URL 有参数，覆盖当前图表
        if (appliedFromQuery && nextId) {
          setDiagrams((prev) => {
            const idx = prev.findIndex((d) => d.id === nextId);
            if (idx === -1) return prev;
            const current = prev[idx];
            if (!current) return prev;
            const updated = { ...current };
            if (queryEngine) updated.engine = queryEngine;
            if (queryFormat) updated.format = queryFormat;
            if (queryCode !== undefined) updated.code = queryCode;
            updated.updatedAt = new Date().toISOString();
            const next = prev.slice();
            next[idx] = updated;
            return next;
          });
        }
      } else if (appliedFromQuery) {
        // 只有 URL 参数，创建新图表
        const doc: DiagramDoc = {
          id: generateDiagramId(),
          name: '未命名图 1',
          engine: queryEngine ?? 'mermaid',
          format: queryFormat ?? 'svg',
          code: queryCode ?? '',
          updatedAt: new Date().toISOString(),
        };
        setDiagrams([doc]);
        setCurrentId(doc.id);
      } else {
        // 无数据，创建默认图表
        const doc = createDefaultDiagram();
        if (initialCode) {
          doc.code = initialCode;
        }
        setDiagrams([doc]);
        setCurrentId(doc.id);
      }
    } catch (e: unknown) {
      logger.warn('hydrate-state', { error: e instanceof Error ? e.message : 'Unknown error' });
      // 创建默认图表
      const doc = createDefaultDiagram();
      setDiagrams([doc]);
      setCurrentId(doc.id);
    } finally {
      setHasHydrated(true);
    }
  }, [initialCode]);

  // === 持久化：debounce 写入 localStorage ===
  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydrated || !diagrams.length) return;

    const timer = window.setTimeout(() => {
      saveToStorage(APP_CONFIG.storage.stateKey, {
        diagrams,
        currentId,
      });
    }, APP_CONFIG.state.storageWriteDebounceMs);

    return () => window.clearTimeout(timer);
  }, [diagrams, currentId, hasHydrated]);

  // === 操作函数：直接修改 diagrams ===
  const setEngine = useCallback(
    (newEngine: Engine) => {
      if (!currentId) return;
      setDiagrams((prev) => {
        const idx = prev.findIndex((d) => d.id === currentId);
        if (idx === -1) return prev;
        const current = prev[idx];
        if (!current || current.engine === newEngine) return prev;
        const next = prev.slice();
        next[idx] = { ...current, engine: newEngine, updatedAt: new Date().toISOString() };
        return next;
      });
    },
    [currentId],
  );

  const setFormat = useCallback(
    (newFormat: Format) => {
      if (!currentId) return;
      setDiagrams((prev) => {
        const idx = prev.findIndex((d) => d.id === currentId);
        if (idx === -1) return prev;
        const current = prev[idx];
        if (!current || current.format === newFormat) return prev;
        const next = prev.slice();
        next[idx] = { ...current, format: newFormat, updatedAt: new Date().toISOString() };
        return next;
      });
    },
    [currentId],
  );

  const setCode = useCallback(
    (newCode: string) => {
      if (!currentId) return;
      setDiagrams((prev) => {
        const idx = prev.findIndex((d) => d.id === currentId);
        if (idx === -1) return prev;
        const current = prev[idx];
        if (!current || current.code === newCode) return prev;
        const next = prev.slice();
        next[idx] = { ...current, code: newCode, updatedAt: new Date().toISOString() };
        return next;
      });
    },
    [currentId],
  );

  const handleSetCurrentId = useCallback((id: string) => {
    if (!id) return;
    setCurrentId(id);
  }, []);

  const createDiagram = useCallback(
    (defaultCode?: string, name?: string, engineOverride?: Engine) => {
      const id = generateDiagramId();
      const now = new Date().toISOString();
      const newCode = defaultCode ?? '';
      const newEngine = engineOverride ?? engine;
      setDiagrams((prev) => {
        // 在回调中计算名称，避免依赖 diagrams.length
        const diagramName = name ?? `未命名图 ${prev.length + 1}`;
        const doc: DiagramDoc = {
          id,
          name: diagramName,
          engine: newEngine,
          format,
          code: newCode,
          updatedAt: now,
        };
        return [...prev, doc];
      });
      setCurrentId(id);
    },
    [engine, format],
  );

  const renameDiagram = useCallback((id: string, name: string) => {
    if (!id) return;
    setDiagrams((prev) => {
      const idx = prev.findIndex((d) => d.id === id);
      if (idx === -1) return prev;
      const current = prev[idx];
      if (!current) return prev;
      const n = name && name.trim().length > 0 ? name.trim() : current.name;
      const next = prev.slice();
      next[idx] = { ...current, name: n, updatedAt: new Date().toISOString() };
      return next;
    });
  }, []);

  const importWorkspace = useCallback(
    (payload: { diagrams: Record<string, unknown>[]; currentId?: string }) => {
      const raw = Array.isArray(payload?.diagrams) ? payload.diagrams : [];
      if (!raw.length) return;

      const list: DiagramDoc[] = raw
        .filter(
          (d): d is Record<string, unknown> & { id: string; name: string; code: string } =>
            typeof d?.id === 'string' && typeof d?.name === 'string' && typeof d?.code === 'string',
        )
        .map((d) => ({
          id: d.id,
          name: d.name,
          engine: isEngine(d.engine) ? d.engine : 'mermaid',
          format: isFormat(d.format) ? d.format : 'svg',
          code: d.code,
          updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : new Date().toISOString(),
        }));

      if (!list.length) return;

      setDiagrams(list);
      const hasCurrent = payload.currentId && list.some((d) => d.id === payload.currentId);
      const nextId = hasCurrent ? (payload.currentId as string) : (list[0]?.id ?? '');
      setCurrentId(nextId);
    },
    [],
  );

  const deleteDiagram = useCallback(
    (id: string) => {
      if (!id) return;
      setDiagrams((prev) => {
        const idx = prev.findIndex((d) => d.id === id);
        if (idx === -1) return prev;
        const next = [...prev.slice(0, idx), ...prev.slice(idx + 1)];

        if (id !== currentId) {
          return next;
        }

        if (next.length === 0) {
          const newDoc = createDefaultDiagram();
          setCurrentId(newDoc.id);
          return [newDoc];
        }

        const fallbackIndex = idx - 1 >= 0 ? idx - 1 : 0;
        const fallback = next[fallbackIndex];
        if (!fallback) return next;
        setCurrentId(fallback.id);
        return next;
      });
    },
    [currentId],
  );

  return {
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
    setCurrentId: handleSetCurrentId,
    createDiagram,
    renameDiagram,
    deleteDiagram,
    importWorkspace,
  };
}
