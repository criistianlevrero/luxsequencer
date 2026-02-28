import React, { useState, useRef, useEffect } from 'react';
import { Button, Input } from '../../ui';
import type { SelectControlProps, SelectOption } from '../../../types/declarativeControls';

/**
 * Advanced select control with search, multi-select, and grouping
 */
export const SelectControl: React.FC<SelectControlProps> = ({
  spec,
  value,
  onChange,
  context: _context,
  disabled = false
}) => {
  const constraints = spec.constraints.select!;
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle multi-select arrays
  const selectedValues = Array.isArray(value) ? value : [value];
  const isMultiSelect = constraints.multiSelect || false;

  // Group options if needed
  const processedOptions = React.useMemo(() => {
    if (constraints.allowGroups && constraints.options.some(opt => 'group' in opt)) {
      const groups: { [key: string]: SelectOption[] } = {};
      const ungrouped: SelectOption[] = [];
      
      constraints.options.forEach(option => {
        if ('group' in option && option.group) {
          const groupName = option.group;
          if (!groups[groupName]) groups[groupName] = [];
          groups[groupName].push(option);
        } else {
          ungrouped.push(option);
        }
      });
      
      return { grouped: groups, ungrouped };
    }
    
    return { grouped: {}, ungrouped: constraints.options };
  }, [constraints.options, constraints.allowGroups]);

  // Filter options by search
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return processedOptions;
    
    const filterFn = (option: typeof constraints.options[0]) => {
      const searchLower = searchTerm.toLowerCase();
      return option.label.toLowerCase().includes(searchLower) ||
             (option.description?.toLowerCase().includes(searchLower));
    };
    
    return {
      grouped: Object.fromEntries(
        Object.entries(processedOptions.grouped).map(([group, options]) => [
          group,
          options.filter(filterFn)
        ]).filter(([, options]) => options.length > 0)
      ),
      ungrouped: processedOptions.ungrouped.filter(filterFn)
    };
  }, [processedOptions, searchTerm, constraints]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && constraints.searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, constraints.searchable]);

  const handleOptionSelect = (optionValue: string) => {
    if (isMultiSelect) {
      if (selectedValues.includes(optionValue)) {
        // Remove from selection
        const newSelection = selectedValues.filter(v => v !== optionValue);
        onChange(newSelection.length === 0 ? [] : newSelection);
      } else {
        // Add to selection
        onChange([...selectedValues, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange(isMultiSelect ? [] : '');
  };

  const getSelectedOption = (val: string) => {
    return constraints.options.find(opt => opt.value === val);
  };

  const getDisplayText = () => {
    if (isMultiSelect) {
      if (selectedValues.length === 0) return constraints.placeholder || 'Select options...';;
      if (selectedValues.length === 1) {
        const option = getSelectedOption(selectedValues[0]);
        return option?.label || selectedValues[0];
      }
      return `${selectedValues.length} selected`;
    } else {
      if (!value) return constraints.placeholder || 'Select an option...';
      const option = getSelectedOption(value as string);
      return option?.label || value;
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const allOptions = [
      ...filteredOptions.ungrouped,
      ...Object.values(filteredOptions.grouped).flat()
    ];

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < allOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : allOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && allOptions[highlightedIndex]) {
          handleOptionSelect((allOptions[highlightedIndex] as SelectOption).value);
        }
        break;
    }
  };

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
      
      <div className="relative" ref={dropdownRef}>
        {/* Select trigger */}
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
            w-full text-left bg-gray-700 border rounded-lg justify-between font-normal
            ${disabled 
              ? 'border-gray-600 text-gray-500 cursor-not-allowed' 
              : 'border-gray-600 text-gray-200 hover:border-gray-500 focus:border-cyan-500 focus:outline-none'
            }
            ${isOpen && 'border-cyan-500 ring-2 ring-cyan-500/20'}
          `}
        >
          <span className="truncate">{getDisplayText()}</span>
          <div className="flex items-center gap-2">
            {/* Clear button for multi-select or when value exists */}
            {((isMultiSelect && selectedValues.length > 0) || (!isMultiSelect && value)) && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) handleClear();
                }}
                className={`p-1 ${disabled ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}
                title="Clear selection"
                role="button"
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClear();
                  }
                }}
              >
                ✕
              </span>
            )}
            
            {/* Dropdown arrow */}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </Button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
            {/* Search input */}
            {constraints.searchable && (
              <div className="p-2 border-b border-gray-600">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
            
            {/* Options list */}
            <div className="overflow-y-auto max-h-48">
              {/* Ungrouped options */}
              {filteredOptions.ungrouped.map((option, index) => (
                <Button
                  variant="ghost"
                  size="sm"
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  className={`
                    w-full text-left justify-start rounded-none font-normal hover:bg-gray-700
                    ${selectedValues.includes(option.value) ? 'bg-cyan-600 text-white' : 'text-gray-200'}
                    ${highlightedIndex === index ? 'bg-gray-600' : ''}
                  `}
                >
                  {/* Multi-select checkbox */}
                  {isMultiSelect && (
                    <div className={`
                      w-4 h-4 rounded border border-gray-500 flex items-center justify-center
                      ${selectedValues.includes(option.value) ? 'bg-cyan-600 border-cyan-600' : ''}
                    `}>
                      {selectedValues.includes(option.value) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}
                  
                  {/* Option content */}
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-gray-400">{option.description}</div>
                    )}
                  </div>
                  
                  {/* Single select indicator */}
                  {!isMultiSelect && selectedValues.includes(option.value) && (
                    <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </Button>
              ))}
              
              {/* Grouped options */}
              {Object.entries(filteredOptions.grouped).map(([groupName, options]) => (
                <div key={groupName}>
                  <div className="px-3 py-1 text-sm font-medium text-gray-400 bg-gray-700/50 border-b border-gray-600">
                    {groupName}
                  </div>
                  {(options as SelectOption[]).map((option, groupIndex) => {
                    const globalIndex = filteredOptions.ungrouped.length + 
                      Object.entries(filteredOptions.grouped)
                        .slice(0, Object.keys(filteredOptions.grouped).indexOf(groupName))
                        .reduce((sum, [, opts]) => sum + (opts as SelectOption[]).length, 0) + groupIndex;
                    
                    return (
                      <Button
                        variant="ghost"
                        size="sm"
                        key={option.value}
                        onClick={() => handleOptionSelect(option.value)}
                        className={`
                          w-full text-left justify-start rounded-none font-normal pl-6 hover:bg-gray-700
                          ${selectedValues.includes(option.value) ? 'bg-cyan-600 text-white' : 'text-gray-200'}
                          ${highlightedIndex === globalIndex ? 'bg-gray-600' : ''}
                        `}
                      >
                        {/* Multi-select checkbox */}
                        {isMultiSelect && (
                          <div className={`
                            w-4 h-4 rounded border border-gray-500 flex items-center justify-center
                            ${selectedValues.includes(option.value) ? 'bg-cyan-600 border-cyan-600' : ''}
                          `}>
                            {selectedValues.includes(option.value) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        )}
                        
                        {/* Option content */}
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-sm text-gray-400">{option.description}</div>
                          )}
                        </div>
                        
                        {/* Single select indicator */}
                        {!isMultiSelect && selectedValues.includes(option.value) && (
                          <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </Button>
                    );
                  })}
                </div>
              ))}
              
              {/* No results message */}
              {filteredOptions.ungrouped.length === 0 && Object.keys(filteredOptions.grouped).length === 0 && (
                <div className="px-3 py-4 text-center text-gray-400">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Selected values display for multi-select */}
      {isMultiSelect && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedValues.map((val) => {
            const option = getSelectedOption(val);
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-600 text-white text-sm rounded"
              >
                {option?.label || val}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOptionSelect(val)}
                  disabled={disabled}
                  className="hover:bg-cyan-700 rounded p-0.5 h-5 w-5 min-h-0 min-w-0"
                  title="Remove"
                >
                  ✕
                </Button>
              </span>
            );
          })}
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