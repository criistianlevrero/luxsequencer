import React, { useEffect, useRef, useState } from 'react';
import {
  RENDERER_WORKER_PROTOCOL_VERSION,
  RendererWorkerManager,
  WebGLCompositor,
  type CompositorMetrics,
  type PipelineSource,
  type RendererWorkerHealthSnapshot,
} from '../../../graphics-pipeline';
import { useTextureStore } from '../../../store';
import { env } from '../../../config';
import {
  createDefaultRendererSettings,
  getConcentricCompatibleSettings,
  getNestedProperty,
  getScalesCompatibleSettings,
} from '../../../utils/settingsMigration';
import type { DvdScreensaverSettings } from '../../../types';
import type { RendererPackageManifest, RendererWorkerRequirements } from '../types';

interface GraphicsPipelineHostProps {
  className?: string;
  rendererId: string;
  workerEntry: string | URL;
  workerRequirements?: RendererWorkerRequirements;
  packageManifest?: RendererPackageManifest;
}

interface RuntimeRenderer {
  rendererId: string;
  workerEntry: string | URL;
  source: PipelineSource;
  manager: RendererWorkerManager;
  stallTimeoutMs: number;
}

const supportsGraphicsPipeline = (): boolean => {
  return (
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    typeof ResizeObserver !== 'undefined'
  );
};

const TRANSITION_DURATION_MS = 800;
const WORKER_STALL_TIMEOUT_MS = 3000;
const HEALTH_CHECK_INTERVAL_MS = 1000;
const DEBUG_METRICS_LOG_INTERVAL_MS = 5000;

const parseSemver = (value: string): [number, number, number] => {
  const match = value.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return [0, 0, 0];
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

const isSemverLess = (a: string, b: string): boolean => {
  const [aMajor, aMinor, aPatch] = parseSemver(a);
  const [bMajor, bMinor, bPatch] = parseSemver(b);

  if (aMajor !== bMajor) return aMajor < bMajor;
  if (aMinor !== bMinor) return aMinor < bMinor;
  return aPatch < bPatch;
};

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/i;
const BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

const COMMUNITY_TRUSTED_PUBLIC_KEYS: Record<string, string> = {
  // Placeholder trust store. Integrators should provide production keys here.
};

const workerEntryToUrl = (workerEntry: string | URL): string => {
  if (typeof workerEntry === 'string') {
    return workerEntry;
  }

  return workerEntry.toString();
};

const toHexString = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const base64ToUint8Array = (value: string): Uint8Array => {
  const normalized = value.replace(/\s+/g, '');
  const binary = atob(normalized);
  const output = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index);
  }

  return output;
};

const calculateSha256Hex = async (input: ArrayBuffer): Promise<string> => {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('SubtleCrypto no disponible para verificar integridad del renderer');
  }

  const digest = await crypto.subtle.digest('SHA-256', input);
  return toHexString(digest);
};

const validatePackageManifestPolicy = (
  rendererId: string,
  manifest?: RendererPackageManifest,
): string | null => {
  if (!manifest) {
    return null;
  }

  if (manifest.schemaVersion !== '1.0.0') {
    return `Manifest schema no soportado para ${rendererId}: ${manifest.schemaVersion}`;
  }

  if (!manifest.packageName || !manifest.packageVersion) {
    return `Manifest inválido para ${rendererId}: packageName/packageVersion requeridos`;
  }

  if (manifest.source === 'community') {
    const checksum = manifest.security?.workerEntrySha256;
    if (!checksum) {
      return `Manifest inválido para ${rendererId}: workerEntrySha256 requerido en paquetes community`;
    }

    if (!SHA256_HEX_REGEX.test(checksum)) {
      return `Manifest inválido para ${rendererId}: workerEntrySha256 debe ser SHA-256 hex (64 chars)`;
    }

    const signature = manifest.security?.workerEntrySignature;
    if (!signature) {
      return `Manifest inválido para ${rendererId}: workerEntrySignature requerido en paquetes community`;
    }

    if (signature.algorithm !== 'ECDSA_P256_SHA256') {
      return `Manifest inválido para ${rendererId}: algoritmo de firma no soportado (${signature.algorithm})`;
    }

    if (!signature.publicKeyId) {
      return `Manifest inválido para ${rendererId}: publicKeyId requerido para firma`;
    }

    if (!signature.valueBase64 || !BASE64_REGEX.test(signature.valueBase64)) {
      return `Manifest inválido para ${rendererId}: valueBase64 de firma inválido`;
    }

    if (!COMMUNITY_TRUSTED_PUBLIC_KEYS[signature.publicKeyId]) {
      return `Manifest inválido para ${rendererId}: publicKeyId no confiable (${signature.publicKeyId})`;
    }
  }

  return null;
};

