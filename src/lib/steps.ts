/**
 * This module defines the supported unit-of-transformation steps.
 */

type PrimitiveType = number | boolean | string | Date;
type PropAny = { [prop: string]: any };

type AggFunctionStep = Readonly<{
  /** Name of the output column */
  newcolumn: string;
  /** the aggregation operation (e.g. `sum` or `count`) */
  aggfunction: 'sum' | 'avg' | 'count' | 'min' | 'max';
  /** the column the aggregation function is working on */
  column: string;
}>;

export type AggregationStep = Readonly<{
  name: 'aggregate';
  /** the list columns we want to aggregate on */
  on: Array<string>;
  /** the list of aggregation operations to perform */
  aggregations: Array<AggFunctionStep>;
}>;

export type ArgmaxStep = Readonly<{
  name: 'argmax';
  column: string; // column in which to search for max value
  groups?: Array<string>; // if specified, will search for a max in every group
}>;

export type ArgminStep = Readonly<{
  name: 'argmin';
  column: string; // column in which to search for max value
  groups?: Array<string>; // if specified, will search for a max in every group
}>;

export type CustomStep = Readonly<{
  name: 'custom';
  query: object;
}>;

export type DeleteStep = Readonly<{
  name: 'delete';
  columns: Array<string>;
}>;

export type DomainStep = Readonly<{
  name: 'domain';
  domain: string;
}>;

export type FillnaStep = Readonly<{
  name: 'fillna';
  column: string;
  value: PrimitiveType;
}>;

export type FilterStep = Readonly<{
  name: 'filter';
  column: string;
  value: any;
  operator?: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'in' | 'nin';
}>;

export type FormulaStep = Readonly<{
  name: 'formula';
  new_column: string;
  formula: string;
}>;

export type PercentageStep = Readonly<{
  name: 'percentage';
  new_column?: string;
  column: string;
  group?: Array<string>;
}>;

export type PivotStep = Readonly<{
  name: 'pivot';
  index: ['column_1', 'column_2'];
  column_to_pivot: 'column_3';
  value_column: 'column_4';
  agg_function: 'sum' | 'avg' | 'count' | 'min' | 'max';
}>;

export type RenameStep = Readonly<{
  name: 'rename';
  oldname: string;
  newname: string;
}>;

export type ReplaceStep = Readonly<{
  name: 'replace';
  search_column: string;
  new_column?: string;
  to_replace: Array<Array<any>>;
}>;

export type SelectStep = Readonly<{
  name: 'select';
  columns: Array<string>;
}>;

export type SortStep = Readonly<{
  name: 'sort';
  columns: Array<string>;
  order?: Array<'asc' | 'desc'>;
}>;

export type TopStep = Readonly<{
  name: 'top';
  groups?: Array<string>;
  rank_on: string;
  sort: 'asc' | 'desc';
  limit: number;
}>;

export type UnpivotStep = Readonly<{
  name: 'unpivot';
  keep: Array<string>;
  unpivot: Array<string>;
  unpivot_column_name: string;
  value_column_name: string;
  dropna: boolean;
}>;

export type PipelineStep =
  | AggregationStep
  | ArgmaxStep
  | ArgminStep
  | CustomStep
  | DeleteStep
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
