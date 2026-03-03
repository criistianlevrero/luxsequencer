import React, { useEffect, useRef, useState } from 'react';
import {
  RendererWorkerManager,
  WebGLCompositor,
  type CompositorMetrics,
  type PipelineSource,
  type RendererWorkerCapability,
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

interface GraphicsPipelineHostProps {
  className?: string;
  rendererId: string;
  workerEntry: string | URL;
}

interface RuntimeRenderer {
  rendererId: string;
  workerEntry: string | URL;
  source: PipelineSource;
  manager: RendererWorkerManager;
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

const getRequiredCapabilities = (rendererId: string): RendererWorkerCapability[] => {
  if (rendererId === 'webgl') {
    return ['offscreen-canvas', 'webgl2', 'uniform-updates'];
  }

  if (rendererId === 'concentric' || rendererId === 'dvd-screensaver') {
    return ['offscreen-canvas', 'canvas2d', 'uniform-updates'];
  }

  return ['offscreen-canvas', 'uniform-updates'];
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
    if (elapsedSinceFrame > WORKER_STALL_TIMEOUT_MS) {
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
      requiredCapabilities: getRequiredCapabilities(nextRendererId),
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
    if (supportsGraphicsPipeline()) {
      setUnavailableReason('');
      setIsUnavailable(false);
    }
  }, [workerEntry, rendererId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const compositor = compositorRef.current;

    if (!canvas || !compositor || !workerEntry || !supportsGraphicsPipeline()) {
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
  }, [rendererId, workerEntry]);

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
