<template>
  <div
    class="widget-date-input"
    :style="themeCSSVariables"
    :class="{
      'widget-date-input--colored-background': coloredBackground,
      'widget-date-input--compact': compactMode,
      'widget-date-input--hide-label': hideLabel,
      'widget-date-input--reset': !!value,
    }"
  >
    <div class="widget-date-input__container" @click.stop="openEditor">
      <span class="widget-date-input__label" v-if="!hideLabel" v-html="label" />
      <div class="widget-date-input__reset-button" v-if="!!value" @click.stop="resetValue">
        <FAIcon icon="times" class="widget-date-input__reset-button-icon" />
      </div>
      <div class="widget-date-input__type-icon">
        <FAIcon icon="far calendar" />
      </div>
    </div>
    <popover
      class="widget-date-input__editor"
      :class="{ 'widget-date-input__editor--compact': compactMode }"
      :alwaysOpened="alwaysOpened"
      :visible="isEditorOpened"
      :align="popoverAlignement"
      :forcePositionUpdate="forcePopoverToUpdatePosition"
      :style="themeCSSVariables"
      bottom
      @closed="closeEditor"
    >
      <div class="widget-date-input__editor-container">
        <CustomVariableList
          v-if="displayVariableList"
          class="widget-date-input__editor-side"
          :availableVariables="accessibleVariables"
          :selectedVariables="selectedVariables"
          :enableCustom="enableCustom"
          :customLabel="customLabel"
          :enableAdvancedVariable="false"
          @selectCustomVariable="editCustomVariable"
          @input="selectVariable"
        />
        <div
          class="widget-date-input__editor-content"
          v-if="enableCustom"
          v-show="displayCustomEditor"
          ref="custom-editor"
        >
          <Tabs
            v-if="enableRelativeDate"
            class="widget-date-input__editor-header"
            :tabs="tabs"
            :selectedTab="selectedTab"
            @tabSelected="selectTab"
          />
          <div class="widget-date-input__editor-body">
            <div v-if="isFixedTabSelected">
              <TabbedRangeCalendars
                v-model="currentTabValue"
                :enabledCalendars="enabledCalendars"
                :bounds="boundsAsDateRange"
                :locale="locale"
                :compactMode="compactMode"
              />
            </div>
            <RelativeDateForm
              v-else
              v-model="currentTabValue"
              :availableVariables="relativeAvailableVariables"
              :variableDelimiters="variableDelimiters"
            />
          </div>
          <div class="widget-date-input__editor-footer">
            <div
              class="widget-date-input__editor-button"
              ref="cancel"
              @click="closeEditor"
              v-text="t('CANCEL')"
            />
            <div
              class="widget-date-input__editor-button widget-date-input__editor-button--primary"
              :class="{ 'widget-date-input__editor-button--disabled': hasInvalidTabValue }"
              ref="save"
              :disabled="hasInvalidTabValue"
              @click="saveCustomVariable"
              v-text="t('SET_DATE')"
            />
          </div>
        </div>
      </div>
    </popover>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { POPOVER_ALIGN } from '@/components/constants';
import Calendar from '@/components/DatePicker/Calendar.vue';
import { transformValueToDateRange } from '@/components/DatePicker/transform-value-to-date-or-range';
import FAIcon from '@/components/FAIcon.vue';
import Popover from '@/components/Popover.vue';
import Tabs from '@/components/Tabs.vue';
import {
  CustomDateRange,
  DateRange,
  dateRangeToString,
  isDateRange,
  isRelativeDate,
  relativeDateToString,
} from '@/lib/dates';
import t, { LocaleIdentifier } from '@/lib/internationalization';
import {
  AvailableVariable,
  extractVariableIdentifier,
  VariableDelimiters,
  VariablesBucket,
} from '@/lib/variables';

import CustomVariableList from './CustomVariableList.vue';
import RelativeDateForm from './RelativeDateForm.vue';
import TabbedRangeCalendars from './TabbedRangeCalendars.vue';

/**
 * This component allow to select a variable or to switch between tabs and select a date range on a Fixed (Calendar) or Relative way (RelativeDateForm),
 * each tab value is kept in memory to avoid user to loose data when switching between tabs
 *
 * DateRangeInput component will take any date range type of value as entry (VariableIdentifier, DateRange or RelativeDate)
 * This entry is used as a configuration for the date range input
 * This configuration will be returned by the @input emit
 *
 * In another emitted property, DateRangeInput component will return a DateRange @dateRangeValueUpdated
 * This returned value is a calculated form of the config into a date range { start: Date, end: Date } in order to be used
 */
@Component({
  name: 'date-range-input',
  components: {
    CustomVariableList,
    Popover,
    Tabs,
    Calendar,
    RelativeDateForm,
    FAIcon,
    TabbedRangeCalendars,
  },
})
export default class DateRangeInput extends Vue {
  @Prop()
  value!: string | CustomDateRange | undefined;

  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;

  @Prop({ default: () => [] })
  relativeAvailableVariables!: VariablesBucket; // variables to use in RelativeDateForm "from"

