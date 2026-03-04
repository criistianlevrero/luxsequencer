import React from 'react';

export type SheetSide = 'left' | 'right' | 'top' | 'bottom';

export interface SheetProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  side?: SheetSide;
}

const sideStyles: Record<SheetSide, { position: string; border: string; open: string; closed: string }> = {
  left: {
    position: 'top-0 left-0 h-full',
    border: 'border-r border-gray-700',
    open: 'translate-x-0',
    closed: '-translate-x-full',
  },
  right: {
    position: 'top-0 right-0 h-full',
    border: 'border-l border-gray-700',
    open: 'translate-x-0',
    closed: 'translate-x-full',
  },
  top: {
    position: 'top-0 left-0 right-0',
    border: 'border-b border-gray-700',
    open: 'translate-y-0',
    closed: '-translate-y-full',
  },
  bottom: {
    position: 'bottom-0 left-0 right-0',
    border: 'border-t border-gray-700',
    open: 'translate-y-0',
    closed: 'translate-y-full',
  },
};

export const Sheet: React.FC<SheetProps> = ({
  open,
  side = 'left',
  className = '',
  children,
  ...props
}) => {
  const sideClass = sideStyles[side];

  const baseStyles = [
    'fixed z-40 bg-gray-800/90 backdrop-blur-sm shadow-2xl',
    'transition-transform duration-300 ease-in-out',
    sideClass.position,
    sideClass.border,
    open ? sideClass.open : sideClass.closed,
    className,
  ]
    .join(' ')
    .trim();

  return (
    <div className={baseStyles} {...props}>
      {children}
    </div>
  );
};

export default Sheet;
