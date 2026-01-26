import type { RendererDefinition } from '../components/renderers/types';
import { renderers } from '../components/renderers';
import { validateRendererSettings } from './validation';
import { getFallbackManager } from './rendererFallback';
import { env, isDevelopment } from '../config';

/**
 * Hot reload manager for renderers during development
 */
export class RendererHotReloadManager {
  private static instance: RendererHotReloadManager;
  private watchers: Map<string, number> = new Map();
  private reloadListeners: Map<string, Set<() => void>> = new Map();
  private lastModified: Map<string, number> = new Map();

  private constructor() {
    if (isDevelopment()) {
      this.initializeHotReload();
    }
  }

  static getInstance(): RendererHotReloadManager {
    if (!RendererHotReloadManager.instance) {
      RendererHotReloadManager.instance = new RendererHotReloadManager();
    }
    return RendererHotReloadManager.instance;
  }

  /**
   * Initialize hot reload system in development
   */
  private initializeHotReload() {
    if (env.debug.validation) {
      console.log('[HOT RELOAD] Initializing hot reload system');
    }

    // Listen for Vite HMR updates
    if (import.meta.hot) {
      import.meta.hot.on('renderer-update', (data) => {
        this.handleRendererUpdate(data.rendererId);
      });

      import.meta.hot.on('renderer-error', (data) => {
        this.handleRendererError(data.rendererId, data.error);
      });
      
      console.log('[HOT RELOAD] HMR listeners initialized');
    }

    // Disable polling by default to prevent constant reloading messages
    // Uncomment the next line if you need fallback polling
    // this.startPolling();
  }

  /**
   * Start polling for renderer changes (fallback method)
   */
  private startPolling() {
    setInterval(() => {
      this.checkForChanges();
    }, 2000); // Check every 2 seconds
  }

  /**
   * Check for renderer changes by comparing timestamps
   */
  private checkForChanges() {
    // Disabled automatic change simulation to prevent constant reload messages
    // In a real implementation, you'd check actual file modification times
    // For now, hot reload will only be triggered manually or by actual HMR events
    return;
    
    /*
    for (const rendererId of Object.keys(renderers)) {
      // In a real implementation, you'd check file modification times
      // This is a simplified version for demonstration
      const now = Date.now();
      const lastCheck = this.lastModified.get(rendererId) || 0;
      
      // Simulate change detection (in practice, you'd use file watchers)
      if (Math.random() < 0.01) { // 1% chance to simulate change
        this.lastModified.set(rendererId, now);
        this.handleRendererUpdate(rendererId);
      }
    }
    */
  }

  /**
   * Handle renderer update from HMR or polling
   */
  private handleRendererUpdate(rendererId: string) {
    const listeners = this.reloadListeners.get(rendererId);
    if (listeners) {
      // Validate renderer before triggering reload
      const renderer = renderers[rendererId];
      if (renderer) {
        try {
          // Test renderer validity (could include compilation checks)
          const testResult = this.testRenderer(renderer);
          if (testResult.success) {
            console.log(`[HOT RELOAD] Reloading renderer: ${rendererId}`);
            listeners.forEach(callback => callback());
          } else {
            console.warn(`[HOT RELOAD] Renderer test failed: ${rendererId}`, testResult.error);
            this.handleRendererError(rendererId, testResult.error);
          }
        } catch (error) {
          console.error(`[HOT RELOAD] Error testing renderer: ${rendererId}`, error);
          this.handleRendererError(rendererId, error as Error);
        }
      }
    }
  }

  /**
   * Handle renderer error during hot reload
   */
  private handleRendererError(rendererId: string, error: Error) {
    console.error(`[HOT RELOAD] Renderer error: ${rendererId}`, error);
    
    // Trigger fallback if available
    const fallbackManager = getFallbackManager();
    const fallback = fallbackManager.getFallback(rendererId);
    
    if (fallback) {
      console.log(`[HOT RELOAD] Using fallback renderer: ${fallback}`);
      this.handleRendererUpdate(fallback);
    }
  }

  /**
   * Test renderer for basic functionality
   */
  private testRenderer(renderer: RendererDefinition): { success: boolean; error?: Error } {
    try {
      // Basic validation
      if (!renderer.component) {
        return { success: false, error: new Error('Renderer component is missing') };
      }
      
      if (!renderer.name || !renderer.id) {
        return { success: false, error: new Error('Renderer metadata is incomplete') };
      }

      // Test control schema
      if (renderer.controlSchema) {
        for (const section of renderer.controlSchema) {
          if (!section.title || !Array.isArray(section.controls)) {
            return { success: false, error: new Error('Invalid control schema') };
          }
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Add a reload listener for a specific renderer
   */
  addReloadListener(rendererId: string, callback: () => void): () => void {
    if (!this.reloadListeners.has(rendererId)) {
      this.reloadListeners.set(rendererId, new Set());
    }
    
    const listeners = this.reloadListeners.get(rendererId)!;
    listeners.add(callback);
    
    // Return cleanup function
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.reloadListeners.delete(rendererId);
      }
    };
  }

  /**
   * Manually trigger a reload for a specific renderer
   */
  triggerReload(rendererId: string) {
    this.handleRendererUpdate(rendererId);
  }

  /**
   * Remove all listeners and cleanup
   */
  cleanup() {
    this.reloadListeners.clear();
    this.watchers.forEach(id => clearInterval(id));
    this.watchers.clear();
  }

  /**
   * Get current hot reload status
   */
  getStatus() {
    return {
      active: isDevelopment(),
      watchers: Array.from(this.watchers.keys()),
      listeners: Object.fromEntries(
        Array.from(this.reloadListeners.entries()).map(
          ([key, set]) => [key, set.size]
        )
      )
    };
  }
}