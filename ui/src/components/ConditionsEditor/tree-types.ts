export type GenericFilterTree<ConditionType extends AbstractCondition> = {
  conditions: ConditionType[];
  groups: GenericFilterTree<ConditionType>[];
  operator: ConditionOperator;
};

export type ConditionOperator = 'and' | 'or' | '';
export type AbstractCondition = any;
export type AbstractFilterTree = GenericFilterTree<AbstractCondition>;
