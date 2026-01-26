import React, { useState, useRef, useCallback } from 'react';
import type { RangeControlProps } from '../../types/declarativeControls';

/**
 * Advanced range control for selecting min/max values
 */
export const RangeControl: React.FC<RangeControlProps> = ({
  spec,
  value,
  onChange,
  context,
  disabled = false
}) => {
  const constraints = spec.constraints.range!;
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Ensure value is always a valid range
  const rangeValue = Array.isArray(value) && value.length === 2 
    ? { min: Math.min(value[0], value[1]), max: Math.max(value[0], value[1]) }
    : { min: constraints.min, max: constraints.max };

  // Convert position to value
  const positionToValue = useCallback((clientX: number) => {
    if (!trackRef.current) return constraints.min;
    
    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let newValue = constraints.min + percentage * (constraints.max - constraints.min);
    
    // Apply step if specified
    if (constraints.step) {
      newValue = Math.round(newValue / constraints.step) * constraints.step;
    }
    
    return Math.max(constraints.min, Math.min(constraints.max, newValue));
  }, [constraints]);

  // Convert value to percentage position
  const valueToPercentage = useCallback((val: number) => {
    return ((val - constraints.min) / (constraints.max - constraints.min)) * 100;
  }, [constraints]);

  // Handle mouse/touch events
  const handleMouseDown = useCallback((e: React.MouseEvent, handle: 'min' | 'max') => {
    if (disabled) return;
    
    setIsDragging(handle);
    e.preventDefault();
  }, [disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || disabled) return;
    
    const newValue = positionToValue(e.clientX);
    
    if (isDragging === 'min') {
      onChange([Math.min(newValue, rangeValue.max), rangeValue.max]);
    } else if (isDragging === 'max') {
      onChange([rangeValue.min, Math.max(newValue, rangeValue.min)]);
    }
  }, [isDragging, disabled, positionToValue, onChange, rangeValue]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Global mouse events
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle track click (set closest handle)
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (disabled || isDragging) return;
    
    const newValue = positionToValue(e.clientX);
    const minDistance = Math.abs(newValue - rangeValue.min);
    const maxDistance = Math.abs(newValue - rangeValue.max);
    
    if (minDistance < maxDistance) {
      onChange([newValue, rangeValue.max]);
    } else {
      onChange([rangeValue.min, newValue]);
    }
  }, [disabled, isDragging, positionToValue, onChange, rangeValue]);

  // Format value display
  const formatValue = useCallback((val: number) => {
    if (constraints.formatter) {
      return constraints.formatter(val);
    }
    return val.toFixed(constraints.step && constraints.step < 1 ? 2 : 0);
  }, [constraints]);

  const minPercentage = valueToPercentage(rangeValue.min);
  const maxPercentage = valueToPercentage(rangeValue.max);

  return (
    <div className="space-y-3">
      <label className="font-medium text-gray-300 flex items-center gap-2">
        {spec.label}
        {spec.metadata?.tooltip && (
          <TooltipIcon tooltip={spec.metadata.tooltip} />
        )}
      </label>
      
      {spec.metadata?.description && (
        <p className="text-sm text-gray-400">{spec.metadata.description}</p>
      )}
      
      {/* Range display */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Range: {formatValue(rangeValue.min)} - {formatValue(rangeValue.max)}</span>
        <span>{formatValue(rangeValue.max - rangeValue.min)} span</span>
      </div>
      
      {/* Range slider */}
      <div className="relative px-2 py-4">
        {/* Track */}
        <div
          ref={trackRef}
          className={`
            relative h-2 bg-gray-700 rounded-full cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={handleTrackClick}
        >
          {/* Active range */}
          <div
            className="absolute h-2 bg-cyan-600 rounded-full"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`
            }}
          />
          
          {/* Min handle */}
          <div
            className={`
              absolute w-5 h-5 bg-white border-2 border-cyan-600 rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 top-1/2 cursor-grab
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
              ${isDragging === 'min' ? 'scale-125 cursor-grabbing ring-4 ring-cyan-500/30' : ''}
            `}
            style={{ left: `${minPercentage}%` }}
            onMouseDown={(e) => handleMouseDown(e, 'min')}
          />
          
          {/* Max handle */}
          <div
            className={`
              absolute w-5 h-5 bg-white border-2 border-cyan-600 rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 top-1/2 cursor-grab
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
              ${isDragging === 'max' ? 'scale-125 cursor-grabbing ring-4 ring-cyan-500/30' : ''}
            `}
            style={{ left: `${maxPercentage}%` }}
            onMouseDown={(e) => handleMouseDown(e, 'max')}
          />
        </div>
        
        {/* Track labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatValue(constraints.min)}</span>
          <span>{formatValue(constraints.max)}</span>
        </div>
      </div>
      
      {/* Numeric inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">Min</label>
          <input
            type="number"
            value={rangeValue.min}
            onChange={(e) => {
              const newMin = Number(e.target.value);
              if (newMin >= constraints.min && newMin <= rangeValue.max) {
                onChange([newMin, rangeValue.max]);
              }
            }}
            min={constraints.min}
            max={rangeValue.max}
            step={constraints.step || 0.01}
            disabled={disabled}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Max</label>
          <input
            type="number"
            value={rangeValue.max}
            onChange={(e) => {
              const newMax = Number(e.target.value);
              if (newMax <= constraints.max && newMax >= rangeValue.min) {
                onChange([rangeValue.min, newMax]);
              }
            }}
            min={rangeValue.min}
            max={constraints.max}
            step={constraints.step || 0.01}
            disabled={disabled}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
          />
        </div>
      </div>
      
      {/* Presets */}
      {spec.presets && spec.presets.length > 0 && (
        <div>
          <div className="text-sm text-gray-400 mb-2">Presets</div>
          <div className="flex gap-2 flex-wrap">
            {spec.presets.map((preset, index) => (
              <button
                key={index}
                onClick={() => onChange(preset.value)}
                disabled={disabled}
                className={`
                  px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600
                  ${disabled && 'opacity-50 cursor-not-allowed'}
                `}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Tooltip icon component (shared)
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