import * as S from '@/lib/steps';

import { BaseTranslator } from './base';

/* istanbul ignore next */
export class MySqlTranslator extends BaseTranslator {
  static label = 'MySqlTranslator';
  domain(step: Readonly<S.DomainStep>) {
    return step;
  }
}
