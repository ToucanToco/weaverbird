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

export type PipelineStep =
  | DomainStep
  | FilterStep
  | SelectStep
  | RenameStep
  | DeleteStep
  | NewColumnStep
  | ReplaceStep
  | CustomStep;
