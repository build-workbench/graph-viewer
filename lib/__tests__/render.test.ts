import { describe, expect, it } from 'vitest';
import { canRender, renderDiagram, RenderError } from '../render';
import { ErrorCode } from '@/lib/errors';

describe('render module', () => {
  describe('canRender', () => {
    it('advertises local capability for mermaid + svg', () => {
      expect(canRender('mermaid', 'svg', { enableRemoteRendering: false })).toBe(true);
    });

    it('advertises local capability for graphviz + svg', () => {
      expect(canRender('graphviz', 'svg', { enableRemoteRendering: false })).toBe(true);
    });

    it('does not advertise remote capability when remote rendering is disabled', () => {
      expect(canRender('plantuml', 'png', { enableRemoteRendering: false })).toBe(false);
      expect(canRender('plantuml', 'svg', { enableRemoteRendering: false })).toBe(false);
    });

    it('advertises remote capability for non-local engines when remote is enabled', () => {
      expect(canRender('plantuml', 'png', { enableRemoteRendering: true })).toBe(true);
    });
  });

  describe('renderDiagram', () => {
    it('throws REMOTE_DISABLED for non-local engine when remote is disabled', async () => {
      await expect(
        renderDiagram(
          { engine: 'plantuml', format: 'svg', code: 'A -> B' },
          { enableRemoteRendering: false },
        ),
      ).rejects.toMatchObject({ code: ErrorCode.REMOTE_DISABLED });
    });

    it('throws REMOTE_DISABLED for non-local format when remote is disabled', async () => {
      await expect(
        renderDiagram(
          { engine: 'mermaid', format: 'png', code: 'A -> B' },
          { enableRemoteRendering: false },
        ),
      ).rejects.toMatchObject({ code: ErrorCode.REMOTE_DISABLED });
    });

    it('returns a RenderError instance with correct name', async () => {
      try {
        await renderDiagram(
          { engine: 'plantuml', format: 'svg', code: 'A -> B' },
          { enableRemoteRendering: false },
        );
      } catch (e) {
        expect(e).toBeInstanceOf(RenderError);
        expect((e as Error).name).toBe('RenderError');
      }
    });
  });
});
