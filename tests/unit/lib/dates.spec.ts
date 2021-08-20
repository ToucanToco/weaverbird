import { relativeDateToString } from '@/lib/dates';

describe('relativeDateToString', () => {
  it('should transform a relative date to a readable label', () => {
    expect(relativeDateToString({ quantity: -2, duration: 'month' })).toStrictEqual('2 months ago');
    expect(relativeDateToString({ quantity: -8, duration: 'year' })).toStrictEqual('8 years ago');
    expect(relativeDateToString({ quantity: -7, duration: 'day' })).toStrictEqual('7 days ago');
    expect(relativeDateToString({ quantity: -7, duration: 'day' })).toStrictEqual('7 days ago');
  });
});
