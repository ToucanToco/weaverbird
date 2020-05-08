import { Pipeline } from '@/lib/steps';
import { getTranslator } from '@/lib/translators';
import { _simplifyAndCondition, _simplifyMongoPipeline, MongoStep } from '@/lib/translators/mongo';

const smallMonthReplace = {
  $switch: {
    branches: [
      { case: { $eq: ['$_vqbTempMonth', '01'] }, then: 'Jan' },
      { case: { $eq: ['$_vqbTempMonth', '02'] }, then: 'Feb' },
      { case: { $eq: ['$_vqbTempMonth', '03'] }, then: 'Mar' },
      { case: { $eq: ['$_vqbTempMonth', '04'] }, then: 'Apr' },
      { case: { $eq: ['$_vqbTempMonth', '05'] }, then: 'May' },
      { case: { $eq: ['$_vqbTempMonth', '06'] }, then: 'Jun' },
      { case: { $eq: ['$_vqbTempMonth', '07'] }, then: 'Jul' },
      { case: { $eq: ['$_vqbTempMonth', '08'] }, then: 'Aug' },
      { case: { $eq: ['$_vqbTempMonth', '09'] }, then: 'Sep' },
      { case: { $eq: ['$_vqbTempMonth', '10'] }, then: 'Oct' },
      { case: { $eq: ['$_vqbTempMonth', '11'] }, then: 'Nov' },
      { case: { $eq: ['$_vqbTempMonth', '12'] }, then: 'Dec' },
    ],
  },
};

const fullMonthReplace = {
  $switch: {
    branches: [
      { case: { $eq: ['$_vqbTempMonth', '01'] }, then: 'January' },
      { case: { $eq: ['$_vqbTempMonth', '02'] }, then: 'February' },
      { case: { $eq: ['$_vqbTempMonth', '03'] }, then: 'March' },
      { case: { $eq: ['$_vqbTempMonth', '04'] }, then: 'April' },
      { case: { $eq: ['$_vqbTempMonth', '05'] }, then: 'May' },
      { case: { $eq: ['$_vqbTempMonth', '06'] }, then: 'June' },
      { case: { $eq: ['$_vqbTempMonth', '07'] }, then: 'July' },
      { case: { $eq: ['$_vqbTempMonth', '08'] }, then: 'August' },
      { case: { $eq: ['$_vqbTempMonth', '09'] }, then: 'September' },
      { case: { $eq: ['$_vqbTempMonth', '10'] }, then: 'October' },
      { case: { $eq: ['$_vqbTempMonth', '11'] }, then: 'December' },
      { case: { $eq: ['$_vqbTempMonth', '12'] }, then: 'December' },
    ],
  },
};

