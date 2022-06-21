import * as S from '@/lib/steps';

import { BaseTranslator } from './base';

/* istanbul ignore next */
export class PostgresqlTranslator extends BaseTranslator {
  static label = 'PostgresqlTranslator';
  domain(step: Readonly<S.DomainStep>) {
    return step;
  }
}
