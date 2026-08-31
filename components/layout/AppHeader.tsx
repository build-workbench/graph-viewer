'use client';

import { useRef, type ChangeEvent } from 'react';
import { Palette, Upload, Download, Settings, Github } from 'lucide-react';

export type AppHeaderProps = {
  onImportWorkspace: (data: {
    diagrams: Array<Record<string, unknown>>;
    currentId?: string;
  }) => void;
  onExportWorkspace: () => void;
  onOpenSettings: () => void;
  onError: (message: string) => void;
};

export function AppHeader({
  onImportWorkspace,
  onExportWorkspace,
  onOpenSettings,
  onError,
}: AppHeaderProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  function handleImportClick() {
    if (importInputRef.current) {
      importInputRef.current.value = '';
      importInputRef.current.click();
    }
  }

  async function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text) as { diagrams?: Record<string, unknown>[]; currentId?: string };
      if (!Array.isArray(data.diagrams) || data.diagrams.length === 0) {
        throw new Error('导入的文件中不包含有效的图列表。');
      }
      onImportWorkspace({ diagrams: data.diagrams, currentId: data.currentId });
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : '导入项目集失败');
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  }

  return (
    <header className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur md:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 shadow-sm">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-800">GraphViewer</h1>
            <p className="text-xs text-slate-400">多语法图表可视化工作台</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleImportClick}
            className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-800"
            title="导入工作区 (JSON 格式，包含所有图表数据)"
          >
            <Upload className="h-3.5 w-3.5" />
            导入工作区
          </button>
          <button
            onClick={onExportWorkspace}
            className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-800"
            title="导出工作区 (JSON 格式，包含所有图表数据)"
          >
            <Download className="h-3.5 w-3.5" />
            导出工作区
          </button>
          <div className="hidden h-5 w-px bg-slate-200 sm:block"></div>
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center rounded-xl bg-white p-2 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-700"
            title="设置"
          >
            <Settings className="h-4 w-4" />
          </button>
          <a
            href="https://github.com/build-workbench/graph-viewer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-xl bg-white p-2 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-700"
            title="GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportChange}
          />
        </div>
      </div>
    </header>
  );
}
