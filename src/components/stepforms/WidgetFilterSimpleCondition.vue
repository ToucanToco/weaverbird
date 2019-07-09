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
      :value="getShortOperator(editedValue.operator)"
      @input="updateStepOperator"
      name="Must..."
      :options="operators"
      placeholder="Filter operator"
    ></WidgetAutocomplete>
    <WidgetInputText id="valueInput" v-model="editedValue.value" placeholder="Value"></WidgetInputText>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Getter, Mutation } from 'vuex-class';
import { MutationCallbacks } from '@/store/mutations';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import WidgetInputText from '@/components/stepforms/WidgetInputText.vue';
import { FilterSimpleCondition } from '@/lib/steps';

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

const OPERATORS = {
  equal: 'eq',
  'not equal': 'ne',
  'be greater than': 'gt',
  'be greater than or equal to': 'ge',
  'be less than': 'lt',
  'be less than or equal to': 'le',
  'be among': 'in',
  'not be among': 'nin',
};

const OPERATORS_REV = {
  eq: 'equal',
  ne: 'not equal',
  gt: 'be greater than',
  ge: 'be greater than or equal to',
  lt: 'be less than',
  le: 'be less than or equal to',
  in: 'be among',
  nin: 'not be among',
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

  readonly operators = [
    'equal',
    'not equal',
    'be greater than',
    'be greater than or equal to',
    'be less than',
    'be less than or equal to',
    'be among',
    'not be among',
  ];

  getShortOperator(op: ShortOperator) {
    return OPERATORS_REV[op];
  }

  updateStepOperator(op: LiteralOperator) {
    this.editedValue.operator = OPERATORS[op] as ShortOperator;
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
</style>

