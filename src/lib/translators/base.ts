/**
 * This module defines the base machinery for translators.
 *
 * It exposes the `BaseTranslator` class that should be used by all concrete
 * translator classes.
 *
 * A translator provides a transformation for each available pipeline steps. It
 * has to be named exactly as the pipeline step name it ought to transform. A
 * transformation method must return something that matches the
 * `lib/matchers/OutputStep` type or an array of this type.
 *
 */
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { OutputStep, StepMatcher, TransformStep } from '@/lib/matcher';
import * as S from '@/lib/steps';

import { VariableDelimiters } from '../variables';

export interface ValidationError {
  dataPath: string;
  keyword: string;
  message?: string;
}

/**
 * Custom exception raised when a transform method is called on a step
 * that is not supported by the translator.
 */
export class StepNotSupported extends Error {
  constructor(stepname: S.PipelineStepName) {
    super(`Unsupported step <${stepname}>`);
  }
}

/**
 * Method descriptor that:
 * - makes the method raises a StepNotSupported exception
 * - adds a `__vqb_step_supported__` property on the method and sets it to false
 *
 * @param target the translator instance
 * @param propertyKey the name of the method, in our case necessarily a step name
 * @param descriptor the method descriptor
 */
function unsupported(_target: BaseTranslator, _propertyKey: S.PipelineStepName, descriptor: any) {
  descriptor.value = function(step: Readonly<S.PipelineStep>) {
    throw new StepNotSupported(step.name);
  };
  descriptor.value.__vqb_step_supported__ = false;
}

/**
 * The `BaseTranslator` is the base class for all translators. It provides:
 *
 * - a default implementation for all pipeline steps that raises a
 *   `StepNotSupported` error.
 *
 * - a `translate` entry point method that takes an array of `PipelineStep`
 *   instances and return an array of objects matching the
 *   `lib/matchers/OutputStep` type.
 *
 * - two properties `supportedSteps` and `unsupportedSteps` that respectively
 *   return the list of supported and unsupported steps by the translator
 *   class. These lists are computed automatically by introspecting the
 *   instance and testing, for each transformation step, if the corresponding
 *   method holds a `__vqb_step_supported__` property. If this value is found
 *   and set to `false`, then the step is considered as not supported.
 *
 * - a `supports` method that tests the support of a given step name.
 */
export class BaseTranslator implements StepMatcher<OutputStep> {
  /**
   * `label` will be displayed to the user
   */
  static label: string;

  static variableDelimiters?: VariableDelimiters;

  /**
   * `supportedSteps` returns the list of steps supported by this translator class.
   */
  get supportedSteps(): S.PipelineStepName[] {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return transformerSteps()
      .filter(stepname => this.constructor.prototype[stepname].__vqb_step_supported__ !== false)
      .sort();
  }

  /**
   * `unsupportedSteps` returns the list of steps _not_ supported by this translator class.
   */
  get unsupportedSteps(): S.PipelineStepName[] {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return transformerSteps()
      .filter(stepname => this.constructor.prototype[stepname].__vqb_step_supported__ === false)
      .sort();
  }

  /**
   * `supports` returns a boolean indicating if the given step is supported or not.
   *
   * @param stepname the name of the step to test
   */
  supports(stepname: S.PipelineStepName) {
    return !this.unsupportedSteps.includes(stepname);
  }

  /* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unused-vars-experimental, @typescript-eslint/no-empty-function */
  @unsupported
  addmissingdates(step: Readonly<S.AddMissingDatesStep>) {}

  @unsupported
  aggregate(step: Readonly<S.AggregateStep>) {}

  @unsupported
  append(step: Readonly<S.AppendStep>) {}

  @unsupported
  argmax(step: Readonly<S.ArgmaxStep>) {}

  @unsupported
  argmin(step: Readonly<S.ArgminStep>) {}

  @unsupported
  concatenate(step: Readonly<S.ConcatenateStep>) {}

  @unsupported
  convert(step: Readonly<S.ConvertStep>) {}

  @unsupported
  cumsum(step: Readonly<S.CumSumStep>) {}

  @unsupported
  custom(step: Readonly<S.CustomStep>) {}

  @unsupported
  dateextract(step: Readonly<S.DateExtractPropertyStep>) {}

  @unsupported
  delete(step: Readonly<S.DeleteStep>) {}

  @unsupported
  domain(step: Readonly<S.DomainStep>) {}

  @unsupported
  duplicate(step: Readonly<S.DuplicateColumnStep>) {}

