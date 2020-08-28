/**
 * This module handles template interpolation.
 */

import _ from 'lodash';

import { ColumnTypeMapping, DataSetColumnType } from '@/lib/dataset';
import { castFromString } from '@/lib/helpers';
import { StepMatcher } from '@/lib/matcher';
import * as S from '@/lib/steps';

export type ScopeContext = {
  [varname: string]: any;
};

export type InterpolateFunction = (template: string, context: ScopeContext) => any;
type StepInterpolator = (step: S.PipelineStep) => S.PipelineStep;
type ConditionType = S.FilterSimpleCondition | S.FilterComboAnd | S.FilterComboOr;

/**
 * Interpolate and cast interpolated value if needed.
 *
 * @param interpolate the actual interpolate function
 * @param value the value to be interpolated
 * @param context the bag of variables
 * @param columnType if specified, the expected output type
 */
function _interpolate(
  interpolate: InterpolateFunction,
  value: any,
  context: ScopeContext,
  columnType?: DataSetColumnType,
) {
  if (typeof value === 'string') {
    let interpolated = interpolate(value, context);
    if (columnType) {
      interpolated = castFromString(interpolated, columnType);
    }
    return interpolated;
  }
  return value;
}

function interpolateFilterCondition(
  condition: ConditionType,
  interpolate: InterpolateFunction,
  context: ScopeContext,
  columnTypes?: ColumnTypeMapping,
): ConditionType {
  if (S.isFilterComboAnd(condition)) {
    return {
      and: condition.and.map(cond =>
        interpolateFilterCondition(cond, interpolate, context, columnTypes),
      ),
    };
  } else if (S.isFilterComboOr(condition)) {
    return {
      or: condition.or.map(cond =>
        interpolateFilterCondition(cond, interpolate, context, columnTypes),
      ),
    };
  } else {
    const columnType = columnTypes === undefined ? undefined : columnTypes[condition.column];
    switch (condition.operator) {
      case 'eq':
      case 'ne':
      case 'gt':
      case 'ge':
      case 'lt':
      case 'le':
        return {
          ...condition,
          value: _interpolate(interpolate, condition.value, context, columnType),
        };
      case 'in':
      case 'nin':
        return {
          ...condition,
          value: condition.value.map(v => _interpolate(interpolate, v, context, columnType)),
        };
      case 'isnull':
      case 'notnull':
      default:
        // only for typescript to be happy and see we always have a return value
        return condition;
    }
  }
}

function interpolateIfThenElse(
  ifthenelse: Readonly<Omit<S.IfThenElseStep, 'name' | 'newColumn'>>,
  interpolateFunc: InterpolateFunction,
  context: ScopeContext,
  columnTypes?: ColumnTypeMapping,
): Omit<S.IfThenElseStep, 'name' | 'newColumn'> {
  const ret = {
    if: interpolateFilterCondition(ifthenelse.if, interpolateFunc, context, columnTypes),
    then: _interpolate(interpolateFunc, ifthenelse.then, context),
  };
  if (typeof ifthenelse.else === 'string') {
    return {
      ...ret,
      else: _interpolate(interpolateFunc, ifthenelse.else, context),
    };
  }
  return {
    ...ret,
    else: interpolateIfThenElse(ifthenelse.else, interpolateFunc, context, columnTypes),
  };
}

/**
 * The `PipelineInterpolator` class provides a "step interpolator"
 * implementation for each possible step in a pipeline.
 *
 * A step interpolator is a function that takes a step in parameter and returns
 * the "interpolated" version of a step, given a specific interpolate function
 * (e.g. `_.template`).
 */
export class PipelineInterpolator implements StepMatcher<S.PipelineStep> {
  context: ScopeContext;
  /**
   * known column types: will be used to automatically cast interpolated values
   * if column type matches.
   */
  columnTypes: ColumnTypeMapping;
  interpolateFunc: InterpolateFunction;

  constructor(
    interpolateFunc: InterpolateFunction,
    context: ScopeContext,
    columnTypes: ColumnTypeMapping = {},
  ) {
    this.interpolateFunc = interpolateFunc;
    this.context = context;
    this.columnTypes = columnTypes;
  }

