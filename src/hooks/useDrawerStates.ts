import { useAppLayout } from '../contexts/AppLayoutContext';

export interface DrawerStates {
  isDrawerOpen: boolean;
  isSequencerDrawerOpen: boolean;
  isConsoleOpen: boolean;
}

export interface DrawerActions {
  setIsDrawerOpen: (open: boolean) => void;
  setIsSequencerDrawerOpen: (open: boolean) => void;
  setIsConsoleOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  toggleSequencerDrawer: () => void;
  toggleConsole: () => void;
  closeAllDrawers: () => void;
}

export const useDrawerStates = () => {
  const { state, actions } = useAppLayout();

  const drawers: DrawerStates = {
    isDrawerOpen: state.drawers.control,
    isSequencerDrawerOpen: state.drawers.sequencer,
    isConsoleOpen: state.drawers.console
  };

  const drawerActions: DrawerActions = {
    setIsDrawerOpen: (open: boolean) => actions.setDrawer('control', open),
    setIsSequencerDrawerOpen: (open: boolean) => actions.setDrawer('sequencer', open),
    setIsConsoleOpen: (open: boolean) => actions.setDrawer('console', open),
    toggleDrawer: () => actions.toggleDrawer('control'),
    toggleSequencerDrawer: () => actions.toggleDrawer('sequencer'),
    toggleConsole: () => actions.toggleDrawer('console'),
    closeAllDrawers: actions.closeAllDrawers
  };

  return {
    drawers,
    actions: drawerActions
  };
};
