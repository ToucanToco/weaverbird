import { humanReadableLabel as hrl, labelWithReadeableVariables as lwv } from '@/lib/labeller';
import * as S from '@/lib/steps';
import { VariableDelimiters } from '@/lib/variables';

describe('Labeller', () => {
  it('generates label for single aggregation', () => {
    const step: S.AggregateStep = {
      name: 'aggregate',
      on: ['column1', 'column2'],
      aggregations: [
        {
          aggfunction: 'avg',
          columns: ['column3'],
          newcolumns: ['averaged3'],
        },
      ],
      keepOriginalGranularity: false,
    };
    expect(hrl(step)).toEqual('Average of "column3" grouped by "column1", "column2"');
  });

  it('generates label for multiple aggregations', () => {
    const step: S.AggregateStep = {
      name: 'aggregate',
      on: ['column1', 'column2'],
      aggregations: [
        {
          aggfunction: 'avg',
          columns: ['column3', 'column4'],
          newcolumns: ['averaged3', 'averaged4'],
        },
        {
          aggfunction: 'sum',
          columns: ['column3', 'column4'],
          newcolumns: ['sum3', 'sum4'],
        },
      ],
      keepOriginalGranularity: false,
    };
    expect(hrl(step)).toEqual('Aggregate "column3", "column4" grouped by "column1", "column2"');
  });

  it('generates label for old fashioned aggregation', () => {
    // Test for retrocompatibility purposes
    const step: S.AggregateStep = {
      name: 'aggregate',
      on: ['column1', 'column2'],
      aggregations: [
        {
          aggfunction: 'avg',
          column: 'column3',
          newcolumn: 'averaged3',
          columns: [],
          newcolumns: [],
        },
      ],
      keepOriginalGranularity: false,
    };
    expect(hrl(step)).toEqual('Average of "column3" grouped by "column1", "column2"');
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
      query: '{}',
    };
    expect(hrl(step)).toEqual('Custom step');
  });

  it('generates label for date extraction steps', () => {
    const step: S.DateExtractPropertyStep = {
      name: 'dateextract',
      operation: 'year',
      column: 'foo',
    };
    expect(hrl(step)).toEqual('Extract year from "foo"');
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
      columns: ['column1', 'column2'],
      value: '20',
    };
    expect(hrl(step)).toEqual('Replace null values in "column1", "column2" with 20');
  });

  it('generates label for fillna steps old-fashioned', () => {
    // Test for retrocompatibility
    const step: S.FillnaStep = {
      name: 'fillna',
      column: 'column1',
      value: '20',
      columns: [],
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

  it('generates label for simple filter steps / operator "matches"', () => {
    const step: S.FilterStep = {
      name: 'filter',
      condition: {
        column: 'column1',
        value: '[a-z]+',
        operator: 'matches',
      },
    };
    expect(hrl(step)).toEqual('Keep rows where "column1" matches regex "[a-z]+"');
  });

  it('generates label for simple filter steps / operator "notmatches"', () => {
    const step: S.FilterStep = {
      name: 'filter',
      condition: {
        column: 'column1',
        value: '[a-z]+',
        operator: 'notmatches',
      },
    };
    expect(hrl(step)).toEqual('Keep rows where "column1" doesn\'t match regex "[a-z]+"');
  });

  it('generates label for simple filter steps / operator "isnull"', () => {
    const step: S.FilterStep = {
      name: 'filter',
      condition: {
        column: 'column1',
        value: null,
        operator: 'isnull',
      },
    };
    expect(hrl(step)).toEqual('Keep rows where "column1" is null');
  });

  it('generates label for simple filter steps / operator "notnull"', () => {
    const step: S.FilterStep = {
      name: 'filter',
      condition: {
        column: 'column1',
        value: null,
        operator: 'notnull',
      },
    };
    expect(hrl(step)).toEqual('Keep rows where "column1" is not null');
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
      format: 'custom',
    };
    expect(hrl(step)).toEqual('Convert "foo" into text');
  });

  it('generates label for join steps', () => {
    const step: S.JoinStep = {
      name: 'join',
      right_pipeline: 'right',
      type: 'left',
      on: [['col', 'col']],
    };
    expect(hrl(step)).toEqual('Join dataset "right"');
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

  // Test for retrocompatibility with old configurations
  it('generates label for rename steps old fashion', () => {
    const step: S.RenameStep = {
      name: 'rename',
      oldname: 'column1',
      newname: 'column2',
      toRename: [],
    };
    expect(hrl(step)).toEqual('Rename column "column1" to "column2"');
  });

  it('generates label for rename steps new fashion, with 1 column to be renamed', () => {
    const step: S.RenameStep = {
      name: 'rename',
      toRename: [['column1', 'column2']],
    };
    expect(hrl(step)).toEqual('Rename column "column1" to "column2"');
  });

  it('generates label for rename steps new fashion, with multiple columns to be renamed', () => {
    const step: S.RenameStep = {
      name: 'rename',
      toRename: [
        ['column1', 'column2'],
        ['foo', 'bar'],
      ],
    };
    expect(hrl(step)).toEqual('Rename columns "column1", "foo"');
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

  it('generates label for statistics steps', () => {
    const step: S.StatisticsStep = {
      name: 'statistics',
      column: 'foo',
      groupbyColumns: [],
      statistics: ['average'],
      quantiles: [],
    };
    expect(hrl(step)).toEqual(`Compute statistics of "foo"`);
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

  it('generates label for text steps', () => {
    const step: S.AddTextColumnStep = {
      name: 'text',
      text: 'Hello',
      new_column: 'test',
    };
    expect(hrl(step)).toEqual('Add text column "test"');
  });

  it('generates label for todate steps', () => {
    const step: S.ToDateStep = {
      name: 'todate',
      column: 'foo',
      format: '%Y-%m-%d',
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

  it('generates label for uniquegroups steps', () => {
    const step: S.UniqueGroupsStep = {
      name: 'uniquegroups',
      on: ['column1', 'column2'],
    };
    expect(hrl(step)).toEqual('Get unique groups/values in columns "column1", "column2"');
  });

  it('generates label for rollup steps', () => {
    const step: S.RollupStep = {
      name: 'rollup',
      hierarchy: ['city', 'country', 'continent'],
      aggregations: [
        {
          newcolumns: ['value1'],
          aggfunction: 'sum',
          columns: ['value1'],
        },
      ],
    };
    expect(hrl(step)).toEqual('Roll-up hierarchy ["city", "country", "continent"]');
  });

  it('generates label for cumsum steps', () => {
    const step: S.CumSumStep = {
      name: 'cumsum',
      valueColumn: 'VALUE',
      referenceColumn: 'DATE',
      groupby: ['COUNTRY', 'PRODUCT'],
      newColumn: 'MY_NEW_COLUMN',
    };
    expect(hrl(step)).toEqual('Compute cumulated sum of "VALUE"');
  });

  it('generates label for evolution steps', () => {
    const step: S.EvolutionStep = {
      name: 'evolution',
      dateCol: 'DATE',
      valueCol: 'VALUE',
      evolutionType: 'vsLastMonth',
      evolutionFormat: 'abs',
      indexColumns: [],
    };
    expect(hrl(step)).toEqual('Compute evolution of column "VALUE"');
  });

  it('generates label for ifthenelse steps', () => {
    const step: S.IfThenElseStep = {
      name: 'ifthenelse',
      newColumn: 'NEW_COL',
      if: { and: [{ column: 'TEST_COL', operator: 'eq', value: 'TEST_VALUE' }] },
      then: '"True"',
      else: '"False"',
    };
    expect(hrl(step)).toEqual('Add conditional column "NEW_COL"');
  });

  it('generates label for rank steps', () => {
    const step: S.RankStep = {
      name: 'rank',
      valueCol: 'VALUE',
      order: 'desc',
      method: 'dense',
      groupby: ['COUNTRY', 'DATE'],
      newColumnName: 'RANK',
    };
    expect(hrl(step)).toEqual('Compute rank of column "VALUE"');
  });

  it('generates label for waterfall steps', () => {
    const step: S.WaterfallStep = {
      name: 'waterfall',
      valueColumn: 'value',
      milestonesColumn: 'date',
      start: '2019',
      end: '2020',
      labelsColumn: 'child',
      parentsColumn: 'parent',
      groupby: ['foo', 'bar'],
      sortBy: 'value',
      order: 'desc',
    };
    expect(hrl(step)).toEqual('Compute waterfall of "value" from "2019" to "2020"');
  });

  it('generates label for totals steps', () => {
    const step: S.AddTotalRowsStep = {
      name: 'totals',
      totalDimensions: [
        { totalColumn: 'COUNTRY', totalRowsLabel: 'All countries' },
        { totalColumn: 'PRODUCT', totalRowsLabel: 'All products' },
      ],
      aggregations: [{ columns: ['VALUE'], newcolumns: ['VALUE'], aggfunction: 'sum' }],
      groups: ['DATE'],
    };
    expect(hrl(step)).toEqual('Add total rows in columns "COUNTRY", "PRODUCT"');
  });

  it('generates label for addmissingdates steps', () => {
    const step: S.AddMissingDatesStep = {
      name: 'addmissingdates',
      datesColumn: 'DATE',
      datesGranularity: 'day',
      groups: ['COUNTRY'],
    };
    expect(hrl(step)).toEqual('Add missing dates in "DATE"');
  });

  it('generates label for movingaverage steps', () => {
    const step: S.MovingAverageStep = {
      name: 'movingaverage',
      valueColumn: 'VALUE',
      columnToSort: 'DATE',
      movingWindow: 12,
      groups: ['COUNTRY', 'PRODUCT'],
      newColumnName: 'MOVING_AVERAGE',
    };
    expect(hrl(step)).toEqual('Compute moving average of "VALUE"');
  });

  it('generates label for duration steps', () => {
    const step: S.ComputeDurationStep = {
      name: 'duration',
      newColumnName: 'NEW',
      startDateColumn: 'START',
      endDateColumn: 'END',
      durationIn: 'seconds',
    };
    expect(hrl(step)).toEqual('Compute duration between "START" and "END"');
  });

  it('generates label for strcmp steps', () => {
    const step: S.CompareTextStep = {
      name: 'strcmp',
      newColumnName: 'NEW',
      strCol1: 'C1',
      strCol2: 'C2',
    };
    expect(hrl(step)).toEqual('Compare string columns "C1" and "C2"');
  });

  describe('labelWithReadeableVariables', () => {
    const variableDelimiters: VariableDelimiters = { start: '{{ ', end: ' }}' };
    const replaceDelimiters: VariableDelimiters = { start: '<em>', end: '</em>' };
    const label = 'Replace column {{ date.year }} with 9';

    it('generates label where variable delimiters are replaced with selected ones', () => {
      expect(lwv(label, variableDelimiters, replaceDelimiters)).toEqual(
        'Replace column <em>date.year</em> with 9',
      );
    });

    it('generates keep label unchanged when there is no variableDelimiters', () => {
      expect(lwv(label, null, replaceDelimiters)).toEqual('Replace column {{ date.year }} with 9');
    });

    it('should keep label unchanged when there is no replaceDelimiters', () => {
      expect(lwv(label, variableDelimiters, null)).toEqual('Replace column {{ date.year }} with 9');
    });

    it('should return empty label if there is no label', () => {
      expect(lwv(null, variableDelimiters, replaceDelimiters)).toEqual('');
    });
  });
});
