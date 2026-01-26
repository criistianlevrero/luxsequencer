import React, { useState, useRef, useCallback } from 'react';
import type { TextControlProps } from '../../types/declarativeControls';

/**
 * Advanced text input control with validation, multiline, and formatting
 */
export const TextControl: React.FC<TextControlProps> = ({
  spec,
  value,
  onChange,
  context,
  disabled = false
}) => {
  const constraints = spec.constraints.text!;
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Validate input
  const validateInput = useCallback((inputValue: string) => {
    // Length validation
    if (constraints.minLength && inputValue.length < constraints.minLength) {
      return `Minimum ${constraints.minLength} characters required`;
    }
    if (constraints.maxLength && inputValue.length > constraints.maxLength) {
      return `Maximum ${constraints.maxLength} characters allowed`;
    }
    
    // Pattern validation
    if (constraints.pattern && !constraints.pattern.test(inputValue)) {
      return constraints.patternError || 'Invalid format';
    }
    
    // Custom validation
    if (constraints.validator) {
      const result = constraints.validator(inputValue);
      if (typeof result === 'string') {
        return result;
      }
      if (!result) {
        return 'Invalid input';
      }
    }
    
    return null;
  }, [constraints]);

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Apply formatter if provided
    const formattedValue = constraints.formatter ? constraints.formatter(newValue) : newValue;
    
    // Validate
    const error = validateInput(formattedValue);
    setValidationError(error);
    
    // Only call onChange if valid or if allowInvalid is true
    if (!error || constraints.allowInvalid) {
      onChange(formattedValue);
    }
  }, [constraints, validateInput, onChange]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Final validation on blur
    const error = validateInput(value);
    setValidationError(error);
  }, [value, validateInput]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea && constraints.autoResize) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [constraints.autoResize]);

  // Adjust height on value change
  React.useEffect(() => {
    if (constraints.multiline && constraints.autoResize) {
      adjustTextareaHeight();
    }
  }, [value, constraints.multiline, constraints.autoResize, adjustTextareaHeight]);

  const hasError = validationError !== null;
  const characterCount = value.length;
  const showCharacterCount = constraints.showCharacterCount && constraints.maxLength;

  // Common input props
  const commonProps = {
    value,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    disabled,
    placeholder: spec.placeholder || '',
    maxLength: constraints.maxLength,
    className: `
      w-full px-3 py-2 bg-gray-700 border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none transition-colors
      ${disabled 
        ? 'border-gray-600 cursor-not-allowed opacity-50' 
        : hasError
          ? 'border-red-500 focus:border-red-400'
          : isFocused
            ? 'border-cyan-500 ring-2 ring-cyan-500/20'
            : 'border-gray-600 hover:border-gray-500'
      }
      ${constraints.multiline ? 'resize-none' : ''}
    `
  };

  return (
    <div className="space-y-3">
      <label className="font-medium text-gray-300 flex items-center gap-2">
        {spec.label}
        {spec.metadata?.tooltip && (
          <TooltipIcon tooltip={spec.metadata.tooltip} />
        )}
        {constraints.required && (
          <span className="text-red-400 text-sm">*</span>
        )}
      </label>
      
      {spec.metadata?.description && (
        <p className="text-sm text-gray-400">{spec.metadata.description}</p>
      )}
      
      <div className="relative">
        {/* Input/Textarea */}
        {constraints.multiline ? (
          <textarea
            ref={textareaRef}
            {...commonProps}
            rows={constraints.rows || 3}
            onInput={adjustTextareaHeight}
          />
        ) : (
          <input
            type={constraints.inputType || 'text'}
            {...commonProps}
          />
        )}
        
        {/* Clear button */}
        {value && !disabled && constraints.clearable && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
            title="Clear"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Character count */}
      {showCharacterCount && (
        <div className={`text-sm text-right ${
          constraints.maxLength && characterCount > constraints.maxLength * 0.9
            ? characterCount >= constraints.maxLength
              ? 'text-red-400'
              : 'text-yellow-400'
            : 'text-gray-500'
        }`}>
          {characterCount} / {constraints.maxLength}
        </div>
      )}
      
      {/* Validation error */}
      {hasError && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {validationError}
        </p>
      )}
      
      {/* Presets */}
      {spec.presets && spec.presets.length > 0 && (
        <div>
          <div className="text-sm text-gray-400 mb-2">Presets</div>
          <div className="flex gap-2 flex-wrap">
            {spec.presets.map((preset, index) => (
              <button
                key={index}
                onClick={() => onChange(preset.value)}
                disabled={disabled}
                className={`
                  px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600
                  ${disabled && 'opacity-50 cursor-not-allowed'}
                `}
                title={preset.value}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Format hints */}
      {constraints.formatHints && constraints.formatHints.length > 0 && (
        <div className="text-xs text-gray-500">
          <div className="font-medium mb-1">Format examples:</div>
          <ul className="list-disc list-inside space-y-1">
            {constraints.formatHints.map((hint, index) => (
              <li key={index}>{hint}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
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