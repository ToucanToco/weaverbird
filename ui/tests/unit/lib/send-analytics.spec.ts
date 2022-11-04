import { defineSendAnalytics, sendAnalytics } from '@/lib/send-analytics';

describe('defineSendAnalytics', () => {
  it('should populate the send analytics method', () => {
    const sendAnalyticsManager = ({ name, value }: { name: string; value: any }) =>
      `i will do anything you want! ${name} :: ${value}`;
    defineSendAnalytics(sendAnalyticsManager);
    // verify that the exported sendAnalytics method has been changed
    expect(sendAnalytics({ name: 'analytics', value: 'plop' })).toEqual(
      sendAnalyticsManager({ name: 'analytics', value: 'plop' }),
    );
    // verify that params are retrieved
    expect(sendAnalytics({ name: 'analytics', value: 'plop' })).toEqual(
      'i will do anything you want! analytics :: plop',
    );
  });
});