  @Prop({ default: () => ({ start: '', end: '' }) })
  variableDelimiters!: VariableDelimiters;

  @Prop({ default: () => true })
  enableRelativeDate!: boolean;

  @Prop({ default: true })
  enableCustom!: boolean;

  @Prop()
  enabledCalendars!: string[] | undefined;

  @Prop({ default: () => ({ start: undefined, end: undefined }) })
  bounds!: CustomDateRange;

  @Prop({ type: Boolean, default: false })
  alwaysOpened!: false;

  @Prop({ type: String, required: false })
  locale?: LocaleIdentifier;

  @Prop({ default: undefined })
  themeCSSVariables!: Record<string, string> | undefined;

  @Prop({ default: false })
  coloredBackground!: boolean;

  @Prop()
  dateRangeFormatter!: (dr: DateRange, locale?: LocaleIdentifier) => string | undefined;

  @Prop({ default: false })
  compactMode!: boolean;

  @Prop({ default: false })
  hidePlaceholder!: boolean;

  isEditorOpened = false;
  isEditingCustomVariable = false; // force to expand custom part of editor
  selectedTab = 'Relative';
  forcePopoverToUpdatePosition = 0;

  get popoverAlignement(): string {
    return this.compactMode && this.isEditingCustomVariable
      ? POPOVER_ALIGN.CENTER
      : POPOVER_ALIGN.LEFT;
  }

  get accessibleVariables(): VariablesBucket {
    // some variables are required for date computations but should not be part of the variable list displayed to users
    return this.availableVariables.filter(v => v.category !== 'hidden');
  }

  get boundsAsDateRange(): DateRange | undefined {
    const dateRange = transformValueToDateRange(
      this.bounds,
      this.availableVariables,
      this.relativeAvailableVariables,
      this.variableDelimiters,
    );
    return dateRange;
  }

  get tabs(): string[] {
    return ['Relative', 'Fixed'];
  }

  // keep each tab value in memory to enable to switch between tabs without loosing content
  tabsValues: Record<string, CustomDateRange> = {
    Fixed: {}, // DateRange should be empty on init because we can have bounds so defined dates could be out of bounds
    Relative: { date: '', quantity: 1, duration: 'year', operator: 'until' },
  };

  get currentTabValue(): CustomDateRange {
    return this.tabsValues[this.selectedTab];
  }

  set currentTabValue(value: CustomDateRange) {
    this.tabsValues[this.selectedTab] = value;
  }

  get variable(): AvailableVariable | undefined {
    if (typeof this.value !== 'string') return undefined;
    const identifier = extractVariableIdentifier(this.value, this.variableDelimiters);
    return this.availableVariables.find(v => v.identifier === identifier);
  }

  get selectedVariables(): string {
    // needed to select the custom button in CustomVariableList
    if (this.isCustom) {
      return 'custom';
    } else {
      return this.variable?.identifier ?? '';
    }
  }

  get hasVariables(): boolean {
    return this.accessibleVariables.length > 0;
  }

  get hasCustomValue(): boolean {
    // value is custom if not undefined and not a preset variable
    return (this.value && !this.variable) as boolean;
  }

  get isCustom(): boolean {
    return this.hasCustomValue || this.isEditingCustomVariable;
  }

  get displayCustomEditor(): boolean {
    if (!this.hasVariables) return true;
    // in compact mode always force click on custom option to open the custom editor
    return this.compactMode ? this.isEditingCustomVariable : this.isCustom;
  }

  get displayVariableList(): boolean {
    // in compact mode display variable list only when custom editor is not opened
    if (this.compactMode) return !this.displayCustomEditor;
    return this.hasVariables;
  }

  get isFixedTabSelected(): boolean {
    return this.selectedTab === 'Fixed';
  }

  get label(): string {
    if (this.variable) {
      return this.variable.label;
    } else if (isDateRange(this.value)) {
      // Use the dateRangeFormatter function is available, and it returns a value
      if (this.dateRangeFormatter) {
        const formattedDataRange = this.dateRangeFormatter(this.value, this.locale);
        if (formattedDataRange) return formattedDataRange;
      }
      return dateRangeToString(this.value, this.locale);
    } else if (isRelativeDate(this.value)) {
      return relativeDateToString(
        this.value,
        this.relativeAvailableVariables,
        this.variableDelimiters,
      );
    } else {
      return t('SELECT_PERIOD_PLACEHOLDER', this.locale);
    }
  }

  get hideLabel(): boolean {
    return this.hidePlaceholder && !this.value;
  }

  get customLabel(): string {
    if (this.enableRelativeDate) {
      return this.t('CUSTOM');
    } else {
      return this.t('CALENDAR');
    }
  }

  get hasInvalidTabValue(): boolean {
    if (this.isFixedTabSelected) {
      return (
        !isDateRange(this.currentTabValue) ||
        !this.currentTabValue.start ||
        !this.currentTabValue.end
      );
    } else {
      return !isRelativeDate(this.currentTabValue) || !this.currentTabValue.date;
    }
  }

  created() {
    this.initTabs();
  }

