import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const toneStyles: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'bg-gray-800',
  subtle: 'bg-gray-800/50',
};

const paddingStyles: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card: React.FC<CardProps> = ({
  tone = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'rounded-xl border border-gray-700 shadow-2xl';
  const finalClassName = `${baseStyles} ${toneStyles[tone]} ${paddingStyles[padding]} ${className}`.trim();

  return (
    <div className={finalClassName} {...props}>
      {children}
    </div>
  );
};

export default Card;
