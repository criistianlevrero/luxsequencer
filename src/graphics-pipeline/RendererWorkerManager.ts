import {
  RENDERER_WORKER_PROTOCOL_VERSION,
  isErrorMessage,
  isFrameMessage,
  isReadyMessage,
  type RendererWorkerCapability,
  type RendererWorkerHealthSnapshot,
  type RendererWorkerMessage,
  type RendererWorkerToMainMessage,
} from './types';

type WorkerEntry = string | URL;

export interface RendererWorkerManagerOptions {
  rendererId: string;
  workerEntry: WorkerEntry;
  width: number;
  height: number;
  onFrame: (bitmap: ImageBitmap) => void;
  onError?: (error: Error) => void;
  onReady?: (snapshot: RendererWorkerHealthSnapshot) => void;
  handshakeTimeoutMs?: number;
  requiredCapabilities?: RendererWorkerCapability[];
}

export class RendererWorkerManager {
  private readonly options: RendererWorkerManagerOptions;
  private worker: Worker | null = null;
  private isReady = false;
  private handshakeTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private startedAtMs: number | null = null;
  private handshakeDurationMs: number | null = null;
  private protocolVersion: string | null = null;
  private capabilities: RendererWorkerCapability[] = [];
  private lastFrameAtMs: number | null = null;

  constructor(options: RendererWorkerManagerOptions) {
    this.options = options;
  }

  start(): boolean {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
      return false;
    }

    const workerUrl = this.options.workerEntry instanceof URL
      ? this.options.workerEntry
      : new URL(this.options.workerEntry, window.location.href);

    this.worker = new Worker(workerUrl, { type: 'module', name: `renderer-worker-${this.options.rendererId}` });
    this.isReady = false;
    this.startedAtMs = performance.now();
    this.handshakeDurationMs = null;
    this.protocolVersion = null;
    this.capabilities = [];
    this.lastFrameAtMs = null;

    this.worker.onmessage = (event: MessageEvent<RendererWorkerToMainMessage>) => {
      if (isReadyMessage(event.data)) {
        const readyMessage = event.data;

        if (readyMessage.rendererId !== this.options.rendererId) {
          this.options.onError?.(
            new Error(
              `Renderer worker id mismatch: expected ${this.options.rendererId}, got ${readyMessage.rendererId}`,
            ),
          );
          this.dispose();
          return;
        }

        if (readyMessage.protocolVersion !== RENDERER_WORKER_PROTOCOL_VERSION) {
          this.options.onError?.(
            new Error(
              `Renderer worker protocol mismatch for ${this.options.rendererId}: expected ${RENDERER_WORKER_PROTOCOL_VERSION}, got ${readyMessage.protocolVersion}`,
            ),
          );
          this.dispose();
          return;
        }

        const requiredCapabilities = this.options.requiredCapabilities ?? [];
        const missingCapabilities = requiredCapabilities.filter(
          (capability) => !readyMessage.capabilities.includes(capability),
        );

        if (missingCapabilities.length > 0) {
          this.options.onError?.(
            new Error(
              `Renderer worker ${this.options.rendererId} missing required capabilities: ${missingCapabilities.join(', ')}`,
            ),
          );
          this.dispose();
          return;
        }

        this.isReady = true;
        this.protocolVersion = readyMessage.protocolVersion;
        this.capabilities = [...readyMessage.capabilities];
        this.handshakeDurationMs = this.startedAtMs === null
          ? null
          : Math.max(0, performance.now() - this.startedAtMs);
        this.clearHandshakeTimeout();
        this.options.onReady?.(this.getHealthSnapshot());
        return;
      }

      if (isFrameMessage(event.data)) {
        this.lastFrameAtMs = performance.now();
        this.options.onFrame(event.data.bitmap);
        return;
      }

      if (isErrorMessage(event.data)) {
        this.options.onError?.(new Error(event.data.message));
      }
    };

    this.worker.onerror = (event) => {
      this.options.onError?.(new Error(event.message));
    };

    const handshakeTimeoutMs = this.options.handshakeTimeoutMs ?? 2000;
    this.handshakeTimeoutId = setTimeout(() => {
      if (this.isReady) {
        return;
      }

      this.options.onError?.(
        new Error(`Renderer worker handshake timeout for ${this.options.rendererId} (${handshakeTimeoutMs}ms)`),
      );
      this.dispose();
    }, handshakeTimeoutMs);

    const offscreenCanvas = new OffscreenCanvas(
      Math.max(1, Math.floor(this.options.width)),
      Math.max(1, Math.floor(this.options.height)),
    );

    this.postMessage(
      {
        type: 'init',
        canvas: offscreenCanvas,
        width: offscreenCanvas.width,
        height: offscreenCanvas.height,
      },
      [offscreenCanvas],
    );

    return true;
  }

  updateUniform(name: string, value: unknown): void {
    this.postMessage({ type: 'updateUniform', name, value });
  }

  resize(width: number, height: number): void {
    this.postMessage({
      type: 'resize',
      width: Math.max(1, Math.floor(width)),
      height: Math.max(1, Math.floor(height)),
    });
  }

  dispose(): void {
    this.clearHandshakeTimeout();
    this.postMessage({ type: 'dispose' });
    this.worker?.terminate();
    this.worker = null;
    this.isReady = false;
    this.startedAtMs = null;
    this.handshakeDurationMs = null;
    this.protocolVersion = null;
    this.capabilities = [];
    this.lastFrameAtMs = null;
  }

  getHealthSnapshot(): RendererWorkerHealthSnapshot {
    return {
      rendererId: this.options.rendererId,
      isReady: this.isReady,
      protocolVersion: this.protocolVersion,
      capabilities: [...this.capabilities],
      handshakeDurationMs: this.handshakeDurationMs,
      lastFrameAtMs: this.lastFrameAtMs,
    };
  }

  private postMessage(message: RendererWorkerMessage, transfer: Transferable[] = []): void {
    this.worker?.postMessage(message, transfer);
  }

  private clearHandshakeTimeout(): void {
    if (!this.handshakeTimeoutId) {
      return;
    }

    clearTimeout(this.handshakeTimeoutId);
    this.handshakeTimeoutId = null;
  }
}
