import type { Meta, StoryObj } from '@storybook/vue';
import { createPinia, PiniaVuePlugin } from 'pinia';
import Vue from 'vue';

import Step from '@/components/Step.vue';
import { setupVQBStore } from '@/store';

export default {
  component: Step,
} as Meta<Step>;

Vue.use(PiniaVuePlugin);

export const Default: StoryObj<Step> = {
  render: (args, { argTypes }) => ({
    components: { Step },
    props: Object.keys(argTypes),
    template: '<Step v-bind="$props" />',
    pinia: createPinia(),
    created: function () {
      setupVQBStore({
        backendMessages: [],
        dataset: { headers: [], data: [] },
      });
    },
  }),
  args: {
    step: { name: 'text', newColumn: 'col', text: 'plop' },
  },
};

export const WithError: StoryObj<Step> = {
  render: (args, { argTypes }) => ({
    components: { Step },
    props: Object.keys(argTypes),
    template: '<Step v-bind="$props" />',
    pinia: createPinia(),
    created: function () {
      setupVQBStore({
        backendMessages: [{ index: 2, message: 'I am an error', type: 'error' }],
        dataset: { headers: [], data: [] },
      });
    },
  }),
  args: {
    step: { name: 'text', newColumn: 'col', text: 'plop' },
    indexInPipeline: 2,
  },
};
