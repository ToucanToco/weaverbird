export type DateRange = { start?: Date; end?: Date };
export type DateRangeSide = keyof DateRange;
export type DatePickerHighlight = {
  key?: string;
  highlight: {
    class?: string;
    contentClass?: string;
  };
  dates?: DateRange;
};

export type Duration = 'year' | 'quarter' | 'month' | 'week' | 'day';
export type DurationOption = {
  label: string;
  value: Duration;
};

export type RelativeDate = {
  date?: Date | string;
  quantity: number; // can be negative or positive
  duration: Duration;
};

export const DEFAULT_DURATIONS: DurationOption[] = [
  { label: 'Years', value: 'year' },
  { label: 'Quarters', value: 'quarter' },
  { label: 'Months', value: 'month' },
  { label: 'Weeks', value: 'week' },
  { label: 'Days', value: 'day' },
];
