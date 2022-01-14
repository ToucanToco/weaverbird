<template>
  <DatePicker
    :value="boundedValue"
    :availableDates="availableDates"
    :attributes="highlights"
    :select-attribute="selectedDatesStyle"
    :drag-attribute="rangeSelectedDatesStyle"
    :is-range="isRange"
    :from-date="defaultDate"
    :locale="locale"
    timeformat="UTC"
    timezone="UTC"
    :model-config="datePickerModelConfig"
    @input="onInput"
    @drag="onDrag"
  />
</template>

<script lang="ts">
import _isEmpty from 'lodash/isEmpty';
import _isEqual from 'lodash/isEqual';
import DatePicker from 'v-calendar/src/components/DatePicker.vue';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

import { clampRange, DatePickerHighlight, DateRange, isDateRange } from '@/lib/dates';
import { LocaleIdentifier } from '@/lib/internationalization';

@Component({
  name: 'calendar',
  components: {
    DatePicker,
  },
})
export default class Calendar extends Vue {
  @Prop({ default: undefined })
  value!: Date | DateRange | undefined;

  @Prop({ default: undefined })
  highlightedDates!: DateRange | undefined;

  @Prop({ default: () => ({ start: undefined, end: undefined }) })
  availableDates!: DateRange;

  @Prop({ default: false })
  isRange!: boolean;

  @Prop({ type: String, required: false })
  locale?: LocaleIdentifier;

  defaultDate: '' | Date = '';

  get boundedValue(): Date | DateRange | undefined {
    if (
      !(this.value instanceof Date) &&
      isDateRange(this.value) &&
      isDateRange(this.availableDates)
    ) {
      return clampRange(this.value, this.availableDates);
    }
    return this.value;
  }

  // Emitted values should always been days at midnight (UTC)
  get datePickerModelConfig(): object {
    return {
      timeAdjust: '00:00:00',
      start: {
        timeAdjust: '00:00:00',
      },
      end: {
        timeAdjust: '23:59:59',
      },
    };
  }

  get shouldUpdateDefaultDate(): boolean {
    return (
      !this.boundedValue || (!(this.boundedValue instanceof Date) && !this.boundedValue?.start)
    );
  }

  get selectedDatesStyle(): DatePickerHighlight {
    return {
      highlight: {
        class: 'calendar-value',
        contentClass: 'calendar-content',
      },
    };
  }

  get rangeSelectedDatesStyle(): DatePickerHighlight {
    return {
      highlight: {
        class: 'calendar-range',
        contentClass: 'calendar-content',
      },
    };
  }

  // style to apply to dates to highlight to fake a range selected behaviour
  get highlights(): DatePickerHighlight[] {
    if (!this.highlightedDates) return [];
    return [
      {
        key: 'highlighted',
        highlight: this.rangeSelectedDatesStyle.highlight,
        dates: this.highlightedDates,
      },
    ];
  }

  created() {
    if (this.shouldUpdateDefaultDate) {
      this.defaultDate = this.availableDates?.start ?? '';
    }

    if (!_isEqual(this.boundedValue, this.value)) {
      this.onInput(this.boundedValue);
    }
  }

  onInput(value: Date | DateRange | undefined): void {
    if (value == null || value instanceof Date) {
      this.$emit('input', value);
    } else {
      this.$emit('input', { ...value, duration: 'day' });
    }
  }

  // when user start to select a range he has only start value selected, we disable validate button until he select the end value
  onDrag(dragValue: DateRange): void {
    this.onInput({ start: dragValue.start, duration: 'day' });
  }

  @Watch('availableDates')
  resetValueOutOfBounds() {
    if (this.availableDates.start && _isEmpty(this.boundedValue)) {
      if (this.value) this.onInput(undefined);
      this.defaultDate = this.availableDates.start;
    }
  }
}
</script>

<style scoped lang="scss">
@import '../../styles/variables';
$disabled-color: #bababa;

.vc-container {
  border-radius: 0;
  padding: 5px 10px;
  border-color: #eee;
}

::v-deep .vc-pane-container {
  // calendar item
  .vc-highlight {
    width: 100% !important;
    border-radius: 0;
    border: none;
  }
  .vc-day-content {
    width: 100% !important;
    border-radius: 0;
    border: none;
    font-weight: 300;
    font-size: 13px;
    font-family: 'Montserrat', sans-serif;
    color: $base-color;
    &:focus {
      background-color: transparent;
    }
    &:hover {
      background-color: var(--weaverbird-theme-main-color-extra-light, $active-color-faded-3);
      font-weight: 500;
      color: var(--weaverbird-theme-main-color-dark, $active-color-dark);
    }
  }
  .vc-day-content.is-disabled {
    color: $disabled-color;
    &:hover {
      background-color: white;
      font-weight: 300;
      color: $disabled-color;
    }
  }
  .calendar-content {
    &,
    &:focus {
      color: var(--weaverbird-theme-main-color-dark, $active-color-dark);
      font-weight: 500;
      background-color: transparent;
    }
  }
  .calendar-value {
    background-color: var(--weaverbird-theme-main-color-light, $active-color-faded-2);
    z-index: 2;
    border-radius: 4px !important;
  }
  // Range
  .calendar-value.vc-highlight-base-middle,
  .calendar-range {
    background-color: var(--weaverbird-theme-main-color-extra-light, $active-color-faded-3);
  }
  .vc-highlight.vc-highlight-base-end,
  .vc-highlight.vc-highlight-base-start {
    width: 100% !important;
    border-radius: 0px !important;
  }
  .vc-highlight.vc-highlight-base-start {
    border-top-left-radius: 4px !important;
    border-bottom-left-radius: 4px !important;
  }
  .vc-highlight.vc-highlight-base-end {
    border-top-right-radius: 4px !important;
    border-bottom-right-radius: 4px !important;
  }
  // Header
  .vc-title {
    color: $base-color;
    font-size: 14px;
    font-family: 'Montserrat', sans-serif;
    padding: 0 10px;
    border-radius: 2px;
    &:hover {
      background-color: var(--weaverbird-theme-main-color-extra-light, $active-color-faded-3);
      color: var(--weaverbird-theme-main-color-dark, $active-color-dark);
      opacity: 1;
    }
  }
  .vc-weekday {
    color: $base-color;
    font-size: 13px;
    font-family: 'Montserrat', sans-serif;
  }
}
// Navigation
::v-deep .vc-nav-popover-container {
  background: white;
  box-shadow: none;
  border: 1px solid var(--weaverbird-theme-main-color-light, $active-color-faded-2);
  .vc-nav-item,
  .vc-nav-title {
    color: $base-color;
    font-family: 'Montserrat', sans-serif;
    font-size: 13px;
    border: none;
    border-radius: 2px;
    &.is-active {
      background-color: var(--weaverbird-theme-main-color-light, $active-color-faded-2);
      box-shadow: none;
    }
    &.is-current {
      color: $base-color;
    }
    &:hover {
      background-color: var(--weaverbird-theme-main-color-extra-light, $active-color-faded-3);
      color: var(--weaverbird-theme-main-color-dark, $active-color-dark);
    }
  }
  .vc-nav-item {
    font-weight: 300;
  }
}

::v-deep .vc-nav-arrow,
::v-deep .vc-arrow {
  color: $base-color;
  border-radius: 2px;
  border: none;
  > .vc-svg-icon {
    width: 15px;
    height: 15px;
    margin: 7px;
  }
  &:hover {
    background: var(--weaverbird-theme-main-color-extra-light, $active-color-faded-3);
  }
}
</style>
