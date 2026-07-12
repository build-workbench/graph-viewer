'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  DiagramProvider,
  useDiagramStateContext,
  useDiagramRenderContext,
} from '@/contexts/DiagramContext';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { SettingsModal } from '@/components/dialogs/SettingsModal';
import { TemplateModal } from '@/components/dialogs/TemplateModal';
import { Toast } from '@/components/feedback/Toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { DiagramList } from '@/components/sidebar/DiagramList';
import { CollapsedSidebar } from '@/components/layout/CollapsedSidebar';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import {
  MemoizedSidebarTabs as SidebarTabs,
  type SidebarTab,
} from '@/components/sidebar/SidebarTabs';
import { ConfirmDialog, PromptDialog, AlertDialog } from '@/components/dialogs/Dialogs';
import { StaticExportNotice } from '@/components/landing/StaticExportNotice';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/useToast';
import { getAIBoundaryNotice, useAIAssistant } from '@/hooks/useAIAssistant';
import { useVersionHistory } from '@/hooks/useVersionHistory';
import { useLivePreview } from '@/hooks/useLivePreview';
import { SAMPLES } from '@/lib/diagramSamples';
import { exportService } from '@/lib/export';
import type { DiagramTemplate } from '@/lib/diagramTemplates';
import type { VersionRecord } from '@/hooks/useVersionHistory';
import { Loader2, ArrowLeft } from 'lucide-react';

const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        <span className="text-sm text-slate-500">加载中...</span>
      </div>
    </main>
  );
}

/**
 * EditorPageContent - 编辑器页面内容
 *
 * 在 DiagramProvider 内部，可以直接访问 Context
 */