  @unsupported
  duration(step: Readonly<S.ComputeDurationStep>) {}

  @unsupported
  evolution(step: Readonly<S.EvolutionStep>) {}

  @unsupported
  fillna(step: Readonly<S.FillnaStep>) {}

  @unsupported
  filter(step: Readonly<S.FilterStep>) {}

  @unsupported
  formula(step: Readonly<S.FormulaStep>) {}

  @unsupported
  join(step: Readonly<S.JoinStep>) {}

  @unsupported
  ifthenelse(step: Readonly<S.IfThenElseStep>) {}

  @unsupported
  fromdate(step: Readonly<S.FromDateStep>) {}

  @unsupported
  lowercase(step: Readonly<S.ToLowerStep>) {}

  @unsupported
  movingaverage(step: Readonly<S.MovingAverageStep>) {}

  @unsupported
  percentage(step: Readonly<S.PercentageStep>) {}

  @unsupported
  pivot(step: Readonly<S.PivotStep>) {}

  @unsupported
  rank(step: Readonly<S.RankStep>) {}

  @unsupported
  rename(step: Readonly<S.RenameStep>) {}

  @unsupported
  replace(step: Readonly<S.ReplaceStep>) {}

  @unsupported
  rollup(step: Readonly<S.RollupStep>) {}

  @unsupported
  select(step: Readonly<S.SelectStep>) {}

  @unsupported
  sort(step: Readonly<S.SortStep>) {}

  @unsupported
  split(step: Readonly<S.SplitStep>) {}

  @unsupported
  statistics(step: Readonly<S.StatisticsStep>) {}

  @unsupported
  strcmp(step: Readonly<S.CompareTextStep>) {}

  @unsupported
  substring(step: Readonly<S.SubstringStep>) {}

  @unsupported
  text(step: Readonly<S.AddTextColumnStep>) {}

  @unsupported
  todate(step: Readonly<S.ToDateStep>) {}

  @unsupported
  totals(step: Readonly<S.AddTotalRowsStep>) {}

  @unsupported
  top(step: Readonly<S.TopStep>) {}

  @unsupported
  uniquegroups(step: Readonly<S.UniqueGroupsStep>) {}

  @unsupported
  unpivot(step: Readonly<S.UnpivotStep>) {}

  @unsupported
  uppercase(step: Readonly<S.ToUpperStep>) {}

  @unsupported
  waterfall(step: Readonly<S.WaterfallStep>) {}

  /* eslint-enable no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unused-vars-experimental */

  /**
   * translates an input pipeline into a list of steps that makes sense for the
   * targeted backend.
   *
   * @param pipeline the array of input steps.
   * @returns the list of translated output steps.
   */
  translate(pipeline: S.PipelineStep[]): OutputStep[] {
    const result: OutputStep[] = [];
    for (const step of pipeline) {
      // hack: cast `this[step.name]` to TransformStep to please typescript
      // otherwise it will complain about
      // `((x: DomainStep) => void)) | ((x: FilterStep) => void) | ((x: ...) => void)`
      // not being assignable to `((x: DomainStep | FilterStep | ...) => void)`
      let callback = this[step.name] as TransformStep;
      callback = callback.bind(this);
      result.push(callback(step));
    }
    return result;
  }

  /**
   * validate the query written in a custom step
   * return null if no error
   */
  validate(_customEditedStep: S.CustomStep): ValidationError[] | null {
    return null;
  }
}

/**
 * TypeGuard for pipeline step names.
 *
 * If the property exists in `BaseTranslator` prototype and if it's not
 * one its known extra property, then it's a PipelineStepName.
 *
 * @param propname the property name being tested
 */
function isStepFunction(propname: string): propname is S.PipelineStepName {
  const ignoredProps = new Set([
    'label',
    'validate',
    'constructor',
    'supportedSteps',
    'unsupportedSteps',
    'supports',
    'translate',
  ]);
  const expectedProps = new Set(Object.getOwnPropertyNames(BaseTranslator.prototype));
  return expectedProps.has(propname) && !ignoredProps.has(propname);
}

/**
 * helper to iterate on all available step names.
 */
function transformerSteps() {
  const stepnames: S.PipelineStepName[] = [];
  for (const propname of Object.getOwnPropertyNames(BaseTranslator.prototype)) {
    if (isStepFunction(propname)) {
      stepnames.push(propname);
    }
  }
  return stepnames;
}

/**
 * list of all available step names
 */
export const ALL_STEP_NAMES = transformerSteps().sort();
