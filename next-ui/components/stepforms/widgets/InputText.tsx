import React, { useRef } from 'react';
import classNames from 'classnames';

import FAIcon from '@/components/FAIcon';
import VariableInput from './VariableInput';
import { useFormWidget } from './FormWidget';
import styles from './InputText.module.scss';
import formStyles from './FormWidget.module.scss';

interface InputTextProps {
  name?: string;
  placeholder?: string;
  value?: string | number | boolean;
  docUrl?: string;
  availableVariables?: any;
  variableDelimiters?: any;
  trustedVariableDelimiters?: any;
  dataPath?: string;
  errors?: any[];
  warning?: string;
  onChange: (val: string) => void;
  // Extra props passed by parent
  className?: string;
  multiVariable?: boolean;
}

export default function InputTextWidget({
  name = '',
  placeholder = '',
  value = '',
  docUrl,
  availableVariables,
  variableDelimiters,
  trustedVariableDelimiters,
  dataPath,
  errors,
  warning,
  onChange,
  className,
  multiVariable // Not used directly here but might be passed
}: InputTextProps) {

  const { messageError, messageWarning, toggleClassErrorWarning } = useFormWidget({ dataPath, errors, warning });
  const inputRef = useRef<HTMLInputElement>(null);

  const updateValue = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <div className={classNames(styles['widget-input-text__container'], toggleClassErrorWarning, className)}>
      <div className={styles['widget-input-text__label']}>
        {name && <label onClick={() => inputRef.current?.focus()}>{name}</label>}
        {docUrl && (
          <a href={docUrl} target="_blank" rel="noopener noreferrer">
            <FAIcon className={styles['widget-input-text__doc-icon']} icon="question-circle" />
          </a>
        )}
      </div>

      <VariableInput
        value={value}
        availableVariables={availableVariables}
        variableDelimiters={variableDelimiters}
        trustedVariableDelimiters={trustedVariableDelimiters}
        onChange={updateValue}
      >
        <input
          ref={inputRef}
          className={classNames(styles['widget-input-text'], {
            [styles['widget-input--with-variables']]: availableVariables,
          })}
          data-cy="weaverbird-input-text"
          placeholder={placeholder}
          type="text"
          value={value === undefined ? '' : String(value)}
          onChange={(e) => updateValue(e.target.value)}
        />
      </VariableInput>

      {messageError && (
        <div className={formStyles['field__msg-error']}>
          <FAIcon icon="exclamation-circle" />
          {messageError}
        </div>
      )}
      {messageWarning && (
        <div className={formStyles['field__msg-warning']}>
          <FAIcon icon="exclamation-triangle" />
          {messageWarning}
        </div>
      )}
    </div>
  );
}
