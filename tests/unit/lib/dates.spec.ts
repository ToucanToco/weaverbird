import { isDateRange, isRelativeDateRange, relativeDateToString } from '@/lib/dates';

describe('relativeDateToString', () => {
  it('should transform a relative date to a readable label', () => {
    expect(relativeDateToString({ quantity: -2, duration: 'month' })).toStrictEqual('2 months ago');
    expect(relativeDateToString({ quantity: -8, duration: 'year' })).toStrictEqual('8 years ago');
    expect(relativeDateToString({ quantity: -7, duration: 'day' })).toStrictEqual('7 days ago');
    expect(relativeDateToString({ quantity: -7, duration: 'day' })).toStrictEqual('7 days ago');
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
