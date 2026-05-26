'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
  type MouseEvent,
  type WheelEvent,
} from 'react';
import Image from 'next/image';
import DOMPurify from 'dompurify';
import { PreviewToolbar } from './PreviewToolbar';
import { ENGINE_LABELS, FORMAT_LABELS, type Engine, type Format } from '@/lib/diagramConfig';
import { Loader2, X, Image as ImageIcon } from 'lucide-react';
import { logger } from '@/lib/logger';

export type PreviewPanelProps = {
  svg: string;
  base64: string;
  contentType: string;
  loading: boolean;
  showPreview: boolean;
  format: Format;
  error?: string;
  code?: string;
  engine?: Engine;
  onExportError?: (message: string) => void;
};

function PreviewPanelComponent(props: PreviewPanelProps) {
  const {
    svg,
    base64,
    contentType,
    loading,
    showPreview,
    format,
    error = '',
    code = '',
    engine = 'mermaid',
    onExportError,
  } = props;

  const sanitizedSvg = useMemo(() => {
    if (!svg) return '';
    return DOMPurify.sanitize(svg, {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_ATTR: [
        'onload',
        'onerror',
        'onclick',
        'onmouseover',
        'onmouseout',
        'onmouseenter',
        'onmouseleave',
      ],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style'],
    });
  }, [svg]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // 当预览内容消失时重置视图
  useEffect(() => {
    if (!showPreview) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [showPreview]);

  // 滚轮缩放
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.min(Math.max(z * delta, 0.1), 10));
    }
  }, []);

  // 开始平移
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  // 移动中
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanning) return;
      e.preventDefault();
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    },
    [isPanning],
  );

  // 结束平移
  const endPan = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.25, 10)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z / 1.25, 0.1)), []);
  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // 全屏功能
  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e: unknown) {
      logger.error('fullscreen', { error: e instanceof Error ? e.message : 'Unknown error' });
    }
  }, []);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 只有 SVG 格式支持前端导出和无限缩放
  const exportableSvg = format === 'svg' ? sanitizedSvg : null;
  const previewHint =
    format === 'svg'
      ? '支持无限缩放与矢量导出'
      : format === 'png'
        ? '适合截图分享与复制'
        : '适合文档交付与打印';

  const isBinaryPreview = format === 'png' || format === 'pdf';
  const hasPreviewContent = format === 'svg' ? Boolean(sanitizedSvg) : Boolean(base64);
  const showBinaryErrorState = !loading && isBinaryPreview && Boolean(error) && !hasPreviewContent;
  const emptyStateDescription =
    format === 'png'
      ? '渲染成功后会在这里显示 PNG 预览'
      : format === 'pdf'
        ? '渲染成功后会在这里显示 PDF 预览'
        : '编辑代码后自动渲染';

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full min-h-[420px] w-full flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white/90 shadow-sm backdrop-blur ${isFullscreen ? 'rounded-none border-0' : ''}`}
    >
      {/* 背景网格 */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #64748b 1px, transparent 1px),
            linear-gradient(to bottom, #64748b 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/90 backdrop-blur-sm transition-opacity">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-10 py-8 shadow-2xl ring-1 ring-slate-900/5">
            <Loader2 className="h-12 w-12 animate-spin text-sky-500" />
            <span className="text-sm font-medium text-slate-600">正在渲染图表...</span>
          </div>
        </div>
      )}

      {/* Preview Meta */}
      <div className="pointer-events-none absolute left-4 top-4 z-20 flex max-w-[calc(100%-210px)] flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
          {ENGINE_LABELS[engine]}
        </span>
        <span className="rounded-full bg-sky-50/95 px-2.5 py-1 text-[11px] font-medium text-sky-700 shadow-sm ring-1 ring-sky-100">
          {FORMAT_LABELS[format]}
        </span>
        <span className="hidden rounded-full bg-slate-900/75 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm md:inline-flex">
          {previewHint}
        </span>
      </div>

      {/* Toolbar */}
      {showPreview && (
        <PreviewToolbar
          scale={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onFullscreen={handleFullscreen}
          svgContent={exportableSvg}
          code={code}
          engine={engine}
          format={format}
          onExportError={onExportError}
        />
      )}

      {/* 全屏退出按钮 */}
      {isFullscreen && (
        <button
          onClick={handleFullscreen}
          className="absolute left-4 top-16 z-30 flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-slate-700"
        >
          <X className="h-4 w-4" />
          退出全屏 (ESC)
        </button>
      )}

      {/* Empty State */}
      {!showPreview && !loading && !showBinaryErrorState && (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-400">
          <div className="rounded-2xl bg-slate-50 p-5">
            <ImageIcon className="h-12 w-12 text-slate-300" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">预览区域</p>
            <p className="mt-0.5 text-xs text-slate-400">{emptyStateDescription}</p>
          </div>
        </div>
      )}

      {/* Binary Preview Error State */}
      {showBinaryErrorState && (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="rounded-2xl bg-rose-50 p-5 ring-1 ring-rose-100">
            <X className="h-12 w-12 text-rose-400" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-rose-600">
              {format === 'png' ? 'PNG 预览加载失败' : 'PDF 预览加载失败'}
            </p>
            <p className="text-xs leading-5 text-slate-500">{error}</p>
            <p className="text-xs text-slate-400">
              {format === 'png'
                ? '请检查远程渲染配置，或切换到 SVG 继续预览。'
                : '当前 PDF 预览依赖远程渲染结果，建议检查服务状态后重试。'}
            </p>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div
        className={`relative flex-1 overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'} ${!showPreview ? 'pointer-events-none' : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endPan}
        onMouseLeave={endPan}
      >
        <div
          className="flex h-full w-full items-center justify-center p-6 pt-20 transition-transform duration-75 ease-out sm:p-8 sm:pt-20"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center',
          }}
        >
          {format === 'svg' && svg && (
            <div
              dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
              className={`diagram-container ${isPanning ? 'pointer-events-none' : 'pointer-events-auto'}`}
            />
          )}

          {format === 'svg' && showPreview && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/70 px-3 py-1 text-[11px] text-white shadow-sm backdrop-blur">
              按住 Ctrl/⌘ + 滚轮缩放，拖拽空白区域平移
            </div>
          )}

          {format === 'png' && base64 && (
            <Image
              src={`data:${contentType};base64,${base64}`}
              alt="diagram preview"
              width={1600}
              height={1200}
              unoptimized
              className="max-h-full max-w-full rounded-2xl bg-white shadow-lg ring-1 ring-slate-900/5"
              draggable={false}
            />
          )}

          {format === 'pdf' && base64 && (
            <iframe
              title="diagram preview"
              src={`data:application/pdf;base64,${base64}`}
              className="h-full w-full rounded-2xl border border-slate-200 bg-white shadow-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
export const PreviewPanel = memo(PreviewPanelComponent);
