/**
 * 统一错误系统
 *
 * 类型安全的错误码、ApiError 类和错误工具函数。
 */

export enum ErrorCode {
  // 客户端错误
  INVALID_BODY = 'INVALID_BODY',
  MISSING_FIELDS = 'MISSING_FIELDS',
  UNSUPPORTED_ENGINE = 'UNSUPPORTED_ENGINE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // 配置错误
  INVALID_KROKI_CONFIG = 'INVALID_KROKI_CONFIG',
  INVALID_KROKI_BASE_URL = 'INVALID_KROKI_BASE_URL',
  KROKI_BASE_URL_NOT_ALLOWED = 'KROKI_BASE_URL_NOT_ALLOWED',

  // 渲染错误
  LOCAL_RENDER_FAILED = 'LOCAL_RENDER_FAILED',
  REMOTE_RENDER_FAILED = 'REMOTE_RENDER_FAILED',
  REMOTE_DISABLED = 'REMOTE_DISABLED',
  KROKI_TIMEOUT = 'KROKI_TIMEOUT',
  KROKI_NETWORK_ERROR = 'KROKI_NETWORK_ERROR',
  KROKI_ERROR = 'KROKI_ERROR',

  // 通用错误
  ABORTED = 'ABORTED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export type ApiErrorContext = {
  httpStatus?: number;
  krokiStatus?: number;
  maxLength?: number;
  krokiUrl?: string;
  details?: string;
  originalMessage?: string;
};

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_BODY]: '请求体格式无效',
  [ErrorCode.MISSING_FIELDS]: '缺少必需字段',
  [ErrorCode.UNSUPPORTED_ENGINE]: '不支持的图表引擎',
  [ErrorCode.UNSUPPORTED_FORMAT]: '不支持的输出格式',
  [ErrorCode.PAYLOAD_TOO_LARGE]: '输入内容过长',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: '请求过于频繁，请稍后再试',

  [ErrorCode.INVALID_KROKI_CONFIG]: 'Kroki 配置无效',
  [ErrorCode.INVALID_KROKI_BASE_URL]: 'Kroki URL 格式无效',
  [ErrorCode.KROKI_BASE_URL_NOT_ALLOWED]: 'Kroki URL 不在允许列表中',

  [ErrorCode.LOCAL_RENDER_FAILED]: '本地渲染失败',
  [ErrorCode.REMOTE_RENDER_FAILED]: '远程渲染失败',
  [ErrorCode.REMOTE_DISABLED]:
    '当前静态部署模式下不可用该渲染方式，请切换到 SVG 本地渲染或使用完整服务部署。',
  [ErrorCode.KROKI_TIMEOUT]: '远程渲染服务超时，请稍后重试或检查网络连接。',
  [ErrorCode.KROKI_NETWORK_ERROR]: '无法连接远程渲染服务，可能是网络问题或访问被拦截。',
  [ErrorCode.KROKI_ERROR]: '远程渲染服务渲染失败，可能是图形代码有误。',

  [ErrorCode.ABORTED]: '操作已取消',
  [ErrorCode.NETWORK_ERROR]: '网络错误',
  [ErrorCode.UNKNOWN]: '未知错误',
};

export function buildErrorMessage(code: ErrorCode, context: ApiErrorContext = {}): string {
  let message = ERROR_MESSAGES[code];

  if (code === ErrorCode.PAYLOAD_TOO_LARGE && context.maxLength) {
    message = `${message}，最大允许 ${context.maxLength} 字符`;
  }

  if (context.httpStatus) {
    const statusParts = [`HTTP ${context.httpStatus}`];
    if (context.krokiStatus) {
      statusParts.push(`Kroki ${context.krokiStatus}`);
    }
    message += `（${statusParts.join(' / ')}）`;
  }

  if (context.details) {
    message += `：${context.details.slice(0, 120)}`;
  } else if (context.originalMessage) {
    message += `：${context.originalMessage.slice(0, 120)}`;
  }

  return message;
}

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly context: ApiErrorContext;

  constructor(code: ErrorCode, context: ApiErrorContext = {}) {
    super(buildErrorMessage(code, context));
    this.name = 'ApiError';
    this.code = code;
    this.context = context;
  }

  toJSON() {
    const result: Record<string, unknown> = {
      error: this.message,
      code: this.code,
    };

    // 向后兼容：将 originalMessage 映射为 message
    if (this.context.originalMessage) {
      result.message = this.context.originalMessage;
    }

    // 向后兼容：将 krokiStatus 映射为 status
    if (this.context.krokiStatus) {
      result.status = this.context.krokiStatus;
    }

    if (this.context.maxLength !== undefined) {
      result.maxLength = this.context.maxLength;
    }
    if (this.context.krokiUrl) {
      result.krokiUrl = this.context.krokiUrl;
    }
    if (this.context.details) {
      result.details = this.context.details;
    }

    return result;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function createErrorFromResponse(
  response: Response,
  json: Record<string, unknown> | null,
): ApiError {
  const code = (json?.code as ErrorCode) || ErrorCode.UNKNOWN;
  const context: ApiErrorContext = {
    httpStatus: response.status,
    krokiStatus: typeof json?.status === 'number' ? json.status : undefined,
    maxLength: typeof json?.maxLength === 'number' ? json.maxLength : undefined,
    details: typeof json?.details === 'string' ? json.details : undefined,
    originalMessage: typeof json?.message === 'string' ? json.message : undefined,
  };

  return new ApiError(code, context);
}

// ============================================================================
// 错误处理工具函数
// ============================================================================

export function getErrorMessage(e: unknown, fallback = 'Unknown error'): string {
  if (e instanceof Error) {
    return e.message || fallback;
  }
  if (typeof e === 'string') {
    return e || fallback;
  }
  return fallback;
}

export function isAbortError(e: unknown): boolean {
  return e instanceof Error && e.name === 'AbortError';
}

export function isNetworkError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const msg = e.message.toLowerCase();
  return (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('abort')
  );
}
