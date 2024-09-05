import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/vue';
import { createPinia, PiniaVuePlugin } from 'pinia';
import Vue from 'vue';

import AddTotalRowsStepForm from '@/components/stepforms/AddTotalRowsStepForm.vue';
import { setupVQBStore } from '@/store';

export default {
  component: AddTotalRowsStepForm,
} as Meta<AddTotalRowsStepForm>;

Vue.use(PiniaVuePlugin);

export const Empty: StoryObj<AddTotalRowsStepForm> = {
  render: (args, { argTypes }) => ({
    components: { AddTotalRowsStepForm },
    props: Object.keys(argTypes),
    template: '<AddTotalRowsStepForm v-bind="$props" @formSaved="onFormSaved" />',
    methods: {
      onFormSaved: action('formSaved'),
    },
    pinia: createPinia(),
    created: function () {
      setupVQBStore({
        backendMessages: [],
        dataset: {
          headers: [
            { name: 'label', type: 'string' },
            { name: 'value', type: 'string' },
          ],
          data: [],
        },
      });
    },
  }),
};
