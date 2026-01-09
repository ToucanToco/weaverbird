// Placeholder for MultiInputText
// Need to replace the stub in FilterSimpleCondition with this file.

import React, { useState } from 'react';
import classNames from 'classnames';

import VariableInput from './VariableInput';
import { useFormWidget } from './FormWidget';
import styles from './MultiInputText.module.scss';
import formStyles from './FormWidget.module.scss';
import FAIcon from '@/components/FAIcon';

interface MultiInputTextProps {
  name?: string;
  placeholder?: string;
  value?: string[] | string;
  availableVariables?: any;
  variableDelimiters?: any;
  trustedVariableDelimiters?: any;
  multiVariable?: boolean;
  dataPath?: string;
  errors?: any[];
  warning?: string;
  onChange: (val: string[] | string) => void;
  className?: string;
}

export default function MultiInputTextWidget({
  name = '',
  placeholder = '',
  value = [],
  availableVariables,
  variableDelimiters,
  trustedVariableDelimiters,
  multiVariable = true,
  dataPath,
  errors,
  warning,
  onChange,
  className
}: MultiInputTextProps) {

  const { messageError, messageWarning, toggleClassErrorWarning } = useFormWidget({ dataPath, errors, warning });

  // Minimal implementation: A simple textarea that splits by comma for now,
  // or just a text input that treats input as a single string if that's allowed?
  // The Vue component uses vue-multiselect with tagging.

  // Let's implement a simple tag input.
  const [inputValue, setInputValue] = useState('');

  const values = Array.isArray(value) ? value : (value ? [value] : []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          if (inputValue.trim()) {
              onChange([...values, inputValue.trim()]);
              setInputValue('');
          }
      }
  };

  const removeTag = (idx: number) => {
      const newValues = [...values];
      newValues.splice(idx, 1);
      onChange(newValues);
  };

  return (
    <div className={classNames(styles['widget-multiinputtext__container'], toggleClassErrorWarning, className)}>

      {/* Variable Input Wrapper (placeholder) */}
      <VariableInput
         value={value}
         availableVariables={availableVariables}
         onChange={(v: any) => onChange(v)}
      >
          <div className={styles['widget-multiinputtext__multiselect']}>
              <div className={styles['multiselect__tags']}>
                  {values.map((val, idx) => (
                      <span key={idx} className={styles['multiselect__tag']}>
                          <span>{val}</span>
                          <i
                             className={styles['multiselect__tag-icon']}
                             onClick={() => removeTag(idx)}
                          >×</i>
                      </span>
                  ))}
                  <input
                      className={styles['multiselect__input']}
                      placeholder={values.length === 0 ? placeholder : ''}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                  />
              </div>
          </div>
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
