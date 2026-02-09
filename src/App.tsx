import React from 'react';
import type { Project } from './types';
import { AppRouter } from './components/routing/AppRouter';

interface AppProps {
    initialProject: Project;
}

const App: React.FC<AppProps> = ({ initialProject }) => {
  return <AppRouter initialProject={initialProject} />;
};

export default App;
