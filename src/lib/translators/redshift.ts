import * as S from '@/lib/steps';

import { PypikaTranslator } from './pypika';

/* istanbul ignore next */
export class RedshiftTranslator extends PypikaTranslator {
  static label = 'Redshift';

  pivot(step: Readonly<S.PivotStep>) {
    return step;
  }
}
