import type { DataSetColumnType } from '@/types';

export function formatCellValue(value: any, type?: DataSetColumnType): string {
  switch (type) {
    case 'date':
      return dateToHumanReadable(value);
    case 'time':
      return millisecondsToHumanReadable(value);
    // 'object' after 'date' and 'time' because they are also objects
    case 'object':
      return JSON.stringify(value);
    default:
      return value.toString();
  }
}

function dateToHumanReadable(date: Date): string {
    // 1970-01-02T10:12:03.123Z => 1970-01-02 10:12:03.123
    return date.toISOString().replace('T', ' ').slice(0, -1)
}

const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_MINUTE = MILLISECONDS_PER_SECOND * 60;
const MILLISECONDS_PER_HOUR = MILLISECONDS_PER_MINUTE * 60;
const MILLISECONDS_PER_DAY = MILLISECONDS_PER_HOUR * 24;

function millisecondsToHumanReadable(ms: number): string {
  const numDays = Math.floor(ms / MILLISECONDS_PER_DAY);
  ms -= numDays * MILLISECONDS_PER_DAY;
  const numHours = Math.floor(ms / MILLISECONDS_PER_HOUR);
  ms -= numHours * MILLISECONDS_PER_HOUR;
  const numMinutes = Math.floor(ms / MILLISECONDS_PER_MINUTE);
  ms -= numMinutes * MILLISECONDS_PER_MINUTE;
  const numSeconds = Math.floor(ms / MILLISECONDS_PER_SECOND);
  ms -= numSeconds * MILLISECONDS_PER_SECOND;

  // represent hours, minutes and seconds as HH:MM:SS
  const numHoursStr = numHours.toLocaleString(undefined, {minimumIntegerDigits: 2});
  const numMinutesStr = numMinutes.toLocaleString(undefined, {minimumIntegerDigits: 2});
  const numSecondsStr = numSeconds.toLocaleString(undefined, {minimumIntegerDigits: 2});
  const numMillisecondsStr = ms.toLocaleString(undefined, {minimumIntegerDigits: 3});

  return `${numDays}d ${numHoursStr}:${numMinutesStr}:${numSecondsStr}.${numMillisecondsStr}`;
}
