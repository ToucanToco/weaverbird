import type { Meta, StoryObj } from '@storybook/vue';
import Vuex from 'vuex';

import Step from '@/components/Step.vue';
import { registerModule } from '@/store';

export default {
  component: Step,
} as Meta<Step>;

export const Default: StoryObj<Step> = {
  render: (args, { argTypes }) => ({
    components: { Step },
    props: Object.keys(argTypes),
    template: '<Step v-bind="$props" />',
    store: new Vuex.Store({}),
    created: function () {
      registerModule(this.$store, {
        backendMessages: [],
        dataset: { headers: [], data: [] },
      });
    },
  }),
  args: {
    step: { name: 'text', new_column: 'col', text: 'plop' },
  },
};

export const WithError: StoryObj<Step> = {
  render: (args, { argTypes }) => ({
    components: { Step },
    props: Object.keys(argTypes),
    template: '<Step v-bind="$props" />',
    store: new Vuex.Store({}),
    created: function () {
      registerModule(this.$store, {
        backendMessages: [{ index: 2, message: 'I am an error', type: 'error' }],
        dataset: { headers: [], data: [] },
      });
    },
  }),
  args: {
    step: { name: 'text', new_column: 'col', text: 'plop' },
    indexInPipeline: 2,
  },
};
