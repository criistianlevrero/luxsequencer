import React, { useEffect } from 'react';
import { useTextureStore } from '../../store';
import { renderers } from '../renderers';

/**
 * Componente para la ventana secundaria (pantalla de visualización)
 * Solo muestra el renderer en pantalla completa sin controles
 */
export const SecondaryDisplay: React.FC = () => {
  const rendererId = useTextureStore(state => state.project?.globalSettings.renderer ?? 'webgl');
  const viewportMode = useTextureStore(state => state.viewportMode);
  const currentSettings = useTextureStore(state => state.currentSettings);
  
  useEffect(() => {
    // Ocultar cursor después de 3 segundos de inactividad
    let cursorTimer: NodeJS.Timeout;
    const hideCursor = () => {
      document.body.style.cursor = 'none';
    };
    const showCursor = () => {
      document.body.style.cursor = 'auto';
      clearTimeout(cursorTimer);
      cursorTimer = setTimeout(hideCursor, 3000);
    };
    
    // Configurar eventos de mouse
    document.addEventListener('mousemove', showCursor);
    document.addEventListener('click', showCursor);
    
    // Inicializar timer
    cursorTimer = setTimeout(hideCursor, 3000);
    
    // Mensaje para entrar en fullscreen manualmente
    console.log('💡 Para pantalla completa, presiona F11 o haz clic derecho > Pantalla completa');
    
    // Cleanup
    return () => {
      document.removeEventListener('mousemove', showCursor);
      document.removeEventListener('click', showCursor);
      clearTimeout(cursorTimer);
      document.body.style.cursor = 'auto';
    };
  }, []);

  // Obtener el componente del renderer actual
  const renderer = renderers[rendererId];
  
  if (!renderer) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">LuxSequencer</h1>
          <p className="text-xl text-gray-400">Renderer no encontrado: {rendererId}</p>
          <p className="text-sm text-gray-500 mt-2">Available renderers: {Object.keys(renderers).join(', ')}</p>
        </div>
      </div>
    );
  }

  const RendererComponent = renderer.component;

  // Configurar clases CSS según el viewport mode
  const getContainerClasses = () => {
    switch (viewportMode) {
      case 'desktop':
        return 'w-full h-screen max-w-[1920px] max-h-[1080px] mx-auto my-auto flex items-center justify-center';
      case 'mobile':
        return 'w-full h-screen max-w-[375px] max-h-[667px] mx-auto my-auto flex items-center justify-center';
      default:
        return 'w-full h-screen';
    }
  };

  const getRendererClasses = () => {
    switch (viewportMode) {
      case 'desktop':
        return 'w-full h-full max-w-[1920px] max-h-[1080px] border border-gray-600';
      case 'mobile':
        return 'w-full h-full max-w-[375px] max-h-[667px] border border-gray-600 rounded-lg';
      default:
        return 'w-full h-full';
    }
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      {/* Info overlay (se oculta automáticamente) */}
      <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white px-3 py-2 rounded opacity-100">
        <div className="text-sm font-mono">
          LuxSequencer - Display
        </div>
        <div className="text-xs text-gray-300">
          {renderer.name}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Settings: {Object.keys(currentSettings).length} props
        </div>
      </div>
      
      {/* Renderer container */}
      <div className={getContainerClasses()}>
        <RendererComponent className={getRendererClasses()} />
      </div>
      
      {/* Instrucciones de teclado (aparecen al mover el mouse) */}
      <div className="absolute bottom-4 left-4 text-white text-sm opacity-50 font-mono">
        <div>F11: Pantalla completa</div>
        <div>Ctrl+W: Cerrar ventana</div>
      </div>
    </div>
  );
};

export default SecondaryDisplay;