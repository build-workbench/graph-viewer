'use client';

import { memo } from 'react';
import type { Engine } from '@/lib/diagramConfig';
import type { VersionRecord } from '@/hooks/useVersionHistory';
import type { AIConfig, AIAnalysisResult } from '@/hooks/useAIAssistant';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';
import { VersionHistoryPanel } from '@/components/version/VersionHistoryPanel';
import { Code2, Zap, Clock } from 'lucide-react';

export type SidebarTab = 'editor' | 'ai' | 'history';

/**
 * SidebarTabs Props
 *
 * 重构后只接收控制属性和跨 Context 组合的回调：
 * - activeTab/onTabChange: Tab 切换控制
 * - versions: 版本历史数据（用于显示数量徽章）
 * - EditorPanel 回调：需要跨 Context 组合的操作
 * - AIAssistantPanel 回调：需要跨 Context 组合的操作
 * - VersionHistoryPanel 回调：需要跨 Context 组合的操作
 */
export type SidebarTabsProps = {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  versions: VersionRecord[];
  // EditorPanel 回调（跨 Context 组合）
  onEngineChange: (engine: Engine, loadSample?: boolean) => void;
  onCopyCode: () => Promise<void>;
  onClearCode: () => void;
  onExportSourceCode: () => Promise<void>;
  onLivePreviewChange: (enabled: boolean) => void;
  livePreviewEnabled: boolean;
  limitEngines?: readonly Engine[];
  // AIAssistantPanel 回调（跨 Context 组合）
  aiConfig: AIConfig;
  isAIConfigured: boolean;
  isAIAnalyzing: boolean;
  isAIGenerating: boolean;
  lastAIAnalysis: AIAnalysisResult | null;
  aiError: string | null;
  aiBoundaryNotice: string;
  onUpdateAIConfig: (config: Partial<AIConfig>) => void;
  onAIAnalyze: () => void;
  onAIFix: () => void;
  onAIGenerate: (description: string) => void;
  onApplyAICode: (code: string) => void;
  onClearAIError: () => void;
  onClearAIAnalysis: () => void;
  // VersionHistoryPanel 回调（跨 Context 组合）
  isVersionsLoading: boolean;
  onRestoreVersion: (version: VersionRecord) => void;
  onDeleteVersion: (versionId: string) => void;
  onRenameVersion: (versionId: string, newLabel: string) => void;
  onCreateSnapshot: () => void;
  onClearAllVersions: () => void;
};

const TAB_ITEMS: Array<{
  id: SidebarTab;
  label: string;
  icon: typeof Code2;
  activeClass: string;
}> = [
  {
    id: 'editor',
    label: '代码',
    icon: Code2,
    activeClass: 'rounded-xl bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-100',
  },
  {
    id: 'ai',
    label: 'AI 助手',
    icon: Zap,
    activeClass: 'rounded-xl bg-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-100',
  },
  {
    id: 'history',
    label: '历史',
    icon: Clock,
    activeClass: 'rounded-xl bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-100',
  },
];

// ============================================================================
// Memoized Panel Components - Prevent unnecessary re-renders when props haven't changed
// ============================================================================

type EditorPanelProps = {
  onEngineChange: (engine: Engine, loadSample?: boolean) => void;
  onCopyCode: () => Promise<void>;
  onClearCode: () => void;
  onExportSourceCode: () => Promise<void>;
  onLivePreviewChange: (enabled: boolean) => void;
  livePreviewEnabled: boolean;
  limitEngines?: readonly Engine[];
};

const MemoizedEditorPanel = memo(function EditorPanelComponent(props: EditorPanelProps) {
  return <EditorPanel {...props} />;
});

type AIPanelProps = {
  config: AIConfig;
  isConfigured: boolean;
  isAnalyzing: boolean;
  isGenerating: boolean;
  lastAnalysis: AIAnalysisResult | null;
  error: string | null;
  boundaryNotice: string;
  onUpdateConfig: (config: Partial<AIConfig>) => void;
  onAnalyze: () => void;
  onFix: () => void;
  onGenerate: (description: string) => void;
  onApplyCode: (code: string) => void;
  onClearError: () => void;
  onClearAnalysis: () => void;
};

