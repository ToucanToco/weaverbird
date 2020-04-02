<template>
  <div class="filter-form-simple-condition__container">
    <div class="filter-form-simple-condition-column-input">
      <AutocompleteWidget
        :class="`${dataPath.replace(/[^a-zA-Z0-9]/g, '')}-columnInput`"
        :value="value.column"
        :options="columnNames"
        @input="updateStepColumn"
        placeholder="Column"
        :data-path="`${dataPath}.column`"
        :errors="errors"
      />
    </div>
    <div class="filter-form-simple-condition-operator-input">
      <AutocompleteWidget
        :class="`${dataPath.replace(/[^a-zA-Z0-9]/g, '')}-filterOperator`"
        :value="operator"
        @input="updateStepOperator"
        :options="operators"
        placeholder="Filter operator"
        :trackBy="`operator`"
        :label="`label`"
      />
    </div>
    <component
      :class="`${dataPath.replace(/[^a-zA-Z0-9]/g, '')}-filterValue`"
      v-if="inputWidget"
      :is="inputWidget"
      :value="value.value"
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
import { Component, Prop, Vue } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { FilterSimpleCondition } from '@/lib/steps';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';

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
  | 'is not null';

type ShortOperator = FilterSimpleCondition['operator'];

type OperatorOption = {
  operator: ShortOperator;
  label: LiteralOperator;
  inputWidget?: VueConstructor<Vue>;
};

const DEFAULT_FILTER = { column: '', value: '', operator: 'eq' };

@Component({
  name: 'filter-simple-condition-widget',
  components: {
    AutocompleteWidget,
    InputTextWidget,
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

  @VQBModule.Getter('columnNames') columnNamesFromStore!: string[];

  @VQBModule.Mutation setSelectedColumns!: MutationCallbacks['setSelectedColumns'];

  readonly operators: OperatorOption[] = [
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
    { operator: 'isnull', label: 'is null' },
    { operator: 'notnull', label: 'is not null' },
  ];

  created() {
    // In absence of condition, emit directly to the parent the default value
    if (isEqual(this.value, DEFAULT_FILTER)) {
      this.$emit('input', DEFAULT_FILTER);
    }
  }

  get columnNames() {
    if (this.columnNamesProp && this.columnNamesProp.length > 0) {
      return this.columnNamesProp;
    } else if (this.columnNamesFromStore && this.columnNamesFromStore.length > 0) {
      return this.columnNamesFromStore;
    } else {
      return [];
    }
  }

  get placeholder() {
    if (this.value.operator === 'matches' || this.value.operator === 'notmatches') {
      return 'Enter a regex, e.g. "[Ss]ales"';
    }
    return 'Enter a value';
  }

  get operator(): OperatorOption {
    return this.operators.filter(d => d.operator === this.value.operator)[0];
  }

  get inputWidget(): VueConstructor<Vue> | undefined {
    const widget = this.operators.filter(d => d.operator === this.value.operator)[0].inputWidget;
    if (widget) {
      return widget;
    } else {
      return undefined;
    }
  }

  updateStepOperator(newOperator: OperatorOption) {
    const updatedValue = { ...this.value };
    updatedValue.operator = newOperator.operator;
    if (updatedValue.operator === 'in' || updatedValue.operator === 'nin') {
      updatedValue.value = [];
    } else if (updatedValue.operator === 'isnull' || updatedValue.operator === 'notnull') {
      updatedValue.value = null;
    } else {
      updatedValue.value = '';
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
.widget-input-text__container {
  margin: 0;
}

.filter-form-simple-condition-column-input,
.filter-form-simple-condition-operator-input,
.filter-form-simple-condition__container .widget-input-text__container,
.filter-form-simple-condition__container .widget-input-text__container,
.filter-form-simple-condition__container .widget-multiinputtext__container {
  margin: 4px;
  margin-right: 0;
  width: 33%;

  &:last-child {
    margin-right: 4px;
  }
}

.filter-form-simple-condition__container /deep/ .widget-input-text,
.filter-form-simple-condition__container /deep/ .multiselect {
  background-color: white;

  &::placeholder {
    font-size: 14px;
    letter-spacing: 1px;
  }
}

.filter-form-simple-condition__container /deep/ .multiselect__tags {
  border-radius: 0;
  border: none;
}
</style>

<style lang="scss">
.filter-form-simple-condition__container .multiselect {
  width: 100%;
}
</style>
