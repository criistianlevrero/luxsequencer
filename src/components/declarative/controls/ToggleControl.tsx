import React from 'react';
import { Button, Checkbox, FieldLabel, RadioGroup, Switch } from '../../ui';
import type { ToggleControlProps } from '../../../types/declarativeControls';

/**
 * Advanced toggle control with multiple styles and states
 */
export const ToggleControl: React.FC<ToggleControlProps> = ({
  spec,
  value,
  onChange,
  context: _context,
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
          <FieldLabel label={spec.label} tooltip={spec.metadata?.tooltip} />
          
          <Switch
            checked={value}
            onChange={(checked) => {
              if (!disabled) {
                onChange(checked);
              }
            }}
            disabled={disabled}
            size="md"
          />
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
        <div className="flex items-center gap-3">
          <Checkbox
            checked={value}
            onChange={onChange}
            disabled={disabled}
          />
          
          <div className="flex-1">
            <FieldLabel label={spec.label} tooltip={spec.metadata?.tooltip} />
            {spec.metadata?.description && (
              <p className="text-sm text-gray-400">{spec.metadata.description}</p>
            )}
          </div>
        </div>
        
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
        <FieldLabel label={spec.label} tooltip={spec.metadata?.tooltip} />
        
        {spec.metadata?.description && (
          <p className="text-sm text-gray-400">{spec.metadata.description}</p>
        )}
        
        <Button
          variant={value ? 'primary' : 'secondary'}
          size="md"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {value 
            ? (constraints.onLabel || 'On')
            : (constraints.offLabel || 'Off')
          }
        </Button>
      </div>
    );
  }

  // Radio style (for boolean but styled like radio buttons)
  if (style === 'radio') {
    return (
      <div className="space-y-3">
        <FieldLabel label={spec.label} tooltip={spec.metadata?.tooltip} />
        
        {spec.metadata?.description && (
          <p className="text-sm text-gray-400">{spec.metadata.description}</p>
        )}
        
        <RadioGroup
          name={spec.id}
          value={value}
          onChange={(nextValue) => onChange(Boolean(nextValue))}
          disabled={disabled}
          options={[
            { label: constraints.onLabel || 'Yes', value: true },
            { label: constraints.offLabel || 'No', value: false },
          ]}
        />
      </div>
    );
  }

  // Fallback to switch if unknown style
  return null;
};