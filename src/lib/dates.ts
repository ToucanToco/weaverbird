import _has from 'lodash/has';
import _pick from 'lodash/pick';

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

export const CUSTOM_DATE_RANGE_LABEL_SEPARATOR = '<span>&#8594;</span>'; //use arrow symbol

export const dateToString = (date: Date): string => {
  return date.toLocaleDateString(undefined, { timeZone: 'UTC' });
};

export const dateRangeToString = (dateRange: DateRange): string => {
  const startDate = dateRange.start ? dateToString(dateRange.start) : 'Invalid Date';
  const endDate = dateRange.end ? dateToString(dateRange.end) : 'Invalid Date';
  return `${startDate}${CUSTOM_DATE_RANGE_LABEL_SEPARATOR}${endDate}`;
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
  value: string | CustomDateRange,
): value is RelativeDateRange => {
  if (!(value instanceof Object)) return false;
  return _has(value, 'date') && _has(value, 'duration') && _has(value, 'quantity');
};

export const isDateRange = (value: undefined | string | CustomDateRange): value is DateRange => {
  if (!(value instanceof Object)) return false;
  return Object.keys(value).length === 0 || _has(value, 'start') || _has(value, 'end');
};
