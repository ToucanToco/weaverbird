import type * as S from '@/lib/steps';

import { PypikaTranslator } from './pypika';

/* istanbul ignore next */
export class SnowflakeTranslator extends PypikaTranslator {
  static label = 'Snowflake';

  dateextract(step: Readonly<S.DateExtractStep>) {
    return step;
  }
}
