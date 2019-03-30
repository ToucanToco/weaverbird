/**
 * This module provides the basic type machinery to build pipeline
 * translators efficiently and safely.
 *
 * It exposes 2 main building blocks:
 * - `StepMatcher`: a type mapping each available pipeline steps to a
 *   translation function
 * - `matchStep`: a function accepting a `StepMatcher` and that return a function
 *   transforming a pipeline step to an arbiratry output.
 *
 * This system is supposed to be typesafe, which means that if you add a
 * new type of `PipelineStep`, the typescript compiler is expected to fail
 * if your matcher implementation doesn't provide a mapping for this new kind
 * of step.
 */
import { PipelineStep, PipelineStepName } from './steps';

/**
 * `StepByType` is a conditional type that expects the `PipelineStep` type and
 * a valid step name and return the only possible step type matching this name.
 *
 * For instance, `StepByType<PipelineStep, 'delete'>` is equivalent to `DeleteStep`
 */
export type StepByType<A, T> = A extends { name: T } ? A : never;

/**
 * `StepMatcher` is a type built dynamically according to each available step
 * name that associates each of this step name to a specific processing function
 * accepting a step of corresponding type. For instance, it will generate the
 * `rename: (step: RenameStep) => T` mapping entry automatically.
 *
 * This type will help to enforce that each kind of step has a corresponding
 * translation function at compile time.
 */
export type StepMatcher<T> = { [K in PipelineStepName]: (step: StepByType<PipelineStep, K>) => T };

/**
 * OutputStep is a base type for all step transformer functions. Since
 * it doesn't contain any specific property, typescript should be happy with
 * any object. Still, it's convenient to be able to declare a speciifc return type.
 *
 * NOTE: also accept `void` as a valid OutputStep, mostly for the BaseTranslator
 * class.
 */
export type OutputStep = {} | void;
export type MaybeArray<T> = T | Array<T>;

/**;
 * Helper exception to handle unreachable conditions in a switch statement.
 * This will help the typescript compiler to raise an error if one or several
 * kind of steps are missing in a switch / case statement.
 *
 */
class Unreachable extends Error {
  constructor(value: never) {
    super(`value ${value} is not valid`);
  }
}

export function matchStep(
  matcher: StepMatcher<OutputStep>,
): (step: PipelineStep) => MaybeArray<OutputStep> {
  return (step: PipelineStep): OutputStep => {
    switch (step.name) {
      case 'domain':
        return matcher.domain(step);
      case 'filter':
        return matcher.filter(step);
      case 'select':
        return matcher.select(step);
      case 'rename':
        return matcher.rename(step);
      case 'delete':
        return matcher.delete(step);
      case 'newcolumn':
        return matcher.newcolumn(step);
      case 'aggregate':
        return matcher.aggregate(step);
      case 'custom':
        return matcher.custom(step);
      default:
        throw new Unreachable(step);
    }
  };
}
