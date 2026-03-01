import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const createActions = () => ({
    toggleFullscreen: vi.fn(),
    closeAllDrawers: vi.fn(),
    toggleControlDrawer: vi.fn(),
    toggleSequencerDrawer: vi.fn(),
    toggleConsole: vi.fn(),
    togglePlayStop: vi.fn(),
  });

  it('triggers fullscreen action on F11', () => {
    const actions = createActions();
    renderHook(() => useKeyboardShortcuts(actions));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F11' }));

    expect(actions.toggleFullscreen).toHaveBeenCalledOnce();
  });

  it('triggers drawer shortcuts on Ctrl+1 and Ctrl+2', () => {
    const actions = createActions();
    renderHook(() => useKeyboardShortcuts(actions));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', ctrlKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', ctrlKey: true }));

    expect(actions.toggleControlDrawer).toHaveBeenCalledOnce();
    expect(actions.toggleSequencerDrawer).toHaveBeenCalledOnce();
  });

  it('triggers console toggle on Ctrl+` and play toggle on Space', () => {
    const actions = createActions();
    renderHook(() => useKeyboardShortcuts(actions));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '`', ctrlKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

    expect(actions.toggleConsole).toHaveBeenCalledOnce();
    expect(actions.togglePlayStop).toHaveBeenCalledOnce();
  });

  it('closes drawers on Escape', () => {
    const actions = createActions();
    renderHook(() => useKeyboardShortcuts(actions));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(actions.closeAllDrawers).toHaveBeenCalledOnce();
  });
});
