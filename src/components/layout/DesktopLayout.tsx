import React from 'react';
import { AppHeader } from './AppHeader';

interface DesktopLayoutProps {
  onFullscreen: () => void;
  onReset: () => void;
  controlPanel: React.ReactNode;
  viewportSection: React.ReactNode;
  sequencerPanel: React.ReactNode;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  onFullscreen,
  onReset,
  controlPanel,
  viewportSection,
  sequencerPanel
}) => {
  return (
    <div className="min-h-screen text-gray-200 font-sans flex flex-col antialiased">
      <AppHeader onFullscreen={onFullscreen} onReset={onReset} />

      <main className="flex-grow container mx-auto p-3 md:p-4">
        <div className="grid gap-4 items-start grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-1 bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-700">
            {controlPanel}
          </div>
          
          <div className="lg:col-span-2 flex flex-col gap-4">
            {viewportSection}
            <div className="bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-700">
              {sequencerPanel}
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-2 text-gray-500 text-xs">
        <p>Creado con React, Tailwind CSS y Gemini</p>
      </footer>
    </div>
  );
};
