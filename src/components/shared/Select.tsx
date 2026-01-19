import React, { ReactNode, Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from './icons';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
  description?: string;
}

export interface SelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options?: SelectOption[];
  children?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  id?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  children,
  placeholder = "Seleccionar...",
  disabled = false,
  className = '',
  size = 'md',
  fullWidth = false,
  id,
}) => {
  // Si se proporcionan options, usamos Headless UI Listbox
  if (options) {
    const selectedOption = options.find(opt => opt.value === value);
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
    };
    
    const buttonClasses = `
      relative w-full cursor-default rounded-lg bg-gray-700 border border-gray-600 
      ${sizeClasses[size]} text-left text-gray-200 
      focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `.trim();

    return (
      <div className={fullWidth ? 'w-full' : 'relative'}>
        <Listbox value={value} onChange={onChange} disabled={disabled}>
          <div className="relative">
            <Listbox.Button className={buttonClasses}>
              <span className="flex items-center">
                {selectedOption?.icon && (
                  <span className="mr-2 flex-shrink-0">{selectedOption.icon}</span>
                )}
                <span className="block truncate">
                  {selectedOption?.label || placeholder}
                </span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-gray-700 border border-gray-600 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {options.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={({ active }) => `
                      relative cursor-default select-none py-2 pl-3 pr-9
                      ${active ? 'bg-cyan-600 text-white' : 'text-gray-200'}
                      ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          {option.icon && (
                            <span className="mr-2 flex-shrink-0">{option.icon}</span>
                          )}
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {option.label}
                          </span>
                        </div>
                        
                        {option.description && (
                          <span className="text-xs text-gray-400 ml-6">
                            {option.description}
                          </span>
                        )}
                        
                        {selected && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-cyan-400">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>
    );
  }

  // Fallback al select HTML nativo cuando se usan children
  const baseClasses = 'bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
  };
  
  const widthClasses = fullWidth ? 'w-full' : '';
  
  const finalClasses = `${baseClasses} ${sizeClasses[size]} ${widthClasses} ${className}`.trim();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <select
      id={id}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className={finalClasses}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
};