  // init tabs by selecting correct tab and value based on prop value
  initTabs(): void {
    if (isDateRange(this.value)) {
      this.tabsValues.Fixed = this.value;
      this.selectTab('Fixed');
    } else if (isRelativeDate(this.value)) {
      this.tabsValues.Relative = this.value;
      this.selectTab('Relative');
    }
    // force fixed tab by default if relative date is not enabled
    if (!this.enableRelativeDate) {
      this.selectTab('Fixed');
    }
  }

  openEditor(): void {
    this.initTabs();
    this.isEditorOpened = true;
  }

  closeEditor(): void {
    this.isEditingCustomVariable = false;
    this.isEditorOpened = false;
  }

  selectVariable(value: string): void {
    const variableWithDelimiters = `${this.variableDelimiters.start}${value}${this.variableDelimiters.end}`;
    this.$emit('input', variableWithDelimiters);
    this.closeEditor();
  }

  resetValue(): void {
    this.$emit('input', undefined);
  }

  async editCustomVariable(): Promise<void> {
    this.isEditingCustomVariable = true;
    // force popover to update position to always display custom editor in visible part of screen
    await this.$nextTick();
    this.forcePopoverToUpdatePosition = this.forcePopoverToUpdatePosition + 1;
  }

  saveCustomVariable(): void {
    this.$emit('input', this.currentTabValue);
    this.closeEditor();
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
  }

  t(key: string): string {
    return t(key, this.locale);
  }
}
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';

.widget-date-input {
  max-width: 400px;
  width: 100%;
  position: relative;

  &.widget-date-input--hide-label {
    // resize container to fit calendar icon only
    display: inline-block;
    width: auto;
  }

  &.widget-date-input--reset {
    .widget-date-input__label {
      // reduce padding between reset button and label
      padding-right: 0;
    }
  }

  &.widget-date-input--compact.widget-date-input--reset {
    // hide calendar icon in compact mode to have more space to display label
    .widget-date-input__type-icon {
      display: none;
    }
  }

  &.widget-date-input--colored-background {
    .widget-date-input__label,
    .widget-date-input__reset-button {
      color: white;
    }
    .widget-date-input__reset-button + .widget-date-input__type-icon {
      // in colored mode, reduce padding because there is no background under calendar icon
      padding-left: 0;
    }
    .widget-date-input__container {
      &,
      &:hover {
        background: var(--weaverbird-theme-emphasis-color, $active-color);
        border-color: var(--weaverbird-theme-emphasis-color, $active-color);
        .widget-date-input__type-icon {
          background: none;
          color: white;
        }
      }
    }
  }
}

.widget-date-input__container {
  border: 1px solid $grey-light;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.widget-date-input__label {
  flex: 1;
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.widget-date-input__reset-button {
  padding: 10px 15px;
  cursor: pointer;
  opacity: 0.5;
  font-size: 14px;

  &:hover {
    opacity: 1;
  }
}

.widget-date-input__reset-button-icon {
  height: 1em;
  width: 1em;
}

.widget-date-input__type-icon {
  padding: 10px 15px;
  background: $grey-extra-light;
  color: $grey;
  font-size: 14px;
}

.widget-date-input__container:hover {
  border-color: var(--weaverbird-theme-main-color, $active-color);
  .widget-date-input__type-icon {
    background-color: var(--weaverbird-theme-main-color-light, $active-color-faded-2);
    color: var(--weaverbird-theme-main-color, $active-color);
  }
}

.widget-date-input__editor {
  margin-top: 3px;
  background-color: #fff;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.25);

  & .widget-date-input__editor--compact {
    // in compact mode use 100% of document width to display calendars
    max-width: calc(100% - 20px);
  }
}
.widget-date-input__editor-container {
  display: flex;
  overflow: hidden;
  width: 100%;
  height: 100%;
}
.widget-date-input__editor-side {
  width: 200px;
  min-width: 200px;
  height: 100%;
  max-height: 380px;
  flex: 1 200px;
  overflow-x: hidden;
  overflow-y: auto;
}
.widget-date-input__editor-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1 100%;
  border-left: 1px solid #eeedf0;
  width: 100%;
}
.widget-date-input__editor-header {
  flex: 0;
  max-height: 45px;
  .tabs {
    margin-bottom: -1px;
  }
}
.widget-date-input__editor-body {
  flex: 1;
  height: 278px;
  min-height: 278px;
  .widget-relative-date-range-form {
    margin: 20px;
    width: 400px;
  }
}
.widget-date-input__editor-footer {
  flex: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border-top: 1px solid #eeedf0;
  padding: 15px 20px;
}
.widget-date-input__editor-button {
  @extend %button-default;
  min-width: 100px;
  background: $grey-extra-light;
  color: $base-color;
  text-align: center;
  &:hover {
    background: $grey-light;
  }
  + .widget-date-input__editor-button {
    margin-left: 15px;
  }
}
.widget-date-input__editor-button--primary {
  background: var(--weaverbird-theme-emphasis-color, $active-color);
  color: white;
  &:hover {
    background: var(--weaverbird-theme-emphasis-color-dark, $active-color);
  }
}
.widget-date-input__editor-button--disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}
</style>
