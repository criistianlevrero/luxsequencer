import React from 'react';

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: React.ReactNode;
  icon?: React.ReactNode;
  indicator?: React.ReactNode;
  actions?: React.ReactNode;
  titleClassName?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  heading,
  icon,
  indicator,
  actions,
  className = '',
  titleClassName = '',
  ...props
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`.trim()} {...props}>
      <div className="flex items-center space-x-2">
        {icon}
        <h3 className={`font-semibold ${titleClassName}`.trim()}>{heading}</h3>
        {indicator}
      </div>
      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </div>
  );
};

export default PanelHeader;
