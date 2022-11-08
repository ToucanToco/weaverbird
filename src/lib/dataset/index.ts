/**
 * This module contains helpers and definitions related to datasets.
 */
import { ColumnValueStat } from './helpers';
import { PaginationContext } from './pagination';

export type DataSetColumnType =
  | 'integer'
  | 'float'
  | 'long'
  | 'boolean'
  | 'string'
  | 'date'
  | 'object'
  | 'geometry';
export type ColumnTypeMapping = {
  [col: string]: DataSetColumnType | undefined;
};

export type DataSetColumn = {
  name: string;
  type?: DataSetColumnType;
  uniques?: {
    values: ColumnValueStat[];
    loaded: boolean;
  };
};

/**
 * Here's a dataset example:
 * ```javascript
 * {
 *     headers: [
 *         { name: 'col1' },
 *         { name: 'col2' },
 *         { name: 'col3' }
 *     ],
 *     data: [
 *         [ 'ab', 12, true ],
 *         [ 'cd', 13, null ]
 *     ]
 * }
 *
 * NOTE that we use `null` to represent empty values.
 * ```
 */
export type DataSet = {
  headers: DataSetColumn[];
  data: any[][];
  /**
   * pagination context (i.e. number of results displayed per page and current page number)
   */
  paginationContext?: PaginationContext;
  previewContext?: {
    sourceRowsSubset?: number | 'unlimited';
  };
};
