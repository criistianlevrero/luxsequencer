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

export interface ControlSettings {
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

export interface Pattern {
    id: string;
    name: string;
    settings: ControlSettings;
    midiNote?: number;
}

// --- New types for Property Sequencer ---
export type InterpolationType = 'linear' | 'none';

export interface Keyframe {
  step: number;
  value: number;
  interpolation: InterpolationType;
}

export interface PropertyTrack {
  id: string;
  property: keyof ControlSettings;
  keyframes: Keyframe[];
}

// --- Control Schema Types ---
export interface SliderControlConfig {
  type: 'slider';
  id: keyof ControlSettings;
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

export interface SequencerSettings {
  steps: (string | null)[];
  bpm: number;
  numSteps: number;
  propertyTracks: PropertyTrack[]; // Added for property sequencer
}

export interface Sequence {
    id:string;
    name: string;
    interpolationSpeed: number;
    animateOnlyChanges: boolean;
    sequencer: SequencerSettings;
    patterns: Pattern[];
}

export interface GlobalSettings {
    midiMappings: { [key: string]: number };
    isSequencerPlaying: boolean;
    renderer: string;
}

export interface Project {
    globalSettings: GlobalSettings;
    sequences: Sequence[];
}