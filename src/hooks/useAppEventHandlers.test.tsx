import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const resetToDefaultMock = vi.fn();

vi.mock('../store', () => ({
  useTextureStore: (selector: (state: any) => unknown) =>
    selector({
      resetToDefault: resetToDefaultMock,
    }),
}));

vi.mock('../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { useAppEventHandlers } from './useAppEventHandlers';

describe('useAppEventHandlers', () => {
  beforeEach(() => {
    resetToDefaultMock.mockClear();
  });

  it('calls resetToDefault when confirmation is accepted', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { result } = renderHook(() => useAppEventHandlers());

    act(() => {
      result.current.handleResetToDefault();
    });

    expect(resetToDefaultMock).toHaveBeenCalledOnce();
  });

  it('does not call resetToDefault when confirmation is rejected', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const { result } = renderHook(() => useAppEventHandlers());

    act(() => {
      result.current.handleResetToDefault();
    });

    expect(resetToDefaultMock).not.toHaveBeenCalled();
  });
});
