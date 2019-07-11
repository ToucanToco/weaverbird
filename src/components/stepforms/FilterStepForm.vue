<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <div class="filter-form-headers__container">
      <div class="filter-form-header">Values in...</div>
      <div class="filter-form-header">Must...</div>
    </div>
    <WidgetList
      addFieldName="Add condition"
      id="filterConditions"
      v-model="conditions"
      :defaultItem="defaultCondition"
      :widget="widgetFilterSimpleCondition"
      :automatic-new-field="false"
    ></WidgetList>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { StepFormComponent } from '@/components/formlib';
import WidgetFilterSimpleCondition from '@/components/stepforms/WidgetFilterSimpleCondition.vue';
import WidgetList from './WidgetList.vue';
import BaseStepForm from './StepForm.vue';
import { FilterStep, FilterComboAnd } from '@/lib/steps';
import { FilterSimpleCondition } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'filter',
  name: 'filter-step-form',
  components: {
    WidgetFilterSimpleCondition,
    WidgetList,
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

  readonly title: string = 'Filter';
  condition = this.initialStepValue.condition as FilterComboAnd;
  editedStep = { name: 'filter' as 'filter', condition: { ...this.condition } };
  widgetFilterSimpleCondition = WidgetFilterSimpleCondition;

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