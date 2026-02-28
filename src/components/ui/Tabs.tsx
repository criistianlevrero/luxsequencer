import React from 'react';

export interface TabItem {
  value: string;
  label: React.ReactNode;
  trailing?: React.ReactNode;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: TabItem[];
  activeValue: string;
  onValueChange: (value: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeValue,
  onValueChange,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex bg-gray-800 border-b border-gray-700 ${className}`.trim()} role="tablist" {...props}>
      {items.map((item) => {
        const isActive = item.value === activeValue;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onValueChange(item.value)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-gray-700 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="inline-flex items-center">
              {item.label}
              {item.trailing}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
