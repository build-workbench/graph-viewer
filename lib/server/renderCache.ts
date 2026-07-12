/**
 * 渲染缓存深度模块
 *
 * 为 Kroki 渲染结果提供缓存和请求去重功能。
 * 封装缓存和 inflight 逻辑，提供简洁的接口。
 */

import crypto from 'crypto';
import { APP_CONFIG } from '@/lib/config';
import { logger } from '@/lib/logger';
import { TTLCache } from './TTLCache';

// ============================================================================
// Types
// ============================================================================

/**
 * 缓存条目类型
 */
export type RenderCacheEntry = {
  expires: number;
  contentType: string;
  svg?: string;
  base64?: string;
};

/**
 * 进行中的渲染任务类型
 */
export type RenderTask = Promise<{ buffer: Buffer; cacheEntry: RenderCacheEntry }>;

// ============================================================================
// RenderCache Class
// ============================================================================

/**
 * RenderCache - 渲染缓存深度模块
 *
 * 封装缓存和请求去重逻辑，提供简洁的接口。
 *
 * @example
 * ```typescript
 * const cache = RenderCache.getInstance();
 *
 * // 生成缓存键
 * const key = cache.createKey(baseUrl, engine, format, code);
 *
 * // 检查缓存
 * const cached = cache.get(key);
 * if (cached && !cache.isExpired(cached)) {
 *   return cached;
 * }
 *
 * // 检查进行中的请求
 * const inflight = cache.getInflight(key);
 * if (inflight) {
 *   return await inflight;
 * }
 *
 * // 设置新的进行中请求
 * cache.setInflight(key, renderTask);
 * ```
 */
export class RenderCache {
  private static instance: RenderCache | null = null;

  private readonly cache: TTLCache<string, RenderCacheEntry>;
  private readonly inflight: Map<string, RenderTask>;

  private constructor() {
    this.cache = new TTLCache<string, RenderCacheEntry>({
      maxEntries: APP_CONFIG.cache.maxEntries,
      defaultTtlMs: APP_CONFIG.cache.ttlMs,
      pruneIntervalMs: APP_CONFIG.cache.pruneIntervalMs,
    });
    this.inflight = new Map();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): RenderCache {
    if (!RenderCache.instance) {
      RenderCache.instance = new RenderCache();
    }
    return RenderCache.instance;
  }

  // ============================================================================
  // Cache Key
  // ============================================================================

  /**
   * 创建缓存键
   *
   * @param base - Kroki 基础 URL
   * @param engine - 图表引擎
   * @param format - 输出格式
   * @param code - 图表代码
   * @returns 缓存键字符串
   */
  createKey(base: string, engine: string, format: string, code: string): string {
    const h = crypto.createHash('sha256').update(code).digest('hex');
    return `${base}|${engine}|${format}|${h}`;
  }

  // ============================================================================
  // Cache Operations
  // ============================================================================

  /**
   * 获取缓存条目
   *
   * @param key - 缓存键
   * @returns 缓存条目，如果不存在则返回 undefined
   */
  get(key: string): RenderCacheEntry | undefined {
    return this.cache.get(key);
  }

  /**
   * 设置缓存条目
   *
   * @param key - 缓存键
   * @param entry - 缓存条目
   */
  set(key: string, entry: RenderCacheEntry): void {
    this.cache.set(key, entry);
  }

  /**
   * 检查缓存条目是否过期
   *
   * @param entry - 缓存条目
   * @param now - 当前时间戳（默认为 Date.now()）
   * @returns 是否过期
   */
  isExpired(entry: RenderCacheEntry, now = Date.now()): boolean {
    return entry.expires <= now;
  }

  /**
   * 清理过期缓存条目
   *
   * @param now - 当前时间戳（默认为 Date.now()）
   */
  prune(now = Date.now()): void {
    this.cache.prune(now);
  }

  // ============================================================================
  // Inflight Request Deduplication
  // ============================================================================

  /**
   * 获取进行中的渲染任务
   *
   * @param key - 缓存键
   * @returns 进行中的任务，如果不存在则返回 undefined
   */
  getInflight(key: string): RenderTask | undefined {
    return this.inflight.get(key);
  }

  /**
   * 设置进行中的渲染任务
   *
   * 如果超过最大数量，会淘汰最旧的条目。
   *
   * @param key - 缓存键
   * @param task - 渲染任务
   */
  setInflight(key: string, task: RenderTask): void {
    if (this.inflight.size >= APP_CONFIG.inflight.maxEntries) {
      const oldestKey = this.inflight.keys().next().value as string | undefined;
      if (oldestKey) {
        this.inflight.delete(oldestKey);
        logger.debug('inflight-evict', {
          message: 'Evicted oldest inflight entry',
          remaining: this.inflight.size,
        });
      }
    }
    this.inflight.set(key, task);
  }

  /**
   * 删除进行中的渲染任务
   *
   * @param key - 缓存键
   */
  deleteInflight(key: string): void {
    this.inflight.delete(key);
  }

  // ============================================================================
  // Test Utilities
  // ============================================================================

  /**
   * 重置缓存（仅用于测试）
   */
  resetForTests(): void {
    this.cache.clear();
    this.inflight.clear();
  }
}

// ============================================================================
// Convenience Export
// ============================================================================

/**
 * 获取默认的 RenderCache 实例
 */
export const renderCache = RenderCache.getInstance();
