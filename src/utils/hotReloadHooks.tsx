import React, { useState, useEffect, useCallback } from 'react';
import { RendererHotReloadManager } from './hotReload';
import { isDevelopment, env } from '../config';

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
 * Hot Reload Indicator Component
 * Shows current hot reload status during development
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