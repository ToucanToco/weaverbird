import type { Meta, StoryObj } from '@storybook/vue';

import CustomVariableList from '@/components/stepforms/widgets/DateComponents/CustomVariableList.vue';
import type { AvailableVariable } from '@/lib/variables';

const SAMPLE_VARIABLES: AvailableVariable[] = [
  {
    identifier: 'dates.last_7_days',
    label: 'Last 7 days',
  },
  {
    identifier: 'dates.last_14_days',
    label: 'Last 14 days',
  },
  {
    identifier: 'dates.last_30_days',
    label: 'Last 30 days',
  },
  {
    identifier: 'dates.last_3_months',
    label: 'Last 3 Months',
  },
  {
    identifier: 'dates.last_12_months',
    label: 'Last 12 Months',
  },
  {
    identifier: 'dates.month_to_date',
    label: 'Month to date',
  },
  {
    identifier: 'dates.quarter_to_date',
    label: 'Quarter to date',
  },
  {
    identifier: 'dates.all_time',
    label: 'All time',
  },
];

export default {
  component: CustomVariableList,
} as Meta<CustomVariableList>;

export const Default: StoryObj<CustomVariableList> = {
  render: (args, { argTypes }) => ({
    components: { CustomVariableList },
    props: Object.keys(argTypes),
    data(): { selectedVariables: string } {
      return {
        selectedVariables: '',
      };
    },
    methods: {
      input(value: any) {
        this.selectedVariables = value;
      },
      selectCustomVariable() {
        this.selectedVariables = 'custom';
      },
    },
    template: `
      <div>
      <CustomVariableList
        :selectedVariables="selectedVariables"
        @input="input"
        @selectCustomVariable="selectCustomVariable"
        v-bind="$props"
      />
      <pre>{{ selectedVariables }}</pre>
      </div>`,
  }),
  args: {
    availableVariables: SAMPLE_VARIABLES,
  },
};

export const DisableCustom: StoryObj<CustomVariableList> = {
  ...Default,
  args: {
    ...Default.args,
    enableCustom: false,
  },
};
