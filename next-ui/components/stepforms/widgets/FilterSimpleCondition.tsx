import React, { useMemo, useEffect, useRef } from 'react';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';

import { ColumnTypeMapping } from '@/lib/dataset';
import { FilterSimpleCondition } from '@/lib/steps';
import { VariablesBucket, VariableDelimiters } from '@/lib/variables';
import {
  keepCurrentValueIfArrayType,
  keepCurrentValueIfCompatibleRelativeDate,
  keepCurrentValueIfCompatibleType,
} from '@/lib/helpers';

// Use real components now
import AutocompleteWidget from './Autocomplete';
import InputTextWidget from './InputText';
import InputDateWidget from './InputDate';
import MultiInputTextWidget from './MultiInputText';

// Still placeholders for these for now
const NewDateInput = (props: any) => <InputDateWidget {...props} />; // Map to InputDateWidget

import styles from './FilterSimpleCondition.module.scss';

type LiteralOperator =
  | 'equals'
  | "doesn't equal"
  | 'is greater than'
  | 'is greater than or equal to'
  | 'is less than'
  | 'is less than or equal to'
  | 'is one of'
  | 'is not one of'
  | 'matches pattern'
  | "doesn't match pattern"
  | 'is null'
  | 'is not null'
  | 'starting in/on'
  | 'ending in/on';

type ShortOperator = FilterSimpleCondition['operator'];

type OperatorOption = {
  operator: ShortOperator;
  label: LiteralOperator;
  inputWidget?: React.ComponentType<any>;
};

export const DEFAULT_FILTER: FilterSimpleCondition = { column: '', value: '', operator: 'eq' };

const nullOperators: Readonly<OperatorOption[]> = [
  { operator: 'isnull', label: 'is null' },
  { operator: 'notnull', label: 'is not null' },
];

const baseOperators: Readonly<OperatorOption[]> = [
  { operator: 'eq', label: 'equals', inputWidget: InputTextWidget },
  { operator: 'ne', label: "doesn't equal", inputWidget: InputTextWidget },
  { operator: 'gt', label: 'is greater than', inputWidget: InputTextWidget },
  { operator: 'ge', label: 'is greater than or equal to', inputWidget: InputTextWidget },
  { operator: 'lt', label: 'is less than', inputWidget: InputTextWidget },
  { operator: 'le', label: 'is less than or equal to', inputWidget: InputTextWidget },
  { operator: 'in', label: 'is one of', inputWidget: MultiInputTextWidget },
  { operator: 'nin', label: 'is not one of', inputWidget: MultiInputTextWidget },
  { operator: 'matches', label: 'matches pattern', inputWidget: InputTextWidget },
  { operator: 'notmatches', label: "doesn't match pattern", inputWidget: InputTextWidget },
  ...nullOperators,
];

const dateOperators: Readonly<OperatorOption[]> = [
  { operator: 'from', label: 'starting in/on', inputWidget: NewDateInput },
  { operator: 'until', label: 'ending in/on', inputWidget: NewDateInput },
  ...nullOperators,
];

interface FilterSimpleConditionWidgetProps {
    value?: FilterSimpleCondition;
    columnNamesProp?: string[];
    dataPath?: string;
    errors?: any[]; // ErrorObject[]
    multiVariable?: boolean;
    columnTypes?: ColumnTypeMapping;
    availableVariables?: VariablesBucket;
    variableDelimiters?: VariableDelimiters;
    trustedVariableDelimiters?: VariableDelimiters;
    hideColumnVariables?: boolean;
    onChange: (val: FilterSimpleCondition) => void;
    onSetSelectedColumns?: (col: { column: string }) => void;
}

