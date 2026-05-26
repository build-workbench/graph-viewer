/**
 * SvgPreprocessor - SVG 预处理器
 *
 * Deep Module：提供单一接口处理 SVG 预处理，内部隐藏所有实现细节
 */

import type { ExportOptions, ProcessedSvg } from './types';
import { DEFAULT_EXPORT_OPTIONS } from './types';

/**
 * SVG 预处理器
 *
 * 负责将原始 SVG 内容处理为适合导出的格式
 */
export class SvgPreprocessor {
  /**
   * 预处理 SVG 内容
   *
   * @param svgContent 原始 SVG 内容
   * @param options 导出选项
   * @returns 处理结果
   */
  preprocess(svgContent: string, options: Partial<ExportOptions> = {}): ProcessedSvg {
    const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');

    if (!svgElement) {
      const dimensions = this.extractDimensions(svgContent);
      return { content: svgContent, ...dimensions };
    }

    this.ensureNamespaces(svgElement, svgContent);
    this.processStyleElements(svgElement);

    if (typeof window !== 'undefined') {
      this.inlineComputedStyles(svgElement);
    }

    this.ensureDimensions(svgElement);

    if (opts.padding > 0) {
      this.applyPadding(svgElement, opts.padding);
    }

    const processed = new XMLSerializer().serializeToString(svgElement);
    const dimensions = this.extractDimensionsFromSvgElement(svgElement);

    return { content: processed, ...dimensions };
  }

  /**
   * 提取 SVG 尺寸
   */
  extractDimensions(svgContent: string): { width: number; height: number } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');

    if (!svgElement) {
      return { width: 800, height: 600 };
    }

    return this.extractDimensionsFromSvgElement(svgElement);
  }

  private extractDimensionsFromSvgElement(svgElement: SVGSVGElement): {
    width: number;
    height: number;
  } {
    let width = parseFloat(svgElement.getAttribute('width') || '0');
    let height = parseFloat(svgElement.getAttribute('height') || '0');

    if ((!width || !height) && svgElement.hasAttribute('viewBox')) {
      const viewBox = svgElement.getAttribute('viewBox')!.split(/\s+/);
      width = parseFloat(viewBox[2] ?? '800') || 800;
      height = parseFloat(viewBox[3] ?? '600') || 600;
    }

    return {
      width: width || 800,
      height: height || 600,
    };
  }

  /**
   * 确保 SVG 命名空间正确
   */
  private ensureNamespaces(svgElement: SVGSVGElement, svgContent: string): void {
    if (!svgElement.hasAttribute('xmlns')) {
      svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    if (!svgElement.hasAttribute('xmlns:xlink') && svgContent.includes('xlink:')) {
      svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    }
  }

  /**
   * 处理 SVG 中的 style 标签，添加 CDATA 包装
   */
  private processStyleElements(svgElement: SVGSVGElement): void {
    const styleElements = svgElement.querySelectorAll('style');
    styleElements.forEach((style) => {
      if (style.textContent && !style.textContent.includes('CDATA')) {
        style.textContent = this.wrapStyleWithCdata(style.textContent);
      }
    });
  }

  /**
   * 包装 style 标签内容为 CDATA
   */
  private wrapStyleWithCdata(styleContent: string): string {
    if (!styleContent || styleContent.includes('CDATA')) {
      return styleContent;
    }
    return `\n/*<![CDATA[*/\n${styleContent}\n/*]]>*/\n`;
  }

  /**
   * 内联 SVG 元素的重要样式属性
   */
  private inlineComputedStyles(svgElement: SVGSVGElement): void {
    const properties = [
      'fill',
      'stroke',
      'stroke-width',
      'font-family',
      'font-size',
      'font-weight',
      'opacity',
    ];

    const allElements = svgElement.querySelectorAll('*');
    allElements.forEach((element) => {
      if (element instanceof SVGElement) {
        const computedStyle = window.getComputedStyle(element);
        properties.forEach((prop) => {
          const value = computedStyle.getPropertyValue(prop);
          if (value && value !== 'none' && !element.hasAttribute(prop)) {
            element.setAttribute(prop, value);
          }
        });
      }
    });
  }

  /**
   * 确保 SVG 有明确的宽高属性
   */
  private ensureDimensions(svgElement: SVGSVGElement): void {
    if (!svgElement.hasAttribute('width') || !svgElement.hasAttribute('height')) {
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/\s+/);
        if (parts.length === 4) {
          if (!svgElement.hasAttribute('width')) {
            svgElement.setAttribute('width', parts[2] ?? '800');
          }
          if (!svgElement.hasAttribute('height')) {
            svgElement.setAttribute('height', parts[3] ?? '600');
          }
        }
      }
    }
  }

  /**
   * 应用 padding 到 viewBox
   */
  private applyPadding(svgElement: SVGSVGElement, padding: number): void {
    const viewBox = svgElement.getAttribute('viewBox');
    if (!viewBox) return;

    const parts = viewBox.split(/\s+/).map(Number);
    if (parts.length !== 4) return;

    const [minX = 0, minY = 0, width = 0, height = 0] = parts;
    const newViewBox = `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`;
    svgElement.setAttribute('viewBox', newViewBox);
  }
}

/**
 * 默认 SVG 预处理器实例
 */
export const svgPreprocessor = new SvgPreprocessor();
