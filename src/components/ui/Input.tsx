import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: 'sm' | 'md';
  unstyled?: boolean;
}

const sizeStyles = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-3 py-2 text-sm',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  inputSize = 'md',
  unstyled = false,
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

  const finalClassName = unstyled
    ? className
    : `${baseStyles} ${sizeStyles[inputSize]} ${className}`.trim();

  return <input ref={ref} className={finalClassName} {...props} />;
});

Input.displayName = 'Input';

export default Input;
