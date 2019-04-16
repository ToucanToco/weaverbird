/**
 * This module defines the supported unit-of-transformation steps.
 */

export interface DomainStep {
  name: 'domain';
  domain: string;
}

export interface FilterStep {
  name: 'filter';
  column: string;
  value: any;
  operator?: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'in' | 'nin';
}

export interface SelectStep {
  name: 'select';
  columns: Array<string>;
}

export interface RenameStep {
  name: 'rename';
  oldname: string;
  newname: string;
}

export interface DeleteStep {
  name: 'delete';
  columns: Array<string>;
}

export interface NewColumnStep {
  name: 'newcolumn';
  column: string;
  query: object | string;
}

interface AggFunctionStep {
  /** Name of the output column */
  newcolumn: string;
  /** the aggregation operation (e.g. `sum` or `count`) */
  aggfunction: 'sum' | 'avg' | 'count' | 'min' | 'max';
  /** the column the aggregation function is working on */
  column: string;
}

export interface AggregationStep {
  name: 'aggregate';
  /** the list columns we want to aggregate on */
  on: Array<string>;
  /** the list of aggregation operations to perform */
  aggregations: Array<AggFunctionStep>;
}

export interface CustomStep {
  name: 'custom';
  query: object;
}

export interface ReplaceStep {
  name: 'replace';
  search_column: string;
  new_column?: string;
  oldvalue: string;
  newvalue: string;
}

export interface SortStep {
  name: 'sort';
  columns: Array<string>;
  order?: Array<'asc' | 'desc'>;
}

export type PipelineStep =
  | DomainStep
  | FilterStep
  | SelectStep
  | RenameStep
  | DeleteStep
  | NewColumnStep
  | AggregationStep
  | ReplaceStep
  | SortStep
  | CustomStep;

export type PipelineStepName = PipelineStep['name'];
