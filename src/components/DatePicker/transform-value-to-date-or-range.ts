import { DateTime } from 'luxon';

import {
  CustomDate,
  CustomDateRange,
  DateRange,
  Duration,
  isDateRange,
  isRelativeDateRange,
  RelativeDate,
  RelativeDateRange,
} from '@/lib/dates';
import { retrieveVariable, VariableDelimiters, VariablesBucket } from '@/lib/variables';

/*
Transform a relative date object to a readable date
*/
export type RelativeDateObject = {
  date: Date | undefined;
  quantity: number;
  duration: Duration;
};

export const transformRelativeDateObjectToDate = ({
  date,
  quantity,
  duration,
}: RelativeDateObject): Date | undefined => {
  if (!(date instanceof Date)) return;
  const luxonDuration = `${duration}s`; //luxon use duration with 's' at the end, but we don't (maybe we need a refacto for it)
  const dateTime = DateTime.fromJSDate(date, { zone: 'UTC' });
  // calculate date
  return dateTime.plus({ [luxonDuration]: quantity }).toJSDate();
};

/*
Transform a relative date to a readable date
*/
export const transformRelativeDateToDate = (relativeDate: RelativeDate): Date | undefined => {
  // In relative date we always use today as date to update
  const today = new Date(Date.now());
  const date = DateTime.fromJSDate(today, { zone: 'UTC' }).toJSDate();
  // retrieve date from luxon
  return transformRelativeDateObjectToDate({
    ...relativeDate,
    date,
  });
};

export const transformRelativeDateToDateRange = (
  relativeDate: RelativeDate,
): DateRange | undefined => {
  // In relative date we always use today as date to update
  const today = new Date(Date.now());
  const start = DateTime.fromJSDate(today, { zone: 'UTC' }).toJSDate();
  // retrieve end date from luxon
  const end = transformRelativeDateObjectToDate({
    ...relativeDate,
    date: start,
  });
  return relativeDate.quantity >= 0 ? { start, end } : { start: end, end: start };
};

/*
Transform a relative date range to a readable date range
*/
export const transformRelativeDateRangeToDateRange = (
  relativeDateRange: RelativeDateRange,
  relativeAvailableVariables: VariablesBucket = [],
  variableDelimiters: VariableDelimiters = { start: '', end: '' },
): DateRange | undefined => {
  // start is always a date as relativeAvailableVariables are not customizable
  const value = retrieveVariable(
    relativeDateRange.date,
    relativeAvailableVariables,
    variableDelimiters,
  )?.value;
  if (!(value instanceof Date)) return;
  // pass start date to UTC
  const start = DateTime.fromJSDate(value, { zone: 'UTC' }).toJSDate();
  // retrieve end date from luxon
  const end = transformRelativeDateObjectToDate({ ...relativeDateRange, date: start });
  // if quantity is negative, start will arrive after end
  return relativeDateRange.quantity >= 0 ? { start, end } : { start: end, end: start };
};

/*
Transform a value of any date available types 
(string(Variable), CustomDate(Date, RelativeDate), CustomDateRange(DateRange, RelativeDateRange)) 
to a Date or a DateRange if possible
*/
export const transformValueToDateOrDateRange = (
  value: undefined | string | CustomDate | CustomDateRange,
  availableVariables: VariablesBucket = [],
  relativeAvailableVariables: VariablesBucket = [],
  variableDelimiters: VariableDelimiters = { start: '', end: '' },
): Date | DateRange | undefined => {
  // Undefined
  if (!value) {
    return;
  }
  // Date or DateRange (already well formatted)
  else if (value instanceof Date || isDateRange(value)) {
    return value;
  }
  // Variable reference
  else if (typeof value === 'string') {
    const variableValue = retrieveVariable(value, availableVariables, variableDelimiters)?.value;
    // if a variable is customizable, it can refers to another variable of any type
    // loop to find the variable value as Date or DateRange
    return transformValueToDateOrDateRange(
      variableValue,
      availableVariables,
      relativeAvailableVariables,
      variableDelimiters,
    );
  }
  // RelativeDateRange
  else if (isRelativeDateRange(value)) {
    return transformRelativeDateRangeToDateRange(
      value,
      relativeAvailableVariables,
      variableDelimiters,
    );
  }
  // RelativeDate
  else {
    return transformRelativeDateToDate(value);
  }
};
