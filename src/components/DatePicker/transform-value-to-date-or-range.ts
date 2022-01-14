import { DateTime } from 'luxon';

import { DateRange, isDateRange, RELATIVE_DATE_OPERATORS, RelativeDate } from '@/lib/dates';
import { retrieveVariable, VariableDelimiters, VariablesBucket } from '@/lib/variables';

/*
Based on date property generate a new `Date` by adding selected quantity of duration (day, month, year...)

If the `exclusive` option is set, add/remove 1 millisecond to the computed date, so the bound of the period will not be included
*/

export const transformRelativeDateObjectToDate = (
  { date, quantity, duration }: Omit<RelativeDate, 'date'> & { date: Date },
  exclusive = false,
): Date => {
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
  return dateTime
    .plus({
      [luxonDuration]: quantity,
      milliseconds: exclusive ? -1 * Math.sign(quantity) : 0,
    })
    .toJSDate();
};

/*
Read a `RelativeDate` and find the corresponding `Date` relative to the variable passed as `date` property.
*/
export const transformRelativeDateToDate = (
  relativeDate: RelativeDate,
  relativeAvailableVariables: VariablesBucket = [],
  variableDelimiters: VariableDelimiters = { start: '', end: '' },
): Date | undefined => {
  // retrieve relative date variable value in order to use it to calculate date
  const value = retrieveVariable(relativeDate.date, relativeAvailableVariables, variableDelimiters)
    ?.value;
  if (!(value instanceof Date)) return;

  const operator = RELATIVE_DATE_OPERATORS[relativeDate.operator];

  // pass base date to UTC
  const base = DateTime.fromJSDate(value, { zone: 'UTC' }).toJSDate();

  // retrieve end date from luxon
  const targetDateTime = transformRelativeDateObjectToDate({
    ...relativeDate,
    quantity: Math.sign(operator.sign) * Math.abs(relativeDate.quantity),
    date: base,
  });

  return DateTime.fromJSDate(targetDateTime, { zone: 'UTC' }).toJSDate();
};

/*
Read a `RelativeDate` and find the corresponding `Date` relative to the variable passed as `date` property.
*/
export const transformRelativeDateToDateRange = (
  relativeDate: RelativeDate,
  relativeAvailableVariables: VariablesBucket = [],
  variableDelimiters: VariableDelimiters = { start: '', end: '' },
): DateRange | undefined => {
  // retrieve relative date variable value in order to use it to calculate date
  const value = retrieveVariable(relativeDate.date, relativeAvailableVariables, variableDelimiters)
    ?.value;
  if (!(value instanceof Date)) return;

  const operator = RELATIVE_DATE_OPERATORS[relativeDate.operator];

  // pass base date to UTC
  const base = DateTime.fromJSDate(value, { zone: 'UTC' })
    .set(
      // Base day should be included in full
      // so if the range starts with the base day, its time should be 00:00
      // but if the range ends with the base day, its time should be 23:59
      relativeDate.operator === 'from'
        ? {}
        : { hour: 23, minute: 59, second: 59, millisecond: 999 },
    )
    .toJSDate();

  // retrieve end date from luxon
  const targetDateTime = transformRelativeDateObjectToDate(
    {
      ...relativeDate,
      quantity: Math.sign(operator.sign) * Math.abs(relativeDate.quantity),
      date: base,
    },
    true, // ensure we add or remove 1ms so that the target day is not included
  );

  const target = DateTime.fromJSDate(targetDateTime, { zone: 'UTC' }).toJSDate();

  // if quantity is negative, target will arrive before base
  const quantityIsPositive = operator.sign > 0;
  const [start, end] = quantityIsPositive ? [base, target] : [target, base];
  return { start, end };
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
{ date: 'variable_name', quantity: 2, duration: 'month', operator: 'from' } ->  new Date(variable_name.value).plus(2 month)
{ date: 'variable_name', quantity: 2, duration: 'month', operator: 'until' } ->  new Date(variable_name.value).minus(2 month)
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
    return transformRelativeDateToDate(value, relativeAvailableVariables, variableDelimiters);
  }
};

/*
Resolve any date range configuration to a `DateRange`.
The possible configurations can be:
- `string`: a reference to a variable - it's current value will be used
- `DateRange`: no change
- `RelativeDate`: resolved with the variable passed as date property

Here are all the transformations that can be performed:

Undefined
undefined -> undefined

// Date range
{ start: new Date(), end: new Date() } -> { start: new Date(), end: new Date() }

// RelativeDate
{ date: 'variable_name', quantity: 2, duration: 'month', operator: 'from' } ->  { start: new Date(variable_name.value), end: new Date(variable_name.value).plus(2 month) }
{ date: 'variable_name', quantity: 2, duration: 'month', operator: 'until' } ->  { start: new Date(variable_name.value).minus(2 month), end: new Date(variable_name.value) }
*/
export const transformValueToDateRange = (
  value: undefined | string | RelativeDate | DateRange,
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
  // RelativeDate
  else {
    dateRange = transformRelativeDateToDateRange(
      value,
      relativeAvailableVariables,
      variableDelimiters,
    );
  }
  return setDateRangeHours(dateRange);
};
