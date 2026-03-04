import React from 'react';
import { MetricCard } from './MetricCard';

export interface MiniChartCardProps {
  title: string;
  points: string;
  stroke: string;
  currentLabel: string;
  minLabel: string;
  maxLabel: string;
  className?: string;
}

export const MiniChartCard: React.FC<MiniChartCardProps> = ({
  title,
  points,
  stroke,
  currentLabel,
  minLabel,
  maxLabel,
  className = '',
}) => {
  return (
    <MetricCard
      className={className}
      title={title}
      headerRight={<span className="text-sm text-gray-200">{currentLabel}</span>}
    >
      <div className="relative h-16">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </MetricCard>
  );
};

export default MiniChartCard;
