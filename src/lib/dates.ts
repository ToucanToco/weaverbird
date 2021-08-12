export type DateRange = { start?: Date; end?: Date };
export type DateRangeSide = 'start' | 'end';
export type DatePickerHighlight = {
  key?: string;
  highlight: {
    class?: string;
    contentClass?: string;
  };
  dates?: DateRange;
};
