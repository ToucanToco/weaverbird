import { RelativeDateForm } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Dates/RelativeDateForm', module);

const SAMPLE_VARIABLES = [
  {
    label: 'Years',
    identifier: 'years',
  },
  {
    label: 'Months',
    identifier: 'months',
  },
  {
    label: 'Days',
    identifier: 'days',
  },
];

stories.add('simple', () => ({
  template: `
    <div>
      <RelativeDateForm :available-variables="availableVariables" v-model="value" />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    RelativeDateForm,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      value: { quantity: 3, duration: SAMPLE_VARIABLES[1].identifier },
    };
  },
}));

stories.add('empty', () => ({
  template: `
    <div>
      <RelativeDateForm v-model="value" />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    RelativeDateForm,
  },

  data() {
    return {
      value: undefined,
    };
  },
}));