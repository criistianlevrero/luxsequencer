import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input } from '../primitives';

export interface AdvancedSelectOption {
  value: any;
  label: string;
  description?: string;
  group?: string;
  disabled?: boolean;
}

export interface AdvancedSelectProps {
  value: any;
  onChange: (value: any) => void;
  options: AdvancedSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  allowGroups?: boolean;
  multiSelect?: boolean;
  className?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  clearLabel?: string;
  removeLabel?: string;
}

export const AdvancedSelect: React.FC<AdvancedSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  disabled = false,
  searchable = false,
  allowGroups = false,
  multiSelect = false,
  className = '',
  searchPlaceholder = 'Search options...',
  noResultsText = 'No options found',
  clearLabel = 'Clear selection',
  removeLabel = 'Remove',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedValues = useMemo(() => {
    if (multiSelect) {
      return Array.isArray(value) ? value : value ? [value] : [];
    }
    return value !== undefined && value !== null && value !== '' ? [value] : [];
  }, [multiSelect, value]);

  const processedOptions = useMemo(() => {
    if (allowGroups && options.some((option) => Boolean(option.group))) {
      const grouped: Record<string, AdvancedSelectOption[]> = {};
      const ungrouped: AdvancedSelectOption[] = [];

      options.forEach((option) => {
        if (option.group) {
          if (!grouped[option.group]) {
            grouped[option.group] = [];
          }
          grouped[option.group].push(option);
        } else {
          ungrouped.push(option);
        }
      });

      return { grouped, ungrouped };
    }

    return { grouped: {}, ungrouped: options };
  }, [allowGroups, options]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return processedOptions;
    }

    const search = searchTerm.toLowerCase();
    const filterFn = (option: AdvancedSelectOption) => (
      option.label.toLowerCase().includes(search)
      || option.description?.toLowerCase().includes(search)
    );

    return {
      grouped: Object.fromEntries(
        Object.entries(processedOptions.grouped)
          .map(([group, groupOptions]) => [group, groupOptions.filter(filterFn)])
          .filter(([, groupOptions]) => groupOptions.length > 0),
      ),
      ungrouped: processedOptions.ungrouped.filter(filterFn),
    };
  }, [processedOptions, searchTerm]);

  const groupedEntries = useMemo<[string, AdvancedSelectOption[]][]>(
    () => Object.entries(filteredOptions.grouped) as [string, AdvancedSelectOption[]][],
    [filteredOptions.grouped],
  );

  const allOptions = useMemo<AdvancedSelectOption[]>(
    () => ([
      ...filteredOptions.ungrouped,
      ...groupedEntries.flatMap(([, groupOptions]) => groupOptions),
    ]),
    [filteredOptions.ungrouped, groupedEntries],
  );

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

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      setSearchTerm('');
    }
  }, [isOpen]);

  const getOptionByValue = (optionValue: any) => options.find((option) => option.value === optionValue);

  const getDisplayText = () => {
    if (multiSelect) {
      if (selectedValues.length === 0) {
        return placeholder;
      }
      if (selectedValues.length === 1) {
        return getOptionByValue(selectedValues[0])?.label || String(selectedValues[0]);
      }
      return `${selectedValues.length} selected`;
    }

    if (selectedValues.length === 0) {
      return placeholder;
    }

    return getOptionByValue(selectedValues[0])?.label || String(selectedValues[0]);
  };

  const handleOptionSelect = (optionValue: any) => {
    if (multiSelect) {
      if (selectedValues.includes(optionValue)) {
        const next = selectedValues.filter((selected) => selected !== optionValue);
        onChange(next);
      } else {
        onChange([...selectedValues, optionValue]);
      }
      return;
    }

    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(multiSelect ? [] : '');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev < allOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : allOptions.length - 1));
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0 && allOptions[highlightedIndex]) {
          handleOptionSelect(allOptions[highlightedIndex].value);
        }
        break;
      default:
        break;
    }
  };

  const hasValue = selectedValues.length > 0;

  return (
    <div className={className} ref={dropdownRef}>
      <Button
        variant="secondary"
        size="sm"
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={[
          'w-full justify-between rounded-lg border bg-gray-700 text-left font-normal',
          disabled
            ? 'border-gray-600 text-gray-500 cursor-not-allowed'
            : 'border-gray-600 text-gray-200 hover:border-gray-500 focus:border-cyan-500 focus:outline-none',
          isOpen ? 'border-cyan-500 ring-2 ring-cyan-500/20' : '',
        ].join(' ').trim()}
      >
        <span className="truncate">{getDisplayText()}</span>
        <span className="flex items-center gap-2">
          {hasValue && (
            <span
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={clearLabel}
              title={clearLabel}
              onClick={(event) => {
                event.stopPropagation();
                if (!disabled) {
                  handleClear();
                }
              }}
              onKeyDown={(event) => {
                if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
                  event.preventDefault();
                  event.stopPropagation();
                  handleClear();
                }
              }}
              className={[
                'p-1',
                disabled ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-gray-200 cursor-pointer',
              ].join(' ')}
            >
              ✕
            </span>
          )}
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </Button>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-hidden rounded-lg border border-gray-600 bg-gray-800 shadow-lg">
          {searchable && (
            <div className="border-b border-gray-600 p-2">
              <Input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full"
              />
            </div>
          )}

          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.ungrouped.map((option, index) => {
              const selected = selectedValues.includes(option.value);
              const highlighted = highlightedIndex === index;

              return (
                <Button
                  key={String(option.value)}
                  variant="ghost"
                  size="sm"
                  disabled={option.disabled}
                  onClick={() => handleOptionSelect(option.value)}
                  className={[
                    'w-full justify-start rounded-none text-left font-normal hover:bg-gray-700',
                    selected ? 'bg-cyan-600 text-white' : 'text-gray-200',
                    highlighted ? 'bg-gray-600' : '',
                  ].join(' ').trim()}
                >
                  {multiSelect && (
                    <span
                      className={[
                        'flex h-4 w-4 items-center justify-center rounded border border-gray-500',
                        selected ? 'border-cyan-600 bg-cyan-600' : '',
                      ].join(' ').trim()}
                    >
                      {selected && (
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                  )}
                  <span className="flex-1">
                    <span className="block font-medium">{option.label}</span>
                    {option.description && <span className="block text-sm text-gray-400">{option.description}</span>}
                  </span>
                  {!multiSelect && selected && (
                    <svg className="h-4 w-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </Button>
              );
            })}

            {groupedEntries.map(([groupName, groupOptions], groupIndex) => {
              const baseOffset = filteredOptions.ungrouped.length + groupedEntries
                .slice(0, groupIndex)
                .reduce((sum, [, previous]) => sum + previous.length, 0);

              return (
                <div key={groupName}>
                  <div className="border-b border-gray-600 bg-gray-700/50 px-3 py-1 text-sm font-medium text-gray-400">
                    {groupName}
                  </div>

                  {groupOptions.map((option, index) => {
                    const selected = selectedValues.includes(option.value);
                    const highlighted = highlightedIndex === baseOffset + index;

                    return (
                      <Button
                        key={String(option.value)}
                        variant="ghost"
                        size="sm"
                        disabled={option.disabled}
                        onClick={() => handleOptionSelect(option.value)}
                        className={[
                          'w-full justify-start rounded-none pl-6 text-left font-normal hover:bg-gray-700',
                          selected ? 'bg-cyan-600 text-white' : 'text-gray-200',
                          highlighted ? 'bg-gray-600' : '',
                        ].join(' ').trim()}
                      >
                        {multiSelect && (
                          <span
                            className={[
                              'flex h-4 w-4 items-center justify-center rounded border border-gray-500',
                              selected ? 'border-cyan-600 bg-cyan-600' : '',
                            ].join(' ').trim()}
                          >
                            {selected && (
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                        )}
                        <span className="flex-1">
                          <span className="block font-medium">{option.label}</span>
                          {option.description && <span className="block text-sm text-gray-400">{option.description}</span>}
                        </span>
                        {!multiSelect && selected && (
                          <svg className="h-4 w-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </Button>
                    );
                  })}
                </div>
              );
            })}

            {allOptions.length === 0 && (
              <div className="px-3 py-4 text-center text-gray-400">
                {noResultsText}
              </div>
            )}
          </div>
        </div>
      )}

      {multiSelect && selectedValues.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedValues.map((selectedValue) => {
            const option = getOptionByValue(selectedValue);
            return (
              <span
                key={String(selectedValue)}
                className="inline-flex items-center gap-1 rounded bg-cyan-600 px-2 py-1 text-sm text-white"
              >
                {option?.label || String(selectedValue)}
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() => handleOptionSelect(selectedValue)}
                  className="h-5 w-5 min-h-0 min-w-0 rounded p-0.5 hover:bg-cyan-700"
                  title={removeLabel}
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

export default AdvancedSelect;
