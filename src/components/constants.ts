export type ButtonDef = Readonly<{
  icon: string;
  label: string;
  category: string;
  enable: boolean;
}>;

type ActionCategories = {
  compute: ActionCategory[];
  filter: ActionCategory[];
  text: ActionCategory[];
  date: ActionCategory[];
  reshape: ActionCategory[];
  combine: ActionCategory[];
  [key: string]: ActionCategory[];
};

export type ActionCategory = {
  name: string;
  label: string;
};

export type groupActions = {
  type: string;
  actions: ActionCategory[];
};

export const ACTION_CATEGORIES: ActionCategories = {
  filter: [
    { name: 'delete', label: 'Delete columns' },
    { name: 'select', label: 'Keep columns' },
    { name: 'filter', label: 'Filter rows' },
    { name: 'top', label: 'Top N rows' },
    { name: 'argmax', label: 'Argmax' },
    { name: 'argmin', label: 'Argmin' },
  ],
  compute: [
    { name: 'formula', label: 'Formula' },
    { name: 'percentage', label: 'Percentage of total' },
  ],
  text: [
    { name: 'concatenate', label: 'Concatenate' },
    { name: 'split', label: 'Split column' },
    { name: 'substring', label: 'Extract substring' },
    { name: 'lowercase', label: 'To lowercase' },
    { name: 'uppercase', label: 'To uppercase' },
  ],
  date: [
    { name: 'todate', label: 'Convert text to date' },
    { name: 'fromdate', label: 'Convert date to text' },
  ],
  reshape: [
    { name: 'pivot', label: 'Pivot' },
    { name: 'unpivot', label: 'Unpivot' },
  ],
  combine: [
    { name: 'append', label: 'Append datasets' },
    { name: 'join', label: 'Join datasets' },
  ],
};

export const SEARCH_ACTION: groupActions[] = [
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
    type: 'aggregate',
    actions: [
      {
        name: 'aggregate',
        label: 'Aggregate',
      },
    ],
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
    type: 'Others action',
    actions: [
      { name: 'duplicate', label: 'Duplicate column' },
      { name: 'rename', label: 'Rename column' },
      { name: 'fillna', label: 'Fill null values' },
      { name: 'replace', label: 'Replace values' },
      { name: 'sort', label: 'Sort values' },
    ],
  },
];

export const CATEGORY_BUTTONS: ButtonDef[] = [
  {
    category: 'filter',
    enable: true,
    icon: 'filter',
    label: 'Filter',
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
    category: 'aggregate',
    enable: true,
    icon: 'code-branch',
    label: 'Aggregate',
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
