import _has from 'lodash/has';

export type DateRange = { start?: Date; end?: Date };
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

export const dateRangeToString = (dateRange: DateRange): string => {
  const startDate = dateRange.start ? dateRange.start.toUTCString() : 'Invalid Date';
  const endDate = dateRange.end ? dateRange.end.toUTCString() : 'Invalid Date';
  return `${startDate} -> ${endDate}`;
};

/* istanbul ignore next */
export const relativeDateToString = (relativeDate: RelativeDate): string => {
  const duration: string | undefined = DEFAULT_DURATIONS.find(
    d => d.value === relativeDate.duration,
  )?.label;
  return `${Math.abs(relativeDate.quantity)} ${duration?.toLowerCase()}`;
};

export const isRelativeDateRange = (
  value: string | CustomDateRange,
): value is RelativeDateRange => {
  if (!(value instanceof Object)) return false;
  return _has(value, 'date') && _has(value, 'duration') && _has(value, 'quantity');
};

export const isDateRange = (value: string | CustomDateRange): value is DateRange => {
  if (!(value instanceof Object)) return false;
  return Object.keys(value).length === 0 || _has(value, 'start') || _has(value, 'end');
};
