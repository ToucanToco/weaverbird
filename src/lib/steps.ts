/**
 * This module defines the supported unit-of-transformation steps.
 */

type PrimitiveType = number | boolean | string | Date;

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

export type NewColumnStep = Readonly<{
  name: 'newcolumn';
  column: string;
  query: object | string;
}>;

export type PercentageStep = Readonly<{
  name: 'percentage';
  new_column?: string;
  column: string;
  group?: Array<string>;
}>;

export type PivotStep = Readonly<{
  name: 'pivot';
  index: ['column_1', 'column_2']; // fixed column(s) around which to pivot data
  column_to_pivot: 'column_3';
  value_column: 'column_4'; // value column to be used to populate pivoted column
  // function used to aggregate data when several rows are found by index group
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
  oldvalue: string;
  newvalue: string;
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

export type PipelineStep =
  | AggregationStep
  | ArgmaxStep
  | ArgminStep
  | CustomStep
  | DeleteStep
  | DomainStep
  | FillnaStep
  | FilterStep
  | NewColumnStep
  | PercentageStep
  | PivotStep
  | RenameStep
  | ReplaceStep
  | SelectStep
  | SortStep
  | TopStep;

export type PipelineStepName = PipelineStep['name'];
