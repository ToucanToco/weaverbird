export type ButtonDef = Readonly<{
  icon: string;
  label: string;
  category: string;
  enable: boolean;
}>;

export const ACTION_CATEGORIES: { [category: string]: object } = {
  compute: [{ name: 'percentage', label: 'Percentage of total' }],
  filter: [
    { name: 'filter', label: 'Filter based on conditions' },
    { name: 'top', label: 'Top N rows' },
    { name: 'argmax', label: 'Argmax' },
    { name: 'argmin', label: 'Argmin' },
  ],
  reshape: [{ name: 'pivot', label: 'Pivot' }, { name: 'unpivot', label: 'Unpivot' }],
};

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

export const POPOVER_SHADOW_GAP = 8;
