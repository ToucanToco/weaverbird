<template>
  <div class="filter-form-simple-condition__container">
    <div class="filter-form-simple-condition-column-input">
      <AutocompleteWidget
        id="columnInput"
        v-model="editedValue.column"
        :options="columnNames"
        @input="setSelectedColumns({ column: editedValue.column })"
        placeholder="Column"
        :data-path="`${dataPath}.column`"
        :errors="errors"
      />
    </div>
    <div class="filter-form-simple-condition-operator-input">
      <AutocompleteWidget
        id="filterOperator"
        :value="operator"
        @input="updateStepOperator"
        :options="operators"
        placeholder="Filter operator"
        :trackBy="`operator`"
        :label="`label`"
      />
    </div>
    <component
      id="filterValue"
      v-if="inputWidget"
      :is="inputWidget"
      v-model="editedValue.value"
      :placeholder="placeholder"
      :data-path="`${dataPath}.value`"
      :errors="errors"
    />
  </div>
</template>

<script lang="ts">
import { ErrorObject } from 'ajv';
import { VueConstructor } from 'vue';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { FilterSimpleCondition } from '@/lib/steps';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';

import MultiInputTextWidget from './MultiInputText.vue';

type LiteralOperator =
  | 'equal'
  | 'not equal'
  | 'be greater than'
  | 'be greater than or equal to'
  | 'be less than'
  | 'be less than or equal to'
  | 'be one of'
  | 'not be one of'
  | 'matches pattern'
  | "doesn't match pattern"
  | 'be null'
  | 'not be null';

type ShortOperator = FilterSimpleCondition['operator'];

type OperatorOption = {
  operator: ShortOperator;
  label: LiteralOperator;
  inputWidget?: VueConstructor<Vue>;
};

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
    default: () => ({ column: '', value: '', operator: 'eq' }),
  })
  value!: FilterSimpleCondition;

  @Prop({ type: String, default: null })
  dataPath!: string;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @VQBModule.Getter columnNames!: string[];

  @VQBModule.Mutation setSelectedColumns!: MutationCallbacks['setSelectedColumns'];

  editedValue: FilterSimpleCondition = { ...this.value };

  readonly operators: OperatorOption[] = [
    { operator: 'eq', label: 'equal', inputWidget: InputTextWidget },
    { operator: 'ne', label: 'not equal', inputWidget: InputTextWidget },
    { operator: 'gt', label: 'be greater than', inputWidget: InputTextWidget },
    { operator: 'ge', label: 'be greater than or equal to', inputWidget: InputTextWidget },
    { operator: 'lt', label: 'be less than', inputWidget: InputTextWidget },
    { operator: 'le', label: 'be less than or equal to', inputWidget: InputTextWidget },
    { operator: 'in', label: 'be one of', inputWidget: MultiInputTextWidget },
    { operator: 'nin', label: 'not be one of', inputWidget: MultiInputTextWidget },
    { operator: 'matches', label: 'matches pattern', inputWidget: InputTextWidget },
    { operator: 'notmatches', label: "doesn't match pattern", inputWidget: InputTextWidget },
    { operator: 'isnull', label: 'be null' },
    { operator: 'notnull', label: 'not be null' },
  ];

  get placeholder() {
    if (this.editedValue.operator === 'matches' || this.editedValue.operator === 'notmatches') {
      return 'Enter a regex, e.g. "[Ss]ales"';
    }
    return 'Enter a value';
  }

  get operator(): OperatorOption {
    return this.operators.filter(d => d.operator === this.editedValue.operator)[0];
  }

  get inputWidget(): VueConstructor<Vue> | undefined {
    const widget = this.operators.filter(d => d.operator === this.editedValue.operator)[0]
      .inputWidget;
    if (widget) {
      return widget;
    } else {
      return undefined;
    }
  }

  updateStepOperator(op: OperatorOption) {
    this.editedValue.operator = op.operator;
    if (this.editedValue.operator === 'in' || this.editedValue.operator === 'nin') {
      this.editedValue.value = [];
    } else if (this.editedValue.operator === 'isnull' || this.editedValue.operator === 'notnull') {
      this.editedValue.value = null;
    } else {
      this.editedValue.value = '';
    }
  }

  @Watch('value', { immediate: true })
  updateEditedValue(newValue: FilterSimpleCondition) {
    this.editedValue = newValue;
  }

  @Watch('editedValue', { deep: true })
  updateValue(newValue: FilterSimpleCondition) {
    this.$emit('input', newValue);
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
.filter-form-simple-condition__container .widget-input-text__container {
  background-color: white;
  margin: 4px;
  margin-right: 0;
  width: 33%;

  &:last-child {
    margin-right: 4px;
  }
}

.multiselect__tags {
  border-radius: 0;
  border: none;
}
</style>

<style lang="scss">
.filter-form-simple-condition__container .multiselect {
  width: 100%;
}
</style>
