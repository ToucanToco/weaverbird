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
export type RelativeDate = {
  date?: Date;
  quantity?: number; // can be negative or positive
  duration?: any;
};

export const DEFAULT_DURATIONS = [
  {
    label: 'Years ago',
    identifier: 'year',
  },
  {
    label: 'Months ago',
    identifier: 'month',
  },
  {
    label: 'Days ago',
    identifier: 'day',
  },
];
