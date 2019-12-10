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

/**
 * human-readable labels for aggregation functions.
 */
const AGGFUNCTION_LABELS = {
  sum: 'sum',
  avg: 'average',
  count: 'count',
  min: 'min',
  max: 'max',
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
  aggregate(step: Readonly<S.AggregationStep>) {
    const dimensions = formatMulticol(step.on);
    if (step.aggregations.length === 1) {
      const [aggstep] = step.aggregations;
      return `${capitalize(AGGFUNCTION_LABELS[aggstep.aggfunction])} of "${
        aggstep.column
      }" grouped by ${dimensions}`;
    } else {
      const columns = step.aggregations.map(aggstep => aggstep.column);
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

  custom(_step: Readonly<S.CustomStep>) {
    return 'Custom step';
  }

  domain(step: Readonly<S.DomainStep>) {
    return `Use domain "${step.domain}"`;
  }

  duplicate(step: Readonly<S.DuplicateColumnStep>) {
    return `Duplicate "${step.column}" in "${step.new_column_name}"`;
  }

  delete(step: Readonly<S.DeleteStep>) {
    return `Delete columns ${formatMulticol(step.columns)}`;
  }

  fillna(step: Readonly<S.FillnaStep>) {
    return `Replace null values in "${step.column}" with ${step.value}`;
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

  join(step: Readonly<S.JoinStep>) {
    return `Join dataset "${step.right_pipeline}"`;
  }

  lowercase(step: Readonly<S.ToLowerStep>) {
    return `Convert column "${step.column}" to lowercase`;
  }

  percentage(step: Readonly<S.PercentageStep>) {
    return `Compute the row-level percentage of "${step.column}"`;
  }

  pivot(step: Readonly<S.PivotStep>) {
    return `Pivot column "${step.column_to_pivot}"`;
  }

  rename(step: Readonly<S.RenameStep>) {
    return `Rename column "${step.oldname}" to "${step.newname}"`;
  }

  replace(step: Readonly<S.ReplaceStep>) {
    if (step.to_replace.length === 1) {
      return `Replace ${step.to_replace[0][0]} with ${step.to_replace[0][1]} in column "${step.search_column}"`;
    } else {
      return `Replace values in column "${step.search_column}"`;
    }
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

  unpivot(step: Readonly<S.UnpivotStep>) {
    return `Unpivot columns ${formatMulticol(step.unpivot)}`;
  }

  uppercase(step: Readonly<S.ToUpperStep>) {
    return `Convert column "${step.column}" to uppercase`;
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
