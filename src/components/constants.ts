export type ButtonDef = Readonly<{
  icon: string;
  label: string;
  category: string;
  enable: boolean;
  popover: boolean;
}>;

export const ACTION_CATEGORIES: { [category: string]: object } = {
  filter: [
    { name: 'filter', label: 'Filter based on conditions' },
    { name: 'top', label: 'Top N rows' },
    { name: 'argmax', label: 'Argmax' },
    { name: 'argmin', label: 'Argmin' },
  ],
  compute: [{ name: 'percentage', label: 'Percentage of total' }],
  reshape: [{ name: 'pivot', label: 'Pivot' }, { name: 'unpivot', label: 'Unpivot' }],
};

export const CATEGORY_BUTTONS: ButtonDef[] = [
  {
    icon: 'filter',
    label: 'Filter',
    category: 'filter',
    enable: true,
    popover: true,
  },
  {
    icon: 'calculator',
    label: 'Compute',
    category: 'compute',
    enable: true,
    popover: true,
  },
  {
    icon: 'font',
    label: 'Text',
    category: 'text',
    enable: false,
    popover: true,
  },
  {
    icon: 'calendar',
    label: 'Date',
    category: 'date',
    enable: false,
    popover: true,
  },
  {
    icon: 'code-branch',
    label: 'Aggregate',
    category: 'aggregate',
    enable: true,
    popover: false,
  },
  {
    icon: 'draw-polygon',
    label: 'Reshape',
    category: 'reshape',
    enable: true,
    popover: true,
  },
];

export const POPOVER_ALIGN = {
  CENTER: 'center',
  JUSTIFY: 'justify',
  LEFT: 'left',
  RIGHT: 'right',
};

export const POPOVER_SHADOW_GAP = 8;
