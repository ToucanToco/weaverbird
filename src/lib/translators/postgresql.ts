import * as S from '@/lib/steps';

import { PypikaTranslator } from './pypika';

/* istanbul ignore next */
export class PostgresqlTranslator extends PypikaTranslator {
  static label = 'PostgreSQL';

  duration(step: Readonly<S.ComputeDurationStep>) {
    return step;
  }
}
