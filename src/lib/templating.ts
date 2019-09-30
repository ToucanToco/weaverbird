/**
 * This module handles template interpolation.
 */

import { StepMatcher } from '@/lib/matcher';
import * as S from '@/lib/steps';

export type ScopeContext = {
  [varname: string]: any;
};

export type InterpolateFunction = (template: string, context: ScopeContext) => any;
type StepInterpolator = (step: S.PipelineStep) => S.PipelineStep;
type ConditionType = S.FilterSimpleCondition | S.FilterComboAnd | S.FilterComboOr;

function _interpolate(interpolate: InterpolateFunction, value: any, context: ScopeContext) {
  if (typeof value === 'string') {
    return interpolate(value, context);
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
        return { ...condition, value: _interpolate(interpolate, condition.value, context) };
      case 'in':
      case 'nin':
      default:
        // only for typescript to be happy and see we always have a return value
        return {
          ...condition,
          value: condition.value.map(v => _interpolate(interpolate, v, context)),
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
  interpolateFunc: InterpolateFunction;
  context: ScopeContext;

  constructor(interpolateFunc: InterpolateFunction, context: ScopeContext) {
    this.interpolateFunc = interpolateFunc;
    this.context = context;
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
    return { ...step, value: _interpolate(this.interpolateFunc, step.value, this.context) };
  }

  filter(step: Readonly<S.FilterStep>) {
    return {
      ...step,
      condition: interpolateFilterCondition(step.condition, this.interpolateFunc, this.context),
    };
  }

  formula(step: Readonly<S.FormulaStep>) {
    return { ...step, formula: _interpolate(this.interpolateFunc, step.formula, this.context) };
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
    const toReplace = step.to_replace.map(([oldvalue, newvalue]) => [
      _interpolate(this.interpolateFunc, oldvalue, this.context),
      _interpolate(this.interpolateFunc, newvalue, this.context),
    ]);
    return { ...step, to_replace: toReplace };
  }

  select(step: Readonly<S.SelectStep>) {
    return { ...step };
  }

  sort(step: Readonly<S.SortStep>) {
    return { ...step };
  }

  top(step: Readonly<S.TopStep>) {
    return { ...step, limit: Number(_interpolate(this.interpolateFunc, step.limit, this.context)) };
  }

  unpivot(step: Readonly<S.UnpivotStep>) {
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
