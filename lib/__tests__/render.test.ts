import { describe, expect, it } from 'vitest';
import { renderDiagram, RenderError } from '../render';
import { ErrorCode } from '@/lib/errors';

describe('render module', () => {
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
