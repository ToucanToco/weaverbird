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
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

import FAIcon from '@/components/FAIcon.vue';
import { DateRange } from '@/lib/dates';

import { AvailableDuration, GranularityConfig, RANGE_PICKERS } from './GranularityConfigs';

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
  granularity!: AvailableDuration;

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
    if (!this.value || !this.value.start) return undefined;
    return this.pickerConfig.selectableRanges.rangeToOption(this.value.start);
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

  @Watch('granularity')
  updateSelectedRange() {
    if (this.selectedRangeStart) this.selectRange(this.selectedRangeStart);
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

  &--week {
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
