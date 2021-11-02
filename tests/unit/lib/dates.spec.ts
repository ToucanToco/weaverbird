import {
  CUSTOM_DATE_RANGE_LABEL_SEPARATOR,
  dateRangeToString,
  dateToString,
  isDateRange,
  isRelativeDateRange,
  RelativeDateRange,
  relativeDateRangeToString,
  relativeDateToString,
} from '@/lib/dates';

describe('dateToString', () => {
  it('should return a date formatted with UTC timezone', () => {
    const date = new Date(1);
    expect(dateToString(date)).toStrictEqual(
      date.toLocaleDateString(undefined, { timeZone: 'UTC' }),
    );
  });
});

describe('dateRangeToString', () => {
  it('should return readable label if value is a partial date range', () => {
    const value = { start: new Date() };
    expect(dateRangeToString(value)).toBe(
      `${dateToString(value.start)}${CUSTOM_DATE_RANGE_LABEL_SEPARATOR}Invalid Date`,
    );
  });
  it('should return readable label if value is a full undefined date range', () => {
    const value = { start: undefined, end: undefined };
    expect(dateRangeToString(value)).toBe(
      `Invalid Date${CUSTOM_DATE_RANGE_LABEL_SEPARATOR}Invalid Date`,
    );
  });
  it('should return readable label if value is a full date range', () => {
    const value = { start: new Date(), end: new Date(1) };
    expect(dateRangeToString(value)).toBe(
      `${dateToString(value.start)}${CUSTOM_DATE_RANGE_LABEL_SEPARATOR}${dateToString(value.end)}`,
    );
  });

  describe('for year ranges', () => {
    it('should return the year number', () => {
      expect(
        dateRangeToString({
          start: new Date('2021-01-01T00:00:00.000Z'),
          end: new Date('2021-12-31T23:59:59.999Z'),
          duration: 'year',
        }),
      ).toBe('2021');
    });
  });

  describe('for month ranges', () => {
    it('should return the month name and year', () => {
      expect(
        dateRangeToString({
          start: new Date('2021-10-01T00:00:00.000Z'),
          end: new Date('2021-10-31T23:59:59.999Z'),
          duration: 'month',
        }),
      ).toBe('October 2021');
    });
  });

  describe('for quarter ranges', () => {
    it('should return the month name and year', () => {
      expect(
        dateRangeToString({
          start: new Date('2021-10-01T00:00:00.000Z'),
          end: new Date('2021-12-31T23:59:59.999Z'),
          duration: 'quarter',
        }),
      ).toBe('Quarter 4 2021');
    });
  });

  describe('for week ranges', () => {
    it('should return the week number and year', () => {
      expect(
        dateRangeToString({
          start: new Date('2021-10-18T00:00:00.000Z'),
          end: new Date('2021-10-24T23:59:59.999Z'),
          duration: 'week',
        }),
      ).toBe('Week 42 2021');
    });

    it('should use the ISO year number (for weeks overlapping 2 years)', () => {
      expect(
        dateRangeToString({
          start: new Date('2019-12-30T00:00:00.000Z'),
          end: new Date('2019-01-05T23:59:59.999Z'),
          duration: 'week',
        }),
      ).toBe('Week 1 2020');

      expect(
        dateRangeToString({
          start: new Date('2021-12-27T00:00:00.000Z'),
          end: new Date('2022-01-22T23:59:59.999Z'),
          duration: 'week',
        }),
      ).toBe('Week 52 2021');
    });
  });

  describe('for day ranges', () => {
    it('should return the medium representation of the day', () => {
      expect(
        dateRangeToString({
          start: new Date('2021-10-20T00:00:00.000Z'),
          end: new Date('2021-10-20T23:59:59.999Z'),
          duration: 'day',
        }),
      ).toBe('Oct 20, 2021');
    });

    it('should return a short representation of start and end days', () => {
      expect(
        dateRangeToString({
          start: new Date('2021-10-20T00:00:00.000Z'),
          end: new Date('2021-10-21T23:59:59.999Z'),
          duration: 'day',
        }),
      ).toBe('10/20/2021 - 10/21/2021');
    });
  });
});

describe('relativeDateToString', () => {
  it('should transform a relative date to a readable label', () => {
    expect(relativeDateToString({ quantity: -2, duration: 'month' })).toStrictEqual('2 months ago');
    expect(relativeDateToString({ quantity: -8, duration: 'year' })).toStrictEqual('8 years ago');
    expect(relativeDateToString({ quantity: -7, duration: 'day' })).toStrictEqual('7 days ago');
    expect(relativeDateToString({ quantity: -7, duration: 'day' })).toStrictEqual('7 days ago');
  });
});

describe('relativeDateRangeToString', () => {
  const variableDelimiters = { start: '{{', end: '}}' };
  const SAMPLE_VARIABLES = [
    { label: 'Today', identifier: 'today', value: '' },
    { label: 'Tomorrow', identifier: 'tomorrow', value: '' },
  ];
  it('should transform a relative date range to a readable label', () => {
    const value: RelativeDateRange = { date: '{{tomorrow}}', quantity: -2, duration: 'month' };
    expect(relativeDateRangeToString(value, SAMPLE_VARIABLES, variableDelimiters)).toStrictEqual(
      `2 months before${CUSTOM_DATE_RANGE_LABEL_SEPARATOR}Tomorrow`,
    );

    const value2: RelativeDateRange = { date: '{{tomorrow}}', quantity: 2, duration: 'month' };
    expect(relativeDateRangeToString(value2, SAMPLE_VARIABLES, variableDelimiters)).toStrictEqual(
      `Tomorrow${CUSTOM_DATE_RANGE_LABEL_SEPARATOR}2 months after`,
    );
  });
});

describe('isRelativeDateRange', () => {
  it('should return false if value is not a relative date range', () => {
    expect(isRelativeDateRange('{{today}}')).toBe(false);
    expect(isRelativeDateRange({ start: new Date() })).toBe(false);
  });
  it('should return true if value is a relative date range', () => {
    expect(isRelativeDateRange({ date: '{{today}}', quantity: -2, duration: 'year' })).toBe(true);
  });
});

describe('isDateRange', () => {
  it('should return false if value is not a date range', () => {
    expect(isDateRange('{{today}}')).toBe(false);
    expect(isDateRange({ date: '{{today}}', quantity: -2, duration: 'year' })).toBe(false);
  });
  it('should return true if value is an empty date range', () => {
    expect(isDateRange({})).toBe(true);
  });
  it('should return true if value is a partial date range', () => {
    expect(isDateRange({ start: new Date() })).toBe(true);
    expect(isDateRange({ end: new Date() })).toBe(true);
  });
  it('should return true if value is a full undefined date range', () => {
    expect(isDateRange({ start: undefined, end: undefined })).toBe(true);
  });
  it('should return true if value is a full date range', () => {
    expect(isDateRange({ start: new Date(), end: new Date(1) })).toBe(true);
  });
});
