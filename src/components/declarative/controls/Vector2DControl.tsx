import React from 'react';
import { FieldLabel, Vector2DPicker } from '../../ui';
import type { Vector2DControlProps } from '../../../types/declarativeControls';

/**
 * Advanced 2D vector control composed from reusable ui primitives
 */
export const Vector2DControl: React.FC<Vector2DControlProps> = ({
  spec,
  value,
  onChange,
  context: _context,
  disabled = false,
}) => {
  const constraints = spec.constraints.vector2d!;

  const safeValue =
    value && typeof value === 'object' && typeof value.x === 'number' && typeof value.y === 'number'
      ? value
      : {
          x: (constraints.xRange[0] + constraints.xRange[1]) / 2,
          y: (constraints.yRange[0] + constraints.yRange[1]) / 2,
        };

  return (
    <div className="space-y-3">
      <FieldLabel
        label={spec.label}
        tooltip={spec.metadata?.tooltip}
        description={spec.metadata?.description}
      />

      <Vector2DPicker
        value={safeValue}
        onChange={onChange}
        xRange={constraints.xRange}
        yRange={constraints.yRange}
        disabled={disabled}
        lockAspectRatio={constraints.lockAspectRatio}
        polarMode={constraints.polarMode}
        gridSnap={constraints.gridSnap}
        gridSize={constraints.gridSize}
      />
    </div>
  );
};
