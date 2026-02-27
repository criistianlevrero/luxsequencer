import React from 'react';
// FIX: Import shared types from the main `types.ts` file.
import type { ControlSettings as _ControlSettings, AccordionItem, RendererValidationSpec, DeclarativeControlSchema, RendererControlSpec } from '../../types';

// Updated RendererDefinition
export interface RendererDefinition {
  id: string;
  name: string;
  component: React.FC<{ className?: string }>;
  controlSchema: AccordionItem[] | (() => AccordionItem[]);
  
  // Phase 1.4: Declarative Control Schema Support
  declarativeSchema?: DeclarativeControlSchema | RendererControlSpec;
  
  // Phase 1.2: Validation and Error Handling
  validation?: RendererValidationSpec;
  fallbackRenderer?: string; // ID of renderer to use if this one fails
  version?: string; // Semantic version for compatibility checking
  
  // Error handling hooks
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRecover?: () => void;
}