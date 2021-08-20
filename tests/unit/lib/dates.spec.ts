import {
  CUSTOM_DATE_RANGE_LABEL_SEPARATOR,
  dateRangeToString,
  isDateRange,
  isRelativeDateRange,
  RelativeDateRange,
  relativeDateRangeToString,
  relativeDateToString,
} from '@/lib/dates';

describe('dateRangeToString', () => {
  it('should return readable label if value is a partial date range', () => {
    const value = { start: new Date() };
    expect(dateRangeToString(value)).toBe(
      `${value.start.toUTCString()}${CUSTOM_DATE_RANGE_LABEL_SEPARATOR}Invalid Date`,
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
      `${value.start.toUTCString()}${CUSTOM_DATE_RANGE_LABEL_SEPARATOR}${value.end.toUTCString()}`,
    );
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
      `Tomorrow${CUSTOM_DATE_RANGE_LABEL_SEPARATOR}2 months ago`,
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
