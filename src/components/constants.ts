import { PipelineStepName } from '@/lib/steps';

export type ButtonDef = Readonly<{
  icon: string;
  label: string;
  category: string;
  enable: boolean;
}>;

export type ActionCategories = {
  add: ActionCategory[];
  compute: ActionCategory[];
  filter: ActionCategory[];
  text: ActionCategory[];
  date: ActionCategory[];
  reshape: ActionCategory[];
  combine: ActionCategory[];
  [key: string]: ActionCategory[];
};

export type ActionCategory = {
  name: PipelineStepName;
  label: string;
  defaults?: { [prop: string]: any };
};

export type groupActions = {
  type: string;
  actions: ActionCategory[];
};

export const ACTION_CATEGORIES: ActionCategories = {
  add: [
    { name: 'text', label: 'Add text column' },
    { name: 'formula', label: 'Add formula column' },
    { name: 'ifthenelse', label: 'Add conditional column' },
    { name: 'custom', label: 'Add custom step' },
  ],
  filter: [
    { name: 'delete', label: 'Delete columns' },
    { name: 'select', label: 'Keep columns' },
    { name: 'filter', label: 'Filter rows' },
    { name: 'top', label: 'Top N rows' },
    { name: 'argmax', label: 'Argmax' },
    { name: 'argmin', label: 'Argmin' },
  ],
  aggregate: [
    { name: 'aggregate', label: 'Group by' },
    { name: 'totals', label: 'Add total rows' },
    { name: 'rollup', label: 'Hierarchical rollup' },
    { name: 'uniquegroups', label: 'Get unique groups/values' },
  ],
  compute: [
    { name: 'formula', label: 'Formula' },
    { name: 'evolution', label: 'Compute evolution' },
    { name: 'cumsum', label: 'Cumulated sum' },
    { name: 'percentage', label: 'Percentage of total' },
    { name: 'rank', label: 'Rank' },
    { name: 'movingaverage', label: 'Moving average' },
    { name: 'statistics', label: 'Statistics' },
  ],
  text: [
    { name: 'text', label: 'Add text column' },
    { name: 'concatenate', label: 'Concatenate' },
    { name: 'split', label: 'Split column' },
    { name: 'substring', label: 'Extract substring' },
    { name: 'lowercase', label: 'To lowercase' },
    { name: 'uppercase', label: 'To uppercase' },
    { name: 'strcmp', label: 'Compare text columns' },
  ],
  date: [
    { name: 'todate', label: 'Convert text to date' },
    { name: 'fromdate', label: 'Convert date to text' },
    { name: 'dateextract', label: 'Extract year', defaults: { operation: 'year' } },
    { name: 'dateextract', label: 'Extract month', defaults: { operation: 'month' } },
    { name: 'dateextract', label: 'Extract day', defaults: { operation: 'day' } },
    { name: 'dateextract', label: 'Extract week', defaults: { operation: 'week' } },
    { name: 'dateextract', label: 'Extract other', defaults: { operation: 'hour' } },
    { name: 'addmissingdates', label: 'Add missing dates' },
    { name: 'duration', label: 'Compute duration' },
  ],
  reshape: [
    { name: 'pivot', label: 'Pivot' },
    { name: 'unpivot', label: 'Unpivot' },
    { name: 'waterfall', label: 'Waterfall' },
  ],
  combine: [
    { name: 'append', label: 'Append datasets' },
    { name: 'join', label: 'Join datasets' },
  ],
};

export const SEARCH_ACTION: groupActions[] = [
  {
    type: 'add',
    actions: [...ACTION_CATEGORIES.add],
  },
  {
    type: 'aggregate',
    actions: [...ACTION_CATEGORIES.aggregate],
  },
  {
    type: 'filter',
    actions: [...ACTION_CATEGORIES.filter],
  },
  {
    type: 'compute',
    actions: [...ACTION_CATEGORIES.compute],
  },
  {
    type: 'text',
    actions: [...ACTION_CATEGORIES.text],
  },
  {
    type: 'date',
    actions: [...ACTION_CATEGORIES.date],
  },
  {
    type: 'reshape',
    actions: [...ACTION_CATEGORIES.reshape],
  },
  {
    type: 'combine',
    actions: [...ACTION_CATEGORIES.combine],
  },
  {
    type: 'Others actions',
    actions: [
      { name: 'convert', label: 'Convert column data type' },
      { name: 'duplicate', label: 'Duplicate column' },
      { name: 'fillna', label: 'Fill null values' },
      { name: 'rename', label: 'Rename column' },
      { name: 'replace', label: 'Replace values' },
      { name: 'sort', label: 'Sort values' },
    ],
  },
];

export const CATEGORY_BUTTONS: ButtonDef[] = [
  {
    category: 'add',
    enable: true,
    icon: 'plus',
    label: 'Add',
  },
  {
    category: 'filter',
    enable: true,
    icon: 'filter',
    label: 'Filter',
  },
  {
    category: 'aggregate',
    enable: true,
    icon: 'code-branch',
    label: 'Aggregate',
  },
  {
    category: 'compute',
    enable: true,
    icon: 'calculator',
    label: 'Compute',
  },
  {
    category: 'text',
    enable: true,
    icon: 'font',
    label: 'Text',
  },
  {
    category: 'date',
    enable: true,
    icon: 'calendar',
    label: 'Date',
  },
  {
    category: 'reshape',
    enable: true,
    icon: 'draw-polygon',
    label: 'Reshape',
  },
  {
    category: 'combine',
    enable: true,
    icon: 'object-group',
    label: 'Combine',
  },
];

export const POPOVER_ALIGN = {
  CENTER: 'center',
  JUSTIFY: 'justify',
  LEFT: 'left',
  RIGHT: 'right',
};

export enum Alignment {
  Center = 'center',
  Justify = 'justify',
  Left = 'left',
  Right = 'right',
}

export const POPOVER_SHADOW_GAP = 8;
