<template>
  <div>
    <Calendar
      :value="value.start"
      :availableDates="getAvailableDates('start')"
      @input="onInput($event, 'start')"
    />
    <Calendar
      :value="value.end"
      :availableDates="getAvailableDates('end')"
      @input="onInput($event, 'end')"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { DateRange, DateRangeSide } from '@/lib/dates';

import Calendar from './Calendar.vue';

@Component({
  name: 'range-calendar',
  components: {
    Calendar,
  },
})
export default class RangeCalendar extends Vue {
  @Prop({ default: () => ({}) })
  value!: DateRange;

  getAvailableDates(prop: DateRangeSide): DateRange {
    if (prop === 'start') {
      // start value can be anything before end value
      return { start: undefined, end: this.value.end };
    } else {
      // end value can be anything after start value
      return { start: this.value.start, end: undefined };
    }
  }

  onInput(value: Date | null, prop: DateRangeSide): void {
    if (value) {
      this.$emit('input', { ...this.value, [prop]: value });
    } else {
      const newValue = { ...this.value };
      delete newValue[prop];
      this.$emit('input', newValue);
    }
  }
}
</script>
