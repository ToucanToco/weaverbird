import { DateTime } from 'luxon';

import { DateRange } from '@/lib/dates';
import t, { DEFAULT_LOCALE, LocaleIdentifier } from '@/lib/internationalization';

// Types

export type GranularityConfig = {
  navRange: {
    label: (dt: DateTime, locale?: LocaleIdentifier) => string;
    prev: (dt: DateTime) => DateTime;
    next: (dt: DateTime) => DateTime;
  };
  selectableRanges: {
    label: (dt: DateTime, locale?: LocaleIdentifier) => string;
    description: (range: Required<DateRange>, locale?: LocaleIdentifier) => string;
    currentOptions: (currentNavRangeStart: DateTime) => DateTime[];
    optionToRange: (selectedOption: DateTime) => Required<DateRange>;
    rangeToOption: (selectedRangeStart: Date) => DateTime;
  };
};

export type AvailableDuration = 'year' | 'quarter' | 'month' | 'week';

// Navigations

export const WEEK_NAV = {
  label: (dt: DateTime, locale?: LocaleIdentifier): string => {
    const weekEnd = dt.plus({ weeks: 7 });
    const weekShortPrefix: string = t('SHORT_WEEK_PREFIX', locale);
    return `${weekShortPrefix}${dt.weekNumber} - ${weekShortPrefix}${weekEnd.weekNumber} ${weekEnd.weekYear}`;
  },
  prev: (dt: DateTime): DateTime => dt.minus({ weeks: 8 }),
  next: (dt: DateTime): DateTime => dt.plus({ weeks: 8 }),
};

const YEAR_NAV = {
  label: (dt: DateTime): string => dt.year.toString(),
  prev: (dt: DateTime): DateTime => dt.minus({ years: 1 }),
  next: (dt: DateTime): DateTime => dt.plus({ years: 1 }),
};

export const DECADE_NAV = {
  label: (dt: DateTime): string => {
    const decadeStart = Math.floor(dt.year / 10) * 10;
    return `${decadeStart}-${decadeStart + 10}`;
  },
  prev: (dt: DateTime): DateTime => dt.minus({ years: 10 }),
  next: (dt: DateTime): DateTime => dt.plus({ years: 10 }),
};

// Picker configs

const FIRST_DAY_OF_MONTH = {
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0,
};

const ENOUGH_TO_AVOID_OVERLAPPING_WITH_NEXT_OPTION = { milliseconds: 1 };

const UTC_DATE_TO_LOCALE_STRING = (date: Date, locale?: LocaleIdentifier) => {
  return DateTime.fromJSDate(date, { zone: 'utc' })
    .reconfigure({ locale })
    .toLocaleString(DateTime.DATE_SHORT);
};

