<template>
  <div
    class="widget-date-input"
    :style="themeCSSVariables"
    :class="{ 'widget-date-input--colored-background': coloredBackground }"
  >
    <div class="widget-date-input__container" @click.stop="openEditor">
      <span class="widget-date-input__label" v-html="label" />
      <div class="widget-date-input__icon">
        <FAIcon icon="far calendar" />
      </div>
    </div>
    <popover
      class="widget-date-input__editor"
      :alwaysOpened="alwaysOpened"
      :visible="isEditorOpened"
      :align="alignLeft"
      :forcePositionUpdate="forcePopoverToUpdatePosition"
      :style="themeCSSVariables"
      bottom
      @closed="closeEditor"
    >
      <div class="widget-date-input__editor-container">
        <CustomVariableList
          v-if="hasVariables"
          class="widget-date-input__editor-side"
          :availableVariables="accessibleVariables"
          :selectedVariables="selectedVariables"
          :enableCustom="enableCustom"
          :customLabel="customLabel"
          @selectCustomVariable="editCustomVariable"
          @input="selectVariable"
        />
        <div
          class="widget-date-input__editor-content"
          v-if="enableCustom"
          v-show="isCustom || !hasVariables"
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
              />
            </div>
            <RelativeDateRangeForm
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
  isRelativeDateRange,
  relativeDateRangeToString,
} from '@/lib/dates';
import t from '@/lib/internationalization';
import {
  AvailableVariable,
  extractVariableIdentifier,
  VariableDelimiters,
  VariablesBucket,
} from '@/lib/variables';

import CustomVariableList from './CustomVariableList.vue';
import RelativeDateRangeForm from './RelativeDateRangeForm.vue';
import TabbedRangeCalendars from './TabbedRangeCalendars.vue';

/**
 * This component allow to select a variable or to switch between tabs and select a date range on a Fixed (Calendar) or Relative way (RelativeDateRangeForm),
 * each tab value is kept in memory to avoid user to loose data when switching between tabs
 *
 * DateRangeInput component will take any date range type of value as entry (VariableIdentifier, DateRange or RelativeDateRange)
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
    RelativeDateRangeForm,
    FAIcon,
    TabbedRangeCalendars,
  },
})
export default class DateRangeInput extends Vue {
  @Prop({ default: '' })
  value!: string | CustomDateRange;

  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;

  @Prop({ default: () => [] })
  relativeAvailableVariables!: VariablesBucket; // variables to use in RelativeDateRangeForm "from"

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

  isEditorOpened = false;
  isEditingCustomVariable = false; // force to expand custom part of editor
  alignLeft: string = POPOVER_ALIGN.LEFT;
  selectedTab = 'Relative';
  forcePopoverToUpdatePosition = 0;

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
    Relative: { date: '', quantity: -1, duration: 'year' },
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

  get isFixedTabSelected(): boolean {
    return this.selectedTab === 'Fixed';
  }

  get label(): string {
    if (this.variable) {
      return this.variable.label;
    } else if (isDateRange(this.value)) {
      return dateRangeToString(this.value, this.locale);
    } else if (isRelativeDateRange(this.value)) {
      return relativeDateRangeToString(
        this.value,
        this.relativeAvailableVariables,
        this.variableDelimiters,
      );
    } else {
      return t('SELECT_PERIOD_PLACEHOLDER', this.locale);
    }
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
      return !isRelativeDateRange(this.currentTabValue) || !this.currentTabValue.date;
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
    } else if (isRelativeDateRange(this.value)) {
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
  position: relative;
}
.widget-date-input__container {
  border: 1px solid $grey-light;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}
.widget-date-input__label {
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.widget-date-input__icon {
  padding: 10px 15px;
  background: $grey-extra-light;
  color: $grey;
}

.widget-date-input__container:hover {
  border-color: var(--weaverbird-theme-main-color);
  .widget-date-input__icon {
    background-color: var(--weaverbird-theme-main-color-light);
    color: var(--weaverbird-theme-main-color);
  }
}

.widget-date-input__editor {
  margin-top: 3px;
  background-color: #fff;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.25);
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
  .vc-container {
    border: none;
    margin: 1px;
    width: 100%;
  }
  .widget-relative-date-range-form {
    margin: 20px;
    max-width: 400px;
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
  background: var(--weaverbird-theme-emphasis-color);
  color: white;
  &:hover {
    background: var(--weaverbird-theme-emphasis-color-dark);
  }
}
.widget-date-input__editor-button--disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}

.widget-date-input--colored-background {
  .widget-date-input__label {
    color: white;
  }
  .widget-date-input__container {
    &,
    &:hover {
      background: var(--weaverbird-theme-emphasis-color);
      border-color: var(--weaverbird-theme-emphasis-color);
      .widget-date-input__icon {
        background: none;
        color: white;
        padding-left: 0;
      }
    }
  }
}
</style>
