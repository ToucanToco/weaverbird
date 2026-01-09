import React from 'react';
import classNames from 'classnames';

import FAIcon from '@/components/FAIcon';
import VariableInput from './VariableInput';
import { useFormWidget } from './FormWidget';
import Calendar from '@/components/DatePicker/Calendar';
import styles from './InputDate.module.scss'; // We need to create this
import formStyles from './FormWidget.module.scss';
import { DateRange } from '@/lib/dates';

import Popover from '@/components/Popover';
import { Alignment } from '@/components/constants';

interface InputDateProps {
  name?: string;
  placeholder?: string;
  value?: Date | string | number | DateRange; // Accept string/number for flexibility, DateRange if needed
  docUrl?: string;
  availableVariables?: any;
  variableDelimiters?: any;
  trustedVariableDelimiters?: any;
  dataPath?: string;
  errors?: any[];
  warning?: string;
  onChange: (val: any) => void;
  className?: string;
  // Extra props for Calendar if needed, though usually InputDate implies a single date or specific config
}

export default function InputDateWidget({
  name = '',
  placeholder = '',
  value,
  docUrl,
  availableVariables,
  variableDelimiters,
  trustedVariableDelimiters,
  dataPath,
  errors,
  warning,
  onChange,
  className
}: InputDateProps) {

  const { messageError, messageWarning, toggleClassErrorWarning } = useFormWidget({ dataPath, errors, warning });

  const [isOpen, setIsOpen] = React.useState(false);

  // Value formatting for display
  const displayValue = value instanceof Date ? value.toLocaleDateString() : String(value || '');

  const handleDateSelect = (date: Date | DateRange | undefined) => {
      onChange(date);
      setIsOpen(false);
  };

  return (
    <div className={classNames(styles['widget-input-date__container'], toggleClassErrorWarning, className)}>
       <div className={styles['widget-input-date__label-container']}>
            {name && <label>{name}</label>}
       </div>

       <div className={styles['widget-input-date__input-wrapper']}>
           <input
              className={styles['widget-input-date__input']}
              value={displayValue}
              placeholder={placeholder}
              readOnly
              onClick={() => setIsOpen(true)}
           />

           <Popover
              visible={isOpen}
              align={Alignment.Left}
              onClosed={() => setIsOpen(false)}
              bottom
           >
              <Calendar
                  value={value instanceof Date ? value : undefined}
                  onInput={handleDateSelect}
              />
           </Popover>
       </div>

       {messageError && (
        <div className={formStyles['field__msg-error']}>
          <FAIcon icon="exclamation-circle" />
          {messageError}
        </div>
      )}
    </div>
  );
}
