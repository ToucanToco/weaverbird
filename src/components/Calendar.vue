<template>
  <DatePicker
    :value="value"
    :availableDates="availableDates"
    :attributes="highlights"
    :select-attribute="selectedDatesStyle"
    :drag-attribute="rangeSelectedDatesStyle"
    :is-range="isRange"
    timeformat="UTC"
    @input="onInput"
  />
</template>

<script lang="ts">
import DatePicker from 'v-calendar/lib/components/date-picker.umd';
import { Component, Prop, Vue } from 'vue-property-decorator';

import { DatePickerHighlight, DateRange } from '@/lib/dates';

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

  /* istanbul ignore next */
  onInput(value: Date | DateRange | undefined): void {
    this.$emit('input', value);
  }
}
</script>

<style scoped lang="scss">
$base-color: #19181a;
$active-color: #16406a;
$active-color-light: #dde6f0;
$active-color-extra-light: #f8f7fa;
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
    &:hover {
      background-color: $active-color-extra-light;
      font-weight: 500;
      color: $active-color;
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
      color: $active-color;
      font-weight: 500;
    }
  }
  .calendar-value {
    background-color: $active-color-light;
    z-index: 2;
    border-radius: 4px !important;
  }
  // Range
  .calendar-value.vc-highlight-base-middle,
  .calendar-range {
    background-color: $active-color-extra-light;
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
      background-color: $active-color-extra-light;
      color: $active-color;
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
  border: 1px solid $active-color-light;
  .vc-nav-item,
  .vc-nav-title {
    color: $base-color;
    font-family: 'Montserrat', sans-serif;
    font-size: 13px;
    border: none;
    border-radius: 2px;
    &.is-active {
      background-color: $active-color-light;
      box-shadow: none;
    }
    &.is-current {
      color: $base-color;
    }
    &:hover {
      background-color: $active-color-extra-light;
      color: $active-color;
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
    background: $active-color-extra-light;
  }
}
</style>
