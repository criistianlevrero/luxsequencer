import React from 'react';

export interface RadioOption<T = string> {
  label: React.ReactNode;
  value: T;
}

export interface RadioGroupProps<T = string> {
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: RadioOption<T>[];
  disabled?: boolean;
  className?: string;
}

export const RadioGroup = <T,>({
  name,
  value,
  onChange,
  options,
  disabled = false,
  className = '',
}: RadioGroupProps<T>) => {
  return (
    <div className={`flex gap-4 ${className}`.trim()}>
      {options.map((option) => {
        const checked = option.value === value;

        return (
          <label
            key={String(option.value)}
            className={`inline-flex items-center gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="relative">
              <input
                type="radio"
                name={name}
                checked={checked}
                onChange={() => onChange(option.value)}
                disabled={disabled}
                className="sr-only"
              />
              <span
                className={[
                  'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors',
                  disabled ? 'border-gray-600 opacity-50' : 'border-gray-500 hover:border-gray-400',
                  checked ? 'border-cyan-600' : '',
                ].join(' ').trim()}
              >
                {checked && <span className="h-2 w-2 rounded-full bg-cyan-600" />}
              </span>
            </span>
            <span className="text-sm text-gray-300">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
};

export default RadioGroup;
