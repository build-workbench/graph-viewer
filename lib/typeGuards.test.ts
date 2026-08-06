import { describe, it, expect } from 'vitest';
import { isDiagramDoc, isDiagramDocArray, isPersistedWorkspace, type DiagramDoc } from './types';

describe('typeGuards', () => {
  const validDiagram: DiagramDoc = {
    id: 'test-id',
    name: 'Test Diagram',
    engine: 'mermaid',
    format: 'svg',
    code: 'graph TD[A-->B]',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  describe('isDiagramDoc', () => {
    it('returns true for valid DiagramDoc', () => {
      expect(isDiagramDoc(validDiagram)).toBe(true);
    });

    it('returns false for invalid engine', () => {
      expect(isDiagramDoc({ ...validDiagram, engine: 'invalid' })).toBe(false);
    });

    it('returns false for invalid format', () => {
      expect(isDiagramDoc({ ...validDiagram, format: 'invalid' })).toBe(false);
    });

    it('returns false for missing required fields', () => {
      expect(isDiagramDoc({})).toBe(false);
      expect(isDiagramDoc({ id: 'test' })).toBe(false);
      expect(isDiagramDoc(null)).toBe(false);
      expect(isDiagramDoc(undefined)).toBe(false);
    });

    it('returns false for wrong types', () => {
      expect(isDiagramDoc({ ...validDiagram, id: 123 })).toBe(false);
      expect(isDiagramDoc({ ...validDiagram, name: null })).toBe(false);
    });
  });

  describe('isDiagramDocArray', () => {
    it('returns true for array of valid DiagramDocs', () => {
      expect(isDiagramDocArray([validDiagram])).toBe(true);
      expect(isDiagramDocArray([validDiagram, validDiagram])).toBe(true);
    });

    it('returns true for empty array', () => {
      expect(isDiagramDocArray([])).toBe(true);
    });

    it('returns false for array with invalid items', () => {
      expect(isDiagramDocArray([validDiagram, {}])).toBe(false);
    });

    it('returns false for non-array', () => {
      expect(isDiagramDocArray(null)).toBe(false);
      expect(isDiagramDocArray({})).toBe(false);
      expect(isDiagramDocArray('string')).toBe(false);
    });
  });

  describe('isPersistedWorkspace', () => {
    it('returns true for valid workspace', () => {
      expect(isPersistedWorkspace({ diagrams: [validDiagram], currentId: 'test-id' })).toBe(true);
      expect(isPersistedWorkspace({ diagrams: [] })).toBe(true);
    });

    it('returns false for invalid diagrams', () => {
      expect(isPersistedWorkspace({ diagrams: [{}] })).toBe(false);
      expect(isPersistedWorkspace({ diagrams: 'not array' })).toBe(false);
    });

    it('returns false for missing diagrams', () => {
      expect(isPersistedWorkspace({})).toBe(false);
      expect(isPersistedWorkspace(null)).toBe(false);
    });

    it('returns true with optional currentId', () => {
      expect(isPersistedWorkspace({ diagrams: [validDiagram] })).toBe(true);
      expect(isPersistedWorkspace({ diagrams: [validDiagram], currentId: 'test-id' })).toBe(true);
    });

    it('returns false for invalid currentId type', () => {
      expect(isPersistedWorkspace({ diagrams: [validDiagram], currentId: 123 })).toBe(false);
    });
  });
});
