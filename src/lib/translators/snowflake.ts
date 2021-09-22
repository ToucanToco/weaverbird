/**
 * This translator is allow an app maker to visually perfom data preparation and converts the result to a Snowflake
 * valid SQL Query. *
 * This module's sole mission is to declare which steps are supported by the Snowflake translator, and leave the pipeline
 * steps unchanged.
 * */

import * as S from '@/lib/steps';
import { BaseTranslator, ValidationError } from '@/lib/translators/base';

/* istanbul ignore next */
export class SnowflakeTranslator extends BaseTranslator {
  static label = 'Snowflake';

  aggregate(step: Readonly<S.AggregateStep>) {
    return step;
  }

  append(step: Readonly<S.AppendStep>) {
    return step;
  }

  argmax(step: Readonly<S.ArgmaxStep>) {
    return step;
  }

  argmin(step: Readonly<S.ArgminStep>) {
    return step;
  }

  concatenate(step: Readonly<S.ConcatenateStep>) {
    return step;
  }

  customsql(step: Readonly<S.CustomSqlStep>) {
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

  join(step: Readonly<S.JoinStep>) {
    return step;
  }

  lowercase(step: Readonly<S.ToLowerStep>) {
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

  uniquegroups(step: Readonly<S.UniqueGroupsStep>) {
    return step;
  }

  unpivot(step: Readonly<S.UnpivotStep>) {
    return step;
  }

  uppercase(step: Readonly<S.ToUpperStep>) {
    return step;
  }

  totals(step: Readonly<S.AddTotalRowsStep>) {
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
          message: e.message,
        },
      ];
    }
  }
}
