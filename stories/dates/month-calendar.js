import { storiesOf } from '@storybook/vue';

import { MonthCalendar } from '../../dist/storybook/components';

const stories = storiesOf('Dates/MonthCalendar', module);

stories.add('simple', () => ({
  components: { MonthCalendar },
  data() {
    return { value: undefined };
  },
  computed: {
    formattedValue() {
      return this.value != null && this.value instanceof Date ? this.value.toUTCString() : this.value;
    },
  },
  methods: {
    input(value) {
      this.value = value;
    },
  },
  template: `
  <div>
    <MonthCalendar
      granularity="month"
      :value="value"
      @input="input"
    />
    <pre style="margin-top: 40px;">Selected: {{ formattedValue }}</pre>
  </div>
  `,
}));
