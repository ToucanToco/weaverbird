/**
 * This module contains helpers and definitions related to datasets.
 */

export type DataSetColumn = {
  name: string;
  type?: 'integer' | 'float' | 'boolean' | 'string' | 'date' | 'object';
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
};