const validateWorkerEntryChecksum = async (
  rendererId: string,
  workerContent: ArrayBuffer,
  manifest?: RendererPackageManifest,
): Promise<string | null> => {
  if (!manifest || manifest.source !== 'community') {
    return null;
  }

  const expectedChecksum = manifest.security?.workerEntrySha256;
  if (!expectedChecksum) {
    return `Manifest inválido para ${rendererId}: workerEntrySha256 requerido en paquetes community`;
  }

  let actualChecksum: string;
  try {
    actualChecksum = await calculateSha256Hex(workerContent);
  } catch (error) {
    return error instanceof Error
      ? error.message
      : `No se pudo calcular checksum SHA-256 para ${rendererId}`;
  }

  if (actualChecksum.toLowerCase() !== expectedChecksum.toLowerCase()) {
    return `Checksum inválido para ${rendererId}: esperado=${expectedChecksum.toLowerCase()}, actual=${actualChecksum.toLowerCase()}`;
  }

  return null;
};

const validateWorkerEntrySignature = async (
  rendererId: string,
  workerContent: ArrayBuffer,
  manifest?: RendererPackageManifest,
): Promise<string | null> => {
  if (!manifest || manifest.source !== 'community') {
    return null;
  }

  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return 'SubtleCrypto no disponible para verificar firma del renderer';
  }

  const signature = manifest.security?.workerEntrySignature;
  if (!signature) {
    return `Manifest inválido para ${rendererId}: workerEntrySignature requerido en paquetes community`;
  }

  if (signature.algorithm !== 'ECDSA_P256_SHA256') {
    return `Algoritmo de firma no soportado para ${rendererId}: ${signature.algorithm}`;
  }

  const trustedPublicKey = COMMUNITY_TRUSTED_PUBLIC_KEYS[signature.publicKeyId];
  if (!trustedPublicKey) {
    return `No existe clave confiable para ${rendererId}: ${signature.publicKeyId}`;
  }

  let signatureBytes: Uint8Array;
  let publicKeyBytes: Uint8Array;
  try {
    signatureBytes = base64ToUint8Array(signature.valueBase64);
    publicKeyBytes = base64ToUint8Array(trustedPublicKey);
  } catch {
    return `Codificación base64 inválida en firma o clave pública para ${rendererId}`;
  }

  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBytes.buffer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['verify'],
    );
  } catch {
    return `No se pudo importar clave pública para ${rendererId}`;
  }

  let verified = false;
  try {
    verified = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      cryptoKey,
      signatureBytes,
      workerContent,
    );
  } catch {
    return `Fallo al verificar firma criptográfica de ${rendererId}`;
  }

  if (!verified) {
    return `Firma inválida para ${rendererId}: la firma no coincide con workerEntry`;
  }

  return null;
};

