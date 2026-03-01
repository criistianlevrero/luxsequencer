import '@testing-library/jest-dom/vitest';

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    return window.setTimeout(() => callback(performance.now()), 16);
  };
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = (id: number): void => {
    clearTimeout(id);
  };
}
