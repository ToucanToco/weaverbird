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
import type { CustomDate } from '@/lib/dates';
import { dateToString, relativeDateToString } from '@/lib/dates';
import type { StepMatcher } from '@/lib/matcher';
import type { Pipeline } from '@/lib/steps';
import * as S from '@/lib/steps';

import type { VariableDelimiters } from './variables';

/**
 * human-readable labels for aggregation functions.
 */
const AGGFUNCTION_LABELS = {
  sum: 'sum',
  avg: 'average',
  count: 'count',
  'count distinct': 'count distinct values',
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
  return columns.map((col) => `"${col}"`).join(MULTIVALUE_SEP);
}

/**
 * Compute a human-readable label from a relative date filter step condition.
 */
function relativeDateFilterExpression(value: CustomDate | string): string {
  if (value instanceof Date) {
    return dateToString(value);
  } else if (value instanceof Object) {
    return relativeDateToString(value);
  } else {
    return value;
  }
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
    return condition.and.map((cond) => filterExpression(cond)).join(' and ');
  } else if (S.isFilterComboOr(condition)) {
    return condition.or.map((cond) => filterExpression(cond)).join(' or ');
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
      case 'from':
        return `"${condition.column}" starting in/on ${relativeDateFilterExpression(
          condition.value,
        )}`;
      case 'until':
        return `"${condition.column}" ending in/on ${relativeDateFilterExpression(
          condition.value,
        )}`;
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
  absolutevalue(step: Readonly<S.AbsoluteValueStep>) {
    return `Compute absolute value of "${step.column}"`;
  }

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

  append(step: Readonly<S.AppendStep>, retrieveDomainNameFunc?: typeof retrieveDomainName) {
    return `Append ${formatMulticol(step.pipelines.map((p) => retrieveDomainNameFunc!(p, [])))}`;
  }

  argmax(step: Readonly<S.ArgmaxStep>) {
    return `Keep row with maximum in column "${step.column}"`;
  }

  argmin(step: Readonly<S.ArgminStep>) {
    return `Keep row with minimum in column "${step.column}"`;
  }

  comparetext(step: Readonly<S.CompareTextStep>) {
    return `Compare string columns "${step.strCol1}" and "${step.strCol2}"`;
  }

  concatenate(step: Readonly<S.ConcatenateStep>) {
    return `Concatenate columns ${formatMulticol(step.columns)}`;
  }

  convert(step: Readonly<S.ConvertStep>) {
    return `Convert columns ${formatMulticol(step.columns)} into ${step.dataType}`;
  }

  customsql(_step: Readonly<S.CustomSqlStep>) {
    return `Custom sql step`;
  }

  cumsum(step: Readonly<S.CumSumStep>) {
    // For retrocompatibility with old configurations
    if ('valueColumn' in step) {
      return `Compute cumulated sum of "${step.valueColumn}"`;
    }

    if (step.toCumSum.length === 1) {
      return `Compute cumulated sum of "${step.toCumSum[0][0]}"`;
    } else {
      return `Compute cumulated sum of ${formatMulticol(step.toCumSum.map((a) => a[0]))}`;
    }
  }

  custom(_step: Readonly<S.CustomStep>) {
    return 'Custom step';
  }

  dateextract(step: Readonly<S.DateExtractStep>) {
    return `Extract date information from "${step.column}"`;
  }

  delete(step: Readonly<S.DeleteStep>) {
    return `Delete columns ${formatMulticol(step.columns)}`;
  }

  dissolve(step: Readonly<S.DissolveStep>) {
    return `Dissolve geographical data grouped by ${formatMulticol(step.groups)}`;
  }

  domain(step: Readonly<S.DomainStep>, retrieveDomainNameFunc?: typeof retrieveDomainName) {
    return `Source: "${retrieveDomainNameFunc!(step.domain, [])}"`;
  }

  duplicate(step: Readonly<S.DuplicateColumnStep>) {
    return `Duplicate "${step.column}" in "${step.newColumnName}"`;
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
    return `Compute "${step.formula}" in "${step.newColumn}"`;
  }

  fromdate(step: Readonly<S.FromDateStep>) {
    return `Convert "${step.column}" into text`;
  }

  hierarchy(step: Readonly<S.HierarchyStep>) {
    const prefix = `Set up a geographical hierarchy in "${step.hierarchyLevelColumn}"`;
    const hierarchyString = step.hierarchy.length > 1 ? ': ' + step.hierarchy.join(' > ') : '';
    return prefix + hierarchyString;
  }

  ifthenelse(step: Readonly<S.IfThenElseStep>) {
    return `Add conditional column "${step.newColumn}"`;
  }

  join(step: Readonly<S.JoinStep>, retrieveDomainNameFunc?: typeof retrieveDomainName) {
    return `Join dataset "${retrieveDomainNameFunc!(step.rightPipeline, [])}"`;
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
    return `Pivot column "${step.columnToPivot}"`;
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
      return `Rename columns ${formatMulticol(step.toRename.map((a) => a[0]))}`;
    }
  }

  replace(step: Readonly<S.ReplaceStep>) {
    if (step.toReplace.length === 1) {
      return `Replace ${step.toReplace[0][0]} with ${step.toReplace[0][1]} in column "${step.searchColumn}"`;
    } else {
      return `Replace values in column "${step.searchColumn}"`;
    }
  }

  replacetext(step: Readonly<S.ReplaceTextStep>) {
    return `Replace text '${step.oldStr}' in column "${step.searchColumn}" with '${step.newStr}'`;
  }

  rollup(step: Readonly<S.RollupStep>) {
    return `Roll-up hierarchy [${formatMulticol(step.hierarchy)}]`;
  }

  select(step: Readonly<S.SelectStep>) {
    return `Keep columns ${formatMulticol(step.columns)}`;
  }

  simplify(step: Readonly<S.SimplifyStep>) {
    return `Simplify geographical data by "${step.tolerance}"`;
  }

  sort(step: Readonly<S.SortStep>) {
    const columns = step.columns.map((sortdef) => sortdef.column);
    return `Sort columns ${formatMulticol(columns)}`;
  }

  split(step: Readonly<S.SplitStep>) {
    return `Split column "${step.column}"`;
  }

  statistics(step: Readonly<S.StatisticsStep>) {
    return `Compute statistics of "${step.column}"`;
  }

  substring(step: Readonly<S.SubstringStep>) {
    return `Extract substring from "${step.column}"`;
  }

  text(step: Readonly<S.AddTextColumnStep>) {
    return `Add text column "${step.newColumn}"`;
  }

  todate(step: Readonly<S.ToDateStep>) {
    return `Convert "${step.column}" into date`;
  }

  top(step: Readonly<S.TopStep>) {
    return `Keep top ${step.limit} values in column "${step.rankOn}"`;
  }

  totals(step: Readonly<S.AddTotalRowsStep>) {
    const columns = step.totalDimensions.map((c) => c.totalColumn);
    return `Add total rows in columns ${formatMulticol(columns)}`;
  }

  totimenumber(step: Readonly<S.ToTimeNumberStep>) {
    return `Convert "${step.column}" into time`;
  }

  trim(step: Readonly<S.TrimStep>) {
    return `Trim spaces in ${formatMulticol(step.columns)}`;
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
 * @param [retrieveDomainNameFunc]
 * @return the human-readable label.
 */
export function humanReadableLabel(
  step: S.PipelineStep,
  retrieveDomainNameFunc?: typeof retrieveDomainName,
) {
  const transform = LABELLER[step.name] as (
    step: S.PipelineStep,
    retrieveDomainNameFunc?: typeof retrieveDomainName,
  ) => string;
  return transform(step, retrieveDomainNameFunc);
}

function _replaceAll(str: string, search: string, replace: string) {
  return str.replace(new RegExp(search, 'g'), replace);
}

function _replaceDelimitersInLabel(
  label: string | null,
  replaceDelimiters: VariableDelimiters | null,
  variableDelimiters?: VariableDelimiters | null,
): string {
  if (!variableDelimiters || !replaceDelimiters || !label) {
    return label || '';
  }
  const formattedLabel = _replaceAll(label, variableDelimiters.start, replaceDelimiters.start);
  return _replaceAll(formattedLabel, variableDelimiters.end, replaceDelimiters.end);
}

export function labelWithReadeableVariables(
  label: string | null,
  variableDelimiters: VariableDelimiters | null,
  replaceDelimiters: VariableDelimiters | null,
  trustedVariableDelimiters?: VariableDelimiters,
): string {
  const labelWithoutTrustedVariableDelimiters = _replaceDelimitersInLabel(
    label,
    replaceDelimiters,
    trustedVariableDelimiters,
  );
  const labelWithoutTrustedAndDefaultVariableDelimiters = _replaceDelimitersInLabel(
    labelWithoutTrustedVariableDelimiters,
    replaceDelimiters,
    variableDelimiters,
  );
  return labelWithoutTrustedAndDefaultVariableDelimiters;
}

// enable to retrieve the related name of a query referenced behind an uid
export function retrieveDomainName(
  domain: string | S.ReferenceToExternalQuery | Pipeline,
  availableDomains: { name: string; uid: string }[],
): string {
  if (Array.isArray(domain)) {
    return '[pipeline]'; // a complete pipeline cannot be labeled
  }
  const domainOrUid = S.isReferenceToExternalQuery(domain) ? domain.uid : domain;
  return availableDomains.find((q) => q.uid === domainOrUid)?.name ?? domainOrUid;
}
