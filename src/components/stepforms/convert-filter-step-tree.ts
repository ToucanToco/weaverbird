import { FilterComboAnd, FilterComboOr, FilterSimpleCondition } from '@/lib/steps';

import { AbstractFilterTree } from './ConditionsEditor/ConditionsGroup.vue';

// export type GenericFilterTree<ConditionType extends AbstractCondition> = {
//   conditions: ConditionType[];
//   groups: GenericFilterTree<ConditionType>[];
//   operator: ConditionOperator;
// };
// export type ConditionOperator = 'and' | 'or';
// export type AbstractCondition = any;
// export type AbstractFilterTree = GenericFilterTree<AbstractCondition>;

export function isFilterStepGroup(
  groupOrCondition: FilterSimpleCondition | FilterComboAnd | FilterComboOr,
) {
  // Can be undefined when a new row is added
  if (groupOrCondition) {
    return ['and', 'or'].includes(Object.keys(groupOrCondition)[0]);
  } else {
    return false;
  }
}

export function buildConditionsEditorTree(
  groupOrCondition: FilterSimpleCondition | FilterComboAnd | FilterComboOr,
) {
  const operator = isFilterStepGroup(groupOrCondition) ? Object.keys(groupOrCondition)[0] : '';
  const conditions: object[] = [];
  const groups: object[] = [];

  if (isFilterStepGroup(groupOrCondition)) {
    const group = groupOrCondition;
    group[operator].forEach((obj: any) =>
      isFilterStepGroup(obj) ? groups.push(buildConditionsEditorTree(obj)) : conditions.push(obj),
    );
  } else {
    const condition = groupOrCondition;
    conditions.push(condition);
  }

  return {
    operator: operator,
    conditions: conditions,
    groups: groups,
  };
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
