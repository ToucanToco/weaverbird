/**
 * This module defines the supported unit-of-transformation steps.
 */

type PrimitiveType = number | boolean | string | Date;

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

export type FilterStep = {
  name: 'filter';
  column: string;
  value: any;
  operator?: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'in' | 'nin';
};

export type FormulaStep = {
  name: 'formula';
  new_column: string;
  formula: string;
};

export type PercentageStep = {
  name: 'percentage';
  new_column?: string;
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
  new_column?: string;
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

export type TopStep = {
  name: 'top';
  groups?: string[];
  rank_on: string;
  sort: 'asc' | 'desc';
  limit: number;
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
  | ArgmaxStep
  | ArgminStep
  | CustomStep
  | DeleteStep
  | DuplicateColumnStep
  | DomainStep
  | FillnaStep
  | FilterStep
  | FormulaStep
  | PercentageStep
  | PivotStep
  | RenameStep
  | ReplaceStep
  | SelectStep
  | SortStep
  | TopStep
  | UnpivotStep;

export type PipelineStepName = PipelineStep['name'];
export type Pipeline = PipelineStep[];
export type Writable<T> = { -readonly [K in keyof T]: T[K] };
