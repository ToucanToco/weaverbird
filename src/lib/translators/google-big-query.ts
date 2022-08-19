import * as S from '@/lib/steps';

import { PypikaTranslator } from './pypika';

/* istanbul ignore next */
export class GoogleBigQueryTranslator extends PypikaTranslator {
  static label = 'GoogleBigQueryTranslator';
  pivot(step: Readonly<S.PivotStep>) {
    return step;
  }
}
