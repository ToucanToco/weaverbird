import type { Meta, StoryObj } from '@storybook/vue';

import DateRangeInput from '@/components/stepforms/widgets/DateComponents/DateRangeInput.vue';
import type {AvailableVariable} from "@/lib/variables";

export default {
  component: DateRangeInput,
} as Meta<DateRangeInput>;


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

const RELATIVE_SAMPLE_VARIABLES: AvailableVariable[] = [
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

export const Default: StoryObj<DateRangeInput> = {
  render: (args, {argTypes}) => ({
    components: {DateRangeInput},
    props: Object.keys(argTypes),
    data() {
      return {
        value: undefined,
        actualRangeValue: undefined
      };
    },
    template: `
      <div>
      <DateRangeInput
        v-model="value"
        @dateRangeValueUpdated="(v) => actualRangeValue = v"
        v-bind="$props"
      />
      <pre>{{ value }}</pre>
      <pre>{{ actualRangeValue }}</pre>
      </div>
    `,
  }),
  args: {
    availableVariables: SAMPLE_VARIABLES,
    relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
    variableDelimiters: { start: '{{', end: '}}' },
  },
};

export const AlreadySelectedVariable: StoryObj<DateRangeInput> = {
  ...Default,
  args: {
    ...Default.args,
    value: '{{dates.all_time}}',
  }
}

export const CustomFixedDateRange: StoryObj<DateRangeInput> = {
  ...Default,
  args: {
    ...Default.args,
    value: { start: new Date(1), end: new Date(100000000) },
  }
}

export const CustomRelativeDate: StoryObj<DateRangeInput> = {
  ...Default,
  args: {
    ...Default.args,
    value: { quantity: 1, duration: 'month', operator: 'until', date: '{{today}}' },
  }
}

export const RelativeDateDisabled: StoryObj<DateRangeInput> = {
  ...Default,
  args: {
    ...Default.args,
    enableRelativeDate: false,
    enabledCalendars: ['quarter', 'year'],
  }
}

export const CustomSelectionDisabled: StoryObj<DateRangeInput> = {
  ...Default,
  args: {
    ...Default.args,
    enableRelativeDate: false,
    enableCustom: false,
  }
}

export const CustomWithBounds: StoryObj<DateRangeInput> = {
  ...Default,
  args: {
    ...Default.args,
    value: { start: new Date('2021/2/1'), end: new Date('2021/2/5') },
    bounds: { start: new Date('2021/2/2'), end: new Date('2021/10/4') },
  }
}

export const WithoutAnyVariable: StoryObj<DateRangeInput> = {
  ...Default,
  args: {
  }
}

export const AlwaysOpen: StoryObj<DateRangeInput> = {
  ...Default,
  args: {
    ...Default.args,
    alwaysOpened: true,
    coloredBackground: true,
  }
}

export const LocalizedFrench: StoryObj<DateRangeInput> = {
  ...Default,
  args: {
    ...Default.args,
    locale: 'fr',
  }
}

export const CustomCssVariables: StoryObj<DateRangeInput> = {
  ...AlwaysOpen,
  args: {
    ...AlwaysOpen.args,
    themeCSSVariables: {
      '--weaverbird-theme-main-color-dark': '#000000',
      '--weaverbird-theme-main-color': '#61968A',
      '--weaverbird-theme-main-color-light': '#E4EFEC',
      '--weaverbird-theme-main-color-extra-light': '#F8F7FA',
      '--weaverbird-theme-emphasis-color': '#000',
      '--weaverbird-theme-emphasis-color-dark': '#000',
    },
  }
}

export const CompactMode: StoryObj<DateRangeInput> = {
  ...Default,
  args: {
    ...Default.args,
    compactMode: true,
  }
}
