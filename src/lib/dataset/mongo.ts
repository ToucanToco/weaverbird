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

/**
 * @descritpion extend a `DataSet` headers with inferred types, base on value of columns
 * @param {DataSet} dataset - The dataset that we want to extend headers with inferred types
 * @param {number} [maxRows=50] - Determine on how many rows we're goind to do our guess
 *
 */
export function inferTypeFromDataset(dataset: DataSet, maxRows = 50): DataSet {
  // For the moment, we infer arbitrarily column's types on maximum the 50 first rows
  maxRows = Math.min(dataset.data.length, maxRows);
  const newHeaders: DataSetColumn[] = [];

  for (const [colidx, header] of dataset.headers.entries()) {
    let prevType = null;

    for (let j = 0; j < maxRows; j++) {
      const currentValue = dataset.data[j][colidx];
      const guessedType = _guessType(currentValue, prevType);

      if (prevType === null) {
        prevType = guessedType;
      } else if (prevType !== guessedType) {
        // if integers and floats are mixed, guessed type should be 'float'
        const typeSet = new Set([prevType, guessedType]);
        if (typeSet.has('integer') && typeSet.has('float')) {
          prevType = 'float';
        } else {
          prevType = null;
          break;
        }
      }
    }

    // We pass here if we find 2 different types in the same column
    if (prevType === null) {
      newHeaders.push(header);
    } else {
      newHeaders.push({ ...header, type: prevType as DataSetColumnType });
    }
  }

  // We return a new `DataSet` with the updated headers
  return { ...dataset, headers: newHeaders };
}
