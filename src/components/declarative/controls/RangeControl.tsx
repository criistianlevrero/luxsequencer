import React, { useCallback, useMemo } from 'react';
import { Button, FieldLabel, Input, RangeSlider } from '../../ui';
import type { RangeControlProps } from '../../../types/declarativeControls';

/**
 * Advanced range control for selecting min/max values
 */
export const RangeControl: React.FC<RangeControlProps> = ({
  spec,
  value,
  onChange,
  context: _context,
  disabled = false
}) => {
  const constraints = spec.constraints.range!;

  // Ensure value is always a valid range
  const rangeValue = useMemo(() => {
    return Array.isArray(value) && value.length === 2 
      ? { min: Math.min(value[0], value[1]), max: Math.max(value[0], value[1]) }
      : { min: constraints.min, max: constraints.max };
  }, [value, constraints.min, constraints.max]);

  // Format value display
  const formatValue = useCallback((val: number) => {
    if (constraints.formatter) {
      return constraints.formatter(val);
    }
    return val.toFixed(constraints.step && constraints.step < 1 ? 2 : 0);
  }, [constraints]);

  return (
    <div className="space-y-3">
      <FieldLabel
        label={spec.label}
        tooltip={spec.metadata?.tooltip}
        description={spec.metadata?.description}
      />
      
      {/* Range display */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Range: {formatValue(rangeValue.min)} - {formatValue(rangeValue.max)}</span>
        <span>{formatValue(rangeValue.max - rangeValue.min)} span</span>
      </div>
      
      {/* Range slider */}
      <div className="relative px-2 py-4">
        <RangeSlider
          min={constraints.min}
          max={constraints.max}
          step={constraints.step || 0.01}
          value={rangeValue}
          onChange={onChange}
          disabled={disabled}
        />
        
        {/* Track labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatValue(constraints.min)}</span>
          <span>{formatValue(constraints.max)}</span>
        </div>
      </div>
      
      {/* Numeric inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel label="Min" size="sm" labelClassName="text-gray-400 block mb-1" />
          <Input
            type="number"
            value={rangeValue.min}
            onChange={(e) => {
              const newMin = Number(e.target.value);
              if (newMin >= constraints.min && newMin <= rangeValue.max) {
                onChange({ min: newMin, max: rangeValue.max });
              }
            }}
            min={constraints.min}
            max={rangeValue.max}
            step={constraints.step || 0.01}
            disabled={disabled}
            className="w-full"
          />
        </div>
        <div>
          <FieldLabel label="Max" size="sm" labelClassName="text-gray-400 block mb-1" />
          <Input
            type="number"
            value={rangeValue.max}
            onChange={(e) => {
              const newMax = Number(e.target.value);
              if (newMax <= constraints.max && newMax >= rangeValue.min) {
                onChange({ min: rangeValue.min, max: newMax });
              }
            }}
            min={rangeValue.min}
            max={constraints.max}
            step={constraints.step || 0.01}
            disabled={disabled}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Presets */}
      {spec.presets && spec.presets.length > 0 && (
        <div>
          <div className="text-sm text-gray-400 mb-2">Presets</div>
          <div className="flex gap-2 flex-wrap">
            {spec.presets.map((preset, index) => (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                onClick={() => onChange(preset.value)}
                disabled={disabled}
                className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};