/**
 * This translator is not really one: it won't translate the pipeline steps into pandas' code.
 * The pandas engine to execute pipeline exists as a python package in the `server/` folder.
 *
 * This module's sole mission is to declare which steps are supported by the pandas engine, and leave the pipeline
 * steps unchanged.
 * */

import * as S from '@/lib/steps';

import { BaseTranslator } from './base';

export class PandasTranslator extends BaseTranslator {
  static label = 'Pandas';

  domain(step: Readonly<S.DomainStep>) {
    return step;
  }

  filter(step: Readonly<S.FilterStep>) {
    return step;
  }
}
