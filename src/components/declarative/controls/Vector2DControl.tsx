import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Vector2DControlProps } from '../../types/declarativeControls';

/**
 * Advanced 2D Vector control with interactive visualization
 */
export const Vector2DControl: React.FC<Vector2DControlProps> = ({
  spec,
  value,
  onChange,
  context,
  disabled = false
}) => {
  const constraints = spec.constraints.vector2d!;
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Convert value to canvas coordinates
  const valueToCanvas = useCallback((val: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const xPercent = (val.x - constraints.xRange[0]) / (constraints.xRange[1] - constraints.xRange[0]);
    const yPercent = (val.y - constraints.yRange[0]) / (constraints.yRange[1] - constraints.yRange[0]);
    
    return {
      x: xPercent * rect.width,
      y: (1 - yPercent) * rect.height // Flip Y axis
    };
  }, [constraints]);

  // Convert canvas coordinates to value
  const canvasToValue = useCallback((pos: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return value;
    
    const rect = canvas.getBoundingClientRect();
    const xPercent = pos.x / rect.width;
    const yPercent = 1 - (pos.y / rect.height); // Flip Y axis
    
    let newX = constraints.xRange[0] + xPercent * (constraints.xRange[1] - constraints.xRange[0]);
    let newY = constraints.yRange[0] + yPercent * (constraints.yRange[1] - constraints.yRange[0]);
    
    // Clamp values
    newX = Math.max(constraints.xRange[0], Math.min(constraints.xRange[1], newX));
    newY = Math.max(constraints.yRange[0], Math.min(constraints.yRange[1], newY));
    
    // Grid snap if enabled
    if (constraints.gridSnap && constraints.gridSize) {
      newX = Math.round(newX / constraints.gridSize) * constraints.gridSize;
      newY = Math.round(newY / constraints.gridSize) * constraints.gridSize;
    }
    
    return { x: newX, y: newY };
  }, [constraints, value]);

  // Handle mouse/touch events
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    
    setIsDragging(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const newValue = canvasToValue(pos);
    onChange(newValue);
    
    canvas.setPointerCapture(e.pointerId);
  }, [disabled, canvasToValue, onChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const newValue = canvasToValue(pos);
    onChange(newValue);
  }, [isDragging, disabled, canvasToValue, onChange]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Convert to polar coordinates if needed
  const toPolar = useCallback((val: { x: number; y: number }) => {
    const radius = Math.sqrt(val.x * val.x + val.y * val.y);
    const angle = Math.atan2(val.y, val.x) * (180 / Math.PI);
    return { radius, angle };
  }, []);

  const fromPolar = useCallback((radius: number, angle: number) => {
    const angleRad = angle * (Math.PI / 180);
    return {
      x: radius * Math.cos(angleRad),
      y: radius * Math.sin(angleRad)
    };
  }, []);

  const polar = toPolar(value);
  const canvasPos = valueToCanvas(value);

  if (constraints.polarMode) {
    // Polar mode: show as speed + angle
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
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Speed</label>
            <input
              type="range"
              min={0}
              max={Math.max(...constraints.xRange.map(Math.abs), ...constraints.yRange.map(Math.abs))}
              step={0.01}
              value={polar.radius}
              onChange={(e) => {
                const newRadius = Number(e.target.value);
                const newValue = fromPolar(newRadius, polar.angle);
                onChange(newValue);
              }}
              disabled={disabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-500 mt-1">{polar.radius.toFixed(2)}</div>
          </div>
          
          <div>
            <label className="text-sm text-gray-400 block mb-1">Angle</label>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={polar.angle}
              onChange={(e) => {
                const newAngle = Number(e.target.value);
                const newValue = fromPolar(polar.radius, newAngle);
                onChange(newValue);
              }}
              disabled={disabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-500 mt-1">{polar.angle.toFixed(1)}°</div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          Cartesian: X: {value.x.toFixed(3)}, Y: {value.y.toFixed(3)}
        </div>
      </div>
    );
  }

  // Normal X/Y mode with 2D visualization
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
      
      {/* 2D Interactive Visualization */}
      <div
        ref={canvasRef}
        className={`
          relative w-full h-32 bg-gray-800 rounded-lg border-2 cursor-crosshair
          ${disabled ? 'opacity-50 cursor-not-allowed border-gray-600' : 'border-gray-600 hover:border-gray-500'}
          ${isDragging ? 'border-cyan-500 ring-2 ring-cyan-500/20' : ''}
        `}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Grid lines if enabled */}
        {constraints.gridSnap && constraints.gridSize && (
          <>
            {/* Vertical grid lines */}
            {Array.from({ length: Math.floor((constraints.xRange[1] - constraints.xRange[0]) / constraints.gridSize) + 1 }).map((_, i) => {
              const x = (i * constraints.gridSize!) / (constraints.xRange[1] - constraints.xRange[0]) * 100;
              return (
                <div
                  key={`v-${i}`}
                  className="absolute w-px h-full bg-gray-700 opacity-50"
                  style={{ left: `${x}%` }}
                />
              );
            })}
            
            {/* Horizontal grid lines */}
            {Array.from({ length: Math.floor((constraints.yRange[1] - constraints.yRange[0]) / constraints.gridSize) + 1 }).map((_, i) => {
              const y = (i * constraints.gridSize!) / (constraints.yRange[1] - constraints.yRange[0]) * 100;
              return (
                <div
                  key={`h-${i}`}
                  className="absolute w-full h-px bg-gray-700 opacity-50"
                  style={{ top: `${100 - y}%` }}
                />
              );
            })}
          </>
        )}
        
        {/* Center crosshair */}
        <div className="absolute w-full h-px bg-gray-600 opacity-30 top-1/2 transform -translate-y-1/2" />
        <div className="absolute w-px h-full bg-gray-600 opacity-30 left-1/2 transform -translate-x-1/2" />
        
        {/* Value indicator */}
        <div
          className={`
            absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 
            transition-all duration-100
            ${isDragging 
              ? 'bg-cyan-400 ring-4 ring-cyan-400/30 scale-125' 
              : 'bg-cyan-400 ring-2 ring-cyan-400/50 hover:scale-110'
            }
          `}
          style={{
            left: `${((value.x - constraints.xRange[0]) / (constraints.xRange[1] - constraints.xRange[0])) * 100}%`,
            top: `${(1 - (value.y - constraints.yRange[0]) / (constraints.yRange[1] - constraints.yRange[0])) * 100}%`
          }}
        />
        
        {/* Range indicators */}
        <div className="absolute top-1 left-1 text-xs text-gray-500">
          ({constraints.xRange[0]}, {constraints.yRange[1]})
        </div>
        <div className="absolute bottom-1 right-1 text-xs text-gray-500">
          ({constraints.xRange[1]}, {constraints.yRange[0]})
        </div>
      </div>
      
      {/* Numeric inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">X</label>
          <input
            type="number"
            value={value.x}
            onChange={(e) => {
              const newX = Number(e.target.value);
              if (newX >= constraints.xRange[0] && newX <= constraints.xRange[1]) {
                onChange({ ...value, x: newX });
              }
            }}
            min={constraints.xRange[0]}
            max={constraints.xRange[1]}
            step={constraints.gridSize || 0.01}
            disabled={disabled}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Y</label>
          <input
            type="number"
            value={value.y}
            onChange={(e) => {
              const newY = Number(e.target.value);
              if (newY >= constraints.yRange[0] && newY <= constraints.yRange[1]) {
                onChange({ ...value, y: newY });
              }
            }}
            min={constraints.yRange[0]}
            max={constraints.yRange[1]}
            step={constraints.gridSize || 0.01}
            disabled={disabled}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
          />
        </div>
      </div>
      
      {/* Polar coordinates display */}
      <div className="text-xs text-gray-500 flex justify-between">
        <span>Polar: r={polar.radius.toFixed(2)}, θ={polar.angle.toFixed(1)}°</span>
        {constraints.lockAspectRatio && (
          <span className="flex items-center gap-1">
            🔒 Aspect Locked
          </span>
        )}
      </div>
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