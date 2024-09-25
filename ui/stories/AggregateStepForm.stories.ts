import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/vue';

import AggregateStepForm from '@/components/stepforms/AggregateStepForm.vue';

export default {
  component: AggregateStepForm,
} as Meta<AggregateStepForm>;

export const Default: StoryObj<AggregateStepForm> = {
  render: (args, { argTypes }) => ({
    components: { AggregateStepForm },
    props: Object.keys(argTypes),
    template: '<AggregateStepForm v-bind="$props" @formSaved="onFormSaved" />',
    methods: {
      onFormSaved: action('formSaved'),
    },
  }),
  args: {
    columnTypes: { 'column A': 'string', 'column B': 'string', 'column C': 'string' },
    interpolateFunc: (a: any) => a,
    availableDomains: [],
    unjoinableDomains: [],
    getColumnNamesFromPipeline: () => Promise.resolve([]),
  },
};
