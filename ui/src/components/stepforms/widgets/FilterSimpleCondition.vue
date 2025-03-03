<template>
  <div class="filter-form-simple-condition__container">
    <div
      class="filter-form-simple-condition-column-input"
      data-cy="weaverbird-filter-form-column-input"
    >
      <AutocompleteWidget
        class="columnInput"
        :value="value.column"
        :available-variables="hideColumnVariables ? undefined : availableVariables"
        :variable-delimiters="hideColumnVariables ? undefined : variableDelimiters"
        :trusted-variable-delimiters="hideColumnVariables ? undefined : trustedVariableDelimiters"
        :options="columnNames"
        @input="updateStepColumn"
        placeholder="Column"
        :data-path="`${dataPath}.column`"
        :errors="errors"
        :allowCustom="true"
      />
    </div>
    <div
      class="filter-form-simple-condition-operator-input"
      data-cy="weaverbird-filter-form-operator-input"
    >
      <AutocompleteWidget
        class="filterOperator"
        :value="operator"
        @input="updateStepOperator"
        :options="availableOperators"
        placeholder="Filter operator"
        :trackBy="`operator`"
        :label="`label`"
      />
    </div>
    <component
      class="filterValue"
      data-cy="weaverbird-filter-form-filter-value"
      v-if="inputWidget"
      :is="inputWidget"
      :multi-variable="multiVariable"
      :value="value.value"
      :available-variables="availableVariablesForInputWidget"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :placeholder="placeholder"
      :data-path="`${dataPath}.value`"
      :errors="errors"
      @input="updateStepValue"
    />
  </div>
</template>

<script lang="ts">
import type { ErrorObject } from 'ajv';
import isEqual from 'lodash/isEqual';
import type { VueConstructor, PropType } from 'vue';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import NewDateInput from '@/components/stepforms/widgets/DateComponents/NewDateInput.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { ColumnTypeMapping } from '@/lib/dataset';
import {
  keepCurrentValueIfArrayType,
  keepCurrentValueIfCompatibleRelativeDate,
  keepCurrentValueIfCompatibleType,
} from '@/lib/helpers';
import type { FilterSimpleCondition } from '@/lib/steps';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';

import InputDateWidget from './InputDate.vue';
import MultiInputTextWidget from './MultiInputText.vue';
import { defineComponent } from 'vue';

type LiteralOperator =
  | 'equals'
  | "doesn't equal"
  | 'is greater than'
  | 'is greater than or equal to'
  | 'is less than'
  | 'is less than or equal to'
  | 'is one of'
  | 'is not one of'
  | 'matches pattern'
  | "doesn't match pattern"
  | 'is null'
  | 'is not null'
  | 'starting in/on'
  | 'ending in/on';

type ShortOperator = FilterSimpleCondition['operator'];

type OperatorOption = {
  operator: ShortOperator;
  label: LiteralOperator;
  inputWidget?: VueConstructor<Vue>;
};

export const DEFAULT_FILTER: FilterSimpleCondition = { column: '', value: '', operator: 'eq' };

const nullOperators: Readonly<OperatorOption[]> = [
  { operator: 'isnull', label: 'is null' },
  { operator: 'notnull', label: 'is not null' },
];

const baseOperators: Readonly<OperatorOption[]> = [
  { operator: 'eq', label: 'equals', inputWidget: InputTextWidget },
  { operator: 'ne', label: "doesn't equal", inputWidget: InputTextWidget },
  { operator: 'gt', label: 'is greater than', inputWidget: InputTextWidget },
  { operator: 'ge', label: 'is greater than or equal to', inputWidget: InputTextWidget },
  { operator: 'lt', label: 'is less than', inputWidget: InputTextWidget },
  { operator: 'le', label: 'is less than or equal to', inputWidget: InputTextWidget },
  { operator: 'in', label: 'is one of', inputWidget: MultiInputTextWidget },
  { operator: 'nin', label: 'is not one of', inputWidget: MultiInputTextWidget },
  { operator: 'matches', label: 'matches pattern', inputWidget: InputTextWidget },
  { operator: 'notmatches', label: "doesn't match pattern", inputWidget: InputTextWidget },
  ...nullOperators,
];

const dateOperators: Readonly<OperatorOption[]> = [
  { operator: 'from', label: 'starting in/on', inputWidget: NewDateInput },
  { operator: 'until', label: 'ending in/on', inputWidget: NewDateInput },
  ...nullOperators,
];

