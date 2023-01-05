import type { Meta, StoryObj } from '@storybook/vue';

import RelativeDateForm from '@/components/stepforms/widgets/DateComponents/RelativeDateForm.vue';
import type { RelativeDate } from '@/lib/dates';
import type { AvailableVariable } from '@/lib/variables';

export default {
  component: RelativeDateForm,
} as Meta<typeof RelativeDateForm>;

const SAMPLE_VARIABLES: AvailableVariable[] = [
  {
    label: 'Today',
    identifier: 'today',
  },
  {
    label: 'Last month',
    identifier: 'last_month',
  },
  {
    label: 'Last year',
    identifier: 'last_year',
  },
];

export const Default: StoryObj<RelativeDateForm> = {
  render: (args, { argTypes }) => ({
    components: { RelativeDateForm },
    props: Object.keys(argTypes),
    data(): { value?: RelativeDate } {
      return {
        value: undefined,
      };
    },
    template: `
      <div>
        <RelativeDateForm
          v-bind="$props"
          v-model="value"
        />
        <pre>{{ value }}</pre>
      </div>
    `,
  }),
  args: {
    availableVariables: SAMPLE_VARIABLES,
    variableDelimiters: { start: '{{', end: '}}' },
  },
};

export const WithTitleAttribute: StoryObj<RelativeDateForm> = {
  ...Default,
  args: {
    ...Default.args,
    withTitleAttribute: true,
  },
};
