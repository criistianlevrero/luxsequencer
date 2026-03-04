import React from 'react';
import { uiDisabledState, uiFocusRing } from '../foundation/tokens';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  unstyled?: boolean;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(({ 
  unstyled = false,
  className = '',
  ...props
}, ref) => {
  const baseStyles = `range range-primary w-full ${uiFocusRing} ${uiDisabledState}`;

  const finalClassName = unstyled
    ? className
    : `${baseStyles} ${className}`.trim();

  return <input ref={ref} type="range" className={finalClassName} {...props} />;
});

Slider.displayName = 'Slider';

export default Slider;
