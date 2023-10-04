import type { DataSetColumnType } from '@/types';

export function formatCellValue(value: any, type?: DataSetColumnType): string {
  switch (type) {
    case 'date':
      return value.toString();
    case 'time':
      return millisecondsToHumanReadable(value);
    // 'object' after 'date' and 'time' because they are also objects
    case 'object':
      return JSON.stringify(value);
    default:
      return value.toString();
  }
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

  let readableStr = '';

  // if we have days, we start with them
  if (numDays === 1) {
    readableStr += '1 day ';
  } else if (numDays > 1) {
    readableStr += `${numDays} days `;
  }

  // represent hours, minutes and seconds as HH:MM:SS
  const numHoursStr = numHours.toLocaleString(undefined, {minimumIntegerDigits: 2});
  const numMinutesStr = numMinutes.toLocaleString(undefined, {minimumIntegerDigits: 2});
  const numSecondsStr = numSeconds.toLocaleString(undefined, {minimumIntegerDigits: 2});
  readableStr += `${numHoursStr}:${numMinutesStr}:${numSecondsStr}`;

  // if we have milliseconds, we append them as HH.MM.SS.mmm
  if (ms > 0) {
    const numMillisecondsStr = ms.toLocaleString(undefined, {minimumIntegerDigits: 3});
    readableStr += `.${numMillisecondsStr}`;
  }


  return readableStr;
}
