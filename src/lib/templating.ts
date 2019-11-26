/**
 * This module handles template interpolation.
 */

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
      default:
        // only for typescript to be happy and see we always have a return value
        return {
          ...condition,
          value: condition.value.map(v => _interpolate(interpolate, v, context, columnType)),
        };
    }
  }
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
    return { ...step };
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

  custom(step: Readonly<S.CustomStep>) {
    return { ...step };
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

  rename(step: Readonly<S.RenameStep>) {
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

  unpivot(step: Readonly<S.UnpivotStep>) {
    return { ...step };
  }

  uppercase(step: Readonly<S.ToUpperStep>) {
    return { ...step };
  }

  interpolate(pipeline: S.Pipeline): S.Pipeline {
    return pipeline.map(this.interpolateStep.bind(this));
  }

  interpolateStep(step: S.PipelineStep): S.PipelineStep {
    const callback = this[step.name] as StepInterpolator;
    return callback.bind(this)(step);
  }
}
