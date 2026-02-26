import React from 'react';
import type { 
  AnyControlSettings, 
  ControlSettings, 
  LegacyControlSettings, 
  CommonSettings, 
  RendererSettings, 
  WebGLSettings, 
  ConcentricSettings,
  DvdScreensaverSettings
} from '../types';
import { isNewControlSettings } from '../types';

/**
 * Migrates legacy flat settings structure to new hierarchical structure
 */
export const migrateLegacySettings = (legacySettings: LegacyControlSettings): ControlSettings => {
  const commonSettings: CommonSettings = {
    animationSpeed: legacySettings.animationSpeed,
    animationDirection: legacySettings.animationDirection,
    backgroundGradientColors: legacySettings.backgroundGradientColors,
  };

  const webglSettings: WebGLSettings = {
    scaleSize: legacySettings.scaleSize,
    scaleSpacing: legacySettings.scaleSpacing,
    verticalOverlap: legacySettings.verticalOverlap,
    horizontalOffset: legacySettings.horizontalOffset,
    shapeMorph: legacySettings.shapeMorph,
    textureRotation: legacySettings.textureRotation,
    textureRotationSpeed: legacySettings.textureRotationSpeed,
    scaleBorderColor: legacySettings.scaleBorderColor,
    scaleBorderWidth: legacySettings.scaleBorderWidth,
    gradientColors: legacySettings.gradientColors,
    centerOffset: legacySettings.centerOffset,
    scaleRange: legacySettings.scaleRange,
  };

  const concentricSettings: ConcentricSettings = {
    repetitionSpeed: legacySettings.concentric_repetitionSpeed ?? 0.5,
    growthSpeed: legacySettings.concentric_growthSpeed ?? 0.5,
    initialSize: legacySettings.concentric_initialSize ?? 10,
    rotationSpeed: legacySettings.concentric_rotationSpeed ?? 0,
    strokeWidth: legacySettings.concentric_strokeWidth ?? 2,
    fillMode: legacySettings.concentric_fillMode ?? 'stroke',
    sides: legacySettings.concentric_sides ?? 6,
    gradientColors: legacySettings.concentric_gradientColors ?? [],
  };

  const rendererSettings: RendererSettings = {
    webgl: webglSettings,
    concentric: concentricSettings,
  };

  return {
    common: commonSettings,
    renderer: rendererSettings,
  };
};

/**
 * Converts new hierarchical settings back to legacy flat structure for backward compatibility
 */
export const toLegacySettings = (newSettings: ControlSettings): LegacyControlSettings => {
  const webglSettings = newSettings.renderer.webgl as WebGLSettings;
  const concentricSettings = newSettings.renderer.concentric as ConcentricSettings;

  return {
    // Common settings
    animationSpeed: newSettings.common.animationSpeed,
    animationDirection: newSettings.common.animationDirection,
    backgroundGradientColors: newSettings.common.backgroundGradientColors,

    // WebGL settings
    scaleSize: webglSettings?.scaleSize ?? 150,
    scaleSpacing: webglSettings?.scaleSpacing ?? 0,
    verticalOverlap: webglSettings?.verticalOverlap ?? 0,
    horizontalOffset: webglSettings?.horizontalOffset ?? 0.5,
    shapeMorph: webglSettings?.shapeMorph ?? 0,
    textureRotation: webglSettings?.textureRotation ?? 0,
    textureRotationSpeed: webglSettings?.textureRotationSpeed ?? 0,
    scaleBorderColor: webglSettings?.scaleBorderColor ?? '#000000',
    scaleBorderWidth: webglSettings?.scaleBorderWidth ?? 0,
    gradientColors: webglSettings?.gradientColors ?? [],
    centerOffset: webglSettings?.centerOffset ?? { x: 0, y: 0 },
    scaleRange: webglSettings?.scaleRange ?? { min: 1.0, max: 1.0 },

    // Concentric settings
    concentric_repetitionSpeed: concentricSettings?.repetitionSpeed,
    concentric_growthSpeed: concentricSettings?.growthSpeed,
    concentric_initialSize: concentricSettings?.initialSize,
    concentric_rotationSpeed: concentricSettings?.rotationSpeed,
    concentric_strokeWidth: concentricSettings?.strokeWidth,
    concentric_fillMode: concentricSettings?.fillMode,
    concentric_sides: concentricSettings?.sides,
    concentric_gradientColors: concentricSettings?.gradientColors,
  };
};

