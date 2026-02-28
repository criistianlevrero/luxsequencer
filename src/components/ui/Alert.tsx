import React from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  heading?: React.ReactNode;
  actions?: React.ReactNode;
}

const variantStyles: Record<AlertVariant, string> = {
  info: 'bg-cyan-900/40 border-cyan-700 text-cyan-100',
  success: 'bg-emerald-900/40 border-emerald-700 text-emerald-100',
  warning: 'bg-yellow-900/40 border-yellow-700 text-yellow-100',
  error: 'bg-red-900/60 border-red-700 text-red-200',
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  heading,
  actions,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'rounded-lg border px-4 py-3 text-sm';
  const finalClassName = `${baseStyles} ${variantStyles[variant]} ${className}`.trim();

  return (
    <div className={finalClassName} role="alert" {...props}>
      {heading && <strong className="font-bold block mb-2">{heading}</strong>}
      {children && <div>{children}</div>}
      {actions && <div className="mt-4 flex items-center space-x-3">{actions}</div>}
    </div>
  );
};

export default Alert;
