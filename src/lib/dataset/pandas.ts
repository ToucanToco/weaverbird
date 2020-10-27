/**
 * Pandas specific helpers for dataset manipulation
 */

import { DataSet, DataSetColumnType } from '@/lib/dataset';

type ColumnIdentifier = string;
type PandasRecord = Record<ColumnIdentifier, any>;
type TableSchemaType =
  | 'integer'
  | 'number'
  | 'boolean'
  | 'datetime'
  | 'duration'
  | 'any'
  | 'string';

export interface PandasDataTable {
  schema: {
    fields: {
      name: ColumnIdentifier;
      type: TableSchemaType;
    }[];
  };
  data: PandasRecord[];
}

const COL_TYPE_MAPPING: Record<TableSchemaType, DataSetColumnType> = {
  integer: 'integer',
  number: 'float',
  boolean: 'boolean',
  datetime: 'date',
  duration: 'date',
  any: 'object',
  string: 'string',
};

function tableSchemaTypeToDataSetColumnType(tableSchemaType: TableSchemaType): DataSetColumnType {
  return COL_TYPE_MAPPING[tableSchemaType];
}

/**
 * Transform a pandas dataframe, exported with `.to_json(orient='table')` into * a `DataSet` structure
 *
 * The structure of the `orient='table'` format is:
 * ```
 * {
 *   schema: { fields: [{name, type}, ...] },
 *   data: [{column -> value}, ...]
 * }
 * ```
 *
 * See https://pandas.pydata.org/docs/user_guide/io.html#table-schema for more details on this format.
 *
 * TODO Handle pagination context
 */
export function pandasDataTableToDataset(pandasTable: PandasDataTable): DataSet {
  const dataset: DataSet = { headers: [], data: [] };
  dataset.headers = pandasTable.schema.fields.map(({ name, type }) => ({
    name,
    type: tableSchemaTypeToDataSetColumnType(type),
  }));
  for (const row of pandasTable.data) {
    dataset.data.push(
      dataset.headers.map(column =>
        Object.prototype.hasOwnProperty.call(row, column.name) ? row[column.name] : null,
      ),
    );
  }
  return dataset;
}
