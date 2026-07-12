/**
 * AI 客户端模块
 *
 * 封装 AI API 调用逻辑，支持 OpenAI、Anthropic 和自定义 API。
 */

import type { AIConfig } from './types';
import { parseOpenAIResponse, parseAnthropicResponse } from './types';
import { validateApiEndpoint, getDefaultModelForProvider } from './AiConfig';

// ============================================================================
// Types
// ============================================================================

/**
 * AI 调用选项
 */
export type AICallOptions = {
  systemPrompt: string;
  userMessage: string;
};

/**
 * AI 调用结果
 */
export type AICallResult = {
  content: string;
};

// ============================================================================
// Prompt Builders
// ============================================================================

const ANALYSIS_JSON_SCHEMA = `请以 JSON 格式回复，包含以下字段：
- hasErrors: boolean - 是否有错误
- errors: array - 错误列表，每个错误包含 line(行号), message(错误描述), suggestion(修正建议)
- correctedCode: string - 修正后的完整代码（如果有错误）
- suggestions: array - 改进建议列表
- explanation: string - 总体解释`;

/**
 * 构建分析 Prompt
 */
export function buildAnalysisPrompt(engineName: string): string {
  return `你是一个 ${engineName} 图表语法专家。你的任务是：
1. 分析用户提供的 ${engineName} 代码，找出语法错误
2. 提供修正建议和正确的代码
3. 解释错误原因
4. 给出改进建议

${ANALYSIS_JSON_SCHEMA}`;
}

/**
 * 构建生成 Prompt
 */
export function buildGenerationPrompt(engineName: string): string {
  return `你是一个 ${engineName} 图表生成专家。根据用户的描述，生成对应的 ${engineName} 代码。
只返回纯 ${engineName} 代码，不要包含任何解释或 markdown 代码块标记。`;
}

/**
 * 构建修复 Prompt
 */
export function buildFixPrompt(engineName: string): string {
  return `你是一个 ${engineName} 图表语法专家。请修复以下代码中的错误，只返回修复后的纯代码，不要包含任何解释或 markdown 代码块标记。`;
}

// ============================================================================
// API Request Builders
// ============================================================================

type APIRequest = {
  endpoint: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

/**
 * 构建 OpenAI API 请求
 */
function buildOpenAIRequest(config: AIConfig, options: AICallOptions): APIRequest {
  const endpoint = config.apiEndpoint || 'https://api.openai.com/v1/chat/completions';
  const validationError = validateApiEndpoint(config.apiEndpoint, 'openai');
  if (validationError) {
    throw new Error(validationError);
  }

  return {
    endpoint,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: {
      model: config.model || getDefaultModelForProvider('openai'),
      messages: [
        { role: 'system', content: options.systemPrompt },
        { role: 'user', content: options.userMessage },
      ],
      temperature: 0.3,
    },
  };
}

/**
 * 构建 Anthropic API 请求
 */
function buildAnthropicRequest(config: AIConfig, options: AICallOptions): APIRequest {
  const endpoint = config.apiEndpoint || 'https://api.anthropic.com/v1/messages';
  const validationError = validateApiEndpoint(config.apiEndpoint, 'anthropic');
  if (validationError) {
    throw new Error(validationError);
  }

  return {
    endpoint,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: {
      model: config.model || getDefaultModelForProvider('anthropic'),
      max_tokens: 4096,
      system: options.systemPrompt,
      messages: [{ role: 'user', content: options.userMessage }],
    },
  };
}

/**
 * 构建自定义 API 请求
 */
function buildCustomRequest(config: AIConfig, options: AICallOptions): APIRequest {
  if (!config.apiEndpoint) {
    throw new Error('自定义 API 需要配置 endpoint');
  }
  const validationError = validateApiEndpoint(config.apiEndpoint, 'custom');
  if (validationError) {
    throw new Error(validationError);
  }

  return {
    endpoint: config.apiEndpoint,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: {
      model: config.model || getDefaultModelForProvider('custom'),
      messages: [
        { role: 'system', content: options.systemPrompt },
        { role: 'user', content: options.userMessage },
      ],
    },
  };
}

// ============================================================================
// AiClient Class
// ============================================================================

/** AI 调用超时时间（毫秒） */
const AI_CALL_TIMEOUT_MS = 30_000;

/**
 * AiClient - AI API 调用客户端
 *
 * 封装不同 AI 提供商的 API 调用逻辑。
 */
export class AiClient {
  /**
   * 调用 AI API
   *
   * @param config - AI 配置
   * @param options - 调用选项
   * @param externalSignal - 可选的外部 AbortSignal，用于取消请求
   * @returns AI 响应内容
   * @throws 如果 API 调用失败或超时
   */
  async call(
    config: AIConfig,
    options: AICallOptions,
    externalSignal?: AbortSignal,
  ): Promise<string> {
    if (!config.apiKey) {
      throw new Error('请先配置 AI API Key');
    }

    let request: APIRequest;

    switch (config.provider) {
      case 'openai':
        request = buildOpenAIRequest(config, options);
        break;

      case 'anthropic':
        request = buildAnthropicRequest(config, options);
        break;

      case 'custom':
        request = buildCustomRequest(config, options);
        break;

      default:
        throw new Error(`不支持的 AI 提供商: ${config.provider}`);
    }

    // 超时 AbortController
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), AI_CALL_TIMEOUT_MS);

    // 合并外部 signal 与超时 signal：外部 abort 时同步 abort 超时控制器
    const onExternalAbort = () => timeoutController.abort();
    if (externalSignal) {
      if (externalSignal.aborted) {
        clearTimeout(timeoutId);
        throw new Error('AI 请求已取消');
      }
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
    const signal = timeoutController.signal;

    let response: Response;
    try {
      response = await fetch(request.endpoint, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(request.body),
        signal,
      });
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      if (e instanceof Error && e.name === 'AbortError') {
        if (externalSignal?.aborted) {
          throw new Error('AI 请求已取消');
        }
        throw new Error(`AI 请求超时（${AI_CALL_TIMEOUT_MS / 1000}s）`);
      }
      throw e;
    } finally {
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errObj = errorData?.error as Record<string, unknown> | undefined;
      const errMsg =
        typeof errObj?.message === 'string' ? errObj.message : `API 请求失败: ${response.status}`;
      throw new Error(errMsg);
    }

    const data = await response.json();

    // 根据提供商解析响应
    if (config.provider === 'anthropic') {
      return parseAnthropicResponse(data);
    }
    return parseOpenAIResponse(data);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * 默认 AiClient 实例
 */
export const aiClient = new AiClient();
