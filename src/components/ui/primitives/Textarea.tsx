import React from 'react';
import { uiDisabledState, uiFieldBase, uiFocusRing } from '../foundation/tokens';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  unstyled?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  unstyled = false,
  className = '',
  ...props
}, ref) => {
  const baseStyles = `${uiFieldBase} px-3 py-2 text-sm ${uiFocusRing} focus:border-cyan-500 ${uiDisabledState}`;

  const finalClassName = unstyled
    ? className
    : `${baseStyles} ${className}`.trim();

  return <textarea ref={ref} className={finalClassName} {...props} />;
});

Textarea.displayName = 'Textarea';

export default Textarea;
