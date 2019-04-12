import { PipelineStep } from '@/lib/steps';
import { getTranslator } from '@/lib/translators';
import { Mongo36Translator, MongoStep, _simplifyMongoPipeline } from '@/lib/translators/mongo';

describe('Mongo translator support tests', () => {
  const mongo36translator = getTranslator('mongo36');

  it('should support any kind of operation', () => {
    expect(mongo36translator.unsupportedSteps).toEqual([]);
  });
});

describe('Pipeline to mongo translator', () => {
  const mongo36translator = getTranslator('mongo36');

  it('can generate domain steps', () => {
    const pipeline: Array<PipelineStep> = [{ name: 'domain', domain: 'test_cube' }];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([{ $match: { domain: 'test_cube' } }]);
  });

  it('can generate select steps', () => {
    const pipeline: Array<PipelineStep> = [
      { name: 'domain', domain: 'test_cube' },
      { name: 'select', columns: ['Manager', 'Region'] },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $match: { domain: 'test_cube' } },
      {
        $project: {
          Manager: 1,
          Region: 1,
        },
      },
    ]);
  });

  it('can generate delete steps', () => {
    const pipeline: Array<PipelineStep> = [
      { name: 'domain', domain: 'test_cube' },
      { name: 'delete', columns: ['Manager', 'Region'] },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $match: { domain: 'test_cube' } },
      {
        $project: {
          Manager: 0,
          Region: 0,
        },
      },
    ]);
  });

  it('can generate rename steps', () => {
    const pipeline: Array<PipelineStep> = [
      { name: 'domain', domain: 'test_cube' },
      { name: 'rename', oldname: 'Region', newname: 'zone' },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $match: { domain: 'test_cube' } },
      {
        $addFields: {
          zone: '$Region',
        },
      },
      {
        $project: {
          Region: 0,
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
    const querySteps = mongo36translator.translate(pipeline);
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
    const querySteps = mongo36translator.translate(pipeline);
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
      { name: 'delete', columns: ['Manager'] },
      { name: 'select', columns: ['Country', 'Region', 'Population', 'Region_bis'] },
      { name: 'delete', columns: ['Region_bis'] },
      { name: 'newcolumn', column: 'id', query: { $concat: ['$Country', ' - ', '$Region'] } },
      { name: 'rename', oldname: 'id', newname: 'Zone' },
      {
        name: 'replace',
        search_column: 'Zone',
        oldvalue: 'France - ',
        newvalue: 'France',
      },
      {
        name: 'replace',
        search_column: 'Zone',
        oldvalue: 'Spain - ',
        newvalue: 'Spain',
      },
      { name: 'newcolumn', column: 'Population', query: { $divide: ['$Population', 1000] } },
      {
        name: 'custom',
        query: { $group: { _id: '$Zone', Population: { $sum: '$Population' } } },
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $match: { domain: 'test_cube', Manager: 'Pierre' } },
      {
        $project: {
          Manager: 0,
          Country: 1,
          Region: 1,
          Population: 1,
          Region_bis: 1,
        },
      },
      {
        // Two steps with common keys should not be merged
        $project: {
          Region_bis: 0,
        },
      },
      {
        $addFields: {
          id: { $concat: ['$Country', ' - ', '$Region'] },
        },
      },
      {
        // A step with a key referencing as value any key present in the last
        // step should not be merged with the latter
        $addFields: {
          Zone: '$id',
        },
      },
      {
        $project: {
          id: 0,
        },
      },
      {
        $addFields: {
          Zone: {
            $cond: [
              {
                $eq: ['$Zone', 'France - '],
              },
              'France',
              '$Zone',
            ],
          },
        },
      },
      {
        // Two steps with common keys should not be merged
        $addFields: {
          Zone: {
            $cond: [
              {
                $eq: ['$Zone', 'Spain - '],
              },
              'Spain',
              '$Zone',
            ],
          },
          Population: { $divide: ['$Population', 1000] },
        },
      },
      {
        $group: { _id: '$Zone', Population: { $sum: '$Population' } },
      },
    ]);
  });

  it('can simplify a mongo pipeline', () => {
    const mongoPipeline: Array<MongoStep> = [
      { $match: { domain: 'test_cube' } },
      { $match: { Manager: 'Pierre' } },
      { $match: { Manager: { $ne: 'NA' } } },
      { $project: { Manager: 0 } },
      {
        $project: {
          Country: 1,
          Region: 1,
          Population: 1,
          Region_bis: 1,
        },
      },
      { $project: { Region_bis: 0 } },
      {
        $addFields: {
          id: { $concat: ['$Country', ' - ', '$Region'] },
        },
      },
      {
        $addFields: {
          Zone: '$id',
        },
      },
      {
        $project: {
          id: 0,
        },
      },
      {
        $addFields: {
          Zone: {
            $cond: [
              {
                $eq: ['$Zone', 'France - '],
              },
              'France',
              '$Zone',
            ],
          },
        },
      },
      {
        $addFields: {
          Zone: {
            $cond: [
              {
                $eq: ['$Zone', 'Spain - '],
              },
              'Spain',
              '$Zone',
            ],
          },
        },
      },
      {
        $addFields: {
          Population: { $divide: ['$Population', 1000] },
        },
      },
      {
        $group: { _id: '$Zone', Population: { $sum: '$Population' } },
      },
    ];
    const querySteps = _simplifyMongoPipeline(mongoPipeline);
    expect(querySteps).toEqual([
      { $match: { domain: 'test_cube', Manager: 'Pierre' } },
      { $match: { Manager: { $ne: 'NA' } } }, // Two steps with common keys should not be merged
      {
        $project: {
          Manager: 0,
          Country: 1,
          Region: 1,
          Population: 1,
          Region_bis: 1,
        },
      },
      {
        // Two steps with common keys should not be merged
        $project: {
          Region_bis: 0,
        },
      },
      {
        $addFields: {
          id: { $concat: ['$Country', ' - ', '$Region'] },
        },
      },
      {
        // A step with a key referencing as value any key present in the last
        // step should not be merged with the latter
        $addFields: {
          Zone: '$id',
        },
      },
      {
        $project: {
          id: 0,
        },
      },
      {
        $addFields: {
          Zone: {
            $cond: [
              {
                $eq: ['$Zone', 'France - '],
              },
              'France',
              '$Zone',
            ],
          },
        },
      },
      {
        // Two steps with common keys should not be merged
        $addFields: {
          Zone: {
            $cond: [
              {
                $eq: ['$Zone', 'Spain - '],
              },
              'Spain',
              '$Zone',
            ],
          },
          Population: { $divide: ['$Population', 1000] },
        },
      },
      {
        $group: { _id: '$Zone', Population: { $sum: '$Population' } },
      },
    ]);
  });

  it('can generate a basic replace step', () => {
    const pipeline: Array<PipelineStep> = [
      {
        name: 'replace',
        search_column: 'column_1',
        oldvalue: 'foo',
        newvalue: 'bar',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          column_1: {
            $cond: [
              {
                $eq: ['$column_1', 'foo'],
              },
              'bar',
              '$column_1',
            ],
          },
        },
      },
    ]);
  });

  it('can generate a basic replace step in a new column', () => {
    const pipeline: Array<PipelineStep> = [
      {
        name: 'replace',
        search_column: 'column_1',
        new_column: 'column_2',
        oldvalue: 'foo',
        newvalue: 'bar',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          column_2: {
            $cond: [
              {
                $eq: ['$column_1', 'foo'],
              },
              'bar',
              '$column_1',
            ],
          },
        },
      },
    ]);
  });
});
