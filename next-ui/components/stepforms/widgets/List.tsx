// Placeholder for ListWidget
// This component manages a list of items using a dynamic component (passed as prop).
// In React, we pass the component class/function as a prop.

import React from 'react';
import _ from 'lodash';
import classNames from 'classnames';

import FAIcon from '@/components/FAIcon';
import { useFormWidget } from './FormWidget';
import InputTextWidget from './InputText'; // Default widget

import styles from './List.module.scss';
import formStyles from './FormWidget.module.scss';

interface ListWidgetProps {
  name?: string;
  addFieldName?: string;
  separatorLabel?: string;
  value?: any[];
  options?: any[]; // for child widgets
  widget?: React.ComponentType<any>; // React Component
  automaticNewField?: boolean; // If true, always shows an empty field at the end? Vue logic: "if automaticNewField, valueCopy.push(defaultChildValue)"
  defaultItem?: any;
  errors?: any[];
  dataPath?: string;
  availableVariables?: any;
  variableDelimiters?: any;
  trustedVariableDelimiters?: any;
  unstyledItems?: boolean;
  columnNames?: string[];
  selectedColumns?: string[];
  componentProps?: object;
  onChange: (val: any[]) => void;
  onSetSelectedColumns?: (val: any) => void;
  className?: string;
}

export default function ListWidget({
  name,
  addFieldName = 'Add',
  separatorLabel,
  value = [],
  options = [],
  widget: Widget = InputTextWidget, // Renaming to capitalize for JSX
  automaticNewField = true,
  defaultItem,
  errors,
  dataPath,
  availableVariables,
  variableDelimiters,
  trustedVariableDelimiters,
  unstyledItems = false,
  columnNames,
  selectedColumns,
  componentProps = {},
  onChange,
  onSetSelectedColumns,
  className
}: ListWidgetProps) {

  const { messageError, toggleClassErrorWarning } = useFormWidget({ dataPath, errors });

  // Default value logic
  const getDefaultChildValue = () => {
    if (defaultItem !== undefined && defaultItem !== null) {
      return defaultItem;
    }
    // Simple check if widget is InputTextWidget?
    // In React checking component identity is tricky if wrapped.
    // Assuming empty string is safe default for text, or empty array/object.
    return '';
  };

  const defaultChildValue = getDefaultChildValue();

  const handleUpdate = (newValue: any[]) => {
      onChange(newValue);
  };

  const children = (() => {
      const valueCopy = [...value];
      // Note: In Vue, computed property 'children' added a dummy item if automaticNewField is true.
      // But it didn't emit it.
      // And the loop rendered these children.
      if (automaticNewField) {
          valueCopy.push(defaultChildValue);
      }
      return valueCopy.map((val, idx) => ({
          isRemovable: !automaticNewField || valueCopy.length !== 1,
          value: val,
          originalIndex: idx
          // If automaticNewField is true, the last item is a "phantom" item.
          // If modified, it should likely be added to real value?
          // Vue: "updateChildValue" -> "if value.length < index ... push"
      }));
  })();

  const removeChild = (index: number) => {
      const newValue = [...value];
      newValue.splice(index, 1);
      handleUpdate(newValue);
  };

  const updateChildValue = (childValue: any, index: number) => {
      const newValue = [...value];
      if (index >= newValue.length) {
          newValue.push(childValue);
      } else {
          newValue[index] = childValue;
      }
      handleUpdate(newValue);
  };

  const addFieldSet = () => {
      handleUpdate([...value, _.cloneDeep(defaultChildValue)]);
  };

  return (
    <div className={classNames(styles['widget-list__container'], toggleClassErrorWarning, className)}>
      {name && <label className={styles['widget-list__label']}>{name}</label>}
      <div className={styles['widget-list__body']}>
        {children.map((child, index) => {
            const isLastPhantom = automaticNewField && index === children.length - 1;

            return (
              <div className={styles['widget-list__child']} key={index}>
                {index > 0 && separatorLabel && (
                    <span className={styles['widget-list__component-sep']}>{separatorLabel}</span>
                )}

                <div className={classNames(styles['widget-list__component'], {
                    [styles['widget-list__component--colored']]: !unstyledItems
                })}>
                    <Widget
                        {...componentProps}
                        value={child.value}
                        options={options}
                        availableVariables={availableVariables}
                        variableDelimiters={variableDelimiters}
                        trustedVariableDelimiters={trustedVariableDelimiters}
                        dataPath={`${dataPath || ''}.${index}`}
                        errors={errors}
                        columnNames={columnNames}
                        selectedColumns={selectedColumns}
                        onChange={(v: any) => updateChildValue(v, index)}
                        onSetSelectedColumns={onSetSelectedColumns}
                    />
                </div>

                {child.isRemovable && !isLastPhantom && (
                    <div className={styles['widget-list__icon']} onClick={() => removeChild(index)}>
                        <FAIcon icon="far trash-alt" />
                    </div>
                )}
              </div>
            );
        })}

        {messageError && (
            <div className={formStyles['field__msg-error']}>
            <FAIcon icon="exclamation-circle" />
            {messageError}
            </div>
        )}

        {!automaticNewField && (
            <button className={styles['widget-list__add-fieldset']} onClick={addFieldSet}>
                <FAIcon className={styles['widget-list__add-fieldset-icon']} icon="plus" /> {/* plus-circle in vue, check FA map */}
                {addFieldName}
            </button>
        )}
      </div>
    </div>
  );
}
