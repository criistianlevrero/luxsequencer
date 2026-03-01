import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppLayoutProvider } from '../contexts/AppLayoutContext';
import { useDrawerStates } from './useDrawerStates';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppLayoutProvider>{children}</AppLayoutProvider>
);

describe('useDrawerStates', () => {
  it('toggles control and sequencer drawers through hook actions', () => {
    const { result } = renderHook(() => useDrawerStates(), { wrapper });

    expect(result.current.drawers.isDrawerOpen).toBe(false);
    expect(result.current.drawers.isSequencerDrawerOpen).toBe(false);

    act(() => {
      result.current.actions.toggleDrawer();
      result.current.actions.toggleSequencerDrawer();
    });

    expect(result.current.drawers.isDrawerOpen).toBe(true);
    expect(result.current.drawers.isSequencerDrawerOpen).toBe(true);
  });

  it('closeAllDrawers closes control, sequencer and console drawers', () => {
    const { result } = renderHook(() => useDrawerStates(), { wrapper });

    act(() => {
      result.current.actions.setIsDrawerOpen(true);
      result.current.actions.setIsSequencerDrawerOpen(true);
      result.current.actions.setIsConsoleOpen(true);
    });

    expect(result.current.drawers.isDrawerOpen).toBe(true);
    expect(result.current.drawers.isSequencerDrawerOpen).toBe(true);
    expect(result.current.drawers.isConsoleOpen).toBe(true);

    act(() => {
      result.current.actions.closeAllDrawers();
    });

    expect(result.current.drawers.isDrawerOpen).toBe(false);
    expect(result.current.drawers.isSequencerDrawerOpen).toBe(false);
    expect(result.current.drawers.isConsoleOpen).toBe(false);
  });
});
