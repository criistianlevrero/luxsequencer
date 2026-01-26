import type React from 'react';

export interface GradientColor {
  id: string;
  color: string;
  hardStop: boolean;
}

export interface MidiLogEntry {
  data: number[];
  timeStamp: number;
}

// --- Flexible Renderer Settings System ---

// Common settings shared across all renderers
export interface CommonSettings {
  // Global animation controls
  animationSpeed: number;
  animationDirection: number;
  
  // Global color settings
  backgroundGradientColors: GradientColor[];
}

// Renderer-specific settings grouped by renderer ID
export interface RendererSettings {
  [rendererId: string]: any;
}

// WebGL renderer specific settings
export interface WebGLSettings {
  scaleSize: number;
  scaleSpacing: number;
  verticalOverlap: number;
  horizontalOffset: number;
  shapeMorph: number;
  textureRotation: number;
  textureRotationSpeed: number;
  scaleBorderColor: string;
  scaleBorderWidth: number;
  gradientColors: GradientColor[];
}

// Concentric renderer specific settings
export interface ConcentricSettings {
  repetitionSpeed: number;
  growthSpeed: number;
  initialSize: number;
  gradientColors: GradientColor[];
}

// New flexible control settings structure
export interface ControlSettings {
  common: CommonSettings;
  renderer: RendererSettings;
}

// --- Backward Compatibility Types ---
// Legacy flat structure for migration period
export interface LegacyControlSettings {
  // Scale renderer settings
  scaleSize: number;
  scaleSpacing: number;
  verticalOverlap: number;
  horizontalOffset: number;
  shapeMorph: number;
  animationSpeed: number;
  animationDirection: number;
  textureRotation: number;
  textureRotationSpeed: number;
  scaleBorderColor: string;
  scaleBorderWidth: number;
  gradientColors: GradientColor[];
  backgroundGradientColors: GradientColor[];
  
  // Concentric renderer settings
  concentric_repetitionSpeed?: number;
  concentric_growthSpeed?: number;
  concentric_initialSize?: number;
  concentric_gradientColors?: GradientColor[];
}

// Union type for handling both new and legacy settings during migration
export type AnyControlSettings = ControlSettings | LegacyControlSettings;

// Type predicate to check if settings use new structure
export const isNewControlSettings = (settings: AnyControlSettings): settings is ControlSettings => {
  return typeof settings === 'object' && settings !== null && 'common' in settings && 'renderer' in settings;
};

// Type predicate to check if settings use legacy structure
export const isLegacyControlSettings = (settings: AnyControlSettings): settings is LegacyControlSettings => {
  return !isNewControlSettings(settings);
};

export interface Pattern {
    id: string;
    name: string;
    settings: AnyControlSettings;
    midiNote?: number;
}

// --- Animation System Types ---
export enum ControlSource {
  PatternSequencer = 0,  // Lowest priority
  PropertySequencer = 1,
  UI = 2,
  MIDI = 3               // Highest priority
}

export type InterpolationType = 'linear'; // Prepared for future expansion

export interface AnimationRequest {
  property: string;  // More flexible property path (e.g., "common.animationSpeed" or "renderer.webgl.scaleSize")
  from: any;
  to: any;
  steps: number;              // 0 = immediate, >0 = animated
  source: ControlSource;
  interpolationType: InterpolationType;
}

export interface ActiveAnimation {
  request: AnimationRequest;
  currentFrame: number;
  totalFrames: number;
  startValue: any;
}

// --- New types for Property Sequencer ---
export interface Keyframe {
  step: number;
  value: number;
  interpolation: InterpolationType;
}

export interface PropertyTrack {
  id: string;
  property: string;  // Flexible property path (e.g., "common.animationSpeed")
  keyframes: Keyframe[];
}

// --- Control Schema Types ---
export interface SliderControlConfig {
  type: 'slider';
  id: string;  // Flexible property path (e.g., "common.animationSpeed")
  label: string;
  min: number;
  max: number;
  step: number;
  formatter: (value: number) => string;
}

export interface CustomControlConfig {
  type: 'custom';
  id: string; // Unique ID for the control
  component: React.FC;
}

export type ControlConfig = SliderControlConfig | CustomControlConfig;

export interface ControlSection {
  title: string;
  defaultOpen?: boolean;
  controls: ControlConfig[];
}

export interface SeparatorSection {
  type: 'separator';
  id?: string;
}

export type AccordionItem = ControlSection | SeparatorSection;

// --- Validation System Types ---

export interface ValidationError {
  property: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
  suggestion?: string;
}

export interface ValidationWarning {
  property: string;
  message: string;
  code: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationRule {
  type: 'range' | 'required' | 'custom' | 'dependency';
  message: string;
  code: string;
  validator: (value: any, settings: ControlSettings) => boolean;
  suggestion?: string;
}

export interface ValidationConfig {
  rules: Record<string, ValidationRule[]>;
  strict: boolean; // If true, warnings are treated as errors
  skipMissing: boolean; // If true, missing properties don't trigger required errors
}

export interface RendererValidationSpec {
  settings: ValidationConfig;
  runtime: RuntimeValidationRule[];
}

export interface RuntimeValidationRule {
  type: 'performance' | 'compatibility' | 'memory';
  check: () => boolean | Promise<boolean>;
  message: string;
  suggestion: string;
}

export interface SequencerSettings {
  steps: (string | null)[];
  bpm: number;
  numSteps: number;
  propertyTracks: PropertyTrack[]; // Added for property sequencer
}

export interface Sequence {
    id: string;
    name: string;
    interpolationSpeed: number; // In steps (0-8), supports fractions. 0 = immediate. Will be converted to frames based on BPM
    // Current active patterns (for current renderer)
    activePatterns: Pattern[];
    // Cache of patterns per renderer
    rendererPatterns: { [rendererId: string]: Pattern[] };
    // Sequencer states per renderer
    rendererSequencerStates: { [rendererId: string]: SequencerSettings };
    // Current active renderer
    activeRenderer: string;
}

export interface GlobalSettings {
    midiMappings: { [key: string]: number };
    isSequencerPlaying: boolean;
    renderer: string;
}

export interface Project {
    version: string; // Semantic versioning (e.g., "1.0.0")
    globalSettings: GlobalSettings;
    sequences: Sequence[];
}

// Export declarative controls types  
export * from './types/declarativeControls';