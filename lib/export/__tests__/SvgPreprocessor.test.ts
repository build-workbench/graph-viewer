import { describe, expect, it, vi } from 'vitest';
import { SvgPreprocessor } from '../SvgPreprocessor';

describe('SvgPreprocessor', () => {
  it('parses a valid svg only once during preprocess', () => {
    const parseSpy = vi.spyOn(DOMParser.prototype, 'parseFromString');
    const preprocessor = new SvgPreprocessor();

    preprocessor.preprocess('<svg viewBox="0 0 100 200"><rect width="100" height="200" /></svg>');

    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });
});