  append(step: Readonly<S.AppendStep>) {
    return { ...step };
  }

  aggregate(step: Readonly<S.AggregationStep>) {
    const aggregations = step.aggregations.map(aggfunc => ({
      ...aggfunc,
      column: _interpolate(this.interpolateFunc, aggfunc.column, this.context),
    }));
    return {
      name: step.name,
      on: step.on.map(col => _interpolate(this.interpolateFunc, col, this.context)),
      aggregations,
      keepOriginalGranularity: step.keepOriginalGranularity,
    };
  }

  argmax(step: Readonly<S.ArgmaxStep>) {
    return { ...step };
  }

  argmin(step: Readonly<S.ArgminStep>) {
    return { ...step };
  }

  concatenate(step: Readonly<S.ConcatenateStep>) {
    return { ...step };
  }

  convert(step: Readonly<S.ConvertStep>) {
    return { ...step };
  }

  cumsum(step: Readonly<S.CumSumStep>) {
    return {
      ...step,
      valueColumn: _interpolate(this.interpolateFunc, step.valueColumn, this.context),
      referenceColumn: _interpolate(this.interpolateFunc, step.referenceColumn, this.context),
      groupby: (step.groupby ?? []).map(col =>
        _interpolate(this.interpolateFunc, col, this.context),
      ),
      newColumn: _interpolate(this.interpolateFunc, step.newColumn, this.context),
    };
  }

  custom(step: Readonly<S.CustomStep>) {
    return { ...step, query: _interpolate(this.interpolateFunc, step.query, this.context) };
  }

  dateextract(step: Readonly<S.DateExtractPropertyStep>) {
    return {
      ...step,
      column: _interpolate(this.interpolateFunc, step.column, this.context),
    };
  }

  domain(step: Readonly<S.DomainStep>) {
    return { ...step };
  }

  duplicate(step: Readonly<S.DuplicateColumnStep>) {
    return { ...step };
  }

  delete(step: Readonly<S.DeleteStep>) {
    return { ...step };
  }

  evolution(step: Readonly<S.EvolutionStep>) {
    return {
      ...step,
      dateCol: _interpolate(this.interpolateFunc, step.dateCol, this.context),
      valueCol: _interpolate(this.interpolateFunc, step.valueCol, this.context),
      indexColumns: step.indexColumns.map(col =>
        _interpolate(this.interpolateFunc, col, this.context),
      ),
      newColumn: _interpolate(this.interpolateFunc, step.newColumn, this.context),
    };
  }

  fillna(step: Readonly<S.FillnaStep>) {
    return {
      ...step,
      value: _interpolate(
        this.interpolateFunc,
        step.value,
        this.context,
        this.columnTypes[step.column],
      ),
    };
  }

  filter(step: Readonly<S.FilterStep>) {
    return {
      ...step,
      condition: interpolateFilterCondition(
        step.condition,
        this.interpolateFunc,
        this.context,
        this.columnTypes,
      ),
    };
  }

  formula(step: Readonly<S.FormulaStep>) {
    return {
      ...step,
      formula: _interpolate(this.interpolateFunc, step.formula, this.context),
    };
  }

  fromdate(step: Readonly<S.FromDateStep>) {
    return { ...step };
  }

  ifthenelse(step: Readonly<S.IfThenElseStep>) {
    return {
      ...step,
      ...interpolateIfThenElse(
        _.omit(step, ['name', 'newColumn']),
        this.interpolateFunc,
        this.context,
        this.columnTypes,
      ),
    };
  }

  join(step: Readonly<S.JoinStep>) {
    return { ...step };
  }

  lowercase(step: Readonly<S.ToLowerStep>) {
    return { ...step };
  }

  percentage(step: Readonly<S.PercentageStep>) {
    return { ...step };
  }

  pivot(step: Readonly<S.PivotStep>) {
    return { ...step };
  }

