import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/vue';
import { createPinia, PiniaVuePlugin } from 'pinia';
import Vue from 'vue';

import AggregateStepForm from '@/components/stepforms/AggregateStepForm.vue';
import { setupVQBStore } from '@/store';

export default {
  component: AggregateStepForm,
} as Meta<AggregateStepForm>;

Vue.use(PiniaVuePlugin);

export const Default: StoryObj<AggregateStepForm> = {
  render: (args, { argTypes }) => ({
    components: { AggregateStepForm },
    props: Object.keys(argTypes),
    template: '<AggregateStepForm v-bind="$props" @formSaved="onFormSaved" />',
    pinia: createPinia(),
    created: function () {
      setupVQBStore({
        backendMessages: [],
        dataset: {
          headers: [{ name: 'column A' }, { name: 'column B' }, { name: 'column C' }],
          data: [],
        },
      });
    },
    methods: {
      onFormSaved: action('formSaved'),
    },
  }),
};
