
import React from 'react';

interface SliderInputProps {
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
      <input
        id={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
    </div>
  );
};

export default SliderInput;
