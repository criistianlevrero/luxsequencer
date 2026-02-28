import React from 'react';

export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  valueClassName?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  subtitle,
  className = '',
  valueClassName = '',
  ...props
}) => {
  return (
    <div className={`rounded-lg p-3 ${className}`.trim()} {...props}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{label}</span>
        <span className={`text-lg font-medium ${valueClassName}`.trim()}>{value}</span>
      </div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
};

export default StatTile;
