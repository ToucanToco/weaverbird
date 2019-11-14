import { PipelineDereferencer, PipelinesScopeContext } from '@/lib/dereferencing';
import { Pipeline } from '@/lib/steps';

describe('Pipeline interpolator', () => {
  const defaultPipelines: PipelinesScopeContext = {
    dataset1: [{ name: 'domain', domain: 'domain1' }],
    dataset2: [{ name: 'domain', domain: 'domain2' }],
  };

  function dereference(pipeline: Pipeline, pipelines = defaultPipelines) {
    const pipelineInterpolator = new PipelineDereferencer(pipelines);
    return pipelineInterpolator.dereference(pipeline);
  }

  it('should leave aggregation steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'aggregate',
        on: ['column1', 'column2'],
        aggregations: [
          {
            aggfunction: 'avg',
            column: 'foo',
            newcolumn: 'egg',
          },
        ],
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should dereference pipelines in append steps', () => {
    const pipeline: Pipeline = [
      {
        name: 'append',
        pipelines: ['dataset1', 'dataset2'],
      },
    ];
    const expectedPipeline: Pipeline = [
      {
        name: 'append',
        pipelines: [
          [{ name: 'domain', domain: 'domain1' }],
          [{ name: 'domain', domain: 'domain2' }],
        ],
      },
    ];
    expect(dereference(pipeline)).toEqual(expectedPipeline);
  });

  it('should leave argmax steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'argmax',
        column: 'foo',
        groups: ['egg', 'column3'],
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave argmin steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'argmin',
        column: 'foo',
        groups: ['egg', 'column3'],
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave concatenate steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'concatenate',
        columns: ['foo', 'bar'],
        separator: '',
        new_column_name: 'new',
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave custom steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'custom',
        query: {},
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave todate steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: 'foo',
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave fromdate steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'fromdate',
        column: 'foo',
        format: 'bar',
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave domain steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'domain',
        domain: 'foo',
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave duplicate steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'duplicate',
        column: 'foo',
        new_column_name: 'bar',
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave delete steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'delete',
        columns: ['foo'],
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave fillna steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'fillna',
        column: 'foo',
        value: 'age',
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('interpolates leave filter steps untouched', () => {
    const step: Pipeline = [
      {
        name: 'filter',
        condition: {
          column: 'foo',
          value: 'age',
          operator: 'eq',
        },
      },
    ];
    expect(dereference(step)).toEqual(step);
  });

  it('interpolates leave formula steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'formula',
        new_column: 'column3',
        formula: 'column1 + age',
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave lowercase steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'lowercase',
        column: 'foo',
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave percentage steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'percentage',
        column: 'foo',
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave pivot steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'pivot',
        index: ['column1', 'column2'],
        column_to_pivot: 'foo',
        value_column: 'age',
        agg_function: 'sum',
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave rename steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'rename',
        oldname: 'age',
        newname: 'foo',
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave replace steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'replace',
        search_column: 'age',
        to_replace: [
          [12, 22],
          ['13', '23'],
        ],
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave select steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'select',
        columns: ['age', 'column2'],
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave sort steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'sort',
        columns: [
          { column: 'age', order: 'asc' },
          { column: 'column2', order: 'desc' },
        ],
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave split steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'split',
        column: 'foo',
        delimiter: 'delim',
        number_cols_to_keep: 3,
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave substring steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'substring',
        column: 'column',
        start_index: 1,
        end_index: 1,
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave top steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'top',
        rank_on: 'foo',
        sort: 'asc',
        limit: 42,
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave unpivot steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'unpivot',
        keep: ['foo', 'column2'],
        unpivot: ['egg', 'column4'],
        unpivot_column_name: 'column5',
        value_column_name: 'column6',
        dropna: true,
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });

  it('should leave uppercase steps untouched', () => {
    const pipeline: Pipeline = [
      {
        name: 'uppercase',
        column: 'foo',
      },
    ];
    expect(dereference(pipeline)).toEqual(pipeline);
  });
});