/**
 * Normalizes any settings structure to the new hierarchical format
 */
export const normalizeSettings = (settings: AnyControlSettings): ControlSettings => {
  if (isNewControlSettings(settings)) {
    return settings;
  }
  
  return migrateLegacySettings(settings);
};

/**
 * Gets a specific renderer's settings from the hierarchical structure
 */
export const getRendererSettings = <T = unknown>(
  settings: ControlSettings, 
  rendererId: string
): T | undefined => {
  return settings.renderer[rendererId] as T;
};

/**
 * Sets renderer-specific settings in the hierarchical structure
 */
export const setRendererSettings = (
  settings: ControlSettings, 
  rendererId: string, 
  rendererSettings: unknown
): ControlSettings => {
  return {
    ...settings,
    renderer: {
      ...settings.renderer,
      [rendererId]: rendererSettings,
    },
  };
};

/**
 * Maps legacy property IDs to hierarchical property paths
 * This maintains compatibility with existing control schemas
 */
export const mapPropertyIdToPath = (propertyId: string, activeRenderer: string = 'webgl'): string => {
  // Common properties (shared across renderers)
  const commonProperties: Record<string, string> = {
    'animationSpeed': 'common.animationSpeed',
    'animationDirection': 'common.animationDirection',
    'backgroundGradientColors': 'common.backgroundGradientColors',
  };

  // WebGL renderer properties
  const webglProperties: Record<string, string> = {
    'scaleSize': 'renderer.webgl.scaleSize',
    'scaleSpacing': 'renderer.webgl.scaleSpacing',
    'verticalOverlap': 'renderer.webgl.verticalOverlap',
    'horizontalOffset': 'renderer.webgl.horizontalOffset',
    'shapeMorph': 'renderer.webgl.shapeMorph',
    'textureRotation': 'renderer.webgl.textureRotation',
    'textureRotationSpeed': 'renderer.webgl.textureRotationSpeed',
    'scaleBorderColor': 'renderer.webgl.scaleBorderColor',
    'scaleBorderWidth': 'renderer.webgl.scaleBorderWidth',
    'gradientColors': 'renderer.webgl.gradientColors',
  };

  // Concentric renderer properties
  const concentricProperties: Record<string, string> = {
    'concentric_repetitionSpeed': 'renderer.concentric.repetitionSpeed',
    'concentric_growthSpeed': 'renderer.concentric.growthSpeed',
    'concentric_initialSize': 'renderer.concentric.initialSize',
    'concentric_rotationSpeed': 'renderer.concentric.rotationSpeed',
    'concentric_strokeWidth': 'renderer.concentric.strokeWidth',
    'concentric_fillMode': 'renderer.concentric.fillMode',
    'concentric_sides': 'renderer.concentric.sides',
    'concentric_gradientColors': 'renderer.concentric.gradientColors',
  };

  // Check in order: common first, then renderer-specific
  if (commonProperties[propertyId]) {
    return commonProperties[propertyId];
  }
  
  if (webglProperties[propertyId]) {
    return webglProperties[propertyId];
  }
  
  if (concentricProperties[propertyId]) {
    return concentricProperties[propertyId];
  }
  
  // If propertyId is already a hierarchical path, return as-is
  if (propertyId.includes('.')) {
    return propertyId;
  }

  // Fallback: assume it's a renderer-specific property for active renderer
  return `renderer.${activeRenderer}.${propertyId}`;
};

/**
 * Finds all property paths that have different values between two ControlSettings objects
 */
export const findChangedPaths = (
  oldSettings: ControlSettings, 
  newSettings: ControlSettings
): string[] => {
  const changedPaths: string[] = [];
  
  const compareObjects = (obj1: unknown, obj2: unknown, currentPath: string = '') => {
    // Convert to objects with string keys for comparison
    const o1 = obj1 as Record<string, unknown>;
    const o2 = obj2 as Record<string, unknown>;
    
    // Get all unique keys from both objects
    const allKeys = new Set([...Object.keys(o1 || {}), ...Object.keys(o2 || {})]);
    
    for (const key of allKeys) {
      const path = currentPath ? `${currentPath}.${key}` : key;
      const val1 = o1?.[key];
      const val2 = o2?.[key];
      
      // If one is undefined and the other isn't, it's a change
      if ((val1 === undefined) !== (val2 === undefined)) {
        changedPaths.push(path);
        continue;
      }
      
      // If both are undefined, skip
      if (val1 === undefined && val2 === undefined) {
        continue;
      }
      
      // If both are arrays, compare them
      if (Array.isArray(val1) && Array.isArray(val2)) {
        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          changedPaths.push(path);
        }
        continue;
      }
      
      // If both are objects (but not arrays), recurse
      if (typeof val1 === 'object' && typeof val2 === 'object' && 
          val1 !== null && val2 !== null &&
          !Array.isArray(val1) && !Array.isArray(val2)) {
        compareObjects(val1, val2, path);
        continue;
      }
      
      // Otherwise, do direct comparison
      if (val1 !== val2) {
        changedPaths.push(path);
      }
    }
  };
  
  compareObjects(oldSettings as unknown, newSettings as unknown);
  return changedPaths;
};

