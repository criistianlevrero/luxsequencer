export type PipelineRendererStatus =
  | 'idle'
  | 'initializing'
  | 'active'
  | 'transitioning-out'
  | 'disposed';

export type PipelineSource = 'A' | 'B';

export type RendererWorkerInitMessage = {
  type: 'init';
  canvas: OffscreenCanvas;
  width: number;
  height: number;
};

export type RendererWorkerUpdateUniformMessage = {
  type: 'updateUniform';
  name: string;
  value: unknown;
};

export type RendererWorkerResizeMessage = {
  type: 'resize';
  width: number;
  height: number;
};

export type RendererWorkerDisposeMessage = {
  type: 'dispose';
};

export type RendererWorkerMessage =
  | RendererWorkerInitMessage
  | RendererWorkerUpdateUniformMessage
  | RendererWorkerResizeMessage
  | RendererWorkerDisposeMessage;

export type RendererWorkerFrameMessage = {
  type: 'frame';
  bitmap: ImageBitmap;
};

export type RendererWorkerErrorMessage = {
  type: 'error';
  message: string;
};

export type RendererWorkerToMainMessage = RendererWorkerFrameMessage | RendererWorkerErrorMessage;

export const isFrameMessage = (message: unknown): message is RendererWorkerFrameMessage => {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type?: string }).type === 'frame' &&
    'bitmap' in message
  );
};

export const isErrorMessage = (message: unknown): message is RendererWorkerErrorMessage => {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type?: string }).type === 'error'
  );
};
