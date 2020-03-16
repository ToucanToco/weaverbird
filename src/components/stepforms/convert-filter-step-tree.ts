import {
  FilterComboAnd,
  FilterComboOr,
  FilterSimpleCondition,
  isFilterComboAnd,
  isFilterComboOr,
} from '@/lib/steps';

import { AbstractFilterTree, ConditionOperator } from '../ConditionsEditor/tree-types';

export function isFilterCombo(
  groupOrCondition: FilterSimpleCondition | FilterComboAnd | FilterComboOr,
): groupOrCondition is FilterComboAnd | FilterComboOr {
  // Can be undefined when a new row is added
  if (groupOrCondition) {
    return isFilterComboAnd(groupOrCondition) || isFilterComboOr(groupOrCondition);
  } else {
    return false;
  }
}

export function buildConditionsEditorTree(
  groupOrCondition: FilterSimpleCondition | FilterComboAnd | FilterComboOr,
) {
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

export function buildFilterStepTree(conditionGroup: AbstractFilterTree, isRoot: boolean) {
  const filterStepConditions: object[] = [];

  conditionGroup.conditions.forEach((obj: any) => filterStepConditions.push(obj));

  if (conditionGroup.groups && conditionGroup.groups.length > 0) {
    conditionGroup.groups.forEach((_obj: any, index: number) =>
      filterStepConditions.push(buildFilterStepTree(conditionGroup.groups[index], false)),
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

  if (isRoot) {
    return {
      name: 'filter',
      condition: filterStepGroup,
    };
  } else {
    return filterStepGroup;
  }
}
