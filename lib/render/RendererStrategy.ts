/**
 * RendererStrategy - 渲染器策略
 *
 * 组合多个渲染器，按优先级选择合适的渲染器
 */

import type { Engine, Format } from '@/lib/diagramConfig';
import type { Renderer, RenderInput, RenderOutput } from './types';
import { RenderError } from './types';
import { ErrorCode } from '@/lib/errors';
import { LocalWasmRenderer, localWasmRenderer } from './LocalWasmRenderer';
import { RemoteKrokiRenderer } from './RemoteKrokiRenderer';

export type RendererStrategyConfig = {
  enableRemoteRendering: boolean;
};

export class RendererStrategy implements Renderer {
  private readonly renderers: Renderer[];
  private readonly localRenderer: LocalWasmRenderer;
  private readonly remoteRenderer: RemoteKrokiRenderer;
  private readonly config: RendererStrategyConfig;

  constructor(
    localRenderer: LocalWasmRenderer,
    remoteRenderer: RemoteKrokiRenderer,
    config: RendererStrategyConfig,
  ) {
    this.localRenderer = localRenderer;
    this.remoteRenderer = remoteRenderer;
    this.config = config;
    this.renderers = [localRenderer, remoteRenderer];
  }

  canRender(engine: Engine, format: Format): boolean {
    return this.getCandidateRenderers(engine, format).length > 0;
  }

  async render(input: RenderInput, signal?: AbortSignal): Promise<RenderOutput> {
    const { engine, format } = input;
    const candidates = this.getCandidateRenderers(engine, format);

    if (candidates.length === 0) {
      if (!this.config.enableRemoteRendering) {
        throw new RenderError(ErrorCode.REMOTE_DISABLED);
      }
      throw new RenderError(ErrorCode.UNSUPPORTED_FORMAT);
    }

    let lastError: unknown;

    for (const renderer of candidates) {
      try {
        const result = await renderer.render(input, signal);
        return result;
      } catch (error: unknown) {
        if (error instanceof RenderError && error.code === ErrorCode.ABORTED) {
          throw error;
        }
        lastError = error;
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new RenderError(ErrorCode.UNKNOWN);
  }

  getAvailableRenderers(engine: Engine, format: Format): string[] {
    return this.getCandidateRenderers(engine, format).map((renderer) => renderer.constructor.name);
  }

  private getCandidateRenderers(engine: Engine, format: Format): Renderer[] {
    const candidates: Renderer[] = [];

    if (this.localRenderer.canRender(engine, format)) {
      candidates.push(this.localRenderer);
    }

    if (this.config.enableRemoteRendering && this.remoteRenderer.canRender(engine, format)) {
      candidates.push(this.remoteRenderer);
    }

    return candidates;
  }
}

export function createRendererStrategy(config: RendererStrategyConfig): RendererStrategy {
  const localRenderer = localWasmRenderer;
  const remoteRenderer = new RemoteKrokiRenderer(config.enableRemoteRendering);
  return new RendererStrategy(localRenderer, remoteRenderer, config);
}
