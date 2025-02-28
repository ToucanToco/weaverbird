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
import { type PropType, defineComponent } from 'vue';

import Calendar from '@/components/DatePicker/Calendar.vue';
import CustomGranularityCalendar from '@/components/DatePicker/CustomGranularityCalendar.vue';
import Tabs from '@/components/Tabs.vue';
import type { CustomDateRange, DateRange } from '@/lib/dates';
import type { LocaleIdentifier } from '@/lib/internationalization';
import t from '@/lib/internationalization';

export default defineComponent({
  name: 'tabbed-range-calendars',

  components: {
    Tabs,
    Calendar,
    CustomGranularityCalendar,
  },

  props: {
    value: {
      type: Object as PropType<CustomDateRange>,
      default: () => ({}),
    },

    bounds: {
      type: Object as PropType<DateRange>,
      default: () => ({}),
    },

    enabledCalendars: {
      type: Array as PropType<string[]>,
      default: () => ['year', 'quarter', 'month', 'week', 'day'],
    },

    locale: {
      type: String as PropType<LocaleIdentifier>,
    },

    compactMode: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
  },

  emits: {
    input: (_val: CustomDateRange) => true,
  },

  data(): {
    selectedTab: string;
  } {
    return {
      selectedTab: this.enabledCalendars[0],
    };
  },

  computed: {
    currentValue: {
      get(): CustomDateRange {
        return this.value;
      },
      set(value: CustomDateRange) {
        this.$emit('input', value);
      },
    },

    calendarGranularity(): string | undefined {
      return this.selectedTab !== 'day' ? this.selectedTab : undefined;
    },
  },

  created() {
    this.updateTabForCurrentValue();
  },

  methods: {
    updateTabForCurrentValue() {
      if (this.value.duration && this.enabledCalendars.includes(this.value.duration)) {
        this.selectTab(this.value.duration);
      }
    },

    selectTab(tab: string) {
      this.selectedTab = tab;
    },

    translateTab(tab: string) {
      return t(tab.toUpperCase(), this.locale);
    },
  },

  watch: {
    enabledCalendars: {
      handler: function onEnabledCalendarsChange() {
        if (
          !this.enabledCalendars.includes(this.selectedTab) ||
          (this.value.duration && !this.enabledCalendars.includes(this.value.duration))
        ) {
          this.selectedTab = this.enabledCalendars[0];
        }
      },
    },

    value: {
      handler: function onValueChange() {
        this.updateTabForCurrentValue();
      },
    },
  },
});
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
