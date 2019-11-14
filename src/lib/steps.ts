/**
 * This module defines the supported unit-of-transformation steps.
 */

type PrimitiveType = number | boolean | string | Date;
type Templatable<T> = T | string;

export type AppendStep = {
  name: 'append';
  pipelines: Pipeline[];
};

export type AggFunctionStep = {
  /** Name of the output column */
  newcolumn: string;
  /** the aggregation operation (e.g. `sum` or `count`) */
  aggfunction: 'sum' | 'avg' | 'count' | 'min' | 'max';
  /** the column the aggregation function is working on */
  column: string;
};

export type AggregationStep = {
  name: 'aggregate';
  /** the list columns we want to aggregate on */
  on: string[];
  /** the list of aggregation operations to perform */
  aggregations: AggFunctionStep[];
};

export type ArgmaxStep = {
  name: 'argmax';
  column: string; // column in which to search for max value
  groups?: string[]; // if specified, will search for a max in every group
};

export type ArgminStep = {
  name: 'argmin';
  column: string; // column in which to search for max value
  groups?: string[]; // if specified, will search for a max in every group
};

export type ConcatenateStep = {
  name: 'concatenate';
  columns: string[];
  separator: string;
  new_column_name: string;
};

export type CustomStep = {
  name: 'custom';
  query: object;
};

export type DeleteStep = {
  name: 'delete';
  columns: string[];
};

export type DomainStep = {
  name: 'domain';
  domain: string;
};

export type DuplicateColumnStep = {
  name: 'duplicate';
  column: string;
  new_column_name: string;
};

export type FillnaStep = {
  name: 'fillna';
  column: string;
  value: PrimitiveType;
};

export type FilterComboAnd = {
  and: (FilterSimpleCondition | FilterComboAnd | FilterComboOr)[];
};

export type FilterComboOr = {
  or: (FilterSimpleCondition | FilterComboAnd | FilterComboOr)[];
};

export type FilterSimpleCondition =
  | FilterConditionComparison
  | FilterConditionEquality
  | FilterConditionInclusion;

type FilterConditionComparison = {
  column: string;
  value: number | string;
  operator: 'gt' | 'ge' | 'lt' | 'le';
};

type FilterConditionEquality = {
  column: string;
  value: any;
  operator: 'eq' | 'ne';
};

type FilterConditionInclusion = {
  column: string;
  value: any[];
  operator: 'in' | 'nin';
};

export type FilterStep = {
  name: 'filter';
  condition: FilterSimpleCondition | FilterComboAnd | FilterComboOr;
};

export type FormulaStep = {
  name: 'formula';
  new_column: string;
  formula: string;
};

export type FromDateStep = {
  name: 'fromdate';
  column: string;
  format: string;
};

export type PercentageStep = {
  name: 'percentage';
  column: string;
  group?: string[];
};

export type PivotStep = {
  name: 'pivot';
  index: string[];
  column_to_pivot: string;
  value_column: string;
  agg_function: 'sum' | 'avg' | 'count' | 'min' | 'max';
};

export type RenameStep = {
  name: 'rename';
  oldname: string;
  newname: string;
};

export type ReplaceStep = {
  name: 'replace';
  search_column: string;
  to_replace: any[][];
};

export type SelectStep = {
  name: 'select';
  columns: string[];
};

export type SortColumnType = {
  column: string;
  order: 'asc' | 'desc';
};

export type SortStep = {
  name: 'sort';
  columns: SortColumnType[];
};

export type SplitStep = {
  name: 'split';
  column: string;
  delimiter: string;
  number_cols_to_keep: number;
};

export type SubstringStep = {
  name: 'substring';
  column: string;
  start_index: number;
  end_index: number;
};

export type ToDateStep = {
  name: 'todate';
  column: string;
  format?: string;
};

export type ToLowerStep = {
  name: 'lowercase';
  column: string;
};

export type TopStep = {
  name: 'top';
  groups?: string[];
  rank_on: string;
  sort: 'asc' | 'desc';
  limit: Templatable<number>;
};

export type ToUpperStep = {
  name: 'uppercase';
  column: string;
};

export type UnpivotStep = {
  name: 'unpivot';
  keep: string[];
  unpivot: string[];
  unpivot_column_name: string;
  value_column_name: string;
  dropna: boolean;
};

export type PipelineStep =
  | AggregationStep
  | AppendStep
  | ArgmaxStep
  | ArgminStep
  | ConcatenateStep
  | CustomStep
  | DeleteStep
  | DuplicateColumnStep
  | DomainStep
  | FillnaStep
  | FilterStep
  | FormulaStep
  | FromDateStep
  | PercentageStep
  | PivotStep
  | RenameStep
  | ReplaceStep
  | SelectStep
  | SplitStep
  | SortStep
  | SubstringStep
  | ToDateStep
  | ToLowerStep
  | TopStep
  | ToUpperStep
  | UnpivotStep;

export type PipelineStepName = PipelineStep['name'];
export type Pipeline = PipelineStep[];

/**
 * Type guard for `FilterComboAnd` type
 * @param cond the condition to test
 */
export function isFilterComboAnd(
  cond: FilterSimpleCondition | FilterComboAnd | FilterComboOr,
): cond is FilterComboAnd {
  if ((cond as FilterComboAnd).and) {
    return true;
  }
  return false;
}

/**
 * Type guard for `FilterComboOr` type
 * @param cond the condition to test
 */
export function isFilterComboOr(
  cond: FilterSimpleCondition | FilterComboAnd | FilterComboOr,
): cond is FilterComboOr {
  if ((cond as FilterComboOr).or) {
    return true;
  }
  return false;
}
