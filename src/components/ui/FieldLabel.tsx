import React from 'react';
import { Tooltip } from './Tooltip';

export interface FieldLabelProps {
  label: React.ReactNode;
  htmlFor?: string;
  tooltip?: string;
  description?: React.ReactNode;
  required?: boolean;
  size?: 'md' | 'sm' | 'xs';
  containerClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}

const sizeStyles: Record<NonNullable<FieldLabelProps['size']>, string> = {
  md: 'text-sm',
  sm: 'text-sm',
  xs: 'text-xs',
};

export const FieldLabel: React.FC<FieldLabelProps> = ({
  label,
  htmlFor,
  tooltip,
  description,
  required = false,
  size = 'sm',
  containerClassName = '',
  labelClassName = '',
  descriptionClassName = '',
}) => {
  const finalLabelClassName = [
    'font-medium text-gray-300 flex items-center gap-2',
    sizeStyles[size],
    labelClassName,
  ]
    .join(' ')
    .trim();

  return (
    <div className={containerClassName}>
      <label htmlFor={htmlFor} className={finalLabelClassName}>
        {label}
        {tooltip && (
          <Tooltip content={tooltip}>
            <span
              aria-label="Help"
              className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-600 text-xs text-gray-300"
            >
              ?
            </span>
          </Tooltip>
        )}
        {required && <span className="text-red-400">*</span>}
      </label>
      {description && (
        <p className={['mt-1 text-sm text-gray-400', descriptionClassName].join(' ').trim()}>
          {description}
        </p>
      )}
    </div>
  );
};

export default FieldLabel;