function EditorPageContent() {
  // 从 Context 获取图表状态
  const {
    engine,
    format,
    code,
    diagrams,
    currentId,
    hasHydrated,
    linkError,
    setEngine,
    setCode,
    setCurrentId,
    createDiagram,
    renameDiagram,
    deleteDiagram,
    importWorkspace,
  } = useDiagramStateContext();

  // 从 Context 获取渲染状态
  const {
    svg,
    base64,
    contentType,
    loading,
    error: renderError,
    showPreview,
    wasmLoadError,
    renderDiagram,
    clearError,
    setError,
    resetOutput,
  } = useDiagramRenderContext();

  // 独立 hooks
  const { settings, isLoaded: settingsLoaded, saveSettings, toggleSidebar } = useSettings();
  const { toast, showToast } = useToast();

  // 页面状态
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('editor');

  // WASM 加载错误提示
  const lastWasmErrorRef = useRef<string>('');
  useEffect(() => {
    if (wasmLoadError && wasmLoadError !== lastWasmErrorRef.current) {
      lastWasmErrorRef.current = wasmLoadError;
      showToast(wasmLoadError, 'error');
    }
  }, [wasmLoadError, showToast]);

  // 对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    options: { title: string; message: string; variant?: 'default' | 'danger' };
    resolve: (value: boolean) => void;
  } | null>(null);

  const [promptDialog, setPromptDialog] = useState<{
    isOpen: boolean;
    options: { title: string; message: string; defaultValue: string };
    resolve: (value: string | null) => void;
  } | null>(null);

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    options: { title: string; message: string };
  } | null>(null);

  // 对话框回调函数
  const showConfirm = useCallback(
    (options: {
      title: string;
      message: string;
      variant?: 'default' | 'danger';
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmDialog({ isOpen: true, options, resolve });
      });
    },
    [],
  );

  const showPrompt = useCallback(
    (options: { title: string; message: string; defaultValue: string }): Promise<string | null> => {
      return new Promise((resolve) => {
        setPromptDialog({ isOpen: true, options, resolve });
      });
    },
    [],
  );

  const showAlertDialog = useCallback((options: { title: string; message: string }) => {
    setAlertDialog({ isOpen: true, options });
  }, []);

  const pageError = renderError || linkError;

  // --- 组合 hooks ---

  const { livePreview, setLivePreview } = useLivePreview({
    engine,
    code,
    debounceMs: settings.debounceMs,
    renderDiagram,
    resetOutput,
  });

  const {
    config: aiConfig,
    updateConfig: updateAIConfig,
    state: aiState,
    clearError: clearAIError,
    clearAnalysis: clearAIAnalysis,
    isConfigured: isAIConfigured,
    analyzeCode,
    generateCode,
    fixCode,
  } = useAIAssistant(engine);

  const {
    versions,
    isLoading: isVersionsLoading,
    createVersion,
    deleteVersion,
    renameVersion,
    clearDiagramVersions,
  } = useVersionHistory(currentId, code, engine);

  // --- 内联 Actions 函数（原 useWorkspaceActions）---

  const handleCopyCode = useCallback(async () => {
    clearError();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        showToast('代码已复制到剪贴板');
      } else {
        if (showPrompt) {
          await showPrompt({
            title: '手动复制代码',
            message: '请选择并复制以下代码：',
            defaultValue: code,
          });
        } else {
          window.prompt('请手动复制以下代码', code);
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '复制代码失败';
      setError(msg);
    }
  }, [code, clearError, setError, showToast, showPrompt]);

  const handleClearCode = useCallback(() => {
    setCode('');
    resetOutput();
  }, [setCode, resetOutput]);

  const handleSelectDiagram = useCallback(
    (id: string) => {
      if (id && id !== currentId) setCurrentId(id);
    },
    [currentId, setCurrentId],
  );

  const handleCreateDiagram = useCallback(() => {
    createDiagram(SAMPLES[engine] || '');
  }, [engine, createDiagram]);

  const handleRenameDiagram = useCallback(
    async (id: string, currentName: string) => {
      if (typeof window === 'undefined') return;

      let trimmed: string | undefined;
      if (showPrompt) {
        const result = await showPrompt({
          title: '重命名图',
          message: '请输入新的图名称：',
          defaultValue: currentName || '',
        });
        trimmed = result?.trim();
      } else {
        const next = window.prompt('请输入新的图名称', currentName || '');
        trimmed = next?.trim();
      }

      if (trimmed) renameDiagram(id, trimmed);
    },
    [renameDiagram, showPrompt],
  );

  const handleDeleteDiagram = useCallback(
    async (id: string, name: string) => {
      if (typeof window === 'undefined') return;

      const label = name?.trim() || '未命名图';
      let confirmed: boolean;

      if (showConfirm) {
        confirmed = await showConfirm({
          title: '删除确认',
          message: `确定要删除图「${label}」吗？此操作不可撤销。`,
          variant: 'danger',
        });
      } else {
        confirmed = window.confirm(`确定要删除图「${label}」吗？此操作不可撤销。`);
      }

      if (confirmed) {
        deleteDiagram(id);
      }
    },
    [deleteDiagram, showConfirm],
  );

  const handleExportSourceCode = useCallback(async () => {
    try {
      if (!code.trim()) return;
      await exportService.exportDiagram({
        content: code,
        filename: 'diagram',
        type: 'source',
        engine,
      });
      showToast('源码文件已导出');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '导出源码失败';
      setError(msg);
    }
  }, [code, engine, setError, showToast]);

  const handleExportWorkspace = useCallback(() => {
    try {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        currentId,
        diagrams,
      };
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
      a.href = url;
      a.download = `graphviewer-workspace-${ts}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '导出项目集失败';
      setError(msg);
    }
  }, [currentId, diagrams, setError]);

  const handleEngineChange = useCallback(
    (newEngine: typeof engine, loadSample?: boolean) => {
      setEngine(newEngine);
      if (loadSample) {
        setCode(SAMPLES[newEngine] || '');
        resetOutput();
      }
    },
    [setEngine, setCode, resetOutput],
  );

  const handleCreateFromTemplate = useCallback(
    (template: DiagramTemplate) => {
      createDiagram(template.code, template.name, template.engine);
      showToast(`已从模板「${template.name}」创建`);
    },
    [createDiagram, showToast],
  );

  // --- 内联 AI Actions 函数（原 useAIActions）---

  const handleAIAnalyze = useCallback(() => {
    if (!code.trim()) return;
    analyzeCode(code);
  }, [code, analyzeCode]);

  const handleAIFix = useCallback(async () => {
    if (!code.trim()) return;
    const fixed = await fixCode(code, pageError || undefined);
    if (fixed) {
      setCode(fixed);
      showToast('AI 已修复代码', 'success');
    }
  }, [code, pageError, fixCode, setCode, showToast]);

  const handleAIGenerate = useCallback(
    async (description: string) => {
      const generated = await generateCode(description);
      if (generated) {
        setCode(generated);
        setSidebarTab('editor');
        showToast('代码已生成', 'success');
      }
    },
    [generateCode, setCode, setSidebarTab, showToast],
  );

  const handleAIApplyCode = useCallback(
    (newCode: string) => {
      setCode(newCode);
      setSidebarTab('editor');
      showToast('已应用修改', 'success');
    },
    [setCode, setSidebarTab, showToast],
  );

  // --- 内联版本 Actions 函数（原 useVersionActions）---

  const handleCreateSnapshot = useCallback(() => {
    const v = createVersion('手动快照');
    if (v) {
      showToast('快照已创建', 'success');
    } else {
      showToast('代码无变化，无需创建快照', 'info');
    }
  }, [createVersion, showToast]);

  const handleRestoreVersion = useCallback(
    (version: VersionRecord) => {
      setCode(version.code);
      setEngine(version.engine);
      showToast('已恢复到该版本', 'success');
    },
    [setCode, setEngine, showToast],
  );

  const handleClearVersions = useCallback(async () => {
    if (typeof window === 'undefined') return;

    let confirmed: boolean;
    if (showConfirm) {
      confirmed = await showConfirm({
        title: '清空版本历史',
        message: '确定要清空所有版本历史吗？此操作不可撤销。',
        variant: 'danger',
      });
    } else {
      confirmed = window.confirm('确定要清空所有版本历史吗？此操作不可撤销。');
    }

    if (confirmed) {
      clearDiagramVersions();
      showToast('版本历史已清空', 'info');
    }
  }, [clearDiagramVersions, showToast, showConfirm]);

  // 水合加载状态
  if (!hasHydrated || !settingsLoaded) {
    return <LoadingScreen />;
  }

  // 构建 SidebarTabs props
  const sidebarTabsProps = {
    activeTab: sidebarTab,
    onTabChange: setSidebarTab,
    versions,
    // EditorPanel
    onEngineChange: handleEngineChange,
    onCopyCode: handleCopyCode,
    onClearCode: handleClearCode,
    onExportSourceCode: handleExportSourceCode,
    onLivePreviewChange: setLivePreview,
    livePreviewEnabled: livePreview,
    limitEngines: isStaticExport ? (['mermaid', 'graphviz', 'flowchart'] as const) : undefined,
    // AIAssistantPanel
    aiConfig,
    isAIConfigured,
    isAIAnalyzing: aiState.isAnalyzing,
    isAIGenerating: aiState.isGenerating,
    lastAIAnalysis: aiState.lastAnalysis,
    aiError: aiState.error,
    aiBoundaryNotice: getAIBoundaryNotice(),
    onUpdateAIConfig: updateAIConfig,
    onAIAnalyze: handleAIAnalyze,
    onAIFix: handleAIFix,
    onAIGenerate: handleAIGenerate,
    onApplyAICode: handleAIApplyCode,
    onClearAIError: clearAIError,
    onClearAIAnalysis: clearAIAnalysis,
    // VersionHistoryPanel
    isVersionsLoading,
    onRestoreVersion: handleRestoreVersion,
    onDeleteVersion: deleteVersion,
    onRenameVersion: renameVersion,
    onCreateSnapshot: handleCreateSnapshot,
    onClearAllVersions: handleClearVersions,
  };

  return (
    <ErrorBoundary>
      <main className="relative isolate mx-auto flex min-h-screen w-full max-w-[1920px] flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 md:px-6 lg:gap-4 lg:py-5">
        <Toast toast={toast} />
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSave={saveSettings}
          remoteRenderingEnabled={!isStaticExport}
          isStaticExport={isStaticExport}
        />
        <TemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onCreateFromTemplate={handleCreateFromTemplate}
          limitEngines={
            isStaticExport ? (['mermaid', 'graphviz', 'flowchart'] as const) : undefined
          }
        />

        {/* 对话框 */}
        <ConfirmDialog
          isOpen={confirmDialog?.isOpen ?? false}
          options={confirmDialog?.options ?? { title: '', message: '' }}
          onConfirm={() => {
            confirmDialog?.resolve(true);
            setConfirmDialog(null);
          }}
          onCancel={() => {
            confirmDialog?.resolve(false);
            setConfirmDialog(null);
          }}
        />
        <PromptDialog
          isOpen={promptDialog?.isOpen ?? false}
          options={promptDialog?.options ?? { title: '', message: '', defaultValue: '' }}
          onConfirm={(value) => {
            promptDialog?.resolve(value);
            setPromptDialog(null);
          }}
          onCancel={() => {
            promptDialog?.resolve(null);
            setPromptDialog(null);
          }}
        />
        <AlertDialog
          isOpen={alertDialog?.isOpen ?? false}
          options={alertDialog?.options ?? { title: '', message: '' }}
          onClose={() => setAlertDialog(null)}
        />

        {/* 静态导出提示 */}
        {isStaticExport && <StaticExportNotice />}

        {/* 返回首页链接（仅在静态导出时显示） */}
        {isStaticExport && (
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-sky-600"
            >
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>
          </div>
        )}

        <AppHeader
          onImportWorkspace={importWorkspace}
          onExportWorkspace={handleExportWorkspace}
          onOpenSettings={() => setShowSettings(true)}
          onError={setError}
        />

        {/* Workspace Section */}
        <div className="flex flex-col gap-4 lg:h-[calc(100vh-150px)] lg:flex-row lg:items-stretch lg:gap-5">
          {/* Left Sidebar */}
          <div
            className={`flex min-h-0 flex-col gap-4 transition-all duration-300 ${
              settings.sidebarCollapsed ? 'lg:w-14' : 'w-full lg:w-[430px] xl:w-[470px]'
            }`}
          >
            {settings.sidebarCollapsed ? (
              <CollapsedSidebar
                diagramCount={diagrams.length}
                onExpand={toggleSidebar}
                onCreate={handleCreateDiagram}
              />
            ) : (
              <>
                <DiagramList
                  diagrams={diagrams}
                  currentId={currentId}
                  onSelect={handleSelectDiagram}
                  onCreate={handleCreateDiagram}
                  onRename={handleRenameDiagram}
                  onDelete={handleDeleteDiagram}
                  onCollapseSidebar={toggleSidebar}
                  onOpenTemplateModal={() => setShowTemplateModal(true)}
                />

                <SidebarTabs {...sidebarTabsProps} />
              </>
            )}
          </div>

          {/* Right: Preview */}
          <div className="min-h-[420px] flex-1 lg:h-full lg:min-h-0">
            <PreviewPanel
              svg={svg}
              base64={base64}
              contentType={contentType}
              loading={loading}
              showPreview={showPreview}
              format={format}
              error={pageError}
              code={code}
              engine={engine}
              onExportError={(message: string) => showAlertDialog({ title: '导出失败', message })}
            />
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}

/**
 * EditorPage - 编辑器页面入口
 *
 * 提供 DiagramProvider 包装
 */
export default function EditorPage() {
  return (
    <DiagramProvider remoteRenderingEnabled={!isStaticExport} customServerUrl={undefined}>
      <EditorPageContent />
    </DiagramProvider>
  );
}
