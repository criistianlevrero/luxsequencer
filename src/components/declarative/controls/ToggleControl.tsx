import React, { useState } from 'react';
import type { ToggleControlProps } from '../../types/declarativeControls';

/**
 * Advanced toggle control with multiple styles and states
 */
export const ToggleControl: React.FC<ToggleControlProps> = ({
  spec,
  value,
  onChange,
  context,
  disabled = false
}) => {
  const constraints = spec.constraints.toggle!;
  const style = constraints.style || 'switch';
  
  const handleToggle = () => {
    if (disabled) return;
    onChange(!value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  // Switch style (default)
  if (style === 'switch') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-300 flex items-center gap-2">
            {spec.label}
            {spec.metadata?.tooltip && (
              <TooltipIcon tooltip={spec.metadata.tooltip} />
            )}
          </label>
          
          {/* Switch component */}
          <button
            role="switch"
            aria-checked={value}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900
              ${disabled 
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer'
              }
              ${value 
                ? 'bg-cyan-600' 
                : 'bg-gray-600'
              }
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${value ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
        
        {spec.metadata?.description && (
          <p className="text-sm text-gray-400">{spec.metadata.description}</p>
        )}
        
        {/* Labels for on/off states */}
        {(constraints.onLabel || constraints.offLabel) && (
          <div className="text-sm text-gray-400">
            {value 
              ? (constraints.onLabel || 'On')
              : (constraints.offLabel || 'Off')
            }
          </div>
        )}
      </div>
    );
  }

  // Checkbox style
  if (style === 'checkbox') {
    return (
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={value}
              onChange={handleToggle}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="sr-only"
            />
            <div
              className={`
                w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                ${disabled 
                  ? 'border-gray-600 cursor-not-allowed opacity-50' 
                  : 'border-gray-500 cursor-pointer hover:border-gray-400'
                }
                ${value 
                  ? 'bg-cyan-600 border-cyan-600' 
                  : 'bg-transparent'
                }
              `}
            >
              {value && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="font-medium text-gray-300 flex items-center gap-2">
              {spec.label}
              {spec.metadata?.tooltip && (
                <TooltipIcon tooltip={spec.metadata.tooltip} />
              )}
            </div>
            {spec.metadata?.description && (
              <p className="text-sm text-gray-400">{spec.metadata.description}</p>
            )}
          </div>
        </label>
        
        {/* State indicator */}
        {(constraints.onLabel || constraints.offLabel) && (
          <div className="text-sm text-gray-400 ml-8">
            {value 
              ? (constraints.onLabel || 'Enabled')
              : (constraints.offLabel || 'Disabled')
            }
          </div>
        )}
      </div>
    );
  }

  // Button style
  if (style === 'button') {
    return (
      <div className="space-y-3">
        <label className="font-medium text-gray-300 flex items-center gap-2">
          {spec.label}
          {spec.metadata?.tooltip && (
            <TooltipIcon tooltip={spec.metadata.tooltip} />
          )}
        </label>
        
        {spec.metadata?.description && (
          <p className="text-sm text-gray-400">{spec.metadata.description}</p>
        )}
        
        <button
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900
            ${disabled 
              ? 'cursor-not-allowed opacity-50' 
              : 'cursor-pointer'
            }
            ${value 
              ? 'bg-cyan-600 text-white hover:bg-cyan-700' 
              : 'bg-gray-600 text-gray-200 hover:bg-gray-700'
            }
          `}
        >
          {value 
            ? (constraints.onLabel || 'On')
            : (constraints.offLabel || 'Off')
          }
        </button>
      </div>
    );
  }

  // Radio style (for boolean but styled like radio buttons)
  if (style === 'radio') {
    return (
      <div className="space-y-3">
        <label className="font-medium text-gray-300 flex items-center gap-2">
          {spec.label}
          {spec.metadata?.tooltip && (
            <TooltipIcon tooltip={spec.metadata.tooltip} />
          )}
        </label>
        
        {spec.metadata?.description && (
          <p className="text-sm text-gray-400">{spec.metadata.description}</p>
        )}
        
        <div className="flex gap-4">
          {/* True option */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="radio"
                name={spec.id}
                checked={value === true}
                onChange={() => onChange(true)}
                disabled={disabled}
                className="sr-only"
              />
              <div
                className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                  ${disabled 
                    ? 'border-gray-600 cursor-not-allowed opacity-50' 
                    : 'border-gray-500 cursor-pointer hover:border-gray-400'
                  }
                  ${value === true 
                    ? 'border-cyan-600' 
                    : ''
                  }
                `}
              >
                {value === true && (
                  <div className="w-2 h-2 rounded-full bg-cyan-600" />
                )}
              </div>
            </div>
            <span className="text-sm text-gray-300">
              {constraints.onLabel || 'Yes'}
            </span>
          </label>
          
          {/* False option */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="radio"
                name={spec.id}
                checked={value === false}
                onChange={() => onChange(false)}
                disabled={disabled}
                className="sr-only"
              />
              <div
                className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                  ${disabled 
                    ? 'border-gray-600 cursor-not-allowed opacity-50' 
                    : 'border-gray-500 cursor-pointer hover:border-gray-400'
                  }
                  ${value === false 
                    ? 'border-cyan-600' 
                    : ''
                  }
                `}
              >
                {value === false && (
                  <div className="w-2 h-2 rounded-full bg-cyan-600" />
                )}
              </div>
            </div>
            <span className="text-sm text-gray-300">
              {constraints.offLabel || 'No'}
            </span>
          </label>
        </div>
      </div>
    );
  }

  // Fallback to switch if unknown style
  return null;
};

/**
 * Tooltip icon component (shared)
 */
const TooltipIcon: React.FC<{ tooltip: string }> = ({ tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs text-gray-300 cursor-help">
        ?
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap z-10">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};