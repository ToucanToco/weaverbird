import { DateTime } from 'luxon';

import { DateRange, Duration, isDateRange, RelativeDate, RelativeDateRange } from '@/lib/dates';
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

export const setDateRangeHours = (value: DateRange | string | undefined): DateRange | undefined => {
  if (!isDateRange(value) || !value.start || !value.end) return;
  const startHours = { hour: 0, minute: 0, second: 0, millisecond: 0 };
  const endHours = { hour: 23, minute: 59, second: 0, millisecond: 0 };
  return {
    start: DateTime.fromJSDate(value.start, { zone: 'UTC' })
      .set(startHours)
      .toJSDate(),
    end: DateTime.fromJSDate(value.end, { zone: 'UTC' })
      .set(endHours)
      .toJSDate(),
  };
};
/*
Transform a value of any date type (string(Variable), Date, RelativeDate)) to a Date

Here are all the cases of transformation enabled to be performed:

Undefined
undefined -> undefined

// Date
new Date() -> new Date()

// Relative Date (always refering to today)
{ quantity: 2, duration: 'month' } -> new Date().plus(2 month)
{ quantity: 2, duration: 'month' } -> new Date().minus(2 month)

// Variable
A variable can contain another variable reference (string) in this case will will iterate to find the last occurence of date value
Or one of the value type precise below but in any case, it will return a Date or undefined if variable does'nt exist
*/
export const transformValueToDate = (
  value: undefined | string | Date | RelativeDate,
  availableVariables: VariablesBucket = [],
  relativeAvailableVariables: VariablesBucket = [],
  variableDelimiters: VariableDelimiters = { start: '', end: '' },
): Date | undefined => {
  // Undefined
  if (!value) {
    return;
  }
  // Date (already well formatted)
  else if (value instanceof Date) {
    return value;
  }
  // Variable reference
  else if (typeof value === 'string') {
    const variableValue = retrieveVariable(value, availableVariables, variableDelimiters)?.value;
    // if a variable is customizable, it can refers to another variable of any type
    // loop to find the variable value as Date or DateRange
    return transformValueToDate(
      variableValue,
      availableVariables,
      relativeAvailableVariables,
      variableDelimiters,
    );
  }
  // RelativeDate
  else {
    return transformRelativeDateToDate(value);
  }
};

/*
Transform a value of any date available types (string(Variable), DateRange, RelativeDateRange) to a DateRange
All date range are formatted with a start date hours are 00:00 and end date hour are 23:59
Here are all the cases of transformation enabled to be performed:

Undefined
undefined -> undefined

// Date range
{ start: new Date(), end: new Date() } -> { start: new Date(), end: new Date() }

// Relative Date range
{ date: 'variable_name', quantity: 2, duration: 'month' } ->  { start: new Date(variable_name.value), end: new Date(variable_name.value).plus(2 month) }
{ date: 'variable_name', quantity: -2, duration: 'month' } ->  { start: new Date(variable_name.value).minus(2 month), end: new Date(variable_name.value) }

// Variable
A variable can contain another variable reference (string) in this case will will iterate to find the last occurence of date value
Or one of the value type precise below but in any case, it will return a DateRange or undefined if variable does'nt exist
*/
export const transformValueToDateRange = (
  value: undefined | string | RelativeDateRange | DateRange,
  availableVariables: VariablesBucket = [],
  relativeAvailableVariables: VariablesBucket = [],
  variableDelimiters: VariableDelimiters = { start: '', end: '' },
): DateRange | undefined => {
  let dateRange: DateRange | undefined;
  // Undefined
  if (!value) {
    return;
  }
  // DateRange (already well formatted)
  else if (isDateRange(value)) {
    dateRange = value;
  }
  // Variable reference
  else if (typeof value === 'string') {
    const variableValue = retrieveVariable(value, availableVariables, variableDelimiters)?.value;
    // if a variable is customizable, it can refers to another variable of any type
    // loop to find the variable value as Date or DateRange
    dateRange = transformValueToDateRange(
      variableValue,
      availableVariables,
      relativeAvailableVariables,
      variableDelimiters,
    );
  }
  // RelativeDateRange
  else {
    dateRange = transformRelativeDateRangeToDateRange(
      value,
      relativeAvailableVariables,
      variableDelimiters,
    );
  }
  return setDateRangeHours(dateRange);
};
