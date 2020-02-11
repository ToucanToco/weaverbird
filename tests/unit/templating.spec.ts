import _ from 'lodash';

import { ColumnTypeMapping } from '@/lib/dataset';
import { Pipeline } from '@/lib/steps';
import { PipelineInterpolator, ScopeContext } from '@/lib/templating';

function interpolate(value: string, context: ScopeContext) {
  const compiled = _.template(value);
  return compiled(context);
}

describe('Pipeline interpolator', () => {
  const defaultContext: ScopeContext = {
    foo: 'bar',
    egg: 'spam',
    age: 42,
  };

  function translate(
    pipeline: Pipeline,
    context = defaultContext,
    columnTypes?: ColumnTypeMapping,
  ) {
    const pipelineInterpolator = new PipelineInterpolator(interpolate, context, columnTypes);
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
            column: 'spam',
            newcolumn: '<%= egg %>',
          },
        ],
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
            column: '<%= foo %>',
            newcolumn: '<%= egg %>',
          },
          {
            aggfunction: 'sum',
            column: '<%= foo %>',
            newcolumn: '<%= egg %>',
          },
        ],
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
          },
          {
            aggfunction: 'sum',
            column: 'bar',
            newcolumn: '<%= egg %>',
          },
        ],
      },
    ]);
  });

  it('should leave append steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'append',
        pipelines: ['<%= dataset1 %>', 'dataset2'],
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should leave argmax steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'argmax',
        column: '<%= foo %>',
        groups: ['<%= egg %>', 'column3'],
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should leave argmin steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'argmin',
        column: '<%= foo %>',
        groups: ['<%= egg %>', 'column3'],
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should leave concatenate steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'concatenate',
        columns: ['<%= foo %>', '<%= bar %>'],
        separator: '',
        new_column_name: 'new',
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
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

  it('should leave custom steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'custom',
        query: '{}',
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
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
        new_column: '<%= foo %>',
      },
    ]);
  });

  it('should leave todate steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should leave fromdate steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'fromdate',
        column: '<%= foo %>',
        format: '<%= bar %>',
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
        column: '<%= foo %>',
        value: '<%= age %>',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'fillna',
        column: '<%= foo %>',
        value: '42',
      },
    ]);
  });

  it('should interpolate and cast fillna steps if required', () => {
    const pipeline: Pipeline = [
      {
        name: 'fillna',
        column: 'column1',
        value: '<%= age %>',
      },
    ];
    expect(
      translate(pipeline, defaultContext, {
        column1: 'integer',
      }),
    ).toEqual([
      {
        name: 'fillna',
        column: 'column1',
        value: 42,
      },
    ]);
  });

  it('should leave fillna steps if no variable is found', () => {
    const pipeline: Pipeline = [
      {
        name: 'fillna',
        column: '<%= foo %>',
        value: 'hola',
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'fillna',
        column: '<%= foo %>',
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
          column: '<%= foo %>',
          value: '42',
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
    expect(translate(step, defaultContext, { foo: 'integer' })).toEqual([
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
          column: '<%= foo %>',
          value: '42',
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
          column: '<%= foo %>',
          value: '42',
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
          column: '<%= foo %>',
          value: '42',
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
          column: '<%= foo %>',
          value: '42',
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
          column: '<%= foo %>',
          value: '42',
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
          column: '<%= foo %>',
          value: [11, '42', 'spam', 'hola'],
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
          column: '<%= foo %>',
          value: [11, '42', 'spam', 'hola'],
          operator: 'nin',
        },
      },
    ]);
  });

  it('should not interpolate simple filter steps / operator "isnull"', () => {
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
          column: '<%= foo %>',
          value: '<%= age %>',
          operator: 'isnull',
        },
      },
    ]);
  });

  it('should not interpolate simple filter steps / operator "notnull"', () => {
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
          column: '<%= foo %>',
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
              column: '<%= foo %>',
              value: [11, '42', 'spam', 'hola'],
              operator: 'nin',
            },
            {
              column: '<%= foo %>',
              value: 12,
              operator: 'eq',
            },
            {
              column: '<%= foo %>',
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
    expect(
      translate(
        step,
        { ...defaultContext, truth: 'true' },
        { column1: 'integer', column2: 'boolean' },
      ),
    ).toEqual([
      {
        name: 'filter',
        condition: {
          and: [
            {
              column: '<%= foo %>',
              value: [11, '42', 'spam', 'hola'],
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
              column: '<%= foo %>',
              value: [11, '42', 'spam', 'hola'],
              operator: 'nin',
            },
            {
              column: '<%= foo %>',
              value: 12,
              operator: 'eq',
            },
            {
              column: '<%= foo %>',
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
    expect(
      translate(
        step,
        { ...defaultContext, truth: 'true' },
        { column1: 'integer', column2: 'boolean' },
      ),
    ).toEqual([
      {
        name: 'filter',
        condition: {
          or: [
            {
              column: '<%= foo %>',
              value: [11, '42', 'spam', 'hola'],
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

  it('should leave join steps untouched', () => {
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

  it('should leave percentage steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'percentage',
        column: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should leave pivot steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'pivot',
        index: ['column1', 'column2'],
        column_to_pivot: '<%= foo %>',
        value_column: '<%= age %>',
        agg_function: 'sum',
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
  });

  it('should leave rename steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'rename',
        oldname: '<%= age %>',
        newname: '<%= foo %>',
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
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
          ['<%= age %>', '12'],
          ['what?', '<%= age %>'],
        ],
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'replace',
        search_column: '<%= age %>',
        to_replace: [
          ['42', '12'],
          ['what?', '42'],
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
          ['<%= age %>', '12'],
          ['13', '<%= age %>'],
        ],
      },
    ];
    expect(translate(pipeline, defaultContext, { column1: 'integer' })).toEqual([
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

  it('should leave split steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'split',
        column: '<%= foo %>',
        delimiter: '<%= delim %>',
        number_cols_to_keep: 3,
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
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

  it('should leave top steps untouched if no variable is found', () => {
    const pipeline: Pipeline = [
      {
        name: 'top',
        rank_on: '<%= foo %>',
        sort: 'asc',
        limit: 42,
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
      },
    ];
    expect(translate(pipeline)).toEqual([
      {
        name: 'top',
        rank_on: '<%= foo %>',
        sort: 'asc',
        limit: 42,
      },
    ]);
  });

  it('should leave unpivot steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'unpivot',
        keep: ['<%= foo %>', 'column2'],
        unpivot: ['<%= egg %>', 'column4'],
        unpivot_column_name: 'column5',
        value_column_name: 'column6',
        dropna: true,
      },
    ];
    expect(translate(pipeline)).toEqual(pipeline);
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
});
