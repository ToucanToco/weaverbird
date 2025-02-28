<template>
  <div class="range-calendar">
    <Calendar
      class="range-calendar__calendar range-calendar__calendar--first"
      :value="value.start"
      :availableDates="getAvailableDates('start')"
      :highlightedDates="highlightedDates"
      @input="onInput($event, 'start')"
    />
    <Calendar
      class="range-calendar__calendar range-calendar__calendar--last"
      :value="value.end"
      :availableDates="getAvailableDates('end')"
      :highlightedDates="highlightedDates"
      @input="onInput($event, 'end')"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { DateRange, DateRangeSide } from '@/lib/dates';

import Calendar from './Calendar.vue';

export default defineComponent({
  name: 'range-calendar',
  
  components: {
    Calendar,
  },
  
  props: {
    value: {
      type: Object as PropType<DateRange>,
      default: () => ({})
    }
  },
  
  computed: {
    // dates to highlight in calendar to fake a range mode
    highlightedDates(): DateRange | undefined {
      return this.value.start && this.value.end ? this.value : undefined;
    }
  },
  
  methods: {
    getAvailableDates(prop: DateRangeSide): DateRange {
      if (prop === 'start') {
        // start value can be anything before end value
        return { start: undefined, end: this.value.end };
      } else {
        // end value can be anything after start value
        return { start: this.value.start, end: undefined };
      }
    },
    
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
});
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