const downloadWorkerEntry = async (
  rendererId: string,
  workerEntry: string | URL,
): Promise<{ content: ArrayBuffer } | { error: string }> => {
  const workerUrl = workerEntryToUrl(workerEntry);

  let response: Response;
  try {
    response = await fetch(workerUrl, { cache: 'no-store' });
  } catch {
    return {
      error: `No se pudo descargar workerEntry para validación de seguridad (${rendererId})`,
    };
  }

  if (!response.ok) {
    return {
      error: `workerEntry no disponible para validación de seguridad (${rendererId}): HTTP ${response.status}`,
    };
  }

  try {
    const content = await response.arrayBuffer();
    return { content };
  } catch {
    return {
      error: `No se pudo leer workerEntry para validación de seguridad (${rendererId})`,
    };
  }
};

const applyRendererUniforms = (
  rendererId: string,
  manager: RendererWorkerManager,
  state: ReturnType<typeof useTextureStore.getState>,
): void => {
  if (rendererId !== 'webgl') {
    if (rendererId === 'concentric') {
      const concentricSettings = getConcentricCompatibleSettings(state.currentSettings);

      manager.updateUniform('concentricSettings', {
        repetitionSpeed: concentricSettings.concentric_repetitionSpeed,
        growthSpeed: concentricSettings.concentric_growthSpeed,
        initialSize: concentricSettings.concentric_initialSize,
        rotationSpeed: concentricSettings.concentric_rotationSpeed,
        strokeWidth: concentricSettings.concentric_strokeWidth,
        fillMode: concentricSettings.concentric_fillMode,
        sides: concentricSettings.concentric_sides,
        gradientColors: concentricSettings.concentric_gradientColors,
        backgroundGradientColors: concentricSettings.backgroundGradientColors,
        animationSpeed: concentricSettings.animationSpeed,
      });
    }

    if (rendererId === 'dvd-screensaver') {
      const dvdSettings =
        (getNestedProperty(state.currentSettings, 'renderer.dvd-screensaver') as DvdScreensaverSettings | undefined) ??
        (createDefaultRendererSettings('dvd-screensaver') as DvdScreensaverSettings);

      manager.updateUniform('dvdSettings', {
        assets: dvdSettings.assets,
        background: dvdSettings.background,
        globalSpeed: dvdSettings.globalSpeed,
        globalRotationSpeed: dvdSettings.globalRotationSpeed,
      });
    }

    return;
  }

  const settings = getScalesCompatibleSettings(state.currentSettings);

  manager.updateUniform('animationSpeed', settings.animationSpeed);
  manager.updateUniform('animationDirection', settings.animationDirection);
  manager.updateUniform('scaleSize', settings.scaleSize);
  manager.updateUniform('scaleSpacing', settings.scaleSpacing);
  manager.updateUniform('verticalOverlap', settings.verticalOverlap);
  manager.updateUniform('horizontalOffset', settings.horizontalOffset);
  manager.updateUniform('shapeMorph', settings.shapeMorph);
  manager.updateUniform('textureRotation', state.textureRotation ?? settings.textureRotation);
  manager.updateUniform('scaleBorderWidth', settings.scaleBorderWidth);
  manager.updateUniform('scaleBorderColor', settings.scaleBorderColor);
  manager.updateUniform('gradientColors', settings.gradientColors);
  manager.updateUniform('previousGradientColors', state.previousGradient ?? []);
  manager.updateUniform('backgroundGradientColors', settings.backgroundGradientColors);
  manager.updateUniform('previousBackgroundGradientColors', state.previousBackgroundGradient ?? []);
  manager.updateUniform('transitionProgress', state.transitionProgress);
};

