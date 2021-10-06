<template>
  <div class="month-calendar" data-cy="weaverbird-month-calendar">
    <div class="month-calendar__header">
      <div
        class="month-calendar__header-btn header-btn__previous"
        data-cy="weaverbird-month-calendar__previous"
        @click="selectPreviousNavRange"
      >
        <FAIcon icon="chevron-left" />
      </div>
      {{ currentNavRangeLabel }}
      <div
        class="month-calendar__header-btn header-btn__next"
        data-cy="weaverbird-month-calendar__next"
        @click="selectNextNavRange"
      >
        <FAIcon icon="chevron-right" />
      </div>
    </div>
    <div class="month-calendar__body">
      <div
        v-for="date in currentNavRangeRangeStarts"
        :class="{
          'month-calendar__option': true,
          'month-calendar__option--selected': isSelectedRange(date),
        }"
        :key="selectableRangeLabel(date)"
        @click="selectRange(date)"
      >
        {{ selectableRangeLabel(date) }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { DateTime } from 'luxon';
import { Component, Prop, Vue } from 'vue-property-decorator';

import FAIcon from '@/components/FAIcon.vue';
import { DateRange } from '@/lib/dates';

type GranularityConfig = {
  navRange: {
    label: (dt: DateTime) => string;
    prev: (dt: DateTime) => DateTime;
    next: (dt: DateTime) => DateTime;
  };
  selectableRanges: {
    label: (dt: DateTime) => string;
    currentOptions: (currentNavRangeStart: DateTime) => DateTime[];
    optionToRange: (selectedOption: DateTime) => DateRange;
    rangeToOption: (selectedRange: DateRange) => DateTime;
  };
};

type AvailableDuration = 'month';

const RANGE_PICKERS: Record<AvailableDuration, GranularityConfig> = {
  month: {
    navRange: {
      label: (dt: DateTime): string => dt.year,
      prev: (dt: DateTime): DateTime => dt.minus({ year: 1 }),
      next: (dt: DateTime): DateTime => dt.plus({ year: 1 }),
    },
    selectableRanges: {
      label: (dt: DateTime): string => dt.monthLong,
      currentOptions: (currentNavRangeStart: DateTime): DateTime[] => {
        const navYear = currentNavRangeStart.year;
        return Array.from({ length: 12 }, (_v, i) => {
          return DateTime.utc(navYear, i + 1, 1, 0, 0, 0, { locale: 'en' });
        });
      },
      optionToRange: (selectedOption: DateTime): DateRange => ({
        start: selectedOption.toJSDate(),
        end: selectedOption.plus({ month: 1 }).toJSDate(),
        duration: 'month',
      }),
      rangeToOption: (selectedRange: DateRange): DateTime =>
        DateTime.fromJSDate(selectedRange.start, { zone: 'utc', locale: 'en' }).set({
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
        }),
    },
  },
};

@Component({
  name: 'custom-granularity-calendar',
  components: {
    FAIcon,
  },
})
export default class CustomGranularityCalendar extends Vue {
  @Prop()
  value?: DateRange;

  @Prop({ required: true })
  granularity: AvailableDuration;

  currentNavRangeStart: DateTime = DateTime.now();

  get pickerConfig(): GranularityConfig {
    return RANGE_PICKERS[this.granularity];
  }

  get currentNavRangeLabel(): string {
    return this.pickerConfig.navRange.label(this.currentNavRangeStart);
  }

  get currentNavRangeRangeStarts(): DateTime[] {
    return this.pickerConfig.selectableRanges.currentOptions(this.currentNavRangeStart);
  }

  get selectedRangeStart(): DateTime | undefined {
    if (!this.value) return undefined;
    return this.pickerConfig.selectableRanges.rangeToOption(this.value);
  }

  selectableRangeLabel(date: DateTime): string {
    return this.pickerConfig.selectableRanges.label(date);
  }

  isSelectedRange(date: DateTime) {
    return this.selectedRangeStart?.equals(date);
  }

  created() {
    if (this.selectedRangeStart) this.currentNavRangeStart = this.selectedRangeStart;
  }

  selectPreviousNavRange() {
    this.currentNavRangeStart = this.pickerConfig.navRange.prev(this.currentNavRangeStart);
  }

  selectNextNavRange() {
    this.currentNavRangeStart = this.pickerConfig.navRange.next(this.currentNavRangeStart);
  }

  selectRange(date: DateTime) {
    this.$emit('input', this.pickerConfig.selectableRanges.optionToRange(date));
  }
}
</script>

<style scoped lang="scss">
.month-calendar {
  box-sizing: border-box;
  width: 330px;
}

.month-calendar__header {
  display: flex;
  justify-content: space-between;
  height: 40px;
  align-items: center;
  user-select: none;
  font-size: 14px;
  font-weight: bold;
}

.month-calendar__header-btn {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #f8f7fa;
  }
}

.month-calendar__body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  text-align: center;
  grid-gap: 18px;
  margin: 16px 0;
  font-size: 13px;
}

.month-calendar__option {
  border-radius: 4px;
  padding: 6px 0;
  cursor: pointer;

  &:hover {
    background: #f8f7fa;
  }

  &--selected {
    background: #e4efec;
    font-weight: bold;
  }
}
</style>
