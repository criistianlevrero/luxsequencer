/**
 * Enhanced Control Panel that integrates declarative controls
 * Maintains compatibility with existing system while showcasing new capabilities
 */

import React, { useMemo } from 'react';
import { useTextureStore } from '../../store';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import { renderers } from '../renderers';
import { Card, CollapsibleSection } from '../ui';
import { DeclarativeControlPanel } from '../declarative/ControlRenderer';
import type { RendererControlSpec, DeclarativeControlSchema } from '../../types/declarativeControls';
import type { ControlSection } from '../../types';

interface EnhancedControlPanelProps {
  /**
   * Enable declarative controls (experimental feature)
   */
  useDeclarativeControls?: boolean;
  
  /**
   * Show side-by-side comparison with legacy controls
   */
  showComparison?: boolean;
}

export const EnhancedControlPanel: React.FC<EnhancedControlPanelProps> = ({
  useDeclarativeControls = true,
  showComparison = false
}) => {
  const { t: _t } = useTranslation();
  
  const {
    project: _project,
    currentSettings,
    renderer,
  } = useTextureStore((state) => ({
    project: state.project,
    currentSettings: state.currentSettings,
    renderer: state.project?.globalSettings.renderer ?? 'webgl',
  }));

  const { setCurrentSetting } = useTextureStore.getState();

  // Get renderer control spec
  const rendererControlSpec: RendererControlSpec | DeclarativeControlSchema | null = useMemo(() => {
    const currentRenderer = renderers[renderer];
    const schema = currentRenderer?.declarativeSchema;
    if (!schema || typeof schema === 'function') {
      return null;
    }

    return schema;
  }, [renderer]);

  // Render declarative controls if available
  const renderDeclarativeControls = () => {
    if (!useDeclarativeControls || !rendererControlSpec) return null;

    return (
      <DeclarativeControlPanel
        spec={rendererControlSpec}
        settings={currentSettings}
        onSettingChange={(property, value) => setCurrentSetting(property, value)}
        rendererId={renderer}
      />
    );
  };

  // Render legacy controls (for comparison or fallback)
  const renderLegacyControls = () => {
    const currentRenderer = renderers[renderer];
    if (!currentRenderer) return null;

    const schema = typeof currentRenderer.controlSchema === 'function' 
      ? currentRenderer.controlSchema()
      : currentRenderer.controlSchema || [];

    return (
      <div className="space-y-4">
        {schema.map((section, index) => {
          if ('type' in section && section.type === 'separator') {
            return (
              <div 
                key={section.id || `separator-${index}`} 
                className="border-t border-gray-600 my-6"
              />
            );
          }

          // Type guard: section is ControlSection
          const controlSection = section as ControlSection;

          return (
            <CollapsibleSection
              key={controlSection.title || `section-${index}`}
              title={controlSection.title || 'Untitled'}
              defaultOpen={controlSection.defaultOpen}
            >
              <div className="space-y-4">
                {controlSection.controls?.map((control, controlIndex) => (
                  <div key={control.id || `control-${controlIndex}`}>
                    {/* Legacy control rendering logic */}
                    {control.type === 'custom' && control.component && (
                      <control.component />
                    )}
                    {/* Add other control types as needed */}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with system info */}
      <Card className="border-gray-600" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-200">Control System</h3>
            <p className="text-sm text-gray-400">
              {useDeclarativeControls && rendererControlSpec 
                ? '🚀 Declarative Controls Active' 
                : '📝 Legacy Controls'
              }
            </p>
          </div>
          
          {/* System stats */}
          {rendererControlSpec && (
            <div className="text-right">
              <div className="text-sm text-gray-400">
                {'standard' in rendererControlSpec 
                  ? `${(rendererControlSpec as RendererControlSpec).standard.length} controls`
                  : `${(rendererControlSpec as DeclarativeControlSchema).sections.flatMap(s => s.controls).length} controls`
                }
              </div>
              <div className="text-xs text-gray-500">
                {'standard' in rendererControlSpec
                  ? `${new Set((rendererControlSpec as RendererControlSpec).standard.map(c => c.category)).size} categories`
                  : `${(rendererControlSpec as DeclarativeControlSchema).sections.length} sections`
                }
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Controls Content */}
      {showComparison ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Declarative controls */}
          <div>
            <h4 className="font-medium text-gray-200 mb-4">
              🚀 Declarative Controls
            </h4>
            <div className="space-y-4">
              {renderDeclarativeControls()}
            </div>
          </div>
          
          {/* Legacy controls */}
          <div>
            <h4 className="font-medium text-gray-200 mb-4">
              📝 Legacy Controls
            </h4>
            <div className="space-y-4">
              {renderLegacyControls()}
            </div>
          </div>
        </div>
      ) : (
        // Single system
        <div>
          {useDeclarativeControls && rendererControlSpec ? (
            renderDeclarativeControls()
          ) : (
            renderLegacyControls()
          )}
        </div>
      )}
      
      {/* Feature showcase */}
      {useDeclarativeControls && rendererControlSpec && (
        <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
          <h4 className="font-medium text-cyan-300 mb-2">
            ✨ Enhanced Features Active
          </h4>
          <ul className="text-sm text-cyan-200 space-y-1">
            <li>• Dynamic dependencies and conditional controls</li>
            <li>• Advanced sliders with detents and presets</li>
            <li>• Professional color picker with palettes</li>
            <li>• Interactive 2D vector controls</li>
            <li>• Rich gradient editor integration</li>
            <li>• Comprehensive validation and tooltips</li>
          </ul>
        </div>
      )}
    </div>
  );
};