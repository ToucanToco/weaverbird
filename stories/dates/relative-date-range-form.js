import { RelativeDateRangeForm } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Dates/RelativeDateRangeForm', module);

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
      <RelativeDateRangeForm 
        :available-variables="availableVariables" 
        v-model="value" 
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    RelativeDateRangeForm,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      value: undefined,
    };
  },
}));
