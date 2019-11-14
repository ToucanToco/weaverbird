/**
 * This module handles template interpolation.
 */

import { StepMatcher } from '@/lib/matcher';
import * as S from '@/lib/steps';

export type PipelinesScopeContext = {
  [pipelineName: string]: S.Pipeline;
};

type StepDereferencer = (step: S.PipelineStep) => S.PipelineStep;

/**
 * The `PipelineDereferencer` class provides a "dereferencing" implementation
 * for each possible step in a pipeline. It replaces pipelines names (saved in
 * store) referenced in steps configuration by their corresponding pipelines.
 *
 * The `dereference` method takes a step as parameter and returns a new version
 * of this step, with pipelines names dereferenced.
 */
export class PipelineDereferencer implements StepMatcher<S.PipelineStep> {
  // The "bag" of available names for dereferencing
  pipelines: PipelinesScopeContext;

  constructor(pipelines: PipelinesScopeContext) {
    this.pipelines = pipelines;
  }

  append(step: Readonly<S.AppendStep>) {
    const pipelineNames = step.pipelines as string[];
    return { ...step, pipelines: pipelineNames.map(p => this.pipelines[p]) };
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
    return { ...step };
  }

  filter(step: Readonly<S.FilterStep>) {
    return { ...step };
  }

  formula(step: Readonly<S.FormulaStep>) {
    return { ...step };
  }

  fromdate(step: Readonly<S.FromDateStep>) {
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
    return { ...step };
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

  todate(step: Readonly<S.ToDateStep>) {
    return { ...step };
  }

  top(step: Readonly<S.TopStep>) {
    return { ...step };
  }

  unpivot(step: Readonly<S.UnpivotStep>) {
    return { ...step };
  }

  uppercase(step: Readonly<S.ToUpperStep>) {
    return { ...step };
  }

  dereference(pipeline: S.Pipeline): S.Pipeline {
    return pipeline.map(this.dereferenceStep.bind(this));
  }

  dereferenceStep(step: S.PipelineStep): S.PipelineStep {
    const callback = this[step.name] as StepDereferencer;
    return callback.bind(this)(step);
  }
}
