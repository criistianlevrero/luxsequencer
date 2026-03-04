import React from 'react';
import { AdvancedSelect, FieldLabel } from '../../ui';
import type { SelectControlProps } from '../../../types/declarativeControls';

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
  const isMultiSelect = constraints.multiSelect || constraints.multiple || false;

  return (
    <div className="space-y-3">
      <FieldLabel
        label={spec.label}
        tooltip={spec.metadata?.tooltip}
        description={spec.metadata?.description}
      />

      <AdvancedSelect
        value={value}
        onChange={onChange}
        options={constraints.options}
        placeholder={constraints.placeholder || (isMultiSelect ? 'Select options...' : 'Select an option...')}
        disabled={disabled}
        searchable={constraints.searchable}
        allowGroups={constraints.allowGroups}
        multiSelect={isMultiSelect}
      />
    </div>
  );
};