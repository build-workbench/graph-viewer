/**
 * AI 配置管理模块
 *
 * 提供配置加载、保存、验证和规范化功能。
 */

import type { AIProvider, AIConfig } from './types';
import { loadFromStorage, saveToStorage } from '@/lib/storage';
import { APP_CONFIG } from '@/lib/config';
import { isStaticExport } from '@/lib/runtime';

// ============================================================================
// Constants
// ============================================================================

/**
 * 默认 AI 配置
 */
export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
};

/**
 * 静态导出模式标志
 */
export const IS_STATIC_EXPORT = isStaticExport;

/**
 * AI 边界提示信息
 */
export const AI_BOUNDARY_NOTICE = IS_STATIC_EXPORT
  ? '当前为静态导出模式。AI 功能会从浏览器直接请求所选供应商 API，API Key 不会写入 localStorage，但会直接发送给对应供应商。'
  : 'AI 功能当前为浏览器直连模式。API Key 不会写入 localStorage，但会从当前浏览器直接发送给所选供应商。';

// ============================================================================
// Provider Utilities
// ============================================================================

/**
 * 获取可见的 AI 提供商列表
 */
export function getVisibleAIProviders(): AIProvider[] {
  return ['openai', 'anthropic', 'custom'];
}

/**
 * 检查提供商是否可选择
 */
export function isAIProviderSelectable(provider: AIProvider): boolean {
  return provider !== 'local';
}

/**
 * 检查是否为自定义提供商
 */
export function isCustomAIProvider(provider: AIProvider): boolean {
  return provider === 'custom';
}

/**
 * 获取提供商的默认模型
 */
export function getDefaultModelForProvider(provider: AIProvider): string {
  switch (provider) {
    case 'anthropic':
      return 'claude-3-haiku-20240307';
    case 'custom':
      return 'default';
    case 'openai':
    default:
      return 'gpt-4o-mini';
  }
}

// ============================================================================
// Config Validation & Normalization
// ============================================================================

/**
 * 验证 API 端点 URL
 * @returns 错误消息，如果验证通过则返回 null
 */
export function validateApiEndpoint(
  endpoint: string | undefined,
  provider: AIProvider,
): string | null {
  if (!endpoint) return null;

  if (!/^https:\/\//.test(endpoint)) {
    return `${provider === 'openai' ? 'OpenAI' : provider === 'anthropic' ? 'Anthropic' : '自定义'} API 端点必须使用 HTTPS`;
  }

  return null;
}

/**
 * 规范化 AI 配置
 * 确保配置完整且有效
 */
export function normalizeAIConfig(config: AIConfig): AIConfig {
  if (!isAIProviderSelectable(config.provider)) {
    return { ...config, provider: 'openai', model: getDefaultModelForProvider('openai') };
  }
  if (config.provider === 'custom') {
    return { ...config, model: config.model || getDefaultModelForProvider('custom') };
  }
  return { ...config, model: config.model || getDefaultModelForProvider(config.provider) };
}

// ============================================================================
// Config Persistence
// ============================================================================

/**
 * 从 localStorage 加载配置
 * 注意：API Key 不会持久化，需要用户每次输入
 */
export function loadAIConfig(): AIConfig {
  if (typeof window === 'undefined') return DEFAULT_AI_CONFIG;
  const stored = loadFromStorage<Partial<AIConfig>>(APP_CONFIG.storage.aiConfigKey, {});
  return normalizeAIConfig({ ...DEFAULT_AI_CONFIG, ...stored });
}

/**
 * 保存配置到 localStorage
 * 注意：API Key 不会被保存
 */
export function saveAIConfig(config: AIConfig): void {
  if (typeof window === 'undefined') return;
  // API Key 不写入 localStorage
  const { apiKey: _apiKey, ...rest } = config;
  saveToStorage(APP_CONFIG.storage.aiConfigKey, rest);
}

// ============================================================================
// Meta Information
// ============================================================================

/**
 * 获取 AI 边界提示信息
 */
export function getAIBoundaryNotice(): string {
  return AI_BOUNDARY_NOTICE;
}

/**
 * 获取 AI 助手元信息
 */
export function getAIAssistantMeta() {
  return {
    connectionMode: 'browser-direct' as const,
    storesApiKeyInLocalStorage: false as const,
    staticExportMode: IS_STATIC_EXPORT,
  };
}
