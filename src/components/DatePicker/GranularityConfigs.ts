import { DateTime } from 'luxon';

import { DateRange } from '@/lib/dates';

// Types

export type GranularityConfig = {
  navRange: {
    label: (dt: DateTime) => string;
    prev: (dt: DateTime) => DateTime;
    next: (dt: DateTime) => DateTime;
  };
  selectableRanges: {
    label: (dt: DateTime) => string;
    currentOptions: (currentNavRangeStart: DateTime) => DateTime[];
    optionToRange: (selectedOption: DateTime) => Required<DateRange>;
    rangeToOption: (selectedRangeStart: Date) => DateTime;
  };
};

export type AvailableDuration = 'year' | 'quarter' | 'month';

// Navigations

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

export const RANGE_PICKERS: Record<AvailableDuration, GranularityConfig> = {
  month: {
    navRange: YEAR_NAV,
    selectableRanges: {
      label: (dt: DateTime): string => dt.monthLong,
      currentOptions: (currentNavRangeStart: DateTime): DateTime[] => {
        const navYear = currentNavRangeStart.year;
        return Array.from({ length: 12 }, (_v, i) => {
          return DateTime.utc(navYear, i + 1, 1, 0, 0, 0, { locale: 'en' });
        });
      },
      optionToRange: (selectedOption: DateTime): Required<DateRange> => ({
        start: selectedOption.toJSDate(),
        end: selectedOption.plus({ months: 1 }).toJSDate(),
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
      label: (dt: DateTime): string => `Quarter ${dt.quarter}`,
      currentOptions: (currentNavRangeStart: DateTime): DateTime[] => {
        return Array.from({ length: 4 }, (_v, i) => {
          return DateTime.utc(currentNavRangeStart.year, i * 3 + 1, 1, 0, 0, 0, { locale: 'en' });
        });
      },
      optionToRange: (selectedOption: DateTime): Required<DateRange> => ({
        start: selectedOption.toJSDate(),
        end: selectedOption.plus({ months: 3 }).toJSDate(),
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
      currentOptions: (currentNavRangeStart: DateTime): DateTime[] => {
        const decadeStart = Math.floor(currentNavRangeStart.year / 10) * 10;
        return Array.from({ length: 11 }, (_v, i) => {
          return DateTime.utc(decadeStart + i, 1, 1, 0, 0, 0, { locale: 'en' });
        });
      },
      optionToRange: (selectedOption: DateTime): Required<DateRange> => ({
        start: selectedOption.toJSDate(),
        end: selectedOption.plus({ years: 1 }).toJSDate(),
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
