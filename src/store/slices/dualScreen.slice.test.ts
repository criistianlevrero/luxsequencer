import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDualScreenSlice } from './dualScreen.slice';

class MockBroadcastChannel {
  name: string;
  listeners: Array<(event: MessageEvent) => void> = [];
  postMessage = vi.fn();
  close = vi.fn();

  constructor(name: string) {
    this.name = name;
  }

  addEventListener = vi.fn((event: string, cb: (event: MessageEvent) => void) => {
    if (event === 'message') this.listeners.push(cb);
  });

  emitMessage(data: unknown) {
    this.listeners.forEach((cb) => cb({ data } as MessageEvent));
  }
}

const createDualScreenHarness = () => {
  const state: any = {
    dualScreen: {
      enabled: false,
      isSecondaryWindow: false,
      secondaryWindow: null,
      broadcastChannel: null,
      channelName: 'luxsequencer-dualscreen',
    },
    currentSettings: { animationSpeed: 1 },
    project: null,
    activeSequenceIndex: 0,
    textureRotation: 0,
    transitionProgress: 1,
    previousGradient: null,
    previousBackgroundGradient: null,
    sequencerCurrentStep: 0,
    viewportMode: 'horizontal',
  };

  const set = (partial: any) => {
    const patch = typeof partial === 'function' ? partial(state) : partial;
    Object.assign(state, patch);
  };
  const get = () => state;

  const actions = createDualScreenSlice(set as any, get as any, {} as any);
  Object.assign(state, actions);

  return state;
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
});

describe('dualScreen.slice', () => {
  it('initializeDualScreen creates channel and sets primary mode state', () => {
    const store = createDualScreenHarness();

    store.initializeDualScreen(false);

    expect(store.dualScreen.broadcastChannel).toBeTruthy();
    expect(store.dualScreen.isSecondaryWindow).toBe(false);
    expect(store.dualScreen.broadcastChannel.name).toBe('luxsequencer-dualscreen');
  });

  it('initializeDualScreen in secondary mode requests full state sync', () => {
    vi.useFakeTimers();
    const store = createDualScreenHarness();

    store.initializeDualScreen(true);
    const channel = store.dualScreen.broadcastChannel as MockBroadcastChannel;

    vi.advanceTimersByTime(100);

    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'REQUEST_FULL_STATE' })
    );
    expect(store.dualScreen.isSecondaryWindow).toBe(true);
  });

  it('broadcastStateUpdate posts only from primary window', () => {
    const store = createDualScreenHarness();
    store.initializeDualScreen(false);
    const channel = store.dualScreen.broadcastChannel as MockBroadcastChannel;

    store.broadcastStateUpdate({ viewportMode: 'vertical' });
    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'STATE_UPDATE', payload: { viewportMode: 'vertical' } })
    );

    store.dualScreen.isSecondaryWindow = true;
    channel.postMessage.mockClear();
    store.broadcastStateUpdate({ viewportMode: 'horizontal' });
    expect(channel.postMessage).not.toHaveBeenCalled();
  });

  it('disableDualScreen closes secondary window and channel, then resets state', () => {
    const store = createDualScreenHarness();
    store.initializeDualScreen(false);

    const closeWindow = vi.fn();
    store.dualScreen.secondaryWindow = { close: closeWindow } as any;
    const channel = store.dualScreen.broadcastChannel as MockBroadcastChannel;

    store.disableDualScreen();

    expect(closeWindow).toHaveBeenCalledOnce();
    expect(channel.close).toHaveBeenCalledOnce();
    expect(store.dualScreen.enabled).toBe(false);
    expect(store.dualScreen.secondaryWindow).toBeNull();
    expect(store.dualScreen.broadcastChannel).toBeNull();
  });
});
