/**
 * This module contains helpers and definitions related to datasets.
 */

export type DataSetColumn = {
  name: string;
  type?: 'integer' | 'float' | 'boolean' | 'string' | 'date' | 'object';
};

export type DataSet = {
  columns: Array<DataSetColumn>;
  data: Array<Array<any>>;
};

export type MongoDocument = { [k: string]: any };
export type MongoResults = Array<MongoDocument>;

/**
 * implement set union
 * > setUnion(new Set([1, 2, 3]), new Set([2, 4, 6]))
 * Set([1, 2, 3, 4, 6])
 */
function setUnion<T>(set1: Set<T>, set2: Set<T>): Set<T> {
  const result = new Set(set1);
  set2.forEach(val => result.add(val));
  return result;
}

/**
 * transform a mongo resultset (i.e. a list of json documents) into
 * a `DataSet` structure
 */
export function mongoResultsToDataset(results: MongoResults): DataSet {
  const dataset: DataSet = { columns: [], data: [] };
  if (results.length) {
    // each document migh have a different set of keys therefore we need
    // to loop over all documents and make the union of all keys
    const colnames = results.map(row => new Set(Object.keys(row))).reduce(setUnion, new Set());
    // transform set of names to list of DataSetColumn objects
    dataset.columns = Array.from(colnames).map(name => ({ name }));
    for (const row of results) {
      dataset.data.push(dataset.columns.map(coldef => row[coldef.name]));
    }
  }
  return dataset;
}
