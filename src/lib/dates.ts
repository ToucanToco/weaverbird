import _has from 'lodash/has';
import _pick from 'lodash/pick';
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

export type RelativeDate = {
  quantity: number; // can be negative or positive
  duration: Duration;
};

// Should be included in RelativeDate
export type RelativeDateRange = {
  date: string;
  quantity: number; // can be negative or positive
  duration: Duration;
};

export type CustomDate = Date | RelativeDate;
export type CustomDateRange = DateRange | RelativeDateRange;

export const DEFAULT_DURATIONS: DurationOption[] = [
  { label: 'Years ago', value: 'year' },
  { label: 'Quarters ago', value: 'quarter' },
  { label: 'Months ago', value: 'month' },
  { label: 'Weeks ago', value: 'week' },
  { label: 'Days ago', value: 'day' },
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
export const relativeDateToString = (relativeDate: RelativeDate): string => {
  const duration: string | undefined = DEFAULT_DURATIONS.find(
    d => d.value === relativeDate.duration,
  )?.label;
  return `${Math.abs(relativeDate.quantity)} ${duration?.toLowerCase()}`;
};

/* istanbul ignore next */
export const relativeDateRangeToString = (
  relativeDateRange: RelativeDateRange,
  availableVariables: VariablesBucket = [],
  variableDelimiters: VariableDelimiters = { start: '', end: '' },
): string => {
  const identifier = extractVariableIdentifier(relativeDateRange.date, variableDelimiters);
  const from = availableVariables.find(v => v.identifier === identifier)?.label;
  const to = _pick(relativeDateRange, ['quantity', 'duration']);
  return `${from}${CUSTOM_DATE_RANGE_LABEL_SEPARATOR}${relativeDateToString(to)}`;
};

export const isRelativeDateRange = (
  value: string | CustomDateRange | undefined,
): value is RelativeDateRange => {
  if (!(value instanceof Object)) return false;
  return _has(value, 'date') && _has(value, 'duration') && _has(value, 'quantity');
};

export const isDateRange = (value: undefined | string | CustomDateRange): value is DateRange => {
  if (!(value instanceof Object)) return false;
  return Object.keys(value).length === 0 || _has(value, 'start') || _has(value, 'end');
};

export const clampRange = (range: DateRange, bounds: DateRange): DateRange => {
  if (range.start == null || range.end == null || bounds.start == null || bounds.end == null) {
    return range;
  }

  const rangeStartIsOutOfBound = range.start < bounds.start || bounds.end < range.start;
  const rangeEndIsOutOfBound = range.end < bounds.start || bounds.end < range.end;
  const rangeContainBounds = range.start < bounds.start && bounds.end < range.end;

  if (rangeStartIsOutOfBound && rangeEndIsOutOfBound && !rangeContainBounds) {
    throw new Error('Cannot clamp range that does not overlap with bounds');
  }

  const clampedRange = {
    ...range,
    start: rangeStartIsOutOfBound ? bounds.start : range.start,
    end: rangeEndIsOutOfBound ? bounds.end : range.end,
  };
  return clampedRange;
};
