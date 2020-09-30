/**
 * This module handles template interpolation.
 */

import _ from 'lodash';

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
 */
function _interpolate(interpolate: InterpolateFunction, value: any, context: ScopeContext) {
  if (typeof value === 'string') {
    const interpolated = interpolate(value, context);
    return interpolated;
  }
  return value;
}

function interpolateFilterCondition(
  condition: ConditionType,
  interpolate: InterpolateFunction,
  context: ScopeContext,
): ConditionType {
  if (S.isFilterComboAnd(condition)) {
    return {
      and: condition.and.map(cond => interpolateFilterCondition(cond, interpolate, context)),
    };
  } else if (S.isFilterComboOr(condition)) {
    return {
      or: condition.or.map(cond => interpolateFilterCondition(cond, interpolate, context)),
    };
  } else {
    switch (condition.operator) {
      case 'eq':
      case 'ne':
      case 'gt':
      case 'ge':
      case 'lt':
      case 'le':
        return {
          ...condition,
          column: _interpolate(interpolate, condition.column, context),
          value: _interpolate(interpolate, condition.value, context),
        };
      case 'in':
      case 'nin':
        return {
          ...condition,
          column: _interpolate(interpolate, condition.column, context),
          value: condition.value.map(v => _interpolate(interpolate, v, context)),
        };
      case 'isnull':
      case 'notnull':
        return {
          ...condition,
          column: _interpolate(interpolate, condition.column, context),
        };
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
): Omit<S.IfThenElseStep, 'name' | 'newColumn'> {
  const ret = {
    if: interpolateFilterCondition(ifthenelse.if, interpolateFunc, context),
    then: _interpolate(interpolateFunc, ifthenelse.then, context),
  };
  if (typeof ifthenelse.else === 'object') {
    return {
      ...ret,
      else: interpolateIfThenElse(ifthenelse.else, interpolateFunc, context),
    };
  }
  return {
    ...ret,
    else: _interpolate(interpolateFunc, ifthenelse.else, context),
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
  interpolateFunc: InterpolateFunction;

  constructor(interpolateFunc: InterpolateFunction, context: ScopeContext) {
    this.interpolateFunc = interpolateFunc;
    this.context = context;
  }

  append(step: Readonly<S.AppendStep>) {
    return { ...step };
  }

  aggregate(step: Readonly<S.AggregationStep>) {
    const aggregations = [];
    for (const agg of step.aggregations) {
      if (agg.column) {
        // For retrocompatibility purposes
        aggregations.push({
          ...agg,
          column: _interpolate(this.interpolateFunc, agg.column, this.context),
        });
      } else {
        aggregations.push({
          ...agg,
          columns: agg.columns.map(c => _interpolate(this.interpolateFunc, c, this.context)),
        });
      }
    }
    return {
      name: step.name,
      on: step.on.map(col => _interpolate(this.interpolateFunc, col, this.context)),
      aggregations,
      keepOriginalGranularity: step.keepOriginalGranularity,
    };
  }

  argmax(step: Readonly<S.ArgmaxStep>) {
    const groups = step.groups
      ? step.groups.map(col => _interpolate(this.interpolateFunc, col, this.context))
      : undefined;
    return {
      ...step,
      column: _interpolate(this.interpolateFunc, step.column, this.context),
      groups,
    };
  }

  argmin(step: Readonly<S.ArgminStep>) {
    const groups = step.groups
      ? step.groups.map(col => _interpolate(this.interpolateFunc, col, this.context))
      : undefined;
    return {
      ...step,
      column: _interpolate(this.interpolateFunc, step.column, this.context),
      groups,
    };
  }

  concatenate(step: Readonly<S.ConcatenateStep>) {
    return {
      ...step,
      columns: step.columns.map(col => _interpolate(this.interpolateFunc, col, this.context)),
    };
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
      value: _interpolate(this.interpolateFunc, step.value, this.context),
    };
  }

  filter(step: Readonly<S.FilterStep>) {
    return {
      ...step,
      condition: interpolateFilterCondition(step.condition, this.interpolateFunc, this.context),
    };
  }

  formula(step: Readonly<S.FormulaStep>) {
    return {
      ...step,
      formula: String(_interpolate(this.interpolateFunc, step.formula, this.context)),
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
    const toReplace = step.to_replace.map(([oldvalue, newvalue]) => [
      _interpolate(this.interpolateFunc, oldvalue, this.context),
      _interpolate(this.interpolateFunc, newvalue, this.context),
    ]);
    return { ...step, to_replace: toReplace };
  }

  rollup(step: Readonly<S.RollupStep>) {
    const ret: S.RollupStep = { ...step };
    const aggregations = [];
    ret.hierarchy = step.hierarchy.map(col =>
      _interpolate(this.interpolateFunc, col, this.context),
    );
    for (const agg of step.aggregations) {
      if (agg.column) {
        // For retrocompatibility purposes
        aggregations.push({
          ...agg,
          column: _interpolate(this.interpolateFunc, agg.column, this.context),
        });
      } else {
        aggregations.push({
          ...agg,
          columns: agg.columns.map(c => _interpolate(this.interpolateFunc, c, this.context)),
        });
      }
    }
    ret.aggregations = aggregations;
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
    return { ...step, column: _interpolate(this.interpolateFunc, step.column, this.context) };
  }

  substring(step: Readonly<S.SubstringStep>) {
    return { ...step };
  }

  text(step: Readonly<S.AddTextColumnStep>) {
    return {
      ...step,
      text: _interpolate(this.interpolateFunc, step.text, this.context),
      new_column: _interpolate(this.interpolateFunc, step.new_column, this.context),
    };
  }

  todate(step: Readonly<S.ToDateStep>) {
    return { ...step };
  }

  top(step: Readonly<S.TopStep>) {
    const groups = step.groups
      ? step.groups.map(col => _interpolate(this.interpolateFunc, col, this.context))
      : undefined;
    return {
      ...step,
      limit: Number(_interpolate(this.interpolateFunc, step.limit, this.context)),
      rank_on: _interpolate(this.interpolateFunc, step.rank_on, this.context),
      groups,
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

const aloneVarsRegExp = new RegExp('^' + (_.templateSettings.interpolate as RegExp).source + '$');

/**
 * A simple interpolate function, provided as an example.
 *
 * It's based on lodash templates (which looks like embedded Ruby, but executes JavaScript),
 * with an important twist: if a variable is provided "alone", i.e. with no surrounding
 * characters, then it returns the variable value untouched and not coerced to a string.
 *
 * Examples:
 * - `exampleInterpolateFunc('<%= count %>', { count: 42 })` returns `42`
 * - `exampleInterpolateFunc('<%= 2 > 1 %>', {})` returns `true`
 * - `exampleInterpolateFunc('There is <%= count %> bananas', { count: 42 })` returns `'There is 42 bananas'`
 */
export const exampleInterpolateFunc: InterpolateFunction = function(
  value: string,
  context: ScopeContext,
) {
  if (typeof value === 'string' && value.match(aloneVarsRegExp)) {
    return Function(
      'context',
      `with(context) { return ${(value.match(aloneVarsRegExp) as string[])[1]} }`,
    )(context);
  } else {
    return _.template(value)(context);
  }
};
