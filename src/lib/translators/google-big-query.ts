import * as S from '@/lib/steps';

import { BaseTranslator } from './base';

/* istanbul ignore next */
export class GoogleBigQueryTranslator extends BaseTranslator {
  static label = 'GoogleBigQueryTranslator';
  domain(step: Readonly<S.DomainStep>) {
    return step;
  }
}
