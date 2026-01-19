import React from 'react';
import { Switch as HeadlessSwitch } from '@headlessui/react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: {
      track: 'h-4 w-7',
      thumb: 'h-3 w-3',
      translate: 'translate-x-3',
    },
    md: {
      track: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5',
    },
  };

  const classes = sizeClasses[size];

  return (
    <HeadlessSwitch.Group as="div" className={`flex items-center ${className}`}>
      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`
          ${classes.track}
          ${checked ? 'bg-cyan-500' : 'bg-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800
        `}
      >
        <span
          aria-hidden="true"
          className={`
            ${classes.thumb}
            ${checked ? classes.translate : 'translate-x-0'}
            pointer-events-none inline-block transform rounded-full bg-white shadow-lg ring-0 
            transition duration-200 ease-in-out
          `}
        />
      </HeadlessSwitch>
      
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <HeadlessSwitch.Label as="span" className="text-sm font-medium text-gray-200 cursor-pointer">
              {label}
            </HeadlessSwitch.Label>
          )}
          {description && (
            <HeadlessSwitch.Description as="span" className="text-sm text-gray-400">
              {description}
            </HeadlessSwitch.Description>
          )}
        </div>
      )}
    </HeadlessSwitch.Group>
  );
};