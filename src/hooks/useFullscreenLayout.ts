import { useEffect, useCallback, useRef } from 'react';
import { useAppLayout } from '../contexts/AppLayoutContext';

export const useFullscreenLayout = () => {
  const { state, actions } = useAppLayout();
  const overlayTimeoutRef = useRef<number | null>(null);

  const handleFullscreenChange = useCallback(() => {
    const isFullscreen = !!document.fullscreenElement;
    actions.setFullscreen(isFullscreen);
    
    // Cleanup drawers when exiting fullscreen
    if (!isFullscreen) {
      actions.exitFullscreenCleanup();
    }
  }, [actions]);

  const toggleFullscreen = useCallback((appRef?: React.RefObject<HTMLDivElement>) => {
    if (!document.fullscreenElement) {
      appRef?.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    if (!state.fullscreen.isActive) return;
    
    if (overlayTimeoutRef.current) {
      clearTimeout(overlayTimeoutRef.current);
    }
    actions.setOverlayVisible(true);
    overlayTimeoutRef.current = window.setTimeout(() => {
      actions.setOverlayVisible(false);
    }, 3000);
  }, [state.fullscreen.isActive, actions]);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [handleFullscreenChange]);

  useEffect(() => {
    if (state.fullscreen.isActive) {
      window.addEventListener('mousemove', handleMouseMove);
      handleMouseMove();
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current);
      }
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current);
      }
    };
  }, [state.fullscreen.isActive, handleMouseMove]);

  return {
    isFullscreen: state.fullscreen.isActive,
    isOverlayVisible: state.fullscreen.overlayVisible,
    toggleFullscreen,
    handleMouseMove
  };
};
