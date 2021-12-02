/*
  This module enable to update the method used when the sendAnalytics method is called in the app
  It would do nothing by default

  You can set the function to use to send analytics by using the `defineSendAnalytics`
  it will retrieve two parameters:
  - name: string (the name of the referent event. ex: 'Save step xxx'
  - value: any (the data refering to this event that can be of any type depending on the context)
*/

type SendAnalyticsManager = (_params: any) => void;

let sendAnalytics: SendAnalyticsManager = (_params: any) => {};

function defineSendAnalytics(sendAnalyticsManager: SendAnalyticsManager) {
  sendAnalytics = sendAnalyticsManager;
}

export { sendAnalytics, defineSendAnalytics };
