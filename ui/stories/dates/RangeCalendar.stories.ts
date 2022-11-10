import type { Meta, StoryObj } from '@storybook/vue';

import RangeCalendar from '@/components/DatePicker/RangeCalendar.vue';
import type { DateRange } from '@/lib/dates';

export default {
  component: RangeCalendar,
} as Meta<typeof RangeCalendar>;

const formatValue = (value) => {
  return value != null && value instanceof Date ? value.toUTCString() : value;
};

export const Default: StoryObj<typeof RangeCalendar> = {
  render: () => ({
    components: { RangeCalendar },
    data(): { value: DateRange } {
      return { value: { start: undefined, end: undefined } };
    },
    computed: {
      formattedValue(): DateRange {
        return {
          start: formatValue(this.value.start),
          end: formatValue(this.value.end),
        };
      },
    },
    methods: {
      input(value: DateRange) {
        this.value = value;
      },
    },
    template: `
      <div>
        <RangeCalendar
          v-bind="$props"
          :value="value"
          @input="input"
        />
        <pre>{{ formattedValue }}</pre>
      </div>
    `,
  }),
  args: {},
};
