import React from 'react';
import { Slider } from '../primitives';

export interface SliderInputProps {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min: number;
  max: number;
  step: number;
  valueFormatter?: (value: number) => string;
}

const SliderInput: React.FC<SliderInputProps> = ({ label, value, onChange, min, max, step, valueFormatter }) => {
  const displayValue = valueFormatter ? valueFormatter(value) : `${value}px`;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label htmlFor={label} className="font-medium text-gray-300">
          {label}
        </label>
        <span className="text-sm font-mono bg-gray-700 text-cyan-300 px-2 py-1 rounded">
          {displayValue}
        </span>
      </div>
      <Slider
        id={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default SliderInput;
