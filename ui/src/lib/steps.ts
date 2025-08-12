/**
 * This module defines the supported unit-of-transformation steps.
 */
import type { CustomDate } from '@/lib/dates';

export type BasicDatePart =
  | 'year'
  | 'month'
  | 'day'
  | 'week'
  | 'dayOfWeek'
  | 'dayOfYear'
  | 'isoYear'
  | 'isoWeek'
  | 'isoDayOfWeek'
  | 'hour'
  | 'minutes'
  | 'seconds'
  | 'milliseconds';

export type AdvancedDateInfo =
  | 'quarter'
  | 'firstDayOfYear'
  | 'firstDayOfMonth'
  | 'firstDayOfWeek'
  | 'firstDayOfQuarter'
  | 'firstDayOfIsoWeek'
  | 'currentDay'
  | 'previousDay'
  | 'firstDayOfPreviousYear'
  | 'firstDayOfPreviousMonth'
  | 'firstDayOfPreviousWeek'
  | 'firstDayOfPreviousQuarter'
  | 'firstDayOfPreviousIsoWeek'
  | 'previousYear'
  | 'previousMonth'
  | 'previousWeek'
  | 'previousQuarter'
  | 'previousIsoWeek';

export type DateInfo = BasicDatePart | AdvancedDateInfo;

export type DateGranularity = 'day' | 'week' | 'isoWeek' | 'month' | 'quarter' | 'year';

type PrimitiveType = number | boolean | string | Date;
type Templatable<T> = T | string;
export type ReferenceToExternalQuery = { type: 'ref'; uid: string };
export type Reference = Pipeline | string | ReferenceToExternalQuery;
export type TotalDimension = { totalColumn: string; totalRowsLabel: string };

/**
 * Some step can contains either:
 * - a reference to the pipeline i.e. the name of the pipeline, then a string
 * - the pipeline itself
 * - a reference to another pipeline, stored elsewhere, that should be resolved by the server
 */
export function isReferenceToOtherPipeline(
  pipelineOrReference: Reference,
): pipelineOrReference is string {
  return typeof pipelineOrReference === 'string';
}

export function isReferenceToExternalQuery(
  pipelineOrReference: Reference,
): pipelineOrReference is ReferenceToExternalQuery {
  return (
    typeof pipelineOrReference === 'object' &&
    'type' in pipelineOrReference &&
    pipelineOrReference.type == 'ref'
  );
}

export function isReference(
  pipelineOrReference: Reference,
): pipelineOrReference is string | ReferenceToExternalQuery {
  return (
    isReferenceToOtherPipeline(pipelineOrReference) ||
    isReferenceToExternalQuery(pipelineOrReference)
  );
}

export function isPipelineStep(step: any): step is PipelineStep {
  return typeof step === 'object' && 'name' in step;
}

export type AbsoluteValueStep = {
  name: 'absolutevalue';
  column: string;
  newColumn: string;
};

export type AddMissingDatesStep = {
  name: 'addmissingdates';
  datesColumn: string;
  datesGranularity: 'day' | 'month' | 'year';
  groups?: string[];
};

export type AddTextColumnStep = {
  name: 'text';
  text: string;
  newColumn: string;
};

export type AddTotalRowsStep = {
  name: 'totals';
  // an array of objects: { totalColumn: <column to add total rows in>, totalRowsLabel: <the label of the added total rows>}
  totalDimensions: TotalDimension[];
  // an array of columns used for groupby logic
  groups?: string[];
  // the list of columnns to aggregate, with related aggregation function to use
  aggregations: Aggregation[];
};

export type Aggregation = {
  // Supported for retrocompatibility only
  newcolumn?: string;
  // Name of the output columns
  newcolumns: string[];
  /** the aggregation operation (e.g. `sum` or `count`) */
  aggfunction: 'sum' | 'avg' | 'count' | 'count distinct' | 'min' | 'max' | 'first' | 'last';
  // Supported for retrocompatibility only
  column?: string;
  // Columns to aggregate
  columns: string[];
};

export type AggregateStep = {
  name: 'aggregate';
  /** the list columns we want to aggregate on */
  on: string[];
  /** the list of aggregation operations to perform */
  aggregations: Aggregation[];
  /** optional to guarantee retrocompatibility as this parameter did not exist
   *  when this step was first created */
  keepOriginalGranularity?: boolean;
  countNulls?: boolean;
};

export type AppendStep = {
  name: 'append';
  pipelines: Reference[];
};

export type ArgmaxStep = {
  name: 'argmax';
  column: string; // column in which to search for max value
  groups?: string[]; // if specified, will search for a max in every group
};

export type ArgminStep = {
  name: 'argmin';
  column: string; // column in which to search for max value
  groups?: string[]; // if specified, will search for a max in every group
};

export type CompareTextStep = {
  name: 'comparetext';
  newColumnName: string;
  strCol1: string;
  strCol2: string;
};

export type ComputeDurationStep = {
  name: 'duration';
  newColumnName: string;
  startDateColumn: string;
  endDateColumn: string;
  durationIn: 'days' | 'hours' | 'minutes' | 'seconds';
};

