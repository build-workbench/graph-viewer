/**
 * ExportService 测试
 *
 * 测试导出服务的核心逻辑
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExportService } from '../ExportService';

// Mock DOM APIs
const mockDownloadBlob = vi.fn();
const mockDownloadFile = vi.fn();

vi.mock('../fileDownloader', () => ({
  downloadBlob: (...args: unknown[]) => mockDownloadBlob(...args),
  downloadFile: (...args: unknown[]) => mockDownloadFile(...args),
}));

// Mock canvasRenderer
vi.mock('../canvasRenderer', () => ({
  svgToCanvas: vi.fn().mockResolvedValue({
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
    toBlob: vi.fn().mockImplementation((callback: (blob: Blob) => void) => {
      callback(new Blob(['test'], { type: 'image/png' }));
    }),
  }),
}));

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    service = new ExportService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSupportedFormats', () => {
    it('returns all supported export formats', () => {
      const formats = service.getSupportedFormats();
      expect(formats).toContain('svg');
      expect(formats).toContain('png');
      expect(formats).toContain('jpeg');
      expect(formats).toContain('webp');
      expect(formats).toContain('html');
      expect(formats).toContain('md');
      expect(formats).not.toContain('pdf');
    });
  });

  describe('exportDiagram', () => {
    describe('source exports', () => {
      it('exports source code with engine-specific extension', async () => {
        const code = 'graph TD\n  A --> B';

        await service.exportDiagram({
          content: code,
          filename: 'test-diagram',
          type: 'source',
          engine: 'mermaid',
        });

        expect(mockDownloadBlob).toHaveBeenCalled();
        expect(mockDownloadBlob.mock.calls[0]?.[1]).toBe('test-diagram.mmd');
      });

      it('exports markdown with code fence when format is md', async () => {
        const code = 'graph TD\n  A --> B';

        await service.exportDiagram({
          content: code,
          filename: 'test-diagram',
          format: 'md',
          type: 'source',
          engine: 'mermaid',
        });

        expect(mockDownloadBlob).toHaveBeenCalled();
        const call = mockDownloadBlob.mock.calls[0];
        expect(call).toBeDefined();
        const blob = call![0] as Blob;
        expect(blob.type).toBe('text/markdown;charset=utf-8');
        expect(call![1]).toBe('test-diagram.md');
      });

      it('uses correct extension for graphviz', async () => {
        const code = 'digraph { A -> B }';

        await service.exportDiagram({
          content: code,
          filename: 'test',
          type: 'source',
          engine: 'graphviz',
        });

        expect(mockDownloadBlob.mock.calls[0]?.[1]).toBe('test.dot');
      });
    });

    describe('diagram exports', () => {
      it('exports SVG with preprocessing', async () => {
        const svg = '<svg><rect width="100" height="100"/></svg>';

        await service.exportDiagram({
          content: svg,
          filename: 'test',
          format: 'svg',
          type: 'diagram',
        });

        expect(mockDownloadBlob).toHaveBeenCalled();
        const call = mockDownloadBlob.mock.calls[0];
        expect(call).toBeDefined();
        const blob = call![0] as Blob;
        expect(blob.type).toBe('image/svg+xml;charset=utf-8');
        expect(call![1]).toBe('test.svg');
      });

      it('exports HTML with wrapper', async () => {
        const svg = '<svg><rect/></svg>';

        await service.exportDiagram({
          content: svg,
          filename: 'my-diagram',
          format: 'html',
          type: 'diagram',
        });

        expect(mockDownloadBlob).toHaveBeenCalled();
        const call = mockDownloadBlob.mock.calls[0];
        expect(call).toBeDefined();
        const blob = call![0] as Blob;
        expect(blob.type).toBe('text/html;charset=utf-8');
        expect(call![1]).toBe('my-diagram.html');
      });

      it('escapes HTML in filename for HTML export', async () => {
        const svg = '<svg/>';

        await service.exportDiagram({
          content: svg,
          filename: '<script>alert("xss")</script>',
          format: 'html',
          type: 'diagram',
        });

        const call = mockDownloadBlob.mock.calls[0];
        expect(call).toBeDefined();
        const blob = call![0] as Blob;
        expect(blob).toBeInstanceOf(Blob);
        expect(call![1]).toBe('<script>alert("xss")</script>.html');
      });
    });
  });
});