  rank(step: Readonly<S.RankStep>) {
    return {
      ...step,
      valueCol: _interpolate(this.interpolateFunc, step.valueCol, this.context),
      groupby: (step.groupby ?? []).map(col =>
        _interpolate(this.interpolateFunc, col, this.context),
      ),
      newColumnName: _interpolate(this.interpolateFunc, step.newColumnName, this.context),
    };
  }

  rename(step: Readonly<S.RenameStep>) {
    return { ...step };
  }

  statistics(step: Readonly<S.StatisticsStep>) {
    return { ...step };
  }

  replace(step: Readonly<S.ReplaceStep>) {
    const coltype = this.columnTypes[step.search_column];
    const toReplace = step.to_replace.map(([oldvalue, newvalue]) => [
      _interpolate(this.interpolateFunc, oldvalue, this.context, coltype),
      _interpolate(this.interpolateFunc, newvalue, this.context, coltype),
    ]);
    return { ...step, to_replace: toReplace };
  }

  rollup(step: Readonly<S.RollupStep>) {
    const ret: S.RollupStep = { ...step };
    ret.hierarchy = step.hierarchy.map(col =>
      _interpolate(this.interpolateFunc, col, this.context),
    );
    ret.aggregations = step.aggregations.map(aggfunc => ({
      ...aggfunc,
      column: _interpolate(this.interpolateFunc, aggfunc.column, this.context),
    }));
    if (step.groupby) {
      ret.groupby = step.groupby.map(col => _interpolate(this.interpolateFunc, col, this.context));
    }
    if (step.labelCol) {
      ret.labelCol = _interpolate(this.interpolateFunc, step.labelCol, this.context);
    }
    if (step.parentLabelCol) {
      ret.parentLabelCol = _interpolate(this.interpolateFunc, step.parentLabelCol, this.context);
    }
    if (step.levelCol) {
      ret.levelCol = _interpolate(this.interpolateFunc, step.levelCol, this.context);
    }
    return ret;
  }

  select(step: Readonly<S.SelectStep>) {
    return { ...step };
  }

  sort(step: Readonly<S.SortStep>) {
    return { ...step };
  }

  split(step: Readonly<S.SplitStep>) {
    return { ...step };
  }

  substring(step: Readonly<S.SubstringStep>) {
    return { ...step };
  }

  text(step: Readonly<S.AddTextColumnStep>) {
    return { ...step, text: _interpolate(this.interpolateFunc, step.text, this.context) };
  }

  todate(step: Readonly<S.ToDateStep>) {
    return { ...step };
  }

  top(step: Readonly<S.TopStep>) {
    return {
      ...step,
      limit: Number(_interpolate(this.interpolateFunc, step.limit, this.context)),
    };
  }

  uniquegroups(step: Readonly<S.UniqueGroupsStep>) {
    return {
      name: step.name,
      on: step.on.map(col => _interpolate(this.interpolateFunc, col, this.context)),
    };
  }

  unpivot(step: Readonly<S.UnpivotStep>) {
    return { ...step };
  }

  uppercase(step: Readonly<S.ToUpperStep>) {
    return { ...step };
  }

  waterfall(step: Readonly<S.WaterfallStep>) {
    return {
      ...step,
      valueColumn: _interpolate(this.interpolateFunc, step.valueColumn, this.context),
      milestonesColumn: _interpolate(this.interpolateFunc, step.milestonesColumn, this.context),
      groupby: (step.groupby ?? []).map(col =>
        _interpolate(this.interpolateFunc, col, this.context),
      ),
      start: _interpolate(this.interpolateFunc, step.start, this.context),
      end: _interpolate(this.interpolateFunc, step.end, this.context),
      labelsColumn: _interpolate(this.interpolateFunc, step.labelsColumn, this.context),
      parentsColumn: _interpolate(this.interpolateFunc, step.parentsColumn, this.context),
    };
  }

  interpolate(pipeline: S.Pipeline): S.Pipeline {
    return pipeline.map(this.interpolateStep.bind(this));
  }

  interpolateStep(step: S.PipelineStep): S.PipelineStep {
    const callback = this[step.name] as StepInterpolator;
    return callback.bind(this)(step);
  }
}
