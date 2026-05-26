'use client';

import { memo, useMemo } from 'react';
import type { Engine, Format } from '@/lib/diagramConfig';
import {
  ENGINE_LABELS,
  ENGINE_CONFIGS,
  ENGINE_CATEGORIES,
  FORMAT_LABELS,
} from '@/lib/diagramConfig';
import { SAMPLES } from '@/lib/diagramSamples';
import { useDiagramStateContext, useDiagramRenderContext } from '@/contexts/DiagramContext';
import { useSettings } from '@/hooks/useSettings';
import { CodeEditor } from './CodeEditor';
import { PlayCircle, Loader2, Copy, AlertCircle } from 'lucide-react';

/**
 * EditorPanel Props
 *
 * 重构后只保留需要跨 Context 组合的回调函数：
 * - onEngineChange: 切换引擎时需要 setEngine + setCode + resetOutput
 * - onCopyCode: 复制代码需要 code + showToast
 * - onClearCode: 清空代码需要 setCode + resetOutput
 * - onExportSourceCode: 导出源码需要 code + engine + showToast
 * - onLivePreviewChange: 实时预览切换 (由 useLivePreview 管理)
 */
export type EditorPanelProps = {
  onEngineChange: (engine: Engine, loadSample?: boolean) => void;
  onCopyCode: () => Promise<void>;
  onClearCode: () => void;
  onExportSourceCode: () => Promise<void>;
  onLivePreviewChange: (enabled: boolean) => void;
  livePreviewEnabled: boolean;
  /** 限制可选择的引擎列表（用于静态导出模式） */
  limitEngines?: readonly Engine[];
};

function EditorPanelComponent(props: EditorPanelProps) {
  const {
    onEngineChange,
    onCopyCode,
    onClearCode,
    onExportSourceCode,
    onLivePreviewChange,
    livePreviewEnabled,
    limitEngines,
  } = props;

  // 从 Context 获取图表状态
  const { engine, format, code, codeStats, setFormat, setCode } = useDiagramStateContext();

  // 从 Context 获取渲染状态
  const { loading, error, canUseLocalRender, renderDiagram } = useDiagramRenderContext();

  // 从独立 hook 获取设置
  const { settings } = useSettings();
  const editorFontSize = settings.editorFontSize;

  // 切换引擎时自动加载示例代码
  const handleEngineChange = (newEngine: Engine) => {
    onEngineChange(newEngine, true);
  };

  const currentEngineConfig = ENGINE_CONFIGS[engine];

  // Memoize filteredCategories to avoid recalculating on every render
  const filteredCategories = useMemo(() => {
    if (!limitEngines) {
      return Object.entries(ENGINE_CATEGORIES).map(([category, engines]) => ({
        category,
        engines,
      }));
    }
    return Object.entries(ENGINE_CATEGORIES)
      .map(([category, engines]) => ({
        category,
        engines: engines.filter((eng) => limitEngines.includes(eng)),
      }))
      .filter(({ engines }) => engines.length > 0);
  }, [limitEngines]);

  return (
    <div className="flex h-full flex-col space-y-4 overflow-hidden rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur md:p-5">
      {/* 头部 - 引擎选择和实时预览 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <select
            value={engine}
            onChange={(e) => handleEngineChange(e.target.value as Engine)}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          >
            {filteredCategories.map(({ category, engines }) => (
              <optgroup key={category} label={category}>
                {engines.map((eng) => (
                  <option key={eng} value={eng}>
                    {ENGINE_LABELS[eng]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as Format)}
            className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          >
            {Object.entries(FORMAT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between gap-2 md:justify-end">
          <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
            <input
              type="checkbox"
              checked={livePreviewEnabled}
              onChange={(e) => onLivePreviewChange(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            实时
          </label>
          {canUseLocalRender && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-current" />
              本地
            </span>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void renderDiagram()}
          disabled={loading || !code.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              渲染中
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              渲染
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCopyCode}
          disabled={!code.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 sm:min-w-[112px]"
          title="复制代码"
        >
          <Copy className="h-4 w-4" />
          复制
        </button>
      </div>

      {/* 编辑器区域 */}
      <div className="flex min-h-0 flex-1 flex-col space-y-2 overflow-hidden">
        <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">代码编辑器</span>
            {currentEngineConfig.docUrl && (
              <a
                href={currentEngineConfig.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-500 hover:text-sky-600 hover:underline"
              >
                文档 ↗
              </a>
            )}
          </div>
          <div className="flex gap-3 text-[11px]">
            <button
              onClick={() => setCode(SAMPLES[engine])}
              className="transition hover:text-sky-600"
            >
              加载示例
            </button>
            <button
              onClick={onClearCode}
              disabled={!code}
              className="transition hover:text-rose-500 disabled:opacity-30"
            >
              清空
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <CodeEditor
            value={code}
            onChange={setCode}
            disabled={loading}
            engine={engine}
            minHeight="100%"
            fontSize={editorFontSize}
            onCtrlEnter={() => {
              if (!loading && code.trim()) {
                void renderDiagram();
              }
            }}
            onCtrlS={() => {
              if (!loading && code.trim()) {
                void onExportSourceCode();
              }
            }}
          />
        </div>

        <div className="flex flex-col gap-2 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {codeStats.lines} 行 · {codeStats.chars} 字符
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[9px]">Ctrl</kbd>
            <span>/</span>
            <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[9px]">⌘</kbd>
            <span>+</span>
            <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[9px]">Enter</kbd>
            <span>渲染</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[9px]">Ctrl</kbd>
            <span>/</span>
            <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[9px]">⌘</kbd>
            <span>+</span>
            <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[9px]">S</kbd>
            <span>导出源码</span>
          </span>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-600 ring-1 ring-inset ring-rose-500/10">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 使用 memo 优化性能
export const EditorPanel = memo(EditorPanelComponent);
