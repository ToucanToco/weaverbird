import type { Meta, StoryObj } from '@storybook/vue';
import { createPinia, PiniaVuePlugin } from 'pinia';
import Vue from 'vue';

import JoinStepForm from '@/components/stepforms/JoinStepForm.vue';
import { setupVQBStore } from '@/store';

export default {
  component: JoinStepForm,
} as Meta<JoinStepForm>;

Vue.use(PiniaVuePlugin);

export const Default: StoryObj<JoinStepForm> = {
  render: (args, { argTypes }) => ({
    components: { JoinStepForm },
    props: Object.keys(argTypes),
    template: '<JoinStepForm v-bind="$props" />',
    pinia: createPinia(),
    created: function () {
      setupVQBStore({
        backendMessages: [],
        dataset: { headers: [], data: [] },
        availableDomains: [
          { name: 'Dataset 1', uid: '1' },
          { name: 'Dataset 2', uid: '2' },
          { name: 'Dataset 3', uid: '3' },
        ],
        unjoinableDomains: [
          { name: 'Dataset 1', uid: '1' },
          { name: 'Dataset 2', uid: '2' },
        ],
      });
    },
  }),
  args: {
    initialStepValue: { name: 'join', rightPipeline: '', type: 'left', on: [['', '']] },
  },
};


export const Edition: StoryObj<JoinStepForm> = {
    render: (args, { argTypes }) => ({
      components: { JoinStepForm },
      props: Object.keys(argTypes),
      template: '<JoinStepForm v-bind="$props" />',
      pinia: createPinia(),
      created: function () {
        setupVQBStore({
          backendMessages: [],
          dataset: { headers: [], data: [] },
          availableDomains: [
            { name: 'Dataset 1', uid: '1' },
            { name: 'Dataset 2', uid: '2' },
            { name: 'Dataset 3', uid: '3' },
          ],
          unjoinableDomains: [
            { name: 'Dataset 1', uid: '1' },
            { name: 'Dataset 2', uid: '2' },
          ],
        });
      },
    }),
    args: {
      initialStepValue: { name: 'join', rightPipeline: {type: 'ref', uid: '2' }, type: 'left', on: [['name', 'name']] },
    },
  };