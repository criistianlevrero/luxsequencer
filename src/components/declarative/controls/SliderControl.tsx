import React, { useState, useRef, useCallback } from 'react';
import { Button, FieldLabel, Input } from '../../ui';
import type { SliderControlProps } from '../../../types/declarativeControls';

/**
 * Advanced slider control with detents, presets, and bipolar support
 */
export const SliderControl: React.FC<SliderControlProps> = ({
  spec,
  value,
  onChange,
  context: _context,
  disabled = false
}) => {
  const constraints = spec.constraints.slider!;
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);

  const isNumberValue = (input: unknown): input is number => typeof input === 'number' && Number.isFinite(input);

  // Calculate if we're near a detent
  const getNearestDetent = useCallback((val: number): number | null => {
    if (!constraints.detents) return null;
    
    const threshold = (constraints.max - constraints.min) * 0.02; // 2% threshold
    const nearest = constraints.detents.find(detent => Math.abs(val - detent) < threshold);
    return nearest || null;
  }, [constraints.detents, constraints.min, constraints.max]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    const detent = getNearestDetent(newValue);
    onChange(detent !== null ? detent : newValue);
  }, [onChange, getNearestDetent]);

  const handlePresetClick = useCallback((presetValue: number) => {
    onChange(presetValue);
    
    // Visual feedback
    if (sliderRef.current) {
      sliderRef.current.focus();
    }
  }, [onChange]);

  // Calculate percentage for visual indicators - handle undefined values
  const safeValue = isNumberValue(value)
    ? value
    : isNumberValue(constraints.defaultValue)
      ? constraints.defaultValue
      : constraints.min;
  const percentage = ((safeValue - constraints.min) / (constraints.max - constraints.min)) * 100;

  return (
    <div className="space-y-2">
      {/* Label with tooltip */}
      <div className="flex items-center justify-between">
        <FieldLabel label={spec.label} tooltip={spec.metadata?.tooltip} />
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono bg-gray-700 text-cyan-300 px-2 py-1 rounded">
            {constraints.formatter ? constraints.formatter(safeValue) : safeValue.toString()}
          </span>
          {spec.metadata?.units && (
            <span className="text-xs text-gray-400">{spec.metadata.units}</span>
          )}
        </div>
      </div>

      {/* Description */}
      {spec.metadata?.description && (
        <p className="text-sm text-gray-400">{spec.metadata.description}</p>
      )}

      {/* Slider container with detents */}
      <div className="relative">
        <input
          type="range"
          ref={sliderRef}
          min={constraints.min}
          max={constraints.max}
          step={constraints.step}
          value={safeValue}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          disabled={disabled}
          className={`
            w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer transition-all
            ${constraints.bipolar ? 'slider-bipolar' : ''}
            ${isDragging ? 'ring-2 ring-cyan-500/50' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}
          `}
          style={{
            background: constraints.bipolar 
              ? `linear-gradient(to right, 
                  #374151 0%, #374151 ${50 + percentage - 50}%, 
                  #06b6d4 ${50 + percentage - 50}%, #06b6d4 ${percentage}%,
                  #374151 ${percentage}%, #374151 100%)`
              : `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${percentage}%, #374151 ${percentage}%, #374151 100%)`
          }}
        />

        {/* Center mark for bipolar sliders */}
        {constraints.bipolar && (
          <div
            className="absolute w-0.5 h-4 bg-gray-400 transform -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: '50%' }}
          />
        )}

        {/* Detents visual indicators */}
        {constraints.detents?.map(detent => {
          const detentPercentage = ((detent - constraints.min) / (constraints.max - constraints.min)) * 100;
          const isActive = isNumberValue(value) && Math.abs(value - detent) < constraints.step;
          
          return (
            <div
              key={detent}
              className={`
                absolute w-1 h-6 rounded-full transform -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none transition-all
                ${isActive ? 'bg-cyan-400 shadow-lg' : 'bg-gray-500'}
              `}
              style={{ left: `${detentPercentage}%` }}
            />
          );
        })}
      </div>

      {/* Value input for precise control */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={safeValue}
          onChange={(e) => {
            const newValue = Number(e.target.value);
            if (newValue >= constraints.min && newValue <= constraints.max) {
              onChange(newValue);
            }
          }}
          min={constraints.min}
          max={constraints.max}
          step={constraints.step}
          disabled={disabled}
          className="w-20"
        />
        
        {/* Reset to default if it exists */}
        {spec.metadata?.presets?.find(p => p.name.toLowerCase() === 'default') && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const defaultPreset = spec.metadata!.presets!.find(p => p.name.toLowerCase() === 'default');
              if (defaultPreset && isNumberValue(defaultPreset.value)) onChange(defaultPreset.value);
            }}
            disabled={disabled}
            className="px-2"
            title="Reset to default"
          >
            ↻
          </Button>
        )}
      </div>

      {/* Presets */}
      {spec.metadata?.presets && spec.metadata.presets.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {spec.metadata.presets.map(preset => (
            <Button
              key={preset.name}
              variant="secondary"
              size="sm"
              onClick={() => {
                if (isNumberValue(preset.value)) {
                  handlePresetClick(preset.value);
                }
              }}
              disabled={disabled}
              className={`
                text-xs px-2 border
                ${safeValue === preset.value 
                  ? 'bg-cyan-600 border-cyan-500 text-white'
                  : 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={preset.description}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      )}

      {/* Logarithmic scale indicator */}
      {constraints.logarithmic && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span>📊</span>
          <span>Logarithmic scale</span>
        </div>
      )}
    </div>
  );
};