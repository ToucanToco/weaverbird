/**
 * Translation toolchain utilities.
 *
 * The main exported function is `getTranslator` that takes a
 * backend name as input and returns the corresponding translator.
 *
 */
import { PipelineStep } from '@/lib/steps';
import { translators as mongoTranslators } from '@/lib/translators/mongo';

type TransformerFunc = (pipeline: Array<PipelineStep>) => any;
export type TranslatorRegistryType = { [backend: string]: TransformerFunc };

const TRANSLATORS: TranslatorRegistryType = {};

// register mongo translators
for (const [backend, transformer] of Object.entries(mongoTranslators)) {
  TRANSLATORS[backend] = transformer;
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
export function getTranslator(backend: string) {
  if (TRANSLATORS[backend] === undefined) {
    throw new Error(
      `no translator found for backend ${backend}. Available ones are: ${Object.keys(
        TRANSLATORS,
      ).join(' | ')}`,
    );
  }
  return TRANSLATORS[backend];
}
