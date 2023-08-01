/**
 * Declaration of supported steps by translators based on pypika
 * */

import type * as S from '@/lib/steps';

import type { ValidationError } from './base';
import { BaseTranslator } from './base';

/* istanbul ignore next */
export class PypikaTranslator extends BaseTranslator {
  static label = 'Pypika';

  absolutevalue(step: Readonly<S.AbsoluteValueStep>) {
    return step;
  }

  aggregate(step: Readonly<S.AggregateStep>) {
    return step;
  }

  argmax(step: Readonly<S.ArgmaxStep>) {
    return step;
  }

  argmin(step: Readonly<S.ArgminStep>) {
    return step;
  }

  append(step: Readonly<S.AppendStep>) {
    return step;
  }

  comparetext(step: Readonly<S.CompareTextStep>) {
    return step;
  }

  concatenate(step: Readonly<S.ConcatenateStep>) {
    return step;
  }

  convert(step: Readonly<S.ConvertStep>) {
    return step;
  }

  customsql(step: Readonly<S.CustomSqlStep>) {
    return step;
  }

  cumsum(step: Readonly<S.CumSumStep>) {
    return step;
  }

  delete(step: Readonly<S.DeleteStep>) {
    return step;
  }

  domain(step: Readonly<S.DomainStep>) {
    return step;
  }

  duplicate(step: Readonly<S.DuplicateColumnStep>) {
    return step;
  }

  fillna(step: Readonly<S.FillnaStep>) {
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

  rank(step: Readonly<S.RankStep>) {
    return step;
  }

  rename(step: Readonly<S.RenameStep>) {
    return step;
  }

  replace(step: Readonly<S.ReplaceStep>) {
    return step;
  }

  replacetext(step: Readonly<S.ReplaceTextStep>) {
    return step;
  }

  select(step: Readonly<S.SelectStep>) {
    return step;
  }

  sort(step: Readonly<S.SortStep>) {
    return step;
  }

  split(step: Readonly<S.SplitStep>) {
    return step;
  }

  substring(step: Readonly<S.SubstringStep>) {
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

  trim(step: Readonly<S.TrimStep>) {
    return step;
  }

  uniquegroups(step: Readonly<S.UniqueGroupsStep>) {
    return step;
  }

  unpivot(step: Readonly<S.UnpivotStep>) {
    return step;
  }

  uppercase(step: Readonly<S.ToUpperStep>) {
    return step;
  }

  validate(customEditedStep: S.CustomSqlStep): ValidationError[] | null {
    try {
      if (
        !customEditedStep.query.toLowerCase().includes('select') &&
        !customEditedStep.query.toLowerCase().includes('##previous_step##')
      ) {
        throw new Error('Invalid Query: should use SELECT and ##PREVIOUS_STEP## keywords');
      } else {
        return null;
      }
    } catch (e) {
      return [
        {
          keyword: 'sql',
          dataPath: '.query',
          message: (e as Error).message,
        },
      ];
    }
  }
}
