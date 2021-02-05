/**
 * Define helpers to compute human-readable representations for every possible
 * kind of step in a pipeline.
 *
 * Example usage:
 * ```typescript
 * import { humanReadableLabel } from '@/lib/labellers';
 * const step: FilterStep: {
 *  // ...
 * }
 * const label = humanReadableLabel(step);
 * ```
 */
import { StepMatcher } from '@/lib/matcher';
import * as S from '@/lib/steps';

import { VariableDelimiters } from './variables';

/**
 * human-readable labels for aggregation functions.
 */
const AGGFUNCTION_LABELS = {
  sum: 'sum',
  avg: 'average',
  count: 'count',
  min: 'min',
  max: 'max',
  first: 'first',
  last: 'last',
};

/**
 * default value separator in human-readable labels for multivalued fields.
 */
const MULTIVALUE_SEP = ', ';

function formatMulticol(columns: string[]) {
  return columns.map(col => `"${col}"`).join(MULTIVALUE_SEP);
}

/**
 * Compute a human-readable label from a filter step condition.
 *
 * Introspect the condition's operator to make the label the most precise possible.
 * @param condition the filter step condition
 */
function filterExpression(
  condition: S.FilterSimpleCondition | S.FilterComboAnd | S.FilterComboOr,
): string {
  if (S.isFilterComboAnd(condition)) {
    return condition.and.map(cond => filterExpression(cond)).join(' and ');
  } else if (S.isFilterComboOr(condition)) {
    return condition.or.map(cond => filterExpression(cond)).join(' or ');
  } else {
    switch (condition.operator) {
      case 'eq':
        return `"${condition.column}" = ${condition.value}`;
      case 'ne':
        return `"${condition.column}" ≠ ${condition.value}`;
      case 'gt':
        return `"${condition.column}" > ${condition.value}`;
      case 'ge':
        return `"${condition.column}" ≥ ${condition.value}`;
      case 'lt':
        return `"${condition.column}" < ${condition.value}`;
      case 'le':
        return `"${condition.column}" ≤ ${condition.value}`;
      case 'in':
        return `"${condition.column}" in (${condition.value.join(MULTIVALUE_SEP)})`;
      case 'nin':
        return `"${condition.column}" not in (${condition.value.join(MULTIVALUE_SEP)})`;
      case 'matches':
        return `"${condition.column}" matches regex "${condition.value}"`;
      case 'notmatches':
        return `"${condition.column}" doesn't match regex "${condition.value}"`;
      case 'isnull':
        return `"${condition.column}" is null`;
      case 'notnull':
        return `"${condition.column}" is not null`;
      default:
        // only for typescript to be happy and see we always have a return value
        return '';
    }
  }
}

/**
 * Return the input string in lowercase except for the first character.
 *
 * @param label the string to capitalize
 */
function capitalize(label: string) {
  return label[0].toUpperCase() + label.slice(1).toLocaleLowerCase();
}

/**
 * The `Labeller` class provides a human-readable label for each step.
 */
class StepLabeller implements StepMatcher<string> {
  addmissingdates(step: Readonly<S.AddMissingDatesStep>) {
    return `Add missing dates in "${step.datesColumn}"`;
  }

  aggregate(step: Readonly<S.AggregateStep>) {
    const dimensions = formatMulticol(step.on);
    const columns: string[] = [];
    for (const agg of step.aggregations) {
      if (agg.column) {
        // For retrocompatibility purposes
        columns.push(agg.column);
      } else {
        for (const c of agg.columns) {
          if (!columns.includes(c)) {
            columns.push(c);
          }
        }
      }
    }
    if (columns.length === 1) {
      const [aggstep] = step.aggregations;
      return `${capitalize(AGGFUNCTION_LABELS[aggstep.aggfunction])} of "${
        columns[0]
      }" grouped by ${dimensions}`;
    } else {
      return `Aggregate ${formatMulticol(columns)} grouped by ${dimensions}`;
    }
  }

  append(step: Readonly<S.AppendStep>) {
    return `Append ${formatMulticol(step.pipelines as string[])}`;
  }

  argmax(step: Readonly<S.ArgmaxStep>) {
    return `Keep row with maximum in column "${step.column}"`;
  }

  argmin(step: Readonly<S.ArgminStep>) {
    return `Keep row with minimum in column "${step.column}"`;
  }

  concatenate(step: Readonly<S.ConcatenateStep>) {
    return `Concatenate columns ${formatMulticol(step.columns)}`;
  }

  convert(step: Readonly<S.ConvertStep>) {
    return `Convert columns ${formatMulticol(step.columns)} into ${step.data_type}`;
  }

  cumsum(step: Readonly<S.CumSumStep>) {
    return `Compute cumulated sum of "${step.valueColumn}"`;
  }

  custom(_step: Readonly<S.CustomStep>) {
    return 'Custom step';
  }

  dateextract(step: Readonly<S.DateExtractPropertyStep>) {
    return `Extract ${step.operation} from "${step.column}"`;
  }

  delete(step: Readonly<S.DeleteStep>) {
    return `Delete columns ${formatMulticol(step.columns)}`;
  }

  domain(step: Readonly<S.DomainStep>) {
    return `Use domain "${step.domain}"`;
  }

  duplicate(step: Readonly<S.DuplicateColumnStep>) {
    return `Duplicate "${step.column}" in "${step.new_column_name}"`;
  }

  duration(step: Readonly<S.ComputeDurationStep>) {
    return `Compute duration between "${step.startDateColumn}" and "${step.endDateColumn}"`;
  }