export const RANGE_PICKERS: Record<AvailableDuration, GranularityConfig> = {
  week: {
    navRange: WEEK_NAV,
    selectableRanges: {
      label: (dt: DateTime, locale?: LocaleIdentifier): string =>
        `${t('WEEK', locale)} ${dt.weekNumber}`,
      description: (range: Required<DateRange>, locale?: LocaleIdentifier): string => {
        return `${UTC_DATE_TO_LOCALE_STRING(range.start, locale)} - ${UTC_DATE_TO_LOCALE_STRING(
          range.end,
          locale,
        )}`;
      },
      currentOptions: (currentNavRangeStart: DateTime): DateTime[] => {
        const startOfCurrentWeek = currentNavRangeStart.startOf('week');
        return Array.from({ length: 8 }, (_v, i) => {
          const date = startOfCurrentWeek.plus({ weeks: i });
          return DateTime.utc(date.year, date.month, date.day, 0, 0, 0, { locale: 'en' });
        });
      },
      optionToRange: (selectedOption: DateTime): Required<DateRange> => ({
        start: selectedOption.toJSDate(),
        end: selectedOption
          .plus({ weeks: 1 })
          .minus(ENOUGH_TO_AVOID_OVERLAPPING_WITH_NEXT_OPTION)
          .toJSDate(),
        duration: 'week',
      }),
      rangeToOption: (selectedRangeStart: Date): DateTime =>
        DateTime.fromJSDate(selectedRangeStart, { zone: 'utc' })
          .startOf('week')
          .setLocale('en'),
    },
  },
  month: {
    navRange: YEAR_NAV,
    selectableRanges: {
      label: (dt: DateTime, locale?: LocaleIdentifier): string =>
        dt.setLocale(locale || DEFAULT_LOCALE).monthLong,
      description: (): string => '',
      currentOptions: (currentNavRangeStart: DateTime): DateTime[] => {
        const navYear = currentNavRangeStart.year;
        return Array.from({ length: 12 }, (_v, i) => {
          return DateTime.utc(navYear, i + 1, 1, 0, 0, 0, { locale: 'en' });
        });
      },
      optionToRange: (selectedOption: DateTime): Required<DateRange> => ({
        start: selectedOption.toJSDate(),
        end: selectedOption
          .plus({ months: 1 })
          .minus(ENOUGH_TO_AVOID_OVERLAPPING_WITH_NEXT_OPTION)
          .toJSDate(),
        duration: 'month',
      }),
      rangeToOption: (selectedRangeStart: Date): DateTime =>
        DateTime.fromJSDate(selectedRangeStart, { zone: 'utc' })
          .set(FIRST_DAY_OF_MONTH)
          .setLocale('en'),
    },
  },
  quarter: {
    navRange: YEAR_NAV,
    selectableRanges: {
      label: (dt: DateTime, locale?: LocaleIdentifier): string =>
        `${t('QUARTER', locale)} ${dt.quarter}`,
      description: (): string => '',
      currentOptions: (currentNavRangeStart: DateTime): DateTime[] => {
        return Array.from({ length: 4 }, (_v, i) => {
          return DateTime.utc(currentNavRangeStart.year, i * 3 + 1, 1, 0, 0, 0, { locale: 'en' });
        });
      },
      optionToRange: (selectedOption: DateTime): Required<DateRange> => ({
        start: selectedOption.toJSDate(),
        end: selectedOption
          .plus({ months: 3 })
          .minus(ENOUGH_TO_AVOID_OVERLAPPING_WITH_NEXT_OPTION)
          .toJSDate(),
        duration: 'quarter',
      }),
      rangeToOption: (selectedRangeStart: Date): DateTime => {
        const dt = DateTime.fromJSDate(selectedRangeStart, { zone: 'utc' });
        return dt
          .set({
            month: (dt.quarter - 1) * 3 + 1,
            ...FIRST_DAY_OF_MONTH,
          })
          .setLocale('en');
      },
    },
  },
  year: {
    navRange: DECADE_NAV,
    selectableRanges: {
      label: (dt: DateTime): string => dt.year.toString(),
      description: (): string => '',
      currentOptions: (currentNavRangeStart: DateTime): DateTime[] => {
        const decadeStart = Math.floor(currentNavRangeStart.year / 10) * 10;
        return Array.from({ length: 11 }, (_v, i) => {
          return DateTime.utc(decadeStart + i, 1, 1, 0, 0, 0, { locale: 'en' });
        });
      },
      optionToRange: (selectedOption: DateTime): Required<DateRange> => ({
        start: selectedOption.toJSDate(),
        end: selectedOption
          .plus({ years: 1 })
          .minus(ENOUGH_TO_AVOID_OVERLAPPING_WITH_NEXT_OPTION)
          .toJSDate(),
        duration: 'year',
      }),
      rangeToOption: (selectedRangeStart: Date): DateTime =>
        DateTime.fromJSDate(selectedRangeStart, { zone: 'utc' })
          .set({
            month: 1,
            ...FIRST_DAY_OF_MONTH,
          })
          .setLocale('en'),
    },
  },
};
