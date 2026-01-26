import React, { useMemo, useState, useCallback } from 'react';
import type {
  RendererControlSpec,
  StandardControlSpec,
  CustomControlSpec,
  ControlType,
  ControlRenderContext,
  BaseControlProps,
  PropertyDependency
} from '../types/declarativeControls';
import type { ControlSettings } from '../types';
import { getNestedProperty } from '../utils/settingsMigration';

// Import control components (will be implemented next)
import { SliderControl } from './controls/SliderControl';
import { ColorControl } from './controls/ColorControl';
import { GradientControl } from './controls/GradientControl';
import { Vector2DControl } from './controls/Vector2DControl';
import { SelectControl } from './controls/SelectControl';
import { ToggleControl } from './controls/ToggleControl';
import { RangeControl } from './controls/RangeControl';
import { TextControl } from './controls/TextControl';

/**
 * Central control renderer that generates components automatically from specifications
 */
export class ControlRenderer {
  private components = new Map<ControlType, React.FC<BaseControlProps<any>>>();
  
  constructor() {
    // Register built-in components
    this.register('slider', SliderControl);
    this.register('color', ColorControl);
    this.register('gradient', GradientControl);
    this.register('vector2d', Vector2DControl);
    this.register('select', SelectControl);
    this.register('toggle', ToggleControl);
    this.register('range', RangeControl);
    this.register('text', TextControl);
  }
  
  /**
   * Register a new control type component
   */
  register(type: ControlType, component: React.FC<BaseControlProps<any>>): void {
    this.components.set(type, component);
  }
  
  /**
   * Render a standard control from specification
   */
  render(
    spec: StandardControlSpec, 
    value: any, 
    onChange: (value: any) => void,
    context: ControlRenderContext,
    disabled?: boolean
  ): React.ReactElement | null {
    const Component = this.components.get(spec.type);
    if (!Component) {
      console.warn(`Unknown control type: ${spec.type}`);
      return null;
    }
    
    return React.createElement(Component, {
      spec,
      value,
      onChange,
      context,
      disabled,
      key: spec.id as string
    });
  }
  
  /**
   * Check if all dependencies for a control are satisfied
   */
  checkDependencies(
    spec: StandardControlSpec, 
    settings: ControlSettings
  ): { visible: boolean; enabled: boolean } {
    if (!spec.metadata?.dependencies) {
      return { visible: true, enabled: true };
    }
    
    let visible = true;
    let enabled = true;
    
    for (const dependency of spec.metadata.dependencies) {
      const dependentValue = getNestedProperty(settings, dependency.property as string);
      const conditionMet = dependency.condition(dependentValue);
      
      switch (dependency.effect) {
        case 'show':
          if (!conditionMet) visible = false;
          break;
        case 'hide':
          if (conditionMet) visible = false;
          break;
        case 'enable':
          if (!conditionMet) enabled = false;
          break;
        case 'disable':
          if (conditionMet) enabled = false;
          break;
      }
    }
    
    return { visible, enabled };
  }
}

// Singleton instance
const controlRenderer = new ControlRenderer();

/**
 * Hook to render controls from a RendererControlSpec
 */
export const useDeclarativeControls = (
  spec: RendererControlSpec,
  settings: ControlSettings,
  onSettingChange: (property: keyof ControlSettings, value: any) => void,
  rendererId: string
) => {
  const context: ControlRenderContext = useMemo(() => ({
    settings,
    rendererId,
    timestamp: Date.now(),
    deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop'
  }), [settings, rendererId]);
  
  // Group controls by category
  const controlsByCategory = useMemo(() => {
    const categories = new Map<string, (StandardControlSpec | CustomControlSpec)[]>();
    
    // Process standard controls
    spec.standard.forEach(control => {
      const category = control.category;
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(control);
    });
    
    // Process custom controls
    spec.custom?.forEach(control => {
      const category = control.category;
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(control);
    });
    
    return categories;
  }, [spec]);
  
  // Render function for standard controls
  const renderStandardControl = useCallback((control: StandardControlSpec) => {
    const value = getNestedProperty(settings, control.id as string);
    const { visible, enabled } = controlRenderer.checkDependencies(control, settings);
    
    if (!visible) return null;
    
    return controlRenderer.render(
      control,
      value,
      (newValue) => onSettingChange(control.id, newValue),
      context,
      !enabled
    );
  }, [settings, onSettingChange, context]);
  
  // Render function for custom controls
  const renderCustomControl = useCallback((control: CustomControlSpec) => {
    const Component = control.component;
    return React.createElement(Component, {
      key: control.id,
      spec: control,
      settings,
      onChange: onSettingChange,
      context
    });
  }, [settings, onSettingChange, context]);
  
  // Generate sections
  const sections = useMemo(() => {
    return Array.from(controlsByCategory.entries()).map(([categoryName, controls]) => ({
      title: categoryName,
      defaultOpen: categoryName === 'Basic' || categoryName === 'Colors', // Common categories open by default
      controls: controls.map(control => {
        if ('type' in control) {
          // Standard control
          return {
            type: 'rendered' as const,
            element: renderStandardControl(control),
            id: control.id as string
          };
        } else {
          // Custom control
          return {
            type: 'rendered' as const,
            element: renderCustomControl(control),
            id: control.id
          };
        }
      }).filter(c => c.element !== null) // Filter out hidden controls
    }));
  }, [controlsByCategory, renderStandardControl, renderCustomControl]);
  
  return {
    sections,
    controlRenderer,
    registerControlType: controlRenderer.register.bind(controlRenderer)
  };
};

/**
 * React component wrapper for declarative controls
 */
export const DeclarativeControlPanel: React.FC<{
  spec: RendererControlSpec;
  settings: ControlSettings;
  onSettingChange: (property: keyof ControlSettings, value: any) => void;
  rendererId: string;
  categoryOrder?: string[];
  className?: string;
}> = ({ spec, settings, onSettingChange, rendererId, categoryOrder, className = '' }) => {
  const { sections } = useDeclarativeControls(spec, settings, onSettingChange, rendererId);
  
  // Sort sections by categoryOrder if provided
  const orderedSections = categoryOrder 
    ? sections.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a.title);
        const indexB = categoryOrder.indexOf(b.title);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      })
    : sections;
  
  return (
    <div className={`declarative-control-panel space-y-4 ${className}`}>
      {orderedSections.map(section => (
        <ControlSection
          key={section.title}
          title={section.title}
          defaultOpen={section.defaultOpen}
        >
          <div className="space-y-4">
            {section.controls.map(control => (
              <div key={control.id}>
                {control.element}
              </div>
            ))}
          </div>
        </ControlSection>
      ))}
    </div>
  );
};

/**
 * Control section wrapper component
 */
const ControlSection: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="control-section">
      <button
        className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-t-lg text-left font-medium text-gray-200 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}>
          ▶
        </span>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-900 rounded-b-lg border-t border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
};