/**
 * helper functions to manipulate datasets
 */

import { DataSet } from '@/lib/dataset';
import { enumerate } from '@/lib/helpers';

function datasetColumnNames(dataset: DataSet) {
  return dataset.headers.map(coldef => coldef.name);
}

export function* iterateRecords(dataset: DataSet) {
  const colnames = datasetColumnNames(dataset);
  for (const rowdata of dataset.data) {
    const record: Record<string, any> = {};
    for (const [idx, colname] of Object.entries(colnames)) {
      record[colname] = rowdata[Number(idx)];
    }
    yield record;
  }
}

export type ColumnValueStat = {
  value: any;
  count: number;
};

type ColumnStat = Record<any, ColumnValueStat>;

/**
 * Inspect a dataset and return, for each column, the list of its unique values.
 *
 * @param dataset the dataset to inspect
 * @return a mapping of column names to unique values. Order of values' occurrence
 * in the dataset is kept.
 */
function localUniqueStats(dataset: DataSet) {
  const colnames = datasetColumnNames(dataset);
  const columnValuesCount: Record<string, ColumnStat> = Object.fromEntries(
    colnames.map(c => [c, {}]),
  );
  for (const [, record] of enumerate(iterateRecords(dataset))) {
    for (const [colname, value] of Object.entries(record)) {
      const colRecord = columnValuesCount[colname];
      const valueStringified = value instanceof Object ? JSON.stringify(value) : value;
      if (colRecord[valueStringified] === undefined) {
        colRecord[valueStringified] = { value: valueStringified, count: 1 };
      } else {
        colRecord[valueStringified].count++;
      }
    }
  }
  return columnValuesCount;
}

/**
 * `ColumnValueStat` objects comparator, designed to be used with
 * `Array.prototype.sort`
 *
 * A `ColumnValueStat` object is considered lesser than another if its value occurrence is greater than the other,
 *
 * The idea is to make sure that more frequent values are found first.
 *
 * @param {ColumnValueStat} stat1 first item to compare
 * @param {ColumnValueStat} stat2 second item to compare
 *
 * @return 0 if both items share the same rank, any negative value if the first
 * item's rank is lesser than the other, any positive value otherwise.
 */
function _statCompare(stat1: ColumnValueStat, stat2: ColumnValueStat) {
  return stat2.count - stat1.count;
}

/**
 * Inspect a dataset and generate a new one with unique values statistics.
 *
 * @param {DataSet} dataset the dataset to update
 *
 * @return the _new_ dataset. The original one is left untouched.
 */
export function addLocalUniquesToDataset(dataset: DataSet) {
  const uniqueStats = localUniqueStats(dataset);
  const newHeaders = dataset.headers.map(hdr => ({
    ...hdr,
    uniques: {
      values: Object.values(uniqueStats[hdr.name]).sort(_statCompare),
      loaded: false,
    },
  }));
  return { ...dataset, headers: newHeaders };
}
