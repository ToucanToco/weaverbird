<template>
  <div class="calendar-mock" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { DateRange } from '@/lib/dates';

@Component({
  name: 'calendar',
})
export default class Calendar extends Vue {
  @Prop({ default: undefined })
  value!: Date | DateRange | undefined;

  @Prop({ default: undefined })
  highlightedDates!: DateRange | undefined;

  @Prop({ default: () => ({ start: undefined, end: undefined }) })
  availableDates!: DateRange;

  @Prop({ default: false })
  isRange!: boolean;
}
</script>

<style></style>
