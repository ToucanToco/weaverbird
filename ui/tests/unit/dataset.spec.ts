import { DataSet } from '@/lib/dataset';
import {
  addLocalUniquesToDataset,
  iterateRecords,
  updateLocalUniquesFromDatabase,
} from '@/lib/dataset/helpers';
import {
  _guessType,
  inferTypeFromDataset,
  MongoResults,
  mongoResultsToDataset,
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

describe('dataset records iteration', () => {
  it('should handle empty datasets', () => {
    const dataset: DataSet = { headers: [], data: [] };
    expect(Array.from(iterateRecords(dataset))).toEqual([]);
  });

  it('should iterate on dataset records', () => {
    const dataset: DataSet = {
      headers: [{ name: 'city' }, { name: 'density' }, { name: 'isCapitalCity' }],
      data: [
        ['Paris', 61.7, true],
        ['Marseille', 40, false],
        ['Berlin', 41.5, true],
      ],
    };
    expect(Array.from(iterateRecords(dataset))).toEqual([
      { city: 'Paris', density: 61.7, isCapitalCity: true },
      { city: 'Marseille', density: 40, isCapitalCity: false },
      { city: 'Berlin', density: 41.5, isCapitalCity: true },
    ]);
  });
});

describe('dataset local uniques computation', () => {
  it('should handle empty datasets with no columns', () => {
    const dataset: DataSet = { headers: [], data: [] };
    const extendedDataset = addLocalUniquesToDataset(dataset);
    expect(dataset).toEqual({ headers: [], data: [] });
    expect(extendedDataset).toEqual({
      headers: [],
      data: [],
    });
  });

  it('should handle empty datasets with columns', () => {
    const dataset: DataSet = { headers: [{ name: 'city' }, { name: 'density' }], data: [] };
    const extendedDataset = addLocalUniquesToDataset(dataset);
    expect(dataset).toEqual({ headers: [{ name: 'city' }, { name: 'density' }], data: [] });
    expect(extendedDataset).toEqual({
      headers: [
        { name: 'city', uniques: { values: [], loaded: true } },
        { name: 'density', uniques: { values: [], loaded: true } },
      ],
      data: [],
    });
  });

  it('should handle datasets with pagesize > totalCount', () => {
    const dataset: DataSet = {
      headers: [
        { name: 'city' },
        { name: 'density' },
        { name: 'isCapitalCity' },
        { name: 'population' },
      ],
      data: [
        ['Paris', 61.7, true, { population: 9 }],
        ['Marseille', 40, false, { population: 4 }],
        ['Berlin', 41.5, true, { population: 3 }],
        ['Paris', 2, true, { population: 9 }],
      ],
      paginationContext: {
        pageno: 1,
        totalCount: 10,
        pagesize: 10,
      },
    };
    const extendedDataset = addLocalUniquesToDataset(dataset);
    expect(dataset).toEqual({
      headers: [
        { name: 'city' },
        { name: 'density' },
        { name: 'isCapitalCity' },
        { name: 'population' },
      ],
      data: [
        ['Paris', 61.7, true, { population: 9 }],
        ['Marseille', 40, false, { population: 4 }],
        ['Berlin', 41.5, true, { population: 3 }],
        ['Paris', 2, true, { population: 9 }],
      ],
      paginationContext: {
        pageno: 1,
        totalCount: 10,
        pagesize: 10,
      },
    });
    expect(extendedDataset).toEqual({
      headers: [
        {
          name: 'city',
          uniques: {
            values: [
              { value: 'Berlin', count: 1 },
              { value: 'Marseille', count: 1 },
              { value: 'Paris', count: 2 },
            ],
            loaded: true,
          },
        },
        {
          name: 'density',
          uniques: {
            values: [
              { value: 2, count: 1 }, // result order depends on the other columns because they have all the same count
              { value: 40, count: 1 },
              { value: 41.5, count: 1 },
              { value: 61.7, count: 1 },
            ],
            loaded: true,
          },
        },
        {
          name: 'isCapitalCity',
          uniques: {
            values: [
              { value: false, count: 1 },
              { value: true, count: 3 },
            ],
            loaded: true,
          },
        },
        {
          name: 'population',
          uniques: {
            values: [
              { value: { population: 3 }, count: 1 },
              { value: { population: 4 }, count: 1 },
              { value: { population: 9 }, count: 2 },
            ],
            loaded: true,
          },
        },
      ],
      data: [
        ['Paris', 61.7, true, { population: 9 }],
        ['Marseille', 40, false, { population: 4 }],
        ['Berlin', 41.5, true, { population: 3 }],
        ['Paris', 2, true, { population: 9 }],
      ],
      paginationContext: {
        pageno: 1,
        totalCount: 10,
        pagesize: 10,
      },
    });
  });

  it('should handle datasets', () => {
    const dataset: DataSet = {
      headers: [
        { name: 'city' },
        { name: 'density' },
        { name: 'isCapitalCity' },
        { name: 'population' },
      ],
      data: [
        ['Paris', 61.7, true, { population: 9 }],
        ['Marseille', 4, false, { population: 4 }],
        ['marseille', 35, false, { population: 4 }],
        ['Berlin', 41.5, true, { population: 3 }],
        ['Paris', 1, true, { population: 9 }],
        ['paris', 10, true, { population: 9 }],
      ],
      paginationContext: {
        pageno: 1,
        totalCount: 100,
        pagesize: 50,
      },
    };
    const extendedDataset = addLocalUniquesToDataset(dataset);
    expect(dataset).toEqual({
      headers: [
        { name: 'city' },
        { name: 'density' },
        { name: 'isCapitalCity' },
        { name: 'population' },
      ],
      data: [
        ['Paris', 61.7, true, { population: 9 }],
        ['Marseille', 4, false, { population: 4 }],
        ['marseille', 35, false, { population: 4 }],
        ['Berlin', 41.5, true, { population: 3 }],
        ['Paris', 1, true, { population: 9 }],
        ['paris', 10, true, { population: 9 }],
      ],
      paginationContext: {
        pageno: 1,
        totalCount: 100,
        pagesize: 50,
      },
    });
    expect(extendedDataset).toEqual({
      headers: [
        {
          name: 'city',
          uniques: {
            values: [
              { value: 'Berlin', count: 1 },
              { value: 'marseille', count: 1 },
              { value: 'Marseille', count: 1 },
              { value: 'paris', count: 1 },
              { value: 'Paris', count: 2 },
            ],
            loaded: false,
          },
        },
        {
          name: 'density',
          uniques: {
            values: [
              { value: 1, count: 1 },
              { value: 4, count: 1 },
              { value: 10, count: 1 },
              { value: 35, count: 1 },
              { value: 41.5, count: 1 },
              { value: 61.7, count: 1 },
            ],
            loaded: false,
          },
        },
        {
          name: 'isCapitalCity',
          uniques: {
            values: [
              { value: false, count: 2 },
              { value: true, count: 4 },
            ],
            loaded: false,
          },
        },
        {
          name: 'population',
          uniques: {
            values: [
              { value: { population: 3 }, count: 1 },
              { value: { population: 4 }, count: 2 },
              { value: { population: 9 }, count: 3 },
            ],
            loaded: false,
          },
        },
      ],
      data: [
        ['Paris', 61.7, true, { population: 9 }],
        ['Marseille', 4, false, { population: 4 }],
        ['marseille', 35, false, { population: 4 }],
        ['Berlin', 41.5, true, { population: 3 }],
        ['Paris', 1, true, { population: 9 }],
        ['paris', 10, true, { population: 9 }],
      ],
      paginationContext: {
        pageno: 1,
        totalCount: 100,
        pagesize: 50,
      },
    });
  });
});

describe('dataset update local Uniques', () => {
  it('should update header of dataset', () => {
    const datasetToUpdate = {
      headers: [
        {
          name: 'city',
          uniques: {
            values: [
              { value: 'Paris', count: 2 },
              { value: 'Marseille', count: 1 },
              { value: 'Berlin', count: 1 },
            ],
            loaded: false,
          },
        },
        {
          name: 'density',
          uniques: {
            values: [
              { value: 2, count: 1 },
              { value: 40, count: 1 },
              { value: 41.5, count: 1 },
              { value: 61.7, count: 1 },
            ],
            loaded: false,
          },
        },
        {
          name: 'isCapitalCity',
          uniques: {
            values: [
              { value: true, count: 3 },
              { value: false, count: 1 },
            ],
            loaded: false,
          },
        },
      ],
      data: [
        ['Paris', 61.7, true],
        ['Marseille', 40, false],
        ['Berlin', 41.5, true],
        ['Paris', 2, true],
      ],
    };
    expect(
      updateLocalUniquesFromDatabase(datasetToUpdate, {
        headers: [{ name: 'city' }, { name: '__vqb_count__' }],
        data: [
          ['Paris', 4],
          ['Marseille', 5],
          ['Berlin', 10],
          ['Washington', 2],
        ],
      }),
    ).toEqual({
      headers: [
        {
          name: 'city',
          uniques: {
            values: [
              { value: 'Berlin', count: 10 },
              { value: 'Marseille', count: 5 },
              { value: 'Paris', count: 4 },
              { value: 'Washington', count: 2 },
            ],
            loaded: true,
          },
        },
        {
          name: 'density',
          uniques: {
            values: [
              { value: 2, count: 1 },
              { value: 40, count: 1 },
              { value: 41.5, count: 1 },
              { value: 61.7, count: 1 },
            ],
            loaded: false,
          },
        },
        {
          name: 'isCapitalCity',
          uniques: {
            values: [
              { value: true, count: 3 },
              { value: false, count: 1 },
            ],
            loaded: false,
          },
        },
      ],
      data: [
        ['Paris', 61.7, true],
        ['Marseille', 40, false],
        ['Berlin', 41.5, true],
        ['Paris', 2, true],
      ],
    });
  });

  it('should update dataset', () => {
    const datasetToUpdate = {
      headers: [
        {
          name: 'city',
          uniques: {
            values: [
              { value: 'Paris', count: 2 },
              { value: 'Marseille', count: 1 },
              { value: 'Berlin', count: 1 },
            ],
            loaded: false,
          },
        },
        {
          name: 'density',
          uniques: {
            values: [
              { value: 2, count: 1 },
              { value: 40, count: 1 },
              { value: 41.5, count: 1 },
              { value: 61.7, count: 1 },
            ],
            loaded: false,
          },
        },
        {
          name: 'isCapitalCity',
          uniques: {
            values: [
              { value: true, count: 3 },
              { value: false, count: 1 },
            ],
            loaded: false,
          },
        },
      ],
      data: [
        ['Paris', 61.7, true],
        ['Marseille', 40, false],
        ['Berlin', 41.5, true],
        ['Paris', 2, true],
      ],
    };
    expect(
      updateLocalUniquesFromDatabase(datasetToUpdate, {
        headers: [{ name: 'isCapitalCity' }, { name: '__vqb_count__' }],
        data: [
          [true, 16],
          [false, 5],
        ],
      }),
    ).toEqual({
      headers: [
        {
          name: 'city',
          uniques: {
            values: [
              { value: 'Paris', count: 2 },
              { value: 'Marseille', count: 1 },
              { value: 'Berlin', count: 1 },
            ],
            loaded: false,
          },
        },
        {
          name: 'density',
          uniques: {
            values: [
              { value: 2, count: 1 },
              { value: 40, count: 1 },
              { value: 41.5, count: 1 },
              { value: 61.7, count: 1 },
            ],
            loaded: false,
          },
        },
        {
          name: 'isCapitalCity',
          uniques: {
            values: [
              { value: false, count: 5 },
              { value: true, count: 16 },
            ],
            loaded: true,
          },
        },
      ],
      data: [
        ['Paris', 61.7, true],
        ['Marseille', 40, false],
        ['Berlin', 41.5, true],
        ['Paris', 2, true],
      ],
    });
  });
});
