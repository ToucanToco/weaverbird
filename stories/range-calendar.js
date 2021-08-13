import { storiesOf } from '@storybook/vue';

import { RangeCalendar } from '../dist/storybook/components';

const stories = storiesOf('RangeCalendar', module);


const formatValue = (value) => {
  return value != null && value instanceof Date ? value.toUTCString() : value;
}

stories.add('simple', () => ({
  components: { RangeCalendar },
  data() {
    return { value: { start: undefined, end: undefined } };
  },
  computed: {
    formattedValue() {
      return {
        start: formatValue(this.value.start),
        end: formatValue(this.value.end),
      };
    },
  },
  methods: {
    input(value) {
      this.value = value;
    },
  },
  template: `
    <div>
      <RangeCalendar 
        :value="value"
        @input="input"
      />
      <pre>{{ formattedValue }}</pre>
    </div>
  `,
}));
