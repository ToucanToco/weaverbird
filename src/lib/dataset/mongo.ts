/**
 * mongo specific helpers for dataset manipulation.
 */

import { DataSet, DataSetColumn, DataSetColumnType } from '@/lib/dataset';

type MongoDocument = { [k: string]: any };
export type MongoResults = MongoDocument[];

/**
 * transform a mongo resultset (i.e. a list of json documents) into
 * a `DataSet` structure
 */
export function mongoResultsToDataset(results: MongoResults): DataSet {
  const dataset: DataSet = { headers: [], data: [] };
  if (results.length) {
    const colnames = results
      // get list of list of key
      .map(row => Object.keys(row))
      // then flatten them
      .flat()
      // and remove duplicates by keeping the _first_ occurence
      .filter((col, colidx, array) => array.indexOf(col) === colidx);
    // transform set of names to list of DataSetColumn objects
    dataset.headers = colnames.map(name => ({ name }));
    for (const row of results) {
      dataset.data.push(
        dataset.headers.map(coldef => (row.hasOwnProperty(coldef.name) ? row[coldef.name] : null)),
      );
    }
  }
  return dataset;
}

function _isSupportedType(val: any): val is DataSetColumnType {
  return val !== 'undefined' && val !== 'symbol' && val !== 'function';
}

function _isNumber(val: any): val is 'number' {
  return val === 'number' || val === 'bigint';
}

function _isInt(val: any) {
  return Number(val) === val && val % 1 === 0;
}

function _isFloat(val: any) {
  return Number(val) === val && val % 1 !== 0;
}

export function _guessType(val: any, prevType: any = null): DataSetColumnType | null {
  const type = typeof val;

  if (val === null) {
    return prevType;
  } else if (_isNumber(type)) {
    if (_isInt(val)) {
      return 'integer';
    } else if (_isFloat(val)) {
      return 'float';
    }
  } else if (type === 'object' && val instanceof Date) {
    return 'date';
  } else if (_isSupportedType(type) && val !== null) {
    return type;
  }

  return null;
}