const MemoizedAIPanel = memo(function AIPanelComponent(props: AIPanelProps) {
  return (
    <div className="h-full overflow-hidden rounded-[24px] border border-white/70 bg-white/90 shadow-sm backdrop-blur">
      <AIAssistantPanel
        config={props.config}
        isConfigured={props.isConfigured}
        isAnalyzing={props.isAnalyzing}
        isGenerating={props.isGenerating}
        lastAnalysis={props.lastAnalysis}
        error={props.error}
        boundaryNotice={props.boundaryNotice}
        onUpdateConfig={props.onUpdateConfig}
        onAnalyze={props.onAnalyze}
        onFix={props.onFix}
        onGenerate={props.onGenerate}
        onApplyCode={props.onApplyCode}
        onClearError={props.onClearError}
        onClearAnalysis={props.onClearAnalysis}
      />
    </div>
  );
});

type HistoryPanelProps = {
  versions: VersionRecord[];
  isLoading: boolean;
  onRestore: (version: VersionRecord) => void;
  onDelete: (versionId: string) => void;
  onRename: (versionId: string, newLabel: string) => void;
  onCreateSnapshot: () => void;
  onClearAll: () => void;
};

const MemoizedHistoryPanel = memo(function HistoryPanelComponent(props: HistoryPanelProps) {
  return (
    <div className="h-full overflow-hidden rounded-[24px] border border-white/70 bg-white/90 shadow-sm backdrop-blur">
      <VersionHistoryPanel
        versions={props.versions}
        isLoading={props.isLoading}
        onRestore={props.onRestore}
        onDelete={props.onDelete}
        onRename={props.onRename}
        onCreateSnapshot={props.onCreateSnapshot}
        onClearAll={props.onClearAll}
      />
    </div>
  );
});

export function SidebarTabs(props: SidebarTabsProps) {
  const {
    activeTab,
    onTabChange,
    versions,
    // EditorPanel
    onEngineChange,
    onCopyCode,
    onClearCode,
    onExportSourceCode,
    onLivePreviewChange,
    livePreviewEnabled,
    limitEngines,
    // AIAssistantPanel
    aiConfig,
    isAIConfigured,
    isAIAnalyzing,
    isAIGenerating,
    lastAIAnalysis,
    aiError,
    aiBoundaryNotice,
    onUpdateAIConfig,
    onAIAnalyze,
    onAIFix,
    onAIGenerate,
    onApplyAICode,
    onClearAIError,
    onClearAIAnalysis,
    // VersionHistoryPanel
    isVersionsLoading,
    onRestoreVersion,
    onDeleteVersion,
    onRenameVersion,
    onCreateSnapshot,
    onClearAllVersions,
  } = props;

  return (
    <>
      {/* Tab 切换栏 */}
      <div className="flex overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 p-1 shadow-sm backdrop-blur">
        {TAB_ITEMS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition ${
                isActive ? tab.activeClass : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.id === 'history' && versions.length > 0 && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  {versions.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 内容区 */}
      <div className="min-h-[360px] flex-1 lg:min-h-0">
        {activeTab === 'editor' && (
          <MemoizedEditorPanel
            onEngineChange={onEngineChange}
            onCopyCode={onCopyCode}
            onClearCode={onClearCode}
            onExportSourceCode={onExportSourceCode}
            onLivePreviewChange={onLivePreviewChange}
            livePreviewEnabled={livePreviewEnabled}
            limitEngines={limitEngines}
          />
        )}
        {activeTab === 'ai' && (
          <MemoizedAIPanel
            config={aiConfig}
            isConfigured={isAIConfigured}
            isAnalyzing={isAIAnalyzing}
            isGenerating={isAIGenerating}
            lastAnalysis={lastAIAnalysis}
            error={aiError}
            boundaryNotice={aiBoundaryNotice}
            onUpdateConfig={onUpdateAIConfig}
            onAnalyze={onAIAnalyze}
            onFix={onAIFix}
            onGenerate={onAIGenerate}
            onApplyCode={onApplyAICode}
            onClearError={onClearAIError}
            onClearAnalysis={onClearAIAnalysis}
          />
        )}
        {activeTab === 'history' && (
          <MemoizedHistoryPanel
            versions={versions}
            isLoading={isVersionsLoading}
            onRestore={onRestoreVersion}
            onDelete={onDeleteVersion}
            onRename={onRenameVersion}
            onCreateSnapshot={onCreateSnapshot}
            onClearAll={onClearAllVersions}
          />
        )}
      </div>
    </>
  );
}

// Wrap the component in memo to prevent re-renders when props haven't changed
export const MemoizedSidebarTabs = memo(SidebarTabs);
