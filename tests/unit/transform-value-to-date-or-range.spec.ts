import { DateTime } from 'luxon';

import {
  RelativeDateObject,
  transformRelativeDateObjectToDate,
  transformRelativeDateRangeToDateRange,
  transformRelativeDateToDate,
} from '@/components/DatePicker/transform-value-to-date-or-range';
import { RelativeDate, RelativeDateRange } from '@/lib/dates';

describe('transformRelativeDateObjectToDate', () => {
  const date = DateTime.utc(2020, 8, 1).toJSDate(); // received date is always an UTC date
  const duration = 'month';
  const quantity = 3;

  it('should return undefined if value is not a date', () => {
    // undefined + 3 months => undefined
    const options: RelativeDateObject = { date: undefined, quantity, duration };
    expect(transformRelativeDateObjectToDate(options)).toBeUndefined();
  });
  it('should return a date for referent relative date object (positive number)', () => {
    // 01/08/2021 + 3 months => 01/11/2021
    const attendedDate = DateTime.utc(2020, 11, 1).toJSDate();
    const options: RelativeDateObject = { date, quantity, duration };
    expect(transformRelativeDateObjectToDate(options)).toStrictEqual(attendedDate);
  });
  it('should return a date for referent relative date object (negative number)', () => {
    // 01/08/2021 - 3 months => 01/05/2021
    const attendedDate = DateTime.utc(2020, 5, 1).toJSDate();
    const options: RelativeDateObject = { date, quantity: quantity * -1, duration };
    expect(transformRelativeDateObjectToDate(options)).toStrictEqual(attendedDate);
  });
});

describe('transformRelativeDateToDate', () => {
  const realNow = Date.now;
  beforeEach(() => {
    const today = DateTime.utc(2020, 7, 3)
      .toJSDate()
      .getTime();
    // today is now 03/07/2020
    global.Date.now = jest.fn(() => today);
  });
  afterEach(() => {
    global.Date.now = realNow;
  });
  // (Today)03/07/2020 + 2 months => 03/09/2020
  it('should return date for passed quantity and duration based on today (positive value)', () => {
    const relativeDate: RelativeDate = { quantity: 2, duration: 'month' };
    const date = DateTime.utc(2020, 9, 3).toJSDate();
    expect(transformRelativeDateToDate(relativeDate)).toStrictEqual(date);
  });

  // (Today)03/07/2020 - 2 months => 03/05/2020
  it('should return date for passed quantity and duration based on today (negative value)', () => {
    const relativeDate: RelativeDate = { quantity: -2, duration: 'month' };
    const date = DateTime.utc(2020, 5, 3).toJSDate();
    expect(transformRelativeDateToDate(relativeDate)).toStrictEqual(date);
  });
});

describe('transformRelativeDateRangeToDateRange', () => {
  const availableVariables = [
    { identifier: 'date', value: DateTime.utc(2020, 7, 3).toJSDate(), label: 'Date' },
    { identifier: 'notadate', value: 'nop', label: 'Not a date' },
  ];
  const variableDelimiters = { start: '{{', end: '}}' };
  it("should return undefined if variable doesn't exist", () => {
    const relativeDateRange: RelativeDateRange = {
      date: '{{toto}}',
      quantity: -2,
      duration: 'month',
    };
    expect(
      transformRelativeDateRangeToDateRange(
        relativeDateRange,
        availableVariables,
        variableDelimiters,
      ),
    ).toBeUndefined();
  });
  it('should return undefined if variable value is not a date', () => {
    const relativeDateRange: RelativeDateRange = {
      date: '{{notadate}}',
      quantity: -2,
      duration: 'month',
    };
    expect(
      transformRelativeDateRangeToDateRange(
        relativeDateRange,
        availableVariables,
        variableDelimiters,
      ),
    ).toBeUndefined();
  });
  it('should return date for passed quantity and duration based on variable date', () => {
    // ({{date}}) 03/07/2020 - 3 months => 03/04/2020
    const relativeDateRange: RelativeDateRange = {
      date: '{{date}}',
      quantity: -3,
      duration: 'month',
    };
    const start = availableVariables[0].value;
    const end = DateTime.utc(2020, 4, 3).toJSDate();
    expect(
      transformRelativeDateRangeToDateRange(
        relativeDateRange,
        availableVariables,
        variableDelimiters,
      ),
    ).toStrictEqual({ start, end });
  });
});
