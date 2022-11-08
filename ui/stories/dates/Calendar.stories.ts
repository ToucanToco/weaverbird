import type { Meta, StoryObj } from '@storybook/vue';

import Calendar from '@/components/DatePicker/Calendar.vue';

export default {
  component: Calendar,
} as Meta<Calendar>;

const formatValue = (value: any) => {
  return value != null && value instanceof Date ? value.toUTCString() : value;
};

export const Default: StoryObj<Calendar> = {
  render: (args, { argTypes }) => ({
    components: { Calendar },
    props: Object.keys(argTypes),
    data(): {
      value: any;
    } {
      return { value: undefined };
    },
    computed: {
      formattedValue() {
        return formatValue(this.value);
      },
    },
    methods: {
      input(value) {
        this.value = value;
      },
    },
    template: `
    <div>
      <Calendar
        :value="value"
        @input="input"
        v-bind="$props"
      />
      <pre>{{ formattedValue }}</pre>
    </div>
    `,
  }),
  args: {},
};
