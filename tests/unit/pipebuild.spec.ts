import { PipelineStep } from '@/lib/steps';
import { MongoStep, mongoToPipe, pipeToMongo } from '@/lib/pipeline';

describe('Pipebuild translator', () => {
  it('generate domain step', () => {
    const query: Array<MongoStep> = [{ $match: { domain: 'test_cube' } }];
    const pipeline = mongoToPipe(query);
    expect(pipeline).toEqual([{ name: 'domain', domain: 'test_cube' }]);
  });

  it('generate domain and filter steps from one match', () => {
    const query: Array<MongoStep> = [
      { $match: { domain: 'test_cube', Region: 'Europe', Manager: 'Pierre' } },
    ];
    const pipeline = mongoToPipe(query);
    expect(pipeline).toEqual([
      { name: 'domain', domain: 'test_cube' },
      { name: 'filter', column: 'Manager', value: 'Pierre' },
      { name: 'filter', column: 'Region', value: 'Europe' },
    ]);
  });

  it('generate domain and filter steps', () => {
    const query: Array<MongoStep> = [
      { $match: { domain: 'test_cube' } },
      { $match: { Region: 'Europe' } },
    ];
    const pipeline = mongoToPipe(query);
    expect(pipeline).toEqual([
      { name: 'domain', domain: 'test_cube' },
      { name: 'filter', column: 'Region', value: 'Europe' },
    ]);
  });

  it('generate domain step and filter several columns step', () => {
    const query: Array<MongoStep> = [
      { $match: { domain: 'test_cube' } },
      { $match: { Region: 'Europe', Manager: 'Pierre' } },
    ];
    const pipeline = mongoToPipe(query);
    expect(pipeline).toEqual([
      { name: 'domain', domain: 'test_cube' },
      { name: 'filter', column: 'Manager', value: 'Pierre' },
      { name: 'filter', column: 'Region', value: 'Europe' },
    ]);
  });

  it('generate domain and rename steps', () => {
    const query: Array<MongoStep> = [
      { $match: { domain: 'test_cube' } },
      { $project: { zone: '$Region' } },
    ];
    const pipeline = mongoToPipe(query);
    expect(pipeline).toEqual([
      { name: 'domain', domain: 'test_cube' },
      { name: 'rename', oldname: 'Region', newname: 'zone' },
    ]);
  });

  it('generate domain and be clever if key and column are the same', () => {
    const query: Array<MongoStep> = [
      { $match: { domain: 'test_cube' } },
      { $project: { Region: '$Region' } },
    ];
    const pipeline = mongoToPipe(query);
    expect(pipeline).toEqual([
      { name: 'domain', domain: 'test_cube' },
      { name: 'select', columns: ['Region'] },
    ]);
  });

  it('generate domain and delete steps', () => {
    const query: Array<MongoStep> = [
      { $match: { domain: 'test_cube' } },
      { $project: { Manager: 0 } },
    ];
    const pipeline = mongoToPipe(query);
    expect(pipeline).toEqual([
      { name: 'domain', domain: 'test_cube' },
      { name: 'delete', columns: ['Manager'] },
    ]);
  });

  it('generate domain and custom steps from project :1', () => {
    const query: Array<MongoStep> = [
      { $match: { domain: 'test_cube' } },
      { $project: { Manager: 1 } },
    ];
    const pipeline = mongoToPipe(query);
    expect(pipeline).toEqual([
      { name: 'domain', domain: 'test_cube' },
      { name: 'select', columns: ['Manager'] },
    ]);
  });

  it('generate steps from heterogeneous project', () => {
    const query: Array<MongoStep> = [
      { $match: { domain: 'test_cube' } },
      {
        $project: {
          zone: '$Region',
          Region: '$Region',
          Manager: 0,
          id: { $concat: ['$country', ' - ', '$Region'] },
        },
      },
    ];
    const pipeline = mongoToPipe(query);
    expect(pipeline).toEqual([
      { name: 'domain', domain: 'test_cube' },
      { name: 'select', columns: ['Region'] },
      { name: 'rename', oldname: 'Region', newname: 'zone' },
      { name: 'delete', columns: ['Manager'] },
      {
        name: 'newcolumn',
        column: 'id',
        query: { $concat: ['$country', ' - ', '$Region'] },
      },
    ]);
  });

  it('generate domain and custom steps from unknown operator', () => {
    const query: Array<MongoStep> = [
      { $match: { domain: 'test_cube' } },
      { $group: { _id: '$Manager', Value: { $sum: '$Value' } } },
    ];
    const pipeline = mongoToPipe(query);
    expect(pipeline).toEqual([
      { name: 'domain', domain: 'test_cube' },
      {
        name: 'custom',
        query: {
          $group: { _id: '$Manager', Value: { $sum: '$Value' } },
        },
      },
    ]);
  });
});

describe('Pipeline to mongo translator', () => {
  it('can generate domain steps', () => {
    const pipeline: Array<PipelineStep> = [{ name: 'domain', domain: 'test_cube' }];
    const querySteps = pipeToMongo(pipeline);
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
    const querySteps = pipeToMongo(pipeline);
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
    const querySteps = pipeToMongo(pipeline);
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
    const querySteps = pipeToMongo(pipeline);
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
    const querySteps = pipeToMongo(pipeline);
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
