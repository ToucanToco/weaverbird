import * as S from '@/lib/steps';

import { PypikaTranslator } from './pypika';

/* istanbul ignore next */
export class AthenaTranslator extends PypikaTranslator {
  static label = 'AthenaTranslator';

  dateextract(step: Readonly<S.DateExtractStep>) {
    return step;
  }
}
