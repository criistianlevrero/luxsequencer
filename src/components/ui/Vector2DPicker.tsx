import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FieldLabel } from './FieldLabel';
import { Input } from './Input';

export interface Vector2DValue {
  x: number;
  y: number;
}

export interface Vector2DPickerProps {
  value: Vector2DValue;
  onChange: (value: Vector2DValue) => void;
  xRange: [number, number];
  yRange: [number, number];
  disabled?: boolean;
  lockAspectRatio?: boolean;
  polarMode?: boolean;
  gridSnap?: boolean;
  gridSize?: number;
}

export const Vector2DPicker: React.FC<Vector2DPickerProps> = ({
  value,
  onChange,
  xRange,
  yRange,
  disabled = false,
  lockAspectRatio = false,
  polarMode = false,
  gridSnap = false,
  gridSize,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const safeValue = useMemo<Vector2DValue>(() => {
    if (value && typeof value.x === 'number' && typeof value.y === 'number') {
      return value;
    }
    return {
      x: (xRange[0] + xRange[1]) / 2,
      y: (yRange[0] + yRange[1]) / 2,
    };
  }, [value, xRange, yRange]);

  const canvasToValue = useCallback((position: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return safeValue;
    }

    const rect = canvas.getBoundingClientRect();
    const xPercent = position.x / rect.width;
    const yPercent = 1 - position.y / rect.height;

    let nextX = xRange[0] + xPercent * (xRange[1] - xRange[0]);
    let nextY = yRange[0] + yPercent * (yRange[1] - yRange[0]);

    nextX = Math.max(xRange[0], Math.min(xRange[1], nextX));
    nextY = Math.max(yRange[0], Math.min(yRange[1], nextY));

    if (gridSnap && gridSize) {
      nextX = Math.round(nextX / gridSize) * gridSize;
      nextY = Math.round(nextY / gridSize) * gridSize;
    }

    return { x: nextX, y: nextY };
  }, [gridSize, gridSnap, safeValue, xRange, yRange]);

  const toPolar = useCallback((nextValue: Vector2DValue) => {
    const radius = Math.sqrt(nextValue.x * nextValue.x + nextValue.y * nextValue.y);
    const angle = Math.atan2(nextValue.y, nextValue.x) * (180 / Math.PI);
    return { radius, angle };
  }, []);

  const fromPolar = useCallback((radius: number, angle: number) => {
    const angleRadians = angle * (Math.PI / 180);
    return {
      x: radius * Math.cos(angleRadians),
      y: radius * Math.sin(angleRadians),
    };
  }, []);

  const polar = toPolar(safeValue);

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (disabled) {
      return;
    }

    setIsDragging(true);

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const nextValue = canvasToValue({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });

    onChange(nextValue);
    canvas.setPointerCapture(event.pointerId);
  }, [canvasToValue, disabled, onChange]);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!isDragging || disabled) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const nextValue = canvasToValue({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });

    onChange(nextValue);
  }, [canvasToValue, disabled, isDragging, onChange]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (polarMode) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel label="Speed" size="sm" labelClassName="text-gray-400 block mb-1" />
            <Input
              type="range"
              min={0}
              max={Math.max(...xRange.map(Math.abs), ...yRange.map(Math.abs))}
              step={0.01}
              value={polar.radius}
              onChange={(event) => {
                const nextRadius = Number(event.target.value);
                onChange(fromPolar(nextRadius, polar.angle));
              }}
              disabled={disabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              unstyled
            />
            <div className="mt-1 text-xs text-gray-500">{polar.radius.toFixed(2)}</div>
          </div>

          <div>
            <FieldLabel label="Angle" size="sm" labelClassName="text-gray-400 block mb-1" />
            <Input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={polar.angle}
              onChange={(event) => {
                const nextAngle = Number(event.target.value);
                onChange(fromPolar(polar.radius, nextAngle));
              }}
              disabled={disabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              unstyled
            />
            <div className="mt-1 text-xs text-gray-500">{polar.angle.toFixed(1)}°</div>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Cartesian: X: {safeValue.x.toFixed(3)}, Y: {safeValue.y.toFixed(3)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        ref={canvasRef}
        className={[
          'relative h-32 w-full cursor-crosshair rounded-lg border-2 bg-gray-800',
          disabled ? 'cursor-not-allowed border-gray-600 opacity-50' : 'border-gray-600 hover:border-gray-500',
          isDragging ? 'border-cyan-500 ring-2 ring-cyan-500/20' : '',
        ].join(' ').trim()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {gridSnap && gridSize && (
          <>
            {Array.from({ length: Math.floor((xRange[1] - xRange[0]) / gridSize) + 1 }).map((_, index) => {
              const x = (index * gridSize) / (xRange[1] - xRange[0]) * 100;
              return <div key={`vertical-${index}`} className="absolute h-full w-px bg-gray-700 opacity-50" style={{ left: `${x}%` }} />;
            })}

            {Array.from({ length: Math.floor((yRange[1] - yRange[0]) / gridSize) + 1 }).map((_, index) => {
              const y = (index * gridSize) / (yRange[1] - yRange[0]) * 100;
              return <div key={`horizontal-${index}`} className="absolute h-px w-full bg-gray-700 opacity-50" style={{ top: `${100 - y}%` }} />;
            })}
          </>
        )}

        <div className="absolute top-1/2 h-px w-full -translate-y-1/2 transform bg-gray-600 opacity-30" />
        <div className="absolute left-1/2 h-full w-px -translate-x-1/2 transform bg-gray-600 opacity-30" />

        <div
          className={[
            'absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 transform rounded-full transition-all duration-100',
            isDragging ? 'scale-125 bg-cyan-400 ring-4 ring-cyan-400/30' : 'bg-cyan-400 ring-2 ring-cyan-400/50 hover:scale-110',
          ].join(' ').trim()}
          style={{
            left: `${((safeValue.x - xRange[0]) / (xRange[1] - xRange[0])) * 100}%`,
            top: `${(1 - (safeValue.y - yRange[0]) / (yRange[1] - yRange[0])) * 100}%`,
          }}
        />

        <div className="absolute left-1 top-1 text-xs text-gray-500">({xRange[0]}, {yRange[1]})</div>
        <div className="absolute bottom-1 right-1 text-xs text-gray-500">({xRange[1]}, {yRange[0]})</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel label="X" size="sm" labelClassName="text-gray-400 block mb-1" />
          <Input
            type="number"
            value={safeValue.x}
            onChange={(event) => {
              const nextX = Number(event.target.value);
              if (nextX >= xRange[0] && nextX <= xRange[1]) {
                onChange({ ...safeValue, x: nextX });
              }
            }}
            min={xRange[0]}
            max={xRange[1]}
            step={gridSize || 0.01}
            disabled={disabled}
            className="w-full"
          />
        </div>

        <div>
          <FieldLabel label="Y" size="sm" labelClassName="text-gray-400 block mb-1" />
          <Input
            type="number"
            value={safeValue.y}
            onChange={(event) => {
              const nextY = Number(event.target.value);
              if (nextY >= yRange[0] && nextY <= yRange[1]) {
                onChange({ ...safeValue, y: nextY });
              }
            }}
            min={yRange[0]}
            max={yRange[1]}
            step={gridSize || 0.01}
            disabled={disabled}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>Polar: r={polar.radius.toFixed(2)}, θ={polar.angle.toFixed(1)}°</span>
        {lockAspectRatio && (
          <span className="flex items-center gap-1">🔒 Aspect Locked</span>
        )}
      </div>
    </div>
  );
};

export default Vector2DPicker;
