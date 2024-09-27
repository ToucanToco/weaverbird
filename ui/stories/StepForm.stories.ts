import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/vue';

import StepFormComponent from '@/components/stepforms/StepFormComponent.vue';
import { STEP_LABELS } from '@/types';

const RELATIVE_SAMPLE_VARIABLES = [
  {
    label: 'Today',
    identifier: 'today',
    value: new Date('1/12/2021'),
  },
  {
    label: 'Last month',
    identifier: 'last_month',
    value: new Date('11/12/2021'),
  },
  {
    label: 'Last year',
    identifier: 'last_year',

    value: new Date('1/12/2020'),
  },
];

const SAMPLE_VARIABLES = [
  {
    identifier: 'dates.last_7_days',
    trusted: true,
    label: 'Last 7 days',
  },
  {
    identifier: 'dates.last_14_days',
    trusted: true,
    label: 'Last 14 days',
  },
  {
    identifier: 'dates.last_30_days',
    trusted: true,
    label: 'Last 30 days',
  },
  {
    identifier: 'dates.last_3_months',
    trusted: true,
    label: 'Last 3 Months',
  },
  {
    identifier: 'dates.last_12_months',
    trusted: true,
    label: 'Last 12 Months',
  },
  {
    identifier: 'dates.month_to_date',
    trusted: true,
    label: 'Month to date',
  },
  {
    identifier: 'dates.quarter_to_date',
    trusted: true,
    label: 'Quarter to date',
  },
  {
    identifier: 'dates.all_time',
    trusted: true,
    label: 'All time',
  },
  ...RELATIVE_SAMPLE_VARIABLES,
];

const VARIABLES = SAMPLE_VARIABLES.reduce((vars, item) => {
  vars[item.identifier] = 'value' in item ? item.value : item.identifier;
  return vars;
}, {} as Record<string, any>);

export default {
  component: StepFormComponent,
} as Meta<StepFormComponent>;

export const Default: StoryObj<StepFormComponent> = {
  render: (args, { argTypes }) => ({
    components: { StepFormComponent },
    props: Object.keys(argTypes),
    template: '<StepFormComponent v-bind="$props" @formSaved="onFormSaved" @back="onBack" />',
    methods: {
      onFormSaved: action('formSaved'),
      onBack: action('back'),
    },
  }),
  args: {
    name: 'text',
    availableDomains: [{ name: 'other_domain', uid: 'other_domain' }],
    unjoinableDomains: [],
    columnTypes: { a: 'string', b: 'boolean' },
    availableVariables: SAMPLE_VARIABLES,
    variableDelimiters: { start: '<%=', end: '%>' },
    trustedVariableDelimiters: { start: '{{', end: '}}' },
    variables: VARIABLES,
    interpolateFunc: (a) => a,
    getColumnNamesFromPipeline: () => Promise.resolve(['c', 'd']),
  },
  argTypes: {
    name: {
      options: Object.keys(STEP_LABELS),
      control: { type: 'select' },
    },
  },
};

export const Edition: StoryObj<StepFormComponent> = {
  render: (args, { argTypes }) => ({
    components: { StepFormComponent },
    props: Object.keys(argTypes),
    template: '<StepFormComponent v-bind="$props" @formSaved="onFormSaved" @back="onBack" />',
    methods: {
      onFormSaved: action('formSaved'),
      onBack: action('back'),
    },
  }),
  args: {
    name: 'text',
    availableDomains: [{ name: 'other_domain', uid: 'other_domain' }],
    unjoinableDomains: [],
    columnTypes: { a: 'string', b: 'boolean' },
    availableVariables: SAMPLE_VARIABLES,
    variableDelimiters: { start: '<%=', end: '%>' },
    trustedVariableDelimiters: { start: '{{', end: '}}' },
    variables: VARIABLES,
    initialStepValue: {
      text: 'Text value',
      newColumn: 'a'
    },
    interpolateFunc: (a) => a,
    getColumnNamesFromPipeline: () => Promise.resolve(['c', 'd']),
  },
  argTypes: {
    name: {
      disable: true,
    },
  },
};

export const WithDefaults: StoryObj<StepFormComponent> = {
  render: (args, { argTypes }) => ({
    components: { StepFormComponent },
    props: Object.keys(argTypes),
    template: '<StepFormComponent v-bind="$props" @formSaved="onFormSaved" @back="onBack" />',
    methods: {
      onFormSaved: action('formSaved'),
      onBack: action('back'),
    },
  }),
  args: {
    name: 'text',
    availableDomains: [{ name: 'other_domain', uid: 'other_domain' }],
    unjoinableDomains: [],
    columnTypes: { a: 'string', b: 'boolean' },
    availableVariables: SAMPLE_VARIABLES,
    variableDelimiters: { start: '<%=', end: '%>' },
    trustedVariableDelimiters: { start: '{{', end: '}}' },
    stepFormDefaults: {
      newColumn: 'd'
    },
    variables: VARIABLES,
    interpolateFunc: (a) => a,
    getColumnNamesFromPipeline: () => Promise.resolve(['c', 'd']),
  },
  argTypes: {
    name: {
      disable: true,
    },
  },
};

export const WithPreselectedColumn: StoryObj<StepFormComponent> = {
  render: (args, { argTypes }) => ({
    components: { StepFormComponent },
    props: Object.keys(argTypes),
    template: '<StepFormComponent v-bind="$props" @formSaved="onFormSaved" @back="onBack" />',
    methods: {
      onFormSaved: action('formSaved'),
      onBack: action('back'),
    },
  }),
  args: {
    name: 'filter',
    availableDomains: [{ name: 'other_domain', uid: 'other_domain' }],
    unjoinableDomains: [],
    columnTypes: { a: 'string', b: 'boolean' },
    availableVariables: SAMPLE_VARIABLES,
    variableDelimiters: { start: '<%=', end: '%>' },
    trustedVariableDelimiters: { start: '{{', end: '}}' },
    selectedColumn: 'a',
    variables: VARIABLES,
    interpolateFunc: (a) => a,
    getColumnNamesFromPipeline: () => Promise.resolve(['c', 'd']),
  },
  argTypes: {
    name: {
      disable: true,
    },
  },
};
