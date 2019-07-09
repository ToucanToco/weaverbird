<template>
  <div class="filter-form-single-condition__container">
    <WidgetAutocomplete
      id="columnInput"
      v-model="editedValue.column"
      name="Values in..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedValue.column })"
      placeholder="Column"
    ></WidgetAutocomplete>
    <WidgetAutocomplete
      id="filterOperator"
      :value="operator"
      @input="updateStepOperator"
      :options="operators"
      placeholder="Filter operator"
      :trackBy="`operator`"
      :label="`label`"
    ></WidgetAutocomplete>
    <component :is="inputWidget" v-model="editedValue.value" :placeholder="placeholder"></component>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Getter, Mutation } from 'vuex-class';
import { MutationCallbacks } from '@/store/mutations';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import WidgetInputText from '@/components/stepforms/WidgetInputText.vue';
import WidgetMultiInputText from './WidgetMultiInputText.vue';
import { FilterSimpleCondition } from '@/lib/steps';
import { VueConstructor } from 'vue';

type LiteralOperator =
  | 'equal'
  | 'not equal'
  | 'be greater than'
  | 'be greater than or equal to'
  | 'be less than'
  | 'be less than or equal to'
  | 'be among'
  | 'not be among';

type ShortOperator = FilterSimpleCondition['operator'];

type OperatorOption = {
  operator: ShortOperator;
  label: LiteralOperator;
  inputWidget: VueConstructor<Vue>;
};

@Component({
  name: 'widget-filter-simple-condition',
  components: {
    WidgetAutocomplete,
    WidgetInputText,
  },
})
export default class WidgetFilterSimpleCondition extends Vue {
  @Prop({
    type: Object,
    default: () => ({ column: '', value: '', operator: 'eq' }),
  })
  value!: FilterSimpleCondition;

  @Getter columnNames!: string[];

  @Mutation setSelectedColumns!: MutationCallbacks['setSelectedColumns'];

  editedValue: FilterSimpleCondition = { ...this.value };

  readonly operators: OperatorOption[] = [
    { operator: 'eq', label: 'equal', inputWidget: WidgetInputText },
    { operator: 'ne', label: 'not equal', inputWidget: WidgetInputText },
    { operator: 'gt', label: 'be greater than', inputWidget: WidgetInputText },
    { operator: 'ge', label: 'be greater than or equal to', inputWidget: WidgetInputText },
    { operator: 'lt', label: 'be less than', inputWidget: WidgetInputText },
    { operator: 'le', label: 'be less than or equal to', inputWidget: WidgetInputText },
    { operator: 'in', label: 'be among', inputWidget: WidgetMultiInputText },
    { operator: 'nin', label: 'not be among', inputWidget: WidgetMultiInputText },
  ];

  readonly placeholder = 'Enter a value';

  get operator(): OperatorOption {
    return this.operators.filter(d => d.operator === this.editedValue.operator)[0];
  }

  get inputWidget(): VueConstructor<Vue> {
    return this.operators.filter(d => d.operator === this.editedValue.operator)[0].inputWidget;
  }

  updateStepOperator(op: OperatorOption) {
    this.editedValue.operator = op.operator;
    if (this.editedValue.operator === 'in' || this.editedValue.operator === 'nin') {
      this.editedValue.value = [];
    } else {
      this.editedValue.value = '';
    }
  }

  @Watch('editedValue', { deep: true })
  updateValue(newValue: FilterSimpleCondition) {
    this.$emit('input', newValue);
  }
}
</script>
<style lang="scss" scoped>
.filter-form-single-condition__container {
  display: flex;
  width: 100%;
}

.filter-form-single-condition__container .widget-autocomplete__container {
  margin-right: 10px;
}

.filter-form-single-condition__container .widget-input-text__container {
  margin-top: 20px;
}

.filter-form-single-condition__container .widget-multiinnputtext__container {
  margin-top: 20px;
}
</style>

