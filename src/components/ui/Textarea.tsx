import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  unstyled?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  unstyled = false,
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

  const finalClassName = unstyled
    ? className
    : `${baseStyles} ${className}`.trim();

  return <textarea ref={ref} className={finalClassName} {...props} />;
});

Textarea.displayName = 'Textarea';

export default Textarea;
