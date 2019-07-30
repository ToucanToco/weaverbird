<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <div class="filter-form-headers__container">
      <div class="filter-form-header">Values in...</div>
      <div class="filter-form-header">Must...</div>
    </div>
    <ListWidget
      addFieldName="Add condition"
      id="filterConditions"
      v-model="conditions"
      :defaultItem="defaultCondition"
      :widget="widgetFilterSimpleCondition"
      :automatic-new-field="false"
    ></ListWidget>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { Getter } from 'vuex-class';
import { StepFormComponent } from '@/components/formlib';
import FilterSimpleConditionWidget from '@/components/stepforms/widgets/FilterSimpleCondition.vue';
import ListWidget from './widgets/List.vue';
import BaseStepForm from './StepForm.vue';
import { FilterStep, FilterComboAnd } from '@/lib/steps';
import { FilterSimpleCondition } from '@/lib/steps';
import { DataSetColumn } from '@/lib/dataset';
import { castFromString } from '@/lib/helpers';

@StepFormComponent({
  vqbstep: 'filter',
  name: 'filter-step-form',
  components: {
    FilterSimpleConditionWidget,
    ListWidget,
  },
})
export default class FilterStepForm extends BaseStepForm<FilterStep> {
  @Prop({
    type: Object,
    default: () => ({
      name: 'filter',
      condition: { and: [{ column: '', value: '', operator: 'eq' }] },
    }),
  })
  initialStepValue!: FilterStep;

  @Getter columnHeaders!: DataSetColumn[];

  readonly title: string = 'Filter';
  condition = this.initialStepValue.condition as FilterComboAnd;
  editedStep = { name: 'filter' as 'filter', condition: { ...this.condition } };
  widgetFilterSimpleCondition = FilterSimpleConditionWidget;

  get defaultCondition() {
    const cond: FilterSimpleCondition = { column: '', value: '', operator: 'eq' };
    return cond;
  }

  get conditions() {
    if (this.editedStep.condition.and.length) {
      return this.editedStep.condition.and;
    } else {
      return [this.defaultCondition];
    }
  }

  set conditions(newval) {
    this.editedStep.condition.and = [...newval];
  }

  submit() {
    for (const cond of this.editedStep.condition.and as FilterSimpleCondition[]) {
      const type = this.columnHeaders.filter(h => h.name === cond.column)[0].type;
      if (type !== undefined) {
        if (Array.isArray(cond.value)) {
          cond.value = cond.value.map(v => castFromString(v, type));
        } else {
          cond.value = castFromString(cond.value, type);
        }
      }
    }
    this.$$super.submit();
  }
}
</script>
<style lang="scss" scoped>
.filter-form-headers__container {
  display: flex;
  width: 66%;
}

.filter-form-header {
  font-size: 14px;
  margin-left: 10px;
  width: 50%;
}
</style>