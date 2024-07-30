import { RelativeDateForm } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Dates/RelativeDateForm', module);

const SAMPLE_VARIABLES = [
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
      <RelativeDateForm 
        :available-variables="availableVariables"
        :variable-delimiters="variableDelimiters"
        v-model="value" 
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    RelativeDateForm,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
      value: undefined,
    };
  },
}));