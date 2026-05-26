import { describe, expect, it } from 'vitest';
import { createRendererStrategy } from './RendererStrategy';

describe('RendererStrategy', () => {
  it('does not advertise remote capability when remote rendering is disabled', () => {
    const strategy = createRendererStrategy({ enableRemoteRendering: false });

    expect(strategy.canRender('plantuml', 'png')).toBe(false);
    expect(strategy.getAvailableRenderers('plantuml', 'png')).toEqual([]);
    expect(strategy.getAvailableRenderers('mermaid', 'svg')).toEqual(['LocalWasmRenderer']);
  });
});
