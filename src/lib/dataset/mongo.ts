/**
 * mongo specific helpers for dataset manipulation.
 */

import { DataSet } from '@/lib/dataset';

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
