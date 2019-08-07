<template>
  <div class="filter-form-simple-condition__container">
    <div class="filter-form-simple-condition-column-input">
      <AutocompleteWidget
        id="columnInput"
        v-model="editedValue.column"
        :options="columnNames"
        @input="setSelectedColumns({ column: editedValue.column })"
        placeholder="Column"
      ></AutocompleteWidget>
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
      ></AutocompleteWidget>
    </div>
    <component :is="inputWidget" v-model="editedValue.value" :placeholder="placeholder"></component>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Getter, Mutation } from 'vuex-class';
import { MutationCallbacks } from '@/store/mutations';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import MultiInputTextWidget from './MultiInputText.vue';
import { FilterSimpleCondition } from '@/lib/steps';
import { VueConstructor } from 'vue';

type LiteralOperator =
  | 'equal'
  | 'not equal'
  | 'be greater than'
  | 'be greater than or equal to'
  | 'be less than'
  | 'be less than or equal to'
  | 'be one of'
  | 'not be one of';

type ShortOperator = FilterSimpleCondition['operator'];

type OperatorOption = {
  operator: ShortOperator;
  label: LiteralOperator;
  inputWidget: VueConstructor<Vue>;
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

  @Getter columnNames!: string[];

  @Mutation setSelectedColumns!: MutationCallbacks['setSelectedColumns'];

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
.filter-form-simple-condition__container {
  background-color: white;
  display: flex;
  min-height: 45px;
  width: 100%;
}

.filter-form-simple-condition-column-input {
  margin-left: 10px;
  margin-right: 10px;
  width: 33%;
}

.filter-form-simple-condition-operator-input {
  margin-right: 10px;
  width: 33%;
}

.filter-form-simple-condition__container .widget-input-text__container {
  margin-bottom: 0px;
  margin-right: 10px;
  width: 33%;
}

.filter-form-simple-condition__container .widget-multiinputtext__container {
  margin-bottom: 0px;
  margin-right: 10px;
  width: 33%;
}
</style>

