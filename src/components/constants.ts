export type ButtonDef = Readonly<{
  icon: string;
  label: string;
  category: string;
  enable: boolean;
}>;

type ActionCategories = {
  compute: ActionCategory[];
  filter: ActionCategory[];
  reshape: ActionCategory[];
  [key: string]: ActionCategory[];
};

export type ActionCategory = {
  name: string;
  label: string;
};

export const ACTION_CATEGORIES: ActionCategories = {
  compute: [{ name: 'percentage', label: 'Percentage of total' }],
  filter: [
    { name: 'delete', label: 'Delete columns' },
    { name: 'select', label: 'Keep columns' },
    { name: 'filter', label: 'Filter based on conditions' },
    { name: 'top', label: 'Top N rows' },
    { name: 'argmax', label: 'Argmax' },
    { name: 'argmin', label: 'Argmin' },
  ],
  reshape: [{ name: 'pivot', label: 'Pivot' }, { name: 'unpivot', label: 'Unpivot' }],
};

export const SEARCH_ACTION: ActionCategory[] = [
  {
    type: 'compute',
    actions: [{ name: 'percentage', label: 'Percentage of total' }],
  },
  {
    type: 'filter',
    actions: [
      { name: 'delete', label: 'Delete columns' },
      { name: 'select', label: 'Keep columns' },
      { name: 'filter', label: 'Filter based on conditions' },
      { name: 'top', label: 'Top N rows' },
      { name: 'argmax', label: 'Argmax' },
      { name: 'argmin', label: 'Argmin' },
    ],
  },
  {
    type: 'head Column action',
    actions: [
      { name: 'duplicate', label: 'Duplicate column' },
      { name: 'rename', label: 'Rename column' },
      { name: 'fillna', label: 'Fill null values' },
      { name: 'filter', label: 'Filter values' },
    ],
  },
  { name: 'aggregate', label: 'Aggregate' },
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
    actions: [{ name: 'pivot', label: 'Pivot' }, { name: 'unpivot', label: 'Unpivot' }],
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
    enable: false,
    icon: 'font',
    label: 'Text',
  },
  {
    category: 'date',
    enable: false,
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