/**
 * Gets a nested property value using a dot-notation path
 * e.g., "common.animationSpeed" or "renderer.webgl.scaleSize"
 */
export const getNestedProperty = (settings: ControlSettings | undefined, propertyPath: string): unknown => {
  if (!settings) return undefined;
  
  return propertyPath.split('.').reduce<unknown>((obj, key) => {
    if (obj && typeof obj === 'object' && obj !== null && key in obj) {
      return (obj as Record<string, unknown>)[key];
    }
    return undefined;
  }, settings);
};

/**
 * Sets a nested property value using a dot-notation path
 * e.g., "common.animationSpeed" or "renderer.webgl.scaleSize"
 */
export const setNestedProperty = (
  settings: ControlSettings, 
  propertyPath: string, 
  value: unknown
): ControlSettings => {
  const keys = propertyPath.split('.');
  const lastKey = keys.pop()!;
  
  // Create a deep copy
  const newSettings = JSON.parse(JSON.stringify(settings));
  
  // Navigate to the parent object
  let current = newSettings;
  for (const key of keys) {
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }
  
  // Set the value
  current[lastKey] = value;
  
  return newSettings;
};

/**
 * Creates default settings for a specific renderer
 */
export const createDefaultRendererSettings = (rendererId: string): WebGLSettings | ConcentricSettings | DvdScreensaverSettings | Record<string, unknown> => {
  switch (rendererId) {
    case 'webgl':
      return {
        scaleSize: 150,
        scaleSpacing: 0,
        verticalOverlap: 0,
        horizontalOffset: 0.5,
        shapeMorph: 0,
        textureRotation: 0,
        textureRotationSpeed: 0,
        scaleBorderColor: '#000000',
        scaleBorderWidth: 0,
        gradientColors: [],
        centerOffset: { x: 0, y: 0 },
        scaleRange: { min: 1.0, max: 1.0 }
      } as WebGLSettings;
      
    case 'concentric':
      return {
        repetitionSpeed: 0.5,
        growthSpeed: 0.5,
        initialSize: 10,
        rotationSpeed: 0,
        strokeWidth: 2,
        fillMode: 'stroke',
        sides: 6,
        gradientColors: [
          { id: "c-color-1", color: "#00ffff", hardStop: false },
          { id: "c-color-2", color: "#ff00ff", hardStop: false }
        ],
      } as ConcentricSettings;
    case 'dvd-screensaver':
      return {
        assets: [
          {
            id: 'asset-1',
            type: 'text',
            text: 'DVD',
            svg: '',
            delayMs: 0,
            speed: 120,
            rotationSpeed: 20,
            rotationDirection: 1,
            direction: 45,
            scale: 1,
            opacity: 1
          }
        ],
        background: {
          color: '#0b0b0b'
        },
        glitch: {
          chromaticAberration: {
            enabled: false,
            amount: 2
          },
          horizontalBands: {
            enabled: false,
            intensity: 0.5,
            bandCount: 6,
            speed: 0.6
          },
          channelFlicker: {
            enabled: false,
            probability: 0.1,
            channel: 'r'
          }
        },
        globalSpeed: 1,
        globalRotationSpeed: 1
      } as DvdScreensaverSettings;
      
    default:
      return {} as Record<string, unknown>;
  }
};

/**
 * Creates initial settings structure with defaults for all renderers
 */
