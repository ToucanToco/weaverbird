import type { Meta, StoryObj } from '@storybook/vue';

import NewDateInput from '@/components/stepforms/widgets/DateComponents/NewDateInput.vue';
import type {AvailableVariable} from "@/lib/variables";

export default {
  component: NewDateInput,
} as Meta<NewDateInput>;

const RELATIVE_SAMPLE_VARIABLES: AvailableVariable[] = [
  {
    label: 'Today',
    identifier: 'today',
    value: new Date('1/12/2021'),
  },
  {
    label: 'Last month',
    identifier: 'last_month',
    value: new Date('11/12/2021'),
  },
  {
    label: 'Last year',
    identifier: 'last_year',


    value: new Date('1/12/2020'),
  },
];

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
  ...RELATIVE_SAMPLE_VARIABLES,
];


export const Default: StoryObj<NewDateInput> = {
  render: (args, {argTypes}) => ({
    components: {NewDateInput},
    props: Object.keys(argTypes),
    data() {
      return {
        value: undefined,
        actualRangeValue: undefined
      };
    },
    template: `
      <div>
      <NewDateInput
        :available-variables="availableVariables"
        :variable-delimiters="variableDelimiters"
        v-model="value"
        v-bind="$props"
      />
      <pre>{{ value }}</pre>
      <pre>{{ actualRangeValue }}</pre>
      </div>
    `,
  }),
  args: {
    availableVariables: SAMPLE_VARIABLES,
    variableDelimiters: { start: '{{', end: '}}' },
  },
};


export const AlreadySelectedVariable: StoryObj<NewDateInput> = {
  ...Default,
  args: {
    ...Default.args,
    value: '{{dates.all_time}}',
  }
}

export const CustomFixedDate: StoryObj<NewDateInput> = {
  ...Default,
  args: {
    ...Default.args,
    value: new Date(),
  }
}
export const CustomRelativeDate: StoryObj<NewDateInput> = {
  ...Default,
  args: {
    ...Default.args,
    value: { quantity: -1, duration: 'month' },
  }
}
export const CustomDisabled: StoryObj<NewDateInput> = {
  ...Default,
  args: {
    ...Default.args,
    enableCustom: false,
  }
}
export const Empty: StoryObj<NewDateInput> = {
  ...Default,
  args: {},
}
