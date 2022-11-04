/**
 * This translator is an empty translator to support only domain step
 * */

import * as S from '@/lib/steps';

import { BaseTranslator } from './base';

/* istanbul ignore next */
export class EmptyTranslator extends BaseTranslator {
  static label = 'EmptyTranslator';
  domain(step: Readonly<S.DomainStep>) {
    return step;
  }
}
