import type * as S from '@/lib/steps';

import { PypikaTranslator } from './pypika';

/* istanbul ignore next */
export class GoogleBigQueryTranslator extends PypikaTranslator {
  static label = 'GoogleBigQueryTranslator';

  dateextract(step: Readonly<S.DateExtractStep>) {
    return step;
  }
}
