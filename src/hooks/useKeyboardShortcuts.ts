import { useEffect } from 'react';

export interface ShortcutActions {
  toggleFullscreen: () => void;
  closeAllDrawers: () => void;
  toggleControlDrawer: () => void;
  toggleSequencerDrawer: () => void;
  toggleConsole: () => void;
  togglePlayStop: () => void;
}

export const useKeyboardShortcuts = (actions: ShortcutActions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F11 - Toggle fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        actions.toggleFullscreen();
        return;
      }

      // Escape - Close all drawers (only in fullscreen)
      if (e.key === 'Escape' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        actions.closeAllDrawers();
        return;
      }

      // Ctrl+1 - Toggle control drawer (in fullscreen)
      if (e.key === '1' && e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        actions.toggleControlDrawer();
        return;
      }

      // Ctrl+2 - Toggle sequencer drawer (in fullscreen)
      if (e.key === '2' && e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        actions.toggleSequencerDrawer();
        return;
      }

      // Ctrl+` - Toggle MIDI console
      if (e.key === '`' && e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        actions.toggleConsole();
        return;
      }

      // Space - Toggle play/stop (prevent default to avoid page scroll)
      if (e.key === ' ' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        actions.togglePlayStop();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
};
