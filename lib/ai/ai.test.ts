import { describe, expect, it } from 'vitest';
import {
  AiClient,
  aiClient,
  buildAnalysisPrompt,
  buildGenerationPrompt,
  buildFixPrompt,
} from './AiClient';
import {
  normalizeAIConfig,
  getDefaultModelForProvider,
  isAIProviderSelectable,
  getVisibleAIProviders,
  isCustomAIProvider,
  validateApiEndpoint,
} from './AiConfig';
import type { AIConfig } from './types';

describe('lib/ai', () => {
  describe('AiConfig', () => {
    describe('normalizeAIConfig', () => {
      it('normalizes config with missing model', () => {
        const config: AIConfig = {
          provider: 'openai',
          apiKey: 'test-key',
        };
        const result = normalizeAIConfig(config);
        expect(result.model).toBe('gpt-4o-mini');
      });

      it('normalizes anthropic config', () => {
        const config: AIConfig = {
          provider: 'anthropic',
          apiKey: 'test-key',
        };
        const result = normalizeAIConfig(config);
        expect(result.model).toBe('claude-3-haiku-20240307');
      });

      it('normalizes custom provider config', () => {
        const config: AIConfig = {
          provider: 'custom',
          apiKey: 'test-key',
          apiEndpoint: 'https://api.example.com/v1',
        };
        const result = normalizeAIConfig(config);
        expect(result.model).toBe('default');
      });

      it('replaces unselectable provider with openai', () => {
        const config: AIConfig = {
          provider: 'local',
          apiKey: '',
        };
        const result = normalizeAIConfig(config);
        expect(result.provider).toBe('openai');
      });
    });

    describe('getDefaultModelForProvider', () => {
      it('returns correct model for openai', () => {
        expect(getDefaultModelForProvider('openai')).toBe('gpt-4o-mini');
      });

      it('returns correct model for anthropic', () => {
        expect(getDefaultModelForProvider('anthropic')).toBe('claude-3-haiku-20240307');
      });

      it('returns correct model for custom', () => {
        expect(getDefaultModelForProvider('custom')).toBe('default');
      });
    });

    describe('isAIProviderSelectable', () => {
      it('returns true for selectable providers', () => {
        expect(isAIProviderSelectable('openai')).toBe(true);
        expect(isAIProviderSelectable('anthropic')).toBe(true);
        expect(isAIProviderSelectable('custom')).toBe(true);
      });

      it('returns false for local provider', () => {
        expect(isAIProviderSelectable('local')).toBe(false);
      });
    });

    describe('getVisibleAIProviders', () => {
      it('returns only selectable providers', () => {
        const providers = getVisibleAIProviders();
        expect(providers).toEqual(['openai', 'anthropic', 'custom']);
        expect(providers).not.toContain('local');
      });
    });

    describe('isCustomAIProvider', () => {
      it('returns true for custom provider', () => {
        expect(isCustomAIProvider('custom')).toBe(true);
      });

      it('returns false for other providers', () => {
        expect(isCustomAIProvider('openai')).toBe(false);
        expect(isCustomAIProvider('anthropic')).toBe(false);
      });
    });

    describe('validateApiEndpoint', () => {
      it('returns null for valid HTTPS endpoint', () => {
        expect(validateApiEndpoint('https://api.example.com', 'openai')).toBeNull();
      });

      it('returns error for non-HTTPS endpoint', () => {
        expect(validateApiEndpoint('http://api.example.com', 'openai')).toBe(
          'OpenAI API 端点必须使用 HTTPS',
        );
      });

      it('returns null for undefined endpoint', () => {
        expect(validateApiEndpoint(undefined, 'openai')).toBeNull();
      });
    });
  });

  describe('AiClient', () => {
    describe('buildAnalysisPrompt', () => {
      it('includes engine name', () => {
        const prompt = buildAnalysisPrompt('mermaid');
        expect(prompt).toContain('mermaid');
        expect(prompt).toContain('图表语法专家');
      });

      it('includes JSON schema instruction', () => {
        const prompt = buildAnalysisPrompt('mermaid');
        expect(prompt).toContain('JSON 格式');
        expect(prompt).toContain('hasErrors');
      });
    });

    describe('buildGenerationPrompt', () => {
      it('includes engine name', () => {
        const prompt = buildGenerationPrompt('plantuml');
        expect(prompt).toContain('plantuml');
        expect(prompt).toContain('图表生成专家');
      });

      it('instructs to return pure code', () => {
        const prompt = buildGenerationPrompt('mermaid');
        expect(prompt).toContain('只返回纯');
        expect(prompt).toContain('不要包含任何解释');
      });
    });

    describe('buildFixPrompt', () => {
      it('includes engine name', () => {
        const prompt = buildFixPrompt('graphviz');
        expect(prompt).toContain('graphviz');
        expect(prompt).toContain('图表语法专家');
      });

      it('instructs to return pure code', () => {
        const prompt = buildFixPrompt('mermaid');
        expect(prompt).toContain('只返回修复后的纯代码');
      });
    });

    describe('AiClient class', () => {
      it('exports singleton instance', () => {
        expect(aiClient).toBeInstanceOf(AiClient);
      });

      it('throws error when API key is missing', async () => {
        const config: AIConfig = {
          provider: 'openai',
          apiKey: '',
        };
        await expect(
          aiClient.call(config, { systemPrompt: 'test', userMessage: 'test' }),
        ).rejects.toThrow('请先配置 AI API Key');
      });

      it('throws error for unsupported provider', async () => {
        const config = {
          provider: 'local' as const,
          apiKey: 'test-key',
        };
        await expect(
          aiClient.call(config, { systemPrompt: 'test', userMessage: 'test' }),
        ).rejects.toThrow('不支持的 AI 提供商');
      });

      it('throws error for custom provider without endpoint', async () => {
        const config: AIConfig = {
          provider: 'custom',
          apiKey: 'test-key',
        };
        await expect(
          aiClient.call(config, { systemPrompt: 'test', userMessage: 'test' }),
        ).rejects.toThrow('自定义 API 需要配置 endpoint');
      });
    });
  });
});