  evolution(step: Readonly<S.EvolutionStep>) {
    return `Compute evolution of column "${step.valueCol}"`;
  }

  fillna(step: Readonly<S.FillnaStep>) {
    if (step.column) {
      return `Replace null values in "${step.column}" with ${step.value}`;
    }
    return `Replace null values in ${formatMulticol(step.columns)} with ${step.value}`;
  }

  filter(step: Readonly<S.FilterStep>) {
    return `Keep rows where ${filterExpression(step.condition)}`;
  }

  formula(step: Readonly<S.FormulaStep>) {
    return `Compute "${step.formula}" in "${step.new_column}"`;
  }

  fromdate(step: Readonly<S.FromDateStep>) {
    return `Convert "${step.column}" into text`;
  }

  ifthenelse(step: Readonly<S.IfThenElseStep>) {
    return `Add conditional column "${step.newColumn}"`;
  }

  join(step: Readonly<S.JoinStep>) {
    return `Join dataset "${step.right_pipeline}"`;
  }

  lowercase(step: Readonly<S.ToLowerStep>) {
    return `Convert column "${step.column}" to lowercase`;
  }

  movingaverage(step: Readonly<S.MovingAverageStep>) {
    return `Compute moving average of "${step.valueColumn}"`;
  }

  percentage(step: Readonly<S.PercentageStep>) {
    return `Compute the row-level percentage of "${step.column}"`;
  }

  pivot(step: Readonly<S.PivotStep>) {
    return `Pivot column "${step.column_to_pivot}"`;
  }

  rank(step: Readonly<S.RankStep>) {
    return `Compute rank of column "${step.valueCol}"`;
  }

  rename(step: Readonly<S.RenameStep>) {
    // For retrocompatibility with old configurations
    if (step.oldname && step.newname) {
      return `Rename column "${step.oldname}" to "${step.newname}"`;
    }

    if (step.toRename.length === 1) {
      return `Rename column "${step.toRename[0][0]}" to "${step.toRename[0][1]}"`;
    } else {
      return `Rename columns ${formatMulticol(step.toRename.map(a => a[0]))}`;
    }
  }

  replace(step: Readonly<S.ReplaceStep>) {
    if (step.to_replace.length === 1) {
      return `Replace ${step.to_replace[0][0]} with ${step.to_replace[0][1]} in column "${step.search_column}"`;
    } else {
      return `Replace values in column "${step.search_column}"`;
    }
  }

  rollup(step: Readonly<S.RollupStep>) {
    return `Roll-up hierarchy [${formatMulticol(step.hierarchy)}]`;
  }

  select(step: Readonly<S.SelectStep>) {
    return `Keep columns ${formatMulticol(step.columns)}`;
  }

  sort(step: Readonly<S.SortStep>) {
    const columns = step.columns.map(sortdef => sortdef.column);
    return `Sort columns ${formatMulticol(columns)}`;
  }

  split(step: Readonly<S.SplitStep>) {
    return `Split column "${step.column}"`;
  }

  statistics(step: Readonly<S.StatisticsStep>) {
    return `Compute statistics of "${step.column}"`;
  }

  strcmp(step: Readonly<S.CompareTextStep>) {
    return `Compare string columns "${step.strCol1}" and "${step.strCol2}"`;
  }

  substring(step: Readonly<S.SubstringStep>) {
    return `Extract substring from "${step.column}"`;
  }

  text(step: Readonly<S.AddTextColumnStep>) {
    return `Add text column "${step.new_column}"`;
  }

  todate(step: Readonly<S.ToDateStep>) {
    return `Convert "${step.column}" into date`;
  }

  top(step: Readonly<S.TopStep>) {
    return `Keep top ${step.limit} values in column "${step.rank_on}"`;
  }

  totals(step: Readonly<S.AddTotalRowsStep>) {
    const columns = step.totalDimensions.map(c => c.totalColumn);
    return `Add total rows in columns ${formatMulticol(columns)}`;
  }

  uniquegroups(step: Readonly<S.UniqueGroupsStep>) {
    return `Get unique groups/values in columns ${formatMulticol(step.on)}`;
  }

  unpivot(step: Readonly<S.UnpivotStep>) {
    return `Unpivot columns ${formatMulticol(step.unpivot)}`;
  }

  uppercase(step: Readonly<S.ToUpperStep>) {
    return `Convert column "${step.column}" to uppercase`;
  }

  waterfall(step: Readonly<S.WaterfallStep>) {
    return `Compute waterfall of "${step.valueColumn}" from "${step.start}" to "${step.end}"`;
  }
}

const LABELLER = new StepLabeller();

/**
 * Compute a human-readable representation of a pipeline step.
 *
 * @param step the step we want to compute a label for
 * @return the human-readable label.
 */
export function humanReadableLabel(step: S.PipelineStep) {
  const transform = LABELLER[step.name] as (step: S.PipelineStep) => string;
  return transform(step);
}

function _replaceAll(str: string, search: string, replace: string) {
  return str.replace(new RegExp(search, 'g'), replace);
}

export function labelWithReadeableVariables(
  label: string | null,
  variableDelimiters: VariableDelimiters | null,
  replaceDelimiters: VariableDelimiters | null,
): string {
  if (!variableDelimiters || !replaceDelimiters || !label) {
    return label || '';
  }
  const formattedLabel = _replaceAll(label, variableDelimiters.start, replaceDelimiters.start);
  return _replaceAll(formattedLabel, variableDelimiters.end, replaceDelimiters.end);
}
