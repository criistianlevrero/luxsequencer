import React from 'react';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  unstyled?: boolean;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(({ 
  unstyled = false,
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed';

  const finalClassName = unstyled
    ? className
    : `${baseStyles} ${className}`.trim();

  return <input ref={ref} type="range" className={finalClassName} {...props} />;
});

Slider.displayName = 'Slider';

export default Slider;
