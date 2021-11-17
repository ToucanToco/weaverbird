<template>
  <div
    class="custom-granularity-calendar"
    :class="{
      'custom-granularity-calendar--compact': compactMode,
    }"
    data-cy="weaverbird-custom-granularity-calendar"
  >
    <div class="custom-granularity-calendar__header">
      <div
        class="custom-granularity-calendar__header-btn header-btn__previous"
        :class="{ 'custom-granularity-calendar__header-btn--disabled': prevNavRangeDisabled }"
        data-cy="weaverbird-custom-granularity-calendar__previous"
        @click="selectPreviousNavRange"
      >
        <FAIcon icon="chevron-left" />
      </div>
      {{ currentNavRangeLabel }}
      <div
        class="custom-granularity-calendar__header-btn header-btn__next"
        :class="{ 'custom-granularity-calendar__header-btn--disabled': nextNavRangeDisabled }"
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
        v-for="option in selectableOptions"
        :class="{
          'custom-granularity-calendar__option': true,
          'custom-granularity-calendar__option--selected': option.selected,
          'custom-granularity-calendar__option--disabled': option.disabled,
        }"
        :key="option.label"
        @click="option.disabled ? null : selectRange(option.range)"
      >
        <div class="custom-granularity-calendar__option-label">
          {{ option.label }}
        </div>
        <div v-if="option.description" class="custom-granularity-calendar__option-description">
          {{ option.description }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { DateTime } from 'luxon';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

import FAIcon from '@/components/FAIcon.vue';
import { clampRange, DateRange } from '@/lib/dates';
import { LocaleIdentifier } from '@/lib/internationalization';

import { AvailableDuration, GranularityConfig, RANGE_PICKERS } from './GranularityConfigs';

type SelectableOption = {
  label: string;
  range: Required<DateRange>;
  description: string;
  selected: boolean;
  disabled: boolean;
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
  granularity!: AvailableDuration;

  @Prop({ default: () => [] })
  bounds!: DateRange;

  @Prop({ type: String, required: false })
  locale?: LocaleIdentifier;

  @Prop({ default: false })
  compactMode!: boolean;

  currentNavRangeStart: DateTime = DateTime.now();

  get pickerConfig(): GranularityConfig {
    return RANGE_PICKERS[this.granularity];
  }

  get currentNavRangeLabel(): string {
    return this.pickerConfig.navRange.label(this.currentNavRangeStart, this.locale);
  }

  get currentNavRangeRangeStarts(): DateTime[] {
    return this.pickerConfig.selectableRanges.currentOptions(this.currentNavRangeStart);
  }

  get boundedValue(): DateRange | undefined {
    if (!this.value || !this.value.start) return undefined;
    return clampRange(this.value, this.bounds);
  }

  get selectedRangeStart(): DateTime | undefined {
    if (!this.boundedValue?.start) return undefined;
    return this.pickerConfig.selectableRanges.rangeToOption(this.boundedValue.start);
  }

  // A period is disabled if it has no overlap with the bounds
  isOptionDisabled(date: DateTime): boolean {
    const { start, end } = this.pickerConfig.selectableRanges.optionToRange(date);
    const endBeforeStartBound = this.bounds.start ? end < this.bounds.start : false;
    const startAfterEndBound = this.bounds.end ? start >= this.bounds.end : false;
    return endBeforeStartBound || startAfterEndBound;
  }

  get selectableOptions(): SelectableOption[] {
    return this.currentNavRangeRangeStarts.map(date => {
      const range = this.retrieveRangeFromOption(date);
      const description = this.pickerConfig.selectableRanges.description(range, this.locale);
      const label = this.pickerConfig.selectableRanges.label(date, this.locale);
      const selected = this.selectedRangeStart?.equals(date) ?? false;
      const disabled = this.isOptionDisabled(date);
      return { label, range, description, selected, disabled };
    });
  }

  // The previous button should be disabled if the last selectable option of the previous range should be disabled
  get prevNavRangeDisabled(): boolean {
    const previousNavRangeStart = this.pickerConfig.navRange.prev(this.currentNavRangeStart);
    const previousNavRangeStarts = this.pickerConfig.selectableRanges.currentOptions(
      previousNavRangeStart,
    );
    const lastPreviousNavRangeStart = previousNavRangeStarts[previousNavRangeStarts.length - 1];
    return this.isOptionDisabled(lastPreviousNavRangeStart);
  }

  // The next button should be disabled if the first selectable option of the next range should be disabled
  get nextNavRangeDisabled(): boolean {
    const nextNavRangeStart = this.pickerConfig.navRange.next(this.currentNavRangeStart);
    const nextNavRangeStarts = this.pickerConfig.selectableRanges.currentOptions(nextNavRangeStart);
    const firstNextNavRangeStart = nextNavRangeStarts[0];
    return this.isOptionDisabled(firstNextNavRangeStart);
  }

  created() {
    this.updateSelectedRange();
  }

  selectPreviousNavRange() {
    this.currentNavRangeStart = this.pickerConfig.navRange.prev(this.currentNavRangeStart);
  }

  selectNextNavRange() {
    this.currentNavRangeStart = this.pickerConfig.navRange.next(this.currentNavRangeStart);
  }

  retrieveRangeFromOption(date: DateTime): Required<DateRange> {
    return this.pickerConfig.selectableRanges.optionToRange(date);
  }

  selectRange(range: DateRange | undefined) {
    this.$emit('input', range);
  }

  updateNavStart(): void {
    if (this.selectedRangeStart) {
      // update navigation start to retrieve page with available options containing selected date range
      this.currentNavRangeStart = this.selectedRangeStart;
    } else if (this.bounds.start) {
      // update nav start to retrieve page with available options for selected bound start
      this.currentNavRangeStart = this.pickerConfig.selectableRanges.rangeToOption(
        this.bounds.start,
      );
    }
  }

  @Watch('bounds')
  resetRangeOutOfBounds() {
    if (this.bounds.start && this.value && !this.boundedValue) {
      this.selectRange(undefined);
    }
    this.updateNavStart();
  }

  @Watch('granularity')
  updateSelectedRange() {
    if (this.selectedRangeStart) {
      const range = this.retrieveRangeFromOption(this.selectedRangeStart);
      this.selectRange(range);
    }
    this.updateNavStart();
  }
}
</script>

<style scoped lang="scss">
@import '../../styles/variables';

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

  &--disabled {
    cursor: not-allowed;
    opacity: 0.5;
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
    .custom-granularity-calendar__option-label {
      font-weight: bold;
    }
  }
}

.custom-granularity-calendar__option {
  border-radius: 4px;
  padding: 6px 0;
  cursor: pointer;

  &:hover {
    color: var(--weaverbird-theme-main-color-dark, $active-color-dark);
    background: var(--weaverbird-theme-main-color-extra-light, $active-color-faded-3);
  }

  &--selected {
    color: var(--weaverbird-theme-main-color-dark, $active-color-dark);
    background: var(--weaverbird-theme-main-color-light, $active-color-faded-2);
    .custom-granularity-calendar__option-label {
      font-weight: bold;
    }
  }

  &--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.custom-granularity-calendar__option-description {
  font-size: 12px;
  padding-top: 7px;
}

.custom-granularity-calendar__body--quarter .custom-granularity-calendar__option {
  padding: 20px 0;
}

.custom-granularity-calendar--compact {
  width: 100%;
  .custom-granularity-calendar__body {
    grid-gap: 10px;
  }
  .custom-granularity-calendar__option-description {
    font-size: 11px;
  }
}
</style>
