import { DateTime } from 'luxon';

import {
  setDateRangeHours,
  transformRelativeDateObjectToDate,
  transformRelativeDateRangeToDateRange,
  transformRelativeDateToDate,
  transformValueToDate,
  transformValueToDateRange,
} from '@/components/DatePicker/transform-value-to-date-or-range';
import { DateRange, RelativeDate, RelativeDateRange } from '@/lib/dates';

describe('transformRelativeDateObjectToDate', () => {
  const date = DateTime.utc(2020, 8, 1).toJSDate(); // received date is always an UTC date
  const duration = 'month';
  const quantity = 3;
  it('should return a date for referent relative date object (positive number)', () => {
    // 01/08/2021 + 3 months => 01/11/2021
    const expectedDate = DateTime.utc(2020, 11, 1).toJSDate();
    expect(transformRelativeDateObjectToDate({ date, quantity, duration })).toStrictEqual(
      expectedDate,
    );
  });
  it('should return a date for referent relative date object (negative number)', () => {
    // 01/08/2021 - 3 months => 01/05/2021
    const expectedDate = DateTime.utc(2020, 5, 1).toJSDate();
    expect(
      transformRelativeDateObjectToDate({ date, quantity: quantity * -1, duration }),
    ).toStrictEqual(expectedDate);
  });
});

