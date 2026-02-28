import React from 'react';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  heading,
  description,
  icon = '⚠️',
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full h-full flex items-center justify-center text-red-200 ${className}`.trim()} {...props}>
      <div className="text-center p-4 space-y-2">
        <div className="text-2xl">{icon}</div>
        <h2 className="text-lg font-bold">{heading}</h2>
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
    </div>
  );
};

export default ErrorState;
