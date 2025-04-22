import type { PipelineStepName } from '@/lib/steps';

export type ButtonDef = Readonly<{
  icon: string;
  label: string;
  category: PipelineStepCategory;
  enable: boolean;
  featureFlag?: string;
}>;

export type PipelineStepCategory =
  | 'add'
  | 'filter'
  | 'aggregate'
  | 'compute'
  | 'text'
  | 'date'
  | 'reshape'
  | 'combine'
  | 'geo'
  | 'other_actions';

export type ActionCategories = Record<PipelineStepCategory, PipelineStepName[]>;

export const STEP_LABELS: Record<PipelineStepName, string> = {
  text: 'Add text column',
  ifthenelse: 'Add conditional column',
  delete: 'Delete columns',
  select: 'Keep columns',
  filter: 'Filter rows',
  top: 'Top N rows',
  argmax: 'Argmax',
  argmin: 'Argmin',
  aggregate: 'Group by',
  totals: 'Add total rows',
  rollup: 'Hierarchical rollup',
  uniquegroups: 'Get unique groups/values',
  formula: 'Add formula column',
  evolution: 'Compute evolution',
  cumsum: 'Cumulated sum',
  percentage: 'Percentage of total',
  rank: 'Rank',
  movingaverage: 'Moving average',
  statistics: 'Compute Statistics',
  absolutevalue: 'Absolute value',
  concatenate: 'Concatenate',
  split: 'Split column',
  substring: 'Extract substring',
  lowercase: 'To lowercase',
  uppercase: 'To uppercase',
  comparetext: 'Compare text columns',
  trim: 'Trim spaces',
  replacetext: 'Replace text',
  todate: 'Convert text to date',
  fromdate: 'Convert date to text',
  dateextract: 'Extract date information',
  dategranularity: 'Normalize to date granularity',
  addmissingdates: 'Add missing dates',
  duration: 'Compute duration',
  pivot: 'Pivot',
  unpivot: 'Unpivot',
  waterfall: 'Waterfall',
  append: 'Append datasets',
  join: 'Join datasets',
  dissolve: 'Geographic dissolve',
  hierarchy: 'Geographic hierarchy',
  simplify: 'Geographic simplify',
  duplicate: 'Duplicate column',
  custom: 'Custom step',
  customsql: 'Custom step',
  convert: 'Convert column data type',
  fillna: 'Fill null values',
  domain: '',
  rename: 'Rename column',
  sort: 'Sort values',
  replace: 'Replace values',
};

export const ACTION_CATEGORIES: ActionCategories = {
  add: ['text', 'formula', 'ifthenelse'],
  filter: ['delete', 'select', 'filter', 'top', 'argmax', 'argmin'],
  aggregate: ['aggregate', 'totals', 'rollup', 'uniquegroups'],
  compute: [
    'formula',
    'evolution',
    'cumsum',
    'percentage',
    'rank',
    'movingaverage',
    'statistics',
    'absolutevalue',
  ],
  text: [
    'text',
    'concatenate',
    'split',
    'substring',
    'lowercase',
    'uppercase',
    'comparetext',
    'trim',
    'replacetext',
  ],
  date: ['todate', 'fromdate', 'dateextract', 'dategranularity', 'addmissingdates', 'duration'],
  reshape: ['pivot', 'unpivot', 'waterfall'],
  combine: ['append', 'join'],
  geo: ['dissolve', 'hierarchy', 'simplify'],
  other_actions: ['convert', 'duplicate', 'fillna', 'rename', 'replace', 'sort'],
};

export const CATEGORY_BUTTONS: ButtonDef[] = [
  { category: 'add', enable: true, icon: 'plus', label: 'Add' },
  { category: 'filter', enable: true, icon: 'filter', label: 'Filter' },
  { category: 'aggregate', enable: true, icon: 'code-branch', label: 'Aggregate' },
  { category: 'compute', enable: true, icon: 'calculator', label: 'Compute' },
  { category: 'text', enable: true, icon: 'font', label: 'Text' },
  { category: 'date', enable: true, icon: 'calendar', label: 'Date' },
  { category: 'reshape', enable: true, icon: 'draw-polygon', label: 'Reshape' },
  { category: 'combine', enable: true, icon: 'object-group', label: 'Combine' },
  { category: 'geo', enable: true, icon: 'map-marked-alt', label: 'Geo' },
  { category: 'other_actions', enable: false, icon: '', label: 'Others actions' },
];

export const COLUMN_MAIN_ACTIONS: PipelineStepName[] = ['rename', 'duplicate', 'delete'];
export const COLUMN_OTHER_ACTIONS: PipelineStepName[] = [
  'filter',
  'top',
  'fillna',
  'replace',
  'sort',
  'trim',
  'uniquegroups',
  'statistics',
];
export const COLUMN_TYPES = {
  integer: { icon: '123', label: 'Integer' },
  float: { icon: '1.2', label: 'Float' },
  text: { icon: 'ABC', label: 'Text' },
  date: { icon: 'calendar-alt', label: 'Date' },
  boolean: { icon: 'check', label: 'Boolean' },
};

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
