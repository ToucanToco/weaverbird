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

  it('can simplify complex queries', () => {
    const pipeline: Array<PipelineStep> = [
      { name: 'domain', domain: 'test_cube' },
      { name: 'filter', column: 'Manager', value: 'Pierre' },
      { name: 'select', columns: ['Region'] },
      { name: 'rename', oldname: 'Region', newname: 'zone' },
      { name: 'delete', columns: ['Manager'] },
      { name: 'newcolumn', column: 'id', query: { $concat: ['$country', ' - ', '$Region'] } },
      {
        name: 'replace',
        search_column: "search_column",
        oldvalue: 'foo',
        newvalue: 'bar',
      },
      {
        name: 'replace',
        search_column: "search_column",
        oldvalue: 'old',
        newvalue: 'new',
      },
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
          search_column: {
            $cond: [
              {
                $eq: ['$search_column', 'foo']
              },
              'bar',
              '$search_column'
            ]
          }
        },
      },
      {
        $project: {
          // We need to generate a distinct $project as the search_column key is
          // already present in the previous mongo step
          search_column: {
            $cond: [
              {
                $eq: ['$search_column', 'old']
              },
              'new',
              '$search_column'
            ]
          }
        },
      },
      {
        $group: { _id: '$country', population: { $sum: '$population' } },
      },
    ]);
  });

  it('can generate a basic replace step', () => {
    const pipeline: Array<PipelineStep> = [{
      name: 'replace',
      search_column: "column_1",
      oldvalue: 'foo',
      newvalue: 'bar'
    }];
    const querySteps = pipeToMongo(pipeline);
    expect(querySteps).toEqual([{
      $project: {
        // <all other columns>: 1
        column_1: {
          $cond: [
            {
              $eq: ["$column_1", "foo"]
            },
            "bar",
            "$column_1"
          ]
        }
      }
    }]);
  });

  it('can generate a basic replace step in a new column', () => {
    const pipeline: Array<PipelineStep> = [{
      name: 'replace',
      search_column: "column_1",
      new_column: "column_2",
      oldvalue: 'foo',
      newvalue: 'bar'
    }];
    const querySteps = pipeToMongo(pipeline);
    expect(querySteps).toEqual([{
      $project: {
        // <all other columns>: 1
        column_2: {
          $cond: [
            {
              $eq: ["$column_1", "foo"]
            },
            "bar",
            "$column_1"
          ]
        }
      }
    }]);
  });
});
