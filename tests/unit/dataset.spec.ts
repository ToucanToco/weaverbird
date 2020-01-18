import { DataSet } from '@/lib/dataset';
import {
  mongoResultsToDataset,
  MongoResults,
  _guessType,
  inferTypeFromDataset,
} from '@/lib/dataset/mongo';

/**
 * helper functions to sort a dataset so that we can test output in a predictible way.
 *
 * @param dataset input dataset
 * @return the sorted dataset
 */
function _sortDataset(dataset: DataSet): DataSet {
  const sortedColumns = Array.from(dataset.headers).sort((col1, col2) =>
    col1.name.localeCompare(col2.name),
  );
  const reorderMap = sortedColumns.map(colname => dataset.headers.indexOf(colname));
  const sortedData = [];
  for (const row of dataset.data) {
    sortedData.push(reorderMap.map(newidx => row[newidx]));
  }
  return {
    headers: sortedColumns,
    data: sortedData,
    paginationContext: dataset.paginationContext,
  };
}

describe('_sortDataset tests', () => {
  it('should be able to leave as is sorted results', () => {
    const dataset: DataSet = {
      headers: [{ name: 'col1' }, { name: 'col2' }, { name: 'col3' }],
      data: [
        [1, 2, 3],
        [4, 5, 6],
      ],
      paginationContext: { pageno: 1, pagesize: 50, totalCount: 2 },
    };
    const sorted = _sortDataset(dataset);
    expect(sorted.headers).toEqual([{ name: 'col1' }, { name: 'col2' }, { name: 'col3' }]);
    expect(sorted.data).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it('should be able to sort results', () => {
    const dataset: DataSet = {
      headers: [{ name: 'col3' }, { name: 'col1' }, { name: 'col4' }, { name: 'col2' }],
      data: [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
      ],
      paginationContext: { pageno: 1, pagesize: 50, totalCount: 2 },
    };
    const sorted = _sortDataset(dataset);
    expect(sorted.headers).toEqual([
      { name: 'col1' },
      { name: 'col2' },
      { name: 'col3' },
      { name: 'col4' },
    ]);
    expect(sorted.data).toEqual([
      [2, 4, 1, 3],
      [6, 8, 5, 7],
    ]);
  });
});

describe('Dataset helper tests', () => {
  it('should be able to handle empty mongo results', () => {
    const mongoResults: MongoResults = [];
    const dataset = mongoResultsToDataset(mongoResults);
    expect(dataset.headers).toEqual([]);
    expect(dataset.data).toEqual([]);
  });

  it('should be able to convert homegeneous mongo results', () => {
    const mongoResults: MongoResults = [
      { col1: 'foo', col2: 42, col3: true },
      { col1: 'bar', col2: 7, col3: false },
    ];
    const dataset = _sortDataset(mongoResultsToDataset(mongoResults));
    expect(dataset.headers).toEqual([{ name: 'col1' }, { name: 'col2' }, { name: 'col3' }]);
    expect(dataset.data).toEqual([
      ['foo', 42, true],
      ['bar', 7, false],
    ]);
  });

  it('should be able to convert heterogeneous mongo results', () => {
    const mongoResults: MongoResults = [
      { col1: 'foo', col3: true },
      { col1: 'bar', col2: 7, col4: '?' },
    ];
    const dataset = _sortDataset(mongoResultsToDataset(mongoResults));
    expect(dataset.headers).toEqual([
      { name: 'col1' },
      { name: 'col2' },
      { name: 'col3' },
      { name: 'col4' },
    ]);
    expect(dataset.data).toEqual([
      ['foo', null, true, null],
      ['bar', 7, null, '?'],
    ]);
  });
});

describe('_guessType', () => {
  it('should return float', () => {
    const val = _guessType(42.34);
    expect(val).toEqual('float');
  });

  it('should return integer', () => {
    const val = _guessType(42);
    expect(val).toEqual('integer');
  });

  it('should return string', () => {
    const val = _guessType('value');
    expect(val).toEqual('string');
  });

  it('should return boolean', () => {
    const val = _guessType(false);
    expect(val).toEqual('boolean');
  });

  it('should return date', () => {
    const val = _guessType(new Date());
    expect(val).toEqual('date');
  });

  it('should return object', () => {
    const val = _guessType({ value: 'my_value' });
    expect(val).toEqual('object');
  });

  it('should return null when value is null', () => {
    const val = _guessType(null);
    expect(val).toEqual(null);
  });

  it('should return null when value is undefined', () => {
    const val = _guessType(undefined);
    expect(val).toEqual(null);
  });

  it('should return null when value is Symbol', () => {
    const val = _guessType(Symbol());
    expect(val).toEqual(null);
  });

  it('should return null when value is function', () => {
    const val = _guessType(() => {});
    expect(val).toEqual(null);
  });
});

describe('inferTypeFromDataset', () => {
  it('should guess the right type of the columns', () => {
    const dataset: DataSet = {
      headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
      data: [
        ['Paris', 10000000, true],
        ['Marseille', 3000000, false],
        ['Berlin', 1300000, true],
        ['Avignon', 100000, false],
        ['La Souterraine', 0, false],
        ['New York City', 10000000, false],
        ['Rio de Janeiro', 4000000, false],
      ],
      paginationContext: { pageno: 1, pagesize: 50, totalCount: 7 },
    };
    const datasetWithInferredType = inferTypeFromDataset(dataset);
    expect(datasetWithInferredType.headers).toEqual([
      { name: 'city', type: 'string' },
      { name: 'population', type: 'integer' },
      { name: 'isCapitalCity', type: 'boolean' },
    ]);
  });

  it('should infer type even with mixed values if we set maxRows low enough', () => {
    const dataset: DataSet = {
      headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
      data: [
        ['Paris', 10000000, true],
        ['Marseille', 3000000, false],
        ['Berlin', 1300000, true],
        ['Avignon', 100000, false],
        ['La Souterraine', 0, false],
        ['New York City', 10000000, false],
        ['Rio de Janeiro', 4000000, false],
        [undefined, null, 10],
      ],
      paginationContext: { pageno: 1, pagesize: 50, totalCount: 7 },
    };
    const datasetWithInferredType = inferTypeFromDataset(dataset, 7);
    expect(datasetWithInferredType.headers).toEqual([
      { name: 'city', type: 'string' },
      { name: 'population', type: 'integer' },
      { name: 'isCapitalCity', type: 'boolean' },
    ]);
  });

  it('should not infer type with mixed values', () => {
    const dataset: DataSet = {
      headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
      data: [
        ['Paris', 10000000, true],
        ['Marseille', 3000000, false],
        ['Berlin', 1300000, true],
        ['Avignon', 100000, false],
        ['La Souterraine', 0, false],
        ['New York City', 10000000, false],
        ['Rio de Janeiro', 4000000, false],
        [undefined, false, 10],
      ],
      paginationContext: { pageno: 1, pagesize: 50, totalCount: 8 },
    };

    const datasetWithInferredType = inferTypeFromDataset(dataset);
    expect(datasetWithInferredType.headers).toEqual([
      { name: 'city' },
      { name: 'population' },
      { name: 'isCapitalCity' },
    ]);
  });

  it('should not infer type on column with undefined values', () => {
    const dataset: DataSet = {
      headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
      data: [['Paris', 10000000, undefined]],
      paginationContext: { pageno: 1, pagesize: 50, totalCount: 1 },
    };

    const datasetWithInferredType = inferTypeFromDataset(dataset, 1);
    expect(datasetWithInferredType.headers).toEqual([
      { name: 'city', type: 'string' },
      { name: 'population', type: 'integer' },
      { name: 'isCapitalCity' },
    ]);
  });

  it('should not infer type on column with null values', () => {
    const dataset: DataSet = {
      headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
      data: [['Paris', 10000000, null]],
      paginationContext: { pageno: 1, pagesize: 50, totalCount: 1 },
    };

    const datasetWithInferredType = inferTypeFromDataset(dataset, 1);
    expect(datasetWithInferredType.headers).toEqual([
      { name: 'city', type: 'string' },
      { name: 'population', type: 'integer' },
      { name: 'isCapitalCity' },
    ]);
  });

  it("should infer type on column with null values if there's other values in the column", () => {
    const dataset: DataSet = {
      headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
      data: [
        ['Paris', 10000000, null],
        ['Paris', 10000000, false],
      ],
      paginationContext: { pageno: 1, pagesize: 50, totalCount: 2 },
    };

    const datasetWithInferredType = inferTypeFromDataset(dataset);
    expect(datasetWithInferredType.headers).toEqual([
      { name: 'city', type: 'string' },
      { name: 'population', type: 'integer' },
      { name: 'isCapitalCity', type: 'boolean' },
    ]);
  });

  it('should not infer type on column with symbol values', () => {
    const dataset: DataSet = {
      headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
      data: [['Paris', 10000000, Symbol()]],
      paginationContext: { pageno: 1, pagesize: 50, totalCount: 1 },
    };

    const datasetWithInferredType = inferTypeFromDataset(dataset, 1);
    expect(datasetWithInferredType.headers).toEqual([
      { name: 'city', type: 'string' },
      { name: 'population', type: 'integer' },
      { name: 'isCapitalCity' },
    ]);
  });

  it('should not infer type on column with function values', () => {
    const dataset: DataSet = {
      headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
      data: [['Paris', 10000000, () => {}]],
      paginationContext: { pageno: 1, pagesize: 50, totalCount: 1 },
    };

    const datasetWithInferredType = inferTypeFromDataset(dataset, 1);
    expect(datasetWithInferredType.headers).toEqual([
      { name: 'city', type: 'string' },
      { name: 'population', type: 'integer' },
      { name: 'isCapitalCity' },
    ]);
  });

  it('should not infer a float type for mixed integer and float values', () => {
    const dataset: DataSet = {
      headers: [{ name: 'city' }, { name: 'density' }, { name: 'isCapitalCity' }],
      data: [
        ['Paris', 61.7, true],
        ['Marseille', 40, false],
        ['Berlin', 41.5, true],
      ],
      paginationContext: { pageno: 1, pagesize: 50, totalCount: 1 },
    };

    const datasetWithInferredType = inferTypeFromDataset(dataset);
    expect(datasetWithInferredType.headers).toEqual([
      { name: 'city', type: 'string' },
      { name: 'density', type: 'float' },
      { name: 'isCapitalCity', type: 'boolean' },
    ]);
  });
});
