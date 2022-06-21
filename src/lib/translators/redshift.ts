import * as S from '@/lib/steps';

import { BaseTranslator } from './base';

/* istanbul ignore next */
export class RedshiftTranslator extends BaseTranslator {
  static label = 'RedshiftTranslator';
  domain(step: Readonly<S.DomainStep>) {
    return step;
  }
}
