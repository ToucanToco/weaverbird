<template>
  <div
    class="widget-date-input"
    :class="{
      'widget-date-input--opened': isEditorOpened,
    }"
  >
    <div
      class="widget-date-input__container"
      @click.stop="openEditor"
      data-cy="weaverbird-date-input"
    >
      <VariableTag
        class="widget-date-input__advanced-variable"
        data-cy="weaverbird-date-input-advanced-variable"
        v-if="variable || advancedVariable"
        :value="value"
        :available-variables="availableVariables"
        :variable-delimiters="variableDelimiters"
        :trusted-variable-delimiters="trustedVariableDelimiters"
        :isDate="true"
        @edited="openAdvancedVariableModal"
        @removed="resetValue"
      />
      <span class="widget-date-input__label" data-cy="weaverbird-date-input-label" v-else>{{
        label
      }}</span>
      <div class="widget-date-input__icon">
        <FAIcon icon="far calendar" />
      </div>
    </div>
    <popover
      class="widget-date-input__editor"
      :visible="isEditorOpened"
      :align="alignLeft"
      @closed="closeEditor"
      :shouldCalculateHeight="true"
      bottom
    >
      <div class="widget-date-input__editor-container">
        <CustomVariableList
          v-if="hasVariables"
          class="widget-date-input__editor-side"
          :availableVariables="availableVariables"
          :selectedVariables="selectedVariables"
          :enableCustom="enableCustom"
          :showOnlyLabel="!isEditorOpened"
          @selectCustomVariable="editCustomVariable"
          @input="selectVariable"
          @addAdvancedVariable="openAdvancedVariableModal"
        />
        <div
          class="widget-date-input__editor-content"
          v-if="enableCustom"
          v-show="isCustom || !hasVariables"
          ref="custom-editor"
        >
          <Tabs
            class="widget-date-input__editor-header"
            data-cy="weaverbird-date-input-tabs"
            :tabs="tabs"
            :selectedTab="selectedTab"
            @tabSelected="selectTab"
          />
          <div
            class="widget-date-input__editor-body"
            :class="{ 'widget-date-input__editor-body--scrollable': isFixedTabSelected }"
          >
            <Calendar
              v-if="isFixedTabSelected"
              v-model="currentTabValue as Date | undefined"
              :availableDates="bounds"
            />
            <RelativeDateForm
              v-else
              v-model="currentTabValue as RelativeDate | undefined"
              :availableVariables="relativeAvailableVariables"
              :variableDelimiters="variableDelimiters"
              :trusted-variable-delimiters="trustedVariableDelimiters"
            />
          </div>
          <div class="widget-date-input__editor-footer">
            <div
              class="widget-date-input__editor-button"
              data-cy="weaverbird-date-input-cancel"
              ref="cancel"
              @click="closeEditor"
              v-text="'Cancel'"
            />
            <div
              class="widget-date-input__editor-button widget-date-input__editor-button--primary"
              :class="{ 'widget-date-input__editor-button--disabled': hasInvalidTabValue }"
              data-cy="weaverbird-date-input-save"
              :disabled="hasInvalidTabValue"
              @click="saveCustomVariable"
              v-text="'Set date'"
            />
          </div>
        </div>
      </div>
    </popover>
    <AdvancedVariableModal
      :is-opened="isAdvancedVariableModalOpened"
      :variable-delimiters="variableDelimiters"
      :variable="advancedVariable"
      @input="chooseAdvancedVariable"
      @closed="closeAdvancedVariableModal"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { POPOVER_ALIGN } from '@/components/constants';
