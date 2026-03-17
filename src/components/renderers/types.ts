import React from 'react';
import type { AccordionItem, RendererValidationSpec, DeclarativeControlSchema, RendererControlSpec } from '../../types';
import type { RendererWorkerCapability } from '../../graphics-pipeline';
import type { PackageManifestV1 } from '@luxsequencer/contracts/marketplace';

export interface RendererWorkerRequirements {
  requiredCapabilities: RendererWorkerCapability[];
  protocolVersion?: string;
  handshakeTimeoutMs?: number;
  stallTimeoutMs?: number;
}

export type RendererPackageManifest = PackageManifestV1;

export interface RendererDefinition {
  id: string;
  name: string;
  component: React.FC<{ className?: string }>;
  workerEntry: string | URL;
  workerRequirements?: RendererWorkerRequirements;
  packageManifest?: RendererPackageManifest;
  controlSchema: AccordionItem[] | (() => AccordionItem[]);

  declarativeSchema?: DeclarativeControlSchema | RendererControlSpec;

  validation?: RendererValidationSpec;
  fallbackRenderer?: string; // ID of renderer to use if this one fails
  version?: string; // Semantic version for compatibility checking

  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRecover?: () => void;
}