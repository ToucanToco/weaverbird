import { storiesOf } from '@storybook/vue';

import { CustomGranularityCalendar } from '../../dist/storybook/components';

const stories = storiesOf('Dates/CustomGranularityCalendar', module);

stories.add('week', () => ({
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
      granularity="week"
      :value="value"
      @input="input"
    />
    <pre style="margin-top: 40px;">Selected: {{ formattedValue }}</pre>
  </div>
  `,
}));

stories.add('month, limited to 2015 - 2020', () => ({
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
      :bounds="{start: new Date('2015-01-01'), end: new Date('2021-01-01')}"
      @input="input"
    />
    <pre style="margin-top: 40px;">Selected: {{ formattedValue }}</pre>
  </div>
  `,
}));

stories.add('quarter', () => ({
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
      granularity="quarter"
      :value="value"
      @input="input"
    />
    <pre style="margin-top: 40px;">Selected: {{ formattedValue }}</pre>
  </div>
  `,
}));

stories.add('quarter - limited to 2019 Q2 - 2020 Q3', () => ({
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
      granularity="quarter"
      :value="value"
      :bounds="{start: new Date('2019-04-01'), end: new Date('2020-10-01')}"
      @input="input"
    />
    <pre style="margin-top: 40px;">Selected: {{ formattedValue }}</pre>
  </div>
  `,
}));

stories.add('year', () => ({
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
      granularity="year"
      :value="value"
      @input="input"
    />
    <pre style="margin-top: 40px;">Selected: {{ formattedValue }}</pre>
  </div>
  `,
}));
