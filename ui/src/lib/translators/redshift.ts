import type * as S from '@/lib/steps';

import { PypikaTranslator } from './pypika';

/* istanbul ignore next */
export class RedshiftTranslator extends PypikaTranslator {
  static label = 'Redshift';

  dateextract(step: Readonly<S.DateExtractStep>) {
    return step;
  }
}
