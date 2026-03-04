import React, { useCallback, useMemo, useRef, useState } from 'react';

export interface RangeSliderValue {
  min: number;
  max: number;
}

export interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: RangeSliderValue | [number, number];
  onChange: (value: RangeSliderValue) => void;
  disabled?: boolean;
  className?: string;
  trackClassName?: string;
  activeTrackClassName?: string;
}

const isRangeSliderValue = (value: RangeSliderProps['value']): value is RangeSliderValue => (
  !Array.isArray(value)
  && typeof value === 'object'
  && value !== null
  && typeof value.min === 'number'
  && typeof value.max === 'number'
);

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step,
  value,
  onChange,
  disabled = false,
  className = '',
  trackClassName = '',
  activeTrackClassName = '',
}) => {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const safeValue = useMemo<RangeSliderValue>(() => {
    if (Array.isArray(value) && value.length === 2) {
      return { min: Math.min(value[0], value[1]), max: Math.max(value[0], value[1]) };
    }

    if (isRangeSliderValue(value)) {
      return { min: Math.min(value.min, value.max), max: Math.max(value.min, value.max) };
    }

    return { min, max };
  }, [value, min, max]);

  const valueToPercentage = useCallback((current: number) => ((current - min) / (max - min)) * 100, [min, max]);

  const positionToValue = useCallback((clientX: number) => {
    if (!trackRef.current) {
      return min;
    }

    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let next = min + percentage * (max - min);

    if (step && step > 0) {
      next = Math.round(next / step) * step;
    }

    return Math.max(min, Math.min(max, next));
  }, [max, min, step]);

  const handleTrackClick = useCallback((event: React.MouseEvent) => {
    if (disabled || isDragging) {
      return;
    }

    const next = positionToValue(event.clientX);
    const minDistance = Math.abs(next - safeValue.min);
    const maxDistance = Math.abs(next - safeValue.max);

    if (minDistance < maxDistance) {
      onChange({ min: next, max: safeValue.max });
    } else {
      onChange({ min: safeValue.min, max: next });
    }
  }, [disabled, isDragging, onChange, positionToValue, safeValue.max, safeValue.min]);

  const handleMouseDown = useCallback((event: React.MouseEvent, handle: 'min' | 'max') => {
    if (disabled) {
      return;
    }

    setIsDragging(handle);
    event.preventDefault();
  }, [disabled]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || disabled) {
      return;
    }

    const next = positionToValue(event.clientX);

    if (isDragging === 'min') {
      onChange({ min: Math.min(next, safeValue.max), max: safeValue.max });
      return;
    }

    onChange({ min: safeValue.min, max: Math.max(next, safeValue.min) });
  }, [disabled, isDragging, onChange, positionToValue, safeValue.max, safeValue.min]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

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

  const minPercentage = valueToPercentage(safeValue.min);
  const maxPercentage = valueToPercentage(safeValue.max);

  return (
    <div className={className}>
      <div
        ref={trackRef}
        className={[
          'relative h-2 cursor-pointer rounded-full bg-gray-700',
          disabled ? 'cursor-not-allowed opacity-50' : '',
          trackClassName,
        ].join(' ').trim()}
        onClick={handleTrackClick}
      >
        <div
          className={['absolute h-2 rounded-full bg-cyan-600', activeTrackClassName].join(' ').trim()}
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`,
          }}
        />

        <div
          className={[
            'absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-2 border-cyan-600 bg-white shadow-md cursor-grab',
            disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-110',
            isDragging === 'min' ? 'scale-125 cursor-grabbing ring-4 ring-cyan-500/30' : '',
          ].join(' ').trim()}
          style={{ left: `${minPercentage}%` }}
          onMouseDown={(event) => handleMouseDown(event, 'min')}
        />

        <div
          className={[
            'absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-2 border-cyan-600 bg-white shadow-md cursor-grab',
            disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-110',
            isDragging === 'max' ? 'scale-125 cursor-grabbing ring-4 ring-cyan-500/30' : '',
          ].join(' ').trim()}
          style={{ left: `${maxPercentage}%` }}
          onMouseDown={(event) => handleMouseDown(event, 'max')}
        />
      </div>
    </div>
  );
};

export default RangeSlider;
