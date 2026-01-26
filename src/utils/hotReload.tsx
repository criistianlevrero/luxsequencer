import { useState, useEffect, useCallback } from 'react';
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
    if (env.debug.validation) {
      console.log(`[HOT RELOAD] Renderer '${rendererId}' updated`);
    }

    // Re-validate the updated renderer
    this.validateRenderer(rendererId);

    // Notify listeners
    const listeners = this.reloadListeners.get(rendererId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener();
        } catch (error) {
          console.error(`[HOT RELOAD] Error in reload listener for '${rendererId}':`, error);
        }
      });
    }
  }

  /**
   * Handle renderer error during hot reload
   */
  private handleRendererError(rendererId: string, error: Error) {
    console.error(`[HOT RELOAD] Error in renderer '${rendererId}':`, error);
    
    // Temporarily disable the renderer
    const fallbackManager = getFallbackManager();
    fallbackManager.disableRenderer(rendererId, `Hot reload error: ${error.message}`);

    // Try to recover after a delay
    setTimeout(() => {
      this.attemptRecovery(rendererId);
    }, 5000);
  }

  /**
   * Attempt to recover a failed renderer
   */
  private async attemptRecovery(rendererId: string) {
    if (env.debug.validation) {
      console.log(`[HOT RELOAD] Attempting recovery for '${rendererId}'`);
    }

    const fallbackManager = getFallbackManager();
    const testResult = await fallbackManager.testRenderer(rendererId);

    if (testResult.success) {
      fallbackManager.enableRenderer(rendererId);
      this.handleRendererUpdate(rendererId);
      
      if (env.debug.validation) {
        console.log(`[HOT RELOAD] Successfully recovered '${rendererId}'`);
      }
    } else {
      if (env.debug.validation) {
        console.warn(`[HOT RELOAD] Recovery failed for '${rendererId}':`, testResult.error);
      }
    }
  }

  /**
   * Validate a renderer after hot reload
   */
  private async validateRenderer(rendererId: string) {
    const renderer = renderers[rendererId];
    if (!renderer) {
      console.warn(`[HOT RELOAD] Renderer '${rendererId}' not found for validation`);
      return;
    }

    try {
      // Test basic functionality
      const fallbackManager = getFallbackManager();
      const testResult = await fallbackManager.testRenderer(rendererId);
      
      if (!testResult.success) {
        console.error(`[HOT RELOAD] Validation failed for '${rendererId}':`, testResult.error);
        fallbackManager.disableRenderer(rendererId, testResult.error?.message);
      } else {
        fallbackManager.enableRenderer(rendererId);
      }
    } catch (error) {
      console.error(`[HOT RELOAD] Exception during validation of '${rendererId}':`, error);
    }
  }

  /**
   * Register a listener for renderer reloads
   */
  addReloadListener(rendererId: string, listener: () => void) {
    if (!this.reloadListeners.has(rendererId)) {
      this.reloadListeners.set(rendererId, new Set());
    }
    
    this.reloadListeners.get(rendererId)!.add(listener);
    
    // Return cleanup function
    return () => {
      this.reloadListeners.get(rendererId)?.delete(listener);
    };
  }

  /**
   * Manually trigger a reload for testing
   */
  triggerReload(rendererId: string) {
    if (isDevelopment()) {
      this.handleRendererUpdate(rendererId);
    }
  }

  /**
   * Get hot reload status
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

/**
 * Hook to handle hot reload for a specific renderer
 */
export const useRendererHotReload = (rendererId: string) => {
  const [reloadCount, setReloadCount] = useState(0);
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = useCallback(() => {
    if (!isDevelopment()) return;
    
    setIsReloading(true);
    setReloadCount(count => count + 1);
    
    // Reset reloading state after a short delay
    setTimeout(() => {
      setIsReloading(false);
    }, 1000); // Increased delay to 1 second for better visibility
  }, []);

  useEffect(() => {
    // Only setup hot reload in development mode
    if (!isDevelopment()) return;

    const manager = RendererHotReloadManager.getInstance();
    const cleanup = manager.addReloadListener(rendererId, handleReload);
    
    return cleanup;
  }, [rendererId, handleReload]);

  const triggerManualReload = useCallback(() => {
    if (isDevelopment()) {
      const manager = RendererHotReloadManager.getInstance();
      manager.triggerReload(rendererId);
    }
  }, [rendererId]);

  return {
    reloadCount,
    isReloading: isDevelopment() && isReloading, // Only show as reloading in dev mode
    triggerReload: triggerManualReload,
    isHotReloadEnabled: isDevelopment()
  };
};

/**
 * Hook to provide hot reload development tools
 */
export const useHotReloadDevTools = () => {
  const [manager] = useState(() => RendererHotReloadManager.getInstance());
  
  return {
    triggerReload: (rendererId: string) => manager.triggerReload(rendererId),
    getStatus: () => manager.getStatus(),
    isActive: isDevelopment()
  };
};

/**
 * Component to display hot reload status (development only)
 */
export const HotReloadIndicator: React.FC<{ rendererId: string }> = ({ rendererId }) => {
  const { reloadCount, isReloading, isHotReloadEnabled } = useRendererHotReload(rendererId);

  if (!isHotReloadEnabled || !env.debug.validation) {
    return null;
  }

  return (
    <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded z-50">
      {isReloading ? (
        <span className="animate-pulse">🔄 Reloading...</span>
      ) : (
        <span>🔥 Hot Reload ({reloadCount})</span>
      )}
    </div>
  );
};