import React from 'react';
import { ColorPicker, FieldLabel } from '../../ui';
import type { ColorControlProps } from '../../../types/declarativeControls';

/**
 * Advanced color control composed from reusable ui primitives
 */
export const ColorControl: React.FC<ColorControlProps> = ({
  spec,
  value,
  onChange,
  context: _context,
  disabled = false,
}) => {
  const constraints = spec.constraints.color!;

  const presets = spec.presets?.map((preset) => ({
    name: preset.name,
    value: String(preset.value),
  }));

  return (
    <div className="space-y-3">
      <FieldLabel
        label={spec.label}
        tooltip={spec.metadata?.tooltip}
        description={spec.metadata?.description}
      />

      <ColorPicker
        value={value}
        onChange={onChange}
        disabled={disabled}
        format={constraints.format}
        palette={constraints.palette}
        presets={presets}
      />
    </div>
  );
};
