import * as S from '@/lib/steps';
import { humanReadableLabel as hrl } from '@/lib/labeller';

describe('Labeller', () => {
  it('generates label for single aggregation', () => {
    const step: S.AggregationStep = {
      name: 'aggregate',
      on: ['column1', 'column2'],
      aggregations: [
        {
          aggfunction: 'avg',
          column: 'column3',
          newcolumn: 'averaged3',
        },
      ],
    };
    expect(hrl(step)).toEqual('Average of "column3" grouped by "column1", "column2"');
  });

  it('generates label for multiple aggregations', () => {
    const step: S.AggregationStep = {
      name: 'aggregate',
      on: ['column1', 'column2'],
      aggregations: [
        {
          aggfunction: 'avg',
          column: 'column3',
          newcolumn: 'averaged3',
        },
        {
          aggfunction: 'sum',
          column: 'column4',
          newcolumn: 'sum4',
        },
      ],
    };
    expect(hrl(step)).toEqual('Aggregate "column3", "column4" grouped by "column1", "column2"');
  });

  it('generates label for append steps', () => {
    const step: S.AppendStep = {
      name: 'append',
      pipelines: ['dataset1', 'dataset2'],
    };
    expect(hrl(step)).toEqual('Append "dataset1", "dataset2"');
  });

  it('generates label for argmax steps', () => {
    const step: S.ArgmaxStep = {
      name: 'argmax',
      column: 'column1',
      groups: ['column2', 'column3'],
    };
    expect(hrl(step)).toEqual('Keep row with maximum in column "column1"');
  });

  it('generates label for argmin steps', () => {
    const step: S.ArgminStep = {
      name: 'argmin',
      column: 'column1',
      groups: ['column2', 'column3'],
    };
    expect(hrl(step)).toEqual('Keep row with minimum in column "column1"');
  });

  it('generates label for concatenate steps', () => {
    const step: S.ConcatenateStep = {
      name: 'concatenate',
      columns: ['Foo', 'Bar'],
      separator: '',
      new_column_name: 'whatever',
    };
    expect(hrl(step)).toEqual('Concatenate columns "Foo", "Bar"');
  });

  it('generates label for convert steps', () => {
    const step: S.ConvertStep = {
      name: 'convert',
      columns: ['Foo', 'Bar'],
      data_type: 'integer',
    };
    expect(hrl(step)).toEqual('Convert columns "Foo", "Bar" into integer');
  });

  it('generates label for custom steps', () => {
    const step: S.CustomStep = {
      name: 'custom',
      query: {},
    };
    expect(hrl(step)).toEqual('Custom step');
  });

  it('generates label for domain steps', () => {
    const step: S.DomainStep = {
      name: 'domain',
      domain: 'the-domain',
    };
    expect(hrl(step)).toEqual('Use domain "the-domain"');
  });

  it('generates label for duplicate steps', () => {
    const step: S.DuplicateColumnStep = {
      name: 'duplicate',
      column: 'column1',
      new_column_name: 'column2',
    };
    expect(hrl(step)).toEqual('Duplicate "column1" in "column2"');
  });

  it('generates label for delete steps', () => {
    const step: S.DeleteStep = {
      name: 'delete',
      columns: ['column1', 'column2'],
    };
    expect(hrl(step)).toEqual('Delete columns "column1", "column2"');
  });

  it('generates label for fillna steps', () => {
    const step: S.FillnaStep = {
      name: 'fillna',
      column: 'column1',
      value: '20',
    };
    expect(hrl(step)).toEqual('Replace null values in "column1" with 20');
  });

  it('generates label for simple filter steps / operator "eq"', () => {
    const step: S.FilterStep = {
      name: 'filter',
      condition: {
        column: 'column1',
        value: 42,
        operator: 'eq',
      },
    };
    expect(hrl(step)).toEqual('Keep rows where "column1" = 42');
  });

  it('generates label for simple filter steps / operator "ne"', () => {
    const step: S.FilterStep = {
      name: 'filter',
      condition: {
        column: 'column1',
        value: 42,
        operator: 'ne',
      },
    };
    expect(hrl(step)).toEqual('Keep rows where "column1" ≠ 42');
  });

  it('generates label for simple filter steps / operator "gt"', () => {
    const step: S.FilterStep = {
      name: 'filter',
      condition: {
        column: 'column1',
        value: 42,
        operator: 'gt',
      },
    };
    expect(hrl(step)).toEqual('Keep rows where "column1" > 42');
  });

  it('generates label for simple filter steps / operator "ge"', () => {
    const step: S.FilterStep = {
      name: 'filter',
      condition: {
        column: 'column1',
        value: 42,
        operator: 'ge',
      },
    };
    expect(hrl(step)).toEqual('Keep rows where "column1" ≥ 42');
  });

  it('generates label for simple filter steps / operator "lt"', () => {
    const step: S.FilterStep = {
      name: 'filter',
      condition: {
        column: 'column1',
        value: 42,
        operator: 'lt',
      },
    };
    expect(hrl(step)).toEqual('Keep rows where "column1" < 42');
  });

  it('generates label for simple filter steps / operator "le"', () => {
    const step: S.FilterStep = {
      name: 'filter',
      condition: {
        column: 'column1',
        value: 42,
        operator: 'le',
      },
    };
    expect(hrl(step)).toEqual('Keep rows where "column1" ≤ 42');
  });

  it('generates label for simple filter steps / operator "in"', () => {
    const step: S.FilterStep = {
      name: 'filter',
      condition: {
        column: 'column1',
        value: [4, 2],
        operator: 'in',
      },
    };
    expect(hrl(step)).toEqual('Keep rows where "column1" in (4, 2)');
  });

  it('generates label for simple filter steps / operator "nin"', () => {
    const step: S.FilterStep = {
      name: 'filter',
      condition: {
        column: 'column1',
        value: [4, 2],
        operator: 'nin',
      },
    };
    expect(hrl(step)).toEqual('Keep rows where "column1" not in (4, 2)');
  });

  it('generates label for "and" filter steps', () => {
    const step: S.FilterStep = {
      name: 'filter',
      condition: {
        and: [
          {
            column: 'column1',
            value: 4,
            operator: 'eq',
          },
          {
            column: 'column2',
            value: 2,
            operator: 'eq',
          },
        ],
      },
    };
    expect(hrl(step)).toEqual('Keep rows where "column1" = 4 and "column2" = 2');
  });

  it('generates label for "or" filter steps', () => {
    const step: S.FilterStep = {
      name: 'filter',
      condition: {
        or: [
          {
            column: 'column1',
            value: 4,
            operator: 'eq',
          },
          {
            column: 'column2',
            value: 2,
            operator: 'eq',
          },
        ],
      },
    };
    expect(hrl(step)).toEqual('Keep rows where "column1" = 4 or "column2" = 2');
  });

  it('generates label for formula steps', () => {
    const step: S.FormulaStep = {
      name: 'formula',
      new_column: 'column3',
      formula: 'column1 + column2',
    };
    expect(hrl(step)).toEqual('Compute "column1 + column2" in "column3"');
  });

  it('generates label for fromdate steps', () => {
    const step: S.FromDateStep = {
      name: 'fromdate',
      column: 'foo',
      format: '%Y-%m-%d',
    };
    expect(hrl(step)).toEqual('Convert "foo" into text');
  });

  it('generates label for percentage steps without output column', () => {
    const step: S.PercentageStep = {
      name: 'percentage',
      column: 'column1',
    };
    expect(hrl(step)).toEqual('Compute the row-level percentage of "column1"');
  });

  it('generates label for percentage steps with output column', () => {
    const step: S.PercentageStep = {
      name: 'percentage',
      column: 'column1',
    };
    expect(hrl(step)).toEqual('Compute the row-level percentage of "column1"');
  });

  it('generates label for pivot steps', () => {
    const step: S.PivotStep = {
      name: 'pivot',
      index: ['column1', 'column2'],
      column_to_pivot: 'column3',
      value_column: 'column4',
      agg_function: 'sum',
    };
    expect(hrl(step)).toEqual('Pivot column "column3"');
  });

  it('generates label for rename steps', () => {
    const step: S.RenameStep = {
      name: 'rename',
      oldname: 'column1',
      newname: 'column2',
    };
    expect(hrl(step)).toEqual('Rename column "column1" to "column2"');
  });

  it('generates precise label for simple replace steps', () => {
    const step: S.ReplaceStep = {
      name: 'replace',
      search_column: 'column1',
      to_replace: [[4, 2]],
    };
    expect(hrl(step)).toEqual('Replace 4 with 2 in column "column1"');
  });

  it('generates label for multi-replace steps', () => {
    const step: S.ReplaceStep = {
      name: 'replace',
      search_column: 'column1',
      to_replace: [
        [4, 2],
        [5, 3],
      ],
    };
    expect(hrl(step)).toEqual('Replace values in column "column1"');
  });

  it('generates label for select steps', () => {
    const step: S.SelectStep = {
      name: 'select',
      columns: ['column1', 'column2'],
    };
    expect(hrl(step)).toEqual('Keep columns "column1", "column2"');
  });

  it('generates label for sort steps', () => {
    const step: S.SortStep = {
      name: 'sort',
      columns: [
        { column: 'column1', order: 'asc' },
        { column: 'column2', order: 'desc' },
      ],
    };
    expect(hrl(step)).toEqual('Sort columns "column1", "column2"');
  });

  it('generates label for split steps', () => {
    const step: S.SplitStep = {
      name: 'split',
      column: 'foo',
      delimiter: '-',
      number_cols_to_keep: 3,
    };
    expect(hrl(step)).toEqual('Split column "foo"');
  });

  it('generates label for lowercase steps', () => {
    const step: S.ToLowerStep = {
      name: 'lowercase',
      column: 'test',
    };
    expect(hrl(step)).toEqual('Convert column "test" to lowercase');
  });

  it('generates label for substring steps', () => {
    const step: S.SubstringStep = {
      name: 'substring',
      column: 'foo',
      start_index: 0,
      end_index: -1,
    };
    expect(hrl(step)).toEqual('Extract substring from "foo"');
  });

  it('generates label for todate steps', () => {
    const step: S.ToDateStep = {
      name: 'todate',
      column: 'foo',
    };
    expect(hrl(step)).toEqual('Convert "foo" into date');
  });

  it('generates label for top steps', () => {
    const step: S.TopStep = {
      name: 'top',
      rank_on: 'column1',
      sort: 'asc',
      limit: 42,
    };
    expect(hrl(step)).toEqual('Keep top 42 values in column "column1"');
  });

  it('generates label for uppercase steps', () => {
    const step: S.ToUpperStep = {
      name: 'uppercase',
      column: 'test',
    };
    expect(hrl(step)).toEqual('Convert column "test" to uppercase');
  });

  it('generates label for unpivot steps', () => {
    const step: S.UnpivotStep = {
      name: 'unpivot',
      keep: ['column1', 'column2'],
      unpivot: ['column3', 'column4'],
      unpivot_column_name: 'column5',
      value_column_name: 'column6',
      dropna: true,
    };
    expect(hrl(step)).toEqual('Unpivot columns "column3", "column4"');
  });
});
