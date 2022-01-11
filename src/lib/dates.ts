import _has from 'lodash/has';
import { DateTime } from 'luxon';

import t, { DEFAULT_LOCALE, LocaleIdentifier } from '@/lib/internationalization';

import { extractVariableIdentifier, VariableDelimiters, VariablesBucket } from './variables';

export type DateRange = { start?: Date; end?: Date; duration?: Duration };
export type DateRangeSide = keyof DateRange;
export type DatePickerHighlight = {
  key?: string;
  highlight: {
    class?: string;
    contentClass?: string;
  };
  dates?: DateRange;
};

export type Duration = 'year' | 'quarter' | 'month' | 'week' | 'day';
export type DurationOption = {
  label: string;
  value: Duration;
};

/**
 * With:
 * - "date" a variable that resolve to a date, NOT A DATETIME, meaning only year, month & day
 * - delta <=> abs(quantity) * duration
 *
 * and "Monday 15th" as an exemple date & "2 weeks" as an exemple delta
 *
 * We identified 4 possible operators:
 * - until  = [date - delta ; date] => upper bound is included <=> [Tuesday 2nd  ; Monday 15th]
 * - before = [date - delta ; date[ => upper bound is excluded <=> [Monday 1st   ; Sunday 14th]
 * - from   = [date ; date + delta] => lower bound is included <=> [Monday 15th  ; Sunday 28th]
 * - after  = ]date ; date + delta] => lower bound is excluded <=> [Tuesday 16th ; Monday 29th]
 *
 * However, only two of them have been implemented yet. We may or may not tweak those two or even
 * implement the four of them after getting more user feedback regarding the relevance of current ones.
 */
export const RELATIVE_DATE_OPERATORS = {
  until: { label: 'until', sign: -1 },
  from: { label: 'from', sign: +1 },
};

export type RelativeDateOperator = keyof typeof RELATIVE_DATE_OPERATORS;

// Should be included in RelativeDate
export type RelativeDate = {
  date: string;
  duration: Duration;
  operator: RelativeDateOperator;
  quantity: number; // always a positive integer, the sign is dictated by the operator
};

export type CustomDate = Date | RelativeDate;
export type CustomDateRange = DateRange | RelativeDate;

export const DEFAULT_DURATIONS: DurationOption[] = [
  { label: 'Years', value: 'year' },
  { label: 'Quarters', value: 'quarter' },
  { label: 'Months', value: 'month' },
  { label: 'Weeks', value: 'week' },
  { label: 'Days', value: 'day' },
];

export const CUSTOM_DATE_RANGE_LABEL_SEPARATOR = ' - ';

export const dateToString = (date: Date, locale?: LocaleIdentifier): string => {
  return date.toLocaleDateString(locale, { timeZone: 'UTC' });
};

/**
 * Determine the label to be displayed for a chosen DateRange
 *
 * DateRange will have a label corresponding to their duration,
 * or a generic one (of the form start - end) if they have no duration.
 * @param dateRange
 *
 * @param locale - optional
 */
export const dateRangeToString = (dateRange: DateRange, locale?: LocaleIdentifier): string => {
  if (!dateRange.start || !dateRange.end || !dateRange.duration) {
    const startDate = dateRange.start
      ? dateToString(dateRange.start, locale)
      : t('INVALID_DATE', locale);
    const endDate = dateRange.end ? dateToString(dateRange.end, locale) : t('INVALID_DATE', locale);
    return `${startDate}${CUSTOM_DATE_RANGE_LABEL_SEPARATOR}${endDate}`;
  }

  const dt = DateTime.fromJSDate(dateRange.start, { zone: 'UTC' }).setLocale(
    locale || DEFAULT_LOCALE,
  );
  const endDt = DateTime.fromJSDate(dateRange.end, { zone: 'UTC' }).setLocale(
    locale || DEFAULT_LOCALE,
  );
  switch (dateRange.duration) {
    case 'year':
      // E.g. "2021"
      return String(dt.year);
    case 'quarter':
      // E.g. "Quarter 4 2021"
      return `${t('QUARTER', locale)} ${dt.quarter} ${dt.year}`;
    case 'month':
      // E.g. "October 2021"
      return `${dt.monthLong} ${dt.year}`;
    case 'week':
      // E.g. "Week 42 2021"
      return `${t('WEEK', locale)} ${dt.weekNumber} ${dt.weekYear}`; // Note: weekYear != year for weeks overlapping two years
    case 'day':
      if (dt.hasSame(endDt, 'day')) {
        // Same day
        // Abbreviated date, e.g. "Oct 20, 2021"
        return dt.toLocaleString(DateTime.DATE_MED);
      }
    // eslint-disable-next-line no-fallthrough
    default:
      // Multiple days
      // E.g.
      return `${dt.toLocaleString(
        DateTime.DATE_SHORT,
      )}${CUSTOM_DATE_RANGE_LABEL_SEPARATOR}${endDt.toLocaleString(DateTime.DATE_SHORT)}`;
  }
};

/* istanbul ignore next */
export const relativeDateToString = (
  relativeDate: RelativeDate,
  availableVariables: VariablesBucket = [],
  variableDelimiters: VariableDelimiters = { start: '', end: '' },
): string => {
  const identifier = extractVariableIdentifier(relativeDate.date, variableDelimiters);
  const baseDateLabel =
    availableVariables.find(v => v.identifier === identifier)?.label ?? identifier;
  const duration: string | undefined = DEFAULT_DURATIONS.find(
    d => d.value === relativeDate.duration,
  )?.label;
  const relativeDateLabel = `${Math.abs(relativeDate.quantity)} ${duration?.toLowerCase()}`;
  return `${relativeDateLabel} ${relativeDate.operator} ${baseDateLabel}`;
};

export const isRelativeDate = (value: any): value is RelativeDate => {
  return (
    value &&
    typeof value == 'object' &&
    typeof value.quantity == 'number' &&
    typeof value.duration == 'string' &&
    typeof value.date == 'string'
  );
};

export const isDateRange = (value: undefined | string | CustomDateRange): value is DateRange => {
  if (!(value instanceof Object)) return false;
  return Object.keys(value).length === 0 || _has(value, 'start') || _has(value, 'end');
};

export const clampRange = (range: DateRange, bounds: DateRange): DateRange | undefined => {
  if (range.start == null || range.end == null || bounds.start == null || bounds.end == null) {
    return range;
  }

  const rangeStartIsOutOfBound = range.start < bounds.start || bounds.end < range.start;
  const rangeEndIsOutOfBound = range.end < bounds.start || bounds.end < range.end;
  const rangeContainBounds = range.start < bounds.start && bounds.end < range.end;

  if (rangeStartIsOutOfBound && rangeEndIsOutOfBound && !rangeContainBounds) {
    return undefined;
  }

  const clampedRange = {
    ...range,
    start: rangeStartIsOutOfBound ? bounds.start : range.start,
    end: rangeEndIsOutOfBound ? bounds.end : range.end,
  };
  return clampedRange;
};
