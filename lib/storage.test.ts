import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadFromStorage, saveToStorage, migrateStorageKey } from './storage';

describe('storage', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: {
        store: {} as Record<string, string>,
        getItem(key: string) {
          return this.store[key] ?? null;
        },
        setItem(key: string, value: string) {
          this.store[key] = value;
        },
        removeItem(key: string) {
          delete this.store[key];
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('loadFromStorage', () => {
    it('returns default value when key does not exist', () => {
      const result = loadFromStorage('nonexistent', { foo: 'default' });
      expect(result).toEqual({ foo: 'default' });
    });

    it('returns parsed value when key exists', () => {
      window.localStorage.setItem('test-key', JSON.stringify({ foo: 'bar' }));
      const result = loadFromStorage('test-key', { foo: 'default' });
      expect(result).toEqual({ foo: 'bar' });
    });

    it('returns default value on parse error', () => {
      window.localStorage.setItem('invalid-json', 'not json');
      const result = loadFromStorage('invalid-json', { foo: 'default' });
      expect(result).toEqual({ foo: 'default' });
    });

    it('returns default value in SSR mode', () => {
      vi.stubGlobal('window', undefined);
      const result = loadFromStorage('any-key', { foo: 'ssr' });
      expect(result).toEqual({ foo: 'ssr' });
    });
  });

  describe('saveToStorage', () => {
    it('saves value to localStorage', () => {
      const result = saveToStorage('save-key', { data: 123 });
      expect(result).toBe(true);
      expect(window.localStorage.getItem('save-key')).toBe(JSON.stringify({ data: 123 }));
    });

    it('returns false in SSR mode', () => {
      vi.stubGlobal('window', undefined);
      const result = saveToStorage('any-key', { data: 123 });
      expect(result).toBe(false);
    });
  });

  describe('migrateStorageKey', () => {
    it('migrates data from legacy key to new key', () => {
      window.localStorage.setItem('old-key', JSON.stringify({ data: 'test' }));
      const result = migrateStorageKey('old-key', 'new-key');

      expect(result).toBe(true);
      expect(window.localStorage.getItem('new-key')).toBe(JSON.stringify({ data: 'test' }));
      expect(window.localStorage.getItem('old-key')).toBeNull();
    });

    it('returns false when legacy key does not exist', () => {
      const result = migrateStorageKey('nonexistent-old', 'new-key');
      expect(result).toBe(false);
    });

    it('removes legacy key if new key already has data', () => {
      window.localStorage.setItem('old-key', JSON.stringify({ old: true }));
      window.localStorage.setItem('new-key', JSON.stringify({ new: true }));

      const result = migrateStorageKey('old-key', 'new-key');

      expect(result).toBe(true);
      expect(window.localStorage.getItem('old-key')).toBeNull();
      // New key should keep its existing data
      expect(JSON.parse(window.localStorage.getItem('new-key')!)).toEqual({ new: true });
    });

    it('returns false in SSR mode', () => {
      vi.stubGlobal('window', undefined);
      const result = migrateStorageKey('old', 'new');
      expect(result).toBe(false);
    });
  });
});