describe('setDateRangeHours', () => {
  it('should return undefined if value is not a date range', () => {
    const value = undefined;
    expect(setDateRangeHours(value)).toBeUndefined();
  });
  it('should return undefined if value is not a complete date range', () => {
    const value = {
      start: DateTime.utc(2020, 5, 1).toJSDate(),
    };
    expect(setDateRangeHours(value)).toBeUndefined();
  });
  it('should return a included date range (00:00 at start and 23:59 at end)', () => {
    const value = {
      start: DateTime.utc(2020, 5, 1).toJSDate(),
      end: DateTime.utc(2020, 5, 1).toJSDate(),
    };
    const attendedValue = {
      start: DateTime.utc(2020, 5, 1, 0, 0, 0, 0).toJSDate(),
      end: DateTime.utc(2020, 5, 1, 23, 59, 0, 0).toJSDate(),
    };
    expect(setDateRangeHours(value)).toStrictEqual(attendedValue);
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
  it('should return date range for passed quantity and duration based on variable date (negative number)', () => {
    // ({{date}}) 03/07/2020 - 3 months => 03/04/2020 (start and end should be inverted to use min date as start)
    const relativeDateRange: RelativeDateRange = {
      date: '{{date}}',
      quantity: -3,
      duration: 'month',
    };
    const start = DateTime.utc(2020, 4, 3).toJSDate();
    const end = availableVariables[0].value;
    expect(
      transformRelativeDateRangeToDateRange(
        relativeDateRange,
        availableVariables,
        variableDelimiters,
      ),
    ).toStrictEqual({ start, end });
  });
  it('should return date range for passed quantity and duration based on variable date (positive number)', () => {
    // ({{date}}) 03/07/2020 + 3 months => 03/10/2020
    const relativeDateRange: RelativeDateRange = {
      date: '{{date}}',
      quantity: 3,
      duration: 'month',
    };
    const start = availableVariables[0].value;
    const end = DateTime.utc(2020, 10, 3).toJSDate();
    expect(
      transformRelativeDateRangeToDateRange(
        relativeDateRange,
        availableVariables,
        variableDelimiters,
      ),
    ).toStrictEqual({ start, end });
  });
});

describe('transformValue', () => {
  const variableDelimiters = { start: '{{', end: '}}' };
  const relativeAvailableVariables = [
    { identifier: 'hello', value: DateTime.utc(2020, 10, 20).toJSDate(), label: 'Today' },
  ];
  const availableVariables = [
    { identifier: 'date', value: DateTime.utc(2020, 7, 3).toJSDate(), label: 'Date' },
    {
      identifier: 'date-range',
      value: {
        start: DateTime.utc(2020, 7, 3).toJSDate(),
        end: DateTime.utc(2020, 9, 3).toJSDate(),
      },
      label: 'Date Range',
    },
    {
      identifier: 'relative-date',
      value: { quantity: -2, duration: 'month' },
      label: 'Relative date',
    },
    {
      identifier: 'relative-date-range',
      value: { date: '{{hello}}', quantity: -2, duration: 'month' },
      label: 'Relative date range',
    },
    {
      identifier: 'reference-to-date-variable',
      value: '{{date}}',
      label: 'Reference to date variable',
    },
    {
      identifier: 'reference-to-date-range-variable',
      value: '{{date-range}}',
      label: 'Reference to date range variable',
    },
  ];

  const realNow = Date.now;
  const today = DateTime.utc(2020, 7, 3).toJSDate();
  beforeEach(() => {
    // today is now 03/07/2020
    global.Date.now = jest.fn(() => today.getTime());
  });
  afterEach(() => {
    global.Date.now = realNow;
  });

  describe('...toDate', () => {
    it('should return undefined if value is undefined', () => {
      expect(
        transformValueToDate(
          undefined,
          availableVariables,
          relativeAvailableVariables,
          variableDelimiters,
        ),
      ).toBeUndefined();
    });
    it('should return value if value is already a date', () => {
      const value = DateTime.utc(2020, 7, 3).toJSDate();
      expect(
        transformValueToDate(
          value,
          availableVariables,
          relativeAvailableVariables,
          variableDelimiters,
        ),
      ).toStrictEqual(value);
    });
    it('should return a date if value is a relative date', () => {
      // (Today)03/07/2020 + 2 months => 03/09/2020
      const value: RelativeDate = { quantity: 2, duration: 'month' };
      const attendedValue = DateTime.utc(2020, 9, 3).toJSDate();
      expect(
        transformValueToDate(
          value,
          availableVariables,
          relativeAvailableVariables,
          variableDelimiters,
        ),
      ).toStrictEqual(attendedValue);
    });
    describe('variable', () => {
      it("should return undefined if variable doesn't exist", () => {
        const value = '{{notexisting}}';
        expect(
          transformValueToDate(
            value,
            availableVariables,
            relativeAvailableVariables,
            variableDelimiters,
          ),
        ).toBeUndefined();
      });
      it('should return a date if variable value is a date', () => {
        const value = '{{date}}';
        const attendedValue = availableVariables[0].value;
        expect(
          transformValueToDate(
            value,
            availableVariables,
            relativeAvailableVariables,
            variableDelimiters,
          ),
        ).toStrictEqual(attendedValue);
      });
      it('should return a date if variable value is a relative date', () => {
        const value = '{{relative-date}}';
        const attendedValue = transformRelativeDateToDate(
          availableVariables[2].value as RelativeDate,
        );
        expect(
          transformValueToDate(
            value,
            availableVariables,
            relativeAvailableVariables,
            variableDelimiters,
          ),
        ).toStrictEqual(attendedValue);
      });
      // if a variable is customizable, it can refers to another variable of any type
      it('should return the corresponding variable value as date if variable value is another variable reference', () => {
        const value = '{{reference-to-date-variable}}'; // reference to {{date}} variable
        const attendedValue = availableVariables[0].value; // {{date}} value
        expect(
          transformValueToDate(
            value,
            availableVariables,
            relativeAvailableVariables,
            variableDelimiters,
          ),
        ).toStrictEqual(attendedValue);
      });
    });
  });
  describe('...toDateRange', () => {
    it('should return undefined if value is undefined', () => {
      expect(
        transformValueToDateRange(
          undefined,
          availableVariables,
          relativeAvailableVariables,
          variableDelimiters,
        ),
      ).toBeUndefined();
    });
    it('should return value if value is already a date range', () => {
      const value = {
        start: DateTime.utc(2020, 7, 3).toJSDate(),
        end: DateTime.utc(2020, 9, 3).toJSDate(),
      };
      expect(
        transformValueToDateRange(
          value,
          availableVariables,
          relativeAvailableVariables,
          variableDelimiters,
        ),
      ).toStrictEqual(setDateRangeHours(value));
    });
    it('should return a date range if value is a relative date range', () => {
      // ({{hello}}) 20/10/2020 - 3 months => 20/07/2020
      const value: RelativeDateRange = { date: 'hello', quantity: -3, duration: 'month' };
      const attendedValue = transformRelativeDateRangeToDateRange(
        value,
        relativeAvailableVariables,
        variableDelimiters,
      );
      expect(
        transformValueToDateRange(
          value,
          availableVariables,
          relativeAvailableVariables,
          variableDelimiters,
        ),
      ).toStrictEqual(setDateRangeHours(attendedValue));
    });
    describe('variable', () => {
      it("should return undefined if variable doesn't exist", () => {
        const value = '{{notexisting}}';
        expect(
          transformValueToDateRange(
            value,
            availableVariables,
            relativeAvailableVariables,
            variableDelimiters,
          ),
        ).toBeUndefined();
      });
      it('should return a date range if variable value is a date range', () => {
        const value = '{{date-range}}';
        const attendedValue = availableVariables[1].value as DateRange;
        expect(
          transformValueToDateRange(
            value,
            availableVariables,
            relativeAvailableVariables,
            variableDelimiters,
          ),
        ).toStrictEqual(setDateRangeHours(attendedValue));
      });
      it('should return a date range if variable value is a relative date range', () => {
        const value = '{{relative-date-range}}';
        const attendedValue = transformRelativeDateRangeToDateRange(
          availableVariables[3].value as RelativeDateRange,
          relativeAvailableVariables,
          variableDelimiters,
        );
        expect(
          transformValueToDateRange(
            value,
            availableVariables,
            relativeAvailableVariables,
            variableDelimiters,
          ),
        ).toStrictEqual(setDateRangeHours(attendedValue));
      });
      // if a variable is customizable, it can refers to another variable of any type
      it('should return the corresponding variable value as date range if variable value is another variable reference', () => {
        const value = '{{reference-to-date-range-variable}}'; // reference to {{date}} variable
        const attendedValue = availableVariables[1].value as DateRange; // {{date-range}} value
        expect(
          transformValueToDateRange(
            value,
            availableVariables,
            relativeAvailableVariables,
            variableDelimiters,
          ),
        ).toStrictEqual(setDateRangeHours(attendedValue));
      });
    });
  });
});