export default defineComponent({
  name: 'filter-simple-condition-widget',

  components: {
    AutocompleteWidget,
    InputTextWidget,
    InputDateWidget,
    NewDateInput,
  },

  emits: {
    input: (_val: FilterSimpleCondition) => true,
    setSelectedColumns: (_: { column: string }) => true,
  },

  props: {
    value: {
      type: Object as PropType<FilterSimpleCondition>,
      default: () => ({ ...DEFAULT_FILTER }),
    },

    columnNamesProp: {
      type: Array as PropType<string[]>,
      default: () => [],
    },

    dataPath: {
      type: String as PropType<string>,
      default: () => '',
    },

    errors: {
      type: Array as PropType<ErrorObject[]>,
      default: () => [],
    },

    multiVariable: {
      type: Boolean as PropType<boolean>,
      default: true,
    },

    columnTypes: {
      type: Object as PropType<ColumnTypeMapping>,
      default: () => ({}),
    },

    availableVariables: {
      type: Array as PropType<VariablesBucket>,
    },

    variableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
    },

    trustedVariableDelimiters: {
      type: Object as PropType<VariableDelimiters | undefined>,
      default: undefined,
    },

    hideColumnVariables: {
      type: Boolean as PropType<boolean>,
    },
  },

  computed: {
    columnNames() {
      return this.columnNamesProp ?? [];
    },

    availableVariablesForInputWidget(): VariablesBucket | undefined {
      return this.availableVariables;
    },

    availableOperators(): Readonly<OperatorOption[]> {
      if (this.hasDateSelectedColumn) {
        return dateOperators;
      }
      return baseOperators;
    },

    placeholder() {
      if (this.value.operator === 'matches' || this.value.operator === 'notmatches') {
        return 'Enter a regex, e.g. "[Ss]ales"';
      }
      return 'Enter a value';
    },

    hasDateSelectedColumn(): boolean {
      return this.columnTypes[this.value.column] === 'date';
    },

    operator(): Readonly<OperatorOption> {
      return (
        this.availableOperators.find((d) => d.operator === this.value.operator) ??
        this.availableOperators[0]
      );
    },

    inputWidget(): VueConstructor<Vue> | undefined {
      return this.operator.inputWidget;
    },
  },

  created() {
    // In absence of condition, emit directly to the parent the default value
    if (isEqual(this.value, DEFAULT_FILTER)) {
      this.$emit('input', DEFAULT_FILTER);
    } else if (this.hasDateSelectedColumn) {
      this.updateInvalidDateOperator();
    }
  },

  methods: {
    retrieveOperatorOption(operator: string): OperatorOption | undefined {
      return this.availableOperators.find((o) => o.operator === operator);
    },

    updateInvalidDateOperator(): void {
      // no need to update operator already exists
      if (this.retrieveOperatorOption(this.value.operator)) return;
      // retrieve appropriate date operator when feature flag for relative date has been switched
      let newOperator = '';
      switch (this.value.operator) {
        case 'lt':
        case 'le':
          newOperator = 'until';
          break;
        case 'gt':
        case 'ge':
          newOperator = 'from';
          break;
        case 'from':
          newOperator = 'ge';
          break;
        case 'until':
          newOperator = 'le';
          break;
      }
      this.updateStepOperator(this.retrieveOperatorOption(newOperator) ?? this.operator);
    },

    updateStepOperator(newOperator: OperatorOption) {
      const updatedValue = { ...this.value };
      updatedValue.operator = newOperator.operator;
      if (updatedValue.operator === 'in' || updatedValue.operator === 'nin') {
        updatedValue.value = keepCurrentValueIfArrayType(updatedValue.value, []);
      } else if (updatedValue.operator === 'isnull' || updatedValue.operator === 'notnull') {
        updatedValue.value = null;
      } else if (this.hasDateSelectedColumn) {
        updatedValue.value = keepCurrentValueIfCompatibleRelativeDate(updatedValue.value, '');
      } else {
        updatedValue.value = keepCurrentValueIfCompatibleType(updatedValue.value, '');
      }
      this.$emit('input', updatedValue);
    },

    updateStepValue(newColumn: any) {
      const updatedValue = { ...this.value };
      updatedValue.value = newColumn;
      this.$emit('input', updatedValue);
    },

    updateStepColumn(newValue: string) {
      const updatedValue = { ...this.value };
      updatedValue.column = newValue;
      this.$emit('setSelectedColumns', { column: updatedValue.column });
      this.$emit('input', updatedValue);
    },
  },

  watch: {
    hasDateSelectedColumn: {
      handler: function verifyIfValueIsStillValid() {
        // when column change from date to another type or inverse,
        // we need to reapply default widget value in case current value is not valid
        // ex: [X] '' in string column will become an 'Invalid Date' in date column
        // ex: [X] new Date() in date column will become an object in string column
        this.updateStepOperator(this.operator);
      },
    },
  },
});
</script>

<style lang="scss" scoped>
.filter-form-simple-condition__container {
  display: flex;
  width: 100%;
}

.widget-autocomplete__container,
.widget-input-date__container,
.widget-input-text__container {
  margin: 0;
}

.filter-form-simple-condition-column-input,
.filter-form-simple-condition-operator-input,
.filter-form-simple-condition__container .widget-input-text__container,
.filter-form-simple-condition__container .widget-input-date__container,
.filter-form-simple-condition__container .widget-date-input,
.filter-form-simple-condition__container .widget-multiinputtext__container {
  margin: 4px;
  margin-right: 0;
  width: 33%;

  &:last-child {
    margin-right: 4px;
  }
}

.filter-form-simple-condition__container ::v-deep .widget-input-text,
.filter-form-simple-condition__container ::v-deep .widget-input-date,
.filter-form-simple-condition__container ::v-deep .widget-date-input__container,
.filter-form-simple-condition__container ::v-deep .multiselect {
  background-color: white;

  &::placeholder {
    font-size: 14px;
    letter-spacing: 1px;
  }
}

.filter-form-simple-condition__container ::v-deep .multiselect__tags {
  border-radius: 0;
  border: none;
}
</style>

<style lang="scss">
.filter-form-simple-condition__container .multiselect {
  width: 100%;
}
</style>
