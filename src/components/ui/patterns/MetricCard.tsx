import React from 'react';

export interface MetricCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  value?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  compact?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  headerRight,
  compact = false,
  className = '',
  children,
  ...props
}) => {
  const baseClass = compact
    ? 'bg-gray-700/50 rounded-lg p-2'
    : 'bg-gray-700/50 rounded-lg p-3';

  return (
    <div className={`${baseClass} ${className}`.trim()} {...props}>
      {(title || headerRight) && (
        <div className="flex items-center justify-between mb-2">
          {title && <span className="text-sm font-medium text-gray-200">{title}</span>}
          {headerRight}
        </div>
      )}

      {value !== undefined && (
        <div className="text-sm text-gray-200">{value}</div>
      )}

      {subtitle && (
        <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
      )}

      {children}
    </div>
  );
};

export default MetricCard;
