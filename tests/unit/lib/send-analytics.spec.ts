import { defineSendAnalytics, sendAnalytics } from '@/lib/send-analytics';

describe('defineSendAnalytics', () => {
  it('should populate the send analytics method', () => {
    const sendAnalyticsManager = (name: string, value: any) =>
      `i will do anything you want! ${name} :: ${value}`;
    defineSendAnalytics(sendAnalyticsManager);
    // verify that method has been populate
    expect(sendAnalytics('analytics', 'plop')).toEqual(sendAnalyticsManager('analytics', 'plop'));
    // verify that params are retrieved
    expect(sendAnalytics('analytics', 'plop')).toEqual(
      'i will do anything you want! analytics :: plop',
    );
  });
});
