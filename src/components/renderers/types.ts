import React from 'react';
// FIX: Import shared types from the main `types.ts` file.
import type { ControlSettings, ControlSection } from '../../types';

// Updated RendererDefinition
export interface RendererDefinition {
  id: string;
  name: string;
  component: React.FC<{ className?: string }>;
  controlSchema: ControlSection[] | (() => ControlSection[]);
}