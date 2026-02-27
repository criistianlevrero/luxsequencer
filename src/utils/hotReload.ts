import type { RendererDefinition } from '../components/renderers/types';
import type { DeclarativeControlSchema, ControlSettings, ValidationResult } from '../types';
import { renderers } from '../components/renderers';
import { validateRendererSettings as _validateRendererSettings, validateSettingsWithSchema } from './validation';
import { getFallbackManager } from './rendererFallback';
import { isDevelopment } from '../config';

/**
 * Hot reload state and change tracking
 */
export interface HotReloadState {
  isReloading: boolean;
  pendingChanges: Map<string, RendererHotReloadChange>;
  preservedState: Map<string, any>;
  lastReloadTime: number;
  reloadCount: number;
}

export interface RendererHotReloadChange {
  rendererId: string;
  changeType: 'schema' | 'component' | 'validation' | 'full';
  previousSchema?: DeclarativeControlSchema;
  newSchema?: DeclarativeControlSchema;
  preservableSettings?: Record<string, any>;
  migrationRequired?: boolean;
  timestamp: number;
}

export interface HotReloadConfig {
  enabled: boolean;
  preserveState: boolean;
  autoValidate: boolean;
  fallbackOnError: boolean;
  maxReloadAttempts: number;
  debounceMs: number;
}

const DEFAULT_HOT_RELOAD_CONFIG: HotReloadConfig = {
  enabled: isDevelopment(),
  preserveState: true,
  autoValidate: true,
  fallbackOnError: true,
  maxReloadAttempts: 3,
  debounceMs: 500
};

/**
 * Enhanced Hot reload manager for renderers with state preservation and schema migration
 */
