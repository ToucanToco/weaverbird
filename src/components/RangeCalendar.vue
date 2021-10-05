<template>
  <div class="range-calendar">
    <Calendar
      class="range-calendar__calendar range-calendar__calendar--first"
      :value="value.start"
      :availableDates="getAvailableDates('start')"
      :highlightedDates="highlightedDates"
      :defaultDate="valueWithBounds.start"
      @input="onInput($event, 'start')"
    />
    <Calendar
      class="range-calendar__calendar range-calendar__calendar--last"
      :value="value.end"
      :availableDates="getAvailableDates('end')"
      :highlightedDates="highlightedDates"
      :defaultDate="valueWithBounds.end"
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

  @Prop({ default: () => ({}) })
  bounds!: DateRange;

  // dates to highlight in calendar to fake a range mode
  get highlightedDates(): DateRange | undefined {
    return this.value.start && this.value.end ? this.value : undefined;
  }

  get valueWithBounds(): DateRange {
    return {
      start: this.value.start ?? this.bounds.start,
      end: this.value.end ?? this.bounds.end,
    };
  }

  getAvailableDates(prop: DateRangeSide): DateRange {
    if (prop === 'start') {
      // start value can be anything between bounds start and valueWithBounds end (bound or value)
      return { start: this.bounds.start, end: this.valueWithBounds.end };
    } else {
      // end value can be anything between valueWithBounds start (bound or value) and bounds end
      return { start: this.valueWithBounds.start, end: this.bounds.end };
    }
  }

  onInput(value: Date | null, prop: DateRangeSide): void {
    if (value) {
      this.$emit('input', { ...this.value, [prop]: value });
    } else {
      // calendar can emit null value when clicking on already selected date
      const newValue = { ...this.value };
      delete newValue[prop];
      this.$emit('input', newValue);
    }
  }
}
</script>
<style scoped lang="scss">
.range-calendar {
  display: flex;
  flex-direction: row;
}
.range-calendar__calendar--last {
  margin-left: -1px; // avoid double border
}
</style>
