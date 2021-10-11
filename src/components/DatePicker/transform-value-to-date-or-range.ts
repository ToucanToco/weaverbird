import { DateTime } from 'luxon';

import { DateRange, isDateRange, RelativeDate, RelativeDateRange } from '@/lib/dates';
import { retrieveVariable, VariableDelimiters, VariablesBucket } from '@/lib/variables';

/*
Based on date property generate a new `Date` by adding selected quantity of duration (day, month, year...)
*/

export const transformRelativeDateObjectToDate = ({
  date,
  quantity,
  duration,
}: RelativeDate & { date: Date }): Date => {
  const RELATIVE_DATE_DURATION_TO_LUXON = {
    day: 'days',
    week: 'weeks',
    month: 'months',
    quarter: 'quarters',
    year: 'years',
  };
  const luxonDuration: string = RELATIVE_DATE_DURATION_TO_LUXON[duration];
  const dateTime = DateTime.fromJSDate(date, { zone: 'UTC' });
  // calculate date
  return dateTime.plus({ [luxonDuration]: quantity }).toJSDate();
};

/*
Read a `RelativeDate` and find the corresponding `Date` relative to the moment of execution.
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
Read a `RelativeDateRange` and find the corresponding `Date` relative to the variable passed as `date` property.
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
  const endHours = { hour: 23, minute: 59, second: 59, millisecond: 999 };
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
Resolve any date configuration to a fixed `Date`.
The possible configurations can be:
- `string`: a reference to a variable - it's current value will be used
- `Date`: no change
- `RelativeDate`: resolved with the current moment

Here are all the transformations that can be performed:

Undefined
undefined -> undefined

// Date
new Date() -> new Date()

// Relative Date (always refering to today)
{ quantity: 2, duration: 'month' } -> new Date().plus(2 month)
{ quantity: 2, duration: 'month' } -> new Date().minus(2 month)
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
Resolve any date range configuration to a `DateRange`.
The possible configurations can be:
- `string`: a reference to a variable - it's current value will be used
- `DateRange`: no change
- `RelativeDateRange`: resolved with the variable passed as date property

Here are all the transformations that can be performed:

Undefined
undefined -> undefined

// Date range
{ start: new Date(), end: new Date() } -> { start: new Date(), end: new Date() }

// Relative Date range
{ date: 'variable_name', quantity: 2, duration: 'month' } ->  { start: new Date(variable_name.value), end: new Date(variable_name.value).plus(2 month) }
{ date: 'variable_name', quantity: -2, duration: 'month' } ->  { start: new Date(variable_name.value).minus(2 month), end: new Date(variable_name.value) }
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
