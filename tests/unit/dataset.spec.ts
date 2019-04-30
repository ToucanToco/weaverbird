import { mongoResultsToDataset, MongoResults } from '@/lib/dataset';

describe('Dataset helper tests', () => {
  it('should be able to handle empty mongo results', () => {
    const mongoResults: MongoResults = [];
    const dataset = mongoResultsToDataset(mongoResults);
    expect(dataset.columns).toEqual([]);
    expect(dataset.data).toEqual([]);
  });

  it('should be able to convert homegeneous mongo results', () => {
    const mongoResults: MongoResults = [
      { col1: 'foo', col2: 42, col3: true },
      { col1: 'bar', col2: 7, col3: false },
    ];
    const dataset = mongoResultsToDataset(mongoResults);
    expect(dataset.columns).toEqual([{ name: 'col1' }, { name: 'col2' }, { name: 'col3' }]);
    expect(dataset.data).toEqual([['foo', 42, true], ['bar', 7, false]]);
  });

  it('should be able to convert heterogeneous mongo results', () => {
    const mongoResults: MongoResults = [
      { col1: 'foo', col3: true },
      { col1: 'bar', col2: 7, col4: '?' },
    ];
    const dataset = mongoResultsToDataset(mongoResults);
    expect(dataset.columns).toEqual([
      { name: 'col1' },
      { name: 'col2' },
      { name: 'col3' },
      { name: 'col4' },
    ]);
    expect(dataset.data).toEqual([['foo', undefined, true, undefined], ['bar', 7, undefined, '?']]);
  });
});
