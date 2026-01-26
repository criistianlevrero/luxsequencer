import type { RendererDefinition } from '../components/renderers/types';
import { renderers } from '../components/renderers';
import { env } from '../config';

/**
 * Fallback management for renderers
 */
export class RendererFallbackManager {
  private static instance: RendererFallbackManager;
  private fallbackChain: Map<string, string[]> = new Map();
  private disabledRenderers: Set<string> = new Set();

  private constructor() {
    this.initializeDefaultFallbacks();
  }

  static getInstance(): RendererFallbackManager {
    if (!RendererFallbackManager.instance) {
      RendererFallbackManager.instance = new RendererFallbackManager();
    }
    return RendererFallbackManager.instance;
  }

  /**
   * Initialize default fallback chains for built-in renderers
   */
  private initializeDefaultFallbacks() {
    // WebGL renderer falls back to concentric (simpler Canvas 2D)
    this.setFallbackChain('webgl', ['concentric']);
    
    // Concentric renderer has no fallback (it's the most basic)
    this.setFallbackChain('concentric', []);
    
    if (env.debug.validation) {
      console.log('[FALLBACK] Initialized default fallback chains:', {
        webgl: this.fallbackChain.get('webgl'),
        concentric: this.fallbackChain.get('concentric')
      });
    }
  }

  /**
   * Set fallback chain for a renderer
   */
  setFallbackChain(rendererId: string, fallbacks: string[]) {
    // Validate that fallback renderers exist
    const validFallbacks = fallbacks.filter(fallbackId => {
      const exists = renderers[fallbackId] !== undefined;
      if (!exists && env.debug.validation) {
        console.warn(`[FALLBACK] Fallback renderer '${fallbackId}' not found for '${rendererId}'`);
      }
      return exists;
    });

    this.fallbackChain.set(rendererId, validFallbacks);
    
    if (env.debug.validation) {
      console.log(`[FALLBACK] Set fallback chain for '${rendererId}':`, validFallbacks);
    }
  }

  /**
   * Get the next fallback renderer for a given renderer
   */
  getNextFallback(rendererId: string): RendererDefinition | null {
    const fallbacks = this.fallbackChain.get(rendererId) || [];
    
    // Find the first fallback that isn't disabled
    for (const fallbackId of fallbacks) {
      if (!this.disabledRenderers.has(fallbackId)) {
        const fallbackRenderer = renderers[fallbackId];
        if (fallbackRenderer) {
          if (env.debug.validation) {
            console.log(`[FALLBACK] Using fallback '${fallbackId}' for '${rendererId}'`);
          }
          return fallbackRenderer;
        }
      }
    }

    if (env.debug.validation) {
      console.warn(`[FALLBACK] No available fallback for '${rendererId}'`);
    }
    
    return null;
  }

  /**
   * Get all fallbacks in chain for a renderer
   */
  getFallbackChain(rendererId: string): RendererDefinition[] {
    const fallbacks = this.fallbackChain.get(rendererId) || [];
    return fallbacks
      .filter(id => !this.disabledRenderers.has(id))
      .map(id => renderers[id])
      .filter(renderer => renderer !== undefined);
  }

  /**
   * Disable a renderer (removes it from fallback consideration)
   */
  disableRenderer(rendererId: string, reason?: string) {
    this.disabledRenderers.add(rendererId);
    
    if (env.debug.validation) {
      console.warn(`[FALLBACK] Disabled renderer '${rendererId}'${reason ? `: ${reason}` : ''}`);
    }
  }

  /**
   * Re-enable a disabled renderer
   */
  enableRenderer(rendererId: string) {
    const wasDisabled = this.disabledRenderers.delete(rendererId);
    
    if (wasDisabled && env.debug.validation) {
      console.log(`[FALLBACK] Re-enabled renderer '${rendererId}'`);
    }
    
    return wasDisabled;
  }

  /**
   * Check if a renderer is available (not disabled)
   */
  isRendererAvailable(rendererId: string): boolean {
    return !this.disabledRenderers.has(rendererId) && renderers[rendererId] !== undefined;
  }

  /**
   * Get the best available renderer, considering fallbacks
   */
  getBestAvailableRenderer(preferredRendererId: string): RendererDefinition | null {
    // First try the preferred renderer
    if (this.isRendererAvailable(preferredRendererId)) {
      return renderers[preferredRendererId];
    }

    // Try fallbacks
    const fallback = this.getNextFallback(preferredRendererId);
    if (fallback) {
      return fallback;
    }

    // Last resort: find any available renderer
    const availableRenderers = Object.entries(renderers)
      .filter(([id]) => this.isRendererAvailable(id))
      .map(([, renderer]) => renderer);

    if (availableRenderers.length > 0) {
      const fallbackRenderer = availableRenderers[0];
      
      if (env.debug.validation) {
        console.warn(`[FALLBACK] Using emergency fallback '${fallbackRenderer.id}' for '${preferredRendererId}'`);
      }
      
      return fallbackRenderer;
    }

    return null;
  }

  /**
   * Get status information about all renderers and their fallbacks
   */
  getStatus(): {
    available: string[];
    disabled: string[];
    fallbackChains: Record<string, string[]>;
  } {
    return {
      available: Object.keys(renderers).filter(id => this.isRendererAvailable(id)),
      disabled: Array.from(this.disabledRenderers),
      fallbackChains: Object.fromEntries(this.fallbackChain)
    };
  }

  /**
   * Test if a renderer works by attempting to instantiate it
   */
  async testRenderer(rendererId: string): Promise<{ success: boolean; error?: Error }> {
    try {
      const renderer = renderers[rendererId];
      if (!renderer) {
        throw new Error(`Renderer '${rendererId}' not found`);
      }

      // Basic instantiation test - in a real implementation, you might do more
      // comprehensive testing like checking WebGL context, Canvas support, etc.
      
      // For now, just check if the component can be referenced
      if (typeof renderer.component !== 'function') {
        throw new Error('Renderer component is not a valid React component');
      }

      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      if (env.debug.validation) {
        console.error(`[FALLBACK] Renderer test failed for '${rendererId}':`, err);
      }
      
      return { success: false, error: err };
    }
  }

  /**
   * Test all renderers and disable those that fail
   */
  async testAllRenderers(): Promise<void> {
    const testPromises = Object.keys(renderers).map(async (rendererId) => {
      const result = await this.testRenderer(rendererId);
      if (!result.success) {
        this.disableRenderer(rendererId, result.error?.message);
      }
      return { rendererId, ...result };
    });

    const results = await Promise.all(testPromises);
    
    if (env.debug.validation) {
      console.log('[FALLBACK] Renderer test results:', results);
    }
  }
}

/**
 * Convenience function to get the fallback manager instance
 */
export const getFallbackManager = () => RendererFallbackManager.getInstance();

/**
 * Hook to get fallback information for a renderer
 */
export const useRendererFallback = (rendererId: string) => {
  const manager = getFallbackManager();
  
  return {
    isAvailable: manager.isRendererAvailable(rendererId),
    nextFallback: manager.getNextFallback(rendererId),
    fallbackChain: manager.getFallbackChain(rendererId),
    bestAvailable: manager.getBestAvailableRenderer(rendererId)
  };
};