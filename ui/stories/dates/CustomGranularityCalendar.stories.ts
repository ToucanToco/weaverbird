import type { Meta, StoryObj } from '@storybook/vue';

import CustomGranularityCalendar from '@/components/DatePicker/CustomGranularityCalendar.vue';

export default {
  component: CustomGranularityCalendar,
} as Meta<CustomGranularityCalendar>;

export const Weeks: StoryObj<CustomGranularityCalendar> = {
  render: (args, { argTypes }) => ({
    components: { CustomGranularityCalendar },
    props: Object.keys(argTypes),
    data(): { value?: Date } {
      return { value: undefined };
    },
    computed: {
      formattedValue() {
        return this.value != null && this.value instanceof Date
          ? this.value.toUTCString()
          : this.value;
      },
    },
    methods: {
      input(value) {
        this.value = value;
      },
    },
    template: `
    <div>
      <CustomGranularityCalendar
        :value="value"
        @input="input"
        v-bind="$props"
      />
      <pre style="margin-top: 40px;">Selected: {{ formattedValue }}</pre>
    </div>
    `,
  }),
  args: {
    granularity: "week"
  },
};

export const Months: StoryObj<CustomGranularityCalendar> = {
  ...Weeks,
  args: {
    granularity: 'months',
  }
};

export const Quarters: StoryObj<CustomGranularityCalendar> = {
  ...Weeks,
  args: {
    granularity: 'quarter',
  }
};

export const QuartersFrom2019Q2To2020Q3: StoryObj<CustomGranularityCalendar> = {
  ...Quarters,
  args: {
    ...Quarters.args,
    bounds: {start: new Date('2019-04-01'), end: new Date('2020-10-01')}
  }
};

export const Years: StoryObj<CustomGranularityCalendar> = {
  ...Weeks,
  args: {
    granularity: 'year',
  }
};
