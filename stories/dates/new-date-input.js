import { NewDateInput } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Dates/NewDateInput', module);

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

const RELATIVE_SAMPLE_VARIABLES = [
  {
    label: 'Today',
    identifier: 'today',
  },
  {
    label: 'Last month',
    identifier: 'last_month',
  },
  {
    label: 'Last year',
    identifier: 'last_year',
  },
];

stories.add('simple', () => ({
  template: `
    <div>
      <NewDateInput 
        :available-variables="availableVariables" 
        :variable-delimiters="variableDelimiters"
        :relative-available-variables="relativeAvailableVariables"
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
      relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
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
        :relative-available-variables="relativeAvailableVariables"
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
      relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
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
        :relative-available-variables="relativeAvailableVariables"
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
      relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
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
        :relative-available-variables="relativeAvailableVariables"
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
      relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
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
        :relative-available-variables="relativeAvailableVariables"
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
      relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
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
