import { storiesOf } from '@storybook/vue';

import { CustomGranularityCalendar } from '../../dist/storybook/components';

const stories = storiesOf('Dates/CustomGranularityCalendar', module);

stories.add('month', () => ({
  components: { CustomGranularityCalendar },
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
    <CustomGranularityCalendar
      granularity="month"
      :value="value"
      @input="input"
    />
    <pre style="margin-top: 40px;">Selected: {{ formattedValue }}</pre>
  </div>
  `,
}));