export class RendererHotReloadManager {
  private static instance: RendererHotReloadManager;
  private watchers: Map<string, number> = new Map();
  private reloadListeners: Map<string, Set<(change: RendererHotReloadChange) => void>> = new Map();
  private lastModified: Map<string, number> = new Map();
  private config: HotReloadConfig = DEFAULT_HOT_RELOAD_CONFIG;
  private state: HotReloadState = {
    isReloading: false,
    pendingChanges: new Map(),
    preservedState: new Map(),
    lastReloadTime: 0,
    reloadCount: 0
  };
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    if (this.config.enabled) {
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
   * Configure hot reload behavior
   */
  updateConfig(config: Partial<HotReloadConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current hot reload state
   */
  getState(): Readonly<HotReloadState> {
    return { ...this.state };
  }

  /**
   * Initialize hot reload system with enhanced state management
   */
  private initializeHotReload() {
    // Listen for Vite HMR updates
    if (import.meta.hot) {
      import.meta.hot.on('renderer-update', (data) => {
        this.handleRendererUpdate(data.rendererId, data.changeType || 'full');
      });

      import.meta.hot.on('renderer-schema-change', (data) => {
        this.handleSchemaChange(data.rendererId, data.previousSchema, data.newSchema);
      });

      import.meta.hot.on('renderer-error', (data) => {
        this.handleRendererError(data.rendererId, data.error);
      });
    }

    // Start change monitoring
    this.startChangeMonitoring();
  }

  /**
   * Start monitoring for renderer changes
   */
  private startChangeMonitoring() {
    // In development, changes will be handled by HMR
    // This is a placeholder for potential file watching implementation
  }

  /**
   * Handle schema changes with state preservation
   */
  private async handleSchemaChange(
    rendererId: string, 
    previousSchema: DeclarativeControlSchema | undefined, 
    newSchema: DeclarativeControlSchema
  ): Promise<void> {
    if (!this.config.enabled) return;

    const change: RendererHotReloadChange = {
      rendererId,
      changeType: 'schema',
      previousSchema,
      newSchema,
      timestamp: Date.now()
    };

    // Debounce rapid changes
    this.debounceChange(rendererId, change);
  }

  /**
   * Enhanced renderer update handler with state preservation
   */
  private async handleRendererUpdate(rendererId: string, changeType: RendererHotReloadChange['changeType'] = 'full'): Promise<void> {
    if (!this.config.enabled) return;

    const change: RendererHotReloadChange = {
      rendererId,
      changeType,
      timestamp: Date.now()
    };

    // Debounce rapid changes
    this.debounceChange(rendererId, change);
  }

  /**
   * Debounce rapid changes to prevent excessive reloads
   */
  private debounceChange(rendererId: string, change: RendererHotReloadChange): void {
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(rendererId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.processChange(change);
      this.debounceTimers.delete(rendererId);
    }, this.config.debounceMs);

    this.debounceTimers.set(rendererId, timer);
  }

  /**
   * Process a renderer change with full state management
   */
  private async processChange(change: RendererHotReloadChange): Promise<void> {
    const { rendererId, changeType: _changeType } = change;

    this.state.isReloading = true;
    this.state.pendingChanges.set(rendererId, change);

    try {
      // Step 1: Preserve current state if enabled
      if (this.config.preserveState) {
        await this.preserveCurrentState(rendererId);
      }

      // Step 2: Validate new renderer/schema
      if (this.config.autoValidate) {
        const validation = await this.validateChange(change);
        if (!validation.valid) {
          if (this.config.fallbackOnError) {
            await this.handleValidationError(change, validation);
            return;
          } else {
            throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
          }
        }
      }

      // Step 3: Apply the change
      await this.applyChange(change);

      // Step 4: Restore preserved state if possible
      if (this.config.preserveState) {
        await this.restorePreservedState(rendererId, change);
      }

      // Step 5: Notify listeners
      this.notifyChangeListeners(rendererId, change);

      // Update statistics
      this.state.reloadCount++;
      this.state.lastReloadTime = Date.now();

    } catch (error) {
      console.error(`[HOT RELOAD] Error processing change for renderer ${rendererId}:`, error);
      
      if (this.config.fallbackOnError) {
        await this.handleReloadError(change, error as Error);
      }
    } finally {
      this.state.isReloading = false;
      this.state.pendingChanges.delete(rendererId);
    }
  }

  /**
   * Preserve current settings state before reload
   */
  private async preserveCurrentState(rendererId: string): Promise<void> {
    try {
      // Get current settings from the store
      // This would typically connect to the Zustand store
      const currentSettings = this.getCurrentSettings();
      
      if (currentSettings) {
        // Extract settings specific to this renderer
        const rendererSettings = currentSettings.renderer[rendererId];
        
        if (rendererSettings) {
          this.state.preservedState.set(rendererId, {
            settings: rendererSettings,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.warn(`[HOT RELOAD] Failed to preserve state for renderer ${rendererId}:`, error);
    }
  }

  /**
   * Validate a renderer change before applying
   */
  private async validateChange(change: RendererHotReloadChange): Promise<ValidationResult> {
    const { rendererId, newSchema } = change;
    const renderer = renderers[rendererId];
    
    if (!renderer) {
      return {
        valid: false,
        errors: [{
          property: 'renderer',
          message: `Renderer '${rendererId}' not found`,
          code: 'RENDERER_NOT_FOUND',
          severity: 'error'
        }],
        warnings: []
      };
    }

    // Validate with current settings if available
    const currentSettings = this.getCurrentSettings();
    if (currentSettings && newSchema) {
      return validateSettingsWithSchema(currentSettings, newSchema, renderer);
    }

    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Apply the renderer change
   */
  private async applyChange(change: RendererHotReloadChange): Promise<void> {
    const { rendererId, changeType, newSchema } = change;
    
    switch (changeType) {
      case 'schema':
        if (newSchema) {
          // Update the schema in the renderer definition
          const renderer = renderers[rendererId];
          if (renderer) {
            (renderer as any).declarativeSchema = newSchema;
          }
        }
        break;
        
      case 'component':
      case 'full':
        // For component or full changes, the HMR system should handle the reload automatically
        break;
    }
  }

  /**
   * Get current settings from the store (placeholder)
   */
  private getCurrentSettings(): ControlSettings | null {
    // This would integrate with the Zustand store
    // For now, return null as placeholder
    return null;
  }

  /**
   * Handle validation errors during reload
   */
  private async handleValidationError(change: RendererHotReloadChange, validation: ValidationResult): Promise<void> {
    console.warn(`[HOT RELOAD] Validation failed for renderer ${change.rendererId}:`, validation.errors);
    
    // Apply fallback strategy
    const _fallbackManager = getFallbackManager();
    // await _fallbackManager.handleRendererFailure(change.rendererId, new Error('Hot reload validation failed'));
  }

  /**
   * Handle general reload errors
   */
  private async handleReloadError(change: RendererHotReloadChange, error: Error): Promise<void> {
    console.error(`[HOT RELOAD] Reload failed for renderer ${change.rendererId}:`, error);
  }

  /**
   * Notify change listeners
   */
  private notifyChangeListeners(rendererId: string, change: RendererHotReloadChange): void {
    const listeners = this.reloadListeners.get(rendererId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(change);
        } catch (error) {
          console.error(`[HOT RELOAD] Error in reload listener:`, error);
        }
      });
    }
  }

  /**
   * Restore preserved state after change
   */
  private async restorePreservedState(rendererId: string, change: RendererHotReloadChange): Promise<void> {
    const preserved = this.state.preservedState.get(rendererId);
    if (!preserved) return;

    try {
      // Check if settings are compatible with new schema
      const compatibility = this.checkSettingsCompatibility(preserved.settings, change);
      
      if (compatibility.isCompatible) {
        // Restore compatible settings
        await this.restoreSettings(rendererId, preserved.settings);
      } else {
        // Migrate settings if possible
        const migrated = this.migrateSettings(preserved.settings, change);
        if (migrated) {
          await this.restoreSettings(rendererId, migrated);
        } else {
          console.warn(`[HOT RELOAD] Could not restore state for renderer ${rendererId}: incompatible schema changes`);
        }
      }
    } catch (error) {
      console.error(`[HOT RELOAD] Error restoring state for renderer ${rendererId}:`, error);
    } finally {
      // Clean up preserved state
      this.state.preservedState.delete(rendererId);
    }
  }

  /**
   * Check if preserved settings are compatible with new schema
   */
  private checkSettingsCompatibility(settings: any, change: RendererHotReloadChange): { isCompatible: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!change.newSchema) {
      return { isCompatible: true, issues };
    }

    // Check if all current settings properties exist in new schema
    const newSchemaProperties = this.extractSchemaProperties(change.newSchema);
    
    for (const [key] of Object.entries(settings)) {
      if (!newSchemaProperties.has(key)) {
        issues.push(`Property '${key}' no longer exists in schema`);
      }
    }

    return {
      isCompatible: issues.length === 0,
      issues
    };
  }

  /**
   * Extract property names from a declarative schema
   */
  private extractSchemaProperties(schema: DeclarativeControlSchema): Set<string> {
    const properties = new Set<string>();
    
    if (schema.sections) {
      for (const section of schema.sections) {
        if (section.controls) {
          for (const control of section.controls) {
            properties.add(control.id);
          }
        }
      }
    }
    
    return properties;
  }

  /**
   * Attempt to migrate settings to new schema
   */
  private migrateSettings(settings: any, change: RendererHotReloadChange): any | null {
    if (!change.newSchema || !change.previousSchema) {
      return null;
    }

    // This is a simplified migration - in a real implementation, you'd have
    // more sophisticated migration rules
    const migrated = { ...settings };
    
    // Remove properties that no longer exist
    const newProperties = this.extractSchemaProperties(change.newSchema);
    for (const key of Object.keys(migrated)) {
      if (!newProperties.has(key)) {
        delete migrated[key];
      }
    }

    return migrated;
  }

  /**
   * Restore settings to the store
   */
  private async restoreSettings(rendererId: string, settings: any): Promise<void> {
    // This would integrate with the Zustand store to restore settings
    // Placeholder until store integration is implemented
    void rendererId;
    void settings;
  }

  /**
   * Register a listener for reload events
   */
  public addReloadListener(rendererId: string, listener: (change: RendererHotReloadChange) => void): () => void {
    if (!this.reloadListeners.has(rendererId)) {
      this.reloadListeners.set(rendererId, new Set());
    }
    
    this.reloadListeners.get(rendererId)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.reloadListeners.get(rendererId)?.delete(listener);
    };
  }

  /**
   * Manually trigger a reload for testing
   */
  public async triggerReload(rendererId: string, changeType: RendererHotReloadChange['changeType'] = 'full'): Promise<void> {
    await this.handleRendererUpdate(rendererId, changeType);
  }

  /**
   * Get reload statistics
   */
  public getStats(): {
    totalReloads: number;
    lastReloadTime: number;
    isReloading: boolean;
    pendingChanges: number;
    preservedStates: number;
  } {
    return {
      totalReloads: this.state.reloadCount,
      lastReloadTime: this.state.lastReloadTime,
      isReloading: this.state.isReloading,
      pendingChanges: this.state.pendingChanges.size,
      preservedStates: this.state.preservedState.size
    };
  }

  /**
   * Clear all preserved state (cleanup)
   */
  public clearPreservedState(): void {
    this.state.preservedState.clear();
  }

  /**
   * Handle renderer errors during hot reload
   */
  private async handleRendererError(rendererId: string, error: any): Promise<void> {
    console.error(`[HOT RELOAD] Renderer error for ${rendererId}:`, error);
    
    if (this.config.fallbackOnError) {
      const _fallbackManager = getFallbackManager();
      // await fallbackManager.handleRendererFailure(rendererId, error);
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
        const schema = typeof renderer.controlSchema === 'function' 
          ? renderer.controlSchema() 
          : renderer.controlSchema;
          
        for (const section of schema) {
          // Check if it's a ControlSection (has title and controls) not a SeparatorSection
          if ('title' in section && (!section.title || !Array.isArray(section.controls))) {
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

/**
 * Export the hot reload manager instance
 */
export const getHotReloadManager = () => RendererHotReloadManager.getInstance();

/**
 * Hook for React components to use hot reload functionality
 */
export const useHotReload = (rendererId: string) => {
  const manager = getHotReloadManager();
  
  return {
    addListener: (listener: (change: RendererHotReloadChange) => void) => 
      manager.addReloadListener(rendererId, listener),
    triggerReload: (changeType?: RendererHotReloadChange['changeType']) => 
      manager.triggerReload(rendererId, changeType),
    getStats: () => manager.getStats(),
    isReloading: manager.getState().isReloading
  };
};

/**
 * Export types for external use
 */
// Hot reload types exported individually above