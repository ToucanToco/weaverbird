/**
 * Translation toolchain utilities.
 *
 * The main exported function is `getTranslator` that takes a
 * backend name as input and returns the corresponding translator.
 *
 */
import { PipelineStepName } from '@/lib/steps';

import { VariableDelimiters } from '../variables';
import { BaseTranslator } from './base';
import { EmptyTranslator } from './empty';
import { Mongo36Translator } from './mongo';
import { Mongo40Translator } from './mongo4';
import { Mongo42Translator } from './mongo42';
import { PandasTranslator } from './pandas';
import { PandasNoJoinsTranslator } from './pandas-no_joins';
import { SnowflakeTranslator } from './snowflake';

const TRANSLATORS: { [backend: string]: typeof BaseTranslator } = {};

export function registerTranslator(backend: string, translatorClass: typeof BaseTranslator) {
  TRANSLATORS[backend] = translatorClass;
}

/** return a function translating an array of pipeline steps to expected backend
 * steps
 *
 * Example usage:
 * ```typescript
 * const translator = getTranslator('mongo36');
 * const result = translator(myPipeline);
 * ```
 */

export function getTranslator(backend: string): BaseTranslator {
  if (TRANSLATORS[backend] === undefined) {
    throw new Error(
      `no translator found for backend ${backend}. Available ones are: ${Object.keys(
        TRANSLATORS,
      ).join(' | ')}`,
    );
  }
  return new TRANSLATORS[backend]();
}

/**
 * returns the list of backends supporting a given pipeline step.
 *
 * @param stepname the name of the step
 */
export function backendsSupporting(stepname: PipelineStepName) {
  return Object.entries(TRANSLATORS)
    .filter(([_, translator]) => new translator().supports(stepname))
    .map(([backend, _]) => backend)
    .sort();
}

/**
 * returns and object mapping each available backend to its corresponding translator.
 */
export function availableTranslators() {
  return { ...TRANSLATORS };
}

registerTranslator('mongo36', Mongo36Translator);
registerTranslator('mongo40', Mongo40Translator);
registerTranslator('mongo42', Mongo42Translator);
registerTranslator('pandas', PandasTranslator);
registerTranslator('pandas-no_joins', PandasNoJoinsTranslator);
registerTranslator('empty', EmptyTranslator);
registerTranslator('snowflake', SnowflakeTranslator);

/**
 * Initialize variable delimiters for all translators
 */
export function setVariableDelimiters(variableDelimiters?: VariableDelimiters) {
  BaseTranslator.variableDelimiters = variableDelimiters;
}
