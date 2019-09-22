import { Pipeline } from '@/lib/steps';
import { getTranslator } from '@/lib/translators';
import { MongoStep, _simplifyAndCondition, _simplifyMongoPipeline } from '@/lib/translators/mongo';

describe('Mongo translator support tests', () => {
  const mongo36translator = getTranslator('mongo36');

  it('should support any kind of operation', () => {
    expect(mongo36translator.unsupportedSteps).toEqual([]);
  });
});

describe('Pipeline to mongo translator', () => {
  const mongo36translator = getTranslator('mongo36');

  it('can generate domain steps', () => {
    const pipeline: Pipeline = [{ name: 'domain', domain: 'test_cube' }];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([{ $match: { domain: 'test_cube' } }, { $project: { _id: 0 } }]);
  });

  it('can generate select steps', () => {
    const pipeline: Pipeline = [
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
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate delete steps', () => {
    const pipeline: Pipeline = [
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
          _id: 0,
        },
      },
    ]);
  });

  it('can generate rename steps', () => {
    const pipeline: Pipeline = [
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
          _id: 0,
        },
      },
    ]);
  });

  it('can simplify "and" block', () => {
    const andBlock = {
      $and: [
        { Manager: 'Pierre' },
        { Region: 'Europe' },
        { Revenue: { $lte: 1000 } },
        { Revenue: { $gt: 100 } },
        {
          $or: [{ Company: { $ne: 'Toucan' } }, { Age: { lt: 10 } }],
        },
      ],
    };
    const simplifiedAndBlock = _simplifyAndCondition(andBlock);
    expect(simplifiedAndBlock).toEqual({
      Manager: 'Pierre',
      Region: 'Europe',
      $and: [{ Revenue: { $lte: 1000 } }, { Revenue: { $gt: 100 } }],
      $or: [{ Company: { $ne: 'Toucan' } }, { Age: { lt: 10 } }],
    });
  });

  it('can generate filter steps', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'test_cube' },
      { name: 'filter', condition: { column: 'Manager', value: 'Pierre', operator: 'eq' } },
      { name: 'filter', condition: { column: 'Region', value: 'Europe', operator: 'eq' } },
      { name: 'filter', condition: { column: 'Company', value: 'Toucan', operator: 'ne' } },
      { name: 'filter', condition: { column: 'Age', value: 10, operator: 'lt' } },
      { name: 'filter', condition: { column: 'Height', value: 175, operator: 'le' } },
      { name: 'filter', condition: { column: 'Weight', value: 60, operator: 'gt' } },
      { name: 'filter', condition: { column: 'Value', value: 100, operator: 'ge' } },
      { name: 'filter', condition: { column: 'Category', value: ['Foo', 'Bar'], operator: 'in' } },
      { name: 'filter', condition: { column: 'Code', value: [0, 42], operator: 'nin' } },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $match: {
          domain: 'test_cube',
          Manager: { $eq: 'Pierre' },
          Region: { $eq: 'Europe' },
          Company: { $ne: 'Toucan' },
          Age: { $lt: 10 },
          Height: { $lte: 175 },
          Weight: { $gt: 60 },
          Value: { $gte: 100 },
          Category: { $in: ['Foo', 'Bar'] },
          Code: { $nin: [0, 42] },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a complex filter step with "and" as root', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'test_cube' },
      {
        name: 'filter',
        condition: {
          and: [
            {
              column: 'column_1',
              value: ['foo', 'bar'],
              operator: 'in',
            },
            {
              column: 'column_2',
              value: ['toucan', 'toco'],
              operator: 'nin',
            },
            {
              or: [
                {
                  column: 'column_3',
                  value: 'toto',
                  operator: 'eq',
                },
                {
                  and: [
                    {
                      column: 'column_4',
                      value: 42,
                      operator: 'le',
                    },
                    {
                      column: 'column_4',
                      value: 0,
                      operator: 'gt',
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $match: {
          domain: 'test_cube',
          column_1: { $in: ['foo', 'bar'] },
          column_2: { $nin: ['toucan', 'toco'] },
          $or: [
            {
              column_3: { $eq: 'toto' },
            },
            {
              $and: [
                {
                  column_4: { $lte: 42 },
                },
                {
                  column_4: { $gt: 0 },
                },
              ],
            },
          ],
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a complex filter step with "or" as root', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'test_cube' },
      {
        name: 'filter',
        condition: {
          or: [
            {
              column: 'column_1',
              value: ['foo', 'bar'],
              operator: 'in',
            },
            {
              column: 'column_2',
              value: ['toucan', 'toco'],
              operator: 'nin',
            },
            {
              and: [
                {
                  column: 'column_3',
                  value: 'toto',
                  operator: 'eq',
                },
                {
                  column: 'column_4',
                  value: 42,
                  operator: 'le',
                },
              ],
            },
          ],
        },
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $match: {
          domain: 'test_cube',
          $or: [
            { column_1: { $in: ['foo', 'bar'] } },
            { column_2: { $nin: ['toucan', 'toco'] } },
            {
              $and: [{ column_3: { $eq: 'toto' } }, { column_4: { $lte: 42 } }],
            },
          ],
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a filter step with an "and" condition including common keys', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'test_cube' },
      {
        name: 'filter',
        condition: {
          and: [
            {
              column: 'column_1',
              value: ['foo', 'bar'],
              operator: 'in',
            },
            {
              column: 'column_2',
              value: ['toucan', 'toco'],
              operator: 'nin',
            },
            {
              column: 'column_4',
              value: 42,
              operator: 'le',
            },
            {
              column: 'column_4',
              value: 0,
              operator: 'gt',
            },
          ],
        },
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $match: {
          domain: 'test_cube',
          column_1: { $in: ['foo', 'bar'] },
          column_2: { $nin: ['toucan', 'toco'] },
          $and: [
            {
              column_4: { $lte: 42 },
            },
            {
              column_4: { $gt: 0 },
            },
          ],
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can translate aggregation steps', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'test_cube' },
      {
        name: 'aggregate',
        on: ['col_agg1', 'col_agg2'],
        aggregations: [
          {
            newcolumn: 'sum',
            aggfunction: 'sum',
            column: 'col1',
          },
          {
            newcolumn: 'average',
            aggfunction: 'avg',
            column: 'col2',
          },
          {
            newcolumn: 'minimum',
            aggfunction: 'min',
            column: 'col1',
          },
          {
            newcolumn: 'maximum',
            aggfunction: 'max',
            column: 'col3',
          },
          {
            newcolumn: 'number_rows',
            aggfunction: 'count',
            column: 'col3',
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
          maximum: { $max: '$col3' },
          number_rows: { $sum: 1 },
        },
      },
      {
        $project: {
          col_agg1: '$_id.col_agg1',
          col_agg2: '$_id.col_agg2',
          sum: 1,
          average: 1,
          minimum: 1,
          maximum: 1,
          number_rows: 1,
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can simplify complex queries', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'test_cube' },
      { name: 'filter', condition: { column: 'Manager', value: 'Pierre', operator: 'eq' } },
      { name: 'delete', columns: ['Manager'] },
      { name: 'delete', columns: ['Random'] },
      { name: 'select', columns: ['Country', 'Region', 'Population', 'Region_bis'] },
      { name: 'delete', columns: ['Region_bis'] },
      { name: 'formula', new_column: 'value', formula: 'value / 1000' },
      { name: 'rename', oldname: 'value', newname: 'Revenue' },
      {
        name: 'replace',
        search_column: 'Country',
        to_replace: [['France - ', 'France']],
      },
      {
        name: 'replace',
        search_column: 'Country',
        to_replace: [['Spain - ', 'Spain']],
      },
      { name: 'formula', new_column: 'Population', formula: 'Population / 1000' },
      {
        name: 'custom',
        query: { $group: { _id: '$Country', Population: { $sum: '$Population' } } },
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $match: { domain: 'test_cube', Manager: { $eq: 'Pierre' } } },
      {
        $project: {
          Manager: 0,
          Random: 0,
        },
      },
      {
        $project: {
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
          value: { $divide: ['$value', 1000] },
        },
      },
      {
        // A step with a key referencing as value any key present in the last
        // step should not be merged with the latter
        $addFields: {
          Revenue: '$value',
        },
      },
      {
        $project: {
          value: 0,
        },
      },
      {
        $addFields: {
          Country: {
            $switch: {
              branches: [{ case: { $eq: ['$Country', 'France - '] }, then: 'France' }],
              default: '$Country',
            },
          },
        },
      },
      {
        // Two steps with common keys should not be merged
        $addFields: {
          Country: {
            $switch: {
              branches: [{ case: { $eq: ['$Country', 'Spain - '] }, then: 'Spain' }],
              default: '$Country',
            },
          },
          Population: { $divide: ['$Population', 1000] },
        },
      },
      {
        $group: { _id: '$Country', Population: { $sum: '$Population' } },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can simplify empty mongo pipelines', () => {
    const mongoPipeline: MongoStep[] = [];
    expect(_simplifyMongoPipeline(mongoPipeline)).toEqual([]);
  });

  it('can simplify a mongo pipeline', () => {
    const mongoPipeline: MongoStep[] = [
      { $match: { domain: 'test_cube' } },
      { $match: { Manager: 'Pierre' } },
      { $match: { Manager: { $ne: 'NA' } } },
      { $project: { Manager: 0 } },
      { $project: { Random: 0 } },
      {
        $project: {
          Country: 1,
          Region: 1,
          Population: 1,
          Region_bis: 1,
        },
      },
      { $project: { Region_bis: 0 } },
      { $project: { test: '$test' } },
      { $project: { test: 2 } },
      { $project: { exclusion: 0 } },
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
            $switch: {
              branches: [{ case: { $eq: ['$Zone', 'France - '] }, then: 'France' }],
              default: '$Zone',
            },
          },
        },
      },
      {
        $addFields: {
          Zone: {
            $switch: {
              branches: [{ case: { $eq: ['$Zone', 'Spain - '] }, then: 'Spain' }],
              default: '$Zone',
            },
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
      {
        $project: { Zone: '$_id', Population: 1 },
      },
      {
        $project: { Area: '$Zone', Population: 1 },
      },
    ];
    const querySteps = _simplifyMongoPipeline(mongoPipeline);
    expect(querySteps).toEqual([
      { $match: { domain: 'test_cube', Manager: 'Pierre' } },
      { $match: { Manager: { $ne: 'NA' } } }, // Two steps with common keys should not be merged
      {
        $project: {
          Manager: 0,
          Random: 0,
        },
      },
      {
        $project: {
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
      { $project: { test: '$test' } },
      { $project: { test: 2 } },
      { $project: { exclusion: 0 } },
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
            $switch: {
              branches: [{ case: { $eq: ['$Zone', 'France - '] }, then: 'France' }],
              default: '$Zone',
            },
          },
        },
      },
      {
        // Two steps with common keys should not be merged
        $addFields: {
          Zone: {
            $switch: {
              branches: [{ case: { $eq: ['$Zone', 'Spain - '] }, then: 'Spain' }],
              default: '$Zone',
            },
          },
          Population: { $divide: ['$Population', 1000] },
        },
      },
      {
        $group: { _id: '$Zone', Population: { $sum: '$Population' } },
      },
      {
        $project: { Zone: '$_id', Population: 1 },
      },
      // A step with a key referencing as value any key present in the last
      // step should not be merged with the latter
      {
        $project: { Area: '$Zone', Population: 1 },
      },
    ]);
  });

  it('can generate a replace step', () => {
    const pipeline: Pipeline = [
      {
        name: 'replace',
        search_column: 'column_1',
        to_replace: [['foo', 'bar'], ['old', 'new']],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          column_1: {
            $switch: {
              branches: [
                { case: { $eq: ['$column_1', 'foo'] }, then: 'bar' },
                { case: { $eq: ['$column_1', 'old'] }, then: 'new' },
              ],
              default: '$column_1',
            },
          },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a basic sort step on one column', () => {
    const pipeline: Pipeline = [
      {
        name: 'sort',
        columns: [{ column: 'foo', order: 'desc' }],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $sort: {
          foo: -1,
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a sort step on multiple columns', () => {
    const pipeline: Pipeline = [
      {
        name: 'sort',
        columns: [{ column: 'foo', order: 'asc' }, { column: 'bar', order: 'desc' }],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $sort: {
          foo: 1,
          bar: -1,
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a fillna step', () => {
    const pipeline: Pipeline = [
      {
        name: 'fillna',
        column: 'foo',
        value: 'bar',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { foo: { $ifNull: ['$foo', 'bar'] } } },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a top step with groups', () => {
    const pipeline: Pipeline = [
      {
        name: 'top',
        groups: ['foo'],
        rank_on: 'bar',
        sort: 'desc',
        limit: 10,
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $sort: { bar: -1 } },
      {
        $group: {
          _id: {
            foo: '$foo',
          },
          _vqbAppArray: { $push: '$$ROOT' },
        },
      },
      { $project: { _vqbAppTopElems: { $slice: ['$_vqbAppArray', 10] } } },
      { $unwind: '$_vqbAppTopElems' },
      { $replaceRoot: { newRoot: '$_vqbAppTopElems' } },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a top step without groups', () => {
    const pipeline: Pipeline = [
      {
        name: 'top',
        rank_on: 'bar',
        sort: 'asc',
        limit: 3,
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $sort: { bar: 1 } },
      {
        $group: {
          _id: null,
          _vqbAppArray: { $push: '$$ROOT' },
        },
      },
      { $project: { _vqbAppTopElems: { $slice: ['$_vqbAppArray', 3] } } },
      { $unwind: '$_vqbAppTopElems' },
      { $replaceRoot: { newRoot: '$_vqbAppTopElems' } },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a percentage step with groups', () => {
    const pipeline: Pipeline = [
      {
        name: 'percentage',
        column: 'bar',
        group: ['foo'],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $group: {
          _id: { foo: '$foo' },
          _vqbAppArray: { $push: '$$ROOT' },
          _vqbTotalDenum: { $sum: '$bar' },
        },
      },
      { $unwind: '$_vqbAppArray' },
      {
        $project: {
          bar: {
            // we need to explicitely manage the case where '$total_denum' is null otherwise the query may just fail
            $cond: [
              { $eq: ['$_vqbTotalDenum', 0] },
              null,
              { $divide: ['$_vqbAppArray.bar', '$_vqbTotalDenum'] },
            ],
          },
          _vqbAppArray: 1, // we need to keep track of this key for the next operation
        },
      },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbAppArray', '$$ROOT'] } } },
      { $project: { _vqbAppArray: 0, _id: 0 } },
    ]);
  });

  it('can generate a percentage step without groups', () => {
    const pipeline: Pipeline = [
      {
        name: 'percentage',
        column: 'bar',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $group: {
          _id: null,
          _vqbAppArray: { $push: '$$ROOT' },
          _vqbTotalDenum: { $sum: '$bar' },
        },
      },
      { $unwind: '$_vqbAppArray' },
      {
        $project: {
          bar: {
            // we need to explicitely manage the case where '$total_denum' is null otherwise the query may just fail
            $cond: [
              { $eq: ['$_vqbTotalDenum', 0] },
              null,
              { $divide: ['$_vqbAppArray.bar', '$_vqbTotalDenum'] },
            ],
          },
          _vqbAppArray: 1, // we need to keep track of this key for the next operation
        },
      },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbAppArray', '$$ROOT'] } } },
      { $project: { _vqbAppArray: 0, _id: 0 } },
    ]);
  });

  it('can generate an argmax step without groups', () => {
    const pipeline: Pipeline = [
      {
        name: 'argmax',
        column: 'bar',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $group: {
          _id: null,
          _vqbAppArray: { $push: '$$ROOT' },
          _vqbAppValueToCompare: { $max: '$bar' },
        },
      },
      {
        $unwind: '$_vqbAppArray',
      },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbAppArray', '$$ROOT'] } } },
      { $project: { _vqbAppArray: 0 } },
      {
        /**
         * shortcut operator to avoid to firstly create a boolean column via $project
         * and then filter on 'true' rows via $match.
         * "$$KEEP" (resp. $$PRUNE") keeps (resp. exlcludes) rows matching (resp.
         * not matching) the condition.
         */
        $redact: {
          $cond: [
            {
              $eq: ['$bar', '$_vqbAppValueToCompare'],
            },
            '$$KEEP',
            '$$PRUNE',
          ],
        },
      },
      { $project: { _vqbAppValueToCompare: 0, _id: 0 } },
    ]);
  });

  it('can generate an argmax step with groups', () => {
    const pipeline: Pipeline = [
      {
        name: 'argmax',
        column: 'bar',
        groups: ['foo'],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $group: {
          _id: { foo: '$foo' },
          _vqbAppArray: { $push: '$$ROOT' },
          _vqbAppValueToCompare: { $max: '$bar' },
        },
      },
      {
        $unwind: '$_vqbAppArray',
      },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbAppArray', '$$ROOT'] } } },
      { $project: { _vqbAppArray: 0 } },
      {
        /**
         * shortcut operator to avoid to firstly create a boolean column via $project
         * and then filter on 'true' rows via $match.
         * "$$KEEP" (resp. $$PRUNE") keeps (resp. exlcludes) rows matching (resp.
         * not matching) the condition.
         */
        $redact: {
          $cond: [
            {
              $eq: ['$bar', '$_vqbAppValueToCompare'],
            },
            '$$KEEP',
            '$$PRUNE',
          ],
        },
      },
      { $project: { _vqbAppValueToCompare: 0, _id: 0 } },
    ]);
  });

  it('can generate an argmin step with groups', () => {
    const pipeline: Pipeline = [
      {
        name: 'argmin',
        column: 'value',
        groups: ['foo', 'bar'],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $group: {
          _id: { foo: '$foo', bar: '$bar' },
          _vqbAppArray: { $push: '$$ROOT' },
          _vqbAppValueToCompare: { $min: '$value' },
        },
      },
      {
        $unwind: '$_vqbAppArray',
      },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbAppArray', '$$ROOT'] } } },
      { $project: { _vqbAppArray: 0 } },
      {
        /**
         * shortcut operator to avoid to firstly create a boolean column via $project
         * and then filter on 'true' rows via $match.
         * "$$KEEP" (resp. $$PRUNE") keeps (resp. exlcludes) rows matching (resp.
         * not matching) the condition.
         */
        $redact: {
          $cond: [
            {
              $eq: ['$value', '$_vqbAppValueToCompare'],
            },
            '$$KEEP',
            '$$PRUNE',
          ],
        },
      },
      { $project: { _vqbAppValueToCompare: 0, _id: 0 } },
    ]);
  });

  it('can generate a formula step with a single column or constant', () => {
    const pipeline: Pipeline = [
      {
        name: 'formula',
        new_column: 'foo',
        formula: 'bar',
      },
      {
        name: 'formula',
        new_column: 'constant',
        formula: '42',
      },
      {
        name: 'formula',
        new_column: 'with_parentheses',
        formula: '(test)',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          foo: '$bar',
          constant: 42,
          with_parentheses: '$test',
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a formula step with complex operations imbrication', () => {
    const pipeline: Pipeline = [
      {
        name: 'formula',
        new_column: 'foo',
        formula: '(column_1 + column_2) / column_3 - column_4 * 100',
      },
      {
        name: 'formula',
        new_column: 'bar',
        formula: '1 / ((column_1 + column_2 + column_3)) * 10',
      },
      {
        name: 'formula',
        new_column: 'test_precedence',
        formula: 'column_1 + column_2 + column_3 * 10',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          foo: {
            $subtract: [
              {
                $divide: [
                  {
                    $add: ['$column_1', '$column_2'],
                  },
                  '$column_3',
                ],
              },
              {
                $multiply: ['$column_4', 100],
              },
            ],
          },
          bar: {
            $multiply: [
              {
                $divide: [
                  1,
                  {
                    $add: [
                      {
                        $add: ['$column_1', '$column_2'],
                      },
                      '$column_3',
                    ],
                  },
                ],
              },
              10,
            ],
          },
          test_precedence: {
            $add: [
              {
                $add: ['$column_1', '$column_2'],
              },
              {
                $multiply: ['$column_3', 10],
              },
            ],
          },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a formula step with a a signed column name', () => {
    const pipeline: Pipeline = [
      {
        name: 'formula',
        new_column: 'test',
        formula: '-column_1 + 10',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          test: {
            $add: [
              {
                $multiply: [-1, '$column_1'],
              },
              10,
            ],
          },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a pivot step', () => {
    const pipeline: Pipeline = [
      {
        name: 'pivot',
        index: ['column_1', 'column_2'],
        column_to_pivot: 'column_3',
        value_column: 'column_4',
        agg_function: 'sum',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $group: {
          _id: {
            column_1: '$column_1',
            column_2: '$column_2',
            column_3: '$column_3',
          },
          column_4: { $sum: '$column_4' },
        },
      },
      {
        $group: {
          _id: {
            column_1: '$_id.column_1',
            column_2: '$_id.column_2',
          },
          _vqbAppArray: {
            $addToSet: {
              column_3: '$_id.column_3',
              column_4: '$column_4',
            },
          },
        },
      },
      {
        $project: {
          _vqbAppTmpObj: {
            $arrayToObject: {
              $zip: { inputs: ['$_vqbAppArray.column_3', '$_vqbAppArray.column_4'] },
            },
          },
        },
      },
      {
        $addFields: {
          '_vqbAppTmpObj.column_1': '$_id.column_1',
          '_vqbAppTmpObj.column_2': '$_id.column_2',
        },
      },
      { $replaceRoot: { newRoot: '$_vqbAppTmpObj' } },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate an unpivot step with fillna parameter to true', () => {
    const pipeline: Pipeline = [
      {
        name: 'unpivot',
        keep: ['MARCHE', 'CANAL'],
        unpivot: ['NB_CLIENTS_TOTAL', 'NB_ROWS'],
        unpivot_column_name: 'KPI',
        value_column_name: 'VALUE',
        dropna: true,
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $project: {
          MARCHE: '$MARCHE',
          CANAL: '$CANAL',
          _vqbToUnpivot: {
            $objectToArray: {
              NB_CLIENTS_TOTAL: '$NB_CLIENTS_TOTAL',
              NB_ROWS: '$NB_ROWS',
            },
          },
        },
      },
      {
        $unwind: '$_vqbToUnpivot',
      },
      {
        $project: {
          MARCHE: '$MARCHE',
          CANAL: '$CANAL',
          KPI: '$_vqbToUnpivot.k',
          VALUE: '$_vqbToUnpivot.v',
        },
      },
      {
        $match: {
          VALUE: { $ne: null },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate an unpivot step with fillna parameter to false', () => {
    const pipeline: Pipeline = [
      {
        name: 'unpivot',
        keep: ['MARCHE', 'CANAL'],
        unpivot: ['NB_CLIENTS_TOTAL', 'NB_ROWS'],
        unpivot_column_name: 'KPI',
        value_column_name: 'VALUE',
        dropna: false,
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $project: {
          MARCHE: '$MARCHE',
          CANAL: '$CANAL',
          _vqbToUnpivot: {
            $objectToArray: {
              NB_CLIENTS_TOTAL: '$NB_CLIENTS_TOTAL',
              NB_ROWS: '$NB_ROWS',
            },
          },
        },
      },
      {
        $unwind: '$_vqbToUnpivot',
      },
      {
        $project: {
          MARCHE: '$MARCHE',
          CANAL: '$CANAL',
          KPI: '$_vqbToUnpivot.k',
          VALUE: '$_vqbToUnpivot.v',
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a duplicate step', () => {
    const pipeline: Pipeline = [
      {
        name: 'duplicate',
        column: 'foo',
        new_column_name: 'bar',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([{ $addFields: { bar: '$foo' } }, { $project: { _id: 0 } }]);
  });

  it('can generate a lowercase step', () => {
    const pipeline: Pipeline = [
      {
        name: 'lowercase',
        column: 'foo',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { foo: { $toLower: '$foo' } } },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate an uppercase step', () => {
    const pipeline: Pipeline = [
      {
        name: 'uppercase',
        column: 'foo',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { foo: { $toUpper: '$foo' } } },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a concatenate step with only one column', () => {
    const pipeline: Pipeline = [
      {
        name: 'concatenate',
        columns: ['foo'],
        separator: ' - ',
        new_column_name: 'concat',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { concat: { $concat: ['$foo'] } } },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a concatenate step with at least two columns', () => {
    const pipeline: Pipeline = [
      {
        name: 'concatenate',
        columns: ['foo', 'bar', 'again'],
        separator: ' - ',
        new_column_name: 'concat',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { concat: { $concat: ['$foo', ' - ', '$bar', ' - ', '$again'] } } },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a substring step with positive start and end index', () => {
    const pipeline: Pipeline = [
      {
        name: 'substring',
        column: 'foo',
        start_index: 1,
        end_index: 6,
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          foo: {
            $substrCP: [
              '$foo',
              0,
              {
                $add: [
                  {
                    $subtract: [5, 0],
                  },
                  1,
                ],
              },
            ],
          },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a substring step with negative start and end index', () => {
    const pipeline: Pipeline = [
      {
        name: 'substring',
        column: 'foo',
        start_index: -5,
        end_index: -1,
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          foo: {
            $substrCP: [
              '$foo',
              {
                $add: [
                  {
                    $strLenCP: '$foo',
                  },
                  -5,
                ],
              },
              {
                $add: [
                  {
                    $subtract: [
                      {
                        $add: [
                          {
                            $strLenCP: '$foo',
                          },
                          -1,
                        ],
                      },
                      {
                        $add: [
                          {
                            $strLenCP: '$foo',
                          },
                          -5,
                        ],
                      },
                    ],
                  },
                  1,
                ],
              },
            ],
          },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });
});
