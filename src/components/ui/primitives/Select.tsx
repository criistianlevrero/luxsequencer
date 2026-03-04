import React, { ReactNode, CSSProperties, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Listbox } from '@headlessui/react';
import { createPortal } from 'react-dom';
import { ChevronUpDownIcon, CheckIcon } from '../icons';

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
  variant?: 'default' | 'header';
  fullWidth?: boolean;
  id?: string;
  usePortal?: boolean;
}

interface SelectOptionsLayerProps {
  open: boolean;
  usePortal: boolean;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  options: SelectOption[];
}

const SelectOptionsLayer: React.FC<SelectOptionsLayerProps> = ({
  open,
  usePortal,
  buttonRef,
  options,
}) => {
  const [portalStyle, setPortalStyle] = useState<CSSProperties>({});

  const updatePortalPosition = useCallback(() => {
    if (!buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportMargin = 8;
    const maxAllowedWidth = Math.max(0, viewportWidth - viewportMargin * 2);

    let computedWidth = Math.min(rect.width, maxAllowedWidth);
    let computedLeft = rect.left;

    if (computedLeft + computedWidth > viewportWidth - viewportMargin) {
      computedLeft = viewportWidth - computedWidth - viewportMargin;
    }

    if (computedLeft < viewportMargin) {
      computedLeft = viewportMargin;
    }

    setPortalStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: computedLeft,
      width: computedWidth,
    });
  }, [buttonRef]);

  useLayoutEffect(() => {
    if (!open || !usePortal) {
      return;
    }

    updatePortalPosition();

    const handleViewportChange = () => updatePortalPosition();

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open, usePortal, updatePortalPosition]);

  const optionsClasses = usePortal
    ? 'z-[1000] box-border max-h-60 overflow-auto rounded-lg bg-gray-700 border border-gray-600 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm'
    : 'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-gray-700 border border-gray-600 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm';

  const optionsNode = (
    <Listbox.Options
      modal={false}
      className={optionsClasses}
      style={usePortal ? portalStyle : undefined}
    >
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
          {({ selected }) => (
            <>
              <div className="flex items-center">
                {option.icon && (
                  <span className="mr-2 shrink-0">{option.icon}</span>
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
  );

  return usePortal && typeof document !== 'undefined'
    ? createPortal(optionsNode, document.body)
    : optionsNode;
};

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  children,
  placeholder = 'Seleccionar...',
  disabled = false,
  className = '',
  size = 'md',
  variant = 'default',
  fullWidth = false,
  id,
  usePortal = true,
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  if (options) {
    const selectedOption = options.find(opt => opt.value === value);

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
    };

    const variantClasses = {
      default: 'bg-gray-700 border border-gray-600 text-gray-200',
      header: 'bg-gray-700/80 border border-gray-600 text-white hover:bg-gray-600',
    };

    const buttonClasses = `
      relative w-full cursor-default rounded-lg
      ${sizeClasses[size]} text-left
      ${variantClasses[variant]}
      focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `.trim();

    return (
      <div className={fullWidth ? 'w-full' : 'relative'}>
        <Listbox value={value} onChange={onChange} disabled={disabled}>
          {({ open }) => (
            <div className="relative">
              <Listbox.Button ref={buttonRef} className={buttonClasses}>
                <span className="flex items-center">
                  {selectedOption?.icon && (
                    <span className="mr-2 shrink-0">{selectedOption.icon}</span>
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

              <SelectOptionsLayer
                open={open}
                usePortal={usePortal}
                buttonRef={buttonRef}
                options={options}
              />
            </div>
          )}
        </Listbox>
      </div>
    );
  }

  const baseClasses = 'rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
  };

  const variantClasses = {
    default: 'bg-gray-700 border border-gray-600 text-gray-200',
    header: 'bg-gray-700/80 border border-gray-600 text-white hover:bg-gray-600',
  };

  const widthClasses = fullWidth ? 'w-full' : '';

  const finalClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`.trim();

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
