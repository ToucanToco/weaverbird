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
        :options="columnNames"
        @input="updateStepColumn"
        placeholder="Column"
        :data-path="`${dataPath}.column`"
        :errors="errors"
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
      :placeholder="placeholder"
      :data-path="`${dataPath}.value`"
      :errors="errors"
      @input="updateStepValue"
    />
  </div>
</template>

<script lang="ts">
import { ErrorObject } from 'ajv';
import isEqual from 'lodash/isEqual';
import { VueConstructor } from 'vue';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import NewDateInput from '@/components/stepforms/widgets/DateComponents/NewDateInput.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { ColumnTypeMapping } from '@/lib/dataset/index';
import {
  keepCurrentValueIfArrayType,
  keepCurrentValueIfCompatibleDate,
  keepCurrentValueIfCompatibleRelativeDate,
  keepCurrentValueIfCompatibleType,
} from '@/lib/helpers';
import { FilterSimpleCondition } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';

import InputDateWidget from './InputDate.vue';
import MultiInputTextWidget from './MultiInputText.vue';

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

export const DEFAULT_FILTER = { column: '', value: '', operator: 'eq' };

@Component({
  name: 'filter-simple-condition-widget',
  components: {
    AutocompleteWidget,
    InputTextWidget,
    InputDateWidget,
    NewDateInput,
  },
})
export default class FilterSimpleConditionWidget extends Vue {
  @Prop({
    type: Object,
    default: () => ({ ...DEFAULT_FILTER }),
  })
  value!: FilterSimpleCondition;

  @Prop({
    type: Array,
    default: () => [],
  })
  columnNamesProp!: string[];

  @Prop({ type: String, default: '' })
  dataPath!: string;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Prop({ type: Boolean, default: true })
  multiVariable!: boolean; // display multiInputText as multiVariableInput

  @Prop({
    type: Object,
    default: () => ({}),
  })
  columnTypes!: ColumnTypeMapping;

  @VQBModule.Getter('columnNames') columnNamesFromStore!: string[];

  @VQBModule.State('featureFlags') featureFlags!: Record<string, any>;

  @VQBModule.Mutation setSelectedColumns!: MutationCallbacks['setSelectedColumns'];

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  @Prop()
  hideColumnVariables?: boolean;

  @Watch('hasDateSelectedColumn')
  verifyIfValueIsStillValid() {
    // when column change from date to another type or inverse,
    // we need to reapply default widget value in case current value is not valid
    // ex: [X] '' in string column will become an 'Invalid Date' in date column
    // ex: [X] new Date() in date column will become an object in string column
    this.updateStepOperator(this.operator);
  }

  readonly nullOperators: OperatorOption[] = [
    { operator: 'isnull', label: 'is null' },
    { operator: 'notnull', label: 'is not null' },
  ];

  readonly baseOperators: OperatorOption[] = [
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
    ...this.nullOperators,
  ];

  readonly dateOperators: OperatorOption[] = [
    { operator: 'from', label: 'starting in/on', inputWidget: NewDateInput },
    { operator: 'until', label: 'ending in/on', inputWidget: NewDateInput },
    ...this.nullOperators,
  ];

  created() {
    // In absence of condition, emit directly to the parent the default value
    if (isEqual(this.value, DEFAULT_FILTER)) {
      this.$emit('input', DEFAULT_FILTER);
    } else if (this.hasDateSelectedColumn) {
      this.updateInvalidDateOperator();
    }
  }

  // Column names can be provided either in the store or via a prop
  // The prop takes priority over the store
  get columnNames() {
    if (this.columnNamesProp && this.columnNamesProp.length > 0) {
      return this.columnNamesProp;
    } else if (this.columnNamesFromStore && this.columnNamesFromStore.length > 0) {
      return this.columnNamesFromStore;
    } else {
      return [];
    }
  }

  get enableRelativeDateFiltering(): boolean {
    return this.featureFlags?.RELATIVE_DATE_FILTERING === 'enable';
  }

  get dateAvailableVariables(): VariablesBucket | undefined {
    // keep only date variables
    return this.availableVariables?.filter(v => v.value instanceof Date);
  }

  get availableVariablesForInputWidget(): VariablesBucket | undefined {
    switch (this.inputWidget) {
      case NewDateInput:
        return this.dateAvailableVariables;
      default:
        return this.availableVariables;
    }
  }

  get availableOperators(): OperatorOption[] {
    if (this.hasDateSelectedColumn && this.enableRelativeDateFiltering) {
      return this.dateOperators;
    }
    return this.baseOperators;
  }

  get placeholder() {
    if (this.value.operator === 'matches' || this.value.operator === 'notmatches') {
      return 'Enter a regex, e.g. "[Ss]ales"';
    }
    return 'Enter a value';
  }

  get hasDateSelectedColumn(): boolean {
    return this.columnTypes[this.value.column] == 'date';
  }

  get operator(): OperatorOption {
    return (
      this.availableOperators.find(d => d.operator === this.value.operator) ??
      this.availableOperators[0]
    );
  }

  get inputWidget(): VueConstructor<Vue> | undefined {
    const widget = this.operator.inputWidget;
    if (
      this.hasDateSelectedColumn &&
      widget === InputTextWidget &&
      !this.enableRelativeDateFiltering
    ) {
      return InputDateWidget;
    }
    return widget;
  }

  retrieveOperatorOption(operator: string): OperatorOption | undefined {
    return this.availableOperators.find(o => o.operator === operator);
  }

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
  }

  updateStepOperator(newOperator: OperatorOption) {
    const updatedValue = { ...this.value };
    updatedValue.operator = newOperator.operator;
    if (updatedValue.operator === 'in' || updatedValue.operator === 'nin') {
      updatedValue.value = keepCurrentValueIfArrayType(updatedValue.value, []);
    } else if (updatedValue.operator === 'isnull' || updatedValue.operator === 'notnull') {
      updatedValue.value = null;
    } else if (this.hasDateSelectedColumn && this.enableRelativeDateFiltering) {
      updatedValue.value = keepCurrentValueIfCompatibleRelativeDate(updatedValue.value, '');
    } else if (this.hasDateSelectedColumn) {
      // when using date widget, we need value to be a valid date
      // null as date will become "01/01/1970" as default value for input
      updatedValue.value = keepCurrentValueIfCompatibleDate(updatedValue.value, null);
    } else {
      updatedValue.value = keepCurrentValueIfCompatibleType(updatedValue.value, '');
    }
    this.$emit('input', updatedValue);
  }

  updateStepValue(newColumn: any) {
    const updatedValue = { ...this.value };
    updatedValue.value = newColumn;
    this.$emit('input', updatedValue);
  }

  updateStepColumn(newValue: string) {
    const updatedValue = { ...this.value };
    updatedValue.column = newValue;
    this.setSelectedColumns({ column: updatedValue.column });
    this.$emit('input', updatedValue);
  }
}
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
