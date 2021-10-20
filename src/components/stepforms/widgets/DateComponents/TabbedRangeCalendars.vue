<template>
  <div>
    <Tabs
      v-if="enabledCalendars.length > 1"
      :tabs="enabledCalendars"
      :selectedTab="selectedTab"
      @tabSelected="selectTab"
    />
    <div class="widget-multi-date-input__body">
      <Calendar
        v-if="selectedTab === 'day'"
        v-model="currentValue"
        :availableDates="bounds"
        isRange
      />
      <CustomGranularityCalendar
        v-else-if="calendarGranularity"
        v-model="currentValue"
        :granularity="calendarGranularity"
        :bounds="bounds"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

import Calendar from '@/components/DatePicker/Calendar.vue';
import CustomGranularityCalendar from '@/components/DatePicker/CustomGranularityCalendar.vue';
import Tabs from '@/components/Tabs.vue';
import { CustomDateRange, DateRange } from '@/lib/dates';

@Component({
  name: 'tabbed-range-calendars',
  components: {
    Tabs,
    Calendar,
    CustomGranularityCalendar,
  },
})
export default class TabbedRangeCalendars extends Vue {
  @Prop({ default: () => [] })
  value!: CustomDateRange;

  @Prop({ default: () => [] })
  bounds!: DateRange;

  @Prop({ default: () => ['year', 'quarter', 'month', 'week', 'day'] })
  enabledCalendars!: string[];

  selectedTab = this.enabledCalendars[0];

  @Watch('enabledCalendars')
  onEnbaledCalendarsChange() {
    this.selectedTab = this.enabledCalendars[0];
  }

  @Watch('value')
  onValueChange() {
    if (this.value.duration && this.enabledCalendars.includes(this.value.duration)) {
      this.selectTab(this.value.duration);
    }
  }

  get currentValue(): CustomDateRange {
    return this.value;
  }

  set currentValue(value: CustomDateRange) {
    this.$emit('input', value);
  }

  get calendarGranularity(): string | undefined {
    return this.selectedTab !== 'day' ? this.selectedTab : undefined;
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
