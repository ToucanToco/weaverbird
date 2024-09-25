import type { Meta, StoryObj } from '@storybook/vue';

import JoinStepForm from '@/components/stepforms/JoinStepForm.vue';

export default {
  component: JoinStepForm,
} as Meta<JoinStepForm>;

export const Default: StoryObj<JoinStepForm> = {
  render: (args, { argTypes }) => ({
    components: { JoinStepForm },
    props: Object.keys(argTypes),
    template: '<JoinStepForm v-bind="$props" />',
  }),
  args: {
    initialStepValue: { name: 'join', rightPipeline: '', type: 'left', on: [['', '']] },
    availableDomains: [
      { name: 'Dataset 1', uid: '1' },
      { name: 'Dataset 2', uid: '2' },
      { name: 'Dataset 3', uid: '3' },
    ],
    unjoinableDomains: [
      { name: 'Dataset 1', uid: '1' },
      { name: 'Dataset 2', uid: '2' },
    ],
    columnTypes: {
      name: 'string',
    },
    getColumnNamesFromPipeline: () => Promise.resolve(['name', 'other']),
  },
};

export const Edition: StoryObj<JoinStepForm> = {
  render: (args, { argTypes }) => ({
    components: { JoinStepForm },
    props: Object.keys(argTypes),
    template: '<JoinStepForm v-bind="$props" />',
  }),
  args: {
    initialStepValue: {
      name: 'join',
      rightPipeline: { type: 'ref', uid: '3' },
      type: 'left',
      on: [['name', 'name']],
    },
    availableDomains: [
      { name: 'Dataset 1', uid: '1' },
      { name: 'Dataset 2', uid: '2' },
      { name: 'Dataset 3', uid: '3' },
    ],
    unjoinableDomains: [
      { name: 'Dataset 1', uid: '1' },
      { name: 'Dataset 2', uid: '2' },
    ],
    columnTypes: {
      name: 'string',
    },
    getColumnNamesFromPipeline: () => Promise.resolve(['name', 'other']),
  },
};
