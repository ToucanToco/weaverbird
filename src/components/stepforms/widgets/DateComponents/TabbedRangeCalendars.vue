<template>
  <div :class="{ 'tabbed-ranged-calendar--compact': compactMode }">
    <Tabs
      v-if="enabledCalendars.length > 1"
      :tabs="enabledCalendars"
      :selectedTab="selectedTab"
      @tabSelected="selectTab"
      :format-tab="translateTab"
      :compactMode="compactMode"
    />
    <div class="widget-multi-date-input__body">
      <Calendar
        v-if="selectedTab === 'day'"
        v-model="currentValue"
        :availableDates="bounds"
        isRange
        :locale="locale"
      />
      <CustomGranularityCalendar
        v-else-if="calendarGranularity"
        v-model="currentValue"
        :granularity="calendarGranularity"
        :bounds="bounds"
        :locale="locale"
        :compactMode="compactMode"
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
import t, { LocaleIdentifier } from '@/lib/internationalization';

@Component({
  name: 'tabbed-range-calendars',
  components: {
    Tabs,
    Calendar,
    CustomGranularityCalendar,
  },
})
export default class TabbedRangeCalendars extends Vue {
  @Prop({ default: () => ({}) })
  value!: CustomDateRange;

  @Prop({ default: () => ({}) })
  bounds!: DateRange;

  @Prop({ default: () => ['year', 'quarter', 'month', 'week', 'day'] })
  enabledCalendars!: string[];

  @Prop({ type: String, required: false })
  locale?: LocaleIdentifier;

  @Prop({ default: false })
  compactMode!: boolean;

  selectedTab = this.enabledCalendars[0];

  created() {
    this.updateTabForCurrentValue();
  }

  @Watch('enabledCalendars')
  onEnabledCalendarsChange() {
    if (
      !this.enabledCalendars.includes(this.selectedTab) ||
      (this.value.duration && !this.enabledCalendars.includes(this.value.duration))
    ) {
      this.selectedTab = this.enabledCalendars[0];
    }
  }

  @Watch('value')
  onValueChange() {
    this.updateTabForCurrentValue();
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

  updateTabForCurrentValue() {
    if (this.value.duration && this.enabledCalendars.includes(this.value.duration)) {
      this.selectTab(this.value.duration);
    }
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  translateTab(tab: string) {
    return t(tab.toUpperCase(), this.locale);
  }
}
</script>

<style scoped lang="scss">
.widget-multi-date-input__body {
  padding: 20px;
  ::v-deep .vc-container {
    border: none;
    margin: 1px;
    padding: 0;
    width: 100%;
  }
}
.tabbed-ranged-calendar--compact {
  .widget-multi-date-input__body {
    padding: 10px;
  }
}
</style>
