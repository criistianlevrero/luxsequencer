import React, { useState, useRef, useCallback } from 'react';
import type { SliderControlProps } from '../../types/declarativeControls';

/**
 * Advanced slider control with detents, presets, and bipolar support
 */
export const SliderControl: React.FC<SliderControlProps> = ({
  spec,
  value,
  onChange,
  context,
  disabled = false
}) => {
  const constraints = spec.constraints.slider!;
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);

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

  // Calculate percentage for visual indicators
  const percentage = ((value - constraints.min) / (constraints.max - constraints.min)) * 100;

  return (
    <div className="space-y-2">
      {/* Label with tooltip */}
      <div className="flex items-center justify-between">
        <label className="font-medium text-gray-300 flex items-center gap-2">
          {spec.label}
          {spec.metadata?.tooltip && (
            <TooltipIcon tooltip={spec.metadata.tooltip} />
          )}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono bg-gray-700 text-cyan-300 px-2 py-1 rounded">
            {constraints.formatter(value)}
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
          ref={sliderRef}
          type="range"
          min={constraints.min}
          max={constraints.max}
          step={constraints.step}
          value={value}
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
          const isActive = Math.abs(value - detent) < constraints.step;
          
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
        <input
          type="number"
          value={value}
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
          className="w-20 px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-gray-200 focus:border-cyan-500 focus:outline-none"
        />
        
        {/* Reset to default if it exists */}
        {spec.metadata?.presets?.find(p => p.name.toLowerCase() === 'default') && (
          <button
            onClick={() => {
              const defaultPreset = spec.metadata!.presets!.find(p => p.name.toLowerCase() === 'default');
              if (defaultPreset) onChange(defaultPreset.value);
            }}
            disabled={disabled}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors disabled:opacity-50"
            title="Reset to default"
          >
            ↻
          </button>
        )}
      </div>

      {/* Presets */}
      {spec.metadata?.presets && spec.metadata.presets.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {spec.metadata.presets.map(preset => (
            <button
              key={preset.name}
              onClick={() => handlePresetClick(preset.value)}
              disabled={disabled}
              className={`
                text-xs px-2 py-1 rounded transition-colors border
                ${value === preset.value 
                  ? 'bg-cyan-600 border-cyan-500 text-white'
                  : 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={preset.description}
            >
              {preset.name}
            </button>
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

/**
 * Tooltip icon component
 */
const TooltipIcon: React.FC<{ tooltip: string }> = ({ tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs text-gray-300 cursor-help">
        ?
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap z-10">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};