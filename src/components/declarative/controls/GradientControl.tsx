import React from 'react';
import type { GradientControlProps } from '../../../types/declarativeControls';
import GradientEditor from '../../controls/GradientEditor';
import { Button, FieldLabel } from '../../ui';
import type { GradientColor } from '../../../types';

/**
 * Advanced gradient control using existing GradientEditor
 */
export const GradientControl: React.FC<GradientControlProps> = ({
  spec,
  value,
  onChange,
  context: _context,
  disabled = false
}) => {
  const constraints = spec.constraints.gradient!;

  // Handle the gradient value conversion
  const handleGradientChange = (newColors: GradientColor[]) => {
    if (disabled) return;
    
    if (constraints.format === 'css') {
      // Generate CSS gradient string
      const generateGradientCss = (colors: GradientColor[]) => {
        if (!colors || colors.length === 0) return 'transparent';
        if (colors.length === 1) return colors[0].color;

        const stops = [];
        colors.forEach((c, i) => {
          const position = i / (colors.length - 1) * 100;
          if (i > 0 && c.hardStop) {
            stops.push(`${colors[i-1].color} ${position}%`);
          }
          stops.push(`${c.color} ${position}%`);
        });
        
        return `linear-gradient(to right, ${stops.join(', ')})`;
      };
      
      onChange(generateGradientCss(newColors));
    } else {
      // Return array of GradientColor objects
      onChange(newColors);
    }
  };

  // Convert current value to GradientColor array for the editor
  const getGradientColors = (): GradientColor[] => {
    if (Array.isArray(value)) {
      // Already in the correct format
      return value;
    }
    
    if (typeof value === 'string') {
      // Try to parse CSS gradient or treat as solid color
      if ((value as string).startsWith('linear-gradient') || (value as string).startsWith('radial-gradient')) {
        // TODO: Parse CSS gradient - for now, return default
        return [
          { id: crypto.randomUUID(), color: '#000000', hardStop: false },
          { id: crypto.randomUUID(), color: '#ffffff', hardStop: false }
        ];
      } else {
        // Single color
        return [
          { id: crypto.randomUUID(), color: value as string, hardStop: false },
          { id: crypto.randomUUID(), color: value as string, hardStop: false }
        ];
      }
    }
    
    // Default fallback
    return [
      { id: crypto.randomUUID(), color: '#000000', hardStop: false },
      { id: crypto.randomUUID(), color: '#ffffff', hardStop: false }
    ];
  };

  return (
    <div className="space-y-3">
      <FieldLabel
        label={spec.label}
        tooltip={spec.metadata?.tooltip}
        description={spec.metadata?.description}
      />
      
      {/* Gradient Editor */}
      <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        <GradientEditor
          title={spec.label}
          colors={getGradientColors()}
          onColorsChange={handleGradientChange}
          minColors={constraints.minColors || 2}
        />
      </div>
      
      {/* Current gradient preview */}
      <div className="space-y-2">
        <div className="text-sm text-gray-400">Preview</div>
        <div 
          className="w-full h-8 rounded-lg border border-gray-600"
          style={{ 
            background: constraints.format === 'css' && typeof value === 'string'
              ? value
              : (() => {
                  const colors = getGradientColors();
                  if (colors.length === 1) return colors[0].color;
                  const stops = colors.map((c, i) => {
                    const position = i / (colors.length - 1) * 100;
                    return `${c.color} ${position}%`;
                  }).join(', ');
                  return `linear-gradient(to right, ${stops})`;
                })()
          }}
        />
      </div>
      
      {/* Format info */}
      {constraints.format && (
        <div className="text-xs text-gray-500">
          Format: {constraints.format === 'css' ? 'CSS Gradient' : 'Color Array'}
        </div>
      )}
      
      {/* Presets */}
      {spec.presets && spec.presets.length > 0 && (
        <div>
          <div className="text-sm text-gray-400 mb-2">Presets</div>
          <div className="grid grid-cols-2 gap-2">
            {spec.presets.map((preset, index) => (
              <Button
                key={index}
                onClick={() => onChange(preset.value)}
                disabled={disabled}
                unstyled
                className={`
                  h-8 rounded border border-gray-600 hover:border-gray-500 transition-colors relative overflow-hidden
                  ${disabled && 'opacity-50 cursor-not-allowed'}
                `}
                style={{ 
                  background: typeof preset.value === 'string' 
                    ? preset.value
                    : Array.isArray(preset.value) && preset.value.length > 0
                      ? (() => {
                          const colors = preset.value as GradientColor[];
                          if (colors.length === 1) return colors[0].color;
                          const stops = colors.map((c, i) => {
                            const position = i / (colors.length - 1) * 100;
                            return `${c.color} ${position}%`;
                          }).join(', ');
                          return `linear-gradient(to right, ${stops})`;
                        })()
                      : 'transparent'
                }}
                title={preset.name}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-xs opacity-0 hover:opacity-100 transition-opacity">
                  {preset.name}
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Color count info */}
      <div className="text-xs text-gray-500 flex justify-between">
        <span>{getGradientColors().length} colors</span>
        {constraints.maxColors && (
          <span>Max: {constraints.maxColors}</span>
        )}
      </div>
    </div>
  );
};