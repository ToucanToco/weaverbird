<template>
  <div class="calendar-mock" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { DateRange } from '@/lib/dates';

export default defineComponent({
  name: 'calendar',
  
  props: {
    value: {
      type: [Date, Object] as PropType<Date | DateRange | undefined>,
      default: undefined
    },
    highlightedDates: {
      type: Object as PropType<DateRange | undefined>,
      default: undefined
    },
    availableDates: {
      type: Object as PropType<DateRange>,
      default: () => ({ start: undefined, end: undefined })
    },
    isRange: {
      type: Boolean,
      default: false
    }
  }
});
</script>

<style></style>
