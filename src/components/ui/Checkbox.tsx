import React from 'react';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className = '',
  labelClassName = '',
}) => {
  return (
    <label className={`inline-flex items-center gap-3 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`.trim()}>
      <span className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <span
          className={[
            'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
            disabled ? 'border-gray-600 opacity-50' : 'border-gray-500 hover:border-gray-400',
            checked ? 'border-cyan-600 bg-cyan-600' : 'bg-transparent',
          ].join(' ').trim()}
        >
          {checked && (
            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </span>
      </span>
      {label !== undefined && (
        <span className={`text-sm text-gray-300 ${labelClassName}`.trim()}>{label}</span>
      )}
    </label>
  );
};

export default Checkbox;
