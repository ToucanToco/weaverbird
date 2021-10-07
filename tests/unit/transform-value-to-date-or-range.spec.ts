import { DateTime } from 'luxon';

import {
  RelativeDateObject,
  transformRelativeDateObjectToDate,
} from '@/components/DatePicker/transform-value-to-date-or-range';

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
