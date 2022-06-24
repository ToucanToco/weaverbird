import * as S from '@/lib/steps';

import { BaseTranslator } from './base';

/* istanbul ignore next */
export class AthenaTranslator extends BaseTranslator {
  static label = 'AthenaTranslator';
  domain(step: Readonly<S.DomainStep>) {
    return step;
  }
}
