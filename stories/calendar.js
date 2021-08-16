import { storiesOf } from '@storybook/vue';

import { Calendar } from '../dist/storybook/components';

const stories = storiesOf('Calendar', module);

const formatValue = value => {
  return value != null && value instanceof Date ? value.toUTCString() : value;
};

stories.add('simple', () => ({
  components: { Calendar },
  data() {
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
    />
    <pre>{{ formattedValue }}</pre>
  </div>
  `,
}));

stories.add('range', () => ({
  components: { Calendar },
  data() {
    return { value: { start: new Date('02/01/2021'), end: new Date('01/01/2021') } };
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
      <Calendar 
        :value="value"
        @input="input"
        :isRange="true"
      />
      <pre>{{ formattedValue }}</pre>
    </div>
  `,
}));

stories.add('with highlighted dates', () => ({
  components: { Calendar },
  data() {
    return { 
      value: new Date('01/01/2021'),
      highlightedDates: { start: new Date('02/01/2021'), end: new Date('01/01/2021') } 
    };
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
        :highlightedDates="highlightedDates"
        @input="input"
      />
      <pre>{{ formattedValue }}</pre>
    </div>
  `,
}));