export default function FilterSimpleConditionWidget({
    value = { ...DEFAULT_FILTER },
    columnNamesProp = [],
    dataPath = '',
    errors = [],
    multiVariable = true,
    columnTypes = {},
    availableVariables,
    variableDelimiters,
    trustedVariableDelimiters,
    hideColumnVariables,
    onChange,
    onSetSelectedColumns,
}: FilterSimpleConditionWidgetProps) {

    const columnNames = columnNamesProp ?? [];
    const availableVariablesForInputWidget = availableVariables;

    const hasDateSelectedColumn = useMemo(() => {
        return columnTypes[value.column] === 'date';
    }, [columnTypes, value.column]);

    const availableOperators = useMemo(() => {
        if (hasDateSelectedColumn) {
            return dateOperators;
        }
        return baseOperators;
    }, [hasDateSelectedColumn]);

    const operator = useMemo(() => {
        return availableOperators.find((d) => d.operator === value.operator) ?? availableOperators[0];
    }, [availableOperators, value.operator]);

    const placeholder = useMemo(() => {
        if (value.operator === 'matches' || value.operator === 'notmatches') {
            return 'Enter a regex, e.g. "[Ss]ales"';
        }
        return 'Enter a value';
    }, [value.operator]);

    const InputWidget = operator.inputWidget;

    const updateStepOperator = (newOperator: OperatorOption) => {
        const updatedValue = { ...value };
        updatedValue.operator = newOperator.operator;

        if (updatedValue.operator === 'in' || updatedValue.operator === 'nin') {
             // @ts-ignore
            updatedValue.value = keepCurrentValueIfArrayType(updatedValue.value, []);
        } else if (updatedValue.operator === 'isnull' || updatedValue.operator === 'notnull') {
             // @ts-ignore
            updatedValue.value = null;
        } else if (hasDateSelectedColumn) {
             // @ts-ignore
            updatedValue.value = keepCurrentValueIfCompatibleRelativeDate(updatedValue.value, '');
        } else {
             // @ts-ignore
            updatedValue.value = keepCurrentValueIfCompatibleType(updatedValue.value, '');
        }
        onChange(updatedValue);
    };

    // Initialization logic
    useEffect(() => {
         if (isEqual(value, DEFAULT_FILTER)) {
            // No op
         } else if (hasDateSelectedColumn) {
             // Logic to update invalid date operator
             const retrieveOperatorOption = (op: string) => availableOperators.find((o) => o.operator === op);
             if (!retrieveOperatorOption(value.operator)) {
                  let newOperator: ShortOperator = 'eq'; // Default fallback
                   switch (value.operator) {
                    case 'lt':
                    case 'le':
                      newOperator = 'until';
                      break;
                    case 'gt':
                    case 'ge':
                      newOperator = 'from';
                      break;
                    case 'from':
                      newOperator = 'ge';
                      break;
                    case 'until':
                      newOperator = 'le';
                      break;
                  }
                  const newOpOption = retrieveOperatorOption(newOperator) ?? operator;
                  updateStepOperator(newOpOption);
             }
         }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasDateSelectedColumn]); // Only run when date status changes or mount. But careful with mount.

    // Watch for column type change to reset values
    const prevHasDateSelectedColumn = useRef(hasDateSelectedColumn);
    useEffect(() => {
        if (prevHasDateSelectedColumn.current !== hasDateSelectedColumn) {
             // verifyIfValueIsStillValid
             updateStepOperator(operator);
             prevHasDateSelectedColumn.current = hasDateSelectedColumn;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasDateSelectedColumn, operator]); // We deliberately exclude updateStepOperator/value to avoid loops


    const updateStepValue = (newVal: any) => {
        const updatedValue = { ...value };
        updatedValue.value = newVal;
        onChange(updatedValue);
    };

    const updateStepColumn = (newValue: string) => {
        const updatedValue = { ...value };
        updatedValue.column = newValue;
        if (onSetSelectedColumns) {
            onSetSelectedColumns({ column: updatedValue.column });
        }
        onChange(updatedValue);
    };

    return (
        <div className={styles['filter-form-simple-condition__container']}>
            <div className={styles['filter-form-simple-condition-column-input']} data-cy="weaverbird-filter-form-column-input">
                <AutocompleteWidget
                    className="columnInput"
                    value={value.column}
                    availableVariables={hideColumnVariables ? undefined : availableVariables}
                    variableDelimiters={hideColumnVariables ? undefined : variableDelimiters}
                    trustedVariableDelimiters={hideColumnVariables ? undefined : trustedVariableDelimiters}
                    options={columnNames}
                    onChange={updateStepColumn}
                    placeholder="Column"
                    dataPath={`${dataPath}.column`}
                    errors={errors}
                    allowCustom={true}
                />
            </div>
            <div className={styles['filter-form-simple-condition-operator-input']} data-cy="weaverbird-filter-form-operator-input">
                <AutocompleteWidget
                     className="filterOperator"
                     value={operator.label} // Display label
                     trackBy="operator"
                     label="label"
                     onChange={(selected: any) => {
                         // Autocomplete might return string or object
                         if (typeof selected === 'string') {
                              const op = availableOperators.find(o => o.label === selected);
                              if (op) updateStepOperator(op);
                         } else if (selected && selected.operator) {
                              updateStepOperator(selected);
                         }
                     }}
                     options={availableOperators}
                     placeholder="Filter operator"
                />
            </div>
            {InputWidget && (
                <div className={styles['filter-form-simple-condition-column-input']}>
                <InputWidget
                    className="filterValue"
                    // data-cy="weaverbird-filter-form-filter-value"
                    multiVariable={multiVariable}
                    value={value.value}
                    availableVariables={availableVariablesForInputWidget}
                    variableDelimiters={variableDelimiters}
                    trustedVariableDelimiters={trustedVariableDelimiters}
                    placeholder={placeholder}
                    dataPath={`${dataPath}.value`}
                    errors={errors}
                    onChange={updateStepValue}
                />
                </div>
            )}
        </div>
    );
}
