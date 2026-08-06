import { describe, expect, it } from 'vitest';
import {
  ENGINES,
  FORMATS,
  ENGINE_LABELS,
  FORMAT_LABELS,
  isEngine,
  isFormat,
  getKrokiType,
  canUseLocalRender,
  LANDING_ENGINE_CATEGORIES,
  LOCAL_RENDER_ENGINES,
} from '@/lib/diagramConfig';

describe('diagramConfig', () => {
  it('keeps engine and format labels aligned with their definitions', () => {
    expect(ENGINES.every((engine) => Boolean(ENGINE_LABELS[engine]))).toBe(true);
    expect(FORMATS.every((format) => Boolean(FORMAT_LABELS[format]))).toBe(true);
  });

  it('validates engines and formats correctly', () => {
    expect(isEngine('mermaid')).toBe(true);
    expect(isEngine('graphviz')).toBe(true);
    expect(isEngine('unknown-engine')).toBe(false);

    expect(isFormat('svg')).toBe(true);
    expect(isFormat('png')).toBe(true);
    expect(isFormat('jpg')).toBe(false);
  });

  it('returns the correct kroki type mapping', () => {
    expect(getKrokiType('mermaid')).toBe('mermaid');
    expect(getKrokiType('graphviz')).toBe('graphviz');
    expect(getKrokiType('flowchart')).toBe('mermaid');
  });

  it('only allows local render for supported svg combinations', () => {
    expect(canUseLocalRender('mermaid', 'svg')).toBe(true);
    expect(canUseLocalRender('graphviz', 'svg')).toBe(true);
    expect(canUseLocalRender('mermaid', 'png')).toBe(false);
    expect(canUseLocalRender('plantuml', 'svg')).toBe(false);
  });

  it('exports landing engine groups from the central engine config', () => {
    expect(LOCAL_RENDER_ENGINES).toEqual(['mermaid', 'flowchart', 'graphviz']);
    const groupedEngines = new Set(
      LANDING_ENGINE_CATEGORIES.flatMap((category) => category.engines),
    );

    expect(groupedEngines.has('mermaid')).toBe(true);
    expect(groupedEngines.has('plantuml')).toBe(true);
    expect(groupedEngines.has('graphviz')).toBe(true);
    expect(groupedEngines.has('d2')).toBe(true);
    expect([...groupedEngines].every((engine) => ENGINES.includes(engine))).toBe(true);
  });
});
