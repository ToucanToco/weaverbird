<template>
  <div class="custom-granularity-calendar" data-cy="weaverbird-custom-granularity-calendar">
    <div class="custom-granularity-calendar__header">
      <div
        class="custom-granularity-calendar__header-btn header-btn__previous"
        data-cy="weaverbird-custom-granularity-calendar__previous"
        @click="selectPreviousNavRange"
      >
        <FAIcon icon="chevron-left" />
      </div>
      {{ currentNavRangeLabel }}
      <div
        class="custom-granularity-calendar__header-btn header-btn__next"
        data-cy="weaverbird-custom-granularity-calendar__next"
        @click="selectNextNavRange"
      >
        <FAIcon icon="chevron-right" />
      </div>
    </div>
    <div
      :class="{
        'custom-granularity-calendar__body': true,
        [`custom-granularity-calendar__body--${granularity}`]: true,
      }"
    >
      <div
        v-for="date in currentNavRangeRangeStarts"
        :class="{
          'custom-granularity-calendar__option': true,
          'custom-granularity-calendar__option--selected': isSelectedRange(date),
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

// Types

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

type AvailableDuration = 'year' | 'quarter' | 'month';

// Navigations

const YEAR_NAV = {
  label: (dt: DateTime): string => dt.year,
  prev: (dt: DateTime): DateTime => dt.minus({ year: 1 }),
  next: (dt: DateTime): DateTime => dt.plus({ year: 1 }),
};

const DECADE_NAV = {
  label: (dt: DateTime): string => {
    const decadeStart = Math.floor(dt.year / 10) * 10;
    return `${decadeStart}-${decadeStart + 10}`;
  },
  prev: (dt: DateTime): DateTime => dt.minus({ year: 10 }),
  next: (dt: DateTime): DateTime => dt.plus({ year: 10 }),
};

// Picker configs

const FIRST_DAY_OF_MONTH = {
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0,
};

const RANGE_PICKERS: Record<AvailableDuration, GranularityConfig> = {
  month: {
    navRange: YEAR_NAV,
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
        DateTime.fromJSDate(selectedRange.start, { zone: 'utc', locale: 'en' }).set(
          FIRST_DAY_OF_MONTH,
        ),
    },
  },
  quarter: {
    navRange: YEAR_NAV,
    selectableRanges: {
      label: (dt: DateTime): string => `Quarter ${dt.quarter}`,
      currentOptions: (currentNavRangeStart: DateTime): DateTime[] => {
        return Array.from({ length: 4 }, (_v, i) => {
          return DateTime.utc(currentNavRangeStart.year, i * 3 + 1, 1, 0, 0, 0, { locale: 'en' });
        });
      },
      optionToRange: (selectedOption: DateTime): DateRange => ({
        start: selectedOption.toJSDate(),
        end: selectedOption.plus({ month: 3 }).toJSDate(),
        duration: 'quarter',
      }),
      rangeToOption: (selectedRange: DateRange): DateTime => {
        const dt = DateTime.fromJSDate(selectedRange.start, { zone: 'utc', locale: 'en' });
        return dt.set({
          month: (dt.quarter - 1) * 3 + 1,
          ...FIRST_DAY_OF_MONTH,
        });
      },
    },
  },
  year: {
    navRange: DECADE_NAV,
    selectableRanges: {
      label: (dt: DateTime): string => dt.year,
      currentOptions: (currentNavRangeStart: DateTime): DateTime[] => {
        const decadeStart = Math.floor(currentNavRangeStart.year / 10) * 10;
        return Array.from({ length: 11 }, (_v, i) => {
          return DateTime.utc(decadeStart + i, 1, 1, 0, 0, 0, { locale: 'en' });
        });
      },
      optionToRange: (selectedOption: DateTime): DateRange => ({
        start: selectedOption.toJSDate(),
        end: selectedOption.plus({ year: 1 }).toJSDate(),
        duration: 'year',
      }),
      rangeToOption: (selectedRange: DateRange): DateTime =>
        DateTime.fromJSDate(selectedRange.start, { zone: 'utc', locale: 'en' }).set({
          month: 1,
          ...FIRST_DAY_OF_MONTH,
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
.custom-granularity-calendar {
  box-sizing: border-box;
  width: 330px;
}

.custom-granularity-calendar__header {
  display: flex;
  justify-content: space-between;
  height: 40px;
  align-items: center;
  user-select: none;
  font-size: 14px;
  font-weight: bold;
}

.custom-granularity-calendar__header-btn {
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

.custom-granularity-calendar__body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  text-align: center;
  grid-gap: 18px;
  margin: 16px 0;
  font-size: 13px;

  &--quarter {
    grid-template-columns: repeat(2, 1fr);
  }
}

.custom-granularity-calendar__option {
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

.custom-granularity-calendar__body--quarter .custom-granularity-calendar__option {
  padding: 20px 0;
}
</style>
