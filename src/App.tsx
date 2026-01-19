import React, { useEffect, useRef } from 'react';
import { useTextureStore } from './store';
import ControlPanel from './components/controls/ControlPanel';
import { renderers } from './components/renderers';
import { ConsoleIcon } from './components/shared/icons';
import MidiConsole from './components/midi/MidiConsole';
import Sequencer from './components/sequencer/Sequencer';
import DebugOverlay from './components/debug/DebugOverlay';
import { useTranslation } from './i18n/hooks/useTranslation';
import DualScreenManager from './components/dualscreen/DualScreenManager';
import SecondaryDisplay from './components/dualscreen/SecondaryDisplay';
import { env } from './config';
// Layout components
import { DesktopLayout } from './components/layout/DesktopLayout';
import { FullscreenLayout } from './components/layout/FullscreenLayout';
import { MainViewport } from './components/layout/MainViewport';
// Hooks
import { useFullscreenLayout } from './hooks/useFullscreenLayout';
import { useDrawerStates } from './hooks/useDrawerStates';
import { useAppEventHandlers } from './hooks/useAppEventHandlers';
import type { Project } from './types';
import packageJson from '../package.json';
import { AppRouter } from './components/routing/AppRouter';

interface AppProps {
    initialProject: Project;
}

const App: React.FC<AppProps> = ({ initialProject }) => {
  return <AppRouter initialProject={initialProject} />;
};

export default App;
