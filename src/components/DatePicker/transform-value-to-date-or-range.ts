import { DateTime } from 'luxon';

import { Duration, RelativeDate } from '@/lib/dates';

/*
Transform a relative date object to a readable date
*/
export type RelativeDateObject = {
  date: Date | undefined;
  quantity: number;
  duration: Duration;
};

export const transformRelativeDateObjectToDate = ({
  date,
  quantity,
  duration,
}: RelativeDateObject): Date | undefined => {
  if (!(date instanceof Date)) return;
  const luxonDuration = `${duration}s`; //luxon use duration with 's' at the end, but we don't (maybe we need a refacto for it)
  const dateTime = DateTime.fromJSDate(date, { zone: 'UTC' });
  // calculate date
  return dateTime.plus({ [luxonDuration]: quantity }).toJSDate();
};

/*
Transform a relative date to a readable date
*/
export const transformRelativeDateToDate = (relativeDate: RelativeDate): Date | undefined => {
  // In relative date we always use today as date to update
  const today = new Date(Date.now());
  const date = DateTime.fromJSDate(today, { zone: 'UTC' }).toJSDate();
  // retrieve date from luxon
  return transformRelativeDateObjectToDate({
    ...relativeDate,
    date,
  });
};
