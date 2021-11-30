import { NewDateInput } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Dates/NewDateInput', module);


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
    label: 'Last 7 days',
  },
  {
    identifier: 'dates.last_14_days',
    label: 'Last 14 days',
  },
  {
    identifier: 'dates.last_30_days',
    label: 'Last 30 days',
  },
  {
    identifier: 'dates.last_3_months',
    label: 'Last 3 Months',
  },
  {
    identifier: 'dates.last_12_months',
    label: 'Last 12 Months',
  },
  {
    identifier: 'dates.month_to_date',
    label: 'Month to date',
  },
  {
    identifier: 'dates.quarter_to_date',
    label: 'Quarter to date',
  },
  {
    identifier: 'dates.all_time',
    label: 'All time',
  },
  ...RELATIVE_SAMPLE_VARIABLES,
];

stories.add('simple', () => ({
  template: `
    <div>
      <NewDateInput 
        :available-variables="availableVariables" 
        :variable-delimiters="variableDelimiters"
        v-model="value" 
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    NewDateInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
      value: undefined,
    };
  },
}));

stories.add('already selected variable', () => ({
  template: `
    <div>
      <NewDateInput 
        :available-variables="availableVariables" 
        :variable-delimiters="variableDelimiters"
        v-model="value" 
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    NewDateInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
      value: '{{dates.all_time}}',
    };
  },
}));

stories.add('custom (fixed date)', () => ({
  template: `
    <div>
      <NewDateInput 
        :available-variables="availableVariables" 
        :variable-delimiters="variableDelimiters"
        v-model="value" 
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    NewDateInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
      value: new Date(),
    };
  },
}));

stories.add('custom (relative date)', () => ({
  template: `
    <div>
      <NewDateInput 
        :available-variables="availableVariables" 
        :variable-delimiters="variableDelimiters"
        v-model="value" 
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    NewDateInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
      value: { quantity: -1, duration: 'month' },
    };
  },
}));

stories.add('disable custom selection', () => ({
  template: `
    <div>
      <NewDateInput 
        :available-variables="availableVariables" 
        :variable-delimiters="variableDelimiters"
        :enableCustom="false"
        v-model="value" 
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    NewDateInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
      value: undefined,
    };
  },
}));

stories.add('empty', () => ({
  template: `
    <div>
      <NewDateInput v-model="value"/>
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    NewDateInput,
  },

  data() {
    return {
      value: undefined,
    };
  },
}));
