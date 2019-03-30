import { PipelineStep } from '@/lib/steps';
import { getTranslator } from '@/lib/translators/toolchain';

describe('Pipeline to mongo translator', () => {
  const mongo36translator = getTranslator('mongo36');

  it('can generate domain steps', () => {
    const pipeline: Array<PipelineStep> = [{ name: 'domain', domain: 'test_cube' }];
    const querySteps = mongo36translator(pipeline);
    expect(querySteps).toEqual([{ $match: { domain: 'test_cube' } }]);
  });

  it('can generate match steps', () => {
    const pipeline: Array<PipelineStep> = [
      { name: 'domain', domain: 'test_cube' },
      { name: 'select', columns: ['Region'] },
      { name: 'rename', oldname: 'Region', newname: 'zone' },
      { name: 'delete', columns: ['Manager'] },
      {
        name: 'newcolumn',
        column: 'id',
        query: { $concat: ['$country', ' - ', '$Region'] },
      },
    ];
    const querySteps = mongo36translator(pipeline);
    expect(querySteps).toEqual([
      { $match: { domain: 'test_cube' } },
      {
        $project: {
          Region: 1,
          zone: '$Region',
          Manager: 0,
          id: { $concat: ['$country', ' - ', '$Region'] },
        },
      },
    ]);
  });

  it('can generate filter steps', () => {
    const pipeline: Array<PipelineStep> = [
      { name: 'domain', domain: 'test_cube' },
      { name: 'filter', column: 'Manager', value: 'Pierre' },
      { name: 'filter', column: 'Region', value: 'Europe', operator: 'eq' },
    ];
    const querySteps = mongo36translator(pipeline);
    expect(querySteps).toEqual([
      { $match: { domain: 'test_cube', Manager: 'Pierre', Region: 'Europe' } },
    ]);
  });

  it('can translate aggregation steps', () => {
    const pipeline: Array<PipelineStep> = [
      { name: 'domain', domain: 'test_cube' },
      {
        name: 'aggregate',
        on: ['col_agg1', 'col_agg2'],
        aggregations: [
          {
            name: 'sum',
            aggfunction: 'sum',
            column: 'col1',
          },
          {
            name: 'average',
            aggfunction: 'avg',
            column: 'col2',
          },
          {
            name: 'minimum',
            aggfunction: 'min',
            column: 'col1',
          },
        ],
      },
    ];
    const querySteps = mongo36translator(pipeline);
    expect(querySteps).toEqual([
      { $match: { domain: 'test_cube' } },
      {
        $group: {
          _id: { col_agg1: '$col_agg1', col_agg2: '$col_agg2' },
          sum: { $sum: '$col1' },
          average: { $avg: '$col2' },
          minimum: { $min: '$col1' },
        },
      },
      {
        $project: {
          col_agg1: '$_id.col_agg1',
          col_agg2: '$_id.col_agg2',
          sum: 1,
          average: 1,
          minimum: 1,
        },
      },
    ]);
  });

  it('can simplify complex queries', () => {
    const pipeline: Array<PipelineStep> = [
      { name: 'domain', domain: 'test_cube' },
      { name: 'filter', column: 'Manager', value: 'Pierre' },
      { name: 'select', columns: ['Region'] },
      { name: 'rename', oldname: 'Region', newname: 'zone' },
      { name: 'delete', columns: ['Manager'] },
      { name: 'newcolumn', column: 'id', query: { $concat: ['$country', ' - ', '$Region'] } },
      {
        name: 'custom',
        query: { $group: { _id: '$country', population: { $sum: '$population' } } },
      },
    ];
    const querySteps = mongo36translator(pipeline);
    expect(querySteps).toEqual([
      { $match: { domain: 'test_cube', Manager: 'Pierre' } },
      {
        $project: {
          Region: 1,
          zone: '$Region',
          Manager: 0,
          id: { $concat: ['$country', ' - ', '$Region'] },
        },
      },
      {
        $group: { _id: '$country', population: { $sum: '$population' } },
      },
    ]);
  });
});
