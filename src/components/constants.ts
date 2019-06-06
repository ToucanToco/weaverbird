export type ButtonDef = Readonly<{
  icon: string;
  label: string;
}>;

export const CATEGORY_BUTTONS: ButtonDef[] = [
  { icon: 'filter', label: 'Filter' },
  { icon: 'calculator', label: 'Compute' },
  { icon: 'font', label: 'Text' },
  { icon: 'calendar', label: 'Date' },
  { icon: 'code-branch', label: 'Aggregate' },
  { icon: 'draw-polygon', label: 'Reshape' },
];

export const POPOVER_ALIGN = {
  CENTER: 'center',
  JUSTIFY: 'justify',
  LEFT: 'left',
  RIGHT: 'right',
};

export const POPOVER_SHADOW_GAP = 8;
