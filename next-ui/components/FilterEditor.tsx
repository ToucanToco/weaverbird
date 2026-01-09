import React, { useMemo } from 'react';
import { ErrorObject } from 'ajv';

import ConditionsEditor from '@/components/ConditionsEditor/ConditionsEditor';
import { AbstractFilterTree } from '@/components/ConditionsEditor/tree-types';
import {
  buildConditionsEditorTree,
  buildFilterStepTree,
  castFilterStepTreeValue,
} from '@/components/stepforms/convert-filter-step-tree';
import FilterSimpleConditionWidget, {
  DEFAULT_FILTER,
} from '@/components/stepforms/widgets/FilterSimpleCondition';
import { ColumnTypeMapping } from '@/lib/dataset';
import { FilterCondition, FilterSimpleCondition } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';

interface FilterEditorProps {
  filterTree?: FilterCondition;
  columnTypes?: ColumnTypeMapping;
  availableVariables?: VariablesBucket;
  variableDelimiters?: VariableDelimiters;
  trustedVariableDelimiters?: VariableDelimiters;
  hideColumnVariables?: boolean;
  multiVariable?: boolean;
  errors?: ErrorObject[];
  onFilterTreeUpdated: (newTree: FilterCondition) => void;
  onSetSelectColumns?: (columns: { column: string }) => void;
}

export default function FilterEditor({
  filterTree = { column: '', value: '', operator: 'eq' },
  columnTypes = {},
  availableVariables,
  variableDelimiters,
  trustedVariableDelimiters,
  hideColumnVariables,
  multiVariable = true,
  errors = [],
  onFilterTreeUpdated,
  onSetSelectColumns,
}: FilterEditorProps) {

  const defaultValue = DEFAULT_FILTER;

  const conditionsTree = useMemo(() => {
    return buildConditionsEditorTree(castFilterStepTreeValue(filterTree, columnTypes));
  }, [filterTree, columnTypes]);

  const updateFilterTree = (newConditionsTree: AbstractFilterTree) => {
    const newFilterTree = buildFilterStepTree(newConditionsTree);
    // Cast back to FilterCondition because buildFilterStepTree returns object
    onFilterTreeUpdated(newFilterTree as FilterCondition);
  };

  return (
    <div className="filter-editor">
      <ConditionsEditor
        conditionsTree={conditionsTree}
        onConditionsTreeUpdated={updateFilterTree}
        defaultValue={defaultValue}
        renderCondition={({ condition, updateCondition, dataPath }) => (
            <FilterSimpleConditionWidget
                value={condition || undefined}
                onChange={updateCondition}
                columnNamesProp={Object.keys(columnTypes)}
                availableVariables={availableVariables}
                variableDelimiters={variableDelimiters}
                trustedVariableDelimiters={trustedVariableDelimiters}
                hideColumnVariables={hideColumnVariables}
                dataPath={dataPath}
                errors={errors}
                multiVariable={multiVariable}
                columnTypes={columnTypes}
                onSetSelectedColumns={onSetSelectColumns}
            />
        )}
      />
    </div>
  );
}
