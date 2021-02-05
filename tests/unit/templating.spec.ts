import { Pipeline } from '@/lib/steps';
import { exampleInterpolateFunc, PipelineInterpolator, ScopeContext } from '@/lib/templating';

describe('Pipeline interpolator', () => {
  const defaultContext: ScopeContext = {
    foo: 'bar',
    egg: 'spam',
    age: 42,
    array: [1, 2],
  };

  function translate(pipeline: Pipeline, context = defaultContext) {
    const pipelineInterpolator = new PipelineInterpolator(exampleInterpolateFunc, context);
    return pipelineInterpolator.interpolate(pipeline);
  }

  it('should leave aggregation steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'aggregate',
        on: ['column1', 'column2'],
        aggregations: [
          {
            aggfunction: 'avg',
            columns: ['spam'],
            newcolumns: ['<%= egg %>'],
          },
        ],
        keepOriginalGranularity: false,
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should interpolate aggregation steps if needed', () => {
    const pipeline: Pipeline = [
      {
        name: 'aggregate',
        on: ['column1', '<%= foo %>'],
        aggregations: [
          {
            aggfunction: 'avg',
            columns: ['<%= foo %>', '<%= egg %>'],
            newcolumns: ['<%= egg %>'],
          },
          {
            aggfunction: 'sum',
            columns: ['<%= foo %>', '<%= egg %>'],
            newcolumns: ['<%= egg %>'],
          },
        ],
        keepOriginalGranularity: false,
      },
    ];

    expect(translate(pipeline)).toEqual([
      {
        name: 'aggregate',
        on: ['column1', 'bar'],
        aggregations: [
          {
            aggfunction: 'avg',
            columns: ['bar', 'spam'],
            newcolumns: ['<%= egg %>'],
          },
          {
            aggfunction: 'sum',
            columns: ['bar', 'spam'],
            newcolumns: ['<%= egg %>'],
          },
        ],
        keepOriginalGranularity: false,
      },
    ]);
  });

  it('should interpolate aggregation steps old-fashioned if needed', () => {
    // Test for retrocompatibility purposes
    const pipeline: Pipeline = [
      {
        name: 'aggregate',
        on: ['column1', '<%= foo %>'],
        aggregations: [
          {
            aggfunction: 'avg',
            column: '<%= foo %>',
            newcolumn: '<%= egg %>',
            columns: [],
            newcolumns: [],
          },
        ],
        keepOriginalGranularity: false,
      },
    ];

    expect(translate(pipeline)).toEqual([
      {
        name: 'aggregate',
        on: ['column1', 'bar'],
        aggregations: [
          {
            aggfunction: 'avg',
            column: 'bar',
            newcolumn: '<%= egg %>',
            columns: [],
            newcolumns: [],
          },
        ],
        keepOriginalGranularity: false,
      },
    ]);
  });

  it('should leave append steps untouched if pipeline are not dereferenced', () => {
    const pipeline: Pipeline = [
      {
        name: 'append',
        pipelines: ['<%= dataset1 %>', 'dataset2'],
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should interpolate pipelines of append step, if they are dereferenced', () => {
    const pipeline: Pipeline = [
      {
        name: 'append',
        pipelines: [
          [
            {
              name: 'domain',
              domain: 'zorro',
            },
            {
              name: 'argmin',
              column: '<%= foo %>',
              groups: ['<%= egg %>', 'column3', '<%= foo %>'],
            },
          ],
          [
            {
              name: 'domain',
              domain: 'dondiego',
            },
            {
              name: 'concatenate',
              columns: ['<%= foo %>', '<%= egg %>'],
              separator: '<%= foo %>',
              new_column_name: '<%= foo %>',
            },
          ],
        ],
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'append',
        pipelines: [
          [
            {
              name: 'domain',
              domain: 'zorro',
            },
            {
              name: 'argmin',
              column: 'bar',
              groups: ['spam', 'column3', 'bar'],
            },
          ],
          [
            {
              name: 'domain',
              domain: 'dondiego',
            },
            {
              name: 'concatenate',
              columns: ['bar', 'spam'],
              separator: '<%= foo %>', // NB: separator and new column are not templated in concatenate
              new_column_name: '<%= foo %>',
            },
          ],
        ],
      },
    ]);
  });

  it('should interpolate argmax steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'argmax',
        column: '<%= foo %>',
        groups: ['<%= egg %>', 'column3', '<%= foo %>'],
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'argmax',
        column: 'bar',
        groups: ['spam', 'column3', 'bar'],
      },
    ]);
  });

  it('should interpolate argmin steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'argmin',
        column: '<%= foo %>',
        groups: ['<%= egg %>', 'column3', '<%= foo %>'],
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'argmin',
        column: 'bar',
        groups: ['spam', 'column3', 'bar'],
      },
    ]);
  });

  it('should interpolate concatenate steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'concatenate',
        columns: ['<%= foo %>', '<%= egg %>'],
        separator: '<%= foo %>',
        new_column_name: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'concatenate',
        columns: ['bar', 'spam'],
        separator: '<%= foo %>',
        new_column_name: '<%= foo %>',
      },
    ]);
  });

  it('should leave convert steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'convert',
        columns: ['<%= foo %>', '<%= bar %>'],
        data_type: 'date',
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should interpolate a custom step query', () => {
    const pipeline: Pipeline = [
      {
        name: 'custom',
        query: '{ $match: "<%= foo %>"}',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'custom',
        query: '{ $match: "bar"}',
      },
    ]);
  });

  it('interpolates the "text" parameter of text steps', () => {
    const step: Pipeline = [
      {
        name: 'text',
        text: '<%= foo %>',
        new_column: '<%= foo %>',
      },
    ];
    expect(translate(step)).toEqual([
      {
        name: 'text',
        text: 'bar',
        new_column: 'bar',
      },
    ]);
  });

  it('should leave todate steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: '<%= foo %>',
        format: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should leave fromdate steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'fromdate',
        column: '<%= foo %>',
        format: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should interpolate dateextract steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'dateextract',
        operation: 'year',
        column: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'dateextract',
        operation: 'year',
        column: 'bar',
      },
    ]);
  });

  it('should leave domain steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'domain',
        domain: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should leave duplicate steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'duplicate',
        column: '<%= foo %>',
        new_column_name: '<%= bar %>',
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should leave delete steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'delete',
        columns: ['<%= foo %>'],
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should interpolate fillna steps if required', () => {
    const pipeline: Pipeline = [
      {
        name: 'fillna',
        columns: ['<%= foo %>'],
        value: '<%= age %>',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'fillna',
        columns: ['<%= foo %>'],
        value: 42,
      },
    ]);
  });

  it('should interpolate and cast fillna steps if required', () => {
    const pipeline: Pipeline = [
      {
        name: 'fillna',
        columns: ['column1'],
        value: '<%= age %>',
      },
    ];
    expect(translate(pipeline, defaultContext)).toEqual([
      {
        name: 'fillna',
        columns: ['column1'],
        value: 42,
      },
    ]);
  });

  it('should leave fillna steps if no variable is found', () => {
    const pipeline: Pipeline = [
      {
        name: 'fillna',
        columns: ['foo'],
        value: 'hola',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'fillna',
        columns: ['foo'],
        value: 'hola',
      },
    ]);
  });

  it('interpolates simple filter steps / operator "eq"', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          column: '<%= foo %>',
          value: '<%= age %>',
          operator: 'eq',
        },
      },
    ];
    expect(translate(step)).toEqual([
      {
        name: 'filter',
        condition: {
          column: 'bar',
          value: 42,
          operator: 'eq',
        },
      },
    ]);
  });

  it('interpolates and casts simple filter steps / operator "eq"', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          column: 'foo',
          value: '<%= age %>',
          operator: 'eq',
        },
      },
    ];
    expect(translate(step, defaultContext)).toEqual([
      {
        name: 'filter',
        condition: {
          column: 'foo',
          value: 42,
          operator: 'eq',
        },
      },
    ]);
  });

  it('interpolates simple filter steps / operator "ne"', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          column: '<%= foo %>',
          value: '<%= age %>',
          operator: 'ne',
        },
      },
    ];
    expect(translate(step)).toEqual([
      {
        name: 'filter',
        condition: {
          column: 'bar',
          value: 42,
          operator: 'ne',
        },
      },
    ]);
  });

  it('interpolates simple filter steps / operator "lt"', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          column: '<%= foo %>',
          value: '<%= age %>',
          operator: 'lt',
        },
      },
    ];
    expect(translate(step)).toEqual([
      {
        name: 'filter',
        condition: {
          column: 'bar',
          value: 42,
          operator: 'lt',
        },
      },
    ]);
  });

  it('interpolates simple filter steps / operator "le"', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          column: '<%= foo %>',
          value: '<%= age %>',
          operator: 'le',
        },
      },
    ];
    expect(translate(step)).toEqual([
      {
        name: 'filter',
        condition: {
          column: 'bar',
          value: 42,
          operator: 'le',
        },
      },
    ]);
  });

  it('interpolates simple filter steps / operator "gt"', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          column: '<%= foo %>',
          value: '<%= age %>',
          operator: 'gt',
        },
      },
    ];
    expect(translate(step)).toEqual([
      {
        name: 'filter',
        condition: {
          column: 'bar',
          value: 42,
          operator: 'gt',
        },
      },
    ]);
  });

  it('interpolates simple filter steps / operator "ge"', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          column: '<%= foo %>',
          value: '<%= age %>',
          operator: 'ge',
        },
      },
    ];
    expect(translate(step)).toEqual([
      {
        name: 'filter',
        condition: {
          column: 'bar',
          value: 42,
          operator: 'ge',
        },
      },
    ]);
  });

  it('interpolates simple filter steps / operator "in"', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          column: '<%= foo %>',
          value: [11, '<%= age %>', '<%= egg %>', 'hola'],
          operator: 'in',
        },
      },
    ];
    expect(translate(step)).toEqual([
      {
        name: 'filter',
        condition: {
          column: 'bar',
          value: [11, 42, 'spam', 'hola'],
          operator: 'in',
        },
      },
    ]);
  });

  it('interpolates simple filter steps / operator "nin"', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          column: '<%= foo %>',
          value: [11, '<%= age %>', '<%= egg %>', 'hola'],
          operator: 'nin',
        },
      },
    ];
    expect(translate(step)).toEqual([
      {
        name: 'filter',
        condition: {
          column: 'bar',
          value: [11, 42, 'spam', 'hola'],
          operator: 'nin',
        },
      },
    ]);
  });

  it('interpolates simple filter steps / operator "in" or "nin" with array variables flatten', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          column: '<%= foo %>',
          value: [11, '<%= array %>', '<%= egg %>', 'hola'],
          operator: 'in',
        },
      },
    ];
    expect(translate(step)).toEqual([
      {
        name: 'filter',
        condition: {
          column: 'bar',
          value: [11, 1, 2, 'spam', 'hola'],
          operator: 'in',
        },
      },
    ]);
  });

  it('should interpolate simple filter steps / operator "isnull"', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          column: '<%= foo %>',
          value: '<%= age %>',
          operator: 'isnull',
        },
      },
    ];
    expect(translate(step)).toEqual([
      {
        name: 'filter',
        condition: {
          column: 'bar',
          value: '<%= age %>',
          operator: 'isnull',
        },
      },
    ]);
  });

  it('should interpolate simple filter steps / operator "notnull"', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          column: '<%= foo %>',
          value: '<%= age %>',
          operator: 'notnull',
        },
      },
    ];
    expect(translate(step)).toEqual([
      {
        name: 'filter',
        condition: {
          column: 'bar',
          value: '<%= age %>',
          operator: 'notnull',
        },
      },
    ]);
  });

  it('interpolates "and" filter steps', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          and: [
            {
              column: '<%= foo %>',
              value: [11, '<%= age %>', '<%= egg %>', 'hola'],
              operator: 'nin',
            },
            {
              column: '<%= foo %>',
              value: 12,
              operator: 'eq',
            },
            {
              column: '<%= foo %>',
              value: '<%= egg %>',
              operator: 'ne',
            },
          ],
        },
      },
    ];
    expect(translate(step)).toEqual([
      {
        name: 'filter',
        condition: {
          and: [
            {
              column: 'bar',
              value: [11, 42, 'spam', 'hola'],
              operator: 'nin',
            },
            {
              column: 'bar',
              value: 12,
              operator: 'eq',
            },
            {
              column: 'bar',
              value: 'spam',
              operator: 'ne',
            },
          ],
        },
      },
    ]);
  });

  it('interpolates and casts "and" filter steps', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          and: [
            {
              column: '<%= foo %>',
              value: [11, '<%= age %>', '<%= egg %>', 'hola'],
              operator: 'nin',
            },
            {
              column: 'column1',
              value: '<%= age %>',
              operator: 'eq',
            },
            {
              column: 'column2',
              value: '<%= truth %>',
              operator: 'ne',
            },
          ],
        },
      },
    ];
    expect(translate(step, { ...defaultContext, truth: true })).toEqual([
      {
        name: 'filter',
        condition: {
          and: [
            {
              column: 'bar',
              value: [11, 42, 'spam', 'hola'],
              operator: 'nin',
            },
            {
              column: 'column1',
              value: 42,
              operator: 'eq',
            },
            {
              column: 'column2',
              value: true,
              operator: 'ne',
            },
          ],
        },
      },
    ]);
  });

  it('interpolates "or" filter steps', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          or: [
            {
              column: '<%= foo %>',
              value: [11, '<%= age %>', '<%= egg %>', 'hola'],
              operator: 'nin',
            },
            {
              column: '<%= foo %>',
              value: 12,
              operator: 'eq',
            },
            {
              column: '<%= foo %>',
              value: '<%= egg %>',
              operator: 'ne',
            },
          ],
        },
      },
    ];
    expect(translate(step)).toEqual([
      {
        name: 'filter',
        condition: {
          or: [
            {
              column: 'bar',
              value: [11, 42, 'spam', 'hola'],
              operator: 'nin',
            },
            {
              column: 'bar',
              value: 12,
              operator: 'eq',
            },
            {
              column: 'bar',
              value: 'spam',
              operator: 'ne',
            },
          ],
        },
      },
    ]);
  });

  it('interpolates and casts "or" filter steps', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          or: [
            {
              column: '<%= foo %>',
              value: [11, '<%= age %>', '<%= egg %>', 'hola'],
              operator: 'nin',
            },
            {
              column: 'column1',
              value: '<%= age %>',
              operator: 'eq',
            },
            {
              column: 'column2',
              value: '<%= truth %>',
              operator: 'ne',
            },
          ],
        },
      },
    ];
    expect(translate(step, { ...defaultContext, truth: true })).toEqual([
      {
        name: 'filter',
        condition: {
          or: [
            {
              column: 'bar',
              value: [11, 42, 'spam', 'hola'],
              operator: 'nin',
            },
            {
              column: 'column1',
              value: 42,
              operator: 'eq',
            },
            {
              column: 'column2',
              value: true,
              operator: 'ne',
            },
          ],
        },
      },
    ]);
  });

  it('interpolates formula steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'formula',
        new_column: 'column3',
        formula: 'column1 + <%= age %>',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'formula',
        new_column: 'column3',
        formula: 'column1 + 42',
      },
    ]);
  });

  it('leaves formula steps untouched if no variable is found', () => {
    const pipeline: Pipeline = [
      {
        name: 'formula',
        new_column: 'column3',
        formula: 'column1 + column2',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'formula',
        new_column: 'column3',
        formula: 'column1 + column2',
      },
    ]);
  });

  it('should leave lowercase steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'lowercase',
        column: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should leave join steps untouched if right pipeline is not dereferenced', () => {
    const pipeline: Pipeline = [
      {
        name: 'join',
        right_pipeline: '<%= right %>',
        type: 'left',
        on: [['<%= col %>', '<%= col %>']],
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should template the joined right pipeline if it is dereferenced', () => {
    const pipeline: Pipeline = [
      {
        name: 'join',
        right_pipeline: [
          {
            name: 'domain',
            domain: 'dondiego',
          },
          {
            name: 'concatenate',
            columns: ['<%= foo %>', '<%= egg %>'],
            separator: '<%= foo %>',
            new_column_name: '<%= foo %>',
          },
        ],
        type: 'left',
        on: [['<%= col %>', '<%= col %>']],
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'join',
        right_pipeline: [
          {
            name: 'domain',
            domain: 'dondiego',
          },
          {
            name: 'concatenate',
            columns: ['bar', 'spam'],
            separator: '<%= foo %>', // NB: separator and new column are not templated in concatenate
            new_column_name: '<%= foo %>',
          },
        ],
        type: 'left',
        on: [['<%= col %>', '<%= col %>']],
      },
    ]);
  });

  it('should leave percentage steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'percentage',
        column: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should interpolate pivot steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'pivot',
        index: ['<%= foo %>', 'column2'],
        column_to_pivot: '<%= foo %>',
        value_column: '<%= egg %>',
        agg_function: 'sum',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'pivot',
        index: ['bar', 'column2'],
        column_to_pivot: 'bar',
        value_column: 'spam',
        agg_function: 'sum',
      },
    ]);
  });

  it('should leave rename steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'rename',
        toRename: [
          ['<%= foo %>', '<%= egg %>'],
          ['<%= egg %>', '<%= foo %>'],
        ],
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'rename',
        toRename: [
          ['bar', 'spam'],
          ['spam', 'bar'],
        ],
      },
    ]);
  });

  it('should leave replace steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'replace',
        search_column: '<%= age %>',
        to_replace: [
          [12, 22],
          ['13', '23'],
        ],
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should interpolate replace steps if required', () => {
    const pipeline: Pipeline = [
      {
        name: 'replace',
        search_column: '<%= age %>',
        to_replace: [
          ['<%= age %>', 12],
          ['what?', '<%= age %>'],
        ],
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'replace',
        search_column: '<%= age %>',
        to_replace: [
          [42, 12],
          ['what?', 42],
        ],
      },
    ]);
  });

  it('should interpolate and cast replace steps if required', () => {
    const pipeline: Pipeline = [
      {
        name: 'replace',
        search_column: 'column1',
        to_replace: [
          ['<%= age %>', 12],
          [13, '<%= age %>'],
        ],
      },
    ];
    expect(translate(pipeline, defaultContext)).toEqual([
      {
        name: 'replace',
        search_column: 'column1',
        to_replace: [
          [42, 12],
          [13, 42],
        ],
      },
    ]);
  });

  it('should leave select steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'select',
        columns: ['<%= age %>', 'column2'],
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should leave sort steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'sort',
        columns: [
          { column: '<%= age %>', order: 'asc' },
          { column: 'column2', order: 'desc' },
        ],
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should leave statistics steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'statistics',
        column: '<%= foo %>',
        groupbyColumns: [],
        statistics: ['average'],
        quantiles: [],
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should interpolate split steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'split',
        column: '<%= foo %>',
        delimiter: '<%= egg %>',
        number_cols_to_keep: 3,
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'split',
        column: 'bar',
        delimiter: '<%= egg %>',
        number_cols_to_keep: 3,
      },
    ]);
  });

  it('should leave substring steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'substring',
        column: '<%= column %>',
        start_index: 1,
        end_index: 1,
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should interpolate top steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'top',
        rank_on: '<%= foo %>',
        sort: 'asc',
        limit: '<%= age %>',
        groups: ['<%= foo %>', '<%= egg %>'],
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'top',
        rank_on: 'bar',
        sort: 'asc',
        limit: 42,
        groups: ['bar', 'spam'],
      },
    ]);
  });

  it('should interpolate unpivot steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'unpivot',
        keep: ['<%= foo %>', '<%= egg %>', 'column2'],
        unpivot: ['<%= foo %>', '<%= egg %>', 'column4'],
        unpivot_column_name: '<%= foo %>',
        value_column_name: '<%= foo %>',
        dropna: true,
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'unpivot',
        keep: ['bar', 'spam', 'column2'],
        unpivot: ['bar', 'spam', 'column4'],
        unpivot_column_name: '<%= foo %>',
        value_column_name: '<%= foo %>',
        dropna: true,
      },
    ]);
  });

  it('should leave uppercase steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'uppercase',
        column: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should interpolate uniquegroups steps if needed', () => {
    const pipeline: Pipeline = [
      {
        name: 'uniquegroups',
        on: ['column1', '<%= foo %>'],
      },
    ];

    expect(translate(pipeline)).toEqual([
      {
        name: 'uniquegroups',
        on: ['column1', 'bar'],
      },
    ]);
  });

  it('should interpolate basic rollup steps if needed', () => {
    const pipeline: Pipeline = [
      {
        name: 'rollup',
        hierarchy: ['<%= foo %>', '<%= foo %>'],
        aggregations: [
          {
            newcolumns: ['value1'],
            aggfunction: 'sum',
            columns: ['<%= foo %>'],
          },
        ],
      },
    ];

    expect(translate(pipeline)).toEqual([
      {
        name: 'rollup',
        hierarchy: ['bar', 'bar'],
        aggregations: [
          {
            newcolumns: ['value1'],
            aggfunction: 'sum',
            columns: ['bar'],
          },
        ],
      },
    ]);
  });

  it('should interpolate complex rollup steps if needed', () => {
    const pipeline: Pipeline = [
      {
        name: 'rollup',
        hierarchy: ['<%= foo %>', '<%= foo %>'],
        aggregations: [
          {
            newcolumns: ['value1', 'value2'],
            aggfunction: 'sum',
            columns: ['<%= foo %>', '<%= egg %>'],
          },
        ],
        groupby: ['<%= foo %>'],
        labelCol: '<%= foo %>',
        levelCol: '<%= foo %>',
        parentLabelCol: '<%= foo %>',
      },
    ];

    expect(translate(pipeline)).toEqual([
      {
        name: 'rollup',
        hierarchy: ['bar', 'bar'],
        aggregations: [
          {
            newcolumns: ['value1', 'value2'],
            aggfunction: 'sum',
            columns: ['bar', 'spam'],
          },
        ],
        groupby: ['bar'],
        labelCol: 'bar',
        levelCol: 'bar',
        parentLabelCol: 'bar',
      },
    ]);
  });

  it('should interpolate old fashioned rollup steps if needed', () => {
    const pipeline: Pipeline = [
      {
        name: 'rollup',
        hierarchy: ['<%= foo %>', '<%= foo %>'],
        aggregations: [
          {
            newcolumn: 'value1',
            aggfunction: 'sum',
            column: '<%= foo %>',
            columns: [],
            newcolumns: [],
          },
        ],
      },
    ];

    expect(translate(pipeline)).toEqual([
      {
        name: 'rollup',
        hierarchy: ['bar', 'bar'],
        aggregations: [
          {
            newcolumn: 'value1',
            aggfunction: 'sum',
            column: 'bar',
            columns: [],
            newcolumns: [],
          },
        ],
      },
    ]);
  });

  it('should interpolate uniquegroups steps if needed', () => {
    const pipeline: Pipeline = [
      {
        name: 'evolution',
        dateCol: '<%= foo %>',
        valueCol: '<%= foo %>',
        evolutionType: 'vsLastMonth',
        evolutionFormat: 'abs',
        indexColumns: ['<%= foo %>'],
        newColumn: '<%= foo %>',
      },
    ];

    expect(translate(pipeline)).toEqual([
      {
        name: 'evolution',
        dateCol: 'bar',
        valueCol: 'bar',
        evolutionType: 'vsLastMonth',
        evolutionFormat: 'abs',
        indexColumns: ['bar'],
        newColumn: 'bar',
      },
    ]);
  });

  it('should interpolate cumsum steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'cumsum',
        valueColumn: '<%= foo %>',
        referenceColumn: '<%= foo %>',
        groupby: ['<%= foo %>'],
        newColumn: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'cumsum',
        valueColumn: 'bar',
        referenceColumn: 'bar',
        groupby: ['bar'],
        newColumn: 'bar',
      },
    ]);
  });

  it('should interpolate basic ilfthenelse steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'ifthenelse',
        newColumn: '<%= foo %>',
        if: { and: [{ column: '<%= foo %>', operator: 'eq', value: '<%= age %>' }] },
        then: '<%= foo %>',
        else: '<%= age %>',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'ifthenelse',
        newColumn: '<%= foo %>',
        if: { and: [{ column: 'bar', operator: 'eq', value: 42 }] },
        then: 'bar',
        else: 42,
      },
    ]);
  });

  it('should interpolate nested ilfthenelse steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'ifthenelse',
        newColumn: '<%= foo %>',
        if: { and: [{ column: '<%= foo %>', operator: 'eq', value: '<%= age %>' }] },
        then: '<%= foo %>',
        else: {
          if: { and: [{ column: '<%= foo %>', operator: 'eq', value: '<%= age %>' }] },
          then: '<%= foo %>',
          else: '<%= age %>',
        },
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'ifthenelse',
        newColumn: '<%= foo %>',
        if: { and: [{ column: 'bar', operator: 'eq', value: 42 }] },
        then: 'bar',
        else: {
          if: { and: [{ column: 'bar', operator: 'eq', value: 42 }] },
          then: 'bar',
          else: 42,
        },
      },
    ]);
  });

  it('should interpolate rank steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'rank',
        valueCol: '<%= foo %>',
        order: 'desc',
        method: 'dense',
        groupby: ['<%= foo %>'],
        newColumnName: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'rank',
        valueCol: 'bar',
        order: 'desc',
        method: 'dense',
        groupby: ['bar'],
        newColumnName: 'bar',
      },
    ]);
  });

  it('should interpolate waterfall steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'waterfall',
        valueColumn: '<%= foo %>',
        milestonesColumn: '<%= foo %>',
        start: '<%= foo %>',
        end: '<%= foo %>',
        labelsColumn: '<%= foo %>',
        parentsColumn: '<%= foo %>',
        groupby: ['<%= foo %>'],
        sortBy: 'value',
        order: 'desc',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'waterfall',
        valueColumn: 'bar',
        milestonesColumn: 'bar',
        start: 'bar',
        end: 'bar',
        labelsColumn: 'bar',
        parentsColumn: 'bar',
        groupby: ['bar'],
        sortBy: 'value',
        order: 'desc',
      },
    ]);
  });

  it('should interpolate totals steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'totals',
        totalDimensions: [
          { totalColumn: '<%= foo %>', totalRowsLabel: '<%= egg %>' },
          { totalColumn: '<%= foo %>', totalRowsLabel: '<%= egg %>' },
        ],
        aggregations: [
          {
            columns: ['<%= foo %>', '<%= egg %>'],
            newcolumns: ['<%= foo %>', '<%= egg %>'],
            aggfunction: 'sum',
          },
          {
            columns: ['<%= foo %>', '<%= egg %>'],
            newcolumns: ['<%= foo %>', '<%= egg %>'],
            aggfunction: 'avg',
          },
        ],
        groups: ['<%= foo %>', '<%= egg %>'],
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'totals',
        totalDimensions: [
          { totalColumn: '<%= foo %>', totalRowsLabel: '<%= egg %>' },
          { totalColumn: '<%= foo %>', totalRowsLabel: '<%= egg %>' },
        ],
        aggregations: [
          {
            columns: ['bar', 'spam'],
            newcolumns: ['<%= foo %>', '<%= egg %>'],
            aggfunction: 'sum',
          },
          {
            columns: ['bar', 'spam'],
            newcolumns: ['<%= foo %>', '<%= egg %>'],
            aggfunction: 'avg',
          },
        ],
        groups: ['bar', 'spam'],
      },
    ]);
  });

  it('should interpolate addmissingdates steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'addmissingdates',
        datesColumn: '<%= foo %>',
        datesGranularity: 'day',
        groups: ['<%= foo %>', '<%= egg %>'],
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'addmissingdates',
        datesColumn: 'bar',
        datesGranularity: 'day',
        groups: ['bar', 'spam'],
      },
    ]);
  });

  it('should interpolate waterfall steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'movingaverage',
        valueColumn: '<%= foo %>',
        columnToSort: '<%= foo %>',
        movingWindow: '<%= age %>',
        groups: ['<%= foo %>', '<%= egg %>'],
        newColumnName: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'movingaverage',
        valueColumn: 'bar',
        columnToSort: 'bar',
        movingWindow: 42,
        groups: ['bar', 'spam'],
        newColumnName: '<%= foo %>',
      },
    ]);
  });

  it('should interpolate duration steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'duration',
        newColumnName: '<%= foo %>',
        startDateColumn: '<%= foo %>',
        endDateColumn: '<%= foo %>',
        durationIn: 'seconds',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'duration',
        newColumnName: '<%= foo %>',
        startDateColumn: 'bar',
        endDateColumn: 'bar',
        durationIn: 'seconds',
      },
    ]);
  });

  it('should interpolate strcmp steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'strcmp',
        newColumnName: '<%= foo %>',
        strCol1: '<%= foo %>',
        strCol2: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'strcmp',
        newColumnName: '<%= foo %>',
        strCol1: 'bar',
        strCol2: 'bar',
      },
    ]);
  });
});
