import {
  isErrorMessage,
  isFrameMessage,
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
}

export class RendererWorkerManager {
  private readonly options: RendererWorkerManagerOptions;
  private worker: Worker | null = null;

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

    this.worker.onmessage = (event: MessageEvent<RendererWorkerToMainMessage>) => {
      if (isFrameMessage(event.data)) {
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
    this.postMessage({ type: 'dispose' });
    this.worker?.terminate();
    this.worker = null;
  }

  private postMessage(message: RendererWorkerMessage, transfer: Transferable[] = []): void {
    this.worker?.postMessage(message, transfer);
  }
}