export const createInitialSettings = (): ControlSettings => {
  const common: CommonSettings = {
    animationSpeed: 1,
    animationDirection: 90,
    backgroundGradientColors: [{ id: 'bg-color-1', color: '#1f2937', hardStop: false }],
  };

  const renderer: RendererSettings = {
    webgl: createDefaultRendererSettings('webgl'),
    concentric: createDefaultRendererSettings('concentric'),
    'dvd-screensaver': createDefaultRendererSettings('dvd-screensaver'),
  };

  return { common, renderer };
};

/**
 * Ensures that a renderer has default settings if they don't exist
 */
export const ensureRendererSettings = (
  settings: ControlSettings, 
  rendererId: string
): ControlSettings => {
  if (!settings.renderer[rendererId]) {
    return setRendererSettings(settings, rendererId, createDefaultRendererSettings(rendererId));
  }
  
  return settings;
};

// Functions moved to the compatibility section below

// ========== COMPATIBILITY ADAPTERS FOR EXISTING RENDERERS ==========

/**
 * WebGL Renderer Compatibility Adapter
 * Provides backward compatibility interface for the WebGL renderer
 */
export const getWebGLCompatibleSettings = (settings: ControlSettings) => {
  const webglSettings = getRendererSettings<WebGLSettings>(settings, 'webgl') || createDefaultRendererSettings('webgl') as WebGLSettings;
  const commonSettings = settings.common || {
    animationSpeed: 1,
    animationDirection: 90,
    backgroundGradientColors: [],
  };
  
  return {
    // WebGL specific settings
    scaleSize: webglSettings.scaleSize,
    scaleSpacing: webglSettings.scaleSpacing,
    verticalOverlap: webglSettings.verticalOverlap,
    horizontalOffset: webglSettings.horizontalOffset,
    shapeMorph: webglSettings.shapeMorph,
    textureRotation: webglSettings.textureRotation,
    textureRotationSpeed: webglSettings.textureRotationSpeed,
    scaleBorderColor: webglSettings.scaleBorderColor,
    scaleBorderWidth: webglSettings.scaleBorderWidth,
    gradientColors: webglSettings.gradientColors,
    centerOffset: webglSettings.centerOffset,
    scaleRange: webglSettings.scaleRange,
    
    // Common settings
    animationSpeed: commonSettings.animationSpeed,
    animationDirection: commonSettings.animationDirection,
    backgroundGradientColors: commonSettings.backgroundGradientColors,
  };
};

/**
 * Concentric Renderer Compatibility Adapter
 * Provides backward compatibility interface for the Concentric renderer
 */
export const getConcentricCompatibleSettings = (settings: ControlSettings) => {
  const concentricSettings = getRendererSettings<ConcentricSettings>(settings, 'concentric') || createDefaultRendererSettings('concentric') as ConcentricSettings;
  const commonSettings = settings.common || {
    animationSpeed: 1,
    animationDirection: 90,
    backgroundGradientColors: [],
  };
  
  return {
    // Concentric specific settings (with legacy naming)
    concentric_repetitionSpeed: concentricSettings.repetitionSpeed,
    concentric_growthSpeed: concentricSettings.growthSpeed,
    concentric_initialSize: concentricSettings.initialSize,
    concentric_rotationSpeed: concentricSettings.rotationSpeed,
    concentric_strokeWidth: concentricSettings.strokeWidth,
    concentric_fillMode: concentricSettings.fillMode,
    concentric_sides: concentricSettings.sides,
    concentric_gradientColors: concentricSettings.gradientColors,
    
    // Common settings
    animationSpeed: commonSettings.animationSpeed,
    animationDirection: commonSettings.animationDirection,
    backgroundGradientColors: commonSettings.backgroundGradientColors,
  };
};

/**
 * Direct function for getting compatible settings without hooks
 */
export const getCompatibleSettings = (settings: ControlSettings, rendererId: string) => {
  switch (rendererId) {
    case 'webgl':
      return getWebGLCompatibleSettings(settings);
    case 'concentric':
      return getConcentricCompatibleSettings(settings);
    default:
      // For unknown renderers, return legacy format as fallback
      return toLegacySettings(settings);
  }
};

/**
 * Hook version for React components - WebGL
 */
export const useWebGLCompatibleSettings = (settings: ControlSettings) => {
  return React.useMemo(() => getWebGLCompatibleSettings(settings), [settings]);
};

/**
 * Hook version for React components - Concentric
 */
export const useConcentricCompatibleSettings = (settings: ControlSettings) => {
  return React.useMemo(() => getConcentricCompatibleSettings(settings), [settings]);
};