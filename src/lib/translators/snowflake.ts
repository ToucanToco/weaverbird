/**
 * This translator is not really one: it won't translate the pipeline steps into pandas' code.
 * The pandas engine to execute pipeline exists as a python package in the `server/` folder.
 *
 * This module's sole mission is to declare which steps are supported by the pandas engine, and leave the pipeline
 * steps unchanged.
 * */

import * as S from '@/lib/steps';

import { BaseTranslator } from './base';

/* istanbul ignore next */
export class SnowflakeTranslator extends BaseTranslator {
  static label = 'Pandas';

  aggregate(step: Readonly<S.AggregateStep>) {
    return step;
  }

  append(step: Readonly<S.AppendStep>) {
    return step;
  }

  convert(step: Readonly<S.ConvertStep>) {
    return step;
  }

  domain(step: Readonly<S.DomainStep>) {
    return step;
  }

  filter(step: Readonly<S.FilterStep>) {
    return step;
  }

  formula(step: Readonly<S.FormulaStep>) {
    return step;
  }

  fromdate(step: Readonly<S.FromDateStep>) {
    return step;
  }

  ifthenelse(step: Readonly<S.IfThenElseStep>) {
    return step;
  }

  join(step: Readonly<S.JoinStep>) {
    return step;
  }

  lowercase(step: Readonly<S.ToLowerStep>) {
    return step;
  }

  rename(step: Readonly<S.RenameStep>) {
    return step;
  }

  replace(step: Readonly<S.ReplaceStep>) {
    return step;
  }

  select(step: Readonly<S.SelectStep>) {
    return step;
  }

  sort(step: Readonly<S.SortStep>) {
    return step;
  }

  text(step: Readonly<S.AddTextColumnStep>) {
    return step;
  }

  todate(step: Readonly<S.ToDateStep>) {
    return step;
  }

  top(step: Readonly<S.TopStep>) {
    return step;
  }

  uppercase(step: Readonly<S.ToUpperStep>) {
    return step;
  }
}
