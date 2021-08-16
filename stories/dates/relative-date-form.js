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
      <RelativeDateForm :available-variables="availableVariables" />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    RelativeDateForm,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      value: '',
    };
  },
  methods: {
    input(value) {
      this.value = value;
    },
  },
}));