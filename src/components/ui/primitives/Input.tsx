import React from 'react';
import { uiDisabledState, uiFieldBase, uiFocusRing } from '../foundation/tokens';

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
  const baseStyles = `${uiFieldBase} ${uiFocusRing} focus:border-cyan-500 ${uiDisabledState}`;

  const finalClassName = unstyled
    ? className
    : `${baseStyles} ${sizeStyles[inputSize]} ${className}`.trim();

  return <input ref={ref} className={finalClassName} {...props} />;
});

Input.displayName = 'Input';

export default Input;
