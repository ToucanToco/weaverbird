import type { ColumnTypeMapping } from '@/lib/dataset';
import { castFromString } from '@/lib/helpers';
import type { FilterComboAnd, FilterComboOr, FilterCondition } from '@/lib/steps';
import { isFilterComboAnd, isFilterComboOr } from '@/lib/steps';

import type { AbstractFilterTree, ConditionOperator } from '../ConditionsEditor/tree-types';

/**
isFilterCombo return true for:
{ or: [
  { column: 'tata', value: 'B', operator: 'ne' }
  { column: 'titi', value: '2', operator: 'le' }
]} --> FilterComboOr
or
{ and: [
  { column: 'tata', value: 'B', operator: 'ne' }
  { column: 'titi', value: '2', operator: 'le' }
]} --> FilterComboAnd
*/
export function isFilterCombo(
  groupOrCondition: FilterCondition | undefined,
): groupOrCondition is FilterComboAnd | FilterComboOr {
  // Can be undefined when a new row is added
  if (groupOrCondition) {
    return isFilterComboAnd(groupOrCondition) || isFilterComboOr(groupOrCondition);
  } else {
    return false;
  }
}

/**
buildConditionsEditorTree transform this:
{
	name: 'filter',
	condition: {
		and: [
			{ column: 'toto', value: 'A', operator: 'eq' },
			{ or: [
				{ column: 'tata', value: 'B', operator: 'ne' }
        { column: 'titi', value: '2', operator: 'le' }
			]}
		]
}

into:
{
	operator: 'and',
	conditions: [{ column: 'toto', value: 'A', operator: 'eq' }],
	groups: [
		operator: 'or',
		conditions: [
      { column: 'tata', value: 'B', operator: 'ne' },
      { column: 'titi', value: '2', operator: 'le' }
    ],
    groups: [],
	]
}
*/
export function buildConditionsEditorTree(groupOrCondition: FilterCondition) {
  const conditions: object[] = [];
  const groups: object[] = [];

  if (isFilterCombo(groupOrCondition)) {
    let operator: ConditionOperator;
    const group = groupOrCondition;
    let subElements;
    if (isFilterComboAnd(group)) {
      operator = 'and';
      subElements = group[operator];
    } else {
      operator = 'or';
      subElements = group[operator];
    }
    subElements.forEach((obj: any) =>
      isFilterCombo(obj) ? groups.push(buildConditionsEditorTree(obj)) : conditions.push(obj),
    );
    return {
      operator: operator,
      conditions: conditions,
      groups: groups,
    };
  } else {
    return {
      operator: '',
      conditions: [groupOrCondition],
      groups: [],
    };
  }
}

/**
buildConditionsEditorTree transform this:
{
	operator: 'and',
	conditions: [{ column: 'toto', value: 'A', operator: 'eq' }],
	groups: [
		operator: 'or',
		conditions: [
      { column: 'tata', value: 'B', operator: 'ne' },
      { column: 'titi', value: '2', operator: 'le' }
    ],
    groups: [],
	]
}
into:
{
  and: [
    { column: 'toto', value: 'A', operator: 'eq' },
    { or: [
      { column: 'tata', value: 'B', operator: 'ne' }
      { column: 'titi', value: '2', operator: 'le' }
    ]}
  ]
}
*/
export function buildFilterStepTree(conditionGroup: AbstractFilterTree) {
  const filterStepConditions: object[] = [];

  conditionGroup.conditions.forEach((obj: any) => filterStepConditions.push(obj));

  if (conditionGroup.groups && conditionGroup.groups.length > 0) {
    conditionGroup.groups.forEach((_obj: any, index: number) =>
      filterStepConditions.push(buildFilterStepTree(conditionGroup.groups[index])),
    );
  }

  let filterStepGroup;
  if (conditionGroup.operator) {
    filterStepGroup = {
      [conditionGroup.operator]: filterStepConditions,
    };
  } else {
    filterStepGroup = conditionGroup.conditions[0];
  }

  return filterStepGroup;
}

/**
castFilterStepTreeValue transform:
{
  and: [
    { column: 'toto', value: '1', operator: 'eq' },
    { column: 'tata', value: 'true', operator: 'eq' },
    { or: [
      { column: 'titi', value: 'B', operator: 'ne' }
      { column: 'tutu', value: '2.1', operator: 'le' }
    ]}
  ]
}
with: columnTypes = {
  toto: integer,
  tutu: float,
  tata: boolean,
}
into:
{
	name: 'filter',
	condition: {
		and: [
			{ column: 'toto', value: 1, operator: 'eq' },
      { column: 'tata', value: true, operator: 'eq' },
			{ or: [
				{ column: 'titi', value: 'B', operator: 'ne' }
        { column: 'tutu', value: 2.1, operator: 'le' }
			]}
		]
}
*/

export function castFilterStepTreeValue(
  filterStepTree: FilterCondition,
  columnTypes: ColumnTypeMapping,
) {
  if (isFilterCombo(filterStepTree)) {
    if (isFilterComboOr(filterStepTree)) {
      for (let condition of filterStepTree.or) {
        condition = castFilterStepTreeValue(condition, columnTypes);
      }
    }
    if (isFilterComboAnd(filterStepTree)) {
      for (let condition of filterStepTree.and) {
        condition = castFilterStepTreeValue(condition, columnTypes);
      }
    }
    return filterStepTree;
  } else {
    const type = columnTypes[filterStepTree.column];
    if (type !== undefined) {
      if (Array.isArray(filterStepTree.value)) {
        filterStepTree.value = filterStepTree.value.map((v) => castFromString(v, type));
      } else {
        filterStepTree.value = castFromString(filterStepTree.value, type);
      }
    }
    return filterStepTree;
  }
}
