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

/**
 * uniqueStatsDataset is a Dataset with two columns:
 *   - the inspected column
 *   - the `__vqb_count__` column
 *
 * Example:
 * uniqueStatsDataset = {
 *   headers: [{name: 'City'}, {name: '__vqb_count__'}]
 *   data: [
 *     ['Paris', 10],
 *     ['Lyon', 1]
 *     ['Marseille', 2]
 *   ]
 * }
 * The output will be:
 * ['City', {
 *   Paris:  {value: 'Paris', count: 10},
 *   Lyon:  {value: 'Lyon', count: 1},
 *   Marseille:  {value: 'Marseille', count: 2},
 * }]
 */
export function _prepareColumnStats(uniqueStatsDataset: DataSet): [string, ColumnValueStat[]] {
  const columns: string[] = uniqueStatsDataset.headers.map(e => e.name);
  const indexOfCount: number = columns.indexOf('__vqb_count__');
  const indexOfColumn: number = 1 - indexOfCount; // Trick to get the index of `${column}` in the `columns` array.
  // In the example above I get:
  // columns=['City', '__vqb_count__']; indexOfCount=1; indexOfColumn=0;

  const columnStats: ColumnValueStat[] = uniqueStatsDataset.data.map(
    (row: any[]): ColumnValueStat => {
      return {
        value: row[indexOfColumn],
        count: row[indexOfCount],
      };
    },
  );
  return [columns[indexOfColumn], columnStats];
}

/**
 * Merge a dataset's local value statistics with actual backend statistics.
 *
 * For a given column in the input dataset, if new statistics are found in the
 * incoming statistics, override the local ones.
 *
 * @param {DataSet} dataset the dataset to update
 * @param {object} uniqueStats a mapping columnname → dataset that
 * supposedly come from a backend.
 *
 * @return the _new_ dataset. The original one is left untouched.
 */
export function updateLocalUniquesFromDatabase(dataset: DataSet, uniqueStatsDataset: DataSet) {
  const [column, columnStats] = _prepareColumnStats(uniqueStatsDataset);
  const newHeaders = [];
  for (const hdr of dataset.headers) {
    if (hdr.name !== column) {
      newHeaders.push(hdr);
    } else {
      newHeaders.push({
        ...hdr,
        uniques: {
          values: columnStats.sort(_statCompare),
          loaded: true,
        },
      });
    }
  }
  return { ...dataset, headers: newHeaders };
}
