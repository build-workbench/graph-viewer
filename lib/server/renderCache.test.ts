import { beforeEach, describe, expect, it } from 'vitest';
import { renderCache, RenderCache, type RenderCacheEntry } from './renderCache';

describe('renderCache', () => {
  beforeEach(() => {
    renderCache.resetForTests();
  });

  describe('RenderCache class', () => {
    it('returns singleton instance', () => {
      const instance1 = RenderCache.getInstance();
      const instance2 = RenderCache.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('creates stable keys that include base url, engine, format and source code', () => {
      const first = renderCache.createKey('https://kroki.io', 'mermaid', 'svg', 'graph TD\nA-->B');
      const second = renderCache.createKey('https://kroki.io', 'mermaid', 'svg', 'graph TD\nA-->B');
      const changedCode = renderCache.createKey(
        'https://kroki.io',
        'mermaid',
        'svg',
        'graph TD\nA-->C',
      );

      expect(first).toBe(second);
      expect(first).not.toBe(changedCode);
    });

    it('prunes expired cached render entries explicitly', () => {
      const fresh: RenderCacheEntry = {
        expires: 2000,
        contentType: 'image/svg+xml',
        svg: '<svg />',
      };
      const expired: RenderCacheEntry = {
        expires: 500,
        contentType: 'image/svg+xml',
        svg: '<svg />',
      };

      renderCache.set('fresh', fresh);
      renderCache.set('expired', expired);
      renderCache.prune(1000);

      expect(renderCache.get('fresh')).toBe(fresh);
      expect(renderCache.get('expired')).toBeUndefined();
    });

    it('checks expiration correctly', () => {
      const fresh: RenderCacheEntry = {
        expires: 2000,
        contentType: 'image/svg+xml',
        svg: '<svg />',
      };
      const expired: RenderCacheEntry = {
        expires: 500,
        contentType: 'image/svg+xml',
        svg: '<svg />',
      };

      expect(renderCache.isExpired(fresh, 1000)).toBe(false);
      expect(renderCache.isExpired(expired, 1000)).toBe(true);
    });

    it('tracks and clears inflight render tasks by key', async () => {
      const task = Promise.resolve({
        buffer: Buffer.from('ok'),
        cacheEntry: { expires: 2000, contentType: 'image/svg+xml', svg: '<svg />' },
      });

      renderCache.setInflight('same-request', task);
      expect(renderCache.getInflight('same-request')).toBe(task);

      renderCache.deleteInflight('same-request');
      expect(renderCache.getInflight('same-request')).toBeUndefined();
      await expect(task).resolves.toMatchObject({ cacheEntry: { svg: '<svg />' } });
    });

    it('resets cache and inflight for tests', () => {
      renderCache.set('test', { expires: 2000, contentType: 'image/svg+xml', svg: '<svg />' });
      renderCache.setInflight(
        'inflight-test',
        Promise.resolve({
          buffer: Buffer.from('ok'),
          cacheEntry: { expires: 2000, contentType: 'image/svg+xml', svg: '<svg />' },
        }),
      );

      renderCache.resetForTests();

      expect(renderCache.get('test')).toBeUndefined();
      expect(renderCache.getInflight('inflight-test')).toBeUndefined();
    });
  });
});
