// Placeholder for Autocomplete.
// For now, it will use a simple select or input.
// This allows us to make progress without migrating the heavy vue-multiselect dependency immediately.

import React from 'react';
import classNames from 'classnames';
import VariableInput from './VariableInput';
import { useFormWidget } from './FormWidget';
import styles from './Autocomplete.module.scss';
import formStyles from './FormWidget.module.scss';
import FAIcon from '@/components/FAIcon';

interface AutocompleteProps {
  name?: string;
  placeholder?: string;
  value?: string | object;
  options?: readonly any[] | any[]; // accept readonly arrays
  trackBy?: string;
  label?: string;
  withExample?: boolean;
  availableVariables?: any;
  variableDelimiters?: any;
  trustedVariableDelimiters?: any;
  maxHeight?: number;
  allowCustom?: boolean;
  dataPath?: string;
  errors?: any[];
  onChange: (val: any) => void;
  className?: string;
}

export default function AutocompleteWidget({
  name = '',
  placeholder = '',
  value = '',
  options = [],
  trackBy,
  label,
  withExample = false,
  availableVariables,
  variableDelimiters,
  trustedVariableDelimiters,
  maxHeight,
  allowCustom = false,
  dataPath,
  errors,
  onChange,
  className
}: AutocompleteProps) {

  const { messageError, toggleClassErrorWarning } = useFormWidget({ dataPath, errors });

  // Simplistic implementation using standard select
  // Note: Standard select doesn't support objects as values easily, nor custom input.

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (trackBy && label) {
          // It's an object array
          const selectedOption = options.find(o => String(o[trackBy]) === val || String(o[label]) === val);
           if (selectedOption) {
               onChange(selectedOption);
           } else if (allowCustom) {
               onChange(val);
           }
      } else {
          // String array
          onChange(val);
      }
  };

  // Helper to extract string value for select
  const getValueString = () => {
      if (typeof value === 'object' && value !== null) {
          return (value as any)[trackBy || ''] || (value as any)[label || ''] || '';
      }
      return String(value);
  };

  return (
    <div
      className={classNames(styles['widget-autocomplete__container'], toggleClassErrorWarning, className)}
      data-cy="weaverbird-autocomplete"
    >
      {name && <label className={styles['widget-autocomplete__label']}>{name}</label>}

      <VariableInput
        value={value}
        availableVariables={availableVariables}
        variableDelimiters={variableDelimiters}
        trustedVariableDelimiters={trustedVariableDelimiters}
        hasArrow={true}
        onChange={onChange}
      >
          {/* Fallback implementation */}
          <select
             className="browser-default-select"
             style={{ width: '100%', padding: '8px', border: '1px solid #ddd' }}
             value={getValueString()}
             onChange={handleSelectChange}
          >
              <option value="" disabled>{placeholder}</option>
              {options.map((opt, idx) => {
                  const optLabel = typeof opt === 'object' ? opt[label || 'label'] : opt;
                  const optValue = typeof opt === 'object' ? (trackBy ? opt[trackBy] : opt[label || 'label']) : opt;
                  return <option key={idx} value={optValue}>{optLabel}</option>;
              })}
          </select>

      </VariableInput>
       {messageError && (
        <div className={formStyles['field__msg-error']}>
          <FAIcon icon="exclamation-circle" />
          {messageError}
        </div>
      )}
    </div>
  );
}
