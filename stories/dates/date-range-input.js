import { DateRangeInput } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Dates/DateRangeInput', module);

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
];

stories.add('simple', () => ({
  template: `
    <div>
      <DateRangeInput 
        :available-variables="availableVariables" 
        :variable-delimiters="variableDelimiters" 
        v-model="value" 
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}'},
      value: undefined,
    };
  },
}));

stories.add('already selected variable', () => ({
  template: `
    <div>
      <DateRangeInput 
        :available-variables="availableVariables" 
        :variable-delimiters="variableDelimiters" 
        v-model="value" 
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}'},
      value: '{{dates.all_time}}',
    };
  },
}));

stories.add('custom (fixed date range)', () => ({
  template: `
    <div>
      <DateRangeInput 
        :available-variables="availableVariables" 
        :variable-delimiters="variableDelimiters" 
        v-model="value" 
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}'},
      value: { start: new Date(1), end: new Date(100000000) },
    };
  },
}));

stories.add('custom (relative date range)', () => ({
  template: `
    <div>
      <DateRangeInput 
        :available-variables="availableVariables" 
        :variable-delimiters="variableDelimiters" 
        v-model="value" 
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}'},
      value: { date: '{{today}}', quantity: -1, duration: 'month' },
    };
  },
}));