import Calendar from '@/components/DatePicker/Calendar.vue';
import FAIcon from '@/components/FAIcon.vue';
import Popover from '@/components/Popover.vue';
import AdvancedVariableModal from '@/components/stepforms/widgets/VariableInputs/AdvancedVariableModal.vue';
import VariableTag from '@/components/stepforms/widgets/VariableInputs/VariableTag.vue';
import Tabs from '@/components/Tabs.vue';
import type { CustomDate, DateRange, RelativeDate } from '@/lib/dates';
import { dateToString, isRelativeDate, relativeDateToString } from '@/lib/dates';
import { sendAnalytics } from '@/lib/send-analytics';
import type { AvailableVariable, VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { extractVariableIdentifier, isTrustedVariable } from '@/lib/variables';

import CustomVariableList from './CustomVariableList.vue';
import RelativeDateForm from './RelativeDateForm.vue';
/**
 * This component allow to select a variable or to switch between tabs and select a date on a Fixed (Calendar) or Relative way (RelativeDateForm),
 * each tab value is keeped in memory to avoid user to loose data when switching between tabs
 */
export default defineComponent({
  name: 'new-date-input',

  components: {
    CustomVariableList,
    Popover,
    Tabs,
    Calendar,
    RelativeDateForm,
    FAIcon,
    AdvancedVariableModal,
    VariableTag,
  },

  props: {
    value: {
      type: [String, Object, Date] as PropType<string | CustomDate>,
      default: '',
    },
    availableVariables: {
      type: Array as PropType<VariablesBucket>,
      default: () => [],
    },
    variableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
      default: () => ({ start: '', end: '' }),
    },
    trustedVariableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
      default: undefined,
    },
    enableCustom: {
      type: Boolean,
      default: true,
    },
    bounds: {
      type: Object as PropType<DateRange>,
      default: () => ({ start: undefined, end: undefined }),
    },
  },

  data() {
    return {
      isEditorOpened: false,
      isEditingCustomVariable: false, // force to expand custom part of editor
      alignLeft: POPOVER_ALIGN.LEFT as string,
      selectedTab: 'Relative',
      isAdvancedVariableModalOpened: false,
      // keep each tab value in memory to enable to switch between tabs without loosing content
      tabsValues: {
        Fixed: undefined, // Date should be empty on init because we can have bounds so a defined date could be out of bounds
        Relative: { date: '', quantity: 1, duration: 'year', operator: 'until' },
      } as Record<string, CustomDate | undefined>,
    };
  },

  computed: {
    tabs(): string[] {
      return ['Relative', 'Fixed'];
    },

    relativeAvailableVariables(): VariablesBucket {
      return this.availableVariables.filter((v) => v.value instanceof Date);
    },

    currentTabValue: {
      get(): RelativeDate | Date | undefined {
        return this.tabsValues[this.selectedTab];
      },
      set(value: RelativeDate | Date | undefined) {
        this.tabsValues[this.selectedTab] = value;
      },
    },

    variable(): AvailableVariable | undefined {
      if (typeof this.value !== 'string') return undefined;
      const identifier = extractVariableIdentifier(
        this.value,
        this.variableDelimiters,
        this.trustedVariableDelimiters,
      );
      return this.availableVariables.find((v) => v.identifier === identifier);
    },

    advancedVariable(): string | undefined {
      if (typeof this.value !== 'string') return undefined;
      const identifier = extractVariableIdentifier(
        this.value,
        this.variableDelimiters,
        this.trustedVariableDelimiters,
      );
      return identifier && !this.variable ? this.value : undefined;
    },

    selectedVariables(): string {
      // needed to select the custom button in CustomVariableList
      if (this.isCustom) {
        return 'custom';
      } else {
        return this.variable?.identifier ?? '';
      }
    },

    hasVariables(): boolean {
      return this.availableVariables.length > 0;
    },

    hasCustomValue(): boolean {
      // value is custom if not undefined and not a preset variable
      return (this.value && !this.variable && !this.advancedVariable) as boolean;
    },

    isCustom(): boolean {
      return this.hasCustomValue || this.isEditingCustomVariable;
    },

    isFixedTabSelected(): boolean {
      return this.selectedTab === 'Fixed';
    },

    hasInvalidTabValue(): boolean {
      if (this.isFixedTabSelected) {
        return !this.currentTabValue;
      }
      return !isRelativeDate(this.currentTabValue) || !this.currentTabValue.date;
    },

    label(): string {
      if (this.value instanceof Date) {
        return dateToString(this.value);
      } else if (isRelativeDate(this.value)) {
        return relativeDateToString(
          this.value,
          this.relativeAvailableVariables,
          this.variableDelimiters,
          this.trustedVariableDelimiters,
        );
      } else {
        return 'Select a date';
      }
    },
  },

  methods: {
    openEditor() {
      this.isEditorOpened = true;
      this.isEditingCustomVariable = false;
    },

    closeEditor() {
      this.isEditorOpened = false;
      this.isEditingCustomVariable = false;
    },

    resetValue() {
      this.$emit('input', undefined);
    },

    selectTab(tab: string) {
      this.selectedTab = tab;
    },

    selectVariable(variableIdentifier: string) {
      const variable = this.availableVariables.find((v) => v.identifier === variableIdentifier);
      const attendedVariableDelimiters = isTrustedVariable(variable)
        ? this.trustedVariableDelimiters
        : this.variableDelimiters;
      const value = `${attendedVariableDelimiters.start}${variableIdentifier}${attendedVariableDelimiters.end}`;
      this.$emit('input', value);
      this.closeEditor();
    },

    editCustomVariable() {
      this.isEditingCustomVariable = true;
    },

    saveCustomVariable() {
      if (!this.hasInvalidTabValue) {
        this.$emit('input', this.currentTabValue);
        this.closeEditor();
      }
    },

    openAdvancedVariableModal() {
      this.isAdvancedVariableModalOpened = true;
    },

    closeAdvancedVariableModal() {
      this.isAdvancedVariableModalOpened = false;
    },

    chooseAdvancedVariable(value: string) {
      this.$emit('input', value);
      this.closeAdvancedVariableModal();
      this.closeEditor();
      sendAnalytics('variableInput');
    },
  },
});
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';

.widget-date-input {
  max-width: 400px;
  position: relative;
}

.widget-date-input--opened {
  .widget-date-input__container {
    border-color: $active-color;
  }
  .widget-date-input__icon {
    background-color: $active-color-faded-2;
    color: $active-color;
  }
}

.widget-date-input__container {
  border: 1px solid #ddd;
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

.widget-date-input__advanced-variable {
  width: calc(100% - 45px);
  padding: 5px 10px;
  margin: 0 5px;
}

.widget-date-input__icon {
  padding: 10px;
  background: rgba(217, 217, 217, 0.24);
  color: #000;
}

.widget-date-input__editor {
  margin-left: -5px;
  margin-right: -5px;
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
  width: 285px;
  min-width: 285px;
  height: 100%;
  max-height: 400px;
  flex: 1 285px;
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
  min-height: 280px;
  width: 280px;
  .vc-container {
    border: none;
    margin: 1px;
    width: 100%;
  }
  .widget-relative-date-form {
    margin: 20px;
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
  flex: 1;
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
  background: $active-color;
  color: white;
  &:hover {
    background: $active-color-dark;
  }
}
.widget-date-input__editor-button--disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}

// specifics styles when Popover has the prop shouldCalculateHeight
.weaverbird-popover--calculated-height {
  .widget-date-input__editor-content {
    overflow: hidden;
  }
  .widget-date-input__editor-body {
    min-height: 0;
  }
  // allow to scroll in the "fixed" section (with calendar)
  .widget-date-input__editor-body--scrollable {
    overflow: auto;
  }
}
</style>
