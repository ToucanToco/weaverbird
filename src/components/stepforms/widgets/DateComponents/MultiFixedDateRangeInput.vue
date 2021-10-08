<template>
  <div>
    <Tabs :tabs="tabs" :selectedTab="selectedTab" @tabSelected="selectTab" />
    <div class="widget-multi-date-input__body">
      <Calendar
        v-if="selectedTab === 'Days'"
        v-model="currentValue"
        :availableDates="bounds"
        isRange
      />
      <CustomGranularityCalendar
        v-else-if="selectedTab === 'Months'"
        v-model="currentValue"
        granularity="month"
      />
      <CustomGranularityCalendar
        v-else-if="selectedTab === 'Quarters'"
        v-model="currentValue"
        granularity="quarter"
      />
      <CustomGranularityCalendar
        v-else-if="selectedTab === 'Years'"
        v-model="currentValue"
        granularity="year"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import Calendar from '@/components/DatePicker/Calendar.vue';
import CustomGranularityCalendar from '@/components/DatePicker/CustomGranularityCalendar.vue';
import Tabs from '@/components/Tabs.vue';
import { CustomDateRange, DateRange } from '@/lib/dates';

@Component({
  name: 'multi-fixed-date-range-input',
  components: {
    Tabs,
    Calendar,
    CustomGranularityCalendar,
  },
})
export default class DateRangeInput extends Vue {
  @Prop({ default: () => [] })
  value!: CustomDateRange;

  @Prop({ default: () => [] })
  bounds!: DateRange;

  selectedTab = 'Days';

  get tabs(): string[] {
    return ['Days', 'Months', 'Quarters', 'Years'];
  }

  get currentValue(): CustomDateRange {
    return this.value;
  }

  set currentValue(value: CustomDateRange) {
    this.$emit('input', value);
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }
}
</script>

<style scoped lang="scss">
.widget-multi-date-input__body {
  padding: 20px 24px;
}
</style>
