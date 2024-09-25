import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/vue';

import AddTotalRowsStepForm from '@/components/stepforms/AddTotalRowsStepForm.vue';

export default {
  component: AddTotalRowsStepForm,
} as Meta<AddTotalRowsStepForm>;

export const Empty: StoryObj<AddTotalRowsStepForm> = {
  render: (args, { argTypes }) => ({
    components: { AddTotalRowsStepForm },
    props: Object.keys(argTypes),
    template: '<AddTotalRowsStepForm v-bind="$props" @formSaved="onFormSaved" />',
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
