/**
 * 导出模块类型定义
 */

/**
 * 支持的导出格式
 */
export type ExportFormat = 'svg' | 'png' | 'jpeg' | 'webp' | 'html' | 'md';

/**
 * 导出选项
 */
export type ExportOptions = {
  /** 缩放比例（用于位图导出） */
  scale?: number;
  /** 图片质量（0-1，用于 JPEG/WebP） */
  quality?: number;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 内边距 */
  padding?: number;
  /** 水印文本 */
  watermark?: string;
  /** 最大宽度限制 */
  maxWidth?: number;
  /** 最大高度限制 */
  maxHeight?: number;
};

/**
 * 默认导出选项
 */
export const DEFAULT_EXPORT_OPTIONS: Required<ExportOptions> = {
  scale: 2,
  quality: 0.95,
  backgroundColor: '#ffffff',
  padding: 20,
  watermark: '',
  maxWidth: 0,
  maxHeight: 0,
};

/**
 * SVG 预处理结果
 */
export type ProcessedSvg = {
  /** 处理后的 SVG 内容 */
  content: string;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
};

/**
 * 导出错误类型
 */
export type ExportError = {
  code: 'INVALID_SVG' | 'CANVAS_ERROR' | 'DOWNLOAD_FAILED' | 'UNKNOWN';
  message: string;
  cause?: unknown;
};

/**
 * 导出错误类
 */
export class ExportException extends Error {
  readonly code: ExportError['code'];
  readonly cause?: unknown;

  constructor(error: ExportError) {
    super(error.message);
    this.name = 'ExportException';
    this.code = error.code;
    this.cause = error.cause;
  }
}
