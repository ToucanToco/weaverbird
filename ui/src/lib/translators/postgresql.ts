import type * as S from '@/lib/steps';

import { PypikaTranslator } from './pypika';

/* istanbul ignore next */
export class PostgresqlTranslator extends PypikaTranslator {
  static label = 'PostgreSQL';

  dateextract(step: Readonly<S.DateExtractStep>) {
    return step;
  }

  duration(step: Readonly<S.ComputeDurationStep>) {
    return step;
  }
}
