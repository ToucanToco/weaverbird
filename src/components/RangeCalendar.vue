<template>
  <div>
    <Calendar :value="value.start" @input="onInput($event, 'start')" />
    <Calendar :value="value.end" @input="onInput($event, 'end')" />
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

  onInput(value: Date | null, prop: DateRangeSide): void {
    this.$emit('input', { ...this.value, [prop]: value });
  }
}
</script>
