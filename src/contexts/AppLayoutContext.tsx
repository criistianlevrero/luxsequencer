import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { ViewportMode } from '../types';

interface AppLayoutState {
  drawers: {
    control: boolean;
    sequencer: boolean;
    console: boolean;
  };
  fullscreen: {
    isActive: boolean;
    overlayVisible: boolean;
  };
  viewport: {
    mode: ViewportMode;
  };
}

type AppLayoutAction =
  | { type: 'SET_FULLSCREEN'; payload: boolean }
  | { type: 'SET_OVERLAY_VISIBLE'; payload: boolean }
  | { type: 'TOGGLE_DRAWER'; payload: 'control' | 'sequencer' | 'console' }
  | { type: 'SET_DRAWER'; payload: { drawer: 'control' | 'sequencer' | 'console'; open: boolean } }
  | { type: 'CLOSE_ALL_DRAWERS' }
  | { type: 'SET_VIEWPORT_MODE'; payload: ViewportMode }
  | { type: 'EXIT_FULLSCREEN_CLEANUP' };

interface AppLayoutContextType {
  state: AppLayoutState;
  actions: {
    setFullscreen: (active: boolean) => void;
    setOverlayVisible: (visible: boolean) => void;
    toggleDrawer: (drawer: 'control' | 'sequencer' | 'console') => void;
    setDrawer: (drawer: 'control' | 'sequencer' | 'console', open: boolean) => void;
    closeAllDrawers: () => void;
    setViewportMode: (mode: ViewportMode) => void;
    exitFullscreenCleanup: () => void;
  };
}

const initialState: AppLayoutState = {
  drawers: {
    control: false,
    sequencer: false,
    console: false,
  },
  fullscreen: {
    isActive: false,
    overlayVisible: true,
  },
  viewport: {
    mode: 'horizontal',
  },
};

const appLayoutReducer = (state: AppLayoutState, action: AppLayoutAction): AppLayoutState => {
  switch (action.type) {
    case 'SET_FULLSCREEN':
      return {
        ...state,
        fullscreen: {
          ...state.fullscreen,
          isActive: action.payload,
        },
      };
    case 'SET_OVERLAY_VISIBLE':
      return {
        ...state,
        fullscreen: {
          ...state.fullscreen,
          overlayVisible: action.payload,
        },
      };
    case 'TOGGLE_DRAWER':
      return {
        ...state,
        drawers: {
          ...state.drawers,
          [action.payload]: !state.drawers[action.payload],
        },
      };
    case 'SET_DRAWER':
      return {
        ...state,
        drawers: {
          ...state.drawers,
          [action.payload.drawer]: action.payload.open,
        },
      };
    case 'CLOSE_ALL_DRAWERS':
      return {
        ...state,
        drawers: {
          control: false,
          sequencer: false,
          console: false,
        },
      };
    case 'SET_VIEWPORT_MODE':
      return {
        ...state,
        viewport: {
          ...state.viewport,
          mode: action.payload,
        },
      };
    case 'EXIT_FULLSCREEN_CLEANUP':
      return {
        ...state,
        drawers: {
          ...state.drawers,
          control: false,
          sequencer: false,
        },
      };
    default:
      return state;
  }
};

const AppLayoutContext = createContext<AppLayoutContextType | null>(null);

export const AppLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appLayoutReducer, initialState);

  const actions = {
    setFullscreen: useCallback((active: boolean) => {
      dispatch({ type: 'SET_FULLSCREEN', payload: active });
    }, []),

    setOverlayVisible: useCallback((visible: boolean) => {
      dispatch({ type: 'SET_OVERLAY_VISIBLE', payload: visible });
    }, []),

    toggleDrawer: useCallback((drawer: 'control' | 'sequencer' | 'console') => {
      dispatch({ type: 'TOGGLE_DRAWER', payload: drawer });
    }, []),

    setDrawer: useCallback((drawer: 'control' | 'sequencer' | 'console', open: boolean) => {
      dispatch({ type: 'SET_DRAWER', payload: { drawer, open } });
    }, []),

    closeAllDrawers: useCallback(() => {
      dispatch({ type: 'CLOSE_ALL_DRAWERS' });
    }, []),

    setViewportMode: useCallback((mode: ViewportMode) => {
      dispatch({ type: 'SET_VIEWPORT_MODE', payload: mode });
    }, []),

    exitFullscreenCleanup: useCallback(() => {
      dispatch({ type: 'EXIT_FULLSCREEN_CLEANUP' });
    }, []),
  };

  return (
    <AppLayoutContext.Provider value={{ state, actions }}>
      {children}
    </AppLayoutContext.Provider>
  );
};

export const useAppLayout = (): AppLayoutContextType => {
  const context = useContext(AppLayoutContext);
  if (!context) {
    throw new Error('useAppLayout must be used within AppLayoutProvider');
  }
  return context;
};
