<template>
  <!-- <Tabs :tabs="['Days', 'Months', 'Quarter', 'years']" /> -->
  <Calendar v-model="currentTabValue" isRange :availableDates="bounds" />
  <!-- <CustomGranularityCalendar :granularity="month" />
  <CustomGranularityCalendar :granularity="quarter" />
  <CustomGranularityCalendar :granularity="year" /> -->
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import Calendar from '@/components/DatePicker/Calendar.vue';
import Tabs from '@/components/Tabs.vue';
import { CustomDateRange, DateRange } from '@/lib/dates';

@Component({
  name: 'multi-fixed-date-range-input',
  components: {
    Tabs,
    Calendar,
  },
})
export default class DateRangeInput extends Vue {
  @Prop({ default: () => [] })
  value!: CustomDateRange;

  @Prop({ default: () => [] })
  bounds!: DateRange;

  get currentTabValue(): CustomDateRange {
    return this.value;
  }

  set currentTabValue(value: CustomDateRange) {
    this.$emit('input', value);
  }
}
</script>

<style scoped lang="scss"></style>
