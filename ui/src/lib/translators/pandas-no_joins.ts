/**
 * This translator is a temporary clone of Pandas one to release now the
 * VQB pipelines over live queries feature that does not support joins & appends yet.
 * */

import * as S from '@/lib/steps';

import { BaseTranslator } from './base';

/* istanbul ignore next */
export class PandasNoJoinsTranslator extends BaseTranslator {
  static label = 'PandasNoJoins';

  absolutevalue(step: Readonly<S.AbsoluteValueStep>) {
    return step;
  }

  addmissingdates(step: Readonly<S.AddMissingDatesStep>) {
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

  comparetext(step: Readonly<S.CompareTextStep>) {
    return step;
  }

  concatenate(step: Readonly<S.ConcatenateStep>) {
    return step;
  }

  convert(step: Readonly<S.ConvertStep>) {
    return step;
  }

  cumsum(step: Readonly<S.CumSumStep>) {
    return step;
  }

  dateextract(step: Readonly<S.DateExtractStep>) {
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

  duration(step: Readonly<S.ComputeDurationStep>) {
    return step;
  }

  evolution(step: Readonly<S.EvolutionStep>) {
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

  lowercase(step: Readonly<S.ToLowerStep>) {
    return step;
  }

  movingaverage(step: Readonly<S.MovingAverageStep>) {
    return step;
  }

  percentage(step: Readonly<S.PercentageStep>) {
    return step;
  }

  pivot(step: Readonly<S.PivotStep>) {
    return step;
  }

  rank(step: Readonly<S.RankStep>) {
    return step;
  }

  rename(step: Readonly<S.RenameStep>) {
    return step;
  }

  replacetext(step: Readonly<S.ReplaceTextStep>) {
    return step;
  }

  replace(step: Readonly<S.ReplaceStep>) {
    return step;
  }

  rollup(step: Readonly<S.RollupStep>) {
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

  statistics(step: Readonly<S.StatisticsStep>) {
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

  totals(step: Readonly<S.AddTotalRowsStep>) {
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

  waterfall(step: Readonly<S.WaterfallStep>) {
    return step;
  }
}
