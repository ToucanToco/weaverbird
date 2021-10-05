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

@Component({
  name: 'month-calendar',
  components: {
    FAIcon,
  },
})
export default class MonthCalendar extends Vue {
  @Prop()
  value?: DateRange;

  currentNavRangeStart: DateTime = DateTime.now();

  get currentNavRangeLabel(): string {
    return this.currentNavRangeStart.year;
  }

  get currentNavRangeRangeStarts(): DateTime[] {
    const selectedYear = this.currentNavRangeStart.year;
    return Array.from({ length: 12 }, (_v, i) => {
      return DateTime.utc(selectedYear, i + 1, 1, 0, 0, 0, { locale: 'en' });
    });
  }

  get selectedRangeStart(): DateTime | undefined {
    if (!this.value) return undefined;
    return DateTime.fromJSDate(this.value.start, { zone: 'utc', locale: 'en' }).set({
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
  }

  selectableRangeLabel(date: DateTime): string {
    return date.monthLong;
  }

  isSelectedRange(date: DateTime) {
    return this.selectedRangeStart?.equals(date);
  }

  created() {
    if (this.selectedRangeStart) this.currentNavRangeStart = this.selectedRangeStart;
  }

  selectPreviousNavRange() {
    this.currentNavRangeStart = this.currentNavRangeStart.minus({ year: 1 });
  }

  selectNextNavRange() {
    this.currentNavRangeStart = this.currentNavRangeStart.plus({ year: 1 });
  }

  selectRange(date: DateTime) {
    this.$emit('input', {
      start: date.toJSDate(),
      end: date.plus({ month: 1 }).toJSDate(),
      duration: 'month',
    });
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
