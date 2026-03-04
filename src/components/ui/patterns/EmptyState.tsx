import React from 'react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  heading: React.ReactNode;
  description?: React.ReactNode;
  hint?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  heading,
  description,
  hint,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full h-full flex items-center justify-center text-gray-400 ${className}`.trim()} {...props}>
      <div className="text-center space-y-2">
        {icon && <div className="text-2xl text-cyan-400">{icon}</div>}
        <div className="text-lg font-medium">{heading}</div>
        {description && <div className="text-sm opacity-75">{description}</div>}
        {hint && <div className="text-xs opacity-50">{hint}</div>}
      </div>
    </div>
  );
};

export default EmptyState;