export type ConcatenateStep = {
  name: 'concatenate';
  columns: string[];
  separator: string;
  newColumnName: string;
};

export type ConvertStep = {
  name: 'convert';
  columns: string[];
  dataType: 'boolean' | 'date' | 'float' | 'integer' | 'text';
};

export type CumSumStep = {
  name: 'cumsum';
  referenceColumn: string;
  groupby?: string[];
} & (
  | {
      toCumSum: [string, string][];
    }
  | {
      // legacy way to declare columns (one only)
      valueColumn: string;
      newColumn?: string;
    }
);

export type CustomStep = {
  name: 'custom';
  query: string;
};

export type CustomSqlStep = {
  name: 'customsql';
  query: string;
  columns?: string[];
};

export type DateExtractStep = {
  name: 'dateextract';
  dateInfo: DateInfo[];
  column: string;
  newColumns: string[];
  operation?: BasicDatePart; // Supported for retrocompatibility only
  newColumnName?: string; // Supported for retrocompatibility only
};

export type DateGranularityStep = {
  name: 'dategranularity';
  granularity: DateGranularity;
  column: string;
  newColumn?: string;
};

export type DeleteStep = {
  name: 'delete';
  columns: string[];
};

export type DissolveStep = {
  name: 'dissolve';
  groups: string[];
  aggregations: Aggregation[];
  includeNulls?: boolean;
};

export type Statistics = 'count' | 'max' | 'min' | 'average' | 'variance' | 'standard deviation';
export type Quantile = {
  label?: string;
  nth: number;
  order: number;
};
export type StatisticsStep = {
  name: 'statistics';
  column: string;
  groupbyColumns: string[];
  statistics: Statistics[];
  /**
   * array of quantiles
   * Examples:
   * median is 1rst quantile of order 2
   * last decile is 9th quantile of order 10
   */
  quantiles: Quantile[];
};

export type DomainStep = {
  name: 'domain';
  domain: string | ReferenceToExternalQuery;
};

export type DuplicateColumnStep = {
  name: 'duplicate';
  column: string;
  newColumnName: string;
};

export type EvolutionStep = {
  name: 'evolution';
  dateCol: string;
  valueCol: string;
  evolutionType: 'vsLastYear' | 'vsLastMonth' | 'vsLastWeek' | 'vsLastDay';
  evolutionFormat: 'abs' | 'pct';
  indexColumns: string[];
  newColumn?: string;
};

export type FillnaStep = {
  name: 'fillna';
  column?: string; // supported for retrocompatibility only
  columns: string[];
  value: PrimitiveType;
};

export type FilterCondition = FilterSimpleCondition | FilterComboAnd | FilterComboOr;

export type FilterComboAnd = {
  and: FilterCondition[];
};

export type FilterComboOr = {
  or: FilterCondition[];
};

export type FilterSimpleCondition =
  | FilterConditionComparison
  | FilterConditionEquality
  | FilterConditionInclusion
  | FilterConditionDateBound;

type FilterConditionComparison = {
  column: string;
  value: number | string;
  operator: 'gt' | 'ge' | 'lt' | 'le';
};

type FilterConditionEquality = {
  column: string;
  value: any;
  operator: 'eq' | 'ne' | 'isnull' | 'notnull' | 'matches' | 'notmatches';
};

// Inclusion condition value can be a string because it can be set with a frontend template
// like "<%= ... %>"
export type FilterConditionInclusion = {
  column: string;
  value: any[] | string;
  operator: 'in' | 'nin';
};

export type FilterConditionDateBound = {
  column: string;
  value: CustomDate | string;
  operator: 'from' | 'until';
};

export type FilterStep = {
  name: 'filter';
  condition: FilterCondition;
};

export type Formula = string | number;

export type FormulaStep = {
  name: 'formula';
  newColumn: string;
  formula: Formula;
};

export type FromDateStep = {
  name: 'fromdate';
  column: string;
  format: string;
};

export type HierarchyStep = {
  name: 'hierarchy';
  hierarchyLevelColumn: string;
  hierarchy: string[];
  includeNulls?: boolean;
};

export type IfThenElseStep = {
  name: 'ifthenelse';
  newColumn: string;
  if: FilterCondition;
  then: Formula;
  else: Formula | Omit<IfThenElseStep, 'name' | 'newColumn'>;
};

export type JoinStep = {
  name: 'join';
  rightPipeline: Reference;
  type: 'left' | 'inner' | 'left outer';
  on: string[][];
};

export type MovingAverageStep = {
  name: 'movingaverage';
  valueColumn: string;
  columnToSort: string;
  movingWindow: Templatable<number>;
  groups?: string[];
  newColumnName?: string;
};

export type PercentageStep = {
  name: 'percentage';
  column: string;
  group?: string[];
  newColumnName?: string;
};

export type PivotStep = {
  name: 'pivot';
  index: string[];
  columnToPivot: string;
  valueColumn: string;
  aggFunction: 'sum' | 'avg' | 'count' | 'min' | 'max';
};

