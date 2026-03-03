import React from 'react';
import type { AccordionItem, RendererValidationSpec, DeclarativeControlSchema, RendererControlSpec } from '../../types';
import type { RendererWorkerCapability } from '../../graphics-pipeline';

export interface RendererWorkerRequirements {
  requiredCapabilities: RendererWorkerCapability[];
  protocolVersion?: string;
  handshakeTimeoutMs?: number;
  stallTimeoutMs?: number;
}

export interface RendererPackageManifest {
  schemaVersion: '1.0.0';
  publisherId: string;
  repositoryId: string;
  packageId: string;
  packageVersion: string;
  tool: {
    kind: 'renderer' | 'tool';
    id: string;
    versionMajor: number;
  };
  source: 'builtin' | 'community';
  sdk: {
    minWorkerProtocolVersion: string;
  };
  security?: {
    workerEntrySha256?: string;
    workerEntrySignature?: {
      algorithm: 'ECDSA_P256_SHA256';
      publicKeyId: string;
      valueBase64: string;
    };
  };
}

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