const GraphicsPipelineHost: React.FC<GraphicsPipelineHostProps> = ({
  className,
  rendererId,
  workerEntry,
  workerRequirements,
  packageManifest,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compositorRef = useRef<WebGLCompositor | null>(null);
  const activeRendererRef = useRef<RuntimeRenderer | null>(null);
  const nextRendererRef = useRef<RuntimeRenderer | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const healthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debugMetricsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubscribeStoreRef = useRef<(() => void) | null>(null);
  const mixFactorRef = useRef(0);
  const transitionRef = useRef<{
    startedAt: number;
    fromMix: number;
    toMix: number;
    durationMs: number;
  } | null>(null);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState<string>('');
  const [isRendererValidated, setIsRendererValidated] = useState(false);

  const handleWorkerReady = (snapshot: RendererWorkerHealthSnapshot) => {
    if (!env.debugMode) {
      return;
    }

    const handshake = snapshot.handshakeDurationMs === null
      ? 'n/a'
      : `${snapshot.handshakeDurationMs.toFixed(1)}ms`;
    console.debug(
      `[graphics-pipeline] worker ready: ${snapshot.rendererId} | handshake=${handshake} | capabilities=${snapshot.capabilities.join(', ')}`,
    );
  };

  const checkRendererHealth = (runtimeRenderer: RuntimeRenderer | null): string | null => {
    if (!runtimeRenderer) {
      return null;
    }

    const snapshot = runtimeRenderer.manager.getHealthSnapshot();
    if (!snapshot.isReady || snapshot.lastFrameAtMs === null) {
      return null;
    }

    const elapsedSinceFrame = performance.now() - snapshot.lastFrameAtMs;
    if (elapsedSinceFrame > runtimeRenderer.stallTimeoutMs) {
      return `Worker detenido (${snapshot.rendererId}) sin frames por ${Math.round(elapsedSinceFrame)}ms`;
    }

    return null;
  };

  const logDebugMetrics = (compositor: WebGLCompositor) => {
    if (!env.debugMode) {
      return;
    }

    const metrics: CompositorMetrics = compositor.getMetrics();
    const activeSnapshot = activeRendererRef.current?.manager.getHealthSnapshot();
    const nextSnapshot = nextRendererRef.current?.manager.getHealthSnapshot();

    console.debug('[graphics-pipeline] metrics', {
      compositor: metrics,
      active: activeSnapshot,
      next: nextSnapshot,
    });
  };

  const disposeRuntimeRenderer = (runtimeRenderer: RuntimeRenderer | null) => {
    if (!runtimeRenderer) {
      return;
    }

    runtimeRenderer.manager.dispose();
  };

  const sourceMixValue = (source: PipelineSource): number => {
    return source === 'A' ? 0 : 1;
  };

  const createRuntimeRenderer = (
    nextRendererId: string,
    nextWorkerEntry: string | URL,
    source: PipelineSource,
    width: number,
    height: number,
  ): RuntimeRenderer | null => {
    const compositor = compositorRef.current;
    if (!compositor) {
      return null;
    }

    const manager = new RendererWorkerManager({
      rendererId: nextRendererId,
      workerEntry: nextWorkerEntry,
      width,
      height,
      expectedProtocolVersion: workerRequirements?.protocolVersion,
      handshakeTimeoutMs: workerRequirements?.handshakeTimeoutMs,
      requiredCapabilities: workerRequirements?.requiredCapabilities ?? ['offscreen-canvas', 'uniform-updates'],
      onFrame: (bitmap) => compositor.setSourceFrame(source, bitmap),
      onReady: handleWorkerReady,
      onError: (error) => {
        setUnavailableReason(error.message);
        setIsUnavailable(true);
      },
    });

    const started = manager.start();
    if (!started) {
      manager.dispose();
      return null;
    }

    return {
      rendererId: nextRendererId,
      workerEntry: nextWorkerEntry,
      source,
      manager,
      stallTimeoutMs: workerRequirements?.stallTimeoutMs ?? WORKER_STALL_TIMEOUT_MS,
    };
  };

  const syncUniforms = (state: ReturnType<typeof useTextureStore.getState>) => {
    const active = activeRendererRef.current;
    const next = nextRendererRef.current;

    if (active) {
      applyRendererUniforms(active.rendererId, active.manager, state);
    }

    if (next) {
      applyRendererUniforms(next.rendererId, next.manager, state);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !supportsGraphicsPipeline()) {
      setUnavailableReason('Graphics pipeline no está disponible en este navegador/dispositivo');
      setIsUnavailable(true);
      return;
    }

    setUnavailableReason('');
    setIsUnavailable(false);

    const compositor = new WebGLCompositor(canvas);
    const initialized = compositor.init();

    if (!initialized) {
      setUnavailableReason('No se pudo inicializar el compositor WebGL2');
      setIsUnavailable(true);
      return;
    }

    compositorRef.current = compositor;

    const renderLoop = () => {
      const transition = transitionRef.current;

      if (transition) {
        const elapsed = performance.now() - transition.startedAt;
        const progress = Math.max(0, Math.min(1, elapsed / transition.durationMs));
        mixFactorRef.current = transition.fromMix + (transition.toMix - transition.fromMix) * progress;

        if (progress >= 1) {
          const previousActive = activeRendererRef.current;
          const nextActive = nextRendererRef.current;

          disposeRuntimeRenderer(previousActive);
          activeRendererRef.current = nextActive;
          nextRendererRef.current = null;
          transitionRef.current = null;
          mixFactorRef.current = transition.toMix;
        }
      }

      compositor.render(mixFactorRef.current);
      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    rafIdRef.current = requestAnimationFrame(renderLoop);

    resizeObserverRef.current = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = entry?.contentRect.width ?? canvas.clientWidth;
      const height = entry?.contentRect.height ?? canvas.clientHeight;

      compositor.resize(width, height);
      activeRendererRef.current?.manager.resize(width, height);
      nextRendererRef.current?.manager.resize(width, height);
    });

    resizeObserverRef.current.observe(canvas);

    syncUniforms(useTextureStore.getState());
    unsubscribeStoreRef.current = useTextureStore.subscribe((state) => {
      syncUniforms(state);
    });

    healthIntervalRef.current = setInterval(() => {
      const activeError = checkRendererHealth(activeRendererRef.current);
      const nextError = checkRendererHealth(nextRendererRef.current);
      const error = activeError ?? nextError;

      if (error) {
        setUnavailableReason(error);
        setIsUnavailable(true);
      }
    }, HEALTH_CHECK_INTERVAL_MS);

    if (env.debugMode) {
      debugMetricsIntervalRef.current = setInterval(() => {
        logDebugMetrics(compositor);
      }, DEBUG_METRICS_LOG_INTERVAL_MS);
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      unsubscribeStoreRef.current?.();
      unsubscribeStoreRef.current = null;

      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;

      if (healthIntervalRef.current) {
        clearInterval(healthIntervalRef.current);
      }
      healthIntervalRef.current = null;

      if (debugMetricsIntervalRef.current) {
        clearInterval(debugMetricsIntervalRef.current);
      }
      debugMetricsIntervalRef.current = null;

      disposeRuntimeRenderer(nextRendererRef.current);
      disposeRuntimeRenderer(activeRendererRef.current);

      nextRendererRef.current = null;
      activeRendererRef.current = null;
      transitionRef.current = null;

      compositor.dispose();
      compositorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!supportsGraphicsPipeline()) {
      setIsRendererValidated(false);
      return;
    }

    let cancelled = false;

    const runValidation = async () => {
      setIsRendererValidated(false);

      const manifestPolicyError = validatePackageManifestPolicy(rendererId, packageManifest);
      if (manifestPolicyError) {
        if (!cancelled) {
          setUnavailableReason(manifestPolicyError);
          setIsUnavailable(true);
          setIsRendererValidated(false);
        }
        return;
      }

      const expectedProtocolVersion = workerRequirements?.protocolVersion ?? RENDERER_WORKER_PROTOCOL_VERSION;
      const minSdkProtocol = packageManifest?.sdk.minWorkerProtocolVersion;

      if (minSdkProtocol && isSemverLess(expectedProtocolVersion, minSdkProtocol)) {
        if (!cancelled) {
          setUnavailableReason(
            `SDK/protocolo incompatible para ${packageManifest?.packageName ?? rendererId}: runtime=${expectedProtocolVersion}, mínimo requerido=${minSdkProtocol}`,
          );
          setIsUnavailable(true);
          setIsRendererValidated(false);
        }
        return;
      }

      const workerEntryDownload = await downloadWorkerEntry(rendererId, workerEntry);
      if ('error' in workerEntryDownload) {
        if (!cancelled) {
          setUnavailableReason(workerEntryDownload.error);
          setIsUnavailable(true);
          setIsRendererValidated(false);
        }
        return;
      }

      const checksumError = await validateWorkerEntryChecksum(
        rendererId,
        workerEntryDownload.content,
        packageManifest,
      );
      if (checksumError) {
        if (!cancelled) {
          setUnavailableReason(checksumError);
          setIsUnavailable(true);
          setIsRendererValidated(false);
        }
        return;
      }

      const signatureError = await validateWorkerEntrySignature(
        rendererId,
        workerEntryDownload.content,
        packageManifest,
      );
      if (signatureError) {
        if (!cancelled) {
          setUnavailableReason(signatureError);
          setIsUnavailable(true);
          setIsRendererValidated(false);
        }
        return;
      }

      if (!cancelled) {
        setUnavailableReason('');
        setIsUnavailable(false);
        setIsRendererValidated(true);
      }
    };

    void runValidation();

    return () => {
      cancelled = true;
    };
  }, [workerEntry, rendererId, workerRequirements, packageManifest]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const compositor = compositorRef.current;

    if (!canvas || !compositor || !workerEntry || !supportsGraphicsPipeline() || !isRendererValidated) {
      return;
    }

    const width = canvas.clientWidth || canvas.width || 1;
    const height = canvas.clientHeight || canvas.height || 1;

    const active = activeRendererRef.current;
    if (!active) {
      const initial = createRuntimeRenderer(rendererId, workerEntry, 'A', width, height);
      if (!initial) {
        setIsUnavailable(true);
        return;
      }

      activeRendererRef.current = initial;
      mixFactorRef.current = sourceMixValue(initial.source);
      syncUniforms(useTextureStore.getState());
      return;
    }

    if (active.rendererId === rendererId && active.workerEntry === workerEntry) {
      return;
    }

    disposeRuntimeRenderer(nextRendererRef.current);
    nextRendererRef.current = null;
    transitionRef.current = null;
    mixFactorRef.current = sourceMixValue(active.source);

    const nextSource: PipelineSource = active.source === 'A' ? 'B' : 'A';
    const next = createRuntimeRenderer(rendererId, workerEntry, nextSource, width, height);

    if (!next) {
      setIsUnavailable(true);
      return;
    }

    nextRendererRef.current = next;
    transitionRef.current = {
      startedAt: performance.now(),
      fromMix: sourceMixValue(active.source),
      toMix: sourceMixValue(next.source),
      durationMs: TRANSITION_DURATION_MS,
    };

    syncUniforms(useTextureStore.getState());
  }, [rendererId, workerEntry, workerRequirements, isRendererValidated]);

  if (isUnavailable) {
    return (
      <div className={`${className ?? ''} flex items-center justify-center bg-gray-900 text-gray-400 p-4`}>
        <div className="text-center">
          <h3 className="font-semibold text-gray-300 mb-1">Renderer worker no disponible</h3>
          <p className="text-sm text-gray-400">{unavailableReason || 'No se pudo iniciar el renderer en sandbox worker.'}</p>
        </div>
      </div>
    );
  }

  return <canvas ref={canvasRef} className={className} />;
};

export default GraphicsPipelineHost;