export type RankStep = {
  name: 'rank';
  valueCol: string;
  order: 'asc' | 'desc';
  method: 'standard' | 'dense';
  groupby?: string[];
  newColumnName?: string;
};

export type RenameStep = {
  name: 'rename';
  toRename: string[][];
  /**
   * optional, those parameters are deprecated and are accepted only to guarantee
   * retrocompatibility with old configurations (when this step was first created,
   * only one column at a time could be renamed, via those two parameters)
   */
  oldname?: string;
  newname?: string;
};

export type ReplaceStep = {
  name: 'replace';
  searchColumn: string;
  toReplace: any[][];
};

export type ReplaceTextStep = {
  name: 'replacetext';
  searchColumn: string;
  oldStr: string;
  newStr: string;
};

export type RollupStep = {
  name: 'rollup';
  /** the list of hierarchical columns from lowest to highest level */
  hierarchy: string[];
  /** the list of columnns to aggregate, with related aggregation function to use */
  aggregations: Aggregation[];
  /** Groupby columns if rollup has to be performed by groups */
  groupby?: string[];
  /** To give a custom name to the output label column */
  labelCol?: string;
  /** To give a custom name to the output level column */
  levelCol?: string;
  /** To give a custom name to the next output level column */
  childLevelCol?: string;
  /** To give a custom name to the output parent column */
  parentLabelCol?: string;
};

export type SelectStep = {
  name: 'select';
  columns: string[];
};

export type SimplifyStep = {
  name: 'simplify';
  tolerance: number;
};

export type SortColumnType = {
  column: string;
  order: 'asc' | 'desc';
};

export type SortStep = {
  name: 'sort';
  columns: SortColumnType[];
};

export type SplitStep = {
  name: 'split';
  column: string;
  delimiter: string;
  numberColsToKeep: number;
};

export type SubstringStep = {
  name: 'substring';
  column: string;
  startIndex: number;
  endIndex: number;
  newColumnName?: string;
};

export type ToDateStep = {
  name: 'todate';
  column: string;
  format?: string;
};

export type ToLowerStep = {
  name: 'lowercase';
  column: string;
};

export type TopStep = {
  name: 'top';
  groups?: string[];
  rankOn: string;
  sort: 'asc' | 'desc';
  limit: Templatable<number>;
};

export type ToUpperStep = {
  name: 'uppercase';
  column: string;
};

export type TrimStep = {
  name: 'trim';
  columns: string[];
};

export type UniqueGroupsStep = {
  name: 'uniquegroups';
  on: string[];
};

export type UnpivotStep = {
  name: 'unpivot';
  keep: string[];
  unpivot: string[];
  unpivotColumnName: string;
  valueColumnName: string;
  dropna: boolean;
};

export type WaterfallStep = {
  name: 'waterfall';
  valueColumn: string;
  milestonesColumn: string;
  start: string;
  end: string;
  labelsColumn: string;
  parentsColumn?: string;
  groupby?: string[];
  sortBy: 'label' | 'value';
  order: 'asc' | 'desc';
  backfill?: boolean;
};

export type PipelineStep =
  | AbsoluteValueStep
  | AddMissingDatesStep
  | AddTextColumnStep
  | AddTotalRowsStep
  | AggregateStep
  | AppendStep
  | ArgmaxStep
  | ArgminStep
  | CompareTextStep
  | ComputeDurationStep
  | ConcatenateStep
  | ConvertStep
  | CumSumStep
  | CustomStep
  | CustomSqlStep
  | DateExtractStep
  | DateGranularityStep
  | DissolveStep
  | DeleteStep
  | DuplicateColumnStep
  | DomainStep
  | EvolutionStep
  | FillnaStep
  | FilterStep
  | FormulaStep
  | FromDateStep
  | HierarchyStep
  | IfThenElseStep
  | JoinStep
  | MovingAverageStep
  | PercentageStep
  | PivotStep
  | RankStep
  | RenameStep
  | ReplaceStep
  | ReplaceTextStep
  | RollupStep
  | SelectStep
  | SimplifyStep
  | SplitStep
  | SortStep
  | StatisticsStep
  | SubstringStep
  | ToDateStep
  | ToLowerStep
  | TopStep
  | ToUpperStep
  | TrimStep
  | UniqueGroupsStep
  | UnpivotStep
  | WaterfallStep;

export type PipelineStepName = PipelineStep['name'];
export type Pipeline = PipelineStep[];

/**
 * Type guard for `FilterComboAnd` type
 * @param cond the condition to test
 */
export function isFilterComboAnd(cond: FilterCondition): cond is FilterComboAnd {
  if ((cond as FilterComboAnd).and) {
    return true;
  }
  return false;
}

/**
 * Type guard for `FilterComboOr` type
 * @param cond the condition to test
 */
export function isFilterComboOr(cond: FilterCondition): cond is FilterComboOr {
  if ((cond as FilterComboOr).or) {
    return true;
  }
  return false;
}
