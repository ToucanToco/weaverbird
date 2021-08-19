import { transformRelativeDateToReadableLabel } from '@/lib/dates';

describe('transformRelativeDateToReadableLabel', () => {
  it('should transform a relative date to a readable label', () => {
    expect(
      transformRelativeDateToReadableLabel({ date: new Date(), quantity: -2, duration: 'month' }),
    ).toStrictEqual('2 months ago');
    expect(
      transformRelativeDateToReadableLabel({ date: new Date(), quantity: -8, duration: 'year' }),
    ).toStrictEqual('8 years ago');
    expect(
      transformRelativeDateToReadableLabel({ date: new Date(), quantity: -7, duration: 'day' }),
    ).toStrictEqual('7 days ago');
  });
});