describe('Mongo translator support tests', () => {
  const mongo36translator = getTranslator('mongo36');

  it('should not support "convert" operation', () => {
    expect(mongo36translator.unsupportedSteps).toEqual(['convert']);
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

  describe('statistics steps', () => {
    it('can generate statistics steps', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'test_cube' },
        {
          name: 'statistics',
          column: 'wind',
          groupbyColumns: [],
          statistics: ['standard deviation', 'max'],
          quantiles: [
            {
              label: 'firstCentile',
              order: 100,
              nth: 1,
            },
          ],
        },
      ];
      const querySteps = mongo36translator.translate(pipeline);
      expect(querySteps).toEqual([
        { $match: { domain: 'test_cube' } },
        { $project: { column: '$wind', column_square: { $pow: [`$wind`, 2] } } },
        { $match: { column: { $ne: null } } },
        { $sort: { column: 1 } },
        {
          $group: {
            _id: {},
            count: { $sum: 1 },
            max: { $max: '$column' },
            average: { $avg: '$column' },
            average_sum_square: { $avg: '$column_square' },
            data: { $push: '$column' },
          },
        },
        {
          $project: {
            max: 1,
            firstCentile: {
              $avg: [
                {
                  $arrayElemAt: [
                    '$data',
                    {
                      $trunc: {
                        $subtract: [{ $multiply: [{ $divide: ['$count', 100] }, 1] }, 1],
                      },
                    },
                  ],
                },
                {
                  $arrayElemAt: [
                    '$data',
                    {
                      $trunc: { $multiply: [{ $divide: ['$count', 100] }, 1] },
                    },
                  ],
                },
              ],
            },
            'standard deviation': {
              $pow: [{ $subtract: ['$average_sum_square', { $pow: ['$average', 2] }] }, 0.5],
            },
          },
        },
        { $project: { _id: 0 } },
      ]);
    });

    it('can generate statistics steps with variance', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'test_cube' },
        {
          name: 'statistics',
          column: 'wind',
          groupbyColumns: [],
          statistics: ['variance'],
          quantiles: [
            {
              order: 30,
              nth: 4,
            },
          ],
        },
      ];
      const querySteps = mongo36translator.translate(pipeline);
      expect(querySteps).toEqual([
        { $match: { domain: 'test_cube' } },
        { $project: { column: '$wind', column_square: { $pow: [`$wind`, 2] } } },
        { $match: { column: { $ne: null } } },
        { $sort: { column: 1 } },
        {
          $group: {
            _id: {},
            count: { $sum: 1 },
            average: { $avg: '$column' },
            average_sum_square: { $avg: '$column_square' },
            data: { $push: '$column' },
          },
        },
        {
          $project: {
            '4-th 30-quantile': {
              $avg: [
                {
                  $arrayElemAt: [
                    '$data',
                    {
                      $trunc: {
                        $subtract: [{ $multiply: [{ $divide: ['$count', 30] }, 4] }, 1],
                      },
                    },
                  ],
                },
                {
                  $arrayElemAt: [
                    '$data',
                    {
                      $trunc: { $multiply: [{ $divide: ['$count', 30] }, 4] },
                    },
                  ],
                },
              ],
            },
            variance: { $subtract: ['$average_sum_square', { $pow: ['$average', 2] }] },
          },
        },
        { $project: { _id: 0 } },
      ]);
    });

    it('can generate statistics steps with variance and groupby', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'test_cube' },
        {
          name: 'statistics',
          column: 'wind',
          groupbyColumns: ['sea'],
          statistics: ['variance'],
          quantiles: [
            {
              order: 30,
              nth: 4,
            },
          ],
        },
      ];
      const querySteps = mongo36translator.translate(pipeline);
      expect(querySteps).toEqual([
        { $match: { domain: 'test_cube' } },
        { $project: { column: '$wind', column_square: { $pow: [`$wind`, 2] }, sea: 1 } },
        { $match: { column: { $ne: null } } },
        { $sort: { column: 1 } },
        {
          $group: {
            _id: { sea: '$sea' },
            count: { $sum: 1 },
            average: { $avg: '$column' },
            average_sum_square: { $avg: '$column_square' },
            data: { $push: '$column' },
          },
        },
        {
          $project: {
            sea: '$_id.sea',
            '4-th 30-quantile': {
              $avg: [
                {
                  $arrayElemAt: [
                    '$data',
                    {
                      $trunc: {
                        $subtract: [{ $multiply: [{ $divide: ['$count', 30] }, 4] }, 1],
                      },
                    },
                  ],
                },
                {
                  $arrayElemAt: [
                    '$data',
                    {
                      $trunc: { $multiply: [{ $divide: ['$count', 30] }, 4] },
                    },
                  ],
                },
              ],
            },
            variance: { $subtract: ['$average_sum_square', { $pow: ['$average', 2] }] },
          },
        },
        { $project: { _id: 0 } },
      ]);
    });

    it('can generate statistics steps with group by columns', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'test_cube' },
        {
          name: 'statistics',
          column: 'wind',
          groupbyColumns: ['sea'],
          statistics: ['standard deviation', 'max'],
          quantiles: [
            {
              label: 'firstCentile',
              order: 100,
              nth: 1,
            },
          ],
        },
      ];
      const querySteps = mongo36translator.translate(pipeline);
      expect(querySteps).toEqual([
        { $match: { domain: 'test_cube' } },
        { $project: { column: '$wind', column_square: { $pow: [`$wind`, 2] }, sea: 1 } },
        { $match: { column: { $ne: null } } },
        { $sort: { column: 1 } },
        {
          $group: {
            _id: { sea: '$sea' },
            count: { $sum: 1 },
            max: { $max: '$column' },
            average: { $avg: '$column' },
            average_sum_square: { $avg: '$column_square' },
            data: { $push: '$column' },
          },
        },
        {
          $project: {
            max: 1,
            sea: '$_id.sea',
            firstCentile: {
              $avg: [
                {
                  $arrayElemAt: [
                    '$data',
                    {
                      $trunc: {
                        $subtract: [{ $multiply: [{ $divide: ['$count', 100] }, 1] }, 1],
                      },
                    },
                  ],
                },
                {
                  $arrayElemAt: [
                    '$data',
                    {
                      $trunc: { $multiply: [{ $divide: ['$count', 100] }, 1] },
                    },
                  ],
                },
              ],
            },
            'standard deviation': {
              $pow: [{ $subtract: ['$average_sum_square', { $pow: ['$average', 2] }] }, 0.5],
            },
          },
        },
        { $project: { _id: 0 } },
      ]);
    });

    it('can generate statistics steps without quantile and with group by columns', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'test_cube' },
        {
          name: 'statistics',
          column: 'wind',
          groupbyColumns: ['sea'],
          statistics: ['min'],
          quantiles: [],
        },
      ];
      const querySteps = mongo36translator.translate(pipeline);
      expect(querySteps).toEqual([
        { $match: { domain: 'test_cube' } },
        { $project: { column: '$wind', sea: 1 } },
        { $match: { column: { $ne: null } } },
        {
          $group: {
            _id: { sea: '$sea' },
            min: { $min: '$column' },
            data: { $push: '$column' },
          },
        },
        {
          $project: {
            min: 1,
            sea: '$_id.sea',
          },
        },
        { $project: { _id: 0 } },
      ]);
    });

    it('can generate statistics steps without quantile and with group by columns', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'test_cube' },
        {
          name: 'statistics',
          column: 'wind',
          groupbyColumns: ['sea'],
          statistics: ['count', 'standard deviation'],
          quantiles: [],
        },
      ];
      const querySteps = mongo36translator.translate(pipeline);
      expect(querySteps).toEqual([
        { $match: { domain: 'test_cube' } },
        { $project: { column: '$wind', sea: 1, column_square: { $pow: [`$wind`, 2] } } },
        { $match: { column: { $ne: null } } },
        {
          $group: {
            _id: { sea: '$sea' },
            count: { $sum: 1 },
            average: { $avg: '$column' },
            average_sum_square: { $avg: '$column_square' },
            data: { $push: '$column' },
          },
        },
        {
          $project: {
            count: 1,
            sea: '$_id.sea',
            'standard deviation': {
              $pow: [{ $subtract: ['$average_sum_square', { $pow: ['$average', 2] }] }, 0.5],
            },
          },
        },
        { $project: { _id: 0 } },
      ]);
    });

    it('can generate statistics steps with only one quantile', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'test_cube' },
        {
          name: 'statistics',
          column: 'wind',
          groupbyColumns: [],
          statistics: [],
          quantiles: [
            {
              order: 20,
              nth: 4,
            },
          ],
        },
      ];
      const querySteps = mongo36translator.translate(pipeline);
      expect(querySteps).toEqual([
        { $match: { domain: 'test_cube' } },
        { $project: { column: '$wind' } },
        { $match: { column: { $ne: null } } },
        { $sort: { column: 1 } },
        {
          $group: {
            _id: {},
            count: { $sum: 1 },
            data: { $push: '$column' },
          },
        },
        {
          $project: {
            '4-th 20-quantile': {
              $avg: [
                {
                  $arrayElemAt: [
                    '$data',
                    {
                      $trunc: {
                        $subtract: [{ $multiply: [{ $divide: ['$count', 20] }, 4] }, 1],
                      },
                    },
                  ],
                },
                {
                  $arrayElemAt: [
                    '$data',
                    {
                      $trunc: { $multiply: [{ $divide: ['$count', 20] }, 4] },
                    },
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
      { name: 'filter', condition: { column: 'Name', value: '/^[a-z]+$/i', operator: 'matches' } },
      {
        name: 'filter',
        condition: { column: 'Pin', value: '/^[a-z]+$/i', operator: 'notmatches' },
      },
      { name: 'filter', condition: { column: 'IsNull', value: null, operator: 'isnull' } },
      { name: 'filter', condition: { column: 'NotNull', value: null, operator: 'notnull' } },
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
          Name: { $regex: '/^[a-z]+$/i' },
          Pin: { $not: { $regex: '/^[a-z]+$/i' } },
          Code: { $nin: [0, 42] },
          IsNull: { $eq: null },
          NotNull: { $ne: null },
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
        query: '{"$group": {"_id": "$Country", "Population": {"$sum": "$Population"}}}',
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
        to_replace: [
          ['foo', 'bar'],
          ['old', 'new'],
        ],
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
        columns: [
          { column: 'foo', order: 'asc' },
          { column: 'bar', order: 'desc' },
        ],
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
          bar_PCT: {
            $cond: [
              { $eq: ['$_vqbTotalDenum', 0] },
              null,
              { $divide: ['$_vqbAppArray.bar', '$_vqbTotalDenum'] },
            ],
          },
          _vqbAppArray: 1,
        },
      },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbAppArray', '$$ROOT'] } } },
      { $project: { _vqbAppArray: 0, _id: 0 } },
    ]);
  });

  it('can generate a percentage step without groups, in a custom new column', () => {
    const pipeline: Pipeline = [
      {
        name: 'percentage',
        column: 'bar',
        newColumnName: 'newCol',
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
          newCol: {
            $cond: [
              { $eq: ['$_vqbTotalDenum', 0] },
              null,
              { $divide: ['$_vqbAppArray.bar', '$_vqbTotalDenum'] },
            ],
          },
          _vqbAppArray: 1,
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

  it('can generate a formula step with special column name', () => {
    const pipeline: Pipeline = [
      {
        name: 'formula',
        new_column: 'test',
        formula: '[column with space and + and, oh a - and_also *] + [an other ^column]',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          test: {
            $add: ['$column with space and + and, oh a - and_also *', '$an other ^column'],
          },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a formula step with a special column name and a normal column name', () => {
    const pipeline: Pipeline = [
      {
        name: 'formula',
        new_column: 'test',
        formula: '[column with space and + and, oh a - and_also *] + A',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          test: {
            $add: ['$column with space and + and, oh a - and_also *', '$A'],
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
              NB_CLIENTS_TOTAL: { $ifNull: ['$NB_CLIENTS_TOTAL', null] },
              NB_ROWS: { $ifNull: ['$NB_ROWS', null] },
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
              NB_CLIENTS_TOTAL: { $ifNull: ['$NB_CLIENTS_TOTAL', null] },
              NB_ROWS: { $ifNull: ['$NB_ROWS', null] },
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
          foo_SUBSTR: {
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
        newColumnName: 'bar',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          bar: {
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

  it('can generate a todate step without format', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: 'foo',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { foo: { $dateFromString: { dateString: '$foo' } } } },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a fromdate step with a custom format', () => {
    const pipeline: Pipeline = [
      {
        name: 'fromdate',
        column: 'foo',
        format: '%Y-%m-%d',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { foo: { $dateToString: { date: '$foo', format: '%Y-%m-%d' } } } },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a fromdate step with "%d %b %Y" preset format', () => {
    const pipeline: Pipeline = [
      {
        name: 'fromdate',
        column: 'foo',
        format: '%d %b %Y',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          foo: {
            $dateToString: { date: '$foo', format: '%d-%m-%Y' },
          },
        },
      },
      { $addFields: { _vqbTempArray: { $split: ['$foo', '-'] } } },
      {
        $addFields: {
          _vqbTempDay: { $arrayElemAt: ['$_vqbTempArray', 0] },
          _vqbTempMonth: { $arrayElemAt: ['$_vqbTempArray', 1] },
          _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 2] },
        },
      },
      {
        $addFields: { _vqbTempMonth: smallMonthReplace },
      },
      {
        $addFields: {
          foo: {
            $concat: ['$_vqbTempDay', ' ', '$_vqbTempMonth', ' ', '$_vqbTempYear'],
          },
        },
      },
      { $project: { _id: 0, _vqbTempArray: 0, _vqbTempDay: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
    ]);
  });

  it('can generate a fromdate step with "%d-%b-%Y" preset format', () => {
    const pipeline: Pipeline = [
      {
        name: 'fromdate',
        column: 'foo',
        format: '%d-%b-%Y',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          foo: {
            $dateToString: { date: '$foo', format: '%d-%m-%Y' },
          },
        },
      },
      { $addFields: { _vqbTempArray: { $split: ['$foo', '-'] } } },
      {
        $addFields: {
          _vqbTempDay: { $arrayElemAt: ['$_vqbTempArray', 0] },
          _vqbTempMonth: { $arrayElemAt: ['$_vqbTempArray', 1] },
          _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 2] },
        },
      },
      {
        $addFields: { _vqbTempMonth: smallMonthReplace },
      },
      {
        $addFields: {
          foo: {
            $concat: ['$_vqbTempDay', '-', '$_vqbTempMonth', '-', '$_vqbTempYear'],
          },
        },
      },
      { $project: { _id: 0, _vqbTempArray: 0, _vqbTempDay: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
    ]);
  });

  it('can generate a fromdate step with "%d %B %Y" preset format', () => {
    const pipeline: Pipeline = [
      {
        name: 'fromdate',
        column: 'foo',
        format: '%d %B %Y',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          foo: {
            $dateToString: { date: '$foo', format: '%d-%m-%Y' },
          },
        },
      },
      { $addFields: { _vqbTempArray: { $split: ['$foo', '-'] } } },
      {
        $addFields: {
          _vqbTempDay: { $arrayElemAt: ['$_vqbTempArray', 0] },
          _vqbTempMonth: { $arrayElemAt: ['$_vqbTempArray', 1] },
          _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 2] },
        },
      },
      {
        $addFields: { _vqbTempMonth: fullMonthReplace },
      },
      {
        $addFields: {
          foo: {
            $concat: ['$_vqbTempDay', ' ', '$_vqbTempMonth', ' ', '$_vqbTempYear'],
          },
        },
      },
      { $project: { _id: 0, _vqbTempArray: 0, _vqbTempDay: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
    ]);
  });

  it('can generate a fromdate step with "%b %Y" preset format', () => {
    const pipeline: Pipeline = [
      {
        name: 'fromdate',
        column: 'foo',
        format: '%b %Y',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          foo: {
            $dateToString: { date: '$foo', format: '%m-%Y' },
          },
        },
      },
      { $addFields: { _vqbTempArray: { $split: ['$foo', '-'] } } },
      {
        $addFields: {
          _vqbTempMonth: { $arrayElemAt: ['$_vqbTempArray', 0] },
          _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 1] },
        },
      },
      {
        $addFields: { _vqbTempMonth: smallMonthReplace },
      },
      {
        $addFields: {
          foo: {
            $concat: ['$_vqbTempMonth', ' ', '$_vqbTempYear'],
          },
        },
      },
      { $project: { _id: 0, _vqbTempArray: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
    ]);
  });

  it('can generate a fromdate step with "%b-%Y" preset format', () => {
    const pipeline: Pipeline = [
      {
        name: 'fromdate',
        column: 'foo',
        format: '%b-%Y',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          foo: {
            $dateToString: { date: '$foo', format: '%m-%Y' },
          },
        },
      },
      { $addFields: { _vqbTempArray: { $split: ['$foo', '-'] } } },
      {
        $addFields: {
          _vqbTempMonth: { $arrayElemAt: ['$_vqbTempArray', 0] },
          _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 1] },
        },
      },
      {
        $addFields: { _vqbTempMonth: smallMonthReplace },
      },
      {
        $addFields: {
          foo: {
            $concat: ['$_vqbTempMonth', '-', '$_vqbTempYear'],
          },
        },
      },
      { $project: { _id: 0, _vqbTempArray: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
    ]);
  });

  it('can generate a fromdate step with "%B %Y" preset format', () => {
    const pipeline: Pipeline = [
      {
        name: 'fromdate',
        column: 'foo',
        format: '%B %Y',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          foo: {
            $dateToString: { date: '$foo', format: '%m-%Y' },
          },
        },
      },
      { $addFields: { _vqbTempArray: { $split: ['$foo', '-'] } } },
      {
        $addFields: {
          _vqbTempMonth: { $arrayElemAt: ['$_vqbTempArray', 0] },
          _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 1] },
        },
      },
      {
        $addFields: { _vqbTempMonth: fullMonthReplace },
      },
      {
        $addFields: {
          foo: {
            $concat: ['$_vqbTempMonth', ' ', '$_vqbTempYear'],
          },
        },
      },
      { $project: { _id: 0, _vqbTempArray: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
    ]);
  });

  it('can generate an append step', () => {
    const pipelineBis: Pipeline = [
      { name: 'domain', domain: 'test_bis' },
      { name: 'delete', columns: ['useless'] },
    ];
    const pipelineTer: Pipeline = [
      { name: 'domain', domain: 'test_ter' },
      { name: 'select', columns: ['useful'] },
    ];
    const pipeline: Pipeline = [
      {
        name: 'domain',
        domain: 'test',
      },
      {
        name: 'rename',
        oldname: 'old',
        newname: 'new',
      },
      {
        name: 'append',
        pipelines: [pipelineBis, pipelineTer],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $match: {
          domain: 'test',
        },
      },
      {
        $addFields: {
          new: '$old',
        },
      },
      {
        $project: {
          old: 0,
        },
      },
      { $group: { _id: null, _vqbPipelineInline: { $push: '$$ROOT' } } },
      {
        $lookup: {
          from: 'test_bis',
          pipeline: [{ $project: { useless: 0, _id: 0 } }],
          as: '_vqbPipelineToAppend_0',
        },
      },
      {
        $lookup: {
          from: 'test_ter',
          pipeline: [{ $project: { useful: 1 } }, { $project: { _id: 0 } }],
          as: '_vqbPipelineToAppend_1',
        },
      },
      {
        $project: {
          _vqbPipelinesUnion: {
            $concatArrays: [
              '$_vqbPipelineInline',
              '$_vqbPipelineToAppend_0',
              '$_vqbPipelineToAppend_1',
            ],
          },
        },
      },
      { $unwind: '$_vqbPipelinesUnion' },
      { $replaceRoot: { newRoot: '$_vqbPipelinesUnion' } },
      { $project: { _id: 0 } },
    ]);
  });

  it('does not support the convert step', () => {
    const pipeline: Pipeline = [
      {
        name: 'convert',
        columns: ['foo', 'bar'],
        data_type: 'boolean',
      },
    ];
    try {
      mongo36translator.translate(pipeline);
    } catch (e) {
      expect(e.message).toBe('Unsupported step <convert>');
    }
  });

  it('converts year step', () => {
    const pipeline: Pipeline = [
      {
        name: 'dateextract',
        operation: 'year',
        column: 'foo',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          foo_year: { $year: '$foo' },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('extracts date and use new column name', () => {
    const pipeline: Pipeline = [
      {
        name: 'dateextract',
        operation: 'year',
        column: 'foo',
        new_column_name: 'bar',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          bar: { $year: '$foo' },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('converts day step', () => {
    const pipeline: Pipeline = [
      {
        name: 'dateextract',
        operation: 'day',
        column: 'foo',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          foo_day: { $dayOfMonth: '$foo' },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('converts day of week step', () => {
    const pipeline: Pipeline = [
      {
        name: 'dateextract',
        operation: 'dayOfWeek',
        column: 'foo',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          foo_dayOfWeek: { $dayOfWeek: '$foo' },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a left join step', () => {
    const rightPipeline: Pipeline = [
      { name: 'domain', domain: 'right' },
      { name: 'delete', columns: ['useless'] },
    ];
    const pipeline: Pipeline = [
      {
        name: 'domain',
        domain: 'test',
      },
      {
        name: 'rename',
        oldname: 'old',
        newname: 'new',
      },
      {
        name: 'join',
        right_pipeline: rightPipeline,
        type: 'left',
        on: [['id', 'id']],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $match: {
          domain: 'test',
        },
      },
      {
        $addFields: {
          new: '$old',
        },
      },
      {
        $project: {
          old: 0,
        },
      },
      {
        $lookup: {
          from: 'right',
          let: { vqb_id: '$id' },
          pipeline: [
            { $project: { useless: 0, _id: 0 } },
            { $match: { $expr: { $and: [{ $eq: ['$id', '$$vqb_id'] }] } } },
          ],
          as: '_vqbJoinKey',
        },
      },
      { $unwind: { path: '$_vqbJoinKey', preserveNullAndEmptyArrays: true } },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbJoinKey', '$$ROOT'] } } },
      { $project: { _vqbJoinKey: 0, _id: 0 } },
    ]);
  });

  it('can generate an inner join step', () => {
    const rightPipeline: Pipeline = [
      { name: 'domain', domain: 'right' },
      { name: 'delete', columns: ['useless'] },
    ];
    const pipeline: Pipeline = [
      {
        name: 'domain',
        domain: 'test',
      },
      {
        name: 'rename',
        oldname: 'old',
        newname: 'new',
      },
      {
        name: 'join',
        right_pipeline: rightPipeline,
        type: 'inner',
        on: [
          ['id', 'id'],
          ['country', 'country'],
        ],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $match: {
          domain: 'test',
        },
      },
      {
        $addFields: {
          new: '$old',
        },
      },
      {
        $project: {
          old: 0,
        },
      },
      {
        $lookup: {
          from: 'right',
          let: { vqb_id: '$id', vqb_country: '$country' },
          pipeline: [
            { $project: { useless: 0, _id: 0 } },
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$id', '$$vqb_id'] }, { $eq: ['$country', '$$vqb_country'] }],
                },
              },
            },
          ],
          as: '_vqbJoinKey',
        },
      },
      { $unwind: '$_vqbJoinKey' },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbJoinKey', '$$ROOT'] } } },
      { $project: { _vqbJoinKey: 0, _id: 0 } },
    ]);
  });

  it('can generate a join step with different "left_on" and "right_on" columns', () => {
    const rightPipeline: Pipeline = [
      { name: 'domain', domain: 'right' },
      { name: 'delete', columns: ['useless'] },
    ];
    const pipeline: Pipeline = [
      {
        name: 'domain',
        domain: 'test',
      },
      {
        name: 'rename',
        oldname: 'old',
        newname: 'new',
      },
      {
        name: 'join',
        right_pipeline: rightPipeline,
        type: 'inner',
        on: [
          ['id', 'id_right'],
          ['country', 'country_right'],
        ],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $match: {
          domain: 'test',
        },
      },
      {
        $addFields: {
          new: '$old',
        },
      },
      {
        $project: {
          old: 0,
        },
      },
      {
        $lookup: {
          from: 'right',
          let: { vqb_id: '$id', vqb_country: '$country' },
          pipeline: [
            { $project: { useless: 0, _id: 0 } },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$id_right', '$$vqb_id'] },
                    { $eq: ['$country_right', '$$vqb_country'] },
                  ],
                },
              },
            },
          ],
          as: '_vqbJoinKey',
        },
      },
      { $unwind: '$_vqbJoinKey' },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$_vqbJoinKey', '$$ROOT'] } } },
      { $project: { _vqbJoinKey: 0, _id: 0 } },
    ]);
  });

  it('validate any custom query has json valid', () => {
    const correctQuery = '[{"$match": {"domain": "test"}}]';
    expect(mongo36translator.validate({ name: 'custom', query: correctQuery })).toBeNull();
    const failedQuery = 'a[{"$match": {"domain": "test"}}]';
    expect(mongo36translator.validate({ name: 'custom', query: failedQuery })).toEqual([
      {
        keyword: 'json',
        dataPath: '.query',
        message: 'Unexpected token a in JSON at position 0',
      },
    ]);
  });

  it('can generate a uniquegroups step', () => {
    const pipeline: Pipeline = [
      {
        name: 'uniquegroups',
        on: ['col1', 'col2'],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $group: {
          _id: {
            col1: '$col1',
            col2: '$col2',
          },
        },
      },
      {
        $project: {
          col1: '$_id.col1',
          col2: '$_id.col2',
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);
  });

  it('can generate basic rollup steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'rollup',
        hierarchy: ['continent', 'country', 'city'],
        aggregations: [
          {
            newcolumn: 'value1',
            aggfunction: 'sum',
            column: 'value1',
          },
        ],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $facet: {
          level_0: [
            {
              $group: {
                _id: {
                  continent: '$continent',
                },
                value1: { $sum: '$value1' },
              },
            },
            {
              $project: {
                _id: 0,
                continent: '$_id.continent',
                label: '$_id.continent',
                level: 'continent',
                value1: 1,
              },
            },
          ],
          level_1: [
            {
              $group: {
                _id: {
                  country: '$country',
                  continent: '$continent',
                },
                value1: { $sum: '$value1' },
              },
            },
            {
              $project: {
                _id: 0,
                country: '$_id.country',
                continent: '$_id.continent',
                label: '$_id.country',
                parent: '$_id.continent',
                level: 'country',
                value1: 1,
              },
            },
          ],
          level_2: [
            {
              $group: {
                _id: {
                  city: '$city',
                  country: '$country',
                  continent: '$continent',
                },
                value1: { $sum: '$value1' },
              },
            },
            {
              $project: {
                _id: 0,
                city: '$_id.city',
                country: '$_id.country',
                continent: '$_id.continent',
                label: '$_id.city',
                parent: '$_id.country',
                level: 'city',
                value1: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          _vqbRollupLevels: { $concatArrays: ['$level_0', '$level_1', '$level_2'] },
        },
      },
      {
        $unwind: '$_vqbRollupLevels',
      },
      {
        $replaceRoot: { newRoot: '$_vqbRollupLevels' },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);
  });

  it('can generate more complex rollup steps if needed', () => {
    const pipeline: Pipeline = [
      {
        name: 'rollup',
        hierarchy: ['continent', 'country', 'city'],
        aggregations: [
          {
            newcolumn: 'value1',
            aggfunction: 'sum',
            column: 'value1',
          },
          {
            newcolumn: 'value2',
            aggfunction: 'count',
            column: 'value2',
          },
        ],
        groupby: ['date', 'segment'],
        labelCol: 'myLabel',
        levelCol: 'myLevel',
        parentLabelCol: 'myParent',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $facet: {
          level_0: [
            {
              $group: {
                _id: {
                  continent: '$continent',
                  date: '$date',
                  segment: '$segment',
                },
                value1: { $sum: '$value1' },
                value2: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                continent: '$_id.continent',
                date: '$_id.date',
                segment: '$_id.segment',
                myLabel: '$_id.continent',
                myLevel: 'continent',
                value1: 1,
                value2: 1,
              },
            },
          ],
          level_1: [
            {
              $group: {
                _id: {
                  country: '$country',
                  continent: '$continent',
                  date: '$date',
                  segment: '$segment',
                },
                value1: { $sum: '$value1' },
                value2: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                country: '$_id.country',
                continent: '$_id.continent',
                date: '$_id.date',
                segment: '$_id.segment',
                myLabel: '$_id.country',
                myParent: '$_id.continent',
                myLevel: 'country',
                value1: 1,
                value2: 1,
              },
            },
          ],
          level_2: [
            {
              $group: {
                _id: {
                  city: '$city',
                  country: '$country',
                  continent: '$continent',
                  date: '$date',
                  segment: '$segment',
                },
                value1: { $sum: '$value1' },
                value2: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                city: '$_id.city',
                country: '$_id.country',
                continent: '$_id.continent',
                date: '$_id.date',
                segment: '$_id.segment',
                myLabel: '$_id.city',
                myParent: '$_id.country',
                myLevel: 'city',
                value1: 1,
                value2: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          _vqbRollupLevels: { $concatArrays: ['$level_0', '$level_1', '$level_2'] },
        },
      },
      {
        $unwind: '$_vqbRollupLevels',
      },
      {
        $replaceRoot: { newRoot: '$_vqbRollupLevels' },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);
  });

  it('can generate a basic evolution step vs. last year in absolute value', () => {
    const pipeline: Pipeline = [
      {
        name: 'evolution',
        dateCol: 'DATE',
        valueCol: 'VALUE',
        evolutionType: 'vsLastYear',
        evolutionFormat: 'abs',
        indexColumns: [],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          _VQB_DATE_PREV: {
            $dateFromParts: {
              year: { $subtract: [{ $year: '$DATE' }, 1] },
              month: { $month: '$DATE' },
              day: { $dayOfMonth: '$DATE' },
            },
          },
        },
      },
      {
        $facet: {
          _VQB_ORIGINALS: [{ $project: { _id: 0 } }],
          _VQB_COPIES_ARRAY: [{ $group: { _id: null, _VQB_ALL_DOCS: { $push: '$$ROOT' } } }],
        },
      },
      { $unwind: '$_VQB_ORIGINALS' },
      {
        $project: {
          _VQB_ORIGINALS: {
            $mergeObjects: ['$_VQB_ORIGINALS', { $arrayElemAt: ['$_VQB_COPIES_ARRAY', 0] }],
          },
        },
      },
      { $replaceRoot: { newRoot: '$_VQB_ORIGINALS' } },
      {
        $addFields: {
          _VQB_ALL_DOCS: {
            $filter: {
              input: '$_VQB_ALL_DOCS',
              as: 'item',
              cond: {
                $and: [{ $eq: ['$_VQB_DATE_PREV', '$$item.DATE'] }],
              },
            },
          },
        },
      },
      {
        $addFields: {
          _VQB_VALUE_PREV: {
            $cond: [
              { $gt: [{ $size: `$_VQB_ALL_DOCS.VALUE` }, 1] },
              'Error',
              { $arrayElemAt: [`$_VQB_ALL_DOCS.VALUE`, 0] },
            ],
          },
        },
      },
      {
        $addFields: {
          VALUE_EVOL_ABS: {
            $cond: [
              {
                $eq: ['$_VQB_VALUE_PREV', 'Error'],
              },
              'Error: More than one previous date found for the specified index columns',
              { $subtract: ['$VALUE', '$_VQB_VALUE_PREV'] },
            ],
          },
        },
      },
      {
        $project: {
          _VQB_ALL_DOCS: 0,
          _VQB_DATE_PREV: 0,
          _VQB_VALUE_PREV: 0,
          _id: 0,
        },
      },
    ]);
  });

  it('can generate a complete evolution step vs. last month in absolute value', () => {
    const pipeline: Pipeline = [
      {
        name: 'evolution',
        dateCol: 'DATE',
        valueCol: 'VALUE',
        evolutionType: 'vsLastMonth',
        evolutionFormat: 'abs',
        indexColumns: ['PRODUCT', 'COUNTRY'],
        newColumn: 'DIFF',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          _VQB_DATE_PREV: {
            $dateFromParts: {
              year: {
                $cond: [
                  { $eq: [{ $month: '$DATE' }, 1] },
                  { $subtract: [{ $year: '$DATE' }, 1] },
                  { $year: '$DATE' },
                ],
              },
              month: {
                $cond: [
                  { $eq: [{ $month: '$DATE' }, 1] },
                  12,
                  { $subtract: [{ $month: '$DATE' }, 1] },
                ],
              },
              day: { $dayOfMonth: '$DATE' },
            },
          },
        },
      },
      {
        $facet: {
          _VQB_ORIGINALS: [{ $project: { _id: 0 } }],
          _VQB_COPIES_ARRAY: [{ $group: { _id: null, _VQB_ALL_DOCS: { $push: '$$ROOT' } } }],
        },
      },
      { $unwind: '$_VQB_ORIGINALS' },
      {
        $project: {
          _VQB_ORIGINALS: {
            $mergeObjects: ['$_VQB_ORIGINALS', { $arrayElemAt: ['$_VQB_COPIES_ARRAY', 0] }],
          },
        },
      },
      { $replaceRoot: { newRoot: '$_VQB_ORIGINALS' } },
      {
        $addFields: {
          _VQB_ALL_DOCS: {
            $filter: {
              input: '$_VQB_ALL_DOCS',
              as: 'item',
              cond: {
                $and: [
                  { $eq: ['$_VQB_DATE_PREV', '$$item.DATE'] },
                  { $eq: ['$PRODUCT', '$$item.PRODUCT'] },
                  { $eq: ['$COUNTRY', '$$item.COUNTRY'] },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          _VQB_VALUE_PREV: {
            $cond: [
              { $gt: [{ $size: `$_VQB_ALL_DOCS.VALUE` }, 1] },
              'Error',
              { $arrayElemAt: [`$_VQB_ALL_DOCS.VALUE`, 0] },
            ],
          },
        },
      },
      {
        $addFields: {
          DIFF: {
            $cond: [
              {
                $eq: ['$_VQB_VALUE_PREV', 'Error'],
              },
              'Error: More than one previous date found for the specified index columns',
              { $subtract: ['$VALUE', '$_VQB_VALUE_PREV'] },
            ],
          },
        },
      },
      {
        $project: {
          _VQB_ALL_DOCS: 0,
          _VQB_DATE_PREV: 0,
          _VQB_VALUE_PREV: 0,
          _id: 0,
        },
      },
    ]);
  });

  it('can generate an evolution step vs. last week in percentage value', () => {
    const pipeline: Pipeline = [
      {
        name: 'evolution',
        dateCol: 'DATE',
        valueCol: 'VALUE',
        evolutionType: 'vsLastWeek',
        evolutionFormat: 'pct',
        indexColumns: [],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          _VQB_DATE_PREV: {
            $subtract: ['$DATE', 60 * 60 * 24 * 1000 * 7],
          },
        },
      },
      {
        $facet: {
          _VQB_ORIGINALS: [{ $project: { _id: 0 } }],
          _VQB_COPIES_ARRAY: [{ $group: { _id: null, _VQB_ALL_DOCS: { $push: '$$ROOT' } } }],
        },
      },
      { $unwind: '$_VQB_ORIGINALS' },
      {
        $project: {
          _VQB_ORIGINALS: {
            $mergeObjects: ['$_VQB_ORIGINALS', { $arrayElemAt: ['$_VQB_COPIES_ARRAY', 0] }],
          },
        },
      },
      { $replaceRoot: { newRoot: '$_VQB_ORIGINALS' } },
      {
        $addFields: {
          _VQB_ALL_DOCS: {
            $filter: {
              input: '$_VQB_ALL_DOCS',
              as: 'item',
              cond: {
                $and: [{ $eq: ['$_VQB_DATE_PREV', '$$item.DATE'] }],
              },
            },
          },
        },
      },
      {
        $addFields: {
          _VQB_VALUE_PREV: {
            $cond: [
              { $gt: [{ $size: `$_VQB_ALL_DOCS.VALUE` }, 1] },
              'Error',
              { $arrayElemAt: [`$_VQB_ALL_DOCS.VALUE`, 0] },
            ],
          },
        },
      },
      {
        $addFields: {
          VALUE_EVOL_PCT: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ['$_VQB_VALUE_PREV', 'Error'],
                  },
                  then: 'Error: More than one previous date found for the specified index columns',
                },
                { case: { $eq: ['$_VQB_VALUE_PREV', 0] }, then: null },
              ],
              default: {
                $divide: [{ $subtract: ['$VALUE', '$_VQB_VALUE_PREV'] }, '$_VQB_VALUE_PREV'],
              },
            },
          },
        },
      },
      {
        $project: {
          _VQB_ALL_DOCS: 0,
          _VQB_DATE_PREV: 0,
          _VQB_VALUE_PREV: 0,
          _id: 0,
        },
      },
    ]);
  });

  it('can generate an evolution step vs. last day', () => {
    const pipeline: Pipeline = [
      {
        name: 'evolution',
        dateCol: 'DATE',
        valueCol: 'VALUE',
        evolutionType: 'vsLastDay',
        evolutionFormat: 'abs',
        indexColumns: [],
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          _VQB_DATE_PREV: {
            $subtract: ['$DATE', 60 * 60 * 24 * 1000],
          },
        },
      },
      {
        $facet: {
          _VQB_ORIGINALS: [{ $project: { _id: 0 } }],
          _VQB_COPIES_ARRAY: [{ $group: { _id: null, _VQB_ALL_DOCS: { $push: '$$ROOT' } } }],
        },
      },
      { $unwind: '$_VQB_ORIGINALS' },
      {
        $project: {
          _VQB_ORIGINALS: {
            $mergeObjects: ['$_VQB_ORIGINALS', { $arrayElemAt: ['$_VQB_COPIES_ARRAY', 0] }],
          },
        },
      },
      { $replaceRoot: { newRoot: '$_VQB_ORIGINALS' } },
      {
        $addFields: {
          _VQB_ALL_DOCS: {
            $filter: {
              input: '$_VQB_ALL_DOCS',
              as: 'item',
              cond: {
                $and: [{ $eq: ['$_VQB_DATE_PREV', '$$item.DATE'] }],
              },
            },
          },
        },
      },
      {
        $addFields: {
          _VQB_VALUE_PREV: {
            $cond: [
              { $gt: [{ $size: `$_VQB_ALL_DOCS.VALUE` }, 1] },
              'Error',
              { $arrayElemAt: [`$_VQB_ALL_DOCS.VALUE`, 0] },
            ],
          },
        },
      },
      {
        $addFields: {
          VALUE_EVOL_ABS: {
            $cond: [
              {
                $eq: ['$_VQB_VALUE_PREV', 'Error'],
              },
              'Error: More than one previous date found for the specified index columns',
              { $subtract: ['$VALUE', '$_VQB_VALUE_PREV'] },
            ],
          },
        },
      },
      {
        $project: {
          _VQB_ALL_DOCS: 0,
          _VQB_DATE_PREV: 0,
          _VQB_VALUE_PREV: 0,
          _id: 0,
        },
      },
    ]);
  });

  it('can generate basic cumsum steps if needed', () => {
    const pipeline: Pipeline = [
      {
        name: 'cumsum',
        valueColumn: 'VALUE',
        referenceColumn: 'DATE',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $group: {
          _id: { DATE: '$DATE' },
          VALUE: { $sum: '$VALUE' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $group: {
          _id: null,
          DATE: { $push: '$_id.DATE' },
          VALUE: { $push: '$VALUE' },
        },
      },
      { $unwind: { path: '$DATE', includeArrayIndex: '_VQB_INDEX' } },
      {
        $project: {
          DATE: 1,
          VALUE: { $arrayElemAt: ['$VALUE', '$_VQB_INDEX'] },
          VALUE_CUMSUM: { $sum: { $slice: ['$VALUE', { $add: ['$_VQB_INDEX', 1] }] } },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate more complex cumsum steps if needed', () => {
    const pipeline: Pipeline = [
      {
        name: 'cumsum',
        valueColumn: 'VALUE',
        referenceColumn: 'DATE',
        groupby: ['COUNTRY', 'PRODUCT'],
        newColumn: 'MY_NEW_COLUMN',
      },
    ];
    const querySteps = mongo36translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $group: {
          _id: {
            DATE: '$DATE',
            COUNTRY: '$COUNTRY',
            PRODUCT: '$PRODUCT',
          },
          VALUE: { $sum: '$VALUE' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $group: {
          _id: {
            COUNTRY: '$_id.COUNTRY',
            PRODUCT: '$_id.PRODUCT',
          },
          DATE: { $push: '$_id.DATE' },
          VALUE: { $push: '$VALUE' },
        },
      },
      { $unwind: { path: '$DATE', includeArrayIndex: '_VQB_INDEX' } },
      {
        $project: {
          COUNTRY: '$_id.COUNTRY',
          PRODUCT: '$_id.PRODUCT',
          DATE: 1,
          VALUE: { $arrayElemAt: ['$VALUE', '$_VQB_INDEX'] },
          MY_NEW_COLUMN: { $sum: { $slice: ['$VALUE', { $add: ['$_VQB_INDEX', 1] }] } },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });
});
